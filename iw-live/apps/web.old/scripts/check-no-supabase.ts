/**
 * Post-build verification: check-no-supabase
 *
 * Scans dist/assets/*.js for any Supabase SDK references.
 * Run after `vite build` when VITE_SPINE_PROVIDER=gateway-proxy.
 *
 * Usage:
 *   VITE_SPINE_PROVIDER=gateway-proxy tsx scripts/check-no-supabase.ts
 *
 * Exits 0 if clean, exits 1 if Supabase references found.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const DIST_ASSETS = resolve(import.meta.dirname ?? __dirname, "../dist/assets");

const SUPABASE_PATTERNS = [
  "@supabase/supabase-js",
  "@supabase/",
  "supabase-js",
  // Supabase SDK sends this header — reliable fingerprint even after minification
  "X-Client-Info",
];

async function main(): Promise<void> {
  const provider = process.env.VITE_SPINE_PROVIDER;

  if (provider !== "gateway-proxy") {
    console.log(
      `[check-no-supabase] VITE_SPINE_PROVIDER="${provider ?? ""}" — skipping (only enforced for gateway-proxy).`
    );
    process.exit(0);
  }

  let files: string[];
  try {
    const entries = await readdir(DIST_ASSETS);
    files = entries.filter((f) => f.endsWith(".js"));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[check-no-supabase] Could not read dist/assets: ${msg}`);
    console.error("Have you run `vite build` first?");
    process.exit(1);
  }

  if (files.length === 0) {
    console.error("[check-no-supabase] No .js files found in dist/assets.");
    process.exit(1);
  }

  const violations: { file: string; matches: string[] }[] = [];

  for (const file of files) {
    const content = await readFile(join(DIST_ASSETS, file), "utf-8");
    const matched = SUPABASE_PATTERNS.filter((pattern) => content.includes(pattern));

    if (matched.length > 0) {
      violations.push({ file, matches: matched });
    }
  }

  if (violations.length > 0) {
    console.error(
      "\n[check-no-supabase] ❌ FAILED — Supabase references found in gateway-proxy build:\n"
    );
    for (const { file, matches } of violations) {
      console.error(`  ${file}`);
      for (const m of matches) {
        console.error(`    └─ contains: "${m}"`);
      }
    }
    console.error("\nThe gateway-proxy bundle must not include @supabase/supabase-js.");
    console.error("Ensure Supabase imports are tree-shaken or conditionally excluded.\n");
    process.exit(1);
  }

  console.log(
    `[check-no-supabase] ✅ PASSED — ${files.length} JS file(s) scanned, no Supabase references found.`
  );
  process.exit(0);
}

main();
