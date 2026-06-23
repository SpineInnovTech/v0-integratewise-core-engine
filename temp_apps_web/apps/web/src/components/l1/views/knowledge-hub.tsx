/**
 * Knowledge Hub — Unified entry point for AI Sessions / Approval-Based Personal Memory
 * Tabs: Sessions | Memories | Triage | Topics | Search
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Search,
  Inbox,
  BookOpen,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Shield,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

type Tab = "sessions" | "memories" | "triage" | "topics" | "search";

export function KnowledgeHub() {
  const [activeTab, setActiveTab] = useState<Tab>("memories");

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "memories", label: "Memories", icon: Brain },
    { id: "triage", label: "Triage Inbox", icon: Inbox },
    { id: "sessions", label: "Sessions", icon: BookOpen },
    { id: "topics", label: "Topics", icon: Tag },
    { id: "search", label: "Search", icon: Search },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 border-b px-6 py-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-iw-forest-mid" /> Knowledge Hub
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Approval-Based Personal Memory — verified knowledge from AI Sessions
        </p>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "memories" && <MemoryBrowser />}
        {activeTab === "triage" && <TriageInbox />}
        {activeTab === "sessions" && <SessionsList />}
        {activeTab === "topics" && <TopicsList />}
        {activeTab === "search" && <KnowledgeSearch />}
      </div>
    </div>
  );
}

/* ── Memory Browser ── */
function MemoryBrowser() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ data?: any[]; memories?: any[] }>(
          "/api/v1/knowledge/memories",
          {},
          "Memories"
        );
        setMemories(res.data || res.memories || []);
      } catch {
        setMemories([]);
      }
      setLoading(false);
    })();
  }, []);

  const types = ["all", "decision", "preference", "insight", "action", "rule", "fact"];
  const typeIcons: Record<string, string> = {
    decision: "⚖️",
    preference: "💡",
    insight: "🔍",
    action: "⚡",
    rule: "📏",
    fact: "📌",
  };
  const filtered =
    typeFilter === "all"
      ? memories
      : memories.filter((m) => (m.type || m.memory_type) === typeFilter);

  if (loading) return <Loading />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{memories.length} verified memories</p>
        <div className="flex gap-1">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 text-xs rounded-lg capitalize ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {t === "all" ? "All" : `${typeIcons[t] || ""} ${t}`}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <Empty message="No memories yet. Memories appear after AI Sessions are approved through triage." />
      ) : (
        <div className="space-y-2">
          {filtered.map((m: any, i: number) => (
            <div key={m.id || i} className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{typeIcons[m.type || m.memory_type] || "🧠"}</span>
                <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-muted">
                  {m.type || m.memory_type || "insight"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {m.confidence != null
                    ? `${typeof m.confidence === "number" && m.confidence <= 1 ? Math.round(m.confidence * 100) : m.confidence}% confidence`
                    : ""}
                </span>
              </div>
              <p className="text-sm">{m.content}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                {m.created_at && <span>{new Date(m.created_at).toLocaleDateString()}</span>}
                {m.source && <span>Source: {m.source}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Triage Inbox ── */
function TriageInbox() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data?: any[]; results?: any[] }>(
        "/api/v1/triage/results?status=pending",
        {},
        "TriageInbox"
      );
      setItems(res.data || res.results || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resolve = async (id: string, action: "approve" | "reject") => {
    setResolving(id);
    try {
      await apiFetch(
        `/api/v1/triage/results/${id}/${action}`,
        { method: "POST" },
        `Triage${action}`
      );
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Triage resolve failed:", err);
    }
    setResolving(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Pending Review</p>
          <p className="text-xs text-muted-foreground">
            AI-generated content awaiting your approval
          </p>
        </div>
        <button onClick={fetchItems} className="p-2 rounded-lg hover:bg-muted">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Approval-Based Personal Memory explainer */}
      <div className="p-3 rounded-lg bg-iw-forest/5 border border-iw-forest/20 text-xs text-iw-forest flex items-start gap-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Approval-Based Personal Memory</p>
          <p className="mt-0.5 opacity-80">
            Only content you approve enters the knowledge base. Rejected content is logged but never
            stored as fact. Every AI reads from verified knowledge only.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <Empty message="No pending triage items. AI-generated content will appear here for review." />
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="p-4 border rounded-lg bg-card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-iw-slate-mid" />
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-iw-slate-mid/10 text-iw-slate">
                    {item.platform || item.source || "AI"}
                  </span>
                  {item.priority && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${item.priority === "high" ? "bg-iw-red/10 text-iw-red" : "bg-gray-100 text-gray-700"}`}
                    >
                      {item.priority}
                    </span>
                  )}
                </div>
                {item.confidence != null && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(item.confidence > 1 ? item.confidence : item.confidence * 100)}%
                    confidence
                  </span>
                )}
              </div>
              <p className="text-sm mb-2">
                {item.content ||
                  item.summary ||
                  item.extracted_text ||
                  JSON.stringify(item.metadata || {}).slice(0, 200)}
              </p>
              {item.entities_mentioned && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {(Array.isArray(item.entities_mentioned) ? item.entities_mentioned : []).map(
                    (e: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-iw-slate/10 text-iw-slate"
                      >
                        {e}
                      </span>
                    )
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => resolve(item.id, "approve")}
                  disabled={resolving === item.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-iw-forest-mid text-white hover:bg-iw-forest-mid disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => resolve(item.id, "reject")}
                  disabled={resolving === item.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-muted disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sessions List ── */
function SessionsList() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<any[]>("/api/v1/knowledge/sessions", {}, "Sessions");
        setSessions(Array.isArray(res) ? res : []);
      } catch {
        setSessions([]);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-6 space-y-3">
      {sessions.length === 0 ? (
        <Empty message="No AI sessions yet. Sessions appear when AI tools interact with your workspace." />
      ) : (
        sessions.map((s: any, i: number) => (
          <div key={s.id || i} className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-muted">
                {s.provider || "system"}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {s.ended_at ? new Date(s.ended_at).toLocaleString() : ""}
              </span>
            </div>
            <p className="text-sm font-medium">
              {s.title || (s.summary_md || "").split("\n")[0] || "Session"}
            </p>
            {s.topics?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {s.topics.map((t: string) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-iw-slate/10 text-iw-slate"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ── Topics List ── */
function TopicsList() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<any>("/api/v1/knowledge/topics", {}, "Topics");
        setTopics(Array.isArray(res) ? res : res.data || res.topics || []);
      } catch {
        setTopics([]);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-6 space-y-3">
      {topics.length === 0 ? (
        <Empty message="No topics yet. Topics are created as knowledge accumulates." />
      ) : (
        topics.map((t: any, i: number) => (
          <div
            key={t.id || i}
            className="p-4 border rounded-lg bg-card flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">{t.name || t.title || "Topic"}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {t.documentCount || t.count || 0} items
            </span>
          </div>
        ))
      )}
    </div>
  );
}

/* ── Knowledge Search ── */
function KnowledgeSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await apiFetch<any>(
        "/api/v1/knowledge/search",
        { method: "POST", body: { query } },
        "KnowledgeSearch"
      );
      setResults(Array.isArray(res) ? res : res.data || res.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [query]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search knowledge base..."
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r: any, i: number) => (
            <div key={r.id || i} className="p-3 border rounded-lg bg-card">
              <p className="text-sm font-medium">{r.title || "Result"}</p>
              {r.snippet && <p className="text-xs text-muted-foreground mt-1">{r.snippet}</p>}
              {r.score != null && (
                <span className="text-[10px] text-muted-foreground">
                  Relevance: {Math.round(r.score * 100)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Shared ── */
function Loading() {
  return (
    <div className="flex items-center justify-center h-32">
      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}
function Empty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Brain className="w-8 h-8 mb-3 opacity-30" />
      <p className="text-sm text-center max-w-sm">{message}</p>
    </div>
  );
}

export default KnowledgeHub;
