/**
 * IntegrateWise Intelligence (Consolidated) - Test Suite
 *
 * Tests for health check and route dispatching to
 * think, act, govern, and agents sub-services.
 */

import { describe, it, expect, vi } from "vitest";

// =============================================================================
// MOCKS — stub out the sub-services this consolidator imports
// =============================================================================

vi.mock("../../think/src/index", () => ({
  default: { fetch: vi.fn(() => new Response("think ok")) },
}));

vi.mock("../../act/src/index", () => ({
  default: { fetch: vi.fn(() => new Response("act ok")) },
}));

vi.mock("../../govern/src/index", () => ({
  default: { fetch: vi.fn(() => new Response("govern ok")) },
}));

vi.mock("../../agents/src/index", () => ({
  default: { fetch: vi.fn(() => new Response("agents ok")) },
}));

import intelligence from "./index";

const ctx: ExecutionContext = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any;
const env = {} as any;

// =============================================================================
// TESTS
// =============================================================================

describe("Intelligence (Consolidated Worker)", () => {
  it("should return health check with all 4 components", async () => {
    const req = new Request("http://intelligence/health");
    const res = await intelligence.fetch(req, env, ctx);
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("intelligence");
    expect(body.components).toEqual(["think", "act", "govern", "agents"]);
  });

  it("should route /think/* to think service", async () => {
    const { default: thinkWorker } = await import("../../think/src/index");
    const req = new Request("http://intelligence/think/analyze");
    await intelligence.fetch(req, env, ctx);
    expect(thinkWorker.fetch).toHaveBeenCalled();
  });

  it("should route /act/* to act service", async () => {
    const { default: actWorker } = await import("../../act/src/index");
    const req = new Request("http://intelligence/act/execute");
    await intelligence.fetch(req, env, ctx);
    expect(actWorker.fetch).toHaveBeenCalled();
  });

  it("should route /govern/* to govern service", async () => {
    const { default: governWorker } = await import("../../govern/src/index");
    const req = new Request("http://intelligence/govern/check");
    await intelligence.fetch(req, env, ctx);
    expect(governWorker.fetch).toHaveBeenCalled();
  });

  it("should route /agents/* to agents service", async () => {
    const { default: agentsWorker } = await import("./agents/index");
    const req = new Request("http://intelligence/agents/run");
    await intelligence.fetch(req, env, ctx);
    expect(agentsWorker.fetch).toHaveBeenCalled();
  });
});
