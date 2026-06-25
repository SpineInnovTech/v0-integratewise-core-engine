/**
 * Agent Registry Worker
 *
 * Manages all agents in the IntegrateWise ecosystem.
 * Provides API for agent registration, status, and operations.
 *
 * Zero-Trust Database Architecture:
 * - NO direct Supabase access or credentials.
 * - Reads are served from local edge D1 DB (`env.DB`).
 * - Writes are routed via fetch service binding to the consolidated `env.PIPELINE`.
 */

interface Env {
  DB: D1Database;
  PIPELINE: Fetcher;
}

interface Agent {
  id: string;
  tenant_id: string;
  agent_id: string;
  agent_type: "governance" | "cognition" | "external" | "system" | "triage" | "twin" | "hermes";
  name: string;
  description: string;
  status: "active" | "inactive" | "maintenance";
  capabilities: string[];
  config: Record<string, any>;
  last_heartbeat: string;
  created_at: string;
  updated_at: string;
}

function mapAgentType(type: string): string {
  // Supabase check constraint accepts: 'governance', 'cognition', 'external', 'system'
  if (type === "triage") return "governance";
  if (type === "twin" || type === "hermes") return "cognition";
  return type; // e.g. system, external
}

// ─── Default Agents ────────────────────────────────────────────────────────

const DEFAULT_AGENTS: Omit<Agent, "id" | "tenant_id" | "created_at" | "updated_at">[] = [
  {
    agent_id: "triage-bot",
    agent_type: "triage",
    name: "Triage Bot",
    description: "External AI gateway. Sole writer to org_memory. Manages API keys.",
    status: "active",
    capabilities: [
      "read_org_memory",
      "write_org_memory",
      "classify_content",
      "manage_api_keys",
      "enforce_governance",
    ],
    config: {
      auto_approve_threshold: 0.85,
      classification_model: "gemini-pro",
      max_requests_per_minute: 100,
    },
    last_heartbeat: new Date().toISOString(),
  },
  {
    agent_id: "twin",
    agent_type: "twin",
    name: "Twin",
    description: "AI reasoning engine. Generates proposals, insights, and recommendations.",
    status: "active",
    capabilities: [
      "read_org_memory",
      "read_personal_memory",
      "read_conversational_memory",
      "generate_proposals",
      "generate_insights",
      "assemble_context",
    ],
    config: {
      model: "mimo-v2.5-pro",
      max_tokens: 4096,
      temperature: 0.7,
    },
    last_heartbeat: new Date().toISOString(),
  },
  {
    agent_id: "hermes",
    agent_type: "hermes",
    name: "Hermes",
    description: "Skill-based reasoning engine. Orchestrates skills and model routing.",
    status: "active",
    capabilities: ["read_org_memory", "skill_reasoning", "model_orchestration", "context_assembly"],
    config: {
      skill_registry_size: 148,
      loaded_skills: 116,
      model_routing: "adaptive",
    },
    last_heartbeat: new Date().toISOString(),
  },
  {
    agent_id: "system",
    agent_type: "system",
    name: "System Agent",
    description: "Internal system agent for automated tasks and maintenance.",
    status: "active",
    capabilities: ["read_org_memory", "write_org_memory", "system_maintenance", "health_checks"],
    config: {
      heartbeat_interval_ms: 30000,
      health_check_interval_ms: 60000,
    },
    last_heartbeat: new Date().toISOString(),
  },
];

// ─── Worker ────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    try {
      // Route to appropriate handler
      if (path === "/api/agents" && request.method === "GET") {
        return await handleListAgents(env, headers);
      }

      if (path === "/api/agents" && request.method === "POST") {
        return await handleRegisterAgent(request, env, headers);
      }

      if (path.match(/^\/api\/agents\/[^/]+$/) && request.method === "GET") {
        const agentId = path.split("/").pop()!;
        return await handleGetAgent(agentId, env, headers);
      }

      if (path.match(/^\/api\/agents\/[^/]+$/) && request.method === "PUT") {
        const agentId = path.split("/").pop()!;
        return await handleUpdateAgent(agentId, request, env, headers);
      }

      if (path.match(/^\/api\/agents\/[^/]+\/heartbeat$/) && request.method === "POST") {
        const agentId = path.split("/")[3];
        return await handleHeartbeat(agentId, env, headers);
      }

      if (path === "/api/agents/initialize" && request.method === "POST") {
        return await handleInitializeAgents(env, headers);
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  },
};

// ─── Handlers ──────────────────────────────────────────────────────────────

async function handleListAgents(env: Env, headers: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT * FROM agent_registry ORDER BY created_at DESC"
  ).all();
  return new Response(JSON.stringify({ agents: results }), { headers });
}

async function handleRegisterAgent(
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const body = (await request.json()) as Partial<Agent>;

  if (!body.agent_id || !body.agent_type || !body.name) {
    return new Response(JSON.stringify({ error: "agent_id, agent_type, and name are required" }), {
      status: 400,
      headers,
    });
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const tid = "default";

  const agentData = {
    id,
    tenant_id: tid,
    agent_id: body.agent_id,
    agent_type: mapAgentType(body.agent_type),
    name: body.name,
    description: body.description || "",
    status: body.status || "active",
    capabilities: body.capabilities || [],
    config: body.config || {},
    last_heartbeat: now,
    created_at: now,
    updated_at: now,
  };

  // 1. Write to Supabase Spine via Pipeline service binding
  const pipelineRes = await env.PIPELINE.fetch("http://pipeline/v1/spine/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tid,
    },
    body: JSON.stringify({
      tenant_id: tid,
      entities: [
        {
          entity_type: "agent",
          name: body.name,
          source: "system",
          source_id: id,
          data: agentData,
        },
      ],
    }),
  });

  if (!pipelineRes.ok) {
    const errText = await pipelineRes.text();
    throw new Error(`Pipeline registration write failed: ${errText}`);
  }

  // 2. Mirror/sync to D1 edge cache
  await env.DB.prepare(
    `INSERT INTO agent_registry (id, tenant_id, agent_id, agent_type, name, description, status, capabilities, config, last_heartbeat, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      tid,
      body.agent_id,
      body.agent_type,
      body.name,
      body.description || "",
      body.status || "active",
      JSON.stringify(body.capabilities || []),
      JSON.stringify(body.config || {}),
      now,
      now,
      now
    )
    .run();

  return new Response(JSON.stringify({ id, agent_id: body.agent_id, status: "registered" }), {
    status: 201,
    headers,
  });
}

async function handleGetAgent(
  agentId: string,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const { results } = await env.DB.prepare("SELECT * FROM agent_registry WHERE agent_id = ?")
    .bind(agentId)
    .all();

  if (results.length === 0) {
    return new Response(JSON.stringify({ error: "Agent not found" }), { status: 404, headers });
  }
  return new Response(JSON.stringify({ agent: results[0] }), { headers });
}

async function handleUpdateAgent(
  agentId: string,
  request: Request,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const body = (await request.json()) as Partial<Agent>;
  const now = new Date().toISOString();

  // Find existing agent to get target UUID id and tenant_id
  const existing = await env.DB.prepare(
    "SELECT id, tenant_id, name, agent_type FROM agent_registry WHERE agent_id = ?"
  )
    .bind(agentId)
    .first<{ id: string; tenant_id: string; name: string; agent_type: string }>();

  if (!existing) {
    return new Response(JSON.stringify({ error: "Agent not found" }), { status: 404, headers });
  }

  const id = existing.id;
  const tid = existing.tenant_id || "default";

  // 1. Update Supabase via Pipeline
  const updateData: Record<string, any> = {
    id,
    tenant_id: tid,
    agent_id: agentId,
    updated_at: now,
  };
  if (body.name) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.status) updateData.status = body.status;
  if (body.capabilities) updateData.capabilities = body.capabilities;
  if (body.config) updateData.config = body.config;

  const pipelineRes = await env.PIPELINE.fetch("http://pipeline/v1/spine/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tid,
    },
    body: JSON.stringify({
      tenant_id: tid,
      entities: [
        {
          entity_type: "agent",
          name: body.name || existing.name,
          source: "system",
          source_id: id,
          data: updateData,
        },
      ],
    }),
  });

  if (!pipelineRes.ok) {
    console.error(`[AgentRegistry] Pipeline update write failed: ${await pipelineRes.text()}`);
  }

  // 2. Update D1
  const updates: string[] = [];
  const values: any[] = [];

  if (body.name) {
    updates.push("name = ?");
    values.push(body.name);
  }
  if (body.description !== undefined) {
    updates.push("description = ?");
    values.push(body.description);
  }
  if (body.status) {
    updates.push("status = ?");
    values.push(body.status);
  }
  if (body.capabilities) {
    updates.push("capabilities = ?");
    values.push(JSON.stringify(body.capabilities));
  }
  if (body.config) {
    updates.push("config = ?");
    values.push(JSON.stringify(body.config));
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(agentId);

  await env.DB.prepare(`UPDATE agent_registry SET ${updates.join(", ")} WHERE agent_id = ?`)
    .bind(...values)
    .run();

  return new Response(JSON.stringify({ agent_id: agentId, status: "updated" }), { headers });
}

async function handleHeartbeat(
  agentId: string,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const now = new Date().toISOString();

  // Find existing agent to get target UUID id and tenant_id
  const existing = await env.DB.prepare(
    "SELECT id, tenant_id, name, agent_type FROM agent_registry WHERE agent_id = ?"
  )
    .bind(agentId)
    .first<{ id: string; tenant_id: string; name: string; agent_type: string }>();

  if (!existing) {
    return new Response(JSON.stringify({ error: "Agent not found" }), { status: 404, headers });
  }

  const id = existing.id;
  const tid = existing.tenant_id || "default";

  // 1. Heartbeat to Supabase via Pipeline
  const pipelineRes = await env.PIPELINE.fetch("http://pipeline/v1/spine/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tid,
    },
    body: JSON.stringify({
      tenant_id: tid,
      entities: [
        {
          entity_type: "agent",
          name: existing.name,
          source: "system",
          source_id: id,
          data: {
            id,
            tenant_id: tid,
            agent_id: agentId,
            agent_type: existing.agent_type,
            last_heartbeat: now,
            updated_at: now,
          },
        },
      ],
    }),
  });

  if (!pipelineRes.ok) {
    console.error(`[AgentRegistry] Pipeline heartbeat failed: ${await pipelineRes.text()}`);
  }

  // 2. Update D1
  await env.DB.prepare(
    "UPDATE agent_registry SET last_heartbeat = ?, updated_at = ? WHERE agent_id = ?"
  )
    .bind(now, now, agentId)
    .run();

  return new Response(JSON.stringify({ agent_id: agentId, last_heartbeat: now }), { headers });
}

async function handleInitializeAgents(
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  const now = new Date().toISOString();
  const results: string[] = [];

  for (const agent of DEFAULT_AGENTS) {
    // 1. Check D1 first
    const existing = await env.DB.prepare("SELECT id FROM agent_registry WHERE agent_id = ?")
      .bind(agent.agent_id)
      .first<{ id: string }>();

    if (!existing) {
      const id = crypto.randomUUID();
      const tid = "default";
      const agentData = {
        id,
        tenant_id: tid,
        agent_id: agent.agent_id,
        agent_type: mapAgentType(agent.agent_type),
        name: agent.name,
        description: agent.description,
        status: agent.status,
        capabilities: agent.capabilities,
        config: agent.config,
        last_heartbeat: now,
        created_at: now,
        updated_at: now,
      };

      // 2. Write to Supabase via Pipeline
      try {
        const pipelineRes = await env.PIPELINE.fetch("http://pipeline/v1/spine/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tid,
          },
          body: JSON.stringify({
            tenant_id: tid,
            entities: [
              {
                entity_type: "agent",
                name: agent.name,
                source: "system",
                source_id: id,
                data: agentData,
              },
            ],
          }),
        });

        if (!pipelineRes.ok) {
          console.error(
            `[AgentRegistry] Pipeline init write failed for ${agent.name}: ${await pipelineRes.text()}`
          );
        }
      } catch (err: any) {
        console.error(
          `[AgentRegistry] Pipeline init request failed for ${agent.name}: ${err.message}`
        );
      }

      // 3. Seed in D1
      await env.DB.prepare(
        `INSERT INTO agent_registry (id, tenant_id, agent_id, agent_type, name, description, status, capabilities, config, last_heartbeat, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          tid,
          agent.agent_id,
          agent.agent_type,
          agent.name,
          agent.description,
          agent.status,
          JSON.stringify(agent.capabilities),
          JSON.stringify(agent.config),
          now,
          now,
          now
        )
        .run();
      results.push(`Registered: ${agent.name}`);
    } else {
      results.push(`Exists: ${agent.name}`);
    }
  }

  return new Response(JSON.stringify({ message: "Agents initialized", results }), { headers });
}
