-- ============================================================================
-- Dynamic Schema Provisioning
-- Called during onboarding when tenant selects industry + department.
-- Creates tables for the resolved entity types if they don't exist.
-- ============================================================================

-- Function: provision_domain_tables
-- Takes a schema name and array of entity types, creates tables + RLS.
-- Idempotent: skips tables that already exist.
CREATE OR REPLACE FUNCTION provision_domain_tables(
  p_schema_name TEXT,
  p_entity_types TEXT[],
  p_priority_fields JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_entity TEXT;
  v_table_name TEXT;
  v_pk_name TEXT;
  v_fields TEXT[];
  v_field TEXT;
  v_created TEXT[] := '{}';
  v_skipped TEXT[] := '{}';
BEGIN
  -- Create schema if not exists
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);

  FOREACH v_entity IN ARRAY p_entity_types
  LOOP
    v_table_name := v_entity;
    v_pk_name := v_entity || '_id';

    -- Check if table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = p_schema_name AND table_name = v_table_name
    ) THEN
      v_skipped := array_append(v_skipped, v_entity);
      CONTINUE;
    END IF;

    -- Create table with standard columns
    EXECUTE format(
      'CREATE TABLE %I.%I (
        %I UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        spine_id UUID,
        external_id TEXT,
        source_system TEXT,
        canonical_data JSONB DEFAULT ''{}''::JSONB,
        hydration_bucket TEXT DEFAULT ''B0'',
        domain_schema TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        deleted_at TIMESTAMPTZ
      )',
      p_schema_name, v_table_name, v_pk_name
    );

    -- Add priority fields as real columns (nullable TEXT for flexibility)
    IF p_priority_fields ? v_entity THEN
      FOR v_field IN SELECT jsonb_array_elements_text(p_priority_fields -> v_entity)
      LOOP
        -- Skip if column already part of standard set
        IF v_field NOT IN ('tenant_id', 'spine_id', 'external_id', 'source_system',
                           'canonical_data', 'hydration_bucket', 'domain_schema',
                           'created_at', 'updated_at', 'deleted_at') THEN
          BEGIN
            EXECUTE format(
              'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS %I TEXT',
              p_schema_name, v_table_name, v_field
            );
          EXCEPTION WHEN duplicate_column THEN
            -- ignore
          END;
        END IF;
      END LOOP;
    END IF;

    -- Create indexes
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%s_%s_tenant ON %I.%I (tenant_id)',
      p_schema_name, v_table_name, p_schema_name, v_table_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%s_%s_spine ON %I.%I (spine_id) WHERE spine_id IS NOT NULL',
      p_schema_name, v_table_name, p_schema_name, v_table_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%s_%s_updated ON %I.%I (updated_at)',
      p_schema_name, v_table_name, p_schema_name, v_table_name
    );

    -- Enable RLS
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', p_schema_name, v_table_name);

    -- RLS policy: tenant isolation
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS %I ON %I.%I FOR ALL USING (tenant_id = current_setting(''request.jwt.claims'', true)::jsonb->>''tenant_id'')',
      'tenant_isolation_' || v_table_name,
      p_schema_name, v_table_name
    );

    -- Service role bypass policy
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS %I ON %I.%I FOR ALL TO service_role USING (true)',
      'service_role_' || v_table_name,
      p_schema_name, v_table_name
    );

    v_created := array_append(v_created, v_entity);
  END LOOP;

  RETURN jsonb_build_object(
    'schema', p_schema_name,
    'created', to_jsonb(v_created),
    'skipped', to_jsonb(v_skipped),
    'total', array_length(p_entity_types, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Schema-to-entity-type mapping (mirrors ENTITY_TYPE_TO_TABLE in spine-v2)
-- Used by provision_tenant_tables to know which schema each entity type belongs to.
-- ============================================================================

CREATE OR REPLACE FUNCTION provision_tenant_spine(
  p_tenant_id UUID,
  p_entity_types TEXT[],
  p_priority_fields JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  v_entity TEXT;
  v_schema TEXT;
  v_schemas_to_provision JSONB := '{}'::JSONB;
  v_result JSONB := '[]'::JSONB;
  v_schema_result JSONB;
  v_schema_entities TEXT[];
BEGIN
  -- Group entity types by their target schema
  FOREACH v_entity IN ARRAY p_entity_types
  LOOP
    v_schema := CASE
      -- Core spine
      WHEN v_entity IN ('account', 'contact', 'goal', 'metric', 'signal', 'context_extraction',
                        'file', 'evidence_ref', 'action', 'note', 'calendar_event', 'bookmark',
                        'daily_reflection') THEN 'spine'
      -- Sales
      WHEN v_entity IN ('deal', 'opportunity', 'lead', 'pipeline_stage', 'quote',
                        'sales_sequence', 'call_log', 'email_sequence', 'competitor_intel') THEN 'sales'
      -- Marketing
      WHEN v_entity IN ('campaign', 'campaign_block', 'audience', 'interaction_event', 'delivery',
                        'landing_page', 'email_campaign', 'social_post', 'content_asset',
                        'attribution_touchpoint', 'ab_test', 'audience_segment', 'marketing_metric') THEN 'marketing'
      -- RevOps
      WHEN v_entity IN ('quota', 'forecast', 'kpi', 'territory', 'comp_plan',
                        'revenue_metric', 'attribution', 'segment_rule') THEN 'revops'
      -- Customer Success
      WHEN v_entity IN ('account_health', 'account_master', 'renewal', 'renewal_tracker', 'outcome',
                        'stakeholder_outcome', 'risk_register', 'value_stream',
                        'platform_health_metric', 'generated_insight', 'initiative',
                        'task', 'task_item', 'success_plan', 'engagement', 'engagement_log',
                        'business_context', 'strategic_objective', 'capability', 'api_portfolio',
                        'people_team') THEN 'cs'
      -- Support
      WHEN v_entity IN ('ticket', 'csat', 'csat_survey', 'sla_policy', 'escalation',
                        'queue', 'agent_performance', 'service_metric', 'knowledge_article') THEN 'support'
      -- Engineering
      WHEN v_entity IN ('sprint', 'incident', 'deploy', 'bug', 'release', 'repository',
                        'pull_request', 'deployment', 'engineering_metric') THEN 'eng'
      -- Product
      WHEN v_entity IN ('feature', 'usage_metric', 'feedback', 'roadmap_item') THEN 'product'
      -- Finance
      WHEN v_entity IN ('invoice', 'payment', 'rev_rec_schedule', 'cash_flow', 'expense',
                        'budget', 'revenue_entry', 'tax_filing', 'financial_report',
                        'vendor', 'cost_center', 'forecast_entry', 'compliance_item') THEN 'finance'
      -- Legal
      WHEN v_entity IN ('contract', 'clause', 'obligation') THEN 'legal'
      -- HR
      WHEN v_entity IN ('employee', 'comp_band', 'attrition_risk') THEN 'hr'
      -- IT
      WHEN v_entity IN ('system', 'device', 'user', 'change_request', 'vulnerability',
                        'backup', 'certificate', 'network_device', 'license', 'it_metric') THEN 'it'
      -- BizOps
      WHEN v_entity IN ('activity', 'workflow', 'okr', 'cross_dept_initiative',
                        'ops_metric', 'resource_allocation', 'project') THEN 'bizops'
      -- Procurement
      WHEN v_entity IN ('purchase_order', 'spend_category', 'savings_initiative',
                        'approval_request', 'compliance_check', 'procurement_metric') THEN 'procurement'
      -- Service Operations
      WHEN v_entity IN ('work_order', 'asset', 'field_technician', 'maintenance_schedule',
                        'maintenance_record', 'service_appointment', 'equipment_maintenance',
                        'fleet_maintenance') THEN 'svc'
      -- Supply Chain
      WHEN v_entity IN ('order', 'inventory', 'supplier', 'fulfilment', 'shipment',
                        'carrier', 'warehouse') THEN 'sc'
      -- Education
      WHEN v_entity IN ('student', 'enrollment', 'course', 'assignment', 'grade',
                        'attendance', 'discussion', 'learning_objective', 'intervention',
                        'student_metric') THEN 'industry_edu'
      ELSE 'spine' -- fallback to core spine schema
    END;

    -- Group by schema
    IF v_schemas_to_provision ? v_schema THEN
      v_schemas_to_provision := jsonb_set(
        v_schemas_to_provision,
        ARRAY[v_schema],
        (v_schemas_to_provision -> v_schema) || to_jsonb(v_entity)
      );
    ELSE
      v_schemas_to_provision := jsonb_set(
        v_schemas_to_provision,
        ARRAY[v_schema],
        jsonb_build_array(v_entity)
      );
    END IF;
  END LOOP;

  -- Provision each schema
  FOR v_schema IN SELECT jsonb_object_keys(v_schemas_to_provision)
  LOOP
    SELECT ARRAY(SELECT jsonb_array_elements_text(v_schemas_to_provision -> v_schema))
    INTO v_schema_entities;

    v_schema_result := provision_domain_tables(v_schema, v_schema_entities, p_priority_fields);
    v_result := v_result || jsonb_build_array(v_schema_result);
  END LOOP;

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'schemas_provisioned', v_result,
    'entity_count', array_length(p_entity_types, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
