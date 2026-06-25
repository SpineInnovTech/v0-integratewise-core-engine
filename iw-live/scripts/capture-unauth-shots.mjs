#!/usr/bin/env node
/**
 * Captures unauthenticated screens from the IntegrateWise web app.
 * Requires: pnpm dev running on http://localhost:3000
 * Usage:    node scripts/capture-unauth-shots.mjs
 */
import { chromium } from "/Users/nirmal/Github/integratewise-live/apps/web/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";
import { join } from "path";

const OUT = "/tmp/iw-shots";
mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:3000";
const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2 },
};

const shots = [
  { name: "01-login", url: "/", waitFor: 'input[type="email"]' },
  { name: "02-signup", url: "/?signup=1", waitFor: "form" },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await ctx.newPage();

  for (const shot of shots) {
    const url = BASE + shot.url;
    process.stdout.write(`→ ${shot.name}  ${url}\n`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      if (shot.waitFor) {
        await page.waitForSelector(shot.waitFor, { timeout: 8000 }).catch(() => {});
      }
      await page.waitForTimeout(800); // settle animations
      const out = join(OUT, `${shot.name}.png`);
      await page.screenshot({ path: out, fullPage: false });
      process.stdout.write(`  ✓ ${out}\n`);
    } catch (e) {
      process.stdout.write(`  ✗ ${e.message}\n`);
    }
  }

  await browser.close();
})();
