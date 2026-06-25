/**
 * Consolidated Pipeline Worker (v3.6 Architecture)
 * Merges: normalizer + spine-v2
 *
 * SECURITY: This is the ONLY service with Spine write credentials.
 * No other worker may write to the Spine SSOT.
 *
 * Handles:
 * - 8-stage pipeline processing (normalizer)
 * - Spine SSOT reads/writes (spine-v2)
 *
 * Queue consumers: pipeline.process, accelerator.trigger
 */
import type { PipelineQueueMessage } from "@integratewise/types";
import normalizerWorker from "../../normalizer/src/index";
import spineWorker, {
  resolveEntityType,
  getMatchingTypesForQuery,
  getDomainForType,
  extractTypedFields,
  type SpineTarget,
} from "./spine/index";
import { indexOrgMemoryBulk } from "./memory-indexer";
import { handleMemoryPromoteBatch, type SpineWriteEvent } from "./memory-promoter";

export interface Env {
  // Legacy Supabase credentials — optional per desupabase mapping:
  // PostgreSQL → D1 ; realtime → DOs/Queues/KV ; metadata → D1 tenant_spine_config + domain partitions.
  // Active writes prefer writeToEntityCache (D1). spine-v2 (this module) is legacy.
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SERVICE_SECRET?: string; // Internal auth — rejects external requests without this
  SPINE?: Fetcher;
  PIPELINE_QUEUE: Queue;
  KNOWLEDGE_QUEUE: Queue;
  ACCELERATOR_QUEUE: Queue;
  INTELLIGENCE_QUEUE: Queue;
  DLQ_QUEUE: Queue;
  SIGNAL_QUEUE: Queue;
  /** Spine → Memory promotion queue (spine-hydration-lifecycle Phase 5). */
  MEMORY_PROMOTE?: Queue;
  CACHE_DB: D1Database;
  /**
   * Normalizer historically expects `env.D1`.
   * In the consolidated pipeline we bind it as `CACHE_DB`, so we alias it at runtime.
   */
  D1?: D1Database;
  CACHE: KVNamespace;
  SIGNAL_CACHE: KVNamespace;
  METRICS: KVNamespace;
  ENABLE_SIGNALS?: string;
  SYNC_SECRET?: string;
  TRIAGE_BOT_API_KEY?: string; // Triage Bot is the sole writer to memory
  SPINE_STORAGE: R2Bucket;
  SPINE_ENCRYPTION_KEY: string;
  AI_SEARCH?: any; // Cloudflare AI Search Namespace binding (optional — degrades gracefully)
}

type PrimitiveFilter = string | number | boolean;
type FilterValue = PrimitiveFilter | PrimitiveFilter[];
type FilterMap = Record<string, FilterValue>;

interface SchemaFieldRecord {
  field_key?: string;
  field_path?: string;
  data_type?: string;
  occurrence_count?: number;
  last_seen_at?: string;
}

/**
 * Uploads a formatted Markdown continuity event to Cloudflare AI Search via the Items API.
 * This acts as the First-Class Continuity Operator for the Twin.
 */
async function uploadContinuityEvent(env: Env, payload: any, tenantId: string): Promise<string> {
  if (!env.AI_SEARCH) {
    // AI_SEARCH not bound — skip continuity event (non-fatal)
    console.warn("[pipeline] AI_SEARCH not configured, skipping continuity event");
    return "skipped-no-ai-search";
  }

  // Use the specific instance we have configured
  const instance = env.AI_SEARCH.get("integratewise-knowledge");

  const timestamp = payload.timestamp || new Date().toISOString();
  const type = payload.type || "event";
  const agent = payload.agent || "system";
  const entityId = payload.entity_id || "none";
  const summary = payload.summary || "No summary provided";

  const id = `continuity-${timestamp.replace(/[:.]/g, "-")}-${Math.random().toString(36).substring(2, 9)}`;

  // The markdown body gets indexed and embedded by AI Search automatically
  const markdownContent = `
# ${type.toUpperCase()}: ${summary}
- Type: ${type}
- Agent: ${agent}
- Timestamp: ${timestamp}
- Entity ID: ${entityId}
- Tenant ID: ${tenantId}

${payload.details || payload.rationale || payload.payload ? JSON.stringify(payload.details || payload.rationale || payload.payload, null, 2) : "No additional details."}
`.trim();

  // Upload to the built-in storage (fast indexing)
  await instance.items.upload(`${id}.md`, markdownContent, {
    metadata: {
      type,
      agent,
      timestamp,
      tenant_id: tenantId,
      entity_id: entityId,
    },
  });

  return id;
}

const RESERVED_QUERY_KEYS = new Set(["type", "limit", "offset", "page", "filters"]);
function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Response(JSON.stringify(data), { ...init, headers });
}

// ─── Edge Mirroring (Supabase → Cloudflare D1) ───────────────────────────────
//
// After every canonical Supabase write, the pipeline mirrors the record to D1.
// D1 = the external Edge Spine. External AI, MCP tools, and read-heavy workloads
// hit D1 — never Supabase directly.
//
// Pattern: fire-and-forget via ctx.waitUntil() so it never blocks the primary path.

interface EdgeSignal {
  id: string;
  tenant_id: string;
  signal_type: string;
  severity: string;
  entity_id: string | null;
  data: string; // JSON string
  updated_at: string;
}

// syncToEdge removed per DECISION 22: Cloudflare is the single product plane; Supabase mirror retired.

/**
 * Sync db-proxy write results to Cloudflare D1 edge cache.
 */
async function syncDbProxyWriteToEdge(
  db: D1Database,
  table: string,
  method: string,
  rows: any[]
): Promise<void> {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return;

  const targetTable = table.replace("knowledge.", "").replace("memory.", "").toLowerCase();

  try {
    if (method === "DELETE") {
      const ids = rows.map((r) => r.id).filter(Boolean);
      if (ids.length === 0) return;

      const validTables = [
        "conversational_memory",
        "org_memory",
        "personal_memory",
        "triage_results",
        "document_chunks",
        "chunking_config",
        "search_history",
        "session_containers",
        "session_events",
        "continuity_checkpoints",
      ];
      if (validTables.includes(targetTable)) {
        const placeholders = ids.map((_, i) => `?${i + 1}`).join(", ");
        await db
          .prepare(`DELETE FROM ${targetTable} WHERE id IN (${placeholders})`)
          .bind(...ids)
          .run();
        console.log(`[EdgeSync] Deleted ${ids.length} rows from D1 table ${targetTable}`);
      }
      return;
    }

    for (const row of rows) {
      if (!row || !row.id) continue;

      const serialize = (val: any) => {
        if (val === null || val === undefined) return null;
        return typeof val === "object" ? JSON.stringify(val) : String(val);
      };

      if (targetTable === "conversational_memory") {
        await db
          .prepare(
            `INSERT INTO conversational_memory (
            id, tenant_id, session_id, role, content, model, tokens_in, tokens_out, embedding, metadata, created_at,
            promotion_status, promoted_to, promoted_id, promotion_decided_by, promotion_decided_at, importance_score, lineage_ref, department
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
          ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            session_id = excluded.session_id,
            role = excluded.role,
            content = excluded.content,
            model = excluded.model,
            tokens_in = excluded.tokens_in,
            tokens_out = excluded.tokens_out,
            embedding = excluded.embedding,
            metadata = excluded.metadata,
            created_at = excluded.created_at,
            promotion_status = excluded.promotion_status,
            promoted_to = excluded.promoted_to,
            promoted_id = excluded.promoted_id,
            promotion_decided_by = excluded.promotion_decided_by,
            promotion_decided_at = excluded.promotion_decided_at,
            importance_score = excluded.importance_score,
            lineage_ref = excluded.lineage_ref,
            department = excluded.department`
          )
          .bind(
            row.id,
            row.tenant_id,
            row.session_id,
            row.role,
            row.content,
            row.model || null,
            row.tokens_in || 0,
            row.tokens_out || 0,
            serialize(row.embedding),
            serialize(row.metadata),
            row.created_at,
            row.promotion_status || "not_promoted",
            row.promoted_to || null,
            row.promoted_id || null,
            row.promotion_decided_by || null,
            row.promotion_decided_at || null,
            row.importance_score || 0.5,
            row.lineage_ref || null,
            row.department || null
          )
          .run();
      } else if (targetTable === "org_memory") {
        await db
          .prepare(
            `INSERT INTO org_memory (
            id, tenant_id, topic, category, content, source_session_id, governance_state, confidence, embedding, metadata, created_at, updated_at,
            related_entity_ids, related_departments, access_scope, lineage_ref, tier
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
          ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            topic = excluded.topic,
            category = excluded.category,
            content = excluded.content,
            source_session_id = excluded.source_session_id,
            governance_state = excluded.governance_state,
            confidence = excluded.confidence,
            embedding = excluded.embedding,
            metadata = excluded.metadata,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            related_entity_ids = excluded.related_entity_ids,
            related_departments = excluded.related_departments,
            access_scope = excluded.access_scope,
            lineage_ref = excluded.lineage_ref,
            tier = excluded.tier`
          )
          .bind(
            row.id,
            row.tenant_id,
            row.topic,
            row.category,
            row.content,
            row.source_session_id || null,
            row.governance_state || "staging",
            row.confidence || 0.8,
            serialize(row.embedding),
            serialize(row.metadata),
            row.created_at,
            row.updated_at,
            serialize(row.related_entity_ids),
            serialize(row.related_departments),
            row.access_scope || "org",
            row.lineage_ref || null,
            row.tier || "standard"
          )
          .run();
      } else if (targetTable === "personal_memory") {
        await db
          .prepare(
            `INSERT INTO personal_memory (
            id, tenant_id, user_id, topic, category, content, metadata, embedding, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
          ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            user_id = excluded.user_id,
            topic = excluded.topic,
            category = excluded.category,
            content = excluded.content,
            metadata = excluded.metadata,
            embedding = excluded.embedding,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at`
          )
          .bind(
            row.id,
            row.tenant_id,
            row.user_id,
            row.topic,
            row.category,
            row.content,
            serialize(row.metadata),
            serialize(row.embedding),
            row.created_at,
            row.updated_at
          )
          .run();
      } else if (targetTable === "triage_results") {
        await db
          .prepare(
            `INSERT INTO triage_results (
            id, tenant_id, message_id, platform, priority, category, summary, recommended_action, approval_status, approved_by, approved_at, created_at,
            related_entity_ids, resolved_entity_id, governance_decision_id, lineage_ref, agent_id, agent_version, resolution_status, resolved_by, resolved_at,
            resolution_notes, promoted_to_org_memory, promoted_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24)
          ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            message_id = excluded.message_id,
            platform = excluded.platform,
            priority = excluded.priority,
            category = excluded.category,
            summary = excluded.summary,
            recommended_action = excluded.recommended_action,
            approval_status = excluded.approval_status,
            approved_by = excluded.approved_by,
            approved_at = excluded.approved_at,
            created_at = excluded.created_at,
            related_entity_ids = excluded.related_entity_ids,
            resolved_entity_id = excluded.resolved_entity_id,
            governance_decision_id = excluded.governance_decision_id,
            lineage_ref = excluded.lineage_ref,
            agent_id = excluded.agent_id,
            agent_version = excluded.agent_version,
            resolution_status = excluded.resolution_status,
            resolved_by = excluded.resolved_by,
            resolved_at = excluded.resolved_at,
            resolution_notes = excluded.resolution_notes,
            promoted_to_org_memory = excluded.promoted_to_org_memory,
            promoted_at = excluded.promoted_at`
          )
          .bind(
            row.id,
            row.tenant_id,
            row.message_id || null,
            row.platform || null,
            row.priority || null,
            row.category || null,
            row.summary || null,
            row.recommended_action || null,
            row.approval_status || "pending",
            row.approved_by || null,
            row.approved_at || null,
            row.created_at,
            serialize(row.related_entity_ids),
            row.resolved_entity_id || null,
            row.governance_decision_id || null,
            row.lineage_ref || null,
            row.agent_id || "triage_bot",
            row.agent_version || null,
            row.resolution_status || "open",
            row.resolved_by || null,
            row.resolved_at || null,
            row.resolution_notes || null,
            row.promoted_to_org_memory || null,
            row.promoted_at || null
          )
          .run();
      } else if (targetTable === "document_chunks") {
        await db
          .prepare(
            `INSERT INTO document_chunks (
            id, tenant_id, file_id, version_id, session_id, chunk_index, chunk_type, content, content_hash, char_start, char_end, token_count,
            parent_chunk_id, source_type, source_name, source_url, entity_type, entity_id, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)
          ON CONFLICT(tenant_id, content_hash) DO UPDATE SET
            file_id = excluded.file_id,
            version_id = excluded.version_id,
            session_id = excluded.session_id,
            chunk_index = excluded.chunk_index,
            chunk_type = excluded.chunk_type,
            content = excluded.content,
            char_start = excluded.char_start,
            char_end = excluded.char_end,
            token_count = excluded.token_count,
            parent_chunk_id = excluded.parent_chunk_id,
            source_type = excluded.source_type,
            source_name = excluded.source_name,
            source_url = excluded.source_url,
            entity_type = excluded.entity_type,
            entity_id = excluded.entity_id,
            updated_at = excluded.updated_at`
          )
          .bind(
            row.id,
            row.tenant_id,
            row.file_id || null,
            row.version_id || null,
            row.session_id || null,
            row.chunk_index || 0,
            row.chunk_type || "text",
            row.content,
            row.content_hash,
            row.char_start || null,
            row.char_end || null,
            row.token_count || null,
            row.parent_chunk_id || null,
            row.source_type,
            row.source_name || null,
            row.source_url || null,
            row.entity_type || null,
            row.entity_id || null,
            row.created_at,
            row.updated_at
          )
          .run();
      } else if (targetTable === "search_history") {
        await db
          .prepare(
            `INSERT INTO search_history (
            id, tenant_id, user_id, query_text, query_embedding, search_type, top_k, filters, result_count, result_ids, relevance_scores, duration_ms, source_service, correlation_id, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
          ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            user_id = excluded.user_id,
            query_text = excluded.query_text,
            query_embedding = excluded.query_embedding,
            search_type = excluded.search_type,
            top_k = excluded.top_k,
            filters = excluded.filters,
            result_count = excluded.result_count,
            result_ids = excluded.result_ids,
            relevance_scores = excluded.relevance_scores,
            duration_ms = excluded.duration_ms,
            source_service = excluded.source_service,
            correlation_id = excluded.correlation_id`
          )
          .bind(
            row.id,
            row.tenant_id,
            row.user_id || null,
            row.query_text,
            serialize(row.query_embedding),
            row.search_type || "hybrid",
            row.top_k || 10,
            serialize(row.filters),
            row.result_count || 0,
            serialize(row.result_ids),
            serialize(row.relevance_scores),
            row.duration_ms || null,
            row.source_service || null,
            row.correlation_id || null,
            row.created_at
          )
          .run();
      } else if (targetTable === "chunking_config") {
        await db
          .prepare(
            `INSERT INTO chunking_config (
            id, tenant_id, source_type, file_type, chunk_size, chunk_overlap, min_chunk_size, max_chunk_size, strategy, preserve_headers, preserve_lists, preserve_code_blocks, is_active, priority, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
          ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            source_type = excluded.source_type,
            file_type = excluded.file_type,
            chunk_size = excluded.chunk_size,
            chunk_overlap = excluded.chunk_overlap,
            min_chunk_size = excluded.min_chunk_size,
            max_chunk_size = excluded.max_chunk_size,
            strategy = excluded.strategy,
            preserve_headers = excluded.preserve_headers,
            preserve_lists = excluded.preserve_lists,
            preserve_code_blocks = excluded.preserve_code_blocks,
            is_active = excluded.is_active,
            priority = excluded.priority,
            updated_at = excluded.updated_at`
          )
          .bind(
            row.id,
            row.tenant_id || null,
            row.source_type || null,
            row.file_type || null,
            row.chunk_size || 512,
            row.chunk_overlap || 50,
            row.min_chunk_size || 100,
            row.max_chunk_size || 1000,
            row.strategy || "semantic",
            row.preserve_headers ? 1 : 0,
            row.preserve_lists ? 1 : 0,
            row.preserve_code_blocks ? 1 : 0,
            row.is_active ? 1 : 0,
            row.priority || 0,
            row.created_at,
            row.updated_at
          )
          .run();
      } else if (targetTable === "session_containers") {
        await db
          .prepare(
            `INSERT INTO session_containers (
            id, tenant_id, user_id, account_id, started_at, last_event_at, event_count, status, tags, summary, triage_status, triage_outcome, metadata, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
          ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            user_id = excluded.user_id,
            account_id = excluded.account_id,
            started_at = excluded.started_at,
            last_event_at = excluded.last_event_at,
            event_count = excluded.event_count,
            status = excluded.status,
            tags = excluded.tags,
            summary = excluded.summary,
            triage_status = excluded.triage_status,
            triage_outcome = excluded.triage_outcome,
            metadata = excluded.metadata,
            updated_at = excluded.updated_at`
          )
          .bind(
            row.id,
            row.tenant_id,
            row.user_id,
            row.account_id || null,
            row.started_at,
            row.last_event_at,
            row.event_count || 0,
            row.status || "active",
            serialize(row.tags),
            row.summary || null,
            row.triage_status || null,
            row.triage_outcome || null,
            serialize(row.metadata),
            row.created_at,
            row.updated_at
          )
          .run();
      } else if (targetTable === "session_events") {
        await db
          .prepare(
            `INSERT INTO session_events (
            id, tenant_id, session_id, user_id, account_id, event_type, source, content, metadata, lineage, seq, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
          ON CONFLICT(tenant_id, id) DO UPDATE SET
            session_id = excluded.session_id,
            user_id = excluded.user_id,
            account_id = excluded.account_id,
            event_type = excluded.event_type,
            source = excluded.source,
            content = excluded.content,
            metadata = excluded.metadata,
            lineage = excluded.lineage,
            seq = excluded.seq`
          )
          .bind(
            row.id,
            row.tenant_id,
            row.session_id,
            row.user_id,
            row.account_id || null,
            row.event_type,
            row.source,
            serialize(row.content),
            serialize(row.metadata),
            serialize(row.lineage),
            row.seq || null,
            row.created_at
          )
          .run();
      } else if (targetTable === "continuity_checkpoints") {
        await db
          .prepare(
            `INSERT INTO continuity_checkpoints (
            id, tenant_id, session_id, user_id, checkpoint_at, event_range, compressed_state, model_context_window, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
          ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            session_id = excluded.session_id,
            user_id = excluded.user_id,
            checkpoint_at = excluded.checkpoint_at,
            event_range = excluded.event_range,
            compressed_state = excluded.compressed_state,
            model_context_window = excluded.model_context_window`
          )
          .bind(
            row.id,
            row.tenant_id,
            row.session_id,
            row.user_id,
            row.checkpoint_at,
            serialize(row.event_range),
            row.compressed_state || null,
            row.model_context_window || null,
            row.created_at
          )
          .run();
      }
    }
    console.log(`[EdgeSync] Synced ${rows.length} rows to D1 table ${targetTable}`);
  } catch (err: any) {
    console.error(`[EdgeSync] Sync failed for table ${targetTable}: ${err.message}`);
  }
}

export interface NormalizedRecord {
  id: string;
  tenant_id: string;
  type: string;
  source_tool: string;
  source_id: string;
  data: Record<string, any> | string;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Determine the specific Edge Spine domain table for a given entity type.
 */
// Duplicate getDomainForType and extractTypedFields removed (imported from spineWorker)

/**
 * Return list of known SQLite-native columns for dynamic D1 filter mappings.
 */
export function getKnownColumnsForDomain(domain: string): string[] {
  if (domain === "decide") {
    return [
      "owner",
      "due_date",
      "progress",
      "category",
      "investment",
      "revenue",
      "roi_pct",
      "effort",
      "decided_by",
      "decided_at",
      "committed_to",
      "fulfilled",
      "status",
    ];
  }
  if (domain === "build") {
    return [
      "priority",
      "assignee",
      "due_date",
      "overdue",
      "source",
      "doc_type",
      "success_rate",
      "trigger_type",
      "event_type",
      "event_date",
      "event_time",
      "blocked_by",
      "age_days",
      "escalated",
      "status",
    ];
  }
  if (domain === "grow") {
    return [
      "health",
      "health_score",
      "arr",
      "mrr",
      "arr_growth_pct",
      "industry",
      "region",
      "tier",
      "csm",
      "owner",
      "stage",
      "value",
      "probability",
      "close_date",
      "renewal_date",
      "renewal_days_remaining",
      "churn_risk",
      "churn_probability",
      "severity",
      "priority",
      "score",
      "nps",
      "last_activity",
      "last_qbr",
      "champion_active",
      "open_tickets",
      "p1_tickets",
      "status",
    ];
  }
  if (domain === "run") {
    return [
      "metric_value",
      "unit",
      "change_pct",
      "direction",
      "metric_source",
      "period",
      "priority",
      "insight_module",
      "recommendation",
      "status",
    ];
  }
  if (domain === "cross") {
    return [
      "priority",
      "source_surface",
      "routed_to",
      "severity",
      "domain",
      "primary_surface",
      "confidence",
      "category",
      "status",
    ];
  }
  return [];
}

/**
 * Core write/upsert logic into the domain-partitioned D1 tables, invalidating KV cache.
 * Bypasses Supabase completely.
 */
export async function writeToEntityCache(
  db: D1Database,
  kv: KVNamespace,
  record: NormalizedRecord
): Promise<void> {
  const now = new Date().toISOString();
  const createdAt = record.created_at || now;
  const updatedAt = record.updated_at || now;
  const version = record.version || 1;

  const rawData = typeof record.data === "string" ? JSON.parse(record.data) : record.data || {};
  const dataStr = JSON.stringify(rawData);

  const domain = getDomainForType(record.type);
  const tableName = `${domain}_data`;

  // Extract typed fields for query optimizations
  const typedFields = extractTypedFields(domain, rawData);

  // Base fields common to all domain tables
  const baseCols = [
    "id",
    "tenant_id",
    "type",
    "name",
    "status",
    "data",
    "source_tool",
    "source_id",
    "created_at",
    "updated_at",
  ];
  const baseVals = [
    record.id,
    record.tenant_id,
    record.type,
    rawData.name || record.type,
    rawData.status || null,
    dataStr,
    record.source_tool || "unknown",
    record.source_id || record.id,
    createdAt,
    updatedAt,
  ];

  const typedKeys = Object.keys(typedFields);
  const typedVals = Object.values(typedFields);

  const allCols = [...baseCols, ...typedKeys];
  const allVals = [...baseVals, ...typedVals];

  const placeholders = allCols.map((_, i) => `?${i + 1}`).join(", ");

  const updateClauses = [
    "data = excluded.data",
    "updated_at = excluded.updated_at",
    "tenant_id = excluded.tenant_id",
  ];
  if (rawData.name) updateClauses.push("name = excluded.name");
  if (rawData.status !== undefined) updateClauses.push("status = excluded.status");
  for (const k of typedKeys) {
    updateClauses.push(`${k} = excluded.${k}`);
  }

  const query = `
    INSERT INTO ${tableName} (${allCols.join(", ")})
    VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET
      ${updateClauses.join(", ")}
  `;

  try {
    // 1. Write to domain table in D1
    await db
      .prepare(query)
      .bind(...allVals)
      .run();

    // 2. Cache in KV namespace with TTL 300 seconds
    const kvKey = `entity:${record.tenant_id}:${record.type}:${record.id}`;
    const cacheValue = JSON.stringify({
      id: record.id,
      tenant_id: record.tenant_id,
      type: record.type,
      source_tool: record.source_tool,
      source_id: record.source_id,
      data: rawData,
      version,
      created_at: createdAt,
      updated_at: updatedAt,
    });
    await kv.put(kvKey, cacheValue, { expirationTtl: 300 });
  } catch (err: any) {
    console.error(
      `[writeToEntityCache] Failed to cache entity ${record.id} in domain ${domain}: ${err.message}`
    );
  }
}

/**
 * Mirror a signal record into the D1 edge signal cache.
 * Called after every successful signal write.
 */
export async function syncSignalToEdge(db: D1Database, signal: EdgeSignal): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO signal_cache (id, tenant_id, signal_type, severity, entity_id, data, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(id) DO UPDATE SET
           data = excluded.data,
           severity = excluded.severity,
           entity_id = excluded.entity_id,
           updated_at = excluded.updated_at`
      )
      .bind(
        signal.id,
        signal.tenant_id,
        signal.signal_type,
        signal.severity,
        signal.entity_id ?? null,
        signal.data,
        signal.updated_at
      )
      .run();
  } catch (err: any) {
    console.error(`[EdgeSync:signal] Failed to mirror ${signal.id}: ${err.message}`);
  }
}

export interface NormalizedSignal {
  id: string;
  tenant_id: string;
  signal_type: string;
  severity: "low" | "medium" | "high" | "critical";
  entity_type?: string;
  entity_id?: string;
  title: string;
  description?: string;
  data: Record<string, any> | string;
  status?: "active" | "acknowledged" | "resolved";
  created_at?: string;
  updated_at?: string;
}

/**
 * Core write/upsert logic into the D1 signal_data table AND the cross_data domain table, invalidating KV.
 */
export async function writeToSignalCache(
  db: D1Database,
  kv: KVNamespace,
  signal: NormalizedSignal
): Promise<void> {
  const now = new Date().toISOString();
  const createdAt = signal.created_at || now;
  const updatedAt = signal.updated_at || now;
  const status = signal.status || "active";
  const dataStr = typeof signal.data === "string" ? signal.data : JSON.stringify(signal.data);

  try {
    // 1. Write to legacy signal_cache table (if it exists and is bound)
    await db
      .prepare(
        `INSERT INTO signal_cache (id, tenant_id, signal_type, severity, entity_id, data, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(id) DO UPDATE SET
           severity = excluded.severity,
           entity_id = excluded.entity_id,
           data = excluded.data,
           updated_at = excluded.updated_at`
      )
      .bind(
        signal.id,
        signal.tenant_id,
        signal.signal_type,
        signal.severity,
        signal.entity_id ?? null,
        dataStr,
        updatedAt
      )
      .run();

    // 2. Also write to new partitioned 'cross_data' table (under signal type)
    const crossFields = {
      priority: signal.severity,
      source_surface: signal.entity_type || "intelligence",
      routed_to: "[]",
      severity: signal.severity,
      domain: signal.entity_type || "intelligence",
      primary_surface: "cross",
      confidence: 1.0,
      category: "signal",
    };

    const crossCols = [
      "id",
      "tenant_id",
      "type",
      "name",
      "status",
      "data",
      "source_tool",
      "source_id",
      "created_at",
      "updated_at",
      ...Object.keys(crossFields),
    ];
    const crossVals = [
      signal.id,
      signal.tenant_id,
      "signal",
      signal.title,
      status,
      dataStr,
      "system",
      signal.entity_id || signal.id,
      createdAt,
      updatedAt,
      ...Object.values(crossFields),
    ];

    const placeholders = crossCols.map((_, i) => `?${i + 1}`).join(", ");
    const updateClauses = [
      "data = excluded.data",
      "updated_at = excluded.updated_at",
      "tenant_id = excluded.tenant_id",
      "name = excluded.name",
      "status = excluded.status",
      "priority = excluded.priority",
      "severity = excluded.severity",
    ];

    await db
      .prepare(
        `
      INSERT INTO cross_data (${crossCols.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateClauses.join(", ")}
    `
      )
      .bind(...crossVals)
      .run();

    // 3. Cache in KV namespace with TTL 60 seconds
    const kvKey = `signal:${signal.tenant_id}:${signal.id}`;
    const cacheValue = JSON.stringify({
      id: signal.id,
      tenant_id: signal.tenant_id,
      signal_type: signal.signal_type,
      severity: signal.severity,
      entity_type: signal.entity_type,
      entity_id: signal.entity_id,
      title: signal.title,
      description: signal.description,
      data: typeof signal.data === "string" ? JSON.parse(signal.data) : signal.data,
      status,
      created_at: createdAt,
      updated_at: updatedAt,
    });
    await kv.put(kvKey, cacheValue, { expirationTtl: 60 });
  } catch (err: any) {
    console.error(`[writeToSignalCache] Failed to cache signal ${signal.id}: ${err.message}`);
  }
}

/**
 * Fetch domain-partitioned rows from D1. Bypasses Supabase completely.
 */
export async function fetchTypedSpineRowsFromD1(
  env: Env,
  tenantId: string,
  entityType: string,
  filters: FilterMap,
  pagination: { limit: number; offset: number; workspace?: string }
): Promise<{
  rows: Record<string, any>[];
  total: number;
  source: string;
  entityType: string;
  target: SpineTarget | null;
}> {
  const domain = getDomainForType(entityType);
  const tableName = `${domain}_data`;

  const matchingTypes = getMatchingTypesForQuery(entityType);
  const typePlaceholders = matchingTypes.map(() => "?").join(", ");
  let baseQuery = `FROM ${tableName} WHERE type IN (${typePlaceholders}) AND tenant_id = ?`;
  const params: any[] = [...matchingTypes, tenantId];

  const knownCols = getKnownColumnsForDomain(domain);

  for (const [key, value] of Object.entries(filters)) {
    if (knownCols.includes(key)) {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          const placeholders = value.map(() => "?").join(", ");
          baseQuery += ` AND ${key} IN (${placeholders})`;
          params.push(...value);
        }
      } else {
        baseQuery += ` AND ${key} = ?`;
        params.push(value);
      }
    }
  }

  // Count total
  const countRes = await env.CACHE_DB.prepare(`SELECT COUNT(*) as total ${baseQuery}`)
    .bind(...params)
    .first<{ total: number }>();
  const total = countRes?.total || 0;

  // Fetch paginated results
  const dataQuery = `SELECT * ${baseQuery} ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
  const dataParams = [...params, pagination.limit, pagination.offset];

  const d1Rows = await env.CACHE_DB.prepare(dataQuery)
    .bind(...dataParams)
    .all();
  const rows = (d1Rows.results || []).map((row: any) => {
    let dataObj = {};
    try {
      dataObj = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
    } catch {}

    return {
      ...row,
      data: dataObj,
    };
  });

  return {
    rows,
    total,
    source: `D1.${tableName}`,
    entityType,
    target: null,
  };
}

/**
 * Fetch a single domain-partitioned row by ID. Bypasses Supabase completely.
 */
export async function fetchSingleSpineRowFromD1(
  env: Env,
  tenantId: string,
  entityType: string,
  id: string
): Promise<{ row: Record<string, any>; entityType: string; target: SpineTarget | null }> {
  const domain = getDomainForType(entityType);
  const tableName = `${domain}_data`;

  // 1. Try checking KV cache first
  if (env.CACHE) {
    const kvKey = `entity:${tenantId}:${entityType}:${id}`;
    const kvVal = await env.CACHE.get(kvKey);
    if (kvVal) {
      try {
        const cached = JSON.parse(kvVal);
        return {
          row: cached,
          entityType,
          target: null,
        };
      } catch {}
    }
  }

  // 2. Query D1 domain table
  const query = `SELECT * FROM ${tableName} WHERE id = ? AND tenant_id = ? LIMIT 1`;
  const row = await env.CACHE_DB.prepare(query).bind(id, tenantId).first<any>();

  if (row) {
    let dataObj = {};
    try {
      dataObj = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
    } catch {}

    const parsedRow = {
      ...row,
      data: dataObj,
    };

    // Cache back in KV
    if (env.CACHE) {
      const kvKey = `entity:${tenantId}:${entityType}:${id}`;
      await env.CACHE.put(kvKey, JSON.stringify(parsedRow), { expirationTtl: 300 });
    }

    return {
      row: parsedRow,
      entityType,
      target: null,
    };
  }

  throw new Error(`Entity ${id} of type ${entityType} not found in Edge Spine ${domain}`);
}

function parseScalar(raw: string): PrimitiveFilter {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return raw;
}

function toFilterValue(value: unknown): FilterValue | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const values = value
      .map((entry) => toFilterValue(entry))
      .flatMap((entry) => (Array.isArray(entry) ? entry : entry == null ? [] : [entry]));
    return values.length > 0 ? values : null;
  }
  if (typeof value === "string") return parseScalar(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
}

function extractFilters(url: URL): FilterMap {
  const filters: FilterMap = {};
  const rawFilters = url.searchParams.get("filters");
  if (rawFilters) {
    try {
      const parsed = JSON.parse(rawFilters) as Record<string, unknown>;
      for (const [key, value] of Object.entries(parsed)) {
        const normalized = toFilterValue(value);
        if (normalized != null) filters[key] = normalized;
      }
    } catch {
      // Ignore invalid filter blobs and fall back to direct query params.
    }
  }

  for (const [key, value] of url.searchParams.entries()) {
    if (RESERVED_QUERY_KEYS.has(key) || key in filters) continue;
    const normalized = toFilterValue(value);
    if (normalized != null) filters[key] = normalized;
  }

  return filters;
}

function getPagination(url: URL): { limit: number; offset: number } {
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1),
    500
  );
  const explicitOffset = url.searchParams.get("offset");
  if (explicitOffset != null) {
    return {
      limit,
      offset: Math.max(parseInt(explicitOffset, 10) || 0, 0),
    };
  }

  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10) || 1, 1);
  return { limit, offset: (page - 1) * limit };
}

function rewriteRequest(request: Request, pathname: string, search?: URLSearchParams): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = search?.toString() || "";
  return new Request(url.toString(), request);
}

function extractEntityData(
  row: Record<string, any>,
  target: SpineTarget | null
): Record<string, any> {
  const data =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? { ...row.data }
      : ({} as Record<string, any>);

  const ignoredKeys = new Set([
    "id",
    "tenant_id",
    "created_at",
    "updated_at",
    "last_synced_at",
    "version",
    "completeness_score",
    "fields_present",
    "fields_expected",
  ]);
  if (target?.pk) ignoredKeys.add(target.pk);

  for (const [key, value] of Object.entries(row)) {
    if (ignoredKeys.has(key) || value == null || key in data) continue;
    data[key] = value;
  }

  return data;
}

function buildCompleteness(
  data: Record<string, any>,
  schemaFields: SchemaFieldRecord[]
): {
  completeness_score: number;
  fields_present: number;
  fields_expected: number;
  missing_fields: string[];
  missing_expected: string[];
  missing_required: string[];
} {
  const expectedFields = Array.from(
    new Set(
      schemaFields
        .map((field) => field.field_path || field.field_key)
        .filter((field): field is string => Boolean(field))
    )
  );
  const presentFields = Object.entries(data)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key]) => key);

  const fieldsExpected = expectedFields.length || presentFields.length;
  const fieldsPresent = expectedFields.length
    ? expectedFields.filter((field) => presentFields.includes(field)).length
    : presentFields.length;
  const missingFields = expectedFields.filter((field) => !presentFields.includes(field));
  const completeness_score =
    fieldsExpected > 0 ? Math.round((fieldsPresent / fieldsExpected) * 100) : 0;

  return {
    completeness_score,
    fields_present: fieldsPresent,
    fields_expected: fieldsExpected,
    missing_fields: missingFields,
    missing_expected: missingFields,
    missing_required: [],
  };
}

async function fetchSchemaFields(
  env: Env,
  tenantId: string,
  entityType: string
): Promise<SchemaFieldRecord[]> {
  try {
    if (env.CACHE_DB) {
      const d1Res = await env.CACHE_DB.prepare(
        "SELECT field_key, field_path, data_type, occurrence_count, last_seen_at FROM spine_schema_registry WHERE tenant_id = ? AND entity_type = ? ORDER BY occurrence_count DESC"
      )
        .bind(tenantId, entityType)
        .all<any>();
      return (d1Res.results || []) as SchemaFieldRecord[];
    }
    return [];
  } catch {
    return [];
  }
}

function normalizeSpineEntity(
  row: Record<string, any>,
  entityType: string,
  target: SpineTarget | null,
  schemaFields: SchemaFieldRecord[] = []
): Record<string, any> {
  const data = extractEntityData(row, target);
  const completeness = buildCompleteness(data, schemaFields);
  const id = row.id || (target?.pk ? row[target.pk] : null) || row.source_id || null;

  return {
    id,
    object_type: entityType,
    entity_type: entityType,
    tenant_id: row.tenant_id,
    data,
    version: row.version ?? 1,
    created_at: row.created_at || row.updated_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
    ...completeness,
  };
}

async function fetchTypedSpineRows(
  env: Env,
  tenantId: string,
  entityType: string,
  filters: FilterMap,
  pagination: { limit: number; offset: number }
): Promise<{
  rows: Record<string, any>[];
  total: number;
  source: string;
  entityType: string;
  target: SpineTarget | null;
}> {
  return fetchTypedSpineRowsFromD1(env, tenantId, entityType, filters, pagination);
}

async function fetchSingleSpineRow(
  env: Env,
  tenantId: string,
  entityType: string,
  id: string
): Promise<{ row: Record<string, any>; entityType: string; target: SpineTarget | null }> {
  return fetchSingleSpineRowFromD1(env, tenantId, entityType, id);
}

async function handleCompatSpineRoutes(request: Request, env: Env): Promise<Response | null> {
  if (request.method !== "GET") return null;

  const url = new URL(request.url);
  const compatPrefix = "/api/v1/pipeline/spine/";
  const requiresTenantContext =
    url.pathname === "/api/v1/cognitive/spine/entities" ||
    url.pathname === "/v1/spine/entities" ||
    url.pathname.startsWith(compatPrefix);

  const tenantId = request.headers.get("x-tenant-id") || "";
  if (requiresTenantContext && !tenantId) {
    return json({ error: "Missing tenant context" }, { status: 400 });
  }

  if (url.pathname === "/api/v1/cognitive/spine/entities") {
    const requestedType = url.searchParams.get("type");
    if (!requestedType) {
      return spineWorker.fetch(rewriteRequest(request, "/api/entities", url.searchParams), env);
    }

    const result = await fetchTypedSpineRows(
      env,
      tenantId,
      requestedType,
      extractFilters(url),
      getPagination(url)
    );

    return json({
      entities: result.rows.map((row) =>
        normalizeSpineEntity(row, result.entityType, result.target)
      ),
      total: result.total,
      source: result.source,
    });
  }

  if (url.pathname === "/v1/spine/entities") {
    const requestedType = url.searchParams.get("type");
    if (!requestedType) {
      const response = await spineWorker.fetch(
        rewriteRequest(request, "/api/entities", url.searchParams),
        env
      );
      if (!response.ok) return response;
      const payload = (await response.json()) as any;
      return json({
        items: payload.entities || payload.data || [],
        total: payload.total || 0,
        source: payload.source || "public.entities",
      });
    }

    const result = await fetchTypedSpineRows(
      env,
      tenantId,
      requestedType,
      extractFilters(url),
      getPagination(url)
    );

    return json({
      items: result.rows,
      total: result.total,
      source: result.source,
    });
  }

  if (url.pathname.startsWith(compatPrefix)) {
    const segments = url.pathname.slice(compatPrefix.length).split("/").filter(Boolean);

    if (segments.length === 0) {
      return json({ error: "Entity type required" }, { status: 400 });
    }

    const [entityType, second, third] = segments;

    if (segments.length === 1) {
      const result = await fetchTypedSpineRows(
        env,
        tenantId,
        entityType,
        extractFilters(url),
        getPagination(url)
      );

      return json(
        result.rows.map((row) => normalizeSpineEntity(row, result.entityType, result.target))
      );
    }

    if (segments.length === 2 && second === "schema") {
      const resolvedType = resolveEntityType(entityType);
      const fields = await fetchSchemaFields(env, tenantId, resolvedType);
      return json(
        fields.map((field) => ({
          name: field.field_path || field.field_key,
          field_key: field.field_key || field.field_path,
          type: field.data_type || "string",
          data_type: field.data_type || "string",
          status: "observed",
          occurrence_count: field.occurrence_count || 0,
          last_seen_at: field.last_seen_at,
        }))
      );
    }

    if (segments.length === 3 && third === "completeness") {
      try {
        const entity = await fetchSingleSpineRow(env, tenantId, entityType, second);
        const fields = await fetchSchemaFields(env, tenantId, entity.entityType);
        const data = extractEntityData(entity.row, entity.target);
        return json(buildCompleteness(data, fields));
      } catch (error: any) {
        return json({ error: error.message || "Entity not found" }, { status: 404 });
      }
    }

    if (segments.length === 2) {
      try {
        const entity = await fetchSingleSpineRow(env, tenantId, entityType, second);
        const fields = await fetchSchemaFields(env, tenantId, entity.entityType);
        return json(normalizeSpineEntity(entity.row, entity.entityType, entity.target, fields));
      } catch (error: any) {
        return json({ error: error.message || "Entity not found" }, { status: 404 });
      }
    }

    return json({ error: "Unsupported Spine compatibility route" }, { status: 404 });
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check — public (for monitoring)
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "pipeline",
          components: ["normalizer", "spine-v2"],
          ts: Date.now(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ── SERVICE AUTH GATE ──
    // Pipeline is internal-only. Requests must come via service binding (cf-worker header)
    // OR carry the SERVICE_SECRET. Health check is the only public endpoint.
    const cfWorkerHeader = request.headers.get("cf-worker");
    const serviceSecret =
      request.headers.get("x-service-secret") ||
      request.headers.get("authorization")?.replace("Bearer ", "");
    const isServiceBinding = !!cfWorkerHeader; // Service bindings inject this automatically
    const isValidSecret = env.SERVICE_SECRET && serviceSecret === env.SERVICE_SECRET;

    if (!isServiceBinding && !isValidSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized. Pipeline is internal-only." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── BULK MEMORY INDEX (one-shot or scheduled) ──
    if (url.pathname === "/v1/memory/index-bulk" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { tenant_id?: string };
      const tenantId = body.tenant_id || request.headers.get("x-tenant-id") || undefined;
      const result = await indexOrgMemoryBulk(env as any, tenantId);
      return json(result);
    }

    // ── TWIN TOOL SERVER: org + conversational memory search (SERVICE_SECRET) ──
    if (url.pathname === "/v1/memory/org-search" && request.method === "GET") {
      const tenantId = request.headers.get("x-tenant-id");
      if (!tenantId) return json({ error: "x-tenant-id required" }, { status: 400 });
      if (!env.CACHE_DB) return json({ error: "CACHE_DB not configured" }, { status: 500 });

      const q = (url.searchParams.get("q") || "").trim();
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 50);
      const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

      let query =
        "SELECT id, topic, category, content, governance_state, created_at, updated_at FROM org_memory WHERE tenant_id = ? AND governance_state = 'approved'";
      const params: (string | number)[] = [tenantId];
      if (q) {
        query += " AND (content LIKE ? OR topic LIKE ?)";
        const like = `%${q}%`;
        params.push(like, like);
      }
      query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const result = await env.CACHE_DB.prepare(query)
        .bind(...params)
        .all();
      const rows = result.results || [];
      return json({
        success: true,
        data: rows,
        count: rows.length,
        offset,
        limit,
        has_more: rows.length === limit,
      });
    }

    if (url.pathname === "/v1/memory/conversational-search" && request.method === "GET") {
      const tenantId = request.headers.get("x-tenant-id");
      if (!tenantId) return json({ error: "x-tenant-id required" }, { status: 400 });
      if (!env.CACHE_DB) return json({ error: "CACHE_DB not configured" }, { status: 500 });

      const q = (url.searchParams.get("q") || "").trim();
      const hours = parseInt(url.searchParams.get("hours") || "0", 10);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 50);

      let query =
        "SELECT id, session_id, model, role, content, created_at FROM conversational_memory WHERE tenant_id = ?";
      const params: (string | number)[] = [tenantId];

      if (hours > 0) {
        const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();
        query += " AND created_at >= ?";
        params.push(cutoff);
      }
      if (q) {
        query += " AND content LIKE ?";
        params.push(`%${q}%`);
      }
      query += " ORDER BY created_at DESC LIMIT ?";
      params.push(limit);

      const result = await env.CACHE_DB.prepare(query)
        .bind(...params)
        .all();
      return json({
        success: true,
        data: result.results || [],
        count: result.results?.length || 0,
      });
    }

    // ── STRICT TENANT BOUNDARY GUARD ──
    // The pipeline is the exclusive gateway to the Supabase SSOT.
    // Except for internal system routes, EVERY request MUST have a valid tenant context.
    const isInternalSystemRoute =
      url.pathname.startsWith("/api/v1/memory") ||
      url.pathname.startsWith("/v1/memory/write") ||
      url.pathname.startsWith("/api/v1/governance/");

    if (!isInternalSystemRoute) {
      const tenantId = request.headers.get("x-tenant-id");
      if (!tenantId) {
        return new Response(
          JSON.stringify({
            error:
              "Missing x-tenant-id header. Pipeline boundary strictly requires tenant isolation.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Entity 360: rewrite Gateway paths to spine-v2 internal paths
    if (
      url.pathname.startsWith("/api/v1/entity360") ||
      url.pathname.startsWith("/api/v1/cognitive/entity360")
    ) {
      const rewrittenPath = url.pathname
        .replace("/api/v1/cognitive/entity360", "/api/entity360")
        .replace("/api/v1/entity360", "/api/entity360");
      return spineWorker.fetch(rewriteRequest(request, rewrittenPath, url.searchParams), env);
    }

    // --- PIPELINE READ PATHS (Supabase-Bypassing Edge Spine) ---
    if (url.pathname === "/api/v1/pipeline/entities" && request.method === "GET") {
      const tenantId = request.headers.get("x-tenant-id") || "";
      if (!tenantId) return json({ error: "Missing tenant context" }, { status: 400 });

      const requestedType = url.searchParams.get("type");
      if (!requestedType) return json({ error: "Entity type parameter required" }, { status: 400 });

      try {
        const result = await fetchTypedSpineRowsFromD1(
          env,
          tenantId,
          requestedType,
          extractFilters(url),
          getPagination(url)
        );
        return json({
          entities: result.rows,
          total: result.total,
          source: result.source,
        });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname === "/api/v1/pipeline/entities/batch" && request.method === "POST") {
      const tenantId = request.headers.get("x-tenant-id") || "";
      if (!tenantId) return json({ error: "Missing tenant context" }, { status: 400 });

      try {
        const body = (await request.json()) as {
          types?: string[];
          filters?: Record<string, any>;
          limit?: number;
          offset?: number;
          domain?: string;
          workspace?: string;
        };
        const types = body.types || [];
        const filters = body.filters || {};
        const limit = body.limit || 50;
        const offset = body.offset || 0;
        const workspace = body.domain || body.workspace || undefined;

        const results: Record<string, any[]> = {};
        for (const type of types) {
          const res = await fetchTypedSpineRowsFromD1(env, tenantId, type, filters, {
            limit,
            offset,
            workspace,
          });
          results[type] = res.rows;
        }

        return json({ results, workspace });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname === "/api/v1/pipeline/entities/counts" && request.method === "GET") {
      const tenantId = request.headers.get("x-tenant-id") || "";
      if (!tenantId) return json({ error: "Missing tenant context" }, { status: 400 });

      const typesCsv = url.searchParams.get("types") || "";
      const types = typesCsv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      try {
        const counts: Record<string, number> = {};
        for (const type of types) {
          const domain = getDomainForType(type);
          const tableName = `${domain}_data`;
          const matchingTypes = getMatchingTypesForQuery(type);
          const placeholders = matchingTypes.map(() => "?").join(", ");
          const countRes = await env.CACHE_DB.prepare(
            `SELECT COUNT(*) as total FROM ${tableName} WHERE type IN (${placeholders}) AND tenant_id = ?`
          )
            .bind(...matchingTypes, tenantId)
            .first<{ total: number }>();
          counts[type] = countRes?.total || 0;
        }
        return json({ counts });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname === "/api/v1/pipeline/links" && request.method === "GET") {
      const sourceId = url.searchParams.get("source_id");
      const targetId = url.searchParams.get("target_id");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

      let query = "SELECT * FROM link_data WHERE 1=1";
      const params: string[] = [];

      if (sourceId) {
        query += " AND source_id = ?";
        params.push(sourceId);
      }
      if (targetId) {
        query += " AND target_id = ?";
        params.push(targetId);
      }

      query += " ORDER BY created_at DESC LIMIT ?";
      params.push(String(limit));

      try {
        const result = await env.CACHE_DB.prepare(query)
          .bind(...params)
          .all();
        return json({ success: true, data: result.results });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname === "/api/v1/pipeline/links" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          source_id: string;
          source_domain: string;
          target_id: string;
          target_domain: string;
          relationship_type: string;
          data?: Record<string, any>;
        };

        if (
          !body.source_id ||
          !body.source_domain ||
          !body.target_id ||
          !body.target_domain ||
          !body.relationship_type
        ) {
          return json({ error: "Missing required fields for relationship link" }, { status: 400 });
        }

        const id = `${body.source_id}:${body.target_id}:${body.relationship_type}`;
        const now = new Date().toISOString();

        await env.CACHE_DB.prepare(
          `INSERT INTO link_data (id, source_id, source_domain, target_id, target_domain, relationship_type, data, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             data = excluded.data`
        )
          .bind(
            id,
            body.source_id,
            body.source_domain,
            body.target_id,
            body.target_domain,
            body.relationship_type,
            JSON.stringify(body.data || {}),
            now
          )
          .run();

        return json({ success: true, id });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    const compatResponse = await handleCompatSpineRoutes(request, env);
    if (compatResponse) {
      return compatResponse;
    }

    // ── Continuity Ledger (AI Search) ──
    if (url.pathname === "/api/v1/continuity/ingest" && request.method === "POST") {
      const tenantId = request.headers.get("x-tenant-id") || "";
      if (!tenantId) return json({ error: "Missing tenant context" }, { status: 400 });

      try {
        const body = await request.json();
        const id = await uploadContinuityEvent(env, body, tenantId);
        return json({
          success: true,
          id,
          message: "Continuity event successfully uploaded to AI Search index.",
        });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    // ── Supabase PostgREST DB Proxy (Zero Trust) ──
    if (url.pathname === "/api/v1/db-proxy" && request.method === "POST") {
      return json(
        {
          error:
            "Legacy Supabase db-proxy disabled (DECISION 22). All services must query and write to D1 directly.",
        },
        { status: 410 }
      );
    }

    // ── Memory Write Endpoint (Intelligence/Continuity → Pipeline → D1) ──
    // 100% Cloudflare (DECISION 22): memory writes land in D1 directly. No PostgREST.
    if (url.pathname === "/v1/memory/write" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          table: string;
          operation: "insert" | "upsert" | "delete";
          data: Record<string, any> | Record<string, any>[];
        };

        const { table, operation, data } = body;
        const validTables = [
          "conversational_memory",
          "org_memory",
          "personal_memory",
          "triage_results",
        ];
        if (!validTables.includes(table)) {
          return json(
            { error: `Invalid table: ${table}. Valid: ${validTables.join(", ")}` },
            { status: 400 }
          );
        }
        if (!data) {
          return json({ error: "data is required" }, { status: 400 });
        }
        if (!env.CACHE_DB) {
          return json({ error: "D1 binding (CACHE_DB) unavailable" }, { status: 503 });
        }

        const writeNow = new Date().toISOString();
        const rows = (Array.isArray(data) ? data : [data]).map((r) => ({
          ...r,
          created_at: r.created_at || writeNow,
          updated_at: r.updated_at || r.created_at || writeNow,
        }));

        if (operation === "delete") {
          const ids = rows.map((r) => r.id).filter(Boolean);
          if (ids.length === 0) return json({ error: "No ids to delete" }, { status: 400 });
          await syncDbProxyWriteToEdge(env.CACHE_DB, table, "DELETE", rows);
          return json({ success: true, deleted: ids.length });
        }

        // insert | upsert → D1 INSERT ... ON CONFLICT(id) DO UPDATE
        await syncDbProxyWriteToEdge(env.CACHE_DB, table, "UPSERT", rows);
        return json({ success: true, data: rows });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    // ── Spine WRITE paths: D1 primary (spine-v2 Supabase writer retired) ──
    // Per DECISION 22 + mapping: writes go exclusively to D1 ${domain}_data via writeToEntityCache.
    // Legacy spine-v2 kept only for read compat if needed.
    const isSpineWrite =
      (url.pathname === "/api/write" && request.method === "POST") ||
      (url.pathname.startsWith("/v1/spine/") && request.method === "POST");

    if (isSpineWrite) {
      let body: any = null;
      try {
        body = (await request.clone().json()) as any;
      } catch (err) {
        console.error(`[Pipeline:PreParse] Failed to parse request body:`, err);
      }

      const tenantId = request.headers.get("x-tenant-id") || body?.tenant_id || "";
      const entities = body?.entities || [];

      // Always prefer D1 write for spine data.
      if (env.CACHE_DB && env.CACHE && entities.length) {
        const normalizedRecords = entities.map((e: any) => ({
          id: e.id || crypto.randomUUID(),
          tenant_id: e.tenant_id || tenantId,
          type: e.entity_type || e.type,
          source: e.source,
          source_id: e.source_id,
          data: e.data || e,
          created_at: e.created_at,
          updated_at: e.updated_at,
          version: e.version || 1,
        }));

        for (const rec of normalizedRecords) {
          try {
            await writeToEntityCache(env.CACHE_DB, env.CACHE, rec as any);
          } catch (wErr) {
            console.warn("[Pipeline] D1 writeToEntityCache failed:", wErr);
          }
        }
      }

      // For writes, D1 is authoritative. Return success. (No legacy spine-v2 call for writes.)
      return json({ success: true, written: entities.length, via: "d1-primary" });
    }

    // Spine routes: entity reads, dashboard, signals
    if (
      url.pathname === "/api/entities" ||
      url.pathname.startsWith("/api/entities/") ||
      url.pathname === "/api/entity" ||
      url.pathname.startsWith("/api/entity/") ||
      url.pathname === "/api/signals" ||
      url.pathname.startsWith("/api/signals/") ||
      url.pathname === "/api/dashboard" ||
      url.pathname.startsWith("/api/dashboard/") ||
      url.pathname === "/v1/spine/entities" ||
      url.pathname.startsWith("/v1/spine/") ||
      url.pathname === "/spine" ||
      url.pathname.startsWith("/spine/") ||
      url.pathname === "/api/v1/memory" ||
      url.pathname.startsWith("/api/v1/memory/")
    ) {
      return spineWorker.fetch(request, env);
    }

    // Default: normalizer handles pipeline status/monitoring
    return normalizerWorker.fetch(request, env as any);
  },

  /**
   * Queue consumer handles two queue bindings:
   *  - "pipeline-process": PipelineQueueMessage records for the 8-stage normalizer
   *  - "accelerator-trigger": lightweight spine_write events for metric computation
   *
   * Both are routed through the same handler — the queue name discriminator
   * determines which path executes.
   */
  async queue(
    batch: MessageBatch<PipelineQueueMessage | Record<string, unknown>>,
    env: Env
  ): Promise<void> {
    const queueName = (batch as any).queue;

    // Memory Promotion: spine.written events → score → governed Memory (Phase 5).
    if (queueName === "memory-promote") {
      await handleMemoryPromoteBatch(batch as unknown as MessageBatch<SpineWriteEvent>, {
        CACHE_DB: env.CACHE_DB,
        AI_SEARCH: env.AI_SEARCH,
      });
      return;
    }

    // Accelerator triggers: compute domain metrics from spine data
    if (queueName === "accelerator-trigger") {
      for (const msg of batch.messages) {
        const body = msg.body as any;
        try {
          // Fetch recent spine data for this tenant
          const spineRes = await spineWorker.fetch(
            new Request(`http://spine/api/entities?limit=100`, {
              headers: { "x-tenant-id": body.tenant_id || "" },
            }),
            env
          );
          const spineData = spineRes.ok ? ((await spineRes.json()) as any) : { entities: [] };
          const entities = spineData.entities || spineData.data || [];

          // Compute accelerator metrics and emit as intelligence signals
          if (entities.length > 0 && env.INTELLIGENCE_QUEUE) {
            await env.INTELLIGENCE_QUEUE.send({
              type: "accelerator_result",
              tenant_id: body.tenant_id,
              entity_count: entities.length,
              computed_at: new Date().toISOString(),
              metrics: {
                total_entities: entities.length,
                by_type: entities.reduce((acc: Record<string, number>, e: any) => {
                  const t = e.entity_type || e.object_type || "unknown";
                  acc[t] = (acc[t] || 0) + 1;
                  return acc;
                }, {}),
              },
              trace_id: body.trace_id,
            });
          }
          msg.ack();
        } catch (err: any) {
          console.error(`[Pipeline:Accelerator] Failed: ${err.message}`);
          msg.retry();
        }
      }
      return;
    }

    // Standard pipeline processing (normalizer)
    // Env cast needed: pipeline Env binds D1 as CACHE_DB, normalizer expects D1
    const normalizerEnv: Env = {
      ...env,
      D1: env.CACHE_DB,
    };
    return normalizerWorker.queue(
      batch as MessageBatch<PipelineQueueMessage>,
      normalizerEnv as any
    );
  },
};
