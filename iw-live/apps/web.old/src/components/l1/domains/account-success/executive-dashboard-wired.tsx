/**
 * Executive Dashboard (Wired) — Connected to backend via React Query
 * Uses useExecutiveDashboard hook for live data
 */
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckSquare,
  Calendar,
  Users,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { HealthGauge, HealthBadge } from "./health-gauge";
import { useActOnInsight, useSuccessCSPage } from "@/hooks/use-cs-data";
import {
  coverageLabel,
  daysUntil,
  formatCurrency,
  formatDateLabel,
  formatPercent,
  formatRelativeLabel,
  getSection,
  getSectionArray,
  ProjectionAccount,
  ProjectionInsight,
  ProjectionRenewal,
  ProjectionTask,
  sortRenewals,
  sortTasks,
  SuccessSummaryData,
  summarizeProof,
} from "./success-projection-utils";

interface MetricCardProps {
  value: string;
  label: string;
  sublabel?: string;
  trend?: "up" | "down" | "stable";
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  isLoading?: boolean;
}

function MetricCard({
  value,
  label,
  sublabel,
  trend,
  trendLabel,
  icon,
  color = "#3d7a50",
  isLoading,
}: MetricCardProps) {
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
                  className={cn(
                    "text-xs",
                    trend === "up"
                      ? "text-iw-forest-bright"
                      : trend === "down"
                        ? "text-iw-red"
                        : "text-muted-foreground"
                  )}
                >
                  {trendLabel}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface InsightCardProps {
  id: string;
  title: string;
  description: string;
  type: "success" | "warning" | "risk" | "opportunity";
  confidence?: number;
  sources?: string[];
  action?: string;
  onAct?: (id: string, action: string) => void;
}

function InsightCard({
  id,
  title,
  description,
  type,
  confidence,
  sources,
  action,
  onAct,
}: InsightCardProps) {
  const typeConfig = {
    success: {
      icon: CheckSquare,
      color: "text-iw-forest-bright",
      bg: "bg-iw-forest/5 dark:bg-iw-forest/95/20",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-iw-gold",
      bg: "bg-iw-gold/5 dark:bg-iw-gold/95/20",
    },
    risk: { icon: AlertTriangle, color: "text-iw-red", bg: "bg-iw-red/5 dark:bg-iw-red/95/20" },
    opportunity: {
      icon: Lightbulb,
      color: "text-iw-slate-mid",
      bg: "bg-iw-slate-mid/5 dark:bg-iw-slate-mid/95/20",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card className="overflow-hidden">
      <div
        className={cn("p-4 border-l-4", config.bg)}
        style={{ borderLeftColor: config.color.replace("text-", "").replace("-500", "") }}
      >
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5", config.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>

            {(confidence || sources) && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {confidence && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {confidence}% confidence
                  </span>
                )}
                {sources && sources.length > 0 && <span>Sources: {sources.join(", ")}</span>}
              </div>
            )}

            {action && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-2"
                onClick={() => onAct?.(id, action)}
              >
                {action}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface TodayItemProps {
  type: "meeting" | "task" | "deadline" | "milestone";
  title: string;
  time: string;
  priority: "high" | "medium" | "low" | "critical";
  details?: string;
}

function TodayItem({ type, title, time, priority, details }: TodayItemProps) {
  const typeConfig = {
    meeting: {
      icon: Users,
      color: "text-iw-slate-mid",
      bg: "bg-iw-slate/5 dark:bg-iw-slate/95/20",
    },
    task: {
      icon: CheckSquare,
      color: "text-iw-forest-bright",
      bg: "bg-iw-forest/5 dark:bg-iw-forest/95/20",
    },
    deadline: { icon: Clock, color: "text-iw-red", bg: "bg-iw-red/5 dark:bg-iw-red/95/20" },
    milestone: {
      icon: Target,
      color: "text-iw-slate-mid",
      bg: "bg-iw-slate-mid/5 dark:bg-iw-slate-mid/95/20",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const priorityColors = {
    critical: "text-iw-red bg-iw-red/5 dark:bg-iw-red/95/20",
    high: "text-iw-red bg-iw-red/5 dark:bg-iw-red/95/20",
    medium: "text-iw-gold bg-iw-gold/5 dark:bg-iw-gold/95/20",
    low: "text-iw-slate-mid bg-iw-slate/5 dark:bg-iw-slate/95/20",
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          config.bg,
          config.color
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="outline" className={cn("text-[10px] px-1", priorityColors[priority])}>
            {priority}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{time}</span>
          {details && <span>{details}</span>}
        </div>
      </div>
    </div>
  );
}

export function ExecutiveDashboardWired() {
  const overviewQuery = useSuccessCSPage("accounts_overview");
  const renewalsQuery = useSuccessCSPage("renewals");
  const insightsQuery = useSuccessCSPage("ai_insights");
  const tasksQuery = useSuccessCSPage("tasks_actions");
  const actOnInsight = useActOnInsight();
  const isLoading = [overviewQuery, renewalsQuery, insightsQuery, tasksQuery].some(
    (query) => query.isLoading && !query.data
  );
  const error =
    overviewQuery.error || renewalsQuery.error || insightsQuery.error || tasksQuery.error;

  const summarySection = getSection<SuccessSummaryData>(overviewQuery.data, "summary");
  const accountsSection = getSection<ProjectionAccount[]>(overviewQuery.data, "accounts_table");
  const renewalsSection = getSection<ProjectionRenewal[]>(renewalsQuery.data, "renewals");
  const insightsSection = getSection<ProjectionInsight[]>(insightsQuery.data, "insights");
  const tasksSection = getSection<ProjectionTask[]>(tasksQuery.data, "tasks");

  const accounts = getSectionArray<ProjectionAccount>(overviewQuery.data, "accounts_table");
  const primaryAccount = accounts[0];
  const renewals = sortRenewals(getSectionArray<ProjectionRenewal>(renewalsQuery.data, "renewals"));
  const recentInsights = getSectionArray<ProjectionInsight>(insightsQuery.data, "insights").slice(
    0,
    5
  );
  const tasksDue = sortTasks(getSectionArray<ProjectionTask>(tasksQuery.data, "tasks")).slice(0, 5);

  const summary = summarySection?.data || {
    totalAccounts: accounts.length,
    totalARR: accounts.reduce((sum, account) => sum + Number(account.arr || 0), 0),
    avgHealth:
      accounts.length > 0
        ? accounts.reduce((sum, account) => sum + Number(account.healthScore || 0), 0) /
          accounts.length
        : 0,
    atRiskAccounts: accounts.filter((account) => Number(account.healthScore || 0) < 5).length,
    renewalsTracked: renewals.length,
    activeRisks: 0,
  };

  const atRiskARR = accounts
    .filter(
      (account) =>
        Number(account.healthScore || 0) < 5 ||
        String(account.status || "")
          .toLowerCase()
          .includes("risk")
    )
    .reduce((sum, account) => sum + Number(account.arr || 0), 0);
  const expansionPotential = renewals.reduce(
    (sum, renewal) => sum + Number(renewal.expansionPotential || 0),
    0
  );
  const proof = summarizeProof(
    summarySection,
    accountsSection,
    renewalsSection,
    insightsSection,
    tasksSection
  );
  const primaryDaysToRenewal = daysUntil(primaryAccount?.renewalDate);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-iw-red mx-auto" />
          <div>
            <h3 className="font-semibold">Failed to load dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
          <Button variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : primaryAccount ? (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{primaryAccount.name}</h2>
                <HealthBadge score={primaryAccount.healthScore} />
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>{primaryAccount.industry}</span>
                <span>•</span>
                <span>{formatCurrency(primaryAccount.arr)} ARR</span>
                <span>•</span>
                <span className="text-iw-forest-bright">{coverageLabel(accountsSection)}</span>
              </div>
            </>
          ) : (
            <h2 className="text-2xl font-bold">Executive Dashboard</h2>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-24" />
            </>
          ) : primaryAccount ? (
            <>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Renewal</p>
                <p className="font-semibold">{formatDateLabel(primaryAccount.renewalDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="font-semibold text-iw-forest-bright">
                  {formatPercent(primaryAccount.renewalConfidence)}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Health Gauge */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {isLoading ? (
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
            ) : primaryAccount ? (
              <HealthGauge score={primaryAccount.healthScore} size="md" />
            ) : (
              <div className="h-[140px] w-[140px] rounded-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No data</span>
              </div>
            )}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Renewal Confidence</span>
                <span className="text-sm text-muted-foreground">
                  {isLoading ? (
                    <Skeleton className="h-4 w-8 inline-block" />
                  ) : (
                    `${primaryAccount?.renewalConfidence || 0}%`
                  )}
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-2 w-full" />
              ) : (
                <Progress value={primaryAccount?.renewalConfidence || 0} className="h-2" />
              )}
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  Days to renewal:{" "}
                  <strong className="text-foreground">
                    {isLoading ? (
                      <Skeleton className="h-4 w-8 inline-block" />
                    ) : (
                      (primaryDaysToRenewal ?? "—")
                    )}
                  </strong>
                </span>
                <span>
                  ARR:{" "}
                  <strong className="text-foreground">
                    {isLoading ? (
                      <Skeleton className="h-4 w-16 inline-block" />
                    ) : (
                      formatCurrency(primaryAccount?.arr)
                    )}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          value={formatCurrency(summary.totalARR)}
          label="Total ARR"
          trend="up"
          trendLabel={`${summary.totalAccounts} active accounts`}
          icon={<Target className="w-5 h-5" />}
          color="#22c55e"
          isLoading={isLoading}
        />
        <MetricCard
          value={formatCurrency(atRiskARR)}
          label="At Risk ARR"
          trend={summary.atRiskAccounts > 0 ? "down" : "stable"}
          trendLabel={`${summary.atRiskAccounts} accounts flagged`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="#ef4444"
          isLoading={isLoading}
        />
        <MetricCard
          value={formatCurrency(expansionPotential)}
          label="Expansion Potential"
          trend="up"
          trendLabel={`${renewals.length} renewals tracked`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#b8943f"
          isLoading={isLoading}
        />
        <MetricCard
          value={`${Math.round(summary.avgHealth || 0)}/10`}
          label="Avg Health Score"
          trend={summary.avgHealth >= 7 ? "up" : "down"}
          trendLabel={summary.avgHealth >= 7 ? "Healthy" : "Needs improvement"}
          icon={<CheckSquare className="w-5 h-5" />}
          color="#3d7a50"
          isLoading={isLoading}
        />
      </div>

      {/* Source -> Spine -> Signal proof */}
      <Card>
        <CardHeader>
          <CardTitle>Source to Spine to Signal Proof</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : proof.length ? (
            <div className="space-y-2">
              {proof.map((entry) => (
                <div
                  key={entry.source}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{entry.source}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{entry.count} section signals</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No lineage proof available yet.</div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-iw-slate-mid" />
            <h3 className="font-semibold">AI Insights</h3>
          </div>
          {isLoading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : recentInsights.length ? (
            recentInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                id={insight.id}
                title={insight.title}
                description={insight.description}
                type={
                  insight.type === "positive"
                    ? "success"
                    : insight.type === "expansion"
                      ? "opportunity"
                      : insight.type === "risk"
                        ? "risk"
                        : "warning"
                }
                confidence={insight.confidence}
                sources={insight.sources}
                action={insight.suggestedAction}
                onAct={(id, action) => actOnInsight.mutate({ id, action })}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No insights available
              </CardContent>
            </Card>
          )}
        </div>

        {/* Today's Agenda */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-iw-slate-mid" />
            <h3 className="font-semibold">Upcoming Tasks</h3>
          </div>
          <Card>
            <CardContent className="p-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full mb-2" />
                  <Skeleton className="h-16 w-full mb-2" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : tasksDue.length ? (
                tasksDue.map((task) => (
                  <TodayItem
                    key={task.id}
                    type={task.category === "engagement" ? "meeting" : "task"}
                    title={task.title}
                    time={formatRelativeLabel(task.dueDate)}
                    priority={
                      task.priority === "critical" ||
                      task.priority === "high" ||
                      task.priority === "medium"
                        ? task.priority
                        : "low"
                    }
                    details={task.accountName}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No tasks due</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
