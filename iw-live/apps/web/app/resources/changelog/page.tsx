import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { cms } from "@/lib/cms"

export default async function ChangelogPage() {
  const entries = await cms.getChangelogEntries()

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">Changelog</h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              New releases, improvements, and updates to IntegrateWise.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#">Subscribe to Updates</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">View Docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Changelog Entries */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {entries.map((entry, index) => (
              <Card key={entry.id}>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">v{entry.version}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
                    </div>
                    {index === 0 && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                        Latest
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="text-muted-foreground">{entry.description}</p>
                  </div>

                  <div className="mt-8 space-y-6">
                    {entry.highlights && entry.highlights.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-primary">Highlights</h3>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {entry.highlights.map((highlight, idx) => (
                            <li key={idx}>{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Group changes by type */}
                    {["feature", "improvement", "fix", "breaking"].map((type) => {
                      const typeChanges = entry.changes.filter((c) => c.type === type)
                      if (typeChanges.length === 0) return null

                      return (
                        <div key={type}>
                          <h3 className="font-semibold capitalize">{type}s</h3>
                          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            {typeChanges.map((change, idx) => (
                              <li key={idx}>
                                <strong>{type === "feature" ? "Added" : type === "fix" ? "Fixed" : "Improved"}:</strong>{" "}
                                {change.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Coming Next */}
            <Card className="border-2 border-dashed border-primary/50">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold">Coming Next</h2>
                <p className="mt-4 text-muted-foreground">
                  We're working on exciting new features. Here's what's on the roadmap:
                </p>
                <ul className="mt-6 space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>Multi-workspace support for enterprise teams</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>Advanced workflow automation builder with visual editor</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>Mobile companion apps for iOS and Android</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>Enhanced analytics dashboard with custom metrics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>Self-hosted deployment options for enterprise</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
