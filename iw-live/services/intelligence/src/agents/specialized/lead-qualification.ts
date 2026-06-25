import { WorkflowStep } from "cloudflare:workers";
import { BaseAgent } from "../base";
import { AgentTask, AgentResult, IntelligenceEnv } from "../types";

export class LeadQualificationAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "lead_qualification",
      `You are the Lead Qualification Agent for IntegrateWise.
Your role is to score incoming leads based on their profile data (budget, timeline, use case, company size, etc.).

Analyze the lead payload and output a structured JSON evaluation:
{
  "score": <0-100>,
  "reason": "<Brief explanation of the score>",
  "tier": "<HOT | WARM | COLD>"
}

Scoring criteria:
- Budget > $5k/mo or Enterprise -> +30
- Timeline < 1 month -> +20
- High Intent Use Case -> +25
- Company Size > 50 -> +25

Tiers:
- HOT: score >= 70
- WARM: score >= 40 and < 70
- COLD: score < 40`
    );
  }

  async execute(task: AgentTask, step: WorkflowStep): Promise<AgentResult> {
    const rawPayload = task.context.payload;

    // Step 1: AI Evaluation
    const evaluation = await step.do(`evaluate-lead-${task.taskId}`, async (): Promise<any> => {
      const result = await this.think(
        [
          {
            role: "user",
            content: `Evaluate this lead:\n${JSON.stringify(rawPayload, null, 2)}`,
          },
        ],
        task
      );

      try {
        const parsed = JSON.parse(result);
        return parsed;
      } catch (e) {
        // Fallback extraction
        const match = result.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error("Failed to parse AI evaluation");
      }
    });

    // Step 2: Formulate the Action Plan (Playbook)
    let actionPlan = [];
    if (evaluation.tier === "HOT") {
      actionPlan.push({
        type: "upsert",
        target: "crm_surface",
        intent: "upsert_lead",
        params: { ...(rawPayload as object), status: "Qualified" },
      });
      actionPlan.push({
        type: "notify",
        target: "messaging_surface",
        intent: "notify_team",
        params: {
          priority: "urgent",
          message: `Hot Lead: ${evaluation.score} - ${evaluation.reason}`,
        },
      });
      actionPlan.push({
        type: "create",
        target: "task_surface",
        intent: "create_task",
        params: { title: "Follow up with Hot Lead", priority: "high" },
      });
    } else if (evaluation.tier === "WARM") {
      actionPlan.push({
        type: "upsert",
        target: "crm_surface",
        intent: "upsert_lead",
        params: { ...(rawPayload as object), status: "Nurture" },
      });
      actionPlan.push({
        type: "create",
        target: "database_surface",
        intent: "create_record",
        params: { collection: "warm_leads", data: rawPayload },
      });
    } else {
      actionPlan.push({
        type: "create",
        target: "database_surface",
        intent: "create_record",
        params: { collection: "cold_leads", data: rawPayload },
      });
    }

    return {
      agentId: this.agentId,
      output: {
        evaluation,
        actionPlan,
      },
      confidence: 0.95,
      reasoning: `Lead scored as ${evaluation.tier} (${evaluation.score}).`,
      nextAction: actionPlan.length > 0 ? "executor" : undefined,
    };
  }
}
