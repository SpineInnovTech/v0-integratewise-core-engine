"use client";

import {
  AlertCircle,
  TrendingUp,
  Clock,
  ChevronRight,
  Shield,
  Activity,
  FileText,
  Brain,
} from "lucide-react";
import { useState } from "react";

interface Evidence {
  type: "truth" | "context" | "ai-chat";
  title: string;
  source: string;
}

interface ProposedAction {
  title: string;
  description: string;
  requiresApproval: boolean;
}

interface Situation {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  domain: string;
  confidence: number;
  title: string;
  narrative: string;
  whyItMatters: string;
  evidence: Evidence[];
  proposedActions: ProposedAction[];
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
}

interface ActiveSituationsProps {
  situations: Situation[];
  onSituationClick?: (situation: Situation) => void;
  onEvidenceView?: (situation: Situation) => void;
}

export function ActiveSituations({
  situations,
  onSituationClick,
  onEvidenceView,
}: ActiveSituationsProps) {
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);

  const severityConfig = {
    low: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-700",
    },
    medium: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
    },
    high: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-700",
    },
    critical: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
    },
  };

  const domainColors = {
    operations: "bg-blue-100 text-blue-700",
    sales: "bg-green-100 text-green-700",
    marketing: "bg-purple-100 text-purple-700",
    cs: "bg-orange-100 text-orange-700",
    finance: "bg-emerald-100 text-emerald-700",
  };

  // Sample situations if none provided
  const displaySituations: Situation[] =
    situations.length > 0
      ? situations
      : [
          {
            id: "1",
            severity: "medium",
            domain: "operations",
            confidence: 87,
            title: "Project velocity declining for 3 consecutive sprints",
            narrative:
              "Detected 23% drop in story points completed. Primary contributing factor: 4 team members on concurrent support rotations.",
            whyItMatters:
              "Current trajectory risks Q1 delivery commitments. Three key milestones may slip by 2-3 weeks.",
            evidence: [
              { type: "truth", title: "Sprint velocity data", source: "Jira" },
              { type: "truth", title: "Support ticket volume", source: "Zendesk" },
              { type: "context", title: "Team capacity planning doc", source: "Notion" },
              { type: "ai-chat", title: "Engineering standup summary", source: "IQ Hub" },
            ],
            proposedActions: [
              {
                title: "Redistribute support rotation",
                description: "Move 2 engineers off support to focus on sprint work",
                requiresApproval: true,
              },
              {
                title: "Extend sprint timeline",
                description: "Add 2 days to current sprint to catch up",
                requiresApproval: true,
              },
            ],
            status: "pending",
            createdAt: "2h ago",
          },
          {
            id: "2",
            severity: "high",
            domain: "sales",
            confidence: 92,
            title: "3 enterprise deals stalled in legal review >30 days",
            narrative:
              "Contract reviews averaging 34 days vs target of 10 days. Common blocker: MSA terms misalignment.",
            whyItMatters:
              "$420K ARR at risk. If not closed by Feb 15, deals may push to Q2 affecting quarterly targets.",
            evidence: [
              { type: "truth", title: "Deal stage history", source: "HubSpot" },
              { type: "context", title: "Contract review notes", source: "DocuSign" },
              { type: "ai-chat", title: "Legal team chat summary", source: "Slack" },
            ],
            proposedActions: [
              {
                title: "Schedule executive alignment call",
                description: "CEO + VP Sales + General Counsel sync on MSA terms",
                requiresApproval: false,
              },
              {
                title: "Prepare alternative pricing structure",
                description: "Create flexible payment terms option",
                requiresApproval: true,
              },
            ],
            status: "pending",
            createdAt: "4h ago",
          },
        ];

  const evidenceTypeIcons = {
    truth: <Activity className="w-3 h-3" />,
    context: <FileText className="w-3 h-3" />,
    "ai-chat": <Brain className="w-3 h-3" />,
  };

  const evidenceTypeColors = {
    truth: "bg-purple-100 text-purple-600",
    context: "bg-orange-100 text-orange-600",
    "ai-chat": "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Active Situations</h2>
          <p className="text-sm text-gray-500 mt-0.5">Think engine output with grounded evidence</p>
        </div>
        <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#2d5a3d] hover:bg-[#EEF3F0] rounded-lg transition-colors">
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {displaySituations.map((situation) => {
          const config = severityConfig[situation.severity];
          const isSelected = selectedSituation === situation.id;

          return (
            <div
              key={situation.id}
              className={`border rounded-lg transition-all ${config.border} ${config.bg} hover:shadow-md`}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                      {situation.severity.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        domainColors[situation.domain as keyof typeof domainColors] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {situation.domain}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/60 rounded text-xs">
                      <TrendingUp className="w-3 h-3 text-gray-600" />
                      <span className="font-medium text-gray-700">
                        {situation.confidence}% confidence
                      </span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/60 rounded text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{situation.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Title & Narrative */}
                <h3 className={`font-semibold mb-2 ${config.text}`}>{situation.title}</h3>
                <p className="text-sm text-gray-700 mb-2">{situation.narrative}</p>
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded mb-3">
                  <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Why it matters:</span> {situation.whyItMatters}
                  </p>
                </div>

                {/* Evidence Summary */}
                <div className="mb-3">
                  <button
                    onClick={() => onEvidenceView?.(situation)}
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Shield className="w-3 h-3" />
                    <span className="font-medium">Evidence:</span>
                    <div className="flex items-center gap-1">
                      {["truth", "context", "ai-chat"].map((type) => {
                        const count = situation.evidence.filter((e) => e.type === type).length;
                        if (count === 0) return null;
                        return (
                          <span
                            key={type}
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              evidenceTypeColors[type as keyof typeof evidenceTypeColors]
                            }`}
                          >
                            {count} {type.charAt(0).toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                </div>

                {/* Proposed Actions */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-600">Proposed Actions:</span>
                    {situation.proposedActions.some((a) => a.requiresApproval) && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                        {situation.proposedActions.filter((a) => a.requiresApproval).length} require
                        approval
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {situation.proposedActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-white/80 rounded border border-gray-200/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{action.title}</p>
                            {action.requiresApproval && (
                              <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                                Needs approval
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{action.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => onSituationClick?.(situation)}
                    className="flex-1 px-4 py-2 bg-[#2d5a3d] text-white rounded-lg hover:bg-[#1a3a2a] transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors text-sm font-medium">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
