#!/usr/bin/env node
/**
 * Creates a temp Supabase user, logs in via Playwright, captures screenshots
 * of authenticated IntegrateWise views, then deletes the user.
 *
 * Requires .env at repo root with: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Requires apps/web dev server on http://localhost:3000
 */
import { chromium } from "/Users/nirmal/Github/integratewise-live/apps/web/node_modules/playwright/index.mjs";
import { mkdirSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = "/Users/nirmal/Github/integratewise-live";
const OUT = "/tmp/iw-shots";
mkdirSync(OUT, { recursive: true });

// Load .env
const envText = readFileSync(join(ROOT, ".env"), "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    })
);

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const TEST_EMAIL = `iw-shots-${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPassword!" + Math.random().toString(36).slice(2, 10);

async function adminFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  return { status: res.status, ok: res.ok, body: text ? JSON.parse(text) : null };
}

async function createUser() {
  console.log(`→ Creating user ${TEST_EMAIL}`);
  const r = await adminFetch("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo User", role: "admin" },
    }),
  });
  if (!r.ok) {
    console.error("  ✗ create failed:", r.status, JSON.stringify(r.body));
    process.exit(1);
  }
  console.log(`  ✓ user_id=${r.body.id}`);
  return r.body.id;
}

async function deleteUser(id) {
  if (!id) return;
  console.log(`→ Deleting user ${id}`);
  const r = await adminFetch(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
  console.log(r.ok ? "  ✓ deleted" : `  ✗ delete failed ${r.status}`);
}

const SHOTS = [
  // After login lands at /app — capture whatever workspace renders
  { name: "03-after-login", path: "/app", wait: 3000 },
  // Try common workspace routes
  { name: "04-work-dashboard", path: "/work/dashboard", wait: 2500 },
  { name: "05-work-accounts", path: "/work/accounts", wait: 2500 },
  { name: "06-work-pipeline", path: "/work/pipeline", wait: 2500 },
  { name: "07-personal-dashboard", path: "/personal/dashboard", wait: 2500 },
  { name: "08-personal-today", path: "/personal/today", wait: 2500 },
  { name: "09-ai-chat", path: "/work/ai-chat", wait: 2500 },
];

let userId;
let browser;
try {
  userId = await createUser();

  browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });
  const page = await ctx.newPage();

  // ---- LOGIN ----
  console.log("→ Logging in...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.screenshot({ path: join(OUT, "02b-login-filled.png") });
  await page.click('button:has-text("Sign In")');

  // Wait for navigation away from login or workspace shell to render
  await page.waitForTimeout(4000);
  const url = page.url();
  console.log(`  ✓ post-login url=${url}`);
  await page.screenshot({ path: join(OUT, "02c-post-login.png"), fullPage: false });

  // ---- CAPTURE ROUTES ----
  for (const s of SHOTS) {
    console.log(`→ ${s.name}  ${s.path}`);
    try {
      await page.goto("http://localhost:3000" + s.path, {
        waitUntil: "networkidle",
        timeout: 25000,
      });
      await page.waitForTimeout(s.wait);
      const out = join(OUT, `${s.name}.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`  ✓ ${out}`);
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
      try {
        await page.screenshot({ path: join(OUT, `${s.name}-err.png`) });
      } catch {}
    }
  }

  // ---- TRY OPENING L2 DRAWER (Cmd+J) ----
  console.log("→ Opening L2 cognitive drawer (⌘J)");
  try {
    await page.goto("http://localhost:3000/work/dashboard", {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);
    await page.keyboard.press("Meta+j");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(OUT, "10-l2-drawer.png") });
    console.log(`  ✓ /tmp/iw-shots/10-l2-drawer.png`);
  } catch (e) {
    console.log(`  ✗ drawer: ${e.message}`);
  }
} catch (e) {
  console.error("FATAL:", e.message);
} finally {
  if (browser) await browser.close();
  await deleteUser(userId);
}
