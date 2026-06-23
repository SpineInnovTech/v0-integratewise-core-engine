"use client";

import { useState, useEffect } from "react";
import {
  DashboardLayout,
  Section,
  StandardEmptyState,
} from "@/components/common/layouts/page-layouts";
import { useEvidence } from "@/components/core/providers/evidence-provider";
import { useSpineContext } from "@/components/core/providers/spine-context-provider";
import {
  Layers,
  Database,
  FileText,
  MessageSquare,
  ArrowRight,
  Zap,
  Info,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface BridgeFusion {
  id: string;
  fusion_type: string;
  title: string;
  description: string;
  spine_sources: Array<{ table: string; record_id: string; confidence: number }>;
  context_sources: Array<{ artifact_id: string; snippet: string; confidence: number }>;
  knowledge_sources: Array<{ session_id: string; insight_id: string; confidence: number }>;
  fused_insight: string;
  confidence_score: number;
  entity_type?: string;
  entity_id?: string;
  status: string;
  created_at: string;
}

const PLANE_COLORS = {
  spine: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Database },
  context: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: FileText,
  },
  knowledge: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: MessageSquare,
  },
};

export function BridgeDashboard() {
  const [fusions, setFusions] = useState<BridgeFusion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFusion, setSelectedFusion] = useState<BridgeFusion | null>(null);
  const { openEvidence } = useEvidence();

  // Use the universal context for category-aware data fetching
  const spineContext = useSpineContext();

  useEffect(() => {
    async function loadFusions() {
      try {
        // Build URL with context-aware query params
        const params = new URLSearchParams(spineContext.getQueryParams());
        const response = await fetch(`/api/bridge/fusions?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setFusions(data);
        }
      } catch (error) {
        console.error("Failed to load fusions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFusions();
  }, [spineContext.category, spineContext.accountId]); // Re-fetch when context changes

  const getPlaneContribution = (fusion: BridgeFusion) => {
    const spineWeight =
      fusion.spine_sources.length > 0
        ? fusion.spine_sources.reduce((sum, s) => sum + s.confidence, 0) /
          fusion.spine_sources.length
        : 0;
    const contextWeight =
      fusion.context_sources.length > 0
        ? fusion.context_sources.reduce((sum, s) => sum + s.confidence, 0) /
          fusion.context_sources.length
        : 0;
    const knowledgeWeight =
      fusion.knowledge_sources.length > 0
        ? fusion.knowledge_sources.reduce((sum, s) => sum + s.confidence, 0) /
          fusion.knowledge_sources.length
        : 0;

    const total = spineWeight + contextWeight + knowledgeWeight || 1;
    return {
      spine: Math.round((spineWeight / total) * 100),
      context: Math.round((contextWeight / total) * 100),
      knowledge: Math.round((knowledgeWeight / total) * 100),
    };
  };

  const PlaneIndicator = ({
    type,
    count,
    active,
  }: {
    type: "spine" | "context" | "knowledge";
    count: number;
    active: boolean;
  }) => {
    const config = PLANE_COLORS[type];
    const Icon = config.icon;
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
          active
            ? `${config.bg} ${config.text} ${config.border} border`
            : "bg-gray-100 text-gray-400"
        }`}
      >
        <Icon className="w-3 h-3" />
        <span className="capitalize">{type}</span>
        {active && <span className="ml-0.5 opacity-75">({count})</span>}
      </div>
    );
  };

  const ContributionBar = ({ fusion }: { fusion: BridgeFusion }) => {
    const contribution = getPlaneContribution(fusion);
    return (
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 mt-2">
        {contribution.spine > 0 && (
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${contribution.spine}%` }}
            title={`Spine: ${contribution.spine}%`}
          />
        )}
        {contribution.context > 0 && (
          <div
            className="bg-purple-500 transition-all"
            style={{ width: `${contribution.context}%` }}
            title={`Context: ${contribution.context}%`}
          />
        )}
        {contribution.knowledge > 0 && (
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${contribution.knowledge}%` }}
            title={`Knowledge: ${contribution.knowledge}%`}
          />
        )}
      </div>
    );
  };

  return (
    <DashboardLayout
      title="Bridge"
      description="3-plane signal fusion: Spine (Structured) + Context (Unstructured) + Knowledge (AI)"
      stageId="BRIDGE-040"
      actions={
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      }
    >
      {/* Plane Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Signal Planes</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Spine (SSOT)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-gray-600">Context (Docs)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600">Knowledge (AI)</span>
            </div>
          </div>
        </div>
      </div>

      <Section title="Active Fusions">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : fusions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fusions.map((fusion) => (
              <div
                key={fusion.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                onClick={() => setSelectedFusion(fusion)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 via-purple-500 to-amber-500 rounded-lg">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{fusion.title}</h4>
                      <span className="text-xs text-gray-500 capitalize">
                        {fusion.fusion_type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        fusion.confidence_score >= 0.8
                          ? "bg-green-100 text-green-700"
                          : fusion.confidence_score >= 0.5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {Math.round(fusion.confidence_score * 100)}% conf
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{fusion.fused_insight}</p>

                <div className="flex items-center gap-2 mb-3">
                  <PlaneIndicator
                    type="spine"
                    count={fusion.spine_sources.length}
                    active={fusion.spine_sources.length > 0}
                  />
                  <PlaneIndicator
                    type="context"
                    count={fusion.context_sources.length}
                    active={fusion.context_sources.length > 0}
                  />
                  <PlaneIndicator
                    type="knowledge"
                    count={fusion.knowledge_sources.length}
                    active={fusion.knowledge_sources.length > 0}
                  />
                </div>

                <ContributionBar fusion={fusion} />

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(fusion.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEvidence(
                        `Fusion: ${fusion.title}`,
                        [
                          ...fusion.spine_sources.map((s) => ({
                            type: "spine" as const,
                            title: `${s.table} record`,
                            source: "Spine SSOT",
                            date: "",
                          })),
                          ...fusion.context_sources.map((s) => ({
                            type: "context" as const,
                            title: s.snippet.substring(0, 50) + "...",
                            source: "Context Store",
                            date: "",
                          })),
                          ...fusion.knowledge_sources.map((s) => ({
                            type: "knowledge" as const,
                            title: "AI Insight",
                            source: "Knowledge Bank",
                            date: "",
                          })),
                        ],
                        fusion.description
                      );
                    }}
                    className="text-sm font-medium text-[#2d5a3d] hover:text-[#1a3a2a] flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    View Sources
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <StandardEmptyState
            icon={<Layers className="w-12 h-12 text-gray-300" />}
            title="No Active Fusions"
            description="The Bridge hasn't created any cross-plane insights yet. Fusions appear when signals from multiple planes correlate."
          />
        )}
      </Section>

      {/* Fusion Detail Modal */}
      {selectedFusion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedFusion(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-amber-500 rounded-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedFusion.title}</h2>
                  <p className="text-sm text-gray-500 capitalize">
                    {selectedFusion.fusion_type.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Fused Insight</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedFusion.fused_insight}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-lg ${PLANE_COLORS.spine.bg} ${PLANE_COLORS.spine.border} border`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Database className={`w-4 h-4 ${PLANE_COLORS.spine.text}`} />
                    <span className={`font-medium ${PLANE_COLORS.spine.text}`}>Spine</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedFusion.spine_sources.length}
                  </p>
                  <p className="text-xs text-gray-500">sources</p>
                </div>
                <div
                  className={`p-4 rounded-lg ${PLANE_COLORS.context.bg} ${PLANE_COLORS.context.border} border`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className={`w-4 h-4 ${PLANE_COLORS.context.text}`} />
                    <span className={`font-medium ${PLANE_COLORS.context.text}`}>Context</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedFusion.context_sources.length}
                  </p>
                  <p className="text-xs text-gray-500">artifacts</p>
                </div>
                <div
                  className={`p-4 rounded-lg ${PLANE_COLORS.knowledge.bg} ${PLANE_COLORS.knowledge.border} border`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className={`w-4 h-4 ${PLANE_COLORS.knowledge.text}`} />
                    <span className={`font-medium ${PLANE_COLORS.knowledge.text}`}>Knowledge</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedFusion.knowledge_sources.length}
                  </p>
                  <p className="text-xs text-gray-500">insights</p>
                </div>
              </div>

              <ContributionBar fusion={selectedFusion} />
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedFusion(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-[#2d5a3d] text-white rounded-lg hover:bg-[#1a3a2a] transition-colors flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Act on This
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
