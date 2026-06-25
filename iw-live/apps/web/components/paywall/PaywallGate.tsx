'use client';

import { ReactNode } from 'react';
import { useEntitlement, ENTITLEMENT_KEYS } from '@/lib/billing/hooks';
import { UpgradePrompt } from './UpgradePrompt';
import { EntitlementBanner } from './EntitlementBanner';

interface PaywallGateProps {
  orgId: string | null;
  entitlementKey: keyof typeof ENTITLEMENT_KEYS;
  children: ReactNode;
  fallback?: ReactNode;
  showBanner?: boolean;
  requiredValue?: any;
  checkLimit?: (currentUsage: number) => boolean;
  currentUsage?: number;
}

/**
 * PaywallGate - Gates premium features based on entitlements
 * 
 * Usage:
 * <PaywallGate orgId={orgId} entitlementKey="MAX_WORKFLOWS">
 *   <PremiumFeature />
 * </PaywallGate>
 */
export function PaywallGate({
  orgId,
  entitlementKey,
  children,
  fallback,
  showBanner = true,
  requiredValue,
  checkLimit,
  currentUsage = 0,
}: PaywallGateProps) {
  const { hasEntitlement, value, loading } = useEntitlement(orgId, ENTITLEMENT_KEYS[entitlementKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if entitlement exists
  if (!hasEntitlement) {
    return (
      <>
        {showBanner && <EntitlementBanner orgId={orgId} entitlementKey={entitlementKey} />}
        {fallback || <UpgradePrompt entitlementKey={entitlementKey} />}
      </>
    );
  }

  // Check if specific value is required
  if (requiredValue !== undefined && value !== requiredValue) {
    return (
      <>
        {showBanner && <EntitlementBanner orgId={orgId} entitlementKey={entitlementKey} />}
        {fallback || <UpgradePrompt entitlementKey={entitlementKey} />}
      </>
    );
  }

  // Check limit if provided
  if (checkLimit && !checkLimit(currentUsage)) {
    return (
      <>
        {showBanner && <EntitlementBanner orgId={orgId} entitlementKey={entitlementKey} currentUsage={currentUsage} />}
        {fallback || <UpgradePrompt entitlementKey={entitlementKey} />}
      </>
    );
  }

  return <>{children}</>;
}
