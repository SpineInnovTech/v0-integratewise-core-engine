/**
 * IntegrateWise Normalizer Service - Type Definitions
 *
 * Best Practice: All types include correlation_id for end-to-end tracing
 */

// =============================================================================
// ENTITY TYPES
// =============================================================================

export type EntityType =
  // ── Shared / Cross-Domain ──
  | "client"
  | "account"
  | "account_contact"
  | "internal_team_member"
  | "account_team_assignment"
  | "deal"
  | "ticket"
  | "subscription"
  | "event"
  | "task"
  | "insight"
  | "engagement_log"
  | "engagement"
  // ── Account Success / CSM ──
  | "account_master"
  | "people_team"
  | "business_context"
  | "strategic_objective"
  | "capability"
  | "value_stream"
  | "api_portfolio"
  | "account_metric"
  | "initiative"
  | "risk_register"
  | "platform_health"
  | "stakeholder_outcome"
  | "success_plan"
  | "generated_insight"
  | "platform_health_metric"
  | "metrics_history"
  | "external_integration"
  | "sync_log"
  | "technical_asset"
  | "technical_service"
  | "environment_health"
  | "usage_dimension"
  // ── Sales / RevOps / SalesOps ──
  | "revenue_master"
  | "pipeline_intelligence"
  | "forecast"
  | "quota"
  | "revenue_attribution"
  | "billing_sync"
  | "territory"
  | "commission"
  | "revenue_metric"
  | "churn_analysis"
  | "competitor_intel"
  | "rep_performance"
  // ── Marketing ──
  | "campaign"
  | "lead_attribution"
  | "email_campaign"
  | "social_campaign"
  | "content_asset"
  | "landing_page"
  | "form_submission"
  | "website_analytics"
  | "seo_tracker"
  | "ad_spend"
  | "audience_segment"
  | "funnel_stage"
  | "marketing_metric"
  // ── Support ──
  | "sla_tracker"
  | "knowledge_article"
  | "csat_survey"
  | "agent_performance"
  | "escalation"
  | "queue"
  | "bug_report"
  | "feature_request"
  | "resolution"
  | "support_metric"
  | "customer_feedback"
  // ── Finance ──
  | "invoice"
  | "payment"
  | "subscription_billing"
  | "revenue_recognition"
  | "expense"
  | "budget"
  | "financial_forecast"
  | "tax_record"
  | "vendor_payment"
  | "accounts_receivable"
  | "accounts_payable"
  | "financial_metric"
  | "audit_entry"
  // ── Legal ──
  | "contract"
  | "compliance_check"
  | "legal_entity"
  | "nda"
  | "ip_asset"
  | "litigation"
  | "regulatory_filing"
  | "policy"
  | "amendment"
  | "legal_approval"
  | "legal_risk"
  | "legal_metric"
  // ── HR ──
  | "employee"
  | "candidate"
  | "job_posting"
  | "interview"
  | "onboarding"
  | "performance_review"
  | "compensation"
  | "leave"
  | "training"
  | "team_structure"
  | "engagement_survey"
  | "headcount_plan"
  | "hr_metric"
  // ── Engineering ──
  | "eng_project"
  | "sprint"
  | "issue"
  | "pull_request"
  | "deployment"
  | "incident"
  | "service_health"
  | "architecture_decision"
  | "tech_debt"
  | "code_review"
  | "release"
  | "ci_cd_pipeline"
  | "infrastructure"
  | "engineering_metric"
  // ── Personal ──
  | "personal_dashboard"
  | "personal_task"
  | "calendar_event"
  | "note"
  | "personal_goal"
  | "habit"
  | "bookmark"
  | "journal_entry"
  | "personal_contact"
  | "personal_project"
  | "time_log"
  | "personal_metric"
  // ── BizOps / Console ──
  | "organization"
  | "department"
  | "integration"
  | "workflow"
  | "rbac_policy"
  | "user_activity"
  | "notification"
  | "approval_item"
  | "platform_usage"
  | "bizops_metric"
  | "system_health_entry";

// =============================================================================
// NORMALIZATION REQUEST/RESPONSE
// =============================================================================

export interface NormalizeRequest {
  tenant_id: string;
  category?: "personal" | "csm" | "business" | "team" | "tam" | "account_success";
  user_id?: string;
  account_id?: string;
  team_id?: string;
  user_role?: string;
  entity_type: EntityType;
  raw_data: Record<string, unknown>;
  source_system?: string;
  idempotency_key?: string;
  correlation_id?: string; // Best Practice: Correlation ID for tracing
}

export interface NormalizeResponse {
  success: boolean;
  entity_type: EntityType;
  dedup_key: string;
  version: number;
  normalized_data?: Record<string, unknown>;
  errors?: ValidationError[];
  dlq_id?: string;
  correlation_id?: string; // Best Practice: Echo back correlation ID
  is_duplicate?: boolean; // Best Practice: Indicate if this was a duplicate
  trust_metrics?: TrustMetrics; // Trust Layer: Verifiability score
}

export interface TrustMetrics {
  score: number; // 0-100
  reasoning: string[];
  provenance: {
    source: string;
    verified: boolean;
    hops: number;
  };
}

export interface BatchNormalizeRequest {
  tenant_id: string;
  entity_type: EntityType;
  items: Record<string, unknown>[];
  source_system?: string;
}

export interface BatchNormalizeResponse {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: NormalizeResponse[];
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: ErrorCode;
  value?: unknown;
}

export type ErrorCode =
  | "validation_error"
  | "format_error"
  | "missing_field"
  | "invalid_type"
  | "invalid_enum"
  | "constraint_violation"
  | "schema_not_found"
  | "unknown_error";

export interface ValidateRequest {
  entity_type: EntityType;
  data: Record<string, unknown>;
}

export interface ValidateResponse {
  valid: boolean;
  errors: ValidationError[];
}

// =============================================================================
// DLQ (Dead Letter Queue)
// =============================================================================

export interface DLQEntry {
  id: string;
  tenant_id: string;
  entity_type: EntityType;
  raw_data: Record<string, unknown>;
  errors: ValidationError[];
  error_classification: ErrorClassification;
  source_system?: string;
  occurred_at: string;
  resolved: boolean;
  resolved_at?: string;
  retry_count: number;
}

export type ErrorClassification =
  | "validation" // Schema validation failed
  | "format" // Data format issues (dates, UUIDs, etc.)
  | "missing_field" // Required field missing
  | "transform" // Transformation/mapping error
  | "system"; // System/database error

export interface DLQWriteResult {
  success: boolean;
  dlq_id?: string;
  error?: string;
}

// =============================================================================
// CANONICAL VERSION MANAGEMENT
// =============================================================================

export interface VersionInfo {
  dedup_key: string;
  version: number;
  updated_at: string;
}

// =============================================================================
// SCHEMA REGISTRY
// =============================================================================

export interface SchemaInfo {
  entity_type: EntityType;
  schema_id: string;
  title: string;
  description: string;
  required_fields: string[];
  version: string;
}

// =============================================================================
// ENVIRONMENT BINDINGS
// =============================================================================

export interface Env {
  ENVIRONMENT: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  DATABASE_URL?: string;
  DB: D1Database;
  FILES: R2Bucket;
}
