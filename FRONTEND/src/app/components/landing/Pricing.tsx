import { Check } from "lucide-react";

interface PricingProps {
  onGetStarted?: () => void;
}

export function Pricing({ onGetStarted }: PricingProps = {}) {
  const tiers = [
    {
      name: "Starter",
      price: "$49",
      period: "user/month",
      desc: "Core integrations, basic intelligence, ideal for small CS teams.",
      features: [
        "Up to 5 integrations",
        "L0-L1 Truth Layer",
        "Basic health scoring",
        "Email support"
      ]
    },
    {
      name: "Growth",
      price: "$99",
      period: "user/month",
      desc: "Full L0–L3 intelligence, dual‑context metrics, edge correction engine.",
      popular: true,
      features: [
        "Unlimited integrations",
        "Full L0-L3 Architecture",
        "Dual-context intelligence",
        "Edge Correction Library",
        "Priority support"
      ]
    },
    {
      name: "Enterprise",
      price: "Contact",
      period: "for pricing",
      desc: "Custom integrations, advanced controls, and full‑company rollouts.",
      features: [
        "Custom deployment",
        "RBAC & SSO",
        "Dedicated CSM",
        "Custom L3 Intelligence rules",
        "24/7 SLA"
      ]
    }
  ];

  const serviceOffers = [
    {
      name: "Spine Foundation Sprint",
      setup: "$4,500",
      monthly: "$1,200/mo",
      target: "B2B SaaS, $2M–$50M ARR, CS or RevOps teams",
      outcome: "First proactive signal within 14 days; CSM prep time reduced 60% in 30 days",
      deliverables: [
        "L0 Onboarding configured (department + industry)",
        "5 core connectors live through 8-stage pipeline",
        "Depth Matrix v1 with tenant risk definitions",
        "Account 360 view live for all active accounts"
      ]
    },
    {
      name: "Depth Matrix Configuration",
      setup: "$2,500",
      monthly: "Included",
      target: "CS teams getting generic or low-quality signals",
      outcome: "Relevant signals in 30 days; false-positive rate drops >50%",
      deliverables: [
        "2-hour discovery workshop mapping churn playbook",
        "8–12 custom signal rules written into Depth Matrix",
        "Signal validation over 30 days",
        "Tuning session at day 30"
      ]
    },
    {
      name: "Account Intelligence Rescue",
      setup: "$3,500",
      monthly: "One-time",
      target: "CS teams with upcoming renewal risk",
      outcome: "Intervene on at-risk accounts before renewal window closes",
      deliverables: [
        "Full Spine connection (CRM + product + communications)",
        "Risk score for all active accounts",
        "Top 5 at-risk accounts with Entity 360 evidence",
        "HITL-governed intervention emails drafted",
        "1-hour executive readout"
      ]
    },
    {
      name: "RevOps Truth Layer",
      setup: "$6,000",
      monthly: "$2,000/mo",
      target: "RevOps and finance leaders with fragmented revenue data",
      outcome: "CRO has real-time clarity; weekly review cut from 90 min → 20 min",
      deliverables: [
        "Full Spine: CRM + billing + CS + financial system",
        "3 department views (CS, Sales, Executive)",
        "Depth Matrix rules for revenue signals",
        "Weekly AI-generated revenue briefing via HITL"
      ]
    },
    {
      name: "AI Memory Activation",
      setup: "$5,500",
      monthly: "$1,500/mo",
      target: "20–150 person companies facing knowledge loss risk",
      outcome: "New hire onboarding from 3 months → 2 weeks; zero context loss",
      deliverables: [
        "Memory Accumulator activated for all AI sessions",
        "Sessions linked to Spine entities",
        "60-day knowledge capture sprint",
        "Onboarding brief generated from Spine memory"
      ]
    }
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-[#4256AB] mb-4">Simple, value‑aligned pricing</h2>
          <p className="text-slate-600 text-lg md:text-xl">Scales with your success, not just your tool count.</p>
        </div>

        {/* Subscription Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20">
          {tiers.map((tier, i) => (
            <div key={i} className={`relative p-8 md:p-10 rounded-3xl bg-white border ${tier.popular ? 'border-[#4256AB] shadow-2xl md:scale-105' : 'border-slate-200 shadow-sm'} flex flex-col`}>
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#4256AB] text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-black text-[#4256AB]">{tier.price}</span>
                <span className="text-slate-500 ml-1">/{tier.period}</span>
              </div>
              <p className="text-slate-600 mb-8 min-h-[60px]">{tier.desc}</p>
              
              <ul className="space-y-4 mb-10 flex-grow">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-slate-700 font-medium">
                    <Check className="w-5 h-5 text-[#D46780]" />
                    {f}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-4 rounded-xl font-bold transition-all ${tier.popular ? 'bg-[#D46780] text-white hover:bg-[#D46780]/90 shadow-lg shadow-[#D46780]/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {tier.price === 'Contact' ? 'Talk to Sales' : 'Start with ' + tier.name}
              </button>
            </div>
          ))}
        </div>

        {/* Productized Service Offers */}
        <div className="mb-16 md:mb-20">
          <div className="text-center mb-12">
            <span className="inline-block py-1 px-4 rounded-full bg-[#D46780]/10 text-[#D46780] text-sm font-bold tracking-wide uppercase mb-4">
              Implementation Services
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-[#1E2A4A] mb-4">
              5 Productized Service Offers
            </h3>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto">
              Get live faster with our proven implementation packages. Fixed scope, fixed price, measurable outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {serviceOffers.map((offer, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-[#4256AB] transition-all shadow-sm hover:shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">{offer.name}</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#4256AB]">{offer.setup}</span>
                      {offer.monthly !== "One-time" && offer.monthly !== "Included" && (
                        <span className="text-slate-600 font-semibold"> + {offer.monthly}</span>
                      )}
                      {offer.monthly === "Included" && (
                        <span className="text-emerald-600 font-semibold text-sm">✓ Included in platform</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Target</div>
                  <div className="text-sm text-slate-700">{offer.target}</div>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2">Deliverables</div>
                  <ul className="space-y-2">
                    {offer.deliverables.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-[#D46780] flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-700 uppercase mb-1">Outcome</div>
                  <div className="text-sm text-emerald-900 font-semibold">{offer.outcome}</div>
                </div>

                <button className="w-full mt-6 py-3 bg-slate-900 hover:bg-[#4256AB] text-white rounded-xl font-bold transition-all">
                  Learn More
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 md:mt-20 p-8 md:p-12 bg-[#4256AB] rounded-3xl text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-6">The window is open — for a limited time</h3>
          <p className="text-white/80 text-lg md:text-xl max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed">
            Incumbents will add AI layers. New tools will copy parts of the architecture. What they can't copy quickly are years of Spine data, edge corrections, and customer trust.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-[#D46780] hover:bg-[#D46780]/90 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-black/20 transition-all">
              Book a strategy session
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-full font-bold transition-all">
              Start a pilot with your CSM team
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}