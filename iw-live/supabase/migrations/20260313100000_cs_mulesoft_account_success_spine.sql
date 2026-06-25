-- =============================================================================
-- MuleSoft Account Success / Accounts Intelligence spine (same spine as PDF)
-- Requires: tenant_spine_config (051), spine.account (20260312200000).
-- All tables in cs schema; tenant_id TEXT; account_id → spine.account.
-- =============================================================================

-- People/team (CSM side)
CREATE TABLE IF NOT EXISTS cs.people_team (
    person_id             TEXT PRIMARY KEY,
    tenant_id             TEXT NOT NULL,
    full_name             TEXT NOT NULL,
    email                 TEXT NOT NULL,
    role                  TEXT,
    department            TEXT,
    region                TEXT,
    slack_user_id         TEXT,
    active_status         BOOLEAN DEFAULT true,
    accounts_assigned     INTEGER DEFAULT 0,
    account_count         INTEGER DEFAULT 0,
    total_arr_managed     NUMERIC(15,2) DEFAULT 0,
    avg_health_score      NUMERIC(5,2),
    at_risk_account_count INTEGER DEFAULT 0,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_people_team_tenant ON cs.people_team(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_people_team_email ON cs.people_team(email);

-- Business context (per account)
CREATE TABLE IF NOT EXISTS cs.business_context (
    context_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    business_model        TEXT,
    market_position       TEXT,
    operating_environment TEXT,
    key_business_challenges TEXT,
    strategic_priorities  TEXT,
    digital_maturity      TEXT,
    it_complexity_score   NUMERIC(5,2),
    legacy_system_count   INTEGER,
    cloud_strategy        TEXT,
    data_classification   TEXT,
    last_updated          TIMESTAMPTZ,
    updated_by             TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_business_context_account ON cs.business_context(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_business_context_tenant ON cs.business_context(tenant_id);

-- Strategic objectives
CREATE TABLE IF NOT EXISTS cs.strategic_objective (
    objective_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    strategic_pillar      TEXT,
    objective_name        TEXT NOT NULL,
    description           TEXT,
    business_driver       TEXT,
    quantified_goal       TEXT,
    target_date           DATE,
    business_owner        TEXT,
    business_value_usd    NUMERIC(15,2),
    mulesoft_relevance    TEXT,
    status                TEXT DEFAULT 'ON_TRACK',
    progress_percent      NUMERIC(5,2),
    health_indicator      TEXT,
    last_review_date      DATE,
    notes                 TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_strategic_objective_account ON cs.strategic_objective(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_strategic_objective_tenant ON cs.strategic_objective(tenant_id);

-- Capabilities (MuleSoft)
CREATE TABLE IF NOT EXISTS cs.capability (
    capability_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    capability_domain     TEXT,
    capability_name       TEXT NOT NULL,
    description           TEXT,
    current_maturity      TEXT,
    target_maturity       TEXT,
    maturity_gap          TEXT,
    gap_status            TEXT,
    investment_required   NUMERIC(15,2),
    priority              TEXT,
    implementation_status TEXT,
    business_impact_status TEXT,
    last_assessment_date  DATE,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_capability_account ON cs.capability(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_capability_tenant ON cs.capability(tenant_id);

-- Value streams
CREATE TABLE IF NOT EXISTS cs.value_stream (
    stream_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    value_stream_name     TEXT NOT NULL,
    business_process      TEXT,
    process_owner         TEXT,
    integration_endpoints TEXT,
    apis_consumed         TEXT,
    annual_transaction_volume NUMERIC(15,0),
    cycle_time_baseline_hours NUMERIC(10,2),
    cycle_time_current_hours  NUMERIC(10,2),
    cycle_time_target_hours   NUMERIC(10,2),
    total_business_value  NUMERIC(15,2),
    customer_satisfaction NUMERIC(5,2),
    operational_risk_level TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_value_stream_account ON cs.value_stream(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_value_stream_tenant ON cs.value_stream(tenant_id);

-- API portfolio
CREATE TABLE IF NOT EXISTS cs.api_portfolio (
    api_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    api_name              TEXT NOT NULL,
    api_type              TEXT,
    api_version           TEXT,
    business_capability   TEXT,
    environment           TEXT,
    monthly_transactions  NUMERIC(15,0),
    avg_response_time_ms  NUMERIC(12,2),
    sla_target_ms         INTEGER,
    sla_compliance_percent NUMERIC(5,2),
    error_rate_percent    NUMERIC(5,2),
    uptime_percent        NUMERIC(5,2),
    business_criticality  TEXT,
    health_status         TEXT,
    owner_team            TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_api_portfolio_account ON cs.api_portfolio(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_api_portfolio_tenant ON cs.api_portfolio(tenant_id);

-- Platform health metrics
CREATE TABLE IF NOT EXISTS cs.platform_health_metric (
    metric_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    metric_category       TEXT,
    metric_name           TEXT NOT NULL,
    metric_type           TEXT,
    current_value         NUMERIC(15,4),
    target_value          NUMERIC(15,4),
    threshold_warning     NUMERIC(15,4),
    threshold_critical    NUMERIC(15,4),
    unit                  TEXT,
    measurement_frequency TEXT,
    health_status         TEXT,
    trend_is_good         BOOLEAN,
    last_measured         TIMESTAMPTZ,
    data_source           TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_platform_health_metric_account ON cs.platform_health_metric(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_platform_health_metric_tenant ON cs.platform_health_metric(tenant_id);

-- Initiatives
CREATE TABLE IF NOT EXISTS cs.initiative (
    initiative_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    initiative_name       TEXT NOT NULL,
    initiative_type       TEXT,
    business_driver       TEXT,
    proposed_by           TEXT,
    priority              TEXT,
    phase                 TEXT,
    status                TEXT DEFAULT 'ACTIVE',
    start_date            DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    days_overdue          INTEGER,
    investment_amount_usd NUMERIC(15,2),
    mulesoft_services_usd NUMERIC(15,2),
    expected_annual_benefit NUMERIC(15,2),
    expected_payback_months INTEGER,
    realized_annual_benefit NUMERIC(15,2),
    success_criteria      TEXT,
    owner_mulesoft        TEXT,
    owner_customer        TEXT,
    blockers              TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_initiative_account ON cs.initiative(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_initiative_tenant ON cs.initiative(tenant_id);

-- Stakeholder outcomes (distinct from cs.outcome for metric-linked outcome)
CREATE TABLE IF NOT EXISTS cs.stakeholder_outcome (
    outcome_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    stakeholder_type      TEXT,
    stakeholder_name      TEXT,
    outcome_statement     TEXT NOT NULL,
    success_metric_name   TEXT,
    baseline_value        NUMERIC(15,4),
    current_value         NUMERIC(15,4),
    target_value          NUMERIC(15,4),
    unit                  TEXT,
    target_achievement_percent NUMERIC(5,2),
    measurement_method    TEXT,
    status                TEXT DEFAULT 'ON_TRACK',
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_stakeholder_outcome_account ON cs.stakeholder_outcome(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_stakeholder_outcome_tenant ON cs.stakeholder_outcome(tenant_id);

-- Engagement log
CREATE TABLE IF NOT EXISTS cs.engagement_log (
    engagement_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    engagement_date       DATE NOT NULL,
    engagement_type       TEXT,
    attendees_mulesoft    TEXT,
    attendees_customer    TEXT,
    customer_seniority    TEXT,
    topics_discussed      TEXT,
    action_items          TEXT,
    sentiment             TEXT,
    relationship_depth_score NUMERIC(5,2),
    next_steps            TEXT,
    next_engagement_date DATE,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_engagement_log_account ON cs.engagement_log(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_engagement_log_tenant ON cs.engagement_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_engagement_log_date ON cs.engagement_log(engagement_date);

-- Success plan tracker
CREATE TABLE IF NOT EXISTS cs.success_plan (
    success_plan_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    executive_summary     TEXT,
    plan_period           TEXT,
    plan_status           TEXT DEFAULT 'ACTIVE',
    strategic_objectives_count INTEGER,
    key_initiatives       TEXT,
    top_3_risks           TEXT,
    executive_sponsor_customer TEXT,
    executive_sponsor_mulesoft TEXT,
    next_qbr_date        DATE,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_success_plan_account ON cs.success_plan(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_success_plan_tenant ON cs.success_plan(tenant_id);

-- Task (account-scoped)
CREATE TABLE IF NOT EXISTS cs.task (
    task_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID REFERENCES spine.account(account_id) ON DELETE CASCADE,
    task_name             TEXT NOT NULL,
    owner                 TEXT,
    due_date              DATE,
    status                TEXT DEFAULT 'OPEN',
    priority              TEXT,
    linked_risk_id        UUID REFERENCES cs.risk_register(risk_id) ON DELETE SET NULL,
    linked_initiative_id  UUID REFERENCES cs.initiative(initiative_id) ON DELETE SET NULL,
    source                TEXT,
    external_task_id      TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_task_account ON cs.task(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_task_tenant ON cs.task(tenant_id);

-- Generated insights
CREATE TABLE IF NOT EXISTS cs.generated_insight (
    insight_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             TEXT NOT NULL,
    account_id            UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    csm                   TEXT,
    insight_text          TEXT NOT NULL,
    recommended_action    TEXT,
    status                TEXT DEFAULT 'PENDING',
    date_generated        TIMESTAMPTZ DEFAULT now(),
    linked_metric_id      UUID REFERENCES cs.platform_health_metric(metric_id) ON DELETE SET NULL,
    linked_risk_id        UUID REFERENCES cs.risk_register(risk_id) ON DELETE SET NULL,
    linked_initiative_id  UUID REFERENCES cs.initiative(initiative_id) ON DELETE SET NULL,
    linked_objective_id   UUID REFERENCES cs.strategic_objective(objective_id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_generated_insight_account ON cs.generated_insight(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_generated_insight_tenant ON cs.generated_insight(tenant_id);

COMMENT ON TABLE cs.people_team IS 'MuleSoft Account Success: People/team (CSM side). Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.business_context IS 'MuleSoft Account Success: Business context per account. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.strategic_objective IS 'MuleSoft Account Success: Strategic objectives. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.capability IS 'MuleSoft Account Success: Capabilities. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.value_stream IS 'MuleSoft Account Success: Value streams. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.api_portfolio IS 'MuleSoft Account Success: API portfolio. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.platform_health_metric IS 'MuleSoft Account Success: Platform health metrics. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.initiative IS 'MuleSoft Account Success: Initiatives. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.stakeholder_outcome IS 'MuleSoft Account Success: Stakeholder outcomes. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.engagement_log IS 'MuleSoft Account Success: Engagement log. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.success_plan IS 'MuleSoft Account Success: Success plan tracker. Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.task IS 'MuleSoft Account Success: Task manager (account-scoped). Same spine as Accounts Intelligence.';
COMMENT ON TABLE cs.generated_insight IS 'MuleSoft Account Success: Generated insights. Same spine as Accounts Intelligence.';
