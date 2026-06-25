-- Migration: Brainstorm Sessions
-- Created: 2025-01-29
-- Description: Tables for AI-powered brainstorming sessions and ideation

-- ============================================
-- BRAINSTORM SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS brainstorm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  topic TEXT,
  ai_model TEXT DEFAULT 'openrouter',
  model_config JSONB DEFAULT '{}',
  insights JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_tenant ON brainstorm_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_user ON brainstorm_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_status ON brainstorm_sessions(status);
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_created ON brainstorm_sessions(created_at DESC);

-- ============================================
-- BRAINSTORM INSIGHTS (AI Outputs)
-- ============================================

CREATE TABLE IF NOT EXISTS brainstorm_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('idea', 'solution', 'risk', 'opportunity', 'action_item')),
  content TEXT NOT NULL,
  generated_by TEXT DEFAULT 'ai',
  score NUMERIC(3,2) DEFAULT 0.5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brainstorm_insights_session ON brainstorm_insights(session_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_insights_tenant ON brainstorm_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_insights_type ON brainstorm_insights(insight_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE brainstorm_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_brainstorm_sessions_select 
  ON brainstorm_sessions FOR SELECT 
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID OR auth.uid() = user_id);

CREATE POLICY rls_brainstorm_sessions_insert 
  ON brainstorm_sessions FOR INSERT 
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID AND auth.uid() = user_id);

CREATE POLICY rls_brainstorm_sessions_update 
  ON brainstorm_sessions FOR UPDATE 
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID OR auth.uid() = user_id)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID OR auth.uid() = user_id);

CREATE POLICY rls_brainstorm_sessions_delete 
  ON brainstorm_sessions FOR DELETE 
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID OR auth.uid() = user_id);

ALTER TABLE brainstorm_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_brainstorm_insights_select 
  ON brainstorm_insights FOR SELECT 
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY rls_brainstorm_insights_insert 
  ON brainstorm_insights FOR INSERT 
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY rls_brainstorm_insights_update 
  ON brainstorm_insights FOR UPDATE 
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY rls_brainstorm_insights_delete 
  ON brainstorm_insights FOR DELETE 
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
