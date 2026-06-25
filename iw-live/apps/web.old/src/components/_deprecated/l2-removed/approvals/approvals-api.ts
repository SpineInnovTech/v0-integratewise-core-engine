/**
 * Approvals API Handlers
 * Approve/Reject handlers routed through Workflow HITL queue.
 * Workflow orchestrates all approval decisions; Act executes approved actions.
 *
 * Routes (v4.0 — Workflow orchestrates, Act executes):
 *   POST /api/v1/cognitive/hitl/queue     → WORKFLOW (approve/deny decisions)
 *   GET  /api/v1/cognitive/hitl/queue     → WORKFLOW (pending approvals)
 *   GET  /api/v1/cognitive/hitl/history   → WORKFLOW (approval history)
 *   POST /api/v1/cognitive/act/retry      → ACT Worker (execution retry — not an approval decision)
 *   GET  /api/v1/cognitive/act/executions → ACT Worker (execution status)
 *
 * @deprecated Direct Act/Govern approval endpoints — frontend should NOT call these directly:
 *   POST /api/v1/cognitive/act/approve  → use POST /api/v1/cognitive/hitl/queue { decision: "approve" }
 *   POST /api/v1/cognitive/act/reject   → use POST /api/v1/cognitive/hitl/queue { decision: "deny" }
 *   GET  /api/v1/cognitive/govern/pending → use GET /api/v1/cognitive/hitl/queue
 */

import { apiFetch } from "@/lib/api-client";
import type { PendingApproval } from "./pending-approvals-card";
import type { ExecutionRun } from "./execution-status-card";

// Types for API responses
export interface ApprovalResponse {
  success: boolean;
  executionId?: string;
  message: string;
  error?: string;
}

export interface RejectionResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ExecutionStatusResponse {
  execution: ExecutionRun;
}

// Helper for idempotency key generation
function generateIdempotencyKey(approvalId: string, action: "approve" | "reject"): string {
  return `${approvalId}_${action}_${Date.now()}`;
}

/**
 * Approve a pending action (routed through Workflow HITL queue).
 * Workflow updates the action status, sends to ACT_QUEUE for execution, and writes audit log.
 *
 * @param approval - The approval to approve
 * @param feedback - Optional feedback from the user
 * @returns Promise<ApprovalResponse>
 */
export async function approveAction(
  approval: PendingApproval,
  feedback?: string
): Promise<ApprovalResponse> {
  try {
    const data = await apiFetch<any>(
      "/api/v1/cognitive/hitl/queue",
      {
        method: "POST",
        body: {
          action_id: approval.id,
          decision: "approve" as const,
          reason: feedback || undefined,
        },
        headers: {
          "x-idempotency-key": generateIdempotencyKey(approval.id, "approve"),
        },
      },
      "WorkflowHITLApprove"
    );

    return {
      success: true,
      executionId: data?.action?.id || data?.execution_id,
      message: data?.message || "Action approved — queued for execution via Workflow",
    };
  } catch (error) {
    console.error("[approvals-api] Approval failed:", error);

    return {
      success: false,
      message: "Failed to approve action",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Reject a pending action (routed through Workflow HITL queue).
 * Workflow updates the action status, writes a learning signal for Think, and creates audit log.
 *
 * @param approval - The approval to reject
 * @param reason - Required reason for rejection
 * @returns Promise<RejectionResponse>
 */
export async function rejectAction(
  approval: PendingApproval,
  reason: string
): Promise<RejectionResponse> {
  try {
    const data = await apiFetch<any>(
      "/api/v1/cognitive/hitl/queue",
      {
        method: "POST",
        body: {
          action_id: approval.id,
          decision: "deny" as const,
          reason,
        },
        headers: {
          "x-idempotency-key": generateIdempotencyKey(approval.id, "reject"),
        },
      },
      "WorkflowHITLReject"
    );

    return {
      success: true,
      message: data?.message || "Action rejected via Workflow",
    };
  } catch (error) {
    console.error("[approvals-api] Rejection failed:", error);

    return {
      success: false,
      message: "Failed to reject action",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Retry a failed execution (stays at Act — this is execution, not an approval decision).
 * @param executionId - The execution to retry
 * @returns Promise<ApprovalResponse>
 */
export async function retryExecution(executionId: string): Promise<ApprovalResponse> {
  try {
    const data = await apiFetch<any>(
      "/api/v1/cognitive/act/retry",
      {
        method: "POST",
        body: {
          execution_id: executionId,
          retried_at: new Date().toISOString(),
        },
      },
      "ActRetry"
    );

    return {
      success: true,
      executionId: data?.new_execution_id || executionId,
      message: data?.message || "Execution retry queued",
    };
  } catch (error) {
    console.error("[approvals-api] Retry failed:", error);

    return {
      success: false,
      message: "Failed to retry execution",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get execution status
 * @param executionId - The execution to check
 * @returns Promise<ExecutionStatusResponse | null>
 */
export async function getExecutionStatus(
  executionId: string
): Promise<ExecutionStatusResponse | null> {
  try {
    const data = await apiFetch<any>(
      `/api/v1/cognitive/act/executions/${executionId}`,
      {},
      "ActExecutionStatus"
    );
    return data ? { execution: data } : null;
  } catch (error) {
    console.error("[approvals-api] Failed to get execution status:", error);
    return null;
  }
}

/**
 * List pending approvals (from Workflow HITL queue).
 * Workflow queries the `actions` table for status = 'pending_approval'.
 *
 * @param filters - Optional filters
 * @returns Promise<PendingApproval[]>
 */
export async function listPendingApprovals(filters?: {
  urgency?: string[];
  type?: string[];
  entityType?: string;
}): Promise<PendingApproval[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.urgency) params.set("urgency", filters.urgency.join(","));
    if (filters?.type) params.set("type", filters.type.join(","));
    if (filters?.entityType) params.set("entity_type", filters.entityType);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch<any>(`/api/v1/cognitive/hitl/queue${qs}`, {}, "WorkflowHITLQueue");
    return data?.approvals || data?.items || [];
  } catch (error) {
    console.error("[approvals-api] Failed to list pending approvals:", error);
    return [];
  }
}

/**
 * List recent executions
 * @param limit - Max number of executions to return
 * @returns Promise<ExecutionRun[]>
 */
export async function listRecentExecutions(limit: number = 10): Promise<ExecutionRun[]> {
  try {
    const data = await apiFetch<any>(
      `/api/v1/cognitive/act/executions?limit=${limit}`,
      {},
      "ActExecutions"
    );
    return data?.executions || [];
  } catch (error) {
    console.error("[approvals-api] Failed to list recent executions:", error);
    return [];
  }
}

// Export all handlers
export const approvalsApi = {
  approve: approveAction,
  reject: rejectAction,
  retry: retryExecution,
  getStatus: getExecutionStatus,
  listApprovals: listPendingApprovals,
  listExecutions: listRecentExecutions,
};

export default approvalsApi;
