/**
 * BizOps — Strategic Hub
 * Goals, values, tools registry, marketing strategy, ROI mapping.
 * All tabs wired to real entity data or show proper empty states.
 */
import { useState, useMemo } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Zap,
  Heart,
  Compass,
  Loader2,
} from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import { formatCurrency, type StrategicGoal, type ROIMapping } from "./bizops-data";

interface CompanyValue {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface StrategyItem {
  id: string;
  label: string;
  value: string;
  category?: string;
}

/** Normalize raw entity into CompanyValue */
function normalizeValue(raw: any): CompanyValue {
  const data = raw.data || {};
  return {
    id: raw.id || crypto.randomUUID(),
    title: raw.name || data.title || data.name || "Untitled Value",
    description: data.description || data.desc || "",
    icon: data.icon || data.emoji || "",
  };
}

/** Normalize raw entity into StrategyItem */
function normalizeStrategy(raw: any): StrategyItem {
  const data = raw.data || {};
  return {
    id: raw.id || crypto.randomUUID(),
    label: raw.name || data.label || data.name || data.title || "Untitled",
    value: data.value || data.description || data.content || "",
    category: data.category || data.type || "",
  };
}

export function StrategicHubView() {
  const { data: goals, isLoading } = useWorkspaceEntities<StrategicGoal>("okr");
  const { data: roiItems } = useWorkspaceEntities<ROIMapping>("kpi");
  const { data: rawValues } = useWorkspaceEntities("business_context");
  const { data: rawStrategy } = useWorkspaceEntities("strategic_objective");
  const [activeTab, setActiveTab] = useState<"goals" | "values" | "strategy" | "roi">("goals");

  const values = useMemo(() => rawValues.map(normalizeValue), [rawValues]);
  const strategyItems = useMemo(() => rawStrategy.map(normalizeStrategy), [rawStrategy]);

  const statusIcon = (s: StrategicGoal["status"]) => {
    if (s === "on-track") return <CheckCircle className="w-4 h-4 text-[var(--iw-success)]" />;
    if (s === "at-risk") return <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)]" />;
    if (s === "behind") return <AlertTriangle className="w-4 h-4 text-[var(--iw-danger)]" />;
    return <CheckCircle className="w-4 h-4 text-[var(--iw-forest-mid)]" />;
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--iw-purple)]" /> Strategic Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Goals, values, strategy, and ROI mapping
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        {(["goals", "values", "strategy", "roi"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "roi" ? "ROI Map" : tab}
          </button>
        ))}
      </div>

      {activeTab === "goals" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : goals.length > 0 ? (
            goals.map((goal) => (
              <div key={goal.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    {statusIcon(goal.status)}
                    <div>
                      <p className="font-semibold text-sm">{goal.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-lg font-bold"
                      style={{
                        color:
                          goal.progress >= 70
                            ? "var(--iw-success)"
                            : goal.progress >= 40
                              ? "var(--iw-warning)"
                              : "var(--iw-danger)",
                      }}
                    >
                      {goal.progress}%
                    </span>
                    <p className="text-[10px] text-muted-foreground">progress</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${goal.progress}%`,
                      backgroundColor:
                        goal.progress >= 70
                          ? "var(--iw-success)"
                          : goal.progress >= 40
                            ? "var(--iw-warning)"
                            : "var(--iw-danger)",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Owner: {goal.owner}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Due {goal.dueDate}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No goals yet. Add your first strategic goal.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "values" && (
        <div>
          {values.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((v) => (
                <div key={v.id} className="bg-card border border-border rounded-lg p-5">
                  {v.icon && <div className="text-3xl mb-3">{v.icon}</div>}
                  <h3 className="font-semibold mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-semibold mb-1">No company values defined</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Define your company values to align team decisions. Values will appear here once
                added to your workspace.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "strategy" && (
        <div>
          {strategyItems.length > 0 ? (
            <div className="space-y-4">
              {strategyItems.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {item.category || item.label}
                  </p>
                  <p className="text-sm">{item.value || item.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Compass className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-semibold mb-1">No strategy defined</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Define your ICP, positioning, and go-to-market channels. Strategy items will appear
                here once added to your workspace.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "roi" && (
        <div className="space-y-3">
          {roiItems.length > 0 ? (
            roiItems.map((item) => (
              <div key={item.initiative} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{item.initiative}</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.status === "active" ? "bg-[var(--iw-success)]/10 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground"}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: "Investment", value: formatCurrency(item.investment) },
                    { label: "Revenue", value: formatCurrency(item.revenue) },
                    {
                      label: "ROI",
                      value: `${item.roi}%`,
                      color: item.roi > 100 ? "var(--iw-success)" : "var(--iw-warning)",
                    },
                    {
                      label: "Effort",
                      value: item.effort,
                      color:
                        item.effort === "low"
                          ? "var(--iw-success)"
                          : item.effort === "medium"
                            ? "var(--iw-warning)"
                            : "var(--iw-danger)",
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-2 bg-secondary/50 rounded-lg">
                      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
                      <p className="text-sm font-bold capitalize" style={{ color }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No ROI mappings yet. Add initiatives to track return on investment.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StrategicHubView;
