-- Slack/Discord message tracking
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL, -- 'slack' or 'discord'
  platform_id TEXT NOT NULL,
  channel_id TEXT,
  channel_name TEXT,
  guild_id TEXT, -- Discord server ID
  team_id TEXT, -- Slack workspace ID
  user_id TEXT,
  user_name TEXT,
  content TEXT,
  thread_id TEXT,
  is_bot BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slack/Discord channels tracking
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL,
  platform_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type VARCHAR(20), -- 'public', 'private', 'dm', 'thread'
  guild_id TEXT,
  team_id TEXT,
  topic TEXT,
  member_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, platform_id)
);

-- Slack/Discord users mapping
CREATE TABLE IF NOT EXISTS chat_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL,
  platform_id TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_bot BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  status VARCHAR(20),
  timezone TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, platform_id)
);

-- Integration configs for Slack/Discord
CREATE TABLE IF NOT EXISTS chat_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  -- Slack specific
  slack_team_id TEXT,
  slack_team_name TEXT,
  slack_bot_token TEXT,
  slack_signing_secret TEXT,
  -- Discord specific
  discord_guild_id TEXT,
  discord_guild_name TEXT,
  discord_bot_token TEXT,
  discord_public_key TEXT,
  discord_application_id TEXT,
  -- Sync settings
  sync_messages BOOLEAN DEFAULT true,
  sync_channels BOOLEAN DEFAULT true,
  sync_users BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_platform ON chat_messages(platform);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent ON chat_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_chat_channels_platform ON chat_channels(platform);
CREATE INDEX IF NOT EXISTS idx_chat_users_platform ON chat_users(platform);

-- Insert default integration configs
INSERT INTO chat_integrations (platform, enabled) VALUES
  ('slack', false),
  ('discord', false)
ON CONFLICT (platform) DO NOTHING;
