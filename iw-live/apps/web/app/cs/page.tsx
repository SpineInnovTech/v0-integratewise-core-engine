import Link from "next/link"
import { ArrowRight, Check, Users, BarChart3, MessageSquare, Target, Zap, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://os.integratewise.online"

const features = [
  { icon: Users, title: "Customer Health", desc: "Real-time health scores and risk alerts." },
  { icon: BarChart3, title: "Analytics", desc: "Deep insights into customer behavior." },
  { icon: MessageSquare, title: "Communication", desc: "Unified customer communication hub." },
  { icon: Target, title: "Engagement", desc: "Proactive engagement automation." },
  { icon: Zap, title: "Workflows", desc: "AI-powered workflow automation." },
  { icon: TrendingUp, title: "Growth", desc: "Expansion and upsell intelligence." },
] as const

const benefits = [
  "Reduce churn with predictive insights",
  "Automate repetitive CS tasks",
  "Scale your team's impact",
  "Drive expansion revenue",
] as const

export default function CSLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-theme-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="font-semibold text-lg text-theme-primary">IntegrateWise CS</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`${APP_URL}/auth/login`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Link>
              <Button size="sm" className="btn-theme-primary" asChild>
                <a href={`${APP_URL}/start`}>Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main
        data-theme="cs"
        className="min-h-dvh bg-[var(--semantic-surface-DEFAULT)] text-[var(--semantic-text-primary)]"
      >
        {/* Skip to content */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-[var(--semantic-surface-raised)] focus:text-[var(--semantic-text-primary)] focus:px-3 focus:py-2 focus:rounded-md"
        >
          Skip to content
        </a>

        {/* Header */}
        <header className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" aria-label="IntegrateWise Home" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[var(--semantic-primary)]" />
            <span className="font-semibold tracking-tight">IntegrateWise CS</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="https://integratewise.online/docs"
              className="text-[var(--semantic-text-muted)] hover:text-[var(--semantic-text-primary)]"
            >
              Docs
            </Link>
            <Link
              href="/signin"
              className="text-[var(--semantic-text-muted)] hover:text-[var(--semantic-text-primary)]"
            >
              Sign in
            </Link>
            <Button
              asChild
              className="bg-[var(--semantic-primary)] hover:opacity-90 text-[var(--semantic-text-inverse)]"
            >
              <Link href="/signup" aria-label="Get Started">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border gradient-theme-hero">
          <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight text-theme-primary sm:text-6xl">
              Customer Success
              <br />
              <span className="text-primary">Intelligence & Automation</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              AI-powered platform for exceptional customer experiences.
            </p>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Proactively manage customer health, automate workflows, and drive growth with intelligent insights and
              automation.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="btn-theme-primary px-8 py-3 rounded-lg text-base" asChild>
                <a href={`${APP_URL}/start`}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="btn-theme-outline px-8 py-3 rounded-lg text-base bg-transparent"
                asChild
              >
                <a href={`${APP_URL}/auth/login`}>Sign In</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border py-24 sm:py-32 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-theme-primary sm:text-4xl">
                Everything you need for CS excellence
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-theme-primary-50">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-4 font-semibold text-theme-primary">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-theme-primary sm:text-4xl">Drive Results</h2>
            <div className="mt-12 space-y-4">
              {benefits.map((item) => (
                <div key={item} className="flex items-center justify-center gap-3">
                  <Check className="h-5 w-5 text-accent shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="gradient-theme-hero py-24 sm:py-32 border-t border-border">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-theme-primary sm:text-4xl">
              Ready to transform Customer Success?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">Start free. No credit card required.</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="btn-theme-primary px-8 py-3 rounded-lg" asChild>
                <a href={`${APP_URL}/start`}>
                  Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 IntegrateWise. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
