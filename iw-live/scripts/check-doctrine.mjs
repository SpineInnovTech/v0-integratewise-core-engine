#!/usr/bin/env node
/**
 * Doctrine drift-check (ratchet).
 *
 * Enforces AGENTS.md locked direction by counting banned terms across tracked
 * files and comparing to a baseline. It is a RATCHET:
 *   - Pre-existing usage is TOLERATED (baseline).
 *   - Adding NEW usage (count goes up) FAILS.
 *   - Removing usage (count goes down) PASSES and tightens the baseline.
 *
 * This implements the rule: "issues already present (not introduced this session)
 * are ignored; only new drift is flagged."
 *
 * Usage:
 *   node scripts/check-doctrine.mjs            # check (fails on new drift)
 *   node scripts/check-doctrine.mjs --update   # regenerate baseline from current state
 *
 * No dependencies. Node ESM only (TypeScript/Node-only repo rule).
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASELINE = path.join(ROOT, "scripts", "doctrine-baseline.json");
const UPDATE = process.argv.includes("--update");

/**
 * Banned patterns (case-insensitive). Each maps to the doctrine reason.
 * Nuanced terms (n8n, openwebui) are safe under the ratchet: legitimate
 * historical/customer-tool mentions sit in the baseline; only NEW additions fail.
 */
const PATTERNS = [
  {
    key: "supabase",
    re: /supabase/gi,
    why: "Cloudflare-only product plane (DECISION 22). No Supabase.",
  },
  {
    key: "openwebui",
    re: /open\s*webui/gi,
    why: "Twin runs entirely in Cloudflare (iw-agent-runtime). No OpenWebUI.",
  },
  {
    key: "dual_write",
    re: /dual[-\s]?write/gi,
    why: "June-1 dual-write axiom retired (DECISION 22). Single Cloudflare plane.",
  },
  { key: "couchdb", re: /couchdb/gi, why: "CouchDB removed permanently (May 2026)." },
  {
    key: "n8n_infra",
    re: /n8n/gi,
    why: "Workflows are Cloudflare Workflows/Queues. n8n only as a customer-owned tool, never IW infra.",
  },
  {
    key: "etl_insert_select",
    re: /insert\s+into[^;`]*?\bselect\b/gi,
    why: "No ETL (R9 / spine-hydration-lifecycle). Table-to-table copy (INSERT…SELECT within one statement) is banned; the Spine is normalizer-driven (Connector→Normalizer→Spine→Projection).",
  },
  {
    key: "etl_bulk_copy",
    re: /\b(table[-_\s]?to[-_\s]?table|bulk[-_\s]?cop(?:y|ies)|etl[-_\s]?(?:job|pipeline|transaction)|batch[-_\s]?(?:load|copy))\b/gi,
    why: "No ETL (R9 / spine-hydration-lifecycle). Bulk/batch copy jobs are banned; reality flows Connector→Normalizer→Spine→Projection.",
  },
];

// Files that legitimately DISCUSS the bans (doctrine, trackers, this script).
// Excluded from the scan so narrating a ban doesn't trip it.
const ALLOWLIST = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "scripts/check-doctrine.mjs",
  ".kiro/doctrine-baseline.json",
  "scripts/doctrine-baseline.json",
  "docs/migrations/DE_SUPABASE_MIGRATION.md",
  "docs/operations/DEPLOYMENT_RUNBOOK.md",
  "docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md",
  "docs/architecture/SPINE_MODEL.md",
  "docs/architecture/PRODUCT_ARCHITECTURE.md",
  "docs/architecture/END_TO_END_ARCHITECTURE.md",
  "docs/architecture/FRONTEND_LAYERED_STACK.md",
  "docs/architecture/PROJECTION_MODEL.md",
  "docs/architecture/ONBOARDING_FLOW.md",
  "docs/architecture/CURRENT_CONTEXT_FLOW.md",
  "docs/CANON.md",
]);

// Superseded/historical docs carry old terms on purpose (they have banners).
const ALLOW_PREFIXES = ["docs/ip/", "workflows/", ".iw-memory/"];

const EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".toml",
  ".md",
  ".sql",
]);

function trackedFiles() {
  const out = execSync("git ls-files", {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out
    .split("\n")
    .filter(Boolean)
    .filter((f) => {
      if (ALLOWLIST.has(f)) return false;
      if (ALLOW_PREFIXES.some((p) => f.startsWith(p))) return false;
      if (f.includes("node_modules/") || f.includes("/dist/") || f.startsWith(".pnpm-store/"))
        return false;
      return EXTS.has(path.extname(f));
    });
}

function countAll() {
  const counts = Object.fromEntries(PATTERNS.map((p) => [p.key, 0]));
  const offenders = Object.fromEntries(PATTERNS.map((p) => [p.key, []]));
  for (const file of trackedFiles()) {
    let text;
    try {
      text = readFileSync(path.join(ROOT, file), "utf8");
    } catch {
      continue;
    }
    for (const p of PATTERNS) {
      const m = text.match(p.re);
      if (m && m.length) {
        counts[p.key] += m.length;
        offenders[p.key].push(`${file} (${m.length})`);
      }
    }
  }
  return { counts, offenders };
}

const { counts, offenders } = countAll();

if (UPDATE || !existsSync(BASELINE)) {
  writeFileSync(
    BASELINE,
    JSON.stringify({ updated: new Date().toISOString(), counts }, null, 2) + "\n"
  );
  console.log(`[doctrine] baseline written → ${path.relative(ROOT, BASELINE)}`);
  console.log(JSON.stringify(counts, null, 2));
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8")).counts || {};
let failed = false;
let tightened = false;

for (const p of PATTERNS) {
  const now = counts[p.key] || 0;
  const base = baseline[p.key] ?? 0;
  if (now > base) {
    failed = true;
    console.error(`\n❌ DRIFT: "${p.key}" increased ${base} → ${now}`);
    console.error(`   Why this is banned: ${p.why}`);
    console.error(`   Files: ${offenders[p.key].join(", ")}`);
  } else if (now < base) {
    tightened = true;
    console.log(`✅ "${p.key}" reduced ${base} → ${now} (ratchet tightened)`);
  }
}

if (failed) {
  console.error(`\nDoctrine drift detected. You added usage of a retired technology.`);
  console.error(
    `If this is intentional and approved by Nirmal, update AGENTS.md + run: node scripts/check-doctrine.mjs --update`
  );
  process.exit(1);
}

if (tightened) {
  // Ratchet down so the new lower count becomes the ceiling.
  writeFileSync(
    BASELINE,
    JSON.stringify({ updated: new Date().toISOString(), counts }, null, 2) + "\n"
  );
  console.log(`\n[doctrine] baseline tightened.`);
}

console.log(`✅ doctrine check passed (no new drift).`);
process.exit(0);
