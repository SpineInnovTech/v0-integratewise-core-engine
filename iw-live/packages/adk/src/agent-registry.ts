/**
 * ADK Agent Registry
 *
 * Tracks what agents/tools exist, their capabilities, and routing info.
 * Stateless — reads from KV cache, writes via governance.
 *
 * "This call → this service." KV-speed TTL lookup.
 * No logs. No memory. No reasoning. Pure routing.
 */

export interface AgentEntry {
  /** Unique agent ID */
  id: string;
  /** Display name */
  name: string;
  /** What this agent does */
  description: string;
  /** What capabilities it provides */
  capabilities: string[];
  /** Where to reach it */
  endpoint: string;
  /** Auth method */
  auth: "service_binding" | "bearer_token" | "cf_access" | "none";
  /** Current status */
  status: "active" | "inactive" | "degraded";
  /** Last health check */
  last_seen?: string;
  /** Version */
  version?: string;
}

export interface ToolEntry {
  /** Tool name (MCP tool name) */
  name: string;
  /** Which agent provides this tool */
  agent_id: string;
  /** Capability this tool implements */
  capability: string;
  /** Whether this tool is currently available */
  available: boolean;
}

/**
 * Agent Registry — KV-backed, fast lookups
 */
export class AgentRegistry {
  private kv: KVNamespace;
  private readonly PREFIX = "adk:agent:";
  private readonly TOOL_PREFIX = "adk:tool:";
  private readonly TTL = 5 * 60; // 5 min cache

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /** Register an agent */
  async register(agent: AgentEntry): Promise<void> {
    await this.kv.put(`${this.PREFIX}${agent.id}`, JSON.stringify(agent), {
      expirationTtl: this.TTL,
    });

    // Register each capability as a tool lookup
    for (const cap of agent.capabilities) {
      await this.kv.put(
        `${this.TOOL_PREFIX}${cap}`,
        JSON.stringify({ agent_id: agent.id, capability: cap, endpoint: agent.endpoint }),
        { expirationTtl: this.TTL }
      );
    }
  }

  /** Get an agent by ID */
  async get(agentId: string): Promise<AgentEntry | null> {
    const raw = await this.kv.get(`${this.PREFIX}${agentId}`);
    return raw ? JSON.parse(raw) : null;
  }

  /** Resolve which agent handles a capability */
  async resolveAgent(capability: string): Promise<{ agent_id: string; endpoint: string } | null> {
    const raw = await this.kv.get(`${this.TOOL_PREFIX}${capability}`);
    return raw ? JSON.parse(raw) : null;
  }

  /** List all registered agents */
  async list(): Promise<AgentEntry[]> {
    const keys = await this.kv.list({ prefix: this.PREFIX });
    const agents: AgentEntry[] = [];
    for (const key of keys.keys) {
      const raw = await this.kv.get(key.name);
      if (raw) agents.push(JSON.parse(raw));
    }
    return agents;
  }

  /** Update agent status (health check) */
  async updateStatus(agentId: string, status: AgentEntry["status"]): Promise<void> {
    const agent = await this.get(agentId);
    if (!agent) return;
    agent.status = status;
    agent.last_seen = new Date().toISOString();
    await this.kv.put(`${this.PREFIX}${agentId}`, JSON.stringify(agent), {
      expirationTtl: this.TTL,
    });
  }

  /** Deregister an agent */
  async deregister(agentId: string): Promise<void> {
    const agent = await this.get(agentId);
    if (!agent) return;
    await this.kv.delete(`${this.PREFIX}${agentId}`);
    for (const cap of agent.capabilities) {
      await this.kv.delete(`${this.TOOL_PREFIX}${cap}`);
    }
  }
}

/** Default agents in the IntegrateWise ecosystem */
export const DEFAULT_AGENTS: AgentEntry[] = [
  {
    id: "twin",
    name: "IW Twin",
    description: "The only agent. Model-agnostic. Reads Spine + Memory. Proposes actions.",
    capabilities: [
      "spine.entity.read",
      "spine.entity.get",
      "memory.search",
      "memory.propose",
      "assembly.entity360",
    ],
    endpoint: "https://twin.integratewise.ai",
    auth: "cf_access",
    status: "active",
  },
  {
    id: "triage-bot",
    name: "Triage Bot",
    description: "CF Workflow. Scores proposals. Sole writer to org_memory.",
    capabilities: ["governance.proposals.approve", "governance.proposals.reject"],
    endpoint: "service:intelligence",
    auth: "service_binding",
    status: "active",
  },
  {
    id: "pipeline",
    name: "Pipeline",
    description: "8-stage Normalizer. SOLE Spine writer.",
    capabilities: ["spine.entity.write", "connector.sync"],
    endpoint: "service:pipeline",
    auth: "service_binding",
    status: "active",
  },
  {
    id: "continuity",
    name: "Continuity",
    description: "Session memory edge caching. Conversational memory management.",
    capabilities: ["memory.read_conversational", "memory.read_org"],
    endpoint: "service:continuity",
    auth: "service_binding",
    status: "active",
  },
];
