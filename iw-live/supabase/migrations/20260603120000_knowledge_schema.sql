-- Knowledge Schema — conversational chunks, config, history
-- Migration: 20260603120000
-- Date: 2026-06-03

CREATE SCHEMA IF NOT EXISTS knowledge;

-- ============================================================================
-- 1. DOCUMENT_CHUNKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge.document_chunks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL,
  file_id            UUID,
  version_id         UUID,
  session_id         TEXT,
  chunk_index        INTEGER NOT NULL DEFAULT 0,
  chunk_type         TEXT NOT NULL DEFAULT 'text',
  content            TEXT NOT NULL,
  content_hash       TEXT NOT NULL,
  char_start         INTEGER,
  char_end           INTEGER,
  token_count        INTEGER,
  parent_chunk_id    UUID REFERENCES knowledge.document_chunks(id) ON DELETE SET NULL,
  source_type        TEXT NOT NULL,
  source_name        TEXT,
  source_url         TEXT,
  entity_type        TEXT,
  entity_id          TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_knowledge_chunk_hash UNIQUE (tenant_id, content_hash)
);

CREATE INDEX IF NOT EXISTS k_chunks_tenant_idx ON knowledge.document_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS k_chunks_file_idx ON knowledge.document_chunks(file_id);
CREATE INDEX IF NOT EXISTS k_chunks_session_idx ON knowledge.document_chunks(session_id);
CREATE INDEX IF NOT EXISTS k_chunks_entity_idx ON knowledge.document_chunks(entity_type, entity_id);

-- ============================================================================
-- 2. CHUNK_EMBEDDINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge.chunk_embeddings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL,
  chunk_id           UUID NOT NULL REFERENCES knowledge.document_chunks(id) ON DELETE CASCADE,
  embedding          vector(1536) NOT NULL,
  model_name         TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  model_version      TEXT DEFAULT '1',
  dimensions         INTEGER DEFAULT 1536,
  normalized         BOOLEAN DEFAULT TRUE,
  confidence_score   NUMERIC(4,3) DEFAULT 1.0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_knowledge_chunk_model UNIQUE (chunk_id, model_name)
);

CREATE INDEX IF NOT EXISTS k_chunk_emb_tenant_idx ON knowledge.chunk_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS k_chunk_emb_chunk_idx ON knowledge.chunk_embeddings(chunk_id);

-- ============================================================================
-- 3. SESSION_EMBEDDINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge.session_embeddings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL,
  session_id         TEXT NOT NULL,
  embedding_type     TEXT NOT NULL,
  content_embedded   TEXT NOT NULL,
  embedding          vector(1536) NOT NULL,
  model_name         TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_knowledge_session_embedding_type UNIQUE (session_id, embedding_type)
);

CREATE INDEX IF NOT EXISTS k_sess_emb_tenant_idx ON knowledge.session_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS k_sess_emb_session_idx ON knowledge.session_embeddings(session_id);

-- ============================================================================
-- 4. SEARCH_HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge.search_history (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL,
  user_id            TEXT,
  query_text         TEXT NOT NULL,
  query_embedding    vector(1536),
  search_type        TEXT DEFAULT 'hybrid',
  top_k              INTEGER DEFAULT 10,
  filters            JSONB DEFAULT '{}',
  result_count       INTEGER DEFAULT 0,
  result_ids         UUID[] DEFAULT '{}',
  relevance_scores   NUMERIC[] DEFAULT '{}',
  duration_ms        INTEGER,
  source_service     TEXT,
  correlation_id     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS k_search_hist_tenant_idx ON knowledge.search_history(tenant_id);
CREATE INDEX IF NOT EXISTS k_search_hist_created_idx ON knowledge.search_history(created_at DESC);

-- ============================================================================
-- 5. CHUNKING_CONFIG
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge.chunking_config (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID,
  source_type        TEXT,
  file_type          TEXT,
  chunk_size         INTEGER DEFAULT 512,
  chunk_overlap      INTEGER DEFAULT 50,
  min_chunk_size     INTEGER DEFAULT 100,
  max_chunk_size     INTEGER DEFAULT 1000,
  strategy           TEXT DEFAULT 'semantic',
  preserve_headers   BOOLEAN DEFAULT TRUE,
  preserve_lists     BOOLEAN DEFAULT TRUE,
  preserve_code_blocks BOOLEAN DEFAULT TRUE,
  is_active          BOOLEAN DEFAULT TRUE,
  priority           INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS k_chunk_cfg_tenant_idx ON knowledge.chunking_config(tenant_id);

-- ============================================================================
-- 6. SIGNAL_DEDUP_LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge.signal_dedup_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL,
  signal_key         TEXT NOT NULL,
  entity_type        TEXT NOT NULL,
  entity_id          TEXT NOT NULL,
  dedup_key          TEXT NOT NULL,
  window_start       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end         TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
  signal_id          UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_knowledge_signal_window UNIQUE (dedup_key)
);

CREATE INDEX IF NOT EXISTS k_sig_dedup_tenant_idx ON knowledge.signal_dedup_log(tenant_id);
CREATE INDEX IF NOT EXISTS k_sig_dedup_key_idx ON knowledge.signal_dedup_log(dedup_key);

-- ============================================================================
-- 7. RLS
-- ============================================================================
ALTER TABLE knowledge.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.chunk_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.session_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.chunking_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.signal_dedup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_chunks_full" ON knowledge.document_chunks TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_chunk_emb_full" ON knowledge.chunk_embeddings TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_sess_emb_full" ON knowledge.session_embeddings TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_search_hist_full" ON knowledge.search_history TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_chunk_cfg_full" ON knowledge.chunking_config TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_sig_dedup_full" ON knowledge.signal_dedup_log TO service_role USING (true) WITH CHECK (true);
