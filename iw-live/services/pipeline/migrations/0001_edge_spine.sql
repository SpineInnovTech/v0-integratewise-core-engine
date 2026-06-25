-- Migration 0001: Edge Spine (Cloudflare D1)
--
-- This is the external, fast-read caching layer for the Spine and Signals.
-- It acts as a mirror to the canonical data in Supabase.

DROP TABLE IF EXISTS entity_cache;
CREATE TABLE entity_cache (
  id TEXT PRIMARY KEY, -- String UUID
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL, -- The canonical entity type (e.g., 'contact', 'deal')
  source_tool TEXT NOT NULL,
  source_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON string representation
  version INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entity_cache_tenant ON entity_cache(tenant_id, type);
CREATE INDEX idx_entity_cache_source ON entity_cache(tenant_id, source_tool, source_id);

DROP TABLE IF EXISTS signal_cache;
CREATE TABLE signal_cache (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  entity_id TEXT, -- Reference to entity_cache(id)
  data TEXT NOT NULL, -- JSON string
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_signal_cache_tenant ON signal_cache(tenant_id, signal_type);

DROP TABLE IF EXISTS metric_cache;
CREATE TABLE metric_cache (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value REAL NOT NULL,
  dimensions TEXT, -- JSON string
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metric_cache_tenant ON metric_cache(tenant_id, metric_name);
