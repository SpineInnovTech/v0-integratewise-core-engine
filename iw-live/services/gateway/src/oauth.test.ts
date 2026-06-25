import { describe, it, expect, vi, beforeEach } from "vitest";
import gateway from "./index";
import { signJWT, verifyJWT, PUBLIC_JWK } from "./lib/jwt";

function createMockEnv(overrides: Record<string, unknown> = {}) {
  const store = new Map<string, string>();
  return {
    CONNECTOR: {
      fetch: vi.fn(() => new Response(JSON.stringify({ status: "ok" }), { status: 200 })),
    },
    RATE_LIMITS: {
      get: vi.fn(() => Promise.resolve("0")),
      put: vi.fn(() => Promise.resolve()),
    },
    SESSIONS: {
      get: vi.fn(async (key: string) => store.get(key) || null),
      put: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      delete: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      _store: store,
    },
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-role-key",
    ALLOWED_ORIGINS: "https://integratewise.ai",
    ...overrides,
  } as any;
}

function createMockCtx(): ExecutionContext {
  return { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any;
}

describe("Gateway - OAuth & MCP Resource Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Authorization Server Metadata
  describe("OAuth Authorization Server Metadata", () => {
    it("should return correct OAuth metadata", async () => {
      const env = createMockEnv();
      const req = new Request(
        "https://auth.integratewise.ai/.well-known/oauth-authorization-server"
      );

      const res = await gateway.fetch(req, env, createMockCtx());
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/json");

      const body = (await res.json()) as any;
      expect(body.issuer).toBe("https://auth.integratewise.ai");
      expect(body.token_endpoint).toBe("https://auth.integratewise.ai/oauth/token");
      expect(body.jwks_uri).toBe("https://auth.integratewise.ai/.well-known/jwks.json");
    });

    it("should return JWKS containing the public key", async () => {
      const env = createMockEnv();
      const req = new Request("https://auth.integratewise.ai/.well-known/jwks.json");

      const res = await gateway.fetch(req, env, createMockCtx());
      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.keys).toBeDefined();
      expect(body.keys[0].kid).toBe(PUBLIC_JWK.kid);
      expect(body.keys[0].alg).toBe("RS256");
    });
  });

  // 2. Authorize Consent UI
  describe("OAuth Consent UI", () => {
    it("should render authorize consent page", async () => {
      const env = createMockEnv();
      const req = new Request(
        "https://auth.integratewise.ai/oauth/authorize?response_type=code&client_id=test-client&redirect_uri=https://client.com/callback&scope=mcp:tools&state=abc"
      );

      const res = await gateway.fetch(req, env, createMockCtx());
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");

      const html = await res.text();
      expect(html).toContain("Authorize MCP Connection");
      expect(html).toContain("iw-customer-zero");
    });
  });

  // 3. Confirm Consent & Code Generation
  describe("OAuth Consent Confirm", () => {
    it("should generate a code and redirect back", async () => {
      const env = createMockEnv();
      const formData = new FormData();
      formData.append("redirect_uri", "https://client.com/callback");
      formData.append("state", "xyz");
      formData.append("tenant_id", "tenant-test-999");
      formData.append("scope", "mcp:tools mcp:resources");

      const req = new Request("https://auth.integratewise.ai/oauth/authorize/confirm", {
        method: "POST",
        body: formData,
      });

      const res = await gateway.fetch(req, env, createMockCtx());
      expect(res.status).toBe(302);

      const location = res.headers.get("Location");
      expect(location).toBeDefined();
      const locUrl = new URL(location!);
      expect(locUrl.searchParams.get("code")).toContain("code_");
      expect(locUrl.searchParams.get("state")).toBe("xyz");

      // Verify code stored in sessions KV
      const code = locUrl.searchParams.get("code")!;
      const stored = await env.SESSIONS.get(`oauth_code:${code}`);
      expect(stored).toBeDefined();
      const codeData = JSON.parse(stored!);
      expect(codeData.tenant_id).toBe("tenant-test-999");
      expect(codeData.scope).toBe("mcp:tools mcp:resources");
    });
  });

  // 4. Token Exchange & JWT Signature
  describe("OAuth Token Exchange", () => {
    it("should exchange code for signed RS256 token", async () => {
      const env = createMockEnv();

      // Seed a code in the session store
      const code = "code_test_123";
      await env.SESSIONS.put(
        `oauth_code:${code}`,
        JSON.stringify({
          tenant_id: "tenant-test-999",
          scope: "mcp:tools",
          expires_at: Date.now() + 600000,
        })
      );

      const req = new Request("https://auth.integratewise.ai/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=https://client.com/callback`,
      });

      const res = await gateway.fetch(req, env, createMockCtx());
      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.access_token).toBeDefined();
      expect(body.token_type).toBe("Bearer");
      expect(body.expires_in).toBe(3600);

      // Verify token is a valid signed JWT with our expected payload
      const verifyResult = await verifyJWT(body.access_token);
      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.payload?.tenant_id).toBe("tenant-test-999");
      expect(verifyResult.payload?.iss).toBe("https://auth.integratewise.ai");
      expect(verifyResult.payload?.aud).toBe("https://mcp.integratewise.ai");
    });
  });

  // 5. Protected Resource Metadata
  describe("MCP Protected Resource Metadata", () => {
    it("should return protected resource metadata", async () => {
      const env = createMockEnv();
      const req = new Request("https://mcp.integratewise.ai/.well-known/oauth-protected-resource");

      const res = await gateway.fetch(req, env, createMockCtx());
      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.resource).toBe("https://mcp.integratewise.ai");
      expect(body.authorization_servers[0]).toBe("https://auth.integratewise.ai");
    });
  });

  // 6. Access Controls on Protected Endpoints
  describe("Protected MCP Endpoints Access Control", () => {
    it("should return 401 challenge when token is missing", async () => {
      const env = createMockEnv();
      const req = new Request("https://mcp.integratewise.ai/tools");

      const res = await gateway.fetch(req, env, createMockCtx());
      expect(res.status).toBe(401);
      expect(res.headers.get("WWW-Authenticate")).toBe(
        'Bearer resource_metadata="https://mcp.integratewise.ai/.well-known/oauth-protected-resource"'
      );
    });

    it("should return 401 challenge when token is invalid", async () => {
      const env = createMockEnv();
      const req = new Request("https://mcp.integratewise.ai/tools", {
        headers: { Authorization: "Bearer invalid-token-str" },
      });

      const res = await gateway.fetch(req, env, createMockCtx());
      expect(res.status).toBe(401);
      expect(res.headers.get("WWW-Authenticate")).toContain("error=");
    });

    it("should forward to connector when token is valid", async () => {
      const env = createMockEnv();

      // Generate a valid signed token
      const token = await signJWT({
        iss: "https://auth.integratewise.ai",
        aud: "https://mcp.integratewise.ai",
        sub: "mcp-client",
        tenant_id: "tenant-test-101",
        role: "Member",
        scope: "mcp:tools",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const req = new Request("https://mcp.integratewise.ai/tools", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await gateway.fetch(req, env, createMockCtx());
      expect(res.status).toBe(200);
      expect(env.CONNECTOR.fetch).toHaveBeenCalledTimes(1);

      // Verify headers forwarded to connector
      const forwardedReq = env.CONNECTOR.fetch.mock.calls[0][0] as Request;
      expect(forwardedReq.headers.get("x-tenant-id")).toBe("tenant-test-101");
      expect(forwardedReq.headers.get("x-user-id")).toBe("mcp-client");
      expect(forwardedReq.headers.get("cf-worker")).toBe("integratewise-gateway");
    });
  });
});
