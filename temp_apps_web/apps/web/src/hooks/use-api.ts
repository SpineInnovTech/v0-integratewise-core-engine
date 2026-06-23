/**
 * React Query hooks for IntegrateWise API
 *
 * Wraps api-client.ts route helpers with TanStack React Query for:
 * - Automatic caching and deduplication
 * - Background refetch and stale-while-revalidate
 * - Loading/error state management
 * - Mutation invalidation
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  workspace,
  pipeline,
  connector,
  intelligence,
  accelerator,
  knowledge,
  cognitive,
  brainstorm,
  billing,
  admin,
  agentColony,
  flowB,
  apiFetch,
  apiStream,
  type ApiError,
} from "@/lib/api-client";

// ─── Workspace ──────────────────────────────────────────────────────────────

export function useDashboard(domain: string) {
  return useQuery({
    queryKey: ["dashboard", domain],
    queryFn: () => workspace.dashboard(domain),
    enabled: !!domain,
    staleTime: 30_000,
  });
}

export function useSpace(spaceType: string) {
  return useQuery({
    queryKey: ["space", spaceType],
    queryFn: () => workspace.space(spaceType),
    enabled: !!spaceType,
  });
}

export function useNavigation() {
  return useQuery({
    queryKey: ["navigation"],
    queryFn: () => workspace.navigation(),
    staleTime: 5 * 60_000,
  });
}

export function useWorkspaceView(viewId: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ["workspace-view", viewId, params],
    queryFn: () => workspace.view(viewId, params),
    enabled: !!viewId,
  });
}

// ─── Pipeline / Entities ────────────────────────────────────────────────────

export function useEntities(params?: {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["entities", params],
    queryFn: () => pipeline.entities(params),
    staleTime: 30_000,
  });
}

export function useEntity(entityId: string) {
  return useQuery({
    queryKey: ["entity", entityId],
    queryFn: () => pipeline.entity(entityId),
    enabled: !!entityId,
  });
}

export function usePipelineStatus() {
  return useQuery({
    queryKey: ["pipeline-status"],
    queryFn: () => pipeline.status(),
    refetchInterval: 30_000,
  });
}

export function useSchema(entityType?: string) {
  return useQuery({
    queryKey: ["schema", entityType],
    queryFn: () => pipeline.schema(entityType),
    staleTime: 5 * 60_000,
  });
}

// ─── Connectors ─────────────────────────────────────────────────────────────

export function useConnectors() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["connectors"],
    queryFn: () => connector.listOAuth(),
    staleTime: 60_000,
  });

  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const result = await connector.authorize(provider);
      if (result.state) {
        sessionStorage.setItem("oauth_state", result.state);
      }
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => connector.disconnect(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });

  return {
    ...query,
    connectors: query.data,
    connect: connectMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
}

export function useConnectorStatus(provider: string) {
  return useQuery({
    queryKey: ["connector-status", provider],
    queryFn: () => connector.status(provider),
    enabled: !!provider,
    refetchInterval: 60_000,
  });
}

// ─── Intelligence / Signals ─────────────────────────────────────────────────

export function useSignals(params?: {
  severity?: string;
  agent?: string;
  entity_id?: string;
  goal_id?: string;
}) {
  return useQuery({
    queryKey: ["signals", params],
    queryFn: () => intelligence.signals(params),
    refetchInterval: 30_000,
  });
}

export function useSituations() {
  return useQuery({
    queryKey: ["situations"],
    queryFn: () => intelligence.situations(),
    refetchInterval: 30_000,
  });
}

export function useAgents() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["agents"],
    queryFn: () => intelligence.agents(),
    staleTime: 5 * 60_000,
  });

  const updateAgent = useMutation({
    mutationFn: ({ agentId, config }: { agentId: string; config: any }) =>
      intelligence.updateAgent(agentId, config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });

  return { ...query, updateAgent: updateAgent.mutateAsync };
}

// ─── Accelerator / Scoring ──────────────────────────────────────────────────

export function useHealthScore(params?: { entity_id?: string; domain?: string }) {
  return useQuery({
    queryKey: ["health-score", params],
    queryFn: () => accelerator.healthScore(params),
    enabled: !!params?.entity_id,
    staleTime: 5 * 60_000,
  });
}

export function useChurnPrediction(params?: { entity_id?: string }) {
  return useQuery({
    queryKey: ["churn-prediction", params],
    queryFn: () => accelerator.churnPrediction(params),
    enabled: !!params?.entity_id,
    staleTime: 5 * 60_000,
  });
}

// ─── Knowledge ──────────────────────────────────────────────────────────────

export function useKnowledgeSearch() {
  const [results, setResults] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: ({
      query,
      params,
    }: {
      query: string;
      params?: { limit?: number; type?: string };
    }) => knowledge.search(query, params),
    onSuccess: setResults,
  });

  return {
    results,
    search: mutation.mutateAsync,
    isSearching: mutation.isPending,
    error: mutation.error,
  };
}

export function useDocuments(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => knowledge.documents(params),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata?: any }) =>
      knowledge.upload(file, metadata),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

// ─── L2 Cognitive ───────────────────────────────────────────────────────────

export function useHITLQueue() {
  return useQuery({
    queryKey: ["hitl-queue"],
    queryFn: () => cognitive.hitlQueue(),
    refetchInterval: 15_000,
  });
}

export function useHITLAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      proposalId,
      action,
      comment,
    }: {
      proposalId: string;
      action: "approve" | "deny" | "request_changes";
      comment?: string;
    }) => cognitive.hitlAction(proposalId, action, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hitl-queue"] });
      qc.invalidateQueries({ queryKey: ["signals"] });
    },
  });
}

export function useEvidence(entityId: string) {
  return useQuery({
    queryKey: ["evidence", entityId],
    queryFn: () => cognitive.evidence(entityId),
    enabled: !!entityId,
  });
}

export function usePolicies() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["policies"],
    queryFn: () => cognitive.policies(),
    staleTime: 5 * 60_000,
  });

  const updatePolicy = useMutation({
    mutationFn: (policy: any) => cognitive.updatePolicy(policy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });

  return { ...query, updatePolicy: updatePolicy.mutateAsync };
}

export function useAuditTrail(params?: { limit?: number; offset?: number; entity_id?: string }) {
  return useQuery({
    queryKey: ["audit-trail", params],
    queryFn: () => cognitive.audit(params),
  });
}

// ─── Brainstorm (SSE Streaming) ─────────────────────────────────────────────

export function useBrainstorm() {
  const [chunks, setChunks] = useState<any[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(
    async (query: string, context?: { entityId?: string; goalId?: string; domain?: string }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setChunks([]);
      setStreaming(true);
      setError(null);

      await brainstorm.start(
        { query, context },
        {
          onChunk: (data) => setChunks((prev) => [...prev, data]),
          onDone: () => setStreaming(false),
          onError: (err) => {
            setError(err);
            setStreaming(false);
          },
        },
        controller.signal
      );
    },
    []
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { chunks, streaming, error, start, stop };
}

// ─── Billing ────────────────────────────────────────────────────────────────

export function usePlans() {
  return useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => billing.plans(),
    staleTime: 10 * 60_000,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => billing.subscription(),
    staleTime: 60_000,
  });
}

export function useEntitlements(tenantId: string) {
  return useQuery({
    queryKey: ["entitlements", tenantId],
    queryFn: () => billing.entitlements(tenantId),
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

export function useUsage(tenantId: string, metric?: string) {
  return useQuery({
    queryKey: ["usage", tenantId, metric],
    queryFn: () => billing.usage(tenantId, metric),
    enabled: !!tenantId,
    refetchInterval: 60_000,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: ({ skuId, gateway }: { skuId: string; gateway?: "stripe" | "razorpay" }) =>
      billing.checkout(skuId, gateway),
  });
}

// ─── Agent Colony ───────────────────────────────────────────────────────────

export function useColonyRun() {
  return useMutation({
    mutationFn: (params: { objective: string; context?: any; constraints?: any }) =>
      agentColony.run(params),
  });
}

export function useColonyStatus(instanceId: string) {
  return useQuery({
    queryKey: ["colony", instanceId],
    queryFn: () => agentColony.status(instanceId),
    enabled: !!instanceId,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.status === "completed" || data?.status === "failed" ? false : 3_000;
    },
  });
}

// ─── Flow B (Document Processing) ───────────────────────────────────────────

export function useDocumentProcessingStatus(documentId: string) {
  return useQuery({
    queryKey: ["flow-b-status", documentId],
    queryFn: () => flowB.status(documentId),
    enabled: !!documentId,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.status === "completed" || data?.status === "failed" ? false : 5_000;
    },
  });
}

// ─── Gateway Health ─────────────────────────────────────────────────────────

export function useGatewayHealth() {
  return useQuery({
    queryKey: ["gateway-health"],
    queryFn: () => apiFetch("/health", { skipAuth: true }, "Health"),
    refetchInterval: 60_000,
    retry: 1,
  });
}

// ─── Execution Status (direct Supabase read from actions table) ─────────────

import { spineClient } from "@/utils/spine/client";
import type { ExecutionRun } from "@/components/_deprecated/l2-removed/approvals/execution-status-card";

/**
 * Fetches recent action executions from the `actions` table.
 * Reads directly from Supabase (Option A data access pattern).
 * Returns data shaped as ExecutionRun[] for the ExecutionStatusCard component.
 */
async function fetchExecutionRuns(limit = 20): Promise<ExecutionRun[]> {
  const { data, error } = await spineClient
    .from("actions")
    .select(
      "id, title, description, action_type, type, status, payload, parameters, priority, created_at, executed_at, approved_by, situation_id"
    )
    .in("status", ["approved", "executed", "execution_failed"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => {
    const params = row.parameters || row.payload || {};
    const actionType = row.action_type || row.type || "follow_up";
    // Map DB status to ExecutionRun status
    const statusMap: Record<string, ExecutionRun["status"]> = {
      approved: "queued",
      executed: "completed",
      execution_failed: "failed",
    };

    return {
      id: row.id,
      actionType: mapActionType(actionType),
      title: row.title || `${actionType} action`,
      entity: {
        id: params.entity_id || row.situation_id || "",
        name: params.entity_name || params.entity_id?.slice(0, 8) || "Unknown",
        type: (params.entity_type as "account" | "contact" | "deal" | "ticket") || "account",
      },
      status: statusMap[row.status] || "queued",
      startedAt: row.created_at,
      completedAt: row.executed_at || undefined,
      duration: row.executed_at
        ? Math.round(
            (new Date(row.executed_at).getTime() - new Date(row.created_at).getTime()) / 1000
          )
        : undefined,
      result:
        row.status === "executed"
          ? { success: true, message: "Action executed successfully" }
          : row.status === "execution_failed"
            ? { success: false, message: params.error_message || "Execution failed" }
            : undefined,
      approvedBy: row.approved_by || "system",
      retryCount: 0,
    };
  });
}

function mapActionType(raw: string): ExecutionRun["actionType"] {
  const map: Record<string, ExecutionRun["actionType"]> = {
    schedule_health_call: "outreach",
    draft_retention_email: "outreach",
    escalate_to_leadership: "escalation",
    send_payment_reminder: "follow_up",
    create_task: "follow_up",
    trigger_workflow: "follow_up",
    outreach: "outreach",
    discount: "discount",
    escalation: "escalation",
    renewal: "renewal",
    upsell: "upsell",
    follow_up: "follow_up",
  };
  return map[raw] || "follow_up";
}

export function useExecutionStatus(limit = 20) {
  return useQuery({
    queryKey: ["execution-status", limit],
    queryFn: () => fetchExecutionRuns(limit),
    staleTime: 10_000,
    refetchInterval: 15_000, // Poll every 15s for live status updates
  });
}

// ─── Business Intelligence (Cloudflare D1) ──────────────────────────────────

export function useBiExecutive() {
  return useQuery({
    queryKey: ["bi", "executive"],
    queryFn: () => workspace.biExecutive(),
    staleTime: 60_000,
  });
}

export function useBiFounder() {
  return useQuery({
    queryKey: ["bi", "founder"],
    queryFn: () => workspace.biFounder(),
    staleTime: 60_000,
  });
}

export function useBiDepartment(dept: string) {
  return useQuery({
    queryKey: ["bi", "department", dept],
    queryFn: () => workspace.biDepartment(dept),
    enabled: !!dept,
    staleTime: 60_000,
  });
}

export function useBiSignals(acknowledged?: boolean) {
  return useQuery({
    queryKey: ["bi", "signals", acknowledged],
    queryFn: () => workspace.biSignals(acknowledged),
    staleTime: 30_000,
  });
}

export function useBiAckSignal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (signalId: string) => workspace.biAckSignal(signalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bi", "signals"] });
    },
  });
}

export function useBiDecisions(status?: string) {
  return useQuery({
    queryKey: ["bi", "decisions", status],
    queryFn: () => workspace.biDecisions(status),
    staleTime: 60_000,
  });
}
