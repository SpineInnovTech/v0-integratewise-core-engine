-- Migration: 019_semantic_chunks.sql
-- Description: Document chunks and embeddings for RAG (Retrieval Augmented Generation)
-- Created: 2026-01-29

-- =============================================================================
-- DOCUMENT CHUNKS TABLE
-- Stores chunked document content for semantic search and RAG pipelines
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  document_id UUID NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  token_count INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_tenant ON document_chunks(tenant_id);

-- =============================================================================
-- SESSION EMBEDDINGS TABLE
-- Stores vector embeddings for session content (requires pgvector extension)
-- =============================================================================

CREATE TABLE IF NOT EXISTS session_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_session_embed_tenant ON session_embeddings(tenant_id);
CREATE INDEX idx_session_embed_session ON session_embeddings(session_id);
