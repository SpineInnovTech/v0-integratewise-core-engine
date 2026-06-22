import React from "react";
import { ArrowRight, Code2, Network, GitBranch, Database, ShieldCheck, Zap, Target, Layers, Brain } from "lucide-react";

export function Differentiators() {
  const items = [
    {
      icon: <Network className="w-6 h-6" />,
      title: "Entity 360 Fusion",
      desc: "Every entity unified across all systems. One Account, one Contact, one Deal—on the Spine."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Dual-Context Intelligence",
      desc: "AI understands both provider goals and customer outcomes in every decision."
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Four-Layer Architecture",
      desc: "From raw events through the Spine to context intelligence and workspace actions."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Human-in-the-Loop by Design",
      desc: "AI proposes, humans approve. Every interaction strengthens the system's understanding."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Edge Correction Library",
      desc: "A defensible moat of human-verified intelligence that compounds over time."
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Evidence-Based Proposals",
      desc: "Every AI suggestion comes with source data and reasoning chain for full transparency."
    }
  ];

  return (
    <section className="py-16 md:py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#4152A1] mb-4">The Differentiators</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            A technical architecture designed for the AI age.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#4256AB]/10 text-[#4256AB] flex items-center justify-center mb-4 group-hover:bg-[#4256AB] group-hover:text-white transition-all">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}