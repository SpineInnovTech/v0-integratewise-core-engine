#!/usr/bin/env node
import { chromium } from "/Users/nirmal/Github/integratewise-live/apps/web/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";

const OUT = "/tmp/iw-site/shots/drawer";
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1200, deviceScaleFactor: 3 },
  });
  const page = await ctx.newPage();
  await page.goto("https://integratewise.ai/", { waitUntil: "networkidle", timeout: 45000 });

  // Lazy load pass
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);

  // Center the spine section in viewport
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("h1, h2"));
    const m = all.find((el) => /spine\s+connects/i.test(el.textContent || ""));
    if (m) m.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(1500);
  // scroll a bit so the mockup shows fully
  await page.evaluate(() => window.scrollBy(0, 250));
  await page.waitForTimeout(1500);

  await page.screenshot({ path: `${OUT}/full-viewport.png`, fullPage: false });

  // Locate the mockup container — the parent that includes "Workspace" breadcrumb + "Accounts & Revenue" header
  const mockup = await page.evaluate(() => {
    const findContaining = (texts) => {
      const els = Array.from(document.querySelectorAll("div"));
      let best = null;
      let bestArea = Infinity;
      for (const el of els) {
        const t = el.innerText || "";
        if (texts.every((s) => t.includes(s))) {
          const r = el.getBoundingClientRect();
          const area = r.width * r.height;
          if (area > 100000 && area < bestArea) {
            bestArea = area;
            best = el;
          }
        }
      }
      return best;
    };
    const el = findContaining(["WORKSPACE", "Accounts & Revenue", "TechServe India"]);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  console.log("mockup box:", mockup);

  if (mockup) {
    const clip = {
      x: Math.max(0, Math.floor(mockup.x - 8)),
      y: Math.max(0, Math.floor(mockup.y - 8)),
      width: Math.min(1920, Math.ceil(mockup.width + 16)),
      height: Math.min(1200, Math.ceil(mockup.height + 16)),
    };
    await page.screenshot({ path: `${OUT}/mockup-full.png`, clip });
    console.log(`✓ mockup ${clip.width}x${clip.height}`);

    // Sidebar = leftmost ~75–95px wide vertical band of mockup. From the earlier shot,
    // the dark sidebar starts at mockup.x and is about 15% of its width (~190px at viewport).
    const sidebarClip = {
      x: clip.x,
      y: clip.y,
      width: Math.min(clip.width, 380),
      height: clip.height,
    };
    await page.screenshot({ path: `${OUT}/sidebar-only.png`, clip: sidebarClip });
    console.log(`✓ sidebar ${sidebarClip.width}x${sidebarClip.height}`);
  }

  // Extract every visible text in the mockup region
  const items = await page.evaluate((box) => {
    if (!box) return [];
    const out = [];
    const walk = (root) => {
      const els = Array.from(root.querySelectorAll("*"));
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const inBox =
          r.x >= box.x - 2 &&
          r.x + r.width <= box.x + box.width + 2 &&
          r.y >= box.y - 2 &&
          r.y + r.height <= box.y + box.height + 2;
        if (!inBox) continue;
        const direct = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .filter(Boolean)
          .join(" ");
        if (direct) {
          out.push({
            text: direct,
            x: Math.round(r.x - box.x),
            y: Math.round(r.y - box.y),
            tag: el.tagName,
            color: getComputedStyle(el).color,
            fs: getComputedStyle(el).fontSize,
            fw: getComputedStyle(el).fontWeight,
          });
        }
      }
    };
    walk(document);
    return out.sort((a, b) => a.y - b.y || a.x - b.x);
  }, mockup);

  console.log("\n=== ALL TEXT IN MOCKUP (sorted top-to-bottom) ===");
  for (const it of items) {
    console.log(
      `y=${String(it.y).padStart(4)} x=${String(it.x).padStart(4)}  [${it.tag} ${it.fs} ${it.fw}]  "${it.text}"`
    );
  }

  await browser.close();
})();
