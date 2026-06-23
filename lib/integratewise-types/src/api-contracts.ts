/**
 * Frontend-Backend API Contracts
 *
 * STRICT SEPARATION: Schema is Backend IP
 * Frontend NEVER sees: entity_type, field names, schema structure
 * Frontend ONLY sees: Organic views, natural language, UX-optimized data
 */

// ============================================================================
// REQUEST TYPES (Frontend → Backend)
// ============================================================================

/** Generic view filter - schema-agnostic */
export interface ViewFilter {
  /** Filter category (not field name) */
  type: "priority" | "status" | "owner" | "time" | "health" | "revenue";
  /** Filter value */
  value: string;
  /** Comparison operator */
  operator?: "eq" | "ne" | "gt" | "lt" | "in";
}

/** Sort specification */
export interface ViewSort {
  /** Sort field (display concept, not schema field) */
  by: "name" | "health" | "revenue" | "activity" | "risk" | "date";
  /** Sort direction */
  direction: "asc" | "desc";
}

/** Pagination */
export interface ViewPagination {
  page: number;
  limit: number;
}

// ========================================
// Workspace (L1) Requests
// ========================================

/** Today view request */
export interface GetTodayRequest {
  /** Optional date override (ISO) */
  date?: string;
  /** Predefined view filters */
  view?: "morning" | "afternoon" | "evening" | "custom";
}

/** Accounts list request */
export interface GetAccountsRequest {
  filters?: ViewFilter[];
  sort?: ViewSort;
  pagination?: ViewPagination;
  /** Include inactive accounts */
  includeInactive?: boolean;
}

/** Account detail request */
export interface GetAccountDetailRequest {
  /** Opaque account ID */
  accountId: string;
}

/** Tasks list request */
export interface GetTasksRequest {
  filters?: ViewFilter[];
  sort?: ViewSort;
  pagination?: ViewPagination;
}

// ========================================
// Twin (L2) Requests
// ========================================

/** Twin prediction request */
export interface TwinPredictionRequest {
  /** Prediction context */
  context: "renewal" | "expansion" | "risk" | "forecast" | "health";
  /** Subject reference (opaque) */
  subject: string;
  /** Time horizon */
  horizon?: "30d" | "90d" | "1y";
  /** Additional context */
  details?: string;
}

/** Twin simulation request */
export interface TwinSimulationRequest {
  /** Base scenario */
  baseline: string;
  /** What-if changes */
  changes: Array<{
    action: string;
    impact: string;
  }>;
}

/** Natural language query */
export interface TwinAskRequest {
  /** Natural language question */
  question: string;
  /** Conversation context */
  conversationId?: string;
}

// ============================================================================
// RESPONSE TYPES (Backend → Frontend)
// ============================================================================

// ========================================
// Workspace (L1) Responses
// ========================================

/** Today view response - main dashboard */
export interface TodayViewResponse {
  /** Date context */
  date: string;
  /** Summary cards */
  summary: TodaySummary;
  /** Action items */
  actions: ActionItem[];
  /** Alerts requiring attention */
  alerts: Alert[];
  /** Quick stats */
  stats: TodayStats;
}

/** Today summary cards */
export interface TodaySummary {
  /** Portfolio health */
  health: HealthSummary;
  /** Revenue pipeline */
  pipeline: PipelineSummary;
  /** Task load */
  tasks: TaskSummary;
  /** Recent activity */
  activity: ActivitySummary;
}

/** Health summary - natural language */
export interface HealthSummary {
  /** Display score ("85%") */
  score: string;
  /** Status label */
  label: "Healthy" | "At Risk" | "Critical" | "Needs Attention";
  /** Trend direction */
  trend: "up" | "down" | "stable";
  /** Change description */
  change: string;
  /** Additional context */
  details?: string;
  /** Segment breakdown (optional) */
  segments?: Array<{
    name: string;
    health: string;
    count: number;
  }>;
}

/** Pipeline summary */
export interface PipelineSummary {
  /** At risk amount (formatted) */
  atRisk: string;
  /** Renewal amount this quarter */
  renewingThisQuarter: string;
  /** Expansion opportunities */
  expansionOpps: string;
  /** Trend */
  trend: "improving" | "stable" | "declining";
}

/** Task summary */
export interface TaskSummary {
  /** Tasks due today */
  dueToday: number;
  /** Overdue tasks */
  overdue: number;
  /** Completed today */
  completedToday: number;
  /** Upcoming this week */
  upcomingThisWeek: number;
}

/** Activity summary */
export interface ActivitySummary {
  /** Recent touchpoints */
  recentTouches: number;
  /** Accounts without recent activity */
  staleAccounts: number;
  /** Meetings today */
  meetingsToday: number;
}

/** Action item - actionable UX */
export interface ActionItem {
  /** Opaque ID */
  id: string;
  /** Action title */
  title: string;
  /** Priority level */
  priority: "urgent" | "high" | "normal" | "low";
  /** Due description */
  due: string;
  /** Context for the action */
  context: string;
  /** Suggested action */
  suggestedAction: {
    type: "call" | "email" | "meet" | "review" | "prepare";
    label: string;
    /** Deep link */
    href?: string;
  };
  /** Related entity display name */
  relatedTo?: string;
}

/** Alert - signal translated to UX */
export interface Alert {
  /** Opaque ID */
  id: string;
  /** Severity */
  severity: "critical" | "warning" | "info" | "success";
  /** Alert message (natural language) */
  message: string;
  /** Suggested action */
  suggestion?: string;
  /** Can user dismiss */
  dismissable: boolean;
  /** Timestamp */
  timestamp: string;
  /** Related actions */
  actions?: Array<{
    label: string;
    href: string;
  }>;
}

/** Today's stats */
export interface TodayStats {
  /** Total accounts */
  totalAccounts: number;
  /** Accounts touched this week */
  touchedThisWeek: number;
  /** Response rate */
  responseRate: string;
  /** Avg time to respond */
  avgResponseTime: string;
}

// ----------------------------------------
// Accounts List Response
// ----------------------------------------

/** Accounts list response */
export interface AccountsListResponse {
  /** Accounts (organic view) */
  accounts: AccountListItem[];
  /** Pagination */
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  /** Available filters */
  availableFilters: FilterOption[];
}

/** Account in list view */
export interface AccountListItem {
  /** Opaque ID */
  id: string;
  /** Display name */
  name: string;
  /** Health display */
  health: {
    score: string;
    label: string;
    trend: "up" | "down" | "stable";
  };
  /** Revenue display */
  revenue: {
    amount: string;
    trend: "up" | "down" | "stable";
  };
  /** Stage/phase */
  stage: string;
  /** Owner name */
  owner: string;
  /** Last activity */
  lastActivity: string;
  /** Next scheduled action */
  nextAction?: {
    type: string;
    due: string;
  };
  /** Risk indicators */
  risks?: string[];
  /** Quick actions */
  actions: Array<{
    type: "call" | "email" | "view";
    href: string;
  }>;
}

/** Filter option for UI */
export interface FilterOption {
  type: string;
  label: string;
  options: Array<{
    value: string;
    label: string;
    count?: number;
  }>;
}

// ----------------------------------------
// Account Detail Response
// ----------------------------------------

/** Account detail response */
export interface AccountDetailResponse {
  /** Account identity */
  identity: {
    id: string;
    name: string;
    logo?: string;
    industry?: string;
    size?: string;
  };
  /** Health timeline */
  health: {
    current: HealthSummary;
    history: Array<{
      date: string;
      score: string;
      label: string;
    }>;
  };
  /** Revenue details */
  revenue: {
    current: string;
    trend: string;
    history: Array<{
      period: string;
      amount: string;
    }>;
  };
  /** Key contacts */
  contacts: Array<{
    id: string;
    name: string;
    role: string;
    email?: string;
    isPrimary: boolean;
  }>;
  /** Recent activity */
  recentActivity: ActivityItem[];
  /** Upcoming events */
  upcoming: Array<{
    type: string;
    date: string;
    description: string;
  }>;
  /** Active risks */
  risks: Array<{
    id: string;
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    description: string;
  }>;
  /** Tasks for this account */
  tasks: ActionItem[];
}

/** Activity item */
export interface ActivityItem {
  id: string;
  type: "email" | "call" | "meeting" | "note" | "task";
  description: string;
  timestamp: string;
  by: string;
  outcome?: string;
}

// ----------------------------------------
// Tasks Response
// ----------------------------------------

/** Tasks list response */
export interface TasksResponse {
  tasks: TaskItem[];
  groups: Array<{
    label: string;
    count: number;
  }>;
}

/** Task item */
export interface TaskItem {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "urgent" | "high" | "normal" | "low";
  due: string;
  relatedTo?: {
    type: string;
    name: string;
  };
  actions: Array<{
    type: "complete" | "snooze" | "delegate";
    label: string;
  }>;
}

// ----------------------------------------
// Signals Response
// ----------------------------------------

/** Signals response */
export interface SignalsResponse {
  /** Critical signals */
  critical: Alert[];
  /** Warning signals */
  warnings: Alert[];
  /** Informational */
  info: Alert[];
  /** Recently resolved */
  resolved: Alert[];
}

// ========================================
// Twin (L2) Responses
// ========================================

/** Twin prediction response */
export interface TwinPredictionResponse {
  /** Prediction result (natural language) */
  prediction: string;
  /** Confidence level */
  confidence: string;
  /** Contributing factors */
  factors: string[];
  /** Key metrics */
  metrics?: Array<{
    name: string;
    value: string;
    trend: "up" | "down" | "stable";
  }>;
  /** Recommended actions */
  recommendations: string[];
  /** Simulation results */
  simulations?: Array<{
    scenario: string;
    outcome: string;
    confidence: string;
  }>;
}

/** Twin simulation response */
export interface TwinSimulationResponse {
  /** Baseline scenario */
  baseline: {
    description: string;
    projectedOutcome: string;
  };
  /** Alternative scenarios */
  alternatives: Array<{
    changes: string[];
    projectedOutcome: string;
    confidence: string;
    impact: string;
  }>;
  /** Recommendation */
  recommendation: string;
}

/** Twin ask/chat response */
export interface TwinAskResponse {
  /** Response text */
  answer: string;
  /** Citations/references */
  sources?: Array<{
    type: string;
    name: string;
    href?: string;
  }>;
  /** Follow-up suggestions */
  followUpQuestions?: string[];
  /** Related actions */
  suggestedActions?: Array<{
    label: string;
    href: string;
  }>;
  /** Conversation ID for continuity */
  conversationId: string;
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/** API error response */
export interface ApiErrorResponse {
  /** Error code */
  code: ApiErrorCode;
  /** Human-readable message */
  message: string;
  /** Suggested action */
  action?: "retry" | "upgrade" | "refresh" | "contact_support";
  /** Retry after (seconds) */
  retryAfter?: number;
}

/** Error codes */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "QUOTA_EXCEEDED"
  | "SYNC_IN_PROGRESS"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

// ============================================================================
// REAL-TIME MESSAGES (WebSocket)
// ============================================================================

/** WebSocket message from backend */
export interface WebSocketMessage {
  type: "signal" | "alert" | "refresh" | "ping";
  payload: WebSocketPayload;
  timestamp: string;
}

/** WebSocket payload variants */
export type WebSocketPayload =
  | SignalWebSocketPayload
  | AlertWebSocketPayload
  | RefreshWebSocketPayload
  | PingWebSocketPayload;

/** Signal payload */
export interface SignalWebSocketPayload {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  action?: {
    label: string;
    href: string;
  };
}

/** Alert payload */
export interface AlertWebSocketPayload {
  alertId: string;
  message: string;
  severity: "critical" | "warning" | "info";
  dismissable: boolean;
}

/** Refresh payload */
export interface RefreshWebSocketPayload {
  reason: "data_updated" | "sync_completed" | "new_signal";
  affectedViews: string[];
}

/** Ping payload */
export interface PingWebSocketPayload {
  timestamp: number;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/** Validate response contains no schema leakage */
export function validateNoSchemaExposure(response: unknown): void {
  const json = JSON.stringify(response);
  const forbidden = [
    "entity_type",
    "health_score",
    "arr",
    "mrr",
    "external_id",
    "spine_",
    "schema_",
    "field_mapping",
  ];

  for (const term of forbidden) {
    if (json.includes(term)) {
      throw new Error(`Schema exposure detected: ${term}`);
    }
  }
}
