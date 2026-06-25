/**
 * Canonical Handoff Package Schema
 *
 * Vendor-neutral contract for dispatching approved actions to customer
 * execution environments. Preserves governance stamp byte-for-byte.
 *
 * Phase 5 Task 18
 * Requirements: 5.1, 5.6
 */

import { z } from "zod";

export const GovernanceStampSchema = z.object({
  decision_id: z.string().uuid(),
  policy_id: z.string(),
  approver: z.string(),
  decided_at: z.string().datetime(),
  audit_id: z.string().uuid(),
});

export type GovernanceStamp = z.infer<typeof GovernanceStampSchema>;

export const EvidenceRefSchema = z.object({
  fact_id: z.string(),
  source_event_id: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;

export const SuccessCriterionSchema = z.object({
  id: z.string(),
  description: z.string(),
  verifiable: z.boolean(),
  expected: z.unknown().optional(),
});

export type SuccessCriterion = z.infer<typeof SuccessCriterionSchema>;

export const HANDOFF_STATES = [
  "PROPOSED",
  "APPROVED",
  "EXECUTING",
  "AWAITING_OUTCOME",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type HandoffState = (typeof HANDOFF_STATES)[number];

export const ADAPTER_TARGETS = [
  "json",
  "mcp",
  "openclaw",
  "langgraph",
  "zapier",
  "n8n",
] as const;

export type AdapterTarget = (typeof ADAPTER_TARGETS)[number];

export const HandoffPackageSchema = z.object({
  package_id: z.string().uuid(),
  proposal_id: z.string().uuid(),
  tenant_id: z.string().min(1),
  tenant_class: z.enum(["customer_zero", "external"]),
  adapter_target: z.enum(ADAPTER_TARGETS),
  action: z.object({
    kind: z.string().min(1),
    target: z.string().min(1),
    params: z.record(z.unknown()),
  }),
  evidence: z.array(EvidenceRefSchema),
  success_criteria: z.array(SuccessCriterionSchema),
  governance_stamp: GovernanceStampSchema,
  idempotency_key: z.string().min(1),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  state: z.enum(HANDOFF_STATES),
});

export type HandoffPackage = z.infer<typeof HandoffPackageSchema>;

/**
 * Allowed state transitions per Requirement 6.2
 */
export const ALLOWED_TRANSITIONS: Record<HandoffState, HandoffState[]> = {
  PROPOSED: ["APPROVED", "CANCELLED"],
  APPROVED: ["EXECUTING", "CANCELLED"],
  EXECUTING: ["AWAITING_OUTCOME", "FAILED", "CANCELLED"],
  AWAITING_OUTCOME: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: ["CANCELLED"], // manual cancel for audit correction
  FAILED: ["CANCELLED"],
  CANCELLED: [], // terminal
};

/**
 * Validate whether a state transition is allowed
 */
export function isValidTransition(from: HandoffState, to: HandoffState): boolean {
  if (to === "CANCELLED" && from !== "CANCELLED") return true; // cancel from any non-terminal
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
