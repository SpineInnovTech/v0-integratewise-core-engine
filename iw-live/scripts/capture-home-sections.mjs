#!/usr/bin/env node
import { chromium } from "/Users/nirmal/Github/integratewise-live/apps/web/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";

const OUT = "/tmp/iw-site/shots/home-sections";
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });
  const page = await ctx.newPage();
  await page.goto("https://integratewise.ai/", { waitUntil: "networkidle", timeout: 45000 });

  // Trigger lazy chunks
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);

  const totalH = await page.evaluate(() => document.body.scrollHeight);
  console.log("page height:", totalH);

  // Capture every 900px chunk
  const step = 900;
  let i = 1;
  for (let y = 0; y < totalH; y += step) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(800);
    const out = `${OUT}/section-${String(i).padStart(2, "0")}-y${y}.png`;
    await page.screenshot({ path: out, fullPage: false });
    console.log(`✓ ${out}`);
    i++;
  }

  // Also try locating "Spine connects" text and screenshot around it
  const spineText = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("h1, h2, h3, h4, p, span"));
    const m = all.find((el) => /spine\s+connects?/i.test(el.textContent || ""));
    if (!m) return null;
    m.scrollIntoView({ block: "center" });
    return { text: m.textContent.trim().slice(0, 120), tag: m.tagName, y: window.scrollY };
  });
  console.log("spine match:", JSON.stringify(spineText));
  if (spineText) {
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/spine-section.png`, fullPage: false });
    console.log(`✓ ${OUT}/spine-section.png`);
  }

  await browser.close();
})();
