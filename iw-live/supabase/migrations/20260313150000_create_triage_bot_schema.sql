-- Triage Bot base schema (Flow C) — triage_results + triage_actions
-- Supabase MCP applied as create_triage_bot_schema; this file keeps local/reset in sync.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE triage_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE triage_category AS ENUM (
    'question', 'bug_report', 'feature_request', 'support',
    'feedback', 'urgent', 'general', 'spam'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS triage_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  channel_id TEXT,
  user_id TEXT,
  team_id TEXT,
  content TEXT NOT NULL,
  priority triage_priority NOT NULL,
  category triage_category NOT NULL,
  confidence NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  suggested_actions TEXT[] DEFAULT '{}',
  sentiment sentiment_type DEFAULT 'neutral',
  keywords TEXT[] DEFAULT '{}',
  assignee_suggestion TEXT,
  requires_immediate_attention BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS triage_results_message_id_idx ON triage_results(message_id);
CREATE INDEX IF NOT EXISTS triage_results_platform_idx ON triage_results(platform);
CREATE INDEX IF NOT EXISTS triage_results_priority_idx ON triage_results(priority);
CREATE INDEX IF NOT EXISTS triage_results_category_idx ON triage_results(category);
CREATE INDEX IF NOT EXISTS triage_results_created_at_idx ON triage_results(created_at DESC);

CREATE TABLE IF NOT EXISTS triage_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  triage_result_id UUID NOT NULL REFERENCES triage_results(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS triage_actions_triage_result_id_idx ON triage_actions(triage_result_id);

DROP TRIGGER IF EXISTS update_triage_results_updated_at ON triage_results;
CREATE TRIGGER update_triage_results_updated_at
  BEFORE UPDATE ON triage_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE triage_results IS 'Stores AI-powered triage analysis; Flow C session triage.';
