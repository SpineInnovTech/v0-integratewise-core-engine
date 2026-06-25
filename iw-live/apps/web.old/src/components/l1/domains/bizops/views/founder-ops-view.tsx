/**
 * Founder Ops View — The Founder's Complete Business Cockpit
 *
 * Single unified view covering ALL 14 BIZOPS entity types:
 *   account, contact, opportunity, task, campaign, activity, project,
 *   workflow, kpi, okr, cross_dept_initiative, resource_allocation,
 *   ops_metric, generated_insight
 *
 * Organized into:
 *   - KPI strip (10 cards spanning the full business)
 *   - AI Attention section (L2 cognitive + L1 insights)
 *   - Sales & Pipeline
 *   - Marketing & Campaigns
 *   - Strategic Goals (OKRs + KPIs)
 *   - Operations (Workflows, Projects, Cross-dept initiatives)
 *   - Client Health
 *   - Tasks & Activity
 *   - Resources & Metrics
 *
 * Data: Single batch RPC call for all 14 entity types + L2 cognitive overlay.
 */
import React, { useState } from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Insights } from "@/hooks/use-l2";
import {
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  Zap,
  Target,
  GitBranch,
  Megaphone,
  FolderKanban,
  Activity,
  BarChart3,
  Layers,
  UserCheck,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// All 14 BIZOPS entity types — one batch RPC call
// ---------------------------------------------------------------------------
const BIZOPS_ENTITY_TYPES = [
  "account",
  "contact",
  "opportunity",
  "task",
  "campaign",
  "activity",
  "project",
  "workflow",
  "kpi",
  "okr",
  "cross_dept_initiative",
  "resource_allocation",
  "ops_metric",
  "generated_insight",
] as const;

export function FounderOpsView() {
  const auth = useAuth();
  const {
    data: batch,
    isLoading,
    refetch,
  } = useWorkspaceEntitiesBatch([...BIZOPS_ENTITY_TYPES], { limit: 200 });

  // L2 Cognitive Layer — AI insights for this view
  const l2Ctx = auth.user?.id
    ? { userId: auth.user.id, domain: "BIZOPS", viewId: "founder-ops" }
    : null;
  const { data: l2Insights = [] } = useL2Insights(l2Ctx);

  // Entity arrays
  const accounts = batch.account ?? [];
  const contacts = batch.contact ?? [];
  const opportunities = batch.opportunity ?? [];
  const tasks = batch.task ?? [];
  const campaigns = batch.campaign ?? [];
  const activities = batch.activity ?? [];
  const projects = batch.project ?? [];
  const workflows = batch.workflow ?? [];
  const kpis = batch.kpi ?? [];
  const okrs = batch.okr ?? [];
  const initiatives = batch.cross_dept_initiative ?? [];
  const resources = batch.resource_allocation ?? [];
  const opsMetrics = batch.ops_metric ?? [];
  const insights = batch.generated_insight ?? [];

  // Computed KPIs
  const mrr = accounts.reduce((s: number, a: any) => s + (a.mrr || a.arr / 12 || 0), 0);
  const pipeline = opportunities.reduce((s: number, o: any) => s + (o.amount || o.value || 0), 0);
  const openDeals = opportunities.filter(
    (o: any) => o.status !== "closed" && o.status !== "won" && o.status !== "lost"
  );
  const openTasks = tasks.filter((t: any) => t.status !== "completed" && t.status !== "done");
  const overdueTasks = openTasks.filter(
    (t: any) => t.due_date && new Date(t.due_date) < new Date()
  );
  const activeCampaigns = campaigns.filter(
    (c: any) => c.status === "active" || c.status === "running" || c.status === "live"
  );
  const runningWorkflows = workflows.filter(
    (w: any) => w.status === "active" || w.status === "running" || w.status === "enabled"
  );
  const avgOkrProgress = okrs.length
    ? Math.round(
        okrs.reduce((s: number, o: any) => s + (o.progress || o.progress_percent || 0), 0) /
          okrs.length
      )
    : 0;
  const activeProjects = projects.filter(
    (p: any) => p.status === "active" || p.status === "in_progress" || p.status === "on_track"
  );
  const criticalInsights = insights.filter(
    (i: any) => i.severity === "critical" || i.severity === "high"
  );

  // Combine L2 cognitive insights with L1 entity insights
  const allSignals = [
    ...l2Insights.map((i: any) => ({
      id: i.id,
      text: i.title || i.content || "AI Signal",
      why: i.whyItMatters,
      severity: i.severity || "medium",
      source: "cognitive" as const,
    })),
    ...criticalInsights.slice(0, 5).map((i: any) => ({
      id: i.id,
      text: i.title || i.content || i.insight_text || "Signal",
      why: i.recommended_action || i.summary,
      severity: i.severity || "high",
      source: "entity" as const,
    })),
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your business...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Founder's Cockpit</h2>
          <p className="text-sm text-muted-foreground">Everything that matters, at a glance</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded-lg border hover:bg-accent text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Strip — 10 cards spanning the full business */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniKPI
          label="MRR"
          value={mrr > 0 ? `$${(mrr / 1000).toFixed(0)}K` : "$0"}
          icon={<DollarSign className="h-4 w-4" />}
          color="text-iw-forest-mid"
        />
        <MiniKPI
          label="Pipeline"
          value={pipeline > 0 ? `$${(pipeline / 1000).toFixed(0)}K` : "$0"}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI label="Clients" value={accounts.length} icon={<Users className="h-4 w-4" />} />
        <MiniKPI
          label="Open Deals"
          value={openDeals.length}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <MiniKPI
          label="Tasks"
          value={`${openTasks.length}${overdueTasks.length ? ` (${overdueTasks.length} overdue)` : ""}`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color={overdueTasks.length > 0 ? "text-iw-gold-light" : undefined}
        />
        <MiniKPI
          label="Campaigns"
          value={`${activeCampaigns.length} active`}
          icon={<Megaphone className="h-4 w-4" />}
          color="text-iw-red/80"
        />
        <MiniKPI
          label="Workflows"
          value={`${runningWorkflows.length} running`}
          icon={<GitBranch className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="OKR Progress"
          value={okrs.length ? `${avgOkrProgress}%` : "—"}
          icon={<Target className="h-4 w-4" />}
          color={
            avgOkrProgress >= 70
              ? "text-iw-forest-mid"
              : avgOkrProgress >= 40
                ? "text-iw-gold"
                : "text-iw-red"
          }
        />
        <MiniKPI
          label="Projects"
          value={`${activeProjects.length} active`}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <MiniKPI
          label="AI Signals"
          value={allSignals.length}
          icon={<Zap className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
      </div>

      {/* AI Attention — Cognitive + Entity insights merged */}
      {allSignals.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-iw-slate-mid" /> What needs your attention
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {allSignals.length} signal{allSignals.length !== 1 ? "s" : ""}
            </span>
          </h3>
          <div className="space-y-2">
            {allSignals.slice(0, 7).map((s, idx) => (
              <div
                key={s.id || idx}
                className={`p-3 border rounded-lg text-sm ${
                  s.source === "cognitive"
                    ? "bg-iw-slate-mid/5 dark:bg-iw-slate-mid/90/10 border-purple-200 dark:border-purple-800"
                    : s.severity === "critical"
                      ? "bg-iw-red/5 dark:bg-iw-red/90/10 border-iw-red/20 dark:border-iw-red/80"
                      : "bg-iw-gold/5 dark:bg-amber-900/10 border-iw-gold/20 dark:border-amber-800"
                }`}
              >
                <div className="flex items-start gap-2">
                  {s.source === "cognitive" ? (
                    <Zap className="h-3.5 w-3.5 text-iw-slate-mid mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-iw-gold mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{s.text}</p>
                    {s.why && <p className="text-xs text-muted-foreground mt-1">{s.why}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales & Pipeline */}
      <CollapsibleSection
        title="Sales & Pipeline"
        icon={<Briefcase className="h-4 w-4 text-iw-slate-mid" />}
        count={openDeals.length}
        countLabel="open deals"
        defaultOpen
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Top Deals by Value
            </h4>
            {openDeals.length > 0 ? (
              openDeals
                .sort((a: any, b: any) => (b.amount || b.value || 0) - (a.amount || a.value || 0))
                .slice(0, 8)
                .map((d: any) => (
                  <div
                    key={d.id}
                    className="flex justify-between py-1.5 border-b last:border-0 text-sm"
                  >
                    <span className="truncate mr-2">{d.name || d.title || "Deal"}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.stage && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{d.stage}</span>
                      )}
                      <span className="text-muted-foreground font-medium">
                        ${((d.amount || d.value || 0) / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No open deals</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Key Contacts
            </h4>
            {contacts.length > 0 ? (
              contacts.slice(0, 8).map((c: any) => (
                <div
                  key={c.id}
                  className="flex justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {c.name ||
                      c.full_name ||
                      `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
                      "Contact"}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {c.company || c.account_name || c.role || c.email || ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No contacts synced</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Marketing & Campaigns */}
      <CollapsibleSection
        title="Marketing & Campaigns"
        icon={<Megaphone className="h-4 w-4 text-iw-red/80" />}
        count={campaigns.length}
        countLabel="campaigns"
      >
        {campaigns.length > 0 ? (
          <div className="space-y-2">
            {campaigns.slice(0, 8).map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <p className="font-medium">
                    {c.name || c.campaign_name || c.title || "Campaign"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[c.channel, c.type, c.platform].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={c.status} />
                  {(c.budget || c.spend) && (
                    <span className="text-xs text-muted-foreground">
                      ${((c.spend || c.budget || 0) / 1000).toFixed(0)}K
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No campaigns yet. Connect your marketing tools to see campaigns here.
          </p>
        )}
      </CollapsibleSection>

      {/* Strategic Goals — OKRs + KPIs */}
      <CollapsibleSection
        title="Strategic Goals"
        icon={<Target className="h-4 w-4 text-iw-slate-mid" />}
        count={okrs.length + kpis.length}
        countLabel="goals & KPIs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OKRs */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              OKRs
            </h4>
            {okrs.length > 0 ? (
              okrs.slice(0, 6).map((okr: any) => (
                <div key={okr.id} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate mr-2">
                      {okr.title || okr.objective || okr.name || "OKR"}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {okr.progress || okr.progress_percent || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (okr.progress || okr.progress_percent || 0) >= 70
                          ? "bg-iw-forest-bright"
                          : (okr.progress || okr.progress_percent || 0) >= 40
                            ? "bg-iw-gold"
                            : "bg-iw-red"
                      }`}
                      style={{
                        width: `${Math.min(okr.progress || okr.progress_percent || 0, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No OKRs defined</p>
            )}
          </div>
          {/* KPIs */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Key Performance Indicators
            </h4>
            {kpis.length > 0 ? (
              kpis.slice(0, 6).map((k: any) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">{k.name || k.kpi_name || k.title || "KPI"}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-medium">{k.current_value ?? "—"}</span>
                    {k.target_value != null && (
                      <span className="text-xs text-muted-foreground">/ {k.target_value}</span>
                    )}
                    {k.trend && <TrendIndicator trend={k.trend} />}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No KPIs tracked</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Operations — Workflows, Projects, Cross-dept Initiatives */}
      <CollapsibleSection
        title="Operations"
        icon={<GitBranch className="h-4 w-4 text-iw-slate" />}
        count={workflows.length + projects.length + initiatives.length}
        countLabel="items"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Workflows */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Workflows ({workflows.length})
            </h4>
            {workflows.length > 0 ? (
              workflows.slice(0, 6).map((w: any) => (
                <div
                  key={w.id}
                  className="flex justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {w.name || w.workflow_name || w.title || "Workflow"}
                  </span>
                  <StatusBadge status={w.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No workflows</p>
            )}
          </div>
          {/* Projects */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Projects ({projects.length})
            </h4>
            {projects.length > 0 ? (
              projects.slice(0, 6).map((p: any) => (
                <div key={p.id} className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate mr-2">
                      {p.name || p.project_name || p.title || "Project"}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {p.progress_percent != null ? `${p.progress_percent}%` : p.status || "—"}
                    </span>
                  </div>
                  {p.progress_percent != null && (
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-iw-slate-mid rounded-full"
                        style={{ width: `${Math.min(p.progress_percent, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No projects</p>
            )}
          </div>
          {/* Cross-dept Initiatives */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Initiatives ({initiatives.length})
            </h4>
            {initiatives.length > 0 ? (
              initiatives.slice(0, 6).map((i: any) => (
                <div
                  key={i.id}
                  className="flex justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {i.name || i.initiative_name || i.title || "Initiative"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={i.status} />
                    {i.impact_score != null && (
                      <span className="text-xs text-muted-foreground">
                        impact: {i.impact_score}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No initiatives</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Client Health */}
      <CollapsibleSection
        title="Client Health"
        icon={<Users className="h-4 w-4 text-iw-forest-mid" />}
        count={accounts.length}
        countLabel="clients"
        defaultOpen
      >
        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {accounts
              .sort((a: any, b: any) => (a.health_score || 50) - (b.health_score || 50))
              .slice(0, 12)
              .map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {a.name || a.company || a.account_name || "Account"}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.mrr != null && a.mrr > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ${(a.mrr / 1000).toFixed(0)}K/mo
                      </span>
                    )}
                    <span
                      className={`font-medium text-xs px-1.5 py-0.5 rounded ${
                        (a.health_score || 50) >= 70
                          ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
                          : (a.health_score || 50) >= 40
                            ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
                            : "bg-iw-red/10 text-iw-red dark:bg-iw-red/90/20 dark:text-iw-red/70"
                      }`}
                    >
                      {a.health_score ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No accounts synced</p>
        )}
      </CollapsibleSection>

      {/* Tasks & Activity */}
      <CollapsibleSection
        title="Tasks & Activity"
        icon={<CheckCircle2 className="h-4 w-4 text-iw-gold" />}
        count={openTasks.length}
        countLabel="open tasks"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overdue + upcoming tasks */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {overdueTasks.length > 0 ? `Overdue (${overdueTasks.length})` : "Upcoming Tasks"}
            </h4>
            {(() => {
              const displayTasks =
                overdueTasks.length > 0 ? overdueTasks.slice(0, 8) : openTasks.slice(0, 8);
              return displayTasks.length > 0 ? (
                displayTasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex justify-between py-1.5 border-b last:border-0 text-sm"
                  >
                    <span className="truncate mr-2">
                      {t.title || t.name || t.subject || "Task"}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {t.due_date
                        ? new Date(t.due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : t.priority || "—"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-2">No open tasks</p>
              );
            })()}
          </div>
          {/* Recent activity */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Recent Activity ({activities.length})
            </h4>
            {activities.length > 0 ? (
              activities.slice(0, 8).map((a: any) => (
                <div
                  key={a.id}
                  className="flex justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {a.subject || a.description || a.title || a.type || "Activity"}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {a.created_at || a.date
                      ? new Date(a.created_at || a.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : a.type || "—"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No recent activity</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Resources & Metrics */}
      <CollapsibleSection
        title="Resources & Metrics"
        icon={<BarChart3 className="h-4 w-4 text-iw-forest-bright" />}
        count={opsMetrics.length + resources.length}
        countLabel="items"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ops Metrics */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Ops Metrics ({opsMetrics.length})
            </h4>
            {opsMetrics.length > 0 ? (
              opsMetrics.slice(0, 8).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {m.name || m.metric_name || m.title || "Metric"}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-medium">{m.current_value ?? "—"}</span>
                    {m.target_value != null && (
                      <span className="text-xs text-muted-foreground">/ {m.target_value}</span>
                    )}
                    {m.trend && <TrendIndicator trend={m.trend} />}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No metrics tracked</p>
            )}
          </div>
          {/* Resource Allocation */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Resource Allocation ({resources.length})
            </h4>
            {resources.length > 0 ? (
              resources.slice(0, 8).map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <span className="truncate mr-2">
                    {r.name || r.resource_name || r.title || "Resource"}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.allocation_percent != null && (
                      <span className="text-xs font-medium">{r.allocation_percent}% allocated</span>
                    )}
                    {r.utilization != null && (
                      <span className="text-xs text-muted-foreground">({r.utilization}% used)</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No resource data</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Footer summary */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        Showing {BIZOPS_ENTITY_TYPES.length} entity types across your business
        {" · "}
        {accounts.length} accounts · {opportunities.length} opportunities · {tasks.length} tasks ·{" "}
        {campaigns.length} campaigns · {workflows.length} workflows · {okrs.length} OKRs ·{" "}
        {kpis.length} KPIs · {projects.length} projects · {insights.length} insights
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

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
    s === "active" || s === "running" || s === "live" || s === "enabled" || s === "on_track"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
      : s === "paused" || s === "pending" || s === "draft"
        ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
        : s === "completed" || s === "done" || s === "won"
          ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80"
          : s === "failed" || s === "lost" || s === "blocked" || s === "at_risk"
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

export default FounderOpsView;
