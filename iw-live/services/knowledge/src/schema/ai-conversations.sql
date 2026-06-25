-- ============================================================================
-- AI CONVERSATIONS & MEMORY SYSTEM (D1 Schema)
-- 30-day retention with auto-cleanup
-- ============================================================================

-- AI Conversations (chat sessions)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT,
    provider TEXT DEFAULT 'system', -- 'chatgpt', 'claude', 'system', 'mcp'
    context_type TEXT, -- 'account', 'signal', 'document', 'general'
    context_id TEXT, -- Reference to account_id, signal_id, etc.
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    summary TEXT,
    topics TEXT, -- JSON array of topics
    status TEXT DEFAULT 'active', -- 'active', 'archived', 'deleted'
    started_at TEXT NOT NULL,
    ended_at TEXT,
    expires_at TEXT, -- 30 days from started_at
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- AI Messages (individual messages in conversations)
CREATE TABLE IF NOT EXISTS ai_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system', 'tool'
    content TEXT NOT NULL,
    tool_calls TEXT, -- JSON array of MCP tool calls
    tool_results TEXT, -- JSON array of tool results
    metadata TEXT, -- JSON object with additional info
    tokens_used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- AI Memories (extracted insights from conversations)
CREATE TABLE IF NOT EXISTS ai_memories (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    conversation_id TEXT REFERENCES ai_conversations(id) ON DELETE SET NULL,
    memory_type TEXT NOT NULL, -- 'decision', 'preference', 'insight', 'action', 'rule', 'fact'
    content TEXT NOT NULL,
    entity_type TEXT, -- 'account', 'contact', 'deal', 'user'
    entity_id TEXT, -- Reference to related entity
    confidence REAL DEFAULT 0.8,
    source TEXT DEFAULT 'ai_extracted', -- 'ai_extracted', 'user_confirmed', 'system'
    is_confirmed INTEGER DEFAULT 0,
    confirmed_by TEXT,
    confirmed_at TEXT,
    expires_at TEXT, -- NULL for permanent memories
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- AI Session Summaries (knowledge bank artifacts)
CREATE TABLE IF NOT EXISTS ai_session_summaries (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    conversation_id TEXT REFERENCES ai_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    summary_md TEXT NOT NULL,
    topics TEXT, -- JSON array
    tool_calls TEXT, -- JSON array of tools used
    memories_extracted INTEGER DEFAULT 0,
    artifact_uri TEXT, -- GCS/R2 URI
    embedding_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON ai_conversations(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_context ON ai_conversations(tenant_id, context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_conversations_expires ON ai_conversations(expires_at);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON ai_conversations(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON ai_messages(tenant_id);

CREATE INDEX IF NOT EXISTS idx_memories_tenant ON ai_memories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memories_entity ON ai_memories(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON ai_memories(tenant_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_expires ON ai_memories(expires_at);

CREATE INDEX IF NOT EXISTS idx_summaries_tenant ON ai_session_summaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_summaries_conversation ON ai_session_summaries(conversation_id);
