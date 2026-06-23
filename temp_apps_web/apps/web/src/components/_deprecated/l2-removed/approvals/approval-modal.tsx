/**
 * Approval Modal
 * Full-screen approval view with evidence display
 * Day 4: UI Polish + Integration
 */

"use client";

import { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Sparkles,
  MessageSquare,
  FileText,
  BarChart3,
  Building2,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Edit3,
} from "lucide-react";
import type { PendingApproval } from "./pending-approvals-card";

interface ApprovalModalProps {
  approval: PendingApproval;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (approval: PendingApproval, feedback?: string) => Promise<void>;
  onReject: (approval: PendingApproval, reason: string) => Promise<void>;
}

const evidenceIcons = {
  signal: BarChart3,
  pattern: TrendingUp,
  rule: FileText,
};

export function ApprovalModal({
  approval,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<number | null>(0);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(approval, feedback || undefined);
      onClose();
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await onReject(approval, rejectReason);
      onClose();
    } catch (error) {
      console.error("Rejection failed:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  const confidenceColor =
    approval.confidence >= 90
      ? "text-green-600"
      : approval.confidence >= 70
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Approval Required</h2>
              <p className="text-sm text-gray-500">Review the evidence and decide</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Proposed Action */}
            <div className="bg-gradient-to-r from-[#2d5a3d]/5 to-[#2d5a3d]/10 rounded-xl p-5 border border-[#2d5a3d]/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      approval.urgency === "critical"
                        ? "bg-red-100 text-red-700"
                        : approval.urgency === "high"
                          ? "bg-orange-100 text-orange-700"
                          : approval.urgency === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {approval.urgency.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">Confidence:</span>
                  <span className={`text-sm font-semibold ${confidenceColor}`}>
                    {approval.confidence}%
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">{approval.title}</h3>
              <p className="text-gray-600 mb-4">{approval.description}</p>

              {/* Entity Info */}
              <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{approval.entity.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{approval.entity.type}</p>
                </div>
                <button className="ml-auto text-sm text-[#2d5a3d] hover:underline flex items-center gap-1">
                  View Details <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Suggested Action */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Suggested Action
              </h4>
              <p className="text-blue-800">{approval.suggestedAction}</p>
            </div>

            {/* Expected Impact */}
            <div className="bg-green-50 rounded-xl p-5 border border-green-100">
              <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Expected Impact
              </h4>
              <p className="text-green-800">{approval.impact}</p>
            </div>

            {/* Evidence Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Supporting Evidence ({approval.evidence.length})
              </h4>
              <div className="space-y-2">
                {approval.evidence.map((ev, idx) => {
                  const Icon = evidenceIcons[ev.type];
                  const isExpanded = expandedEvidence === idx;

                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedEvidence(isExpanded ? null : idx)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              ev.type === "signal"
                                ? "bg-purple-50"
                                : ev.type === "pattern"
                                  ? "bg-blue-50"
                                  : "bg-amber-50"
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 ${
                                ev.type === "signal"
                                  ? "text-purple-600"
                                  : ev.type === "pattern"
                                    ? "text-blue-600"
                                    : "text-amber-600"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <span
                              className={`text-xs font-medium uppercase ${
                                ev.type === "signal"
                                  ? "text-purple-600"
                                  : ev.type === "pattern"
                                    ? "text-blue-600"
                                    : "text-amber-600"
                              }`}
                            >
                              {ev.type}
                            </span>
                            <p className="text-sm text-gray-900">{ev.summary}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              {/* Detailed evidence would come from API */}
                              Detailed evidence data for "{ev.summary}". This would include
                              timestamps, source systems, confidence scores, and related data
                              points.
                            </p>
                            <button className="mt-2 text-sm text-[#2d5a3d] hover:underline flex items-center gap-1">
                              View Full Details <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feedback Section */}
            {showFeedback && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Edit3 className="w-4 h-4 inline mr-1" />
                  Add Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Any notes or modifications to the suggested action..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 focus:border-[#2d5a3d] resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* Reject Form */}
            {showRejectForm && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <label className="block text-sm font-medium text-red-800 mb-2">
                  <XCircle className="w-4 h-4 inline mr-1" />
                  Reason for Rejection (Required)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please explain why you're rejecting this action..."
                  className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || isRejecting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Proposed {new Date(approval.proposedAt).toLocaleString()}
            {approval.expiresAt && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-orange-600">
                  Expires {new Date(approval.expiresAt).toLocaleString()}
                </span>
              </>
            )}
          </div>

          {!showRejectForm && (
            <div className="flex items-center gap-3">
              {!showFeedback && (
                <button
                  onClick={() => setShowFeedback(true)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Feedback
                </button>
              )}
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-6 py-2 bg-[#2d5a3d] text-white rounded-lg text-sm font-medium hover:bg-[#2d5a3d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isApproving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ThumbsUp className="w-4 h-4" />
                )}
                Approve Action
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApprovalModal;
