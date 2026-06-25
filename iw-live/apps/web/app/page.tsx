"use client"

import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-gradient-to-br from-background to-muted text-foreground">
      {/* Skip to content */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-card focus:text-foreground focus:px-3 focus:py-2 focus:rounded-md"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" aria-label="IntegrateWise Home" className="flex items-center gap-2">
          <IntegrateWiseLogo variant="icon" className="h-8 w-8" />
          <span className="font-semibold tracking-tight text-lg">IntegrateWise</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Pricing
          </Link>
          <Link
            href="/integrations"
            className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Integrations
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Button asChild>
            <Link href="/signup" aria-label="Get Started">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">IntegrateWise OS</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Normalize your messy work once. Get tasks, clarity, and outputs anywhere—without setup friction.
        </p>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
          No API keys required. Start with a 60-second value moment, then add data when you're ready.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Entry cards */}
      <section id="content" className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 grid sm:grid-cols-2 gap-6">
        {/* Customer Success */}
        <Card className="border shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">Customer Success</h2>
            <p className="mt-2 text-muted-foreground">
              Reduce churn risk, systemize renewals, and generate QBR-ready outputs from your customer context.
            </p>

            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                A working CS workspace lens (accounts → timeline → actions)
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                Account tasks automatically extracted from notes/conversations
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                AI Insights: churn signals + next-best actions (with provenance)
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                Ready path to templates (QBR pack / renewal plan)
              </li>
            </ul>

            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Best first input (pick one):</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Connect: CRM / Support / Slack · Upload: account CSV + call notes · Paste: links to docs/notes
              </div>
            </div>

            <div className="mt-6">
              <Button asChild>
                <Link href="/signup?lens=cs" aria-label="Start as Customer Success">
                  Start as Customer Success
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal OS */}
        <Card className="border shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">Personal OS</h2>
            <p className="mt-2 text-muted-foreground">
              Turn scattered work into a clean task system and a personal operating layer—fast.
            </p>

            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                Clean personal workspace lens (My Work → Tasks → Brainstorming)
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                Tasks extracted from your dump/memory with priority suggestions
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                Weekly AI Insights and planning suggestions
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                Guided path to templates (planning, reviews, operating cadence)
              </li>
            </ul>

            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Best first input (pick one):</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Capture: browser memory · Upload: docs/CSV/screenshots · Connect: Slack / Gmail / Notion
              </div>
            </div>

            <div className="mt-6">
              <Button asChild>
                <Link href="/signup?lens=personal" aria-label="Start as Personal OS">
                  Start as Personal OS
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* What happens next */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16">
        <h3 className="text-lg font-semibold">What happens next</h3>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Step 1 — Sign in:</span> Google, Microsoft, or email login.
          </li>
          <li>
            <span className="font-medium text-foreground">Step 2 — Quick setup (60 seconds):</span> Enter your details → get your operating-style insight and safe defaults.
          </li>
          <li>
            <span className="font-medium text-foreground">Step 3 — Add one input:</span> Connect an approved tool or drop a small data dump.
          </li>
          <li>
            <span className="font-medium text-foreground">Step 4 — AI Loader:</span> We extract the "creamy layer" and normalize it into your workspace.
          </li>
          <li>
            <span className="font-medium text-foreground">Step 5 — Land in your workspace:</span> AI Loader · Tasks · Brainstorming · AI Insights · Settings.
          </li>
        </ol>

        <div className="mt-6 text-xs text-muted-foreground">
          Data handling: We only render/export to approved destinations (allowlisted tools). No arbitrary BYOT destinations. No keys required: Hosted AI works out of the box.
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <IntegrateWiseLogo variant="icon" className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">© 2024 IntegrateWise. All rights reserved.</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/integrations" className="hover:text-foreground transition-colors">Integrations</Link>
            <Link href="/support/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
