"use client";

/**
 * L2 Correct/Redo Panel
 * Self-healing loop + human correction
 *
 * Contains:
 * - Mark insight incorrect + provide correction
 * - Re-run reasoning with constraints
 * - Undo/redo where supported (or compensating actions)
 * - Feedback stored with evidence links
 *
 * Rule: Corrections become part of the truth/evidence graph.
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit3,
  RefreshCw,
  ChevronRight,
  Clock,
  MessageSquare,
  Undo2,
  Redo2,
  History,
  Link2,
  Sparkles,
} from "lucide-react";

interface PanelProps {
  entityId?: string;
  entityType?: string;
}

interface Correction {
  id: string;
  insightId: string;
  insightTitle: string;
  insightType: "summary" | "signal" | "recommendation" | "prediction";
  originalValue: string;
  correctedValue: string;
  feedback: string;
  status: "pending" | "applied" | "rejected";
  createdAt: string;
  appliedAt?: string;
  createdBy: string;
  evidenceLinks: string[];
}

interface UndoAction {
  id: string;
  actionType: string;
  description: string;
  executedAt: string;
  canUndo: boolean;
  undoMethod: "revert" | "compensate" | "manual";
  status: "active" | "undone" | "expired";
}

export function CorrectRedoPanel({ entityType, entityId }: PanelProps) {
  const [isLoading] = useState(false);
  const [activeView, setActiveView] = useState<"corrections" | "undo">("corrections");
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionFeedback, setCorrectionFeedback] = useState("");
  const [correctedValue, setCorrectedValue] = useState("");

  // Mock data - will connect to correction service
  const [corrections] = useState<Correction[]>([
    {
      id: "1",
      insightId: "insight-001",
      insightTitle: "Acme Corp Revenue Prediction",
      insightType: "prediction",
      originalValue: "Predicted revenue growth: 25% YoY",
      correctedValue: "Actual growth: 18% YoY",
      feedback: "Prediction was too optimistic. Did not account for Q3 seasonality.",
      status: "applied",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      appliedAt: new Date(Date.now() - 3600000).toISOString(),
      createdBy: "John Smith",
      evidenceLinks: ["evidence-001", "evidence-002"],
    },
    {
      id: "2",
      insightId: "insight-002",
      insightTitle: "Deal Stage Classification",
      insightType: "signal",
      originalValue: "Deal classified as: Negotiation",
      correctedValue: "Actual stage: Proposal/Price Quote",
      feedback:
        "Misclassified due to email content. Customer was asking for pricing, not negotiating.",
      status: "pending",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      createdBy: "Sarah Jones",
      evidenceLinks: ["evidence-003"],
    },
    {
      id: "3",
      insightId: "insight-003",
      insightTitle: "Churn Risk Assessment",
      insightType: "recommendation",
      originalValue: "Recommendation: Schedule urgent call",
      correctedValue: "N/A - Customer already churned",
      feedback: "Recommendation came too late. Customer had already canceled subscription.",
      status: "rejected",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      createdBy: "Mike Chen",
      evidenceLinks: [],
    },
  ]);

  const [undoActions] = useState<UndoAction[]>([
    {
      id: "1",
      actionType: "update_deal",
      description: 'Updated deal stage from "Proposal" to "Negotiation"',
      executedAt: new Date(Date.now() - 3600000).toISOString(),
      canUndo: true,
      undoMethod: "revert",
      status: "active",
    },
    {
      id: "2",
      actionType: "send_email",
      description: "Sent follow-up email to contact@acme.com",
      executedAt: new Date(Date.now() - 7200000).toISOString(),
      canUndo: false,
      undoMethod: "compensate",
      status: "active",
    },
    {
      id: "3",
      actionType: "create_task",
      description: 'Created task: "Prepare Q1 deck"',
      executedAt: new Date(Date.now() - 86400000).toISOString(),
      canUndo: true,
      undoMethod: "revert",
      status: "undone",
    },
  ]);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const STATUS_STYLES = {
    pending: {
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
      badge: "secondary" as const,
    },
    applied: {
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-50",
      badge: "default" as const,
    },
    rejected: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
      badge: "destructive" as const,
    },
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-rose-600" />
          Correct / Redo
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Self-healing loop + human corrections (part of truth graph)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-yellow-600">
            {corrections.filter((c) => c.status === "pending").length}
          </div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-green-600">
            {corrections.filter((c) => c.status === "applied").length}
          </div>
          <div className="text-xs text-muted-foreground">Applied</div>
        </div>
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-blue-600">
            {undoActions.filter((a) => a.canUndo).length}
          </div>
          <div className="text-xs text-muted-foreground">Undoable</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === "corrections" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("corrections")}
          className="flex-1"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Corrections
        </Button>
        <Button
          variant={activeView === "undo" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("undo")}
          className="flex-1"
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Undo/Redo
        </Button>
      </div>

      {/* Quick Correction Form */}
      {showCorrectionForm && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">New Correction</p>
            <Button variant="ghost" size="sm" onClick={() => setShowCorrectionForm(false)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            placeholder="What should the correct value be?"
            value={correctedValue}
            onChange={(e) => setCorrectedValue(e.target.value)}
            rows={2}
          />
          <Textarea
            placeholder="Why is this correction needed? (feedback for learning)"
            value={correctionFeedback}
            onChange={(e) => setCorrectionFeedback(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" disabled={!correctedValue.trim()}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Correction
            </Button>
            <Button size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-run with Constraints
            </Button>
          </div>
        </div>
      )}

      {/* Corrections List */}
      {activeView === "corrections" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Correction History</p>
            <Button variant="outline" size="sm" onClick={() => setShowCorrectionForm(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>

          <div className="border rounded-lg divide-y max-h-[350px] overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : corrections.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No corrections recorded</div>
            ) : (
              corrections.map((correction) => {
                const style = STATUS_STYLES[correction.status];
                const StatusIcon = style.icon;

                return (
                  <div key={correction.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${style.color}`} />
                        <div>
                          <p className="text-sm font-medium">{correction.insightTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {correction.insightType} • by {correction.createdBy}
                          </p>
                        </div>
                      </div>
                      <Badge variant={style.badge}>{correction.status}</Badge>
                    </div>

                    <div className="space-y-1 pl-6">
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-red-500 line-through">
                          {correction.originalValue}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-green-600">{correction.correctedValue}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-muted/50 text-xs ml-6">
                      <p className="flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        {correction.feedback}
                      </p>
                    </div>

                    {correction.evidenceLinks.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                        <Link2 className="h-3 w-3" />
                        {correction.evidenceLinks.length} evidence link(s)
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground text-right">
                      {formatTime(correction.createdAt)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Undo/Redo List */}
      {activeView === "undo" && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Action History</p>

          <div className="border rounded-lg divide-y max-h-[350px] overflow-y-auto">
            {undoActions.map((action) => (
              <div key={action.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{action.actionType}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <Badge variant={action.status === "undone" ? "secondary" : "outline"}>
                    {action.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(action.executedAt)}
                    <span className="text-muted-foreground/50">•</span>
                    <span>{action.undoMethod}</span>
                  </div>

                  {action.canUndo && action.status !== "undone" && (
                    <Button size="sm" variant="outline">
                      <Undo2 className="h-3 w-3 mr-1" />
                      Undo
                    </Button>
                  )}

                  {action.status === "undone" && (
                    <Button size="sm" variant="outline">
                      <Redo2 className="h-3 w-3 mr-1" />
                      Redo
                    </Button>
                  )}

                  {!action.canUndo && action.status !== "undone" && (
                    <span className="text-xs text-muted-foreground">Cannot undo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center p-2 border-t">
        Rule: Corrections become part of the truth/evidence graph
      </div>
    </div>
  );
}
