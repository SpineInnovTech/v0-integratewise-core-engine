-- Agent Registry: routing table for agent-to-agent communication
CREATE TABLE IF NOT EXISTS agent_registry (
  agent_id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  capabilities TEXT NOT NULL,
  endpoint TEXT,
  runtime TEXT NOT NULL CHECK (runtime IN ('cloudflare', 'hostinger', 'external', 'local')),
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'offline')) DEFAULT 'active',
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_registry_tenant ON agent_registry(tenant_id, status);
