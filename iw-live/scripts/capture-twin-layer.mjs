#!/usr/bin/env node
// Capture Layer 2 (Twin Workspace / Cognitive Layer overlay) as standalone asset
// + a side-by-side composite framing with Layer 1 (User Workspace).
import { chromium } from "/Users/nirmal/Github/integratewise-live/apps/web/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";

const OUT = "/tmp/iw-site/shots/layers";
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1200, deviceScaleFactor: 3 },
  });
  const page = await ctx.newPage();
  await page.goto("https://integratewise.ai/", { waitUntil: "networkidle", timeout: 45000 });

  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    const m = Array.from(document.querySelectorAll("h1,h2")).find((el) =>
      /spine\s+connects/i.test(el.textContent || "")
    );
    if (m) m.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollBy(0, 250));
  await page.waitForTimeout(1500);

  // Find the mockup container (Layer 1 frame)
  const layer1 = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("div"));
    let best = null;
    let bestArea = Infinity;
    for (const el of els) {
      const t = el.innerText || "";
      if (
        t.includes("WORKSPACE") &&
        t.includes("Accounts & Revenue") &&
        t.includes("TechServe India")
      ) {
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        if (area > 100000 && area < bestArea) {
          bestArea = area;
          best = el;
        }
      }
    }
    if (!best) return null;
    const r = best.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  console.log("Layer 1 (User Workspace) box:", layer1);

  // Find the Twin / Cognitive Layer overlay card.
  // Heuristic: a smaller absolutely-positioned card that contains "Cognitive" or "Renewal" or "Twin"
  // or "proposed" / "signal" wording, sitting on top of the mockup.
  const layer2 = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll("div, section, article"));
    const hits = [];
    for (const el of candidates) {
      const t = (el.innerText || "").toLowerCase();
      const r = el.getBoundingClientRect();
      if (r.width < 80 || r.height < 60) continue;
      if (r.width > 900 || r.height > 700) continue;
      const score =
        (t.includes("cognitive") ? 3 : 0) +
        (t.includes("twin") ? 3 : 0) +
        (t.includes("renewal") ? 2 : 0) +
        (t.includes("signal") ? 2 : 0) +
        (t.includes("proposed") ? 2 : 0) +
        (t.includes("approve") ? 1 : 0) +
        (t.includes("risk") ? 1 : 0);
      if (score >= 3) {
        hits.push({
          score,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          sample: (el.innerText || "").slice(0, 200),
        });
      }
    }
    hits.sort((a, b) => b.score - a.score || a.width * a.height - b.width * b.height);
    return hits.slice(0, 5);
  });
  console.log("Layer 2 candidates:");
  for (const h of layer2) {
    console.log(
      `  score=${h.score} ${Math.round(h.width)}x${Math.round(h.height)} @${Math.round(h.x)},${Math.round(h.y)}`
    );
    console.log(`    "${h.sample.replace(/\n/g, " | ")}"`);
  }

  // Capture top candidate as Layer 2
  if (layer2.length) {
    const top = layer2[0];
    const clip = {
      x: Math.max(0, Math.floor(top.x - 12)),
      y: Math.max(0, Math.floor(top.y - 12)),
      width: Math.min(1920, Math.ceil(top.width + 24)),
      height: Math.min(1200, Math.ceil(top.height + 24)),
    };
    await page.screenshot({ path: `${OUT}/layer2-twin-workspace.png`, clip });
    console.log(`✓ Layer 2 saved ${clip.width}x${clip.height}`);
  } else {
    console.log(
      "⚠ No Layer 2 candidate found via text heuristic; full mockup already covers both."
    );
  }

  // Re-capture full mockup as Layer 1 reference
  if (layer1) {
    const clip = {
      x: Math.max(0, Math.floor(layer1.x - 8)),
      y: Math.max(0, Math.floor(layer1.y - 8)),
      width: Math.min(1920, Math.ceil(layer1.width + 16)),
      height: Math.min(1200, Math.ceil(layer1.height + 16)),
    };
    await page.screenshot({ path: `${OUT}/layer1-user-workspace.png`, clip });
    console.log(`✓ Layer 1 saved ${clip.width}x${clip.height}`);
  }

  await browser.close();
})();
