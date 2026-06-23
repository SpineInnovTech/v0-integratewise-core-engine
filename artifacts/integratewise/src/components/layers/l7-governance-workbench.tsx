"use client";

/**
 * L7 — Governance / Approval Center (dedicated layer workbench)
 *
 * For customers: "Approval Center" (insights only) — Pending Decisions, Approved, Policy insights, Audit.
 * For internal/Customer Zero: Full "Governance Workbench".
 *
 * Surfaces (customer view):
 *   - Decision insights & summaries
 *   - Policy visibility
 *   - Audit trail
 *
 * Full interactive approval queue available only in internal mode.
 *
 * Doctrine: IW proposes + governs. Customer systems execute.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ScrollText,
  Gavel,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { cognitive } from "@/lib/api-client";
import { useProposals } from "@/hooks/use-proposals";
import type { ProposalOpsProjection } from "@integratewise/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LayerShell, LayerEmptyState, LayerLoading } from "./layer-shell";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PolicyItem {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  enabled?: boolean;
  scope?: string;
  governance_level?: string;
}

interface AuditEntry {
  id: string;
  action?: string;
  action_type?: string;
  actor?: string;
  status?: string;
  outcome?: string;
  created_at?: string;
  timestamp?: string;
}

function asArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.policies)) return res.policies;
  if (Array.isArray(res?.entries)) return res.entries;
  return [];
}

function formatDateTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const SEVERITY_CLS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-700 border-red-500/30",
  high: "bg-iw-gold/10 text-iw-gold border-iw-gold/30",
  medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

// ─── Approval Card (full-width review card with evidence + actions) ──────────

function ApprovalCard({
  proposal,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  insightsOnly = false,
}: {
  proposal: ProposalOpsProjection;
  onApprove?: (id: string, notes?: string) => Promise<unknown>;
  onReject?: (id: string, reason: string) => Promise<unknown>;
  isApproving?: boolean;
  isRejecting?: boolean;
  insightsOnly?: boolean;
}) {
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const confidence = Math.round(proposal.confidence * (proposal.confidence <= 1 ? 100 : 1));
  const severityCls = SEVERITY_CLS[proposal.signal_severity] || SEVERITY_CLS.low;

  const handleApprove = async () => {
    if (!onApprove) return;
    setBusy("approve");
    try {
      await onApprove(proposal.id);
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    if (!onReject || !rejectReason.trim()) return;
    setBusy("reject");
    try {
      await onReject(proposal.id, rejectReason.trim());
      setShowReject(false);
      setRejectReason("");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-0 gap-0">
      <CardContent className="p-4 space-y-3">
        {/* header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium leading-snug">{proposal.action_description}</div>
            <div className="text-[10px] text-muted-foreground font-iw-mono mt-0.5">
              {proposal.action_type} · {proposal.entity_type} · lineage {proposal.lineage_id}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className={`text-[10px] h-5 ${severityCls}`}>
              {proposal.signal_severity}
            </Badge>
            <Badge variant="outline" className="text-[10px] h-5">
              {proposal.governance_level}
            </Badge>
          </div>
        </div>

        {/* evidence / reasoning */}
        <div className="rounded-md bg-muted/50 border border-border px-3 py-2.5">
          <div className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Reasoning &amp; Evidence
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {proposal.reasoning_summary}
          </p>
        </div>

        {/* meta + actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] text-muted-foreground space-x-3">
            <span className="font-iw-mono">{confidence}% confidence</span>
            {proposal.review_deadline && (
              <span>review by {formatDateTime(proposal.review_deadline)}</span>
            )}
            <span>{formatDateTime(proposal.created_at)}</span>
          </div>
          {!insightsOnly && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2.5 gap-1"
                disabled={busy !== null || isRejecting}
                onClick={() => setShowReject((v) => !v)}
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
              <Button
                size="sm"
                className="text-xs h-7 px-2.5 gap-1"
                disabled={busy !== null || isApproving}
                onClick={handleApprove}
              >
                {busy === "approve" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Approve
              </Button>
            </div>
          )}
        </div>

        {/* reject reason (required) */}
        {showReject && (
          <div className="space-y-2 pt-2 border-t border-border">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required — becomes decision memory)"
              className="text-xs min-h-[60px]"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="destructive"
                className="text-xs h-7 px-3 gap-1"
                disabled={!rejectReason.trim() || busy !== null}
                onClick={handleReject}
              >
                {busy === "reject" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Workbench ──────────────────────────────────────────────────────────

export function L7GovernanceWorkbench({
  domain,
  insightsOnly = true,
}: {
  domain?: string;
  /** For customers: only insights/summaries/audit, no full approve controls or execution triggers */
  insightsOnly?: boolean;
} = {}) {
  // HITL approval queue (pending review)
  const {
    proposals: pending,
    isLoading: pendingLoading,
    approve,
    reject,
    isApproving,
    isRejecting,
  } = useProposals({ status: "pending_review", limit: 50 });

  // Decided proposals (promotion trail)
  const { proposals: decided, isLoading: decidedLoading } = useProposals({
    status: ["approved", "rejected", "executing", "completed"],
    limit: 30,
  });

  // Policies
  const policiesQuery = useQuery({
    queryKey: ["l7", "policies"],
    queryFn: () => cognitive.policies(),
    staleTime: 60_000,
    retry: 1,
  });

  // Audit trail
  const auditQuery = useQuery({
    queryKey: ["l7", "audit"],
    queryFn: () => cognitive.audit({ limit: 40 }),
    staleTime: 30_000,
    retry: 1,
  });

  const policies = asArray<PolicyItem>(policiesQuery.data);
  const audit = asArray<AuditEntry>(auditQuery.data);

  const criticalPending = pending.filter(
    (p) => p.signal_severity === "critical" || p.signal_severity === "high"
  ).length;

  return (
    <LayerShell
      layer="L7"
      title={insightsOnly ? "Approval Center" : "Governance Workbench"}
      subtitle={
        insightsOnly
          ? "Pending decisions · Approved decisions · Policy insights · Audit trail"
          : "Approvals · Proposals · Promotions · Evidence · Audit trail"
      }
      systemWire="S8 Governance Engine — HARD GATE: no signature, no execution"
      icon={<Shield className="w-5 h-5" />}
      actions={
        pending.length > 0 ? (
          <Badge variant="destructive" className="text-[10px] h-5">
            {pending.length} awaiting review
          </Badge>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* ── Gate banner ── */}
        <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-iw-red shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Govern is a hard gate — no exceptions.
            </span>{" "}
            Agents are structurally blocked until a human approval signature is verified here. Every
            decision (and its reason) is recorded as decision memory the system learns from.
          </p>
        </div>

        {/* ── Pulse ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-0 gap-0">
            <CardContent className="p-4">
              <div className="text-2xl font-semibold">{pending.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Pending Review
                {criticalPending > 0 && (
                  <span className="text-red-600 ml-1">({criticalPending} urgent)</span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="p-0 gap-0">
            <CardContent className="p-4">
              <div className="text-2xl font-semibold">
                {decided.filter((p) => p.status === "approved" || p.status === "executing").length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Approved</div>
            </CardContent>
          </Card>
          <Card className="p-0 gap-0">
            <CardContent className="p-4">
              <div className="text-2xl font-semibold">{policies.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Active Policies</div>
            </CardContent>
          </Card>
          <Card className="p-0 gap-0">
            <CardContent className="p-4">
              <div className="text-2xl font-semibold">{audit.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Audit Entries</div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue={insightsOnly ? "decisions" : "queue"} className="w-full">
          <TabsList>
            {!insightsOnly && (
              <TabsTrigger value="queue" className="gap-1.5 text-xs">
                <Gavel className="w-3.5 h-3.5" /> Approval Queue
                {pending.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5 ml-1">
                    {pending.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="decisions" className="gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Decisions
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-1.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> Policies
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5 text-xs">
              <ScrollText className="w-3.5 h-3.5" /> Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* Approval Queue */}
          <TabsContent value="queue" className="mt-4">
            {pendingLoading ? (
              <LayerLoading />
            ) : pending.length === 0 ? (
              <LayerEmptyState
                icon={<ShieldCheck className="w-5 h-5" />}
                title="Queue is clear"
                hint="AI proposals requiring human sign-off will appear here with full evidence."
              />
            ) : (
              <div className="space-y-3 max-w-3xl">
                {pending.map((p) => (
                  <ApprovalCard
                    key={p.id}
                    proposal={p}
                    onApprove={insightsOnly ? undefined : (id, notes) => approve(id, notes)}
                    onReject={insightsOnly ? undefined : (id, reason) => reject(id, reason)}
                    isApproving={isApproving}
                    isRejecting={isRejecting}
                    insightsOnly={insightsOnly}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Decisions / promotion trail */}
          <TabsContent value="decisions" className="mt-4">
            {decidedLoading ? (
              <LayerLoading />
            ) : decided.length === 0 ? (
              <LayerEmptyState
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="No decisions yet"
                hint="Approved and rejected proposals form the promotion trail and decision memory."
              />
            ) : (
              <Card className="p-0 gap-0 overflow-hidden">
                <CardHeader className="px-4 py-3 border-b border-border">
                  <CardTitle className="text-sm">Decision &amp; Promotion Trail</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {decided.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-4 py-2.5 gap-3 ${
                        i < decided.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs truncate">{p.action_description}</div>
                        <div className="text-[10px] text-muted-foreground font-iw-mono">
                          {p.entity_type} · {formatDateTime(p.created_at)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 shrink-0 ${
                          p.status === "approved" || p.status === "completed"
                            ? "bg-iw-forest-bright/10 text-iw-forest-bright border-iw-forest-bright/30"
                            : p.status === "executing"
                              ? "bg-iw-forest/10 text-iw-forest border-iw-forest/30"
                              : "bg-red-500/10 text-red-700 border-red-500/30"
                        }`}
                      >
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Policies */}
          <TabsContent value="policies" className="mt-4">
            {policiesQuery.isLoading ? (
              <LayerLoading />
            ) : policies.length === 0 ? (
              <LayerEmptyState
                icon={<ShieldCheck className="w-5 h-5" />}
                title="No policies configured"
                hint="Governance policies define which actions require human approval and at what level."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {policies.map((pol, i) => (
                  <Card key={pol.id || i} className="p-0 gap-0">
                    <CardContent className="p-4 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium">
                          {pol.name || pol.title || pol.id}
                        </span>
                        <Badge
                          variant={pol.enabled === false ? "secondary" : "default"}
                          className="text-[10px] h-5 shrink-0"
                        >
                          {pol.enabled === false ? "Disabled" : pol.status || "Active"}
                        </Badge>
                      </div>
                      {pol.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {pol.description}
                        </p>
                      )}
                      {(pol.scope || pol.governance_level) && (
                        <div className="text-[10px] text-muted-foreground font-iw-mono">
                          {[pol.scope, pol.governance_level].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Audit Trail */}
          <TabsContent value="audit" className="mt-4">
            {auditQuery.isLoading ? (
              <LayerLoading />
            ) : audit.length === 0 ? (
              <LayerEmptyState
                icon={<ScrollText className="w-5 h-5" />}
                title="No audit entries yet"
                hint="Every governed action — proposal, decision, execution, writeback — is recorded here."
              />
            ) : (
              <Card className="p-0 gap-0 overflow-hidden">
                <CardHeader className="px-4 py-3 border-b border-border">
                  <CardTitle className="text-sm">Audit Trail</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {audit.map((a, i) => (
                    <div
                      key={a.id || i}
                      className={`flex items-center justify-between px-4 py-2.5 gap-3 ${
                        i < audit.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs truncate">
                          {a.action || a.action_type || `Entry ${a.id}`}
                        </div>
                        {a.actor && (
                          <div className="text-[10px] text-muted-foreground">{a.actor}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(a.status || a.outcome) && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            {a.status || a.outcome}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatDateTime(a.created_at || a.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </LayerShell>
  );
}

export default L7GovernanceWorkbench;
