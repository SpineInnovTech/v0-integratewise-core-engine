/**
 * Suite 1 — Authentication & Tenant Isolation
 *
 * Verifies JWT enforcement and cross-tenant isolation.
 * Constitutional Law 1 (Operational Separation) + Law 6 (Tenant-Class).
 */

import { test, expect } from "@playwright/test";

const TENANT_A_ID = "tenant-a-test";
const TENANT_B_ID = "tenant-b-test";

test.describe("Authentication & Tenant Isolation", () => {
  test("valid JWT grants access", async ({ request }) => {
    const response = await request.get("/api/v1/handoff/list?state=PROPOSED", {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
    });
    expect(response.status()).toBe(200);
  });

  test("missing JWT returns 401", async ({ request }) => {
    const response = await request.get("/api/v1/handoff/list?state=PROPOSED");
    expect(response.status()).toBe(401);
  });

  test("invalid JWT returns 401", async ({ request }) => {
    const response = await request.get("/api/v1/handoff/list?state=PROPOSED", {
      headers: { Authorization: "Bearer invalid.token.here" },
    });
    expect(response.status()).toBe(401);
  });

  test("expired JWT returns 401", async ({ request }) => {
    const response = await request.get("/api/v1/handoff/list?state=PROPOSED", {
      headers: { Authorization: `Bearer ${process.env.EXPIRED_JWT}` },
    });
    expect(response.status()).toBe(401);
  });

  test("cross-tenant access returns 404 (not 403)", async ({ request }) => {
    // Tenant A tries to access Tenant B's package
    const response = await request.get(
      `/api/v1/handoff/${process.env.TENANT_B_PACKAGE_ID}/state`,
      { headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` } }
    );
    // Returns 404 to prevent enumeration — NOT 403
    expect(response.status()).toBe(404);
  });

  test("S11 route inaccessible to external tenant", async ({ request }) => {
    // External tenant cannot trigger native execution
    const response = await request.post("/api/v1/dispatch/s11", {
      headers: { Authorization: `Bearer ${process.env.EXTERNAL_TENANT_JWT}` },
      data: { package_id: "any-package" },
    });
    expect([403, 404]).toContain(response.status());
  });
});
