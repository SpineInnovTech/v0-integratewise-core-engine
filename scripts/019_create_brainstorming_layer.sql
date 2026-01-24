-- Brainstorming sessions table for capturing ideation
CREATE TABLE IF NOT EXISTS brainstorm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  participants TEXT[] DEFAULT '{}',
  session_type VARCHAR(30) DEFAULT 'general', -- 'general', 'product', 'marketing', 'sales', 'strategy'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'implemented'
  context TEXT, -- Full conversation/brainstorm content
  key_insights TEXT[],
  action_items TEXT[],
  embedding vector(1536), -- For semantic similarity
  source VARCHAR(50) DEFAULT 'manual', -- 'webhooks.integratewise.online', 'manual', 'slack', 'notion'
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI-generated insights from brainstorming
CREATE TABLE IF NOT EXISTS brainstorm_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
  insight_type VARCHAR(30) NOT NULL, -- 'task', 'blog_post', 'linkedin_post', 'email_campaign', 'pipeline_update', 'knowledge_article'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'scheduled', 'published', 'completed', 'cancelled'
  confidence_score NUMERIC(3,2) DEFAULT 0.75, -- AI confidence 0.00-1.00
  target_date DATE,
  assigned_to TEXT,
  metadata JSONB DEFAULT '{}', -- Extra fields based on insight_type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  result_id UUID, -- References the created entity (task_id, blog_post_id, etc.)
  result_type VARCHAR(30) -- 'task', 'document', 'campaign', 'deal'
);

-- Daily AI summaries
CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_date DATE NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  key_actions TEXT[] DEFAULT '{}',
  metrics_snapshot JSONB DEFAULT '{}',
  brainstorm_count INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  content_generated INTEGER DEFAULT 0,
  pipeline_updates INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brainstorm_status ON brainstorm_sessions(status);
CREATE INDEX IF NOT EXISTS idx_brainstorm_type ON brainstorm_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_brainstorm_date ON brainstorm_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_brainstorm_source ON brainstorm_sessions(source);
CREATE INDEX IF NOT EXISTS idx_brainstorm_embedding ON brainstorm_sessions 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_insights_session ON brainstorm_insights(session_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON brainstorm_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_status ON brainstorm_insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON brainstorm_insights(priority);

CREATE INDEX IF NOT EXISTS idx_daily_insights_date ON daily_insights(insight_date DESC);
