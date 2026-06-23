import { useState, useEffect } from "react";
import { useTenant } from "@/contexts/tenant-context";
import { apiFetch } from "@/lib/api-client";

export interface EntitlementSet {
  maxSeats: number;
  maxConnectors: number;
  maxWorkflows: number;
  aiTokensPerMonth: number;
  features: string[];
  tier: "free" | "starter" | "growth" | "enterprise";
}

export type EntitlementTier = "personal" | "free" | "starter" | "growth" | "enterprise";

// ── Tier-based defaults (used as fallback when API is unavailable) ───────────
const TIER_DEFAULTS: Record<string, EntitlementSet> = {
  free: {
    maxSeats: 1,
    maxConnectors: 3, // increased for nango dev + more connector paths
    maxWorkflows: 3,
    aiTokensPerMonth: 100,
    features: ["workspace"],
    tier: "free",
  },
  starter: {
    maxSeats: 5,
    maxConnectors: 10, // increased for nango dev + more connector paths
    maxWorkflows: 10,
    aiTokensPerMonth: 1000,
    features: ["workspace", "connectors", "brainstorm"],
    tier: "starter",
  },
  growth: {
    maxSeats: 25,
    maxConnectors: 50, // increased for nango dev + more connector paths
    maxWorkflows: 100,
    aiTokensPerMonth: 10000,
    features: ["workspace", "connectors", "brainstorm", "auto_exec"],
    tier: "growth",
  },
  enterprise: {
    maxSeats: -1,
    maxConnectors: -1,
    maxWorkflows: -1,
    aiTokensPerMonth: -1,
    features: ["workspace", "connectors", "brainstorm", "auto_exec", "white_label"],
    tier: "enterprise",
  },
};

// In-memory cache for the last fetched entitlements
let _cachedEntitlements: EntitlementSet | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

/**
 * Fetch entitlements from the Billing service.
 * Returns cached result if fresh, otherwise calls API → falls back to tier defaults.
 */
export async function fetchEntitlements(tenantId?: string | null): Promise<EntitlementSet> {
  if (_cachedEntitlements && Date.now() - _cacheTimestamp < CACHE_TTL) {
    return _cachedEntitlements;
  }

  if (!tenantId) return TIER_DEFAULTS.free;

  try {
    const data = await apiFetch<any>(
      `/api/v1/billing/entitlements/${tenantId}`,
      {},
      "Entitlements"
    );

    const ent = data?.entitlements || data;
    const set: EntitlementSet = {
      maxSeats: ent?.limits?.users ?? ent?.remaining?.users ?? 5,
      maxConnectors: ent?.limits?.integrations ?? ent?.remaining?.integrations ?? 10,
      maxWorkflows: ent?.limits?.workflows ?? 10,
      aiTokensPerMonth: ent?.limits?.aiQueriesPerMonth ?? ent?.remaining?.aiQueriesPerMonth ?? 1000,
      features: Array.isArray(ent?.features)
        ? ent.features
        : ["workspace", "connectors", "brainstorm"],
      tier: (ent?.plan || ent?.planName || "starter") as EntitlementSet["tier"],
    };

    _cachedEntitlements = set;
    _cacheTimestamp = Date.now();
    return set;
  } catch (err) {
    console.warn("[entitlements] API unavailable, using tier defaults");
    return TIER_DEFAULTS.starter; // safe default
  }
}

/**
 * Synchronous getter — returns cached entitlements or tier default.
 * For async-fresh data use fetchEntitlements() or useEntitlements() hook.
 */
export function getEntitlements(tenantId?: string | null): EntitlementSet {
  if (_cachedEntitlements) return _cachedEntitlements;
  return TIER_DEFAULTS.starter;
}

export function hasEntitlement(feature: string, tenantId?: string): boolean {
  return getEntitlements(tenantId).features.includes(feature);
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  requiredPlan?: EntitlementTier;
}

export function featureAccess(
  featureOrOptions:
    | string
    | { plan?: EntitlementTier; featureFlags?: Record<string, boolean>; featureKey?: string },
  tenantId?: string
): FeatureAccessResult | boolean {
  // If called with object parameter
  if (typeof featureOrOptions === "object") {
    const { plan = "free", featureFlags = {}, featureKey = "" } = featureOrOptions;

    // Check feature flags first
    if (featureFlags[featureKey]) {
      return { hasAccess: true };
    }

    // Check plan-based access
    const planAccess: Record<string, { requiredPlan: EntitlementTier; plans: EntitlementTier[] }> =
      {
        "worlds.work": { requiredPlan: "starter", plans: ["starter", "growth", "enterprise"] },
        "worlds.accounts": { requiredPlan: "growth", plans: ["growth", "enterprise"] },
        "surfaces.iq_hub": { requiredPlan: "starter", plans: ["starter", "growth", "enterprise"] },
        "ai.auto_execution": { requiredPlan: "growth", plans: ["growth", "enterprise"] },
      };

    const featureConfig = planAccess[featureKey];
    if (!featureConfig) {
      // Feature not found in config, assume it's available for free
      return { hasAccess: true };
    }

    const hasAccess = featureConfig.plans.includes(plan);

    return {
      hasAccess,
      requiredPlan: featureConfig.requiredPlan,
      reason: !hasAccess
        ? `Feature "${featureKey}" requires ${featureConfig.requiredPlan} plan or higher`
        : undefined,
    };
  }

  // Legacy mode: feature string
  return hasEntitlement(featureOrOptions as string, tenantId);
}

export function planLabel(tier: EntitlementTier): string {
  const labels: Record<EntitlementTier, string> = {
    personal: "Personal",
    free: "Free",
    starter: "Starter",
    growth: "Growth",
    enterprise: "Enterprise",
  };
  return labels[tier] || tier;
}

export function useEntitlements() {
  const { tenantId, setPlan } = useTenant();
  const [entitlements, setEntitlements] = useState<EntitlementSet>(getEntitlements(tenantId));

  useEffect(() => {
    let cancelled = false;
    fetchEntitlements(tenantId).then((ent) => {
      if (cancelled) return;
      setEntitlements(ent);
      // Sync tier back into TenantContext so FeatureGate picks it up
      if (setPlan && ent.tier) {
        setPlan(ent.tier as any);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId, setPlan]);

  return entitlements;
}
