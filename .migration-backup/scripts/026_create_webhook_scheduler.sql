-- Webhook notification logs
CREATE TABLE IF NOT EXISTS webhook_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(20) NOT NULL, -- 'slack', 'discord', 'both'
  notification_type VARCHAR(30) NOT NULL, -- 'hourly_summary', 'daily_insights', 'alert', 'manual'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metrics JSONB DEFAULT '{}',
  recommendations TEXT[],
  alerts TEXT[],
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  slack_response JSONB,
  discord_response JSONB,
  error_message TEXT,
  triggered_by VARCHAR(30) DEFAULT 'cron', -- 'cron', 'manual', 'alert'
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook scheduler configuration
CREATE TABLE IF NOT EXISTS webhook_scheduler_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(20) NOT NULL,
  webhook_url TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  frequency VARCHAR(20) DEFAULT 'hourly', -- 'hourly', 'daily', 'weekly'
  include_metrics BOOLEAN DEFAULT true,
  include_recommendations BOOLEAN DEFAULT true,
  include_alerts BOOLEAN DEFAULT true,
  include_roi BOOLEAN DEFAULT true,
  alert_threshold_pipeline NUMERIC(12,2) DEFAULT 100000,
  alert_threshold_health INTEGER DEFAULT 70,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_channel ON webhook_notifications(channel);
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_status ON webhook_notifications(status);
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_created ON webhook_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_scheduler_channel ON webhook_scheduler_config(channel);
