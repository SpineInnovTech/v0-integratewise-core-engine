/**
 * Integration (real SQL via node:sqlite) — governed action loop persistence.
 * Validates HITL decision recording + Property 10 (outcome closes lineage AND
 * re-enters Memory only through the governed memory-promote queue).
 *
 * Run: NODE_OPTIONS=--experimental-sqlite npx vitest run src/action-loop.integration.test.ts
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  writeProposal,
  recordDecision,
  emitOutcome,
  type Proposal,
  type ProposalDecision,
} from "./action-loop";

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
    CREATE TABLE governance_data (
      id TEXT PRIMARY KEY, type TEXT, status TEXT, score REAL,
      proposal_data TEXT, created_at TEXT, updated_at TEXT
    );
    CREATE TABLE continuity_loop (
      id TEXT PRIMARY KEY, tenant_id TEXT, insight_id TEXT, proposal_id TEXT,
      decision TEXT, decided_by TEXT, approval_token TEXT, execution_id TEXT,
      execution_status TEXT, outcome TEXT, created_at TEXT, updated_at TEXT
    );
  `);
  return db;
}

const proposal: Proposal = {
  id: "prop-1",
  insightId: "ins-1",
  tenantId: "t1",
  action: { key: "escalate_ticket", params: { reason: "sla" } },
  evidence: [{ kind: "signal", id: "s1" }],
  rationale: "escalate",
  status: "proposed",
};

maybeDescribe("action loop — real SQL integration", () => {
  let db: any;
  beforeEach(() => {
    db = setupDb();
  });

  it("writes a proposal to the HITL store as pending_review", async () => {
    await writeProposal({ D1: makeD1(db) }, proposal);
    const row = db
      .prepare("SELECT type, status FROM governance_data WHERE id='prop-1'")
      .get() as any;
    expect(row.type).toBe("approval");
    expect(row.status).toBe("pending_review");
  });

  it("records an approve decision → governance approved + continuity_loop lineage with token", async () => {
    await writeProposal({ D1: makeD1(db) }, proposal);
    const decision: ProposalDecision = {
      proposalId: "prop-1",
      decision: "approve",
      decidedBy: "founder",
      approvalToken: "tok-123",
    };
    await recordDecision({ D1: makeD1(db) }, proposal, decision);

    const gov = db.prepare("SELECT status FROM governance_data WHERE id='prop-1'").get() as any;
    expect(gov.status).toBe("approved");

    const loop = db
      .prepare("SELECT * FROM continuity_loop WHERE proposal_id='prop-1'")
      .get() as any;
    expect(loop.decision).toBe("approve");
    expect(loop.approval_token).toBe("tok-123");
    expect(loop.insight_id).toBe("ins-1");
  });

  it("emitOutcome closes lineage AND feeds back via the governed queue (Property 10)", async () => {
    await writeProposal({ D1: makeD1(db) }, proposal);
    await recordDecision({ D1: makeD1(db) }, proposal, {
      proposalId: "prop-1",
      decision: "approve",
      decidedBy: "founder",
      approvalToken: "tok-123",
    });

    const sent: any[] = [];
    const fakeQueue = { send: async (m: any) => void sent.push(m) } as unknown as Queue;

    await emitOutcome({ D1: makeD1(db), MEMORY_PROMOTE: fakeQueue }, "t1", {
      proposalId: "prop-1",
      executionId: "exec-1",
      result: "positive",
    });

    const loop = db
      .prepare("SELECT * FROM continuity_loop WHERE proposal_id='prop-1'")
      .get() as any;
    expect(loop.execution_id).toBe("exec-1");
    expect(loop.execution_status).toBe("executed");
    expect(loop.outcome).toBe("positive");

    // Feedback re-enters Memory ONLY through the governed memory-promote queue.
    expect(sent).toHaveLength(1);
    expect(sent[0].event).toBe("spine.written");
    expect(sent[0].entity_type).toBe("decision");
    expect(sent[0].data.proposal_id).toBe("prop-1");
  });
});
