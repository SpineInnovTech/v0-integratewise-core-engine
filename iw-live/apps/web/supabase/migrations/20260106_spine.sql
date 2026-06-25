-- SPINE Schema Migration
-- Version: 1.0.0
-- Date: 2026-01-06
-- Description: Create SPINE entity tables with governance and audit

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Data classification enum
CREATE TYPE data_class AS ENUM ('public', 'internal', 'confidential', 'pii');

-- Task status enum
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done', 'cancelled');

-- Task priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Plan status enum
CREATE TYPE plan_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

-- Integration status enum
CREATE TYPE integration_status AS ENUM ('active', 'paused', 'error', 'disconnected');

-- Source type enum
CREATE TYPE source_type AS ENUM ('slack', 'discord', 'hubspot', 'notion', 'gmail', 'sheets', 'asana', 'attio', 'github', 'salesforce', 'pipedrive', 'custom');

-- SPINE Tasks Table
CREATE TABLE IF NOT EXISTS spine_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  hub_id UUID,
  source_id TEXT NOT NULL,
  source_type source_type NOT NULL,
  title TEXT NOT NULL CHECK (length(title) <= 500),
  description TEXT,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assignee_id UUID,
  assignee_email TEXT,
  tags TEXT[] DEFAULT '{}',
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  dependencies UUID[] DEFAULT '{}',
  data_class data_class DEFAULT 'internal',
  spine_schema_version TEXT DEFAULT '1.0.0',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, source_type)
);

-- SPINE Notes Table
CREATE TABLE IF NOT EXISTS spine_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  hub_id UUID,
  source_id TEXT NOT NULL,
  source_type source_type NOT NULL,
  title TEXT CHECK (length(title) <= 500),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  linked_to JSONB DEFAULT '[]',
  format TEXT DEFAULT 'plain' CHECK (format IN ('plain', 'markdown', 'html')),
  data_class data_class DEFAULT 'internal',
  spine_schema_version TEXT DEFAULT '1.0.0',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, source_type)
);

-- SPINE Conversations Table
CREATE TABLE IF NOT EXISTS spine_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  hub_id UUID,
  source_id TEXT NOT NULL,
  source_type source_type NOT NULL,
  channel_name TEXT,
  participants JSONB DEFAULT '[]',
  messages JSONB DEFAULT '[]',
  summary TEXT,
  decisions TEXT[] DEFAULT '{}',
  action_items UUID[] DEFAULT '{}',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  data_class data_class DEFAULT 'confidential',
  spine_schema_version TEXT DEFAULT '1.0.0',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, source_type)
);

-- SPINE Plans Table
CREATE TABLE IF NOT EXISTS spine_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  hub_id UUID,
  source_id TEXT NOT NULL,
  source_type source_type NOT NULL,
  title TEXT NOT NULL CHECK (length(title) <= 500),
  description TEXT,
  goals JSONB DEFAULT '[]',
  tasks UUID[] DEFAULT '{}',
  status plan_status DEFAULT 'planning',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  owner_id UUID,
  budget JSONB,
  data_class data_class DEFAULT 'internal',
  spine_schema_version TEXT DEFAULT '1.0.0',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, source_type)
);

-- Integrations Table (updated)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  type source_type NOT NULL,
  name TEXT NOT NULL CHECK (length(name) <= 100),
  credentials_ref TEXT,
  config JSONB DEFAULT '{}',
  status integration_status DEFAULT 'active',
  last_sync TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'hourly' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  spine_schema_version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, type, name)
);

-- Loader Runs Table (audit trail)
CREATE TABLE IF NOT EXISTS loader_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  source source_type NOT NULL,
  time_window_since TIMESTAMPTZ NOT NULL,
  time_window_until TIMESTAMPTZ NOT NULL,
  pages_fetched INTEGER DEFAULT 0,
  items_transformed INTEGER DEFAULT 0,
  items_deduped INTEGER DEFAULT 0,
  items_written INTEGER DEFAULT 0,
  warnings JSONB DEFAULT '[]',
  duration_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approvals Table (governance)
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('publish_task', 'publish_note', 'publish_plan', 'redact_pii', 'export_data', 'delete_data')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'note', 'conversation', 'plan', 'integration')),
  entity_id UUID NOT NULL,
  approver_id UUID NOT NULL,
  approver_email TEXT NOT NULL,
  rationale TEXT NOT NULL,
  approved BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spine_tasks_workspace ON spine_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_spine_tasks_updated ON spine_tasks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_spine_tasks_status ON spine_tasks(status);
CREATE INDEX IF NOT EXISTS idx_spine_tasks_source ON spine_tasks(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_spine_notes_workspace ON spine_notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_spine_notes_updated ON spine_notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_spine_notes_source ON spine_notes(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_spine_conversations_workspace ON spine_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_spine_conversations_updated ON spine_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_spine_conversations_source ON spine_conversations(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_spine_plans_workspace ON spine_plans(workspace_id);
CREATE INDEX IF NOT EXISTS idx_spine_plans_updated ON spine_plans(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_spine_plans_source ON spine_plans(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

CREATE INDEX IF NOT EXISTS idx_loader_runs_workspace ON loader_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_loader_runs_created ON loader_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_approvals_workspace ON approvals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_approvals_entity ON approvals(entity_type, entity_id);

-- Row Level Security (RLS)
ALTER TABLE spine_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loader_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - extend based on auth)
CREATE POLICY "Users can access their workspace spine_tasks" ON spine_tasks
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their workspace spine_notes" ON spine_notes
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their workspace spine_conversations" ON spine_conversations
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their workspace spine_plans" ON spine_plans
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their workspace integrations" ON integrations
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their workspace loader_runs" ON loader_runs
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their workspace approvals" ON approvals
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspaces WHERE user_id = auth.uid()));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_spine_tasks_updated_at BEFORE UPDATE ON spine_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spine_notes_updated_at BEFORE UPDATE ON spine_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spine_conversations_updated_at BEFORE UPDATE ON spine_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spine_plans_updated_at BEFORE UPDATE ON spine_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
