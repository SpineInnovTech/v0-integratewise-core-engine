/**
 * Agent Communication — send, inbox, markProcessed
 * All agent messages flow through Spine (D1 Log + KV Cache)
 */

export interface AgentMessage {
  id: string;
  tenant_id: string;
  sender_agent_id: string;
  receiver_agent_id: string;
  message_type: "request" | "response" | "event" | "heartbeat";
  payload: Record<string, unknown>;
  correlation_id: string;
  status: "sent" | "delivered" | "processed" | "failed";
  created_at: string;
}

export async function sendMessage(
  db: D1Database,
  cache: KVNamespace | undefined,
  msg: Omit<AgentMessage, "id" | "status" | "created_at">
): Promise<{ message_id: string; correlation_id: string }> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const correlationId = msg.correlation_id || crypto.randomUUID();

  // 1. Write to durable Log Table
  await db
    .prepare(
      `INSERT INTO agent_communication_log (id, tenant_id, sender_agent_id, receiver_agent_id, message_type, payload, correlation_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?)`
    )
    .bind(
      id,
      msg.tenant_id,
      msg.sender_agent_id,
      msg.receiver_agent_id,
      msg.message_type,
      JSON.stringify(msg.payload),
      correlationId,
      now
    )
    .run();

  // 2. Write to Spine Cache for fast pickup (TTL 5 min)
  if (cache) {
    const cacheKey = `agent_msg:${msg.tenant_id}:${msg.receiver_agent_id}:${id}`;
    await cache.put(
      cacheKey,
      JSON.stringify({ ...msg, id, correlation_id: correlationId, created_at: now }),
      { expirationTtl: 300 }
    );
  }

  return { message_id: id, correlation_id: correlationId };
}

export async function getInbox(
  db: D1Database,
  agentId: string,
  tenantId: string,
  statusFilter?: string,
  limit: number = 20
): Promise<AgentMessage[]> {
  const sql = statusFilter
    ? "SELECT * FROM agent_communication_log WHERE receiver_agent_id = ? AND tenant_id = ? AND status = ? ORDER BY created_at DESC LIMIT ?"
    : "SELECT * FROM agent_communication_log WHERE receiver_agent_id = ? AND tenant_id = ? AND status IN ('sent', 'delivered') ORDER BY created_at DESC LIMIT ?";

  const stmt = statusFilter
    ? db.prepare(sql).bind(agentId, tenantId, statusFilter, limit)
    : db.prepare(sql).bind(agentId, tenantId, limit);

  const { results } = await stmt.all();
  return (results || []).map((row) => ({
    ...row,
    payload: JSON.parse(row.payload as string),
  })) as AgentMessage[];
}

export async function markProcessed(db: D1Database, messageId: string): Promise<void> {
  await db
    .prepare(
      "UPDATE agent_communication_log SET status = 'processed', processed_at = datetime('now') WHERE id = ?"
    )
    .bind(messageId)
    .run();
}
