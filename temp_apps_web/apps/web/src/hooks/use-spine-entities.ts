/**
 * use-spine-entities.ts — Cloudflare Edge D1 Partitioned Spine reads
 *
 * ARCHITECTURE CHANGE (Phase 4):
 *   useSpineEntities now queries the Edge Spine via the Gateway to bypass
 *   direct Spine connections completely, ensuring sub-50ms reads.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SpineEntitiesResult<T = any> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface SpineEntitiesBatchResult<T = any> {
  /** Keyed by entity type name (same key you passed in) */
  data: Record<string, T[]>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface SpineEntityCountResult {
  counts: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface QueryOptions {
  limit?: number;
  offset?: number;
  /** Set false to disable auto-fetch on mount (default true) */
  enabled?: boolean;
  /** Domain for scoping dashboard data loading as per chosen domain */
  domain?: string;
}

// ---------------------------------------------------------------------------
// Single entity type — drop-in replacement for useWorkspaceEntities
// ---------------------------------------------------------------------------
export function useSpineEntities<T = any>(
  entityType: string,
  options?: QueryOptions
): SpineEntitiesResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const cancelRef = useRef(false);

  const enabled = options?.enabled !== false;
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    if (!enabled || !entityType) {
      setIsLoading(false);
      return;
    }

    cancelRef.current = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        let url = `/api/v1/pipeline/entities?type=${entityType}&limit=${limit}&offset=${offset}`;
        if (options?.domain) {
          url += `&workspace=${options.domain}`;
        }
        const result = await apiFetch<any>(url, {}, `Entities(${entityType})`);

        if (cancelRef.current) return;

        const rows = result?.entities || [];
        setData(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        if (!cancelRef.current) {
          setError(e?.message || "Failed to load data");
          setData([]);
        }
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelRef.current = true;
    };
  }, [entityType, limit, offset, enabled, reloadToken, options?.domain]);

  return { data, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// Batch — multiple entity types in ONE API call
// ---------------------------------------------------------------------------
export function useSpineEntitiesBatch<T = any>(
  entityTypes: string[],
  options?: QueryOptions
): SpineEntitiesBatchResult<T> {
  const [data, setData] = useState<Record<string, T[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const cancelRef = useRef(false);

  const enabled = options?.enabled !== false;
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  // Stable key for the entity types array
  const typesKey = entityTypes.slice().sort().join(",");

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    if (!enabled || entityTypes.length === 0) {
      setIsLoading(false);
      return;
    }

    cancelRef.current = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const body: any = {
          types: entityTypes,
          limit,
          offset,
        };
        if (options?.domain) {
          body.domain = options.domain;
          body.workspace = options.domain;
        }
        const result = await apiFetch<any>(
          `/api/v1/pipeline/entities/batch`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          },
          `EntitiesBatch(${typesKey})`
        );

        if (cancelRef.current) return;

        const normalized: Record<string, T[]> = {};
        const results = result?.results || {};
        for (const et of entityTypes) {
          const rows = results[et] || [];
          normalized[et] = Array.isArray(rows) ? rows : [];
        }
        setData(normalized);
      } catch (e: any) {
        if (!cancelRef.current) {
          setError(e?.message || "Failed to load data");
          setData({});
        }
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesKey, limit, offset, enabled, reloadToken, options?.domain]);

  return { data, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// Entity counts — for dashboard KPI widgets
// ---------------------------------------------------------------------------
export function useSpineEntityCounts(
  entityTypes: string[],
  options?: Pick<QueryOptions, "enabled" | "domain">
): SpineEntityCountResult {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const cancelRef = useRef(false);

  const enabled = options?.enabled !== false;
  const typesKey = entityTypes.slice().sort().join(",");

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    if (!enabled || entityTypes.length === 0) {
      setIsLoading(false);
      return;
    }

    cancelRef.current = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        let url = `/api/v1/pipeline/entities/counts?types=${typesKey}`;
        if (options?.domain) url += `&domain=${options.domain}`;
        const result = await apiFetch<any>(url, {}, `EntityCounts(${typesKey})`);

        if (cancelRef.current) return;

        const normalized: Record<string, number> = {};
        const countsData = result?.counts || {};
        for (const et of entityTypes) {
          normalized[et] = countsData[et] || 0;
        }
        setCounts(normalized);
      } catch (e: any) {
        if (!cancelRef.current) {
          setError(e?.message || "Failed to load counts");
          setCounts({});
        }
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesKey, enabled, reloadToken]);

  return { counts, isLoading, error, refetch };
}
