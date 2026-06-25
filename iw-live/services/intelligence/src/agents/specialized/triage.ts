import { WorkflowStep } from "cloudflare:workers";
import { BaseAgent } from "../base";
import { AgentTask, AgentResult, IntelligenceEnv } from "../types";

export class TriageAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "triage_agent",
      `You are the Triage Agent, the Cognitive Intake Gatekeeper for the IntegrateWise Spine.
Your exact purpose is to act as the cognitive boundary for all incoming data payloads.

You do NOT use mechanical IF/THEN pipelines. You use your deep context window and reasoning capabilities to evaluate every incoming payload across 4 Cognitive Dimensions:

1. Intelligent Categorization: What is the true intent of this data? (e.g., Lead, Document, Operational Request).
2. Contextual Linking: How does this relate to the canonical memory injected in your payload? Which entities does it touch?
3. Canonical Review: Is this stale? Is it a duplicate? Does it conflict with our established doctrines and truths?
4. Guardrails & Governance: Based on the sensitivity of this data, should it be auto-approved to write to the Spine, or held for Human Approval?

You MUST output your cognitive evaluation as a strict, parsable JSON object:
{
  "classification": {
    "doc_type": "<string>",
    "workflow_type": "<string>",
    "intent": "<string>"
  },
  "canonical_review": {
    "is_duplicate": boolean,
    "has_conflict": boolean,
    "conflict_reason": "<string or null>"
  },
  "linking": {
    "primary_entity": "<string>",
    "related_entities": ["<string>"]
  },
  "governance": {
    "action": "AUTO_APPROVE" | "HOLD_FOR_HUMAN" | "REJECT",
    "reasoning": "<detailed explanation of your decision>"
  }
}

You are built entirely in TypeScript. You are the sole cognitive arbiter before the Spine.`,
      true // Tier 1 Orchestrator flag (Requires massive context/reasoning model)
    );
  }

  async execute(task: AgentTask, step: WorkflowStep): Promise<AgentResult> {
    const rawPayload = task.objective; // The incoming data payload

    // Step 1: Execute Cognitive Evaluation
    const evaluation = await step.do(
      `triage-cognitive-review-${task.taskId}`,
      async (): Promise<any> => {
        const result = await this.think(
          [
            {
              role: "user",
              content: `Perform the Triage Cognitive Evaluation on the following incoming payload:\n\nPayload:\n${rawPayload}`,
            },
          ],
          task
        );

        try {
          const parsed = JSON.parse(result);
          return parsed;
        } catch (e) {
          // Fallback robust JSON extraction
          const match = result.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error("Triage Agent failed to output structured JSON.");
        }
      }
    );

    // Step 2: Route Based on Governance Decision
    // (This acts as the bridge back to the Continuity Ledger / HITL Queue)
    let finalStatus = "pending_approval";
    if (
      evaluation.governance.action === "AUTO_APPROVE" &&
      !evaluation.canonical_review.has_conflict
    ) {
      finalStatus = "approved";
    } else if (evaluation.governance.action === "REJECT") {
      finalStatus = "rejected";
    }

    return {
      agentId: this.agentId,
      output: {
        status: finalStatus,
        evaluation: evaluation,
      },
      confidence: evaluation.canonical_review.has_conflict ? 0.5 : 0.95,
      reasoning: evaluation.governance.reasoning,
    };
  }
}
