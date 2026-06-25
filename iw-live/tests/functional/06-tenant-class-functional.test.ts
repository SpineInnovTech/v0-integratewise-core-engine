/**
 * Functional Tests — Tenant-Class Enforcement
 */

import { describe, it, expect } from "vitest";
import { dispatch, type DispatchablePackage } from "../../services/intelligence/src/dispatch";
import { getTenantClass } from "../../services/intelligence/src/tenant";

function mockEnvWithClass(tenantClass: string | null) {
  return {
    D1: {
      prepare: () => ({
        bind: () => ({
          first: async () => tenantClass !== null ? { tenant_class: tenantClass } : null,
        }),
      }),
    } as unknown as D1Database,
    CACHE: { get: async () => null, put: async () => {} } as unknown as KVNamespace,
  };
}

describe("Functional: getTenantClass", () => {
  it("returns customer_zero when DB has customer_zero", async () => {
    const result = await getTenantClass("t1", mockEnvWithClass("customer_zero"));
    expect(result).toBe("customer_zero");
  });

  it("returns external when DB has external", async () => {
    const result = await getTenantClass("t1", mockEnvWithClass("external"));
    expect(result).toBe("external");
  });

  it("returns external when DB returns null (not found)", async () => {
    const result = await getTenantClass("t1", mockEnvWithClass(null));
    expect(result).toBe("external");
  });

  it("returns external when DB returns unknown value", async () => {
    const result = await getTenantClass("t1", mockEnvWithClass("premium"));
    expect(result).toBe("external");
  });

  it("returns external when tenantId is empty", async () => {
    const result = await getTenantClass("", mockEnvWithClass("customer_zero"));
    expect(result).toBe("external");
  });

  it("returns external when D1 throws", async () => {
    const env = {
      D1: { prepare: () => ({ bind: () => ({ first: async () => { throw new Error("D1 down"); } }) }) } as any,
      CACHE: undefined,
    };
    const result = await getTenantClass("t1", env);
    expect(result).toBe("external");
  });

  it("uses KV cache when available", async () => {
    const env = {
      D1: { prepare: () => ({ bind: () => ({ first: async () => { throw new Error("should not reach"); } }) }) } as any,
      CACHE: { get: async () => "customer_zero", put: async () => {} } as any,
    };
    const result = await getTenantClass("t1", env);
    expect(result).toBe("customer_zero");
  });
});

describe("Functional: Dispatch Guard", () => {
  const pkg: DispatchablePackage = { package_id: "pkg-001", tenant_id: "t1" };

  it("customer_zero routes to s11_native", async () => {
    const result = await dispatch(pkg, mockEnvWithClass("customer_zero"));
    expect(result.path).toBe("s11_native");
  });

  it("external routes to handoff_layer", async () => {
    const result = await dispatch(pkg, mockEnvWithClass("external"));
    expect(result.path).toBe("handoff_layer");
  });

  it("includes package_id and tenant_id in result", async () => {
    const result = await dispatch(pkg, mockEnvWithClass("external"));
    expect(result.package_id).toBe("pkg-001");
    expect(result.tenant_id).toBe("t1");
  });
});
