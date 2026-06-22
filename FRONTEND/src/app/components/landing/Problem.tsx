import React from "react";
import { AlertCircle, ArrowRightLeft, BrainCircuit, ShieldAlert, Network } from "lucide-react";

export function Problem() {
  const problems = [
    {
      icon: <Network className="w-8 h-8 text-[#D46780]" />,
      title: "Tool sprawl without unified truth",
      description: "Teams work across CRM, support, email, chat, docs, and project tools. These systems rarely connect in a way that preserves business meaning."
    },
    {
      icon: <ArrowRightLeft className="w-8 h-8 text-[#D46780]" />,
      title: "Fragmented knowledge and context",
      description: "Critical business context is scattered across structured records, unstructured documents, communications, and notes. Teams waste hours reconstructing what happened."
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-[#D46780]" />,
      title: "Ungoverned AI adoption",
      description: "AI adoption is accelerating, but most AI tools aren't grounded in trusted operational truth and lack approval controls, auditability, and policy enforcement."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F3F4F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E2A4A] mb-6">
              Your tools are connected. <br />
              <span className="text-[#D46780]">Your intelligence layer isn't.</span>
            </h2>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              B2B teams need more than integrations—they need a unified intelligence layer built on the Spine where Entity 360 creates canonical truth and AI thinks in context.
            </p>
            <div className="space-y-6">
              {problems.map((p, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all group">
                  <div className="shrink-0">{p.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{p.title}</h3>
                    <p className="text-slate-500">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="relative max-w-sm md:max-w-md mx-auto">
              {/* Visual showing the cost of siloed intelligence */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#4256AB]/20 to-[#D46780]/20 rounded-3xl rotate-3" />
              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 flex flex-col justify-center items-center text-center">
                <div className="space-y-4 w-full mb-8">
                  {[
                    { tool: "Salesforce", signal: "Deal marked 'Committed'", color: "bg-blue-100 text-blue-700" },
                    { tool: "Zendesk", signal: "3 P1 tickets open", color: "bg-amber-100 text-amber-700" },
                    { tool: "Slack", signal: "Champion went silent", color: "bg-red-100 text-red-700" },
                    { tool: "Stripe", signal: "Payment failed twice", color: "bg-rose-100 text-rose-700" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-xs font-bold text-slate-500 shrink-0">{item.tool}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${item.color}`}>{item.signal}</span>
                    </div>
                  ))}
                </div>
                <div className="w-12 h-px bg-slate-200 mb-4" />
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                   <ShieldAlert className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-800">No unified context to connect the dots.</p>
                <p className="text-xs text-slate-400 mt-1">This account churned 47 days later.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}