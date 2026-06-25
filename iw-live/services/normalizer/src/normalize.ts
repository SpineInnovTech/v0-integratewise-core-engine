/**
 * IntegrateWise Normalizer Service - Core Normalization Module
 * Handles validation, normalization, deduplication, and version management
 * for all canonical entity types.
 */

import { schemas, entityTypes } from "./schemas";
import { runNormalizerAccelerator, type NormalizerContext } from "./normalizer-accelerator";
import { resolveTenantAdaptiveSchema } from "@integratewise/types";
import type {
  EntityType,
  NormalizeResponse,
  ValidateResponse,
  ValidationError,
  VersionInfo,
} from "./types";
import { writeToDLQ } from "./dlq";

// =============================================================================
// VALIDATOR SETUP (Cloudflare Workers compatible)
// =============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateEntity(
  data: any,
  schema: any
): {
  valid: boolean;
  errors?: Array<{
    msg: string;
    field: string;
    code: "missing_field" | "format_error" | "validation_error";
  }>;
} {
  const errors: Array<{
    msg: string;
    field: string;
    code: "missing_field" | "format_error" | "validation_error";
  }> = [];

  // Required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push({ msg: `Missing required field: ${field}`, field, code: "missing_field" });
      }
    }
  }

  const props = schema.properties as Record<string, { type?: string; format?: string }> | undefined;
  if (props) {
    for (const [field, fieldSchema] of Object.entries(props)) {
      if (!(field in data)) continue;
      const value = data[field];
      const expectedType = fieldSchema?.type;
      const format = fieldSchema?.format;

      if (expectedType === "string" && typeof value !== "string") {
        errors.push({ msg: `Field ${field} must be a string`, field, code: "validation_error" });
      } else if (expectedType === "string" && format === "uuid" && typeof value === "string") {
        if (!UUID_REGEX.test(value)) {
          errors.push({
            msg: `Field ${field} must be a valid UUID format`,
            field,
            code: "format_error",
          });
        }
      } else if (expectedType === "number" && typeof value !== "number") {
        errors.push({ msg: `Field ${field} must be a number`, field, code: "validation_error" });
      } else if (expectedType === "boolean" && typeof value !== "boolean") {
        errors.push({ msg: `Field ${field} must be a boolean`, field, code: "validation_error" });
      } else if (expectedType === "array" && !Array.isArray(value)) {
        errors.push({ msg: `Field ${field} must be an array`, field, code: "validation_error" });
      } else if (expectedType === "object" && (typeof value !== "object" || Array.isArray(value))) {
        errors.push({ msg: `Field ${field} must be an object`, field, code: "validation_error" });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

type ValidatorResult = {
  valid: boolean;
  errors?: Array<{
    msg: string;
    field: string;
    code: "missing_field" | "format_error" | "validation_error";
  }>;
};
const validators: Record<string, (data: any) => ValidatorResult> = {};
for (const entityType of entityTypes) {
  validators[entityType] = (data: any) => validateEntity(data, schemas[entityType]);
}

/**
 * Trust Layer: Calculate trust score and provenance
 */
function determineTrustMetrics(data: any, source: string, hasR2: boolean): any {
  let score = 80;
  const reasoning = ["Source system identified"];

  if (source === "hubspot" || source === "salesforce") {
    score += 10;
    reasoning.push("Verified CRM connector source");
  } else if (source === "internal") {
    score += 15;
    reasoning.push("First-party internal system");
  }

  if (hasR2) {
    score += 5;
    reasoning.push("Immutable storage verification");
  }

  // Completeness check
  const fieldCount = Object.keys(data).length;
  if (fieldCount > 10) {
    score += 5;
    reasoning.push("High data completeness");
  }

  return {
    score: Math.min(score, 100),
    reasoning,
    provenance: {
      source,
      verified: score > 85,
      hops: hasR2 ? 2 : 1,
    },
  };
}

/** Simple non-crypto hash for content-based dedup key (deterministic) */
function contentHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h) ^ input.charCodeAt(i);
  return (h >>> 0).toString(16);
}

/**
 * Generate a deterministic deduplication key
 * Format: entityType:tenantId[:source_system]:uniqueId where uniqueId is external_id or content hash
 */
export function generateDedupKey(
  entityType: string,
  tenantId: string,
  data: Record<string, unknown>
): string {
  const externalId = (data.external_id as string) || (data.id as string);
  const sourceSystem = (data.source_system as string) || "";

  if (externalId) {
    const middle = sourceSystem ? `${sourceSystem}:${externalId}` : externalId;
    return `${entityType}:${tenantId}:${middle}`;
  }

  // No external_id: use deterministic content hash of relevant fields
  const keys = Object.keys(data)
    .filter((k) => !k.startsWith("_"))
    .sort();
  const payload: Record<string, unknown> = {};
  for (const k of keys) payload[k] = data[k];
  const stable = JSON.stringify(payload);
  const hash = contentHash(stable);
  return `${entityType}:${tenantId}:content:${hash}`;
}

/**
 * Validate data against an entity schema
 */
export function validate(entityType: string, data: Record<string, unknown>): ValidateResponse {
  const validator = validators[entityType];
  if (!validator)
    return {
      valid: false,
      errors: [{ field: "entity_type", message: "Unknown type", code: "schema_not_found" }],
    };

  const result = validator(data);
  if (result.valid) return { valid: true, errors: [] };

  const errors: ValidationError[] = (result.errors || []).map((err) => ({
    field: err.field,
    message: err.msg,
    code: err.code,
  }));

  return { valid: false, errors };
}

/**
 * Get or create version for a dedup key using D1 (or fallback to version 1 when db unavailable)
 */
async function getOrCreateVersion(
  dedupKey: string,
  db: D1Database | undefined | null
): Promise<VersionInfo> {
  if (!db || typeof (db as any).prepare !== "function") {
    return { dedup_key: dedupKey, version: 1, updated_at: new Date().toISOString() };
  }
  try {
    const existing = await db
      .prepare(`SELECT version FROM canonical_versions WHERE dedup_key = ?`)
      .bind(dedupKey)
      .first<{ version: number }>();

    if (existing) {
      const newVersion = existing.version + 1;
      await db
        .prepare(
          `UPDATE canonical_versions SET version = ?, updated_at = CURRENT_TIMESTAMP WHERE dedup_key = ?`
        )
        .bind(newVersion, dedupKey)
        .run();
      return { dedup_key: dedupKey, version: newVersion, updated_at: new Date().toISOString() };
    }

    await db
      .prepare(`INSERT INTO canonical_versions (dedup_key, version) VALUES (?, 1)`)
      .bind(dedupKey)
      .run();

    return { dedup_key: dedupKey, version: 1, updated_at: new Date().toISOString() };
  } catch (err) {
    console.error("Version management error", err);
    return { dedup_key: dedupKey, version: 1, updated_at: new Date().toISOString() };
  }
}

/**
 * Main normalization function
 * db is optional; when omitted or not D1-like, version defaults to 1 and DLQ is still written on validation failure.
 */
export async function normalize(
  entityType: string,
  rawData: Record<string, unknown>,
  db?: D1Database | null,
  env?: any,
  context: Partial<NormalizerContext> = {}
): Promise<NormalizeResponse> {
  const tenantId =
    context.tenant_id ||
    (rawData.tenant_id as string) ||
    (rawData.organization_id as string) ||
    "default";

  // 0. Resolve R2 Reference if present
  let dataToProcess = rawData;
  if (rawData && rawData._r2_ref && typeof rawData._r2_ref === "string") {
    if (env && env.FILES) {
      const obj = await env.FILES.get(rawData._r2_ref);
      if (obj) {
        dataToProcess = await obj.json();
      }
    }
  }

  // 1. Validate
  const validation = validate(entityType, dataToProcess);
  if (!validation.valid) {
    const dlqResult = await writeToDLQ(
      tenantId,
      entityType as EntityType,
      dataToProcess,
      validation.errors!,
      undefined
    );
    return {
      success: false,
      entity_type: entityType as EntityType,
      dedup_key: "",
      version: 0,
      errors: validation.errors,
      dlq_id: dlqResult.dlq_id,
    };
  }

  // 1.5. Golden Path: Run Normalizer Accelerator (NA0-NA5)
  const source = (dataToProcess.source_system as string) || "unknown";
  const resolvedSchema =
    env?.SUPABASE_URL && env?.SUPABASE_SERVICE_ROLE_KEY
      ? await resolveTenantAdaptiveSchema({
          supabaseUrl: env.SUPABASE_URL,
          serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
          tenantId,
        })
      : null;
  const acceleratedData = await runNormalizerAccelerator(dataToProcess, {
    tenant_id: tenantId,
    entity_type: entityType,
    source: source,
    env: env, // Pass env for service URLs
    resolvedSchema,
    ...context,
  });

  // 2. Dedup & Version
  const dedupKey = generateDedupKey(entityType, tenantId, acceleratedData);
  const versionInfo = await getOrCreateVersion(dedupKey, db ?? undefined);

  const normalizedData = {
    ...acceleratedData,
    _normalized: {
      dedup_key: dedupKey,
      version: versionInfo.version,
      normalized_at: versionInfo.updated_at,
      entity_type: entityType,
      tenant_id: tenantId,
    },
  };

  return {
    success: true,
    entity_type: entityType as EntityType,
    dedup_key: dedupKey,
    version: versionInfo.version,
    normalized_data: normalizedData,
    trust_metrics: determineTrustMetrics(dataToProcess, source, !!rawData._r2_ref),
  };
}

export async function normalizeBatch(
  entityType: string,
  items: Record<string, unknown>[],
  db: D1Database,
  env?: any,
  context: Partial<NormalizerContext> = {}
): Promise<NormalizeResponse[]> {
  const results: NormalizeResponse[] = [];
  for (const item of items) {
    results.push(await normalize(entityType, item, db, env, context));
  }
  return results;
}
