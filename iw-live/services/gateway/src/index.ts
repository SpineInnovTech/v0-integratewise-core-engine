/**
 * IntegrateWise Gateway - Single Entry Point (KT Note §5.2)
 *
 * The Gateway is the SOLE entry point for ALL requests into the workspace.
 *
 * KT NOTE: "The Gateway is the single entry point. It validates JWTs, resolves
 * tenant context, injects trusted headers like tenant and user identity, applies
 * rate limiting and policy, and routes requests to the correct service."
 *
 * ARCHITECTURE LAYERS (KT Note §3):
 *
 * Experience → Gateway → Workspace Runtime → External Connectivity → Data Plane → SSOT/Spine
 *
 * ROUTING TABLE:
 *
 * - CONNECTOR:     Loader + MCP-connector + Store (External Connectivity)
 * - PIPELINE:      Normalizer + Spine-v2 (Data Plane / SSOT)
 * - INTELLIGENCE:  Think + Act + Govern + Agents (Cognitive Layer)
 * - KNOWLEDGE:     Knowledge Service (Context/Evidence)
 * - BFF:           Workflow (Workspace Runtime / Backend-for-Frontend)
 * - L2:            L2 API Layer
 *
 * SECURITY ENFORCEMENTS:
 * - JWT validation on all routes
 * - x-tenant-id header injection (resolved from JWT)
 * - Rate limiting via RATE_LIMITS KV
 * - CORS policy enforcement
 * - Webhook signature verification (per-provider)
 *
 * NO BYPASS POLICY:
 * - No service can be reached directly except through Gateway
 * - All service bindings are internal to Gateway only
 * - Webhooks are verified and routed through webhook-ingress
 */
import adminApp from "../../admin/src/index";
import billingApp from "../../billing/src/index";
import tenantsApp from "../../tenants/src/index";
import {
  resilientFetch,
  probeService,
  modelSwitchFetch,
  DEFAULT_MODEL_CHAIN,
} from "./lib/resilience";
import { signJWT, verifyJWT, PUBLIC_JWK } from "./lib/jwt";
import {
  routeWorkspaceSpineRequest,
  getConnectorCatalog,
  getSpineEntities,
} from "./workspace-spine";
import { routeProjectionRequest } from "./projections";
import { handleTwinHandoff } from "./twin-handoff";
import { routeAuthRequest } from "./auth";
import { ensureCustomerZeroMembership, resolveCustomerZeroProfile } from "./customer-zero";

export interface Env {
  // D1 Database (auth + tenant resolution)
  DB: D1Database;
  // Consolidated downstream Workers (v3.6: 5 external + L2)
  CONNECTOR: Fetcher;
  CONNECTOR_SYNC?: Fetcher;
  PIPELINE: Fetcher;
  INTELLIGENCE: Fetcher;
  KNOWLEDGE: Fetcher;
  BFF: Fetcher;
  L2: Fetcher;
  AGENT_RUNTIME: Fetcher;
  // Real-time Webhook Ingress
  WEBHOOK_INGRESS?: Fetcher; // Webhook ingestion and real-time broadcasting
  // KV
  RATE_LIMITS: KVNamespace;
  SESSIONS: KVNamespace;
  /** Connector install/runtime status + installation-id→tenant mappings (shared) */
  CONNECTOR_STATUS?: KVNamespace;
  SIGNAL_CACHE?: KVNamespace;
  METRICS?: KVNamespace;
  OAUTH_STATE_KV?: KVNamespace;
  // @deprecated Supabase removed from gateway code paths (DECISION 22). Retained
  // optionally only for legacy test mocks; no live gateway code reads these.
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ALLOWED_ORIGINS?: string;
  HUBSPOT_WEBHOOK_SECRET?: string;
  SALESFORCE_WEBHOOK_SECRET?: string;
  GITHUB_WEBHOOK_SECRET?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  /** Slack app signing secret for webhook signature verification (Slack = connection layer for AIs, tools, connectors) */
  SLACK_SIGNING_SECRET?: string;
  ENABLE_SIGNALS?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  FOLDER_WATCHER?: Fetcher;
  OAUTH_PRIVATE_KEY?: string | { get(): Promise<string> };
  ENVIRONMENT?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function corsHeaders(env: Env, request: Request): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : [];
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || "";
  return allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {};
}

// Route table: path prefix → binding name or internal handlers
type RouteTarget =
  | keyof Env
  | "INTERNAL_ADMIN"
  | "INTERNAL_AUTH"
  | "INTERNAL_BILLING"
  | "INTERNAL_TENANTS"
  | "INTERNAL_SUPPORT"
  | "INTERNAL_PROJECTIONS";
const ROUTES: [string, RouteTarget][] = [
  ["/api/v1/auth", "INTERNAL_AUTH"],
  ["/api/v1/projections", "INTERNAL_PROJECTIONS"],
  ["/api/v1/billing", "INTERNAL_BILLING"],
  ["/api/v1/tenants", "INTERNAL_TENANTS"],
  ["/api/v1/support", "INTERNAL_SUPPORT"],
  ["/api/v1/analytics", "BFF"],
  ["/api/v1/agents", "INTELLIGENCE"],
  ["/api/v1/connectors", "CONNECTOR"],
  ["/api/v1/connector", "CONNECTOR"],
  ["/api/v1/loader", "CONNECTOR"],
  ["/api/v1/pipeline", "PIPELINE"],
  ["/api/v1/intelligence", "INTELLIGENCE"],
  ["/api/v1/cognitive/spine", "PIPELINE"],
  ["/api/v1/cognitive/entity360", "PIPELINE"],
  ["/api/v1/entity360", "PIPELINE"],
  ["/api/v1/identity", "PIPELINE"],
  ["/api/v1/cognitive/evidence", "BFF"],
  ["/api/v1/cognitive/memories", "KNOWLEDGE"],
  ["/api/v1/cognitive/signals", "INTELLIGENCE"],
  ["/api/v1/cognitive/think", "INTELLIGENCE"],
  ["/api/v1/cognitive/act", "INTELLIGENCE"],
  ["/api/v1/cognitive/govern", "INTELLIGENCE"],
  ["/api/v1/cognitive/context-to-truth", "INTELLIGENCE"],
  ["/api/v1/cognitive/hitl", "BFF"],
  ["/api/v1/brainstorm", "INTELLIGENCE"],
  ["/api/v1/knowledge", "KNOWLEDGE"],
  ["/api/v1/workspace", "BFF"],
  ["/api/v1/cognitive/twin", "AGENT_RUNTIME"],
  ["/api/v1/cognitive/brain", "AGENT_RUNTIME"],
  ["/api/v1/execution-packages", "AGENT_RUNTIME"],
  ["/api/v1/cognitive/insights", "INTELLIGENCE"],
  ["/api/v1/cognitive/audit", "BFF"],
  ["/api/v1/cognitive/agents", "INTELLIGENCE"],
  // Coda Control Surface routes
  ["/api/v1/cognitive/memory", "KNOWLEDGE"],
  ["/api/v1/cognitive/truth", "KNOWLEDGE"],
  ["/api/v1/cognitive/projects", "KNOWLEDGE"],
  ["/api/v1/cognitive/status", "KNOWLEDGE"],
  ["/api/v1/l2", "L2"],
  ["/ws", "BFF"],
  ["/sse", "BFF"],
  ["/stream", "BFF"],
  ["/admin", "INTERNAL_ADMIN"],
  ["/oauth", "INTERNAL_TENANTS"],
  ["/webhooks/slack-workflow", "WEBHOOK_INGRESS"],
  ["/webhooks/slack/interactivity", "WEBHOOK_INGRESS"],
  ["/webhooks/billing", "INTERNAL_BILLING"],
  ["/webhooks", "WEBHOOK_INGRESS"],
];

const WEBHOOK_INGRESS_PROVIDERS = new Set(["hubspot", "salesforce", "github", "slack-workflow"]);
const CONNECTOR_WEBHOOK_PROVIDERS = new Set([
  "hubspot",
  "salesforce",
  "stripe",
  "github",
  "slack",
  "razorpay",
  "discord",
  "notion",
  "ai-relay",
  "asana",
  "webflow",
  "cron",
  "loader",
  "brainstorm",
  "neutron",
  "data-sync",
  "scheduler",
  "linkedin",
  "canva",
  "pipedrive",
  "google-ads",
  "meta",
  "whatsapp",
  "vercel",
  "todoist",
]);

function createForwardRequest(
  url: string,
  request: Request,
  headers: HeadersInit = request.headers
) {
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  return new Request(url, init);
}

/**
 * Route to either an external Worker (via service binding) or an internal handler
 */
function routeAdminRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const rest = path.startsWith("/admin") ? path.slice("/admin".length) || "/" : path;
  const rewrittenUrl = new URL(request.url);
  rewrittenUrl.pathname = rest;
  const rewritten = createForwardRequest(rewrittenUrl.toString(), request);
  return Promise.resolve(adminApp.fetch(rewritten, env));
}

function routeSupportRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let rewrittenPath = url.pathname;

  if (rewrittenPath === "/api/v1/public/contact") {
    rewrittenPath = "/v1/public/contact";
  } else if (rewrittenPath === "/api/v1/public/newsletter") {
    rewrittenPath = "/v1/public/newsletter";
  } else if (rewrittenPath === "/api/v1/support/tickets") {
    rewrittenPath = "/v1/support/tickets";
  } else if (rewrittenPath === "/api/v1/support/feedback") {
    rewrittenPath = "/v1/support/feedback";
  } else if (rewrittenPath === "/api/v1/support/csat") {
    rewrittenPath = "/v1/support/csat";
  } else if (rewrittenPath === "/api/v1/support/nps") {
    rewrittenPath = "/v1/support/nps";
  } else if (rewrittenPath === "/api/v1/support/me") {
    rewrittenPath = "/v1/support/me";
  }

  const rewrittenUrl = new URL(request.url);
  rewrittenUrl.pathname = rewrittenPath;
  const rewrittenRequest = createForwardRequest(rewrittenUrl.toString(), request);

  return Promise.resolve(adminApp.fetch(rewrittenRequest, env));
}

/**
 * Map route targets to service names for circuit breaker tracking.
 */
const TARGET_TO_SERVICE: Record<string, string> = {
  CONNECTOR: "integratewise-connector",
  CONNECTOR_SYNC: "integratewise-connector-sync",
  PIPELINE: "integratewise-pipeline",
  INTELLIGENCE: "integratewise-intelligence",
  KNOWLEDGE: "integratewise-knowledge",
  BFF: "integratewise-bff",
  AGENT_RUNTIME: "iw-agent-runtime",
  L2: "integratewise-l2",
  WEBHOOK_INGRESS: "integratewise-webhook-ingress",
};

function getTenantId(request: Request): string | undefined {
  return request.headers.get("x-tenant-id") || undefined;
}

function routeRequest(request: Request, env: Env, target: RouteTarget): Promise<Response> {
  const tenantId = getTenantId(request);

  switch (target) {
    case "INTERNAL_ADMIN":
      return routeAdminRequest(request, env);
    case "INTERNAL_AUTH":
      return routeAuthRequest(request, env);
    case "INTERNAL_SUPPORT":
      return routeSupportRequest(request, env);
    case "INTERNAL_BILLING":
      return routeBillingRequest(request, env);
    case "INTERNAL_PROJECTIONS":
      return routeProjectionRequest(request, env);
    case "CONNECTOR":
      return routeConnectorRequest(request, env);
    case "INTELLIGENCE":
      return routeIntelligenceRequest(request, env);
    case "KNOWLEDGE":
      return routeKnowledgeRequest(request, env);
    case "INTERNAL_TENANTS":
      return routeTenantsRequest(request, env);
    case "WEBHOOK_INGRESS":
      return routeWebhookIngressRequest(request, env);
    case "AGENT_RUNTIME":
      return routeAgentRuntimeRequest(request, env);
    default: {
      const fetcher = env[target] as Fetcher;
      const serviceName = TARGET_TO_SERVICE[target] || String(target);
      return resilientFetch(serviceName, fetcher, request, tenantId);
    }
  }
}

/**
 * Route webhook requests to the ingress service
 * Handles: /webhooks/:provider (hubspot, stripe, github, salesforce)
 */
/**
 * Route tenants service: rewrite /api/v1/tenants/* and /oauth/* to tenant app paths.
 * Tenants app expects: /context, /resolve/:slug, /limits/:plan, /v1/tenants/*, /v1/connectors/*.
 */
function routeTenantsRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let path = url.pathname;
  if (path.startsWith("/api/v1/tenants")) {
    path = path.slice("/api/v1/tenants".length) || "/";
  } else if (path.startsWith("/oauth")) {
    path = path.slice("/oauth".length) || "/";
  }
  const rewrittenUrl = new URL(request.url);
  rewrittenUrl.pathname = path;
  const rewrittenRequest = createForwardRequest(rewrittenUrl.toString(), request);
  return Promise.resolve(tenantsApp.fetch(rewrittenRequest, env));
}

function routeWebhookIngressRequest(request: Request, env: Env): Promise<Response> {
  if (!env.WEBHOOK_INGRESS) {
    // Fallback to CONNECTOR if webhook-ingress not deployed
    return routeConnectorRequest(request, env);
  }

  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();

  if (path.startsWith("/webhooks/slack/")) {
    return resilientFetch("integratewise-webhook-ingress", env.WEBHOOK_INGRESS, request);
  }

  // Route specific provider webhooks
  const providerMatch = path.match(/^\/webhooks\/([^/]+)$/);
  if (providerMatch) {
    const provider = providerMatch[1];

    if (WEBHOOK_INGRESS_PROVIDERS.has(provider)) {
      return resilientFetch("integratewise-webhook-ingress", env.WEBHOOK_INGRESS, request);
    }

    if (CONNECTOR_WEBHOOK_PROVIDERS.has(provider)) {
      return routeConnectorRequest(request, env);
    }

    return Promise.resolve(new Response("Unknown webhook provider", { status: 400 }));
  }

  // Route to webhook-ingress service
  return resilientFetch("integratewise-webhook-ingress", env.WEBHOOK_INGRESS, request);
}

function routeAgentRuntimeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let rewrittenPath = url.pathname;

  const userId = request.headers.get("x-user-id") || "founder";
  const tenantId = request.headers.get("x-tenant-id") || "iw-customer-zero";

  // /api/v1/cognitive/twin/* -> /v1/twin/:userId/*
  if (rewrittenPath.startsWith("/api/v1/cognitive/twin/")) {
    const action = rewrittenPath.slice("/api/v1/cognitive/twin/".length);
    rewrittenPath = `/v1/twin/${userId}/${action}`;
  } else if (rewrittenPath === "/api/v1/cognitive/twin") {
    rewrittenPath = `/v1/twin/${userId}`;
  }

  // /api/v1/cognitive/brain/* -> /do/brain/:tenant_id/*
  if (rewrittenPath.startsWith("/api/v1/cognitive/brain/")) {
    const action = rewrittenPath.slice("/api/v1/cognitive/brain/".length);
    rewrittenPath = `/do/brain/${tenantId}/${action}`;
  } else if (rewrittenPath === "/api/v1/cognitive/brain") {
    rewrittenPath = `/do/brain/${tenantId}`;
  }

  // Execution packages for L5/L6 CZ pickup (Twin generated handoffs)
  if (
    rewrittenPath === "/api/v1/execution-packages" ||
    rewrittenPath.startsWith("/api/v1/execution-packages/")
  ) {
    rewrittenPath = rewrittenPath.replace("/api/v1/execution-packages", "/v1/execution-packages");
  }

  const rewrittenUrl = new URL(request.url);
  rewrittenUrl.pathname = rewrittenPath;
  const rewrittenRequest = createForwardRequest(rewrittenUrl.toString(), request);

  if (env.ENVIRONMENT === "dev") {
    // In local dev, service bindings can fail to connect automatically.
    // Fall back to direct local HTTP routing to port 8788.
    const devUrl = new URL(rewrittenRequest.url);
    devUrl.protocol = "http:";
    devUrl.host = "127.0.0.1:8788";
    const devRequest = createForwardRequest(devUrl.toString(), rewrittenRequest);
    return resilientFetch(
      "iw-agent-runtime",
      {
        fetch: (req: Request) => fetch(req),
      } as Fetcher,
      devRequest,
      tenantId
    );
  }

  return resilientFetch("iw-agent-runtime", env.AGENT_RUNTIME, rewrittenRequest, tenantId);
}

function routeIntelligenceRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let rewrittenPath = url.pathname;

  // /api/v1/intelligence/* -> think/govern compatible paths
  if (rewrittenPath === "/api/v1/intelligence/signals") {
    rewrittenPath = "/v1/signals";
  } else if (rewrittenPath === "/api/v1/intelligence/situations") {
    rewrittenPath = "/v1/situations";
  } else if (rewrittenPath === "/api/v1/intelligence/agents") {
    rewrittenPath = "/health";
  } else if (rewrittenPath === "/api/v1/intelligence/proposals") {
    rewrittenPath = "/v1/proposals";
  } else if (rewrittenPath.startsWith("/api/v1/intelligence/proposals/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/intelligence/proposals/", "/v1/proposals/");
  } else if (rewrittenPath.startsWith("/api/v1/intelligence/knowledge/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/intelligence/knowledge/", "/v1/knowledge/");
  } else if (rewrittenPath === "/api/v1/intelligence/knowledge") {
    rewrittenPath = "/v1/knowledge";
  } else if (rewrittenPath.startsWith("/api/v1/intelligence/memory/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/intelligence/memory/", "/v1/memory/");
  } else if (rewrittenPath === "/api/v1/intelligence/memory") {
    rewrittenPath = "/v1/memory";
  } else if (rewrittenPath.startsWith("/api/v1/continuity/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/continuity/", "/v1/continuity/");
  } else if (rewrittenPath === "/api/v1/continuity") {
    rewrittenPath = "/v1/continuity";
  } else if (rewrittenPath.startsWith("/api/v1/intelligence/accelerator/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/intelligence/accelerator/", "/v1/accelerator/");
  }

  // /api/v1/cognitive/twin/* -> digital twin (proactive + memories) on think/cognitive-brain
  if (rewrittenPath.startsWith("/api/v1/cognitive/twin")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/twin", "/v1/twin");
  } else if (
    rewrittenPath === "/api/v1/cognitive/insights" ||
    rewrittenPath.startsWith("/api/v1/cognitive/insights/")
  ) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/insights", "/v1/insights");
  } else if (rewrittenPath === "/api/v1/brainstorm" || rewrittenPath === "/api/v1/brainstorm/") {
    rewrittenPath = "/v1/brainstorm";
  }
  // /api/v1/cognitive/* -> consolidated intelligence routes
  if (rewrittenPath === "/api/v1/cognitive/signals") {
    rewrittenPath = "/v1/signals";
  } else if (rewrittenPath === "/api/v1/cognitive/context-to-truth") {
    rewrittenPath = "/v1/cognitive/context-to-truth";
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/context-to-truth/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/", "/v1/cognitive/");
  } else if (rewrittenPath === "/api/v1/cognitive/think/analyze") {
    rewrittenPath = "/v1/think/analyze";
  } else if (rewrittenPath === "/api/v1/cognitive/act/execute") {
    rewrittenPath = "/act/execute";
  } else if (rewrittenPath === "/api/v1/cognitive/govern/policies") {
    rewrittenPath = "/v1/policies";
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/govern/policies/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/govern/policies/", "/v1/policies/");
  }

  // /api/v1/agents/* frontend aliases -> agents worker routes
  if (rewrittenPath === "/api/v1/agents/colony/run") {
    rewrittenPath = "/colony/run";
  } else if (rewrittenPath.startsWith("/api/v1/agents/colony/history/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/agents/colony/history/", "/colony/history/");
  } else if (rewrittenPath.startsWith("/api/v1/agents/colony/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/agents/colony/", "/colony/");
  } else if (rewrittenPath === "/api/v1/agents/health") {
    rewrittenPath = "/health";
  } else {
    const agentRunMatch = rewrittenPath.match(
      /^\/api\/v1\/agents\/(research|analyst|writer|planner|executor)$/
    );
    if (agentRunMatch) {
      rewrittenPath = `/agent/${agentRunMatch[1]}`;
    }
  }

  if (rewrittenPath !== url.pathname) {
    const rewrittenUrl = new URL(request.url);
    rewrittenUrl.pathname = rewrittenPath;
    const rewrittenRequest = new Request(rewrittenUrl.toString(), request);

    // AI routes: use model fallback chain
    const isAiRoute =
      rewrittenPath === "/v1/brainstorm" ||
      rewrittenPath.startsWith("/v1/cognitive/") ||
      rewrittenPath.startsWith("/v1/twin") ||
      rewrittenPath.startsWith("/v1/insights");
    if (isAiRoute) {
      return modelSwitchFetch(env.INTELLIGENCE, rewrittenRequest);
    }
    return resilientFetch(
      "integratewise-intelligence",
      env.INTELLIGENCE,
      rewrittenRequest,
      getTenantId(request)
    );
  }

  // AI routes: use model fallback chain
  const isAiRoute =
    url.pathname === "/api/v1/brainstorm" ||
    url.pathname.startsWith("/api/v1/cognitive/") ||
    url.pathname.startsWith("/api/v1/cognitive/twin") ||
    url.pathname.startsWith("/api/v1/cognitive/insights");
  if (isAiRoute) {
    return modelSwitchFetch(env.INTELLIGENCE, request);
  }
  return resilientFetch(
    "integratewise-intelligence",
    env.INTELLIGENCE,
    request,
    getTenantId(request)
  );
}

function routeBillingRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let rewrittenPath = url.pathname;

  // Legacy aliases for billing endpoints implemented under /v1/* in billing service.
  if (rewrittenPath.startsWith("/api/v1/billing/entitlements/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/billing/entitlements/", "/v1/entitlements/");
  } else if (rewrittenPath.startsWith("/api/v1/billing/usage/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/billing/usage/", "/v1/usage/");
  } else if (rewrittenPath === "/api/v1/billing/usage") {
    rewrittenPath = "/v1/usage";
  } else if (rewrittenPath.startsWith("/api/v1/billing/invoices/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/billing/invoices/", "/v1/invoices/");
  } else if (rewrittenPath === "/api/v1/billing/subscriptions") {
    rewrittenPath = "/v1/subscriptions";
  } else if (rewrittenPath.startsWith("/api/v1/billing/subscriptions/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/billing/subscriptions/", "/v1/subscriptions/");
  } else if (rewrittenPath.startsWith("/api/v1/billing")) {
    // Canonical billing v1 namespace is /v1/billing/* for plan, checkout, and webhook APIs.
    rewrittenPath = rewrittenPath.replace(/^\/api/, "");
  }

  // Backward compatibility for legacy webhook ingress path.
  if (rewrittenPath.startsWith("/webhooks/billing/")) {
    rewrittenPath = rewrittenPath.replace("/webhooks/billing/", "/v1/billing/webhooks/");
  }

  if (rewrittenPath !== url.pathname) {
    const rewrittenUrl = new URL(request.url);
    rewrittenUrl.pathname = rewrittenPath;
    const rewrittenRequest = new Request(rewrittenUrl.toString(), request);
    return Promise.resolve(billingApp.fetch(rewrittenRequest, env));
  }

  return Promise.resolve(billingApp.fetch(request, env));
}

async function fallbackConnectorSyncStatus(
  env: Env,
  tenantId: string,
  provider?: string
): Promise<Response> {
  const kv = env.CONNECTOR_STATUS;

  if (!kv) {
    return new Response(JSON.stringify({ error: "Connector sync status unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (provider) {
      const raw = await kv.get(`sync:${tenantId}:${provider}`);
      if (!raw) {
        return new Response(
          JSON.stringify({
            provider,
            status: "not_configured",
            message: `${provider} connector not configured for this tenant`,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(raw, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prefix = `sync:${tenantId}:`;
    const listed = await kv.list({ prefix });
    const connectors: Record<string, unknown> = {};

    for (const key of listed.keys) {
      const raw = await kv.get(key.name);
      if (!raw) continue;
      const connectorProvider = key.name.slice(prefix.length);
      connectors[connectorProvider] = JSON.parse(raw);
    }

    return new Response(JSON.stringify({ tenantId, connectors }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("KV operation failed in fallbackConnectorSyncStatus:", err);
    return new Response(JSON.stringify({ error: "Connector status storage error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function routeConnectorSyncStatusRequest(
  request: Request,
  env: Env,
  provider?: string
): Promise<Response> {
  const tenantId = request.headers.get("x-tenant-id") || "";

  if (!tenantId) {
    return Promise.resolve(
      new Response(JSON.stringify({ error: "Missing tenant context" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  if (env.CONNECTOR_SYNC) {
    const targetPath = provider ? `/api/status/${tenantId}/${provider}` : `/api/status/${tenantId}`;
    const targetUrl = new URL(targetPath, request.url);
    const proxiedHeaders = new Headers(request.headers);
    proxiedHeaders.set("x-tenant-id", tenantId);

    return env.CONNECTOR_SYNC.fetch(
      new Request(targetUrl.toString(), {
        method: "GET",
        headers: proxiedHeaders,
      })
    );
  }

  return fallbackConnectorSyncStatus(env, tenantId, provider);
}

function routeConnectorRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let rewrittenPath = url.pathname;
  let rewrittenMethod = request.method;

  // Backward compatibility for legacy tenant-scoped connector status route.
  // Route to provider-scoped status endpoint handled by connector service.
  const hubspotStatusMatch = rewrittenPath.match(/^\/api\/v1\/connector\/status\/(.+)$/);
  if (hubspotStatusMatch) {
    rewrittenPath = "/api/v1/connector/status/hubspot";
  }

  // Sync: route to CONNECTOR (Loader) for initial hydration and delta sync.
  // Auth: same as other API routes (JWT → x-tenant-id); wire strict auth after final testing.
  const syncMatch = rewrittenPath.match(/^\/api\/v1\/connector\/sync\/([^/]+)\/([^/]+)$/);
  if (syncMatch && request.method === "POST") {
    return resilientFetch(
      "integratewise-connector",
      env.CONNECTOR,
      new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: request.body,
      }),
      getTenantId(request)
    );
  }

  if (rewrittenPath === "/api/v1/connectors/sync-status" && request.method === "GET") {
    return routeConnectorSyncStatusRequest(request, env);
  }

  const providerSyncStatusMatch = rewrittenPath.match(
    /^\/api\/v1\/connectors\/([^/]+)\/sync-status$/
  );
  if (providerSyncStatusMatch && request.method === "GET") {
    return routeConnectorSyncStatusRequest(request, env, providerSyncStatusMatch[1]);
  }

  // Connector catalog (available connectors for discovery) — D1-direct, no Supabase
  if (rewrittenPath === "/api/v1/connectors/catalog") {
    const catalogTenant = request.headers.get("x-tenant-id") || "iw-customer-zero";
    return getConnectorCatalog(env as Env & { DB: D1Database }, catalogTenant);
  }

  // Support legacy/pluralized frontend connector routes.
  if (rewrittenPath === "/api/v1/connectors/list" || rewrittenPath === "/api/v1/connector/list") {
    // Route to tenants service which queries Supabase connectors table
    return Promise.resolve(
      tenantsApp.fetch(
        new Request(new URL("/v1/connectors/list", request.url).toString(), request),
        env
      )
    );
  } else {
    // OAuth authorize/callback → route to tenants service (full OAuth implementation)
    const authorizeMatch = rewrittenPath.match(/^\/api\/v1\/connectors\/([^/]+)\/authorize$/);
    if (authorizeMatch) {
      return Promise.resolve(
        tenantsApp.fetch(
          new Request(
            new URL(`/v1/connectors/${authorizeMatch[1]}/authorize`, request.url).toString(),
            request
          ),
          env
        )
      );
    }

    const callbackMatch = rewrittenPath.match(/^\/api\/v1\/connectors\/([^/]+)\/callback$/);
    if (callbackMatch) {
      const callbackUrl = new URL(`/v1/connectors/${callbackMatch[1]}/callback`, request.url);
      callbackUrl.search = url.search;
      return Promise.resolve(tenantsApp.fetch(new Request(callbackUrl.toString(), request), env));
    }

    const disconnectMatch = rewrittenPath.match(/^\/api\/v1\/connectors\/([^/]+)\/disconnect$/);
    if (disconnectMatch) {
      return Promise.resolve(
        tenantsApp.fetch(
          new Request(
            new URL(`/v1/connectors/${disconnectMatch[1]}/disconnect`, request.url).toString(),
            request
          ),
          env
        )
      );
    }

    const statusMatch = rewrittenPath.match(/^\/api\/v1\/connectors\/([^/]+)\/status$/);
    if (statusMatch) {
      return Promise.resolve(
        tenantsApp.fetch(
          new Request(
            new URL(`/v1/connectors/${statusMatch[1]}/status`, request.url).toString(),
            request
          ),
          env
        )
      );
    }
  }

  if (rewrittenPath !== url.pathname || rewrittenMethod !== request.method) {
    const rewrittenUrl = new URL(request.url);
    rewrittenUrl.pathname = rewrittenPath;
    rewrittenUrl.search = url.search;
    const rewrittenRequest = new Request(rewrittenUrl.toString(), {
      method: rewrittenMethod,
      headers: request.headers,
      body: rewrittenMethod === "GET" || rewrittenMethod === "HEAD" ? undefined : request.body,
    });
    return resilientFetch(
      "integratewise-connector",
      env.CONNECTOR,
      rewrittenRequest,
      getTenantId(request)
    );
  }

  return resilientFetch("integratewise-connector", env.CONNECTOR, request, getTenantId(request));
}

function routeKnowledgeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let rewrittenPath = url.pathname;

  // Gateway /api/v1/knowledge/* compatibility for knowledge worker path contracts.
  if (rewrittenPath === "/api/v1/knowledge/search") {
    rewrittenPath = "/knowledge/search";
  } else if (rewrittenPath === "/api/v1/knowledge/sessions") {
    rewrittenPath = "/knowledge/search/sessions";
  } else if (rewrittenPath === "/api/v1/knowledge/upload") {
    rewrittenPath = "/v1/store/upload";
  } else if (rewrittenPath === "/api/v1/knowledge/ingest") {
    rewrittenPath = "/v1/knowledge/ingest";
  } else if (rewrittenPath.startsWith("/api/v1/knowledge/processing-status/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/knowledge/", "/v1/knowledge/");
  } else if (rewrittenPath === "/api/v1/knowledge/extraction-feedback") {
    rewrittenPath = "/v1/knowledge/extraction-feedback";
  } else if (rewrittenPath.startsWith("/api/v1/knowledge/reprocess/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/knowledge/", "/v1/knowledge/");
  } else if (rewrittenPath.startsWith("/api/v1/knowledge/triage")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/knowledge/triage", "/v1/triage");
  } else if (rewrittenPath === "/api/v1/knowledge/inbox") {
    rewrittenPath = "/v1/knowledge/inbox";
  } else if (rewrittenPath === "/api/v1/knowledge/documents") {
    rewrittenPath = "/v1/knowledge/documents";
  } else if (rewrittenPath.startsWith("/api/v1/knowledge/topics/")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/knowledge/", "/v1/knowledge/");
  } else if (rewrittenPath === "/api/v1/knowledge/topics") {
    rewrittenPath = "/v1/knowledge/topics";
  } else if (rewrittenPath.startsWith("/api/v1/knowledge/memories")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/knowledge/", "/v1/knowledge/");
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/memories")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/memories", "/v1/knowledge/memories");
  }
  // Coda Control Surface routes → Knowledge service
  else if (rewrittenPath.startsWith("/api/v1/cognitive/memory/org")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/memory/org", "/v1/memory/org");
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/memory/personal")) {
    rewrittenPath = rewrittenPath.replace(
      "/api/v1/cognitive/memory/personal",
      "/v1/memory/personal"
    );
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/memory/triage")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/memory/triage", "/v1/memory/triage");
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/memory/approve")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/memory/approve", "/v1/memory/approve");
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/memory/archive")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/memory/archive", "/v1/memory/archive");
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/truth/commit")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/truth/commit", "/v1/truth/commit");
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/projects")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/projects", "/v1/projects");
  } else if (rewrittenPath.startsWith("/api/v1/cognitive/status")) {
    rewrittenPath = rewrittenPath.replace("/api/v1/cognitive/status", "/v1/status");
  }

  if (rewrittenPath !== url.pathname) {
    const rewrittenUrl = new URL(request.url);
    rewrittenUrl.pathname = rewrittenPath;
    const rewrittenRequest = new Request(rewrittenUrl.toString(), request);
    return resilientFetch(
      "integratewise-knowledge",
      env.KNOWLEDGE,
      rewrittenRequest,
      getTenantId(request)
    );
  }

  return resilientFetch("integratewise-knowledge", env.KNOWLEDGE, request, getTenantId(request));
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const hostname = url.hostname;

    let allowedOrigins = env.ALLOWED_ORIGINS
      ? env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : [];
    let requestOrigin = request.headers.get("Origin") || "";
    let corsOrigin = requestOrigin || allowedOrigins[0] || "*";

    // 1. Authorization Server (auth.integratewise.ai / auth.integratewise.local)
    if (hostname.startsWith("auth.integratewise.")) {
      // CORS preflight for OAuth endpoints
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tenant-id, x-user-id",
            "Access-Control-Max-Age": "86400",
          },
        });
      }

      // Serve OAuth metadata (local — no proxy needed, references this domain)
      if (
        path === "/.well-known/oauth-authorization-server" ||
        path === "/.well-known/openid-configuration"
      ) {
        const metadata = {
          issuer: `https://${hostname}`,
          authorization_endpoint: `https://${hostname}/oauth/authorize`,
          token_endpoint: `https://${hostname}/oauth/token`,
          registration_endpoint: `https://${hostname}/oauth/register`,
          revocation_endpoint: `https://${hostname}/oauth/revoke`,
          jwks_uri: `https://${hostname}/.well-known/jwks.json`,
          scopes_supported: [
            "mcp:tools",
            "mcp:resources",
            "tenant:read",
            "tenant:write",
            "memory:read",
            "memory:write",
          ],
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "client_credentials", "refresh_token"],
          token_endpoint_auth_methods_supported: [
            "client_secret_post",
            "client_secret_basic",
            "none",
          ],
        };
        return new Response(JSON.stringify(metadata), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Serve JWKS containing our public key
      if (path === "/.well-known/jwks.json") {
        return new Response(JSON.stringify({ keys: [PUBLIC_JWK] }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // ─── OAuth Endpoints: Proxy to MCP Connector ───────────────────────────
      // MCP connector holds D1 client registry, refresh token logic, and crypto keys.
      // Gateway proxies /oauth/* traffic so both auth.integratewise.ai and
      // mcp.integratewise.ai serve the same OAuth flow.
      if (path.startsWith("/oauth/")) {
        const proxyHeaders = new Headers(request.headers);
        proxyHeaders.set("x-forwarded-host", hostname);
        proxyHeaders.set("x-forwarded-by", "integratewise-gateway");

        const proxyRequest = new Request(request.url, {
          method: request.method,
          headers: proxyHeaders,
          body: request.body,
        });

        return env.CONNECTOR.fetch(proxyRequest);
      }

      return new Response("Not Found", { status: 404 });
    }

    // 2. Protected Resource Server (mcp.integratewise.ai / mcp.integratewise.local)
    if (hostname.startsWith("mcp.integratewise.")) {
      // Serve protected resource metadata
      if (path === "/.well-known/oauth-protected-resource") {
        const metadata = {
          resource: `https://${hostname}`,
          authorization_servers: [`https://${hostname.replace("mcp.", "auth.")}`],
          scopes_supported: [
            "mcp:tools",
            "mcp:resources",
            "tenant:read",
            "tenant:write",
            "memory:read",
            "memory:write",
          ],
        };
        return new Response(JSON.stringify(metadata), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Intercept MCP routes
      const isMcpPath =
        path === "/tools" ||
        path.startsWith("/tools/") ||
        path === "/invoke" ||
        path.startsWith("/invoke") ||
        path === "/mcp" ||
        path.startsWith("/mcp/") ||
        path === "/sessions" ||
        path.startsWith("/sessions/") ||
        path === "/config/mcp-server" ||
        path.startsWith("/config/") ||
        path.startsWith("/v1/mcp/");

      if (isMcpPath) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(
            JSON.stringify({ error: "unauthorized", message: "Bearer token required" }),
            {
              status: 401,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": corsOrigin,
                "Access-Control-Allow-Credentials": "true",
                Vary: "Origin",
                "WWW-Authenticate": `Bearer resource_metadata="https://${hostname}/.well-known/oauth-protected-resource"`,
              },
            }
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const expectedIssuer = `https://${hostname.replace("mcp.", "auth.")}`;
        const expectedAudience = `https://${hostname}`;

        const result = await verifyJWT(token, expectedIssuer, expectedAudience);
        if (!result.valid || !result.payload) {
          return new Response(JSON.stringify({ error: "invalid_token", message: result.error }), {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": corsOrigin,
              "WWW-Authenticate": `Bearer error="invalid_token", error_description="${result.error || "Invalid token"}", resource_metadata="https://${hostname}/.well-known/oauth-protected-resource"`,
            },
          });
        }

        const payload = result.payload;

        // Enrich headers and route to connector
        const enrichedHeaders = new Headers(request.headers);
        enrichedHeaders.set("x-tenant-id", payload.tenant_id);
        enrichedHeaders.set("x-user-id", payload.sub);
        enrichedHeaders.set("x-user-role", payload.role);
        enrichedHeaders.set("x-oauth-scope", payload.scope || "");
        enrichedHeaders.set("cf-worker", "integratewise-gateway"); // internal trust assertion

        const enrichedRequest = createForwardRequest(request.url, request, enrichedHeaders);
        const response = await routeConnectorRequest(enrichedRequest, env);
        const corsResponse = new Response(response.body, response);
        corsResponse.headers.set("Access-Control-Allow-Origin", corsOrigin);
        corsResponse.headers.set("Access-Control-Allow-Credentials", "true");
        corsResponse.headers.set("Vary", "Origin");
        return corsResponse;
      }
    }

    // 3. Regular Domain Routing / API Gateway
    // All routes served from same domain, no split routing needed
    const API_PREFIXES = [
      "/api/",
      "/webhooks/",
      // MCP tool server public entrypoints (no JWT; mcp-connector enforces MCP key or JWT)
      "/tools",
      "/invoke",
      "/mcp",
      "/sessions",
      "/config",
      "/v1/mcp",
      "/admin/",
      "/stream/",
      "/health",
      "/metrics/",
      "/app",
      "/oauth/",
    ];
    const isApiRoute = API_PREFIXES.some((prefix) => path.startsWith(prefix));
    if (!isApiRoute && path !== "/pricing" && path !== "/pricing/") {
      // Root path health check
      if (path === "/" || path === "") {
        return new Response(JSON.stringify({ status: "ok", service: "integratewise-gateway" }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      // Non-API routes return 404 in local dev (no origin to pass through to)
      return new Response("Not Found", { status: 404 });
    }

    // 🟢 PRICING → redirect to app
    if (path === "/pricing" || path === "/pricing/") {
      return Response.redirect("https://app.integratewise.ai", 301);
    }

    // 🔵 API ROUTES - Continue with existing gateway logic
    allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : [];
    requestOrigin = request.headers.get("Origin") || "";
    // Reflect the request origin (Bearer-token auth, no cookies — safe to echo origin).
    // Falls back to allowlist entry only when no Origin header is present.
    corsOrigin = requestOrigin || allowedOrigins[0] || "*";

    // CORS preflight
    if (request.method === "OPTIONS") {
      // Reflect the requesting origin so browser apps (incl. localhost dev) pass preflight.
      const preflightOrigin = requestOrigin || corsOrigin || "*";
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": preflightOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Authorization, X-MCP-Key, Content-Type, x-tenant-id, x-user-id, x-idempotency-key, x-correlation-id, x-view-context, x-approval-token",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }

    // IP-based edge throttling for all ingress requests.
    try {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const ipRateKey = `ip:${ip}:${Math.floor(Date.now() / 60000)}`;
      const currentIpCount = parseInt((await env.RATE_LIMITS.get(ipRateKey)) || "0", 10);
      if (currentIpCount >= 100) {
        logGatewayEvent("rate_limited_ip", { ip });
        return new Response("Rate limited", {
          status: 429,
          headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": corsOrigin },
        });
      }
      await env.RATE_LIMITS.put(ipRateKey, String(currentIpCount + 1), { expirationTtl: 120 });

      // Per-route rate limiting for AI endpoints (stricter than general IP limit)
      const AI_RATE_LIMITS: Record<string, number> = {
        "/api/v1/brainstorm": 20,
        "/api/v1/cognitive/context-to-truth": 10,
        "/api/v1/intelligence": 60,
      };
      for (const [routePrefix, maxPerMin] of Object.entries(AI_RATE_LIMITS)) {
        if (path.startsWith(routePrefix)) {
          const userId =
            request.headers.get("x-user-id") || request.headers.get("x-tenant-id") || ip;
          const aiRateKey = `ai:${userId}:${routePrefix}:${Math.floor(Date.now() / 60000)}`;
          const aiCount = parseInt((await env.RATE_LIMITS.get(aiRateKey)) || "0", 10);
          if (aiCount >= maxPerMin) {
            return new Response(
              JSON.stringify({
                error: "Rate limit exceeded for AI endpoint",
                retry_after: 60 - (Math.floor(Date.now() / 1000) % 60),
              }),
              {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": corsOrigin,
                },
              }
            );
          }
          await env.RATE_LIMITS.put(aiRateKey, String(aiCount + 1), { expirationTtl: 120 });
          break;
        }
      }
    } catch (err) {
      console.error("IP rate limiting check failed (denying for safety):", err);
      return new Response("Service temporarily unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": corsOrigin },
      });
    }

    // Body size limits (10 MB general, 1 MB webhooks)
    const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (contentLength > 0) {
      const MAX_BODY_BYTES = path.startsWith("/webhooks") ? 1 * 1024 * 1024 : 10 * 1024 * 1024;
      if (contentLength > MAX_BODY_BYTES) {
        return new Response(JSON.stringify({ error: "Payload too large" }), {
          status: 413,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        });
      }
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "gateway", ts: Date.now() }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
      });
    }

    // Readiness check — probes all downstream services
    if (url.pathname === "/health/ready") {
      const services: Array<{ name: string; binding: string; fetcher?: Fetcher }> = [
        { name: "connector", binding: "CONNECTOR", fetcher: env.CONNECTOR },
        { name: "pipeline", binding: "PIPELINE", fetcher: env.PIPELINE },
        { name: "intelligence", binding: "INTELLIGENCE", fetcher: env.INTELLIGENCE },
        { name: "knowledge", binding: "KNOWLEDGE", fetcher: env.KNOWLEDGE },
        { name: "bff", binding: "BFF", fetcher: env.BFF },
        { name: "l2", binding: "L2", fetcher: env.L2 },
        { name: "webhook-ingress", binding: "WEBHOOK_INGRESS", fetcher: env.WEBHOOK_INGRESS },
        { name: "folder-watcher", binding: "FOLDER_WATCHER", fetcher: env.FOLDER_WATCHER },
      ];

      const results = await Promise.all(
        services.map(async (svc) => {
          if (!svc.fetcher)
            return { name: svc.name, healthy: false, error: "binding_not_configured" };
          const probe = await probeService(svc.name, svc.fetcher, 3000);
          return {
            name: svc.name,
            healthy: probe.healthy,
            latency_ms: probe.latencyMs,
            status: probe.status,
            error: probe.error,
          };
        })
      );

      const allHealthy = results.every((r) => r.healthy);
      return new Response(
        JSON.stringify({
          status: allHealthy ? "ready" : "degraded",
          service: "gateway",
          ts: Date.now(),
          services: results,
        }),
        {
          status: allHealthy ? 200 : 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        }
      );
    }

    if (url.pathname === "/metrics/signals") {
      // Require authentication — this endpoint exposes operational data
      const metricsAuth = request.headers.get("Authorization");
      if (!metricsAuth?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Credentials": "true",
            Vary: "Origin",
          },
        });
      }

      if (!isSignalsEnabled(env)) {
        return new Response(
          JSON.stringify({
            recent_signals: [],
            hitl_pending: { pending: 0 },
            pipeline_latency: null,
            enabled: false,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": corsOrigin,
            },
          }
        );
      }

      const recentSignals = await readRecentSignals(env.SIGNAL_CACHE);
      const hitlPending = await readHitlPending(env.BFF);
      const lastPipeline = Number((await env.METRICS?.get("last_pipeline")) || "0");
      const pipelineLatency = lastPipeline > 0 ? Date.now() - lastPipeline : null;

      return new Response(
        JSON.stringify({
          recent_signals: recentSignals.slice(0, 50),
          hitl_pending: hitlPending,
          pipeline_latency: pipelineLatency,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADK Capabilities API — exposes the capability resolver for introspection
    // and plan-tier gating. Authenticated endpoint.
    // ═══════════════════════════════════════════════════════════════════════════
    if (url.pathname === "/api/v1/capabilities" && request.method === "GET") {
      const authHeader = request.headers.get("Authorization");
      const tenantId = getTenantId(request);
      if (!authHeader || !tenantId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Credentials": "true",
            Vary: "Origin",
          },
        });
      }
      const tenantRow = await env.DB.prepare(
        "SELECT subscription_tier FROM tenant_spine_config WHERE tenant_id = ?"
      )
        .bind(tenantId)
        .first<{ subscription_tier: string }>();
      const tier = tenantRow?.subscription_tier || "free";

      const { CapabilityRegistry, BUILTIN_CAPABILITIES } = await import("@integratewise/adk");
      const registry = new CapabilityRegistry(BUILTIN_CAPABILITIES);
      const available = registry.list(tier);

      return new Response(
        JSON.stringify({
          tier,
          capabilities: available.map((c: any) => ({
            name: c.name,
            description: c.description,
            min_tier: c.min_tier,
            channel: c.channel,
          })),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        }
      );
    }

    if (url.pathname === "/api/v1/capabilities/resolve" && request.method === "POST") {
      const authHeader = request.headers.get("Authorization");
      const tenantId = getTenantId(request);
      if (!authHeader || !tenantId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            "Access-Control-Allow-Credentials": "true",
            Vary: "Origin",
          },
        });
      }
      const body = (await request.json().catch(() => null)) as any;
      if (!body?.capability) {
        return new Response(JSON.stringify({ error: "Missing 'capability' in body" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        });
      }
      const { createResolver } = await import("@integratewise/adk");
      const resolver = createResolver(env.SESSIONS);
      const tenantCtx = await resolver.getTenantContext(tenantId, env.DB);
      if (!tenantCtx) {
        return new Response(JSON.stringify({ error: "Tenant not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        });
      }
      const userId = request.headers.get("x-user-id") || "system";
      const role = request.headers.get("x-user-role") || "member";
      const routingCtx = resolver.buildContext(tenantCtx, userId, role);

      const result = await resolver.resolve({
        capability: body.capability,
        arguments: body.arguments || {},
        context: routingCtx,
      });
      const status = result.resolved
        ? 200
        : result.error === "PLAN_INSUFFICIENT"
          ? 403
          : result.error === "CAPABILITY_NOT_FOUND"
            ? 404
            : result.error === "CONNECTOR_SYNCING"
              ? 202
              : 403;
      return new Response(JSON.stringify(result), {
        status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
      });
    }

    if (
      (url.pathname === "/api/v1/public/contact" || url.pathname === "/api/v1/public/newsletter") &&
      request.method === "POST"
    ) {
      const response = await routeSupportRequest(request, env);
      const corsResponse = new Response(response.body, response);
      corsResponse.headers.set("Access-Control-Allow-Origin", corsOrigin);
      corsResponse.headers.set("Access-Control-Allow-Credentials", "true");
      corsResponse.headers.set("Vary", "Origin");
      return corsResponse;
    }

    // MCP tool server entrypoints bypass JWT (mcp-connector enforces MCP key or JWT itself).
    if (
      url.pathname === "/tools" ||
      url.pathname.startsWith("/tools/") ||
      url.pathname === "/invoke" ||
      url.pathname.startsWith("/invoke") ||
      url.pathname === "/mcp" ||
      url.pathname.startsWith("/mcp/") ||
      url.pathname === "/sessions" ||
      url.pathname.startsWith("/sessions/") ||
      url.pathname === "/config/mcp-server" ||
      url.pathname.startsWith("/config/") ||
      url.pathname.startsWith("/v1/mcp/")
    ) {
      const response = await routeConnectorRequest(request, env);
      const corsResponse = new Response(response.body, response);
      corsResponse.headers.set("Access-Control-Allow-Origin", corsOrigin);
      corsResponse.headers.set("Access-Control-Allow-Credentials", "true");
      corsResponse.headers.set("Vary", "Origin");
      return corsResponse;
    }

    // Webhook routes bypass auth (they use signature verification)
    if (url.pathname.startsWith("/webhooks")) {
      // Billing webhooks are verified in billing service itself.
      if (
        url.pathname.startsWith("/webhooks/billing") ||
        url.pathname.startsWith("/webhooks/stripe") ||
        url.pathname.startsWith("/webhooks/razorpay")
      ) {
        return routeRequest(request, env, "INTERNAL_BILLING");
      }

      const provider = url.pathname.split("/webhooks/")[1]?.split("/")[0] || "unknown";
      const isValid = await verifyWebhook(provider, request.clone(), env);
      if (!isValid) {
        logGatewayEvent("webhook_rejected", { provider, path: url.pathname });
        return new Response("Unauthorized", {
          status: 401,
          headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": corsOrigin },
        });
      }
      logGatewayEvent("webhook_verified", { provider, path: url.pathname });

      // Route verified webhooks to WEBHOOK_INGRESS (real-time + pipeline). Falls back to CONNECTOR if not deployed.
      return routeWebhookIngressRequest(request, env);
    }

    let email = "";
    const authHeader = request.headers.get("Authorization");
    const isAuthApiPath =
      path === "/api/v1/auth/signup" ||
      path === "/api/v1/auth/login" ||
      path === "/api/v1/auth/signup/" ||
      path === "/api/v1/auth/login/" ||
      path === "/api/v1/auth/me" ||
      path === "/api/v1/auth/update" ||
      // Social OAuth (Google/GitHub) start + callback — public browser navigations.
      /^\/api\/v1\/auth\/oauth\/(google|github)\/(start|callback)$/.test(path);
    const isPublicAuthRoute =
      isAuthApiPath &&
      (request.method === "POST" ||
        request.method === "GET" ||
        request.method === "PATCH" ||
        request.method === "OPTIONS");

    // CORS preflight for public auth routes — respond immediately
    if (isAuthApiPath && request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": requestOrigin || "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tenant-id, x-user-id",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (isPublicAuthRoute) {
      // Route public auth request directly
      for (const [prefix, target] of ROUTES) {
        if (url.pathname.startsWith(prefix)) {
          const response = await routeRequest(request, env, target);
          const corsResponse = new Response(response.body, response);
          corsResponse.headers.set("Access-Control-Allow-Origin", requestOrigin || corsOrigin);
          corsResponse.headers.set("Access-Control-Allow-Credentials", "true");
          return corsResponse;
        }
      }
    }

    let user = { id: "", email: "" };
    let profile = { tenant_id: null, org_id: null, team_id: null, role: "member" };

    const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
    const headerTenantId = request.headers.get("x-tenant-id");

    if (assertion) {
      // 1. Cloudflare Zero Trust Authentication (Production Mode)
      const verified = await verifyZeroTrustToken(assertion, env);
      if (!verified) {
        return new Response(JSON.stringify({ error: "Invalid Cloudflare Access Token" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        });
      }
      email = verified.email;
      user = { id: `user-cf-${email.split("@")[0]}`, email };

      // Customer Zero: @integratewise.ai → iw-customer-zero (enterprise, all layers)
      const domain = email.split("@")[1];
      if (domain === "integratewise.ai") {
        await ensureCustomerZeroMembership(env, email, user.id);
        const cz = resolveCustomerZeroProfile(email);
        profile = {
          tenant_id: cz.tenant_id as any,
          org_id: cz.org_id as any,
          team_id: cz.team_id as any,
          role: cz.role,
        };
      } else {
        // Query profile for external custom domains
        profile = await fetchProfileByEmail(email, env);
      }
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      // 2. Standard JWT Bearer token fallback (Initial Users / Local Dev)
      const token = authHeader.replace("Bearer ", "");
      const result = await verifyJWT(
        token,
        "https://auth.integratewise.ai",
        "https://app.integratewise.ai"
      );

      if (!result.valid || !result.payload) {
        return new Response(
          JSON.stringify({ error: `Invalid Authorization Token: ${result.error || "unknown"}` }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": corsOrigin,
            },
          }
        );
      }

      const payload = result.payload;
      user = { id: payload.sub || "", email: (payload as any).email || "" };

      const tenantsDb = env.DB || null;
      if (tenantsDb) {
        try {
          const dbProfile = await tenantsDb
            .prepare(`SELECT role, tenant_id FROM tenant_users WHERE id = ?`)
            .bind(user.id)
            .first<{ role: string; tenant_id: string }>();

          profile = {
            tenant_id: (dbProfile?.tenant_id || payload.tenant_id || null) as any,
            org_id: null,
            team_id: null,
            role: dbProfile?.role || payload.role || "member",
          };
        } catch {
          profile = {
            tenant_id: (payload.tenant_id || null) as any,
            org_id: null,
            team_id: null,
            role: payload.role || "member",
          };
        }
      } else {
        profile = {
          tenant_id: (payload.tenant_id || null) as any,
          org_id: null,
          team_id: null,
          role: payload.role || "member",
        };
      }
    } else {
      // 3. No token present
      return new Response(
        JSON.stringify({
          error:
            "Unauthorized: Missing JWT. All requests require Cf-Access-Jwt-Assertion or Authorization header.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        }
      );
    }

    const profileTenantId = profile?.tenant_id || null;
    const profileOrgId = profile?.org_id || null;
    const profileTeamId = profile?.team_id || null;

    // Validate tenant isolation
    if (headerTenantId && profileTenantId && headerTenantId !== profileTenantId) {
      return new Response(JSON.stringify({ error: "Tenant mismatch" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
      });
    }

    const tenantId = profileTenantId;

    if (!tenantId) {
      if (!profile || (profile as any).role === undefined) {
        return new Response(
          JSON.stringify({ error: "Profile not yet provisioned", retryable: true }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "2",
              "Access-Control-Allow-Origin": corsOrigin,
            },
          }
        );
      }
      return new Response(JSON.stringify({ error: "No tenant context" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
      });
    }

    // Rate limit check
    try {
      const rateLimitKey = `${tenantId}:${user.id}:${Math.floor(Date.now() / 60000)}`;
      const count = parseInt((await env.RATE_LIMITS.get(rateLimitKey)) || "0");
      if (count >= 100) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        });
      }
      await env.RATE_LIMITS.put(rateLimitKey, String(count + 1), { expirationTtl: 120 });
    } catch (err) {
      console.error("Tenant rate limiting check failed (denying for safety):", err);
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": corsOrigin,
        },
      });
    }

    // Enrich request with auth context and forward
    const enrichedHeaders = new Headers(request.headers);
    enrichedHeaders.set("x-tenant-id", tenantId);
    enrichedHeaders.set("x-user-id", user.id);
    enrichedHeaders.set("x-user-role", profile?.role || "member");
    if (profileOrgId) {
      enrichedHeaders.set("x-org-id", profileOrgId);
    }
    if (profileTeamId) {
      enrichedHeaders.set("x-team-id", profileTeamId);
    }
    if (user.email) {
      enrichedHeaders.set("x-user-email", user.email);
    }

    const enrichedRequest = createForwardRequest(request.url, request, enrichedHeaders);

    // ─── Twin Handoff (POST /v1/twin/handoff) ─────────────────────────────
    if (
      (url.pathname === "/v1/twin/handoff" || url.pathname === "/api/v1/twin/handoff") &&
      request.method === "POST"
    ) {
      const handoffResponse = await handleTwinHandoff(enrichedRequest, env);
      const corsHandoff = new Response(handoffResponse.body, handoffResponse);
      corsHandoff.headers.set("Access-Control-Allow-Origin", corsOrigin);
      corsHandoff.headers.set("Access-Control-Allow-Credentials", "true");
      corsHandoff.headers.set("Vary", "Origin");
      return corsHandoff;
    }

    // ─── Workspace Spine Schema (D1-direct, no Supabase/ETL) ──────────────
    // Hydrates the tenant's Spine projection schema in D1 and serves
    // connector/config reads directly. Bypasses the Supabase-dependent BFF.
    // The UI reads entity DATA via projections (read from the Spine), never here.
    if (url.pathname.startsWith("/api/v1/workspace/")) {
      const spineResp = await routeWorkspaceSpineRequest(
        enrichedRequest,
        env as Env & { DB: D1Database },
        tenantId
      );
      if (spineResp) {
        const corsResp = new Response(spineResp.body, spineResp);
        corsResp.headers.set("Access-Control-Allow-Origin", corsOrigin);
        corsResp.headers.set("Access-Control-Allow-Credentials", "true");
        corsResp.headers.set("Vary", "Origin");
        return corsResp;
      }
    }

    // ─── Dashboard creamy entities (D1-direct Spine read, "first victory") ─
    // Returns ≤5 high-signal Spine entities so the dashboard is never empty.
    if (url.pathname === "/api/v1/pipeline/entities" && request.method === "GET") {
      const limit = Number(url.searchParams.get("limit") || "5");
      const entityType = url.searchParams.get("type") || undefined;
      const workspace = url.searchParams.get("workspace") || undefined;
      const entResp = await getSpineEntities(env as Env & { DB: D1Database }, tenantId, {
        limit,
        entityType,
        workspace,
      });
      const corsResp = new Response(entResp.body, entResp);
      corsResp.headers.set("Access-Control-Allow-Origin", corsOrigin);
      corsResp.headers.set("Access-Control-Allow-Credentials", "true");
      corsResp.headers.set("Vary", "Origin");
      return corsResp;
    }

    // Route to downstream service (consolidated or internal)
    for (const [prefix, target] of ROUTES) {
      if (url.pathname.startsWith(prefix)) {
        const response = await routeRequest(enrichedRequest, env, target);

        // Add CORS headers to response. ACAC must be present on the ACTUAL response
        // (not just preflight) because the web clients send credentials:"include";
        // ACAO must be the specific origin (never "*") when credentials are allowed.
        const corsResponse = new Response(response.body, response);
        corsResponse.headers.set("Access-Control-Allow-Origin", requestOrigin || corsOrigin);
        corsResponse.headers.set("Access-Control-Allow-Credentials", "true");
        corsResponse.headers.set("Vary", "Origin");
        return corsResponse;
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": requestOrigin || corsOrigin,
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin",
      },
    });
  },
};

async function verifyWebhook(provider: string, request: Request, env: Env): Promise<boolean> {
  if (provider === "slack" || provider === "slack-workflow") {
    const signature = request.headers.get("x-slack-signature");
    const timestampHeader = request.headers.get("x-slack-request-timestamp");
    const secret = env.SLACK_SIGNING_SECRET;
    if (!signature || !timestampHeader || !secret) return false;
    if (!signature.startsWith("v0=")) return false;

    const requestTs = Number(timestampHeader);
    if (!Number.isFinite(requestTs)) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - requestTs) > 300) return false;

    const body = await request.text();
    const expectedHex = await hmacHex(secret, `v0:${timestampHeader}:${body}`);
    const expected = `v0=${expectedHex}`;
    return timingSafeEqual(expected, signature);
  }

  if (provider === "hubspot") {
    const signature = request.headers.get("x-hubspot-signature-v3");
    const timestampHeader = request.headers.get("x-hubspot-request-timestamp");
    if (!signature || !timestampHeader || !env.HUBSPOT_WEBHOOK_SECRET) return false;

    const requestTs = Number(timestampHeader);
    if (!Number.isFinite(requestTs)) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - requestTs) > 300) return false;

    const body = await request.text();
    const fullUrl = new URL(request.url).toString();
    const payload = `${request.method}${fullUrl}${body}${timestampHeader}`;
    const encodedSecret = new TextEncoder().encode(env.HUBSPOT_WEBHOOK_SECRET);
    const key = await crypto.subtle.importKey(
      "raw",
      encodedSecret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const computedBase64 = base64FromBytes(new Uint8Array(digest));
    return timingSafeEqual(computedBase64, signature);
  }

  if (provider === "github") {
    const signatureHeader = request.headers.get("x-hub-signature-256");
    const secret = env.GITHUB_WEBHOOK_SECRET;
    if (!signatureHeader || !secret) return false;

    const body = await request.text();
    const digestHex = await hmacHex(secret, body);
    const expected = `sha256=${digestHex}`;
    return timingSafeEqual(expected, signatureHeader);
  }

  if (provider === "stripe") {
    const signatureHeader = request.headers.get("stripe-signature");
    const secret = env.STRIPE_WEBHOOK_SECRET;
    if (!signatureHeader || !secret) return false;

    const body = await request.text();
    const parsed = parseStripeSignatureHeader(signatureHeader);
    if (!parsed.timestamp || !parsed.v1) return false;

    const signedPayload = `${parsed.timestamp}.${body}`;
    const expected = await hmacHex(secret, signedPayload);
    return timingSafeEqual(expected, parsed.v1);
  }

  if (provider === "salesforce") {
    const signatureHeader = request.headers.get("x-salesforce-signature");
    const secret = env.SALESFORCE_WEBHOOK_SECRET;
    if (!signatureHeader || !secret) return false;

    const body = await request.text();
    // Generic HMAC SHA256 validation for custom Salesforce webhook relays.
    const expectedHex = await hmacHex(secret, body);
    const expectedBase64 = base64FromHex(expectedHex);
    return (
      timingSafeEqual(expectedHex, signatureHeader.toLowerCase()) ||
      timingSafeEqual(expectedBase64, signatureHeader)
    );
  }

  if (provider === "razorpay") {
    const signatureHeader = request.headers.get("x-razorpay-signature");
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!signatureHeader || !secret) return false;

    const body = await request.text();
    const expected = await hmacHex(secret, body);
    return timingSafeEqual(expected, signatureHeader.toLowerCase());
  }

  // Connector webhook providers delegated to Loader (CONNECTOR): verification done there when secret set
  if (CONNECTOR_WEBHOOK_PROVIDERS.has(provider.toLowerCase())) {
    return true; // Allow; Loader (CONNECTOR) performs per-tool signature verification
  }

  // Unknown providers are denied by default.
  return false;
}

function isSignalsEnabled(env: Env): boolean {
  return String(env.ENABLE_SIGNALS ?? "true").toLowerCase() === "true";
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64FromHex(hex: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return base64FromBytes(new Uint8Array(bytes));
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseStripeSignatureHeader(header: string): { timestamp?: string; v1?: string } {
  const out: { timestamp?: string; v1?: string } = {};
  for (const part of header.split(",")) {
    const [key, value] = part.trim().split("=");
    if (key === "t") out.timestamp = value;
    if (key === "v1") out.v1 = value;
  }
  return out;
}

async function readRecentSignals(signalCache?: KVNamespace): Promise<any[]> {
  if (!signalCache) return [];
  const keyList = await signalCache.list({ prefix: "signal:", limit: 50 });
  const values = await Promise.all(
    keyList.keys.map(async (k) => {
      try {
        const raw = await signalCache.get(k.name);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })
  );
  return values.filter(Boolean).sort((a: any, b: any) => {
    const at = new Date(a.timestamp || 0).getTime();
    const bt = new Date(b.timestamp || 0).getTime();
    return bt - at;
  });
}

async function readHitlPending(bff: Fetcher): Promise<any> {
  try {
    const res = await bff.fetch(new Request("http://bff/hitl/count"));
    if (!res.ok) return { pending: 0 };
    return await res.json();
  } catch {
    return { pending: 0 };
  }
}

function logGatewayEvent(event: string, details: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      service: "gateway",
      event,
      ...details,
    })
  );
}

// ─── CLOUDFLARE ZERO TRUST & GOOGLE WORKSPACE SSO HELPERS ────────────────────

interface ZeroTrustPayload {
  email: string;
  groups?: Array<{ id: string; name: string }>;
  exp: number;
}

/**
 * Verify Cloudflare Zero Trust JWT Access assertion using JWKS public certs
 */
async function verifyZeroTrustToken(token: string, env: Env): Promise<ZeroTrustPayload | null> {
  try {
    const teamDomain = env.CF_ACCESS_TEAM_DOMAIN
      ? env.CF_ACCESS_TEAM_DOMAIN.replace("https://", "").split(".")[0]
      : env.ALLOWED_ORIGINS?.split(",")[0]?.replace("https://", "")?.split(".")[0] ||
        "integratewise";
    const certsUrl = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;

    const certsRes = await fetch(certsUrl);
    if (!certsRes.ok) {
      console.error("[Gateway] Failed to retrieve Cloudflare JWKS certs");
      return null;
    }

    const { keys } = (await certsRes.json()) as { keys: any[] };
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode base64url header and payload safely
    const decodeB64Url = (str: string) => {
      const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(b64));
    };

    const header = decodeB64Url(headerB64);
    const payload = decodeB64Url(payloadB64) as ZeroTrustPayload;

    // Verify token expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && nowSec > payload.exp) {
      console.error("[Gateway] Zero Trust token has expired");
      return null;
    }

    // Match Certificate Key ID (kid)
    const jwk = keys.find((key) => key.kid === header.kid);
    if (!jwk) {
      console.error(`[Gateway] JWK certificate key ID ${header.kid} not found`);
      return null;
    }

    // Import JWK key using native Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode signature
    const signatureBytes = new Uint8Array(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Verify cryptographic signature
    const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signatureBytes,
      dataBytes
    );

    return isValid ? payload : null;
  } catch (err) {
    console.error("[Gateway] Zero Trust JWKS verification error:", err);
    return null;
  }
}

/**
 * Fetch profile metadata from D1 tenant_users using email.
 * Migrated off Supabase (DECISION 22) — users live in D1 `tenant_users`
 * (written by auth.ts signup). Mirrors the auth.ts login query.
 * Returns the legacy profile shape; org_id/team_id are not modeled in D1 (null).
 */
async function fetchProfileByEmail(email: string, env: Env): Promise<any> {
  const db = (env as any).DB as D1Database | undefined;
  if (!db) return null;
  try {
    const row = await db
      .prepare(
        `SELECT id, tenant_id, role FROM tenant_users WHERE email = ? AND status = 'active' LIMIT 1`
      )
      .bind(email)
      .first<{ id: string; tenant_id: string; role: string }>();

    if (!row) return null;
    return { tenant_id: row.tenant_id, id: row.id, org_id: null, team_id: null, role: row.role };
  } catch (err) {
    console.error("[Gateway] Failed to retrieve profile by email from D1:", err);
    return null;
  }
}
