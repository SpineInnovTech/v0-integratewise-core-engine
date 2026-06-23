import { test, expect, type Page } from "@playwright/test";

// ─── Constants & Helpers ─────────────────────────────────────────────────────

/** Fake JWT with valid structure (header.payload.signature) */
function createMockJwt(claims: Record<string, unknown> = {}): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "user_test_001",
      email: "test@integratewise.ai",
      tenant_id: "tenant_test_001",
      role: "admin",
      name: "Nirmal Prince",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: "https://mcp.integratewise.ai",
      ...claims,
    })
  );
  const signature = btoa("mock_signature_for_testing");
  return `${header}.${payload}.${signature}`;
}

const MOCK_ACCESS_TOKEN = createMockJwt();

async function seedAuthState(page: Page): Promise<void> {
  // Intercept the token validation / refresh call
  await page.route("**/api/v1/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user_test_001",
        email: "test@integratewise.ai",
        tenant_id: "tenant_test_001",
        role: "admin",
        name: "Nirmal Prince",
      }),
    });
  });

  // Seed the access token in localStorage (the key the AuthManager scans for)
  await page.addInitScript((token) => {
    localStorage.setItem("iw_at", token);
  }, MOCK_ACCESS_TOKEN);
}

// Mock common workspace APIs to prevent E2E dashboard loading hangs
async function mockWorkspaceDashboardAPIs(page: Page): Promise<void> {
  await page.route("**/api/v1/workspace/today*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        summary: {
          health: { score: "95%" },
          pipeline: { count: 5 },
          tasks: { completed: 2, total: 5 },
        },
        actions: [],
        alerts: [],
      }),
    });
  });
  await page.route("**/api/v1/workspace/signals*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ signals: [], unread: 0 }),
    });
  });
  await page.route("**/api/v1/pipeline/entities/counts*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ counts: { account: 10, contact: 5, opportunity: 2 } }),
    });
  });
}

test.describe("IntegrateWise E2E - Screens and Dummy Auth Verification", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.error(`[BROWSER UNCAUGHT EXCEPTION]`, err);
    });
  });

  test("loads onboarding by default and walks through step 1", async ({ page }) => {
    // Authenticate the user as a new user (no onboarding completed state)
    await seedAuthState(page);

    // Navigate to root (which redirects to /app)
    await page.goto("/app");

    // Expect loading state to finish and Welcome screen to appear
    await expect(page.locator("text=Welcome to IntegrateWise")).toBeVisible({ timeout: 15000 });

    // Choose "Work" use case by selecting the specific button with unique text
    await page.locator('button:has-text("Professional workflow")').click();

    // Check that Continue button becomes active and click it
    const continueBtn = page.locator('button:has-text("Continue")');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Check that we moved to Step 2 (Profile screen)
    await expect(page.locator("text=Step 2 of 4")).toBeVisible();
  });

  test("loads workspace dashboard directly with mock completed onboarding state", async ({
    page,
  }) => {
    // Authenticate the user
    await seedAuthState(page);
    await mockWorkspaceDashboardAPIs(page);

    // Inject onboarding completed state for the authenticated user to bypass onboarding flow
    await page.addInitScript(() => {
      localStorage.setItem(
        "iw_onboarding_user_test_001",
        JSON.stringify({
          onboarding_complete: true,
          domain: "CUSTOMER_SUCCESS",
          userName: "Nirmal Prince",
          userRole: "owner",
          connectors: { crm: "hubspot", task: "jira", workspace: "slack" },
        })
      );
    });

    // Go to dashboard directly
    await page.goto("/app/work/dashboard");

    // Wait for the workspace shell header or userName to show up (asserting the first occurrence)
    await expect(page.locator("text=Nirmal Prince").first()).toBeVisible({ timeout: 15000 });

    // Expect sidebar navigation list to load
    await expect(page.locator("aside, nav, [role='complementary']").first()).toBeVisible();

    // Verify L2 Cognitive Drawer triggers via hotkey (Control+j)
    await page.keyboard.press("Control+j");

    // Verify cognitive drawer opens by asserting search input placeholder
    await expect(page.locator("[placeholder='Search evidence / reasoning...']")).toBeVisible({
      timeout: 8000,
    });
  });
});
