-- Migration: 034_spine_progressive_universal.sql
-- Description: Progressive universal spine (L1 core + L2 extensions + L3 detail)
-- Created: 2026-02-08
-- =============================================================================

-- =============================================================================
-- 1. L1 CORE: Universal entity registry (minimal required fields)
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_entity_core (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'account','person','task','meeting','contract','risk', etc.
    category VARCHAR(30) NOT NULL CHECK (category IN ('personal', 'csm', 'sales', 'tam', 'marketing', 'finance', 'ops', 'business', 'team')),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id, account_id, team_id, visibility: 'private'|'team'|'org' }
    status VARCHAR(30) DEFAULT 'active',
    source JSONB NOT NULL DEFAULT '{}',
    -- Structure: { source_system, source_id, source_url }
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_core_entity_type ON spine_entity_core(entity_type);
CREATE INDEX idx_spine_core_category ON spine_entity_core(category);
CREATE INDEX idx_spine_core_account ON spine_entity_core((scope->>'account_id'));

-- =============================================================================
-- 2. L2 EXTENSIONS: Progressive detail by layer
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_entity_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES spine_entity_core(id) ON DELETE CASCADE,
    layer_level INTEGER NOT NULL CHECK (layer_level IN (1, 2, 3)),
    data JSONB NOT NULL DEFAULT '{}',
    -- L1: minimal core fields (name/title/summary)
    -- L2: operational details (dates, owners, amounts, statuses)
    -- L3: department-specific depth (risk scores, metrics, SLA, renewal rules)
    completeness_score INTEGER DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (entity_id, layer_level)
);
CREATE INDEX idx_spine_layers_entity ON spine_entity_layers(entity_id);
CREATE INDEX idx_spine_layers_level ON spine_entity_layers(layer_level);

-- =============================================================================
-- 3. L2 ATTRIBUTES: Searchable key/value for indexing and filtering
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_entity_attributes (
    entity_id UUID NOT NULL REFERENCES spine_entity_core(id) ON DELETE CASCADE,
    attr_key VARCHAR(100) NOT NULL,
    attr_value TEXT,
    attr_numeric NUMERIC,
    attr_bool BOOLEAN,
    attr_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (entity_id, attr_key)
);
CREATE INDEX idx_spine_attrs_key ON spine_entity_attributes(attr_key);
CREATE INDEX idx_spine_attrs_numeric ON spine_entity_attributes(attr_key, attr_numeric);
CREATE INDEX idx_spine_attrs_date ON spine_entity_attributes(attr_key, attr_date);

-- =============================================================================
-- 4. L2 LINKS: Cross-entity relationships
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_entity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_entity_id UUID NOT NULL REFERENCES spine_entity_core(id) ON DELETE CASCADE,
    to_entity_id UUID NOT NULL REFERENCES spine_entity_core(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_links_from ON spine_entity_links(from_entity_id);
CREATE INDEX idx_spine_links_to ON spine_entity_links(to_entity_id);
CREATE INDEX idx_spine_links_type ON spine_entity_links(relationship_type);

-- =============================================================================
-- 5. L3 METRICS: Time-series measurements
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_entity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES spine_entity_core(id) ON DELETE CASCADE,
    metric_key VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    unit VARCHAR(30),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    source JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_spine_metrics_entity ON spine_entity_metrics(entity_id);
CREATE INDEX idx_spine_metrics_key ON spine_entity_metrics(metric_key);
CREATE INDEX idx_spine_metrics_time ON spine_entity_metrics(recorded_at DESC);

-- =============================================================================
-- 6. Progressive Universal View (Core + Layers)
-- =============================================================================
CREATE OR REPLACE VIEW v_spine_universal_progressive AS
SELECT
    c.id,
    c.tenant_id,
    c.entity_type,
    c.category,
    c.scope,
    c.status,
    c.source,
    l1.data AS layer_1,
    l2.data AS layer_2,
    l3.data AS layer_3,
    GREATEST(
        COALESCE(l1.completeness_score, 0),
        COALESCE(l2.completeness_score, 0),
        COALESCE(l3.completeness_score, 0)
    ) AS completeness_score,
    c.created_at,
    c.updated_at
FROM spine_entity_core c
LEFT JOIN spine_entity_layers l1 ON l1.entity_id = c.id AND l1.layer_level = 1
LEFT JOIN spine_entity_layers l2 ON l2.entity_id = c.id AND l2.layer_level = 2
LEFT JOIN spine_entity_layers l3 ON l3.entity_id = c.id AND l3.layer_level = 3;

-- =============================================================================
-- END
-- =============================================================================
