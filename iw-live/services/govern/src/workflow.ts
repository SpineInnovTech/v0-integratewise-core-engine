import { neon } from "@neondatabase/serverless";
import { logDecision } from "./audit";
import type { Env } from "./types";

// ============================================================================
// Action Status Types
// ============================================================================
export type ActionStatus = "pending" | "approved" | "rejected" | "executed" | "failed";

// ============================================================================
// Approval Workflow
// ============================================================================

/**
 * Approve an action and update its status
 */
export async function approveAction(
  env: Env,
  action_id: string,
  user_id: string,
  signatureKey: string,
  reason?: string
): Promise<void> {
  const sql = neon(env.DATABASE_URL!);

  // Get the action details first
  const actionResult = await sql`
    SELECT id, tenant_id, action_type, status
    FROM actions
    WHERE id = ${action_id}
    LIMIT 1
  `;

  if (actionResult.length === 0) {
    throw new Error(`Action not found: ${action_id}`);
  }

  const action = actionResult[0];

  if (action.status !== "pending") {
    throw new Error(`Cannot approve action with status: ${action.status}`);
  }

  // Update the action status
  await sql`
    UPDATE actions
    SET 
      status = 'approved',
      approved_by = ${user_id},
      approved_at = NOW(),
      approval_reason = ${reason || null},
      updated_at = NOW()
    WHERE id = ${action_id}
  `;

  // Log to governance audit log
  await logDecision(
    env,
    {
      tenant_id: action.tenant_id,
      action_id: action_id,
      user_id: user_id,
      decision: "approved",
      reason: reason || "Action approved",
      action_type: action.action_type,
      metadata: {
        previous_status: action.status,
        new_status: "approved",
      },
    },
    signatureKey
  );
}

/**
 * Reject an action and update its status
 */
export async function rejectAction(
  env: Env,
  action_id: string,
  user_id: string,
  signatureKey: string,
  reason: string
): Promise<void> {
  const sql = neon(env.DATABASE_URL!);

  // Get the action details first
  const actionResult = await sql`
    SELECT id, tenant_id, action_type, status
    FROM actions
    WHERE id = ${action_id}
    LIMIT 1
  `;

  if (actionResult.length === 0) {
    throw new Error(`Action not found: ${action_id}`);
  }

  const action = actionResult[0];

  if (action.status !== "pending") {
    throw new Error(`Cannot reject action with status: ${action.status}`);
  }

  // Update the action status
  await sql`
    UPDATE actions
    SET 
      status = 'rejected',
      rejected_by = ${user_id},
      rejected_at = NOW(),
      rejection_reason = ${reason},
      updated_at = NOW()
    WHERE id = ${action_id}
  `;

  // Log to governance audit log
  await logDecision(
    env,
    {
      tenant_id: action.tenant_id,
      action_id: action_id,
      user_id: user_id,
      decision: "rejected",
      reason: reason,
      action_type: action.action_type,
      metadata: {
        previous_status: action.status,
        new_status: "rejected",
      },
    },
    signatureKey
  );
}

/**
 * Get pending actions for a tenant that require approval
 */
export async function getPendingActions(
  env: Env,
  tenant_id: string,
  limit: number = 50
): Promise<any[]> {
  const sql = neon(env.DATABASE_URL!);

  const result = await sql`
    SELECT 
      a.id,
      a.tenant_id,
      a.action_type,
      a.priority,
      a.parameters,
      a.status,
      a.created_at,
      a.created_by,
      gp.name as policy_name,
      gp.id as policy_id
    FROM actions a
    LEFT JOIN governance_policies gp ON 
      a.tenant_id = gp.tenant_id 
      AND gp.is_active = true
    WHERE a.tenant_id = ${tenant_id}
      AND a.status = 'pending'
    ORDER BY 
      CASE a.priority 
        WHEN 'critical' THEN 4
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
      END DESC,
      a.created_at ASC
    LIMIT ${limit}
  `;

  return result;
}

/**
 * Get action history for a tenant
 */
export async function getActionHistory(
  env: Env,
  tenant_id: string,
  filters: {
    status?: ActionStatus;
    action_type?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<any[]> {
  const sql = neon(env.DATABASE_URL!);
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  let query = sql`
    SELECT 
      id, tenant_id, action_type, priority, parameters,
      status, created_at, created_by,
      approved_by, approved_at, approval_reason,
      rejected_by, rejected_at, rejection_reason
    FROM actions
    WHERE tenant_id = ${tenant_id}
  `;

  // Note: For a production system, you'd want to use parameterized queries
  // with proper SQL building. This is simplified for clarity.
  if (filters.status) {
    query = sql`
      SELECT 
        id, tenant_id, action_type, priority, parameters,
        status, created_at, created_by,
        approved_by, approved_at, approval_reason,
        rejected_by, rejected_at, rejection_reason
      FROM actions
      WHERE tenant_id = ${tenant_id}
        AND status = ${filters.status}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  } else {
    query = sql`
      SELECT 
        id, tenant_id, action_type, priority, parameters,
        status, created_at, created_by,
        approved_by, approved_at, approval_reason,
        rejected_by, rejected_at, rejection_reason
      FROM actions
      WHERE tenant_id = ${tenant_id}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  return query;
}
