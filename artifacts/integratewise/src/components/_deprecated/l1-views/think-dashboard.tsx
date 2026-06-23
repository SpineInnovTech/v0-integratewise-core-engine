"use client";

import {
  DashboardLayout,
  Section,
  StandardEmptyState,
} from "@/components/common/layouts/page-layouts";
import { AlertTriangle, Clock, Activity, ArrowRight, Zap } from "lucide-react";
import { useEvidence } from "@/components/core/providers/evidence-provider";

export function ThinkDashboard({ situations }: { situations: any[] }) {
  const { openEvidence } = useEvidence();

  return (
    <DashboardLayout
      title="Think Engine"
      description="Detected signals, risks, and opportunities requiring attention."
      stageId="THINK-030"
    >
      <Section title="Active Situations">
        <div className="grid gap-4 md:grid-cols-2">
          {situations.length > 0 ? (
            situations.map((situation: any) => (
              <div
                key={situation.id}
                className={`p-4 rounded-lg border flex items-start gap-4 ${
                  situation.severity === "critical"
                    ? "bg-red-50 border-red-200"
                    : situation.severity === "high"
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    situation.severity === "critical"
                      ? "bg-red-100 text-red-600"
                      : situation.severity === "high"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{situation.title}</h4>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(situation.detected_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{situation.description}</p>

                  {situation.evidence_refs && situation.evidence_refs.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-gray-500">Based on:</span>
                      {situation.evidence_refs.map((ref: any, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600"
                        >
                          {ref.ref_type}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        openEvidence(
                          `Situation Logic: ${situation.title}`,
                          (situation.evidence_refs || []).map((ref: any) => ({
                            type: ref.ref_type === "spine_metric" ? "spine" : "context",
                            title: ref.ref_id, // Placeholder, would fetch real title lookup
                            source: "Engine Detection",
                            date: new Date(situation.detected_at).toLocaleDateString(),
                          })),
                          situation.description
                        )
                      }
                      className="text-sm font-medium text-[#2d5a3d] hover:text-[#1a3a2a] flex items-center gap-1"
                    >
                      <Activity className="w-3 h-3" />
                      Explain Logic
                    </button>
                    {situation.actions && situation.actions.length > 0 && (
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        Review {situation.actions.length} Actions
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2">
              <StandardEmptyState
                icon={<Zap className="w-12 h-12 text-gray-300" />}
                title="No Active Situations"
                description="The engine hasn't detected any new patterns, risks, or opportunities requiring your attention."
              />
            </div>
          )}
        </div>
      </Section>
    </DashboardLayout>
  );
}
