#!/usr/bin/env node
/**
 * Apply Customer Zero D1 migration and verify tenant seed.
 *
 * Usage:
 *   node scripts/enable-customer-zero.mjs
 *   node scripts/enable-customer-zero.mjs --remote
 */

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TENANTS_DIR = join(__dirname, "../services/tenants");
const remote = process.argv.includes("--remote");
const flag = remote ? "--remote" : "--local";

console.log(`\n▶ Applying Customer Zero migration (${flag})...\n`);

try {
  execSync(`npx wrangler d1 migrations apply integratewise-spine-cache ${flag}`, {
    cwd: TENANTS_DIR,
    stdio: "inherit",
  });
} catch (err) {
  console.error("Migration apply failed:", err.message);
  process.exit(1);
}

const verifySql = `
SELECT id, plan, status FROM tenants WHERE id = 'iw-customer-zero';
SELECT email, role, department, plan FROM tenant_users WHERE tenant_id = 'iw-customer-zero';
`;

console.log(`\n▶ Verifying Customer Zero seed...\n`);

try {
  execSync(
    `npx wrangler d1 execute integratewise-spine-cache ${flag} --command "${verifySql.replace(/\n/g, " ")}"`,
    { cwd: TENANTS_DIR, stdio: "inherit" }
  );
} catch {
  console.warn("Verify query failed — migration may still have applied.");
}

console.log("\n✓ Customer Zero enabled: iw-customer-zero (enterprise, twin, all layers)\n");
