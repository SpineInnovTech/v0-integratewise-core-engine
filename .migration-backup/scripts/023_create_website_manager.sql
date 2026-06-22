-- Website Pages - Manage website content pages
CREATE TABLE IF NOT EXISTS website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  page_type VARCHAR(30) DEFAULT 'page', -- page, blog, landing, service
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, scheduled, archived
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  featured_image TEXT,
  template VARCHAR(50) DEFAULT 'default',
  author TEXT,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website Forms - Track form submissions
CREATE TABLE IF NOT EXISTS website_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  form_type VARCHAR(30) NOT NULL, -- contact, newsletter, demo, quote, consultation
  page_id UUID REFERENCES website_pages(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active',
  fields JSONB DEFAULT '[]',
  submissions_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  connected_to VARCHAR(50), -- hubspot, email, crm
  hubspot_form_id TEXT,
  webhook_url TEXT,
  thank_you_message TEXT,
  redirect_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Submissions - Individual form entries
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES website_forms(id) ON DELETE CASCADE,
  page_id UUID REFERENCES website_pages(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  visitor_id TEXT,
  session_id TEXT,
  data JSONB NOT NULL,
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  referrer TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  synced_to_hubspot BOOLEAN DEFAULT false,
  hubspot_contact_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website Visitors - Track visitor sessions
CREATE TABLE IF NOT EXISTS website_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT UNIQUE NOT NULL,
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  total_visits INTEGER DEFAULT 1,
  total_pageviews INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  email TEXT,
  name TEXT,
  company TEXT,
  country TEXT,
  city TEXT,
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  first_referrer TEXT,
  first_utm_source TEXT,
  first_utm_campaign TEXT,
  lifecycle_stage VARCHAR(30) DEFAULT 'visitor', -- visitor, subscriber, lead, mql, sql, customer
  hubspot_contact_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page Views - Individual page view events
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES website_pages(id) ON DELETE CASCADE,
  visitor_id TEXT,
  session_id TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  time_on_page INTEGER DEFAULT 0,
  scroll_depth INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HubSpot Sync Log - Track all HubSpot syncs
CREATE TABLE IF NOT EXISTS hubspot_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(30) NOT NULL, -- contacts, deals, companies, campaigns, forms, emails
  direction VARCHAR(10) NOT NULL, -- inbound, outbound
  status VARCHAR(20) DEFAULT 'pending',
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website to Revenue Funnel - Track conversion journey
CREATE TABLE IF NOT EXISTS conversion_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  stage VARCHAR(30) NOT NULL, -- visit, engaged, form_submit, lead, mql, sql, opportunity, customer
  previous_stage VARCHAR(30),
  page_id UUID REFERENCES website_pages(id) ON DELETE SET NULL,
  form_id UUID REFERENCES website_forms(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  source TEXT,
  campaign TEXT,
  revenue_attributed NUMERIC(12,2) DEFAULT 0,
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pages_status ON website_pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON website_pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_type ON website_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_forms_status ON website_forms(status);
CREATE INDEX IF NOT EXISTS idx_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_lead ON form_submissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON website_visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_lead ON website_visitors(lead_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_page ON page_views(page_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_visitor ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_funnel_visitor ON conversion_funnel(visitor_id);
CREATE INDEX IF NOT EXISTS idx_funnel_stage ON conversion_funnel(stage);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_type ON hubspot_sync_log(sync_type);
