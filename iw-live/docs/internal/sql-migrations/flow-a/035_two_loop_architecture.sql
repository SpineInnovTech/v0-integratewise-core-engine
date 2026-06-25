-- =====================================================================================
-- TWO-LOOP ARCHITECTURE: IntegrateWise V11.11
-- =====================================================================================
-- This migration implements the core Two-Loop Architecture:
--   LOOP A (Context-to-Truth): Human-governed context capture → actions → tools
--   LOOP B (Tool-to-Truth): System-governed loader → normalizer → spine (truth)
--   IQ HUB: Read-only join of Truth + Context
-- =====================================================================================
-- Date: January 21, 2026
-- Version: V11.11
-- =====================================================================================

-- =====================================================================================
-- SCHEMA SETUP
-- =====================================================================================
CREATE SCHEMA IF NOT EXISTS spine;
CREATE SCHEMA IF NOT EXISTS brainstorm;
CREATE SCHEMA IF NOT EXISTS loader;
CREATE SCHEMA IF NOT EXISTS iq_hub;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- LOOP B: SPINE (TRUTH STORE)
-- =====================================================================================
-- The Spine is the SINGLE SOURCE OF TRUTH for all verified, normalized data.
-- Data enters ONLY through the Loader → Normalizer pipeline (never direct writes).
-- =====================================================================================

-- --------------------------------------
-- SPINE: Organization (Master Account)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS spine.organization (
  spine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  
  -- Identity
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  legal_name VARCHAR(255),
  
  -- Classification
  industry VARCHAR(100),
  segment VARCHAR(50), -- 'enterprise', 'mid_market', 'smb', 'startup'
  region VARCHAR(50),
  
  -- Financials
  arr DECIMAL(15,2),
  mrr DECIMAL(15,2),
  contract_value DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Size
  employee_count INTEGER,
  license_count INTEGER,
  active_users INTEGER,
  
  -- Health & Status
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  health_status VARCHAR(20) CHECK (health_status IN ('champion', 'healthy', 'at_risk', 'critical')),
  lifecycle_stage VARCHAR(20) CHECK (lifecycle_stage IN ('prospect', 'onboarding', 'active', 'at_risk', 'churned')),
  
  -- Technical
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  technical_metrics JSONB DEFAULT '{}',
  mulesoft_org_id VARCHAR(100),
  
  -- Dates
  customer_since DATE,
  renewal_date DATE,
  last_qbr_date DATE,
  next_qbr_date DATE,
  churn_date DATE,
  
  -- Ownership
  primary_csm_id UUID,
  primary_tam_id UUID,
  sales_owner_id UUID,
  support_lead_id UUID,
  accounts_contact_id UUID,
  
  -- Cross-team
  account_team JSONB DEFAULT '[]',
  
  -- External IDs (sources JSONB for multi-source tracking)
  sources JSONB DEFAULT '[]', -- [{source_type, external_id, synced_at}]
  
  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::text[],
  custom_fields JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_spine_org_domain ON spine.organization(domain);
CREATE INDEX IF NOT EXISTS idx_spine_org_health ON spine.organization(health_score);
CREATE INDEX IF NOT EXISTS idx_spine_org_status ON spine.organization(health_status);
CREATE INDEX IF NOT EXISTS idx_spine_org_lifecycle ON spine.organization(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_spine_org_csm ON spine.organization(primary_csm_id);
CREATE INDEX IF NOT EXISTS idx_spine_org_tam ON spine.organization(primary_tam_id);
CREATE INDEX IF NOT EXISTS idx_spine_org_renewal ON spine.organization(renewal_date);
CREATE INDEX IF NOT EXISTS idx_spine_org_segment ON spine.organization(segment);
CREATE INDEX IF NOT EXISTS idx_spine_org_workspace ON spine.organization(workspace_id);
CREATE INDEX IF NOT EXISTS idx_spine_org_search ON spine.organization USING gin(to_tsvector('english', name || ' ' || COALESCE(domain, '')));
CREATE INDEX IF NOT EXISTS idx_spine_org_sources ON spine.organization USING gin(sources);

-- --------------------------------------
-- SPINE: Person (Contacts/Users)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS spine.person (
  spine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  
  -- Identity
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(255) GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  
  -- Internal linkage
  user_id UUID, -- References auth.users if internal user
  is_internal BOOLEAN DEFAULT false,
  
  -- Organization
  organization_id UUID REFERENCES spine.organization(spine_id),
  
  -- Professional
  job_title VARCHAR(255),
  department VARCHAR(100),
  seniority VARCHAR(50), -- 'c_level', 'vp', 'director', 'manager', 'individual_contributor'
  
  -- Relationship
  role_type VARCHAR(50), -- 'champion', 'decision_maker', 'influencer', 'user', 'blocker', 'economic_buyer'
  relationship_strength INTEGER CHECK (relationship_strength >= 1 AND relationship_strength <= 10),
  last_contacted_at TIMESTAMPTZ,
  
  -- Internal team (for employees)
  team VARCHAR(50), -- 'cs', 'tam', 'sales', 'support', 'accounts', 'proserv'
  team_role VARCHAR(50),
  
  -- External IDs
  sources JSONB DEFAULT '[]',
  
  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::text[],
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Person indexes
CREATE INDEX IF NOT EXISTS idx_spine_person_email ON spine.person(email);
CREATE INDEX IF NOT EXISTS idx_spine_person_org ON spine.person(organization_id);
CREATE INDEX IF NOT EXISTS idx_spine_person_role ON spine.person(role_type);
CREATE INDEX IF NOT EXISTS idx_spine_person_team ON spine.person(team);
CREATE INDEX IF NOT EXISTS idx_spine_person_workspace ON spine.person(workspace_id);
CREATE INDEX IF NOT EXISTS idx_spine_person_search ON spine.person USING gin(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, '')));

-- --------------------------------------
-- SPINE: Account Team (Cross-Team)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS spine.account_team (
  account_team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES spine.organization(spine_id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES spine.person(spine_id),
  
  team_role VARCHAR(50) NOT NULL, -- 'csm', 'tam', 'sales', 'support_lead', 'accounts', 'proserv'
  is_primary BOOLEAN DEFAULT false,
  permission_level VARCHAR(20) DEFAULT 'view', -- 'view', 'edit', 'admin'
  
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_spine_account_team_unique ON spine.account_team(organization_id, person_id, team_role);
CREATE INDEX IF NOT EXISTS idx_spine_account_team_org ON spine.account_team(organization_id);
CREATE INDEX IF NOT EXISTS idx_spine_account_team_person ON spine.account_team(person_id);

-- --------------------------------------
-- SPINE: Deal (Opportunities)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS spine.deal (
  spine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  organization_id UUID REFERENCES spine.organization(spine_id),
  
  -- Deal info
  name VARCHAR(255) NOT NULL,
  stage VARCHAR(50) DEFAULT 'discovery', -- 'discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
  
  -- Value
  amount DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  
  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Ownership
  owner_id UUID REFERENCES spine.person(spine_id),
  
  -- Type
  deal_type VARCHAR(50), -- 'new_business', 'expansion', 'renewal', 'upsell'
  
  -- External IDs
  sources JSONB DEFAULT '[]',
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spine_deal_org ON spine.deal(organization_id);
CREATE INDEX IF NOT EXISTS idx_spine_deal_stage ON spine.deal(stage);
CREATE INDEX IF NOT EXISTS idx_spine_deal_close ON spine.deal(expected_close_date);

-- --------------------------------------
-- SPINE: Ticket (Support Cases)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS spine.ticket (
  spine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  organization_id UUID REFERENCES spine.organization(spine_id),
  contact_id UUID REFERENCES spine.person(spine_id),
  
  -- Ticket info
  subject VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'pending', 'in_progress', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Classification
  category VARCHAR(100),
  subcategory VARCHAR(100),
  
  -- Assignment
  assigned_to UUID REFERENCES spine.person(spine_id),
  
  -- SLA
  sla_due_at TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  
  -- External IDs
  sources JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spine_ticket_org ON spine.ticket(organization_id);
CREATE INDEX IF NOT EXISTS idx_spine_ticket_status ON spine.ticket(status);
CREATE INDEX IF NOT EXISTS idx_spine_ticket_priority ON spine.ticket(priority);
CREATE INDEX IF NOT EXISTS idx_spine_ticket_assignee ON spine.ticket(assigned_to);

-- --------------------------------------
-- SPINE: Event (Activities/Interactions)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS spine.event (
  spine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  organization_id UUID REFERENCES spine.organization(spine_id),
  
  -- Event info
  event_type VARCHAR(50) NOT NULL, -- 'call', 'meeting', 'email', 'note', 'task', 'qbr', 'ebr'
  subject VARCHAR(500),
  description TEXT,
  
  -- Timing
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,
  
  -- Participants
  participants UUID[] DEFAULT ARRAY[]::uuid[],
  
  -- Related entities
  deal_id UUID REFERENCES spine.deal(spine_id),
  ticket_id UUID REFERENCES spine.ticket(spine_id),
  
  -- Actor
  created_by UUID,
  
  -- External IDs
  sources JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spine_event_org ON spine.event(organization_id);
CREATE INDEX IF NOT EXISTS idx_spine_event_type ON spine.event(event_type);
CREATE INDEX IF NOT EXISTS idx_spine_event_occurred ON spine.event(occurred_at DESC);

-- --------------------------------------
-- SPINE: Metric (Health/Usage Metrics)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS spine.metric (
  metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  organization_id UUID REFERENCES spine.organization(spine_id),
  
  -- Metric info
  metric_type VARCHAR(50) NOT NULL, -- 'adoption', 'usage', 'engagement', 'nps', 'csat', 'api_calls'
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_unit VARCHAR(50),
  
  -- Time
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  period VARCHAR(20), -- 'hourly', 'daily', 'weekly', 'monthly'
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spine_metric_org ON spine.metric(organization_id);
CREATE INDEX IF NOT EXISTS idx_spine_metric_type ON spine.metric(metric_type);
CREATE INDEX IF NOT EXISTS idx_spine_metric_measured ON spine.metric(measured_at DESC);

-- --------------------------------------
-- SPINE: Document (Files/Artifacts)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS spine.document (
  spine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  organization_id UUID REFERENCES spine.organization(spine_id),
  
  -- Document info
  title VARCHAR(500) NOT NULL,
  document_type VARCHAR(50), -- 'contract', 'sow', 'proposal', 'qbr_deck', 'technical_doc', 'support_doc'
  description TEXT,
  
  -- Storage
  file_url TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Version
  version VARCHAR(20) DEFAULT '1.0',
  is_current BOOLEAN DEFAULT true,
  
  -- Dates
  effective_date DATE,
  expiry_date DATE,
  
  -- External IDs
  sources JSONB DEFAULT '[]',
  
  -- Search
  content_text TEXT, -- Extracted text for search
  embedding VECTOR(1536),
  
  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::text[],
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spine_doc_org ON spine.document(organization_id);
CREATE INDEX IF NOT EXISTS idx_spine_doc_type ON spine.document(document_type);
CREATE INDEX IF NOT EXISTS idx_spine_doc_embedding ON spine.document USING ivfflat (embedding vector_cosine_ops);

-- =====================================================================================
-- LOOP A: BRAINSTORMING LAYER (CONTEXT STORE)
-- =====================================================================================
-- The Brainstorming Layer captures AI context for TRACEABILITY and TRIGGERS ACTIONS.
-- It NEVER writes directly to Spine. Context → Action → Tool → Loader → Normalizer → Spine.
-- =====================================================================================

-- --------------------------------------
-- BRAINSTORM: Session (AI Conversations)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS brainstorm.session (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  organization_id UUID REFERENCES spine.organization(spine_id), -- Optional account context
  user_id UUID NOT NULL,
  
  -- Session metadata
  title VARCHAR(255),
  session_type VARCHAR(50), -- 'strategy', 'problem_solving', 'planning', 'analysis', 'triage'
  
  -- Intake source (Loop A entry points)
  intake_source VARCHAR(50), -- 'slack', 'whatsapp', 'telegram', 'custom_gpt', 'web_chat', 'api'
  intake_channel_id VARCHAR(255), -- Channel/thread ID from source
  
  -- AI context
  model_used VARCHAR(50), -- 'gpt-4', 'claude-3', etc.
  total_tokens INTEGER,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Searchable summary
  summary TEXT,
  key_insights TEXT[],
  action_items TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'completed'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brainstorm_session_org ON brainstorm.session(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_brainstorm_session_user ON brainstorm.session(user_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_session_source ON brainstorm.session(intake_source);
CREATE INDEX IF NOT EXISTS idx_brainstorm_session_status ON brainstorm.session(status);

-- --------------------------------------
-- BRAINSTORM: Message (Conversation Messages)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS brainstorm.message (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES brainstorm.session(session_id) ON DELETE CASCADE,
  
  -- Message content
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  
  -- Vector embedding for semantic search
  embedding VECTOR(1536),
  
  -- Metadata
  tokens INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brainstorm_message_session ON brainstorm.message(session_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_message_embedding ON brainstorm.message USING ivfflat (embedding vector_cosine_ops);

-- --------------------------------------
-- BRAINSTORM: Insight (Extracted Learnings)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS brainstorm.insight (
  insight_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  organization_id UUID REFERENCES spine.organization(spine_id),
  session_id UUID REFERENCES brainstorm.session(session_id),
  
  -- Insight content
  insight_type VARCHAR(50), -- 'learning', 'pattern', 'recommendation', 'risk', 'opportunity'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Vector embedding
  embedding VECTOR(1536),
  
  -- Validation (human governance)
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  outcome VARCHAR(50), -- 'applied', 'rejected', 'pending'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brainstorm_insight_org ON brainstorm.insight(organization_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_insight_type ON brainstorm.insight(insight_type);
CREATE INDEX IF NOT EXISTS idx_brainstorm_insight_outcome ON brainstorm.insight(outcome);
CREATE INDEX IF NOT EXISTS idx_brainstorm_insight_embedding ON brainstorm.insight USING ivfflat (embedding vector_cosine_ops);

-- --------------------------------------
-- BRAINSTORM: Action (Bridge to Tools)
-- --------------------------------------
-- This is the CRITICAL bridge from Context → Tools.
-- Actions are the ONLY way Context can influence Truth.
-- Action → Tool update → Loader → Normalizer → Spine (Truth)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS brainstorm.action (
  action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  session_id UUID REFERENCES brainstorm.session(session_id),
  insight_id UUID REFERENCES brainstorm.insight(insight_id),
  
  -- Action details
  action_type VARCHAR(50) NOT NULL, -- 'create_task', 'update_crm', 'send_message', 'log_note', 'create_ticket'
  target_tool VARCHAR(50) NOT NULL, -- 'asana', 'salesforce', 'slack', 'notion', 'zendesk', 'hubspot'
  payload JSONB NOT NULL, -- Tool-specific action data
  
  -- Human governance
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Execution status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'executing', 'executed', 'failed', 'cancelled'
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Result tracking (links back to Spine once ingested)
  result_spine_id UUID, -- The spine record created/updated after tool sync
  result_type VARCHAR(50), -- 'organization', 'person', 'deal', 'ticket', 'event', 'document'
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brainstorm_action_status ON brainstorm.action(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_brainstorm_action_session ON brainstorm.action(session_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_action_tool ON brainstorm.action(target_tool);
CREATE INDEX IF NOT EXISTS idx_brainstorm_action_pending ON brainstorm.action(status) WHERE status IN ('pending', 'approved');

-- =====================================================================================
-- LOADER SCHEMA (Ingestion Pipeline)
-- =====================================================================================
-- The Loader captures raw data from external tools.
-- Data flows: Tool API/Webhook → Loader → Normalizer → Spine (Truth)
-- =====================================================================================

-- --------------------------------------
-- LOADER: Connector Config
-- --------------------------------------
CREATE TABLE IF NOT EXISTS loader.connector (
  connector_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  
  -- Connector info
  name VARCHAR(100) NOT NULL,
  connector_type VARCHAR(50) NOT NULL, -- 'salesforce', 'hubspot', 'zendesk', 'stripe', 'slack', 'asana'
  
  -- Auth (encrypted)
  auth_type VARCHAR(20), -- 'oauth2', 'api_key', 'basic'
  credentials JSONB DEFAULT '{}', -- Encrypted credentials
  
  -- Sync config
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency VARCHAR(20) DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily'
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'error', 'disconnected'
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loader_connector_workspace ON loader.connector(workspace_id);
CREATE INDEX IF NOT EXISTS idx_loader_connector_type ON loader.connector(connector_type);
CREATE INDEX IF NOT EXISTS idx_loader_connector_status ON loader.connector(status);

-- --------------------------------------
-- LOADER: Raw Event (Pre-Normalization)
-- --------------------------------------
CREATE TABLE IF NOT EXISTS loader.raw_event (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  connector_id UUID REFERENCES loader.connector(connector_id),
  
  -- Source
  source_type VARCHAR(50) NOT NULL, -- 'webhook', 'api_pull', 'import'
  source_system VARCHAR(50) NOT NULL, -- 'salesforce', 'hubspot', etc.
  
  -- Event data
  event_type VARCHAR(100) NOT NULL, -- e.g., 'account.created', 'deal.updated'
  external_id VARCHAR(255),
  payload JSONB NOT NULL,
  
  -- Processing status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'normalized', 'failed', 'skipped'
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Normalization result
  spine_entity_type VARCHAR(50), -- 'organization', 'person', 'deal', etc.
  spine_entity_id UUID, -- Link to resulting spine record
  
  -- Audit
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loader_raw_event_workspace ON loader.raw_event(workspace_id);
CREATE INDEX IF NOT EXISTS idx_loader_raw_event_source ON loader.raw_event(source_system);
CREATE INDEX IF NOT EXISTS idx_loader_raw_event_status ON loader.raw_event(status);
CREATE INDEX IF NOT EXISTS idx_loader_raw_event_pending ON loader.raw_event(status, received_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_loader_raw_event_external ON loader.raw_event(source_system, external_id);

-- --------------------------------------
-- LOADER: Sync Log
-- --------------------------------------
CREATE TABLE IF NOT EXISTS loader.sync_log (
  sync_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  connector_id UUID REFERENCES loader.connector(connector_id),
  
  -- Sync info
  sync_type VARCHAR(20) NOT NULL, -- 'full', 'incremental', 'webhook'
  
  -- Stats
  records_fetched INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  error_message TEXT,
  error_details JSONB,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_loader_sync_log_connector ON loader.sync_log(connector_id);
CREATE INDEX IF NOT EXISTS idx_loader_sync_log_status ON loader.sync_log(status);
CREATE INDEX IF NOT EXISTS idx_loader_sync_log_started ON loader.sync_log(started_at DESC);

-- =====================================================================================
-- IQ HUB VIEWS (Read-Only Join Layer)
-- =====================================================================================
-- IQ Hub provides unified views that JOIN Truth (Spine) + Context (Brainstorming).
-- IQ Hub does NOT auto-merge Context into Truth. Human action required.
-- =====================================================================================

-- --------------------------------------
-- IQ HUB: Account 360 View
-- --------------------------------------
CREATE OR REPLACE VIEW iq_hub.account_360 AS
SELECT 
  o.spine_id AS organization_id,
  o.workspace_id,
  o.name,
  o.domain,
  o.segment,
  o.industry,
  
  -- Health
  o.health_score,
  o.health_status,
  o.lifecycle_stage,
  
  -- Financials
  o.arr,
  o.mrr,
  o.contract_value,
  
  -- Dates
  o.customer_since,
  o.renewal_date,
  o.next_qbr_date,
  
  -- Team (aggregated)
  o.account_team,
  
  -- Context (from Brainstorming - read only)
  (
    SELECT json_agg(json_build_object(
      'session_id', s.session_id,
      'title', s.title,
      'summary', s.summary,
      'key_insights', s.key_insights,
      'started_at', s.started_at
    ) ORDER BY s.started_at DESC)
    FROM brainstorm.session s
    WHERE s.organization_id = o.spine_id
    AND s.status != 'archived'
    LIMIT 5
  ) AS recent_ai_sessions,
  
  -- Pending Actions (from Brainstorming)
  (
    SELECT COUNT(*)
    FROM brainstorm.action a
    JOIN brainstorm.session s ON a.session_id = s.session_id
    WHERE s.organization_id = o.spine_id
    AND a.status = 'pending'
  ) AS pending_actions_count,
  
  -- Recent Events (from Spine - Truth)
  (
    SELECT json_agg(json_build_object(
      'event_type', e.event_type,
      'subject', e.subject,
      'occurred_at', e.occurred_at
    ) ORDER BY e.occurred_at DESC)
    FROM spine.event e
    WHERE e.organization_id = o.spine_id
    LIMIT 10
  ) AS recent_events,
  
  -- Open Tickets (from Spine - Truth)
  (
    SELECT COUNT(*)
    FROM spine.ticket t
    WHERE t.organization_id = o.spine_id
    AND t.status NOT IN ('resolved', 'closed')
  ) AS open_tickets_count,
  
  -- Active Deals (from Spine - Truth)
  (
    SELECT COALESCE(SUM(d.amount), 0)
    FROM spine.deal d
    WHERE d.organization_id = o.spine_id
    AND d.stage NOT IN ('closed_won', 'closed_lost')
  ) AS pipeline_value,
  
  o.created_at,
  o.updated_at
FROM spine.organization o;

-- --------------------------------------
-- IQ HUB: Team Dashboard View
-- --------------------------------------
CREATE OR REPLACE VIEW iq_hub.team_dashboard AS
SELECT 
  p.spine_id AS person_id,
  p.full_name,
  p.email,
  p.team,
  p.team_role,
  
  -- Accounts managed
  (
    SELECT COUNT(DISTINCT at.organization_id)
    FROM spine.account_team at
    WHERE at.person_id = p.spine_id
  ) AS accounts_managed,
  
  -- Portfolio health
  (
    SELECT ROUND(AVG(o.health_score))
    FROM spine.account_team at
    JOIN spine.organization o ON at.organization_id = o.spine_id
    WHERE at.person_id = p.spine_id
  ) AS avg_portfolio_health,
  
  -- Open tasks (via pending actions)
  (
    SELECT COUNT(*)
    FROM brainstorm.action a
    WHERE a.created_by = p.user_id
    AND a.status = 'pending'
  ) AS pending_actions,
  
  -- At-risk accounts
  (
    SELECT COUNT(*)
    FROM spine.account_team at
    JOIN spine.organization o ON at.organization_id = o.spine_id
    WHERE at.person_id = p.spine_id
    AND o.health_status IN ('at_risk', 'critical')
  ) AS at_risk_accounts,
  
  -- Upcoming renewals (next 90 days)
  (
    SELECT COUNT(*)
    FROM spine.account_team at
    JOIN spine.organization o ON at.organization_id = o.spine_id
    WHERE at.person_id = p.spine_id
    AND o.renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
  ) AS upcoming_renewals
  
FROM spine.person p
WHERE p.is_internal = true
AND p.team IS NOT NULL;

-- --------------------------------------
-- IQ HUB: Pending Actions Queue
-- --------------------------------------
CREATE OR REPLACE VIEW iq_hub.pending_actions AS
SELECT 
  a.action_id,
  a.workspace_id,
  a.action_type,
  a.target_tool,
  a.payload,
  a.status,
  a.requires_approval,
  a.created_at,
  
  -- Session context
  s.session_id,
  s.title AS session_title,
  s.intake_source,
  
  -- Account context
  o.spine_id AS organization_id,
  o.name AS organization_name,
  
  -- Creator
  a.created_by
  
FROM brainstorm.action a
LEFT JOIN brainstorm.session s ON a.session_id = s.session_id
LEFT JOIN spine.organization o ON s.organization_id = o.spine_id
WHERE a.status IN ('pending', 'approved')
ORDER BY a.created_at DESC;

-- =====================================================================================
-- HELPER FUNCTIONS
-- =====================================================================================

-- Function to safely update health score
CREATE OR REPLACE FUNCTION spine.update_health_score(
  p_organization_id UUID,
  p_new_score INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE spine.organization
  SET 
    health_score = p_new_score,
    health_status = CASE
      WHEN p_new_score >= 75 THEN 'champion'
      WHEN p_new_score >= 50 THEN 'healthy'
      WHEN p_new_score >= 25 THEN 'at_risk'
      ELSE 'critical'
    END,
    updated_at = NOW()
  WHERE spine_id = p_organization_id;
END;
$$ LANGUAGE plpgsql;

-- Function to execute an action (triggered after approval)
CREATE OR REPLACE FUNCTION brainstorm.execute_action(
  p_action_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_action RECORD;
BEGIN
  SELECT * INTO v_action FROM brainstorm.action WHERE action_id = p_action_id;
  
  IF v_action IS NULL THEN
    RAISE EXCEPTION 'Action not found: %', p_action_id;
  END IF;
  
  IF v_action.status != 'approved' AND v_action.status != 'pending' THEN
    RAISE EXCEPTION 'Action cannot be executed in status: %', v_action.status;
  END IF;
  
  -- Update status to executing
  UPDATE brainstorm.action
  SET status = 'executing'
  WHERE action_id = p_action_id;
  
  -- NOTE: Actual tool integration happens in application layer
  -- This function just updates the status
  -- The webhook/API call to the target tool is handled externally
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to record action result
CREATE OR REPLACE FUNCTION brainstorm.record_action_result(
  p_action_id UUID,
  p_success BOOLEAN,
  p_spine_id UUID DEFAULT NULL,
  p_spine_type VARCHAR DEFAULT NULL,
  p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE brainstorm.action
  SET 
    status = CASE WHEN p_success THEN 'executed' ELSE 'failed' END,
    executed_at = NOW(),
    result_spine_id = p_spine_id,
    result_type = p_spine_type,
    error_message = p_error
  WHERE action_id = p_action_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================
COMMENT ON SCHEMA spine IS 'LOOP B Truth Store - Single source of truth for verified, normalized data';
COMMENT ON SCHEMA brainstorm IS 'LOOP A Context Store - AI conversations, insights, and action triggers';
COMMENT ON SCHEMA loader IS 'Ingestion pipeline - Raw events and connector management';
COMMENT ON SCHEMA iq_hub IS 'Read-only views joining Truth + Context';

COMMENT ON TABLE brainstorm.action IS 'Bridge from Context to Truth - Actions trigger Tool updates which flow through Loader→Normalizer→Spine';
COMMENT ON TABLE loader.raw_event IS 'Raw events from external tools - processed by Normalizer into Spine records';
COMMENT ON VIEW iq_hub.account_360 IS 'Unified account view combining Spine (Truth) + Brainstorming (Context) - READ ONLY';

-- =====================================================================================
-- END OF TWO-LOOP ARCHITECTURE MIGRATION
-- =====================================================================================
