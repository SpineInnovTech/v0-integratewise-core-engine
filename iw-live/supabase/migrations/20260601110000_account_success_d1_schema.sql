-- ============================================================================
-- IntegrateWise — Account Success D1 Schema (Read-only Mirror)
-- Version: 1.0 — June 1, 2026
-- Database: Cloudflare D1
-- ============================================================================

-- Account Master (Layer 1)
CREATE TABLE IF NOT EXISTS cs_account_master (
  account_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  industry TEXT,
  segment TEXT,
  region TEXT,
  arr REAL DEFAULT 0,
  mrr REAL DEFAULT 0,
  health_score REAL DEFAULT 50,
  health_status TEXT,
  renewal_date TEXT,
  renewal_days INTEGER,
  owner_id TEXT,
  owner_name TEXT,
  csm_id TEXT,
  csm_name TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_account_tenant ON cs_account_master(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_cs_account_health ON cs_account_master(health_score);

-- People/Team (Layer 2)
CREATE TABLE IF NOT EXISTS cs_people_team (
  person_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  department TEXT,
  region TEXT,
  active_status INTEGER DEFAULT 1,
  accounts_assigned INTEGER DEFAULT 0,
  total_arr_managed REAL DEFAULT 0,
  avg_health_score REAL,
  at_risk_count INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_people_tenant ON cs_people_team(tenant_id);

-- Business Context (Layer 3)
CREATE TABLE IF NOT EXISTS cs_business_context (
  context_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  business_model TEXT,
  market_position TEXT,
  operating_environment TEXT,
  key_challenges TEXT,
  digital_maturity TEXT,
  it_complexity_score REAL,
  cloud_strategy TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_context_account ON cs_business_context(account_id);

-- Strategic Objectives (Layer 4)
CREATE TABLE IF NOT EXISTS cs_strategic_objective (
  objective_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  strategic_pillar TEXT,
  objective_name TEXT NOT NULL,
  description TEXT,
  quantified_goal TEXT,
  target_date TEXT,
  business_owner TEXT,
  business_value_usd REAL,
  status TEXT DEFAULT 'on_track',
  progress_percent REAL DEFAULT 0,
  health_indicator TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_obj_account ON cs_strategic_objective(account_id);

-- Capabilities (Layer 5)
CREATE TABLE IF NOT EXISTS cs_capability (
  capability_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  capability_domain TEXT,
  capability_name TEXT NOT NULL,
  description TEXT,
  current_maturity TEXT,
  target_maturity TEXT,
  maturity_gap TEXT,
  gap_status TEXT,
  investment_required REAL,
  priority TEXT,
  implementation_status TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_cap_account ON cs_capability(account_id);

-- Value Streams (Layer 6)
CREATE TABLE IF NOT EXISTS cs_value_stream (
  stream_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  value_stream_name TEXT NOT NULL,
  business_process TEXT,
  process_owner TEXT,
  integration_endpoints INTEGER DEFAULT 0,
  apis_consumed INTEGER DEFAULT 0,
  annual_transaction_volume INTEGER DEFAULT 0,
  cycle_time_baseline_hours REAL,
  cycle_time_current_hours REAL,
  cycle_time_target_hours REAL,
  total_business_value REAL DEFAULT 0,
  operational_risk_level TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_vs_account ON cs_value_stream(account_id);

-- API Portfolio (Layer 7)
CREATE TABLE IF NOT EXISTS cs_api_portfolio (
  api_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  api_name TEXT NOT NULL,
  api_type TEXT,
  api_version TEXT,
  business_capability TEXT,
  environment TEXT,
  monthly_transactions INTEGER DEFAULT 0,
  avg_response_time_ms REAL,
  sla_compliance_percent REAL,
  error_rate_percent REAL,
  uptime_percent REAL,
  business_criticality TEXT,
  health_status TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_api_account ON cs_api_portfolio(account_id);

-- Platform Health Metrics (Layer 8)
CREATE TABLE IF NOT EXISTS cs_platform_health_metric (
  metric_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  metric_category TEXT,
  metric_name TEXT NOT NULL,
  metric_type TEXT,
  current_value REAL,
  target_value REAL,
  threshold_warning REAL,
  threshold_critical REAL,
  unit TEXT,
  health_status TEXT,
  trend_is_good INTEGER,
  last_measured TEXT,
  data_source TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_metric_account ON cs_platform_health_metric(account_id);

-- Initiatives (Layer 9)
CREATE TABLE IF NOT EXISTS cs_initiative (
  initiative_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  initiative_name TEXT NOT NULL,
  initiative_type TEXT,
  business_driver TEXT,
  priority TEXT,
  phase TEXT,
  status TEXT DEFAULT 'active',
  start_date TEXT,
  target_completion_date TEXT,
  actual_completion_date TEXT,
  days_overdue INTEGER DEFAULT 0,
  investment_amount_usd REAL DEFAULT 0,
  expected_annual_benefit REAL DEFAULT 0,
  success_criteria TEXT,
  owner_org TEXT,
  owner_customer TEXT,
  blockers TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_init_account ON cs_initiative(account_id);

-- Risk Register (Layer 10)
CREATE TABLE IF NOT EXISTS cs_risk_register (
  risk_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  risk_category TEXT,
  risk_title TEXT NOT NULL,
  description TEXT,
  impact TEXT,
  impact_score INTEGER,
  probability TEXT,
  probability_score INTEGER,
  risk_score INTEGER,
  risk_level TEXT,
  mitigation_strategy TEXT,
  mitigation_owner TEXT,
  target_resolution_date TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_risk_account ON cs_risk_register(account_id);

-- Stakeholder Outcomes (Layer 11)
CREATE TABLE IF NOT EXISTS cs_stakeholder_outcome (
  outcome_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  stakeholder_type TEXT,
  stakeholder_name TEXT,
  outcome_statement TEXT NOT NULL,
  success_metric_name TEXT,
  baseline_value REAL,
  current_value REAL,
  target_value REAL,
  unit TEXT,
  target_achievement_percent REAL,
  status TEXT DEFAULT 'on_track',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_outcome_account ON cs_stakeholder_outcome(account_id);

-- Engagement Log (Layer 12)
CREATE TABLE IF NOT EXISTS cs_engagement_log (
  engagement_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  engagement_date TEXT NOT NULL,
  engagement_type TEXT,
  attendees_org TEXT,
  attendees_customer TEXT,
  customer_seniority TEXT,
  topics_discussed TEXT,
  action_items TEXT,
  sentiment TEXT,
  relationship_depth_score REAL,
  next_steps TEXT,
  next_engagement_date TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_engagement_account ON cs_engagement_log(account_id);

-- Success Plans (Layer 13)
CREATE TABLE IF NOT EXISTS cs_success_plan (
  success_plan_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  executive_summary TEXT,
  plan_period TEXT,
  plan_status TEXT DEFAULT 'active',
  strategic_objectives_count INTEGER DEFAULT 0,
  key_initiatives TEXT,
  top_3_risks TEXT,
  executive_sponsor_org TEXT,
  executive_sponsor_customer TEXT,
  next_qbr_date TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_plan_account ON cs_success_plan(account_id);

-- Tasks (Layer 14)
CREATE TABLE IF NOT EXISTS cs_task (
  task_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT,
  task_name TEXT NOT NULL,
  owner TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT,
  linked_risk_id TEXT,
  linked_initiative_id TEXT,
  source TEXT,
  external_task_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_task_account ON cs_task(account_id);
CREATE INDEX IF NOT EXISTS idx_d1_cs_task_status ON cs_task(status);

-- Generated Insights (Layer 15)
CREATE TABLE IF NOT EXISTS cs_generated_insight (
  insight_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  csm TEXT,
  insight_text TEXT NOT NULL,
  recommended_action TEXT,
  status TEXT DEFAULT 'pending',
  date_generated TEXT,
  linked_metric_id TEXT,
  linked_risk_id TEXT,
  linked_initiative_id TEXT,
  linked_objective_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_insight_account ON cs_generated_insight(account_id);
CREATE INDEX IF NOT EXISTS idx_d1_cs_insight_status ON cs_generated_insight(status);
