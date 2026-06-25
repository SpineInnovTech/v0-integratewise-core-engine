import Link from "next/link"
import {
  ArrowRight,
  Check,
  Database,
  Sparkles,
  Brain,
  Shield,
  Home,
  Loader2,
  ListTodo,
  BarChart3,
  FileText,
  Lightbulb,
  Settings,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function ProductPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              The Productivity OS for{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Effortless Work
              </span>
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              IntegrateWise sits on top of the tools you already use. It connects them through a shared structure
              (Spine), routes them securely (Hub), and powers your work with AI Loader, Brain + Agents, and universal
              Render outputs.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/platform">Explore Platform</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Universal by default. Specialized lenses for teams like Customer Success.
            </p>
          </div>
        </div>
      </section>

      {/* Category Definition */}
      <section className="border-b border-border py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Not another tool. The OS that makes your tools work together.
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Most productivity tools become another place to manage work. IntegrateWise becomes the system that
              connects and activates your existing stack—without migrations, rebuilding, or losing context.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
            {[
              {
                icon: Database,
                title: "Spine (Structure Layer)",
                desc: "Unifies data and preserves meaning across tools.",
              },
              {
                icon: Shield,
                title: "Hub (Control Layer)",
                desc: "Secure routing, permissions, boundaries, and governance.",
              },
              {
                icon: Sparkles,
                title: "Agents + Render",
                desc: "Turn your structured context into actions and outputs.",
              },
            ].map((pillar) => (
              <Card key={pillar.title} className="border-2 border-border">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                    <pillar.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{pillar.title}</h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{pillar.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* OS Core - Working Set */}
      <section className="border-b border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Your OS Core (working set)</h2>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              This is the universal foundation—built for anyone.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Home, title: "Home", desc: "Your unified overview" },
              { icon: Loader2, title: "Loader", desc: "Structured ingestion with one click" },
              { icon: ListTodo, title: "Tasks", desc: "Action and follow-through across tools" },
              { icon: BarChart3, title: "Insights", desc: "What matters most, when it matters" },
              { icon: FileText, title: "Templates", desc: "Install workflows instantly" },
              { icon: Lightbulb, title: "Brainstorming", desc: "Capture ideas and AI conversations" },
              { icon: Settings, title: "Settings", desc: "Controls, boundaries, and access" },
            ].map((module) => (
              <Card key={module.title} className="border-border">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <module.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{module.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{module.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" asChild>
              <Link href="/platform">See the Platform Architecture</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How Work Flows */}
      <section className="border-b border-border py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Connect once. Everything flows.
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Connect Tools",
                "Spine normalizes structure",
                "Hub routes securely",
                "AI Loader ingests",
                "Brain captures thinking",
                "Agents act",
                "Render outputs",
                "Choose a view (lens)",
              ].map((step, index) => (
                <div key={step} className="relative">
                  <div className="rounded-lg border border-border bg-card p-4 text-center">
                    <div className="mb-2 text-2xl font-bold text-primary">{index + 1}</div>
                    <p className="text-sm font-medium">{step}</p>
                  </div>
                  {index < 7 && (
                    <div className="absolute -right-2 top-1/2 hidden h-0.5 w-4 -translate-y-1/2 bg-border lg:block" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/integrations">Explore Integrations</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="#">Try AI Loader</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Loader Feature */}
      <section className="border-b border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary/10">
                <Loader2 className="h-8 w-8 text-secondary" />
              </div>
            </div>
            <h2 className="mt-6 text-balance text-center text-3xl font-bold tracking-tight sm:text-4xl">
              AI Loader: one-click ingestion that preserves context
            </h2>
            <p className="mt-6 text-pretty text-center text-lg leading-relaxed text-muted-foreground">
              The AI Loader brings your data in with a single click. It preserves relationships, formulas, and context
              wherever possible—so information keeps its meaning as it moves between tools.
            </p>
            <p className="mt-4 text-center font-medium">No endless copy-paste. No rebuilding tables by hand.</p>
            <div className="mt-8 text-center">
              <Button asChild>
                <Link href="#">Try AI Loader</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Second Brain Feature */}
      <section className="border-b border-border py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
                <Brain className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h2 className="mt-6 text-balance text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Brainstorming Layer + Brain Agent = your Second Brain
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Your ideas don't just live in docs—they live in conversations. Especially AI conversations.
            </p>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              IntegrateWise lets you stream AI chats from ChatGPT, Claude, Gemini, Grok, and Perplexity into one place
              using secure webhooks.
            </p>

            <Card className="mt-8 border-2 border-accent">
              <CardContent className="p-8">
                <h3 className="font-semibold">The Brain Agent helps you:</h3>
                <div className="mt-4 space-y-3">
                  {[
                    "Revisit and refine your thinking",
                    "Connect ideas across tools and time",
                    "Turn brainstorming into structured plans, tasks, and documents",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <p className="text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <Button asChild>
                <Link href="#">Connect Brain</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Agents Feature */}
      <section className="border-b border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-balance text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Agents that do real work—safely
            </h2>
            <p className="mt-6 text-pretty text-center text-lg leading-relaxed text-muted-foreground">
              Agents work on top of your structured context, not scattered tabs.
            </p>

            <Card className="mt-12 border-2 border-primary">
              <CardContent className="p-8">
                <h3 className="font-semibold">They can:</h3>
                <div className="mt-4 space-y-3">
                  {[
                    "Create plans, tasks, and follow-ups",
                    "Generate drafts and responses",
                    "Retrieve context instantly",
                    "Automate workflows across tools (Full Integration mode)",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  Agents run through Hub boundaries, permissions, and policies—so automation stays controlled.
                </p>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <Button asChild>
                <Link href="#">See Agents in Action</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Render Feature */}
      <section className="border-b border-border py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Render: universal outputs for anyone
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Render turns your structured work into:
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {["Docs", "Decks", "Emails", "SOPs", "Implementation plans", "Executive updates", "Dashboards"].map(
                (output) => (
                  <div key={output} className="rounded-lg border border-border bg-card p-4">
                    <p className="font-medium">{output}</p>
                  </div>
                ),
              )}
            </div>

            <p className="mt-8 text-muted-foreground">Render works for individuals, teams, and specialized lenses.</p>

            <div className="mt-8">
              <Button variant="outline" asChild>
                <Link href="/templates">Explore Templates (Outputs)</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Modes */}
      <section className="border-b border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Full Integration or Render Only — your choice
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold">Full Integration</h3>
                <div className="mt-6 space-y-4">
                  {[
                    "Two-way sync + automation",
                    "Agents can create and update workflows across tools",
                    "Best for teams that want execution",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold">Render Only</h3>
                <div className="mt-6 space-y-4">
                  {[
                    "Read-only dashboards + analytics",
                    "Zero risk to your source systems",
                    "Best for compliance-first orgs and executive reporting",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="#">Compare Modes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Views (Lenses) */}
      <section className="border-b border-border py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">One OS. Many lenses.</h2>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              IntegrateWise is universal by default. Lenses are specialized views that apply the same core platform to
              specific roles.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-2">
            {[
              { title: "Individuals", desc: "Personal productivity OS" },
              { title: "Teams", desc: "Shared context and execution" },
              { title: "Business Ops", desc: "Workflows, automation, analytics" },
              {
                title: "Customer Success (Specialized)",
                desc: "Health, churn, ARR, technical health",
                highlight: true,
              },
            ].map((lens) => (
              <Card key={lens.title} className={lens.highlight ? "border-2 border-secondary" : "border-border"}>
                <CardContent className="p-6">
                  <h3 className="font-semibold">{lens.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{lens.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" asChild>
              <Link href="/solutions">Explore Solutions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* BYOM */}
      <section className="border-b border-border bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Bring Your Own AI Model (BYOM)
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Start with built-in models for a smooth experience. When you're ready, connect your own model—commercial
              or self-hosted—using your API key.
            </p>
            <div className="mt-8">
              <Button variant="outline" asChild>
                <Link href="#">Learn about BYOM</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-b from-background to-primary/5 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to experience Effortless Work?
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Start with one workflow. Let your tools finally work together.
            </p>
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
