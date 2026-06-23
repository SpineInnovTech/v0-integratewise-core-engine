/**
 * Evidence Drawer
 * Slide-out drawer showing A/B/C evidence during approval
 * Day 4: UI Polish + Integration
 */

"use client";

import { useState } from "react";
import {
  X,
  ChevronRight,
  ExternalLink,
  Clock,
  BarChart3,
  TrendingUp,
  FileText,
  MessageSquare,
  Mail,
  Phone,
  Video,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Building2,
  User,
  Link2,
  Sparkles,
  Filter,
} from "lucide-react";

export interface EvidenceItem {
  id: string;
  type: "A" | "B" | "C"; // Activity, Behavior, Context
  category: string;
  title: string;
  description: string;
  source: string;
  timestamp: string;
  confidence: number;
  metadata?: Record<string, any>;
  relatedEntities?: { id: string; name: string; type: string }[];
}

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  entityType: string;
  evidence: EvidenceItem[];
}

const mockEvidence: EvidenceItem[] = [
  {
    id: "ev-001",
    type: "A",
    category: "Email Activity",
    title: "No email opens in 14 days",
    description: "Champion Sarah Chen hasn't opened any of the 3 emails sent in the last 2 weeks.",
    source: "HubSpot",
    timestamp: "2026-01-29T08:00:00Z",
    confidence: 95,
    metadata: { emailsSent: 3, opens: 0, lastOpen: "2026-01-15T10:30:00Z" },
    relatedEntities: [{ id: "con-001", name: "Sarah Chen", type: "contact" }],
  },
  {
    id: "ev-002",
    type: "A",
    category: "Meeting Activity",
    title: "Declined last 2 meeting requests",
    description: "Champion declined scheduled demos on Jan 20 and Jan 25.",
    source: "Calendar",
    timestamp: "2026-01-25T14:00:00Z",
    confidence: 90,
    metadata: { declined: 2, reason: "Schedule conflict" },
  },
  {
    id: "ev-003",
    type: "B",
    category: "Engagement Pattern",
    title: "Engagement drop detected",
    description: "Weekly engagement score dropped from 85 to 42 over the past 3 weeks.",
    source: "IntegrateWise Analytics",
    timestamp: "2026-01-29T06:00:00Z",
    confidence: 88,
    metadata: { previousScore: 85, currentScore: 42, trend: "declining" },
  },
  {
    id: "ev-004",
    type: "B",
    category: "Deal Pattern",
    title: "Similar deals stalled at this stage",
    description: "67% of deals that show this pattern stall for 30+ days if not addressed.",
    source: "Pattern Engine",
    timestamp: "2026-01-29T07:00:00Z",
    confidence: 82,
    metadata: { sampleSize: 45, stallRate: 0.67, avgStallDays: 34 },
  },
  {
    id: "ev-005",
    type: "C",
    category: "External Context",
    title: "Budget freeze announced",
    description: "Company announced Q1 budget review in recent earnings call.",
    source: "News Feed",
    timestamp: "2026-01-20T12:00:00Z",
    confidence: 75,
    metadata: { newsSource: "TechCrunch", sentiment: "neutral" },
  },
  {
    id: "ev-006",
    type: "C",
    category: "Competitive Intel",
    title: "Competitor demo scheduled",
    description: "Champion LinkedIn shows connection with competitor AE.",
    source: "LinkedIn",
    timestamp: "2026-01-22T09:00:00Z",
    confidence: 65,
    metadata: { competitor: "CompetitorX" },
  },
];

const typeConfig = {
  A: {
    label: "Activity",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    description: "Direct interactions and engagements",
  },
  B: {
    label: "Behavior",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    description: "Patterns and trends over time",
  },
  C: {
    label: "Context",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    description: "External factors and signals",
  },
};

const categoryIcons: Record<string, any> = {
  "Email Activity": Mail,
  "Meeting Activity": Calendar,
  "Call Activity": Phone,
  "Video Activity": Video,
  "Engagement Pattern": TrendingUp,
  "Deal Pattern": BarChart3,
  "Usage Pattern": BarChart3,
  "External Context": AlertCircle,
  "Competitive Intel": Building2,
  "Market Signal": TrendingUp,
};

export function EvidenceDrawer({
  isOpen,
  onClose,
  entityName,
  entityType,
  evidence = mockEvidence,
}: EvidenceDrawerProps) {
  const [filter, setFilter] = useState<"all" | "A" | "B" | "C">("all");
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  const filteredEvidence = filter === "all" ? evidence : evidence.filter((e) => e.type === filter);

  const evidenceCounts = {
    A: evidence.filter((e) => e.type === "A").length,
    B: evidence.filter((e) => e.type === "B").length,
    C: evidence.filter((e) => e.type === "C").length,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Evidence Stream</h2>
            <p className="text-sm text-gray-500">
              {entityName} • <span className="capitalize">{entityType}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* A/B/C Filter Tabs */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              All ({evidence.length})
            </button>
            {(["A", "B", "C"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  filter === type
                    ? typeConfig[type].color.replace("text-", "bg-").split(" ")[0] + " text-white"
                    : `bg-white border ${typeConfig[type].color}`
                }`}
              >
                <span className="font-bold">{type}</span>
                <span className="text-xs opacity-80">({evidenceCounts[type]})</span>
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span>
              <strong>A</strong> = Activity
            </span>
            <span>
              <strong>B</strong> = Behavior
            </span>
            <span>
              <strong>C</strong> = Context
            </span>
          </div>
        </div>

        {/* Evidence List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEvidence.length === 0 ? (
            <div className="p-8 text-center">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900">No evidence found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filter</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEvidence.map((item) => {
                const Icon = categoryIcons[item.category] || AlertCircle;
                const isExpanded = selectedEvidence === item.id;

                return (
                  <div key={item.id} className="group">
                    <button
                      onClick={() => setSelectedEvidence(isExpanded ? null : item.id)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Type Badge */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${typeConfig[item.type].color}`}
                        >
                          {item.type}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">{item.category}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-400">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>

                          {/* Confidence */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 max-w-[100px] bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  item.confidence >= 80
                                    ? "bg-green-500"
                                    : item.confidence >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${item.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{item.confidence}%</span>
                            <span className="text-xs text-gray-400">via {item.source}</span>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-5 h-5 text-gray-300 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                        <div className="ml-11 pt-4 space-y-3">
                          {/* Metadata */}
                          {item.metadata && (
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <h5 className="text-xs font-medium text-gray-500 mb-2">Details</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(item.metadata).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="text-xs text-gray-400 capitalize">
                                      {key.replace(/([A-Z])/g, " $1").trim()}:
                                    </span>
                                    <span className="text-xs text-gray-900 ml-1">
                                      {typeof value === "object"
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Related Entities */}
                          {item.relatedEntities && item.relatedEntities.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-gray-400" />
                              {item.relatedEntities.map((entity) => (
                                <span
                                  key={entity.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
                                >
                                  <User className="w-3 h-3" />
                                  {entity.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* View Source */}
                          <button className="text-xs text-[#2d5a3d] hover:underline flex items-center gap-1">
                            View in {item.source} <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI-curated evidence for decision support</span>
            </div>
            <button className="text-sm text-[#2d5a3d] hover:underline font-medium">
              Export Evidence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { mockEvidence };
export default EvidenceDrawer;
