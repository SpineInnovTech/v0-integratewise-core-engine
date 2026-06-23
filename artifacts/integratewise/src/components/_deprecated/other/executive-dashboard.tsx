/**
 * Executive Dashboard — High-level account overview with KPIs
 * Cherry-picked from Project Task Organizer, adapted for IntegrateWise
 */
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckSquare,
  Calendar,
  Users,
  DollarSign,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/components/ui/utils";
import { HealthGauge, HealthBadge } from "./health-gauge";

interface MetricCardProps {
  value: string;
  label: string;
  sublabel?: string;
  trend?: "up" | "down" | "stable";
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
}

function MetricCard({
  value,
  label,
  sublabel,
  trend,
  trendLabel,
  icon,
  color = "#3D7A50",
  onClick,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
            {trend && trendLabel && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : trend === "down" ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : null}
                <span
                  className={cn(
                    "text-xs",
                    trend === "up"
                      ? "text-green-500"
                      : trend === "down"
                        ? "text-red-500"
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
  title: string;
  description: string;
  type: "success" | "warning" | "risk" | "opportunity";
  confidence?: number;
  sources?: string[];
  action?: string;
}

function InsightCard({ title, description, type, confidence, sources, action }: InsightCardProps) {
  const typeConfig = {
    success: { icon: CheckSquare, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/20",
    },
    risk: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
    opportunity: {
      icon: Lightbulb,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/20",
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
              <Button variant="link" size="sm" className="h-auto p-0 mt-2">
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
  priority: "high" | "medium" | "low";
  details?: string;
}

function TodayItem({ type, title, time, priority, details }: TodayItemProps) {
  const typeConfig = {
    meeting: { icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
    task: { icon: CheckSquare, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
    deadline: { icon: Clock, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
    milestone: { icon: Target, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20" },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const priorityColors = {
    high: "text-red-500 bg-red-50 dark:bg-red-950/20",
    medium: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
    low: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
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

export function ExecutiveDashboard() {
  const [selectedAccount] = useState({
    name: "Nexlify",
    arr: "$240,000",
    healthScore: 8.2,
    renewalDate: "Feb 15, 2026",
    renewalConfidence: 85,
    daysToRenewal: 6,
    industry: "FinTech",
    growth: "+20%",
  });

  const metrics = [
    {
      value: selectedAccount.healthScore.toFixed(1),
      label: "Health Score",
      sublabel: "Excellent",
      trend: "up" as const,
      trendLabel: "+0.3 this month",
      icon: <Target className="w-5 h-5" />,
      color: "#22c55e",
    },
    {
      value: "5",
      label: "Active Tasks",
      sublabel: "In Progress",
      trend: "stable" as const,
      trendLabel: "2 due this week",
      icon: <CheckSquare className="w-5 h-5" />,
      color: "#3d7a50",
    },
    {
      value: "1",
      label: "Active Risks",
      sublabel: "Monitored",
      trend: "down" as const,
      trendLabel: "Champion departure",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "#ef4444",
    },
    {
      value: "3",
      label: "Expansion Signals",
      sublabel: "Detected",
      trend: "up" as const,
      trendLabel: "+1 this week",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "#b8943f",
    },
  ];

  const insights = [
    {
      title: "Mobile API Expansion Opportunity",
      description:
        "Board approved $80K mobile app budget for Q1 2026. Documentation visits increasing.",
      type: "opportunity" as const,
      confidence: 92,
      sources: ["Gmail", "CRM", "Slack"],
      action: "Draft proposal",
    },
    {
      title: "Champion Transition Risk",
      description: "New technical contact Jane Smith identified. Mitigation plan in progress.",
      type: "warning" as const,
      confidence: 78,
      sources: ["CRM", "LinkedIn"],
      action: "Schedule onboarding",
    },
    {
      title: "Strong Product Usage",
      description:
        "API calls up 15%, 99.98% uptime, <10ms latency. Feature adoption at 5/8 modules.",
      type: "success" as const,
      confidence: 95,
      sources: ["Platform Analytics"],
    },
  ];

  const todayItems = [
    {
      type: "meeting" as const,
      title: "Q4 QBR with Nexlify",
      time: "2:00 PM",
      priority: "high" as const,
      details: "Quarterly Business Review",
    },
    {
      type: "task" as const,
      title: "Send Monthly Usage Report",
      time: "Due by EOD",
      priority: "medium" as const,
    },
    {
      type: "deadline" as const,
      title: "Technical Deep-Dive",
      time: "Tomorrow",
      priority: "high" as const,
      details: "With Jane Smith",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{selectedAccount.name}</h2>
            <HealthBadge score={selectedAccount.healthScore} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>{selectedAccount.industry}</span>
            <span>•</span>
            <span>{selectedAccount.arr} ARR</span>
            <span>•</span>
            <span className="text-green-500">{selectedAccount.growth}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Renewal</p>
            <p className="font-semibold">{selectedAccount.renewalDate}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Confidence</p>
            <p className="font-semibold text-green-500">{selectedAccount.renewalConfidence}%</p>
          </div>
        </div>
      </div>

      {/* Health Gauge */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HealthGauge score={selectedAccount.healthScore} size="md" />
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Renewal Confidence</span>
                <span className="text-sm text-muted-foreground">
                  {selectedAccount.renewalConfidence}%
                </span>
              </div>
              <Progress value={selectedAccount.renewalConfidence} className="h-2" />
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  Days to renewal:{" "}
                  <strong className="text-foreground">{selectedAccount.daysToRenewal}</strong>
                </span>
                <span>
                  ARR: <strong className="text-foreground">{selectedAccount.arr}</strong>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">AI Insights</h3>
          </div>
          {insights.map((insight, i) => (
            <InsightCard key={i} {...insight} />
          ))}
        </div>

        {/* Today's Agenda */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Today&apos;s Agenda</h3>
          </div>
          <Card>
            <CardContent className="p-2">
              {todayItems.map((item, i) => (
                <TodayItem key={i} {...item} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
