-- Migration: 0002_consolidated_memories
-- DECISION 22: Cloudflare-only product plane. Replaces Supabase consolidated_memories table.
-- Used by memory-consolidator.ts for hourly/daily/weekly memory aggregation.

CREATE TABLE IF NOT EXISTS consolidated_memories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  consolidation_type TEXT NOT NULL CHECK (consolidation_type IN ('topic', 'user', 'account', 'pattern')),
  topic TEXT,
  user_id TEXT,
  account_id TEXT,
  summary TEXT NOT NULL,
  key_insights TEXT NOT NULL DEFAULT '[]',
  recurring_themes TEXT NOT NULL DEFAULT '[]',
  action_patterns TEXT NOT NULL DEFAULT '[]',
  session_count INTEGER NOT NULL DEFAULT 0,
  time_range_start TEXT NOT NULL,
  time_range_end TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consolidated_memories_tenant_created
  ON consolidated_memories(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_consolidated_memories_type
  ON consolidated_memories(tenant_id, consolidation_type, created_at);
