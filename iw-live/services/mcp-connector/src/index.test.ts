import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index";

// Mock Firestore utility
vi.mock("./lib/firestore", () => ({
  updateFirestoreDocument: vi.fn().mockResolvedValue({}),
}));

describe("MCP Connector - Session Memory Capture", () => {
  const MCP_KEY = "test-token";
  const env = {
    MCP_CONNECTOR_API_KEY: MCP_KEY,
    FIRESTORE_PROJECT_ID: "test-project",
    ENVIRONMENT: "test",
  };
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("should return 401 if API key is missing", async () => {
    const res = await app.request(
      "/v1/mcp/save_session_memory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
      env
    );

    expect(res.status).toBe(401);
  });

  it("should return 401 if API key is invalid", async () => {
    const res = await app.request(
      "/v1/mcp/save_session_memory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-key",
        },
        body: JSON.stringify({}),
      },
      env
    );

    expect(res.status).toBe(401);
  });

  it("should return 400 if payload is invalid", async () => {
    const res = await app.request(
      "/v1/mcp/save_session_memory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MCP_KEY}`,
        },
        body: JSON.stringify({
          tenant_id: "tenant-1",
          // missing session_id, tool_source, etc.
        }),
      },
      env
    );

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toBe("validation_failed");
  });

  it("should return 200 and store memories if payload is valid", async () => {
    const payload = {
      tenant_id: "tenant-123",
      session_id: "session-456",
      tool_source: "claude",
      summary: "Discussed project architecture.",
      memories: [
        {
          memory_type: "decision",
          text: "Use Cloudflare Workers for all edge services.",
        },
      ],
    };

    const res = await app.request(
      "/v1/mcp/save_session_memory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MCP_KEY}`,
        },
        body: JSON.stringify(payload),
      },
      env
    );

    expect(res.status).toBe(200);
    const result: any = await res.json();
    expect(result.status).toBe("success");
    expect(result.stored_memories).toBe(1);
    expect(result.tenant_id).toBe("tenant-123");
    expect(result.session_id).toBe("session-456");
  });

  it("should enforce memory limit (max 50)", async () => {
    const manyMemories = Array.from({ length: 51 }, (_, i) => ({
      memory_type: "note",
      text: `Note ${i}`,
    }));

    const res = await app.request(
      "/v1/mcp/save_session_memory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MCP_KEY}`,
        },
        body: JSON.stringify({
          tenant_id: "t1",
          session_id: "s1",
          tool_source: "test",
          summary: "too many",
          memories: manyMemories,
        }),
      },
      env
    );

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toBe("validation_failed");
  });

  it("should honor approved-only Flow C policy for kb.list_recent via MCP invoke", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("/rest/v1/tenant_spine_config")) {
        return new Response(
          JSON.stringify([
            {
              depth_matrix_snapshot: { limit_flow_c_to_approved_memory: true },
            },
          ]),
          { status: 200 }
        );
      }
      return new Response("not-found", { status: 404 });
    }) as any;

    const knowledgeFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      expect(url).toContain("/v1/knowledge/memories");
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "memory-1",
              type: "decision",
              summary: "Approved risk decision",
              content: "Approved risk decision",
              tags: ["risk", "approved"],
              created_at: "2026-03-16T00:00:00.000Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const res = await app.request(
      "/invoke",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MCP-Key": MCP_KEY,
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-123",
        },
        body: JSON.stringify({
          request_id: "req-list-recent",
          actor: {
            tenant_id: "tenant-123",
            user_id: "user-123",
            roles: ["Admin"],
          },
          tool: {
            name: "kb.list_recent",
            arguments: {
              tenant_id: "tenant-123",
              limit: 5,
            },
          },
        }),
      },
      {
        ...env,
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "test-role-key",
        KNOWLEDGE: { fetch: knowledgeFetch },
      } as any
    );

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status).toBe("ok");
    expect(body.result.items).toEqual([
      expect.objectContaining({
        artifact_id: "memory-1",
        topics: ["risk", "approved"],
      }),
    ]);
    expect(knowledgeFetch).toHaveBeenCalledTimes(1);
  });

  it("should honor approved-only Flow C policy for kb.search via MCP invoke", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("/rest/v1/tenant_spine_config")) {
        return new Response(
          JSON.stringify([
            {
              depth_matrix_snapshot: { flow_c_approved_only: true },
            },
          ]),
          { status: 200 }
        );
      }
      return new Response("not-found", { status: 404 });
    }) as any;

    const knowledgeFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      expect(url).toContain("/v1/knowledge/memories");
      expect(url).toContain("q=risk");
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "memory-2",
              type: "insight",
              summary: "Risk flagged",
              content: "Risk flagged for account",
              tags: ["risk"],
              created_at: "2026-03-16T01:00:00.000Z",
              confidence: 0.88,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const res = await app.request(
      "/invoke",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MCP_KEY}`,
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-123",
        },
        body: JSON.stringify({
          request_id: "req-search",
          actor: {
            tenant_id: "tenant-123",
            user_id: "user-123",
            roles: ["Admin"],
          },
          tool: {
            name: "kb.search",
            arguments: {
              tenant_id: "tenant-123",
              q: "risk",
              limit: 5,
            },
          },
        }),
      },
      {
        ...env,
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "test-role-key",
        KNOWLEDGE: { fetch: knowledgeFetch },
      } as any
    );

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.status).toBe("ok");
    expect(body.result.results).toEqual([
      expect.objectContaining({
        artifact_id: "memory-2",
        snippet: "Risk flagged for account",
        score: 0.88,
      }),
    ]);
    expect(knowledgeFetch).toHaveBeenCalledTimes(1);
  });
});
