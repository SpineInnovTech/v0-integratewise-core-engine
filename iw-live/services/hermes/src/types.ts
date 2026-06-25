/**
 * Hermes — Execution Layer Types
 *
 * Core type definitions for the orchestration intelligence worker.
 * Bridges approved actions → execution → outcome recording.
 */

// ─── Execution Domain ───────────────────────────────────────────────────────

export type ExecutionStatus =
  | "pending"
  | "queued"
  | "orchestrating"
  | "running"
  | "awaiting_hitl"
  | "completed"
  | "failed"
  | "cancelled"
  | "fallback";

export type ExecutorBackend = "n8n" | "durable_object" | "direct" | "queued";

export interface ExecutionTask {
  taskId: string;
  actionId: string;
  tenantId: string;
  userId: string;
  status: ExecutionStatus;
  backend: ExecutorBackend;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  payload: ExecutionPayload;
  outcome?: ExecutionOutcome;
  error?: ExecutionError;
  lineage: ExecutionLineage;
}

export interface ExecutionPayload {
  actionType: string;
  targetTool?: string;
  entityType?: string;
  entityId?: string;
  params: Record<string, unknown>;
  approvalToken: string;
  priority?: "low" | "medium" | "high" | "critical";
  timeoutMs?: number;
}

export interface ExecutionOutcome {
  success: boolean;
  data?: unknown;
  spineWrites?: SpineWrite[];
  couchDbWrites?: CouchDbWrite[];
  notifications?: Notification[];
}

export interface ExecutionError {
  code: string;
  message: string;
  retryable: boolean;
  detail?: unknown;
}

export interface ExecutionLineage {
  parentTaskId?: string;
  rootSessionId?: string;
  correlationId: string;
  trace: LineageStep[];
}

export interface LineageStep {
  at: string;
  service: string;
  action: string;
  status: string;
}

export interface SpineWrite {
  entityType: string;
  entityId: string;
  operation: "create" | "update" | "delete";
  fields: Record<string, unknown>;
}

export interface CouchDbWrite {
  db: string;
  docId: string;
  docType: string;
}

export interface Notification {
  channel: "sse" | "websocket" | "slack" | "email";
  recipient: string;
  message: string;
}

// ─── Orchestration Domain ───────────────────────────────────────────────────

export interface OrchestrationRequest {
  workflowId?: string;
  workflowName?: string;
  nodes: OrchestrationNode[];
  edges: OrchestrationEdge[];
  trigger: OrchestrationTrigger;
  credentials?: Record<string, string>;
}

export interface OrchestrationNode {
  id: string;
  type: string;
  name: string;
  parameters: Record<string, unknown>;
  position?: [number, number];
}

export interface OrchestrationEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface OrchestrationTrigger {
  type: "webhook" | "schedule" | "manual" | "approval";
  payload?: Record<string, unknown>;
}

export interface OrchestrationResult {
  executionId: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  nodeResults?: NodeResult[];
  output?: unknown;
  error?: ExecutionError;
}

export interface NodeResult {
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  output?: unknown;
  error?: ExecutionError;
  retryCount?: number;
}

// ─── Stream Domain ──────────────────────────────────────────────────────────

export interface StreamEvent {
  event: "status" | "log" | "outcome" | "error" | "heartbeat";
  taskId: string;
  timestamp: string;
  data: unknown;
}

export interface StreamSubscriber {
  id: string;
  writable: WritableStreamDefaultWriter<string>;
  connectedAt: number;
}

// ─── n8n Domain ─────────────────────────────────────────────────────────────

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: Record<string, unknown>;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, { id: string; name: string }>;
}

export interface N8nConnections {
  [nodeName: string]: {
    main: Array<Array<{ node: string; type: string; index: number }>>;
  };
}

export interface N8nExecutionResponse {
  executionId: string;
  workflowId: string;
  status: "running" | "success" | "error" | "waiting";
  startedAt?: string;
  stoppedAt?: string;
  data?: unknown;
}

// ─── Durable Object State ───────────────────────────────────────────────────

export interface ExecutionEngineState {
  tasks: Map<string, ExecutionTask>;
  subscribers: Map<string, Set<string>>; // taskId -> subscriber IDs
}

export interface StreamHubState {
  streams: Map<string, StreamSubscriber[]>;
}
