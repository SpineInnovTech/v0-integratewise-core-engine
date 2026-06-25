/**
 * Functional Tests — Outcome Ingestion
 */

import { describe, it, expect } from "vitest";
import { OutcomeEventSchema } from "../../services/intelligence/src/handoff/outcome-ingestion";

describe("Functional: Outcome Event Schema", () => {
  const validOutcome = {
    handoff_id: "550e8400-e29b-41d4-a716-446655440000",
    status: "success",
    evidence: [{ kind: "api_response", url: "https://proof.example.com", details: { code: 200 } }],
    source: "customer-agent-1",
    idempotency_key: "idem-out-001",
    occurred_at: "2026-06-19T12:30:00.000Z",
  };

  it("valid outcome parses successfully", () => {
    expect(OutcomeEventSchema.safeParse(validOutcome).success).toBe(true);
  });

  it("accepts status=success", () => {
    expect(OutcomeEventSchema.safeParse({ ...validOutcome, status: "success" }).success).toBe(true);
  });

  it("accepts status=failure", () => {
    expect(OutcomeEventSchema.safeParse({ ...validOutcome, status: "failure" }).success).toBe(true);
  });

  it("accepts status=partial", () => {
    expect(OutcomeEventSchema.safeParse({ ...validOutcome, status: "partial" }).success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(OutcomeEventSchema.safeParse({ ...validOutcome, status: "maybe" }).success).toBe(false);
  });

  it("rejects empty source", () => {
    expect(OutcomeEventSchema.safeParse({ ...validOutcome, source: "" }).success).toBe(false);
  });

  it("rejects empty idempotency_key", () => {
    expect(OutcomeEventSchema.safeParse({ ...validOutcome, idempotency_key: "" }).success).toBe(false);
  });

  it("rejects non-UUID handoff_id", () => {
    expect(OutcomeEventSchema.safeParse({ ...validOutcome, handoff_id: "not-a-uuid" }).success).toBe(false);
  });

  it("accepts empty evidence array", () => {
    expect(OutcomeEventSchema.safeParse({ ...validOutcome, evidence: [] }).success).toBe(true);
  });
});
