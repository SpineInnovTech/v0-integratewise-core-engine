/**
 * BizOps — Human Resources View
 *
 * Covers: Team composition, hiring pipeline, onboarding,
 *         performance reviews, team utilization
 */
import { useState } from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import {
  Users,
  UserPlus,
  GraduationCap,
  Star,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Briefcase,
} from "lucide-react";

const ENTITY_TYPES = [
  "employee",
  "hiring_requisition",
  "onboarding_checklist",
  "performance_review",
  "team",
  "resource_allocation",
] as const;

export function HumanResourcesView() {
  const {
    data: batch,
    isLoading,
    refetch,
  } = useWorkspaceEntitiesBatch([...ENTITY_TYPES], {
    limit: 200,
  });

  const employees = batch.employee ?? [];
  const requisitions = batch.hiring_requisition ?? [];
  const onboarding = batch.onboarding_checklist ?? [];
  const reviews = batch.performance_review ?? [];
  const teams = batch.team ?? [];
  const resources = batch.resource_allocation ?? [];

  const activeEmployees = employees.filter(
    (e: any) => e.status === "active" || e.status === "employed"
  );
  const openRequisitions = requisitions.filter(
    (r: any) => r.status === "open" || r.status === "active"
  );
  const pendingReviews = reviews.filter((r: any) => r.status === "pending" || r.status === "draft");
  const inProgressOnboarding = onboarding.filter(
    (o: any) => o.status === "in_progress" || o.status === "active"
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading HR data...</p>
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
            <Users className="h-5 w-5 text-[var(--iw-purple)]" />
            Human Resources
          </h2>
          <p className="text-sm text-muted-foreground">
            Team composition, hiring, onboarding, and performance
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
          label="Active Employees"
          value={activeEmployees.length}
          icon={<Users className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Open Positions"
          value={openRequisitions.length}
          icon={<Briefcase className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="In Onboarding"
          value={inProgressOnboarding.length}
          icon={<GraduationCap className="h-4 w-4" />}
          color="text-iw-forest-mid"
        />
        <MiniKPI
          label="Pending Reviews"
          value={pendingReviews.length}
          icon={<Star className="h-4 w-4" />}
          color="text-iw-gold"
        />
      </div>

      {/* Team Composition */}
      <CollapsibleSection
        title="Team Composition"
        icon={<Users className="h-4 w-4 text-iw-slate-mid" />}
        count={employees.length}
        countLabel="employees"
        defaultOpen
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Employees ({activeEmployees.length} active)
            </h4>
            {employees.length > 0 ? (
              employees.slice(0, 10).map((e: any) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">
                      {e.name ||
                        e.full_name ||
                        `${e.first_name || ""} ${e.last_name || ""}`.trim() ||
                        "Employee"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {[e.role, e.department, e.team].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {e.utilization != null && (
                      <span className="text-xs text-muted-foreground">
                        {e.utilization}% utilized
                      </span>
                    )}
                    <StatusBadge status={e.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No employees synced</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Teams ({teams.length})
            </h4>
            {teams.length > 0 ? (
              teams.slice(0, 10).map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">{t.name || t.team_name || "Team"}</span>
                    <p className="text-xs text-muted-foreground">
                      {t.member_count != null
                        ? `${t.member_count} members`
                        : t.lead
                          ? `Lead: ${t.lead}`
                          : "—"}
                    </p>
                  </div>
                  {t.department && (
                    <span className="text-xs text-muted-foreground shrink-0">{t.department}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No teams defined</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Hiring Pipeline */}
      <CollapsibleSection
        title="Hiring Pipeline"
        icon={<UserPlus className="h-4 w-4 text-iw-slate-mid" />}
        count={requisitions.length}
        countLabel="requisitions"
        defaultOpen
      >
        {requisitions.length > 0 ? (
          <div className="space-y-2">
            {requisitions.slice(0, 10).map((r: any) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {r.title || r.role || r.position || "Position"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[r.department, r.location, r.type].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.applicants != null && (
                    <span className="text-xs text-muted-foreground">{r.applicants} applicants</span>
                  )}
                  {r.days_open != null && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {r.days_open}d
                    </span>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No open requisitions</p>
        )}
      </CollapsibleSection>

      {/* Onboarding */}
      <CollapsibleSection
        title="Onboarding"
        icon={<GraduationCap className="h-4 w-4 text-iw-forest-mid" />}
        count={onboarding.length}
        countLabel="checklists"
      >
        {onboarding.length > 0 ? (
          <div className="space-y-2">
            {onboarding.slice(0, 10).map((o: any) => (
              <div
                key={o.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {o.name || o.title || o.employee_name || "Onboarding"}
                  </span>
                  {o.assignee && (
                    <p className="text-xs text-muted-foreground">Assignee: {o.assignee}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {o.progress != null && <span className="text-xs font-medium">{o.progress}%</span>}
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No onboarding checklists</p>
        )}
      </CollapsibleSection>

      {/* Performance Reviews */}
      <CollapsibleSection
        title="Performance Reviews"
        icon={<Star className="h-4 w-4 text-iw-gold" />}
        count={reviews.length}
        countLabel="reviews"
      >
        {reviews.length > 0 ? (
          <div className="space-y-2">
            {reviews.slice(0, 10).map((r: any) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {r.employee_name || r.name || r.title || "Review"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[r.review_period, r.reviewer].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.rating != null && (
                    <span className="text-xs font-semibold text-iw-gold">{r.rating}/5</span>
                  )}
                  {r.due_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No performance reviews</p>
        )}
      </CollapsibleSection>

      {/* Utilization */}
      <CollapsibleSection
        title="Team Utilization"
        icon={<BarChart3 className="h-4 w-4 text-iw-forest-bright" />}
        count={resources.length}
        countLabel="records"
      >
        {resources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.slice(0, 12).map((r: any) => (
              <div key={r.id} className="border rounded-lg p-4 bg-card">
                <p className="text-sm font-medium">
                  {r.name || r.resource_name || r.team || "Resource"}
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-bold">
                    {r.utilization ?? r.allocation_percent ?? "—"}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${
                      (r.utilization || r.allocation_percent || 0) >= 90
                        ? "bg-iw-red"
                        : (r.utilization || r.allocation_percent || 0) >= 70
                          ? "bg-iw-gold"
                          : "bg-iw-forest-bright"
                    }`}
                    style={{
                      width: `${Math.min(r.utilization || r.allocation_percent || 0, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No utilization data</p>
        )}
      </CollapsibleSection>
    </div>
  );
}

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
    s === "employed"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
      : s === "paused" || s === "pending" || s === "draft" || s === "in_progress"
        ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
        : s === "completed" || s === "done" || s === "won" || s === "submitted"
          ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80"
          : s === "failed" ||
              s === "lost" ||
              s === "blocked" ||
              s === "at_risk" ||
              s === "terminated"
            ? "bg-iw-red/10 text-iw-red dark:bg-iw-red/90/20 dark:text-iw-red/70"
            : "bg-muted text-muted-foreground";

  return <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{status}</span>;
}

export default HumanResourcesView;
