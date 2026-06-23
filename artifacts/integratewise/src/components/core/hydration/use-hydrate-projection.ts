/**
 * useHydrateProjection — Simplified Projection Hook
 *
 * ARCHITECTURE CHANGE: Removed Hydration Fabric dependency.
 * Now calls the Workflow BFF projection endpoint directly via apiFetch.
 *
 * Projection data = aggregated summary stats (MRR, entity counts, avg health, etc.)
 * Entity data = raw rows — use useWorkspaceEntities / useWorkspaceEntitiesBatch for that.
 *
 * DATA_ACCESS_PATTERNS:
 *   - Entity reads → Supabase RPC (useWorkspaceEntities)
 *   - Projection reads → Workflow BFF (this hook)
 *   - Admin reads → Gateway (useAdminData)
 *
 * @see apps/web/src/hooks/use-workspace-entities.ts  (entity reads)
 * @see sql-migrations/070_workspace_direct_reads.sql (entity RPC)
 */

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

// ─── Department → Projection Endpoint Mapping ────────────────────────────────

const DEPARTMENT_ALIAS: Record<string, string> = {
  ops: "BIZOPS",
  "business-ops": "BIZOPS",
  bizops: "BIZOPS",
  sales: "SALES",
  salesops: "SALES",
  "sales-ops": "SALES",
  marketing: "MARKETING",
  cs: "CUSTOMER_SUCCESS",
  "customer-success": "CUSTOMER_SUCCESS",
  customer_success: "CUSTOMER_SUCCESS",
  revops: "REVOPS",
  "rev-ops": "REVOPS",
  finance: "FINANCE",
  service: "SERVICE",
  procurement: "PROCUREMENT",
  it: "IT_ADMIN",
  "it-admin": "IT_ADMIN",
  it_admin: "IT_ADMIN",
  education: "STUDENT_TEACHER",
  "student-teacher": "STUDENT_TEACHER",
  student_teacher: "STUDENT_TEACHER",
  personal: "PERSONAL",
  product: "PRODUCT_ENGINEERING",
  "product-engineering": "PRODUCT_ENGINEERING",
  product_engineering: "PRODUCT_ENGINEERING",
  account_success: "CUSTOMER_SUCCESS",
  "account-success": "CUSTOMER_SUCCESS",
};

function normalizeDept(department: string): string {
  const normalized = department.toLowerCase().trim();
  return DEPARTMENT_ALIAS[normalized] || normalized.toUpperCase();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HydrateProjectionResult<T> {
  /** The projection data (null while loading) */
  data: T | null;
  /** True while the initial fetch is in progress */
  loading: boolean;
  /** Error message if the fetch failed */
  error: string | null;
  /** Refetch the projection data */
  refetch: () => void;
  /** Which provider delivered this data */
  source: string | null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Fetch projection (aggregated summary) for a department.
 * Calls Workflow BFF: GET /api/v1/workspace/projection/{department}
 *
 * @param department  The department/domain name (e.g. "sales", "bizops", "marketing")
 * @returns           { data, loading, error, refetch, source }
 */
export function useHydrateProjection<T = any>(department: string): HydrateProjectionResult<T> {
  const dept = normalizeDept(department);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    const fetchProjection = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<T>(
          `/api/v1/workspace/projection/${dept}`,
          {},
          `Projection(${dept})`
        );
        if (!cancelled) setData(result);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || `Failed to load ${dept} projection`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProjection();
    return () => {
      cancelled = true;
    };
  }, [dept, reloadToken]);

  return { data, loading, error, refetch, source: "workflow-bff" };
}

/**
 * Bridge for entity-level data (replaces useDomainTable).
 * DEPRECATED: Use useWorkspaceEntities instead.
 *
 * @param domain  Domain name (e.g. "sales", "customer_success")
 * @param table   Entity table (e.g. "accounts", "contacts", "deals")
 * @returns       { data, loading, error, refetch, source }
 */
export function useHydrateDomainTable<T = any>(
  domain: string,
  table: string
): HydrateProjectionResult<T> {
  const dept = normalizeDept(domain);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<T>(
          `/api/v1/workspace/projection/${dept}?table=${table}`,
          {},
          `DomainTable(${dept}.${table})`
        );
        if (!cancelled) setData(result);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || `Failed to load ${dept}.${table}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [dept, table, reloadToken]);

  return { data, loading, error, refetch, source: "workflow-bff" };
}
