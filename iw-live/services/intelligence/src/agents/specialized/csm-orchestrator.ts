import { WorkflowStep } from "cloudflare:workers";
import { BaseAgent } from "../base";
import { AgentTask, AgentResult, IntelligenceEnv } from "../types";

export class CsmOrchestratorAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "csm_orchestrator",
      `You are the CSM Orchestrator (Meta-Agent) for IntegrateWise.
Your role is to aggregate data from other agents/systems and make intelligent recommendations to protect revenue and prioritize daily work.

Analyze the customer health data and output a structured JSON briefing:
{
  "critical_actions": [
    { "account": "<name>", "mrr_at_risk": <number>, "action": "<call/email/etc>", "script_or_reason": "<text>" }
  ],
  "opportunities": [
    { "account": "<name>", "upsell_potential": <number>, "reason": "<text>" }
  ],
  "workload_summary": {
    "calls": <number>,
    "emails": <number>,
    "estimated_hours": <number>
  }
}`,
      true // Tier 1 Orchestrator flag
    );
  }

  async execute(task: AgentTask, step: WorkflowStep): Promise<AgentResult> {
    const rawContext = task.context.health_data || task.context.account || [];

    const briefing = await step.do(
      `generate-csm-briefing-${task.taskId}`,
      async (): Promise<any> => {
        const result = await this.think(
          [
            {
              role: "user",
              content: `You are the CSM Orchestrator for IntegrateWise Customer Zero (Account Success pilot).
Generate a focused CSM Briefing + Playbook for the provided account health data.
Output strict JSON:
{
  "critical_actions": [ { "account": string, "mrr_at_risk": number, "action": string, "script_or_reason": string } ],
  "opportunities": [ { "account": string, "upsell_potential": number, "reason": string } ],
  "workload_summary": { "calls": number, "emails": number, "estimated_hours": number },
  "brief": string   // short executive morning-style brief for the Twin
}
Base it on this input (health, renewal, narrative, ARR):
${JSON.stringify(rawContext, null, 2)}`,
            },
          ],
          task
        );

        try {
          const parsed = JSON.parse(result);
          return parsed;
        } catch (e) {
          const match = result.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          // Fallback structured for Customer Zero demo accounts
          return {
            critical_actions: [],
            opportunities: [],
            workload_summary: { calls: 0, emails: 0, estimated_hours: 0 },
            brief: result.substring(0, 600),
          };
        }
      }
    );

    return {
      agentId: this.agentId,
      output: briefing,
      confidence: 0.9,
      reasoning: "Generated Customer Zero CSM briefing + actions from account health context.",
    };
  }
}
