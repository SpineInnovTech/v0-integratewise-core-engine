import { motion } from "motion/react";
import { DollarSign, AlertTriangle, CheckCircle2, Zap } from "lucide-react";

export function FounderStory() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-[#1E2A4A] via-[#2A3A5A] to-[#1E2A4A] text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D46780]/10 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#3F5185]/10 rounded-full blur-3xl -z-0" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-bold tracking-wide uppercase mb-4 rounded-full">
              The $8M Story
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
              The Moment That Changed Everything
            </h2>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
              Built by a 13-year MuleSoft architect who learned the hard way: <br className="hidden md:block" />
              <span className="text-white font-semibold">The data existed. The systems existed. The intelligence was absent.</span>
            </p>
          </motion.div>
        </div>

        {/* The Story */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-12">
          {/* Left: The Problem */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Three Signals. Three Systems. Zero Connection.</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Support tickets spiking. Feature adoption dropping. A tense executive signal captured in a personal note.
                  </p>
                </div>
              </div>
              <div className="space-y-3 pl-16">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-sm text-white/60">Zendesk: 47% increase in tickets</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-sm text-white/60">Salesforce: Feature usage down 32%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-sm text-white/60">Email: "We're evaluating alternatives"</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-sm text-white/60 uppercase tracking-wider font-bold">At Risk</p>
                  <p className="text-3xl font-black text-white">$8M ARR</p>
                </div>
              </div>
              <p className="text-sm text-white/70">
                The account was nearly lost. <span className="text-white font-semibold">Nobody had connected the dots.</span>
              </p>
            </div>
          </motion.div>

          {/* Right: The Insight */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">The Founding Question</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    That moment became the question behind IntegrateWise:
                  </p>
                </div>
              </div>
              <div className="pl-16">
                <blockquote className="text-lg font-semibold text-white/90 italic border-l-4 border-emerald-400 pl-4 py-2">
                  "What if every signal, from every system, fed into one place — and that place could think?"
                </blockquote>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-3">That Question Became the Adaptive Spine</h3>
                  <div className="space-y-2 text-sm text-white/70">
                    <p>
                      ✓ Connect <strong className="text-white">every signal</strong> across every tool
                    </p>
                    <p>
                      ✓ Build a <strong className="text-white">single source of truth</strong> that thinks
                    </p>
                    <p>
                      ✓ Let AI surface insights with <strong className="text-white">full context</strong>
                    </p>
                    <p>
                      ✓ Keep <strong className="text-white">humans in control</strong> of every action
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom: The Result */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-2xl p-8 md:p-10 text-center border border-slate-200 shadow-xl"
        >
          <p className="text-lg md:text-xl text-slate-700 mb-6 leading-relaxed max-w-3xl mx-auto">
            <span className="font-bold text-slate-900">The Spine became IntegrateWise.</span> A Knowledge Workspace where context isn't reconstructed manually — it's unified automatically. Where AI doesn't guess — it thinks with your full business truth. And where nothing executes without your approval.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 text-center">
            <div className="flex-1">
              <p className="text-4xl md:text-5xl font-black text-[#3F5185] mb-2">18%</p>
              <p className="text-sm text-slate-600">Churn reduction in 90 days</p>
            </div>
            <div className="flex-1">
              <p className="text-4xl md:text-5xl font-black text-[#3F5185] mb-2">60s</p>
              <p className="text-sm text-slate-600">First data sync after connection</p>
            </div>
            <div className="flex-1">
              <p className="text-4xl md:text-5xl font-black text-[#3F5185] mb-2">13yr</p>
              <p className="text-sm text-slate-600">Enterprise integration expertise</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}