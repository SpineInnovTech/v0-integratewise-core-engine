import React from "react";
import { CheckCircle2, UserCheck, Briefcase, Code, Rocket, Zap } from "lucide-react";

export function Audience() {
  const roles = [
    {
      title: "CCO / VP Customer Success",
      quote: "Track both your NRR goals and your customers' business outcomes in one place. Finally prove the ROI of your team.",
      focus: "Prove renewal impact and customer outcomes",
      icon: <UserCheck className="w-7 h-7" />,
      color: "bg-[#4256AB]"
    },
    {
      title: "CRO / Head of Sales",
      quote: "Your CRM shows what happened. IntegrateWise shows what's happening now and what to do next.",
      focus: "Real-time funnel intelligence and next actions",
      icon: <Briefcase className="w-7 h-7" />,
      color: "bg-[#4152A1]"
    },
    {
      title: "CTO / Head of Engineering",
      quote: "MCP‑native, approval‑gated AI, with self‑learning integrations. An architecture built for the AI age.",
      focus: "An AI-ready integration layer, not another bolt-on",
      icon: <Code className="w-7 h-7" />,
      color: "bg-slate-800"
    },
    {
      title: "CEO / Founder",
      quote: "The only platform that makes your tools smarter every day — while keeping your team in control.",
      focus: "Compounding intelligence with zero workflow disruption",
      icon: <Rocket className="w-7 h-7" />,
      color: "bg-[#D46780]"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4256AB] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D46780] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Who uses IntegrateWise?</h2>
          <p className="text-slate-300 text-lg">Built for RevOps, CSMs, and AEs — anyone who manages complex customer data.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 md:gap-16">
          {/* Left: Ideal Customer Profile */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-[#D46780] rounded-full" />
              Ideal customers
            </h3>
            <ul className="space-y-4 mb-12">
              {[
                "B2B SaaS companies with $5M+ ARR",
                "10+ tools in their stack: Salesforce, HubSpot, Zendesk, Jira, Slack, Linear, Stripe, etc.",
                "Have a CSM team (2+ people) and care deeply about NRR and retention"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-[#D46780] shrink-0" />
                  <span className="text-slate-300 text-lg">{item}</span>
                </li>
              ))}
            </ul>

            {/* Platform context card */}
            <div className="bg-gradient-to-br from-[#4152A1] to-[#4256AB] p-6 md:p-8 rounded-3xl shadow-2xl">
              <div className="mb-6">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-2">Platform Context</div>
                <div className="h-1 w-20 bg-[#D46780]" />
              </div>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/10 pb-4">
                  <div>
                    <div className="text-sm text-slate-400">Net Revenue Retention</div>
                    <div className="text-2xl md:text-3xl font-black">114%</div>
                  </div>
                  <div className="text-emerald-400 text-sm font-bold">+4.2% YoY</div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/10 pb-4">
                  <div>
                    <div className="text-sm text-slate-400">Customer ROI Delivery</div>
                    <div className="text-2xl md:text-3xl font-black">92%</div>
                  </div>
                  <div className="text-emerald-400 text-sm font-bold">On Track</div>
                </div>
                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <div className="text-xs font-bold text-[#D46780] mb-2 flex items-center gap-2 uppercase">
                    <Zap className="w-3 h-3 fill-current" /> Insight
                  </div>
                  <p className="text-sm text-slate-200">Expansion signal detected for "Acme Corp" — Customer achieved 90% product adoption milestone 3 months ahead of schedule.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Role-based value props */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <span className="w-2 h-8 bg-[#4256AB] rounded-full" />
              Clear value for every leader
            </h3>
            <div className="space-y-5">
              {roles.map((role, i) => (
                <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`p-2.5 ${role.color} rounded-xl text-white shadow-lg`}>
                      {role.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{role.title}</h4>
                      <p className="text-xs text-slate-400">{role.focus}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 italic pl-14">"{role.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}