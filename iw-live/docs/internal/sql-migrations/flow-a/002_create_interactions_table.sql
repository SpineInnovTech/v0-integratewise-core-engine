-- Interactions table for capturing all AI chats, browser history, webhooks
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'chatgpt', 'claude', 'perplexity', 'browser', 'webhook', 'manual'
  source_url TEXT,
  title TEXT,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS interactions_embedding_idx ON interactions 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS interactions_source_idx ON interactions(source);
CREATE INDEX IF NOT EXISTS interactions_created_at_idx ON interactions(created_at DESC);

-- Full text search index
CREATE INDEX IF NOT EXISTS interactions_content_search_idx ON interactions 
USING gin(to_tsvector('english', content));
