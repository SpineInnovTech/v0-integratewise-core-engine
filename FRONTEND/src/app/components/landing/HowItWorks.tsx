import { motion } from "motion/react";
import { Database, Workflow, Brain, CheckCircle, ArrowRight, Zap } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Database,
      title: "Connect & Normalize",
      description: "All data from your CRM, support, billing, and product tools flows through the 8-stage normalization pipeline into the Spine.",
      details: [
        "50 pre-built connectors",
        "8-stage data pipeline",
        "Canonical entity mapping",
        "First Spine write in 14 days"
      ],
      color: "bg-[#4256AB]"
    },
    {
      number: "02",
      icon: Brain,
      title: "AI Analyzes",
      description: "The Depth Matrix continuously evaluates Spine data against your custom signal rules. Intelligence compounds with every decision.",
      details: [
        "Real-time signal detection",
        "Evidence chain assembly",
        "Context from all systems",
        "Learning from approvals"
      ],
      color: "bg-[#D46780]"
    },
    {
      number: "03",
      icon: CheckCircle,
      title: "Human Approves",
      description: "Every AI-proposed action surfaces as a HITL Approval Card. You review the evidence, edit if needed, and approve or reject.",
      details: [
        "Full evidence transparency",
        "Edit before execution",
        "Mandatory audit log",
        "Zero rogue AI actions"
      ],
      color: "bg-[#10B981]"
    },
    {
      number: "04",
      icon: Workflow,
      title: "Action & Re-ingestion",
      description: "Approved actions execute across your stack. Outcomes flow back through the pipeline, making the Spine smarter with every cycle.",
      details: [
        "Governed execution",
        "Cross-system actions",
        "Outcome tracking",
        "Compounding intelligence"
      ],
      color: "bg-[#F59E0B]"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, #1E2A4A 1px, transparent 1px),
                           linear-gradient(to bottom, #1E2A4A 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-16 md:mb-24"
        >
          <span className="inline-block py-1 px-4 rounded-full bg-[#4256AB]/10 text-[#4256AB] text-sm font-bold tracking-wide uppercase mb-4">
            The Closed Loop
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1E2A4A] mb-6">
            How IntegrateWise{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4256AB] to-[#D46780]">
              Actually Works
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
            From ingestion to governed action to re-ingestion. The only platform that closes the loop.
          </p>
        </motion.div>

        {/* Flow Visualization */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {/* Connector Arrow (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 -right-3 z-20">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}

                {/* Step Card */}
                <div className="relative h-full">
                  {/* Number Badge */}
                  <div className="absolute -top-4 -left-4 w-14 h-14 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center z-10">
                    <span className="text-xl font-black text-[#4256AB]">{step.number}</span>
                  </div>

                  {/* Card */}
                  <div className={`h-full ${step.color} rounded-2xl p-6 text-white`}>
                    <div className="mb-4 mt-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                        <step.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-black mb-2">{step.title}</h3>
                    </div>
                    
                    <p className="text-white/90 text-sm leading-relaxed mb-6">
                      {step.description}
                    </p>

                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-semibold text-white/80">
                          <Zap className="w-3 h-3 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Closed Loop Indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#4256AB] via-[#D46780] to-[#10B981] rounded-2xl blur-xl opacity-20" />
            <div className="relative bg-slate-900 rounded-2xl p-8 md:p-10 text-center border-2 border-slate-800">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#4256AB] to-[#D46780] flex items-center justify-center animate-pulse">
                  <Workflow className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-2xl md:text-3xl font-black text-white">The Compounding Effect</h4>
              </div>
              <p className="text-slate-400 text-lg leading-relaxed max-w-3xl mx-auto">
                Every approved action outcome flows back through the pipeline → Spine → Entity 360 → cognitive loop. 
                The system doesn't plateau. It gets <span className="text-[#10B981] font-bold">smarter every week</span>.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Architecture Detail CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-600 mb-6 text-lg">
            Want the deep technical architecture? We wrote a 10-page guide.
          </p>
          <button className="px-10 py-5 bg-white border-2 border-[#4256AB] text-[#4256AB] hover:bg-[#4256AB] hover:text-white rounded-full font-black text-lg transition-all inline-flex items-center gap-2">
            Read the Technical Architecture <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}