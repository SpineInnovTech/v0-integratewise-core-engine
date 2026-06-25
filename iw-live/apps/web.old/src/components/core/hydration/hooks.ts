/**
 * Hydration Fabric — React Hooks
 *
 * Provider-agnostic data hooks. Components use these instead of
 * directly calling useSpine() / useSpineProjection() — they get
 * the same data but through the Fabric's configurable routing.
 *
 * Migration path: useSpineProjection("sales") → useHydrate("sales.dashboard")
 */

import { useState, useEffect, useCallback } from "react";

import type { FabricStatus, FabricManifest, HydrationContext, HealthStatus } from "./types";

import { useFabric, useFabricSubscribe } from "./fabric-engine";

// ─── useHydrate ──────────────────────────────────────────────────────────────
/**
 * Main hook — fetches and returns data for a slot.
 *
 * @param slotId  The slot identifier, e.g. "sales.pipeline.deals"
 * @param opts    Options: auto-fetch, extra params, deps
 * @returns       { data, phase, error, refetch, provenance }
 *
 * @example
 *   const { data, phase, error } = useHydrate<Account[]>("cs.accounts");
 *   if (phase === "skeleton") return <Skeleton />;
 *   if (error) return <Error message={error} />;
 *   return <AccountList accounts={data!} />;
 */
export function useHydrate<T = any>(
  slotId: string,
  opts: {
    /** Auto-fetch on mount? Default true */
    auto?: boolean;
    /** Extra params to merge into the slot binding */
    params?: Record<string, any>;
    /** Additional deps that trigger re-fetch */
    deps?: any[];
    /** If true, serves stale data while refreshing */
    staleWhileRevalidate?: boolean;
  } = {}
) {
  const { auto = true, params, deps = [], staleWhileRevalidate = true } = opts;
  const fabric = useFabric();
  const subscribe = useFabricSubscribe();

  // Use external store pattern for slot state (avoids re-render on every slot change)
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return subscribe(slotId, () => forceUpdate((n) => n + 1));
  }, [slotId, subscribe]);

  const slotState = fabric.getSlotState<T>(slotId);

  // Auto-fetch on mount and when deps change
  useEffect(() => {
    if (auto && fabric.status.initialized) {
      fabric.hydrate<T>(slotId, params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotId, auto, fabric.status.initialized, ...deps]);

  // Manual refetch
  const refetch = useCallback(
    (extraParams?: Record<string, any>) => {
      fabric.invalidate(slotId);
      return fabric.hydrate<T>(slotId, { ...params, ...extraParams });
    },
    [fabric, slotId, params]
  );

  return {
    data: slotState.data,
    phase: slotState.phase,
    error: slotState.error,
    provenance: slotState.provenance,
    isLoading: slotState.phase === "skeleton" || slotState.phase === "config",
    isError: slotState.phase === "error",
    isStale: slotState.phase === "stale" || slotState.phase === "partial",
    isComplete: slotState.phase === "complete",
    refetch,
  };
}

// ─── useHydrateMany ──────────────────────────────────────────────────────────
/**
 * Fetch multiple slots in parallel.
 *
 * @example
 *   const { slots, allComplete, anyError } = useHydrateMany([
 *     "cs.accounts", "cs.contacts", "cs.tasks"
 *   ]);
 */
export function useHydrateMany(slotIds: string[], opts?: { auto?: boolean }) {
  const { auto = true } = opts || {};
  const fabric = useFabric();
  const subscribe = useFabricSubscribe();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsubs = slotIds.map((id) => subscribe(id, () => forceUpdate((n) => n + 1)));
    return () => unsubs.forEach((fn) => fn());
  }, [slotIds.join(","), subscribe]);

  useEffect(() => {
    if (auto && fabric.status.initialized) {
      slotIds.forEach((id) => fabric.hydrate(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, fabric.status.initialized, slotIds.join(",")]);

  const slots = slotIds.map((id) => fabric.getSlotState(id));

  return {
    slots,
    allComplete: slots.every((s) => s.phase === "complete"),
    anyLoading: slots.some((s) => s.phase === "skeleton" || s.phase === "config"),
    anyError: slots.some((s) => s.phase === "error"),
    errors: slots.filter((s) => s.error).map((s) => ({ slotId: s.slotId, error: s.error })),
    refetchAll: () => {
      slotIds.forEach((id) => {
        fabric.invalidate(id);
        fabric.hydrate(id);
      });
    },
  };
}

// ─── useFabricStatus ─────────────────────────────────────────────────────────
/**
 * Returns the overall fabric status — useful for loading screens, health checks.
 */
export function useFabricStatus(): FabricStatus {
  return useFabric().status;
}

// ─── useFabricManifest ───────────────────────────────────────────────────────
/**
 * Returns the loaded manifest. Null until initialization completes.
 */
export function useFabricManifest(): FabricManifest | null {
  return useFabric().manifest;
}

// ─── useHydrationContext ─────────────────────────────────────────────────────
/**
 * Returns and allows updating the hydration context (domain, role, tenant, etc.)
 */
export function useHydrationContext(): {
  context: HydrationContext;
  updateContext: (patch: Partial<HydrationContext>) => void;
} {
  const fabric = useFabric();
  return {
    context: fabric.context,
    updateContext: fabric.updateContext,
  };
}

// ─── useProviderHealth ───────────────────────────────────────────────────────
/**
 * Fetches health status from all registered providers.
 */
export function useProviderHealth() {
  const fabric = useFabric();
  const [health, setHealth] = useState<Record<string, HealthStatus>>({});
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fabric.getProviderHealth();
      setHealth(result);
    } catch (err) {
      console.error("[useProviderHealth] Check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [fabric]);

  useEffect(() => {
    if (fabric.status.initialized) {
      check();
    }
  }, [fabric.status.initialized, check]);

  return { health, loading, recheck: check };
}

// ─── useSlotConfig ───────────────────────────────────────────────────────────
/**
 * Returns the resolved slot binding config for a given slot ID.
 * Useful for debugging which provider a slot is wired to.
 */
export function useSlotConfig(slotId: string) {
  const fabric = useFabric();
  if (!fabric.manifest) return null;
  return fabric.manifest.slots[slotId] || null;
}

// ─── useDomainSlots ──────────────────────────────────────────────────────────
/**
 * Returns all slot IDs for the current domain.
 */
export function useDomainSlots(): string[] {
  const fabric = useFabric();
  if (!fabric.manifest) return [];

  const domainPrefix = fabric.context.domain.toLowerCase() + ".";
  return Object.keys(fabric.manifest.slots).filter(
    (id) => id.startsWith(domainPrefix) || id.startsWith("global.")
  );
}

// ─── useScopedSlots ──────────────────────────────────────────────────────────
/**
 * Returns all slots filtered by scope (personal, work, or team).
 * Respects the view context for proper data segregation.
 *
 * @param scope  The scope to filter by: "personal", "work", or "team"
 * @returns      Array of slot bindings for the given scope
 *
 * @example
 *   const personalSlots = useScopedSlots("personal");
 *   const workSlots = useScopedSlots("work");
 *   const teamSlots = useScopedSlots("team");
 */
export function useScopedSlots(
  scope: "personal" | "work" | "team"
): Array<{ slotId: string; scope: string; endpoint: string; ttl: number }> {
  const fabric = useFabric();
  if (!fabric.manifest) return [];

  return Object.entries(fabric.manifest.slots)
    .filter(([, binding]: any) => binding.scope === scope)
    .map(([slotId, binding]: any) => ({
      slotId,
      scope: binding.scope,
      endpoint: binding.endpoint,
      ttl: binding.ttl,
    }));
}

// ─── useInvalidateOnEvent ────────────────────────────────────────────────────
/**
 * Returns a function that invalidates slots when called.
 * Useful for invalidating related data after a mutation.
 *
 * @example
 *   const invalidateAccounts = useInvalidateOnEvent(["cs.accounts", "cs.dashboard"]);
 *   const handleSave = async () => {
 *     await saveAccount(data);
 *     invalidateAccounts();
 *   };
 */
export function useInvalidateOnEvent(slotIds: string[]): () => void {
  const fabric = useFabric();
  return useCallback(() => {
    slotIds.forEach((id) => {
      fabric.invalidate(id);
      fabric.hydrate(id);
    });
  }, [fabric, ...slotIds]);
}
