-- Business Intelligence Schema
-- Cross-department metrics, analytics, and executive views
-- Version: 1.0 — May 29, 2026

-- ============================================================================
-- 1. BI SCHEMA
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS bi;

-- ============================================================================
-- 2. CROSS-DEPARTMENT METRICS
-- ============================================================================

-- Department Health
CREATE TABLE IF NOT EXISTS bi.department_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  department TEXT NOT NULL,
  health_score NUMERIC(5,2),
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
  key_metrics JSONB DEFAULT '{}',
  at_risk_items INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dh_tenant_dept_idx ON bi.department_health(tenant_id, department);

-- Executive Dashboard Metrics
CREATE TABLE IF NOT EXISTS bi.executive_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL,
  current_value NUMERIC(15,2),
  target_value NUMERIC(15,2),
  unit TEXT,
  trend TEXT,
  period TEXT,
  source TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS em_tenant_idx ON bi.executive_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS em_category_idx ON bi.executive_metrics(metric_category);

-- Cross-Department Signals
CREATE TABLE IF NOT EXISTS bi.cross_department_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  signal_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  source_department TEXT,
  affected_departments TEXT[],
  entity_type TEXT,
  entity_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cds_tenant_idx ON bi.cross_department_signals(tenant_id);
CREATE INDEX IF NOT EXISTS cds_severity_idx ON bi.cross_department_signals(severity);
CREATE INDEX IF NOT EXISTS cds_status_idx ON bi.cross_department_signals(status);

-- ============================================================================
-- 3. DEPARTMENT-SPECIFIC BI TABLES
-- ============================================================================

-- Marketing BI
CREATE TABLE IF NOT EXISTS bi.marketing_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  period TEXT NOT NULL,
  mql_count INTEGER DEFAULT 0,
  sql_count INTEGER DEFAULT 0,
  pipeline_sourced NUMERIC(15,2) DEFAULT 0,
  cpl NUMERIC(10,2),
  conversion_rate NUMERIC(5,2),
  content_published INTEGER DEFAULT 0,
  social_reach INTEGER DEFAULT 0,
  email_open_rate NUMERIC(5,2),
  campaign_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mm_tenant_period_idx ON bi.marketing_metrics(tenant_id, period);

-- Sales BI
CREATE TABLE IF NOT EXISTS bi.sales_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  period TEXT NOT NULL,
  pipeline_value NUMERIC(15,2) DEFAULT 0,
  closed_won NUMERIC(15,2) DEFAULT 0,
  closed_lost NUMERIC(15,2) DEFAULT 0,
  win_rate NUMERIC(5,2),
  avg_deal_size NUMERIC(15,2),
  sales_velocity NUMERIC(10,2),
  avg_cycle_days INTEGER,
  new_deals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sm_tenant_period_idx ON bi.sales_metrics(tenant_id, period);

-- Customer Success BI
CREATE TABLE IF NOT EXISTS bi.cs_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  period TEXT NOT NULL,
  total_arr NUMERIC(15,2) DEFAULT 0,
  at_risk_arr NUMERIC(15,2) DEFAULT 0,
  avg_health_score NUMERIC(5,2),
  renewals_90d INTEGER DEFAULT 0,
  renewals_90d_value NUMERIC(15,2) DEFAULT 0,
  nps NUMERIC(5,2),
  csat NUMERIC(5,2),
  churn_rate NUMERIC(5,2),
  expansion_revenue NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS csm_tenant_period_idx ON bi.cs_metrics(tenant_id, period);

-- Product BI
CREATE TABLE IF NOT EXISTS bi.product_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  period TEXT NOT NULL,
  features_shipped INTEGER DEFAULT 0,
  features_in_progress INTEGER DEFAULT 0,
  sprint_velocity NUMERIC(10,2),
  adoption_rate NUMERIC(5,2),
  tech_debt_items INTEGER DEFAULT 0,
  bug_count INTEGER DEFAULT 0,
  uptime NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pm_tenant_period_idx ON bi.product_metrics(tenant_id, period);

-- ============================================================================
-- 4. FOUNDER OPS
-- ============================================================================

-- Founder Dashboard
CREATE TABLE IF NOT EXISTS bi.founder_dashboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  kpi_name TEXT NOT NULL,
  kpi_value NUMERIC(15,2),
  kpi_unit TEXT,
  trend TEXT,
  period TEXT,
  source TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fd_tenant_idx ON bi.founder_dashboard(tenant_id);

-- Strategic Decisions
CREATE TABLE IF NOT EXISTS bi.strategic_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  decision_title TEXT NOT NULL,
  decision_context TEXT,
  options_considered JSONB DEFAULT '[]',
  chosen_option TEXT,
  reasoning TEXT,
  decided_by TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'reversed')),
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sd_tenant_idx ON bi.strategic_decisions(tenant_id);
CREATE INDEX IF NOT EXISTS sd_decided_at_idx ON bi.strategic_decisions(decided_at DESC);

-- ============================================================================
-- 5. RLS
-- ============================================================================

ALTER TABLE bi.department_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.executive_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.cross_department_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.sales_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.cs_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.product_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.founder_dashboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.strategic_decisions ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "service_role_dh" ON bi.department_health FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_em" ON bi.executive_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_cds" ON bi.cross_department_signals FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_mm" ON bi.marketing_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_sm" ON bi.sales_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_csm" ON bi.cs_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_pm" ON bi.product_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_fd" ON bi.founder_dashboard FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_sd" ON bi.strategic_decisions FOR ALL TO service_role USING (true);

-- Authenticated read policies
CREATE POLICY "auth_dh_read" ON bi.department_health FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_em_read" ON bi.executive_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_cds_read" ON bi.cross_department_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_fd_read" ON bi.founder_dashboard FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_sd_read" ON bi.strategic_decisions FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 6. VIEWS
-- ============================================================================

-- Department overview
CREATE OR REPLACE VIEW bi.department_overview AS
  SELECT 
    dh.department,
    dh.health_score,
    dh.trend,
    dh.at_risk_items,
    dh.key_metrics,
    dh.last_updated
  FROM bi.department_health dh
  ORDER BY dh.health_score ASC;

-- Executive summary
CREATE OR REPLACE VIEW bi.executive_summary AS
  SELECT 
    metric_name,
    metric_category,
    current_value,
    target_value,
    unit,
    trend,
    period,
    CASE 
      WHEN current_value >= target_value THEN 'on_track'
      WHEN current_value >= target_value * 0.8 THEN 'at_risk'
      ELSE 'behind'
    END as status
  FROM bi.executive_metrics
  ORDER BY metric_category, metric_name;

-- Active signals
CREATE OR REPLACE VIEW bi.active_signals AS
  SELECT 
    id,
    signal_type,
    severity,
    title,
    description,
    source_department,
    affected_departments,
    created_at
  FROM bi.cross_department_signals
  WHERE status = 'active'
  ORDER BY 
    CASE severity 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      WHEN 'low' THEN 4 
    END,
    created_at DESC;

COMMENT ON SCHEMA bi IS 'Business Intelligence: cross-department metrics and executive views';
