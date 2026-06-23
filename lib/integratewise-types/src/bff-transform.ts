/**
 * BFF Transform Layer
 *
 * Converts technical schema names to organic UI labels.
 * PRINCIPLE: Schema is Backend IP - Frontend NEVER sees entity_type or field names.
 *
 * Backend sees: entity_type = "account", field = "health_score"
 * Frontend sees: section = "Accounts", label = "Health Score"
 */

import {
  ORGANIC_CAPABILITY_MAP,
  DEPARTMENT_TO_CONFIG_KEY,
  DOMAIN_SPINE_CONFIG,
  fieldToOrganicLabel,
  entityToOrganicSection,
  type OrganicCapability,
  type ResolvedSchema,
} from "./schema.js";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** UI Section rendered from entity_type */
export interface UISection {
  /** Organic section ID (user-friendly) */
  id: string;
  /** Organic section title */
  title: string;
  /** Section description */
  description: string;
  /** Internal entity types this section represents (Backend IP) */
  _entity_types: string[];
  /** Fields to display */
  fields: UIField[];
  /** Display order */
  order: number;
  /** Icon identifier */
  icon?: string;
}

/** UI Field rendered from schema field */
export interface UIField {
  /** Organic field label */
  label: string;
  /** Internal field name (Backend IP) */
  _field_name: string;
  /** Field value (transformed) */
  value: unknown;
  /** Display type */
  type: "text" | "number" | "date" | "score" | "currency" | "status" | "badge";
  /** Format options */
  format?: {
    currency?: string;
    decimals?: number;
    dateFormat?: string;
  };
}

/** Transformed entity for UI display */
export interface UITransformedEntity {
  /** Organic entity display name */
  display_name: string;
  /** Internal entity type (Backend IP) */
  _entity_type: string;
  /** Section this entity belongs to */
  section_id: string;
  /** Organic fields */
  fields: UIField[];
  /** Raw data (for debugging, stripped in production) */
  _raw?: Record<string, unknown>;
}

/** Complete dashboard view for a department */
export interface UIDashboardView {
  department: string;
  industry?: string | null;
  sections: UISection[];
  entities: UITransformedEntity[];
  summary: {
    total_entities: number;
    entity_types: string[];
    last_updated: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORM FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Transform schema to UI sections
 * Backend: entity_types = ["account", "task", "engagement"]
 * Frontend: sections = [{id: "accounts", title: "Accounts"}, ...]
 */
export function schemaToUISections(
  schema: ResolvedSchema,
  _options?: { includeHidden?: boolean }
): UISection[] {
  const configKey = DEPARTMENT_TO_CONFIG_KEY[schema.department] || schema.department;
  const capabilities = ORGANIC_CAPABILITY_MAP[configKey] || ORGANIC_CAPABILITY_MAP.BIZOPS;

  return capabilities.map((cap, index) => ({
    id: cap.id,
    title: cap.title,
    description: cap.description,
    _entity_types: cap._entity_types || [],
    fields: [], // Populated when entities are transformed
    order: index,
    icon: getIconForCapability(cap.id),
  }));
}

/**
 * Transform entity data to UI format
 * Backend: { entity_type: "account", health_score: 85, arr: 100000 }
 * Frontend: { display_name: "Account", fields: [{label: "Health Score", value: 85}, ...] }
 */
export function transformEntityForUI(
  schema: ResolvedSchema,
  entity: Record<string, unknown>
): UITransformedEntity {
  const entityType = String(entity.entity_type || entity._entity_type || "unknown");
  const priorityFields = schema.priority_fields[entityType] || [];

  // Get display name
  const displayName = String(
    entity.name || entity.title || entity.company || entity.email || "Unnamed"
  );

  // Find which section this entity belongs to
  const configKey = DEPARTMENT_TO_CONFIG_KEY[schema.department] || schema.department;
  const capabilities = ORGANIC_CAPABILITY_MAP[configKey] || ORGANIC_CAPABILITY_MAP.BIZOPS;
  const section =
    capabilities.find((cap) => cap._entity_types?.includes(entityType)) || capabilities[0];

  // Transform fields
  const fields: UIField[] = priorityFields
    .filter((field) => entity[field] !== undefined)
    .map((field) => ({
      label: fieldToOrganicLabel(field),
      _field_name: field,
      value: transformFieldValue(field, entity[field]),
      type: inferFieldType(field, entity[field]),
      format: getFieldFormat(field),
    }));

  return {
    display_name: displayName,
    _entity_type: entityType,
    section_id: section?.id || "general",
    fields,
    _raw:
      typeof (globalThis as any).process !== "undefined" &&
      (globalThis as any).process.env?.NODE_ENV === "development"
        ? entity
        : undefined,
  };
}

/**
 * Transform multiple entities for UI display
 */
export function transformEntitiesForUI(
  schema: ResolvedSchema,
  entities: Record<string, unknown>[]
): UITransformedEntity[] {
  return entities.map((entity) => transformEntityForUI(schema, entity));
}

/**
 * Build complete dashboard view from schema and entities
 */
export function buildDashboardView(
  schema: ResolvedSchema,
  entities: Record<string, unknown>[]
): UIDashboardView {
  const sections = schemaToUISections(schema);
  const transformedEntities = transformEntitiesForUI(schema, entities);

  // Group entities by section
  const entitiesBySection = new Map<string, UITransformedEntity[]>();
  for (const entity of transformedEntities) {
    const list = entitiesBySection.get(entity.section_id) || [];
    list.push(entity);
    entitiesBySection.set(entity.section_id, list);
  }

  // Add entity counts to sections
  const sectionsWithCounts = sections.map((section) => ({
    ...section,
    entity_count: entitiesBySection.get(section.id)?.length || 0,
  }));

  return {
    department: schema.department,
    industry: schema.industry,
    sections: sectionsWithCounts,
    entities: transformedEntities,
    summary: {
      total_entities: entities.length,
      entity_types: Array.from(
        new Set(entities.map((e) => String(e.entity_type || e._entity_type)))
      ),
      last_updated: new Date().toISOString(),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD TRANSFORM HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function transformFieldValue(field: string, value: unknown): unknown {
  if (value === null || value === undefined) return null;

  // Date formatting
  if (field.includes("_date") || field.includes("_at")) {
    if (typeof value === "string") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }
  }

  // Currency formatting
  if (
    field === "arr" ||
    field === "mrr" ||
    field === "acv" ||
    field.includes("_amount") ||
    field === "value"
  ) {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: num >= 1000000 ? "compact" : "standard",
      }).format(num);
    }
  }

  // Score formatting (0-100)
  if (field.includes("_score") || field === "health_score") {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    if (!isNaN(num)) {
      return Math.round(num);
    }
  }

  // Percentage formatting
  if (field.includes("_rate") || field.includes("_percent") || field.endsWith("%")) {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    if (!isNaN(num)) {
      return `${Math.round(num)}%`;
    }
  }

  return value;
}

function inferFieldType(field: string, value: unknown): UIField["type"] {
  if (field.includes("_score")) return "score";
  if (
    field === "arr" ||
    field === "mrr" ||
    field === "acv" ||
    field.includes("_amount") ||
    field === "value"
  )
    return "currency";
  if (field.includes("_date") || field.includes("_at")) return "date";
  if (field === "status" || field.includes("_status")) return "status";
  if (field.includes("_count") || field === "amount" || typeof value === "number") return "number";
  if (field.includes("_level") || field.includes("_tier") || field.includes("_risk"))
    return "badge";
  return "text";
}

function getFieldFormat(field: string): UIField["format"] | undefined {
  if (field === "arr" || field === "acv") {
    return { currency: "USD", decimals: 0 };
  }
  if (field === "mrr") {
    return { currency: "USD", decimals: 0 };
  }
  if (field.includes("_date")) {
    return { dateFormat: "MMM d, yyyy" };
  }
  return undefined;
}

function getIconForCapability(capabilityId: string): string {
  const icons: Record<string, string> = {
    accounts: "Users",
    pipeline: "TrendingUp",
    activities: "Activity",
    territory: "MapPin",
    intel: "Target",
    campaigns: "Megaphone",
    leads: "UserPlus",
    content: "FileText",
    analytics: "BarChart3",
    delivery: "Truck",
    quality: "ShieldCheck",
    engineering: "Code",
    feedback: "MessageSquare",
    revenue: "DollarSign",
    expenses: "CreditCard",
    reporting: "FileBarChart",
    vendors: "Building",
    tickets: "Ticket",
    knowledge: "BookOpen",
    operations: "Settings",
    purchasing: "ShoppingCart",
    spend: "PieChart",
    renewals: "RefreshCw",
    strategy: "Compass",
    projects: "FolderKanban",
    coordination: "UsersRound",
    infrastructure: "Server",
    security: "Lock",
    insights: "Lightbulb",
    students: "GraduationCap",
    courses: "BookMarked",
    tasks: "CheckSquare",
    goals: "Target",
    calendar: "Calendar",
    reflection: "PenTool",
    forecast: "TrendingUp",
    attribution: "Share2",
    process: "Workflow",
    planning: "CalendarDays",
    support: "LifeBuoy",
    engagement: "Handshake",
    risks: "AlertTriangle",
    initiatives: "Rocket",
  };
  return icons[capabilityId] || "Box";
}

// ═══════════════════════════════════════════════════════════════════════════════
// BFF API RESPONSE BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build BFF API response for schema-driven UI
 * This is what the frontend receives - NO entity_type names, NO field names
 */
export function buildBFFResponse(
  schema: ResolvedSchema,
  spineData: Record<string, unknown>[],
  options?: {
    /** Include debug info (only in dev) */
    debug?: boolean;
    /** Filter to specific sections */
    sectionFilter?: string[];
  }
): {
  view: UIDashboardView;
  meta: {
    schema_version: string;
    department: string;
    entity_count: number;
  };
  _debug?: unknown;
} {
  const view = buildDashboardView(schema, spineData);

  // Apply section filter if provided
  if (options?.sectionFilter) {
    view.sections = view.sections.filter((s) => options.sectionFilter!.includes(s.id));
    view.entities = view.entities.filter((e) => view.sections.some((s) => s.id === e.section_id));
  }

  const response: {
    view: UIDashboardView;
    meta: {
      schema_version: string;
      department: string;
      entity_count: number;
    };
    _debug?: unknown;
  } = {
    view,
    meta: {
      schema_version: schema.version,
      department: schema.department,
      entity_count: spineData.length,
    },
  };

  if (
    options?.debug &&
    typeof (globalThis as any).process !== "undefined" &&
    (globalThis as any).process.env?.NODE_ENV === "development"
  ) {
    response._debug = {
      entity_types: schema.entity_types,
      priority_fields: schema.priority_fields,
    };
  }

  return response;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADER INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build fetch configuration for connectors based on schema
 * Returns which fields to request from each connector
 */
export function buildConnectorFetchConfig(
  schema: ResolvedSchema,
  entityType: string
): {
  /** Fields to fetch from connector */
  fields: string[];
  /** Expand parameters for related data */
  expands?: string[];
  /** Filters to apply */
  filters?: Record<string, string>;
} {
  const priorityFields = schema.priority_fields[entityType] || [];

  // Group fields by common patterns for connector optimization
  const standardFields = priorityFields.filter(
    (f) => !f.includes("_") || ["name", "title", "email", "status"].includes(f)
  );
  const customFields = priorityFields.filter(
    (f) => f.includes("_") && !["name", "title", "email", "status"].includes(f)
  );

  return {
    fields: [...standardFields, ...customFields],
    expands: entityType === "account" ? ["contacts", "opportunities"] : undefined,
  };
}

/**
 * Determine which connectors to enable based on schema entity types
 */
export function getRequiredConnectors(schema: ResolvedSchema): string[] {
  const connectors = new Set<string>();

  for (const entityType of schema.entity_types) {
    // Map entity types to connector capabilities
    if (["account", "contact", "opportunity", "lead"].includes(entityType)) {
      connectors.add("crm"); // Salesforce, HubSpot
    }
    if (["ticket", "engagement"].includes(entityType)) {
      connectors.add("support"); // Zendesk, Intercom
    }
    if (["task", "note", "activity"].includes(entityType)) {
      connectors.add("productivity"); // Asana, Monday
    }
    if (["invoice", "payment", "contract"].includes(entityType)) {
      connectors.add("finance"); // Stripe, NetSuite
    }
  }

  return Array.from(connectors);
}

export {
  ORGANIC_CAPABILITY_MAP,
  DEPARTMENT_TO_CONFIG_KEY,
  DOMAIN_SPINE_CONFIG,
  fieldToOrganicLabel,
  entityToOrganicSection,
};

export type { OrganicCapability, ResolvedSchema };
