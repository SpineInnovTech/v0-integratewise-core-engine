-- Schema Update: Account Success + Business Intelligence
-- Adds constitutional properties and missing tables
-- Version: 2.0 — May 29, 2026

-- ============================================================================
-- 1. ADD CONSTITUTIONAL PROPERTIES TO EXISTING TABLES
-- ============================================================================

-- conversational_memory: Add promotion flow columns
ALTER TABLE memory.conversational_memory 
  ADD COLUMN IF NOT EXISTS promotion_status TEXT DEFAULT 'not_promoted'
    CHECK (promotion_status IN ('not_promoted', 'recommended', 'approved', 'promoted_to_personal', 'promoted_to_org')),
  ADD COLUMN IF NOT EXISTS promoted_to TEXT,
  ADD COLUMN IF NOT EXISTS promoted_id UUID,
  ADD COLUMN IF NOT EXISTS promotion_decided_by TEXT,
  ADD COLUMN IF NOT EXISTS promotion_decided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS importance_score NUMERIC(3,2) DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT;

-- org_memory: Add entity linking
ALTER TABLE memory.org_memory
  ADD COLUMN IF NOT EXISTS related_entity_ids JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS related_departments TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS access_scope TEXT DEFAULT 'org',
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) DEFAULT 0.8,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT;

-- triage_results: Add tenant_id and entity linking
ALTER TABLE triage_results
  ADD COLUMN IF NOT EXISTS tenant_id UUID,
  ADD COLUMN IF NOT EXISTS related_entity_ids JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS resolved_entity_id UUID,
  ADD COLUMN IF NOT EXISTS governance_decision_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT,
  ADD COLUMN IF NOT EXISTS agent_id TEXT DEFAULT 'triage_bot',
  ADD COLUMN IF NOT EXISTS agent_version TEXT,
  ADD COLUMN IF NOT EXISTS resolution_status TEXT DEFAULT 'open'
    CHECK (resolution_status IN ('open', 'assigned', 'in_progress', 'resolved', 'dismissed')),
  ADD COLUMN IF NOT EXISTS resolved_by TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS promoted_to_org_memory UUID,
  ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ;

-- triage_actions: Add actor_type and governance link
ALTER TABLE triage_actions
  ADD COLUMN IF NOT EXISTS tenant_id UUID,
  ADD COLUMN IF NOT EXISTS governance_decision_id UUID,
  ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'user'
    CHECK (actor_type IN ('user', 'agent', 'system')),
  ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT 'success'
    CHECK (outcome IN ('success', 'failed', 'partial')),
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT;

-- ============================================================================
-- 2. ACCOUNT SUCCESS TABLES — Add constitutional properties
-- ============================================================================

-- people_team
ALTER TABLE cs.people_team
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT;

-- business_context
ALTER TABLE cs.business_context
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT;

-- strategic_objective
ALTER TABLE cs.strategic_objective
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT,
  ADD COLUMN IF NOT EXISTS platform_relevance JSONB DEFAULT '{}';

-- capability
ALTER TABLE cs.capability
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT;

-- value_stream
ALTER TABLE cs.value_stream
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT;

-- api_portfolio
ALTER TABLE cs.api_portfolio
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT;

-- platform_health_metric
ALTER TABLE cs.platform_health_metric
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT;

-- initiative
ALTER TABLE cs.initiative
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT,
  ADD COLUMN IF NOT EXISTS platform_services_usd NUMERIC(15,2);

-- stakeholder_outcome
ALTER TABLE cs.stakeholder_outcome
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT;

-- engagement_log
ALTER TABLE cs.engagement_log
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT,
  ADD COLUMN IF NOT EXISTS attendees_org TEXT;

-- success_plan
ALTER TABLE cs.success_plan
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT,
  ADD COLUMN IF NOT EXISTS executive_sponsor_org TEXT;

-- task
ALTER TABLE cs.task
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT,
  ADD COLUMN IF NOT EXISTS governance_decision_id UUID,
  ADD COLUMN IF NOT EXISTS assignee_agent_id TEXT;

-- generated_insight
ALTER TABLE cs.generated_insight
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS lineage_ref TEXT,
  ADD COLUMN IF NOT EXISTS model_used TEXT,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS evidence TEXT[];

-- ============================================================================
-- 3. CREATE MISSING CONSTITUTIONAL TABLES
-- ============================================================================

-- Personal Memory (Layer 5)
CREATE TABLE IF NOT EXISTS memory.personal_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'preference', 'behavior', 'context', 'decision', 'note', 'bookmark'
  )),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pm_tenant_user_idx ON memory.personal_memory(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS pm_category_idx ON memory.personal_memory(category);
CREATE INDEX IF NOT EXISTS pm_embedding_idx ON memory.personal_memory
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ar_tenant_idx ON public.agent_registry(tenant_id);
CREATE INDEX IF NOT EXISTS ar_agent_type_idx ON public.agent_registry(agent_type);
CREATE INDEX IF NOT EXISTS ar_status_idx ON public.agent_registry(status);

-- Governance Decisions
CREATE TABLE IF NOT EXISTS public.governance_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'approval', 'rejection', 'promotion', 'classification', 'policy', 'escalation'
  )),
  source_type TEXT NOT NULL CHECK (source_type IN ('user', 'agent', 'system')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  reasoning TEXT,
  evidence JSONB DEFAULT '[]',
  decided_by TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lineage_ref TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gd_tenant_idx ON public.governance_decisions(tenant_id);
CREATE INDEX IF NOT EXISTS gd_decision_type_idx ON public.governance_decisions(decision_type);
CREATE INDEX IF NOT EXISTS gd_target_idx ON public.governance_decisions(target_type, target_id);
CREATE INDEX IF NOT EXISTS gd_decided_at_idx ON public.governance_decisions(decided_at DESC);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lr_tenant_idx ON public.lineage_records(tenant_id);
CREATE INDEX IF NOT EXISTS lr_entity_idx ON public.lineage_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS lr_actor_idx ON public.lineage_records(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS lr_created_idx ON public.lineage_records(created_at DESC);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, canonical_id)
);

CREATE INDEX IF NOT EXISTS er_tenant_idx ON public.entity_registry(tenant_id);
CREATE INDEX IF NOT EXISTS er_entity_type_idx ON public.entity_registry(entity_type);
CREATE INDEX IF NOT EXISTS er_canonical_idx ON public.entity_registry(canonical_id);
CREATE INDEX IF NOT EXISTS er_source_idx ON public.entity_registry(source_system, source_id);

-- Entity Relationships
CREATE TABLE IF NOT EXISTS public.entity_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source_entity_id UUID NOT NULL REFERENCES public.entity_registry(id),
  target_entity_id UUID NOT NULL REFERENCES public.entity_registry(id),
  relationship_type TEXT NOT NULL,
  strength NUMERIC(3,2) DEFAULT 1.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, source_entity_id, target_entity_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS erel_tenant_idx ON public.entity_relationships(tenant_id);
CREATE INDEX IF NOT EXISTS erel_source_idx ON public.entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS erel_target_idx ON public.entity_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS erel_type_idx ON public.entity_relationships(relationship_type);

-- Agent Sessions (for agent memory)
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS as_tenant_agent_idx ON public.agent_sessions(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS as_created_idx ON public.agent_sessions(created_at DESC);

-- Agent Memory (learned patterns)
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
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS am_tenant_agent_idx ON public.agent_memory(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS am_memory_type_idx ON public.agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS am_key_idx ON public.agent_memory(key);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE memory.personal_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "service_role_pm_full" ON memory.personal_memory
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_ar_full" ON public.agent_registry
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_gd_full" ON public.governance_decisions
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_lr_full" ON public.lineage_records
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_er_full" ON public.entity_registry
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_erel_full" ON public.entity_relationships
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_as_full" ON public.agent_sessions
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_am_full" ON public.agent_memory
  TO service_role USING (true) WITH CHECK (true);

-- Authenticated user policies
CREATE POLICY "auth_pm_read_own" ON memory.personal_memory
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth_gd_read" ON public.governance_decisions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_lr_read" ON public.lineage_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_er_read" ON public.entity_registry
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_erel_read" ON public.entity_relationships
  FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 5. VIEWS
-- ============================================================================

-- Active agents view
CREATE OR REPLACE VIEW public.active_agents AS
  SELECT id, tenant_id, agent_id, agent_type, name, status, last_heartbeat
  FROM public.agent_registry
  WHERE status = 'active'
  ORDER BY last_heartbeat DESC;

-- Recent governance decisions
CREATE OR REPLACE VIEW public.recent_governance AS
  SELECT id, tenant_id, decision_type, source_type, source_id, 
         target_type, target_id, decision, decided_by, decided_at
  FROM public.governance_decisions
  ORDER BY decided_at DESC
  LIMIT 100;

-- Entity graph view
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
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER agent_registry_updated_at
  BEFORE UPDATE ON public.agent_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER entity_registry_updated_at
  BEFORE UPDATE ON public.entity_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER entity_relationships_updated_at
  BEFORE UPDATE ON public.entity_relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER agent_memory_updated_at
  BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Promote conversational memory to org
CREATE OR REPLACE FUNCTION memory.promote_conversational_to_org(
  p_conversation_id UUID,
  p_promoted_by TEXT,
  p_topic TEXT,
  p_category TEXT
) RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_conv memory.conversational_memory%ROWTYPE;
BEGIN
  -- Get the conversational memory
  SELECT * INTO v_conv FROM memory.conversational_memory WHERE id = p_conversation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversational memory not found';
  END IF;

  -- Create org memory entry
  INSERT INTO memory.org_memory (
    tenant_id, topic, category, content, 
    source_session_id, governance_state, created_at
  ) VALUES (
    v_conv.tenant_id, p_topic, p_category, v_conv.content,
    v_conv.session_id, 'staging', NOW()
  ) RETURNING id INTO v_org_id;

  -- Update conversational memory promotion status
  UPDATE memory.conversational_memory
  SET promotion_status = 'promoted_to_org',
      promoted_to = 'org_memory',
      promoted_id = v_org_id,
      promotion_decided_by = p_promoted_by,
      promotion_decided_at = NOW()
  WHERE id = p_conversation_id;

  -- Record lineage
  INSERT INTO public.lineage_records (
    tenant_id, entity_type, entity_id, action,
    actor_type, actor_id, source, reasoning
  ) VALUES (
    v_conv.tenant_id, 'conversational_memory', p_conversation_id, 'promote',
    'user', p_promoted_by, 'promotion_function',
    'Promoted conversational memory to organizational memory'
  );

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA memory IS 'Memory layer: conversational, organizational, personal';
COMMENT ON TABLE public.agent_registry IS 'Registry of all agents in the system';
COMMENT ON TABLE public.governance_decisions IS 'All governance decisions with lineage';
COMMENT ON TABLE public.lineage_records IS 'Complete lineage trail for all mutations';
COMMENT ON TABLE public.entity_registry IS 'Canonical entity registry';
COMMENT ON TABLE public.entity_relationships IS 'Entity relationship graph';
