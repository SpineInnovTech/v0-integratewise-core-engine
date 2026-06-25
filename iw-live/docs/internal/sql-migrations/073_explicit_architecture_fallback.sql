-- =============================================================================
-- 073_explicit_architecture_fallback.sql
-- Phase F — Explicit Architecture A/B fallback in workspace RPCs
--
-- Problem:
--   ~93 entity types in entity_type_map point to Architecture A tables
--   (domain-specific schemas like sales.deal, cs.account_health, etc.) that
--   DON'T EXIST yet. The current get_workspace_entities() returns [] for these,
--   even though data may exist in public.entities (Architecture B — JSONB).
--
-- Fix:
--   1. Add `architecture` column to entity_type_map for tracking provisioning
--   2. Rewrite get_workspace_entities() to try Architecture A first, then
--      explicitly fall back to public.entities (Architecture B)
--   3. Rewrite get_entity_count() with the same A/B fallback
--   4. Each entity type result includes _architecture ("A" or "B") for debugging
--
-- Architecture A: Domain-specific typed tables (sales.deal, cs.account_health, etc.)
--   Rows are fully typed columns. Created by migration 055.
--
-- Architecture B: Generic public.entities table
--   Rows are { id, tenant_id, entity_type, name, source, source_id, data (JSONB), updated_at }
--   Created by migrations 045-050. The Spine writes here when A tables don't exist.
--
-- Decision: Do NOT create missing Architecture A tables. Just make fallback explicit.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add `architecture` column to entity_type_map
--    'A' = typed domain table exists, 'B' = fallback to public.entities
--    Default 'A' — runtime check determines actual availability
-- ---------------------------------------------------------------------------
ALTER TABLE public.entity_type_map
  ADD COLUMN IF NOT EXISTS architecture TEXT NOT NULL DEFAULT 'A';

COMMENT ON COLUMN public.entity_type_map.architecture IS
  'Target architecture: A = domain-specific typed table, B = public.entities JSONB fallback. '
  'Value is the INTENDED architecture. Runtime check determines if A table actually exists.';


-- ---------------------------------------------------------------------------
-- 2. get_workspace_entities() — Rewritten with explicit A/B fallback
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
      -- Still try public.entities as last resort.
      v_schema := NULL;
      v_tbl := NULL;
    END IF;

    -- ── Architecture A: Try domain-specific typed table ──
    IF v_schema IS NOT NULL AND v_schema <> 'public' THEN
      -- Check if Architecture A table actually exists
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

    -- ── Architecture B fallback: public.entities (JSONB) ──
    IF v_arch IS NULL THEN
      -- Table doesn't exist or entity type unknown — fall back to public.entities
      IF to_regclass('public.entities') IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(row_to_json(t.*)), '[]'::jsonb)
          INTO v_rows
          FROM (
            SELECT *
              FROM public.entities
             WHERE tenant_id = v_tenant_id
               AND entity_type = v_et
             ORDER BY updated_at DESC NULLS LAST
             LIMIT p_limit OFFSET p_offset
          ) t;

        v_arch := 'B';
      ELSE
        -- Neither Architecture A nor B available
        v_rows := '[]'::jsonb;
        v_arch := 'none';
      END IF;
    END IF;

    -- Key the result under the ORIGINAL requested name (not the resolved canonical)
    -- Include _architecture annotation for debugging
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


-- ---------------------------------------------------------------------------
-- 3. get_entity_count() — Rewritten with explicit A/B fallback
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


-- ---------------------------------------------------------------------------
-- 4. Re-grant execute permissions
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_workspace_entities(TEXT[], INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_count(TEXT[]) TO authenticated;

COMMIT;
