/**
 * IntegrateWise Gateway - Test Suite
 *
 * Tests for CORS, JWT auth, rate limiting, tenant isolation,
 * route dispatching, and webhook signature verification.
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { signJWT } from "./lib/jwt";

// =============================================================================
// MOCKS
// =============================================================================

// Mock sub-services imported by gateway
const { mockAdminFetch, mockBillingFetch, mockTenantsFetch } = vi.hoisted(() => ({
  mockAdminFetch: vi.fn((_req?: Request) => new Response("admin ok")),
  mockBillingFetch: vi.fn((_req?: Request) => new Response("billing ok")),
  mockTenantsFetch: vi.fn((_req?: Request) => new Response("tenants ok")),
}));

vi.mock("../../admin/src/index", () => ({
  default: { fetch: mockAdminFetch },
}));
vi.mock("../../billing/src/index", () => ({
  default: { fetch: mockBillingFetch },
}));
vi.mock("../../tenants/src/index", () => ({
  default: { fetch: mockTenantsFetch },
}));

import gateway from "./index";

let validToken: string;
let tokenNoTenant: string;
let tokenTenantA: string;

beforeAll(async () => {
  validToken = await signJWT({
    iss: "https://auth.integratewise.ai",
    aud: "https://app.integratewise.ai",
    sub: "user-1",
    email: "user@test.com",
    tenant_id: "t1",
    role: "member",
    scope: "mcp:tools",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  tokenNoTenant = await signJWT({
    iss: "https://auth.integratewise.ai",
    aud: "https://app.integratewise.ai",
    sub: "user-1",
    email: "user@test.com",
    role: "member",
    scope: "mcp:tools",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  tokenTenantA = await signJWT({
    iss: "https://auth.integratewise.ai",
    aud: "https://app.integratewise.ai",
    sub: "user-1",
    email: "user@test.com",
    tenant_id: "tenant-A",
    role: "member",
    scope: "mcp:tools",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
});

// =============================================================================
// HELPERS
// =============================================================================

function createMockEnv(overrides: Record<string, unknown> = {}) {
  return {
    CONNECTOR: { fetch: vi.fn(() => new Response("connector ok")) },
    CONNECTOR_SYNC: { fetch: vi.fn(() => new Response("connector-sync ok")) },
    PIPELINE: { fetch: vi.fn(() => new Response("pipeline ok")) },
    INTELLIGENCE: { fetch: vi.fn(() => new Response("intelligence ok")) },
    KNOWLEDGE: { fetch: vi.fn(() => new Response("knowledge ok")) },
    BFF: { fetch: vi.fn(() => new Response("bff ok")) },
    L2: { fetch: vi.fn(() => new Response("l2 ok")) },
    RATE_LIMITS: {
      get: vi.fn(() => Promise.resolve("0")),
      put: vi.fn(() => Promise.resolve()),
    },
    SESSIONS: {
      get: vi.fn(() => Promise.resolve(null)),
      put: vi.fn(() => Promise.resolve()),
    },
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-role-key",
    ALLOWED_ORIGINS: "https://integratewise.ai,http://localhost:5173",
    ...overrides,
  } as any;
}

function createMockCtx(): ExecutionContext {
  return { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any;
}

function createMockKv(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    get: vi.fn(async (key: string) => (store.has(key) ? store.get(key)! : null)),
    list: vi.fn(async ({ prefix }: { prefix?: string } = {}) => ({
      keys: Array.from(store.keys())
        .filter((key) => (prefix ? key.startsWith(prefix) : true))
        .map((name) => ({ name })),
    })),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    _store: store,
  };
}

function signWebhook(secret: string, body: string, prefix?: string): string {
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  return prefix ? `${prefix}${digest}` : digest;
}

async function fetchViaWebhookIngress(request: Request, ingressEnv: Record<string, unknown>) {
  const moduleUrl = new URL("../../webhook-ingress/src/index.ts", import.meta.url).href;
  const { default: ingress } = await import(moduleUrl);
  return ingress.fetch(request, ingressEnv as any);
}

// Stub global fetch so Supabase auth verification can be mocked
const originalFetch = globalThis.fetch;
function mockSupabaseAuth(
  user: { id: string; email?: string } | null,
  profile: { tenant_id?: string; role?: string } | null = null
) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("/auth/v1/user")) {
      if (!user) return new Response("Unauthorized", { status: 401 });
      return new Response(JSON.stringify(user), { status: 200 });
    }
    if (url.includes("/rest/v1/profiles")) {
      return new Response(JSON.stringify(profile ? [profile] : []), { status: 200 });
    }
    return originalFetch(input as any);
  }) as any;
}

// =============================================================================
// TESTS
// =============================================================================

describe("Gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = originalFetch;
  });

  // ─── CORS ─────────────────────────────────────────────────
  describe("CORS preflight", () => {
    it("should return correct headers on OPTIONS", async () => {
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/api/v1/connector/list", {
        method: "OPTIONS",
        headers: { Origin: "https://integratewise.ai" },
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(200);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://integratewise.ai");
      expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
      expect(res.headers.get("Access-Control-Allow-Headers")).toContain("Authorization");
    });
  });

  // ─── Health ───────────────────────────────────────────────
  describe("Health check", () => {
    it("should return ok on /health", async () => {
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/health");

      const res = await gateway.fetch(req, env, createMockCtx());
      const body = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(body.status).toBe("ok");
      expect(body.service).toBe("gateway");
    });
  });

  // ─── Auth ─────────────────────────────────────────────────
  describe("Authentication", () => {
    it("should reject requests without Authorization header", async () => {
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/api/v1/connector/list");

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(401);
    });

    it("should allow MCP tool discovery (/tools) without JWT", async () => {
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/tools");

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(200);
      expect(env.CONNECTOR.fetch).toHaveBeenCalled();
    });

    it("should reject invalid JWT tokens", async () => {
      mockSupabaseAuth(null);
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/api/v1/connector/list", {
        headers: { Authorization: "Bearer invalid-token" },
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(401);
    });

    it("should allow public contact submissions without JWT", async () => {
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/api/v1/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Prospect",
          email: "prospect@test.com",
          message: "Interested in a demo",
        }),
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(200);
      expect(mockAdminFetch).toHaveBeenCalledTimes(1);
      const forwardedRequest = mockAdminFetch.mock.calls[0]?.[0] as Request;
      expect(forwardedRequest.url).toContain("/v1/public/contact");
    });

    it("should reject users without tenant context", async () => {
      mockSupabaseAuth({ id: "user-1" }, { role: "member" } as any);
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/api/v1/connector/list", {
        headers: { Authorization: `Bearer ${tokenNoTenant}` },
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(400);
      const body = (await res.json()) as any;
      expect(body.error).toContain("tenant");
    });

    it("should accept valid JWT with tenant_id", async () => {
      mockSupabaseAuth({ id: "user-1" }, { tenant_id: "tenant-1", role: "member" });
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/api/v1/connector/list", {
        headers: { Authorization: `Bearer ${validToken}` },
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      // Should route to connector successfully (not 401/403)
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });

  // ─── Tenant isolation ─────────────────────────────────────
  describe("Tenant isolation", () => {
    it("should reject mismatched tenant headers", async () => {
      mockSupabaseAuth({ id: "user-1" }, { tenant_id: "tenant-A", role: "member" });
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/api/v1/connector/list", {
        headers: {
          Authorization: `Bearer ${tokenTenantA}`,
          "x-tenant-id": "tenant-B",
        },
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(403);
      const body = (await res.json()) as any;
      expect(body.error).toContain("mismatch");
    });

    it("should reject header-only tenant without JWT claim", async () => {
      mockSupabaseAuth({ id: "user-1" }, { role: "member" } as any);
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/api/v1/connector/list", {
        headers: {
          Authorization: `Bearer ${tokenNoTenant}`,
          "x-tenant-id": "tenant-fake",
        },
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(400);
    });
  });

  // ─── Rate limiting ────────────────────────────────────────
  describe("Rate limiting", () => {
    it("should rate limit IPs exceeding 100 req/min", async () => {
      const env = createMockEnv();
      (env.RATE_LIMITS.get as any).mockResolvedValue("101");

      const req = new Request("https://gateway.integratewise.ai/api/v1/connector/list", {
        headers: {
          Authorization: `Bearer ${validToken}`,
          "cf-connecting-ip": "1.2.3.4",
        },
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(429);
    });
  });

  // ─── Routing ──────────────────────────────────────────────
  describe("Route dispatching", () => {
    const testRoute = async (path: string, expectedBinding: string) => {
      mockSupabaseAuth({ id: "user-1" }, { tenant_id: "t1", role: "member" });
      const env = createMockEnv();
      const req = new Request(`https://gateway.integratewise.ai${path}`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });

      await gateway.fetch(req, env, createMockCtx());

      const binding = env[expectedBinding];
      if (binding?.fetch) {
        expect(binding.fetch).toHaveBeenCalled();
      }
    };

    it("routes /api/v1/connector/* to CONNECTOR", () =>
      testRoute("/api/v1/connector/status/hubspot", "CONNECTOR"));
    it("routes /api/v1/pipeline/* to PIPELINE", () =>
      testRoute("/api/v1/pipeline/status", "PIPELINE"));
    it("routes /api/v1/intelligence/* to INTELLIGENCE", () =>
      testRoute("/api/v1/intelligence/signals", "INTELLIGENCE"));
    it("routes /api/v1/knowledge/* to KNOWLEDGE", () =>
      testRoute("/api/v1/knowledge/search", "KNOWLEDGE"));
    it("routes /api/v1/workspace/* to BFF", () => testRoute("/api/v1/workspace/state", "BFF"));
    it("routes /stream/* to BFF", () => testRoute("/stream/events", "BFF"));

    it("routes /api/v1/support/* to internal support via admin service", async () => {
      mockSupabaseAuth(
        { id: "user-1", email: "customer@test.com" },
        { tenant_id: "t1", role: "member" }
      );
      const env = createMockEnv();
      const supportToken = await signJWT({
        iss: "https://auth.integratewise.ai",
        aud: "https://app.integratewise.ai",
        sub: "user-1",
        email: "customer@test.com",
        tenant_id: "t1",
        role: "member",
        scope: "mcp:tools",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      const req = new Request("https://gateway.integratewise.ai/api/v1/support/tickets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supportToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: "Help",
          description: "Need support",
        }),
      });

      await gateway.fetch(req, env, createMockCtx());

      expect(mockAdminFetch).toHaveBeenCalledTimes(1);
      const forwardedRequest = mockAdminFetch.mock.calls[0]?.[0] as Request;
      expect(forwardedRequest.url).toContain("/v1/support/tickets");
      expect(forwardedRequest.headers.get("x-user-id")).toBe("user-1");
      expect(forwardedRequest.headers.get("x-user-email")).toBe("customer@test.com");
    });

    it("routes provider sync status through CONNECTOR_SYNC when bound", async () => {
      mockSupabaseAuth({ id: "user-1" }, { tenant_id: "t1", role: "member" });
      let forwardedRequest: Request | undefined;
      const connectorSync = {
        fetch: vi.fn((request: Request) => {
          forwardedRequest = request;
          return Promise.resolve(
            new Response(JSON.stringify({ provider: "zendesk", status: "healthy" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }),
      };
      const env = createMockEnv({ CONNECTOR_SYNC: connectorSync });
      const req = new Request(
        "https://gateway.integratewise.ai/api/v1/connectors/zendesk/sync-status",
        {
          headers: { Authorization: `Bearer ${validToken}` },
        }
      );

      const res = await gateway.fetch(req, env, createMockCtx());
      const body = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(body.status).toBe("healthy");
      expect(connectorSync.fetch).toHaveBeenCalledTimes(1);
      expect(forwardedRequest).toBeInstanceOf(Request);
      if (!(forwardedRequest instanceof Request)) {
        throw new Error("Expected CONNECTOR_SYNC to receive a Request");
      }
      expect(forwardedRequest.url).toContain("/api/status/t1/zendesk");
    });

    it("falls back to CONNECTOR_STATUS KV for provider sync status when CONNECTOR_SYNC is unavailable", async () => {
      mockSupabaseAuth({ id: "user-1" }, { tenant_id: "t1", role: "member" });
      const env = createMockEnv({
        CONNECTOR_SYNC: undefined,
        CONNECTOR_STATUS: createMockKv({
          "sync:t1:zendesk": JSON.stringify({
            provider: "zendesk",
            status: "healthy",
            entitiesSynced: 12,
          }),
        }),
      });
      const req = new Request(
        "https://gateway.integratewise.ai/api/v1/connectors/zendesk/sync-status",
        {
          headers: { Authorization: `Bearer ${validToken}` },
        }
      );

      const res = await gateway.fetch(req, env, createMockCtx());
      const body = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(body.provider).toBe("zendesk");
      expect(body.status).toBe("healthy");
      expect(body.entitiesSynced).toBe(12);
    });

    it("returns all connector sync statuses for the authenticated tenant", async () => {
      mockSupabaseAuth({ id: "user-1" }, { tenant_id: "t1", role: "member" });
      const env = createMockEnv({
        CONNECTOR_SYNC: undefined,
        CONNECTOR_STATUS: createMockKv({
          "sync:t1:zendesk": JSON.stringify({ provider: "zendesk", status: "healthy" }),
          "sync:t1:hubspot": JSON.stringify({ provider: "hubspot", status: "syncing" }),
        }),
      });
      const req = new Request("https://gateway.integratewise.ai/api/v1/connectors/sync-status", {
        headers: { Authorization: `Bearer ${validToken}` },
      });

      const res = await gateway.fetch(req, env, createMockCtx());
      const body = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(body.tenantId).toBe("t1");
      expect(body.connectors.zendesk.status).toBe("healthy");
      expect(body.connectors.hubspot.status).toBe("syncing");
    });

    it("returns 404 for unknown routes", async () => {
      mockSupabaseAuth({ id: "user-1" }, { tenant_id: "t1", role: "member" });
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/api/v1/nonexistent", {
        headers: { Authorization: `Bearer ${validToken}` },
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(404);
    });
  });

  // ─── Webhooks ─────────────────────────────────────────────
  describe("Webhook handling", () => {
    it("should deny webhooks from unknown providers", async () => {
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/webhooks/unknown", {
        method: "POST",
        body: "{}",
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(401);
    });

    it("should deny HubSpot webhooks with invalid signature", async () => {
      const env = createMockEnv({ HUBSPOT_WEBHOOK_SECRET: "test-secret" });
      const req = new Request("https://gateway.integratewise.ai/webhooks/hubspot", {
        method: "POST",
        headers: {
          "x-hubspot-signature-v3": "invalid-sig",
          "x-hubspot-request-timestamp": String(Math.floor(Date.now() / 1000)),
        },
        body: '{"test":true}',
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(401);
    });

    it("should deny HubSpot webhooks with stale timestamps (>300s)", async () => {
      const env = createMockEnv({ HUBSPOT_WEBHOOK_SECRET: "test-secret" });
      const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600);
      const req = new Request("https://gateway.integratewise.ai/webhooks/hubspot", {
        method: "POST",
        headers: {
          "x-hubspot-signature-v3": "some-sig",
          "x-hubspot-request-timestamp": staleTimestamp,
        },
        body: "{}",
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(401);
    });

    it("should route billing webhooks to billing service (no external signature check)", async () => {
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/webhooks/billing/stripe", {
        method: "POST",
        body: '{"type":"invoice.paid"}',
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      // billing webhooks bypass gateway's signature check — delegated to billing service
      expect(res.status).not.toBe(401);
    });

    it("should route signed GitHub webhooks through gateway to ingress with tenant resolution and idempotency", async () => {
      const connectorStatus = createMockKv({ "github:installation:99:tenant": "tenant-github" });
      const webhookLog = createMockKv();
      const pipelineQueue = { send: vi.fn(async () => undefined) };
      const bff = {
        fetch: vi.fn(async () => new Response(JSON.stringify({ delivered: 1 }), { status: 200 })),
      };

      const ingressEnv = {
        BFF: bff,
        CONNECTOR: { fetch: vi.fn(async () => new Response("connector fallback")) },
        PIPELINE_QUEUE: pipelineQueue,
        CONNECTOR_STATUS: connectorStatus,
        WEBHOOK_LOG: webhookLog,
        GITHUB_WEBHOOK_SECRET: "github-secret",
        ENVIRONMENT: "production",
      } as any;

      const env = createMockEnv({
        GITHUB_WEBHOOK_SECRET: "github-secret",
        WEBHOOK_INGRESS: {
          fetch: (request: Request) => fetchViaWebhookIngress(request, ingressEnv),
        },
      });

      const payload = JSON.stringify({
        installation: { id: 99 },
        action: "opened",
        pull_request: { id: 123, number: 42 },
      });
      const headers = {
        "x-github-event": "pull_request",
        "x-github-delivery": "delivery-123",
        "x-hub-signature-256": signWebhook("github-secret", payload, "sha256="),
      };

      const res1 = await gateway.fetch(
        new Request("https://gateway.integratewise.ai/webhooks/github", {
          method: "POST",
          headers,
          body: payload,
        }),
        env,
        createMockCtx()
      );
      expect(res1.status).toBe(200);
      const body1 = (await res1.json()) as any;
      expect(body1.tenantId).toBe("tenant-github");
      expect(body1.success).toBe(true);
      expect(pipelineQueue.send).toHaveBeenCalledTimes(1);

      const res2 = await gateway.fetch(
        new Request("https://gateway.integratewise.ai/webhooks/github", {
          method: "POST",
          headers,
          body: payload,
        }),
        env,
        createMockCtx()
      );
      expect(res2.status).toBe(200);
      const body2 = (await res2.json()) as any;
      expect(body2.duplicate).toBe(true);
      expect(pipelineQueue.send).toHaveBeenCalledTimes(1);
    });

    it("should route signed Salesforce webhooks through gateway to ingress with tenant resolution", async () => {
      const connectorStatus = createMockKv({
        "salesforce:org:sf-org-1:tenant": "tenant-salesforce",
      });
      const pipelineQueue = { send: vi.fn(async () => undefined) };
      const bff = {
        fetch: vi.fn(async () => new Response(JSON.stringify({ delivered: 1 }), { status: 200 })),
      };

      const ingressEnv = {
        BFF: bff,
        CONNECTOR: { fetch: vi.fn(async () => new Response("connector fallback")) },
        PIPELINE_QUEUE: pipelineQueue,
        CONNECTOR_STATUS: connectorStatus,
        WEBHOOK_LOG: createMockKv(),
        SALESFORCE_WEBHOOK_SECRET: "salesforce-secret",
        ENVIRONMENT: "production",
      } as any;

      const env = createMockEnv({
        SALESFORCE_WEBHOOK_SECRET: "salesforce-secret",
        WEBHOOK_INGRESS: {
          fetch: (request: Request) => fetchViaWebhookIngress(request, ingressEnv),
        },
      });

      const payload = JSON.stringify({
        event: { type: "account_update" },
        payload: {
          org_id: "sf-org-1",
          sobject: {
            Id: "001xx000003DHP0",
            attributes: { type: "Account" },
          },
        },
      });

      const res = await gateway.fetch(
        new Request("https://gateway.integratewise.ai/webhooks/salesforce", {
          method: "POST",
          headers: {
            "x-salesforce-signature": signWebhook("salesforce-secret", payload),
          },
          body: payload,
        }),
        env,
        createMockCtx()
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.tenantId).toBe("tenant-salesforce");
      expect(body.success).toBe(true);
      expect(pipelineQueue.send).toHaveBeenCalledTimes(1);
    });

    it("should route custom connector webhook providers to CONNECTOR", async () => {
      const env = createMockEnv();
      const req = new Request("https://gateway.integratewise.ai/webhooks/whatsapp", {
        method: "POST",
        body: '{"message":"hi"}',
      });

      const res = await gateway.fetch(req, env, createMockCtx());

      expect(res.status).toBe(200);
      expect(env.CONNECTOR.fetch).toHaveBeenCalled();
    });
  });
});
