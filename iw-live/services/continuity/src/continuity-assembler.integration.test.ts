/**
 * Integration (real SQL via node:sqlite) — Continuity assembler.
 * Validates scope-governance (only APPROVED org memory surfaces; staging withheld),
 * role auto-resolution from twin_context.department, and threshold passthrough.
 *
 * Run: NODE_OPTIONS=--experimental-sqlite npx vitest run src/continuity-assembler.integration.test.ts
 */
import { describe, it, expect, beforeEach } from "vitest";
import { assembleContinuity } from "./continuity-assembler";

let DatabaseSync: any = null;
try {
  DatabaseSync = (process as any).getBuiltinModule?.("node:sqlite")?.DatabaseSync ?? null;
} catch {
  DatabaseSync = null;
}
const maybeDescribe = DatabaseSync ? describe : describe.skip;

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
          return (db.prepare(sql).get(...(params as any[])) ?? null) as T | null;
        },
        async all<T>() {
          return {
            results: db.prepare(sql).all(...(params as any[])) as T[],
            success: true,
            meta: {},
          };
        },
      };
      return api;
    },
  } as unknown as D1Database;
}

function setupDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE tenant_spine_config (tenant_id TEXT PRIMARY KEY, twin_context TEXT);
    CREATE TABLE org_memory (
      id TEXT PRIMARY KEY, tenant_id TEXT, topic TEXT, category TEXT, content TEXT,
      confidence REAL, updated_at TEXT, created_at TEXT, governance_state TEXT,
      access_scope TEXT, related_departments TEXT, lineage_ref TEXT
    );
    CREATE TABLE personal_memory (
      id TEXT PRIMARY KEY, tenant_id TEXT, user_id TEXT, title TEXT, category TEXT,
      content TEXT, updated_at TEXT, created_at TEXT
    );
  `);
  db.prepare(`INSERT INTO tenant_spine_config (tenant_id, twin_context) VALUES (?, ?)`).run(
    "t1",
    JSON.stringify({
      role: "SALES",
      department: "SALES",
      industry: "saas",
      activationThresholds: { minMemories: 3, minSignals: 0, requireCreamy: false },
    })
  );
  const ins = db.prepare(
    `INSERT INTO org_memory (id, tenant_id, topic, category, content, confidence, updated_at, created_at, governance_state, access_scope, related_departments, lineage_ref)
     VALUES (?, 't1', ?, ?, ?, ?, '2026-01-01', '2026-01-01', ?, ?, ?, ?)`
  );
  ins.run(
    "o1",
    "Approved org",
    "account_context",
    "approved org memory",
    0.9,
    "approved",
    "org",
    "[]",
    "e1"
  );
  ins.run("o2", "Staging org", "risk", "staging memory", 0.8, "staging", "org", "[]", "e2");
  ins.run(
    "o3",
    "Sales role",
    "decision",
    "sales role memory",
    0.7,
    "approved",
    "role",
    '["SALES"]',
    "e3"
  );
  db.prepare(
    `INSERT INTO personal_memory (id, tenant_id, user_id, title, category, content, updated_at, created_at)
     VALUES ('p1', 't1', 'u1', 'Pref', 'preference', 'likes morning briefs', '2026-01-01', '2026-01-01')`
  ).run();
  return db;
}

maybeDescribe("assembleContinuity — real SQL integration", () => {
  let db: any;
  beforeEach(() => {
    db = setupDb();
  });

  it("surfaces only APPROVED org memory (staging withheld)", async () => {
    const bundle = await assembleContinuity(makeD1(db), { tenantId: "t1", userId: "u1" });
    const orgIds = bundle.scopes.org.map((m) => m.id);
    expect(orgIds).toContain("o1");
    expect(orgIds).not.toContain("o2"); // staging is governed-out
  });

  it("auto-resolves role from twin_context.department (SALES) and fills role scope", async () => {
    const bundle = await assembleContinuity(makeD1(db), { tenantId: "t1", userId: "u1" });
    expect(bundle.role).toBe("SALES");
    expect(bundle.scopes.role.map((m) => m.id)).toContain("o3");
  });

  it("scopes personal memory to the requesting user", async () => {
    const bundle = await assembleContinuity(makeD1(db), { tenantId: "t1", userId: "u1" });
    expect(bundle.scopes.personal.map((m) => m.id)).toContain("p1");
  });

  it("returns identity activation thresholds from twin_context", async () => {
    const bundle = await assembleContinuity(makeD1(db), { tenantId: "t1", userId: "u1" });
    expect(bundle.activationThresholds).toEqual({
      minMemories: 3,
      minSignals: 0,
      requireCreamy: false,
    });
  });

  it("totals reflect governed memory only", async () => {
    const bundle = await assembleContinuity(makeD1(db), { tenantId: "t1", userId: "u1" });
    // o1 (org) + o3 (role) + p1 (personal) = 3; o2 staging excluded
    expect(bundle.totalMemories).toBe(3);
  });
});
