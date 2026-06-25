/**
 * IntegrateWise OS — Canonical SSOT Types (v1.1)
 * Atlas Spine Data Model
 */

// ============================================
// State Machine
// ============================================
export type OnboardingState =
  | "AUTHENTICATED"
  | "PERSONAL_INSIGHTS_DONE"
  | "DATA_SELECTED"
  | "LOADER_RUNNING"
  | "LANDING_ZONE_READY"
  | "TEAM_ENABLED"
  | "EXPANDED_UNLOCKED"
  | "DEMO_MODE"

// ============================================
// Hub / Lens Tags
// ============================================
export type HubTag = "OS" | "TEAM" | "CS" | "BUSINESS"

// ============================================
// Access Scope
// ============================================
export type AccessScope = "personal" | "team" | "account" | "org" | "external_client"

// ============================================
// Orchestration Gate Levels
// ============================================
export type OrchestrationLevel = "L0" | "L1" | "L2" | "L3"
// L0: Read/summarize (no approval)
// L1: Create tasks/artifacts inside Spine (no approval)
// L2: Render to authorized destinations/templates (approval optional via policy)
// L3: Execute/write-back to external systems (approval required; plan + role gated)

// ============================================
// Roles
// ============================================
export type UserRole = "owner_admin" | "manager" | "contributor" | "viewer" | "external_client"

// ============================================
// Plans
// ============================================
export type PricingPlan = "free" | "pro" | "enterprise" | "owner"

export interface PlanEntitlements {
  byom_enabled: boolean
  byot_enabled: boolean
  stage2_enabled: boolean
  render_schedule_tier: "none" | "daily" | "hourly" | "realtime"
  execution_l3_enabled: boolean
  max_connectors: number
  max_destinations: number
  max_runs_per_day: number
}

export const PLAN_ENTITLEMENTS: Record<PricingPlan, PlanEntitlements> = {
  free: {
    byom_enabled: false,
    byot_enabled: false,
    stage2_enabled: false,
    render_schedule_tier: "none",
    execution_l3_enabled: false,
    max_connectors: 2,
    max_destinations: 1,
    max_runs_per_day: 10,
  },
  pro: {
    byom_enabled: true,
    byot_enabled: true,
    stage2_enabled: true,
    render_schedule_tier: "daily",
    execution_l3_enabled: true,
    max_connectors: 10,
    max_destinations: 6,
    max_runs_per_day: 100,
  },
  enterprise: {
    byom_enabled: true,
    byot_enabled: true,
    stage2_enabled: true,
    render_schedule_tier: "realtime",
    execution_l3_enabled: true,
    max_connectors: -1, // unlimited
    max_destinations: -1,
    max_runs_per_day: -1,
  },
  owner: {
    byom_enabled: true,
    byot_enabled: true,
    stage2_enabled: true,
    render_schedule_tier: "realtime",
    execution_l3_enabled: true,
    max_connectors: -1,
    max_destinations: -1,
    max_runs_per_day: -1,
  },
}

// ============================================
// Authorized Destinations (v1)
// ============================================
export const AUTHORIZED_DESTINATIONS = ["notion", "coda", "google_sheets", "clickup", "jira", "linear"] as const
export type AuthorizedDestination = (typeof AUTHORIZED_DESTINATIONS)[number]

// ============================================
// Spine Entities
// ============================================

export interface SpineEntity {
  id: string
  workspace_id: string
  entity_hub_tags: HubTag[]
  access_scope: AccessScope
  source_system: string
  source_ref: string
  schema_version: string
  pii_flags: string[]
  hash: string
  created_at: string
  updated_at: string
}

export interface Account extends SpineEntity {
  name: string
  domain?: string
  industry?: string
  health_score?: number
  renewal_date?: string
  arr?: number
}

export interface Conversation extends SpineEntity {
  account_id_anchor?: string
  subject?: string
  participants: string[]
  channel: string // slack, email, meeting, etc.
  thread_id?: string
}

export interface Message extends SpineEntity {
  conversation_id: string
  sender_id: string
  content: string
  attachments?: string[]
  timestamp: string
}

export interface Task extends SpineEntity {
  title: string
  description?: string
  status: "todo" | "in_progress" | "done" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"
  owner_id?: string
  due_date?: string
  account_id_anchor?: string
  dependencies?: string[]
  source_refs: string[]
}

export interface Artifact extends SpineEntity {
  title: string
  type: "document" | "spreadsheet" | "presentation" | "image" | "other"
  content_url?: string
  content_hash: string
  metadata?: Record<string, unknown>
}

// ============================================
// AI + Governance Entities
// ============================================

export interface AgentRun {
  id: string
  workspace_id: string
  agent_id: string
  agent_version: string
  model_id: string
  model_provider: string
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  orchestration_level: OrchestrationLevel
  requires_approval: boolean
  approval_id?: string
  contract_version: string
  prompt_version: string
  cost_tokens: number
  latency_ms: number
  success: boolean
  error?: string
  created_at: string
}

export interface RenderOutput {
  id: string
  workspace_id: string
  agent_run_id: string
  destination: AuthorizedDestination
  destination_ref: string // Notion page ID, Coda doc ID, etc.
  template_id?: string
  template_version?: string
  source_refs: string[]
  hash: string
  approval_id?: string
  contract_version: string
  connector_version: string
  is_revoked: boolean
  revoked_at?: string
  revoked_by?: string
  rollback_event_id?: string
  created_at: string
  actor_id: string
}

export interface Approval {
  id: string
  workspace_id: string
  request_type: "render" | "execute" | "delete"
  orchestration_level: OrchestrationLevel
  requested_by: string
  approved_by?: string
  status: "pending" | "approved" | "rejected" | "expired"
  reason?: string
  proposed_changes: Record<string, unknown>
  rollback_plan?: Record<string, unknown>
  expires_at: string
  created_at: string
  resolved_at?: string
}

export interface FeedbackEvent {
  id: string
  workspace_id: string
  insight_id?: string
  agent_run_id?: string
  source_refs: string[]
  feedback_type: "helpful" | "not_helpful" | "incorrect" | "acted_on" | "pin" | "unpin"
  reason_code?: string
  correction?: string
  outcome?: "done" | "ignored" | "deferred"
  actor_id: string
  created_at: string
}

// ============================================
// AI Output Contracts
// ============================================

export interface Decision {
  id: string
  summary: string
  confidence: number // 0-1
  source_refs: string[]
  timestamp: string
}

export interface ActionItem {
  title: string
  description?: string
  owner_hint?: string
  due_hint?: string
  priority_hint: "low" | "medium" | "high" | "urgent"
  dependencies?: string[]
  source_refs: string[]
}

export interface Insight {
  id: string
  headline: string
  why_it_matters: string
  recommendation: string
  risk_level: "low" | "medium" | "high" | "critical"
  evidence_refs: string[]
  hub_tags: HubTag[]
  created_at: string
}

export interface ActionRequest {
  action_type: "create_task" | "render_template" | "send_message" | "update_record" | "schedule_job"
  scope: AccessScope
  requires_approval: boolean
  proposed_changes: Record<string, unknown>
  rollback_plan?: Record<string, unknown>
}

// ============================================
// Persona Revelation (Bliss)
// ============================================

export interface PersonaProfile {
  user_id: string
  name: string
  date_of_birth: string
  life_path_number: number
  expression_number: number
  soul_urge_number: number
  personality_number: number
  traits: string[]
  default_view: HubTag
  suggested_defaults: Record<string, unknown>
  created_at: string
}
