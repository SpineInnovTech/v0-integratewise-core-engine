/**
 * L2 Cognitive Layer — Backend
 *
 * Read/write service over the spine. Exposes:
 * - GET /api/v1/l2/insights — AI-derived signals for a view
 * - GET /api/v1/l2/recommendations — pending or decided recommendations
 * - POST /api/v1/l2/recommendations/:id/decision — record approve/reject
 * - POST /api/v1/l2/events — ingest Flow A/B/C and user actions
 *
 * Persistence: KV (L2_INSIGHTS) when bound; else returns seeded demo data.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

export interface Env {
  L2_INSIGHTS?: KVNamespace;
}

type L2Insight = {
  id: string;
  title: string;
  body: string;
  whyItMatters?: string;
  severity?: "low" | "medium" | "high";
  entities?: { type: string; id: string }[];
  createdAt: string;
};

type L2Recommendation = {
  id: string;
  title: string;
  description: string;
  evidenceRefs: { type: string; id: string }[];
  evidenceSummary?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  suggestedAction?: string;
  entity?: { id: string; name: string; type: string };
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
};

// ─── Demo seed data ──────────────────────────────────────────────────────────

const DEMO_INSIGHT_PERSONAL_TODAY: L2Insight = {
  id: "demo-personal-today-1",
  title: "3 high-priority items can be completed in the next 2 hours",
  body: "Pipeline review, CRM sync, and Cognitive Twin suggestions are blocking 5 downstream tasks for your team.",
  whyItMatters:
    "Completing these unlocks capacity for 3 team members and keeps your Spine synchronized.",
  severity: "medium",
  createdAt: new Date().toISOString(),
};

// ─── KV key helpers ──────────────────────────────────────────────────────────

function kvInsightsKey(userId: string, viewId: string): string {
  return `insights:${userId}:${viewId}`;
}

function kvRecsKey(userId: string, viewId: string): string {
  return `recs:${userId}:${viewId}`;
}

function kvDismissedKey(userId: string): string {
  return `dismissed:${userId}`;
}

/** Decision map format: { recId: { decision, actor, ts, reason? } } — used when KV stores decisions only */
type DecisionMap = Record<
  string,
  { decision: "approve" | "reject"; actor: string; ts?: number; reason?: string }
>;

function isDecisionMap(val: unknown): val is DecisionMap {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());
app.use("*", async (c, next) => {
  await next();
});

// ─── GET /api/v1/l2/insights ─────────────────────────────────────────────────

app.get("/api/v1/l2/insights", async (c) => {
  const viewId = c.req.query("viewId") || "";
  const userId = c.req.query("userId") || "";

  const kv = c.env.L2_INSIGHTS;

  // 1. Try KV-stored insights
  if (kv && userId && viewId) {
    const raw = await kv.get(kvInsightsKey(userId, viewId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Array<Partial<L2Insight> & { id: string }>;
        let insights: L2Insight[] = parsed.map((i) => ({
          id: i.id,
          title: i.title ?? "Insight",
          body: i.body ?? i.title ?? "",
          whyItMatters: i.whyItMatters,
          severity: (i.severity as L2Insight["severity"]) ?? "medium",
          entities: i.entities,
          createdAt: i.createdAt ?? new Date().toISOString(),
        }));

        // Filter out dismissed insights
        const dismissedRaw = await kv.get(kvDismissedKey(userId));
        if (dismissedRaw) {
          try {
            const dismissed = JSON.parse(dismissedRaw) as string[];
            insights = insights.filter((i) => !dismissed.includes(i.id));
          } catch {
            /* ignore bad dismissed data */
          }
        }

        return c.json(insights);
      } catch {
        /* fall through to demo */
      }
    }
  }

  // 2. Demo: personal-today gets a real insight to demo the flow
  if (viewId === "personal-today" && userId) {
    return c.json([DEMO_INSIGHT_PERSONAL_TODAY]);
  }

  return c.json([]);
});

// ─── GET /api/v1/l2/recommendations ──────────────────────────────────────────

app.get("/api/v1/l2/recommendations", async (c) => {
  const viewId = c.req.query("viewId") || "";
  const userId = c.req.query("userId") || "";
  const statusFilter = c.req.query("status") || "";
  const limit = parseInt(c.req.query("limit") || "50");

  const kv = c.env.L2_INSIGHTS;

  // 1. Try KV-stored recommendations
  if (kv && userId && viewId) {
    const raw = await kv.get(kvRecsKey(userId, viewId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        let recs: L2Recommendation[];

        if (Array.isArray(parsed)) {
          recs = parsed as L2Recommendation[];
        } else if (isDecisionMap(parsed)) {
          // Decision map without demo data — return decisions as empty
          recs = [];
        } else {
          throw new Error("Unknown recs format");
        }

        // Filter by status (supports comma-separated: "approved,rejected")
        if (statusFilter) {
          const statuses = statusFilter.split(",").map((s) => s.trim());
          recs = recs.filter((r) => statuses.includes(r.status));
        }

        return c.json(recs.slice(0, limit));
      } catch {
        /* fall through to empty */
      }
    }
  }

  // 2. No KV data — return empty recommendations (real data comes from Spine)
  return c.json([]);
});

// ─── POST /api/v1/l2/recommendations/:id/decision ───────────────────────────

app.post("/api/v1/l2/recommendations/:id/decision", async (c) => {
  const recId = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as {
    decision?: "approve" | "reject";
    reason?: string;
    actor?: string;
    viewId?: string;
  };

  if (!body.decision || !["approve", "reject"].includes(body.decision)) {
    return c.json({ error: "decision must be 'approve' or 'reject'" }, 400);
  }

  const kv = c.env.L2_INSIGHTS;
  const userId = body.actor || "";
  const viewId = body.viewId || "";

  // Find and update the recommendation in KV
  if (kv && userId) {
    // Prefer exact key when viewId provided
    const targetKey = viewId ? kvRecsKey(userId, viewId) : null;

    if (targetKey) {
      const raw = await kv.get(targetKey);
      const decisions: DecisionMap = raw
        ? (() => {
            try {
              const p = JSON.parse(raw) as unknown;
              return isDecisionMap(p) ? p : {};
            } catch {
              return {};
            }
          })()
        : {};
      decisions[recId] = {
        decision: body.decision,
        actor: userId,
        ts: Date.now(),
        reason: body.reason,
      };
      await kv.put(targetKey, JSON.stringify(decisions));
      return c.json({ id: recId, status: body.decision === "approve" ? "approved" : "rejected" });
    }

    // Fallback: iterate existing keys
    const recsList = await kv.list({ prefix: `recs:${userId}:` });
    for (const key of recsList.keys) {
      const raw = await kv.get(key.name);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as unknown;

        if (Array.isArray(parsed)) {
          const recs = parsed as L2Recommendation[];
          const idx = recs.findIndex((r) => r.id === recId);
          if (idx !== -1) {
            recs[idx] = {
              ...recs[idx],
              status: body.decision === "approve" ? "approved" : "rejected",
              decidedAt: new Date().toISOString(),
              decidedBy: userId,
              reason: body.reason || undefined,
            };
            await kv.put(key.name, JSON.stringify(recs));
            return c.json(recs[idx]);
          }
        } else if (isDecisionMap(parsed)) {
          const decisions = { ...parsed };
          decisions[recId] = {
            decision: body.decision,
            actor: userId,
            ts: Date.now(),
            reason: body.reason,
          };
          await kv.put(key.name, JSON.stringify(decisions));
          return c.json({
            id: recId,
            status: body.decision === "approve" ? "approved" : "rejected",
          });
        }
      } catch {
        continue;
      }
    }
  }

  // Not in KV — nothing to update
  return c.body(null, 204);
});

// ─── POST /api/v1/l2/events ──────────────────────────────────────────────────

app.post("/api/v1/l2/events", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    type?: string;
    source?: string;
    payload?: {
      action?: string;
      insightId?: string;
      userId?: string;
      [key: string]: unknown;
    };
    entityRefs?: { type: string; id: string }[];
    timestamp?: string;
  };

  const kv = c.env.L2_INSIGHTS;

  // Handle dismiss: add to dismissed set so GET /insights filters it out
  if (kv && body.payload?.action === "dismiss" && body.payload?.insightId) {
    const userId = body.payload.userId || "";
    if (userId) {
      const dismissKey = kvDismissedKey(userId);
      const existingRaw = await kv.get(dismissKey);
      let dismissed: string[] = [];
      if (existingRaw) {
        try {
          dismissed = JSON.parse(existingRaw);
        } catch {
          /* reset */
        }
      }
      if (!dismissed.includes(body.payload.insightId)) {
        dismissed.push(body.payload.insightId);
        await kv.put(dismissKey, JSON.stringify(dismissed), {
          // Auto-expire dismissed list after 30 days
          expirationTtl: 30 * 24 * 60 * 60,
        });
      }
    }
  }

  return c.body(null, 204);
});

// Health for worker binding (gateway forwards /api/v1/l2/health)
app.get("/health", (c) => c.json({ status: "ok", service: "l2" }));
app.get("/api/v1/l2/health", (c) => c.json({ status: "ok", service: "l2" }));

export default app;
