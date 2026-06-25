/**
 * Schema Accessor - Service-side schema resolution
 *
 * Used by:
 * - Loader: Fetches schema to know which fields to extract
 * - Normalizer: S3 Filter, S5 Extract, S6 Validate stages
 * - BFF: Transforms technical names to organic labels
 *
 * Cache Strategy:
 * - Schema resolved at onboarding and cached in KV
 * - Cache key: schema:{tenant_id}:{department}:{industry}
 * - TTL: 24 hours (schema changes are rare)
 */

import type {
  ResolvedSchema,
  SchemaReference,
  SpineConfigShape,
  OrganicCapability,
  ValidationError,
  NormalizerStage,
} from "./schema.js";
import {
  DOMAIN_SPINE_CONFIG,
  DEPARTMENT_TO_CONFIG_KEY,
  getSpineConfig,
  normalizeDepartmentId,
  generateSchemaCacheKey,
  isEntityTypeAllowed,
  getPriorityFields,
  validateFieldValue,
  getOrganicCapabilities,
  fieldToOrganicLabel,
  entityToOrganicSection,
} from "./schema.js";

export interface SchemaCache {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface SchemaDatabase {
  /** Fetch tenant spine config JSON from database */
  getTenantSpineConfig(tenantId: string): Promise<{
    domains?: string[];
    industry?: string;
    schema_version?: string;
  } | null>;

  /** Store resolved schema for caching */
  storeResolvedSchema?(tenantId: string, schema: ResolvedSchema): Promise<void>;
}

export interface SchemaAccessorOptions {
  cache?: SchemaCache;
  db?: SchemaDatabase;
  /** Cache TTL in seconds (default: 86400 = 24h) */
  cacheTtl?: number;
  /** Default schema version */
  defaultVersion?: string;
}

/**
 * Schema Accessor - Main class for service-side schema resolution
 *
 * Usage:
 * ```typescript
 * const accessor = new SchemaAccessor({ cache: env.KV, db: supabaseClient });
 * const schema = await accessor.resolveSchema(tenantId, department, industry);
 * ```
 */
export class SchemaAccessor {
  private cache?: SchemaCache;
  private db?: SchemaDatabase;
  private cacheTtl: number;
  private defaultVersion: string;

  constructor(options: SchemaAccessorOptions = {}) {
    this.cache = options.cache;
    this.db = options.db;
    this.cacheTtl = options.cacheTtl || 86400; // 24 hours
    this.defaultVersion = options.defaultVersion || "v1";
  }

  /**
   * Resolve schema for tenant
   * Checks cache first, then builds from DOMAIN_SPINE_CONFIG
   */
  async resolveSchema(
    tenantId: string,
    department: string,
    industry?: string | null
  ): Promise<ResolvedSchema> {
    const cacheKey = generateSchemaCacheKey(tenantId, department, industry);

    // 1. Try cache
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as ResolvedSchema;
        } catch {
          // Invalid cache, continue to resolve
        }
      }
    }

    // 2. Try to get from tenant config in DB
    let resolvedIndustry = industry;
    let resolvedDepartment = department;

    if (this.db && (!industry || !department)) {
      try {
        const tenantConfig = await this.db.getTenantSpineConfig(tenantId);
        if (tenantConfig) {
          if (!industry) {
            resolvedIndustry = tenantConfig.industry ?? null;
          }
          if (!department && tenantConfig.domains?.length) {
            resolvedDepartment = tenantConfig.domains[0];
          }
        }
      } catch {
        // Ignore DB errors, use defaults
      }
    }

    // 3. Build schema from config
    const normalizedDept = normalizeDepartmentId(resolvedDepartment);
    const config = getSpineConfig(resolvedIndustry, normalizedDept);

    const schema: ResolvedSchema = {
      tenant_id: tenantId,
      department: normalizedDept,
      industry: resolvedIndustry ?? null,
      version: this.defaultVersion,
      entity_types: config.entity_types,
      priority_fields: config.priority_fields,
      resolved_at: new Date().toISOString(),
    };

    // 4. Cache the resolved schema
    if (this.cache) {
      await this.cache.put(cacheKey, JSON.stringify(schema), {
        expirationTtl: this.cacheTtl,
      });
    }

    // 5. Optionally store in DB
    if (this.db?.storeResolvedSchema) {
      await this.db.storeResolvedSchema(tenantId, schema);
    }

    return schema;
  }

  /**
   * Get schema from cache only (fast path)
   */
  async getCachedSchema(
    tenantId: string,
    department: string,
    industry?: string | null
  ): Promise<ResolvedSchema | null> {
    if (!this.cache) return null;

    const cacheKey = generateSchemaCacheKey(tenantId, department, industry);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as ResolvedSchema;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Invalidate schema cache
   */
  async invalidateSchema(
    tenantId: string,
    department: string,
    industry?: string | null
  ): Promise<void> {
    if (!this.cache) return;

    const cacheKey = generateSchemaCacheKey(tenantId, department, industry);
    await this.cache.delete(cacheKey);
  }

  /**
   * S3 Filter: Check if entity type is allowed
   */
  filterEntityType(schema: ResolvedSchema, entityType: string): boolean {
    return isEntityTypeAllowed(schema, entityType);
  }

  /**
   * S5 Extract: Get priority fields for entity
   */
  extractFields(schema: ResolvedSchema, entityType: string): string[] {
    return getPriorityFields(schema, entityType);
  }

  /**
   * S6 Validate: Validate a field value
   */
  validateField(field: string, value: unknown): ValidationError | null {
    return validateFieldValue(field, value);
  }

  /**
   * S6 Validate: Validate all fields of an entity
   */
  validateEntity(
    schema: ResolvedSchema,
    entityType: string,
    data: Record<string, unknown>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const priorityFields = this.extractFields(schema, entityType);

    for (const field of priorityFields) {
      const value = data[field];
      const error = this.validateField(field, value);
      if (error) {
        errors.push({ ...error, entity_type: entityType });
      }
    }

    return errors;
  }

  /**
   * Get organic capabilities for UI
   */
  getCapabilities(department: string): OrganicCapability[] {
    return getOrganicCapabilities(department);
  }

  /**
   * Transform technical field name to organic label
   */
  toOrganicLabel(fieldName: string): string {
    return fieldToOrganicLabel(fieldName);
  }

  /**
   * Transform entity type to organic section title
   */
  toOrganicSection(entityType: string): string {
    return entityToOrganicSection(entityType);
  }

  /**
   * Get raw config for a department
   */
  getRawConfig(department: string): SpineConfigShape {
    const configKey = DEPARTMENT_TO_CONFIG_KEY[department] || department;
    return DOMAIN_SPINE_CONFIG[configKey] || DOMAIN_SPINE_CONFIG.BIZOPS;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE-SPECIFIC SCHEMA HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Stage3FilterInput {
  entity_type: string;
  raw_data: unknown;
}

export interface Stage5ExtractInput {
  entity_type: string;
  data: Record<string, unknown>;
}

export interface Stage6ValidateInput {
  entity_type: string;
  data: Record<string, unknown>;
}

/**
 * Normalizer Stage 3: Filter entities to allowed types
 */
export function stage3Filter(
  schema: ResolvedSchema,
  inputs: Stage3FilterInput[]
): Stage3FilterInput[] {
  return inputs.filter((input) => isEntityTypeAllowed(schema, input.entity_type));
}

/**
 * Normalizer Stage 5: Extract only priority fields
 */
export function stage5Extract(
  schema: ResolvedSchema,
  input: Stage5ExtractInput
): Record<string, unknown> {
  const priorityFields = getPriorityFields(schema, input.entity_type);
  const extracted: Record<string, unknown> = {};

  for (const field of priorityFields) {
    if (field in input.data) {
      extracted[field] = input.data[field];
    }
  }

  return extracted;
}

/**
 * Normalizer Stage 6: Validate extracted data
 */
export function stage6Validate(
  schema: ResolvedSchema,
  input: Stage6ValidateInput
): { isValid: boolean; errors: ValidationError[] } {
  const errors = new SchemaAccessor().validateEntity(schema, input.entity_type, input.data);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Message passed through the 8-stage normalizer pipeline */
export interface PipelineMessage {
  /** Unique message ID */
  message_id: string;
  /** Tenant ID */
  tenant_id: string;
  /** Current stage */
  stage: NormalizerStage;
  /** Schema reference (not full schema - resolved at each stage) */
  schema_ref: SchemaReference;
  /** Entities being processed */
  entities: PipelineEntity[];
  /** Metadata */
  metadata: {
    source: string;
    connector_id: string;
    received_at: string;
    processed_at?: string;
  };
  /** Processing context */
  context: {
    stage_results: Record<NormalizerStage, StageResult>;
    errors: PipelineError[];
  };
}

export interface PipelineEntity {
  entity_id: string;
  entity_type: string;
  source_id: string;
  data: Record<string, unknown>;
  extracted?: Record<string, unknown>;
  validation_errors?: ValidationError[];
  spine_table?: string;
}

export interface StageResult {
  status: "pending" | "processing" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
  entity_count?: number;
  error_count?: number;
}

export interface PipelineError {
  stage: NormalizerStage;
  entity_id?: string;
  error: string;
  severity: "warning" | "error";
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Create schema accessor from Cloudflare Worker environment */
export function createSchemaAccessor(env: {
  KV_CACHE?: {
    get: (k: string) => Promise<string | null>;
    put: (k: string, v: string, opts?: any) => Promise<void>;
    delete: (k: string) => Promise<void>;
  };
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}): SchemaAccessor {
  const cache: SchemaCache | undefined = env.KV_CACHE
    ? {
        get: (k) => env.KV_CACHE!.get(k),
        put: (k, v, opts) => env.KV_CACHE!.put(k, v, opts),
        delete: (k) => env.KV_CACHE!.delete(k),
      }
    : undefined;

  return new SchemaAccessor({ cache });
}

/** Create a pipeline message */
export function createPipelineMessage(
  tenantId: string,
  connectorId: string,
  source: string,
  entities: Array<{ entity_type: string; source_id: string; data: Record<string, unknown> }>
): PipelineMessage {
  const now = new Date().toISOString();

  return {
    message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: tenantId,
    stage: "analyze",
    schema_ref: {
      tenant_id: tenantId,
      schema_version: "v1",
      cache_key: generateSchemaCacheKey(tenantId, "unknown", null),
    },
    entities: entities.map((e, i) => ({
      entity_id: `ent_${Date.now()}_${i}`,
      entity_type: e.entity_type,
      source_id: e.source_id,
      data: e.data,
    })),
    metadata: {
      source,
      connector_id: connectorId,
      received_at: now,
    },
    context: {
      stage_results: {
        analyze: { status: "pending" },
        classify: { status: "pending" },
        filter: { status: "pending" },
        refine: { status: "pending" },
        extract: { status: "pending" },
        validate: { status: "pending" },
        sanity: { status: "pending" },
        sectorize: { status: "pending" },
      },
      errors: [],
    },
  };
}

// Re-export types (avoiding duplicates with schema.ts)
export type {
  ResolvedSchema,
  SchemaReference,
  OrganicCapability,
  ValidationError,
  NormalizerStage,
} from "./schema.js";
