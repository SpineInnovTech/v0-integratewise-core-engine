#!/usr/bin/env node
/**
 * Capture live IntegrateWise marketing site: screenshots + scroll video.
 */
import { chromium } from "/Users/nirmal/Github/integratewise-live/apps/web/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";

const OUT = "/tmp/iw-site/shots";
const VIDEO_DIR = "/tmp/iw-site/video";
mkdirSync(OUT, { recursive: true });
mkdirSync(VIDEO_DIR, { recursive: true });

const PAGES = [
  ["01-home", "https://integratewise.ai/"],
  ["02-workspace", "https://integratewise.ai/product/the-adaptive-workspace"],
  ["03-spine", "https://integratewise.ai/platform/the-adaptive-spine"],
  ["04-cognitive-layer", "https://integratewise.ai/product/how-it-works"],
  ["05-twin", "https://integratewise.ai/ai"],
  ["06-approval-gate", "https://integratewise.ai/product/approval-gate-twin"],
  ["07-account-success", "https://integratewise.ai/account-success"],
  ["08-business-ops", "https://integratewise.ai/business-ops"],
  ["09-personal-ops", "https://integratewise.ai/personal-ops"],
  ["10-how-it-works", "https://integratewise.ai/platform/how-it-works"],
  ["11-integrations", "https://integratewise.ai/platform/integrations"],
  ["12-pricing", "https://integratewise.ai/pricing"],
];

(async () => {
  const browser = await chromium.launch();

  // ---- SCREENSHOTS ----
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });
  const page = await ctx.newPage();

  for (const [name, url] of PAGES) {
    process.stdout.write(`→ ${name}  ${url}\n`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      // Trigger lazy chunks: scroll quickly then back to top
      await page.evaluate(async () => {
        const h = document.body.scrollHeight;
        for (let y = 0; y <= h; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 80));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(2500); // settle animations
      // Hero (viewport)
      await page.screenshot({ path: `${OUT}/${name}-hero.png`, fullPage: false });
      // Full page
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      process.stdout.write(`  ✓ saved\n`);
    } catch (e) {
      process.stdout.write(`  ✗ ${e.message}\n`);
    }
  }
  await ctx.close();

  // ---- VIDEO: home page scroll ----
  process.stdout.write(`→ Recording home-scroll.webm\n`);
  const vctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
  });
  const vpage = await vctx.newPage();
  try {
    await vpage.goto("https://integratewise.ai/", { waitUntil: "networkidle", timeout: 45000 });
    await vpage.waitForTimeout(4000); // hero anim
    await vpage.evaluate(async () => {
      const h = document.body.scrollHeight;
      const duration = 20000;
      const steps = 200;
      const stepMs = duration / steps;
      const stepPx = h / steps;
      for (let i = 0; i <= steps; i++) {
        window.scrollTo({ top: i * stepPx, behavior: "auto" });
        await new Promise((r) => setTimeout(r, stepMs));
      }
    });
    await vpage.waitForTimeout(1500);
  } catch (e) {
    process.stdout.write(`  ✗ video: ${e.message}\n`);
  }
  await vctx.close();
  // Playwright writes video to disk on context close
  await browser.close();
  process.stdout.write(`✓ done\n`);
})();
