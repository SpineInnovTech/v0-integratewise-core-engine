-- =============================================================================
-- 078_demo_data_system.sql
-- Demo Data System — Auto-seed on signup + one-click cleanup
--
-- Problem:
--   New users see empty views after signup. A guided demo dataset helps them
--   explore the full application before connecting real data sources.
--
-- Solution:
--   1. Modify get_workspace_entities() to fall back to Architecture B when A
--      is empty, with JSONB data flattening so B rows look like A rows
--   2. Modify get_entity_count() with same A→B empty fallback
--   3. Create seed_demo_data(tenant_id) — inserts demo entities + actions
--   4. Create cleanup_demo_data() — removes all demo data for calling tenant
--   5. Create has_demo_data() — boolean check for frontend banner
--   6. Update handle_new_user() to auto-seed on signup (non-blocking)
--
-- Demo data markers:
--   - entities.source = 'demo_seed'
--   - actions.agent_id = 'DEMO_SEED'
--   - tenants.settings.has_demo_data = true
--
-- Target market flavor: Indian SMB + Dubai FZE companies
-- =============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: Modify get_workspace_entities() — A→B fallback when A is empty
--         + flatten data JSONB in Architecture B results
-- ═══════════════════════════════════════════════════════════════════════════

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
  v_tenant_id    UUID;
  v_result       JSONB := '{}'::jsonb;
  v_raw_et       TEXT;
  v_et           TEXT;
  v_schema       TEXT;
  v_tbl          TEXT;
  v_rows         JSONB;
  v_alias_target TEXT;
  v_arch         TEXT;  -- 'A' or 'B'
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
    v_arch := NULL;

    -- Resolve alias → canonical type
    SELECT canonical_type INTO v_alias_target
      FROM public.entity_type_aliases
     WHERE alias = v_et;

    IF v_alias_target IS NOT NULL THEN
      v_et := v_alias_target;
    END IF;

    -- Look up schema + table from entity_type_map
    SELECT schema_name, table_name INTO v_schema, v_tbl
      FROM public.entity_type_map
     WHERE entity_type = v_et;

    IF v_schema IS NULL THEN
      -- Unknown entity type — not in map at all.
      v_schema := NULL;
      v_tbl := NULL;
    END IF;

    -- ── Architecture A: Try domain-specific typed table ──
    IF v_schema IS NOT NULL AND v_schema <> 'public' THEN
      IF to_regclass(format('%I.%I', v_schema, v_tbl)) IS NOT NULL THEN
        EXECUTE format(
          'SELECT COALESCE(jsonb_agg(row_to_json(t.*)), ''[]''::jsonb)
             FROM (SELECT * FROM %I.%I
                    WHERE tenant_id = $1
                    ORDER BY updated_at DESC NULLS LAST
                    LIMIT $2 OFFSET $3) t',
          v_schema, v_tbl
        ) INTO v_rows USING v_tenant_id, p_limit, p_offset;

        v_arch := 'A';
      END IF;
    END IF;

    -- ── Architecture A (public schema): Some entity types map to public.* tables ──
    IF v_arch IS NULL AND v_schema = 'public' AND v_tbl IS NOT NULL THEN
      IF to_regclass(format('public.%I', v_tbl)) IS NOT NULL THEN
        EXECUTE format(
          'SELECT COALESCE(jsonb_agg(row_to_json(t.*)), ''[]''::jsonb)
             FROM (SELECT * FROM public.%I
                    WHERE tenant_id = $1
                    ORDER BY updated_at DESC NULLS LAST
                    LIMIT $2 OFFSET $3) t',
          v_tbl
        ) INTO v_rows USING v_tenant_id, p_limit, p_offset;

        v_arch := 'A';
      END IF;
    END IF;

    -- ── NEW: If Architecture A returned empty, allow B fallback ──
    IF v_arch = 'A' AND (v_rows IS NULL OR jsonb_array_length(v_rows) = 0) THEN
      v_arch := NULL;  -- Reset to allow Architecture B check
    END IF;

    -- ── Architecture B fallback: public.entities (JSONB) with data flattening ──
    -- Flatten the data JSONB into top-level keys so B rows look like A rows.
    -- Order: data keys first, then entity table columns overlay (table wins for conflicts).
    IF v_arch IS NULL THEN
      IF to_regclass('public.entities') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(sub.merged), '[]'::jsonb)
          INTO v_rows
          FROM (
            SELECT
              COALESCE(e.data, '{}'::jsonb) || jsonb_build_object(
                'id', e.id,
                'tenant_id', e.tenant_id,
                'entity_type', e.entity_type,
                'name', e.name,
                'source', e.source,
                'source_id', e.source_id,
                'slug', e.slug,
                'status', e.status,
                'health_score', e.health_score,
                'tags', to_jsonb(COALESCE(e.tags, '{}'::text[])),
                'last_synced_at', e.last_synced_at,
                'created_at', e.created_at,
                'updated_at', e.updated_at
              ) AS merged
              FROM public.entities e
             WHERE e.tenant_id = v_tenant_id
               AND e.entity_type = v_et
             ORDER BY e.updated_at DESC NULLS LAST
             LIMIT p_limit OFFSET p_offset
          ) sub;

        v_arch := 'B';
      ELSE
        v_rows := '[]'::jsonb;
        v_arch := 'none';
      END IF;
    END IF;

    -- Key the result under the ORIGINAL requested name
    v_result := v_result || jsonb_build_object(
      v_raw_et,
      jsonb_build_object(
        'rows', COALESCE(v_rows, '[]'::jsonb),
        '_architecture', v_arch,
        '_resolved_type', v_et
      )
    );
  END LOOP;

  RETURN v_result;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: Modify get_entity_count() — A→B fallback when A is empty
-- ═══════════════════════════════════════════════════════════════════════════

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
  v_arch         TEXT;
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
    v_arch := NULL;
    v_cnt := 0;

    -- Resolve alias
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

    -- ── Architecture A: domain-specific table ──
    IF v_schema IS NOT NULL AND v_schema <> 'public' THEN
      IF to_regclass(format('%I.%I', v_schema, v_tbl)) IS NOT NULL THEN
        EXECUTE format(
          'SELECT COUNT(*) FROM %I.%I WHERE tenant_id = $1',
          v_schema, v_tbl
        ) INTO v_cnt USING v_tenant_id;

        v_arch := 'A';
      END IF;
    END IF;

    -- ── Architecture A: public schema table ──
    IF v_arch IS NULL AND v_schema = 'public' AND v_tbl IS NOT NULL THEN
      IF to_regclass(format('public.%I', v_tbl)) IS NOT NULL THEN
        EXECUTE format(
          'SELECT COUNT(*) FROM public.%I WHERE tenant_id = $1',
          v_tbl
        ) INTO v_cnt USING v_tenant_id;

        v_arch := 'A';
      END IF;
    END IF;

    -- ── NEW: If Architecture A returned 0, allow B fallback ──
    IF v_arch = 'A' AND v_cnt = 0 THEN
      v_arch := NULL;
    END IF;

    -- ── Architecture B fallback: public.entities ──
    IF v_arch IS NULL THEN
      IF to_regclass('public.entities') IS NOT NULL THEN
        SELECT COUNT(*) INTO v_cnt
          FROM public.entities
         WHERE tenant_id = v_tenant_id
           AND entity_type = v_et;

        v_arch := 'B';
      ELSE
        v_cnt := 0;
        v_arch := 'none';
      END IF;
    END IF;

    v_result := v_result || jsonb_build_object(
      v_raw_et,
      jsonb_build_object(
        'count', COALESCE(v_cnt, 0),
        '_architecture', v_arch
      )
    );
  END LOOP;

  RETURN v_result;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: has_demo_data() — Check if tenant has demo data
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.has_demo_data()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (settings->>'has_demo_data')::boolean
       FROM public.tenants
      WHERE id = get_tenant_id()),
    false
  );
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: seed_demo_data() — Insert guided demo data for a tenant
--
-- Data is flavored for Indian SMB + Dubai FZE target market.
-- All entities use source = 'demo_seed', actions use agent_id = 'DEMO_SEED'.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.seed_demo_data(p_tenant_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tid UUID;
  -- Account IDs (for cross-referencing in actions)
  v_acct_techvista   UUID := gen_random_uuid();
  v_acct_gulftrade   UUID := gen_random_uuid();
  v_acct_pinnacle    UUID := gen_random_uuid();
  v_acct_meridian    UUID := gen_random_uuid();
  v_acct_desertrose  UUID := gen_random_uuid();
  -- For BizOps account entity type
  v_biz_techvista    UUID := gen_random_uuid();
  v_biz_gulftrade    UUID := gen_random_uuid();
  v_biz_pinnacle     UUID := gen_random_uuid();
  v_biz_meridian     UUID := gen_random_uuid();
  v_biz_desertrose   UUID := gen_random_uuid();
BEGIN
  v_tid := COALESCE(p_tenant_id, get_tenant_id());

  IF v_tid IS NULL THEN
    RAISE WARNING 'seed_demo_data: No tenant_id resolved, skipping';
    RETURN;
  END IF;

  -- Skip if demo data already exists
  IF EXISTS (SELECT 1 FROM public.entities WHERE tenant_id = v_tid AND source = 'demo_seed' LIMIT 1) THEN
    RETURN;
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════
  -- Account Success: account_master (5 accounts)
  -- Fields: accountName, healthScore, accountStatus, daysToRenewal,
  --         industry, region, arr, csm, primaryContact
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (id, tenant_id, entity_type, name, source, status, health_score, tags, data) VALUES
  (v_acct_techvista, v_tid, 'account_master', 'TechVista Solutions Pvt Ltd', 'demo_seed', 'Active', 0.82, ARRAY['demo', 'healthy'],
   jsonb_build_object(
     'accountName', 'TechVista Solutions Pvt Ltd',
     'healthScore', 82, 'accountStatus', 'Active', 'daysToRenewal', 120,
     'industry', 'SaaS / Technology', 'region', 'India - South (Bangalore)',
     'arr', 4500000, 'csm', 'Priya Sharma', 'primaryContact', 'Rajesh Kumar',
     'tier', 'Enterprise', 'employees', 250,
     'account_id', v_acct_techvista
   )),
  (v_acct_gulftrade, v_tid, 'account_master', 'Gulf Trade Dynamics FZE', 'demo_seed', 'Active', 0.65, ARRAY['demo', 'medium'],
   jsonb_build_object(
     'accountName', 'Gulf Trade Dynamics FZE',
     'healthScore', 65, 'accountStatus', 'Active', 'daysToRenewal', 45,
     'industry', 'Trading & Distribution', 'region', 'UAE - Dubai (JAFZA)',
     'arr', 2800000, 'csm', 'Aisha Al-Mansoori', 'primaryContact', 'Mohammed Al-Rashid',
     'tier', 'Growth', 'employees', 85,
     'account_id', v_acct_gulftrade
   )),
  (v_acct_pinnacle, v_tid, 'account_master', 'Pinnacle Digital Services', 'demo_seed', 'At Risk', 0.32, ARRAY['demo', 'at-risk'],
   jsonb_build_object(
     'accountName', 'Pinnacle Digital Services',
     'healthScore', 32, 'accountStatus', 'At Risk', 'daysToRenewal', 28,
     'industry', 'Digital Agency', 'region', 'India - West (Mumbai)',
     'arr', 1200000, 'csm', 'Priya Sharma', 'primaryContact', 'Neha Patel',
     'tier', 'Growth', 'employees', 60,
     'riskFactors', '["Declining engagement", "Support tickets increasing", "Key stakeholder left"]',
     'account_id', v_acct_pinnacle
   )),
  (v_acct_meridian, v_tid, 'account_master', 'Meridian Healthcare Ltd', 'demo_seed', 'Active', 0.78, ARRAY['demo', 'healthy'],
   jsonb_build_object(
     'accountName', 'Meridian Healthcare Ltd',
     'healthScore', 78, 'accountStatus', 'Active', 'daysToRenewal', 200,
     'industry', 'Healthcare', 'region', 'India - South (Chennai)',
     'arr', 3200000, 'csm', 'Vikram Reddy', 'primaryContact', 'Dr. Sunita Iyer',
     'tier', 'Enterprise', 'employees', 500,
     'account_id', v_acct_meridian
   )),
  (v_acct_desertrose, v_tid, 'account_master', 'Desert Rose Logistics LLC', 'demo_seed', 'Active', 0.58, ARRAY['demo', 'medium'],
   jsonb_build_object(
     'accountName', 'Desert Rose Logistics LLC',
     'healthScore', 58, 'accountStatus', 'Active', 'daysToRenewal', 75,
     'industry', 'Logistics & Supply Chain', 'region', 'UAE - Dubai (DWC)',
     'arr', 1800000, 'csm', 'Aisha Al-Mansoori', 'primaryContact', 'Omar Hassan',
     'tier', 'Standard', 'employees', 120,
     'account_id', v_acct_desertrose
   ));

  -- ═══════════════════════════════════════════════════════════════════════
  -- BizOps: account (same companies, BizOps view fields)
  -- Fields: name, health, healthScore, arr, csm
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (id, tenant_id, entity_type, name, source, status, health_score, tags, data) VALUES
  (v_biz_techvista, v_tid, 'account', 'TechVista Solutions Pvt Ltd', 'demo_seed', 'active', 0.82, ARRAY['demo'],
   jsonb_build_object('name', 'TechVista Solutions Pvt Ltd', 'health', 'healthy', 'healthScore', 82, 'arr', 4500000, 'csm', 'Priya Sharma')),
  (v_biz_gulftrade, v_tid, 'account', 'Gulf Trade Dynamics FZE', 'demo_seed', 'active', 0.65, ARRAY['demo'],
   jsonb_build_object('name', 'Gulf Trade Dynamics FZE', 'health', 'at-risk', 'healthScore', 65, 'arr', 2800000, 'csm', 'Aisha Al-Mansoori')),
  (v_biz_pinnacle, v_tid, 'account', 'Pinnacle Digital Services', 'demo_seed', 'active', 0.32, ARRAY['demo'],
   jsonb_build_object('name', 'Pinnacle Digital Services', 'health', 'critical', 'healthScore', 32, 'arr', 1200000, 'csm', 'Priya Sharma')),
  (v_biz_meridian, v_tid, 'account', 'Meridian Healthcare Ltd', 'demo_seed', 'active', 0.78, ARRAY['demo'],
   jsonb_build_object('name', 'Meridian Healthcare Ltd', 'health', 'healthy', 'healthScore', 78, 'arr', 3200000, 'csm', 'Vikram Reddy')),
  (v_biz_desertrose, v_tid, 'account', 'Desert Rose Logistics LLC', 'demo_seed', 'active', 0.58, ARRAY['demo'],
   jsonb_build_object('name', 'Desert Rose Logistics LLC', 'health', 'at-risk', 'healthScore', 58, 'arr', 1800000, 'csm', 'Aisha Al-Mansoori'));

  -- ═══════════════════════════════════════════════════════════════════════
  -- Engagement Log (6 entries for CS Today sentiment calculation)
  -- Fields: sentiment, type, account_id, date, summary
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (tenant_id, entity_type, name, source, status, tags, data) VALUES
  (v_tid, 'engagement_log', 'QBR with TechVista', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('sentiment', 'Very Positive', 'type', 'QBR', 'account_id', v_acct_techvista,
     'date', (CURRENT_DATE - INTERVAL '5 days')::text, 'summary', 'Excellent QBR — expansion discussion initiated, stakeholder alignment strong')),
  (v_tid, 'engagement_log', 'Support call with Pinnacle', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('sentiment', 'Negative', 'type', 'Support', 'account_id', v_acct_pinnacle,
     'date', (CURRENT_DATE - INTERVAL '2 days')::text, 'summary', 'Escalation on API latency issues — customer frustrated, SLA at risk')),
  (v_tid, 'engagement_log', 'Email to Gulf Trade', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('sentiment', 'Neutral', 'type', 'Email', 'account_id', v_acct_gulftrade,
     'date', (CURRENT_DATE - INTERVAL '3 days')::text, 'summary', 'Renewal timeline shared — awaiting procurement feedback from Dubai office')),
  (v_tid, 'engagement_log', 'Onboarding call with Meridian', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('sentiment', 'Positive', 'type', 'Meeting', 'account_id', v_acct_meridian,
     'date', (CURRENT_DATE - INTERVAL '1 day')::text, 'summary', 'Phase 2 onboarding progressing well — IT team fully engaged')),
  (v_tid, 'engagement_log', 'Follow-up with Desert Rose', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('sentiment', 'Positive', 'type', 'Email', 'account_id', v_acct_desertrose,
     'date', CURRENT_DATE::text, 'summary', 'Logistics dashboard adoption increasing — requested advanced reporting demo')),
  (v_tid, 'engagement_log', 'Escalation meeting — Pinnacle', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('sentiment', 'Concerning', 'type', 'Meeting', 'account_id', v_acct_pinnacle,
     'date', CURRENT_DATE::text, 'summary', 'Key stakeholder Neha Patel considering alternatives — need executive sponsor engagement'));

  -- ═══════════════════════════════════════════════════════════════════════
  -- CS Task Items (5 for CS Today view)
  -- Fields: status (Open, In Progress, Done)
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (tenant_id, entity_type, name, source, status, tags, data) VALUES
  (v_tid, 'task_item', 'Follow up on Pinnacle support ticket #4521', 'demo_seed', 'Open', ARRAY['demo', 'urgent'],
   jsonb_build_object('status', 'Open', 'priority', 'high', 'account_name', 'Pinnacle Digital Services',
     'due_date', (CURRENT_DATE + INTERVAL '1 day')::text, 'assignee', 'Priya Sharma')),
  (v_tid, 'task_item', 'Schedule TechVista expansion meeting', 'demo_seed', 'In Progress', ARRAY['demo'],
   jsonb_build_object('status', 'In Progress', 'priority', 'medium', 'account_name', 'TechVista Solutions',
     'due_date', (CURRENT_DATE + INTERVAL '3 days')::text, 'assignee', 'Priya Sharma')),
  (v_tid, 'task_item', 'Update Gulf Trade renewal proposal', 'demo_seed', 'Open', ARRAY['demo'],
   jsonb_build_object('status', 'Open', 'priority', 'high', 'account_name', 'Gulf Trade Dynamics FZE',
     'due_date', (CURRENT_DATE + INTERVAL '5 days')::text, 'assignee', 'Aisha Al-Mansoori')),
  (v_tid, 'task_item', 'Complete Meridian onboarding checklist', 'demo_seed', 'In Progress', ARRAY['demo'],
   jsonb_build_object('status', 'In Progress', 'priority', 'medium', 'account_name', 'Meridian Healthcare Ltd',
     'due_date', (CURRENT_DATE + INTERVAL '7 days')::text, 'assignee', 'Vikram Reddy')),
  (v_tid, 'task_item', 'Review Desert Rose SLA metrics', 'demo_seed', 'Done', ARRAY['demo'],
   jsonb_build_object('status', 'Done', 'priority', 'low', 'account_name', 'Desert Rose Logistics LLC',
     'due_date', (CURRENT_DATE - INTERVAL '1 day')::text, 'assignee', 'Aisha Al-Mansoori'));

  -- ═══════════════════════════════════════════════════════════════════════
  -- Tasks (8 for BizOps Tasks view + Personal Dashboard)
  -- Fields: title/name, status, priority, due_date, assignee_name, tags,
  --         account_name, source
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (tenant_id, entity_type, name, source, status, tags, data) VALUES
  (v_tid, 'task', 'Review Q4 customer feedback report', 'demo_seed', 'in_progress', ARRAY['demo', 'customer-success'],
   jsonb_build_object('title', 'Review Q4 customer feedback report', 'status', 'in_progress',
     'priority', 'high', 'due_date', (CURRENT_DATE + INTERVAL '2 days')::text,
     'assignee_name', 'You', 'account_name', 'TechVista Solutions', 'source', 'manual')),
  (v_tid, 'task', 'Prepare QBR deck for TechVista', 'demo_seed', 'todo', ARRAY['demo', 'presentation'],
   jsonb_build_object('title', 'Prepare QBR deck for TechVista', 'status', 'todo',
     'priority', 'medium', 'due_date', (CURRENT_DATE + INTERVAL '5 days')::text,
     'assignee_name', 'You', 'account_name', 'TechVista Solutions', 'source', 'manual')),
  (v_tid, 'task', 'Escalation report for Pinnacle Digital', 'demo_seed', 'in_progress', ARRAY['demo', 'urgent'],
   jsonb_build_object('title', 'Escalation report for Pinnacle Digital', 'status', 'in_progress',
     'priority', 'urgent', 'due_date', (CURRENT_DATE - INTERVAL '1 day')::text,
     'assignee_name', 'You', 'account_name', 'Pinnacle Digital Services', 'source', 'manual')),
  (v_tid, 'task', 'Draft renewal proposal for Gulf Trade', 'demo_seed', 'todo', ARRAY['demo', 'renewal'],
   jsonb_build_object('title', 'Draft renewal proposal for Gulf Trade', 'status', 'todo',
     'priority', 'high', 'due_date', (CURRENT_DATE + INTERVAL '8 days')::text,
     'assignee_name', 'You', 'account_name', 'Gulf Trade Dynamics FZE', 'source', 'manual')),
  (v_tid, 'task', 'Update integration documentation', 'demo_seed', 'todo', ARRAY['demo', 'documentation'],
   jsonb_build_object('title', 'Update integration documentation', 'status', 'todo',
     'priority', 'low', 'due_date', (CURRENT_DATE + INTERVAL '14 days')::text,
     'assignee_name', 'You', 'source', 'manual')),
  (v_tid, 'task', 'Weekly team sync preparation', 'demo_seed', 'done', ARRAY['demo', 'recurring'],
   jsonb_build_object('title', 'Weekly team sync preparation', 'status', 'done',
     'priority', 'medium', 'due_date', (CURRENT_DATE - INTERVAL '2 days')::text,
     'assignee_name', 'You', 'source', 'manual')),
  (v_tid, 'task', 'Submit monthly revenue report', 'demo_seed', 'review', ARRAY['demo', 'reporting'],
   jsonb_build_object('title', 'Submit monthly revenue report', 'status', 'review',
     'priority', 'medium', 'due_date', (CURRENT_DATE + INTERVAL '3 days')::text,
     'assignee_name', 'You', 'source', 'manual')),
  (v_tid, 'task', 'Onboard Meridian Healthcare team', 'demo_seed', 'in_progress', ARRAY['demo', 'onboarding'],
   jsonb_build_object('title', 'Onboard Meridian Healthcare team', 'status', 'in_progress',
     'priority', 'medium', 'due_date', (CURRENT_DATE + INTERVAL '10 days')::text,
     'assignee_name', 'Vikram Reddy', 'account_name', 'Meridian Healthcare Ltd', 'source', 'manual'));

  -- ═══════════════════════════════════════════════════════════════════════
  -- Calendar Events (6 upcoming events)
  -- Fields: title/name, date/start_date, time/start_time, duration, type,
  --         source, attendees, account/account_name, location, meeting_type
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (tenant_id, entity_type, name, source, status, tags, data) VALUES
  (v_tid, 'calendar_event', 'QBR with TechVista Solutions', 'demo_seed', 'active', ARRAY['demo', 'qbr'],
   jsonb_build_object('title', 'QBR with TechVista Solutions',
     'date', (CURRENT_DATE + INTERVAL '2 days')::text, 'start_date', (CURRENT_DATE + INTERVAL '2 days')::text,
     'time', '10:00', 'start_time', (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '10 hours')::text,
     'duration', '60 min', 'type', 'qbr', 'meeting_type', 'qbr',
     'attendees', 4, 'account', 'TechVista Solutions',
     'location', 'Google Meet', 'source', 'calendar')),
  (v_tid, 'calendar_event', 'Health Check: Pinnacle Digital', 'demo_seed', 'active', ARRAY['demo', 'health-check'],
   jsonb_build_object('title', 'Health Check: Pinnacle Digital',
     'date', (CURRENT_DATE + INTERVAL '3 days')::text, 'start_date', (CURRENT_DATE + INTERVAL '3 days')::text,
     'time', '14:00', 'start_time', (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '14 hours')::text,
     'duration', '45 min', 'type', 'meeting', 'meeting_type', 'meeting',
     'attendees', 3, 'account', 'Pinnacle Digital Services',
     'location', 'Zoom', 'source', 'calendar')),
  (v_tid, 'calendar_event', 'Weekly Team Standup', 'demo_seed', 'active', ARRAY['demo', 'standup'],
   jsonb_build_object('title', 'Weekly Team Standup',
     'date', (CURRENT_DATE + INTERVAL '1 day')::text, 'start_date', (CURRENT_DATE + INTERVAL '1 day')::text,
     'time', '09:00', 'start_time', (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours')::text,
     'duration', '30 min', 'type', 'standup', 'meeting_type', 'standup',
     'attendees', 6, 'location', 'Slack Huddle', 'source', 'calendar')),
  (v_tid, 'calendar_event', 'Gulf Trade Renewal Discussion', 'demo_seed', 'active', ARRAY['demo', 'renewal'],
   jsonb_build_object('title', 'Gulf Trade Renewal Discussion',
     'date', (CURRENT_DATE + INTERVAL '6 days')::text, 'start_date', (CURRENT_DATE + INTERVAL '6 days')::text,
     'time', '11:00', 'start_time', (CURRENT_DATE + INTERVAL '6 days' + INTERVAL '11 hours')::text,
     'duration', '45 min', 'type', 'renewal', 'meeting_type', 'renewal',
     'attendees', 5, 'account', 'Gulf Trade Dynamics FZE',
     'location', 'Microsoft Teams', 'source', 'calendar')),
  (v_tid, 'calendar_event', 'Sprint Retrospective', 'demo_seed', 'active', ARRAY['demo', 'retro'],
   jsonb_build_object('title', 'Sprint Retrospective',
     'date', (CURRENT_DATE + INTERVAL '4 days')::text, 'start_date', (CURRENT_DATE + INTERVAL '4 days')::text,
     'time', '15:00', 'start_time', (CURRENT_DATE + INTERVAL '4 days' + INTERVAL '15 hours')::text,
     'duration', '60 min', 'type', 'meeting', 'meeting_type', 'meeting',
     'attendees', 8, 'location', 'Conference Room B', 'source', 'calendar')),
  (v_tid, 'calendar_event', 'Meridian Go-Live Checkpoint', 'demo_seed', 'active', ARRAY['demo', 'milestone'],
   jsonb_build_object('title', 'Meridian Go-Live Checkpoint',
     'date', (CURRENT_DATE + INTERVAL '8 days')::text, 'start_date', (CURRENT_DATE + INTERVAL '8 days')::text,
     'time', '10:30', 'start_time', (CURRENT_DATE + INTERVAL '8 days' + INTERVAL '10.5 hours')::text,
     'duration', '90 min', 'type', 'milestone', 'meeting_type', 'milestone',
     'attendees', 7, 'account', 'Meridian Healthcare Ltd',
     'location', 'Google Meet', 'source', 'calendar'));

  -- ═══════════════════════════════════════════════════════════════════════
  -- Opportunities (4 deals for BizOps Dashboard)
  -- Fields: stage, value, name
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (tenant_id, entity_type, name, source, status, tags, data) VALUES
  (v_tid, 'opportunity', 'TechVista Premium Upgrade', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('name', 'TechVista Premium Upgrade', 'stage', 'negotiation',
     'value', 8500000, 'probability', 75, 'account_name', 'TechVista Solutions',
     'close_date', (CURRENT_DATE + INTERVAL '30 days')::text)),
  (v_tid, 'opportunity', 'Gulf Trade Annual Contract', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('name', 'Gulf Trade Annual Contract', 'stage', 'proposal',
     'value', 12000000, 'probability', 50, 'account_name', 'Gulf Trade Dynamics FZE',
     'close_date', (CURRENT_DATE + INTERVAL '45 days')::text)),
  (v_tid, 'opportunity', 'New Deal: Zenith Corp Ltd', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('name', 'New Deal: Zenith Corp Ltd', 'stage', 'discovery',
     'value', 4500000, 'probability', 25, 'account_name', 'Zenith Corp Ltd',
     'close_date', (CURRENT_DATE + INTERVAL '60 days')::text)),
  (v_tid, 'opportunity', 'Desert Rose Fleet Expansion', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('name', 'Desert Rose Fleet Expansion', 'stage', 'negotiation',
     'value', 6700000, 'probability', 60, 'account_name', 'Desert Rose Logistics LLC',
     'close_date', (CURRENT_DATE + INTERVAL '21 days')::text));

  -- ═══════════════════════════════════════════════════════════════════════
  -- Generated Insights (3 AI insights for BizOps Dashboard)
  -- Fields: status, signal, recommendation, priority, module
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (tenant_id, entity_type, name, source, status, tags, data) VALUES
  (v_tid, 'generated_insight', 'Pinnacle engagement declining rapidly', 'demo_seed', 'active', ARRAY['demo', 'alert'],
   jsonb_build_object('status', 'new', 'signal', 'Pinnacle Digital — engagement score dropped 40% in 2 weeks. Support tickets up 3x.',
     'recommendation', 'Schedule executive-level health check within 48 hours. Prepare retention offer.',
     'priority', 'high', 'module', 'Customer Success')),
  (v_tid, 'generated_insight', 'Gulf Trade renewal window opening', 'demo_seed', 'active', ARRAY['demo', 'opportunity'],
   jsonb_build_object('status', 'new', 'signal', 'Gulf Trade FZE renewal in 45 days. Current sentiment neutral. Competitor evaluation detected.',
     'recommendation', 'Send personalized ROI report and schedule renewal strategy call this week.',
     'priority', 'medium', 'module', 'Revenue Operations')),
  (v_tid, 'generated_insight', 'TechVista showing expansion signals', 'demo_seed', 'active', ARRAY['demo', 'growth'],
   jsonb_build_object('status', 'new', 'signal', 'TechVista API usage up 85% quarter-over-quarter. New department onboarding detected.',
     'recommendation', 'Propose enterprise tier upgrade. Potential ARR uplift: ₹20L.',
     'priority', 'medium', 'module', 'Account Success'));

  -- ═══════════════════════════════════════════════════════════════════════
  -- Risk entries (2 for CS Today)
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (tenant_id, entity_type, name, source, status, tags, data) VALUES
  (v_tid, 'risk', 'Pinnacle API performance degradation', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('severity', 'high', 'category', 'Technical', 'account_name', 'Pinnacle Digital Services',
     'description', 'API p99 latency exceeding SLA thresholds for 5 consecutive days',
     'mitigation', 'Engineering team investigating. Temporary rate limiting applied.')),
  (v_tid, 'risk', 'Gulf Trade procurement delays', 'demo_seed', 'active', ARRAY['demo'],
   jsonb_build_object('severity', 'medium', 'category', 'Commercial', 'account_name', 'Gulf Trade Dynamics FZE',
     'description', 'Procurement team in Dubai requesting additional security compliance documentation',
     'mitigation', 'SOC2 report shared. ISO 27001 certification in progress.'));

  -- ═══════════════════════════════════════════════════════════════════════
  -- Documents (3 for Personal Dashboard count)
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (tenant_id, entity_type, name, source, status, tags, data) VALUES
  (v_tid, 'document', 'Q4 Performance Report', 'demo_seed', 'active', ARRAY['demo', 'report'],
   jsonb_build_object('title', 'Q4 Performance Report', 'type', 'report', 'format', 'pdf',
     'size', '2.4 MB', 'author', 'You', 'created', (CURRENT_DATE - INTERVAL '7 days')::text)),
  (v_tid, 'document', 'Customer Onboarding Playbook', 'demo_seed', 'active', ARRAY['demo', 'playbook'],
   jsonb_build_object('title', 'Customer Onboarding Playbook', 'type', 'document', 'format', 'docx',
     'size', '1.1 MB', 'author', 'You', 'created', (CURRENT_DATE - INTERVAL '14 days')::text)),
  (v_tid, 'document', 'Integration Best Practices Guide', 'demo_seed', 'active', ARRAY['demo', 'guide'],
   jsonb_build_object('title', 'Integration Best Practices Guide', 'type', 'document', 'format', 'md',
     'size', '340 KB', 'author', 'You', 'created', (CURRENT_DATE - INTERVAL '3 days')::text));

  -- ═══════════════════════════════════════════════════════════════════════
  -- Bookmarks (4 for Personal Bookmarks view)
  -- Fields: title, url, category, tags
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.entities (tenant_id, entity_type, name, source, status, tags, data) VALUES
  (v_tid, 'bookmarks', 'Supabase Dashboard', 'demo_seed', 'active', ARRAY['demo', 'development'],
   jsonb_build_object('title', 'Supabase Dashboard', 'url', 'https://supabase.com/dashboard',
     'category', 'Development', 'tags', '["database", "backend", "supabase"]'::jsonb)),
  (v_tid, 'bookmarks', 'Customer Success Playbook', 'demo_seed', 'active', ARRAY['demo', 'strategy'],
   jsonb_build_object('title', 'Customer Success Playbook', 'url', 'https://docs.example.com/cs-playbook',
     'category', 'Strategy', 'tags', '["customer-success", "playbook", "process"]'::jsonb)),
  (v_tid, 'bookmarks', 'India SaaS Market Report 2026', 'demo_seed', 'active', ARRAY['demo', 'research'],
   jsonb_build_object('title', 'India SaaS Market Report 2026', 'url', 'https://research.example.com/india-saas-2026',
     'category', 'Research', 'tags', '["market-research", "india", "saas"]'::jsonb)),
  (v_tid, 'bookmarks', 'Product Roadmap Board', 'demo_seed', 'active', ARRAY['demo', 'product'],
   jsonb_build_object('title', 'Product Roadmap Board', 'url', 'https://linear.app/team/roadmap',
     'category', 'Product', 'tags', '["roadmap", "product", "planning"]'::jsonb));

  -- ═══════════════════════════════════════════════════════════════════════
  -- Actions (3 pending + 1 completed — for Action Queue)
  -- Uses agent_id = 'DEMO_SEED' as marker for cleanup
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.actions (tenant_id, title, action_type, target_tool, status, priority, agent_id, entity_id, payload, created_at) VALUES
  (v_tid, 'Schedule health call for Pinnacle Digital', 'schedule_health_call', 'calendar', 'pending_approval', 'high', 'DEMO_SEED',
   v_acct_pinnacle,
   jsonb_build_object('account_name', 'Pinnacle Digital Services', 'reason', 'Health score dropped below 35. Engagement declining.',
     'suggested_time', (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '14 hours')::text,
     'attendees', '["Priya Sharma", "Neha Patel (Customer)"]',
     'source', 'demo_seed'),
   NOW() - INTERVAL '2 hours'),
  (v_tid, 'Send renewal reminder to Gulf Trade', 'send_payment_reminder', 'email', 'pending_approval', 'medium', 'DEMO_SEED',
   v_acct_gulftrade,
   jsonb_build_object('account_name', 'Gulf Trade Dynamics FZE', 'reason', 'Renewal in 45 days. Competitor evaluation detected.',
     'template', 'renewal_reminder_v2', 'recipient', 'Mohammed Al-Rashid',
     'source', 'demo_seed'),
   NOW() - INTERVAL '4 hours'),
  (v_tid, 'Draft retention email for Pinnacle', 'draft_retention_email', 'email', 'pending_approval', 'high', 'DEMO_SEED',
   v_acct_pinnacle,
   jsonb_build_object('account_name', 'Pinnacle Digital Services', 'reason', 'At-risk account. Key stakeholder considering alternatives.',
     'template', 'retention_offer_v1', 'recipient', 'Neha Patel',
     'include_discount', true, 'discount_percent', 15,
     'source', 'demo_seed'),
   NOW() - INTERVAL '1 hour'),
  (v_tid, 'Send onboarding welcome to Meridian', 'create_task', 'email', 'completed', 'medium', 'DEMO_SEED',
   v_acct_meridian,
   jsonb_build_object('account_name', 'Meridian Healthcare Ltd', 'reason', 'New customer onboarding initiated.',
     'template', 'welcome_enterprise_v1', 'recipient', 'Dr. Sunita Iyer',
     'source', 'demo_seed'),
   NOW() - INTERVAL '1 day');

  -- ═══════════════════════════════════════════════════════════════════════
  -- Mark tenant as having demo data
  -- ═══════════════════════════════════════════════════════════════════════
  UPDATE public.tenants
     SET settings = COALESCE(settings, '{}'::jsonb) || '{"has_demo_data": true}'::jsonb
   WHERE id = v_tid;

END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 5: cleanup_demo_data() — Remove all demo data for calling tenant
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.cleanup_demo_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tid UUID;
BEGIN
  v_tid := get_tenant_id();

  IF v_tid IS NULL THEN
    RAISE EXCEPTION 'cleanup_demo_data: No tenant context';
  END IF;

  -- Remove demo entities
  DELETE FROM public.entities
   WHERE tenant_id = v_tid
     AND source = 'demo_seed';

  -- Remove demo actions
  DELETE FROM public.actions
   WHERE tenant_id = v_tid
     AND agent_id = 'DEMO_SEED';

  -- Clear the demo flag
  UPDATE public.tenants
     SET settings = COALESCE(settings, '{}'::jsonb) - 'has_demo_data'
   WHERE id = v_tid;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 6: Update handle_new_user() to auto-seed demo data
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id    UUID;
  v_org_id       UUID;
  v_team_id      UUID;
  v_user_name    TEXT;
  v_email_prefix TEXT;
  v_slug         TEXT;
BEGIN
  -- Extract user name from metadata or email
  v_user_name := COALESCE(
    NULLIF(new.raw_user_meta_data->>'full_name', ''),
    NULLIF(new.raw_user_meta_data->>'name', ''),
    SPLIT_PART(new.email, '@', 1)
  );

  -- Generate a URL-safe slug from email prefix + first 8 chars of user UUID
  v_email_prefix := LOWER(REGEXP_REPLACE(
    COALESCE(SPLIT_PART(new.email, '@', 1), 'user'),
    '[^a-z0-9]', '-', 'g'
  ));
  v_slug := v_email_prefix || '-' || SUBSTR(new.id::text, 1, 8);

  -- 1. Create tenant
  v_tenant_id := gen_random_uuid();
  INSERT INTO public.tenants (id, name, slug, plan, settings)
  VALUES (
    v_tenant_id,
    COALESCE(NULLIF(v_user_name, ''), 'User') || '''s Workspace',
    v_slug,
    'personal',
    '{}'::jsonb
  );

  -- 2. Create default organization
  v_org_id := gen_random_uuid();
  INSERT INTO public.organizations (org_id, tenant_id, name, slug, is_default)
  VALUES (v_org_id, v_tenant_id, 'Default', v_slug || '-org', true);

  -- 3. Create default team
  v_team_id := gen_random_uuid();
  INSERT INTO public.teams (team_id, org_id, tenant_id, name, is_default)
  VALUES (v_team_id, v_org_id, v_tenant_id, 'Default', true);

  -- 4. Create profile with full tenant+org+team context
  INSERT INTO public.profiles (id, tenant_id, email, full_name, avatar_url, role, org_id, team_id)
  VALUES (
    new.id,
    v_tenant_id,
    new.email,
    COALESCE(v_user_name, ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'owner',
    v_org_id,
    v_team_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- 5. Write tenant_id to app_metadata (server-controlled, not user-editable)
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'tenant_id', v_tenant_id::text,
    'org_id', v_org_id::text,
    'team_id', v_team_id::text
  )
  WHERE id = new.id;

  -- 6. Seed initial onboarding state for the tenant
  INSERT INTO public.tenant_onboarding_state (tenant_id, status, current_step)
  VALUES (v_tenant_id, 'in_progress', 'welcome')
  ON CONFLICT DO NOTHING;

  -- 7. Seed demo data (non-blocking — if this fails, signup still succeeds)
  BEGIN
    PERFORM seed_demo_data(v_tenant_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Demo data seeding failed for tenant %: %', v_tenant_id, SQLERRM;
  END;

  RETURN new;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 7: Grant permissions
-- ═══════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.get_workspace_entities(TEXT[], INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_count(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_demo_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_demo_data() TO authenticated;

COMMIT;
