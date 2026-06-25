-- Migration: Create workflow_recommendations table for approval workflows
-- This table stores recommendations waiting for human approval via Cloudflare Workflows

CREATE TABLE IF NOT EXISTS workflow_recommendations (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL UNIQUE,  -- Cloudflare Workflow instance ID
  tenant_id TEXT NOT NULL,
  user_id TEXT,                       -- Target user for approval (null = any)
  signal_id TEXT,                     -- Source signal that triggered this
  
  -- Recommendation data
  type TEXT NOT NULL CHECK (type IN ('action', 'insight', 'alert')),
  title TEXT NOT NULL,
  description TEXT,
  action_data TEXT,                   -- JSON: action to execute if approved
  confidence INTEGER DEFAULT 0,       -- 0-100
  evidence TEXT,                      -- JSON array of evidence sources
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto-approved', 'expired')),
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  approved_at TEXT,
  rejected_at TEXT,
  
  -- Approval metadata
  approved_by TEXT,
  rejected_by TEXT,
  comments TEXT
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_workflow_rec_tenant_status ON workflow_recommendations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_rec_user_status ON workflow_recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_rec_instance ON workflow_recommendations(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rec_created ON workflow_recommendations(created_at DESC);
