-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_interactions(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source VARCHAR(50),
  title TEXT,
  source_url TEXT,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.content,
    i.source,
    i.title,
    i.source_url,
    1 - (i.embedding <=> query_embedding) AS similarity,
    i.created_at,
    i.metadata
  FROM interactions i
  WHERE 
    i.embedding IS NOT NULL
    AND 1 - (i.embedding <=> query_embedding) > match_threshold
    AND (filter_source IS NULL OR i.source = filter_source)
  ORDER BY i.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Search documents function
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category VARCHAR(100),
  description TEXT,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.category,
    d.description,
    1 - (d.embedding <=> query_embedding) AS similarity,
    d.created_at
  FROM documents d
  WHERE 
    d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR d.category = filter_category)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Universal search function across all content types
CREATE OR REPLACE FUNCTION universal_search(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.6,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  content_type VARCHAR(50),
  title TEXT,
  content_preview TEXT,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 
      i.id,
      'interaction'::VARCHAR(50) AS content_type,
      COALESCE(i.title, LEFT(i.content, 100)) AS title,
      LEFT(i.content, 300) AS content_preview,
      1 - (i.embedding <=> query_embedding) AS similarity,
      i.created_at,
      jsonb_build_object('source', i.source, 'source_url', i.source_url) AS metadata
    FROM interactions i
    WHERE i.embedding IS NOT NULL
      AND 1 - (i.embedding <=> query_embedding) > match_threshold
  )
  UNION ALL
  (
    SELECT 
      d.id,
      'document'::VARCHAR(50) AS content_type,
      d.title,
      LEFT(d.content, 300) AS content_preview,
      1 - (d.embedding <=> query_embedding) AS similarity,
      d.created_at,
      jsonb_build_object('category', d.category, 'description', d.description) AS metadata
    FROM documents d
    WHERE d.embedding IS NOT NULL
      AND 1 - (d.embedding <=> query_embedding) > match_threshold
  )
  UNION ALL
  (
    SELECT 
      e.id,
      'email'::VARCHAR(50) AS content_type,
      e.subject AS title,
      LEFT(COALESCE(e.body, e.preview), 300) AS content_preview,
      1 - (e.embedding <=> query_embedding) AS similarity,
      e.received_at AS created_at,
      jsonb_build_object('sender', e.sender_name, 'folder', e.folder) AS metadata
    FROM emails e
    WHERE e.embedding IS NOT NULL
      AND 1 - (e.embedding <=> query_embedding) > match_threshold
  )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
