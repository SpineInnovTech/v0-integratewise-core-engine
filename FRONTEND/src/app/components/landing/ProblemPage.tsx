import React from "react";
import { Problem } from "./Problem";
import { Layout } from "./Layout";
import { CheckCircle2, TrendingDown, AlertTriangle, DollarSign, Users, Clock } from "lucide-react";

export function ProblemPage() {
  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        <Problem />
        
        {/* The Cost Section */}
        <div className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-[#1E2A4A] mb-6">
                The High Cost of <span className="text-[#D46780]">"Good Enough"</span> Integration
              </h3>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Most companies lose 15-20% of their potential NRR simply because their data is siloed and context-less. 
                IntegrateWise solves this by creating a unified intelligence layer that connects truth, context, and outcomes.
              </p>
            </div>

            {/* Impact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
              {[
                { 
                  icon: DollarSign, 
                  stat: "$2.3M", 
                  label: "Avg Annual Revenue Leakage", 
                  desc: "Due to missed upsells and late churn signals",
                  color: "text-red-600",
                  bg: "bg-red-50"
                },
                { 
                  icon: Clock, 
                  stat: "18 hrs/week", 
                  label: "Wasted on Manual Data Tasks", 
                  desc: "Per RevOps/CSM team member copying data between tools",
                  color: "text-amber-600",
                  bg: "bg-amber-50"
                },
                { 
                  icon: AlertTriangle, 
                  stat: "42%", 
                  label: "Of Churn Goes Undetected", 
                  desc: "Because signals are scattered across 8+ disconnected tools",
                  color: "text-orange-600",
                  bg: "bg-orange-50"
                },
              ].map((item, i) => (
                <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#4256AB]/30 transition-all">
                  <div className={`w-14 h-14 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <div className={`text-4xl font-black ${item.color} mb-2`}>{item.stat}</div>
                  <div className="text-lg font-bold text-slate-800 mb-2">{item.label}</div>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Real-World Scenarios */}
            <div className="bg-slate-50 rounded-3xl p-8 md:p-12">
              <h4 className="text-2xl font-bold text-[#1E2A4A] mb-8 text-center">Sound Familiar?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    persona: "VP of Customer Success",
                    problem: "\"We didn't know the champion left until renewal was 10 days out. By then it was too late.\"",
                    reason: "Slack departures, LinkedIn updates, and CRM notes lived in silos."
                  },
                  {
                    persona: "Head of Sales",
                    problem: "\"Our expansion deals take 6 months because we can't see product usage patterns fast enough.\"",
                    reason: "Product analytics, support tickets, and CRM data never aligned in real-time."
                  },
                  {
                    persona: "RevOps Leader",
                    problem: "\"I spend 12 hours a week just reconciling ARR numbers across Stripe, Salesforce, and our billing tool.\"",
                    reason: "No single source of truth—every system has a different answer."
                  },
                  {
                    persona: "CEO",
                    problem: "\"We have 14 tools and still don't know which accounts are actually healthy.\"",
                    reason: "Each tool shows a fragment. No one connects vendor truth + client reality."
                  },
                ].map((scenario, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#4256AB]/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#4256AB]" />
                      </div>
                      <span className="font-bold text-[#4256AB]">{scenario.persona}</span>
                    </div>
                    <blockquote className="text-slate-700 italic mb-3 border-l-4 border-[#D46780] pl-4">
                      {scenario.problem}
                    </blockquote>
                    <p className="text-sm text-slate-500">
                      <span className="font-bold text-slate-700">Why:</span> {scenario.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* The IntegrateWise Difference */}
        <div className="py-16 md:py-24 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                IntegrateWise: The Intelligence Layer You've Been Missing
              </h3>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Not just another integration platform—a unified Spine that connects truth, context, and action.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Canonical Spine (L1 Truth)",
                  desc: "One entity = one record. Salesforce says 'Acme Corp', Zendesk says 'Acme Corporation'? We merge them. Stripe payment fails? We update the shared Account spine instantly."
                },
                {
                  title: "Dual-Context Intelligence (L2)",
                  desc: "Vendor lens (your CRM says 'Closed-Won') + Client lens (their support tickets show 3 unresolved P1s). AI catches the mismatch—humans approve the correction."
                },
                {
                  title: "Human-in-the-Loop Actions (L3)",
                  desc: "AI proposes: 'Adjust renewal probability to 62%'. You approve or reject. No rogue automations, no black boxes."
                },
                {
                  title: "Provenance Tracking",
                  desc: "Every data point shows: Where it came from, When it was synced, Why it changed. Full audit trail, always."
                },
              ].map((feature, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                    <h4 className="text-xl font-bold">{feature.title}</h4>
                  </div>
                  <p className="text-white/80">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold text-[#1E2A4A] mb-4">
              Stop Losing Revenue to Disconnected Tools
            </h3>
            <p className="text-lg text-slate-600 mb-8">
              See how IntegrateWise unifies your data, surfaces hidden insights, and prevents revenue leakage—all with human oversight.
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