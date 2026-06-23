/**
 * BizOps — Strategy & Leadership View
 *
 * Covers: Company vision, strategic goals, OKRs, board communications,
 *         investor relations, milestone tracking
 */
import { useState } from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import {
  Target,
  Flag,
  Users,
  TrendingUp,
  MessageSquare,
  Landmark,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const ENTITY_TYPES = [
  "okr",
  "kpi",
  "milestone",
  "board_update",
  "investor_communication",
  "strategic_objective",
  "business_context",
] as const;

export function StrategyLeadershipView() {
  const {
    data: batch,
    isLoading,
    refetch,
  } = useWorkspaceEntitiesBatch([...ENTITY_TYPES], {
    limit: 200,
  });

  const okrs = batch.okr ?? [];
  const kpis = batch.kpi ?? [];
  const milestones = batch.milestone ?? [];
  const boardUpdates = batch.board_update ?? [];
  const investorComms = batch.investor_communication ?? [];
  const strategicObjectives = batch.strategic_objective ?? [];
  const businessContext = batch.business_context ?? [];

  const avgOkrProgress = okrs.length
    ? Math.round(
        okrs.reduce((s: number, o: any) => s + (o.progress || o.progress_percent || 0), 0) /
          okrs.length
      )
    : 0;

  const upcomingMilestones = milestones
    .filter((m: any) => m.status !== "completed" && m.status !== "achieved")
    .sort(
      (a: any, b: any) =>
        new Date(a.target_date || a.due_date || 0).getTime() -
        new Date(b.target_date || b.due_date || 0).getTime()
    );

  const completedMilestones = milestones.filter(
    (m: any) => m.status === "completed" || m.status === "achieved"
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading strategy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Flag className="h-5 w-5 text-[var(--iw-purple)]" />
            Strategy & Leadership
          </h2>
          <p className="text-sm text-muted-foreground">
            Vision, goals, board communications, and milestone tracking
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded-lg border hover:bg-accent text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI
          label="OKRs"
          value={okrs.length}
          icon={<Target className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Avg Progress"
          value={okrs.length ? `${avgOkrProgress}%` : "—"}
          icon={<TrendingUp className="h-4 w-4" />}
          color={
            avgOkrProgress >= 70
              ? "text-iw-forest-mid"
              : avgOkrProgress >= 40
                ? "text-iw-gold"
                : "text-iw-red"
          }
        />
        <MiniKPI
          label="Milestones"
          value={`${completedMilestones.length}/${milestones.length}`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Board Updates"
          value={boardUpdates.length}
          icon={<Users className="h-4 w-4" />}
          color="text-iw-slate"
        />
      </div>

      {/* OKRs & Strategic Objectives */}
      <CollapsibleSection
        title="Strategic Goals & OKRs"
        icon={<Target className="h-4 w-4 text-iw-slate-mid" />}
        count={okrs.length + strategicObjectives.length}
        countLabel="items"
        defaultOpen
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              OKRs ({okrs.length})
            </h4>
            {okrs.length > 0 ? (
              okrs.slice(0, 8).map((okr: any) => (
                <div key={okr.id} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate mr-2">
                      {okr.title || okr.objective || okr.name || "OKR"}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {okr.progress || okr.progress_percent || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (okr.progress || okr.progress_percent || 0) >= 70
                          ? "bg-iw-forest-bright"
                          : (okr.progress || okr.progress_percent || 0) >= 40
                            ? "bg-iw-gold"
                            : "bg-iw-red"
                      }`}
                      style={{
                        width: `${Math.min(okr.progress || okr.progress_percent || 0, 100)}%`,
                      }}
                    />
                  </div>
                  {okr.owner && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">Owner: {okr.owner}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No OKRs defined</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Strategic Objectives ({strategicObjectives.length})
            </h4>
            {strategicObjectives.length > 0 ? (
              strategicObjectives.slice(0, 8).map((obj: any) => (
                <div
                  key={obj.id}
                  className="flex items-start justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span>{obj.name || obj.title || obj.label || "Objective"}</span>
                    {obj.description && (
                      <p className="text-xs text-muted-foreground">{obj.description}</p>
                    )}
                  </div>
                  <StatusBadge status={obj.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No strategic objectives</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Milestones */}
      <CollapsibleSection
        title="Milestone Tracker"
        icon={<Calendar className="h-4 w-4 text-iw-slate-mid" />}
        count={milestones.length}
        countLabel="milestones"
        defaultOpen
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Upcoming ({upcomingMilestones.length})
            </h4>
            {upcomingMilestones.length > 0 ? (
              upcomingMilestones.slice(0, 8).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">
                      {m.name || m.title || m.milestone_name || "Milestone"}
                    </span>
                    {m.description && (
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.target_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(m.target_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <StatusBadge status={m.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No upcoming milestones</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Achieved ({completedMilestones.length})
            </h4>
            {completedMilestones.length > 0 ? (
              completedMilestones.slice(0, 8).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {m.name || m.title || m.milestone_name || "Milestone"}
                  </span>
                  {m.completed_date && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(m.completed_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No completed milestones</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Board Communications */}
      <CollapsibleSection
        title="Board & Investor Communications"
        icon={<MessageSquare className="h-4 w-4 text-iw-slate" />}
        count={boardUpdates.length + investorComms.length}
        countLabel="communications"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Board Updates ({boardUpdates.length})
            </h4>
            {boardUpdates.length > 0 ? (
              boardUpdates.slice(0, 8).map((b: any) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">
                      {b.title || b.subject || b.name || "Board Update"}
                    </span>
                    {b.summary && (
                      <p className="text-xs text-muted-foreground truncate">{b.summary}</p>
                    )}
                  </div>
                  {b.date && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(b.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No board updates</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Investor Communications ({investorComms.length})
            </h4>
            {investorComms.length > 0 ? (
              investorComms.slice(0, 8).map((ic: any) => (
                <div
                  key={ic.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">
                      {ic.title || ic.subject || ic.name || "Investor Comm"}
                    </span>
                    {ic.investor_name && (
                      <p className="text-xs text-muted-foreground">{ic.investor_name}</p>
                    )}
                  </div>
                  {ic.date && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(ic.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No investor communications</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Company Context */}
      <CollapsibleSection
        title="Company Context"
        icon={<Landmark className="h-4 w-4 text-iw-forest-mid" />}
        count={businessContext.length}
        countLabel="items"
      >
        {businessContext.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {businessContext.slice(0, 8).map((ctx: any) => (
              <div key={ctx.id} className="border rounded-lg p-4 bg-card">
                <h4 className="text-sm font-semibold mb-1">
                  {ctx.name || ctx.title || ctx.key || "Context Item"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {ctx.description || ctx.value || ctx.content || "—"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No company context items. Add vision, mission, and values to your workspace.
          </p>
        )}
      </CollapsibleSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function MiniKPI({
  label,
  value,
  icon,
  color = "text-muted-foreground",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-3 border rounded-lg bg-card">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  count,
  countLabel,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  countLabel: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-muted-foreground">
            ({count} {countLabel})
          </span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const s = status.toLowerCase();
  const color =
    s === "active" ||
    s === "running" ||
    s === "live" ||
    s === "enabled" ||
    s === "on_track" ||
    s === "achieved"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
      : s === "paused" || s === "pending" || s === "draft" || s === "upcoming"
        ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
        : s === "completed" || s === "done" || s === "won" || s === "sent"
          ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80"
          : s === "failed" || s === "lost" || s === "blocked" || s === "at_risk"
            ? "bg-iw-red/10 text-iw-red dark:bg-iw-red/90/20 dark:text-iw-red/70"
            : "bg-muted text-muted-foreground";

  return <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{status}</span>;
}

export default StrategyLeadershipView;
