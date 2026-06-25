-- Technical Account Management (TAM) Schema
-- Enterprise CSM system for 4-10 high-touch accounts

-- TAM Accounts (Enterprise customers with deep technical engagement)
CREATE TABLE IF NOT EXISTS public.tam_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  sf_account_id TEXT, -- Salesforce sync
  industry TEXT,
  region TEXT CHECK (region IN ('EMEA', 'APAC', 'AMER')),
  timezone TEXT,
  tier TEXT CHECK (tier IN ('Enterprise', 'Strategic', 'Commercial')) DEFAULT 'Enterprise',
  
  -- Health Scoring
  health_status TEXT CHECK (health_status IN ('Green', 'Amber', 'Red', 'Growth', 'Stable')) DEFAULT 'Green',
  css_score NUMERIC(4,2) DEFAULT 7.0, -- Customer Success Score (1-10)
  technical_score INTEGER DEFAULT 70, -- 0-100
  adoption_score INTEGER DEFAULT 70, -- 0-100%
  nps_score INTEGER DEFAULT 50, -- -100 to 100
  
  -- Licensing & Infrastructure
  vcores_allocated INTEGER DEFAULT 0,
  vcores_current_usage NUMERIC(5,2) DEFAULT 0,
  licenses_procured INTEGER DEFAULT 0,
  licenses_activated INTEGER DEFAULT 0,
  active_users_30d INTEGER DEFAULT 0,
  power_users INTEGER DEFAULT 0,
  
  -- Usage Metrics
  monthly_api_calls BIGINT DEFAULT 0,
  message_flow_daily BIGINT DEFAULT 0,
  payg_monthly_spend NUMERIC(12,2) DEFAULT 0,
  
  -- Business
  arr NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  renewal_date DATE,
  renewal_value NUMERIC(12,2) DEFAULT 0,
  expansion_opportunity NUMERIC(12,2) DEFAULT 0,
  churn_risk_factors TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- CSM Relationship
  csm_owner TEXT DEFAULT 'Nirmal',
  csm_secondary TEXT,
  last_touch_date DATE,
  next_scheduled_call TIMESTAMPTZ,
  last_athr_date DATE, -- Last Annual Technical Health Review
  next_athr_date DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TAM Environments (Prod/Staging/Dev per account)
CREATE TABLE IF NOT EXISTS public.tam_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.tam_accounts(id) ON DELETE CASCADE,
  name TEXT CHECK (name IN ('Production', 'Staging', 'Development')) NOT NULL,
  status TEXT CHECK (status IN ('Healthy', 'Warning', 'Critical')) DEFAULT 'Healthy',
  
  -- Technical Details
  java_version TEXT,
  runtime_version TEXT, -- Mule Runtime version
  
  -- Infrastructure
  vcores_allocated INTEGER DEFAULT 0,
  vcores_usage_percent NUMERIC(5,2) DEFAULT 0,
  memory_usage_mb INTEGER DEFAULT 0,
  memory_total_mb INTEGER DEFAULT 0,
  
  -- Performance
  api_count INTEGER DEFAULT 0,
  daily_message_flow BIGINT DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  error_rate_percent NUMERIC(5,2) DEFAULT 0,
  uptime_percent NUMERIC(5,2) DEFAULT 100.00,
  
  -- Deployment Activity
  last_deployment_date TIMESTAMPTZ,
  deployments_this_month INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(account_id, name)
);

-- TAM APIs (100-400+ APIs per account)
CREATE TABLE IF NOT EXISTS public.tam_apis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.tam_accounts(id) ON DELETE CASCADE,
  environment_id UUID REFERENCES public.tam_environments(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  api_type TEXT CHECK (api_type IN ('System', 'Process', 'Experience', 'Batch', 'Manager', 'Contract')) DEFAULT 'System',
  version TEXT,
  status TEXT CHECK (status IN ('Active', 'Deprecated', 'Inactive', 'Development')) DEFAULT 'Active',
  
  -- Classification
  domain TEXT, -- e.g., "Finance", "HR", "Supply Chain"
  criticality TEXT CHECK (criticality IN ('Mission Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  
  -- Performance Metrics (updated regularly)
  daily_invocations BIGINT DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  error_rate_percent NUMERIC(5,2) DEFAULT 0,
  uptime_percent NUMERIC(5,2) DEFAULT 100.00,
  last_error_timestamp TIMESTAMPTZ,
  
  -- Technical Health
  uses_caching BOOLEAN DEFAULT false,
  uses_error_handling BOOLEAN DEFAULT false,
  has_monitoring BOOLEAN DEFAULT false,
  has_circuit_breaker BOOLEAN DEFAULT false,
  dataweave_version TEXT,
  
  -- Compliance
  last_code_review_date DATE,
  security_scan_status TEXT CHECK (security_scan_status IN ('Pass', 'Warning', 'Fail')),
  vulnerability_count INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  deployed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ATHR (Annual Technical Health Review)
CREATE TABLE IF NOT EXISTS public.tam_athr_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.tam_accounts(id) ON DELETE CASCADE,
  
  review_date DATE NOT NULL,
  fiscal_year TEXT,
  review_type TEXT CHECK (review_type IN ('Annual', 'Mid-Year', 'Emergency')) DEFAULT 'Annual',
  
  -- Participants
  csm_lead TEXT DEFAULT 'Nirmal',
  customer_attendees JSONB DEFAULT '[]'::JSONB, -- [{name, title}]
  salesforce_attendees JSONB DEFAULT '[]'::JSONB,
  
  -- Scores & Findings
  technical_score INTEGER,
  technical_score_change INTEGER, -- vs last year
  adoption_score INTEGER,
  adoption_score_change INTEGER,
  
  -- Key Findings
  strengths JSONB DEFAULT '[]'::JSONB, -- Array of bullet points
  gaps JSONB DEFAULT '[]'::JSONB,
  risks JSONB DEFAULT '[]'::JSONB,
  recommendations JSONB DEFAULT '[]'::JSONB, -- [{text, priority}]
  
  -- Architecture Assessment
  api_maturity_level TEXT CHECK (api_maturity_level IN ('Initial', 'Developing', 'Defined', 'Managed', 'Optimizing')),
  infrastructure_grade TEXT CHECK (infrastructure_grade IN ('A', 'B', 'C', 'D', 'F')),
  security_posture TEXT CHECK (security_posture IN ('Strong', 'Adequate', 'Needs Improvement', 'Critical')),
  
  -- Artifacts (Google Drive links)
  presentation_deck_url TEXT,
  findings_doc_url TEXT,
  recording_url TEXT,
  
  -- Outcome
  action_items_count INTEGER DEFAULT 0,
  action_items_completed INTEGER DEFAULT 0,
  follow_up_date DATE,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  presented_at TIMESTAMPTZ
);

-- ATHR Action Items (Tasks from ATHR)
CREATE TABLE IF NOT EXISTS public.tam_athr_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athr_review_id UUID REFERENCES public.tam_athr_reviews(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.tam_accounts(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Architecture', 'Infrastructure', 'Security', 'Performance', 'Training', 'Process')),
  priority TEXT CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  
  assigned_to TEXT CHECK (assigned_to IN ('Customer', 'Salesforce', 'Joint')) DEFAULT 'Customer',
  owner_name TEXT,
  
  due_date DATE,
  status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Completed', 'Cancelled')) DEFAULT 'Not Started',
  completion_date DATE,
  blocker_reason TEXT,
  
  impact TEXT CHECK (impact IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
  estimated_effort TEXT,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TAM Activities (Incidents, Tasks, Meetings, Training)
CREATE TABLE IF NOT EXISTS public.tam_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.tam_accounts(id) ON DELETE CASCADE,
  
  activity_type TEXT CHECK (activity_type IN ('Incident', 'Task', 'Meeting', 'Training', 'Enhancement', 'Question')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Prioritization
  severity TEXT CHECK (severity IN ('P1', 'P2', 'P3', 'P4')) DEFAULT 'P3',
  priority TEXT CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  
  -- Workflow
  status TEXT CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed', 'Blocked')) DEFAULT 'Open',
  assigned_to TEXT,
  requester_name TEXT,
  requester_email TEXT,
  
  -- Timing
  reported_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  sla_breach BOOLEAN DEFAULT false,
  
  -- CSM Engagement Tracking
  csm_activity_type TEXT CHECK (csm_activity_type IN ('Training', 'Dev Help', 'Arch Help', 'Doubt Clearance', 'Strategic Review')),
  csm_hours_spent NUMERIC(5,2) DEFAULT 0,
  csm_mrr_attribution NUMERIC(10,2) DEFAULT 0, -- Value delivered
  
  -- Technical Details
  environment TEXT CHECK (environment IN ('Production', 'Staging', 'Development', 'All')),
  affected_apis TEXT[] DEFAULT ARRAY[]::TEXT[],
  root_cause TEXT,
  resolution TEXT,
  
  -- Slack/Email Integration
  slack_channel_id TEXT,
  slack_thread_ts TEXT,
  email_thread_id TEXT,
  
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TAM Daily Metrics Snapshot
CREATE TABLE IF NOT EXISTS public.tam_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.tam_accounts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  
  -- Health Scores
  technical_score INTEGER,
  technical_score_delta INTEGER, -- vs yesterday
  adoption_score INTEGER,
  adoption_score_delta INTEGER,
  
  -- Infrastructure
  vcores_usage_percent NUMERIC(5,2),
  message_flow_count BIGINT,
  api_error_rate_percent NUMERIC(5,2),
  
  -- Deployment Activity
  apis_deployed_today INTEGER DEFAULT 0,
  apis_updated_today INTEGER DEFAULT 0,
  deployment_success_rate NUMERIC(5,2),
  
  -- Engagement Activity
  emails_received INTEGER DEFAULT 0,
  meetings_held INTEGER DEFAULT 0,
  incidents_opened INTEGER DEFAULT 0,
  incidents_resolved INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  
  -- License Utilization
  active_users_today INTEGER DEFAULT 0,
  license_logins_today INTEGER DEFAULT 0,
  
  -- Pay-as-you-go
  payg_spend_today NUMERIC(10,2) DEFAULT 0,
  payg_api_calls BIGINT DEFAULT 0,
  
  -- Narrative Summary (AI-generated)
  highlights TEXT,
  risks TEXT,
  next_actions TEXT,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(account_id, snapshot_date)
);

-- TAM Meetings & Cadence
CREATE TABLE IF NOT EXISTS public.tam_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.tam_accounts(id) ON DELETE CASCADE,
  
  meeting_type TEXT CHECK (meeting_type IN ('Business Review', 'Technical Deep Dive', 'ATHR', 'Training', 'Escalation', 'Check-in')) NOT NULL,
  title TEXT NOT NULL,
  
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')) DEFAULT 'Scheduled',
  
  -- Participants
  csm_attendees JSONB DEFAULT '[]'::JSONB,
  customer_attendees JSONB DEFAULT '[]'::JSONB,
  
  -- Deliverables
  agenda TEXT,
  meeting_notes TEXT,
  recording_url TEXT,
  transcript_url TEXT,
  
  -- Action Items
  action_items_created INTEGER DEFAULT 0,
  action_items_from_last_meeting INTEGER DEFAULT 0,
  action_items_completed_since_last INTEGER DEFAULT 0,
  
  -- Follow-up
  next_meeting_date DATE,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- TAM Account Goals & Milestones
CREATE TABLE IF NOT EXISTS public.tam_account_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.tam_accounts(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Technical', 'Adoption', 'Performance', 'Business')) NOT NULL,
  
  fiscal_year TEXT,
  quarter TEXT CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4', 'Annual')),
  
  -- Target
  metric_type TEXT, -- e.g., "API Count", "Adoption Score", "Error Rate"
  target_value NUMERIC(12,2),
  current_value NUMERIC(12,2),
  starting_value NUMERIC(12,2),
  
  -- Progress
  progress_percent INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('On Track', 'At Risk', 'Behind', 'Completed', 'Blocked')) DEFAULT 'On Track',
  
  due_date DATE,
  completed_date DATE,
  
  -- Impact
  business_impact TEXT,
  technical_dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TAM Cross-Team Escalations (Red Account War Room)
CREATE TABLE IF NOT EXISTS public.tam_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.tam_accounts(id) ON DELETE CASCADE,
  
  trigger TEXT CHECK (trigger IN ('Red Account Status', 'Technical Score Drop', 'Renewal Risk', 'P1 Incident', 'Manual')) NOT NULL,
  severity TEXT CHECK (severity IN ('Critical', 'High', 'Medium')) DEFAULT 'High',
  
  opened_at TIMESTAMPTZ DEFAULT now(),
  opened_by TEXT DEFAULT 'Nirmal',
  
  -- Context
  description TEXT,
  root_cause_hypothesis TEXT,
  mrr_at_risk NUMERIC(12,2),
  days_to_renewal INTEGER,
  
  -- Task Assignment
  sales_tasks JSONB DEFAULT '[]'::JSONB,
  engineering_tasks JSONB DEFAULT '[]'::JSONB,
  support_tasks JSONB DEFAULT '[]'::JSONB,
  csm_tasks JSONB DEFAULT '[]'::JSONB,
  product_tasks JSONB DEFAULT '[]'::JSONB,
  
  -- Progress Tracking
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
  
  -- Recovery Plan
  target_green_date DATE,
  daily_standup_time TEXT, -- e.g., "2:00 PM EST"
  
  -- Status
  status TEXT CHECK (status IN ('Active', 'Monitoring', 'Resolved', 'Escalated to Leadership')) DEFAULT 'Active',
  resolved_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tam_accounts_health ON public.tam_accounts(health_status);
CREATE INDEX IF NOT EXISTS idx_tam_accounts_renewal ON public.tam_accounts(renewal_date);
CREATE INDEX IF NOT EXISTS idx_tam_environments_account ON public.tam_environments(account_id);
CREATE INDEX IF NOT EXISTS idx_tam_apis_account ON public.tam_apis(account_id);
CREATE INDEX IF NOT EXISTS idx_tam_apis_environment ON public.tam_apis(environment_id);
CREATE INDEX IF NOT EXISTS idx_tam_athr_account ON public.tam_athr_reviews(account_id);
CREATE INDEX IF NOT EXISTS idx_tam_athr_items_review ON public.tam_athr_action_items(athr_review_id);
CREATE INDEX IF NOT EXISTS idx_tam_activities_account ON public.tam_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_tam_daily_metrics_account_date ON public.tam_daily_metrics(account_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_tam_meetings_account ON public.tam_meetings(account_id);
CREATE INDEX IF NOT EXISTS idx_tam_goals_account ON public.tam_account_goals(account_id);
CREATE INDEX IF NOT EXISTS idx_tam_escalations_account ON public.tam_escalations(account_id);
CREATE INDEX IF NOT EXISTS idx_tam_escalations_status ON public.tam_escalations(status) WHERE status = 'Active';

-- Enable RLS (Row Level Security)
ALTER TABLE public.tam_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tam_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tam_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tam_athr_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tam_athr_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tam_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tam_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tam_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tam_account_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tam_escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for authenticated users - refine later)
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_accounts FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_environments FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_apis FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_athr_reviews FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_athr_action_items FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_activities FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_daily_metrics FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_meetings FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_account_goals FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON public.tam_escalations FOR ALL USING (true);
