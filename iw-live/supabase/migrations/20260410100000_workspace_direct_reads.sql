-- =============================================================================
-- 070_workspace_direct_reads.sql
-- Direct Supabase reads for workspace views (Phase 4 — eliminate Gateway chain)
--
-- Creates:
--   1. public.entity_type_map       — entity_type → schema.table.pk lookup
--   2. public.entity_type_aliases   — alias → canonical entity_type
--   3. public.get_workspace_entities()  — SECURITY DEFINER RPC (batch read)
--   4. public.get_entity_count()        — SECURITY DEFINER RPC (count)
--
-- Security model:
--   - Resolves tenant_id from profiles via auth.uid()  (same as get_tenant_id())
--   - SECURITY DEFINER bypasses per-schema GRANT restrictions
--   - Checks table existence before querying (handles un-provisioned tenants)
--   - Returns [] for unknown entity types (graceful degradation)
--
-- Performance:
--   Frontend calls supabase.rpc('get_workspace_entities', { p_entity_types: [...] })
--   One DB round-trip replaces N × (Frontend→Gateway→BFF→Spine→Supabase) hops
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Entity Type Map
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entity_type_map (
  entity_type  TEXT PRIMARY KEY,
  schema_name  TEXT NOT NULL,
  table_name   TEXT NOT NULL,
  pk_column    TEXT NOT NULL
);

-- Enable RLS but allow authenticated reads
ALTER TABLE public.entity_type_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entity_type_map_read" ON public.entity_type_map;
CREATE POLICY "entity_type_map_read" ON public.entity_type_map
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "entity_type_map_service" ON public.entity_type_map;
CREATE POLICY "entity_type_map_service" ON public.entity_type_map
  FOR ALL TO service_role USING (true);

-- Seed — matches ENTITY_TYPE_TO_TABLE in services/spine-v2/src/index.ts
INSERT INTO public.entity_type_map (entity_type, schema_name, table_name, pk_column) VALUES
  -- Core Spine
  ('account',              'spine',     'account',              'account_id'),
  ('contact',              'spine',     'contact',              'contact_id'),
  ('goal',                 'spine',     'goal',                 'goal_id'),
  ('metric',               'spine',     'metric',              'metric_id'),
  ('signal',               'spine',     'signal',              'signal_id'),
  ('context_extraction',   'spine',     'context_extraction',  'extraction_id'),
  ('file',                 'spine',     'file',                'file_id'),
  ('evidence_ref',         'spine',     'evidence_ref',        'evidence_id'),
  ('action',               'spine',     'action',              'action_id'),
  ('note',                 'spine',     'note',                'note_id'),
  ('calendar_event',       'spine',     'calendar_event',      'event_id'),
  ('bookmark',             'spine',     'bookmark',            'bookmark_id'),
  ('daily_reflection',     'spine',     'daily_reflection',    'reflection_id'),
  -- Sales
  ('deal',                 'sales',     'deal',                'deal_id'),
  ('opportunity',          'sales',     'opportunity',         'opportunity_id'),
  ('lead',                 'sales',     'lead',                'lead_id'),
  ('pipeline_stage',       'sales',     'pipeline_stage',      'stage_id'),
  ('quote',                'sales',     'quote',               'quote_id'),
  ('sales_sequence',       'sales',     'sales_sequence',      'sequence_id'),
  ('call_log',             'sales',     'call_log',            'call_id'),
  ('email_sequence',       'sales',     'email_sequence',      'sequence_id'),
  ('competitor_intel',     'sales',     'competitor_intel',     'intel_id'),
  -- Marketing
  ('campaign',             'marketing', 'campaign',            'campaign_id'),
  ('campaign_block',       'marketing', 'campaign_block',      'block_id'),
  ('audience',             'marketing', 'audience',            'audience_id'),
  ('interaction_event',    'marketing', 'interaction_event',   'event_id'),
  ('delivery',             'marketing', 'delivery',            'delivery_id'),
  ('landing_page',         'marketing', 'landing_page',        'page_id'),
  ('email_campaign',       'marketing', 'email_campaign',      'campaign_id'),
  ('social_post',          'marketing', 'social_post',         'post_id'),
  ('content_asset_marketing', 'marketing', 'content_asset',   'asset_id'),
  ('attribution_touchpoint', 'marketing', 'attribution_touchpoint', 'touchpoint_id'),
  ('ab_test',              'marketing', 'ab_test',             'test_id'),
  ('audience_segment',     'marketing', 'audience_segment',    'segment_id'),
  ('marketing_metric',     'marketing', 'marketing_metric',    'metric_id'),
  -- RevOps
  ('quota',                'revops',    'quota',               'quota_id'),
  ('forecast',             'revops',    'forecast',            'forecast_id'),
  ('kpi',                  'revops',    'kpi',                 'kpi_id'),
  ('territory',            'revops',    'territory',           'territory_id'),
  ('comp_plan',            'revops',    'comp_plan',           'plan_id'),
  ('revenue_metric',       'revops',    'revenue_metric',      'metric_id'),
  ('attribution',          'revops',    'attribution',         'attribution_id'),
  ('segment_rule',         'revops',    'segment_rule',        'rule_id'),
  -- Customer Success
  ('account_health',       'cs',        'account_health',      'health_id'),
  ('account_master',       'cs',        'account_master',      'account_id'),
  ('renewal',              'cs',        'renewal',             'renewal_id'),
  ('renewal_tracker',      'cs',        'renewal',             'renewal_id'),
  ('outcome',              'cs',        'outcome',             'outcome_id'),
  ('stakeholder_outcome',  'cs',        'stakeholder_outcome', 'outcome_id'),
  ('risk_register',        'cs',        'risk_register',       'risk_id'),
  ('risk',                 'cs',        'risk_register',       'risk_id'),
  ('value_stream',         'cs',        'value_stream',        'stream_id'),
  ('platform_health_metric', 'cs',      'platform_health_metric', 'metric_id'),
  ('generated_insight',    'cs',        'generated_insight',   'insight_id'),
  ('initiative',           'cs',        'initiative',          'initiative_id'),
  ('task',                 'cs',        'task',                'task_id'),
  ('task_item',            'cs',        'task',                'task_id'),
  ('engagement',           'cs',        'engagement',          'engagement_id'),
  ('engagement_log',       'cs',        'engagement_log',      'engagement_id'),
  ('success_plan',         'cs',        'success_plan',        'plan_id'),
  ('business_context',     'cs',        'business_context',    'context_id'),
  ('strategic_objective',  'cs',        'strategic_objective',  'objective_id'),
  ('capability',           'cs',        'capability',          'capability_id'),
  ('api_portfolio',        'cs',        'api_portfolio',       'api_id'),
  ('people_team',          'cs',        'people_team',         'person_id'),
  -- Support
  ('ticket',               'support',   'ticket',              'ticket_id'),
  ('csat',                 'support',   'csat',                'csat_id'),
  ('sla_policy',           'support',   'sla_policy',          'policy_id'),
  ('csat_survey',          'support',   'csat_survey',         'survey_id'),
  ('escalation',           'support',   'escalation',          'escalation_id'),
  ('queue',                'support',   'queue',               'queue_id'),
  ('agent_performance',    'support',   'agent_performance',   'performance_id'),
  ('service_metric',       'support',   'service_metric',      'metric_id'),
  ('knowledge_article',    'support',   'knowledge_article',   'article_id'),
  -- Engineering
  ('sprint',               'eng',       'sprint',              'sprint_id'),
  ('incident',             'eng',       'incident',            'incident_id'),
  ('deploy',               'eng',       'deploy',              'deploy_id'),
  ('bug',                  'eng',       'bug',                 'bug_id'),
  ('release',              'eng',       'release',             'release_id'),
  ('repository',           'eng',       'repository',          'repo_id'),
  ('pull_request',         'eng',       'pull_request',        'pr_id'),
  ('deployment',           'eng',       'deployment',          'deploy_id'),
  ('engineering_metric',   'eng',       'engineering_metric',  'metric_id'),
  -- Product
  ('feature',              'product',   'feature',             'feature_id'),
  ('usage_metric',         'product',   'usage_metric',        'usage_metric_id'),
  ('feedback',             'product',   'feedback',            'feedback_id'),
  ('roadmap_item',         'product',   'roadmap_item',        'item_id'),
  -- Finance
  ('invoice',              'finance',   'invoice',             'invoice_id'),
  ('payment',              'finance',   'payment',             'payment_id'),
  ('rev_rec_schedule',     'finance',   'rev_rec_schedule',    'schedule_id'),
  ('cash_flow',            'finance',   'cash_flow',           'entry_id'),
  ('expense',              'finance',   'expense',             'expense_id'),
  ('budget',               'finance',   'budget',              'budget_id'),
  ('revenue_entry',        'finance',   'revenue_entry',       'entry_id'),
  ('tax_filing',           'finance',   'tax_filing',          'filing_id'),
  ('financial_report',     'finance',   'financial_report',    'report_id'),
  ('vendor',               'finance',   'vendor',              'vendor_id'),
  ('cost_center',          'finance',   'cost_center',         'center_id'),
  ('forecast_entry',       'finance',   'forecast_entry',      'entry_id'),
  ('compliance_item',      'finance',   'compliance_item',     'item_id'),
  -- Legal
  ('contract',             'legal',     'contract',            'contract_id'),
  ('clause',               'legal',     'clause',              'clause_id'),
  ('obligation',           'legal',     'obligation',          'obligation_id'),
  -- HR
  ('employee',             'hr',        'employee',            'employee_id'),
  ('comp_band',            'hr',        'comp_band',           'band_id'),
  ('employee_engagement',  'hr',        'engagement',          'survey_id'),
  ('attrition_risk',       'hr',        'attrition_risk',      'risk_id'),
  -- Supply Chain
  ('order',                'sc',        'order',               'order_id'),
  ('inventory',            'sc',        'inventory',           'inventory_id'),
  ('supplier',             'sc',        'supplier',            'supplier_id'),
  ('fulfilment',           'sc',        'fulfilment',          'fulfilment_id'),
  -- Service Operations
  ('work_order',           'svc',       'work_order',          'work_order_id'),
  ('asset',                'svc',       'asset',               'asset_id'),
  ('field_technician',     'svc',       'field_technician',    'tech_id'),
  -- BizOps
  ('activity',             'bizops',    'activity',            'activity_id'),
  ('workflow',             'bizops',    'workflow',            'workflow_id'),
  ('okr',                  'bizops',    'okr',                 'okr_id'),
  ('cross_dept_initiative','bizops',    'cross_dept_initiative','initiative_id'),
  ('ops_metric',           'bizops',    'ops_metric',          'metric_id'),
  -- IT Admin
  ('system',               'it',        'system',              'system_id'),
  ('device',               'it',        'device',              'device_id'),
  ('it_user',              'it',        'user',                'user_id'),
  ('change_request',       'it',        'change_request',      'request_id'),
  ('vulnerability',        'it',        'vulnerability',       'vuln_id'),
  ('backup',               'it',        'backup',              'backup_id'),
  ('certificate',          'it',        'certificate',         'cert_id'),
  ('network_device',       'it',        'network_device',      'device_id'),
  ('license',              'it',        'license',             'license_id'),
  ('it_metric',            'it',        'it_metric',           'metric_id'),
  -- Procurement
  ('purchase_order',       'procurement','purchase_order',     'po_id'),
  ('spend_category',       'procurement','spend_category',     'category_id'),
  ('savings_initiative',   'procurement','savings_initiative', 'initiative_id'),
  ('approval_request',     'procurement','approval_request',   'request_id'),
  ('compliance_check',     'procurement','compliance_check',   'check_id'),
  ('procurement_metric',   'procurement','procurement_metric', 'metric_id'),
  -- Education
  ('course',               'industry_edu','course',            'course_id'),
  ('assignment',           'industry_edu','assignment',        'assignment_id'),
  ('grade',                'industry_edu','grade',             'grade_id'),
  ('attendance',           'industry_edu','attendance',        'attendance_id'),
  ('discussion',           'industry_edu','discussion',        'discussion_id'),
  ('learning_objective',   'industry_edu','learning_objective','objective_id'),
  ('intervention',         'industry_edu','intervention',      'intervention_id'),
  ('student_metric',       'industry_edu','student_metric',    'metric_id'),
  ('student',              'industry_edu','student',           'student_id'),
  ('enrollment',           'industry_edu','enrollment',        'enrollment_id'),
  -- Industry: SaaS
  ('product_usage',        'industry_saas','product_usage',    'usage_id'),
  ('subscription',         'industry_saas','subscription',     'subscription_id'),
  -- Industry: Professional Services
  ('project',              'industry_ps','project',            'project_id'),
  ('resource_allocation',  'industry_ps','resource_allocation','allocation_id'),
  -- Industry: Healthcare
  ('patient',              'industry_hc','patient',            'patient_id'),
  ('claim',                'industry_hc','claim',              'claim_id'),
  ('provider',             'industry_hc','provider',           'provider_id'),
  -- Industry: Manufacturing
  ('bom',                  'industry_mfg','bom',               'bom_id'),
  ('production_order',     'industry_mfg','production_order',  'po_id'),
  -- Industry: Automotive
  ('vehicle',              'industry_auto','vehicle',           'vehicle_id'),
  ('service_record',       'industry_auto','service_record',   'record_id'),
  -- Industry: Retail
  ('sku',                  'industry_retail','sku',             'sku_id'),
  ('pos_transaction',      'industry_retail','pos_transaction', 'txn_id'),
  -- Industry: Financial Services
  ('portfolio',            'industry_financial','portfolio',    'portfolio_id'),
  ('kyc_record',           'industry_financial','kyc_record',  'kyc_id'),
  -- Industry: Logistics
  ('shipment',             'industry_logistics','shipment',     'shipment_id'),
  ('route',                'industry_logistics','route',        'route_id'),
  -- Industry: Media
  ('content_asset',        'industry_media','content_asset',   'asset_id'),
  ('media_metric',         'industry_media','metric',          'metric_id'),
  -- Industry: Public Sector
  ('citizen',              'industry_public','citizen',         'citizen_id'),
  ('grant',                'industry_public','grant',           'grant_id'),
  ('public_project',       'industry_public','project',         'project_id'),
  -- L2 Cognitive Engine tables (public schema)
  ('trust_source',         'public',    'trust_sources',       'id'),
  ('trust_score',          'public',    'trust_scores',        'id'),
  ('autonomy_override',    'public',    'autonomy_overrides',  'id'),
  ('simulation_scenario',  'public',    'simulation_scenarios', 'id'),
  ('simulation_result',    'public',    'simulation_results',  'id'),
  ('drift_event',          'public',    'drift_events',        'id'),
  ('belief_model',         'public',    'belief_models',       'id'),
  ('reality_monitor',      'public',    'reality_monitors',    'id'),
  ('decision',             'public',    'decisions',           'id'),
  ('decision_pattern',     'public',    'decision_patterns',   'id'),
  ('decision_outcome',     'public',    'decision_outcomes',   'id')
ON CONFLICT (entity_type) DO UPDATE SET
  schema_name = EXCLUDED.schema_name,
  table_name  = EXCLUDED.table_name,
  pk_column   = EXCLUDED.pk_column;


-- ---------------------------------------------------------------------------
-- 2. Entity Type Aliases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entity_type_aliases (
  alias           TEXT PRIMARY KEY,
  canonical_type  TEXT NOT NULL
);

ALTER TABLE public.entity_type_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aliases_read" ON public.entity_type_aliases;
CREATE POLICY "aliases_read" ON public.entity_type_aliases
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "aliases_service" ON public.entity_type_aliases;
CREATE POLICY "aliases_service" ON public.entity_type_aliases
  FOR ALL TO service_role USING (true);

INSERT INTO public.entity_type_aliases (alias, canonical_type) VALUES
  -- Spine aliases (from ENTITY_TYPE_ALIASES in spine-v2)
  ('companies',            'account'),
  ('contacts',             'contact'),
  ('deals',                'deal'),
  ('opportunities',        'opportunity'),
  ('accounts',             'account'),
  ('customers',            'account'),
  ('issues',               'ticket'),
  ('pull_requests',        'pull_request'),
  ('messages',             'interaction_event'),
  ('tickets',              'ticket'),
  ('invoices',             'invoice'),
  ('subscriptions',        'subscription'),
  ('orders',               'order'),
  ('channels',             'audience'),
  ('pages',                'file'),
  ('repositories',         'repository'),
  ('sprints',              'sprint'),
  ('risks',                'risk'),
  ('renewals',             'renewal'),
  ('insights',             'generated_insight'),
  ('health_metrics',       'platform_health_metric'),
  ('tableau_views',        'platform_health_metric'),
  ('tableau_workbooks',    'value_stream'),
  ('leads',                'lead'),
  ('tasks',                'task'),
  ('task_items',           'task_item'),
  ('notes',                'note'),
  ('events',               'calendar_event'),
  ('meetings',             'activity'),
  ('calls',                'call_log'),
  ('emails',               'email_sequence'),
  ('campaigns',            'campaign'),
  ('workflows',            'workflow'),
  ('projects',             'project'),
  ('bugs',                 'bug'),
  ('features',             'feature'),
  ('incidents',            'incident'),
  ('deployments',          'deployment'),
  ('releases',             'release'),
  ('vendors',              'vendor'),
  ('expenses',             'expense'),
  ('payments',             'payment'),
  ('budgets',              'budget'),
  ('devices',              'device'),
  ('systems',              'system'),
  ('certificates',         'certificate'),
  ('vulnerabilities',      'vulnerability'),
  ('students',             'student'),
  ('courses',              'course'),
  ('assignments',          'assignment'),
  ('grades',               'grade'),
  ('account_masters',      'account_master'),
  ('engagement_logs',      'engagement_log'),
  ('success_plans',        'success_plan'),
  ('risk_registers',       'risk_register'),
  ('strategic_objectives', 'strategic_objective'),
  ('capabilities',         'capability'),
  ('initiatives',          'initiative'),
  ('people_teams',         'people_team'),
  -- Frontend-specific aliases (used by views but not in spine-v2 map)
  ('insight',              'generated_insight'),
  ('platform_health',      'platform_health_metric'),
  ('meeting',              'activity'),
  ('document',             'file'),
  ('bookmarks',            'bookmark'),
  ('knowledge_articles',   'knowledge_article'),
  -- L2 cognitive panel aliases (plural → canonical)
  ('trust_sources',        'trust_source'),
  ('trust_scores',         'trust_score'),
  ('autonomy_overrides',   'autonomy_override'),
  ('simulations',          'simulation_scenario'),
  ('drift_events',         'drift_event'),
  ('active_beliefs',       'belief_model'),
  ('decisions',            'decision'),
  ('decision_patterns',    'decision_pattern')
ON CONFLICT (alias) DO UPDATE SET
  canonical_type = EXCLUDED.canonical_type;


-- ---------------------------------------------------------------------------
-- 3. get_workspace_entities() — Batch read RPC
-- ---------------------------------------------------------------------------
-- Frontend calls: supabase.rpc('get_workspace_entities', { p_entity_types, p_limit, p_offset })
-- Returns: { "account_master": [...], "task_item": [...], ... }
--
-- One DB round-trip replaces:
--   Frontend → Gateway → BFF (workflow) → Spine → Supabase (×N entity types)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_workspace_entities(
  p_entity_types  TEXT[],
  p_limit         INT DEFAULT 100,
  p_offset        INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id   UUID;
  v_result      JSONB := '{}'::jsonb;
  v_raw_et      TEXT;
  v_et          TEXT;
  v_schema      TEXT;
  v_tbl         TEXT;
  v_rows        JSONB;
  v_alias_target TEXT;
BEGIN
  -- ── Resolve tenant_id from profiles (same approach as get_tenant_id()) ──
  SELECT tenant_id INTO v_tenant_id
    FROM public.profiles
   WHERE id = auth.uid();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'NO_TENANT: No tenant context for user %', auth.uid();
  END IF;

  -- ── Iterate requested entity types ──
  FOREACH v_raw_et IN ARRAY p_entity_types
  LOOP
    v_et := v_raw_et;

    -- Resolve alias → canonical type
    SELECT canonical_type INTO v_alias_target
      FROM public.entity_type_aliases
     WHERE alias = v_et;

    IF v_alias_target IS NOT NULL THEN
      v_et := v_alias_target;
    END IF;

    -- Look up schema + table
    SELECT schema_name, table_name INTO v_schema, v_tbl
      FROM public.entity_type_map
     WHERE entity_type = v_et;

    IF v_schema IS NULL THEN
      -- Unknown entity type → return empty array under the original key
      v_result := v_result || jsonb_build_object(v_raw_et, '[]'::jsonb);
      CONTINUE;
    END IF;

    -- Check table actually exists (tenant may not be provisioned for this domain)
    IF to_regclass(format('%I.%I', v_schema, v_tbl)) IS NULL THEN
      v_result := v_result || jsonb_build_object(v_raw_et, '[]'::jsonb);
      CONTINUE;
    END IF;

    -- Query with tenant isolation
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t.*)), ''[]''::jsonb)
         FROM (SELECT * FROM %I.%I
                WHERE tenant_id = $1
                ORDER BY updated_at DESC NULLS LAST
                LIMIT $2 OFFSET $3) t',
      v_schema, v_tbl
    ) INTO v_rows USING v_tenant_id, p_limit, p_offset;

    -- Key the result under the ORIGINAL requested name (not the resolved canonical)
    v_result := v_result || jsonb_build_object(v_raw_et, COALESCE(v_rows, '[]'::jsonb));
  END LOOP;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users (frontend)
GRANT EXECUTE ON FUNCTION public.get_workspace_entities(TEXT[], INT, INT) TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. get_entity_count() — Count RPC for dashboard widgets
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_entity_count(
  p_entity_types  TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id    UUID;
  v_result       JSONB := '{}'::jsonb;
  v_raw_et       TEXT;
  v_et           TEXT;
  v_schema       TEXT;
  v_tbl          TEXT;
  v_cnt          BIGINT;
  v_alias_target TEXT;
BEGIN
  SELECT tenant_id INTO v_tenant_id
    FROM public.profiles
   WHERE id = auth.uid();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'NO_TENANT: No tenant context for user %', auth.uid();
  END IF;

  FOREACH v_raw_et IN ARRAY p_entity_types
  LOOP
    v_et := v_raw_et;

    SELECT canonical_type INTO v_alias_target
      FROM public.entity_type_aliases
     WHERE alias = v_et;

    IF v_alias_target IS NOT NULL THEN
      v_et := v_alias_target;
    END IF;

    SELECT schema_name, table_name INTO v_schema, v_tbl
      FROM public.entity_type_map
     WHERE entity_type = v_et;

    IF v_schema IS NULL OR to_regclass(format('%I.%I', v_schema, v_tbl)) IS NULL THEN
      v_result := v_result || jsonb_build_object(v_raw_et, 0);
      CONTINUE;
    END IF;

    EXECUTE format(
      'SELECT COUNT(*) FROM %I.%I WHERE tenant_id = $1',
      v_schema, v_tbl
    ) INTO v_cnt USING v_tenant_id;

    v_result := v_result || jsonb_build_object(v_raw_et, COALESCE(v_cnt, 0));
  END LOOP;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_entity_count(TEXT[]) TO authenticated;

COMMIT;
