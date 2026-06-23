/**
 * Workspace API Client
 *
 * Frontend API layer - ONLY organic views, NO schema knowledge.
 * All data comes through BFF transformation.
 */

// ============================================================================
// Local Type Definitions (Workspace API specific)
// ============================================================================

export interface ApiErrorResponse {
  code: string;
  message: string;
  action?: string;
  retryAfter?: number;
}

export interface GetTodayRequest {
  date?: string;
}

export interface GetAccountsRequest {
  filters?: ViewFilter[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ViewFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in";
  value: unknown;
}

// Organic response types (NO entity types, NO field names)
export interface TodayViewResponse {
  summary: {
    health: { score: string; label: string; trend: "up" | "down" | "stable" };
    pipeline: { count: number; value: string; trend: "up" | "down" | "stable" };
    tasks: { completed: number; total: number; urgent: number };
    activity: { level: string; description: string };
  };
  actions: Array<{
    id: string;
    title: string;
    priority: "high" | "medium" | "low";
    due?: string;
  }>;
  alerts: Array<{
    id: string;
    message: string;
    severity: "critical" | "warning" | "info";
    timestamp: string;
  }>;
  stats: {
    accounts: number;
    engagements: number;
    signals: number;
  };
}

export interface AccountsListResponse {
  accounts: Array<{
    id: string;
    name: string;
    health: { score: string; label: string; trend: "up" | "down" | "stable" };
    revenue: { amount: string; trend: "up" | "down" | "stable" };
    lastActivity: string;
    status: string;
  }>;
  total: number;
  hasMore: boolean;
}

export interface AccountDetailResponse {
  id: string;
  name: string;
  health: { score: string; label: string; trend: "up" | "down" | "stable" };
  revenue: { amount: string; trend: "up" | "down" | "stable" };
  contacts: Array<{ name: string; role: string }>;
  recentActivity: Array<{ type: string; description: string; date: string }>;
  upcoming: Array<{ type: string; title: string; date: string }>;
}

export interface TasksResponse {
  tasks: Array<{
    id: string;
    title: string;
    status: "pending" | "in_progress" | "completed";
    priority: "high" | "medium" | "low";
    dueDate?: string;
    account?: string;
  }>;
  total: number;
  overdue: number;
}

export interface SignalsResponse {
  signals: Array<{
    id: string;
    title: string;
    message: string;
    type: "opportunity" | "risk" | "alert" | "insight";
    severity: "critical" | "high" | "medium" | "low";
    timestamp: string;
    account?: string;
  }>;
  unread: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// ============================================================================
// API Client Configuration
// ============================================================================

interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

const defaultConfig: ApiConfig = {
  baseUrl: API_BASE,
};

// ============================================================================
// Error Handling
// ============================================================================

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public action?: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new ApiError(error.code, error.message, error.action, error.retryAfter);
  }
  return response.json();
}

// ============================================================================
// L1 Workspace APIs
// ============================================================================

/**
 * Get Today view - main dashboard
 * Returns: Organic summary, actions, alerts
 * NO entity types, NO field names
 */
export async function getTodayView(request?: GetTodayRequest): Promise<TodayViewResponse> {
  const params = request?.date ? `?date=${request.date}` : "";

  const response = await fetch(`${defaultConfig.baseUrl}/workspace/today${params}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
  });

  return handleResponse<TodayViewResponse>(response);
  // Returns: { summary: {health, pipeline, tasks, activity}, actions, alerts, stats }
}

/**
 * Get Accounts list
 * Returns: Organic list view with display names
 * NO entity_type, NO health_score, NO arr
 */
export async function getAccountsList(request?: GetAccountsRequest): Promise<AccountsListResponse> {
  const response = await fetch(`${defaultConfig.baseUrl}/workspace/accounts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request || {}),
  });

  return handleResponse<AccountsListResponse>(response);
  // Returns: { accounts: [{id, name, health: {score: "85%", label, trend}, revenue: {amount, trend}, ...}] }
}

/**
 * Get Account detail
 * Returns: Organic detail view
 * NO raw entity data
 */
export async function getAccountDetail(accountId: string): Promise<AccountDetailResponse> {
  const response = await fetch(`${defaultConfig.baseUrl}/workspace/accounts/${accountId}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  return handleResponse<AccountDetailResponse>(response);
}

/**
 * Get Tasks list
 */
export async function getTasksList(filters?: ViewFilter[]): Promise<TasksResponse> {
  const params = filters ? `?filters=${encodeURIComponent(JSON.stringify(filters))}` : "";

  const response = await fetch(`${defaultConfig.baseUrl}/workspace/tasks${params}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  return handleResponse<TasksResponse>(response);
}

/**
 * Get Signals
 */
export async function getSignals(): Promise<SignalsResponse> {
  const response = await fetch(`${defaultConfig.baseUrl}/workspace/signals`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  return handleResponse<SignalsResponse>(response);
}

/**
 * Complete a task
 */
export async function completeTask(taskId: string): Promise<void> {
  const response = await fetch(`${defaultConfig.baseUrl}/workspace/tasks/${taskId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw await response.json();
  }
}

// ============================================================================
// L2 Twin APIs (Separate overlay)
// ============================================================================

/**
 * Ask Twin - natural language query
 * L2 overlay, separate from workspace
 */
export async function askTwin(question: string): Promise<{
  answer: string;
  sources?: Array<{ type: string; name: string }>;
  followUpQuestions?: string[];
}> {
  const response = await fetch(`${defaultConfig.baseUrl}/twin/ask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  return handleResponse(response);
}

/**
 * Get Twin prediction
 */
export async function getTwinPrediction(
  context: "renewal" | "expansion" | "risk",
  subject: string
): Promise<{
  prediction: string;
  confidence: string;
  factors: string[];
}> {
  const response = await fetch(`${defaultConfig.baseUrl}/twin/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ context, subject }),
  });

  return handleResponse(response);
}

// ============================================================================
// Real-Time: WebSocket
// ============================================================================

interface WebSocketHandlers {
  onSignal?: (signal: { title: string; message: string; severity: string }) => void;
  onAlert?: (alert: { message: string; severity: string }) => void;
  onRefresh?: (reason: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function createWorkspaceWebSocket(handlers: WebSocketHandlers): WebSocket {
  const ws = new WebSocket(`wss://${window.location.host}/api/v1/workspace/stream`);

  ws.onopen = () => {
    // Authenticate
    ws.send(
      JSON.stringify({
        type: "auth",
        token: getAuthToken(),
      })
    );
    handlers.onConnect?.();
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case "signal":
        handlers.onSignal?.(message.payload);
        break;
      case "alert":
        handlers.onAlert?.(message.payload);
        break;
      case "refresh":
        handlers.onRefresh?.(message.payload.reason);
        break;
      case "pong":
        // Heartbeat
        break;
    }
  };

  ws.onclose = () => {
    handlers.onDisconnect?.();
  };

  // Heartbeat
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping" }));
    }
  }, 30000);

  ws.addEventListener("close", () => clearInterval(heartbeat));

  return ws;
}

// ============================================================================
// Helpers
// ============================================================================

function getAuthToken(): string {
  // Get from your auth store/context
  return localStorage.getItem("auth_token") || "";
}

// ============================================================================
// React Hooks (example usage)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useTodayView(date?: string) {
  return useQuery({
    queryKey: ["today", date],
    queryFn: () => getTodayView({ date }),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useAccountsList(filters?: ViewFilter[]) {
  return useQuery({
    queryKey: ["accounts", filters],
    queryFn: () => getAccountsList({ filters }),
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["today"] });
    },
  });
}

// ============================================================================
// IMPORTANT: NO SYNC-RELATED APIS
// ============================================================================

// ❌ NO: getSyncStatus()
// ❌ NO: triggerSync()
// ❌ NO: getConnectorConfig()
// ❌ NO: getSchema()

// All sync happens automatically in backend based on plan/accelerator
// Frontend only sees data freshness indicators ("Updated 2 min ago")
