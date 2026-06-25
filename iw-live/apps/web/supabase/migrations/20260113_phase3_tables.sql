-- Phase 3: Core Features Database Tables

-- Health Scores Table (CS-019)
CREATE TABLE IF NOT EXISTS health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score INTEGER NOT NULL CHECK (technical_score >= 0 AND technical_score <= 100),
  adoption_score INTEGER NOT NULL CHECK (adoption_score >= 0 AND adoption_score <= 100),
  engagement_score INTEGER NOT NULL CHECK (engagement_score >= 0 AND engagement_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('green', 'amber', 'red')),
  risk_signals JSONB DEFAULT '[]',
  recommendations TEXT[] DEFAULT '[]',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, calculated_at)
);

CREATE INDEX IF NOT EXISTS idx_health_scores_workspace_id ON health_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_calculated_at ON health_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_scores_risk_level ON health_scores(risk_level);

-- Detected Patterns Table (INSIGHTS-013)
CREATE TABLE IF NOT EXISTS detected_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('trend', 'anomaly', 'correlation', 'cycle', 'spike', 'drop')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detected_patterns_workspace_id ON detected_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_type ON detected_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_detected_at ON detected_patterns(detected_at DESC);

-- Goals Table (GOALS-015)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL DEFAULT 0,
  unit TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  progress DECIMAL(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  on_track BOOLEAN DEFAULT true,
  milestones JSONB DEFAULT '[]',
  weight DECIMAL(3,2) DEFAULT 1.0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_workspace_id ON goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_end_date ON goals(end_date);

-- Usage Metrics Table (for pattern detection and KPIs)
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_workspace_id ON usage_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_name ON usage_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_recorded_at ON usage_metrics(recorded_at DESC);

-- User Activity Table (for adoption metrics)
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  activity_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_workspace_id ON user_activity(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_active ON user_activity(last_active_at DESC);

-- NPS Scores Table (for CS KPIs)
CREATE TABLE IF NOT EXISTS nps_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score >= -100 AND score <= 100),
  respondent_id UUID,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nps_scores_workspace_id ON nps_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nps_scores_created_at ON nps_scores(created_at DESC);

-- Deals Table (for Business KPIs) - if not exists
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  value DECIMAL,
  stage TEXT NOT NULL CHECK (stage IN ('Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_workspace_id ON deals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
