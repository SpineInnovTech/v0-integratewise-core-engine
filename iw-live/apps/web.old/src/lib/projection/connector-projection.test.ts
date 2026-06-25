/**
 * Unit tests for the pure connector projection selector.
 * Run: node --import tsx --test src/lib/projection/connector-projection.test.ts
 * Spec: role-industry-projection (R2, R3).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scoreConnector,
  selectConnectors,
  type ConnectorCatalogEntry,
} from "./connector-projection.ts";

// Seedable RNG (mulberry32) for deterministic tie-break tests.
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function entry(provider: string, category = "tool"): ConnectorCatalogEntry {
  return { id: provider, provider, label: provider, category };
}

const CATALOG: ConnectorCatalogEntry[] = [
  "salesforce",
  "hubspot",
  "zendesk",
  "intercom",
  "jira",
  "github",
  "linear",
  "slack",
  "stripe",
  "quickbooks",
  "notion",
  "shopify",
].map((p) => entry(p));

test("scoreConnector: role match dominates industry match", () => {
  // hubspot serves SALES (role +2), industry "*" (+1) => 3
  assert.equal(scoreConnector(entry("hubspot"), "SALES", "SAAS_TECH"), 3);
  // github serves PRODUCT_ENGINEERING only, industry SAAS_TECH => role +2 + industry +1 = 3
  assert.equal(scoreConnector(entry("github"), "PRODUCT_ENGINEERING", "SAAS_TECH"), 3);
  // github for a FINANCE role in RETAIL => no role, no industry match => 0
  assert.equal(scoreConnector(entry("github"), "FINANCE", "RETAIL"), 0);
});

test("selects exactly 5 when catalog >= 5", () => {
  const out = selectConnectors({
    catalog: CATALOG,
    role: "CUSTOMER_SUCCESS",
    industry: "SAAS_TECH",
    rng: seeded(1),
  });
  assert.equal(out.length, 5);
});

test("returns all when catalog < 5", () => {
  const small = CATALOG.slice(0, 3);
  const out = selectConnectors({
    catalog: small,
    role: "SALES",
    industry: "SAAS_TECH",
    rng: seeded(1),
  });
  assert.equal(out.length, 3);
});

test("no duplicate providers", () => {
  const dupd = [...CATALOG, entry("slack"), entry("hubspot")];
  const out = selectConnectors({ catalog: dupd, role: "SALES", industry: "*", rng: seeded(2) });
  const providers = out.map((c) => c.provider);
  assert.equal(new Set(providers).size, providers.length);
});

test("role differentiation: same industry, different role => different sets", () => {
  const cs = selectConnectors({
    catalog: CATALOG,
    role: "CUSTOMER_SUCCESS",
    industry: "SAAS_TECH",
    rng: seeded(7),
  });
  const fin = selectConnectors({
    catalog: CATALOG,
    role: "FINANCE",
    industry: "SAAS_TECH",
    rng: seeded(7),
  });
  const csTop = cs
    .map((c) => c.provider)
    .sort()
    .join(",");
  const finTop = fin
    .map((c) => c.provider)
    .sort()
    .join(",");
  assert.notEqual(csTop, finTop);
  // Finance must surface stripe/quickbooks (the only finance-relevant in catalog)
  assert.ok(fin.some((c) => c.provider === "stripe" || c.provider === "quickbooks"));
});

test("industry differentiation: same role, different industry => reflected", () => {
  const saas = selectConnectors({
    catalog: CATALOG,
    role: "FINANCE",
    industry: "SAAS_TECH",
    rng: seeded(3),
  });
  // stripe is industry-relevant to SAAS_TECH but quickbooks is "*"; both are role-relevant.
  assert.ok(saas.some((c) => c.provider === "stripe"));
});

test("seeded RNG is deterministic", () => {
  const a = selectConnectors({ catalog: CATALOG, role: "SALES", industry: "*", rng: seeded(42) });
  const b = selectConnectors({ catalog: CATALOG, role: "SALES", industry: "*", rng: seeded(42) });
  assert.deepEqual(
    a.map((c) => c.provider),
    b.map((c) => c.provider)
  );
});

test("excludes zero-score connectors when >= 5 matches exist", () => {
  // Many SALES-relevant + some irrelevant. With >=5 matches, no score-0 entry should appear.
  const out = selectConnectors({ catalog: CATALOG, role: "SALES", industry: "*", rng: seeded(9) });
  for (const c of out) {
    assert.ok(scoreConnector(c, "SALES", "*") > 0, `${c.provider} should be a match`);
  }
});

test("tie randomization reaches different members across seeds", () => {
  // All-industry "*" with a role that ties many at the same score; seeds should vary picks.
  const s1 = selectConnectors({ catalog: CATALOG, role: "BIZOPS", industry: "*", rng: seeded(1) })
    .map((c) => c.provider)
    .join(",");
  const s2 = selectConnectors({ catalog: CATALOG, role: "BIZOPS", industry: "*", rng: seeded(999) })
    .map((c) => c.provider)
    .join(",");
  assert.notEqual(s1, s2);
});
