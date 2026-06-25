/**
 * CIO/CTO View — Technology dashboard
 */
import React from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { Cpu, GitBranch, Shield, Zap, Activity, Server } from "lucide-react";

export function CIOCTOView() {
  const { data: batch } = useWorkspaceEntitiesBatch([
    "workflow",
    "ops_metric",
    "generated_insight",
    "incident",
  ]);
  const workflows = batch.workflow ?? [];
  const metrics = batch.ops_metric ?? [];
  const insights = batch.generated_insight ?? [];
  const incidents = batch.incident ?? [];

  const techKeywords = [
    "api",
    "integration",
    "system",
    "uptime",
    "latency",
    "error",
    "deploy",
    "infra",
  ];
  const techMetrics = metrics.filter((m: any) =>
    techKeywords.some((k) => (m.name || m.title || "").toLowerCase().includes(k))
  );
  const techSignals = insights.filter((i: any) =>
    techKeywords.some((k) => (i.title || i.content || "").toLowerCase().includes(k))
  );
  const activeIncidents = incidents.filter(
    (i: any) => i.status === "open" || i.status === "active"
  );
  const integrations = workflows.filter(
    (w: any) => w.type === "integration" || (w.name || "").toLowerCase().includes("sync")
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Cpu className="h-5 w-5 text-iw-forest-bright" /> CIO/CTO Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">Technology landscape</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          label="Integrations"
          value={integrations.length}
          icon={<GitBranch className="h-4 w-4" />}
        />
        <KPI
          label="Active Incidents"
          value={activeIncidents.length}
          icon={<Shield className="h-4 w-4" />}
          color={activeIncidents.length > 0 ? "text-iw-red" : "text-iw-forest-bright"}
        />
        <KPI
          label="Tech Metrics"
          value={techMetrics.length}
          icon={<Activity className="h-4 w-4" />}
        />
        <KPI
          label="Tech Signals"
          value={techSignals.length}
          icon={<Zap className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
      </div>

      {integrations.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Server className="h-4 w-4" /> Integration Landscape
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2">Workflow</th>
                  <th className="text-right">Status</th>
                  <th className="text-right">Executions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.slice(0, 10).map((w: any) => (
                  <tr key={w.id} className="border-b hover:bg-muted/50">
                    <td className="py-2">{w.name || w.title || "Workflow"}</td>
                    <td className="text-right">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${w.status === "active" ? "bg-iw-forest/10 text-iw-forest" : "bg-gray-100 text-gray-700"}`}
                      >
                        {w.status || "active"}
                      </span>
                    </td>
                    <td className="text-right text-muted-foreground">
                      {w.execution_count || w.runs || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {techSignals.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-iw-slate-mid" /> Technology Signals
          </h3>
          {techSignals.slice(0, 5).map((s: any, i: number) => (
            <div key={i} className="py-2 border-b last:border-0 text-sm">
              {s.title || s.content || "Signal"}
            </div>
          ))}
        </div>
      )}

      {techMetrics.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Technology Metrics</h3>
          {techMetrics.slice(0, 8).map((m: any) => (
            <div key={m.id} className="flex justify-between py-1.5 border-b last:border-0 text-sm">
              <span>{m.name || m.title || "Metric"}</span>
              <span className="font-medium">{m.value || m.current || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KPI({
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

export default CIOCTOView;
