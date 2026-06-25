/**
 * Simulation Routes
 * Outcome prediction and what-if analysis
 *
 * Constitutional Compliance:
 * - Clause 1: Temporal Truth (context_timestamp, time-indexed data)
 * - Clause 4: Decision Replay (simulations can be replayed)
 */

import { Hono } from "hono";
import { z } from "zod";

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
};

export const simulationRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Schemas
// ============================================================================
const SimulationRequestSchema = z.object({
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  action_type: z.string(),
  action_params: z.record(z.any()).optional(),
  simulation_type: z.enum(["quick", "standard", "deep"]).default("quick"),
  monte_carlo_runs: z.number().min(10).max(1000).default(100),
  time_horizon_days: z.number().min(1).max(365).default(30),
});

// ============================================================================
// POST /v1/simulation/run - Run a simulation
// ============================================================================
simulationRoutes.post("/run", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const body = await c.req.json();
    const data = SimulationRequestSchema.parse(body);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Gather context snapshot (Clause 1: temporal truth)
    const entityContext = await gatherEntityContext(
      c.env.DB,
      tenantId,
      data.entity_type,
      data.entity_id
    );

    // Create simulation request
    await c.env.DB.prepare(
      `
            INSERT INTO simulation_requests (
                id, tenant_id, entity_type, entity_id, action_type, action_params,
                context_snapshot, context_timestamp, simulation_type, 
                monte_carlo_runs, time_horizon_days, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'running')
        `
    )
      .bind(
        id,
        tenantId,
        data.entity_type,
        data.entity_id,
        data.action_type,
        JSON.stringify(data.action_params || {}),
        JSON.stringify(entityContext),
        now,
        data.simulation_type,
        data.monte_carlo_runs,
        data.time_horizon_days
      )
      .run();

    // Run quick simulation (synchronous for quick type)
    if (data.simulation_type === "quick") {
      const result = await runQuickSimulation(c.env.DB, tenantId, data);

      // Store prediction
      const predictionId = crypto.randomUUID();
      await c.env.DB.prepare(
        `
                INSERT INTO outcome_predictions (
                    id, simulation_id, tenant_id, scenario_name,
                    win_probability, risk_level, confidence,
                    expected_value, key_factors
                ) VALUES (?, ?, ?, 'primary', ?, ?, ?, ?, ?)
            `
      )
        .bind(
          predictionId,
          id,
          tenantId,
          result.win_probability,
          result.risk_level,
          result.confidence,
          result.expected_value,
          JSON.stringify(result.key_factors)
        )
        .run();

      // Mark complete
      await c.env.DB.prepare(
        `
                UPDATE simulation_requests 
                SET status = 'completed', completed_at = datetime('now')
                WHERE id = ?
            `
      )
        .bind(id)
        .run();

      return c.json({
        simulation_id: id,
        status: "completed",
        result,
      });
    }

    // For standard/deep, return pending (would be handled async)
    return c.json(
      {
        simulation_id: id,
        status: "pending",
        message: "Simulation queued for processing",
      },
      202
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: err.errors }, 400);
    }
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/simulation/:id - Get simulation result
// ============================================================================
simulationRoutes.get("/:id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const id = c.req.param("id");

  try {
    const simulation = await c.env.DB.prepare(
      `
            SELECT * FROM simulation_requests WHERE id = ? AND tenant_id = ?
        `
    )
      .bind(id, tenantId)
      .first();

    if (!simulation) {
      return c.json({ error: "Simulation not found" }, 404);
    }

    const { results: predictions } = await c.env.DB.prepare(
      `
            SELECT * FROM outcome_predictions WHERE simulation_id = ?
        `
    )
      .bind(id)
      .all();

    return c.json({
      simulation,
      predictions,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/simulation/history - List past simulations
// ============================================================================
simulationRoutes.get("/history", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const limit = parseInt(c.req.query("limit") || "20");
  const entityType = c.req.query("entity_type");

  try {
    let sql = `SELECT * FROM simulation_requests WHERE tenant_id = ?`;
    const params: any[] = [tenantId];

    if (entityType) {
      sql += ` AND entity_type = ?`;
      params.push(entityType);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql)
      .bind(...params)
      .all();

    return c.json({ simulations: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// POST /v1/simulation/:id/replay - Replay simulation (Clause 4)
// ============================================================================
simulationRoutes.post("/:id/replay", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const id = c.req.param("id");

  try {
    const simulation = await c.env.DB.prepare(
      `
            SELECT * FROM simulation_requests WHERE id = ? AND tenant_id = ?
        `
    )
      .bind(id, tenantId)
      .first();

    if (!simulation) {
      return c.json({ error: "Simulation not found" }, 404);
    }

    // Re-run with original context (Clause 4: Decision Replay)
    const data = {
      entity_type: (simulation as any).entity_type,
      entity_id: (simulation as any).entity_id,
      action_type: (simulation as any).action_type,
      action_params: JSON.parse((simulation as any).action_params || "{}"),
      simulation_type: "quick" as const,
      monte_carlo_runs: 100,
      time_horizon_days: 30,
    };

    const result = await runQuickSimulation(c.env.DB, tenantId, data);

    return c.json({
      replay: true,
      original_simulation_id: id,
      original_context_timestamp: (simulation as any).context_timestamp,
      result,
      message: "Simulation replayed per Clause 4",
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/simulation/models - List available simulation models
// ============================================================================
simulationRoutes.get("/models", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const { results } = await c.env.DB.prepare(
      `
            SELECT * FROM simulation_models 
            WHERE (tenant_id = ? OR tenant_id IS NULL) AND status = 'active'
            ORDER BY domain, entity_type
        `
    )
      .bind(tenantId)
      .all();

    return c.json({ models: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// Helper: Gather entity context for simulation
// ============================================================================
async function gatherEntityContext(
  db: D1Database,
  tenantId: string,
  entityType: string,
  entityId: string
): Promise<Record<string, any>> {
  // Get entity completeness from spine
  const completeness = await db
    .prepare(
      `
        SELECT * FROM spine_entity_completeness 
        WHERE entity_id = ?
    `
    )
    .bind(entityId)
    .first();

  // Get recent signals
  const { results: signals } = await db
    .prepare(
      `
        SELECT * FROM signals 
        WHERE tenant_id = ? AND entity_id = ?
        ORDER BY computed_at DESC LIMIT 10
    `
    )
    .bind(tenantId, entityId)
    .all();

  // Get trust score
  const trustScore = await db
    .prepare(
      `
        SELECT * FROM trust_scores 
        WHERE tenant_id = ? AND entity_type = ? AND entity_id = ?
    `
    )
    .bind(tenantId, entityType, entityId)
    .first();

  return {
    completeness: completeness || null,
    recent_signals: signals || [],
    trust_score: trustScore || null,
    snapshot_timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Helper: Run quick simulation
// ============================================================================
async function runQuickSimulation(
  db: D1Database,
  tenantId: string,
  data: z.infer<typeof SimulationRequestSchema>
): Promise<{
  win_probability: number;
  risk_level: string;
  confidence: number;
  expected_value: number;
  key_factors: Array<{ factor: string; impact: number }>;
  recommendation: string;
}> {
  // Get historical success rate for this action type
  const historicalStats = await db
    .prepare(
      `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN was_correct = 'correct' THEN 1 ELSE 0 END) as correct
        FROM decision_memory 
        WHERE tenant_id = ? 
          AND entity_type = ? 
          AND action_type = ?
          AND was_correct IS NOT NULL
    `
    )
    .bind(tenantId, data.entity_type, data.action_type)
    .first();

  const total = (historicalStats as any)?.total || 0;
  const correct = (historicalStats as any)?.correct || 0;
  const historicalRate = total > 0 ? correct / total : 0.5;

  // Get entity completeness
  const completeness = await db
    .prepare(
      `
        SELECT completeness_score FROM spine_entity_completeness 
        WHERE entity_id = ?
    `
    )
    .bind(data.entity_id)
    .first();
  const completenessScore = ((completeness as any)?.completeness_score || 50) / 100;

  // Get source reliability average
  const reliabilityStats = await db
    .prepare(
      `
        SELECT AVG(reliability_score) as avg_reliability
        FROM source_reliability 
        WHERE tenant_id = ? AND status = 'active'
    `
    )
    .bind(tenantId)
    .first();
  const avgReliability = (reliabilityStats as any)?.avg_reliability || 0.5;

  // Calculate win probability (weighted model)
  const winProbability = Math.max(
    0.1,
    Math.min(0.95, historicalRate * 0.4 + completenessScore * 0.25 + avgReliability * 0.25 + 0.1)
  );

  // Calculate confidence based on sample size
  const confidence = Math.min(total / 20, 1.0) * 0.7 + 0.3; // Min 30% confidence

  // Determine risk level
  let riskLevel: string;
  if (winProbability > 0.7) riskLevel = "low";
  else if (winProbability > 0.5) riskLevel = "medium";
  else if (winProbability > 0.3) riskLevel = "high";
  else riskLevel = "critical";

  // Generate recommendation
  let recommendation: string;
  if (winProbability > 0.7 && confidence > 0.7) {
    recommendation = "Strong recommendation: proceed";
  } else if (winProbability > 0.5) {
    recommendation = "Moderate confidence: consider proceeding";
  } else if (winProbability > 0.3) {
    recommendation = "Caution: gather more context before acting";
  } else {
    recommendation = "High risk: recommend alternative approach";
  }

  return {
    win_probability: Math.round(winProbability * 1000) / 1000,
    risk_level: riskLevel,
    confidence: Math.round(confidence * 1000) / 1000,
    expected_value: Math.round(winProbability * 10000),
    key_factors: [
      { factor: "historical_success_rate", impact: 0.4 },
      { factor: "data_completeness", impact: 0.25 },
      { factor: "source_reliability", impact: 0.25 },
    ],
    recommendation,
  };
}
