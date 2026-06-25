-- ============================================================================
-- IntegrateWise — D1 Mirror for Knowledge Tables
-- Version: 1.0 — June 3, 2026
-- Database: Cloudflare D1 (read-only mirror of Supabase)
-- ============================================================================

-- Knowledge tables need D1 mirrors for edge reads by the Twin and KB query engine.
-- All writes go through Pipeline → Supabase → D1 sync.

-- ============================================================================
-- 1. DOCUMENT CHUNKS (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  file_id TEXT,
  version_id TEXT,
  session_id TEXT,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  char_start INTEGER,
  char_end INTEGER,
  token_count INTEGER,
  parent_chunk_id TEXT REFERENCES document_chunks(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  entity_type TEXT,
  entity_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(tenant_id, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_d1_k_chunks_tenant ON document_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_k_chunks_file ON document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_d1_k_chunks_session ON document_chunks(session_id);
CREATE INDEX IF NOT EXISTS idx_d1_k_chunks_entity ON document_chunks(entity_type, entity_id);

-- ============================================================================
-- 2. SEARCH HISTORY (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  query_text TEXT NOT NULL,
  query_embedding TEXT, -- stored as JSON string or comma-separated if needed, vector search is offloaded to CF Vectorize
  search_type TEXT DEFAULT 'hybrid',
  top_k INTEGER DEFAULT 10,
  filters TEXT DEFAULT '{}',
  result_count INTEGER DEFAULT 0,
  result_ids TEXT DEFAULT '[]',
  relevance_scores TEXT DEFAULT '[]',
  duration_ms INTEGER,
  source_service TEXT,
  correlation_id TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_k_search_hist_tenant ON search_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_k_search_hist_created ON search_history(created_at DESC);

-- ============================================================================
-- 3. CHUNKING CONFIG (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chunking_config (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  source_type TEXT,
  file_type TEXT,
  chunk_size INTEGER DEFAULT 512,
  chunk_overlap INTEGER DEFAULT 50,
  min_chunk_size INTEGER DEFAULT 100,
  max_chunk_size INTEGER DEFAULT 1000,
  strategy TEXT DEFAULT 'semantic',
  preserve_headers BOOLEAN DEFAULT 1,
  preserve_lists BOOLEAN DEFAULT 1,
  preserve_code_blocks BOOLEAN DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  priority INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_k_chunk_cfg_tenant ON chunking_config(tenant_id);
