/**
 * Triage Inbox Panel — Flow C customer review surface
 *
 * Shows pending triage items extracted by the Triage Bot from AI conversations.
 * Customer can: Approve (→ memory), Discard (→ gone), Defer (→ review later).
 * This is the gate between raw AI extractions and the No-Hallucination Space.
 */
import { useState, useEffect, useCallback } from "react";
import {
  Inbox,
  Check,
  X,
  Clock,
  Brain,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface TriageItem {
  id: string;
  content: string;
  priority: "high" | "medium" | "low";
  category: string;
  confidence: number;
  reasoning: string;
  sentiment: "positive" | "neutral" | "negative";
  metadata: {
    tenant_id: string;
    memory_type: string;
    conversation_id?: string;
  };
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

const SENTIMENT_ICONS: Record<string, string> = {
  positive: "🟢",
  neutral: "🔵",
  negative: "🔴",
};

const TYPE_LABELS: Record<string, string> = {
  insight: "💡 Insight",
  fact: "📌 Fact",
  decision: "⚖️ Decision",
  action_item: "✅ Action Item",
  preference: "⭐ Preference",
  relationship: "🔗 Relationship",
};

export function TriageInboxPanel() {
  const [items, setItems] = useState<TriageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: TriageItem[] }>(
        "/api/v1/knowledge/inbox",
        {},
        "TriageInbox"
      );
      setItems(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load triage items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAction = useCallback(async (id: string, action: "approve" | "discard" | "defer") => {
    setActionLoading(id);
    try {
      await apiFetch(
        `/api/v1/knowledge/triage/${id}`,
        {
          method: "PATCH",
          body: { action, reason: `User ${action}d from Triage Inbox` },
        },
        `TriageAction(${action})`
      );
      // Remove from list on approve/discard, keep on defer
      if (action !== "defer") {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${action} item`);
    } finally {
      setActionLoading(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
          <Inbox className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No pending items</p>
        <p className="text-xs text-muted-foreground max-w-[240px]">
          Knowledge extracted from AI conversations will appear here for your review
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Triage Inbox</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {items.length}
          </span>
        </div>
      </div>

      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const isActioning = actionLoading === item.id;
        const typeLabel = TYPE_LABELS[item.metadata?.memory_type] || "📝 Note";

        return (
          <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="w-full flex items-start gap-3 p-3 hover:bg-secondary/30 transition-colors text-left"
            >
              <div className="shrink-0 mt-0.5">
                <span className="text-sm">{SENTIMENT_ICONS[item.sentiment] || "🔵"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium">{typeLabel}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[item.priority]}`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
                <p className="text-sm line-clamp-2">{item.content}</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-border px-3 py-3 space-y-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Why extracted:</span> {item.reasoning}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Category: {item.category} · Extracted:{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(item.id, "approve")}
                    disabled={isActioning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    {isActioning ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "discard")}
                    disabled={isActioning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                    Discard
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "defer")}
                    disabled={isActioning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                  >
                    <Clock className="w-3 h-3" />
                    Later
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
