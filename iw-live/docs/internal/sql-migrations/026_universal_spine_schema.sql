-- Migration: 026_universal_spine_schema.sql
-- Description: Universal Spine Schema with Context-Aware Presentation
-- Philosophy: ONE backend, ONE Layer 2, ONE Layer 3 - Context determines filtering
-- Created: 2026-02-02
-- =============================================================================
-- UNIVERSAL SPINE SCHEMA
-- Every entity follows the same pattern:
--   - category: 'personal' | 'csm' | 'business' | 'team'
--   - scope: {owner_id, account_id, team_id, visibility}
--   - data: Entity-specific fields as JSONB
--   - relationships: Links to other entities
--   - metadata: Created/updated tracking
-- =============================================================================
-- =============================================================================
-- 1. UNIVERSAL TASKS TABLE
-- Same table serves Personal To-dos, CSM Account Tasks, Business Tasks
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- UNIVERSAL CONTEXT FIELDS
    entity_type VARCHAR(50) DEFAULT 'task',
    category VARCHAR(30) NOT NULL CHECK (
        category IN ('personal', 'csm', 'business', 'team')
    ),
    -- SCOPE: Who can see/access this
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   owner_id: UUID,        -- Who owns this (required for personal)
    --   account_id: UUID,      -- Which account (required for csm)
    --   team_id: UUID,         -- Which team (optional)
    --   visibility: 'private' | 'team' | 'org'
    -- }
    -- DATA: Entity-specific fields
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   title: string,
    --   description: string,
    --   status: 'todo' | 'in_progress' | 'done' | 'cancelled',
    --   priority: 'low' | 'medium' | 'high' | 'urgent',
    --   due_date: timestamp,
    --   estimated_hours: number,
    --   labels: string[]
    -- }
    -- RELATIONSHIPS: Links to other entities
    relationships JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   project_id: UUID,
    --   parent_task_id: UUID,
    --   linked_to: [{entity_type, entity_id}],
    --   tagged: string[]
    -- }
    -- METADATA
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Context-optimized indexes
CREATE INDEX idx_spine_tasks_personal ON spine_tasks((scope->>'owner_id'))
WHERE category = 'personal';
CREATE INDEX idx_spine_tasks_csm_account ON spine_tasks((scope->>'account_id'))
WHERE category = 'csm';
CREATE INDEX idx_spine_tasks_business ON spine_tasks(tenant_id, category)
WHERE category = 'business';
CREATE INDEX idx_spine_tasks_team ON spine_tasks((scope->>'team_id'))
WHERE category = 'team';
CREATE INDEX idx_spine_tasks_status ON spine_tasks(((data->>'status')));
CREATE INDEX idx_spine_tasks_due ON spine_tasks(((data->>'due_date')::timestamptz));
-- =============================================================================
-- 2. UNIVERSAL ACCOUNTS TABLE
-- CSM sees assigned accounts, Business sees all
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'account',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (category IN ('csm', 'business')),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   assigned_csm_id: UUID,
    --   assigned_am_id: UUID,
    --   team_id: UUID,
    --   region: string
    -- }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   name: string,
    --   domain: string,
    --   segment: 'enterprise' | 'mid-market' | 'smb',
    --   industry: string,
    --   arr: number,
    --   mrr: number,
    --   health_score: number (0-100),
    --   nps_score: number,
    --   contract_start: timestamp,
    --   contract_end: timestamp,
    --   status: 'active' | 'churned' | 'prospect'
    -- }
    relationships JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   parent_account_id: UUID,
    --   contacts: UUID[],
    --   contracts: UUID[],
    --   projects: UUID[]
    -- }
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_accounts_csm ON spine_accounts((scope->>'assigned_csm_id'))
WHERE category = 'csm';
CREATE INDEX idx_spine_accounts_business ON spine_accounts(tenant_id)
WHERE category = 'business';
CREATE INDEX idx_spine_accounts_health ON spine_accounts(((data->>'health_score')::int));
CREATE INDEX idx_spine_accounts_arr ON spine_accounts(((data->>'arr')::numeric));
CREATE INDEX idx_spine_accounts_segment ON spine_accounts(((data->>'segment')));
-- =============================================================================
-- 3. UNIVERSAL MEETINGS TABLE
-- Personal meetings, CSM customer meetings, Business portfolio reviews
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'meeting',
    category VARCHAR(30) NOT NULL CHECK (
        category IN ('personal', 'csm', 'business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   owner_id: UUID,
    --   account_id: UUID,
    --   attendees: UUID[],
    --   visibility: 'private' | 'team' | 'org'
    -- }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   title: string,
    --   type: 'qbr' | 'check-in' | 'kickoff' | 'escalation' | 'internal' | 'external',
    --   start_time: timestamp,
    --   end_time: timestamp,
    --   location: string,
    --   meeting_url: string,
    --   notes: string,
    --   recording_url: string,
    --   transcript: string,
    --   action_items: [{title, assignee, due_date}]
    -- }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_meetings_personal ON spine_meetings((scope->>'owner_id'))
WHERE category = 'personal';
CREATE INDEX idx_spine_meetings_csm ON spine_meetings((scope->>'account_id'))
WHERE category = 'csm';
CREATE INDEX idx_spine_meetings_date ON spine_meetings(((data->>'start_time')::timestamptz));
CREATE INDEX idx_spine_meetings_type ON spine_meetings(((data->>'type')));
-- =============================================================================
-- 4. UNIVERSAL PROJECTS TABLE
-- Personal projects, CSM implementation projects, Business initiatives
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'project',
    category VARCHAR(30) NOT NULL CHECK (
        category IN ('personal', 'csm', 'business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   name: string,
    --   description: string,
    --   status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled',
    --   start_date: timestamp,
    --   end_date: timestamp,
    --   progress_percent: number,
    --   budget: number,
    --   spent: number
    -- }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_projects_personal ON spine_projects((scope->>'owner_id'))
WHERE category = 'personal';
CREATE INDEX idx_spine_projects_csm ON spine_projects((scope->>'account_id'))
WHERE category = 'csm';
CREATE INDEX idx_spine_projects_status ON spine_projects(((data->>'status')));
-- =============================================================================
-- 5. UNIVERSAL OBJECTIVES TABLE
-- Personal goals, CSM success plans, Business OKRs
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'objective',
    category VARCHAR(30) NOT NULL CHECK (
        category IN ('personal', 'csm', 'business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   name: string,
    --   description: string,
    --   type: 'goal' | 'okr' | 'success_plan' | 'milestone',
    --   target_value: number,
    --   current_value: number,
    --   unit: string,
    --   status: 'not_started' | 'on_track' | 'at_risk' | 'completed',
    --   due_date: timestamp
    -- }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_objectives_personal ON spine_objectives((scope->>'owner_id'))
WHERE category = 'personal';
CREATE INDEX idx_spine_objectives_csm ON spine_objectives((scope->>'account_id'))
WHERE category = 'csm';
-- =============================================================================
-- 6. UNIVERSAL DOCUMENTS TABLE
-- Personal docs, CSM account docs, Business reports
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'document',
    category VARCHAR(30) NOT NULL CHECK (
        category IN ('personal', 'csm', 'business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   title: string,
    --   type: 'note' | 'report' | 'presentation' | 'contract' | 'email' | 'transcript',
    --   file_url: string,
    --   content_text: string,
    --   version: string
    -- }
    -- For semantic search
    content_embedding vector(1536),
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_documents_personal ON spine_documents((scope->>'owner_id'))
WHERE category = 'personal';
CREATE INDEX idx_spine_documents_csm ON spine_documents((scope->>'account_id'))
WHERE category = 'csm';
CREATE INDEX idx_spine_documents_type ON spine_documents(((data->>'type')));
-- =============================================================================
-- 7. UNIVERSAL CONTACTS TABLE
-- Used primarily in CSM/Business contexts
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'contact',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (category IN ('personal', 'csm', 'business')),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   first_name: string,
    --   last_name: string,
    --   email: string,
    --   phone: string,
    --   title: string,
    --   role: 'champion' | 'decision_maker' | 'influencer' | 'end_user',
    --   sentiment: 'positive' | 'neutral' | 'negative',
    --   last_contacted: timestamp
    -- }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_contacts_account ON spine_contacts((scope->>'account_id'));
CREATE INDEX idx_spine_contacts_role ON spine_contacts(((data->>'role')));
-- =============================================================================
-- 8. UNIVERSAL TIMELINE/EVENTS TABLE
-- Activity feed across all contexts
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'event',
    category VARCHAR(30) NOT NULL CHECK (
        category IN ('personal', 'csm', 'business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   event_type: string,
    --   title: string,
    --   description: string,
    --   occurred_at: timestamp,
    --   source: string,
    --   impact: 'positive' | 'neutral' | 'negative'
    -- }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_events_personal ON spine_events((scope->>'owner_id'), created_at DESC)
WHERE category = 'personal';
CREATE INDEX idx_spine_events_csm ON spine_events((scope->>'account_id'), created_at DESC)
WHERE category = 'csm';
CREATE INDEX idx_spine_events_business ON spine_events(tenant_id, created_at DESC)
WHERE category = 'business';
-- =============================================================================
-- UNIVERSAL ENTITY VIEW
-- Single view that unions all entity types for cross-entity queries
-- =============================================================================
CREATE OR REPLACE VIEW v_spine_entities AS
SELECT id,
    tenant_id,
    entity_type,
    category,
    scope,
    data,
    relationships,
    created_at,
    updated_at
FROM spine_tasks
UNION ALL
SELECT id,
    tenant_id,
    entity_type,
    category,
    scope,
    data,
    relationships,
    created_at,
    updated_at
FROM spine_accounts
UNION ALL
SELECT id,
    tenant_id,
    entity_type,
    category,
    scope,
    data,
    relationships,
    created_at,
    updated_at
FROM spine_meetings
UNION ALL
SELECT id,
    tenant_id,
    entity_type,
    category,
    scope,
    data,
    relationships,
    created_at,
    updated_at
FROM spine_projects
UNION ALL
SELECT id,
    tenant_id,
    entity_type,
    category,
    scope,
    data,
    relationships,
    created_at,
    updated_at
FROM spine_objectives
UNION ALL
SELECT id,
    tenant_id,
    entity_type,
    category,
    scope,
    data,
    relationships,
    created_at,
    updated_at
FROM spine_documents
UNION ALL
SELECT id,
    tenant_id,
    entity_type,
    category,
    scope,
    data,
    relationships,
    created_at,
    updated_at
FROM spine_contacts;
-- =============================================================================
-- CONTEXT-AWARE QUERY FUNCTIONS
-- These functions implement Row-Level Security based on context
-- =============================================================================
-- Get entities with context-aware filtering
CREATE OR REPLACE FUNCTION get_spine_entities(
        p_tenant_id UUID,
        p_entity_type VARCHAR(50),
        p_category VARCHAR(30),
        p_user_id UUID DEFAULT NULL,
        p_account_id UUID DEFAULT NULL,
        p_team_id UUID DEFAULT NULL,
        p_filters JSONB DEFAULT '{}'
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_result JSONB;
v_table_name TEXT;
v_query TEXT;
BEGIN -- Map entity type to table
v_table_name := 'spine_' || p_entity_type || 's';
-- Build base query
v_query := format(
    '
        SELECT jsonb_agg(row_to_json(t))
        FROM %I t
        WHERE tenant_id = %L
          AND category = %L
    ',
    v_table_name,
    p_tenant_id,
    p_category
);
-- Add context-based filters
IF p_category = 'personal'
AND p_user_id IS NOT NULL THEN v_query := v_query || format(' AND scope->>''owner_id'' = %L', p_user_id);
ELSIF p_category = 'csm'
AND p_account_id IS NOT NULL THEN v_query := v_query || format(' AND scope->>''account_id'' = %L', p_account_id);
ELSIF p_category = 'team'
AND p_team_id IS NOT NULL THEN v_query := v_query || format(' AND scope->>''team_id'' = %L', p_team_id);
END IF;
-- business category has no additional filter - sees all
-- Add custom filters from p_filters
IF p_filters ? 'status' THEN v_query := v_query || format(
    ' AND data->>''status'' = %L',
    p_filters->>'status'
);
END IF;
IF p_filters ? 'due_before' THEN v_query := v_query || format(
    ' AND (data->>''due_date'')::timestamptz < %L',
    p_filters->>'due_before'
);
END IF;
-- Execute and return
EXECUTE v_query INTO v_result;
RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
-- =============================================================================
-- SAMPLE DATA MIGRATION HELPERS
-- Functions to help migrate existing data to new universal schema
-- =============================================================================
-- Migrate existing accounts to new schema
CREATE OR REPLACE FUNCTION migrate_accounts_to_spine() RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_count INTEGER := 0;
BEGIN
INSERT INTO spine_accounts (
        tenant_id,
        category,
        scope,
        data,
        relationships,
        created_at
    )
SELECT tenant_id,
    'csm'::varchar as category,
    jsonb_build_object(
        'assigned_csm_id',
        csm_owner_id,
        'region',
        region
    ) as scope,
    jsonb_build_object(
        'name',
        name,
        'domain',
        domain,
        'segment',
        segment,
        'industry',
        industry,
        'arr',
        arr,
        'health_score',
        health_score,
        'nps_score',
        nps_score,
        'status',
        status
    ) as data,
    jsonb_build_object(
        'contacts',
        contacts,
        'contracts',
        contracts
    ) as relationships,
    created_at
FROM accounts
WHERE NOT EXISTS (
        SELECT 1
        FROM spine_accounts sa
        WHERE sa.id = accounts.id
    );
GET DIAGNOSTICS v_count = ROW_COUNT;
RETURN v_count;
END;
$$;
COMMENT ON TABLE spine_tasks IS 'Universal tasks: Personal to-dos, CSM account tasks, Business tasks';
COMMENT ON TABLE spine_accounts IS 'Universal accounts: CSM portfolio, Business full view';
COMMENT ON TABLE spine_meetings IS 'Universal meetings: All contexts share same structure';
COMMENT ON TABLE spine_projects IS 'Universal projects: Personal, CSM implementations, Business initiatives';
COMMENT ON TABLE spine_objectives IS 'Universal objectives: Personal goals, CSM success plans, Business OKRs';
COMMENT ON TABLE spine_documents IS 'Universal documents: All contexts share same structure';
COMMENT ON TABLE spine_events IS 'Universal timeline: Activity feed across all contexts';
COMMENT ON FUNCTION get_spine_entities IS 'Context-aware entity fetching with RBAC';