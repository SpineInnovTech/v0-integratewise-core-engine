-- Connector Catalog: tracks active tool connections per tenant
CREATE TABLE IF NOT EXISTS connector_catalog (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  connection_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'error', 'disconnected')) DEFAULT 'active',
  entity_types TEXT NOT NULL,
  operations TEXT NOT NULL,
  last_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_connector_catalog_tenant ON connector_catalog(tenant_id, status);
