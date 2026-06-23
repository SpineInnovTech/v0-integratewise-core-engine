/**
 * L2 Intelligence Overlay — Cognitive layer for Account Success
 * NEVER inline with L1. Accessed via deliberate UI triggers.
 * Dark overlay aesthetic with purple/cyan accents.
 * Tabs: Spine, Context, Knowledge, Signals, Evidence, IQ Hub
 *
 * Data from Spine SSOT via useHydrateProjection("account_success")
 * and useWorkspaceEntitiesBatch for entity reads.
 */
import { useState, useMemo } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Network,
  FileSearch,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Brain,
  Shield,
  Search,
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  Eye,
  Link,
  BarChart3,
  Settings,
  RefreshCw,
} from "lucide-react";
import {
  healthColor,
  getAccountName,
  type AccountMaster,
  type TechnicalRisk,
  type GeneratedInsight,
} from "./csm-intelligence-data";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";

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
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />
      <div
        className="relative h-full flex flex-col overflow-hidden animate-in slide-in-from-right"
        style={{
          width: expanded ? "100%" : "440px",
          backgroundColor: "#0c0c0c",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          transition: "width 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3d7a50, #b8943f)" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>
                Intelligence
              </h3>
              {contextEntity && (
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Context: {contextEntity.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              {expanded ? (
                <Minimize2 className="w-4 h-4 text-white/60" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white/60" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div
          className="flex-shrink-0 px-3 py-2 flex gap-1 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? "rgba(45, 90, 61,0.15)" : "transparent",
                color: activeTab === tab.id ? "#3d7a50" : "rgba(255,255,255,0.5)",
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
  const { data: proj } = useHydrateProjection<any>("account_success");
  const entityGraph = proj?.entityGraph || proj?.entity_graph || [];

  const nodeColors: Record<string, string> = {
    account: "#3d7a50",
    contact: "#3D7A50",
    project: "#b8943f",
    activity: "#B8943F",
    document: "#d4ac5a",
    ticket: "#8B2020",
    deal: "#3d7a50",
    opportunity: "#b8943f",
  };

  return (
    <div className="space-y-5">
      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        Entity relationship graph from the Spine SSOT. Nodes = entities, edges = relationships.
      </p>

      {entityGraph.length > 0 ? (
        <>
          {/* Visual node-link diagram */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              height: "280px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Central node */}
            {entityGraph.length > 0 && (
              <div
                className="absolute"
                style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg"
                  style={{
                    backgroundColor: nodeColors[entityGraph[0]?.type] || "#3d7a50",
                    fontWeight: 700,
                    boxShadow: `0 0 20px ${nodeColors[entityGraph[0]?.type] || "#3d7a50"}40`,
                  }}
                >
                  {entityGraph[0]?.label?.slice(0, 2) || "??"}
                </div>
              </div>
            )}
            {/* Orbiting nodes */}
            {entityGraph.slice(1, 7).map((node: any, i: number) => {
              const angle = (i / Math.min(entityGraph.length - 1, 6)) * Math.PI * 2;
              const radius = 100;
              const x = 50 + Math.cos(angle) * (radius / 2.8);
              const y = 50 + Math.sin(angle) * (radius / 2.8);
              const nodeSize = node.size || 32;
              return (
                <div
                  key={node.id || i}
                  className="absolute"
                  style={{ top: `${y}%`, left: `${x}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div
                    className="rounded-full flex items-center justify-center text-[8px] text-white cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      width: nodeSize,
                      height: nodeSize,
                      backgroundColor: nodeColors[node.type] || "#6b665f",
                      fontWeight: 600,
                      boxShadow: `0 0 12px ${nodeColors[node.type] || "#6b665f"}30`,
                    }}
                    title={`${node.label} (${node.source || node.type})`}
                  >
                    {node.label?.slice(0, 2) || "??"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Node list */}
          <div className="space-y-1.5">
            <p
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}
            >
              Entities ({entityGraph.length})
            </p>
            {entityGraph.map((node: any) => (
              <div
                key={node.id}
                className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: nodeColors[node.type] || "#6b665f" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate" style={{ fontWeight: 500 }}>
                    {node.label}
                  </p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {node.source || node.type}
                  </p>
                </div>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {node.connections ?? 0} links
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Network className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            No entity graph data yet. Connect your tools to build the relationship graph.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════ CONTEXT TAB ═══════════ */
function ContextTab() {
  const { data: proj } = useHydrateProjection<any>("account_success");
  const contextCards = proj?.contextCards || proj?.context_cards || [];

  return (
    <div className="space-y-4">
      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        Related information from across your connected sources, enriched with AI context.
      </p>
      {contextCards.length > 0 ? (
        contextCards.map((card: any, i: number) => (
          <div
            key={card.id || i}
            className="rounded-xl p-4 space-y-2"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                style={{
                  backgroundColor: "rgba(45, 90, 61,0.15)",
                  color: "#3d7a50",
                  fontWeight: 600,
                }}
              >
                {card.type || "document"}
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {card.date || card.created_at || "—"}
              </span>
            </div>
            <h4 className="text-sm text-white" style={{ fontWeight: 500 }}>
              {card.title}
            </h4>
            {card.excerpt && (
              <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {card.excerpt}
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <span
                className="text-[10px] flex items-center gap-1"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                <Database className="w-3 h-3" /> {card.source || "—"}
              </span>
              {card.confidence != null && (
                <span className="text-[10px] font-mono" style={{ color: "#3d7a50" }}>
                  {card.confidence}% confidence
                </span>
              )}
            </div>
          </div>
        ))
      ) : (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <FileSearch className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            No context data yet. Connect your tools to surface relevant documents and conversations.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════ KNOWLEDGE TAB ═══════════ */
function KnowledgeTab() {
  const { data: proj } = useHydrateProjection<any>("account_success");
  const knowledgeResults = proj?.knowledgeResults || proj?.knowledge_results || [];
  const topicGroups = proj?.topicGroups || proj?.topic_groups || [];
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return knowledgeResults;
    const q = query.toLowerCase();
    return knowledgeResults.filter(
      (r: any) => r.title?.toLowerCase().includes(q) || r.match?.toLowerCase().includes(q)
    );
  }, [knowledgeResults, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "rgba(255,255,255,0.3)" }}
        />
        <input
          type="text"
          placeholder="Search across all knowledge..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none placeholder:text-white/30 text-white"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((r: any, i: number) => (
            <div
              key={r.id || i}
              className="rounded-xl p-4 cursor-pointer transition-colors"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm text-white" style={{ fontWeight: 500 }}>
                  {r.title}
                </h4>
                {r.relevance != null && (
                  <span className="text-[10px] font-mono" style={{ color: "#b8943f" }}>
                    {r.relevance}%
                  </span>
                )}
              </div>
              {r.match && (
                <p
                  className="text-[11px] leading-relaxed mb-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  ...{r.match}...
                </p>
              )}
              <div
                className="flex items-center gap-2 text-[10px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                <span>{r.source || "—"}</span>
                {r.space && (
                  <>
                    <span>·</span>
                    <span>{r.space}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {knowledgeResults.length === 0
              ? "No knowledge articles yet. Connect your tools to populate."
              : "No results match your search"}
          </p>
        </div>
      )}

      {/* Topic Browser */}
      {topicGroups.length > 0 && (
        <div>
          <p
            className="text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}
          >
            Topic Browser
          </p>
          {topicGroups.map((t: any) => (
            <div key={t.topic || t.name} className="mb-2">
              <p
                className="text-xs text-white mb-1 flex items-center gap-1 cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <ChevronRight className="w-3 h-3" style={{ color: "#b8943f" }} />
                {t.topic || t.name}
              </p>
              {t.subtopics && (
                <div className="flex flex-wrap gap-1 ml-4">
                  {t.subtopics.map((s: string) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer"
                      style={{
                        backgroundColor: "rgba(184, 148, 63,0.1)",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════ SIGNALS TAB — Health & Predictions ═══════════ */
function SignalsTab() {
  const { data: batch } = useWorkspaceEntitiesBatch(["account_master", "risk", "insight"]);
  const { data: proj } = useHydrateProjection<any>("account_success");
  const accounts = (batch.account_master ?? []) as AccountMaster[];
  const risks = (batch.risk ?? []) as TechnicalRisk[];
  const insights = (batch.insight ?? []) as GeneratedInsight[];
  const recommendedActions = proj?.recommendedActions || proj?.recommended_actions || [];

  const avgHealth =
    accounts.length > 0
      ? Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length)
      : 0;
  const criticalRisks = risks.filter((r) => r.riskLevel === "Critical");
  const highRisks = risks.filter((r) => r.riskLevel === "High");
  // Opportunities from generated insights (positive signals)
  const opportunities = insights.filter(
    (i) =>
      i.insightText.toLowerCase().includes("expansion") ||
      i.insightText.toLowerCase().includes("growth") ||
      i.insightText.toLowerCase().includes("opportunity")
  );

  return (
    <div className="space-y-5">
      {/* Overall Health */}
      <div
        className="rounded-xl p-5 text-center"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          className="text-[10px] uppercase tracking-wider mb-2"
          style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}
        >
          Portfolio Health
        </p>
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-2"
          style={{
            border: `3px solid ${healthColor(avgHealth)}`,
            boxShadow: `0 0 20px ${healthColor(avgHealth)}30`,
          }}
        >
          <span className="text-2xl text-white" style={{ fontWeight: 700 }}>
            {avgHealth || "—"}
          </span>
        </div>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Risk Alerts */}
      <div>
        <p
          className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5"
          style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}
        >
          <AlertCircle className="w-3 h-3" style={{ color: "#8B2020" }} />
          Risk Alerts ({criticalRisks.length + highRisks.length})
        </p>
        {[...criticalRisks, ...highRisks].length > 0 ? (
          [...criticalRisks, ...highRisks].map((risk) => {
            const isCritical = risk.riskLevel === "Critical";
            return (
              <div
                key={risk.riskId}
                className="rounded-xl p-4 mb-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: isCritical ? "rgba(244,67,54,0.08)" : "rgba(255,152,0,0.08)",
                  border: `1px solid ${isCritical ? "rgba(244,67,54,0.15)" : "rgba(255,152,0,0.15)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded uppercase"
                    style={{
                      backgroundColor: isCritical ? "rgba(244,67,54,0.2)" : "rgba(255,152,0,0.2)",
                      color: isCritical ? "#8B2020" : "#B8943F",
                      fontWeight: 700,
                    }}
                  >
                    {risk.riskLevel}
                  </span>
                  <span className="text-xs text-white truncate" style={{ fontWeight: 500 }}>
                    {getAccountName(risk.account)}
                  </span>
                </div>
                <p className="text-[11px] text-white mb-1" style={{ fontWeight: 500 }}>
                  {risk.riskTitle}
                </p>
                <p
                  className="text-[10px] leading-relaxed mb-2"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {risk.description}
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] flex items-center gap-1"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <Eye className="w-3 h-3" /> Risk Score: {risk.riskScore} · {risk.status}
                  </span>
                  <button
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(45, 90, 61,0.15)",
                      color: "#3d7a50",
                      fontWeight: 600,
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            No critical or high-severity risks detected
          </p>
        )}
      </div>

      {/* Opportunities from Insights */}
      <div>
        <p
          className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5"
          style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}
        >
          <TrendingUp className="w-3 h-3" style={{ color: "#3D7A50" }} />
          Opportunities ({opportunities.length})
        </p>
        {opportunities.length > 0 ? (
          opportunities.map((opp) => (
            <div
              key={opp.insightId}
              className="rounded-xl p-4 mb-2"
              style={{
                backgroundColor: "rgba(0,200,83,0.06)",
                border: "1px solid rgba(0,200,83,0.12)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-white" style={{ fontWeight: 500 }}>
                  {getAccountName(opp.account)}
                </span>
              </div>
              <p className="text-[11px] text-white mb-1" style={{ fontWeight: 500 }}>
                {opp.insightText.slice(0, 100)}
                {opp.insightText.length > 100 ? "..." : ""}
              </p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                {opp.recommendedAction.slice(0, 120)}
                {opp.recommendedAction.length > 120 ? "..." : ""}
              </p>
              <button
                className="mt-2 text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(0,200,83,0.15)",
                  color: "#3D7A50",
                  fontWeight: 600,
                }}
              >
                {opp.status === "New" ? "Review Insight" : "View Action"}
              </button>
            </div>
          ))
        ) : (
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            No expansion opportunities detected yet
          </p>
        )}
      </div>

      {/* Recommended Actions — from projection data */}
      {recommendedActions.length > 0 && (
        <div>
          <p
            className="text-[10px] uppercase tracking-wider mb-3"
            style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}
          >
            Recommended Actions
          </p>
          {recommendedActions.map((a: any, idx: number) => (
            <div
              key={a.id || idx}
              className="flex items-center gap-3 p-2.5 rounded-lg mb-1.5"
              style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                style={{
                  backgroundColor:
                    a.type === "urgent"
                      ? "rgba(244,67,54,0.2)"
                      : a.type === "growth"
                        ? "rgba(0,200,83,0.2)"
                        : "rgba(255,152,0,0.2)",
                  color:
                    a.type === "urgent" ? "#8B2020" : a.type === "growth" ? "#3D7A50" : "#B8943F",
                  fontWeight: 700,
                }}
              >
                {a.priority || idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white" style={{ fontWeight: 500 }}>
                  {a.action || a.title}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {a.reason || a.description || "—"}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════ EVIDENCE TAB — Provenance Tree ═══════════ */
function EvidenceTab() {
  const { data: proj } = useHydrateProjection<any>("account_success");
  const chain = proj?.evidenceChain || proj?.evidence_chain || [];

  const typeStyle: Record<string, { color: string; bg: string }> = {
    source: { color: "#3d7a50", bg: "rgba(45, 90, 61,0.1)" },
    transform: { color: "#B8943F", bg: "rgba(255,152,0,0.1)" },
    ai: { color: "#b8943f", bg: "rgba(184, 148, 63,0.1)" },
    insight: { color: "#3D7A50", bg: "rgba(0,200,83,0.1)" },
  };

  const typeIcons: Record<string, React.ReactNode> = {
    source: <Database className="w-3 h-3" />,
    transform: <RefreshCw className="w-3 h-3" />,
    ai: <Brain className="w-3 h-3" />,
    insight: <Sparkles className="w-3 h-3" />,
  };

  return (
    <div className="space-y-5">
      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        Every AI insight traces back to its data sources. Click any node to inspect.
      </p>

      {chain.length > 0 ? (
        <>
          {/* Provenance tree */}
          <div className="space-y-0">
            {chain.map((node: any, i: number) => {
              const s = typeStyle[node.type] || typeStyle.source;
              return (
                <div key={node.id || i} className="flex gap-3">
                  {/* Vertical line */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: s.bg, color: s.color }}
                    >
                      {typeIcons[node.type] || <Database className="w-3 h-3" />}
                    </div>
                    {i < chain.length - 1 && (
                      <div
                        className="w-px flex-1 my-1"
                        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                      />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] uppercase"
                        style={{ color: s.color, fontWeight: 700 }}
                      >
                        {node.type}
                      </span>
                      {node.confidence != null && (
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          {node.confidence}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white" style={{ fontWeight: 500 }}>
                      {node.label}
                    </p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {node.time || node.description || "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 text-[11px] py-2 rounded-lg text-center"
              style={{
                backgroundColor: "rgba(45, 90, 61,0.1)",
                color: "#3d7a50",
                fontWeight: 600,
              }}
            >
              Export Evidence Chain
            </button>
            <button
              className="flex-1 text-[11px] py-2 rounded-lg text-center"
              style={{
                backgroundColor: "rgba(244,67,54,0.1)",
                color: "#8B2020",
                fontWeight: 600,
              }}
            >
              Flag as Incorrect
            </button>
          </div>
        </>
      ) : (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Eye className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            No evidence chain available. Select a signal or insight to trace its provenance.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════ IQ HUB — Mission Control ═══════════ */
function IQHubTab() {
  const { data: proj } = useHydrateProjection<any>("account_success");
  const connectors = proj?.connectors || [];
  const systemHealth = proj?.systemHealth || proj?.system_health || [];
  const hydrationProgress = proj?.hydrationProgress || proj?.hydration_progress || [];

  const statusColors: Record<string, { bg: string; text: string }> = {
    connected: { bg: "rgba(0,200,83,0.15)", text: "#3D7A50" },
    syncing: { bg: "rgba(61, 122, 80,0.15)", text: "#5e9277" },
    error: { bg: "rgba(244,67,54,0.15)", text: "#8B2020" },
    paused: { bg: "rgba(255,152,0,0.15)", text: "#B8943F" },
  };

  return (
    <div className="space-y-5">
      {/* System Health */}
      <div>
        <p
          className="text-[10px] uppercase tracking-wider mb-3"
          style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}
        >
          System Health
        </p>
        {systemHealth.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {systemHealth.map((m: any) => (
              <div
                key={m.label || m.name}
                className="rounded-xl p-3 text-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="text-lg text-white"
                  style={{ fontWeight: 700, color: m.color || "#3d7a50" }}
                >
                  {m.value}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {m.label || m.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              No system health metrics available yet
            </p>
          </div>
        )}
      </div>

      {/* Connector Status */}
      <div>
        <p
          className="text-[10px] uppercase tracking-wider mb-3"
          style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}
        >
          Connector Status
        </p>
        {connectors.length > 0 ? (
          <div className="space-y-1.5">
            {connectors.map((c: any) => {
              const sc = statusColors[c.status] || statusColors.connected;
              return (
                <div
                  key={c.name || c.connector_id}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  <span className="text-lg">{c.icon || "🔗"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white" style={{ fontWeight: 500 }}>
                      {c.name}
                    </p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {c.lastSync || c.last_sync || "—"}
                    </p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: sc.bg, color: sc.text, fontWeight: 600 }}
                  >
                    {c.status}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              No connectors configured yet. Add integrations in Settings.
            </p>
          </div>
        )}
      </div>

      {/* Hydration Progress */}
      <div>
        <p
          className="text-[10px] uppercase tracking-wider mb-3"
          style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600 }}
        >
          Hydration Progress
        </p>
        {hydrationProgress.length > 0 ? (
          <>
            <div className="space-y-2">
              {hydrationProgress.map((b: any) => {
                const level = b.level ?? b.current ?? 0;
                const max = b.max ?? b.total ?? 7;
                return (
                  <div key={b.bucket || b.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-white" style={{ fontWeight: 500 }}>
                        {b.bucket || b.name}
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {level}/{max}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${max > 0 ? (level / max) * 100 : 0}%`,
                          background: "linear-gradient(90deg, #3d7a50, #b8943f)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p
              className="text-[10px] mt-3 p-2 rounded-lg"
              style={{
                backgroundColor: "rgba(184, 148, 63,0.1)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <Sparkles className="w-3 h-3 inline mr-1" style={{ color: "#b8943f" }} />
              Connect more tools to unlock{" "}
              <span style={{ color: "#b8943f", fontWeight: 600 }}>Signals Intelligence</span>
            </p>
          </>
        ) : (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              No hydration data yet. Connect your tools to start hydrating.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntelligenceOverlay;
