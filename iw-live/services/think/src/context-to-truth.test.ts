import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
beforeEach(() => {
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
});

describe("Context-to-Truth Endpoint", () => {
  const baseEnv = {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_KEY: "test-key",
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        first: vi.fn().mockResolvedValue(null),
      }),
    },
    KNOWLEDGE: null,
    GOVERN: null,
    ACT: null,
    ENVIRONMENT: "test",
    OPENROUTER_API_KEY: "test-api-key",
    CONNECTOR: {
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    },
  };

  function makeRequest(body: any, headers: Record<string, string> = {}) {
    return new Request("http://localhost/v1/cognitive/context-to-truth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "tenant-123",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  it("should require x-tenant-id header", async () => {
    const cogBrain = await import("./cognitive-brain");
    const app = cogBrain.default;

    const req = new Request("http://localhost/v1/cognitive/context-to-truth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });

    const res = await app.fetch(req, baseEnv);
    expect(res.status).toBe(400);
  });

  it("should validate the request body schema", async () => {
    const cogBrain = await import("./cognitive-brain");
    const app = cogBrain.default;

    const req = makeRequest({ invalid: true });
    const res = await app.fetch(req, baseEnv);
    expect(res.status).toBe(400);
  });

  it("should process messages and return extracted data", async () => {
    const cogBrain = await import("./cognitive-brain");
    const app = cogBrain.default;

    // Mock AI response with extracted data
    mockFetch.mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("openrouter.ai")) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    entities: [
                      {
                        type: "contact",
                        name: "John Doe",
                        properties: { email: "john@example.com" },
                      },
                    ],
                    signals: [
                      {
                        type: "opportunity",
                        severity: "medium",
                        title: "New lead identified",
                        description: "Potential deal",
                      },
                    ],
                    recommendations: [
                      { action: "Schedule call", reasoning: "Hot lead", priority: "high" },
                    ],
                    summary: "Discussed a potential deal with John Doe.",
                  }),
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      // Supabase writes
      return new Response("{}", { status: 201 });
    });

    const req = makeRequest({
      messages: [
        { role: "user", content: "Tell me about the deal with John Doe" },
        {
          role: "assistant",
          content: "John Doe is a contact at Acme Corp with a potential $50k deal",
        },
      ],
      context: { domain: "SALES", entity_type: "deal" },
    });

    const res = await app.fetch(req, baseEnv);
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.extracted.entities).toHaveLength(1);
    expect(body.extracted.signals).toHaveLength(1);
    expect(body.extracted.recommendations).toHaveLength(1);
    expect(body.extracted.summary).toBeTruthy();
    expect(body).toHaveProperty("session_id");
    expect(body).toHaveProperty("correlation_id");
  });

  it("should use fallback extraction when AI fails", async () => {
    const cogBrain = await import("./cognitive-brain");
    const app = cogBrain.default;

    // Mock AI failure
    mockFetch.mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("openrouter.ai")) {
        return new Response("Server Error", { status: 500 });
      }
      return new Response("{}", { status: 201 });
    });

    const req = makeRequest({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ],
    });

    const res = await app.fetch(req, baseEnv);
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.extracted.signals).toHaveLength(1);
    expect(body.extracted.signals[0].type).toBe("session_insight");
  });

  it("should write audit trail entry", async () => {
    const cogBrain = await import("./cognitive-brain");
    const app = cogBrain.default;

    const auditCalls: string[] = [];
    mockFetch.mockImplementation(async (url: string) => {
      const urlStr = typeof url === "string" ? url : (url as any)?.url || "";
      if (urlStr.includes("openrouter.ai")) {
        return new Response("Error", { status: 500 });
      }
      if (urlStr.includes("audit_log")) {
        auditCalls.push("audit");
      }
      return new Response("{}", { status: 201 });
    });

    const req = makeRequest({
      messages: [{ role: "user", content: "Test" }],
    });

    await app.fetch(req, baseEnv);
    expect(auditCalls.length).toBeGreaterThanOrEqual(1);
  });
});
