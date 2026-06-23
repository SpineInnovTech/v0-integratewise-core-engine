/**
 * IntegrateWise - Wiring Constants
 *
 * Constant: The flow sequence (never changes)
 * Variable: The schema (differs by dept/industry)
 *
 * Principle: Same wiring, different schemas
 */

// =============================================================================
// CONSTANT: Data Flow Stages (Universal for all connectors/flows)
// =============================================================================

export const FLOW_STAGES = [
  "oauth", // 0. OAuth / Auth binding
  "loader", // 1. Load from connector
  "pipeline", // 2. 8-stage pipeline
  "spine", // 3. Write to Spine
  "entity360", // 4. Build Entity 360 view
  "think", // 5. AI reasoning
  "govern", // 6. Policy check
  "hitl", // 7. Human approval
  "act", // 8. Execute action
] as const;

export type FlowStage = (typeof FLOW_STAGES)[number];

// =============================================================================
// CONSTANT: Service Routing Table (where each stage routes to)
// =============================================================================

export const STAGE_ROUTING: Record<
  FlowStage,
  { service: string; endpoint: string; method: string }
> = {
  oauth: { service: "tenants", endpoint: "/v1/connectors/:provider/callback", method: "GET" },
  loader: { service: "loader", endpoint: "/api/v1/sync/trigger", method: "POST" },
  pipeline: { service: "normalizer", endpoint: "/queue/pipeline", method: "POST" },
  spine: { service: "spine-v2", endpoint: "/v1/spine/:entity_type", method: "POST" },
  entity360: { service: "workflow", endpoint: "/v1/views/account-360", method: "GET" },
  think: { service: "intelligence", endpoint: "/v1/think/analyze", method: "POST" },
  govern: { service: "intelligence", endpoint: "/v1/govern/evaluate", method: "POST" },
  hitl: { service: "workflow", endpoint: "/v1/hitl/queue", method: "GET" },
  act: { service: "intelligence", endpoint: "/v1/act/execute", method: "POST" },
};

// =============================================================================
// CONSTANT: Flow Type Routing (A, B, C follow different paths)
// =============================================================================

export const FLOW_TYPE_ROUTING = {
  // Flow A: Structured → Pipeline → Spine only
  A: {
    stages: ["oauth", "loader", "pipeline", "spine", "entity360", "think", "govern", "hitl", "act"],
    outputs: { spine: true, knowledge: false, triage: false },
  },
  // Flow B: Unstructured → Pipeline → Spine refs + Knowledge chunks
  B: {
    stages: ["oauth", "loader", "pipeline", "spine", "entity360", "think", "govern", "hitl", "act"],
    outputs: { spine: "refs", knowledge: true, triage: false },
  },
  // Flow C: AI/MCP → D1 → Triage → Knowledge UI (NEVER direct to Spine)
  C: {
    stages: ["oauth", "d1", "triage", "knowledge-ui", "think", "govern", "hitl", "act"],
    outputs: { spine: false, knowledge: "compounding", triage: true },
  },
};

// =============================================================================
// VARIABLE: Schema Configuration (per Department/Industry)
// =============================================================================

/**
 * TenantSchemaConfig — TypeScript projection of `tenant_spine_config` table (SSOT).
 *
 * Post-migration 079: `tenant_spine_config` is the single source of truth for
 * tenant schema. The old `tenant_schema_configs` table was never created in
 * production and all references are converged here.
 */
export interface TenantSchemaConfig {
  tenantId: string;
  domains: string[]; // ["SALES", "SERVICE", "CUSTOMER_SUCCESS"]
  industry?: string; // "SaaS", "Retail", etc.
  allowedEntityTypes: string[]; // Materialized from domains + industry
  connectorConfigs: Record<string, ConnectorProviderConfig>; // Per-connector settings
  fieldBindings: FieldBinding[];
}

export interface ConnectorProviderConfig {
  entityTypes: string[];
  flowType: "A" | "B" | "C";
  enabled: boolean;
}

export interface FieldBinding {
  entityType: string;
  field: string;
  factFamily: string;
  precedence: string[]; // ["billing", "crm", "manual"]
}

// =============================================================================
// VARIABLE: Connector-to-Fact-Family Mapping (MuleSoft Classifier)
// =============================================================================

export const CONNECTOR_FACT_FAMILY_MAP: Record<string, string[]> = {
  // CS/Support Connectors
  "zoho-crm": ["account_commercial", "stakeholders_ownership"],
  zendesk: ["support_service", "risks", "integration_sync_health"],
  freshdesk: ["support_service", "risks"],
  front: ["support_service", "engagements", "integration_sync_health"],
  helpscout: ["support_service", "engagements"],
  kustomer: ["support_service", "engagements", "risks"],
  intercom: ["support_service", "engagements"],
  "whatsapp-business": ["engagements", "support_service"],
  tableau: ["usage_adoption", "product_capabilities"],

  // Mail/Context Connectors (Flow B)
  gmail: ["engagements", "stakeholders_ownership"],
  outlook: ["engagements", "stakeholders_ownership"],
  slack: ["engagements", "recommendations_proof"],
  "microsoft-teams": ["engagements", "recommendations_proof"],
  notion: ["initiatives_tasks", "recommendations_proof"],

  // CRM Connectors
  salesforce: ["account_commercial", "stakeholders_ownership", "renewals_expansion"],
  hubspot: ["account_commercial", "stakeholders_ownership", "engagements"],
};

// =============================================================================
// FLOW CLASSIFICATION (Determines A, B, or C at connection time)
// =============================================================================

export interface FlowClassification {
  flowType: "A" | "B" | "C";
  classifiedAt: string;
  classifiedBy: "system" | "user";
  // Routing config (derived from classification)
  entryService: string;
  entryEndpoint: string;
  queueName: string;
  usesPipeline: boolean;
  usesTriage: boolean;
  // Schema mapping
  sourceEntityTypes: string[];
  targetSpineEntityTypes: string[];
  knowledgeEnabled: boolean;
}

// =============================================================================
// WIRING EXECUTOR: Use Constants + Variables + Classification
// =============================================================================

export interface FlowExecutionInput {
  flowType: "A" | "B" | "C";
  schemaConfig: TenantSchemaConfig;
  classification: FlowClassification;
  connectorId: string;
  provider: string;
}

export function getFlowSequence(input: FlowExecutionInput): {
  stage: FlowStage;
  routing: (typeof STAGE_ROUTING)[FlowStage];
  schema: TenantSchemaConfig;
  classification: FlowClassification;
}[] {
  const { flowType, schemaConfig, classification } = input;
  const flowRouting = FLOW_TYPE_ROUTING[flowType];

  return flowRouting.stages
    .filter((stage): stage is FlowStage => stage in STAGE_ROUTING)
    .map((stage) => ({
      stage,
      routing: STAGE_ROUTING[stage],
      schema: schemaConfig, // Variable injected at each stage
      classification, // Flow classification (A/B/C routing)
    }));
}

// =============================================================================
// CONNECTOR TO FLOW MAPPING (The Classifier)
// =============================================================================

export const CONNECTOR_TO_FLOW_MAP: Record<string, "A" | "B" | "C"> = {
  // FLOW A: Structured (CRM, Support, Billing)
  salesforce: "A",
  hubspot: "A",
  "zoho-crm": "A",
  zendesk: "A",
  freshdesk: "A",
  front: "A",
  helpscout: "A",
  kustomer: "A",
  intercom: "A",
  stripe: "A",
  tableau: "A",

  // FLOW B: Unstructured (Communication, Productivity)
  gmail: "B",
  outlook: "B",
  slack: "B",
  "microsoft-teams": "B",
  notion: "B",
  "google-drive": "B",
  dropbox: "B",
  airtable: "B",

  // FLOW C: AI/Knowledge
  "ai-chat": "C",
  mcp: "C",
  "custom-ai": "C",
  "knowledge-connector": "C",
};

export function classifyConnectorFlow(provider: string): "A" | "B" | "C" {
  return CONNECTOR_TO_FLOW_MAP[provider.toLowerCase()] || "A";
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

/*
// 1. User completes OAuth for Zendesk
const provider = "zendesk";

// 2. Classify at connection time
const flowType = classifyConnectorFlow(provider); // "A"

// 3. Get classification details
const classification: FlowClassification = {
  flowType: "A",
  classifiedAt: new Date().toISOString(),
  classifiedBy: "system",
  entryService: "loader",
  entryEndpoint: "/api/v1/sync/trigger",
  queueName: "pipeline.queue",
  usesPipeline: true,
  usesTriage: false,
  sourceEntityTypes: ["ticket", "contact", "account"],
  targetSpineEntityTypes: ["ticket", "contact", "account"],
  knowledgeEnabled: false,
};

// 4. Get flow sequence with classification
const sequence = getFlowSequence({
  flowType: "A",
  schemaConfig: {
    tenantId: "t_123",
    domains: ["CUSTOMER_SUCCESS"],
    industry: "SaaS",
    allowedEntityTypes: ["account", "contact", "ticket"],
    fieldBindings: [...],
  },
  classification,
  connectorId: "conn_xxx",
  provider: "zendesk",
});

// 5. Execute with routing
for (const { stage, routing, schema, classification } of sequence) {
  await executeStage(stage, routing, schema, classification);
}

// FLOW A: OAuth → Loader → Pipeline → Spine → Entity 360
// FLOW B: OAuth → Loader → Pipeline → Spine (refs) + Knowledge → Entity 360
// FLOW C: OAuth → D1 Buffer → Triage → Knowledge UI (NEVER direct to Spine)
*/
