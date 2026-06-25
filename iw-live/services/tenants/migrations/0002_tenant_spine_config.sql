-- Migration: 0002_tenant_spine_config
-- Schema configuration per tenant — controls what entity types, connectors, and domain apply

CREATE TABLE IF NOT EXISTS tenant_spine_config (
  tenant_id TEXT PRIMARY KEY,
  domains TEXT DEFAULT '[]',
  industry TEXT,
  schema_version TEXT DEFAULT 'v1',
  allowed_entity_types TEXT DEFAULT '[]',
  connector_configs TEXT DEFAULT '{}',
  connected_connectors TEXT DEFAULT '[]',
  subscription_tier TEXT DEFAULT 'free',
  depth_matrix_snapshot TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
