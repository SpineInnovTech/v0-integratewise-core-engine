-- IntegrateWise Webhooks Table
-- Matches the structure from integratewise-webhooks repo

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL, -- razorpay, stripe, github, vercel, todoist, notion, ai-relay
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255), -- Provider's event ID
  payload JSONB NOT NULL,
  signature TEXT, -- Webhook signature for verification
  signature_valid BOOLEAN DEFAULT true,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhooks_provider ON webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON webhooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON webhooks(processed);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Policy for reading webhooks (allow all for now, can be restricted later)
CREATE POLICY "Allow all access to webhooks" ON webhooks FOR ALL USING (true);

-- Add comment
COMMENT ON TABLE webhooks IS 'Stores incoming webhooks from various providers (Razorpay, Stripe, GitHub, Vercel, Todoist, Notion, AI Relay)';
