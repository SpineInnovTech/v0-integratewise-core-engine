/**
 * Governed Cognition Proposal — Canonical Type Contract
 *
 * This is the first-class continuity primitive that bridges:
 *   Twin cognition → governed intent → HITL validation → operational action → Spine writeback
 *
 * LIFECYCLE:
 *   draft → pending_review → approved | rejected → executing → completed | failed
 *
 * RULES:
 *   - Twin NEVER directly mutates Ops. It proposes.
 *   - Triage Bot is the sole mutation gateway between cognition and operations.
 *   - Every proposal carries full lineage back to the originating signal + entity.
 *   - Continuity writeback is mandatory on terminal states (completed/failed/rejected).
 *
 * ARCHITECTURE:
 *   Twin → Proposal → Triage → Approval Queue → Ops Projection → Human Action → Operator Execution → Spine
 */

// ─── Proposal Lifecycle States ───────────────────────────────────────────────

export type ProposalStatus =
  | "draft" // Created by Twin, not yet submitted for governance
  | "pending_review" // Submitted to Triage Bot / governance queue
  | "approved" // Human or auto-approved, ready for execution
  | "rejected" // Rejected by human or policy
  | "executing" // Operator is executing the action
  | "completed" // Execution confirmed, Spine writeback done
  | "failed" // Execution failed, requires investigation
  | "superseded"; // A newer proposal for the same entity replaced this one

// ─── Governance Level ────────────────────────────────────────────────────────

export type ProposalGovernanceLevel =
  | "auto" // Policy allows auto-approval (low risk, high confidence)
  | "manual" // Requires human review
  | "restricted"; // Requires senior approval + evidence threshold

// ─── Action Types ────────────────────────────────────────────────────────────

export type ProposalActionType =
  | "notify" // Send notification to user/team
  | "create_task" // Create a task in connected tool
  | "update_entity" // Update a Spine entity field
  | "escalate" // Escalate to a person or team
  | "schedule_call" // Schedule a meeting/call
  | "trigger_workflow" // Trigger a Cloudflare Workflow / automation
  | "draft_communication" // Draft an email/message for human review
  | "create_record" // Create a new record in a connected tool
  | "archive_entity" // Archive/close an entity
  | "request_data" // Request missing data from a source
  | "custom"; // Operator-defined action type

// ─── Proposal Signal Link ────────────────────────────────────────────────────

export interface ProposalSignalLink {
  /** ID of the originating signal from SignalAnalyzer */
  signal_id: string;
  /** Signal category that triggered this proposal */
  signal_category: string;
  /** Confidence score from SignalAnalyzer (0–1) */
  signal_confidence: number;
  /** Severity from SignalAnalyzer */
  signal_severity: "low" | "medium" | "high" | "critical";
  /** Key indicators that drove the signal */
  key_indicators: Array<{
    name: string;
    value: number;
    trend: "up" | "down" | "stable";
  }>;
  /** Raw reasoning text from SignalAnalyzer */
  reasoning: string;
}

// ─── Proposal Execution Result ───────────────────────────────────────────────

export interface ProposalExecutionResult {
  /** When execution started */
  started_at: string;
  /** When execution completed or failed */
  completed_at?: string;
  /** Who or what executed (user_id or "operator") */
  executed_by: string;
  /** Tool that was called (e.g. "hubspot", "jira", "spine") */
  target_tool?: string;
  /** External ID created/updated in the target tool */
  external_result_id?: string;
  /** Human-readable outcome */
  outcome_summary?: string;
  /** Error message if failed */
  error?: string;
}

// ─── Continuity Writeback ────────────────────────────────────────────────────

export interface ProposalContinuityWriteback {
  /** Whether writeback to Spine/org_memory was completed */
  written: boolean;
  /** Spine entity ID updated */
  spine_id?: string;
  /** org_memory record ID created */
  memory_id?: string;
  /** Timestamp of writeback */
  written_at?: string;
}

// ─── The Canonical Proposal Object ───────────────────────────────────────────

export interface Proposal {
  // Identity
  id: string;
  tenant_id: string;

  // Lifecycle
  status: ProposalStatus;
  governance_level: ProposalGovernanceLevel;
  created_at: string;
  updated_at: string;

  // Cognition origin — what the Twin saw
  originating_entity_id: string;
  originating_entity_type: string;
  originating_signal: ProposalSignalLink;

  // Lineage — full chain back to source
  lineage_id: string; // Shared across all proposals in a reasoning chain
  parent_proposal_id?: string; // If this supersedes or follows from another proposal

  // The governed intent
  action_type: ProposalActionType;
  action_target: {
    entity_id?: string;
    entity_type?: string;
    tool?: string;
    person_id?: string;
    workflow_id?: string;
  };
  action_parameters: Record<string, unknown>;
  action_description: string; // Human-readable description of what will happen

  // Confidence + reasoning
  confidence: number; // 0–1, from SignalAnalyzer
  reasoning_summary: string; // Why this action is proposed
  evidence_count: number; // Number of data points supporting this

  // Governance
  policy_id?: string; // Which governance policy applies
  review_deadline?: string; // When this proposal expires if not reviewed
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;

  // Execution
  execution_result?: ProposalExecutionResult;

  // Continuity
  continuity_writeback?: ProposalContinuityWriteback;

  // Ops projection metadata
  ops_priority: "low" | "medium" | "high" | "critical";
  ops_surface: "queue" | "tile" | "notification" | "command_center" | "timeline";
}

// ─── Proposal Create Input ───────────────────────────────────────────────────

export interface CreateProposalInput {
  tenant_id: string;
  originating_entity_id: string;
  originating_entity_type: string;
  originating_signal: ProposalSignalLink;
  lineage_id?: string;
  parent_proposal_id?: string;
  action_type: ProposalActionType;
  action_target: Proposal["action_target"];
  action_parameters: Record<string, unknown>;
  action_description: string;
  confidence: number;
  reasoning_summary: string;
  evidence_count?: number;
  governance_level?: ProposalGovernanceLevel;
  ops_priority?: Proposal["ops_priority"];
  ops_surface?: Proposal["ops_surface"];
  review_deadline?: string;
}

// ─── Proposal Status Transition Map ─────────────────────────────────────────

export const PROPOSAL_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ["pending_review", "superseded"],
  pending_review: ["approved", "rejected", "superseded"],
  approved: ["executing", "superseded"],
  rejected: [], // Terminal
  executing: ["completed", "failed"],
  completed: [], // Terminal
  failed: ["pending_review"], // Can be re-submitted
  superseded: [], // Terminal
};

export function canTransition(from: ProposalStatus, to: ProposalStatus): boolean {
  return PROPOSAL_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Ops Projection Shape ────────────────────────────────────────────────────
// What the Ops surface receives — stripped of internal governance fields

export interface ProposalOpsProjection {
  id: string;
  status: ProposalStatus;
  ops_priority: Proposal["ops_priority"];
  ops_surface: Proposal["ops_surface"];
  action_type: ProposalActionType;
  action_description: string;
  entity_id: string;
  entity_type: string;
  confidence: number;
  reasoning_summary: string;
  signal_severity: "low" | "medium" | "high" | "critical";
  governance_level: ProposalGovernanceLevel;
  review_deadline?: string;
  created_at: string;
  lineage_id: string;
}

export function toOpsProjection(p: Proposal): ProposalOpsProjection {
  return {
    id: p.id,
    status: p.status,
    ops_priority: p.ops_priority,
    ops_surface: p.ops_surface,
    action_type: p.action_type,
    action_description: p.action_description,
    entity_id: p.originating_entity_id,
    entity_type: p.originating_entity_type,
    confidence: p.confidence,
    reasoning_summary: p.reasoning_summary,
    signal_severity: p.originating_signal.signal_severity,
    governance_level: p.governance_level,
    review_deadline: p.review_deadline,
    created_at: p.created_at,
    lineage_id: p.lineage_id,
  };
}
