import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Database,
  Users,
  Clock,
  Pencil,
  Check,
  X,
  History,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { type KnowledgeValue, formatKnowledge } from "@/lib/spine/knowledge";

/**
 * KnowledgeField — the core primitive of the contextual surface.
 * A number is not a cell — it carries provenance, people, confidence and a Twin rationale.
 * Hover to edit · click "context" to drill in · every commit is logged.
 */

function Spark({ points, trend }: { points: number[]; trend?: "up" | "down" | "flat" }) {
  if (!points || points.length === 0) return null;
  const min = Math.min(...points),
    max = Math.max(...points);
  const range = max - min || 1;
  const w = 120,
    h = 28;
  const step = w / (points.length - 1);
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((p - min) / range) * h).toFixed(1)}`
    )
    .join(" ");
  const stroke =
    trend === "down"
      ? "var(--critical)"
      : trend === "flat"
        ? "var(--muted-foreground)"
        : "var(--trust)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

function TrendBadge({ delta, trend }: { delta?: string; trend?: "up" | "down" | "flat" }) {
  if (!delta) return null;
  const Icon = trend === "down" ? TrendingDown : trend === "flat" ? Minus : TrendingUp;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11.5px] font-semibold",
        trend === "down" && "text-critical",
        trend === "flat" && "text-muted-foreground",
        (!trend || trend === "up") && "text-trust"
      )}
    >
      <Icon className="size-3" /> {delta}
    </span>
  );
}

function PeopleStack({ people }: { people: KnowledgeValue["people"] }) {
  const shown = people.slice(0, 4);
  return (
    <div className="flex -space-x-1.5">
      {shown.map((p) => (
        <span
          key={p.id}
          title={`${p.name} · ${p.role ?? ""}`}
          className="inline-flex size-6 items-center justify-center rounded-full border-2 border-card bg-brand/15 text-[10px] font-semibold text-brand"
        >
          {p.initials}
        </span>
      ))}
      {people.length > shown.length && (
        <span className="inline-flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
          +{people.length - shown.length}
        </span>
      )}
    </div>
  );
}

export function KnowledgeField({
  field,
  onEdit,
  emphasis = "default",
}: {
  field: KnowledgeValue;
  onEdit?: (newValue: string) => void;
  emphasis?: "default" | "hero";
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(formatKnowledge(field));
  const [editedOnce, setEditedOnce] = useState(false);

  const commit = () => {
    if (draft !== formatKnowledge(field)) {
      onEdit?.(draft);
      setEditedOnce(true);
    }
    setEditing(false);
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col gap-2 rounded-md border border-border bg-card p-3.5 shadow-elevated transition-shadow hover:border-brand/40 hover:shadow-brand",
          emphasis === "hero" && "p-4"
        )}
      >
        {/* Top row: label + edit dot */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {field.label}
          </p>
          {editedOnce && <span title="Edited by you" className="size-1.5 rounded-full bg-trust" />}
        </div>

        {/* Value */}
        <div className="flex items-end justify-between gap-3">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") {
                    setDraft(formatKnowledge(field));
                    setEditing(false);
                  }
                }}
                className={cn(
                  "w-32 rounded-sm border border-brand bg-background px-1.5 py-0.5 font-semibold tracking-tight text-foreground outline-none ring-1 ring-brand/30",
                  emphasis === "hero" ? "text-2xl" : "text-xl"
                )}
              />
              <button onClick={commit} className="rounded-sm p-1 text-trust hover:bg-trust/10">
                <Check className="size-3.5" />
              </button>
              <button
                onClick={() => {
                  setDraft(formatKnowledge(field));
                  setEditing(false);
                }}
                className="rounded-sm p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={cn(
                "group/value inline-flex items-baseline gap-1 rounded-sm -mx-1 px-1 text-left font-semibold tracking-tight text-foreground hover:bg-brand/[0.06]",
                emphasis === "hero" ? "text-[28px] leading-none" : "text-2xl leading-none"
              )}
              aria-label={`Edit ${field.label}`}
            >
              {formatKnowledge(field)}
              <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover/value:opacity-100" />
            </button>
          )}
          <TrendBadge delta={field.delta} trend={field.trend} />
        </div>

        {field.series && field.series.length > 0 && (
          <Spark points={field.series} trend={field.trend} />
        )}

        {/* Provenance row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <PeopleStack people={field.people} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-cloud px-1.5 py-0.5 text-[10.5px] font-semibold text-muted-foreground hover:border-brand hover:text-brand"
            title="Open context drawer"
          >
            <Database className="size-2.5" /> {field.sources.length} source
            {field.sources.length !== 1 ? "s" : ""} · {field.contributors.length} contrib
          </button>
        </div>

        {/* Twin rationale teaser */}
        <p className="line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
          <Sparkles className="mr-1 inline size-2.5 text-brand" />
          {field.rationale}
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          aria-label={`Open ${field.label} context`}
          tabIndex={-1}
          // sit behind interactive elements
          style={{ zIndex: 0 }}
        />
      </div>

      <ContextDrawer open={open} onOpenChange={setOpen} field={field} edited={editedOnce} />
    </>
  );
}

function ContextDrawer({
  open,
  onOpenChange,
  field,
  edited,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  field: KnowledgeValue;
  edited: boolean;
}) {
  const totalContrib = field.contributors.reduce((s, c) => s + (c.amount ?? 0), 0);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Knowledge field · {field.unit}
          </p>
          <SheetTitle className="text-2xl tracking-tight">{field.label}</SheetTitle>
          <SheetDescription className="text-[13px]">
            <span className="text-3xl font-semibold tracking-tight text-foreground">
              {formatKnowledge(field)}
            </span>
            <TrendBadge delta={field.delta} trend={field.trend} />
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5 text-[13px]">
          {/* Confidence + freshness */}
          <section className="rounded-md border border-border bg-cloud p-3">
            <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>
                <Clock className="mr-1 inline size-3" /> synced {field.syncedAt}
              </span>
              <span className="font-semibold text-foreground">{field.confidence}% confidence</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full",
                  field.confidence >= 90
                    ? "bg-trust"
                    : field.confidence >= 70
                      ? "bg-brand"
                      : "bg-amber-500"
                )}
                style={{ width: `${field.confidence}%` }}
              />
            </div>
          </section>

          {/* Twin rationale */}
          <section>
            <header className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
              <Sparkles className="size-3" /> Twin reading
            </header>
            <p className="rounded-md border border-brand/20 bg-brand/5 p-3 text-foreground">
              {field.rationale}
            </p>
          </section>

          {/* Contributors */}
          <section>
            <header className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Behind this number · {field.contributors.length}
              </span>
              {totalContrib > 0 && (
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  Σ ${(totalContrib / 1000).toFixed(0)}K
                </span>
              )}
            </header>
            <ul className="divide-y divide-border rounded-md border border-border bg-card">
              {field.contributors.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{c.label}</p>
                    {c.meta && (
                      <p className="truncate text-[11.5px] text-muted-foreground">{c.meta}</p>
                    )}
                  </div>
                  {c.owner && (
                    <span className="rounded-sm bg-brand/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-brand">
                      {c.owner}
                    </span>
                  )}
                  {c.amount !== undefined && (
                    <span className="text-[12px] font-semibold tabular-nums text-foreground">
                      ${(c.amount / 1000).toFixed(0)}K
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* People */}
          <section>
            <header className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Users className="size-3" /> People accountable · {field.people.length}
            </header>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {field.people.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5"
                >
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand/15 text-[11px] font-semibold text-brand">
                    {p.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-foreground">{p.name}</p>
                    {p.role && (
                      <p className="truncate text-[11px] text-muted-foreground">{p.role}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Sources */}
          <section>
            <header className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Database className="size-3" /> Sources of truth
            </header>
            <ul className="space-y-1.5">
              {field.sources.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-foreground">{s.system}</p>
                    {s.detail && <p className="text-[11.5px] text-muted-foreground">{s.detail}</p>}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{s.syncedAt}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Edit log */}
          {(edited || field.history?.length) && (
            <section>
              <header className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <History className="size-3" /> Edit log
              </header>
              <ul className="space-y-1.5 text-[12px]">
                {edited && (
                  <li className="rounded-md border border-trust/30 bg-trust/5 px-3 py-2">
                    <p className="font-medium text-foreground">You overrode this value</p>
                    <p className="text-[11px] text-muted-foreground">
                      just now · marked as human-verified
                    </p>
                  </li>
                )}
                {field.history?.map((h, i) => (
                  <li key={i} className="rounded-md border border-border bg-card px-3 py-2">
                    <p className="font-medium text-foreground">{h.note}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {h.by} · {h.at}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
