/**
 * IntegrateWise L2 Cognitive Layer - Test Suite
 *
 * Tests for insights retrieval (KV + demo fallback + dismiss filtering),
 * recommendations (KV + demo seed + status filtering),
 * decisions (KV update with actor/timestamp),
 * events (dismiss handling), and health check.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "./index";

// =============================================================================
// HELPERS
// =============================================================================

function createKvMock(store: Record<string, string> = {}) {
  return {
    get: vi.fn((key: string) => Promise.resolve(store[key] || null)),
    put: vi.fn((key: string, val: string) => {
      store[key] = val;
      return Promise.resolve();
    }),
    delete: vi.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    list: vi.fn((opts?: { prefix?: string }) => {
      const prefix = opts?.prefix || "";
      const keys = Object.keys(store)
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }));
      return Promise.resolve({ keys, list_complete: true, cacheStatus: null });
    }),
  };
}

function env(kvStore?: Record<string, string>) {
  return {
    L2_INSIGHTS: createKvMock(kvStore || {}),
  } as any;
}

function envNoKv() {
  return {} as any;
}

// =============================================================================
// TESTS
// =============================================================================

describe("L2 Cognitive Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Health ─────────────────────────────────────────────
  describe("Health check", () => {
    it("should return ok", async () => {
      const res = await app.request("/health", {}, env());
      const body = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(body.status).toBe("ok");
      expect(body.service).toBe("l2");
    });
  });

  // ─── Insights ───────────────────────────────────────────
  describe("GET /api/v1/l2/insights", () => {
    it("should return KV-stored insights when available", async () => {
      const storedInsights = [
        {
          id: "ins-1",
          title: "Test insight",
          body: "Details",
          createdAt: new Date().toISOString(),
        },
      ];
      const e = env({ "insights:user-1:work-dashboard": JSON.stringify(storedInsights) });

      const res = await app.request(
        "/api/v1/l2/insights?userId=user-1&viewId=work-dashboard",
        {},
        e
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("ins-1");
    });

    it("should return demo insight for personal-today", async () => {
      const res = await app.request(
        "/api/v1/l2/insights?userId=user-1&viewId=personal-today",
        {},
        envNoKv()
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("demo-personal-today-1");
      expect(body[0].title).toContain("high-priority");
    });

    it("should return empty array for unknown views", async () => {
      const res = await app.request(
        "/api/v1/l2/insights?userId=user-1&viewId=unknown",
        {},
        envNoKv()
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body).toEqual([]);
    });

    it("should return empty when KV holds invalid JSON", async () => {
      const e = env({ "insights:user-1:view-1": "not-valid-json" });

      const res = await app.request("/api/v1/l2/insights?userId=user-1&viewId=view-1", {}, e);

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body).toEqual([]);
    });

    it("should filter out dismissed insights", async () => {
      const insights = [
        { id: "ins-1", title: "Keep", body: "b", createdAt: new Date().toISOString() },
        { id: "ins-2", title: "Dismissed", body: "b", createdAt: new Date().toISOString() },
      ];
      const e = env({
        "insights:user-1:view-1": JSON.stringify(insights),
        "dismissed:user-1": JSON.stringify(["ins-2"]),
      });

      const res = await app.request("/api/v1/l2/insights?userId=user-1&viewId=view-1", {}, e);

      const body = (await res.json()) as any;
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("ins-1");
    });
  });

  // ─── Recommendations ───────────────────────────────────
  describe("GET /api/v1/l2/recommendations", () => {
    it("should return empty recommendations when no KV data", async () => {
      const res = await app.request("/api/v1/l2/recommendations", {}, envNoKv());

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      // No KV data = empty array (real data comes from Spine)
      expect(body).toEqual([]);
    });

    it("should filter demo recs by status", async () => {
      const res = await app.request("/api/v1/l2/recommendations?status=approved", {}, envNoKv());

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      // Demo recs are all "pending", so filtering by "approved" returns empty
      expect(body).toEqual([]);
    });

    it("should return KV-stored recommendations when available", async () => {
      const recs = [
        {
          id: "rec-1",
          title: "Custom rec",
          description: "d",
          evidenceRefs: [],
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        {
          id: "rec-2",
          title: "Approved rec",
          description: "d",
          evidenceRefs: [],
          status: "approved",
          createdAt: new Date().toISOString(),
        },
      ];
      const e = env({ "recs:user-1:view-1": JSON.stringify(recs) });

      const res = await app.request(
        "/api/v1/l2/recommendations?userId=user-1&viewId=view-1",
        {},
        e
      );

      const body = (await res.json()) as any;
      expect(body).toHaveLength(2);
    });

    it("should filter KV recs by status", async () => {
      const recs = [
        {
          id: "rec-1",
          status: "pending",
          title: "t",
          description: "d",
          evidenceRefs: [],
          createdAt: "",
        },
        {
          id: "rec-2",
          status: "approved",
          title: "t",
          description: "d",
          evidenceRefs: [],
          createdAt: "",
        },
        {
          id: "rec-3",
          status: "rejected",
          title: "t",
          description: "d",
          evidenceRefs: [],
          createdAt: "",
        },
      ];
      const e = env({ "recs:user-1:view-1": JSON.stringify(recs) });

      const res = await app.request(
        "/api/v1/l2/recommendations?userId=user-1&viewId=view-1&status=approved,rejected",
        {},
        e
      );

      const body = (await res.json()) as any;
      expect(body).toHaveLength(2);
      expect(body.map((r: any) => r.status)).toEqual(["approved", "rejected"]);
    });

    it("should respect limit", async () => {
      // Create KV data with multiple recommendations
      const recs = [
        {
          id: "rec-1",
          title: "Rec 1",
          description: "d",
          evidenceRefs: [],
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        {
          id: "rec-2",
          title: "Rec 2",
          description: "d",
          evidenceRefs: [],
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ];
      const e = env({ "recs:user-1:view-1": JSON.stringify(recs) });

      const res = await app.request(
        "/api/v1/l2/recommendations?userId=user-1&viewId=view-1&limit=1",
        {},
        e
      );

      const body = (await res.json()) as any;
      expect(body).toHaveLength(1);
    });
  });

  // ─── Decisions ──────────────────────────────────────────
  describe("POST /api/v1/l2/recommendations/:id/decision", () => {
    it("should reject invalid decision value", async () => {
      const res = await app.request(
        "/api/v1/l2/recommendations/rec-1/decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "maybe" }),
        },
        env()
      );

      expect(res.status).toBe(400);
    });

    it("should update recommendation status in KV", async () => {
      const recs = [
        {
          id: "rec-1",
          status: "pending",
          title: "t",
          description: "d",
          evidenceRefs: [],
          createdAt: "",
        },
      ];
      const store = { "recs:user-1:view-1": JSON.stringify(recs) };
      const e = env(store);

      const res = await app.request(
        "/api/v1/l2/recommendations/rec-1/decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "approve", reason: "Looks good", actor: "user-1" }),
        },
        e
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.status).toBe("approved");
      expect(body.decidedBy).toBe("user-1");
      expect(body.reason).toBe("Looks good");
      expect(body.decidedAt).toBeDefined();
    });

    it("should return 204 when rec not found in KV", async () => {
      const res = await app.request(
        "/api/v1/l2/recommendations/nonexistent/decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "reject", actor: "user-1" }),
        },
        env()
      );

      expect(res.status).toBe(204);
    });
  });

  // ─── Events ─────────────────────────────────────────────
  describe("POST /api/v1/l2/events", () => {
    it("should return 204 on events", async () => {
      const res = await app.request(
        "/api/v1/l2/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "connector", source: "hubspot", payload: {} }),
        },
        env()
      );

      expect(res.status).toBe(204);
    });

    it("should add dismissed insight to KV", async () => {
      const store: Record<string, string> = {};
      const e = env(store);

      await app.request(
        "/api/v1/l2/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "user_action",
            source: "workspace",
            payload: { action: "dismiss", insightId: "ins-1", userId: "user-1" },
          }),
        },
        e
      );

      // Verify KV was written
      expect(e.L2_INSIGHTS.put).toHaveBeenCalled();
      const putCall = e.L2_INSIGHTS.put.mock.calls[0];
      expect(putCall[0]).toBe("dismissed:user-1");
      expect(JSON.parse(putCall[1])).toContain("ins-1");
    });

    it("should not duplicate dismissed IDs", async () => {
      const store = { "dismissed:user-1": JSON.stringify(["ins-1"]) };
      const e = env(store);

      await app.request(
        "/api/v1/l2/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "user_action",
            source: "workspace",
            payload: { action: "dismiss", insightId: "ins-1", userId: "user-1" },
          }),
        },
        e
      );

      // Should not have called put since ins-1 is already dismissed
      expect(e.L2_INSIGHTS.put).not.toHaveBeenCalled();
    });
  });
});
