/**
 * Connector Discovery Session
 *
 * Triggered immediately after a connector establishes (OAuth complete).
 * Twin runs a discovery session: identifies entity types, extracts fields,
 * tags PII, suggests harmonization groups, generates schema drafts.
 *
 * The human confirms or adjusts mappings before schemas are proposed.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, CheckCircle2, AlertTriangle, GitBranch, Database,
  Shield, Eye, ChevronRight, Loader2, Check, X, Edit2,
  Users, DollarSign, Building2, MessageSquare, FileText,
  Activity, ArrowRight, Zap
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DiscoveryPhase =
  | "connecting"
  | "scanning"
  | "extracting"
  | "harmonizing"
  | "reviewing"
  | "complete";

interface DiscoveredField {
  name: string;
  canonicalName: string;
  type: "string" | "number" | "boolean" | "date" | "enum" | "object";
  pii: boolean;
  confidence: number;
}

interface DiscoveredEntity {
  id: string;
  rawName: string;          // e.g. "opportunity"
  canonicalName: string;    // e.g. "deal"
  harmonizationGroup: string;
  icon: any;
  fieldCount: number;
  fields: DiscoveredField[];
  confidence: number;
  piiCount: number;
  sampleCount: number;
  accepted: boolean | null; // null = not yet decided
  customMapping?: string;
}

interface ConnectorDiscoveryProps {
  connectorName: string;
  connectorEmoji: string;
  onComplete: (entities: DiscoveredEntity[]) => void;
  onDismiss: () => void;
}

// ─── Mock discovery data per connector ───────────────────────────────────────

const CONNECTOR_ENTITIES: Record<string, DiscoveredEntity[]> = {
  github: [
    {
      id: "gh-pr", rawName: "pull_request", canonicalName: "activity", harmonizationGroup: "activity",
      icon: Activity, fieldCount: 17, confidence: 0.93, piiCount: 1, sampleCount: 340, accepted: null,
      fields: [
        { name: "title", canonicalName: "subject", type: "string", pii: false, confidence: 0.99 },
        { name: "author.login", canonicalName: "actor.username", type: "string", pii: true, confidence: 0.91 },
        { name: "merged_at", canonicalName: "resolved_at", type: "date", pii: false, confidence: 0.97 },
        { name: "base.ref", canonicalName: "target_branch", type: "string", pii: false, confidence: 0.88 },
      ],
    },
    {
      id: "gh-issue", rawName: "issue", canonicalName: "task", harmonizationGroup: "activity",
      icon: Activity, fieldCount: 14, confidence: 0.89, piiCount: 1, sampleCount: 892, accepted: null,
      fields: [
        { name: "title", canonicalName: "subject", type: "string", pii: false, confidence: 0.99 },
        { name: "assignee.login", canonicalName: "assignee.username", type: "string", pii: true, confidence: 0.88 },
        { name: "labels", canonicalName: "tags", type: "enum", pii: false, confidence: 0.92 },
        { name: "milestone.title", canonicalName: "project.name", type: "string", pii: false, confidence: 0.84 },
      ],
    },
    {
      id: "gh-repo", rawName: "repository", canonicalName: "project", harmonizationGroup: "document",
      icon: FileText, fieldCount: 9, confidence: 0.96, piiCount: 0, sampleCount: 12, accepted: null,
      fields: [
        { name: "name", canonicalName: "title", type: "string", pii: false, confidence: 0.99 },
        { name: "description", canonicalName: "summary", type: "string", pii: false, confidence: 0.95 },
        { name: "stargazers_count", canonicalName: "engagement_score", type: "number", pii: false, confidence: 0.72 },
      ],
    },
  ],
  notion: [
    {
      id: "nt-page", rawName: "page", canonicalName: "document", harmonizationGroup: "document",
      icon: FileText, fieldCount: 9, confidence: 0.76, piiCount: 0, sampleCount: 247, accepted: null,
      fields: [
        { name: "title", canonicalName: "title", type: "string", pii: false, confidence: 0.99 },
        { name: "created_by.id", canonicalName: "author.id", type: "string", pii: true, confidence: 0.95 },
        { name: "properties.Status.select.name", canonicalName: "status", type: "enum", pii: false, confidence: 0.71 },
      ],
    },
    {
      id: "nt-db", rawName: "database", canonicalName: "project", harmonizationGroup: "document",
      icon: Database, fieldCount: 6, confidence: 0.82, piiCount: 0, sampleCount: 18, accepted: null,
      fields: [
        { name: "title", canonicalName: "title", type: "string", pii: false, confidence: 0.99 },
        { name: "description", canonicalName: "summary", type: "string", pii: false, confidence: 0.89 },
      ],
    },
  ],
  stripe: [
    {
      id: "st-invoice", rawName: "invoice", canonicalName: "invoice", harmonizationGroup: "deal",
      icon: DollarSign, fieldCount: 14, confidence: 0.97, piiCount: 2, sampleCount: 1240, accepted: null,
      fields: [
        { name: "amount_due", canonicalName: "value", type: "number", pii: false, confidence: 0.99 },
        { name: "customer.email", canonicalName: "contact.email", type: "string", pii: true, confidence: 0.99 },
        { name: "status", canonicalName: "payment_status", type: "enum", pii: false, confidence: 0.97 },
        { name: "period_end", canonicalName: "due_date", type: "date", pii: false, confidence: 0.94 },
      ],
    },
    {
      id: "st-sub", rawName: "subscription", canonicalName: "deal", harmonizationGroup: "deal",
      icon: DollarSign, fieldCount: 11, confidence: 0.95, piiCount: 1, sampleCount: 423, accepted: null,
      fields: [
        { name: "plan.nickname", canonicalName: "plan_name", type: "string", pii: false, confidence: 0.91 },
        { name: "current_period_end", canonicalName: "renewal_date", type: "date", pii: false, confidence: 0.98 },
        { name: "status", canonicalName: "subscription_status", type: "enum", pii: false, confidence: 0.99 },
      ],
    },
  ],
};

const HARMONIZATION_ICONS: Record<string, any> = {
  person: Users, deal: DollarSign, company: Building2,
  activity: Activity, document: FileText,
};

const PHASE_LABELS: Record<DiscoveryPhase, string> = {
  connecting:  "Establishing connection…",
  scanning:    "Scanning API surface…",
  extracting:  "Extracting entity types and fields…",
  harmonizing: "Mapping to canonical Spine schema…",
  reviewing:   "Review entity mappings",
  complete:    "Discovery complete",
};

const PHASE_STEPS: DiscoveryPhase[] = ["connecting", "scanning", "extracting", "harmonizing", "reviewing"];

// ─── Field row ────────────────────────────────────────────────────────────────

function FieldRow({ field }: { field: DiscoveredField }) {
  const typeColor: Record<string, string> = {
    string: "var(--iw-blue)", number: "var(--iw-success)", boolean: "var(--iw-purple)",
    date: "var(--iw-warning)", enum: "var(--iw-pink)", object: "var(--muted-foreground)",
  };
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[10px] font-mono w-36 shrink-0 truncate" style={{ color: "var(--muted-foreground)" }}>
        {field.name}
      </span>
      <ArrowRight className="w-3 h-3 shrink-0" style={{ color: "var(--border)" }} />
      <span className="text-[10px] font-mono flex-1 truncate" style={{ color: "var(--foreground)", fontWeight: 500 }}>
        {field.canonicalName}
      </span>
      <span className="text-[8px] px-1 py-0.5 rounded font-mono shrink-0"
        style={{ background: `${typeColor[field.type]}15`, color: typeColor[field.type], fontWeight: 700 }}>
        {field.type}
      </span>
      {field.pii && (
        <span className="text-[8px] px-1 py-0.5 rounded font-bold shrink-0"
          style={{ background: "rgba(220,74,74,0.12)", color: "var(--iw-danger)" }}>
          PII
        </span>
      )}
      <div className="w-8 h-1 rounded-full shrink-0" style={{ background: "var(--secondary)" }}>
        <div className="h-full rounded-full" style={{ width: `${field.confidence * 100}%`, background: "var(--iw-success)" }} />
      </div>
    </div>
  );
}

// ─── Entity card ─────────────────────────────────────────────────────────────

function EntityCard({
  entity, expanded, onToggle, onAccept, onReject,
}: {
  entity: DiscoveredEntity;
  expanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const HIcon = HARMONIZATION_ICONS[entity.harmonizationGroup] || Database;
  const confColor = entity.confidence >= 0.9 ? "var(--iw-success)" : entity.confidence >= 0.75 ? "var(--iw-warning)" : "var(--iw-danger)";

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${entity.accepted === true ? "rgba(61,139,110,0.3)" : entity.accepted === false ? "rgba(220,74,74,0.2)" : "var(--border)"}`,
        background: entity.accepted === false ? "rgba(220,74,74,0.03)" : "var(--card)",
        opacity: entity.accepted === false ? 0.6 : 1,
      }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        style={{ background: "var(--secondary)", borderBottom: expanded ? "1px solid var(--border)" : "none" }}
        onClick={onToggle}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${confColor}15` }}>
          <HIcon className="w-3.5 h-3.5" style={{ color: confColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ fontWeight: 600, color: "var(--foreground)" }}>
              .{entity.rawName}
            </span>
            <ArrowRight className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
            <span className="text-xs" style={{ fontWeight: 700, color: "var(--iw-blue)" }}>
              {entity.canonicalName}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(66,86,171,0.1)", color: "var(--iw-blue)", fontWeight: 700 }}>
              {entity.harmonizationGroup}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
            <span>{entity.fieldCount} fields</span>
            <span>·</span>
            <span>{entity.sampleCount.toLocaleString()} samples</span>
            {entity.piiCount > 0 && (
              <><span>·</span>
              <span style={{ color: "var(--iw-danger)", fontWeight: 700 }}>
                {entity.piiCount} PII field{entity.piiCount > 1 ? "s" : ""}
              </span></>
            )}
          </div>
        </div>

        {/* Confidence */}
        <div className="text-center shrink-0">
          <div className="text-sm" style={{ fontWeight: 700, color: confColor }}>
            {(entity.confidence * 100).toFixed(0)}%
          </div>
          <div className="text-[8px]" style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>confidence</div>
        </div>

        {/* Accept / Reject */}
        {entity.accepted === null && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={e => { e.stopPropagation(); onReject(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--iw-danger)"; (e.currentTarget as HTMLElement).style.color = "var(--iw-danger)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
              <X className="w-3.5 h-3.5" style={{ color: "inherit" }} />
            </button>
            <button onClick={e => { e.stopPropagation(); onAccept(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "var(--iw-success)", border: "1px solid var(--iw-success)" }}>
              <Check className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}
        {entity.accepted === true && (
          <div className="flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-4 h-4" style={{ color: "var(--iw-success)" }} />
            <span className="text-[10px]" style={{ color: "var(--iw-success)", fontWeight: 700 }}>Accepted</span>
          </div>
        )}
        {entity.accepted === false && (
          <div className="flex items-center gap-1 shrink-0">
            <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Skipped</span>
          </div>
        )}

        <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform"
          style={{ color: "var(--muted-foreground)", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
      </div>

      {/* Expanded field list */}
      {expanded && (
        <div className="px-4 py-3">
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
            Field mapping preview ({entity.fields.length} of {entity.fieldCount} shown)
          </p>
          {entity.piiCount > 0 && (
            <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg"
              style={{ background: "rgba(220,74,74,0.07)", border: "1px solid rgba(220,74,74,0.2)" }}>
              <Shield className="w-3 h-3" style={{ color: "var(--iw-danger)" }} />
              <span className="text-[10px]" style={{ color: "var(--iw-danger)", fontWeight: 600 }}>
                PII detected — will be tagged pii_classification: "personal_data" in schema
              </span>
            </div>
          )}
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {entity.fields.map((f, i) => <FieldRow key={i} field={f} />)}
          </div>
          {entity.fieldCount > entity.fields.length && (
            <p className="text-[9px] mt-2" style={{ color: "var(--muted-foreground)" }}>
              +{entity.fieldCount - entity.fields.length} more fields in full schema
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ConnectorDiscovery({ connectorName, connectorEmoji, onComplete, onDismiss }: ConnectorDiscoveryProps) {
  const [phase, setPhase] = useState<DiscoveryPhase>("connecting");
  const [entities, setEntities] = useState<DiscoveredEntity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const rawEntities = CONNECTOR_ENTITIES[connectorName] || CONNECTOR_ENTITIES.github;

  // Simulate discovery phases
  useEffect(() => {
    const phases: { phase: DiscoveryPhase; delay: number }[] = [
      { phase: "scanning",    delay: 900 },
      { phase: "extracting",  delay: 1800 },
      { phase: "harmonizing", delay: 3000 },
      { phase: "reviewing",   delay: 4200 },
    ];
    const timers = phases.map(({ phase: p, delay }) =>
      setTimeout(() => {
        setPhase(p);
        if (p === "extracting") {
          // Reveal entities progressively
          rawEntities.forEach((e, i) => {
            setTimeout(() => setEntities(prev => [...prev, e]), i * 400);
          });
        }
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const acceptEntity  = (id: string) => setEntities(prev => prev.map(e => e.id === id ? { ...e, accepted: true } : e));
  const rejectEntity  = (id: string) => setEntities(prev => prev.map(e => e.id === id ? { ...e, accepted: false } : e));
  const acceptedCount = entities.filter(e => e.accepted === true).length;
  const pendingCount  = entities.filter(e => e.accepted === null).length;
  const allDecided    = entities.length > 0 && pendingCount === 0;

  const handleComplete = () => {
    setPhase("complete");
    setTimeout(() => onComplete(entities.filter(e => e.accepted === true)), 600);
  };

  const phaseIndex = PHASE_STEPS.indexOf(phase);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 240 }}
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--card)", border: "1px solid var(--border)", maxHeight: "85vh", boxShadow: "0 24px 64px rgba(0,0,0,0.24)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ background: "var(--iw-blue-900)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            {connectorEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white" style={{ fontWeight: 700 }}>Discovery Session</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse"
                style={{ background: "rgba(61,139,110,0.25)", color: "var(--iw-success)" }}>
                {phase === "reviewing" || phase === "complete" ? "Review" : "LIVE"}
              </span>
            </div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              {connectorName} · {PHASE_LABELS[phase]} · {elapsed}s
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4" style={{ color: "var(--iw-pink)" }} />
            <span className="text-[10px] text-white" style={{ fontWeight: 600 }}>Schema AI</span>
          </div>
        </div>

        {/* Phase progress strip */}
        <div className="flex items-center px-5 py-2.5 gap-1 shrink-0"
          style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
          {PHASE_STEPS.map((p, i) => (
            <div key={p} className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: i < phaseIndex ? "var(--iw-success)" : i === phaseIndex ? "var(--iw-blue)" : "var(--muted)",
                  }}>
                  {i < phaseIndex
                    ? <Check className="w-2.5 h-2.5 text-white" />
                    : i === phaseIndex
                      ? <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                      : <span className="text-[8px] text-white">{i + 1}</span>}
                </div>
                <span className="text-[9px] truncate hidden sm:block"
                  style={{ color: i <= phaseIndex ? "var(--foreground)" : "var(--muted-foreground)", fontWeight: i === phaseIndex ? 700 : 400 }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </span>
              </div>
              {i < PHASE_STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1"
                  style={{ background: i < phaseIndex ? "var(--iw-success)" : "var(--border)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* Pre-review phases */}
          {phase !== "reviewing" && phase !== "complete" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "rgba(66,86,171,0.07)", border: "1px solid rgba(66,86,171,0.2)" }}>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "var(--iw-blue)" }} />
                <p className="text-sm" style={{ color: "var(--iw-blue)", fontWeight: 500 }}>
                  {PHASE_LABELS[phase]}
                </p>
              </div>

              <AnimatePresence>
                {entities.map(entity => (
                  <motion.div
                    key={entity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--iw-success)" }} />
                    <span className="text-xs font-mono" style={{ color: "var(--foreground)", fontWeight: 600 }}>
                      .{entity.rawName}
                    </span>
                    <ArrowRight className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                    <span className="text-xs" style={{ color: "var(--iw-blue)", fontWeight: 700 }}>{entity.canonicalName}</span>
                    <span className="text-[9px] ml-auto" style={{ color: "var(--muted-foreground)" }}>
                      {entity.fieldCount} fields · conf {(entity.confidence * 100).toFixed(0)}%
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Review phase */}
          {phase === "reviewing" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>
                    Confirm entity mappings
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    Schema AI found {entities.length} entity type{entities.length !== 1 ? "s" : ""}. Accept to add to Spine schema pool.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs" style={{ fontWeight: 700, color: "var(--iw-success)" }}>{acceptedCount} accepted</div>
                  <div className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{pendingCount} pending</div>
                </div>
              </div>

              {entities.map(entity => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  expanded={expandedId === entity.id}
                  onToggle={() => setExpandedId(expandedId === entity.id ? null : entity.id)}
                  onAccept={() => acceptEntity(entity.id)}
                  onReject={() => rejectEntity(entity.id)}
                />
              ))}
            </div>
          )}

          {/* Complete state */}
          {phase === "complete" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: "rgba(61,139,110,0.12)", border: "1px solid rgba(61,139,110,0.3)" }}>
                <CheckCircle2 className="w-7 h-7" style={{ color: "var(--iw-success)" }} />
              </div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Discovery complete</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                {acceptedCount} schema{acceptedCount !== 1 ? "s" : ""} proposed → moving to Schema Registry for activation
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        {phase === "reviewing" && (
          <div className="flex items-center gap-3 px-5 py-3 shrink-0"
            style={{ borderTop: "1px solid var(--border)", background: "var(--secondary)" }}>
            <button onClick={onDismiss}
              className="px-4 py-2 rounded-xl text-xs transition-all"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>
              Skip for now
            </button>
            <div className="flex-1 min-w-0">
              {pendingCount > 0 && (
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  Accept or skip {pendingCount} remaining entit{pendingCount !== 1 ? "ies" : "y"} to continue
                </p>
              )}
            </div>
            <button
              onClick={handleComplete}
              disabled={!allDecided}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs transition-all"
              style={{
                background: allDecided ? "var(--iw-blue)" : "var(--muted)",
                color: allDecided ? "white" : "var(--muted-foreground)",
                fontWeight: 700,
                cursor: allDecided ? "pointer" : "not-allowed",
              }}>
              <Zap className="w-3.5 h-3.5" />
              Propose {acceptedCount} schema{acceptedCount !== 1 ? "s" : ""} to Spine
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
