import { useState, useMemo, lazy, Suspense } from "react";
import { useDomainTable, useSpineProjection, useSpineReadiness } from "./spine/spine-client";
import { type L1Module, type CTXEnum, type ViewMode } from "./spine/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Loader2, AlertCircle, ArrowUpRight, ArrowDownRight, Search, Plus, Filter,
  MoreVertical, Calendar as CalendarIcon, CheckCircle2, Clock, User, ExternalLink,
  Target, Zap, DollarSign, TrendingUp, TrendingDown, Factory, Briefcase,
  Building2, Users as UsersIcon, ChevronRight, Activity, BarChart3, Brain,
  MessageSquare, FileText, AlertTriangle, Plug, HeartPulse, Shield, Package,
  RefreshCw, Database, GitBranch, Layers, Sunrise, BookOpen, Play,
  PauseCircle, RotateCcw, Pencil, ThumbsUp, Inbox, Coffee, X
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { DocumentStorage } from "./document-storage/document-storage";
import { SchemaRegistry } from "./spine/schema-registry";
import { SchemaAiSynthesis } from "./spine/schema-ai-synthesis";
import { GovernanceWorkbench } from "./governance/governance-workbench";
import { IngressPlane } from "./ingress/ingress-plane";
import { ContinuityShell } from "./continuity/continuity-shell";
import { useGoalsSafe } from "./goal-framework/goal-context";
import { type GoalStatus } from "./goal-framework/goal-schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

// ── Import domain components ──
import { SalesPipeline } from "./sales/pipeline";
import { ContactsView } from "./sales/contacts";
import { AccountsView } from "./business-ops/accounts";
import { TasksView } from "./business-ops/tasks";
import { CalendarView } from "./business-ops/calendar-view";
import { OpsAnalyticsView } from "./business-ops/analytics-view";
import { CampaignsView } from "./marketing/campaigns";
import { MeetingsView, NotesView, TeamView, RisksView, ExpansionView, ProjectsView } from "./domains/domain-views";

const STATUS_DOT: Record<GoalStatus, string> = {
  ON_TRACK: "bg-emerald-500", AT_RISK: "bg-amber-500", OFF_TRACK: "bg-red-500",
  EXCEEDED: "bg-blue-500", NOT_STARTED: "bg-gray-400",
};

// VIEW_TABS removed — Personal/Work navigation is handled by the sidebar

interface L1ModuleContentProps {
  module: L1Module;
  activeCtx: CTXEnum;
}

export function L1ModuleContent({ module, activeCtx }: L1ModuleContentProps) {
  const goalsCtx = useGoalsSafe();
  const domain = "unified";
  const table = useMemo(() => {
    switch (module) {
      case "Projects": return "projects"; case "Accounts": return "accounts";
      case "Contacts": return "contacts"; case "Meetings": return "meetings";
      case "Docs": return "documents"; case "Tasks": return "tasks";
      case "Calendar": return "activities"; case "Notes": return "activities";
      case "Knowledge Space": return "documents"; case "Team": return "people";
      case "Pipeline": return "deals"; case "Risks": return "risks";
      case "Expansion": return "expansion"; case "Analytics": return "analytics";
      default: return null;
    }
  }, [module]);

  const { data, loading, error } = useDomainTable(domain, table || "accounts");
  const { data: projection, loading: pLoading } = useSpineProjection(activeCtx.replace("CTX_", "").toLowerCase());
  const { data: readiness } = useSpineReadiness();

  // ── Route to purpose-built domain components ──
  if (module === "Home") {
    return <DashboardView activeCtx={activeCtx} projection={projection} readiness={readiness} />;
  }
  if (module === "Docs" || module === "Knowledge Space") {
    return <DocumentStorage />;
  }
  if (module === "Meetings") {
    return <MeetingsView activeCtx={activeCtx} />;
  }
  if (module === "Notes") {
    return <NotesView activeCtx={activeCtx} />;
  }
  if (module === "Team") {
    return <TeamView activeCtx={activeCtx} />;
  }
  if (module === "Risks") {
    return <RisksView activeCtx={activeCtx} />;
  }
  if (module === "Expansion") {
    return <ExpansionView activeCtx={activeCtx} />;
  }
  if (module === "Projects") {
    return <ProjectsView activeCtx={activeCtx} />;
  }
  if (module === "Schema Registry") {
    return <SchemaRegistry />;
  }
  if (module === "Governance") {
    return <GovernanceWorkbench />;
  }
  if (module === "Ingress") {
    return <IngressPlane />;
  }
  if (module === "Continuity") {
    return <ContinuityShell />;
  }

  // Route domain-specific views
  if (module === "Pipeline") {
    return <SalesPipeline />;
  }
  if (module === "Contacts") {
    return <ContactsView />;
  }
  if (module === "Accounts") {
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
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto"><AlertCircle className="w-6 h-6" /></div>
        <h3 className="text-lg font-bold">Something went wrong</h3>
        <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const entityGoals = goalsCtx?.getEntityGoals(activeCtx, table || "accounts") || [];

  // Fallback card grid for remaining modules
  return <CardGridView module={module} data={data} entityGoals={entityGoals} activeCtx={activeCtx} />;
}

// ─── Card Grid View ──────────────────────────────────────────────────────────

function CardGridView({ module, data, entityGoals, activeCtx }: { module: L1Module; data: any[]; entityGoals: any[]; activeCtx: CTXEnum }) {
  const [search, setSearch] = useState("");

  const filtered = data?.filter((item: any) => {
    const name = (item.name || item.title || item.subject || "").toLowerCase();
    return name.includes(search.toLowerCase());
  }) || [];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{module}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} items · {activeCtx.replace("CTX_", "")} context</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder={`Search ${module.toLowerCase()}...`} className="pl-8 h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9"><Filter className="w-3.5 h-3.5" /></Button>
            <Button className="gap-1.5 h-9 text-xs bg-[#3F5185] hover:bg-[#354775]"><Plus className="w-3.5 h-3.5" /> New</Button>
          </div>
        </div>

        {entityGoals.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Serves Goals:</span>
            {entityGoals.map((eg: any) => (
              <Badge key={eg.goalId} variant="outline" className="text-[9px] gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${eg.impact === "HIGH" ? "bg-emerald-500" : eg.impact === "MEDIUM" ? "bg-amber-500" : "bg-gray-400"}`} />
                {eg.goalName}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item: any) => (
            <Card key={item.id} className="border shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#3F5185]/10 flex items-center justify-center text-[#3F5185] font-bold text-sm">
                      {item.logo || item.name?.[0] || item.title?.[0] || "E"}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold group-hover:text-[#3F5185] transition-colors line-clamp-1">
                        {item.name || item.title || item.subject || "Untitled"}
                      </h3>
                      <span className="text-[10px] text-muted-foreground font-mono">{item.id?.slice(0, 12)}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-[9px] ${item.status === "active" || item.status === "completed" ? "bg-emerald-50 text-emerald-700" : item.status === "at_risk" ? "bg-amber-50 text-amber-700" : ""}`}>
                    {item.status || "Synced"}
                  </Badge>
                </div>
                {item.owner && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold">{item.owner.initials}</div>
                    <span>{item.owner.name}</span>
                  </div>
                )}
                {item.healthScore != null && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Health</span>
                      <span className={`font-bold ${item.healthScore >= 80 ? "text-emerald-600" : item.healthScore >= 60 ? "text-amber-600" : "text-red-600"}`}>{item.healthScore}%</span>
                    </div>
                    <Progress value={item.healthScore} className={`h-1 ${item.healthScore < 60 ? "[&>div]:bg-red-500" : item.healthScore < 80 ? "[&>div]:bg-amber-500" : ""}`} />
                  </div>
                )}
                {item.arr && (
                  <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">ARR</span><span className="font-bold">${(item.arr / 1000).toFixed(0)}K</span></div>
                )}
                {item.provenance && (
                  <div className="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-border">
                    {item.provenance.map((p: any, i: number) => (
                      <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-secondary font-bold uppercase">{p.sourceToolName}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3"><Search className="w-5 h-5 text-muted-foreground" /></div>
            <h3 className="font-bold mb-1">No items found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or create a new entry.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Department Profile — actions, KPIs, focus, signals per role ─────────────

const DEPT_PROFILE: Record<CTXEnum, {
  role: string;
  quickActions: { label: string; icon: any }[];
  kpis: { label: string; value: string; sub: string; up: boolean; color: string }[];
  todayFocus: { task: string; priority: "critical" | "high" | "medium" | "low"; context: string }[];
  signals: { text: string; type: "success" | "warning" | "info"; time: string }[];
  schemaGroups: string[];
  connectors: string[];
}> = {
  CTX_CS: {
    role: "Customer Success Manager",
    quickActions: [
      { label: "Log Activity", icon: MessageSquare }, { label: "Schedule QBR", icon: CalendarIcon },
      { label: "Update Health", icon: HeartPulse }, { label: "Escalate Risk", icon: AlertTriangle },
      { label: "Create Task", icon: CheckCircle2 },
    ],
    kpis: [
      { label: "NRR", value: "108%", sub: "+3.2% vs last quarter", up: true, color: "var(--iw-success)" },
      { label: "Avg Health", value: "76", sub: "+2.1 pts MoM", up: true, color: "var(--iw-blue)" },
      { label: "Renewals 60d", value: "7", sub: "$840K ARR at stake", up: false, color: "var(--iw-warning)" },
      { label: "At-Risk Accounts", value: "4", sub: "2 critical, action required", up: false, color: "var(--iw-danger)" },
    ],
    todayFocus: [
      { task: "FinanceFlow — 29 days to renewal, champion silent 12d, risk score 92/100", priority: "critical", context: "Renewal" },
      { task: "TechServe Asia QBR deck — due in 3 days, not started", priority: "high", context: "QBR" },
      { task: "CloudBridge expansion — 2 new teams onboarded, propose upsell before Q3 QBR", priority: "high", context: "Expansion" },
      { task: "Log outcome from yesterday's EBR with DataVault Australia", priority: "medium", context: "Activity" },
    ],
    signals: [
      { text: "FinanceFlow champion (David Park) silent 12d — renewal risk 92/100, critical", type: "warning", time: "2m" },
      { text: "CloudBridge usage up 34% MoM — expansion window open before Q3", type: "success", time: "1h" },
      { text: "TechServe Asia: feature adoption dropped 18% — 2 core modules inactive", type: "warning", time: "3h" },
    ],
    schemaGroups: ["company", "deal", "activity"],
    connectors: ["Salesforce", "Zendesk", "Slack", "Stripe"],
  },
  CTX_SALES: {
    role: "Sales Representative",
    quickActions: [
      { label: "Log Call", icon: MessageSquare }, { label: "Update Stage", icon: TrendingUp },
      { label: "Create Proposal", icon: FileText }, { label: "Schedule Demo", icon: CalendarIcon },
      { label: "Add Contact", icon: UsersIcon },
    ],
    kpis: [
      { label: "Pipeline", value: "$2.3M", sub: "3.1x coverage vs 4x target", up: false, color: "var(--iw-blue)" },
      { label: "Quota Attainment", value: "68%", sub: "-2.1% behind pace", up: false, color: "var(--iw-warning)" },
      { label: "Won (QTD)", value: "$340K", sub: "+18% vs Q2 same period", up: true, color: "var(--iw-success)" },
      { label: "Deals at Risk", value: "5", sub: "$420K stalled >14 days", up: false, color: "var(--iw-danger)" },
    ],
    todayFocus: [
      { task: "Acme Corp — demo follow-up 3 days, no response, deal going cold", priority: "critical", context: "Deal" },
      { task: "Update 5 deal stages — weekly pipeline review with manager at 3pm", priority: "high", context: "Pipeline" },
      { task: "NovaTech APAC proposal — $180K ACV, legal waiting on your draft", priority: "high", context: "Proposal" },
      { task: "Log yesterday's call with RetailNest procurement — notes in Notion", priority: "medium", context: "Activity" },
    ],
    signals: [
      { text: "3 deals with no activity in 14+ days — close risk before quarter end", type: "warning", time: "5m" },
      { text: "NovaTech APAC champion viewed pricing page twice this week — buying signal", type: "success", time: "1h" },
      { text: "HubSpot lifecycle mismatch on 4 closed-won deals — CRM Reconciler queued", type: "info", time: "2h" },
    ],
    schemaGroups: ["deal", "person", "activity"],
    connectors: ["HubSpot", "Salesforce", "Gmail", "Zoom"],
  },
  CTX_MARKETING: {
    role: "Marketing Manager",
    quickActions: [
      { label: "Launch Campaign", icon: Zap }, { label: "Review Performance", icon: BarChart3 },
      { label: "Route MQLs", icon: UsersIcon }, { label: "Schedule Post", icon: CalendarIcon },
      { label: "Create Brief", icon: FileText },
    ],
    kpis: [
      { label: "MQLs (MTD)", value: "142", sub: "+23% vs last month", up: true, color: "var(--iw-blue)" },
      { label: "CAC", value: "$1,240", sub: "-8% MoM — improving", up: true, color: "var(--iw-success)" },
      { label: "Pipeline Generated", value: "$1.1M", sub: "this quarter, vs $800K target", up: true, color: "var(--iw-purple)" },
      { label: "SQL Conversion", value: "18%", sub: "+2.1% vs prior month", up: true, color: "var(--iw-warning)" },
    ],
    todayFocus: [
      { task: "12 hot MQLs unrouted to Sales — SLA breach in <2 hours", priority: "critical", context: "MQL" },
      { task: "APAC webinar performance — $40K spend, review ROI before next week's sync", priority: "high", context: "Campaign" },
      { task: "3 content posts this week missing approval — content calendar stalled", priority: "high", context: "Content" },
      { task: "Q2 attribution report — board presentation next Monday, data needed", priority: "medium", context: "Reporting" },
    ],
    signals: [
      { text: "APAC webinar: 38 registrations, 12 match ICP — route to Sales now", type: "success", time: "30m" },
      { text: "Email bounce rate 4.2% — above 2% threshold, list hygiene required", type: "warning", time: "2h" },
      { text: "LinkedIn ad spend efficiency down 15% — creative fatigue, refresh assets", type: "warning", time: "4h" },
    ],
    schemaGroups: ["person", "activity", "document"],
    connectors: ["HubSpot", "Google Analytics", "Mailchimp", "LinkedIn"],
  },
  CTX_BIZOPS: {
    role: "Business Operations Lead",
    quickActions: [
      { label: "Review Metrics", icon: BarChart3 }, { label: "Create Project", icon: Briefcase },
      { label: "Approve Proposal", icon: CheckCircle2 }, { label: "Run Report", icon: FileText },
      { label: "Review Schema", icon: Database },
    ],
    kpis: [
      { label: "Operational Health", value: "84%", sub: "+2.3% MoM across all functions", up: true, color: "var(--iw-success)" },
      { label: "Open Projects", value: "12", sub: "3 at risk, 1 blocked", up: false, color: "var(--iw-blue)" },
      { label: "Pending Governance", value: "5", sub: "AI proposals awaiting review", up: false, color: "var(--iw-danger)" },
      { label: "Spine Coverage", value: "94%", sub: "data normalised across all tools", up: true, color: "var(--iw-purple)" },
    ],
    todayFocus: [
      { task: "Approve 3 AI proposals in governance queue — oldest is 18h old", priority: "critical", context: "Governance" },
      { task: "Q3 OKR alignment — Sales and CS targets conflicting, reconcile", priority: "high", context: "Planning" },
      { task: "Schema AI: Jira connector v1.1.0 proposed — 2 new fields, review", priority: "high", context: "Schema AI" },
      { task: "Cross-team sync notes — distribute to stakeholders by EOD", priority: "medium", context: "Ops" },
    ],
    signals: [
      { text: "Schema AI: 2 new schemas proposed for Jira connector — confidence 0.91", type: "info", time: "8m" },
      { text: "Q2 NRR: 108%, 4% above target — board slide needs update", type: "success", time: "1h" },
      { text: "Engineering delivery velocity down 12% — 3 consecutive sprints below plan", type: "warning", time: "3h" },
    ],
    schemaGroups: ["company", "deal", "activity", "document"],
    connectors: ["Jira", "Notion", "Slack", "Google Workspace"],
  },
  CTX_SUPPORT: {
    role: "Support Team Lead",
    quickActions: [
      { label: "Open Ticket", icon: Plus }, { label: "Assign Agent", icon: UsersIcon },
      { label: "Check SLA", icon: Clock }, { label: "Escalate P1", icon: AlertTriangle },
      { label: "Add KB Article", icon: FileText },
    ],
    kpis: [
      { label: "Open Tickets", value: "47", sub: "8 P1/P2 requiring action", up: false, color: "var(--iw-danger)" },
      { label: "Avg Resolution", value: "4.2h", sub: "-0.8h vs last month", up: true, color: "var(--iw-success)" },
      { label: "CSAT", value: "4.6/5", sub: "+0.2 pts MoM — improving", up: true, color: "var(--iw-success)" },
      { label: "SLA Breaches", value: "3", sub: "this week, 1 escalated", up: false, color: "var(--iw-warning)" },
    ],
    todayFocus: [
      { task: "P1 #4821 — FinanceFlow bulk export timeout, unresolved 72h, renewal customer", priority: "critical", context: "P1 Incident" },
      { task: "5 tickets approaching SLA breach in next 2 hours — reassign", priority: "critical", context: "SLA" },
      { task: "KB gap: 3 tickets this week with no matching article — create content", priority: "high", context: "Knowledge" },
      { task: "Agent Maria at 120% capacity — redistribute 4 tickets", priority: "high", context: "Capacity" },
    ],
    signals: [
      { text: "P1 #4821 (FinanceFlow) unresolved 72h — renewal in 29 days, escalate now", type: "warning", time: "1m" },
      { text: "CSAT 4.6 this week — 3 positive verbatims about response speed", type: "success", time: "2h" },
      { text: "Zendesk schema drift — 2 ticket fields changed, auto-correction queued", type: "info", time: "4h" },
    ],
    schemaGroups: ["activity", "person", "document"],
    connectors: ["Zendesk", "Freshdesk", "Slack", "Jira"],
  },
  CTX_PM: {
    role: "Project Manager",
    quickActions: [
      { label: "Create Task", icon: CheckCircle2 }, { label: "Update Status", icon: Activity },
      { label: "Log Progress", icon: FileText }, { label: "Flag Blocker", icon: AlertTriangle },
      { label: "Schedule Review", icon: CalendarIcon },
    ],
    kpis: [
      { label: "On Track", value: "7/10", sub: "projects delivering on plan", up: true, color: "var(--iw-success)" },
      { label: "Overdue Tasks", value: "12", sub: "3 are blockers for other teams", up: false, color: "var(--iw-danger)" },
      { label: "Team Utilization", value: "82%", sub: "+4% MoM, approaching limit", up: false, color: "var(--iw-blue)" },
      { label: "On-Time Delivery", value: "87%", sub: "milestone hit rate this quarter", up: true, color: "var(--iw-success)" },
    ],
    todayFocus: [
      { task: "Sprint 6 demo in 2 hours — deck not finalized, 3 features pending demo", priority: "critical", context: "Sprint" },
      { task: "API integration task blocked — Design sign-off pending 3 days", priority: "high", context: "Blocker" },
      { task: "2 slipped milestones — re-plan timelines before stakeholder update", priority: "high", context: "Planning" },
      { task: "Weekly status email to leadership — template ready, needs data", priority: "medium", context: "Comms" },
    ],
    signals: [
      { text: "3 sprint 6 tasks with no update in 4 days — stall risk before demo", type: "warning", time: "10m" },
      { text: "Q2 velocity 15% below plan — delivery risk for Q3 roadmap commitments", type: "warning", time: "1h" },
      { text: "Design handoff complete for Feature X — dev can unblock tomorrow morning", type: "success", time: "2h" },
    ],
    schemaGroups: ["activity", "document"],
    connectors: ["Jira", "Asana", "Notion", "Slack"],
  },
  CTX_TECH: {
    role: "Engineering Lead",
    quickActions: [
      { label: "Create Issue", icon: Plus }, { label: "Review PR", icon: GitBranch },
      { label: "Log Incident", icon: AlertTriangle }, { label: "Deploy", icon: Zap },
      { label: "Review Schema", icon: Database },
    ],
    kpis: [
      { label: "Deploy Freq", value: "4/wk", sub: "+1 vs last sprint", up: true, color: "var(--iw-success)" },
      { label: "P1 Incidents", value: "1", sub: "active now — FinanceFlow", up: false, color: "var(--iw-danger)" },
      { label: "Sprint Velocity", value: "68 pts", sub: "-8% — 3 sprints trending down", up: false, color: "var(--iw-warning)" },
      { label: "PR Review Time", value: "6.2h", sub: "-1.3h avg, improving", up: true, color: "var(--iw-blue)" },
    ],
    todayFocus: [
      { task: "P1 — FinanceFlow bulk export timing out in prod, root cause unknown", priority: "critical", context: "Incident" },
      { task: "Schema AI: Jira connector v1.1.0 proposed — review 2 new field mappings", priority: "high", context: "Schema AI" },
      { task: "Merge queue — 4 PRs waiting review >24h, team blocked", priority: "high", context: "PR Review" },
      { task: "Postmortem from last deploy rollback — due EOD, template shared", priority: "medium", context: "Ops" },
    ],
    signals: [
      { text: "P1: bulk export service timing out >30s — FinanceFlow affected, open incident", type: "warning", time: "15m" },
      { text: "Jira: 2 new fields detected upstream — Schema AI proposed v1.1.0, confidence 0.88", type: "info", time: "1h" },
      { text: "3 services shipped successfully this morning — deploy pipeline green", type: "success", time: "3h" },
    ],
    schemaGroups: ["activity", "document"],
    connectors: ["GitHub", "Jira", "PagerDuty", "Datadog"],
  },
  CTX_HR: {
    role: "People & Culture Lead",
    quickActions: [
      { label: "Post Role", icon: Plus }, { label: "Schedule Interview", icon: CalendarIcon },
      { label: "Log Review", icon: FileText }, { label: "Send Update", icon: MessageSquare },
      { label: "Add Person", icon: UsersIcon },
    ],
    kpis: [
      { label: "Open Roles", value: "8", sub: "3 urgent — engineering pipeline", up: false, color: "var(--iw-warning)" },
      { label: "Time to Hire", value: "32d", sub: "-4 days vs last quarter avg", up: true, color: "var(--iw-success)" },
      { label: "Attrition Rate", value: "7.2%", sub: "+1.1% QoQ — watch signal", up: false, color: "var(--iw-danger)" },
      { label: "Engagement", value: "74%", sub: "+3% MoM — remote policy effect", up: true, color: "var(--iw-blue)" },
    ],
    todayFocus: [
      { task: "3 candidates — final round feedback pending, decision needed today", priority: "critical", context: "Hiring" },
      { task: "6 managers missing Q2 performance reviews — deadline today", priority: "critical", context: "Performance" },
      { task: "New hire starting Monday — onboarding checklist 40% incomplete", priority: "high", context: "Onboarding" },
      { task: "Exit interview — departing senior engineer, understand attrition signal", priority: "medium", context: "Retention" },
    ],
    signals: [
      { text: "2 senior engineers flagged as flight risk by engagement model — intervene", type: "warning", time: "20m" },
      { text: "Engineering hiring funnel 40% below plan — sourcing strategy needs change", type: "warning", time: "2h" },
      { text: "Engagement survey: team satisfaction +3% — remote work policy credited", type: "success", time: "4h" },
    ],
    schemaGroups: ["person", "document"],
    connectors: ["Greenhouse", "Workday", "Slack", "Google Workspace"],
  },
  CTX_FINANCE: {
    role: "Finance Manager",
    quickActions: [
      { label: "Create Invoice", icon: FileText }, { label: "Review Budget", icon: BarChart3 },
      { label: "Approve Expense", icon: CheckCircle2 }, { label: "Run Forecast", icon: TrendingUp },
      { label: "Flag Variance", icon: AlertTriangle },
    ],
    kpis: [
      { label: "MRR", value: "$118K", sub: "+8.2% MoM — above 6% target", up: true, color: "var(--iw-success)" },
      { label: "Burn Rate", value: "$340K/mo", sub: "-$12K vs plan this month", up: true, color: "var(--iw-blue)" },
      { label: "Overdue AR", value: "$84K", sub: "3 invoices — FinanceFlow flagged", up: false, color: "var(--iw-danger)" },
      { label: "Budget Used", value: "71%", sub: "of Q3, 6 weeks remaining", up: false, color: "var(--iw-warning)" },
    ],
    todayFocus: [
      { task: "FinanceFlow $84K overdue — 2 Stripe failures, payment method expired", priority: "critical", context: "AR" },
      { task: "Q3 budget variance — Marketing over by $40K, get explanation before board", priority: "high", context: "Budget" },
      { task: "Board deck Q2 actuals vs forecast — presentation Friday, data gap", priority: "high", context: "Reporting" },
      { task: "8 pending expense reports >$500 threshold awaiting your approval", priority: "medium", context: "Expenses" },
    ],
    signals: [
      { text: "Stripe: FinanceFlow $42K invoice failed twice — payment method expired", type: "warning", time: "5m" },
      { text: "MRR growth 8.2% — above 6% target, Q3 forecast can be revised upward", type: "success", time: "1h" },
      { text: "Marketing Q3 spend at 89% with 6 weeks remaining — budget alert", type: "warning", time: "3h" },
    ],
    schemaGroups: ["deal", "company", "activity"],
    connectors: ["Stripe", "QuickBooks", "Xero", "Salesforce"],
  },
  CTX_LEGAL: {
    role: "Legal Counsel",
    quickActions: [
      { label: "Review Contract", icon: FileText }, { label: "Flag Risk", icon: AlertTriangle },
      { label: "Add Policy", icon: Shield }, { label: "Log Decision", icon: CheckCircle2 },
      { label: "Escalate", icon: Zap },
    ],
    kpis: [
      { label: "Active Contracts", value: "34", sub: "6 expiring in 90 days", up: false, color: "var(--iw-blue)" },
      { label: "Review SLA", value: "3.4d", sub: "-0.6 days MoM, improving", up: true, color: "var(--iw-success)" },
      { label: "Open Risks", value: "7", sub: "2 high severity, unresolved", up: false, color: "var(--iw-danger)" },
      { label: "Compliance Score", value: "96%", sub: "+1% QoQ — audit ready", up: true, color: "var(--iw-success)" },
    ],
    todayFocus: [
      { task: "NovaTech APAC MSA — $180K deal, Sales waiting on legal sign-off", priority: "critical", context: "Contract" },
      { task: "DPA amendment — GDPR update required for EU customers next month", priority: "high", context: "Compliance" },
      { task: "3 vendor contracts expiring in 30 days — review renewal terms", priority: "high", context: "Contract" },
      { task: "Compile Q2 approval audit trail — regulator request, due Friday", priority: "medium", context: "Audit" },
    ],
    signals: [
      { text: "NovaTech MSA: Sales waiting on sign-off, deal at risk of slipping quarter", type: "warning", time: "15m" },
      { text: "GDPR DPA update required — EU regulation effective in 30 days", type: "warning", time: "2h" },
      { text: "Compliance audit complete: 96% score, 2 minor items for remediation", type: "success", time: "4h" },
    ],
    schemaGroups: ["document", "company", "activity"],
    connectors: ["DocuSign", "Google Drive", "Notion", "Salesforce"],
  },
};

const PRIORITY_CONFIG = {
  critical: { dot: "bg-[var(--iw-danger)]", badge: "bg-red-50 text-red-700 border-red-200" },
  high:     { dot: "bg-[var(--iw-warning)]", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  medium:   { dot: "bg-[var(--iw-blue)]", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  low:      { dot: "bg-[var(--muted-foreground)]", badge: "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]" },
};

// ─── Personal View — Progressive Disclosure Morning Brief ────────────────────

type DeptProfile = typeof DEPT_PROFILE[CTXEnum];

function SectionRow({
  icon: Icon, label, badge, badgeColor, children, defaultOpen = false,
}: {
  icon: any; label: string; badge?: string; badgeColor?: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 transition-all text-left"
        style={{ background: open ? "var(--secondary)" : "var(--card)" }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--iw-blue)" }} />
        <span className="text-xs flex-1" style={{ fontWeight: 600, color: "var(--foreground)" }}>{label}</span>
        {badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
            style={{ background: badgeColor ? `${badgeColor}18` : "var(--secondary)", color: badgeColor || "var(--muted-foreground)" }}>
            {badge}
          </span>
        )}
        <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform"
          style={{ color: "var(--muted-foreground)", transform: open ? "rotate(90deg)" : "rotate(0deg)" }} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function PersonalView({ dept }: { dept: DeptProfile }) {
  const criticalCount = dept.todayFocus.filter(t => t.priority === "critical").length;

  return (
    <div className="space-y-2">

      {/* ── Always visible: Recall strip ── */}
      <div className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ background: "var(--iw-blue-900)", color: "white" }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <Brain className="w-4 h-4" style={{ color: "var(--iw-pink)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>Twin overnight</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
              3 agents ran · 4 memory commits · 2 proposals ready for review
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {[
            { label: "Renewal Watchdog ✓", ok: true },
            { label: "Schema drift detected", ok: false },
          ].map((item, i) => (
            <span key={i} className="text-[9px] px-2 py-1 rounded-lg"
              style={{
                background: item.ok ? "rgba(61,139,110,0.25)" : "rgba(212,136,62,0.25)",
                color: item.ok ? "var(--iw-success)" : "var(--iw-warning)",
                fontWeight: 600,
              }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Collapsed sections — each opens independently ── */}

      {/* Orient: what changed */}
      <SectionRow icon={RotateCcw} label="What changed" badge={`${dept.signals.length} signals`}>
        <div className="space-y-1.5 pt-1">
          {dept.signals.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg"
              style={{ background: "var(--secondary)" }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                style={{ background: item.type === "success" ? "var(--iw-success)" : item.type === "warning" ? "var(--iw-warning)" : "var(--iw-blue)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--foreground)" }}>{item.text}</p>
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{item.time} ago</span>
              </div>
            </div>
          ))}
        </div>
      </SectionRow>

      {/* Prepare: today's calendar */}
      <SectionRow icon={CalendarIcon} label="Today's map" badge="3 events">
        <div className="space-y-2 pt-1">
          {[
            { time: "09:00", label: "Standup", type: "meeting" },
            { time: "11:30", label: "QBR — TechServe Asia", type: "qbr" },
            { time: "14:00", label: "Pipeline review", type: "review" },
          ].map((ev, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] font-mono w-10 shrink-0" style={{ color: "var(--muted-foreground)" }}>{ev.time}</span>
              <div className="w-px h-5 shrink-0" style={{ background: ev.type === "qbr" ? "var(--iw-blue)" : "var(--border)" }} />
              <span className="text-xs" style={{ fontWeight: 500, color: "var(--foreground)" }}>{ev.label}</span>
            </div>
          ))}
        </div>
      </SectionRow>

      {/* Prioritize: needs you — open by default since critical */}
      <SectionRow
        icon={User} label="Needs you"
        badge={`${criticalCount} critical`} badgeColor="var(--iw-danger)"
        defaultOpen={criticalCount > 0}
      >
        <div className="space-y-1.5 pt-1">
          {dept.todayFocus.map((t, i) => {
            const pc = PRIORITY_CONFIG[t.priority];
            return (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer group transition-all"
                style={{ borderColor: t.priority === "critical" ? "rgba(220,74,74,0.2)" : "var(--border)", background: t.priority === "critical" ? "rgba(220,74,74,0.03)" : "var(--background)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.priority === "critical" ? "rgba(220,74,74,0.03)" : "var(--background)"; }}>
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${pc.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug" style={{ fontWeight: 500, color: "var(--foreground)" }}>{t.task}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] px-1 py-0.5 rounded border font-bold uppercase ${pc.badge}`}>{t.priority}</span>
                    <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{t.context}</span>
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                  style={{ color: "var(--muted-foreground)" }} />
              </div>
            );
          })}
        </div>
      </SectionRow>

      {/* Act: quick actions + twin status */}
      <SectionRow icon={Play} label="Act">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
          {dept.quickActions.map((a, i) => (
            <button key={i}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all"
              style={{ borderColor: "var(--border)", background: "var(--background)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--iw-blue)";
                (e.currentTarget as HTMLElement).style.background = "var(--iw-blue-50)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.background = "var(--background)";
              }}>
              <a.icon className="w-4 h-4" style={{ color: "var(--iw-blue)" }} />
              <span className="text-[9px] text-center leading-tight" style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>{a.label}</span>
            </button>
          ))}
        </div>
        {/* Twin in motion */}
        <div className="mt-3 space-y-1.5 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Twin running for you</p>
          {[
            { agent: "Renewal Watchdog", action: "Monitoring 7 accounts — 60d window", status: "running" },
            { agent: "CRM Reconciler", action: "Next sync in 1h 12m", status: "idle" },
            { agent: "Pipeline Scout", action: "Brief ready — 3 insights", status: "done" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: item.status === "running" ? "var(--iw-success)" : item.status === "done" ? "var(--iw-blue)" : "var(--muted-foreground)", ...(item.status === "running" ? { animation: "pulse 2s infinite" } : {}) }} />
              <span className="text-[10px] shrink-0" style={{ fontWeight: 600, color: "var(--foreground)", width: 120 }}>{item.agent}</span>
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{item.action}</span>
            </div>
          ))}
        </div>
      </SectionRow>

      {/* Capture: log before you forget */}
      <SectionRow icon={Pencil} label="Capture">
        <div className="flex gap-2 pt-1 flex-wrap">
          {[
            { label: "Log outcome", icon: ThumbsUp },
            { label: "Add note", icon: FileText },
            { label: "Commit to memory", icon: Brain },
          ].map((a, i) => (
            <button key={i}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-all"
              style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--muted-foreground)", fontWeight: 600 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--iw-purple)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--iw-purple)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
              <a.icon className="w-3.5 h-3.5" /> {a.label}
            </button>
          ))}
        </div>
      </SectionRow>

    </div>
  );
}

// ─── Dashboard View with Progressive Hydration ───────────────────────────────

function DashboardView({ activeCtx, projection, readiness }: any) {
  const goalsCtx = useGoalsSafe();
  const orgType = goalsCtx?.orgType || "PRODUCT";
  const dept = DEPT_PROFILE[activeCtx] || DEPT_PROFILE.CTX_BIZOPS;
  const [demoDismissed, setDemoDismissed] = useState(false);

  const readinessScore = useMemo(() => {
    if (!readiness) return 94;
    const scores = Object.values(readiness).map((r: any) => r.overallScore);
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / (scores.length || 1));
  }, [readiness]);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">

        {/* ── Demo Mode Banner ── */}
        {!demoDismissed && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "rgba(66,86,171,0.06)", border: "1px solid rgba(66,86,171,0.18)" }}>
            <div className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: "var(--iw-blue)" }} />
            <p className="text-xs flex-1" style={{ color: "var(--iw-blue)", fontWeight: 500 }}>
              <strong>Demo mode</strong> — you're seeing sample data for {dept.role}. Connect your tools to see live data from your Spine.
            </p>
            <button className="text-[10px] px-2.5 py-1 rounded-lg font-bold text-white shrink-0 transition-all"
              style={{ background: "var(--iw-blue)" }}
              onClick={() => {}}>
              Connect tools
            </button>
            <button onClick={() => setDemoDismissed(true)} className="shrink-0"
              style={{ color: "var(--muted-foreground)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Header — no view tabs, sidebar handles navigation ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl" style={{ fontWeight: 600 }}>Today's Focus</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
                style={{ color: "var(--iw-success)", borderColor: "var(--iw-success)", background: "var(--iw-pink-light)" }}>
                Demo · {readinessScore}% schema
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {dept.role} · {orgType} · {activeCtx.replace("CTX_", "")}
            </p>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {dept.quickActions.slice(0, 4).map((a) => (
              <button key={a.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)", fontWeight: 500 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
                <a.icon className="w-3 h-3" /> {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Morning brief — always shown, no tab selection needed */}
        <PersonalView dept={dept} />
        {/* Work view and Entities view removed — */}
        {/* navigate via sidebar to Accounts, Analytics, Pipeline etc. */}
        {false && (
          <div className="space-y-5">
            {/* Role KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {dept.kpis.map((kpi, i) => (
                <Card key={i} className="border shadow-sm" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-lg" style={{ background: "var(--iw-blue-50)" }}>
                        <Target className="w-3.5 h-3.5" style={{ color: "var(--iw-blue)" }} />
                      </div>
                      <span className="text-[10px]" style={{ color: kpi.up ? "var(--iw-success)" : "var(--iw-danger)", fontWeight: 600 }}>
                        {kpi.up ? "↑" : "↓"}
                      </span>
                    </div>
                    <div className="text-xl" style={{ fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                    <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ fontWeight: 700, color: "var(--muted-foreground)" }}>{kpi.label}</div>
                    <div className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>{kpi.sub}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Strategic Goals */}
              <Card className="lg:col-span-2 border shadow-sm" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm" style={{ fontWeight: 600 }}>Strategic Goal Alignment</CardTitle>
                  <CardDescription className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    {orgType === "PRODUCT" ? "Product growth goals" : "Service delivery goals"} — {dept.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(strategicGoals.length > 0 ? strategicGoals : [
                    { id: "g1", name: "Increase NRR to 115%", progress: 74, status: "ON_TRACK", lens: "PROVIDER" },
                    { id: "g2", name: "Reduce at-risk ARR below $200K", progress: 52, status: "AT_RISK", lens: "CLIENT" },
                    { id: "g3", name: "Achieve 90% renewal rate Q3", progress: 81, status: "ON_TRACK", lens: "BOTH" },
                  ]).map((sg: any) => (
                    <div key={sg.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[sg.status as GoalStatus]}`} />
                          <span style={{ fontWeight: 600 }}>{sg.name}</span>
                          <span className="text-[9px] flex items-center gap-0.5" style={{ color: "var(--muted-foreground)" }}>
                            {sg.lens === "PROVIDER" ? <><Building2 className="w-2.5 h-2.5" /> Our Growth</> :
                             sg.lens === "CLIENT" ? <><UsersIcon className="w-2.5 h-2.5" /> Client Value</> :
                             <><Target className="w-2.5 h-2.5" /> Both</>}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700 }}>{sg.progress}%</span>
                      </div>
                      <Progress value={sg.progress} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Spine + Schema AI Health */}
              <Card className="border-0 shadow-sm text-white"
                style={{ background: "var(--iw-blue-900)" }}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-4 h-4" style={{ color: "var(--iw-pink)" }} />
                    <h3 className="text-sm" style={{ fontWeight: 700 }}>Spine & Schema AI</h3>
                  </div>
                  <div className="space-y-3 flex-1">
                    {[
                      { label: "Data Freshness", value: "< 2 min", ok: true },
                      { label: "Coverage", value: `${readinessScore}%`, ok: readinessScore >= 80 },
                      { label: "Schema AI", value: "Active", ok: true },
                      { label: "Harmonization", value: dept.schemaGroups.join(", "), ok: true },
                      { label: "Drift Alerts", value: "2 queued", ok: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px]" style={{ fontWeight: 700 }}>{item.value}</span>
                          <div className="w-1.5 h-1.5 rounded-full"
                            style={{ background: item.ok ? "var(--iw-success)" : "var(--iw-warning)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', metaKey: true }))}
                    className="w-full mt-4 py-2 rounded-lg text-xs transition-all"
                    style={{ background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}>
                    Open Intelligence ⌘J
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {false && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Accounts", value: "127", icon: Building2, color: "var(--iw-success)" },
                { label: "At-Risk", value: "4", icon: AlertTriangle, color: "var(--iw-danger)" },
                { label: "Total ARR", value: "$1.42M", icon: DollarSign, color: "var(--iw-blue)" },
              ].map((s, i) => (
                <Card key={i} className="border shadow-sm" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${s.color}18` }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div>
                      <div className="text-xl" style={{ fontWeight: 700 }}>{s.value}</div>
                      <div className="text-[9px] uppercase tracking-wider" style={{ fontWeight: 700, color: "var(--muted-foreground)" }}>{s.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "TechServe India", logo: "🏢", arr: 420000, health: 92, tier: "Enterprise", renewal: "126 days", signals: ["Expansion signal", "High usage"] },
                { name: "CloudBridge APAC", logo: "☁️", arr: 280000, health: 78, tier: "Enterprise", renewal: "72 days", signals: ["CSAT drop"] },
                { name: "FinanceFlow Solutions", logo: "💰", arr: 180000, health: 42, tier: "Mid-Market", renewal: "29 days", signals: ["Champion silent", "Payment failed"] },
                { name: "DataVault Australia", logo: "🔒", arr: 350000, health: 88, tier: "Enterprise", renewal: "204 days", signals: ["NPS 9.2"] },
                { name: "RetailNest Pte Ltd", logo: "🛍️", arr: 95000, health: 71, tier: "SMB", renewal: "98 days", signals: [] },
                { name: "HealthTech Innovations", logo: "🏥", arr: 210000, health: 95, tier: "Mid-Market", renewal: "202 days", signals: ["Usage surge", "Expansion"] },
              ].map((acc, i) => (
                <Card key={i} className="border shadow-sm hover:shadow-md transition-all cursor-pointer"
                  style={{ borderColor: acc.health < 60 ? "var(--iw-danger)" : "var(--border)", background: "var(--card)" }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{acc.logo}</span>
                        <div>
                          <h3 className="text-sm" style={{ fontWeight: 600 }}>{acc.name}</h3>
                          <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{acc.tier}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{
                          background: acc.health >= 80 ? "var(--iw-success)" + "18" : acc.health >= 60 ? "var(--iw-warning)" + "18" : "var(--iw-danger)" + "18",
                          color: acc.health >= 80 ? "var(--iw-success)" : acc.health >= 60 ? "var(--iw-warning)" : "var(--iw-danger)",
                        }}>
                        {acc.health}%
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "var(--muted-foreground)" }}>ARR</span>
                        <span style={{ fontWeight: 700 }}>${(acc.arr / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "var(--muted-foreground)" }}>Renewal</span>
                        <span style={{ fontWeight: 500 }}>{acc.renewal}</span>
                      </div>
                      <Progress value={acc.health} className="h-1" />
                    </div>
                    {acc.signals.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {acc.signals.map((s, j) => (
                          <span key={j} className="text-[8px] px-1.5 py-0.5 rounded border"
                            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>{s}</span>
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