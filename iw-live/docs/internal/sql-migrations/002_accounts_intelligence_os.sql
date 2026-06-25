-- ============================================================================
-- ACCOUNTS INTELLIGENCE OS - CORE SCHEMA
-- Version: 1.0.0
-- Purpose: Department-agnostic schema for Sales/CS/Marketing/Product/Finance/Ops
-- ============================================================================
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ============================================================================
-- 1. CORE ACCOUNT & PEOPLE SCHEMAS
-- ============================================================================
-- 1.1 People_Team (must come first for FK references)
CREATE TABLE IF NOT EXISTS people_team (
    person_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT,
    department TEXT,
    -- Sales / CS / Product / Marketing / Finance / Ops / Customer
    region TEXT,
    slack_user_id TEXT,
    active_status BOOLEAN DEFAULT true,
    persona_type TEXT DEFAULT 'Internal',
    -- Internal / External / Partner
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_people_email ON people_team(email);
CREATE INDEX idx_people_department ON people_team(department);
-- 1.2 Account_Master
CREATE TABLE IF NOT EXISTS account_master (
    account_id TEXT PRIMARY KEY,
    account_name TEXT NOT NULL,
    parent_account_id TEXT REFERENCES account_master(account_id),
    csm_narrative TEXT,
    -- Rich text: latest human view of "what's going on"
    industry_vertical TEXT,
    industry_sub_sector TEXT,
    company_size_band TEXT,
    -- SMB / Mid-Market / Enterprise
    region TEXT,
    contract_type TEXT,
    -- Subscription / Enterprise / Pilot / POC
    contract_start_date DATE,
    contract_end_date DATE,
    commercial_owner_id TEXT REFERENCES people_team(person_id),
    csm_owner_id TEXT REFERENCES people_team(person_id),
    primary_slack_channel TEXT,
    status TEXT DEFAULT 'Active',
    -- Active / Churned / Prospect / Trial
    arr_current NUMERIC(15, 2),
    mrr_current NUMERIC(15, 2),
    health_score INTEGER CHECK (
        health_score >= 0
        AND health_score <= 100
    ),
    health_band TEXT,
    -- Champion / Steady / At_Risk
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_account_status ON account_master(status);
CREATE INDEX idx_account_health ON account_master(health_band);
CREATE INDEX idx_account_industry ON account_master(industry_vertical);
-- 1.3 Account_People_Roles
CREATE TABLE IF NOT EXISTS account_people_roles (
    account_person_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    person_id TEXT NOT NULL REFERENCES people_team(person_id),
    account_role TEXT,
    -- Decision Maker / Champion / Influencer / User / Executive Sponsor
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, person_id, account_role)
);
CREATE INDEX idx_apr_account ON account_people_roles(account_id);
CREATE INDEX idx_apr_person ON account_people_roles(person_id);
-- ============================================================================
-- 2. CONTEXT & STRATEGY SCHEMAS
-- ============================================================================
-- 2.1 Business_Context
CREATE TABLE IF NOT EXISTS business_context (
    context_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    business_model TEXT,
    -- B2B SaaS / Marketplace / etc.
    key_markets TEXT,
    -- Can be JSON array or comma-separated
    revenue_profile TEXT,
    -- recurring / transactional / hybrid
    current_stage TEXT,
    -- Seed / Series A / Public / etc.
    context_summary TEXT,
    change_drivers TEXT,
    -- M&A, org changes, macro factors
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bc_account ON business_context(account_id);
-- 2.2 Strategic_Objectives
CREATE TABLE IF NOT EXISTS strategic_objectives (
    objective_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    objective_name TEXT NOT NULL,
    objective_type TEXT,
    -- Revenue / Efficiency / Risk / Expansion / Product / CX
    owner_person_id TEXT REFERENCES people_team(person_id),
    time_horizon TEXT,
    -- Quarter / Year / Multi-year
    target_metric TEXT,
    target_value TEXT,
    current_value TEXT,
    status TEXT DEFAULT 'Not Started',
    -- Not Started / In Progress / Achieved / At Risk
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_so_account ON strategic_objectives(account_id);
CREATE INDEX idx_so_status ON strategic_objectives(status);
-- ============================================================================
-- 3. TECH & PLATFORM VIEW
-- ============================================================================
-- 3.1 Platform_Health_Metrics
CREATE TABLE IF NOT EXISTS platform_health_metrics (
    metric_row_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    metric_name TEXT NOT NULL,
    -- Error Rate / Uptime / Latency / Ticket Volume
    metric_category TEXT,
    -- Reliability / Performance / Usage / Cost
    metric_value NUMERIC,
    metric_unit TEXT,
    -- % / ms / count / $
    metric_date TIMESTAMPTZ NOT NULL,
    source_system TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_phm_account ON platform_health_metrics(account_id);
CREATE INDEX idx_phm_date ON platform_health_metrics(metric_date);
CREATE INDEX idx_phm_name ON platform_health_metrics(metric_name);
-- 3.2 Value_Streams
CREATE TABLE IF NOT EXISTS value_streams (
    value_stream_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    name TEXT NOT NULL,
    description TEXT,
    business_owner_id TEXT REFERENCES people_team(person_id),
    technical_owner_id TEXT REFERENCES people_team(person_id),
    priority TEXT DEFAULT 'Medium',
    -- High / Medium / Low
    status TEXT DEFAULT 'Not Started',
    -- Not Started / In Progress / Live / Deprecated
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vs_account ON value_streams(account_id);
-- 3.3 API_Portfolio
CREATE TABLE IF NOT EXISTS api_portfolio (
    api_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    api_name TEXT NOT NULL,
    api_domain TEXT,
    -- Payments / Identity / Orders
    lifecycle_status TEXT DEFAULT 'Proposed',
    -- Proposed / In Design / In Dev / Live / Sunset
    consumers TEXT,
    -- JSON array or comma-separated
    owner_team TEXT,
    criticality TEXT,
    -- P0 / P1 / P2
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_api_account ON api_portfolio(account_id);
-- ============================================================================
-- 4. DELIVERY & RISK SCHEMAS
-- ============================================================================
-- 4.1 Initiatives
CREATE TABLE IF NOT EXISTS initiatives (
    initiative_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    name TEXT NOT NULL,
    type TEXT,
    -- Project / Play / Success Plan / Experiment
    owner_person_id TEXT REFERENCES people_team(person_id),
    start_date DATE,
    target_end_date DATE,
    status TEXT DEFAULT 'Not Started',
    -- Not Started / In Progress / Blocked / Done
    linked_strategic_objective_id TEXT REFERENCES strategic_objectives(objective_id),
    risk_level TEXT DEFAULT 'Low',
    -- Low / Medium / High
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_init_account ON initiatives(account_id);
CREATE INDEX idx_init_status ON initiatives(status);
-- 4.2 Technical_Debt_and_Risk_Register
CREATE TABLE IF NOT EXISTS risk_register (
    risk_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    title TEXT NOT NULL,
    category TEXT,
    -- Technical_Debt / Process / Organizational / Contractual / Security
    severity TEXT DEFAULT 'Medium',
    -- Low / Medium / High / Critical
    likelihood TEXT DEFAULT 'Medium',
    -- Low / Medium / High
    impact TEXT,
    mitigation_plan TEXT,
    owner_person_id TEXT REFERENCES people_team(person_id),
    status TEXT DEFAULT 'Open',
    -- Open / Monitoring / Mitigated / Closed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_risk_account ON risk_register(account_id);
CREATE INDEX idx_risk_severity ON risk_register(severity);
-- ============================================================================
-- 5. ENGAGEMENT & OUTCOMES
-- ============================================================================
-- 5.1 Engagement_Log
CREATE TABLE IF NOT EXISTS engagement_log (
    engagement_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    date TIMESTAMPTZ NOT NULL,
    type TEXT,
    -- Meeting / Email / Support / QBR / Slack / Workshop / NPS / Incident
    channel TEXT,
    -- Zoom / Slack / Email / Jira
    participants TEXT,
    -- JSON array of person_ids
    summary TEXT,
    action_items TEXT,
    owner_person_id TEXT REFERENCES people_team(person_id),
    source_system TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_eng_account ON engagement_log(account_id);
CREATE INDEX idx_eng_date ON engagement_log(date);
CREATE INDEX idx_eng_type ON engagement_log(type);
-- 5.2 Stakeholder_Outcomes
CREATE TABLE IF NOT EXISTS stakeholder_outcomes (
    outcome_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    stakeholder_person_id TEXT REFERENCES people_team(person_id),
    outcome_statement TEXT,
    -- "What success looks like for them"
    metric TEXT,
    target_value TEXT,
    current_status TEXT DEFAULT 'Not Started',
    -- Not Started / Progressing / Achieved / At Risk
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);
CREATE INDEX idx_so_account ON stakeholder_outcomes(account_id);
-- 5.3 Success_Plan_Tracker
CREATE TABLE IF NOT EXISTS success_plan_tracker (
    plan_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    name TEXT NOT NULL,
    plan_template TEXT,
    owner_person_id TEXT REFERENCES people_team(person_id),
    start_date DATE,
    target_end_date DATE,
    status TEXT DEFAULT 'Draft',
    -- Draft / Active / On Hold / Completed
    health_impact TEXT,
    -- Positive / Neutral / Negative / Unknown
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spt_account ON success_plan_tracker(account_id);
-- 5.4 Task_Manager (account-scoped)
CREATE TABLE IF NOT EXISTS task_manager (
    task_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    title TEXT NOT NULL,
    description TEXT,
    owner_person_id TEXT REFERENCES people_team(person_id),
    due_date DATE,
    status TEXT DEFAULT 'Not Started',
    -- Not Started / In Progress / Blocked / Done
    priority TEXT DEFAULT 'Medium',
    -- High / Medium / Low
    source TEXT,
    -- Situation / Plan / Engagement / Manual
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_task_account ON task_manager(account_id);
CREATE INDEX idx_task_status ON task_manager(status);
CREATE INDEX idx_task_due ON task_manager(due_date);
-- 5.5 Generated_Insights
CREATE TABLE IF NOT EXISTS generated_insights (
    insight_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id TEXT NOT NULL REFERENCES account_master(account_id),
    workspace TEXT,
    -- Sales / CS / Product / Ops / Finance
    title TEXT NOT NULL,
    insight_type TEXT,
    -- Risk / Opportunity / Anomaly / Trend
    context_summary TEXT,
    why_it_matters TEXT,
    recommended_action TEXT,
    confidence INTEGER CHECK (
        confidence >= 0
        AND confidence <= 100
    ),
    source TEXT,
    -- which engine/pipeline produced it
    status TEXT DEFAULT 'New',
    -- New / Reviewed / Actioned / Dismissed
    linked_situation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_gi_account ON generated_insights(account_id);
CREATE INDEX idx_gi_workspace ON generated_insights(workspace);
CREATE INDEX idx_gi_status ON generated_insights(status);
-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_account_master_updated_at BEFORE
UPDATE ON account_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_people_team_updated_at BEFORE
UPDATE ON people_team FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_account_people_roles_updated_at BEFORE
UPDATE ON account_people_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_context_updated_at BEFORE
UPDATE ON business_context FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_objectives_updated_at BEFORE
UPDATE ON strategic_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_value_streams_updated_at BEFORE
UPDATE ON value_streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_portfolio_updated_at BEFORE
UPDATE ON api_portfolio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_initiatives_updated_at BEFORE
UPDATE ON initiatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_register_updated_at BEFORE
UPDATE ON risk_register FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_success_plan_tracker_updated_at BEFORE
UPDATE ON success_plan_tracker FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_manager_updated_at BEFORE
UPDATE ON task_manager FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();