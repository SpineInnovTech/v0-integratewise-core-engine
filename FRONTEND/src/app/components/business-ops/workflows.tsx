import { useState } from "react";
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

const workflows: Workflow[] = [
  { id: "wf1", name: "Renewal Risk Alert", description: "Triggers when account health drops below 60 or renewal within 30 days", status: "active", trigger: "Health Score Change", lastRun: "5 min ago", runs24h: 12, successRate: 100, category: "Revenue", nodes: 6, createdBy: "Arun K.", hasAI: true, hasApproval: true },
  { id: "wf2", name: "New Lead Routing (APAC)", description: "Routes inbound leads to regional sales reps based on territory mapping", status: "active", trigger: "New Lead Created", lastRun: "15 min ago", runs24h: 34, successRate: 97, category: "Sales", nodes: 8, createdBy: "Priya S.", hasAI: false, hasApproval: false },
  { id: "wf3", name: "Salesforce → HubSpot Sync", description: "Bi-directional sync of contacts, deals, and activity between CRM platforms", status: "active", trigger: "Record Changed", lastRun: "2 min ago", runs24h: 156, successRate: 99.4, category: "Integration", nodes: 4, createdBy: "Arun K.", hasAI: false, hasApproval: false },
  { id: "wf4", name: "Customer Onboarding Flow", description: "Multi-step onboarding with welcome email, Slack intro, and training scheduler", status: "active", trigger: "Deal Closed Won", lastRun: "2h ago", runs24h: 3, successRate: 100, category: "CS", nodes: 12, createdBy: "Anjali P.", hasAI: true, hasApproval: true },
  { id: "wf5", name: "Invoice Generation (Stripe)", description: "Auto-generates and sends invoices via Stripe when milestones are hit", status: "paused", trigger: "Milestone Reached", lastRun: "3d ago", runs24h: 0, successRate: 95, category: "Revenue", nodes: 5, createdBy: "Rajesh M.", hasAI: false, hasApproval: true },
  { id: "wf6", name: "Churn Prediction Pipeline", description: "AI-powered churn scoring based on engagement, support tickets, and NPS", status: "active", trigger: "Scheduled (Daily 9AM IST)", lastRun: "6h ago", runs24h: 1, successRate: 100, category: "CS", nodes: 9, createdBy: "Arun K.", hasAI: true, hasApproval: false },
  { id: "wf7", name: "Marketing Attribution Sync", description: "Syncs UTM data from website to CRM and maps to revenue touchpoints", status: "error", trigger: "Page Visit Tracked", lastRun: "1h ago (Failed)", runs24h: 0, successRate: 78, category: "Marketing", nodes: 7, createdBy: "Deepak J.", hasAI: false, hasApproval: false },
  { id: "wf8", name: "Weekly Ops Report", description: "Generates and distributes weekly operational metrics to leadership", status: "active", trigger: "Scheduled (Mon 8AM IST)", lastRun: "2d ago", runs24h: 0, successRate: 100, category: "Ops", nodes: 5, createdBy: "Priya S.", hasAI: true, hasApproval: false },
  { id: "wf9", name: "Slack Alert: Critical Ticket", description: "Posts to #ops-alerts when P1 support ticket created", status: "draft", trigger: "Support Ticket Created", lastRun: "Never", runs24h: 0, successRate: 0, category: "Support", nodes: 3, createdBy: "Vikram R.", hasAI: false, hasApproval: false },
];

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: { color: "#00C853", bg: "rgba(0,200,83,0.1)", label: "Active", icon: Play },
  paused: { color: "#FF9800", bg: "rgba(255,152,0,0.1)", label: "Paused", icon: Pause },
  draft: { color: "#9E9E9E", bg: "rgba(158,158,158,0.1)", label: "Draft", icon: Clock },
  error: { color: "#F44336", bg: "rgba(244,67,54,0.1)", label: "Error", icon: AlertTriangle },
};

export function WorkflowsView() {
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
    avgSuccess: Math.round(workflows.filter((w) => w.status === "active").reduce((s, w) => s + w.successRate, 0) / workflows.filter((w) => w.status === "active").length * 10) / 10,
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
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm"
        >
          <Plus className="w-4 h-4" /> Create Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Active Workflows" value={stats.active} icon={<Play className="w-4 h-4" />} color="var(--iw-success)" />
        <StatBox label="Runs (24h)" value={stats.totalRuns} icon={<Zap className="w-4 h-4" />} color="var(--iw-blue)" />
        <StatBox label="Avg Success Rate" value={`${stats.avgSuccess}%`} icon={<CheckCircle className="w-4 h-4" />} color="var(--iw-purple)" />
        <StatBox label="Errors" value={stats.errors} icon={<AlertTriangle className="w-4 h-4" />} color="var(--iw-danger)" />
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
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
          <option value="error">Error</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Workflow Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((wf) => {
          const cfg = statusConfig[wf.status];
          const StatusIcon = cfg.icon;
          return (
            <div key={wf.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                    <GitBranch className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <div className="text-sm flex items-center gap-2" style={{ fontWeight: 600 }}>
                      {wf.name}
                      {wf.hasAI && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--iw-purple)]/10 text-[var(--iw-purple)]" style={{ fontWeight: 500 }}>
                          AI
                        </span>
                      )}
                      {wf.hasApproval && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]" style={{ fontWeight: 500 }}>
                          Approval
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{wf.description}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 500 }}>
                  <StatusIcon className="w-3 h-3" /> {cfg.label}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3 mb-3">
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Trigger</div>
                  <div className="text-[10px] truncate" style={{ fontWeight: 500 }}>{wf.trigger}</div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Runs (24h)</div>
                  <div className="text-[10px]" style={{ fontWeight: 500 }}>{wf.runs24h}</div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Success</div>
                  <div className="text-[10px]" style={{ fontWeight: 500, color: wf.successRate >= 95 ? "var(--iw-success)" : wf.successRate >= 80 ? "var(--iw-warning)" : "var(--iw-danger)" }}>{wf.successRate}%</div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Nodes</div>
                  <div className="text-[10px]" style={{ fontWeight: 500 }}>{wf.nodes}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {wf.lastRun}</span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary" style={{ fontWeight: 500 }}>{wf.category}</span>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-secondary transition-colors" title="View"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1 rounded hover:bg-secondary transition-colors" title="Duplicate"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1 rounded hover:bg-secondary transition-colors" title="Settings"><Settings className="w-3.5 h-3.5 text-muted-foreground" /></button>
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
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-md hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Workflow Name</label>
                <input type="text" placeholder="e.g. Lead Qualification Pipeline" className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
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
                <label className="text-xs text-muted-foreground mb-2 block">Start from Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Lead Routing", "Data Sync", "Alert & Notify", "Blank Canvas"].map((t) => (
                    <button key={t} className="p-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left">
                      <div className="text-xs" style={{ fontWeight: 500 }}>{t}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-border">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-md bg-secondary text-sm hover:bg-accent transition-colors">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">Create</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg" style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}