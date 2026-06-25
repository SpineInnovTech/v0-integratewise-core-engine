/**
 * Trust Score Routes
 * Source reliability and autonomy control
 *
 * Constitutional Compliance:
 * - Clause 2: Source Trust Physics (reliability scoring)
 * - Clause 5: Autonomy Kill Hierarchy (override system)
 */

import { Hono } from "hono";
import { z } from "zod";

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
};

export const trustScoreRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Schemas
// ============================================================================
const SourceReliabilitySchema = z.object({
  source_name: z.string(),
  source_type: z.enum(["system", "integration", "user_input", "inference"]),
  initial_score: z.number().min(0).max(1).default(0.5),
});

const AutonomyOverrideSchema = z.object({
  override_level: z.enum(["global", "entity_type", "entity"]),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  max_autonomy_level: z.number().min(0).max(3),
  reason: z.string(),
  expires_at: z.string().datetime().optional(),
});

// ============================================================================
// GET /v1/trust/sources - List source reliabilities
// ============================================================================
trustScoreRoutes.get("/sources", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const { results } = await c.env.DB.prepare(
      `
            SELECT * FROM source_reliability 
            WHERE tenant_id = ? AND status = 'active'
            ORDER BY reliability_score DESC
        `
    )
      .bind(tenantId)
      .all();

    return c.json({ sources: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// POST /v1/trust/sources - Register a new source
// ============================================================================
trustScoreRoutes.post("/sources", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const body = await c.req.json();
    const data = SourceReliabilitySchema.parse(body);
    const id = crypto.randomUUID();

    await c.env.DB.prepare(
      `
            INSERT INTO source_reliability (
                id, tenant_id, source_name, source_type, reliability_score, status
            ) VALUES (?, ?, ?, ?, ?, 'active')
        `
    )
      .bind(id, tenantId, data.source_name, data.source_type, data.initial_score)
      .run();

    return c.json({ id, success: true }, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: err.errors }, 400);
    }
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/trust/scores/:entity_type/:entity_id - Get trust score for entity
// ============================================================================
trustScoreRoutes.get("/scores/:entity_type/:entity_id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const entityType = c.req.param("entity_type");
  const entityId = c.req.param("entity_id");

  try {
    const score = await c.env.DB.prepare(
      `
            SELECT * FROM trust_scores 
            WHERE tenant_id = ? AND entity_type = ? AND entity_id = ?
        `
    )
      .bind(tenantId, entityType, entityId)
      .first();

    if (!score) {
      // Return default trust score
      return c.json({
        entity_type: entityType,
        entity_id: entityId,
        composite_score: 0.5,
        effective_autonomy_level: 1,
        is_default: true,
      });
    }

    // Get effective autonomy considering overrides (Clause 5)
    const effectiveAutonomy = await getEffectiveAutonomy(c.env.DB, tenantId, entityType, entityId);

    return c.json({
      ...score,
      effective_autonomy_level: effectiveAutonomy,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/trust/autonomy - Get effective autonomy level (Clause 5)
// ============================================================================
trustScoreRoutes.get("/autonomy/:entity_type/:entity_id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const entityType = c.req.param("entity_type");
  const entityId = c.req.param("entity_id");

  try {
    const effectiveAutonomy = await getEffectiveAutonomy(c.env.DB, tenantId, entityType, entityId);

    return c.json({
      entity_type: entityType,
      entity_id: entityId,
      effective_autonomy_level: effectiveAutonomy.level,
      override_active: effectiveAutonomy.override_active,
      override_reason: effectiveAutonomy.override_reason,
      override_hierarchy: "global > entity_type > entity (Clause 5)",
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// POST /v1/trust/overrides - Create autonomy override (Clause 5)
// ============================================================================
trustScoreRoutes.post("/overrides", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const createdBy = c.req.header("x-user-id");
  if (!createdBy) return c.json({ error: "x-user-id required for overrides" }, 400);

  try {
    const body = await c.req.json();
    const data = AutonomyOverrideSchema.parse(body);
    const id = crypto.randomUUID();

    await c.env.DB.prepare(
      `
            INSERT INTO autonomy_overrides (
                id, tenant_id, override_level, entity_type, entity_id,
                max_autonomy_level, reason, expires_at, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    )
      .bind(
        id,
        tenantId,
        data.override_level,
        data.entity_type || null,
        data.entity_id || null,
        data.max_autonomy_level,
        data.reason,
        data.expires_at || null,
        createdBy
      )
      .run();

    return c.json(
      {
        id,
        success: true,
        message: "Autonomy override created (Clause 5 Kill Hierarchy)",
      },
      201
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: err.errors }, 400);
    }
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/trust/overrides - List active overrides
// ============================================================================
trustScoreRoutes.get("/overrides", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const { results } = await c.env.DB.prepare(
      `
            SELECT * FROM autonomy_overrides 
            WHERE tenant_id = ? 
              AND (expires_at IS NULL OR expires_at > datetime('now'))
            ORDER BY 
                CASE override_level 
                    WHEN 'global' THEN 1 
                    WHEN 'entity_type' THEN 2 
                    WHEN 'entity' THEN 3 
                END
        `
    )
      .bind(tenantId)
      .all();

    return c.json({ overrides: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// DELETE /v1/trust/overrides/:id - Remove override
// ============================================================================
trustScoreRoutes.delete("/overrides/:id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const id = c.req.param("id");

  try {
    const result = await c.env.DB.prepare(
      `
            DELETE FROM autonomy_overrides WHERE id = ? AND tenant_id = ?
        `
    )
      .bind(id, tenantId)
      .run();

    if (result.meta?.changes === 0) {
      return c.json({ error: "Override not found" }, 404);
    }

    return c.json({ id, deleted: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/trust/dashboard - Trust score dashboard
// ============================================================================
trustScoreRoutes.get("/dashboard", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const [sourceStats, overrideCount, avgTrust] = await Promise.all([
      c.env.DB.prepare(
        `
                SELECT source_type, COUNT(*) as count, AVG(reliability_score) as avg_score
                FROM source_reliability 
                WHERE tenant_id = ? AND status = 'active'
                GROUP BY source_type
            `
      )
        .bind(tenantId)
        .all(),
      c.env.DB.prepare(
        `
                SELECT COUNT(*) as count 
                FROM autonomy_overrides 
                WHERE tenant_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
            `
      )
        .bind(tenantId)
        .first<{ count: number }>(),
      c.env.DB.prepare(
        `
                SELECT AVG(composite_score) as avg_trust
                FROM trust_scores
                WHERE tenant_id = ?
            `
      )
        .bind(tenantId)
        .first<{ avg_trust: number }>(),
    ]);

    return c.json({
      sources_by_type: sourceStats.results,
      active_overrides: overrideCount?.count || 0,
      avg_trust_score: avgTrust?.avg_trust || 0.5,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// Helper: Get effective autonomy with override hierarchy (Clause 5)
// ============================================================================
async function getEffectiveAutonomy(
  db: D1Database,
  tenantId: string,
  entityType: string,
  entityId: string
): Promise<{ level: number; override_active: boolean; override_reason: string | null }> {
  // Check overrides in priority order: global > entity_type > entity
  const override = await db
    .prepare(
      `
        SELECT max_autonomy_level, reason, override_level
        FROM autonomy_overrides
        WHERE tenant_id = ?
          AND (expires_at IS NULL OR expires_at > datetime('now'))
          AND (
            (override_level = 'global')
            OR (override_level = 'entity_type' AND entity_type = ?)
            OR (override_level = 'entity' AND entity_type = ? AND entity_id = ?)
          )
        ORDER BY 
            CASE override_level 
                WHEN 'global' THEN 1 
                WHEN 'entity_type' THEN 2 
                WHEN 'entity' THEN 3 
            END
        LIMIT 1
    `
    )
    .bind(tenantId, entityType, entityType, entityId)
    .first();

  if (override) {
    return {
      level: (override as any).max_autonomy_level,
      override_active: true,
      override_reason: (override as any).reason,
    };
  }

  // Get base autonomy from trust score
  const trustScore = await db
    .prepare(
      `
        SELECT base_autonomy_level FROM trust_scores
        WHERE tenant_id = ? AND entity_type = ? AND entity_id = ?
    `
    )
    .bind(tenantId, entityType, entityId)
    .first();

  return {
    level: (trustScore as any)?.base_autonomy_level || 1,
    override_active: false,
    override_reason: null,
  };
}
