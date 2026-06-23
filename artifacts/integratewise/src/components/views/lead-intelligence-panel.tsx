import { useGetLeadIntelligence, getGetLeadIntelligenceQueryKey } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Target,
  Gauge,
  CheckCircle2,
  Lightbulb,
  HelpCircle,
  PlugZap,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

const QUESTION_LABEL: Record<string, string> = {
  why_qualified: "Why qualified?",
  why_first_fit: "Why a first-fit?",
  problem: "What problem do they face?",
  current_solution: "How do they solve it now?",
  in_our_track: "Are they in our track?",
  recommended_action: "Recommended action",
}

const VERDICT_STYLE: Record<string, { label: string; className: string }> = {
  approach: { label: "Approach", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  hold: { label: "Hold", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  pass: { label: "Pass", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground border-border" },
}

const NON_READY_COPY: Record<string, { title: string; tail: string }> = {
  gateway_unavailable: {
    title: "Live intelligence not connected",
    tail: "Customer Zero reads ICP, policy and company facts live through the platform — it never stores or guesses them, so no verdict is shown until the gateway is connected.",
  },
  error: {
    title: "Intelligence gateway error",
    tail: "The platform gateway returned an unexpected result. No verdict is shown rather than risk a wrong call — try refreshing.",
  },
  insufficient_context: {
    title: "Not enough context yet",
    tail: "There isn't enough on this lead to read it live. Enrich the record, then refresh.",
  },
}

const BASIS_STYLE = {
  evidence: { label: "Evidence", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", Icon: CheckCircle2 },
  inference: { label: "Inference", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", Icon: Lightbulb },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground border-border", Icon: HelpCircle },
} as const

function BasisChip({ basis }: { basis: "evidence" | "inference" | "unknown" }) {
  const { label, className, Icon } = BASIS_STYLE[basis]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${className}`}>
      <Icon className="h-2.5 w-2.5" /> {label}
    </span>
  )
}

function Citations({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
      {items.map((c, i) =>
        /^https?:\/\//.test(c) ? (
          <a key={i} href={c} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline">
            <ExternalLink className="h-2.5 w-2.5" /> source
          </a>
        ) : (
          <span key={i} className="text-[10px] text-muted-foreground">— {c}</span>
        ),
      )}
    </div>
  )
}

function formatStamp(value?: string | null) {
  if (!value) return null
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// Doctrine: intelligence is read LIVE at lead-open time and never stored. So we
// keep no client cache — every mount fetches fresh, and the result is dropped on
// unmount (gcTime 0) so a reopened lead can never flash a stale prior verdict.
export function LeadIntelligencePanel({ leadId }: { leadId: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useGetLeadIntelligence(leadId, {
    query: {
      queryKey: getGetLeadIntelligenceQueryKey(leadId),
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: "always",
    },
  })

  if (isLoading) {
    return (
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Lead Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Lead Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Could not load intelligence for this lead.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const verdict = VERDICT_STYLE[data.verdict] ?? VERDICT_STYLE.unknown
  const ready = data.status === "ready"
  const nonReadyCopy = ready ? null : NON_READY_COPY[data.status] ?? NON_READY_COPY.gateway_unavailable

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Lead Intelligence
          <Badge variant="secondary" className="ml-auto text-[10px] font-normal">Obtain It</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verdict + fit — the decision, first */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold ${verdict.className}`}>
            {verdict.label}
          </span>
          {data.fitScore != null && (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Gauge className="h-3.5 w-3.5" /> Fit {data.fitScore}/100
            </span>
          )}
        </div>

        {data.summary && <p className="text-sm text-foreground">{data.summary}</p>}

        {/* Honest non-ready state — no verdict is invented; the reason is named */}
        {nonReadyCopy && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <PlugZap className="h-3.5 w-3.5" /> {nonReadyCopy.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.gateway.message ? `${data.gateway.message} ` : ""}{nonReadyCopy.tail}
            </p>
          </div>
        )}

        {/* The six questions, each tagged evidence / inference / unknown */}
        <div className="space-y-2.5">
          {data.answers.map((a) => (
            <div key={a.question} className="rounded-lg border border-border p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-foreground">{QUESTION_LABEL[a.question] ?? a.question}</p>
                <BasisChip basis={a.basis} />
              </div>
              <p className={`mt-1 text-xs ${a.basis === "unknown" ? "italic text-muted-foreground" : "text-foreground"}`}>
                {a.answer}
              </p>
              {a.basis === "unknown" && a.unknownReason && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">{a.unknownReason}</p>
              )}
              <Citations items={a.citations} />
            </div>
          ))}
        </div>

        {/* Supporting signals */}
        {data.signals.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Signals</p>
            {data.signals.map((s) => (
              <div key={s.id} className="flex items-start gap-2 text-xs">
                <span
                  className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                    s.hit === true ? "bg-emerald-500" : s.hit === false ? "bg-rose-500" : "bg-muted-foreground/40"
                  }`}
                />
                <div className="min-w-0">
                  <span className="text-foreground">{s.label}: </span>
                  <span className="text-muted-foreground">{s.text}</span>{" "}
                  <span className="align-middle"><BasisChip basis={s.basis} /></span>
                  <Citations items={s.citations} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sources + freshness — read live, stamped, nothing stored */}
        <div className="border-t border-border pt-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sources</p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${isFetching ? "animate-spin" : ""}`} /> refresh
            </button>
          </div>
          <div className="mt-1.5 space-y-1">
            {data.sources.map((src, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground">
                  {src.name} <span className="text-muted-foreground">· {src.kind.replace(/_/g, " ")}</span>
                </span>
                {src.status === "live" ? (
                  <span className="text-muted-foreground">as of {formatStamp(src.asOf) ?? "—"}</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">unavailable</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Computed {formatStamp(data.computedAt)} · read live, nothing stored
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
