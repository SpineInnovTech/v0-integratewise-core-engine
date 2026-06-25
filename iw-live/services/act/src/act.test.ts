/**
 * IntegrateWise Act Service - Test Suite
 *
 * Tests for action execution, governance checks, audit logging,
 * and proposal retrieval.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "./index";

// =============================================================================
// HELPERS
// =============================================================================

function env(overrides: Record<string, unknown> = {}) {
  return {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_KEY: "test-key",
    DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn(() => Promise.resolve({ success: true })),
        })),
      })),
    },
    GOVERN: {
      fetch: vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: { allowed: true } }), {
            status: 200,
          })
        )
      ),
    },
    THINK: { fetch: vi.fn() },
    STORE: { fetch: vi.fn() },
    CONNECTOR: { fetch: vi.fn() },
    PIPELINE: { fetch: vi.fn() },
    ENVIRONMENT: "test",
    SERVICE_SECRET: "test-secret",
    ...overrides,
  } as any;
}

function mockFetch(responses: Record<string, unknown>) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    for (const [key, val] of Object.entries(responses)) {
      if (url.includes(key)) {
        return new Response(JSON.stringify(val), { status: 200 });
      }
    }
    return new Response("Not found", { status: 404 });
  }) as any;
}

// =============================================================================
// TESTS
// =============================================================================

describe("Act Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Health check", () => {
    it("should return operational status", async () => {
      const res = await app.request("/health", {}, env());
      const body = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(body.service).toContain("Act");
      expect(body.status).toBe("operational");
    });
  });

  describe("POST /execute", () => {
    it("should reject requests without x-tenant-id", async () => {
      const res = await app.request(
        "/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action_proposal_id: "p-1" }),
        },
        env()
      );

      expect(res.status).toBe(400);
    });

    it("should return 404 when proposal not found", async () => {
      mockFetch({ action_proposals: [] });
      const res = await app.request(
        "/execute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": "tenant-1",
          },
          body: JSON.stringify({ action_proposal_id: "nonexistent" }),
        },
        env()
      );

      expect(res.status).toBe(404);
    });

    it("should fail-safe when governance is unavailable", async () => {
      const proposal = {
        id: "p-1",
        action_type: "send_email",
        priority: "medium",
        parameters: "{}",
      };
      mockFetch({ action_proposals: [proposal] });

      const res = await app.request(
        "/execute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": "tenant-1",
          },
          body: JSON.stringify({ action_proposal_id: "p-1" }),
        },
        env({ GOVERN: undefined })
      );

      expect(res.status).toBe(503);
    });

    it("should deny when governance rejects", async () => {
      const proposal = {
        id: "p-1",
        action_type: "send_email",
        priority: "medium",
        parameters: "{}",
      };
      mockFetch({ action_proposals: [proposal] });
      const e = env({
        GOVERN: {
          fetch: vi.fn(() =>
            Promise.resolve(
              new Response(JSON.stringify({ data: { allowed: false, reason: "Policy violation" } }))
            )
          ),
        },
      });

      const res = await app.request(
        "/execute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": "tenant-1",
          },
          body: JSON.stringify({ action_proposal_id: "p-1" }),
        },
        e
      );

      expect(res.status).toBe(403);
    });

    it("should execute when governance allows", async () => {
      const proposal = {
        id: "p-1",
        action_type: "send_email",
        priority: "medium",
        parameters: "{}",
      };
      mockFetch({ action_proposals: [proposal] });

      const res = await app.request(
        "/execute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": "tenant-1",
          },
          body: JSON.stringify({ action_proposal_id: "p-1" }),
        },
        env()
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.run_id).toBeDefined();
    });
  });

  describe("GET /proposals/:situation_id", () => {
    it("should return proposals for a situation", async () => {
      const proposals = [{ id: "p-1", situation_id: "sit-1" }];
      mockFetch({ action_proposals: proposals });

      const res = await app.request("/proposals/sit-1", {}, env());

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
    });
  });
});
