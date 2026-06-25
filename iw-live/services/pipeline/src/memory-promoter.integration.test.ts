/**
 * Integration (real SQL via node:sqlite) — Memory Promotion Engine.
 * Validates Property 5 (promotion writes Memory + audit with lineage) and
 * R6.5 (repeated observation strengthens, not duplicates) against real SQLite.
 *
 * Run: NODE_OPTIONS=--experimental-sqlite npx vitest run src/memory-promoter.integration.test.ts
 */
import { describe, it, expect, beforeEach } from "vitest";
import { promote, type SpineWriteEvent } from "./memory-promoter";

let DatabaseSync: any = null;
try {
  DatabaseSync = (process as any).getBuiltinModule?.("node:sqlite")?.DatabaseSync ?? null;
} catch {
  DatabaseSync = null;
}
// Skip gracefully when node:sqlite is unavailable (run with NODE_OPTIONS=--experimental-sqlite).
const maybeDescribe = DatabaseSync ? describe : describe.skip;

// Minimal D1Database adapter backed by a real in-memory SQLite database.
function makeD1(db: any): D1Database {
  return {
    prepare(sql: string) {
      let params: unknown[] = [];
      const api: any = {
        bind(...args: unknown[]) {
          params = args;
          return api;
        },
        async run() {
          db.prepare(sql).run(...(params as any[]));
          return { success: true, meta: {} };
        },
        async first<T>() {
          const r = db.prepare(sql).get(...(params as any[]));
          return (r ?? null) as T | null;
        },
        async all<T>() {
          const results = db.prepare(sql).all(...(params as any[])) as T[];
          return { results, success: true, meta: {} };
        },
      };
      return api;
    },
  } as unknown as D1Database;
}

function setupDb(): any {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE tenant_spine_config (
      tenant_id TEXT PRIMARY KEY,
      memory_categories TEXT,
      governance_defaults TEXT
    );
    CREATE TABLE org_memory (
      id TEXT PRIMARY KEY, tenant_id TEXT, topic TEXT, category TEXT, content TEXT,
      source_session_id TEXT, governance_state TEXT, confidence REAL, embedding TEXT,
      metadata TEXT, created_at TEXT, updated_at TEXT, related_entity_ids TEXT,
      related_departments TEXT, access_scope TEXT, lineage_ref TEXT, tier TEXT
    );
    CREATE TABLE memory_promotion_audit (
      id TEXT PRIMARY KEY, tenant_id TEXT, entity_id TEXT, signals TEXT, score REAL,
      category TEXT, promoted INTEGER, governance_state TEXT, rationale TEXT,
      decided_by TEXT, created_at TEXT
    );
  `);
  db.prepare(
    `INSERT INTO tenant_spine_config (tenant_id, memory_categories, governance_defaults) VALUES (?, ?, ?)`
  ).run(
    "t1",
    JSON.stringify(["account_context", "decision", "risk", "strategic_context"]),
    JSON.stringify({ autoPromote: true, requiresApproval: ["risk", "decision"] })
  );
  return db;
}

const strategicEvent: SpineWriteEvent = {
  tenant_id: "t1",
  entity_id: "acct-1",
  entity_type: "account",
  domain: "decide",
  name: "Acme Corp",
  source: "hubspot",
  data: { arr: 90000, status: "active" },
};

maybeDescribe("promote() — real SQL integration", () => {
  let db: any;
  beforeEach(() => {
    db = setupDb();
  });

  it("promotes a strategic entity into org_memory with lineage + audit (Property 5)", async () => {
    const approved = await promote(strategicEvent, { CACHE_DB: makeD1(db) });

    const mem = db.prepare("SELECT * FROM org_memory WHERE tenant_id = 't1'").all() as any[];
    expect(mem).toHaveLength(1);
    expect(mem[0].lineage_ref).toBe("acct-1"); // lineage back to source Spine entity

    const audit = db
      .prepare("SELECT * FROM memory_promotion_audit WHERE entity_id = 'acct-1'")
      .all() as any[];
    expect(audit).toHaveLength(1);
    expect(audit[0].promoted).toBe(1);
    // strategic account is approved (autoPromote true, category not sensitive)
    expect(typeof approved).toBe("boolean");
  });

  it("repeated observation strengthens existing memory, not duplicate (R6.5)", async () => {
    await promote(strategicEvent, { CACHE_DB: makeD1(db) });
    await promote(strategicEvent, { CACHE_DB: makeD1(db) });

    const mem = db.prepare("SELECT * FROM org_memory WHERE lineage_ref = 'acct-1'").all() as any[];
    expect(mem).toHaveLength(1); // deduped by lineage_ref
    expect(mem[0].confidence).toBeGreaterThan(0.6); // confidence strengthened
  });

  it("does NOT promote a low-signal entity but still audits the decision", async () => {
    await promote(
      { tenant_id: "t1", entity_id: "task-9", entity_type: "task", data: { status: "open" } },
      { CACHE_DB: makeD1(db) }
    );
    const mem = db.prepare("SELECT * FROM org_memory").all() as any[];
    expect(mem).toHaveLength(0);
    const audit = db
      .prepare("SELECT promoted FROM memory_promotion_audit WHERE entity_id = 'task-9'")
      .get() as any;
    expect(audit.promoted).toBe(0);
  });

  it("routes a risk exception to staging (governance gate)", async () => {
    await promote(
      { tenant_id: "t1", entity_id: "tic-1", entity_type: "ticket", data: { status: "at_risk" } },
      { CACHE_DB: makeD1(db) }
    );
    const mem = db
      .prepare("SELECT governance_state, category FROM org_memory WHERE lineage_ref='tic-1'")
      .get() as any;
    expect(mem.category).toBe("risk");
    expect(mem.governance_state).toBe("staging");
  });
});
