import { spineClient } from "@/utils/spine/client";

const API_BASE = import.meta.env.VITE_API_BASE_URL; // Gateway worker URL

export { spineClient };

const API_TIMEOUT_MS = 30_000;

export interface WorkspaceDashboardResponse {
  entity_count: number;
  active_signals: number;
  pending_approvals: number;
  connectors: Array<{
    tool_name: string;
    status: string;
    entity_count: number;
    last_sync_at: string;
  }>;
  signals: Array<{
    id: string;
    title: string;
    severity: string;
    description: string;
    created_at: string;
  }>;
}

async function apiCall<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await spineClient.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options?.signal ?? controller.signal,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "x-tenant-id": session.user.user_metadata?.tenant_id || "",
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Request to ${path} timed out after ${API_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Dashboard
  getDashboard: () => apiCall<WorkspaceDashboardResponse>("/api/v1/workspace/dashboard"),

  // Entities
  getEntities: (type?: string) =>
    apiCall(`/api/v1/workspace/entities${type ? `?type=${type}` : ""}`),
  getEntity: (id: string) => apiCall(`/api/v1/pipeline/entities/${id}`),

  // Signals
  getSignals: () => apiCall("/api/v1/cognitive/signals"),

  // HITL
  getApprovals: () => apiCall("/api/v1/cognitive/hitl/queue"),
  approve: (actionId: string) =>
    apiCall("/api/v1/cognitive/hitl/queue", {
      method: "POST",
      body: JSON.stringify({ action_id: actionId, decision: "approve" }),
    }),
  deny: (actionId: string) =>
    apiCall("/api/v1/cognitive/hitl/queue", {
      method: "POST",
      body: JSON.stringify({ action_id: actionId, decision: "deny" }),
    }),

  // Knowledge
  search: (query: string) => apiCall(`/api/v1/knowledge/search?q=${encodeURIComponent(query)}`),

  // Connectors
  listConnectors: () => apiCall("/api/v1/connector/list"),
  connectTool: (tool: string) =>
    apiCall(`/api/v1/connector/oauth/init/${tool}`, { method: "POST" }),

  // Manual data ingestion
  ingestData: (source: string, data: any[]) =>
    apiCall("/api/v1/connector/ingest", {
      method: "POST",
      body: JSON.stringify({ source, data }),
    }),

  // Brainstorm (Cmd+J)
  brainstorm: (prompt: string) =>
    apiCall("/api/v1/brainstorm", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  // Audit
  getAuditLog: (limit?: number) => apiCall(`/api/v1/cognitive/audit?limit=${limit || 50}`),
};
