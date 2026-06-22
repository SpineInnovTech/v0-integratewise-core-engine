/**
 * Schema Registry — Live Schema AI Adaptation Surface
 *
 * Shows the growing, adapting nature of UI layers:
 * Connector → Schema AI → Entity Type → Workspace Module
 *
 * As schemas are approved, new modules appear in the workbench.
 * This surface makes that chain visible and governable.
 */

import { useState } from "react";
import {
  Database, CheckCircle2, Clock, AlertTriangle, Zap, ChevronRight,
  GitBranch, Layers, ArrowRight, Sparkles, RefreshCw, Eye,
  ShieldCheck, Package, Users, Building2, DollarSign,
  FileText, Activity, BarChart3, MessageSquare, Check, X
} from "lucide-react";
import { SchemaAiSynthesis } from "./schema-ai-synthesis";

// ─── Types ────────────────────────────────────────────────────────────────────

type LifecycleState = "proposed" | "reviewed" | "approved" | "active" | "deprecated";

interface SchemaEntry {
  id: string;
  connectorName: string;
  entityType: string;
  harmonizationGroup: string;
  schemaVersion: string;
  lifecycleState: LifecycleState;
  confidence: number;          // 0–1
  proposedBy: "schema_ai" | "user";
  proposedAt: string;
  activatedAt?: string;
  fieldCount: number;
  uiModule?: string;           // workspace module this powers
  uiModuleIcon?: any;
  description: string;
}

// ─── Mock schema_pool data ────────────────────────────────────────────────────

const SCHEMA_POOL: SchemaEntry[] = [
  {
    id: "sp-001",
    connectorName: "salesforce",
    entityType: "contact",
    harmonizationGroup: "person",
    schemaVersion: "1.2.0",
    lifecycleState: "active",
    confidence: 0.97,
    proposedBy: "schema_ai",
    proposedAt: "2026-05-12",
    activatedAt: "2026-05-12",
    fieldCount: 34,
    uiModule: "Contacts",
    uiModuleIcon: Users,
    description: "Salesforce Contact entity — maps to canonical person schema via first_name, last_name, email.",
  },
  {
    id: "sp-002",
    connectorName: "hubspot",
    entityType: "contact",
    harmonizationGroup: "person",
    schemaVersion: "1.1.0",
    lifecycleState: "active",
    confidence: 0.96,
    proposedBy: "schema_ai",
    proposedAt: "2026-05-10",
    activatedAt: "2026-05-10",
    fieldCount: 28,
    uiModule: "Contacts",
    uiModuleIcon: Users,
    description: "HubSpot Contact — harmonised with Salesforce Contact. Cross-connector deduplication active.",
  },
  {
    id: "sp-003",
    connectorName: "salesforce",
    entityType: "opportunity",
    harmonizationGroup: "deal",
    schemaVersion: "1.0.0",
    lifecycleState: "active",
    confidence: 0.99,
    proposedBy: "schema_ai",
    proposedAt: "2026-05-12",
    activatedAt: "2026-05-12",
    fieldCount: 21,
    uiModule: "Pipeline",
    uiModuleIcon: DollarSign,
    description: "Salesforce Opportunity → canonical deal schema. Stage mapping, close date, ARR computed.",
  },
  {
    id: "sp-004",
    connectorName: "hubspot",
    entityType: "company",
    harmonizationGroup: "company",
    schemaVersion: "1.0.0",
    lifecycleState: "active",
    confidence: 0.98,
    proposedBy: "schema_ai",
    proposedAt: "2026-05-11",
    activatedAt: "2026-05-11",
    fieldCount: 19,
    uiModule: "Accounts",
    uiModuleIcon: Building2,
    description: "HubSpot Company — harmonised with Salesforce Account. Entity360 computed on activation.",
  },
  {
    id: "sp-005",
    connectorName: "zendesk",
    entityType: "ticket",
    harmonizationGroup: "activity",
    schemaVersion: "2.0.0",
    lifecycleState: "active",
    confidence: 0.94,
    proposedBy: "schema_ai",
    proposedAt: "2026-05-15",
    activatedAt: "2026-05-15",
    fieldCount: 16,
    uiModule: "Meetings",
    uiModuleIcon: MessageSquare,
    description: "Zendesk Ticket — mapped to activity schema. Priority, SLA breach, resolution status surfaced.",
  },
  {
    id: "sp-006",
    connectorName: "jira",
    entityType: "issue",
    harmonizationGroup: "activity",
    schemaVersion: "1.1.0",
    lifecycleState: "reviewed",
    confidence: 0.88,
    proposedBy: "schema_ai",
    proposedAt: "2026-06-21",
    fieldCount: 22,
    uiModule: "Tasks",
    uiModuleIcon: Activity,
    description: "Jira Issue v1.1.0 — 2 new fields detected upstream (issue_priority_v2, reporter_team). Pending approval.",
  },
  {
    id: "sp-007",
    connectorName: "stripe",
    entityType: "invoice",
    harmonizationGroup: "deal",
    schemaVersion: "1.0.0",
    lifecycleState: "proposed",
    confidence: 0.91,
    proposedBy: "schema_ai",
    proposedAt: "2026-06-22",
    fieldCount: 14,
    uiModule: "Analytics",
    uiModuleIcon: BarChart3,
    description: "Stripe Invoice — maps to revenue entity. MRR, ARR, payment_status, failed_charges fields extracted.",
  },
  {
    id: "sp-008",
    connectorName: "notion",
    entityType: "page",
    harmonizationGroup: "document",
    schemaVersion: "1.0.0",
    lifecycleState: "proposed",
    confidence: 0.76,
    proposedBy: "schema_ai",
    proposedAt: "2026-06-22",
    fieldCount: 9,
    description: "Notion Page — maps to document schema. Low confidence due to unstructured content field. Manual review recommended.",
  },
  {
    id: "sp-009",
    connectorName: "github",
    entityType: "pull_request",
    harmonizationGroup: "activity",
    schemaVersion: "1.0.0",
    lifecycleState: "proposed",
    confidence: 0.93,
    proposedBy: "schema_ai",
    proposedAt: "2026-06-22",
    fieldCount: 17,
    uiModule: "Projects",
    uiModuleIcon: Package,
    description: "GitHub Pull Request — new connector. Maps to activity schema. Review cycle, author, merge status, linked issues extracted.",
  },
];

// ─── Harmonization groups ─────────────────────────────────────────────────────

const HARMONIZATION_GROUPS: Record<string, { label: string; canonical: string[]; connectors: string[] }> = {
  person:   { label: "Person",   canonical: ["name.first", "name.last", "contact.email", "contact.phone"],  connectors: ["Salesforce", "HubSpot", "Gmail"] },
  deal:     { label: "Deal",     canonical: ["value", "stage", "close_date", "probability"],                 connectors: ["Salesforce", "HubSpot", "Stripe"] },
  company:  { label: "Company",  canonical: ["name", "domain", "industry", "headcount", "arr"],             connectors: ["HubSpot", "Salesforce"] },
  activity: { label: "Activity", canonical: ["type", "created_at", "actor", "subject", "outcome"],         connectors: ["Zendesk", "Jira", "GitHub", "Slack"] },
  document: { label: "Document", canonical: ["title", "content", "author", "created_at", "updated_at"],    connectors: ["Notion", "Google Drive", "Confluence"] },
};

// ─── Config ───────────────────────────────────────────────────────────────────

const LIFECYCLE_CONFIG: Record<LifecycleState, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  proposed:   { label: "Proposed",   color: "var(--iw-blue)",    bg: "rgba(66,86,171,0.1)",  icon: Sparkles,     desc: "Schema AI generated — awaiting pre-review checks" },
  reviewed:   { label: "Reviewed",   color: "var(--iw-warning)", bg: "rgba(212,136,62,0.1)", icon: Eye,          desc: "Pre-review passed — awaiting your approval" },
  approved:   { label: "Approved",   color: "var(--iw-purple)",  bg: "rgba(123,94,167,0.1)", icon: ShieldCheck,  desc: "Approved — activating on next CF poll cycle (≤60s)" },
  active:     { label: "Active",     color: "var(--iw-success)", bg: "rgba(61,139,110,0.1)", icon: CheckCircle2, desc: "Live — powering UI modules and Normalizer" },
  deprecated: { label: "Deprecated", color: "var(--muted-foreground)", bg: "var(--secondary)", icon: X, desc: "Superseded by newer version" },
};

const CONNECTOR_EMOJI: Record<string, string> = {
  salesforce: "☁️", hubspot: "🧡", zendesk: "🎧", jira: "🔵",
  stripe: "💳", notion: "📝", github: "🐙", slack: "💬",
  gmail: "📧", google_drive: "📂",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LifecycleBadge({ state }: { state: LifecycleState }) {
  const c = LIFECYCLE_CONFIG[state];
  const Icon = c.icon;
  return (
    <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.color, fontWeight: 700, border: `1px solid ${c.color}30` }}>
      <Icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 0.9 ? "var(--iw-success)" : value >= 0.75 ? "var(--iw-warning)" : "var(--iw-danger)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: "var(--secondary)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono shrink-0" style={{ color, fontWeight: 700 }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SchemaRegistry() {
  const [mainTab, setMainTab] = useState<"registry" | "synthesis">("registry");
  const [filter, setFilter] = useState<"all" | LifecycleState>("all");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [schemas, setSchemas] = useState(SCHEMA_POOL);

  const handleApprove = (id: string) => {
    setApproving(id);
    setTimeout(() => {
      setSchemas(prev => prev.map(s =>
        s.id === id ? { ...s, lifecycleState: "active" as LifecycleState, activatedAt: "just now" } : s
      ));
      setApproving(null);
    }, 1200);
  };

  const filtered = schemas.filter(s =>
    (filter === "all" || s.lifecycleState === filter) &&
    (selectedGroup === null || s.harmonizationGroup === selectedGroup)
  );

  const pendingCount  = schemas.filter(s => s.lifecycleState === "reviewed").length;
  const proposedCount = schemas.filter(s => s.lifecycleState === "proposed").length;
  const activeCount   = schemas.filter(s => s.lifecycleState === "active").length;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>

      {/* Header — always visible */}
      <div className="px-5 pt-4 pb-3 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--iw-blue-50)", border: "1px solid var(--iw-blue-100)" }}>
            <Database className="w-4 h-4" style={{ color: "var(--iw-blue)" }} />
          </div>
          <div>
            <h2 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Schema Registry</h2>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              Schema AI governs every entity shape. UI layers grow as schemas activate.
            </p>
          </div>
          <button className="ml-auto p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: "var(--secondary)" }}>
          {(["registry", "synthesis"] as const).map(t => (
            <button key={t} onClick={() => setMainTab(t)}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: mainTab === t ? "var(--card)" : "transparent",
                color: mainTab === t ? "var(--foreground)" : "var(--muted-foreground)",
                fontWeight: mainTab === t ? 700 : 400,
              }}>
              {t === "synthesis" ? "Schema AI Synthesis" : "Schema Registry"}
            </button>
          ))}
        </div>

        {/* Stats + filter — registry only */}
        {mainTab === "registry" && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Active",       value: activeCount,   color: "var(--iw-success)", desc: "Powering UI" },
              { label: "Needs review", value: pendingCount,  color: "var(--iw-warning)", desc: "Awaiting approval" },
              { label: "Proposed",     value: proposedCount, color: "var(--iw-blue)",    desc: "Schema AI drafts" },
            ].map((s, i) => (
              <div key={i} className="px-3 py-2 rounded-xl text-center"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                <div className="text-lg" style={{ fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div className="text-[9px] mt-0.5" style={{ fontWeight: 700, color: s.color }}>{s.label}</div>
                <div className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{s.desc}</div>
              </div>
            ))}
          </div>
        )}
        {mainTab === "registry" && (
          <div className="flex gap-1 flex-wrap">
            {(["all", "active", "reviewed", "proposed", "deprecated"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-2.5 py-1 rounded-lg text-[10px] transition-all capitalize"
                style={{
                  fontWeight: 600,
                  background: filter === f ? "var(--iw-blue)" : "var(--secondary)",
                  color: filter === f ? "white" : "var(--muted-foreground)",
                }}>
                {f === "all" ? "All" : LIFECYCLE_CONFIG[f].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body — switches between synthesis and registry */}
      {mainTab === "synthesis" ? (
        <div className="flex-1 overflow-hidden">
          <SchemaAiSynthesis />
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">

      {/* The adaptation chain — shown when items are pending */}
      {pendingCount > 0 && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl flex items-center gap-3 shrink-0"
          style={{ background: "var(--iw-warning-light)", border: "1px solid var(--iw-warning)" }}>
          <Zap className="w-4 h-4 shrink-0" style={{ color: "var(--iw-warning)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ fontWeight: 700, color: "var(--iw-warning)" }}>
              {pendingCount} schema{pendingCount > 1 ? "s" : ""} ready to approve → new UI modules will activate
            </p>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              Jira issue v1.1.0 will update Tasks · Stripe invoice will add Analytics
            </p>
          </div>
          <div className="flex items-center gap-1 text-[9px] shrink-0" style={{ color: "var(--muted-foreground)" }}>
            <span>Connector</span>
            <ArrowRight className="w-3 h-3" />
            <span>Schema</span>
            <ArrowRight className="w-3 h-3" />
            <span>Entity</span>
            <ArrowRight className="w-3 h-3" />
            <span style={{ color: "var(--iw-success)", fontWeight: 700 }}>UI Module</span>
          </div>
        </div>
      )}

      {/* Harmonization group filter pills */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2 shrink-0 flex-wrap">
        <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Groups:</span>
        <button onClick={() => setSelectedGroup(null)}
          className="text-[9px] px-2 py-1 rounded-full transition-all"
          style={{ background: selectedGroup === null ? "var(--iw-blue)" : "var(--secondary)", color: selectedGroup === null ? "white" : "var(--muted-foreground)", fontWeight: 600 }}>
          All groups
        </button>
        {Object.entries(HARMONIZATION_GROUPS).map(([key, g]) => (
          <button key={key} onClick={() => setSelectedGroup(key === selectedGroup ? null : key)}
            className="text-[9px] px-2 py-1 rounded-full transition-all"
            style={{
              background: selectedGroup === key ? "var(--iw-purple)" : "var(--secondary)",
              color: selectedGroup === key ? "white" : "var(--muted-foreground)",
              fontWeight: 600,
            }}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Schema list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5 mt-1">
        {filtered.map(schema => {
          const lc = LIFECYCLE_CONFIG[schema.lifecycleState];
          const ModuleIcon = schema.uiModuleIcon;
          const isApproving = approving === schema.id;
          const needsApproval = schema.lifecycleState === "reviewed";

          return (
            <div key={schema.id}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                border: `1px solid ${needsApproval ? "rgba(212,136,62,0.35)" : "var(--border)"}`,
                background: "var(--card)",
              }}>

              {/* Schema header */}
              <div className="flex items-start gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid var(--border)", background: needsApproval ? "rgba(212,136,62,0.04)" : "var(--secondary)" }}>

                {/* Connector emoji */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  {CONNECTOR_EMOJI[schema.connectorName] || "🔌"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>
                      {schema.connectorName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                      {schema.entityType}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: "var(--muted-foreground)" }}>
                      v{schema.schemaVersion}
                    </span>
                    <LifecycleBadge state={schema.lifecycleState} />
                  </div>
                  <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "var(--muted-foreground)" }}>
                    {schema.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {needsApproval && (
                    <button onClick={() => handleApprove(schema.id)}
                      disabled={isApproving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] transition-all"
                      style={{
                        background: isApproving ? "var(--secondary)" : "var(--iw-success)",
                        color: isApproving ? "var(--muted-foreground)" : "white",
                        fontWeight: 700,
                        cursor: isApproving ? "wait" : "pointer",
                      }}>
                      {isApproving
                        ? <><RefreshCw className="w-3 h-3 animate-spin" /> Activating…</>
                        : <><Check className="w-3 h-3" /> Approve</>}
                    </button>
                  )}
                </div>
              </div>

              {/* Schema body */}
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: "var(--border)" }}>

                {/* Confidence */}
                <div className="px-4 py-3">
                  <p className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
                    Confidence
                  </p>
                  <ConfidenceBar value={schema.confidence} />
                  <p className="text-[9px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                    {schema.proposedBy === "schema_ai" ? "Schema AI" : "Manual"} · {schema.fieldCount} fields
                  </p>
                </div>

                {/* Harmonization */}
                <div className="px-4 py-3">
                  <p className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
                    Harmonizes as
                  </p>
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3" style={{ color: "var(--iw-purple)" }} />
                    <span className="text-xs" style={{ fontWeight: 600, color: "var(--iw-purple)" }}>
                      {HARMONIZATION_GROUPS[schema.harmonizationGroup]?.label || schema.harmonizationGroup}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {HARMONIZATION_GROUPS[schema.harmonizationGroup]?.canonical.slice(0, 2).map(f => (
                      <span key={f} className="text-[9px] font-mono px-1 py-0.5 rounded"
                        style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* UI Module powered */}
                <div className="px-4 py-3">
                  <p className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
                    Powers UI
                  </p>
                  {schema.uiModule ? (
                    <div className="flex items-center gap-1.5">
                      {ModuleIcon && (
                        <div className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ background: schema.lifecycleState === "active" ? "rgba(61,139,110,0.12)" : "var(--secondary)" }}>
                          <ModuleIcon className="w-3 h-3"
                            style={{ color: schema.lifecycleState === "active" ? "var(--iw-success)" : "var(--muted-foreground)" }} />
                        </div>
                      )}
                      <div>
                        <span className="text-xs" style={{ fontWeight: 600, color: schema.lifecycleState === "active" ? "var(--iw-success)" : "var(--muted-foreground)" }}>
                          {schema.uiModule}
                        </span>
                        {schema.lifecycleState !== "active" && (
                          <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                            appears on activation
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                      <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Not yet mapped</span>
                    </div>
                  )}
                  {schema.activatedAt && (
                    <p className="text-[9px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                      Active since {schema.activatedAt}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
        </div>
      )}
    </div>
  );
}
