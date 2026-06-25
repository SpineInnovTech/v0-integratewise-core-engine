import { useState } from "react";
import { Link } from "wouter";
import { Check, X, Zap, Sparkles, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    code: "starter",
    price: 0,
    description: "Perfect for exploring and testing",
    icon: Zap,
    features: [
      { name: "Up to 1,000 runs/month", included: true },
      { name: "5 workflows", included: true },
      { name: "Basic integrations", included: true },
      { name: "Email support", included: true },
      { name: "API access", included: false },
      { name: "Custom adapters", included: false },
    ],
  },
  {
    name: "Growth",
    code: "growth",
    price: 99,
    description: "For growing teams and production workloads",
    icon: Sparkles,
    recommended: true,
    features: [
      { name: "Up to 10,000 runs/month", included: true },
      { name: "Unlimited workflows", included: true },
      { name: "All integrations", included: true },
      { name: "Priority support", included: true },
      { name: "API access", included: true },
      { name: "Custom adapters", included: true },
    ],
  },
  {
    name: "Enterprise",
    code: "enterprise",
    price: null,
    description: "Custom solutions for large organizations",
    icon: Shield,
    features: [
      { name: "Unlimited runs", included: true },
      { name: "Unlimited workflows", included: true },
      { name: "Dedicated support", included: true },
      { name: "SLA guarantees", included: true },
      { name: "SSO & SAML", included: true },
      { name: "Private adapters", included: true },
    ],
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <SnowflakeIcon />
          <span className="font-bold text-[17px] tracking-tight">IntegrateWise</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#555]">
          <Link href="/#features" className="hover:text-black transition-colors">Features</Link>
          <Link href="/#integrations" className="hover:text-black transition-colors">Integrations</Link>
          <Link href="/pricing" className="text-[#1e4620] font-semibold">Pricing</Link>
          <Link href="/#customers" className="hover:text-black transition-colors">Customers</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/app" className="text-[14px] text-[#555] hover:text-black font-medium">Sign In</Link>
          <Link href="/app" className="bg-[#1e4620] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#275429] transition-colors">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 px-8 bg-gradient-to-b from-slate-50 to-white text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl font-black text-[#0b1220] mb-4 tracking-tight">
            Simple, transparent <span className="text-[#2563eb]">pricing</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">Start free and scale as you grow. No hidden fees.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn("px-5 py-2 text-sm font-semibold rounded-lg transition-all", billingPeriod === "monthly" ? "bg-white shadow-sm text-[#0b1220]" : "text-slate-500")}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={cn("px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2", billingPeriod === "annual" ? "bg-white shadow-sm text-[#0b1220]" : "text-slate-500")}
            >
              Annual
              <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5">Save 20%</Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="pb-20 px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <Card
              key={tier.code}
              className={cn("p-8 relative", tier.recommended ? "border-2 border-[#2563eb] shadow-xl" : "border border-slate-200")}
            >
              {tier.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#2563eb] text-white px-4 py-1 shadow">Most Popular</Badge>
                </div>
              )}

              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <tier.icon className="w-6 h-6 text-[#2563eb]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0b1220] mb-1">{tier.name}</h3>
                <p className="text-sm text-slate-500">{tier.description}</p>
              </div>

              <div className="mb-8">
                {tier.price === null ? (
                  <div className="text-3xl font-bold text-[#0b1220]">Custom</div>
                ) : tier.price === 0 ? (
                  <div className="text-5xl font-bold text-[#0b1220]">Free</div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-[#0b1220]">
                      ${billingPeriod === "annual" ? Math.round(tier.price * 0.8) : tier.price}
                    </span>
                    <span className="text-slate-500">/month</span>
                  </div>
                )}
                {billingPeriod === "annual" && tier.price && (
                  <p className="text-xs text-slate-400 mt-1">Billed annually</p>
                )}
              </div>

              <Link
                href="/app"
                className={cn("flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold mb-8 transition-colors",
                  tier.recommended
                    ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/20"
                    : "border border-slate-200 text-[#0b1220] hover:bg-slate-50"
                )}
              >
                {tier.price === null ? "Contact Sales" : "Get Started"}
              </Link>

              <ul className="space-y-3.5">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-[#2563eb]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 text-slate-300" />
                      </div>
                    )}
                    <span className={cn("text-sm", feature.included ? "text-slate-700" : "text-slate-400")}>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-8 bg-[#1e4620]">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-black mb-4 tracking-tight">Ready to get started?</h2>
          <p className="text-lg mb-8 opacity-80">Join teams automating their enterprise systems with confidence</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/app" className="bg-white text-[#1e4620] font-bold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors">
              Get a Demo
            </Link>
            <Link href="/app" className="border border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SnowflakeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="white"/>
      <g stroke="#2a7a2a" strokeWidth="2" strokeLinecap="round">
        <line x1="16" y1="7" x2="16" y2="25"/>
        <line x1="7" y1="16" x2="25" y2="16"/>
        <line x1="9.5" y1="9.5" x2="22.5" y2="22.5"/>
        <line x1="22.5" y1="9.5" x2="9.5" y2="22.5"/>
        <line x1="16" y1="7" x2="13.5" y2="10"/><line x1="16" y1="7" x2="18.5" y2="10"/>
        <line x1="16" y1="25" x2="13.5" y2="22"/><line x1="16" y1="25" x2="18.5" y2="22"/>
        <line x1="7" y1="16" x2="10" y2="13.5"/><line x1="7" y1="16" x2="10" y2="18.5"/>
        <line x1="25" y1="16" x2="22" y2="13.5"/><line x1="25" y1="16" x2="22" y2="18.5"/>
      </g>
    </svg>
  );
}
