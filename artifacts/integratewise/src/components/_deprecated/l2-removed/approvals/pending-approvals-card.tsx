/**
 * Pending Approvals Card — Action Queue
 * Shows proposed actions as a work queue on Today view.
 * Users can quick-approve/reject inline, or click to open full detail modal.
 * Designed to feel like a task list that modifies account state, not a notification center.
 */

"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Building2,
  User,
  DollarSign,
  Mail,
  Phone,
  AlertTriangle,
  Zap,
  Check,
  X,
  Inbox,
} from "lucide-react";

export interface PendingApproval {
  id: string;
  type: "outreach" | "discount" | "escalation" | "renewal" | "upsell" | "follow_up";
  title: string;
  description: string;
  entity: {
    id: string;
    name: string;
    type: "account" | "contact" | "deal" | "ticket";
  };
  urgency: "critical" | "high" | "medium" | "low";
  confidence: number; // 0-100
  proposedAt: string;
  expiresAt?: string;
  evidence: {
    type: "signal" | "pattern" | "rule";
    summary: string;
  }[];
  suggestedAction: string;
  impact: string;
}

const mockApprovals: PendingApproval[] = [];
// Hardcoded demo data removed — wired to HITL queue via workflow BFF

const urgencyConfig = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    icon: AlertTriangle,
  },
  high: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: AlertCircle,
  },
  medium: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: Clock },
  low: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Sparkles },
};

const typeConfig = {
  outreach: { icon: Mail, label: "Outreach", color: "text-blue-600" },
  discount: { icon: DollarSign, label: "Discount", color: "text-green-600" },
  escalation: { icon: AlertTriangle, label: "Escalation", color: "text-red-600" },
  renewal: { icon: Clock, label: "Renewal", color: "text-purple-600" },
  upsell: { icon: Zap, label: "Upsell", color: "text-amber-600" },
  follow_up: { icon: Phone, label: "Follow-up", color: "text-cyan-600" },
};

interface PendingApprovalsCardProps {
  onApprovalClick: (approval: PendingApproval) => void;
  onQuickApprove?: (approval: PendingApproval) => void;
  onQuickReject?: (approval: PendingApproval) => void;
  approvals?: PendingApproval[];
  className?: string;
}

export function PendingApprovalsCard({
  onApprovalClick,
  onQuickApprove,
  onQuickReject,
  approvals = mockApprovals,
  className = "",
}: PendingApprovalsCardProps) {
  const criticalCount = approvals.filter((a) => a.urgency === "critical").length;
  const highCount = approvals.filter((a) => a.urgency === "high").length;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 rounded-lg">
            <Inbox className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Action Queue</h3>
          {approvals.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              {approvals.length} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
              {criticalCount} critical
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
              {highCount} urgent
            </span>
          )}
        </div>
      </div>

      {/* Action Queue */}
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {approvals.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">Queue empty</p>
            <p className="text-xs text-gray-500 mt-1">
              No actions waiting for your decision. New proposals will appear here.
            </p>
          </div>
        ) : (
          approvals.map((approval) => {
            const urgency = urgencyConfig[approval.urgency];
            const type = typeConfig[approval.type];
            const UrgencyIcon = urgency.icon;
            const TypeIcon = type.icon;

            return (
              <div key={approval.id} className="p-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-start gap-3">
                  {/* Type Icon */}
                  <div className={`p-2 rounded-lg ${urgency.bg}`}>
                    <TypeIcon className={`w-4 h-4 ${type.color}`} />
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onApprovalClick(approval)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${urgency.bg} ${urgency.text}`}
                      >
                        {approval.urgency}
                      </span>
                      <span className="text-xs text-gray-500">{type.label}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">
                        {approval.confidence}% confidence
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
                      {approval.title}
                    </h4>

                    {/* Suggested action — what will happen if approved */}
                    <p className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1 mb-2 line-clamp-1">
                      {approval.suggestedAction}
                    </p>

                    {/* Entity + time */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        <Building2 className="w-3 h-3" />
                        {approval.entity.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(approval.proposedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {approval.expiresAt && (
                        <span className="text-xs text-red-500 font-medium">
                          Expires{" "}
                          {new Date(approval.expiresAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Inline quick actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onQuickApprove && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickApprove(approval);
                        }}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                        title="Quick approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {onQuickReject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickReject(approval);
                        }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Quick reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronRight
                      className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors cursor-pointer"
                      onClick={() => onApprovalClick(approval)}
                    />
                  </div>
                </div>

                {/* Impact Preview */}
                {approval.impact && (
                  <div className="mt-2 ml-11 p-2 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-green-700">
                      <span className="font-medium">Expected outcome:</span> {approval.impact}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {approvals.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button className="text-sm text-[#2d5a3d] hover:underline font-medium">
            View all {approvals.length} queued actions →
          </button>
        </div>
      )}
    </div>
  );
}

export { mockApprovals };
export default PendingApprovalsCard;
