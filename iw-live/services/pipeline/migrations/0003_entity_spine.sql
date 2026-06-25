-- Migration 0003: Corrected Domain-Partitioned Edge Spine
-- Database: integratewise-spine-cache (ed1f534a)
--
-- This schema partitions data structurally by functional domain to solve:
-- 1. Scaling (no generic scans or heavy table bloating)
-- 2. View coherence (structural impossibility of cross-domain bleed)
-- 3. Connector targeting (writing directly to specialized domains)
--
-- Each domain contains typed columns for query optimization and a 'data' JSON payload.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DECIDE DATA
-- ─────────────────────────────────────────────────────────────────────────────
-- Surface: Decide
-- Entity types: okr, strategic_objective, business_context, kpi, decision, commitment
CREATE TABLE IF NOT EXISTS decide_data (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,                -- 'okr', 'strategic_objective', 'kpi', etc.
    name TEXT NOT NULL,
    status TEXT,
    
    -- Domain-specific queryable fields
    owner TEXT,
    due_date TEXT,                     -- ISO 8601
    progress INTEGER,                  -- 0-100 (for OKRs)
    category TEXT,                     -- 'ICP', 'positioning', etc. (for strategy)
    investment REAL,                   -- for ROI map
    revenue REAL,
    roi_pct REAL,
    effort TEXT,                       -- 'low', 'medium', 'high'
    decided_by TEXT,
    decided_at TEXT,
    committed_to TEXT,
    fulfilled INTEGER DEFAULT 0,       -- 0/1 boolean
    
    -- Full data payload
    data TEXT NOT NULL DEFAULT '{}',   -- JSON string
    
    -- Source tracking
    source_tool TEXT,
    source_id TEXT,
    tags TEXT DEFAULT '[]',
    
    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    source_synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_decide_type ON decide_data(type);
CREATE INDEX IF NOT EXISTS idx_decide_status ON decide_data(status);
CREATE INDEX IF NOT EXISTS idx_decide_owner ON decide_data(owner);
CREATE INDEX IF NOT EXISTS idx_decide_due ON decide_data(due_date);
CREATE INDEX IF NOT EXISTS idx_decide_source ON decide_data(source_tool, source_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. BUILD DATA
-- ─────────────────────────────────────────────────────────────────────────────
-- Surface: Build
-- Entity types: task, workflow, document, blocker, calendar_event
CREATE TABLE IF NOT EXISTS build_data (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT,
    
    -- Domain-specific queryable fields
    priority TEXT,                     -- 'urgent', 'high', 'medium', 'low'
    assignee TEXT,
    due_date TEXT,
    overdue INTEGER DEFAULT 0,         -- 0/1 boolean
    source TEXT,                       -- integration source
    doc_type TEXT,                     -- 'SOP', 'Playbook', 'Contract', etc.
    success_rate REAL,                 -- for workflows
    trigger_type TEXT,                 -- for workflows
    event_type TEXT,                   -- 'standup', 'milestone', 'qbr' (calendar)
    event_date TEXT,
    event_time TEXT,
    blocked_by TEXT,                   -- for blockers
    age_days INTEGER,                  -- for blockers
    escalated INTEGER DEFAULT 0,
    
    -- Full data payload
    data TEXT NOT NULL DEFAULT '{}',
    
    -- Source tracking
    source_tool TEXT,
    source_id TEXT,
    tags TEXT DEFAULT '[]',
    
    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    source_synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_build_type ON build_data(type);
CREATE INDEX IF NOT EXISTS idx_build_status ON build_data(status);
CREATE INDEX IF NOT EXISTS idx_build_priority ON build_data(priority);
CREATE INDEX IF NOT EXISTS idx_build_assignee ON build_data(assignee);
CREATE INDEX IF NOT EXISTS idx_build_due ON build_data(due_date);
CREATE INDEX IF NOT EXISTS idx_build_overdue ON build_data(overdue);
CREATE INDEX IF NOT EXISTS idx_build_source ON build_data(source_tool, source_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. GROW DATA
-- ─────────────────────────────────────────────────────────────────────────────
-- Surface: Grow
-- Entity types: account, contact, opportunity, ticket, renewal, risk
CREATE TABLE IF NOT EXISTS grow_data (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT,
    
    -- Domain-specific queryable fields
    health TEXT,                       -- 'healthy', 'at-risk', 'critical'
    health_score INTEGER,              -- 0-100
    arr REAL,
    mrr REAL,
    arr_growth_pct REAL,
    industry TEXT,
    region TEXT,
    tier TEXT,                         -- 'enterprise', 'mid-market', 'smb'
    csm TEXT,
    owner TEXT,
    stage TEXT,                        -- pipeline stage
    value REAL,                        -- deal value
    probability INTEGER,              -- deal probability 0-100
    close_date TEXT,
    renewal_date TEXT,
    renewal_days_remaining INTEGER,
    churn_risk TEXT,                   -- 'high', 'medium', 'low'
    churn_probability INTEGER,
    severity TEXT,                     -- for risks/tickets
    priority TEXT,                     -- for tickets
    score INTEGER,                     -- contact score 0-100
    nps INTEGER,
    last_activity TEXT,
    last_qbr TEXT,
    champion_active INTEGER DEFAULT 1, -- 0/1
    open_tickets INTEGER DEFAULT 0,
    p1_tickets INTEGER DEFAULT 0,
    
    -- Full data payload
    data TEXT NOT NULL DEFAULT '{}',
    
    -- Source tracking
    source_tool TEXT,
    source_id TEXT,
    tags TEXT DEFAULT '[]',
    
    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    source_synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_grow_type ON grow_data(type);
CREATE INDEX IF NOT EXISTS idx_grow_status ON grow_data(status);
CREATE INDEX IF NOT EXISTS idx_grow_health ON grow_data(health);
CREATE INDEX IF NOT EXISTS idx_grow_health_score ON grow_data(health_score);
CREATE INDEX IF NOT EXISTS idx_grow_arr ON grow_data(arr);
CREATE INDEX IF NOT EXISTS idx_grow_stage ON grow_data(stage);
CREATE INDEX IF NOT EXISTS idx_grow_renewal ON grow_data(renewal_date);
CREATE INDEX IF NOT EXISTS idx_grow_churn ON grow_data(churn_risk);
CREATE INDEX IF NOT EXISTS idx_grow_owner ON grow_data(owner);
CREATE INDEX IF NOT EXISTS idx_grow_industry ON grow_data(industry);
CREATE INDEX IF NOT EXISTS idx_grow_tier ON grow_data(tier);
CREATE INDEX IF NOT EXISTS idx_grow_source ON grow_data(source_tool, source_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RUN DATA
-- ─────────────────────────────────────────────────────────────────────────────
-- Surface: Run
-- Entity types: ops_metric, generated_insight (RUN module)
CREATE TABLE IF NOT EXISTS run_data (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT,
    
    -- Domain-specific queryable fields
    metric_value TEXT,                 -- string (can be currency, count, percentage)
    unit TEXT,                         -- 'currency', 'count', 'percentage'
    change_pct REAL,
    direction TEXT,                    -- 'up', 'down', 'flat'
    metric_source TEXT,                -- 'razorpay', 'stripe', 'crm', 'analytics'
    period TEXT,                       -- '2025-05', '7d', '30d'
    priority TEXT,                     -- for insights: 'high', 'medium', 'low'
    insight_module TEXT,               -- 'RUN', 'GROW', etc.
    recommendation TEXT,
    
    -- Full data payload
    data TEXT NOT NULL DEFAULT '{}',
    
    -- Source tracking
    source_tool TEXT,
    source_id TEXT,
    tags TEXT DEFAULT '[]',
    
    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    source_synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_run_type ON run_data(type);
CREATE INDEX IF NOT EXISTS idx_run_status ON run_data(status);
CREATE INDEX IF NOT EXISTS idx_run_priority ON run_data(priority);
CREATE INDEX IF NOT EXISTS idx_run_source ON run_data(source_tool, source_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CROSS DATA
-- ─────────────────────────────────────────────────────────────────────────────
-- Surface: My Desk (primary), all surfaces (reference)
-- Entity types: signal, episode, learning, generated_insight (cross-surface)
CREATE TABLE IF NOT EXISTS cross_data (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT,
    
    -- Domain-specific queryable fields
    priority TEXT,                     -- 'high', 'medium', 'low'
    source_surface TEXT,               -- which surface originated this
    routed_to TEXT,                    -- JSON array of surfaces
    severity TEXT,                     -- for episodes
    domain TEXT,                       -- for episodes: 'customer_success', 'engineering', etc.
    primary_surface TEXT,              -- for episodes: 'DECIDE', 'BUILD', 'GROW', 'RUN'
    confidence REAL,                   -- 0-1 for learnings/insights
    category TEXT,                     -- for org memory: 'doctrine', 'decision', etc.
    
    -- Full data payload
    data TEXT NOT NULL DEFAULT '{}',
    
    -- Source tracking
    source_tool TEXT,
    source_id TEXT,
    tags TEXT DEFAULT '[]',
    
    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    source_synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_cross_type ON cross_data(type);
CREATE INDEX IF NOT EXISTS idx_cross_status ON cross_data(status);
CREATE INDEX IF NOT EXISTS idx_cross_priority ON cross_data(priority);
CREATE INDEX IF NOT EXISTS idx_cross_surface ON cross_data(primary_surface);
CREATE INDEX IF NOT EXISTS idx_cross_source ON cross_data(source_tool, source_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. GOVERNANCE DATA
-- ─────────────────────────────────────────────────────────────────────────────
-- Surface: My Desk (approvals), Run (sync status)
-- Contains: approvals, sync status
CREATE TABLE IF NOT EXISTS governance_data (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,                -- 'approval', 'sync_status'
    
    -- Approval fields
    proposal_type TEXT,
    proposal_data TEXT,                -- JSON string
    status TEXT DEFAULT 'pending',
    proposed_by TEXT,
    proposed_at TEXT,
    urgency TEXT DEFAULT 'medium',
    score TEXT,
    score_breakdown TEXT,              -- JSON string
    decided_by TEXT,
    decided_at TEXT,
    
    -- Sync status fields
    tool_name TEXT,
    tool_type TEXT,
    connection_type TEXT,
    last_sync_at TEXT,
    records_synced INTEGER,
    errors INTEGER,
    
    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gov_type ON governance_data(type);
CREATE INDEX IF NOT EXISTS idx_gov_status ON governance_data(status);
CREATE INDEX IF NOT EXISTS idx_gov_urgency ON governance_data(urgency);
CREATE INDEX IF NOT EXISTS idx_gov_tool ON governance_data(tool_name);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. LINK DATA
-- ─────────────────────────────────────────────────────────────────────────────
-- Cross-domain relationships (Related panel in entity detail views)
CREATE TABLE IF NOT EXISTS link_data (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_domain TEXT NOT NULL,       -- 'decide', 'build', 'grow', 'run', 'cross'
    target_id TEXT NOT NULL,
    target_domain TEXT NOT NULL,
    relationship_type TEXT NOT NULL,   -- 'belongs_to', 'related_to', 'blocks', etc.
    data TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_link_source ON link_data(source_id);
CREATE INDEX IF NOT EXISTS idx_link_target ON link_data(target_id);
CREATE INDEX IF NOT EXISTS idx_link_source_domain ON link_data(source_domain);
CREATE INDEX IF NOT EXISTS idx_link_target_domain ON link_data(target_domain);
CREATE INDEX IF NOT EXISTS idx_link_type ON link_data(relationship_type);


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. AGENT REGISTRY & SESSION LOGS
-- ─────────────────────────────────────────────────────────────────────────────

-- Agent registry
CREATE TABLE IF NOT EXISTS agent_registry (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    capabilities TEXT DEFAULT '[]',
    can_read TEXT DEFAULT '[]',
    can_write TEXT DEFAULT '[]',
    can_execute INTEGER DEFAULT 0,
    requires_approval INTEGER DEFAULT 1,
    surfaces TEXT DEFAULT '[]',
    skills TEXT DEFAULT '[]',
    config TEXT DEFAULT '{}',
    last_heartbeat TEXT,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_type ON agent_registry(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_status ON agent_registry(status);

-- Agent session log
CREATE TABLE IF NOT EXISTS agent_sessions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    surface TEXT,
    action TEXT NOT NULL,
    input TEXT DEFAULT '{}',
    output TEXT DEFAULT '{}',
    status TEXT DEFAULT 'success',
    duration_ms INTEGER,
    approval_required INTEGER DEFAULT 0,
    approved_by TEXT,
    approved_at TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_agent ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_session_surface ON agent_sessions(surface);
CREATE INDEX IF NOT EXISTS idx_session_created ON agent_sessions(created_at);

-- Seed Agent Registry
INSERT INTO agent_registry (id, agent_id, agent_type, name, status, capabilities, can_read, can_write, can_execute, requires_approval, surfaces, skills, config, updated_at) VALUES
('1', 'twin', 'twin', 'Twin', 'active',
 '["chat","insight","suggest","context"]',
 '["personal","organisational","conversational"]',
 '["conversational"]',
 0, 1,
 '["my-desk","decide","build","grow","run","memory"]',
 '["signal-triage","okr-alignment","churn-prediction","contract-watch"]',
 '{"model":"auto","context_window":"128k"}',
 datetime('now')),

('2', 'triage-bot', 'triage', 'Triage Bot', 'active',
 '["score","approve","reject","defer"]',
 '["organisational"]',
 '["organisational"]',
 0, 1,
 '["governance","memory"]',
 '["evidence-quality","category-fit","novelty","specificity","entity-linkage"]',
 '{"auto_approve_threshold":0.85,"reject_threshold":0.60}',
 datetime('now')),

('3', 'signal-engine', 'signal', 'Signal Engine', 'active',
 '["detect","route","alert"]',
 '["all-domains"]',
 '["cross_data"]',
 0, 0,
 '["my-desk","decide","build","grow","run"]',
 '["churn-champion-silence","workflow-degradation","stale-pipeline","commitment-breach"]',
 '{}',
 datetime('now')),

('4', 'operator', 'operator', 'Operator', 'active',
 '["package","handoff","track","writeback"]',
 '["governance","all-domains"]',
 '["governance_data","source-tools"]',
 1, 1,
 '["executions","governance"]',
 '["action-packaging","schema-validation","writeback-tracking"]',
 '{}',
 datetime('now')),

('5', 'continuity-engine', 'continuity', 'Continuity Engine', 'active',
 '["promote","construct-episode","link"]',
 '["conversational","organisational"]',
 '["cross_data","link_data","organisational"]',
 0, 1,
 '["memory","my-desk"]',
 '["memory-promotion","episode-construction","knowledge-gap"]',
 '{"episode_threshold":3}',
 datetime('now')),

('6', 'maintainer', 'maintainer', 'Maintainer', 'active',
 '["monitor","alert","report"]',
 '["all-domains","infrastructure"]',
 '["run_data","governance_data"]',
 0, 0,
 '["operations"]',
 '["sync-health","system-health","cost-tracking","error-monitoring"]',
 '{"poll_interval":60}',
 datetime('now'));
