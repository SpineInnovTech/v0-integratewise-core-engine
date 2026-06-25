"use client";

/**
 * L5 — Operations Workbench (dedicated layer workbench)
 *
 * "Where execution is PLANNED. Maps sequences, tracks performance."
 *
 * User intent:  Execute (planning half)
 * System wire:  S6 Intelligence (signals → situations → proposals)
 *
 * Surfaces:
 *   - Situations board (grouped signals = operational state)  → GET /api/v1/intelligence/situations
 *   - Active signals stream                                   → GET /api/v1/intelligence/signals
 *   - Proposal pipeline (what's queued to run)                → GET /api/v1/intelligence/proposals
 *
 * Doctrine: L5 plans, L6 executes. Nothing on this surface dispatches a
 * tool call — approved work is handed to the Execution Workbench (L6).
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Workflow, Radio, ListChecks, Activity, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { intelligence } from "@/lib/api-client";
import { listProposals } from "@/lib/proposals-api";
import { authManager } from "@/lib/auth-manager";
import type { ProposalOpsProjection } from "@integratewise/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayerShell, LayerEmptyState, LayerLoading } from "./layer-shell";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SignalItem {
  id: string;
  title?: string;
  summary?: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  type?: string;
  agent?: string;
  entity_id?: string;
  created_at?: string;
}

interface SituationItem {
  id: string;
  title?: string;
  summary?: string;
  severity?: string;
  signal_count?: number;
  signals?: SignalItem[];
  status?: string;
}

function asArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.signals)) return res.signals;
  if (Array.isArray(res?.situations)) return res.situations;
  return [];
}

const SEVERITY_STYLE: Record<string, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "bg-red-500/10 text-red-700 border-red-500/30" },
  high: { label: "High", cls: "bg-iw-gold/10 text-iw-gold border-iw-gold/30" },
  medium: { label: "Medium", cls: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
  low: { label: "Low", cls: "bg-muted text-muted-foreground border-border" },
};

function SeverityBadge({ severity }: { severity?: string }) {
  const s = SEVERITY_STYLE[severity || "low"] || SEVERITY_STYLE.low;
  return (
    <Badge variant="outline" className={`text-[10px] h-5 shrink-0 ${s.cls}`}>
      {s.label}
    </Badge>
  );
}

// ─── Plan Stage helper — proposal status → operational stage ─────────────────

type PlanStage = "queued" | "in-review" | "ready" | "running";

function planStage(p: ProposalOpsProjection): PlanStage {
  if (p.status === "approved") return "ready";
  if (p.status === "executing") return "running";
  if (p.status === "pending_review") return "in-review";
  return "queued";
}

const STAGE_LABEL: Record<PlanStage, string> = {
  queued: "Queued",
  "in-review": "In Review",
  ready: "Ready to Execute",
  running: "Running",
};

// ─── Main Workbench ──────────────────────────────────────────────────────────

export function L5OperationsWorkbench({ domain }: { domain?: string } = {}) {
  const navigate = useNavigate();

  const situationsQuery = useQuery({
    queryKey: ["l5", "situations"],
    queryFn: () => intelligence.situations(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  const signalsQuery = useQuery({
    queryKey: ["l5", "signals"],
    queryFn: () => intelligence.signals(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  const proposalsQuery = useQuery({
    queryKey: ["l5", "proposals"],
    queryFn: () =>
      listProposals({
        status: ["pending_review", "approved", "executing"],
        limit: 50,
        workspace: domain,
      }),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  });

  const situations = asArray<SituationItem>(situationsQuery.data);
  const signals = asArray<SignalItem>(signalsQuery.data);
  const proposals = proposalsQuery.data || [];

  // Group proposals into plan stages
  const stages = useMemo(() => {
    const grouped: Record<PlanStage, ProposalOpsProjection[]> = {
      queued: [],
      "in-review": [],
      ready: [],
      running: [],
    };
    for (const p of proposals) grouped[planStage(p)].push(p);
    return grouped;
  }, [proposals]);

  const criticalCount = signals.filter(
    (s) => s.severity === "critical" || s.severity === "high"
  ).length;

  const isLoading = situationsQuery.isLoading && signalsQuery.isLoading && proposalsQuery.isLoading;

  // For Customer Zero: L5 picks up Twin handoff packages (Execution Packages) for planning
  const handoffPlansQuery = useQuery({
    queryKey: ["l5", "handoff-plans", domain],
    queryFn: async () => {
      const session = await authManager.getSession();
      if (!session) return [];
      const res = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8786"}/api/v1/execution-packages`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "x-tenant-id": session.user.tenant_id,
          },
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.packages || [];
    },
    staleTime: 5000,
  });

  return (
    <LayerShell
      layer="L5"
      title="Operations Workbench"
      subtitle="Plan execution sequences · Track operational state · Stage approved work (CZ picks Twin handoffs)"
      systemWire="S6 Intelligence — signals · situations · proposals"
      icon={<Workflow className="w-5 h-5" />}
      actions={
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1"
          onClick={() => navigate("/work/execution")}
        >
          Execution <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      }
    >
      <div className="mb-4 text-xs p-2 border bg-amber-50">
        Twin Handoffs surfaced for ops planning:{" "}
        {(handoffPlansQuery.data || []).map((h: any) => (h.workflows || []).join(", ")).join(" | ")}{" "}
        — L5/L6 complete the loop for Customer Zero.
      </div>

      {isLoading ? (
        <LayerLoading />
      ) : (
        <div className="space-y-6">
          {/* ── Operational Pulse ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-0 gap-0">
              <CardContent className="p-4">
                <div className="text-2xl font-semibold">{situations.length}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Active Situations</div>
              </CardContent>
            </Card>
            <Card className="p-0 gap-0">
              <CardContent className="p-4">
                <div className="text-2xl font-semibold">{signals.length}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Live Signals
                  {criticalCount > 0 && (
                    <span className="text-red-600 ml-1">({criticalCount} urgent)</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="p-0 gap-0">
              <CardContent className="p-4">
                <div className="text-2xl font-semibold">{stages["in-review"].length}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Awaiting Review</div>
              </CardContent>
            </Card>
            <Card className="p-0 gap-0">
              <CardContent className="p-4">
                <div className="text-2xl font-semibold">{stages.ready.length}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Ready to Execute</div>
              </CardContent>
            </Card>
          </div>

          {/* ── Plan Pipeline (Kanban-style stages) ── */}
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-muted-foreground" /> Plan Pipeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {(Object.keys(stages) as PlanStage[]).map((stage) => (
                <Card key={stage} className="p-0 gap-0 overflow-hidden">
                  <CardHeader className="px-3 py-2.5 border-b border-border flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-semibold">{STAGE_LABEL[stage]}</CardTitle>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {stages[stage].length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-2 space-y-2 min-h-[80px]">
                    {stages[stage].length === 0 ? (
                      <div className="text-[10px] text-muted-foreground/60 text-center py-4">
                        Empty
                      </div>
                    ) : (
                      stages[stage].slice(0, 6).map((p) => (
                        <div
                          key={p.id}
                          className="rounded-md border border-border bg-card px-2.5 py-2 space-y-1"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-[11px] font-medium leading-snug line-clamp-2">
                              {p.action_description}
                            </span>
                            <SeverityBadge severity={p.signal_severity} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-iw-mono">
                              {p.entity_type}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70">
                              {Math.round(p.confidence * (p.confidence <= 1 ? 100 : 1))}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* ── Situations Board ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" /> Situations
              </h2>
              {situations.length === 0 ? (
                <LayerEmptyState
                  icon={<Activity className="w-5 h-5" />}
                  title="No active situations"
                  hint="Situations form when related signals cluster around an entity or goal."
                />
              ) : (
                <div className="space-y-2">
                  {situations.slice(0, 8).map((s, i) => (
                    <Card key={s.id || i} className="p-0 gap-0">
                      <CardContent className="px-4 py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium leading-snug">
                            {s.title || s.summary || `Situation ${s.id}`}
                          </div>
                          {typeof s.signal_count === "number" && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {s.signal_count} related signal{s.signal_count === 1 ? "" : "s"}
                            </div>
                          )}
                        </div>
                        <SeverityBadge severity={s.severity} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* ── Signal Stream ── */}
            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-muted-foreground" /> Signal Stream
              </h2>
              {signals.length === 0 ? (
                <LayerEmptyState
                  icon={<Radio className="w-5 h-5" />}
                  title="No live signals"
                  hint="Signals appear as the Intelligence engine reads cross-system data through the Spine."
                />
              ) : (
                <Card className="p-0 gap-0 overflow-hidden">
                  <CardContent className="p-0">
                    {signals.slice(0, 10).map((s, i) => (
                      <div
                        key={s.id || i}
                        className={`flex items-center justify-between px-4 py-2.5 gap-3 ${
                          i < Math.min(signals.length, 10) - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs truncate">
                            {s.title || s.summary || s.description || s.type || s.id}
                          </div>
                          {s.agent && (
                            <div className="text-[10px] text-muted-foreground">{s.agent}</div>
                          )}
                        </div>
                        <SeverityBadge severity={s.severity} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </LayerShell>
  );
}

export default L5OperationsWorkbench;
