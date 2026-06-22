import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Settings,
  RefreshCw,
  Pause,
  Play,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Eye,
  ArrowUpDown,
  Sparkles,
  Database,
} from "lucide-react";
import { useSpine } from "../spine/spine-client";

type ConnectorStatus = "connected" | "syncing" | "error" | "paused" | "read-only";

interface Connector {
  id: string;
  name: string;
  category: string;
  emoji: string;
  status: ConnectorStatus;
  lastSync: string;
  records: number;
  apiCalls: number;
  mode: "full" | "read-only" | "streaming" | "disconnected";
  permission: "Full Access" | "Read-Write" | "Read-Only";
}

const connectors: Connector[] = [
  { id: "sf", name: "Salesforce", category: "CRM", emoji: "☁️", status: "connected", lastSync: "2 min ago", records: 14520, apiCalls: 1247, mode: "full", permission: "Full Access" },
  { id: "hs", name: "HubSpot", category: "CRM", emoji: "🟠", status: "connected", lastSync: "5 min ago", records: 8340, apiCalls: 892, mode: "read-only", permission: "Read-Only" },
  { id: "slack", name: "Slack", category: "Communication", emoji: "💬", status: "connected", lastSync: "1 min ago", records: 0, apiCalls: 456, mode: "streaming", permission: "Read-Write" },
  { id: "gmail", name: "Gmail", category: "Communication", emoji: "📧", status: "connected", lastSync: "10 min ago", records: 3200, apiCalls: 234, mode: "read-only", permission: "Read-Only" },
  { id: "gcal", name: "Google Calendar", category: "Productivity", emoji: "📅", status: "connected", lastSync: "3 min ago", records: 890, apiCalls: 123, mode: "full", permission: "Read-Write" },
  { id: "stripe", name: "Stripe", category: "Billing", emoji: "💳", status: "syncing", lastSync: "Syncing...", records: 5672, apiCalls: 567, mode: "full", permission: "Read-Only" },
  { id: "notion", name: "Notion", category: "Productivity", emoji: "📝", status: "connected", lastSync: "15 min ago", records: 1230, apiCalls: 89, mode: "full", permission: "Read-Write" },
  { id: "zoom", name: "Zoom", category: "Communication", emoji: "📹", status: "connected", lastSync: "30 min ago", records: 456, apiCalls: 34, mode: "read-only", permission: "Read-Only" },
  { id: "jira", name: "Jira", category: "Productivity", emoji: "🐛", status: "error", lastSync: "Failed 1h ago", records: 2340, apiCalls: 0, mode: "full", permission: "Full Access" },
  { id: "gdrive", name: "Google Drive", category: "Productivity", emoji: "📁", status: "connected", lastSync: "20 min ago", records: 780, apiCalls: 56, mode: "read-only", permission: "Read-Only" },
  { id: "razorpay", name: "Razorpay", category: "Billing", emoji: "💰", status: "syncing", lastSync: "Syncing...", records: 1890, apiCalls: 234, mode: "full", permission: "Read-Write" },
  { id: "asana", name: "Asana", category: "Productivity", emoji: "✅", status: "connected", lastSync: "8 min ago", records: 567, apiCalls: 78, mode: "full", permission: "Read-Write" },
  { id: "confluence", name: "Confluence", category: "Productivity", emoji: "📚", status: "paused", lastSync: "Paused 2d ago", records: 340, apiCalls: 0, mode: "disconnected", permission: "Read-Only" },
  { id: "pipedrive", name: "Pipedrive", category: "CRM", emoji: "🔵", status: "read-only", lastSync: "1h ago", records: 2100, apiCalls: 145, mode: "read-only", permission: "Read-Only" },
  { id: "zoho", name: "Zoho CRM", category: "CRM", emoji: "🟡", status: "connected", lastSync: "45 min ago", records: 3400, apiCalls: 267, mode: "full", permission: "Full Access" },
  { id: "chatgpt", name: "ChatGPT", category: "AI Tools", emoji: "🤖", status: "connected", lastSync: "Streaming", records: 0, apiCalls: 12, mode: "streaming", permission: "Read-Only" },
];

const statusConfig: Record<ConnectorStatus, { color: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  connected: { color: "var(--iw-success)", label: "Connected", icon: CheckCircle },
  syncing: { color: "var(--iw-warning)", label: "Syncing", icon: Loader2 },
  error: { color: "var(--iw-danger)", label: "Error", icon: AlertCircle },
  paused: { color: "var(--muted-foreground)", label: "Paused", icon: Pause },
  "read-only": { color: "var(--iw-blue)", label: "Read-Only", icon: Eye },
};

const modeConfig: Record<string, { color: string; label: string }> = {
  full: { color: "var(--iw-success)", label: "Full Integration" },
  "read-only": { color: "var(--iw-warning)", label: "Read-Only" },
  streaming: { color: "var(--iw-blue)", label: "Streaming" },
  disconnected: { color: "var(--muted-foreground)", label: "Disconnected" },
};

export function IntegrationHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const spine = useSpine();

  // Mark connectors that are in the Spine SSOT as connected
  const mergedConnectors = connectors.map((c) => {
    const spineIds: Record<string, string> = {
      sf: "salesforce", hs: "hubspot", slack: "slack", gmail: "gmail", gcal: "calendly",
      stripe: "stripe", notion: "notion", zoom: "zoom", jira: "jira", gdrive: "google-workspace",
      razorpay: "razorpay", asana: "asana", confluence: "confluence", pipedrive: "pipedrive",
      zoho: "zoho", chatgpt: "chatgpt",
    };
    const spineId = spineIds[c.id];
    if (spineId && spine.connectedApps.includes(spineId)) {
      return { ...c, status: "connected" as ConnectorStatus, lastSync: "SSOT synced" };
    }
    return c;
  });

  const categories = ["all", ...new Set(mergedConnectors.map((c) => c.category))];

  const filtered = mergedConnectors.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const statusCounts = {
    connected: mergedConnectors.filter((c) => c.status === "connected").length,
    syncing: mergedConnectors.filter((c) => c.status === "syncing").length,
    error: mergedConnectors.filter((c) => c.status === "error").length,
    paused: mergedConnectors.filter((c) => c.status === "paused").length,
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Integration Hub</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connectors feed into the Spine SSOT — normalized once, rendered everywhere
            {spine.connectedApps.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary">
                <Database className="w-3 h-3" />
                {spine.connectedApps.length} in SSOT
              </span>
            )}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(statusCounts).map(([status, count]) => {
          const config = statusConfig[status as ConnectorStatus];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                statusFilter === status
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${config.color}15`, color: config.color }}
              >
                <config.icon className={`w-4 h-4 ${status === "syncing" ? "animate-spin" : ""}`} />
              </div>
              <div className="text-left">
                <div className="text-lg" style={{ fontWeight: 600 }}>{count}</div>
                <div className="text-[11px] text-muted-foreground capitalize">{config.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors">
            <ArrowUpDown className="w-3 h-3" />
            Sort
          </button>
        </div>
      </div>

      {/* Connector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((connector) => (
          <ConnectorCard key={connector.id} connector={connector} />
        ))}
      </div>
    </div>
  );
}

function ConnectorCard({ connector }: { connector: Connector }) {
  const statusCfg = statusConfig[connector.status];
  const modeCfg = modeConfig[connector.mode];

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{connector.emoji}</span>
          <div>
            <div className="text-sm" style={{ fontWeight: 500 }}>{connector.name}</div>
            <div className="text-[10px] text-muted-foreground">{connector.category}</div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]"
          style={{
            backgroundColor: `${statusCfg.color}15`,
            color: statusCfg.color,
            fontWeight: 500,
          }}
        >
          <statusCfg.icon className={`w-3 h-3 ${connector.status === "syncing" ? "animate-spin" : ""}`} />
          {statusCfg.label}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-secondary/50 rounded-md">
          <div className="text-[10px] text-muted-foreground">Records</div>
          <div className="text-sm font-mono" style={{ fontWeight: 500 }}>{connector.records.toLocaleString()}</div>
        </div>
        <div className="p-2 bg-secondary/50 rounded-md">
          <div className="text-[10px] text-muted-foreground">API Calls</div>
          <div className="text-sm font-mono" style={{ fontWeight: 500 }}>{connector.apiCalls.toLocaleString()}</div>
        </div>
      </div>

      {/* Mode & Permission */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: `${modeCfg.color}15`,
            color: modeCfg.color,
            fontWeight: 500,
          }}
        >
          {modeCfg.label}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>
          {connector.permission}
        </span>
      </div>

      {/* Last Sync */}
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
        <Clock className="w-3 h-3" />
        Last sync: {connector.lastSync}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-secondary text-xs hover:bg-accent transition-colors">
          <Settings className="w-3 h-3" /> Configure
        </button>
        <button className="flex items-center justify-center p-1.5 rounded-md bg-secondary hover:bg-accent transition-colors">
          <RefreshCw className="w-3 h-3" />
        </button>
        {connector.status === "paused" ? (
          <button className="flex items-center justify-center p-1.5 rounded-md bg-secondary hover:bg-accent transition-colors">
            <Play className="w-3 h-3" />
          </button>
        ) : (
          <button className="flex items-center justify-center p-1.5 rounded-md bg-secondary hover:bg-accent transition-colors">
            <Pause className="w-3 h-3" />
          </button>
        )}
        <button className="flex items-center justify-center p-1.5 rounded-md bg-secondary hover:bg-accent transition-colors">
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}