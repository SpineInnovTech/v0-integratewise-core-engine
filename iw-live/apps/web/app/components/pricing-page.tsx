"use client"

import Link from "next/link"
import { Check, X, Zap, Sparkles, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Space_Grotesk } from "next/font/google"
import { cn } from "@/lib/utils"
import { useState } from "react"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" })

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
]

export function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")

  return (
    <div className={cn("min-h-screen bg-white", spaceGrotesk.variable)}>
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-5xl font-bold text-[#0B1220] mb-4">
            Simple, transparent <span className="text-[#2563EB]">pricing</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">Start free and scale as you grow. No hidden fees.</p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <Card
                key={tier.code}
                className={`p-8 ${
                  tier.recommended ? "border-2 border-[#2563EB] shadow-xl relative" : "border border-slate-200"
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#2563EB] text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}

                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <tier.icon className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-[#0B1220] mb-2">{tier.name}</h3>
                  <p className="text-sm text-slate-600">{tier.description}</p>
                </div>

                <div className="mb-8">
                  {tier.price === null ? (
                    <div className="text-3xl font-bold text-[#0B1220]">Custom</div>
                  ) : tier.price === 0 ? (
                    <div className="text-5xl font-bold text-[#0B1220]">Free</div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-[#0B1220]">${tier.price}</span>
                        <span className="text-slate-600">/month</span>
                      </div>
                      {billingPeriod === "annual" && (
                        <p className="text-sm text-slate-600 mt-1">Billed annually (save 20%)</p>
                      )}
                    </>
                  )}
                </div>

                <Button
                  size="lg"
                  className={`w-full mb-8 ${
                    tier.recommended
                      ? "bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/30"
                      : "border-slate-300 bg-transparent"
                  }`}
                  variant={tier.recommended ? "default" : "outline"}
                  asChild
                >
                  <Link href={tier.price === null ? "/contact" : "/auth/sign-up"}>
                    {tier.price === null ? "Contact Sales" : "Get Started"}
                  </Link>
                </Button>

                <ul className="space-y-4">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#2563EB]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                      <span className={`text-sm ${feature.included ? "text-slate-700" : "text-slate-400"}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#2563EB]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="font-heading text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">Join teams automating their enterprise systems with confidence</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-[#2563EB] hover:bg-slate-100 font-semibold px-8" asChild>
              <Link href="/contact">Get a Demo</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 bg-transparent"
              asChild
            >
              <Link href="/auth/sign-up">Start Free</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PricingPage
