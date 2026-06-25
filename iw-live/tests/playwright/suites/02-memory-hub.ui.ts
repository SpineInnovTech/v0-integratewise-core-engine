/**
 * Suite 2 — Memory Hub
 *
 * Verifies L4 Memory Hub from user perspective.
 * Constitutional Law 2 (Signal → Governance → Truth) + Law 4 (Memory Visibility).
 */

import { test, expect } from "@playwright/test";

test.describe("Memory Hub", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/memory");
  });

  test("search loads and returns scoped results", async ({ page }) => {
    await page.fill("[data-testid=memory-search]", "renewal risk");
    await page.click("[data-testid=search-button]");
    await expect(page.locator("[data-testid=result-card]").first()).toBeVisible({ timeout: 10000 });
  });

  test("proposal creation submits to governance", async ({ page }) => {
    await page.click("[data-testid=tab-propose]");
    await page.fill("[data-testid=propose-title]", "Test learning from Playwright");
    await page.fill("[data-testid=propose-content]", "This is a test memory proposal.");
    await page.selectOption("[data-testid=propose-type]", "learning");
    await page.click("[data-testid=submit-proposal]");
    await expect(page.locator("[data-testid=proposal-success]")).toBeVisible({ timeout: 5000 });
  });

  test("governance status is visible for pending items", async ({ page }) => {
    await page.click("[data-testid=tab-pending]");
    await expect(page.locator("[data-testid=governance-badge]").first()).toBeVisible({ timeout: 10000 });
  });

  test("visibility controls render", async ({ page }) => {
    await page.click("[data-testid=tab-visibility]");
    await expect(page.locator("[data-testid=visibility-table]")).toBeVisible({ timeout: 10000 });
  });

  test("memory cannot self-promote (no direct write path)", async ({ request }) => {
    // Attempt direct write to org_memory — should be blocked
    const response = await request.post("/api/v1/memory/direct-write", {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: { content: "bypass attempt", category: "learning" },
    });
    expect([403, 404, 405]).toContain(response.status());
  });
});
