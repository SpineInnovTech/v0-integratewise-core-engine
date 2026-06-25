/**
 * IntegrateWise Workflow Service - Test Suite
 *
 * Tests for workflow execution, health check, and basic routing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// =============================================================================
// MOCKS
// =============================================================================

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ data: null, error: null })),
    })),
  })),
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

import app from "./index";

// =============================================================================
// HELPERS
// =============================================================================

function env() {
  return {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
    ENVIRONMENT: "test",
  } as any;
}

// =============================================================================
// TESTS
// =============================================================================

describe("Workflow Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export a worker", () => {
    expect(app).toBeDefined();
  });

  it("should respond to health check", async () => {
    const req = new Request("http://workflow/health");
    const res = await app.fetch(req, env());
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
