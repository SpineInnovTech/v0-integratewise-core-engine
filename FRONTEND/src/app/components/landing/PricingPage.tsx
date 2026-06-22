import React from "react";
import { Pricing } from "./Pricing";
import { Layout } from "./Layout";
import { CheckCircle2, Shield, Clock, Users, Zap, HelpCircle, ArrowRight } from "lucide-react";

export function PricingPage() {
  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        <Pricing />
        
        {/* ROI Calculator Section */}
        <div className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-[#1E2A4A] mb-4">
                Calculate Your ROI
              </h3>
              <p className="text-lg text-slate-600">
                Most teams see 5-8x ROI within 6 months
              </p>
            </div>

            <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 md:p-12 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-bold text-[#1E2A4A] mb-6">Current Costs (Hidden)</h4>
                  <div className="space-y-4">
                    {[
                      { label: "Manual data reconciliation", value: "$4,200/mo", desc: "18 hrs/week @ $55/hr per ops person" },
                      { label: "Missed expansion opportunities", value: "$8,500/mo", desc: "2-3 deals delayed 3 months" },
                      { label: "Late churn detection", value: "$12,000/mo", desc: "1 preventable churn every 2 months" },
                      { label: "Tool sprawl & licenses", value: "$2,100/mo", desc: "Redundant data tools" }
                    ].map((cost, i) => (
                      <div key={i} className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{cost.label}</div>
                          <div className="text-xs text-slate-500">{cost.desc}</div>
                        </div>
                        <div className="text-red-600 font-bold text-lg">{cost.value}</div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-4 border-t-2 border-slate-300">
                      <div className="font-black text-slate-900">Total Monthly Cost</div>
                      <div className="text-red-600 font-black text-2xl">$26,800</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-[#4256AB] mb-6">With IntegrateWise</h4>
                  <div className="space-y-4">
                    {[
                      { label: "Platform cost (Growth plan)", value: "$99/mo", desc: "Replaces 3-4 point solutions" },
                      { label: "Time saved via automation", value: "+$3,800/mo", desc: "16 hrs/week reclaimed" },
                      { label: "Expansion velocity increase", value: "+$8,500/mo", desc: "34% faster deal cycles" },
                      { label: "Churn prevention", value: "+$12,000/mo", desc: "60-day early warning system" }
                    ].map((saving, i) => (
                      <div key={i} className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{saving.label}</div>
                          <div className="text-xs text-slate-500">{saving.desc}</div>
                        </div>
                        <div className={`font-bold text-lg ${i === 0 ? 'text-slate-700' : 'text-emerald-600'}`}>
                          {saving.value}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-4 border-t-2 border-emerald-500">
                      <div className="font-black text-slate-900">Net Monthly Gain</div>
                      <div className="text-emerald-600 font-black text-2xl">+$24,201</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-6 text-center">
                <div className="text-5xl font-black text-emerald-600 mb-2">6.8x ROI</div>
                <div className="text-lg text-slate-700">
                  <span className="font-bold">$290k+</span> annual value gain for a $99/mo investment
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-[#1E2A4A] mb-4">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: "How long does implementation take?",
                  answer: "Most customers are live in 7-14 days. We handle connector setup, data normalization, and initial Spine build. Your team just maps fields and approves AI suggestions."
                },
                {
                  question: "Do you support SSO and SAML?",
                  answer: "Yes, Enterprise plans include full SSO/SAML support, RBAC, and audit logging. We're SOC 2 Type II certified."
                },
                {
                  question: "What if my CRM/tool isn't listed?",
                  answer: "We have 50+ native connectors and support any tool with a REST API. Custom connectors can be built in 2-3 weeks."
                },
                {
                  question: "Can I cancel anytime?",
                  answer: "Yes. Monthly plans can be canceled with 30 days notice. Annual plans require 90 days notice (or prorated refund)."
                },
                {
                  question: "What happens to my data if I leave?",
                  answer: "Full data export in JSON/CSV format within 48 hours. We delete all your data within 30 days per your request."
                },
                {
                  question: "Do you offer a free trial?",
                  answer: "We offer a 14-day pilot with up to 3 connectors and 10k entities. No credit card required. Book a demo to get started."
                }
              ].map((faq, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#4256AB]/10 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-5 h-5 text-[#4256AB]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#1E2A4A] mb-2">{faq.question}</h4>
                      <p className="text-slate-600">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-[#1E2A4A] mb-4">
                Compare Plans Side-by-Side
              </h3>
            </div>

            <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                      <th className="text-left p-4 font-bold text-slate-800">Feature</th>
                      <th className="text-center p-4 font-bold text-slate-800">Starter</th>
                      <th className="text-center p-4 font-bold text-slate-800 bg-[#4256AB]/5">
                        Growth<div className="text-xs font-normal text-[#D46780]">Most Popular</div>
                      </th>
                      <th className="text-center p-4 font-bold text-slate-800">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { feature: "Integrations", starter: "5", growth: "15", enterprise: "Unlimited" },
                      { feature: "Team Members", starter: "3", growth: "10", enterprise: "Unlimited" },
                      { feature: "Entities Synced", starter: "5K", growth: "50K", enterprise: "Unlimited" },
                      { feature: "AI Intelligence + Chat", starter: "Basic", growth: "✓", enterprise: "Advanced" },
                      { feature: "Canonical Spine (L1)", starter: "✓", growth: "✓", enterprise: "✓" },
                      { feature: "Dual-Context Fusion", starter: "–", growth: "✓", enterprise: "✓" },
                      { feature: "Human-in-the-Loop Gates", starter: "–", growth: "✓", enterprise: "✓" },
                      { feature: "Goal Framework", starter: "–", growth: "✓", enterprise: "✓" },
                      { feature: "Custom AI Training", starter: "–", growth: "–", enterprise: "✓" },
                      { feature: "SSO / SAML", starter: "–", growth: "–", enterprise: "✓" },
                      { feature: "RBAC & Approvals", starter: "–", growth: "–", enterprise: "✓" },
                      { feature: "Audit Logs", starter: "30 days", growth: "90 days", enterprise: "Unlimited" },
                      { feature: "Support", starter: "Email", growth: "Priority", enterprise: "Dedicated + SLA" }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-700">{row.feature}</td>
                        <td className="p-4 text-center text-slate-600">{row.starter}</td>
                        <td className="p-4 text-center text-slate-900 font-semibold bg-[#4256AB]/5">{row.growth}</td>
                        <td className="p-4 text-center text-slate-600">{row.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-16 bg-gradient-to-br from-[#1E2A4A] to-[#3F5185] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Start Your 14-Day Pilot Today
            </h3>
            <p className="text-xl text-white/80 mb-8">
              No credit card required. Connect 3 tools, sync 10K entities, see the Spine in action.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/demo" className="bg-white text-[#4256AB] hover:bg-slate-100 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-xl flex items-center justify-center gap-2">
                Book a Demo <ArrowRight className="w-5 h-5" />
              </a>
              <a href="/auth/signup" className="bg-[#D46780] hover:bg-[#C5536C] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all">
                Start Free Pilot
              </a>
            </div>
            <p className="text-sm text-white/60 mt-6">
              Questions? Email us at <a href="mailto:sales@integratewise.ai" className="underline text-white">sales@integratewise.ai</a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
