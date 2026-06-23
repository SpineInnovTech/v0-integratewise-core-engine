/**
 * Onboarding journey + user landing — verification.
 *
 * Verifies the landing DECISION (where a user ends up based on auth + onboarding state)
 * and the onboarding entry/progression:
 *   1. Unauthenticated            → login landing (not onboarding, not workspace)
 *   2. New authenticated user     → onboarding (Welcome → Profile step progression)
 *   3. Returning onboarded user   → workspace directly (onboarding skipped)
 *
 * Self-contained: gateway calls are mocked via page.route (no live backend needed).
 */
import { test, expect, type Page } from "@playwright/test";

function mockJwt(claims: Record<string, unknown> = {}): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "user_journey_001",
      email: "journey@integratewise.ai",
      tenant_id: "tenant_journey_001",
      app_metadata: { tenant_id: "tenant_journey_001" },
      role: "owner",
      name: "Journey User",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: "https://mcp.integratewise.ai",
      ...claims,
    })
  );
  return `${header}.${payload}.${btoa("mock_sig")}`;
}

async function mockAuthMe(page: Page): Promise<void> {
  await page.route("**/api/v1/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user_journey_001",
        email: "journey@integratewise.ai",
        tenant_id: "tenant_journey_001",
        role: "owner",
        name: "Journey User",
      }),
    });
  });
}

async function mockWorkspaceData(page: Page, domain = "CUSTOMER_SUCCESS"): Promise<void> {
  await page.route("**/api/v1/workspace/profile*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ domain, department: domain, spine: { domain, department: domain } }),
    });
  });
  for (const p of [
    "**/api/v1/workspace/today*",
    "**/api/v1/workspace/signals*",
    "**/api/v1/pipeline/entities*",
    "**/api/v1/projections/morning-context*",
  ]) {
    await page.route(p, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {},
          actions: [],
          alerts: [],
          signals: [],
          entities: [],
          results: {},
          counts: {},
        }),
      });
    });
  }
}

test.describe("Onboarding journey + user landing", () => {
  test("unauthenticated user lands on the login screen (not onboarding, not workspace)", async ({
    page,
  }) => {
    // No token seeded → no session.
    await mockAuthMe(page);
    await page.goto("/app");

    await expect(page.getByText("Welcome back").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    // Must NOT have fallen into onboarding or workspace.
    await expect(page.getByText("Welcome to IntegrateWise")).toHaveCount(0);
  });

  test("new authenticated user enters onboarding and can progress Welcome → Profile", async ({
    page,
  }) => {
    const token = mockJwt();
    await mockAuthMe(page);
    await page.addInitScript((t) => {
      localStorage.setItem("iw_at", t as string);
      // No iw_onboarding_* completed flag → treated as a new user.
    }, token);

    await page.goto("/app");

    // Lands in onboarding (after provisioning), not the workspace.
    await expect(page.getByText("Welcome to IntegrateWise")).toBeVisible({ timeout: 20000 });

    // Step 1 → select "Work" use case, continue.
    await page.getByRole("button", { name: /Professional workflow/i }).click();
    await page.getByRole("button", { name: /^Continue$/ }).click();

    // Step 2 (Profile) appears.
    await expect(page.getByText("Tell us about yourself")).toBeVisible({ timeout: 10000 });
  });

  test("returning onboarded user lands directly in the workspace (onboarding skipped)", async ({
    page,
  }) => {
    const token = mockJwt();
    await mockAuthMe(page);
    await mockWorkspaceData(page, "CUSTOMER_SUCCESS");
    await page.addInitScript((t) => {
      localStorage.setItem("iw_at", t as string);
      localStorage.setItem(
        "iw_onboarding_user_journey_001",
        JSON.stringify({
          onboarding_complete: true,
          domain: "CUSTOMER_SUCCESS",
          department: "CUSTOMER_SUCCESS",
          userName: "Journey User",
          userRole: "owner",
        })
      );
    }, token);

    await page.goto("/app/work/dashboard");

    // Workspace shell mounted (single projection context attribute present) — NOT onboarding.
    const shell = page.locator("[data-iw-projection-department]").first();
    await expect(shell).toHaveAttribute("data-iw-active-domain", "CUSTOMER_SUCCESS", {
      timeout: 20000,
    });
    await expect(page.getByText("Welcome to IntegrateWise")).toHaveCount(0);
  });
});
