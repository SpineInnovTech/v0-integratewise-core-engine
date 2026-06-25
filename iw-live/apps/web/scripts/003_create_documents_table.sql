-- Documents/Knowledge Base table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'strategy', 'sales', 'marketing', 'operations', 'delivery', 'finance', 'hr', 'product', 'technology'
  description TEXT,
  icon VARCHAR(50) DEFAULT 'FileText',
  embedding vector(1536),
  is_starred BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS documents_category_idx ON documents(category);
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS documents_content_search_idx ON documents 
USING gin(to_tsvector('english', title || ' ' || content || ' ' || COALESCE(description, '')));
