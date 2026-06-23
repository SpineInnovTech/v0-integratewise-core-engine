"use client";

import { Check, X, Play, Shield, Clock, User, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

interface PolicyRequirement {
  type: "approval" | "review" | "compliance";
  description: string;
  satisfied: boolean;
}

interface ActionBarProps {
  action: {
    id: string;
    title: string;
    description: string;
    proposedBy: string;
    proposedAt: string;
    status: "pending" | "approved" | "rejected" | "running" | "completed";
    requiresApproval: boolean;
    policies: PolicyRequirement[];
    estimatedImpact?: string;
    riskLevel?: "low" | "medium" | "high";
  };
  onApprove?: (actionId: string) => void;
  onReject?: (actionId: string, reason?: string) => void;
  onRun?: (actionId: string) => void;
}

export function ActionBar({ action, onApprove, onReject, onRun }: ActionBarProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const riskConfig = {
    low: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      badge: "bg-green-100 text-green-700",
    },
    medium: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
    },
    high: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
    },
  };

  const statusConfig = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
    approved: { bg: "bg-green-50", text: "text-green-700", icon: Check },
    rejected: { bg: "bg-red-50", text: "text-red-700", icon: X },
    running: { bg: "bg-blue-50", text: "text-blue-700", icon: Play },
    completed: { bg: "bg-green-50", text: "text-green-700", icon: Check },
  };

  const config = riskConfig[action.riskLevel || "low"];
  const statusData = statusConfig[action.status];
  const StatusIcon = statusData.icon;

  const allPoliciesSatisfied = action.policies.every((p) => p.satisfied);

  return (
    <div className={`border rounded-lg ${config.border} ${config.bg}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{action.title}</h3>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${statusData.bg} ${statusData.text}`}
              >
                <StatusIcon className="w-3 h-3" />
                {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
              </span>
              {action.riskLevel && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                  {action.riskLevel.toUpperCase()} RISK
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700">{action.description}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>Proposed by {action.proposedBy}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{action.proposedAt}</span>
          </div>
          {action.estimatedImpact && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Impact: {action.estimatedImpact}</span>
            </div>
          )}
        </div>

        {/* Policy Requirements */}
        {action.requiresApproval && action.policies.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-semibold text-gray-700 uppercase">
                Policy Requirements
              </span>
              {allPoliciesSatisfied ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                  All satisfied
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                  {action.policies.filter((p) => !p.satisfied).length} pending
                </span>
              )}
            </div>
            <div className="space-y-2">
              {action.policies.map((policy, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded border ${
                    policy.satisfied
                      ? "bg-white/60 border-green-200"
                      : "bg-white/80 border-amber-200"
                  }`}
                >
                  <div
                    className={`p-1 rounded ${policy.satisfied ? "bg-green-100" : "bg-amber-100"}`}
                  >
                    {policy.satisfied ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          policy.type === "approval"
                            ? "bg-blue-100 text-blue-700"
                            : policy.type === "review"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {policy.type}
                      </span>
                      <p className="text-xs text-gray-700">{policy.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Trail Link */}
        <div className="mb-4">
          <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors">
            <FileText className="w-3 h-3" />
            <span>View audit trail</span>
          </button>
        </div>

        {/* Actions */}
        {action.status === "pending" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove?.(action.id)}
              disabled={!allPoliciesSatisfied}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                allPoliciesSatisfied
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              className="flex-1 px-4 py-2 border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {action.status === "approved" && (
          <button
            onClick={() => onRun?.(action.id)}
            className="w-full px-4 py-2 bg-[#2d5a3d] text-white rounded-lg hover:bg-[#1a3a2a] transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Execute Action
          </button>
        )}

        {action.status === "running" && (
          <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-blue-700">Action in progress...</span>
          </div>
        )}

        {action.status === "completed" && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Action completed successfully
            </span>
          </div>
        )}

        {action.status === "rejected" && (
          <div className="flex items-center justify-center gap-2 p-3 bg-red-50 rounded-lg">
            <X className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Action rejected</span>
          </div>
        )}

        {/* Reject Form */}
        {showRejectForm && action.status === "pending" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <label className="block text-xs font-medium text-gray-700 mb-2">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              rows={3}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => {
                  onReject?.(action.id, rejectReason);
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
                disabled={!rejectReason.trim()}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
