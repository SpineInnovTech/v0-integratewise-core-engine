/**
 * Outcome Ingestion API
 *
 * POST /api/v1/handoff/outcome
 * Accepts execution results from customer agents, validates,
 * transitions state, and emits return-loop events.
 *
 * Phase 6 Task 24
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.8
 */

import { z } from "zod";
import { transitionTo } from "./state-machine";
import type { HandoffState } from "@integratewise/types/handoff";

export const OutcomeEventSchema = z.object({
  handoff_id: z.string().uuid(),
  status: z.enum(["success", "failure", "partial"]),
  evidence: z.array(
    z.object({
      kind: z.string(),
      url: z.string().optional(),
      details: z.record(z.unknown()).optional(),
    })
  ),
  source: z.string().min(1),
  idempotency_key: z.string().min(1),
  occurred_at: z.string().datetime(),
});

export type OutcomeEvent = z.infer<typeof OutcomeEventSchema>;

export interface OutcomeIngestionEnv {
  D1: D1Database;
  MEMORY_PROMOTE?: { send(message: unknown): Promise<void> };
}

export interface OutcomeResult {
  status: number;
  body: {
    package_state?: HandoffState;
    memory_proposal_id?: string;
    error?: string;
  };
}

export async function ingestOutcome(
  event: OutcomeEvent,
  tenantId: string,
  env: OutcomeIngestionEnv
): Promise<OutcomeResult> {
  const { handoff_id, status, evidence, source, idempotency_key, occurred_at } = event;
  const now = new Date().toISOString();

  // 1. Check idempotency — same key = no duplicate transition
  const existing = await env.D1
    .prepare("SELECT id FROM outcome_events WHERE idempotency_key = ?")
    .bind(idempotency_key)
    .first();

  if (existing) {
    // Return current state without re-processing
    const pkg = await env.D1
      .prepare("SELECT state FROM handoff_packages WHERE package_id = ?")
      .bind(handoff_id)
      .first<{ state: string }>();
    return {
      status: 200,
      body: { package_state: (pkg?.state || "UNKNOWN") as HandoffState },
    };
  }

  // 2. Verify package exists and belongs to tenant
  const pkg = await env.D1
    .prepare("SELECT package_id, tenant_id, state FROM handoff_packages WHERE package_id = ?")
    .bind(handoff_id)
    .first<{ package_id: string; tenant_id: string; state: string }>();

  if (!pkg) {
    return { status: 404, body: { error: "Handoff package not found" } };
  }
  if (pkg.tenant_id !== tenantId) {
    return { status: 404, body: { error: "Handoff package not found" } };
  }

  // 3. Determine target state
  const targetState: HandoffState = status === "success" ? "COMPLETED" : "FAILED";

  // 4. Transition state
  const transition = await transitionTo(env.D1, handoff_id, targetState, source, `outcome_${status}`);
  if (!transition.success) {
    return { status: 409, body: { error: transition.error } };
  }

  // 5. Persist outcome event
  const outcomeId = crypto.randomUUID();
  await env.D1
    .prepare(
      `INSERT INTO outcome_events (id, package_id, status, evidence_json, source, idempotency_key, occurred_at, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(outcomeId, handoff_id, status, JSON.stringify(evidence), source, idempotency_key, occurred_at, now)
    .run();

  // 6. Emit memory promotion event (execution_memory proposal)
  let memoryProposalId: string | undefined;
  if (env.MEMORY_PROMOTE) {
    memoryProposalId = crypto.randomUUID();
    try {
      await env.MEMORY_PROMOTE.send({
        type: "execution_memory",
        proposal_id: memoryProposalId,
        handoff_id,
        outcome_status: status,
        evidence,
        source,
        tenant_id: tenantId,
        occurred_at,
        emitted_at: now,
      });
    } catch (err) {
      console.error(JSON.stringify({
        event: "memory_promote_send_failed",
        handoff_id,
        error: String(err),
        timestamp: now,
      }));
      memoryProposalId = undefined;
    }
  }

  // 7. Structured log
  console.log(JSON.stringify({
    event: "outcome_ingested",
    handoff_id,
    status,
    target_state: targetState,
    source,
    idempotency_key,
    memory_proposal_id: memoryProposalId,
    timestamp: now,
  }));

  return {
    status: 200,
    body: {
      package_state: targetState,
      memory_proposal_id: memoryProposalId,
    },
  };
}
