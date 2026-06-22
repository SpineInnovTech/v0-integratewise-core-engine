import { useState } from "react";
import { Check, Zap, Crown, Building2, ArrowRight, CreditCard, Clock, BarChart3, Users, Plug } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Progress } from "./ui/progress";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "For small teams getting started with integration intelligence.",
    icon: Zap,
    color: "bg-[#3F5185]",
    features: [
      "Up to 5 integrations",
      "3 team members",
      "Basic intelligence insights",
      "5,000 entities synced",
      "Email support",
      "Personal & Work views",
    ],
    limits: { integrations: 5, members: 3, entities: 5000 },
  },
  {
    id: "growth",
    name: "Growth",
    price: "$99",
    period: "/mo",
    popular: true,
    description: "For growing teams that need full intelligence across their stack.",
    icon: Crown,
    color: "bg-[#D46780]",
    features: [
      "Up to 15 integrations",
      "10 team members",
      "Full AI intelligence + Chat",
      "50,000 entities synced",
      "Cross-team sync rules",
      "Priority support",
      "Custom dashboard sections",
      "Goal framework & tracking",
    ],
    limits: { integrations: 15, members: 10, entities: 50000 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations that need full control, compliance, and scale.",
    icon: Building2,
    color: "bg-[#1E2A4A]",
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

export function SubscriptionsPage() {
  const [currentPlan] = useState("growth");
  const currentPlanData = PLANS.find(p => p.id === currentPlan)!;

  const usage = {
    integrations: { used: 7, limit: currentPlanData.limits.integrations },
    members: { used: 5, limit: currentPlanData.limits.members },
    entities: { used: 34287, limit: currentPlanData.limits.entities },
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription & Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your plan, usage, and billing details.</p>
        </div>

        {/* Current Plan */}
        <Card className="border shadow-sm overflow-hidden">
          <div className={`h-2 ${currentPlanData.color}`} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${currentPlanData.color} flex items-center justify-center text-white`}>
                  <currentPlanData.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{currentPlanData.name} Plan</h3>
                    <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[9px]">Active</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentPlanData.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{currentPlanData.price}<span className="text-sm font-normal text-muted-foreground">{currentPlanData.period}</span></div>
                <div className="text-[10px] text-muted-foreground">Next billing: March 1, 2026</div>
              </div>
            </div>

            {/* Usage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Integrations", icon: Plug, ...usage.integrations },
                { label: "Team Members", icon: Users, ...usage.members },
                { label: "Entities Synced", icon: BarChart3, used: usage.entities.used, limit: usage.entities.limit },
              ].map((item, i) => {
                const pct = Math.min(100, Math.round((item.used / item.limit) * 100));
                const isHigh = pct > 80;
                return (
                  <div key={i} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        {item.label}
                      </div>
                      <span className={`text-xs font-bold ${isHigh ? "text-amber-600" : "text-emerald-600"}`}>
                        {item.limit === Infinity ? item.used.toLocaleString() : `${item.used.toLocaleString()} / ${item.limit.toLocaleString()}`}
                      </span>
                    </div>
                    <Progress value={pct} className={`h-1.5 ${isHigh ? "[&>div]:bg-amber-500" : ""}`} />
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
            {PLANS.map(plan => {
              const isCurrent = plan.id === currentPlan;
              return (
                <Card key={plan.id} className={`border shadow-sm relative ${plan.popular ? "ring-2 ring-[#D46780]" : ""} ${isCurrent ? "bg-secondary/30" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#D46780] text-white border-0 text-[9px]">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg ${plan.color} flex items-center justify-center text-white`}>
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
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                    {isCurrent ? (
                      <Button variant="outline" className="w-full text-xs" disabled>Current Plan</Button>
                    ) : (
                      <Button className={`w-full text-xs ${plan.popular ? "bg-[#D46780] hover:bg-[#C5536C]" : "bg-[#3F5185] hover:bg-[#354775]"}`}>
                        {plan.id === "enterprise" ? "Contact Sales" : "Upgrade"}
                        <ArrowRight className="w-3 h-3 ml-1" />
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
            <div className="space-y-2">
              {[
                { date: "Feb 1, 2026", amount: "$99.00", status: "Paid" },
                { date: "Jan 1, 2026", amount: "$99.00", status: "Paid" },
                { date: "Dec 1, 2025", amount: "$49.00", status: "Paid" },
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{inv.date}</div>
                      <div className="text-[10px] text-muted-foreground">IntegrateWise {currentPlanData.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{inv.amount}</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[9px]">{inv.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}