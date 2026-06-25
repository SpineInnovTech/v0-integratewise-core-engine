import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock D1 database
function createMockD1() {
  const results: any[] = [];
  const mockStmt = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue({ results }),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
  return {
    prepare: vi.fn().mockReturnValue(mockStmt),
    batch: vi.fn().mockResolvedValue([]),
    _stmt: mockStmt,
    _results: results,
  };
}

function createMockEnv(db: any) {
  return {
    ANALYTICS_DB: db,
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
  };
}

// Mock fetch for JWT validation
const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Analytics Endpoints", () => {
  describe("POST /analytics/conversion", () => {
    it("should reject requests without x-tenant-id", async () => {
      const { analytics } = await import("./analytics");
      const env = createMockEnv(createMockD1());

      const req = new Request("http://localhost/conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ event_type: "signup" }),
      });

      const res = await analytics.fetch(req, env);
      expect(res.status).toBe(400);
    });

    it("should reject requests without Authorization", async () => {
      const { analytics } = await import("./analytics");
      const env = createMockEnv(createMockD1());

      const req = new Request("http://localhost/conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "tenant-123",
        },
        body: JSON.stringify({ event_type: "signup" }),
      });

      const res = await analytics.fetch(req, env);
      expect(res.status).toBe(401);
    });

    it("should insert conversion events", async () => {
      const { analytics } = await import("./analytics");
      const db = createMockD1();
      const env = createMockEnv(db);

      const req = new Request("http://localhost/conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "tenant-123",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          event_type: "signup",
          page_url: "/pricing",
          visitor_id: "v-001",
        }),
      });

      const res = await analytics.fetch(req, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.inserted).toBe(1);
      expect(db.batch).toHaveBeenCalled();
    });

    it("should handle batch conversion events", async () => {
      const { analytics } = await import("./analytics");
      const db = createMockD1();
      const env = createMockEnv(db);

      const events = [
        { event_type: "page_view", page_url: "/" },
        { event_type: "cta_click", page_url: "/pricing" },
        { event_type: "signup", page_url: "/signup" },
      ];

      const req = new Request("http://localhost/conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "tenant-123",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify(events),
      });

      const res = await analytics.fetch(req, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.inserted).toBe(3);
    });
  });

  describe("POST /analytics/performance", () => {
    it("should insert Web Vitals metrics", async () => {
      const { analytics } = await import("./analytics");
      const db = createMockD1();
      const env = createMockEnv(db);

      const req = new Request("http://localhost/performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "tenant-123",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          session_id: "s-001",
          url: "/app/dashboard",
          cls: 0.05,
          fid: 12,
          lcp: 1800,
          fcp: 900,
          ttfb: 200,
          inp: 50,
          isMobile: true,
        }),
      });

      const res = await analytics.fetch(req, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
    });
  });

  describe("GET /analytics/dashboard", () => {
    it("should return aggregated metrics", async () => {
      const { analytics } = await import("./analytics");
      const db = createMockD1();
      const env = createMockEnv(db);

      const req = new Request("http://localhost/dashboard?range=7d", {
        headers: {
          "x-tenant-id": "tenant-123",
          Authorization: "Bearer valid-token",
        },
      });

      const res = await analytics.fetch(req, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.range).toBe("7d");
      expect(body).toHaveProperty("conversion");
      expect(body).toHaveProperty("performance");
      expect(body).toHaveProperty("aggregates");
    });
  });

  describe("GET /analytics/funnels", () => {
    it("should return funnel metrics", async () => {
      const { analytics } = await import("./analytics");
      const db = createMockD1();
      const env = createMockEnv(db);

      const req = new Request("http://localhost/funnels", {
        headers: {
          "x-tenant-id": "tenant-123",
          Authorization: "Bearer valid-token",
        },
      });

      const res = await analytics.fetch(req, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body).toHaveProperty("funnels");
      expect(body).toHaveProperty("step_events");
    });
  });

  describe("GET /analytics/tests", () => {
    it("should return A/B test results", async () => {
      const { analytics } = await import("./analytics");
      const db = createMockD1();
      const env = createMockEnv(db);

      const req = new Request("http://localhost/tests", {
        headers: {
          "x-tenant-id": "tenant-123",
          Authorization: "Bearer valid-token",
        },
      });

      const res = await analytics.fetch(req, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body).toHaveProperty("tests");
    });
  });
});

describe("Daily Aggregation", () => {
  it("should run without errors on empty data", async () => {
    const { runDailyAggregation } = await import("./analytics");
    const db = createMockD1();

    const result = await runDailyAggregation(db as any);
    expect(result).toHaveProperty("aggregated");
    expect(result.aggregated).toBe(0);
  });
});
