-- ============================================================================
-- IntegrateWise — D1 Schema (Read-only Spine Mirror)
-- Version: 1.0 — May 29, 2026
-- Database: Cloudflare D1 (read-only mirror of Supabase)
-- ============================================================================

-- D1 mirrors Supabase tables for edge reads
-- All writes go through Pipeline → Supabase → D1 sync

-- ============================================================================
-- 1. ACCOUNT SUCCESS TABLES (D1 Mirror)
-- ============================================================================

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
  owner_mulesoft TEXT,
  owner_customer TEXT,
  blockers TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_cs_init_account ON cs_initiative(account_id);

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

-- ============================================================================
-- 2. BUSINESS INTELLIGENCE TABLES (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bi_department_health (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  department TEXT NOT NULL,
  health_score REAL,
  trend TEXT,
  key_metrics TEXT,
  at_risk_items INTEGER DEFAULT 0,
  last_updated TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_bi_dept_tenant ON bi_department_health(tenant_id);

CREATE TABLE IF NOT EXISTS bi_executive_metrics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL,
  current_value REAL,
  target_value REAL,
  unit TEXT,
  trend TEXT,
  period TEXT,
  updated_at TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_bi_metrics_tenant ON bi_executive_metrics(tenant_id);

CREATE TABLE IF NOT EXISTS bi_cross_department_signals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  severity TEXT,
  title TEXT NOT NULL,
  description TEXT,
  source_department TEXT,
  affected_departments TEXT,
  entity_type TEXT,
  entity_id TEXT,
  status TEXT DEFAULT 'active',
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_bi_signal_tenant ON bi_cross_department_signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_bi_signal_severity ON bi_cross_department_signals(severity);

CREATE TABLE IF NOT EXISTS bi_founder_dashboard (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  kpi_name TEXT NOT NULL,
  kpi_value REAL,
  kpi_unit TEXT,
  trend TEXT,
  period TEXT,
  updated_at TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_bi_founder_tenant ON bi_founder_dashboard(tenant_id);

CREATE TABLE IF NOT EXISTS bi_strategic_decisions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  decision_title TEXT NOT NULL,
  decision_context TEXT,
  options_considered TEXT,
  chosen_option TEXT,
  reasoning TEXT,
  decided_by TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  outcome TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_bi_decision_tenant ON bi_strategic_decisions(tenant_id);

-- ============================================================================
-- 3. CONSTITUTIONAL TABLES (D1 Mirror)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_registry (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL UNIQUE,
  agent_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  capabilities TEXT,
  config TEXT,
  last_heartbeat TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_agent_tenant ON agent_registry(tenant_id);

CREATE TABLE IF NOT EXISTS governance_decisions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  reasoning TEXT,
  evidence TEXT,
  decided_by TEXT NOT NULL,
  decided_at TEXT,
  lineage_ref TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_governance_tenant ON governance_decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_governance_target ON governance_decisions(target_type, target_id);

CREATE TABLE IF NOT EXISTS lineage_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  source TEXT,
  before_state TEXT,
  after_state TEXT,
  reasoning TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_lineage_entity ON lineage_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_d1_lineage_tenant ON lineage_records(tenant_id);

CREATE TABLE IF NOT EXISTS entity_registry (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_subtype TEXT,
  canonical_id TEXT,
  source_system TEXT,
  source_id TEXT,
  status TEXT DEFAULT 'active',
  metadata TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_entity_tenant ON entity_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_d1_entity_type ON entity_registry(entity_type);

CREATE TABLE IF NOT EXISTS entity_relationships (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  strength REAL DEFAULT 1.0,
  metadata TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_rel_source ON entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_d1_rel_target ON entity_relationships(target_entity_id);

CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  action TEXT NOT NULL,
  input_data TEXT,
  output_data TEXT,
  status TEXT DEFAULT 'success',
  duration_ms INTEGER,
  metadata TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_session_agent ON agent_sessions(tenant_id, agent_id);

CREATE TABLE IF NOT EXISTS agent_memory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  last_used_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_memory_agent ON agent_memory(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_d1_memory_type ON agent_memory(memory_type);

-- ============================================================================
-- 4. SYNC STATE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_state (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_table TEXT NOT NULL,
  last_synced_at TEXT,
  last_synced_id TEXT,
  sync_status TEXT DEFAULT 'active',
  error_message TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_sync_source ON sync_state(source_table);
