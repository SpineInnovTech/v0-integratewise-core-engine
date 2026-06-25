-- Phase 2: Analytics Backend D1 Tables
-- Stores conversion events, A/B test assignments, funnel sessions,
-- performance metrics, and pre-aggregated daily rollups for sub-100ms reads.

CREATE TABLE IF NOT EXISTS conversion_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page_url TEXT,
  variant_id TEXT,
  test_id TEXT,
  funnel_step TEXT,
  visitor_id TEXT,
  session_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conv_tenant ON conversion_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conv_test ON conversion_events(tenant_id, test_id);
CREATE INDEX IF NOT EXISTS idx_conv_funnel ON conversion_events(tenant_id, funnel_step);

CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ab_tenant_test ON ab_test_assignments(tenant_id, test_id);
CREATE INDEX IF NOT EXISTS idx_ab_visitor ON ab_test_assignments(visitor_id, test_id);

CREATE TABLE IF NOT EXISTS funnel_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  funnel_id TEXT NOT NULL,
  current_step TEXT NOT NULL,
  steps_completed TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_funnel_tenant ON funnel_sessions(tenant_id, funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_visitor ON funnel_sessions(visitor_id, funnel_id);

CREATE TABLE IF NOT EXISTS performance_metrics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  url TEXT NOT NULL,
  cls REAL,
  fid REAL,
  fcp REAL,
  lcp REAL,
  ttfb REAL,
  inp REAL,
  page_load_time REAL,
  dom_content_loaded REAL,
  is_mobile INTEGER DEFAULT 0,
  connection_type TEXT,
  device_memory REAL,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_perf_tenant ON performance_metrics(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_perf_session ON performance_metrics(session_id);

CREATE TABLE IF NOT EXISTS daily_aggregates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  date TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_key TEXT,
  value REAL NOT NULL,
  count INTEGER DEFAULT 1,
  min_value REAL,
  max_value REAL,
  p50 REAL,
  p95 REAL,
  UNIQUE(tenant_id, date, metric_type, metric_key)
);
CREATE INDEX IF NOT EXISTS idx_agg_tenant_date ON daily_aggregates(tenant_id, date, metric_type);
