/**
 * Memory Indexer — Bulk index org_memory entries into Cloudflare AI Search
 *
 * Reads approved org_memory entries from D1, uploads each as markdown
 * to AI Search (which handles embedding with bge-base-en-v1.5 automatically).
 *
 * Endpoint: POST /v1/memory/index-bulk
 * Trigger: one-shot after initial load, or scheduled for ongoing sync
 *
 * Zero external API calls. Zero cost. All Cloudflare-native.
 */

interface IndexerEnv {
  CACHE_DB: D1Database;
  AI_SEARCH: any;
}

interface OrgMemoryRow {
  id: string;
  tenant_id: string;
  topic: string;
  category: string;
  content: string;
  source_session_id: string | null;
  governance_state: string;
  confidence: number | null;
  metadata: string;
  created_at: string;
  updated_at: string;
  related_entity_ids: string | null;
  related_departments: string | null;
}

/**
 * Index all approved org_memory entries into AI Search.
 * Idempotent — re-uploading the same ID overwrites.
 */
export async function indexOrgMemoryBulk(
  env: IndexerEnv,
  tenantId?: string
): Promise<{ indexed: number; errors: number; skipped: number }> {
  if (!env.AI_SEARCH) {
    console.warn("[MemoryIndexer] AI_SEARCH binding not configured — skipping");
    return { indexed: 0, errors: 0, skipped: 0 };
  }
  if (!env.CACHE_DB) {
    throw new Error("CACHE_DB (D1) binding not configured");
  }

  const instance = env.AI_SEARCH.get("integratewise-knowledge");

  // Query all approved org_memory entries
  const query = tenantId
    ? `SELECT * FROM org_memory WHERE governance_state = 'approved' AND tenant_id = ? ORDER BY created_at DESC LIMIT 2000`
    : `SELECT * FROM org_memory WHERE governance_state = 'approved' ORDER BY created_at DESC LIMIT 2000`;

  const bindings = tenantId ? [tenantId] : [];
  const result = await env.CACHE_DB.prepare(query)
    .bind(...bindings)
    .all<OrgMemoryRow>();

  if (!result.results || result.results.length === 0) {
    return { indexed: 0, errors: 0, skipped: 0 };
  }

  let indexed = 0;
  let errors = 0;
  let skipped = 0;

  // Process in batches of 10 (AI Search has per-request limits)
  const BATCH_SIZE = 10;
  const entries = result.results;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    const uploads = batch.map(async (entry) => {
      // Skip entries with no content
      if (!entry.content || entry.content.trim().length < 20) {
        skipped++;
        return;
      }

      const entityRefs = entry.related_entity_ids ? JSON.parse(entry.related_entity_ids) : [];
      const departments = entry.related_departments ? JSON.parse(entry.related_departments) : [];

      // Build markdown content for AI Search indexing
      const markdownContent = `
# ${entry.topic || "Untitled"}

**Category:** ${entry.category}
**Confidence:** ${entry.confidence || "N/A"}
**Department:** ${departments.join(", ") || "general"}
**Date:** ${entry.created_at}

---

${entry.content.slice(0, 8000)}
`.trim();

      const docId = `orgmem-${entry.id}`;

      try {
        await instance.items.upload(`${docId}.md`, markdownContent, {
          metadata: {
            type: "org_memory",
            category: entry.category,
            tenant_id: entry.tenant_id,
            confidence: entry.confidence,
            governance_state: entry.governance_state,
            entity_refs: entityRefs,
            departments,
            source: entry.source_session_id || "initial_load",
            created_at: entry.created_at,
          },
        });
        indexed++;
      } catch (err: any) {
        console.error(`[MemoryIndexer] Failed to index ${entry.id}:`, err.message);
        errors++;
      }
    });

    await Promise.all(uploads);

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < entries.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log(`[MemoryIndexer] Complete: ${indexed} indexed, ${errors} errors, ${skipped} skipped`);

  return { indexed, errors, skipped };
}

/**
 * Index a single new org_memory entry (called after Triage Bot approves).
 */
export async function indexSingleMemory(
  env: IndexerEnv,
  entry: {
    id: string;
    tenant_id: string;
    topic: string;
    category: string;
    content: string;
    confidence: number;
    entity_refs: string[];
    departments: string[];
  }
): Promise<boolean> {
  if (!env.AI_SEARCH) return false;

  const instance = env.AI_SEARCH.get("integratewise-knowledge");

  const markdownContent = `
# ${entry.topic}

**Category:** ${entry.category}
**Confidence:** ${entry.confidence}
**Department:** ${entry.departments.join(", ")}

---

${entry.content.slice(0, 8000)}
`.trim();

  try {
    await instance.items.upload(`orgmem-${entry.id}.md`, markdownContent, {
      metadata: {
        type: "org_memory",
        category: entry.category,
        tenant_id: entry.tenant_id,
        confidence: entry.confidence,
        governance_state: "approved",
        entity_refs: entry.entity_refs,
        departments: entry.departments,
        created_at: new Date().toISOString(),
      },
    });
    return true;
  } catch (err: any) {
    console.error(`[MemoryIndexer] Single index failed for ${entry.id}:`, err.message);
    return false;
  }
}
