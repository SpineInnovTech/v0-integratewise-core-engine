-- ============================================================================
-- D1 Schema: Knowledge Registry (Edge Cache)
--
-- SQLite dialect for Cloudflare D1 (edge-local knowledge reads).
-- Caches org_memory and entity summaries for fast projection.
-- Canonical data remains in Supabase (pgvector, complex joins).
--
-- NOTE: signals table already exists in D1 with its own schema.
--       org_memory and entity_summary are new tables.
-- ============================================================================

-- ─── Org Memory Cache ───────────────────────────────────────────────────────
-- Mirror of memory.org_memory for edge-fast reads.

CREATE TABLE IF NOT EXISTS org_memory (
  id                    TEXT PRIMARY KEY,
  tenant_id             TEXT NOT NULL,
  topic                 TEXT NOT NULL,
  category              TEXT NOT NULL,
  content               TEXT NOT NULL,
  source_session_id     TEXT,
  source_decision_id    TEXT,
  evidence_refs         TEXT NOT NULL DEFAULT '[]',
  governance_state      TEXT NOT NULL DEFAULT 'staging',
  approved_by           TEXT,
  approved_at           TEXT,
  published_at          TEXT,
  version               INTEGER NOT NULL DEFAULT 1,
  metadata              TEXT NOT NULL DEFAULT '{}',
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_om_tenant_category
  ON org_memory (tenant_id, category, governance_state);

CREATE INDEX IF NOT EXISTS idx_om_tenant_state
  ON org_memory (tenant_id, governance_state, updated_at DESC);

-- ─── Entity Summary Cache ───────────────────────────────────────────────────
-- Lightweight entity projection for edge-fast Entity 360 and dashboards.

CREATE TABLE IF NOT EXISTS entity_summary (
  id                    TEXT PRIMARY KEY,
  tenant_id             TEXT NOT NULL,
  entity_type           TEXT NOT NULL,
  name                  TEXT NOT NULL,
  health_score          REAL,
  status                TEXT,
  risk_level            TEXT,
  last_activity_at      TEXT,
  tags                  TEXT NOT NULL DEFAULT '[]',
  metadata              TEXT NOT NULL DEFAULT '{}',
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entity_tenant_type
  ON entity_summary (tenant_id, entity_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_entity_tenant_risk
  ON entity_summary (tenant_id, risk_level, health_score ASC);
