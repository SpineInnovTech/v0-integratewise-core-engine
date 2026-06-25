/**
 * Functional Tests — Approval Center & State Machine
 *
 * Tests all state transitions and governance enforcement.
 */

import { describe, it, expect } from "vitest";
import { isValidTransition, ALLOWED_TRANSITIONS, HANDOFF_STATES, type HandoffState } from "../../packages/types/src/handoff";

describe("Functional: State Machine Transitions", () => {
  it("PROPOSED → APPROVED is valid", () => {
    expect(isValidTransition("PROPOSED", "APPROVED")).toBe(true);
  });

  it("PROPOSED → CANCELLED is valid (rejection)", () => {
    expect(isValidTransition("PROPOSED", "CANCELLED")).toBe(true);
  });

  it("APPROVED → EXECUTING is valid (dispatch)", () => {
    expect(isValidTransition("APPROVED", "EXECUTING")).toBe(true);
  });

  it("EXECUTING → AWAITING_OUTCOME is valid", () => {
    expect(isValidTransition("EXECUTING", "AWAITING_OUTCOME")).toBe(true);
  });

  it("EXECUTING → FAILED is valid (dispatch error)", () => {
    expect(isValidTransition("EXECUTING", "FAILED")).toBe(true);
  });

  it("AWAITING_OUTCOME → COMPLETED is valid (success outcome)", () => {
    expect(isValidTransition("AWAITING_OUTCOME", "COMPLETED")).toBe(true);
  });

  it("AWAITING_OUTCOME → FAILED is valid (failure/timeout)", () => {
    expect(isValidTransition("AWAITING_OUTCOME", "FAILED")).toBe(true);
  });

  it("any non-terminal state → CANCELLED is valid (manual cancel)", () => {
    const nonTerminal: HandoffState[] = ["PROPOSED", "APPROVED", "EXECUTING", "AWAITING_OUTCOME", "COMPLETED", "FAILED"];
    for (const state of nonTerminal) {
      expect(isValidTransition(state, "CANCELLED")).toBe(true);
    }
  });

  it("CANCELLED is terminal (no transitions out)", () => {
    for (const target of HANDOFF_STATES) {
      if (target === "CANCELLED") continue;
      expect(isValidTransition("CANCELLED", target)).toBe(false);
    }
  });

  // Governance enforcement — CANNOT skip states
  it("PROPOSED → EXECUTING is INVALID (must approve first)", () => {
    expect(isValidTransition("PROPOSED", "EXECUTING")).toBe(false);
  });

  it("PROPOSED → AWAITING_OUTCOME is INVALID", () => {
    expect(isValidTransition("PROPOSED", "AWAITING_OUTCOME")).toBe(false);
  });

  it("PROPOSED → COMPLETED is INVALID", () => {
    expect(isValidTransition("PROPOSED", "COMPLETED")).toBe(false);
  });

  it("PROPOSED → FAILED is INVALID", () => {
    expect(isValidTransition("PROPOSED", "FAILED")).toBe(false);
  });

  it("APPROVED → COMPLETED is INVALID (must execute first)", () => {
    expect(isValidTransition("APPROVED", "COMPLETED")).toBe(false);
  });

  it("APPROVED → AWAITING_OUTCOME is INVALID (must execute first)", () => {
    expect(isValidTransition("APPROVED", "AWAITING_OUTCOME")).toBe(false);
  });
});

describe("Functional: Governance Stamp Integrity", () => {
  it("ALLOWED_TRANSITIONS is exhaustive (covers all states)", () => {
    for (const state of HANDOFF_STATES) {
      expect(ALLOWED_TRANSITIONS[state]).toBeDefined();
      expect(Array.isArray(ALLOWED_TRANSITIONS[state])).toBe(true);
    }
  });

  it("no state can transition to itself", () => {
    for (const state of HANDOFF_STATES) {
      expect(isValidTransition(state, state)).toBe(false);
    }
  });
});
