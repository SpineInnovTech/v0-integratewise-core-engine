/**
 * Spine Client — Frontend SSOT Consumer
 *
 * All L1 workspace pages read data exclusively through this client.
 * Tool-specific schemas never leak to UI. Everything speaks Spine language.
 *
 * Flow: L1 Component → useSpineProjection() → apiFetch → Gateway → BFF → KV (SSOT) → Projection
 */

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { apiFetch } from "@/lib/api-client";

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
  return apiFetch(
    "/api/v1/workspace/initialize-spine",
    {
      method: "POST",
      body: params,
    },
    "SpineInit"
  );
}

export async function fetchProjection<T = any>(department: string): Promise<T> {
  return apiFetch<T>(`/api/v1/workspace/projection/${department}`, {}, `Projection(${department})`);
}

export async function fetchReadiness(): Promise<Record<string, DepartmentReadiness>> {
  return apiFetch<Record<string, DepartmentReadiness>>(
    "/api/v1/workspace/readiness",
    {},
    "Readiness"
  );
}

export async function fetchEntities<T = any>(
  type: string
): Promise<{ type: string; count: number; entities: T[]; provenance: any }> {
  return apiFetch(
    `/api/v1/workspace/entities?type=${encodeURIComponent(type)}`,
    {},
    `Entities(${type})`
  );
}

export async function fetchSpineMetadata() {
  return apiFetch("/api/v1/workspace/metadata", {}, "SpineMetadata");
}

export async function addConnector(connectorId: string) {
  return apiFetch(
    "/api/v1/workspace/register-connector",
    {
      method: "POST",
      body: { provider: connectorId, flowType: "A" },
    },
    `RegisterConnector(${connectorId})`
  );
}

// ─── CSM Intelligence API ───────────────────────────────────────────────────

/**
 * Initialize the CSM Intelligence 16-table data model in the KV store.
 * Called after Spine init — sends the local seed data to the server.
 */
export async function initializeCSM(tables: Record<string, any[]>) {
  return apiFetch(
    "/api/v1/workspace/csm/initialize",
    {
      method: "POST",
      body: { tables },
    },
    "CSMInit"
  );
}

/**
 * Fetch all records from a CSM entity table.
 */
export async function fetchCSMTable<T = any>(
  table: string
): Promise<{ table: string; count: number; data: T[] }> {
  return apiFetch(`/api/v1/workspace/csm/${table}`, {}, `CSM(${table})`);
}

/**
 * Fetch a single record from a CSM entity table by ID.
 */
export async function fetchCSMRecord<T = any>(table: string, id: string): Promise<T> {
  return apiFetch(`/api/v1/workspace/csm/${table}/${id}`, {}, `CSMRecord(${table}/${id})`);
}

/**
 * Fetch the CSM schema (table names, ID fields, record counts).
 */
export async function fetchCSMSchema() {
  return apiFetch("/api/v1/workspace/csm/schema", {}, "CSMSchema");
}

// ─── Universal Domain API ───────────────────────────────────────────────────

/**
 * Fetch the full domain registry (all domains, planes, tables).
 */
export async function fetchDomainRegistry() {
  return apiFetch("/api/v1/workspace/domain/registry", {}, "DomainRegistry");
}

/**
 * Initialize ALL domains at once — used during onboarding.
 */
export async function initializeAllDomains(domains: Record<string, Record<string, any[]>>) {
  return apiFetch(
    "/api/v1/workspace/domain/initialize-all",
    {
      method: "POST",
      body: { domains },
    },
    "BulkDomainInit"
  );
}

/**
 * Initialize a single domain's tables.
 */
export async function initializeDomain(domain: string, tables: Record<string, any[]>) {
  return apiFetch(
    `/api/v1/workspace/domain/${domain}/initialize`,
    {
      method: "POST",
      body: { tables },
    },
    `DomainInit(${domain})`
  );
}

/**
 * Fetch the schema for a specific domain.
 */
export async function fetchDomainSchema(domain: string) {
  return apiFetch(`/api/v1/workspace/domain/${domain}/schema`, {}, `DomainSchema(${domain})`);
}

/**
 * Fetch all records from a domain table.
 */
export async function fetchDomainTable<T = any>(
  domain: string,
  table: string
): Promise<{ domain: string; table: string; count: number; data: T[] }> {
  return apiFetch(
    `/api/v1/workspace/domain/${domain}/${table}`,
    {},
    `DomainTable(${domain}/${table})`
  );
}

/**
 * Fetch a single record from a domain table by ID.
 */
export async function fetchDomainRecord<T = any>(
  domain: string,
  table: string,
  id: string
): Promise<T> {
  return apiFetch(
    `/api/v1/workspace/domain/${domain}/${table}/${id}`,
    {},
    `DomainRecord(${domain}/${table}/${id})`
  );
}

/**
 * Create a new record in a domain table.
 */
export async function createDomainRecord(
  domain: string,
  table: string,
  record: Record<string, any>
) {
  return apiFetch(
    `/api/v1/workspace/domain/${domain}/${table}`,
    {
      method: "POST",
      body: record,
    },
    `DomainCreate(${domain}/${table})`
  );
}

/**
 * Update (upsert) a record in a domain table.
 */
export async function updateDomainRecord(
  domain: string,
  table: string,
  id: string,
  fields: Record<string, any>
) {
  return apiFetch(
    `/api/v1/workspace/domain/${domain}/${table}/${id}`,
    {
      method: "PUT",
      body: fields,
    },
    `DomainUpdate(${domain}/${table}/${id})`
  );
}

/**
 * Delete a record from a domain table.
 */
export async function deleteDomainRecord(domain: string, table: string, id: string) {
  return apiFetch(
    `/api/v1/workspace/domain/${domain}/${table}/${id}`,
    {
      method: "DELETE",
    },
    `DomainDelete(${domain}/${table}/${id})`
  );
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
      console.error(`[useDomainTable] ${domain}/${table}:`, err);
      setError(err.message);
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
      console.error(`[useSpineProjection] ${department}:`, err);
      setError(err.message);
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
      console.error("[useSpineReadiness]:", err);
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
  tenantBucket: string | null;
  tenantBucketLabel: string | null;
  nextBucketAction: string | null;
  userName: string;
  role: string;
  initialize: (params: {
    connectedApps: string[];
    userName: string;
    role: string;
  }) => Promise<void>;
  addNewConnector: (connectorId: string) => Promise<void>;
  refreshReadiness: () => Promise<void>;
}

const SpineContext = createContext<SpineContextValue>({
  initialized: false,
  initializing: false,
  connectedApps: [],
  readiness: null,
  tenantBucket: null,
  tenantBucketLabel: null,
  nextBucketAction: null,
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
  const [tenantBucket, setTenantBucket] = useState<string | null>(null);
  const [tenantBucketLabel, setTenantBucketLabel] = useState<string | null>(null);
  const [nextBucketAction, setNextBucketAction] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [role, setRole] = useState("business-ops");

  const initialize = useCallback(
    async (params: { connectedApps: string[]; userName: string; role: string }) => {
      setInitializing(true);
      try {
        const result = await initializeSpine(params);
        setConnectedApps(params.connectedApps);
        setUserName(params.userName);
        setRole(params.role);
        setReadiness(result.readiness);
        setInitialized(true);
        if (import.meta.env.DEV)
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
    },
    []
  );

  const addNewConnector = useCallback(async (connectorId: string) => {
    try {
      const result = await addConnector(connectorId);
      setConnectedApps((prev) => [...prev, connectorId]);
      setReadiness(result.readiness);
      if (import.meta.env.DEV)
        console.log(`[SpineProvider] Connector ${connectorId} added, SSOT re-normalized`);
    } catch (err) {
      console.error(`[SpineProvider] Failed to add connector ${connectorId}:`, err);
    }
  }, []);

  const refreshReadiness = useCallback(async () => {
    try {
      const result = await fetchReadiness();
      const {
        tenant_bucket,
        tenant_bucket_label,
        next_bucket_action,
        tenant_domains,
        ...deptReadiness
      } = result as any;
      setReadiness(deptReadiness);
      if (tenant_bucket) setTenantBucket(tenant_bucket);
      if (tenant_bucket_label) setTenantBucketLabel(tenant_bucket_label);
      if (next_bucket_action) setNextBucketAction(next_bucket_action);
    } catch (err) {
      console.error("[SpineProvider] Failed to refresh readiness:", err);
    }
  }, []);

  return (
    <SpineContext.Provider
      value={{
        initialized,
        initializing,
        connectedApps,
        readiness,
        tenantBucket,
        tenantBucketLabel,
        nextBucketAction,
        userName,
        role,
        initialize,
        addNewConnector,
        refreshReadiness,
      }}
    >
      {children}
    </SpineContext.Provider>
  );
}
