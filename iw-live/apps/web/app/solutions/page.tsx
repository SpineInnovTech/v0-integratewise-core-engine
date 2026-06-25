import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Space_Grotesk } from "next/font/google"
import { cn } from "@/lib/utils"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" })

export default function SolutionsPage() {
  const solutions = [
    {
      icon: "💳",
      title: "Finance Ops",
      description: "Automate financial workflows from payments to reconciliation",
      flow: "Stripe events → Slack approvals → Neon/Postgres record updates",
      tools: ["Stripe", "Slack", "Neon Postgres", "Doppler"],
      benefits: ["Real-time payment tracking", "Automated reconciliation", "Compliance ready"],
    },
    {
      icon: "📊",
      title: "RevOps",
      description: "Streamline revenue operations from lead to close",
      flow: "Salesforce → Notion → Email sequences with AI summaries",
      tools: ["Salesforce", "Notion", "OpenAI", "Vercel AI Gateway"],
      benefits: ["Lead qualification automation", "AI-powered insights", "Deal tracking"],
    },
    {
      icon: "🎫",
      title: "Support Automation",
      description: "Transform customer support with intelligent automation",
      flow: "Webhooks → triage → AI responses → ticket updates",
      tools: ["Slack", "Discord", "Claude", "Upstash"],
      benefits: ["24/7 automated triage", "Smart ticket routing", "Response automation"],
    },
  ]

  return (
    <div className={cn("min-h-screen bg-white", spaceGrotesk.variable)}>
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-[#0B1220] mb-6">
            Solutions for every{" "}
            <span className="text-[#2563EB]">
              enterprise
              <br />
              workflow
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Pre-built automation scenarios for Finance, RevOps, and Support teams
          </p>
          <Button size="lg" className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-xl shadow-blue-500/30" asChild>
            <Link href="/contact">Talk to Solutions Team</Link>
          </Button>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-20">
          {solutions.map((solution, idx) => (
            <div
              key={idx}
              className="grid md:grid-cols-2 gap-12 items-center border-t border-slate-200 pt-12 first:border-t-0 first:pt-0"
            >
              <div>
                <div className="text-5xl mb-4">{solution.icon}</div>
                <h2 className="font-heading text-3xl font-bold text-[#0B1220] mb-4">{solution.title}</h2>
                <p className="text-lg text-slate-600 mb-6">{solution.description}</p>

                <div className="space-y-4 mb-8">
                  <div>
                    <h3 className="font-semibold text-[#0B1220] mb-2">Example Flow</h3>
                    <p className="text-sm text-slate-600 font-mono bg-slate-50 p-3 rounded border border-slate-200">
                      {solution.flow}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#0B1220] mb-2">Required Tools</h3>
                    <div className="flex flex-wrap gap-2">
                      {solution.tools.map((tool) => (
                        <span key={tool} className="text-xs bg-blue-50 text-[#2563EB] px-3 py-1 rounded-full">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="border-[#2563EB] text-[#2563EB] hover:bg-blue-50 bg-transparent"
                  asChild
                >
                  <Link href={`/solutions/${solution.title.toLowerCase().replace(" ", "-")}`}>
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-[#0B1220] mb-4">Key Benefits</h3>
                <ul className="space-y-3">
                  {solution.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#2563EB]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="font-heading text-4xl font-bold mb-6">Ready to automate your workflows?</h2>
          <Button size="lg" className="bg-white text-[#2563EB] hover:bg-slate-100 font-semibold px-8" asChild>
            <Link href="/contact">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
