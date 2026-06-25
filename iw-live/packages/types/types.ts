/**
 * IntegrateWise V11.11 - Spine Types
 *
 * LOOP B: Truth Store Types
 * The Spine is the SINGLE SOURCE OF TRUTH for all verified, normalized data.
 * Data enters ONLY through the Loader → Normalizer pipeline.
 */

// =============================================================================
// SPINE ENTITIES
// =============================================================================

export interface SpineOrganization {
  spine_id: string;
  workspace_id: string;

  // Identity
  name: string;
  domain?: string;
  legal_name?: string;

  // Classification
  industry?: string;
  segment?: "enterprise" | "mid_market" | "smb" | "startup";
  region?: string;

  // Financials
  arr?: number;
  mrr?: number;
  contract_value?: number;
  currency?: string;

  // Size
  employee_count?: number;
  license_count?: number;
  active_users?: number;

  // Health & Status
  health_score?: number; // 0-100
  health_status?: "champion" | "healthy" | "at_risk" | "critical";
  lifecycle_stage?: "prospect" | "onboarding" | "active" | "at_risk" | "churned";

  // Technical
  technical_score?: number;
  technical_metrics?: Record<string, unknown>;
  mulesoft_org_id?: string;

  // Dates
  customer_since?: string;
  renewal_date?: string;
  last_qbr_date?: string;
  next_qbr_date?: string;
  churn_date?: string;

  // Ownership
  primary_csm_id?: string;
  primary_tam_id?: string;
  sales_owner_id?: string;
  support_lead_id?: string;
  accounts_contact_id?: string;

  // Cross-team
  account_team?: AccountTeamMember[];

  // External IDs
  sources?: SourceMapping[];

  // Metadata
  tags?: string[];
  custom_fields?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export interface AccountTeamMember {
  person_id: string;
  team_role: "csm" | "tam" | "sales" | "support_lead" | "accounts" | "proserv";
  is_primary: boolean;
  permission_level: "view" | "edit" | "admin";
}

export interface SourceMapping {
  source_type: string; // 'salesforce', 'hubspot', 'zendesk', etc.
  external_id: string;
  synced_at: string;
}

export interface SpinePerson {
  spine_id: string;
  workspace_id: string;

  // Identity
  first_name?: string;
  last_name?: string;
  full_name?: string;

  // Contact
  email?: string;
  phone?: string;
  linkedin_url?: string;

  // Internal linkage
  user_id?: string;
  is_internal: boolean;

  // Organization
  organization_id?: string;

  // Professional
  job_title?: string;
  department?: string;
  seniority?: "c_level" | "vp" | "director" | "manager" | "individual_contributor";

  // Relationship
  role_type?: "champion" | "decision_maker" | "influencer" | "user" | "blocker" | "economic_buyer";
  relationship_strength?: number; // 1-10
  last_contacted_at?: string;

  // Internal team (for employees)
  team?: "cs" | "tam" | "sales" | "support" | "accounts" | "proserv";
  team_role?: string;

  // External IDs
  sources?: SourceMapping[];

  // Metadata
  tags?: string[];
  metadata?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export interface SpineDeal {
  spine_id: string;
  workspace_id: string;
  organization_id?: string;

  // Deal info
  name: string;
  stage: "discovery" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

  // Value
  amount?: number;
  currency?: string;
  probability?: number;

  // Dates
  expected_close_date?: string;
  actual_close_date?: string;

  // Ownership
  owner_id?: string;

  // Type
  deal_type?: "new_business" | "expansion" | "renewal" | "upsell";

  // External IDs
  sources?: SourceMapping[];

  // Metadata
  notes?: string;
  metadata?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export interface SpineTicket {
  spine_id: string;
  workspace_id: string;
  organization_id?: string;
  contact_id?: string;

  // Ticket info
  subject: string;
  description?: string;
  status: "open" | "pending" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";

  // Classification
  category?: string;
  subcategory?: string;

  // Assignment
  assigned_to?: string;

  // SLA
  sla_due_at?: string;
  sla_breached?: boolean;

  // Resolution
  resolved_at?: string;
  resolution_notes?: string;
  satisfaction_score?: number; // 1-5

  // External IDs
  sources?: SourceMapping[];

  // Metadata
  metadata?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export interface SpineEvent {
  spine_id: string;
  workspace_id: string;
  organization_id?: string;

  // Event info
  event_type: "call" | "meeting" | "email" | "note" | "task" | "qbr" | "ebr";
  subject?: string;
  description?: string;

  // Timing
  occurred_at: string;
  duration_minutes?: number;

  // Participants
  participants?: string[];

  // Related entities
  deal_id?: string;
  ticket_id?: string;

  // Actor
  created_by?: string;

  // External IDs
  sources?: SourceMapping[];

  // Metadata
  metadata?: Record<string, unknown>;

  created_at: string;
}

export interface SpineMetric {
  metric_id: string;
  workspace_id: string;
  organization_id?: string;

  // Metric info
  metric_type: "adoption" | "usage" | "engagement" | "nps" | "csat" | "api_calls";
  metric_name: string;
  metric_value: number;
  metric_unit?: string;

  // Time
  measured_at: string;
  period?: "hourly" | "daily" | "weekly" | "monthly";

  // Metadata
  metadata?: Record<string, unknown>;

  created_at: string;
}

export interface SpineDocument {
  spine_id: string;
  workspace_id: string;
  organization_id?: string;

  // Document info
  title: string;
  document_type?: "contract" | "sow" | "proposal" | "qbr_deck" | "technical_doc" | "support_doc";
  description?: string;

  // Storage
  file_url?: string;
  file_size?: number;
  mime_type?: string;

  // Version
  version?: string;
  is_current?: boolean;

  // Dates
  effective_date?: string;
  expiry_date?: string;

  // External IDs
  sources?: SourceMapping[];

  // Search
  content_text?: string;

  // Metadata
  tags?: string[];
  metadata?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

// =============================================================================
// HEALTH SCORE CALCULATION
// =============================================================================

export interface HealthScoreComponents {
  business_health: number; // 40%
  technical_health: number; // 30%
  engagement_health: number; // 20%
  financial_health: number; // 10%
}

export interface HealthScoreInput {
  organization_id: string;

  // Business signals
  platform_adoption?: number;
  growth_trajectory?: number;

  // Technical signals
  api_success_rate?: number;
  error_count?: number;
  uptime?: number;

  // Engagement signals
  login_frequency?: number;
  feature_usage?: number;
  support_tickets?: number;

  // Financial signals
  payment_status?: "current" | "overdue" | "at_risk";
  contract_growth?: number;
}

export function calculateHealthScore(input: HealthScoreInput): number {
  const components: HealthScoreComponents = {
    business_health: calculateBusinessHealth(input),
    technical_health: calculateTechnicalHealth(input),
    engagement_health: calculateEngagementHealth(input),
    financial_health: calculateFinancialHealth(input),
  };

  // Composite formula (V11.11)
  return Math.round(
    components.business_health * 0.4 +
      components.technical_health * 0.3 +
      components.engagement_health * 0.2 +
      components.financial_health * 0.1
  );
}

function calculateBusinessHealth(input: HealthScoreInput): number {
  let score = 50; // Base score

  if (input.platform_adoption !== undefined) {
    score = input.platform_adoption;
  }

  if (input.growth_trajectory !== undefined) {
    score = (score + input.growth_trajectory) / 2;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateTechnicalHealth(input: HealthScoreInput): number {
  let score = 100; // Start healthy

  if (input.api_success_rate !== undefined) {
    score = Math.min(score, input.api_success_rate);
  }

  if (input.error_count !== undefined) {
    const errorPenalty = Math.min(50, input.error_count * 5);
    score -= errorPenalty;
  }

  if (input.uptime !== undefined) {
    score = (score + input.uptime) / 2;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateEngagementHealth(input: HealthScoreInput): number {
  let score = 50;

  if (input.login_frequency !== undefined) {
    // Higher login = better (normalize to 0-100)
    score = Math.min(100, input.login_frequency * 10);
  }

  if (input.feature_usage !== undefined) {
    score = (score + input.feature_usage) / 2;
  }

  // Support tickets reduce engagement score
  if (input.support_tickets !== undefined) {
    const ticketPenalty = Math.min(30, input.support_tickets * 3);
    score -= ticketPenalty;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateFinancialHealth(input: HealthScoreInput): number {
  let score = 100;

  if (input.payment_status === "overdue") {
    score -= 50;
  } else if (input.payment_status === "at_risk") {
    score -= 25;
  }

  if (input.contract_growth !== undefined) {
    if (input.contract_growth > 0) {
      score = Math.min(100, score + 10);
    } else if (input.contract_growth < 0) {
      score -= 20;
    }
  }

  return Math.min(100, Math.max(0, score));
}

export function getHealthStatus(score: number): SpineOrganization["health_status"] {
  if (score >= 75) return "champion";
  if (score >= 50) return "healthy";
  if (score >= 25) return "at_risk";
  return "critical";
}
