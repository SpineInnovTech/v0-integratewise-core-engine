/**
 * Properties 7–9 — Insight never executes; execution requires an approved
 * proposal; modified proposals execute the modified action.
 * (spine-hydration-lifecycle R13.4, R15.2, R15.4, R16.1–16.3)
 */
import { describe, it, expect } from "vitest";
import {
  formInsights,
  formProposal,
  resolveExecutableAction,
  assertApprovedForExecution,
  ExecutionDeniedError,
  type Proposal,
  type ProposalDecision,
  type Signal,
} from "./action-loop";

describe("formInsights — Property 7 (observation only, no execution)", () => {
  it("creates observations from high-severity signals, with evidence", () => {
    const signals: Signal[] = [
      { id: "s1", type: "renewal_risk", severity: "high", message: "Renewal slipping" },
      { id: "s2", type: "noise", severity: "low" },
    ];
    const insights = formInsights("t1", signals, {});
    expect(insights).toHaveLength(1);
    expect(insights[0].evidence[0]).toEqual({ kind: "signal", id: "s1", note: "renewal_risk" });
  });

  it("surfaces risk memories from continuity", () => {
    const insights = formInsights("t1", [], {
      scopes: { org: [{ id: "m1", category: "risk", topic: "Churn", content: "ARR at risk" }] },
    });
    expect(insights.some((i) => i.evidence[0].kind === "memory")).toBe(true);
  });

  it("produces no execution side effect (pure)", () => {
    const before = JSON.stringify({});
    formInsights("t1", [{ id: "s1", type: "x", severity: "critical" }], {});
    expect(JSON.stringify({})).toBe(before);
  });
});

describe("formProposal — recommendation, never executes (R14.3)", () => {
  it("maps a renewal-risk insight to a proposal in 'proposed' status", () => {
    const [insight] = formInsights(
      "t1",
      [{ id: "s1", type: "renewal_risk", severity: "high" }],
      {}
    );
    const proposal = formProposal(insight);
    expect(proposal?.status).toBe("proposed");
    expect(proposal?.action.key).toBe("schedule_executive_review");
  });

  it("returns null when not actionable", () => {
    const insight = { id: "i", tenantId: "t1", observation: "fyi", evidence: [], createdAt: "" };
    expect(formProposal(insight)).toBeNull();
  });
});

const proposal: Proposal = {
  id: "p1",
  insightId: "i1",
  tenantId: "t1",
  action: { key: "escalate_ticket", params: { reason: "sla" } },
  evidence: [],
  rationale: "",
  status: "proposed",
};

describe("resolveExecutableAction — Property 9 (modified executes modified)", () => {
  it("approve → original action", () => {
    const d: ProposalDecision = { proposalId: "p1", decision: "approve", decidedBy: "u" };
    expect(resolveExecutableAction(proposal, d)).toEqual(proposal.action);
  });

  it("modify → modified action, not original", () => {
    const modified = { key: "escalate_ticket", params: { reason: "override" } };
    const d: ProposalDecision = {
      proposalId: "p1",
      decision: "modify",
      modifiedAction: modified,
      decidedBy: "u",
    };
    expect(resolveExecutableAction(proposal, d)).toEqual(modified);
  });

  it("reject/delegate/schedule → no executable action", () => {
    for (const decision of ["reject", "delegate", "schedule"] as const) {
      expect(
        resolveExecutableAction(proposal, { proposalId: "p1", decision, decidedBy: "u" })
      ).toBeNull();
    }
  });
});

describe("assertApprovedForExecution — Property 8 (no Insight→Execution)", () => {
  it("denies when there is no decision", () => {
    expect(() => assertApprovedForExecution("p1", null, "tok")).toThrow(ExecutionDeniedError);
  });

  it("denies a rejected decision", () => {
    const d: ProposalDecision = {
      proposalId: "p1",
      decision: "reject",
      decidedBy: "u",
      approvalToken: "tok",
    };
    expect(() => assertApprovedForExecution("p1", d, "tok")).toThrow(ExecutionDeniedError);
  });

  it("denies a missing/mismatched approval token", () => {
    const d: ProposalDecision = {
      proposalId: "p1",
      decision: "approve",
      decidedBy: "u",
      approvalToken: "tok",
    };
    expect(() => assertApprovedForExecution("p1", d, undefined)).toThrow(ExecutionDeniedError);
    expect(() => assertApprovedForExecution("p1", d, "wrong")).toThrow(ExecutionDeniedError);
  });

  it("allows an approved decision with a matching token", () => {
    const d: ProposalDecision = {
      proposalId: "p1",
      decision: "approve",
      decidedBy: "u",
      approvalToken: "tok",
    };
    expect(() => assertApprovedForExecution("p1", d, "tok")).not.toThrow();
  });

  it("denies when the token belongs to a different proposal", () => {
    const d: ProposalDecision = {
      proposalId: "other",
      decision: "approve",
      decidedBy: "u",
      approvalToken: "tok",
    };
    expect(() => assertApprovedForExecution("p1", d, "tok")).toThrow(ExecutionDeniedError);
  });
});
