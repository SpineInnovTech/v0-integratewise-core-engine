import {
  BASE_SCHEMA_VERSION,
  ALL_CANONICAL_INDUSTRIES,
  ALL_DEPARTMENT_CONFIG_KEYS,
  INDUSTRY_ALIAS,
  INDUSTRY_SPINE_BASE,
  CUSTOMER_ZERO_IDENTITY,
  resolveCanonicalIndustry,
  resolveSpineConfig,
} from "@workspace/spine-schema";
import { listDeltas, type DeltaFilters } from "../repositories/schema-pool";

/**
 * The relay-owned canonical schema registry. The BASE (12 departments × 11
 * industries) lives in @workspace/spine-schema and is NEVER regenerated; this
 * service only reads it and layers in connector deltas from schema_pool.
 */
export function getBaseCatalog() {
  return {
    base_version: BASE_SCHEMA_VERSION,
    departments: ALL_DEPARTMENT_CONFIG_KEYS,
    industries: ALL_CANONICAL_INDUSTRIES,
    industry_aliases: INDUSTRY_ALIAS,
    industry_profiles: INDUSTRY_SPINE_BASE,
    default_identity: CUSTOMER_ZERO_IDENTITY,
  };
}

/** Spine Schema = f(industry, department) — the composed canonical config. */
export function getResolvedConfig(
  industryRaw: string | null | undefined,
  department: string,
) {
  const canonical = resolveCanonicalIndustry(industryRaw);
  const config = resolveSpineConfig(industryRaw, department);
  return {
    base_version: BASE_SCHEMA_VERSION,
    industry: { input: industryRaw ?? null, canonical },
    department,
    entity_types: config.entity_types,
    priority_fields: config.priority_fields,
    field_policies: config.field_policies ?? {},
  };
}

export async function getDeltas(filters: DeltaFilters) {
  return listDeltas(filters);
}
