-- IntegrateWise Message Persistence & Reliability Enhancements
-- Migration: 027_message_persistence_enhancements.sql
-- Description: Enhance webhook event persistence with retry mechanisms, dead letter queues, and improved reliability

-- ============================================================================
-- Add retry and dead letter queue support to events_log
-- ============================================================================

-- Add retry tracking columns
ALTER TABLE events_log
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_retry_error TEXT,
ADD COLUMN IF NOT EXISTS dead_letter_at TIMESTAMPTZ;

-- Add index for retry scheduling
CREATE INDEX IF NOT EXISTS idx_events_log_next_retry ON events_log(next_retry_at) WHERE next_retry_at IS NOT NULL AND status = 'retrying';
CREATE INDEX IF NOT EXISTS idx_events_log_dead_letter ON events_log(dead_letter_at) WHERE dead_letter_at IS NOT NULL;

-- ============================================================================
-- Dead letter queue table for permanently failed events
-- ============================================================================

CREATE TABLE IF NOT EXISTS dead_letter_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_event_id UUID NOT NULL REFERENCES events_log(id) ON DELETE CASCADE,

    -- Original event data (snapshot)
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB,
    raw_body TEXT,
    dedupe_hash VARCHAR(64) NOT NULL,

    -- Failure information
    final_error_message TEXT NOT NULL,
    total_retry_count INTEGER NOT NULL DEFAULT 0,
    first_failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dead_letter_reason VARCHAR(100) NOT NULL DEFAULT 'max_retries_exceeded',

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for dead letter queue
CREATE INDEX IF NOT EXISTS idx_dead_letter_provider ON dead_letter_queue(provider);
CREATE INDEX IF NOT EXISTS idx_dead_letter_event_type ON dead_letter_queue(event_type);
CREATE INDEX IF NOT EXISTS idx_dead_letter_created_at ON dead_letter_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dead_letter_original_event ON dead_letter_queue(original_event_id);

-- ============================================================================
-- Event processing metrics table
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_processing_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Processing counts
    received_count INTEGER NOT NULL DEFAULT 0,
    processed_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    retry_count INTEGER NOT NULL DEFAULT 0,
    dead_letter_count INTEGER NOT NULL DEFAULT 0,

    -- Performance metrics
    avg_processing_time_ms INTEGER,
    max_processing_time_ms INTEGER,
    min_processing_time_ms INTEGER,

    -- Updated timestamp
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(provider, event_type, date)
);

-- ============================================================================
-- Functions for retry and dead letter management
-- ============================================================================

-- Function to schedule next retry with exponential backoff
CREATE OR REPLACE FUNCTION schedule_event_retry(
    event_id UUID,
    current_retry_count INTEGER,
    error_message TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    next_retry_delay INTERVAL;
    max_retries INTEGER := 3;
BEGIN
    -- Calculate exponential backoff: 30s, 5m, 30m
    CASE current_retry_count
        WHEN 1 THEN next_retry_delay := INTERVAL '30 seconds';
        WHEN 2 THEN next_retry_delay := INTERVAL '5 minutes';
        WHEN 3 THEN next_retry_delay := INTERVAL '30 minutes';
        ELSE
            -- Move to dead letter queue
            PERFORM move_to_dead_letter_queue(event_id, error_message, 'max_retries_exceeded');
            RETURN FALSE;
    END CASE;

    -- Update event for retry
    UPDATE events_log
    SET
        retry_count = current_retry_count + 1,
        next_retry_at = NOW() + next_retry_delay,
        last_retry_error = error_message,
        status = 'retrying',
        updated_at = NOW()
    WHERE id = event_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to move failed event to dead letter queue
CREATE OR REPLACE FUNCTION move_to_dead_letter_queue(
    event_id UUID,
    error_message TEXT,
    reason VARCHAR(100) DEFAULT 'max_retries_exceeded'
) RETURNS VOID AS $$
BEGIN
    -- Insert into dead letter queue
    INSERT INTO dead_letter_queue (
        original_event_id,
        provider,
        event_type,
        payload,
        headers,
        raw_body,
        dedupe_hash,
        final_error_message,
        total_retry_count,
        dead_letter_reason
    )
    SELECT
        id,
        provider,
        event_type,
        payload,
        headers,
        raw_body,
        dedupe_hash,
        error_message,
        retry_count,
        reason
    FROM events_log
    WHERE id = event_id;

    -- Mark original event as dead lettered
    UPDATE events_log
    SET
        status = 'dead_lettered',
        dead_letter_at = NOW(),
        updated_at = NOW()
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update processing metrics
CREATE OR REPLACE FUNCTION update_event_metrics(
    provider_name VARCHAR(50),
    event_name VARCHAR(100),
    status_change VARCHAR(20),
    processing_time_ms INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    today DATE := CURRENT_DATE;
BEGIN
    INSERT INTO event_processing_metrics (
        provider, event_type, date,
        received_count, processed_count, failed_count, retry_count, dead_letter_count,
        avg_processing_time_ms, max_processing_time_ms, min_processing_time_ms,
        updated_at
    )
    VALUES (
        provider_name, event_name, today,
        CASE WHEN status_change = 'received' THEN 1 ELSE 0 END,
        CASE WHEN status_change = 'processed' THEN 1 ELSE 0 END,
        CASE WHEN status_change = 'failed' THEN 1 ELSE 0 END,
        CASE WHEN status_change = 'retrying' THEN 1 ELSE 0 END,
        CASE WHEN status_change = 'dead_lettered' THEN 1 ELSE 0 END,
        processing_time_ms,
        processing_time_ms,
        processing_time_ms,
        NOW()
    )
    ON CONFLICT (provider, event_type, date)
    DO UPDATE SET
        received_count = event_processing_metrics.received_count +
            CASE WHEN status_change = 'received' THEN 1 ELSE 0 END,
        processed_count = event_processing_metrics.processed_count +
            CASE WHEN status_change = 'processed' THEN 1 ELSE 0 END,
        failed_count = event_processing_metrics.failed_count +
            CASE WHEN status_change = 'failed' THEN 1 ELSE 0 END,
        retry_count = event_processing_metrics.retry_count +
            CASE WHEN status_change = 'retrying' THEN 1 ELSE 0 END,
        dead_letter_count = event_processing_metrics.dead_letter_count +
            CASE WHEN status_change = 'dead_lettered' THEN 1 ELSE 0 END,
        avg_processing_time_ms = CASE
            WHEN processing_time_ms IS NOT NULL THEN
                COALESCE(event_processing_metrics.avg_processing_time_ms, 0) +
                (processing_time_ms - COALESCE(event_processing_metrics.avg_processing_time_ms, 0)) /
                (event_processing_metrics.processed_count + 1)
            ELSE event_processing_metrics.avg_processing_time_ms
        END,
        max_processing_time_ms = GREATEST(
            COALESCE(event_processing_metrics.max_processing_time_ms, 0),
            COALESCE(processing_time_ms, 0)
        ),
        min_processing_time_ms = LEAST(
            COALESCE(event_processing_metrics.min_processing_time_ms, 999999),
            COALESCE(processing_time_ms, 999999)
        ),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE dead_letter_queue IS 'Dead letter queue for events that failed processing after all retries';
COMMENT ON TABLE event_processing_metrics IS 'Daily metrics for webhook event processing performance';
COMMENT ON FUNCTION schedule_event_retry(UUID, INTEGER, TEXT) IS 'Schedules next retry for failed event with exponential backoff';
COMMENT ON FUNCTION move_to_dead_letter_queue(UUID, TEXT, VARCHAR) IS 'Moves permanently failed event to dead letter queue';
COMMENT ON FUNCTION update_event_metrics(VARCHAR, VARCHAR, VARCHAR, INTEGER) IS 'Updates daily processing metrics for events';</content>
<parameter name="filePath">/Users/nirmal/Downloads/New Folder With Items/integratewise-knowledge-bank/sql-migrations/027_message_persistence_enhancements.sql