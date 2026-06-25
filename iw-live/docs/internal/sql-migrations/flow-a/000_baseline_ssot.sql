-- Baseline SSOT Schema for IntegrateWise (Flow A)
-- Includes raw webhooks and normalized spine events

-- 1. Webhooks Table (The Raw Landing Zone)
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255),
  payload JSONB NOT NULL,
  signature TEXT,
  signature_valid BOOLEAN DEFAULT true,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_provider ON webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON webhooks(processed);

-- 2. Spine Events Table (The Normalized SSOT Zone)
CREATE TABLE IF NOT EXISTS spine_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  raw_webhook_id UUID REFERENCES webhooks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spine_events_source ON spine_events(source);
CREATE INDEX IF NOT EXISTS idx_spine_events_type ON spine_events(type);
CREATE INDEX IF NOT EXISTS idx_spine_events_timestamp ON spine_events(timestamp DESC);

-- 3. Basic Workspaces (For context)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
