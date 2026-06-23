import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Info,
  XCircle,
  Shield,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LayerLeak {
  id: string;
  layerId: string;
  layerName: string;
  status: "danger" | "warning" | "info" | "success";
  detail: string;
  leak: string;
  prevention: string;
  source: string;
  target: string;
  timestamp: string;
  resolved: boolean;
}

const initialLeaks: LayerLeak[] = [
  {
    id: "leak-001",
    layerId: "L0",
    layerName: "Reality Layer",
    status: "warning",
    detail: "Webhook collision in Stripe events",
    leak: "Duplicate 'Subscription Updated' events at 09:12 UTC — two identical payloads processed within 200ms window.",
    prevention: "Deduplication buffer active. Idempotency key check pending human confirmation.",
    source: "Stripe Webhooks",
    target: "L1 Canonical Spine",
    timestamp: "2 min ago",
    resolved: false,
  },
  {
    id: "leak-002",
    layerId: "L0",
    layerName: "Reality Layer",
    status: "danger",
    detail: "Stale event pipeline",
    leak: "HubSpot contact sync lagging 47 minutes behind real-time. 23 contact updates queued but not ingested.",
    prevention: "Pipeline backpressure alert triggered. Retry mechanism requires approval.",
    source: "HubSpot API",
    target: "L1 Canonical Spine",
    timestamp: "8 min ago",
    resolved: false,
  },
  {
    id: "leak-003",
    layerId: "L1",
    layerName: "Truth Layer (Spine)",
    status: "success",
    detail: "Canonical mapping resolved",
    leak: "None. Entity #STR_992 uniquely mapped to 'Acme Corp' across Salesforce, Stripe, and Zendesk.",
    prevention: "ID-Spine validation passed all integrity checks.",
    source: "Multi-tool Entity Resolver",
    target: "L2 Intelligence",
    timestamp: "15 min ago",
    resolved: true,
  },
  {
    id: "leak-004",
    layerId: "L2",
    layerName: "Intelligence Layer",
    status: "danger",
    detail: "Schema Drift — ARR Miscalculation",
    leak: "ARR calculation leaking due to deprecated 'amount' field in Stripe API v2024.11. Affects 4 accounts: Prism Cloud, Stellar SaaS, NovaTech, InfraGroup.",
    prevention:
      "Edge correction suggested: Map to 'total_amount_minus_tax' field. Requires L2 approval before propagation.",
    source: "Stripe Schema v2024.11",
    target: "L3 Cognitive / NRR Models",
    timestamp: "24 min ago",
    resolved: false,
  },
  {
    id: "leak-005",
    layerId: "L2",
    layerName: "Intelligence Layer",
    status: "warning",
    detail: "Dual-context mismatch",
    leak: "Vendor CRM marks 'Prism Cloud' as Closed-Won, but Client Ticket system shows 3 critical P1 bugs unresolved. Confidence in renewal probability is inflated.",
    prevention:
      "Dual-context reconciliation required. AI suggests adjusting renewal propensity from 92% → 74%.",
    source: "Salesforce + Zendesk Cross-Reference",
    target: "L3 Cognitive / Renewal Model",
    timestamp: "31 min ago",
    resolved: false,
  },
  {
    id: "leak-006",
    layerId: "L3",
    layerName: "Cognitive Layer",
    status: "info",
    detail: "AI action gated for human review",
    leak: "AI agent proposed auto-adjustment of renewal probability for 'CyberNet' from 88% → 62% based on champion silence pattern. Blocked pending human audit.",
    prevention: "Human-in-the-loop gate enforced. No downstream side-effects until approved.",
    source: "L2 Intelligence Engine",
    target: "Work Surface (Slack, Salesforce)",
    timestamp: "45 min ago",
    resolved: false,
  },
];

interface LayerAuditProps {
  filterLayer?: string;
}

export function LayerAudit({ filterLayer }: LayerAuditProps) {
  const [leaks, setLeaks] = useState<LayerLeak[]>(initialLeaks);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const displayLeaks = filterLayer ? leaks.filter((l) => l.layerId === filterLayer) : leaks;

  const unresolvedCount = displayLeaks.filter(
    (l) => !l.resolved && (l.status === "danger" || l.status === "warning")
  ).length;
  const criticalCount = displayLeaks.filter((l) => !l.resolved && l.status === "danger").length;

  const handleResolve = (id: string) => {
    setLeaks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, resolved: true, status: "success" as const } : l))
    );
  };

  const handleDismiss = (id: string) => {
    setLeaks((prev) => prev.map((l) => (l.id === id ? { ...l, resolved: true } : l)));
  };

  const handleResolveAll = () => {
    setLeaks((prev) =>
      prev.map((l) => {
        if (filterLayer && l.layerId !== filterLayer) return l;
        return { ...l, resolved: true, status: "success" as const };
      })
    );
  };

  const handleReset = () => {
    setLeaks(initialLeaks);
    setExpandedId(null);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "danger":
        return <AlertTriangle size={14} className="text-red-500 animate-pulse" />;
      case "warning":
        return <AlertTriangle size={14} className="text-amber-500" />;
      case "info":
        return <Info size={14} className="text-blue-500" />;
      case "success":
        return <CheckCircle2 size={14} className="text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="text-[#b8943f]" size={20} />
          {filterLayer ? `${filterLayer} Leak Detection` : "Cross-Layer Leak Detection"}
        </h3>
        <div className="flex items-center gap-3">
          {unresolvedCount > 0 && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 animate-pulse">
              {criticalCount > 0 ? `${criticalCount} Critical` : `${unresolvedCount} Unresolved`}
            </span>
          )}
          {unresolvedCount === 0 && displayLeaks.length > 0 && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
              All Clear
            </span>
          )}
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Reset demo data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Layer Health Overview (only show when not filtered) */}
      {!filterLayer && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["L0", "L1", "L2", "L3"].map((layer) => {
            const layerLeaks = leaks.filter((l) => l.layerId === layer);
            const unresolved = layerLeaks.filter((l) => !l.resolved && l.status !== "success");
            const hasCritical = unresolved.some((l) => l.status === "danger");
            const hasWarning = unresolved.some((l) => l.status === "warning");

            return (
              <div
                key={layer}
                className={`p-3 rounded-xl border text-center cursor-default transition-all ${
                  hasCritical
                    ? "bg-red-50 border-red-200"
                    : hasWarning
                      ? "bg-amber-50 border-amber-200"
                      : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <div
                  className={`text-lg font-black ${
                    hasCritical
                      ? "text-red-600"
                      : hasWarning
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }`}
                >
                  {layer}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  {unresolved.length > 0
                    ? `${unresolved.length} leak${unresolved.length > 1 ? "s" : ""}`
                    : "Clean"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Data Flow Arrows (only show when not filtered) */}
      {!filterLayer && (
        <div className="hidden sm:flex items-center justify-center gap-1 py-2">
          {["L0 Reality", "→", "L1 Truth", "→", "L2 Intelligence", "→", "L3 Cognitive"].map(
            (label, i) => (
              <span
                key={i}
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  label === "→" ? "text-slate-300 text-lg" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            )
          )}
        </div>
      )}

      {/* Leak Cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {displayLeaks.map((leak, i) => (
            <motion.div
              key={leak.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              layout
              className={`rounded-2xl border overflow-hidden transition-all ${
                leak.resolved ? "opacity-60" : ""
              } ${
                leak.status === "danger"
                  ? "bg-red-50 border-red-100"
                  : leak.status === "warning"
                    ? "bg-amber-50 border-amber-100"
                    : leak.status === "info"
                      ? "bg-blue-50 border-blue-100"
                      : "bg-emerald-50 border-emerald-100"
              }`}
            >
              {/* Card Header */}
              <button
                className="w-full p-4 flex items-start justify-between text-left"
                onClick={() => setExpandedId(expandedId === leak.id ? null : leak.id)}
              >
                <div className="flex gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                      leak.status === "danger"
                        ? "bg-red-500 text-white shadow-lg shadow-red-200"
                        : leak.status === "warning"
                          ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                          : leak.status === "info"
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-200"
                            : "bg-emerald-500 text-white"
                    }`}
                  >
                    {leak.layerId}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{leak.detail}</span>
                      {statusIcon(leak.status)}
                      {leak.resolved && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-700 uppercase">
                          Resolved
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {leak.source} → {leak.target} · {leak.timestamp}
                    </div>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className={`text-slate-400 transition-transform mt-1 ${expandedId === leak.id ? "rotate-90" : ""}`}
                />
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {expandedId === leak.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <div className="p-3 bg-white/60 rounded-xl border border-white space-y-2">
                        <div className="flex items-start gap-2 text-xs">
                          <span className="font-bold text-slate-400 uppercase tracking-tighter shrink-0 w-12">
                            Leak:
                          </span>
                          <span className="text-slate-700">{leak.leak}</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs">
                          <span className="font-bold text-slate-400 uppercase tracking-tighter shrink-0 w-12">
                            Guard:
                          </span>
                          <span className="text-slate-700 font-medium">{leak.prevention}</span>
                        </div>
                      </div>
                      {!leak.resolved && leak.status !== "success" && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(leak.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors"
                          >
                            <CheckCircle2 size={14} /> Apply Correction
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(leak.id);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                          >
                            <XCircle size={14} /> Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Self-Learning Summary */}
      {unresolvedCount > 0 && (
        <div className="p-5 bg-[#1a3a2a] rounded-2xl text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Cpu size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm">Edge Correction Engine</h4>
              <p className="text-white/60 text-xs">Self-learning from human approvals</p>
            </div>
          </div>
          <p className="text-xs text-white/80 leading-relaxed mb-4">
            {criticalCount > 0
              ? `${criticalCount} critical leak${criticalCount > 1 ? "s" : ""} detected across the architecture. Each correction you approve trains the system to prevent similar leaks automatically.`
              : `${unresolvedCount} item${unresolvedCount > 1 ? "s" : ""} pending review. Approvals compound into the Edge Correction Library — your defensible intelligence moat.`}
          </p>
          <button
            onClick={handleResolveAll}
            className="w-full py-2.5 bg-[#b8943f] hover:bg-[#b8943f]/90 rounded-xl text-sm font-bold transition-all shadow-xl shadow-black/20"
          >
            Apply All {unresolvedCount} Corrections
          </button>
        </div>
      )}

      {unresolvedCount === 0 && displayLeaks.length > 0 && (
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
          <Shield size={32} className="text-emerald-500 mx-auto mb-3" />
          <h4 className="font-bold text-emerald-800 mb-1">All Layers Integrity Verified</h4>
          <p className="text-xs text-emerald-600">
            {leaks.filter((l) => l.resolved).length} corrections applied to the Edge Correction
            Library. The system is now smarter.
          </p>
        </div>
      )}
    </div>
  );
}
