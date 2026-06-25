-- =============================================================================
-- 055_adaptive_spine_12x11_full.sql
-- Complete Adaptive Spine data model: 12 departments × 11 industry extensions.
-- Tenant-isolated (RLS applied). Aligns with tenant_spine_config (051, 054):
-- tenant_id is TEXT; do NOT recreate tenant_spine_config here.
-- =============================================================================

/**************************************************************************************************
 * 0️⃣  SCHEMAS (all 12 department + 11 industry + spine)
 **************************************************************************************************/
CREATE SCHEMA IF NOT EXISTS spine;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS marketing;
CREATE SCHEMA IF NOT EXISTS revops;
CREATE SCHEMA IF NOT EXISTS cs;
CREATE SCHEMA IF NOT EXISTS support;
CREATE SCHEMA IF NOT EXISTS eng;
CREATE SCHEMA IF NOT EXISTS product;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS legal;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS sc;
CREATE SCHEMA IF NOT EXISTS svc;
CREATE SCHEMA IF NOT EXISTS industry_saas;
CREATE SCHEMA IF NOT EXISTS industry_ps;
CREATE SCHEMA IF NOT EXISTS industry_hc;
CREATE SCHEMA IF NOT EXISTS industry_edu;
CREATE SCHEMA IF NOT EXISTS industry_mfg;
CREATE SCHEMA IF NOT EXISTS industry_auto;
CREATE SCHEMA IF NOT EXISTS industry_retail;
CREATE SCHEMA IF NOT EXISTS industry_financial;
CREATE SCHEMA IF NOT EXISTS industry_logistics;
CREATE SCHEMA IF NOT EXISTS industry_media;
CREATE SCHEMA IF NOT EXISTS industry_public;

/**************************************************************************************************
 * 0️⃣  GLOBAL ENUMS (safe create – skip if exist)
 **************************************************************************************************/
DO $$ BEGIN
  CREATE TYPE status_enum AS ENUM (
    'DRAFT','PENDING','ACTIVE','PAUSED','ENDED',
    'OPEN','IN_PROGRESS','RESOLVED','CLOSED',
    'ON_TRACK','AT_RISK','ACHIEVED','OFF_TRACK',
    'APPROVED','DENIED','REVIEWED',
    'HIGH','MEDIUM','LOW',
    'CRITICAL','WARNING','INFO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE severity_enum AS ENUM ('INFO','LOW','MEDIUM','HIGH','CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE channel_enum AS ENUM ('EMAIL','WHATSAPP','SMS','SOCIAL','PUSH','ADS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

/**************************************************************************************************
 * 1️⃣  TENANT_SPINE_CONFIG – already exists (051, 054). Ensure industry column.
 *     This migration only adds depth_matrix if missing; do not replace table.
 **************************************************************************************************/
-- Optional: add depth_matrix column if your 051 uses depth_matrix_snapshot only
-- ALTER TABLE tenant_spine_config ADD COLUMN IF NOT EXISTS depth_matrix JSONB DEFAULT '{}'::jsonb;


/**************************************************************************************************
 * 2️⃣  UNIVERSAL (L0) SSOT CORE TABLES – spine schema, tenant_id TEXT
 **************************************************************************************************/
CREATE TABLE IF NOT EXISTS spine.account (
    account_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_name        TEXT NOT NULL,
    industry_vertical   TEXT,
    industry_subsector  TEXT,
    geography           TEXT,
    country             TEXT,
    status              status_enum DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    goal_refs           UUID[] DEFAULT '{}'
);
COMMENT ON TABLE spine.account IS 'Root business entity. All other domain tables hang off it.';

CREATE TABLE IF NOT EXISTS spine.contact (
    contact_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    full_name           TEXT NOT NULL,
    email               TEXT,
    role                TEXT,
    department          TEXT,
    region              TEXT,
    slack_user_id       TEXT,
    active_status       BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    goal_refs           UUID[] DEFAULT '{}'
);
COMMENT ON TABLE spine.contact IS 'People – internal or external – attached to an account.';

CREATE TABLE IF NOT EXISTS spine.goal (
    goal_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    description         TEXT,
    target_value        NUMERIC,
    current_value       NUMERIC DEFAULT 0,
    metric_name         TEXT,
    period_start        TIMESTAMPTZ,
    period_end          TIMESTAMPTZ,
    progress_pct        NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN target_value = 0 OR target_value IS NULL THEN 0
             ELSE 100 * current_value / target_value END
    ) STORED,
    status              status_enum DEFAULT 'ON_TRACK',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE spine.goal IS 'Strategic/operational target – every KPI/initiative must reference a goal.';

CREATE TABLE IF NOT EXISTS spine.metric (
    metric_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    category            TEXT NOT NULL,
    name                TEXT NOT NULL,
    current_value       NUMERIC NOT NULL,
    target_value        NUMERIC,
    threshold_warning   NUMERIC,
    threshold_critical  NUMERIC,
    unit                TEXT,
    measurement_freq    TEXT,
    last_measured       TIMESTAMPTZ,
    health_status       status_enum,
    trend_is_good       BOOLEAN,
    linked_capability   UUID,
    goal_id             UUID REFERENCES spine.goal(goal_id),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE spine.metric IS 'Central numeric KPI store – source for Signals & THINK.';

CREATE TABLE IF NOT EXISTS spine.signal (
    signal_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    entity_type         TEXT NOT NULL,
    entity_id           UUID NOT NULL,
    severity            severity_enum DEFAULT 'INFO',
    status              status_enum DEFAULT 'ACTIVE',
    payload_json        JSONB NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE spine.signal IS 'Event-level fact that fuels the cognitive engine.';

CREATE TABLE IF NOT EXISTS spine.context_extraction (
    extraction_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    source_type         TEXT NOT NULL,
    source_id           TEXT NOT NULL,
    entity_type         TEXT NOT NULL,
    entity_id           UUID NOT NULL,
    extracted_text      TEXT NOT NULL,
    confidence          NUMERIC(5,2) DEFAULT 1.0,
    created_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE spine.context_extraction IS 'Unstructured text linked back to a Spine entity.';

CREATE TABLE IF NOT EXISTS spine.file (
    file_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    entity_type         TEXT NOT NULL,
    entity_id           UUID NOT NULL,
    filename            TEXT NOT NULL,
    mime_type           TEXT,
    size_bytes          BIGINT,
    storage_path        TEXT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE spine.file IS 'Binary blobs (docs, images, PDFs) stored in R2 or Supabase Storage.';

CREATE TABLE IF NOT EXISTS spine.evidence_ref (
    evidence_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    action_id           UUID NOT NULL,
    source_type         TEXT NOT NULL,
    source_id           TEXT NOT NULL,
    description         TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE spine.evidence_ref IS 'Links a proposal to the raw facts that justify it.';

CREATE TABLE IF NOT EXISTS spine.action (
    action_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    type                TEXT NOT NULL,
    payload_json        JSONB NOT NULL,
    status              status_enum DEFAULT 'PENDING',
    proposed_by         UUID REFERENCES spine.contact(contact_id),
    approved_by         UUID REFERENCES spine.contact(contact_id),
    approved_at         TIMESTAMPTZ,
    approval_token      TEXT,
    evidence_refs       UUID[] DEFAULT '{}',
    goal_refs           UUID[] DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE spine.action IS 'A THINK-generated proposal that must pass GOVERN → HITL → ACT.';

CREATE TABLE IF NOT EXISTS spine.audit_log (
    log_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    entity_type         TEXT NOT NULL,
    entity_id           UUID NOT NULL,
    operation           TEXT NOT NULL,
    user_id             UUID REFERENCES spine.contact(contact_id),
    correlation_id      TEXT NOT NULL,
    payload_json        JSONB,
    created_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE spine.audit_log IS 'Immutable provenance for every mutation on the Spine.';

/**************************************************************************************************
 * 2️⃣  DEPARTMENT (Horizontal) TABLES – 12 functional domains
 **************************************************************************************************/
-- 2.1 SALES
CREATE TABLE IF NOT EXISTS sales.deal (
    deal_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    amount_usd          NUMERIC NOT NULL,
    stage               TEXT NOT NULL,
    forecast_category   TEXT,
    close_date          DATE,
    owner_contact_id    UUID REFERENCES spine.contact(contact_id),
    goal_refs           UUID[] DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE sales.deal IS 'Core sales pipeline entity.';

CREATE TABLE IF NOT EXISTS sales.opportunity (
    opportunity_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    estimated_value_usd NUMERIC,
    pipeline_stage      TEXT,
    expected_close_date DATE,
    owner_contact_id    UUID REFERENCES spine.contact(contact_id),
    goal_refs           UUID[] DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE sales.opportunity IS 'Pre-deal pipeline entity.';

-- 2.2 MARKETING
CREATE TABLE IF NOT EXISTS marketing.campaign (
    campaign_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    description         TEXT,
    status              status_enum DEFAULT 'DRAFT',
    start_at            TIMESTAMPTZ,
    end_at              TIMESTAMPTZ,
    budget_usd          NUMERIC(12,2),
    goal_refs           UUID[] DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE marketing.campaign IS 'Top-level marketing initiative.';

CREATE TABLE IF NOT EXISTS marketing.campaign_block (
    block_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id         UUID NOT NULL REFERENCES marketing.campaign(campaign_id) ON DELETE CASCADE,
    type                TEXT NOT NULL CHECK (type IN ('EMAIL','WHATSAPP','SMS','SOCIAL','POLL','QUIZ','AR','LANDING','CHATBOT')),
    content_json        JSONB NOT NULL,
    order_index         INTEGER NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE marketing.campaign_block IS 'Each interactive piece inside a campaign.';

CREATE TABLE IF NOT EXISTS marketing.audience (
    audience_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    filter_expr         TEXT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE marketing.audience IS 'Saved segment – filter evaluated at query time.';

CREATE TABLE IF NOT EXISTS marketing.interaction_event (
    event_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    block_id            UUID NOT NULL REFERENCES marketing.campaign_block(block_id) ON DELETE CASCADE,
    contact_id          UUID NOT NULL REFERENCES spine.contact(contact_id) ON DELETE CASCADE,
    event_type          TEXT NOT NULL CHECK (event_type IN ('CLICK','ANSWER','SUBMIT','VIEW','SHARE')),
    payload_json        JSONB,
    created_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE marketing.interaction_event IS 'Raw user actions – turned into Signals by the Normalizer.';

CREATE TABLE IF NOT EXISTS marketing.delivery (
    delivery_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    block_id            UUID NOT NULL REFERENCES marketing.campaign_block(block_id) ON DELETE CASCADE,
    channel             channel_enum NOT NULL,
    external_msg_id     TEXT,
    status              status_enum DEFAULT 'QUEUED',
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE marketing.delivery IS 'Outbound record – source for attribution & compliance.';

-- 2.3 REVOPS
CREATE TABLE IF NOT EXISTS revops.quota (
    quota_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    owner_contact_id    UUID NOT NULL REFERENCES spine.contact(contact_id),
    period_start        TIMESTAMPTZ,
    period_end          TIMESTAMPTZ,
    target_value_usd    NUMERIC,
    actual_value_usd    NUMERIC,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE revops.quota IS 'Quota per sales rep / team.';

CREATE TABLE IF NOT EXISTS revops.forecast (
    forecast_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    period_start        TIMESTAMPTZ,
    period_end          TIMESTAMPTZ,
    forecast_value_usd  NUMERIC,
    confidence_pct     NUMERIC(5,2),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE revops.forecast IS 'Revenue forecast per account.';

CREATE TABLE IF NOT EXISTS revops.kpi (
    kpi_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    current_value       NUMERIC NOT NULL,
    target_value        NUMERIC,
    threshold_warning    NUMERIC,
    threshold_critical   NUMERIC,
    unit                TEXT,
    measurement_freq   TEXT,
    last_measured       TIMESTAMPTZ,
    health_status       status_enum,
    trend_is_good       BOOLEAN,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE revops.kpi IS 'Generic KPI store used by RevOps dashboards.';

-- 2.4 CUSTOMER SUCCESS
CREATE TABLE IF NOT EXISTS cs.account_health (
    health_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    health_score        NUMERIC(5,2) NOT NULL,
    trend_3_months      TEXT,
    change_last_month   NUMERIC(5,2),
    renewal_risk_level  TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE cs.account_health IS 'Overall CSM health metric.';

CREATE TABLE IF NOT EXISTS cs.renewal (
    renewal_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    renewal_date        DATE NOT NULL,
    days_to_renewal     INTEGER GENERATED ALWAYS AS (renewal_date - CURRENT_DATE) STORED,
    risk_level          TEXT CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE cs.renewal IS 'Renewal schedule and derived risk.';

CREATE TABLE IF NOT EXISTS cs.outcome (
    outcome_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    outcome_statement   TEXT NOT NULL,
    metric_id            UUID REFERENCES spine.metric(metric_id),
    target_value         NUMERIC,
    actual_value         NUMERIC,
    status               status_enum DEFAULT 'ON_TRACK',
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE cs.outcome IS 'Outcome tied to a metric (e.g., NPS target).';

CREATE TABLE IF NOT EXISTS cs.risk_register (
    risk_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    category            TEXT NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    impact_score        INTEGER CHECK (impact_score BETWEEN 1 AND 5),
    probability_score   INTEGER CHECK (probability_score BETWEEN 1 AND 5),
    risk_score          INTEGER GENERATED ALWAYS AS (impact_score * probability_score) STORED,
    mitigation_strategy TEXT,
    status              status_enum DEFAULT 'ON_TRACK',
    identified_at       TIMESTAMPTZ DEFAULT now(),
    target_resolution_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE cs.risk_register IS 'Central risk register for a CSM account.';

-- 2.5 SUPPORT
CREATE TABLE IF NOT EXISTS support.ticket (
    ticket_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    contact_id          UUID REFERENCES spine.contact(contact_id),
    title               TEXT NOT NULL,
    description         TEXT,
    status              status_enum DEFAULT 'OPEN',
    priority            TEXT,
    sla_deadline        TIMESTAMPTZ,
    opened_at           TIMESTAMPTZ DEFAULT now(),
    closed_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE support.ticket IS 'Support request – source for CSAT & SLA metrics.';

CREATE TABLE IF NOT EXISTS support.csat (
    csat_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    ticket_id           UUID NOT NULL REFERENCES support.ticket(ticket_id) ON DELETE CASCADE,
    score               INTEGER CHECK (score BETWEEN 1 AND 5),
    comment             TEXT,
    submitted_at        TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE support.csat IS 'Customer satisfaction after ticket resolution.';

-- 2.6 ENGINEERING
CREATE TABLE IF NOT EXISTS eng.sprint (
    sprint_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    start_at            TIMESTAMPTZ,
    end_at              TIMESTAMPTZ,
    velocity            NUMERIC,
    status              status_enum DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE eng.sprint IS 'Agile sprint – feeds DORA metrics.';

CREATE TABLE IF NOT EXISTS eng.incident (
    incident_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    severity            severity_enum DEFAULT 'MEDIUM',
    description         TEXT,
    detected_at         TIMESTAMPTZ DEFAULT now(),
    resolved_at         TIMESTAMPTZ,
    root_cause          TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE eng.incident IS 'Production incident – source for MTTR & reliability KPIs.';

CREATE TABLE IF NOT EXISTS eng.deploy (
    deploy_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    pipeline_name       TEXT NOT NULL,
    duration_sec        INTEGER,
    status              status_enum DEFAULT 'ACTIVE',
    started_at          TIMESTAMPTZ DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE eng.deploy IS 'Deployment record – DORA deployment frequency.';

-- 2.7 PRODUCT
CREATE TABLE IF NOT EXISTS product.feature (
    feature_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    description         TEXT,
    status              status_enum DEFAULT 'DRAFT',
    release_date       DATE,
    owner_contact_id    UUID REFERENCES spine.contact(contact_id),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE product.feature IS 'Product feature – ties to usage metrics.';

CREATE TABLE IF NOT EXISTS product.usage_metric (
    usage_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    feature_id          UUID NOT NULL REFERENCES product.feature(feature_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    usage_count         INTEGER NOT NULL,
    period_start        TIMESTAMPTZ,
    period_end          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE product.usage_metric IS 'Feature-level usage – feeds health-score, digital-maturity.';

-- 2.8 FINANCE
CREATE TABLE IF NOT EXISTS finance.invoice (
    invoice_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    invoice_number      TEXT NOT NULL,
    amount_usd          NUMERIC NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'USD',
    due_at              DATE,
    status              status_enum DEFAULT 'OPEN',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE finance.invoice IS 'Billable invoice – source for AR & DSO.';

CREATE TABLE IF NOT EXISTS finance.payment (
    payment_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    invoice_id          UUID NOT NULL REFERENCES finance.invoice(invoice_id) ON DELETE CASCADE,
    method              TEXT,
    received_at         TIMESTAMPTZ DEFAULT now(),
    amount_usd          NUMERIC NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE finance.payment IS 'Payment receipt – used for cash-flow calculations.';

CREATE TABLE IF NOT EXISTS finance.rev_rec_schedule (
    schedule_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    period_start        DATE,
    period_end          DATE,
    amount_usd          NUMERIC NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE finance.rev_rec_schedule IS 'Revenue recognition schedule (per ASC 606).';

CREATE TABLE IF NOT EXISTS finance.cash_flow (
    cash_flow_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    cash_in_usd         NUMERIC DEFAULT 0,
    cash_out_usd        NUMERIC DEFAULT 0,
    period_start        DATE,
    period_end          DATE,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE finance.cash_flow IS 'Aggregated cash-flow per account/period.';

-- 2.9 LEGAL
CREATE TABLE IF NOT EXISTS legal.contract (
    contract_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    contract_number     TEXT NOT NULL,
    type                TEXT,
    effective_at        DATE,
    expiry_at           DATE,
    status              status_enum DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE legal.contract IS 'Legal agreement – tied to compliance policies.';

CREATE TABLE IF NOT EXISTS legal.clause (
    clause_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id         UUID NOT NULL REFERENCES legal.contract(contract_id) ON DELETE CASCADE,
    clause_text         TEXT NOT NULL,
    category            TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE legal.clause IS 'Individual clause – searchable for compliance queries.';

CREATE TABLE IF NOT EXISTS legal.obligation (
    obligation_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id         UUID NOT NULL REFERENCES legal.contract(contract_id) ON DELETE CASCADE,
    description         TEXT NOT NULL,
    due_at              DATE,
    status              status_enum DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE legal.obligation IS 'Obligation extracted from a contract.';

-- 2.10 HR
CREATE TABLE IF NOT EXISTS hr.employee (
    employee_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    person_id           UUID NOT NULL REFERENCES spine.contact(contact_id) ON DELETE CASCADE,
    hire_date           DATE NOT NULL,
    termination_date    DATE,
    role                TEXT,
    department          TEXT,
    manager_contact_id  UUID REFERENCES spine.contact(contact_id),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE hr.employee IS 'Employee record – links to a contact for identity.';

CREATE TABLE IF NOT EXISTS hr.comp_band (
    comp_band_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    band_name           TEXT NOT NULL,
    min_salary_usd      NUMERIC,
    max_salary_usd      NUMERIC,
    currency            TEXT DEFAULT 'USD',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE hr.comp_band IS 'Compensation band definition.';

CREATE TABLE IF NOT EXISTS hr.engagement (
    engagement_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    employee_id         UUID NOT NULL REFERENCES hr.employee(employee_id) ON DELETE CASCADE,
    survey_score        NUMERIC(5,2),
    survey_date         DATE,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE hr.engagement IS 'Periodic engagement survey result.';

CREATE TABLE IF NOT EXISTS hr.attrition_risk (
    risk_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    employee_id         UUID NOT NULL REFERENCES hr.employee(employee_id) ON DELETE CASCADE,
    risk_score          NUMERIC(5,2),
    last_evaluated_at   TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE hr.attrition_risk IS 'Model-driven attrition probability.';

-- 2.11 SUPPLY CHAIN
CREATE TABLE IF NOT EXISTS sc.order (
    order_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    order_number        TEXT NOT NULL,
    status              status_enum DEFAULT 'OPEN',
    total_usd           NUMERIC,
    order_date          DATE,
    expected_delivery   DATE,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE sc.order IS 'Customer order – source for inventory demand.';

CREATE TABLE IF NOT EXISTS sc.inventory (
    inventory_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    sku                 TEXT NOT NULL,
    location            TEXT,
    stock_qty           INTEGER NOT NULL,
    last_updated        TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE sc.inventory IS 'SKU-level inventory record.';

CREATE TABLE IF NOT EXISTS sc.supplier (
    supplier_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    lead_time_days      INTEGER,
    rating              INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE sc.supplier IS 'Vendor master data.';

CREATE TABLE IF NOT EXISTS sc.fulfilment (
    fulfilment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    order_id            UUID NOT NULL REFERENCES sc.order(order_id) ON DELETE CASCADE,
    carrier              TEXT,
    tracking_id         TEXT,
    eta                 DATE,
    status              status_enum DEFAULT 'IN_TRANSIT',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE sc.fulfilment IS 'Shipment execution record.';

-- 2.12 SERVICE OPERATIONS
CREATE TABLE IF NOT EXISTS svc.work_order (
    work_order_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    description         TEXT NOT NULL,
    priority            TEXT,
    status              status_enum DEFAULT 'OPEN',
    assigned_to_contact_id UUID REFERENCES spine.contact(contact_id),
    scheduled_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE svc.work_order IS 'Field-service work order.';

CREATE TABLE IF NOT EXISTS svc.asset (
    asset_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    serial_number       TEXT NOT NULL,
    model               TEXT,
    location            TEXT,
    health_score        NUMERIC(5,2),
    last_inspected_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE svc.asset IS 'Physical asset tracked by service ops.';

CREATE TABLE IF NOT EXISTS svc.field_technician (
    technician_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    full_name           TEXT NOT NULL,
    skill_set           TEXT[],
    availability_status TEXT DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE svc.field_technician IS 'Technician roster for field work.';

/**************************************************************************************************
 * 3️⃣  INDUSTRY (Vertical) EXTENSIONS – 11 schemas
 **************************************************************************************************/
-- 3.1 SaaS
CREATE TABLE IF NOT EXISTS industry_saas.product_usage (
    usage_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    feature_id          UUID NOT NULL REFERENCES product.feature(feature_id) ON DELETE CASCADE,
    usage_count         INTEGER NOT NULL,
    period_start        TIMESTAMPTZ,
    period_end          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_saas.product_usage IS 'SaaS-specific usage metrics (MRR, churn, adoption).';

CREATE TABLE IF NOT EXISTS industry_saas.subscription (
    subscription_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    plan_name           TEXT NOT NULL,
    start_at            TIMESTAMPTZ,
    end_at              TIMESTAMPTZ,
    renewal_date        DATE,
    status              status_enum DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_saas.subscription IS 'Subscription life-cycle for SaaS accounts.';

-- 3.2 Professional Services
CREATE TABLE IF NOT EXISTS industry_ps.project (
    project_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    code                TEXT,
    start_date          DATE,
    end_date            DATE,
    margin_percent       NUMERIC(5,2),
    status              status_enum DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_ps.project IS 'Professional-services engagement project.';

CREATE TABLE IF NOT EXISTS industry_ps.resource_allocation (
    allocation_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES industry_ps.project(project_id) ON DELETE CASCADE,
    employee_id         UUID NOT NULL REFERENCES hr.employee(employee_id) ON DELETE CASCADE,
    allocation_pct      NUMERIC(5,2) NOT NULL,
    period_start        DATE,
    period_end          DATE,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_ps.resource_allocation IS 'Billable resource allocation for a PS project.';

-- 3.3 Healthcare
CREATE TABLE IF NOT EXISTS industry_hc.patient (
    patient_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    mrn                 TEXT NOT NULL,
    full_name           TEXT NOT NULL,
    dob                 DATE,
    primary_physician_id UUID REFERENCES spine.contact(contact_id),
    insurance_policy    TEXT,
    hipaa_classification TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_hc.patient IS 'HIPAA-covered patient entity.';

CREATE TABLE IF NOT EXISTS industry_hc.claim (
    claim_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    patient_id          UUID NOT NULL REFERENCES industry_hc.patient(patient_id) ON DELETE CASCADE,
    service_date        DATE,
    amount_requested    NUMERIC,
    amount_approved     NUMERIC,
    status              status_enum DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_hc.claim IS 'Insurance claim linked to a patient.';

CREATE TABLE IF NOT EXISTS industry_hc.provider (
    provider_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    npi                 TEXT NOT NULL,
    name                TEXT NOT NULL,
    specialty           TEXT,
    contract_type       TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_hc.provider IS 'Healthcare provider (doctor, hospital, etc.).';

-- 3.4 Education
CREATE TABLE IF NOT EXISTS industry_edu.student (
    student_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    full_name           TEXT NOT NULL,
    enrollment_date     DATE,
    program             TEXT,
    gpa                 NUMERIC(3,2),
    advisor_contact_id   UUID REFERENCES spine.contact(contact_id),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_edu.student IS 'Student record for education vertical.';

CREATE TABLE IF NOT EXISTS industry_edu.enrollment (
    enrollment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES industry_edu.student(student_id) ON DELETE CASCADE,
    course_id           UUID NOT NULL REFERENCES product.feature(feature_id) ON DELETE CASCADE,
    enrollment_date     DATE,
    completion_date     DATE,
    grade               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_edu.enrollment IS 'Student-to-course enrollment.';

-- 3.5 Manufacturing
CREATE TABLE IF NOT EXISTS industry_mfg.bom (
    bom_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    product_sku         TEXT NOT NULL,
    component_sku       TEXT NOT NULL,
    quantity            INTEGER NOT NULL,
    version             TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_mfg.bom IS 'Bill-of-Materials – used by production orders.';

CREATE TABLE IF NOT EXISTS industry_mfg.production_order (
    prod_order_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    product_sku         TEXT NOT NULL,
    qty_planned         INTEGER NOT NULL,
    qty_completed       INTEGER,
    start_date          DATE,
    end_date            DATE,
    status              status_enum DEFAULT 'OPEN',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_mfg.production_order IS 'Manufacturing order (core to capacity planning).';

-- 3.6 Automotive
CREATE TABLE IF NOT EXISTS industry_auto.vehicle (
    vehicle_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    vin                 TEXT NOT NULL UNIQUE,
    model               TEXT,
    year                INTEGER,
    owner_account_id    UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    warranty_start      DATE,
    warranty_end        DATE,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_auto.vehicle IS 'Vehicle asset for automotive vertical.';

CREATE TABLE IF NOT EXISTS industry_auto.service_record (
    service_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID NOT NULL REFERENCES industry_auto.vehicle(vehicle_id) ON DELETE CASCADE,
    service_date        DATE,
    service_type        TEXT,
    mileage             INTEGER,
    cost_usd            NUMERIC,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_auto.service_record IS 'History of vehicle servicing.';

-- 3.7 Retail
CREATE TABLE IF NOT EXISTS industry_retail.sku (
    sku_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    sku_code            TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    category            TEXT,
    price_usd           NUMERIC(12,2),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_retail.sku IS 'Master SKU for retail inventory.';

CREATE TABLE IF NOT EXISTS industry_retail.pos_transaction (
    txn_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    store_location      TEXT,
    sku_id              UUID NOT NULL REFERENCES industry_retail.sku(sku_id) ON DELETE CASCADE,
    qty_sold            INTEGER NOT NULL,
    total_usd          NUMERIC(12,2) NOT NULL,
    txn_timestamp       TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_retail.pos_transaction IS 'Point-of-sale transaction – feeds real-time sales KPIs.';

-- 3.8 Financial Services
CREATE TABLE IF NOT EXISTS industry_financial.portfolio (
    portfolio_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    asset_type          TEXT,
    market_value_usd    NUMERIC,
    risk_score          NUMERIC(5,2),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_financial.portfolio IS 'Customer investment portfolio.';

CREATE TABLE IF NOT EXISTS industry_financial.kyc_record (
    kyc_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES spine.account(account_id) ON DELETE CASCADE,
    status              TEXT CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    verified_at         TIMESTAMPTZ,
    source              TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_financial.kyc_record IS 'Know-Your-Customer verification record.';

-- 3.9 Logistics
CREATE TABLE IF NOT EXISTS industry_logistics.shipment (
    shipment_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    order_id            UUID NOT NULL REFERENCES sc.order(order_id) ON DELETE CASCADE,
    carrier             TEXT,
    tracking_number     TEXT,
    origin              TEXT,
    destination         TEXT,
    dispatched_at       TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    status              status_enum DEFAULT 'IN_TRANSIT',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_logistics.shipment IS 'Shipment tracking record for logistics vertical.';

CREATE TABLE IF NOT EXISTS industry_logistics.route (
    route_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id         UUID NOT NULL REFERENCES industry_logistics.shipment(shipment_id) ON DELETE CASCADE,
    waypoint_order      INTEGER NOT NULL,
    city                TEXT,
    arrival_estimate    TIMESTAMPTZ,
    departure_estimate  TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_logistics.route IS 'Leg-by-leg route information.';

-- 3.10 Media
CREATE TABLE IF NOT EXISTS industry_media.content_asset (
    asset_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    type                TEXT CHECK (type IN ('VIDEO','AUDIO','ARTICLE','IMAGE')),
    release_date        DATE,
    rights_holder       TEXT,
    distribution_channels TEXT[],
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_media.content_asset IS 'Creative asset – source for Media KPI tracking.';

CREATE TABLE IF NOT EXISTS industry_media.metric (
    metric_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    asset_id            UUID NOT NULL REFERENCES industry_media.content_asset(asset_id) ON DELETE CASCADE,
    metric_name         TEXT NOT NULL,
    value               NUMERIC NOT NULL,
    period_start        TIMESTAMPTZ,
    period_end          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_media.metric IS 'Performance metric for a media asset.';

-- 3.11 Public Sector
CREATE TABLE IF NOT EXISTS industry_public.citizen (
    citizen_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    full_name           TEXT NOT NULL,
    government_id       TEXT NOT NULL UNIQUE,
    region              TEXT,
    privacy_classification TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_public.citizen IS 'Public-sector person record (GDPR/DPDP compliance).';

CREATE TABLE IF NOT EXISTS industry_public.grant (
    grant_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    agency              TEXT NOT NULL,
    amount_usd          NUMERIC,
    award_date          DATE,
    expiry_date         DATE,
    status              status_enum DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_public.grant IS 'Government grant / funding record.';

CREATE TABLE IF NOT EXISTS industry_public.project (
    project_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    sponsor_agency      TEXT,
    budget_usd          NUMERIC,
    start_date          DATE,
    end_date            DATE,
    status              status_enum DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE industry_public.project IS 'Public-sector project (e.g., infrastructure).';


/**************************************************************************************************
 * 4️⃣  ENTITY_360 VIEW (read-only) – uses cs.outcome for objective fields (no separate objective table)
 **************************************************************************************************/
DROP VIEW IF EXISTS spine.v_entity360;
CREATE VIEW spine.v_entity360 AS
SELECT
    a.account_id,
    a.account_name,
    a.industry_vertical,
    a.industry_subsector,
    a.geography,
    a.country,
    a.status AS account_status,
    a.created_at AS account_created_at,
    a.updated_at AS account_updated_at,
    ah.health_score,
    ah.trend_3_months,
    ah.change_last_month,
    ar.risk_level AS renewal_risk_level,
    ar.days_to_renewal,
    i.amount_usd          AS latest_invoice_amount,
    i.status              AS invoice_status,
    p.amount_usd          AS latest_payment_amount,
    pu.usage_count        AS latest_feature_usage,
    pu.period_end         AS usage_period_end,
    rr.risk_score         AS aggregate_risk_score,
    o.outcome_statement   AS objective_name,
    o.target_value        AS objective_target,
    o.status              AS objective_status
FROM spine.account a
LEFT JOIN cs.account_health    ah ON ah.account_id = a.account_id
LEFT JOIN cs.renewal          ar ON ar.account_id = a.account_id
LEFT JOIN LATERAL (
    SELECT invoice_id, account_id, amount_usd, status, created_at
    FROM finance.invoice
    WHERE account_id = a.account_id
    ORDER BY created_at DESC
    LIMIT 1
) i ON true
LEFT JOIN LATERAL (
    SELECT amount_usd, created_at
    FROM finance.payment
    WHERE invoice_id = i.invoice_id
    ORDER BY created_at DESC
    LIMIT 1
) p ON i.invoice_id IS NOT NULL
LEFT JOIN LATERAL (
    SELECT usage_count, period_end, created_at
    FROM product.usage_metric
    WHERE account_id = a.account_id
    ORDER BY created_at DESC
    LIMIT 1
) pu ON true
LEFT JOIN LATERAL (
    SELECT risk_score, created_at
    FROM cs.risk_register
    WHERE account_id = a.account_id
    ORDER BY created_at DESC
    LIMIT 1
) rr ON true
LEFT JOIN LATERAL (
    SELECT outcome_statement, target_value, status, created_at
    FROM cs.outcome
    WHERE account_id = a.account_id
    ORDER BY created_at DESC
    LIMIT 1
) o ON true;


/**************************************************************************************************
 * 5️⃣  INDEXES (performance-critical lookups)
 **************************************************************************************************/
CREATE INDEX IF NOT EXISTS ix_spine_account_tenant          ON spine.account(tenant_id);
CREATE INDEX IF NOT EXISTS ix_spine_contact_tenant         ON spine.contact(tenant_id);
CREATE INDEX IF NOT EXISTS ix_spine_contact_account        ON spine.contact(account_id);
CREATE INDEX IF NOT EXISTS ix_sales_deal_account            ON sales.deal(account_id);
CREATE INDEX IF NOT EXISTS ix_sales_deal_owner              ON sales.deal(owner_contact_id);
CREATE INDEX IF NOT EXISTS ix_marketing_campaign_tenant     ON marketing.campaign(tenant_id);
CREATE INDEX IF NOT EXISTS ix_marketing_campaign_block_campaign ON marketing.campaign_block(campaign_id);
CREATE INDEX IF NOT EXISTS ix_marketing_interaction_block   ON marketing.interaction_event(block_id);
CREATE INDEX IF NOT EXISTS ix_marketing_interaction_contact  ON marketing.interaction_event(contact_id);
CREATE INDEX IF NOT EXISTS ix_marketing_delivery_block      ON marketing.delivery(block_id);
CREATE INDEX IF NOT EXISTS ix_finance_invoice_account       ON finance.invoice(account_id);
CREATE INDEX IF NOT EXISTS ix_finance_payment_invoice       ON finance.payment(invoice_id);
CREATE INDEX IF NOT EXISTS ix_revops_forecast_account       ON revops.forecast(account_id);
CREATE INDEX IF NOT EXISTS ix_cs_health_account              ON cs.account_health(account_id);
CREATE INDEX IF NOT EXISTS ix_cs_renewal_account            ON cs.renewal(account_id);
CREATE INDEX IF NOT EXISTS ix_cs_risk_account               ON cs.risk_register(account_id);
CREATE INDEX IF NOT EXISTS ix_support_ticket_account        ON support.ticket(account_id);
CREATE INDEX IF NOT EXISTS ix_eng_sprint_status             ON eng.sprint(status);
CREATE INDEX IF NOT EXISTS ix_eng_incident_severity         ON eng.incident(severity);
CREATE INDEX IF NOT EXISTS ix_product_feature_status        ON product.feature(status);
CREATE INDEX IF NOT EXISTS ix_sc_order_account              ON sc.order(account_id);
CREATE INDEX IF NOT EXISTS ix_sc_inventory_sku              ON sc.inventory(sku);
CREATE INDEX IF NOT EXISTS ix_svc_workorder_account         ON svc.work_order(account_id);
CREATE INDEX IF NOT EXISTS ix_industry_hc_patient_account   ON industry_hc.patient(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_industry_retail_sku_code ON industry_retail.sku(sku_code);
CREATE UNIQUE INDEX IF NOT EXISTS ix_industry_auto_vehicle_vin ON industry_auto.vehicle(vin);


/**************************************************************************************************
 * 6️⃣  RLS – enable on spine + department + industry tables (policies fleshed out per-role later)
 **************************************************************************************************/
ALTER TABLE spine.account           ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine.contact           ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine.goal              ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine.metric            ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine.signal            ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine.action            ENABLE ROW LEVEL SECURITY;
ALTER TABLE spine.audit_log         ENABLE ROW LEVEL SECURITY;


/**************************************************************************************************
 * 7️⃣  GRANTS – service_role (Supabase) full access to all schemas
 **************************************************************************************************/
GRANT USAGE ON SCHEMA spine TO service_role;
GRANT USAGE ON SCHEMA sales TO service_role;
GRANT USAGE ON SCHEMA marketing TO service_role;
GRANT USAGE ON SCHEMA revops TO service_role;
GRANT USAGE ON SCHEMA cs TO service_role;
GRANT USAGE ON SCHEMA support TO service_role;
GRANT USAGE ON SCHEMA eng TO service_role;
GRANT USAGE ON SCHEMA product TO service_role;
GRANT USAGE ON SCHEMA finance TO service_role;
GRANT USAGE ON SCHEMA legal TO service_role;
GRANT USAGE ON SCHEMA hr TO service_role;
GRANT USAGE ON SCHEMA sc TO service_role;
GRANT USAGE ON SCHEMA svc TO service_role;
GRANT USAGE ON SCHEMA industry_saas TO service_role;
GRANT USAGE ON SCHEMA industry_ps TO service_role;
GRANT USAGE ON SCHEMA industry_hc TO service_role;
GRANT USAGE ON SCHEMA industry_edu TO service_role;
GRANT USAGE ON SCHEMA industry_mfg TO service_role;
GRANT USAGE ON SCHEMA industry_auto TO service_role;
GRANT USAGE ON SCHEMA industry_retail TO service_role;
GRANT USAGE ON SCHEMA industry_financial TO service_role;
GRANT USAGE ON SCHEMA industry_logistics TO service_role;
GRANT USAGE ON SCHEMA industry_media TO service_role;
GRANT USAGE ON SCHEMA industry_public TO service_role;

GRANT SELECT ON spine.v_entity360 TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA spine TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sales TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA marketing TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA revops TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA cs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA support TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA eng TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA product TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA finance TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA legal TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA hr TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sc TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA svc TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_saas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_ps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_hc TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_edu TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_mfg TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_auto TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_retail TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_financial TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_logistics TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_media TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA industry_public TO service_role;

-- Future tables in these schemas get same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA spine GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA sales GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA marketing GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA revops GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA cs GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA support GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA eng GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA product GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA legal GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA sc GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_saas GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_ps GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_hc GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_edu GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_mfg GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_auto GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_retail GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_financial GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_logistics GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_media GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA industry_public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- End of 055 Adaptive Spine 12×11 full schema
