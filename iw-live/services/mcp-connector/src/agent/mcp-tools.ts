/**
 * MCP Tools for Agent Communication + Connector Routing
 *
 * Tools:
 * - connector.list: discover available connectors
 * - connector.read: read canonical entities (Spine-first, Connector on miss)
 * - connector.write: propose write (creates HandoffPackage, governance-gated)
 * - agent.register: register an agent in the routing table
 * - agent.send: send a message to another agent via Spine
 * - agent.inbox: read pending messages for this agent
 */

import { registerAgent, lookupAgent } from "./registry";
import { sendMessage, getInbox } from "./communication";

interface ToolEnv {
  DB: D1Database;
  CACHE?: KVNamespace;
}

interface ToolContext {
  tenant_id: string;
  user_id?: string;
}

// ═══════════════════════════════════════════════
// CONNECTOR TOOLS
// ═══════════════════════════════════════════════

export async function connectorList(env: ToolEnv, ctx: ToolContext) {
  const { results } = await env.DB.prepare(
    "SELECT provider, status, entity_types, operations, last_sync_at FROM connector_catalog WHERE tenant_id = ? AND status != 'disconnected' ORDER BY provider"
  ).bind(ctx.tenant_id).all();

  return {
    connectors: (results || []).map(row => ({
      provider: row.provider,
      status: row.status,
      entity_types: JSON.parse(row.entity_types as string),
      operations: JSON.parse(row.operations as string),
      last_sync_at: row.last_sync_at,
    })),
  };
}

export async function connectorRead(
  env: ToolEnv,
  ctx: ToolContext,
  params: { provider: string; entity_type: string; filters?: Record<string, unknown>; limit?: number }
) {
  const limit = params.limit || 20;

  // 1. Check Spine (D1) for cached canonical entities
  const { results } = await env.DB.prepare(
    `SELECT * FROM ${params.entity_type}_data
     WHERE tenant_id = ? AND source_provider = ?
     ORDER BY updated_at DESC LIMIT ?`
  ).bind(ctx.tenant_id, params.provider, limit).all();

  if (results && results.length > 0) {
    return {
      entities: results.map(row => ({
        id: row.id,
        type: params.entity_type,
        attributes: row.attributes ? JSON.parse(row.attributes as string) : row,
        source: params.provider,
        freshness: "cached",
        lineage: row.source_event_id ? [row.source_event_id] : [],
      })),
      source: "spine_cache",
    };
  }

  // 2. If no cached data, indicate connector fetch needed
  // (Actual Nango fetch would be triggered here in production)
  return {
    entities: [],
    source: "connector_fetch_needed",
    message: `No cached ${params.entity_type} entities from ${params.provider}. Trigger a sync to populate.`,
  };
}

export async function connectorWrite(
  env: ToolEnv,
  ctx: ToolContext,
  params: { provider: string; entity_type: string; action: string; params: Record<string, unknown> }
) {
  // Create a HandoffPackage proposal — NEVER execute directly
  const packageId = crypto.randomUUID();
  const proposalId = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO handoff_packages (package_id, proposal_id, tenant_id, tenant_class, adapter_target, payload_json, state, idempotency_key, created_at, updated_at, expires_at)
     VALUES (?, ?, ?, 'external', 'json', ?, 'PROPOSED', ?, ?, ?, ?)`
  ).bind(
    packageId, proposalId, ctx.tenant_id,
    JSON.stringify({
      action: { kind: params.action, target: `${params.provider}.${params.entity_type}`, params: params.params },
      evidence: [],
      success_criteria: [{ id: "sc-auto", description: `${params.action} ${params.entity_type} on ${params.provider}`, verifiable: true }],
    }),
    `idem_${packageId.split("-")[0]}_${Date.now().toString(16)}`,
    now, now, new Date(Date.now() + 3600000).toISOString()
  ).run();

  // Log initial state transition
  await env.DB.prepare(
    `INSERT INTO handoff_state_log (id, package_id, from_state, to_state, actor, reason, occurred_at)
     VALUES (?, ?, NULL, 'PROPOSED', ?, ?, ?)`
  ).bind(crypto.randomUUID(), packageId, ctx.user_id || "mcp_client", `connector.write: ${params.action} ${params.provider}.${params.entity_type}`, now).run();

  return {
    proposal_id: proposalId,
    package_id: packageId,
    state: "PROPOSED",
    message: "Write proposal created. Awaiting governance approval in Approval Center.",
  };
}

// ═══════════════════════════════════════════════
// AGENT COMMUNICATION TOOLS
// ═══════════════════════════════════════════════

export async function agentRegister(
  env: ToolEnv,
  ctx: ToolContext,
  params: { agent_id: string; agent_name: string; capabilities: string[]; endpoint?: string; runtime: string }
) {
  await registerAgent(env.DB, {
    agent_id: params.agent_id,
    agent_name: params.agent_name,
    tenant_id: ctx.tenant_id,
    capabilities: params.capabilities,
    endpoint: params.endpoint,
    runtime: params.runtime as any,
    status: "active",
  });
  return { registered: true, agent_id: params.agent_id };
}

export async function agentSend(
  env: ToolEnv,
  ctx: ToolContext,
  params: { target_agent_id: string; message_type: string; payload: Record<string, unknown>; correlation_id?: string; sender_agent_id: string }
) {
  // Verify target exists
  const target = await lookupAgent(env.DB, params.target_agent_id);
  if (!target) {
    return { error: "target_agent_not_found", message: `Agent ${params.target_agent_id} not registered` };
  }
  if (target.status === "offline") {
    return { error: "target_agent_offline", message: `Agent ${params.target_agent_id} is offline` };
  }

  const result = await sendMessage(env.DB, env.CACHE, {
    tenant_id: ctx.tenant_id,
    sender_agent_id: params.sender_agent_id,
    receiver_agent_id: params.target_agent_id,
    message_type: params.message_type as any,
    payload: params.payload,
    correlation_id: params.correlation_id || crypto.randomUUID(),
  });

  return { ...result, status: "sent" };
}

export async function agentInbox(
  env: ToolEnv,
  ctx: ToolContext,
  params: { agent_id: string; status_filter?: string; limit?: number }
) {
  const messages = await getInbox(env.DB, params.agent_id, ctx.tenant_id, params.status_filter, params.limit || 20);
  return { messages, count: messages.length };
}
