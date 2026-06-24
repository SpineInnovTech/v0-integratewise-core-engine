/**
 * Spine Schema Types and Resolver
 *
 * PRINCIPLE: Schema is Backend IP
 * - Frontend NEVER sees entity_type names
 * - Frontend NEVER sees field names (health_score, arr, etc.)
 * - BFF translates technical names to organic UI labels
 *
 * Data Flow:
 * Schema → Loader (fetches priority_fields only)
 *      → Normalizer (S3 Filter, S5 Extract, S6 Validate using schema)
 *      → Spine (1 entity = 1 table)
 *      → BFF (transforms to organic labels)
 *      → UI (renders sections based on entity count)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE SCHEMA TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Shape of department spine configuration */
export interface SpineConfigShape {
  entity_types: string[];
  priority_fields: Record<string, string[]>;
  /** Field-level policy per entity type (optional — extends priority_fields) */
  field_policies?: Record<string, EntityFieldPolicy>;
}

/**
 * Field-level schema policy for an entity type.
 *
 * This formalizes what "schema decides what survives" means at the field level:
 * - required_fields: Must be present after extraction. Pipeline quarantines if missing.
 * - allowed_fields: Only these fields survive S5 Extract. Everything else is pruned.
 *   (Derived from priority_fields if not explicitly set.)
 * - canonical_mapping: Maps provider field names to canonical field names.
 *   e.g., { "properties.firstname": "first_name", "properties.hs_object_id": "external_id" }
 * - sensitivity: Fields marked 'pii' get special handling (masking, audit, etc.)
 * - searchable: Fields indexed for workspace search.
 * - ai_readable: Fields the Twin can reference. Storage-only fields are excluded.
 */
export interface EntityFieldPolicy {
  required_fields: string[];
  allowed_fields: string[];
  canonical_mapping?: Record<string, string>;
  sensitivity?: Record<string, "public" | "internal" | "pii">;
  searchable?: string[];
  ai_readable?: string[];
}

/** Industry-specific overrides */
export interface IndustryProfile {
  entity_types_extra?: string[];
  priority_fields_override?: Record<string, string[]>;
}

/** Fully resolved schema for a tenant */
export interface ResolvedSchema {
  tenant_id: string;
  department: string;
  industry?: string | null;
  version: string;
  entity_types: string[];
  priority_fields: Record<string, string[]>;
  /** Field-level policies per entity type (extends priority_fields) */
  field_policies?: Record<string, EntityFieldPolicy>;
  /** When the schema was resolved */
  resolved_at: string;
}

/** Schema reference passed through pipeline */
export interface SchemaReference {
  tenant_id: string;
  schema_version: string;
  /** Hash for caching */
  cache_key: string;
}

/** Normalizer stage context with schema */
export interface NormalizerContext {
  schema: ResolvedSchema;
  stage: NormalizerStage;
  entityType?: string;
  validationErrors?: ValidationError[];
}

/** 8-stage normalizer pipeline */
export type NormalizerStage =
  | "analyze" // S1: Parse and structure raw data
  | "classify" // S2: Classify into entity types
  | "filter" // S3: Filter to allowed entity types
  | "refine" // S4: Deduplicate and normalize
  | "extract" // S5: Extract priority fields only
  | "validate" // S6: Validate field types
  | "sanity" // S7: Sanity checks and flagging
  | "sectorize"; // S8: Write to Spine tables

/** Validation error from S6 */
export interface ValidationError {
  field: string;
  entity_type: string;
  error: string;
  severity: "warning" | "error";
}

/** Organic capability - what frontend sees instead of entity_type */
export interface OrganicCapability {
  id: string;
  title: string;
  description: string;
  /** Maps to internal entity types (Backend IP) */
  _entity_types?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN SPINE CONFIGURATION - 12 Departments
// ═══════════════════════════════════════════════════════════════════════════════

export const DOMAIN_SPINE_CONFIG: Record<string, SpineConfigShape> = {
  // ─── CUSTOMER SUCCESS (16 entity types) ─────────────────────────────────────
  CUSTOMER_SUCCESS: {
    entity_types: [
      "account",
      "contact",
      "success_plan",
      "ticket",
      "engagement",
      "contract",
      "people_team",
      "business_context",
      "strategic_objective",
      "capability",
      "value_stream",
      "api_portfolio",
      "platform_health_metric",
      "initiative",
      "risk_register",
      "stakeholder_outcome",
      "generated_insight",
      "task",
    ],
    priority_fields: {
      account: [
        "health_score",
        "health_score_trend",
        "health_score_change",
        "renewal_risk_level",
        "arr",
        "acv",
        "csm_narrative",
        "contract_type",
        "contract_start_date",
        "contract_end_date",
        "renewal_date",
        "days_to_renewal",
        "executive_sponsor_customer",
        "executive_sponsor_mulesoft",
        "customer_annual_revenue",
        "employee_count",
        "geography",
        "industry_vertical",
        "industry_sub_sector",
        "engagement_cadence",
        "last_engagement_date",
        "next_engagement_due",
      ],
      people_team: [
        "accounts_assigned",
        "account_count",
        "total_arr_managed",
        "avg_health_score",
        "at_risk_account_count",
      ],
      business_context: [
        "business_model",
        "market_position",
        "operating_environment",
        "key_business_challenges",
        "strategic_priorities",
        "digital_maturity",
        "it_complexity_score",
        "legacy_system_count",
        "cloud_strategy",
        "data_classification",
      ],
      strategic_objective: [
        "strategic_pillar",
        "objective_name",
        "business_driver",
        "quantified_goal",
        "target_date",
        "business_value_usd",
        "relevance",
        "status",
        "progress_percent",
        "health_indicator",
        "linked_capabilities",
        "linked_value_streams",
        "linked_initiatives",
      ],
      capability: [
        "capability_domain",
        "current_maturity",
        "target_maturity",
        "maturity_gap",
        "gap_status",
        "investment_required",
        "priority",
        "implementation_status",
        "business_impact_status",
      ],
      value_stream: [
        "business_process",
        "integration_endpoints",
        "apis_consumed",
        "annual_transaction_volume",
        "cycle_time_baseline",
        "cycle_time_current",
        "cycle_time_target",
        "cycle_time_reduction",
        "total_business_value",
        "customer_satisfaction",
        "operational_risk_level",
      ],
      api_portfolio: [
        "api_type",
        "monthly_transactions",
        "avg_response_time",
        "sla_target",
        "sla_compliance",
        "error_rate",
        "uptime",
        "business_criticality",
        "health_status",
      ],
      platform_health_metric: [
        "metric_category",
        "metric_type",
        "current_value",
        "target_value",
        "threshold_warning",
        "threshold_critical",
        "health_status",
        "trend_is_good",
      ],
      initiative: [
        "initiative_type",
        "priority",
        "phase",
        "status",
        "investment_amount",
        "expected_annual_benefit",
        "expected_payback_months",
        "realized_annual_benefit",
        "success_criteria",
        "blockers",
        "days_overdue",
      ],
      risk_register: [
        "risk_category",
        "impact",
        "impact_score",
        "probability",
        "probability_score",
        "risk_score",
        "risk_level",
        "mitigation_strategy",
        "mitigation_initiative",
        "target_resolution_date",
        "status",
      ],
      stakeholder_outcome: [
        "stakeholder_type",
        "outcome_statement",
        "success_metric",
        "baseline_value",
        "current_value",
        "target_value",
        "target_achievement_percent",
        "status",
      ],
      engagement: [
        "engagement_type",
        "attendees_customer",
        "customer_seniority",
        "topics_discussed",
        "action_items",
        "sentiment",
        "relationship_depth_score",
        "next_steps",
      ],
      success_plan: [
        "executive_summary",
        "plan_period",
        "plan_status",
        "strategic_objectives_count",
        "key_initiatives",
        "top_3_risks",
        "next_qbr_date",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_metric",
        "linked_risk",
        "linked_initiative",
        "linked_objective",
      ],
      ticket: ["severity", "priority", "category", "resolved_at", "status"],
      contract: ["end_date", "auto_renew", "value", "payment_terms"],
      task: ["linked_risk", "linked_initiative", "source", "external_task_id"],
    },
  },

  // ─── REVOPS (14 entity types) ───────────────────────────────────────────────
  REVOPS: {
    entity_types: [
      "account",
      "opportunity",
      "contact",
      "activity",
      "campaign",
      "pipeline_stage",
      "forecast",
      "quota",
      "territory",
      "comp_plan",
      "revenue_metric",
      "attribution",
      "segment_rule",
      "generated_insight",
    ],
    priority_fields: {
      account: [
        "arr",
        "mrr",
        "segment",
        "region",
        "industry",
        "lifecycle_stage",
        "owner_id",
        "health_score",
      ],
      opportunity: [
        "amount",
        "stage",
        "probability",
        "close_date",
        "forecast_category",
        "owner_id",
        "source",
        "type",
        "days_in_stage",
        "next_step",
        "competitor",
        "weighted_amount",
        "pipeline_id",
        "created_date",
        "last_activity_date",
      ],
      pipeline_stage: [
        "stage_name",
        "stage_order",
        "conversion_rate",
        "avg_days_in_stage",
        "deal_count",
        "total_value",
      ],
      forecast: [
        "period",
        "committed",
        "best_case",
        "pipeline",
        "closed",
        "gap_to_target",
        "confidence",
        "owner_id",
      ],
      quota: [
        "period",
        "target_amount",
        "attained_amount",
        "attainment_percent",
        "owner_id",
        "territory_id",
      ],
      territory: [
        "territory_name",
        "region",
        "account_count",
        "total_arr",
        "owner_id",
        "quota_target",
      ],
      comp_plan: ["plan_name", "plan_type", "base_salary", "ote", "accelerators", "effective_date"],
      revenue_metric: [
        "metric_name",
        "metric_type",
        "current_value",
        "target_value",
        "trend",
        "period",
        "segment",
        "threshold_warning",
        "threshold_critical",
      ],
      attribution: [
        "channel",
        "source",
        "medium",
        "first_touch_revenue",
        "multi_touch_revenue",
        "campaign_id",
        "conversion_count",
      ],
      campaign: [
        "budget",
        "actual_cost",
        "channel",
        "roi",
        "pipeline_generated",
        "leads_generated",
        "conversion_rate",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_metric",
        "linked_opportunity",
      ],
    },
  },

  // ─── SALES (14 entity types) ────────────────────────────────────────────────
  SALES: {
    entity_types: [
      "account",
      "contact",
      "opportunity",
      "activity",
      "engagement",
      "lead",
      "pipeline_stage",
      "quote",
      "territory",
      "sales_sequence",
      "call_log",
      "email_sequence",
      "competitor_intel",
      "generated_insight",
    ],
    priority_fields: {
      account: [
        "arr",
        "mrr",
        "segment",
        "industry",
        "owner_id",
        "last_activity_date",
        "account_tier",
      ],
      contact: [
        "title",
        "linkedin_url",
        "phone",
        "decision_maker",
        "buying_role",
        "engagement_score",
        "last_contacted",
        "preferred_channel",
      ],
      opportunity: [
        "amount",
        "stage",
        "probability",
        "close_date",
        "source",
        "type",
        "next_step",
        "competitor",
        "champion_contact",
        "decision_date",
        "days_in_stage",
      ],
      lead: [
        "lead_source",
        "lead_score",
        "status",
        "qualification_date",
        "conversion_date",
        "icp_match_score",
      ],
      quote: ["quote_amount", "discount_percent", "valid_until", "status", "version", "line_items"],
      sales_sequence: [
        "sequence_name",
        "step_count",
        "enrolled_count",
        "reply_rate",
        "meeting_rate",
      ],
      call_log: ["duration", "outcome", "sentiment", "next_action", "recording_url"],
      competitor_intel: [
        "competitor_name",
        "strength",
        "weakness",
        "win_rate_against",
        "common_objections",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_opportunity",
        "linked_contact",
      ],
    },
  },

  // ─── MARKETING (15 entity types) ────────────────────────────────────────────
  MARKETING: {
    entity_types: [
      "campaign",
      "contact",
      "account",
      "engagement",
      "lead",
      "landing_page",
      "email_campaign",
      "social_post",
      "content_asset",
      "attribution_touchpoint",
      "ab_test",
      "audience_segment",
      "marketing_metric",
      "generated_insight",
    ],
    priority_fields: {
      campaign: [
        "budget",
        "actual_cost",
        "channel",
        "target_audience",
        "roi",
        "leads_generated",
        "pipeline_generated",
        "conversion_rate",
        "start_date",
        "end_date",
        "status",
        "campaign_type",
      ],
      lead: [
        "lead_source",
        "lead_score",
        "status",
        "mql_date",
        "sql_date",
        "lifecycle_stage",
        "utm_source",
        "utm_medium",
      ],
      landing_page: [
        "url",
        "visitors",
        "conversions",
        "conversion_rate",
        "bounce_rate",
        "avg_time_on_page",
      ],
      email_campaign: [
        "subject",
        "send_count",
        "open_rate",
        "click_rate",
        "unsubscribe_rate",
        "revenue_attributed",
      ],
      social_post: ["platform", "engagement_rate", "impressions", "clicks", "shares", "sentiment"],
      content_asset: [
        "asset_type",
        "title",
        "downloads",
        "views",
        "leads_generated",
        "funnel_stage",
      ],
      attribution_touchpoint: [
        "channel",
        "source",
        "medium",
        "weight",
        "revenue_attributed",
        "model_type",
      ],
      ab_test: ["test_name", "variant_a", "variant_b", "winner", "confidence", "lift_percent"],
      audience_segment: ["segment_name", "size", "criteria", "engagement_rate", "conversion_rate"],
      marketing_metric: [
        "metric_name",
        "current_value",
        "target_value",
        "trend",
        "period",
        "cac",
        "ltv_cac_ratio",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_campaign",
        "linked_segment",
      ],
    },
  },

  // ─── PRODUCT_ENGINEERING (16 entity types) ──────────────────────────────────
  PRODUCT_ENGINEERING: {
    entity_types: [
      "task",
      "note",
      "activity",
      "user",
      "feature",
      "bug",
      "sprint",
      "release",
      "incident",
      "repository",
      "pull_request",
      "deployment",
      "feedback",
      "roadmap_item",
      "engineering_metric",
      "generated_insight",
    ],
    priority_fields: {
      task: [
        "priority",
        "status",
        "assigned_to",
        "due_date",
        "story_points",
        "sprint_id",
        "labels",
      ],
      feature: [
        "feature_name",
        "status",
        "priority",
        "effort_estimate",
        "business_value",
        "owner",
        "target_release",
      ],
      bug: [
        "severity",
        "priority",
        "status",
        "assigned_to",
        "affected_version",
        "steps_to_reproduce",
        "resolution",
      ],
      sprint: [
        "sprint_name",
        "start_date",
        "end_date",
        "velocity",
        "committed_points",
        "completed_points",
        "burndown",
      ],
      release: [
        "version",
        "release_date",
        "features_count",
        "bugs_fixed",
        "status",
        "rollback_plan",
      ],
      incident: [
        "severity",
        "status",
        "title",
        "description",
        "affected_services",
        "detected_at",
        "resolved_at",
        "mttr_minutes",
        "root_cause",
        "postmortem_url",
      ],
      repository: [
        "repo_name",
        "language",
        "open_prs",
        "open_issues",
        "last_commit",
        "coverage_percent",
      ],
      pull_request: [
        "title",
        "author",
        "status",
        "review_count",
        "lines_changed",
        "cycle_time_hours",
      ],
      deployment: [
        "environment",
        "version",
        "status",
        "deployed_by",
        "deployed_at",
        "rollback_available",
      ],
      feedback: ["source", "category", "sentiment", "feature_request", "priority", "votes"],
      roadmap_item: [
        "title",
        "quarter",
        "theme",
        "status",
        "confidence",
        "business_impact",
        "effort",
      ],
      engineering_metric: [
        "metric_name",
        "current_value",
        "target_value",
        "trend",
        "deploy_frequency",
        "lead_time",
        "mttr",
        "change_failure_rate",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_incident",
        "linked_feature",
      ],
    },
  },

  // ─── FINANCE (15 entity types) ──────────────────────────────────────────────
  FINANCE: {
    entity_types: [
      "invoice",
      "contract",
      "account",
      "opportunity",
      "expense",
      "budget",
      "revenue_entry",
      "payment",
      "tax_filing",
      "financial_report",
      "vendor",
      "cost_center",
      "forecast_entry",
      "compliance_item",
      "generated_insight",
    ],
    priority_fields: {
      invoice: [
        "invoice_number",
        "amount",
        "currency",
        "status",
        "due_date",
        "paid_date",
        "payment_method",
        "line_items",
        "tax_amount",
        "discount",
        "aging_bucket",
      ],
      contract: [
        "value",
        "payment_terms",
        "start_date",
        "end_date",
        "auto_renew",
        "billing_frequency",
      ],
      account: [
        "arr",
        "mrr",
        "ltv",
        "cac",
        "payment_status",
        "credit_limit",
        "outstanding_balance",
      ],
      expense: [
        "category",
        "amount",
        "currency",
        "vendor",
        "approved_by",
        "receipt_url",
        "cost_center",
        "budget_id",
      ],
      budget: [
        "budget_name",
        "period",
        "allocated_amount",
        "spent_amount",
        "remaining",
        "utilization_percent",
        "department",
      ],
      revenue_entry: ["amount", "type", "period", "recognized", "deferred", "source", "segment"],
      payment: ["amount", "method", "status", "processed_date", "reference", "gateway", "fees"],
      tax_filing: [
        "filing_type",
        "period",
        "amount",
        "status",
        "due_date",
        "filed_date",
        "jurisdiction",
      ],
      financial_report: [
        "report_type",
        "period",
        "revenue",
        "expenses",
        "net_income",
        "cash_flow",
        "generated_at",
      ],
      vendor: [
        "vendor_name",
        "category",
        "contract_value",
        "payment_terms",
        "rating",
        "risk_level",
      ],
      cost_center: ["center_name", "department", "budget_allocated", "budget_spent", "headcount"],
      forecast_entry: [
        "period",
        "type",
        "projected_amount",
        "confidence",
        "assumptions",
        "scenario",
      ],
      compliance_item: [
        "regulation",
        "requirement",
        "status",
        "due_date",
        "owner",
        "evidence_url",
        "last_audit",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_metric",
        "linked_budget",
      ],
    },
  },

  // ─── SERVICE/SUPPORT (12 entity types) ──────────────────────────────────────
  SERVICE: {
    entity_types: [
      "ticket",
      "contact",
      "account",
      "engagement",
      "sla_policy",
      "knowledge_article",
      "csat_survey",
      "escalation",
      "queue",
      "agent_performance",
      "service_metric",
      "generated_insight",
    ],
    priority_fields: {
      ticket: [
        "severity",
        "priority",
        "category",
        "subcategory",
        "status",
        "channel",
        "assigned_to",
        "first_response_time",
        "resolution_time",
        "resolved_at",
        "customer_sentiment",
        "escalated",
        "reopen_count",
        "tags",
      ],
      sla_policy: [
        "policy_name",
        "priority_level",
        "first_response_target",
        "resolution_target",
        "breach_count",
        "compliance_percent",
      ],
      knowledge_article: [
        "title",
        "category",
        "views",
        "helpfulness_rating",
        "linked_tickets",
        "status",
        "last_updated",
      ],
      csat_survey: ["score", "response_text", "ticket_id", "agent_id", "channel", "submitted_at"],
      escalation: [
        "ticket_id",
        "escalation_level",
        "reason",
        "escalated_to",
        "escalated_at",
        "resolved_at",
        "outcome",
      ],
      queue: [
        "queue_name",
        "ticket_count",
        "avg_wait_time",
        "oldest_ticket_age",
        "agents_online",
        "utilization",
      ],
      agent_performance: [
        "agent_id",
        "tickets_resolved",
        "avg_resolution_time",
        "csat_avg",
        "first_contact_resolution_rate",
        "tickets_escalated",
        "period",
      ],
      service_metric: [
        "metric_name",
        "current_value",
        "target_value",
        "trend",
        "avg_handle_time",
        "first_response_time",
        "resolution_rate",
        "backlog_count",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_ticket",
        "linked_queue",
      ],
    },
  },

  // ─── PROCUREMENT (11 entity types) ──────────────────────────────────────────
  PROCUREMENT: {
    entity_types: [
      "vendor",
      "contract",
      "purchase_order",
      "invoice",
      "spend_category",
      "renewal_tracker",
      "savings_initiative",
      "approval_request",
      "compliance_check",
      "procurement_metric",
      "generated_insight",
    ],
    priority_fields: {
      vendor: [
        "vendor_name",
        "category",
        "tier",
        "contract_value",
        "payment_terms",
        "performance_score",
        "risk_level",
        "diversity_status",
        "sla_compliance",
      ],
      contract: [
        "contract_type",
        "value",
        "start_date",
        "end_date",
        "auto_renew",
        "notice_period",
        "owner",
      ],
      purchase_order: [
        "po_number",
        "vendor_id",
        "amount",
        "status",
        "requested_by",
        "approved_by",
        "delivery_date",
      ],
      spend_category: [
        "category_name",
        "budget_allocated",
        "actual_spend",
        "variance",
        "vendor_count",
        "period",
      ],
      renewal_tracker: [
        "contract_id",
        "vendor_name",
        "renewal_date",
        "days_to_renewal",
        "current_value",
        "proposed_value",
        "risk_level",
        "action_required",
        "owner",
      ],
      savings_initiative: [
        "initiative_name",
        "category",
        "target_savings",
        "realized_savings",
        "status",
        "owner",
        "timeline",
      ],
      approval_request: [
        "request_type",
        "amount",
        "vendor",
        "status",
        "requested_by",
        "approved_by",
        "urgency",
      ],
      compliance_check: [
        "vendor_id",
        "check_type",
        "status",
        "last_checked",
        "next_due",
        "findings",
      ],
      procurement_metric: [
        "metric_name",
        "current_value",
        "target_value",
        "trend",
        "cost_avoidance",
        "cycle_time_days",
        "on_time_delivery_rate",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_vendor",
        "linked_contract",
      ],
    },
  },

  // ─── IT_ADMIN (12 entity types) ─────────────────────────────────────────────
  IT_ADMIN: {
    entity_types: [
      "system",
      "device",
      "user",
      "incident",
      "change_request",
      "vulnerability",
      "backup",
      "certificate",
      "network_device",
      "license",
      "it_metric",
      "generated_insight",
    ],
    priority_fields: {
      system: [
        "system_name",
        "type",
        "environment",
        "status",
        "uptime_percent",
        "owner",
        "criticality",
        "last_patched",
        "version",
        "dependencies",
      ],
      device: [
        "device_name",
        "type",
        "os",
        "status",
        "assigned_to",
        "last_seen",
        "compliance_status",
        "serial_number",
      ],
      incident: [
        "severity",
        "status",
        "title",
        "affected_systems",
        "detected_at",
        "resolved_at",
        "mttr",
        "root_cause",
      ],
      change_request: [
        "title",
        "type",
        "priority",
        "status",
        "risk_level",
        "scheduled_date",
        "approved_by",
        "rollback_plan",
      ],
      vulnerability: [
        "cve_id",
        "severity",
        "affected_systems",
        "status",
        "patch_available",
        "exploitability",
        "remediation_deadline",
      ],
      backup: [
        "system_name",
        "backup_type",
        "last_backup",
        "status",
        "size_gb",
        "retention_days",
        "recovery_tested",
      ],
      certificate: [
        "domain",
        "issuer",
        "expiry_date",
        "days_to_expiry",
        "status",
        "auto_renew",
        "key_algorithm",
      ],
      network_device: [
        "device_name",
        "type",
        "ip_address",
        "status",
        "firmware_version",
        "throughput",
        "error_rate",
      ],
      license: [
        "software_name",
        "license_type",
        "total_seats",
        "used_seats",
        "utilization_percent",
        "renewal_date",
        "annual_cost",
      ],
      it_metric: [
        "metric_name",
        "current_value",
        "target_value",
        "trend",
        "uptime_sla",
        "mean_time_to_detect",
        "mean_time_to_resolve",
        "patch_compliance",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_system",
        "linked_vulnerability",
      ],
    },
  },

  // ─── STUDENT_TEACHER (11 entity types) ──────────────────────────────────────
  STUDENT_TEACHER: {
    entity_types: [
      "student",
      "course",
      "assignment",
      "grade",
      "attendance",
      "discussion",
      "project",
      "learning_objective",
      "intervention",
      "student_metric",
      "generated_insight",
    ],
    priority_fields: {
      student: [
        "student_name",
        "enrollment_status",
        "grade_level",
        "gpa",
        "attendance_rate",
        "at_risk",
        "advisor",
        "program",
        "cohort",
        "engagement_score",
      ],
      course: [
        "course_name",
        "instructor",
        "enrollment_count",
        "avg_grade",
        "completion_rate",
        "semester",
        "credits",
      ],
      assignment: [
        "title",
        "course_id",
        "due_date",
        "status",
        "avg_score",
        "submissions",
        "late_submissions",
      ],
      grade: [
        "student_id",
        "course_id",
        "assignment_id",
        "score",
        "grade_letter",
        "feedback",
        "graded_at",
      ],
      attendance: ["student_id", "course_id", "date", "status", "excused", "consecutive_absences"],
      learning_objective: [
        "objective",
        "course_id",
        "mastery_level",
        "assessment_count",
        "avg_score",
        "status",
      ],
      intervention: [
        "student_id",
        "type",
        "reason",
        "status",
        "assigned_to",
        "start_date",
        "progress",
        "outcome",
        "follow_up_date",
      ],
      student_metric: [
        "metric_name",
        "current_value",
        "target_value",
        "trend",
        "retention_rate",
        "satisfaction_score",
        "placement_rate",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_student",
        "linked_course",
      ],
    },
  },

  // ─── BIZOPS (15 entity types) ───────────────────────────────────────────────
  BIZOPS: {
    entity_types: [
      "account",
      "contact",
      "opportunity",
      "task",
      "campaign",
      "activity",
      "project",
      "workflow",
      "kpi",
      "okr",
      "cross_dept_initiative",
      "resource_allocation",
      "ops_metric",
      "generated_insight",
    ],
    priority_fields: {
      project: [
        "project_name",
        "status",
        "owner",
        "start_date",
        "end_date",
        "budget",
        "progress_percent",
        "department",
      ],
      workflow: [
        "workflow_name",
        "status",
        "trigger",
        "steps_count",
        "executions",
        "success_rate",
        "avg_duration",
      ],
      kpi: [
        "kpi_name",
        "current_value",
        "target_value",
        "trend",
        "owner",
        "department",
        "frequency",
      ],
      okr: [
        "objective",
        "key_results",
        "owner",
        "period",
        "progress_percent",
        "confidence",
        "status",
      ],
      cross_dept_initiative: [
        "initiative_name",
        "departments",
        "sponsor",
        "budget",
        "status",
        "impact_score",
        "timeline",
        "blockers",
        "dependencies",
      ],
      resource_allocation: [
        "resource_name",
        "department",
        "allocation_percent",
        "project_id",
        "period",
        "utilization",
      ],
      ops_metric: [
        "metric_name",
        "current_value",
        "target_value",
        "trend",
        "department",
        "frequency",
        "data_source",
      ],
      generated_insight: [
        "insight_text",
        "recommended_action",
        "status",
        "linked_kpi",
        "linked_project",
      ],
    },
  },

  // ─── PERSONAL (8 entity types) ──────────────────────────────────────────────
  PERSONAL: {
    entity_types: [
      "task",
      "note",
      "activity",
      "calendar_event",
      "bookmark",
      "goal",
      "daily_reflection",
    ],
    priority_fields: {
      task: ["priority", "status", "due_date", "category", "energy_level"],
      goal: ["goal_name", "target_date", "progress_percent", "category", "milestones"],
      daily_reflection: ["date", "wins", "challenges", "energy_level", "focus_score", "gratitude"],
      calendar_event: [
        "title",
        "start_time",
        "end_time",
        "attendees",
        "meeting_type",
        "action_items",
      ],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENT MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

/** Map tenant department IDs (12) to DOMAIN_SPINE_CONFIG keys */
export const DEPARTMENT_TO_CONFIG_KEY: Record<string, string> = {
  SALES: "SALES",
  MARKETING: "MARKETING",
  REVOPS: "REVOPS",
  CUSTOMER_SUCCESS: "CUSTOMER_SUCCESS",
  SUPPORT: "SERVICE",
  ENGINEERING: "PRODUCT_ENGINEERING",
  PRODUCT: "PRODUCT_ENGINEERING",
  FINANCE: "FINANCE",
  LEGAL: "BIZOPS",
  HR: "BIZOPS",
  SUPPLY_CHAIN: "PROCUREMENT",
  SERVICE_OPS: "SERVICE",
  // Maintenance maps to SERVICE — industry extras add maintenance entity types
  MAINTENANCE: "SERVICE",
  FIELD_SERVICE: "SERVICE",
  // Operations and BizOps aliases
  OPERATIONS: "BIZOPS",
  BUSINESS_OPS: "BIZOPS",
  PROJECT_MANAGEMENT: "BIZOPS",
  IT: "IT_ADMIN",
  IT_ADMIN: "IT_ADMIN",
  // Legacy/aliases
  CSM: "CUSTOMER_SUCCESS",
  PROJECTS: "BIZOPS",
};

// ═══════════════════════════════════════════════════════════════════════════════
// INDUSTRY OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════════

export const INDUSTRY_SPINE_BASE: Record<string, IndustryProfile> = {
  SAAS_TECH: {},
  PROFESSIONAL_SERVICES: {
    entity_types_extra: ["contract", "project", "timesheet", "service_delivery"],
  },
  HEALTHCARE: {
    entity_types_extra: [
      "contract",
      "compliance_item",
      "patient_encounter",
      "equipment_maintenance",
    ],
    priority_fields_override: {
      account: ["hipaa_status", "compliance_score", "contract_value"],
      contract: ["value", "start_date", "end_date", "hipaa_baa", "renewal_date"],
      equipment_maintenance: [
        "asset_name",
        "maintenance_type",
        "scheduled_date",
        "status",
        "technician",
        "compliance_required",
      ],
    },
  },
  EDUCATION: { entity_types_extra: ["student", "course", "enrollment"] },
  MANUFACTURING: {
    entity_types_extra: [
      "work_order",
      "supplier",
      "inventory_snapshot",
      "asset",
      "maintenance_schedule",
      "maintenance_record",
    ],
    priority_fields_override: {
      asset: [
        "asset_name",
        "asset_type",
        "location",
        "status",
        "last_maintenance",
        "next_maintenance",
        "criticality",
      ],
      maintenance_schedule: [
        "asset_id",
        "frequency",
        "next_due",
        "assigned_to",
        "maintenance_type",
        "estimated_downtime",
      ],
      maintenance_record: [
        "asset_id",
        "maintenance_type",
        "performed_date",
        "technician",
        "cost",
        "downtime_hours",
        "findings",
      ],
    },
  },
  AUTOMOTIVE: {
    entity_types_extra: [
      "vehicle",
      "part",
      "warranty",
      "service_appointment",
      "maintenance_record",
    ],
    priority_fields_override: {
      service_appointment: [
        "vehicle_id",
        "service_type",
        "scheduled_date",
        "status",
        "technician",
        "estimated_cost",
        "bay_number",
      ],
      maintenance_record: [
        "vehicle_id",
        "service_type",
        "performed_date",
        "mileage",
        "technician",
        "cost",
        "parts_used",
      ],
    },
  },
  RETAIL_COMMERCE: { entity_types_extra: ["order", "inventory", "sku"] },
  FINANCIAL_SERVICES: {
    entity_types_extra: ["compliance_item", "risk_assessment"],
    priority_fields_override: { account: ["kyc_status", "risk_tier", "regulatory_region"] },
  },
  LOGISTICS: {
    entity_types_extra: ["shipment", "carrier", "warehouse", "fleet_maintenance"],
    priority_fields_override: {
      fleet_maintenance: [
        "vehicle_id",
        "maintenance_type",
        "scheduled_date",
        "status",
        "mileage",
        "cost",
        "depot",
      ],
    },
  },
  MEDIA: { entity_types_extra: ["content_asset", "license", "royalty"] },
  PUBLIC_SECTOR: {
    entity_types_extra: ["compliance_item", "contract", "grant"],
    priority_fields_override: {
      account: ["contract_value", "procurement_stage", "compliance_status"],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIC CAPABILITY MAP - What Frontend Sees
// ═══════════════════════════════════════════════════════════════════════════════

export const ORGANIC_CAPABILITY_MAP: Record<string, OrganicCapability[]> = {
  CUSTOMER_SUCCESS: [
    {
      id: "accounts",
      title: "Account Management",
      description: "Track customer health, renewal dates, and expansion opportunities",
      _entity_types: ["account", "people_team"],
    },
    {
      id: "support",
      title: "Support Operations",
      description: "Manage tickets, SLAs, and customer conversations",
      _entity_types: ["ticket", "contact"],
    },
    {
      id: "engagement",
      title: "Engagement Tracking",
      description: "Monitor customer interactions and success plans",
      _entity_types: ["engagement", "success_plan"],
    },
    {
      id: "risks",
      title: "Risk & Renewal Management",
      description: "Identify at-risk accounts and renewal opportunities",
      _entity_types: ["risk_register", "generated_insight"],
    },
    {
      id: "initiatives",
      title: "Success Initiatives",
      description: "Track initiatives, capabilities, and value streams",
      _entity_types: ["initiative", "capability", "value_stream"],
    },
    {
      id: "strategy",
      title: "Strategic Planning",
      description: "Align objectives, stakeholder outcomes, and business context",
      _entity_types: ["strategic_objective", "stakeholder_outcome", "business_context"],
    },
  ],
  SALES: [
    {
      id: "pipeline",
      title: "Pipeline Management",
      description: "Track deals, stages, and forecast accuracy",
      _entity_types: ["opportunity", "pipeline_stage"],
    },
    {
      id: "accounts",
      title: "Account Intelligence",
      description: "Manage prospects, contacts, and account hierarchies",
      _entity_types: ["account", "contact", "lead"],
    },
    {
      id: "activities",
      title: "Activity & Outreach",
      description: "Log calls, emails, and sales sequences",
      _entity_types: ["activity", "engagement", "call_log", "sales_sequence", "email_sequence"],
    },
    {
      id: "territory",
      title: "Territory & Quota",
      description: "Manage territories, quotas, and compensation",
      _entity_types: ["territory", "quote"],
    },
    {
      id: "intel",
      title: "Competitive Intelligence",
      description: "Track competitors and win rates",
      _entity_types: ["competitor_intel", "generated_insight"],
    },
  ],
  REVOPS: [
    {
      id: "forecast",
      title: "Revenue Forecasting",
      description: "Predict revenue with pipeline and historical data",
      _entity_types: ["forecast", "quota", "pipeline_stage"],
    },
    {
      id: "attribution",
      title: "Attribution & Analytics",
      description: "Track what drives revenue across channels",
      _entity_types: ["attribution", "campaign", "segment_rule"],
    },
    {
      id: "process",
      title: "Process Optimization",
      description: "Identify bottlenecks and optimize workflows",
      _entity_types: ["revenue_metric", "generated_insight"],
    },
    {
      id: "planning",
      title: "Strategic Planning",
      description: "Align teams with quotas, territories, and goals",
      _entity_types: ["territory", "comp_plan", "account"],
    },
  ],
  MARKETING: [
    {
      id: "campaigns",
      title: "Campaign Management",
      description: "Plan, execute, and measure marketing campaigns",
      _entity_types: ["campaign", "email_campaign", "social_post"],
    },
    {
      id: "leads",
      title: "Lead Generation",
      description: "Capture and nurture leads through the funnel",
      _entity_types: ["lead", "landing_page", "content_asset"],
    },
    {
      id: "content",
      title: "Content & Assets",
      description: "Manage content performance and asset library",
      _entity_types: ["content_asset", "ab_test"],
    },
    {
      id: "analytics",
      title: "Marketing Analytics",
      description: "Track attribution, ROI, and channel performance",
      _entity_types: [
        "attribution_touchpoint",
        "marketing_metric",
        "audience_segment",
        "generated_insight",
      ],
    },
  ],
  PRODUCT_ENGINEERING: [
    {
      id: "delivery",
      title: "Delivery Management",
      description: "Track sprints, releases, and roadmaps",
      _entity_types: ["sprint", "release", "roadmap_item", "feature"],
    },
    {
      id: "quality",
      title: "Quality & Bugs",
      description: "Manage incidents, bugs, and quality metrics",
      _entity_types: ["bug", "incident", "task"],
    },
    {
      id: "engineering",
      title: "Engineering Operations",
      description: "Monitor repos, deployments, and performance",
      _entity_types: ["repository", "pull_request", "deployment", "engineering_metric"],
    },
    {
      id: "feedback",
      title: "Feedback Loop",
      description: "Collect and act on customer feedback",
      _entity_types: ["feedback", "generated_insight"],
    },
  ],
  FINANCE: [
    {
      id: "revenue",
      title: "Revenue Operations",
      description: "Track invoices, payments, and revenue recognition",
      _entity_types: ["invoice", "payment", "revenue_entry"],
    },
    {
      id: "expenses",
      title: "Expense Management",
      description: "Manage budgets, expenses, and cost centers",
      _entity_types: ["expense", "budget", "cost_center"],
    },
    {
      id: "reporting",
      title: "Financial Reporting",
      description: "Generate reports and compliance documentation",
      _entity_types: ["financial_report", "tax_filing", "compliance_item", "forecast_entry"],
    },
    {
      id: "vendors",
      title: "Vendor Management",
      description: "Track vendor contracts and spend",
      _entity_types: ["vendor", "contract"],
    },
  ],
  SERVICE: [
    {
      id: "tickets",
      title: "Ticket Management",
      description: "Handle support tickets and case resolution",
      _entity_types: ["ticket", "escalation"],
    },
    {
      id: "knowledge",
      title: "Knowledge Base",
      description: "Build and maintain self-service resources",
      _entity_types: ["knowledge_article"],
    },
    {
      id: "quality",
      title: "Service Quality",
      description: "Monitor SLAs, CSAT, and team performance",
      _entity_types: ["sla_policy", "csat_survey", "agent_performance"],
    },
    {
      id: "operations",
      title: "Service Operations",
      description: "Optimize queues, escalations, and workflows",
      _entity_types: ["queue", "service_metric", "generated_insight"],
    },
    {
      id: "maintenance",
      title: "Maintenance & Field Service",
      description:
        "Schedule and track maintenance, assets, and field operations (industry-dependent)",
      _entity_types: [
        "asset",
        "maintenance_schedule",
        "maintenance_record",
        "service_appointment",
        "equipment_maintenance",
        "fleet_maintenance",
      ],
    },
  ],
  PROCUREMENT: [
    {
      id: "vendors",
      title: "Vendor Management",
      description: "Manage supplier relationships and contracts",
      _entity_types: ["vendor", "contract"],
    },
    {
      id: "purchasing",
      title: "Purchasing & POs",
      description: "Track purchase orders and approvals",
      _entity_types: ["purchase_order", "approval_request"],
    },
    {
      id: "spend",
      title: "Spend Analysis",
      description: "Monitor spend categories and savings",
      _entity_types: ["spend_category", "savings_initiative", "procurement_metric"],
    },
    {
      id: "renewals",
      title: "Renewal Tracking",
      description: "Manage contract renewals and negotiations",
      _entity_types: ["renewal_tracker", "compliance_check", "generated_insight"],
    },
  ],
  BIZOPS: [
    {
      id: "strategy",
      title: "Strategic Planning",
      description: "Align initiatives, OKRs, and resources",
      _entity_types: ["okr", "cross_dept_initiative"],
    },
    {
      id: "projects",
      title: "Project Management",
      description: "Track cross-functional projects and deliverables",
      _entity_types: ["project", "task", "workflow"],
    },
    {
      id: "reporting",
      title: "Operations Reporting",
      description: "Build dashboards and operational metrics",
      _entity_types: ["kpi", "ops_metric"],
    },
    {
      id: "coordination",
      title: "Cross-Functional Coordination",
      description: "Align teams and remove blockers",
      _entity_types: ["generated_insight", "cross_dept_initiative"],
    },
  ],
  IT_ADMIN: [
    {
      id: "infrastructure",
      title: "Infrastructure Management",
      description: "Monitor systems, devices, and network",
      _entity_types: ["system", "device", "network_device", "certificate", "backup"],
    },
    {
      id: "security",
      title: "Security & Compliance",
      description: "Track vulnerabilities, patches, and compliance",
      _entity_types: ["vulnerability", "incident", "license"],
    },
    {
      id: "operations",
      title: "IT Operations",
      description: "Manage changes, incidents, and service delivery",
      _entity_types: ["change_request", "incident", "it_metric"],
    },
    {
      id: "insights",
      title: "IT Insights",
      description: "Generate insights and recommendations",
      _entity_types: ["generated_insight"],
    },
  ],
  STUDENT_TEACHER: [
    {
      id: "students",
      title: "Student Management",
      description: "Track student progress, attendance, and interventions",
      _entity_types: ["student", "attendance", "intervention"],
    },
    {
      id: "courses",
      title: "Course Management",
      description: "Manage courses, assignments, and grades",
      _entity_types: ["course", "assignment", "grade", "learning_objective"],
    },
    {
      id: "engagement",
      title: "Engagement",
      description: "Monitor discussions, projects, and participation",
      _entity_types: ["discussion", "project"],
    },
    {
      id: "analytics",
      title: "Educational Analytics",
      description: "Track metrics and generate insights",
      _entity_types: ["student_metric", "generated_insight"],
    },
  ],
  PERSONAL: [
    {
      id: "tasks",
      title: "Task Management",
      description: "Organize tasks and priorities",
      _entity_types: ["task"],
    },
    {
      id: "goals",
      title: "Goal Tracking",
      description: "Set and track personal goals",
      _entity_types: ["goal"],
    },
    {
      id: "calendar",
      title: "Calendar",
      description: "Manage events and meetings",
      _entity_types: ["calendar_event"],
    },
    {
      id: "reflection",
      title: "Daily Reflection",
      description: "Journal and reflect on progress",
      _entity_types: ["daily_reflection", "note"],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT FIELD POLICIES — Core entity types from connector providers
// ═══════════════════════════════════════════════════════════════════════════════
//
// These define the field-level contract for entities that enter via Flow A
// (external connectors). They govern:
//   - What fields MUST exist (required_fields) → quarantine if missing
//   - What fields MAY exist (allowed_fields) → everything else pruned at S5
//   - How provider fields map to canonical names (canonical_mapping)
//   - Sensitivity classification for compliance
//   - Which fields are searchable in the workspace
//   - Which fields the Digital Twin can read
//
// The priority_fields in DOMAIN_SPINE_CONFIG are a subset — they define what
// the BFF exposes to the UI. Field policies are the superset used by the
// 8-stage pipeline for extraction, validation, and storage.
//

export const DEFAULT_FIELD_POLICIES: Record<string, EntityFieldPolicy> = {
  account: {
    required_fields: ["external_id", "name"],
    allowed_fields: [
      "external_id",
      "name",
      "owner_id",
      "owner_name",
      "segment",
      "industry_vertical",
      "industry_sub_sector",
      "health_score",
      "health_score_trend",
      "renewal_risk_level",
      "arr",
      "acv",
      "mrr",
      "contract_type",
      "contract_start_date",
      "contract_end_date",
      "renewal_date",
      "days_to_renewal",
      "employee_count",
      "geography",
      "website",
      "customer_annual_revenue",
      "engagement_cadence",
      "last_engagement_date",
      "next_engagement_due",
      "executive_sponsor_customer",
      "executive_sponsor_internal",
      "status",
      "lifecycle_stage",
      "created_at",
      "updated_at",
    ],
    canonical_mapping: {
      // HubSpot
      "properties.name": "name",
      "properties.hs_object_id": "external_id",
      "properties.industry": "industry_vertical",
      "properties.annualrevenue": "customer_annual_revenue",
      "properties.numberofemployees": "employee_count",
      "properties.website": "website",
      "properties.lifecyclestage": "lifecycle_stage",
      // Salesforce
      Name: "name",
      Id: "external_id",
      Industry: "industry_vertical",
      AnnualRevenue: "customer_annual_revenue",
      NumberOfEmployees: "employee_count",
      Website: "website",
    },
    sensitivity: {
      name: "internal",
      customer_annual_revenue: "internal",
      arr: "internal",
      acv: "internal",
    },
    searchable: ["name", "industry_vertical", "geography", "segment", "owner_name"],
    ai_readable: [
      "name",
      "health_score",
      "renewal_risk_level",
      "arr",
      "days_to_renewal",
      "segment",
      "industry_vertical",
      "engagement_cadence",
      "last_engagement_date",
    ],
  },

  contact: {
    required_fields: ["external_id", "full_name"],
    allowed_fields: [
      "external_id",
      "full_name",
      "first_name",
      "last_name",
      "email",
      "phone",
      "title",
      "role",
      "account_id",
      "account_name",
      "owner_id",
      "owner_name",
      "lifecycle_stage",
      "lead_status",
      "last_contacted_at",
      "last_activity_at",
      "created_at",
      "updated_at",
    ],
    canonical_mapping: {
      // HubSpot
      "properties.firstname": "first_name",
      "properties.lastname": "last_name",
      "properties.email": "email",
      "properties.phone": "phone",
      "properties.jobtitle": "title",
      "properties.hs_object_id": "external_id",
      "properties.lifecyclestage": "lifecycle_stage",
      // Salesforce
      FirstName: "first_name",
      LastName: "last_name",
      Email: "email",
      Phone: "phone",
      Title: "title",
      Id: "external_id",
    },
    sensitivity: {
      email: "pii",
      phone: "pii",
      full_name: "pii",
      first_name: "pii",
      last_name: "pii",
    },
    searchable: ["full_name", "email", "title", "account_name"],
    ai_readable: ["full_name", "title", "role", "account_name", "lifecycle_stage"],
  },

  deal: {
    required_fields: ["external_id", "name"],
    allowed_fields: [
      "external_id",
      "name",
      "amount",
      "currency",
      "stage",
      "pipeline",
      "probability",
      "close_date",
      "expected_close_date",
      "account_id",
      "account_name",
      "owner_id",
      "owner_name",
      "deal_type",
      "source",
      "created_at",
      "updated_at",
    ],
    canonical_mapping: {
      "properties.dealname": "name",
      "properties.amount": "amount",
      "properties.dealstage": "stage",
      "properties.pipeline": "pipeline",
      "properties.closedate": "close_date",
      "properties.hs_object_id": "external_id",
      Name: "name",
      Amount: "amount",
      StageName: "stage",
      CloseDate: "close_date",
      Id: "external_id",
    },
    sensitivity: {
      amount: "internal",
    },
    searchable: ["name", "account_name", "stage", "owner_name"],
    ai_readable: ["name", "amount", "stage", "probability", "close_date", "account_name"],
  },

  ticket: {
    required_fields: ["external_id", "subject"],
    allowed_fields: [
      "external_id",
      "subject",
      "description",
      "status",
      "priority",
      "category",
      "type",
      "account_id",
      "account_name",
      "contact_id",
      "contact_name",
      "assignee_id",
      "assignee_name",
      "source_channel",
      "created_at",
      "updated_at",
      "resolved_at",
      "first_response_at",
      "sla_status",
    ],
    canonical_mapping: {
      "properties.subject": "subject",
      "properties.content": "description",
      "properties.hs_pipeline_stage": "status",
      "properties.hs_ticket_priority": "priority",
      "properties.hs_object_id": "external_id",
      Subject: "subject",
      Description: "description",
      Status: "status",
      Priority: "priority",
      Id: "external_id",
    },
    sensitivity: {
      description: "internal",
    },
    searchable: ["subject", "account_name", "status", "priority", "assignee_name"],
    ai_readable: ["subject", "status", "priority", "sla_status", "account_name"],
  },

  engagement: {
    required_fields: ["external_id", "type"],
    allowed_fields: [
      "external_id",
      "type",
      "subject",
      "body_preview",
      "direction",
      "channel",
      "account_id",
      "account_name",
      "contact_id",
      "contact_name",
      "owner_id",
      "owner_name",
      "sentiment_score",
      "outcome",
      "occurred_at",
      "duration_minutes",
      "created_at",
      "updated_at",
    ],
    canonical_mapping: {
      "properties.hs_engagement_type": "type",
      "properties.hs_timestamp": "occurred_at",
      "properties.hs_object_id": "external_id",
    },
    sensitivity: {
      body_preview: "internal",
    },
    searchable: ["subject", "account_name", "contact_name", "type"],
    ai_readable: ["type", "subject", "sentiment_score", "outcome", "account_name", "occurred_at"],
  },
};

/**
 * Get field policy for an entity type.
 * Returns the default policy if one exists, or a permissive fallback.
 * Used by pipeline S5 (Extract) and S6 (Validate) stages.
 */
export function getFieldPolicy(entityType: string): EntityFieldPolicy {
  const policy = DEFAULT_FIELD_POLICIES[entityType.toLowerCase()];
  if (policy) return policy;

  // Permissive fallback for entity types without explicit policy:
  // Allow any fields, require only external_id and name.
  return {
    required_fields: ["external_id", "name"],
    allowed_fields: [], // Empty = no pruning (all fields pass through)
    searchable: ["name"],
    ai_readable: ["name"],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA RESOLVER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Normalize legacy department IDs to canonical keys */
export function normalizeDepartmentId(raw: string | null | undefined): string {
  const value = (raw || "").trim();
  if (!value) return "SALES";

  const aliases: Record<string, string> = {
    CS: "CUSTOMER_SUCCESS",
    GENERAL: "BIZOPS",
    OPERATIONS: "BIZOPS",
    CSM: "CUSTOMER_SUCCESS",
    PM: "PRODUCT",
    TECH: "ENGINEERING",
    SALES: "SALES",
    MARKETING: "MARKETING",
    REVOPS: "REVOPS",
    CUSTOMER_SUCCESS: "CUSTOMER_SUCCESS",
    SUPPORT: "SUPPORT",
    ENGINEERING: "ENGINEERING",
    PRODUCT: "PRODUCT",
    FINANCE: "FINANCE",
    LEGAL: "LEGAL",
    HR: "HR",
    SUPPLY_CHAIN: "SUPPLY_CHAIN",
    SERVICE_OPS: "SERVICE_OPS",
    BIZOPS: "BIZOPS",
  };

  return aliases[value] || value;
}

/** Compose spine config for (industry, department) */
export function getSpineConfig(
  industry: string | null | undefined,
  department: string
): SpineConfigShape {
  const configKey = DEPARTMENT_TO_CONFIG_KEY[department] || department;
  const base =
    (DOMAIN_SPINE_CONFIG as Record<string, SpineConfigShape>)[configKey] ||
    DOMAIN_SPINE_CONFIG.BIZOPS;
  const industryProfile = industry ? INDUSTRY_SPINE_BASE[industry] : undefined;
  if (!industryProfile) return base;

  const entity_types = [...base.entity_types];
  if (industryProfile.entity_types_extra?.length) {
    for (const e of industryProfile.entity_types_extra) {
      if (!entity_types.includes(e)) entity_types.push(e);
    }
  }
  const priority_fields = { ...base.priority_fields };
  if (industryProfile.priority_fields_override) {
    for (const [entityType, fields] of Object.entries(industryProfile.priority_fields_override)) {
      priority_fields[entityType] = [...(priority_fields[entityType] || []), ...fields];
    }
  }
  return { entity_types, priority_fields };
}

/** Resolve full schema for a tenant */
export function resolveTenantSchema(
  tenantId: string,
  department: string,
  industry?: string | null,
  version: string = "v1"
): ResolvedSchema {
  const config = getSpineConfig(industry, department);
  return {
    tenant_id: tenantId,
    department,
    industry,
    version,
    entity_types: config.entity_types,
    priority_fields: config.priority_fields,
    resolved_at: new Date().toISOString(),
  };
}

/** Get organic capabilities for a department (what UI shows) */
export function getOrganicCapabilities(department: string): OrganicCapability[] {
  const configKey = DEPARTMENT_TO_CONFIG_KEY[department] || department;
  return ORGANIC_CAPABILITY_MAP[configKey] || ORGANIC_CAPABILITY_MAP.BIZOPS;
}

/** Check if entity type is allowed by schema (S3 Filter) */
export function isEntityTypeAllowed(schema: ResolvedSchema, entityType: string): boolean {
  return schema.entity_types.includes(entityType.toLowerCase());
}

/** Get priority fields for entity type (S5 Extract) */
export function getPriorityFields(schema: ResolvedSchema, entityType: string): string[] {
  return schema.priority_fields[entityType.toLowerCase()] || [];
}

/** Validate field value against expected type (S6 Validate) */
export function validateFieldValue(field: string, value: unknown): ValidationError | null {
  // Basic type validation - can be extended
  if (value === null || value === undefined) {
    return null; // Nulls are allowed
  }

  // Date field validation
  if (field.includes("_date") || field.includes("_at")) {
    if (typeof value === "string" && isNaN(Date.parse(value))) {
      return {
        field,
        entity_type: "unknown",
        error: `Invalid date format for ${field}`,
        severity: "warning",
      };
    }
  }

  // Score/rate fields should be numbers 0-100
  if (field.includes("_score") || field.includes("_rate")) {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    if (isNaN(num) || num < 0 || num > 100) {
      return {
        field,
        entity_type: "unknown",
        error: `${field} should be a number between 0-100`,
        severity: "warning",
      };
    }
  }

  return null;
}

/** Generate cache key for schema */
export function generateSchemaCacheKey(
  tenantId: string,
  department: string,
  industry?: string | null
): string {
  return `schema:${tenantId}:${department}:${industry || "default"}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANONICAL ENTITY TYPE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════
// Every entity extraction, creation, and write path MUST validate entity_type
// against this canonical set. See packages/types/src/schema.ts:DOMAIN_SPINE_CONFIG.

/**
 * Cross-domain entity types that are valid but not tied to a single domain.
 * E.g. interaction_event, file, audience, etc.
 */
export const CROSS_DOMAIN_ENTITY_TYPES = [
  "interaction_event",
  "file",
  "audience",
  "platform_health_metric",
  "value_stream",
  "dashboard",
] as const;

/**
 * Standard entity type alias map — connector-level names → canonical Spine names.
 * This is the SINGLE SOURCE for alias resolution across all services.
 * spine-v2 may extend with additional connector-specific aliases.
 */
export const CANONICAL_ENTITY_TYPE_ALIASES: Record<string, string> = {
  // Plurals → singulars
  companies: "account",
  contacts: "contact",
  deals: "opportunity",
  deal: "opportunity",
  opportunities: "opportunity",
  accounts: "account",
  customers: "account",
  issues: "ticket",
  issue: "ticket",
  pull_requests: "pull_request",
  messages: "interaction_event",
  tickets: "ticket",
  invoices: "invoice",
  subscriptions: "contract",
  orders: "invoice",
  channels: "audience",
  pages: "file",
  repositories: "repository",
  sprints: "sprint",
  risks: "risk_register",
  risk: "risk_register",
  renewals: "contract",
  insights: "generated_insight",
  health_metrics: "platform_health_metric",
  leads: "lead",
  tasks: "task",
  notes: "note",
  events: "calendar_event",
  meetings: "activity",
  meeting: "activity",
  calls: "call_log",
  emails: "email_sequence",
  campaigns: "campaign",
  workflows: "workflow",
  projects: "project",
  bugs: "bug",
  features: "feature",
  incidents: "incident",
  deployments: "deployment",
  releases: "release",
  vendors: "vendor",
  expenses: "expense",
  payments: "payment",
  budgets: "budget",
  devices: "device",
  systems: "system",
  certificates: "certificate",
  vulnerabilities: "vulnerability",
  students: "student",
  courses: "course",
  assignments: "assignment",
  grades: "grade",
  success_plans: "success_plan",
  risk_registers: "risk_register",
  strategic_objectives: "strategic_objective",
  capabilities: "capability",
  initiatives: "initiative",
  people_teams: "people_team",
  // Provider-native type names (HubSpot, Salesforce, etc.)
  company: "account",
  // Salesforce native names (PascalCase → snake_case canonical)
  account: "account",
  contact: "contact",
  opportunity: "opportunity",
  lead: "lead",
  case: "ticket",
  // GitHub native names
  push: "activity",
  // Heuristic fallbacks that should be mapped
  entity: "activity",
  unknown: "activity",
  // Legacy CS aliases
  account_masters: "account",
  account_master: "account",
  engagement_logs: "engagement",
  engagement_log: "engagement",
  task_items: "task",
  task_item: "task",
};

/** Computed: ALL canonical entity types across all domains + industry + cross-domain. */
const _allCanonical = new Set<string>();

// Add all DOMAIN_SPINE_CONFIG entity types
for (const config of Object.values(DOMAIN_SPINE_CONFIG)) {
  for (const et of config.entity_types) _allCanonical.add(et);
}
// Add all industry extra entity types
for (const profile of Object.values(INDUSTRY_SPINE_BASE)) {
  if (profile.entity_types_extra) {
    for (const et of profile.entity_types_extra) _allCanonical.add(et);
  }
}
// Add cross-domain entity types
for (const et of CROSS_DOMAIN_ENTITY_TYPES) _allCanonical.add(et);

/**
 * Frozen set of ALL canonical entity types.
 * This is the complete universe of valid entity_type values.
 */
export const ALL_CANONICAL_ENTITY_TYPES: ReadonlySet<string> = _allCanonical;

/**
 * Check if an entity type is a known canonical type.
 */
export function isCanonicalEntityType(entityType: string): boolean {
  return ALL_CANONICAL_ENTITY_TYPES.has(entityType.toLowerCase().replace(/[-\s]/g, "_"));
}

/**
 * Resolve an entity type alias to its canonical form.
 * Returns the lowercase/normalized form if already canonical, or the alias target.
 */
export function resolveEntityTypeAlias(raw: string): string {
  const lower = raw.toLowerCase().replace(/[-\s]/g, "_");
  return CANONICAL_ENTITY_TYPE_ALIASES[lower] || lower;
}

/**
 * Resolve + validate an entity type.
 * Returns { resolved, isCanonical }.
 * - resolved: The alias-resolved entity type name (always lowercase/snake_case)
 * - isCanonical: Whether the resolved type is in the canonical set
 */
export function validateEntityType(raw: string): { resolved: string; isCanonical: boolean } {
  const resolved = resolveEntityTypeAlias(raw);
  return { resolved, isCanonical: ALL_CANONICAL_ENTITY_TYPES.has(resolved) };
}

/**
 * Get the canonical entity types for a specific domain key.
 * Returns from DOMAIN_SPINE_CONFIG directly. Use DEPARTMENT_TO_CONFIG_KEY to resolve aliases.
 */
export function getEntityTypesForDomain(domainKey: string): readonly string[] {
  const config = DOMAIN_SPINE_CONFIG[domainKey];
  return config ? config.entity_types : [];
}

/**
 * Get ALL entity types for a tenant based on their domains + industry.
 * Derives from DOMAIN_SPINE_CONFIG + INDUSTRY_SPINE_BASE + cross-domain.
 * This is the AUTHORITATIVE function for "what entity types can this tenant have?"
 */
export function getTenantCanonicalEntityTypes(
  domains: string[],
  industry?: string | null
): Set<string> {
  const allowed = new Set<string>();
  for (const d of domains) {
    const key = DEPARTMENT_TO_CONFIG_KEY[d] || d;
    const config = DOMAIN_SPINE_CONFIG[key];
    if (config) {
      for (const et of config.entity_types) allowed.add(et);
    }
  }
  // Add cross-domain types if any domain matched
  if (allowed.size > 0) {
    for (const et of CROSS_DOMAIN_ENTITY_TYPES) allowed.add(et);
  }
  // Add industry extras
  if (industry) {
    const profile = INDUSTRY_SPINE_BASE[industry];
    if (profile?.entity_types_extra) {
      for (const et of profile.entity_types_extra) allowed.add(et);
    }
  }
  return allowed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI TRANSFORM HELPERS - BFF Layer
// ═══════════════════════════════════════════════════════════════════════════════

/** Transform technical field name to organic UI label */
export function fieldToOrganicLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    // CS fields
    health_score: "Health Score",
    health_score_trend: "Trend",
    renewal_risk_level: "Risk Level",
    arr: "ARR",
    acv: "ACV",
    csm_narrative: "CSM Notes",
    renewal_date: "Renewal Date",
    days_to_renewal: "Days to Renewal",
    executive_sponsor_customer: "Customer Sponsor",
    executive_sponsor_mulesoft: "Our Sponsor",
    // Generic fields
    status: "Status",
    priority: "Priority",
    due_date: "Due Date",
    created_date: "Created",
    last_activity_date: "Last Activity",
    owner_id: "Owner",
    name: "Name",
    title: "Title",
    description: "Description",
    amount: "Amount",
    stage: "Stage",
    probability: "Probability",
    close_date: "Close Date",
  };

  return (
    labels[fieldName] ||
    fieldName
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

/** Transform entity type to organic section title */
export function entityToOrganicSection(entityType: string): string {
  const sections: Record<string, string> = {
    account: "Accounts",
    contact: "Contacts",
    task: "Tasks",
    opportunity: "Opportunities",
    engagement: "Activity",
    ticket: "Tickets",
    risk_register: "Risks",
    generated_insight: "Insights",
    initiative: "Initiatives",
    strategic_objective: "Objectives",
    capability: "Capabilities",
    value_stream: "Value Streams",
  };

  return (
    sections[entityType] ||
    entityType
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}
