export interface Env {
  // Durable Objects
  TWIN_STATE: DurableObjectNamespace;

  // Service Bindings
  INTELLIGENCE: Fetcher;
  MCP_CONNECTOR: Fetcher;
  PIPELINE: Fetcher;
  CONTINUITY: Fetcher;
  KNOWLEDGE?: Fetcher;

  // Queues
  PROPOSAL_QUEUE: Queue;
  ACT_QUEUE: Queue;
  COORDINATION_QUEUE?: Queue;
  EXECUTION_QUEUE?: Queue;

  // KV Namespaces
  CACHE: KVNamespace;
  TWIN_KV?: KVNamespace;

  // D1 Database
  D1: D1Database;

  // AI Bindings
  AI?: Ai;
  AI_SEARCH?: VectorizeIndex;
  AI_GATEWAY?: any;

  // Workflows
  MORNING_BRIEF?: any;
  SIGNAL_WORKFLOW?: any;
  ACT_WORKFLOW?: any;
}

export interface TwinContext {
  timestamp: string;
  memory: any;
  signals: any[];
  proposals: any[];
  spineChanges: any;
  operationsHealth: any;
  timeTriggers: any[];
}

export interface Reasoning {
  observations: string[];
  risks: string[];
  suggestedActions: ProposedAction[];
  priority: "critical" | "high" | "normal" | "low";
}

export interface ProposedAction {
  id: string;
  type:
    | "memory_update"
    | "signal_review"
    | "objective_check"
    | "governance_action"
    | "act_dispatch";
  target: string;
  reasoning: string;
  impact: string;
  risk: string;
  requiresApproval: boolean;
  suggestedApprover: "founder" | "governance_bot" | "auto";
}

export interface Proposal {
  id: string;
  action: ProposedAction;
  status: "pending" | "approved" | "rejected" | "executing" | "completed" | "failed";
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface TwinCheckpoint {
  lastObserveRun: string;
  pendingProposals: string[];
  lastMorningBrief: string;
  sessionId: string;
}
