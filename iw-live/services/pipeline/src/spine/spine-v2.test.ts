/**
 * IntegrateWise Spine v2 Service - Test Suite
 *
 * Tests for entity upsert, read, signals, dashboard stats,
 * cache invalidation, and tenant scoping.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// =============================================================================
// MOCKS
// =============================================================================

const mockSupabaseFrom = vi.fn();
const mockSupabaseClient = {
  from: mockSupabaseFrom,
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

import spineWorker from "./index";

// =============================================================================
// HELPERS
// =============================================================================

function createMockEnv() {
  // D1 (CACHE_DB) mock — under DECISION 22 the Spine reads/writes Cloudflare D1
  // (the legacy SQL store is retired). A prepared statement supports chained
  // bind() then run/first/all.
  const makeStmt = () => {
    const stmt: any = {
      bind: vi.fn(() => stmt),
      first: vi.fn(() => Promise.resolve({ total: 0 })),
      all: vi.fn(() => Promise.resolve({ results: [] })),
      run: vi.fn(() => Promise.resolve({ success: true })),
    };
    return stmt;
  };
  return {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
    CACHE_DB: {
      prepare: vi.fn(() => makeStmt()),
    },
    CACHE: {
      get: vi.fn(() => Promise.resolve(null)),
      put: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
    },
  };
}

// Chainable mock builder for Supabase query builder
function chainMock(
  result: { data?: any; error?: any; count?: number } = { data: [], error: null }
) {
  const chain: any = {};
  const methods = [
    "select",
    "insert",
    "upsert",
    "update",
    "delete",
    "eq",
    "order",
    "range",
    "limit",
    "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // Terminal — return result
  chain.select = vi.fn(() => {
    chain._result = result;
    return chain;
  });
  chain.upsert = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  // Make thenable for await
  chain.then = (resolve: (v: any) => void) => resolve(result);
  return chain;
}

// =============================================================================
// TESTS
// =============================================================================

describe("Spine v2 Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Health check", () => {
    it("should return ok", async () => {
      const req = new Request("http://spine/health");
      const res = await spineWorker.fetch(req, createMockEnv() as any);
      const body = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(body.status).toBe("ok");
      expect(body.service).toBe("spine-v2");
    });
  });

  describe("POST /api/write", () => {
    it("should upsert entities and invalidate cache", async () => {
      const entityChain = chainMock({ data: [{ account_id: "e-1" }], error: null });
      const auditChain = chainMock({ data: null, error: null });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "account") return entityChain;
        if (table === "audit_log") return auditChain;
        return chainMock();
      });

      const env = createMockEnv();

      const req = new Request("http://spine/api/write", {
        method: "POST",
        headers: { "x-tenant-id": "tenant-1", "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "tenant-1",
          entities: [
            {
              entity_type: "account",
              name: "Acme",
              source: "hubspot",
              source_id: "hs-1",
              data: {},
            },
          ],
          trace_id: "trace-1",
        }),
      });

      const res = await spineWorker.fetch(req, env as any);
      expect(res.status).toBe(200);

      // Should invalidate cache for the written entity
      expect(env.CACHE.delete).toHaveBeenCalled();
    });
  });

  describe("GET /api/entities", () => {
    it("should query entities with tenant scoping", async () => {
      const entities = [{ id: "e-1", entity_type: "account" }];
      mockSupabaseFrom.mockReturnValue(chainMock({ data: entities, error: null, count: 1 }));

      const req = new Request("http://spine/api/entities?type=account&limit=10", {
        headers: { "x-tenant-id": "tenant-1" },
      });

      const res = await spineWorker.fetch(req, createMockEnv() as any);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/signals", () => {
    it("should query active signals", async () => {
      mockSupabaseFrom.mockReturnValue(chainMock({ data: [], error: null }));

      const req = new Request("http://spine/api/signals?status=active", {
        headers: { "x-tenant-id": "tenant-1" },
      });

      const res = await spineWorker.fetch(req, createMockEnv() as any);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/dashboard", () => {
    it("should aggregate dashboard stats", async () => {
      mockSupabaseFrom.mockReturnValue(chainMock({ data: [], error: null, count: 5 }));

      const req = new Request("http://spine/api/dashboard", {
        headers: { "x-tenant-id": "tenant-1" },
      });

      const res = await spineWorker.fetch(req, createMockEnv() as any);
      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body).toHaveProperty("entity_count");
      expect(body).toHaveProperty("active_signals");
      expect(body).toHaveProperty("pending_approvals");
      expect(body).toHaveProperty("connectors");
    });
  });

  describe("404 handling", () => {
    it("should return 404 for unknown routes", async () => {
      const req = new Request("http://spine/unknown/path");
      const res = await spineWorker.fetch(req, createMockEnv() as any);
      expect(res.status).toBe(404);
    });
  });
});
