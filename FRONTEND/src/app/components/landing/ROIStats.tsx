import { motion } from "motion/react";
import { TrendingUp, Clock, DollarSign, Users, Zap, Target, BarChart3, CheckCircle2 } from "lucide-react";

export function ROIStats() {
  const stats = [
    {
      icon: Clock,
      value: "8-10 hrs",
      label: "Recovered Per CSM/Week",
      detail: "QBR prep from 3 hours → 15 minutes"
    },
    {
      icon: TrendingUp,
      value: "6-8 weeks",
      label: "Earlier Risk Detection",
      detail: "Before the intervention window closes"
    },
    {
      icon: DollarSign,
      value: "$1M+",
      label: "Account Protection ROI",
      detail: "One save pays for 3+ years"
    },
    {
      icon: Users,
      value: "2-3x",
      label: "More At-Risk Accounts Found",
      detail: "Previously invisible risks surfaced"
    }
  ];

  const outcomes = [
    {
      metric: "Time Savings",
      items: [
        "Account brief assembly: 90 min → 3 seconds",
        "Manual data hunts: 40 min → 30 seconds",
        "QBR prep per account: 3 hours → 15 minutes",
        "Cross-system reconciliation: eliminated"
      ]
    },
    {
      metric: "Revenue Protection",
      items: [
        "Churn signals 6-8 weeks earlier",
        "Complete evidence chains assembled",
        "Intervention before renewal risk",
        "Average 2-3 invisible accounts surfaced/quarter"
      ]
    },
    {
      metric: "Team Efficiency",
      items: [
        "First Spine write within 14 days",
        "Zero integration maintenance",
        "One truth layer for all teams",
        "AI adoption without trust blockers"
      ]
    },
    {
      metric: "Intelligence Quality",
      items: [
        "98%+ data coverage across tools",
        "Every output source-attributed",
        "Compounding intelligence over 90 days",
        "Platform gets smarter with use"
      ]
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <span className="inline-block py-1 px-4 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold tracking-wide uppercase mb-4">
            Quantified Outcomes
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1E2A4A] mb-6">
            The Numbers Don't Lie:{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-[#10B981]">
              Real ROI
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
            These aren't projections. They're measured outcomes from revenue teams using IntegrateWise in production.
          </p>
        </motion.div>

        {/* Big Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#4256AB] to-[#D46780] rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity blur-xl" />
              <div className="relative bg-white rounded-2xl p-6 border-2 border-slate-200 group-hover:border-[#4256AB] transition-all shadow-sm hover:shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-[#4256AB]/10 flex items-center justify-center mb-4 group-hover:bg-[#4256AB] transition-colors">
                  <stat.icon className="w-6 h-6 text-[#4256AB] group-hover:text-white transition-colors" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-[#1E2A4A] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-slate-900 mb-2">
                  {stat.label}
                </div>
                <div className="text-xs text-slate-600">
                  {stat.detail}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Outcomes */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[#1E2A4A] rounded-3xl p-8 md:p-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
              Measured Impact Across 4 Dimensions
            </h3>
            <p className="text-white/70 text-lg">
              From first connection to compounding intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {outcomes.map((outcome, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4256AB] to-[#D46780] flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-black text-white">{outcome.metric}</h4>
                </div>
                <ul className="space-y-3">
                  {outcome.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/80">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ROI Calculator CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-emerald-50 to-[#10B981]/10 rounded-2xl p-8 md:p-10 border-2 border-emerald-200">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h4 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                  Calculate Your Exact ROI
                </h4>
                <p className="text-slate-700 text-lg">
                  Input your team size, tool count, and average account value. See your payback period in under 60 seconds.
                </p>
              </div>
              <button className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black text-lg shadow-xl shadow-emerald-600/30 transition-all whitespace-nowrap">
                Run the Numbers
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 flex flex-wrap justify-center gap-12 text-center"
        >
          {[
            { value: "14 days", label: "Average onboarding time" },
            { value: "50+", label: "Pre-built connectors" },
            { value: "98.4%", label: "Average Spine health" },
            { value: "Zero", label: "Integration maintenance" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-3xl md:text-4xl font-black text-[#4256AB] mb-1">
                {item.value}
              </div>
              <div className="text-sm text-slate-600 font-semibold">
                {item.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}