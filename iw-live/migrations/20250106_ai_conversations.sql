-- AI Conversations Migration
-- Stores AI chat sessions with 30-day retention

-- AI Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  context_type TEXT, -- 'account', 'contact', 'deal', 'general'
  context_id TEXT,   -- ID of the related entity
  model TEXT DEFAULT 'gpt-4o-mini',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_call_id TEXT,
  tokens INTEGER DEFAULT 0,
  latency_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Memories table (extracted insights)
CREATE TABLE IF NOT EXISTS ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('insight', 'preference', 'fact', 'decision', 'action_item', 'relationship')),
  content TEXT NOT NULL,
  context_type TEXT,
  context_id TEXT,
  importance REAL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  source TEXT DEFAULT 'auto_extracted' CHECK (source IN ('auto_extracted', 'user_created', 'user_confirmed', 'system')),
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Session Summaries (for MCP tool writes)
CREATE TABLE IF NOT EXISTS ai_session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_points JSONB DEFAULT '[]',
  decisions JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  context_type TEXT,
  context_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context ON ai_conversations(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_expires ON ai_conversations(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON ai_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_memories_tenant ON ai_memories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user ON ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_conversation ON ai_memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_context ON ai_memories(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_type ON ai_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_memories_expires ON ai_memories(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_memories_importance ON ai_memories(importance DESC);

CREATE INDEX IF NOT EXISTS idx_ai_session_summaries_tenant ON ai_session_summaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_session_summaries_conversation ON ai_session_summaries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_session_summaries_expires ON ai_session_summaries(expires_at);

-- Row Level Security
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_session_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id AND tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can create own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can update own conversations" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id AND tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can delete own conversations" ON ai_conversations
  FOR DELETE USING (auth.uid() = user_id AND tenant_id = current_setting('app.tenant_id', true));

-- RLS Policies for ai_messages
CREATE POLICY "Users can view messages in own conversations" ON ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_messages.conversation_id 
      AND ai_conversations.user_id = auth.uid()
      AND ai_conversations.tenant_id = current_setting('app.tenant_id', true)
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_messages.conversation_id 
      AND ai_conversations.user_id = auth.uid()
      AND ai_conversations.tenant_id = current_setting('app.tenant_id', true)
    )
  );

-- RLS Policies for ai_memories
CREATE POLICY "Users can view own memories" ON ai_memories
  FOR SELECT USING (auth.uid() = user_id AND tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can create own memories" ON ai_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can update own memories" ON ai_memories
  FOR UPDATE USING (auth.uid() = user_id AND tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can delete own memories" ON ai_memories
  FOR DELETE USING (auth.uid() = user_id AND tenant_id = current_setting('app.tenant_id', true));

-- RLS Policies for ai_session_summaries
CREATE POLICY "Users can view own session summaries" ON ai_session_summaries
  FOR SELECT USING (auth.uid() = created_by AND tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can create own session summaries" ON ai_session_summaries
  FOR INSERT WITH CHECK (auth.uid() = created_by AND tenant_id = current_setting('app.tenant_id', true));

-- Function to auto-cleanup expired records
CREATE OR REPLACE FUNCTION cleanup_expired_ai_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired conversations (cascades to messages)
  DELETE FROM ai_conversations WHERE expires_at < NOW();
  
  -- Delete expired memories
  DELETE FROM ai_memories WHERE expires_at < NOW();
  
  -- Delete expired session summaries
  DELETE FROM ai_session_summaries WHERE expires_at < NOW();
END;
$$;

-- Function to update message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ai_conversations 
    SET message_count = message_count + 1,
        total_tokens = total_tokens + COALESCE(NEW.tokens, 0),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ai_conversations 
    SET message_count = message_count - 1,
        total_tokens = total_tokens - COALESCE(OLD.tokens, 0),
        updated_at = NOW()
    WHERE id = OLD.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_message_count
AFTER INSERT OR DELETE ON ai_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_message_count();

-- Comment for documentation
COMMENT ON TABLE ai_conversations IS 'AI chat conversations with 30-day retention';
COMMENT ON TABLE ai_messages IS 'Messages within AI conversations';
COMMENT ON TABLE ai_memories IS 'Extracted insights and memories from AI conversations';
COMMENT ON TABLE ai_session_summaries IS 'Session summaries written via MCP tools';
COMMENT ON COLUMN ai_memories.importance IS 'Importance score from 0-1, used for prioritizing memories';
COMMENT ON COLUMN ai_memories.is_confirmed IS 'Whether user has confirmed this memory is accurate';
