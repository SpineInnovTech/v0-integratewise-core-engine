"use client";

import { useState } from "react";
import {
  useBiExecutive,
  useBiFounder,
  useBiSignals,
  useBiDecisions,
  useBiAckSignal,
} from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Building2,
  Target,
  Zap,
  Brain,
  ArrowRight,
  Loader2,
} from "lucide-react";

function MetricCard({
  value,
  label,
  sublabel,
  trend,
  trendLabel,
  icon,
  color = "#3d7a50",
  isLoading,
}: any) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
            {trend && trendLabel && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" ? (
                  <TrendingUp className="w-3 h-3 text-iw-forest-bright" />
                ) : trend === "down" ? (
                  <TrendingDown className="w-3 h-3 text-iw-red" />
                ) : null}
                <span
                  className={`text-xs ${trend === "up" ? "text-iw-forest-bright" : trend === "down" ? "text-iw-red" : "text-muted-foreground"}`}
                >
                  {trendLabel}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: color + "15" }}
            >
              <div style={{ color }}>{icon}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BiDashboard() {
  const [activeTab, setActiveTab] = useState<"executive" | "founder" | "signals">("executive");

  const { data: executiveData, isLoading: execLoading } = useBiExecutive();
  const { data: founderData, isLoading: founderLoading } = useBiFounder();
  const { data: signalsData, isLoading: signalsLoading } = useBiSignals(false);
  const { data: decisionsData, isLoading: decisionsLoading } = useBiDecisions();
  const ackSignal = useBiAckSignal();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    }).format(val);

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-iw-gold" />
            Business Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Live data from Cloudflare D1 — No Supabase required
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { id: "executive", label: "Executive", icon: Building2 },
            { id: "founder", label: "Founder", icon: Target },
            { id: "signals", label: "Signals", icon: Zap },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Executive Tab */}
      {activeTab === "executive" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total ARR"
              value={execLoading ? "..." : formatCurrency(executiveData?.metrics?.totalARR || 0)}
              sublabel="Annual Recurring Revenue"
              trend="up"
              trendLabel="+14.3% vs last month"
              icon={<TrendingUp className="w-5 h-5" />}
              color="#3d7a50"
              isLoading={execLoading}
            />
            <MetricCard
              label="At Risk ARR"
              value={execLoading ? "..." : formatCurrency(executiveData?.metrics?.atRiskARR || 0)}
              sublabel="Revenue at risk"
              trend="down"
              trendLabel="-2.1% vs last month"
              icon={<AlertTriangle className="w-5 h-5" />}
              color="#ef4444"
              isLoading={execLoading}
            />
            <MetricCard
              label="Avg Health Score"
              value={execLoading ? "..." : formatPercent(executiveData?.metrics?.avgHealth || 0)}
              sublabel="Across all accounts"
              trend="up"
              trendLabel="+3.2% vs last month"
              icon={<CheckCircle className="w-5 h-5" />}
              color="#3d7a50"
              isLoading={execLoading}
            />
            <MetricCard
              label="Expansion Potential"
              value={
                execLoading
                  ? "..."
                  : formatCurrency(executiveData?.metrics?.expansionPotential || 0)
              }
              sublabel="Upsell pipeline"
              trend="up"
              trendLabel="+8.7% vs last month"
              icon={<Zap className="w-5 h-5" />}
              color="#b8943f"
              isLoading={execLoading}
            />
          </div>

          {/* Department Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Department Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {execLoading ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : (
                  executiveData?.departments?.map((dept: any) => (
                    <div key={dept.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{dept.department}</span>
                          <span className="text-sm text-muted-foreground">
                            {dept.health_score}/100
                          </span>
                        </div>
                        <Progress value={dept.health_score} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        {dept.risk_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {dept.risk_count} risks
                          </Badge>
                        )}
                        {dept.active_initiatives > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {dept.active_initiatives} initiatives
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Executive Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Executive Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {execLoading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : (
                  executiveData?.executive_metrics?.map((metric: any) => (
                    <div key={metric.id} className="border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground uppercase">
                        {metric.metric_name}
                      </p>
                      <p className="text-xl font-bold mt-1">
                        {metric.metric_name.includes("Rate") ||
                        metric.metric_name.includes("Margin")
                          ? `${metric.metric_value}%`
                          : metric.metric_value}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress
                          value={(metric.metric_value / metric.target_value) * 100}
                          className="h-1 flex-1"
                        />
                        <span className="text-xs text-muted-foreground">
                          {metric.target_value} target
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Founder Tab */}
      {activeTab === "founder" && (
        <div className="space-y-6">
          {founderLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            Object.entries(founderData?.categories || {}).map(
              ([category, metrics]: [string, any]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {metrics.map((metric: any) => (
                        <div key={metric.id} className="border rounded-lg p-4">
                          <p className="text-xs text-muted-foreground">{metric.metric_name}</p>
                          <p className="text-xl font-bold mt-1">
                            {metric.metric_name.includes("Rate") ||
                            metric.metric_name.includes("Multiple")
                              ? metric.current_value
                              : formatCurrency(metric.current_value)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {metric.change_percent > 0 ? (
                              <TrendingUp className="w-4 h-4 text-iw-forest-bright" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-iw-red" />
                            )}
                            <span
                              className={`text-sm ${metric.change_percent > 0 ? "text-iw-forest-bright" : "text-iw-red"}`}
                            >
                              {metric.change_percent > 0 ? "+" : ""}
                              {metric.change_percent}%
                            </span>
                            <Badge
                              variant={metric.status === "positive" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {metric.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            )
          )}
        </div>
      )}

      {/* Signals Tab */}
      {activeTab === "signals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Cross-Department Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {signalsLoading ? (
                    <>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </>
                  ) : (
                    signalsData?.signals?.map((signal: any) => (
                      <div key={signal.id} className="border rounded-lg p-4 flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            signal.severity === "high"
                              ? "bg-red-500"
                              : signal.severity === "medium"
                                ? "bg-yellow-500"
                                : "bg-iw-forest-bright"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{signal.signal_type}</p>
                          <p className="text-xs text-muted-foreground">{signal.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {signal.source_department}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              → {signal.target_department}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => ackSignal.mutate(signal.id)}
                              disabled={ackSignal.isPending}
                            >
                              {ackSignal.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Ack"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Decisions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Strategic Decisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {decisionsLoading ? (
                    <>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </>
                  ) : (
                    decisionsData?.decisions?.map((decision: any) => (
                      <div key={decision.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{decision.decision_title}</p>
                          <Badge
                            variant={decision.status === "approved" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {decision.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Impact: {decision.impact_score}/100
                          </span>
                          {decision.decided_by && (
                            <span className="text-xs text-muted-foreground">
                              By: {decision.decided_by}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
