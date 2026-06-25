/**
 * Accelerator Sync Registry
 *
 * Maps Domain Accelerators to their sync scopes, entity definitions,
 * and plan requirements. This drives the schema-bound extraction.
 */

import type { AcceleratorManifest, AcceleratorType } from "./types";

import type {
  AcceleratorSyncScope,
  FieldScope,
  SyncBehavior,
  SyncPolicies,
  SkuTier,
} from "@integratewise/types";

// ============================================================================
// Accelerator Sync Manifest
// ============================================================================

export interface AcceleratorSyncManifest extends AcceleratorManifest {
  /** Sync scope definition */
  syncScope: AcceleratorSyncScope;

  /** Minimum plan required */
  minimumPlan: SkuTier;

  /** Required connector types */
  requiredConnectors: string[];

  /** Estimated record counts by org size */
  estimatedRecordCount: {
    small: number; // < 100 accounts
    medium: number; // 100-1000 accounts
    large: number; // > 1000 accounts
  };
}

// ============================================================================
// Pre-defined Sync Scopes
// ============================================================================

const FOUNDATION_SCOPE: AcceleratorSyncScope = {
  acceleratorId: "foundation",
  version: "1.0.0",
  primaryEntities: ["account", "contact"],
  secondaryEntities: [],
  computedEntities: [],
  fieldScopes: {
    account: {
      included: ["name", "stage", "owner_id", "created_at", "updated_at"],
      excluded: [],
      masked: [],
      computed: [],
    },
    contact: {
      included: ["name", "email", "title", "account_id", "phone"],
      excluded: [],
      masked: ["email"],
      computed: [],
    },
  },
  syncBehavior: {
    creamyLoadDays: 30,
    fullLoadMonths: 12,
    priority: "normal",
    realTimeFields: [],
  },
  signals: [],
  policies: {
    dataRetentionDays: 365,
    requiresApproval: false,
    piiFields: ["contact.email", "contact.phone"],
  },
};

const CS_GROWTH_SCOPE: AcceleratorSyncScope = {
  acceleratorId: "cs_growth",
  version: "1.0.0",
  primaryEntities: ["account", "contact", "risk", "task", "engagement"],
  secondaryEntities: ["opportunity", "ticket", "conversation"],
  computedEntities: ["health_score", "risk_score", "churn_prediction"],
  fieldScopes: {
    account: {
      included: [
        "name",
        "arr",
        "mrr",
        "stage",
        "health_score",
        "last_activity_date",
        "csm_owner_id",
        "renewal_date",
        "product_usage_score",
        "support_ticket_count",
        "nps_score",
        "created_at",
        "updated_at",
      ],
      excluded: ["billing_address", "tax_id", "purchase_order"],
      masked: [],
      computed: ["health_score", "risk_level"],
    },
    contact: {
      included: ["name", "email", "title", "account_id", "role", "last_contacted"],
      excluded: [],
      masked: ["email"],
      computed: [],
    },
    risk: {
      included: ["type", "severity", "status", "owner_id", "account_id", "created_at"],
      excluded: [],
      masked: [],
      computed: ["risk_score"],
    },
    task: {
      included: ["title", "status", "due_date", "owner_id", "account_id", "priority"],
      excluded: [],
      masked: [],
      computed: [],
    },
    engagement: {
      included: ["type", "date", "account_id", "contact_id", "outcome"],
      excluded: [],
      masked: [],
      computed: [],
    },
  },
  syncBehavior: {
    creamyLoadDays: 90,
    fullLoadMonths: 24,
    priority: "high",
    realTimeFields: ["health_score", "risk_level", "stage", "arr"],
  },
  signals: ["health_drop", "renewal_risk", "usage_decline", "support_escalation", "churn_risk"],
  policies: {
    dataRetentionDays: 2555, // 7 years
    requiresApproval: true,
    piiFields: ["contact.email", "contact.phone"],
  },
};

const REVENUE_INTELLIGENCE_SCOPE: AcceleratorSyncScope = {
  acceleratorId: "revenue_intelligence",
  version: "1.0.0",
  primaryEntities: ["opportunity", "account", "contact", "activity"],
  secondaryEntities: ["email", "meeting", "call", "forecast"],
  computedEntities: ["forecast_score", "deal_velocity", "win_probability"],
  fieldScopes: {
    opportunity: {
      included: [
        "name",
        "amount",
        "stage",
        "probability",
        "close_date",
        "forecast_category",
        "competitor",
        "next_steps",
        "created_at",
        "updated_at",
      ],
      excluded: [],
      masked: [],
      computed: ["win_probability", "deal_health", "deal_velocity"],
    },
    account: {
      included: ["name", "industry", "size", "territory", "owner_id"],
      excluded: [],
      masked: [],
      computed: [],
    },
    activity: {
      included: ["type", "date", "opportunity_id", "outcome", "sentiment"],
      excluded: [],
      masked: [],
      computed: [],
    },
  },
  syncBehavior: {
    creamyLoadDays: 90,
    fullLoadMonths: 36,
    priority: "high",
    realTimeFields: ["stage", "amount", "close_date", "probability"],
  },
  signals: [
    "deal_at_risk",
    "forecast_change",
    "competitor_mentioned",
    "stalled_deal",
    "momentum_shift",
  ],
  policies: {
    dataRetentionDays: 2555,
    requiresApproval: true,
    piiFields: ["call.recording", "email.body"],
  },
};

const SAAS_VERTICAL_SCOPE: AcceleratorSyncScope = {
  acceleratorId: "saas_vertical",
  version: "1.0.0",
  primaryEntities: ["account", "contact", "subscription", "usage_event"],
  secondaryEntities: ["invoice", "feature_flag", "integration"],
  computedEntities: ["mrr_trend", "activation_score", "expansion_revenue"],
  fieldScopes: {
    account: {
      included: [
        "name",
        "plan",
        "mrr",
        "arr",
        "seats",
        "signup_date",
        "last_login",
        "product_tier",
      ],
      excluded: [],
      masked: [],
      computed: ["mrr_trend", "activation_score"],
    },
    subscription: {
      included: ["plan", "status", "start_date", "end_date", "mrr"],
      excluded: [],
      masked: [],
      computed: [],
    },
    usage_event: {
      included: ["event_type", "timestamp", "account_id", "value"],
      excluded: [],
      masked: [],
      computed: [],
    },
  },
  syncBehavior: {
    creamyLoadDays: 90,
    fullLoadMonths: 36,
    priority: "high",
    realTimeFields: ["mrr", "plan", "status"],
  },
  signals: ["trial_conversion_risk", "expansion_opportunity", "churn_signal", "activation_stall"],
  policies: {
    dataRetentionDays: 2555,
    requiresApproval: false,
    piiFields: [],
  },
};

// ============================================================================
// Accelerator Registry
// ============================================================================

export const ACCELERATOR_SYNC_REGISTRY: Record<string, AcceleratorSyncManifest> = {
  // Free tier - Foundation only
  foundation: {
    id: "foundation",
    name: "Foundation Pack",
    version: "1.0.0",
    type: "universal" as AcceleratorType,
    description: "Basic account and contact sync for any business",
    tools_supported: ["salesforce", "hubspot", "pipedrive"],
    minimumPlan: "free",
    requiredConnectors: ["crm"],
    syncScope: FOUNDATION_SCOPE,
    estimatedRecordCount: { small: 1000, medium: 10000, large: 100000 },
  },

  // Starter tier - Foundation + CS Growth
  cs_growth: {
    id: "cs_growth",
    name: "Customer Success Growth",
    version: "1.0.0",
    type: "vertical" as AcceleratorType,
    vertical: "saas",
    roles_supported: ["csm", "cs_lead", "vp_cs"],
    description: "Complete customer success lifecycle management",
    tools_supported: ["salesforce", "gainsight", "churnzero", "zendesk", "intercom"],
    minimumPlan: "starter",
    requiredConnectors: ["crm", "support"],
    syncScope: CS_GROWTH_SCOPE,
    estimatedRecordCount: { small: 5000, medium: 50000, large: 500000 },
  },

  // Professional tier - All standard accelerators
  saas_vertical: {
    id: "saas_vertical",
    name: "SaaS Vertical",
    version: "1.0.0",
    type: "vertical" as AcceleratorType,
    vertical: "saas",
    description: "SaaS-specific metrics and subscription tracking",
    tools_supported: ["stripe", "chargebee", "mixpanel", "amplitude"],
    minimumPlan: "starter",
    requiredConnectors: ["billing", "product_analytics"],
    syncScope: SAAS_VERTICAL_SCOPE,
    estimatedRecordCount: { small: 10000, medium: 100000, large: 1000000 },
  },

  revenue_intelligence: {
    id: "revenue_intelligence",
    name: "Revenue Intelligence",
    version: "1.0.0",
    type: "intelligence" as AcceleratorType,
    description: "AI-powered deal intelligence and forecasting",
    tools_supported: ["salesforce", "hubspot", "clari", "gong", "chorus"],
    minimumPlan: "professional",
    requiredConnectors: ["crm", "conversation_intelligence"],
    syncScope: REVENUE_INTELLIGENCE_SCOPE,
    estimatedRecordCount: { small: 2000, medium: 20000, large: 200000 },
  },

  // Enterprise tier - Custom accelerators
  custom: {
    id: "custom",
    name: "Custom Accelerator",
    version: "1.0.0",
    type: "vertical" as AcceleratorType,
    description: "Custom-built accelerator for enterprise needs",
    tools_supported: ["*"], // Any connector
    minimumPlan: "enterprise",
    requiredConnectors: [],
    syncScope: {
      acceleratorId: "custom",
      version: "1.0.0",
      primaryEntities: [],
      secondaryEntities: [],
      computedEntities: [],
      fieldScopes: {},
      syncBehavior: {
        creamyLoadDays: 90,
        fullLoadMonths: 60,
        priority: "critical",
        realTimeFields: [],
      },
      signals: [],
      policies: {
        dataRetentionDays: 2555,
        requiresApproval: true,
        piiFields: [],
      },
    },
    estimatedRecordCount: { small: 1000, medium: 100000, large: 10000000 },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get accelerator manifest by ID
 */
export function getAccelerator(id: string): AcceleratorSyncManifest | undefined {
  return ACCELERATOR_SYNC_REGISTRY[id];
}

/**
 * List all accelerators available for a plan tier
 */
export function getAcceleratorsForPlan(tier: SkuTier): AcceleratorSyncManifest[] {
  const tierOrder = ["free", "starter", "professional", "enterprise"];
  const tierIndex = tierOrder.indexOf(tier);

  return Object.values(ACCELERATOR_SYNC_REGISTRY).filter((acc) => {
    const accTierIndex = tierOrder.indexOf(acc.minimumPlan);
    return accTierIndex <= tierIndex;
  });
}

/**
 * Check if accelerator is available for plan
 */
export function isAcceleratorAvailable(acceleratorId: string, tier: SkuTier): boolean {
  const accelerator = getAccelerator(acceleratorId);
  if (!accelerator) return false;

  const tierOrder = ["free", "starter", "professional", "enterprise"];
  return tierOrder.indexOf(tier) >= tierOrder.indexOf(accelerator.minimumPlan);
}

/**
 * Get entity types for an accelerator
 */
export function getAcceleratorEntities(acceleratorId: string): string[] {
  const accelerator = getAccelerator(acceleratorId);
  if (!accelerator) return [];

  const scope = accelerator.syncScope;
  return [...scope.primaryEntities, ...scope.secondaryEntities];
}

/**
 * Get field scope for an entity type within an accelerator
 */
export function getFieldScope(acceleratorId: string, entityType: string): FieldScope | undefined {
  const accelerator = getAccelerator(acceleratorId);
  return accelerator?.syncScope.fieldScopes[entityType];
}

/**
 * Estimate record count for organization size
 */
export function estimateRecordCount(
  acceleratorId: string,
  orgSize: "small" | "medium" | "large"
): number {
  const accelerator = getAccelerator(acceleratorId);
  return accelerator?.estimatedRecordCount[orgSize] || 0;
}

/**
 * Validate that an entity type is allowed for an accelerator
 */
export function isEntityTypeAllowed(acceleratorId: string, entityType: string): boolean {
  const entities = getAcceleratorEntities(acceleratorId);
  return entities.includes(entityType);
}

/**
 * Get all signals enabled by an accelerator
 */
export function getAcceleratorSignals(acceleratorId: string): string[] {
  const accelerator = getAccelerator(acceleratorId);
  return accelerator?.syncScope.signals || [];
}
