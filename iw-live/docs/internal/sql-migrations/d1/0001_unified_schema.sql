-- ============================================================================
-- IntegrateWise Unified D1 (SQLite) Schema Migration
-- Database: integratewise-spine-prod
-- Architecture: v3.6 (LOCKED)
-- Created: February 28, 2026
--
-- Consolidates all tables from 9 core Cloudflare Workers + 5 support services
-- into a single D1 database for atomic transactions and consistency.
--
-- ALL tables require tenant_id for multi-tenancy isolation.
-- ============================================================================

-- ============================================================================
-- SECTION 1: GATEWAY SERVICE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT,
  entity_type TEXT,
  entity_id TEXT,
  payload TEXT DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'archived')),
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT
);

CREATE TABLE IF NOT EXISTS normalization_errors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_id TEXT,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  payload TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved INTEGER DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 2: SPINE V2 SERVICE (5 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS spine_entity_core (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  category TEXT,
  scope TEXT,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spine_entity_attributes (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL REFERENCES spine_entity_core(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  attribute_key TEXT NOT NULL,
  attribute_value TEXT,
  attribute_type TEXT,
  is_required INTEGER DEFAULT 0,
  is_indexed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spine_entity_layers (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL REFERENCES spine_entity_core(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  layer_level INTEGER NOT NULL,
  layer_name TEXT,
  completeness_score REAL DEFAULT 0.0,
  field_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spine_entity_completeness (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL REFERENCES spine_entity_core(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  entity_type TEXT,
  layer_level INTEGER,
  fields_present INTEGER DEFAULT 0,
  fields_expected INTEGER DEFAULT 0,
  completeness_score REAL DEFAULT 0.0,
  missing_required TEXT DEFAULT '[]',
  missing_expected TEXT DEFAULT '[]',
  last_calculated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spine_schema_registry (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  entity_type TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_path TEXT,
  data_type TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),
  occurrence_count INTEGER DEFAULT 1,
  sample_value TEXT,
  first_seen_at TEXT DEFAULT (datetime('now')),
  last_seen_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 3: COGNITIVE BRAIN SERVICE (15 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS decision_memory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_params TEXT DEFAULT '{}',
  context_snapshot TEXT DEFAULT '{}',
  evidence_ids TEXT DEFAULT '[]',
  actual_reason TEXT,
  alternatives_considered TEXT DEFAULT '[]',
  confidence_at_decision REAL,
  trust_score_at_decision REAL,
  autonomy_level_at_decision INTEGER,
  policy_snapshot TEXT DEFAULT '{}',
  evidence_timestamp TEXT,
  was_correct TEXT CHECK (was_correct IN ('correct', 'incorrect', 'partial', NULL)),
  feedback_reason TEXT,
  feedback_at TEXT,
  decided_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decision_patterns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  pattern_key TEXT UNIQUE,
  pattern_description TEXT,
  success_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0.0,
  confidence_level REAL DEFAULT 0.5,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trust_scores (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  composite_score REAL DEFAULT 0.5 CHECK (composite_score >= 0 AND composite_score <= 1),
  base_autonomy_level INTEGER DEFAULT 1 CHECK (base_autonomy_level >= 0 AND base_autonomy_level <= 3),
  historical_accuracy REAL DEFAULT 0.5,
  reliability_multiplier REAL DEFAULT 1.0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS source_reliability (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('system', 'integration', 'user_input', 'inference')),
  reliability_score REAL DEFAULT 0.5 CHECK (reliability_score >= 0 AND reliability_score <= 1),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'degraded', 'deprecated')),
  accuracy_count INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  last_updated_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS simulation_models (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  domain TEXT,
  entity_type TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_type TEXT,
  parameters TEXT DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'training', 'deprecated')),
  accuracy REAL,
  last_training_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS simulation_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_params TEXT DEFAULT '{}',
  context_snapshot TEXT DEFAULT '{}',
  context_timestamp TEXT,
  simulation_type TEXT CHECK (simulation_type IN ('quick', 'standard', 'deep')),
  monte_carlo_runs INTEGER DEFAULT 100,
  time_horizon_days INTEGER DEFAULT 30,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outcome_predictions (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL REFERENCES simulation_requests(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  scenario_name TEXT,
  win_probability REAL CHECK (win_probability >= 0 AND win_probability <= 1),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
  expected_value REAL,
  key_factors TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS model_beliefs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  attribute_name TEXT NOT NULL,
  believed_value TEXT,
  believed_type TEXT CHECK (believed_type IN ('point', 'range', 'categorical', 'probability')),
  confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
  evidence_quality TEXT CHECK (evidence_quality IN ('strong', 'moderate', 'weak', 'inferred')),
  source_type TEXT,
  source_id TEXT,
  valid_from TEXT DEFAULT (datetime('now')),
  valid_until TEXT
);

CREATE TABLE IF NOT EXISTS reality_observations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  attribute_name TEXT NOT NULL,
  observed_value TEXT,
  observation_source TEXT,
  observation_confidence REAL DEFAULT 1.0 CHECK (observation_confidence >= 0 AND observation_confidence <= 1),
  processed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS drift_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  attribute_name TEXT NOT NULL,
  model_belief_id TEXT REFERENCES model_beliefs(id) ON DELETE SET NULL,
  believed_value TEXT,
  observed_value TEXT,
  drift_magnitude REAL CHECK (drift_magnitude >= 0 AND drift_magnitude <= 1),
  drift_type TEXT CHECK (drift_type IN ('sudden_shift', 'gradual_drift')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  response_action TEXT,
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'resolved', 'ignored')),
  resolved_by TEXT,
  resolution_notes TEXT,
  resolved_at TEXT,
  detected_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS readiness_adjustments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  adjustment_type TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  trigger_type TEXT,
  trigger_id TEXT,
  is_reversible INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'reversed', 'expired')),
  reversed_at TEXT,
  reversed_by_adjustment_id TEXT,
  reversal_reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS autonomy_overrides (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  override_level TEXT NOT NULL CHECK (override_level IN ('global', 'entity_type', 'entity')),
  entity_type TEXT,
  entity_id TEXT,
  max_autonomy_level INTEGER CHECK (max_autonomy_level >= 0 AND max_autonomy_level <= 3),
  reason TEXT NOT NULL,
  expires_at TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 4: THINK SERVICE (6 tables, 3 shared with other services)
-- ============================================================================

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  signal_key TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metric_value REAL,
  band TEXT CHECK (band IN ('critical', 'warning', 'good')),
  evidence_ref_ids TEXT DEFAULT '[]',
  computed_at TEXT DEFAULT (datetime('now')),
  correlation_id TEXT
);

CREATE TABLE IF NOT EXISTS situations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  situation_key TEXT NOT NULL,
  signal_ids TEXT DEFAULT '[]',
  title TEXT,
  summary TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  evidence_ref_ids TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS action_proposals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  situation_id TEXT REFERENCES situations(id) ON DELETE CASCADE,
  proposal_rank INTEGER,
  action_type TEXT NOT NULL,
  autonomy_level INTEGER CHECK (autonomy_level >= 0 AND autonomy_level <= 3),
  confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  parameters TEXT DEFAULT '{}',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  executed_at TEXT
);

CREATE TABLE IF NOT EXISTS evidence_refs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_plane TEXT,
  source_type TEXT,
  source_id TEXT,
  tool_name TEXT,
  display_label TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  actor_id TEXT,
  actor_type TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_session_memories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT,
  memory_type TEXT,
  content TEXT,
  importance REAL DEFAULT 0.5,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 5: ACT SERVICE (3 tables, 2 shared)
-- ============================================================================

CREATE TABLE IF NOT EXISTS action_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  action_proposal_id TEXT REFERENCES action_proposals(id) ON DELETE SET NULL,
  decision_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
  started_at TEXT,
  completed_at TEXT,
  result TEXT DEFAULT '{}',
  error_details TEXT,
  retry_count INTEGER DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- audit_logs and action_proposals are shared with Think service

-- ============================================================================
-- SECTION 6: KNOWLEDGE SERVICE (8 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  file_id TEXT,
  chunk_index INTEGER,
  chunk_content TEXT NOT NULL,
  chunk_tokens INTEGER,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chunk_embeddings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  chunk_id TEXT REFERENCES document_chunks(id) ON DELETE CASCADE,
  embedding TEXT,
  embedding_model TEXT,
  embedding_tokens INTEGER,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS file_embeddings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  file_id TEXT,
  version_id TEXT,
  chunk_index INTEGER,
  chunk_content TEXT,
  embedding TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session_embeddings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  session_summary TEXT,
  embedding TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT,
  metadata TEXT DEFAULT '{}',
  source TEXT,
  source_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS file_versions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS search_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  query TEXT NOT NULL,
  search_type TEXT CHECK (search_type IN ('vector', 'keyword', 'hybrid')),
  result_count INTEGER,
  top_score REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 7: NORMALIZER SERVICE (4 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canonical_entities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  external_id TEXT,
  display_name TEXT,
  source_system TEXT,
  merged_into_id TEXT,
  is_canonical INTEGER DEFAULT 1,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canonical_versions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  canonical_id TEXT NOT NULL REFERENCES canonical_entities(id) ON DELETE CASCADE,
  version_number INTEGER DEFAULT 1,
  attributes TEXT DEFAULT '{}',
  source_trace TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS entity_merges (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_entity_id TEXT NOT NULL REFERENCES canonical_entities(id) ON DELETE CASCADE,
  target_entity_id TEXT NOT NULL REFERENCES canonical_entities(id) ON DELETE CASCADE,
  merge_reason TEXT,
  merge_confidence REAL DEFAULT 0.8 CHECK (merge_confidence >= 0 AND merge_confidence <= 1),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  result TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 8: MCP CONNECTOR SERVICE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_entity_links (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  link_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spine_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT,
  payload TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 9: GOVERN SERVICE (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS governance_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  policy_name TEXT NOT NULL UNIQUE,
  description TEXT,
  policy_type TEXT CHECK (policy_type IN ('action', 'data', 'autonomy')),
  rules TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS governance_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  policy_id TEXT REFERENCES governance_policies(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  condition TEXT,
  action TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  requires_approval INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS governance_audit_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  rule_id TEXT REFERENCES governance_rules(id) ON DELETE SET NULL,
  action_type TEXT,
  decision TEXT CHECK (decision IN ('allowed', 'denied', 'needs_approval')),
  decision_reason TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 10: LOADER SERVICE (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS processed_fingerprints (
  fingerprint TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source TEXT NOT NULL,
  entity_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  session_type TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 11: STORE SERVICE (1 table - shared with Knowledge)
-- ============================================================================

-- files table already defined in Section 6 (Knowledge Service)

-- ============================================================================
-- SECTION 12: IQ HUB SERVICE (5 tables, 3 shared)
-- ============================================================================

-- ai_conversations, ai_messages, ai_memories, ai_session_summaries, ai_session_memories
-- defined earlier in corresponding service sections

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT,
  provider TEXT DEFAULT 'system' CHECK (provider IN ('chatgpt', 'claude', 'system', 'mcp')),
  context_type TEXT,
  context_id TEXT,
  message_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  summary TEXT,
  topics TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  started_at TEXT DEFAULT (datetime('now')),
  ended_at TEXT,
  expires_at TEXT DEFAULT (datetime('now', '+30 days')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  tool_calls TEXT DEFAULT '[]',
  tool_call_id TEXT,
  tool_results TEXT,
  metadata TEXT DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_memories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  conversation_id TEXT REFERENCES ai_conversations(id) ON DELETE SET NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('decision', 'preference', 'insight', 'action', 'rule', 'fact')),
  content TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  context_type TEXT,
  context_id TEXT,
  confidence REAL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT DEFAULT 'ai_extracted' CHECK (source IN ('ai_extracted', 'user_confirmed', 'system')),
  is_confirmed INTEGER DEFAULT 0,
  confirmed_by TEXT,
  confirmed_at TEXT,
  importance REAL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  expires_at TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_session_summaries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  conversation_id TEXT REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  title TEXT NOT NULL,
  summary_md TEXT NOT NULL,
  topics TEXT DEFAULT '[]',
  tool_calls TEXT DEFAULT '[]',
  memories_extracted INTEGER DEFAULT 0,
  artifact_uri TEXT,
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
  context_type TEXT,
  context_id TEXT,
  key_points TEXT DEFAULT '[]',
  decisions TEXT DEFAULT '[]',
  action_items TEXT DEFAULT '[]',
  created_by TEXT,
  metadata TEXT DEFAULT '{}',
  expires_at TEXT DEFAULT (datetime('now', '+30 days')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 13: AGENTS SERVICE (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_colony_runs (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  task_objective TEXT NOT NULL,
  task_context TEXT DEFAULT '{}',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  plan TEXT DEFAULT '{}',
  results TEXT DEFAULT '{}',
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  total_tokens_used INTEGER DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- ============================================================================
-- SECTION 14: WORKFLOW SERVICE (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_recommendations (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  signal_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('action', 'insight', 'alert')),
  title TEXT NOT NULL,
  description TEXT,
  action_data TEXT DEFAULT '{}',
  confidence INTEGER DEFAULT 0,
  evidence TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto-approved', 'expired')),
  approved_by TEXT,
  rejected_by TEXT,
  comments TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  approved_at TEXT,
  rejected_at TEXT
);

-- ============================================================================
-- SECTION 15: MEMORY CONSOLIDATOR SERVICE (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS consolidated_memories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  consolidation_type TEXT NOT NULL CHECK (consolidation_type IN ('topic', 'user', 'account', 'pattern')),
  topic TEXT,
  user_id TEXT,
  account_id TEXT,
  summary TEXT NOT NULL,
  key_insights TEXT DEFAULT '[]',
  recurring_themes TEXT DEFAULT '[]',
  action_patterns TEXT DEFAULT '[]',
  session_count INTEGER DEFAULT 0,
  time_range_start TEXT NOT NULL,
  time_range_end TEXT NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('normal', 'elevated', 'high', 'critical')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consolidation_runs (
  id TEXT PRIMARY KEY,
  run_type TEXT NOT NULL CHECK (run_type IN ('hourly', 'daily', 'weekly')),
  tenant_id TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  sessions_processed INTEGER DEFAULT 0,
  memories_created INTEGER DEFAULT 0,
  memories_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  last_error TEXT,
  duration_ms INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memory_links (
  id TEXT PRIMARY KEY,
  source_memory_id TEXT NOT NULL REFERENCES consolidated_memories(id) ON DELETE CASCADE,
  target_memory_id TEXT NOT NULL REFERENCES consolidated_memories(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('related', 'supersedes', 'derives_from', 'contradicts')),
  strength REAL DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 16: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Gateway Service Indexes
CREATE INDEX IF NOT EXISTS idx_events_tenant ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_normalization_errors_tenant ON normalization_errors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_normalization_errors_severity ON normalization_errors(severity);

-- Spine Service Indexes
CREATE INDEX IF NOT EXISTS idx_spine_entity_core_tenant ON spine_entity_core(tenant_id);
CREATE INDEX IF NOT EXISTS idx_spine_entity_core_type ON spine_entity_core(entity_type);
CREATE INDEX IF NOT EXISTS idx_spine_entity_attributes_entity ON spine_entity_attributes(entity_id);
CREATE INDEX IF NOT EXISTS idx_spine_entity_attributes_tenant ON spine_entity_attributes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_spine_entity_completeness_entity ON spine_entity_completeness(entity_id);
CREATE INDEX IF NOT EXISTS idx_spine_entity_completeness_tenant ON spine_entity_completeness(tenant_id);
CREATE INDEX IF NOT EXISTS idx_spine_schema_registry_entity_type ON spine_schema_registry(entity_type);
CREATE INDEX IF NOT EXISTS idx_spine_schema_registry_field ON spine_schema_registry(field_key);

-- Cognitive Brain Indexes
CREATE INDEX IF NOT EXISTS idx_decision_memory_tenant ON decision_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decision_memory_entity ON decision_memory(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_decision_memory_action ON decision_memory(action_type);
CREATE INDEX IF NOT EXISTS idx_decision_memory_correct ON decision_memory(was_correct);
CREATE INDEX IF NOT EXISTS idx_decision_patterns_tenant ON decision_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decision_patterns_active ON decision_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_trust_scores_tenant ON trust_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_entity ON trust_scores(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_source_reliability_tenant ON source_reliability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_source_reliability_status ON source_reliability(status);
CREATE INDEX IF NOT EXISTS idx_simulation_requests_tenant ON simulation_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_simulation_requests_status ON simulation_requests(status);
CREATE INDEX IF NOT EXISTS idx_outcome_predictions_simulation ON outcome_predictions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_model_beliefs_tenant ON model_beliefs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_beliefs_entity ON model_beliefs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reality_observations_tenant ON reality_observations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reality_observations_processed ON reality_observations(processed);
CREATE INDEX IF NOT EXISTS idx_drift_events_tenant ON drift_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drift_events_severity ON drift_events(severity);
CREATE INDEX IF NOT EXISTS idx_drift_events_status ON drift_events(response_status);
CREATE INDEX IF NOT EXISTS idx_readiness_adjustments_tenant ON readiness_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_readiness_adjustments_reversible ON readiness_adjustments(is_reversible, status);
CREATE INDEX IF NOT EXISTS idx_autonomy_overrides_tenant ON autonomy_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_overrides_active ON autonomy_overrides(expires_at) WHERE expires_at IS NULL OR expires_at > datetime('now');

-- Think Service Indexes
CREATE INDEX IF NOT EXISTS idx_signals_tenant ON signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signals_entity ON signals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_situations_tenant ON situations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_situations_created ON situations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_proposals_tenant ON action_proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_action_proposals_situation ON action_proposals(situation_id);
CREATE INDEX IF NOT EXISTS idx_action_proposals_status ON action_proposals(status);
CREATE INDEX IF NOT EXISTS idx_evidence_refs_tenant ON evidence_refs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Act Service Indexes
CREATE INDEX IF NOT EXISTS idx_action_runs_tenant ON action_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_action_runs_status ON action_runs(status);
CREATE INDEX IF NOT EXISTS idx_action_runs_idempotency ON action_runs(idempotency_key);

-- Knowledge Service Indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_tenant ON document_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_file ON document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_chunk ON chunk_embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_tenant ON session_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_session ON session_embeddings(session_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_tenant ON embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source, source_id);
CREATE INDEX IF NOT EXISTS idx_files_tenant ON files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_file ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_search_history_tenant ON search_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- Normalizer Service Indexes
CREATE INDEX IF NOT EXISTS idx_canonical_entities_tenant ON canonical_entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_canonical_entities_type ON canonical_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_canonical_entities_canonical ON canonical_entities(is_canonical);
CREATE INDEX IF NOT EXISTS idx_canonical_versions_canonical ON canonical_versions(canonical_id);
CREATE INDEX IF NOT EXISTS idx_entity_merges_tenant ON entity_merges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant ON idempotency_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys(expires_at);

-- MCP Connector Indexes
CREATE INDEX IF NOT EXISTS idx_session_entity_links_tenant ON session_entity_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_session_entity_links_session ON session_entity_links(session_id);
CREATE INDEX IF NOT EXISTS idx_session_entity_links_entity ON session_entity_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_spine_events_tenant ON spine_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_spine_events_type ON spine_events(event_type);

-- Govern Service Indexes
CREATE INDEX IF NOT EXISTS idx_governance_policies_tenant ON governance_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_policies_status ON governance_policies(status);
CREATE INDEX IF NOT EXISTS idx_governance_rules_policy ON governance_rules(policy_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_log_tenant ON governance_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_log_rule ON governance_audit_log(rule_id);

-- Loader Service Indexes
CREATE INDEX IF NOT EXISTS idx_processed_fingerprints_tenant ON processed_fingerprints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_tenant ON ai_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON ai_sessions(status);

-- IQ Hub Service Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context ON ai_conversations(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_expires ON ai_conversations(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_tenant ON ai_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_tenant ON ai_memories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_conversation ON ai_memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_entity ON ai_memories(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_type ON ai_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_memories_expires ON ai_memories(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_session_summaries_tenant ON ai_session_summaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_session_summaries_conversation ON ai_session_summaries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_session_summaries_expires ON ai_session_summaries(expires_at);

-- Agents Service Indexes
CREATE INDEX IF NOT EXISTS idx_agent_colony_runs_tenant ON agent_colony_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_colony_runs_status ON agent_colony_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_colony_runs_created ON agent_colony_runs(created_at DESC);

-- Workflow Service Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_recommendations_tenant ON workflow_recommendations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_recommendations_user ON workflow_recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_recommendations_instance ON workflow_recommendations(instance_id);

-- Memory Consolidator Indexes
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_tenant ON consolidated_memories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_type ON consolidated_memories(consolidation_type);
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_topic ON consolidated_memories(topic) WHERE topic IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_user ON consolidated_memories(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_account ON consolidated_memories(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_created ON consolidated_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_risk ON consolidated_memories(risk_level) WHERE risk_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_time_range ON consolidated_memories(tenant_id, consolidation_type, created_at);
CREATE INDEX IF NOT EXISTS idx_consolidation_runs_type ON consolidation_runs(run_type);
CREATE INDEX IF NOT EXISTS idx_consolidation_runs_tenant ON consolidation_runs(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consolidation_runs_status ON consolidation_runs(status);
CREATE INDEX IF NOT EXISTS idx_consolidation_runs_started ON consolidation_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_memory_links_source ON memory_links(source_memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_links_target ON memory_links(target_memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_links_type ON memory_links(link_type);

-- ============================================================================
-- COMPOSITE INDEXES FOR MULTI-TENANT QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_decision_memory_tenant_action ON decision_memory(tenant_id, action_type, was_correct);
CREATE INDEX IF NOT EXISTS idx_signals_tenant_band ON signals(tenant_id, band);
CREATE INDEX IF NOT EXISTS idx_action_proposals_tenant_situation ON action_proposals(tenant_id, situation_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant_user_created ON ai_conversations(tenant_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_tenant_type_created ON consolidated_memories(tenant_id, consolidation_type, created_at DESC);

-- ============================================================================
-- UNIQUE CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_idempotency ON idempotency_keys(tenant_id, key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_canonical_external ON canonical_entities(tenant_id, entity_type, external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_governance_policy_name ON governance_policies(tenant_id, policy_name);

-- ============================================================================
-- MIGRATION METADATA (OPTIONAL)
-- ============================================================================

-- Uncomment if tracking migrations in D1:
-- CREATE TABLE IF NOT EXISTS schema_migrations (
--   version INTEGER PRIMARY KEY,
--   description TEXT NOT NULL,
--   executed_at TEXT DEFAULT (datetime('now'))
-- );
-- INSERT INTO schema_migrations (version, description) VALUES (1, 'unified_schema');

-- ============================================================================
-- SECTION X: NEWSLETTER & CONTACT MANAGEMENT (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at DESC);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  inquiry_type TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON contact_submissions(submitted_at DESC);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_email TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'bug', 'feature', 'billing', 'technical')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_status ON support_tickets(tenant_id, status);

-- ============================================================================
-- SECTION XI: Billing — Product SKUs, Payment Transactions, Subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_skus (
  id TEXT PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL,
  billing_type TEXT NOT NULL,
  billing_interval TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_price_id TEXT,
  razorpay_plan_id TEXT,
  features TEXT,
  limits TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_skus_code ON product_skus(product_code);
CREATE INDEX IF NOT EXISTS idx_product_skus_tier ON product_skus(tier);
CREATE INDEX IF NOT EXISTS idx_product_skus_status ON product_skus(status);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku_id TEXT NOT NULL,
  gateway TEXT NOT NULL,
  gateway_session_id TEXT,
  gateway_payment_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_session ON payment_transactions(gateway_session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON payment_transactions(created_at);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  activated_at TEXT NOT NULL,
  expires_at TEXT,
  cancelled_at TEXT,
  gateway TEXT,
  gateway_subscription_id TEXT,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_activated_at ON tenant_subscriptions(activated_at);

-- ─── Seed Product SKUs ───
INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order) VALUES
  ('sku_free_001', 'IW-FREE-001', 'IntegrateWise Free', 'Basic integration intelligence', 'free', 'recurring', 'monthly', 0, 'usd', '["3_connectors","personal_workspace","basic_spine","community_support"]', '{"connectors":3,"users":1,"storage_mb":100,"api_calls_month":1000}', 1),
  ('sku_starter_m', 'IW-STARTER-M', 'IntegrateWise Starter (Monthly)', 'For individuals and small teams', 'starter', 'recurring', 'monthly', 2900, 'usd', '["10_connectors","personal_work_workspace","full_spine","email_support","basic_ai","5_accelerators"]', '{"connectors":10,"users":3,"storage_mb":1000,"api_calls_month":10000}', 2),
  ('sku_starter_y', 'IW-STARTER-Y', 'IntegrateWise Starter (Yearly)', 'Save 20% annually', 'starter', 'recurring', 'yearly', 27900, 'usd', '["10_connectors","personal_work_workspace","full_spine","email_support","basic_ai","5_accelerators"]', '{"connectors":10,"users":3,"storage_mb":1000,"api_calls_month":10000}', 3),
  ('sku_pro_m', 'IW-PRO-M', 'IntegrateWise Professional (Monthly)', 'Full intelligence capabilities', 'professional', 'recurring', 'monthly', 7900, 'usd', '["25_connectors","all_workspaces","full_spine","full_ai","brainstorm","entity_360","progressive_hydration","priority_support","unlimited_accelerators","governance"]', '{"connectors":25,"users":10,"storage_mb":10000,"api_calls_month":100000}', 4),
  ('sku_pro_y', 'IW-PRO-Y', 'IntegrateWise Professional (Yearly)', 'Save 20% annually', 'professional', 'recurring', 'yearly', 76900, 'usd', '["25_connectors","all_workspaces","full_spine","full_ai","brainstorm","entity_360","progressive_hydration","priority_support","unlimited_accelerators","governance"]', '{"connectors":25,"users":10,"storage_mb":10000,"api_calls_month":100000}', 5),
  ('sku_enterprise', 'IW-ENT-001', 'IntegrateWise Enterprise', 'Custom deployment', 'enterprise', 'recurring', 'yearly', 0, 'usd', '["unlimited_connectors","all_workspaces","full_spine","full_ai","brainstorm","entity_360","progressive_hydration","dedicated_support","sla","custom_integrations","sso","audit_logs","compliance"]', '{"connectors":-1,"users":-1,"storage_mb":-1,"api_calls_month":-1}', 6),
  ('sku_acc_csm', 'IW-ACC-CSM', 'CSM Playbook Accelerator', 'Pre-built CS workflows', 'addon', 'one_time', NULL, 4900, 'usd', '["csm_playbook","qbr_templates","renewal_workflows","health_score_models"]', '{}', 10),
  ('sku_acc_sales', 'IW-ACC-SALES', 'Sales Pipeline Accelerator', 'Pipeline templates and forecasting', 'addon', 'one_time', NULL, 4900, 'usd', '["pipeline_templates","email_sequences","forecast_models","deal_scoring"]', '{}', 11),
  ('sku_acc_revops', 'IW-ACC-REVOPS', 'RevOps Analytics Accelerator', 'Revenue dashboards and territory maps', 'addon', 'one_time', NULL, 7900, 'usd', '["revenue_dashboards","quota_tracking","territory_maps","attribution_models"]', '{}', 12),
  ('sku_acc_marketing', 'IW-ACC-MKTG', 'Marketing Campaigns Accelerator', 'Campaign templates and lead scoring', 'addon', 'one_time', NULL, 4900, 'usd', '["campaign_templates","attribution_models","lead_scoring","content_calendar"]', '{}', 13),
  ('sku_starter_m_inr', 'IW-STARTER-M-INR', 'IntegrateWise Starter (Monthly INR)', 'India pricing', 'starter', 'recurring', 'monthly', 199900, 'inr', '["10_connectors","personal_work_workspace","full_spine","email_support","basic_ai","5_accelerators"]', '{"connectors":10,"users":3,"storage_mb":1000,"api_calls_month":10000}', 20),
  ('sku_pro_m_inr', 'IW-PRO-M-INR', 'IntegrateWise Professional (Monthly INR)', 'India pricing', 'professional', 'recurring', 'monthly', 599900, 'inr', '["25_connectors","all_workspaces","full_spine","full_ai","brainstorm","entity_360","progressive_hydration","priority_support","unlimited_accelerators","governance"]', '{"connectors":25,"users":10,"storage_mb":10000,"api_calls_month":100000}', 21);

-- ============================================================================
-- SECTION XII: MCP Connector — KB Artifacts & Topic Policies (for D1 queries)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_artifacts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  type TEXT,
  topics TEXT,
  relevance_score REAL DEFAULT 0,
  source_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kb_artifacts_tenant ON kb_artifacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_artifacts_type ON kb_artifacts(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_kb_artifacts_created ON kb_artifacts(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS kb_topic_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cadence TEXT DEFAULT 'daily',
  hourly_opt_in INTEGER DEFAULT 0,
  last_synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_kb_topic_policies_tenant ON kb_topic_policies(tenant_id);

-- ============================================================================
-- End of Unified D1 Migration
-- ============================================================================
