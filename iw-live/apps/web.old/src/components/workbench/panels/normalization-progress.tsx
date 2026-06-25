"use client";

/**
 * Normalization Progress — 8-Stage Pipeline Visualization
 *
 * Shows S1 → S8 pipeline status with record counts per stage.
 * Highlights quarantined records and active stages.
 * Additive SDAI surface — does not modify existing architecture.
 */

import { usePipelineStageSummary } from "@/hooks/use-sdai-pipeline";
import { CheckCircle2, Circle, AlertTriangle, Loader2 } from "lucide-react";

const STAGE_META = [
  { stage: "S1", label: "Analyze", description: "Detect entity type, resolve schema" },
  { stage: "S2", label: "Classify", description: "Assign priority" },
  { stage: "S3", label: "Filter", description: "Reject if not in tenant schema" },
  { stage: "S4", label: "Refine", description: "Normalize field names to canonical" },
  { stage: "S5", label: "Extract", description: "Keep only schema-allowed fields" },
  { stage: "S6", label: "Validate", description: "Type checks, required fields" },
  { stage: "S7", label: "Sanity", description: "Business rules, score ≥ 70" },
  { stage: "S7.5", label: "Identity", description: "Cross-source duplicate detection" },
  { stage: "S8", label: "Sectorize", description: "Route to department table, write to Spine" },
];

export function NormalizationProgress() {
  const { stages, checkpoints } = usePipelineStageSummary();
  const hasActiveSync = checkpoints?.some((cp) => cp.status === "in_progress");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[13px] font-bold text-[#0e1410]">8-Stage Pipeline</h4>
          <p className="text-[11px] text-[#8a8580]">Schema-Driven AI Integration</p>
        </div>
        {hasActiveSync && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2d5a3d]/10">
            <Loader2 className="w-3 h-3 text-[#2d5a3d] animate-spin" />
            <span className="text-[10px] font-semibold text-[#2d5a3d]">Active</span>
          </div>
        )}
      </div>

      {/* Pipeline stages */}
      <div className="space-y-2">
        {STAGE_META.map((meta, i) => {
          const live = stages.find((s) => s.stage === meta.stage);
          const status = live?.status || "idle";
          const isComplete = status === "complete";
          const isActive = status === "active";
          const isError = status === "error";
          const recordsIn = live?.records_in || 0;
          const recordsOut = live?.records_out || 0;
          const quarantined = live?.records_quarantined || 0;

          return (
            <div
              key={meta.stage}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isActive
                  ? "border-[#2d5a3d]/30 bg-[#2d5a3d]/5"
                  : isError
                    ? "border-[#c79f4a]/20 bg-[#c79f4a]/5"
                    : isComplete
                      ? "border-[#3d7a50]/20 bg-[#3d7a50]/5"
                      : "border-[#ebe5d8] bg-white"
              }`}
            >
              {/* Stage indicator */}
              <div className="shrink-0">
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-[#3d7a50]" />
                ) : isError ? (
                  <AlertTriangle className="w-5 h-5 text-[#c79f4a]" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-[#2d5a3d] animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-[#d8d0c0]" />
                )}
              </div>

              {/* Stage info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#0e1410] w-8">{meta.stage}</span>
                  <span className="text-[12px] font-semibold text-[#0e1410]">{meta.label}</span>
                </div>
                <div className="text-[10px] text-[#8a8580] ml-10">{meta.description}</div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-3 shrink-0">
                {recordsIn > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] text-[#8a8580]">In</div>
                    <div className="text-[11px] font-semibold text-[#0e1410]">
                      {recordsIn.toLocaleString()}
                    </div>
                  </div>
                )}
                {recordsOut > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] text-[#8a8580]">Out</div>
                    <div className="text-[11px] font-semibold text-[#3d7a50]">
                      {recordsOut.toLocaleString()}
                    </div>
                  </div>
                )}
                {quarantined > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] text-[#c79f4a]">Quarantine</div>
                    <div className="text-[11px] font-semibold text-[#c79f4a]">{quarantined}</div>
                  </div>
                )}
              </div>

              {/* Connector line */}
              {i < STAGE_META.length - 1 && (
                <div className="absolute left-[26px] mt-[46px] w-0.5 h-3 bg-[#ebe5d8]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
