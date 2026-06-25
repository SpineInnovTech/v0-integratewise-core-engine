-- IntegrateWise Webhook Events Metadata Function
-- Migration: 028_webhook_events_metadata.sql
-- Description: Adds function to get webhook events metadata for filtering

-- Function to get webhook events metadata
CREATE OR REPLACE FUNCTION get_webhook_events_metadata()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    providers_data jsonb;
    event_types_data jsonb;
    status_counts_data jsonb;
BEGIN
    -- Get unique providers
    SELECT jsonb_agg(DISTINCT provider ORDER BY provider)
    INTO providers_data
    FROM events_log;

    -- Get unique event types
    SELECT jsonb_agg(DISTINCT event_type ORDER BY event_type)
    INTO event_types_data
    FROM events_log;

    -- Get status counts
    SELECT jsonb_object_agg(status, count)
    INTO status_counts_data
    FROM (
        SELECT status, COUNT(*) as count
        FROM events_log
        GROUP BY status
    ) status_counts;

    -- Build result
    result := jsonb_build_object(
        'providers', COALESCE(providers_data, '[]'::jsonb),
        'eventTypes', COALESCE(event_types_data, '[]'::jsonb),
        'statusCounts', COALESCE(status_counts_data, '{}'::jsonb)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_webhook_events_metadata() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_webhook_events_metadata() IS 'Returns metadata for webhook events filtering including providers, event types, and status counts';