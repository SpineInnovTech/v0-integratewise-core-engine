-- ============================================================================
-- IntegrateWise — Account Success Schema
-- Version: 1.0 — June 1, 2026
-- Database: Supabase (Postgres)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ACCOUNT SUCCESS SCHEMA (cs.*)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS cs;

-- Account Master (Layer 1)
CREATE TABLE IF NOT EXISTS cs.account_master (
  account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  industry TEXT,
  segment TEXT CHECK (segment IN ('enterprise', 'mid-market', 'smb')),
  region TEXT,
  arr NUMERIC(15,2) DEFAULT 0,
  mrr NUMERIC(15,2) DEFAULT 0,
  health_score NUMERIC(5,2) DEFAULT 50,
  health_status TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN health_score >= 80 THEN 'healthy'
      WHEN health_score >= 60 THEN 'at-risk'
      ELSE 'critical'
    END
  ) STORED,
  renewal_date DATE,
  renewal_days INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM renewal_date - CURRENT_DATE)
  ) STORED,
  owner_id TEXT,
  owner_name TEXT,
  csm_id TEXT,
  csm_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'onboarding', 'churned', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_account_tenant ON cs.account_master(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_account_health ON cs.account_master(health_score);
CREATE INDEX IF NOT EXISTS idx_cs_account_renewal ON cs.account_master(renewal_date);

-- People/Team (Layer 2)
CREATE TABLE IF NOT EXISTS cs.people_team (
  person_id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  department TEXT,
  region TEXT,
  active_status BOOLEAN DEFAULT true,
  accounts_assigned INTEGER DEFAULT 0,
  total_arr_managed NUMERIC(15,2) DEFAULT 0,
  avg_health_score NUMERIC(5,2),
  at_risk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_people_tenant ON cs.people_team(tenant_id);

-- Business Context (Layer 3)
CREATE TABLE IF NOT EXISTS cs.business_context (
  context_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  business_model TEXT,
  market_position TEXT,
  operating_environment TEXT,
  key_challenges TEXT,
  digital_maturity TEXT CHECK (digital_maturity IN ('nascent', 'developing', 'advancing', 'leading')),
  it_complexity_score NUMERIC(5,2),
  cloud_strategy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_context_account ON cs.business_context(account_id);

-- Strategic Objectives (Layer 4)
CREATE TABLE IF NOT EXISTS cs.strategic_objective (
  objective_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  strategic_pillar TEXT,
  objective_name TEXT NOT NULL,
  description TEXT,
  quantified_goal TEXT,
  target_date DATE,
  business_owner TEXT,
  business_value_usd NUMERIC(15,2),
  status TEXT DEFAULT 'on_track' CHECK (status IN ('not_started', 'in_progress', 'on_track', 'at_risk', 'completed')),
  progress_percent NUMERIC(5,2) DEFAULT 0,
  health_indicator TEXT CHECK (health_indicator IN ('green', 'amber', 'red')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_objective_account ON cs.strategic_objective(account_id);

-- Capabilities (Layer 5)
CREATE TABLE IF NOT EXISTS cs.capability (
  capability_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  capability_domain TEXT,
  capability_name TEXT NOT NULL,
  description TEXT,
  current_maturity TEXT,
  target_maturity TEXT,
  maturity_gap TEXT,
  gap_status TEXT CHECK (gap_status IN ('critical', 'significant', 'moderate', 'minor', 'closed')),
  investment_required NUMERIC(15,2),
  priority TEXT CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  implementation_status TEXT CHECK (implementation_status IN ('not_started', 'planning', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_capability_account ON cs.capability(account_id);

-- Value Streams (Layer 6)
CREATE TABLE IF NOT EXISTS cs.value_stream (
  stream_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  value_stream_name TEXT NOT NULL,
  business_process TEXT,
  process_owner TEXT,
  integration_endpoints INTEGER DEFAULT 0,
  apis_consumed INTEGER DEFAULT 0,
  annual_transaction_volume NUMERIC(15,0) DEFAULT 0,
  cycle_time_baseline_hours NUMERIC(10,2),
  cycle_time_current_hours NUMERIC(10,2),
  cycle_time_target_hours NUMERIC(10,2),
  total_business_value NUMERIC(15,2) DEFAULT 0,
  operational_risk_level TEXT CHECK (operational_risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_valuestream_account ON cs.value_stream(account_id);

-- API Portfolio (Layer 7)
CREATE TABLE IF NOT EXISTS cs.api_portfolio (
  api_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  api_name TEXT NOT NULL,
  api_type TEXT CHECK (api_type IN ('system', 'process', 'experience')),
  api_version TEXT,
  business_capability TEXT,
  environment TEXT CHECK (environment IN ('production', 'staging', 'development')),
  monthly_transactions NUMERIC(15,0) DEFAULT 0,
  avg_response_time_ms NUMERIC(12,2),
  sla_compliance_percent NUMERIC(5,2),
  error_rate_percent NUMERIC(5,2),
  uptime_percent NUMERIC(5,2),
  business_criticality TEXT CHECK (business_criticality IN ('critical', 'high', 'medium', 'low')),
  health_status TEXT CHECK (health_status IN ('healthy', 'warning', 'critical', 'offline')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_api_account ON cs.api_portfolio(account_id);

-- Platform Health Metrics (Layer 8)
CREATE TABLE IF NOT EXISTS cs.platform_health_metric (
  metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  metric_category TEXT,
  metric_name TEXT NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('KPI', 'SLA', 'operational', 'business')),
  current_value NUMERIC(15,4),
  target_value NUMERIC(15,4),
  threshold_warning NUMERIC(15,4),
  threshold_critical NUMERIC(15,4),
  unit TEXT,
  health_status TEXT CHECK (health_status IN ('healthy', 'warning', 'critical')),
  trend_is_good BOOLEAN,
  last_measured TIMESTAMPTZ,
  data_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_metric_account ON cs.platform_health_metric(account_id);

-- Initiatives (Layer 9)
CREATE TABLE IF NOT EXISTS cs.initiative (
  initiative_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  initiative_name TEXT NOT NULL,
  initiative_type TEXT,
  business_driver TEXT,
  priority TEXT CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  phase TEXT CHECK (phase IN ('ideation', 'planning', 'execution', 'monitoring', 'completed', 'cancelled')),
  status TEXT DEFAULT 'active' CHECK (status IN ('on_track', 'at_risk', 'delayed', 'completed', 'blocked')),
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  days_overdue INTEGER DEFAULT 0,
  investment_amount_usd NUMERIC(15,2) DEFAULT 0,
  expected_annual_benefit NUMERIC(15,2) DEFAULT 0,
  success_criteria TEXT,
  owner_org TEXT,
  owner_customer TEXT,
  blockers TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_initiative_account ON cs.initiative(account_id);

-- Risk Register (Layer 10)
CREATE TABLE IF NOT EXISTS cs.risk_register (
  risk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  risk_category TEXT,
  risk_title TEXT NOT NULL,
  description TEXT,
  impact TEXT CHECK (impact IN ('critical', 'high', 'medium', 'low')),
  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  probability TEXT CHECK (probability IN ('very_likely', 'likely', 'possible', 'unlikely')),
  probability_score INTEGER CHECK (probability_score BETWEEN 1 AND 10),
  risk_score INTEGER GENERATED ALWAYS AS (impact_score * probability_score) STORED,
  risk_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN impact_score * probability_score >= 70 THEN 'critical'
      WHEN impact_score * probability_score >= 40 THEN 'high'
      WHEN impact_score * probability_score >= 20 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  mitigation_strategy TEXT,
  mitigation_owner TEXT,
  target_resolution_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'mitigating', 'resolved', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_risk_account ON cs.risk_register(account_id);

-- Stakeholder Outcomes (Layer 11)
CREATE TABLE IF NOT EXISTS cs.stakeholder_outcome (
  outcome_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  stakeholder_type TEXT,
  stakeholder_name TEXT,
  outcome_statement TEXT NOT NULL,
  success_metric_name TEXT,
  baseline_value NUMERIC(15,4),
  current_value NUMERIC(15,4),
  target_value NUMERIC(15,4),
  unit TEXT,
  target_achievement_percent NUMERIC(5,2),
  status TEXT DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'behind', 'achieved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_outcome_account ON cs.stakeholder_outcome(account_id);

-- Engagement Log (Layer 12)
CREATE TABLE IF NOT EXISTS cs.engagement_log (
  engagement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  engagement_date DATE NOT NULL,
  engagement_type TEXT,
  attendees_org TEXT,
  attendees_customer TEXT,
  customer_seniority TEXT CHECK (customer_seniority IN ('c_suite', 'vp', 'director', 'manager', 'individual')),
  topics_discussed TEXT,
  action_items TEXT,
  sentiment TEXT CHECK (sentiment IN ('very_positive', 'positive', 'neutral', 'negative', 'concerning')),
  relationship_depth_score NUMERIC(5,2),
  next_steps TEXT,
  next_engagement_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_engagement_account ON cs.engagement_log(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_engagement_date ON cs.engagement_log(engagement_date);

-- Success Plans (Layer 13)
CREATE TABLE IF NOT EXISTS cs.success_plan (
  success_plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  executive_summary TEXT,
  plan_period TEXT,
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'draft', 'under_review', 'completed')),
  strategic_objectives_count INTEGER DEFAULT 0,
  key_initiatives TEXT,
  top_3_risks TEXT,
  executive_sponsor_org TEXT,
  executive_sponsor_customer TEXT,
  next_qbr_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_plan_account ON cs.success_plan(account_id);

-- Tasks (Layer 14)
CREATE TABLE IF NOT EXISTS cs.task (
  task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  owner TEXT,
  due_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'overdue', 'blocked')),
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  linked_risk_id UUID REFERENCES cs.risk_register(risk_id),
  linked_initiative_id UUID REFERENCES cs.initiative(initiative_id),
  source TEXT,
  external_task_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_task_account ON cs.task(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_task_status ON cs.task(status);

-- Generated Insights (Layer 15)
CREATE TABLE IF NOT EXISTS cs.generated_insight (
  insight_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES cs.account_master(account_id) ON DELETE CASCADE,
  csm TEXT,
  insight_text TEXT NOT NULL,
  recommended_action TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('new', 'acknowledged', 'actioned', 'dismissed')),
  date_generated TIMESTAMPTZ DEFAULT NOW(),
  linked_metric_id UUID REFERENCES cs.platform_health_metric(metric_id),
  linked_risk_id UUID REFERENCES cs.risk_register(risk_id),
  linked_initiative_id UUID REFERENCES cs.initiative(initiative_id),
  linked_objective_id UUID REFERENCES cs.strategic_objective(objective_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_insight_account ON cs.generated_insight(account_id);
CREATE INDEX IF NOT EXISTS idx_cs_insight_status ON cs.generated_insight(status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE cs.account_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.people_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.business_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.strategic_objective ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.capability ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.value_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.api_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.platform_health_metric ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.initiative ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.risk_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.stakeholder_outcome ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.engagement_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.success_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.task ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs.generated_insight ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "service_role_cs_all" ON cs.account_master FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_people" ON cs.people_team FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_context" ON cs.business_context FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_objective" ON cs.strategic_objective FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_cap" ON cs.capability FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_vs" ON cs.value_stream FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_api" ON cs.api_portfolio FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_metric" ON cs.platform_health_metric FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_init" ON cs.initiative FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_risk" ON cs.risk_register FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_outcome" ON cs.stakeholder_outcome FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_engagement" ON cs.engagement_log FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_plan" ON cs.success_plan FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_task" ON cs.task FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cs_insight" ON cs.generated_insight FOR ALL TO service_role USING (true);

-- Authenticated user policies
CREATE POLICY "auth_cs_read" ON cs.account_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_people_read" ON cs.people_team FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_context_read" ON cs.business_context FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_objective_read" ON cs.strategic_objective FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_cap_read" ON cs.capability FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_vs_read" ON cs.value_stream FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_api_read" ON cs.api_portfolio FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_metric_read" ON cs.platform_health_metric FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_init_read" ON cs.initiative FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_risk_read" ON cs.risk_register FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_outcome_read" ON cs.stakeholder_outcome FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_engagement_read" ON cs.engagement_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_plan_read" ON cs.success_plan FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_task_read" ON cs.task FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cs_insight_read" ON cs.generated_insight FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Account health overview
CREATE OR REPLACE VIEW cs.account_health_overview AS
  SELECT 
    am.account_id,
    am.account_name,
    am.health_score,
    am.health_status,
    am.renewal_date,
    am.renewal_days,
    am.arr,
    am.csm_name,
    COUNT(DISTINCT r.risk_id) as open_risks,
    COUNT(DISTINCT i.initiative_id) as active_initiatives,
    COUNT(DISTINCT t.task_id) as open_tasks
  FROM cs.account_master am
  LEFT JOIN cs.risk_register r ON am.account_id = r.account_id AND r.status = 'open'
  LEFT JOIN cs.initiative i ON am.account_id = i.account_id AND i.status = 'active'
  LEFT JOIN cs.task t ON am.account_id = t.account_id AND t.status IN ('open', 'in_progress')
  GROUP BY am.account_id, am.account_name, am.health_score, am.health_status, 
           am.renewal_date, am.renewal_days, am.arr, am.csm_name;

-- At-risk accounts
CREATE OR REPLACE VIEW cs.at_risk_accounts AS
  SELECT 
    account_id,
    account_name,
    health_score,
    health_status,
    renewal_date,
    renewal_days,
    arr,
    csm_name
  FROM cs.account_master
  WHERE health_score < 70
  ORDER BY health_score ASC;

-- Renewal pipeline
CREATE OR REPLACE VIEW cs.renewal_pipeline AS
  SELECT 
    account_id,
    account_name,
    arr,
    renewal_date,
    renewal_days,
    health_score,
    csm_name,
    CASE 
      WHEN renewal_days <= 30 THEN 'critical'
      WHEN renewal_days <= 60 THEN 'high'
      WHEN renewal_days <= 90 THEN 'medium'
      ELSE 'low'
    END as urgency
  FROM cs.account_master
  WHERE renewal_date IS NOT NULL
  ORDER BY renewal_date ASC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION cs.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER cs_account_updated_at BEFORE UPDATE ON cs.account_master FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_people_updated_at BEFORE UPDATE ON cs.people_team FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_context_updated_at BEFORE UPDATE ON cs.business_context FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_objective_updated_at BEFORE UPDATE ON cs.strategic_objective FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_cap_updated_at BEFORE UPDATE ON cs.capability FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_vs_updated_at BEFORE UPDATE ON cs.value_stream FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_api_updated_at BEFORE UPDATE ON cs.api_portfolio FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_metric_updated_at BEFORE UPDATE ON cs.platform_health_metric FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_init_updated_at BEFORE UPDATE ON cs.initiative FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_risk_updated_at BEFORE UPDATE ON cs.risk_register FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_outcome_updated_at BEFORE UPDATE ON cs.stakeholder_outcome FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_engagement_updated_at BEFORE UPDATE ON cs.engagement_log FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_plan_updated_at BEFORE UPDATE ON cs.success_plan FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_task_updated_at BEFORE UPDATE ON cs.task FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();
CREATE TRIGGER cs_insight_updated_at BEFORE UPDATE ON cs.generated_insight FOR EACH ROW EXECUTE FUNCTION cs.update_updated_at();

COMMENT ON SCHEMA cs IS 'Account Success: 15-layer intelligence schema';
