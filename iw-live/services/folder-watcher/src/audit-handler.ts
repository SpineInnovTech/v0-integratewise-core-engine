/**
 * Audit Log Handler for Folder Watcher
 *
 * Detects audit-spine-*.jsonl files in Conversation memory/
 * Parses audit events and:
 * 1. Writes to D1 spine_audit_log table (SQL storage)
 * 2. Indexes to AI Search for semantic queries (vector storage)
 *
 * Pipeline: Agent → audit-spine-[session-id].jsonl → Folder Watcher → D1 + AI Search
 *
 * Authority: AGENTS.md Rule 8 (Agent Continuity Protocol)
 */

export interface SpineAuditEvent {
  timestamp: string;
  session_id: string;
  event: "spine_read" | "spine_write" | "spine_search" | "spine_list";
  entity_type: string;
  entity_id?: string;
  via: "mcp" | "pipeline" | "direct";
  tool?: string;
  operation?: "create" | "update" | "delete";
  fields_changed?: string[];
  query?: string;
  limit?: number;
  offset?: number;
  results_count?: number;
  tenant_id: string;
  result: "success" | "error" | "denied";
  error_message?: string;
  duration_ms: number;
}

export interface Env {
  SPINE_CACHE_DB: D1Database;
  AI_SEARCH?: any; // Cloudflare AI Search binding for vector indexing
}

/**
 * Process audit log file and write events to D1 + AI Search
 */
export async function processAuditLog(
  content: string,
  filePath: string,
  env: Env
): Promise<{ processed: number; errors: number; indexed: number }> {
  const lines = content.trim().split("\n");
  let processed = 0;
  let errors = 0;
  let indexed = 0;

  console.log(`[AuditHandler] Processing ${lines.length} audit events from ${filePath}`);

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const event: SpineAuditEvent = JSON.parse(line);

      // Validate required fields
      if (!event.timestamp || !event.session_id || !event.event || !event.tenant_id) {
        console.error(`[AuditHandler] Missing required fields in event:`, line);
        errors++;
        continue;
      }

      // Validate event type
      if (!["spine_read", "spine_write", "spine_search", "spine_list"].includes(event.event)) {
        console.error(`[AuditHandler] Invalid event type: ${event.event}`);
        errors++;
        continue;
      }

      // 1. Insert into D1
      await insertAuditEvent(env.SPINE_CACHE_DB, event);
      processed++;

      // 2. Index to AI Search for semantic queries
      if (env.AI_SEARCH) {
        try {
          await indexAuditEventToAISearch(env.AI_SEARCH, event);
          indexed++;
        } catch (searchErr) {
          console.error(`[AuditHandler] AI Search indexing failed:`, searchErr);
          // Don't count as error - D1 write succeeded
        }
      }
    } catch (error) {
      console.error(`[AuditHandler] Failed to process line:`, line, error);
      errors++;
    }
  }

  console.log(
    `[AuditHandler] Processed ${processed} events, ${errors} errors, ${indexed} indexed to AI Search`
  );
  return { processed, errors, indexed };
}

/**
 * Insert single audit event into D1
 */
async function insertAuditEvent(db: D1Database, event: SpineAuditEvent): Promise<void> {
  const id = generateAuditId();

  await db
    .prepare(
      `INSERT INTO spine_audit_log (
        id, timestamp, session_id, event, entity_type, entity_id,
        via, tool, operation, fields_changed, query, limit, offset, results_count,
        tenant_id, result, error_message, duration_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      id,
      event.timestamp,
      event.session_id,
      event.event,
      event.entity_type,
      event.entity_id || null,
      event.via,
      event.tool || null,
      event.operation || null,
      event.fields_changed ? JSON.stringify(event.fields_changed) : null,
      event.query || null,
      event.limit || null,
      event.offset || null,
      event.results_count || null,
      event.tenant_id,
      event.result,
      event.error_message || null,
      event.duration_ms
    )
    .run();
}

/**
 * Index audit event to AI Search for semantic queries
 * Enables queries like: "show me all failed account writes in last 24h"
 */
async function indexAuditEventToAISearch(aiSearch: any, event: SpineAuditEvent): Promise<void> {
  const instance = aiSearch.get("integratewise-knowledge");
  if (!instance) {
    console.warn(`[AuditHandler] AI Search instance 'integratewise-knowledge' not found`);
    return;
  }

  // Create searchable text representation
  const searchableText = createSearchableText(event);

  // Generate document ID
  const docId = `spine-audit-${event.session_id}-${event.timestamp}`;

  // Upload to AI Search with metadata
  await instance.items.upload(docId, searchableText, {
    metadata: {
      type: "spine_audit",
      session_id: event.session_id,
      event_type: event.event,
      entity_type: event.entity_type,
      entity_id: event.entity_id || "",
      tenant_id: event.tenant_id,
      result: event.result,
      via: event.via,
      timestamp: event.timestamp,
    },
  });

  console.log(`[AuditHandler] Indexed audit event to AI Search: ${docId}`);
}

/**
 * Create searchable text from audit event for semantic search
 */
function createSearchableText(event: SpineAuditEvent): string {
  const parts: string[] = [];

  // Event description
  parts.push(`Spine ${event.event.replace("spine_", "")} operation`);

  // Entity details
  parts.push(`Entity type: ${event.entity_type}`);
  if (event.entity_id) {
    parts.push(`Entity ID: ${event.entity_id}`);
  }

  // Operation details
  if (event.operation) {
    parts.push(`Operation: ${event.operation}`);
  }
  if (event.fields_changed && event.fields_changed.length > 0) {
    parts.push(`Fields modified: ${event.fields_changed.join(", ")}`);
  }
  if (event.query) {
    parts.push(`Search query: ${event.query}`);
  }

  // Result and timing
  parts.push(`Result: ${event.result}`);
  parts.push(`Duration: ${event.duration_ms}ms`);
  if (event.error_message) {
    parts.push(`Error: ${event.error_message}`);
  }

  // Access method
  parts.push(`Accessed via: ${event.via}`);
  if (event.tool) {
    parts.push(`Tool: ${event.tool}`);
  }

  // Session context
  parts.push(`Session: ${event.session_id}`);
  parts.push(`Timestamp: ${event.timestamp}`);
  parts.push(`Tenant: ${event.tenant_id}`);

  return parts.join("\n");
}

/**
 * Generate unique audit ID
 */
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if file is an audit log
 */
export function isAuditLogFile(path: string): boolean {
  return path.includes("audit-spine-") && path.endsWith(".jsonl");
}
