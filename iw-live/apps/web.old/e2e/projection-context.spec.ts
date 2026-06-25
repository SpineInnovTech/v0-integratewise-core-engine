/**
 * Projection Context — single-authority regression test.
 *
 * Guards the CUSTOMER_SUCCESS → "Business Operations" split-brain (PROJECTION_MODEL.md §5,
 * CURRENT_CONTEXT_FLOW.md). A CS-persona user must see ONE context everywhere: header, nav,
 * and workbench all resolve to Account Success — never Business Operations.
 *
 * Why this catches the regression: in the test environment the projection engine's
 * spineClient queries do not resolve, so the projection falls back. Before the fix the
 * fallback department was hardcoded "bizops" (nav leaked BizOps while the header showed CS).
 * After the fix the fallback is seeded from the gateway-resolved domain (CUSTOMER_SUCCESS),
 * so every surface agrees.
 */
import { test, expect, type Page } from "@playwright/test";

function createMockJwt(claims: Record<string, unknown> = {}): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "user_cs_001",
      email: "cs@integratewise.ai",
      tenant_id: "tenant_cs_001",
      role: "owner",
      name: "CS Persona",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: "https://mcp.integratewise.ai",
      ...claims,
    })
  );
  return `${header}.${payload}.${btoa("mock_signature")}`;
}

async function seedCustomerSuccessPersona(page: Page): Promise<void> {
  const token = createMockJwt();

  await page.route("**/api/v1/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user_cs_001",
        email: "cs@integratewise.ai",
        tenant_id: "tenant_cs_001",
        role: "owner",
        name: "CS Persona",
      }),
    });
  });

  // Gateway-authoritative profile: CUSTOMER_SUCCESS (the single source of truth).
  await page.route("**/api/v1/workspace/profile*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        domain: "CUSTOMER_SUCCESS",
        department: "CUSTOMER_SUCCESS",
        spine: { domain: "CUSTOMER_SUCCESS", department: "CUSTOMER_SUCCESS" },
      }),
    });
  });

  // Keep the dashboard from hanging on data fetches.
  for (const pattern of [
    "**/api/v1/workspace/today*",
    "**/api/v1/workspace/signals*",
    "**/api/v1/pipeline/entities/counts*",
    "**/api/v1/projections/morning-context*",
  ]) {
    await page.route(pattern, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ summary: {}, actions: [], alerts: [], signals: [], counts: {} }),
      });
    });
  }

  await page.addInitScript((t) => {
    localStorage.setItem("iw_at", t as string);
    localStorage.setItem(
      "iw_onboarding_user_cs_001",
      JSON.stringify({
        onboarding_complete: true,
        domain: "CUSTOMER_SUCCESS",
        department: "CUSTOMER_SUCCESS",
        userName: "CS Persona",
        userRole: "owner",
        connectors: { crm: "hubspot" },
      })
    );
  }, token);
}

test.describe("Projection Context — single authority (CS persona)", () => {
  test("header, nav, and workbench all resolve to Account Success — never Business Operations", async ({
    page,
  }) => {
    await seedCustomerSuccessPersona(page);

    await page.goto("/app/work/dashboard");

    // Shell mounted.
    await expect(page.locator("text=CS Persona").first()).toBeVisible({ timeout: 15000 });

    // ── The actual invariant: the ONE projection context the shell resolves. ──
    // Bound to projection.user.department on the shell root. Before the single-authority
    // fix this fell back to "bizops" (diverging from the CS domain); after the fix it is
    // seeded from the gateway-resolved domain. This is the regression guard.
    const shell = page.locator("[data-iw-projection-department]").first();
    await expect(shell).toHaveAttribute("data-iw-active-domain", "CUSTOMER_SUCCESS", {
      timeout: 15000,
    });
    await expect(shell).toHaveAttribute("data-iw-projection-department", /CUSTOMER_SUCCESS/i, {
      timeout: 15000,
    });

    // The CS workspace identity is present (sidebar workspace label = "Account Success").
    await expect(page.locator("text=Account Success").first()).toBeVisible({ timeout: 15000 });

    // The regression signature: BizOps must NOT leak into a CS persona's surfaces.
    await expect(page.getByText("Business Operations", { exact: true })).toHaveCount(0);
  });
});
