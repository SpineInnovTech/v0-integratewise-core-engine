// Legacy Supabase client removed per Decision 22.
// Per mapping: PostgreSQL → D1; use the D1 paths in main pipeline (writeToEntityCache) for new work.
import {
  validateEntityType,
  CANONICAL_ENTITY_TYPE_ALIASES,
  ALL_CANONICAL_ENTITY_TYPES,
} from "@integratewise/types";
import { assembleEntity360, assembleEntity360Batch } from "./entity360-assembler.js";
import { vaultWrite } from "./vault";
import type { Entity360Request, Entity360BatchRequest } from "@integratewise/types";

export interface Env {
  // Legacy Supabase (PostgreSQL) — being replaced per the mapping:
  //   PostgreSQL database → Cloudflare D1
  //   Metadata/config     → D1 (tenant_spine_config + ${domain}_data)
  // The active spine writes now go to D1 partitions (decide_data | build_data | grow_data | run_data | cross_data)
  // via writeToEntityCache + getDomainForType in the main pipeline.
  // This spine-v2 module is the legacy writer (Supabase tables under "spine"/"sales"/"cs" schemas).
  // SUPABASE is optional during cutover; callers should prefer the D1 path.
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  CACHE: KVNamespace;
  CACHE_DB: D1Database;
  SPINE_STORAGE: R2Bucket;
  SPINE_ENCRYPTION_KEY: string;
  SYNC_SECRET?: string;
  TRIAGE_BOT_API_KEY?: string; // Triage Bot is the sole writer to memory
  /** Spine → Memory promotion queue (spine-hydration-lifecycle Phase 5). Optional. */
  MEMORY_PROMOTE?: Queue;
}

// ── Entity Type → Schema.Table Router ────────────────────────────────────────
// Maps every entity_type string to its adaptive spine schema and table.
// This is the single missing link that connects the pipeline to the real schema.

export interface SpineTarget {
  schema: string;
  table: string;
  pk: string; // primary key column name
}

export const ENTITY_TYPE_TO_TABLE: Record<string, SpineTarget> = {
  // ── Core Spine entities ──
  account: { schema: "spine", table: "account", pk: "account_id" },
  contact: { schema: "spine", table: "contact", pk: "contact_id" },
  goal: { schema: "spine", table: "goal", pk: "goal_id" },
  metric: { schema: "spine", table: "metric", pk: "metric_id" },
  signal: { schema: "spine", table: "signal", pk: "signal_id" },
  context_extraction: { schema: "spine", table: "context_extraction", pk: "extraction_id" },
  file: { schema: "spine", table: "file", pk: "file_id" },
  evidence_ref: { schema: "spine", table: "evidence_ref", pk: "evidence_id" },
  action: { schema: "spine", table: "action", pk: "action_id" },

  // ── Sales ──
  deal: { schema: "sales", table: "deal", pk: "deal_id" },
  opportunity: { schema: "sales", table: "opportunity", pk: "opportunity_id" },

  // ── Marketing ──
  campaign: { schema: "marketing", table: "campaign", pk: "campaign_id" },
  campaign_block: { schema: "marketing", table: "campaign_block", pk: "block_id" },
  audience: { schema: "marketing", table: "audience", pk: "audience_id" },
  interaction_event: { schema: "marketing", table: "interaction_event", pk: "event_id" },
  delivery: { schema: "marketing", table: "delivery", pk: "delivery_id" },

  // ── RevOps ──
  quota: { schema: "revops", table: "quota", pk: "quota_id" },
  forecast: { schema: "revops", table: "forecast", pk: "forecast_id" },
  kpi: { schema: "revops", table: "kpi", pk: "kpi_id" },

  // ── Customer Success ──
  account_health: { schema: "cs", table: "account_health", pk: "health_id" },
  account_master: { schema: "cs", table: "account_master", pk: "account_id" },
  renewal: { schema: "cs", table: "renewal", pk: "renewal_id" },
  renewal_tracker: { schema: "cs", table: "renewal", pk: "renewal_id" },
  outcome: { schema: "cs", table: "outcome", pk: "outcome_id" },
  stakeholder_outcome: { schema: "cs", table: "stakeholder_outcome", pk: "outcome_id" },
  risk_register: { schema: "cs", table: "risk_register", pk: "risk_id" },
  risk: { schema: "cs", table: "risk_register", pk: "risk_id" },
  value_stream: { schema: "cs", table: "value_stream", pk: "stream_id" },
  platform_health_metric: { schema: "cs", table: "platform_health_metric", pk: "metric_id" },
  generated_insight: { schema: "cs", table: "generated_insight", pk: "insight_id" },
  initiative: { schema: "cs", table: "initiative", pk: "initiative_id" },
  task: { schema: "cs", table: "task", pk: "task_id" },
  task_item: { schema: "cs", table: "task", pk: "task_id" },
  engagement: { schema: "cs", table: "engagement", pk: "engagement_id" },
  engagement_log: { schema: "cs", table: "engagement_log", pk: "engagement_id" },
  success_plan: { schema: "cs", table: "success_plan", pk: "plan_id" },
  business_context: { schema: "cs", table: "business_context", pk: "context_id" },
  strategic_objective: { schema: "cs", table: "strategic_objective", pk: "objective_id" },
  capability: { schema: "cs", table: "capability", pk: "capability_id" },
  api_portfolio: { schema: "cs", table: "api_portfolio", pk: "api_id" },
  people_team: { schema: "cs", table: "people_team", pk: "person_id" },

  // ── Support ──
  ticket: { schema: "support", table: "ticket", pk: "ticket_id" },
  csat: { schema: "support", table: "csat", pk: "csat_id" },

  // ── Engineering ──
  sprint: { schema: "eng", table: "sprint", pk: "sprint_id" },
  incident: { schema: "eng", table: "incident", pk: "incident_id" },
  deploy: { schema: "eng", table: "deploy", pk: "deploy_id" },

  // ── Product ──
  feature: { schema: "product", table: "feature", pk: "feature_id" },
  usage_metric: { schema: "product", table: "usage_metric", pk: "usage_metric_id" },

  // ── Finance ──
  invoice: { schema: "finance", table: "invoice", pk: "invoice_id" },
  payment: { schema: "finance", table: "payment", pk: "payment_id" },
  rev_rec_schedule: { schema: "finance", table: "rev_rec_schedule", pk: "schedule_id" },
  cash_flow: { schema: "finance", table: "cash_flow", pk: "entry_id" },

  // ── Legal ──
  contract: { schema: "legal", table: "contract", pk: "contract_id" },
  clause: { schema: "legal", table: "clause", pk: "clause_id" },
  obligation: { schema: "legal", table: "obligation", pk: "obligation_id" },

  // ── HR ──
  employee: { schema: "hr", table: "employee", pk: "employee_id" },
  comp_band: { schema: "hr", table: "comp_band", pk: "band_id" },
  employee_engagement: { schema: "hr", table: "engagement", pk: "survey_id" },
  attrition_risk: { schema: "hr", table: "attrition_risk", pk: "risk_id" },

  // ── Supply Chain ──
  order: { schema: "sc", table: "order", pk: "order_id" },
  inventory: { schema: "sc", table: "inventory", pk: "inventory_id" },
  supplier: { schema: "sc", table: "supplier", pk: "supplier_id" },
  fulfilment: { schema: "sc", table: "fulfilment", pk: "fulfilment_id" },

  // ── Service Operations ──
  work_order: { schema: "svc", table: "work_order", pk: "work_order_id" },
  asset: { schema: "svc", table: "asset", pk: "asset_id" },
  field_technician: { schema: "svc", table: "field_technician", pk: "tech_id" },

  // ── BizOps ──
  activity: { schema: "bizops", table: "activity", pk: "activity_id" },
  workflow: { schema: "bizops", table: "workflow", pk: "workflow_id" },
  okr: { schema: "bizops", table: "okr", pk: "okr_id" },
  cross_dept_initiative: { schema: "bizops", table: "cross_dept_initiative", pk: "initiative_id" },
  ops_metric: { schema: "bizops", table: "ops_metric", pk: "metric_id" },

  // ── Sales (extended) ──
  lead: { schema: "sales", table: "lead", pk: "lead_id" },
  pipeline_stage: { schema: "sales", table: "pipeline_stage", pk: "stage_id" },
  quote: { schema: "sales", table: "quote", pk: "quote_id" },
  sales_sequence: { schema: "sales", table: "sales_sequence", pk: "sequence_id" },
  call_log: { schema: "sales", table: "call_log", pk: "call_id" },
  email_sequence: { schema: "sales", table: "email_sequence", pk: "sequence_id" },
  competitor_intel: { schema: "sales", table: "competitor_intel", pk: "intel_id" },

  // ── RevOps (extended) ──
  territory: { schema: "revops", table: "territory", pk: "territory_id" },
  comp_plan: { schema: "revops", table: "comp_plan", pk: "plan_id" },
  revenue_metric: { schema: "revops", table: "revenue_metric", pk: "metric_id" },
  attribution: { schema: "revops", table: "attribution", pk: "attribution_id" },
  segment_rule: { schema: "revops", table: "segment_rule", pk: "rule_id" },

  // ── Marketing (extended) ──
  landing_page: { schema: "marketing", table: "landing_page", pk: "page_id" },
  email_campaign: { schema: "marketing", table: "email_campaign", pk: "campaign_id" },
  social_post: { schema: "marketing", table: "social_post", pk: "post_id" },
  content_asset_marketing: { schema: "marketing", table: "content_asset", pk: "asset_id" },
  attribution_touchpoint: {
    schema: "marketing",
    table: "attribution_touchpoint",
    pk: "touchpoint_id",
  },
  ab_test: { schema: "marketing", table: "ab_test", pk: "test_id" },
  audience_segment: { schema: "marketing", table: "audience_segment", pk: "segment_id" },
  marketing_metric: { schema: "marketing", table: "marketing_metric", pk: "metric_id" },

  // ── Support (extended) ──
  sla_policy: { schema: "support", table: "sla_policy", pk: "policy_id" },
  csat_survey: { schema: "support", table: "csat_survey", pk: "survey_id" },
  escalation: { schema: "support", table: "escalation", pk: "escalation_id" },
  queue: { schema: "support", table: "queue", pk: "queue_id" },
  agent_performance: { schema: "support", table: "agent_performance", pk: "performance_id" },
  service_metric: { schema: "support", table: "service_metric", pk: "metric_id" },
  knowledge_article: { schema: "support", table: "knowledge_article", pk: "article_id" },

  // ── Finance (extended) ──
  expense: { schema: "finance", table: "expense", pk: "expense_id" },
  budget: { schema: "finance", table: "budget", pk: "budget_id" },
  revenue_entry: { schema: "finance", table: "revenue_entry", pk: "entry_id" },
  tax_filing: { schema: "finance", table: "tax_filing", pk: "filing_id" },
  financial_report: { schema: "finance", table: "financial_report", pk: "report_id" },
  vendor: { schema: "finance", table: "vendor", pk: "vendor_id" },
  cost_center: { schema: "finance", table: "cost_center", pk: "center_id" },
  forecast_entry: { schema: "finance", table: "forecast_entry", pk: "entry_id" },
  compliance_item: { schema: "finance", table: "compliance_item", pk: "item_id" },

  // ── IT Admin ──
  system: { schema: "it", table: "system", pk: "system_id" },
  device: { schema: "it", table: "device", pk: "device_id" },
  user: { schema: "it", table: "user", pk: "user_id" },
  change_request: { schema: "it", table: "change_request", pk: "request_id" },
  vulnerability: { schema: "it", table: "vulnerability", pk: "vuln_id" },
  backup: { schema: "it", table: "backup", pk: "backup_id" },
  certificate: { schema: "it", table: "certificate", pk: "cert_id" },
  network_device: { schema: "it", table: "network_device", pk: "device_id" },
  license: { schema: "it", table: "license", pk: "license_id" },
  it_metric: { schema: "it", table: "it_metric", pk: "metric_id" },

  // ── Procurement (extended) ──
  purchase_order: { schema: "procurement", table: "purchase_order", pk: "po_id" },
  spend_category: { schema: "procurement", table: "spend_category", pk: "category_id" },
  savings_initiative: { schema: "procurement", table: "savings_initiative", pk: "initiative_id" },
  approval_request: { schema: "procurement", table: "approval_request", pk: "request_id" },
  compliance_check: { schema: "procurement", table: "compliance_check", pk: "check_id" },
  procurement_metric: { schema: "procurement", table: "procurement_metric", pk: "metric_id" },

  // ── Education (extended) ──
  course: { schema: "industry_edu", table: "course", pk: "course_id" },
  assignment: { schema: "industry_edu", table: "assignment", pk: "assignment_id" },
  grade: { schema: "industry_edu", table: "grade", pk: "grade_id" },
  attendance: { schema: "industry_edu", table: "attendance", pk: "attendance_id" },
  discussion: { schema: "industry_edu", table: "discussion", pk: "discussion_id" },
  learning_objective: { schema: "industry_edu", table: "learning_objective", pk: "objective_id" },
  intervention: { schema: "industry_edu", table: "intervention", pk: "intervention_id" },
  student_metric: { schema: "industry_edu", table: "student_metric", pk: "metric_id" },

  // ── Product Engineering (extended) ──
  bug: { schema: "eng", table: "bug", pk: "bug_id" },
  release: { schema: "eng", table: "release", pk: "release_id" },
  repository: { schema: "eng", table: "repository", pk: "repo_id" },
  pull_request: { schema: "eng", table: "pull_request", pk: "pr_id" },
  deployment: { schema: "eng", table: "deployment", pk: "deploy_id" },
  feedback: { schema: "product", table: "feedback", pk: "feedback_id" },
  roadmap_item: { schema: "product", table: "roadmap_item", pk: "item_id" },
  engineering_metric: { schema: "eng", table: "engineering_metric", pk: "metric_id" },
  note: { schema: "spine", table: "note", pk: "note_id" },

  // ── Personal ──
  calendar_event: { schema: "spine", table: "calendar_event", pk: "event_id" },
  bookmark: { schema: "spine", table: "bookmark", pk: "bookmark_id" },
  daily_reflection: { schema: "spine", table: "daily_reflection", pk: "reflection_id" },

  // ── Memory ──
  org_memory: { schema: "memory", table: "org_memory", pk: "id" },
  agent: { schema: "public", table: "agent_registry", pk: "id" },

  // ── Industry: SaaS ──
  product_usage: { schema: "industry_saas", table: "product_usage", pk: "usage_id" },
  subscription: { schema: "industry_saas", table: "subscription", pk: "subscription_id" },

  // ── Industry: Professional Services ──
  project: { schema: "industry_ps", table: "project", pk: "project_id" },
  resource_allocation: { schema: "industry_ps", table: "resource_allocation", pk: "allocation_id" },

  // ── Industry: Healthcare ──
  patient: { schema: "industry_hc", table: "patient", pk: "patient_id" },
  claim: { schema: "industry_hc", table: "claim", pk: "claim_id" },
  provider: { schema: "industry_hc", table: "provider", pk: "provider_id" },

  // ── Industry: Education ──
  student: { schema: "industry_edu", table: "student", pk: "student_id" },
  enrollment: { schema: "industry_edu", table: "enrollment", pk: "enrollment_id" },

  // ── Industry: Manufacturing ──
  bom: { schema: "industry_mfg", table: "bom", pk: "bom_id" },
  production_order: { schema: "industry_mfg", table: "production_order", pk: "po_id" },

  // ── Industry: Automotive ──
  vehicle: { schema: "industry_auto", table: "vehicle", pk: "vehicle_id" },
  service_record: { schema: "industry_auto", table: "service_record", pk: "record_id" },

  // ── Industry: Retail ──
  sku: { schema: "industry_retail", table: "sku", pk: "sku_id" },
  pos_transaction: { schema: "industry_retail", table: "pos_transaction", pk: "txn_id" },

  // ── Industry: Financial Services ──
  portfolio: { schema: "industry_financial", table: "portfolio", pk: "portfolio_id" },
  kyc_record: { schema: "industry_financial", table: "kyc_record", pk: "kyc_id" },

  // ── Industry: Logistics ──
  shipment: { schema: "industry_logistics", table: "shipment", pk: "shipment_id" },
  route: { schema: "industry_logistics", table: "route", pk: "route_id" },

  // ── Industry: Media ──
  content_asset: { schema: "industry_media", table: "content_asset", pk: "asset_id" },
  media_metric: { schema: "industry_media", table: "metric", pk: "metric_id" },

  // ── Industry: Public Sector ──
  citizen: { schema: "industry_public", table: "citizen", pk: "citizen_id" },
  grant: { schema: "industry_public", table: "grant", pk: "grant_id" },
  public_project: { schema: "industry_public", table: "project", pk: "project_id" },
};

// Connector entity type aliases (e.g. HubSpot "companies" -> spine "account")
// Extends CANONICAL_ENTITY_TYPE_ALIASES from schema.ts with spine-routing-specific extras.
export const ENTITY_TYPE_ALIASES: Record<string, string> = {
  // Start with canonical aliases (single source of truth)
  ...CANONICAL_ENTITY_TYPE_ALIASES,
  // Spine-routing-specific overrides and extras (connector-level names)
  deals: "opportunity",
  subscriptions: "subscription",
  orders: "order",
  renewals: "renewal",
  tableau_views: "platform_health_metric",
  tableau_workbooks: "value_stream",
  task_items: "task",
  emails: "email_sequence",
  // CSM-specific aliases (routing to spine tables)
  account_masters: "account",
  account_master: "account",
  engagement_logs: "engagement",
  engagement_log: "engagement",
  success_plans: "success_plan",
  risk_registers: "risk_register",
  strategic_objectives: "strategic_objective",
  capabilities: "capability",
  initiatives: "initiative",
  people_teams: "people_team",
};

/**
 * Resolve an entity type string to its canonical form.
 * Uses spine-local ENTITY_TYPE_ALIASES (which extends CANONICAL_ENTITY_TYPE_ALIASES).
 * Logs a warning if the resolved type is not in ALL_CANONICAL_ENTITY_TYPES.
 */
export function resolveEntityType(raw: string): string {
  const lower = raw.toLowerCase().replace(/[-\s]/g, "_");
  const resolved = ENTITY_TYPE_ALIASES[lower] || lower;
  if (!ALL_CANONICAL_ENTITY_TYPES.has(resolved) && !ENTITY_TYPE_TO_TABLE[resolved]) {
    console.warn(
      `[spine-v2] Non-canonical entity_type "${raw}" → "${resolved}". Will fall back to public.entities.`
    );
  }
  return resolved;
}

export function getSpineTarget(entityType: string): SpineTarget | null {
  const resolved = resolveEntityType(entityType);
  return ENTITY_TYPE_TO_TABLE[resolved] || null;
}

// ── D1 Schema Observation Helpers ──────────────────────────────────────────

async function recordSpineFieldObservationD1(
  db: D1Database,
  tenantId: string,
  entityType: string,
  sourceSystem: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!tenantId || !entityType || !data) return;
  const fields = Object.entries(data).filter(
    ([key, value]) => !key.startsWith("_") && value !== undefined
  );
  if (fields.length === 0) return;

  const statements = fields.map(([fieldKey, value]) => {
    const dataType = inferDataType(value);
    const isNull = value === null || value === undefined ? 1 : 0;
    const sampleValue = value == null ? null : String(value).slice(0, 200);

    return db
      .prepare(
        `
      INSERT INTO spine_schema_registry (
        tenant_id, entity_type, field_key, field_path, data_type, occurrence_count, null_count, sample_value, source_system, last_seen_at
      ) VALUES (
        ?, ?, ?, ?, ?, 1, ?, ?, ?, datetime('now')
      )
      ON CONFLICT (tenant_id, entity_type, field_key) DO UPDATE SET
        occurrence_count = occurrence_count + 1,
        null_count = null_count + excluded.null_count,
        sample_value = COALESCE(excluded.sample_value, sample_value),
        data_type = COALESCE(excluded.data_type, data_type),
        source_system = COALESCE(excluded.source_system, source_system),
        last_seen_at = datetime('now')
    `
      )
      .bind(tenantId, entityType, fieldKey, fieldKey, dataType, isNull, sampleValue, sourceSystem);
  });

  await db.batch(statements).catch((err) => {
    console.error("[spine-v2] D1 schema registry observation batch failed:", err);
  });
}

function inferDataType(value: unknown): string {
  if (value === null || value === undefined) return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value) || typeof value === "object") return "json";
  return "string";
}

// ── Spine-Routed Write ───────────────────────────────────────────────────────
// Writes to the correct schema.table based on entity_type.
// Falls back to public.entities for unmapped types.

export function getDomainForType(type: string): "decide" | "build" | "grow" | "run" | "cross" {
  const t = type.toLowerCase();
  if (
    ["okr", "strategic_objective", "business_context", "kpi", "decision", "commitment"].includes(t)
  ) {
    return "decide";
  }
  if (
    [
      "task",
      "workflow",
      "document",
      "blocker",
      "calendar_event",
      // Engineering work & artifacts (GitHub/Jira/Linear → build domain) so the
      // Engineering projection co-locates instead of scattering into cross_data.
      "repository",
      "pull_request",
      "deployment",
      "sprint",
      "release",
      "feature",
      "bug",
      "incident",
      "roadmap_item",
    ].includes(t)
  ) {
    return "build";
  }
  if (["account", "contact", "opportunity", "ticket", "renewal", "risk"].includes(t)) {
    return "grow";
  }
  if (["ops_metric", "ops_metrics"].includes(t)) {
    return "run";
  }
  return "cross";
}

interface InboundEntity {
  entity_type: string;
  name: string;
  source: string;
  source_id: string;
  data: Record<string, any>;
}

async function writeToSpine(
  env: Env,
  tenantId: string,
  entity: InboundEntity
): Promise<{ target: string; id: string | null; fallback: boolean }> {
  const resolved = resolveEntityType(entity.entity_type);
  const target = getSpineTarget(resolved);
  const now = new Date().toISOString();

  if (!target) {
    throw new Error(
      `[spine] Unmapped entity type: "${entity.entity_type}" (resolved: "${resolved}"). Enforcing strict schema-based write.`
    );
  }

  // Check if tenant is free/personal plan
  let isFreeOrPersonal = false;
  if (env.CACHE_DB) {
    try {
      const tenant = await env.CACHE_DB.prepare("SELECT plan FROM tenants WHERE id = ?")
        .bind(tenantId)
        .first<{ plan: string }>();
      if (tenant?.plan === "free" || tenant?.plan === "personal") {
        isFreeOrPersonal = true;
      }
    } catch (err) {
      console.warn(`[spine] Failed to query tenant plan from D1:`, err);
    }
  }

  const resolvedId = entity.source_id || entity.data?.id || crypto.randomUUID();

  if (isFreeOrPersonal) {
    // Write to encrypted vault — spine_vault is the ONLY Spine store for D1-first users.
    // No plaintext entity data in D1. Ever.
    //
    // FAIL LOUD: the vault is the sole store for these tenants. If the
    // encryption key or DB is missing we must NOT silently return success —
    // that would drop the entity while reporting it as written (data loss).
    if (!env.CACHE_DB || !(env as any).SPINE_ENCRYPTION_KEY) {
      throw new Error(
        "[spine] vault write impossible for free/personal tenant: " +
          `${!env.CACHE_DB ? "CACHE_DB" : "SPINE_ENCRYPTION_KEY"} binding missing. ` +
          "Refusing to silently drop entity. Configure the Cloudflare Secrets Store key."
      );
    }
    {
      const spineEntity = {
        id: resolvedId,
        tenant_id: tenantId,
        entity_type: resolved,
        name: entity.name,
        source: entity.source,
        source_id: entity.source_id,
        health_score: entity.data?.health_score as number | undefined,
        health_trend: entity.data?.health_trend as string | undefined,
        arr: entity.data?.arr as number | undefined,
        tier: entity.data?.tier as string | undefined,
        status: (entity.data?.status as string) || "active",
        data: entity.data || {},
        metadata: { source_target: `${target.schema}.${target.table}` },
        created_at: now,
        updated_at: now,
      };

      await vaultWrite(env.CACHE_DB, (env as any).SPINE_ENCRYPTION_KEY, spineEntity);
    }

    return {
      target: `${target.schema}.${target.table}`,
      id: resolvedId,
      fallback: false,
    };
  }

  // Under Cloudflare-first architecture, paid plans also write directly to D1 domain tables.
  if (env.CACHE_DB) {
    const domain = getDomainForType(resolved);
    const tableName = `${domain}_data`;
    const typedFields = extractTypedFields(domain, entity.data || {});

    const baseCols = [
      "id",
      "tenant_id",
      "type",
      "name",
      "status",
      "data",
      "source_tool",
      "source_id",
      "created_at",
      "updated_at",
    ];
    const baseVals = [
      resolvedId,
      tenantId,
      resolved,
      entity.name || resolved,
      entity.data?.status || null,
      JSON.stringify(entity.data || {}),
      entity.source || "unknown",
      entity.source_id || resolvedId,
      now,
      now,
    ];

    const typedKeys = Object.keys(typedFields);
    const typedVals = Object.values(typedFields);

    const allCols = [...baseCols, ...typedKeys];
    const allVals = [...baseVals, ...typedVals];

    const placeholders = allCols.map((_, i) => `?${i + 1}`).join(", ");

    const updateClauses = [
      "data = excluded.data",
      "updated_at = excluded.updated_at",
      "tenant_id = excluded.tenant_id",
    ];
    if (entity.name) updateClauses.push("name = excluded.name");
    if (entity.data?.status !== undefined) updateClauses.push("status = excluded.status");
    for (const k of typedKeys) {
      updateClauses.push(`${k} = excluded.${k}`);
    }

    const query = `
      INSERT INTO ${tableName} (${allCols.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateClauses.join(", ")}
    `;

    await env.CACHE_DB.prepare(query)
      .bind(...allVals)
      .run();

    // Spine grows → emit a spine.written event for Memory Promotion (Phase 5).
    // Best-effort, non-blocking: a promotion-queue hiccup never fails the Spine write.
    if (env.MEMORY_PROMOTE) {
      try {
        await env.MEMORY_PROMOTE.send({
          event: "spine.written",
          tenant_id: tenantId,
          entity_id: resolvedId,
          entity_type: resolved,
          domain,
          name: entity.name || resolved,
          source: entity.source || "unknown",
          data: entity.data || {},
          written_at: now,
        });
      } catch (err) {
        console.warn(
          "[spine] memory-promote emit skipped (non-fatal):",
          err instanceof Error ? err.message : err
        );
      }
    }

    return {
      target: `D1.${tableName}`,
      id: resolvedId,
      fallback: false,
    };
  }

  throw new Error("[spine] D1 database is not configured.");
}

/**
 * Extract SQLite-native queryable columns from a generic record data blob based on domain rules.
 */
export function extractTypedFields(domain: string, data: Record<string, any>): Record<string, any> {
  const res: Record<string, any> = {};
  const getStr = (k: string) =>
    data[k] !== undefined && data[k] !== null ? String(data[k]) : null;
  const getNum = (k: string) => {
    if (data[k] === undefined || data[k] === null) return null;
    const val = Number(data[k]);
    return isNaN(val) ? null : val;
  };
  const getBoolInt = (k: string) => {
    if (data[k] === undefined || data[k] === null) return null;
    if (typeof data[k] === "boolean") return data[k] ? 1 : 0;
    if (data[k] === "true" || data[k] === 1 || data[k] === "1") return 1;
    if (data[k] === "false" || data[k] === 0 || data[k] === "0") return 0;
    return null;
  };

  if (domain === "decide") {
    res.owner = getStr("owner");
    res.due_date = getStr("due_date");
    res.progress = getNum("progress");
    res.category = getStr("category");
    res.investment = getNum("investment");
    res.revenue = getNum("revenue");
    res.roi_pct = getNum("roi_pct");
    res.effort = getStr("effort");
    res.decided_by = getStr("decided_by");
    res.decided_at = getStr("decided_at");
    res.committed_to = getStr("committed_to");
    res.fulfilled = getBoolInt("fulfilled") ?? 0;
  } else if (domain === "build") {
    res.priority = getStr("priority");
    res.assignee = getStr("assignee");
    res.due_date = getStr("due_date");
    res.overdue = getBoolInt("overdue") ?? 0;
    res.source = getStr("source");
    res.doc_type = getStr("doc_type");
    res.success_rate = getNum("success_rate");
    res.trigger_type = getStr("trigger_type");
    res.event_type = getStr("event_type");
    res.event_date = getStr("event_date");
    res.event_time = getStr("event_time");
    res.blocked_by = getStr("blocked_by");
    res.age_days = getNum("age_days");
    res.escalated = getBoolInt("escalated") ?? 0;
  } else if (domain === "grow") {
    res.health = getStr("health");
    res.health_score = getNum("health_score");
    res.arr = getNum("arr");
    res.mrr = getNum("mrr");
    res.arr_growth_pct = getNum("arr_growth_pct");
    res.industry = getStr("industry");
    res.region = getStr("region");
    res.tier = getStr("tier");
    res.csm = getStr("csm");
    res.owner = getStr("owner");
    res.stage = getStr("stage");
    res.value = getNum("value");
    res.probability = getNum("probability");
    res.close_date = getStr("close_date");
    res.renewal_date = getStr("renewal_date");
    res.renewal_days_remaining = getNum("renewal_days_remaining");
    res.churn_risk = getStr("churn_risk");
    res.churn_probability = getNum("churn_probability");
    res.severity = getStr("severity");
    res.priority = getStr("priority");
    res.score = getNum("score");
    res.nps = getNum("nps");
    res.last_activity = getStr("last_activity");
    res.last_qbr = getStr("last_qbr");
    res.champion_active = getBoolInt("champion_active") ?? 1;
    res.open_tickets = getNum("open_tickets") ?? 0;
    res.p1_tickets = getNum("p1_tickets") ?? 0;
  } else if (domain === "run") {
    res.metric_value = getStr("metric_value");
    res.unit = getStr("unit");
    res.change_pct = getNum("change_pct");
    res.direction = getStr("direction");
    res.metric_source = getStr("metric_source");
    res.period = getStr("period");
    res.priority = getStr("priority");
    res.insight_module = getStr("insight_module");
    res.recommendation = getStr("recommendation");
  } else if (domain === "cross") {
    res.priority = getStr("priority");
    res.source_surface = getStr("source_surface");
    res.routed_to =
      typeof data.routed_to === "object" ? JSON.stringify(data.routed_to) : getStr("routed_to");
    res.severity = getStr("severity");
    res.domain = getStr("domain");
    res.primary_surface = getStr("primary_surface");
    res.confidence = getNum("confidence");
    res.category = getStr("category");
  }
  return res;
}

export function getMatchingTypesForQuery(type: string): string[] {
  const canonical = resolveEntityType(type);
  const matching = [canonical];
  for (const [alias, target] of Object.entries(ENTITY_TYPE_ALIASES)) {
    if (target === canonical) {
      matching.push(alias);
    }
  }
  return Array.from(new Set(matching.map((t) => t.toLowerCase())));
}

// ── Worker Entry Point ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const tenantId = request.headers.get("x-tenant-id") || "";
    const json = (h: Record<string, any>, status = 200) =>
      new Response(JSON.stringify(h), { status, headers: { "Content-Type": "application/json" } });

    // Health check
    if (url.pathname === "/health") {
      return json({
        status: "ok",
        service: "spine-v2",
        router: "active",
        mapped_types: Object.keys(ENTITY_TYPE_TO_TABLE).length,
      });
    }

    // ── NEW: Spine-routed write by entity type ──
    // Called by normalizer sectorize: POST /v1/spine/{entity_type}
    if (url.pathname.startsWith("/v1/spine/") && request.method === "POST") {
      const entityType = url.pathname.replace("/v1/spine/", "");

      // Schema-dependent validation at the API boundary
      const { resolved: resolvedUrlType, isCanonical: urlTypeCanonical } =
        validateEntityType(entityType);
      if (!urlTypeCanonical) {
        console.warn(
          `[spine-v2] POST /v1/spine/${entityType}: URL entity_type "${entityType}" → "${resolvedUrlType}" is not canonical.`
        );
      }

      const body = (await request.json()) as {
        tenant_id: string;
        entities: InboundEntity[];
        trace_id?: string;
      };

      const tid = body.tenant_id || tenantId;

      // Check if tenant is free/personal plan
      let isFreeOrPersonal = false;
      if (env.CACHE_DB) {
        try {
          const tenant = await env.CACHE_DB.prepare("SELECT plan FROM tenants WHERE id = ?")
            .bind(tid)
            .first<{ plan: string }>();
          if (tenant?.plan === "free" || tenant?.plan === "personal") {
            isFreeOrPersonal = true;
          }
        } catch (err) {
          console.warn(`[spine] Failed to query tenant plan from D1:`, err);
        }
      }

      const writePromises = body.entities.map(async (entity) => {
        const e = { ...entity, entity_type: entity.entity_type || entityType };
        const result = await writeToSpine(env, tid, e);

        if (e.data && typeof e.data === "object" && !isFreeOrPersonal && env.CACHE_DB) {
          await recordSpineFieldObservationD1(
            env.CACHE_DB,
            tid,
            resolveEntityType(e.entity_type),
            e.source,
            e.data
          ).catch(() => undefined);
        }

        await env.CACHE.delete(`entity:${tid}:${e.source}:${e.source_id}`);
        return result;
      });

      const results = await Promise.all(writePromises);

      if (env.CACHE_DB) {
        // Write audit log to D1
        await env.CACHE_DB.prepare(
          `CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            actor_entity_id TEXT,
            target_id TEXT,
            target_type TEXT,
            approval_id TEXT,
            meta TEXT,
            created_at TEXT NOT NULL
          )`
        )
          .run()
          .catch(() => {});

        const auditId = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();
        await env.CACHE_DB.prepare(
          `INSERT INTO audit_log (id, tenant_id, event_type, actor_entity_id, target_id, target_type, meta, created_at)
           VALUES (?, ?, ?, 'pipeline', ?, 'pipeline', ?, ?)`
        )
          .bind(
            auditId,
            tid,
            "spine.routed_write",
            body.trace_id || null,
            JSON.stringify({
              count: body.entities.length,
              trace_id: body.trace_id,
              targets: results.map((r) => r.target),
              fallbacks: results.filter((r) => r.fallback).length,
            }),
            now
          )
          .run()
          .catch(() => {});
      }

      return json({ written: results.length, results });
    }

    // ── Legacy write (backward compat) ──
    // Still supported: POST /api/write — routes through the same writeToSpine logic
    if (url.pathname === "/api/write" && request.method === "POST") {
      const body = (await request.json()) as {
        tenant_id: string;
        entities: InboundEntity[];
        trace_id: string;
      };

      const tid = body.tenant_id || tenantId;

      // Check if tenant is free/personal plan
      let isFreeOrPersonal = false;
      if (env.CACHE_DB) {
        try {
          const tenant = await env.CACHE_DB.prepare("SELECT plan FROM tenants WHERE id = ?")
            .bind(tid)
            .first<{ plan: string }>();
          if (tenant?.plan === "free" || tenant?.plan === "personal") {
            isFreeOrPersonal = true;
          }
        } catch (err) {
          console.warn(`[spine] Failed to query tenant plan from D1:`, err);
        }
      }

      const results: Array<{ target: string; id: string | null; fallback: boolean }> = [];

      for (const entity of body.entities) {
        const result = await writeToSpine(env, tid, entity);
        results.push(result);

        if (entity.data && typeof entity.data === "object" && !isFreeOrPersonal && env.CACHE_DB) {
          await recordSpineFieldObservationD1(
            env.CACHE_DB,
            tid,
            resolveEntityType(entity.entity_type),
            entity.source,
            entity.data
          ).catch(() => undefined);
        }

        await env.CACHE.delete(`entity:${tid}:${entity.source}:${entity.source_id}`);
      }

      if (env.CACHE_DB) {
        // Write audit log to D1
        await env.CACHE_DB.prepare(
          `CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            actor_entity_id TEXT,
            target_id TEXT,
            target_type TEXT,
            approval_id TEXT,
            meta TEXT,
            created_at TEXT NOT NULL
          )`
        )
          .run()
          .catch(() => {});

        const auditId = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();
        await env.CACHE_DB.prepare(
          `INSERT INTO audit_log (id, tenant_id, event_type, actor_entity_id, target_id, target_type, meta, created_at)
           VALUES (?, ?, ?, 'pipeline', ?, 'pipeline', ?, ?)`
        )
          .bind(
            auditId,
            tid,
            "entities.upserted",
            body.trace_id || null,
            JSON.stringify({
              count: body.entities.length,
              trace_id: body.trace_id,
              source: body.entities[0]?.source,
            }),
            now
          )
          .run()
          .catch(() => {});
      }

      return json({ written: results.length, results });
    }

    // ── READ: Entity type map (for debugging / UI) ──
    if (url.pathname === "/api/schema-map" && request.method === "GET") {
      return json({ types: ENTITY_TYPE_TO_TABLE, aliases: ENTITY_TYPE_ALIASES });
    }

    // ── READ: Entities list ──
    if (url.pathname === "/api/entities" && request.method === "GET") {
      const entityType = url.searchParams.get("type");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      if (!entityType) {
        return json(
          { error: "Entity type parameter ('type') is required to list schema-isolated entities." },
          400
        );
      }

      const target = getSpineTarget(entityType);
      if (!target) {
        return json({ error: `Unmapped entity type: "${entityType}".` }, 400);
      }

      if (env.CACHE_DB) {
        const domain = getDomainForType(entityType);
        const tableName = `${domain}_data`;
        const matchingTypes = getMatchingTypesForQuery(entityType);
        const placeholders = matchingTypes.map(() => "?").join(", ");
        const countRes = await env.CACHE_DB.prepare(
          `SELECT COUNT(*) as total FROM ${tableName} WHERE type IN (${placeholders}) AND tenant_id = ?`
        )
          .bind(...matchingTypes, tenantId)
          .first<{ total: number }>();
        const total = countRes?.total || 0;

        const d1Rows = await env.CACHE_DB.prepare(
          `SELECT * FROM ${tableName} WHERE type IN (${placeholders}) AND tenant_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?`
        )
          .bind(...matchingTypes, tenantId, limit, offset)
          .all<any>();

        const entities = (d1Rows.results || []).map((row) => {
          const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
          return {
            id: row.id,
            tenant_id: tenantId,
            entity_type: entityType,
            source: row.source_tool,
            source_id: row.source_id,
            updated_at: row.updated_at,
            created_at: row.created_at,
            ...parsedData,
          };
        });

        return json({
          entities,
          total,
          source: `D1.${tableName}`,
        });
      }

      return json({ error: "D1 database is not configured." }, 500);
    }

    // ── READ: Single entity ──
    if (url.pathname.startsWith("/api/entities/") && request.method === "GET") {
      const parts = url.pathname.split("/").filter(Boolean); // e.g. ["api", "entities", "account", "uuid"] or ["api", "entities", "uuid"]

      let entityType: string | null = null;
      let entityId: string | null = null;

      if (parts.length >= 4) {
        // Path is /api/entities/:entityType/:id
        entityType = parts[2];
        entityId = parts[3];
      } else if (parts.length === 3) {
        // Path is /api/entities/:id (no type provided in URL)
        entityId = parts[2];
        // Check if type is passed via query param e.g. ?type=account
        entityType = url.searchParams.get("type");
      }

      if (!entityId) {
        return new Response(JSON.stringify({ error: "Entity ID is required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!entityType) {
        return new Response(
          JSON.stringify({
            error: "Entity type is required to retrieve a schema-isolated entity.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const target = getSpineTarget(entityType);
      if (!target) {
        return new Response(JSON.stringify({ error: `Unmapped entity type: "${entityType}".` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (env.CACHE_DB) {
        const domain = getDomainForType(entityType);
        const tableName = `${domain}_data`;
        const row = await env.CACHE_DB.prepare(
          `SELECT * FROM ${tableName} WHERE id = ? AND tenant_id = ? LIMIT 1`
        )
          .bind(entityId, tenantId)
          .first<any>();

        if (!row) {
          return new Response(JSON.stringify({ error: "Entity not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
        return json({
          id: row.id,
          tenant_id: tenantId,
          entity_type: entityType,
          source: row.source_tool,
          source_id: row.source_id,
          updated_at: row.updated_at,
          created_at: row.created_at,
          ...parsedData,
        });
      }

      return new Response(JSON.stringify({ error: "D1 database is not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── READ: Signals ──
    if (url.pathname === "/api/signals" && request.method === "GET") {
      if (env.CACHE_DB) {
        const d1Res = await env.CACHE_DB.prepare(
          "SELECT * FROM signal_cache WHERE tenant_id = ? ORDER BY updated_at DESC LIMIT 20"
        )
          .bind(tenantId)
          .all<any>();

        const signals = (d1Res.results || []).map((row) => {
          const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
          return {
            id: row.id,
            tenant_id: tenantId,
            signal_type: row.signal_type,
            severity: row.severity,
            entity_id: row.entity_id,
            status: "active",
            updated_at: row.updated_at,
            created_at: row.updated_at,
            ...parsedData,
          };
        });

        return json({ signals });
      }

      return json({ error: "D1 database is not configured." }, 500);
    }

    // ── READ: Dashboard stats ──
    if (url.pathname === "/api/dashboard" && request.method === "GET") {
      if (env.CACHE_DB) {
        const entitiesCountRes = await env.CACHE_DB.prepare(
          "SELECT COUNT(*) as total FROM entity_cache WHERE tenant_id = ?"
        )
          .bind(tenantId)
          .first<{ total: number }>();

        const signalsCountRes = await env.CACHE_DB.prepare(
          "SELECT COUNT(*) as total FROM signal_cache WHERE tenant_id = ?"
        )
          .bind(tenantId)
          .first<{ total: number }>();

        const approvalsCountRes = await env.CACHE_DB.prepare(
          "SELECT COUNT(*) as total FROM governance_data WHERE type = 'approval' AND status = 'pending'"
        ).first<{ total: number }>();

        const connectorsRes = await env.CACHE_DB.prepare(
          "SELECT tool_name, status, records_synced as entity_count, last_sync_at FROM governance_data WHERE type = 'sync_status'"
        ).all<any>();

        return json({
          entity_count: entitiesCountRes?.total || 0,
          active_signals: signalsCountRes?.total || 0,
          pending_approvals: approvalsCountRes?.total || 0,
          connectors: (connectorsRes.results || []).map((r) => ({
            tool_name: r.tool_name,
            status: r.status || "connected",
            entity_count: r.entity_count || 0,
            last_sync_at: r.last_sync_at,
          })),
        });
      }

      return json({ error: "D1 database is not configured." }, 500);
    }

    // ── Entity 360: Single entity ──
    if (url.pathname === "/api/entity360" && request.method === "POST") {
      const body = (await request.json()) as Entity360Request;
      body.tenant_id = body.tenant_id || tenantId;
      const result = await assembleEntity360(body, {
        CACHE: env.CACHE,
        CACHE_DB: env.CACHE_DB,
      });
      return json(result);
    }

    // ── Entity 360: GET shorthand ──
    if (url.pathname.startsWith("/api/entity360/") && request.method === "GET") {
      const spineId = url.pathname.replace("/api/entity360/", "");
      const layers = url.searchParams.get("layers")?.split(",") as any;
      const result = await assembleEntity360(
        { tenant_id: tenantId, spine_id: spineId, layers },
        {
          CACHE: env.CACHE,
          CACHE_DB: env.CACHE_DB,
        }
      );
      return json(result);
    }

    // ── Entity 360: Batch ──
    if (url.pathname === "/api/entity360/batch" && request.method === "POST") {
      const body = (await request.json()) as Entity360BatchRequest;
      body.tenant_id = body.tenant_id || tenantId;
      const result = await assembleEntity360Batch(body, {
        CACHE: env.CACHE,
        CACHE_DB: env.CACHE_DB,
      });
      return json(result);
    }

    // ── Identity Resolution: List merge candidates ──
    if (url.pathname === "/api/identity/candidates" && request.method === "GET") {
      const db = (env as any).CACHE_DB as D1Database;
      if (!db) return json({ error: "D1 not available" });
      const status = url.searchParams.get("status") || "pending";
      const entityType = url.searchParams.get("entity_type");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      let q = `SELECT mc.*, sa.email as email_a, sa.name as name_a, sb.email as email_b, sb.name as name_b
        FROM merge_candidates mc
        LEFT JOIN entity_signatures sa ON sa.tenant_id = mc.tenant_id AND sa.entity_type = mc.entity_type AND sa.source_system = mc.source_a AND sa.external_id = mc.external_id_a
        LEFT JOIN entity_signatures sb ON sb.tenant_id = mc.tenant_id AND sb.entity_type = mc.entity_type AND sb.source_system = mc.source_b AND sb.external_id = mc.external_id_b
        WHERE mc.tenant_id = ? AND mc.status = ?`;
      const params: any[] = [tenantId, status];
      if (entityType) {
        q += " AND mc.entity_type = ?";
        params.push(entityType);
      }
      q += " ORDER BY mc.confidence DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const result = await db
        .prepare(q)
        .bind(...params)
        .all();
      const count = await db
        .prepare(
          "SELECT COUNT(*) as total FROM merge_candidates WHERE tenant_id = ? AND status = ?"
        )
        .bind(tenantId, status)
        .first<{ total: number }>();
      return json({ candidates: result.results || [], total: count?.total || 0 });
    }

    // ── Identity Resolution: Resolve candidate (merge/keep-separate/defer) ──
    if (
      url.pathname.match(/^\/api\/identity\/candidates\/\d+\/(merge|keep-separate|defer)$/) &&
      request.method === "POST"
    ) {
      const db = (env as any).CACHE_DB as D1Database;
      if (!db) return json({ error: "D1 not available" });
      const parts = url.pathname.split("/");
      const candidateId = parts[4];
      const action = parts[5];
      const userId = request.headers.get("x-user-id") || "system";

      const candidate = await db
        .prepare("SELECT * FROM merge_candidates WHERE id = ? AND tenant_id = ?")
        .bind(candidateId, tenantId)
        .first();
      if (!candidate)
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });

      const statusMap: Record<string, string> = {
        merge: "merged",
        "keep-separate": "rejected",
        defer: "deferred",
      };
      await db
        .prepare(
          "UPDATE merge_candidates SET status = ?, resolved_by = ?, resolved_at = datetime('now') WHERE id = ?"
        )
        .bind(statusMap[action] || "pending", userId, candidateId)
        .run();

      // If merge, record in D1 audit log
      if (action === "merge") {
        const body = (await request.json().catch(() => ({}))) as any;
        const now = new Date().toISOString();
        await db
          .prepare(
            `INSERT INTO audit_log (id, tenant_id, event_type, actor_entity_id, target_id, target_type, meta, created_at)
             VALUES (?, ?, 'identity.merge', ?, ?, 'identity_resolution', ?, ?)`
          )
          .bind(
            `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            tenantId,
            userId,
            candidateId,
            JSON.stringify({
              candidate_id: candidateId,
              primary_source: body.primary_source,
              entity_type: (candidate as any).entity_type,
            }),
            now
          )
          .run()
          .catch((err) => {
            console.warn("[spine-v2] D1 audit_log insert failed (non-fatal):", err);
          });
      }

      return json({ success: true, action: statusMap[action] });
    }

    // ── Identity Resolution: Stats ──
    if (url.pathname === "/api/identity/stats" && request.method === "GET") {
      const db = (env as any).CACHE_DB as D1Database;
      if (!db) return json({ error: "D1 not available" });
      const stats = await db
        .prepare(
          "SELECT status, COUNT(*) as count, AVG(confidence) as avg_confidence FROM merge_candidates WHERE tenant_id = ? GROUP BY status"
        )
        .bind(tenantId)
        .all();
      const sigs = await db
        .prepare("SELECT COUNT(*) as total FROM entity_signatures WHERE tenant_id = ?")
        .bind(tenantId)
        .first<{ total: number }>();
      return json({ merge_candidates: stats.results || [], total_signatures: sigs?.total || 0 });
    }

    // ── Agent Memory: POST /api/v1/memory ────────────────────────────────────
    if (url.pathname === "/api/v1/memory" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      const isTriageBot = env.TRIAGE_BOT_API_KEY && auth === env.TRIAGE_BOT_API_KEY;
      const isSyncSecret = env.SYNC_SECRET && auth === env.SYNC_SECRET;
      if (!isTriageBot && !isSyncSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // ── IntegrateWise Continuity Schema (extended body type) ──────────────────
      // Supports the full continuity schema required by the IntegrateWise doctrine.
      // All new fields are persisted into the KV metadata blob.
      // Backward compatible: legacy callers using only {agent_id, session_id, type, content, metadata} still work.
      const body = (await request.json()) as {
        // Core fields (original)
        agent_id: string;
        session_id: string;
        type: "conversation" | "fact" | "decision" | "context" | "session_summary";
        content?: string;
        metadata?: Record<string, any>;
        // Continuity schema extensions
        summary?: string; // alias for content — used if content is absent
        entity_refs?: string[]; // entity KV key references
        workflow_refs?: string[]; // workflow KV key references
        approval_refs?: string[]; // approval KV key references
        source_agent?: string; // originating agent, default 'hermes'
        confidence?: number; // 0-1 confidence score, default 1.0
        continuity_type?: string; // stored in metadata
        parent_memory?: string; // parent memory kv_key reference, stored in metadata
        tags?: string[]; // stored in metadata
      };

      // Resolve content: use summary as alias if content is absent
      const resolvedContent = body.content ?? body.summary ?? "";

      if (!body.agent_id || !body.session_id || !body.type || !resolvedContent) {
        return json({
          error: "Missing required fields: agent_id, session_id, type, content (or summary)",
        });
      }

      const ts = Date.now();
      const kvKey = `memory:${body.agent_id}:${ts}`;

      // Merge caller-provided metadata with continuity schema extension fields
      const mergedMetadata: Record<string, any> = {
        ...(body.metadata || {}),
        entity_refs: body.entity_refs ?? [],
        workflow_refs: body.workflow_refs ?? [],
        approval_refs: body.approval_refs ?? [],
        source_agent: body.source_agent ?? "hermes",
        confidence: body.confidence ?? 1.0,
        ...(body.continuity_type !== undefined ? { continuity_type: body.continuity_type } : {}),
        ...(body.parent_memory !== undefined ? { parent_memory: body.parent_memory } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
      };

      const entry = {
        agent_id: body.agent_id,
        session_id: body.session_id,
        type: body.type,
        content: resolvedContent,
        metadata: mergedMetadata,
        created_at: new Date(ts).toISOString(),
      };

      // Write to KV
      await env.CACHE.put(kvKey, JSON.stringify(entry));

      // Write index to D1
      const db = env.CACHE_DB as D1Database;
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS agent_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kv_key TEXT NOT NULL UNIQUE,
            agent_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            metadata TEXT
          )`
        )
        .run();

      await db
        .prepare(
          "INSERT OR IGNORE INTO agent_memory (kv_key, agent_id, session_id, type, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(
          kvKey,
          body.agent_id,
          body.session_id,
          body.type,
          entry.created_at,
          JSON.stringify(mergedMetadata)
        )
        .run();

      return json({ success: true, key: kvKey, created_at: entry.created_at });
    }

    // ── Agent Memory: GET /api/v1/memory ─────────────────────────────────────
    if (url.pathname === "/api/v1/memory" && request.method === "GET") {
      const agentId = url.searchParams.get("agent_id");
      const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
      const typeFilter = url.searchParams.get("type") || null;

      if (!agentId) {
        return json({ error: "Missing required query param: agent_id" });
      }

      const prefix = `memory:${agentId}:`;
      const listed = await env.CACHE.list({ prefix, limit: Math.min(limitParam, 500) });

      const entries: Array<{
        key: string;
        agent_id: string;
        session_id: string;
        type: string;
        content: string;
        metadata: Record<string, any>;
        created_at: string;
      }> = [];

      for (const key of listed.keys) {
        const raw = await env.CACHE.get(key.name);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw) as {
            agent_id: string;
            session_id: string;
            type: string;
            content: string;
            metadata: Record<string, any>;
            created_at: string;
          };
          if (typeFilter && parsed.type !== typeFilter) continue;
          entries.push({ key: key.name, ...parsed });
        } catch {
          // skip malformed entries
        }
      }

      // Sort by timestamp desc (embedded in key: memory:{agent_id}:{ts})
      entries.sort((a, b) => {
        const tsA = parseInt(a.key.split(":").pop() || "0", 10);
        const tsB = parseInt(b.key.split(":").pop() || "0", 10);
        return tsB - tsA;
      });

      return json({ agent_id: agentId, count: entries.length, entries });
    }

    // ── Agent Memory: DELETE /api/v1/memory/:key ──────────────────────────────
    if (url.pathname.startsWith("/api/v1/memory/") && request.method === "DELETE") {
      const auth = request.headers.get("Authorization") || "";
      const isTriageBot = env.TRIAGE_BOT_API_KEY && auth === env.TRIAGE_BOT_API_KEY;
      const isSyncSecret = env.SYNC_SECRET && auth === env.SYNC_SECRET;
      if (!isTriageBot && !isSyncSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Key is everything after /api/v1/memory/ — may contain colons, decode URI
      const rawKey = decodeURIComponent(url.pathname.replace("/api/v1/memory/", ""));

      await env.CACHE.delete(rawKey);

      // Remove from D1 index if available
      const db = env.CACHE_DB as D1Database;
      await db
        .prepare("DELETE FROM agent_memory WHERE kv_key = ?")
        .bind(rawKey)
        .run()
        .catch(() => {
          // Table may not exist yet; ignore
        });

      return json({ success: true, deleted_key: rawKey });
    }

    // ── FLOW C: Signal ingestion (shadow mode) ──────────────────────────────
    // POST /api/v1/governance/signal
    // Writes a signal into D1. Never auto-promotes. Sets processed=false.
    if (url.pathname === "/api/v1/governance/signal" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      if (auth !== env.SYNC_SECRET)
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      const db = env.CACHE_DB as D1Database;
      const body = (await request.json()) as {
        signal_type: string;
        workspace: string;
        source_entity_id?: string;
        payload: Record<string, unknown>;
        severity?: string;
        shadow?: boolean;
      };
      const id = `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO signals (id, tenant_id, signal_type, workspace, source_entity_id, payload, severity, processed, shadow, created_at)
         VALUES (?, 'integratewise', ?, ?, ?, ?, ?, 0, ?, ?)`
        )
        .bind(
          id,
          body.signal_type,
          body.workspace,
          body.source_entity_id ?? "agent-hermes",
          JSON.stringify(body.payload),
          body.severity ?? "info",
          body.shadow !== false ? 1 : 0,
          now
        )
        .run();
      // audit
      await db
        .prepare(
          `INSERT INTO audit_log (id, tenant_id, event_type, actor_entity_id, target_id, target_type, meta, created_at)
         VALUES (?, 'integratewise', 'signal.ingested', ?, ?, 'signals', ?, ?)`
        )
        .bind(
          `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          body.source_entity_id ?? "agent-hermes",
          id,
          JSON.stringify({ shadow: body.shadow !== false, signal_type: body.signal_type }),
          now
        )
        .run()
        .catch(() => {});
      return json({ success: true, signal_id: id, shadow: body.shadow !== false });
    }

    // ── FLOW C: Propose (shadow mode) ────────────────────────────────────────
    // POST /api/v1/governance/propose
    // Takes a signal_id, creates a draft approval_queue entry. draft_only=true.
    // Constitutional Law IV enforced: no auto-canonization.
    if (url.pathname === "/api/v1/governance/propose" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      if (auth !== env.SYNC_SECRET)
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      const db = env.CACHE_DB as D1Database;
      const body = (await request.json()) as {
        signal_id: string;
        title: string;
        proposed_change: Record<string, unknown>;
        workspace?: string;
        proposed_by?: string;
        doc_type?: string;
      };
      // Fetch the source signal
      const sig = (await db
        .prepare("SELECT * FROM signals WHERE id=? AND tenant_id='integratewise'")
        .bind(body.signal_id)
        .first()) as Record<string, unknown> | null;
      if (!sig)
        return new Response(JSON.stringify({ error: "Signal not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      const id = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO approval_queue (id, tenant_id, workspace, title, proposed_by, source_signal_id, proposed_change, doc_type, status, draft_only, created_at, updated_at)
         VALUES (?, 'integratewise', ?, ?, ?, ?, ?, ?, 'pending', 1, ?, ?)`
        )
        .bind(
          id,
          body.workspace ?? (sig.workspace as string) ?? "governance",
          body.title,
          body.proposed_by ?? "agent-hermes",
          body.signal_id,
          JSON.stringify(body.proposed_change),
          body.doc_type ?? "governance_decision",
          now,
          now
        )
        .run();
      // Link signal → proposal
      await db
        .prepare("UPDATE signals SET proposal_id=?, processed=1 WHERE id=?")
        .bind(id, body.signal_id)
        .run()
        .catch(() => {});
      // audit
      await db
        .prepare(
          `INSERT INTO audit_log (id, tenant_id, event_type, actor_entity_id, target_id, target_type, meta, created_at)
         VALUES (?, 'integratewise', 'proposal.created', ?, ?, 'approval_queue', ?, ?)`
        )
        .bind(
          `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          body.proposed_by ?? "agent-hermes",
          id,
          JSON.stringify({ signal_id: body.signal_id, draft_only: true }),
          now
        )
        .run()
        .catch(() => {});
      return json({ success: true, proposal_id: id, status: "pending", draft_only: true });
    }

    // ── FLOW C: Governance queue ─────────────────────────────────────────────
    // GET /api/v1/governance/queue
    // Lists pending proposals for HITL review. Read-only, no auth required.
    if (url.pathname === "/api/v1/governance/queue" && request.method === "GET") {
      const db = env.CACHE_DB as D1Database;
      const status = url.searchParams.get("status") || "pending";
      const workspace = url.searchParams.get("workspace");
      let q = "SELECT * FROM approval_queue WHERE tenant_id='integratewise' AND status=?";
      const params: string[] = [status];
      if (workspace) {
        q += " AND workspace=?";
        params.push(workspace);
      }
      q += " ORDER BY created_at DESC LIMIT 50";
      const { results } = await db
        .prepare(q)
        .bind(...params)
        .all();
      return json({ proposals: results, count: results.length });
    }

    // ── FLOW C: HITL Approve ─────────────────────────────────────────────────
    // POST /api/v1/governance/approve
    // Nirmal (or operator) approves a proposal. Writes to canonical_docs.
    // This is the ONLY path that creates canonical truth. Law II + III enforced.
    if (url.pathname === "/api/v1/governance/approve" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      if (auth !== env.SYNC_SECRET)
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      const db = env.CACHE_DB as D1Database;
      const body = (await request.json()) as {
        proposal_id: string;
        approved_by: string; // must be user-nirmal-prince or human entity
        decision: "approve" | "reject";
        notes?: string;
      };
      // Verify approver is a user (not an agent) — Law II hard wall
      const approver = (await db
        .prepare("SELECT * FROM entities WHERE id=? AND tenant_id='integratewise'")
        .bind(body.approved_by)
        .first()) as Record<string, unknown> | null;
      if (!approver || approver.entity_type === "agent") {
        return json({
          error: "Approver must be a human user entity — agents cannot canonize truth (Law II)",
        });
      }
      const proposal = (await db
        .prepare("SELECT * FROM approval_queue WHERE id=? AND tenant_id='integratewise'")
        .bind(body.proposal_id)
        .first()) as Record<string, unknown> | null;
      if (!proposal)
        return new Response(JSON.stringify({ error: "Proposal not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      if (proposal.status !== "pending")
        return new Response(JSON.stringify({ error: `Proposal already ${proposal.status}` }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      const now = new Date().toISOString();
      if (body.decision === "reject") {
        await db
          .prepare(
            "UPDATE approval_queue SET status='rejected', reviewer_id=?, reviewed_at=?, reviewer_notes=?, updated_at=? WHERE id=?"
          )
          .bind(body.approved_by, now, body.notes ?? null, now, body.proposal_id)
          .run();
        await db
          .prepare(
            `INSERT INTO audit_log (id, tenant_id, event_type, actor_entity_id, target_id, target_type, approval_id, meta, created_at)
           VALUES (?, 'integratewise', 'proposal.rejected', ?, ?, 'approval_queue', ?, ?, ?)`
          )
          .bind(
            `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            body.approved_by,
            body.proposal_id,
            body.proposal_id,
            JSON.stringify({ notes: body.notes }),
            now
          )
          .run()
          .catch(() => {});
        return json({ success: true, decision: "rejected", proposal_id: body.proposal_id });
      }
      // Approve → write canonical_doc
      const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await db
        .prepare(
          `INSERT INTO canonical_docs (id, tenant_id, workspace, doc_type, title, content, memory_layer, created_by, approval_id, version, created_at, updated_at)
         VALUES (?, 'integratewise', ?, ?, ?, ?, 'canonical', ?, ?, 1, ?, ?)`
        )
        .bind(
          docId,
          proposal.workspace as string,
          proposal.doc_type as string,
          proposal.title as string,
          proposal.proposed_change as string,
          body.approved_by, // human created_by — Law II satisfied
          body.proposal_id,
          now,
          now
        )
        .run();
      // Mark proposal approved
      await db
        .prepare(
          "UPDATE approval_queue SET status='approved', reviewer_id=?, reviewed_at=?, reviewer_notes=?, canonical_doc_id=?, draft_only=0, updated_at=? WHERE id=?"
        )
        .bind(body.approved_by, now, body.notes ?? null, docId, now, body.proposal_id)
        .run();
      // audit
      await db
        .prepare(
          `INSERT INTO audit_log (id, tenant_id, event_type, actor_entity_id, target_id, target_type, approval_id, meta, created_at)
         VALUES (?, 'integratewise', 'canonical.created', ?, ?, 'canonical_docs', ?, ?, ?)`
        )
        .bind(
          `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          body.approved_by,
          docId,
          body.proposal_id,
          JSON.stringify({ proposal_id: body.proposal_id, doc_type: proposal.doc_type }),
          now
        )
        .run()
        .catch(() => {});
      return json({
        success: true,
        decision: "approved",
        canonical_doc_id: docId,
        proposal_id: body.proposal_id,
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
