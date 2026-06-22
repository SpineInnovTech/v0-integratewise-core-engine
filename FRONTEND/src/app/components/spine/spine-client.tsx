/**
 * Spine Client — CF Gateway Consumer
 *
 * Single entry point to the IntegrateWise backend.
 * Backend: integratewise-live (NirmalPrinceJ/integratewise-live)
 * Gateway: integratewise-gateway Worker
 *
 * Auth: Clerk JWT → Authorization: Bearer <token>
 * All surfaces (CF Pages, Replit, embedded) call the same gateway URL.
 * Internal service bindings (CONTINUITY, KNOWLEDGE, PIPELINE) are backend-only.
 *
 * Confirmed gateway contract (integratewise-gateway):
 *   POST /api/v1/entity/:type/:id     → Entity 360
 *   POST /api/v1/memory/query          → Semantic memory search
 *   POST /api/v1/twin/propose          → Twin proposal
 *   POST /api/v1/signals               → Active signals
 *   POST /api/v1/insights              → Generated insights
 *   POST /api/v1/predictions           → Predictions
 *   POST /api/v1/handoff               → Handoff dispatch
 *   WS   /api/v1/stream                → Real-time SSE/WebSocket
 *   MCP  /api/v1/mcp                   → MCP Server
 *   GET  /api/v1/health                → Health / Info
 *
 * ⚠️  SWAP THIS URL when CF gateway endpoint is confirmed:
 */

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

// CF GATEWAY URL — swap when confirmed
// Format: https://integratewise-gateway.<account>.workers.dev
// or custom domain once routed
const API_BASE = import.meta.env.VITE_IW_GATEWAY_URL || "https://mcp.integratewise.ai";

// Auth: Clerk JWT Bearer token
// Set via useClerk().session?.getToken() once Clerk publishable key is active
// Clerk instance: 2fbdfb23-4fc5-4d14-815c-c2932876753f
const getAuthHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Legacy headers — used until Clerk JWT is wired
const headers = {
  "Content-Type": "application/json",
};

// Silences expected 4xx errors during gateway wiring.
// Legacy paths (/spine/*, /domain/*) return errors from the CF gateway — expected.
// Real paths (/api/v1/*) will be wired once gateway URL is confirmed.
function logIfUnexpected(tag: string, err: any, status?: number) {
  if ((status !== undefined && status >= 400 && status < 500) ||
      String(err?.error ?? "").toLowerCase().includes("not found") ||
      String(err?.message ?? "").toLowerCase().includes("not found")) return;
  console.error(tag, err);
}

// ─── Readiness Types (mirror of server) ──────────────────────────────────────

export type ReadinessState = "off" | "adding" | "seeded" | "live";

export interface ReadinessBucket {
  capability: string;
  state: ReadinessState;
  label: string;
  description: string;
  coverage: number;
  completeness: number;
  freshness: number;
  confidence: number;
  score: number;
}

export interface DepartmentReadiness {
  department: string;
  label: string;
  overallState: ReadinessState;
  overallScore: number;
  buckets: ReadinessBucket[];
}

// ─── Provenance (for showing data lineage in UI) ─────────────────────────────

export interface Provenance {
  sourceToolId: string;
  sourceToolName: string;
  rawId: string;
  syncedAt: string;
  confidence: number;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function initializeSpine(params: {
  connectedApps: string[];
  userName: string;
  role: string;
  tenantId?: string;
}) {
  const res = await fetch(`${API_BASE}/spine/initialize`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[SpineClient] Initialize failed:", err);
    throw new Error(err.error || "Failed to initialize Spine");
  }
  return res.json();
}

export async function fetchProjection<T = any>(department: string, tenantId = "t1"): Promise<T> {
  const res = await fetch(`${API_BASE}/spine/projection/${department}?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    logIfUnexpected(`[SpineClient] Projection fetch failed for ${department}:`, err, res.status);
    throw new Error(err.error || `Failed to fetch ${department} projection`);
  }
  return res.json();
}

export async function fetchReadiness(tenantId = "t1"): Promise<Record<string, DepartmentReadiness>> {
  const res = await fetch(`${API_BASE}/spine/readiness?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    logIfUnexpected("[SpineClient] Readiness fetch failed:", err, res.status);
    throw new Error(err.error || "Failed to fetch readiness");
  }
  return res.json();
}

export async function fetchEntities<T = any>(type: string, tenantId = "t1"): Promise<{ type: string; count: number; entities: T[]; provenance: any }> {
  const res = await fetch(`${API_BASE}/spine/entities/${type}?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] Entity fetch failed for ${type}:`, err);
    throw new Error(err.error || `Failed to fetch ${type} entities`);
  }
  return res.json();
}

export async function fetchSpineMetadata(tenantId = "t1") {
  const res = await fetch(`${API_BASE}/spine/metadata?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[SpineClient] Metadata fetch failed:", err);
    throw new Error(err.error || "Failed to fetch metadata");
  }
  return res.json();
}

export async function addConnector(connectorId: string, tenantId = "t1") {
  const res = await fetch(`${API_BASE}/spine/connector/add`, {
    method: "POST",
    headers,
    body: JSON.stringify({ connectorId, tenantId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] Add connector failed for ${connectorId}:`, err);
    throw new Error(err.error || `Failed to add connector ${connectorId}`);
  }
  return res.json();
}

// ─── CSM Intelligence API ───────────────────────────────────────────────────

/**
 * Initialize the CSM Intelligence 16-table data model in the KV store.
 * Called after Spine init — sends the local seed data to the server.
 */
export async function initializeCSM(tables: Record<string, any[]>, tenantId = "t1") {
  const res = await fetch(`${API_BASE}/csm/initialize`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tenantId, tables }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[SpineClient] CSM initialize failed:", err);
    throw new Error(err.error || "Failed to initialize CSM Intelligence data");
  }
  return res.json();
}

/**
 * Fetch all records from a CSM entity table.
 */
export async function fetchCSMTable<T = any>(table: string, tenantId = "t1"): Promise<{ table: string; count: number; data: T[] }> {
  const res = await fetch(`${API_BASE}/csm/${table}?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] CSM table fetch failed for ${table}:`, err);
    throw new Error(err.error || `Failed to fetch CSM table ${table}`);
  }
  return res.json();
}

/**
 * Fetch a single record from a CSM entity table by ID.
 */
export async function fetchCSMRecord<T = any>(table: string, id: string, tenantId = "t1"): Promise<T> {
  const res = await fetch(`${API_BASE}/csm/${table}/${id}?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] CSM record fetch failed for ${table}/${id}:`, err);
    throw new Error(err.error || `Failed to fetch CSM record ${table}/${id}`);
  }
  return res.json();
}

/**
 * Fetch the CSM schema (table names, ID fields, record counts).
 */
export async function fetchCSMSchema(tenantId = "t1") {
  const res = await fetch(`${API_BASE}/csm/schema?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[SpineClient] CSM schema fetch failed:", err);
    throw new Error(err.error || "Failed to fetch CSM schema");
  }
  return res.json();
}

// ─── Universal Domain API ───────────────────────────────────────────────────

/**
 * Fetch the full domain registry (all domains, planes, tables).
 */
export async function fetchDomainRegistry() {
  const res = await fetch(`${API_BASE}/domain/registry`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[SpineClient] Domain registry fetch failed:", err);
    throw new Error(err.error || "Failed to fetch domain registry");
  }
  return res.json();
}

/**
 * Initialize ALL domains at once — used during onboarding.
 * Sends the full seed data payload to the server.
 */
export async function initializeAllDomains(
  domains: Record<string, Record<string, any[]>>,
  tenantId = "t1"
) {
  const res = await fetch(`${API_BASE}/domain/initialize-all`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tenantId, domains }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[SpineClient] Bulk domain init failed:", err);
    throw new Error(err.error || "Failed to initialize all domains");
  }
  return res.json();
}

/**
 * Initialize a single domain's tables.
 */
export async function initializeDomain(
  domain: string,
  tables: Record<string, any[]>,
  tenantId = "t1"
) {
  const res = await fetch(`${API_BASE}/domain/${domain}/initialize`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tenantId, tables }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] Domain init failed for ${domain}:`, err);
    throw new Error(err.error || `Failed to initialize domain ${domain}`);
  }
  return res.json();
}

/**
 * Fetch the schema for a specific domain.
 */
export async function fetchDomainSchema(domain: string, tenantId = "t1") {
  const res = await fetch(`${API_BASE}/domain/${domain}/schema?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] Domain schema fetch failed for ${domain}:`, err);
    throw new Error(err.error || `Failed to fetch ${domain} schema`);
  }
  return res.json();
}

/**
 * Fetch all records from a domain table.
 */
export async function fetchDomainTable<T = any>(
  domain: string,
  table: string,
  tenantId = "t1"
): Promise<{ domain: string; table: string; count: number; data: T[] }> {
  const res = await fetch(`${API_BASE}/domain/${domain}/${table}?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    logIfUnexpected(`[SpineClient] Domain table fetch failed for ${domain}/${table}:`, err, res.status);
    throw new Error(err.error || `Failed to fetch ${domain}/${table}`);
  }
  return res.json();
}

/**
 * Fetch a single record from a domain table by ID.
 */
export async function fetchDomainRecord<T = any>(
  domain: string,
  table: string,
  id: string,
  tenantId = "t1"
): Promise<T> {
  const res = await fetch(`${API_BASE}/domain/${domain}/${table}/${id}?tenantId=${tenantId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] Domain record fetch failed for ${domain}/${table}/${id}:`, err);
    throw new Error(err.error || `Failed to fetch ${domain}/${table}/${id}`);
  }
  return res.json();
}

/**
 * Create a new record in a domain table.
 */
export async function createDomainRecord(
  domain: string,
  table: string,
  record: Record<string, any>,
  tenantId = "t1"
) {
  const res = await fetch(`${API_BASE}/domain/${domain}/${table}?tenantId=${tenantId}`, {
    method: "POST",
    headers,
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] Domain record create failed for ${domain}/${table}:`, err);
    throw new Error(err.error || `Failed to create record in ${domain}/${table}`);
  }
  return res.json();
}

/**
 * Update (upsert) a record in a domain table.
 */
export async function updateDomainRecord(
  domain: string,
  table: string,
  id: string,
  fields: Record<string, any>,
  tenantId = "t1"
) {
  const res = await fetch(`${API_BASE}/domain/${domain}/${table}/${id}?tenantId=${tenantId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] Domain record update failed for ${domain}/${table}/${id}:`, err);
    throw new Error(err.error || `Failed to update record in ${domain}/${table}/${id}`);
  }
  return res.json();
}

/**
 * Delete a record from a domain table.
 */
export async function deleteDomainRecord(
  domain: string,
  table: string,
  id: string,
  tenantId = "t1"
) {
  const res = await fetch(`${API_BASE}/domain/${domain}/${table}/${id}?tenantId=${tenantId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[SpineClient] Domain record delete failed for ${domain}/${table}/${id}:`, err);
    throw new Error(err.error || `Failed to delete record from ${domain}/${table}/${id}`);
  }
  return res.json();
}

// ─── Domain Hooks ────────────────────────────────────────────────────────────

/**
 * React hook to fetch a domain table with loading/error state.
 */
export function useDomainTable<T = any>(domain: string, table: string) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDomainTable<T>(domain, table);
      setData(result.data);
    } catch (err: any) {
      if (err instanceof TypeError ||
          String(err?.message ?? "").toLowerCase().includes("not found")) {
        setData([] as any);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [domain, table]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * React hook to fetch the full domain registry.
 */
export function useDomainRegistry() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDomainRegistry();
      setData(result);
    } catch (err: any) {
      console.error("[useDomainRegistry]:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── React Hooks ─────────────────────────────────────────────────────────────

export function useSpineProjection<T = any>(department: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProjection<T>(department);
      setData(result);
    } catch (err: any) {
      if (err instanceof TypeError ||
          String(err?.message ?? "").toLowerCase().includes("not found")) {
        setData({} as any);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useSpineReadiness() {
  const [data, setData] = useState<Record<string, DepartmentReadiness> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchReadiness();
      setData(result);
    } catch (err: any) {
      if (err instanceof TypeError ||
          String(err?.message ?? "").toLowerCase().includes("not found")) {
        setData({} as any);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useSpineEntities<T = any>(type: string) {
  const [data, setData] = useState<T[] | null>(null);
  const [provenance, setProvenance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEntities<T>(type);
      setData(result.entities);
      setProvenance(result.provenance);
    } catch (err: any) {
      console.error(`[useSpineEntities] ${type}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, provenance, loading, error, refetch };
}

// ─── Spine Context (global state for spine initialization status) ─────────────

interface SpineContextValue {
  initialized: boolean;
  initializing: boolean;
  connectedApps: string[];
  readiness: Record<string, DepartmentReadiness> | null;
  userName: string;
  role: string;
  initialize: (params: { connectedApps: string[]; userName: string; role: string }) => Promise<void>;
  addNewConnector: (connectorId: string) => Promise<void>;
  refreshReadiness: () => Promise<void>;
}

const SpineContext = createContext<SpineContextValue>({
  initialized: false,
  initializing: false,
  connectedApps: [],
  readiness: null,
  userName: "User",
  role: "business-ops",
  initialize: async () => {},
  addNewConnector: async () => {},
  refreshReadiness: async () => {},
});

export function useSpine() {
  return useContext(SpineContext);
}

export function SpineProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [connectedApps, setConnectedApps] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<Record<string, DepartmentReadiness> | null>(null);
  const [userName, setUserName] = useState("User");
  const [role, setRole] = useState("business-ops");

  const initialize = useCallback(async (params: { connectedApps: string[]; userName: string; role: string }) => {
    setInitializing(true);
    try {
      const result = await initializeSpine(params);
      setConnectedApps(params.connectedApps);
      setUserName(params.userName);
      setRole(params.role);
      setReadiness(result.readiness);
      setInitialized(true);
      console.log("[SpineProvider] SSOT initialized successfully", result.entityCounts);
    } catch (err) {
      console.error("[SpineProvider] Initialization failed:", err);
      // Still mark as initialized so the app doesn't hang — data just won't be there
      setConnectedApps(params.connectedApps);
      setUserName(params.userName);
      setRole(params.role);
      setInitialized(true);
    } finally {
      setInitializing(false);
    }
  }, []);

  const addNewConnector = useCallback(async (connectorId: string) => {
    try {
      const result = await addConnector(connectorId);
      setConnectedApps(prev => [...prev, connectorId]);
      setReadiness(result.readiness);
      console.log(`[SpineProvider] Connector ${connectorId} added, SSOT re-normalized`);
    } catch (err) {
      console.error(`[SpineProvider] Failed to add connector ${connectorId}:`, err);
    }
  }, []);

  const refreshReadiness = useCallback(async () => {
    try {
      const result = await fetchReadiness();
      setReadiness(result);
    } catch (err) {
      console.error("[SpineProvider] Failed to refresh readiness:", err);
    }
  }, []);

  return (
    <SpineContext.Provider value={{ initialized, initializing, connectedApps, readiness, userName, role, initialize, addNewConnector, refreshReadiness }}>
      {children}
    </SpineContext.Provider>
  );
}