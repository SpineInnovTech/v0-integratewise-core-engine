#!/usr/bin/env node
// Capture frames from Loom video via Playwright
import { chromium } from "/Users/nirmal/Github/integratewise-live/apps/web/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";

const URL = "https://www.loom.com/share/167f3f5f13f14b3d824e5df8beee15c1";
const OUT = "/tmp/iw-loom";
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
  });
  const page = await ctx.newPage();

  // Track media URLs
  const mediaUrls = new Set();
  page.on("response", (res) => {
    const u = res.url();
    if (/\.(mp4|m3u8|ts|m4s)/i.test(u) || /transcoded|cdn\.loom/i.test(u)) {
      mediaUrls.add(u);
    }
  });

  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  // Pull video metadata from page
  const meta = await page.evaluate(() => {
    const og = (k) =>
      document.querySelector(`meta[property="${k}"]`)?.getAttribute("content") || null;
    const title = document.title;
    const videoEls = Array.from(document.querySelectorAll("video")).map((v) => ({
      src: v.src,
      currentSrc: v.currentSrc,
      duration: v.duration,
      poster: v.poster,
    }));
    return {
      title,
      ogTitle: og("og:title"),
      ogVideo: og("og:video"),
      ogVideoSecure: og("og:video:secure_url"),
      ogImage: og("og:image"),
      ogDesc: og("og:description"),
      videoEls,
    };
  });
  console.log("META:", JSON.stringify(meta, null, 2));

  // Try clicking play
  try {
    const playBtn = await page.$('button[aria-label*="lay" i], button[data-testid*="play" i]');
    if (playBtn) {
      await playBtn.click();
      console.log("✓ clicked play");
    } else {
      // try clicking center of video
      await page.mouse.click(960, 540);
      console.log("✓ clicked center");
    }
  } catch (e) {
    console.log("play click err:", e.message);
  }
  await page.waitForTimeout(4000);

  // Capture frames every 2s for 60s
  for (let t = 0; t <= 60; t += 2) {
    await page.screenshot({ path: `${OUT}/frame-${String(t).padStart(3, "0")}s.png` });
    console.log(`  frame ${t}s`);
    await page.waitForTimeout(2000);
  }

  console.log("\nMedia URLs intercepted:");
  for (const u of mediaUrls) console.log("  " + u);

  await browser.close();
})();
