/**
 * BizOps — Integration Hub
 *
 * Shows the connector catalog with REAL connection status from Spine SSOT.
 * Connected connectors are derived from useSpine().connectedApps — no fake data.
 */
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Settings,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  Eye,
  ArrowUpDown,
  Database,
  Loader2,
  Unplug,
} from "lucide-react";
import { useSpine } from "@/components/l2/spine/spine-client";

type ConnectorStatus = "connected" | "available";

interface Connector {
  id: string;
  name: string;
  category: string;
  emoji: string;
  status: ConnectorStatus;
  description: string;
}

/**
 * Connector catalog — these are the providers IntegrateWise supports.
 * This is product capability (static), not tenant data (dynamic).
 * Status is overridden at render time based on Spine's connectedApps.
 */
const CONNECTOR_CATALOG: Omit<Connector, "status">[] = [
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    emoji: "\u2601\uFE0F",
    description: "Accounts, contacts, opportunities, activities",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    emoji: "\uD83D\uDFE0",
    description: "Contacts, deals, companies, tickets",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    emoji: "\uD83D\uDCAC",
    description: "Messages, channels, workflows",
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "Communication",
    emoji: "\uD83D\uDCE7",
    description: "Emails, threads, contacts",
  },
  {
    id: "calendly",
    name: "Google Calendar",
    category: "Productivity",
    emoji: "\uD83D\uDCC5",
    description: "Events, meetings, availability",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Billing",
    emoji: "\uD83D\uDCB3",
    description: "Invoices, subscriptions, payments",
  },
  {
    id: "notion",
    name: "Notion",
    category: "Productivity",
    emoji: "\uD83D\uDCDD",
    description: "Pages, databases, documents",
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "Communication",
    emoji: "\uD83D\uDCF9",
    description: "Meetings, recordings, participants",
  },
  {
    id: "jira",
    name: "Jira",
    category: "Productivity",
    emoji: "\uD83D\uDC1B",
    description: "Issues, sprints, projects",
  },
  {
    id: "google-workspace",
    name: "Google Drive",
    category: "Productivity",
    emoji: "\uD83D\uDCC1",
    description: "Files, folders, shared drives",
  },
  {
    id: "razorpay",
    name: "Razorpay",
    category: "Billing",
    emoji: "\uD83D\uDCB0",
    description: "Orders, payments, settlements",
  },
  {
    id: "asana",
    name: "Asana",
    category: "Productivity",
    emoji: "\u2705",
    description: "Tasks, projects, timelines",
  },
  {
    id: "confluence",
    name: "Confluence",
    category: "Productivity",
    emoji: "\uD83D\uDCDA",
    description: "Pages, spaces, knowledge base",
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "CRM",
    emoji: "\uD83D\uDD35",
    description: "Deals, contacts, activities",
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    category: "CRM",
    emoji: "\uD83D\uDFE1",
    description: "Leads, accounts, deals",
  },
  {
    id: "linear",
    name: "Linear",
    category: "Productivity",
    emoji: "\u26A1",
    description: "Issues, projects, cycles",
  },
  {
    id: "github",
    name: "GitHub",
    category: "Development",
    emoji: "\uD83D\uDC19",
    description: "Repos, PRs, issues, deployments",
  },
  {
    id: "freshdesk",
    name: "Freshdesk",
    category: "Service",
    emoji: "\uD83C\uDFE2",
    description: "Tickets, contacts, agents",
  },
  {
    id: "zendesk",
    name: "Zendesk",
    category: "Service",
    emoji: "\uD83C\uDF1F",
    description: "Tickets, users, organizations",
  },
  {
    id: "intercom",
    name: "Intercom",
    category: "Service",
    emoji: "\uD83D\uDDE8\uFE0F",
    description: "Conversations, contacts, companies",
  },
];

export function IntegrationHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const spine = useSpine();

  // Merge catalog with real Spine connection status
  const connectors: Connector[] = useMemo(
    () =>
      CONNECTOR_CATALOG.map((c) => ({
        ...c,
        status: spine.connectedApps.includes(c.id)
          ? ("connected" as const)
          : ("available" as const),
      })),
    [spine.connectedApps]
  );

  const categories = ["all", ...new Set(connectors.map((c) => c.category))];

  const filtered = connectors.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const connectedCount = connectors.filter((c) => c.status === "connected").length;
  const availableCount = connectors.filter((c) => c.status === "available").length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Integration Hub</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connectors feed into the Spine — normalized once, rendered everywhere
            {connectedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary">
                <Database className="w-3 h-3" />
                {connectedCount} connected
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
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setStatusFilter(statusFilter === "connected" ? "all" : "connected")}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
            statusFilter === "connected"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:bg-secondary"
          }`}
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,200,83,0.15)", color: "var(--iw-success)" }}
          >
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-lg" style={{ fontWeight: 600 }}>
              {connectedCount}
            </div>
            <div className="text-[11px] text-muted-foreground">Connected</div>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === "available" ? "all" : "available")}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
            statusFilter === "available"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:bg-secondary"
          }`}
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "rgba(158,158,158,0.15)", color: "var(--muted-foreground)" }}
          >
            <Unplug className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-lg" style={{ fontWeight: 600 }}>
              {availableCount}
            </div>
            <div className="text-[11px] text-muted-foreground">Available</div>
          </div>
        </button>
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
        </div>
      </div>

      {/* Connector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((connector) => (
          <ConnectorCard key={connector.id} connector={connector} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No integrations match your search.</p>
        </div>
      )}
    </div>
  );
}

function ConnectorCard({ connector }: { connector: Connector }) {
  const isConnected = connector.status === "connected";

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{connector.emoji}</span>
          <div>
            <div className="text-sm" style={{ fontWeight: 500 }}>
              {connector.name}
            </div>
            <div className="text-[10px] text-muted-foreground">{connector.category}</div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]"
          style={{
            backgroundColor: isConnected ? "rgba(0,200,83,0.15)" : "rgba(158,158,158,0.15)",
            color: isConnected ? "var(--iw-success)" : "var(--muted-foreground)",
            fontWeight: 500,
          }}
        >
          <CheckCircle className="w-3 h-3" />
          {isConnected ? "Connected" : "Available"}
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">{connector.description}</p>

      {/* Action */}
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {isConnected ? (
          <>
            <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-secondary text-xs hover:bg-accent transition-colors">
              <Settings className="w-3 h-3" /> Configure
            </button>
            <button className="flex items-center justify-center p-1.5 rounded-md bg-secondary hover:bg-accent transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
          </>
        ) : (
          <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors">
            <Plus className="w-3 h-3" /> Connect
          </button>
        )}
      </div>
    </div>
  );
}

export default IntegrationHub;
