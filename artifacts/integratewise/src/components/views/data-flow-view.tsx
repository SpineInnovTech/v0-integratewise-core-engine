import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Mail,
  GitBranch,
  Wand2,
  ShieldCheck,
  SearchCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
  Play,
  Database,
} from "lucide-react"

const IDENTITY = { industry: "SAAS_TECH", department: "CUSTOMER_SUCCESS" }

interface ResolvedConfig {
  base_version: string
  industry: { input: string; canonical: string }
  department: string
  entity_types: string[]
  priority_fields: Record<string, string[]>
}

interface AddedField {
  type: string
  description: string
}

interface DeltaRow {
  entityType: string
  schemaVersion: string
  baseVersion: string
  harmonizationGroup: string
  lifecycleState: string
  confidenceScore: number
  canonicalMapping: Record<string, string>
  schemaBody: {
    role?: string
    literals?: Record<string, unknown>
    added_fields?: Record<string, AddedField>
    person_entity_type?: string
    description?: string
  }
}

interface CanonicalRecord {
  entity_type: string
  priority_fields: Record<string, unknown>
  schema_version: string
  external_id: string
  source: { connector: string; source_id: string }
}

interface HydrationItem {
  entity_type: string
  external_id: string
  status: string
  proposal_id: string | null
  detail: string
}

interface VerificationItem {
  entity_type: string
  external_id: string
  state: string
  detail: string
  spine_hit: boolean
}

interface IngestRun {
  mode: string
  fetched: number
  would_hydrate?: number
  normalized: {
    applied_deltas: { role: string; entity_type: string; schema_version: string }[]
    people: CanonicalRecord[]
    interactions: CanonicalRecord[]
    skipped: { role: string; reason: string }[]
  }
  hydration?: {
    total: number
    proposed: number
    already: number
    approved: number
    errors: number
    items: HydrationItem[]
  }
  verification?: {
    spine_reachable: boolean
    materialized: number
    pending: number
    not_proposed: number
    items: VerificationItem[]
  }
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return (await res.json()) as T
}

type StageState = "idle" | "active" | "done" | "error"

const STAGES = [
  { id: "connector", name: "Connector", icon: Mail, sub: "Gmail inbox" },
  { id: "delta", name: "Schema Delta", icon: GitBranch, sub: "additive · versioned" },
  { id: "normalize", name: "Normalize", icon: Wand2, sub: "→ canonical" },
  { id: "govern", name: "Govern", icon: ShieldCheck, sub: "memory.propose (HITL)" },
  { id: "verify", name: "Verify", icon: SearchCheck, sub: "read-back" },
] as const

function fieldEntries(rec: CanonicalRecord, keys: string[]): string {
  for (const k of keys) {
    const v = rec.priority_fields[k]
    if (v !== undefined && v !== null && v !== "") return String(v)
  }
  return "—"
}

export function DataFlowView() {
  const [config, setConfig] = useState<ResolvedConfig | null>(null)
  const [deltas, setDeltas] = useState<DeltaRow[]>([])
  const [run, setRun] = useState<IngestRun | null>(null)
  const [running, setRunning] = useState<false | "dry" | "governed">(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSchema() {
    try {
      const [cfg, dl] = await Promise.all([
        fetchJSON<ResolvedConfig>(
          `/api/schema/config?industry=${IDENTITY.industry}&department=${IDENTITY.department}`,
        ),
        fetchJSON<{ deltas: DeltaRow[] }>(`/api/schema/deltas?connector=gmail`),
      ])
      setConfig(cfg)
      setDeltas(dl.deltas)
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load schema")
    }
  }

  useEffect(() => {
    void loadSchema()
  }, [])

  async function runPipeline(mode: "dry" | "governed") {
    setRunning(mode)
    setError(null)
    try {
      const dryRun = mode === "dry"
      const limit = dryRun ? 8 : 2
      const result = await fetchJSON<IngestRun>(
        `/api/ingest/gmail?limit=${limit}&dryRun=${dryRun}`,
        { method: "POST" },
      )
      setRun(result)
      await loadSchema()
    } catch (e) {
      setError(e instanceof Error ? e.message : "pipeline run failed")
    } finally {
      setRunning(false)
    }
  }

  const stageState: Record<string, StageState> = {
    connector: run ? "done" : "idle",
    delta: deltas.length ? "done" : "idle",
    normalize: run ? "done" : "idle",
    govern: run?.hydration
      ? run.hydration.errors > 0 && run.hydration.proposed === 0 && run.hydration.approved === 0
        ? "error"
        : "done"
      : "idle",
    verify: run?.verification
      ? run.verification.materialized > 0
        ? "done"
        : "error"
      : "idle",
  }

  const personDelta = deltas.find((d) => d.schemaBody?.role === "person")
  const interactionDelta = deltas.find((d) => d.schemaBody?.role === "interaction")

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schema-First Ingestion</h1>
          <p className="text-muted-foreground mt-1">
            Live pipeline — Gmail harmonized to the canonical Spine schema, then governed
            into platform truth. Nothing here is mocked.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => runPipeline("dry")} disabled={running !== false}>
            {running === "dry" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run dry-run
          </Button>
          <Button
            variant="outline"
            onClick={() => runPipeline("governed")}
            disabled={running !== false}
          >
            {running === "governed" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Attempt governed write
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Pipeline strip */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {STAGES.map((stage, i) => {
              const st = stageState[stage.id]
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div
                    className={`flex flex-col items-center rounded-lg border p-4 min-w-[130px] transition-colors ${
                      st === "done"
                        ? "border-green-500/50 bg-green-500/10"
                        : st === "error"
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-border"
                    }`}
                  >
                    <stage.icon
                      className={`w-6 h-6 mb-2 ${
                        st === "done"
                          ? "text-green-600"
                          : st === "error"
                            ? "text-amber-600"
                            : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-medium">{stage.name}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 text-center">
                      {stage.sub}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground hidden lg:block" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage 1 — Canonical base */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Canonical Base</h2>
          <Badge variant="outline">Spine Schema = f(industry, department)</Badge>
        </div>
        <Card>
          <CardContent className="p-5">
            {config ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Identity" value={`${config.industry.canonical} × ${config.department}`} />
                <Stat label="Base version" value={config.base_version} />
                <Stat label="Canonical entity types" value={String(config.entity_types.length)} />
                <Stat
                  label="Harmonization targets"
                  value={`${personDelta?.entityType ?? "contact"} · ${interactionDelta?.entityType ?? "engagement"}`}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading canonical config…</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Stage 2 — Active deltas */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Active Schema Deltas</h2>
          <Badge variant="outline">additive-only · on base {config?.base_version ?? "1.0.0"}</Badge>
        </div>
        {deltas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active Gmail deltas yet — run the pipeline to generate them.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {deltas.map((d) => (
              <Card key={d.entityType}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      {d.entityType}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">{d.schemaBody?.role}</Badge>
                      <Badge>v{d.schemaVersion}</Badge>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Canonical mapping (Gmail → canonical)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(d.canonicalMapping).map(([from, to]) => (
                        <code
                          key={from}
                          className="text-[11px] rounded bg-muted px-1.5 py-0.5"
                        >
                          {from}→{to}
                        </code>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Additive fields (new, never modify base)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(d.schemaBody?.added_fields ?? {}).map(([name, f]) => (
                        <Badge key={name} variant="outline" className="font-normal">
                          {name}
                          <span className="ml-1 text-muted-foreground">:{f.type}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Stage 3 — Normalized records */}
      {run && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Normalized Canonical Records</h2>
            <Badge variant="outline">{run.mode}</Badge>
            <span className="text-sm text-muted-foreground">
              {run.fetched} emails → {run.normalized.people.length} people ·{" "}
              {run.normalized.interactions.length} interactions
            </span>
          </div>

          <RecordTable
            title={`People (${personDelta?.entityType ?? "contact"})`}
            records={run.normalized.people}
            columns={[
              { head: "Name", keys: ["full_name", "name"] },
              { head: "Email", keys: ["email"] },
              { head: "Last contacted", keys: ["last_contacted"] },
            ]}
          />
          <RecordTable
            title={`Interactions (${interactionDelta?.entityType ?? "engagement"})`}
            records={run.normalized.interactions}
            columns={[
              { head: "Subject", keys: ["subject"] },
              { head: "Occurred", keys: ["occurred_at"] },
              { head: "Linked contact", keys: ["contact_external_id"] },
            ]}
          />
        </section>
      )}

      {/* Stage 4/5 — Governance + verification */}
      {run && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Governance &amp; Verification</h2>
          </div>

          {run.mode === "dry_run" ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
                <span>
                  Dry run — <strong>{run.would_hydrate ?? 0}</strong> records are ready to
                  propose to Spine via the governed path (<code>memory.propose</code> →{" "}
                  <code>proposal.approve</code>). No writes were performed. Use{" "}
                  <em>Attempt governed write</em> to exercise the live platform path.
                </span>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {run.hydration && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Hydration (governed propose)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">proposed {run.hydration.proposed}</Badge>
                      <Badge variant="secondary">approved {run.hydration.approved}</Badge>
                      <Badge variant="secondary">already {run.hydration.already}</Badge>
                      {run.hydration.errors > 0 && (
                        <Badge variant="destructive">errors {run.hydration.errors}</Badge>
                      )}
                    </div>
                    {run.hydration.items.slice(0, 4).map((it, idx) => (
                      <div key={idx} className="text-xs border-l-2 border-border pl-2">
                        <span className="font-medium">{it.entity_type}</span> —{" "}
                        <span
                          className={
                            it.status === "error" ? "text-destructive" : "text-green-600"
                          }
                        >
                          {it.status}
                        </span>
                        <p className="text-muted-foreground break-words">{it.detail}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {run.verification && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Verification (read-back)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">
                        materialized {run.verification.materialized}
                      </Badge>
                      <Badge variant="secondary">pending {run.verification.pending}</Badge>
                      <Badge variant="secondary">
                        not proposed {run.verification.not_proposed}
                      </Badge>
                    </div>
                    {run.verification.items.slice(0, 4).map((it, idx) => (
                      <div key={idx} className="text-xs border-l-2 border-border pl-2">
                        <span className="font-medium">{it.entity_type}</span> —{" "}
                        <span className="text-muted-foreground">{it.state}</span>
                        <p className="text-muted-foreground break-words">{it.detail}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5 break-words">{value}</p>
    </div>
  )
}

function RecordTable({
  title,
  records,
  columns,
}: {
  title: string
  records: CanonicalRecord[]
  columns: { head: string; keys: string[] }[]
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {title}
          <Badge variant="outline">{records.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c.head}>{c.head}</TableHead>
                  ))}
                  <TableHead>external_id</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 8).map((rec) => (
                  <TableRow key={rec.external_id}>
                    {columns.map((c) => (
                      <TableCell key={c.head} className="text-sm">
                        {fieldEntries(rec, c.keys)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <code className="text-[11px] text-muted-foreground">
                        {rec.external_id}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
