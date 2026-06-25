-- Convergence view: Spine + Context + Knowledge
CREATE MATERIALIZED VIEW IF NOT EXISTS entity360 AS
SELECT
    s.id as spine_id,
    s.workspace_id,
    s.tenant_id,
    s.entity_type,
    s.external_id,
    s.canonical_data,
    s.hydration_bucket,
    s.domain_schema,
    s.updated_at,
    COALESCE((
        SELECT jsonb_agg(c.*)
        FROM context c
        WHERE c.spine_id = s.id
          AND c.created_at > NOW() - INTERVAL '24 hours'
    ), '[]'::jsonb) as recent_context,
    COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', k.id, 'insights', k.insights))
        FROM (
          SELECT id, insights
          FROM knowledge
          WHERE spine_id = s.id
          ORDER BY created_at DESC
          LIMIT 5
        ) k
    ), '[]'::jsonb) as recent_knowledge,
    CASE
        WHEN s.hydration_bucket = 'B7' AND (s.canonical_data->>'priority') = 'high' THEN 'critical_signal'
        WHEN s.hydration_bucket = 'B7' THEN 'action_ready'
        WHEN s.hydration_bucket IN ('B5', 'B6') THEN 'enriching'
        ELSE 'raw_material'
    END as signal_state
FROM spine_v2 s
WHERE s.deleted_at IS NULL
  AND s.hydration_bucket >= 'B5';

CREATE UNIQUE INDEX IF NOT EXISTS idx_entity360_spine_id ON entity360(spine_id);
CREATE INDEX IF NOT EXISTS idx_entity360_signal_state ON entity360(workspace_id, signal_state);

-- Concurrent refresh requires a unique index and cannot run in a transaction.
REFRESH MATERIALIZED VIEW entity360;
