/**
 * EntityTwinPanel — Twin as contextual companion, not a chatbot
 *
 * Twin appears on the entity the user is looking at.
 * Same context. Same Spine data. Twin doesn't drift.
 *
 * When connectors are wired:
 *   - Every signal cites its data source
 *   - Confidence is shown, not hidden
 *   - One recommendation, actionable, not generic advice
 *   - The user approves before anything executes
 *
 * When no Spine data is available:
 *   - Twin says so clearly — no speculation
 *   - Shows which connector would unlock this read
 */

import { useState } from "react";
import { Brain, Check, MessageSquare, X, ChevronDown, ChevronRight, Plug } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TwinSignalWeight = "critical" | "warning" | "info";

export interface TwinSignal {
  text: string;
  source: string;
  weight: TwinSignalWeight;
}

export interface TwinRead {
  signals: TwinSignal[];
  recommendation: string;
  confidence: number;
  sources: string[];
  grounding: string;
}

// ─── No-data read — shown when Spine has no context on this entity ────────────

function getEmptyRead(entityType: string, entityName: string): TwinRead {
  const connectorHint: Record<string, string> = {
    risk:      "Salesforce + Zendesk",
    expansion: "Product Analytics + CRM",
    contact:   "CRM + Email",
    meeting:   "Calendar + CRM",
    deal:      "CRM + Gong",
    project:   "Jira or Linear",
  };
  return {
    signals: [],
    recommendation: "",
    confidence: 0,
    sources: [],
    grounding: connectorHint[entityType] ?? "a connector",
  };
}

// ─── Signal dot ───────────────────────────────────────────────────────────────

function SignalDot({ weight }: { weight: TwinSignalWeight }) {
  const color = weight === "critical" ? "var(--iw-danger)"
    : weight === "warning" ? "var(--iw-warning)"
    : "var(--iw-blue)";
  return <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: color }} />;
}

// ─── EntityTwinPanel ──────────────────────────────────────────────────────────

interface EntityTwinPanelProps {
  entityType: "risk" | "expansion" | "contact" | "meeting" | "deal" | "project";
  entityKey: string;
  entityName: string;
  /** Pass a live read from Spine/agent layer when wired */
  liveRead?: TwinRead;
  onAskTwin?: () => void;
  onAccept?: (recommendation: string) => void;
  onDismiss?: () => void;
}

export function EntityTwinPanel({
  entityType, entityKey, entityName, liveRead, onAskTwin, onAccept, onDismiss
}: EntityTwinPanelProps) {
  const [accepted, setAccepted] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const read = liveRead ?? getEmptyRead(entityType, entityName);
  const hasData = read.confidence > 0 && read.signals.length > 0;

  const handleAccept = () => {
    setAccepted(true);
    onAccept?.(read.recommendation);
  };

  if (accepted) {
    return (
      <div className="rounded-xl p-3 flex items-center gap-2.5"
        style={{ background: "var(--iw-success-light)", border: "1px solid var(--iw-success)" }}>
        <Check className="w-4 h-4 shrink-0" style={{ color: "var(--iw-success)" }} />
        <p className="text-xs" style={{ color: "var(--iw-success)", fontWeight: 600 }}>
          Logged to your Bench. Twin will track progress.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)", borderLeft: "3px solid var(--iw-purple)" }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: "var(--iw-purple-light)" }}>
        <Brain className="w-3.5 h-3.5" style={{ color: "var(--iw-purple)" }} />
        <span className="text-[11px]" style={{ color: "var(--iw-purple)", fontWeight: 700 }}>
          Twin's read
        </span>
        {hasData && (
          <span className="ml-auto text-[8px] px-2 py-0.5 rounded-full font-mono"
            style={{ background: "var(--iw-purple)", color: "#fff", fontWeight: 700 }}>
            {read.confidence}% confidence
          </span>
        )}
      </div>

      <div className="p-3 space-y-2.5" style={{ background: "var(--card)" }}>

        {/* No data state */}
        {!hasData && (
          <div className="flex items-start gap-2.5 py-1">
            <Plug className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--muted-foreground)" }} />
            <div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Twin has no Spine data for <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{entityName}</span> yet.
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                Connect <span style={{ fontWeight: 600 }}>{read.grounding}</span> in Ingress to unlock Twin's contextual read.
              </p>
            </div>
          </div>
        )}

        {/* Live signals */}
        {hasData && (
          <>
            <div className="space-y-2">
              {read.signals.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <SignalDot weight={s.weight} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--foreground)" }}>{s.text}</p>
                    <p className="text-[9px] font-mono mt-0.5" style={{ color: "var(--muted-foreground)" }}>via {s.source}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            {read.recommendation && (
              <div className="rounded-lg p-2.5"
                style={{ background: "var(--iw-purple-light)", border: "1px solid rgba(123,94,167,0.18)" }}>
                <p className="text-[8px] uppercase tracking-widest mb-1"
                  style={{ color: "var(--iw-purple)", fontWeight: 800 }}>Recommended</p>
                <p className="text-[11px] leading-relaxed"
                  style={{ color: "var(--foreground)", fontWeight: 500 }}>{read.recommendation}</p>
              </div>
            )}

            {/* Grounding */}
            <button onClick={() => setSourcesOpen(v => !v)}
              className="flex items-center gap-1.5 w-full text-left">
              <p className="text-[9px] leading-relaxed flex-1" style={{ color: "var(--muted-foreground)" }}>
                {read.grounding}
              </p>
              {sourcesOpen
                ? <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
                : <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />}
            </button>
            {sourcesOpen && (
              <div className="flex flex-wrap gap-1">
                {read.sources.map(s => (
                  <span key={s} className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                    style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
          {hasData && (
            <button onClick={handleAccept}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-white"
              style={{ background: "var(--iw-purple)", fontWeight: 700 }}>
              <Check className="w-3 h-3" /> Accept & act
            </button>
          )}
          {onAskTwin && (
            <button onClick={onAskTwin}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px]"
              style={{ background: "var(--secondary)", color: "var(--foreground)", fontWeight: 600 }}>
              <MessageSquare className="w-3 h-3" /> Ask Twin
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="ml-auto p-1 rounded"
              style={{ color: "var(--muted-foreground)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TwinSignalStrip — compact variant for list rows ─────────────────────────

export function TwinSignalStrip({
  entityType, entityKey, entityName, liveRead
}: { entityType: string; entityKey: string; entityName: string; liveRead?: TwinRead }) {
  if (!liveRead || liveRead.confidence === 0 || liveRead.signals.length === 0) return null;

  const topSignal = liveRead.signals[0];
  const dotColor = topSignal.weight === "critical" ? "var(--iw-danger)"
    : topSignal.weight === "warning" ? "var(--iw-warning)"
    : "var(--iw-blue)";

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Brain className="w-2.5 h-2.5 shrink-0" style={{ color: "var(--iw-purple)" }} />
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
      <p className="text-[9px] leading-tight line-clamp-1" style={{ color: "var(--muted-foreground)" }}>
        {topSignal.text}
      </p>
    </div>
  );
}
