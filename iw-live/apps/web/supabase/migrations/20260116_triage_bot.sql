-- Triage Bot Schema Migration
-- Version: 1.0.0
-- Date: 2026-01-16
-- Description: Create tables and functions for AI-powered message triage

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Triage priority enum
DO $$ BEGIN
  CREATE TYPE triage_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Triage category enum
DO $$ BEGIN
  CREATE TYPE triage_category AS ENUM (
    'question',
    'bug_report',
    'feature_request',
    'support',
    'feedback',
    'urgent',
    'general',
    'spam'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Sentiment enum
DO $$ BEGIN
  CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Triage results table
CREATE TABLE IF NOT EXISTS triage_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'slack', 'discord', etc.
  channel_id TEXT,
  user_id TEXT,
  team_id TEXT,
  content TEXT NOT NULL,
  priority triage_priority NOT NULL,
  category triage_category NOT NULL,
  confidence NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  suggested_actions TEXT[] DEFAULT '{}',
  sentiment sentiment_type DEFAULT 'neutral',
  keywords TEXT[] DEFAULT '{}',
  assignee_suggestion TEXT,
  requires_immediate_attention BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS triage_results_message_id_idx 
  ON triage_results(message_id);

CREATE INDEX IF NOT EXISTS triage_results_platform_idx 
  ON triage_results(platform);

CREATE INDEX IF NOT EXISTS triage_results_priority_idx 
  ON triage_results(priority);

CREATE INDEX IF NOT EXISTS triage_results_category_idx 
  ON triage_results(category);

CREATE INDEX IF NOT EXISTS triage_results_urgent_idx 
  ON triage_results(requires_immediate_attention) 
  WHERE requires_immediate_attention = true;

CREATE INDEX IF NOT EXISTS triage_results_created_at_idx 
  ON triage_results(created_at DESC);

CREATE INDEX IF NOT EXISTS triage_results_sentiment_idx 
  ON triage_results(sentiment);

-- Create composite indexes
CREATE INDEX IF NOT EXISTS triage_results_platform_priority_idx 
  ON triage_results(platform, priority, created_at DESC);

-- Triage actions table (tracks actions taken on triaged messages)
CREATE TABLE IF NOT EXISTS triage_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  triage_result_id UUID NOT NULL REFERENCES triage_results(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'assigned', 'responded', 'escalated', 'resolved', 'ignored'
  actor_id TEXT, -- User who took the action
  actor_name TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS triage_actions_triage_result_id_idx 
  ON triage_actions(triage_result_id);

CREATE INDEX IF NOT EXISTS triage_actions_action_type_idx 
  ON triage_actions(action_type);

CREATE INDEX IF NOT EXISTS triage_actions_created_at_idx 
  ON triage_actions(created_at DESC);

-- Create updated_at trigger for triage_results
CREATE TRIGGER update_triage_results_updated_at
  BEFORE UPDATE ON triage_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for triage statistics
CREATE OR REPLACE VIEW triage_stats AS
SELECT
  platform,
  priority,
  category,
  sentiment,
  COUNT(*) AS total,
  AVG(confidence) AS avg_confidence,
  COUNT(CASE WHEN requires_immediate_attention THEN 1 END) AS urgent_count,
  MAX(created_at) AS last_triaged
FROM triage_results
GROUP BY platform, priority, category, sentiment;

-- Create view for urgent triage items
CREATE OR REPLACE VIEW urgent_triage_items AS
SELECT
  tr.id,
  tr.message_id,
  tr.platform,
  tr.channel_id,
  tr.user_id,
  tr.content,
  tr.priority,
  tr.category,
  tr.reasoning,
  tr.suggested_actions,
  tr.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM triage_actions ta WHERE ta.triage_result_id = tr.id)
    THEN true
    ELSE false
  END AS has_actions
FROM triage_results tr
WHERE tr.requires_immediate_attention = true
ORDER BY tr.created_at DESC;

-- Create function to get recent triage results with actions
CREATE OR REPLACE FUNCTION get_triage_results_with_actions(
  limit_count INT DEFAULT 50,
  filter_platform TEXT DEFAULT NULL,
  filter_priority triage_priority DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  message_id TEXT,
  platform TEXT,
  content TEXT,
  priority triage_priority,
  category triage_category,
  confidence NUMERIC,
  reasoning TEXT,
  suggested_actions TEXT[],
  sentiment sentiment_type,
  requires_immediate_attention BOOLEAN,
  created_at TIMESTAMPTZ,
  actions JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tr.id,
    tr.message_id,
    tr.platform,
    tr.content,
    tr.priority,
    tr.category,
    tr.confidence,
    tr.reasoning,
    tr.suggested_actions,
    tr.sentiment,
    tr.requires_immediate_attention,
    tr.created_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ta.id,
          'action_type', ta.action_type,
          'actor_name', ta.actor_name,
          'notes', ta.notes,
          'created_at', ta.created_at
        ) ORDER BY ta.created_at DESC
      ) FILTER (WHERE ta.id IS NOT NULL),
      '[]'::jsonb
    ) AS actions
  FROM triage_results tr
  LEFT JOIN triage_actions ta ON ta.triage_result_id = tr.id
  WHERE (filter_platform IS NULL OR tr.platform = filter_platform)
    AND (filter_priority IS NULL OR tr.priority = filter_priority)
  GROUP BY tr.id
  ORDER BY tr.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create function to get triage statistics for date range
CREATE OR REPLACE FUNCTION get_triage_stats_by_date(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  filter_platform TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_triaged BIGINT,
  urgent_count BIGINT,
  avg_confidence NUMERIC,
  by_priority JSONB,
  by_category JSONB,
  by_sentiment JSONB,
  response_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  total_count BIGINT;
  responded_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM triage_results
  WHERE created_at BETWEEN start_date AND end_date
    AND (filter_platform IS NULL OR platform = filter_platform);

  SELECT COUNT(*) INTO responded_count
  FROM triage_results tr
  JOIN triage_actions ta ON ta.triage_result_id = tr.id
  WHERE tr.created_at BETWEEN start_date AND end_date
    AND (filter_platform IS NULL OR tr.platform = filter_platform)
    AND ta.action_type IN ('responded', 'resolved');

  RETURN QUERY
  SELECT
    total_count,
    COUNT(CASE WHEN requires_immediate_attention THEN 1 END) AS urgent_count,
    AVG(confidence) AS avg_confidence,
    jsonb_object_agg(priority::text, priority_count) AS by_priority,
    jsonb_object_agg(category::text, category_count) AS by_category,
    jsonb_object_agg(sentiment::text, sentiment_count) AS by_sentiment,
    CASE WHEN total_count > 0 
      THEN ROUND((responded_count::NUMERIC / total_count::NUMERIC) * 100, 2)
      ELSE 0
    END AS response_rate
  FROM (
    SELECT
      priority,
      category,
      sentiment,
      confidence,
      requires_immediate_attention,
      COUNT(*) OVER (PARTITION BY priority) AS priority_count,
      COUNT(*) OVER (PARTITION BY category) AS category_count,
      COUNT(*) OVER (PARTITION BY sentiment) AS sentiment_count
    FROM triage_results
    WHERE created_at BETWEEN start_date AND end_date
      AND (filter_platform IS NULL OR platform = filter_platform)
  ) stats
  GROUP BY total_count, responded_count;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON triage_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON triage_actions TO authenticated;
GRANT SELECT ON triage_stats TO authenticated;
GRANT SELECT ON urgent_triage_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_triage_results_with_actions TO authenticated;
GRANT EXECUTE ON FUNCTION get_triage_stats_by_date TO authenticated;

-- Add helpful comments
COMMENT ON TABLE triage_results IS 'Stores AI-powered triage analysis of messages from Slack, Discord, etc.';
COMMENT ON TABLE triage_actions IS 'Tracks actions taken on triaged messages';
COMMENT ON VIEW triage_stats IS 'Aggregated statistics for triage results';
COMMENT ON VIEW urgent_triage_items IS 'View of all urgent items requiring immediate attention';
COMMENT ON FUNCTION get_triage_results_with_actions IS 'Retrieves triage results with associated actions';
COMMENT ON FUNCTION get_triage_stats_by_date IS 'Calculates triage statistics for a date range';
