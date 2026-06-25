export interface ChatParams {
  message: string;
  session_id?: string;
  agent_id?: string;
  use_knowledge?: boolean;
  history?: Array<{ role: string; content: string }>;
}

export interface ExecutionHandoff {
    id: string;
    version: string;
    source: string;
    tenantId: string;
    createdAt: string;
    status: string;
    title: string;
    workflows: string[];
    tools: string[];
    executionInstructions: string;
    relatedProposalIds: string[];
    contextSummary: string;
    note: string;
    lineage: {
      proposedBy: string;
      approved: boolean;
      exportedAt: string;
    };
  }

  export interface TwinState {
  tenant_id: string;
  user_id: string;
  session_id?: string;
  last_brief?: string;
  last_reasoning?: string;
  active_proposals: Array<{
    id: string;
    title: string;
    summary: string;
    confidence: number;
    status: "proposed" | "in_review" | "approved" | "rejected" | "executed";
    created_at: string;
  }>;
  handoffs?: ExecutionHandoff[];
  last_message?: string;
  last_reply?: string;
  context_hits: number;
  updated_at: string;

  learned_profile?: {
    recent_lessons: string[];
    focus_priorities: string[];
    communication_style: string;
    success_patterns: string[];
    risk_tolerance_signals: string[];
    last_daily_reflection: string;
    profile_version: number;
  };

  outcome_history?: Array<{
    proposal_id?: string;
    outcome: "success" | "partial" | "failure" | "blocked";
    notes?: string;
    user_reaction?: string;
    at: string;
  }>;
  reflection_history?: Array<{
    at: string;
    lessons_count: number;
    synthesis?: string;
    profile_version: number;
  }>;
  last_reflection_at?: string;
}

export interface Env {
  // Durable Object namespaces
  TWIN_AGENT: DurableObjectNamespace;
  TENANT_BRAIN: DurableObjectNamespace;

  // Databases & storage
  D1: D1Database;
  CACHE: KVNamespace;
  AI: any; // Cloudflare Workers AI

  // Live Service bindings (Worker-to-Worker) — all Cloudflare only.
  // Twin runtime: 100% CF (no Hostinger VPS, no external agents).
  INTELLIGENCE: Fetcher;
  PIPELINE: Fetcher;
  CONTINUITY: Fetcher;
  CONNECTOR: Fetcher;
  KNOWLEDGE: Fetcher;

  // Variables
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  DEFAULT_TENANT_ID: string;
  DEFAULT_CHAT_MODEL: string;

  // Optional JWT Secret for validating inbound tenant connections
  JWT_SECRET?: string;
}

export interface SessionLogParams {
  session_id: string;
  agent_id: string;
  content: string;
  kind?:
    | "ai_chat"
    | "twin_session"
    | "twin_reflection"
    | "twin_learning"
    | "worker_handoff"
    | "ingest"
    | "manual";
}

export interface EcosystemCallParams {
  tenant_id?: string;
  target:
    | "intelligence"
    | "ai-gateway"
    | "continuity"
    | "memory-pipeline"
    | "mcp"
    | "connector"
    | "spine"
    | "pipeline"
    | "ai-search";
  action?: string;
  params?: Record<string, unknown>;
}
