-- IntegrateWise OS: pgvector Indexes for Semantic Search
-- Creates IVFFlat and HNSW indexes for efficient vector similarity search
-- Run after enabling pgvector extension (001_enable_vector_extension.sql)

-- Ensure vector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- BRAINSTORM_SESSIONS INDEXES
-- ============================================================================

-- IVFFlat index (good for large datasets, requires ANALYZE after bulk inserts)
-- Lists parameter: sqrt(n) to n/1000 for n rows, 100 is a good default
CREATE INDEX IF NOT EXISTS brainstorm_sessions_embedding_ivfflat
ON public.brainstorm_sessions USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- HNSW index (great for incremental inserts, better recall at similar speed)
-- m = 16: connections per node (higher = better recall, more memory)
-- ef_construction = 128: build-time quality (higher = better index, slower build)
CREATE INDEX IF NOT EXISTS brainstorm_sessions_embedding_hnsw
ON public.brainstorm_sessions USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);

-- Companion metadata indexes for filtering
CREATE INDEX IF NOT EXISTS brainstorm_sessions_session_date_idx
ON public.brainstorm_sessions (session_date DESC);

CREATE INDEX IF NOT EXISTS brainstorm_sessions_source_idx
ON public.brainstorm_sessions (source);

CREATE INDEX IF NOT EXISTS brainstorm_sessions_status_idx
ON public.brainstorm_sessions (status);

CREATE INDEX IF NOT EXISTS brainstorm_sessions_type_idx
ON public.brainstorm_sessions (session_type);

-- ============================================================================
-- DOCUMENTS INDEXES (if documents table has embeddings)
-- ============================================================================

-- Check if documents table exists and has embedding column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'embedding'
    AND table_schema = 'public'
  ) THEN
    -- IVFFlat for documents
    CREATE INDEX IF NOT EXISTS documents_embedding_ivfflat
    ON public.documents USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
    
    -- HNSW for documents
    CREATE INDEX IF NOT EXISTS documents_embedding_hnsw
    ON public.documents USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 128);
    
    RAISE NOTICE 'Created vector indexes on documents table';
  END IF;
END $$;

-- ============================================================================
-- INTERACTIONS INDEXES (if interactions table has embeddings)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interactions' 
    AND column_name = 'embedding'
    AND table_schema = 'public'
  ) THEN
    -- IVFFlat for interactions
    CREATE INDEX IF NOT EXISTS interactions_embedding_ivfflat
    ON public.interactions USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
    
    -- HNSW for interactions
    CREATE INDEX IF NOT EXISTS interactions_embedding_hnsw
    ON public.interactions USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 128);
    
    RAISE NOTICE 'Created vector indexes on interactions table';
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Semantic Search
-- ============================================================================

-- Function to search brainstorm sessions by semantic similarity
CREATE OR REPLACE FUNCTION search_brainstorm_sessions(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  session_type varchar,
  status varchar,
  source varchar,
  session_date timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    bs.id,
    bs.title,
    bs.description,
    bs.session_type,
    bs.status,
    bs.source,
    bs.session_date,
    1 - (bs.embedding <=> query_embedding) AS similarity
  FROM brainstorm_sessions bs
  WHERE bs.embedding IS NOT NULL
    AND 1 - (bs.embedding <=> query_embedding) > match_threshold
  ORDER BY bs.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_brainstorm_sessions TO anon, authenticated;

-- ============================================================================
-- MAINTENANCE NOTES
-- ============================================================================

-- After bulk inserts, run ANALYZE to update index statistics:
-- ANALYZE public.brainstorm_sessions;

-- To check index usage:
-- SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes WHERE relname = 'brainstorm_sessions';

-- To adjust HNSW search quality at query time:
-- SET hnsw.ef_search = 100; -- Default is 40, higher = better recall, slower

COMMENT ON INDEX brainstorm_sessions_embedding_ivfflat IS 'IVFFlat index for fast approximate vector search';
COMMENT ON INDEX brainstorm_sessions_embedding_hnsw IS 'HNSW index for high-quality incremental vector search';
