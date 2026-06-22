import React from "react";

export function DifferentiatorsDetail() {
  const diffs = [
    { title: "L0–L3 Cognitive Architecture", desc: "A strict 4-layer stack that ensures data integrity from raw event to executive KPI." },
    { title: "Canonical Spine", desc: "A single source of truth for entities like 'Account' and 'User' that persists across all tool changes." },
    { title: "Intelligence Overlay", desc: "A governed AI layer that reasons across tools but requires human sign-off before acting." },
    { title: "Dual-Context Alignment", desc: "Every metric must serve both vendor growth (NRR) and client outcomes (ROI)." },
    { title: "Edge Correction Library", desc: "A cumulative moat of human corrections that makes the AI smarter every day." },
    { title: "MCP-Native Design", desc: "Built to be discovered and used by AI agents using the Model Context Protocol." },
    { title: "Self-Healing Schemas", desc: "AI detects when an upstream API changes and automatically suggests a mapping fix." },
    { title: "Work Preservation Layer", desc: "Intelligence is delivered into existing tools (Slack, Salesforce) so workflows never break." },
    { title: "Truth-Spine Linkage", desc: "Deterministic linking of disparate tool IDs into a single canonical record." },
    { title: "Semantic Context Graph", desc: "Captures unstructured data from calls and tickets to enrich structured records." },
    { title: "Governance Guardrails", desc: "Strict policies that prevent AI from making 'hallucinated' updates to financial records." },
    { title: "NRR Expansion Signals", desc: "Proprietary models that detect expansion opportunities before the customer asks." },
    { title: "Outcome-Driven Logic", desc: "Focuses on 'What did the customer achieve?' rather than 'What did they click?'" },
    { title: "Integration Agnostic", desc: "Swap a CRM or Billing tool without losing a decade of historical context." },
    { title: "High-Fidelity Eventing", desc: "Real-time processing of tool events with zero-loss deduplication." },
    { title: "Federated Intelligence", desc: "Learns cross-tool patterns from thousands of companies while keeping data private." }
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#4152A1] mb-6">The 16 Pillars of Integration Intelligence</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Why we are fundamentally different from "iPaaS" or "AI Bolt-ons". We built a new operating system category.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
           {diffs.map((diff, i) => (
             <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-[#4256AB]/10 text-[#4256AB] flex items-center justify-center font-bold text-xs">
                      {i + 1}
                   </div>
                   <h3 className="font-bold text-slate-800 text-sm">{diff.title}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{diff.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </section>
  );
}