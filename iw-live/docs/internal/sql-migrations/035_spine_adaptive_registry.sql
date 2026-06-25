-- Migration: 035_spine_adaptive_registry.sql
-- Description: Adaptive spine registry (schema discovery + completeness)
-- Created: 2026-02-08
-- =============================================================================

-- =============================================================================
-- 1. Adaptive schema registry (field discovery)
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_schema_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    field_key VARCHAR(200) NOT NULL,
    field_path VARCHAR(300) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    sample_value TEXT,
    source_system VARCHAR(50),
    status VARCHAR(20) DEFAULT 'observed' CHECK (status IN ('observed', 'promoted', 'deprecated')),
    occurrence_count INTEGER DEFAULT 1,
    null_count INTEGER DEFAULT 0,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, entity_type, field_path)
);
CREATE INDEX idx_spine_schema_registry_entity ON spine_schema_registry(tenant_id, entity_type);
CREATE INDEX idx_spine_schema_registry_status ON spine_schema_registry(status);

-- =============================================================================
-- 2. Expected field registry (for completeness scoring)
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_expected_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    layer_level INTEGER NOT NULL CHECK (layer_level IN (1, 2, 3)),
    required_fields JSONB NOT NULL DEFAULT '[]',
    expected_fields JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (entity_type, layer_level)
);

-- =============================================================================
-- 3. Entity completeness table
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_entity_completeness (
    entity_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    layer_level INTEGER NOT NULL CHECK (layer_level IN (1, 2, 3)),
    fields_present INTEGER DEFAULT 0,
    fields_expected INTEGER DEFAULT 0,
    completeness_score INTEGER DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_completeness_entity ON spine_entity_completeness(entity_id);

-- =============================================================================
-- 4. Adaptive field stats view
-- =============================================================================
CREATE OR REPLACE VIEW v_spine_adaptive_fields AS
SELECT
    tenant_id,
    entity_type,
    field_key,
    field_path,
    data_type,
    status,
    occurrence_count,
    null_count,
    first_seen_at,
    last_seen_at
FROM spine_schema_registry;

-- =============================================================================
-- 5. Adaptive upsert function (field observation)
-- =============================================================================
CREATE OR REPLACE FUNCTION record_spine_field_observation(
    p_tenant_id UUID,
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

-- =============================================================================
-- 6. Completeness computation function
-- =============================================================================
CREATE OR REPLACE FUNCTION compute_spine_completeness(
    p_entity_id UUID,
    p_tenant_id UUID,
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

-- =============================================================================
-- END
-- =============================================================================
