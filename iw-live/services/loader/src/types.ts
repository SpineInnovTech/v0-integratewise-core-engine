/**
 * Loader Service Types
 *
 * The Loader runs embedded inside the Connector worker (v3.6 consolidated architecture).
 * At runtime, `env` is the Connector worker's Env, which provides all bindings below.
 */

import type { PipelineQueueMessage } from "@integratewise/types";

export interface Env {
  [key: string]: unknown;

  /** Neon Postgres connection string (legacy; being phased out per DECISION 22) */
  DATABASE_URL: string;

  /** Supabase URL + service key — legacy only. Connectors token store and tenant_spine_config are D1.
   *  Still used by resolveTenantAdaptiveSchema fallback during migration. Make optional to allow clean desupabase.
   */
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  /** AES-256-GCM key for token encryption/decryption */
  TOKEN_ENCRYPTION_KEY?: string;

  /** Pipeline queue — normalized records go here for 8-stage processing */
  PIPELINE_QUEUE: Queue<PipelineQueueMessage>;

  /** Legacy loader queue (unused in v3.6) */
  LOADER_QUEUE?: Queue<LoaderMessage>;

  /** Spine service binding (Pipeline self-binding) */
  SPINE?: ServiceBinding;

  /** Connector-Sync service binding — used by scheduled() to trigger syncs */
  CONNECTOR_SYNC?: Fetcher;

  /** KV namespace for connector status + job tracking */
  CONNECTOR_STATUS?: KVNamespace;

  /** D1 edge DB for cursors and dedup */
  EDGE_DB?: D1Database;
}

/** @deprecated Use PipelineQueueMessage from @integratewise/types instead */
export interface PipelineMessage {
  job_id: string;
  tenant_id: string;
  connector: string;
  entity_types: string[];
  phase: "creamy" | "needed" | "delta";
  records: Array<Record<string, any>>;
  metadata: {
    extracted_at?: string;
    count?: number;
    [key: string]: any;
  };
}

export interface LoaderMessage {
  tenant_id: string;
  connector: string;
  phase: "needed" | "delta";
  job_id: string;
}

export interface ServiceBinding {
  fetch(request: Request): Promise<Response>;
}

/**
 * Schema config row from `tenant_spine_config` table (SSOT).
 *
 * Post-migration 079: tenant_spine_config is the single source of truth
 * for tenant schema. The old `tenant_schema_configs` table was never created
 * in production and all references are now converged here.
 *
 * - `domains` + `industry` define the tenant's shape
 * - `allowed_entity_types` is materialized at onboarding time
 * - `connector_configs` stores per-connector settings
 */
export interface TenantSpineConfig {
  tenant_id: string;
  domains: string[];
  industry?: string;
  company_size?: string;
  user_type?: string;
  org_type?: string;
  schema_version: string;
  active_ctx?: string;
  allowed_entity_types: string[];
  connector_configs: Record<
    string,
    {
      entityTypes: string[];
      flowType: "A" | "B" | "C";
      enabled: boolean;
    }
  >;
  connected_connectors?: string[];
  depth_matrix_snapshot?: Record<string, any>;
  updated_at?: string;
}
