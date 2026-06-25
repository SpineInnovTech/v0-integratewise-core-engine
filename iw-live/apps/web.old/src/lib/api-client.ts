/**
 * IntegrateWise Unified API Client
 *
 * Architecture v3.6 compliant — all requests route through Gateway Worker (Service ①)
 * with proper authentication headers (JWT + tenant + view context).
 *
 * Auth: Supabase JWT → Authorization: Bearer <token>
 * Tenant: x-tenant-id (from user metadata or session)
 * User: x-user-id (Supabase user id for OAuth state binding)
 * Context: x-view-context (active workspace domain/view)
 *
 * Route Map (Section 22.1):
 *   /api/v1/connector/*     → ② Connector Service
 *   /api/v1/pipeline/*      → ③ Pipeline Service
 *   /api/v1/intelligence/*  → ④ Intelligence Engine
 *   /api/v1/knowledge/*     → ⑤ Knowledge Service
 *   /api/v1/workspace/*     → ⑥ Workspace BFF
 *   /api/v1/brainstorm      → ④ Intelligence Engine (SSE)
 *   /api/v1/cognitive/*     → ④ + ⑤ + ⑥ (L2 surfaces)
 *   /stream/*               → ⑥ BFF (SSE real-time)
 *   /admin/*                → ① Gateway (internal)
 *   /webhooks/*             → ① Gateway (internal)
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const STREAM_BASE = import.meta.env.VITE_STREAM_URL || "";

/** Get auth token from Supabase session (set by AuthProvider) */
let _getAccessToken: (() => string | null) | null = null;
let _getTenantId: (() => string) | null = null;
let _getViewContext: (() => string) | null = null;
let _getUserId: (() => string | null) | null = null;

/**
 * Initialize the API client with auth accessors.
 * Called once from AppShell after AuthProvider mounts.
 */
export function initApiClient(config: {
  getAccessToken: () => string | null;
  getTenantId: () => string;
  getViewContext: () => string;
  getUserId?: () => string | null;
}) {
  _getAccessToken = config.getAccessToken;
  _getTenantId = config.getTenantId;
  _getViewContext = config.getViewContext;
  _getUserId = config.getUserId || null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  /** Skip auth header (for public endpoints) */
  skipAuth?: boolean;
  /** Custom timeout in ms (default: 30000) */
  timeout?: number;
  /** Idempotency key for write operations */
  idempotencyKey?: string;
  /** Approval token for Act operations */
  approvalToken?: string;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// ─── Core Fetch ──────────────────────────────────────────────────────────────

/**
 * Authenticated fetch against the Gateway Worker.
 * Automatically injects JWT, tenant ID, and view context headers.
 */
export async function apiFetch<T = any>(
  path: string,
  options: ApiRequestOptions = {},
  label = "API"
): Promise<T> {
  if (!API_BASE) {
    const error: ApiError = {
      message: `API not configured. Set VITE_API_BASE_URL environment variable.`,
      status: 0,
      code: "API_NOT_CONFIGURED",
    };
    console.error(`[ApiClient] ${label}: ${error.message} — cannot call ${path}`);
    throw error;
  }

  const url = `${API_BASE}${path}`;
  const method = options.method || "GET";
  const body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isUrlEncoded = typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;
  const isBinaryBody =
    body instanceof Blob || body instanceof ArrayBuffer || ArrayBuffer.isView(body);
  const shouldJsonEncode =
    body !== undefined && !isFormData && !isUrlEncoded && !isBinaryBody && typeof body !== "string";
  const requestBody =
    body === undefined ? undefined : shouldJsonEncode ? JSON.stringify(body) : body;

  // Build headers per v3.5 Section 22.3
  const headers: Record<string, string> = { ...options.headers };
  if (shouldJsonEncode && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Auth header (always required unless skipAuth)
  if (!options.skipAuth) {
    const token = _getAccessToken?.();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const tenantId = _getTenantId?.();
  if (tenantId) {
    headers["x-tenant-id"] = tenantId;
  }

  // User id (needed for OAuth state binding + connector callback)
  if (!options.skipAuth) {
    const userId = _getUserId?.();
    if (userId) {
      headers["x-user-id"] = userId;
    }
  }

  // View context (for L1/L2 routes)
  const viewContext = _getViewContext?.();
  if (viewContext) {
    headers["x-view-context"] = viewContext;
  }

  // Idempotency key (for write operations)
  if (options.idempotencyKey) {
    headers["x-idempotency-key"] = options.idempotencyKey;
  }

  // Approval token (for Act operations)
  if (options.approvalToken) {
    headers["x-approval-token"] = options.approvalToken;
  }

  // Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const res = await fetch(url, {
      method,
      headers,
      credentials: "include",
      signal: options.signal || controller.signal,
      ...(requestBody !== undefined ? { body: requestBody } : {}),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "Unknown error");
      let parsed: any;
      try {
        parsed = JSON.parse(errorBody);
      } catch {
        parsed = { message: errorBody };
      }

      const error: ApiError = {
        message: parsed.message || parsed.error || `${method} ${path} failed`,
        status: res.status,
        code: parsed.code,
        details: parsed.details,
      };

      console.error(`[ApiClient] ${label} ${method} ${path} → ${res.status}:`, error.message);
      throw error;
    }

    // Handle 204 No Content
    if (res.status === 204) return {} as T;

    return (await res.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      console.error(`[ApiClient] ${label}: Request timed out for ${path}`);
      throw { message: "Request timed out", status: 408, code: "TIMEOUT" } as ApiError;
    }

    // Re-throw ApiErrors as-is
    if (err.status) throw err;

    // Network errors
    console.error(`[ApiClient] ${label}: Network error for ${path}:`, err.message);
    throw { message: err.message || "Network error", status: 0, code: "NETWORK_ERROR" } as ApiError;
  }
}

/**
 * SSE (Server-Sent Events) fetch for streaming responses.
 * Used by Brainstorm (Cmd+J) and Think analysis.
 */
export async function apiStream(
  path: string,
  options: ApiRequestOptions & {
    onChunk: (data: any) => void;
    onDone?: () => void;
    onError?: (error: ApiError) => void;
  }
): Promise<void> {
  if (!API_BASE) {
    options.onError?.({
      message: "API not configured. Set VITE_API_BASE_URL environment variable.",
      status: 0,
      code: "API_NOT_CONFIGURED",
    });
    return;
  }

  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...options.headers,
  };

  const token = _getAccessToken?.();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const tenantId = _getTenantId?.();
  if (tenantId) headers["x-tenant-id"] = tenantId;

  const viewContext = _getViewContext?.();
  if (viewContext) headers["x-view-context"] = viewContext;

  try {
    const res = await fetch(url, {
      method: options.method || "POST",
      headers,
      credentials: "include",
      signal: options.signal,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "Stream error");
      options.onError?.({
        message: errorBody,
        status: res.status,
        code: "STREAM_ERROR",
      });
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      options.onDone?.();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            options.onDone?.();
            return;
          }
          try {
            options.onChunk(JSON.parse(data));
          } catch {
            // Non-JSON chunk — pass as string
            options.onChunk(data);
          }
        }
      }
    }

    options.onDone?.();
  } catch (err: any) {
    if (err.name === "AbortError") return;
    options.onError?.({
      message: err.message || "Stream failed",
      status: 0,
      code: "STREAM_NETWORK_ERROR",
    });
  }
}

// ─── Route Helpers (v3.5 Section 22) ─────────────────────────────────────────

/** Workspace BFF routes — view aggregation, dashboards, spaces */
export const workspace = {
  /** Dashboard data for current domain/space */
  dashboard: (domain: string) =>
    apiFetch(`/api/v1/workspace/dashboard?domain=${domain}`, {}, `Dashboard(${domain})`),

  /** Space data (Personal/Work/Team) */
  space: (spaceType: string) =>
    apiFetch(`/api/v1/workspace/space/${spaceType}`, {}, `Space(${spaceType})`),

  /** View-specific aggregation */
  view: (viewId: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/api/v1/workspace/view/${viewId}${qs}`, {}, `View(${viewId})`);
  },

  /** Navigation tree for sidebar */
  navigation: () => apiFetch("/api/v1/workspace/navigation", {}, "Navigation"),

  /** BI — Executive metrics dashboard */
  biExecutive: () => apiFetch("/api/v1/workspace/bi/executive", {}, "BIExecutive"),

  /** BI — Founder-specific dashboard */
  biFounder: () => apiFetch("/api/v1/workspace/bi/founder", {}, "BIFounder"),

  /** BI — Department health detail */
  biDepartment: (dept: string) =>
    apiFetch(`/api/v1/workspace/bi/department/${dept}`, {}, `BIDepartment(${dept})`),

  /** BI — Cross-department signals */
  biSignals: (acknowledged?: boolean) => {
    const qs = acknowledged !== undefined ? `?acknowledged=${acknowledged}` : "";
    return apiFetch(`/api/v1/workspace/bi/signals${qs}`, {}, "BISignals");
  },

  /** BI — Acknowledge a signal */
  biAckSignal: (signalId: string) =>
    apiFetch(
      `/api/v1/workspace/bi/signals/${signalId}/ack`,
      { method: "POST" },
      `BIAck(${signalId})`
    ),

  /** BI — Strategic decisions */
  biDecisions: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return apiFetch(`/api/v1/workspace/bi/decisions${qs}`, {}, "BIDecisions");
  },
};

/** Pipeline routes — entity browsing, status (read-only) */
export const pipeline = {
  /** List entities with filtering */
  entities: (params?: { type?: string; status?: string; limit?: number; offset?: number }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/pipeline/entities${qs}`, {}, "Entities");
  },

  /** Single entity with full attributes */
  entity: (entityId: string) =>
    apiFetch(`/api/v1/pipeline/entity/${entityId}`, {}, `Entity(${entityId})`),

  /** Pipeline status and queue health */
  status: () => apiFetch("/api/v1/pipeline/status", {}, "PipelineStatus"),

  /** Schema discovery (adaptive fields) */
  schema: (entityType?: string) => {
    const qs = entityType ? `?entity_type=${entityType}` : "";
    return apiFetch(`/api/v1/pipeline/schema${qs}`, {}, "Schema");
  },

  /** Completeness scoring */
  completeness: (entityId: string) =>
    apiFetch(`/api/v1/pipeline/completeness/${entityId}`, {}, `Completeness(${entityId})`),
};

/** Connector routes — tool connections, OAuth */
export const connector = {
  /** List connected tools */
  list: () => apiFetch("/api/v1/connector/list", {}, "Connectors"),

  /**
   * Full connector catalog supported through Nango (role/industry relevance metadata).
   * Sourced from the CF Gateway — never a hardcoded client list.
   */
  catalog: () =>
    apiFetch<
      Array<{
        id: string;
        provider: string;
        label: string;
        category: string;
        roleRelevance?: string[];
        industryRelevance?: string[];
        logoUrl?: string;
      }>
    >("/api/v1/connectors/catalog", {}, "ConnectorCatalog"),

  /** List all connector statuses (OAuth-based) */
  listOAuth: () => apiFetch("/api/v1/connectors/list", {}, "ConnectorsList"),

  /** Initiate OAuth flow — returns { authUrl, state, provider } */
  authorize: (provider: string) =>
    apiFetch<{
      authUrl: string | null;
      state: string | null;
      provider: string;
      authReady?: boolean;
      message?: string;
    }>(
      `/api/v1/connectors/${provider}/authorize?origin=${encodeURIComponent(window.location.origin)}`,
      {},
      `Authorize(${provider})`
    ),

  /** Exchange OAuth callback code (called by callback page) */
  callback: (provider: string, code: string, state: string) =>
    apiFetch(
      `/api/v1/connectors/${provider}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      {},
      `OAuthCallback(${provider})`
    ),

  /** Start OAuth flow for a tool (legacy MCP connector) */
  connect: (toolId: string, config?: any) =>
    apiFetch(
      "/api/v1/connector/connect",
      { method: "POST", body: { toolId, config } },
      `Connect(${toolId})`
    ),

  /** Disconnect a provider */
  disconnect: (provider: string) =>
    apiFetch(
      `/api/v1/connectors/${provider}/disconnect`,
      { method: "POST" },
      `Disconnect(${provider})`
    ),

  /** Get connector health/sync status */
  status: (provider: string) =>
    apiFetch(`/api/v1/connectors/${provider}/status`, {}, `ConnectorStatus(${provider})`),

  /** Webhook endpoint configuration */
  webhook: (toolId: string) =>
    apiFetch(`/api/v1/connector/webhook/${toolId}`, {}, `Webhook(${toolId})`),

  /**
   * Nango: get a short-lived Connect session token.
   * Frontend passes this token to the Nango Connect UI URL.
   * Returns { session_token, expires_at, integration_id }
   */
  nangoSession: (integrationId: string) =>
    apiFetch<{ session_token: string; expires_at: string; integration_id: string }>(
      "/api/v1/connector/nango/session",
      { method: "POST", body: { integration_id: integrationId } },
      `NangoSession(${integrationId})`
    ),

  /**
   * Nango: disconnect a provider.
   * Deletes from Nango and marks disconnected in Supabase.
   */
  nangoDisconnect: (integrationId: string) =>
    apiFetch(
      "/api/v1/connector/nango/disconnect",
      { method: "POST", body: { integration_id: integrationId } },
      `NangoDisconnect(${integrationId})`
    ),
};

/** Intelligence routes — signals, situations, agent config */
export const intelligence = {
  /** List active signals */
  signals: (params?: {
    severity?: string;
    agent?: string;
    entity_id?: string;
    goal_id?: string;
  }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/intelligence/signals${qs}`, {}, "Signals");
  },

  /** Situations (grouped signals) */
  situations: () => apiFetch("/api/v1/intelligence/situations", {}, "Situations"),

  /** Agent registry and config */
  agents: () => apiFetch("/api/v1/intelligence/agents", {}, "Agents"),

  /** Update agent configuration */
  updateAgent: (agentId: string, config: any) =>
    apiFetch(
      `/api/v1/intelligence/agents/${agentId}`,
      { method: "POST", body: config },
      `UpdateAgent(${agentId})`
    ),
};

/** Domain Accelerator routes — scoring models & predictive analytics */
export const accelerator = {
  /** Account health score (CS domain) */
  healthScore: (params?: { entity_id?: string; domain?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/intelligence/accelerator/health-score${qs}`, {}, "HealthScore");
  },
  /** Churn prediction model */
  churnPrediction: (params?: { entity_id?: string; horizon_days?: number }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(
      `/api/v1/intelligence/accelerator/churn-prediction${qs}`,
      {},
      "ChurnPrediction"
    );
  },
  /** Revenue forecast (RevOps domain) */
  revenueForecast: (params?: { period?: string; segment?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(
      `/api/v1/intelligence/accelerator/revenue-forecast${qs}`,
      {},
      "RevenueForecast"
    );
  },
  /** Pipeline velocity (Sales domain) */
  pipelineVelocity: (params?: { pipeline_id?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(
      `/api/v1/intelligence/accelerator/pipeline-velocity${qs}`,
      {},
      "PipelineVelocity"
    );
  },
  /** NPS analysis */
  npsAnalysis: (params?: { segment?: string; period?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/intelligence/accelerator/nps-analysis${qs}`, {}, "NPSAnalysis");
  },
  /** Data quality score */
  dataQuality: (params?: { domain?: string; entity_type?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/intelligence/accelerator/data-quality${qs}`, {}, "DataQuality");
  },
};

/** Knowledge routes — documents, search, AI sessions */
export const knowledge = {
  /** Semantic search across knowledge store */
  search: (query: string, params?: { limit?: number; type?: string }) =>
    apiFetch(
      "/api/v1/knowledge/search",
      { method: "POST", body: { query, ...params } },
      "KnowledgeSearch"
    ),

  /** List documents */
  documents: (params?: { limit?: number; offset?: number }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/knowledge/documents${qs}`, {}, "Documents");
  },

  /** Upload document */
  upload: (file: File, metadata?: any) => {
    // File uploads use FormData, not JSON
    const formData = new FormData();
    formData.append("file", file);
    if (metadata) formData.append("metadata", JSON.stringify(metadata));

    return apiFetch(
      "/api/v1/knowledge/upload",
      {
        method: "POST",
        body: formData,
      },
      "Upload"
    );
  },

  /** AI session history */
  sessions: (params?: { limit?: number }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/knowledge/sessions${qs}`, {}, "AISessions");
  },
};

/** L2 Cognitive routes (Section 22.2) */
export const cognitive = {
  /** Spine entities (L2 view) */
  spineEntities: (params?: { type?: string; limit?: number; offset?: number }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/cognitive/spine/entities${qs}`, {}, "SpineEntities");
  },

  /** Evidence drawer data for an entity */
  evidence: (entityId: string) =>
    apiFetch(`/api/v1/cognitive/evidence/${entityId}`, {}, `Evidence(${entityId})`),

  /** Signals and situations */
  signals: (params?: { severity?: string; agent?: string; entity_id?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/cognitive/signals${qs}`, {}, "CognitiveSignals");
  },

  /** Think analysis (SSE stream) */
  think: (
    params: { entityId?: string; goalId?: string; query?: string },
    callbacks?: {
      onChunk?: (chunk: any) => void;
      onDone?: () => void;
      onError?: (err: any) => void;
    },
    signal?: AbortSignal
  ) =>
    apiStream("/api/v1/cognitive/think/analyze", {
      method: "POST",
      body: params,
      signal,
      onChunk: callbacks?.onChunk || (() => {}),
      onDone: callbacks?.onDone || (() => {}),
      onError: callbacks?.onError,
    }),

  /** HITL approval queue */
  hitlQueue: () => apiFetch("/api/v1/cognitive/hitl/queue", {}, "HITLQueue"),

  /** Approve/deny/request-changes on HITL proposal */
  hitlAction: (
    proposalId: string,
    action: "approve" | "deny" | "request_changes",
    comment?: string
  ) =>
    apiFetch(
      "/api/v1/cognitive/hitl/queue",
      {
        method: "POST",
        body: { proposalId, action, comment },
      },
      `HITL(${action})`
    ),

  /** Act — execute approved action */
  act: (actionId: string, approvalToken: string) =>
    apiFetch(
      "/api/v1/cognitive/act/execute",
      {
        method: "POST",
        body: { actionId },
        approvalToken,
      },
      `Act(${actionId})`
    ),

  /** Govern — policy management */
  policies: () => apiFetch("/api/v1/cognitive/govern/policies", {}, "Policies"),

  /** Govern — create/update policy */
  updatePolicy: (policy: any) =>
    apiFetch("/api/v1/cognitive/govern/policies", { method: "POST", body: policy }, "UpdatePolicy"),

  /** Agent registry */
  agents: () => apiFetch("/api/v1/cognitive/agents", {}, "CognitiveAgents"),

  /** Digital Twin — proactive suggestions */
  twin: () => apiFetch("/api/v1/cognitive/twin/proactive", {}, "DigitalTwin"),

  /** Digital Twin — conversational chat with Entity 360 context (SSE stream) */
  twinChat: (
    params: {
      message: string;
      entity_id?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      model?: string;
    },
    callbacks: {
      onChunk: (data: any) => void;
      onDone?: () => void;
      onError?: (error: ApiError) => void;
    },
    signal?: AbortSignal
  ) =>
    apiStream("/api/v1/cognitive/twin/chat", {
      method: "POST",
      body: params,
      signal,
      ...callbacks,
    }),

  /**
   * Digital Twin — propose or execute an action.
   * draft_only=true (default): returns suggested_summary + suggested_next_steps.
   * draft_only=false: goes through Govern check → Act execution.
   */
  twinAct: (params: {
    action_key: string;
    entity_type?: string;
    entity_id?: string;
    parameters?: Record<string, unknown>;
    draft_only?: boolean;
  }) =>
    apiFetch<{
      action_key: string;
      status: string;
      suggested_summary?: string;
      suggested_next_steps?: string[];
      execution_id?: string;
      reason?: string;
    }>(
      "/api/v1/cognitive/twin/act",
      { method: "POST", body: params },
      `TwinAct(${params.action_key})`
    ),

  /** Digital Twin — memory browser */
  twinMemories: (params?: { entity_id?: string; goal_id?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/cognitive/twin/memories${qs}`, {}, "TwinMemories");
  },

  /** Audit trail */
  audit: (params?: { limit?: number; offset?: number; entity_id?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/cognitive/audit${qs}`, {}, "AuditTrail");
  },

  /** Situations (dedicated L2 endpoint with include_situations flag) */
  situations: (params?: {
    severity?: string;
    agent?: string;
    entity_id?: string;
    goal_id?: string;
  }) => {
    const qs = params
      ? "?" + new URLSearchParams({ ...params, include_situations: "true" } as any).toString()
      : "?include_situations=true";
    return apiFetch(`/api/v1/cognitive/signals${qs}`, {}, "Situations");
  },

  /** HITL proposal detail — single proposal in queue */
  hitlProposal: (proposalId: string) =>
    apiFetch(`/api/v1/cognitive/hitl/queue/${proposalId}`, {}, `HITL Proposal(${proposalId})`),

  /** Policy detail — single policy configuration */
  policyDetail: (policyId: string) =>
    apiFetch(`/api/v1/cognitive/govern/policies/${policyId}`, {}, `Policy Detail(${policyId})`),

  /** Agent config — single agent configuration */
  agentConfig: (agentId: string) =>
    apiFetch(`/api/v1/cognitive/agents/${agentId}`, {}, `Agent Config(${agentId})`),

  /** Audit export — export audit logs */
  auditExport: (params?: {
    format?: string;
    entity_id?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/cognitive/audit/export${qs}`, {}, "Audit Export");
  },

  /** Flow C: Context-to-Truth loop — push AI chat insights back to Spine */
  contextToTruth: (params: {
    sessionId: string;
    entities: Array<{ type: string; data: Record<string, any> }>;
    confidence: number;
  }) =>
    apiFetch(
      "/api/v1/cognitive/context-to-truth",
      { method: "POST", body: params },
      "ContextToTruth"
    ),

  /** Memories — decision & organizational memory */
  memories: (params?: { q?: string; type?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/cognitive/memories${qs}`, {}, "Memories");
  },
};

/** Agent Colony routes — multi-agent orchestration & single-agent execution */
export const agentColony = {
  /** Start a colony run (orchestrator assigns agents) */
  run: (params: { objective: string; context?: any; constraints?: any }) =>
    apiFetch("/api/v1/agents/colony/run", { method: "POST", body: params }, "ColonyRun"),

  /** Get colony run status & results */
  status: (instanceId: string) =>
    apiFetch(`/api/v1/agents/colony/${instanceId}`, {}, `Colony(${instanceId})`),

  /** Get colony run history for tenant */
  history: (tenantId: string, params?: { limit?: number; offset?: number }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return apiFetch(`/api/v1/agents/colony/history/${tenantId}${qs}`, {}, "ColonyHistory");
  },

  /** Quick single-agent execution */
  runAgent: (agentType: "research" | "analyst" | "writer" | "planner" | "executor", params: any) =>
    apiFetch(
      `/api/v1/agents/${agentType}`,
      { method: "POST", body: params },
      `Agent(${agentType})`
    ),

  /** Agent colony health check */
  health: () => apiFetch("/api/v1/agents/health", {}, "AgentHealth"),
};

/** Flow B: Document processing feedback routes */
export const flowB = {
  /** Check processing status of uploaded document */
  status: (documentId: string) =>
    apiFetch(
      `/api/v1/knowledge/processing-status/${documentId}`,
      {},
      `FlowB Status(${documentId})`
    ),

  /** Submit extraction feedback (closes the feedback loop) */
  feedback: (params: {
    documentId: string;
    extractionId: string;
    corrections: Array<{ field: string; original: any; corrected: any }>;
    approved: boolean;
  }) =>
    apiFetch(
      "/api/v1/knowledge/extraction-feedback",
      { method: "POST", body: params },
      "FlowB Feedback"
    ),

  /** Re-process document after corrections */
  reprocess: (documentId: string) =>
    apiFetch(
      `/api/v1/knowledge/reprocess/${documentId}`,
      { method: "POST" },
      `FlowB Reprocess(${documentId})`
    ),
};

/** Brainstorm (⌘J) — scoped AI chat with SSE streaming */
export const brainstorm = {
  /** Start brainstorm session (SSE stream) */
  start: (
    params: {
      query: string;
      context?: { entityId?: string; goalId?: string; domain?: string };
      model?: string;
    },
    callbacks: {
      onChunk: (data: any) => void;
      onDone?: () => void;
      onError?: (error: ApiError) => void;
    },
    signal?: AbortSignal
  ) =>
    apiStream("/api/v1/brainstorm", {
      method: "POST",
      body: params,
      signal,
      ...callbacks,
    }),
};

/** MCP server configuration — mcp.integratewise.ai (MCP OAuth 2.0, deployed June 9, 2026) */
export const mcp = {
  /** Canonical MCP server URL for AI provider integration */
  serverUrl: (): string => "https://mcp.integratewise.ai",

  /** MCP server connection metadata for AI providers */
  connectionInfo: () => ({
    url: "https://mcp.integratewise.ai",
    protocol: "sse" as const,
    discovery: "standard" as const,
    providers: ["claude", "chatgpt", "perplexity"] as const,
    description: "IntegrateWise canonical MCP server — multi-system tool orchestration",
    features: {
      multiSystem: true,
      contextAware: true,
      rbacGated: true,
      governApprovalRequired: true,
      sessionSummarization: true,
    },
  }),

  /** Get full MCP configuration from connector service */
  getConfig: () => apiFetch("/api/v1/connector/config/mcp-server", {}, "MCPConfig"),
};

/** Support and customer feedback intake */
export const support = {
  /** Public contact form */
  contact: (data: {
    name: string;
    email: string;
    company?: string;
    request_kind?: string;
    message: string;
    source_surface?: string;
    priority?: string;
    severity?: string;
    metadata?: Record<string, unknown>;
  }) =>
    apiFetch(
      "/api/v1/public/contact",
      { method: "POST", body: data, skipAuth: true },
      "PublicContact"
    ),

  /** Public newsletter subscription */
  newsletter: (data: {
    email: string;
    source_surface?: string;
    metadata?: Record<string, unknown>;
  }) =>
    apiFetch(
      "/api/v1/public/newsletter",
      { method: "POST", body: data, skipAuth: true },
      "Newsletter"
    ),

  /** Authenticated support ticket */
  createTicket: (data: {
    email?: string;
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    severity?: string;
    source_surface?: string;
    metadata?: Record<string, unknown>;
  }) => apiFetch("/api/v1/support/tickets", { method: "POST", body: data }, "SupportTicket"),

  /** Authenticated product/support feedback */
  submitFeedback: (data: {
    email?: string;
    name?: string;
    request_kind?: string;
    subject?: string;
    title?: string;
    message?: string;
    description?: string;
    priority?: string;
    severity?: string;
    source_surface?: string;
    create_ticket?: boolean;
    metadata?: Record<string, unknown>;
  }) => apiFetch("/api/v1/support/feedback", { method: "POST", body: data }, "SupportFeedback"),

  /** Authenticated CSAT */
  submitCsat: (data: {
    score: number;
    subject?: string;
    message?: string;
    source_surface?: string;
    metadata?: Record<string, unknown>;
  }) => apiFetch("/api/v1/support/csat", { method: "POST", body: data }, "SupportCsat"),

  /** Authenticated NPS */
  submitNps: (data: {
    score: number;
    subject?: string;
    message?: string;
    source_surface?: string;
    metadata?: Record<string, unknown>;
  }) => apiFetch("/api/v1/support/nps", { method: "POST", body: data }, "SupportNps"),

  /** Current user support activity */
  me: () => apiFetch("/api/v1/support/me", {}, "SupportMe"),
};

/** Admin routes (internal, admin-only) */
export const admin = {
  /** Tenant management */
  tenants: () => apiFetch("/admin/tenants", {}, "AdminTenants"),
  tenant: (tenantId: string) =>
    apiFetch(`/admin/tenants/${tenantId}`, {}, `AdminTenant(${tenantId})`),
  createTenant: (data: any) =>
    apiFetch("/admin/tenants", { method: "POST", body: data }, "CreateTenant"),
  updateTenant: (tenantId: string, data: any) =>
    apiFetch(
      `/admin/tenants/${tenantId}`,
      { method: "PUT", body: data },
      `UpdateTenant(${tenantId})`
    ),

  /** Configuration */
  config: () => apiFetch("/admin/config", {}, "AdminConfig"),
  updateConfig: (data: any) =>
    apiFetch("/admin/config", { method: "POST", body: data }, "UpdateConfig"),

  /** Onboarding triggers */
  triggerOnboarding: (tenantId: string) =>
    apiFetch(
      "/admin/onboarding/trigger",
      { method: "POST", body: { tenantId } },
      "TriggerOnboarding"
    ),

  /** Support operations */
  contactSubmissions: (params?: Record<string, string | number | undefined>) => {
    const cleaned = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== "")
    );
    const qs = Object.keys(cleaned).length
      ? `?${new URLSearchParams(cleaned as any).toString()}`
      : "";
    return apiFetch(`/admin/contact-submissions${qs}`, {}, "AdminContactSubmissions");
  },
  supportTickets: (params?: Record<string, string | number | undefined>) => {
    const cleaned = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== "")
    );
    const qs = Object.keys(cleaned).length
      ? `?${new URLSearchParams(cleaned as any).toString()}`
      : "";
    return apiFetch(`/admin/support-tickets${qs}`, {}, "AdminSupportTickets");
  },
  updateSupportTicket: (ticketId: string, data: Record<string, unknown>) =>
    apiFetch(
      `/admin/support-tickets/${ticketId}`,
      { method: "PATCH", body: data },
      "UpdateSupportTicket"
    ),
  feedbackSubmissions: (params?: Record<string, string | number | undefined>) => {
    const cleaned = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== "")
    );
    const qs = Object.keys(cleaned).length
      ? `?${new URLSearchParams(cleaned as any).toString()}`
      : "";
    return apiFetch(`/admin/feedback-submissions${qs}`, {}, "AdminFeedbackSubmissions");
  },
};

/** Billing routes — subscriptions, entitlements, usage, checkout */
export const billing = {
  /** Active pricing plans / SKUs */
  plans: () => apiFetch("/api/v1/billing/plans", {}, "BillingPlans"),

  /** Current tenant subscription */
  subscription: () => apiFetch("/api/v1/billing/subscription", {}, "Subscription"),

  /** Entitlements + remaining quota for a tenant */
  entitlements: (tenantId: string) =>
    apiFetch(`/api/v1/billing/entitlements/${tenantId}`, {}, "Entitlements"),

  /** Usage metrics */
  usage: (tenantId: string, metric?: string) => {
    const qs = metric ? `?metric=${metric}` : "";
    return apiFetch(`/api/v1/billing/usage/${tenantId}${qs}`, {}, "Usage");
  },

  /** Record a usage event */
  recordUsage: (metricKey: string, quantity: number) =>
    apiFetch(
      "/api/v1/billing/usage",
      { method: "POST", body: { metricKey, quantity } },
      "RecordUsage"
    ),

  /** Invoices */
  invoices: (tenantId: string, limit = 10) =>
    apiFetch(`/api/v1/billing/invoices/${tenantId}?limit=${limit}`, {}, "Invoices"),

  /** Create checkout session (Stripe or Razorpay) */
  checkout: (skuId: string, gateway: "stripe" | "razorpay" = "stripe") =>
    apiFetch(
      "/api/v1/billing/checkout",
      {
        method: "POST",
        body: { sku_id: skuId, gateway },
      },
      "Checkout"
    ),

  /** Create subscription */
  createSubscription: (tenantId: string, skuId: string) =>
    apiFetch(
      "/api/v1/billing/subscriptions",
      {
        method: "POST",
        body: { tenantId, skuId },
      },
      "CreateSubscription"
    ),

  /** Update subscription (upgrade/downgrade) */
  updateSubscription: (tenantId: string, data: any) =>
    apiFetch(
      `/api/v1/billing/subscriptions/${tenantId}`,
      {
        method: "PUT",
        body: data,
      },
      `UpdateSubscription(${tenantId})`
    ),
};

// ─── Stream Gateway (Real-time) ──────────────────────────────────────────────

export function getStreamUrl(): string {
  return STREAM_BASE || API_BASE.replace("gateway", "stream") || "";
}

// ─── Backward Compatibility (Spine Client routes → v3.5 routes) ──────────────

/** @deprecated Use pipeline.entities() or workspace.dashboard() instead */
export const legacySpine = {
  initialize: (params: any) =>
    apiFetch("/api/v1/workspace/initialize", { method: "POST", body: params }, "SpineInit"),

  projection: (department: string) =>
    apiFetch(`/api/v1/workspace/projection/${department}`, {}, `Projection(${department})`),

  readiness: () => apiFetch("/api/v1/workspace/readiness", {}, "Readiness"),

  entities: (type: string) =>
    apiFetch(`/api/v1/pipeline/entities?type=${type}`, {}, `Entities(${type})`),

  metadata: () => apiFetch("/api/v1/pipeline/schema", {}, "Metadata"),

  addConnector: (connectorId: string) =>
    apiFetch(
      "/api/v1/connector/connect",
      { method: "POST", body: { toolId: connectorId } },
      `AddConnector(${connectorId})`
    ),

  /** Domain CRUD (maps to pipeline entities) */
  domainTable: (domain: string, table: string) =>
    apiFetch(
      `/api/v1/pipeline/entities?type=${table}&domain=${domain}`,
      {},
      `Domain(${domain}/${table})`
    ),

  domainRecord: (domain: string, table: string, id: string) =>
    apiFetch(`/api/v1/pipeline/entity/${id}`, {}, `DomainRecord(${id})`),

  createRecord: (domain: string, table: string, record: any) =>
    apiFetch(
      `/api/v1/pipeline/entities`,
      { method: "POST", body: { ...record, entity_type: table, domain } },
      `Create(${domain}/${table})`
    ),

  updateRecord: (domain: string, table: string, id: string, fields: any) =>
    apiFetch(`/api/v1/pipeline/entity/${id}`, { method: "PUT", body: fields }, `Update(${id})`),

  deleteRecord: (domain: string, table: string, id: string) =>
    apiFetch(`/api/v1/pipeline/entity/${id}`, { method: "DELETE" }, `Delete(${id})`),
};

const apiClient = {
  apiFetch,
  apiStream,
  workspace,
  pipeline,
  connector,
  intelligence,
  knowledge,
  cognitive,
  brainstorm,
  mcp,
  support,
  admin,
  legacySpine,
  initApiClient,
  getStreamUrl,
};

export default apiClient;
export { apiClient as api };
