/**
 * Entity 360 View — Real API version
 * Fetches from /api/v1/entity360/:entityId (spine-v2 assembler via Gateway)
 * Shows 6 layers: Truth, Context, Signals, Memory, Goals, Relationships
 * Plus Twin Insights with trust panel
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  FileText,
  Zap,
  Brain,
  Target,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface Entity360ViewProps {
  entityId: string;
  onBack?: () => void;
}

interface Entity360Data {
  entity?: {
    spine_id: string;
    tenant_id: string;
    entity_type: string;
    display_name: string;
    truth: {
      data: Record<string, any>;
      source_table: string;
      updated_at: string;
      freshness: string;
      sources: string[];
    };
    context: { recent: any[]; total_count: number };
    signals: { active: any[]; summary: Record<string, number> };
    memory: { recent: any[]; total_count: number };
    goals: { active: any[]; health: string };
    relationships: { parent?: any; children: any[]; related: any[] };
    meta: {
      assembled_at: string;
      hydration_bucket: string;
      department: string;
      cache_hit: boolean;
      assembly_ms?: number;
    };
  };
  insights?: any[];
  trigger_count?: number;
}

const LAYER_CONFIG = {
  truth: { icon: Database, label: "Truth", color: "text-iw-slate-mid", bg: "bg-iw-slate/5" },
  context: {
    icon: FileText,
    label: "Context",
    color: "text-iw-slate-mid",
    bg: "bg-iw-slate-mid/5",
  },
  signals: { icon: Zap, label: "Signals", color: "text-iw-gold", bg: "bg-iw-gold/5" },
  memory: { icon: Brain, label: "Memory", color: "text-iw-forest-mid", bg: "bg-iw-forest/5" },
  goals: { icon: Target, label: "Goals", color: "text-iw-slate", bg: "bg-iw-slate/5" },
  relationships: { icon: Users, label: "Relationships", color: "text-iw-red", bg: "bg-iw-red/5" },
};

export default function Entity360View({ entityId, onBack }: Entity360ViewProps) {
  const [data, setData] = useState<Entity360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("truth");
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<Entity360Data>(
        `/api/v1/entity360/${entityId}`,
        {},
        `Entity360(${entityId})`
      );
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Failed to load entity");
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.entity) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-sm">{error || "Entity not found"}</p>
        <button onClick={fetchData} className="mt-3 text-xs text-primary hover:underline">
          Retry
        </button>
      </div>
    );
  }

  const e = data.entity;
  const insights = data.insights || [];
  const healthScore = e.truth.data.health_score || e.truth.data.healthScore;
  const healthColor =
    healthScore >= 70 ? "text-iw-forest-mid" : healthScore >= 40 ? "text-iw-gold" : "text-iw-red";

  const tabs = [
    { id: "truth", count: Object.keys(e.truth.data).length },
    { id: "context", count: e.context.total_count },
    { id: "signals", count: e.signals.active.length },
    { id: "memory", count: e.memory.total_count },
    { id: "goals", count: e.goals.active.length },
    {
      id: "relationships",
      count:
        e.relationships.children.length +
        e.relationships.related.length +
        (e.relationships.parent ? 1 : 0),
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="mt-1 p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{e.display_name}</h1>
                <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                  {e.entity_type}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${e.truth.freshness === "live" ? "bg-iw-forest/10 text-iw-forest" : e.truth.freshness === "recent" ? "bg-iw-gold/10 text-iw-gold" : "bg-iw-red/10 text-iw-red"}`}
                >
                  {e.truth.freshness}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {e.meta.department} · Bucket {e.meta.hydration_bucket} · Assembled{" "}
                {e.meta.assembly_ms}ms
                {e.truth.sources.length > 0 && ` · Sources: ${e.truth.sources.join(", ")}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            {healthScore != null && (
              <div>
                <span className={`text-3xl font-bold ${healthColor}`}>{healthScore}</span>
                <p className="text-xs text-muted-foreground">Health Score</p>
              </div>
            )}
          </div>
        </div>

        {/* Twin Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-iw-slate-mid" /> Twin Insights ({insights.length})
            </h3>
            {insights.map((insight: any) => {
              const isExpanded = expandedInsight === insight.id;
              const sevColors: Record<string, string> = {
                critical: "bg-iw-red/5 border-iw-red/20 text-iw-red",
                high: "bg-iw-gold/5 border-iw-gold-light/20 text-iw-gold",
                medium: "bg-iw-gold/5 border-iw-gold/20 text-iw-gold",
                low: "bg-iw-slate/5 border-iw-slate/20 text-iw-forest",
                info: "bg-iw-paper-deep border-iw-rule-light text-iw-ink-muted",
              };
              return (
                <div
                  key={insight.id}
                  className={`border rounded-xl overflow-hidden ${sevColors[insight.severity] || sevColors.info}`}
                >
                  <button
                    onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                    className="w-full p-4 flex items-start justify-between text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white/60">
                          {insight.severity}
                        </span>
                        <span className="text-xs opacity-60">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      {!isExpanded && <p className="text-xs opacity-70 mt-1">{insight.what}</p>}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 bg-white/40">
                      <div>
                        <p className="text-xs font-semibold opacity-60 uppercase">What happened</p>
                        <p className="text-sm">{insight.what}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold opacity-60 uppercase">Why it matters</p>
                        <p className="text-sm">{insight.why}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-iw-forest/5 border border-iw-forest/20">
                        <p className="text-xs font-semibold text-iw-forest">Recommended action</p>
                        <p className="text-xs text-iw-forest-mid mt-0.5">{insight.action}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-iw-red/5 border border-iw-red/20">
                        <p className="text-xs font-semibold text-iw-red">Risk if ignored</p>
                        <p className="text-xs text-iw-red mt-0.5">{insight.risk_if_ignored}</p>
                      </div>
                      {insight.evidence?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold opacity-60 uppercase mb-1.5">
                            Evidence
                          </p>
                          <div className="space-y-1">
                            {insight.evidence.map((ev: any, i: number) => {
                              const cfg =
                                LAYER_CONFIG[ev.layer as keyof typeof LAYER_CONFIG] ||
                                LAYER_CONFIG.truth;
                              const Icon = cfg.icon;
                              return (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 text-xs p-2 rounded bg-white/60 border"
                                >
                                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.color}`} />
                                  <span>{ev.description}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${insight.confidence >= 0.8 ? "bg-iw-forest-bright" : insight.confidence >= 0.6 ? "bg-iw-gold" : "bg-iw-red"}`}
                            style={{ width: `${insight.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Layer Tabs */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {tabs.map((tab) => {
            const cfg = LAYER_CONFIG[tab.id as keyof typeof LAYER_CONFIG];
            const Icon = cfg.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? `border-current ${cfg.color}`
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
                {tab.count > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === "truth" && (
            <TruthTab
              data={e.truth.data}
              updatedAt={e.truth.updated_at}
              sourceTable={e.truth.source_table}
            />
          )}
          {activeTab === "context" && (
            <ContextTab items={e.context.recent} total={e.context.total_count} />
          )}
          {activeTab === "signals" && (
            <SignalsTab signals={e.signals.active} summary={e.signals.summary} />
          )}
          {activeTab === "memory" && (
            <MemoryTab items={e.memory.recent} total={e.memory.total_count} />
          )}
          {activeTab === "goals" && <GoalsTab goals={e.goals.active} health={e.goals.health} />}
          {activeTab === "relationships" && <RelationshipsTab rel={e.relationships} />}
        </div>
      </div>
    </div>
  );
}

/* ── Tab Components ── */

function TruthTab({
  data,
  updatedAt,
  sourceTable,
}: {
  data: Record<string, any>;
  updatedAt: string;
  sourceTable: string;
}) {
  const skipFields = new Set([
    "id",
    "tenant_id",
    "created_at",
    "updated_at",
    "source",
    "source_id",
    "entity_type",
  ]);
  const fields = Object.entries(data).filter(([k]) => !skipFields.has(k) && data[k] != null);
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Source: {sourceTable} · Updated: {new Date(updatedAt).toLocaleString()}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(([key, value]) => (
          <div key={key} className="p-3 border rounded-lg bg-card">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {key.replace(/_/g, " ")}
            </p>
            <p className="text-sm font-medium mt-0.5 truncate">
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </p>
          </div>
        ))}
      </div>
      {fields.length === 0 && <EmptyLayer message="No truth data available" />}
    </div>
  );
}

function ContextTab({ items, total }: { items: any[]; total: number }) {
  const typeIcons: Record<string, string> = {
    email: "📧",
    document: "📄",
    meeting: "📅",
    note: "📝",
    conversation: "💬",
    file: "📎",
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{total} context items linked</p>
      {items.map((item: any, i: number) => (
        <div key={item.id || i} className="p-3 border rounded-lg bg-card flex items-start gap-3">
          <span className="text-lg">{typeIcons[item.type] || "📄"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.title || "Untitled"}</p>
            {item.summary && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.summary}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {item.source} ·{" "}
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
            </p>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <EmptyLayer message="No context linked. Connect email or document tools to see context here." />
      )}
    </div>
  );
}

function SignalsTab({ signals, summary }: { signals: any[]; summary: Record<string, number> }) {
  const sevColors: Record<string, string> = {
    critical: "text-iw-red bg-iw-red/5",
    high: "text-iw-gold bg-iw-gold/5",
    medium: "text-iw-gold bg-iw-gold/5",
    low: "text-iw-slate-mid bg-iw-slate/5",
    info: "text-gray-600 bg-gray-50",
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(summary)
          .filter(([, v]) => v > 0)
          .map(([sev, count]) => (
            <span
              key={sev}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${sevColors[sev] || ""}`}
            >
              {sev}: {count}
            </span>
          ))}
      </div>
      {signals.map((s: any, i: number) => (
        <div
          key={s.id || i}
          className={`p-3 border rounded-lg ${sevColors[s.severity]?.split(" ")[1] || "bg-card"}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-xs font-bold uppercase ${sevColors[s.severity]?.split(" ")[0] || ""}`}
            >
              {s.severity}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {s.confidence ? `${Math.round(s.confidence * 100)}%` : ""}
            </span>
          </div>
          <p className="text-sm font-medium">{s.title}</p>
          {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
        </div>
      ))}
      {signals.length === 0 && (
        <EmptyLayer message="No active signals. Signals appear when Twin triggers detect patterns." />
      )}
    </div>
  );
}

function MemoryTab({ items, total }: { items: any[]; total: number }) {
  const typeIcons: Record<string, string> = {
    decision: "⚖️",
    preference: "💡",
    insight: "🔍",
    action: "⚡",
    rule: "📏",
    fact: "📌",
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{total} verified memories</p>
      {items.map((m: any, i: number) => (
        <div key={m.id || i} className="p-3 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-1">
            <span>{typeIcons[m.type || m.memory_type] || "🧠"}</span>
            <span className="text-xs font-medium capitalize">
              {m.type || m.memory_type || "insight"}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {m.confidence
                ? `${Math.round(m.confidence > 1 ? m.confidence : m.confidence * 100)}% confidence`
                : ""}
            </span>
          </div>
          <p className="text-sm">{m.content}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {m.source || "ai_extracted"} ·{" "}
            {m.created_at ? new Date(m.created_at).toLocaleDateString() : ""}
          </p>
        </div>
      ))}
      {items.length === 0 && (
        <EmptyLayer message="No memories yet. AI memories appear after AI Sessions are approved through triage." />
      )}
    </div>
  );
}

function GoalsTab({ goals, health }: { goals: any[]; health: string }) {
  const healthColors: Record<string, string> = {
    on_track: "text-iw-forest-mid",
    at_risk: "text-iw-gold",
    off_track: "text-iw-red",
    no_goals: "text-gray-400",
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Goal health:</span>
        <span className={`text-xs font-bold capitalize ${healthColors[health] || ""}`}>
          {health.replace(/_/g, " ")}
        </span>
      </div>
      {goals.map((g: any, i: number) => (
        <div key={g.id || i} className="p-3 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{g.title}</p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full capitalize ${g.status === "active" ? "bg-iw-forest/10 text-iw-forest" : g.status === "at_risk" ? "bg-iw-gold/10 text-iw-gold" : "bg-gray-100 text-gray-700"}`}
            >
              {g.status}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${g.progress >= 70 ? "bg-iw-forest-bright" : g.progress >= 40 ? "bg-iw-gold" : "bg-iw-red"}`}
              style={{ width: `${g.progress || 0}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {g.progress || 0}% complete
            {g.target_date ? ` · Due ${new Date(g.target_date).toLocaleDateString()}` : ""}
          </p>
        </div>
      ))}
      {goals.length === 0 && <EmptyLayer message="No goals linked to this entity." />}
    </div>
  );
}

function RelationshipsTab({ rel }: { rel: { parent?: any; children: any[]; related: any[] } }) {
  return (
    <div className="space-y-4">
      {rel.parent && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Parent</p>
          <div className="p-3 border rounded-lg bg-card flex items-center gap-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{rel.parent.display_name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {rel.parent.entity_type}
              </p>
            </div>
          </div>
        </div>
      )}
      {rel.children.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Children ({rel.children.length})
          </p>
          <div className="space-y-1.5">
            {rel.children.map((c: any, i: number) => (
              <div key={i} className="p-2.5 border rounded-lg bg-card flex items-center gap-3">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm">{c.display_name}</p>
                <span className="text-[10px] text-muted-foreground capitalize ml-auto">
                  {c.entity_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {rel.related.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Related ({rel.related.length})
          </p>
          <div className="space-y-1.5">
            {rel.related.map((r: any, i: number) => (
              <div key={i} className="p-2.5 border rounded-lg bg-card flex items-center gap-3">
                <p className="text-sm">{r.display_name}</p>
                <span className="text-[10px] text-muted-foreground capitalize ml-auto">
                  {r.relation} · {r.entity_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!rel.parent && rel.children.length === 0 && rel.related.length === 0 && (
        <EmptyLayer message="No relationships found for this entity." />
      )}
    </div>
  );
}

function EmptyLayer({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Database className="w-8 h-8 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
