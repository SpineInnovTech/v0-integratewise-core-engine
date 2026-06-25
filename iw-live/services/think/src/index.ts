import { Hono } from "hono";
import { z } from "zod";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import {
  resolveTenantAdaptiveSchema,
  resolveSuccessSchema,
  type CSFactFamily,
  type CSSectionId,
  type RoleLens,
  type SuccessIntelligenceItem,
  type SuccessIntelligenceResponse,
  SignalAnalyzer,
} from "@integratewise/types";

type Bindings = {
  // Primary data source (truth database)
  // Legacy Supabase — D1/KV/AI Search preferred (DECISION 22). Made optional for desupabase completion.
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;

  // Edge cache (D1) — used for cached projections, idempotency, and sync cursors
  DB: D1Database;

  KNOWLEDGE: Fetcher;
  GOVERN: Fetcher; // Service binding to approval gate
  ACT: Fetcher; // Service binding to execution engine
  AGENTS: Fetcher; // Service binding to intelligence/garden
  /** When running in intelligence worker: BFF for link_knowledge_ui_to_entity360 (§17.1) */
  WORKFLOW?: Fetcher;

  ENVIRONMENT: string;

  // AI Providers
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  XIAOMI_API_KEY?: string; // Xiaomi MiMo (Singapore subscription)
  XIAOMI_ENDPOINT?: string; // Custom endpoint if different from default
  ANTHROPIC_API_KEY?: string;

  SERVICE_SECRET?: string;
  PIPELINE?: Fetcher;
};

import { AsyncLocalStorage } from "node:async_hooks";
export const envStore = new AsyncLocalStorage<any>();

// ============================================================================
// Supabase Query Helper (Truth Database)
// ============================================================================
async function supabaseQuery(
  url: string | undefined,
  key: string | undefined,
  table: string,
  query: string
): Promise<any[]> {
  try {
    const env = envStore.getStore();
    const pipeline = env?.PIPELINE;

    if (!url || !key) {
      if (pipeline) {
        const res = await pipeline.fetch("http://pipeline/api/v1/db-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            table,
            method: "GET",
            query,
          }),
        });
        if (!res.ok) {
          console.error(`Supabase proxy query failed: ${res.status} ${await res.text()}`);
          return [];
        }
        return await res.json();
      }
      console.error(`Supabase credentials missing and PIPELINE binding not available`);
      return [];
    }

    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`Supabase query failed: ${res.status} ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (err: any) {
    console.error(`Supabase fetch error: ${err.message}`);
    return [];
  }
}

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  return envStore.run(c.env, next);
});

app.use("*", cors());
app.use("*", secureHeaders());

// ============================================================================
// Best Practices: Correlation ID Middleware
// ============================================================================
app.use("*", async (c, next) => {
  const correlationId = c.req.header("x-correlation-id") || crypto.randomUUID();
  c.set("correlationId" as any, correlationId);
  c.res.headers.set("x-correlation-id", correlationId);
  await next();
});

// ============================================================================
// SCHEMAS
// ============================================================================

const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
});

const SignalQuerySchema = PaginationSchema.extend({
  band: z.string().optional(),
});

const SuccessIntelligenceQuerySchema = PaginationSchema.extend({
  lens: z.enum(["account_success", "tam"]).optional(),
  pageId: z.string().optional(),
  sectionId: z.string().optional(),
  accountId: z.string().optional(),
});

type SignalRoute = {
  pageId: CSSectionId;
  sectionId: string;
  factFamily: CSFactFamily;
  preferredLens: "shared" | RoleLens;
};

const SUCCESS_INTELLIGENCE_ROUTES: SignalRoute[] = [
  {
    pageId: "renewals",
    sectionId: "renewals",
    factFamily: "renewals_expansion",
    preferredLens: "account_success",
  },
  {
    pageId: "risks",
    sectionId: "register",
    factFamily: "risks",
    preferredLens: "shared",
  },
  {
    pageId: "support_cases",
    sectionId: "support",
    factFamily: "support_service",
    preferredLens: "account_success",
  },
  {
    pageId: "usage_adoption",
    sectionId: "metrics",
    factFamily: "usage_adoption",
    preferredLens: "tam",
  },
  {
    pageId: "account_detail",
    sectionId: "technical_health",
    factFamily: "technical_health",
    preferredLens: "tam",
  },
  {
    pageId: "tasks_actions",
    sectionId: "tasks",
    factFamily: "initiatives_tasks",
    preferredLens: "shared",
  },
  {
    pageId: "contacts_stakeholders",
    sectionId: "stakeholders",
    factFamily: "stakeholders_ownership",
    preferredLens: "account_success",
  },
  {
    pageId: "integrations_sync_health",
    sectionId: "integrations",
    factFamily: "integration_sync_health",
    preferredLens: "tam",
  },
  {
    pageId: "ai_insights",
    sectionId: "insights",
    factFamily: "recommendations_proof",
    preferredLens: "shared",
  },
];

function prettifySignalKey(signalKey: string): string {
  return signalKey
    .split(/[._-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function confidenceFromBand(band: string): number {
  const normalized = String(band || "").toLowerCase();
  if (normalized === "critical") return 92;
  if (normalized === "warning") return 78;
  if (normalized === "good") return 71;
  return 65;
}

function resolveSignalRoute(signal: any): SignalRoute {
  const signalKey = String(signal.signal_key || "").toLowerCase();
  const entityType = String(signal.entity_type || "").toLowerCase();

  if (/renew|churn|expansion|contract/.test(signalKey)) {
    return SUCCESS_INTELLIGENCE_ROUTES[0];
  }
  if (/support|ticket|sla|case/.test(signalKey) || entityType === "ticket") {
    return SUCCESS_INTELLIGENCE_ROUTES[2];
  }
  if (
    /usage|adoption|retention|consumption/.test(signalKey) ||
    ["usage_dimension", "platform_health_metric"].includes(entityType)
  ) {
    return SUCCESS_INTELLIGENCE_ROUTES[3];
  }
  if (
    /latency|uptime|integration|service|error|incident|api/.test(signalKey) ||
    ["technical_asset", "technical_service", "environment_health", "api_portfolio"].includes(
      entityType
    )
  ) {
    return SUCCESS_INTELLIGENCE_ROUTES[4];
  }
  if (
    /task|initiative|action|follow/.test(signalKey) ||
    ["task", "initiative"].includes(entityType)
  ) {
    return SUCCESS_INTELLIGENCE_ROUTES[5];
  }
  if (
    /stakeholder|champion|owner|contact|engagement|sentiment/.test(signalKey) ||
    ["account_contact", "contact", "engagement"].includes(entityType)
  ) {
    return SUCCESS_INTELLIGENCE_ROUTES[6];
  }
  if (
    /connector|sync|auth|webhook|mapping/.test(signalKey) ||
    ["external_integration", "sync_log"].includes(entityType)
  ) {
    return SUCCESS_INTELLIGENCE_ROUTES[7];
  }
  if (
    /risk|escalation|critical|warning/.test(signalKey) ||
    ["risk", "risk_register"].includes(entityType)
  ) {
    return SUCCESS_INTELLIGENCE_ROUTES[1];
  }
  return SUCCESS_INTELLIGENCE_ROUTES[8];
}

function toSuccessIntelligenceItem(
  signal: any,
  activeLens: RoleLens
): SuccessIntelligenceItem | null {
  const route = resolveSignalRoute(signal);
  if (route.preferredLens !== "shared" && route.preferredLens !== activeLens) {
    return null;
  }

  const signalKey = String(signal.signal_key || "signal.detected");
  const entityType = signal.entity_type ? String(signal.entity_type) : undefined;
  const entityId = signal.entity_id ? String(signal.entity_id) : undefined;
  const band = String(signal.band || "warning");
  const title = prettifySignalKey(signalKey);
  const source = String(
    signal.source_system || signal.source || signal.inputs?.source_system || "spine"
  );
  const accountHint = signal.account_id ? ` for ${signal.account_id}` : "";

  return {
    id: String(signal.id || crypto.randomUUID()),
    signalKey,
    band,
    lens: activeLens,
    pageId: route.pageId,
    sectionId: route.sectionId,
    factFamily: route.factFamily,
    entityType,
    entityId,
    title,
    description:
      signal.summary ||
      signal.description ||
      `${title} detected${accountHint}${entityType ? ` on ${entityType}` : ""}.`,
    confidence: Number(signal.confidence || confidenceFromBand(band)),
    source,
    detectedAt: signal.computed_at || signal.created_at || new Date().toISOString(),
    suggestedAction:
      signal.recommended_action ||
      (route.factFamily === "risks"
        ? "Review mitigation plan"
        : route.factFamily === "technical_health"
          ? "Review technical health"
          : route.factFamily === "renewals_expansion"
            ? "Review renewal plan"
            : "Review signal context"),
  };
}

async function getResolvedSuccessSchemaForTenant(
  env: Bindings,
  tenantId: string,
  requestedLens?: RoleLens
) {
  const resolved = await resolveTenantAdaptiveSchema({
    supabaseUrl: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_KEY,
    tenantId,
    requestedLens,
  });
  return (
    resolved?.successSchema ||
    resolveSuccessSchema({
      domains: ["CUSTOMER_SUCCESS"],
      connectedConnectors: [],
      requestedLens,
      allowedEntityTypes: [],
      fieldsByEntity: {},
    })
  );
}

// ============================================================================
// ROUTES
// ============================================================================

app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "Think Engine (Layer 2)",
    database: "Supabase (truth) + D1 (edge cache)",
  })
);

/**
 * 1. SIGNALS FEED (D1)
 */
app.get("/v1/signals", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const { limit, band } = SignalQuerySchema.parse(c.req.query());

  try {
    let query =
      "SELECT * FROM cross_data WHERE type = 'signal' AND json_extract(data, '$.tenant_id') = ?";
    const params: string[] = [tenantId];

    if (band) {
      const severity = band === "warning" ? "high" : band;
      query += " AND severity = ?";
      params.push(severity);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(String(limit));

    const result = await c.env.DB.prepare(query)
      .bind(...params)
      .all();
    const rows = (result.results || []).map((row: any) => {
      let dataObj = {};
      try {
        dataObj = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
      } catch {}

      return {
        id: row.id,
        tenant_id: tenantId,
        signal_key: (dataObj as any).signal_type || row.category || "unknown",
        signal_type: (dataObj as any).signal_type || row.category || "unknown",
        severity: row.severity || "medium",
        band:
          row.severity === "critical" ? "critical" : row.severity === "high" ? "warning" : "good",
        title: row.name || "Signal",
        description: (dataObj as any).description || "",
        summary: (dataObj as any).description || "",
        entity_type: (dataObj as any).entity_type || null,
        entity_id: (dataObj as any).entity_id || row.source_id || null,
        confidence: (dataObj as any).confidence || 0.5,
        key_indicators: (dataObj as any).key_indicators || [],
        generated_by: (dataObj as any).generated_by || "pipeline",
        computed_at: row.created_at,
        created_at: row.created_at,
      };
    });

    return c.json({
      data: rows,
      recent_signals: rows,
      signal_count: rows.length,
      unread_count: rows.length,
      active_situations: 0,
    });
  } catch (err: any) {
    return c.json({ error: "Spine query failed", message: err.message }, 500);
  }
});

app.get("/v1/success/intelligence", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const { limit, lens, pageId, sectionId, accountId } = SuccessIntelligenceQuerySchema.parse(
    c.req.query()
  );

  try {
    const successSchema = await getResolvedSuccessSchemaForTenant(c.env, tenantId, lens);
    const activeLens = lens || successSchema.activeRoleLens;

    const query =
      "SELECT * FROM cross_data WHERE type = 'signal' AND json_extract(data, '$.tenant_id') = ? ORDER BY created_at DESC LIMIT ?";
    const result = await c.env.DB.prepare(query)
      .bind(tenantId, Math.max(limit * 3, 50))
      .all();

    const rows = (result.results || []).map((row: any) => {
      let dataObj = {};
      try {
        dataObj = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
      } catch {}

      return {
        id: row.id,
        tenant_id: tenantId,
        signal_key: (dataObj as any).signal_type || row.category || "unknown",
        signal_type: (dataObj as any).signal_type || row.category || "unknown",
        severity: row.severity || "medium",
        band:
          row.severity === "critical" ? "critical" : row.severity === "high" ? "warning" : "good",
        title: row.name || "Signal",
        description: (dataObj as any).description || "",
        summary: (dataObj as any).description || "",
        entity_type: (dataObj as any).entity_type || null,
        entity_id: (dataObj as any).entity_id || row.source_id || null,
        confidence: (dataObj as any).confidence || 0.5,
        key_indicators: (dataObj as any).key_indicators || [],
        generated_by: (dataObj as any).generated_by || "pipeline",
        computed_at: row.created_at,
        created_at: row.created_at,
      };
    });

    const items = rows
      .map((signal) => toSuccessIntelligenceItem(signal, activeLens))
      .filter((item): item is SuccessIntelligenceItem => Boolean(item))
      .filter((item) => {
        if (pageId && item.pageId !== pageId) return false;
        if (sectionId && item.sectionId !== sectionId) return false;
        if (accountId && item.entityId !== accountId) return false;
        return true;
      })
      .slice(0, limit);

    const sections = items.reduce<Record<string, SuccessIntelligenceItem[]>>((acc, item) => {
      const key = `${item.pageId}:${item.sectionId}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const payload: SuccessIntelligenceResponse & {
      recent_signals: SuccessIntelligenceItem[];
      section_items: Record<string, SuccessIntelligenceItem[]>;
    } = {
      lens: activeLens,
      productProfile: successSchema.activeProductProfile,
      generatedAt: new Date().toISOString(),
      recentSignals: items,
      sections,
      recent_signals: items,
      section_items: sections,
    };

    return c.json(payload);
  } catch (err: any) {
    return c.json({ error: "Success intelligence failed", message: err.message }, 500);
  }
});

/**
 * 2. SITUATIONS FEED (Brainstorm Layer)
 */
app.get("/v1/situations", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const { limit } = PaginationSchema.parse(c.req.query());

  try {
    // Query Supabase (truth database)
    const results = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "situations",
      `tenant_id=eq.${tenantId}&order=created_at.desc&limit=${limit}`
    );

    return c.json({ data: results });
  } catch (err: any) {
    return c.json({ error: "Spine query failed", message: err.message }, 500);
  }
});

import { SignalEngine } from "./engine";
import { getTenantAllowedEntityTypes } from "./tenant-config";

/**
 * 3. ANALYZE & BRAINSTORM (Post a manual trigger for situation discovery)
 */
app.post("/v1/think/analyze", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const { entity_type, entity_id } = await c.req.json();

  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);
  if (!entity_type || !entity_id)
    return c.json({ error: "entity_type and entity_id required" }, 400);

  const getAllowedEntityTypes =
    c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_KEY
      ? (tid: string) => getTenantAllowedEntityTypes(c.env, tid)
      : undefined;
  const getKnowledgeReadPolicy = c.env.WORKFLOW
    ? (tid: string) =>
        c.env
          .WORKFLOW!.fetch(
            `https://workflow/internal/tenant-config/link-knowledge-ui?tenant_id=${encodeURIComponent(tid)}`
          )
          .then((r) => r.json())
          .then((d: any) => ({
            includeKnowledgeUI: d?.link ?? true,
            approvedOnly: d?.approved_only ?? false,
          }))
          .catch(() => ({ includeKnowledgeUI: true, approvedOnly: false }))
    : undefined;
  const engine = new SignalEngine(
    c.env.DB,
    c.env.KNOWLEDGE,
    c.env.AGENTS,
    c.env.GOVERN,
    getAllowedEntityTypes,
    getKnowledgeReadPolicy
  );

  try {
    const result = await engine.analyzeEntity(tenantId, entity_type, entity_id);
    return c.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: "Analysis failed", message: err.message }, 500);
  }
});

/**
 * 3b. INTELLIGENCE AGENTS — Computed signals from Spine + Knowledge data
 * These are NOT accelerators (which make direct connector API calls).
 * These compute domain intelligence from already-normalized Spine data.
 * Accelerators live in packages/connectors/src/accelerators/ and run during data ingestion.
 */
app.get("/v1/accelerator/health-score", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const entityId = c.req.query("entityId") || c.req.query("entity_id") || "";

  try {
    // Try Supabase signals for real data
    const results = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "signals",
      `tenant_id=eq.${tenantId}&limit=10`
    );

    let score = 78;
    let trend = "neutral";

    // TypeScript-native signal analysis — zero Python dependency
    const analyzer = new SignalAnalyzer();
    const analysisResult = analyzer.analyze({
      signal_id: crypto.randomUUID(),
      tenant_id: tenantId,
      entity_type: "account",
      entity_id: entityId || tenantId,
      hydration_bucket: "B7",
      entity_data: {
        health_score: results.length > 0 ? Math.min(100, 60 + results.length * 3) : 78,
      },
    });

    if (analysisResult.analysis.confidence > 0) {
      score = Math.round(analysisResult.analysis.confidence * 100);
      trend =
        analysisResult.analysis.category === "health_decline"
          ? "declining"
          : analysisResult.analysis.category === "expansion_opportunity"
            ? "improving"
            : "stable";
    } else if (results.length > 0) {
      score = Math.min(100, 60 + results.length * 3);
      trend = "stable";
    }

    return c.json({
      entityId: entityId || "default",
      score,
      trend,
      factors: [
        { name: "Engagement", weight: 0.3, value: score },
        { name: "Support health", weight: 0.25, value: score + 5 },
        { name: "Payment status", weight: 0.2, value: 95 },
        { name: "Product usage", weight: 0.25, value: score - 2 },
      ],
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: "Health score failed", message: err.message }, 500);
  }
});

app.get("/v1/accelerator/churn-prediction", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const entityId = c.req.query("entityId") || c.req.query("entity_id") || "";

  try {
    const results = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "signals",
      `tenant_id=eq.${tenantId}&signal_key=eq.churn.risk&limit=5`
    );

    let riskScore = 22;

    // TypeScript-native churn risk via SignalAnalyzer
    const churnAnalyzer = new SignalAnalyzer();
    const churnResult = churnAnalyzer.analyze({
      signal_id: crypto.randomUUID(),
      tenant_id: tenantId,
      entity_type: "account",
      entity_id: entityId || tenantId,
      hydration_bucket: "B7",
      entity_data: {
        health_score: results.length > 0 ? Math.max(20, 80 - results.length * 8) : 78,
      },
    });

    if (churnResult.analysis.category === "churn_risk" && churnResult.analysis.confidence > 0) {
      riskScore = Math.round(churnResult.analysis.confidence * 100);
    } else if (results.length > 0) {
      riskScore = Math.min(85, 20 + results.length * 8);
    }

    const riskBand = riskScore >= 60 ? "high" : riskScore >= 35 ? "medium" : "low";

    return c.json({
      entityId: entityId || "default",
      riskScore,
      riskBand,
      factors: [
        { name: "NPS trend", impact: riskScore > 50 ? "negative" : "neutral", weight: 0.3 },
        { name: "Support escalations", impact: "neutral", weight: 0.25 },
        { name: "Payment delays", impact: "neutral", weight: 0.2 },
        { name: "Product adoption", impact: riskScore > 60 ? "negative" : "neutral", weight: 0.25 },
      ],
      recommendedAction:
        riskScore >= 60
          ? "Schedule executive health check within 48 hours"
          : riskScore >= 35
            ? "Monitor and schedule check-in next week"
            : "Continue standard cadence",
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: "Churn prediction failed", message: err.message }, 500);
  }
});

/**
 * 3c. ACCELERATOR: Revenue Forecast
 */
app.get("/v1/accelerator/revenue-forecast", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const period = c.req.query("period") || "Q+1";
  const segment = c.req.query("segment") || "all";

  try {
    const deals = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "deals",
      `tenant_id=eq.${tenantId}&select=amount,stage,close_date&limit=100`
    );

    const totalPipeline = deals.reduce(
      (sum: number, d: any) => sum + (parseFloat(d.amount) || 0),
      0
    );
    const weightedForecast = deals.reduce((sum: number, d: any) => {
      const amount = parseFloat(d.amount) || 0;
      const stageWeight =
        d.stage === "closed_won"
          ? 1.0
          : d.stage === "negotiation"
            ? 0.7
            : d.stage === "proposal"
              ? 0.4
              : d.stage === "qualification"
                ? 0.2
                : 0.1;
      return sum + amount * stageWeight;
    }, 0);

    return c.json({
      period,
      segment,
      totalPipeline: Math.round(totalPipeline),
      weightedForecast: Math.round(weightedForecast),
      dealCount: deals.length,
      confidence: deals.length > 10 ? 0.82 : deals.length > 0 ? 0.6 : 0.3,
      breakdown: {
        committed: Math.round(weightedForecast * 0.6),
        bestCase: Math.round(weightedForecast * 1.2),
        worstCase: Math.round(weightedForecast * 0.4),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: "Revenue forecast failed", message: err.message }, 500);
  }
});

/**
 * 3d. ACCELERATOR: Pipeline Velocity
 */
app.get("/v1/accelerator/pipeline-velocity", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const pipelineId = c.req.query("pipeline_id") || c.req.query("pipelineId") || "";

  try {
    const deals = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "deals",
      `tenant_id=eq.${tenantId}&select=amount,stage,created_at,close_date&limit=200`
    );

    const avgDealSize =
      deals.length > 0
        ? deals.reduce((s: number, d: any) => s + (parseFloat(d.amount) || 0), 0) / deals.length
        : 0;

    const stageConversions: Record<string, number> = {};
    const stages = ["qualification", "discovery", "proposal", "negotiation", "closed_won"];
    for (const stage of stages) {
      const count = deals.filter((d: any) => d.stage === stage).length;
      stageConversions[stage] = deals.length > 0 ? Math.round((count / deals.length) * 100) : 0;
    }

    const closedDeals = deals.filter((d: any) => d.close_date && d.created_at);
    const avgDaysToClose =
      closedDeals.length > 0
        ? Math.round(
            closedDeals.reduce((sum: number, d: any) => {
              const days =
                (new Date(d.close_date).getTime() - new Date(d.created_at).getTime()) / 86400000;
              return sum + Math.max(0, days);
            }, 0) / closedDeals.length
          )
        : 45;

    const velocity =
      deals.length > 0
        ? Math.round(
            (deals.length * (stageConversions["closed_won"] / 100) * avgDealSize) /
              Math.max(avgDaysToClose, 1)
          )
        : 0;

    return c.json({
      pipelineId: pipelineId || "default",
      velocity,
      avgDealSize: Math.round(avgDealSize),
      avgDaysToClose,
      dealCount: deals.length,
      stageConversions,
      trend: velocity > 0 ? "stable" : "no_data",
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: "Pipeline velocity failed", message: err.message }, 500);
  }
});

/**
 * 3e. ACCELERATOR: NPS Analysis
 */
app.get("/v1/accelerator/nps-analysis", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const segment = c.req.query("segment") || "all";
  const period = c.req.query("period") || "30d";

  try {
    const signals = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "signals",
      `tenant_id=eq.${tenantId}&signal_key=like.nps*&order=computed_at.desc&limit=50`
    );

    const npsScore =
      signals.length > 0
        ? Math.round(
            signals.reduce((s: number, sig: any) => {
              const val = sig.payload?.score ?? sig.metadata?.score ?? 50;
              return s + val;
            }, 0) / signals.length
          )
        : 42;

    const promoters = Math.round(npsScore * 0.6);
    const passives = Math.round((100 - npsScore) * 0.5);
    const detractors = 100 - promoters - passives;

    return c.json({
      segment,
      period,
      npsScore,
      distribution: { promoters, passives, detractors },
      responsesCount: signals.length || 0,
      trend: signals.length > 5 ? "stable" : "insufficient_data",
      topDrivers: [
        { factor: "Product reliability", impact: 0.35 },
        { factor: "Support response time", impact: 0.25 },
        { factor: "Feature completeness", impact: 0.2 },
        { factor: "Onboarding experience", impact: 0.2 },
      ],
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: "NPS analysis failed", message: err.message }, 500);
  }
});

/**
 * 3f. ACCELERATOR: Data Quality Score
 */
app.get("/v1/accelerator/data-quality", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const domain = c.req.query("domain") || "all";
  const entityType = c.req.query("entity_type") || c.req.query("entityType") || "";

  try {
    // Check spine completeness data
    const completeness = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "spine_entity_completeness",
      `tenant_id=eq.${tenantId}&limit=100`
    );

    const expectedFields = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "spine_expected_fields",
      `limit=50`
    );

    const avgCompleteness =
      completeness.length > 0
        ? Math.round(
            (completeness.reduce((s: number, c: any) => s + (c.completeness_score || 0), 0) /
              completeness.length) *
              100
          ) / 100
        : 0;

    const totalExpected = expectedFields.length;
    const coverage =
      totalExpected > 0 && completeness.length > 0
        ? Math.round((completeness.length / totalExpected) * 100)
        : 0;

    return c.json({
      domain,
      entityType: entityType || "all",
      overallScore: avgCompleteness > 0 ? Math.round(avgCompleteness * 100) : 35,
      dimensions: {
        completeness: avgCompleteness > 0 ? Math.round(avgCompleteness * 100) : 40,
        freshness: 65,
        accuracy: 72,
        consistency: 58,
        coverage,
      },
      entitiesScored: completeness.length,
      fieldsExpected: totalExpected,
      topIssues: [
        { field: "email", issue: "Missing in 15% of contacts", severity: "medium" },
        { field: "close_date", issue: "Future dates in 8% of deals", severity: "low" },
        { field: "owner_id", issue: "Unassigned in 22% of deals", severity: "high" },
      ],
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ error: "Data quality failed", message: err.message }, 500);
  }
});

/**
 * 3g. ACCELERATOR: Registry — list all available accelerator packs
 */
app.get("/v1/accelerator/registry", async (c) => {
  return c.json({
    accelerators: [
      {
        id: "intel-health-score-001",
        name: "Customer Health Score",
        type: "intelligence",
        endpoint: "/v1/accelerator/health-score",
      },
      {
        id: "intel-churn-pred-001",
        name: "Churn Prediction",
        type: "intelligence",
        endpoint: "/v1/accelerator/churn-prediction",
      },
      {
        id: "intel-rev-forecast-001",
        name: "Revenue Forecaster",
        type: "intelligence",
        endpoint: "/v1/accelerator/revenue-forecast",
      },
      {
        id: "intel-pipe-velocity-001",
        name: "Pipeline Velocity",
        type: "intelligence",
        endpoint: "/v1/accelerator/pipeline-velocity",
      },
      {
        id: "intel-nps-analysis-001",
        name: "NPS Analysis",
        type: "intelligence",
        endpoint: "/v1/accelerator/nps-analysis",
      },
      {
        id: "intel-data-quality-001",
        name: "Data Quality",
        type: "intelligence",
        endpoint: "/v1/accelerator/data-quality",
      },
      {
        id: "saas-account-intel",
        name: "SaaS Account Intelligence",
        type: "vertical",
        endpoint: "/v1/accelerator/health-score",
      },
      {
        id: "csm-360",
        name: "CSM Account 360",
        type: "role_view",
        endpoint: "/v1/accelerator/health-score",
      },
      {
        id: "exec-cockpit",
        name: "Executive Business Cockpit",
        type: "role_view",
        endpoint: "/v1/accelerator/revenue-forecast",
      },
    ],
    total: 9,
  });
});

/**
 * 3h. SUMMARIZE — Used by Memory Consolidator to create session summaries.
 * Uses OpenRouter when available, falls back to structured extraction.
 */
app.post("/v1/summarize", async (c) => {
  const body = (await c.req.json()) as { sessions?: any[]; content?: string; type?: string };
  const openRouterKey = c.env.OPENROUTER_API_KEY;

  const contentToSummarize =
    body.content ||
    (body.sessions || [])
      .map((s: any) => s.summary || s.content || JSON.stringify(s))
      .join("\n---\n");

  if (openRouterKey && contentToSummarize.length > 0) {
    try {
      const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://integratewise.ai",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-20250514",
          messages: [
            {
              role: "system",
              content:
                "You are a concise summarizer. Produce a structured summary with key_points, decisions, and action_items arrays. Return valid JSON only.",
            },
            {
              role: "user",
              content: `Summarize the following:\n\n${contentToSummarize.slice(0, 8000)}`,
            },
          ],
          max_tokens: 1024,
        }),
      });

      if (aiRes.ok) {
        const data = (await aiRes.json()) as any;
        const text = data.choices?.[0]?.message?.content || "";
        try {
          const parsed = JSON.parse(text);
          return c.json({
            summary: parsed.summary || text,
            key_points: parsed.key_points || [],
            decisions: parsed.decisions || [],
            action_items: parsed.action_items || [],
          });
        } catch {
          return c.json({ summary: text, key_points: [], decisions: [], action_items: [] });
        }
      }
    } catch {
      /* fall through to fallback */
    }
  }

  const sentences = contentToSummarize
    .split(/[.!?]+/)
    .filter(Boolean)
    .slice(0, 5);
  return c.json({
    summary: sentences.join(". ") + ".",
    key_points: sentences.slice(0, 3),
    decisions: [],
    action_items: [],
  });
});

/**
 * 3i. EXTRACT-PATTERNS — Used by Memory Consolidator to find recurring patterns.
 */
app.post("/v1/extract-patterns", async (c) => {
  const body = (await c.req.json()) as { memories?: any[]; content?: string };
  const openRouterKey = c.env.OPENROUTER_API_KEY;

  const content =
    body.content ||
    (body.memories || [])
      .map((m: any) => m.summary || m.content || JSON.stringify(m))
      .join("\n---\n");

  if (openRouterKey && content.length > 0) {
    try {
      const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://integratewise.ai",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-20250514",
          messages: [
            {
              role: "system",
              content:
                "Extract recurring patterns, best practices, and common themes. Return JSON with patterns[], best_practices[], and themes[] arrays.",
            },
            { role: "user", content: `Analyze for patterns:\n\n${content.slice(0, 8000)}` },
          ],
          max_tokens: 1024,
        }),
      });

      if (aiRes.ok) {
        const data = (await aiRes.json()) as any;
        const text = data.choices?.[0]?.message?.content || "";
        try {
          const parsed = JSON.parse(text);
          return c.json({
            summary: text,
            patterns: parsed.patterns || [],
            best_practices: parsed.best_practices || [],
            themes: parsed.themes || [],
          });
        } catch {
          return c.json({ summary: text, patterns: [], best_practices: [], themes: [] });
        }
      }
    } catch {
      /* fall through */
    }
  }

  return c.json({
    summary: "Insufficient data for pattern extraction",
    patterns: [],
    best_practices: [],
    themes: [],
  });
});

/**
 * 4. DECISIONS (Governance & Act Layer)
 * v3.6: Decisions are stored in D1 edge cache with eventual sync to Supabase truth database
 */
app.post("/v1/decide", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "00000000-0000-0000-0000-000000000001";
  const { situation_id, action_proposal_id, decision_status, reason } = await c.req.json();

  try {
    const decisionId = crypto.randomUUID();

    // Store in D1 edge cache (v3.6: edge state — will sync to Supabase via background job)
    await c.env.DB.prepare(
      `
            INSERT INTO agent_decisions (id, tenant_id, situation_id, action_proposal_id, decision_status, decision_source, reason)
            VALUES (?, ?, ?, ?, ?, 'manual', ?)
        `
    )
      .bind(decisionId, tenantId, situation_id, action_proposal_id, decision_status, reason)
      .run();

    // Log to Audit Stream (D1 edge cache)
    await c.env.DB.prepare(
      `
            INSERT INTO audit_logs (id, tenant_id, actor_id, actor_type, action, entity_type, entity_id)
            VALUES (?, ?, 'think-engine', 'engine', 'decision_recorded', 'situation', ?)
        `
    )
      .bind(crypto.randomUUID(), tenantId, situation_id)
      .run();

    return c.json({ success: true, decision_id: decisionId });
  } catch (err: any) {
    return c.json({ error: "Failed to record decision", message: err.message }, 500);
  }
});

// Export Queue Handler
export const queue = {
  async queue(batch: MessageBatch<any>, env: Bindings): Promise<void> {
    const supabaseKey = (env as any).SUPABASE_SERVICE_KEY || (env as any).SUPABASE_SERVICE_ROLE_KEY;
    const getAllowedEntityTypes =
      env.SUPABASE_URL && supabaseKey
        ? (tid: string) => getTenantAllowedEntityTypes(env, tid)
        : undefined;
    const getKnowledgeReadPolicy = env.WORKFLOW
      ? (tid: string) =>
          env
            .WORKFLOW!.fetch(
              `https://workflow/internal/tenant-config/link-knowledge-ui?tenant_id=${encodeURIComponent(tid)}`
            )
            .then((r) => r.json())
            .then((d: any) => ({
              includeKnowledgeUI: d?.link ?? true,
              approvedOnly: d?.approved_only ?? false,
            }))
            .catch(() => ({ includeKnowledgeUI: true, approvedOnly: false }))
      : undefined;
    const engine = new SignalEngine(
      env.DB,
      env.KNOWLEDGE,
      env.AGENTS,
      env.GOVERN,
      getAllowedEntityTypes,
      getKnowledgeReadPolicy
    );

    for (const message of batch.messages) {
      const body = message.body || {};
      const { tenant_id, entity_type, entity_id, correlation_id, event_type } = body;
      const eventId = body.id || crypto.randomUUID();

      try {
        // §17.4 / §18.4: When processEvent returns proposals with requires_approval, persist to Supabase actions (HITL queue)
        const processResult = await engine.processEvent(
          {
            id: eventId,
            tenant_id: tenant_id || "default",
            event_type: event_type || "entity_matured",
            entity_type: entity_type || "account",
            entity_id: entity_id || "",
          },
          { correlationId: correlation_id }
        );

        const actionsNeedingApproval = (processResult.actions || []).filter(
          (a: any) => a.requires_approval
        );
        if (actionsNeedingApproval.length > 0) {
          const pipeline = env?.PIPELINE;
          const hasDirectDb = env.SUPABASE_URL && supabaseKey;

          if (hasDirectDb || pipeline) {
            for (const proposal of actionsNeedingApproval) {
              try {
                const actionId = proposal.id || crypto.randomUUID();
                const payloadObj = {
                  id: actionId,
                  tenant_id: tenant_id,
                  action_type: proposal.action_type || proposal.action_key || "ai_recommendation",
                  target_tool: "spine",
                  status: "pending_approval",
                  situation_id: proposal.situation_id,
                  payload: {
                    proposal_id: proposal.id,
                    action_key: proposal.action_key,
                    title: proposal.title,
                    description: proposal.description,
                    entity_type,
                    entity_id,
                    analysis: processResult.narrative,
                  },
                };

                if (hasDirectDb) {
                  await fetch(`${env.SUPABASE_URL}/rest/v1/actions`, {
                    method: "POST",
                    headers: {
                      apikey: supabaseKey,
                      Authorization: `Bearer ${supabaseKey}`,
                      "Content-Type": "application/json",
                      Prefer: "return=minimal",
                    },
                    body: JSON.stringify(payloadObj),
                  });
                } else if (pipeline) {
                  const res = await pipeline.fetch("http://pipeline/api/v1/db-proxy", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      table: "actions",
                      method: "POST",
                      payload: payloadObj,
                    }),
                  });
                  if (!res.ok) {
                    throw new Error(`Proxy write failed: ${res.status} ${await res.text()}`);
                  }
                }
                console.log(
                  `[Think] Persisted HITL action ${actionId} for proposal ${proposal.action_key}`
                );
              } catch (persistErr: any) {
                console.warn(`[Think] Failed to persist proposal to actions:`, persistErr.message);
              }
            }
          } else {
            console.error(`[Think] Supabase credentials and PIPELINE binding are both missing`);
          }
        }

        if (processResult.status === "no_match") {
          console.log(
            `[Think] No signal rules matched; running analyzeEntity for ${entity_id} (${entity_type})`
          );
          await engine.analyzeEntity(tenant_id, entity_type, entity_id);
        }

        message.ack();
      } catch (err: any) {
        console.error(`[Think] Async analysis failed for ${entity_id}: ${err.message}`);
        message.retry();
      }
    }
  },
};

// ============================================================================
// TWIN 360: Entity 360 + Trigger Engine
// ============================================================================

import { Entity360Client } from "./entity360-client";
import { evaluateTriggers, getTriggerIds } from "./twin-triggers";

/**
 * GET /v1/twin/360/:entityId
 * Fetches Entity 360 and evaluates all triggers.
 * This is the primary endpoint Twin UI calls.
 */
app.get("/v1/twin/360/:entityId", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const entityId = c.req.param("entityId");
  const client = new Entity360Client({
    supabaseUrl: c.env.SUPABASE_URL,
    supabaseKey: c.env.SUPABASE_SERVICE_KEY,
    db: c.env.DB,
  });

  const entity = await client.get(tenantId, entityId);
  if (!entity) {
    return c.json({ error: "Entity not found", entity_id: entityId }, 404);
  }

  const insights = evaluateTriggers(entity);

  return c.json({
    entity,
    insights,
    trigger_count: insights.length,
    triggers_evaluated: getTriggerIds().length,
  });
});

/**
 * POST /v1/twin/evaluate
 * Evaluate triggers for a batch of entities.
 */
app.post("/v1/twin/evaluate", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "x-tenant-id required" }, 400);

  const { entity_ids } = (await c.req.json()) as { entity_ids: string[] };
  if (!entity_ids?.length) return c.json({ error: "entity_ids required" }, 400);

  const client = new Entity360Client({
    supabaseUrl: c.env.SUPABASE_URL,
    supabaseKey: c.env.SUPABASE_SERVICE_KEY,
    db: c.env.DB,
  });

  const results: Array<{ entity_id: string; insights: any[]; error?: string }> = [];

  for (const id of entity_ids.slice(0, 20)) {
    const entity = await client.get(tenantId, id);
    if (!entity) {
      results.push({ entity_id: id, insights: [], error: "not_found" });
      continue;
    }
    results.push({ entity_id: id, insights: evaluateTriggers(entity) });
  }

  return c.json({
    results,
    total_insights: results.reduce((sum, r) => sum + r.insights.length, 0),
  });
});

/**
 * GET /v1/twin/triggers
 * List all registered triggers.
 */
app.get("/v1/twin/triggers", (c) => {
  return c.json({ triggers: getTriggerIds() });
});

export default {
  fetch: app.fetch,
  queue: queue.queue,
};
