import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function CompliancePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
              Compliance that scales with your workflows
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              IntegrateWise supports auditability, governance controls, and safe modes for compliance-first teams.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="#">
                  Talk to Compliance <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Capabilities */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Compliance Capabilities</h2>
            <div className="mt-12 space-y-4">
              {[
                "Audit logs + traceability",
                "DataSentinel enforcement",
                "Render Only mode (read-only, zero write access)",
                "Policy-based approvals",
                "Workspace boundaries",
                "Data lineage reporting",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-gradient-to-b from-muted/20 to-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Start safe. Scale securely.</h2>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="#">
                  Talk to Compliance <ArrowRight className="ml-2 h-4 w-4" />
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
