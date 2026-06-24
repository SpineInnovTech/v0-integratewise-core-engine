/**
 * @workspace/spine-schema — Customer Zero's relay-owned copy of the platform's
 * canonical Spine schema.
 *
 * `canonical-schema.ts` is VENDORED VERBATIM from integratewise-live
 * (packages/types/src/schema.ts) — the platform's single source of truth for the
 * 12-department × 11-industry base schema, `getSpineConfig`, field policies and
 * entity-type aliases. Do NOT hand-edit that file; re-sync it from the platform
 * to pick up upstream changes. This keeps Customer Zero ZERO-DRIFT against truth.
 *
 * This module (index.ts) is the thin Customer-Zero ADAPTER on top:
 *  - maps the Customer Zero UI's industry codes (SAAS, ECOMMERCE, …) to the
 *    canonical INDUSTRY_SPINE_BASE keys (SAAS_TECH, RETAIL_COMMERCE, …)
 *  - exposes convenience resolvers + the canonical entity-record shape the
 *    connector pipeline (normalizer → hydration) produces.
 *
 * PRINCIPLE (do not violate): the base schema is canonical and never regenerated.
 * The AI delta generator only layers ADDITIVE, versioned deltas on top of base.
 */

export * from "./canonical-schema";

import {
  type EntityFieldPolicy,
  type SpineConfigShape,
  DOMAIN_SPINE_CONFIG,
  INDUSTRY_SPINE_BASE,
  getSpineConfig,
} from "./canonical-schema";

/** The immutable base schema version. AI deltas version forward from here. */
export const BASE_SCHEMA_VERSION = "1.0.0";

/** Every canonical industry key the platform base ships with (11). */
export const ALL_CANONICAL_INDUSTRIES: string[] = Object.keys(INDUSTRY_SPINE_BASE);

/** Every canonical department/domain config key the platform base ships with (12). */
export const ALL_DEPARTMENT_CONFIG_KEYS: string[] = Object.keys(DOMAIN_SPINE_CONFIG);

/**
 * Customer Zero UI industry code → canonical INDUSTRY_SPINE_BASE key.
 *
 * The UI's industry-registry uses friendlier codes than the platform base. The
 * canonical base is the superset of truth (it also has AUTOMOTIVE / PUBLIC_SECTOR
 * with no UI counterpart). Unmapped/near-miss UI codes resolve to the closest
 * canonical services/sector bucket so a config always exists.
 */
export const INDUSTRY_ALIAS: Record<string, string> = {
  SAAS: "SAAS_TECH",
  SAAS_TECH: "SAAS_TECH",
  FINANCIAL_SERVICES: "FINANCIAL_SERVICES",
  FINTECH: "FINANCIAL_SERVICES",
  HEALTHCARE: "HEALTHCARE",
  ECOMMERCE: "RETAIL_COMMERCE",
  RETAIL: "RETAIL_COMMERCE",
  RETAIL_COMMERCE: "RETAIL_COMMERCE",
  MANUFACTURING: "MANUFACTURING",
  PROFESSIONAL_SERVICES: "PROFESSIONAL_SERVICES",
  AGENCY: "PROFESSIONAL_SERVICES",
  EDUCATION: "EDUCATION",
  REAL_ESTATE: "PROFESSIONAL_SERVICES",
  LOGISTICS: "LOGISTICS",
  NONPROFIT: "PUBLIC_SECTOR",
  PUBLIC_SECTOR: "PUBLIC_SECTOR",
  MEDIA: "MEDIA",
  AUTOMOTIVE: "AUTOMOTIVE",
};

/** Normalize a raw industry string (UI code or canonical) to a canonical key, or null. */
export function resolveCanonicalIndustry(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const key = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (INDUSTRY_ALIAS[key]) return INDUSTRY_ALIAS[key];
  if (INDUSTRY_SPINE_BASE[key]) return key;
  return null;
}

/**
 * Resolve a canonical Spine config from a (possibly UI-coded) industry +
 * department. Always returns a config (department falls back through
 * DEPARTMENT_TO_CONFIG_KEY → BIZOPS in the canonical resolver).
 */
export function resolveSpineConfig(
  industry: string | null | undefined,
  department: string,
): SpineConfigShape {
  const canonicalIndustry = resolveCanonicalIndustry(industry);
  return getSpineConfig(canonicalIndustry, department);
}

/**
 * Customer Zero's default identity for connector ingest. IntegrateWise dogfoods
 * its own product: a SaaS company running relationship/inbox-driven ops, so the
 * Gmail pipeline resolves against SAAS_TECH × CUSTOMER_SUCCESS by default.
 */
export const CUSTOMER_ZERO_IDENTITY = {
  industry: "SAAS_TECH",
  department: "CUSTOMER_SUCCESS",
} as const;

/**
 * The canonical ENTITY RECORD the connector pipeline emits per entity instance,
 * AFTER schema-first normalization. This is the shape that flows into governed
 * Spine hydration (memory.propose). `priority_fields` holds the extracted field
 * VALUES (schema decides what survives), keyed by canonical field name.
 */
export interface CanonicalRecord {
  /** Canonical entity_type (e.g. "person", "activity"). */
  entity_type: string;
  /** Extracted canonical field name → value. Only schema-allowed fields survive. */
  priority_fields: Record<string, unknown>;
  /** Field-level policy that governed this extraction (optional). */
  field_policies?: EntityFieldPolicy;
  /** Resolving department/domain. */
  department: string;
  /** Canonical industry key this record was normalized under. */
  industry_relevance: string;
  /** Schema version that produced it — base "1.0.0" or a connector delta. */
  schema_version: string;
  /** Stable cross-run identifier, e.g. "gmail:person:alice@acme.com". */
  external_id: string;
  /** Provenance — which connector + source record produced this. */
  source: { connector: string; source_id: string };
}
