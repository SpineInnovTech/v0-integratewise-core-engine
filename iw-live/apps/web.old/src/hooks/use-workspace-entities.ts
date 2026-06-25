/**
 * use-workspace-entities.ts — Workspace data hooks
 *
 * ARCHITECTURE CHANGE (Phase 4):
 *   useWorkspaceEntities now reads DIRECTLY from Spine via RPC,
 *   bypassing the Gateway → BFF → Spine → Spine chain entirely.
 *
 *   Old path:  apiFetch → Gateway → Workflow → Spine → Spine  (10 HTTP hops)
 *   New path:  spineClient.rpc('get_workspace_entities')             (1 DB call)
 *
 *   The RPC function is SECURITY DEFINER — resolves tenant_id from profiles
 *   via auth.uid(), queries domain schemas directly, returns tenant-scoped rows.
 *
 * All 49 consumer files continue working with zero changes.
 *
 * @see apps/web/src/hooks/use-spine-entities.ts  (core implementation)
 * @see sql-migrations/070_workspace_direct_reads.sql (RPC function)
 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  useSpineEntities,
  useSpineEntitiesBatch,
  useSpineEntityCounts,
  type SpineEntitiesResult,
  type SpineEntitiesBatchResult,
  type SpineEntityCountResult,
} from "./use-spine-entities";

// Re-export the new hooks for consumers that want to use them directly
export { useSpineEntities, useSpineEntitiesBatch, useSpineEntityCounts };
export type { SpineEntitiesResult, SpineEntitiesBatchResult, SpineEntityCountResult };

// ---------------------------------------------------------------------------
// useWorkspaceEntities — Now delegates to direct Spine RPC
// ---------------------------------------------------------------------------
// Preserves the same API signature so all 49 consumer files work unchanged.
// The `params` arg is accepted for backward compat but not used in direct reads
// (the RPC handles filtering server-side via tenant_id).
// ---------------------------------------------------------------------------
export interface UseWorkspaceEntitiesResult<T = any> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWorkspaceEntities<T = any>(
  entityType: string,
  _params?: Record<string, string>
): UseWorkspaceEntitiesResult<T> {
  // Direct delegation — same return shape
  return useSpineEntities<T>(entityType);
}

// ---------------------------------------------------------------------------
// useWorkspaceEntitiesBatch — NEW: Multiple types in ONE RPC call
// ---------------------------------------------------------------------------
// Composite views (CSM Hub, Intelligence Center, etc.) should migrate from:
//   const a = useWorkspaceEntities("account_master");
//   const b = useWorkspaceEntities("task_item");
//   const c = useWorkspaceEntities("risk");
// To:
//   const { data } = useWorkspaceEntitiesBatch(["account_master", "task_item", "risk"]);
//   const a = data.account_master ?? [];
// ---------------------------------------------------------------------------
export function useWorkspaceEntitiesBatch<T = any>(
  entityTypes: string[],
  options?: { limit?: number; offset?: number; enabled?: boolean; domain?: string }
): SpineEntitiesBatchResult<T> {
  return useSpineEntitiesBatch<T>(entityTypes, options);
}

// ---------------------------------------------------------------------------
// useWorkspaceProjection — DEPRECATED (dead code, zero consumers)
// Kept for backward compat; delegates to batch Spine read.
// ---------------------------------------------------------------------------
export function useWorkspaceProjection<T = any>(
  department: string
): UseWorkspaceEntitiesResult<T> & { projection: any } {
  const result = useSpineEntities<T>(department);
  return { ...result, projection: null };
}

// ---------------------------------------------------------------------------
// useWorkspaceDashboard — DEPRECATED (dead code, zero consumers)
// Kept for backward compat; returns empty dashboard data.
// ---------------------------------------------------------------------------
export function useWorkspaceDashboard(domain?: string) {
  const [data] = useState<any>(null);
  return {
    data,
    isLoading: false,
    error: null as string | null,
    refetch: () => {},
  };
}

// ---------------------------------------------------------------------------
// useAdminData — UNCHANGED (stays on Gateway path)
// Admin endpoints require elevated auth that only Gateway provides.
// ---------------------------------------------------------------------------
export function useAdminData<T = any>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch<T>(endpoint, {}, `Admin(${endpoint})`);
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load admin data");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [endpoint, reloadToken]);

  return { data, isLoading, error, refetch };
}
