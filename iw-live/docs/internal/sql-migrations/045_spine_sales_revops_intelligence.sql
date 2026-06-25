-- Migration: 045_spine_sales_revops_intelligence.sql
-- Description: Sales / RevOps / SalesOps spine schema expansion
-- Created: 2026-03-11
-- =============================================================================

-- =============================================================================
-- 1. REVENUE MASTER
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_revenue_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'revenue_master',
    category VARCHAR(30) NOT NULL DEFAULT 'revops' CHECK (
        category IN ('revops', 'sales', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_name, arr, mrr, tcv, acv, net_new_arr, expansion_arr, contraction_arr, churned_arr, net_retention_percent, gross_retention_percent, logo_retention_percent, revenue_type, payment_terms, billing_frequency, currency, recognition_method, booking_date, close_date, renewal_probability, upsell_potential_usd, cohort, segment, territory, owner_id, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_revenue_master_account ON spine_revenue_master((scope->>'account_id'));
CREATE INDEX idx_spine_revenue_master_owner ON spine_revenue_master((scope->>'owner_id'));
CREATE INDEX idx_spine_revenue_master_segment ON spine_revenue_master(((data->>'segment')));

-- =============================================================================
-- 2. PIPELINE INTELLIGENCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_pipeline_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'pipeline_intelligence',
    category VARCHAR(30) NOT NULL DEFAULT 'sales' CHECK (
        category IN ('sales', 'revops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { pipeline_name, total_value, weighted_value, deal_count, avg_deal_size, avg_days_in_pipeline, conversion_rate_percent, win_rate_percent, loss_rate_percent, stage_distribution, velocity_days, created_this_period, closed_won_this_period, closed_lost_this_period, pushed_this_period, coverage_ratio, period, period_type, snapshot_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_pipeline_intel_owner ON spine_pipeline_intelligence((scope->>'owner_id'));
CREATE INDEX idx_spine_pipeline_intel_period ON spine_pipeline_intelligence(((data->>'period')));

-- =============================================================================
-- 3. DEALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'deal',
    category VARCHAR(30) NOT NULL DEFAULT 'sales' CHECK (
        category IN ('sales', 'revops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { deal_name, stage, amount, currency, probability, expected_close_date, actual_close_date, deal_type, pipeline_id, forecast_category, source, lead_source, champion_name, champion_title, economic_buyer, decision_criteria, decision_process, next_step, days_in_stage, competitor, win_reason, loss_reason, close_plan, meddpicc_score, engagement_score, last_activity_date, owner_name, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_deals_account ON spine_deals((scope->>'account_id'));
CREATE INDEX idx_spine_deals_stage ON spine_deals(((data->>'stage')));
CREATE INDEX idx_spine_deals_expected_close ON spine_deals(((data->>'expected_close_date')));

-- =============================================================================
-- 4. FORECASTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'forecast',
    category VARCHAR(30) NOT NULL DEFAULT 'sales' CHECK (
        category IN ('sales', 'revops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { forecast_name, period, period_type, forecast_category, commit_amount, best_case_amount, pipeline_amount, closed_amount, gap_to_quota, accuracy_percent, call_amount, override_amount, override_reason, methodology, confidence, last_updated_by, snapshot_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_forecasts_owner ON spine_forecasts((scope->>'owner_id'));
CREATE INDEX idx_spine_forecasts_period ON spine_forecasts(((data->>'period')));

-- =============================================================================
-- 5. QUOTAS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'quota',
    category VARCHAR(30) NOT NULL DEFAULT 'sales' CHECK (
        category IN ('sales', 'revops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { quota_name, period, period_type, quota_amount, attainment_amount, attainment_percent, gap_amount, currency, quota_type, ramp_adjusted, on_track, days_remaining, projected_attainment_percent, accelerator_tier, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_quotas_owner ON spine_quotas((scope->>'owner_id'));
CREATE INDEX idx_spine_quotas_period ON spine_quotas(((data->>'period')));

-- =============================================================================
-- 6. REVENUE ATTRIBUTION
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_revenue_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'revenue_attribution',
    category VARCHAR(30) NOT NULL DEFAULT 'revops' CHECK (
        category IN ('revops', 'marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { attribution_model, channel, source, campaign_name, campaign_id, touch_type, touch_position, attributed_revenue, attributed_percent, deal_count, avg_deal_size, cost, roi_percent, cac, influenced_pipeline, period, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_rev_attribution_owner ON spine_revenue_attribution((scope->>'owner_id'));
CREATE INDEX idx_spine_rev_attribution_channel ON spine_revenue_attribution(((data->>'channel')));

-- =============================================================================
-- 7. SUBSCRIPTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'subscription',
    category VARCHAR(30) NOT NULL DEFAULT 'revops' CHECK (
        category IN ('revops', 'finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { plan_name, plan_tier, status, billing_cycle, start_date, current_period_start, current_period_end, next_billing_date, mrr, arr, quantity, unit_price, currency, auto_renew, cancel_at_period_end, cancelled_date, cancellation_reason, trial_end_date, discount_percent, external_subscription_id, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_subscriptions_account ON spine_subscriptions((scope->>'account_id'));
CREATE INDEX idx_spine_subscriptions_status ON spine_subscriptions(((data->>'status')));

-- =============================================================================
-- 8. BILLING SYNC
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_billing_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'billing_sync',
    category VARCHAR(30) NOT NULL DEFAULT 'revops' CHECK (
        category IN ('revops', 'finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { sync_type, source_system, target_system, entity_type_synced, records_synced, records_failed, last_sync_at, next_sync_at, sync_status, error_summary, amount_synced, currency, reconciliation_status, discrepancy_amount, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_billing_sync_account ON spine_billing_sync((scope->>'account_id'));
CREATE INDEX idx_spine_billing_sync_status ON spine_billing_sync(((data->>'sync_status')));

-- =============================================================================
-- 9. TERRITORIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'territory',
    category VARCHAR(30) NOT NULL DEFAULT 'sales' CHECK (
        category IN ('sales', 'revops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { territory_name, territory_type, region, country, industry_vertical, segment, account_count, total_arr, total_pipeline, assigned_rep_id, assigned_rep_name, quota_amount, attainment_percent, coverage_ratio, last_updated }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_territories_owner ON spine_territories((scope->>'owner_id'));
CREATE INDEX idx_spine_territories_region ON spine_territories((scope->>'region'));

-- =============================================================================
-- 10. COMMISSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'commission',
    category VARCHAR(30) NOT NULL DEFAULT 'sales' CHECK (
        category IN ('sales', 'revops', 'finance')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { rep_name, rep_id, period, period_type, base_salary, commission_rate_percent, commission_earned, commission_paid, commission_pending, accelerator_applied, spiff_amount, clawback_amount, total_comp, quota_attainment_percent, deal_count, status, payment_date, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_commissions_owner ON spine_commissions((scope->>'owner_id'));
CREATE INDEX idx_spine_commissions_status ON spine_commissions(((data->>'status')));

-- =============================================================================
-- 11. REVENUE METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_revenue_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'revenue_metric',
    category VARCHAR(30) NOT NULL DEFAULT 'revops' CHECK (
        category IN ('revops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { metric_category, metric_name, metric_type, current_value, target_value, previous_value, change_percent, threshold_warning, threshold_critical, unit, period, period_type, trend_direction, health_status, data_source, business_impact }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_revenue_metrics_team ON spine_revenue_metrics((scope->>'team_id'));
CREATE INDEX idx_spine_revenue_metrics_name ON spine_revenue_metrics(((data->>'metric_name')));

-- =============================================================================
-- 12. CHURN ANALYSIS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_churn_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'churn_analysis',
    category VARCHAR(30) NOT NULL DEFAULT 'revops' CHECK (
        category IN ('revops', 'csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_name, churn_type, churn_date, arr_lost, mrr_lost, tenure_months, reason_primary, reason_secondary, preventable, early_warning_signals, last_health_score, last_engagement_date, competitor_switch, win_back_probability, win_back_strategy, csm_at_time, lessons_learned, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_churn_account ON spine_churn_analysis((scope->>'account_id'));
CREATE INDEX idx_spine_churn_type ON spine_churn_analysis(((data->>'churn_type')));

-- =============================================================================
-- 13. COMPETITOR INTEL
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_competitor_intel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'competitor_intel',
    category VARCHAR(30) NOT NULL DEFAULT 'sales' CHECK (
        category IN ('sales', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { competitor_name, deal_id, account_name, competitive_situation, competitor_strengths, competitor_weaknesses, our_differentiators, pricing_comparison, win_loss_outcome, battlecard_url, last_updated, intelligence_source, confidence_level, market_position, threat_level }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_competitor_account ON spine_competitor_intel((scope->>'account_id'));
CREATE INDEX idx_spine_competitor_name ON spine_competitor_intel(((data->>'competitor_name')));

-- =============================================================================
-- 14. REP PERFORMANCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_rep_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'rep_performance',
    category VARCHAR(30) NOT NULL DEFAULT 'sales' CHECK (
        category IN ('sales', 'revops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, team_id, region }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { rep_name, rep_id, period, period_type, quota_amount, closed_won, attainment_percent, pipeline_generated, pipeline_coverage, win_rate, avg_deal_size, avg_sales_cycle_days, activities_count, meetings_held, proposals_sent, forecast_accuracy, rank_in_team, coaching_notes, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_rep_perf_owner ON spine_rep_performance((scope->>'owner_id'));
CREATE INDEX idx_spine_rep_perf_period ON spine_rep_performance(((data->>'period')));

-- =============================================================================
-- 15. SEED STREAMS
-- =============================================================================

-- Add missing streams
INSERT INTO spine_streams (id, tenant_id, stream_key, display_name, description, category, scope) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'revops', 'Revenue Operations', 'Revenue intelligence, pipeline, forecasting', 'business', '{"visibility": "org"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'salesops', 'Sales Operations', 'Sales execution, territory, rep performance', 'business', '{"visibility": "org"}'::jsonb)
ON CONFLICT (tenant_id, stream_key) DO NOTHING;

-- =============================================================================
-- END
-- =============================================================================
