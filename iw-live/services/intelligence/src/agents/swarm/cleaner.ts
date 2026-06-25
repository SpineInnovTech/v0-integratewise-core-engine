import { WorkflowStep } from "cloudflare:workers";
import { BaseAgent } from "../base";
import { AgentTask, AgentResult, IntelligenceEnv } from "../types";

export class DataCleanerAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "data_cleaner",
      `You are the Bulk Data Cleaner Agent. Your job is to parse raw JSON/CSV records, fix malformed data, extract PII safely, and format them into a structured schema.`
    );
  }

  async execute(task: AgentTask, step: WorkflowStep): Promise<AgentResult> {
    const records = task.context.records as any[];
    if (!records)
      return {
        agentId: this.agentId,
        output: { error: "No records to clean" },
        confidence: 0,
        reasoning: "Missing records",
      };

    const cleaned = await step.do(`clean-${task.taskId}`, async () => {
      // Simulate calling an LLM or using a rule-engine to clean data
      return records.map((r) => ({
        ...r,
        _cleaned: true,
        _normalized_at: new Date().toISOString(),
      }));
    });

    return {
      agentId: this.agentId,
      output: { cleanedData: cleaned },
      confidence: 0.9,
      reasoning: `Cleaned ${records.length} records in chunk.`,
    };
  }
}

export class EntityResolverAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "entity_resolver",
      `You are the Entity Resolver Agent. Your job is to cross-reference cleaned records against each other and the Spine to merge duplicate entities.`
    );
  }

  async execute(task: AgentTask, step: WorkflowStep): Promise<AgentResult> {
    const cleanedData = task.context.cleanedData as any[];
    if (!cleanedData)
      return {
        agentId: this.agentId,
        output: { error: "No cleaned data" },
        confidence: 0,
        reasoning: "Missing cleaned data",
      };

    const resolved = await step.do(`resolve-${task.taskId}`, async () => {
      // Simulate entity resolution logic (e.g., matching by email or external ID)
      return cleanedData.map((r) => ({
        ...r,
        spine_id: `ent_${Math.random().toString(36).substring(2, 9)}`,
        _resolved: true,
      }));
    });

    return {
      agentId: this.agentId,
      output: { resolvedEntities: resolved },
      confidence: 0.95,
      reasoning: `Resolved entities for ${cleanedData.length} records.`,
    };
  }
}
