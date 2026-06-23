/**
 * COO View — Operations command center
 */
import React from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { Settings2, GitBranch, BarChart3, Zap, CheckCircle2, AlertTriangle } from "lucide-react";

export function COOView() {
  const { data: batch } = useWorkspaceEntitiesBatch([
    "workflow",
    "cross_dept_initiative",
    "kpi",
    "ops_metric",
    "generated_insight",
    "task",
  ]);
  const workflows = batch.workflow ?? [];
  const initiatives = batch.cross_dept_initiative ?? [];
  const kpis = batch.kpi ?? [];
  const metrics = batch.ops_metric ?? [];
  const insights = batch.generated_insight ?? [];
  const tasks = batch.task ?? [];

  const activeWorkflows = workflows.filter(
    (w: any) => w.status === "active" || w.status === "running"
  );
  const completedTasks = tasks.filter((t: any) => t.status === "completed" || t.status === "done");
  const opsSignals = insights.filter(
    (i: any) => i.category === "operations" || i.entity_type === "workflow"
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-slate-600" /> COO Command Center
        </h2>
        <p className="text-sm text-muted-foreground">Operations performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniKPI
          label="Active Workflows"
          value={activeWorkflows.length}
          icon={<GitBranch className="h-4 w-4" />}
        />
        <MiniKPI
          label="Initiatives"
          value={initiatives.length}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MiniKPI
          label="KPIs Tracked"
          value={kpis.length}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MiniKPI
          label="Ops Metrics"
          value={metrics.length}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MiniKPI
          label="Tasks Done"
          value={completedTasks.length}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MiniKPI
          label="Ops Signals"
          value={opsSignals.length}
          icon={<Zap className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
      </div>

      {initiatives.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Cross-Department Initiatives</h3>
          {initiatives.slice(0, 8).map((init: any) => (
            <div
              key={init.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{init.title || init.name || "Initiative"}</p>
                <p className="text-xs text-muted-foreground">
                  {init.department || init.owner || ""}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${init.status === "active" ? "bg-iw-forest/10 text-iw-forest" : init.status === "blocked" ? "bg-iw-red/10 text-iw-red" : "bg-gray-100 text-gray-700"}`}
              >
                {init.status || "active"}
              </span>
            </div>
          ))}
        </div>
      )}

      {kpis.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">KPI Tracker</h3>
          {kpis.slice(0, 8).map((kpi: any) => (
            <div key={kpi.id} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{kpi.name || kpi.title || "KPI"}</span>
                <span className="text-muted-foreground">
                  {kpi.current || 0} / {kpi.target || 100}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-iw-slate-mid rounded-full"
                  style={{
                    width: `${Math.min(100, ((kpi.current || 0) / (kpi.target || 100)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
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

export default COOView;
