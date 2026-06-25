-- ============================================================================
-- IntegrateWise — Account Success + Business Intelligence Schema
-- Version: 1.0 — May 29, 2026
-- Database: Supabase (Postgres)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ============================================================================
-- 1. ACCOUNT SUCCESS SCHEMA (cs.*)
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
  owner_mulesoft TEXT,
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
-- 2. BUSINESS INTELLIGENCE SCHEMA (bi.*)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS bi;

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

CREATE INDEX IF NOT EXISTS idx_bi_dept_tenant ON bi.department_health(tenant_id);

-- Executive Metrics
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_metrics_tenant ON bi.executive_metrics(tenant_id);

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

CREATE INDEX IF NOT EXISTS idx_bi_signal_tenant ON bi.cross_department_signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bi_signal_severity ON bi.cross_department_signals(severity);

-- Founder Dashboard
CREATE TABLE IF NOT EXISTS bi.founder_dashboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  kpi_name TEXT NOT NULL,
  kpi_value NUMERIC(15,2),
  kpi_unit TEXT,
  trend TEXT,
  period TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_founder_tenant ON bi.founder_dashboard(tenant_id);

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

CREATE INDEX IF NOT EXISTS idx_bi_decision_tenant ON bi.strategic_decisions(tenant_id);

-- ============================================================================
-- 3. CONSTITUTIONAL TABLES
-- ============================================================================

-- Agent Registry
CREATE TABLE IF NOT EXISTS public.agent_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  agent_id TEXT NOT NULL UNIQUE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('triage', 'twin', 'hermes', 'external', 'system')),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  capabilities JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tenant ON public.agent_registry(tenant_id);

-- Governance Decisions
CREATE TABLE IF NOT EXISTS public.governance_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('approval', 'rejection', 'promotion', 'classification', 'policy', 'escalation')),
  source_type TEXT NOT NULL CHECK (source_type IN ('user', 'agent', 'system')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  reasoning TEXT,
  evidence JSONB DEFAULT '[]',
  decided_by TEXT NOT NULL,
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  lineage_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governance_tenant ON public.governance_decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_target ON public.governance_decisions(target_type, target_id);

-- Lineage Records
CREATE TABLE IF NOT EXISTS public.lineage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'promote', 'approve', 'reject', 'archive')),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'agent', 'system')),
  actor_id TEXT NOT NULL,
  source TEXT,
  before_state JSONB,
  after_state JSONB,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lineage_entity ON public.lineage_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_lineage_tenant ON public.lineage_records(tenant_id);

-- Entity Registry
CREATE TABLE IF NOT EXISTS public.entity_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_subtype TEXT,
  canonical_id TEXT,
  source_system TEXT,
  source_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'merged', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, canonical_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_tenant ON public.entity_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entity_type ON public.entity_registry(entity_type);

-- Entity Relationships
CREATE TABLE IF NOT EXISTS public.entity_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source_entity_id UUID NOT NULL REFERENCES public.entity_registry(id),
  target_entity_id UUID NOT NULL REFERENCES public.entity_registry(id),
  relationship_type TEXT NOT NULL,
  strength NUMERIC(3,2) DEFAULT 1.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, source_entity_id, target_entity_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_rel_source ON public.entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON public.entity_relationships(target_entity_id);

-- Agent Sessions
CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  agent_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  action TEXT NOT NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_agent ON public.agent_sessions(tenant_id, agent_id);

-- Agent Memory
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  agent_id TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('pattern', 'preference', 'learning', 'error')),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_agent ON public.agent_memory(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_memory_type ON public.agent_memory(memory_type);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
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
ALTER TABLE bi.department_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.executive_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.cross_department_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.founder_dashboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi.strategic_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access)
CREATE POLICY "service_role_cs_all" ON cs.account_master FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_bi_all" ON bi.department_health FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_agent_all" ON public.agent_registry FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_governance_all" ON public.governance_decisions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_lineage_all" ON public.lineage_records FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_entity_all" ON public.entity_registry FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_rel_all" ON public.entity_relationships FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_session_all" ON public.agent_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_memory_all" ON public.agent_memory FOR ALL TO service_role USING (true);

-- Authenticated user policies (read access)
CREATE POLICY "auth_cs_read" ON cs.account_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_bi_read" ON bi.department_health FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_governance_read" ON public.governance_decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_lineage_read" ON public.lineage_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_entity_read" ON public.entity_registry FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 5. VIEWS
-- ============================================================================

-- Active agents
CREATE OR REPLACE VIEW public.active_agents AS
  SELECT id, tenant_id, agent_id, agent_type, name, status, last_heartbeat
  FROM public.agent_registry
  WHERE status = 'active'
  ORDER BY last_heartbeat DESC;

-- Recent governance decisions
CREATE OR REPLACE VIEW public.recent_governance AS
  SELECT id, tenant_id, decision_type, source_type, target_type, 
         target_id, decision, decided_by, decided_at
  FROM public.governance_decisions
  ORDER BY decided_at DESC
  LIMIT 100;

-- Entity graph
CREATE OR REPLACE VIEW public.entity_graph AS
  SELECT 
    er.id,
    er.tenant_id,
    er.entity_type,
    er.entity_name,
    er.status,
    COUNT(rel.id) as relationship_count
  FROM public.entity_registry er
  LEFT JOIN public.entity_relationships rel 
    ON er.id = rel.source_entity_id OR er.id = rel.target_entity_id
  GROUP BY er.id, er.tenant_id, er.entity_type, er.entity_name, er.status;

-- ============================================================================
-- 6. FUNCTIONS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER cs_account_updated_at BEFORE UPDATE ON cs.account_master FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cs_people_updated_at BEFORE UPDATE ON cs.people_team FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bi_signal_updated_at BEFORE UPDATE ON bi.cross_department_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER agent_updated_at BEFORE UPDATE ON public.agent_registry FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER entity_updated_at BEFORE UPDATE ON public.entity_registry FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER memory_updated_at BEFORE UPDATE ON public.agent_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON SCHEMA cs IS 'Account Success: 15-layer intelligence schema';
COMMENT ON SCHEMA bi IS 'Business Intelligence: cross-department metrics';
COMMENT ON TABLE public.agent_registry IS 'Registry of all agents in the system';
COMMENT ON TABLE public.governance_decisions IS 'All governance decisions with lineage';
COMMENT ON TABLE public.lineage_records IS 'Complete lineage trail for all mutations';
