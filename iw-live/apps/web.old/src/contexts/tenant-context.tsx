import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiFetch } from "@/lib/api-client";

export type TenantPlan = "personal" | "free" | "starter" | "growth" | "enterprise";

interface TenantContextType {
  id?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
  plan?: TenantPlan;
  featureFlags?: Record<string, boolean>;
  limits?: Record<string, number | string | undefined>;
  usage?: Record<string, number>;
  setTenantId: (id: string) => void;
  setTenantName: (name: string) => void;
  setPlan: (plan: TenantPlan) => void;
}

const TenantContext = createContext<TenantContextType>({
  id: null,
  tenantId: null,
  tenantName: null,
  plan: "free",
  featureFlags: {},
  limits: {},
  usage: {},
  setTenantId: () => {},
  setTenantName: () => {},
  setPlan: () => {},
});

export function TenantProvider({
  children,
  initialTenantId,
}: {
  children: ReactNode;
  initialTenantId?: string | null;
}) {
  const [tenantId, setTenantId] = useState<string | null>(initialTenantId ?? null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [plan, setPlan] = useState<TenantPlan>("free");
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [limits, setLimits] = useState<Record<string, number | string | undefined>>({});
  const [usage, setUsage] = useState<Record<string, number>>({});

  // Sync initialTenantId prop into state when it changes
  useEffect(() => {
    if (initialTenantId && initialTenantId !== tenantId) {
      setTenantId(initialTenantId);
    }
  }, [initialTenantId]);

  // Fetch billing subscription when tenantId is set → sync plan/limits/usage
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    async function fetchBillingContext() {
      try {
        const sub = await apiFetch<any>(
          "/api/v1/billing/subscription",
          {},
          "TenantSubscription"
        ).catch(() => null);

        if (cancelled) return;

        if (sub?.subscription?.plan || sub?.plan) {
          const planSlug = (sub.subscription?.plan || sub.plan || "free").toLowerCase();
          const tierMap: Record<string, TenantPlan> = {
            free: "free",
            starter: "starter",
            pro: "starter",
            growth: "growth",
            business: "growth",
            enterprise: "enterprise",
            personal: "personal",
          };
          setPlan(tierMap[planSlug] || "free");
        }

        // Also fetch entitlements for limits & usage
        const ent = await apiFetch<any>(
          `/api/v1/billing/entitlements/${tenantId}`,
          {},
          "TenantEntitlements"
        ).catch(() => null);

        if (cancelled) return;

        if (ent?.entitlements?.limits || ent?.limits) {
          setLimits(ent.entitlements?.limits || ent.limits || {});
        }
        if (ent?.entitlements?.usage || ent?.usage) {
          setUsage(ent.entitlements?.usage || ent.usage || {});
        }
        if (ent?.entitlements?.features) {
          const flags: Record<string, boolean> = {};
          for (const f of ent.entitlements.features) flags[f] = true;
          setFeatureFlags(flags);
        }
      } catch (err) {
        console.warn("[TenantProvider] billing fetch failed, using defaults");
      }
    }

    fetchBillingContext();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return (
    <TenantContext.Provider
      value={{
        id: tenantId,
        tenantId,
        tenantName,
        plan,
        featureFlags,
        limits,
        usage,
        setTenantId,
        setTenantName,
        setPlan,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

export default TenantContext;
