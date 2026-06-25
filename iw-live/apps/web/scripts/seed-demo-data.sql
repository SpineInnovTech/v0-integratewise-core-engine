-- Seed Demo Data for IntegrateWise OS
-- This script creates demo data for testing and demonstration purposes
-- Run this after setting up demo mode

-- Demo User Profile (if using profiles table)
-- Note: This assumes a profiles table exists. Adjust based on your schema.
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  onboarding_complete,
  created_at,
  updated_at
) VALUES (
  'demo-user-001'::UUID,
  'demo@integratewise.online',
  'Demo User',
  false, -- Not completed onboarding yet
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  onboarding_complete = false,
  updated_at = NOW();

-- Demo Workspace
INSERT INTO public.workspaces (
  id,
  name,
  owner_id,
  created_at,
  updated_at
) VALUES (
  'demo-workspace-001'::UUID,
  'Demo Workspace',
  'demo-user-001'::UUID,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Demo Tasks (for Personal/Business lens)
INSERT INTO public.spine_tasks (
  id,
  workspace_id,
  source_id,
  source_type,
  title,
  description,
  status,
  priority,
  due_date,
  assignee_email,
  tags,
  created_at,
  updated_at
) VALUES
  (
    'task-001'::UUID,
    'demo-workspace-001'::UUID,
    'demo-task-001',
    'custom',
    'Review Q4 customer feedback',
    'Analyze customer feedback from Q4 and identify key themes',
    'in_progress',
    'high',
    NOW() + INTERVAL '3 days',
    'demo@integratewise.online',
    ARRAY['customer-success', 'q4-review'],
    NOW(),
    NOW()
  ),
  (
    'task-002'::UUID,
    'demo-workspace-001'::UUID,
    'demo-task-002',
    'custom',
    'Prepare onboarding presentation',
    'Create presentation for new customer onboarding process',
    'todo',
    'medium',
    NOW() + INTERVAL '7 days',
    'demo@integratewise.online',
    ARRAY['onboarding', 'presentation'],
    NOW(),
    NOW()
  ),
  (
    'task-003'::UUID,
    'demo-workspace-001'::UUID,
    'demo-task-003',
    'custom',
    'Update integration documentation',
    'Document the new API integration patterns',
    'todo',
    'low',
    NOW() + INTERVAL '14 days',
    'demo@integratewise.online',
    ARRAY['documentation', 'api'],
    NOW(),
    NOW()
  )
ON CONFLICT (source_id, source_type) DO NOTHING;

-- Demo Notes
INSERT INTO public.spine_notes (
  id,
  workspace_id,
  source_id,
  source_type,
  title,
  content,
  tags,
  created_at,
  updated_at
) VALUES
  (
    'note-001'::UUID,
    'demo-workspace-001'::UUID,
    'demo-note-001',
    'custom',
    'Customer Success Meeting Notes',
    'Key discussion points from today''s customer success meeting:\n- Account health scores are improving\n- Need to schedule QBR for next quarter\n- Expansion opportunity identified',
    ARRAY['meeting', 'customer-success'],
    NOW(),
    NOW()
  ),
  (
    'note-002'::UUID,
    'demo-workspace-001'::UUID,
    'demo-note-002',
    'custom',
    'Product Roadmap Ideas',
    'Ideas for Q2 product roadmap:\n1. Enhanced analytics dashboard\n2. Automated reporting features\n3. Integration with more CRM platforms',
    ARRAY['product', 'roadmap'],
    NOW(),
    NOW()
  )
ON CONFLICT (source_id, source_type) DO NOTHING;

-- Demo Health Score (for CS lens)
INSERT INTO public.health_scores (
  id,
  workspace_id,
  overall_score,
  technical_score,
  adoption_score,
  engagement_score,
  risk_level,
  risk_signals,
  recommendations,
  calculated_at,
  created_at
) VALUES (
  'health-001'::UUID,
  'demo-workspace-001'::UUID,
  75,
  80,
  70,
  75,
  'green',
  '[]'::JSONB,
  ARRAY['Continue current engagement strategy', 'Monitor adoption metrics'],
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Demo Goals
INSERT INTO public.goals (
  id,
  workspace_id,
  title,
  description,
  target_value,
  current_value,
  unit,
  start_date,
  end_date,
  progress,
  on_track,
  status,
  created_at,
  updated_at
) VALUES
  (
    'goal-001'::UUID,
    'demo-workspace-001'::UUID,
    'Increase Customer Satisfaction',
    'Improve NPS score to 70+',
    70,
    65,
    'NPS',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '60 days',
    65.0,
    true,
    'active',
    NOW(),
    NOW()
  ),
  (
    'goal-002'::UUID,
    'demo-workspace-001'::UUID,
    'Complete 50 Tasks This Quarter',
    'Track and complete 50 tasks across all projects',
    50,
    32,
    'tasks',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '60 days',
    64.0,
    true,
    'active',
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Demo Usage Metrics
INSERT INTO public.usage_metrics (
  id,
  workspace_id,
  metric_name,
  value,
  recorded_at,
  metadata,
  created_at
) VALUES
  (
    'metric-001'::UUID,
    'demo-workspace-001'::UUID,
    'tasks_completed',
    32,
    NOW(),
    '{"source": "demo"}'::JSONB,
    NOW()
  ),
  (
    'metric-002'::UUID,
    'demo-workspace-001'::UUID,
    'active_users',
    5,
    NOW(),
    '{"source": "demo"}'::JSONB,
    NOW()
  ),
  (
    'metric-003'::UUID,
    'demo-workspace-001'::UUID,
    'api_calls',
    1250,
    NOW(),
    '{"source": "demo"}'::JSONB,
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Demo User Activity
INSERT INTO public.user_activity (
  id,
  workspace_id,
  user_id,
  last_active_at,
  activity_count,
  created_at,
  updated_at
) VALUES (
  'activity-001'::UUID,
  'demo-workspace-001'::UUID,
  'demo-user-001'::UUID,
  NOW(),
  25,
  NOW(),
  NOW()
)
ON CONFLICT (workspace_id, user_id) DO UPDATE SET
  last_active_at = NOW(),
  activity_count = user_activity.activity_count + 1,
  updated_at = NOW();

-- Demo NPS Score
INSERT INTO public.nps_scores (
  id,
  workspace_id,
  score,
  feedback,
  created_at
) VALUES (
  'nps-001'::UUID,
  'demo-workspace-001'::UUID,
  65,
  'Great product, easy to use. Would recommend to others.',
  NOW()
)
ON CONFLICT DO NOTHING;

-- Demo Onboarding State (ensures demo users go through onboarding)
INSERT INTO public.onboarding_state (
  user_id,
  completed,
  step,
  created_at,
  updated_at
) VALUES (
  'demo-user-001'::UUID,
  false,
  1,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  completed = false,
  step = 1,
  updated_at = NOW();
