/**
 * Handoff State Query API
 *
 * GET /api/v1/handoff/:id/state
 * Returns current state, transition history, and timestamps.
 * Tenant-scoped: rejects cross-tenant queries.
 *
 * Phase 5 Task 22
 * Requirements: 6.5
 */

import type { HandoffState } from "@integratewise/types/handoff";

export interface StateQueryResult {
  package_id: string;
  current_state: HandoffState;
  created_at: string;
  updated_at: string;
  expires_at: string;
  history: Array<{
    from_state: string | null;
    to_state: string;
    actor: string;
    reason: string | null;
    occurred_at: string;
  }>;
}

export async function queryHandoffState(
  db: D1Database,
  packageId: string,
  tenantId: string
): Promise<{ status: number; body: StateQueryResult | { error: string } }> {
  // 1. Get package (tenant-scoped)
  const pkg = await db
    .prepare(
      "SELECT package_id, state, tenant_id, created_at, updated_at, expires_at FROM handoff_packages WHERE package_id = ?"
    )
    .bind(packageId)
    .first<{
      package_id: string;
      state: string;
      tenant_id: string;
      created_at: string;
      updated_at: string;
      expires_at: string;
    }>();

  if (!pkg) {
    return { status: 404, body: { error: "Handoff package not found" } };
  }

  // 2. Tenant isolation check
  if (pkg.tenant_id !== tenantId) {
    return { status: 404, body: { error: "Handoff package not found" } }; // 404 not 403 to avoid enumeration
  }

  // 3. Get transition history
  const { results: history } = await db
    .prepare(
      "SELECT from_state, to_state, actor, reason, occurred_at FROM handoff_state_log WHERE package_id = ? ORDER BY occurred_at ASC"
    )
    .bind(packageId)
    .all();

  return {
    status: 200,
    body: {
      package_id: pkg.package_id,
      current_state: pkg.state as HandoffState,
      created_at: pkg.created_at,
      updated_at: pkg.updated_at,
      expires_at: pkg.expires_at,
      history: (history || []) as StateQueryResult["history"],
    },
  };
}
