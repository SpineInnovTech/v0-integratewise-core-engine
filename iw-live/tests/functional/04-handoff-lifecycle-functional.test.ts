/**
 * Functional Tests — Handoff Package Lifecycle
 */

import { describe, it, expect } from "vitest";
import { isValidTransition, HandoffPackageSchema, HANDOFF_STATES } from "../../packages/types/src/handoff";

describe("Functional: Handoff Package Schema Validation", () => {
  const validPackage = {
    package_id: "550e8400-e29b-41d4-a716-446655440000",
    proposal_id: "660e8400-e29b-41d4-a716-446655440001",
    tenant_id: "tenant-001",
    tenant_class: "external",
    adapter_target: "json",
    action: { kind: "update_status", target: "hubspot.deal", params: { status: "won" } },
    evidence: [{ fact_id: "fact-001", confidence: 0.95 }],
    success_criteria: [{ id: "sc-1", description: "Deal updated", verifiable: true }],
    governance_stamp: {
      decision_id: "770e8400-e29b-41d4-a716-446655440002",
      policy_id: "policy-standard",
      approver: "user-admin",
      decided_at: "2026-06-19T12:00:00.000Z",
      audit_id: "880e8400-e29b-41d4-a716-446655440003",
    },
    idempotency_key: "idem-001",
    created_at: "2026-06-19T12:00:00.000Z",
    expires_at: "2026-06-19T13:00:00.000Z",
    state: "PROPOSED",
  };

  it("valid package parses successfully", () => {
    const result = HandoffPackageSchema.safeParse(validPackage);
    expect(result.success).toBe(true);
  });

  it("rejects package without governance_stamp", () => {
    const { governance_stamp, ...noStamp } = validPackage;
    const result = HandoffPackageSchema.safeParse(noStamp);
    expect(result.success).toBe(false);
  });

  it("rejects package without evidence array", () => {
    const { evidence, ...noEvidence } = validPackage;
    const result = HandoffPackageSchema.safeParse(noEvidence);
    expect(result.success).toBe(false);
  });

  it("rejects package with invalid state", () => {
    const result = HandoffPackageSchema.safeParse({ ...validPackage, state: "INVALID_STATE" });
    expect(result.success).toBe(false);
  });

  it("rejects package with invalid adapter_target", () => {
    const result = HandoffPackageSchema.safeParse({ ...validPackage, adapter_target: "unknown" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid adapter targets", () => {
    for (const target of ["json", "mcp", "openclaw", "langgraph", "zapier", "n8n"]) {
      const result = HandoffPackageSchema.safeParse({ ...validPackage, adapter_target: target });
      expect(result.success).toBe(true);
    }
  });

  it("rejects package with empty tenant_id", () => {
    const result = HandoffPackageSchema.safeParse({ ...validPackage, tenant_id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects package with empty idempotency_key", () => {
    const result = HandoffPackageSchema.safeParse({ ...validPackage, idempotency_key: "" });
    expect(result.success).toBe(false);
  });

  it("confidence must be between 0 and 1", () => {
    const overOne = { ...validPackage, evidence: [{ fact_id: "f1", confidence: 1.5 }] };
    expect(HandoffPackageSchema.safeParse(overOne).success).toBe(false);

    const negative = { ...validPackage, evidence: [{ fact_id: "f1", confidence: -0.1 }] };
    expect(HandoffPackageSchema.safeParse(negative).success).toBe(false);

    const valid = { ...validPackage, evidence: [{ fact_id: "f1", confidence: 0.0 }] };
    expect(HandoffPackageSchema.safeParse(valid).success).toBe(true);
  });
});

describe("Functional: Complete Lifecycle Path", () => {
  it("happy path: PROPOSED → APPROVED → EXECUTING → AWAITING_OUTCOME → COMPLETED", () => {
    const path: [string, string][] = [
      ["PROPOSED", "APPROVED"],
      ["APPROVED", "EXECUTING"],
      ["EXECUTING", "AWAITING_OUTCOME"],
      ["AWAITING_OUTCOME", "COMPLETED"],
    ];
    for (const [from, to] of path) {
      expect(isValidTransition(from as any, to as any)).toBe(true);
    }
  });

  it("failure path: PROPOSED → APPROVED → EXECUTING → FAILED", () => {
    expect(isValidTransition("PROPOSED", "APPROVED")).toBe(true);
    expect(isValidTransition("APPROVED", "EXECUTING")).toBe(true);
    expect(isValidTransition("EXECUTING", "FAILED")).toBe(true);
  });

  it("timeout path: PROPOSED → APPROVED → EXECUTING → AWAITING_OUTCOME → FAILED", () => {
    expect(isValidTransition("EXECUTING", "AWAITING_OUTCOME")).toBe(true);
    expect(isValidTransition("AWAITING_OUTCOME", "FAILED")).toBe(true);
  });

  it("rejection path: PROPOSED → CANCELLED", () => {
    expect(isValidTransition("PROPOSED", "CANCELLED")).toBe(true);
  });
});
