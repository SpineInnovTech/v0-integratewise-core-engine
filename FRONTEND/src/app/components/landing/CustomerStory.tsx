import { motion } from "motion/react";
import { Quote, TrendingUp, Clock, DollarSign, Users, CheckCircle2 } from "lucide-react";

export function CustomerStory() {
  return (
    <section className="py-20 md:py-32 bg-[#1E2A4A] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D46780] rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <span className="inline-block py-1 px-4 rounded-full bg-[#D46780]/20 text-[#D46780] text-sm font-bold tracking-wide uppercase mb-4">
            Real Revenue Protected
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            The $8M Account That{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D46780] to-[#10B981]">
              Almost Churned
            </span>
          </h2>
          <p className="text-lg md:text-xl text-white/80 leading-relaxed">
            This exact sequence — signal detection, evidence assembly, HITL approval — saved a customer relationship worth 3+ years of platform fees.
          </p>
        </motion.div>

        {/* Story Timeline */}
        <div className="max-w-5xl mx-auto">
          <div className="space-y-8">
            {/* Week -8: Signal Detected */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-32 text-right">
                <div className="text-2xl font-black text-[#D46780]">Week -8</div>
                <div className="text-sm text-white/60 font-semibold">Signal Fires</div>
              </div>
              <div className="flex-grow bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold mb-2">Proactive Signal Engine Detected Risk</h3>
                    <p className="text-white/80 leading-relaxed mb-4">
                      The Depth Matrix flagged anomalies across 6 disconnected systems: product usage dropped 37%, support ticket severity increased, champion's Slack activity went silent, invoice payment delayed 12 days past terms.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold">Usage Drop: -37%</span>
                      <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold">P1 Tickets: +3</span>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-bold">Payment Delay: 12d</span>
                      <span className="px-3 py-1 bg-slate-500/20 text-slate-300 rounded-full text-xs font-bold">Champion Silent</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Week -7: Evidence Assembled */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-32 text-right">
                <div className="text-2xl font-black text-[#4256AB]">Week -7</div>
                <div className="text-sm text-white/60 font-semibold">Account 360</div>
              </div>
              <div className="flex-grow bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#4256AB]/20 flex items-center justify-center shrink-0">
                    <Quote className="w-6 h-6 text-[#7B9BFF]" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold mb-2">Spine Assembled Complete Context</h3>
                    <p className="text-white/80 leading-relaxed mb-4">
                      Account 360 pulled the full picture in 2.8 seconds: every support escalation with engineering notes, every email thread showing frustration with a specific feature, product analytics showing which workflow broke, CRM notes from the original sales cycle revealing expectations that weren't met.
                    </p>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-white/60 font-semibold mb-2">Evidence Sources Unified:</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Salesforce (CRM)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Zendesk (Support)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Segment (Analytics)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Slack (Comms)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Stripe (Billing)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Gmail (Email)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Week -6: AI Proposes, Human Approves */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-32 text-right">
                <div className="text-2xl font-black text-[#10B981]">Week -6</div>
                <div className="text-sm text-white/60 font-semibold">HITL Approval</div>
              </div>
              <div className="flex-grow bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold mb-2">CSM Reviewed & Approved Intervention</h3>
                    <p className="text-white/80 leading-relaxed mb-4">
                      The HITL Approval Card surfaced AI's proposed 3-step save motion: (1) Executive outreach with root cause summary, (2) Expedited engineering fix for the broken workflow, (3) QBR rescheduled with product roadmap preview. CSM edited the tone, added a personal note, and approved execution.
                    </p>
                    <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-emerald-300">Human-Approved Action</span>
                      </div>
                      <p className="text-sm text-white/80">Every decision logged. Every change tracked. Complete audit trail from signal → evidence → reasoning → approval → execution.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Week 0: Account Saved */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-32 text-right">
                <div className="text-2xl font-black text-emerald-400">Week 0</div>
                <div className="text-sm text-white/60 font-semibold">Outcome</div>
              </div>
              <div className="flex-grow bg-gradient-to-br from-emerald-500/20 to-[#10B981]/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-emerald-400/30">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-400/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-8 h-8 text-emerald-300" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl md:text-3xl font-black mb-3 text-emerald-300">$8M Account Renewed + Expanded</h3>
                    <p className="text-white/90 leading-relaxed text-lg mb-6">
                      The account not only renewed but expanded by 40% within 90 days. The champion became a reference customer. The intervention happened 6 weeks before the QBR — when it still mattered.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-3xl font-black text-emerald-300 mb-1">$8M</div>
                        <div className="text-sm text-white/70 font-semibold">ARR Protected</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-3xl font-black text-emerald-300 mb-1">+40%</div>
                        <div className="text-sm text-white/70 font-semibold">Expansion</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-3xl font-black text-emerald-300 mb-1">6 Weeks</div>
                        <div className="text-sm text-white/70 font-semibold">Ahead of QBR</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 max-w-4xl mx-auto text-center"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
            <Quote className="w-12 h-12 text-[#D46780] mx-auto mb-6" />
            <blockquote className="text-xl md:text-2xl font-bold text-white/90 leading-relaxed mb-6">
              "We would have discovered this at the QBR. By then it would have been too late. The Spine knew 8 weeks early. That's why we renewed."
            </blockquote>
            <div className="text-white/60 font-semibold">
              — VP Customer Success, B2B SaaS Platform ($45M ARR)
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 text-center"
        >
          <button className="px-10 py-5 bg-[#D46780] hover:bg-[#C15A6F] text-white rounded-full font-black text-lg shadow-xl shadow-[#D46780]/30 transition-all">
            Protect Your Revenue — Book a Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
}