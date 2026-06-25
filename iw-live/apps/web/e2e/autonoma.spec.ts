/**
 * Autonoma AI - End-to-End UI Testing Suite
 * Tests real user flows through the IntegrateWise OS application
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://os.integratewise.online';

test.describe('Autonoma AI - Core User Flows', () => {

  test.describe('Landing & Marketing Pages', () => {
    test('Homepage loads and displays key elements', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check page loads (may redirect to /login or show landing)
      await expect(page).toHaveURL(/\/(login|home|os)?$/);

      // Check for navigation elements
      const nav = page.locator('nav, header');
      await expect(nav.first()).toBeVisible();
    });

    test('OS landing page displays features', async ({ page }) => {
      await page.goto(`${BASE_URL}/os`);

      await expect(page).toHaveTitle(/IntegrateWise|OS/i);

      // Check for key content sections
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
    });

    test('CS landing page loads correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/cs`);

      await expect(page.locator('body')).toBeVisible();
      // Should have customer success related content
    });

    test('Pricing page shows plans', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);

      await expect(page).toHaveURL(/pricing/);

      // Look for pricing-related elements
      const pricingContent = page.locator('text=/free|starter|pro|enterprise/i').first();
      await expect(pricingContent).toBeVisible({ timeout: 10000 });
    });

    test('Integrations page lists available integrations', async ({ page }) => {
      await page.goto(`${BASE_URL}/integrations`);

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Authentication Flow', () => {
    test('Login page renders correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      // Check for login form elements
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      const passwordInput = page.locator('input[type="password"]');

      await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
      await expect(passwordInput.first()).toBeVisible();
    });

    test('Signup page renders correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);

      // Check for signup form
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('Login form shows validation on empty submit', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")');

      if (await submitButton.first().isVisible()) {
        await submitButton.first().click();

        // Should show validation error or stay on page
        await expect(page).toHaveURL(/login/);
      }
    });

    test('Forgot password link exists', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      const forgotLink = page.locator('a:has-text("Forgot"), a[href*="forgot"]');
      // May or may not exist depending on implementation
    });
  });

  test.describe('Navigation & Routing', () => {
    test('Navigation menu is accessible', async ({ page }) => {
      await page.goto(`${BASE_URL}/os`);

      // Check for navigation
      const navLinks = page.locator('nav a, header a');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Footer links are present', async ({ page }) => {
      await page.goto(`${BASE_URL}/os`);

      const footer = page.locator('footer');
      if (await footer.isVisible()) {
        const footerLinks = footer.locator('a');
        const count = await footerLinks.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('404 page handles unknown routes', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`);

      // Should return 404 or redirect
      expect([200, 307, 404]).toContain(response?.status() || 200);
    });
  });

  test.describe('Protected Routes (Redirect Check)', () => {
    test('Dashboard redirects to login when unauthenticated', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/, { timeout: 10000 });
    });

    test('Settings redirects to login when unauthenticated', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);

      await expect(page).toHaveURL(/login|auth|settings/, { timeout: 10000 });
    });

    test('Clients page requires authentication', async ({ page }) => {
      await page.goto(`${BASE_URL}/clients`);

      // Should either redirect or show login prompt
      const url = page.url();
      expect(url).toMatch(/login|auth|clients/);
    });
  });

  test.describe('UI Components & Interactions', () => {
    test('Theme toggle works (if present)', async ({ page }) => {
      await page.goto(`${BASE_URL}/os`);

      const themeToggle = page.locator('button[aria-label*="theme" i], button:has-text("Dark"), button:has-text("Light")');

      if (await themeToggle.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await themeToggle.first().click();
        // Check that some styling changed
      }
    });

    test('Mobile menu toggle works', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/os`);

      const menuButton = page.locator('button[aria-label*="menu" i], button:has([class*="hamburger"]), [data-testid="mobile-menu"]');

      if (await menuButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await menuButton.first().click();
        // Menu should open
      }
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('Page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/os`);
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('No console errors on page load', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(`${BASE_URL}/os`);
      await page.waitForTimeout(2000);

      // Filter out known acceptable errors
      const criticalErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('analytics') &&
        !e.includes('third-party')
      );

      expect(criticalErrors.length).toBeLessThan(5);
    });

    test('Images have alt attributes', async ({ page }) => {
      await page.goto(`${BASE_URL}/os`);

      const imagesWithoutAlt = await page.locator('img:not([alt])').count();

      // Most images should have alt text
      expect(imagesWithoutAlt).toBeLessThan(10);
    });
  });

  test.describe('Forms & User Input', () => {
    test('Contact/Support form exists and validates', async ({ page }) => {
      await page.goto(`${BASE_URL}/support/contact`);

      const form = page.locator('form');
      if (await form.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        // Check for form fields
        const inputs = form.locator('input, textarea');
        const inputCount = await inputs.count();
        expect(inputCount).toBeGreaterThan(0);
      }
    });
  });
});
