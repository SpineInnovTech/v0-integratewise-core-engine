import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "./index";
import { signJWT } from "../../gateway/src/lib/jwt";

function createOAuthEnv(overrides: Record<string, unknown> = {}) {
  const store = new Map<string, string>();
  return {
    ENVIRONMENT: "test",
    MCP_OAUTH_REQUIRED: "true",
    OAUTH_ISSUER: "https://auth.integratewise.ai",
    OAUTH_RESOURCE: "https://mcp.integratewise.ai",
    MCP_CONNECTOR_API_KEY: "test-mcp-key",
    MCP_IDEMPOTENCY: {
      get: vi.fn(async (key: string) => store.get(key) || null),
      put: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      delete: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      _store: store,
    },
    KNOWLEDGE: { fetch: vi.fn() },
    ...overrides,
  } as any;
}

describe("MCP Connector - OAuth Resource Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns protected resource metadata", async () => {
    const res = await app.request(
      "https://mcp.integratewise.ai/.well-known/oauth-protected-resource",
      { method: "GET" },
      createOAuthEnv()
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.resource).toBe("https://mcp.integratewise.ai");
    expect(body.authorization_servers[0]).toBe("https://auth.integratewise.ai");
    expect(body.scopes_supported).toContain("mcp:tools");
  });

  it("returns authorization server metadata", async () => {
    const res = await app.request(
      "https://auth.integratewise.ai/.well-known/oauth-authorization-server",
      { method: "GET" },
      createOAuthEnv()
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.issuer).toBe("https://auth.integratewise.ai");
    expect(body.token_endpoint).toBe("https://auth.integratewise.ai/oauth/token");
  });

  it("returns 401 with WWW-Authenticate when /tools has no token", async () => {
    const res = await app.request(
      "https://mcp.integratewise.ai/tools",
      { method: "GET" },
      createOAuthEnv()
    );

    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("resource_metadata=");
    expect(res.headers.get("WWW-Authenticate")).toContain("oauth-protected-resource");
  });

  it("allows /tools with a valid OAuth JWT", async () => {
    const token = await signJWT({
      iss: "https://auth.integratewise.ai",
      aud: "https://mcp.integratewise.ai",
      sub: "cursor-mcp",
      tenant_id: "integratewise",
      role: "Member",
      scope: "mcp:tools",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await app.request(
      "https://mcp.integratewise.ai/tools",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
      createOAuthEnv()
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.tools?.length).toBeGreaterThan(0);
  });

  it("exchanges authorization code for access token", async () => {
    const env = createOAuthEnv();
    const code = "code_test_oauth";
    await env.MCP_IDEMPOTENCY.put(
      `oauth_code:${code}`,
      JSON.stringify({
        tenant_id: "integratewise",
        scope: "mcp:tools",
        expires_at: Date.now() + 600000,
      })
    );

    const res = await app.request(
      "https://auth.integratewise.ai/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=http://127.0.0.1/callback`,
      },
      env
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.access_token).toBeDefined();
    expect(body.token_type).toBe("Bearer");
  });

  it("issues client_credentials tokens", async () => {
    const res = await app.request(
      "https://auth.integratewise.ai/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-tenant-id": "integratewise",
        },
        body: "grant_type=client_credentials&scope=mcp:tools",
      },
      createOAuthEnv()
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.access_token).toBeDefined();
  });
});
