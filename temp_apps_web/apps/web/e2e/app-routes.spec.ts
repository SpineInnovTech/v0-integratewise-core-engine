/**
 * App (workspace) routes: /app, /app/dashboard, /app/projects, /app/accounts load.
 */
import { test, expect } from "@playwright/test";

const APP_ROUTES = [
  { path: "/app", name: "App root" },
  { path: "/app/work/dashboard", name: "Dashboard" },
  { path: "/app/work/projects", name: "Projects" },
  { path: "/app/work/accounts", name: "Accounts" },
];

test.describe("App routes (workspace)", () => {
  for (const { path, name } of APP_ROUTES) {
    test(`${name} (${path}) loads`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${escapeRegex(path)}(?:\\?|$|/)`));
      // App shell renders (loading or content)
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
