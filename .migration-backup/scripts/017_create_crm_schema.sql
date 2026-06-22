-- IntegrateWise CRM Schema
-- Tables for Leads, Campaigns, Activities, and Data Source Sync

-- =====================
-- LEADS TABLE
-- =====================
-- Changed first_name/last_name to single name column to match existing schema
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  title VARCHAR(255),
  linkedin_url TEXT,
  website TEXT,
  
  -- Lead Qualification
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost')),
  source VARCHAR(100),
  source_detail TEXT,
  score INTEGER DEFAULT 0,
  
  -- Assignment
  assigned_to VARCHAR(255),
  assigned_at TIMESTAMPTZ,
  
  -- Conversion
  converted_to_client_id UUID REFERENCES clients(id),
  converted_at TIMESTAMPTZ,
  
  -- External IDs for sync
  hubspot_id VARCHAR(100),
  pipedrive_id VARCHAR(100),
  external_source VARCHAR(50),
  external_id VARCHAR(255),
  
  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::text[],
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  last_contacted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- CAMPAIGNS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campaign Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) CHECK (type IN ('email', 'linkedin', 'ads', 'content', 'webinar', 'event', 'referral', 'cold_outreach', 'social', 'product_launch', 'outbound', 'community', 'beta')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),
  
  -- Targeting
  target_audience TEXT,
  channel VARCHAR(30),
  
  -- Schedule
  start_date DATE,
  end_date DATE,
  
  -- Budget & Goals
  budget DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Performance Metrics
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated DECIMAL(15,2) DEFAULT 0,
  
  -- External IDs
  hubspot_campaign_id VARCHAR(100),
  
  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::text[],
  content JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- LEAD ACTIVITIES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Activity Info
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'email_sent', 'email_opened', 'email_clicked', 'email_replied',
    'call_made', 'call_received', 'voicemail',
    'meeting_scheduled', 'meeting_completed', 'meeting_cancelled',
    'linkedin_connection', 'linkedin_message', 'linkedin_viewed',
    'website_visit', 'form_submission', 'document_viewed',
    'note_added', 'task_created', 'status_changed', 'score_changed'
  )),
  
  subject VARCHAR(255),
  description TEXT,
  
  -- Related entities
  campaign_id UUID REFERENCES campaigns(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  performed_by VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DATA SOURCE SYNC LOG
-- =====================
CREATE TABLE IF NOT EXISTS data_source_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  source VARCHAR(50) NOT NULL CHECK (source IN (
    'hubspot', 'pipedrive', 'stripe', 'google_sheets', 
    'google_analytics', 'asana', 'linkedin', 'razorpay'
  )),
  
  sync_type VARCHAR(50) CHECK (sync_type IN ('full', 'incremental', 'webhook')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Sync Stats
  records_fetched INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  error_details JSONB,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- =====================
-- REVENUE TRACKING (for Stripe/Razorpay sync)
-- =====================
CREATE TABLE IF NOT EXISTS revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction Info
  type VARCHAR(50) CHECK (type IN ('payment', 'refund', 'subscription', 'invoice')),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Related entities
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES client_projects(id),
  product_id UUID REFERENCES products(id),
  
  -- External references
  stripe_id VARCHAR(255),
  razorpay_id VARCHAR(255),
  invoice_number VARCHAR(100),
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- CONTENT LIBRARY
-- =====================
CREATE TABLE IF NOT EXISTS content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type VARCHAR(30) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  category VARCHAR(50),
  description TEXT,
  content TEXT,
  thumbnail_url TEXT,
  file_url TEXT,
  platform VARCHAR(30),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DEALS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id),
  product_id UUID REFERENCES products(id),
  stage VARCHAR(30) DEFAULT 'discovery',
  value NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'INR',
  probability INTEGER DEFAULT 10,
  expected_close_date DATE,
  actual_close_date DATE,
  assigned_to TEXT,
  source VARCHAR(50),
  notes TEXT,
  hubspot_deal_id TEXT,
  pipedrive_deal_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_hubspot_id ON leads(hubspot_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_campaign_id ON lead_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_source_sync_source ON data_source_sync(source);
CREATE INDEX IF NOT EXISTS idx_data_source_sync_status ON data_source_sync(status);

CREATE INDEX IF NOT EXISTS idx_revenue_transactions_client ON revenue_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_date ON revenue_transactions(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_content_library_type ON content_library(type);
CREATE INDEX IF NOT EXISTS idx_content_library_status ON content_library(status);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);

-- =====================
-- RLS POLICIES
-- =====================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Allow all for now (update with proper auth later)
CREATE POLICY "Allow all leads" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all campaigns" ON campaigns FOR ALL USING (true);
CREATE POLICY "Allow all lead_activities" ON lead_activities FOR ALL USING (true);
CREATE POLICY "Allow all data_source_sync" ON data_source_sync FOR ALL USING (true);
CREATE POLICY "Allow all revenue_transactions" ON revenue_transactions FOR ALL USING (true);
CREATE POLICY "Allow all content_library" ON content_library FOR ALL USING (true);
CREATE POLICY "Allow all deals" ON deals FOR ALL USING (true);
