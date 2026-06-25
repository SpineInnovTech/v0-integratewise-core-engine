-- ============================================
-- Migration: Onboarding & Integrations Tables
-- Created: 2026-01-29
-- Purpose: Support 60-second onboarding flow
-- ============================================

-- Integrations table: stores connected tools
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID,
    provider VARCHAR(50) NOT NULL, -- slack, notion, hubspot, etc.
    provider_account_id VARCHAR(255), -- external account ID
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disconnected')),
    access_token TEXT, -- encrypted
    refresh_token TEXT, -- encrypted
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[], -- granted OAuth scopes
    metadata JSONB DEFAULT '{}',
    first_sync_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    sync_cursor TEXT, -- for incremental sync
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for integrations
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id ON integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_user_provider ON integrations(user_id, provider, provider_account_id);

-- Loader runs: tracks data sync jobs
CREATE TABLE IF NOT EXISTS loader_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    records_fetched INTEGER DEFAULT 0,
    records_normalized INTEGER DEFAULT 0,
    records_stored INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for loader_runs
CREATE INDEX IF NOT EXISTS idx_loader_runs_integration_id ON loader_runs(integration_id);
CREATE INDEX IF NOT EXISTS idx_loader_runs_user_id ON loader_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_loader_runs_status ON loader_runs(status);
CREATE INDEX IF NOT EXISTS idx_loader_runs_created_at ON loader_runs(created_at DESC);

-- Onboarding progress: tracks user onboarding state
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    tenant_id UUID,
    current_step VARCHAR(50) DEFAULT 'template',
    template_id VARCHAR(50),
    template_name VARCHAR(100),
    selected_tools TEXT[],
    uploaded_files TEXT[],
    completed_steps TEXT[] DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Index for onboarding_progress
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);

-- User workspaces: stores workspace configuration
CREATE TABLE IF NOT EXISTS user_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID,
    name VARCHAR(255) NOT NULL DEFAULT 'My Workspace',
    template_id VARCHAR(50),
    template_config JSONB DEFAULT '{}',
    pipeline_stages TEXT[],
    default_currency VARCHAR(3) DEFAULT 'USD',
    fiscal_year_start INTEGER DEFAULT 1,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user_workspaces
CREATE INDEX IF NOT EXISTS idx_user_workspaces_user_id ON user_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workspaces_tenant_id ON user_workspaces(tenant_id);

-- File uploads: tracks uploaded files during onboarding
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    storage_path TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    extracted_records INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for file_uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status);

-- RLS Policies

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loader_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Integrations policies
CREATE POLICY integrations_select_own ON integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY integrations_insert_own ON integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY integrations_update_own ON integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY integrations_delete_own ON integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Loader runs policies
CREATE POLICY loader_runs_select_own ON loader_runs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY loader_runs_insert_own ON loader_runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Onboarding progress policies
CREATE POLICY onboarding_progress_all ON onboarding_progress
    FOR ALL USING (auth.uid() = user_id);

-- User workspaces policies
CREATE POLICY user_workspaces_all ON user_workspaces
    FOR ALL USING (auth.uid() = user_id);

-- File uploads policies
CREATE POLICY file_uploads_all ON file_uploads
    FOR ALL USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_workspaces_updated_at
    BEFORE UPDATE ON user_workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
