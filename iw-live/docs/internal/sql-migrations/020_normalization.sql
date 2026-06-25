-- Migration: 020_normalization.sql
-- Description: Normalizer Dead Letter Queue (DLQ) and canonical versioning
-- Created: 2026-01-29

-- =============================================================================
-- NORMALIZATION ERRORS TABLE (DLQ)
-- Captures failed normalization attempts for review and retry
-- =============================================================================

CREATE TABLE IF NOT EXISTS normalization_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  entity_type VARCHAR(50),
  raw_data JSONB,
  errors JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_norm_errors_tenant ON normalization_errors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_norm_errors_type ON normalization_errors(entity_type);

-- =============================================================================
-- CANONICAL VERSIONS TABLE
-- Tracks version numbers for deduplication keys to handle concurrent updates
-- =============================================================================

CREATE TABLE IF NOT EXISTS canonical_versions (
  dedup_key VARCHAR(255) PRIMARY KEY,
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
