"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Settings2,
  Plus,
  Users,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  predictiveAnalytics,
  DashboardConfig,
  DashboardWidget,
} from "@/clients/analytics/predictive-analytics";
import { useRealtime } from "@/clients/realtime/realtime-service";

interface CustomDashboardProps {
  dashboardId?: string;
  context?: { category?: string };
}

export default function CustomDashboard({ dashboardId, context = {} }: CustomDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const { isConnected, presence, sendUpdate } = useRealtime(
    `dashboard-${dashboardId || "default"}`
  );

  useEffect(() => {
    loadDashboard();
    loadInsights();
  }, [dashboardId, context]);

  const loadDashboard = async () => {
    if (dashboardId) {
      const data = await predictiveAnalytics.getDashboard(dashboardId);
      setDashboard(data);
    } else {
      const defaultDashboard = await predictiveAnalytics.createDashboard({
        name: "Strategic Intelligence",
        owner: "current-user",
        context: context?.category || "general",
        widgets: [
          {
            id: "health-metric",
            type: "metric",
            title: "Account Health",
            dataSource: "spine.accounts",
            config: { metric: "health_score", aggregation: "average" },
            position: { x: 0, y: 0, width: 4, height: 2 },
          },
          {
            id: "churn-prediction",
            type: "prediction",
            title: "Churn Risk Prediction",
            dataSource: "analytics.churn",
            config: { timeHorizon: 30 },
            position: { x: 4, y: 0, width: 4, height: 2 },
          },
          {
            id: "activity-chart",
            type: "chart",
            title: "Activity Trends",
            dataSource: "spine.tasks",
            config: { chartType: "line", timeRange: "30d" },
            position: { x: 8, y: 0, width: 4, height: 2 },
          },
        ],
      });
      setDashboard(defaultDashboard);
    }
  };

  const loadInsights = async () => {
    try {
      const data = await predictiveAnalytics.generateInsights(context);
      setInsights(data);
    } catch (e) {
      console.error("Failed to load insights", e);
    }
  };

  const addWidget = (type: string) => {
    if (!dashboard) return;
    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      type: type as any,
      title: `New ${type} Widget`,
      dataSource: "",
      config: {},
      position: { x: 0, y: 0, width: 4, height: 2 },
    };
    const updatedDashboard = { ...dashboard, widgets: [...(dashboard.widgets ?? []), newWidget] };
    setDashboard(updatedDashboard);
    predictiveAnalytics.updateDashboard(dashboard.id, { widgets: updatedDashboard.widgets });
    sendUpdate({ type: "widget_added", widget: newWidget });
  };

  const updateWidget = (widgetId: string, updates: Partial<DashboardWidget>) => {
    if (!dashboard) return;
    const updatedWidgets = (dashboard.widgets ?? []).map((widget) =>
      widget.id === widgetId ? { ...widget, ...updates } : widget
    ) as DashboardWidget[];
    setDashboard({ ...dashboard, widgets: updatedWidgets });
    predictiveAnalytics.updateDashboard(dashboard.id, { widgets: updatedWidgets });
    sendUpdate({ type: "widget_updated", widgetId, updates });
  };

  const removeWidget = (widgetId: string) => {
    if (!dashboard) return;
    const updatedWidgets = (dashboard.widgets ?? []).filter((widget) => widget.id !== widgetId);
    setDashboard({ ...dashboard, widgets: updatedWidgets });
    predictiveAnalytics.updateDashboard(dashboard.id, { widgets: updatedWidgets });
    sendUpdate({ type: "widget_removed", widgetId });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-transparent p-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="text-[10px] font-black uppercase tracking-widest border-iw-slate-mid/30 text-iw-slate-mid bg-iw-slate-mid/5"
            >
              <Zap className="w-3 h-3 mr-1" />
              Live Intelligence
            </Badge>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isConnected ? "bg-iw-forest-bright/10 text-iw-forest-bright" : "bg-iw-red/10 text-iw-red"}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-iw-forest-bright animate-pulse" : "bg-iw-red"}`}
              ></div>
              <span className="text-[10px] font-bold">
                {isConnected ? `${presence.length} active` : "Offline"}
              </span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">{dashboard?.name || "Analytics"}</h1>
          <p className="text-muted-foreground font-medium mt-1">
            Predictive models and real-time portfolio metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            className={`h-11 px-6 rounded-xl font-bold transition-all ${isEditing ? "bg-[var(--iw-forest-mid)] text-white" : "bg-white shadow-sm"}`}
          >
            {isEditing ? (
              <>
                <Zap className="w-4 h-4 mr-2" /> Finish
              </>
            ) : (
              <>
                <Settings2 className="w-4 h-4 mr-2" /> Customize
              </>
            )}
          </Button>
          {isEditing && (
            <div className="flex bg-white shadow-sm border border-border p-1 rounded-xl">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addWidget("metric")}
                className="rounded-lg font-bold"
              >
                <Plus className="w-4 h-4 mr-1" /> Metric
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addWidget("chart")}
                className="rounded-lg font-bold"
              >
                <Plus className="w-4 h-4 mr-1" /> Chart
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addWidget("prediction")}
                className="rounded-lg font-bold"
              >
                <Plus className="w-4 h-4 mr-1" /> Prediction
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Ribbon */}
      <div className="mb-8 p-1 bg-gradient-to-r from-[var(--iw-forest)]/20 via-[var(--iw-gold)]/20 to-[var(--iw-forest)]/20 rounded-2xl">
        <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-md rounded-xl p-4 flex items-start gap-4 border border-white/20">
          <div className="w-10 h-10 rounded-xl bg-iw-slate-mid text-white flex items-center justify-center shrink-0 shadow-lg shadow-[var(--iw-forest)]/20">
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-iw-slate-mid flex items-center gap-2">
              Cognitive Insights
              <Sparkles className="w-3 h-3 animate-pulse" />
            </h3>
            <div className="flex flex-wrap gap-4 mt-2">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex-1 min-w-[300px] flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40 group cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg ${insight.severity === "high" ? "bg-iw-red/10 text-iw-red" : "bg-iw-slate-mid/10 text-iw-forest"}`}
                    >
                      {insight.severity === "high" ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-tight leading-none mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-medium line-clamp-1">
                        {insight.description}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  Analyzing portfolio data for strategic opportunities...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        {(dashboard?.widgets ?? []).map((widget) => (
          <Card
            key={widget.id}
            className={`group hover:shadow-xl transition-all duration-300 rounded-2xl border-border/60 overflow-hidden bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm`}
            style={{
              gridColumn: `span ${widget.position.width}`,
            }}
          >
            <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 rounded-full bg-[var(--iw-forest-mid)]" />
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                  {widget.title}
                </CardTitle>
              </div>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWidget(widget.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <WidgetRenderer
                widget={widget}
                context={context}
                isEditing={isEditing}
                onUpdate={updateWidget}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WidgetRenderer({
  widget,
  context,
  isEditing,
  onUpdate,
}: {
  widget: DashboardWidget;
  context: any;
  isEditing: boolean;
  onUpdate: (id: string, updates: Partial<DashboardWidget>) => void;
}) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadWidgetData();
  }, [widget]);

  const loadWidgetData = async () => {
    switch (widget.type) {
      case "metric":
        setData({ value: 85.2, trend: "+5.1%", label: widget.config.metric });
        break;
      case "prediction":
        try {
          const prediction = await predictiveAnalytics.predictForecast("account_health", context);
          setData(prediction);
        } catch (e) {
          setData({ message: "Insufficient data" });
        }
        break;
      case "chart":
        setData({
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          values: [65, 72, 78, 82, 85],
        });
        break;
      default:
        setData({ message: "Widget data not available" });
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={widget.title}
          onChange={(e) => onUpdate(widget.id, { title: e.target.value })}
          className="w-full p-2 text-xs font-bold bg-secondary/30 border-none rounded-lg focus:ring-1 focus:ring-[var(--iw-gold)]"
          placeholder="Widget title"
        />
        <input
          type="text"
          value={widget.dataSource}
          onChange={(e) => onUpdate(widget.id, { dataSource: e.target.value })}
          className="w-full p-2 text-xs bg-secondary/30 border-none rounded-lg focus:ring-1 focus:ring-[var(--iw-gold)]"
          placeholder="Data source"
        />
      </div>
    );
  }

  if (!data) return <Skeleton className="h-24 w-full" />;

  switch (widget.type) {
    case "metric":
      return (
        <div className="text-center py-4">
          <div className="text-4xl font-black tracking-tighter text-[var(--iw-forest-mid)]">
            {data.value}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
            {data.label}
          </div>
          <div className="text-xs font-bold text-iw-forest-bright mt-2 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {data.trend}
          </div>
        </div>
      );

    case "prediction":
      return (
        <div className="py-2">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-3xl font-black tracking-tighter">
                {data.predictedValue?.toFixed(1) || "N/A"}
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Target Score
              </div>
            </div>
            <div className="text-right">
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase tracking-widest text-iw-forest-bright border-emerald-500/20 bg-iw-forest-bright/5"
              >
                {Math.round((data.confidence || 0) * 100)}% Confidence
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            {data.factors?.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-muted-foreground">{f.factor}</span>
                <span className={f.impact > 0 ? "text-iw-forest-bright" : "text-iw-red"}>
                  {f.impact > 0 ? "+" : ""}
                  {Math.round(f.impact * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case "chart":
      return (
        <div className="pt-4">
          <div className="h-24 flex items-end justify-between gap-1">
            {data.values.map((value: number, index: number) => (
              <div key={index} className="flex-1 flex flex-col items-center group cursor-pointer">
                <div
                  className="bg-iw-slate-mid/20 group-hover:bg-iw-slate-mid w-full rounded-t-sm transition-all"
                  style={{ height: `${(value / 100) * 80}px` }}
                ></div>
                <span className="text-[8px] font-black text-muted-foreground mt-2 uppercase tracking-tighter">
                  {data.labels[index]}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="text-xs text-muted-foreground italic text-center py-8">{data.message}</div>
      );
  }
}
