/**
 * ADK Type Definitions
 */

/** A stable capability that AI clients can invoke */
export interface Capability {
  /** Stable name (never changes) — e.g. "spine.entity.read" */
  name: string;
  /** Human description for AI tool listing */
  description: string;
  /** Minimum subscription tier required */
  min_tier: "free" | "starter" | "pro" | "enterprise";
  /** Required scopes */
  scopes: string[];
  /** Whether a connected source is required */
  requires_connector: boolean;
  /** The routing config */
  routing: {
    primary: RouteTarget;
    fallback?: RouteTarget;
  };
}

/** Where to route a capability call */
export interface RouteTarget {
  /** Implementation type */
  type:
    | "LOCAL_D1"
    | "ENCRYPTED_VAULT"
    | "VECTOR_INDEX"
    | "KV_CACHE"
    | "SERVICE_BINDING"
    | "NANGO_PROXY";
  /** D1 table or KV key pattern or service name */
  target: string;
  /** Lookup strategy */
  strategy: "index_lookup" | "full_scan" | "semantic_query" | "kv_get" | "service_call";
}

/** Context for routing decisions */
export interface RoutingContext {
  tenant_id: string;
  user_id: string;
  role: string;
  tier: "free" | "starter" | "pro" | "enterprise";
  connected_sources: string[];
  allowed_entity_types: string[];
}

/** Tenant configuration (cached in KV, 5-min TTL) */
export interface TenantContext {
  tenant_id: string;
  tier: "free" | "starter" | "pro" | "enterprise";
  domains: string[];
  industry: string;
  allowed_entity_types: string[];
  connected_connectors: string[];
  schema_version: string;
}

/** A request to resolve a capability */
export interface CapabilityRequest {
  /** Capability name */
  capability: string;
  /** Arguments from the AI client */
  arguments: Record<string, unknown>;
  /** Routing context */
  context: RoutingContext;
}

/** Response from capability resolution */
export interface CapabilityResponse {
  /** Whether resolution succeeded */
  resolved: boolean;
  /** The route target chosen */
  target?: RouteTarget;
  /** Error code if not resolved */
  error?:
    | "CAPABILITY_NOT_FOUND"
    | "PLAN_INSUFFICIENT"
    | "CONNECTOR_NOT_AVAILABLE"
    | "CONNECTOR_SYNCING"
    | "RESOLVER_DEGRADED";
  /** Human message */
  message?: string;
  /** For CONNECTOR_NOT_AVAILABLE: URL to connect */
  connect_url?: string;
  /** For PLAN_INSUFFICIENT: URL to upgrade */
  upgrade_url?: string;
  /** For CONNECTOR_SYNCING: progress */
  sync_progress?: number;
}

/** Fallback chain definition */
export interface FallbackChain {
  steps: RouteTarget[];
  /** Max time for the entire chain (ms) */
  timeout_ms: number;
}
