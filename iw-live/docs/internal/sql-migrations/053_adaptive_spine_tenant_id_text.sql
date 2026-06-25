-- =============================================================================
-- 053_adaptive_spine_tenant_id_text.sql
-- Align adaptive spine tables with tenant_spine_config: use TEXT for tenant_id
-- so any tenant identifier (UUID or org slug) works. Run after 035.
-- =============================================================================

-- spine_schema_registry: tenant_id UUID → TEXT
ALTER TABLE spine_schema_registry
  ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;

-- spine_entity_completeness: tenant_id UUID → TEXT
ALTER TABLE spine_entity_completeness
  ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;

-- record_spine_field_observation: accept TEXT tenant_id
CREATE OR REPLACE FUNCTION record_spine_field_observation(
    p_tenant_id TEXT,
    p_entity_type VARCHAR,
    p_field_key VARCHAR,
    p_field_path VARCHAR,
    p_data_type VARCHAR,
    p_sample_value TEXT,
    p_source_system VARCHAR
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO spine_schema_registry (
        tenant_id,
        entity_type,
        field_key,
        field_path,
        data_type,
        sample_value,
        source_system,
        occurrence_count,
        null_count,
        first_seen_at,
        last_seen_at
    ) VALUES (
        p_tenant_id,
        p_entity_type,
        p_field_key,
        p_field_path,
        p_data_type,
        p_sample_value,
        p_source_system,
        1,
        CASE WHEN p_sample_value IS NULL THEN 1 ELSE 0 END,
        NOW(),
        NOW()
    )
    ON CONFLICT (tenant_id, entity_type, field_path) DO UPDATE
    SET
        occurrence_count = spine_schema_registry.occurrence_count + 1,
        null_count = spine_schema_registry.null_count + CASE WHEN EXCLUDED.sample_value IS NULL THEN 1 ELSE 0 END,
        last_seen_at = NOW(),
        sample_value = COALESCE(EXCLUDED.sample_value, spine_schema_registry.sample_value),
        data_type = COALESCE(EXCLUDED.data_type, spine_schema_registry.data_type),
        source_system = COALESCE(EXCLUDED.source_system, spine_schema_registry.source_system);
END;
$$;

-- compute_spine_completeness: accept TEXT tenant_id
CREATE OR REPLACE FUNCTION compute_spine_completeness(
    p_entity_id UUID,
    p_tenant_id TEXT,
    p_entity_type VARCHAR,
    p_layer_level INTEGER,
    p_present_fields JSONB
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_required JSONB;
    v_expected JSONB;
    v_present_count INTEGER := 0;
    v_expected_count INTEGER := 0;
    v_score INTEGER := 0;
BEGIN
    SELECT required_fields, expected_fields
    INTO v_required, v_expected
    FROM spine_expected_fields
    WHERE entity_type = p_entity_type AND layer_level = p_layer_level;

    IF v_expected IS NULL THEN
        v_expected := '[]'::jsonb;
    END IF;

    v_expected_count := jsonb_array_length(v_expected);

    IF v_expected_count > 0 THEN
        SELECT COUNT(*)
        INTO v_present_count
        FROM jsonb_array_elements_text(v_expected) AS f
        WHERE p_present_fields ? f;

        v_score := ROUND((v_present_count::numeric / v_expected_count::numeric) * 100)::int;
    END IF;

    INSERT INTO spine_entity_completeness (
        entity_id,
        tenant_id,
        entity_type,
        layer_level,
        fields_present,
        fields_expected,
        completeness_score,
        updated_at
    ) VALUES (
        p_entity_id,
        p_tenant_id,
        p_entity_type,
        p_layer_level,
        v_present_count,
        v_expected_count,
        v_score,
        NOW()
    )
    ON CONFLICT (entity_id) DO UPDATE
    SET
        fields_present = EXCLUDED.fields_present,
        fields_expected = EXCLUDED.fields_expected,
        completeness_score = EXCLUDED.completeness_score,
        updated_at = NOW();
END;
$$;

COMMENT ON TABLE spine_schema_registry IS 'Adaptive spine: field observations per tenant (tenant_id TEXT to match tenant_spine_config).';
COMMENT ON TABLE spine_entity_completeness IS 'Adaptive spine: entity completeness scores (tenant_id TEXT).';
