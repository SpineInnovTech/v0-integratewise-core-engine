-- ============================================================================
-- IntegrateWise — D1 Mirror for Memory Tables
-- Version: 1.0 — June 3, 2026
-- Database: Cloudflare D1 (read-only mirror of Supabase)
-- ============================================================================

-- Memory tables need D1 mirrors for edge reads by the Twin and Entity 360.
-- All writes go through Pipeline → Supabase → D1 sync.

-- ============================================================================
-- 1. CONVERSATIONAL MEMORY (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversational_memory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  embedding TEXT,
  metadata TEXT,
  created_at TEXT,

  -- Promotion flow columns (from migration 20260529)
  promotion_status TEXT DEFAULT 'not_promoted',
  promoted_to TEXT,
  promoted_id TEXT,
  promotion_decided_by TEXT,
  promotion_decided_at TEXT,
  importance_score REAL DEFAULT 0.5,
  lineage_ref TEXT,
  department TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cm_tenant ON conversational_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_cm_session ON conversational_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_d1_cm_promotion ON conversational_memory(promotion_status);
CREATE INDEX IF NOT EXISTS idx_d1_cm_created ON conversational_memory(created_at);

-- ============================================================================
-- 2. ORG MEMORY (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS org_memory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  source_session_id TEXT,
  governance_state TEXT DEFAULT 'staging',
  confidence REAL DEFAULT 0.8,
  embedding TEXT,
  metadata TEXT,
  created_at TEXT,
  updated_at TEXT,

  -- Entity linking columns (from migration 20260529)
  related_entity_ids TEXT DEFAULT '[]',
  related_departments TEXT DEFAULT '{}',
  access_scope TEXT DEFAULT 'org',
  lineage_ref TEXT,

  -- Schema fix columns (from migration 20260603)
  tier TEXT DEFAULT 'standard'
);

CREATE INDEX IF NOT EXISTS idx_d1_om_tenant ON org_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_om_topic ON org_memory(topic);
CREATE INDEX IF NOT EXISTS idx_d1_om_category ON org_memory(category);
CREATE INDEX IF NOT EXISTS idx_d1_om_governance ON org_memory(governance_state);
CREATE INDEX IF NOT EXISTS idx_d1_om_tier ON org_memory(tier);
CREATE INDEX IF NOT EXISTS idx_d1_om_created ON org_memory(created_at);

-- ============================================================================
-- 3. PERSONAL MEMORY (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS personal_memory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  embedding TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_pm_tenant_user ON personal_memory(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_d1_pm_category ON personal_memory(category);

-- ============================================================================
-- 4. TRIAGE RESULTS (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS triage_results (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  message_id TEXT,
  platform TEXT,
  priority TEXT,
  category TEXT,
  summary TEXT,
  recommended_action TEXT,
  approval_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT,

  -- Entity linking columns (from migration 20260529)
  related_entity_ids TEXT DEFAULT '[]',
  resolved_entity_id TEXT,
  governance_decision_id TEXT,
  lineage_ref TEXT,
  agent_id TEXT DEFAULT 'triage_bot',
  agent_version TEXT,
  resolution_status TEXT DEFAULT 'open',
  resolved_by TEXT,
  resolved_at TEXT,
  resolution_notes TEXT,
  promoted_to_org_memory TEXT,
  promoted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_tr_tenant ON triage_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_tr_priority ON triage_results(priority);
CREATE INDEX IF NOT EXISTS idx_d1_tr_resolution ON triage_results(resolution_status);
CREATE INDEX IF NOT EXISTS idx_d1_tr_created ON triage_results(created_at);

-- ============================================================================
-- 5. SYNC VIEWS (D1)
-- ============================================================================

-- Memory sync state
CREATE TABLE IF NOT EXISTS memory_sync_state (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_table TEXT NOT NULL,
  last_synced_at TEXT,
  last_synced_id TEXT,
  sync_status TEXT DEFAULT 'active',
  error_message TEXT,
  row_count INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_msync_source ON memory_sync_state(source_table);
CREATE INDEX IF NOT EXISTS idx_d1_msync_tenant ON memory_sync_state(tenant_id);
