/**
 * Identity Resolution API
 *
 * HITL endpoints for reviewing and resolving merge candidates.
 * S7.5 detects duplicates → this API lets humans resolve them.
 *
 * Actions:
 * - merge: Combine two records into one canonical entity
 * - keep_separate: Mark as not duplicates (suppress future matching)
 * - defer: Revisit later
 */

import { Hono } from "hono";

interface Env {
  D1?: D1Database;
  // Legacy Supabase for merges/entities during desupabase. D1 merge_candidates + entity_* tables preferred (see pipeline/spine).
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SPINE?: Fetcher;
}

const identity = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════════════════════════
// LIST MERGE CANDIDATES
// ═══════════════════════════════════════════════════════════════════════════════

identity.get("/v1/identity/candidates", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const db = c.env.D1;
  if (!db) return c.json({ error: "D1 not available" }, 503);

  const status = c.req.query("status") || "pending";
  const entityType = c.req.query("entity_type");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  let query = `
    SELECT mc.*, 
      sa.email as email_a, sa.name as name_a, sa.domain as domain_a, sa.phone as phone_a,
      sb.email as email_b, sb.name as name_b, sb.domain as domain_b, sb.phone as phone_b
    FROM merge_candidates mc
    LEFT JOIN entity_signatures sa 
      ON sa.tenant_id = mc.tenant_id AND sa.entity_type = mc.entity_type 
      AND sa.source_system = mc.source_a AND sa.external_id = mc.external_id_a
    LEFT JOIN entity_signatures sb 
      ON sb.tenant_id = mc.tenant_id AND sb.entity_type = mc.entity_type 
      AND sb.source_system = mc.source_b AND sb.external_id = mc.external_id_b
    WHERE mc.tenant_id = ? AND mc.status = ?
  `;
  const params: any[] = [tenantId, status];

  if (entityType) {
    query += " AND mc.entity_type = ?";
    params.push(entityType);
  }

  query += " ORDER BY mc.confidence DESC, mc.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();

  // Get total count
  let countQuery =
    "SELECT COUNT(*) as total FROM merge_candidates WHERE tenant_id = ? AND status = ?";
  const countParams: any[] = [tenantId, status];
  if (entityType) {
    countQuery += " AND entity_type = ?";
    countParams.push(entityType);
  }
  const countResult = await db
    .prepare(countQuery)
    .bind(...countParams)
    .first<{ total: number }>();

  return c.json({
    candidates: result.results || [],
    total: countResult?.total || 0,
    status,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET SINGLE CANDIDATE WITH FULL ENTITY DATA
// ═══════════════════════════════════════════════════════════════════════════════

identity.get("/v1/identity/candidates/:id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const db = c.env.D1;
  if (!db) return c.json({ error: "D1 not available" }, 503);

  const candidateId = c.req.param("id");

  const candidate = await db
    .prepare("SELECT * FROM merge_candidates WHERE id = ? AND tenant_id = ?")
    .bind(candidateId, tenantId)
    .first();

  if (!candidate) return c.json({ error: "Candidate not found" }, 404);

  // Fetch both entities from Supabase for side-by-side comparison
  const [entityA, entityB] = await Promise.all([
    fetchEntity(c.env, tenantId, candidate.source_a as string, candidate.external_id_a as string),
    fetchEntity(c.env, tenantId, candidate.source_b as string, candidate.external_id_b as string),
  ]);

  return c.json({
    candidate,
    entity_a: entityA,
    entity_b: entityB,
    matched_fields: JSON.parse((candidate.matched_fields as string) || "[]"),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESOLVE: MERGE
// ═══════════════════════════════════════════════════════════════════════════════

identity.post("/v1/identity/candidates/:id/merge", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id") || "system";
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const db = c.env.D1;
  if (!db) return c.json({ error: "D1 not available" }, 503);

  const candidateId = c.req.param("id");
  const body = (await c.req.json()) as {
    primary_source: string;
    primary_external_id: string;
    merge_strategy?: "keep_primary" | "merge_fields";
  };

  const candidate = await db
    .prepare("SELECT * FROM merge_candidates WHERE id = ? AND tenant_id = ? AND status = 'pending'")
    .bind(candidateId, tenantId)
    .first();

  if (!candidate) return c.json({ error: "Candidate not found or already resolved" }, 404);

  // Determine which is primary and which is secondary
  const isPrimaryA =
    body.primary_source === candidate.source_a &&
    body.primary_external_id === candidate.external_id_a;
  const secondarySource = isPrimaryA ? candidate.source_b : candidate.source_a;
  const secondaryExternalId = isPrimaryA ? candidate.external_id_b : candidate.external_id_a;

  // Record the merge in Supabase for audit (legacy; D1 merge_candidates is primary)
  try {
    if (c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_ROLE_KEY) {
      await fetch(`${c.env.SUPABASE_URL}/rest/v1/entity_merges`, {
        method: "POST",
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          entity_type: candidate.entity_type,
          primary_source: body.primary_source,
          primary_external_id: body.primary_external_id,
          secondary_source: secondarySource,
          secondary_external_id: secondaryExternalId,
          merge_strategy: body.merge_strategy || "keep_primary",
          confidence: candidate.confidence,
          merged_by: userId,
          merged_at: new Date().toISOString(),
        }),
      });
    } else {
      console.warn("[Identity] Supabase merge audit skipped (no keys — using D1 merge_candidates)");
    }
  } catch (err) {
    console.warn("[Identity] Failed to record merge in Supabase:", err);
  }

  // Update candidate status
  await db
    .prepare(
      "UPDATE merge_candidates SET status = 'merged', resolved_by = ?, resolved_at = datetime('now') WHERE id = ?"
    )
    .bind(userId, candidateId)
    .run();

  return c.json({
    success: true,
    action: "merged",
    primary: { source: body.primary_source, external_id: body.primary_external_id },
    secondary: { source: secondarySource, external_id: secondaryExternalId },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESOLVE: KEEP SEPARATE
// ═══════════════════════════════════════════════════════════════════════════════

identity.post("/v1/identity/candidates/:id/keep-separate", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id") || "system";
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const db = c.env.D1;
  if (!db) return c.json({ error: "D1 not available" }, 503);

  const candidateId = c.req.param("id");

  const candidate = await db
    .prepare("SELECT * FROM merge_candidates WHERE id = ? AND tenant_id = ? AND status = 'pending'")
    .bind(candidateId, tenantId)
    .first();

  if (!candidate) return c.json({ error: "Candidate not found or already resolved" }, 404);

  await db
    .prepare(
      "UPDATE merge_candidates SET status = 'rejected', resolved_by = ?, resolved_at = datetime('now') WHERE id = ?"
    )
    .bind(userId, candidateId)
    .run();

  return c.json({ success: true, action: "kept_separate" });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESOLVE: DEFER
// ═══════════════════════════════════════════════════════════════════════════════

identity.post("/v1/identity/candidates/:id/defer", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id") || "system";
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const db = c.env.D1;
  if (!db) return c.json({ error: "D1 not available" }, 503);

  const candidateId = c.req.param("id");

  await db
    .prepare(
      "UPDATE merge_candidates SET status = 'deferred', resolved_by = ?, resolved_at = datetime('now') WHERE id = ?"
    )
    .bind(userId, candidateId)
    .run();

  return c.json({ success: true, action: "deferred" });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

identity.get("/v1/identity/stats", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const db = c.env.D1;
  if (!db) return c.json({ error: "D1 not available" }, 503);

  const stats = await db
    .prepare(
      `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(confidence) as avg_confidence
      FROM merge_candidates 
      WHERE tenant_id = ?
      GROUP BY status
    `
    )
    .bind(tenantId)
    .all();

  const signatures = await db
    .prepare("SELECT COUNT(*) as total FROM entity_signatures WHERE tenant_id = ?")
    .bind(tenantId)
    .first<{ total: number }>();

  return c.json({
    merge_candidates: stats.results || [],
    total_signatures: signatures?.total || 0,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchEntity(
  env: Env,
  tenantId: string,
  source: string,
  externalId: string
): Promise<Record<string, any> | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null; // D1 entities (domain_data) + merge_candidates are the source of truth
  }
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/entities?tenant_id=eq.${tenantId}&source=eq.${source}&source_id=eq.${externalId}&select=*&limit=1`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as any[];
    return rows[0] || null;
  } catch {
    return null;
  }
}

export { identity };
