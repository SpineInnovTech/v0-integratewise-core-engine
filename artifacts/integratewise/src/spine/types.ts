/**
 * IntegrateWise L1 adaptive layer — type contracts.
 *
 * The work surface is derived from three inputs:
 *   1. Schema availability — what entities/tables actually exist for the org.
 *   2. Role / department  — the CTXEnum context (10 roles).
 *   3. Industry / org type — injects topics, terminology, emphasis.
 */

export type OrgType = "PRODUCT" | "SERVICES" | "HYBRID";

export type CTXEnum =
  | "CTX_CS"
  | "CTX_SALES"
  | "CTX_SUPPORT"
  | "CTX_PM"
  | "CTX_MARKETING"
  | "CTX_BIZOPS"
  | "CTX_TECH"
  | "CTX_HR"
  | "CTX_FINANCE"
  | "CTX_LEGAL";

/** Industry dimension — extends OrgType into a richer lens. */
export type Industry =
  | "SAAS"
  | "FINANCIAL_SERVICES"
  | "HEALTHCARE"
  | "ECOMMERCE"
  | "MANUFACTURING"
  | "PROFESSIONAL_SERVICES"
  | "AGENCY"
  | "EDUCATION"
  | "REAL_ESTATE"
  | "LOGISTICS"
  | "NONPROFIT"
  | "MEDIA";

/** Logical schema groups that back modules and fields. */
export type SchemaGroup =
  | "person"
  | "company"
  | "deal"
  | "activity"
  | "document"
  | "campaign"
  | "product"
  | "service"
  | "project"
  | "metric"
  | "platform"
  | "email";

/** Readiness of a schema group for this org. */
export type SchemaState = "live" | "seeded" | "off";

/** Module identifiers — keys into the module registry. */
export type ModuleId =
  | "home"
  | "context"
  | "email"
  | "leads"
  | "pipeline"
  | "deals"
  | "campaigns"
  | "content"
  | "sales"
  | "clients"
  | "sessions"
  | "projects"
  | "tasks"
  | "products"
  | "services"
  | "knowledge"
  | "metrics"
  | "strategy"
  | "brainstorming"
  | "architecture"
  | "data-flow"
  | "data-sources"
  | "website"
  | "integrations"
  | "admin"
  | "settings"
  | "cockpit"
  | "iq-hub"
  | "governance"
  | "command-center"
  | "cs-accounts"
  | "cs-contacts"
  | "cs-meetings"
  | "release-control"
  | "insights"
  | "loader"
  | "profile"
  | "cs-account-detail"
  | "spend-insights"
  | "today";

/** Sidebar grouping for the derived nav. */
export type NavGroup =
  | "Workspace"
  | "Revenue"
  | "Marketing"
  | "Delivery"
  | "Catalog"
  | "Knowledge"
  | "Platform"
  | "System";

export interface RoleProfile {
  role: string;
  modules: ModuleId[];
  quickActions: { label: string; icon: string }[];
  kpis: { label: string; value: string; sub: string; up: boolean; color: string }[];
  todayFocus: { task: string; priority: "critical" | "high" | "medium" | "low"; context: string }[];
  signals: { text: string; type: "success" | "warning" | "info"; time: string }[];
  schemaGroups: SchemaGroup[];
  connectors: string[];
}

export interface IndustryProfile {
  label: string;
  orgType: OrgType;
  topics: string[];
  /** Terminology overrides — generic term → industry term. */
  terminology: Partial<Record<"customer" | "deal" | "product" | "team", string>>;
  emphasis: ModuleId[];
}
