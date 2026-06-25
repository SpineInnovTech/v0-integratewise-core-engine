/**
 * Suite 6 — Tenant-Class Enforcement
 *
 * Constitutional Law 6: Only customer_zero enters S11.
 * All other paths → handoff layer.
 */

import { test, expect } from "@playwright/test";

test.describe("Tenant-Class Enforcement", () => {
  test("external tenant is blocked from S11 native execution", async ({ request }) => {
    const response = await request.post("/api/v1/dispatch", {
      headers: { Authorization: `Bearer ${process.env.EXTERNAL_TENANT_JWT}` },
      data: { package_id: "test-pkg", action: "execute_native" },
    });
    const body = await response.json();
    expect(body.path || body.error).not.toBe("s11_native");
  });

  test("customer_zero can access S11 path", async ({ request }) => {
    const response = await request.post("/api/v1/dispatch", {
      headers: { Authorization: `Bearer ${process.env.CZ_JWT}` },
      data: { package_id: "cz-test-pkg", action: "execute_native" },
    });
    // CZ should either succeed or get a legitimate response (not 403)
    expect(response.status()).not.toBe(403);
  });

  test("unknown tenant defaults to external (fail-safe)", async ({ request }) => {
    const response = await request.post("/api/v1/dispatch", {
      headers: { Authorization: `Bearer ${process.env.UNKNOWN_TENANT_JWT}` },
      data: { package_id: "unknown-pkg" },
    });
    const body = await response.json();
    // Should route to handoff, not S11
    if (body.path) expect(body.path).toBe("handoff_layer");
  });
});
