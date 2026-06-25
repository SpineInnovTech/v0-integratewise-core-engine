-- Spine Audit Log Migration
-- Database: integratewise-spine-cache (D1)
-- Purpose: Track every Spine access for SOC 2, GDPR compliance
-- Authority: AGENTS.md Rule 8 (Agent Continuity Protocol)
-- Created: 2026-06-09

-- Drop existing table if exists (for clean migration)
DROP TABLE IF EXISTS spine_audit_log;

-- Create audit log table
CREATE TABLE spine_audit_log (
  -- Primary identifier
  id TEXT PRIMARY KEY,
  
  -- Temporal tracking
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Session & Agent tracking
  session_id TEXT NOT NULL,
  
  -- Spine operation details
  event TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  
  -- Access method
  via TEXT NOT NULL,
  tool TEXT,
  
  -- Write-specific fields
  operation TEXT,
  fields_changed TEXT, -- JSON array
  
  -- Search/List-specific fields
  query TEXT,
  query_limit INTEGER,
  query_offset INTEGER,
  results_count INTEGER,
  
  -- Tenant isolation
  tenant_id TEXT NOT NULL,
  
  -- Result tracking
  result TEXT NOT NULL,
  error_message TEXT,
  
  -- Performance monitoring
  duration_ms INTEGER NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX idx_spine_audit_tenant 
  ON spine_audit_log(tenant_id, timestamp DESC);

CREATE INDEX idx_spine_audit_entity 
  ON spine_audit_log(entity_type, entity_id, timestamp DESC);

CREATE INDEX idx_spine_audit_session 
  ON spine_audit_log(session_id, timestamp);

CREATE INDEX idx_spine_audit_event 
  ON spine_audit_log(event, timestamp DESC);

CREATE INDEX idx_spine_audit_result 
  ON spine_audit_log(result, timestamp DESC) 
  WHERE result IN ('error', 'denied');

-- Verify table created
SELECT 'Spine audit log table created successfully' as status;
