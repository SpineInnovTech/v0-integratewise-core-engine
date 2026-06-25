-- Neutron Browser Read Tables
-- Capture browser activity for knowledge context

CREATE TABLE IF NOT EXISTS neutron_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  domain TEXT,
  favicon_url TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS neutron_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value_hash_sha256 TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'browser',
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key, value_hash_sha256),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS neutron_clipboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) DEFAULT 'text',
  snippet_hash_sha256 TEXT NOT NULL,
  length_bytes INT,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snippet_hash_sha256),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS neutron_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  mime TEXT,
  size BIGINT,
  source_url TEXT,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- TAM (Total Addressable Market) Tables
-- For CS lens tracking customer health

CREATE TABLE IF NOT EXISTS tam_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  segment VARCHAR(50),
  rag_status VARCHAR(20) DEFAULT 'Amber',
  technical_score INT DEFAULT 0,
  adoption_score INT DEFAULT 0,
  arr NUMERIC(18,2) DEFAULT 0,
  renewal_date DATE,
  renewal_risk VARCHAR(20) DEFAULT 'Low',
  renewal_revenue NUMERIC(18,2) DEFAULT 0,
  athr_percentage NUMERIC(5,2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (workspace_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tam_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tam_account_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  apis_count INT DEFAULT 0,
  messages_per_day INT DEFAULT 0,
  vcore_util_pct INT DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (tam_account_id) REFERENCES tam_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tam_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tam_account_id UUID NOT NULL,
  severity VARCHAR(20) DEFAULT 'Medium',
  title TEXT NOT NULL,
  description TEXT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'Open',
  assigned_to TEXT,
  tasks_done INT DEFAULT 0,
  tasks_total INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (tam_account_id) REFERENCES tam_accounts(id) ON DELETE CASCADE
);

-- Missing Goal Tables for Personal Lens
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC(18,2),
  current_value NUMERIC(18,2) DEFAULT 0,
  target_date DATE,
  status VARCHAR(50) DEFAULT 'Active',
  priority VARCHAR(20) DEFAULT 'Medium',
  category VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add missing columns to existing tables
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rag_status VARCHAR(20) DEFAULT 'Amber';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS technical_score INT DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS adoption_score INT DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_neutron_tabs_user_visited ON neutron_tabs(user_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_neutron_clipboard_user ON neutron_clipboard(user_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_tam_accounts_workspace ON tam_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tam_accounts_rag ON tam_accounts(rag_status);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);

-- RLS Policies
ALTER TABLE neutron_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE neutron_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE neutron_clipboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE neutron_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tam_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tam_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tam_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Personal data (neutron tables)
CREATE POLICY neutron_tabs_rls ON neutron_tabs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY neutron_storage_rls ON neutron_storage
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY neutron_clipboard_rls ON neutron_clipboard
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY neutron_downloads_rls ON neutron_downloads
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies - Goals (personal)
CREATE POLICY goals_rls ON goals
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies - TAM (CS team only)
CREATE POLICY tam_accounts_rls ON tam_accounts
  FOR SELECT USING (TRUE);

CREATE POLICY tam_environments_rls ON tam_environments
  FOR SELECT USING (TRUE);

CREATE POLICY tam_escalations_rls ON tam_escalations
  FOR SELECT USING (TRUE);
