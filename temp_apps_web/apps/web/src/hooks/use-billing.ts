/**
 * useBilling — React hook for billing data (subscription, usage, plans).
 *
 * Wires to:
 *   GET /api/v1/billing/subscription   → current plan
 *   GET /api/v1/billing/plans          → available SKUs
 *   GET /api/v1/billing/usage/:tid     → usage metrics
 *   GET /api/v1/billing/entitlements/:tid → limits + remaining quota
 *
 * Provides single hook surface for any component that needs billing state.
 */
import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/contexts/tenant-context";
import { billing as billingApi } from "@/lib/api-client";

export interface BillingState {
  plan: string | null;
  planName: string | null;
  status: string | null;
  usage: Record<string, number>;
  limits: Record<string, number>;
  remaining: Record<string, number>;
  plans: any[];
  invoices: any[];
  isLoading: boolean;
  error: string | null;
}

export function useBilling() {
  const { tenantId } = useTenant();
  const [state, setState] = useState<BillingState>({
    plan: null,
    planName: null,
    status: null,
    usage: {},
    limits: {},
    remaining: {},
    plans: [],
    invoices: [],
    isLoading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    if (!tenantId) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const [sub, ent, plans] = await Promise.all([
        billingApi.subscription().catch(() => null),
        billingApi.entitlements(tenantId).catch(() => null),
        billingApi.plans().catch(() => null),
      ]);

      const subscription = (sub as any)?.subscription || sub;
      const entitlements = (ent as any)?.entitlements || ent;

      setState({
        plan: subscription?.plan || entitlements?.plan || null,
        planName: subscription?.planName || entitlements?.planName || null,
        status: subscription?.status || null,
        usage: entitlements?.usage || {},
        limits: entitlements?.limits || {},
        remaining: entitlements?.remaining || {},
        plans: Array.isArray((plans as any)?.plans)
          ? (plans as any).plans
          : Array.isArray(plans)
            ? plans
            : [],
        invoices: [],
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.warn("[useBilling] failed:", err?.message);
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err?.message || "Failed to load billing data",
      }));
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = useCallback(() => fetchAll(), [fetchAll]);

  const checkout = useCallback(async (skuId: string, gateway: "stripe" | "razorpay" = "stripe") => {
    const result = await billingApi.checkout(skuId, gateway);
    const url = (result as any)?.checkout_url || (result as any)?.url;
    if (url) window.location.href = url;
    return result;
  }, []);

  return { ...state, refetch, checkout };
}

export default useBilling;
