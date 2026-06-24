import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useGetContextPacket,
  getGetContextPacketQueryKey,
  useRememberContext,
  RememberInputKind,
  type GetContextPacketParams,
  type ContextAvailability,
  type ContextFragment,
  type ContextStoreStatus,
} from "@workspace/api-client-react"
import { useLeads } from "@/platform/gateway-leads"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Brain,
  Search,
  Database,
  Network,
  Target,
  Gauge,
  Sparkles,
  FileText,
  MessageSquare,
  Lightbulb,
  Radio,
  Star,
  Check,
  AlertCircle,
  Layers,
  ArrowRight,
} from "lucide-react"

/* ── Store vocabulary ──────────────────────────────────────────────────────
 * The six stores that compose a packet. The whole "moat" story is here: a
 * single contextual memory that DEEPENS as each store starts contributing.   */
type StoreKey = keyof ContextAvailability

const STORE_META: Record<
  StoreKey,
  { label: string; icon: typeof Database; blurb: string }
> = {
  structured: { label: "Records", icon: Database, blurb: "Live CRM facts" },
  memory: { label: "Memory", icon: Brain, blurb: "Remembered atoms" },
  goals: { label: "Goals", icon: Target, blurb: "Intent anchors" },
  metrics: { label: "Metrics", icon: Gauge, blurb: "Measured outcomes" },
  spine: { label: "Spine", icon: Network, blurb: "Platform tools" },
  embedding: { label: "Semantic", icon: Sparkles, blurb: "Vector recall" },
}

const STORE_ORDER: StoreKey[] = [
  "structured",
  "memory",
  "goals",
  "metrics",
  "spine",
  "embedding",
]

const STATUS_STYLE: Record<
  ContextStoreStatus,
  { label: string; dot: string; text: string; ring: string }
> = {
  live: {
    label: "Live",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    ring: "border-emerald-500/30 bg-emerald-500/5",
  },
  empty: {
    label: "Empty",
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    ring: "border-border bg-muted/20",
  },
  unavailable: {
    label: "Off",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    ring: "border-amber-500/30 bg-amber-500/5",
  },
}

const KIND_META: Record<string, { label: string; icon: typeof FileText }> = {
  fact: { label: "Fact", icon: FileText },
  interaction: { label: "Interaction", icon: MessageSquare },
  decision: { label: "Decision", icon: Check },
  signal: { label: "Signal", icon: Radio },
  preference: { label: "Preference", icon: Star },
}

function fragmentIcon(f: ContextFragment) {
  if (f.origin === "memory") return KIND_META[f.kind]?.icon ?? Lightbulb
  return Database
}

function formatWhen(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

const emptyDraft = { kind: "interaction" as keyof typeof RememberInputKind, title: "", body: "" }

export function ContextualMemoryView() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: leads, state: leadsState } = useLeads()

  const [subjectId, setSubjectId] = useState("")
  const [askInput, setAskInput] = useState("")
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState(emptyDraft)

  // Default the subject to the first lead once they load.
  useEffect(() => {
    if (!subjectId && leads && leads.length > 0) setSubjectId(leads[0].id)
  }, [leads, subjectId])

  const params: GetContextPacketParams = useMemo(
    () => ({
      subjectType: "lead",
      subjectId,
      ...(query ? { query } : {}),
    }),
    [subjectId, query],
  )

  const packetQuery = useGetContextPacket(params, {
    query: {
      enabled: Boolean(subjectId),
      queryKey: getGetContextPacketQueryKey(params),
    },
  })
  const packet = packetQuery.data

  const remember = useRememberContext()

  const invalidatePacket = () =>
    queryClient.invalidateQueries({
      queryKey: getGetContextPacketQueryKey(),
    })

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(askInput.trim())
  }

  const handleRemember = () => {
    if (!subjectId) return
    if (!draft.title.trim() || !draft.body.trim()) {
      toast({ title: "Title and body are required", variant: "destructive" })
      return
    }
    remember.mutate(
      {
        data: {
          subjectRef: { entity_type: "lead", entity_id: subjectId },
          kind: draft.kind,
          title: draft.title.trim(),
          body: draft.body.trim(),
          source: { connector: "manual" },
        },
      },
      {
        onSuccess: (res) => {
          invalidatePacket()
          setDraft(emptyDraft)
          toast({
            title: res.created
              ? "Remembered — memory deepened"
              : "Already known (idempotent)",
            description: res.atom.title,
          })
        },
        onError: () =>
          toast({ title: "Could not write memory", variant: "destructive" }),
      },
    )
  }

  const depthPct = packet ? Math.round(packet.coverage.depthScore * 100) : 0
  const subjectLabel = packet?.subject.label ?? "—"

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/50 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              Contextual Memory
            </h1>
          </div>
          <p className="mt-2 max-w-2xl font-medium text-muted-foreground">
            One memory of every subject — assembled live from records, remembered
            atoms, goals, metrics, and the platform Spine. It compounds as you
            connect more tools.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <Label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Subject
          </Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="bg-muted/30">
              <SelectValue
                placeholder={
                  leadsState === "loading" ? "Loading…" : "Select a lead"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {leads?.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.firstName} {l.lastName}
                  {l.company ? ` · ${l.company}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!subjectId ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center text-muted-foreground">
          <Layers className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-base font-semibold">Pick a subject to assemble its context</p>
          <p className="mt-1 text-sm">
            Leads are the live vertical slice — choose one above.
          </p>
        </div>
      ) : packetQuery.isError ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-4 text-destructive">
          <AlertCircle className="mb-3 h-8 w-8" />
          <span className="text-base font-semibold">Could not assemble context</span>
          <span className="mt-1 text-sm text-destructive/80">
            The relay did not return a packet for this subject.
          </span>
        </div>
      ) : !packet ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Coverage / depth — the compounding meter */}
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
                {/* Depth ring */}
                <div className="flex items-center gap-5 lg:flex-col lg:items-start lg:justify-center">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Context depth
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-5xl font-light text-foreground">
                        {depthPct}
                        <span className="text-2xl text-muted-foreground">%</span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {packet.coverage.contributingStores} of{" "}
                      {packet.coverage.totalStores} stores contributing for{" "}
                      <span className="text-foreground">{subjectLabel}</span>
                    </p>
                  </div>
                  <div className="hidden h-2 w-full overflow-hidden rounded-full bg-muted lg:block">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${depthPct}%` }}
                    />
                  </div>
                </div>

                {/* Store chips */}
                <div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {STORE_ORDER.map((key) => {
                      const status = packet.availability[key]
                      const style = STATUS_STYLE[status]
                      const meta = STORE_META[key]
                      const Icon = meta.icon
                      const count = packet.coverage.stores[key]
                      return (
                        <div
                          key={key}
                          className={cn(
                            "rounded-xl border p-3 transition-colors",
                            style.ring,
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <Icon className={cn("h-4 w-4", style.text)} />
                            <span className="flex items-center gap-1.5">
                              <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                              <span className={cn("text-[10px] font-bold uppercase tracking-wide", style.text)}>
                                {style.label}
                              </span>
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {meta.label}
                            {typeof count === "number" && count > 0 && (
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                {count}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{meta.blurb}</p>
                        </div>
                      )
                    })}
                  </div>

                  {packet.coverage.gaps.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {packet.coverage.gaps.map((g) => (
                        <div
                          key={g.store}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                          <span>{g.hint}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left — timeline + ask */}
            <div className="space-y-6 lg:col-span-2">
              {/* Semantic ask */}
              <form onSubmit={handleAsk} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={askInput}
                    onChange={(e) => setAskInput(e.target.value)}
                    placeholder="Ask this memory — e.g. pricing, timeline, next step…"
                    className="bg-muted/30 pl-10"
                  />
                </div>
                <Button type="submit" variant="secondary" className="rounded-lg">
                  Ask
                </Button>
                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-lg"
                    onClick={() => {
                      setQuery("")
                      setAskInput("")
                    }}
                  >
                    Clear
                  </Button>
                )}
              </form>
              {packet.availability.embedding === "unavailable" && query && (
                <p className="-mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ranking by lexical + salience + recency — semantic embeddings are
                  off.
                </p>
              )}

              {/* Fragment timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Context timeline
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {packet.fragments.length} fragment
                    {packet.fragments.length === 1 ? "" : "s"}
                  </span>
                </div>

                {packet.fragments.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      No fragments yet. Add a memory on the right and watch the
                      depth meter rise.
                    </CardContent>
                  </Card>
                ) : (
                  packet.fragments.map((f) => {
                    const Icon = fragmentIcon(f)
                    const isMemory = f.origin === "memory"
                    const connector =
                      typeof f.source?.connector === "string"
                        ? (f.source.connector as string)
                        : null
                    return (
                      <Card key={f.id} className="border shadow-sm transition-all hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                isMemory ? "bg-primary/10" : "bg-secondary",
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-4 w-4",
                                  isMemory ? "text-primary" : "text-foreground/70",
                                )}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-foreground">
                                  {f.title}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-sm px-1.5 py-0 text-[10px] font-bold uppercase tracking-wide",
                                    isMemory
                                      ? "border-primary/30 text-primary"
                                      : "border-border text-muted-foreground",
                                  )}
                                >
                                  {isMemory ? "Memory" : "Record"} · {f.kind}
                                </Badge>
                                {connector && (
                                  <Badge
                                    variant="outline"
                                    className="rounded-sm border-border px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
                                  >
                                    {connector}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                {f.body}
                              </p>
                              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                                {f.occurredAt && <span>{formatWhen(f.occurredAt)}</span>}
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">salience</span>
                                  <span className="inline-block h-1 w-12 overflow-hidden rounded-full bg-muted align-middle">
                                    <span
                                      className="block h-full rounded-full bg-primary/60"
                                      style={{
                                        width: `${Math.round(
                                          Math.max(0, Math.min(1, f.salience)) * 100,
                                        )}%`,
                                      }}
                                    />
                                  </span>
                                </span>
                                {typeof f.score === "number" && (
                                  <span>match {f.score.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right — goals/metrics + remember composer */}
            <div className="space-y-6">
              {/* Goals & metrics — the enforced anchor */}
              <Card className="border shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Goals &amp; Metrics
                    </h2>
                  </div>

                  {packet.goals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No goals yet. Goals are the intent every metric ladders up
                      to.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {packet.goals.map((g) => {
                        const metrics = packet.metrics.filter(
                          (m) => m.goal?.id === g.id,
                        )
                        return (
                          <div
                            key={g.id}
                            className="rounded-xl border border-border/70 bg-muted/20 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-foreground">{g.name}</p>
                              <Badge
                                variant="outline"
                                className="rounded-sm px-1.5 py-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                              >
                                {g.domain}
                              </Badge>
                            </div>
                            {metrics.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {metrics.map((m) => {
                                  const ok = m.status === "ok"
                                  return (
                                    <div
                                      key={m.id}
                                      className="flex items-center justify-between gap-2 text-xs"
                                    >
                                      <span className="text-muted-foreground">
                                        {m.name}
                                      </span>
                                      <span
                                        className={cn(
                                          "flex items-center gap-1 font-semibold",
                                          ok
                                            ? "text-emerald-600"
                                            : "text-amber-600",
                                        )}
                                        title={m.statusReason}
                                      >
                                        {ok ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <AlertCircle className="h-3 w-3" />
                                        )}
                                        {ok ? "OK" : "Insufficient data"}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Remember composer — the doorway memory grows through */}
              <Card className="border shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Remember
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Write a fact about {subjectLabel}. Re-writing the same fact
                    matches idempotently — memory compounds without duplicating.
                  </p>

                  <div className="space-y-2">
                    <Select
                      value={draft.kind}
                      onValueChange={(v) =>
                        setDraft({ ...draft, kind: v as keyof typeof RememberInputKind })
                      }
                    >
                      <SelectTrigger className="bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(RememberInputKind).map((k) => (
                          <SelectItem key={k} value={k}>
                            {KIND_META[k]?.label ?? k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="Title — e.g. Intro call"
                      className="bg-muted/30"
                    />
                    <Textarea
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      placeholder="What happened, what they want, what was decided…"
                      rows={3}
                      className="resize-none bg-muted/30"
                    />
                    <Button
                      onClick={handleRemember}
                      disabled={remember.isPending}
                      className="w-full rounded-lg"
                    >
                      {remember.isPending ? "Remembering…" : "Remember"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
