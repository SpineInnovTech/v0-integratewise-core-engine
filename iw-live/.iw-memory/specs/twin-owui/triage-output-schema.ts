/**
 * Triage Bot Output Schema — Book of Records Format
 *
 * This is the ONLY format that may be written to conversational_memory.
 * All other memory writes are forbidden.
 *
 * Source: ep-2026-06-09-memory-pipeline-triage
 */

export type BookOfRecordsType =
  | "episode" // time-bounded chapter
  | "decision" // explicit choice + rationale
  | "learning" // takeaway for future work
  | "commitment" // what we agreed to do
  | "fact" // verifiable institutional fact
  | "action_item"; // triage: what needs addressing

export type MemoryScope = "user" | "work" | "org";

export type GovernanceState =
  | "candidate" // triage identified as promotion candidate
  | "staging" // queued for review
  | "approved" // human approved, promoted to org_memory
  | "rejected"; // human rejected, stays in conversational

/**
 * Triage Bot output — written to conversational_memory
 */
export interface TriageOutput {
  // Identity
  id: string; // triage-<uuid>
  tenant_id: string;
  session_id: string;

  // Book of Records type
  type: BookOfRecordsType;

  // Content
  title: string; // Brief label
  content: string; // Markdown content
  summary?: string; // Optional summary

  // Scope
  scope: MemoryScope; // user | work | org

  // Promotion
  promotion_candidate: boolean; // Triage Bot flags for promotion
  governance_state: GovernanceState; // candidate → staging → approved/rejected

  // Lineage
  source_type: "chat" | "tool_outcome" | "worker_output";
  source_id?: string; // Original chat/tool/worker ID
  parent_episode_id?: string; // If part of larger episode

  // Metadata
  created_at: string; // ISO timestamp
  created_by: "triage-bot"; // Always triage-bot
  last_referenced_at?: string; // Last time accessed (for TTL)

  // Search
  tags?: string[]; // For search indexing
  keywords?: string[]; // Extracted keywords

  // Attachments
  attachments?: Array<{
    type: "screenshot" | "log" | "code" | "doc";
    path: string; // R2 or filesystem path
    description?: string;
  }>;
}

/**
 * Episode-specific fields (when type === 'episode')
 */
export interface EpisodeOutput extends TriageOutput {
  type: "episode";
  episode: {
    label: string; // Episode name
    pillar: string; // memory | spine | twin | etc.
    what: string; // What happened
    decisions?: Array<{
      id: number;
      decision: string;
      rationale: string;
    }>;
    learnings?: string[];
    commitments?: Array<{
      id: number;
      owner: string;
      action: string;
    }>;
    links?: {
      systems?: string[];
      files?: string[];
      urls?: string[];
    };
  };
}

/**
 * Decision-specific fields (when type === 'decision')
 */
export interface DecisionOutput extends TriageOutput {
  type: "decision";
  decision: {
    question: string; // What was decided
    chosen: string; // What we chose
    alternatives?: string[]; // What we didn't choose
    rationale: string; // Why
    impact: "low" | "medium" | "high";
    reversible: boolean;
    decided_by?: string; // User ID or role
    decided_at: string; // ISO timestamp
  };
  ttl_days: number; // Default: 30 for decisions
}

/**
 * Learning-specific fields (when type === 'learning')
 */
export interface LearningOutput extends TriageOutput {
  type: "learning";
  learning: {
    context: string; // What situation led to this
    takeaway: string; // What we learned
    applies_to?: string[]; // What domains this applies to
    avoid?: string; // What to avoid next time
  };
}

/**
 * Commitment-specific fields (when type === 'commitment')
 */
export interface CommitmentOutput extends TriageOutput {
  type: "commitment";
  commitment: {
    owner: string; // Who committed
    action: string; // What they committed to
    deadline?: string; // When (ISO timestamp)
    status: "pending" | "in_progress" | "completed" | "blocked";
    blocking_reason?: string;
  };
}

/**
 * Fact-specific fields (when type === 'fact')
 */
export interface FactOutput extends TriageOutput {
  type: "fact";
  fact: {
    statement: string; // The fact
    verified: boolean; // Has this been verified?
    source?: string; // Where this fact came from
    confidence: number; // 0.0 - 1.0
    expires_at?: string; // If fact has shelf life
  };
}

/**
 * Action item-specific fields (when type === 'action_item')
 */
export interface ActionItemOutput extends TriageOutput {
  type: "action_item";
  action_item: {
    what: string; // What needs to be done
    why: string; // Why it's needed
    urgency: "low" | "medium" | "high" | "critical";
    assigned_to?: string;
    due_by?: string; // ISO timestamp
    blocked_by?: string[]; // Dependencies
  };
}

/**
 * Union type for all triage outputs
 */
export type AnyTriageOutput =
  | EpisodeOutput
  | DecisionOutput
  | LearningOutput
  | CommitmentOutput
  | FactOutput
  | ActionItemOutput;

/**
 * Triage Bot input — what the Triage Bot receives
 */
export interface TriageInput {
  tenant_id: string;
  session_id: string;

  // Source
  source_type: "chat" | "tool_outcome" | "worker_output";
  source_id?: string;

  // Content to triage
  content:
    | string
    | {
        messages?: Array<{ role: string; content: string }>;
        outcome?: {
          success: boolean;
          data?: any;
          error?: string;
        };
        context?: Record<string, any>;
      };

  // Hints
  scope_hint?: MemoryScope; // Suggestion from caller
  promotion_hint?: boolean; // Caller thinks this should be promoted

  // Metadata
  timestamp: string;
  user_id?: string;
}

/**
 * Promotion queue item
 */
export interface PromotionQueueItem {
  id: string; // queue-<uuid>
  tenant_id: string;

  // Source
  conversational_memory_id: string; // The triage output being promoted

  // Metadata
  queued_at: string;
  queued_by: "triage-bot" | string; // Usually triage-bot

  // Review
  reviewed_at?: string;
  reviewed_by?: string; // Human reviewer user ID
  review_decision?: "approved" | "rejected";
  review_notes?: string;

  // Org memory target (if approved)
  org_memory_id?: string; // Created when promoted
}

/**
 * Conversational memory TTL rules
 */
export const TTL_RULES = {
  // General conversational memory: 90 days
  default: 90,

  // Decisions unused for 30 days: age or delete
  decision: 30,

  // Action items completed: 7 days
  action_item_completed: 7,

  // Facts expired: immediate
  fact_expired: 0,

  // Episodes never auto-delete (manual review only)
  episode: null,
};

/**
 * Example usage
 */
export const EXAMPLE_TRIAGE_OUTPUT: DecisionOutput = {
  id: "triage-12345",
  tenant_id: "iw-customer-zero",
  session_id: "session-67890",
  type: "decision",
  title: "Memory pipeline uses Triage Bot as sole writer",
  content: `# Decision: Memory Pipeline Architecture

**Question:** How should IntegrateWise memory be written?

**Chosen:** All memory writes go through AI Worker → Triage Bot → conversational_memory pipeline.

**Rationale:** This ensures all memory is shaped into Book of Records format before storage, enabling governance, search indexing, and promotion to org memory.

**Alternatives Considered:**
- Direct writes from agents/tools (rejected: no governance)
- Multiple writers (rejected: inconsistent format)

**Impact:** High — affects all memory operations.

**Reversible:** No — once deployed, all writers must comply.`,
  summary: "Triage Bot is the sole memory writer. All other paths are forbidden.",
  scope: "org",
  promotion_candidate: true,
  governance_state: "candidate",
  source_type: "worker_output",
  source_id: "worker-abc123",
  created_at: "2026-06-09T10:00:00Z",
  created_by: "triage-bot",
  tags: ["memory", "architecture", "triage-bot", "book-of-records"],
  keywords: ["memory pipeline", "triage bot", "governance", "book of records"],
  decision: {
    question: "How should IntegrateWise memory be written?",
    chosen: "AI Worker → Triage Bot → conversational_memory pipeline",
    alternatives: ["Direct writes from agents/tools", "Multiple writers"],
    rationale:
      "Ensures all memory is shaped into Book of Records format, enabling governance and promotion",
    impact: "high",
    reversible: false,
    decided_by: "nirmal",
    decided_at: "2026-06-09T10:00:00Z",
  },
  ttl_days: 30,
};
