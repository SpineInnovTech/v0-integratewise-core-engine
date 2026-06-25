import { IntelligenceEnv } from "./types";
import { BaseAgent } from "./base";
import {
  OrchestratorAgent,
  ResearchAgent,
  AnalystAgent,
  WriterAgent,
  PlannerAgent,
  ExecutorAgent,
} from "./general";
import { LeadQualificationAgent } from "./specialized/lead-qualification";
import { CsmOrchestratorAgent } from "./specialized/csm-orchestrator";
import { TwinOrchestratorAgent } from "./specialized/twin-orchestrator";
import { DataCleanerAgent, EntityResolverAgent } from "./swarm/cleaner";

export const AGENT_GARDEN_REGISTRY = [
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
    inputs: ["health_data", "account"],
  },
  {
    id: "twin_orchestrator",
    name: "Twin Orchestrator (2.0 Pro)",
    type: "meta",
    description:
      "Unified Mind. Consumes MorningContext or account-scoped Entity 360 and produces Daily Brief + governed Playbook for Customer Zero / CS and general use.",
    inputs: ["objective", "context", "morningContext", "account"],
  },
  {
    id: "data_cleaner",
    name: "Data Cleaner Agent",
    type: "swarm",
    description: "Cleans and standardizes raw dataset formats.",
    inputs: ["data"],
  },
  {
    id: "entity_resolver",
    name: "Entity Resolver Agent",
    type: "swarm",
    description: "Deduplicates and matches entities across disparate data sources.",
    inputs: ["records"],
  },
];

export function getAgentFactory(
  agentId: string
): ((env: IntelligenceEnv) => BaseAgent) | undefined {
  const mapping: Record<string, (env: IntelligenceEnv) => BaseAgent> = {
    orchestrator: (env) => new OrchestratorAgent(env),
    research: (env) => new ResearchAgent(env),
    analyst: (env) => new AnalystAgent(env),
    writer: (env) => new WriterAgent(env),
    planner: (env) => new PlannerAgent(env),
    executor: (env) => new ExecutorAgent(env),
    lead_qualification: (env) => new LeadQualificationAgent(env),
    csm_orchestrator: (env) => new CsmOrchestratorAgent(env),
    twin_orchestrator: (env) => new TwinOrchestratorAgent(env),
    data_cleaner: (env) => new DataCleanerAgent(env),
    entity_resolver: (env) => new EntityResolverAgent(env),
  };

  return mapping[agentId.toLowerCase()];
}
