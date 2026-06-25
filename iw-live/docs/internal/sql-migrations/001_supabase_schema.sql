-- ============================================================================
-- IntegrateWise OS - Supabase Schema
-- ============================================================================
-- This migration creates all tables organized by architectural layer:
--   P0: Governance Plane (cross-cutting)
--   L0: Onboarding Layer (buckets, connectors)
--   L3: Adaptive Spine (entities, schema registry)
--   L2: Cognitive Brain (ai_chats, decisions, signals)
--   L1: The Workplace (contexts, tasks)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE bucket_state AS ENUM ('OFF', 'ADDING', 'SEEDED', 'LIVE');
CREATE TYPE connector_status AS ENUM ('disconnected', 'connecting', 'connected', 'error');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'practitioner', 'readonly');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'blocked');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE signal_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE tenant_plan AS ENUM ('personal', 'team', 'org', 'enterprise');
CREATE TYPE context_type AS ENUM ('workspace', 'entity', 'session', 'preference');
CREATE TYPE chat_role AS ENUM ('user', 'assistant', 'system', 'tool');
CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected', 'executed', 'failed');
CREATE TYPE proposer_type AS ENUM ('agent', 'user', 'automation');

-- ============================================================================
-- P0 — GOVERNANCE PLANE
-- ============================================================================

-- Tenants / Organizations
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan tenant_plan DEFAULT 'personal',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);

-- User profiles (linked to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'practitioner',
    department TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Audit log for P0 governance
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant_time ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);

-- ============================================================================
-- L0 — ONBOARDING LAYER
-- ============================================================================

-- Base buckets (Intent declarations)
CREATE TABLE base_buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bucket_type TEXT NOT NULL,
    state bucket_state DEFAULT 'OFF',
    connected_source TEXT,
    connector_status connector_status DEFAULT 'disconnected',
    connector_config JSONB,
    seed_method TEXT CHECK (seed_method IN ('oauth', 'csv', 'api', 'manual')),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, bucket_type)
);

CREATE INDEX idx_buckets_tenant_state ON base_buckets(tenant_id, state);

-- Department buckets
CREATE TABLE department_buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    department_key TEXT NOT NULL,
    state bucket_state DEFAULT 'OFF',
    required_base_buckets TEXT[] DEFAULT '{}',
    optional_base_buckets TEXT[] DEFAULT '{}',
    unlocked_modules TEXT[] DEFAULT '{}',
    unlocked_routes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, department_key)
);

CREATE INDEX idx_dept_buckets_tenant ON department_buckets(tenant_id);

-- ============================================================================
-- L3 — ADAPTIVE SPINE
-- ============================================================================

-- Spine entities (Single Source of Truth)
CREATE TABLE spine_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    external_id TEXT,
    source_system TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    lineage JSONB DEFAULT '{}',
    confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    maturity_level INTEGER DEFAULT 1 CHECK (maturity_level >= 1 AND maturity_level <= 5),
    completeness_score REAL DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_observed_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, entity_type, external_id, source_system)
);

CREATE INDEX idx_spine_tenant_type ON spine_entities(tenant_id, entity_type);
CREATE INDEX idx_spine_external ON spine_entities(tenant_id, external_id);
CREATE INDEX idx_spine_data_gin ON spine_entities USING GIN(data);

-- Schema registry (field observations)
CREATE TABLE spine_schema_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bucket_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    field_path TEXT NOT NULL,
    observed_type TEXT NOT NULL,
    sample_values JSONB DEFAULT '[]',
    observation_count INTEGER DEFAULT 1,
    stability_score REAL DEFAULT 0.5,
    first_observed_at TIMESTAMPTZ DEFAULT NOW(),
    last_observed_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, bucket_type, entity_type, field_path)
);

CREATE INDEX idx_schema_tenant_bucket ON spine_schema_registry(tenant_id, bucket_type);

-- Entity completeness scores
CREATE TABLE spine_entity_completeness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES spine_entities(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    required_fields TEXT[] DEFAULT '{}',
    present_fields TEXT[] DEFAULT '{}',
    completeness_score REAL DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 1),
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_completeness_entity ON spine_entity_completeness(entity_id);

-- ============================================================================
-- L2 — COGNITIVE BRAIN
-- ============================================================================

-- AI Chat sessions
CREATE TABLE ai_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    surface TEXT NOT NULL DEFAULT 'cognitive-drawer',
    context_entity_type TEXT,
    context_entity_id TEXT,
    model TEXT DEFAULT 'gpt-4o',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

CREATE INDEX idx_chats_user ON ai_chats(user_id, created_at DESC);
CREATE INDEX idx_chats_context ON ai_chats(context_entity_type, context_entity_id);

-- AI Chat messages
CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
    role chat_role NOT NULL,
    content TEXT NOT NULL,
    tool_calls JSONB,
    tool_results JSONB,
    evidence_refs TEXT[] DEFAULT '{}',
    tokens_input INTEGER,
    tokens_output INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_chat ON ai_chat_messages(chat_id, created_at);

-- Decision memory
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    decision_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    summary TEXT NOT NULL,
    reasoning_chain JSONB NOT NULL DEFAULT '[]',
    evidence_snapshot JSONB NOT NULL DEFAULT '{}',
    signals_snapshot JSONB DEFAULT '{}',
    policy_state JSONB DEFAULT '{}',
    trust_score REAL DEFAULT 0.5 CHECK (trust_score >= 0 AND trust_score <= 1),
    outcome TEXT,
    outcome_evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decisions_user ON decisions(user_id, created_at DESC);
CREATE INDEX idx_decisions_entity ON decisions(entity_type, entity_id);

-- Signals (requiring attention)
CREATE TABLE signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,
    severity signal_severity DEFAULT 'info',
    source TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    acknowledged_by UUID REFERENCES profiles(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_signals_tenant_active ON signals(tenant_id, created_at DESC) 
    WHERE resolved_at IS NULL;
CREATE INDEX idx_signals_entity ON signals(entity_type, entity_id);

-- ============================================================================
-- L1 — THE WORKPLACE
-- ============================================================================

-- Context store (user working context)
CREATE TABLE contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    context_type context_type NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    entity_type TEXT,
    entity_id TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id, context_type, key)
);

CREATE INDEX idx_contexts_user ON contexts(user_id, context_type);
CREATE INDEX idx_contexts_entity ON contexts(entity_type, entity_id);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    due_date DATE,
    entity_type TEXT,
    entity_id TEXT,
    department TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due ON tasks(user_id, due_date) WHERE status != 'done';

-- Action proposals (L2 → L1 approval flow)
CREATE TABLE action_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    proposed_by proposer_type NOT NULL,
    agent_id TEXT,
    action_type TEXT NOT NULL,
    target_entity_type TEXT,
    target_entity_id TEXT,
    summary TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    evidence_refs TEXT[] DEFAULT '{}',
    trust_score REAL DEFAULT 0.5 CHECK (trust_score >= 0 AND trust_score <= 1),
    status proposal_status DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_pending ON action_proposals(tenant_id, status, created_at DESC)
    WHERE status = 'pending';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Today's work queue
CREATE VIEW v_today_queue AS
SELECT 
    t.id,
    t.tenant_id,
    t.user_id,
    'task' AS item_type,
    t.title,
    t.priority::text,
    t.due_date::timestamptz AS due_at,
    t.entity_type,
    t.entity_id,
    jsonb_build_object('status', t.status, 'source', t.source) AS metadata
FROM tasks t
WHERE t.status != 'done'
  AND (t.due_date IS NULL OR t.due_date <= CURRENT_DATE + INTERVAL '1 day')

UNION ALL

SELECT
    s.id,
    s.tenant_id,
    NULL AS user_id,
    'signal' AS item_type,
    s.title,
    s.severity::text AS priority,
    s.created_at AS due_at,
    s.entity_type,
    s.entity_id,
    s.metadata
FROM signals s
WHERE s.resolved_at IS NULL
  AND s.severity IN ('warning', 'critical')

UNION ALL

SELECT
    ap.id,
    ap.tenant_id,
    NULL AS user_id,
    'approval' AS item_type,
    ap.summary AS title,
    CASE WHEN ap.trust_score < 0.3 THEN 'high' ELSE 'medium' END AS priority,
    ap.created_at AS due_at,
    ap.target_entity_type AS entity_type,
    ap.target_entity_id AS entity_id,
    jsonb_build_object('action_type', ap.action_type, 'proposed_by', ap.proposed_by) AS metadata
FROM action_proposals ap
WHERE ap.status = 'pending';

-- Bucket status overview
CREATE VIEW v_bucket_status AS
SELECT
    bb.id,
    bb.tenant_id,
    bb.bucket_type,
    bb.state::text,
    bb.connected_source,
    bb.connector_status::text,
    COALESCE(ec.entity_count, 0) AS entity_count,
    COALESCE(ec.completeness_avg, 0) AS completeness_avg
FROM base_buckets bb
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) AS entity_count,
        AVG(completeness_score) AS completeness_avg
    FROM spine_entities se
    WHERE se.tenant_id = bb.tenant_id
      AND se.source_system = bb.bucket_type
) ec ON true;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get current user's tenant ID
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

-- Check if current user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
    
    -- Admin and owner have all permissions
    IF user_role IN ('owner', 'admin') THEN
        RETURN TRUE;
    END IF;
    
    -- Manager can approve actions
    IF permission = 'approve_actions' AND user_role = 'manager' THEN
        RETURN TRUE;
    END IF;
    
    -- All users can read
    IF permission = 'read' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER tr_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_base_buckets_updated_at BEFORE UPDATE ON base_buckets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_department_buckets_updated_at BEFORE UPDATE ON department_buckets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_spine_entities_updated_at BEFORE UPDATE ON spine_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_ai_chats_updated_at BEFORE UPDATE ON ai_chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_contexts_updated_at BEFORE UPDATE ON contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine_schema_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine_entity_completeness ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_proposals ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY profiles_select ON profiles FOR SELECT
    USING (tenant_id = get_tenant_id());
CREATE POLICY profiles_update ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Base buckets: Tenant-scoped access
CREATE POLICY buckets_select ON base_buckets FOR SELECT
    USING (tenant_id = get_tenant_id());
CREATE POLICY buckets_insert ON base_buckets FOR INSERT
    WITH CHECK (tenant_id = get_tenant_id() AND has_permission('manage_buckets'));
CREATE POLICY buckets_update ON base_buckets FOR UPDATE
    USING (tenant_id = get_tenant_id() AND has_permission('manage_buckets'));

-- Spine entities: Tenant-scoped read, write requires permission
CREATE POLICY spine_select ON spine_entities FOR SELECT
    USING (tenant_id = get_tenant_id());
CREATE POLICY spine_insert ON spine_entities FOR INSERT
    WITH CHECK (tenant_id = get_tenant_id());
CREATE POLICY spine_update ON spine_entities FOR UPDATE
    USING (tenant_id = get_tenant_id());

-- AI Chats: Users can only access their own chats
CREATE POLICY chats_select ON ai_chats FOR SELECT
    USING (user_id = auth.uid() OR has_permission('admin'));
CREATE POLICY chats_insert ON ai_chats FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY chats_update ON ai_chats FOR UPDATE
    USING (user_id = auth.uid());
CREATE POLICY chats_delete ON ai_chats FOR DELETE
    USING (user_id = auth.uid());

-- AI Chat messages: Access via parent chat
CREATE POLICY messages_select ON ai_chat_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM ai_chats WHERE id = chat_id AND user_id = auth.uid()
    ));
CREATE POLICY messages_insert ON ai_chat_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM ai_chats WHERE id = chat_id AND user_id = auth.uid()
    ));

-- Contexts: Users can only access their own contexts
CREATE POLICY contexts_select ON contexts FOR SELECT
    USING (user_id = auth.uid());
CREATE POLICY contexts_insert ON contexts FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY contexts_update ON contexts FOR UPDATE
    USING (user_id = auth.uid());
CREATE POLICY contexts_delete ON contexts FOR DELETE
    USING (user_id = auth.uid());

-- Tasks: Users can access their own or team tasks (if manager+)
CREATE POLICY tasks_select ON tasks FOR SELECT
    USING (user_id = auth.uid() OR has_permission('manage_team'));
CREATE POLICY tasks_insert ON tasks FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY tasks_update ON tasks FOR UPDATE
    USING (user_id = auth.uid() OR has_permission('manage_team'));

-- Signals: Tenant-scoped
CREATE POLICY signals_select ON signals FOR SELECT
    USING (tenant_id = get_tenant_id());
CREATE POLICY signals_update ON signals FOR UPDATE
    USING (tenant_id = get_tenant_id());

-- Decisions: User can see their own, managers can see team
CREATE POLICY decisions_select ON decisions FOR SELECT
    USING (user_id = auth.uid() OR has_permission('manage_team'));
CREATE POLICY decisions_insert ON decisions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Action proposals: Tenant-scoped, approval requires permission
CREATE POLICY proposals_select ON action_proposals FOR SELECT
    USING (tenant_id = get_tenant_id());
CREATE POLICY proposals_update ON action_proposals FOR UPDATE
    USING (tenant_id = get_tenant_id() AND has_permission('approve_actions'));

-- Audit log: Read-only for admins
CREATE POLICY audit_select ON audit_log FOR SELECT
    USING (tenant_id = get_tenant_id() AND has_permission('admin'));
CREATE POLICY audit_insert ON audit_log FOR INSERT
    WITH CHECK (tenant_id = get_tenant_id());

-- ============================================================================
-- SEED DATA (Optional)
-- ============================================================================

-- Insert default bucket types
-- INSERT INTO ... (run separately after tenant creation)
