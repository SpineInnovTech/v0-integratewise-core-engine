// React Hooks for Billing & Entitlements
// Client-side hooks to check subscription status and entitlements

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GetSubscriptionResponse, Plan, Invoice, EntitlementKey } from './types';

/**
 * Hook to fetch and manage subscription data
 */
export function useSubscription(org_id: string | null) {
  const [subscription, setSubscription] = useState<GetSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!org_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/billing/subscription?org_id=${org_id}`);
      const data = await response.json();

      if (data.success) {
        setSubscription(data.data);
        setError(null);
      } else {
        setError(data.error);
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [org_id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    refresh: fetchSubscription,
    isActive: subscription?.subscription.status === 'active',
    isTrial: subscription?.subscription.status === 'trial',
    isPastDue: subscription?.subscription.status === 'past_due',
    isCanceled: subscription?.subscription.status === 'canceled',
  };
}

/**
 * Hook to fetch available plans
 */
export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/billing/plans');
        const data = await response.json();

        if (data.success) {
          setPlans(data.data);
          setError(null);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load plans');
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  return { plans, loading, error };
}

/**
 * Hook to fetch invoices
 */
export function useInvoices(org_id: string | null) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!org_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/billing/invoices?org_id=${org_id}`);
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [org_id]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, loading, error, refresh: fetchInvoices };
}

/**
 * Hook to check if user has specific entitlement
 */
export function useEntitlement(org_id: string | null, entitlementKey: EntitlementKey) {
  const { subscription, loading } = useSubscription(org_id);
  
  const hasEntitlement = subscription?.entitlements?.[entitlementKey] ?? false;
  const value = subscription?.entitlements?.[entitlementKey];

  return {
    hasEntitlement: Boolean(hasEntitlement),
    value,
    loading,
  };
}

/**
 * Hook to check multiple entitlements at once
 */
export function useEntitlements(org_id: string | null) {
  const { subscription, loading } = useSubscription(org_id);
  
  const hasEntitlement = useCallback(
    (key: EntitlementKey) => {
      return Boolean(subscription?.entitlements?.[key]);
    },
    [subscription]
  );

  const getValue = useCallback(
    (key: EntitlementKey) => {
      return subscription?.entitlements?.[key];
    },
    [subscription]
  );

  const checkLimit = useCallback(
    (key: EntitlementKey, currentUsage: number) => {
      const limit = subscription?.entitlements?.[key] ?? 0;
      const isUnlimited = limit >= 999999;
      
      return {
        allowed: isUnlimited || currentUsage < limit,
        limit: isUnlimited ? Infinity : limit,
        usage: currentUsage,
        percentage: isUnlimited ? 0 : (currentUsage / limit) * 100,
      };
    },
    [subscription]
  );

  return {
    entitlements: subscription?.entitlements ?? {},
    hasEntitlement,
    getValue,
    checkLimit,
    loading,
  };
}

/**
 * Hook for subscription actions (cancel, change plan, etc.)
 */
export function useSubscriptionActions(org_id: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePlan = useCallback(
    async (newPlanCode: string, prorate = true) => {
      if (!org_id) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/billing/change-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id, new_plan_code: newPlanCode, prorate }),
        });

        const data = await response.json();

        if (data.success) {
          return data.data;
        } else {
          setError(data.error);
          return null;
        }
      } catch (err) {
        console.error('Error changing plan:', err);
        setError('Failed to change plan');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [org_id]
  );

  const cancelSubscription = useCallback(
    async (cancelAtPeriodEnd = true, reason?: string) => {
      if (!org_id) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/billing/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id, cancel_at_period_end: cancelAtPeriodEnd, reason }),
        });

        const data = await response.json();

        if (data.success) {
          return data.data;
        } else {
          setError(data.error);
          return null;
        }
      } catch (err) {
        console.error('Error canceling subscription:', err);
        setError('Failed to cancel subscription');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [org_id]
  );

  return {
    changePlan,
    cancelSubscription,
    loading,
    error,
  };
}

/**
 * Format currency helper
 */
export function formatCurrency(amountCents: number, currency: string = 'INR'): string {
  const amount = amountCents / 100;
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
  
  return `${currencySymbol}${amount.toLocaleString()}`;
}

/**
 * Format date helper
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
