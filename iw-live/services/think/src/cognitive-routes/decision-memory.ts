/**
 * Decision Memory Routes
 * Organizational learning from past decisions
 *
 * Constitutional Compliance:
 * - Clause 1: Temporal Truth (evidence_timestamp, policy_snapshot)
 * - Clause 4: Decision Replay Guarantee (full state reconstruction)
 */

import { Hono } from "hono";
import { z } from "zod";

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
};

export const decisionMemoryRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Schemas
// ============================================================================
const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const DecisionCreateSchema = z.object({
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  action_type: z.string(),
  action_params: z.record(z.any()).optional(),
  context_snapshot: z.record(z.any()).optional(),
  evidence_ids: z.array(z.string().uuid()).optional(),
  actual_reason: z.string(),
  alternatives_considered: z.array(z.string()).optional(),
  confidence_at_decision: z.number().min(0).max(1),
  trust_score_at_decision: z.number().min(0).max(1).optional(),
  autonomy_level_at_decision: z.number().min(0).max(3).optional(),
  policy_snapshot: z.record(z.any()).optional(),
});

const DecisionFeedbackSchema = z.object({
  was_correct: z.enum(["correct", "incorrect", "partial"]),
  feedback_reason: z.string().optional(),
});

// ============================================================================
// GET /v1/decisions - List decisions with filtering
// ============================================================================
decisionMemoryRoutes.get("/", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const { limit, offset } = PaginationSchema.parse(c.req.query());
  const entityType = c.req.query("entity_type");
  const actionType = c.req.query("action_type");
  const wasCorrect = c.req.query("was_correct");

  try {
    let sql = `SELECT * FROM decision_memory WHERE tenant_id = ?`;
    const params: any[] = [tenantId];

    if (entityType) {
      sql += ` AND entity_type = ?`;
      params.push(entityType);
    }
    if (actionType) {
      sql += ` AND action_type = ?`;
      params.push(actionType);
    }
    if (wasCorrect) {
      sql += ` AND was_correct = ?`;
      params.push(wasCorrect);
    }

    sql += ` ORDER BY decided_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await c.env.DB.prepare(sql)
      .bind(...params)
      .all();

    return c.json({
      decisions: results,
      pagination: { limit, offset, count: results?.length || 0 },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/decisions/:id - Get single decision with full context
// ============================================================================
decisionMemoryRoutes.get("/:id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const id = c.req.param("id");

  try {
    const decision = await c.env.DB.prepare(
      `
            SELECT * FROM decision_memory WHERE id = ? AND tenant_id = ?
        `
    )
      .bind(id, tenantId)
      .first();

    if (!decision) {
      return c.json({ error: "Decision not found" }, 404);
    }

    return c.json(decision);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// POST /v1/decisions - Record a new decision
// ============================================================================
decisionMemoryRoutes.post("/", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const body = await c.req.json();
    const data = DecisionCreateSchema.parse(body);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `
            INSERT INTO decision_memory (
                id, tenant_id, entity_type, entity_id, action_type, action_params,
                context_snapshot, evidence_ids, actual_reason, alternatives_considered,
                confidence_at_decision, trust_score_at_decision, autonomy_level_at_decision,
                policy_snapshot, evidence_timestamp, decided_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    )
      .bind(
        id,
        tenantId,
        data.entity_type,
        data.entity_id,
        data.action_type,
        JSON.stringify(data.action_params || {}),
        JSON.stringify(data.context_snapshot || {}),
        JSON.stringify(data.evidence_ids || []),
        data.actual_reason,
        JSON.stringify(data.alternatives_considered || []),
        data.confidence_at_decision,
        data.trust_score_at_decision || null,
        data.autonomy_level_at_decision || null,
        JSON.stringify(data.policy_snapshot || {}),
        now, // evidence_timestamp (Clause 1)
        now
      )
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
// PATCH /v1/decisions/:id/feedback - Record outcome feedback
// ============================================================================
decisionMemoryRoutes.patch("/:id/feedback", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const id = c.req.param("id");

  try {
    const body = await c.req.json();
    const { was_correct, feedback_reason } = DecisionFeedbackSchema.parse(body);

    const result = await c.env.DB.prepare(
      `
            UPDATE decision_memory 
            SET was_correct = ?, feedback_reason = ?, feedback_at = datetime('now')
            WHERE id = ? AND tenant_id = ?
        `
    )
      .bind(was_correct, feedback_reason || null, id, tenantId)
      .run();

    if (result.meta?.changes === 0) {
      return c.json({ error: "Decision not found" }, 404);
    }

    return c.json({ id, was_correct, success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: err.errors }, 400);
    }
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/decisions/patterns - Get learned decision patterns
// ============================================================================
decisionMemoryRoutes.get("/patterns", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const { limit } = PaginationSchema.parse(c.req.query());

  try {
    const { results } = await c.env.DB.prepare(
      `
            SELECT * FROM decision_patterns 
            WHERE tenant_id = ? AND is_active = 1
            ORDER BY success_rate DESC
            LIMIT ?
        `
    )
      .bind(tenantId, limit)
      .all();

    return c.json({ patterns: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/decisions/stats - Decision memory statistics
// ============================================================================
decisionMemoryRoutes.get("/stats", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const stats = await c.env.DB.prepare(
      `
            SELECT 
                COUNT(*) as total_decisions,
                SUM(CASE WHEN was_correct = 'correct' THEN 1 ELSE 0 END) as correct_count,
                SUM(CASE WHEN was_correct = 'incorrect' THEN 1 ELSE 0 END) as incorrect_count,
                SUM(CASE WHEN was_correct = 'partial' THEN 1 ELSE 0 END) as partial_count,
                SUM(CASE WHEN was_correct IS NULL THEN 1 ELSE 0 END) as pending_count,
                AVG(confidence_at_decision) as avg_confidence
            FROM decision_memory
            WHERE tenant_id = ?
        `
    )
      .bind(tenantId)
      .first();

    const total = (stats as any)?.total_decisions || 1;
    const correct = (stats as any)?.correct_count || 0;

    return c.json({
      ...stats,
      success_rate: total > 0 ? correct / total : 0,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// POST /v1/decisions/:id/replay - Replay a decision (Clause 4)
// ============================================================================
decisionMemoryRoutes.post("/:id/replay", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const id = c.req.param("id");

  try {
    const decision = await c.env.DB.prepare(
      `
            SELECT * FROM decision_memory WHERE id = ? AND tenant_id = ?
        `
    )
      .bind(id, tenantId)
      .first();

    if (!decision) {
      return c.json({ error: "Decision not found" }, 404);
    }

    // Return full state for replay (Clause 4: Decision Replay Guarantee)
    return c.json({
      replay: true,
      original_decision: decision,
      context_at_decision: JSON.parse((decision as any).context_snapshot || "{}"),
      policy_at_decision: JSON.parse((decision as any).policy_snapshot || "{}"),
      evidence_timestamp: (decision as any).evidence_timestamp,
      trust_score_at_decision: (decision as any).trust_score_at_decision,
      autonomy_level_at_decision: (decision as any).autonomy_level_at_decision,
      message: "Full decision context restored for replay per Clause 4",
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
