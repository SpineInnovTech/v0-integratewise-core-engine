-- ============================================================================
-- Day 2: Semantic + Knowledge Layer
-- ============================================================================
-- This migration adds comprehensive chunking, embedding, and semantic search
-- infrastructure for the IntegrateWise Knowledge Pipeline.

-- ============================================================================
-- 1. DOCUMENT CHUNKS TABLE
-- ============================================================================
-- Semantic chunks extracted from documents for embedding and search

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Source reference
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    version_id UUID REFERENCES file_versions(id) ON DELETE SET NULL,
    session_id UUID REFERENCES ai_sessions(id) ON DELETE SET NULL,
    
    -- Chunk metadata
    chunk_index INTEGER NOT NULL DEFAULT 0,
    chunk_type TEXT NOT NULL DEFAULT 'text', -- text, code, table, heading, list
    
    -- Content
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL, -- For deduplication
    
    -- Chunking metadata
    char_start INTEGER,
    char_end INTEGER,
    token_count INTEGER,
    
    -- Parent chunk (for hierarchical chunking)
    parent_chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
    
    -- Source metadata
    source_type TEXT NOT NULL, -- file, session, url, api
    source_name TEXT,
    source_url TEXT,
    
    -- Entity linking
    entity_type TEXT,
    entity_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate chunks
    CONSTRAINT unique_chunk_hash UNIQUE (tenant_id, content_hash)
);

-- Indexes for document_chunks
CREATE INDEX IF NOT EXISTS idx_chunks_tenant ON document_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chunks_file ON document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_chunks_session ON document_chunks(session_id);
CREATE INDEX IF NOT EXISTS idx_chunks_entity ON document_chunks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_chunks_source_type ON document_chunks(source_type);
CREATE INDEX IF NOT EXISTS idx_chunks_type ON document_chunks(chunk_type);

-- ============================================================================
-- 2. EMBEDDINGS TABLE (Enhanced)
-- ============================================================================
-- Vector embeddings for semantic search

CREATE TABLE IF NOT EXISTS chunk_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    
    -- Embedding data
    embedding vector(1536) NOT NULL, -- OpenAI ada-002 / text-embedding-3-small
    model_name TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    model_version TEXT DEFAULT '1',
    
    -- Embedding metadata
    dimensions INTEGER DEFAULT 1536,
    normalized BOOLEAN DEFAULT TRUE,
    
    -- Quality scores
    confidence_score NUMERIC(4,3) DEFAULT 1.0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One embedding per chunk per model
    CONSTRAINT unique_chunk_model UNIQUE (chunk_id, model_name)
);

-- Vector similarity index (IVFFlat for performance)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON chunk_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_embeddings_tenant ON chunk_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk ON chunk_embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_model ON chunk_embeddings(model_name);

-- ============================================================================
-- 3. SESSION EMBEDDINGS TABLE
-- ============================================================================
-- Embeddings specifically for AI session summaries and memories

CREATE TABLE IF NOT EXISTS session_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    
    -- What was embedded
    embedding_type TEXT NOT NULL, -- summary, memory, tool_call, full_session
    content_embedded TEXT NOT NULL,
    
    -- Embedding data
    embedding vector(1536) NOT NULL,
    model_name TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One embedding per session per type
    CONSTRAINT unique_session_embedding_type UNIQUE (session_id, embedding_type)
);

CREATE INDEX IF NOT EXISTS idx_session_embeddings_tenant ON session_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_session ON session_embeddings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_vector ON session_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- ============================================================================
-- 4. SEARCH HISTORY TABLE
-- ============================================================================
-- Track search queries for analytics and improvement

CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id TEXT,
    
    -- Query
    query_text TEXT NOT NULL,
    query_embedding vector(1536),
    
    -- Search parameters
    search_type TEXT DEFAULT 'hybrid', -- vector, keyword, hybrid
    top_k INTEGER DEFAULT 10,
    filters JSONB DEFAULT '{}',
    
    -- Results
    result_count INTEGER DEFAULT 0,
    result_ids UUID[] DEFAULT '{}',
    relevance_scores NUMERIC[] DEFAULT '{}',
    
    -- Performance
    duration_ms INTEGER,
    
    -- Context
    source_service TEXT, -- think, iq-hub, api
    correlation_id TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_tenant ON search_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- ============================================================================
-- 5. CHUNKING CONFIGURATION TABLE
-- ============================================================================
-- Configurable chunking strategies per tenant/entity type

CREATE TABLE IF NOT EXISTS chunking_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL = global default
    
    -- Config scope
    source_type TEXT, -- file, session, url (NULL = all)
    file_type TEXT, -- pdf, docx, txt, md (NULL = all)
    
    -- Chunking parameters
    chunk_size INTEGER DEFAULT 512, -- Target token count
    chunk_overlap INTEGER DEFAULT 50, -- Overlap tokens
    min_chunk_size INTEGER DEFAULT 100,
    max_chunk_size INTEGER DEFAULT 1000,
    
    -- Strategy
    strategy TEXT DEFAULT 'semantic', -- fixed, sentence, paragraph, semantic
    preserve_headers BOOLEAN DEFAULT TRUE,
    preserve_lists BOOLEAN DEFAULT TRUE,
    preserve_code_blocks BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Higher = more specific
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert global defaults
INSERT INTO chunking_config (source_type, file_type, chunk_size, chunk_overlap, strategy)
VALUES 
    (NULL, NULL, 512, 50, 'semantic'),
    ('session', NULL, 256, 25, 'paragraph'),
    ('file', 'md', 512, 50, 'semantic'),
    ('file', 'pdf', 400, 40, 'paragraph'),
    ('file', 'txt', 512, 50, 'sentence')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. SIGNAL DEDUP WINDOW (Best Practice #5)
-- ============================================================================
-- Track signal emissions for deduplication within time window

CREATE TABLE IF NOT EXISTS signal_dedup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Signal identification
    signal_key TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    
    -- Dedup window
    dedup_key TEXT NOT NULL, -- Combined key for uniqueness
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
    
    -- Signal reference
    signal_id UUID,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique within window
    CONSTRAINT unique_signal_window UNIQUE (dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_signal_dedup_tenant ON signal_dedup_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signal_dedup_key ON signal_dedup_log(dedup_key);
CREATE INDEX IF NOT EXISTS idx_signal_dedup_window ON signal_dedup_log(window_end);

-- Function to check signal dedup
CREATE OR REPLACE FUNCTION check_signal_dedup(
    p_tenant_id UUID,
    p_signal_key TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
    is_duplicate BOOLEAN,
    existing_signal_id UUID,
    window_expires_at TIMESTAMPTZ
) AS $$
DECLARE
    v_dedup_key TEXT;
    v_existing RECORD;
BEGIN
    v_dedup_key := p_tenant_id || ':' || p_signal_key || ':' || p_entity_type || ':' || p_entity_id;
    
    -- Check for existing active window
    SELECT sdl.signal_id, sdl.window_end INTO v_existing
    FROM signal_dedup_log sdl
    WHERE sdl.dedup_key = v_dedup_key
    AND sdl.window_end > NOW();
    
    IF v_existing.signal_id IS NOT NULL THEN
        RETURN QUERY SELECT TRUE, v_existing.signal_id, v_existing.window_end;
    ELSE
        -- Clean up expired entries
        DELETE FROM signal_dedup_log WHERE window_end < NOW() - INTERVAL '1 hour';
        
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMPTZ;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to register signal in dedup window
CREATE OR REPLACE FUNCTION register_signal_dedup(
    p_tenant_id UUID,
    p_signal_key TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_signal_id UUID,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS VOID AS $$
DECLARE
    v_dedup_key TEXT;
BEGIN
    v_dedup_key := p_tenant_id || ':' || p_signal_key || ':' || p_entity_type || ':' || p_entity_id;
    
    INSERT INTO signal_dedup_log (
        tenant_id, signal_key, entity_type, entity_id, dedup_key, signal_id,
        window_start, window_end
    ) VALUES (
        p_tenant_id, p_signal_key, p_entity_type, p_entity_id, v_dedup_key, p_signal_id,
        NOW(), NOW() + (p_window_minutes || ' minutes')::INTERVAL
    )
    ON CONFLICT (dedup_key) DO UPDATE SET
        signal_id = EXCLUDED.signal_id,
        window_end = NOW() + (p_window_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. SEMANTIC SEARCH FUNCTION
-- ============================================================================
-- Optimized hybrid search function

CREATE OR REPLACE FUNCTION semantic_search(
    p_tenant_id UUID,
    p_query_embedding vector(1536),
    p_query_text TEXT DEFAULT NULL,
    p_top_k INTEGER DEFAULT 10,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_source_types TEXT[] DEFAULT NULL,
    p_min_score NUMERIC DEFAULT 0.5
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    similarity_score NUMERIC,
    keyword_score NUMERIC,
    combined_score NUMERIC,
    source_type TEXT,
    source_name TEXT,
    entity_type TEXT,
    entity_id TEXT,
    file_id UUID,
    session_id UUID,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH vector_results AS (
        SELECT 
            dc.id AS chunk_id,
            dc.content,
            1 - (ce.embedding <=> p_query_embedding) AS similarity,
            dc.source_type,
            dc.source_name,
            dc.entity_type,
            dc.entity_id,
            dc.file_id,
            dc.session_id
        FROM chunk_embeddings ce
        JOIN document_chunks dc ON dc.id = ce.chunk_id
        WHERE ce.tenant_id = p_tenant_id
        AND (p_entity_type IS NULL OR dc.entity_type = p_entity_type)
        AND (p_entity_id IS NULL OR dc.entity_id = p_entity_id)
        AND (p_source_types IS NULL OR dc.source_type = ANY(p_source_types))
        ORDER BY ce.embedding <=> p_query_embedding
        LIMIT p_top_k * 2
    ),
    keyword_results AS (
        SELECT 
            vr.chunk_id,
            CASE 
                WHEN p_query_text IS NOT NULL 
                THEN ts_rank(to_tsvector('english', vr.content), plainto_tsquery('english', p_query_text))
                ELSE 0
            END AS keyword_rank
        FROM vector_results vr
    )
    SELECT 
        vr.chunk_id,
        vr.content,
        vr.similarity::NUMERIC AS similarity_score,
        COALESCE(kr.keyword_rank, 0)::NUMERIC AS keyword_score,
        (vr.similarity * 0.7 + COALESCE(kr.keyword_rank, 0) * 0.3)::NUMERIC AS combined_score,
        vr.source_type,
        vr.source_name,
        vr.entity_type,
        vr.entity_id,
        vr.file_id,
        vr.session_id,
        jsonb_build_object(
            'chunk_index', dc.chunk_index,
            'chunk_type', dc.chunk_type,
            'token_count', dc.token_count
        ) AS metadata
    FROM vector_results vr
    LEFT JOIN keyword_results kr ON kr.chunk_id = vr.chunk_id
    JOIN document_chunks dc ON dc.id = vr.chunk_id
    WHERE vr.similarity >= p_min_score
    ORDER BY (vr.similarity * 0.7 + COALESCE(kr.keyword_rank, 0) * 0.3) DESC
    LIMIT p_top_k;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. SESSION SEARCH FUNCTION
-- ============================================================================
-- Search across AI sessions by content similarity

CREATE OR REPLACE FUNCTION session_search(
    p_tenant_id UUID,
    p_query_embedding vector(1536),
    p_top_k INTEGER DEFAULT 10,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_min_score NUMERIC DEFAULT 0.5
)
RETURNS TABLE (
    session_id UUID,
    session_summary TEXT,
    similarity_score NUMERIC,
    embedding_type TEXT,
    session_start TIMESTAMPTZ,
    tool_names TEXT[],
    entity_type TEXT,
    entity_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.session_id,
        COALESCE(s.session_summary, se.content_embedded) AS session_summary,
        (1 - (se.embedding <=> p_query_embedding))::NUMERIC AS similarity_score,
        se.embedding_type,
        s.session_start,
        s.tool_names,
        s.entity_type,
        s.entity_id
    FROM session_embeddings se
    JOIN ai_sessions s ON s.id = se.session_id
    WHERE se.tenant_id = p_tenant_id
    AND (p_entity_type IS NULL OR s.entity_type = p_entity_type)
    AND (p_entity_id IS NULL OR s.entity_id = p_entity_id)
    AND (1 - (se.embedding <=> p_query_embedding)) >= p_min_score
    ORDER BY se.embedding <=> p_query_embedding
    LIMIT p_top_k;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. VIEWS FOR OBSERVABILITY
-- ============================================================================

-- Embedding coverage by source
CREATE OR REPLACE VIEW v_embedding_coverage AS
SELECT 
    dc.tenant_id,
    dc.source_type,
    COUNT(dc.id) AS total_chunks,
    COUNT(ce.id) AS embedded_chunks,
    ROUND(COUNT(ce.id)::NUMERIC / NULLIF(COUNT(dc.id), 0) * 100, 2) AS coverage_pct,
    SUM(dc.token_count) AS total_tokens
FROM document_chunks dc
LEFT JOIN chunk_embeddings ce ON ce.chunk_id = dc.id
GROUP BY dc.tenant_id, dc.source_type;

-- Recent search analytics
CREATE OR REPLACE VIEW v_search_analytics AS
SELECT 
    tenant_id,
    DATE(created_at) AS search_date,
    search_type,
    COUNT(*) AS search_count,
    AVG(result_count) AS avg_results,
    AVG(duration_ms) AS avg_duration_ms
FROM search_history
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY tenant_id, DATE(created_at), search_type;

-- ============================================================================
-- 10. CLEANUP FUNCTION
-- ============================================================================

-- Cleanup old dedup entries
CREATE OR REPLACE FUNCTION cleanup_expired_dedup()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM signal_dedup_log WHERE window_end < NOW() - INTERVAL '1 day';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. FILE CONTENT TABLE (For Store Service)
-- ============================================================================
-- Stores file content for small/medium files (large files use R2)

CREATE TABLE IF NOT EXISTS file_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES file_versions(id) ON DELETE CASCADE,
    
    -- Content (text for now, can be bytea for binary)
    content TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One content per version
    CONSTRAINT unique_version_content UNIQUE (version_id)
);

-- Add columns to files table if not exists
DO $$
BEGIN
    -- Add content_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'content_type') THEN
        ALTER TABLE files ADD COLUMN content_type TEXT DEFAULT 'application/octet-stream';
    END IF;
    
    -- Add size_bytes column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'size_bytes') THEN
        ALTER TABLE files ADD COLUMN size_bytes BIGINT DEFAULT 0;
    END IF;
    
    -- Add status column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'status') THEN
        ALTER TABLE files ADD COLUMN status TEXT DEFAULT 'pending_upload';
    END IF;
    
    -- Add deleted_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'deleted_at') THEN
        ALTER TABLE files ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add columns to file_versions table if not exists
DO $$
BEGIN
    -- Add chunk_count column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'file_versions' AND column_name = 'chunk_count') THEN
        ALTER TABLE file_versions ADD COLUMN chunk_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add processed_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'file_versions' AND column_name = 'processed_at') THEN
        ALTER TABLE file_versions ADD COLUMN processed_at TIMESTAMPTZ;
    END IF;
    
    -- Add error_message column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'file_versions' AND column_name = 'error_message') THEN
        ALTER TABLE file_versions ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- ============================================================================
-- 12. SESSION ENTITY LINKS (For MCP Auto-Linking)
-- ============================================================================
-- Links AI sessions to Spine entities for relationship tracking

CREATE TABLE IF NOT EXISTS session_entity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    link_type TEXT NOT NULL DEFAULT 'related', -- primary, mentioned, related
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_session_entity_link UNIQUE (session_id, entity_type, entity_id)
);

-- Indexes for session_entity_links
CREATE INDEX IF NOT EXISTS idx_session_entity_links_session ON session_entity_links(session_id);
CREATE INDEX IF NOT EXISTS idx_session_entity_links_entity ON session_entity_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_session_entity_links_tenant ON session_entity_links(tenant_id);

-- ============================================================================
-- 13. ADD COLUMNS TO AI_SESSIONS IF NEEDED
-- ============================================================================

DO $$
BEGIN
    -- Add entity_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ai_sessions' AND column_name = 'entity_type') THEN
        ALTER TABLE ai_sessions ADD COLUMN entity_type TEXT;
    END IF;
    
    -- Add entity_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ai_sessions' AND column_name = 'entity_id') THEN
        ALTER TABLE ai_sessions ADD COLUMN entity_id TEXT;
    END IF;
    
    -- Add tool_names column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ai_sessions' AND column_name = 'tool_names') THEN
        ALTER TABLE ai_sessions ADD COLUMN tool_names TEXT[];
    END IF;
END $$;

