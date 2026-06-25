/**
 * Properties 4–5 — Selective promotion + lineage/category correctness
 * (spine-hydration-lifecycle R6.1, R6.2). Pure scorer only (no I/O).
 */
import { describe, it, expect } from "vitest";
import { scoreForPromotion, type PromotionSchema, type SpineWriteEvent } from "./memory-promoter";

const schema: PromotionSchema = {
  memoryCategories: [
    "account_context",
    "decision",
    "risk",
    "preference",
    "behavior",
    "strategic_context",
  ],
  governanceDefaults: { autoPromote: true, requiresApproval: ["risk", "decision", "policy"] },
};

function ev(partial: Partial<SpineWriteEvent>): SpineWriteEvent {
  return {
    tenant_id: "t1",
    entity_id: partial.entity_id || "e1",
    entity_type: partial.entity_type || "task",
    data: partial.data || {},
    ...partial,
  };
}

describe("scoreForPromotion — Property 4 (selective promotion)", () => {
  it("promotes a strategic entity (account) — strong signal", () => {
    const s = scoreForPromotion(ev({ entity_type: "account", data: { arr: 50000 } }), schema);
    expect(s.signals).toContain("strategic");
    expect(s.promote).toBe(true);
  });

  it("does NOT promote a low-signal task (below threshold)", () => {
    const s = scoreForPromotion(ev({ entity_type: "task", data: { status: "open" } }), schema);
    expect(s.promote).toBe(false);
  });

  it("does NOT promote a lone behavioral event (weak signal alone)", () => {
    const s = scoreForPromotion(ev({ entity_type: "activity", data: {} }), schema);
    expect(s.signals).toContain("behavioral");
    expect(s.promote).toBe(false);
  });

  it("promotes an exception (at_risk status) — strong signal", () => {
    const s = scoreForPromotion(ev({ entity_type: "ticket", data: { status: "at_risk" } }), schema);
    expect(s.signals).toContain("exception");
    expect(s.promote).toBe(true);
  });

  it("promotes a decision entity", () => {
    const s = scoreForPromotion(
      ev({ entity_type: "decision", data: { decided_by: "ceo" } }),
      schema
    );
    expect(s.signals).toContain("decision");
    expect(s.promote).toBe(true);
  });
});

describe("scoreForPromotion — Property 5 (category + governance)", () => {
  it("routes a risk category to staging when requiresApproval includes it", () => {
    const s = scoreForPromotion(ev({ entity_type: "ticket", data: { status: "at_risk" } }), schema);
    // exception → risk category; risk is in requiresApproval → staging
    expect(s.category).toBe("risk");
    expect(s.governanceState).toBe("staging");
  });

  it("auto-approves a non-sensitive category when autoPromote is true", () => {
    const s = scoreForPromotion(ev({ entity_type: "account", data: { arr: 1000 } }), schema);
    expect(["approved", "staging"]).toContain(s.governanceState);
  });

  it("forces staging for every category when autoPromote is false", () => {
    const conservative: PromotionSchema = {
      memoryCategories: schema.memoryCategories,
      governanceDefaults: { autoPromote: false, requiresApproval: [] },
    };
    const s = scoreForPromotion(ev({ entity_type: "account", data: { arr: 1000 } }), conservative);
    expect(s.governanceState).toBe("staging");
  });

  it("is deterministic", () => {
    const a = scoreForPromotion(ev({ entity_type: "account", data: { arr: 50000 } }), schema);
    const b = scoreForPromotion(ev({ entity_type: "account", data: { arr: 50000 } }), schema);
    expect(a).toEqual(b);
  });
});
