-- Document chunks table for knowledge search (semantic + keyword)
-- Used by: services/knowledge/src/search/service.ts, services/knowledge/src/embedding/storage.ts

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  char_start INTEGER,
  char_end INTEGER,
  token_count INTEGER,
  source_type TEXT NOT NULL DEFAULT 'file',
  source_name TEXT,
  entity_type TEXT,
  entity_id TEXT,
  file_id TEXT,
  session_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_chunks_tenant ON document_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chunks_entity ON document_chunks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_chunks_session ON document_chunks(session_id);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON document_chunks(source_type, source_name);
CREATE INDEX IF NOT EXISTS idx_chunks_hash ON document_chunks(content_hash);
CREATE INDEX IF NOT EXISTS idx_chunks_created ON document_chunks(tenant_id, created_at DESC);
