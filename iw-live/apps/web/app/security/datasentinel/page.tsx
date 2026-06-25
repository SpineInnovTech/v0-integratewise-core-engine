import Link from "next/link"
import { ArrowRight, Shield, Eye, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function DataSentinelPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Shield className="mx-auto h-16 w-16 text-primary" />
            <h1 className="mt-8 text-balance text-5xl font-bold tracking-tight sm:text-6xl">
              DataSentinel: governance for safe AI and integrations
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Detect sensitive data, enforce policy rules, track lineage, and ensure outputs are safe—across agents and
              render pipelines.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#">
                  Talk to Security <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">Book Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What DataSentinel Does */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">What DataSentinel Does</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "PII detection + masking",
                desc: "Automatically detect and protect sensitive information",
              },
              { icon: Shield, title: "Policy enforcement", desc: "Approve/mask/block/escalate based on your rules" },
              { icon: Lock, title: "Output governance for Render", desc: "Ensure all generated content is safe" },
              { icon: Eye, title: "Data lineage tracking", desc: "Know where data comes from and where it goes" },
              {
                icon: Shield,
                title: "Audit logs and compliance reporting",
                desc: "Complete visibility for compliance teams",
              },
              { icon: Lock, title: "Risk scoring for workflows", desc: "Understand and manage workflow risk" },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <item.icon className="h-10 w-10 text-primary" />
                  <h3 className="mt-4 font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="border-y border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Why It Matters</h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              AI and integrations increase leverage—and risk. DataSentinel is how IntegrateWise keeps automation safe
              and controlled.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Secure automation without slowing down work.
            </h2>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="#">
                  Book Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
