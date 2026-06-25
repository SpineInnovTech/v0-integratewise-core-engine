export interface CapabilityContract {
  schema_version: string;
  agent_id: string;
  tenant_id: string;
  name: string;
  description: string;
  runtime: Record<string, string>;
  inference: Record<string, unknown>;
  retrieval: Record<string, unknown>;
  memory: Record<string, unknown>;
  spine: Record<string, unknown>;
  tools: {
    protocol: string;
    server: string;
    read_tools: string[];
    propose_tools: string[];
    blocked_tools: string[];
  };
  governance: Record<string, unknown>;
}

export const CAPABILITY_CONTRACT: CapabilityContract = {
  schema_version: "2.0",
  agent_id: "iw-twin-agent",
  tenant_id: "dynamic",
  name: "IntegrateWise Twin Agent",
  description:
    "Cloudflare-native user-facing stateful Twin Agent runtime. Powered by Durable Objects, Workers AI, and JWT-secured isolated tenant spaces.",
  runtime: {
    platform: "cloudflare-agents-sdk",
    worker: "iw-agent-runtime",
    durable_objects:
      "TwinAgent (TWIN_AGENT) + TenantBrainDO (TENANT_BRAIN) — 100% Cloudflare-native stateful DOs",
    url: "https://agent-runtime.integratewise.ai",
  },
  inference: {
    provider: "intelligence-worker-bindings",
    default_model: "openrouter/openai/gpt-5-mini",
  },
  retrieval: {
    transport: "binding_first",
    knowledge: { binding: "KNOWLEDGE", service: "integratewise-knowledge" },
    conversational_cache: { binding: "CACHE", shared_kv: "18aa20dfeb304f0ba592d9070964dd31" },
    mcp: { binding: "CONNECTOR", service: "integratewise-connector" },
  },
  memory: {
    write_rule: "continuity_pipeline_writes",
    writer: "continuity",
    forbidden: ["direct_supabase_write"],
  },
  spine: {
    read_only: true,
  },
  tools: {
    protocol: "mcp",
    server: "integratewise-connector",
    read_tools: [
      "kb.search",
      "memory.search_org",
      "book.get_episodes",
      "book.get_episode",
      "book.search_by_entity",
      "spine.entity.get",
      "spine.entity.list",
      "spine.engineering",
      "signal.list",
      "proposal.list",
    ],
    propose_tools: ["book.create_episode", "book.add_primitive"],
    blocked_tools: ["memory.promote_without_approval"],
  },
  governance: {
    human_approval: "L2_promotion_queue",
    decision_ttl_days: 30,
    spine_wins_on_conflict: true,
  },
};

export function listAllowedTools(): string[] {
  return [...CAPABILITY_CONTRACT.tools.read_tools, ...CAPABILITY_CONTRACT.tools.propose_tools];
}

export function isToolAllowed(name: string): boolean {
  if (CAPABILITY_CONTRACT.tools.blocked_tools.includes(name)) return false;
  return listAllowedTools().includes(name);
}
