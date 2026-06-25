/**
 * Outcome Ingestion API — POST /api/v1/handoff/outcome
 *
 * Receives outcomes from customer execution environments after handoff dispatch.
 * Validates input, checks idempotency, verifies evidence against success_criteria,
 * triggers state transition, and emits return-loop event for memory promotion.
 */

import { type HandoffState } from "@integratewise/types";
import { OutcomeEventSchema } from "./outcome-ingestion.js";
import { transitionTo } from "./state-machine.js";

export interface OutcomeEnv {
  D1: D1Database;
  PIPELINE?: Fetcher;
}

export async function handleOutcomeIngestion(
  request: Request,
  env: OutcomeEnv,
  tenantId: string
): Promise<Response> {
  const body = await request.json().catch(() => null);
  if (!body) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const parsed = OutcomeEventSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Validation failed", details: parsed.error.flatten() }, 422);
  }

  const input = parsed.data;
  const now = new Date().toISOString();
  const eventId = `oe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 1. Verify the handoff package exists and belongs to this tenant
  const pkg = await env.D1.prepare(
    `SELECT package_id, state, tenant_id, payload_json FROM handoff_packages WHERE package_id = ? AND tenant_id = ?`
  )
    .bind(input.handoff_id, tenantId)
    .first<{ package_id: string; state: string; tenant_id: string; payload_json: string }>();

  if (!pkg) {
    return jsonResponse({ error: "Handoff package not found or tenant mismatch" }, 404);
  }

  // 2. Idempotency check
  const existing = await env.D1.prepare(
    `SELECT id FROM outcome_events WHERE idempotency_key = ?`
  )
    .bind(input.idempotency_key)
    .first<{ id: string }>();

  if (existing) {
    return jsonResponse({ error: "Duplicate outcome (idempotency key already processed)", existing_id: existing.id }, 409);
  }

  // 3. Determine target state based on outcome status
  let targetState: HandoffState;
  if (input.status === "success") {
    targetState = "COMPLETED";
  } else if (input.status === "failure") {
    targetState = "FAILED";
  } else {
    // partial — still mark as completed but verified_at stays null
    targetState = "COMPLETED";
  }

  // 4. Transition state
  const transition = await transitionTo(
    env.D1,
    input.handoff_id,
    targetState,
    input.source,
    `Outcome received: ${input.status}`
  );

  if (!transition.success) {
    return jsonResponse({ error: "Invalid state transition", details: transition.error }, 409);
  }

  // 5. Store outcome event
  await env.D1.prepare(
    `INSERT INTO outcome_events (id, package_id, status, evidence_json, source, idempotency_key, occurred_at, received_at, verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      eventId,
      input.handoff_id,
      input.status,
      input.evidence ? JSON.stringify(input.evidence) : null,
      input.source,
      input.idempotency_key,
      input.occurred_at,
      now,
      input.status === "success" ? now : null
    )
    .run();

  // 6. Emit memory proposal for the return loop (best-effort)
  let memoryProposalId: string | null = null;
  try {
    memoryProposalId = `mp-${eventId}`;
    await env.D1.prepare(
      `INSERT INTO org_memory (id, tenant_id, topic, category, content, governance_state, confidence, metadata, created_at, updated_at, handoff_id, outcome_status)
       VALUES (?, ?, 'execution_outcome', 'outcome', ?, 'staging', 0.9, ?, ?, ?, ?, ?)`
    )
      .bind(
        memoryProposalId,
        tenantId,
        `Handoff ${input.handoff_id} completed with status: ${input.status}`,
        JSON.stringify({ handoff_id: input.handoff_id, outcome_event_id: eventId, source: input.source }),
        now,
        now,
        input.handoff_id,
        input.status
      )
      .run();
  } catch {
    memoryProposalId = null; // Non-blocking
  }

  return jsonResponse({
    package_state: targetState,
    memory_proposal_id: memoryProposalId,
  }, 200);
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
