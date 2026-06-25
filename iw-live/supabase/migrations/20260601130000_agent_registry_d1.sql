-- ============================================================================
-- IntegrateWise — Agent Registry D1 Schema (Read-only Mirror)
-- Version: 1.0 — June 1, 2026
-- Database: Cloudflare D1
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_registry (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL UNIQUE,
  agent_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  capabilities TEXT,
  can_read TEXT,
  can_write TEXT,
  can_execute INTEGER DEFAULT 0,
  requires_approval INTEGER DEFAULT 1,
  config TEXT,
  last_heartbeat TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_agent_type ON agent_registry(agent_type);
CREATE INDEX IF NOT EXISTS idx_d1_agent_status ON agent_registry(status);

CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  input_data TEXT,
  output_data TEXT,
  status TEXT DEFAULT 'success',
  duration_ms INTEGER,
  policies_checked TEXT,
  approval_required INTEGER DEFAULT 0,
  approved_by TEXT,
  approved_at TEXT,
  lineage_id TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_d1_session_agent ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_d1_session_created ON agent_sessions(created_at);

-- Seed default agents
INSERT OR IGNORE INTO agent_registry (id, agent_id, agent_type, name, description, capabilities, can_read, can_write, can_execute, requires_approval, status) VALUES
('1', 'triage-bot', 'governance', 'Triage Bot', 'Memory scoring engine. Sole writer to org_memory.', '["score_proposals", "write_org_memory", "classify_content"]', '["organisational", "conversational"]', '["organisational"]', 0, 0, 'active'),
('2', 'twin', 'cognition', 'Twin', 'AI reasoning engine (Hermes-powered).', '["generate_proposals", "generate_insights", "assemble_context", "skill_reasoning", "model_orchestration"]', '["personal", "organisational", "conversational"]', '[]', 0, 1, 'active'),
('3', 'agent-zero', 'external', 'Agent Zero', 'External agent. Reads via MCP. Proposes via governance.', '["read_org_memory", "propose_actions"]', '["organisational"]', '[]', 1, 1, 'active');
