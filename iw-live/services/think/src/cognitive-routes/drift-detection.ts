/**
 * Drift Detection Routes
 * Model-reality divergence monitoring
 *
 * Constitutional Compliance:
 * - Clause 1: Temporal Truth (time-indexed beliefs)
 * - Clause 3: Reversible Readiness (adjustments can undo)
 */

import { Hono } from "hono";
import { z } from "zod";

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
};

export const driftDetectionRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Schemas
// ============================================================================
const BeliefSchema = z.object({
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  attribute_name: z.string(),
  believed_value: z.any(),
  believed_type: z.enum(["point", "range", "categorical", "probability"]).default("point"),
  confidence: z.number().min(0).max(1),
  evidence_quality: z.enum(["strong", "moderate", "weak", "inferred"]).default("moderate"),
  source_type: z.string(),
  source_id: z.string().optional(),
});

const ObservationSchema = z.object({
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  attribute_name: z.string(),
  observed_value: z.any(),
  observation_source: z.string(),
  observation_confidence: z.number().min(0).max(1).default(1.0),
});

// ============================================================================
// GET /v1/drift/events - List drift events
// ============================================================================
driftDetectionRoutes.get("/events", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const limit = parseInt(c.req.query("limit") || "20");
  const severity = c.req.query("severity");
  const status = c.req.query("status");

  try {
    let sql = `SELECT * FROM drift_events WHERE tenant_id = ?`;
    const params: any[] = [tenantId];

    if (severity) {
      sql += ` AND severity = ?`;
      params.push(severity);
    }
    if (status) {
      sql += ` AND response_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY detected_at DESC LIMIT ?`;
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql)
      .bind(...params)
      .all();

    return c.json({ drift_events: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/drift/events/:id - Get specific drift event
// ============================================================================
driftDetectionRoutes.get("/events/:id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const id = c.req.param("id");

  try {
    const event = await c.env.DB.prepare(
      `
            SELECT * FROM drift_events WHERE id = ? AND tenant_id = ?
        `
    )
      .bind(id, tenantId)
      .first();

    if (!event) {
      return c.json({ error: "Drift event not found" }, 404);
    }

    return c.json(event);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// PATCH /v1/drift/events/:id/resolve - Resolve a drift event
// ============================================================================
driftDetectionRoutes.patch("/events/:id/resolve", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const userId = c.req.header("x-user-id");
  const id = c.req.param("id");

  try {
    const body = await c.req.json();
    const notes = body.resolution_notes || "";

    const result = await c.env.DB.prepare(
      `
            UPDATE drift_events 
            SET response_status = 'resolved', 
                resolved_at = datetime('now'),
                resolved_by = ?,
                resolution_notes = ?
            WHERE id = ? AND tenant_id = ?
        `
    )
      .bind(userId || null, notes, id, tenantId)
      .run();

    if (result.meta?.changes === 0) {
      return c.json({ error: "Drift event not found" }, 404);
    }

    return c.json({ id, resolved: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// POST /v1/drift/beliefs - Record a belief
// ============================================================================
driftDetectionRoutes.post("/beliefs", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const body = await c.req.json();
    const data = BeliefSchema.parse(body);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Invalidate any existing belief for this attribute
    await c.env.DB.prepare(
      `
            UPDATE model_beliefs 
            SET valid_until = datetime('now')
            WHERE tenant_id = ? 
              AND entity_type = ? 
              AND entity_id = ? 
              AND attribute_name = ?
              AND valid_until IS NULL
        `
    )
      .bind(tenantId, data.entity_type, data.entity_id, data.attribute_name)
      .run();

    // Insert new belief (Clause 1: time-indexed)
    await c.env.DB.prepare(
      `
            INSERT INTO model_beliefs (
                id, tenant_id, entity_type, entity_id, attribute_name,
                believed_value, believed_type, confidence, evidence_quality,
                source_type, source_id, valid_from
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    )
      .bind(
        id,
        tenantId,
        data.entity_type,
        data.entity_id,
        data.attribute_name,
        JSON.stringify(data.believed_value),
        data.believed_type,
        data.confidence,
        data.evidence_quality,
        data.source_type,
        data.source_id || null,
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
// GET /v1/drift/beliefs/:entity_type/:entity_id - Get active beliefs
// ============================================================================
driftDetectionRoutes.get("/beliefs/:entity_type/:entity_id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const entityType = c.req.param("entity_type");
  const entityId = c.req.param("entity_id");

  try {
    const { results } = await c.env.DB.prepare(
      `
            SELECT * FROM model_beliefs 
            WHERE tenant_id = ? 
              AND entity_type = ? 
              AND entity_id = ?
              AND valid_until IS NULL
            ORDER BY attribute_name
        `
    )
      .bind(tenantId, entityType, entityId)
      .all();

    return c.json({ beliefs: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// POST /v1/drift/observations - Record a reality observation
// ============================================================================
driftDetectionRoutes.post("/observations", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const body = await c.req.json();
    const data = ObservationSchema.parse(body);
    const id = crypto.randomUUID();

    await c.env.DB.prepare(
      `
            INSERT INTO reality_observations (
                id, tenant_id, entity_type, entity_id, attribute_name,
                observed_value, observation_source, observation_confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
    )
      .bind(
        id,
        tenantId,
        data.entity_type,
        data.entity_id,
        data.attribute_name,
        JSON.stringify(data.observed_value),
        data.observation_source,
        data.observation_confidence
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
// POST /v1/drift/detect/:entity_type/:entity_id - Trigger drift detection
// ============================================================================
driftDetectionRoutes.post("/detect/:entity_type/:entity_id", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const entityType = c.req.param("entity_type");
  const entityId = c.req.param("entity_id");

  try {
    // Get current beliefs
    const { results: beliefs } = await c.env.DB.prepare(
      `
            SELECT * FROM model_beliefs 
            WHERE tenant_id = ? 
              AND entity_type = ? 
              AND entity_id = ?
              AND valid_until IS NULL
        `
    )
      .bind(tenantId, entityType, entityId)
      .all();

    // Get unprocessed observations
    const { results: observations } = await c.env.DB.prepare(
      `
            SELECT * FROM reality_observations 
            WHERE tenant_id = ? 
              AND entity_type = ? 
              AND entity_id = ?
              AND processed = 0
        `
    )
      .bind(tenantId, entityType, entityId)
      .all();

    const driftEvents: any[] = [];

    for (const obs of observations || []) {
      const belief = (beliefs || []).find(
        (b: any) => b.attribute_name === (obs as any).attribute_name
      );

      if (belief) {
        const believedValue = JSON.parse((belief as any).believed_value);
        const observedValue = JSON.parse((obs as any).observed_value);

        // Calculate drift magnitude
        let driftMagnitude = 0;
        if (typeof believedValue === "number" && typeof observedValue === "number") {
          driftMagnitude =
            Math.abs(believedValue - observedValue) / Math.max(Math.abs(believedValue), 1);
        } else if (JSON.stringify(believedValue) !== JSON.stringify(observedValue)) {
          driftMagnitude = 1.0; // Categorical change
        }

        if (driftMagnitude > 0.1) {
          const driftId = crypto.randomUUID();
          const severity =
            driftMagnitude > 0.8
              ? "critical"
              : driftMagnitude > 0.5
                ? "high"
                : driftMagnitude > 0.2
                  ? "medium"
                  : "low";
          const responseAction = driftMagnitude > 0.5 ? "pause_automations" : "update_belief";

          await c.env.DB.prepare(
            `
                        INSERT INTO drift_events (
                            id, tenant_id, entity_type, entity_id, attribute_name,
                            model_belief_id, believed_value, observed_value,
                            drift_magnitude, drift_type, severity, response_action
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
          )
            .bind(
              driftId,
              tenantId,
              entityType,
              entityId,
              (obs as any).attribute_name,
              (belief as any).id,
              (belief as any).believed_value,
              (obs as any).observed_value,
              driftMagnitude,
              driftMagnitude > 0.5 ? "sudden_shift" : "gradual_drift",
              severity,
              responseAction
            )
            .run();

          driftEvents.push({
            id: driftId,
            attribute: (obs as any).attribute_name,
            drift_magnitude: driftMagnitude,
            severity,
          });
        }
      }

      // Mark observation as processed
      await c.env.DB.prepare(
        `
                UPDATE reality_observations SET processed = 1 WHERE id = ?
            `
      )
        .bind((obs as any).id)
        .run();
    }

    return c.json({
      entity_type: entityType,
      entity_id: entityId,
      observations_processed: observations?.length || 0,
      drifts_detected: driftEvents.length,
      drift_events: driftEvents,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// AUTOMATED ADJUSTMENT LOOP
// Self-healing system that adjusts rules based on drift and outcome patterns
// ============================================================================

/**
 * POST /v1/drift/auto-adjust/:entity_type
 * Trigger automated adjustment analysis for an entity type
 * This analyzes drift events + outcome patterns to suggest or apply rule adjustments
 */
driftDetectionRoutes.post("/auto-adjust/:entity_type", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const entityType = c.req.param("entity_type");
  const body = await c.req.json().catch(() => ({}));
  const {
    apply = false, // If true, apply adjustments; if false, just suggest
    max_adjustments = 3, // Limit number of adjustments
    min_confidence = 0.7, // Minimum confidence threshold
  } = body as any;

  const correlationId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // 1. Gather data for analysis
    const [driftEvents, ruleEffectiveness, recentOutcomes] = await Promise.all([
      // Get unresolved drift events for this entity type
      c.env.DB.prepare(
        `
        SELECT * FROM drift_events 
        WHERE tenant_id = ? 
          AND (entity_type = ? OR source_entity_type = ?)
          AND response_status = 'pending'
        ORDER BY detected_at DESC
        LIMIT 10
      `
      )
        .bind(tenantId, entityType, entityType)
        .all(),

      // Get rule effectiveness from Supabase (via cognitive-brain endpoint pattern)
      fetch(
        `${c.env.ENVIRONMENT === "production" ? "https://gateway.integratewise.ai" : "http://gateway"}/v1/outcome/effectiveness?min_effectiveness=0`,
        {
          headers: {
            "x-tenant-id": tenantId,
            "x-correlation-id": correlationId,
          },
        }
      )
        .then((r) => (r.ok ? r.json() : { rules: [] }))
        .catch(() => ({ rules: [] })),

      // Get recent decision outcomes
      c.env.DB.prepare(
        `
        SELECT * FROM decision_memory 
        WHERE tenant_id = ? 
          AND created_at > datetime('now', '-7 days')
        ORDER BY created_at DESC
        LIMIT 50
      `
      )
        .bind(tenantId)
        .all(),
    ]);

    const adjustments: any[] = [];
    const suggestions: any[] = [];

    // 2. Analyze drift patterns and generate adjustments
    const drifts = (driftEvents.results || []) as any[];
    const rules = (ruleEffectiveness as any).rules || [];
    const outcomes = (recentOutcomes.results || []) as any[];

    // Pattern 1: Repeated drift on same attribute → Tighten belief confidence
    const driftByAttribute = groupBy(drifts, "attribute_name");
    for (const [attribute, attributeDrifts] of Object.entries(driftByAttribute)) {
      if (attributeDrifts.length >= 2) {
        const suggestion = {
          type: "tighten_confidence",
          target: `${entityType}.${attribute}`,
          reason: `${attributeDrifts.length} drifts detected on ${attribute}`,
          action: "Reduce confidence threshold for this attribute",
          confidence: Math.min(0.9, 0.5 + attributeDrifts.length * 0.1),
          estimated_impact: "Reduce false positives by 15-20%",
        };
        suggestions.push(suggestion);

        if (apply && suggestion.confidence >= min_confidence) {
          const adjustment = await createAdjustment(c.env, tenantId, {
            entity_type: entityType,
            adjustment_type: "confidence_threshold",
            previous_value: "0.7",
            new_value: "0.85",
            trigger_type: "auto_drift_pattern",
            trigger_id: attributeDrifts[0].id,
            reason: suggestion.reason,
          });
          adjustments.push(adjustment);
        }
      }
    }

    // Pattern 2: Low rule effectiveness → Suggest rule refinement
    const lowPerformingRules = rules.filter((r: any) => r.effectiveness_score < 50);
    for (const rule of lowPerformingRules.slice(0, max_adjustments)) {
      const suggestion = {
        type: "refine_rule",
        target: rule.rule_id,
        reason: `Effectiveness score ${rule.effectiveness_score}% below threshold`,
        action: "Review and refine rule conditions or thresholds",
        confidence: 0.8,
        estimated_impact: "Improve action success rate by 20-30%",
      };
      suggestions.push(suggestion);

      // Don't auto-apply rule changes - require human review
    }

    // Pattern 3: High execution time → Suggest optimization
    const slowRules = rules.filter((r: any) => r.avg_execution_time_ms > 5000);
    for (const rule of slowRules.slice(0, 2)) {
      suggestions.push({
        type: "optimize_performance",
        target: rule.rule_id,
        reason: `Average execution time ${rule.avg_execution_time_ms}ms exceeds 5s threshold`,
        action: "Optimize connector calls or add caching",
        confidence: 0.75,
        estimated_impact: "Reduce execution time by 40-60%",
      });
    }

    // Pattern 4: Success rate variance by time → Suggest temporal rules
    const timeBasedPatterns = analyzeTimePatterns(outcomes);
    if (timeBasedPatterns.hasVariance) {
      suggestions.push({
        type: "add_temporal_rule",
        target: entityType,
        reason: `Success rate varies by ${timeBasedPatterns.varianceFactor}`,
        action: "Add time-based conditions to rules",
        confidence: timeBasedPatterns.confidence,
        estimated_impact: "Improve relevance of triggered actions",
      });
    }

    // 3. Log auto-adjustment analysis
    console.log(`[AutoAdjust] Analyzed ${drifts.length} drifts, ${rules.length} rules`, {
      tenant_id: tenantId,
      entity_type: entityType,
      suggestions_generated: suggestions.length,
      adjustments_applied: adjustments.length,
      correlation_id: correlationId,
    });

    return c.json({
      tenant_id: tenantId,
      entity_type: entityType,
      analysis: {
        drifts_analyzed: drifts.length,
        rules_analyzed: rules.length,
        outcomes_analyzed: outcomes.length,
      },
      suggestions: suggestions.slice(0, max_adjustments),
      adjustments_applied: apply ? adjustments : [],
      auto_apply_enabled: apply,
      correlation_id: correlationId,
      generated_at: timestamp,
    });
  } catch (err: any) {
    console.error(`[AutoAdjust] Error: ${err.message}`);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /v1/drift/auto-adjust/status
 * Get status of automated adjustments for a tenant
 */
driftDetectionRoutes.get("/auto-adjust/status", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const [adjustments, suggestions] = await Promise.all([
      c.env.DB.prepare(
        `
        SELECT 
          adjustment_type,
          COUNT(*) as count,
          MAX(created_at) as last_applied
        FROM readiness_adjustments 
        WHERE tenant_id = ? AND trigger_type LIKE 'auto_%'
        GROUP BY adjustment_type
      `
      )
        .bind(tenantId)
        .all(),

      c.env.DB.prepare(
        `
        SELECT COUNT(*) as pending_suggestions
        FROM drift_events 
        WHERE tenant_id = ? AND response_status = 'pending'
      `
      )
        .bind(tenantId)
        .first(),
    ]);

    return c.json({
      tenant_id: tenantId,
      auto_adjustments: {
        total_applied: (adjustments.results || []).reduce(
          (sum: number, r: any) => sum + r.count,
          0
        ),
        by_type: adjustments.results || [],
      },
      pending_review: {
        drift_events: (suggestions as any)?.pending_suggestions || 0,
      },
      config: {
        auto_apply_enabled: false, // Conservative default - suggest first
        max_adjustments_per_run: 3,
        min_confidence_threshold: 0.7,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/**
 * POST /v1/drift/auto-adjust/:id/apply
 * Apply a suggested adjustment
 */
driftDetectionRoutes.post("/auto-adjust/:id/apply", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const suggestionId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const { approved = false, reason = "" } = body as any;

  if (!approved) {
    return c.json({ error: "Approval required to apply adjustment" }, 403);
  }

  try {
    // Create the adjustment
    const adjustment = await createAdjustment(c.env, tenantId, {
      entity_type: (body as any).entity_type || "unknown",
      adjustment_type: (body as any).type || "manual_override",
      previous_value: (body as any).previous_value,
      new_value: (body as any).new_value,
      trigger_type: "manual_approval",
      trigger_id: suggestionId,
      reason: reason || `Manually approved adjustment: ${suggestionId}`,
    });

    return c.json({
      success: true,
      adjustment,
      message: "Adjustment applied successfully",
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/** Group array by key */
function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

/** Analyze time-based patterns in outcomes */
function analyzeTimePatterns(outcomes: any[]): {
  hasVariance: boolean;
  varianceFactor: string;
  confidence: number;
} {
  if (outcomes.length < 10) {
    return { hasVariance: false, varianceFactor: "", confidence: 0 };
  }

  // Group by hour of day
  const byHour: Record<number, { success: number; total: number }> = {};
  outcomes.forEach((o) => {
    const hour = new Date(o.created_at).getHours();
    if (!byHour[hour]) byHour[hour] = { success: 0, total: 0 };
    byHour[hour].total++;
    if (o.outcome === "success") byHour[hour].success++;
  });

  // Check for variance between business hours (9-17) vs off-hours
  const businessHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
  let businessSuccess = 0,
    businessTotal = 0;
  let offHoursSuccess = 0,
    offHoursTotal = 0;

  Object.entries(byHour).forEach(([hour, stats]) => {
    const h = parseInt(hour);
    if (businessHours.includes(h)) {
      businessSuccess += stats.success;
      businessTotal += stats.total;
    } else {
      offHoursSuccess += stats.success;
      offHoursTotal += stats.total;
    }
  });

  if (businessTotal === 0 || offHoursTotal === 0) {
    return { hasVariance: false, varianceFactor: "", confidence: 0 };
  }

  const businessRate = businessSuccess / businessTotal;
  const offHoursRate = offHoursSuccess / offHoursTotal;
  const variance = Math.abs(businessRate - offHoursRate);

  if (variance > 0.2) {
    return {
      hasVariance: true,
      varianceFactor: businessRate > offHoursRate ? "business_hours" : "off_hours",
      confidence: Math.min(0.9, variance),
    };
  }

  return { hasVariance: false, varianceFactor: "", confidence: 0 };
}

/** Create a readiness adjustment record */
async function createAdjustment(
  env: Bindings,
  tenantId: string,
  params: {
    entity_type: string;
    entity_id?: string;
    adjustment_type: string;
    previous_value: string;
    new_value: string;
    trigger_type: string;
    trigger_id?: string;
    reason: string;
  }
): Promise<any> {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await env.DB.prepare(
    `
    INSERT INTO readiness_adjustments (
      id, tenant_id, entity_type, entity_id, adjustment_type,
      previous_value, new_value, trigger_type, trigger_id, 
      is_reversible, status, created_at, reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', ?, ?)
  `
  )
    .bind(
      id,
      tenantId,
      params.entity_type,
      params.entity_id || null,
      params.adjustment_type,
      params.previous_value,
      params.new_value,
      params.trigger_type,
      params.trigger_id || null,
      timestamp,
      params.reason
    )
    .run();

  return {
    id,
    tenant_id: tenantId,
    ...params,
    is_reversible: true,
    status: "active",
    created_at: timestamp,
  };
}

// ============================================================================
// GET /v1/drift/adjustments - List readiness adjustments
// ============================================================================
driftDetectionRoutes.get("/adjustments", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const limit = parseInt(c.req.query("limit") || "20");
  const reversible = c.req.query("reversible");

  try {
    let sql = `SELECT * FROM readiness_adjustments WHERE tenant_id = ?`;
    const params: any[] = [tenantId];

    if (reversible === "true") {
      sql += ` AND is_reversible = 1 AND status = 'active'`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const { results } = await c.env.DB.prepare(sql)
      .bind(...params)
      .all();

    return c.json({ adjustments: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// POST /v1/drift/adjustments/:id/revert - Revert an adjustment (Clause 3)
// ============================================================================
driftDetectionRoutes.post("/adjustments/:id/revert", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const reason = (body as any).reason || "Manual reversal";

  try {
    // Get original adjustment
    const original = await c.env.DB.prepare(
      `
            SELECT * FROM readiness_adjustments 
            WHERE id = ? AND tenant_id = ? AND is_reversible = 1 AND status = 'active'
        `
    )
      .bind(id, tenantId)
      .first();

    if (!original) {
      return c.json({ error: "Adjustment not found or not reversible" }, 404);
    }

    // Create reversal
    const reversalId = crypto.randomUUID();
    await c.env.DB.prepare(
      `
            INSERT INTO readiness_adjustments (
                id, tenant_id, entity_type, entity_id, adjustment_type,
                previous_value, new_value, trigger_type, trigger_id, is_reversible
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?, 1)
        `
    )
      .bind(
        reversalId,
        tenantId,
        (original as any).entity_type,
        (original as any).entity_id,
        (original as any).adjustment_type,
        (original as any).new_value,
        (original as any).previous_value,
        id
      )
      .run();

    // Mark original as reversed
    await c.env.DB.prepare(
      `
            UPDATE readiness_adjustments 
            SET status = 'reversed', 
                reversed_at = datetime('now'),
                reversed_by_adjustment_id = ?,
                reversal_reason = ?
            WHERE id = ?
        `
    )
      .bind(reversalId, reason, id)
      .run();

    return c.json({
      original_adjustment_id: id,
      reversal_adjustment_id: reversalId,
      message: "Adjustment reverted per Clause 3 (Reversible Readiness)",
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// GET /v1/drift/dashboard - Drift detection dashboard
// ============================================================================
driftDetectionRoutes.get("/dashboard", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  try {
    const [pending, bySeverity, recent] = await Promise.all([
      c.env.DB.prepare(
        `
                SELECT COUNT(*) as count FROM drift_events 
                WHERE tenant_id = ? AND response_status = 'pending'
            `
      )
        .bind(tenantId)
        .first<{ count: number }>(),
      c.env.DB.prepare(
        `
                SELECT severity, COUNT(*) as count 
                FROM drift_events 
                WHERE tenant_id = ? AND detected_at > datetime('now', '-30 days')
                GROUP BY severity
            `
      )
        .bind(tenantId)
        .all(),
      c.env.DB.prepare(
        `
                SELECT COUNT(*) as count 
                FROM drift_events 
                WHERE tenant_id = ? AND detected_at > datetime('now', '-24 hours')
            `
      )
        .bind(tenantId)
        .first<{ count: number }>(),
    ]);

    return c.json({
      pending_drifts: pending?.count || 0,
      drifts_last_24h: recent?.count || 0,
      by_severity: bySeverity.results,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
