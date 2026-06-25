/**
 * Continuity Service — Types
 *
 * Supabase-backed conversational memory layer.
 * Session events, containers, and checkpoints.
 */

// ─── Core Event Types ───────────────────────────────────────────────────────

export type EventType =
  | "cognition.event"
  | "entity.event"
  | "governance.event"
  | "workflow.event"
  | "communication.event"
  | "continuity.event"
  | "system.event"
  | "decision.event";

export type SessionStatus = "active" | "paused" | "closed" | "promoting";

export type TriageOutcome =
  | "retain_ephemeral"
  | "summarize"
  | "promote_to_knowledge"
  | "attach_artifact"
  | "update_doctrine"
  | "generate_projection"
  | "archive";

// ─── Database Row Types ─────────────────────────────────────────────────────

/**
 * Session container — lifecycle index for a conversation.
 * Maps to memory.session_containers.
 */
export interface SessionContainer {
  id: string;
  tenant_id: string;
  user_id: string;
  account_id?: string;
  started_at: string;
  last_event_at: string;
  event_count: number;
  status: SessionStatus;
  tags: string[];
  summary?: string;
  triage_status?: "pending" | "in_review" | "approved" | "rejected";
  triage_outcome?: TriageOutcome;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Individual event within a session.
 * Append-only. Maps to memory.session_events.
 */
export interface SessionEvent {
  id: string;
  tenant_id: string;
  session_id: string;
  user_id: string;
  account_id?: string;
  event_type: EventType;
  source: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  lineage: Record<string, unknown>;
  seq?: number;
  created_at: string;
}

/**
 * Continuity checkpoint — periodic snapshot for fast resumption.
 * Maps to memory.continuity_checkpoints.
 */
export interface ContinuityCheckpoint {
  id: string;
  tenant_id: string;
  session_id: string;
  user_id: string;
  checkpoint_at: string;
  event_range: { from: string; to: string };
  compressed_state?: string;
  model_context_window?: string;
  created_at: string;
}

// ─── Service Types ──────────────────────────────────────────────────────────

export interface ContinuityConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  defaultTtlDays: number;
  maxEventsPerSession: number;
  checkpointInterval: number;
}

export interface WriteEventRequest {
  session_id?: string;
  type: EventType;
  user_id: string;
  account_id?: string;
  content: unknown;
  source: string;
  metadata?: Record<string, unknown>;
  parent_event_id?: string;
}

export interface WriteEventResponse {
  event_id: string;
  session_id: string;
  checkpoint_created?: string;
}

export interface SessionQuery {
  user_id?: string;
  account_id?: string;
  status?: SessionStatus;
  tags?: string[];
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}

export interface SessionListResult {
  sessions: SessionContainer[];
  total: number;
  limit: number;
  offset: number;
}

export interface SessionEventsResult {
  session: SessionContainer;
  events: SessionEvent[];
  checkpoints: ContinuityCheckpoint[];
  event_count: number;
}

export interface TriageDecision {
  session_id: string;
  outcome: TriageOutcome;
  reason?: string;
  approved_by?: string;
  promoted_entities?: Array<{ type: string; id: string }>;
}
