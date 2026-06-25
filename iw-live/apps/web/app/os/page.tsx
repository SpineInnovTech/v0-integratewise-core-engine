"use client"

import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Page() {
  return (
    <main
      data-theme="os"
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
          <span className="font-semibold tracking-tight">IntegrateWise</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="https://integratewise.online/docs"
            className="text-[var(--semantic-text-muted)] hover:text-[var(--semantic-text-primary)]"
          >
            Docs
          </Link>
          <Link href="/signin" className="text-[var(--semantic-text-muted)] hover:text-[var(--semantic-text-primary)]">
            Sign in
          </Link>
          <Button asChild className="bg-[var(--semantic-primary)] hover:opacity-90 text-[var(--semantic-text-inverse)]">
            <Link href="/signup" aria-label="Get Started">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <h1 className="text-3xl sm:text-4xl font-bold">IntegrateWise OS</h1>
        <p className="mt-3 text-[var(--semantic-text-muted)] max-w-2xl">
          Normalize your messy work once. Get tasks, clarity, and outputs anywhere—without setup friction.
        </p>
        <p className="mt-2 text-sm text-[var(--semantic-text-muted)]">
          No API keys required. Start with a 60-second value moment, then add data when you're ready.
        </p>
        <p className="mt-1 text-xs text-[var(--semantic-text-muted)]">
          Works from data dumps, browser memory, and approved tool connections.
        </p>
      </section>

      {/* Entry cards */}
      <section id="content" className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 grid sm:grid-cols-2 gap-6">
        {/* Customer Success */}
        <Card className="bg-[var(--semantic-surface-muted)] border-0 shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">Customer Success</h2>
            <p className="mt-2 text-[var(--semantic-text-muted)]">
              Reduce churn risk, systemize renewals, and generate QBR-ready outputs from your customer context.
            </p>

            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" />A working CS workspace lens (accounts
                → timeline → actions)
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" />
                Account tasks automatically extracted from notes/conversations
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" />
                AI Insights: churn signals + next-best actions (with provenance)
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" />
                Ready path to templates (QBR pack / renewal plan)
              </li>
            </ul>

            <div className="mt-4">
              <p className="text-xs text-[var(--semantic-text-muted)]">Best first input (pick one):</p>
              <div className="mt-2 text-xs text-[var(--semantic-text-muted)]">
                Connect: CRM / Support / Slack · Upload: account CSV + call notes · Paste: links to docs/notes
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button asChild className="bg-[var(--semantic-primary)] text-[var(--semantic-text-inverse)]">
                <Link href="/start/cs" aria-label="Start as Customer Success">
                  Start as Customer Success
                </Link>
              </Button>
              <span className="text-xs text-[var(--semantic-text-muted)]">
                Sets your default lens to CS. You can switch later.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Personal OS */}
        <Card className="bg-[var(--semantic-surface-muted)] border-0 shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">Personal OS</h2>
            <p className="mt-2 text-[var(--semantic-text-muted)]">
              Turn scattered work into a clean task system and a personal operating layer—fast.
            </p>

            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" />
                Clean personal workspace lens (My Work → Tasks → Brainstorming)
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" />
                Tasks extracted from your dump/memory with priority suggestions
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" />
                Weekly AI Insights and planning suggestions
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[var(--semantic-success)]" />
                Guided path to templates (planning, reviews, operating cadence)
              </li>
            </ul>

            <div className="mt-4">
              <p className="text-xs text-[var(--semantic-text-muted)]">Best first input (pick one):</p>
              <div className="mt-2 text-xs text-[var(--semantic-text-muted)]">
                Capture: browser memory · Upload: docs/CSV/screenshots · Connect: Slack / Gmail / Notion
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button asChild className="bg-[var(--semantic-primary)] text-[var(--semantic-text-inverse)]">
                <Link href="/start/os" aria-label="Start as Personal OS">
                  Start as Personal OS
                </Link>
              </Button>
              <span className="text-xs text-[var(--semantic-text-muted)]">
                Sets your default lens to OS. You can switch later.
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* What happens next */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16">
        <h3 className="text-lg font-semibold">What happens next</h3>
        <ol className="mt-3 space-y-2 text-sm text-[var(--semantic-text-muted)]">
          <li>
            <span className="font-medium text-[var(--semantic-text-primary)]">Step 1 — Sign in:</span> Google or email
            login.
          </li>
          <li>
            <span className="font-medium text-[var(--semantic-text-primary)]">Step 2 — Bliss moment (60 seconds):</span>{" "}
            Enter Name + Date of Birth → get your operating-style insight and safe defaults.
          </li>
          <li>
            <span className="font-medium text-[var(--semantic-text-primary)]">Step 3 — Add one input:</span> Connect an
            approved tool or drop a small data dump.
          </li>
          <li>
            <span className="font-medium text-[var(--semantic-text-primary)]">Step 4 — AI Loader:</span> We extract the
            "creamy layer" and normalize it into your workspace.
          </li>
          <li>
            <span className="font-medium text-[var(--semantic-text-primary)]">
              Step 5 — Land in the 5-page habitat:
            </span>{" "}
            AI Loader · Tasks · Brainstorming · AI Insights · Settings.
          </li>
        </ol>

        <div className="mt-6 text-xs text-[var(--semantic-text-muted)]">
          Data handling: We only render/export to approved destinations (allowlisted tools). No arbitrary BYOT
          destinations. No keys required: Hosted AI works out of the box; BYOM is later for paid plans. Templates: BYOT
          applies to templates (gallery or authorized URL). Outputs are governed and logged.
        </div>
      </section>
    </main>
  )
}
