-- Fix tenant_id type mismatch: spine_schema_registry uses UUID but tenant_spine_config uses TEXT.
-- Deploy spine_schema_registry with TEXT tenant_id to align with the adaptive spine schema.
-- This supersedes sql-migrations/035_spine_adaptive_registry.sql for Supabase deployments.

-- 1. Schema registry: tracks observed fields per tenant per entity type (adaptive growth)
CREATE TABLE IF NOT EXISTS spine_schema_registry (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    entity_type     TEXT NOT NULL,
    field_key       TEXT NOT NULL,
    field_path      TEXT NOT NULL,
    data_type       TEXT NOT NULL DEFAULT 'string',
    sample_value    TEXT,
    source_system   TEXT,
    status          TEXT NOT NULL DEFAULT 'observed',
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    null_count      INTEGER NOT NULL DEFAULT 0,
    first_seen_at   TIMESTAMPTZ DEFAULT now(),
    last_seen_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tenant_id, entity_type, field_path)
);

CREATE INDEX IF NOT EXISTS idx_ssr_tenant ON spine_schema_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ssr_entity ON spine_schema_registry(entity_type);

-- 2. RPC: record_spine_field_observation (upsert on conflict)
CREATE OR REPLACE FUNCTION record_spine_field_observation(
    p_tenant_id       TEXT,
    p_entity_type     TEXT,
    p_field_key       TEXT,
    p_field_path      TEXT,
    p_data_type       TEXT DEFAULT 'string',
    p_sample_value    TEXT DEFAULT NULL,
    p_source_system   TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO spine_schema_registry (tenant_id, entity_type, field_key, field_path, data_type, sample_value, source_system)
    VALUES (p_tenant_id, p_entity_type, p_field_key, p_field_path, p_data_type, p_sample_value, p_source_system)
    ON CONFLICT (tenant_id, entity_type, field_path) DO UPDATE SET
        occurrence_count = spine_schema_registry.occurrence_count + 1,
        null_count = CASE WHEN p_sample_value IS NULL
                         THEN spine_schema_registry.null_count + 1
                         ELSE spine_schema_registry.null_count END,
        last_seen_at = now(),
        sample_value = COALESCE(p_sample_value, spine_schema_registry.sample_value),
        data_type = COALESCE(p_data_type, spine_schema_registry.data_type),
        source_system = COALESCE(p_source_system, spine_schema_registry.source_system);
END;
$$ LANGUAGE plpgsql;

-- 3. Expected fields per entity type and layer level
CREATE TABLE IF NOT EXISTS spine_expected_fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     TEXT NOT NULL,
    layer_level     TEXT NOT NULL DEFAULT 'L1',
    required_fields JSONB NOT NULL DEFAULT '[]',
    expected_fields JSONB NOT NULL DEFAULT '[]',
    UNIQUE (entity_type, layer_level)
);

-- 4. Entity completeness scoring
CREATE TABLE IF NOT EXISTS spine_entity_completeness (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id         UUID NOT NULL,
    tenant_id         TEXT NOT NULL REFERENCES tenant_spine_config(tenant_id) ON DELETE CASCADE,
    entity_type       TEXT NOT NULL,
    layer_level       TEXT NOT NULL DEFAULT 'L1',
    fields_present    INTEGER NOT NULL DEFAULT 0,
    fields_expected   INTEGER NOT NULL DEFAULT 0,
    completeness_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    computed_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (entity_id, tenant_id, entity_type, layer_level)
);

-- 5. RPC: compute_spine_completeness
CREATE OR REPLACE FUNCTION compute_spine_completeness(
    p_entity_id   UUID,
    p_tenant_id   TEXT,
    p_entity_type TEXT,
    p_layer_level TEXT DEFAULT 'L1'
) RETURNS NUMERIC AS $$
DECLARE
    v_expected INTEGER;
    v_present  INTEGER;
    v_score    NUMERIC(5,2);
BEGIN
    SELECT array_length(
        (SELECT expected_fields FROM spine_expected_fields WHERE entity_type = p_entity_type AND layer_level = p_layer_level)::text[]
    , 1) INTO v_expected;

    IF v_expected IS NULL OR v_expected = 0 THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*) INTO v_present
    FROM spine_schema_registry
    WHERE tenant_id = p_tenant_id
      AND entity_type = p_entity_type
      AND status = 'observed';

    v_score := ROUND((v_present::NUMERIC / v_expected) * 100, 2);

    INSERT INTO spine_entity_completeness (entity_id, tenant_id, entity_type, layer_level, fields_present, fields_expected, completeness_score)
    VALUES (p_entity_id, p_tenant_id, p_entity_type, p_layer_level, v_present, v_expected, v_score)
    ON CONFLICT (entity_id, tenant_id, entity_type, layer_level) DO UPDATE SET
        fields_present = v_present,
        fields_expected = v_expected,
        completeness_score = v_score,
        computed_at = now();

    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE spine_schema_registry IS 'Adaptive Spine: tracks field observations per tenant. tenant_id is TEXT to match tenant_spine_config.';
COMMENT ON FUNCTION record_spine_field_observation IS 'Upsert field observation into spine_schema_registry. Called by spine-v2 on every entity write.';
