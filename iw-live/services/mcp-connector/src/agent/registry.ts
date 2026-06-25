/**
 * Agent Registry — register, lookup, query by capability
 */

export interface AgentRegistryEntry {
  agent_id: string;
  agent_name: string;
  tenant_id: string;
  capabilities: string[];
  endpoint?: string;
  runtime: "cloudflare" | "hostinger" | "external" | "local";
  status: "active" | "paused" | "offline";
  metadata?: Record<string, unknown>;
}

export async function registerAgent(db: D1Database, entry: AgentRegistryEntry): Promise<void> {
  await db
    .prepare(
      `INSERT INTO agent_registry (agent_id, agent_name, tenant_id, capabilities, endpoint, runtime, status, metadata, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT (agent_id) DO UPDATE SET
       agent_name = excluded.agent_name,
       capabilities = excluded.capabilities,
       endpoint = excluded.endpoint,
       runtime = excluded.runtime,
       status = excluded.status,
       metadata = excluded.metadata,
       updated_at = datetime('now')`
    )
    .bind(
      entry.agent_id,
      entry.agent_name,
      entry.tenant_id,
      JSON.stringify(entry.capabilities),
      entry.endpoint || null,
      entry.runtime,
      entry.status,
      entry.metadata ? JSON.stringify(entry.metadata) : null
    )
    .run();
}

export async function lookupAgent(
  db: D1Database,
  agentId: string
): Promise<AgentRegistryEntry | null> {
  const row = await db
    .prepare("SELECT * FROM agent_registry WHERE agent_id = ?")
    .bind(agentId)
    .first();
  if (!row) return null;
  return {
    ...row,
    capabilities: JSON.parse(row.capabilities as string),
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
  } as AgentRegistryEntry;
}

export async function queryAgentsByCapability(
  db: D1Database,
  tenantId: string,
  capability: string
): Promise<AgentRegistryEntry[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM agent_registry WHERE tenant_id = ? AND status = 'active' AND capabilities LIKE ?"
    )
    .bind(tenantId, `%"${capability}"%`)
    .all();
  return (results || []).map((row) => ({
    ...row,
    capabilities: JSON.parse(row.capabilities as string),
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
  })) as AgentRegistryEntry[];
}
