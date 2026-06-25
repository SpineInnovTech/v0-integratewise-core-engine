-- Unified connectors table for all OAuth integrations
CREATE TABLE IF NOT EXISTS connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'slack', 'github', 'notion', 'hubspot', 'google', 'stripe'
  
  -- Connection status
  status VARCHAR(20) DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error', 'pending'
  
  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_type VARCHAR(50),
  expires_at TIMESTAMPTZ,
  
  -- Provider-specific identifiers
  provider_user_id TEXT,
  provider_workspace_id TEXT,
  provider_workspace_name TEXT,
  
  -- Metadata
  scopes TEXT[], -- granted OAuth scopes
  metadata JSONB DEFAULT '{}',
  
  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_connectors_user ON connectors(user_id);
CREATE INDEX IF NOT EXISTS idx_connectors_provider ON connectors(provider);
CREATE INDEX IF NOT EXISTS idx_connectors_status ON connectors(status);

-- Enable RLS
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own connectors" ON connectors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connectors" ON connectors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connectors" ON connectors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connectors" ON connectors
  FOR DELETE USING (auth.uid() = user_id);
