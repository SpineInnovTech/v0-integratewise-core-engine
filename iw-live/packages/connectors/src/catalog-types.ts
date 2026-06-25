/**
 * Connector catalog entry type — supports frontend discovery, backend resolution, and department/industry coverage.
 */

export type AuthType = "oauth" | "api_key";

/** Canonical 12 departments (for filtering catalog by department) */
export const DEPARTMENTS = [
  "Sales",
  "Marketing",
  "RevOps",
  "Customer Success",
  "Support",
  "Engineering",
  "Product",
  "Finance",
  "Legal",
  "HR",
  "Supply Chain",
  "Service Operations",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

/** Canonical 11 industries (for filtering catalog by industry) */
export const INDUSTRIES = [
  "SaaS / Technology",
  "Professional Services",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Automotive",
  "Retail / Commerce",
  "Financial Services",
  "Logistics",
  "Media",
  "Public Sector",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export interface ConnectorCatalogEntry<T = unknown> {
  id: string;
  name: string;
  domain: string;
  category: string;
  authType: AuthType;
  /** Connector class; config shape is connector-specific (SalesforceConfig, HubSpotConfig, etc.). */
  class: new (config: any) => T;
  /** Optional: which departments this connector serves */
  departments?: Department[];
  /** Optional: which industries this connector is relevant for */
  industries?: Industry[];
  supportedEntities?: string[];
  icon?: string;
  scopes?: string[];
  webhookSupport?: boolean;
  syncMode?: string;
}
