-- ============================================
-- BUCKETS: Progressive Activation System
-- Base Buckets (B0-B7) + Department Meta-Buckets
-- ============================================

-- ============================================
-- 1. Base Buckets (Capability/Data Readiness)
-- ============================================

CREATE TABLE base_buckets (
    bucket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Bucket type (B0-B7)
    bucket_type VARCHAR(10) NOT NULL CHECK (bucket_type IN ('B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7')),
    UNIQUE(tenant_id, bucket_type),
    
    -- State machine
    state VARCHAR(20) DEFAULT 'OFF' CHECK (state IN (
        'OFF',           -- Not activated
        'ADDING',        -- User is onboarding it
        'SEEDED',        -- Minimum entities exist
        'LIVE',          -- Continuous sync active
        'ERROR',         -- Connector/sync error
        'PAUSED'         -- User paused sync
    )),
    
    -- How it was seeded
    seed_method VARCHAR(20) CHECK (seed_method IN ('manual', 'upload', 'connector', 'migration', NULL)),
    
    -- Connected source (if connector method)
    connected_source VARCHAR(100),  -- 'salesforce', 'google_calendar', 'notion', etc.
    connector_status VARCHAR(20),    -- 'connected', 'disconnected', 'error', 'auth_needed'
    connector_config JSONB,          -- { api_key, workspace_id, etc. }
    
    -- Sync tracking
    last_sync_at TIMESTAMP,
    next_sync_at TIMESTAMP,
    sync_frequency VARCHAR(20) DEFAULT '1h',  -- '1h', '6h', '24h', 'manual'
    
    -- Error handling
    error_code VARCHAR(100),
    error_message TEXT,
    error_retry_count INTEGER DEFAULT 0,
    
    -- Progress tracking (counts)
    entity_count INTEGER DEFAULT 0,
    last_entity_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP
);

-- ============================================
-- 2. Base Bucket Configuration (Registry)
-- ============================================

CREATE TABLE bucket_config (
    bucket_type VARCHAR(10) PRIMARY KEY,
    
    -- Display
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),  -- emoji or icon name
    order_index INTEGER,
    
    -- Requirements
    min_entities JSONB DEFAULT '{}',  -- { "task": 5, "document": 3 }
    
    -- Available seed methods
    seed_methods TEXT[] DEFAULT ARRAY['manual', 'upload', 'connector'],
    
    -- Recommended connectors
    available_connectors TEXT[],
    required_for_live BOOLEAN DEFAULT false,
    
    -- Metadata
    is_required BOOLEAN DEFAULT false,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. Department Buckets (Meta-Buckets)
-- ============================================

CREATE TABLE department_buckets (
    department_bucket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Department identifier
    department_key VARCHAR(50) NOT NULL,  -- 'sales', 'csm', 'marketing', 'tam', 'ops', 'finance'
    UNIQUE(tenant_id, department_key),
    
    -- State
    state VARCHAR(20) DEFAULT 'OFF' CHECK (state IN ('OFF', 'ADDING', 'SEEDED', 'LIVE', 'ERROR', 'PAUSED')),
    
    -- Dependencies on base buckets
    required_base_buckets TEXT[] NOT NULL,  -- ['B1', 'B5']
    optional_base_buckets TEXT[] DEFAULT ARRAY[],  -- ['B2', 'B4']
    
    -- What L1 modules this unlocks
    unlocked_modules TEXT[] NOT NULL,  -- ['accounts', 'contacts', 'deals', 'pipeline']
    unlocked_routes TEXT[] NOT NULL,   -- ['/sales/accounts', '/sales/pipeline', ...]
    
    -- Recommended connectors (for this department)
    recommended_connectors TEXT[] DEFAULT ARRAY[],
    
    -- RBAC template for this department
    rbac_template JSONB DEFAULT '{}',  -- { roles: [{ role: 'sales_rep', permissions: [] }] }
    
    -- Progress tracking
    requirements_total INTEGER GENERATED ALWAYS AS (
      array_length(required_base_buckets, 1)
    ) STORED,
    
    error_code VARCHAR(100),
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP
);

-- ============================================
-- 4. Department Bucket Configuration (Registry)
-- ============================================

CREATE TABLE department_config (
    department_key VARCHAR(50) PRIMARY KEY,
    
    -- Display
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    order_index INTEGER,
    
    -- Requirements (base buckets)
    required_base_buckets TEXT[] NOT NULL,
    optional_base_buckets TEXT[] DEFAULT ARRAY[],
    
    -- L1 unlock rules
    unlocked_modules TEXT[] NOT NULL,
    unlocked_routes TEXT[] NOT NULL,
    
    -- Recommended connectors
    recommended_connectors TEXT[] DEFAULT ARRAY[],
    
    -- RBAC template
    default_rbac_template JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. Bucket Progress View
-- ============================================

CREATE OR REPLACE VIEW v_bucket_progress AS
SELECT 
    bb.bucket_id,
    bb.tenant_id,
    bb.bucket_type,
    bc.display_name,
    bc.icon,
    bb.state,
    bb.seed_method,
    bb.connected_source,
    bb.connector_status,
    bb.entity_count,
    bb.last_sync_at,
    
    -- Progress calculation
    CASE 
        WHEN bb.state = 'LIVE' THEN 100
        WHEN bb.state = 'SEEDED' THEN 75
        WHEN bb.state = 'ADDING' THEN 50
        WHEN bb.state = 'OFF' THEN 0
        ELSE 0
    END as progress_percent,
    
    -- Status indicator
    CASE 
        WHEN bb.state = 'ERROR' THEN 'error'
        WHEN bb.state = 'PAUSED' THEN 'warning'
        WHEN bb.state = 'LIVE' THEN 'success'
        WHEN bb.state = 'SEEDED' THEN 'info'
        WHEN bb.state = 'ADDING' THEN 'loading'
        ELSE 'default'
    END as status_type
    
FROM base_buckets bb
LEFT JOIN bucket_config bc ON bb.bucket_type = bc.bucket_type;

CREATE OR REPLACE VIEW v_department_progress AS
SELECT 
    db.department_bucket_id,
    db.tenant_id,
    db.department_key,
    dc.display_name,
    dc.icon,
    db.state,
    db.required_base_buckets,
    db.unlocked_modules,
    db.unlocked_routes,
    
    -- Count of met requirements
    (SELECT COUNT(*) FROM base_buckets bb 
     WHERE bb.tenant_id = db.tenant_id 
     AND bb.bucket_type = ANY(db.required_base_buckets)
     AND bb.state IN ('SEEDED', 'LIVE')
    ) as met_requirements_count,
    
    -- Total required
    array_length(db.required_base_buckets, 1) as total_requirements,
    
    -- Progress %
    CASE 
        WHEN db.state = 'LIVE' THEN 100
        WHEN db.state = 'SEEDED' THEN 75
        WHEN db.state = 'ADDING' THEN ROUND(
            (SELECT COUNT(*) FROM base_buckets bb 
             WHERE bb.tenant_id = db.tenant_id 
             AND bb.bucket_type = ANY(db.required_base_buckets)
             AND bb.state IN ('SEEDED', 'LIVE')
            )::numeric / array_length(db.required_base_buckets, 1) * 100
        )
        ELSE 0
    END as progress_percent
    
FROM department_buckets db
LEFT JOIN department_config dc ON db.department_key = dc.department_key;

-- ============================================
-- 6. Indexes
-- ============================================

CREATE INDEX idx_base_buckets_tenant_state ON base_buckets(tenant_id, state);
CREATE INDEX idx_base_buckets_tenant_type ON base_buckets(tenant_id, bucket_type);
CREATE INDEX idx_department_buckets_tenant ON department_buckets(tenant_id);
CREATE INDEX idx_department_buckets_key ON department_buckets(tenant_id, department_key);
CREATE INDEX idx_base_buckets_sync ON base_buckets(tenant_id, last_sync_at DESC) WHERE state IN ('LIVE', 'SEEDED');

-- ============================================
-- 7. Initial Data: Base Bucket Config
-- ============================================

INSERT INTO bucket_config (bucket_type, display_name, description, icon, order_index, seed_methods, available_connectors, is_required) VALUES
('B0', 'Identity & Workspace', 'Organization, RBAC, workspace setup', '👤', 0, ARRAY['manual'], ARRAY[]::text[], true),
('B1', 'Tasks & Projects', 'Tasks, projects, milestones', '✓', 1, ARRAY['manual', 'upload', 'connector'], ARRAY['asana', 'monday', 'notion', 'jira']::text[], false),
('B2', 'Calendar & Meetings', 'Calendars, meetings, events', '📅', 2, ARRAY['upload', 'connector'], ARRAY['google_calendar', 'outlook', 'zoom']::text[], false),
('B3', 'Docs & Knowledge', 'Documents, wiki, knowledge base', '📄', 3, ARRAY['upload', 'connector'], ARRAY['google_drive', 'notion', 'confluence', 'github']::text[], false),
('B4', 'Communications', 'Email, Slack, messages', '💬', 4, ARRAY['upload', 'connector'], ARRAY['gmail', 'slack', 'microsoft_teams']::text[], false),
('B5', 'CRM / Accounts', 'Accounts, contacts, opportunities', '👥', 5, ARRAY['manual', 'upload', 'connector'], ARRAY['salesforce', 'hubspot', 'pipedrive', 'intercom']::text[], false),
('B6', 'Integrations & Automations', 'Webhooks, workflows, automations', '🔗', 6, ARRAY['connector'], ARRAY['zapier', 'n8n', 'make', 'github']::text[], false),
('B7', 'Governance & Compliance', 'Policies, approvals, audit, RBAC', '🔐', 7, ARRAY['manual'], ARRAY[]::text[], false);

-- ============================================
-- 8. Initial Data: Department Config
-- ============================================

INSERT INTO department_config (department_key, display_name, description, icon, order_index, required_base_buckets, optional_base_buckets, unlocked_modules, unlocked_routes, recommended_connectors) VALUES
('sales', 'Sales', 'Pipeline, accounts, opportunities', '📈', 0, 
  ARRAY['B1', 'B5']::text[], 
  ARRAY['B2', 'B4']::text[],
  ARRAY['accounts', 'contacts', 'opportunities', 'pipeline', 'activities', 'tasks']::text[],
  ARRAY['/sales', '/sales/accounts', '/sales/pipeline', '/sales/opportunities']::text[],
  ARRAY['salesforce', 'hubspot', 'gmail', 'google_calendar']::text[]
),
('csm', 'Customer Success', 'Account health, renewals, risks', '❤️', 1,
  ARRAY['B1', 'B5', 'B2']::text[],
  ARRAY['B4', 'B3']::text[],
  ARRAY['accounts', 'contacts', 'renewals', 'health', 'risks', 'initiatives', 'team']::text[],
  ARRAY['/csm', '/csm/accounts', '/csm/renewals', '/csm/risks']::text[],
  ARRAY['salesforce', 'hubspot', 'google_calendar', 'slack']::text[]
),
('marketing', 'Marketing', 'Campaigns, content, projects', '📢', 2,
  ARRAY['B1', 'B3']::text[],
  ARRAY['B2', 'B4']::text[],
  ARRAY['campaigns', 'content', 'calendar', 'tasks', 'projects']::text[],
  ARRAY['/marketing', '/marketing/campaigns', '/marketing/content']::text[],
  ARRAY['google_drive', 'notion', 'slack']::text[]
),
('tam', 'Technical Account', 'Integration status, incidents, docs', '⚙️', 3,
  ARRAY['B1', 'B3', 'B6']::text[],
  ARRAY['B5', 'B4']::text[],
  ARRAY['integration_status', 'incidents', 'changes', 'docs', 'tasks']::text[],
  ARRAY['/tam', '/tam/integrations', '/tam/incidents']::text[],
  ARRAY['slack', 'github', 'jira', 'google_drive']::text[]
),
('ops', 'Operations', 'Processes, vendors, requests', '⚡', 4,
  ARRAY['B1', 'B3', 'B6']::text[],
  ARRAY['B4', 'B7']::text[],
  ARRAY['processes', 'vendors', 'requests', 'projects', 'tasks']::text[],
  ARRAY['/ops', '/ops/processes', '/ops/vendors']::text[],
  ARRAY['notion', 'asana', 'slack']::text[]
),
('finance', 'Finance', 'Invoices, bills, approvals', '💰', 5,
  ARRAY['B1', 'B7']::text[],
  ARRAY[]::text[],
  ARRAY['invoices', 'bills', 'expenses', 'approvals', 'contracts']::text[],
  ARRAY['/finance', '/finance/invoices', '/finance/approvals']::text[],
  ARRAY['stripe', 'quickbooks']::text[]
);

-- ============================================
-- END
-- ============================================
