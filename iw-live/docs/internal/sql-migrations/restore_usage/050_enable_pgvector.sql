-- Enable PGVector Extension Migration
-- Version: 1.0.0
-- Date: 2026-01-16
-- Description: Enable pgvector extension and create vector-enabled tables for AI embeddings and semantic search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for storing vector representations
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL, -- 'interaction', 'webhook', 'document', 'chat_message', etc.
  source_id UUID NOT NULL,   -- Reference to the source record
  content TEXT NOT NULL,      -- Original text content
  embedding VECTOR(1536),     -- OpenAI ada-002 embedding dimension (1536)
  model TEXT DEFAULT 'text-embedding-ada-002',
  token_count INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search using HNSW (Hierarchical Navigable Small World)
-- HNSW is faster for large datasets but slower to build
CREATE INDEX IF NOT EXISTS embeddings_embedding_hnsw_idx 
  ON embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Create index for IVFFlat (inverted file with flat compression)
-- IVFFlat is faster to build but slower for search
-- Uncomment if you prefer IVFFlat over HNSW
-- CREATE INDEX IF NOT EXISTS embeddings_embedding_ivfflat_idx 
--   ON embeddings 
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

-- Create composite index for filtering by source
CREATE INDEX IF NOT EXISTS embeddings_source_idx 
  ON embeddings(source_type, source_id);

-- Create index for timestamp queries
CREATE INDEX IF NOT EXISTS embeddings_created_at_idx 
  ON embeddings(created_at DESC);

-- Create function for cosine similarity search
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_source_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.source_type,
    e.source_id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.metadata,
    e.created_at
  FROM embeddings e
  WHERE (filter_source_type IS NULL OR e.source_type = filter_source_type)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function for hybrid search (vector + text)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding VECTOR(1536),
  query_text TEXT DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_source_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.source_type,
    e.source_id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.metadata,
    e.created_at
  FROM embeddings e
  WHERE (filter_source_type IS NULL OR e.source_type = filter_source_type)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
    AND (query_text IS NULL OR e.content ILIKE '%' || query_text || '%')
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_embeddings_updated_at
  BEFORE UPDATE ON embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add embedding columns to existing tables (interactions, webhooks, etc.)
-- These are optional and allow inline embedding storage

-- Add embedding to interactions table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interactions' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE interactions ADD COLUMN embedding VECTOR(1536);
    CREATE INDEX interactions_embedding_hnsw_idx 
      ON interactions 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  END IF;
END $$;

-- Add embedding to webhooks table (for webhook content search)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhooks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE webhooks ADD COLUMN embedding VECTOR(1536);
    CREATE INDEX webhooks_embedding_hnsw_idx 
      ON webhooks 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  END IF;
END $$;

-- Add embedding to chat_messages table (for message search)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'chat_messages'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'chat_messages' AND column_name = 'embedding'
    ) THEN
      ALTER TABLE chat_messages ADD COLUMN embedding VECTOR(1536);
      CREATE INDEX chat_messages_embedding_hnsw_idx 
        ON chat_messages 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    END IF;
  END IF;
END $$;

-- Create vector search statistics view
CREATE OR REPLACE VIEW embedding_stats AS
SELECT
  source_type,
  COUNT(*) AS total_embeddings,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) AS with_vectors,
  AVG(token_count) AS avg_token_count,
  MAX(created_at) AS last_embedded
FROM embeddings
GROUP BY source_type;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON embeddings TO authenticated;
GRANT SELECT ON embedding_stats TO authenticated;
GRANT EXECUTE ON FUNCTION search_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search TO authenticated;

-- Add helpful comments
COMMENT ON TABLE embeddings IS 'Stores vector embeddings for semantic search across all content types';
COMMENT ON COLUMN embeddings.embedding IS 'Vector embedding (1536 dimensions for OpenAI ada-002)';
COMMENT ON FUNCTION search_embeddings IS 'Performs cosine similarity search on embeddings';
COMMENT ON FUNCTION hybrid_search IS 'Combines vector search with text filtering';
COMMENT ON INDEX embeddings_embedding_hnsw_idx IS 'HNSW index for fast approximate nearest neighbor search';

-- Create example usage comment
COMMENT ON SCHEMA public IS 'PGVector enabled for semantic search. Example usage:
-- 1. Search embeddings: SELECT * FROM search_embeddings(''[0.1, 0.2, ...]''::vector, 0.7, 10);
-- 2. Hybrid search: SELECT * FROM hybrid_search(''[0.1, 0.2, ...]''::vector, ''query text'', 0.7, 10);
-- 3. Vector similarity: SELECT content, embedding <=> ''[0.1, 0.2, ...]''::vector AS distance FROM embeddings ORDER BY distance LIMIT 10;
';
