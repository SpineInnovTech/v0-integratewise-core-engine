"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/contexts/tenant-context";
import { planLabel } from "@/lib/entitlements";
import type { EntitlementTier } from "@/config/os-shell-registry";

export interface PlanBadgeProps {
  /**
   * Plan to display (defaults to current plan from useTenant)
   */
  plan?: EntitlementTier;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Show "Current" suffix for the current plan
   */
  showCurrent?: boolean;
}

const PLAN_COLORS: Record<EntitlementTier, string> = {
  personal: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  free: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  starter: "bg-[var(--iw-forest)]/10 text-iw-forest hover:bg-[var(--iw-forest)]/15",
  growth: "bg-[var(--iw-gold)]/10 text-iw-gold hover:bg-[var(--iw-gold)]/15",
  enterprise: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

/**
 * Badge component displaying the plan tier with appropriate colors.
 *
 * @example
 * ```tsx
 * <PlanBadge /> // Shows current plan
 * <PlanBadge plan="enterprise" />
 * <PlanBadge showCurrent /> // Shows "Team (Current)" if on team plan
 * ```
 */
export function PlanBadge({ plan, className, showCurrent = false }: PlanBadgeProps) {
  const { plan: currentPlan } = useTenant();
  const displayPlan = (plan ?? currentPlan ?? "free") as EntitlementTier;

  const label = planLabel(displayPlan);
  const isCurrent = displayPlan === currentPlan && showCurrent;

  return (
    <Badge variant="secondary" className={cn(PLAN_COLORS[displayPlan], "font-medium", className)}>
      {label}
      {isCurrent && " (Current)"}
    </Badge>
  );
}

/**
 * Inline text version of plan display
 */
export function PlanText({ plan, className }: { plan?: EntitlementTier; className?: string }) {
  const { plan: currentPlan } = useTenant();
  const displayPlan = (plan ?? currentPlan ?? "free") as EntitlementTier;

  const textColors: Record<EntitlementTier, string> = {
    personal: "text-slate-600",
    free: "text-gray-600",
    starter: "text-iw-forest",
    growth: "text-iw-gold",
    enterprise: "text-amber-600",
  };

  return (
    <span className={cn("font-medium", textColors[displayPlan], className)}>
      {planLabel(displayPlan)}
    </span>
  );
}
