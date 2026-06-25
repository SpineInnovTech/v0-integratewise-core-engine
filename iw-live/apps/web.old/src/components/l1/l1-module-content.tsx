import { useState, useMemo, lazy, Suspense } from "react";
import {
  useDomainTable,
  useSpineProjection,
  useSpineReadiness,
} from "@/components/l2/spine/spine-client";
import { type L1Module, type CTXEnum, type ViewMode } from "@/components/l2/spine/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  Target,
  Zap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Factory,
  Briefcase,
  Building2,
  Users as UsersIcon,
  ChevronRight,
  Activity,
  BarChart3,
  Brain,
  MessageSquare,
  FileText,
  AlertTriangle,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentStorage } from "@/components/_deprecated/l2-removed/document-storage/document-storage";
import { useGoalsSafe } from "@/components/_deprecated/l2-removed/goal-framework/goal-context";
import { type GoalStatus } from "@/components/_deprecated/l2-removed/goal-framework/goal-schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── Import domain components ──
const SalesPipeline = lazy(() =>
  import("@/components/l1/domains/salesops/salesops-views").then((m) => ({
    default: m.PipelineKanban,
  }))
);
const ContactsView = lazy(() =>
  import("@/components/l1/domains/salesops/salesops-views").then((m) => ({
    default: m.ContactsView,
  }))
);
import { AccountsView } from "./domains/bizops/accounts-view";
import { TasksView } from "./domains/bizops/tasks-view";
import { CalendarView } from "./domains/bizops/calendar-view";
import { OpsAnalyticsView } from "./domains/bizops/analytics-view";
import { CampaignsView } from "./domains/marketing/campaigns-view";

const STATUS_DOT: Record<GoalStatus, string> = {
  ON_TRACK: "bg-iw-forest-bright",
  AT_RISK: "bg-iw-gold",
  OFF_TRACK: "bg-iw-red",
  EXCEEDED: "bg-iw-slate-mid",
  NOT_STARTED: "bg-gray-400",
};

const VIEW_TABS: { id: ViewMode; label: string; icon: any }[] = [
  { id: "personal", label: "Personal", icon: User },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "project", label: "Accounts & Projects", icon: Building2 },
];

interface L1ModuleContentProps {
  module: L1Module;
  activeCtx: CTXEnum;
}

export function L1ModuleContent({ module, activeCtx }: L1ModuleContentProps) {
  const goalsCtx = useGoalsSafe();
  const domain = "unified";
  const table = useMemo(() => {
    switch (module) {
      case "Projects":
        return "projects";
      case "Accounts":
        return "accounts";
      case "Contacts":
        return "contacts";
      case "Meetings":
        return "meetings";
      case "Docs":
        return "documents";
      case "Tasks":
        return "tasks";
      case "Calendar":
        return "activities";
      case "Notes":
        return "activities";
      case "Knowledge Space":
        return "documents";
      case "Team":
        return "people";
      case "Pipeline":
        return "deals";
      case "Risks":
        return "risks";
      case "Expansion":
        return "expansion";
      case "Analytics":
        return "analytics";
      default:
        return null;
    }
  }, [module]);

  const { data, loading, error } = useDomainTable(domain, table || "accounts");
  const { data: projection, loading: pLoading } = useSpineProjection(
    activeCtx.replace("CTX_", "").toLowerCase()
  );
  const { data: readiness } = useSpineReadiness();

  // ── Route to purpose-built domain components ──
  if (module === "Home") {
    return <DashboardView activeCtx={activeCtx} projection={projection} readiness={readiness} />;
  }
  if (module === "Docs" || module === "Knowledge Space") {
    return <DocumentStorage />;
  }

  // Route domain-specific views
  if (module === "Pipeline") {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading...
          </div>
        }
      >
        <SalesPipeline />
      </Suspense>
    );
  }
  if (module === "Contacts") {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading...
          </div>
        }
      >
        <ContactsView />
      </Suspense>
    );
  }
  if (
    module === "Accounts" &&
    (activeCtx === "CTX_BIZOPS" || activeCtx === "CTX_CS" || activeCtx === "CTX_FINANCE")
  ) {
    return <AccountsView />;
  }
  if (module === "Tasks") {
    return <TasksView />;
  }
  if (module === "Calendar") {
    return <CalendarView />;
  }
  if (module === "Analytics") {
    return <OpsAnalyticsView />;
  }

  if (loading || pLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading {module}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold">Something went wrong</h3>
        <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const entityGoals: any[] = goalsCtx?.getEntityGoals(activeCtx, table || "accounts") ?? [];

  // Fallback card grid for remaining modules
  return (
    <CardGridView
      module={module}
      data={data ?? []}
      entityGoals={entityGoals}
      activeCtx={activeCtx}
    />
  );
}

// ─── Card Grid View ──────────────────────────────────────────────────────────

function CardGridView({
  module,
  data,
  entityGoals,
  activeCtx,
}: {
  module: L1Module;
  data: any[];
  entityGoals: any[];
  activeCtx: CTXEnum;
}) {
  const [search, setSearch] = useState("");

  const filtered =
    data?.filter((item: any) => {
      const name = (item.name || item.title || item.subject || "").toLowerCase();
      return name.includes(search.toLowerCase());
    }) || [];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{module}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} items · {activeCtx.replace("CTX_", "")} context
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={`Search ${module.toLowerCase()}...`}
                className="pl-8 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="w-3.5 h-3.5" />
            </Button>
            <Button className="gap-1.5 h-9 text-xs bg-[#2d5a3d] hover:bg-[#2d5a3d]">
              <Plus className="w-3.5 h-3.5" /> New
            </Button>
          </div>
        </div>

        {entityGoals.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              Serves Goals:
            </span>
            {entityGoals.map((eg: any) => (
              <Badge key={eg.goalId} variant="outline" className="text-[9px] gap-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${eg.impact === "HIGH" ? "bg-iw-forest-bright" : eg.impact === "MEDIUM" ? "bg-iw-gold" : "bg-gray-400"}`}
                />
                {eg.goalName}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item: any) => (
            <Card
              key={item.id}
              className="border shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2d5a3d]/10 flex items-center justify-center text-[#2d5a3d] font-bold text-sm">
                      {item.logo || item.name?.[0] || item.title?.[0] || "E"}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold group-hover:text-[#2d5a3d] transition-colors line-clamp-1">
                        {item.name || item.title || item.subject || "Untitled"}
                      </h3>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {item.id?.slice(0, 12)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[9px] ${item.status === "active" || item.status === "completed" ? "bg-iw-forest/5 text-iw-forest" : item.status === "at_risk" ? "bg-iw-gold/5 text-iw-gold" : ""}`}
                  >
                    {item.status || "Synced"}
                  </Badge>
                </div>
                {item.owner && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold">
                      {item.owner.initials}
                    </div>
                    <span>{item.owner.name}</span>
                  </div>
                )}
                {item.healthScore != null && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Health</span>
                      <span
                        className={`font-bold ${item.healthScore >= 80 ? "text-iw-forest-mid" : item.healthScore >= 60 ? "text-iw-gold" : "text-iw-red"}`}
                      >
                        {item.healthScore}%
                      </span>
                    </div>
                    <Progress
                      value={item.healthScore}
                      className={`h-1 ${item.healthScore < 60 ? "[&>div]:bg-iw-red" : item.healthScore < 80 ? "[&>div]:bg-iw-gold" : ""}`}
                    />
                  </div>
                )}
                {item.arr && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">ARR</span>
                    <span className="font-bold">${(item.arr / 1000).toFixed(0)}K</span>
                  </div>
                )}
                {item.provenance && (
                  <div className="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-border">
                    {item.provenance.map((p: any, i: number) => (
                      <span
                        key={i}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-secondary font-bold uppercase"
                      >
                        {p.sourceToolName}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-bold mb-1">No items found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or create a new entry.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Dashboard View with Progressive Hydration ───────────────────────────────

function DashboardView({ activeCtx, projection, readiness }: any) {
  const goalsCtx = useGoalsSafe();
  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  const strategicGoals = goalsCtx?.strategicGoals || [];
  const deptKPIs = goalsCtx?.getDeptKPIs(activeCtx) || [];
  const allKPIs = goalsCtx?.allKPIs || [];
  const orgType = goalsCtx?.orgType || "PRODUCT";

  const summary = projection?.summary || {
    totalARR: 1420000,
    arrGrowth: 12.5,
    operationalHealth: 84,
    activeIntegrations: 14,
    totalIntegrations: 15,
    totalCustomers: 127,
    atRiskAccounts: 4,
    pendingApprovals: 3,
    teamUtilization: 78,
  };

  const readinessScore = useMemo(() => {
    if (!readiness) return 0;
    const scores = Object.values(readiness).map((r: any) => r.overallScore);
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / (scores.length || 1));
  }, [readiness]);

  const displayKPIs = deptKPIs.length > 0 ? deptKPIs.slice(0, 4) : allKPIs.slice(0, 4);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header with View Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {viewMode === "personal"
                ? "My Overview"
                : viewMode === "work"
                  ? "Work Dashboard"
                  : "Accounts & Projects"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeCtx.replace("CTX_", "")} · {orgType} Org · {readinessScore}% data coverage
            </p>
          </div>
          <div className="flex bg-secondary rounded-lg p-0.5">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Personal View ─── */}
        {viewMode === "personal" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "My Tasks",
                  value: "12",
                  sub: "4 due today",
                  color: "text-[#2d5a3d]",
                  icon: Activity,
                },
                {
                  label: "Meetings Today",
                  value: "3",
                  sub: "Next: 11:30am",
                  color: "text-[#3d7a50]",
                  icon: CalendarIcon,
                },
                {
                  label: "Approvals",
                  value: String(summary.pendingApprovals),
                  sub: "Waiting for you",
                  color: "text-[#c79f4a]",
                  icon: CheckCircle2,
                },
                {
                  label: "Intelligence",
                  value: "5",
                  sub: "New insights",
                  color: "text-[#C79F4A]",
                  icon: Zap,
                },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                          {stat.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{stat.sub}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary group-hover:bg-[#2d5a3d]/10 transition-colors">
                        <stat.icon className="w-4 h-4 text-muted-foreground group-hover:text-[#2d5a3d]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Today's Focus</CardTitle>
                  <CardDescription className="text-[10px]">
                    Tasks and actions that need your attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    {
                      task: "Review FinanceFlow renewal strategy",
                      priority: "critical",
                      due: "Today",
                      project: "CS",
                    },
                    {
                      task: "Approve AI-suggested upsell for DataVault",
                      priority: "high",
                      due: "Today",
                      project: "Sales",
                    },
                    {
                      task: "Prepare Q1 board deck data",
                      priority: "medium",
                      due: "Tomorrow",
                      project: "BizOps",
                    },
                    {
                      task: "Update Jira integration field mapping",
                      priority: "low",
                      due: "This week",
                      project: "Tech",
                    },
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-all cursor-pointer group"
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${t.priority === "critical" ? "bg-iw-red" : t.priority === "high" ? "bg-iw-gold" : t.priority === "medium" ? "bg-iw-slate-mid" : "bg-gray-300"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.task}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {t.due} · {t.project}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#c79f4a]" />
                    <CardTitle className="text-sm">Intelligence Feed</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    {
                      text: "Expansion signal detected for TechServe India — usage up 34%",
                      type: "success",
                      time: "12m",
                    },
                    {
                      text: "FinanceFlow champion went silent — last engagement 12 days ago",
                      type: "warning",
                      time: "1h",
                    },
                    {
                      text: "Stripe schema drift auto-corrected — 2 fields updated",
                      type: "info",
                      time: "2h",
                    },
                    {
                      text: "DataVault Australia NPS jumped to 9.2 — upsell opportunity",
                      type: "success",
                      time: "3h",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.type === "success" ? "bg-iw-forest-bright" : item.type === "warning" ? "bg-iw-gold" : "bg-iw-slate-mid"}`}
                        />
                        <div className="flex-1">
                          <p className="text-[11px] leading-relaxed">{item.text}</p>
                          <span className="text-[9px] text-muted-foreground">{item.time} ago</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ─── Work View ─── */}
        {viewMode === "work" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {displayKPIs.map((kpi: any) => {
                const pct = Math.min(100, Math.round((kpi.currentValue / kpi.targetValue) * 100));
                return (
                  <Card key={kpi.id} className="border-none shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-[#2d5a3d]/10">
                          <Target className="w-3.5 h-3.5 text-[#2d5a3d]" />
                        </div>
                        <div
                          className={`flex items-center text-[10px] font-bold ${kpi.trend >= 0 ? "text-iw-forest-mid" : "text-iw-red"}`}
                        >
                          {kpi.trend >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {Math.abs(kpi.trend)}%
                        </div>
                      </div>
                      <div className="text-xl font-bold">
                        {kpi.unit === "$"
                          ? `$${kpi.currentValue >= 1e6 ? (kpi.currentValue / 1e6).toFixed(1) + "M" : (kpi.currentValue / 1e3).toFixed(0) + "K"}`
                          : kpi.unit === "%"
                            ? `${kpi.currentValue}%`
                            : kpi.currentValue}
                      </div>
                      <div className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">
                        {kpi.name}
                      </div>
                      <Progress value={pct} className="h-1 mt-2" />
                      {kpi.sparkline && (
                        <div className="flex items-end gap-px h-3 mt-2">
                          {kpi.sparkline.map((v: number, j: number) => {
                            const max = Math.max(...kpi.sparkline!);
                            const min = Math.min(...kpi.sparkline!);
                            const height = Math.max(2, ((v - min) / (max - min || 1)) * 12);
                            return (
                              <div
                                key={j}
                                className={`flex-1 rounded-sm ${j === kpi.sparkline!.length - 1 ? "bg-[#2d5a3d]" : "bg-[#2d5a3d]/20"}`}
                                style={{ height: `${height}px` }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Strategic Goal Alignment</CardTitle>
                  <CardDescription className="text-[10px]">
                    {orgType === "PRODUCT"
                      ? "Product growth tracking"
                      : "Service delivery tracking"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {strategicGoals.map((sg: any) => (
                    <div key={sg.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${STATUS_DOT[sg.status as GoalStatus]}`}
                          />
                          <span className="font-semibold">{sg.name}</span>
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            {sg.lens === "PROVIDER" ? (
                              <>
                                <Building2 className="w-2.5 h-2.5" /> Our Growth
                              </>
                            ) : sg.lens === "CLIENT" ? (
                              <>
                                <UsersIcon className="w-2.5 h-2.5" /> Client Value
                              </>
                            ) : (
                              <>
                                <Target className="w-2.5 h-2.5" /> Both
                              </>
                            )}
                          </span>
                        </div>
                        <span className="font-bold">{sg.progress}%</span>
                      </div>
                      <Progress value={sg.progress} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-[#142e20] text-white">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Plug className="w-4 h-4 text-[#c79f4a]" />
                    <h3 className="text-sm font-bold">Integration Health</h3>
                  </div>
                  <div className="space-y-3 flex-1">
                    {[
                      { label: "Data Freshness", value: "< 2 min", ok: true },
                      { label: "Coverage", value: `${readinessScore || 94}%`, ok: true },
                      {
                        label: "Active Sources",
                        value: `${summary.activeIntegrations}/${summary.totalIntegrations}`,
                        ok: summary.activeIntegrations >= summary.totalIntegrations,
                      },
                      { label: "Schema Drift", value: "0 issues", ok: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[11px] text-white/60">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold">{item.value}</span>
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-iw-forest-bright/80" : "bg-iw-gold-light"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() =>
                      window.dispatchEvent(
                        new KeyboardEvent("keydown", { key: "j", metaKey: true })
                      )
                    }
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold mt-4 border border-white/10 text-xs"
                  >
                    Open Intelligence (⌘J)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ─── Project / Account View ─── */}
        {viewMode === "project" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 mb-2">
              <Card className="border-none shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-iw-forest/5 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-iw-forest-mid" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{summary.totalCustomers}</div>
                    <div className="text-[9px] text-muted-foreground uppercase font-bold">
                      Total Accounts
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-iw-red/5 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-iw-red" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-iw-red">{summary.atRiskAccounts}</div>
                    <div className="text-[9px] text-muted-foreground uppercase font-bold">
                      At Risk
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-iw-slate/5 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-iw-slate-mid" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">${(summary.totalARR / 1e6).toFixed(2)}M</div>
                    <div className="text-[9px] text-muted-foreground uppercase font-bold">
                      Total ARR
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  name: "TechServe India",
                  logo: "🏢",
                  arr: 420000,
                  health: 92,
                  tier: "Enterprise",
                  renewal: "126 days",
                  signals: ["Expansion signal", "High usage"],
                },
                {
                  name: "CloudBridge APAC",
                  logo: "☁️",
                  arr: 280000,
                  health: 78,
                  tier: "Enterprise",
                  renewal: "72 days",
                  signals: ["CSAT drop"],
                },
                {
                  name: "FinanceFlow Solutions",
                  logo: "💰",
                  arr: 180000,
                  health: 42,
                  tier: "Mid-Market",
                  renewal: "29 days",
                  signals: ["Champion silent", "Payment failed"],
                },
                {
                  name: "DataVault Australia",
                  logo: "🔒",
                  arr: 350000,
                  health: 88,
                  tier: "Enterprise",
                  renewal: "204 days",
                  signals: ["NPS 9.2"],
                },
                {
                  name: "RetailNest Pte Ltd",
                  logo: "🛍️",
                  arr: 95000,
                  health: 71,
                  tier: "SMB",
                  renewal: "98 days",
                  signals: [],
                },
                {
                  name: "HealthTech Innovations",
                  logo: "🏥",
                  arr: 210000,
                  health: 95,
                  tier: "Mid-Market",
                  renewal: "202 days",
                  signals: ["Usage surge", "Expansion"],
                },
              ].map((acc, i) => (
                <Card
                  key={i}
                  className={`border shadow-sm hover:shadow-md transition-all cursor-pointer ${acc.health < 60 ? "border-iw-red/20" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{acc.logo}</span>
                        <div>
                          <h3 className="text-sm font-semibold">{acc.name}</h3>
                          <span className="text-[10px] text-muted-foreground">{acc.tier}</span>
                        </div>
                      </div>
                      <Badge
                        className={`text-[9px] border-0 ${acc.health >= 80 ? "bg-iw-forest/5 text-iw-forest" : acc.health >= 60 ? "bg-iw-gold/5 text-iw-gold" : "bg-iw-red/5 text-iw-red"}`}
                      >
                        {acc.health}%
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">ARR</span>
                        <span className="font-bold">${(acc.arr / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Renewal</span>
                        <span className="font-medium">{acc.renewal}</span>
                      </div>
                      <Progress
                        value={acc.health}
                        className={`h-1 ${acc.health < 60 ? "[&>div]:bg-iw-red" : acc.health < 80 ? "[&>div]:bg-iw-gold" : ""}`}
                      />
                    </div>
                    {acc.signals.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {acc.signals.map((s, j) => (
                          <Badge key={j} variant="outline" className="text-[8px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
