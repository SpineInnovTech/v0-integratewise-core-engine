/**
 * L2 Intelligence Overlay — Cognitive layer for Account Success
 * NEVER inline with L1. Accessed via deliberate UI triggers.
 * Dark overlay aesthetic with purple/cyan accents.
 * Tabs: Spine, Context, Knowledge, Signals, Evidence, IQ Hub
 */
import { useState } from "react";
import {
  X, Maximize2, Minimize2, Network, FileSearch, Activity,
  AlertCircle, CheckCircle, Clock, ExternalLink, ChevronRight,
  Sparkles, Brain, Shield, Search, Database, Zap, TrendingUp,
  TrendingDown, Eye, Link, BarChart3, Settings, RefreshCw,
} from "lucide-react";
import {
  accountMasterData,
  riskRegisterData,
  generatedInsightsData,
  healthColor,
  getAccountName,
} from "./csm-intelligence-data";

type IntelTab = "spine" | "context" | "knowledge" | "signals" | "evidence" | "iq-hub";

interface IntelligenceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  contextEntity?: { type: string; id: string; name: string } | null;
}

const tabs: { id: IntelTab; label: string; icon: React.ReactNode }[] = [
  { id: "spine", label: "Spine", icon: <Network className="w-4 h-4" /> },
  { id: "context", label: "Context", icon: <FileSearch className="w-4 h-4" /> },
  { id: "knowledge", label: "Knowledge", icon: <Search className="w-4 h-4" /> },
  { id: "signals", label: "Signals", icon: <Activity className="w-4 h-4" /> },
  { id: "evidence", label: "Evidence", icon: <Eye className="w-4 h-4" /> },
  { id: "iq-hub", label: "IQ Hub", icon: <Brain className="w-4 h-4" /> },
];

export function IntelligenceOverlay({ isOpen, onClose, contextEntity }: IntelligenceOverlayProps) {
  const [activeTab, setActiveTab] = useState<IntelTab>("signals");
  const [expanded, setExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div
        className="relative h-full flex flex-col overflow-hidden animate-in slide-in-from-right"
        style={{
          width: expanded ? "100%" : "440px",
          backgroundColor: "#111111",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          transition: "width 0.3s ease",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00BCD4, #9C27B0)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Intelligence</h3>
              {contextEntity && (
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Context: {contextEntity.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              {expanded ? <Minimize2 className="w-4 h-4 text-white/60" /> : <Maximize2 className="w-4 h-4 text-white/60" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex-shrink-0 px-3 py-2 flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? "rgba(0,188,212,0.15)" : "transparent",
                color: activeTab === tab.id ? "#00BCD4" : "rgba(255,255,255,0.5)",
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "spine" && <SpineTab />}
          {activeTab === "context" && <ContextTab />}
          {activeTab === "knowledge" && <KnowledgeTab />}
          {activeTab === "signals" && <SignalsTab />}
          {activeTab === "evidence" && <EvidenceTab />}
          {activeTab === "iq-hub" && <IQHubTab />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ SPINE TAB — Entity Graph ═══════════ */
function SpineTab() {
  const nodes = [
    { id: "n1", type: "account", label: "TechServe India", source: "Salesforce", connections: 12, size: 48 },
    { id: "n2", type: "contact", label: "Ravi Sharma", source: "CRM + Slack", connections: 8, size: 36 },
    { id: "n3", type: "contact", label: "Meera Krishnan", source: "CRM", connections: 5, size: 32 },
    { id: "n4", type: "project", label: "API Integration", source: "Jira + CRM", connections: 6, size: 36 },
    { id: "n5", type: "activity", label: "QBR Meeting", source: "Zoom + Slack", connections: 4, size: 28 },
    { id: "n6", type: "document", label: "SOW v3.2", source: "Google Drive", connections: 3, size: 24 },
    { id: "n7", type: "ticket", label: "Perf Issue #312", source: "Zendesk", connections: 2, size: 24 },
  ];

  const nodeColors: Record<string, string> = {
    account: "#00BCD4", contact: "#00C853", project: "#9C27B0",
    activity: "#FF9800", document: "#FF4081", ticket: "#F44336",
  };

  return (
    <div className="space-y-5">
      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        Entity relationship graph from the Spine SSOT. Nodes = entities, edges = relationships.
      </p>

      {/* Visual node-link diagram (simplified) */}
      <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.03)", height: "280px", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Central node */}
        <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg" style={{ backgroundColor: nodeColors.account, fontWeight: 700, boxShadow: `0 0 20px ${nodeColors.account}40` }}>
            🏢
          </div>
        </div>
        {/* Orbiting nodes */}
        {nodes.slice(1).map((node, i) => {
          const angle = (i / (nodes.length - 1)) * Math.PI * 2;
          const radius = 100;
          const x = 50 + Math.cos(angle) * (radius / 2.8);
          const y = 50 + Math.sin(angle) * (radius / 2.8);
          return (
            <div key={node.id} className="absolute" style={{ top: `${y}%`, left: `${x}%`, transform: "translate(-50%, -50%)" }}>
              <div
                className="rounded-full flex items-center justify-center text-[8px] text-white cursor-pointer hover:scale-110 transition-transform"
                style={{ width: node.size, height: node.size, backgroundColor: nodeColors[node.type], fontWeight: 600, boxShadow: `0 0 12px ${nodeColors[node.type]}30` }}
                title={`${node.label} (${node.source})`}
              >
                {node.label.slice(0, 2)}
              </div>
              {/* Connection line */}
              <svg className="absolute" style={{ top: "50%", left: "50%", width: "200px", height: "200px", transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: -1 }}>
                <line x1="50%" y1="50%" x2="50%" y2="50%" stroke={nodeColors[node.type]} strokeWidth="1" strokeDasharray="4 2" opacity="0.3" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Node list */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Entities</p>
        {nodes.map(node => (
          <div key={node.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: nodeColors[node.type] }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate" style={{ fontWeight: 500 }}>{node.label}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{node.source}</p>
            </div>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{node.connections} links</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ CONTEXT TAB ═══════════ */
function ContextTab() {
  const contextCards = [
    { type: "document", title: "QBR Deck — TechServe Q1", excerpt: "Key highlights: ARR growth 12.5%, product adoption at 92%, expansion planned for Q2...", source: "Google Drive", confidence: 95, date: "Feb 8" },
    { type: "conversation", title: "Slack #techserve-support", excerpt: "Ravi: 'The new API endpoint is working great, team is happy with the performance improvements'", source: "Slack", confidence: 92, date: "Feb 9" },
    { type: "fact", title: "Contract Terms", excerpt: "2-year agreement, auto-renewing. Current ARR: $420K. Expansion clause: up to 20% at renewal.", source: "Salesforce", confidence: 99, date: "Jan 15" },
    { type: "meeting", title: "Weekly Check-in Notes", excerpt: "Discussed migration timeline, Meera confirmed API testing complete. Next: load testing.", source: "Zoom", confidence: 88, date: "Feb 7" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        Related information from across your connected sources, enriched with AI context.
      </p>
      {contextCards.map((card, i) => (
        <div key={i} className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: "rgba(0,188,212,0.15)", color: "#00BCD4", fontWeight: 600 }}>
              {card.type}
            </span>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{card.date}</span>
          </div>
          <h4 className="text-sm text-white" style={{ fontWeight: 500 }}>{card.title}</h4>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{card.excerpt}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Database className="w-3 h-3" /> {card.source}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "#00BCD4" }}>{card.confidence}% confidence</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════ KNOWLEDGE TAB ═══════════ */
function KnowledgeTab() {
  const [query, setQuery] = useState("");

  const results = [
    { title: "CS Playbook — At-Risk Account Recovery", match: "Step 3: Schedule executive sponsor call within 48 hours of health score dropping below 60", relevance: 94, source: "Notion", space: "Team" },
    { title: "Health Score Model v3 Documentation", match: "Product Adoption weight: 40%, Engagement: 30%, Value Realization: 30%", relevance: 88, source: "Google Drive", space: "Team" },
    { title: "TechServe SOW v3.2", match: "Service Level Agreement: 99.9% uptime, 4-hour response time for P1 incidents", relevance: 82, source: "Salesforce", space: "Account" },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
        <input
          type="text" placeholder="Search across all knowledge..."
          value={query} onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none placeholder:text-white/30 text-white"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
      </div>

      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={i} className="rounded-xl p-4 cursor-pointer transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm text-white" style={{ fontWeight: 500 }}>{r.title}</h4>
              <span className="text-[10px] font-mono" style={{ color: "#9C27B0" }}>{r.relevance}%</span>
            </div>
            <p className="text-[11px] leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>...{r.match}...</p>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span>{r.source}</span>
              <span>·</span>
              <span>{r.space}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Topic Browser */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Topic Browser</p>
        {[
          { topic: "Account Management", subtopics: ["Health Scoring", "Renewals", "Expansion"] },
          { topic: "Customer Success", subtopics: ["Playbooks", "Onboarding", "QBR Templates"] },
          { topic: "Technical", subtopics: ["API Docs", "Integration Guides", "Security"] },
        ].map(t => (
          <div key={t.topic} className="mb-2">
            <p className="text-xs text-white mb-1 flex items-center gap-1 cursor-pointer" style={{ fontWeight: 500 }}>
              <ChevronRight className="w-3 h-3" style={{ color: "#9C27B0" }} />
              {t.topic}
            </p>
            <div className="flex flex-wrap gap-1 ml-4">
              {t.subtopics.map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer" style={{ backgroundColor: "rgba(156,39,176,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ SIGNALS TAB — Health & Predictions ═══════════ */
function SignalsTab() {
  const accounts = accountMasterData;
  const risks = riskRegisterData;
  const insights = generatedInsightsData;

  const avgHealth = Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length);
  const criticalRisks = risks.filter(r => r.riskLevel === "Critical");
  const highRisks = risks.filter(r => r.riskLevel === "High");
  // Opportunities from generated insights (positive signals)
  const opportunities = insights.filter(i => i.insightText.toLowerCase().includes("expansion") || i.insightText.toLowerCase().includes("growth") || i.insightText.toLowerCase().includes("opportunity"));

  return (
    <div className="space-y-5">
      {/* Overall Health */}
      <div className="rounded-xl p-5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Portfolio Health</p>
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-2" style={{ border: `3px solid ${healthColor(avgHealth)}`, boxShadow: `0 0 20px ${healthColor(avgHealth)}30` }}>
          <span className="text-2xl text-white" style={{ fontWeight: 700 }}>{avgHealth}</span>
        </div>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Across {accounts.length} accounts · Trend: <span style={{ color: "#00C853" }}>+2.3</span></p>
      </div>

      {/* Risk Alerts */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
          <AlertCircle className="w-3 h-3" style={{ color: "#F44336" }} />
          Risk Alerts ({criticalRisks.length + highRisks.length})
        </p>
        {[...criticalRisks, ...highRisks].map(risk => {
          const isCritical = risk.riskLevel === "Critical";
          return (
            <div key={risk.riskId} className="rounded-xl p-4 mb-2 cursor-pointer transition-colors" style={{
              backgroundColor: isCritical ? "rgba(244,67,54,0.08)" : "rgba(255,152,0,0.08)",
              border: `1px solid ${isCritical ? "rgba(244,67,54,0.15)" : "rgba(255,152,0,0.15)"}`,
            }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded uppercase" style={{
                  backgroundColor: isCritical ? "rgba(244,67,54,0.2)" : "rgba(255,152,0,0.2)",
                  color: isCritical ? "#F44336" : "#FF9800",
                  fontWeight: 700,
                }}>{risk.riskLevel}</span>
                <span className="text-xs text-white truncate" style={{ fontWeight: 500 }}>{getAccountName(risk.account)}</span>
              </div>
              <p className="text-[11px] text-white mb-1" style={{ fontWeight: 500 }}>{risk.riskTitle}</p>
              <p className="text-[10px] leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{risk.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <Eye className="w-3 h-3" /> Risk Score: {risk.riskScore} · {risk.status}
                </span>
                <button className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,188,212,0.15)", color: "#00BCD4", fontWeight: 600 }}>
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Opportunities from Insights */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
          <TrendingUp className="w-3 h-3" style={{ color: "#00C853" }} />
          Opportunities ({opportunities.length})
        </p>
        {opportunities.map(opp => (
          <div key={opp.insightId} className="rounded-xl p-4 mb-2" style={{ backgroundColor: "rgba(0,200,83,0.06)", border: "1px solid rgba(0,200,83,0.12)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-white" style={{ fontWeight: 500 }}>{getAccountName(opp.account)}</span>
            </div>
            <p className="text-[11px] text-white mb-1" style={{ fontWeight: 500 }}>{opp.insightText.slice(0, 100)}...</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{opp.recommendedAction.slice(0, 120)}...</p>
            <button className="mt-2 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,200,83,0.15)", color: "#00C853", fontWeight: 600 }}>
              {opp.status === "New" ? "Review Insight" : "View Action"}
            </button>
          </div>
        ))}
      </div>

      {/* Recommended Actions */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
          Recommended Actions
        </p>
        {[
          { priority: 1, action: "Schedule escalation call with LogiPrime CEO", reason: "Renewal in 19d, health critical", type: "urgent" },
          { priority: 2, action: "Send renewal proposal to FinanceFlow CFO", reason: "CFO not contacted in 21 days", type: "urgent" },
          { priority: 3, action: "Prepare expansion proposal for HealthTech", reason: "NPS 90, CTO requesting 3 modules", type: "growth" },
          { priority: 4, action: "Review CloudBridge usage trends", reason: "DAU down 15% week-over-week", type: "monitor" },
        ].map(a => (
          <div key={a.priority} className="flex items-center gap-3 p-2.5 rounded-lg mb-1.5" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0" style={{
              backgroundColor: a.type === "urgent" ? "rgba(244,67,54,0.2)" : a.type === "growth" ? "rgba(0,200,83,0.2)" : "rgba(255,152,0,0.2)",
              color: a.type === "urgent" ? "#F44336" : a.type === "growth" ? "#00C853" : "#FF9800",
              fontWeight: 700,
            }}>{a.priority}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white" style={{ fontWeight: 500 }}>{a.action}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{a.reason}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ EVIDENCE TAB — Provenance Tree ═══════════ */
function EvidenceTab() {
  const chain = [
    { id: 1, type: "source", label: "Salesforce: Account Record", confidence: 99, time: "Real-time sync", icon: <Database className="w-3 h-3" /> },
    { id: 2, type: "source", label: "Stripe: Payment History", confidence: 99, time: "Hourly sync", icon: <Database className="w-3 h-3" /> },
    { id: 3, type: "source", label: "Slack: #techserve-support", confidence: 95, time: "Streaming", icon: <Database className="w-3 h-3" /> },
    { id: 4, type: "transform", label: "Spine: Data Normalization", confidence: 97, time: "Processed 2 min ago", icon: <RefreshCw className="w-3 h-3" /> },
    { id: 5, type: "ai", label: "ChurnShield: Risk Assessment", confidence: 82, time: "Model v3.2", icon: <Brain className="w-3 h-3" /> },
    { id: 6, type: "insight", label: "Account Health: 78/100 (At-Risk)", confidence: 82, time: "Generated 1 min ago", icon: <Sparkles className="w-3 h-3" /> },
  ];

  const typeStyle: Record<string, { color: string; bg: string }> = {
    source: { color: "#00BCD4", bg: "rgba(0,188,212,0.1)" },
    transform: { color: "#FF9800", bg: "rgba(255,152,0,0.1)" },
    ai: { color: "#9C27B0", bg: "rgba(156,39,176,0.1)" },
    insight: { color: "#00C853", bg: "rgba(0,200,83,0.1)" },
  };

  return (
    <div className="space-y-5">
      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        Every AI insight traces back to its data sources. Click any node to inspect.
      </p>

      {/* Provenance tree */}
      <div className="space-y-0">
        {chain.map((node, i) => {
          const s = typeStyle[node.type];
          return (
            <div key={node.id} className="flex gap-3">
              {/* Vertical line */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg, color: s.color }}>
                  {node.icon}
                </div>
                {i < chain.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />}
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase" style={{ color: s.color, fontWeight: 700 }}>{node.type}</span>
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{node.confidence}%</span>
                </div>
                <p className="text-xs text-white" style={{ fontWeight: 500 }}>{node.label}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{node.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button className="flex-1 text-[11px] py-2 rounded-lg text-center" style={{ backgroundColor: "rgba(0,188,212,0.1)", color: "#00BCD4", fontWeight: 600 }}>
          Export Evidence Chain
        </button>
        <button className="flex-1 text-[11px] py-2 rounded-lg text-center" style={{ backgroundColor: "rgba(244,67,54,0.1)", color: "#F44336", fontWeight: 600 }}>
          Flag as Incorrect
        </button>
      </div>
    </div>
  );
}

/* ═══════════ IQ HUB — Mission Control ═══════════ */
function IQHubTab() {
  const connectors = [
    { name: "Salesforce", icon: "☁️", status: "syncing", lastSync: "2 min ago" },
    { name: "Slack", icon: "💬", status: "connected", lastSync: "Streaming" },
    { name: "Stripe", icon: "💳", status: "connected", lastSync: "1h ago" },
    { name: "Zendesk", icon: "🎫", status: "error", lastSync: "Failed 30min ago" },
    { name: "Google Drive", icon: "📁", status: "connected", lastSync: "15 min ago" },
    { name: "Zoom", icon: "📹", status: "paused", lastSync: "Paused by admin" },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    connected: { bg: "rgba(0,200,83,0.15)", text: "#00C853" },
    syncing: { bg: "rgba(0,102,255,0.15)", text: "#448AFF" },
    error: { bg: "rgba(244,67,54,0.15)", text: "#F44336" },
    paused: { bg: "rgba(255,152,0,0.15)", text: "#FF9800" },
  };

  return (
    <div className="space-y-5">
      {/* System Health */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>System Health</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Uptime", value: "99.9%", color: "#00C853" },
            { label: "Latency", value: "42ms", color: "#00BCD4" },
            { label: "Storage", value: "2.1GB", color: "#9C27B0" },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-lg text-white" style={{ fontWeight: 700, color: m.color }}>{m.value}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Connector Status */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Connector Status</p>
        <div className="space-y-1.5">
          {connectors.map(c => {
            const sc = statusColors[c.status] || statusColors.connected;
            return (
              <div key={c.name} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <span className="text-lg">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white" style={{ fontWeight: 500 }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{c.lastSync}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: sc.bg, color: sc.text, fontWeight: 600 }}>
                  {c.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hydration Progress */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Hydration Progress</p>
        <div className="space-y-2">
          {[
            { bucket: "Accounts", level: 7, max: 7 },
            { bucket: "Contacts", level: 5, max: 7 },
            { bucket: "Activities", level: 4, max: 7 },
            { bucket: "Tickets", level: 3, max: 7 },
            { bucket: "Documents", level: 2, max: 7 },
          ].map(b => (
            <div key={b.bucket}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-white" style={{ fontWeight: 500 }}>{b.bucket}</span>
                <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>{b.level}/{b.max}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${(b.level / b.max) * 100}%`, background: `linear-gradient(90deg, #00BCD4, #9C27B0)` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-3 p-2 rounded-lg" style={{ backgroundColor: "rgba(156,39,176,0.1)", color: "rgba(255,255,255,0.5)" }}>
          <Sparkles className="w-3 h-3 inline mr-1" style={{ color: "#9C27B0" }} />
          Add 2 more connectors to unlock <span style={{ color: "#9C27B0", fontWeight: 600 }}>Signals Intelligence</span>
        </p>
      </div>
    </div>
  );
}