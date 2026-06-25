import { AcceleratorManifest } from "../types";

export const SaaSAccountIntelligence: AcceleratorManifest = {
  id: "accel-vertical-saas-001",
  name: "SaaS Account Intelligence",
  version: "1.0.0",
  type: "vertical",
  vertical: "saas",
  description:
    "Comprehensive data dictionary, signals, and extraction rules for B2B SaaS Account Management.",
  tools_supported: [
    "salesforce",
    "hubspot",
    "zendesk",
    "stripe",
    "slack",
    "notion",
    "gmail",
    "telemetry",
  ],

  entity_models: [
    {
      name: "account_master",
      description: "Central account record aggregating CRM, Billing, and Usage fields.",
      fields: [
        { name: "name", type: "string", required: true },
        { name: "tier", type: "string" },
        { name: "status", type: "string" }, // active/churned
        { name: "arr_current", type: "number" },
        { name: "renewal_date", type: "date" },
        { name: "csm_owner_id", type: "string" },
      ],
    },
    {
      name: "strategic_objectives",
      description: "Key goals derived from success plans and QBRs.",
      fields: [
        { name: "objective", type: "string" },
        { name: "status", type: "string" },
        { name: "due_date", type: "date" },
      ],
    },
    {
      name: "platform_health_metrics",
      description: "Aggregated usage and health stats.",
      fields: [
        { name: "login_frequency", type: "number" },
        { name: "feature_adoption_score", type: "number" },
        { name: "license_utilization_pct", type: "number" },
      ],
    },
    {
      name: "technical_debt_risk_register",
      description: "Identified technical risks or blockers.",
      fields: [
        { name: "risk_description", type: "string" },
        { name: "severity", type: "string" },
        { name: "impact", type: "string" },
      ],
    },
    {
      name: "stakeholder_outcomes",
      description: "Desired outcomes mapped to key people.",
      fields: [
        { name: "stakeholder_id", type: "string", ref: "people_team" },
        { name: "outcome", type: "string" },
      ],
    },
  ],

  context_models: [
    { name: "msa_contract", chunking_policy: "whole", extractors: ["ocr", "legal_terms"] },
    { name: "sow_document", chunking_policy: "whole", extractors: ["ocr", "scope"] },
    { name: "qbr_deck", chunking_policy: "slide", extractors: ["ocr", "chart_analysis"] },
    {
      name: "meeting_transcript",
      chunking_policy: "paragraph",
      extractors: ["conversation_analysis"],
    },
    { name: "slack_thread", chunking_policy: "whole", extractors: ["key_decisions"] },
    { name: "architecture_diagram", chunking_policy: "whole", extractors: ["visual_analysis"] },
  ],

  signals: [
    {
      id: "sig_ren_risk",
      name: "renewal_risk_level",
      description: "Calculated risk of churn based on health score and interaction frequency.",
      logic: "IF health_score < 40 AND last_touch > 30d THEN High",
      source: "computed",
      trigger: "schedule",
    },
    {
      id: "sig_health_trend",
      name: "health_score_trend_30d",
      description: "Trend line of health score over 30 days.",
      logic: "Linear regression of health_score",
      source: "computed",
      trigger: "schedule",
    },
    {
      id: "sig_util_drop",
      name: "license_utilization_drop",
      description: "Significant drop in seat usage.",
      logic: "IF drop > 20% week_over_week",
      source: "computed",
      trigger: "event",
    },
    {
      id: "sig_sla_breach",
      name: "sla_compliance_breach",
      description: "Open critical ticket past SLA.",
      logic: "IF ticket.priority=Urgent AND time > 4h",
      source: "derived",
      trigger: "event",
    },
  ],

  mappings: {
    salesforce: {
      Account: "account_master",
      Opportunity: "initiatives",
    },
    zendesk: {
      Ticket: "engagement_log", // or specialized ticket entity
    },
  },
};
