-- ============================================================================
-- D1 Schema: Memory Layer (Personal + Conversational)
--
-- SQLite dialect for Cloudflare D1.
-- All memory lives at the edge. No Supabase for memory.
--
-- RULES:
--   - All IDs are TEXT
--   - Timestamps are TEXT (ISO 8601)
--   - JSON fields use native SQLite JSON
--   - No RLS — app-level auth in Worker
-- ============================================================================

-- ─── Personal Memory ────────────────────────────────────────────────────────
-- Per-user private memory. Hard boundary — only this user reads.

CREATE TABLE IF NOT EXISTS personal_memory (
  id                    TEXT PRIMARY KEY,
  tenant_id             TEXT NOT NULL,
  user_id               TEXT NOT NULL,
  category              TEXT NOT NULL
    CHECK (category IN ('preference', 'behavior', 'context', 'decision',
                        'goal', 'note', 'learning', 'relationship')),
  title                 TEXT NOT NULL,
  content               TEXT NOT NULL,
  linked_entity_type    TEXT,
  linked_entity_id      TEXT,
  tags                  TEXT NOT NULL DEFAULT '[]',
  governance_state      TEXT NOT NULL DEFAULT 'approved',
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pm_tenant_user
  ON personal_memory (tenant_id, user_id, category);

CREATE INDEX IF NOT EXISTS idx_pm_user_updated
  ON personal_memory (user_id, updated_at DESC);

-- ─── Conversational Memory ──────────────────────────────────────────────────
-- All AI sessions, any model, any tool. Threaded by session_id.

CREATE TABLE IF NOT EXISTS conversational_memory (
  id                    TEXT PRIMARY KEY,
  tenant_id             TEXT NOT NULL,
  session_id            TEXT NOT NULL,
  model                 TEXT NOT NULL,
  role                  TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content               TEXT NOT NULL,
  metadata              TEXT NOT NULL DEFAULT '{}',
  created_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cm_tenant_session
  ON conversational_memory (tenant_id, session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_cm_tenant_model
  ON conversational_memory (tenant_id, model, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cm_session_role
  ON conversational_memory (session_id, role, created_at);
