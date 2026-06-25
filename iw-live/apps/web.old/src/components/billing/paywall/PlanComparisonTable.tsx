"use client";

import * as React from "react";
import { Check, Minus, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  PLAN_TIERS,
  FEATURE_CATEGORIES,
  FEATURE_DESCRIPTIONS,
  type PlanTier,
} from "@/config/plan-tiers";
import type { EntitlementTier } from "@/config/os-shell-registry";

export interface PlanComparisonTableProps {
  currentPlan: EntitlementTier;
  billingCycle: "monthly" | "annual";
  onBillingCycleChange: (cycle: "monthly" | "annual") => void;
  onSelectPlan: (plan: EntitlementTier) => void;
  className?: string;
}

function formatPrice(price: number | null, cycle: "monthly" | "annual"): string {
  if (price === null) return "Custom";
  if (price === 0) return "Free";
  return `$${price}`;
}

function formatLimit(value: number | null): string {
  if (value === null) return "Unlimited";
  return value.toLocaleString();
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="h-5 w-5 text-green-500" />;
  }
  if (value === false) {
    return <Minus className="h-5 w-5 text-slate-300" />;
  }
  // String value like "basic", "governed"
  return <span className="text-sm text-slate-600 capitalize">{value}</span>;
}

export function PlanComparisonTable({
  currentPlan,
  billingCycle,
  onBillingCycleChange,
  onSelectPlan,
  className,
}: PlanComparisonTableProps) {
  const annualSavings = Math.round(((39 - 29) / 39) * 100); // ~26% savings

  return (
    <div className={cn("space-y-8", className)}>
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label
          htmlFor="billing-cycle"
          className={cn(
            "text-sm transition-colors",
            billingCycle === "monthly" ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          Monthly
        </Label>
        <Switch
          id="billing-cycle"
          checked={billingCycle === "annual"}
          onCheckedChange={(checked) => onBillingCycleChange(checked ? "annual" : "monthly")}
        />
        <Label
          htmlFor="billing-cycle"
          className={cn(
            "text-sm transition-colors",
            billingCycle === "annual" ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          Annual
          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
            Save {annualSavings}%
          </Badge>
        </Label>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLAN_TIERS.map((tier) => {
          const isCurrent = tier.id === currentPlan;
          const price = billingCycle === "annual" ? tier.priceAnnual : tier.priceMonthly;
          const isHighlighted = tier.highlighted;

          return (
            <Card
              key={tier.id}
              className={cn(
                "relative flex flex-col",
                isHighlighted && "ring-2 ring-primary shadow-lg",
                isCurrent && "bg-muted/50"
              )}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <CardDescription className="text-xs">{tier.tagline}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {formatPrice(price ?? 0, billingCycle)}
                  </span>
                  {(price ?? 0) !== 0 && (
                    <span className="text-muted-foreground text-sm">/user/mo</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Key Limits */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Users</span>
                    <span className="font-medium">{formatLimit(tier.limits?.users ?? null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Integrations</span>
                    <span className="font-medium">
                      {formatLimit(tier.limits?.integrations ?? null)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Sessions</span>
                    <span className="font-medium">
                      {formatLimit(tier.limits?.aiSessions ?? null)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage</span>
                    <span className="font-medium">
                      {tier.limits?.storageGb === null
                        ? "Unlimited"
                        : `${tier.limits?.storageGb} GB`}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-auto pt-4">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : tier.priceMonthly === null ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onSelectPlan(tier.id as EntitlementTier)}
                    >
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      className={cn("w-full", isHighlighted && "bg-primary")}
                      onClick={() => onSelectPlan(tier.id as EntitlementTier)}
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      {PLAN_TIERS.findIndex((p) => p.id === tier.id) >
                      PLAN_TIERS.findIndex((p) => p.id === currentPlan)
                        ? "Upgrade"
                        : "Downgrade"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium">Features</th>
              {PLAN_TIERS.map((tier) => (
                <th
                  key={tier.id}
                  className={cn(
                    "text-center py-3 px-4 font-medium",
                    tier.id === currentPlan && "bg-muted/50"
                  )}
                >
                  {tier.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_CATEGORIES.map((category) => (
              <React.Fragment key={category.key}>
                {/* Category Header */}
                <tr className="bg-muted/30">
                  <td
                    colSpan={5}
                    className="py-2 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    {category.label}
                  </td>
                </tr>
                {/* Feature Rows */}
                {category.features.map((featureKey) => (
                  <tr key={featureKey} className="border-b border-muted/50">
                    <td className="py-2 px-4 text-muted-foreground">
                      {FEATURE_DESCRIPTIONS[featureKey] || featureKey}
                    </td>
                    {PLAN_TIERS.map((tier) => (
                      <td
                        key={`${tier.id}-${featureKey}`}
                        className={cn(
                          "text-center py-2 px-4",
                          tier.id === currentPlan && "bg-muted/50"
                        )}
                      >
                        <div className="flex justify-center">
                          <FeatureValue
                            value={
                              (tier.features as Record<string, boolean | string>)[featureKey] ??
                              false
                            }
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
