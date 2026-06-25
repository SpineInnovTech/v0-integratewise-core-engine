"use client";

import * as React from "react";
import { useTenant } from "@/contexts/tenant-context";
import { featureAccess } from "@/lib/entitlements";
import { UpgradePrompt } from "./UpgradePrompt";
import { FEATURE_DESCRIPTIONS } from "@/config/plan-tiers";
import type { EntitlementTier } from "@/config/os-shell-registry";

export interface FeatureGateProps {
  /**
   * Feature key from FEATURE_GATES (e.g., "worlds.accounts", "surfaces.iq_hub")
   */
  featureKey: string;
  /**
   * Content to render when feature is accessible
   */
  children: React.ReactNode;
  /**
   * Custom fallback when feature is not accessible (default: UpgradePrompt)
   */
  fallback?: React.ReactNode;
  /**
   * Variant for the default UpgradePrompt fallback
   */
  variant?: "inline" | "full" | "banner";
  /**
   * Custom feature name for display (defaults to FEATURE_DESCRIPTIONS lookup)
   */
  featureName?: string;
}

/**
 * Composable feature gate component.
 * Renders children if user has access to the feature, otherwise shows upgrade prompt.
 *
 * @example
 * ```tsx
 * <FeatureGate featureKey="surfaces.iq_hub">
 *   <IQHubContent />
 * </FeatureGate>
 *
 * // With custom fallback
 * <FeatureGate featureKey="ai.auto_execution" fallback={<ManualModeUI />}>
 *   <AutoExecutionUI />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  featureKey,
  children,
  fallback,
  variant = "full",
  featureName,
}: FeatureGateProps) {
  const { plan, featureFlags } = useTenant();

  const access = featureAccess({
    plan,
    featureFlags,
    featureKey,
  });

  const hasAccess = typeof access === "object" && access !== null ? access.hasAccess : access;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Use custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default to UpgradePrompt
  const displayName =
    featureName ||
    FEATURE_DESCRIPTIONS[featureKey as keyof typeof FEATURE_DESCRIPTIONS] ||
    featureKey;

  return (
    <UpgradePrompt
      featureName={displayName}
      requiredPlan={
        ((typeof access === "object" ? access.requiredPlan : "starter") ||
          "starter") as EntitlementTier
      }
      currentPlan={(plan ?? "free") as EntitlementTier}
      variant={variant}
    />
  );
}

/**
 * Hook to check feature access without rendering
 *
 * @example
 * ```tsx
 * const { hasAccess, requiredPlan } = useFeatureAccess("surfaces.iq_hub")
 * if (!hasAccess) {
 *   // handle locked state
 * }
 * ```
 */
export function useFeatureAccess(featureKey: string) {
  const { plan, featureFlags } = useTenant();

  return React.useMemo(
    () => featureAccess({ plan, featureFlags, featureKey }),
    [plan, featureFlags, featureKey]
  );
}
