-- Migration: 0003_spine_entities
-- The Spine in D1 — operational truth at edge

CREATE TABLE IF NOT EXISTS spine_entities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  health_score INTEGER,
  health_trend TEXT,
  arr INTEGER,
  tier TEXT,
  status TEXT DEFAULT 'active',
  data TEXT DEFAULT '{}',
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_spine_tenant ON spine_entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_spine_tenant_type ON spine_entities(tenant_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_spine_entity_type ON spine_entities(entity_type);
