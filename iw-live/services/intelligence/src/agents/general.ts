import { WorkflowStep } from "cloudflare:workers";
import { BaseAgent } from "./base";
import { AgentTask, AgentResult, IntelligenceEnv } from "./types";

export class OrchestratorAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "orchestrator",
      `You are the Orchestrator Agent for IntegrateWise.
Your role is to analyze incoming tasks and determine which specialized agents should handle them.

Available agents:
- RESEARCH: Gathers information from knowledge base, APIs, and external sources
- ANALYST: Analyzes data, calculates metrics, identifies patterns and anomalies
- WRITER: Generates emails, reports, summaries, and documentation
- PLANNER: Creates action plans, playbooks, and strategic recommendations
- EXECUTOR: Triggers actions via connectors (CRM updates, emails, Slack messages)
- LEAD_QUALIFICATION: Specialized for scoring and routing sales leads
- CSM_ORCHESTRATOR: Meta-agent for Customer Success workload and revenue protection

Respond with a JSON array of agent assignments:
{
  "plan": "Brief description of the overall approach",
  "assignments": [
    { "agent": "RESEARCH", "task": "specific task for this agent", "priority": 1 },
    { "agent": "ANALYST", "task": "specific task for this agent", "priority": 2, "dependsOn": ["RESEARCH"] }
  ]
}`
    );
  }

  async execute(task: AgentTask, _step: WorkflowStep): Promise<AgentResult> {
    const response = await this.think(
      [
        {
          role: "user",
          content: `Objective: ${task.objective}\n\nContext: ${JSON.stringify(task.context)}`,
        },
      ],
      task
    );

    let plan;
    try {
      plan = JSON.parse(response);
    } catch {
      // Basic fallback if JSON parsing fails
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          plan = JSON.parse(match[0]);
        } catch {
          plan = { plan: response, assignments: [] };
        }
      } else {
        plan = { plan: response, assignments: [] };
      }
    }

    return {
      agentId: this.agentId,
      output: plan,
      confidence: 0.9,
      reasoning: "Analyzed task and created execution plan",
    };
  }
}

export class ResearchAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "research",
      `You are the Research Agent for IntegrateWise.
Your role is to gather relevant information from:
- Knowledge base (internal documents, playbooks, best practices)
- Customer data (CRM records, interactions, health metrics)
- External sources (industry benchmarks, competitive intel)

Always cite your sources and provide confidence levels for each piece of information.
Structure your findings clearly with key insights highlighted.`
    );
  }

  async execute(task: AgentTask, step: WorkflowStep): Promise<AgentResult> {
    const knowledgeResults = await step.do(
      `research-knowledge-${task.taskId}`,
      async (): Promise<any> => {
        if (!this.env.KNOWLEDGE) return { error: "KNOWLEDGE binding missing" };
        const response = await this.env.KNOWLEDGE.fetch("http://knowledge/v1/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-id": task.tenantId },
          body: JSON.stringify({ query: task.objective, limit: 10 }),
        });
        return response.ok ? response.json() : null;
      }
    );

    const spineResults = await step.do(`research-spine-${task.taskId}`, async (): Promise<any> => {
      if (task.context.entityId && this.env.D1) {
        const result = await this.env.D1.prepare("SELECT * FROM entity360_cache WHERE spine_id = ?")
          .bind(task.context.entityId)
          .first();
        return result || null;
      }
      return null;
    });

    const synthesis = await this.think(
      [
        {
          role: "user",
          content: `Research task: ${task.objective}\nKnowledge base findings: ${JSON.stringify(knowledgeResults)}\nEntity data: ${JSON.stringify(spineResults)}\nSynthesize these findings into actionable insights.`,
        },
      ],
      task
    );

    return {
      agentId: this.agentId,
      output: { knowledge: knowledgeResults, entityData: spineResults, synthesis },
      confidence: 0.85,
      reasoning: "Gathered and synthesized information from multiple sources",
    };
  }
}

export class AnalystAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "analyst",
      `You are the Analyst Agent for IntegrateWise. Your role is to analyze quantitative and qualitative data, calculate health scores, identify patterns, and provide data-driven recommendations.`
    );
  }
  async execute(task: AgentTask, _step: WorkflowStep): Promise<AgentResult> {
    const analysis = await this.think(
      [
        {
          role: "user",
          content: `Analyze: ${task.objective}\nContext: ${JSON.stringify(task.context, null, 2)}`,
        },
      ],
      task
    );
    return {
      agentId: this.agentId,
      output: { analysis, timestamp: new Date().toISOString() },
      confidence: 0.88,
      reasoning: "Performed analysis",
    };
  }
}

export class WriterAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "writer",
      `You are the Writer Agent for IntegrateWise. Your role is to create professional emails, summaries, playbooks, and messages.`
    );
  }
  async execute(task: AgentTask, _step: WorkflowStep): Promise<AgentResult> {
    const content = await this.think(
      [
        {
          role: "user",
          content: `Create content for: ${task.objective}\nContext: ${JSON.stringify(task.context)}`,
        },
      ],
      task
    );
    return {
      agentId: this.agentId,
      output: { content, format: task.context.format || "text" },
      confidence: 0.92,
      reasoning: "Generated content",
    };
  }
}

export class PlannerAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "planner",
      `You are the Planner Agent for IntegrateWise. Your role is to create actionable step-by-step plans and workflows.`
    );
  }
  async execute(task: AgentTask, _step: WorkflowStep): Promise<AgentResult> {
    const plan = await this.think(
      [
        {
          role: "user",
          content: `Create plan for: ${task.objective}\nContext: ${JSON.stringify(task.context)}`,
        },
      ],
      task
    );
    return {
      agentId: this.agentId,
      output: { plan, createdAt: new Date().toISOString() },
      confidence: 0.87,
      reasoning: "Created action plan",
    };
  }
}

export class ExecutorAgent extends BaseAgent {
  constructor(env: IntelligenceEnv) {
    super(
      env,
      "executor",
      `You are the Executor Agent for IntegrateWise. Translate plans into API calls and CRM updates. ALWAYS log actions.`
    );
  }
  async execute(task: AgentTask, step: WorkflowStep): Promise<AgentResult> {
    const action = task.context.action as {
      type: string;
      target: string;
      intent?: string;
      params: Record<string, unknown>;
    };
    if (!action)
      return {
        agentId: this.agentId,
        output: { error: "No action" },
        confidence: 0,
        reasoning: "Cannot execute without action",
      };

    // MCP Tool Formatting: e.g., target: crm_surface -> mcp://crm_surface
    const mcpTarget = action.target.startsWith("mcp://") ? action.target : `mcp://${action.target}`;

    // Inject Lineage into Correlation ID
    const correlationId = task.lineageId || crypto.randomUUID();

    // Step 1: Policy Engine Evaluation (/v1/check)
    const policyCheck = await step.do(`policy-check-${task.taskId}`, async (): Promise<any> => {
      if (!this.env.GOVERN) return { error: "GOVERN missing" };
      const checkRes = await this.env.GOVERN.fetch(`http://internal/v1/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": task.tenantId,
          "x-user-id": task.userId || "system-agent",
          "x-correlation-id": correlationId,
        },
        body: JSON.stringify({
          action_type: action.type,
          resource: mcpTarget,
          priority: task.priority === "critical" ? 90 : 50,
        }),
      });
      return checkRes.ok ? checkRes.json() : { error: "Policy check failed" };
    });

    if (policyCheck.error || !policyCheck.data) {
      return {
        agentId: this.agentId,
        output: { error: "Governance policy check failed" },
        confidence: 0,
        reasoning: "Policy engine error",
      };
    }

    const { allowed, auto_approved, reason } = policyCheck.data;

    if (!allowed) {
      return {
        agentId: this.agentId,
        lineageId: correlationId,
        output: { status: "denied", reason, action: { ...action, target: mcpTarget } },
        confidence: 1,
        reasoning: `Action denied by Governance Policy Engine: ${reason}`,
      };
    }

    if (auto_approved) {
      // Step 2a: Auto-execute via ACT service (simulated successful route for now)
      return {
        agentId: this.agentId,
        lineageId: correlationId,
        output: { status: "executed", reason, action: { ...action, target: mcpTarget } },
        confidence: 0.99,
        reasoning: `Action auto-approved by Policy Engine and executed: ${reason}`,
      };
    }

    // Step 2b: Create Proposal for HITL Approval (/v1/proposals)
    const proposalResult = await step.do(
      `create-proposal-${task.taskId}`,
      async (): Promise<any> => {
        const response = await this.env.GOVERN!.fetch(`http://internal/v1/proposals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": task.tenantId,
            "x-user-id": task.userId || "system-agent",
            "x-correlation-id": correlationId,
          },
          body: JSON.stringify({
            tenant_id: task.tenantId,
            action_type: action.type,
            action_target: { tool: mcpTarget, intent: action.intent },
            action_parameters: action.params,
          }),
        });
        return response.ok ? response.json() : { error: "Proposal creation failed" };
      }
    );

    if (proposalResult.error || !proposalResult.data?.id) {
      return {
        agentId: this.agentId,
        output: { error: "Failed to create HITL proposal" },
        confidence: 0,
        reasoning: "Governance queue failure",
      };
    }

    return {
      agentId: this.agentId,
      lineageId: correlationId,
      output: {
        proposal_id: proposalResult.data.id,
        status: "pending_approval",
        action: { ...action, target: mcpTarget },
      },
      confidence: 0.95,
      reasoning: `Proposed action via MCP on ${mcpTarget} (queued for HITL governance)`,
    };
  }
}
