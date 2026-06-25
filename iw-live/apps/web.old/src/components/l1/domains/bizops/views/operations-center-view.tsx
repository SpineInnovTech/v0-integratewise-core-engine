/**
 * BizOps — Operations Center View
 *
 * Covers: Process management, workflow optimization, resource allocation,
 *         operational metrics, vendor management
 */
import { useState } from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import {
  Settings,
  GitBranch,
  Users,
  BarChart3,
  Building,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

const ENTITY_TYPES = [
  "workflow",
  "process",
  "resource_allocation",
  "ops_metric",
  "vendor",
  "cross_dept_initiative",
  "project",
] as const;

export function OperationsCenterView() {
  const {
    data: batch,
    isLoading,
    refetch,
  } = useWorkspaceEntitiesBatch([...ENTITY_TYPES], {
    limit: 200,
  });

  const workflows = batch.workflow ?? [];
  const processes = batch.process ?? [];
  const resources = batch.resource_allocation ?? [];
  const opsMetrics = batch.ops_metric ?? [];
  const vendors = batch.vendor ?? [];
  const initiatives = batch.cross_dept_initiative ?? [];
  const projects = batch.project ?? [];

  const runningWorkflows = workflows.filter(
    (w: any) => w.status === "active" || w.status === "running" || w.status === "enabled"
  );
  const activeProcesses = processes.filter(
    (p: any) => p.status === "active" || p.status === "running"
  );
  const activeProjects = projects.filter(
    (p: any) => p.status === "active" || p.status === "in_progress" || p.status === "on_track"
  );

  const avgUtilization = resources.length
    ? Math.round(
        resources.reduce(
          (s: number, r: any) => s + (r.utilization || r.allocation_percent || 0),
          0
        ) / resources.length
      )
    : 0;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading operations data...</p>
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
            <Settings className="h-5 w-5 text-[var(--iw-purple)]" />
            Operations Center
          </h2>
          <p className="text-sm text-muted-foreground">
            Processes, resources, vendors, and operational metrics
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
          label="Active Workflows"
          value={runningWorkflows.length}
          icon={<GitBranch className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Active Processes"
          value={activeProcesses.length}
          icon={<Settings className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Avg Utilization"
          value={resources.length ? `${avgUtilization}%` : "—"}
          icon={<Users className="h-4 w-4" />}
          color={
            avgUtilization >= 80
              ? "text-iw-forest-mid"
              : avgUtilization >= 50
                ? "text-iw-gold"
                : "text-iw-red"
          }
        />
        <MiniKPI
          label="Vendors"
          value={vendors.length}
          icon={<Building className="h-4 w-4" />}
          color="text-iw-slate"
        />
      </div>

      {/* Processes & Workflows */}
      <CollapsibleSection
        title="Processes & Workflows"
        icon={<GitBranch className="h-4 w-4 text-iw-slate-mid" />}
        count={workflows.length + processes.length}
        countLabel="items"
        defaultOpen
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Workflows ({workflows.length})
            </h4>
            {workflows.length > 0 ? (
              workflows.slice(0, 8).map((w: any) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {w.name || w.workflow_name || w.title || "Workflow"}
                  </span>
                  <StatusBadge status={w.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No workflows</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Processes ({processes.length})
            </h4>
            {processes.length > 0 ? (
              processes.slice(0, 8).map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span>{p.name || p.process_name || p.title || "Process"}</span>
                    {p.owner && <p className="text-xs text-muted-foreground">Owner: {p.owner}</p>}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No processes defined</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Resource Allocation */}
      <CollapsibleSection
        title="Resource Allocation"
        icon={<Users className="h-4 w-4 text-iw-forest-mid" />}
        count={resources.length}
        countLabel="resources"
        defaultOpen
      >
        {resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.slice(0, 12).map((r: any) => (
              <div key={r.id} className="border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {r.name || r.resource_name || r.title || r.team || "Resource"}
                  </span>
                  <span className="text-xs font-semibold">
                    {r.allocation_percent != null ? `${r.allocation_percent}%` : "—"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${
                      (r.allocation_percent || 0) >= 90
                        ? "bg-iw-red"
                        : (r.allocation_percent || 0) >= 70
                          ? "bg-iw-gold"
                          : "bg-iw-forest-bright"
                    }`}
                    style={{ width: `${Math.min(r.allocation_percent || 0, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{r.department || r.role || "—"}</span>
                  {r.utilization != null && <span>Utilization: {r.utilization}%</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No resource allocations tracked</p>
        )}
      </CollapsibleSection>

      {/* Vendor Management */}
      <CollapsibleSection
        title="Vendor Management"
        icon={<Building className="h-4 w-4 text-iw-slate" />}
        count={vendors.length}
        countLabel="vendors"
      >
        {vendors.length > 0 ? (
          <div className="space-y-2">
            {vendors.slice(0, 10).map((v: any) => (
              <div
                key={v.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {v.name || v.vendor_name || v.company || "Vendor"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[v.category, v.type, v.contract_type].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {v.spend != null && (
                    <span className="text-xs text-muted-foreground">
                      ${(v.spend / 1000).toFixed(0)}K
                    </span>
                  )}
                  <StatusBadge status={v.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No vendors tracked</p>
        )}
      </CollapsibleSection>

      {/* Operational Metrics */}
      <CollapsibleSection
        title="Operational Metrics"
        icon={<BarChart3 className="h-4 w-4 text-iw-forest-bright" />}
        count={opsMetrics.length}
        countLabel="metrics"
      >
        {opsMetrics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {opsMetrics.slice(0, 12).map((m: any) => (
              <div key={m.id} className="border rounded-lg p-4 bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {m.category || m.department || "Metric"}
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-bold">{m.current_value ?? "—"}</span>
                  {m.target_value != null && (
                    <span className="text-xs text-muted-foreground mb-1">/ {m.target_value}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {m.trend && <TrendIndicator trend={m.trend} />}
                  {m.unit && <span className="text-xs text-muted-foreground">{m.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No operational metrics tracked</p>
        )}
      </CollapsibleSection>

      {/* Projects & Initiatives */}
      <CollapsibleSection
        title="Projects & Cross-Dept Initiatives"
        icon={<Activity className="h-4 w-4 text-iw-gold" />}
        count={projects.length + initiatives.length}
        countLabel="items"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Projects ({activeProjects.length} active)
            </h4>
            {projects.length > 0 ? (
              projects.slice(0, 8).map((p: any) => (
                <div key={p.id} className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate mr-2">
                      {p.name || p.project_name || p.title || "Project"}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {p.progress_percent != null ? `${p.progress_percent}%` : p.status || "—"}
                    </span>
                  </div>
                  {p.progress_percent != null && (
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-iw-slate-mid rounded-full"
                        style={{ width: `${Math.min(p.progress_percent, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No projects</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Cross-Dept Initiatives ({initiatives.length})
            </h4>
            {initiatives.length > 0 ? (
              initiatives.slice(0, 8).map((i: any) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {i.name || i.initiative_name || i.title || "Initiative"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={i.status} />
                    {i.impact_score != null && (
                      <span className="text-xs text-muted-foreground">
                        impact: {i.impact_score}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No initiatives</p>
            )}
          </div>
        </div>
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
    s === "active" || s === "running" || s === "live" || s === "enabled" || s === "on_track"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
      : s === "paused" || s === "pending" || s === "draft"
        ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
        : s === "completed" || s === "done" || s === "won"
          ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80"
          : s === "failed" || s === "lost" || s === "blocked" || s === "at_risk"
            ? "bg-iw-red/10 text-iw-red dark:bg-iw-red/90/20 dark:text-iw-red/70"
            : "bg-muted text-muted-foreground";

  return <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{status}</span>;
}

function TrendIndicator({ trend }: { trend: string }) {
  const t = trend.toLowerCase();
  if (t === "up" || t === "increasing" || t === "positive") {
    return <TrendingUp className="h-3 w-3 text-iw-forest-bright" />;
  }
  if (t === "down" || t === "decreasing" || t === "negative") {
    return <TrendingUp className="h-3 w-3 text-iw-red rotate-180" />;
  }
  return <Activity className="h-3 w-3 text-muted-foreground" />;
}

export default OperationsCenterView;
