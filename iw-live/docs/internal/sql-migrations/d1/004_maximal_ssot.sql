-- ============================================================================
-- D1 SSOT MAXIMAL INTELLIGENCE SCHEMA (Structured Plane / Layer 1)
-- Version: v11.6 (Max Depth)
-- Purpose: Enterprise Knowledge Workspace - Full Digital Twin
-- ============================================================================
-- 1. ACCOUNT MASTER (Redined Foundation)
CREATE TABLE IF NOT EXISTS account_master (
    account_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_slug TEXT UNIQUE,
    parent_account_id TEXT,
    industry_vertical TEXT,
    industry_sub_sector TEXT,
    geography TEXT,
    country TEXT,
    account_status TEXT DEFAULT 'active',
    -- active, churned, prospect, partner
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 2. COMMERCIAL INTELLIGENCE (Layer 3 & 7)
CREATE TABLE IF NOT EXISTS commercial_intel (
    account_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    arr REAL DEFAULT 0,
    acv REAL DEFAULT 0,
    tcv REAL DEFAULT 0,
    wallet_share_percent REAL,
    expansion_potential_usd REAL,
    cost_to_serve_usd REAL,
    margin_percent REAL,
    billing_model TEXT,
    -- usage, seat, hybrid
    contract_type TEXT,
    -- msa, sow, order_form
    contract_start_date DATETIME,
    contract_end_date DATETIME,
    renewal_date DATETIME,
    renewal_risk_level TEXT,
    -- low, medium, high, critical
    payment_risk_status TEXT,
    sp_rating TEXT,
    annual_revenue REAL,
    employee_count INTEGER,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 3. RELATIONSHIP & INFLUENCE GRAPH (Relationship Intelligence)
CREATE TABLE IF NOT EXISTS relationship_graph (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    person_name TEXT NOT NULL,
    person_email TEXT,
    role_persona TEXT,
    -- Economic Buyer, Champion, Gatekeeper, User
    influence_level INTEGER,
    -- 1-5
    sentiment_score REAL,
    -- -1 to 1
    relationship_depth_trend TEXT,
    -- strengthening, weakening, stable
    power_sponsor_strength REAL,
    -- 0-1
    org_change_detected BOOLEAN DEFAULT FALSE,
    last_interaction_date DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 4. ADOPTION & USAGE TELEMETRY (Layer 3 & 5)
CREATE TABLE IF NOT EXISTS adoption_telemetry (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    feature_id TEXT NOT NULL,
    feature_name TEXT,
    adoption_depth_percent REAL,
    usage_frequency_score REAL,
    -- 0-1
    dau INTEGER,
    wau INTEGER,
    mau INTEGER,
    stickiness_ratio REAL,
    power_user_count INTEGER,
    time_to_first_value_days INTEGER,
    automation_usage_score REAL,
    workflow_penetration_percent REAL,
    shadow_tool_detected BOOLEAN DEFAULT FALSE,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 5. ARCHITECTURE & TECHNICAL STATE (TAM++ / Architecture Intelligence)
CREATE TABLE IF NOT EXISTS architecture_state (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    pattern_name TEXT,
    compliance_status TEXT,
    -- compliant, deviating, anti-pattern
    it_complexity_score INTEGER,
    single_point_of_failure_risk TEXT,
    latency_chain_p99_ms INTEGER,
    event_loss_risk_score REAL,
    retry_storm_probability REAL,
    technical_debt_item_count INTEGER,
    reference_arch_version TEXT,
    last_audit_date DATETIME,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 6. VALUE REALIZATION MAP (Features -> Business Outcomes)
CREATE TABLE IF NOT EXISTS value_realization (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    feature_id TEXT,
    objective_id TEXT,
    -- Link to Strategic Objectives
    promised_outcome TEXT,
    achieved_outcome TEXT,
    realized_value_usd REAL,
    achievement_velocity REAL,
    -- 0-1
    status TEXT,
    -- on_track, at_risk, missed
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 7. MARKET & INDUSTRY CONTEXT (Layer 9)
CREATE TABLE IF NOT EXISTS market_context (
    account_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    industry_risk_index REAL,
    -- 0-1
    competitive_displacement_risk REAL,
    -- 0-1
    layoff_signals_detected BOOLEAN DEFAULT FALSE,
    ma_activity_signals TEXT,
    regulatory_change_risk TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 8. PERSONAL COGNITIVE LAYER (Layer 11)
CREATE TABLE IF NOT EXISTS personal_memory (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    account_id TEXT,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    memory_type TEXT,
    -- pattern, risk_blindspot, coaching, preference
    confidence REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- 9. ENGAGEMENT INTELLIGENCE (Cadence & Coverage)
CREATE TABLE IF NOT EXISTS engagement_intel (
    account_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    cadence_coverage_percent REAL,
    executive_coverage_percent REAL,
    silence_detection_days INTEGER,
    meeting_effectiveness_avg REAL,
    -- 0-1
    topic_trend_clusters TEXT,
    -- JSON Array
    sentiment_trend_slope REAL,
    -- derivative of sentiment
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- RE-IMPORT PREVIOUS CORE TABLES (Aligned to new master)
-- (Strategic Objectives, Capabilities, Value Streams, Initiatives, Risks, etc. from 003)
-- Strategic Objectives (Redefined)
CREATE TABLE IF NOT EXISTS strategic_objectives (
    objective_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    pillar TEXT,
    name TEXT NOT NULL,
    description TEXT,
    business_driver TEXT,
    target_date DATETIME,
    business_value_usd REAL,
    status TEXT DEFAULT 'planned',
    progress_percent INTEGER DEFAULT 0,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- Capabilities
CREATE TABLE IF NOT EXISTS capabilities (
    capability_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    maturity_current INTEGER,
    maturity_target INTEGER,
    priority TEXT,
    status TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- Value Streams
CREATE TABLE IF NOT EXISTS value_streams (
    stream_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    annual_volume INTEGER,
    cycle_time_baseline REAL,
    cycle_time_current REAL,
    total_value_usd REAL,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- Initiatives
CREATE TABLE IF NOT EXISTS initiatives (
    initiative_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    priority TEXT,
    phase TEXT,
    status TEXT,
    investment_amount REAL,
    expected_benefit REAL,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- Risks
CREATE TABLE IF NOT EXISTS risk_register (
    risk_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    category TEXT,
    title TEXT NOT NULL,
    description TEXT,
    impact_score INTEGER,
    probability_score INTEGER,
    risk_score INTEGER,
    status TEXT,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- AGENT TWIN REGISTRY (Layer 12)
CREATE TABLE IF NOT EXISTS agent_twins (
    twin_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    twin_class TEXT,
    -- csm_twin, tam_twin, exec_advisor, revenue_risk_bot
    status TEXT DEFAULT 'running',
    last_run_at DATETIME,
    insights_generated_count INTEGER DEFAULT 0,
    FOREIGN KEY(account_id) REFERENCES account_master(account_id)
);
-- Indexes for the Augmented SSOT
CREATE INDEX idx_max_commercial ON commercial_intel(arr, renewal_date);
CREATE INDEX idx_max_relationship ON relationship_graph(influence_level, sentiment_score);
CREATE INDEX idx_max_adoption ON adoption_telemetry(mau, stickiness_ratio);
CREATE INDEX idx_max_arch ON architecture_state(compliance_status);
CREATE INDEX idx_max_personal ON personal_memory(user_id, memory_type);