-- ============================================================================
-- D1 MASTER SSOT SCHEMA (Structured Plane / Layer 1)
-- Version: v11.8 (Cognitive Enterprise OS - Universal Product Firm Aligned)
-- Purpose: Unified Single Source of Truth for Enterprise Intelligence 360
-- ============================================================================
-- 1. ACCOUNT MASTER
CREATE TABLE IF NOT EXISTS account_master (
    account_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    industry_vertical TEXT,
    industry_sub_sector TEXT,
    contract_type TEXT,
    contract_start_date DATETIME,
    contract_end_date DATETIME,
    renewal_date DATETIME,
    days_to_renewal INTEGER,
    renewal_risk_level TEXT,
    arr REAL DEFAULT 0,
    acv REAL DEFAULT 0,
    customer_success_manager TEXT,
    account_executive TEXT,
    solutions_architect TEXT,
    executive_sponsor_customer TEXT,
    executive_sponsor_internal TEXT,
    -- Generalized from 'mulesoft'
    health_score INTEGER,
    health_score_trend_3_months TEXT,
    health_score_change REAL,
    sp_rating TEXT,
    customer_annual_revenue REAL,
    employee_count INTEGER,
    geography TEXT,
    country TEXT,
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_role TEXT,
    account_status TEXT,
    last_engagement_date DATETIME,
    next_engagement_due DATETIME,
    engagement_cadence TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT,
    data_source TEXT
);
-- 2. PEOPLE & TEAM
CREATE TABLE IF NOT EXISTS people_team (
    person_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT,
    -- nullable if global person
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT,
    department TEXT,
    region TEXT,
    slack_user_id TEXT,
    active_status TEXT DEFAULT 'active',
    accounts_assigned TEXT,
    -- JSON Array
    account_count INTEGER DEFAULT 0,
    total_arr_managed REAL DEFAULT 0,
    avg_health_score REAL,
    at_risk_account_count INTEGER DEFAULT 0,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 3. BUSINESS CONTEXT
CREATE TABLE IF NOT EXISTS business_context (
    context_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    business_model TEXT,
    market_position TEXT,
    operating_environment TEXT,
    key_business_challenges TEXT,
    strategic_priorities_customer TEXT,
    digital_maturity TEXT,
    it_complexity_score INTEGER,
    legacy_system_count INTEGER,
    cloud_strategy TEXT,
    data_classification TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 4. STRATEGIC OBJECTIVES
CREATE TABLE IF NOT EXISTS strategic_objectives (
    objective_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    strategic_pillar TEXT,
    objective_name TEXT NOT NULL,
    description TEXT,
    business_driver TEXT,
    quantified_goal TEXT,
    target_date DATETIME,
    business_owner TEXT,
    business_value_usd REAL,
    product_relevance TEXT,
    -- Generalized from 'mulesoft'
    status TEXT DEFAULT 'planned',
    progress_percent INTEGER DEFAULT 0,
    health_indicator TEXT,
    last_review_date DATETIME,
    notes TEXT,
    linked_capabilities TEXT,
    -- JSON Array
    linked_value_streams TEXT,
    -- JSON Array
    linked_initiatives TEXT,
    -- JSON Array
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 5. CAPABILITIES
CREATE TABLE IF NOT EXISTS capabilities (
    capability_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    capability_domain TEXT,
    capability_name TEXT NOT NULL,
    description TEXT,
    current_maturity INTEGER,
    current_maturity_numerical INTEGER,
    target_maturity INTEGER,
    target_maturity_numerical INTEGER,
    maturity_gap INTEGER,
    gap_status TEXT,
    linked_strategic_objectives TEXT,
    -- JSON Array
    supporting_value_streams TEXT,
    -- JSON Array
    investment_required_usd REAL,
    priority TEXT,
    implementation_status TEXT,
    business_impact_status TEXT,
    technical_owner_customer TEXT,
    last_assessment_date DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 6. VALUE STREAMS
CREATE TABLE IF NOT EXISTS value_streams (
    stream_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    value_stream_name TEXT NOT NULL,
    business_process TEXT,
    process_owner TEXT,
    linked_strategic_objectives TEXT,
    enabled_product_capabilities TEXT,
    -- Generalized from 'mulesoft'
    integration_endpoints TEXT,
    -- JSON Array
    apis_consumed TEXT,
    -- JSON Array
    annual_transaction_volume INTEGER,
    cycle_time_baseline_hours REAL,
    cycle_time_current_hours REAL,
    cycle_time_target_hours REAL,
    cycle_time_reduction_percent REAL,
    total_business_value_usd REAL,
    customer_satisfaction_score REAL,
    operational_risk_level TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 7. API PORTFOLIO / TECHNICAL ASSETS
CREATE TABLE IF NOT EXISTS technical_portfolio (
    asset_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    asset_type TEXT,
    -- API, Service, Module, Component
    asset_version TEXT,
    business_capability TEXT,
    linked_value_streams TEXT,
    -- JSON Array
    linked_strategic_objectives TEXT,
    -- JSON Array
    environment TEXT,
    -- Sandbox, Production, etc.
    monthly_transactions_volume INTEGER,
    avg_performance_metric REAL,
    -- response_time, latency, etc.
    sla_target REAL,
    sla_compliance_percent REAL,
    error_rate_percent REAL,
    uptime_percent REAL,
    consuming_applications TEXT,
    -- JSON Array
    business_criticality TEXT,
    health_status TEXT,
    owner_team TEXT,
    last_sync_date DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 8. ACCOUNT METRICS
CREATE TABLE IF NOT EXISTS account_metrics (
    metric_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    metric_category TEXT,
    metric_name TEXT NOT NULL,
    metric_type TEXT,
    -- KPI, Technical, Financial
    current_value REAL,
    target_value REAL,
    threshold_warning REAL,
    threshold_critical REAL,
    unit TEXT,
    measurement_frequency TEXT,
    health_status TEXT,
    health_status_numerical INTEGER,
    trend_is_good BOOLEAN,
    last_measured DATETIME,
    linked_capability TEXT,
    data_source TEXT,
    business_impact_status TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 9. INITIATIVES (Success & Implementation)
CREATE TABLE IF NOT EXISTS initiatives (
    initiative_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    initiative_name TEXT NOT NULL,
    initiative_type TEXT,
    linked_strategic_objectives TEXT,
    -- JSON Array
    linked_capabilities TEXT,
    -- JSON Array
    business_driver TEXT,
    proposed_by TEXT,
    priority TEXT,
    phase TEXT,
    status TEXT,
    start_date DATETIME,
    target_completion_date DATETIME,
    actual_completion_date DATETIME,
    days_overdue INTEGER,
    investment_amount_usd REAL,
    implementation_services_usd REAL,
    -- Generalized
    expected_annual_benefit REAL,
    expected_payback_months INTEGER,
    realized_annual_benefit REAL,
    success_criteria TEXT,
    owner_internal TEXT,
    -- Generalized
    owner_customer TEXT,
    blockers TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 10. RISK REGISTER & TECHNICAL DEBT
CREATE TABLE IF NOT EXISTS risk_register (
    risk_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    risk_category TEXT,
    risk_title TEXT NOT NULL,
    description TEXT,
    affected_capability TEXT,
    affected_assets TEXT,
    -- Generalized from APIs
    linked_strategic_objectives TEXT,
    -- JSON Array
    impact TEXT,
    impact_score INTEGER,
    -- 1-5
    probability TEXT,
    probability_score INTEGER,
    -- 1-5
    risk_score INTEGER,
    risk_level TEXT,
    mitigation_strategy TEXT,
    mitigation_initiative TEXT,
    mitigation_owner TEXT,
    target_resolution_date DATETIME,
    status TEXT DEFAULT 'identified',
    date_identified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 11. PLATFORM HEALTH METRICS (Generalized for any Product Stack)
CREATE TABLE IF NOT EXISTS platform_health (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    platform_name TEXT,
    metric_name TEXT,
    metric_value REAL,
    metric_unit TEXT,
    status TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 12. STAKEHOLDER OUTCOMES
CREATE TABLE IF NOT EXISTS stakeholder_outcomes (
    outcome_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    stakeholder_type TEXT,
    stakeholder_name TEXT NOT NULL,
    outcome_statement TEXT,
    linked_strategic_objectives TEXT,
    linked_value_stream TEXT,
    success_metric_name TEXT,
    baseline_value REAL,
    current_value REAL,
    target_value REAL,
    unit TEXT,
    target_achievement_date DATETIME,
    measurement_method TEXT,
    status TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 13. ENGAGEMENT LOG
CREATE TABLE IF NOT EXISTS engagement_log (
    engagement_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    engagement_date DATETIME NOT NULL,
    engagement_type TEXT,
    -- QBR, Sync, Workshop, etc.
    attendees_internal TEXT,
    -- JSON Array, Generalized
    attendees_customer TEXT,
    -- JSON Array
    customer_seniority TEXT,
    topics_discussed TEXT,
    action_items TEXT,
    sentiment TEXT,
    relationship_depth_score INTEGER,
    next_steps TEXT,
    next_engagement_date DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 14. SUCCESS PLAN TRACKER
CREATE TABLE IF NOT EXISTS success_plans (
    success_plan_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    executive_summary TEXT,
    plan_period TEXT,
    plan_status TEXT,
    creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    strategic_objectives_summary TEXT,
    key_initiatives_summary TEXT,
    top_3_risks TEXT,
    executive_sponsor_customer TEXT,
    executive_sponsor_internal TEXT,
    -- Generalized
    next_qbr_date DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 15. TASK MANAGER
CREATE TABLE IF NOT EXISTS tasks (
    task_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    owner TEXT,
    due_date DATETIME,
    status TEXT,
    priority TEXT,
    linked_risk_id TEXT,
    linked_initiative_id TEXT,
    source_system TEXT,
    external_task_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 16. INSIGHTS (The Intelligence Layer)
CREATE TABLE IF NOT EXISTS generated_insights (
    insight_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    csm_id TEXT,
    insight_text TEXT NOT NULL,
    recommended_action TEXT,
    status TEXT DEFAULT 'new',
    date_generated DATETIME DEFAULT CURRENT_TIMESTAMP,
    linked_metric_id TEXT,
    linked_risk_id TEXT,
    linked_initiative_id TEXT,
    linked_objective_id TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- INDEXES
CREATE INDEX idx_universal_account_tenant ON account_master(tenant_id, account_id);
CREATE INDEX idx_universal_people_account ON people_team(account_id);
CREATE INDEX idx_universal_objectives_status ON strategic_objectives(status);
CREATE INDEX idx_universal_engagement_date ON engagement_log(engagement_date);
CREATE INDEX idx_universal_insights_date ON generated_insights(date_generated);