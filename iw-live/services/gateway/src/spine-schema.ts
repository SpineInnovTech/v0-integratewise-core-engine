/**
 * Spine Schema Resolver (Phase 1 of the spine-hydration-lifecycle).
 *
 * Pure, deterministic, manifest-driven. Turns an Identity {role, department,
 * industry} into a full Spine_Schema:
 *   - entityTypes          (canonical resource types this identity projects)
 *   - signalTypes          (which signals this identity cares about)
 *   - memoryCategories     (identity-specific memory categories — Phase 5 targets)
 *   - connectorPriorities  (ordered providers to hydrate first — Creamy bias)
 *   - governanceDefaults   (per-identity promotion approval policy — Phase 5 / R11)
 *   - twinContext          (role/department/industry the Twin reasons within)
 *
 * Constitutional intent (spine-hydration-lifecycle R2): the schema is derived
 * from the COMBINATION of Role × Department × Industry — never a static
 * domain-only template. Two tenants in the same department but different
 * industries get different entity-type + connector-priority sets; two tenants
 * in the same industry but different roles get different signal + memory sets.
 *
 * No I/O. Cloudflare-only doctrine is irrelevant here (this is pure logic);
 * persistence lives in workspace-spine.ts (D1 only).
 */

export interface Identity {
  role?: string | null;
  department?: string | null;
  industry?: string | null;
}

export interface GovernanceDefaults {
  /** When true, qualifying memories auto-promote without HITL. */
  autoPromote: boolean;
  /** Memory categories that always require human approval before promotion. */
  requiresApproval: string[];
}

export interface ActivationThresholds {
  minMemories: number;
  minSignals: number;
  requireCreamy: boolean;
}

export interface SpineSchema {
  /** Manifest version — bumped when the resolver's output shape/content grows. */
  schemaVersion: number;
  domains: string[];
  entityTypes: string[];
  signalTypes: string[];
  memoryCategories: string[];
  connectorPriorities: string[];
  governanceDefaults: GovernanceDefaults;
  twinContext: {
    role: string;
    department: string;
    industry: string;
    /** Per-identity Twin activation thresholds (R12.4). Persisted in twin_context. */
    activationThresholds: ActivationThresholds;
  };
  /** True when role or industry was missing and a documented default was applied (R1.3). */
  identityComplete: boolean;
}

/** Bump when the manifest's content or shape changes (additive, auditable growth). */
export const SPINE_SCHEMA_VERSION = 2;

// ── Department → IW Domain ───────────────────────────────────────────────────
// Single source of truth for department→domain resolution (shared with the
// gateway's hydrate path so reads and writes mirror).
export const DEPARTMENT_TO_DOMAIN: Record<string, string> = {
  CUSTOMER_SUCCESS: "CUSTOMER_SUCCESS",
  SALES: "SALES",
  MARKETING: "MARKETING",
  REVOPS: "REVOPS",
  ENGINEERING: "PRODUCT_ENGINEERING",
  PRODUCT: "PRODUCT_ENGINEERING",
  IT: "PRODUCT_ENGINEERING",
  PRODUCT_ENGINEERING: "PRODUCT_ENGINEERING",
  SUPPLY_CHAIN: "PROCUREMENT",
  PROCUREMENT: "PROCUREMENT",
  SERVICE_OPS: "SERVICE",
  SERVICE: "SERVICE",
  SUPPORT: "SERVICE",
  FINANCE: "FINANCE",
  LEGAL: "CUSTOMER_SUCCESS",
  HR: "CUSTOMER_SUCCESS",
  OPERATIONS: "CUSTOMER_SUCCESS",
  PROJECT_MANAGEMENT: "CUSTOMER_SUCCESS",
  IT_ADMIN: "CUSTOMER_SUCCESS",
  BIZOPS: "CUSTOMER_SUCCESS",
  PERSONAL: "PERSONAL",
};

const VALID_DOMAINS = new Set([
  "CUSTOMER_SUCCESS",
  "SALES",
  "REVOPS",
  "MARKETING",
  "PRODUCT_ENGINEERING",
  "FINANCE",
  "SERVICE",
  "PROCUREMENT",
  "CUSTOMER_SUCCESS",
  "PERSONAL",
]);

/**
 * Resolve the authoritative domain from an optional explicit domain + department.
 * Mirrors the prior gateway resolver so behavior is unchanged for callers that
 * still pass a domain.
 */
export function resolveDomain(domain?: string | null, department?: string | null): string {
  if (domain && VALID_DOMAINS.has(domain.toUpperCase())) return domain.toUpperCase();
  if (department) {
    const derived = DEPARTMENT_TO_DOMAIN[department.toUpperCase()];
    if (derived) return derived;
  }
  return "CUSTOMER_SUCCESS"; // Switched from BizOps per request; explicit role picker can be added in onboarding if needed.
}

// ── Domain base profiles ─────────────────────────────────────────────────────
// The canonical projection per domain: entity types, signals, memory categories,
// and the default connector ordering. Industry/role overlays refine these.
interface DomainProfile {
  entityTypes: string[];
  signalTypes: string[];
  memoryCategories: string[];
  connectorPriorities: string[];
}

const DOMAIN_PROFILES: Record<string, DomainProfile> = {
  CUSTOMER_SUCCESS: {
    entityTypes: ["account", "person", "engagement", "task", "signal", "document", "event"],
    signalTypes: ["renewal_risk", "health_drop", "response_time", "sentiment_shift", "usage_drop"],
    memoryCategories: ["account_context", "relationship", "commitment", "risk", "preference"],
    connectorPriorities: ["hubspot", "salesforce", "intercom", "zendesk", "gmail"],
  },
  SALES: {
    entityTypes: ["account", "person", "deal", "task", "signal", "event", "document"],
    signalTypes: ["deal_stalled", "buying_signal", "champion_change", "competitor_mention"],
    memoryCategories: ["deal_context", "relationship", "objection", "commitment", "preference"],
    connectorPriorities: ["hubspot", "salesforce", "pipedrive", "close", "gmail"],
  },
  REVOPS: {
    entityTypes: ["account", "deal", "person", "signal", "event", "document", "task"],
    signalTypes: ["pipeline_change", "forecast_risk", "conversion_drop", "churn_signal"],
    memoryCategories: ["pipeline_context", "forecast", "policy", "risk", "decision"],
    connectorPriorities: ["salesforce", "hubspot", "stripe", "google-analytics"],
  },
  MARKETING: {
    entityTypes: ["account", "person", "campaign", "signal", "event", "document", "task"],
    signalTypes: ["campaign_performance", "lead_surge", "engagement_drop", "attribution_shift"],
    memoryCategories: ["campaign_context", "audience", "messaging", "preference", "decision"],
    connectorPriorities: ["hubspot", "google-analytics", "mixpanel", "salesforce"],
  },
  PRODUCT_ENGINEERING: {
    entityTypes: ["project", "task", "person", "incident", "signal", "document", "event"],
    signalTypes: ["pr_stalled", "incident_spike", "velocity_drop", "blocker", "deploy_risk"],
    memoryCategories: ["project_context", "decision", "incident", "convention", "risk"],
    connectorPriorities: ["github", "jira", "linear", "gitlab", "slack"],
  },
  FINANCE: {
    entityTypes: ["account", "invoice", "person", "signal", "document", "event", "task"],
    signalTypes: ["invoice_overdue", "burn_change", "revenue_risk", "anomaly"],
    memoryCategories: ["financial_context", "policy", "decision", "risk", "commitment"],
    connectorPriorities: ["stripe", "quickbooks", "chargebee", "salesforce"],
  },
  SERVICE: {
    entityTypes: ["account", "person", "ticket", "signal", "event", "document", "task"],
    signalTypes: ["sla_breach", "ticket_surge", "csat_drop", "escalation"],
    memoryCategories: ["ticket_context", "resolution", "preference", "risk", "commitment"],
    connectorPriorities: ["zendesk", "freshdesk", "intercom", "front", "helpscout"],
  },
  PROCUREMENT: {
    entityTypes: ["vendor", "contract", "person", "signal", "document", "event", "task"],
    signalTypes: ["contract_expiry", "vendor_risk", "spend_anomaly", "renewal_due"],
    memoryCategories: ["vendor_context", "contract", "policy", "risk", "decision"],
    connectorPriorities: ["salesforce", "quickbooks", "stripe"],
  },
  BIZOPS: {
    entityTypes: ["account", "person", "project", "task", "signal", "document", "event"],
    signalTypes: ["cross_team_risk", "capacity_warning", "initiative_stalled", "anomaly"],
    memoryCategories: ["org_context", "decision", "policy", "risk", "preference"],
    connectorPriorities: ["slack", "notion", "google-drive", "jira"],
  },
  PERSONAL: {
    entityTypes: ["person", "task", "document", "event", "note", "signal", "engagement"],
    signalTypes: ["follow_up_due", "commitment_made", "context_shift"],
    memoryCategories: ["personal_context", "preference", "commitment", "behavior"],
    connectorPriorities: ["gmail", "google-drive", "notion"],
  },
};

// ── Industry overlays ────────────────────────────────────────────────────────
// Industry refines WHICH canonical types matter and WHICH connectors to hydrate
// first. It does not invent non-canonical types — it selects/extends from the
// canonical connector vocabulary (see connector-sync PROVIDER_ENTITY_MAP).
interface IndustryOverlay {
  entityTypes?: string[];
  connectorPriorities?: string[];
  /** Categories this industry treats as sensitive (force HITL). */
  sensitiveMemory?: string[];
}

const INDUSTRY_OVERLAYS: Record<string, IndustryOverlay> = {
  saas: {
    entityTypes: ["subscription", "renewal"],
    connectorPriorities: ["hubspot", "stripe", "intercom"],
  },
  fintech: {
    entityTypes: ["invoice", "subscription"],
    connectorPriorities: ["stripe", "quickbooks", "chargebee"],
    sensitiveMemory: ["financial_context", "risk"],
  },
  healthcare: {
    entityTypes: ["ticket", "document"],
    connectorPriorities: ["salesforce", "zendesk"],
    sensitiveMemory: ["account_context", "relationship", "personal_context"],
  },
  ecommerce: {
    entityTypes: ["invoice", "subscription"],
    connectorPriorities: ["stripe", "google-analytics", "hubspot"],
  },
  manufacturing: {
    entityTypes: ["contract", "vendor"],
    connectorPriorities: ["salesforce", "quickbooks"],
  },
  agency: {
    entityTypes: ["campaign", "deal"],
    connectorPriorities: ["hubspot", "google-analytics", "notion"],
  },
  education: {
    entityTypes: ["document", "engagement"],
    connectorPriorities: ["notion", "google-drive", "gmail"],
  },
  real_estate: {
    entityTypes: ["deal", "document"],
    connectorPriorities: ["hubspot", "salesforce", "gmail"],
  },
};

// ── Role (seniority/function) overlays ───────────────────────────────────────
// Role refines the signal + memory emphasis on top of the department. Matched on
// keywords so free-text roles still resolve. Department-derived signals always
// apply; role adds focus.
interface RoleOverlay {
  signalTypes?: string[];
  memoryCategories?: string[];
}

const ROLE_OVERLAYS: Array<{ match: RegExp; overlay: RoleOverlay }> = [
  {
    match: /(chief|founder|ceo|cfo|coo|cto|exec|vp|head|director)/i,
    overlay: {
      signalTypes: ["strategic_risk", "board_metric", "cross_team_risk"],
      memoryCategories: ["strategic_context", "decision"],
    },
  },
  {
    match: /(lead|manager|head)/i,
    overlay: {
      signalTypes: ["team_capacity", "escalation"],
      memoryCategories: ["team_context", "decision"],
    },
  },
  {
    match: /(ops|operations)/i,
    overlay: {
      signalTypes: ["process_anomaly", "sla_breach"],
      memoryCategories: ["process_context", "policy"],
    },
  },
  {
    match: /(analyst|analytics|data)/i,
    overlay: {
      signalTypes: ["metric_anomaly", "trend_shift"],
      memoryCategories: ["analysis_context", "decision"],
    },
  },
];

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function normalizeIndustry(industry?: string | null): string | null {
  if (!industry) return null;
  return industry
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Resolve a full Spine_Schema from an Identity. Pure + deterministic.
 *
 * Differentiation guarantees (spine-hydration-lifecycle Property 1):
 *   - Industry feeds entityTypes + connectorPriorities (industry overlay).
 *   - Role feeds signalTypes + memoryCategories (role overlay).
 *   - Department/domain feeds the base of all four.
 */
export function resolveSpineSchema(identity: Identity): SpineSchema {
  const department = (identity.department || "").toUpperCase() || null;
  const domain = resolveDomain(null, department);
  const base = DOMAIN_PROFILES[domain] || DOMAIN_PROFILES.BIZOPS;

  const industryKey = normalizeIndustry(identity.industry);
  const industry = INDUSTRY_OVERLAYS[industryKey ?? ""] || {};

  const role = (identity.role || department || domain || "").toString();
  const roleOverlay = ROLE_OVERLAYS.find((r) => r.match.test(role))?.overlay || {};

  // Identity completeness (R1.3): role + industry present?
  const identityComplete = Boolean(
    (identity.role || identity.department) && normalizeIndustry(identity.industry)
  );

  const entityTypes = uniq([...base.entityTypes, ...(industry.entityTypes || [])]);
  const connectorPriorities = uniq([
    ...(industry.connectorPriorities || []),
    ...base.connectorPriorities,
  ]);
  const signalTypes = uniq([...base.signalTypes, ...(roleOverlay.signalTypes || [])]);
  const memoryCategories = uniq([
    ...base.memoryCategories,
    ...(roleOverlay.memoryCategories || []),
  ]);

  // Governance: industry-sensitive categories always require approval; otherwise
  // auto-promote low-risk categories. Healthcare/fintech are conservative.
  const requiresApproval = uniq([
    "risk",
    "decision",
    "policy",
    ...(industry.sensitiveMemory || []),
  ]).filter((c) => memoryCategories.includes(c) || (industry.sensitiveMemory || []).includes(c));

  const conservative = industryKey === "healthcare" || industryKey === "fintech";

  // Per-identity activation thresholds (R12.4): conservative industries require
  // more grounding before the Twin activates.
  const activationThresholds: ActivationThresholds = {
    minMemories: conservative ? 5 : 3,
    minSignals: 0,
    requireCreamy: false,
  };

  return {
    schemaVersion: SPINE_SCHEMA_VERSION,
    domains: [domain],
    entityTypes,
    signalTypes,
    memoryCategories,
    connectorPriorities,
    governanceDefaults: {
      autoPromote: !conservative,
      requiresApproval,
    },
    twinContext: {
      role: role || domain,
      department: department || domain,
      industry: industryKey || "unspecified",
      activationThresholds,
    },
    identityComplete,
  };
}
