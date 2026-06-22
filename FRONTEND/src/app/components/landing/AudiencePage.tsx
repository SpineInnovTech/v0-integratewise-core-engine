import React from "react";
import { Audience } from "./Audience";
import { Layout } from "./Layout";
import { CheckCircle2, Target, TrendingUp, Users, Briefcase, DollarSign, Clock, Zap } from "lucide-react";

export function AudiencePage() {
  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        <Audience />
        
        {/* Detailed Persona Sections */}
        <div className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-[#1E2A4A] mb-4">
                Built for Revenue Teams Who Refuse to Settle
              </h3>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                IntegrateWise serves the operators who know their tools should work together—but today, they don't.
              </p>
            </div>

            {/* Primary Personas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {[
                {
                  title: "Customer Success Leaders",
                  icon: Users,
                  challenges: [
                    "Can't predict churn until it's too late",
                    "Miss expansion signals buried in support tickets",
                    "Spend hours reconciling health scores manually"
                  ],
                  outcomes: [
                    "83% churn prediction accuracy 60 days early",
                    "2.4x faster expansion deal cycles",
                    "18 hours/week saved per CSM"
                  ]
                },
                {
                  title: "RevOps & Sales Ops",
                  icon: Target,
                  challenges: [
                    "No single source of truth for ARR/pipeline",
                    "Data errors cascade across Salesforce, Stripe, billing",
                    "Reporting takes days instead of minutes"
                  ],
                  outcomes: [
                    "99.4% data accuracy across systems",
                    "Real-time revenue dashboards",
                    "12 hours/week saved on manual reconciliation"
                  ]
                },
                {
                  title: "VPs of Sales",
                  icon: TrendingUp,
                  challenges: [
                    "Can't see which accounts are ready to expand",
                    "Reps waste time in 8 different tools",
                    "Miss cross-sell opportunities hiding in usage data"
                  ],
                  outcomes: [
                    "34% increase in expansion ARR",
                    "Single pane of glass for all account intel",
                    "AI-surfaced opportunities with 92% accuracy"
                  ]
                }
              ].map((persona, i) => (
                <div key={i} className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-3xl p-8 hover:shadow-2xl hover:border-[#4256AB]/30 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-[#4256AB] flex items-center justify-center mb-6">
                    <persona.icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-[#1E2A4A] mb-6">{persona.title}</h4>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Before IntegrateWise</h5>
                    <ul className="space-y-2">
                      {persona.challenges.map((challenge, j) => (
                        <li key={j} className="flex items-start gap-2 text-slate-600">
                          <span className="text-red-500 mt-1">✗</span>
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3">After IntegrateWise</h5>
                    <ul className="space-y-2">
                      {persona.outcomes.map((outcome, j) => (
                        <li key={j} className="flex items-start gap-2 text-slate-700 font-medium">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Company Profiles */}
            <div className="bg-slate-50 rounded-3xl p-8 md:p-12">
              <h4 className="text-2xl font-bold text-[#1E2A4A] mb-8 text-center">Who Sees the Most Value?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    segment: "B2B SaaS ($5M-$50M ARR)",
                    description: "You've crossed $5M ARR. You have 8-12 tools. Your team manually stitches data together daily.",
                    fit: "Perfect Fit",
                    why: "IntegrateWise replaces 200+ hours/month of manual work with AI-powered unification."
                  },
                  {
                    segment: "Professional Services ($10M-$100M)",
                    description: "Client delivery teams use different tools than sales. Project health is a black box.",
                    fit: "High Value",
                    why: "Unified client + vendor context means you catch delivery issues before they become churn."
                  },
                  {
                    segment: "B2B Marketplaces",
                    description: "You have supply-side and demand-side data. Reconciliation is a nightmare.",
                    fit: "Transformative",
                    why: "Dual-context fusion model aligns both sides of your marketplace in one intelligence layer."
                  },
                  {
                    segment: "Enterprise (500+ employees)",
                    description: "15+ tools. Compliance matters. Data governance is critical.",
                    fit: "Enterprise Ready",
                    why: "Provenance tracking, RBAC, human-in-the-loop gates, and full audit logs out of the box."
                  }
                ].map((segment, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-lg font-bold text-[#1E2A4A]">{segment.segment}</h5>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        {segment.fit}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-4">{segment.description}</p>
                    <div className="bg-[#4256AB]/5 border-l-4 border-[#4256AB] rounded p-3">
                      <p className="text-sm text-slate-700">
                        <span className="font-bold text-[#4256AB]">Why:</span> {segment.why}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Integration Stack Section */}
        <div className="py-16 md:py-24 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Built for the Modern Revenue Stack
              </h3>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                IntegrateWise connects your existing tools—no rip and replace.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: "Salesforce", category: "CRM" },
                { name: "HubSpot", category: "Marketing" },
                { name: "Zendesk", category: "Support" },
                { name: "Stripe", category: "Billing" },
                { name: "Slack", category: "Comms" },
                { name: "Jira", category: "Project" },
                { name: "Mixpanel", category: "Analytics" },
                { name: "Segment", category: "Data" },
                { name: "Intercom", category: "Support" },
                { name: "ChartMogul", category: "Metrics" },
                { name: "Notion", category: "Docs" },
                { name: "Linear", category: "PM" }
              ].map((tool, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center hover:bg-white/20 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-black text-xl">{tool.name[0]}</span>
                  </div>
                  <div className="font-bold text-white text-sm">{tool.name}</div>
                  <div className="text-xs text-white/60 mt-1">{tool.category}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-white/80 mb-4">+ 50 more integrations via native connectors and API</p>
              <a href="/technical" className="inline-flex items-center gap-2 text-white font-bold hover:underline">
                See Technical Architecture <Zap className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-[#1E2A4A] mb-4">
                Join Teams Already Winning with IntegrateWise
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  stat: "2.4x",
                  label: "Faster Deal Cycles",
                  company: "B2B SaaS, $12M ARR"
                },
                {
                  stat: "83%",
                  label: "Churn Prediction Accuracy",
                  company: "Enterprise Software, $45M ARR"
                },
                {
                  stat: "18 hrs",
                  label: "Saved Per Week Per CSM",
                  company: "Professional Services, $28M Revenue"
                }
              ].map((proof, i) => (
                <div key={i} className="text-center">
                  <div className="text-5xl font-black text-[#4256AB] mb-2">{proof.stat}</div>
                  <div className="text-lg font-bold text-slate-800 mb-1">{proof.label}</div>
                  <div className="text-sm text-slate-500">{proof.company}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold text-[#1E2A4A] mb-4">
              Ready to See IntegrateWise in Action?
            </h3>
            <p className="text-lg text-slate-600 mb-8">
              Book a 30-minute demo tailored to your revenue stack and use case.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/demo" className="bg-[#4256AB] hover:bg-[#3F5185] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-xl hover:shadow-[#4256AB]/20">
                Book a Demo
              </a>
              <a href="/pricing" className="bg-white border-2 border-[#4256AB] text-[#4256AB] hover:bg-[#4256AB] hover:text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all">
                See Pricing
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
