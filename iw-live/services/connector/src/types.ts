/**
 * Connector Service Types
 */

export interface Env {
  DATABASE_URL: string;
  // SUPABASE_* retained in Env for loader sub-worker compatibility (pipeline adaptive schema fallback).
  // Per DECISION 22 the connectors token store + tenant_spine_config use D1 (EDGE_DB).
  // Full removal tracked as part of broader de-Supabase migration.
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  TOKEN_ENCRYPTION_KEY?: string;
  NANGO_SECRET_KEY?: string;
  NANGO_WEBHOOK_SECRET?: string;
  NANGO_BASE_URL?: string; // for nango dev local server
  PIPELINE_QUEUE: Queue;
  KNOWLEDGE_QUEUE?: Queue;
  MCP_IDEMPOTENCY?: KVNamespace;
  CONNECTOR_STATUS?: KVNamespace;
  EDGE_DB?: D1Database;
  FILES?: R2Bucket;
  KNOWLEDGE?: Fetcher;
  CONNECTOR_SYNC?: Fetcher;
  ENVIRONMENT?: string;
  /** @deprecated */
  SPINE?: ServiceBinding;
  /** @deprecated use loader routes directly */
  LOADER?: ServiceBinding;
}

export interface ServiceBinding {
  fetch(request: Request): Promise<Response>;
}

export interface ConnectorConfig {
  entityTypes: string[];
  flowType: "A" | "B" | "C";
  enabled: boolean;
}

export interface TenantSpineConfig {
  tenantId: string;
  domains: string[];
  industry?: string;
  schemaVersion: string;
  allowedEntityTypes: string[];
  connectorConfigs: Record<string, ConnectorConfig>;
  connectedConnectors?: string[];
  depthMatrixSnapshot?: Record<string, any>;
}
