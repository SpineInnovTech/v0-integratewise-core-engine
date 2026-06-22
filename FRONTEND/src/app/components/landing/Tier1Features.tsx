import { motion } from "motion/react";
import { Zap, ShieldCheck, Clock, Database, TrendingUp, CheckCircle } from "lucide-react";

export function Tier1Features() {
  const features = [
    {
      icon: Database,
      name: "Account 360",
      tagline: "The Living Account Brief",
      pain: "CSMs spend 45–90 minutes manually assembling account context before every QBR from 5–8 disconnected tools.",
      solution: "A real-time, AI-assembled brief for every account — pulling structured data (CRM, product usage, support), unstructured context (emails, Slack, documents), and AI session history.",
      outcome: "Every account brief available in under 3 seconds, always current, sourced and linked to the original evidence.",
      roi: "Recover 8–10 hours per CSM per week; reduce QBR prep from 3 hours to 15 minutes.",
      pitch: "Your Account 360 isn't a dashboard. It's the Spine's assembled truth about that account — from every system, in real time.",
      color: "bg-[#4256AB]"
    },
    {
      icon: Zap,
      name: "Proactive Signal Engine",
      tagline: "AI That Surfaces Risk Before It Becomes Churn",
      pain: "Teams discover churn risk at the QBR — 30–60 days after the intervention window has closed.",
      solution: "The Depth Matrix continuously evaluates incoming Spine data against tenant-defined signal rules, surfacing anomalies as structured alerts with full evidence chains — before anyone asks.",
      outcome: "Risk surfaces 6–8 weeks earlier, with the evidence chain assembled, not assembled manually.",
      roi: "One protected $1M account pays for the platform for 3+ years; average CS team identifies 2–3 at-risk accounts per quarter that were previously invisible.",
      pitch: "The Spine watched every signal. The Depth Matrix knew it was risk. The alert arrived 8 weeks before your QBR.",
      color: "bg-[#D46780]"
    },
    {
      icon: ShieldCheck,
      name: "HITL Approval Card",
      tagline: "Governance Built Into the Architecture",
      pain: "\"We cannot let AI act on our accounts without oversight\" — the #1 enterprise AI adoption blocker.",
      solution: "Every AI-proposed action surfaces in the Workspace as a structured approval card containing the proposed action, evidence chain, reasoning narrative, and source attribution — with approve/edit/reject controls and a mandatory audit log.",
      outcome: "Full AI leverage with zero rogue execution — the architecture enforces human review, not a setting or a workflow rule.",
      roi: "Governance compliance built in; audit log satisfies legal and security review; teams adopt AI faster because trust is structural, not assumed.",
      pitch: "AI cannot execute anything in IntegrateWise without your approval. Not as a policy. As the architecture.",
      color: "bg-[#10B981]"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-4 rounded-full bg-[#4256AB]/10 text-[#4256AB] text-sm font-bold tracking-wide uppercase mb-4">
              Win the First Meeting in 20 Minutes
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1E2A4A] mb-6">
              Three Features That{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4256AB] to-[#D46780]">
                Close Deals
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              These aren't features. They're the reasons your competitors will panic when they see your demo.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="space-y-16 md:space-y-24">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-12 items-center`}
            >
              {/* Visual Side */}
              <div className="flex-1 w-full">
                <div className={`relative p-8 md:p-12 rounded-3xl ${feature.color} text-white shadow-2xl`}>
                  <div className="absolute top-6 right-6">
                    <feature.icon className="w-12 h-12 md:w-16 md:h-16 opacity-20" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <feature.icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black">{feature.name}</h3>
                        <p className="text-white/80 text-sm font-semibold">{feature.tagline}</p>
                      </div>
                    </div>

                    <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <p className="text-lg md:text-xl font-bold leading-relaxed mb-4">
                        "{feature.pitch}"
                      </p>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                        <CheckCircle className="w-4 h-4" />
                        <span>{feature.roi}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Side */}
              <div className="flex-1 w-full">
                <div className="space-y-6">
                  {/* Pain */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 font-black text-sm">✕</span>
                      </div>
                      <h4 className="font-black text-slate-900 uppercase text-sm tracking-wide">The Pain</h4>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-lg">
                      {feature.pain}
                    </p>
                  </div>

                  {/* Solution */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#4256AB]/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-[#4256AB]" />
                      </div>
                      <h4 className="font-black text-slate-900 uppercase text-sm tracking-wide">How It Works</h4>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {feature.solution}
                    </p>
                  </div>

                  {/* Outcome */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="font-black text-slate-900 uppercase text-sm tracking-wide">Business Impact</h4>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-semibold">
                      {feature.outcome}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 md:mt-24 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <button className="px-10 py-5 bg-[#4256AB] hover:bg-[#3F5185] text-white rounded-full font-black text-lg shadow-xl shadow-[#4256AB]/30 transition-all">
              See These Features Live
            </button>
            <button className="px-10 py-5 bg-white border-2 border-[#4256AB] text-[#4256AB] hover:bg-slate-50 rounded-full font-black text-lg transition-all">
              Read the Technical Docs
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}