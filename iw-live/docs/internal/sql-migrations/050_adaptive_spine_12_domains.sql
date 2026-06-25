-- ═══════════════════════════════════════════════════════════════════════════════
-- INTEGRATEWISE OS: ADAPTIVE SPINE v3.6
-- 12 Domain-Specific Schemas + Universal Core + Context Integration
-- ═══════════════════════════════════════════════════════════════════════════════

-- =============================================================================
-- PART 1: UNIVERSAL CORE (All domains share)
-- =============================================================================

-- Tenant & Identity Core
CREATE TABLE IF NOT EXISTS tenant_core (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name TEXT NOT NULL,
    org_domain TEXT UNIQUE,
    industry_vertical TEXT,
    industry_sub_sector TEXT,
    employee_count_range TEXT,
    annual_revenue_range TEXT,
    geography TEXT,
    country TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- People/Team Master (Universal across all domains)
CREATE TABLE IF NOT EXISTS people_master (
    person_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    job_title TEXT,
    region TEXT,
    slack_user_id TEXT,
    active_status TEXT DEFAULT 'active',
    accounts_assigned INTEGER DEFAULT 0,
    total_arr_managed DECIMAL(15,2),
    avg_health_score DECIMAL(5,2),
    at_risk_accounts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Goal Framework (Universal - spans all domains)
CREATE TABLE IF NOT EXISTS goals_master (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    domain TEXT NOT NULL, -- 'csm', 'sales', 'revops', etc.
    goal_type TEXT NOT NULL, -- 'okr', 'kpi', 'initiative'
    title TEXT NOT NULL,
    description TEXT,
    target_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    unit TEXT,
    progress_percent DECIMAL(5,2),
    status TEXT DEFAULT 'in-progress',
    target_date DATE,
    owner_id UUID REFERENCES people_master(person_id),
    parent_goal_id UUID REFERENCES goals_master(goal_id),
    linked_capabilities UUID[],
    linked_value_streams UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context Extraction Store (Docs, Emails, Chats → Linked to Spine)
CREATE TABLE IF NOT EXISTS context_extractions (
    extraction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    source_type TEXT NOT NULL, -- 'document', 'email', 'chat', 'meeting'
    source_id TEXT NOT NULL,
    source_url TEXT,
    extracted_text TEXT,
    extracted_entities JSONB, -- {accounts: [], contacts: [], deals: []}
    extracted_intents JSONB,
    linked_spine_entities JSONB, -- {account_id: [], contact_id: [], deal_id: []}
    confidence_score DECIMAL(5,2),
    extracted_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by TEXT -- 'ai_pipeline', 'manual'
);

-- Provenance & Audit (Universal)
CREATE TABLE IF NOT EXISTS provenance_log (
    provenance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    source_system TEXT NOT NULL, -- 'salesforce', 'hubspot', 'gmail', 'chat'
    source_record_id TEXT NOT NULL,
    ingestion_run_id TEXT,
    raw_hash TEXT,
    evidence_uri TEXT,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    confidence DECIMAL(5,2),
    captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 2: DOMAIN 1 - CUSTOMER SUCCESS (CSM/TAM) 
-- Based on your PDF: Detailed MuleSoft-style schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS csm_account_master (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    -- Core Account Info
    account_name TEXT NOT NULL,
    csm_narrative TEXT,
    industry_vertical TEXT,
    industry_sub_sector TEXT,
    contract_type TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    renewal_date DATE,
    days_to_renewal INTEGER,
    renewal_risk_level TEXT,
    
    -- Financial Metrics
    arr DECIMAL(15,2),
    acv DECIMAL(15,2),
    customer_success_manager_id UUID REFERENCES people_master(person_id),
    account_executive_id UUID REFERENCES people_master(person_id),
    solutions_architect_id UUID REFERENCES people_master(person_id),
    
    -- Executive Sponsorship
    executive_sponsor_customer TEXT,
    executive_sponsor_mulesoft TEXT,
    
    -- Health Scoring
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    health_score_trend_3m TEXT, -- 'improving', 'declining', 'stable'
    health_score_change DECIMAL(5,2),
    s_p_rating TEXT,
    
    -- Company Intel
    customer_annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    geography TEXT,
    country TEXT,
    
    -- Primary Contact
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_role TEXT,
    
    -- Engagement
    account_status TEXT DEFAULT 'active',
    last_engagement_date DATE,
    next_engagement_due DATE,
    engagement_cadence TEXT,
    
    -- Metadata
    created_date TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    modified_by UUID REFERENCES people_master(person_id),
    data_source TEXT,
    
    -- Link extracted context
    linked_context_ids UUID[]
);

-- CSM Business Context (Deep account understanding)
CREATE TABLE IF NOT EXISTS csm_business_context (
    context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    business_model TEXT,
    market_position TEXT,
    operating_environment TEXT,
    key_business_challenges TEXT[],
    strategic_priorities_cio TEXT[],
    digital_maturity TEXT,
    it_complexity_score INTEGER,
    legacy_system_count INTEGER,
    cloud_strategy TEXT,
    data_classification TEXT,
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES people_master(person_id)
);

-- CSM Strategic Objectives
CREATE TABLE IF NOT EXISTS csm_strategic_objectives (
    objective_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    strategic_pillar TEXT NOT NULL,
    objective_name TEXT NOT NULL,
    description TEXT,
    business_driver TEXT,
    quantified_goal TEXT,
    target_date DATE,
    business_owner TEXT,
    business_value_usd DECIMAL(15,2),
    mulesoft_relevance TEXT,
    status TEXT DEFAULT 'active',
    progress_percent DECIMAL(5,2),
    health_indicator TEXT,
    last_review_date DATE,
    notes TEXT,
    linked_capabilities UUID[],
    linked_value_streams UUID[],
    linked_initiatives UUID[]
);

-- CSM Capabilities (Maturity Model)
CREATE TABLE IF NOT EXISTS csm_capabilities (
    capability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    capability_domain TEXT NOT NULL,
    capability_name TEXT NOT NULL,
    description TEXT,
    current_maturity TEXT, -- 'basic', 'developing', 'advanced', 'optimized'
    current_maturity_num INTEGER CHECK (current_maturity_num BETWEEN 1 AND 5),
    target_maturity TEXT,
    target_maturity_num INTEGER CHECK (target_maturity_num BETWEEN 1 AND 5),
    maturity_gap INTEGER,
    gap_status TEXT,
    linked_strategic_objective_id UUID REFERENCES csm_strategic_objectives(objective_id),
    supporting_value_stream TEXT,
    investment_required TEXT, -- 'low', 'medium', 'high'
    priority INTEGER,
    implementation_status TEXT,
    business_impact_status TEXT,
    technical_owner_customer TEXT,
    last_assessment_date DATE
);

-- CSM Value Streams
CREATE TABLE IF NOT EXISTS csm_value_streams (
    stream_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    value_stream_name TEXT NOT NULL,
    business_process TEXT,
    process_owner TEXT,
    linked_strategic_objective_id UUID REFERENCES csm_strategic_objectives(objective_id),
    enabled_by_mulesoft_capability TEXT,
    integration_endpoints INTEGER,
    apis_consumed INTEGER,
    annual_transaction_volume BIGINT,
    cycle_time_baseline_hours INTEGER,
    cycle_time_current_hours INTEGER,
    cycle_time_target_hours INTEGER,
    cycle_time_reduction_percent DECIMAL(5,2),
    total_business_value_usd DECIMAL(15,2),
    customer_satisfaction_score DECIMAL(5,2),
    operational_risk_level TEXT
);

-- CSM API Portfolio
CREATE TABLE IF NOT EXISTS csm_api_portfolio (
    api_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    api_name TEXT NOT NULL,
    api_type TEXT,
    api_version TEXT,
    business_capability TEXT,
    linked_value_streams UUID[],
    linked_strategic_objective_id UUID,
    environment TEXT,
    monthly_transactions BIGINT,
    avg_response_time_ms INTEGER,
    sla_target_ms INTEGER,
    sla_compliance_percent DECIMAL(5,2),
    error_rate_percent DECIMAL(5,2),
    uptime_percent DECIMAL(5,2),
    consuming_applications INTEGER,
    business_criticality TEXT,
    health_status TEXT,
    owner_team TEXT,
    last_sync_from_anypoint DATE
);

-- CSM Platform Health Metrics
CREATE TABLE IF NOT EXISTS csm_platform_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    metric_category TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_type TEXT,
    current_value DECIMAL(15,2),
    target_value DECIMAL(15,2),
    threshold_warning DECIMAL(15,2),
    threshold_critical DECIMAL(15,2),
    unit TEXT,
    measurement_frequency TEXT,
    health_status TEXT,
    health_status_numeric INTEGER,
    trend_is_good BOOLEAN,
    last_measured TIMESTAMPTZ,
    linked_capability_id UUID REFERENCES csm_capabilities(capability_id),
    data_source TEXT,
    business_impact_status TEXT
);

-- CSM Initiatives
CREATE TABLE IF NOT EXISTS csm_initiatives (
    initiative_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    initiative_name TEXT NOT NULL,
    initiative_type TEXT,
    linked_strategic_objective_id UUID REFERENCES csm_strategic_objectives(objective_id),
    linked_capabilities UUID[],
    business_driver TEXT,
    proposed_by TEXT,
    priority INTEGER,
    phase TEXT,
    status TEXT,
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    days_overdue INTEGER,
    investment_amount_usd DECIMAL(15,2),
    mulesoft_services_usd DECIMAL(15,2),
    expected_annual_benefit DECIMAL(15,2),
    expected_payback_months INTEGER,
    realized_annual_benefit DECIMAL(15,2),
    success_criteria TEXT,
    owner_mulesoft UUID REFERENCES people_master(person_id),
    owner_customer TEXT,
    blockers TEXT,
    mulesoft_capabilities_used TEXT[]
);

-- CSM Risk Register
CREATE TABLE IF NOT EXISTS csm_risk_register (
    risk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    risk_category TEXT NOT NULL,
    risk_title TEXT NOT NULL,
    description TEXT,
    affected_capability_id UUID REFERENCES csm_capabilities(capability_id),
    affected_apis UUID[],
    linked_strategic_objective_id UUID,
    impact TEXT,
    impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 5),
    probability TEXT,
    probability_score INTEGER CHECK (probability_score BETWEEN 1 AND 5),
    risk_score INTEGER,
    risk_level TEXT,
    mitigation_strategy TEXT,
    mitigation_initiative_id UUID REFERENCES csm_initiatives(initiative_id),
    mitigation_owner UUID REFERENCES people_master(person_id),
    target_resolution_date DATE,
    status TEXT,
    date_identified DATE
);

-- CSM Engagement Log
CREATE TABLE IF NOT EXISTS csm_engagement_log (
    engagement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    engagement_date DATE NOT NULL,
    engagement_type TEXT, -- 'qbr', 'workshop', 'escalation', 'routine'
    attendees_mulesoft UUID[],
    attendees_customer TEXT[],
    customer_seniority TEXT,
    topics_discussed TEXT[],
    action_items TEXT[],
    sentiment TEXT,
    relationship_depth_score INTEGER CHECK (relationship_depth_score BETWEEN 1 AND 10),
    next_steps TEXT,
    next_engagement_date DATE
);

-- CSM Success Plan Tracker
CREATE TABLE IF NOT EXISTS csm_success_plans (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    executive_summary TEXT,
    plan_period TEXT,
    plan_status TEXT,
    creation_date DATE,
    last_updated DATE,
    strategic_objectives JSONB,
    key_initiatives JSONB,
    top_risks JSONB,
    executive_sponsor_customer TEXT,
    executive_sponsor_mulesoft TEXT,
    next_qbr_date DATE
);

-- CSM Generated Insights (AI Layer)
CREATE TABLE IF NOT EXISTS csm_ai_insights (
    insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES csm_account_master(account_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    csm_id UUID REFERENCES people_master(person_id),
    
    insight_text TEXT NOT NULL,
    recommended_action TEXT,
    status TEXT DEFAULT 'new',
    date_generated TIMESTAMPTZ DEFAULT NOW(),
    linked_metric_id UUID REFERENCES csm_platform_metrics(metric_id),
    linked_risk_id UUID REFERENCES csm_risk_register(risk_id),
    linked_initiative_id UUID REFERENCES csm_initiatives(initiative_id),
    linked_objective_id UUID REFERENCES csm_strategic_objectives(objective_id),
    confidence_score DECIMAL(5,2)
);

-- =============================================================================
-- PART 3: DOMAIN 2 - SALES
-- =============================================================================

CREATE TABLE IF NOT EXISTS sales_deals (
    deal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    deal_name TEXT NOT NULL,
    account_id UUID, -- Links to CSM account_master
    account_name TEXT,
    stage TEXT NOT NULL,
    stage_probability DECIMAL(5,2),
    amount DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    close_date DATE,
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Ownership
    owner_id UUID REFERENCES people_master(person_id),
    team_id TEXT,
    
    -- Deal Intelligence
    deal_health_score INTEGER,
    competitive_threats TEXT[],
    decision_criteria TEXT[],
    decision_process TEXT,
    identified_blockers TEXT[],
    
    -- Engagement
    last_activity_date DATE,
    last_activity_type TEXT,
    next_activity_date DATE,
    next_activity_type TEXT,
    days_since_last_activity INTEGER,
    
    -- Forecasting
    forecast_category TEXT, -- 'best-case', 'commit', 'pipeline', 'closed'
    forecast_confidence DECIMAL(5,2),
    
    -- Multi-touch Attribution
    first_touch_source TEXT,
    last_touch_source TEXT,
    attribution_model TEXT,
    campaign_influence UUID[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    account_id UUID,
    
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    title TEXT,
    role TEXT, -- 'decision-maker', 'influencer', 'champion', 'blocker'
    department TEXT,
    
    -- Engagement Scoring
    lead_score INTEGER,
    engagement_level TEXT,
    last_activity_date DATE,
    last_activity_type TEXT,
    
    -- Buying Role
    decision_authority_level INTEGER, -- 1-10
    budget_authority BOOLEAN,
    technical_buyer BOOLEAN,
    economic_buyer BOOLEAN,
    
    -- LinkedIn/Social
    linkedin_url TEXT,
    twitter_handle TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_activities (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    deal_id UUID REFERENCES sales_deals(deal_id),
    contact_id UUID REFERENCES sales_contacts(contact_id),
    account_id UUID,
    
    activity_type TEXT, -- 'call', 'email', 'meeting', 'demo', 'proposal'
    subject TEXT,
    description TEXT,
    activity_date TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- Outcome
    outcome TEXT,
    next_steps TEXT,
    follow_up_date DATE,
    
    owner_id UUID REFERENCES people_master(person_id),
    
    -- AI Analysis
    sentiment TEXT,
    key_topics TEXT[],
    action_items_extracted TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 4: DOMAIN 3 - REVENUE OPERATIONS (RevOps)
-- =============================================================================

CREATE TABLE IF NOT EXISTS revops_waterfall (
    waterfall_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    period TEXT NOT NULL,
    
    -- Beginning ARR
    starting_arr DECIMAL(15,2),
    
    -- Movements
    new_business_arr DECIMAL(15,2),
    expansion_arr DECIMAL(15,2),
    contraction_arr DECIMAL(15,2),
    churn_arr DECIMAL(15,2),
    reactivation_arr DECIMAL(15,2),
    
    -- Ending ARR
    ending_arr DECIMAL(15,2),
    
    -- Metrics
    net_retention_rate DECIMAL(5,2),
    gross_retention_rate DECIMAL(5,2),
    logo_retention_rate DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revops_cohorts (
    cohort_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    cohort_period TEXT NOT NULL,
    
    cohort_start_date DATE,
    initial_customers INTEGER,
    initial_arr DECIMAL(15,2),
    
    -- Retention by period
    month_1_retention DECIMAL(5,2),
    month_3_retention DECIMAL(5,2),
    month_6_retention DECIMAL(5,2),
    month_12_retention DECIMAL(5,2),
    month_24_retention DECIMAL(5,2),
    
    -- ARR expansion
    current_arr DECIMAL(15,2),
    expansion_rate DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revops_forecasts (
    forecast_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    period TEXT NOT NULL,
    forecast_type TEXT, -- 'sales', 'renewal', 'expansion'
    
    -- Forecast Categories
    best_case DECIMAL(15,2),
    commit DECIMAL(15,2),
    pipeline DECIMAL(15,2),
    closed_won DECIMAL(15,2),
    
    -- Targets
    quota DECIMAL(15,2),
    target DECIMAL(15,2),
    
    -- Coverage
    coverage_ratio DECIMAL(5,2),
    
    -- Confidence
    forecast_confidence DECIMAL(5,2),
    ai_forecast_suggestion DECIMAL(15,2),
    
    owner_id UUID REFERENCES people_master(person_id),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 5: DOMAIN 4 - BUSINESS OPERATIONS (BizOps)
-- =============================================================================

CREATE TABLE IF NOT EXISTS bizops_vendors (
    vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    name TEXT NOT NULL,
    category TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    owner_id UUID REFERENCES people_master(person_id),
    risk_rating TEXT,
    annual_spend DECIMAL(15,2),
    status TEXT,
    payment_terms TEXT,
    compliance_certs TEXT[],
    last_review_date DATE
);

CREATE TABLE IF NOT EXISTS bizops_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    vendor_id UUID REFERENCES bizops_vendors(vendor_id),
    
    vendor_name TEXT,
    amount DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    due_date DATE,
    status TEXT, -- 'pending', 'approved', 'paid', 'overdue'
    approver_id UUID REFERENCES people_master(person_id),
    category TEXT,
    issue_date DATE,
    department TEXT
);

CREATE TABLE IF NOT EXISTS bizops_approvals (
    approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    requestor_id UUID REFERENCES people_master(person_id),
    approval_type TEXT, -- 'spend', 'vendor', 'headcount'
    amount DECIMAL(15,2),
    policy_id TEXT,
    status TEXT,
    decision_by UUID REFERENCES people_master(person_id),
    decided_at TIMESTAMPTZ,
    title TEXT,
    description TEXT
);

-- =============================================================================
-- PART 6: DOMAIN 5 - MARKETING
-- =============================================================================

CREATE TABLE IF NOT EXISTS marketing_campaigns (
    campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    name TEXT NOT NULL,
    campaign_type TEXT,
    status TEXT,
    channel TEXT,
    
    -- Performance
    sent INTEGER,
    delivered INTEGER,
    opens INTEGER,
    clicks INTEGER,
    conversions INTEGER,
    conversion_rate DECIMAL(5,2),
    revenue_attributed DECIMAL(15,2),
    
    -- Budget
    budget DECIMAL(15,2),
    spend DECIMAL(15,2),
    roi DECIMAL(5,2),
    
    -- Dates
    start_date DATE,
    end_date DATE,
    
    owner_id UUID REFERENCES people_master(person_id)
);

CREATE TABLE IF NOT EXISTS marketing_attribution (
    attribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    deal_id UUID,
    
    touchpoints JSONB, -- Ordered array of all touchpoints
    first_touch_source TEXT,
    last_touch_source TEXT,
    
    -- Attribution models
    linear_attribution JSONB,
    first_touch_attribution JSONB,
    last_touch_attribution JSONB,
    u_shaped_attribution JSONB,
    
    revenue_influenced DECIMAL(15,2),
    model_used TEXT
);

-- =============================================================================
-- PART 7: DOMAIN 6 - PRODUCT / ENGINEERING
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_features (
    feature_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    feature_name TEXT NOT NULL,
    description TEXT,
    status TEXT, -- 'planned', 'in-development', 'beta', 'ga', 'deprecated'
    
    -- Roadmap
    target_release DATE,
    actual_release DATE,
    
    -- Metrics
    adoption_rate DECIMAL(5,2),
    nps_score DECIMAL(5,2),
    support_tickets INTEGER,
    
    -- Ownership
    product_manager_id UUID REFERENCES people_master(person_id),
    engineering_lead_id UUID REFERENCES people_master(person_id),
    
    -- Link to initiatives
    linked_initiative_id UUID
);

CREATE TABLE IF NOT EXISTS engineering_incidents (
    incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    title TEXT NOT NULL,
    severity TEXT, -- 'p0', 'p1', 'p2', 'p3'
    status TEXT,
    
    -- Timeline
    detected_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Impact
    affected_services TEXT[],
    affected_customers INTEGER,
    affected_accounts UUID[],
    
    -- Metrics
    mttr_minutes INTEGER, -- Mean time to resolve
    mtbf_days INTEGER, -- Mean time between failures
    
    owner_id UUID REFERENCES people_master(person_id),
    root_cause TEXT,
    remediation TEXT
);

-- =============================================================================
-- PART 8: DOMAIN 7 - FINANCE
-- =============================================================================

CREATE TABLE IF NOT EXISTS finance_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    transaction_type TEXT, -- 'revenue', 'expense', 'refund', 'adjustment'
    amount DECIMAL(15,2),
    currency TEXT,
    
    -- Linking
    account_id UUID,
    deal_id UUID,
    invoice_id UUID,
    
    -- Recognition
    recognized_date DATE,
    recognition_period TEXT,
    deferred_amount DECIMAL(15,2),
    
    -- Classification
    revenue_type TEXT, -- 'subscription', 'services', 'usage'
    cost_center TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 9: DOMAIN 8 - PEOPLE / HR
-- =============================================================================

CREATE TABLE IF NOT EXISTS people_headcount (
    headcount_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    person_id UUID REFERENCES people_master(person_id),
    
    employee_id TEXT,
    hire_date DATE,
    termination_date DATE,
    status TEXT, -- 'active', 'on-leave', 'terminated'
    
    -- Org structure
    cost_center TEXT,
    team TEXT,
    manager_id UUID REFERENCES people_master(person_id),
    
    -- Compensation
    salary_band TEXT,
    equity_grant DECIMAL(15,2),
    bonus_target DECIMAL(15,2),
    
    -- Performance
    last_review_date DATE,
    performance_rating TEXT,
    engagement_score DECIMAL(5,2)
);

-- =============================================================================
-- PART 10: DOMAIN 9 - IT / SECURITY
-- =============================================================================

CREATE TABLE IF NOT EXISTS it_assets (
    asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    asset_type TEXT, -- 'laptop', 'server', 'license', 'subscription'
    name TEXT,
    status TEXT,
    
    -- Ownership
    assigned_to UUID REFERENCES people_master(person_id),
    department TEXT,
    
    -- Lifecycle
    purchase_date DATE,
    warranty_end DATE,
    renewal_date DATE,
    
    -- Financial
    purchase_cost DECIMAL(15,2),
    current_value DECIMAL(15,2),
    
    -- Security
    last_security_scan DATE,
    compliance_status TEXT,
    vulnerabilities TEXT[]
);

CREATE TABLE IF NOT EXISTS security_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    event_type TEXT, -- 'login', 'data-access', 'permission-change', 'alert'
    severity TEXT,
    
    actor_id UUID REFERENCES people_master(person_id),
    target_resource TEXT,
    target_resource_type TEXT,
    
    -- Details
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN,
    failure_reason TEXT,
    
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES people_master(person_id),
    reviewed_at TIMESTAMPTZ
);

-- =============================================================================
-- PART 11: DOMAIN 10 - WEBSITE / DIGITAL
-- =============================================================================

CREATE TABLE IF NOT EXISTS website_pages (
    page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    path TEXT NOT NULL,
    title TEXT,
    status TEXT,
    
    -- Performance
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    avg_time_on_page INTEGER,
    bounce_rate DECIMAL(5,2),
    
    -- SEO
    seo_score INTEGER,
    meta_description TEXT,
    keywords TEXT[],
    
    last_modified DATE,
    author_id UUID REFERENCES people_master(person_id)
);

CREATE TABLE IF NOT EXISTS website_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    date DATE NOT NULL,
    
    visitors INTEGER,
    unique_visitors INTEGER,
    sessions INTEGER,
    page_views INTEGER,
    avg_session_duration INTEGER,
    bounce_rate DECIMAL(5,2),
    conversion_rate DECIMAL(5,2),
    
    -- Device breakdown
    device_desktop_percent INTEGER,
    device_mobile_percent INTEGER,
    device_tablet_percent INTEGER,
    
    -- Source
    top_source TEXT
);

-- =============================================================================
-- PART 12: DOMAIN 11 - PERSONAL / PRODUCTIVITY
-- =============================================================================

CREATE TABLE IF NOT EXISTS personal_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    owner_id UUID REFERENCES people_master(person_id),
    
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT,
    status TEXT,
    due_date DATE,
    
    -- Linking to domain entities
    linked_account_id UUID,
    linked_deal_id UUID,
    linked_initiative_id UUID,
    
    -- Context
    category TEXT,
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    owner_id UUID REFERENCES people_master(person_id),
    
    title TEXT,
    content TEXT,
    
    -- AI extracted
    extracted_entities JSONB,
    suggested_links JSONB,
    
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 13: DOMAIN 12 - AI / COGNITIVE MEMORY
-- =============================================================================

CREATE TABLE IF NOT EXISTS memory_store (
    memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    memory_type TEXT, -- 'stable_fact', 'approved_decision', 'playbook', 'normalization_rule'
    scope JSONB, -- {orgId, teamId}
    content TEXT NOT NULL,
    
    -- Evidence
    evidence_refs TEXT[],
    linked_entities JSONB,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    supersedes UUID REFERENCES memory_store(memory_id),
    
    -- Governance
    created_by UUID REFERENCES people_master(person_id),
    approved_by UUID REFERENCES people_master(person_id),
    status TEXT, -- 'candidate', 'committed', 'deprecated'
    
    -- TTL for auto-expiry
    ttl_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    user_id UUID REFERENCES people_master(person_id),
    
    title TEXT,
    domain TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    status TEXT,
    
    -- Context entities referenced
    context_entities UUID[],
    
    -- Session summary (AI generated)
    summary TEXT,
    action_items_extracted TEXT[]
);

CREATE TABLE IF NOT EXISTS ai_chat_ledger (
    chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ai_chat_sessions(session_id),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    role TEXT, -- 'user', 'assistant', 'system'
    content TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES people_master(person_id),
    
    -- Citations to spine
    citations JSONB, -- [{type: 'spine', entityType, entityId}]
    tool_calls JSONB,
    approvals JSONB, -- For actions requiring approval
    
    -- Extracted for memory
    extracted_candidates UUID[]
);

-- =============================================================================
-- PART 14: INDICES FOR PERFORMANCE
-- =============================================================================

-- Account Master Indices
CREATE INDEX idx_csm_account_tenant ON csm_account_master(tenant_id);
CREATE INDEX idx_csm_account_renewal ON csm_account_master(renewal_date);
CREATE INDEX idx_csm_account_health ON csm_account_master(health_score);
CREATE INDEX idx_csm_account_arr ON csm_account_master(arr DESC);

-- Deal Indices
CREATE INDEX idx_sales_deal_tenant ON sales_deals(tenant_id);
CREATE INDEX idx_sales_deal_stage ON sales_deals(stage);
CREATE INDEX idx_sales_deal_close ON sales_deals(close_date);
CREATE INDEX idx_sales_deal_owner ON sales_deals(owner_id);

-- Context Extraction Indices
CREATE INDEX idx_context_tenant ON context_extractions(tenant_id);
CREATE INDEX idx_context_source ON context_extractions(source_type, source_id);
CREATE INDEX idx_context_entities ON context_extractions USING GIN(linked_spine_entities);

-- Memory Indices
CREATE INDEX idx_memory_tenant ON memory_store(tenant_id);
CREATE INDEX idx_memory_type ON memory_store(memory_type);
CREATE INDEX idx_memory_scope ON memory_store USING GIN(scope);

-- Provenance Indices
CREATE INDEX idx_provenance_source ON provenance_log(source_system, source_record_id);
CREATE INDEX idx_provenance_entity ON provenance_log(entity_type, entity_id);

-- =============================================================================
-- PART 15: ADAPTIVE SPINE CONFIGURATION
-- =============================================================================

-- Domain Schema Registry (Defines which fields exist per domain)
CREATE TABLE IF NOT EXISTS spine_schema_registry (
    field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    domain TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    field_key TEXT NOT NULL,
    field_type TEXT NOT NULL,
    required BOOLEAN DEFAULT false,
    pii_class TEXT, -- 'none', 'pii', 'sensitive', 'confidential'
    write_policy TEXT, -- 'spine_only', 'admin_only', 'connector_write'
    version INTEGER DEFAULT 1,
    description TEXT,
    UNIQUE(tenant_id, domain, entity_type, field_key)
);

-- Data Completeness Tracking
CREATE TABLE IF NOT EXISTS spine_completeness (
    completeness_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    org_id TEXT,
    domain TEXT,
    entity_type TEXT,
    record_count INTEGER,
    total_fields INTEGER,
    populated_fields INTEGER,
    coverage_pct DECIMAL(5,2),
    missing_fields TEXT[],
    last_scored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-Domain Entity Linking
CREATE TABLE IF NOT EXISTS spine_entity_links (
    link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant_core(tenant_id),
    
    source_domain TEXT,
    source_entity_type TEXT,
    source_entity_id UUID,
    
    target_domain TEXT,
    target_entity_type TEXT,
    target_entity_id UUID,
    
    link_type TEXT, -- 'parent-child', 'related', 'derived-from'
    confidence DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

