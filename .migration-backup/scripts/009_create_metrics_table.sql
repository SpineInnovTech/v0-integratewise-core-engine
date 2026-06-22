-- Metrics/KPIs table for business metrics
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL, -- 'mrr', 'pipeline', 'revenue', 'active_projects', 'leads', 'posts', 'followers'
  metric_value DECIMAL(15, 2) NOT NULL,
  metric_unit VARCHAR(20), -- 'currency', 'count', 'percentage'
  currency VARCHAR(10) DEFAULT 'INR',
  period_start DATE,
  period_end DATE,
  change_percentage DECIMAL(5, 2),
  change_direction VARCHAR(10), -- 'up', 'down', 'neutral'
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS metrics_metric_name_idx ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS metrics_recorded_at_idx ON metrics(recorded_at DESC);
