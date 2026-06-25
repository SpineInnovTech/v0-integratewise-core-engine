import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">The Story of Effortless Work</h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              IntegrateWise was built from real tool pain: scattered context, broken workflows, lost AI thinking, and
              constant copy-paste.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-12">
            <div>
              <h2 className="text-2xl font-bold">The problem we all face</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Modern teams use amazing tools—but they don't talk to each other. Context gets lost. AI conversations
                disappear. Data lives in silos. And every workflow requires manual copying, pasting, and reconciling.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">The turning point</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                A customer success manager was spending hours each day copying data between tools, manually updating
                health scores, and trying to remember which AI conversation had the key insight. That shouldn't be how
                work feels.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Why IntegrateWise exists</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We built IntegrateWise to be the missing layer—the productivity OS that connects your tools, preserves
                your thinking, and makes workflows feel effortless instead of exhausting.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">What we believe</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Tools should work together. AI thinking should compound. Work should feel calmer, clearer, and more
                connected—without forcing anyone to restart their system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-y border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Our Mission</h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              To make work feel calmer, clearer, and more connected—without forcing anyone to restart their system.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Our Values</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Effortless > Complex", desc: "Simplicity wins" },
              { title: "Control > Lock-in", desc: "You own your data and choices" },
              { title: "Structure > Chaos", desc: "Systems over scrambling" },
              { title: "Trust > Hype", desc: "Honest, reliable, and secure" },
              { title: "Work that compounds", desc: "Every action builds value" },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-gradient-to-b from-muted/20 to-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Join the movement toward Effortless Work.
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">Book Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
