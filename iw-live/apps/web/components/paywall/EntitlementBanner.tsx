'use client';

import { useEntitlements } from '@/lib/billing/hooks';
import { ENTITLEMENT_KEYS } from '@/lib/billing/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EntitlementBannerProps {
  orgId: string | null;
  entitlementKey: keyof typeof ENTITLEMENT_KEYS;
  currentUsage?: number;
  showUpgrade?: boolean;
}

/**
 * EntitlementBanner - Shows current plan limits and usage
 * 
 * Displays:
 * - Current plan limits
 * - Usage progress (if applicable)
 * - Upgrade CTA when approaching limits
 */
export function EntitlementBanner({
  orgId,
  entitlementKey,
  currentUsage = 0,
  showUpgrade = true,
}: EntitlementBannerProps) {
  const { entitlements, checkLimit, loading } = useEntitlements(orgId);

  if (loading) {
    return null;
  }

  const limit = entitlements[ENTITLEMENT_KEYS[entitlementKey]];
  const isUnlimited = limit >= 999999;
  const limitCheck = checkLimit(ENTITLEMENT_KEYS[entitlementKey], currentUsage);

  if (isUnlimited) {
    return null; // Don't show banner for unlimited plans
  }

  const percentage = limitCheck.percentage;
  const isNearLimit = percentage >= 80;
  const isAtLimit = !limitCheck.allowed;

  if (isAtLimit) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Limit Reached</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            You've reached your {ENTITLEMENT_KEYS[entitlementKey]} limit ({limit}).
          </span>
          {showUpgrade && (
            <Button asChild size="sm" variant="outline" className="ml-4">
              <Link href="/pricing">Upgrade</Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isNearLimit) {
    return (
      <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Approaching Limit</AlertTitle>
        <AlertDescription className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {currentUsage} of {limit} used ({Math.round(percentage)}%)
            </span>
            {showUpgrade && (
              <Button asChild size="sm" variant="outline" className="ml-4">
                <Link href="/pricing">Upgrade</Link>
              </Button>
            )}
          </div>
          <Progress value={percentage} className="h-2" />
        </AlertDescription>
      </Alert>
    );
  }

  // Show usage info for all plans
  return (
    <Alert className="mb-4 border-blue-500/50 bg-blue-500/10">
      <CheckCircle2 className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between text-sm">
        <span>
          {currentUsage} of {limit} {ENTITLEMENT_KEYS[entitlementKey]} used
        </span>
        <Progress value={percentage} className="h-2 w-32 ml-4" />
      </AlertDescription>
    </Alert>
  );
}
