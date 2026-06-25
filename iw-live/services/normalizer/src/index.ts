/**
 * Normalizer Service - 8-Stage Pipeline (KT Note §7)
 *
 * This service implements the mandatory 8-stage normalization pipeline that ALL data
 * must pass through before becoming canonical truth in the Spine.
 *
 * KT NOTE: "Every source, every time, must pass through the same core data plane"
 *
 * THE 8 STAGES:
 *
 * S1. ANALYZE  - Detect entity type, resolve tenant schema, fingerprint data
 * S2. CLASSIFY - Assign category, priority, sensitivity level
 * S3. FILTER   - Tenant/schema filtering, idempotency checks, data age validation
 * S4. REFINE   - Normalize field names, split composites, extract cross-ref IDs
 * S5. EXTRACT  - Map to canonical schema, prune non-allowed fields
 * S6. VALIDATE - Required field checks, type validation, integrity rules
 * S7. SANITY   - Anomaly detection, business rule validation (score ≥ 70 required)
 * S8. SECTORIZE- Route to correct Spine table, write truth, enqueue downstream
 *
 * ADAPTIVE SPINE COMPLIANCE:
 * - All writes use only entity types from tenant_spine_config
 * - Canonical fields restricted by schema + Depth Matrix
 * - Schema resolution happens at S1 and flows through all stages
 *
 * FAILURE HANDLING:
 * - Stage failures: 3 retries with exponential backoff
 * - Max retries: Message sent to DLQ_QUEUE with full context
 * - DLQ: Structured error logging to normalization_errors table
 *
 * DOWNSTREAM ENQUEUES:
 * - KNOWLEDGE_QUEUE: Unstructured content for embedding (Flow B)
 * - ACCELERATOR_QUEUE: Pre-computed metrics and aggregations
 * - INTELLIGENCE_QUEUE: Signal processing for Think service
 * - SIGNAL_QUEUE: Real-time signal broadcast (optional)
 */

import {
  resolveTenantAdaptiveSchema,
  getAllowedFieldSetForEntity,
  pruneRecordToResolvedSchema,
  type ResolvedAdaptiveSchema,
  validateEntityType,
  resolveEntityTypeAlias,
  getFieldPolicy,
  type EntityFieldPolicy,
} from "@integratewise/types";

import type { QuarantineReasonCode, RecordIdentity } from "@integratewise/types";

// NEW: Schema Accessor for S3, S5, S6 stages
import {
  SchemaAccessor,
  createSchemaAccessor,
  type ResolvedSchema,
  type ValidationError,
} from "@integratewise/types";
export interface Env {
  PIPELINE_QUEUE: Queue;
  KNOWLEDGE_QUEUE: Queue;
  ACCELERATOR_QUEUE: Queue;
  INTELLIGENCE_QUEUE: Queue;
  SIGNAL_QUEUE?: Queue;
  DLQ_QUEUE: Queue;
  SPINE: Fetcher;
  BFF?: Fetcher; // For real-time UI broadcast via WebSocket
  D1?: D1Database;
  SIGNAL_CACHE?: KVNamespace;
  METRICS?: KVNamespace;
  /** Schema cache KV namespace */
  SCHEMA_CACHE?: KVNamespace;
  // Legacy Supabase — D1 preferred (DECISION 22). Made optional for desupabase completion.
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ENABLE_SIGNALS?: string;
  OPENROUTER_API_KEY?: string;
}

type Stage =
  | "analyze"
  | "classify"
  | "filter"
  | "refine"
  | "extract"
  | "validate"
  | "sanity"
  | "sectorize";

const STAGES: Stage[] = [
  "analyze",
  "classify",
  "filter",
  "refine",
  "extract",
  "validate",
  "sanity",
  "sectorize",
];

/**
 * Internal pipeline message used across all 8 stages.
 *
 * Structurally compatible with `PipelineQueueMessage` from the versioned
 * contract (`@integratewise/types/pipeline-contracts`), but with looser
 * payload/metadata types to accommodate the internal `_` prefixed fields
 * that stages attach as the record moves through the pipeline.
 *
 * `message_version` flows through from the original queue message so it
 * is preserved when re-enqueuing between stages.
 */
interface PipelineMessage {
  /** Message schema version — preserved from incoming PipelineQueueMessage */
  message_version?: number;
  stage: Stage;
  tenant_id: string;
  source: string;
  source_type: string;
  payload: Record<string, any>;
  metadata: {
    trace_id: string;
    attempt: number;
    received_at: string;
    /** When the record was extracted from the provider (from PipelineQueueMessage) */
    extracted_at?: string;
    /** Loader job ID */
    loader_job_id?: string;
    /** Sync phase (creamy/delta/full) */
    phase?: string;
    /** When the sync happened */
    synced_at?: string;
    /** Record identity for dedup (from PipelineQueueMessage) */
    identity?: RecordIdentity;
  };
}

/** Resolved schema cache keyed by tenant */
const schemaCache = new Map<string, { schema: ResolvedSchema; expires: number }>();

function readResolvedSchema(payload: Record<string, any>): ResolvedAdaptiveSchema | null {
  const raw = payload?._resolved_schema;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as ResolvedAdaptiveSchema;
}

/** Read the NEW schema format from payload (schema-driven architecture) */
function readSchema(payload: Record<string, any>): ResolvedSchema | null {
  const raw = payload?._schema;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as ResolvedSchema;
}

function stripInternalPayload(payload: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !key.startsWith("_") || key === "_lineage")
  );
}

/**
 * Write a record to the pipeline_quarantine table instead of silently dropping.
 * Non-blocking — failures are logged but don't interrupt the pipeline.
 */
async function writeQuarantine(
  env: Env,
  msg: PipelineMessage,
  stage: "S3_filter" | "S5_extract" | "S6_validate" | "S7_sanity" | "S8_sectorize",
  reasonCode: QuarantineReasonCode,
  reasonDetail?: string
): Promise<void> {
  try {
    if (!env.D1) {
      console.warn(`[Normalizer] D1 not configured, quarantine write skipped.`);
      return;
    }
    await env.D1.prepare(
      `INSERT INTO pipeline_quarantine (
        id, tenant_id, provider, entity_type, source_id, stage, reason_code, reason_detail, payload, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        crypto.randomUUID(),
        msg.tenant_id,
        msg.source || "unknown",
        msg.payload._entity_type || msg.payload.type || null,
        msg.payload.id || msg.payload.source_id || msg.payload.external_id || null,
        stage,
        reasonCode,
        reasonDetail || null,
        JSON.stringify(stripInternalPayload(msg.payload)),
        JSON.stringify({
          trace_id: msg.metadata.trace_id,
          attempt: msg.metadata.attempt,
          source_type: msg.source_type,
        })
      )
      .run();
  } catch (err) {
    // Quarantine write failure must never block the pipeline
    console.warn(
      `[Normalizer] Quarantine write failed for ${stage}/${reasonCode}:`,
      err instanceof Error ? err.message : err
    );
  }
}

/** Get or create schema accessor for environment */
function getSchemaAccessor(env: Env): SchemaAccessor {
  return createSchemaAccessor({
    KV_CACHE: env.SCHEMA_CACHE,
  });
}

/** Resolve schema for tenant (with caching) */
async function resolveSchemaForTenant(
  env: Env,
  tenantId: string,
  department?: string,
  industry?: string | null
): Promise<ResolvedSchema | null> {
  const cacheKey = `${tenantId}:${department || "unknown"}:${industry || "default"}`;
  const cached = schemaCache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.schema;
  }

  const accessor = getSchemaAccessor(env);

  try {
    // First try to get from KV cache
    let schema: ResolvedSchema | null = null;
    if (env.SCHEMA_CACHE) {
      schema = await accessor.getCachedSchema(tenantId, department || "BIZOPS", industry);
    }

    // If not in cache, resolve from config
    if (!schema) {
      schema = await accessor.resolveSchema(tenantId, department || "BIZOPS", industry);
    }

    // Cache in memory
    schemaCache.set(cacheKey, { schema, expires: Date.now() + 300000 }); // 5 min TTL

    return schema;
  } catch (error) {
    console.error(`[Normalizer] Failed to resolve schema for ${tenantId}:`, error);
    return null;
  }
}

import { identity } from "./identity-resolution-api";
import { SignalAnalyzer } from "@integratewise/types";

export default {
  // HTTP handler for status/monitoring + identity resolution API
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "normalizer" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/api/v1/pipeline/status") {
      return new Response(JSON.stringify({ status: "operational", stages: STAGES }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Identity Resolution API routes
    if (url.pathname.startsWith("/v1/identity/")) {
      return identity.fetch(request, _env);
    }

    return new Response(
      JSON.stringify({
        error: "Not found",
        message: `No pipeline route for ${url.pathname}`,
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  },

  // Queue consumer — this is where pipeline processing happens
  async queue(batch: MessageBatch<PipelineMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const payload = msg.body;
      const startTime = Date.now();

      try {
        const result = await processStage(payload, env);

        if (result === null) {
          // Filtered out (Stage 3)
          msg.ack();
          continue;
        }

        // Advance to next stage
        const currentIdx = STAGES.indexOf(payload.stage);
        const nextIdx = currentIdx + 1;

        if (nextIdx < STAGES.length) {
          await env.PIPELINE_QUEUE.send({
            ...result,
            stage: STAGES[nextIdx],
            metadata: { ...result.metadata, attempt: 0 },
          });
        } else {
          // Final stage complete — write to Spine
          // KT NOTE: Enforce sanity check before Spine write
          if (result.payload._sanity_passed === false) {
            console.warn(
              `[Normalizer] Sanity check failed for ${result.payload._entity_type}, sending to DLQ`,
              {
                flags: result.payload._sanity_flags,
                score: result.payload._sanity_score,
              }
            );
            await writeQuarantine(
              env,
              result,
              "S7_sanity",
              result.payload._sanity_score < 50
                ? "sanity_anomaly_detected"
                : "sanity_low_confidence",
              `Sanity score ${result.payload._sanity_score}/100, flags: ${(result.payload._sanity_flags || []).join(", ")}`
            );
            await env.DLQ_QUEUE.send({
              ...result,
              error: `Sanity check failed: ${result.payload._sanity_flags?.join(", ")}`,
              failed_at: new Date().toISOString(),
            });
          } else {
            // S7.5 IDENTITY RESOLUTION — detect potential duplicates (never auto-merge)
            await detectPotentialDuplicates(result, env);
            await sectorize(result, env);
          }
        }

        // Log success
        await logPipelineStep(env, payload, "completed", Date.now() - startTime);
        msg.ack();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Pipeline ${payload.stage} failed:`, errMsg);

        // Log failure
        await logPipelineStep(env, payload, "failed", Date.now() - startTime, errMsg);

        if (payload.metadata.attempt < 3) {
          msg.retry({ delaySeconds: 30 * (payload.metadata.attempt + 1) });
        } else {
          // Max retries — send to DLQ
          await env.DLQ_QUEUE.send({
            ...payload,
            error: errMsg,
            failed_at: new Date().toISOString(),
          });
          msg.ack();
        }
      }
    }
  },
};

async function processStage(msg: PipelineMessage, env: Env): Promise<PipelineMessage | null> {
  switch (msg.stage) {
    case "analyze": {
      // Stage 1: Detect source, identify object type, extract metadata
      const entityType = detectEntityType(msg.payload);

      // Resolve both old and new schema formats for compatibility
      const resolvedSchema = await resolveTenantAdaptiveSchema({
        tenantId: msg.tenant_id,
        db: env.D1,
      });

      // NEW: Resolve schema-driven schema
      const schema = await resolveSchemaForTenant(
        env,
        msg.tenant_id,
        msg.payload._department,
        msg.payload._industry
      );

      return {
        ...msg,
        payload: {
          ...msg.payload,
          _entity_type: entityType,
          _analyzed_at: Date.now(),
          ...(resolvedSchema ? { _resolved_schema: resolvedSchema } : {}),
          ...(schema ? { _schema: schema } : {}),
        },
      };
    }

    case "classify": {
      // Stage 2: Assign category, priority
      const classifiedType = resolveEntityTypeAlias(msg.payload._entity_type || "");
      const priority = classifiedType === "opportunity" ? "high" : "normal";
      return {
        ...msg,
        payload: { ...msg.payload, _priority: priority, _classified_at: Date.now() },
      };
    }

    case "filter": {
      // S3 FILTER: Drop if entity_type not in tenant's schema
      const entityType = msg.payload._entity_type || msg.payload.type || "unknown";

      // Try NEW schema first (schema-driven architecture)
      const schema = readSchema(msg.payload);
      if (schema) {
        const accessor = getSchemaAccessor(env);
        const isAllowed = accessor.filterEntityType(schema, entityType);
        if (!isAllowed) {
          console.log(
            `[Normalizer:S3] Filtered — entity_type "${entityType}" not in schema for tenant ${msg.tenant_id}`
          );
          await writeQuarantine(
            env,
            msg,
            "S3_filter",
            "schema_entity_type_not_allowed",
            `Entity type "${entityType}" not in tenant schema`
          );
          return null;
        }
      }
      // Fall back to legacy adaptive schema
      else {
        const resolvedSchema = readResolvedSchema(msg.payload);
        const allowedTypes = resolvedSchema?.allowedEntityTypes?.length
          ? new Set<string>(resolvedSchema.allowedEntityTypes)
          : null;
        if (allowedTypes && !allowedTypes.has(entityType)) {
          console.log(
            `[Normalizer:S3] Filtered (legacy) — entity_type "${entityType}" not in allowed types`
          );
          await writeQuarantine(
            env,
            msg,
            "S3_filter",
            "schema_entity_type_not_allowed",
            `Entity type "${entityType}" not in legacy allowed types`
          );
          return null;
        }
      }

      // Scope enforcement, freshness check
      const dataAge = msg.payload.updated_at
        ? Date.now() - new Date(msg.payload.updated_at).getTime()
        : 0;
      if (
        dataAge > 90 * 24 * 60 * 60 * 1000 &&
        !["account", "contact"].includes(msg.payload._entity_type)
      ) {
        console.log(
          `[Normalizer:S3] Filtered — data too old (${Math.round(dataAge / 86400000)} days)`
        );
        await writeQuarantine(
          env,
          msg,
          "S3_filter",
          "stale_record",
          `Data age ${Math.round(dataAge / 86400000)} days exceeds 90-day limit`
        );
        return null;
      }

      return {
        ...msg,
        payload: { ...msg.payload, _filtered_at: Date.now() },
      };
    }

    case "refine": {
      // Stage 4: Normalize field names, currency conversion, field mapping
      const normalized = normalizeFields(msg.payload, msg.source);

      // Apply canonical field mapping from EntityFieldPolicy
      const entityTypeForRefine = normalized._entity_type || normalized.type || "";
      const fieldPolicy = getFieldPolicy(entityTypeForRefine);
      const canonicallyMapped = applyCanonicalMapping(normalized, fieldPolicy, msg.source);

      return { ...msg, payload: canonicallyMapped };
    }

    case "extract": {
      // S5 EXTRACT: Extract only priority fields defined in schema
      const entityType = msg.payload._entity_type || msg.payload.type || "";

      // Try NEW schema first
      const schema = readSchema(msg.payload);
      if (schema && entityType) {
        const accessor = getSchemaAccessor(env);
        const priorityFields = accessor.extractFields(schema, entityType);

        if (priorityFields.length > 0) {
          // Merge with field policy allowed_fields for completeness
          const policy = getFieldPolicy(entityType);
          const allAllowed = new Set([
            ...priorityFields,
            ...(policy.allowed_fields.length > 0 ? policy.allowed_fields : []),
          ]);

          const extracted: Record<string, any> = {};
          const droppedFields: string[] = [];

          for (const [key, value] of Object.entries(msg.payload)) {
            if (key.startsWith("_")) {
              // Keep internal fields
              extracted[key] = value;
            } else if (allAllowed.has(key)) {
              extracted[key] = value;
            } else {
              droppedFields.push(key);
            }
          }

          if (droppedFields.length > 0) {
            extracted._schema_pruned_fields = droppedFields;
            console.log(
              `[Normalizer:S5] Pruned ${droppedFields.length} fields for ${entityType}: ${droppedFields.join(", ")}`
            );
          }

          return { ...msg, payload: extracted };
        }
      }

      // Fall back to legacy adaptive schema
      const resolvedSchema = readResolvedSchema(msg.payload);
      const allowedFields = getAllowedFieldSetForEntity(resolvedSchema, entityType);
      if (allowedFields) {
        const { record, droppedFields } = pruneRecordToResolvedSchema(msg.payload, allowedFields);
        const nextPayload: Record<string, any> = {
          ...record,
          ...(resolvedSchema ? { _resolved_schema: resolvedSchema } : {}),
          ...(schema ? { _schema: schema } : {}),
        };
        if (droppedFields.length > 0) {
          nextPayload._schema_pruned_fields = droppedFields;
        }
        return { ...msg, payload: nextPayload };
      }

      // Final fallback: use EntityFieldPolicy for pruning (no schema resolved)
      if (entityType) {
        const policy = getFieldPolicy(entityType);
        if (policy.allowed_fields.length > 0) {
          const allowedSet = new Set(policy.allowed_fields);
          const extracted: Record<string, any> = {};
          const droppedFields: string[] = [];

          for (const [key, value] of Object.entries(msg.payload)) {
            if (key.startsWith("_")) {
              extracted[key] = value;
            } else if (allowedSet.has(key)) {
              extracted[key] = value;
            } else {
              droppedFields.push(key);
            }
          }

          if (droppedFields.length > 0) {
            extracted._schema_pruned_fields = droppedFields;
            console.log(
              `[Normalizer:S5] Field policy pruned ${droppedFields.length} fields for ${entityType}: ${droppedFields.join(", ")}`
            );
          }

          return { ...msg, payload: extracted };
        }
      }

      // Send to Knowledge for embeddings
      if (env.KNOWLEDGE_QUEUE) {
        const textParts = [
          msg.payload.name || msg.payload.title || msg.payload.email,
          msg.payload.description || msg.payload.body,
        ].filter(Boolean);
        const content = textParts.length
          ? textParts.join("\n").slice(0, 10000)
          : JSON.stringify({
              entity_type: entityType,
              source: msg.source,
            });
        env.KNOWLEDGE_QUEUE.send({
          tenant_id: msg.tenant_id,
          source_type: "pipeline_extract",
          source_name: msg.source || "normalizer",
          content,
          correlation_id: msg.metadata.trace_id || crypto.randomUUID(),
        }).catch((err) =>
          console.warn(`[Normalizer:S5] Knowledge queue send failed (non-fatal): ${err?.message}`)
        );
      }

      return msg;
    }

    case "validate": {
      // S6 VALIDATE: Validate field values against expected types + field policies
      const entityType = msg.payload._entity_type || msg.payload.type || "unknown";
      const schema = readSchema(msg.payload);
      const allValidationErrors: ValidationError[] = [];

      // Path 1: Schema-driven validation
      if (schema) {
        const accessor = getSchemaAccessor(env);
        const priorityFields = accessor.extractFields(schema, entityType);
        for (const field of priorityFields) {
          const value = msg.payload[field];
          const error = accessor.validateField(field, value);
          if (error) {
            allValidationErrors.push({ ...error, entity_type: entityType });
          }
        }
      }

      // Path 2: Field policy required-field validation (always runs)
      const policy = getFieldPolicy(entityType);
      const missingRequired: string[] = [];
      for (const field of policy.required_fields) {
        const value = msg.payload[field];
        if (value === undefined || value === null || value === "") {
          missingRequired.push(field);
        }
      }

      if (missingRequired.length > 0) {
        for (const field of missingRequired) {
          allValidationErrors.push({
            field,
            error: `Required field "${field}" is missing or empty`,
            severity: "error" as const,
            entity_type: entityType,
          });
        }
        console.log(
          `[Normalizer:S6] Missing required fields for ${entityType}: ${missingRequired.join(", ")}`
        );
      }

      if (allValidationErrors.length > 0) {
        const hasErrors = allValidationErrors.some((e) => e.severity === "error");

        // Quarantine records with hard validation errors
        if (hasErrors) {
          await writeQuarantine(
            env,
            msg,
            "S6_validate",
            "schema_field_missing_required",
            `Validation errors: ${allValidationErrors
              .filter((e) => e.severity === "error")
              .map((e) => `${e.field}: ${e.error}`)
              .join("; ")}`
          );
        }

        return {
          ...msg,
          payload: {
            ...msg.payload,
            _validation_errors: allValidationErrors,
            _validation_passed: !hasErrors,
          },
        };
      }

      return {
        ...msg,
        payload: { ...msg.payload, _validated_at: Date.now(), _validation_passed: true },
      };
    }

    case "sanity": {
      // Stage 7: Anomaly detection and business sanity checks
      // KT NOTE: Data quality enforcement before Spine write
      const sanityFlags: string[] = [];
      const sanityScore = 100;

      const entityType = msg.payload._entity_type || "unknown";
      const data = msg.payload;

      // Rule-based sanity checks
      // Check 1: Value range anomalies for financial entities
      if (entityType === "deal" || entityType === "opportunity") {
        const amount = data.amount || data.value || data.arr;
        if (amount !== undefined) {
          if (amount < 0) sanityFlags.push("negative_amount");
          if (amount > 10_000_000) sanityFlags.push("unusually_large_amount");
          if (amount === 0) sanityFlags.push("zero_amount");
        }

        // Check probability vs stage consistency
        const probability = data.probability || data.probability_score;
        const stage = data.stage || data.pipeline_stage;
        if (probability !== undefined && stage) {
          const closedWon = typeof stage === "string" && stage.toLowerCase().includes("closed won");
          const closedLost =
            typeof stage === "string" && stage.toLowerCase().includes("closed lost");
          if (closedWon && probability < 90) sanityFlags.push("won_low_probability");
          if (closedLost && probability > 10) sanityFlags.push("lost_high_probability");
        }
      }

      // Check 2: Date sanity
      const dateFields = ["close_date", "renewal_date", "created_at", "updated_at"];
      const now = new Date();
      for (const field of dateFields) {
        const dateVal = data[field] || data[`${field}_at`];
        if (dateVal) {
          const date = new Date(dateVal);
          if (isNaN(date.getTime())) {
            sanityFlags.push(`invalid_date:${field}`);
          } else if (date > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
            sanityFlags.push(`future_date_far:${field}`);
          } else if (date < new Date("2000-01-01")) {
            sanityFlags.push(`date_too_old:${field}`);
          }
        }
      }

      // Check 3: Required field combinations
      if (entityType === "contact") {
        if (!data.email && !data.phone) {
          sanityFlags.push("no_contact_method");
        }
      }

      // Check 4: Health score range
      const healthScore = data.health_score;
      if (healthScore !== undefined) {
        if (healthScore < 0 || healthScore > 100) {
          sanityFlags.push("health_score_out_of_range");
        }
      }

      // Check 5: High-value entity AI-powered sanity check via OpenRouter
      const isHighValue =
        (data.amount || data.value || data.arr || 0) > 100_000 ||
        data.priority === "high" ||
        data.priority === "urgent" ||
        data.band === "critical" ||
        data.severity === "critical";

      let aiConfidence: number | null = null;
      if (isHighValue && env.OPENROUTER_API_KEY) {
        try {
          const aiResult = await callOpenRouterSanityCheck(
            env.OPENROUTER_API_KEY,
            entityType,
            data
          );
          aiConfidence = aiResult.confidence;
          if (aiResult.anomalies && aiResult.anomalies.length > 0) {
            for (const anomaly of aiResult.anomalies) {
              sanityFlags.push(`ai:${anomaly}`);
            }
          }
          if (aiResult.confidence < 70) {
            sanityFlags.push("ai_low_confidence");
          }
        } catch (aiErr) {
          console.warn(`[Normalizer:S7] OpenRouter AI sanity check failed (non-fatal):`, aiErr);
          sanityFlags.push("ai_check_unavailable");
        }
      }

      // Calculate final sanity score
      let finalScore = Math.max(0, sanityScore - sanityFlags.length * 10);
      if (aiConfidence !== null && aiConfidence < 50) {
        finalScore = Math.min(finalScore, aiConfidence);
      }

      return {
        ...msg,
        payload: {
          ...msg.payload,
          _sanity_checked_at: Date.now(),
          _sanity_score: finalScore,
          _sanity_flags: sanityFlags,
          _sanity_passed: finalScore >= 70, // Require 70+ score to pass
        },
      };
    }

    case "sectorize": {
      // Stage 8: Handled by sectorize() function after this returns
      return msg;
    }

    default:
      throw new Error(`Unknown stage: ${msg.stage}`);
  }
}

// ── S7.5 Identity Resolution — Detect potential duplicates (never auto-merge) ──
// Generates a signature from the entity's identifying fields, queries for matches
// in the same tenant + entity type. If matches found, creates a merge_candidate
// record for HITL review. The entity is ALWAYS written to Spine as a separate record.
async function detectPotentialDuplicates(msg: PipelineMessage, env: Env): Promise<void> {
  const payload = msg.payload;
  const tenantId = msg.tenant_id;
  const entityType = payload._entity_type || payload.entity_type;

  if (!entityType || !tenantId) return;

  // Only run identity resolution for entity types that can have cross-source duplicates
  const IDENTITY_ENTITY_TYPES = new Set([
    "account",
    "contact",
    "lead",
    "opportunity",
    "vendor",
    "student",
    "account_master",
    "people_team",
  ]);
  if (!IDENTITY_ENTITY_TYPES.has(entityType)) return;

  try {
    // Generate signature from identifying fields
    const email = normalizeForMatch(payload.email || payload.primary_contact_email);
    const name = normalizeForMatch(payload.name || payload.account_name || payload.full_name);
    const domain = extractDomainFromEmail(email);
    const phone = normalizePhone(payload.phone || payload.primary_phone);
    const sourceSystem = payload._source_system || payload.source_system || "unknown";
    const externalId = payload._external_id || payload.external_id || payload.id;

    // Build signature parts
    const sigParts: string[] = [entityType];
    if (email) sigParts.push(`e:${email}`);
    if (domain) sigParts.push(`d:${domain}`);
    if (phone) sigParts.push(`p:${phone}`);
    if (name) sigParts.push(`n:${name}`);

    if (sigParts.length <= 1) return; // No identifying fields — skip

    const signature = sigParts.sort().join("|");

    // Check D1 for existing entities with matching signature
    if (!env.D1) return;

    // Register this entity's signature
    try {
      await (env.D1 as D1Database)
        .prepare(
          `INSERT OR IGNORE INTO entity_signatures (tenant_id, entity_type, source_system, external_id, signature, email, domain, name, phone, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        )
        .bind(
          tenantId,
          entityType,
          sourceSystem,
          externalId || "",
          signature,
          email || "",
          domain || "",
          name || "",
          phone || ""
        )
        .run();
    } catch {
      // Table may not exist yet — skip silently
      return;
    }

    // Query for potential matches (different source, same signature components)
    const matches = await (env.D1 as D1Database)
      .prepare(
        `SELECT source_system, external_id, email, domain, name, phone, signature
       FROM entity_signatures
       WHERE tenant_id = ? AND entity_type = ? AND source_system != ?
         AND (
           (email != '' AND email = ?)
           OR (domain != '' AND domain = ?)
           OR (signature = ?)
         )
       LIMIT 5`
      )
      .bind(tenantId, entityType, sourceSystem, email || "", domain || "", signature)
      .all();

    if (!matches.results || matches.results.length === 0) return;

    // Calculate confidence for each match
    for (const match of matches.results) {
      let confidence = 0;
      const matchedFields: string[] = [];

      if (email && match.email === email) {
        confidence += 0.4;
        matchedFields.push("email");
      }
      if (domain && match.domain === domain) {
        confidence += 0.3;
        matchedFields.push("domain");
      }
      if (phone && match.phone === phone) {
        confidence += 0.2;
        matchedFields.push("phone");
      }
      if (name && match.name === name) {
        confidence += 0.1;
        matchedFields.push("name");
      }

      if (confidence < 0.7) continue; // Below threshold

      // Create merge candidate — queue for HITL review
      try {
        await (env.D1 as D1Database)
          .prepare(
            `INSERT OR IGNORE INTO merge_candidates
           (tenant_id, entity_type, source_a, external_id_a, source_b, external_id_b, confidence, matched_fields, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
          )
          .bind(
            tenantId,
            entityType,
            sourceSystem,
            externalId || "",
            match.source_system as string,
            match.external_id as string,
            confidence,
            matchedFields.join(",")
          )
          .run();
      } catch {
        // Ignore duplicate candidates
      }
    }
  } catch (err) {
    // Identity resolution is non-blocking — log and continue
    console.warn(
      `[S7.5 Identity] Error for ${entityType}:`,
      err instanceof Error ? err.message : err
    );
  }
}

function normalizeForMatch(value: any): string {
  if (!value || typeof value !== "string") return "";
  return value.toLowerCase().trim();
}

function extractDomainFromEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const domain = email.split("@")[1];
  const generic = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"]);
  return generic.has(domain) ? "" : domain;
}

function normalizePhone(value: any): string {
  if (!value || typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-10) : "";
}

async function sectorize(msg: PipelineMessage, env: Env): Promise<void> {
  const startedAt = Date.now();
  const traceId = msg.metadata.trace_id || crypto.randomUUID();
  const spinePayload = stripInternalPayload(msg.payload);

  // Resolve entity_type through canonical alias map before Spine write
  const rawEntityType = msg.payload._entity_type || msg.payload.type || "unknown";
  const { resolved: canonicalType, isCanonical } = validateEntityType(rawEntityType);
  if (!isCanonical) {
    console.warn(
      `[Normalizer:S8] Non-canonical entity_type "${rawEntityType}" → "${canonicalType}" for tenant ${msg.tenant_id}. Writing anyway for backward compat.`
    );
  }

  // Build entity objects for Spine write — using CANONICAL entity_type
  const entities = [
    {
      entity_type: canonicalType,
      name: spinePayload.name || spinePayload.title || spinePayload.email || "Unnamed",
      source: msg.source,
      source_id: spinePayload.id || spinePayload.source_id || crypto.randomUUID(),
      data: spinePayload,
    },
  ];

  // Write to Spine via the routed endpoint — entity_type determines schema.table
  const entityType = entities[0]?.entity_type || "activity";

  let writeResponse;

  if ((env as any).MCP) {
    writeResponse = await (env as any).MCP.fetch("http://internal/invoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "spine.write",
        arguments: {
          tenant_id: msg.tenant_id,
          entity_type: canonicalType,
          entity_id: entities[0].source_id,
          payload: entities,
        },
      }),
    });
  } else {
    const spineUrl = `https://spine/v1/spine/${encodeURIComponent(entityType)}`;
    writeResponse = await env.SPINE.fetch(
      new Request(spineUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": msg.tenant_id,
        },
        body: JSON.stringify({
          tenant_id: msg.tenant_id,
          entities,
          trace_id: msg.metadata.trace_id,
        }),
      })
    );
  }

  if (!writeResponse.ok) {
    throw new Error(`Spine write failed: ${writeResponse.status} ${await writeResponse.text()}`);
  }

  // Parse Spine write response to get canonical entity ID
  // CRITICAL: Use the Spine-returned ID from results[0].id, not inferred from payload
  let spineWriteResult: any;
  try {
    spineWriteResult = await writeResponse.json();
  } catch {
    spineWriteResult = null;
  }

  // Spine v2 returns { results: [{ id: "uuid", ... }] } for bulk writes
  // Use canonical ID from Spine response, fallback to payload only for backward compat
  const canonicalSpineId =
    spineWriteResult?.results?.[0]?.id ??
    spineWriteResult?.id ??
    spineWriteResult?.spine_id ??
    spineWriteResult?.entity_id ??
    spinePayload.id ??
    spinePayload.spine_id ??
    spinePayload.source_id ??
    entities[0].source_id;

  const spineId = String(canonicalSpineId);

  if (!spineId || spineId === "undefined" || spineId === "null" || spineId === "undefined") {
    console.error(
      `[sectorize] Failed to extract canonical spine_id. Spine response:`,
      spineWriteResult
    );
    throw new Error(
      `Failed to determine canonical spine_id for entity ${entityType}. Check Spine write response shape.`
    );
  }

  logEvent("spine_write_canonical_id_extracted", {
    trace_id: traceId,
    spine_id: spineId,
    entity_type: entityType,
    source: spineWriteResult?.results?.[0]?.id ? "spine_results_0_id" : "fallback",
  });
  if (env.KNOWLEDGE_QUEUE) {
    const content = [
      spinePayload.name || spinePayload.title || spinePayload.email || "Unnamed",
      entityType,
      msg.source,
    ]
      .filter(Boolean)
      .join(" · ");

    const knowledgeMsg = {
      tenant_id: msg.tenant_id,
      entity_type: entityType,
      entity_id: spineId,
      source_type: "spine_write",
      source_name: msg.source || "normalizer",
      content: content || JSON.stringify({ entity_type: entityType, source: msg.source }),
      correlation_id: traceId,
      // Metadata for retry tracking
      _knowledge_retry_count: 0,
      _knowledge_max_retries: 3,
    };

    try {
      await env.KNOWLEDGE_QUEUE.send(knowledgeMsg);
    } catch (err: any) {
      console.error(`[Normalizer] Knowledge queue send failed: ${err?.message}`);
      // Retry once immediately, then let DLQ handle it
      try {
        await env.KNOWLEDGE_QUEUE.send(
          {
            ...knowledgeMsg,
            _knowledge_retry_count: 1,
          },
          { delaySeconds: 5 }
        );
      } catch (retryErr: any) {
        console.error(`[Normalizer] Knowledge queue retry failed: ${retryErr?.message}`);
        // Send to DLQ for manual inspection
        if (env.DLQ_QUEUE) {
          await env.DLQ_QUEUE.send({
            original_message: knowledgeMsg,
            error: retryErr.message,
            failed_at: new Date().toISOString(),
            queue: "KNOWLEDGE_QUEUE",
            stage: "sectorize",
          });
        }
      }
    }
  }

  const hydrationBucket = resolveHydrationBucket(msg.payload);
  const workspaceId = String(spinePayload.workspace_id || msg.tenant_id);
  const domainSchema = String(spinePayload.domain_schema || msg.payload._entity_type || "general");

  if (isSignalsEnabled(env) && isSignalReadyBucket(hydrationBucket)) {
    await refreshEntity360Entity(env, spineId);
    const entity360 = await readEntity360Projection(
      env,
      msg.tenant_id,
      spineId,
      workspaceId,
      hydrationBucket,
      domainSchema,
      msg.payload
    );

    if (env.D1) {
      await env.D1.prepare(
        "INSERT OR REPLACE INTO entity360_cache (spine_id, workspace_id, payload, expires_at, version) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(
          spineId,
          workspaceId,
          JSON.stringify(entity360),
          Math.floor(Date.now() / 1000) + 300,
          Number(msg.payload.version || 1)
        )
        .run();
    }

    const signalId = crypto.randomUUID();
    const analyzer = new SignalAnalyzer();
    const analysisResult = analyzer.analyze({
      signal_id: signalId,
      tenant_id: msg.tenant_id,
      entity_type: entityType,
      entity_id: spineId,
      hydration_bucket: hydrationBucket,
      entity_data: spinePayload,
      context: {
        signals: entity360?.recent_context || [],
        activities: entity360?.recent_knowledge || [],
      },
    });

    // Normalise to the shape the rest of sectorize() expects
    const analysis = {
      signal_id: analysisResult.signal_id,
      recommended_action: analysisResult.recommended_action?.type ?? "notify_user",
      confidence: analysisResult.analysis.confidence,
      reasoning: [analysisResult.analysis.reasoning],
      requires_approval: analysisResult.requires_approval,
      auto_execute: analysisResult.auto_execute,
    };

    const signal = {
      signal_id: signalId,
      spine_id: spineId,
      workspace_id: workspaceId,
      type: analysis.requires_approval ? "risk_alert" : "entity_matured",
      priority: analysis.confidence > 0.9 ? "high" : "medium",
      confidence: analysis.confidence,
      hydration_bucket: hydrationBucket,
      domain_schema: domainSchema,
      payload: {
        spine_snapshot: spinePayload,
        ai_analysis: analysisResult,
        auto_execute: analysis.auto_execute,
        requires_approval: analysis.requires_approval,
      },
      timestamp: new Date().toISOString(),
    };

    if (env.SIGNAL_QUEUE) {
      await env.SIGNAL_QUEUE.send(signal);
    }

    if (env.SIGNAL_CACHE) {
      await env.SIGNAL_CACHE.put(`signal:${Date.now()}:${signalId}`, JSON.stringify(signal), {
        expirationTtl: 3600,
      });
    }

    logEvent("signal_emitted", {
      trace_id: traceId,
      signal_id: signalId,
      workspace_id: workspaceId,
      spine_id: spineId,
      confidence: analysis.confidence,
      requires_approval: analysis.requires_approval,
      auto_execute: analysis.auto_execute,
      latency_ms: Date.now() - startedAt,
    });
  }

  // Broadcast real-time update to UI via BFF
  await broadcastEntityUpdate(env, {
    tenant_id: msg.tenant_id,
    entity_type: entityType,
    entity_id: spineId,
    change_type: spinePayload.id ? "updated" : "created",
    source: msg.source,
    trace_id: msg.metadata.trace_id,
  });

  // Emit intelligence event for backward compatibility with current L2 consumers.
  await env.INTELLIGENCE_QUEUE.send({
    type: "data_change",
    tenant_id: msg.tenant_id,
    entities,
    source: msg.source,
    trace_id: msg.metadata.trace_id,
    timestamp: new Date().toISOString(),
  });

  // Emit accelerator trigger
  await env.ACCELERATOR_QUEUE.send({
    type: "spine_write",
    tenant_id: msg.tenant_id,
    entity_count: entities.length,
    trace_id: msg.metadata.trace_id,
  });

  if (env.METRICS) {
    await env.METRICS.put("last_pipeline", String(Date.now()), { expirationTtl: 86400 });
  }
}

function isSignalsEnabled(env: Env): boolean {
  return String(env.ENABLE_SIGNALS ?? "true").toLowerCase() === "true";
}

function isSignalReadyBucket(bucket: string): boolean {
  const normalized = bucket.toUpperCase();
  return ["B5", "B6", "B7"].includes(normalized);
}

function resolveHydrationBucket(payload: Record<string, any>): string {
  const raw = String(payload.hydration_bucket || payload.bucket || "B7");
  return raw.toUpperCase();
}

async function refreshEntity360Entity(_env: Env, _spineId: string): Promise<void> {
  // Desupabase: materialized entity refresh is handled via pipeline updates or triggers on D1.
  return Promise.resolve();
}

async function readEntity360Projection(
  env: Env,
  tenantId: string,
  spineId: string,
  workspaceId: string,
  hydrationBucket: string,
  domainSchema: string,
  snapshot: Record<string, any>
): Promise<Record<string, any>> {
  try {
    if (env.D1) {
      // Query recent context extractions from D1
      const contextRes = await env.D1.prepare(
        `SELECT c.* FROM cross_data c
         JOIN link_data l ON (l.source_id = c.id OR l.target_id = c.id)
         WHERE c.type = 'context_extraction' AND c.tenant_id = ? 
           AND (l.source_id = ? OR l.target_id = ?)
         ORDER BY c.created_at DESC LIMIT 10`
      )
        .bind(tenantId, spineId, spineId)
        .all<any>();

      const recentContext = (contextRes.results || []).map((r) => {
        const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
        return {
          id: r.id,
          type: data.type || "document",
          title: r.name || data.title || "Untitled",
          summary: data.summary || "",
          source: r.source_tool || data.source || "unknown",
          created_at: r.created_at,
          relevance: data.relevance || 0.8,
        };
      });

      // Query recent memories/knowledge from D1
      const memoryRes = await env.D1.prepare(
        `SELECT c.* FROM cross_data c
         JOIN link_data l ON (l.source_id = c.id OR l.target_id = c.id)
         WHERE c.type = 'org_memory' AND c.tenant_id = ? 
           AND (l.source_id = ? OR l.target_id = ?)
         ORDER BY c.created_at DESC LIMIT 10`
      )
        .bind(tenantId, spineId, spineId)
        .all<any>();

      const recentKnowledge = (memoryRes.results || []).map((r) => {
        const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
        return {
          id: r.id,
          type: data.memory_type || "insight",
          content: r.name || data.content || "",
          confidence: data.confidence || 0.8,
          source: r.source_tool || data.source || "ai_extracted",
          created_at: r.created_at,
        };
      });

      return {
        spine_id: spineId,
        workspace_id: workspaceId,
        hydration_bucket: hydrationBucket,
        domain_schema: domainSchema,
        recent_context: recentContext,
        recent_knowledge: recentKnowledge,
        payload: snapshot,
      };
    }
  } catch (e) {
    console.warn("[Normalizer] Failed to read D1 Entity360 projection:", e);
  }

  return {
    spine_id: spineId,
    workspace_id: workspaceId,
    hydration_bucket: hydrationBucket,
    domain_schema: domainSchema,
    recent_context: [],
    recent_knowledge: [],
    payload: snapshot,
  };
}

function logEvent(event: string, details: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      service: "normalizer",
      event,
      ...details,
    })
  );
}

/**
 * Detect entity_type from payload fields.
 * ALWAYS resolves through canonical alias map (DOMAIN_SPINE_CONFIG is the source of truth).
 * Heuristic fallbacks produce canonical types, never raw strings like "meeting" or "entity".
 */
function detectEntityType(payload: Record<string, any>): string {
  // Prefer explicit entity typing when upstream already knows it (e.g., connector sync).
  const explicit =
    payload._entity_type ??
    payload.entity_type ??
    payload.entityType ??
    payload.object_type ??
    payload.objectType;
  if (typeof explicit === "string" && explicit.trim().length > 0) {
    // Resolve through canonical aliases — e.g. "deal" → "opportunity", "COMPANY" → "account"
    return resolveEntityTypeAlias(explicit.trim());
  }

  // Simple heuristic — returns CANONICAL types only
  if (payload.email && payload.firstname) return "contact";
  if (payload.dealname || payload.amount) return "opportunity"; // was "deal" — now canonical
  if (payload.company || payload.domain) return "account";
  if (payload.subject && payload.due_date) return "task";
  if (payload.title && payload.start_time) return "activity"; // was "meeting" — now canonical
  return "activity"; // was "entity" — now canonical fallback
}

async function callOpenRouterSanityCheck(
  apiKey: string,
  entityType: string,
  data: Record<string, any>
): Promise<{ confidence: number; anomalies: string[] }> {
  const safeData: Record<string, any> = {};
  const allowedKeys = [
    "name",
    "amount",
    "value",
    "arr",
    "stage",
    "probability",
    "health_score",
    "priority",
    "status",
    "close_date",
    "renewal_date",
    "created_at",
    "updated_at",
    "band",
    "severity",
    "email",
    "phone",
    "type",
  ];
  for (const key of allowedKeys) {
    if (data[key] !== undefined) safeData[key] = data[key];
  }

  const prompt = `You are a data quality analyst. Analyze this ${entityType} entity for anomalies.
Data: ${JSON.stringify(safeData)}

Return ONLY valid JSON (no markdown, no explanation):
{"confidence": <0-100 integer>, "anomalies": ["<short_anomaly_id>", ...]}

Confidence = how confident you are the data is legitimate (100 = definitely real, 0 = definitely anomalous).
Anomalies = list of short snake_case anomaly identifiers (e.g. "suspicious_amount", "impossible_date_combo"). Empty array if none found.`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://integratewise.ai",
      "X-Title": "IntegrateWise Normalizer S7",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown");
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const result = (await response.json()) as any;
  const content = result?.choices?.[0]?.message?.content || "";

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { confidence: 80, anomalies: [] };
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      confidence:
        typeof parsed.confidence === "number" ? Math.min(100, Math.max(0, parsed.confidence)) : 80,
      anomalies: Array.isArray(parsed.anomalies)
        ? parsed.anomalies.filter((a: any) => typeof a === "string").slice(0, 10)
        : [],
    };
  } catch {
    return { confidence: 80, anomalies: [] };
  }
}

/**
 * Apply canonical field mapping from EntityFieldPolicy.
 * Maps provider-specific field paths to canonical field names.
 * e.g., "properties.hs_object_id" → "external_id" (HubSpot)
 *       "Id" → "external_id" (Salesforce)
 */
function applyCanonicalMapping(
  payload: Record<string, any>,
  policy: EntityFieldPolicy,
  _source: string
): Record<string, any> {
  if (!policy.canonical_mapping || Object.keys(policy.canonical_mapping).length === 0) {
    return payload;
  }

  const result = { ...payload };

  for (const [sourceField, canonicalField] of Object.entries(policy.canonical_mapping)) {
    // Handle dot-notation paths (e.g., "properties.hs_object_id")
    const parts = sourceField.split(".");
    let value: any = payload;
    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }

    // Only map if the source field has a value and the canonical field isn't already set
    if (value !== undefined && value !== null && result[canonicalField] === undefined) {
      result[canonicalField] = value;
    }
  }

  return result;
}

function normalizeFields(payload: Record<string, any>, source: string): Record<string, any> {
  // Normalize common fields across tools
  const normalized = { ...payload };

  // HubSpot-specific normalization
  if (source === "hubspot") {
    if (payload.properties) {
      Object.assign(normalized, payload.properties);
      delete normalized.properties;
    }
    if (payload.firstname)
      normalized.name = `${payload.firstname} ${payload.lastname || ""}`.trim();
    if (payload.dealname) normalized.name = payload.dealname;
    if (payload.company) normalized.name = payload.company;
  }

  // Salesforce-specific normalization
  if (source === "salesforce") {
    if (payload.Name) normalized.name = payload.Name;
    if (payload.Amount) normalized.amount = payload.Amount;
  }

  return normalized;
}

async function logPipelineStep(
  env: Env,
  msg: PipelineMessage,
  status: string,
  durationMs: number,
  error?: string
): Promise<void> {
  try {
    if (!env.D1) {
      return;
    }
    await env.D1.prepare(
      `INSERT INTO pipeline_log (
        tenant_id, trace_id, stage, status, source, error_message, duration_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        msg.tenant_id,
        msg.metadata.trace_id,
        msg.stage,
        status,
        msg.source,
        error || null,
        durationMs
      )
      .run()
      .catch((e) => {
        console.error("[Normalizer] Failed to insert pipeline log (non-fatal):", e);
      });
  } catch (e) {
    console.error("Failed to log pipeline step:", e);
  }
}

// Helper: Broadcast entity update to BFF for real-time UI updates (Flow C B5/B6/B7)
async function broadcastEntityUpdate(
  env: Env,
  params: {
    tenant_id: string;
    entity_type: string;
    entity_id: string;
    change_type: "created" | "updated" | "deleted";
    source: string;
    trace_id: string;
  }
): Promise<void> {
  logEvent("broadcast_entity_update", {
    tenant_id: params.tenant_id,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    change_type: params.change_type,
    source: params.source,
    trace_id: params.trace_id,
  });

  // Flow C B6: Real-time UI notification via BFF WebSocket broadcast
  if (env.BFF) {
    try {
      await env.BFF.fetch(
        new Request("http://internal/broadcast/entity-update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": params.tenant_id,
          },
          body: JSON.stringify({
            type: "entity_update",
            tenant_id: params.tenant_id,
            entity_type: params.entity_type,
            entity_id: params.entity_id,
            change_type: params.change_type,
            source: params.source,
            trace_id: params.trace_id,
            timestamp: new Date().toISOString(),
          }),
        })
      );
    } catch (error) {
      // Log but don't fail pipeline on broadcast error
      logEvent("broadcast_error", {
        error: error instanceof Error ? error.message : String(error),
        tenant_id: params.tenant_id,
        entity_id: params.entity_id,
      });
    }
  }
}
