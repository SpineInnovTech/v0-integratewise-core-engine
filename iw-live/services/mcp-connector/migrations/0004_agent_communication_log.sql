-- Agent Communication Log: enables agent-to-agent messaging via Spine
CREATE TABLE IF NOT EXISTS agent_communication_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sender_agent_id TEXT NOT NULL,
  receiver_agent_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'processed', 'failed')) DEFAULT 'sent',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_comm_log_correlation ON agent_communication_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_agent_comm_log_receiver ON agent_communication_log(receiver_agent_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_comm_log_tenant ON agent_communication_log(tenant_id, created_at);
