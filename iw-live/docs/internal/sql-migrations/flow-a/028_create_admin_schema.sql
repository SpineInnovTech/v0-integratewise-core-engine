-- Admin users and roles
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- admin, super_admin, viewer
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  entity_name TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) NOT NULL, -- success, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_public BOOLEAN DEFAULT false,
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy rules
CREATE TABLE IF NOT EXISTS governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  policy_type VARCHAR(100) NOT NULL, -- data_access, action_approval, compliance
  rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  severity VARCHAR(50), -- low, medium, high, critical
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy violations
CREATE TABLE IF NOT EXISTS policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES governance_policies(id),
  user_email TEXT NOT NULL,
  violation_type VARCHAR(100),
  description TEXT,
  entity_type VARCHAR(100),
  entity_id UUID,
  severity VARCHAR(50),
  status VARCHAR(50) DEFAULT 'open', -- open, acknowledged, resolved
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration health monitoring
CREATE TABLE IF NOT EXISTS integration_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL,
  integration_type VARCHAR(100),
  status VARCHAR(50) NOT NULL, -- healthy, degraded, down
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_error_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  uptime_percentage NUMERIC(5,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed admin user (demo)
INSERT INTO admin_users (email, full_name, role, permissions, is_active)
VALUES ('admin@integratewise.online', 'Admin User', 'super_admin', '["all"]'::jsonb, true)
ON CONFLICT (email) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON policy_violations(status);
CREATE INDEX IF NOT EXISTS idx_policy_violations_severity ON policy_violations(severity);
CREATE INDEX IF NOT EXISTS idx_integration_health_status ON integration_health(status);
