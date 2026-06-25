/**
 * IntegrateWise Connector (Consolidated) - Test Suite
 *
 * Tests for health check and route dispatching to
 * loader, MCP connector, and store sub-services.
 */

import { describe, it, expect, vi } from "vitest";

// =============================================================================
// MOCKS — stub out the sub-services this consolidator imports
// =============================================================================

vi.mock("../../loader/src/index", () => ({
  default: {
    fetch: vi.fn(() => new Response("loader ok")),
    scheduled: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("../../mcp-connector/src/index", () => ({
  default: { fetch: vi.fn(() => new Response("mcp ok")) },
}));

vi.mock("../../store/src/index", () => ({
  default: { fetch: vi.fn(() => new Response("store ok")) },
}));

import connector from "./index";

const ctx: ExecutionContext = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any;
const env = {} as any;

// =============================================================================
// TESTS
// =============================================================================

describe("Connector (Consolidated Worker)", () => {
  it("should return health check with all 3 components", async () => {
    const req = new Request("http://connector/health");
    const res = await connector.fetch(req, env, ctx);
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("connector");
    expect(body.components).toEqual(["loader", "mcp-connector", "store"]);
  });

  it("should route /mcp/* to MCP connector", async () => {
    const { default: mcpApp } = await import("../../mcp-connector/src/index");
    const req = new Request("http://connector/mcp/tools");
    await connector.fetch(req, env, ctx);
    expect(mcpApp.fetch).toHaveBeenCalled();
  });

  it("should route /tools/* to MCP connector", async () => {
    const { default: mcpApp } = await import("../../mcp-connector/src/index");
    const req = new Request("http://connector/tools/list");
    await connector.fetch(req, env, ctx);
    expect(mcpApp.fetch).toHaveBeenCalled();
  });

  it("should route /files/* to store", async () => {
    const { default: storeApp } = await import("../../store/src/index");
    const req = new Request("http://connector/files/abc-123");
    await connector.fetch(req, env, ctx);
    expect(storeApp.fetch).toHaveBeenCalled();
  });

  it("should route /upload/* to store", async () => {
    const { default: storeApp } = await import("../../store/src/index");
    const req = new Request("http://connector/upload/file.pdf");
    await connector.fetch(req, env, ctx);
    expect(storeApp.fetch).toHaveBeenCalled();
  });

  it("should route unknown paths to loader (default)", async () => {
    const { default: loaderWorker } = await import("../../loader/src/index");
    const req = new Request("http://connector/webhooks/hubspot");
    await connector.fetch(req, env, ctx);
    expect(loaderWorker.fetch).toHaveBeenCalled();
  });
});
