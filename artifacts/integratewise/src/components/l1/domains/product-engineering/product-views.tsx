/**
 * Product Engineering Inner Views — Roadmap, Features, Bugs, Sprints, Tasks, Releases, Analytics, Feedback
 * All data from Spine SSOT product_engineering projection.
 */
import { useState, useMemo } from "react";
import {
  Map,
  Layers,
  Bug,
  Zap,
  CheckSquare,
  Rocket,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  Filter,
  GitPullRequest,
  BarChart3,
  Activity,
  Users,
  MessageSquare,
  Star,
  ThumbsUp,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";

/* ═══════════ Roadmap ═══════════ */
export function ProductRoadmapView() {
  const { data: proj } = useHydrateProjection<any>("product_engineering");
  const roadmapItems = proj?.roadmapItems || proj?.roadmap_items || [];
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return roadmapItems;
    return roadmapItems.filter((r: any) => r.status === statusFilter);
  }, [roadmapItems, statusFilter]);

  const statuses = ["all", "planned", "in_progress", "shipped", "deferred"];
  const statusColor: Record<string, string> = {
    planned: "var(--iw-forest-bright)",
    in_progress: "var(--iw-warning)",
    shipped: "var(--iw-success)",
    deferred: "var(--muted-foreground)",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Roadmap
            </h2>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-[var(--iw-forest-bright)]/15 text-[var(--iw-forest-bright)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: statusFilter === s ? 600 : 400 }}
              >
                {s === "all" ? `All (${roadmapItems.length})` : s.replace("_", " ")}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-forest-bright)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {filtered.map((item: any) => (
            <div
              key={item.roadmap_item_id || item.id}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm" style={{ fontWeight: 600 }}>
                    {item.title || item.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.quarter || item.target_date || "—"} · {item.theme || item.category || "—"}
                  </p>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: `${statusColor[item.status] || "var(--muted-foreground)"}15`,
                    color: statusColor[item.status] || "var(--muted-foreground)",
                    fontWeight: 600,
                  }}
                >
                  {item.status?.replace("_", " ")}
                </span>
              </div>
              {item.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {item.owner && <span>Owner: {item.owner}</span>}
                {item.priority && (
                  <>
                    <span>·</span>
                    <span className="capitalize">Priority: {item.priority}</span>
                  </>
                )}
                {item.effort && (
                  <>
                    <span>·</span>
                    <span>Effort: {item.effort}</span>
                  </>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              {roadmapItems.length === 0
                ? "No roadmap items yet. Connect your product tools to populate."
                : "No items match this filter"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Features ═══════════ */
export function ProductFeaturesView() {
  const { data: proj } = useHydrateProjection<any>("product_engineering");
  const features = proj?.features || [];
  const [search, setSearch] = useState("");

  const filtered = features.filter(
    (f: any) =>
      !search ||
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.owner?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Features
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search features..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-forest-bright)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Feature
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {filtered.map((f: any) => {
            const progress = f.progress ?? 0;
            return (
              <div
                key={f.feature_id || f.id}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm" style={{ fontWeight: 600 }}>
                      {f.title || f.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Owner: {f.owner || f.team || "—"}
                    </p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor:
                        progress >= 80
                          ? "rgba(0,200,83,0.1)"
                          : progress >= 40
                            ? "rgba(255,152,0,0.1)"
                            : "rgba(61, 122, 80,0.1)",
                      color:
                        progress >= 80
                          ? "var(--iw-success)"
                          : progress >= 40
                            ? "var(--iw-warning)"
                            : "var(--iw-forest-bright)",
                      fontWeight: 600,
                    }}
                  >
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor:
                        progress >= 80
                          ? "var(--iw-success)"
                          : progress >= 40
                            ? "var(--iw-warning)"
                            : "var(--iw-forest-bright)",
                    }}
                  />
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              {features.length === 0
                ? "No features tracked yet. Connect your product tools to populate."
                : "No features match your search"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Bug Queue ═══════════ */
export function ProductBugsView() {
  const { data: proj } = useHydrateProjection<any>("product_engineering");
  const bugs = proj?.bugs || [];
  const [severityFilter, setSeverityFilter] = useState("all");

  const filtered = useMemo(() => {
    if (severityFilter === "all") return bugs;
    return bugs.filter((b: any) => b.severity === severityFilter);
  }, [bugs, severityFilter]);

  const severities = ["all", "critical", "high", "medium", "low"];
  const severityColor: Record<string, string> = {
    critical: "var(--iw-danger)",
    high: "var(--iw-danger)",
    medium: "var(--iw-warning)",
    low: "var(--iw-forest-bright)",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Bug Queue
            </h2>
            {severities.map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${severityFilter === s ? "bg-[var(--iw-danger)]/15 text-[var(--iw-danger)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: severityFilter === s ? 600 : 400 }}
              >
                {s === "all" ? `All (${bugs.length})` : s}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-danger)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Report Bug
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Bug</span>
            <span>Severity</span>
            <span>Status</span>
            <span>Assignee</span>
            <span>Reported</span>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {bugs.length === 0
                ? "No bugs tracked yet. Connect your product tools to populate."
                : "No bugs match this filter"}
            </p>
          )}
          {filtered.map((b: any) => (
            <div
              key={b.bug_id || b.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
            >
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                  {b.title || b.name}
                </p>
                <p className="text-[10px] text-muted-foreground">{b.component || "—"}</p>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit"
                style={{
                  backgroundColor: `${severityColor[b.severity] || "var(--muted-foreground)"}15`,
                  color: severityColor[b.severity] || "var(--muted-foreground)",
                  fontWeight: 600,
                }}
              >
                {b.severity}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {b.status?.replace("_", " ") || "open"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {b.assignee || "Unassigned"}
              </span>
              <span className="text-xs text-muted-foreground">{b.reported_at || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Sprint Velocity ═══════════ */
export function ProductSprintsView() {
  const { data: proj } = useHydrateProjection<any>("product_engineering");
  const sprints = proj?.sprints || [];

  const chartData = sprints.map((s: any) => ({
    name: s.name || s.sprint_name,
    velocity: s.velocity ?? s.completed_points ?? 0,
    committed: s.committed_points ?? 0,
  }));

  const avgVelocity =
    sprints.length > 0
      ? Math.round(
          sprints.reduce((s: number, sp: any) => s + (sp.velocity ?? sp.completed_points ?? 0), 0) /
            sprints.length
        )
      : 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg" style={{ fontWeight: 600 }}>
          Sprint Velocity
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Avg Velocity"
          value={avgVelocity > 0 ? `${avgVelocity} pts` : "—"}
          color="var(--iw-forest-bright)"
        />
        <MetricCard
          label="Sprints Tracked"
          value={sprints.length > 0 ? `${sprints.length}` : "—"}
          color="var(--iw-gold)"
        />
        <MetricCard
          label="Current Sprint"
          value={
            sprints.length > 0
              ? sprints[sprints.length - 1]?.name || sprints[sprints.length - 1]?.sprint_name || "—"
              : "—"
          }
          color="var(--iw-success)"
        />
      </div>

      {chartData.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Velocity Trend
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="committed"
                  fill="var(--iw-forest-bright)"
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                  name="Committed"
                />
                <Bar
                  dataKey="velocity"
                  fill="var(--iw-success)"
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                  name="Completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {[
              { l: "Committed", c: "var(--iw-forest-bright)" },
              { l: "Completed", c: "var(--iw-success)" },
            ].map((i) => (
              <span
                key={i.l}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: i.c }} />
                {i.l}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No sprint data yet. Connect your product tools to populate.
        </div>
      )}
    </div>
  );
}

/* ═══════════ Engineering Tasks ═══════════ */
export function ProductTasksView() {
  const { data: proj } = useHydrateProjection<any>("product_engineering");
  const feedback = proj?.feedback || [];
  const pullRequests = proj?.pullRequests || proj?.pull_requests || [];

  // Use feedback as "tasks" or merge with PRs for a task-like view
  const tasks = [
    ...feedback.map((f: any) => ({
      id: f.feedback_id || f.id,
      title: f.title || f.summary || "Untitled feedback",
      type: "feedback",
      status: f.status || "open",
      assignee: f.assignee || "—",
      date: f.created_at || "—",
    })),
    ...pullRequests.map((pr: any) => ({
      id: pr.pr_id || pr.id,
      title: pr.title || "Untitled PR",
      type: "pull_request",
      status: pr.status || "open",
      assignee: pr.author || "—",
      date: pr.created_at || "—",
    })),
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>
            Engineering Tasks
          </h2>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-forest-bright)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Create Task
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Task</span>
            <span>Type</span>
            <span>Status</span>
            <span>Assignee</span>
            <span>Date</span>
          </div>
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No engineering tasks or PRs yet. Connect your product tools to populate.
            </p>
          )}
          {tasks.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
            >
              <div className="min-w-0 flex items-center gap-2">
                {t.type === "pull_request" ? (
                  <GitPullRequest className="w-3.5 h-3.5 text-[var(--iw-gold)] flex-shrink-0" />
                ) : (
                  <CheckSquare className="w-3.5 h-3.5 text-[var(--iw-forest-bright)] flex-shrink-0" />
                )}
                <span className="text-sm truncate" style={{ fontWeight: 500 }}>
                  {t.title}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground capitalize">
                {t.type.replace("_", " ")}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {t.status.replace("_", " ")}
              </span>
              <span className="text-xs text-muted-foreground truncate">{t.assignee}</span>
              <span className="text-xs text-muted-foreground">{t.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Release Train ═══════════ */
export function ProductReleasesView() {
  const { data: proj } = useHydrateProjection<any>("product_engineering");
  const releases = proj?.releases || [];

  const statusColor: Record<string, string> = {
    deployed: "var(--iw-success)",
    staging: "var(--iw-forest-bright)",
    planned: "var(--muted-foreground)",
    beta: "var(--iw-gold)",
    rollback: "var(--iw-danger)",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>
            Release Train
          </h2>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-success)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Release
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {releases.map((r: any) => (
            <div
              key={r.release_id || r.id}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-[var(--iw-success)]" />
                  <h4 className="text-sm" style={{ fontWeight: 600 }}>
                    {r.version || r.name || "Untitled Release"}
                  </h4>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: `${statusColor[r.status] || "var(--muted-foreground)"}15`,
                    color: statusColor[r.status] || "var(--muted-foreground)",
                    fontWeight: 600,
                  }}
                >
                  {r.status || "planned"}
                </span>
              </div>
              {r.description && (
                <p className="text-[11px] text-muted-foreground mb-2">{r.description}</p>
              )}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{r.release_date || "—"}</span>
                {r.features_count != null && (
                  <>
                    <span>·</span>
                    <span>{r.features_count} features</span>
                  </>
                )}
                {r.bugs_fixed != null && (
                  <>
                    <span>·</span>
                    <span>{r.bugs_fixed} fixes</span>
                  </>
                )}
              </div>
            </div>
          ))}
          {releases.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No releases tracked yet. Connect your product tools to populate.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Engineering Analytics ═══════════ */
export function ProductAnalyticsView() {
  const { data: proj } = useHydrateProjection<any>("product_engineering");
  const metrics = proj?.pe_metrics || proj?.metrics || [];
  const releases = proj?.releases || [];
  const bugs = proj?.bugs || [];
  const sprints = proj?.sprints || [];
  const pullRequests = proj?.pull_requests || proj?.pullRequests || [];

  // Derive analytics from available projection data
  const deploymentCount = releases.filter(
    (r: any) => r.status === "released" || r.status === "deployed"
  ).length;
  const activeSprints = sprints.filter((s: any) => s.status === "active").length;
  const openBugs = bugs.filter(
    (b: any) => b.status === "open" || b.status === "in_progress"
  ).length;
  const mergedPRs = pullRequests.filter((pr: any) => pr.status === "merged").length;

  // Build sparkline-style data from metrics if available
  const trendData = useMemo(() => {
    if (metrics.length > 0) {
      return metrics.slice(-8).map((m: any, i: number) => ({
        name: m.period || `W${i + 1}`,
        deployments: m.deployments || 0,
        velocity: m.velocity || 0,
        bugs: m.bugs_opened || 0,
      }));
    }
    return [];
  }, [metrics]);

  const summaryCards = [
    {
      label: "Deployments",
      value: deploymentCount > 0 ? String(deploymentCount) : "—",
      color: "var(--iw-success)",
      icon: Rocket,
      sub: "Releases shipped",
    },
    {
      label: "Active Sprints",
      value: activeSprints > 0 ? String(activeSprints) : "—",
      color: "var(--iw-forest-bright)",
      icon: Zap,
      sub: "In progress",
    },
    {
      label: "Open Bugs",
      value: openBugs > 0 ? String(openBugs) : "—",
      color: openBugs > 10 ? "var(--iw-error)" : "var(--iw-warning)",
      icon: Bug,
      sub: "Needs attention",
    },
    {
      label: "Merged PRs",
      value: mergedPRs > 0 ? String(mergedPRs) : "—",
      color: "var(--iw-gold)",
      icon: GitPullRequest,
      sub: "Code reviews completed",
    },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-lg" style={{ fontWeight: 600 }}>
          Engineering Analytics
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Development metrics and performance data
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
            <p className="text-xl" style={{ fontWeight: 700, color: card.color }}>
              {card.value}
            </p>
            {card.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {trendData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>
            Velocity Trend
          </h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="velocity" fill="var(--iw-forest-bright)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deployments" fill="var(--iw-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Derived performance insights */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>
          Performance Summary
        </h3>
        {releases.length > 0 || bugs.length > 0 || pullRequests.length > 0 ? (
          <div className="space-y-3">
            {[
              {
                label: "Deployment Frequency",
                value: deploymentCount > 0 ? `${deploymentCount} releases` : "—",
                icon: Rocket,
              },
              {
                label: "Bug Resolution",
                value:
                  bugs.length > 0
                    ? `${bugs.filter((b: any) => b.status === "resolved" || b.status === "closed").length} / ${bugs.length} resolved`
                    : "—",
                icon: Bug,
              },
              {
                label: "PR Throughput",
                value:
                  pullRequests.length > 0 ? `${mergedPRs} / ${pullRequests.length} merged` : "—",
                icon: GitPullRequest,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  <row.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                </div>
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Connect your engineering tools to see performance analytics.
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════ User Feedback ═══════════ */
export function ProductFeedbackView() {
  const { data: proj } = useHydrateProjection<any>("product_engineering");
  const feedback = proj?.feedback || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = useMemo(() => {
    let items = feedback;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (f: any) =>
          (f.title || f.summary || "").toLowerCase().includes(q) ||
          (f.description || f.body || "").toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") {
      items = items.filter((f: any) => (f.type || f.category || "general") === filterType);
    }
    return items;
  }, [feedback, searchQuery, filterType]);

  const typeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    feedback.forEach((f: any) => {
      const t = f.type || f.category || "general";
      dist[t] = (dist[t] || 0) + 1;
    });
    return dist;
  }, [feedback]);

  const ratingIcon = (rating: number | undefined) => {
    if (!rating) return null;
    if (rating >= 4) return <Star className="w-3.5 h-3.5" style={{ color: "var(--iw-warning)" }} />;
    if (rating >= 3)
      return <ThumbsUp className="w-3.5 h-3.5" style={{ color: "var(--iw-forest-bright)" }} />;
    return <AlertTriangle className="w-3.5 h-3.5" style={{ color: "var(--iw-error)" }} />;
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-lg" style={{ fontWeight: 600 }}>
          User Feedback
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Collect and analyze user feedback from connected tools
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Total Feedback"
          value={feedback.length > 0 ? String(feedback.length) : "—"}
          color="var(--foreground)"
        />
        <MetricCard
          label="Feature Requests"
          value={String(
            typeDistribution["feature_request"] || typeDistribution["feature-request"] || 0
          )}
          color="var(--iw-forest-bright)"
        />
        <MetricCard
          label="Bug Reports"
          value={String(typeDistribution["bug"] || typeDistribution["bug_report"] || 0)}
          color="var(--iw-error)"
        />
        <MetricCard
          label="Praise"
          value={String(typeDistribution["praise"] || typeDistribution["positive"] || 0)}
          color="var(--iw-success)"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none"
        >
          <option value="all">All Types</option>
          {Object.keys(typeDistribution).map((t) => (
            <option key={t} value={t}>
              {t.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} (
              {typeDistribution[t]})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((item: any) => {
          const rating = item.rating || item.score;
          const author = item.author || item.user || item.submitted_by || "Anonymous";
          const itemType = item.type || item.category || "general";
          return (
            <div
              key={item.id || item.feedback_id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{ratingIcon(rating)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm truncate" style={{ fontWeight: 600 }}>
                      {item.title || item.summary || "Untitled feedback"}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded capitalize ml-2 shrink-0"
                      style={{
                        backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                        color: "var(--primary)",
                        fontWeight: 500,
                      }}
                    >
                      {itemType.replace(/[_-]/g, " ")}
                    </span>
                  </div>
                  {(item.description || item.body) && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {item.description || item.body}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{typeof author === "string" ? author : author.name || "User"}</span>
                    {item.created_at && (
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    )}
                    {rating && <span>Rating: {rating}/5</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">
              {feedback.length === 0
                ? "No feedback yet. Connect your product tools to collect user feedback."
                : "No feedback matches your filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared Helpers ─── */
function MetricCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl" style={{ fontWeight: 700, color }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
