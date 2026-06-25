-- ============================================================================
-- IntegrateWise — D1 Mirror for Continuity Tables
-- Version: 1.0 — June 3, 2026
-- Database: Cloudflare D1 (read-only mirror of Supabase)
-- ============================================================================

-- Continuity tables need D1 mirrors for edge reads by the Continuity Service.
-- All writes go through Pipeline → Supabase → D1 sync.

-- ============================================================================
-- 1. SESSION CONTAINERS (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_containers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  account_id TEXT,
  started_at TEXT,
  last_event_at TEXT,
  event_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  tags TEXT DEFAULT '[]',
  summary TEXT,
  triage_status TEXT,
  triage_outcome TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_sc_tenant ON session_containers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_sc_user ON session_containers(user_id);
CREATE INDEX IF NOT EXISTS idx_d1_sc_status ON session_containers(status);
CREATE INDEX IF NOT EXISTS idx_d1_sc_last_event ON session_containers(last_event_at DESC);

-- ============================================================================
-- 2. SESSION EVENTS (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  account_id TEXT,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  content TEXT DEFAULT '{}',
  metadata TEXT DEFAULT '{}',
  lineage TEXT DEFAULT '{}',
  seq INTEGER,
  created_at TEXT,
  UNIQUE(tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_d1_se_session ON session_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_d1_se_tenant ON session_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_se_type ON session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_d1_se_created ON session_events(created_at DESC);

-- ============================================================================
-- 3. CONTINUITY CHECKPOINTS (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS continuity_checkpoints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  checkpoint_at TEXT,
  event_range TEXT DEFAULT '{}',
  compressed_state TEXT,
  model_context_window TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cc_session ON continuity_checkpoints(session_id, checkpoint_at DESC);
CREATE INDEX IF NOT EXISTS idx_d1_cc_tenant ON continuity_checkpoints(tenant_id);
