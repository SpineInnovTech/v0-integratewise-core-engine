-- Migration: 032_spine_department_streams.sql
-- Description: Spine schema extensions for department/stream coverage
-- Created: 2026-02-08
-- =============================================================================

-- =============================================================================
-- 1. STREAM REGISTRY (Departments / Streams)
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    stream_key VARCHAR(50) NOT NULL, -- 'sales', 'csm', 'tam', 'marketing', 'finance', 'ops'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30) DEFAULT 'business' CHECK (
        category IN ('business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id, visibility: 'private'|'team'|'org' }
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, stream_key)
);

CREATE TABLE IF NOT EXISTS spine_stream_entities (
    stream_id UUID REFERENCES spine_streams(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (stream_id, entity_type, entity_id)
);

-- =============================================================================
-- 2. SALES: Opportunities & Pipeline
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'opportunity',
    category VARCHAR(30) NOT NULL DEFAULT 'sales' CHECK (
        category IN ('sales', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { name, stage, amount, currency, probability, expected_close, source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_opps_account ON spine_opportunities((scope->>'account_id'));
CREATE INDEX idx_spine_opps_stage ON spine_opportunities(((data->>'stage')));
CREATE INDEX idx_spine_opps_close ON spine_opportunities(((data->>'expected_close')::timestamptz));

-- =============================================================================
-- 3. CSM: Renewals & Risks
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'renewal',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { contract_start, contract_end, value, currency, status, renewal_type }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_renewals_account ON spine_renewals((scope->>'account_id'));
CREATE INDEX idx_spine_renewals_end ON spine_renewals(((data->>'contract_end')::timestamptz));

CREATE TABLE IF NOT EXISTS spine_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'risk',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, severity, likelihood, impact, status, detected_at }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_risks_account ON spine_risks((scope->>'account_id'));
CREATE INDEX idx_spine_risks_severity ON spine_risks(((data->>'severity')));

-- =============================================================================
-- 4. TAM/Ops: Incidents & Changes
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'incident',
    category VARCHAR(30) NOT NULL DEFAULT 'tam' CHECK (
        category IN ('tam', 'ops', 'business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, severity, status, started_at, resolved_at, root_cause }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_incidents_account ON spine_incidents((scope->>'account_id'));
CREATE INDEX idx_spine_incidents_status ON spine_incidents(((data->>'status')));

CREATE TABLE IF NOT EXISTS spine_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'change',
    category VARCHAR(30) NOT NULL DEFAULT 'tam' CHECK (
        category IN ('tam', 'ops', 'business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, change_type, status, planned_at, completed_at, risk_level }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_changes_account ON spine_changes((scope->>'account_id'));
CREATE INDEX idx_spine_changes_status ON spine_changes(((data->>'status')));

-- =============================================================================
-- 5. Marketing: Campaigns & Content
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'campaign',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id, channel }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { name, type, status, start_date, end_date, budget, target }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_campaigns_status ON spine_campaigns(((data->>'status')));

CREATE TABLE IF NOT EXISTS spine_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'content',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id, campaign_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, content_type, status, published_at, channel }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_content_status ON spine_content(((data->>'status')));

-- =============================================================================
-- 6. Finance: Invoices, Expenses, Approvals, Contracts
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'invoice',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { invoice_number, amount, currency, status, issued_at, due_at }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_invoices_account ON spine_invoices((scope->>'account_id'));
CREATE INDEX idx_spine_invoices_status ON spine_invoices(((data->>'status')));

CREATE TABLE IF NOT EXISTS spine_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'expense',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id, vendor_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { amount, currency, category, status, incurred_at, reimbursable }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_expenses_status ON spine_expenses(((data->>'status')));

CREATE TABLE IF NOT EXISTS spine_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'approval',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'ops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { approval_type, status, requested_by, requested_at, approved_by, approved_at }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_approvals_status ON spine_approvals(((data->>'status')));

CREATE TABLE IF NOT EXISTS spine_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'contract',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'sales', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, status, start_at, end_at, value, currency }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_contracts_account ON spine_contracts((scope->>'account_id'));
CREATE INDEX idx_spine_contracts_status ON spine_contracts(((data->>'status')));

-- =============================================================================
-- 7. Operations: Vendors & Requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'vendor',
    category VARCHAR(30) NOT NULL DEFAULT 'ops' CHECK (
        category IN ('ops', 'finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { name, status, risk_level, contract_id, primary_contact }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_vendors_status ON spine_vendors(((data->>'status')));

CREATE TABLE IF NOT EXISTS spine_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'request',
    category VARCHAR(30) NOT NULL DEFAULT 'ops' CHECK (
        category IN ('ops', 'team', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, request_type, status, priority, requested_at, due_at }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_requests_status ON spine_requests(((data->>'status')));

-- =============================================================================
-- 8. Extend Universal Entity View
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
FROM spine_contacts
UNION ALL
SELECT id,
    tenant_id,
    entity_type,
    category,
    scope,
    data,
    relationships,
    created_at,
    created_at AS updated_at
FROM spine_events
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
FROM spine_opportunities
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
FROM spine_renewals
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
FROM spine_risks
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
FROM spine_incidents
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
FROM spine_changes
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
FROM spine_campaigns
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
FROM spine_content
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
FROM spine_invoices
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
FROM spine_expenses
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
FROM spine_approvals
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
FROM spine_contracts
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
FROM spine_vendors
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
FROM spine_requests;

-- =============================================================================
-- END
-- =============================================================================
