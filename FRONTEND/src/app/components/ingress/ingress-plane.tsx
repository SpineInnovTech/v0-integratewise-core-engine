/**
 * Ingress Plane — Everything entering SPINE
 *
 * Doctrine:
 *   Ingress  = owns Proof   (what entered, how, evidence)
 *   SPINE    = owns Memory  (what matters)
 *   Twin     = owns Intelligence (what next)
 *
 * "Integrations" only answers: can I reach the system?
 * "Ingress" answers: what entered, how was it transformed, what proof exists?
 *
 * Tabs:
 * ├── Connections    — Nango, MCP transport, API wrappers
 * ├── MCP Registry   — servers, tools, health, versions
 * ├── Schema         — domain registry, projections, mappings
 * └── Evidence       — import logs, tool invocations, lineage, proof records
 *
 * AI-related logs (Twin reasoning, agent execution) do NOT belong here.
 * Those belong in Twin Governance. Ingress is strictly data provenance.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2, GitBranch, Layers, Shield, Search, CheckCircle2,
  AlertTriangle, RefreshCw, Clock, ChevronRight, ArrowRight,
  Database, FileCheck, Activity, Loader2, Plus, X, Lock,
  Server, Cpu, Hash, Package, Eye
} from "lucide-react";
import { IntegrationsHub } from "../integrations-hub";
import { SchemaRegistry } from "../spine/schema-registry";

// ─── Types ────────────────────────────────────────────────────────────────────

type IngressTab = "Connections" | "MCP" | "Schema" | "Evidence";

// ─── MCP Registry data ────────────────────────────────────────────────────────

interface MCPServer {
  id: string;
  name: string;
  owner: string;
  version: string;
  transport: "stdio" | "http" | "sse";
  status: "healthy" | "degraded" | "offline";
  toolCount: number;
  lastPing: string;
  tools: { name: string; description: string; callCount: number }[];
}

const MCP_SERVERS: MCPServer[] = [
  {
    id: "mcp-github",
    name: "GitHub MCP",
    owner: "IntegrateWise",
    version: "1.2.0",
    transport: "stdio",
    status: "healthy",
    toolCount: 8,
    lastPing: "12s ago",
    tools: [
      { name: "list_repositories", description: "List org repositories", callCount: 247 },
      { name: "get_pull_requests", description: "Fetch open PRs", callCount: 183 },
      { name: "create_issue", description: "Create a GitHub issue", callCount: 42 },
      { name: "get_commits", description: "Fetch commit history", callCount: 129 },
    ],
  },
  {
    id: "mcp-notion",
    name: "Notion MCP",
    owner: "Notion Labs",
    version: "0.9.1",
    transport: "http",
    status: "healthy",
    toolCount: 5,
    lastPing: "45s ago",
    tools: [
      { name: "query_database", description: "Query a Notion database", callCount: 318 },
      { name: "get_page", description: "Fetch page content", callCount: 201 },
      { name: "create_page", description: "Create a new page", callCount: 14 },
    ],
  },
  {
    id: "mcp-linear",
    name: "Linear MCP",
    owner: "Linear App",
    version: "1.0.0",
    transport: "stdio",
    status: "degraded",
    toolCount: 6,
    lastPing: "3m ago",
    tools: [
      { name: "list_issues", description: "List team issues", callCount: 156 },
      { name: "update_issue", description: "Update issue status", callCount: 87 },
      { name: "create_cycle", description: "Create a sprint cycle", callCount: 4 },
    ],
  },
  {
    id: "mcp-brave",
    name: "Brave Search MCP",
    owner: "Brave",
    version: "2.1.0",
    transport: "http",
    status: "healthy",
    toolCount: 2,
    lastPing: "8s ago",
    tools: [
      { name: "web_search", description: "Search the web for context", callCount: 892 },
      { name: "local_search", description: "Local results search", callCount: 23 },
    ],
  },
];

// ─── Evidence data ────────────────────────────────────────────────────────────

type ProofType = "import" | "tool_call" | "transform" | "sync" | "schema_apply";

interface ProofRecord {
  id: string;
  type: ProofType;
  source: string;
  connector: string;
  timestamp: string;
  records?: number;
  schemaVersion?: string;
  status: "success" | "partial" | "failed";
  duration?: string;
  tool?: string;
  payload?: string;
  lineage: string[];
}

const PROOF_RECORDS: ProofRecord[] = [
  {
    id: "pr-0891",
    type: "import",
    source: "HubSpot",
    connector: "Nango · hubspot",
    timestamp: "Today 10:42 AM",
    records: 47,
    schemaVersion: "CRM-v1.1.0",
    status: "success",
    duration: "1.2s",
    lineage: ["HubSpot API", "Nango OAuth", "Loader S2", "Normalizer S3", "Entity Resolution S4", "Spine Write S5"],
  },
  {
    id: "pr-0890",
    type: "tool_call",
    source: "GitHub MCP",
    connector: "MCP · stdio",
    timestamp: "Today 10:40 AM",
    tool: "list_repositories",
    payload: '{ "org": "acme-corp", "per_page": 50 }',
    schemaVersion: "document-v1.0.0",
    status: "success",
    duration: "420ms",
    records: 34,
    lineage: ["GitHub MCP Server", "MCP stdio transport", "Normalizer S3", "Spine Write S5"],
  },
  {
    id: "pr-0889",
    type: "transform",
    source: "Salesforce",
    connector: "Nango · salesforce",
    timestamp: "Today 10:35 AM",
    schemaVersion: "CRM-v1.2.0",
    status: "success",
    duration: "0.3s",
    records: 12,
    lineage: ["Salesforce SOQL", "Field Normalizer", "Canonical Mapping CRM-v1.2.0", "Spine entity.deal"],
  },
  {
    id: "pr-0888",
    type: "schema_apply",
    source: "Jira",
    connector: "Nango · jira",
    timestamp: "Today 10:15 AM",
    schemaVersion: "activity-v1.1.0 (new)",
    status: "success",
    duration: "0.1s",
    lineage: ["Schema AI proposal SP-006", "Human approval (Alex Rivera)", "Schema activation", "Jira connector updated"],
  },
  {
    id: "pr-0887",
    type: "sync",
    source: "Stripe",
    connector: "Nango · stripe",
    timestamp: "Today 10:00 AM",
    records: 28,
    schemaVersion: "deal-v1.0.0",
    status: "success",
    duration: "0.8s",
    lineage: ["Stripe Events API", "Nango webhook", "Payment normalizer", "Spine entity.deal.payment_status"],
  },
  {
    id: "pr-0886",
    type: "import",
    source: "Gmail",
    connector: "Nango · gmail",
    timestamp: "Today 09:30 AM",
    records: 0,
    schemaVersion: "activity-v1.0.0",
    status: "failed",
    duration: "2.1s",
    lineage: ["Gmail OAuth", "Nango token refresh (failed)", "Import aborted"],
  },
  {
    id: "pr-0885",
    type: "tool_call",
    source: "Notion MCP",
    connector: "MCP · http",
    timestamp: "Today 09:15 AM",
    tool: "query_database",
    payload: '{ "database_id": "abc123", "filter": { "status": "Done" } }',
    schemaVersion: "document-v1.0.0",
    status: "success",
    duration: "680ms",
    records: 15,
    lineage: ["Notion MCP Server", "HTTP transport", "Document normalizer", "Spine entity.document"],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const PROOF_TYPE_CONFIG: Record<ProofType, { label: string; color: string; bg: string; icon: any }> = {
  import:       { label: "Import",       color: "var(--iw-blue)",    bg: "rgba(66,86,171,0.1)",  icon: ArrowRight },
  tool_call:    { label: "Tool Call",    color: "var(--iw-purple)",  bg: "rgba(123,94,167,0.1)", icon: Cpu },
  transform:    { label: "Transform",   color: "var(--iw-warning)", bg: "rgba(212,136,62,0.1)", icon: GitBranch },
  sync:         { label: "Sync",        color: "var(--iw-success)", bg: "rgba(61,139,110,0.1)", icon: RefreshCw },
  schema_apply: { label: "Schema",      color: "var(--iw-pink)",    bg: "rgba(212,103,128,0.1)",icon: FileCheck },
};

const STATUS_CONFIG = {
  success: { color: "var(--iw-success)", label: "Success" },
  partial: { color: "var(--iw-warning)", label: "Partial" },
  failed:  { color: "var(--iw-danger)",  label: "Failed" },
};

const MCP_STATUS = {
  healthy:  { color: "var(--iw-success)", label: "Healthy" },
  degraded: { color: "var(--iw-warning)", label: "Degraded" },
  offline:  { color: "var(--iw-danger)",  label: "Offline" },
};

// ─── MCP Registry View ────────────────────────────────────────────────────────

function MCPRegistryView() {
  const [selected, setSelected] = useState<MCPServer | null>(MCP_SERVERS[0]);

  return (
    <div className="flex h-full" style={{ background: "var(--background)" }}>
      {/* Server list */}
      <div className="w-64 shrink-0 flex flex-col border-r" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>MCP Servers</p>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {MCP_SERVERS.filter(s => s.status === "healthy").length}/{MCP_SERVERS.length} healthy
          </p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
          {MCP_SERVERS.map(server => {
            const sc = MCP_STATUS[server.status];
            return (
              <button key={server.id} onClick={() => setSelected(server)}
                className="w-full text-left px-4 py-3 transition-all"
                style={{ background: selected?.id === server.id ? "var(--secondary)" : "transparent" }}
                onMouseEnter={e => { if (selected?.id !== server.id) (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
                onMouseLeave={e => { if (selected?.id !== server.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: sc.color, ...(server.status === "healthy" ? { animation: "pulse 2s infinite" } : {}) }} />
                  <span className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{server.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                  <span>{server.toolCount} tools</span>
                  <span>·</span>
                  <span className="font-mono">{server.transport}</span>
                  <span>·</span>
                  <span>v{server.version}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Server detail */}
      {selected && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{selected.name}</h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: `${MCP_STATUS[selected.status].color}15`, color: MCP_STATUS[selected.status].color }}>
                  {MCP_STATUS[selected.status].label}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                {selected.owner} · v{selected.version} · {selected.transport} transport · last ping {selected.lastPing}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Tools", value: selected.toolCount },
              { label: "Transport", value: selected.transport.toUpperCase() },
              { label: "Last ping", value: selected.lastPing },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl text-center"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{s.value}</div>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tools */}
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
              Registered Tools
            </p>
            <div className="space-y-1.5">
              {selected.tools.map(tool => (
                <div key={tool.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <Cpu className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--iw-purple)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono" style={{ fontWeight: 600, color: "var(--foreground)" }}>{tool.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{tool.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{tool.callCount.toLocaleString()}</div>
                    <div className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>calls</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctrine note */}
          <div className="px-3 py-2.5 rounded-xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              One MCP server connection gives <strong style={{ color: "var(--foreground)" }}>indirect access to all its tools</strong>.
              Twin invokes tools through this server — no additional connectors needed for downstream systems it exposes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Evidence & Audit View ────────────────────────────────────────────────────

function EvidenceView() {
  const [filter, setFilter] = useState<ProofType | "all">("all");
  const [selected, setSelected] = useState<ProofRecord | null>(null);
  const [search, setSearch] = useState("");

  const filtered = PROOF_RECORDS.filter(r => {
    const matchFilter = filter === "all" || r.type === filter;
    const matchSearch = !search || r.source.toLowerCase().includes(search.toLowerCase()) || r.connector.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (selected) {
    const tc = PROOF_TYPE_CONFIG[selected.type];
    const sc = STATUS_CONFIG[selected.status];
    return (
      <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
        <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <button onClick={() => setSelected(null)} className="text-xs font-semibold mb-1" style={{ color: "var(--iw-blue)" }}>
            ← Evidence
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ fontWeight: 700, color: "var(--foreground)" }}>#{selected.id}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
            <span className="text-[9px] font-bold" style={{ color: sc.color }}>{sc.label}</span>
          </div>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {selected.source} · {selected.connector} · {selected.timestamp}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Proof record */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { k: "Source", v: selected.source },
              { k: "Connector", v: selected.connector },
              { k: "Schema", v: selected.schemaVersion || "—" },
              { k: "Records", v: selected.records !== undefined ? String(selected.records) : "—" },
              { k: "Duration", v: selected.duration || "—" },
              { k: "Status", v: selected.status },
            ].map((row, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{row.k}</p>
                <p className="text-xs mt-0.5" style={{ fontWeight: 600, color: "var(--foreground)" }}>{row.v}</p>
              </div>
            ))}
          </div>

          {selected.tool && (
            <div>
              <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Tool Invocation</p>
              <div className="p-3 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] font-mono mb-1" style={{ color: "var(--iw-purple)", fontWeight: 700 }}>{selected.tool}()</p>
                <pre className="text-[10px] font-mono whitespace-pre-wrap"
                  style={{ color: "var(--muted-foreground)" }}>{selected.payload}</pre>
              </div>
            </div>
          )}

          {/* Lineage chain */}
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
              Lineage — full ingress path
            </p>
            <div className="space-y-1.5 relative">
              <div className="absolute left-[10px] top-3 bottom-3 w-px" style={{ background: "var(--border)" }} />
              {selected.lineage.map((step, i) => (
                <div key={i} className="flex items-center gap-3 relative">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: i === selected.lineage.length - 1 ? "var(--iw-success)" : "var(--card)", border: `1px solid ${i === selected.lineage.length - 1 ? "var(--iw-success)" : "var(--border)"}` }}>
                    {i === selected.lineage.length - 1
                      ? <CheckCircle2 className="w-3 h-3 text-white" />
                      : <span className="text-[7px]" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{i + 1}</span>}
                  </div>
                  <span className="text-xs" style={{ color: i === selected.lineage.length - 1 ? "var(--iw-success)" : "var(--foreground)", fontWeight: i === selected.lineage.length - 1 ? 700 : 400 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>Evidence & Audit</p>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              Proof records for everything entering SPINE. Lineage, transformation, invocation history.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px]"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>
            <Eye className="w-3 h-3" />
            AI logs in Twin Governance
          </div>
        </div>

        {/* Doctrine */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-3"
          style={{ background: "var(--iw-blue-900)" }}>
          {[
            { label: "Ingress", sub: "Proof" },
            { label: "SPINE", sub: "Memory" },
            { label: "Twin", sub: "Intelligence" },
          ].map((d, i) => (
            <div key={d.label} className="flex items-center gap-2">
              <div className="text-center">
                <p className="text-[10px] text-white" style={{ fontWeight: 700 }}>{d.label}</p>
                <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>owns {d.sub}</p>
              </div>
              {i < 2 && <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>→</span>}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search evidence…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
          <div className="flex gap-1">
            {(["all", "import", "tool_call", "transform", "sync", "schema_apply"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="text-[9px] px-2 py-1 rounded-lg capitalize transition-all whitespace-nowrap"
                style={{
                  fontWeight: 600,
                  background: filter === f ? "var(--iw-blue)" : "var(--secondary)",
                  color: filter === f ? "white" : "var(--muted-foreground)",
                }}>
                {f === "all" ? "All" : f === "tool_call" ? "Tool Calls" : f === "schema_apply" ? "Schema" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
        {filtered.map(record => {
          const tc = PROOF_TYPE_CONFIG[record.type];
          const sc = STATUS_CONFIG[record.status];
          const TypeIcon = tc.icon;
          return (
            <button key={record.id} onClick={() => setSelected(record)}
              className="w-full text-left px-5 py-3 transition-all group"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: tc.bg }}>
                  <TypeIcon className="w-3.5 h-3.5" style={{ color: tc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono" style={{ fontWeight: 600, color: "var(--foreground)" }}>#{record.id}</span>
                    <span className="text-[9px] px-1 py-0.5 rounded font-bold"
                      style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                    <span className="text-[9px] font-bold" style={{ color: sc.color }}>· {sc.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{record.source}</span>
                    <span>·</span>
                    <span>{record.connector}</span>
                    {record.records !== undefined && <><span>·</span><span>{record.records} records</span></>}
                    {record.schemaVersion && <><span>·</span><span className="font-mono text-[9px]">{record.schemaVersion}</span></>}
                  </div>
                  {record.tool && (
                    <span className="text-[9px] font-mono mt-0.5 block" style={{ color: "var(--iw-purple)" }}>
                      {record.tool}()
                    </span>
                  )}
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{record.timestamp} · {record.duration}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 shrink-0 mt-1 transition-opacity"
                  style={{ color: "var(--muted-foreground)" }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const TABS: { id: IngressTab; label: string; icon: any; description: string }[] = [
  { id: "Connections", label: "Connections",      icon: Link2,     description: "Nango · API · Domain · Accelerators" },
  { id: "MCP",         label: "MCP Registry",     icon: Server,    description: "Servers · Tools · Health · Versions" },
  { id: "Schema",      label: "Schema Registry",  icon: Database,  description: "Domain projections · Entity mappings" },
  { id: "Evidence",    label: "Evidence & Audit",  icon: FileCheck, description: "Proof · Lineage · Invocation logs" },
];

export function IngressPlane() {
  const [tab, setTab] = useState<IngressTab>("Connections");

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-6 pt-4 pb-0 shrink-0" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(66,86,171,0.12)", border: "1px solid rgba(66,86,171,0.2)" }}>
            <ArrowRight className="w-4 h-4" style={{ color: "var(--iw-blue)" }} />
          </div>
          <div>
            <h1 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Ingress</h1>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              Everything entering SPINE — connections, schemas, tool invocations, proof records
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs border-b-2 transition-all"
              style={{
                fontWeight: tab === t.id ? 700 : 500,
                borderColor: tab === t.id ? "var(--iw-blue)" : "transparent",
                color: tab === t.id ? "var(--iw-blue)" : "var(--muted-foreground)",
              }}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "Connections" && <div className="h-full overflow-y-auto"><IntegrationsHub /></div>}
        {tab === "MCP"         && <MCPRegistryView />}
        {tab === "Schema"      && <div className="h-full overflow-y-auto"><SchemaRegistry /></div>}
        {tab === "Evidence"    && <EvidenceView />}
      </div>
    </div>
  );
}
