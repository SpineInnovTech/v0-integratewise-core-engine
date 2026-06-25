/**
 * Suite 3 — Approval Center
 *
 * Verifies L7 Approval Center user flows.
 * Constitutional Law 2 (governance gate) + Law 3 (no bypass).
 */

import { test, expect } from "@playwright/test";

test.describe("Approval Center", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/approval-center");
  });

  test("pending queue is visible", async ({ page }) => {
    await expect(page.locator("[data-testid=tab-pending]")).toBeVisible();
    await page.click("[data-testid=tab-pending]");
    await expect(page.locator("[data-testid=package-list]")).toBeVisible({ timeout: 10000 });
  });

  test("proposal detail drawer opens", async ({ page }) => {
    await page.click("[data-testid=tab-pending]");
    const firstRow = page.locator("[data-testid=package-row]").first();
    await firstRow.click();
    await expect(page.locator("[data-testid=proposal-detail]")).toBeVisible({ timeout: 5000 });
  });

  test("approve action transitions state", async ({ page }) => {
    await page.click("[data-testid=tab-pending]");
    const firstRow = page.locator("[data-testid=package-row]").first();
    await firstRow.click();
    await page.click("[data-testid=approve-btn]");
    await expect(page.locator("[data-testid=status-approved]")).toBeVisible({ timeout: 5000 });
  });

  test("reject action requires reason and transitions to CANCELLED", async ({ page }) => {
    await page.click("[data-testid=tab-pending]");
    const row = page.locator("[data-testid=package-row]").first();
    await row.click();
    await page.click("[data-testid=reject-btn]");
    // Reject without reason — button should be disabled
    await expect(page.locator("[data-testid=confirm-reject]")).toBeDisabled();
    await page.fill("[data-testid=reject-reason]", "Not aligned with current priorities");
    await page.click("[data-testid=confirm-reject]");
    await expect(page.locator("[data-testid=status-cancelled]")).toBeVisible({ timeout: 5000 });
  });

  test("governance stamp is displayed on approved packages", async ({ page }) => {
    await page.click("[data-testid=tab-approved]");
    const row = page.locator("[data-testid=package-row]").first();
    await row.click();
    await expect(page.locator("[data-testid=governance-stamp]")).toBeVisible();
    await expect(page.locator("[data-testid=stamp-decision-id]")).not.toBeEmpty();
  });

  test("audit trail shows state transitions", async ({ page }) => {
    await page.click("[data-testid=tab-completed]");
    const row = page.locator("[data-testid=package-row]").first();
    await row.click();
    await page.click("[data-testid=view-audit-trail]");
    await expect(page.locator("[data-testid=audit-entry]").first()).toBeVisible({ timeout: 5000 });
  });
});
