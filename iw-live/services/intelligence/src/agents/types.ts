export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface InjectedAgentContext {
  // Model Tiering & Orchestration Directives
  pipelineLocation?: {
    pipelineName: string;
    currentStep: string;
    previousStep?: string;
    nextStep?: string;
  };
  payloadDeltas?: Record<string, any>; // Surface edits made by user

  // The 6 Cognitive Layers (Memory Propagation)
  layer_1_skills?: string[];
  layer_2_knowledge?: any[];
  layer_3_lineage?: { correlationId: string; trigger: string };
  layer_4_doctrines?: string[];
  layer_5_memory?: any[];
  layer_6_evolutionary_memory?: any[];

  // Legacy / Fallback properties
  [key: string]: unknown;
}

export interface AgentTask {
  taskId: string;
  tenantId: string;
  userId: string;
  sessionId?: string;
  lineageId?: string;
  sourceTrace?: string;
  objective: string;
  context: InjectedAgentContext;
  priority: "low" | "medium" | "high" | "critical";
  model?: string;
  provider?: string;
}

export interface AgentResult {
  agentId: string;
  output: unknown;
  confidence: number;
  reasoning: string;
  lineageId?: string;
  nextAction?: string;
}

// Ensure Env uses the unified Intelligence Env
import { Env } from "../index";
export type IntelligenceEnv = Env;

export interface BulkLoadTask {
  taskId: string;
  tenantId: string;
  userId: string;
  sourceType: string;
  records: Record<string, unknown>[];
  lineageId?: string;
}

export interface BulkLoadResult {
  taskId: string;
  processedCount: number;
  entitiesExtracted: number;
  errors: string[];
  status: "completed" | "failed" | "partial";
  lineageId?: string;
}
