-- ============================================================================
-- IntegrateWise — Agent Registry + Sessions
-- Version: 1.0 — June 1, 2026
-- Database: iw_spine (Postgres, public schema)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. AGENT REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('governance', 'cognition', 'external', 'system')),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  
  -- Capabilities (what the agent CAN do)
  capabilities JSONB DEFAULT '[]',
  
  -- Memory access
  can_read JSONB DEFAULT '[]',   -- ['personal', 'organisational', 'conversational']
  can_write JSONB DEFAULT '[]',  -- ['organisational'] for triage_bot only
  
  -- Execution
  can_execute BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  
  -- Config
  config JSONB DEFAULT '{}',
  
  -- Status
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_registry_type ON public.agent_registry(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_registry_status ON public.agent_registry(status);

-- ============================================================================
-- 2. AGENT SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES public.agent_registry(agent_id),
  action TEXT NOT NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  duration_ms INTEGER,
  
  -- Governance
  policies_checked JSONB DEFAULT '[]',
  approval_required BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  
  -- Lineage
  lineage_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent ON public.agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created ON public.agent_sessions(created_at DESC);

-- ============================================================================
-- 3. SEED DEFAULT AGENTS
-- ============================================================================

INSERT INTO public.agent_registry (agent_id, agent_type, name, description, capabilities, can_read, can_write, can_execute, requires_approval) VALUES
(
  'triage-bot',
  'governance',
  'Triage Bot',
  'Memory scoring engine. Sole writer to org_memory. Scores proposals and enforces governance.',
  '["score_proposals", "write_org_memory", "classify_content"]',
  '["organisational", "conversational"]',
  '["organisational"]',
  false,
  false
),
(
  'twin',
  'cognition',
  'Twin',
  'AI reasoning engine (Hermes-powered, skill-based, model-agnostic). Generates proposals and insights.',
  '["generate_proposals", "generate_insights", "assemble_context", "skill_reasoning", "model_orchestration"]',
  '["personal", "organisational", "conversational"]',
  '[]',
  false,
  true
),
(
  'agent-zero',
  'external',
  'Agent Zero',
  'External agent. Reads via MCP. Proposes via governance. User''s own agent.',
  '["read_org_memory", "propose_actions"]',
  '["organisational"]',
  '[]',
  true,
  true
)
ON CONFLICT (agent_id) DO NOTHING;

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_agent_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_registry_updated_at
  BEFORE UPDATE ON public.agent_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_agent_registry_updated_at();

-- Check agent permission (used by Governance Rail)
CREATE OR REPLACE FUNCTION public.check_agent_permission(
  p_agent_id TEXT,
  p_action TEXT,
  p_memory_layer TEXT DEFAULT NULL,
  p_mode TEXT DEFAULT 'read'
) RETURNS JSONB AS $$
DECLARE
  v_agent public.agent_registry%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Get agent
  SELECT * INTO v_agent FROM public.agent_registry WHERE agent_id = p_agent_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Agent not found or inactive');
  END IF;
  
  -- Check capabilities
  IF NOT (v_agent.capabilities ? p_action) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Agent lacks capability: ' || p_action);
  END IF;
  
  -- Check memory access
  IF p_memory_layer IS NOT NULL THEN
    IF p_mode = 'read' AND NOT (v_agent.can_read ? p_memory_layer) THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'Agent cannot read ' || p_memory_layer);
    END IF;
    IF p_mode = 'write' AND NOT (v_agent.can_write ? p_memory_layer) THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'Agent cannot write ' || p_memory_layer);
    END IF;
  END IF;
  
  -- Record the check
  INSERT INTO public.agent_sessions (agent_id, action, status, policies_checked)
  VALUES (p_agent_id, p_action, 'success', jsonb_build_array('capability_check', 'memory_access_check'));
  
  RETURN jsonb_build_object(
    'allowed', true,
    'requires_approval', v_agent.requires_approval,
    'can_execute', v_agent.can_execute
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. VIEWS
-- ============================================================================

-- Active agents
CREATE OR REPLACE VIEW public.active_agents AS
  SELECT agent_id, agent_type, name, status, capabilities, can_read, can_write, last_heartbeat
  FROM public.agent_registry
  WHERE status = 'active'
  ORDER BY agent_type, name;

-- Recent agent sessions
CREATE OR REPLACE VIEW public.recent_agent_sessions AS
  SELECT 
    s.id,
    s.agent_id,
    a.name as agent_name,
    a.agent_type,
    s.action,
    s.status,
    s.duration_ms,
    s.approval_required,
    s.approved_by,
    s.created_at
  FROM public.agent_sessions s
  JOIN public.agent_registry a ON s.agent_id = a.agent_id
  ORDER BY s.created_at DESC
  LIMIT 100;

-- ============================================================================
-- 6. RLS
-- ============================================================================

ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "service_role_agent_registry" ON public.agent_registry
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_agent_sessions" ON public.agent_sessions
  FOR ALL TO service_role USING (true);

-- Authenticated read policies
CREATE POLICY "auth_agent_registry_read" ON public.agent_registry
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_agent_sessions_read" ON public.agent_sessions
  FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE public.agent_registry IS 'Agent definitions with capabilities, memory access, and governance rules';
COMMENT ON TABLE public.agent_sessions IS 'Agent activity log with governance tracking';
COMMENT ON FUNCTION public.check_agent_permission IS 'Check if agent can perform action based on registry';
