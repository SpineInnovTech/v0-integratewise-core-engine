/**
 * BizOps — Today view with L2 insights + live entity metrics
 *
 * Cross-functional daily overview for BizOps operators.
 * Metrics are pulled from real entity counts (not hardcoded).
 */
import { useState } from "react";
import {
  Briefcase,
  GitBranch,
  BarChart3,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Zap,
  X,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useL2Insights, useL2DismissInsight } from "@/hooks/use-l2";
import { useSpineEntityCounts } from "@/hooks/use-spine-entities";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import type { L2Insight } from "@/lib/l2-client";

function BizOpsInsightCard({
  insight,
  onDismiss,
  isLoading,
}: {
  insight: L2Insight;
  onDismiss: () => void;
  isLoading: boolean;
}) {
  return (
    <Card className="border-l-4 border-l-[var(--iw-forest)] bg-gradient-to-r from-[var(--iw-forest)]/10 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-iw-slate/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-iw-slate-mid" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-1 text-xs">
                Suggested by IntegrateWise
              </Badge>
              <CardTitle className="text-sm font-semibold">{insight.title}</CardTitle>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insight.whyItMatters && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Why it matters
            </h4>
            <p className="text-sm text-gray-700">{insight.whyItMatters}</p>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {new Date(insight.createdAt).toLocaleDateString()}
          {insight.severity && (
            <Badge
              variant={
                insight.severity === "high"
                  ? "destructive"
                  : insight.severity === "medium"
                    ? "default"
                    : "secondary"
              }
              className="ml-auto"
            >
              {insight.severity} priority
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BizOpsTodayView() {
  const auth = useAuth();
  const l2Ctx = auth.user?.id
    ? { userId: auth.user.id, domain: "BIZOPS", viewId: "bizops-today" }
    : null;
  const { data: insights = [], isLoading } = useL2Insights(l2Ctx);
  const dismissMutation = useL2DismissInsight(l2Ctx);

  // Live entity counts — replaces hardcoded metrics
  const { counts } = useSpineEntityCounts(["project", "workflow", "task", "ops_metric"]);

  // Fetch tasks and projects for priority actions computation
  const { data: batch } = useWorkspaceEntitiesBatch(["task", "project", "generated_insight"], {
    limit: 100,
  });
  const tasks = batch.task ?? [];
  const projects = batch.project ?? [];
  const entityInsights = batch.generated_insight ?? [];

  // Compute live metrics
  const openTasks = tasks.filter((t: any) => t.status !== "completed" && t.status !== "done");
  const tasksDueToday = openTasks.filter((t: any) => {
    if (!t.due_date) return false;
    const due = new Date(t.due_date);
    const now = new Date();
    return (
      due.getFullYear() === now.getFullYear() &&
      due.getMonth() === now.getMonth() &&
      due.getDate() === now.getDate()
    );
  });
  const activeProjects = projects.filter(
    (p: any) => p.status === "active" || p.status === "in_progress" || p.status === "on_track"
  );
  const atRiskProjects = projects.filter(
    (p: any) =>
      p.status === "at_risk" ||
      (p.progress_percent != null &&
        p.progress_percent < 40 &&
        p.end_date &&
        new Date(p.end_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000)
  );
  const criticalInsights = entityInsights.filter(
    (i: any) => i.severity === "critical" || i.severity === "high"
  );
  const activeWorkflows = counts.workflow || 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const metricsData = [
    {
      icon: Briefcase,
      value: activeProjects.length || counts.project || 0,
      label: "Active Projects",
      color: "text-iw-slate-mid",
    },
    {
      icon: AlertTriangle,
      value: criticalInsights.length,
      label: "Critical Signals",
      color: "text-iw-red",
    },
    {
      icon: GitBranch,
      value: activeWorkflows,
      label: "Workflows",
      color: "text-iw-slate-mid",
    },
    {
      icon: CheckCircle,
      value: tasksDueToday.length,
      label: "Tasks Due Today",
      color: "text-iw-gold",
    },
    {
      icon: Activity,
      value: counts.ops_metric || 0,
      label: "Tracked Metrics",
      color: "text-iw-forest-bright",
    },
    {
      icon: TrendingUp,
      value: `${openTasks.length} open`,
      label: "Total Tasks",
      color: "text-iw-forest-bright",
    },
  ];

  return (
    <div className="p-6 min-h-full overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{today}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Operations Today</h1>
        <p className="text-sm text-gray-600">
          Cross-functional overview of projects, workflows, tasks, and signals.
        </p>
      </div>

      {insights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-iw-slate-mid" />
            AI Insights for Today
          </h2>
          <div className="space-y-4">
            {insights.map((insight: L2Insight) => (
              <BizOpsInsightCard
                key={insight.id}
                insight={insight}
                onDismiss={() => dismissMutation.mutate(insight.id)}
                isLoading={dismissMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Operations Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metricsData.map(({ icon: Icon, value, label, color }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-600">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalInsights.length > 0 && (
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-iw-red" />
                  <span className="text-sm font-semibold text-iw-red">
                    {criticalInsights.length} critical signal
                    {criticalInsights.length !== 1 ? "s" : ""} need attention
                  </span>
                </div>
                <div className="space-y-1">
                  {criticalInsights.slice(0, 3).map((i: any, idx: number) => (
                    <p key={idx} className="text-sm text-gray-600">
                      {i.title || i.content || i.insight_text || "Signal"}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {atRiskProjects.length > 0 && (
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-iw-gold" />
                  <span className="text-sm font-semibold text-iw-gold">
                    {atRiskProjects.length} project{atRiskProjects.length !== 1 ? "s" : ""} at risk
                  </span>
                </div>
                <div className="space-y-1">
                  {atRiskProjects.slice(0, 3).map((p: any, idx: number) => (
                    <p key={idx} className="text-sm text-gray-600">
                      {p.name || p.project_name || p.title || "Project"}{" "}
                      {p.progress_percent != null ? `(${p.progress_percent}% done)` : ""}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {criticalInsights.length === 0 && atRiskProjects.length === 0 && (
            <Card className="border-l-4 border-l-green-500 col-span-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-iw-forest-bright" />
                  <span className="text-sm font-semibold text-iw-forest">
                    All clear — no critical actions needed right now
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
