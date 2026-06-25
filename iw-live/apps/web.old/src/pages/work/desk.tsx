import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  UserCircle2,
  Flame,
  TrendingUp,
  TrendingDown,
  Clock3,
  Handshake,
  Gavel,
  Ban,
} from "lucide-react";
import { PageHeader } from "@/components/l2/spine/page-header";
import { getBusinessIntelligence, DEPARTMENTS } from "@/lib/spine/departments";

interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

function Card({ title, className, children }: CardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border p-5", className)}>
      {title && <h3 className="font-semibold text-foreground mb-4 text-sm">{title}</h3>}
      {children}
    </div>
  );
}
import type { DeptCode } from "@/lib/spine/entities";
import {
  accounts,
  contracts,
  invoices,
  employees,
  deals,
  tickets,
  commitments,
  decisions,
  blockers,
} from "@/lib/spine/mockData";
import { cn } from "@/lib/utils";

interface DeptLinkProps {
  code: DeptCode;
  className?: string;
  children: React.ReactNode;
}

function DeptLink({ code, className, children }: DeptLinkProps) {
  const d = DEPARTMENTS[code];
  if (!d) return <span className={className}>{children}</span>;
  const path = `/${d.surface}/${d.urlSlug}`;
  return (
    <Link to={path} className={className}>
      {children}
    </Link>
  );
}

// Route definition removed for React Router compatibility

type StoryItem = {
  dept: DeptCode;
  when: string;
  trend: "up" | "down" | "flat";
  text: string;
};

const STORY: StoryItem[] = [
  {
    dept: "sales",
    when: "Today",
    trend: "up",
    text: "Boreal Energy moved to Negotiation — $950K, CTO sponsoring.",
  },
  {
    dept: "cs",
    when: "Today",
    trend: "down",
    text: "Brightwave health dropped to 41 after second P1 ticket this week.",
  },
  {
    dept: "finance",
    when: "Yesterday",
    trend: "down",
    text: "INV-2031 crossed 60 days overdue. Twin proposed dunning sequence.",
  },
  {
    dept: "eng",
    when: "2d ago",
    trend: "up",
    text: "Auth 5xx burst resolved in 18m. Postmortem scheduled.",
  },
  {
    dept: "marketing",
    when: "3d ago",
    trend: "up",
    text: "Spine launch webinar hit 318 registered — pipeline +22% MoM.",
  },
  {
    dept: "support",
    when: "4d ago",
    trend: "down",
    text: "CSAT slipped to 4.4 (-0.1). Driven by Salesforce sync incidents.",
  },
];

type CalendarItem = {
  dept: DeptCode;
  bucket: "30d" | "60d" | "90d";
  label: string;
  meta: string;
  days: number;
};

function buildCalendar(): CalendarItem[] {
  const items: CalendarItem[] = [];
  const bucket = (d: number): CalendarItem["bucket"] => (d <= 30 ? "30d" : d <= 60 ? "60d" : "90d");
  for (const a of accounts.filter((x) => x.renewalDays <= 90)) {
    items.push({
      dept: "cs",
      bucket: bucket(a.renewalDays),
      label: `${a.name} renewal`,
      meta: `$${(a.arr / 1000).toFixed(0)}K ARR · ${a.owner}`,
      days: a.renewalDays,
    });
  }
  for (const k of contracts.filter((x) => x.expiresDays <= 90)) {
    items.push({
      dept: "legal",
      bucket: bucket(k.expiresDays),
      label: `${k.name} expires`,
      meta: `${k.type} · ${k.account}`,
      days: k.expiresDays,
    });
  }
  for (const v of invoices.filter((x) => x.status !== "Paid" && x.status !== "Draft")) {
    const due = Math.max(0, 30 - v.ageDays);
    items.push({
      dept: "finance",
      bucket: bucket(due),
      label: `${v.name} due`,
      meta: `${v.account} · $${(v.amount / 1000).toFixed(0)}K · ${v.status}`,
      days: due,
    });
  }
  return items.sort((a, b) => a.days - b.days);
}

function DeskPage() {
  const bi = getBusinessIntelligence();
  const triage = [...bi.signals].sort((a, b) => {
    const rank = { critical: 0, warn: 1, ok: 2 } as const;
    if (rank[a.level] !== rank[b.level]) return rank[a.level] - rank[b.level];
    return b.impact - a.impact;
  });
  const calendar = buildCalendar();
  const buckets = (["30d", "60d", "90d"] as const).map((b) => ({
    key: b,
    items: calendar.filter((c) => c.bucket === b),
  }));

  const overloaded = employees.filter((e) => e.load > 85);
  const ownerCounts = new Map<string, { deals: number; accts: number; tickets: number }>();
  for (const d of deals) {
    const o = ownerCounts.get(d.owner) ?? { deals: 0, accts: 0, tickets: 0 };
    o.deals += 1;
    ownerCounts.set(d.owner, o);
  }
  for (const a of accounts) {
    const o = ownerCounts.get(a.owner) ?? { deals: 0, accts: 0, tickets: 0 };
    o.accts += 1;
    ownerCounts.set(a.owner, o);
  }
  for (const t of tickets) {
    const o = ownerCounts.get(t.owner) ?? { deals: 0, accts: 0, tickets: 0 };
    o.tickets += 1;
    ownerCounts.set(t.owner, o);
  }
  const silentAccts = accounts.filter((a) => {
    const d = Math.round((Date.now() - new Date(a.updatedAt).getTime()) / 86400_000);
    return d >= 3;
  });

  const openCommitments = commitments
    .filter((c) => c.status !== "Kept")
    .sort((a, b) => a.dueDays - b.dueDays);
  const activeBlockers = [...blockers].sort((a, b) => b.ageDays - a.ageDays);
  const recentDecisions = [...decisions]
    .sort((a, b) => new Date(b.decidedOn).getTime() - new Date(a.decidedOn).getTime())
    .slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Today"
        title="My Desk"
        description="Everything that needs a human decision today — across Decide, Build, Grow, Run. Sorted by urgency, not by function."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Critical signals
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-critical">
            {bi.critical}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">need a human now</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Open commitments
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{openCommitments.length}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {openCommitments.filter((c) => c.dueDays < 0 || c.status === "Missed").length} overdue
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Active blockers
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-amber-600">
            {activeBlockers.length}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {activeBlockers.filter((b) => b.severity === "high").length} high severity
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Composite health
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{bi.avgScore}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">avg across 12 depts</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="What needs a decision — cross-surface triage" className="lg:col-span-2">
          {triage.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">All quiet across the workspace.</p>
          ) : (
            <ul className="space-y-2">
              {triage.slice(0, 10).map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-start gap-3 rounded-sm border px-3 py-2 text-[13px]",
                    s.level === "critical"
                      ? "border-critical/30 bg-critical/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      s.level === "critical" ? "text-critical" : "text-amber-600"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      <span className="mr-2 rounded-sm bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {DEPARTMENTS[s.dept].name}
                      </span>
                      {s.entity}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{s.message}</p>
                  </div>
                  <DeptLink
                    code={s.dept}
                    className="shrink-0 text-[12px] font-medium text-brand hover:underline"
                  >
                    Open
                  </DeptLink>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Department health">
          <ul className="space-y-1.5">
            {bi.depts.map((d) => (
              <li key={d.code}>
                <DeptLink
                  code={d.code}
                  className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 hover:bg-accent"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      d.health.level === "ok" && "bg-trust",
                      d.health.level === "warn" && "bg-amber-500",
                      d.health.level === "critical" && "bg-critical"
                    )}
                  />
                  <span className="flex-1 text-[13px] font-medium text-foreground">{d.name}</span>
                  <span className="text-[12px] tabular-nums text-muted-foreground">
                    {d.health.score}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </DeptLink>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Commitments — promises on the line" className="lg:col-span-2">
          {openCommitments.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No open commitments.</p>
          ) : (
            <ul className="space-y-2">
              {openCommitments.map((c) => {
                const overdue = c.dueDays < 0 || c.status === "Missed";
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "flex items-start gap-3 rounded-sm border px-3 py-2 text-[13px]",
                      overdue
                        ? "border-critical/30 bg-critical/5"
                        : c.status === "At risk"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-border"
                    )}
                  >
                    <Handshake
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0",
                        overdue
                          ? "text-critical"
                          : c.status === "At risk"
                            ? "text-amber-600"
                            : "text-brand"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        <span className="mr-2 rounded-sm bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {c.surface}
                        </span>
                        {c.name}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        To <span className="font-medium text-foreground">{c.to}</span> · {c.promise}
                      </p>
                      <p className="mt-0.5 text-[11px] italic text-muted-foreground">
                        Source: {c.source}
                      </p>
                    </div>
                    <span className="shrink-0 text-right">
                      <span
                        className={cn(
                          "block text-[11px] font-semibold tabular-nums",
                          overdue ? "text-critical" : "text-foreground"
                        )}
                      >
                        {c.dueDays < 0 ? `${Math.abs(c.dueDays)}d late` : `in ${c.dueDays}d`}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {c.status}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Recent decisions">
          <ul className="space-y-2">
            {recentDecisions.map((d) => (
              <li key={d.id} className="rounded-sm border border-border p-2.5">
                <div className="flex items-start gap-2">
                  <Gavel className="mt-0.5 size-3.5 shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground">{d.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                      {d.rationale}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {d.decidedBy} · {d.status}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/decide"
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
          >
            All decisions <ArrowRight className="size-3" />
          </Link>
        </Card>
      </div>

      <Card title="Blockers — what's stopping forward motion" className="mt-4">
        {activeBlockers.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No active blockers.</p>
        ) : (
          <ul className="divide-y divide-border">
            {activeBlockers.map((b) => (
              <li key={b.id} className="grid grid-cols-12 items-start gap-2 py-2.5 text-[13px]">
                <span className="col-span-12 flex items-start gap-2 md:col-span-5">
                  <Ban
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      b.severity === "high"
                        ? "text-critical"
                        : b.severity === "med"
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{b.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Blocks: {b.blocks}
                    </span>
                  </span>
                </span>
                <span className="col-span-6 text-[12px] text-muted-foreground md:col-span-4">
                  {b.reason}
                </span>
                <span className="col-span-4 text-[11px] text-muted-foreground md:col-span-2">
                  Needs: {b.needs}
                </span>
                <span className="col-span-2 text-right text-[11px] tabular-nums text-muted-foreground md:col-span-1">
                  {b.ageDays}d
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Calendar brain — next 30 / 60 / 90 days" className="mt-4">
        <div className="grid gap-4 md:grid-cols-3">
          {buckets.map(({ key, items }) => (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between border-b border-border pb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Next {key}
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">Nothing scheduled.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((it, i) => {
                    const d = DEPARTMENTS[it.dept];
                    return (
                      <li key={i} className="rounded-sm border border-border bg-cloud/40 p-2">
                        <div className="flex items-start gap-2">
                          <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-brand" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-foreground">
                              {it.label}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">{it.meta}</p>
                          </div>
                          <span className="shrink-0 rounded-sm bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {d.name}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>in {it.days}d</span>
                          <DeptLink
                            code={it.dept}
                            className="font-medium text-brand hover:underline"
                          >
                            Open
                          </DeptLink>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="The story — last 14 days" className="lg:col-span-2">
          <ol className="relative space-y-3 border-l border-border pl-4">
            {STORY.map((s, i) => {
              const d = DEPARTMENTS[s.dept];
              return (
                <li key={i} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-1.5 inline-flex size-3 items-center justify-center rounded-full border-2 border-background",
                      s.trend === "up" && "bg-trust",
                      s.trend === "down" && "bg-critical",
                      s.trend === "flat" && "bg-muted-foreground"
                    )}
                  />
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {s.when}
                    </span>
                    <DeptLink
                      code={s.dept}
                      className="rounded-sm bg-cloud px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground hover:bg-accent"
                    >
                      {d.name}
                    </DeptLink>
                    {s.trend === "up" && <TrendingUp className="size-3 text-trust" />}
                    {s.trend === "down" && <TrendingDown className="size-3 text-critical" />}
                  </div>
                  <p className="mt-0.5 text-[13px] text-foreground">{s.text}</p>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card title="People layer">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Overloaded owners
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {overloaded.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-[13px]">
                <Flame className="size-3.5 shrink-0 text-amber-600" />
                <span className="flex-1 truncate font-medium text-foreground">{e.name}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">{e.role}</span>
                <span className="rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                  {e.load}
                </span>
              </li>
            ))}
            {overloaded.length === 0 && (
              <li className="text-[12px] text-muted-foreground">No one over 85 load.</li>
            )}
          </ul>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Silent accounts (3d+)
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {silentAccts.slice(0, 4).map((a) => {
              const d = Math.round((Date.now() - new Date(a.updatedAt).getTime()) / 86400_000);
              return (
                <li key={a.id} className="flex items-center gap-2 text-[13px]">
                  <Clock3 className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-foreground">{a.name}</span>
                  <span className="text-[11px] text-muted-foreground">{d}d</span>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Top owners by load
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {[...ownerCounts.entries()]
              .sort(
                (a, b) =>
                  b[1].deals + b[1].accts + b[1].tickets - (a[1].deals + a[1].accts + a[1].tickets)
              )
              .slice(0, 4)
              .map(([name, c]) => (
                <li key={name} className="flex items-center gap-2 text-[13px]">
                  <UserCircle2 className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium text-foreground">{name}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {c.accts}a · {c.deals}d · {c.tickets}t
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

export default DeskPage;
