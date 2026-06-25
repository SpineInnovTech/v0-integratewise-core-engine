-- Migration: 033_spine_accounts_intelligence.sql
-- Description: Accounts Intelligence spine schema expansion
-- Created: 2026-02-08
-- =============================================================================

-- =============================================================================
-- 1. PEOPLE / TEAM (Internal)
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'person',
    category VARCHAR(30) NOT NULL DEFAULT 'team' CHECK (
        category IN ('team', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { full_name, email, role, department, region, slack_user_id, active_status, accounts_assigned, account_count, total_arr_managed, avg_health_score }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_people_email ON spine_people(((data->>'email')));
CREATE INDEX idx_spine_people_role ON spine_people(((data->>'role')));

-- =============================================================================
-- 2. BUSINESS CONTEXT
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_business_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'business_context',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { business_model, market_position, operating_environment, key_challenges, strategic_priorities, digital_maturity, it_complexity_score, legacy_system_count, cloud_strategy, data_classification, last_updated, updated_by }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_business_context_account ON spine_business_context((scope->>'account_id'));

-- =============================================================================
-- 3. STRATEGIC OBJECTIVES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_strategic_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'strategic_objective',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { strategic_pillar, name, description, business_driver, quantified_goal, target_date, business_owner, business_value_usd, mulesoft_relevance, status, progress_percent, health_indicator, last_review_date, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_objectives_account ON spine_strategic_objectives((scope->>'account_id'));
CREATE INDEX idx_spine_objectives_status ON spine_strategic_objectives(((data->>'status')));

-- =============================================================================
-- 4. CAPABILITIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'capability',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { capability_domain, capability_name, description, current_maturity, current_maturity_num, target_maturity, target_maturity_num, maturity_gap, gap_status, investment_required, priority, implementation_status, business_impact_status, technical_owner, last_assessment_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_capabilities_account ON spine_capabilities((scope->>'account_id'));
CREATE INDEX idx_spine_capabilities_status ON spine_capabilities(((data->>'implementation_status')));

-- =============================================================================
-- 5. VALUE STREAMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_value_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'value_stream',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, process_owner }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { name, business_process, enabled_mulesoft_capabilities, integration_endpoints, apis_consumed, annual_transaction_volume, cycle_time_baseline_hours, cycle_time_current_hours, cycle_time_target_hours, cycle_time_reduction, total_business_value, customer_satisfaction, operational_risk_level }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_value_streams_account ON spine_value_streams((scope->>'account_id'));

-- =============================================================================
-- 6. API PORTFOLIO
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_api_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'api',
    category VARCHAR(30) NOT NULL DEFAULT 'tam' CHECK (
        category IN ('tam', 'csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_team }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { api_name, api_type, api_version, business_capability, environment, monthly_transactions, avg_response_time_ms, sla_target_ms, sla_compliance_percent, error_rate_percent, uptime_percent, consuming_applications, business_criticality, health_status, last_sync_from_any }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_api_portfolio_account ON spine_api_portfolio((scope->>'account_id'));
CREATE INDEX idx_spine_api_portfolio_health ON spine_api_portfolio(((data->>'health_status')));

-- =============================================================================
-- 7. PLATFORM HEALTH METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_platform_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'metric',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business', 'tam')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { metric_category, metric_name, metric_type, current_value, target_value, threshold_warning, threshold_critical, unit, measurement_frequency, health_status, health_status_numeric, trend_is_good, last_measured, data_source, business_impact_status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_metrics_account ON spine_platform_metrics((scope->>'account_id'));
CREATE INDEX idx_spine_metrics_name ON spine_platform_metrics(((data->>'metric_name')));

-- =============================================================================
-- 8. INITIATIVES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'initiative',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_mulesoft, owner_customer }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { name, initiative_type, business_driver, proposed_by, priority, phase, status, start_date, target_completion_date, actual_completion_date, days_overdue, investment_amount_usd, mulesoft_services_usd, expected_annual_benefit, expected_payback_months, realized_annual_benefit, success_criteria, blockers }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_initiatives_account ON spine_initiatives((scope->>'account_id'));
CREATE INDEX idx_spine_initiatives_status ON spine_initiatives(((data->>'status')));

-- =============================================================================
-- 9. TECHNICAL DEBT & RISK REGISTER
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_technical_debt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'technical_debt',
    category VARCHAR(30) NOT NULL DEFAULT 'tam' CHECK (
        category IN ('tam', 'ops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { risk_category, risk_title, description, affected_capability, affected_apis, impact, impact_score, probability, probability_score, risk_score, risk_level, mitigation_strategy, mitigation_initiative, mitigation_owner, target_resolution_date, status, date_identified }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_tech_debt_account ON spine_technical_debt((scope->>'account_id'));
CREATE INDEX idx_spine_tech_debt_status ON spine_technical_debt(((data->>'status')));

-- =============================================================================
-- 10. STAKEHOLDER OUTCOMES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_stakeholder_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'stakeholder_outcome',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, stakeholder_type }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { stakeholder_name, outcome_statement, success_metric_name, baseline_value, current_value, target_value, unit, target_achievement_percent, measurement_method, status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_outcomes_account ON spine_stakeholder_outcomes((scope->>'account_id'));
CREATE INDEX idx_spine_outcomes_status ON spine_stakeholder_outcomes(((data->>'status')));

-- =============================================================================
-- 11. ENGAGEMENT LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'engagement',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business', 'team')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { engagement_date, engagement_type, attendees_mulesoft, attendees_customer, customer_seniority, topics_discussed, action_items, sentiment, relationship_depth_score, next_steps, next_engagement_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_engagements_account ON spine_engagements((scope->>'account_id'));
CREATE INDEX idx_spine_engagements_date ON spine_engagements(((data->>'engagement_date')::timestamptz));

-- =============================================================================
-- 12. SUCCESS PLANS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_success_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'success_plan',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { executive_summary, plan_period, plan_status, creation_date, last_updated, strategic_objectives, key_initiatives, top_3_risks, executive_sponsor_customer, executive_sponsor_mulesoft, next_qbr_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_success_plans_account ON spine_success_plans((scope->>'account_id'));
CREATE INDEX idx_spine_success_plans_status ON spine_success_plans(((data->>'plan_status')));

-- =============================================================================
-- 13. GENERATED INSIGHTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'insight',
    category VARCHAR(30) NOT NULL DEFAULT 'csm' CHECK (
        category IN ('csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, generated_by }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { insight_text, recommended_action, status, date_generated, linked_metric_id, linked_risk_id, linked_initiative_id, linked_objective_id }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_insights_account ON spine_insights((scope->>'account_id'));
CREATE INDEX idx_spine_insights_status ON spine_insights(((data->>'status')));

-- =============================================================================
-- 14. EXTEND UNIVERSAL ENTITY VIEW
-- =============================================================================
CREATE OR REPLACE VIEW v_spine_entities AS
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_tasks
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_accounts
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_meetings
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_projects
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_objectives
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_documents
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_contacts
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, created_at AS updated_at
FROM spine_events
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_opportunities
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_renewals
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_risks
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_incidents
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_changes
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_campaigns
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_content
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_invoices
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_expenses
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_approvals
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_contracts
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_vendors
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_requests
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_people
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_business_context
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_strategic_objectives
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_capabilities
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_value_streams
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_api_portfolio
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_platform_metrics
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_initiatives
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_technical_debt
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_stakeholder_outcomes
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_engagements
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_success_plans
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_insights;

-- =============================================================================
-- END
-- =============================================================================
