-- =============================================================================
-- 071_adaptive_product_schema.sql
-- Adaptive Product Schema — tenant → org → team hierarchy + 20-product catalog
--
-- Creates:
--   PART 1: Org/Team Infrastructure
--     1. public.organizations          — org layer between tenant and team
--     2. public.teams                  — team layer (functional groups)
--     3. Backfill: default org/team per existing tenant
--     4. ALTER profiles ADD org_id, team_id
--     5. Helper: get_user_context()
--
--   PART 2: Product Catalog
--     6. public.product_catalog        — 20 products, 3 surfaces, 3 twin tiers
--
--   PART 3: Adaptive Entity Mapping
--     7. public.product_schema         — product → entity types (with cascade)
--     8. Seed: global defaults for all 20 products
--
--   PART 4: RPCs
--     9. get_product_catalog()         — list all products
--    10. get_product_schema()          — entity types for a product
--    11. get_product_entities()        — actual data for a product (delegates to 070)
--
-- Hierarchy:
--   tenant_id → org_id → team_id → product → entity_types
--
-- Cascade resolution for product_schema:
--   team-level → org-level → tenant-level → global defaults
--   Most specific match wins. Global defaults (NULL scope) used initially.
--
-- Data isolation:
--   Actual data rows remain tenant_id-scoped (existing RLS).
--   Org/team controls WHICH products/views are visible, not data access.
--   Team-level data isolation (adding org_id/team_id to domain tables) is future.
--
-- Self-serve model:
--   New signups get assigned to their tenant's default org/team.
--   All queries always have tenant_id + org_id + team_id — no NULLs, no COALESCE.
-- =============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: Org/Team Infrastructure
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- 1.1 Organizations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  org_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT,
  is_default  BOOLEAN DEFAULT false,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_tenant ON public.organizations(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_default ON public.organizations(tenant_id) WHERE is_default = true;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT TO authenticated USING (tenant_id = get_tenant_id());
DROP POLICY IF EXISTS "org_service" ON public.organizations;
CREATE POLICY "org_service" ON public.organizations
  FOR ALL TO service_role USING (true);


-- ---------------------------------------------------------------------------
-- 1.2 Teams
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  team_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(org_id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_default  BOOLEAN DEFAULT false,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_org ON public.teams(org_id);
CREATE INDEX IF NOT EXISTS idx_teams_tenant ON public.teams(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_default ON public.teams(org_id) WHERE is_default = true;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_select" ON public.teams;
CREATE POLICY "team_select" ON public.teams
  FOR SELECT TO authenticated USING (tenant_id = get_tenant_id());
DROP POLICY IF EXISTS "team_service" ON public.teams;
CREATE POLICY "team_service" ON public.teams
  FOR ALL TO service_role USING (true);


-- ---------------------------------------------------------------------------
-- 1.3 Backfill: Create default org + team for every existing tenant
-- ---------------------------------------------------------------------------
-- For each tenant that doesn't already have a default org, create one.
-- Then for each default org that doesn't have a default team, create one.
INSERT INTO public.organizations (tenant_id, name, slug, is_default)
SELECT t.id, 'Default', t.slug || '-default', true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.tenant_id = t.id AND o.is_default = true
)
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (org_id, tenant_id, name, is_default)
SELECT o.org_id, o.tenant_id, 'Default', true
FROM public.organizations o
WHERE o.is_default = true
  AND NOT EXISTS (
    SELECT 1 FROM public.teams tm WHERE tm.org_id = o.org_id AND tm.is_default = true
  )
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- 1.4 ALTER profiles: add org_id and team_id
-- ---------------------------------------------------------------------------
-- Add columns as NULLABLE first, backfill, then set NOT NULL.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id UUID;

-- Backfill: assign each user to their tenant's default org and team
UPDATE public.profiles p
SET org_id = o.org_id
FROM public.organizations o
WHERE o.tenant_id = p.tenant_id AND o.is_default = true AND p.org_id IS NULL;

UPDATE public.profiles p
SET team_id = tm.team_id
FROM public.teams tm
INNER JOIN public.organizations o ON tm.org_id = o.org_id
WHERE o.tenant_id = p.tenant_id AND o.is_default = true AND tm.is_default = true AND p.team_id IS NULL;

-- Now enforce NOT NULL (safe because all rows are backfilled)
-- Use DO block to handle case where constraint already exists
DO $$
BEGIN
  -- Only alter if currently nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'org_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN org_id SET NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'team_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN team_id SET NOT NULL;
  END IF;
END $$;

-- Add FK constraints (idempotent via IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_profiles_org' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_org
      FOREIGN KEY (org_id) REFERENCES public.organizations(org_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_profiles_team' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_team
      FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON public.profiles(team_id);


-- ---------------------------------------------------------------------------
-- 1.5 Helper: get_user_context()
-- Returns tenant_id, org_id, team_id for the current authenticated user.
-- Use this instead of get_tenant_id() when you need the full context.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS TABLE(tenant_id UUID, org_id UUID, team_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.tenant_id, p.org_id, p.team_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_context() TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: Product Catalog
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- 2.1 product_catalog — The 20 marketed products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_catalog (
  product_id      TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  surface         TEXT NOT NULL,   -- account_success | business_ops | personal_space
  twin_tier       TEXT NOT NULL,   -- no_twin | basic_twin | full_twin
  l2_components   TEXT[] DEFAULT '{}',
  description     TEXT,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "catalog_read" ON public.product_catalog;
CREATE POLICY "catalog_read" ON public.product_catalog
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "catalog_service" ON public.product_catalog;
CREATE POLICY "catalog_service" ON public.product_catalog
  FOR ALL TO service_role USING (true);

-- ---------------------------------------------------------------------------
-- 2.2 Seed 20 products
-- ---------------------------------------------------------------------------
INSERT INTO public.product_catalog (product_id, display_name, surface, twin_tier, l2_components, description, sort_order) VALUES
  -- Account Success (8)
  ('data_sentinel',     'DataSentinel',     'account_success', 'no_twin',    '{}',
   'Data quality monitoring, anomaly detection, identity resolution, sync health', 1),
  ('vault_guard',       'VaultGuard',       'account_success', 'no_twin',    '{}',
   'Contract repository, renewal calendar, entitlement tracking, document storage', 2),
  ('architect_iq',      'ArchitectIQ',      'account_success', 'no_twin',    '{}',
   'Integration landscape mapping, technical health, connector management', 3),
  ('template_forge',    'TemplateForge',    'account_success', 'no_twin',    '{}',
   'Playbook engine, QBR templates, onboarding workflows, escalation scripts', 4),
  ('success_pilot',     'SuccessPilot',     'account_success', 'basic_twin', '{trust_insight}',
   'Account health scoring with Twin-suggested next actions', 5),
  ('deal_desk',         'DealDesk',         'account_success', 'basic_twin', '{trust_insight}',
   'Expansion signals, upsell tracking, commercial intelligence', 6),
  ('churn_shield',      'ChurnShield',      'account_success', 'full_twin',
   '{trust_dashboard,drift_detection,simulation,decision_memory,triage_inbox}',
   'Predictive churn detection, cross-system weak signals, intervention plans', 7),
  ('success_command',   'SuccessCommand',   'account_success', 'full_twin',
   '{trust_dashboard,drift_detection,simulation,decision_memory,triage_inbox}',
   'Full Entity 360 command center, Twin-generated account strategies', 8),

  -- Business Ops (7)
  ('compliance_vault',  'ComplianceVault',  'business_ops',    'no_twin',    '{}',
   'Filings, governance docs, regulatory tracking, audit readiness', 9),
  ('vendor_guard',      'VendorGuard',      'business_ops',    'no_twin',    '{}',
   'Vendor management, contracts, SLA tracking, spend visibility', 10),
  ('partner_bridge',    'PartnerBridge',    'business_ops',    'no_twin',    '{}',
   'Partner ecosystem mapping, channel tracking, co-sell coordination', 11),
  ('growth_desk',       'GrowthDesk',       'business_ops',    'basic_twin', '{trust_insight}',
   'Pipeline, GTM tracking, campaign performance', 12),
  ('hire_pilot',        'HirePilot',        'business_ops',    'basic_twin', '{trust_insight}',
   'Hiring pipeline, team planning, onboarding tracking', 13),
  ('fin_pulse',         'FinPulse',         'business_ops',    'full_twin',
   '{trust_dashboard,drift_detection,simulation,decision_memory}',
   'Cash flow monitoring, burn rate projection, financial alerts', 14),
  ('ops_core',          'OpsCore',          'business_ops',    'full_twin',
   '{trust_dashboard,drift_detection,simulation,decision_memory,triage_inbox}',
   'Full Entity 360 of the business, Twin-generated weekly briefs', 15),

  -- Personal Space (5)
  ('wealth_pilot',      'WealthPilot',      'personal_space',  'no_twin',    '{}',
   'Personal finance tracking, budgeting, investment visibility', 16),
  ('wellness_core',     'WellnessCore',     'personal_space',  'no_twin',    '{}',
   'Health metrics, fitness tracking, wellness routine management', 17),
  ('learning_desk',     'LearningDesk',     'personal_space',  'basic_twin', '{trust_insight}',
   'Courses, reading, certifications, skill development', 18),
  ('relationship_map',  'RelationshipMap',  'personal_space',  'basic_twin', '{trust_insight}',
   'Personal CRM, network management, follow-up tracking', 19),
  ('life_ops',          'LifeOps',          'personal_space',  'full_twin',
   '{trust_dashboard,drift_detection,simulation,decision_memory,triage_inbox}',
   'Full personal Entity 360, Twin-generated weekly life brief', 20)
ON CONFLICT (product_id) DO UPDATE SET
  display_name  = EXCLUDED.display_name,
  surface       = EXCLUDED.surface,
  twin_tier     = EXCLUDED.twin_tier,
  l2_components = EXCLUDED.l2_components,
  description   = EXCLUDED.description,
  sort_order    = EXCLUDED.sort_order;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: Adaptive Entity Mapping
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- 3.1 product_schema — Maps products to entity types
--
-- Scope columns (tenant_id, org_id, team_id):
--   ALL NULL  = global default (used initially for all users)
--   tenant    = tenant-specific override
--   tenant+org = org-specific override
--   tenant+org+team = team-specific override
--
-- Resolution cascade (most specific wins):
--   team → org → tenant → global
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_schema (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   TEXT NOT NULL REFERENCES public.product_catalog(product_id) ON DELETE CASCADE,
  entity_type  TEXT NOT NULL,
  is_primary   BOOLEAN DEFAULT false,
  sort_order   INT DEFAULT 0,
  -- Scope: NULL = global default
  tenant_id    UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  org_id       UUID REFERENCES public.organizations(org_id) ON DELETE CASCADE,
  team_id      UUID REFERENCES public.teams(team_id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one mapping per product+entity+scope
-- COALESCE handles NULL uniqueness (PostgreSQL treats NULL != NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_schema_unique
ON public.product_schema (
  product_id,
  entity_type,
  COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(org_id,    '00000000-0000-0000-0000-000000000000'),
  COALESCE(team_id,   '00000000-0000-0000-0000-000000000000')
);

CREATE INDEX IF NOT EXISTS idx_product_schema_product ON public.product_schema(product_id);
CREATE INDEX IF NOT EXISTS idx_product_schema_scope ON public.product_schema(tenant_id, org_id, team_id);

ALTER TABLE public.product_schema ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schema_read" ON public.product_schema;
CREATE POLICY "schema_read" ON public.product_schema
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "schema_service" ON public.product_schema;
CREATE POLICY "schema_service" ON public.product_schema
  FOR ALL TO service_role USING (true);


-- ---------------------------------------------------------------------------
-- 3.2 Seed: Global defaults for all 20 products
--
-- These are the entity types each product renders by default.
-- When a new connector adds entity types, INSERT rows here.
-- When a team needs custom mapping, INSERT rows with their scope.
-- ---------------------------------------------------------------------------

-- Helper to bulk-insert (product_id, entity_type, is_primary, sort_order)
-- All with NULL scope = global defaults
-- 1. DataSentinel — Data quality, anomaly detection, identity resolution
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('data_sentinel', 'account',           true,  1),
  ('data_sentinel', 'contact',           false, 2),
  ('data_sentinel', 'signal',            false, 3),
  ('data_sentinel', 'metric',            false, 4),
  ('data_sentinel', 'generated_insight', false, 5)
ON CONFLICT DO NOTHING;

-- 2. VaultGuard — Contracts, renewals, documents
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('vault_guard', 'contract',          true,  1),
  ('vault_guard', 'renewal',           false, 2),
  ('vault_guard', 'account',           false, 3),
  ('vault_guard', 'file',              false, 4),
  ('vault_guard', 'clause',            false, 5),
  ('vault_guard', 'obligation',        false, 6),
  ('vault_guard', 'generated_insight', false, 7)
ON CONFLICT DO NOTHING;

-- 3. ArchitectIQ — Integration landscape, connector health
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('architect_iq', 'api_portfolio',          true,  1),
  ('architect_iq', 'platform_health_metric', false, 2),
  ('architect_iq', 'account',                false, 3),
  ('architect_iq', 'generated_insight',      false, 4)
ON CONFLICT DO NOTHING;

-- 4. TemplateForge — Playbooks, templates, workflows
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('template_forge', 'workflow',          true,  1),
  ('template_forge', 'success_plan',      false, 2),
  ('template_forge', 'task',              false, 3),
  ('template_forge', 'generated_insight', false, 4)
ON CONFLICT DO NOTHING;

-- 5. SuccessPilot — CSM Accounts Hub (ALREADY WIRED: csm-accounts-hub.tsx)
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('success_pilot', 'account_master',    true,  1),
  ('success_pilot', 'task_item',         false, 2),
  ('success_pilot', 'engagement_log',    false, 3),
  ('success_pilot', 'risk',              false, 4),
  ('success_pilot', 'generated_insight', false, 5),
  ('success_pilot', 'account_health',    false, 6),
  ('success_pilot', 'engagement',        false, 7),
  ('success_pilot', 'contact',           false, 8),
  ('success_pilot', 'renewal',           false, 9)
ON CONFLICT DO NOTHING;

-- 6. DealDesk — Expansion, upsell, commercial intelligence
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('deal_desk', 'opportunity',       true,  1),
  ('deal_desk', 'deal',              false, 2),
  ('deal_desk', 'account',           false, 3),
  ('deal_desk', 'quote',             false, 4),
  ('deal_desk', 'contact',           false, 5),
  ('deal_desk', 'revenue_metric',    false, 6),
  ('deal_desk', 'pipeline_stage',    false, 7),
  ('deal_desk', 'generated_insight', false, 8)
ON CONFLICT DO NOTHING;

-- 7. ChurnShield — Predictive churn (ALREADY WIRED: intelligence-center.tsx)
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('churn_shield', 'account_master',    true,  1),
  ('churn_shield', 'risk_register',     false, 2),
  ('churn_shield', 'people_team',       false, 3),
  ('churn_shield', 'risk',              false, 4),
  ('churn_shield', 'generated_insight', false, 5),
  ('churn_shield', 'account_health',    false, 6),
  ('churn_shield', 'engagement',        false, 7),
  ('churn_shield', 'signal',            false, 8)
ON CONFLICT DO NOTHING;

-- 8. SuccessCommand — Entity 360 (ALREADY WIRED: strategic-account-success.tsx)
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('success_command', 'account_master',         true,  1),
  ('success_command', 'strategic_objective',    false, 2),
  ('success_command', 'initiative',             false, 3),
  ('success_command', 'stakeholder_outcome',    false, 4),
  ('success_command', 'capability',             false, 5),
  ('success_command', 'value_stream',           false, 6),
  ('success_command', 'api_portfolio',          false, 7),
  ('success_command', 'platform_health_metric', false, 8),
  ('success_command', 'business_context',       false, 9),
  ('success_command', 'success_plan',           false, 10),
  ('success_command', 'people_team',            false, 11),
  ('success_command', 'generated_insight',      false, 12)
ON CONFLICT DO NOTHING;

-- 9. ComplianceVault — Filings, governance
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('compliance_vault', 'compliance_item',    true,  1),
  ('compliance_vault', 'contract',           false, 2),
  ('compliance_vault', 'obligation',         false, 3),
  ('compliance_vault', 'file',               false, 4),
  ('compliance_vault', 'generated_insight',  false, 5)
ON CONFLICT DO NOTHING;

-- 10. VendorGuard — Vendor management
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('vendor_guard', 'vendor',            true,  1),
  ('vendor_guard', 'contract',          false, 2),
  ('vendor_guard', 'purchase_order',    false, 3),
  ('vendor_guard', 'compliance_check',  false, 4),
  ('vendor_guard', 'generated_insight', false, 5)
ON CONFLICT DO NOTHING;

-- 11. PartnerBridge — Partner ecosystem
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('partner_bridge', 'account',           true,  1),
  ('partner_bridge', 'contact',           false, 2),
  ('partner_bridge', 'deal',              false, 3),
  ('partner_bridge', 'opportunity',       false, 4),
  ('partner_bridge', 'activity',          false, 5),
  ('partner_bridge', 'generated_insight', false, 6)
ON CONFLICT DO NOTHING;

-- 12. GrowthDesk — Pipeline, GTM
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('growth_desk', 'opportunity',       true,  1),
  ('growth_desk', 'lead',              false, 2),
  ('growth_desk', 'campaign',          false, 3),
  ('growth_desk', 'pipeline_stage',    false, 4),
  ('growth_desk', 'marketing_metric',  false, 5),
  ('growth_desk', 'attribution',       false, 6),
  ('growth_desk', 'generated_insight', false, 7)
ON CONFLICT DO NOTHING;

-- 13. HirePilot — Hiring pipeline
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('hire_pilot', 'employee',          true,  1),
  ('hire_pilot', 'comp_band',         false, 2),
  ('hire_pilot', 'attrition_risk',    false, 3),
  ('hire_pilot', 'task',              false, 4),
  ('hire_pilot', 'activity',          false, 5),
  ('hire_pilot', 'generated_insight', false, 6)
ON CONFLICT DO NOTHING;

-- 14. FinPulse — Cash flow, burn, invoicing
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('fin_pulse', 'cash_flow',          true,  1),
  ('fin_pulse', 'invoice',            false, 2),
  ('fin_pulse', 'payment',            false, 3),
  ('fin_pulse', 'expense',            false, 4),
  ('fin_pulse', 'budget',             false, 5),
  ('fin_pulse', 'revenue_entry',      false, 6),
  ('fin_pulse', 'financial_report',   false, 7),
  ('fin_pulse', 'forecast_entry',     false, 8),
  ('fin_pulse', 'cost_center',        false, 9),
  ('fin_pulse', 'vendor',             false, 10),
  ('fin_pulse', 'tax_filing',         false, 11),
  ('fin_pulse', 'generated_insight',  false, 12)
ON CONFLICT DO NOTHING;

-- 15. OpsCore — Full business Entity 360 (ALREADY WIRED: ceo/coo/cio/founder views)
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('ops_core', 'account',              true,  1),
  ('ops_core', 'opportunity',          false, 2),
  ('ops_core', 'okr',                  false, 3),
  ('ops_core', 'ops_metric',           false, 4),
  ('ops_core', 'task',                 false, 5),
  ('ops_core', 'workflow',             false, 6),
  ('ops_core', 'cross_dept_initiative',false, 7),
  ('ops_core', 'kpi',                  false, 8),
  ('ops_core', 'activity',             false, 9),
  ('ops_core', 'project',              false, 10),
  ('ops_core', 'resource_allocation',  false, 11),
  ('ops_core', 'contact',              false, 12),
  ('ops_core', 'generated_insight',    false, 13)
ON CONFLICT DO NOTHING;

-- 16. WealthPilot — Personal finance
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('wealth_pilot', 'expense',           true,  1),
  ('wealth_pilot', 'budget',            false, 2),
  ('wealth_pilot', 'payment',           false, 3),
  ('wealth_pilot', 'goal',              false, 4),
  ('wealth_pilot', 'generated_insight', false, 5)
ON CONFLICT DO NOTHING;

-- 17. WellnessCore — Health metrics
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('wellness_core', 'goal',              true,  1),
  ('wellness_core', 'metric',            false, 2),
  ('wellness_core', 'daily_reflection',  false, 3),
  ('wellness_core', 'generated_insight', false, 4)
ON CONFLICT DO NOTHING;

-- 18. LearningDesk — Courses, learning
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('learning_desk', 'course',             true,  1),
  ('learning_desk', 'assignment',         false, 2),
  ('learning_desk', 'grade',              false, 3),
  ('learning_desk', 'learning_objective', false, 4),
  ('learning_desk', 'generated_insight',  false, 5)
ON CONFLICT DO NOTHING;

-- 19. RelationshipMap — Personal CRM
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('relationship_map', 'contact',           true,  1),
  ('relationship_map', 'account',           false, 2),
  ('relationship_map', 'activity',          false, 3),
  ('relationship_map', 'engagement',        false, 4),
  ('relationship_map', 'note',              false, 5),
  ('relationship_map', 'generated_insight', false, 6)
ON CONFLICT DO NOTHING;

-- 20. LifeOps — Personal Entity 360 (ALREADY WIRED: knowledge-hub, founder-today)
INSERT INTO public.product_schema (product_id, entity_type, is_primary, sort_order) VALUES
  ('life_ops', 'task',              true,  1),
  ('life_ops', 'note',              false, 2),
  ('life_ops', 'activity',          false, 3),
  ('life_ops', 'calendar_event',    false, 4),
  ('life_ops', 'bookmark',          false, 5),
  ('life_ops', 'goal',              false, 6),
  ('life_ops', 'daily_reflection',  false, 7),
  ('life_ops', 'generated_insight', false, 8)
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: RPCs
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- 4.1 get_product_catalog() — List all 20 products
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_product_catalog()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'product_id',    product_id,
      'display_name',  display_name,
      'surface',       surface,
      'twin_tier',     twin_tier,
      'l2_components', l2_components,
      'description',   description,
      'sort_order',    sort_order
    ) ORDER BY sort_order
  ), '[]'::jsonb)
  FROM public.product_catalog;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_catalog() TO authenticated;


-- ---------------------------------------------------------------------------
-- 4.2 get_product_schema(product_id) — Entity types for a product
--
-- Returns array of { entity_type, is_primary, sort_order }
-- Uses cascade: team → org → tenant → global
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_product_schema(p_product_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_org_id    UUID;
  v_team_id   UUID;
  v_result    JSONB;
BEGIN
  -- Get user context
  SELECT p.tenant_id, p.org_id, p.team_id
  INTO v_tenant_id, v_org_id, v_team_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Cascade: team → org → tenant → global
  -- 1. Team-level
  SELECT jsonb_agg(
    jsonb_build_object(
      'entity_type', entity_type,
      'is_primary',  is_primary,
      'sort_order',  sort_order
    ) ORDER BY sort_order, entity_type
  ) INTO v_result
  FROM public.product_schema
  WHERE product_id = p_product_id
    AND tenant_id = v_tenant_id AND org_id = v_org_id AND team_id = v_team_id;
  IF v_result IS NOT NULL THEN RETURN v_result; END IF;

  -- 2. Org-level
  SELECT jsonb_agg(
    jsonb_build_object(
      'entity_type', entity_type,
      'is_primary',  is_primary,
      'sort_order',  sort_order
    ) ORDER BY sort_order, entity_type
  ) INTO v_result
  FROM public.product_schema
  WHERE product_id = p_product_id
    AND tenant_id = v_tenant_id AND org_id = v_org_id AND team_id IS NULL;
  IF v_result IS NOT NULL THEN RETURN v_result; END IF;

  -- 3. Tenant-level
  SELECT jsonb_agg(
    jsonb_build_object(
      'entity_type', entity_type,
      'is_primary',  is_primary,
      'sort_order',  sort_order
    ) ORDER BY sort_order, entity_type
  ) INTO v_result
  FROM public.product_schema
  WHERE product_id = p_product_id
    AND tenant_id = v_tenant_id AND org_id IS NULL AND team_id IS NULL;
  IF v_result IS NOT NULL THEN RETURN v_result; END IF;

  -- 4. Global default
  SELECT jsonb_agg(
    jsonb_build_object(
      'entity_type', entity_type,
      'is_primary',  is_primary,
      'sort_order',  sort_order
    ) ORDER BY sort_order, entity_type
  ) INTO v_result
  FROM public.product_schema
  WHERE product_id = p_product_id
    AND tenant_id IS NULL AND org_id IS NULL AND team_id IS NULL;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_schema(TEXT) TO authenticated;


-- ---------------------------------------------------------------------------
-- 4.3 get_product_entities(product_id, limit, offset) — Data for a product
--
-- Resolves entity types via get_product_schema cascade, then delegates
-- to get_workspace_entities() for actual data fetching.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_product_entities(
  p_product_id  TEXT,
  p_limit       INT DEFAULT 100,
  p_offset      INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id    UUID;
  v_org_id       UUID;
  v_team_id      UUID;
  v_entity_types TEXT[];
BEGIN
  -- Get user context
  SELECT p.tenant_id, p.org_id, p.team_id
  INTO v_tenant_id, v_org_id, v_team_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'NO_TENANT: No tenant context for user %', auth.uid();
  END IF;

  -- Resolve entity types with cascade: team → org → tenant → global
  -- Team-level
  SELECT array_agg(entity_type ORDER BY sort_order, entity_type)
  INTO v_entity_types
  FROM public.product_schema
  WHERE product_id = p_product_id
    AND tenant_id = v_tenant_id AND org_id = v_org_id AND team_id = v_team_id;

  -- Org-level fallback
  IF v_entity_types IS NULL THEN
    SELECT array_agg(entity_type ORDER BY sort_order, entity_type)
    INTO v_entity_types
    FROM public.product_schema
    WHERE product_id = p_product_id
      AND tenant_id = v_tenant_id AND org_id = v_org_id AND team_id IS NULL;
  END IF;

  -- Tenant-level fallback
  IF v_entity_types IS NULL THEN
    SELECT array_agg(entity_type ORDER BY sort_order, entity_type)
    INTO v_entity_types
    FROM public.product_schema
    WHERE product_id = p_product_id
      AND tenant_id = v_tenant_id AND org_id IS NULL AND team_id IS NULL;
  END IF;

  -- Global fallback
  IF v_entity_types IS NULL THEN
    SELECT array_agg(entity_type ORDER BY sort_order, entity_type)
    INTO v_entity_types
    FROM public.product_schema
    WHERE product_id = p_product_id
      AND tenant_id IS NULL AND org_id IS NULL AND team_id IS NULL;
  END IF;

  -- No entity types found for this product
  IF v_entity_types IS NULL OR array_length(v_entity_types, 1) IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Delegate to existing battle-tested RPC from 070
  RETURN public.get_workspace_entities(v_entity_types, p_limit, p_offset);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_entities(TEXT, INT, INT) TO authenticated;


COMMIT;
