import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">Privacy by design</h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              IntegrateWise is built to respect boundaries, minimize storage, and keep you in control of what's synced,
              stored, or read-only.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/security">Read Security</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">
                  Book Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Principles */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Privacy Principles</h2>
            <div className="mt-12 space-y-4">
              {[
                "Minimum necessary access",
                "Scoped permissions",
                "Workspace isolation",
                "Clear data retention choices",
                "Optional Render Only mode",
                "BYOM support",
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

      {/* Data Handling */}
      <section className="border-y border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Data Handling Summary</h2>
            <div className="mt-8 space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                IntegrateWise can operate as a router and normaliser
              </p>
              <p className="text-muted-foreground leading-relaxed">Data storage is controlled by configuration</p>
              <p className="text-muted-foreground leading-relaxed">
                You choose what stays internal and what is replicated
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Work with confidence. Stay in control.
            </h2>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="#">
                  Talk to Security <ArrowRight className="ml-2 h-4 w-4" />
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
