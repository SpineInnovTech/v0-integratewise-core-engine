/**
 * IntegrateWise Pipeline (Consolidated) - Test Suite
 *
 * Tests for health check and route dispatching to
 * normalizer and spine-v2 sub-services.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// =============================================================================
// MOCKS — stub out the sub-services this consolidator imports
// =============================================================================

const { normalizerFetch, normalizerQueue, spineFetch } = vi.hoisted(() => ({
  normalizerFetch: vi.fn(() => new Response("normalizer ok")),
  normalizerQueue: vi.fn(() => Promise.resolve()),
  spineFetch: vi.fn(() => new Response("spine ok")),
}));

vi.mock("../../normalizer/src/index", () => ({
  default: {
    fetch: normalizerFetch,
    queue: normalizerQueue,
  },
}));

vi.mock("./spine/index", () => ({
  default: { fetch: spineFetch },
  getSpineTarget: vi.fn(() => null),
  resolveEntityType: vi.fn((value: string) => value),
}));

import pipeline from "./index";

const ctx: ExecutionContext = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any;
const env = {} as any;

// =============================================================================
// TESTS
// =============================================================================

describe("Pipeline (Consolidated Worker)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return health check", async () => {
    const req = new Request("http://pipeline/health");
    const res = await pipeline.fetch(req, env, ctx);
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("pipeline");
  });

  it("should route /normalizer/* to normalizer", async () => {
    const req = new Request("http://pipeline/normalizer/process", {
      headers: { "x-tenant-id": "test-tenant", "cf-worker": "test" },
    });
    await pipeline.fetch(req, env, ctx);
    expect(normalizerFetch).toHaveBeenCalled();
  });

  it("should route /spine/* to spine-v2", async () => {
    const req = new Request("http://pipeline/spine/entities", {
      headers: { "x-tenant-id": "test-tenant", "cf-worker": "test" },
    });
    await pipeline.fetch(req, env, ctx);
    expect(spineFetch).toHaveBeenCalled();
  });
});
