import { Hono } from "hono";
import { IntelligenceEnv, AgentTask } from "./types";
import { BulkCleanupSwarmWorkflow } from "./bulk-swarm";
import { BaseAgent } from "./base";
import { ResearchAgent, AnalystAgent, WriterAgent, PlannerAgent, ExecutorAgent } from "./general";
import { LeadQualificationAgent } from "./specialized/lead-qualification";
import { CsmOrchestratorAgent } from "./specialized/csm-orchestrator";
import { TwinOrchestratorAgent } from "./specialized/twin-orchestrator";
import { TriageAgent } from "./specialized/triage";

// Re-export workflow for wrangler binding
export { BulkCleanupSwarmWorkflow };

const app = new Hono<{ Bindings: IntelligenceEnv }>();

// AGENT GARDEN REGISTRY
// Exposes the available agents similarly to a "Model Garden", allowing dynamic discovery of capabilities
const AGENT_GARDEN_REGISTRY = [
  {
    id: "orchestrator",
    name: "Agent Orchestrator",
    type: "system",
    description: "Analyzes tasks and routes them to specialized agents.",
    inputs: ["objective", "context"],
  },
  {
    id: "research",
    name: "Research Agent",
    type: "general",
    description: "Gathers information from knowledge base, CRM, and external sources.",
    inputs: ["objective"],
  },
  {
    id: "analyst",
    name: "Data Analyst Agent",
    type: "general",
    description:
      "Analyzes quantitative and qualitative data to identify patterns and calculate metrics.",
    inputs: ["objective", "context"],
  },
  {
    id: "writer",
    name: "Content Writer Agent",
    type: "general",
    description: "Creates professional emails, playbooks, and communications.",
    inputs: ["objective", "audience", "format"],
  },
  {
    id: "planner",
    name: "Strategic Planner Agent",
    type: "general",
    description: "Creates actionable step-by-step plans and workflows.",
    inputs: ["objective", "context"],
  },
  {
    id: "executor",
    name: "Execution Agent",
    type: "system",
    description: "Translates plans into API calls and CRM updates. Generates HITL proposals.",
    inputs: ["action"],
  },
  {
    id: "lead_qualification",
    name: "Lead Qualification Agent",
    type: "specialized",
    description: "Scores incoming leads, determines tier (HOT/WARM/COLD), and routes to CRM.",
    inputs: ["payload"],
  },
  {
    id: "csm_orchestrator",
    name: "CSM Orchestrator",
    type: "meta",
    description:
      "Aggregates health data to prioritize daily Customer Success workloads and identify revenue risks.",
    inputs: ["health_data"],
  },
];

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "Native Agent Colony",
    version: "2.1.0",
    database: "D1 Edge Cache",
    agents: AGENT_GARDEN_REGISTRY.map((a) => a.id),
  });
});

// Get the Agent Garden Catalog
app.get("/garden", (c) => {
  return c.json({
    success: true,
    registry: AGENT_GARDEN_REGISTRY,
    total: AGENT_GARDEN_REGISTRY.length,
  });
});

// Start a new agent colony task
app.post("/run", async (c) => {
  const body = await c.req.json<AgentTask>();

  if (!c.env.AGENT_COLONY) {
    return c.json({ error: "AGENT_COLONY workflow binding not configured" }, 500);
  }

  const instance = await c.env.AGENT_COLONY.create({
    params: body,
  });

  return c.json({
    success: true,
    instanceId: instance.id,
    status: await instance.status(),
  });
});

// Get colony run status
app.get("/:instanceId", async (c) => {
  const instanceId = c.req.param("instanceId");
  if (!c.env.AGENT_COLONY) {
    return c.json({ error: "AGENT_COLONY workflow binding not configured" }, 500);
  }
  const instance = await c.env.AGENT_COLONY.get(instanceId);
  const status = await instance.status();

  return c.json({ instanceId, status });
});

// Governed Agent Delegation (Enforces Memory Propagation)
app.post("/delegate", async (c) => {
  const body = await c.req.json<AgentTask>();

  if (!body.sessionId || !body.taskId || !body.context) {
    return c.json(
      { error: "Governed delegation requires sessionId, taskId, and injected context." },
      400
    );
  }

  const agents: Record<string, (env: IntelligenceEnv) => BaseAgent> = {
    RESEARCH: (env) => new ResearchAgent(env),
    ANALYST: (env) => new AnalystAgent(env),
    WRITER: (env) => new WriterAgent(env),
    PLANNER: (env) => new PlannerAgent(env),
    EXECUTOR: (env) => new ExecutorAgent(env),
    LEAD_QUALIFICATION: (env) => new LeadQualificationAgent(env),
    CSM_ORCHESTRATOR: (env) => new CsmOrchestratorAgent(env),
    ORCHESTRATOR: (env) => new TwinOrchestratorAgent(env),
    TRIAGE: (env) => new TriageAgent(env),
  };

  const agentType = body.objective.startsWith("EXECUTE_AGENT:")
    ? body.objective.split(":")[1].toUpperCase()
    : body.objective.toUpperCase();

  const agentFactory = agents[agentType];
  if (!agentFactory) {
    return c.json({ error: "Unknown agent type" }, 400);
  }

  const agent = agentFactory(c.env);

  // Note: For synchronous delegation, we mock the workflow step.
  const stepMock = {
    do: async (_name: string, fn: () => Promise<any>) => fn(),
  } as any;

  const result = await agent.execute(body, stepMock);

  return c.json({
    success: true,
    agent: agentType,
    result,
    timestamp: new Date().toISOString(),
  });
});

// Get colony run history
app.get("/history/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");
  if (!c.env.D1) {
    return c.json({ runs: [] });
  }

  try {
    const result = await c.env.D1.prepare(
      `SELECT * FROM agent_colony_runs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50`
    )
      .bind(tenantId)
      .all();

    return c.json({ runs: result.results });
  } catch (err) {
    return c.json({ runs: [], error: "History fetch failed" });
  }
});

export default app;
