/**
 * Regression Tests: S11 Bypass Guard
 *
 * Asserts that ONLY customer_zero can enter S11 native execution.
 * All other tenant_class values (external, null, undefined, malformed)
 * MUST route to the handoff layer.
 *
 * Requirements: 1.7
 */

import { describe, it, expect } from "vitest";
import { dispatch, type DispatchablePackage } from "./dispatch";

// Mock env with D1 and optional KV
function mockEnv(tenantClass: string | null) {
  return {
    D1: {
      prepare: () => ({
        bind: () => ({
          first: async () =>
            tenantClass !== null ? { tenant_class: tenantClass } : null,
        }),
      }),
    } as unknown as D1Database,
    CACHE: {
      get: async () => null,
      put: async () => {},
    } as unknown as KVNamespace,
  };
}

const basePkg: DispatchablePackage = {
  package_id: "pkg-test-001",
  tenant_id: "tenant-test",
};

describe("S11 Dispatch Guard", () => {
  it("routes customer_zero to s11_native", async () => {
    const result = await dispatch(basePkg, mockEnv("customer_zero"));
    expect(result.path).toBe("s11_native");
    expect(result.tenant_class).toBe("customer_zero");
  });

  it("routes 'external' to handoff_layer", async () => {
    const result = await dispatch(basePkg, mockEnv("external"));
    expect(result.path).toBe("handoff_layer");
    expect(result.tenant_class).toBe("external");
  });

  it("routes null tenant_class (not found in DB) to handoff_layer", async () => {
    const result = await dispatch(basePkg, mockEnv(null));
    expect(result.path).toBe("handoff_layer");
    expect(result.tenant_class).toBe("external");
  });

  it("routes unknown/malformed tenant_class to handoff_layer", async () => {
    const result = await dispatch(basePkg, mockEnv("admin"));
    expect(result.path).toBe("handoff_layer");
    expect(result.tenant_class).toBe("external");
  });

  it("routes empty string tenant_class to handoff_layer", async () => {
    const result = await dispatch(basePkg, mockEnv(""));
    expect(result.path).toBe("handoff_layer");
    expect(result.tenant_class).toBe("external");
  });

  it("routes when D1 throws (fail-safe) to handoff_layer", async () => {
    const env = {
      D1: {
        prepare: () => ({
          bind: () => ({
            first: async () => {
              throw new Error("D1 unavailable");
            },
          }),
        }),
      } as unknown as D1Database,
      CACHE: undefined,
    };
    const result = await dispatch(basePkg, env);
    expect(result.path).toBe("handoff_layer");
    expect(result.tenant_class).toBe("external");
  });

  it("routes when tenant_id is empty to handoff_layer", async () => {
    const pkg = { ...basePkg, tenant_id: "" };
    const result = await dispatch(pkg, mockEnv("customer_zero"));
    expect(result.path).toBe("handoff_layer");
    expect(result.tenant_class).toBe("external");
  });
});
