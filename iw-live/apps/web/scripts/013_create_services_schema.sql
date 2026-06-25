-- IntegrateWise LLP Services Schema
-- Supports all 6 tiers of business services

-- Services/Products catalog
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 6),
  tier_name VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pricing_type VARCHAR(50) NOT NULL, -- 'fixed', 'monthly', 'yearly', 'one-time', 'usage'
  price_min DECIMAL(12, 2),
  price_max DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  modules JSONB DEFAULT '[]', -- For SaaS modules
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  industry VARCHAR(100),
  company_size VARCHAR(50), -- 'startup', 'smb', 'mid-market', 'enterprise'
  status VARCHAR(50) DEFAULT 'prospect', -- 'prospect', 'active', 'churned', 'paused'
  source VARCHAR(100), -- 'referral', 'linkedin', 'website', 'conference'
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects / Engagements
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'discovery', -- 'discovery', 'proposal', 'negotiation', 'active', 'completed', 'cancelled'
  stage VARCHAR(50), -- 'audit', 'implementation', 'support', 'optimization'
  start_date DATE,
  end_date DATE,
  contract_value DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  billing_type VARCHAR(50), -- 'fixed', 'monthly', 'milestone', 'hourly'
  health_score INTEGER CHECK (health_score BETWEEN 1 AND 10),
  owner VARCHAR(255),
  tags TEXT[] DEFAULT ARRAY[]::text[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (for recurring services)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  plan_name VARCHAR(100),
  modules TEXT[] DEFAULT ARRAY[]::text[], -- For SaaS: ['template_forge', 'normalize_ai', 'cs_hub']
  mrr DECIMAL(12, 2) NOT NULL,
  arr DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'active', -- 'trial', 'active', 'paused', 'cancelled'
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
  start_date DATE NOT NULL,
  renewal_date DATE,
  cancellation_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue tracking
CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  tier INTEGER,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  type VARCHAR(50) NOT NULL, -- 'service', 'subscription', 'product', 'workshop', 'certification'
  invoice_number VARCHAR(100),
  invoice_date DATE,
  payment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline / Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  value DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  stage VARCHAR(50) DEFAULT 'discovery', -- 'discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
  probability INTEGER DEFAULT 10 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  owner VARCHAR(255),
  source VARCHAR(100),
  notes TEXT,
  lost_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_services_tier ON services(tier);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_revenue_client ON revenue(client_id);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(invoice_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Allow all access policies (update with proper auth later)
DROP POLICY IF EXISTS "Allow all access to services" ON services;
CREATE POLICY "Allow all access to services" ON services FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to clients" ON clients;
CREATE POLICY "Allow all access to clients" ON clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to projects" ON projects;
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to subscriptions" ON subscriptions;
CREATE POLICY "Allow all access to subscriptions" ON subscriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to revenue" ON revenue;
CREATE POLICY "Allow all access to revenue" ON revenue FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to opportunities" ON opportunities;
CREATE POLICY "Allow all access to opportunities" ON opportunities FOR ALL USING (true);
