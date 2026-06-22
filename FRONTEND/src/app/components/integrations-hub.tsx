/**
 * Integrations Hub — Connectivity Acquisition Layer into Spine
 *
 * Stack:
 * L1  Clerk           — Auth, MFA, SSO, RBAC
 * L2  Connectivity    — Nango (Direct) · MCP · AI Tools · API Wrappers
 * L3  Normalization   — Loader → Normalizer → Entity Mapping
 * L4  Spine           — Truth · Memory · Relationships
 * L5  Projection      — Twin · Workbench · Governance
 * L6  Accelerators    — CS · RevOps · BI (sit ABOVE connectivity, not in it)
 *
 * Domain Connectors = semantic projections (CRM Domain = Salesforce+HubSpot+Zoho
 * all normalized to the same schema). NOT physical connectors.
 *
 * MCP = one connection exposes many downstream systems indirectly.
 * You don't need a connector for everything — one MCP server can reach
 * HubSpot, Jira, Slack, GitHub through one protocol endpoint.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plug, Check, RefreshCw, Search, Plus, X, ChevronRight,
  Database, Layers, Activity, Shield, Link2, CheckCircle2,
  Loader2, Zap, Bot, Globe, Package, GitBranch, Cpu,
  ArrowRight, Lock, ExternalLink
} from "lucide-react";
import { ConnectorDiscovery } from "./spine/connector-discovery";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectorCategory = "direct" | "mcp" | "ai" | "api" | "domain" | "accelerator";
type ConnectorStatus = "connected" | "available" | "syncing" | "error";

interface Connector {
  id: string;
  name: string;
  logo: string;
  category: ConnectorCategory;
  status: ConnectorStatus;
  description: string;
  entities?: string[];        // what it contributes to Spine
  indirectAccess?: string[];  // systems accessible without extra connectors
  lastSync?: string;
  entitiesSynced?: number;
  authMethod?: "nango" | "mcp" | "apikey" | "oauth" | "none";
  badge?: string;
  transport?: "stdio" | "http" | "sse";
}

// ─── Connector data ────────────────────────────────────────────────────────────

const CONNECTORS: Connector[] = [
  // Direct — Nango OAuth
  { id: "sf",  name: "Salesforce",  logo: "☁️",  category: "direct", status: "connected", description: "CRM: Accounts, Contacts, Opportunities, Activities", entities: ["account","contact","deal","activity"], indirectAccess: ["Pardot","Salesforce Marketing"], lastSync: "2 min ago", entitiesSynced: 12847, authMethod: "nango" },
  { id: "hs",  name: "HubSpot",     logo: "🧡",  category: "direct", status: "connected", description: "CRM: Contacts, Deals, Companies, Marketing Events", entities: ["contact","deal","company","activity"], indirectAccess: ["HubSpot Emails","Marketing Hub"], lastSync: "5 min ago", entitiesSynced: 8432, authMethod: "nango" },
  { id: "sl",  name: "Slack",       logo: "💬",  category: "direct", status: "connected", description: "Messages, Channels, User Activity — signals in real time", entities: ["activity","person"], lastSync: "Real-time", entitiesSynced: 3241, authMethod: "nango" },
  { id: "zd",  name: "Zendesk",     logo: "🎧",  category: "direct", status: "connected", description: "Support tickets, SLA, CSAT — health scoring input", entities: ["activity","person"], lastSync: "8 min ago", entitiesSynced: 5672, authMethod: "nango" },
  { id: "st",  name: "Stripe",      logo: "💳",  category: "direct", status: "connected", description: "Subscriptions, Invoices, Payments — revenue signals", entities: ["deal","company"], lastSync: "1 min ago", entitiesSynced: 2891, authMethod: "nango" },
  { id: "jr",  name: "Jira",        logo: "🔵",  category: "direct", status: "syncing",   description: "Issues, Sprints, Epics — engineering signals", entities: ["activity","document"], lastSync: "Syncing…", entitiesSynced: 4123, authMethod: "nango" },
  { id: "gm",  name: "Gmail",       logo: "📧",  category: "direct", status: "error",     description: "Email threads, Contacts, Calendar invites", entities: ["activity","person"], lastSync: "2h ago (failed)", authMethod: "nango" },
  { id: "li",  name: "Linear",      logo: "🟣",  category: "direct", status: "available", description: "Issues, Roadmap, Cycles — product signals", entities: ["activity","document"], authMethod: "nango" },
  { id: "nt",  name: "Notion",      logo: "📝",  category: "direct", status: "available", description: "Pages, Databases, Team Wikis", entities: ["document"], authMethod: "nango" },

  // MCP Servers
  { id: "gh-mcp",  name: "GitHub MCP",      logo: "🐙",  category: "mcp", status: "available", description: "PRs, Issues, Repos, Commits — via MCP stdio", entities: ["activity","document"], transport: "stdio", authMethod: "mcp" },
  { id: "nt-mcp",  name: "Notion MCP",      logo: "📝",  category: "mcp", status: "available", description: "Pages, Databases — via MCP http", entities: ["document"], transport: "http", authMethod: "mcp" },
  { id: "li-mcp",  name: "Linear MCP",      logo: "🟣",  category: "mcp", status: "available", description: "Issues, Projects — via MCP stdio", entities: ["activity"], transport: "stdio", authMethod: "mcp" },
  { id: "br-mcp",  name: "Brave Search MCP",logo: "🦁",  category: "mcp", status: "available", description: "Web search for context enrichment — via MCP http", transport: "http", authMethod: "mcp" },
  { id: "fs-mcp",  name: "Filesystem MCP",  logo: "📁",  category: "mcp", status: "available", description: "Local file access for document ingestion", transport: "stdio", authMethod: "mcp" },

  // AI Tools (reasoning engines, not connectors in the traditional sense)
  { id: "iw-pro",   name: "IW Pro",           logo: "✦",   category: "ai", status: "connected", description: "IntegrateWise native model — Spine-grounded, context-aware", badge: "Recommended", authMethod: "none" },
  { id: "claude",   name: "Claude 3.7",        logo: "🧠",  category: "ai", status: "connected", description: "Anthropic — strong reasoning, long context", authMethod: "apikey" },
  { id: "gpt4o",    name: "GPT-4o",            logo: "🤖",  category: "ai", status: "available", description: "OpenAI — versatile, multimodal", authMethod: "apikey" },
  { id: "gemini",   name: "Gemini 2.0 Flash",  logo: "✨",  category: "ai", status: "available", description: "Google — fast, multimodal", authMethod: "apikey" },
  { id: "mistral",  name: "Mistral Large",     logo: "🌪️", category: "ai", status: "available", description: "Mistral — efficient, European-hosted", authMethod: "apikey" },

  // API / Custom
  { id: "rest",    name: "REST API",    logo: "🔌", category: "api", status: "available", description: "Generic REST connector — define endpoints, headers, pagination" },
  { id: "graphql", name: "GraphQL",     logo: "◈",  category: "api", status: "available", description: "GraphQL endpoint — schema introspection, typed queries" },
  { id: "webhook", name: "Webhooks",    logo: "⚡", category: "api", status: "available", description: "Inbound webhook receiver — route payloads into Spine" },
  { id: "pg",      name: "PostgreSQL",  logo: "🐘", category: "api", status: "available", description: "Direct DB connection — tables mapped to Spine entities" },

  // Domain Connectors — semantic projections, NOT physical connectors
  // "CRM Domain" normalises Salesforce + HubSpot + Zoho into one canonical schema.
  // Connect any one tool in the domain — Spine sees them all as the same entity type.
  { id: "dom-crm",   name: "CRM Domain",           logo: "🏢", category: "domain", status: "available", description: "Semantic projection: Salesforce, HubSpot, Zoho CRM, Dynamics — all normalized to canonical Account/Contact/Deal schema. Connect any one tool.", indirectAccess: ["Salesforce","HubSpot","Zoho CRM","Dynamics 365"], badge: "Projection" },
  { id: "dom-supp",  name: "Support Domain",        logo: "🎧", category: "domain", status: "available", description: "Semantic projection: Zendesk, Freshdesk, Intercom, ServiceNow — all normalized to Ticket/Agent/SLA schema.", indirectAccess: ["Zendesk","Freshdesk","Intercom","ServiceNow"], badge: "Projection" },
  { id: "dom-comm",  name: "Communication Domain",  logo: "💬", category: "domain", status: "available", description: "Semantic projection: Slack, Teams, Gmail, Outlook — all normalized to Message/Channel/Person schema.", indirectAccess: ["Slack","Microsoft Teams","Gmail","Outlook"], badge: "Projection" },
  { id: "dom-proj",  name: "Project Domain",        logo: "📋", category: "domain", status: "available", description: "Semantic projection: Jira, Linear, Asana, Notion — all normalized to Task/Project/Sprint schema.", indirectAccess: ["Jira","Linear","Asana","Notion"], badge: "Projection" },
  { id: "dom-fin",   name: "Finance Domain",        logo: "💰", category: "domain", status: "available", description: "Semantic projection: Stripe, QuickBooks, Xero, Plaid — all normalized to Invoice/Payment/Revenue schema.", indirectAccess: ["Stripe","QuickBooks","Xero","Plaid"], badge: "Projection" },

  // Accelerators — L6, sit ABOVE the connectivity layer (not inside it)
  // Pre-built business solutions: connectors + workflows + Spine memory + Twin prompts
  // packaged as one deployable unit. Not a connector — a business capability.
  { id: "acc-cs",    name: "Customer Success",     logo: "🚀", category: "accelerator", status: "available", description: "L6 solution: renewal risk scoring, champion silence detection, EBR scheduling, health scoring — pre-wired. Activates: Salesforce + Zendesk + Slack + Stripe + Renewal Watchdog agent.", indirectAccess: ["Salesforce","Zendesk","Slack","Stripe"], badge: "Popular" },
  { id: "acc-revops",name: "RevOps Intelligence",  logo: "🎯", category: "accelerator", status: "available", description: "L6 solution: CRM reconciliation, pipeline coverage, forecast accuracy, NRR tracking — pre-wired. Activates: HubSpot + Salesforce + CRM Reconciler agent.", indirectAccess: ["HubSpot","Salesforce","LinkedIn"], badge: "Popular" },
  { id: "acc-devops",name: "Engineering Ops",      logo: "⚙️", category: "accelerator", status: "available", description: "L6 solution: incident signals, sprint health, deployment tracking — pre-wired. Activates: GitHub + Jira + PagerDuty + Schema Drift Detector.", indirectAccess: ["GitHub","Jira","PagerDuty"] },
  { id: "acc-support",name: "Support Intelligence",logo: "🎧", category: "accelerator", status: "available", description: "L6 solution: SLA monitoring, P1 escalation, CSAT tracking, KB gap detection — pre-wired. Activates: Zendesk + Slack + Jira.", indirectAccess: ["Zendesk","Slack","Jira"] },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ConnectorCategory, { label: string; icon: any; color: string; bg: string; description: string; layer: string }> = {
  direct:      { label: "Direct",       icon: Plug,      color: "var(--iw-blue)",    bg: "rgba(66,86,171,0.08)",   description: "OAuth via Nango. 500+ SaaS apps, native credential wall.", layer: "L2 Connectivity" },
  mcp:         { label: "MCP",          icon: GitBranch, color: "var(--iw-purple)",  bg: "rgba(123,94,167,0.08)",  description: "One MCP server exposes many downstream systems indirectly. Claude MCP → HubSpot, Jira, Slack, GitHub through one endpoint.", layer: "L2 Connectivity" },
  ai:          { label: "AI Tools",     icon: Bot,       color: "var(--iw-pink)",    bg: "rgba(212,103,128,0.08)", description: "Reasoning engines routed by Twin. OpenAI, Claude, Gemini, custom agent tools.", layer: "L2 Connectivity" },
  api:         { label: "API",          icon: Globe,     color: "var(--iw-warning)", bg: "rgba(212,136,62,0.08)",  description: "Universal connectivity. REST, GraphQL, SOAP, Webhooks. Any system with an API.", layer: "L2 Connectivity" },
  domain:      { label: "Domains",      icon: Layers,    color: "var(--iw-success)", bg: "rgba(61,139,110,0.08)",  description: "Semantic projections — not physical connectors. CRM Domain normalises Salesforce + HubSpot + Zoho into one schema. Connect any one tool in the domain.", layer: "Semantic Projection" },
  accelerator: { label: "Accelerators", icon: Zap,       color: "var(--iw-warning)", bg: "rgba(212,136,62,0.08)",  description: "Pre-built business solutions. Sit above the connectivity layer (L6), not in it. Package multiple connectors + workflows + memory into one deployable unit.", layer: "L6 — Above Connectivity" },
};

const STATUS_CONFIG: Record<ConnectorStatus, { label: string; color: string; dot: string }> = {
  connected: { label: "Connected", color: "var(--iw-success)", dot: "var(--iw-success)" },
  syncing:   { label: "Syncing",   color: "var(--iw-warning)", dot: "var(--iw-warning)" },
  error:     { label: "Error",     color: "var(--iw-danger)",  dot: "var(--iw-danger)" },
  available: { label: "Available", color: "var(--muted-foreground)", dot: "var(--border)" },
};

const AUTH_LABEL: Record<string, string> = {
  nango:  "Nango OAuth",
  mcp:    "MCP protocol",
  apikey: "API key",
  oauth:  "OAuth",
  none:   "Built-in",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function IntegrationsHub() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ConnectorCategory | "all">("all");
  const [selected, setSelected] = useState<Connector | null>(null);
  const [discoverySession, setDiscoverySession] = useState<{ name: string; emoji: string } | null>(null);
  const [bridgeConnected, setBridgeConnected] = useState(() =>
    localStorage.getItem("integratewise_bridge") === "connected"
  );
  const [bridgeConnecting, setBridgeConnecting] = useState(false);

  const handleBridgeConnect = async () => {
    setBridgeConnecting(true);
    await new Promise(r => setTimeout(r, 2000));
    setBridgeConnected(true);
    setBridgeConnecting(false);
    localStorage.setItem("integratewise_bridge", "connected");
  };

  const handleConnect = (c: Connector) => {
    setSelected(null);
    setDiscoverySession({ name: c.id, emoji: c.logo });
  };

  const filtered = CONNECTORS.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || c.category === activeCategory;
    return matchSearch && matchCat;
  });

  const connectedCount = CONNECTORS.filter(c => c.status === "connected").length;
  const totalEntities = CONNECTORS.reduce((s, c) => s + (c.entitiesSynced || 0), 0);

  const categories: (ConnectorCategory | "all")[] = ["all", "direct", "mcp", "ai", "api", "domain", "accelerator"];

  return (
    <>
      {discoverySession && (
        <AnimatePresence>
          <ConnectorDiscovery
            connectorName={discoverySession.name}
            connectorEmoji={discoverySession.emoji}
            onComplete={() => setDiscoverySession(null)}
            onDismiss={() => setDiscoverySession(null)}
          />
        </AnimatePresence>
      )}

      <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 shrink-0" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Integrations</h1>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                Connectivity acquisition layer into Spine · {connectedCount} active · {(totalEntities / 1000).toFixed(1)}K entities normalized
              </p>
            </div>
          </div>

          {/* Platform stack — L1 to L6 */}
          <div className="flex items-stretch gap-0 mb-4 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {[
              { layer: "L1", label: "Clerk", sub: "Auth · MFA · SSO", color: "var(--iw-blue-900)", text: "white" },
              { layer: "L2", label: "Connectivity", sub: "Nango · MCP · AI · API", color: "var(--iw-blue)", text: "white" },
              { layer: "L3", label: "Normalizer", sub: "Loader · Mapping", color: "var(--iw-purple)", text: "white" },
              { layer: "L4", label: "Spine", sub: "Truth · Memory", color: "var(--iw-success)", text: "white" },
              { layer: "L5", label: "Projection", sub: "Twin · Workbench", color: "var(--iw-warning)", text: "white" },
              { layer: "L6", label: "Accelerators", sub: "CS · RevOps · BI", color: "var(--iw-pink)", text: "white" },
            ].map((s, i) => (
              <div key={s.layer} className="flex-1 flex flex-col items-center justify-center py-2.5 px-1 relative"
                style={{ background: s.color, borderRight: i < 5 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                <span className="text-[8px] opacity-60" style={{ color: s.text, fontWeight: 700 }}>{s.layer}</span>
                <span className="text-[10px]" style={{ color: s.text, fontWeight: 700 }}>{s.label}</span>
                <span className="text-[8px] opacity-60 text-center" style={{ color: s.text }}>{s.sub}</span>
              </div>
            ))}
          </div>

          {/* MCP indirect access callout */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl mb-4"
            style={{ background: "rgba(123,94,167,0.07)", border: "1px solid rgba(123,94,167,0.2)" }}>
            <GitBranch className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--iw-purple)" }} />
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--foreground)" }}>
              <strong style={{ color: "var(--iw-purple)" }}>One MCP server → many systems.</strong>{" "}
              Connecting a Claude MCP server gives indirect access to HubSpot, Jira, Slack, and GitHub through one endpoint.
              You don't need separate connectors for each — IntegrateWise routes through MCP to reach downstream systems.
            </p>
          </div>

          {/* Continuity Bridge — always first */}
          <div className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4"
            style={{ background: "var(--iw-blue-900)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(61,139,110,0.2)", border: "1px solid rgba(61,139,110,0.3)" }}>
              <Link2 className="w-5 h-5" style={{ color: "var(--iw-success)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm text-white" style={{ fontWeight: 700 }}>Continuity Bridge</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(61,139,110,0.25)", color: "var(--iw-success)" }}>Core</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>by IntegrateWise</span>
              </div>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                Spine · Memory · Twin · Governance · Handoff. Your canonical truth layer. Connect once — all tools and AIs share one memory.
              </p>
              {bridgeConnected && (
                <div className="flex items-center gap-2 mt-1.5 text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--iw-success)" }} />
                  <span style={{ color: "var(--iw-success)", fontWeight: 600 }}>Connected</span>
                  <span>· Spine healthy · {(totalEntities / 1000).toFixed(1)}K entities</span>
                </div>
              )}
            </div>
            <div className="shrink-0">
              {bridgeConnected ? (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(61,139,110,0.2)", border: "1px solid rgba(61,139,110,0.3)", color: "var(--iw-success)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </div>
              ) : (
                <button onClick={handleBridgeConnect} disabled={bridgeConnecting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white transition-all disabled:opacity-60"
                  style={{ background: "var(--iw-success)", fontWeight: 700 }}>
                  {bridgeConnecting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…</>
                    : <><Link2 className="w-3.5 h-3.5" /> Connect</>}
                </button>
              )}
            </div>
          </div>

          {/* Search + category tabs */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connectors…"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {categories.map(cat => {
                const cfg = cat === "all" ? null : CATEGORY_CONFIG[cat];
                const count = cat === "all" ? CONNECTORS.length : CONNECTORS.filter(c => c.category === cat).length;
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] whitespace-nowrap transition-all shrink-0"
                    style={{
                      fontWeight: 600,
                      background: activeCategory === cat ? (cfg?.color || "var(--iw-blue)") : "var(--secondary)",
                      color: activeCategory === cat ? "white" : "var(--muted-foreground)",
                    }}>
                    {cfg && <cfg.icon className="w-3 h-3" />}
                    {cat === "all" ? "All" : cfg?.label}
                    <span className="text-[8px] opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Connector grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Category description when filtered */}
          {activeCategory !== "all" && (() => {
            const CatIcon = CATEGORY_CONFIG[activeCategory].icon;
            return (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4"
              style={{ background: CATEGORY_CONFIG[activeCategory].bg, border: `1px solid ${CATEGORY_CONFIG[activeCategory].color}30` }}>
              <CatIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: CATEGORY_CONFIG[activeCategory].color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <strong className="text-xs" style={{ color: CATEGORY_CONFIG[activeCategory].color }}>
                    {CATEGORY_CONFIG[activeCategory].label}
                  </strong>
                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: `${CATEGORY_CONFIG[activeCategory].color}20`, color: CATEGORY_CONFIG[activeCategory].color }}>
                    {CATEGORY_CONFIG[activeCategory].layer}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {CATEGORY_CONFIG[activeCategory].description}
                </p>
              </div>
            </div>
            );
          })()}

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(c => {
              const sc = STATUS_CONFIG[c.status];
              const cc = CATEGORY_CONFIG[c.category];
              return (
                <motion.div key={c.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div
                    onClick={() => setSelected(c)}
                    className="rounded-xl border cursor-pointer transition-all hover:shadow-md group"
                    style={{
                      borderColor: c.status === "error" ? "rgba(220,74,74,0.3)" : "var(--border)",
                      background: "var(--card)",
                    }}>
                    <div className="p-4">
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ background: cc.bg, border: `1px solid ${cc.color}25` }}>
                            {c.logo}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{c.name}</span>
                              {c.badge && (
                                <span className="text-[8px] px-1 py-0.5 rounded font-bold"
                                  style={{ background: `${cc.color}15`, color: cc.color }}>
                                  {c.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <cc.icon className="w-2.5 h-2.5" style={{ color: cc.color }} />
                              <span className="text-[9px]" style={{ color: cc.color, fontWeight: 600 }}>{cc.label}</span>
                              {c.authMethod && c.authMethod !== "none" && (
                                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                                  · {AUTH_LABEL[c.authMethod]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {c.status !== "available" && (
                            <div className="w-1.5 h-1.5 rounded-full"
                              style={{ background: sc.dot, animation: c.status === "syncing" ? "pulse 2s infinite" : "none" }} />
                          )}
                          <span className="text-[9px]" style={{ color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[10px] leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                        {c.description}
                      </p>

                      {/* Indirect access hint */}
                      {c.indirectAccess && c.category === "accelerator" && (
                        <div className="flex items-center gap-1.5 mb-3 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                          <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                          <span>Sets up: {c.indirectAccess.slice(0, 3).join(" · ")}</span>
                        </div>
                      )}

                      {/* Entities or sync info */}
                      {c.status === "connected" && (
                        <div className="flex items-center justify-between text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                          <span>{c.lastSync}</span>
                          <span style={{ fontWeight: 700, color: "var(--foreground)" }}>
                            {c.entitiesSynced?.toLocaleString()} entities
                          </span>
                        </div>
                      )}
                      {c.status === "error" && (
                        <p className="text-[9px]" style={{ color: "var(--iw-danger)", fontWeight: 600 }}>
                          ✗ {c.lastSync}
                        </p>
                      )}
                      {c.status === "syncing" && (
                        <div className="flex items-center gap-1.5 text-[9px]" style={{ color: "var(--iw-warning)" }}>
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Syncing…
                        </div>
                      )}
                      {c.status === "available" && (
                        <button
                          onClick={e => { e.stopPropagation(); handleConnect(c); }}
                          className="w-full py-1.5 rounded-lg text-[10px] transition-all mt-1"
                          style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cc.color; (e.currentTarget as HTMLElement).style.color = cc.color; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
                          + Connect
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <Search className="w-8 h-8 mb-3 opacity-20" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No connectors match "{search}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}
              onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: CATEGORY_CONFIG[selected.category].bg }}>
                    {selected.logo}
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{selected.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      {CATEGORY_CONFIG[selected.category].label}
                      {selected.authMethod && selected.authMethod !== "none" && ` · ${AUTH_LABEL[selected.authMethod]}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg"
                  style={{ color: "var(--muted-foreground)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{selected.description}</p>

                {selected.entities && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
                      Contributes to Spine
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.entities.map(e => (
                        <span key={e} className="text-[10px] px-2 py-1 rounded-lg font-mono"
                          style={{ background: "var(--iw-blue-50)", color: "var(--iw-blue)", border: "1px solid rgba(66,86,171,0.2)" }}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.indirectAccess && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
                      {selected.category === "accelerator" ? "Sets up these connectors" : "Indirect access"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.indirectAccess.map(s => (
                        <span key={s} className="text-[10px] px-2 py-1 rounded-lg"
                          style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                    {selected.category !== "accelerator" && (
                      <p className="text-[9px] mt-2" style={{ color: "var(--muted-foreground)" }}>
                        These systems are accessible through the Spine without additional connectors.
                      </p>
                    )}
                  </div>
                )}

                {selected.status === "connected" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl text-center" style={{ background: "var(--secondary)" }}>
                      <div className="text-lg" style={{ fontWeight: 700, color: "var(--foreground)" }}>{selected.entitiesSynced?.toLocaleString()}</div>
                      <div className="text-[9px]" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Entities in Spine</div>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ background: "var(--secondary)" }}>
                      <div className="text-lg" style={{ fontWeight: 700, color: "var(--foreground)" }}>{selected.lastSync}</div>
                      <div className="text-[9px]" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Last sync</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                {selected.status === "available" ? (
                  <button onClick={() => handleConnect(selected)}
                    className="w-full py-2.5 rounded-xl text-sm text-white transition-all"
                    style={{ background: "var(--iw-blue)", fontWeight: 700 }}>
                    Connect {selected.category === "accelerator" ? "Pack" : selected.name}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-xl text-xs transition-all"
                      style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                      <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Re-sync
                    </button>
                    <button className="flex-1 py-2 rounded-xl text-xs transition-all"
                      style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--iw-danger)", fontWeight: 600 }}>
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
