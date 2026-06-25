import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CalendarClock,
  FileText,
  Database,
  Package,
  Receipt,
  Truck,
  BarChart3,
  Workflow,
  Users2,
  Sparkles,
  Download,
  Plus,
  Search,
  Star,
  ArrowUpRight,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { PageHeader, Card } from "./AppShell";
import type { DeptConfig } from "@/lib/spine/departments";
import { DEPT_EXTRAS, type MetricSeries } from "@/lib/spine/workbenchData";
import { buildDeptKnowledge } from "@/lib/spine/knowledge";
import { KnowledgeField } from "./KnowledgeField";
import { cn } from "@/lib/utils";

type TabKey =
  | "overview"
  | "knowledge"
  | "documents"
  | "assets"
  | "vendors"
  | "financials"
  | "reports"
  | "automations"
  | "team";

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "knowledge", label: "Knowledge map", icon: Database },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "assets", label: "Content & Assets", icon: Package },
  { key: "vendors", label: "Vendors", icon: Truck },
  { key: "financials", label: "Financials", icon: Receipt },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "automations", label: "Automations", icon: Workflow },
  { key: "team", label: "Team", icon: Users2 },
];

const fmt$ = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  if (a >= 1_000_000) return `${s}$${(a / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${s}$${(a / 1_000).toFixed(0)}K`;
  return `${s}$${a}`;
};

function Spark({
  points,
  accent = "brand",
}: {
  points: number[];
  accent?: "brand" | "trust" | "critical";
}) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 120,
    h = 32;
  const step = w / (points.length - 1);
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((p - min) / range) * h).toFixed(1)}`
    )
    .join(" ");
  const stroke =
    accent === "trust"
      ? "var(--trust)"
      : accent === "critical"
        ? "var(--critical)"
        : "var(--brand)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "critical" | "neutral" | "brand";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
        tone === "ok" && "bg-trust/15 text-trust",
        tone === "warn" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        tone === "critical" && "bg-critical/15 text-critical",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "brand" && "bg-brand/15 text-brand"
      )}
    >
      {children}
    </span>
  );
}

function statusTone(status: string): "ok" | "warn" | "critical" | "neutral" | "brand" {
  const s = status.toLowerCase();
  if (/(approved|active|live|paid|published|on track|on time|green|done)/.test(s)) return "ok";
  if (
    /(review|renewing|draft|scheduled|in progress|yellow|onboarding|expiring|pending|at risk)/.test(
      s
    )
  )
    return "warn";
  if (/(overdue|breach|critical|red|delayed|off track|paused|archived)/.test(s)) return "critical";
  if (/(beta|shipped|backlog)/.test(s)) return "brand";
  return "neutral";
}

export function DepartmentWorkbench({
  dept,
  compact = false,
}: {
  dept: DeptConfig;
  /** When true, hide the built-in PageHeader (the parent layout owns it). */
  compact?: boolean;
}) {
  const Icon = dept.icon;
  const extras = DEPT_EXTRAS[dept.code];
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <>
      {!compact && (
        <PageHeader
          eyebrow={`Department · ${dept.code.toUpperCase()}`}
          title={
            <span className="inline-flex items-center gap-2.5">
              <span className="inline-flex size-8 items-center justify-center rounded-sm bg-brand/10 text-brand">
                <Icon className="size-4" />
              </span>
              {dept.name}
            </span>
          }
          description={dept.tagline}
          actions={
            <>
              <button className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium hover:bg-cloud">
                <Download className="size-3.5" /> Export
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-sm bg-brand px-2.5 py-1.5 text-[12px] font-medium text-brand-foreground hover:bg-brand/90">
                <Sparkles className="size-3.5" /> Ask Twin
              </button>
            </>
          }
        />
      )}

      {/* Charter strip */}
      <div className="mb-4 grid gap-2 rounded-md border border-border bg-card p-3 md:grid-cols-3">
        {extras.charters.map((c, i) => (
          <div key={i} className="flex items-start gap-2 text-[12.5px]">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-semibold text-brand">
              {i + 1}
            </span>
            <span className="text-foreground">{c}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-10 -mx-4 mb-4 border-b border-border bg-background/95 px-4 backdrop-blur md:-mx-8 md:px-8">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.key === tab;
            const TabIcon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition-colors",
                  active
                    ? "border-brand text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <TabIcon className="size-3.5" /> {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === "overview" && <OverviewTab dept={dept} extras={extras} />}
      {tab === "knowledge" && <KnowledgeMapTab dept={dept} />}
      {tab === "documents" && <DocumentsTab extras={extras} />}
      {tab === "assets" && <AssetsTab extras={extras} />}
      {tab === "vendors" && <VendorsTab extras={extras} />}
      {tab === "financials" && <FinancialsTab extras={extras} />}
      {tab === "reports" && <ReportsTab extras={extras} />}
      {tab === "automations" && <AutomationsTab extras={extras} />}
      {tab === "team" && <TeamTab extras={extras} />}
    </>
  );
}

// ---------- Overview ----------
function OverviewTab({
  dept,
  extras,
}: {
  dept: DeptConfig;
  extras: (typeof DEPT_EXTRAS)[keyof typeof DEPT_EXTRAS];
}) {
  const knowledge = buildDeptKnowledge(dept.code);
  return (
    <div className="space-y-4">
      {/* Knowledge fields — every value carries provenance, people, and a Twin reading */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {knowledge.map((k) => (
          <KnowledgeField key={k.id} field={k} emphasis="hero" />
        ))}
      </div>

      {/* Trend charts */}
      <Card title="Trend lines (last 12 weeks)">
        <div className="grid gap-4 md:grid-cols-4">
          {extras.metrics.map((m: MetricSeries) => {
            const last = m.points[m.points.length - 1];
            const first = m.points[0];
            const up = last >= first;
            return (
              <div key={m.label}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {m.label}
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-foreground">
                    {last.toLocaleString()}
                    {m.unit ?? ""}
                  </span>
                </div>
                <Spark points={m.points} accent={up ? "trust" : "critical"} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Initiatives + Twin actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Active initiatives" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {extras.initiatives.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{it.title}</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {it.owner} · due {it.due}
                  </p>
                </div>
                <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-muted sm:block">
                  <div className="h-full bg-brand" style={{ width: `${it.progress}%` }} />
                </div>
                <span className="w-10 text-right text-[12px] tabular-nums text-muted-foreground">
                  {it.progress}%
                </span>
                <Pill tone={statusTone(it.status)}>{it.status}</Pill>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Twin proposals" action={<Sparkles className="size-3.5 text-brand" />}>
          <ul className="space-y-2">
            {extras.twinActions.map((a) => (
              <li
                key={a.id}
                className="rounded-sm border border-brand/20 bg-brand/5 p-2.5 text-[12.5px]"
              >
                <p className="font-semibold text-foreground">{a.title}</p>
                <p className="text-[11.5px] text-muted-foreground">{a.rationale}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-brand">Impact · {a.impact}</span>
                  <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
                    Run <ArrowUpRight className="size-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Signals + Upcoming */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Signals" className="lg:col-span-2">
          {dept.signals.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No active signals. Twin is watching.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {dept.signals.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    "rounded-sm border px-3 py-2 text-[12px]",
                    s.level === "critical"
                      ? "border-critical/30 bg-critical/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0",
                        s.level === "critical" ? "text-critical" : "text-amber-600"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{s.entity}</p>
                      <p className="text-muted-foreground">{s.message}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Upcoming">
          <ul className="space-y-2">
            {dept.upcoming.map((u) => (
              <li key={u.label} className="flex items-start gap-2 text-[13px]">
                <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{u.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {u.when}
                    {u.meta ? ` · ${u.meta}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ---------- Records (existing primary entity) ----------
function RecordsTab({ dept }: { dept: DeptConfig }) {
  return (
    <Card
      title={`${dept.primaryEntity} · ${dept.rows.length}`}
      action={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-sm border border-border bg-cloud px-2 py-1 text-[12px] text-muted-foreground">
            <Search className="size-3" /> Filter
          </div>
          <button className="inline-flex items-center gap-1 rounded-sm bg-brand px-2 py-1 text-[12px] font-medium text-brand-foreground">
            <Plus className="size-3" /> New
          </button>
        </div>
      }
    >
      <div className="-mx-4 -my-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-cloud/60 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {dept.columns.map((c) => (
                <th
                  key={c.key}
                  className={cn("px-4 py-2.5 font-semibold", c.align === "right" && "text-right")}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dept.rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-cloud/40">
                {dept.columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-2.5 text-foreground",
                      c.align === "right" && "text-right tabular-nums"
                    )}
                  >
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------- Knowledge Map — replaces raw records as the primary contextual surface ----------
function KnowledgeMapTab({ dept }: { dept: DeptConfig }) {
  const knowledge = buildDeptKnowledge(dept.code);
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-brand/20 bg-brand/5 p-3 text-[12.5px] text-foreground">
        <p className="font-semibold">Knowledge map · {dept.name}</p>
        <p className="mt-0.5 text-muted-foreground">
          Every field carries its contributors, source systems, accountable people, confidence, and
          the Twin's reading. Click a value to edit; click the sources chip to drill into context.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {knowledge.map((k) => (
          <KnowledgeField key={k.id} field={k} />
        ))}
      </div>
      <details className="rounded-md border border-border bg-card p-3 text-[12.5px]">
        <summary className="cursor-pointer font-semibold text-foreground">
          Raw records · {dept.primaryEntity} ({dept.rows.length}) — secondary view
        </summary>
        <div className="mt-3">
          <RecordsTab dept={dept} />
        </div>
      </details>
    </div>
  );
}

// ---------- Documents ----------
function DocumentsTab({ extras }: { extras: (typeof DEPT_EXTRAS)[keyof typeof DEPT_EXTRAS] }) {
  return (
    <Card
      title={`Documents · ${extras.documents.length}`}
      action={
        <button className="inline-flex items-center gap-1 rounded-sm bg-brand px-2 py-1 text-[12px] font-medium text-brand-foreground">
          <Plus className="size-3" /> Upload
        </button>
      }
    >
      <ul className="divide-y divide-border">
        {extras.documents.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2.5 text-[13px]">
            <span className="inline-flex size-8 items-center justify-center rounded-sm bg-cloud text-muted-foreground">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{d.title}</p>
              <p className="text-[11.5px] text-muted-foreground">
                {d.kind} · {d.owner} · updated {d.updated}
                {d.size ? ` · ${d.size}` : ""}
              </p>
            </div>
            <Pill tone={statusTone(d.status)}>{d.status}</Pill>
            <ChevronRight className="size-4 text-muted-foreground" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------- Assets ----------
function AssetsTab({ extras }: { extras: (typeof DEPT_EXTRAS)[keyof typeof DEPT_EXTRAS] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {extras.assets.map((a) => (
        <div key={a.id} className="rounded-md border border-border bg-card p-3 shadow-elevated">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">
                {a.type}
                {a.channel ? ` · ${a.channel}` : ""}
              </p>
              <p className="mt-0.5 text-[13.5px] font-semibold text-foreground">{a.title}</p>
            </div>
            <Pill tone={statusTone(a.status)}>{a.status}</Pill>
          </div>
          <p className="mt-2 text-[11.5px] text-muted-foreground">
            {a.owner} · updated {a.updated}
          </p>
          <div className="mt-2 flex gap-3 text-[11.5px] text-muted-foreground">
            {a.views !== undefined && (
              <span>
                <b className="text-foreground tabular-nums">{a.views.toLocaleString()}</b> views
              </span>
            )}
            {a.ctr !== undefined && (
              <span>
                <b className="text-foreground tabular-nums">{a.ctr}%</b> CTR
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Vendors ----------
function VendorsTab({ extras }: { extras: (typeof DEPT_EXTRAS)[keyof typeof DEPT_EXTRAS] }) {
  return (
    <Card title={`Vendors & partners · ${extras.vendors.length}`}>
      <div className="-mx-4 -my-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-cloud/60 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-2.5 text-left">Vendor</th>
              <th className="px-4 py-2.5 text-left">Category</th>
              <th className="px-4 py-2.5 text-right">Spend YTD</th>
              <th className="px-4 py-2.5 text-left">Contract</th>
              <th className="px-4 py-2.5 text-left">Rating</th>
              <th className="px-4 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {extras.vendors.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0 hover:bg-cloud/40">
                <td className="px-4 py-2.5 font-medium text-foreground">{v.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.category}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt$(v.spendYtd)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.contractEnds}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-3",
                          i < v.rating ? "fill-amber-500 text-amber-500" : "text-muted"
                        )}
                      />
                    ))}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Pill tone={statusTone(v.status)}>{v.status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------- Financials ----------
function FinancialsTab({ extras }: { extras: (typeof DEPT_EXTRAS)[keyof typeof DEPT_EXTRAS] }) {
  const totalBudget = extras.budget.reduce((s, b) => s + b.budget, 0);
  const totalSpent = extras.budget.reduce((s, b) => s + b.spent, 0);
  const totalRev = extras.revenue.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Budget
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{fmt$(totalBudget)}</p>
          <p className="text-[11.5px] text-muted-foreground">Allocated this period</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Spent
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{fmt$(totalSpent)}</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-brand"
              style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100).toFixed(0)}%` }}
            />
          </div>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Revenue impact
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{fmt$(totalRev)}</p>
          <p className="text-[11.5px] text-muted-foreground">Across sources</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Budget vs spend">
          <ul className="divide-y divide-border">
            {extras.budget.map((b) => {
              const pct = Math.min(100, (b.spent / b.budget) * 100);
              const over = b.forecast > b.budget;
              return (
                <li key={b.id} className="py-2.5 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{b.category}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {fmt$(b.spent)} / {fmt$(b.budget)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full", over ? "bg-critical" : "bg-brand")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Forecast {fmt$(b.forecast)}
                    {over ? " · over plan" : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Revenue & contribution">
          <ul className="divide-y divide-border">
            {extras.revenue.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="font-medium text-foreground">{r.source}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{fmt$(r.amount)}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[11.5px] font-medium",
                      r.trend === "up" && "text-trust",
                      r.trend === "down" && "text-critical",
                      r.trend === "flat" && "text-muted-foreground"
                    )}
                  >
                    {r.trend === "up" && <TrendingUp className="size-3" />}
                    {r.trend === "down" && <TrendingDown className="size-3" />}
                    {r.delta}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Billing · invoices, bills & POs">
        <div className="-mx-4 -my-4 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-cloud/60 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-2.5 text-left">Ref</th>
                <th className="px-4 py-2.5 text-left">Type</th>
                <th className="px-4 py-2.5 text-left">Party</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5 text-left">Due</th>
                <th className="px-4 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {extras.billing.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-cloud/40">
                  <td className="px-4 py-2.5 font-medium text-foreground">{b.ref}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{b.type}</td>
                  <td className="px-4 py-2.5">{b.party}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt$(b.amount)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{b.due}</td>
                  <td className="px-4 py-2.5">
                    <Pill tone={statusTone(b.status)}>{b.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------- Reports ----------
function ReportsTab({ extras }: { extras: (typeof DEPT_EXTRAS)[keyof typeof DEPT_EXTRAS] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {extras.reports.map((r) => (
        <div
          key={r.id}
          className="flex items-start gap-3 rounded-md border border-border bg-card p-3 shadow-elevated"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-sm bg-brand/10 text-brand">
            <BarChart3 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-foreground">{r.title}</p>
            <p className="text-[11.5px] text-muted-foreground">
              {r.cadence} · {r.audience}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Last run {r.lastRun}</p>
          </div>
          <button className="inline-flex items-center gap-1 rounded-sm border border-border bg-cloud px-2 py-1 text-[11.5px] font-medium hover:bg-card">
            Open <ChevronRight className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------- Automations ----------
function AutomationsTab({ extras }: { extras: (typeof DEPT_EXTRAS)[keyof typeof DEPT_EXTRAS] }) {
  return (
    <Card title={`Workflows · ${extras.automations.length}`}>
      <ul className="divide-y divide-border">
        {extras.automations.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-2.5 text-[13px]">
            <span className="inline-flex size-8 items-center justify-center rounded-sm bg-cloud text-brand">
              <Workflow className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{a.name}</p>
              <p className="text-[11.5px] text-muted-foreground">Trigger · {a.trigger}</p>
            </div>
            <div className="hidden text-right text-[11.5px] text-muted-foreground sm:block">
              <p>
                <b className="text-foreground tabular-nums">{a.runsMo}</b> runs / mo
              </p>
              <p>
                <b className="text-foreground tabular-nums">{a.successPct}%</b> success
              </p>
            </div>
            <Pill tone={statusTone(a.status)}>{a.status}</Pill>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------- Team ----------
function TeamTab({ extras }: { extras: (typeof DEPT_EXTRAS)[keyof typeof DEPT_EXTRAS] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {extras.team.map((m) => (
        <div key={m.id} className="rounded-md border border-border bg-card p-4 shadow-elevated">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand/10 text-[12px] font-semibold text-brand">
              {m.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-foreground">{m.name}</p>
              <p className="text-[11.5px] text-muted-foreground">{m.role}</p>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] uppercase tracking-wide text-muted-foreground">Focus</p>
          <p className="text-[12.5px] text-foreground">{m.focus}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>Load</span>
              <span className="tabular-nums">{m.load}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full",
                  m.load > 85 ? "bg-critical" : m.load > 70 ? "bg-amber-500" : "bg-brand"
                )}
                style={{ width: `${m.load}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
