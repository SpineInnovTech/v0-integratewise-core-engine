/**
 * IntegrateWise - Flow Classifier
 *
 * Determines WHICH flow (A, B, or C) a connector should follow
 * based on connector type, data characteristics, and tenant schema.
 *
 * Classification happens at INITIAL CONNECTION (OAuth callback)
 * and is stored in connector metadata for the lifetime of the connection.
 */

// =============================================================================
// FLOW TYPE DEFINITIONS
// =============================================================================

export type FlowType = "A" | "B" | "C";

export interface FlowCharacteristics {
  flowType: FlowType;
  name: string;
  description: string;
  // Data characteristics
  dataStructure: "structured" | "unstructured" | "ai_generated";
  // Pipeline behavior
  usesPipeline: boolean;
  spineWriteMode: "direct" | "refs_only" | "none";
  knowledgeWriteMode: "none" | "chunks" | "compounding";
  usesTriage: boolean;
  // Entry point
  entryPoint: "loader" | "d1_buffer";
  // Governance
  requiresApproval: boolean;
}

const FLOW_CHARACTERISTICS: Record<FlowType, FlowCharacteristics> = {
  A: {
    flowType: "A",
    name: "Structured Data Flow",
    description: "CRM, Support, Billing - direct truth to Spine",
    dataStructure: "structured",
    usesPipeline: true,
    spineWriteMode: "direct",
    knowledgeWriteMode: "none",
    usesTriage: false,
    entryPoint: "loader",
    requiresApproval: false,
  },
  B: {
    flowType: "B",
    name: "Unstructured Context Flow",
    description: "Email, Docs, Chat - dual write to Spine refs + Knowledge chunks",
    dataStructure: "unstructured",
    usesPipeline: true,
    spineWriteMode: "refs_only",
    knowledgeWriteMode: "chunks",
    usesTriage: false,
    entryPoint: "loader",
    requiresApproval: false,
  },
  C: {
    flowType: "C",
    name: "AI Knowledge Flow",
    description: "AI chat, MCP - triage to Knowledge UI, NEVER direct to Spine",
    dataStructure: "ai_generated",
    usesPipeline: false,
    spineWriteMode: "none",
    knowledgeWriteMode: "compounding",
    usesTriage: true,
    entryPoint: "d1_buffer",
    requiresApproval: true,
  },
};

// =============================================================================
// CONNECTOR CLASSIFICATION REGISTRY
// =============================================================================

export type ConnectorCategory =
  | "crm"
  | "support"
  | "billing"
  | "analytics"
  | "communication"
  | "productivity"
  | "project_management"
  | "ai"
  | "custom";

export interface ConnectorClassification {
  provider: string;
  category: ConnectorCategory;
  defaultFlow: FlowType;
  // Can be overridden by tenant config
  allowsFlowOverride: boolean;
  // Entity types this connector typically produces
  entityTypes: string[];
  // Whether it produces files/attachments
  producesFiles: boolean;
  // Whether it supports real-time webhooks
  supportsWebhooks: boolean;
  // Data velocity
  dataVelocity: "batch" | "realtime" | "mixed";
}

export const CONNECTOR_CLASSIFICATION_REGISTRY: Record<string, ConnectorClassification> = {
  // FLOW A: Structured (CRM, Support, Billing)
  salesforce: {
    provider: "salesforce",
    category: "crm",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["account", "contact", "opportunity", "lead", "case"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "mixed",
  },
  hubspot: {
    provider: "hubspot",
    category: "crm",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["account", "contact", "deal", "ticket"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "mixed",
  },
  "zoho-crm": {
    provider: "zoho-crm",
    category: "crm",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["account", "contact", "deal", "lead"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "batch",
  },
  zendesk: {
    provider: "zendesk",
    category: "support",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["ticket", "contact", "account", "organization"],
    producesFiles: true,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  freshdesk: {
    provider: "freshdesk",
    category: "support",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["ticket", "contact", "account"],
    producesFiles: true,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  front: {
    provider: "front",
    category: "support",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["ticket", "contact", "conversation"],
    producesFiles: true,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  helpscout: {
    provider: "helpscout",
    category: "support",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["ticket", "contact", "customer"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  kustomer: {
    provider: "kustomer",
    category: "support",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["ticket", "contact", "conversation", "customer"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  intercom: {
    provider: "intercom",
    category: "support",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["contact", "conversation", "company"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  stripe: {
    provider: "stripe",
    category: "billing",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["account", "subscription", "invoice", "payment"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  tableau: {
    provider: "tableau",
    category: "analytics",
    defaultFlow: "A",
    allowsFlowOverride: false,
    entityTypes: ["platform_health_metric", "value_stream"],
    producesFiles: false,
    supportsWebhooks: false,
    dataVelocity: "batch",
  },

  // FLOW B: Unstructured (Communication, Productivity)
  gmail: {
    provider: "gmail",
    category: "communication",
    defaultFlow: "B",
    allowsFlowOverride: false,
    entityTypes: ["interaction_event", "contact"],
    producesFiles: true,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  outlook: {
    provider: "outlook",
    category: "communication",
    defaultFlow: "B",
    allowsFlowOverride: false,
    entityTypes: ["interaction_event", "contact", "event"],
    producesFiles: true,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  slack: {
    provider: "slack",
    category: "communication",
    defaultFlow: "B",
    allowsFlowOverride: false,
    entityTypes: ["interaction_event", "audience", "file"],
    producesFiles: true,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  "microsoft-teams": {
    provider: "microsoft-teams",
    category: "communication",
    defaultFlow: "B",
    allowsFlowOverride: false,
    entityTypes: ["interaction_event", "file"],
    producesFiles: true,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  notion: {
    provider: "notion",
    category: "productivity",
    defaultFlow: "B",
    allowsFlowOverride: false,
    entityTypes: ["file", "task", "project"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  "google-drive": {
    provider: "google-drive",
    category: "productivity",
    defaultFlow: "B",
    allowsFlowOverride: false,
    entityTypes: ["file"],
    producesFiles: true,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  dropbox: {
    provider: "dropbox",
    category: "productivity",
    defaultFlow: "B",
    allowsFlowOverride: false,
    entityTypes: ["file"],
    producesFiles: true,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  airtable: {
    provider: "airtable",
    category: "productivity",
    defaultFlow: "B",
    allowsFlowOverride: false,
    entityTypes: ["file", "record"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "batch",
  },

  // FLOW C: AI/Knowledge (Custom connectors, MCP)
  "ai-chat": {
    provider: "ai-chat",
    category: "ai",
    defaultFlow: "C",
    allowsFlowOverride: false,
    entityTypes: ["session", "insight"],
    producesFiles: false,
    supportsWebhooks: false,
    dataVelocity: "realtime",
  },
  mcp: {
    provider: "mcp",
    category: "ai",
    defaultFlow: "C",
    allowsFlowOverride: false,
    entityTypes: ["session", "tool_invocation"],
    producesFiles: false,
    supportsWebhooks: false,
    dataVelocity: "realtime",
  },
  "custom-ai": {
    provider: "custom-ai",
    category: "ai",
    defaultFlow: "C",
    allowsFlowOverride: false,
    entityTypes: ["session"],
    producesFiles: false,
    supportsWebhooks: true,
    dataVelocity: "realtime",
  },
  "knowledge-connector": {
    provider: "knowledge-connector",
    category: "ai",
    defaultFlow: "C",
    allowsFlowOverride: false,
    entityTypes: ["document"],
    producesFiles: false,
    supportsWebhooks: false,
    dataVelocity: "batch",
  },
};

// =============================================================================
// FLOW CLASSIFIER FUNCTION
// =============================================================================

export interface ClassifyConnectorInput {
  provider: string;
  tenantId: string;
  tenantDomains: string[];
  // Optional override (rarely used)
  requestedFlow?: FlowType;
}

export interface ClassifyConnectorResult {
  provider: string;
  flowType: FlowType;
  classification: ConnectorClassification;
  characteristics: FlowCharacteristics;
  // Routing information
  routing: {
    entryService: string;
    entryEndpoint: string;
    queueName: string;
    usesPipeline: boolean;
    usesTriage: boolean;
  };
  // Schema mapping
  schemaMapping: {
    sourceEntityTypes: string[];
    targetSpineEntityTypes: string[];
    knowledgeEnabled: boolean;
  };
  // Validation
  valid: boolean;
  error?: string;
}

/**
 * Classify a connector to determine its Flow (A, B, or C)
 * Called at OAuth callback time - determines routing for the lifetime of the connection
 *
 * This is the FULL classification function with detailed input/output
 */
function classifyConnectorFull(input: ClassifyConnectorInput): ClassifyConnectorResult {
  const { provider, tenantDomains, requestedFlow } = input;

  // 1. Lookup connector classification
  const classification = CONNECTOR_CLASSIFICATION_REGISTRY[provider.toLowerCase()];

  if (!classification) {
    return {
      provider,
      flowType: "A", // Default to Flow A for unknown connectors
      classification: {
        provider,
        category: "custom",
        defaultFlow: "A",
        allowsFlowOverride: true,
        entityTypes: ["unknown"],
        producesFiles: false,
        supportsWebhooks: false,
        dataVelocity: "batch",
      },
      characteristics: FLOW_CHARACTERISTICS["A"],
      routing: getRoutingForFlow("A"),
      schemaMapping: {
        sourceEntityTypes: [],
        targetSpineEntityTypes: [],
        knowledgeEnabled: false,
      },
      valid: false,
      error: `Unknown connector provider: ${provider}. Using default Flow A.`,
    };
  }

  // 2. Determine flow type
  let flowType: FlowType = classification.defaultFlow;

  // Check for override request (if allowed)
  if (requestedFlow && classification.allowsFlowOverride) {
    flowType = requestedFlow;
  }

  // Special case: Some connectors may behave differently based on tenant domain
  // Example: Slack for Support team → Flow A (tickets), for CS team → Flow B (context)
  if (provider === "slack") {
    if (tenantDomains.includes("SUPPORT") || tenantDomains.includes("SERVICE")) {
      // Support teams may want Slack messages as tickets (Flow A)
      // This is an example - actual logic depends on product requirements
      // flowType = "A";
    }
  }

  // 3. Get flow characteristics
  const characteristics = FLOW_CHARACTERISTICS[flowType];

  // 4. Build routing info
  const routing = getRoutingForFlow(flowType);

  // 5. Build schema mapping
  const schemaMapping = buildSchemaMapping(classification, flowType);

  return {
    provider,
    flowType,
    classification,
    characteristics,
    routing,
    schemaMapping,
    valid: true,
  };
}

function getRoutingForFlow(flowType: FlowType): ClassifyConnectorResult["routing"] {
  switch (flowType) {
    case "A":
      return {
        entryService: "loader",
        entryEndpoint: "/api/v1/sync/trigger",
        queueName: "pipeline.queue",
        usesPipeline: true,
        usesTriage: false,
      };
    case "B":
      return {
        entryService: "loader",
        entryEndpoint: "/api/v1/sync/trigger",
        queueName: "pipeline.queue",
        usesPipeline: true,
        usesTriage: false,
      };
    case "C":
      return {
        entryService: "knowledge",
        entryEndpoint: "/v1/triage/ingest",
        queueName: "triage.queue",
        usesPipeline: false,
        usesTriage: true,
      };
    default:
      return {
        entryService: "loader",
        entryEndpoint: "/api/v1/sync/trigger",
        queueName: "pipeline.queue",
        usesPipeline: true,
        usesTriage: false,
      };
  }
}

function buildSchemaMapping(
  classification: ConnectorClassification,
  flowType: FlowType
): ClassifyConnectorResult["schemaMapping"] {
  const sourceEntityTypes = classification.entityTypes;

  // Map source entity types to Spine entity types
  const targetSpineEntityTypes = sourceEntityTypes.map((entity) => {
    // Normalization mapping
    const mapping: Record<string, string> = {
      customer: "contact",
      company: "account",
      organization: "account",
      case: "ticket",
      conversation: "engagement",
      lead: "contact",
    };
    return mapping[entity] || entity;
  });

  return {
    sourceEntityTypes,
    targetSpineEntityTypes: [...new Set(targetSpineEntityTypes)], // Deduplicate
    knowledgeEnabled: flowType === "B" || flowType === "C",
  };
}

// =============================================================================
// STORED CLASSIFICATION (per connector instance)
// =============================================================================

export interface StoredFlowClassification {
  // Static - set at connection time
  connectorId: string;
  provider: string;
  tenantId: string;
  flowType: FlowType;
  classifiedAt: string;
  classifiedBy: string; // system or user

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

  // Can be changed later (rare)
  reclassifiable: boolean;
}

/**
 * Create stored classification record
 * This is saved to database at OAuth callback time
 */
function createStoredClassification(
  connectorId: string,
  tenantId: string,
  classification: ClassifyConnectorResult
): StoredFlowClassification {
  return {
    connectorId,
    provider: classification.provider,
    tenantId,
    flowType: classification.flowType,
    classifiedAt: new Date().toISOString(),
    classifiedBy: "system",
    entryService: classification.routing.entryService,
    entryEndpoint: classification.routing.entryEndpoint,
    queueName: classification.routing.queueName,
    usesPipeline: classification.routing.usesPipeline,
    usesTriage: classification.routing.usesTriage,
    sourceEntityTypes: classification.schemaMapping.sourceEntityTypes,
    targetSpineEntityTypes: classification.schemaMapping.targetSpineEntityTypes,
    knowledgeEnabled: classification.schemaMapping.knowledgeEnabled,
    reclassifiable: classification.classification.allowsFlowOverride,
  };
}

// =============================================================================
// FLOW ROUTING AT RUNTIME
// =============================================================================

export interface FlowRoutingDecision {
  connectorId: string;
  flowType: FlowType;
  // Where to send the data
  destination: {
    service: string;
    endpoint: string;
    method: "POST" | "PUT" | "GET";
  };
  // How to process
  processing: {
    usePipeline: boolean;
    useNormalizer: boolean;
    useTriage: boolean;
    useKnowledgeQueue: boolean;
  };
  // Schema enforcement
  schema: {
    allowedEntityTypes: string[];
    spineWriteEnabled: boolean;
    knowledgeWriteEnabled: boolean;
  };
}

/**
 * Get routing decision for a connector at runtime
 * Uses the stored classification from connection time
 */
function getFlowRouting(
  connectorId: string,
  storedClassification: StoredFlowClassification
): FlowRoutingDecision {
  const { flowType, entryService, entryEndpoint } = storedClassification;

  return {
    connectorId,
    flowType,
    destination: {
      service: entryService,
      endpoint: entryEndpoint,
      method: "POST",
    },
    processing: {
      usePipeline: storedClassification.usesPipeline,
      useNormalizer: storedClassification.usesPipeline,
      useTriage: storedClassification.usesTriage,
      useKnowledgeQueue: storedClassification.knowledgeEnabled,
    },
    schema: {
      allowedEntityTypes: storedClassification.targetSpineEntityTypes,
      spineWriteEnabled: flowType === "A" || flowType === "B",
      knowledgeWriteEnabled: storedClassification.knowledgeEnabled,
    },
  };
}

// =============================================================================
// SIMPLIFIED CLASSIFIER (for direct provider lookup)
// =============================================================================

export interface SimpleFlowClassification {
  provider: string;
  flowType: FlowType;
  category: string;
  routing: {
    entryService: "loader" | "d1_buffer" | "knowledge";
    usesPipeline: boolean;
    usesTriage: boolean;
  };
}

/**
 * Simple classifier - just takes provider name and returns flow type
 * Used in OAuth callback for quick classification
 */

/**
 * Get human-readable description for flow type
 */
export function getFlowTypeDescription(flowType: FlowType): string {
  return FLOW_CHARACTERISTICS[flowType]?.description || "Unknown flow type";
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Classification registry
  CONNECTOR_CLASSIFICATION_REGISTRY as FLOW_CLASSIFIER_REGISTRY,

  // Full classification function (with detailed input/output)
  classifyConnectorFull,

  // Stored classification helpers
  createStoredClassification,
  getFlowRouting,

  // Flow characteristics
  FLOW_CHARACTERISTICS,
};
