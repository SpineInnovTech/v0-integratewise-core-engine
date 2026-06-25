import { HITLGate } from "./durable-objects/hitl";
import { analytics, runDailyAggregation, type AnalyticsEnv } from "./analytics";
import streamGatewayApp, { SignalStreamDO, PresenceDO, RoomDO } from "./stream-gateway";
import {
  resolveTenantAdaptiveSchema,
  DOMAIN_SPINE_CONFIG,
  getSpineConfig,
  DEPARTMENT_TO_CONFIG_KEY,
  INDUSTRY_SPINE_BASE,
  ORGANIC_CAPABILITY_MAP,
  normalizeDepartmentId,
  resolveEntityTypeAlias,
  validateEntityType,
  type SpineConfigShape,
  SignalAnalyzer,
} from "@integratewise/types";
import { getSerializableCatalog } from "@integratewise/connectors";

export { SignalStreamDO, PresenceDO, RoomDO };

export interface Env extends AnalyticsEnv {
  DB: D1Database;
  CONNECTOR: Fetcher;
  SPINE: Fetcher;
  KNOWLEDGE: Fetcher;
  THINK: Fetcher;
  ACT?: Fetcher;
  ACT_QUEUE: Queue;
  HITL_GATE: DurableObjectNamespace;
  SIGNAL_STREAM?: DurableObjectNamespace;
  PRESENCE?: DurableObjectNamespace;
  ROOM?: DurableObjectNamespace;
  CONNECTION_META?: KVNamespace;
  RATE_LIMIT?: KVNamespace;
  CONNECTOR_STATUS?: KVNamespace;
  LIBRARY_BASE_URL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const tenantId = request.headers.get("x-tenant-id") || "";

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "workflow" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Spine initialization (from SpineProvider.initialize())
    if (url.pathname === "/api/v1/workspace/initialize" && request.method === "POST") {
      return initializeWorkspace(env, tenantId, request);
    }

    // Tenant Spine config: resolve tenant_id → look up Spine schema + Depth Matrix (for all stages)
    if (url.pathname === "/api/v1/workspace/tenant-config" && request.method === "GET") {
      return getTenantSpineConfig(env, tenantId);
    }

    // Knowledge UI / Flow C read policy for intelligence and external reads.
    if (
      (url.pathname === "/api/v1/workspace/link-knowledge-ui" ||
        url.pathname === "/api/v1/workspace/knowledge-read-policy" ||
        url.pathname === "/internal/tenant-config/knowledge-read-policy" ||
        url.pathname === "/internal/tenant-config/link-knowledge-ui") &&
      request.method === "GET"
    ) {
      const tid = tenantId || url.searchParams.get("tenant_id") || "";
      return getLinkKnowledgeUI(env, tid);
    }

    // No-Hallucination Library: discovery URLs for AI grounding (llm.txt, context.json, .well-known/ai-context.json)
    if (url.pathname === "/api/v1/workspace/ai-context" && request.method === "GET") {
      return getAIContextUrls(env);
    }

    // Intelligence analyze: TypeScript-native signal analysis (Spine-shaped payload → recommended_action, confidence, etc.)
    if (url.pathname === "/api/v1/workspace/python/analyze" && request.method === "POST") {
      return nativeAnalyze(tenantId, request);
    }

    // Spine projection for a department
    if (url.pathname.startsWith("/api/v1/workspace/projection/")) {
      const dept = url.pathname.split("/").pop() || "";
      return getProjection(env, tenantId, dept);
    }

    // Readiness buckets across all departments
    if (url.pathname === "/api/v1/workspace/readiness") {
      return getReadiness(env, tenantId);
    }

    // Register a new connector — expands schema + provisions tables for new entity types
    if (url.pathname === "/api/v1/workspace/register-connector" && request.method === "POST") {
      return registerConnector(env, tenantId, request);
    }

    // Dashboard — aggregated view for Home
    if (url.pathname === "/api/v1/workspace/dashboard") {
      return getDashboard(env, tenantId, url.searchParams.get("domain") || "");
    }

    // Entity list (proxied from Spine)
    if (url.pathname === "/api/v1/workspace/entities") {
      return env.SPINE.fetch(
        new Request(`https://spine/api/entities?${url.searchParams.toString()}`, {
          headers: request.headers,
        })
      );
    }

    // Strategic Hub §17.5: Goals and metrics (Rule 14 — trackable)
    if (url.pathname === "/api/v1/workspace/goals" && request.method === "GET") {
      return getGoalsAndMetrics(env, tenantId);
    }

    // HITL approval queue
    if (url.pathname === "/api/v1/cognitive/hitl/queue" && request.method === "GET") {
      return getApprovalQueue(env, tenantId);
    }

    // HITL approve/deny
    if (url.pathname === "/api/v1/cognitive/hitl/queue" && request.method === "POST") {
      const body = (await request.json()) as {
        action_id: string;
        decision: "approve" | "deny";
        reason?: string;
        actor?: string;
        domain?: string;
        viewId?: string;
      };
      const userId = request.headers.get("x-user-id") || body.actor || "";
      return handleApproval(body, env, tenantId, userId);
    }

    // HITL history (approved/denied actions for Governance UI)
    if (url.pathname === "/api/v1/cognitive/hitl/history" && request.method === "GET") {
      return getApprovalHistory(env, tenantId, url.searchParams);
    }

    // Durable Object HITL endpoints
    if (
      url.pathname === "/hitl/create" ||
      url.pathname === "/hitl/resolve" ||
      url.pathname === "/hitl/status" ||
      url.pathname === "/hitl/count"
    ) {
      return proxyHitlDo(request, env, url.pathname.replace("/hitl", ""));
    }
    if (
      url.pathname === "/api/v1/cognitive/hitl/create" ||
      url.pathname === "/api/v1/cognitive/hitl/resolve" ||
      url.pathname === "/api/v1/cognitive/hitl/status" ||
      url.pathname === "/api/v1/cognitive/hitl/count"
    ) {
      const suffix = url.pathname.replace("/api/v1/cognitive/hitl", "");
      return proxyHitlDo(request, env, suffix);
    }

    // Audit trail
    if (url.pathname === "/api/v1/cognitive/audit") {
      return getAuditLog(env, tenantId, url.searchParams);
    }

    // SSE stream for real-time events (legacy)
    if (url.pathname === "/stream/events") {
      return streamEvents(env, tenantId);
    }

    // Stream gateway: WebSocket/SSE via Durable Objects
    if (
      url.pathname.startsWith("/stream/") ||
      url.pathname.startsWith("/ws/") ||
      url.pathname.startsWith("/sse/")
    ) {
      if (env.SIGNAL_STREAM) {
        // Strip /stream prefix for the sub-app if present
        const streamUrl = new URL(request.url);
        if (streamUrl.pathname.startsWith("/stream/")) {
          streamUrl.pathname = streamUrl.pathname.replace("/stream", "");
        }
        const streamReq = new Request(streamUrl.toString(), request);
        return streamGatewayApp.fetch(streamReq, env);
      }
    }

    // Analytics endpoints — delegated to analytics sub-app
    if (url.pathname.startsWith("/analytics") || url.pathname.startsWith("/api/v1/analytics")) {
      const analyticsUrl = new URL(request.url);
      // Normalize: sub-app expects /conversion, /performance, etc. (no /analytics prefix)
      let path = analyticsUrl.pathname;
      if (path.startsWith("/api/v1/analytics"))
        path = path.replace("/api/v1/analytics", "/analytics");
      if (path.startsWith("/analytics")) path = path.replace(/^\/analytics/, "") || "/";
      analyticsUrl.pathname = path;
      const analyticsReq = new Request(analyticsUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      });
      return analytics.fetch(analyticsReq, env);
    }

    // Evidence trail for cognitive layer
    if (url.pathname.startsWith("/api/v1/cognitive/evidence")) {
      return getEvidence(env, tenantId, url.pathname, url.searchParams);
    }

    // Adaptive Spine initialization — seeds domain-specific expected fields
    if (url.pathname === "/api/v1/workspace/initialize-spine" && request.method === "POST") {
      return initializeAdaptiveSpine(env, tenantId, request);
    }

    // Schema template preview (12×11): entity types + priority fields for (industry, department)
    if (url.pathname === "/api/v1/workspace/schema-template" && request.method === "GET") {
      return getSchemaTemplate(env, tenantId, url.searchParams);
    }

    // Onboarding state - get current onboarding progress
    if (url.pathname === "/api/v1/workspace/onboarding-state" && request.method === "GET") {
      return getOnboardingState(env, tenantId);
    }

    // Complete onboarding - mark onboarding complete and create background jobs
    if (url.pathname === "/api/v1/workspace/complete-onboarding" && request.method === "POST") {
      return completeOnboarding(env, tenantId, request);
    }

    // Ensure connector hydration (post-onboarding confirmation).
    // Creamy is triggered at /api/v1/workspace/initialize-spine (gateway → loader/creamy)
    // and on the Nango auth.created webhook. This endpoint reports the connected
    // connectors from the Spine config (D1, single source) and deliberately does NOT
    // re-extract — re-triggering would double-load the same entities.
    if (url.pathname === "/api/v1/workspace/hydrate-connectors" && request.method === "POST") {
      let connected: string[] = [];
      try {
        const row = await env.DB.prepare(
          `SELECT connected_connectors FROM tenant_spine_config WHERE tenant_id = ?`
        )
          .bind(tenantId)
          .first<{ connected_connectors: string | null }>();
        if (row?.connected_connectors) {
          const parsed = JSON.parse(row.connected_connectors);
          if (Array.isArray(parsed)) connected = parsed;
        }
      } catch (err) {
        console.warn(
          "[Workflow] hydrate-connectors: failed to read spine config:",
          err instanceof Error ? err.message : err
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          connectors: connected,
          message:
            "Creamy hydration is triggered at initialize-spine and on connect; no re-extract performed.",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Sync progress - JSON snapshot by default, SSE when requested explicitly
    if (url.pathname === "/api/v1/workspace/progress" && request.method === "GET") {
      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/event-stream")) {
        return getSyncProgressSSE(env, tenantId);
      }
      return getSyncProgress(env, tenantId);
    }

    // Spine completeness scoring
    if (url.pathname === "/api/v1/workspace/completeness") {
      return getSpineCompleteness(env, tenantId);
    }

    // Workspace L1 routes (navigation, space, view, hydration manifest) — handled by stream-gateway Hono app
    if (
      url.pathname.startsWith("/api/v1/workspace/cs/") ||
      url.pathname.startsWith("/api/v1/workspace/csm/") ||
      url.pathname.startsWith("/api/v1/workspace/tam/") ||
      url.pathname.startsWith("/api/v1/workspace/success/") ||
      url.pathname.startsWith("/api/v1/workspace/bi/")
    ) {
      const rewrittenPath = url.pathname.replace("/api", "");
      const rewritten = new Request(`https://bff${rewrittenPath}${url.search ? url.search : ""}`, {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      });
      return streamGatewayApp.fetch(rewritten, env);
    }

    if (url.pathname === "/api/v1/workspace/navigation" && request.method === "GET") {
      const rewritten = new Request(
        `https://bff/v1/workspace/navigation${url.search ? url.search : ""}`,
        { method: "GET", headers: request.headers }
      );
      return streamGatewayApp.fetch(rewritten, env);
    }
    if (url.pathname.startsWith("/api/v1/workspace/space/") && request.method === "GET") {
      const spaceType =
        url.pathname.replace("/api/v1/workspace/space/", "").split("/")[0] || "personal";
      const rewritten = new Request(
        `https://bff/v1/workspace/space/${spaceType}${url.search ? url.search : ""}`,
        { method: "GET", headers: request.headers }
      );
      return streamGatewayApp.fetch(rewritten, env);
    }
    if (url.pathname.startsWith("/api/v1/workspace/view/") && request.method === "GET") {
      const viewId = url.pathname.replace("/api/v1/workspace/view/", "").split("/")[0] || "";
      if (viewId) {
        const rewritten = new Request(
          `https://bff/v1/workspace/view/${viewId}${url.search ? url.search : ""}`,
          { method: "GET", headers: request.headers }
        );
        return streamGatewayApp.fetch(rewritten, env);
      }
    }
    if (url.pathname === "/api/v1/workspace/hydration/manifest" && request.method === "GET") {
      const rewritten = new Request(
        `https://bff/v1/workspace/hydration/manifest${url.search ? url.search : ""}`,
        { method: "GET", headers: request.headers }
      );
      return streamGatewayApp.fetch(rewritten, env);
    }

    if (url.pathname === "/api/v1/workspace/connectors" && request.method === "GET") {
      return getWorkspaceConnectors(env, tenantId);
    }

    return new Response(
      JSON.stringify({
        error: "Not found",
        message: `No route matches ${url.pathname}`,
        code: "ROUTE_NOT_FOUND",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (env.ANALYTICS_DB) {
      ctx.waitUntil(runDailyAggregation(env.ANALYTICS_DB));
    }
  },
};

async function proxyHitlDo(request: Request, env: Env, suffix: string): Promise<Response> {
  const id = env.HITL_GATE.idFromName("global");
  const stub = env.HITL_GATE.get(id);
  const proxiedUrl = `http://hitl${suffix}`;
  const proxied = new Request(proxiedUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
  });
  return stub.fetch(proxied);
}

export { HITLGate };

/** Build set of entity types allowed for tenant's domains (Spine-only hardening). When no domains, returns null = allow all. Uses getSpineConfig when industry is set. */
function getAllowedEntityTypesForTenant(
  tenantDomains: string[],
  industry?: string | null
): Set<string> | null {
  if (!tenantDomains?.length) return null;
  const allowed = new Set<string>();
  for (const d of tenantDomains) {
    const config = industry
      ? getSpineConfig(industry, d)
      : (DOMAIN_SPINE_CONFIG as Record<string, { entity_types?: string[] }>)[
          TENANT_DOMAIN_TO_READINESS_KEY[d] || d
        ];
    if (config?.entity_types) for (const et of config.entity_types) allowed.add(et);
  }
  return allowed.size > 0 ? allowed : null;
}

/** Tenant-grown schema from spine_schema_registry (schema grows with syncs; merge with baseline so router picks it up). */
export interface TenantGrownSchema {
  entityTypes: Set<string>;
  fieldsByEntity: Record<string, Set<string>>;
}

async function getTenantGrownSchema(env: Env, tenantId: string): Promise<TenantGrownSchema> {
  const entityTypes = new Set<string>();
  const fieldsByEntity: Record<string, Set<string>> = {};
  if (!tenantId || !env.DB) return { entityTypes, fieldsByEntity };
  try {
    // CF-only (DECISION 22): tenant-grown schema from D1. Table may be absent on
    // a tenant that hasn't grown its schema — the query then throws and we return baseline.
    const res = await env.DB.prepare(
      "SELECT entity_type, field_path, field_key FROM spine_schema_registry WHERE tenant_id = ?"
    )
      .bind(tenantId)
      .all<{ entity_type: string; field_path: string | null; field_key: string | null }>();
    for (const row of res.results || []) {
      const et = row.entity_type;
      const field = row.field_path || row.field_key || "";
      if (et) entityTypes.add(et);
      if (et && field) {
        if (!fieldsByEntity[et]) fieldsByEntity[et] = new Set();
        fieldsByEntity[et].add(field);
      }
    }
  } catch {
    // table missing / tenant hasn't grown schema — baseline only
  }
  return { entityTypes, fieldsByEntity };
}

/** Allowed entity types = baseline (industry × department) ∪ tenant-grown (spine_schema_registry). So when schema grows, router picks it up. */
async function getAllowedEntityTypesForTenantWithGrowth(
  env: Env,
  tenantId: string,
  tenantDomains: string[],
  industry?: string | null
): Promise<Set<string> | null> {
  const baseline = getAllowedEntityTypesForTenant(tenantDomains, industry);
  const grown = await getTenantGrownSchema(env, tenantId);
  if (grown.entityTypes.size === 0) return baseline;
  const merged = new Set<string>(baseline || []);
  for (const et of grown.entityTypes) merged.add(et);
  return merged.size > 0 ? merged : baseline;
}

function getBaselineFieldsByEntity(
  tenantDomains: string[],
  industry?: string | null
): Record<string, Set<string>> {
  const fieldsByEntity: Record<string, Set<string>> = {};
  for (const domain of tenantDomains) {
    const config = industry
      ? getSpineConfig(industry, domain)
      : (DOMAIN_SPINE_CONFIG as Record<string, SpineConfigShape>)[
          TENANT_DOMAIN_TO_READINESS_KEY[domain] || domain
        ];
    if (!config?.priority_fields) continue;
    for (const [entityType, fields] of Object.entries(config.priority_fields)) {
      if (!fieldsByEntity[entityType]) fieldsByEntity[entityType] = new Set();
      for (const field of fields) fieldsByEntity[entityType].add(field);
    }
  }
  return fieldsByEntity;
}

async function getResolvedFieldsByEntityForTenant(
  env: Env,
  tenantId: string,
  tenantDomains: string[],
  industry?: string | null
): Promise<Record<string, string[]>> {
  const baselineFields = getBaselineFieldsByEntity(tenantDomains, industry);
  const grown = await getTenantGrownSchema(env, tenantId);
  for (const [entityType, fieldSet] of Object.entries(grown.fieldsByEntity)) {
    if (!baselineFields[entityType]) baselineFields[entityType] = new Set();
    for (const field of fieldSet) baselineFields[entityType].add(field);
  }
  return Object.fromEntries(
    Object.entries(baselineFields).map(([entityType, fieldSet]) => [
      entityType,
      Array.from(fieldSet).sort(),
    ])
  );
}

interface TenantCapabilityRecord {
  status: string;
  connectedAt?: string;
  provider: string;
  providerWorkspaceId?: string | null;
  capabilities?: {
    auth: boolean;
    webhook: boolean;
    mcp: string[];
    supportedEntities: string[];
  };
}

async function getTenantActiveCapabilities(
  env: Env,
  tenantId: string
): Promise<Record<string, TenantCapabilityRecord>> {
  const capMap: Record<string, TenantCapabilityRecord> = {};

  if (env.CONNECTOR_STATUS) {
    try {
      const prefix = `tenant:${tenantId}:connector:`;
      const listed = await env.CONNECTOR_STATUS.list({ prefix });
      for (const key of listed.keys) {
        const provider = key.name.slice(prefix.length);
        if (!provider) continue;
        const raw = await env.CONNECTOR_STATUS.get(key.name);
        if (!raw) continue;
        try {
          capMap[provider] = JSON.parse(raw) as TenantCapabilityRecord;
        } catch {
          capMap[provider] = { status: "connected", provider };
        }
      }
    } catch {}
  }

  if (Object.keys(capMap).length === 0 && env.DB) {
    try {
      // CF-only (DECISION 22): connected connectors from the D1 connectors table.
      const res = await env.DB.prepare(
        "SELECT provider, status, updated_at FROM connectors WHERE tenant_id = ? AND status = 'connected'"
      )
        .bind(tenantId)
        .all<{ provider: string; status: string; updated_at: string }>();
      for (const row of res.results || []) {
        capMap[row.provider] = {
          status: "connected",
          connectedAt: row.updated_at,
          provider: row.provider,
        };
      }
    } catch {
      /* table missing — KV is the primary source */
    }
  }

  return capMap;
}

async function getWorkspaceConnectors(env: Env, tenantId: string): Promise<Response> {
  try {
    const catalog = getSerializableCatalog();
    const kvCapabilities = await getTenantActiveCapabilities(env, tenantId);

    // Domain-based relevance: read tenant config to score connectors
    const tenantConfig = await getTenantSpineConfigJson(env, tenantId);
    const domains = tenantConfig.domains ?? [];
    const primaryDomain = domains[0] || "";

    const enrichedConnectors = catalog.map((entry) => {
      const kvState = kvCapabilities[entry.id];
      const isConnected = kvState?.status === "connected";
      const relevance = scoreConnectorRelevance(entry, primaryDomain);
      return {
        ...entry,
        status: isConnected ? "connected" : "available",
        connectedAt: kvState?.connectedAt || null,
        relevance,
        supportedCapabilities: {
          auth: true,
          webhook: entry.webhookSupport ?? false,
          mcp: entry.mcpTools ?? [],
          supportedEntities: entry.supportedEntities ?? [],
        },
        capabilities: {
          auth: isConnected,
          webhook: isConnected && (kvState?.capabilities?.webhook ?? entry.webhookSupport ?? false),
          mcp: isConnected ? (kvState?.capabilities?.mcp ?? entry.mcpTools ?? []) : [],
          supportedEntities: entry.supportedEntities ?? [],
        },
      };
    });

    // Sort: connected first, then by relevance (high → low), then alphabetical
    enrichedConnectors.sort((a, b) => {
      if (a.status === "connected" && b.status !== "connected") return -1;
      if (b.status === "connected" && a.status !== "connected") return 1;
      if (a.relevance !== b.relevance) return b.relevance - a.relevance;
      return (a.name || "").localeCompare(b.name || "");
    });

    const connected = enrichedConnectors.filter((c) => c.status === "connected");

    return new Response(
      JSON.stringify({
        connectors: enrichedConnectors,
        summary: {
          total: enrichedConnectors.length,
          connected: connected.length,
          available: enrichedConnectors.length - connected.length,
          totalEntitiesSynced: 0,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[BFF] getWorkspaceConnectors error:", error);
    return new Response(JSON.stringify({ error: "Failed to load connectors" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Domain → connector relevance scoring
// Returns 0-100: how relevant a connector is for the tenant's primary domain
const DOMAIN_CONNECTOR_RELEVANCE: Record<string, Record<string, number>> = {
  CUSTOMER_SUCCESS: {
    hubspot: 95,
    salesforce: 95,
    zendesk: 90,
    intercom: 90,
    freshdesk: 85,
    slack: 80,
    gmail: 80,
    google_calendar: 75,
    jira: 60,
    stripe: 70,
    notion: 60,
  },
  SALES: {
    hubspot: 95,
    salesforce: 95,
    pipedrive: 90,
    gmail: 85,
    google_calendar: 85,
    slack: 75,
    linkedin: 80,
    stripe: 70,
    zoom: 75,
    calendly: 80,
  },
  REVOPS: {
    hubspot: 95,
    salesforce: 95,
    stripe: 90,
    razorpay: 85,
    google_analytics: 80,
    gmail: 70,
    slack: 65,
  },
  MARKETING: {
    hubspot: 90,
    google_analytics: 95,
    mailchimp: 90,
    linkedin: 85,
    meta: 85,
    google_ads: 90,
    webflow: 80,
    notion: 70,
    slack: 65,
  },
  BIZOPS: {
    hubspot: 85,
    salesforce: 85,
    slack: 90,
    notion: 85,
    jira: 80,
    asana: 80,
    google_calendar: 80,
    gmail: 80,
    stripe: 75,
    google_analytics: 70,
    monday: 75,
  },
  FINANCE: {
    stripe: 95,
    razorpay: 95,
    quickbooks: 95,
    xero: 90,
    hubspot: 60,
    gmail: 65,
    slack: 60,
  },
  SERVICE: {
    zendesk: 95,
    freshdesk: 95,
    intercom: 90,
    hubspot: 75,
    slack: 80,
    jira: 70,
    gmail: 75,
  },
  PRODUCT_ENGINEERING: {
    jira: 95,
    github: 95,
    gitlab: 90,
    linear: 90,
    slack: 80,
    notion: 75,
    figma: 80,
    sentry: 85,
  },
  IT_ADMIN: { jira: 80, github: 75, slack: 80, pagerduty: 90, datadog: 85, notion: 60 },
  PROCUREMENT: { hubspot: 60, quickbooks: 80, xero: 75, slack: 65, gmail: 65, notion: 60 },
  STUDENT_TEACHER: { google_calendar: 85, notion: 90, slack: 80, gmail: 80, zoom: 85 },
  PERSONAL: { google_calendar: 90, gmail: 85, notion: 85, todoist: 90, slack: 75 },
};

function scoreConnectorRelevance(connector: any, domain: string): number {
  const domainScores = DOMAIN_CONNECTOR_RELEVANCE[domain];
  if (!domainScores) return 50; // default mid-relevance
  const connectorId = (connector.id || "").toLowerCase();
  return domainScores[connectorId] ?? 40; // unknown connectors get low relevance
}

async function getDashboard(env: Env, tenantId: string, domain = ""): Promise<Response> {
  try {
    // Spine-only hardening: resolve tenant_id → tenant Spine config; scope to tenant's domains
    const tenantConfig = await getTenantSpineConfigJson(env, tenantId);
    const tenantDomains = tenantConfig.domains?.length ? tenantConfig.domains : [];
    const effectiveDomain = domain || (tenantDomains.length > 0 ? tenantDomains[0] : "");
    const allowedEntityTypes = await getAllowedEntityTypesForTenantWithGrowth(
      env,
      tenantId,
      tenantDomains,
      tenantConfig.industry
    );
    const qs = effectiveDomain ? `?domain=${effectiveDomain}&limit=50` : "?limit=50";
    const entitiesRes = await env.SPINE.fetch(
      new Request(`https://spine/api/entities${qs}`, { headers: { "x-tenant-id": tenantId } })
    );
    const entitiesData = (await entitiesRes.json()) as { entities?: any[] };
    let entities = entitiesData.entities || [];
    if (allowedEntityTypes) {
      entities = entities.filter((e: any) => allowedEntityTypes.has(e.entity_type || e.type || ""));
    }

    const accounts = entities.filter((e: any) => e.entity_type === "account");
    const opportunities = entities.filter(
      (e: any) =>
        e.entity_type === "opportunity" ||
        resolveEntityTypeAlias(e.entity_type || "") === "opportunity"
    );
    const tasks = entities.filter((e: any) => e.entity_type === "task");
    const tickets = entities.filter((e: any) => e.entity_type === "ticket");
    const engagements = entities.filter((e: any) => e.entity_type === "engagement");
    const risks = entities.filter(
      (e: any) =>
        e.entity_type === "risk_register" ||
        resolveEntityTypeAlias(e.entity_type || "") === "risk_register"
    );
    const insights = entities.filter((e: any) => e.entity_type === "generated_insight");
    const contacts = entities.filter((e: any) => e.entity_type === "contact");

    // Signals from Think
    let signals: any[] = [];
    try {
      const signalsRes = await env.THINK.fetch(
        new Request("https://think/v1/signals", {
          headers: { "x-tenant-id": tenantId },
        })
      );
      const sd = (await signalsRes.json()) as {
        signals?: any[];
        recent_signals?: any[];
        data?: any[];
      };
      const rawSignals = sd.recent_signals || sd.data || sd.signals || [];
      signals = rawSignals.map((s: any) => ({
        id: s.id || crypto.randomUUID(),
        title: s.title || s.name || "Signal",
        severity: s.severity || "medium",
        description: s.description || s.summary || "",
        created_at: s.created_at || s.computed_at || new Date().toISOString(),
      }));
    } catch {
      /* non-blocking */
    }

    let pendingApprovals = 0;
    try {
      if (env.DB) {
        const res = await env.DB.prepare(
          "SELECT COUNT(*) as c FROM actions WHERE tenant_id = ? AND status = 'pending_approval'"
        )
          .bind(tenantId)
          .first<{ c: number }>();
        pendingApprovals = res?.c || 0;
      }
    } catch {
      /* ignore actions table missing */
    }

    let connectors: Array<{
      tool_name: string;
      status: string;
      entity_count: number;
      last_sync_at: string;
    }> = [];

    try {
      const kvCapabilities = await getTenantActiveCapabilities(env, tenantId);
      const connectedKeys = new Set(Object.keys(kvCapabilities));

      // Fallback: merge with spine config connectors if not present in active capabilities
      if (tenantConfig.connected_connectors) {
        for (const conn of tenantConfig.connected_connectors) {
          if (!connectedKeys.has(conn)) {
            kvCapabilities[conn] = {
              status: "connected",
              provider: conn,
              connectedAt:
                (tenantConfig.depth_matrix_snapshot?.updated_at as string) ||
                new Date().toISOString(),
            };
          }
        }
      }

      connectors = Object.entries(kvCapabilities)
        .filter(([_, cap]) => cap.status === "connected")
        .map(([provider, cap]) => {
          const providerEntities = entities.filter(
            (e: any) =>
              (e.source || e.fields?.source || "").toLowerCase() === provider.toLowerCase()
          );
          return {
            tool_name: provider,
            status: "active",
            entity_count: providerEntities.length,
            last_sync_at: cap.connectedAt || new Date().toISOString(),
          };
        });
    } catch (err) {
      console.warn("[workflow] getDashboard: failed to fetch connectors status:", err);
    }

    const totalArr = accounts.reduce((s: number, a: any) => s + (a.arr || a.fields?.arr || 0), 0);
    const avgHealth =
      accounts.length > 0
        ? Math.round(
            accounts.reduce(
              (s: number, a: any) => s + (a.health_score || a.fields?.health_score || 0),
              0
            ) / accounts.length
          )
        : 0;

    return new Response(
      JSON.stringify({
        domain: effectiveDomain || domain || "all",
        tenant_domains: tenantDomains,
        entity_count: entities.length,
        active_signals: signals.length,
        pending_approvals: pendingApprovals,
        connectors,
        summary: {
          totalAccounts: accounts.length,
          totalContacts: contacts.length,
          totalOpportunities: opportunities.length,
          pipelineValue: opportunities.reduce(
            (s: number, o: any) => s + (o.amount || o.fields?.amount || 0),
            0
          ),
          totalArr: totalArr,
          avgHealthScore: avgHealth,
          winRate: 0,
          forecastQ1: 0,
          quotaQ1: 0,
          closedWonQ1: 0,
        },
        accounts: accounts.slice(0, 20),
        deals: opportunities.slice(0, 20),
        tasks: tasks.slice(0, 10),
        tickets: tickets.slice(0, 10),
        engagements: engagements.slice(0, 10),
        risks: risks.slice(0, 10),
        insights: insights.slice(0, 10),
        signals,
        pipelineByStage: [],
        leaderboard: [],
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function getApprovalQueue(env: Env, tenantId: string): Promise<Response> {
  // CF-only (DECISION 22): action/governance loop reads from D1. Returns empty
  // until the governance D1 schema (actions) is provisioned — no Supabase.
  let approvals: unknown[] = [];
  try {
    if (env.DB) {
      const res = await env.DB.prepare(
        "SELECT * FROM actions WHERE tenant_id = ? AND status = 'pending_approval' ORDER BY created_at DESC"
      )
        .bind(tenantId)
        .all();
      approvals = res.results || [];
    }
  } catch {
    /* actions table not yet in D1 */
  }
  return new Response(JSON.stringify({ approvals }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleApproval(
  body: {
    action_id: string;
    decision: "approve" | "deny";
    reason?: string;
    actor?: string;
    domain?: string;
    viewId?: string;
  },
  env: Env,
  tenantId: string,
  userId: string
): Promise<Response> {
  const newStatus = body.decision === "approve" ? "approved" : "rejected";
  const now = new Date().toISOString();
  let data: any = null;

  if (env.DB) {
    try {
      await env.DB.prepare(
        `UPDATE approval_queue SET status = ?, approved_by = ?, approved_at = ?, draft_only = 0, updated_at = ? WHERE id = ? AND tenant_id = ?`
      )
        .bind(newStatus, userId, now, now, body.action_id, tenantId)
        .run();

      data = await env.DB.prepare(
        `SELECT id, proposal_type, payload FROM approval_queue WHERE id = ? AND tenant_id = ?`
      )
        .bind(body.action_id, tenantId)
        .first();
    } catch (dbErr: any) {
      console.error("[Workflow:handleApproval] D1 update failed:", dbErr);
      return new Response(JSON.stringify({ error: dbErr.message }), { status: 500 });
    }
  }

  if (body.decision === "approve" && data) {
    const payloadParsed =
      typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
    await env.ACT_QUEUE.send({
      action_id: data.id,
      tenant_id: tenantId,
      action_type: data.proposal_type || "general",
      target_tool: "pipeline",
      payload: payloadParsed,
      approval_token: crypto.randomUUID(),
    });
  }

  if (body.decision === "deny" && data && env.THINK) {
    env.THINK.fetch(
      new Request("http://think/v1/decisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          type: "rejection_feedback",
          action_id: data.id,
          action_type: data.proposal_type || "general",
          rejected_by: userId,
          reason: body.reason || "No reason provided",
        }),
      })
    ).catch(() => {});
  }

  if (env.DB && data) {
    try {
      await env.DB.prepare(
        `INSERT INTO audit_log (id, tenant_id, event_type, actor_entity_id, actor_type, target_id, target_type, approval_id, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          crypto.randomUUID(),
          tenantId,
          newStatus,
          userId,
          "user",
          body.action_id,
          "approval_queue",
          body.action_id,
          JSON.stringify({
            action_type: data.proposal_type || "general",
            decision: body.decision,
            reason: body.reason || null,
            domain: body.domain || null,
            viewId: body.viewId || null,
          }),
          now
        )
        .run();
    } catch (auditErr: any) {
      console.error("[Workflow:handleApproval] D1 audit_log failed:", auditErr);
    }
  }

  return new Response(JSON.stringify({ status: newStatus, action: data }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function getApprovalHistory(
  env: Env,
  tenantId: string,
  params: URLSearchParams
): Promise<Response> {
  const status = params.get("status") || "approved"; // 'approved' | 'denied'
  const limit = Math.min(parseInt(params.get("limit") || "50", 10) || 50, 100);
  let items: unknown[] = [];
  try {
    if (env.DB) {
      const res = await env.DB.prepare(
        "SELECT * FROM approval_queue WHERE tenant_id = ? AND status = ? ORDER BY approved_at DESC LIMIT ?"
      )
        .bind(tenantId, status, limit)
        .all();
      items = res.results || [];
    }
  } catch {
    /* actions table not yet in D1 */
  }
  return new Response(JSON.stringify({ items }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function getAuditLog(env: Env, tenantId: string, params: URLSearchParams): Promise<Response> {
  const limit = parseInt(params.get("limit") || "50");
  let entries: unknown[] = [];
  try {
    if (env.DB) {
      const res = await env.DB.prepare(
        "SELECT * FROM audit_log WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?"
      )
        .bind(tenantId, limit)
        .all();
      entries = res.results || [];
    }
  } catch {
    /* audit_log table not yet in D1 */
  }
  return new Response(JSON.stringify({ entries }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Schema imports from @integratewise/types ────────────────────────────────
// DOMAIN_SPINE_CONFIG, getSpineConfig, DEPARTMENT_TO_CONFIG_KEY, INDUSTRY_SPINE_BASE,
// ORGANIC_CAPABILITY_MAP, normalizeDepartmentId, SpineConfigShape — all imported at top.
// Removed 1588-line duplicate block. Single source of truth: packages/types/src/schema.ts
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get schema template for onboarding preview.
 * Returns ORGANIC capabilities (user-friendly descriptions), NOT entity_type names.
 * PRINCIPLE: Schema is Backend IP - Frontend NEVER sees entity_type or field names.
 */
async function getSchemaTemplate(
  env: Env,
  tenantId: string,
  params: URLSearchParams
): Promise<Response> {
  const rawDepartment = params.get("department") || params.get("dept") || params.get("domain");
  const rawIndustry = params.get("industry");

  let department = normalizeDepartmentId(rawDepartment);
  let industry: string | null | undefined = rawIndustry ? rawIndustry.trim() : null;

  // Fallback to tenant config when query params aren't provided.
  if (!rawDepartment || !rawDepartment.trim() || !industry) {
    try {
      const tenantConfig = tenantId ? await getTenantSpineConfigJson(env, tenantId) : null;
      if (!rawDepartment || !rawDepartment.trim()) {
        const first = tenantConfig?.domains?.[0];
        if (first) department = normalizeDepartmentId(first);
      }
      if (!industry) {
        industry = tenantConfig?.industry ?? null;
      }
    } catch {
      /* ignore */
    }
  }

  // Get internal config (entity_types) - Backend IP, NOT exposed to frontend
  const configKey = DEPARTMENT_TO_CONFIG_KEY[department] || department;
  const config = getSpineConfig(industry, department);

  // Return ORGANIC capabilities - user-friendly descriptions
  // Frontend sees: "Account Management", "Pipeline Management"
  // Backend knows: entity_types = ["account", "opportunity", ...]
  const capabilities = ORGANIC_CAPABILITY_MAP[configKey] || ORGANIC_CAPABILITY_MAP.BIZOPS;

  return new Response(
    JSON.stringify({
      department,
      industry: industry ?? null,
      configKey,
      capabilities, // ORGANIC - NO entity_type names
      // NOTE: entity_types and priority_fields are Backend IP - NOT exposed
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

async function initializeAdaptiveSpine(
  _env: Env,
  tenantId: string,
  _request: Request
): Promise<Response> {
  // DEPRECATED (DECISION 22 / spine-hydration-lifecycle task 2.1).
  // The Spine schema is written ONLY by the CF Gateway to D1 (single source of truth,
  // services/gateway/src/workspace-spine.ts). This path previously provisioned tables
  // on a non-Cloudflare store and wrote schema via the connector, creating split-brain
  // state. It no longer performs any write. Creamy hydration is triggered on the
  // Cloudflare path (see spine-hydration-lifecycle task 3.1).
  console.warn(
    "[Workflow] /api/v1/workspace/initialize-spine is DEPRECATED — schema is written by " +
      "the CF Gateway to D1. No write performed."
  );
  return new Response(
    JSON.stringify({
      success: true,
      deprecated: true,
      message:
        "initialize-spine is handled by the CF Gateway (D1). This endpoint no longer writes.",
      tenantId,
    }),
    { status: 410, headers: { "Content-Type": "application/json" } }
  );
}

// ── Register Connector (post-onboarding) ─────────────────────────────────────
// Called when a user adds a new connector after initial onboarding.
// 1. Records the connector in tenant_spine_config.connected_connectors
// 2. Resolves which new entity types the connector brings
// 3. Expands spine_schema_registry with new entity types (schema grows)
// 4. Provisions tables for any new entity types (idempotent)
// 5. Triggers initial sync for the connector
async function registerConnector(env: Env, tenantId: string, request: Request): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const provider = body.provider;
  const flowType = body.flowType || "A";
  if (!provider) {
    return new Response(JSON.stringify({ error: "provider is required" }), { status: 400 });
  }

  try {
    // 1. Read current tenant config (D1 SSOT — DECISION 22)
    const tenantConfig = await getTenantSpineConfigJson(env, tenantId);
    const industry = tenantConfig.industry ?? null;
    const departments = tenantConfig.domains ?? [];
    const primaryDept = departments[0] || "BIZOPS";

    // 2. Resolve current schema + connector's entity types
    const config = getSpineConfig(industry, primaryDept);

    // 3. Record connector in tenant_spine_config (D1, not Supabase)
    const existingConnectors = tenantConfig.connected_connectors ?? [];
    const updatedConnectors = Array.isArray(existingConnectors)
      ? [...new Set([...existingConnectors, provider])]
      : [...new Set([...Object.keys(existingConnectors), provider])];

    if (env.DB) {
      await env.DB.prepare(
        `UPDATE tenant_spine_config SET connected_connectors = ?, updated_at = datetime('now') WHERE tenant_id = ?`
      )
        .bind(JSON.stringify(updatedConnectors), tenantId)
        .run();
    }

    // 6. Trigger initial sync if Flow A
    let syncJob = null;
    if (flowType === "A") {
      try {
        const creamyResponse = await env.CONNECTOR.fetch(
          new Request("https://connector/api/v1/loader/creamy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-id": tenantId,
            },
            body: JSON.stringify({
              connector: provider,
              entityTypes: config.entity_types,
              options: { limit: 100 },
            }),
          })
        );
        if (creamyResponse.ok) {
          syncJob = await creamyResponse.json();
        }
      } catch {
        /* non-blocking — sync can be retried */
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        provider,
        flowType,
        connectedConnectors: updatedConnectors,
        syncJob,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Onboarding state - get current onboarding progress (D1 primary, DECISION 22)
async function getOnboardingState(env: Env, tenantId: string): Promise<Response> {
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "No tenant context" }), { status: 400 });
  }

  // D1 path
  if (env.DB) {
    try {
      // Ensure table (idempotent, no migration needed for this legacy state)
      await env.DB.prepare(
        `
        CREATE TABLE IF NOT EXISTS tenant_onboarding_state (
          tenant_id TEXT PRIMARY KEY,
          status TEXT,
          current_step TEXT,
          completed_steps TEXT,
          completed_at TEXT,
          preferences TEXT,
          connectors_config TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT
        )
      `
      ).run();

      const row = await env.DB.prepare(
        `SELECT status, current_step, completed_steps, completed_at, preferences, connectors_config
         FROM tenant_onboarding_state WHERE tenant_id = ? LIMIT 1`
      )
        .bind(tenantId)
        .first<any>();

      const onboarding = row
        ? {
            status: row.status || "not_started",
            current_step: row.current_step || "identity",
            completed_steps: row.completed_steps ? JSON.parse(row.completed_steps) : [],
            completed_at: row.completed_at,
            preferences: row.preferences ? JSON.parse(row.preferences) : {},
            connectors_config: row.connectors_config ? JSON.parse(row.connectors_config) : null,
          }
        : {
            status: "not_started",
            current_step: "identity",
            completed_steps: [],
          };

      return new Response(JSON.stringify({ onboarding }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (d1Err) {
      console.warn("[Workflow] D1 getOnboardingState failed, falling back to default:", d1Err);
    }
  }

  return new Response(
    JSON.stringify({
      onboarding: { status: "not_started", current_step: "identity", completed_steps: [] },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

// Complete onboarding - mark complete and create background jobs (D1 primary for state)
async function completeOnboarding(env: Env, tenantId: string, request: Request): Promise<Response> {
  try {
    const body: any = await request.json().catch(() => ({}));
    const correlationId = request.headers.get("x-correlation-id") || crypto.randomUUID();

    // D1 first for tenant_onboarding_state (replaces Supabase + RPC-era provisioning)
    let connectorsConfig: any = null;
    if (env.DB) {
      try {
        await env.DB.prepare(
          `
          CREATE TABLE IF NOT EXISTS tenant_onboarding_state (
            tenant_id TEXT PRIMARY KEY,
            status TEXT,
            current_step TEXT,
            completed_steps TEXT,
            completed_at TEXT,
            preferences TEXT,
            connectors_config TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT
          )
        `
        ).run();

        await env.DB.prepare(
          `INSERT INTO tenant_onboarding_state (tenant_id, status, completed_at, preferences, connectors_config, updated_at)
           VALUES (?, 'completed', ?, ?, ?, datetime('now'))
           ON CONFLICT(tenant_id) DO UPDATE SET
             status = 'completed',
             completed_at = excluded.completed_at,
             preferences = excluded.preferences,
             connectors_config = COALESCE(excluded.connectors_config, connectors_config),
             updated_at = datetime('now')`
        )
          .bind(
            tenantId,
            new Date().toISOString(),
            JSON.stringify(body.preferences || {}),
            body.connectors_config ? JSON.stringify(body.connectors_config) : null
          )
          .run();

        const row = await env.DB.prepare(
          `SELECT connectors_config FROM tenant_onboarding_state WHERE tenant_id = ?`
        )
          .bind(tenantId)
          .first<{ connectors_config?: string }>();
        if (row?.connectors_config) {
          try {
            connectorsConfig = JSON.parse(row.connectors_config);
          } catch {}
        }
      } catch (d1Err) {
        console.warn("[Workflow] D1 completeOnboarding state failed:", d1Err);
      }
    }

    // Get connectors from (D1 or legacy) config — modern path uses connector fetch (queues)
    let connectorsToSync = Array.isArray(connectorsConfig) ? connectorsConfig : [];
    if (connectorsToSync.length === 0 && body.preferences?.connectors) {
      connectorsToSync = body.preferences.connectors.map((p: string) => ({
        provider: p,
        flowType: "A",
      }));
    }

    // Create background sync via loader (D1/queue path, no Supabase sync_jobs)
    const backgroundJobs: Array<{ jobId: string; type: string; status: string }> = [];

    for (const connector of connectorsToSync) {
      if (connector && connector.flowType === "A" && connector.provider) {
        try {
          const res = await env.CONNECTOR.fetch(
            new Request("https://connector/api/v1/loader/background-sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-id": tenantId,
                "x-correlation-id": correlationId,
              },
              body: JSON.stringify({
                tenantId,
                connector: connector.provider,
                phase: "needed",
              }),
            })
          );
          if (res.ok) {
            const jobData = (await res.json().catch(() => ({}))) as any;
            backgroundJobs.push({
              jobId: jobData.jobId || jobData.id || `bg-${connector.provider}`,
              type: "CONTINUOUS_SYNC",
              status: "queued",
            });
          }
        } catch (syncErr) {
          console.warn("[Workflow] background sync trigger failed (non-fatal):", syncErr);
        }
      }
    }

    // Kick off any additional creamy if needed (mirrors registerConnector path)
    if (connectorsToSync.length) {
      try {
        await env.CONNECTOR.fetch(
          new Request("https://connector/api/v1/loader/creamy", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
            body: JSON.stringify({ connectors: connectorsToSync }),
          })
        );
      } catch {}
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: "/app",
        backgroundJobs,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function loadSyncJobs(env: Env, tenantId: string) {
  // Modern sync progress is driven by loader -> pipeline D1 writes + queues.
  // Legacy sync_jobs table removed from product plane (desupabase).
  if (env.DB) {
    try {
      // Optional: a light D1 mirror table for job status could be added later.
      // For now return empty list; frontend falls back to connector status or Entity 360.
      const rows = await env.DB.prepare(
        `SELECT id as job_id, connector, phase, status, progress FROM sync_jobs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 20`
      )
        .bind(tenantId)
        .all()
        .catch(() => ({ results: [] as any[] }));
      if (rows.results && rows.results.length) {
        return rows.results.map((j: any) => ({
          jobId: j.job_id || j.id,
          connector: j.connector,
          phase: j.phase,
          status: j.status || "unknown",
          progress: j.progress || {},
        }));
      }
    } catch {}
  }
  // No Supabase. Return empty (real progress via /connector status or pipeline entities).
  return [];
}

async function getSyncProgress(env: Env, tenantId: string): Promise<Response> {
  try {
    const jobs = await loadSyncJobs(env, tenantId);

    return new Response(
      JSON.stringify({
        type: "sync_progress",
        jobs,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Real-time sync progress - SSE endpoint
async function getSyncProgressSSE(env: Env, tenantId: string): Promise<Response> {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const sendProgress = async () => {
        try {
          const jobs = await loadSyncJobs(env, tenantId);
          const payload = JSON.stringify({
            type: "sync_progress",
            jobs,
          });

          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (error) {
          console.error("[Workflow] Progress SSE error:", error);
        }
      };

      // Send every 2 seconds
      interval = setInterval(sendProgress, 2000);

      // Send initial
      sendProgress();
    },
    cancel() {
      if (interval) {
        clearInterval(interval);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function getEvidence(
  env: Env,
  tenantId: string,
  pathname: string,
  params: URLSearchParams
): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "D1 not configured" }), { status: 500 });
  }

  // Extract entityId from path: /api/v1/cognitive/evidence/:entityId
  const entityId = pathname.split("/").pop();
  const entityType = params.get("type");

  try {
    let query = "SELECT * FROM audit_log WHERE tenant_id = ?";
    const queryParams: any[] = [tenantId];

    if (entityId && entityId !== "evidence") {
      query += " AND target_id = ?";
      queryParams.push(entityId);
    }
    if (entityType) {
      query += " AND target_type = ?";
      queryParams.push(entityType);
    }

    query += " ORDER BY created_at DESC LIMIT 50";

    const { results } = await env.DB.prepare(query)
      .bind(...queryParams)
      .all();

    const evidence = (results || []).map((entry: any) => ({
      id: entry.id,
      type: entry.event_type,
      source: entry.target_type || "system",
      source_type: entry.target_type || "system",
      content: entry.metadata || entry.event_type,
      timestamp: entry.created_at,
    }));

    return new Response(JSON.stringify({ success: true, evidence }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function getSpineCompleteness(env: Env, tenantId: string): Promise<Response> {
  try {
    const res = await env.SPINE.fetch(
      new Request("https://spine/api/entities?limit=50", {
        headers: { "x-tenant-id": tenantId },
      })
    );
    const data = (await res.json()) as { entities?: any[] };
    const entities = data.entities || [];

    let totalScore = 0;
    let scored = 0;
    for (const entity of entities) {
      if (entity.completeness_score != null) {
        totalScore += entity.completeness_score;
        scored++;
      }
    }

    return new Response(
      JSON.stringify({
        tenant_id: tenantId,
        entity_count: entities.length,
        scored_count: scored,
        average_completeness: scored > 0 ? Math.round((totalScore / scored) * 100) / 100 : 0,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/** Returns tenant Spine config as JSON (shared with views for Entity 360 tenant filtering). */
async function getTenantSpineConfigJson(env: Env, tenantId: string) {
  const { getTenantSpineConfigJson: getConfig } = await import("./tenant-spine-config");
  return getConfig(env, tenantId);
}

async function getTenantSpineConfig(env: Env, tenantId: string): Promise<Response> {
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "No tenant context" }), { status: 400 });
  }
  const config = await getTenantSpineConfigJson(env, tenantId);
  const resolvedSchema = await resolveTenantAdaptiveSchema({
    db: env.DB,
    tenantId,
  });
  const allowedEntityTypes =
    resolvedSchema?.allowedEntityTypes ??
    Array.from(
      (await getAllowedEntityTypesForTenantWithGrowth(
        env,
        tenantId,
        config.domains,
        config.industry ?? null
      )) || []
    );
  const resolvedFieldsByEntity =
    resolvedSchema?.fieldsByEntity ??
    (await getResolvedFieldsByEntityForTenant(
      env,
      tenantId,
      config.domains,
      config.industry ?? null
    ));
  return new Response(
    JSON.stringify({
      tenant_id: tenantId,
      domains: config.domains,
      active_ctx: config.active_ctx,
      schema_version: config.schema_version,
      depth_matrix_snapshot: config.depth_matrix_snapshot,
      connected_connectors: config.connected_connectors,
      industry: config.industry ?? null,
      company_size: config.company_size ?? null,
      user_type: config.user_type ?? null,
      allowed_entity_types: Array.isArray(allowedEntityTypes)
        ? [...allowedEntityTypes].sort()
        : Array.from(allowedEntityTypes || []).sort(),
      resolved_fields_by_entity: resolvedFieldsByEntity,
      active_role_lens: resolvedSchema?.successSchema.activeRoleLens || "account_success",
      active_product_profile:
        resolvedSchema?.successSchema.activeProductProfile || "generic_b2b_saas",
      derived_section_availability: resolvedSchema?.successSchema.derivedSectionAvailability || {},
      connector_capability_coverage:
        resolvedSchema?.successSchema.connectorCapabilityCoverage || {},
      success_schema: resolvedSchema?.successSchema || null,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

async function getLinkKnowledgeUI(env: Env, tenantId: string): Promise<Response> {
  const { getTenantKnowledgeReadPolicy } = await import("./tenant-spine-config");
  const policy = await getTenantKnowledgeReadPolicy(env, tenantId || "default");
  return new Response(
    JSON.stringify({
      link: policy.linkKnowledgeUI,
      approved_only: policy.approvedOnly,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

/** §17.5 Strategic Hub: Goals and metrics for tenant (Rule 14 — trackable). */
async function getGoalsAndMetrics(env: Env, tenantId: string): Promise<Response> {
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "No tenant context" }), { status: 400 });
  }
  if (!env.DB) {
    return new Response(JSON.stringify({ goals: [], metrics: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const goalsResult = await env.DB.prepare(
      "SELECT * FROM entities WHERE tenant_id = ? AND type = 'goal' ORDER BY created_at DESC LIMIT 50"
    )
      .bind(tenantId)
      .all();

    const decideGoals = await env.DB.prepare(
      "SELECT * FROM decide_data WHERE tenant_id = ? AND type = 'goal' ORDER BY created_at DESC LIMIT 50"
    )
      .bind(tenantId)
      .all();

    const goals = [...(goalsResult.results || []), ...(decideGoals.results || [])];

    const kpisResult = await env.DB.prepare(
      "SELECT * FROM decide_data WHERE tenant_id = ? AND type = 'kpi' ORDER BY created_at DESC LIMIT 100"
    )
      .bind(tenantId)
      .all();

    return new Response(
      JSON.stringify({
        goals: goals.map((g: any) => ({
          id: g.id,
          tenant_id: g.tenant_id,
          title: g.title || g.name,
          description: g.description || null,
          status: g.status,
          created_at: g.created_at,
        })),
        metrics: (kpisResult.results || []).map((m: any) => ({
          id: m.id,
          tenant_id: m.tenant_id,
          key: m.name,
          value: m.revenue || m.investment || 0,
          category: m.category || "general",
          created_at: m.created_at,
        })),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Workflow] getGoalsAndMetrics D1 failed:", err);
    return new Response(JSON.stringify({ goals: [], metrics: [], error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const DEFAULT_LIBRARY_BASE = "https://integratewise.ai";

/** No-Hallucination Library: return discovery and grounding file URLs for AI context. */
function getAIContextUrls(env: Env): Response {
  const base = (env.LIBRARY_BASE_URL || DEFAULT_LIBRARY_BASE).replace(/\/$/, "");
  const body = {
    discovery_url: `${base}/.well-known/ai-context.json`,
    human_readable_url: `${base}/llm.txt`,
    structured_context_url: `${base}/context.json`,
    library_base: base,
  };
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
}

/** TypeScript-native signal analysis — replaces Python Intelligence proxy. */
async function nativeAnalyze(tenantId: string, request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, any>;
    const analyzer = new SignalAnalyzer();
    const result = analyzer.analyze({
      signal_id: body.signal_id || crypto.randomUUID(),
      tenant_id: tenantId || body.tenant_id || "default",
      entity_type: body.entity_type || body.domain_schema || "account",
      entity_id: body.spine_id || body.entity_id || "",
      hydration_bucket: body.hydration_bucket || "B7",
      entity_data: body.entity_snapshot || body.entity_data || body,
      context: {
        signals: body.recent_context || [],
        activities: body.recent_knowledge || [],
      },
    });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Analysis failed", message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/** Map onboarding activeCtx to departments for tenant_spine_config.
 * If caller passes explicit departments[], use those instead. */
function activeCtxToDepartments(activeCtx: string): string[] {
  const map: Record<string, string[]> = {
    CTX_SALES: ["SALES"],
    CTX_CS: ["CUSTOMER_SUCCESS"],
    CTX_SUPPORT: ["SUPPORT"],
    CTX_PM: ["ENGINEERING"],
    CTX_TECH: ["ENGINEERING"],
    CTX_MARKETING: ["MARKETING"],
    CTX_FINANCE: ["FINANCE"],
    CTX_LEGAL: ["LEGAL"],
    CTX_HR: ["HR"],
    CTX_REVOPS: ["REVOPS"],
    CTX_PRODUCT: ["PRODUCT"],
    CTX_SUPPLY_CHAIN: ["SUPPLY_CHAIN"],
    CTX_SERVICE_OPS: ["SERVICE_OPS"],
    CTX_BIZOPS: ["SALES", "CUSTOMER_SUCCESS", "FINANCE"],
    CTX_EXECUTIVE: ["SALES", "CUSTOMER_SUCCESS", "FINANCE", "ENGINEERING"],
  };
  return map[activeCtx] || ["SALES", "CUSTOMER_SUCCESS"];
}

async function initializeWorkspace(
  env: Env,
  tenantId: string,
  request: Request
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const connectedApps = body.connectedApps || [];
    const role = body.role || "business-ops";
    const userName = body.userName || "User";
    const activeCtx = body.activeCtx || "CTX_BIZOPS";
    const orgType = body.orgType || "PRODUCT";

    // Onboarding fields (4-screen optimized flow)
    const industry = body.industry || null;
    const companySize = body.companySize || null;
    const userType = body.userType || "work";
    const desiredOutcome = body.desiredOutcome || null;
    const workspaceName = body.workspaceName || null;
    const workspaceType = body.workspaceType || null;
    const linkKnowledgeUIToEntity360 = body.linkKnowledgeUIToEntity360 || "yes";

    // If explicit departments array sent from frontend, use it; else fall back to CTX mapping
    const departments: string[] =
      Array.isArray(body.departments) && body.departments.length > 0
        ? body.departments
        : activeCtxToDepartments(activeCtx);

    const depthMatrixSnapshot = {
      domains: departments,
      connected_connectors: connectedApps,
      industry,
      company_size: companySize,
      desired_outcome: desiredOutcome ?? undefined,
      workspace_name: workspaceName ?? undefined,
      workspace_type: workspaceType ?? undefined,
      link_knowledge_ui_to_entity360: linkKnowledgeUIToEntity360 === "yes",
      version: 2,
    };

    // Audit log: workspace.initialized event (non-blocking)
    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO audit_log (id, tenant_id, event_type, actor_entity_id, actor_type, target_id, target_type, approval_id, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            crypto.randomUUID(),
            tenantId,
            "workspace.initialized",
            userId,
            "user",
            tenantId,
            "workspace",
            null,
            JSON.stringify({
              connectedApps,
              role,
              userName,
              activeCtx,
              departments,
              industry,
              companySize,
              userType,
              desiredOutcome,
              workspaceName,
              workspaceType,
              linkKnowledgeUIToEntity360,
            }),
            new Date().toISOString()
          )
          .run();
      } catch (auditErr) {
        console.warn("[Workflow] audit_log insert failed (non-blocking):", auditErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenantId,
        connected_apps: connectedApps.length,
        role,
        departments,
        active_ctx: activeCtx,
        industry,
        company_size: companySize,
        user_type: userType,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function getProjection(env: Env, tenantId: string, dept: string): Promise<Response> {
  try {
    // Spine-only hardening: scope projection to tenant's Spine domains
    const tenantConfig = await getTenantSpineConfigJson(env, tenantId);
    const tenantDomains = tenantConfig.domains ?? [];
    if (tenantDomains.length > 0 && dept && !tenantDomains.includes(dept)) {
      return new Response(
        JSON.stringify({
          error: "Domain not in tenant Spine config",
          requested_domain: dept,
          tenant_domains: tenantDomains,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const entitiesRes = await env.SPINE.fetch(
      new Request(`https://spine/api/entities?domain=${dept}&limit=100`, {
        headers: { "x-tenant-id": tenantId },
      })
    );
    const entitiesData = (await entitiesRes.json()) as { entities?: any[] };
    const entities = entitiesData.entities || [];

    // ── Group entities by entity_type ──
    const byType: Record<string, any[]> = {};
    for (const e of entities) {
      const t = e.entity_type || "unknown";
      if (!byType[t]) byType[t] = [];
      byType[t].push(e);
    }

    // ── Common accessors (backward compat) ──
    const accounts = byType["account"] || [];
    const opportunities = [...(byType["opportunity"] || []), ...(byType["deal"] || [])];
    const tasks = byType["task"] || [];
    const contacts = byType["contact"] || [];

    const totalArr = accounts.reduce((s: number, a: any) => s + (a.arr || a.fields?.arr || 0), 0);
    const avgHealth =
      accounts.length > 0
        ? accounts.reduce(
            (s: number, a: any) => s + (a.health_score || a.fields?.health_score || 0),
            0
          ) / accounts.length
        : 0;

    // ── Build domain-specific entity arrays (all types, sliced to 20) ──
    const entityArrays: Record<string, any[]> = {};
    for (const [type, items] of Object.entries(byType)) {
      // Pluralize key for the response (entity_type → entity_types)
      const key = type.endsWith("s") ? type : `${type}s`;
      entityArrays[key] = items.slice(0, 20);
    }

    // ── Ensure canonical keys are always present ──
    entityArrays.accounts = accounts.slice(0, 20);
    entityArrays.deals = opportunities.slice(0, 20);
    entityArrays.tasks = tasks.slice(0, 20);
    entityArrays.contacts = contacts.slice(0, 20);

    return new Response(
      JSON.stringify({
        department: dept,
        entity_count: entities.length,
        summary: {
          totalAccounts: accounts.length,
          totalContacts: contacts.length,
          totalOpportunities: opportunities.length,
          totalTasks: tasks.length,
          pipelineValue: opportunities.reduce(
            (s: number, o: any) => s + (o.amount || o.fields?.amount || 0),
            0
          ),
          totalArr: totalArr,
          avgHealthScore: Math.round(avgHealth),
        },
        // Spread all domain-specific entity arrays at top level
        ...entityArrays,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/** Map tenant_spine_config domain names to DOMAIN_SPINE_CONFIG keys. Use DEPARTMENT_TO_CONFIG_KEY for full 12-dept map. */
const TENANT_DOMAIN_TO_READINESS_KEY: Record<string, string> = {
  ...DEPARTMENT_TO_CONFIG_KEY,
  CSM: "CUSTOMER_SUCCESS",
  ENGINEERING: "PRODUCT_ENGINEERING",
  SUPPORT: "SERVICE",
  PROJECTS: "BIZOPS",
};

async function getReadiness(env: Env, tenantId: string): Promise<Response> {
  try {
    const tenantConfig = await getTenantSpineConfigJson(env, tenantId);
    const tenantDomains = tenantConfig?.domains ?? [];
    const industry = tenantConfig?.industry ?? null;
    const allowedKeys = new Set(tenantDomains);
    const grownSchema = await getTenantGrownSchema(env, tenantId);
    const observedByType = grownSchema.fieldsByEntity;
    const observedRows = Array.from(grownSchema.entityTypes);
    const grownEntityTypes = grownSchema.entityTypes;

    const domainReadiness: Record<string, any> = {};
    for (const [domain, baseConfig] of Object.entries(DOMAIN_SPINE_CONFIG)) {
      if (!allowedKeys.has(domain)) continue;
      const config = industry ? getSpineConfig(industry, domain) : baseConfig;
      // Expected = baseline priority_fields (no tenant_id on spine_expected_fields in current migrations)
      const baseEntityTypes = new Set<string>(config.entity_types);
      for (const et of grownEntityTypes) baseEntityTypes.add(et);
      let totalExpected = 0;
      let totalObserved = 0;
      const buckets: any[] = [];

      for (const entityType of baseEntityTypes) {
        const expected = config.priority_fields[entityType]?.length ?? 0;
        const obs = observedByType[entityType]?.size ?? 0;
        totalExpected += expected || (obs > 0 ? obs : 0);
        totalObserved += expected > 0 ? Math.min(obs, expected) : obs;

        const coverage =
          expected > 0 ? Math.round((Math.min(obs, expected) / expected) * 100) : obs > 0 ? 100 : 0;
        buckets.push({
          capability: entityType,
          state:
            coverage >= 80 ? "live" : coverage >= 30 ? "seeded" : coverage > 0 ? "adding" : "off",
          label: entityType.replace(/_/g, " "),
          coverage,
          completeness: coverage,
          freshness: 100,
          confidence: coverage,
          score: coverage,
        });
      }

      const overallScore =
        totalExpected > 0 ? Math.round((totalObserved / totalExpected) * 100) : 0;
      domainReadiness[domain] = {
        department: domain,
        label: domain.replace(/_/g, " "),
        overallState:
          overallScore >= 80
            ? "live"
            : overallScore >= 30
              ? "seeded"
              : overallScore > 0
                ? "adding"
                : "off",
        overallScore,
        buckets,
      };
    }

    // ── Tenant-level hydration bucket (B0→B7) ──────────────────────────────
    const tenantBucket = computeTenantBucket(tenantConfig, observedRows || [], domainReadiness);

    return new Response(
      JSON.stringify({
        ...domainReadiness,
        tenant_domains: tenantDomains,
        tenant_bucket: tenantBucket.bucket,
        tenant_bucket_label: tenantBucket.label,
        next_bucket_action: tenantBucket.nextAction,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Compute tenant-level hydration bucket (B0→B7).
 * B0: Account created
 * B1: Domain selected (tenant_spine_config exists with domains)
 * B2: First connector linked
 * B3: First sync complete (entities in spine_schema_registry)
 * B4: Multi-tool (2+ connectors)
 * B5: AI connected (MCP/Flow C active)
 * B6: Team activated (2+ users — approximated by config)
 * B7: All flows active (A + B + C)
 */
function computeTenantBucket(
  tenantConfig: any,
  observedRows: any[],
  domainReadiness: Record<string, any>
): { bucket: string; label: string; nextAction: string } {
  const domains = tenantConfig?.domains ?? [];
  const connectors = tenantConfig?.connected_connectors ?? tenantConfig?.connectors ?? {};
  const connectorList = Array.isArray(connectors)
    ? connectors
    : Object.keys(connectors).filter((k) => connectors[k]?.status === "connected" || connectors[k]);
  const hasEntities = observedRows.length > 0;
  const hasAI = connectorList.some((c: string) =>
    ["claude", "chatgpt", "perplexity", "openai", "mcp"].includes(c.toLowerCase())
  );
  const hasFlowB = connectorList.some((c: string) =>
    ["notion", "google_drive", "dropbox", "confluence"].includes(c.toLowerCase())
  );
  const liveCount = Object.values(domainReadiness).filter(
    (d: any) => d?.overallState === "live" || d?.overallState === "seeded"
  ).length;

  if (hasEntities && connectorList.length >= 2 && hasAI && hasFlowB) {
    return {
      bucket: "B7",
      label: "Full Intelligence",
      nextAction: "All flows active. System is at full intelligence.",
    };
  }
  if (hasEntities && connectorList.length >= 2 && hasAI) {
    return {
      bucket: "B6",
      label: "AI-Powered",
      nextAction: "Connect a document source (Notion, Google Drive) to reach B7.",
    };
  }
  if (hasEntities && hasAI) {
    return {
      bucket: "B5",
      label: "AI Connected",
      nextAction: "Connect a second data tool to reach B6.",
    };
  }
  if (hasEntities && connectorList.length >= 2) {
    return {
      bucket: "B4",
      label: "Multi-Tool",
      nextAction: "Connect an AI assistant (Claude, ChatGPT) to reach B5.",
    };
  }
  if (hasEntities) {
    return {
      bucket: "B3",
      label: "First Hydration",
      nextAction: "Connect a second tool to reach B4.",
    };
  }
  if (connectorList.length >= 1) {
    return {
      bucket: "B2",
      label: "First Tool",
      nextAction: "Wait for first sync to complete, or trigger a manual sync.",
    };
  }
  if (domains.length > 0) {
    return {
      bucket: "B1",
      label: "Context Set",
      nextAction: "Connect your first tool (CRM, email, or project management).",
    };
  }
  return {
    bucket: "B0",
    label: "Identity",
    nextAction: "Complete onboarding to set your industry and department.",
  };
}

async function streamEvents(_env: Env, tenantId: string): Promise<Response> {
  // SSE stream — minimal implementation
  // In production, use Durable Objects for persistent connections
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", tenant_id: tenantId })}\n\n`)
      );
      // TODO: Connect to Supabase Realtime and forward events
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
