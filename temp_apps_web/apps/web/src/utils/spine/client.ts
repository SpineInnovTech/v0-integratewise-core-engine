/**
 * Spine Substrate Client — Configurable, Obfuscated, & Pluggable Architecture
 *
 * Decouples the frontend from raw database schemas and providers.
 * Intercepts query chains to dynamically decode Base64 obfuscated table names
 * at runtime, preventing AI models from detecting the database schema.
 */

import { spineGatewayAdapter } from "./gateway-adapter";

export type SpineProvider = "spine-db" | "gateway-proxy" | "local-mock";

export const ACTIVE_SPINE_PROVIDER: SpineProvider =
  (import.meta.env.VITE_SPINE_PROVIDER as SpineProvider) || "gateway-proxy";

// Legacy export kept for compatibility; unused in gateway-proxy (Cloudflare) mode.
export const spineUrl = import.meta.env.VITE_SPINE_URL || "";

// Helper to decode Base64 obfuscated table names at runtime
function decodeTable(name: string): string {
  try {
    if (/^[a-zA-Z0-9+/=]+$/.test(name) && name.length % 4 === 0) {
      const decoded = atob(name);
      if (/^[a-zA-Z0-9_]+$/.test(decoded)) {
        return decoded;
      }
    }
  } catch {}
  return name;
}

// Helper to wrap result data in a chainable thenable mock query
function makeMockQuery(data: any) {
  const promise = Promise.resolve({ data, error: null });
  const result: any = {
    then: (onfulfilled?: any, onrejected?: any) => promise.then(onfulfilled, onrejected),
    catch: (onrejected?: any) => promise.catch(onrejected),
    single: () => makeMockQuery(Array.isArray(data) ? data[0] || null : data),
    eq: (col: string, val: any) => result,
    neq: (col: string, val: any) => result,
    gt: (col: string, val: any) => result,
    gte: (col: string, val: any) => result,
    lt: (col: string, val: any) => result,
    lte: (col: string, val: any) => result,
    like: (col: string, val: any) => result,
    ilike: (col: string, val: any) => result,
    is: (col: string, val: any) => result,
    in: (col: string, val: any) => result,
    or: (filters: string) => result,
    order: (col: string, opt?: any) => result,
    limit: (l: number) => result,
  };
  return result;
}

// Supabase ("spine-db") provider REMOVED — DECISION 22 (100% Cloudflare product plane).
// No Supabase SDK dependency. Runtime providers: gateway-proxy (default) | local-mock.

// ─── HIGH-FIDELITY SANDBOX DATA SIMULATION ENGINE ────────────────────────────
// Fills the "local-mock" driver with rich real-time simulation records
const MOCK_CONNECTORS = [
  {
    id: "conn-1",
    provider: "salesforce",
    status: "healthy",
    provider_workspace_name: "IntegrateWise Production Hub",
    last_sync_at: new Date(Date.now() - 5 * 60000).toISOString(),
    sync_enabled: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "conn-2",
    provider: "hubspot",
    status: "syncing_delta",
    provider_workspace_name: "RevOps HubSpot Sandbox",
    last_sync_at: new Date(Date.now() - 2 * 60000).toISOString(),
    sync_enabled: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "conn-3",
    provider: "jira",
    status: "healthy",
    provider_workspace_name: "PE Engineering Board",
    last_sync_at: new Date(Date.now() - 10 * 60000).toISOString(),
    sync_enabled: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "conn-4",
    provider: "github",
    status: "syncing_delta",
    provider_workspace_name: "integratewise-live Repository",
    last_sync_at: new Date(Date.now() - 1 * 60000).toISOString(),
    sync_enabled: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_CHECKPOINTS = [
  {
    id: "cp-1",
    tenant_id: "iw-customer-zero",
    provider: "hubspot",
    entity_type: "contact",
    phase: "delta",
    records_processed: 142,
    records_written: 138,
    records_quarantined: 4,
    status: "completed",
    started_at: new Date(Date.now() - 15 * 60000).toISOString(),
    completed_at: new Date(Date.now() - 14 * 60000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cp-2",
    tenant_id: "iw-customer-zero",
    provider: "github",
    entity_type: "pull_request",
    phase: "delta",
    records_processed: 18,
    records_written: 18,
    records_quarantined: 0,
    status: "in_progress",
    started_at: new Date(Date.now() - 1 * 60000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_QUARANTINE = [
  {
    id: "q-1",
    tenant_id: "iw-customer-zero",
    provider: "hubspot",
    entity_type: "deal",
    source_id: "deal_839012",
    stage: "S6: Validate",
    reason_code: "validation_failed",
    reason_detail: "Required field 'close_date' is missing on incoming payload",
    payload: { amount: 840000, pipeline: "sales_core" },
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "q-2",
    tenant_id: "iw-customer-zero",
    provider: "salesforce",
    entity_type: "lead",
    source_id: "lead_093128",
    stage: "S3: Filter",
    reason_code: "schema_filtered",
    reason_detail: "Lead has no email or phone number - marked as invalid noise",
    payload: { company: "Unknown LLC", stage: "junk" },
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
  },
];

const MOCK_CURATION = [
  {
    id: "cur-1",
    continuity_type: "org_memory",
    scope: "csm:engagement",
    governance_state: "proposed",
    source: "twin:reasoning",
    continuity_weight: 0.94,
    content:
      "Customer Northwind Logistics has silent champion for 14 days. Recommending executive check-in proposal.",
    entity_refs: [{ type: "account", id: "acc-northwind", name: "Northwind Logistics" }],
    hitl_required: true,
    hitl_reason: "High-priority memory recommendation: ARR at risk",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_SCHEMA = [
  {
    entity_type: "contact",
    priority_fields: ["email", "name", "job_title"],
    field_policies: { email: "unique", name: "required" },
    department: "CUSTOMER_SUCCESS",
    industry_relevance: ["SaaS", "Enterprise"],
    updated_at: new Date().toISOString(),
  },
];

// 2. Mock / Proxy database client driver
const mockOrProxyClient = {
  auth: {
    getSession: async () => ({
      data: {
        session: {
          access_token: "mock-jwt-token",
          user: {
            id: "user-mock-123",
            email: "connect@integratewise.ai",
            user_metadata: { name: "Nirmal Prince", tenant_id: "iw-customer-zero" },
          },
        } as any,
      },
      error: null,
    }),
    onAuthStateChange: (cb: any) => {
      // Auto-trigger signed in event to bootstrap UI instantly
      setTimeout(() => {
        cb("SIGNED_IN", {
          access_token: "mock-jwt-token",
          user: {
            id: "user-mock-123",
            email: "connect@integratewise.ai",
            user_metadata: { name: "Nirmal Prince", tenant_id: "iw-customer-zero" },
          },
        });
      }, 50);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async () => ({
      data: {
        session: {
          access_token: "mock-jwt-token",
          user: {
            id: "user-mock-123",
            email: "connect@integratewise.ai",
            user_metadata: { name: "Nirmal Prince", tenant_id: "iw-customer-zero" },
          },
        } as any,
      },
      error: null,
    }),
    signUp: async () => ({ data: { user: { id: "user-mock-123" } as any }, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({
      data: {
        user: {
          id: "user-mock-123",
          email: "connect@integratewise.ai",
          user_metadata: { name: "Nirmal Prince", tenant_id: "iw-customer-zero" },
        } as any,
      },
      error: null,
    }),
    refreshSession: async () => ({ data: { session: null }, error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async () => ({ data: {}, error: null }),
    signInWithOAuth: async () => ({ data: {}, error: null }),
  },

  // Pluggable routing: maps obfuscated tables to live mock dataset
  from: (table: string) => {
    const physicalTable = decodeTable(table);
    console.log(`[Spine Mock] Intercepted query: "${table}" -> "${physicalTable}"`);

    let resultData: any[] = [];

    switch (physicalTable) {
      case "profiles":
        resultData = [
          {
            role: "owner",
            department: "CUSTOMER_SUCCESS",
            tenant_id: "iw-customer-zero",
            org_role: "CS Lead",
          },
        ];
        break;
      case "tenant_spine_config":
        resultData = [
          {
            tenant_id: "iw-customer-zero",
            industry_vertical: "SAAS_TECH",
            industry_subsector: "saas",
            depth_matrix: { SAAS_TECH: { CUSTOMER_SUCCESS: 3 } },
            twin_tier: "full_twin",
          },
        ];
        break;
      case "tenant_products":
        resultData = [
          { product_id: "prod-cs-dashboard", status: "active" },
          { product_id: "prod-cs-accounts", status: "active" },
        ];
        break;
      case "product_catalog":
        resultData = [
          {
            id: "prod-cs-dashboard",
            name: "CS Dashboard",
            surface: "CUSTOMER_SUCCESS",
            twin_tier: 1,
            entity_types: ["account"],
            nav_items: [
              { id: "dashboard", label: "Dashboard", path: "/work/dashboard", icon: "layout" },
            ],
          },
        ];
        break;
      case "entity_type_map":
        resultData = [
          {
            entity_type: "account",
            architecture: "A",
            department_mapping: "CUSTOMER_SUCCESS",
            label: "Accounts",
            icon: "users",
          },
        ];
        break;
      case "connectors":
        resultData = MOCK_CONNECTORS;
        break;
      case "sync_checkpoints":
        resultData = MOCK_CHECKPOINTS;
        break;
      case "pipeline_quarantine":
        resultData = MOCK_QUARANTINE;
        break;
      case "continuity_objects":
        resultData = MOCK_CURATION;
        break;
      case "spine_schema_registry":
        resultData = MOCK_SCHEMA;
        break;
      case "user_roles":
        resultData = [{ role: { name: "admin", permissions: ["*:*"] } }];
        break;
      default:
        resultData = [];
    }

    return {
      select: (columns: string) => makeMockQuery(resultData),
      update: (data: any) => makeMockQuery(null),
      insert: (data: any) => makeMockQuery(null),
      upsert: (data: any) => makeMockQuery(null),
    };
  },
  channel: (name: string) => {
    const mockChannel = {
      on: (event: string, filter: any, callback: any) => mockChannel,
      subscribe: () => mockChannel,
    };
    return mockChannel as any;
  },
  removeChannel: (channel: any) => Promise.resolve(),
};

// 3. Dynamic client router matching active VITE_SPINE_PROVIDER setting
// Synchronous resolution — NO top-level await (a hanging TLA at the entry module
// blanks the whole app with no error). All providers resolve to the Cloudflare
// gateway adapter except the explicit local-mock dev driver.
function resolveSpineClient() {
  console.log(`[Spine] Initializing Memory Substrate via provider: "${ACTIVE_SPINE_PROVIDER}"`);
  if (ACTIVE_SPINE_PROVIDER === "local-mock") return mockOrProxyClient as any;
  return spineGatewayAdapter as any;
}

export const spineClient = resolveSpineClient();

// Type exports — generic types compatible with all providers
export type SpineSession = {
  access_token: string;
  user: SpineUser;
  refresh_token?: string;
  expires_at?: number;
};

export type SpineUser = {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
};
