/**
 * Analytics Sub-App — Phase 2
 *
 * Endpoints:
 *   POST /analytics/conversion    — Ingest conversion events
 *   POST /analytics/performance   — Ingest Web Vitals metrics
 *   GET  /analytics/dashboard     — Aggregated metrics (24h/7d/30d)
 *   GET  /analytics/funnels       — Funnel drop-off metrics
 *   GET  /analytics/tests         — A/B test results + significance
 *   GET  /analytics/stream        — SSE real-time analytics feed
 *
 * All endpoints require:
 *   Authorization: Bearer <JWT>   (validated by middleware)
 *   x-tenant-id: <uuid>           (tenant isolation)
 */

import { Hono } from "hono";

export interface AnalyticsEnv {
  ANALYTICS_DB: D1Database;
  // Legacy Supabase (for some analytics fallbacks). Main paths use D1 ANALYTICS_DB.
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SIGNAL_STREAM?: DurableObjectNamespace;
}

const analytics = new Hono<{ Bindings: AnalyticsEnv }>();

// ---------------------------------------------------------------------------
// POST /analytics/events — Public landing/conversion events (no auth required)
// Used by landing CTAs, signup intent, funnel steps (FULL_DATA_FLOW_FROM_LANDING §1.3, §18.8)
// ---------------------------------------------------------------------------
analytics.post("/events", async (c) => {
  const db = c.env.ANALYTICS_DB;
  const tenantId = c.req.header("x-tenant-id") || "anonymous";

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const events = Array.isArray(body) ? body : [body];
  const stmt = db.prepare(`
    INSERT INTO conversion_events (id, tenant_id, event_type, page_url, variant_id, test_id, funnel_step, visitor_id, session_id, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch = events.map((ev: any) =>
    stmt.bind(
      ev.id || crypto.randomUUID(),
      tenantId,
      ev.event_type || ev.eventType || "unknown",
      ev.page_url || ev.pageUrl || ev.url || null,
      ev.variant_id || ev.variantId || null,
      ev.test_id || ev.testId || null,
      ev.funnel_step || ev.funnelStep || null,
      ev.visitor_id || ev.visitorId || null,
      ev.session_id || ev.sessionId || null,
      ev.metadata ? JSON.stringify(ev.metadata) : null,
      ev.created_at || new Date().toISOString()
    )
  );

  try {
    await db.batch(batch);
    return c.json({ success: true, inserted: events.length });
  } catch (err: any) {
    console.error("[Analytics] events insert failed:", err.message);
    return c.json({ error: "Failed to store events" }, 500);
  }
});

// ---------------------------------------------------------------------------
// Middleware: tenant isolation + JWT check (skipped for POST /events)
// ---------------------------------------------------------------------------
analytics.use("*", async (c, next) => {
  if (c.req.path === "/events" && c.req.method === "POST") return next();

  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return c.json({ error: "x-tenant-id header required" }, 400);
  }

  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(
      { error: "Authorization required. Please log in and try again.", code: "AUTH_MISSING" },
      401
    );
  }

  // Verify JWT via Supabase
  try {
    const token = auth.slice(7);
    const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    if (!res.ok) {
      return c.json(
        { error: "Your session has expired. Please log in again.", code: "TOKEN_EXPIRED" },
        401
      );
    }
  } catch {
    return c.json(
      {
        error: "Unable to verify your identity. Please refresh the page and try again.",
        code: "AUTH_ERROR",
      },
      500
    );
  }

  await next();
});

// ---------------------------------------------------------------------------
// POST /analytics/conversion — Ingest conversion events
// ---------------------------------------------------------------------------
analytics.post("/conversion", async (c) => {
  const tenantId = c.req.header("x-tenant-id")!;
  const db = c.env.ANALYTICS_DB;

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const events = Array.isArray(body) ? body : [body];

  const stmt = db.prepare(`
    INSERT INTO conversion_events (id, tenant_id, event_type, page_url, variant_id, test_id, funnel_step, visitor_id, session_id, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch = events.map((ev: any) =>
    stmt.bind(
      ev.id || crypto.randomUUID(),
      tenantId,
      ev.event_type || ev.eventType || "unknown",
      ev.page_url || ev.pageUrl || ev.url || null,
      ev.variant_id || ev.variantId || null,
      ev.test_id || ev.testId || null,
      ev.funnel_step || ev.funnelStep || null,
      ev.visitor_id || ev.visitorId || null,
      ev.session_id || ev.sessionId || null,
      ev.metadata ? JSON.stringify(ev.metadata) : null,
      ev.created_at || new Date().toISOString()
    )
  );

  try {
    await db.batch(batch);
    return c.json({ success: true, inserted: events.length });
  } catch (err: any) {
    console.error("[Analytics] conversion insert failed:", err.message);
    return c.json({ error: "Failed to store conversion events" }, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /analytics/performance — Ingest Web Vitals
// ---------------------------------------------------------------------------
analytics.post("/performance", async (c) => {
  const tenantId = c.req.header("x-tenant-id")!;
  const db = c.env.ANALYTICS_DB;

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const metrics = Array.isArray(body) ? body : [body];

  const stmt = db.prepare(`
    INSERT INTO performance_metrics (id, tenant_id, session_id, url, cls, fid, fcp, lcp, ttfb, inp, page_load_time, dom_content_loaded, is_mobile, connection_type, device_memory, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch = metrics.map((m: any) =>
    stmt.bind(
      m.id || crypto.randomUUID(),
      tenantId,
      m.session_id || m.sessionId || "unknown",
      m.url || "",
      m.cls ?? null,
      m.fid ?? null,
      m.fcp ?? null,
      m.lcp ?? null,
      m.ttfb ?? null,
      m.inp ?? null,
      m.page_load_time ?? m.pageLoadTime ?? null,
      m.dom_content_loaded ?? m.domContentLoaded ?? null,
      (m.is_mobile ?? m.isMobile) ? 1 : 0,
      m.connection_type ?? m.connectionType ?? null,
      m.device_memory ?? m.deviceMemory ?? null,
      m.user_agent ?? m.userAgent ?? null,
      (m.created_at ?? m.timestamp) ? new Date(m.timestamp).toISOString() : new Date().toISOString()
    )
  );

  try {
    await db.batch(batch);
    // Broadcast performance alerts when metrics exceed thresholds (e.g. LCP > 2.5s)
    const alert = metrics.find((m: any) => {
      const lcp = m.lcp ?? m.LCP;
      return lcp != null && lcp > 2500;
    });
    if (alert) {
      broadcastAnalyticsEvent(c.env, tenantId, "performance_alert", {
        alert: {
          metric: "lcp",
          value: alert.lcp ?? alert.LCP,
          threshold: 2500,
        },
      });
    }
    return c.json({ success: true, inserted: metrics.length });
  } catch (err: any) {
    console.error("[Analytics] performance insert failed:", err.message);
    return c.json({ error: "Failed to store performance metrics" }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /analytics/dashboard — Aggregated metrics
// ---------------------------------------------------------------------------
analytics.get("/dashboard", async (c) => {
  const tenantId = c.req.header("x-tenant-id")!;
  const db = c.env.ANALYTICS_DB;
  const range = c.req.query("range") || "7d";

  const daysMap: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[range] || 7;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  try {
    const [conversionStats, perfStats, aggregates] = await Promise.all([
      db
        .prepare(
          `SELECT event_type, COUNT(*) as count
           FROM conversion_events
           WHERE tenant_id = ? AND created_at >= ?
           GROUP BY event_type
           ORDER BY count DESC
           LIMIT 20`
        )
        .bind(tenantId, since)
        .all(),

      db
        .prepare(
          `SELECT
             COUNT(*) as total_samples,
             AVG(cls) as avg_cls,
             AVG(fid) as avg_fid,
             AVG(fcp) as avg_fcp,
             AVG(lcp) as avg_lcp,
             AVG(ttfb) as avg_ttfb,
             AVG(inp) as avg_inp,
             SUM(CASE WHEN is_mobile = 1 THEN 1 ELSE 0 END) as mobile_count
           FROM performance_metrics
           WHERE tenant_id = ? AND created_at >= ?`
        )
        .bind(tenantId, since)
        .all(),

      db
        .prepare(
          `SELECT date, metric_type, metric_key, value, count
           FROM daily_aggregates
           WHERE tenant_id = ? AND date >= ?
           ORDER BY date DESC
           LIMIT 200`
        )
        .bind(tenantId, since.slice(0, 10))
        .all(),
    ]);

    return c.json({
      range,
      since,
      conversion: {
        by_event_type: conversionStats.results || [],
      },
      performance: perfStats.results?.[0] || {},
      aggregates: aggregates.results || [],
    });
  } catch (err: any) {
    console.error("[Analytics] dashboard query failed:", err.message);
    return c.json({ error: "Dashboard query failed" }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /analytics/funnels — Funnel metrics with drop-off
// ---------------------------------------------------------------------------
analytics.get("/funnels", async (c) => {
  const tenantId = c.req.header("x-tenant-id")!;
  const db = c.env.ANALYTICS_DB;
  const funnelId = c.req.query("funnel_id");

  try {
    let funnelQuery: string;
    let bindParams: any[];

    if (funnelId) {
      funnelQuery = `
        SELECT funnel_id, current_step, COUNT(*) as sessions,
               SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed
        FROM funnel_sessions
        WHERE tenant_id = ? AND funnel_id = ?
        GROUP BY funnel_id, current_step
        ORDER BY sessions DESC
      `;
      bindParams = [tenantId, funnelId];
    } else {
      funnelQuery = `
        SELECT funnel_id, current_step, COUNT(*) as sessions,
               SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed
        FROM funnel_sessions
        WHERE tenant_id = ?
        GROUP BY funnel_id, current_step
        ORDER BY funnel_id, sessions DESC
      `;
      bindParams = [tenantId];
    }

    const results = await db
      .prepare(funnelQuery)
      .bind(...bindParams)
      .all();

    // Also get step-level conversion events for drop-off analysis
    const stepQuery = `
      SELECT funnel_step, COUNT(*) as event_count
      FROM conversion_events
      WHERE tenant_id = ? AND funnel_step IS NOT NULL
      GROUP BY funnel_step
      ORDER BY event_count DESC
    `;
    const stepResults = await db.prepare(stepQuery).bind(tenantId).all();

    return c.json({
      funnels: results.results || [],
      step_events: stepResults.results || [],
    });
  } catch (err: any) {
    console.error("[Analytics] funnels query failed:", err.message);
    return c.json({ error: "Funnels query failed" }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /analytics/tests — A/B test results with statistical significance
// ---------------------------------------------------------------------------
analytics.get("/tests", async (c) => {
  const tenantId = c.req.header("x-tenant-id")!;
  const db = c.env.ANALYTICS_DB;
  const testId = c.req.query("test_id");

  try {
    let assignmentQuery: string;
    let bindParams: any[];

    if (testId) {
      assignmentQuery = `
        SELECT test_id, variant_id, COUNT(*) as visitors
        FROM ab_test_assignments
        WHERE tenant_id = ? AND test_id = ?
        GROUP BY test_id, variant_id
      `;
      bindParams = [tenantId, testId];
    } else {
      assignmentQuery = `
        SELECT test_id, variant_id, COUNT(*) as visitors
        FROM ab_test_assignments
        WHERE tenant_id = ?
        GROUP BY test_id, variant_id
        ORDER BY test_id
      `;
      bindParams = [tenantId];
    }

    const assignments = await db
      .prepare(assignmentQuery)
      .bind(...bindParams)
      .all();

    // Get conversions per variant
    let convQuery: string;
    let convParams: any[];
    if (testId) {
      convQuery = `
        SELECT test_id, variant_id, COUNT(*) as conversions
        FROM conversion_events
        WHERE tenant_id = ? AND test_id = ? AND event_type = 'conversion'
        GROUP BY test_id, variant_id
      `;
      convParams = [tenantId, testId];
    } else {
      convQuery = `
        SELECT test_id, variant_id, COUNT(*) as conversions
        FROM conversion_events
        WHERE tenant_id = ? AND test_id IS NOT NULL AND event_type = 'conversion'
        GROUP BY test_id, variant_id
      `;
      convParams = [tenantId];
    }

    const conversions = await db
      .prepare(convQuery)
      .bind(...convParams)
      .all();

    // Merge and compute significance
    const convMap = new Map<string, number>();
    for (const row of (conversions.results || []) as any[]) {
      convMap.set(`${row.test_id}:${row.variant_id}`, row.conversions);
    }

    const tests: Record<string, any[]> = {};
    for (const row of (assignments.results || []) as any[]) {
      const key = row.test_id as string;
      if (!tests[key]) tests[key] = [];
      const visitors = row.visitors as number;
      const convs = convMap.get(`${row.test_id}:${row.variant_id}`) || 0;
      const rate = visitors > 0 ? convs / visitors : 0;

      tests[key].push({
        variant_id: row.variant_id,
        visitors,
        conversions: convs,
        conversion_rate: rate,
      });
    }

    // Compute statistical significance (z-test for two proportions)
    const results = Object.entries(tests).map(([test_id, variants]) => {
      let significance: any = null;

      if (variants.length === 2) {
        const [a, b] = variants;
        const p1 = a.conversion_rate;
        const p2 = b.conversion_rate;
        const n1 = a.visitors;
        const n2 = b.visitors;

        if (n1 > 0 && n2 > 0) {
          const pPooled = (a.conversions + b.conversions) / (n1 + n2);
          const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));
          const z = se > 0 ? Math.abs(p1 - p2) / se : 0;
          const pValue = 2 * (1 - normalCDF(z));

          significance = {
            z_score: Math.round(z * 1000) / 1000,
            p_value: Math.round(pValue * 10000) / 10000,
            is_significant: pValue < 0.05,
            confidence: Math.round((1 - pValue) * 10000) / 100,
            winner: pValue < 0.05 ? (p1 > p2 ? a.variant_id : b.variant_id) : null,
          };
        }
      }

      return { test_id, variants, significance };
    });

    return c.json({ tests: results });
  } catch (err: any) {
    console.error("[Analytics] tests query failed:", err.message);
    return c.json({ error: "Tests query failed" }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /analytics/stream — SSE real-time analytics feed
// ---------------------------------------------------------------------------
analytics.get("/stream", async (c) => {
  const tenantId = c.req.header("x-tenant-id")!;
  const db = c.env.ANALYTICS_DB;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", tenant_id: tenantId })}\n\n`)
      );

      // Poll for recent events every 5 seconds
      let lastSeen = new Date().toISOString();

      const poll = async () => {
        if (closed) return;

        try {
          const recent = await db
            .prepare(
              `SELECT id, event_type, page_url, created_at
               FROM conversion_events
               WHERE tenant_id = ? AND created_at > ?
               ORDER BY created_at DESC
               LIMIT 10`
            )
            .bind(tenantId, lastSeen)
            .all();

          if (recent.results && recent.results.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "conversion_batch", events: recent.results })}\n\n`
              )
            );
            lastSeen = (recent.results[0] as any).created_at;
          }

          // Heartbeat
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "heartbeat", ts: Date.now() })}\n\n`)
          );
        } catch {
          // Swallow D1 errors during polling
        }

        if (!closed) {
          setTimeout(poll, 5000);
        }
      };

      setTimeout(poll, 5000);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

// ---------------------------------------------------------------------------
// Scheduled: daily aggregation (called by Cron Trigger)
// ---------------------------------------------------------------------------
export async function runDailyAggregation(db: D1Database): Promise<{ aggregated: number }> {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Aggregate conversion counts by event_type
  const convAgg = await db
    .prepare(
      `SELECT tenant_id, event_type, COUNT(*) as cnt
       FROM conversion_events
       WHERE date(created_at) = ?
       GROUP BY tenant_id, event_type`
    )
    .bind(yesterday)
    .all();

  // Aggregate performance averages
  const perfAgg = await db
    .prepare(
      `SELECT tenant_id,
              AVG(cls) as avg_cls, AVG(fid) as avg_fid,
              AVG(fcp) as avg_fcp, AVG(lcp) as avg_lcp,
              AVG(ttfb) as avg_ttfb, AVG(inp) as avg_inp,
              COUNT(*) as sample_count,
              MIN(lcp) as min_lcp, MAX(lcp) as max_lcp
       FROM performance_metrics
       WHERE date(created_at) = ?
       GROUP BY tenant_id`
    )
    .bind(yesterday)
    .all();

  let count = 0;

  const upsert = db.prepare(`
    INSERT INTO daily_aggregates (id, tenant_id, date, metric_type, metric_key, value, count, min_value, max_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(tenant_id, date, metric_type, metric_key)
    DO UPDATE SET value = excluded.value, count = excluded.count,
                  min_value = excluded.min_value, max_value = excluded.max_value
  `);

  const stmts: D1PreparedStatement[] = [];

  for (const row of (convAgg.results || []) as any[]) {
    stmts.push(
      upsert.bind(
        crypto.randomUUID(),
        row.tenant_id,
        yesterday,
        "conversion",
        row.event_type,
        row.cnt,
        row.cnt,
        null,
        null
      )
    );
    count++;
  }

  for (const row of (perfAgg.results || []) as any[]) {
    const vitals = ["cls", "fid", "fcp", "lcp", "ttfb", "inp"] as const;
    for (const v of vitals) {
      const avgVal = row[`avg_${v}`];
      if (avgVal != null) {
        stmts.push(
          upsert.bind(
            crypto.randomUUID(),
            row.tenant_id,
            yesterday,
            "performance",
            v,
            avgVal,
            row.sample_count,
            v === "lcp" ? row.min_lcp : null,
            v === "lcp" ? row.max_lcp : null
          )
        );
        count++;
      }
    }
  }

  if (stmts.length > 0) {
    await db.batch(stmts);
  }

  console.log(`[Analytics] Daily aggregation for ${yesterday}: ${count} rows`);
  return { aggregated: count };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Broadcast analytics event to SignalStream DO for real-time dashboard updates */
function broadcastAnalyticsEvent(
  env: AnalyticsEnv,
  tenantId: string,
  eventType: string,
  payload: Record<string, unknown>
): void {
  if (!env.SIGNAL_STREAM) return;
  try {
    const id = env.SIGNAL_STREAM.idFromName(tenantId);
    const stub = env.SIGNAL_STREAM.get(id);
    const signal = {
      id: crypto.randomUUID(),
      type: "analytics",
      severity: "info" as const,
      title: eventType,
      description: undefined,
      data: { type: eventType, ...payload },
      created_at: new Date().toISOString(),
    };
    stub
      .fetch(
        new Request("http://internal/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
          body: JSON.stringify(signal),
        })
      )
      .catch((err) => console.warn("[Analytics] broadcast failed:", err));
  } catch {
    // Non-blocking
  }
}

/** Standard normal CDF approximation (Abramowitz & Stegun) */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

export { analytics };
