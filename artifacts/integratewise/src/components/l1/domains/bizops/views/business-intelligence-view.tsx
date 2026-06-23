/**
 * BizOps — Business Intelligence / Analytics View
 *
 * Covers: Cross-department metrics, trend analysis, predictive insights,
 *         benchmark reporting, data source management
 */
import { useState } from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import {
  BarChart3,
  TrendingUp,
  Brain,
  Target,
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  LineChart,
} from "lucide-react";

const ENTITY_TYPES = [
  "kpi",
  "ops_metric",
  "generated_insight",
  "data_source",
  "report",
  "dashboard_config",
] as const;

export function BusinessIntelligenceView() {
  const {
    data: batch,
    isLoading,
    refetch,
  } = useWorkspaceEntitiesBatch([...ENTITY_TYPES], {
    limit: 200,
  });

  const kpis = batch.kpi ?? [];
  const opsMetrics = batch.ops_metric ?? [];
  const insights = batch.generated_insight ?? [];
  const dataSources = batch.data_source ?? [];
  const reports = batch.report ?? [];

  const criticalInsights = insights.filter(
    (i: any) => i.severity === "critical" || i.severity === "high"
  );
  const predictiveInsights = insights.filter(
    (i: any) => i.type === "predictive" || i.category === "prediction"
  );
  const healthyDataSources = dataSources.filter(
    (d: any) => d.status === "healthy" || d.status === "connected"
  );

  const allMetrics = [...kpis, ...opsMetrics];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading intelligence data...</p>
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
            <Brain className="h-5 w-5 text-[var(--iw-purple)]" />
            Business Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            Cross-department metrics, trends, predictive insights, and benchmarks
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
          label="Total Metrics"
          value={allMetrics.length}
          icon={<BarChart3 className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="AI Insights"
          value={insights.length}
          icon={<Brain className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Predictions"
          value={predictiveInsights.length}
          icon={<LineChart className="h-4 w-4" />}
          color="text-iw-forest-mid"
        />
        <MiniKPI
          label="Data Sources"
          value={`${healthyDataSources.length}/${dataSources.length}`}
          icon={<Database className="h-4 w-4" />}
          color="text-iw-slate"
        />
      </div>

      {/* Critical Insights */}
      {criticalInsights.length > 0 && (
        <div className="border border-iw-red/20 dark:border-iw-red/80 rounded-lg p-4 bg-iw-red/5 dark:bg-iw-red/90/10">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-iw-red dark:text-iw-red/70">
            <AlertTriangle className="h-4 w-4" /> Critical Insights
          </h3>
          <div className="space-y-2">
            {criticalInsights.slice(0, 5).map((i: any, idx: number) => (
              <div key={i.id || idx} className="text-sm">
                <p className="font-medium">{i.title || i.content || i.insight_text || "Insight"}</p>
                {i.recommended_action && (
                  <p className="text-xs text-muted-foreground mt-0.5">{i.recommended_action}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Department Metrics */}
      <CollapsibleSection
        title="Cross-Department Metrics"
        icon={<BarChart3 className="h-4 w-4 text-iw-slate-mid" />}
        count={allMetrics.length}
        countLabel="metrics"
        defaultOpen
      >
        {allMetrics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMetrics.slice(0, 15).map((m: any) => (
              <div key={m.id} className="border rounded-lg p-4 bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {m.department || m.category || "Metric"}
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-bold">{m.current_value ?? m.value ?? "—"}</span>
                  {m.target_value != null && (
                    <span className="text-xs text-muted-foreground mb-1">/ {m.target_value}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {m.trend && <TrendIndicator trend={m.trend} />}
                    {m.unit && <span className="text-xs text-muted-foreground">{m.unit}</span>}
                  </div>
                  {m.health && <StatusBadge status={m.health} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No metrics tracked across departments
          </p>
        )}
      </CollapsibleSection>

      {/* Predictive Insights */}
      <CollapsibleSection
        title="Predictive Insights"
        icon={<LineChart className="h-4 w-4 text-iw-forest-mid" />}
        count={predictiveInsights.length}
        countLabel="predictions"
        defaultOpen
      >
        {predictiveInsights.length > 0 ? (
          <div className="space-y-3">
            {predictiveInsights.slice(0, 8).map((i: any, idx: number) => (
              <div key={i.id || idx} className="border rounded-lg p-4 bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {i.title || i.content || i.insight_text || "Prediction"}
                    </p>
                    {i.summary && <p className="text-xs text-muted-foreground mt-1">{i.summary}</p>}
                  </div>
                  {i.confidence != null && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-secondary shrink-0">
                      {Math.round(i.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                {i.recommended_action && (
                  <div className="mt-2 p-2 bg-secondary/50 rounded text-xs">
                    <span className="font-semibold">Action:</span> {i.recommended_action}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No predictive insights yet. AI-generated predictions will appear here once data flows
            through the Spine.
          </p>
        )}
      </CollapsibleSection>

      {/* Trend Analysis */}
      <CollapsibleSection
        title="Trend Analysis & Benchmarks"
        icon={<TrendingUp className="h-4 w-4 text-iw-slate-mid" />}
        count={insights.filter((i: any) => i.type === "trend" || i.category === "benchmark").length}
        countLabel="trends"
      >
        {insights.filter((i: any) => i.type === "trend" || i.category === "benchmark").length >
        0 ? (
          <div className="space-y-2">
            {insights
              .filter((i: any) => i.type === "trend" || i.category === "benchmark")
              .slice(0, 8)
              .map((i: any, idx: number) => (
                <div
                  key={i.id || idx}
                  className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">
                      {i.title || i.content || i.insight_text || "Trend"}
                    </span>
                    {i.department && (
                      <p className="text-xs text-muted-foreground">{i.department}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {i.trend_direction && <TrendIndicator trend={i.trend_direction} />}
                    {i.benchmark_comparison && (
                      <span className="text-xs text-muted-foreground">
                        {i.benchmark_comparison}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No trend analysis available</p>
        )}
      </CollapsibleSection>

      {/* Data Sources */}
      <CollapsibleSection
        title="Data Source Management"
        icon={<Database className="h-4 w-4 text-iw-slate" />}
        count={dataSources.length}
        countLabel="sources"
      >
        {dataSources.length > 0 ? (
          <div className="space-y-2">
            {dataSources.slice(0, 10).map((d: any) => (
              <div
                key={d.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {d.name || d.source_name || d.title || "Data Source"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[d.type, d.department].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.last_sync && (
                    <span className="text-xs text-muted-foreground">
                      Synced{" "}
                      {new Date(d.last_sync).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No data sources configured</p>
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
    s === "healthy" ||
    s === "connected"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
      : s === "paused" ||
          s === "pending" ||
          s === "draft" ||
          s === "in_progress" ||
          s === "degraded"
        ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
        : s === "completed" || s === "done"
          ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80"
          : s === "failed" ||
              s === "lost" ||
              s === "blocked" ||
              s === "at_risk" ||
              s === "disconnected" ||
              s === "error"
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

export default BusinessIntelligenceView;
