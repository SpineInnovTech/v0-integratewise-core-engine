import { z } from "zod";

/**
 * IntegrateWise V11.11 - Universal Contracts
 * Frozen in code for absolute cross-domain reliability.
 */

// --- Flow A: Structured Truth ---

/**
 * ResourceTypeSchema — Canonical Resource Types Across All 12 Departments
 *
 * This is the IP. MuleSoft-inspired trait detection resolves ANY tool's native
 * object names into one of these canonical types. Object identity by nature, not label.
 * HubSpot Contact = Salesforce Lead = Jira Reporter = same "contact".
 *
 * Grouped by domain for clarity. The system resolves dynamically via
 * CANONICAL_ENTITY_TYPE_ALIASES + trait detection.
 */
export const ResourceTypeSchema = z.enum([
  // ─── Core (cross-domain, every tenant has these) ───────────────────────────
  "account", // Company / Organization / Customer
  "contact", // Person / Lead / Reporter / Assignee
  "task", // Work item / To-do / Action item
  "activity", // Meeting / Call / Event / Interaction
  "note", // Free-text note / Comment
  "file", // Document / Attachment / Upload
  "interaction_event", // Message / Email / Chat event
  "calendar_event", // Scheduled time block

  // ─── Sales & RevOps ────────────────────────────────────────────────────────
  "opportunity", // Deal / Chance / Pipeline item
  "lead", // Unqualified contact / Prospect
  "pipeline_stage", // Sales stage definition
  "forecast", // Revenue forecast period
  "quota", // Sales target
  "territory", // Sales territory / Region
  "comp_plan", // Compensation plan
  "revenue_metric", // Revenue KPI
  "attribution", // Marketing attribution touch
  "segment_rule", // Segmentation logic
  "quote", // Price quote / Proposal
  "call_log", // Recorded call
  "email_sequence", // Outbound sequence
  "competitor_intel", // Competitive intelligence

  // ─── Customer Success ──────────────────────────────────────────────────────
  "success_plan", // CS plan / QBR plan
  "engagement", // Customer engagement record
  "contract", // Agreement / Subscription / Renewal
  "risk_register", // Risk item
  "people_team", // Team / Role assignment
  "business_context", // Customer business profile
  "strategic_objective", // Customer goal
  "capability", // Customer capability assessment
  "value_stream", // Business process / Integration flow
  "api_portfolio", // API / Integration asset
  "platform_health_metric", // Platform KPI
  "initiative", // Project / Program / Initiative
  "stakeholder_outcome", // Outcome per stakeholder
  "generated_insight", // AI-generated insight

  // ─── Marketing ─────────────────────────────────────────────────────────────
  "campaign", // Marketing campaign
  "campaign_block", // Campaign component / Creative
  "audience", // Target segment / List
  "delivery", // Email / Push / SMS delivery
  "landing_page", // Web page / Form
  "social_post", // Social media post
  "ab_test", // A/B test
  "audience_segment", // Audience segment
  "marketing_metric", // Marketing KPI
  "attribution_touchpoint", // Multi-touch attribution point

  // ─── Support ───────────────────────────────────────────────────────────────
  "ticket", // Support ticket / Case / Issue
  "csat", // CSAT score
  "sla_policy", // SLA definition
  "escalation", // Escalation record
  "queue", // Support queue
  "agent_performance", // Agent metrics
  "service_metric", // Support KPI
  "knowledge_article", // KB article

  // ─── Engineering & Product ─────────────────────────────────────────────────
  "feature", // Product feature / Capability
  "bug", // Defect / Issue
  "sprint", // Sprint / Iteration
  "incident", // Production incident
  "release", // Software release
  "repository", // Code repository
  "pull_request", // Code review / PR
  "deployment", // Deploy event
  "feedback", // User feedback
  "roadmap_item", // Roadmap entry
  "usage_metric", // Product usage metric
  "engineering_metric", // Engineering KPI

  // ─── Finance ───────────────────────────────────────────────────────────────
  "invoice", // Bill / Invoice
  "payment", // Payment record
  "expense", // Expense item
  "budget", // Budget allocation
  "revenue_entry", // Revenue line item
  "cash_flow", // Cash flow entry
  "rev_rec_schedule", // Revenue recognition
  "tax_filing", // Tax record
  "financial_report", // Financial statement
  "vendor", // Vendor / Supplier
  "cost_center", // Cost center
  "forecast_entry", // Financial forecast
  "compliance_item", // Compliance record

  // ─── HR ────────────────────────────────────────────────────────────────────
  "employee", // Employee / Team member
  "comp_band", // Compensation band
  "employee_engagement", // Engagement survey
  "attrition_risk", // Retention risk

  // ─── Legal ─────────────────────────────────────────────────────────────────
  "contract", // Already in CS — shared across domains
  "clause", // Contract clause
  "obligation", // Legal obligation

  // ─── IT Admin ──────────────────────────────────────────────────────────────
  "system", // IT system / Application
  "device", // Hardware device
  "change_request", // ITIL change request
  "vulnerability", // Security vulnerability
  "backup", // Backup record
  "certificate", // SSL / Security cert
  "network_device", // Network infrastructure
  "license", // Software license
  "it_metric", // IT KPI

  // ─── BizOps ────────────────────────────────────────────────────────────────
  "workflow", // Business workflow
  "okr", // OKR / Goal
  "cross_dept_initiative", // Cross-functional initiative
  "ops_metric", // Operational KPI

  // ─── Supply Chain ──────────────────────────────────────────────────────────
  "order", // Purchase / Sales order
  "inventory", // Inventory item
  "supplier", // Supplier
  "fulfilment", // Fulfilment record

  // ─── Service Operations ────────────────────────────────────────────────────
  "work_order", // Field service work order
  "asset", // Physical or digital asset
  "field_technician", // Field worker

  // ─── Procurement ───────────────────────────────────────────────────────────
  "purchase_order", // PO
  "spend_category", // Spend classification
  "savings_initiative", // Cost savings program
  "approval_request", // Procurement approval
  "compliance_check", // Procurement compliance
  "procurement_metric", // Procurement KPI

  // ─── Industry: SaaS ────────────────────────────────────────────────────────
  "product_usage", // Product usage record
  "subscription", // SaaS subscription

  // ─── Industry: Professional Services ───────────────────────────────────────
  "project", // PS project
  "resource_allocation", // Resource assignment

  // ─── Industry: Healthcare ──────────────────────────────────────────────────
  "patient", // Patient record
  "claim", // Insurance claim
  "provider", // Healthcare provider

  // ─── Industry: Education ───────────────────────────────────────────────────
  "student", // Student record
  "enrollment", // Course enrollment
  "course", // Course / Class
  "assignment", // Student assignment
  "grade", // Grade record

  // ─── Industry: Manufacturing ───────────────────────────────────────────────
  "bom", // Bill of materials
  "production_order", // Production order

  // ─── Industry: Other ───────────────────────────────────────────────────────
  "vehicle", // Automotive
  "sku", // Retail SKU
  "shipment", // Logistics shipment
  "portfolio", // Financial portfolio
  "content_asset", // Media content
  "citizen", // Public sector
  "grant", // Public sector grant
]);

export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const NormalizedResourceSchema = z.object({
  resourceType: ResourceTypeSchema,
  tenantId: z.string().uuid(),

  external: z.object({
    tool: z.string(),
    rawResourceType: z.string(),
    externalId: z.string(),
    raw: z.record(z.any()).optional(),
  }),

  canonical: z.record(z.any()), // Domain-specific fields (e.g., name, amount, status)

  traits: z.array(
    z.object({
      traitType: z.string(),
      tool: z.string(),
      externalId: z.string(),
      metadata: z.record(z.any()),
    })
  ),

  knowledgePointer: z.object({
    location: z.string().default("knowledge-base"),
    id: z.string(),
  }),
});

export type NormalizedResource = z.infer<typeof NormalizedResourceSchema>;

export const NormalizedEventSchema = z.object({
  tenantId: z.string().uuid(),
  resourceType: ResourceTypeSchema,
  resourceKey: z.object({
    lookupType: z.enum(["externalId", "spineId"]),
    value: z.string(),
  }),
  sourceSystem: z.string(),
  canonicalEventType: z.string(), // e.g., 'created', 'updated', 'status_changed'
  severity: z.enum(["info", "warning", "error", "critical"]).default("info"),
  occurredAt: z.string().datetime(),
  traits: z.array(z.record(z.any())).optional(),
  knowledgePointer: z.object({
    location: z.string().default("knowledge-base"),
    id: z.string(),
  }),
});

export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;

// --- Layer 3: Think - Situations ---

export const DomainSchema = z.enum([
  "sales",
  "marketing",
  "product",
  "support",
  "finance",
  "operations",
  "generic",
]);

export type Domain = z.infer<typeof DomainSchema>;

export const SituationProposalSchema = z.object({
  proposal_id: z.string(),
  action_type: z.string(),
  tool: z.string(),
  description: z.string(),
  payload_summary: z.record(z.any()),
  autonomy_mode: z.enum(["manual", "assisted", "autonomous"]).default("assisted"),
});

export type SituationProposal = z.infer<typeof SituationProposalSchema>;

export const SituationSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  label: z.string(), // e.g., "High-Value Pricing Friction"
  domain: DomainSchema,
  confidence: z.number().min(0).max(1),
  analysis: z.string(),
  evidence: z.object({
    flow_a_pointers: z.array(z.string()), // IDs or keys to Spine entities
    flow_b_pointers: z.array(z.string()), // IDs to Knowledge docs
  }),
  proposals: z.array(SituationProposalSchema),
  created_at: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  resolved_at: z.string().datetime().optional(),
  resolved_by: z.string().optional(), // 'human' | 'policy' | userId
});

export type Situation = z.infer<typeof SituationSchema>;
