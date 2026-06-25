import Link from "next/link"
import { Book, Search, ChevronRight, FileText, Code, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Space_Grotesk } from "next/font/google"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" })

export default function DocsPage() {
  const sections = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Quick start guide and initial setup",
      links: [
        { label: "Introduction", href: "/docs/introduction" },
        { label: "Installation", href: "/docs/installation" },
        { label: "First Workflow", href: "/docs/first-workflow" },
        { label: "Configuration", href: "/docs/configuration" },
      ],
    },
    {
      icon: Code,
      title: "Architecture",
      description: "System design and core concepts",
      links: [
        { label: "Overview", href: "/docs/architecture" },
        { label: "IntegrateWise OS", href: "/docs/architecture/os" },
        { label: "IntegrateWise Hub", href: "/docs/architecture/hub" },
        { label: "Data Flow", href: "/docs/architecture/data-flow" },
      ],
    },
    {
      icon: Zap,
      title: "Adapters",
      description: "Integration adapters and connectors",
      links: [
        { label: "Stripe", href: "/docs/adapters/stripe" },
        { label: "Slack", href: "/docs/adapters/slack" },
        { label: "Salesforce", href: "/docs/adapters/salesforce" },
        { label: "Custom Adapters", href: "/docs/adapters/custom" },
      ],
    },
    {
      icon: Shield,
      title: "Governance",
      description: "Security, compliance, and best practices",
      links: [
        { label: "RBAC", href: "/docs/governance/rbac" },
        { label: "Audit Logs", href: "/docs/governance/audit" },
        { label: "Secret Management", href: "/docs/governance/secrets" },
        { label: "Compliance", href: "/docs/governance/compliance" },
      ],
    },
    {
      icon: FileText,
      title: "API Reference",
      description: "Complete API documentation",
      links: [
        { label: "REST API", href: "/docs/api/rest" },
        { label: "Webhooks", href: "/docs/api/webhooks" },
        { label: "GraphQL", href: "/docs/api/graphql" },
        { label: "SDK", href: "/docs/api/sdk" },
      ],
    },
  ]

  return (
    <div className={cn("min-h-screen bg-white", spaceGrotesk.variable)}>
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading text-5xl font-bold text-[#0B1220] mb-4">Documentation</h1>
            <p className="text-xl text-slate-600 mb-8">Everything you need to build with IntegrateWise</p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="search"
                placeholder="Search documentation..."
                className="pl-12 h-14 text-lg border-slate-300 focus:border-[#2563EB] bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section, idx) => (
              <Card
                key={idx}
                className="p-6 border border-slate-200 hover:border-[#2563EB] hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <section.icon className="w-6 h-6 text-[#2563EB]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#0B1220] mb-2">{section.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-600 hover:text-[#2563EB] flex items-center gap-2 group"
                      >
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-[#0B1220] mb-8 text-center">Popular Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Quickstart Guide", desc: "Get up and running in 5 minutes", href: "/docs/quickstart" },
              { title: "Example Projects", desc: "Explore sample integrations", href: "/docs/examples" },
              { title: "Migration Guide", desc: "Moving from another platform", href: "/docs/migration" },
            ].map((resource, idx) => (
              <Link
                key={idx}
                href={resource.href}
                className="p-6 bg-white border border-slate-200 rounded-lg hover:border-[#2563EB] hover:shadow-md transition-all group"
              >
                <h3 className="font-semibold text-[#0B1220] mb-2 group-hover:text-[#2563EB]">{resource.title}</h3>
                <p className="text-sm text-slate-600">{resource.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0B1220] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">Need help getting started?</h2>
          <p className="text-lg text-slate-300 mb-8">Our team is here to help you succeed</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 bg-transparent"
              asChild
            >
              <Link href="/community">Join Community</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
