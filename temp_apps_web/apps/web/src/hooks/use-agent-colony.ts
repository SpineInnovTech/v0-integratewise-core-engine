/**
 * useAgentColony — React hook for Agent Colony orchestration.
 *
 * Wires to:
 *   POST /api/v1/agents/colony/run          → Start colony run
 *   GET  /api/v1/agents/colony/:instanceId  → Poll run status
 *   GET  /api/v1/agents/colony/history/:tid → Run history
 *   POST /api/v1/agents/:agentType          → Single-agent execution
 *   GET  /api/v1/agents/health              → Colony health
 *
 * The 5 colony agents:
 *   Orchestrator → Research → Analyst → Writer → Planner → Executor
 *
 * Named agents (7 branded, mapped to colony agents):
 *   ChurnShield   → Analyst + Research
 *   VaultGuard    → Executor (secrets rotation)
 *   DataSentinel  → Analyst (data quality)
 *   ArchitectIQ   → Planner + Analyst
 *   TemplateForge → Writer + Planner
 *   SuccessPilot  → Orchestrator (full colony)
 *   DealDesk      → Writer + Executor
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useTenant } from "@/contexts/tenant-context";
import { agentColony, intelligence } from "@/lib/api-client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentInfo {
  id: string;
  name: string;
  status: "active" | "paused" | "error";
  lastRun: string;
  successRate: number;
  actionsThisWeek: number;
}

export interface ColonyRun {
  instanceId: string;
  task: string;
  status: "pending" | "running" | "completed" | "failed";
  plan: any;
  results: any;
  createdAt: string;
  completedAt?: string;
}

export interface ColonyHealth {
  status: "ok" | "degraded" | "down";
  agents: string[];
  version?: string;
}

// ── Fallback agent list removed — agents load from Intelligence service ──────

const FALLBACK_AGENTS: AgentInfo[] = [];

// ── Hook: useAgents (registry) ───────────────────────────────────────────────

export function useAgents() {
  const [agents, setAgents] = useState<AgentInfo[]>(FALLBACK_AGENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await intelligence.agents();
      const agentList = (result as any)?.agents || (result as any)?.data;
      if (Array.isArray(agentList) && agentList.length > 0) {
        setAgents(agentList);
      }
      // If API returns empty/null, keep fallback
    } catch (err: any) {
      console.warn("[useAgents] API unavailable, using fallback");
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { agents, loading, error, refetch: fetch };
}

// ── Hook: useColonyRun (execute + poll) ──────────────────────────────────────

export function useColonyRun() {
  const [run, setRun] = useState<ColonyRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRun = useCallback(async (objective: string, context?: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await agentColony.run({ objective, context });
      const instanceId = (result as any)?.instanceId || (result as any)?.instance_id;
      if (instanceId) {
        const newRun: ColonyRun = {
          instanceId,
          task: objective,
          status: "running",
          plan: (result as any)?.plan || null,
          results: null,
          createdAt: new Date().toISOString(),
        };
        setRun(newRun);

        // Start polling for completion
        pollRef.current = setInterval(async () => {
          try {
            const status = await agentColony.status(instanceId);
            const s = (status as any)?.status;
            if (s === "completed" || s === "failed") {
              setRun((prev) =>
                prev
                  ? {
                      ...prev,
                      status: s,
                      results: (status as any)?.results,
                      completedAt: new Date().toISOString(),
                    }
                  : null
              );
              if (pollRef.current) clearInterval(pollRef.current);
              setLoading(false);
            }
          } catch {
            // Polling failed — continue trying
          }
        }, 3000);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return { run, loading, error, startRun };
}

// ── Hook: useColonyHistory ───────────────────────────────────────────────────

export function useColonyHistory(limit = 20) {
  const { tenantId } = useTenant();
  const [runs, setRuns] = useState<ColonyRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await agentColony.history(tenantId, { limit });
      const list = (result as any)?.runs || (result as any)?.data || [];
      setRuns(Array.isArray(list) ? list : []);
    } catch {
      console.warn("[useColonyHistory] unavailable");
    } finally {
      setLoading(false);
    }
  }, [tenantId, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { runs, loading, refetch: fetch };
}

export default useAgents;
