-- Technical Account Management (TAM) Schema
-- Tracks technical health, adoption, best practices, and platform guidance

-- Customer Technical Profile
CREATE TABLE IF NOT EXISTS customer_technical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Stack Info
  primary_language VARCHAR(50), -- java, nodejs, python, etc
  runtime_version TEXT, -- JDK 17, Node 20.x, etc
  framework VARCHAR(100), -- Spring Boot, Express, Django
  platform VARCHAR(100), -- Salesforce, MuleSoft, AWS, GCP
  
  -- Environment Topology
  prod_url TEXT,
  preprod_url TEXT,
  dev_url TEXT,
  environments JSONB DEFAULT '[]', -- [{name, url, version, status}]
  
  -- Technical Scores
  technical_health_score INTEGER CHECK (technical_health_score >= 0 AND technical_health_score <= 100),
  adoption_score INTEGER CHECK (adoption_score >= 0 AND adoption_score <= 100),
  best_practices_score INTEGER CHECK (best_practices_score >= 0 AND best_practices_score <= 100),
  
  -- Infrastructure
  object_store VARCHAR(50), -- S3, GCS, Azure Blob
  external_cache VARCHAR(50), -- Redis, Memcached, Elasticache
  memory_config JSONB, -- {heap_size, gc_type, max_memory}
  
  -- Platform Specific
  salesforce_org_id TEXT,
  salesforce_edition VARCHAR(50), -- Enterprise, Unlimited, etc
  mulesoft_environment VARCHAR(50),
  mulesoft_runtime VARCHAR(20),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATHR (Architecture & Technical Health Reviews)
CREATE TABLE IF NOT EXISTS athr_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  review_date DATE NOT NULL,
  review_type VARCHAR(50) DEFAULT 'quarterly', -- quarterly, ad-hoc, crisis
  facilitator TEXT NOT NULL,
  attendees TEXT[], -- [name1, name2]
  
  -- Scores from review
  architecture_score INTEGER CHECK (architecture_score >= 0 AND architecture_score <= 100),
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
  scalability_score INTEGER CHECK (scalability_score >= 0 AND scalability_score <= 100),
  
  -- Findings
  key_findings TEXT[],
  risks_identified TEXT[],
  recommendations TEXT[],
  action_items JSONB DEFAULT '[]', -- [{item, owner, due_date, status}]
  
  -- Follow-up
  next_review_date DATE,
  status VARCHAR(20) DEFAULT 'completed', -- scheduled, completed, cancelled
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technical Debt Tracking
CREATE TABLE IF NOT EXISTS technical_debt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50), -- dependency, code-quality, security, performance
  severity VARCHAR(20), -- critical, high, medium, low
  
  -- Impact
  impact_area VARCHAR(50), -- prod, preprod, dev, all
  impact_description TEXT,
  estimated_effort_hours INTEGER,
  
  -- Dependency Info (for outdated dependencies)
  dependency_name TEXT,
  current_version TEXT,
  recommended_version TEXT,
  cve_ids TEXT[], -- CVE identifiers if security related
  
  -- Status
  status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, wont_fix
  identified_date DATE DEFAULT CURRENT_DATE,
  resolved_date DATE,
  assigned_to TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Best Practice Implementation Tracking
CREATE TABLE IF NOT EXISTS best_practice_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  practice_name TEXT NOT NULL,
  practice_category VARCHAR(50), -- architecture, security, performance, observability
  description TEXT,
  
  -- Implementation
  status VARCHAR(20) DEFAULT 'not_started', -- not_started, planned, in_progress, implemented, validated
  priority VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low
  
  implementation_date DATE,
  validation_date DATE,
  
  -- Business Impact
  expected_benefit TEXT,
  actual_benefit TEXT,
  mrr_impact NUMERIC(12,2),
  
  -- Guidance
  documentation_url TEXT,
  recommended_by TEXT,
  reviewed_by TEXT,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training & Enablement Sessions
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  session_type VARCHAR(50), -- onboarding, advanced, troubleshooting, best_practices
  topic TEXT, -- Salesforce Agent Force, MuleSoft AI Chain, etc
  
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  facilitator TEXT,
  attendees TEXT[],
  
  -- Content
  agenda TEXT,
  materials_url TEXT,
  recording_url TEXT,
  
  -- Outcome
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled
  completed_at TIMESTAMPTZ,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  feedback TEXT,
  
  -- Follow-up
  doubts_clarified INTEGER DEFAULT 0,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Developer Support Tickets (doubt clearance, arch help, dev help)
CREATE TABLE IF NOT EXISTS developer_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  ticket_type VARCHAR(30), -- doubt_clearance, dev_help, arch_help, bug_investigation
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Context
  affected_environment VARCHAR(20), -- prod, preprod, dev
  code_snippet TEXT,
  error_message TEXT,
  logs_url TEXT,
  
  -- Resolution
  status VARCHAR(20) DEFAULT 'open', -- open, in_progress, waiting_customer, resolved
  assigned_to TEXT,
  resolution TEXT,
  resolution_time_minutes INTEGER,
  
  -- Collaboration
  slack_thread_url TEXT,
  zoom_recording_url TEXT,
  
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Adoption Tracking
CREATE TABLE IF NOT EXISTS platform_adoption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  platform VARCHAR(50) NOT NULL, -- Salesforce, MuleSoft, Custom
  feature_name TEXT NOT NULL,
  feature_category VARCHAR(50), -- agent_force, mulesoft_ai_chain, einstein_ai, etc
  
  -- Adoption Status
  adoption_status VARCHAR(30) DEFAULT 'not_started', -- not_started, exploring, implementing, production, optimized
  started_date DATE,
  production_date DATE,
  
  -- Usage Metrics
  usage_frequency VARCHAR(20), -- daily, weekly, monthly, rarely
  active_users INTEGER,
  api_calls_monthly INTEGER,
  
  -- Business Value
  use_case TEXT,
  business_value TEXT,
  mrr_attributed NUMERIC(12,2),
  
  -- Health
  health_status VARCHAR(20) DEFAULT 'healthy', -- healthy, at_risk, critical
  blockers TEXT[],
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_technical_profiles_client ON customer_technical_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_athr_reviews_client_date ON athr_reviews(client_id, review_date DESC);
CREATE INDEX IF NOT EXISTS idx_technical_debt_client_status ON technical_debt(client_id, status);
CREATE INDEX IF NOT EXISTS idx_best_practices_client_status ON best_practice_implementations(client_id, status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_client_date ON training_sessions(client_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_support_client_status ON developer_support_tickets(client_id, status);
CREATE INDEX IF NOT EXISTS idx_platform_adoption_client ON platform_adoption(client_id, adoption_status);
