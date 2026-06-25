/**
 * Canonical Onboarding Walkthrough — video + screenshot recorder.
 *
 * Records the full journey: Login → Welcome → Profile → Goals → Connect →
 * Spine Hydration → Workspace Landing. Gateway calls are mocked so the flow
 * is deterministic; the AILoader/WorkplaceLoading auto-advance via their
 * built-in fallbacks (no backend required).
 *
 * Artifacts:
 *   - video:       test-results/<...>/video.webm  (per playwright video config)
 *   - screenshots: test-results/onboarding-walkthrough/NN-<phase>.png
 *
 * Run: pnpm --filter @integratewise/web exec playwright test onboarding-recording --project=chromium
 */
import { test, expect, type Page } from "@playwright/test";

test.use({
  video: { mode: "on", size: { width: 1366, height: 900 } },
  viewport: { width: 1366, height: 900 },
});

const SHOTS = "test-results/onboarding-walkthrough";

function mockJwt(): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "user_demo_001",
      email: "founder@integratewise.ai",
      tenant_id: "tenant_demo_001",
      app_metadata: { tenant_id: "tenant_demo_001" },
      role: "owner",
      name: "Nirmal",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: "https://mcp.integratewise.ai",
    })
  );
  return `${header}.${payload}.${btoa("sig")}`;
}

async function mockGateway(page: Page): Promise<void> {
  const user = {
    id: "user_demo_001",
    email: "founder@integratewise.ai",
    tenant_id: "tenant_demo_001",
    role: "owner",
    name: "Nirmal",
  };
  const ok = (body: unknown) => ({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

  // NOTE: Playwright matches the LAST-registered route first. Register this broad
  // catch-all FIRST so the specific routes below take precedence over it.
  await page.route("**/api/v1/**", (r) =>
    r.fulfill(
      ok({
        ok: true,
        results: {},
        entities: [],
        signals: [],
        counts: {},
        connectors: [],
        syncJobs: [],
      })
    )
  );
  await page.route("**/api/v1/auth/login", (r) => r.fulfill(ok({ token: mockJwt(), user })));
  await page.route("**/api/v1/auth/me", (r) => r.fulfill(ok(user)));
  // initializeSpine returns no syncJobs → AILoader runs its simulated progress immediately.
  await page.route("**/api/v1/workspace/initialize*", (r) => r.fulfill(ok({ syncJobs: [] })));
  await page.route("**/api/v1/workspace/connectors*", (r) => r.fulfill(ok({ connectors: [] })));
  await page.route("**/api/v1/workspace/profile*", (r) =>
    r.fulfill(
      ok({
        domain: "CUSTOMER_SUCCESS",
        department: "CUSTOMER_SUCCESS",
        spine: { domain: "CUSTOMER_SUCCESS", department: "CUSTOMER_SUCCESS" },
      })
    )
  );
}

test("canonical onboarding walkthrough (Login → Workspace)", async ({ page }) => {
  test.setTimeout(120_000);
  await mockGateway(page);

  // ── Phase 1: Login ──────────────────────────────────────────────────────
  await page.goto("/app");
  await expect(page.getByText("Welcome back").first()).toBeVisible({ timeout: 15000 });
  await page.locator('input[type="email"]').first().fill("founder@integratewise.ai");
  await page.locator('input[type="password"]').first().fill("demo-password");
  await page.screenshot({ path: `${SHOTS}/01-login.png` });
  await page.getByRole("button", { name: /Sign In/i }).click();

  // ── Phase 2: Welcome (use case) ─────────────────────────────────────────
  await expect(page.getByText("Welcome to IntegrateWise")).toBeVisible({ timeout: 25000 });
  await page.screenshot({ path: `${SHOTS}/02-welcome.png` });
  await page.getByRole("button", { name: /Company data & workflows/i }).click();
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // ── Phase 3: Profile (industry + department) ────────────────────────────
  await expect(page.getByText("Tell us about yourself")).toBeVisible({ timeout: 10000 });
  await page.locator("select").first().selectOption("SAAS_TECH");
  await page.locator("select").nth(1).selectOption("CUSTOMER_SUCCESS");
  await page.waitForTimeout(600); // let the "Spine schema configured" confirmation render
  await page.screenshot({ path: `${SHOTS}/03-profile.png` });
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // ── Phase 4: Goals & workspace ──────────────────────────────────────────
  await expect(page.getByText("Set your goals & workspace")).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: /Get insights/i }).click();
  await page.screenshot({ path: `${SHOTS}/04-goals.png` });
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // ── Phase 5: Connect data sources ───────────────────────────────────────
  await expect(page.getByText("Connect your data sources")).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/05-connect.png` });
  // Advance without OAuth redirect (showcases the tray, then proceeds).
  await page.getByRole("button", { name: /I'll connect tools later/i }).click();

  // ── Phase 6: Spine Hydration (AILoader → WorkplaceLoading) ──────────────
  // Capture the hydration experience (auto-advances via built-in fallbacks).
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${SHOTS}/06-hydration.png` });

  // ── Phase 7: Workspace landing ──────────────────────────────────────────
  const shell = page.locator("[data-iw-projection-department]").first();
  await expect(shell).toBeVisible({ timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/07-workspace.png`, fullPage: false });

  // Confirm single-authority ProjectionContext on first render (header/nav/workbench agree).
  await expect(shell).toHaveAttribute("data-iw-active-domain", "CUSTOMER_SUCCESS");

  console.log(
    `[recording] screenshots → apps/web/${SHOTS}/  · video → test-results/<test>/video.webm`
  );
});
