/**
 * Handoff State Machine — transitionTo() helper
 *
 * Validates state transitions against ALLOWED_TRANSITIONS,
 * persists to D1, and rejects invalid transitions with 409.
 *
 * Phase 5 Task 21
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { isValidTransition, ALLOWED_TRANSITIONS, type HandoffState } from "@integratewise/types/handoff";

export interface TransitionResult {
  success: boolean;
  package_id: string;
  from_state: HandoffState;
  to_state: HandoffState;
  error?: string;
}

/**
 * Transition a handoff package to a new state.
 * Validates the transition, persists state + log entry to D1.
 * Returns error with current state if transition is invalid.
 */
export async function transitionTo(
  db: D1Database,
  packageId: string,
  toState: HandoffState,
  actor: string,
  reason?: string
): Promise<TransitionResult> {
  // 1. Get current state
  const pkg = await db
    .prepare("SELECT state FROM handoff_packages WHERE package_id = ?")
    .bind(packageId)
    .first<{ state: string }>();

  if (!pkg) {
    return {
      success: false,
      package_id: packageId,
      from_state: "PROPOSED" as HandoffState, // placeholder
      to_state: toState,
      error: `Package ${packageId} not found`,
    };
  }

  const fromState = pkg.state as HandoffState;

  // 2. Validate transition
  if (!isValidTransition(fromState, toState)) {
    return {
      success: false,
      package_id: packageId,
      from_state: fromState,
      to_state: toState,
      error: `Invalid transition: ${fromState} → ${toState}. Allowed from ${fromState}: ${getAllowedTargets(fromState).join(", ")}`,
    };
  }

  const now = new Date().toISOString();
  const logId = crypto.randomUUID();

  // 3. Persist state change + log entry (atomic batch)
  const batch = [
    db
      .prepare("UPDATE handoff_packages SET state = ?, updated_at = ? WHERE package_id = ?")
      .bind(toState, now, packageId),
    db
      .prepare(
        "INSERT INTO handoff_state_log (id, package_id, from_state, to_state, actor, reason, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(logId, packageId, fromState, toState, actor, reason || null, now),
  ];

  await db.batch(batch);

  // 4. Structured log
  console.log(
    JSON.stringify({
      event: "handoff_state_transition",
      package_id: packageId,
      from_state: fromState,
      to_state: toState,
      actor,
      reason: reason || null,
      timestamp: now,
    })
  );

  return {
    success: true,
    package_id: packageId,
    from_state: fromState,
    to_state: toState,
  };
}

function getAllowedTargets(state: HandoffState): HandoffState[] {
  const targets = [...(ALLOWED_TRANSITIONS[state] || [])];
  if (state !== "CANCELLED") targets.push("CANCELLED");
  return [...new Set(targets)];
}
