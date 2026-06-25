-- Connector Sync: durable cursor/checkpoint tracking (Cloudflare D1)
-- Single source of truth — same spine-cache D1 the gateway writes tenant_spine_config to.
-- Cloudflare-only product plane (DECISION 22): D1 is the only persistence store.

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  phase TEXT NOT NULL,
  cursor_value TEXT,
  records_processed INTEGER DEFAULT 0,
  records_written INTEGER DEFAULT 0,
  records_quarantined INTEGER DEFAULT 0,
  job_id TEXT,
  started_at TEXT,
  status TEXT DEFAULT 'in_progress',
  error TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sync_checkpoints_tenant_provider
  ON sync_checkpoints(tenant_id, provider);

CREATE INDEX IF NOT EXISTS idx_sync_checkpoints_created_at
  ON sync_checkpoints(created_at);
