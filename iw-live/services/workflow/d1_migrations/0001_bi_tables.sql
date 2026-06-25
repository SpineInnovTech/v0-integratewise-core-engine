-- Phase 3: Business Intelligence D1 Tables
-- Mirrors bi.* schema from Supabase for Cloudflare-native queries

CREATE TABLE IF NOT EXISTS bi_department_health (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  department TEXT NOT NULL,
  health_score REAL DEFAULT 0,
  risk_count INTEGER DEFAULT 0,
  active_initiatives INTEGER DEFAULT 0,
  stalled_tasks INTEGER DEFAULT 0,
  team_capacity REAL DEFAULT 0,
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, department)
);
CREATE INDEX IF NOT EXISTS idx_bi_dept_tenant ON bi_department_health(tenant_id, department);

CREATE TABLE IF NOT EXISTS bi_executive_metrics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL DEFAULT 0,
  target_value REAL DEFAULT 0,
  trend TEXT DEFAULT 'flat',
  period TEXT DEFAULT 'monthly',
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, metric_name, period)
);
CREATE INDEX IF NOT EXISTS idx_bi_exec_tenant ON bi_executive_metrics(tenant_id, metric_name);

CREATE TABLE IF NOT EXISTS bi_founder_dashboard (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  current_value REAL DEFAULT 0,
  previous_value REAL DEFAULT 0,
  change_percent REAL DEFAULT 0,
  status TEXT DEFAULT 'neutral',
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, category, metric_name)
);
CREATE INDEX IF NOT EXISTS idx_bi_founder_tenant ON bi_founder_dashboard(tenant_id, category);

CREATE TABLE IF NOT EXISTS bi_cross_department_signals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  source_department TEXT NOT NULL,
  target_department TEXT,
  severity TEXT DEFAULT 'medium',
  message TEXT,
  acknowledged INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bi_signal_tenant ON bi_cross_department_signals(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS bi_strategic_decisions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  decision_title TEXT NOT NULL,
  decision_type TEXT DEFAULT 'operational',
  impact_score REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  decided_by TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bi_decision_tenant ON bi_strategic_decisions(tenant_id, status);

-- Seed data for demo
INSERT OR IGNORE INTO bi_department_health (id, tenant_id, department, health_score, risk_count, active_initiatives, stalled_tasks, team_capacity) VALUES
('1', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Customer Success', 87, 2, 5, 1, 85),
('2', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Sales', 92, 1, 8, 0, 90),
('3', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Product', 78, 4, 3, 2, 70),
('4', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Engineering', 95, 0, 12, 0, 95),
('5', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Marketing', 82, 3, 4, 1, 80);

INSERT OR IGNORE INTO bi_executive_metrics (id, tenant_id, metric_name, metric_value, target_value, trend, period) VALUES
('1', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'ARR', 1850000, 2000000, 'up', 'monthly'),
('2', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'NRR', 108, 110, 'up', 'monthly'),
('3', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Gross Margin', 74, 75, 'flat', 'monthly'),
('4', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'CAC Payback', 14, 12, 'down', 'monthly'),
('5', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Logo Churn', 2.1, 3, 'down', 'monthly');

INSERT OR IGNORE INTO bi_founder_dashboard (id, tenant_id, category, metric_name, current_value, previous_value, change_percent, status) VALUES
('1', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Revenue', 'MRR', 154000, 148000, 4.1, 'positive'),
('2', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Revenue', 'New ARR', 320000, 280000, 14.3, 'positive'),
('3', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Growth', 'Active Accounts', 47, 42, 11.9, 'positive'),
('4', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Growth', 'Expansion Rate', 18, 15, 20.0, 'positive'),
('5', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Efficiency', 'Burn Multiple', 1.2, 1.4, -14.3, 'positive'),
('6', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Efficiency', 'Runway', 18, 16, 12.5, 'neutral');

INSERT OR IGNORE INTO bi_cross_department_signals (id, tenant_id, signal_type, source_department, target_department, severity, message) VALUES
('1', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'capacity_warning', 'Engineering', 'Product', 'medium', 'Engineering capacity at 95% - may delay Product roadmap items'),
('2', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'risk_alert', 'Customer Success', 'Sales', 'high', '3 at-risk accounts with $240K ARR renewing next 30 days'),
('3', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'opportunity', 'Sales', 'Customer Success', 'low', 'New enterprise deal closed - requires onboarding resources');

INSERT OR IGNORE INTO bi_strategic_decisions (id, tenant_id, decision_title, decision_type, impact_score, status, decided_by, decided_at) VALUES
('1', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Expand to EU market', 'strategic', 85, 'approved', 'CEO', '2026-05-15'),
('2', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Hire 3 senior engineers', 'operational', 70, 'pending', NULL, NULL),
('3', '2e7a2345-42a9-4afa-b514-7f49214abd53', 'Sunset legacy connector', 'operational', 60, 'approved', 'CTO', '2026-05-20');