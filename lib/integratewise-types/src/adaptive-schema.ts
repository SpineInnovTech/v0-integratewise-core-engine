import {
  resolveSuccessSchema,
  type ResolvedSuccessSchema,
  type RoleLens,
} from "./success-schema.js";
import { DOMAIN_SPINE_CONFIG, INDUSTRY_SPINE_BASE, CROSS_DOMAIN_ENTITY_TYPES } from "./schema.js";

export const ADAPTIVE_TENANT_DOMAIN_ALIASES: Record<string, string> = {
  SALES: "SALES",
  Sales: "SALES",
  MARKETING: "MARKETING",
  Marketing: "MARKETING",
  REVOPS: "REVOPS",
  RevOps: "REVOPS",
  "Customer Success": "CUSTOMER_SUCCESS",
  CUSTOMER_SUCCESS: "CUSTOMER_SUCCESS",
  CSM: "CUSTOMER_SUCCESS",
  SUPPORT: "SERVICE",
  Support: "SERVICE",
  SERVICE: "SERVICE",
  "Service Operations": "SERVICE",
  SERVICE_OPS: "SERVICE",
  ENGINEERING: "PRODUCT_ENGINEERING",
  Engineering: "PRODUCT_ENGINEERING",
  PRODUCT_ENGINEERING: "PRODUCT_ENGINEERING",
  PRODUCT: "PRODUCT_ENGINEERING",
  Product: "PRODUCT_ENGINEERING",
  FINANCE: "FINANCE",
  Finance: "FINANCE",
  // Legal/HR are departments in the 12×11 model, but today they share the BIZOPS baseline schema.
  LEGAL: "BIZOPS",
  Legal: "BIZOPS",
  HR: "BIZOPS",
  "Human Resources": "BIZOPS",
  "Supply Chain": "PROCUREMENT",
  // Supply Chain department maps to PROCUREMENT workspace baseline today.
  SUPPLY_CHAIN: "PROCUREMENT",
  PROCUREMENT: "PROCUREMENT",
  Procurement: "PROCUREMENT",
  PROJECTS: "BIZOPS",
  BIZOPS: "BIZOPS",
  IT_ADMIN: "IT_ADMIN",
  STUDENT_TEACHER: "STUDENT_TEACHER",
  PERSONAL: "PERSONAL",
};

/**
 * Domain → entity types mapping.
 * DERIVED from DOMAIN_SPINE_CONFIG — the SINGLE SOURCE OF TRUTH.
 * Do NOT maintain a separate copy. This is computed at module load from schema.ts.
 */
export const ADAPTIVE_DOMAIN_TO_ENTITY_TYPES: Record<string, string[]> = Object.fromEntries(
  Object.entries(DOMAIN_SPINE_CONFIG).map(([key, config]) => [key, [...config.entity_types]])
);

/**
 * Canonical 11 industries (vertical axis) — minimal entity-type expansions per industry.
 * These extras are additive on top of Department-derived baselines.
 *
 * DERIVED from INDUSTRY_SPINE_BASE in schema.ts — the SINGLE SOURCE OF TRUTH.
 */
export const ADAPTIVE_INDUSTRY_ENTITY_TYPES_EXTRA: Record<string, string[]> = Object.fromEntries(
  Object.entries(INDUSTRY_SPINE_BASE).map(([key, profile]) => [
    key,
    profile.entity_types_extra ? [...profile.entity_types_extra] : [],
  ])
);

/**
 * Re-export from canonical source. Kept for backward compatibility.
 */
export const ADAPTIVE_CROSS_DOMAIN_ENTITY_TYPES = CROSS_DOMAIN_ENTITY_TYPES;

export const ADAPTIVE_SCHEMA_PRESERVED_FIELDS = [
  "id",
  "external_id",
  "source_id",
  "source",
  "source_system",
  "tenant_id",
  "created_at",
  "updated_at",
  "timestamp",
  "name",
  "title",
  "email",
  "subject",
] as const;

export interface ResolvedAdaptiveSchema {
  tenantId: string;
  domains: string[];
  domainKeys: string[];
  industry?: string | null;
  activeCtx?: string | null;
  connectedConnectors: string[];
  allowedEntityTypes: string[];
  fieldsByEntity: Record<string, string[]>;
  successSchema: ResolvedSuccessSchema;
}

type TenantConfigRow = {
  domains?: string[] | null;
  industry?: string | null;
  connected_connectors?: string[] | null;
  active_ctx?: string | null;
};

type RegistryRow = {
  entity_type?: string | null;
  field_path?: string | null;
  field_key?: string | null;
};

type ExpectedFieldRow = {
  entity_type?: string | null;
  expected_fields?: unknown;
};

const schemaCache = new Map<string, { expiresAt: number; value: ResolvedAdaptiveSchema | null }>();
const SCHEMA_CACHE_TTL_MS = 60_000;

export function clearResolvedAdaptiveSchemaCache(tenantId?: string): void {
  if (!tenantId) {
    schemaCache.clear();
    return;
  }

  for (const key of schemaCache.keys()) {
    if (key.startsWith(`${tenantId}:`)) {
      schemaCache.delete(key);
    }
  }
}

function parseFieldList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function normalizeFieldName(field: string): string[] {
  const trimmed = field.trim();
  if (!trimmed) return [];
  const parts = trimmed
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1];
  return Array.from(new Set([trimmed, last]));
}

export function normalizeAdaptiveSchemaDomains(domains: string[]): string[] {
  return Array.from(
    new Set(
      domains.map((domain) => ADAPTIVE_TENANT_DOMAIN_ALIASES[domain] || domain).filter(Boolean)
    )
  );
}

export function getBaselineAdaptiveEntityTypes(
  domains: string[],
  industry?: string | null
): string[] {
  const allowed = new Set<string>();
  for (const domain of normalizeAdaptiveSchemaDomains(domains)) {
    const entityTypes = ADAPTIVE_DOMAIN_TO_ENTITY_TYPES[domain];
    if (!entityTypes) continue;
    for (const entityType of entityTypes) allowed.add(entityType);
  }
  if (allowed.size > 0) {
    for (const entityType of ADAPTIVE_CROSS_DOMAIN_ENTITY_TYPES) allowed.add(entityType);
  }
  if (industry) {
    const extras = ADAPTIVE_INDUSTRY_ENTITY_TYPES_EXTRA[industry] || [];
    for (const entityType of extras) allowed.add(entityType);
  }
  return Array.from(allowed);
}

async function fetchRestRows<T>(
  supabaseUrl: string,
  serviceRoleKey: string,
  path: string
): Promise<T[]> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  if (!response.ok) return [];
  return (await response.json()) as T[];
}

export async function resolveTenantAdaptiveSchema(params: {
  supabaseUrl?: string;
  serviceRoleKey?: string;
  tenantId: string;
  forceRefresh?: boolean;
  requestedLens?: RoleLens;
  db?: any;
}): Promise<ResolvedAdaptiveSchema | null> {
  const { supabaseUrl, serviceRoleKey, tenantId, forceRefresh, requestedLens, db } = params;
  if (!tenantId) return null;
  if (!db && (!supabaseUrl || !serviceRoleKey)) return null;

  const cacheKey = `${tenantId}:${supabaseUrl || "local"}:${requestedLens || "auto"}`;
  const cached = schemaCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let tenantConfig: TenantConfigRow | undefined;
  let registryRows: RegistryRow[] = [];
  let expectedFieldRows: ExpectedFieldRow[] = [];
  let dbFetchSuccess = false;

  if (db) {
    try {
      const [configResult, registryResult, expectedResult] = await Promise.all([
        db
          .prepare(
            "SELECT domains, industry, connected_connectors, depth_matrix_snapshot FROM tenant_spine_config WHERE tenant_id = ?"
          )
          .bind(tenantId)
          .first() as Promise<any>,
        db
          .prepare(
            "SELECT entity_type, field_path, field_key FROM spine_schema_registry WHERE tenant_id = ?"
          )
          .bind(tenantId)
          .all() as Promise<any>,
        db
          .prepare("SELECT entity_type, expected_fields FROM spine_expected_fields")
          .all() as Promise<any>,
      ]);

      const configRow = configResult as {
        domains: string;
        industry: string | null;
        connected_connectors: string;
        depth_matrix_snapshot: string | null;
      } | null;

      const registryObj = registryResult as { results?: RegistryRow[] };
      const expectedObj = expectedResult as {
        results?: { entity_type: string; expected_fields: string }[];
      };

      if (configRow) {
        let domains: string[] = [];
        try {
          domains = JSON.parse(configRow.domains) ?? [];
        } catch {
          /* ignore malformed JSON */
        }

        let connected_connectors: string[] = [];
        try {
          connected_connectors = JSON.parse(configRow.connected_connectors) ?? [];
        } catch {
          /* ignore malformed JSON */
        }

        let depth_matrix_snapshot: Record<string, unknown> = {};
        if (configRow.depth_matrix_snapshot) {
          try {
            depth_matrix_snapshot = JSON.parse(configRow.depth_matrix_snapshot) ?? {};
          } catch {
            /* ignore malformed JSON */
          }
        }

        // D1 table lacks active_ctx; resolve it from depth_matrix_snapshot or default to CTX_BIZOPS
        const active_ctx = (depth_matrix_snapshot.active_ctx ||
          depth_matrix_snapshot.activeCtx ||
          "CTX_BIZOPS") as string;

        tenantConfig = {
          domains,
          industry: configRow.industry,
          connected_connectors,
          active_ctx,
        };

        registryRows = registryObj.results || [];
        expectedFieldRows = (expectedObj.results || []).map((row: any) => {
          let expected_fields: unknown = [];
          try {
            expected_fields = JSON.parse(row.expected_fields);
          } catch {
            /* ignore malformed JSON */
          }
          return {
            entity_type: row.entity_type,
            expected_fields,
          };
        });

        dbFetchSuccess = true;
      }
    } catch (err) {
      console.warn("[adaptive-schema] D1 query failed, falling back to Supabase/REST:", err);
    }
  }

  if (!dbFetchSuccess) {
    if (!supabaseUrl || !serviceRoleKey) return null;
    const [tenantConfigRows, registryRowsData, expectedFieldRowsData] = await Promise.all([
      fetchRestRows<TenantConfigRow>(
        supabaseUrl,
        serviceRoleKey,
        `/rest/v1/tenant_spine_config?tenant_id=eq.${encodeURIComponent(tenantId)}&select=domains,industry,connected_connectors,active_ctx`
      ),
      fetchRestRows<RegistryRow>(
        supabaseUrl,
        serviceRoleKey,
        `/rest/v1/spine_schema_registry?tenant_id=eq.${encodeURIComponent(tenantId)}&select=entity_type,field_path,field_key`
      ),
      fetchRestRows<ExpectedFieldRow>(
        supabaseUrl,
        serviceRoleKey,
        "/rest/v1/spine_expected_fields?select=entity_type,expected_fields"
      ),
    ]);

    tenantConfig = tenantConfigRows[0];
    registryRows = registryRowsData;
    expectedFieldRows = expectedFieldRowsData;
  }

  const domains = Array.isArray(tenantConfig?.domains) ? tenantConfig.domains.filter(Boolean) : [];
  const domainKeys = normalizeAdaptiveSchemaDomains(domains);
  const connectedConnectors = Array.isArray(tenantConfig?.connected_connectors)
    ? tenantConfig.connected_connectors.filter(Boolean)
    : [];

  const baselineEntityTypes = new Set<string>(
    getBaselineAdaptiveEntityTypes(domains, tenantConfig?.industry ?? null)
  );
  const grownEntityTypes = new Set<string>();
  const fieldsByEntity = new Map<string, Set<string>>();

  for (const row of expectedFieldRows) {
    const entityType = row.entity_type || "";
    if (!entityType || (!baselineEntityTypes.has(entityType) && baselineEntityTypes.size > 0))
      continue;
    const fields = parseFieldList(row.expected_fields);
    if (!fieldsByEntity.has(entityType)) fieldsByEntity.set(entityType, new Set());
    const fieldSet = fieldsByEntity.get(entityType)!;
    for (const field of fields) {
      for (const normalized of normalizeFieldName(field)) fieldSet.add(normalized);
    }
  }

  for (const row of registryRows) {
    const entityType = row.entity_type || "";
    const field = row.field_path || row.field_key || "";
    if (!entityType) continue;
    grownEntityTypes.add(entityType);
    if (!fieldsByEntity.has(entityType)) fieldsByEntity.set(entityType, new Set());
    if (field) {
      const fieldSet = fieldsByEntity.get(entityType)!;
      for (const normalized of normalizeFieldName(field)) fieldSet.add(normalized);
    }
  }

  const preliminaryAllowedEntityTypes = Array.from(
    new Set([...baselineEntityTypes, ...grownEntityTypes])
  );
  const mergedFieldsByEntity = Object.fromEntries(
    Array.from(fieldsByEntity.entries()).map(([entityType, fieldSet]) => [
      entityType,
      Array.from(fieldSet).sort(),
    ])
  );
  const successSchema = resolveSuccessSchema({
    domains,
    industry: tenantConfig?.industry ?? null,
    activeCtx: tenantConfig?.active_ctx ?? null,
    connectedConnectors,
    allowedEntityTypes: preliminaryAllowedEntityTypes,
    fieldsByEntity: mergedFieldsByEntity,
    requestedLens,
  });
  const resolved: ResolvedAdaptiveSchema = {
    tenantId,
    domains,
    domainKeys,
    industry: tenantConfig?.industry ?? null,
    activeCtx: tenantConfig?.active_ctx ?? null,
    connectedConnectors,
    allowedEntityTypes: successSchema.allowedEntityTypes,
    fieldsByEntity: successSchema.allowedFieldsByEntity,
    successSchema,
  };

  schemaCache.set(cacheKey, { expiresAt: Date.now() + SCHEMA_CACHE_TTL_MS, value: resolved });
  return resolved;
}

export function getAllowedFieldSetForEntity(
  schema: ResolvedAdaptiveSchema | null | undefined,
  entityType: string
): Set<string> | null {
  if (!schema || !entityType) return null;
  const fields = schema.fieldsByEntity[entityType];
  if (!fields || fields.length === 0) return null;
  return new Set<string>([...fields, ...ADAPTIVE_SCHEMA_PRESERVED_FIELDS]);
}

export function pruneRecordToResolvedSchema(
  record: Record<string, unknown>,
  allowedFields: Set<string> | null
): { record: Record<string, unknown>; droppedFields: string[] } {
  if (!allowedFields) return { record, droppedFields: [] };

  const next: Record<string, unknown> = {};
  const droppedFields: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("_") || key.startsWith("xref_") || allowedFields.has(key)) {
      next[key] = value;
    } else {
      droppedFields.push(key);
    }
  }

  return { record: next, droppedFields };
}
