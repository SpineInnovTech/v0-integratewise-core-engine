import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function CareersPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
              Build the OS for Effortless Work
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              We're building a new layer of productivity—where tools connect, AI thinking compounds, and work becomes
              calmer.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Why Join</h2>
            <div className="mt-12 space-y-4">
              {[
                "Build a new category",
                "Solve real workflow pain",
                "Work across AI + integrations + product design",
                "Remote-friendly / high ownership",
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

      {/* Open Roles */}
      <section className="border-y border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Open Roles</h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {["Product Engineer", "AI / Agents Engineer", "Integrations Engineer", "Customer Success / Solutions"].map(
              (role) => (
                <Card key={role}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold">{role}</h3>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="#">
                          View Details <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Button size="lg" asChild>
              <Link href="#">
                Apply <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
