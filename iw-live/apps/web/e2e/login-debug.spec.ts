/**
 * Debug test for login page - checks what elements are actually rendered
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://os.integratewise.online';

test.describe('Login Page Debug', () => {
  test('Check all login page elements', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/login`);

    // Wait for hydration
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'login-page.png', fullPage: true });

    // Check for email input
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').count();
    console.log(`Email inputs found: ${emailInput}`);

    // Check for password input
    const passwordInput = await page.locator('input[type="password"]').count();
    console.log(`Password inputs found: ${passwordInput}`);

    // Check for Google OAuth button
    const googleBtn = await page.locator('button:has-text("Google"), a:has-text("Google"), [aria-label*="Google"]').count();
    console.log(`Google OAuth buttons found: ${googleBtn}`);

    // Check for Microsoft OAuth button
    const microsoftBtn = await page.locator('button:has-text("Microsoft"), a:has-text("Microsoft"), [aria-label*="Microsoft"]').count();
    console.log(`Microsoft OAuth buttons found: ${microsoftBtn}`);

    // Check for submit button
    const submitBtn = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').count();
    console.log(`Submit buttons found: ${submitBtn}`);

    // Check for loading skeleton (indicates form didn't load)
    const skeleton = await page.locator('.animate-pulse').count();
    console.log(`Loading skeletons found: ${skeleton}`);

    // Get all visible text
    const bodyText = await page.locator('body').textContent();
    console.log(`\nPage text preview: ${bodyText?.substring(0, 500)}...`);

    // Report console errors
    console.log(`\nConsole errors: ${errors.length}`);
    errors.forEach(e => console.log(`  - ${e}`));

    // Basic assertions
    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
  });
});
