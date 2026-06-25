import { describe, expect, it, vi } from "vitest";

import { fuseSources, type FusedSources } from "./fusion";
import { createProposedActions, getActionTemplates, type Situation } from "./actions";

function createMockD1(): D1Database {
  const stmt = {
    bind: vi.fn(),
    all: vi.fn(async () => ({ results: [] as any[] })),
    first: vi.fn(async () => null),
    run: vi.fn(async () => ({})),
  };

  // `prepare(...).bind(...).all()` style chain
  (stmt.bind as any).mockImplementation(() => stmt);

  return {
    prepare: vi.fn(() => stmt as any),
    batch: vi.fn(async () => []),
  } as unknown as D1Database;
}

function createSituation(overrides: Partial<Situation> = {}): Situation {
  return {
    id: "situation-001",
    situation_key: "churn.risk",
    entity_type: "client",
    entity_id: "client-001",
    tenant_id: "tenant-001",
    severity: "high",
    ...overrides,
  };
}

function createFusedSources(overrides: Partial<FusedSources> = {}): FusedSources {
  return {
    spine: { signals: [], metrics: [], events: [] },
    context: { artifacts: [], emails: [], documents: [], semantic_chunks: [] },
    ai: { sessions: [], insights: [], semantic_sessions: [] },
    evidence_refs: [],
    plane_status: { A: "empty", B: "empty", C: "empty" },
    ...overrides,
  } as FusedSources;
}

describe("Think: Fusion", () => {
  it("fuseSources() returns missing plane markers when DB has no rows", async () => {
    const db = createMockD1();

    const result = await fuseSources(db, undefined, "client", "client-001", "tenant-001");

    expect(result.plane_status.A).toBe("empty");
    expect(result.plane_status.B).toBe("empty");
    expect(result.plane_status.C).toBe("empty");
    expect(result.evidence_refs.some((r) => r.is_missing_marker)).toBe(true);
  });

  it("createProposedActions() creates fallback action for unknown situations", async () => {
    const db = createMockD1();
    const situation = createSituation({ situation_key: "unknown.situation.type" });
    const sources = createFusedSources();

    const actions = await createProposedActions(db, situation, sources, ["evidence-001"]);

    expect(actions.some((a) => a.action_key === "review_situation")).toBe(true);
    expect((db as any).batch).toHaveBeenCalled();
  });

  it("getActionTemplates() returns templates for known situations", () => {
    const templates = getActionTemplates("churn.risk");
    expect(templates.some((t) => t.action_key === "schedule_health_call")).toBe(true);
  });
});
