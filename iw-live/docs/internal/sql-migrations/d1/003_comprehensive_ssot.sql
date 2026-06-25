-- ============================================================================
-- D1 SSOT COMPREHENSIVE SCHEMA (Structured Plane / Layer 1)
-- Version: v11.5
-- Purpose: Unified Single Source of Truth with Product & Stream Context
-- ============================================================================
-- 1. ACCOUNT MASTER (The Core Entity)
CREATE TABLE IF NOT EXISTS account_master (
    account_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    csm_narrative TEXT,
    industry_vertical TEXT,
    industry_sub_sector TEXT,
    contract_type TEXT,
    contract_start_date DATETIME,
    contract_end_date DATETIME,
    renewal_date DATETIME,
    days_to_renewal INTEGER,
    renewal_risk_level TEXT,
    -- low, medium, high, critical
    arr REAL DEFAULT 0,
    acv REAL DEFAULT 0,
    customer_success_manager TEXT,
    account_executive TEXT,
    solutions_architect TEXT,
    executive_sponsor_customer TEXT,
    executive_sponsor_mulesoft TEXT,
    health_score INTEGER,
    health_score_trend TEXT,
    -- up, down, stable
    health_score_change REAL,
    sp_rating TEXT,
    annual_revenue REAL,
    employee_count INTEGER,
    geography TEXT,
    country TEXT,
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_role TEXT,
    account_status TEXT DEFAULT 'active',
    last_engagement_date DATETIME,
    next_engagement_due DATETIME,
    engagement_cadence TEXT,
    data_source TEXT,
    product_id TEXT,
    -- Product Context
    stream_id TEXT,
    -- Stream Context
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 2. PEOPLE & TEAM (The Human Layer)
CREATE TABLE IF NOT EXISTS people_team (
    person_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT,
    department TEXT,
    region TEXT,
    slack_user_id TEXT,
    active_status TEXT DEFAULT 'active',
    accounts_assigned TEXT,
    -- JSON Array
    total_arr_managed REAL DEFAULT 0,
    avg_health_score REAL,
    at_risk_account_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 3. BUSINESS CONTEXT (Deep Situation Awareness)
CREATE TABLE IF NOT EXISTS business_context (
    context_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    business_model TEXT,
    market_position TEXT,
    operating_environment TEXT,
    key_business_challenges TEXT,
    strategic_priorities TEXT,
    digital_maturity TEXT,
    it_complexity_score INTEGER,
    legacy_system_count INTEGER,
    cloud_strategy TEXT,
    data_classification TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 4. STRATEGIC OBJECTIVES (The North Star)
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
    relevance_score REAL,
    status TEXT DEFAULT 'planned',
    progress_percent INTEGER DEFAULT 0,
    health_indicator TEXT,
    last_review_date DATETIME,
    linked_capabilities TEXT,
    -- JSON Array
    linked_value_streams TEXT,
    -- JSON Array
    linked_initiatives TEXT,
    -- JSON Array
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 5. CAPABILITIES (The Maturity Layer)
CREATE TABLE IF NOT EXISTS capabilities (
    capability_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    capability_domain TEXT,
    capability_name TEXT NOT NULL,
    description TEXT,
    current_maturity INTEGER,
    -- 1 to 5
    target_maturity INTEGER,
    -- 1 to 5
    maturity_gap INTEGER,
    gap_status TEXT,
    linked_strategic_objectives TEXT,
    -- JSON Array
    supporting_value_streams TEXT,
    -- JSON Array
    investment_required REAL,
    priority TEXT,
    implementation_status TEXT,
    business_impact_statement TEXT,
    technical_owner_customer TEXT,
    last_assessment_date DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 6. VALUE STREAMS (Operational Flow)
CREATE TABLE IF NOT EXISTS value_streams (
    stream_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    value_stream_name TEXT NOT NULL,
    business_process TEXT,
    process_owner TEXT,
    linked_strategic_objectives TEXT,
    enabled_capabilities TEXT,
    integration_endpoints TEXT,
    -- JSON Array
    apis_consumed TEXT,
    -- JSON Array
    annual_transaction_volume INTEGER,
    cycle_time_baseline REAL,
    cycle_time_current REAL,
    cycle_time_target REAL,
    cycle_time_reduction_percent REAL,
    total_business_value_usd REAL,
    customer_satisfaction_score REAL,
    operational_risk_level TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 7. API PORTFOLIO (Technical Plane)
CREATE TABLE IF NOT EXISTS api_portfolio (
    api_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    api_name TEXT NOT NULL,
    api_type TEXT,
    -- Experience, Process, System
    api_version TEXT,
    business_capability TEXT,
    linked_value_streams TEXT,
    linked_strategic_objectives TEXT,
    environment TEXT,
    -- Sandbox, Production
    monthly_transactions INTEGER,
    avg_response_time_ms INTEGER,
    sla_target_ms INTEGER,
    sla_compliance_percent REAL,
    error_rate_percent REAL,
    uptime_percent REAL,
    consuming_applications TEXT,
    business_criticality TEXT,
    health_status TEXT,
    owner_team TEXT,
    last_sync_from_anypoint DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 8. PLATFORM HEALTH METRICS
CREATE TABLE IF NOT EXISTS platform_health_metrics (
    metric_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    metric_category TEXT,
    metric_name TEXT NOT NULL,
    metric_type TEXT,
    -- KPI, Technical
    current_value REAL,
    target_value REAL,
    threshold_warning REAL,
    threshold_critical REAL,
    unit TEXT,
    measurement_frequency TEXT,
    health_status TEXT,
    health_status_numeric INTEGER,
    trend_is_good BOOLEAN,
    last_measured DATETIME,
    linked_capability TEXT,
    data_source TEXT,
    business_impact_statement TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 9. INITIATIVES (The Change Plane)
CREATE TABLE IF NOT EXISTS initiatives (
    initiative_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    initiative_name TEXT NOT NULL,
    initiative_type TEXT,
    linked_strategic_objectives TEXT,
    linked_capabilities TEXT,
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
    services_amount_usd REAL,
    expected_annual_benefit REAL,
    expected_payback_months INTEGER,
    realized_annual_benefit REAL,
    success_criteria TEXT,
    owner_mulesoft TEXT,
    owner_customer TEXT,
    blockers TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 10. RISK REGISTER (Technical Debt & Risk)
CREATE TABLE IF NOT EXISTS risk_register (
    risk_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    risk_category TEXT,
    risk_title TEXT NOT NULL,
    description TEXT,
    affected_capability TEXT,
    affected_apis TEXT,
    linked_strategic_objectives TEXT,
    impact TEXT,
    impact_score INTEGER,
    -- 1 to 5
    probability TEXT,
    probability_score INTEGER,
    -- 1 to 5
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
-- 11. STAKEHOLDER OUTCOMES
CREATE TABLE IF NOT EXISTS stakeholder_outcomes (
    outcome_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    stakeholder_type TEXT,
    stakeholder_name TEXT NOT NULL,
    outcome_statement TEXT,
    linked_strategic_objectives TEXT,
    linked_value_streams TEXT,
    success_metric_name TEXT,
    baseline_value REAL,
    current_value REAL,
    target_value REAL,
    unit TEXT,
    target_achievement_percent REAL,
    measurement_method TEXT,
    status TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 12. ENGAGEMENT LOG
CREATE TABLE IF NOT EXISTS engagement_log (
    engagement_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    engagement_date DATETIME NOT NULL,
    engagement_type TEXT,
    -- QBR, Sync, Workshop
    attendees_mulesoft TEXT,
    attendees_customer TEXT,
    customer_seniority TEXT,
    topics_discussed TEXT,
    action_items TEXT,
    sentiment TEXT,
    relationship_depth_score INTEGER,
    next_steps TEXT,
    next_engagement_date DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 13. SUCCESS PLANS
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
    executive_sponsor_mulesoft TEXT,
    next_qbr_date DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 14. TASK MANAGER
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
-- 15. GENERATED INSIGHTS
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
-- Indexes for the SSOT
CREATE INDEX idx_ssot_account_tenant ON account_master(tenant_id, account_id);
CREATE INDEX idx_ssot_objectives_account ON strategic_objectives(account_id);
CREATE INDEX idx_ssot_initiatives_status ON initiatives(status);
CREATE INDEX idx_ssot_risks_score ON risk_register(risk_score);
CREATE INDEX idx_ssot_metrics_health ON platform_health_metrics(health_status);
CREATE INDEX idx_ssot_insights_generated ON generated_insights(date_generated);