/**
 * ⚠️ DEPRECATED: This file contains Customer Success-specific schema definitions
 *
 * These types were created for a specific CS/Account Success use case and are
 * NOT generic. They assume all users are in Customer Success roles.
 *
 * DO NOT USE for new code. Use unified-connector-registry.ts instead.
 *
 * Migration path:
 * - Replace CSCanonicalEntityType with generic entity types from adaptive-schema.ts
 * - Replace CSFactFamily with generic fact families
 * - Replace RoleLens with department-agnostic roles
 *
 * This file will be removed in v4.0
 * @deprecated Use unified-connector-registry.ts and adaptive-schema.ts
 */

export const SUCCESS_CORE_ENTITY_TYPES = [
  "account",
  "account_contact",
  "internal_team_member",
  "account_team_assignment",
  "business_context",
  "strategic_objective",
  "stakeholder_outcome",
  "engagement",
  "success_plan",
  "initiative",
  "risk",
  "task",
  "generated_insight",
  "platform_health_metric",
  "metrics_history",
  "external_integration",
  "sync_log",
] as const;

export const SUCCESS_OVERLAY_ENTITY_TYPES = [
  "capability",
  "value_stream",
  "technical_asset",
  "technical_service",
  "api_portfolio",
  "environment_health",
  "usage_dimension",
] as const;

export type RoleLens = "account_success" | "tam";
export type CSCanonicalEntityType =
  | (typeof SUCCESS_CORE_ENTITY_TYPES)[number]
  | (typeof SUCCESS_OVERLAY_ENTITY_TYPES)[number];

export type CSFactFamily =
  | "account_commercial"
  | "stakeholders_ownership"
  | "engagements"
  | "usage_adoption"
  | "technical_health"
  | "support_service"
  | "risks"
  | "initiatives_tasks"
  | "renewals_expansion"
  | "recommendations_proof"
  | "integration_sync_health"
  | "product_capabilities";

export const SUCCESS_SECTION_IDS = [
  "accounts_overview",
  "account_detail",
  "contacts_stakeholders",
  "tasks_actions",
  "risks",
  "renewals",
  "usage_adoption",
  "support_cases",
  "success_plans",
  "ai_insights",
  "integrations_sync_health",
] as const;

export type CSSectionId = (typeof SUCCESS_SECTION_IDS)[number];

export type ProductProfileId =
  | "generic_b2b_saas"
  | "integration_platform"
  | "developer_platform"
  | "analytics_platform"
  | "security_platform"
  | "workflow_automation"
  | "commerce_saas"
  | "collaboration_platform";

export interface ProductProfile {
  id: ProductProfileId;
  label: string;
  description: string;
  capabilityTaxonomy: string[];
  technicalAssetTaxonomy: string[];
  valueStreamTaxonomy: string[];
  metricFamilies: string[];
  riskCategories: string[];
  engagementTypes: string[];
  recommendedConnectors: string[];
  overlayEntityTypes: CSCanonicalEntityType[];
  derivedSections: CSSectionId[];
}

export interface FieldBindingRule {
  entityType: CSCanonicalEntityType;
  field: string;
  factFamily: CSFactFamily;
  precedence: string[];
}

export interface SuccessSectionAvailability {
  enabled: boolean;
  preferredLens: "shared" | RoleLens;
  matchedEntityTypes: string[];
  matchedFactFamilies: CSFactFamily[];
}

export interface SectionProof {
  source: string;
  entityType?: string;
  updatedAt?: string | null;
}

export interface SectionAction {
  id: string;
  label: string;
  kind: "view" | "act" | "connect" | "review";
}

export interface SectionContract<T> {
  status: "ready" | "partial" | "empty";
  coverage: number;
  freshness?: string | null;
  proof: SectionProof[];
  actions: SectionAction[];
  data: T;
}

export interface SuccessIntelligenceItem {
  id: string;
  signalKey: string;
  band: string;
  lens: RoleLens;
  pageId: CSSectionId;
  sectionId: string;
  factFamily: CSFactFamily;
  entityType?: string;
  entityId?: string;
  title: string;
  description: string;
  confidence: number;
  source: string;
  detectedAt: string;
  suggestedAction?: string;
}

export interface SuccessIntelligenceResponse {
  lens: RoleLens;
  productProfile: ProductProfileId;
  generatedAt: string;
  recentSignals: SuccessIntelligenceItem[];
  sections: Record<string, SuccessIntelligenceItem[]>;
}

export interface SuccessPageProjection {
  pageId: CSSectionId;
  lens: RoleLens;
  productProfile: ProductProfileId;
  generatedAt: string;
  sections: Record<string, SectionContract<unknown>>;
}

export interface ResolvedSuccessSchema {
  allowedEntityTypes: string[];
  allowedFieldsByEntity: Record<string, string[]>;
  activeRoleLens: RoleLens;
  activeProductProfile: ProductProfileId;
  derivedSectionAvailability: Record<CSSectionId, SuccessSectionAvailability>;
  connectorCapabilityCoverage: Record<CSFactFamily, string[]>;
  fieldBindings: FieldBindingRule[];
}

export const PRODUCT_PROFILES: Record<ProductProfileId, ProductProfile> = {
  generic_b2b_saas: {
    id: "generic_b2b_saas",
    label: "Generic B2B SaaS",
    description: "Default profile for account success and TAM teams supporting SaaS products.",
    capabilityTaxonomy: ["adoption", "workflow", "governance"],
    technicalAssetTaxonomy: ["workspace", "environment", "integration"],
    valueStreamTaxonomy: ["onboarding", "adoption", "renewal", "expansion"],
    metricFamilies: ["health", "adoption", "engagement", "support"],
    riskCategories: ["business", "technical", "operational", "renewal"],
    engagementTypes: ["check-in", "qbr", "ebr", "escalation"],
    recommendedConnectors: ["salesforce", "hubspot", "zendesk", "slack", "gmail"],
    overlayEntityTypes: ["capability", "value_stream", "usage_dimension", "environment_health"],
    derivedSections: [...SUCCESS_SECTION_IDS],
  },
  integration_platform: {
    id: "integration_platform",
    label: "Integration Platform",
    description:
      "API and integration-centric products with deep value stream and API portfolio depth.",
    capabilityTaxonomy: ["integration", "api_management", "governance", "data"],
    technicalAssetTaxonomy: ["api", "environment", "runtime", "connector"],
    valueStreamTaxonomy: ["api_program", "integration_delivery", "partner_enablement"],
    metricFamilies: ["platform_health", "api_usage", "latency", "adoption"],
    riskCategories: ["architecture", "technical", "renewal", "delivery"],
    engagementTypes: ["architecture_review", "qbr", "enablement", "escalation"],
    recommendedConnectors: ["salesforce", "jira", "github", "slack", "datadog"],
    overlayEntityTypes: [
      "capability",
      "value_stream",
      "technical_asset",
      "technical_service",
      "api_portfolio",
      "environment_health",
      "usage_dimension",
    ],
    derivedSections: [...SUCCESS_SECTION_IDS],
  },
  developer_platform: {
    id: "developer_platform",
    label: "Developer Platform",
    description:
      "Engineering and developer tooling products with service, pipeline, and adoption overlays.",
    capabilityTaxonomy: ["developer_experience", "delivery", "observability"],
    technicalAssetTaxonomy: ["repository", "pipeline", "service", "environment"],
    valueStreamTaxonomy: ["release_flow", "incident_reduction", "platform_adoption"],
    metricFamilies: ["deployment", "service_health", "adoption", "support"],
    riskCategories: ["technical", "architecture", "delivery"],
    engagementTypes: ["architecture_review", "incident_review", "enablement"],
    recommendedConnectors: ["github", "gitlab", "jira", "linear", "datadog"],
    overlayEntityTypes: [
      "capability",
      "technical_asset",
      "technical_service",
      "environment_health",
      "usage_dimension",
    ],
    derivedSections: [...SUCCESS_SECTION_IDS],
  },
  analytics_platform: {
    id: "analytics_platform",
    label: "Analytics Platform",
    description:
      "Analytics and measurement products with strong usage, dashboard, and data model overlays.",
    capabilityTaxonomy: ["analytics", "insights", "experimentation"],
    technicalAssetTaxonomy: ["dashboard", "dataset", "model"],
    valueStreamTaxonomy: ["reporting", "decision_support", "adoption"],
    metricFamilies: ["usage", "query_health", "adoption", "support"],
    riskCategories: ["adoption", "data_quality", "renewal"],
    engagementTypes: ["qbr", "insight_review", "enablement"],
    recommendedConnectors: ["mixpanel", "amplitude", "google-analytics", "tableau", "metabase"],
    overlayEntityTypes: ["capability", "value_stream", "usage_dimension", "environment_health"],
    derivedSections: [...SUCCESS_SECTION_IDS],
  },
  security_platform: {
    id: "security_platform",
    label: "Security Platform",
    description: "Security and compliance products with technical health and risk-heavy overlays.",
    capabilityTaxonomy: ["security", "compliance", "detection", "response"],
    technicalAssetTaxonomy: ["endpoint", "policy", "service", "environment"],
    valueStreamTaxonomy: ["coverage", "response", "governance"],
    metricFamilies: ["coverage", "incidents", "compliance", "adoption"],
    riskCategories: ["security", "compliance", "technical"],
    engagementTypes: ["risk_review", "executive_review", "incident_review"],
    recommendedConnectors: ["okta", "splunk", "slack", "jira", "servicenow"],
    overlayEntityTypes: [
      "capability",
      "technical_asset",
      "technical_service",
      "environment_health",
    ],
    derivedSections: [...SUCCESS_SECTION_IDS],
  },
  workflow_automation: {
    id: "workflow_automation",
    label: "Workflow Automation",
    description:
      "Workflow and operations platforms with automation, integrations, and process value streams.",
    capabilityTaxonomy: ["automation", "workflow", "operations"],
    technicalAssetTaxonomy: ["workflow", "integration", "environment"],
    valueStreamTaxonomy: ["process_automation", "handoff_reduction", "ops_visibility"],
    metricFamilies: ["automation_usage", "throughput", "adoption", "support"],
    riskCategories: ["operational", "delivery", "renewal"],
    engagementTypes: ["process_review", "qbr", "enablement"],
    recommendedConnectors: ["asana", "monday", "airtable", "slack", "notion"],
    overlayEntityTypes: ["capability", "value_stream", "technical_service", "usage_dimension"],
    derivedSections: [...SUCCESS_SECTION_IDS],
  },
  commerce_saas: {
    id: "commerce_saas",
    label: "Commerce SaaS",
    description: "Commerce and billing products with renewal, support, and adoption overlays.",
    capabilityTaxonomy: ["commerce", "checkout", "billing"],
    technicalAssetTaxonomy: ["storefront", "integration", "environment"],
    valueStreamTaxonomy: ["checkout", "retention", "expansion"],
    metricFamilies: ["gmv", "checkout_health", "adoption", "support"],
    riskCategories: ["revenue", "technical", "support"],
    engagementTypes: ["business_review", "renewal_review", "support_review"],
    recommendedConnectors: ["shopify", "stripe", "paddle", "zendesk", "google-analytics"],
    overlayEntityTypes: ["capability", "value_stream", "usage_dimension", "environment_health"],
    derivedSections: [...SUCCESS_SECTION_IDS],
  },
  collaboration_platform: {
    id: "collaboration_platform",
    label: "Collaboration Platform",
    description:
      "Communication and collaboration products with engagement and workspace health overlays.",
    capabilityTaxonomy: ["communication", "collaboration", "workspace_adoption"],
    technicalAssetTaxonomy: ["workspace", "channel", "service"],
    valueStreamTaxonomy: ["adoption", "governance", "expansion"],
    metricFamilies: ["engagement", "usage", "support", "health"],
    riskCategories: ["adoption", "support", "renewal"],
    engagementTypes: ["workspace_review", "qbr", "enablement"],
    recommendedConnectors: ["slack", "microsoft-teams", "gmail", "notion", "zoom"],
    overlayEntityTypes: ["capability", "value_stream", "usage_dimension", "technical_service"],
    derivedSections: [...SUCCESS_SECTION_IDS],
  },
};

export const SUCCESS_ENTITY_TYPE_ALIASES: Record<CSCanonicalEntityType, string[]> = {
  account: ["account", "account_master"],
  account_contact: ["account_contact", "contact"],
  internal_team_member: ["internal_team_member", "people_team"],
  account_team_assignment: ["account_team_assignment"],
  business_context: ["business_context"],
  strategic_objective: ["strategic_objective"],
  stakeholder_outcome: ["stakeholder_outcome", "stakeholder_outcomes"],
  engagement: ["engagement", "engagement_log", "meeting"],
  success_plan: ["success_plan", "success_plans"],
  initiative: ["initiative"],
  risk: ["risk", "risk_register"],
  task: ["task"],
  generated_insight: ["generated_insight", "insight"],
  platform_health_metric: [
    "platform_health_metric",
    "platform_health",
    "account_health",
    "account_metric",
  ],
  metrics_history: ["metrics_history"],
  external_integration: ["external_integration", "integration"],
  sync_log: ["sync_log"],
  capability: ["capability"],
  value_stream: ["value_stream", "value_streams"],
  technical_asset: ["technical_asset", "asset"],
  technical_service: ["technical_service", "service_health"],
  api_portfolio: ["api_portfolio"],
  environment_health: ["environment_health", "service_health", "platform_health"],
  usage_dimension: ["usage_dimension", "usage_event", "platform_usage"],
};

export const SUCCESS_EXPECTED_FIELDS: Record<CSCanonicalEntityType, string[]> = {
  account: [
    "account_name",
    "industry",
    "arr",
    "health_score",
    "renewal_date",
    "assigned_csm",
    "last_interaction_at",
    "status",
  ],
  account_contact: ["full_name", "email", "role_title", "stakeholder_type", "department"],
  internal_team_member: ["full_name", "email", "role", "department", "region"],
  account_team_assignment: ["account_id", "person_id", "assignment_role", "is_primary"],
  business_context: [
    "business_model",
    "market_position",
    "strategic_priorities",
    "digital_maturity",
  ],
  strategic_objective: ["objective_name", "status", "progress_percent", "target_date"],
  stakeholder_outcome: ["outcome_statement", "success_metric_name", "status", "target_value"],
  engagement: ["engagement_type", "engagement_date", "sentiment", "next_engagement_date"],
  success_plan: ["plan_status", "executive_summary", "next_qbr_date"],
  initiative: ["title", "status", "priority", "target_completion_date", "progress_percentage"],
  risk: ["title", "risk_level", "severity", "status", "mitigation_due_date"],
  task: ["task_name", "status", "priority", "due_date", "owner"],
  generated_insight: ["insight_text", "recommended_action", "status", "date_generated"],
  platform_health_metric: ["metric_name", "current_value", "health_status", "last_measured"],
  metrics_history: ["metric_date", "metric_value", "health_score_snapshot"],
  external_integration: ["system_name", "integration_type", "status", "last_sync_at"],
  sync_log: ["source_system", "target_system", "status", "started_at", "completed_at"],
  capability: ["capability_name", "capability_domain", "current_maturity", "priority"],
  value_stream: [
    "value_stream_name",
    "business_process",
    "total_business_value",
    "operational_risk_level",
  ],
  technical_asset: ["asset_name", "asset_type", "health_status", "owner_team"],
  technical_service: ["service_name", "service_tier", "health_status", "owner_team"],
  api_portfolio: [
    "api_name",
    "api_type",
    "monthly_transactions",
    "health_status",
    "uptime_percent",
  ],
  environment_health: ["environment_name", "health_status", "uptime_percent", "error_rate_percent"],
  usage_dimension: ["dimension_name", "current_value", "trend", "health_status"],
};

export const SUCCESS_FIELD_BINDINGS: FieldBindingRule[] = [
  {
    entityType: "account",
    field: "arr",
    factFamily: "account_commercial",
    precedence: ["billing", "contract", "crm", "manual"],
  },
  {
    entityType: "account",
    field: "renewal_date",
    factFamily: "renewals_expansion",
    precedence: ["billing", "contract", "crm", "manual"],
  },
  {
    entityType: "account",
    field: "assigned_csm",
    factFamily: "stakeholders_ownership",
    precedence: ["crm", "workspace", "manual"],
  },
  {
    entityType: "engagement",
    field: "last_interaction_at",
    factFamily: "engagements",
    precedence: ["calendar", "email", "meeting", "crm"],
  },
  {
    entityType: "platform_health_metric",
    field: "health_status",
    factFamily: "technical_health",
    precedence: ["telemetry", "product", "manual"],
  },
  {
    entityType: "risk",
    field: "risk_level",
    factFamily: "risks",
    precedence: ["support", "telemetry", "crm", "manual"],
  },
  {
    entityType: "generated_insight",
    field: "recommended_action",
    factFamily: "recommendations_proof",
    precedence: ["intelligence", "manual"],
  },
  {
    entityType: "external_integration",
    field: "status",
    factFamily: "integration_sync_health",
    precedence: ["sync", "connector", "manual"],
  },
];

const CONNECTOR_FACT_FAMILY_HINTS: Record<string, CSFactFamily[]> = {
  salesforce: ["account_commercial", "stakeholders_ownership", "renewals_expansion"],
  hubspot: ["account_commercial", "stakeholders_ownership", "engagements"],
  "zoho-crm": ["account_commercial", "stakeholders_ownership"],
  pipedrive: ["account_commercial", "renewals_expansion"],
  chargebee: ["account_commercial", "renewals_expansion", "integration_sync_health"],
  quickbooks: ["account_commercial", "renewals_expansion"],
  stripe: ["account_commercial", "renewals_expansion", "integration_sync_health"],
  zendesk: ["support_service", "risks", "integration_sync_health"],
  freshdesk: ["support_service", "risks"],
  front: ["support_service", "engagements", "integration_sync_health"],
  intercom: ["support_service", "engagements"],
  helpscout: ["support_service", "engagements"],
  kustomer: ["support_service", "engagements", "risks"],
  "whatsapp-business": ["engagements", "support_service"],
  slack: ["engagements", "recommendations_proof"],
  "microsoft-teams": ["engagements", "recommendations_proof"],
  gmail: ["engagements", "stakeholders_ownership"],
  google_calendar: ["engagements"],
  notion: ["initiatives_tasks", "recommendations_proof"],
  asana: ["initiatives_tasks"],
  monday: ["initiatives_tasks"],
  airtable: ["initiatives_tasks"],
  github: ["technical_health", "product_capabilities"],
  gitlab: ["technical_health", "product_capabilities"],
  jira: ["technical_health", "risks", "initiatives_tasks"],
  linear: ["technical_health", "initiatives_tasks"],
  datadog: ["technical_health", "usage_adoption"],
  splunk: ["technical_health", "risks"],
  mixpanel: ["usage_adoption"],
  amplitude: ["usage_adoption"],
  heap: ["usage_adoption"],
  "google-analytics": ["usage_adoption"],
  tableau: ["usage_adoption", "product_capabilities"],
  metabase: ["usage_adoption", "product_capabilities"],
  shopify: ["account_commercial", "usage_adoption"],
  paddle: ["account_commercial", "renewals_expansion"],
  zoom: ["engagements"],
  dropbox: ["product_capabilities"],
};

const PROFILE_HINTS: Record<
  ProductProfileId,
  {
    industryHints: string[];
    connectorHints: string[];
    technical: boolean;
  }
> = {
  generic_b2b_saas: { industryHints: [], connectorHints: [], technical: false },
  integration_platform: {
    industryHints: ["integration", "api", "middleware", "ipaas"],
    connectorHints: ["mulesoft", "postman", "kong", "apigee", "boomi", "workato"],
    technical: true,
  },
  developer_platform: {
    industryHints: ["developer", "engineering", "devops", "platform"],
    connectorHints: ["github", "gitlab", "jira", "linear", "circleci", "datadog"],
    technical: true,
  },
  analytics_platform: {
    industryHints: ["analytics", "data", "bi", "measurement"],
    connectorHints: ["mixpanel", "amplitude", "heap", "google-analytics", "tableau", "metabase"],
    technical: true,
  },
  security_platform: {
    industryHints: ["security", "compliance", "identity"],
    connectorHints: ["okta", "splunk", "crowdstrike", "snyk", "wiz"],
    technical: true,
  },
  workflow_automation: {
    industryHints: ["workflow", "automation", "operations"],
    connectorHints: ["asana", "monday", "airtable", "zapier", "make", "notion"],
    technical: false,
  },
  commerce_saas: {
    industryHints: ["commerce", "retail", "ecommerce"],
    connectorHints: ["shopify", "woocommerce", "bigcommerce", "stripe", "paddle"],
    technical: false,
  },
  collaboration_platform: {
    industryHints: ["collaboration", "communication", "productivity"],
    connectorHints: ["slack", "microsoft-teams", "gmail", "zoom", "notion"],
    technical: false,
  },
};

const SECTION_DEFINITIONS: Record<
  CSSectionId,
  {
    requiredEntityTypes: CSCanonicalEntityType[];
    factFamilies: CSFactFamily[];
    preferredLens: "shared" | RoleLens;
  }
> = {
  accounts_overview: {
    requiredEntityTypes: ["account"],
    factFamilies: ["account_commercial", "renewals_expansion"],
    preferredLens: "shared",
  },
  account_detail: {
    requiredEntityTypes: ["account", "engagement", "risk"],
    factFamilies: ["account_commercial", "engagements", "risks"],
    preferredLens: "shared",
  },
  contacts_stakeholders: {
    requiredEntityTypes: ["account_contact", "internal_team_member"],
    factFamilies: ["stakeholders_ownership"],
    preferredLens: "shared",
  },
  tasks_actions: {
    requiredEntityTypes: ["task", "initiative"],
    factFamilies: ["initiatives_tasks"],
    preferredLens: "shared",
  },
  risks: {
    requiredEntityTypes: ["risk"],
    factFamilies: ["risks"],
    preferredLens: "shared",
  },
  renewals: {
    requiredEntityTypes: ["account", "success_plan"],
    factFamilies: ["renewals_expansion"],
    preferredLens: "account_success",
  },
  usage_adoption: {
    requiredEntityTypes: ["platform_health_metric", "usage_dimension"],
    factFamilies: ["usage_adoption", "technical_health"],
    preferredLens: "shared",
  },
  support_cases: {
    requiredEntityTypes: ["risk", "engagement"],
    factFamilies: ["support_service"],
    preferredLens: "account_success",
  },
  success_plans: {
    requiredEntityTypes: ["success_plan", "strategic_objective", "initiative"],
    factFamilies: ["initiatives_tasks", "renewals_expansion"],
    preferredLens: "account_success",
  },
  ai_insights: {
    requiredEntityTypes: ["generated_insight"],
    factFamilies: ["recommendations_proof"],
    preferredLens: "shared",
  },
  integrations_sync_health: {
    requiredEntityTypes: ["external_integration", "sync_log"],
    factFamilies: ["integration_sync_health"],
    preferredLens: "shared",
  },
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function unique<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items));
}

export function getSuccessEntityAliases(entityType: CSCanonicalEntityType): string[] {
  return unique([entityType, ...(SUCCESS_ENTITY_TYPE_ALIASES[entityType] || [])]);
}

export function resolveProductProfile(params: {
  industry?: string | null;
  connectedConnectors?: string[];
}): ProductProfileId {
  const industry = normalizeToken(params.industry || "");
  const connectors = (params.connectedConnectors || []).map(normalizeToken);
  let best: ProductProfileId = "generic_b2b_saas";
  let bestScore = 0;

  for (const [profileId, hints] of Object.entries(PROFILE_HINTS) as Array<
    [ProductProfileId, (typeof PROFILE_HINTS)[ProductProfileId]]
  >) {
    let score = 0;
    if (industry) {
      for (const hint of hints.industryHints) {
        if (industry.includes(hint)) score += 3;
      }
    }
    for (const connector of connectors) {
      if (hints.connectorHints.includes(connector)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = profileId;
    }
  }

  return best;
}

export function resolveRoleLens(params: {
  domains?: string[];
  activeCtx?: string | null;
  connectedConnectors?: string[];
  requestedLens?: RoleLens;
  productProfileId: ProductProfileId;
}): RoleLens {
  if (params.requestedLens) return params.requestedLens;

  const activeCtx = normalizeToken(params.activeCtx || "");
  const domains = (params.domains || []).map((domain) => normalizeToken(domain));
  const connectors = (params.connectedConnectors || []).map(normalizeToken);

  if (
    activeCtx.includes("tam") ||
    activeCtx.includes("tech") ||
    activeCtx.includes("engineering")
  ) {
    return "tam";
  }
  if (
    domains.some((domain) =>
      ["product_engineering", "engineering", "service", "support"].includes(domain)
    )
  ) {
    return "tam";
  }
  if (PROFILE_HINTS[params.productProfileId]?.technical) {
    if (
      connectors.some((connector) =>
        ["github", "gitlab", "jira", "linear", "datadog", "splunk"].includes(connector)
      )
    ) {
      return "tam";
    }
  }
  return "account_success";
}

export function deriveConnectorCapabilityCoverage(
  connectedConnectors: string[]
): Record<CSFactFamily, string[]> {
  const coverage = Object.fromEntries(
    [
      "account_commercial",
      "stakeholders_ownership",
      "engagements",
      "usage_adoption",
      "technical_health",
      "support_service",
      "risks",
      "initiatives_tasks",
      "renewals_expansion",
      "recommendations_proof",
      "integration_sync_health",
      "product_capabilities",
    ].map((family) => [family, [] as string[]])
  ) as Record<CSFactFamily, string[]>;

  for (const connectorId of connectedConnectors) {
    const normalized = normalizeToken(connectorId);
    for (const family of CONNECTOR_FACT_FAMILY_HINTS[normalized] || []) {
      coverage[family] = unique([...coverage[family], normalized]);
    }
  }

  return coverage;
}

function mergeAllowedFields(
  currentFieldsByEntity: Record<string, string[]>,
  allowedEntityTypes: string[]
): Record<string, string[]> {
  const next = new Map<string, Set<string>>();

  for (const [entityType, fields] of Object.entries(currentFieldsByEntity)) {
    if (!next.has(entityType)) next.set(entityType, new Set());
    for (const field of fields) next.get(entityType)!.add(field);
  }

  for (const entityType of allowedEntityTypes) {
    const canonical = (Object.keys(SUCCESS_ENTITY_TYPE_ALIASES) as CSCanonicalEntityType[]).find(
      (candidate) => getSuccessEntityAliases(candidate).includes(entityType)
    );
    if (!canonical) continue;
    if (!next.has(entityType)) next.set(entityType, new Set());
    for (const field of SUCCESS_EXPECTED_FIELDS[canonical] || []) {
      next.get(entityType)!.add(field);
    }
  }

  return Object.fromEntries(
    Array.from(next.entries()).map(([entityType, fieldSet]) => [
      entityType,
      Array.from(fieldSet).sort(),
    ])
  );
}

function deriveSectionAvailability(params: {
  allowedEntityTypes: string[];
  connectorCapabilityCoverage: Record<CSFactFamily, string[]>;
  activeRoleLens: RoleLens;
}): Record<CSSectionId, SuccessSectionAvailability> {
  const allowed = new Set(params.allowedEntityTypes.map(normalizeToken));
  return Object.fromEntries(
    (
      Object.entries(SECTION_DEFINITIONS) as Array<
        [CSSectionId, (typeof SECTION_DEFINITIONS)[CSSectionId]]
      >
    ).map(([sectionId, definition]) => {
      const matchedEntityTypes = definition.requiredEntityTypes.flatMap((entityType) =>
        getSuccessEntityAliases(entityType).filter((alias) => allowed.has(normalizeToken(alias)))
      );
      const matchedFactFamilies = definition.factFamilies.filter(
        (family) => params.connectorCapabilityCoverage[family]?.length > 0
      );
      const lensAllowed =
        definition.preferredLens === "shared" || definition.preferredLens === params.activeRoleLens;
      return [
        sectionId,
        {
          enabled: lensAllowed && (matchedEntityTypes.length > 0 || matchedFactFamilies.length > 0),
          preferredLens: definition.preferredLens,
          matchedEntityTypes: unique(matchedEntityTypes),
          matchedFactFamilies,
        },
      ];
    })
  ) as Record<CSSectionId, SuccessSectionAvailability>;
}

export function resolveSuccessSchema(params: {
  domains?: string[];
  industry?: string | null;
  activeCtx?: string | null;
  connectedConnectors?: string[];
  allowedEntityTypes?: string[];
  fieldsByEntity?: Record<string, string[]>;
  requestedLens?: RoleLens;
}): ResolvedSuccessSchema {
  const productProfileId = resolveProductProfile({
    industry: params.industry,
    connectedConnectors: params.connectedConnectors || [],
  });
  const activeRoleLens = resolveRoleLens({
    domains: params.domains || [],
    activeCtx: params.activeCtx,
    connectedConnectors: params.connectedConnectors || [],
    requestedLens: params.requestedLens,
    productProfileId,
  });
  const productProfile = PRODUCT_PROFILES[productProfileId];
  const baseAllowed = new Set<string>(
    (params.allowedEntityTypes || []).map((value) => value.trim()).filter(Boolean)
  );

  for (const overlayEntityType of productProfile.overlayEntityTypes) {
    for (const alias of getSuccessEntityAliases(overlayEntityType)) {
      baseAllowed.add(alias);
    }
  }

  if (
    (params.domains || []).some((domain) => normalizeToken(domain).includes("customer_success"))
  ) {
    for (const coreType of SUCCESS_CORE_ENTITY_TYPES) {
      for (const alias of getSuccessEntityAliases(coreType)) {
        baseAllowed.add(alias);
      }
    }
  }

  const allowedEntityTypes = Array.from(baseAllowed).sort();
  const connectorCapabilityCoverage = deriveConnectorCapabilityCoverage(
    params.connectedConnectors || []
  );
  const allowedFieldsByEntity = mergeAllowedFields(params.fieldsByEntity || {}, allowedEntityTypes);
  const derivedSectionAvailability = deriveSectionAvailability({
    allowedEntityTypes,
    connectorCapabilityCoverage,
    activeRoleLens,
  });

  return {
    allowedEntityTypes,
    allowedFieldsByEntity,
    activeRoleLens,
    activeProductProfile: productProfileId,
    derivedSectionAvailability,
    connectorCapabilityCoverage,
    fieldBindings: SUCCESS_FIELD_BINDINGS,
  };
}
