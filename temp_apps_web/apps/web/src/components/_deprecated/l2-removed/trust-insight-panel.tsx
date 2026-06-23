/**
 * Trust Insight Panel
 *
 * Shows "why this insight" with:
 * - Source flow visualization (A/B/C)
 * - Confidence breakdown per evidence layer
 * - What changed + data freshness
 * - Action recommendation with risk assessment
 */

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Database,
  MessageSquare,
  Brain,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TwinInsight {
  id: string;
  trigger_id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  what: string;
  why: string;
  action: string;
  risk_if_ignored: string;
  evidence: Array<{
    layer: "truth" | "context" | "signals" | "memory" | "goals";
    description: string;
    value?: unknown;
    source?: string;
  }>;
  confidence: number;
  source_layers: string[];
  created_at: string;
}

interface TrustInsightPanelProps {
  insight: TwinInsight;
  onDismiss?: () => void;
  onAct?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function TrustInsightPanel({ insight, onDismiss, onAct }: TrustInsightPanelProps) {
  const [expanded, setExpanded] = React.useState(false);

  const severityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    high: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
    medium:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
    low: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    info: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  };

  const layerIcons: Record<string, React.ElementType> = {
    truth: Database,
    context: MessageSquare,
    signals: Zap,
    memory: Brain,
    goals: Target,
  };

  const layerLabels: Record<string, string> = {
    truth: "Spine (Structured Data)",
    context: "Context (Emails, Docs)",
    signals: "Signals (Alerts)",
    memory: "Memory (AI Knowledge)",
    goals: "Goals & Outcomes",
  };

  const confidencePct = Math.round(insight.confidence * 100);

  return (
    <div className={`border rounded-lg overflow-hidden ${severityColors[insight.severity]}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <p className="text-xs opacity-75 mt-0.5">
                {new Date(insight.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                confidencePct >= 80
                  ? "bg-green-200 text-green-800"
                  : confidencePct >= 60
                    ? "bg-yellow-200 text-yellow-800"
                    : "bg-red-200 text-red-800"
              }`}
            >
              {confidencePct}%
            </span>
            <span className="text-xs font-medium uppercase px-2 py-0.5 rounded-full bg-white/50">
              {insight.severity}
            </span>
          </div>
        </div>

        {/* What happened */}
        <div className="mt-3 space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase opacity-60">What happened</p>
            <p className="text-sm">{insight.what}</p>
          </div>
        </div>
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium bg-black/5 hover:bg-black/10 transition-colors"
        aria-label={expanded ? "Collapse details" : "Expand details"}
      >
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Why this insight · {insight.evidence.length} evidence sources
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4 bg-white/50 dark:bg-black/20">
          {/* Why it matters */}
          <div>
            <p className="text-xs font-semibold uppercase opacity-60 mb-1">Why it matters</p>
            <p className="text-sm">{insight.why}</p>
          </div>

          {/* Source layers */}
          <div>
            <p className="text-xs font-semibold uppercase opacity-60 mb-2">Data sources</p>
            <div className="flex flex-wrap gap-1.5">
              {insight.source_layers.map((layer) => {
                const Icon = layerIcons[layer] || Database;
                return (
                  <span
                    key={layer}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/70 dark:bg-white/10 border"
                  >
                    <Icon className="h-3 w-3" />
                    {layerLabels[layer] || layer}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Evidence chain */}
          <div>
            <p className="text-xs font-semibold uppercase opacity-60 mb-2">Evidence</p>
            <div className="space-y-1.5">
              {insight.evidence.map((ev, i) => {
                const Icon = layerIcons[ev.layer] || FileText;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs p-2 rounded bg-white/50 dark:bg-white/5 border"
                  >
                    <Icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-60" />
                    <div>
                      <span className="font-medium">{ev.description}</span>
                      {ev.source && <span className="opacity-50 ml-1">via {ev.source}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confidence breakdown */}
          <div>
            <p className="text-xs font-semibold uppercase opacity-60 mb-2">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    confidencePct >= 80
                      ? "bg-green-500"
                      : confidencePct >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
              <span className="text-xs font-bold">{confidencePct}%</span>
            </div>
            <p className="text-xs opacity-50 mt-1">
              Based on {insight.evidence.length} evidence items across{" "}
              {insight.source_layers.length} data layers
            </p>
          </div>

          {/* Risk if ignored */}
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                  Risk if ignored
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  {insight.risk_if_ignored}
                </p>
              </div>
            </div>
          </div>

          {/* Recommended action */}
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              {insight.confidence >= 0.7 ? (
                <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <TrendingDown className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                  Recommended action
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  {insight.action}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {onAct && (
              <button
                onClick={onAct}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Take Action
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-2 text-xs font-medium rounded-lg border hover:bg-black/5 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrustInsightPanel;
