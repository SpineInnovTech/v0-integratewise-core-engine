/**
 * SubscriptionsPage — Billing & Plan Management
 *
 * Wired to:
 *  - BillingClient for checkout (Stripe / Razorpay)
 *  - TenantContext for current plan, limits, usage
 *  - Entitlements API for real-time plan data
 *
 * Prices aligned with plan-tiers.ts: Starter $29/mo, Growth $79/mo
 */

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  Zap,
  Crown,
  Building2,
  ArrowRight,
  CreditCard,
  BarChart3,
  Users,
  Plug,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/contexts/tenant-context";
import { getBillingClient } from "@/lib/billing-client";

// ─── Plan Definitions (aligned with plan-tiers.ts + billing-service.ts) ─────
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "For small teams getting started with integration intelligence.",
    icon: Zap,
    color: "bg-[#2d5a3d]",
    features: [
      "Up to 3 integrations",
      "5 team members",
      "Basic intelligence insights",
      "5,000 entities synced",
      "Email support",
      "Personal & Work views",
    ],
    limits: { integrations: 3, members: 5, entities: 5000 },
  },
  {
    id: "growth",
    name: "Growth",
    price: "$79",
    period: "/mo",
    popular: true,
    description: "For growing teams that need full intelligence across their stack.",
    icon: Crown,
    color: "bg-[#c79f4a]",
    features: [
      "Up to 10 integrations",
      "20 team members",
      "Full AI intelligence + Chat",
      "50,000 entities synced",
      "Cross-team sync rules",
      "Priority support",
      "Custom dashboard sections",
      "Goal framework & tracking",
    ],
    limits: { integrations: 10, members: 20, entities: 50000 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations that need full control, compliance, and scale.",
    icon: Building2,
    color: "bg-[#142e20]",
    features: [
      "Unlimited integrations",
      "Unlimited team members",
      "Advanced AI agents",
      "Unlimited entities",
      "RBAC & approval workflows",
      "Dedicated support + SLA",
      "Custom AI training",
      "SSO & SAML",
      "Data residency options",
      "Audit log & compliance",
    ],
    limits: { integrations: Infinity, members: Infinity, entities: Infinity },
  },
];

interface Invoice {
  date: string;
  amount: string;
  status: string;
}

export function SubscriptionsPage() {
  const { plan: tenantPlan, limits, usage: tenantUsage } = useTenant();
  const currentPlan = tenantPlan || "free";
  const currentPlanData = PLANS.find((p) => p.id === currentPlan) || PLANS[0];

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices on mount
  useEffect(() => {
    let cancelled = false;
    const client = getBillingClient();
    client
      .getInvoices(5)
      .then((data) => {
        if (cancelled) return;
        if (data?.invoices?.length) {
          setInvoices(
            data.invoices.map((inv: any) => ({
              date: inv.date || inv.created_at || "—",
              amount: inv.amount ? `$${(inv.amount / 100).toFixed(2)}` : inv.total || "—",
              status: inv.status || "Paid",
            }))
          );
        }
      })
      .catch(() => {
        // Non-blocking — invoices section will show empty
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive usage from TenantContext (real data from billing API)
  const usageData = {
    integrations: {
      used: Number(tenantUsage?.integrations ?? 0),
      limit: Number(limits?.integrations ?? currentPlanData.limits.integrations),
    },
    members: {
      used: Number(tenantUsage?.users ?? 0),
      limit: Number(limits?.users ?? currentPlanData.limits.members),
    },
    entities: {
      used: Number(tenantUsage?.entities ?? 0),
      limit: Number(limits?.entities ?? currentPlanData.limits.entities),
    },
  };

  // Handle plan upgrade — initiate Stripe checkout (Razorpay for INR users in future)
  const handleUpgrade = useCallback(async (planId: string) => {
    if (planId === "enterprise") {
      // Enterprise = contact sales
      window.open("https://integratewise.ai/contact", "_blank");
      return;
    }

    setCheckoutLoading(planId);
    setError(null);

    try {
      const client = getBillingClient();
      await client.startStripeCheckout(
        planId,
        `${window.location.origin}/app/work/billing?success=1`,
        `${window.location.origin}/app/work/billing?cancelled=1`
      );
      // startStripeCheckout redirects to Stripe — if we reach here, something unexpected happened
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setCheckoutLoading(null);
    }
  }, []);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription & Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your plan, usage, and billing details.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Current Plan */}
        <Card className="border shadow-sm overflow-hidden">
          <div className={`h-2 ${currentPlanData.color}`} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${currentPlanData.color} flex items-center justify-center text-white`}
                >
                  <currentPlanData.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{currentPlanData.name} Plan</h3>
                    <Badge className="bg-iw-forest/10 text-iw-forest border-0 text-[9px]">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentPlanData.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {currentPlanData.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {currentPlanData.period}
                  </span>
                </div>
              </div>
            </div>

            {/* Usage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Integrations", icon: Plug, ...usageData.integrations },
                { label: "Team Members", icon: Users, ...usageData.members },
                {
                  label: "Entities Synced",
                  icon: BarChart3,
                  used: usageData.entities.used,
                  limit: usageData.entities.limit,
                },
              ].map((item, i) => {
                const pct =
                  item.limit === Infinity || item.limit === 0
                    ? 0
                    : Math.min(100, Math.round((item.used / item.limit) * 100));
                const isHigh = pct > 80;
                return (
                  <div key={i} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        {item.label}
                      </div>
                      <span
                        className={`text-xs font-bold ${isHigh ? "text-iw-gold" : "text-iw-forest-bright"}`}
                      >
                        {item.limit === Infinity
                          ? item.used.toLocaleString()
                          : `${item.used.toLocaleString()} / ${item.limit.toLocaleString()}`}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-1.5 ${isHigh ? "[&>div]:bg-iw-gold" : ""}`}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* All Plans */}
        <div>
          <h2 className="text-lg font-bold mb-4">Compare Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isLoading = checkoutLoading === plan.id;
              return (
                <Card
                  key={plan.id}
                  className={`border shadow-sm relative ${plan.popular ? "ring-2 ring-[#c79f4a]" : ""} ${isCurrent ? "bg-secondary/30" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#c79f4a] text-white border-0 text-[9px]">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-8 h-8 rounded-lg ${plan.color} flex items-center justify-center text-white`}
                      >
                        <plan.icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                    </div>
                    <div className="mb-3">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                    <div className="space-y-2 mb-4">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Check className="w-3.5 h-3.5 text-iw-forest-bright shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                    {isCurrent ? (
                      <Button variant="outline" className="w-full text-xs" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className={`w-full text-xs ${plan.popular ? "bg-[#c79f4a] hover:bg-[#c79f4a]" : "bg-[#2d5a3d] hover:bg-[#2d5a3d]"}`}
                        disabled={isLoading}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                        {plan.id === "enterprise" ? "Contact Sales" : "Upgrade"}
                        {!isLoading && <ArrowRight className="w-3 h-3 ml-1" />}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Billing History */}
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold mb-3">Recent Invoices</h3>
            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.map((inv, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{inv.date}</div>
                        <div className="text-[10px] text-muted-foreground">
                          IntegrateWise {currentPlanData.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{inv.amount}</span>
                      <Badge className="bg-iw-forest/10 text-iw-forest border-0 text-[9px]">
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No invoices yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
