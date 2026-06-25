/**
 * Spine Cache — fast agent context sharing via KV
 * Key pattern: agent_ctx:{tenant_id}:{agent_id}:{context_key}
 */

export async function putAgentContext(
  cache: KVNamespace,
  tenantId: string,
  agentId: string,
  contextKey: string,
  value: unknown,
  ttlSeconds: number = 300
): Promise<void> {
  const key = `agent_ctx:${tenantId}:${agentId}:${contextKey}`;
  await cache.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
}

export async function getAgentContext<T = unknown>(
  cache: KVNamespace,
  tenantId: string,
  agentId: string,
  contextKey: string
): Promise<T | null> {
  const key = `agent_ctx:${tenantId}:${agentId}:${contextKey}`;
  const raw = await cache.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function listAgentContextKeys(
  cache: KVNamespace,
  tenantId: string,
  agentId: string
): Promise<string[]> {
  const prefix = `agent_ctx:${tenantId}:${agentId}:`;
  const { keys } = await cache.list({ prefix });
  return keys.map((k) => k.name.replace(prefix, ""));
}
