import React from "react";
import { X, Check } from "lucide-react";

export function Comparison() {
  const columns = [
    {
      title: "Automation Tools",
      subtitle: "(Zapier, Make, Workato)",
      points: [
        { text: "Move data A→B", check: true },
        { text: "Shared context", check: false },
        { text: "Self-learning", check: false },
        { text: "Work surface", check: false }
      ]
    },
    {
      title: "Traditional CRMs",
      subtitle: "(Salesforce, HubSpot)",
      points: [
        { text: "Customer records", check: true },
        { text: "Dynamic AI logic", check: false },
        { text: "Tool sync", check: false },
        { text: "Unified truth", check: false }
      ]
    },
    {
      title: "AI-Native Apps",
      subtitle: "(Newer Agents)",
      points: [
        { text: "Task completion", check: true },
        { text: "Human oversight", check: false },
        { text: "Defensible moats", check: false },
        { text: "Work preservation", check: false }
      ]
    },
    {
      title: "IntegrateWise",
      subtitle: "(The Difference)",
      highlight: true,
      points: [
        { text: "Preserved work layer", check: true },
        { text: "L0-L3 Architecture", check: true },
        { text: "Human-approved AI", check: true },
        { text: "Dual-context truth", check: true }
      ]
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F3F4F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E2A4A] text-center mb-10 md:mb-16">Why IntegrateWise is not just another integration tool</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-0 sm:border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xl">
          {columns.map((col, i) => (
            <div key={i} className={`p-6 md:p-8 ${col.highlight ? 'bg-[#3F5185] text-white sm:ring-4 ring-[#3F5185]/20 z-10 rounded-2xl sm:rounded-none' : 'bg-white text-slate-800'} ${!col.highlight ? 'border border-slate-200 sm:border-0 rounded-2xl sm:rounded-none' : ''}`}>
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-1">{col.title}</h3>
                <p className={`text-sm ${col.highlight ? 'text-white/80' : 'text-slate-500'}`}>{col.subtitle}</p>
              </div>
              <ul className="space-y-6">
                {col.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-3">
                    {p.check ? (
                      <Check className={`w-5 h-5 ${col.highlight ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    ) : (
                      <X className={`w-5 h-5 ${col.highlight ? 'text-white/20' : 'text-slate-300'}`} />
                    )}
                    <span className="font-medium">{p.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}