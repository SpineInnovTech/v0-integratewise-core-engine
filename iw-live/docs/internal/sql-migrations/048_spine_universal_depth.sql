-- ============================================================
-- INTEGRATEWISE — MIGRATION 048
-- Universal Spine Full Depth Expansion
-- 12 Domains × ~200 Fields Each
-- Same intelligence depth as Migration 033 (CSM/TAM)
-- Builds on top of iw_spine_schema.sql (foundation)
-- ============================================================
-- DOMAINS COVERED:
--   D01  CS / TAM (extension of 033)
--   D02  Sales & RevOps
--   D03  Marketing
--   D04  Support / CX
--   D05  Finance
--   D06  Legal
--   D07  HR & People
--   D08  Engineering & Product
--   D09  Personal
--   D10  BizOps / Operations
--   D11  Executive & Governance
--   D12  Projects / PMO
-- ============================================================

-- ============================================================
-- D01: CS / TAM — EXTENSION (on top of 033)
-- New tables: Platform Health, API Portfolio, Value Streams
-- ============================================================

-- API Portfolio (per client account — interface area)
CREATE TABLE IF NOT EXISTS cs_api_portfolio (
  api_id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  client_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  account_id              UUID REFERENCES domain_accounts(account_id),
  ctx                     ctx_type DEFAULT 'CS',
  api_name                TEXT NOT NULL,
  api_type                TEXT,
  api_version             TEXT,
  business_capability     TEXT,
  linked_value_streams    UUID[],
  environment             TEXT,
  monthly_transactions    BIGINT,
  avg_response_time_ms    NUMERIC(10,2),
  sla_target_ms           INTEGER,
  sla_compliance_pct      NUMERIC(5,2),
  error_rate_pct          NUMERIC(5,2),
  uptime_pct              NUMERIC(5,2),
  p99_response_ms         NUMERIC(10,2),
  consuming_applications  TEXT[],
  business_criticality    TEXT,
  health_status           health_status DEFAULT 'UNKNOWN',
  owner_team              TEXT,
  deprecation_date        DATE,
  is_deprecated           BOOLEAN DEFAULT FALSE,
  security_score          NUMERIC(5,2),
  last_pentest_date       DATE,
  rate_limit_per_min      INTEGER,
  auth_method             TEXT,
  documentation_url       TEXT,
  last_sync_from_anypoint TIMESTAMPTZ,
  goal_refs               UUID[] NOT NULL DEFAULT '{}',
  metric_refs             UUID[],
  external_ids            JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Health Metrics (granular — beyond account health_score)
CREATE TABLE IF NOT EXISTS cs_platform_health (
  health_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  client_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  account_id              UUID REFERENCES domain_accounts(account_id),
  ctx                     ctx_type DEFAULT 'CS',
  metric_category         TEXT,
  metric_name             TEXT NOT NULL,
  metric_type             metric_type DEFAULT 'HEALTH',
  current_value           NUMERIC,
  target_value            NUMERIC,
  threshold_warning       NUMERIC,
  threshold_critical      NUMERIC,
  unit                    TEXT,
  measurement_freq        TEXT DEFAULT 'DAILY',
  health_status           health_status DEFAULT 'UNKNOWN',
  trend_direction         trend_direction DEFAULT 'STABLE',
  trend_is_good           BOOLEAN DEFAULT TRUE,
  last_measured_at        TIMESTAMPTZ,
  data_source             TEXT,
  linked_capability_id    UUID,
  business_impact         TEXT,
  goal_refs               UUID[] NOT NULL DEFAULT '{}',
  metric_refs             UUID[],
  embedding               vector(1536),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cs_health_requires_goal CHECK (array_length(goal_refs, 1) > 0)
);

-- Stakeholder Outcomes (detailed — per stakeholder type)
CREATE TABLE IF NOT EXISTS cs_stakeholder_outcomes (
  outcome_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  client_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  account_id              UUID REFERENCES domain_accounts(account_id),
  ctx                     ctx_type DEFAULT 'CS',
  stakeholder_type        TEXT,
  stakeholder_name        TEXT,
  stakeholder_user_id     UUID REFERENCES iw_users(user_id),
  outcome_statement       TEXT NOT NULL,
  linked_strategic_obj    UUID REFERENCES spine_goals(goal_id),
  linked_value_stream_id  UUID,
  success_metric_name     TEXT,
  baseline_value          NUMERIC,
  current_value           NUMERIC,
  target_value            NUMERIC,
  unit                    TEXT,
  target_achievement_pct  NUMERIC(5,2),
  measurement_method      TEXT,
  outcome_status          TEXT DEFAULT 'TRACKING',
  evidence_refs           UUID[],
  confidence              NUMERIC(3,2),
  goal_refs               UUID[] NOT NULL DEFAULT '{}',
  metric_refs             UUID[],
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- D02: SALES & REVOPS
-- ============================================================

-- Territory Management
CREATE TABLE IF NOT EXISTS sal_territories (
  territory_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  ctx                     ctx_type DEFAULT 'SALES',
  territory_name          TEXT NOT NULL,
  territory_type          TEXT,
  parent_territory_id     UUID REFERENCES sal_territories(territory_id),
  owner_user_id           UUID REFERENCES iw_users(user_id),
  overlay_users           UUID[],
  region                  TEXT,
  sub_region              TEXT,
  country                 TEXT[],
  industry_focus          TEXT[],
  segment                 TEXT,
  total_addressable_mkt   BIGINT,
  serviceable_mkt         BIGINT,
  target_account_count    INTEGER,
  active_account_count    INTEGER,
  annual_quota            BIGINT,
  ytd_bookings            BIGINT,
  ytd_quota_attainment    NUMERIC(5,2),
  pipeline_value          BIGINT,
  pipeline_coverage_ratio NUMERIC(5,2),
  avg_deal_size           BIGINT,
  avg_sales_cycle_days    INTEGER,
  win_rate_pct            NUMERIC(5,2),
  is_active               BOOLEAN DEFAULT TRUE,
  effective_date          DATE,
  expiry_date             DATE,
  goal_refs               UUID[] NOT NULL DEFAULT '{}',
  metric_refs             UUID[],
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities (extended — beyond domain_deals)
CREATE TABLE IF NOT EXISTS sal_opportunities (
  opp_id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id                 UUID REFERENCES domain_deals(deal_id),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  client_org_id           UUID REFERENCES iw_orgs(org_id),
  territory_id            UUID REFERENCES sal_territories(territory_id),
  ctx                     ctx_type DEFAULT 'SALES',
  tcv                     BIGINT,
  arr                     BIGINT,
  mrr                     BIGINT,
  nrr_impact              BIGINT,
  discount_pct            NUMERIC(5,2),
  unit_price              BIGINT,
  qty                     INTEGER,
  products                TEXT[],
  meddpicc_metrics        TEXT,
  meddpicc_economic_buyer TEXT,
  meddpicc_decision_crit  TEXT,
  meddpicc_decision_proc  TEXT,
  meddpicc_paper_proc     TEXT,
  meddpicc_identify_pain  TEXT,
  meddpicc_champion       TEXT,
  meddpicc_competition    TEXT,
  meddpicc_score          INTEGER,
  bant_budget             TEXT,
  bant_authority          TEXT,
  bant_need               TEXT,
  bant_timeline           TEXT,
  created_date            DATE,
  discovery_date          DATE,
  proposal_date           DATE,
  evaluation_date         DATE,
  negotiation_date        DATE,
  close_date_original     DATE,
  close_date_current      DATE,
  days_in_current_stage   INTEGER,
  age_days                INTEGER GENERATED ALWAYS AS (
                            (CURRENT_DATE - created_date)::INTEGER
                          ) STORED,
  closed_stage            TEXT,
  closed_reason           TEXT,
  competitor_primary      TEXT,
  competitor_others       TEXT[],
  loss_reason_category    TEXT,
  forecast_category       TEXT,
  manager_forecast_cat    TEXT,
  probability             NUMERIC(5,2),
  ai_win_probability      NUMERIC(5,2),
  ai_close_date_pred      DATE,
  next_step               TEXT,
  last_activity_date      DATE,
  days_since_activity     INTEGER GENERATED ALWAYS AS (
                            (CURRENT_DATE - last_activity_date)::INTEGER
                          ) STORED,
  is_at_risk              BOOLEAN DEFAULT FALSE,
  risk_factors            TEXT[],
  deal_stage              TEXT,
  goal_refs               UUID[] NOT NULL DEFAULT '{}',
  metric_refs             UUID[],
  external_ids            JSONB DEFAULT '{}',
  embedding               vector(1536),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Activities
CREATE TABLE IF NOT EXISTS sal_activities (
  activity_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  opp_id                  UUID REFERENCES sal_opportunities(opp_id),
  deal_id                 UUID REFERENCES domain_deals(deal_id),
  account_id              UUID REFERENCES domain_accounts(account_id),
  contact_id              UUID REFERENCES domain_contacts(contact_id),
  owner_user_id           UUID REFERENCES iw_users(user_id),
  ctx                     ctx_type DEFAULT 'SALES',
  activity_type           TEXT NOT NULL,
  subject                 TEXT,
  description             TEXT,
  outcome                 TEXT,
  sentiment               TEXT,
  duration_minutes        INTEGER,
  activity_date           DATE NOT NULL,
  email_opens             INTEGER,
  email_clicks            INTEGER,
  email_replies           INTEGER,
  meeting_no_show         BOOLEAN,
  demo_attended           BOOLEAN,
  content_consumed        TEXT[],
  sequence_id             UUID,
  sequence_step           INTEGER,
  is_auto_activity        BOOLEAN DEFAULT FALSE,
  goal_refs               UUID[] DEFAULT '{}',
  external_ids            JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue Forecasts
CREATE TABLE IF NOT EXISTS sal_forecasts (
  forecast_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  territory_id            UUID REFERENCES sal_territories(territory_id),
  owner_user_id           UUID REFERENCES iw_users(user_id),
  ctx                     ctx_type DEFAULT 'SALES',
  forecast_period         TEXT NOT NULL,
  forecast_type           TEXT,
  scenario                TEXT,
  pipeline_value          BIGINT,
  best_case_value         BIGINT,
  commit_value            BIGINT,
  closed_value            BIGINT,
  ai_forecast_value       BIGINT,
  manager_override_value  BIGINT,
  quota                   BIGINT,
  attainment_pct          NUMERIC(5,2) GENERATED ALWAYS AS (
                            CASE WHEN quota > 0
                            THEN ROUND((closed_value::NUMERIC / quota) * 100, 2)
                            ELSE NULL END
                          ) STORED,
  prior_period_value      BIGINT,
  yoy_growth_pct          NUMERIC(5,2),
  pipeline_deal_count     INTEGER,
  commit_deal_count       INTEGER,
  at_risk_value           BIGINT,
  upside_value            BIGINT,
  confidence_score        NUMERIC(3,2),
  notes                   TEXT,
  submitted_at            TIMESTAMPTZ,
  is_locked               BOOLEAN DEFAULT FALSE,
  goal_refs               UUID[] NOT NULL DEFAULT '{}',
  metric_refs             UUID[],
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Quota Management
CREATE TABLE IF NOT EXISTS sal_quotas (
  quota_id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  owner_user_id           UUID REFERENCES iw_users(user_id),
  territory_id            UUID REFERENCES sal_territories(territory_id),
  ctx                     ctx_type DEFAULT 'SALES',
  quota_period            TEXT NOT NULL,
  quota_type              TEXT,
  quota_amount            BIGINT NOT NULL,
  quota_currency          TEXT DEFAULT 'USD',
  new_logo_target         BIGINT,
  expansion_target        BIGINT,
  renewal_target          BIGINT,
  ramp_pct                NUMERIC(5,2) DEFAULT 100,
  effective_quota         BIGINT GENERATED ALWAYS AS (
                            ROUND(quota_amount * ramp_pct / 100)::BIGINT
                          ) STORED,
  ytd_attainment          BIGINT DEFAULT 0,
  ytd_attainment_pct      NUMERIC(5,2),
  qtd_attainment          BIGINT DEFAULT 0,
  qtd_attainment_pct      NUMERIC(5,2),
  quota_adjustment        BIGINT DEFAULT 0,
  adjustment_reason       TEXT,
  approved_by             UUID REFERENCES iw_users(user_id),
  is_active               BOOLEAN DEFAULT TRUE,
  goal_refs               UUID[] NOT NULL DEFAULT '{}',
  metric_refs             UUID[],
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Commission Plans
CREATE TABLE IF NOT EXISTS sal_commissions (
  commission_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  owner_user_id           UUID NOT NULL REFERENCES iw_users(user_id),
  opp_id                  UUID REFERENCES sal_opportunities(opp_id),
  ctx                     ctx_type DEFAULT 'SALES',
  period                  TEXT,
  commission_type         TEXT,
  deal_arr                BIGINT,
  commission_rate_pct     NUMERIC(5,2),
  attainment_band_pct     NUMERIC(5,2),
  accelerator_multiplier  NUMERIC(5,2) DEFAULT 1.0,
  gross_commission        BIGINT GENERATED ALWAYS AS (
                            ROUND(deal_arr * commission_rate_pct * accelerator_multiplier / 100)::BIGINT
                          ) STORED,
  draw_amount             BIGINT DEFAULT 0,
  net_commission          BIGINT,
  payment_status          TEXT DEFAULT 'PENDING',
  payment_date            DATE,
  clawback_risk           BOOLEAN DEFAULT FALSE,
  clawback_reason         TEXT,
  plan_document_ref       TEXT,
  goal_refs               UUID[] DEFAULT '{}',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Competitive Intelligence
CREATE TABLE IF NOT EXISTS sal_competitive_intel (
  intel_id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  ctx                     ctx_type DEFAULT 'SALES',
  competitor_name         TEXT NOT NULL,
  category                TEXT,
  win_rate_vs_pct         NUMERIC(5,2),
  loss_rate_vs_pct        NUMERIC(5,2),
  deal_count_vs           INTEGER,
  avg_deal_size_vs        BIGINT,
  primary_differentiator  TEXT,
  our_strengths           TEXT[],
  our_weaknesses          TEXT[],
  competitor_strengths    TEXT[],
  competitor_weaknesses   TEXT[],
  displacement_strategies TEXT[],
  common_objections       TEXT[],
  objection_responses     TEXT[],
  battlecard_url          TEXT,
  pricing_intelligence    TEXT,
  recent_wins_against     INTEGER,
  recent_losses_to        INTEGER,
  last_updated_by         UUID REFERENCES iw_users(user_id),
  intel_confidence        TEXT,
  goal_refs               UUID[] DEFAULT '{}',
  embedding               vector(1536),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- NRR Components (RevOps — net revenue retention decomposition)
CREATE TABLE IF NOT EXISTS rev_nrr_components (
  nrr_id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  client_org_id           UUID REFERENCES iw_orgs(org_id),
  ctx                     ctx_type DEFAULT 'SALES',
  period                  TEXT NOT NULL,
  period_start            DATE,
  period_end              DATE,
  arr_bop                 BIGINT,
  arr_new                 BIGINT DEFAULT 0,
  arr_expansion           BIGINT DEFAULT 0,
  arr_contraction         BIGINT DEFAULT 0,
  arr_churn               BIGINT DEFAULT 0,
  arr_reactivation        BIGINT DEFAULT 0,
  arr_eop                 BIGINT GENERATED ALWAYS AS (
                            COALESCE(arr_bop,0) + COALESCE(arr_new,0) + COALESCE(arr_expansion,0)
                            - COALESCE(arr_contraction,0) - COALESCE(arr_churn,0)
                            + COALESCE(arr_reactivation,0)
                          ) STORED,
  gross_retention_pct     NUMERIC(5,2),
  net_retention_pct       NUMERIC(5,2),
  expansion_rate_pct      NUMERIC(5,2),
  churn_rate_pct          NUMERIC(5,2),
  logo_churn_count        INTEGER,
  cohort_month            TEXT,
  cohort_arr_original     BIGINT,
  cohort_arr_current      BIGINT,
  cohort_retention_pct    NUMERIC(5,2),
  segment                 TEXT,
  goal_refs               UUID[] NOT NULL DEFAULT '{}',
  metric_refs             UUID[],
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Capacity Planning
CREATE TABLE IF NOT EXISTS sal_capacity (
  capacity_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_org_id           UUID NOT NULL REFERENCES iw_orgs(org_id),
  owner_user_id           UUID REFERENCES iw_users(user_id),
  ctx                     ctx_type DEFAULT 'SALES',
  period                  TEXT NOT NULL,
  role                    TEXT,
  hc_current              INTEGER,
  hc_target               INTEGER,
  hc_gap                  INTEGER GENERATED ALWAYS AS (
                            COALESCE(hc_target,0) - COALESCE(hc_current,0)
                          ) STORED,
  open_reqs               INTEGER,
  avg_ramp_months         INTEGER,
  fully_ramped_count      INTEGER,
  ramping_count           INTEGER,
  avg_quota_per_rep       BIGINT,
  attainable_capacity     BIGINT,
  pipeline_coverage_ratio NUMERIC(5,2),
  pipeline_needed         BIGINT,
  pipeline_current        BIGINT,
  pipeline_gap            BIGINT GENERATED ALWAYS AS (
                            GREATEST(0, COALESCE(pipeline_needed,0) - COALESCE(pipeline_current,0))
                          ) STORED,
  goal_refs               UUID[] NOT NULL DEFAULT '{}',
  metric_refs             UUID[],
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
