-- Area 5, 8: Self-Monitoring & Feedback Loops
-- 1. OS Self-Monitoring Signals (Area 8)
INSERT INTO signal_definitions (
        signal_id,
        signal_name,
        signal_category,
        persona_type,
        department,
        description,
        computation_type,
        source_resource_types,
        unit,
        direction
    )
VALUES (
        'os_ingestion_delay',
        'OS Ingestion Delay',
        'ops',
        'manager',
        'ops',
        'Time between event received and normalized > 30s',
        'threshold',
        ARRAY ['event'],
        'seconds',
        'lower_is_better'
    ),
    (
        'os_api_error_rate',
        'OS API Error Rate',
        'ops',
        'manager',
        'ops',
        'Percentage of non-200 responses across services',
        'ratio',
        ARRAY ['event'],
        '%',
        'lower_is_better'
    ),
    (
        'os_situation_backlog',
        'Unreviewed Situations',
        'ops',
        'manager',
        'ops',
        'Situations open > 24hrs without a decision',
        'count',
        ARRAY ['document'],
        'count',
        'lower_is_better'
    );
-- 2. OS Global Rules
INSERT INTO signal_rules (event_type_match, signal_key, severity_score)
VALUES ('os.service.error', 'os_api_error_rate', 90),
    ('os.ingest.slow', 'os_ingestion_delay', 60);
-- 3. Signal Noise & Drift Dashboard (Area 5)
CREATE OR REPLACE VIEW vw_signal_tuning_dashboard AS
SELECT s.signal_key,
    COUNT(ad.id) as total_decisions,
    COUNT(ad.id) FILTER (
        WHERE ad.decision_status = 'approved'
    ) as approved_count,
    COUNT(ad.id) FILTER (
        WHERE ad.decision_status = 'rejected'
    ) as rejected_count,
    COUNT(ad.id) FILTER (
        WHERE ad.decision_status = 'modified'
    ) as modified_count,
    ROUND(
        (
            COUNT(ad.id) FILTER (
                WHERE ad.decision_status = 'rejected'
            )::numeric / NULLIF(COUNT(ad.id), 0)
        ) * 100,
        2
    ) as noise_percentage
FROM signals s
    JOIN agent_decisions ad ON ad.id = ANY(
        SELECT decision_id
        FROM (
                SELECT id as decision_id,
                    situation_id
                FROM agent_decisions
            ) sub
        WHERE sub.situation_id IN (
                SELECT id
                FROM situations
                WHERE s.id = ANY(signal_ids)
            )
    )
GROUP BY s.signal_key;
-- 4. UX Polish: Tags & Quick Filters (Area 7)
ALTER TABLE situations
ADD COLUMN IF NOT EXISTS tags TEXT [] DEFAULT '{}';
ALTER TABLE situations
ADD COLUMN IF NOT EXISTS primary_action_label TEXT DEFAULT 'What should I do now?';
-- Seed tags for existing situations
UPDATE situations
SET tags = ARRAY ['billing', 'at-risk']
WHERE situation_key LIKE 'at_risk%';
UPDATE situations
SET tags = ARRAY ['sales', 'hot-lead']
WHERE situation_key LIKE 'sales%';