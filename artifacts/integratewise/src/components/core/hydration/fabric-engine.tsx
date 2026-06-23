/**
 * Hydration Fabric Engine — Core React Context
 *
 * The single provider that wraps the entire workspace. On mount:
 *   1. Fetches the FabricManifest from the server
 *   2. Registers all providers dynamically (spine, rest, doppler, static, kv)
 *   3. Resolves slot bindings per role/domain
 *   4. Exposes useHydrate() and friends via context
 *
 * "Normalize Once, Hydrate Anywhere" — provider-agnostic, config-driven.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import type {
  FabricContextValue,
  FabricStatus,
  FabricManifest,
  HydrationContext,
  HydrationPhase,
  SlotState,
  SlotBinding,
  ProviderType,
  ProviderFactory,
  ProviderConfig,
  ProviderResult,
  HealthStatus,
  RoleBinding,
} from "./types";

import { ProviderBus, getProviderBus, resetProviderBus } from "./provider-bus";
import { createSpineAdapter } from "./providers/spine-adapter";
import { createRestAdapter } from "./providers/rest-adapter";
import { createDopplerAdapter } from "./providers/doppler-adapter";
import { createStaticAdapter } from "./providers/static-adapter";
import { createKVAdapter } from "./providers/kv-adapter";

// ─── Supabase disconnected — all data is served locally ──────────────────────

// ─── Default Context ─────────────────────────────────────────────────────────

const defaultStatus: FabricStatus = {
  initialized: false,
  initializing: false,
  manifestLoaded: false,
  configSource: null,
  activeProviders: [],
  slotCount: 0,
  healthyProviders: 0,
  totalProviders: 0,
  lastManifestFetch: null,
  error: null,
};

const defaultContext: HydrationContext = {
  domain: "BIZOPS",
  role: "business-ops",
  tenantId: "t1",
  userName: "User",
  connectedApps: [],
};

const noopContextValue: FabricContextValue = {
  status: defaultStatus,
  manifest: null,
  context: defaultContext,
  getSlotState: () => ({
    slotId: "",
    phase: "idle",
    data: null,
    error: null,
    fetchedAt: null,
    staleAt: null,
    retryCount: 0,
    provenance: null,
  }),
  hydrate: async () => null,
  invalidate: () => {},
  invalidatePattern: () => {},
  refreshManifest: async () => {},
  updateContext: () => {},
  registerProvider: () => {},
  getProviderHealth: async () => ({}) as Record<ProviderType, HealthStatus>,
};

const FabricContext = createContext<FabricContextValue>(noopContextValue);

// ─── Role Gate ───────────────────────────────────────────────────────────────

function resolveRoleBinding(
  manifest: FabricManifest,
  domain: string,
  role: string
): RoleBinding | null {
  // Try exact match first
  const exact =
    manifest.roleBindings[`${domain}:${role}`] ||
    manifest.roleBindings[domain] ||
    manifest.roleBindings[role];
  if (exact) return exact;

  // Try wildcard/default
  return manifest.roleBindings["*"] || null;
}

function isSlotAllowed(slotId: string, roleBinding: RoleBinding | null): boolean {
  if (!roleBinding) return true; // No role config = allow all

  // Check denied first (takes precedence)
  if (roleBinding.deniedSlots?.some((p) => matchPattern(slotId, p))) {
    return false;
  }

  // Check allowed
  return roleBinding.allowedSlots.some((p) => matchPattern(slotId, p));
}

function matchPattern(value: string, pattern: string): boolean {
  if (pattern === "*") return true;
  const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
  return regex.test(value);
}

function resolveSlotBinding(
  manifest: FabricManifest,
  slotId: string,
  roleBinding: RoleBinding | null
): SlotBinding | null {
  const base = manifest.slots[slotId];
  if (!base) return null;

  // Apply role-specific overrides
  if (roleBinding?.overrides) {
    const override = roleBinding.overrides.find((o) => o.slotId === slotId);
    if (override) {
      return {
        ...base,
        ...(override.provider !== undefined && { provider: override.provider }),
        ...(override.endpoint !== undefined && { endpoint: override.endpoint }),
        ...(override.ttl !== undefined && { ttl: override.ttl }),
        ...(override.transform !== undefined && { transform: override.transform }),
        ...(override.priority !== undefined && { priority: override.priority }),
      };
    }
  }

  return base;
}

// ─── Provider Registration ───────────────────────────────────────────────────

function registerDefaultProviders(bus: ProviderBus, manifest: FabricManifest): void {
  const providerMap: Record<ProviderType, ProviderFactory> = {
    spine: createSpineAdapter,
    rest: createRestAdapter,
    doppler: createDopplerAdapter,
    static: createStaticAdapter,
    kv: createKVAdapter,
    graphql: createRestAdapter, // GraphQL uses REST adapter with POST
  };

  for (const [type, config] of Object.entries(manifest.providers)) {
    const factory = providerMap[type as ProviderType];
    if (factory && config.enabled) {
      bus.register(type as ProviderType, factory, config);
    }
  }
}

// ─── Fabric Provider Component ──────────────────────────────────────────────

export interface HydrationFabricProps {
  children: ReactNode;
  /** Initial hydration context (domain, role, etc.) */
  initialContext?: Partial<HydrationContext>;
  /** Override manifest URL (for testing) */
  manifestUrl?: string;
  /** Skip manifest fetch and use this manifest directly */
  staticManifest?: FabricManifest;
}

export function HydrationFabric({
  children,
  initialContext,
  manifestUrl,
  staticManifest,
}: HydrationFabricProps) {
  const [status, setStatus] = useState<FabricStatus>(defaultStatus);
  const [manifest, setManifest] = useState<FabricManifest | null>(staticManifest || null);
  const [hydrationCtx, setHydrationCtx] = useState<HydrationContext>({
    ...defaultContext,
    ...initialContext,
  });

  // Per-slot state tracking
  const slotStates = useRef<Map<string, SlotState>>(new Map());
  const slotListeners = useRef<Map<string, Set<() => void>>>(new Map());
  const busRef = useRef<ProviderBus>(getProviderBus());

  // ── Notify slot listeners ──────────────────────────────────────────────

  const notifySlot = useCallback((slotId: string) => {
    const listeners = slotListeners.current.get(slotId);
    if (listeners) {
      listeners.forEach((fn) => fn());
    }
  }, []);

  // ── Slot State Management ──────────────────────────────────────────────

  const updateSlotState = useCallback(
    (slotId: string, patch: Partial<SlotState>) => {
      const current = slotStates.current.get(slotId) || {
        slotId,
        phase: "idle" as HydrationPhase,
        data: null,
        error: null,
        fetchedAt: null,
        staleAt: null,
        retryCount: 0,
        provenance: null,
      };
      slotStates.current.set(slotId, { ...current, ...patch });
      notifySlot(slotId);
    },
    [notifySlot]
  );

  const getSlotState = useCallback(<T = any,>(slotId: string): SlotState<T> => {
    return (
      slotStates.current.get(slotId) || {
        slotId,
        phase: "idle" as HydrationPhase,
        data: null,
        error: null,
        fetchedAt: null,
        staleAt: null,
        retryCount: 0,
        provenance: null,
      }
    );
  }, []);

  // ── Manifest Fetch ─────────────────────────────────────────────────────

  const fetchManifest = useCallback(async () => {
    if (staticManifest) {
      setManifest(staticManifest);
      return staticManifest;
    }

    // Try to fetch manifest from server BFF first
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const serverManifest = await apiFetch<FabricManifest>(
        "/api/v1/workspace/hydration/manifest",
        { timeout: 5000 },
        "HydrationManifest"
      );
      if (serverManifest?.slots) {
        setManifest(serverManifest);
        console.log(
          "[HydrationFabric] Server manifest loaded:",
          Object.keys(serverManifest.slots).length,
          "slots"
        );
        return serverManifest;
      }
    } catch (err: any) {
      console.warn(
        "[HydrationFabric] Server manifest unavailable, using inline fallback:",
        err.message
      );
    }

    // Fall through to inline fallback manifest
    console.log("[HydrationFabric] Using inline manifest (fallback)");
    const fallback = buildInlineManifest(hydrationCtx);
    setManifest(fallback);
    return fallback;
  }, [staticManifest, hydrationCtx]);

  // ── Initialization ─────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus((s) => ({ ...s, initializing: true, error: null }));

      try {
        const m = await fetchManifest();
        if (cancelled || !m) return;

        // Register providers dynamically
        const bus = busRef.current;
        registerDefaultProviders(bus, m);

        // Eagerly hydrate preload slots for the current role
        const roleBinding = resolveRoleBinding(m, hydrationCtx.domain, hydrationCtx.role);
        if (roleBinding?.preloadSlots) {
          // Fire and forget — don't block initialization
          for (const slotId of roleBinding.preloadSlots) {
            hydrateSlot(slotId, m, bus, roleBinding).catch(() => {});
          }
        }

        setStatus({
          initialized: true,
          initializing: false,
          manifestLoaded: true,
          configSource: m.configSource,
          activeProviders: bus.getRegisteredProviders(),
          slotCount: Object.keys(m.slots).length,
          healthyProviders: bus.getRegisteredProviders().length,
          totalProviders: Object.keys(m.providers).length,
          lastManifestFetch: new Date().toISOString(),
          error: null,
        });
      } catch (err: any) {
        console.error("[HydrationFabric] Init failed:", err);
        setStatus((s) => ({
          ...s,
          initializing: false,
          error: err.message,
        }));
      }
    }

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationCtx.domain, hydrationCtx.role]);

  // ── Core Hydrate Function ──────────────────────────────────────────────

  async function hydrateSlot<T = any>(
    slotId: string,
    m: FabricManifest,
    bus: ProviderBus,
    roleBinding: RoleBinding | null,
    extraParams?: Record<string, any>
  ): Promise<T | null> {
    // Role gate
    if (!isSlotAllowed(slotId, roleBinding)) {
      updateSlotState(slotId, {
        phase: "error",
        error: `Access denied: role '${hydrationCtx.role}' cannot access slot '${slotId}'`,
      });
      return null;
    }

    // Resolve binding
    const binding = resolveSlotBinding(m, slotId, roleBinding);
    if (!binding) {
      updateSlotState(slotId, {
        phase: "error",
        error: `No binding found for slot '${slotId}' in manifest`,
      });
      return null;
    }

    // Merge extra params
    const finalBinding: SlotBinding = extraParams
      ? { ...binding, params: { ...binding.params, ...extraParams } }
      : binding;

    // Update phase → skeleton
    updateSlotState(slotId, { phase: "skeleton", error: null });

    try {
      // Attempt stale-while-revalidate
      const result = await bus.fetchWithSWR<T>(finalBinding, hydrationCtx, (refreshed) => {
        // Background refresh completed
        updateSlotState(slotId, {
          phase: "complete",
          data: refreshed.data,
          fetchedAt: Date.now(),
          staleAt: finalBinding.ttl > 0 ? Date.now() + finalBinding.ttl : null,
          provenance: refreshed.provenance,
        });
      });

      if (result) {
        const phase: HydrationPhase = result.partial ? "partial" : "complete";
        updateSlotState(slotId, {
          phase,
          data: result.data,
          fetchedAt: Date.now(),
          staleAt: finalBinding.ttl > 0 ? Date.now() + finalBinding.ttl : null,
          provenance: result.provenance,
          retryCount: 0,
        });
        return result.data;
      }

      return null;
    } catch (err: any) {
      const current = slotStates.current.get(slotId);
      updateSlotState(slotId, {
        phase: "error",
        error: err.message,
        retryCount: (current?.retryCount || 0) + 1,
      });
      console.error(`[HydrationFabric] Hydrate failed for ${slotId}:`, err.message);
      return null;
    }
  }

  // ── Context Value ──────────────────────────────────────────────────────

  const hydrate = useCallback(
    async <T = any,>(slotId: string, extraParams?: Record<string, any>): Promise<T | null> => {
      if (!manifest) {
        console.warn("[HydrationFabric] Cannot hydrate — manifest not loaded");
        return null;
      }
      const roleBinding = resolveRoleBinding(manifest, hydrationCtx.domain, hydrationCtx.role);
      return hydrateSlot<T>(slotId, manifest, busRef.current, roleBinding, extraParams);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manifest, hydrationCtx]
  );

  const invalidate = useCallback(
    (slotId: string) => {
      busRef.current.cache.invalidate(slotId);
      updateSlotState(slotId, { phase: "stale" });
    },
    [updateSlotState]
  );

  const invalidatePattern = useCallback(
    (pattern: string) => {
      busRef.current.cache.invalidatePattern(pattern);
      // Mark all matching slots as stale
      for (const [id] of slotStates.current) {
        if (matchPattern(id, pattern)) {
          updateSlotState(id, { phase: "stale" });
        }
      }
    },
    [updateSlotState]
  );

  const refreshManifest = useCallback(async () => {
    setStatus((s) => ({ ...s, initializing: true }));
    await fetchManifest();
    setStatus((s) => ({ ...s, initializing: false }));
  }, [fetchManifest]);

  const updateContext = useCallback((patch: Partial<HydrationContext>) => {
    setHydrationCtx((prev) => ({ ...prev, ...patch }));
  }, []);

  const registerProvider = useCallback(
    (type: ProviderType, factory: ProviderFactory, config: ProviderConfig) => {
      busRef.current.register(type, factory, config);
      setStatus((s) => ({
        ...s,
        activeProviders: busRef.current.getRegisteredProviders(),
      }));
    },
    []
  );

  const getProviderHealth = useCallback(async () => {
    return busRef.current.healthCheck();
  }, []);

  // ── Subscribe mechanism for hooks ──────────────────────────────────────

  // Exposed via a second context so hooks can subscribe to slot changes
  const subscribeToSlot = useCallback((slotId: string, listener: () => void): (() => void) => {
    if (!slotListeners.current.has(slotId)) {
      slotListeners.current.set(slotId, new Set());
    }
    slotListeners.current.get(slotId)!.add(listener);
    return () => {
      slotListeners.current.get(slotId)?.delete(listener);
    };
  }, []);

  const contextValue: FabricContextValue = {
    status,
    manifest,
    context: hydrationCtx,
    getSlotState,
    hydrate,
    invalidate,
    invalidatePattern,
    refreshManifest,
    updateContext,
    registerProvider,
    getProviderHealth,
  };

  return (
    <FabricContext.Provider value={contextValue}>
      <FabricSubscribeContext.Provider value={subscribeToSlot}>
        {children}
      </FabricSubscribeContext.Provider>
    </FabricContext.Provider>
  );
}

// ── Internal subscribe context (used by hooks) ──────────────────────────────

type SubscribeFn = (slotId: string, listener: () => void) => () => void;

const FabricSubscribeContext = createContext<SubscribeFn>(() => () => {});

export function useFabricSubscribe() {
  return useContext(FabricSubscribeContext);
}

// ── Public hook to access the fabric context ────────────────────────────────

export function useFabric(): FabricContextValue {
  return useContext(FabricContext);
}

// ─── Inline Fallback Manifest (v3.5 routes) ──────────────────────────────────
// Defines slot bindings that route through Gateway Worker /api/v1/* endpoints.
// The Spine adapter calls the unified API client which injects JWT + tenant headers.
// Falls back to static data if Gateway is unreachable.

function buildInlineManifest(ctx: HydrationContext): FabricManifest {
  const domain = ctx.domain.toLowerCase();

  // ── Helper: build entity slot for any domain + entity type ──────────
  function entitySlot(d: string, entityType: string, ttl = 30000, priority = 3): SlotBinding {
    return {
      slotId: `${d}.${entityType}`,
      provider: "rest",
      endpoint: `/api/v1/pipeline/entities?type=${entityType}&domain=${d}`,
      ttl,
      priority,
    };
  }

  // ── Helper: build dashboard slot for any domain ──────────────────────
  function dashboardSlot(d: string, ttl = 30000): SlotBinding {
    return {
      slotId: `${d}.dashboard`,
      provider: "rest",
      endpoint: `/api/v1/workspace/dashboard?domain=${d}`,
      ttl,
      priority: 1,
    };
  }

  // ── Helper: build knowledge slot for any domain ─────────────────────
  function knowledgeSlot(d: string): SlotBinding {
    return {
      slotId: `${d}.documents`,
      provider: "rest",
      endpoint: `/api/v1/knowledge/documents?domain=${d}`,
      ttl: 30000,
      priority: 5,
    };
  }

  // ── All 12 domains that need dashboard + entity slots ───────────────
  const ALL_DOMAINS = [
    "customer_success",
    "sales",
    "revops",
    "salesops",
    "marketing",
    "bizops",
    "finance",
    "product_engineering",
    "service",
    "procurement",
    "it_admin",
    "student_teacher",
    "personal",
  ];

  // ── Common entity types per domain ──────────────────────────────────
  const DOMAIN_ENTITIES: Record<string, string[]> = {
    customer_success: [
      "account",
      "contact",
      "task",
      "activity",
      "meeting",
      "risk",
      "renewal",
      "engagement",
    ],
    sales: ["deal", "account", "contact", "activity", "quote", "task"],
    revops: ["deal", "account", "territory", "quota", "comp_plan"],
    salesops: ["deal", "contact", "activity", "task"],
    marketing: ["campaign", "lead", "form", "email_campaign", "social_post", "blog_post"],
    bizops: ["project", "workflow", "task", "account"],
    finance: ["revenue_line_item", "expense", "invoice", "budget"],
    product_engineering: ["roadmap_item", "feature", "bug", "sprint", "release", "task"],
    service: ["ticket", "account", "feedback"],
    procurement: ["vendor", "purchase_order", "contract"],
    it_admin: ["user", "role", "permission", "integration"],
    student_teacher: ["course", "assignment", "grade", "discussion", "project"],
    personal: ["personal_task", "calendar_event", "personal_project", "note"],
  };

  // ── Build all domain slots dynamically ──────────────────────────────
  const domainSlots: Record<string, SlotBinding> = {};

  for (const d of ALL_DOMAINS) {
    // Dashboard slot for every domain
    domainSlots[`${d}.dashboard`] = dashboardSlot(d);

    // Entity slots for this domain
    const entities = DOMAIN_ENTITIES[d] || [];
    for (const etype of entities) {
      const slotId = `${d}.${etype}s`;
      domainSlots[slotId] = entitySlot(d, etype, etype === "task" ? 15000 : 30000);
    }

    // Knowledge/documents slot for every domain
    domainSlots[`${d}.documents`] = knowledgeSlot(d);
  }

  // Cross-domain: salesops/revops dashboards read from sales aggregation
  if (domain === "salesops" || domain === "revops") {
    domainSlots[`${domain}.dashboard`] = {
      slotId: `${domain}.dashboard`,
      provider: "rest",
      endpoint: "/api/v1/workspace/dashboard?domain=sales",
      ttl: 30000,
      priority: 1,
    };
  }

  return {
    version: "3.6.0-inline",
    generatedAt: new Date().toISOString(),
    configSource: "inline",

    providers: {
      spine: { type: "spine", enabled: true },
      rest: { type: "rest", enabled: true, baseUrl: "" },
      doppler: { type: "doppler", enabled: false },
      static: { type: "static", enabled: true, meta: { datasets: {} } },
      kv: { type: "kv", enabled: true },
      graphql: { type: "graphql", enabled: false },
    },

    slots: {
      // ── Global workspace BFF slots (Section 22.1 → ⑥ BFF) ──────────
      "global.readiness": {
        slotId: "global.readiness",
        provider: "rest",
        endpoint: "/api/v1/workspace/readiness",
        ttl: 60000,
        priority: 1,
        fallbackProvider: "static",
      },
      "global.navigation": {
        slotId: "global.navigation",
        provider: "rest",
        endpoint: "/api/v1/workspace/navigation",
        ttl: 120000,
        priority: 1,
      },

      // ── Pipeline global slots (Section 22.1 → ③ Pipeline) ──────────
      "global.metadata": {
        slotId: "global.metadata",
        provider: "rest",
        endpoint: "/api/v1/pipeline/schema",
        ttl: 120000,
        priority: 2,
      },
      "global.pipeline.status": {
        slotId: "global.pipeline.status",
        provider: "rest",
        endpoint: "/api/v1/pipeline/status",
        ttl: 30000,
        priority: 3,
      },

      // ── Intelligence slots (Section 22.2 → ④ Intelligence) ──────────
      "intelligence.signals": {
        slotId: "intelligence.signals",
        provider: "rest",
        endpoint: "/api/v1/cognitive/signals",
        ttl: 15000,
        priority: 2,
      },
      "intelligence.situations": {
        slotId: "intelligence.situations",
        provider: "rest",
        endpoint: "/api/v1/intelligence/situations",
        ttl: 30000,
        priority: 3,
      },
      "intelligence.agents": {
        slotId: "intelligence.agents",
        provider: "rest",
        endpoint: "/api/v1/cognitive/agents",
        ttl: 60000,
        priority: 5,
      },
      "intelligence.twin": {
        slotId: "intelligence.twin",
        provider: "rest",
        endpoint: "/api/v1/cognitive/twin/proactive",
        ttl: 60000,
        priority: 4,
      },

      // ── Governance slots (HITL — HARD GATE) ──────────────────────────
      "govern.hitl.queue": {
        slotId: "govern.hitl.queue",
        provider: "rest",
        endpoint: "/api/v1/cognitive/hitl/queue",
        ttl: 10000,
        priority: 2,
      },
      "govern.policies": {
        slotId: "govern.policies",
        provider: "rest",
        endpoint: "/api/v1/cognitive/govern/policies",
        ttl: 60000,
        priority: 4,
      },
      "govern.audit": {
        slotId: "govern.audit",
        provider: "rest",
        endpoint: "/api/v1/cognitive/audit",
        ttl: 30000,
        priority: 4,
      },

      // ── Connector slots ──────────────────────────────────────────────
      "connectors.list": {
        slotId: "connectors.list",
        provider: "rest",
        endpoint: "/api/v1/connector/list",
        ttl: 60000,
        priority: 3,
      },
      "connectors.status": {
        slotId: "connectors.status",
        provider: "rest",
        endpoint: "/api/v1/connector/status",
        ttl: 30000,
        priority: 3,
      },

      // ── Knowledge & Search slots ─────────────────────────────────────
      "knowledge.search": {
        slotId: "knowledge.search",
        provider: "rest",
        endpoint: "/api/v1/knowledge/search",
        method: "POST",
        ttl: 0,
        priority: 2,
      },
      "knowledge.sessions": {
        slotId: "knowledge.sessions",
        provider: "rest",
        endpoint: "/api/v1/knowledge/sessions",
        ttl: 30000,
        priority: 4,
      },

      // ── Accelerator slots (Domain Accelerators) ──────────────────────
      "accelerator.health_score": {
        slotId: "accelerator.health_score",
        provider: "rest",
        endpoint: "/api/v1/intelligence/accelerator/health-score",
        ttl: 30000,
        priority: 2,
      },
      "accelerator.churn_prediction": {
        slotId: "accelerator.churn_prediction",
        provider: "rest",
        endpoint: "/api/v1/intelligence/accelerator/churn-prediction",
        ttl: 60000,
        priority: 2,
      },
      "accelerator.revenue_forecast": {
        slotId: "accelerator.revenue_forecast",
        provider: "rest",
        endpoint: "/api/v1/intelligence/accelerator/revenue-forecast",
        ttl: 60000,
        priority: 3,
      },
      "accelerator.pipeline_velocity": {
        slotId: "accelerator.pipeline_velocity",
        provider: "rest",
        endpoint: "/api/v1/intelligence/accelerator/pipeline-velocity",
        ttl: 60000,
        priority: 3,
      },
      "accelerator.nps_analysis": {
        slotId: "accelerator.nps_analysis",
        provider: "rest",
        endpoint: "/api/v1/intelligence/accelerator/nps-analysis",
        ttl: 120000,
        priority: 4,
      },
      "accelerator.data_quality": {
        slotId: "accelerator.data_quality",
        provider: "rest",
        endpoint: "/api/v1/intelligence/accelerator/data-quality",
        ttl: 120000,
        priority: 4,
      },

      // ── Flow B: Unstructured Document slots ──────────────────────────
      "flow_b.upload": {
        slotId: "flow_b.upload",
        provider: "rest",
        endpoint: "/api/v1/knowledge/upload",
        method: "POST",
        ttl: 0,
        priority: 1,
      },
      "flow_b.status": {
        slotId: "flow_b.status",
        provider: "rest",
        endpoint: "/api/v1/knowledge/processing-status",
        ttl: 5000,
        priority: 2,
      },
      "flow_b.feedback": {
        slotId: "flow_b.feedback",
        provider: "rest",
        endpoint: "/api/v1/knowledge/extraction-feedback",
        method: "POST",
        ttl: 0,
        priority: 2,
      },

      // ── Flow C: AI Chat / MCP slots ──────────────────────────────────
      "flow_c.sessions": {
        slotId: "flow_c.sessions",
        provider: "rest",
        endpoint: "/api/v1/knowledge/sessions",
        ttl: 15000,
        priority: 2,
      },
      "flow_c.context_truth": {
        slotId: "flow_c.context_truth",
        provider: "rest",
        endpoint: "/api/v1/cognitive/context-to-truth",
        method: "POST",
        ttl: 0,
        priority: 1,
      },

      // ── Billing & Entitlements ───────────────────────────────────────
      "billing.subscription": {
        slotId: "billing.subscription",
        provider: "rest",
        endpoint: "/api/v1/billing/subscription",
        ttl: 120000,
        priority: 5,
      },
      "billing.usage": {
        slotId: "billing.usage",
        provider: "rest",
        endpoint: "/api/v1/billing/usage",
        ttl: 60000,
        priority: 5,
      },
      "billing.entitlements": {
        slotId: "billing.entitlements",
        provider: "rest",
        endpoint: "/api/v1/billing/entitlements",
        ttl: 120000,
        priority: 5,
      },

      // ── Website (marketing site) ────────────────────────────────────
      "website.dashboard": {
        slotId: "website.dashboard",
        provider: "rest",
        endpoint: "/api/v1/workspace/dashboard?domain=website",
        ttl: 30000,
        priority: 2,
      },

      // ── All domain-specific slots (dashboards + entities + docs) ────
      ...domainSlots,
    },

    roleBindings: {
      "*": {
        roleId: "*",
        domain: ctx.domain,
        allowedSlots: ["*"],
        hydrationStrategy: "lazy",
        maxConcurrent: 4,
        preloadSlots: [`${domain}.dashboard`, "global.readiness"],
      },
    },

    transforms: {
      identity: { id: "identity", description: "Pass through", type: "map" },
      "extract-data": {
        id: "extract-data",
        description: "Extract .data from response",
        type: "map",
        spec: { root: "data" },
      },
    },
  };
}
