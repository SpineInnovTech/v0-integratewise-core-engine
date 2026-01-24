-- Strategic Layer Tables for Business Intelligence
-- Business Goals - Quarterly/Annual targets linked to revenue
CREATE TABLE IF NOT EXISTS business_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  goal_type VARCHAR(30) NOT NULL, -- revenue, growth, product, operational, customer
  period_type VARCHAR(20) NOT NULL, -- quarterly, annual, monthly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value NUMERIC(12,2),
  current_value NUMERIC(12,2) DEFAULT 0,
  target_unit VARCHAR(20), -- currency, percentage, number
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'active', -- active, achieved, missed, paused
  progress INTEGER DEFAULT 0, -- 0-100
  parent_goal_id UUID REFERENCES business_goals(id),
  linked_products UUID[] DEFAULT '{}',
  linked_services UUID[] DEFAULT '{}',
  owner TEXT,
  priority VARCHAR(10) DEFAULT 'high',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Values - Core principles
CREATE TABLE IF NOT EXISTS company_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  principles TEXT[], -- Sub-principles
  examples TEXT[], -- How we apply this value
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools Mapping - Integrated tools and their purposes
CREATE TABLE IF NOT EXISTS tools_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category VARCHAR(30) NOT NULL, -- crm, sales, marketing, analytics, productivity, development
  tool_type VARCHAR(30), -- saas, internal, integration
  vendor TEXT,
  url TEXT,
  icon VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, evaluating
  integration_status VARCHAR(20) DEFAULT 'not_connected', -- connected, not_connected, partial
  api_connected BOOLEAN DEFAULT false,
  webhook_url TEXT,
  monthly_cost NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  used_by TEXT[], -- departments/teams
  linked_goals UUID[] DEFAULT '{}',
  features TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROI Tracking - Connect products/services to revenue and goals
CREATE TABLE IF NOT EXISTS roi_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(30) NOT NULL, -- product, service, campaign, tool
  entity_id UUID NOT NULL,
  entity_name TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  investment NUMERIC(12,2) DEFAULT 0, -- Cost/investment
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  customers_acquired INTEGER DEFAULT 0,
  roi_percentage NUMERIC(8,2), -- Calculated ROI
  notes TEXT,
  linked_goal_id UUID REFERENCES business_goals(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal Progress Log - Track progress over time
CREATE TABLE IF NOT EXISTS goal_progress_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES business_goals(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  progress_value NUMERIC(12,2),
  progress_percentage INTEGER,
  notes TEXT,
  recorded_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_type ON business_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_period ON business_goals(period_type);
CREATE INDEX IF NOT EXISTS idx_goals_status ON business_goals(status);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools_registry(category);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools_registry(status);
CREATE INDEX IF NOT EXISTS idx_roi_entity ON roi_tracking(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_roi_period ON roi_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_progress_goal ON goal_progress_log(goal_id);
