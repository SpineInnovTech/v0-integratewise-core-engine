#!/usr/bin/env node
/**
 * Continuity Runtime Proofs — verifies the spine-hydration-lifecycle end to end
 * against LIVE Cloudflare D1 + the deployed continuity worker.
 *
 * The 5 proofs (spine-hydration-lifecycle):
 *   1. Identity → Schema   : tenant_spine_config has v2 + identity-specific fields
 *   2. Creamy → Spine      : build_data (and spine entities) grow for the tenant
 *   3. Spine → Memory      : org_memory + memory_promotion_audit grow (real promotion)
 *   4. Memory → Continuity : assembleContinuity returns populated scopes
 *   5. Continuity → Twin   : (manual) Twin answers from continuity, not raw GitHub
 *
 * Usage:
 *   node scripts/verify-continuity-proofs.mjs <tenant_id> [--user <userId>] [--continuity-url <url>]
 *   node scripts/verify-continuity-proofs.mjs --baseline        # global counts only
 *
 * No deps. Node ESM only. Uses the OAuth wrangler session (unsets CLOUDFLARE_API_TOKEN).
 */
import { execFileSync } from "node:child_process";

const DB = "integratewise-spine-cache";
const CONTINUITY_URL_DEFAULT = "https://continuity.connect-a1b.workers.dev";

const args = process.argv.slice(2);
const baselineOnly = args.includes("--baseline");
const tenantId = args.find((a) => !a.startsWith("--"));
const userId = argValue("--user");
const continuityUrl = argValue("--continuity-url") || CONTINUITY_URL_DEFAULT;

function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : undefined;
}

/** Run a read-only SQL query against remote D1 and return parsed rows. */
function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN; // OAuth session is the correct auth
  const out = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", DB, "--remote", "--json", "--command", sql],
    { env, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }
  );
  // wrangler --json prints a JSON array of { results: [...] } (may be wrapped in log lines).
  const jsonStart = out.indexOf("[");
  const parsed = JSON.parse(out.slice(jsonStart));
  return parsed[0]?.results ?? [];
}

function count(sql) {
  const rows = d1(sql);
  return Number(Object.values(rows[0] ?? { n: 0 })[0] ?? 0);
}

function pass(b) {
  return b ? "✅ PASS" : "⏳ PENDING";
}

async function globalBaseline() {
  console.log("\n── Global baseline (no tenant) ─────────────────────────────");
  const c = d1(
    `SELECT
       (SELECT COUNT(*) FROM build_data) build_data,
       (SELECT COUNT(*) FROM org_memory) org_memory,
       (SELECT COUNT(*) FROM memory_promotion_audit) promo_audit,
       (SELECT COUNT(*) FROM continuity_loop) continuity_loop,
       (SELECT COUNT(*) FROM sync_checkpoints) sync_checkpoints`
  )[0];
  console.log(c);
}

async function tenantProofs(tid) {
  console.log(`\n══ Continuity Runtime Proofs · tenant=${tid} ══════════════════\n`);

  // ── Proof 1: Identity → Schema ──────────────────────────────────────────
  const cfg = d1(
    `SELECT department, industry, schema_version,
            allowed_entity_types, signal_types, memory_categories,
            connector_priorities, governance_defaults, twin_context
       FROM tenant_spine_config WHERE tenant_id = '${tid}' LIMIT 1`
  )[0];
  const p1 =
    !!cfg &&
    String(cfg.schema_version || "").includes("v2") &&
    !!cfg.department &&
    !!cfg.twin_context &&
    cfg.twin_context !== "{}";
  console.log(`Proof 1 — Identity → Schema   ${pass(p1)}`);
  if (cfg) {
    console.log(
      `   department=${cfg.department}  industry=${cfg.industry}  schema_version=${cfg.schema_version}`
    );
    console.log(`   signal_types=${cfg.signal_types}`);
    console.log(`   memory_categories=${cfg.memory_categories}`);
    console.log(`   connector_priorities=${cfg.connector_priorities}`);
    console.log(`   governance_defaults=${cfg.governance_defaults}`);
    console.log(`   twin_context=${cfg.twin_context}`);
  } else {
    console.log("   (no tenant_spine_config row yet — run onboarding)");
  }

  // ── Proof 2: Creamy → Spine (connector-agnostic: scan ALL domain partitions) ──
  const PARTITIONS = ["decide_data", "build_data", "grow_data", "run_data", "cross_data"];
  const perPartition = {};
  let spineTotal = 0;
  for (const p of PARTITIONS) {
    try {
      const n = count(`SELECT COUNT(*) n FROM ${p} WHERE tenant_id = '${tid}'`);
      perPartition[p] = n;
      spineTotal += n;
    } catch {
      perPartition[p] = "n/a";
    }
  }
  let spineEntities = 0;
  try {
    spineEntities = count(`SELECT COUNT(*) n FROM spine_entities WHERE tenant_id = '${tid}'`);
    spineTotal += spineEntities;
  } catch {
    /* table may not exist in this env */
  }
  const p2 = spineTotal > 0;
  console.log(`\nProof 2 — Creamy → Spine      ${pass(p2)}`);
  console.log(
    `   ${PARTITIONS.map((p) => `${p}=${perPartition[p]}`).join("  ")}  spine_entities=${spineEntities}`
  );

  // ── Proof 3: Spine → Memory ─────────────────────────────────────────────
  const orgMem = count(`SELECT COUNT(*) n FROM org_memory WHERE tenant_id = '${tid}'`);
  const audit = count(`SELECT COUNT(*) n FROM memory_promotion_audit WHERE tenant_id = '${tid}'`);
  const promoted = count(
    `SELECT COUNT(*) n FROM memory_promotion_audit WHERE tenant_id = '${tid}' AND promoted = 1`
  );
  const p3 = audit > 0; // the promoter actually ran on this tenant's Spine writes
  console.log(`\nProof 3 — Spine → Memory      ${pass(p3)}`);
  console.log(`   org_memory=${orgMem}  promotion_audit=${audit} (promoted=${promoted})`);

  // Show WHAT was remembered and WHY (the first real memory decisions).
  if (audit > 0) {
    const decisions = d1(
      `SELECT promoted, signals, score, category, substr(rationale,1,110) rationale
         FROM memory_promotion_audit WHERE tenant_id = '${tid}'
        ORDER BY created_at DESC LIMIT 6`
    );
    console.log(`   ── promotion decisions (newest) ──`);
    for (const r of decisions) {
      const mark = Number(r.promoted) === 1 ? "✓ promoted" : "· retained";
      console.log(`     ${mark}  [${r.category}] score=${r.score} signals=${r.signals}`);
      console.log(`        why: ${r.rationale}`);
    }
  }
  if (orgMem > 0) {
    const mems = d1(
      `SELECT topic, category, governance_state, substr(content,1,120) content, lineage_ref
         FROM org_memory WHERE tenant_id = '${tid}'
        ORDER BY created_at DESC LIMIT 6`
    );
    console.log(`   ── memories formed (newest) ──`);
    for (const m of mems) {
      console.log(
        `     [${m.category}/${m.governance_state}] ${m.topic}  ←lineage:${m.lineage_ref ?? "—"}`
      );
      console.log(`        ${m.content}`);
    }
  }

  // ── Proof 4: Memory → Continuity ────────────────────────────────────────
  let p4 = false;
  try {
    const headers = { "x-tenant-id": tid };
    if (userId) headers["x-user-id"] = userId;
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`${continuityUrl}/v1/continuity/assemble${qs}`, { headers });
    if (res.ok) {
      const b = await res.json();
      p4 = (b.totalMemories ?? 0) > 0;
      console.log(`\nProof 4 — Memory → Continuity ${pass(p4)}`);
      console.log(
        `   role=${b.role}  totalMemories=${b.totalMemories}  counts=${JSON.stringify(b.counts)}`
      );
      if (p4 && b.scopes) {
        for (const scope of ["org", "role", "team", "personal"]) {
          for (const m of (b.scopes[scope] || []).slice(0, 4)) {
            console.log(
              `     (${scope}) [${m.category}] ${m.topic}: ${String(m.content).slice(0, 90)}`
            );
          }
        }
      }
    } else {
      console.log(`\nProof 4 — Memory → Continuity ⚠️  assemble HTTP ${res.status}`);
    }
  } catch (err) {
    console.log(`\nProof 4 — Memory → Continuity ⚠️  ${err instanceof Error ? err.message : err}`);
  }

  // ── Proof 5: Continuity → Twin (manual) ─────────────────────────────────
  console.log(`\nProof 5 — Continuity → Twin   👤 MANUAL`);
  console.log(`   In the app, ask the Twin: "What changed in engineering this week?"`);
  console.log(`   PASS if it answers from continuity/spine (and activates once memory exists),`);
  console.log(`   not by reaching back to GitHub.`);

  console.log(`\n── Summary ─────────────────────────────────────────────────`);
  console.log(
    `   P1 schema=${p1 ? "✅" : "⏳"}  P2 spine=${p2 ? "✅" : "⏳"}  P3 memory=${p3 ? "✅" : "⏳"}  P4 continuity=${p4 ? "✅" : "⏳"}  P5 twin=manual`
  );
  console.log("");
}

(async () => {
  if (baselineOnly || !tenantId) {
    await globalBaseline();
    if (!tenantId) {
      console.log("\nPass a tenant_id to run the 5 proofs:");
      console.log("  node scripts/verify-continuity-proofs.mjs <tenant_id> --user <userId>\n");
    }
    return;
  }
  await tenantProofs(tenantId);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
