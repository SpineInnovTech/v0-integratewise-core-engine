-- Area 2.1: Owner Property - Weekly OS Review Engine
-- This view aggregates the 'Heartbeat' of the system for the weekly review.
-- It highlights situations that need attention, playbook success rates, and system noise.
CREATE OR REPLACE VIEW vw_weekly_os_heartbeat AS
SELECT tenant_id,
    COUNT(DISTINCT id) FILTER (
        WHERE status = 'open'
    ) as open_situations,
    COUNT(DISTINCT id) FILTER (
        WHERE status = 'resolved'
    ) as resolved_situations,
    AVG(
        CASE
            WHEN status = 'resolved' THEN EXTRACT(
                EPOCH
                FROM (updated_at - created_at)
            ) / 3600
            ELSE NULL
        END
    ) as avg_resolution_time_hrs,
    MAX(created_at) as last_activity_at,
    (
        SELECT JSONB_AGG(sub)
        FROM (
                SELECT situation_key,
                    count(*) as count
                FROM situations
                WHERE tenant_id = s.tenant_id
                GROUP BY situation_key
                ORDER BY count DESC
                LIMIT 5
            ) sub
    ) as top_situation_keys
FROM situations s
GROUP BY tenant_id;
-- Admin View for System Health (Area 10)
CREATE OR REPLACE VIEW vw_system_health_audit AS
SELECT service_name,
    alert_type,
    severity,
    count(*) as alert_count,
    max(created_at) as most_recent_alert
FROM system_alerts
WHERE is_resolved = false
GROUP BY service_name,
    alert_type,
    severity;
-- Connector Efficiency Audit
CREATE OR REPLACE VIEW vw_connector_efficiency AS
SELECT tool_name,
    operation,
    count(*) as total_failures,
    count(*) FILTER (
        WHERE status = 'retrying'
    ) as retry_count,
    count(*) FILTER (
        WHERE status = 'needs_review'
    ) as manual_review_count
FROM connector_failures
GROUP BY tool_name,
    operation;