/**
 * Approvals Components - Index
 * Day 4: UI Polish + Integration
 */

export { PendingApprovalsCard, mockApprovals } from "./pending-approvals-card";
export type { PendingApproval } from "./pending-approvals-card";

export { ApprovalModal } from "./approval-modal";

// evidence-drawer.tsx moved to _deprecated/other/
// export { EvidenceDrawer, mockEvidence } from "./evidence-drawer";
// export type { EvidenceItem } from "./evidence-drawer";
// Active evidence: l2/approvals/approvals-api.ts has the API layer

export { ExecutionStatusCard, mockExecutions } from "./execution-status-card";
export type { ExecutionRun } from "./execution-status-card";

export {
  approvalsApi,
  approveAction,
  rejectAction,
  retryExecution,
  getExecutionStatus,
  listPendingApprovals,
  listRecentExecutions,
} from "./approvals-api";
export type { ApprovalResponse, RejectionResponse, ExecutionStatusResponse } from "./approvals-api";
