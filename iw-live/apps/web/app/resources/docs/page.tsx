import Link from "next/link"
import { ArrowRight, Book, Code, Rocket, Settings, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">Documentation</h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Everything you need to connect tools, configure the OS, and deploy agents safely.
            </p>
          </div>
        </div>
      </section>

      {/* Docs Categories */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Rocket, title: "Getting Started", href: "#" },
              { icon: Settings, title: "Integrations", href: "/integrations" },
              { icon: Zap, title: "Webhooks", href: "#" },
              { icon: Code, title: "AI Loader", href: "#" },
              { icon: Book, title: "Brain + Second Brain", href: "#" },
              { icon: Zap, title: "Agents", href: "#" },
              { icon: Settings, title: "Templates", href: "/templates" },
              { icon: Code, title: "Render Outputs", href: "#" },
              { icon: Shield, title: "Modes: Full Integration vs Render Only", href: "#" },
              { icon: Shield, title: "Security & BYOM", href: "/security" },
              { icon: Settings, title: "Admin & Governance", href: "#" },
              { icon: Code, title: "API Reference", href: "/resources/api" },
            ].map((item) => (
              <Card key={item.title} className="border-border transition-colors hover:border-primary">
                <CardContent className="p-6">
                  <item.icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-bold">{item.title}</h3>
                  <Link href={item.href} className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                    Read docs <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Start with Quickstart</h2>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="#">
                  View Quickstart <ArrowRight className="ml-2 h-4 w-4" />
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
