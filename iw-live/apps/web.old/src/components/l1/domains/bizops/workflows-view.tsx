/**
 * BizOps — Workflows view
 *
 * Wired to real entity data via direct Supabase RPC.
 * Entity type: "workflow" (bizops.workflow schema)
 */
import { useState, useMemo } from "react";
import {
  GitBranch,
  Plus,
  Search,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  MoreHorizontal,
  Filter,
  ArrowRight,
  Copy,
  Trash2,
  Eye,
  Settings,
  Bot,
  ShieldCheck,
  RefreshCw,
  X,
  PenTool,
} from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft" | "error";
  trigger: string;
  lastRun: string;
  runs24h: number;
  successRate: number;
  category: string;
  nodes: number;
  createdBy: string;
  hasAI: boolean;
  hasApproval: boolean;
}

/** Map raw entity data from Supabase to the Workflow UI interface */
function normalizeWorkflow(raw: any): Workflow {
  const status = normalizeWfStatus(raw.status);
  const lastRun = raw.last_run_at || raw.last_execution;
  return {
    id: raw.id || raw.workflow_id || crypto.randomUUID(),
    name: raw.name || raw.workflow_name || raw.title || "Untitled Workflow",
    description: raw.description || raw.summary || "",
    status,
    trigger: raw.trigger || raw.trigger_type || "Manual",
    lastRun: lastRun ? formatRelativeTime(lastRun) : "Never",
    runs24h: raw.executions_24h || raw.runs_24h || raw.executions || 0,
    successRate: raw.success_rate != null ? Number(raw.success_rate) : 0,
    category: raw.category || raw.department || "Ops",
    nodes: raw.steps_count || raw.node_count || raw.nodes || 0,
    createdBy: raw.created_by || raw.owner || "",
    hasAI: raw.has_ai === true || raw.ai_enabled === true,
    hasApproval: raw.has_approval === true || raw.approval_required === true,
  };
}

function normalizeWfStatus(s: string | undefined): Workflow["status"] {
  if (!s) return "draft";
  const lower = s.toLowerCase();
  if (lower === "active" || lower === "running" || lower === "enabled") return "active";
  if (lower === "paused" || lower === "disabled" || lower === "suspended") return "paused";
  if (lower === "error" || lower === "failed" || lower === "broken") return "error";
  return "draft";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusConfig: Record<
  string,
  { color: string; bg: string; label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  active: { color: "#3D7A50", bg: "rgba(0,200,83,0.1)", label: "Active", icon: Play },
  paused: { color: "#B8943F", bg: "rgba(255,152,0,0.1)", label: "Paused", icon: Pause },
  draft: { color: "#8A8580", bg: "rgba(158,158,158,0.1)", label: "Draft", icon: Clock },
  error: { color: "#8B2020", bg: "rgba(244,67,54,0.1)", label: "Error", icon: AlertTriangle },
};

export function WorkflowsView() {
  const { data: rawWorkflows, isLoading, refetch } = useWorkspaceEntities("workflow");
  const workflows = useMemo(() => rawWorkflows.map(normalizeWorkflow), [rawWorkflows]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = workflows.filter((wf) => {
    if (searchQuery && !wf.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && wf.status !== statusFilter) return false;
    if (categoryFilter !== "all" && wf.category !== categoryFilter) return false;
    return true;
  });

  const categories = [...new Set(workflows.map((w) => w.category))];

  const stats = {
    active: workflows.filter((w) => w.status === "active").length,
    totalRuns: workflows.reduce((s, w) => s + w.runs24h, 0),
    avgSuccess:
      Math.round(
        (workflows.filter((w) => w.status === "active").reduce((s, w) => s + w.successRate, 0) /
          workflows.filter((w) => w.status === "active").length) *
          10
      ) / 10,
    errors: workflows.filter((w) => w.status === "error").length,
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Workflows & Automation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Build, manage, and monitor automated workflows across your integration stack
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg border hover:bg-accent text-muted-foreground"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            <Plus className="w-4 h-4" /> Create Workflow
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox
          label="Active Workflows"
          value={stats.active}
          icon={<Play className="w-4 h-4" />}
          color="var(--iw-success)"
        />
        <StatBox
          label="Runs (24h)"
          value={stats.totalRuns}
          icon={<Zap className="w-4 h-4" />}
          color="var(--iw-forest-bright)"
        />
        <StatBox
          label="Avg Success Rate"
          value={`${stats.avgSuccess}%`}
          icon={<CheckCircle className="w-4 h-4" />}
          color="var(--iw-gold)"
        />
        <StatBox
          label="Errors"
          value={stats.errors}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="var(--iw-danger)"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
          <option value="error">Error</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Workflow Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((wf) => {
          const cfg = statusConfig[wf.status];
          const StatusIcon = cfg.icon;
          return (
            <div
              key={wf.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <GitBranch className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <div className="text-sm flex items-center gap-2" style={{ fontWeight: 600 }}>
                      {wf.name}
                      {wf.hasAI && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--iw-gold)]/10 text-[var(--iw-gold)]"
                          style={{ fontWeight: 500 }}
                        >
                          AI
                        </span>
                      )}
                      {wf.hasApproval && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]"
                          style={{ fontWeight: 500 }}
                        >
                          Approval
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{wf.description}</div>
                  </div>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 500 }}
                >
                  <StatusIcon className="w-3 h-3" /> {cfg.label}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3 mb-3">
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Trigger</div>
                  <div className="text-[10px] truncate" style={{ fontWeight: 500 }}>
                    {wf.trigger}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Runs (24h)</div>
                  <div className="text-[10px]" style={{ fontWeight: 500 }}>
                    {wf.runs24h}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Success</div>
                  <div
                    className="text-[10px]"
                    style={{
                      fontWeight: 500,
                      color:
                        wf.successRate >= 95
                          ? "var(--iw-success)"
                          : wf.successRate >= 80
                            ? "var(--iw-warning)"
                            : "var(--iw-danger)",
                    }}
                  >
                    {wf.successRate}%
                  </div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Nodes</div>
                  <div className="text-[10px]" style={{ fontWeight: 500 }}>
                    {wf.nodes}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {wf.lastRun}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary" style={{ fontWeight: 500 }}>
                    {wf.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-secondary transition-colors" title="View">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-secondary transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-secondary transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Workflow Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[500px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3>Create New Workflow</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-md hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Workflow Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Qualification Pipeline"
                  className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trigger Type</label>
                <select className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
                  <option>Record Created</option>
                  <option>Record Updated</option>
                  <option>Scheduled (Cron)</option>
                  <option>Webhook Received</option>
                  <option>Health Score Changed</option>
                  <option>Manual Trigger</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Start from Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Lead Routing", "Data Sync", "Alert & Notify", "Blank Canvas"].map((t) => (
                    <button
                      key={t}
                      className="p-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                    >
                      <div className="text-xs" style={{ fontWeight: 500 }}>
                        {t}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-border">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 rounded-md bg-secondary text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
              >
                Create
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg" style={{ fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

export default WorkflowsView;
