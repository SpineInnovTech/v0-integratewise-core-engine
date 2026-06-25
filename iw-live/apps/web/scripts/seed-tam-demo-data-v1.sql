-- Seed Demo Data for TAM Cockpit
-- 4 anonymized enterprise accounts with realistic metrics

-- Insert 4 Enterprise Accounts
INSERT INTO public.tam_accounts (
  id, account_name, industry, region, timezone, tier,
  health_status, css_score, technical_score, adoption_score, nps_score,
  vcores_allocated, vcores_current_usage, licenses_procured, licenses_activated, active_users_30d, power_users,
  monthly_api_calls, message_flow_daily, payg_monthly_spend,
  arr, currency, renewal_date, renewal_value, expansion_opportunity,
  csm_owner, last_touch_date, next_scheduled_call, last_athr_date, next_athr_date
) VALUES
  -- Account Alpha (Green - Healthy)
  (
    'a1111111-1111-1111-1111-111111111111'::UUID,
    'Account Alpha',
    'Insurance',
    'EMEA',
    'Europe/Oslo',
    'Enterprise',
    'Green',
    8.7,
    87,
    78,
    72,
    45,
    82.5,
    100,
    78,
    62,
    45,
    2450000,
    850000,
    12000,
    850000,
    'USD',
    '2025-09-30',
    850000,
    150000,
    'Nirmal',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_TIMESTAMP + INTERVAL '13 days',
    '2024-11-15',
    '2025-11-15'
  ),
  
  -- Account Beta (Amber - At Risk)
  (
    'b2222222-2222-2222-2222-222222222222'::UUID,
    'Account Beta',
    'Pharmaceuticals',
    'APAC',
    'Australia/Sydney',
    'Enterprise',
    'Amber',
    6.8,
    68,
    62,
    35,
    60,
    79.0,
    150,
    95,
    72,
    54,
    1850000,
    620000,
    8500,
    1200000,
    'USD',
    '2025-06-30',
    1200000,
    0,
    'Nirmal',
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '11 days',
    '2025-01-10',
    '2026-01-10'
  ),
  
  -- Account Gamma (Red - Critical)
  (
    'c3333333-3333-3333-3333-333333333333'::UUID,
    'Account Gamma',
    'Construction',
    'EMEA',
    'Europe/London',
    'Enterprise',
    'Red',
    5.2,
    52,
    45,
    -15,
    80,
    65.0,
    200,
    120,
    85,
    52,
    980000,
    420000,
    5200,
    1500000,
    'USD',
    '2025-05-15',
    1500000,
    0,
    'Nirmal',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    '2024-05-20',
    '2025-05-20'
  ),
  
  -- Account Delta (Green - Growth)
  (
    'd4444444-4444-4444-4444-444444444444'::UUID,
    'Account Delta',
    'Retail',
    'EMEA',
    'Europe/Berlin',
    'Enterprise',
    'Growth',
    9.1,
    91,
    82,
    85,
    40,
    75.0,
    120,
    108,
    95,
    82,
    3200000,
    1100000,
    15000,
    950000,
    'USD',
    '2025-12-31',
    950000,
    250000,
    'Nirmal',
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_TIMESTAMP + INTERVAL '11 days',
    '2024-12-10',
    '2025-12-10'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Environments for each account
INSERT INTO public.tam_environments (account_id, name, status, java_version, runtime_version, vcores_allocated, vcores_usage_percent, api_count, daily_message_flow, avg_response_time_ms, error_rate_percent, uptime_percent, deployments_this_month) VALUES
  -- Account Alpha environments
  ('a1111111-1111-1111-1111-111111111111'::UUID, 'Production', 'Healthy', '11.0.12', '4.4.0', 30, 82.0, 278, 850000, 145, 0.8, 99.97, 8),
  ('a1111111-1111-1111-1111-111111111111'::UUID, 'Staging', 'Healthy', '11.0.12', '4.4.0', 10, 45.0, 120, 50000, 180, 1.2, 99.50, 15),
  ('a1111111-1111-1111-1111-111111111111'::UUID, 'Development', 'Warning', '11.0.12', '4.4.0', 5, 92.0, 85, 10000, 220, 3.5, 98.80, 42),
  
  -- Account Beta environments
  ('b2222222-2222-2222-2222-222222222222'::UUID, 'Production', 'Warning', '8.0.292', '4.3.0', 35, 79.0, 180, 620000, 280, 2.3, 99.20, 4),
  ('b2222222-2222-2222-2222-222222222222'::UUID, 'Staging', 'Healthy', '11.0.10', '4.3.0', 15, 50.0, 95, 35000, 200, 1.8, 99.60, 8),
  ('b2222222-2222-2222-2222-222222222222'::UUID, 'Development', 'Healthy', '11.0.10', '4.3.0', 10, 40.0, 70, 8000, 190, 2.1, 99.40, 18),
  
  -- Account Gamma environments (Critical)
  ('c3333333-3333-3333-3333-333333333333'::UUID, 'Production', 'Critical', '8.0.275', '4.2.0', 50, 65.0, 150, 420000, 450, 5.8, 97.50, 2),
  ('c3333333-3333-3333-3333-333333333333'::UUID, 'Staging', 'Warning', '8.0.275', '4.2.0', 20, 55.0, 80, 25000, 380, 4.2, 98.20, 3),
  ('c3333333-3333-3333-3333-333333333333'::UUID, 'Development', 'Warning', '11.0.8', '4.2.0', 10, 48.0, 60, 6000, 320, 3.8, 98.90, 5),
  
  -- Account Delta environments (Growth)
  ('d4444444-4444-4444-4444-444444444444'::UUID, 'Production', 'Healthy', '11.0.13', '4.4.0', 25, 75.0, 220, 1100000, 120, 0.5, 99.98, 12),
  ('d4444444-4444-4444-4444-444444444444'::UUID, 'Staging', 'Healthy', '11.0.13', '4.4.0', 10, 48.0, 105, 65000, 150, 0.9, 99.85, 20),
  ('d4444444-4444-4444-4444-444444444444'::UUID, 'Development', 'Healthy', '11.0.13', '4.4.0', 5, 65.0, 90, 15000, 175, 1.5, 99.60, 35)
ON CONFLICT DO NOTHING;

-- Insert ATHR Reviews
INSERT INTO public.tam_athr_reviews (
  account_id, review_date, fiscal_year, review_type, csm_lead,
  technical_score, technical_score_change, adoption_score, adoption_score_change,
  api_maturity_level, infrastructure_grade, security_posture,
  action_items_count, action_items_completed, follow_up_date
) VALUES
  -- Account Alpha - Last ATHR (Green)
  ('a1111111-1111-1111-1111-111111111111'::UUID, '2024-11-15', 'FY25', 'Annual', 'Nirmal', 87, 5, 78, 8, 'Managed', 'A', 'Strong', 8, 6, '2025-02-15'),
  
  -- Account Beta - Last ATHR (Declining)
  ('b2222222-2222-2222-2222-222222222222'::UUID, '2025-01-10', 'FY26', 'Annual', 'Nirmal', 68, -12, 62, -15, 'Defined', 'C', 'Needs Improvement', 12, 4, '2025-04-10'),
  
  -- Account Gamma - Last ATHR (Critical)
  ('c3333333-3333-3333-3333-333333333333'::UUID, '2024-05-20', 'FY25', 'Annual', 'Nirmal', 52, -18, 45, -25, 'Developing', 'D', 'Critical', 15, 2, '2024-08-20'),
  
  -- Account Delta - Last ATHR (Exceptional)
  ('d4444444-4444-4444-4444-444444444444'::UUID, '2024-12-10', 'FY25', 'Annual', 'Nirmal', 91, 8, 82, 12, 'Optimizing', 'A', 'Strong', 5, 5, '2025-03-10')
ON CONFLICT DO NOTHING;

-- Insert Account Goals
INSERT INTO public.tam_account_goals (
  account_id, title, category, fiscal_year, quarter, metric_type,
  target_value, current_value, starting_value, progress_percent, status, due_date
) VALUES
  -- Account Alpha goals
  ('a1111111-1111-1111-1111-111111111111'::UUID, 'Launch 50 new Experience APIs', 'Technical', '2025', 'Q4', 'API Count', 50, 32, 0, 64, 'On Track', '2025-12-31'),
  ('a1111111-1111-1111-1111-111111111111'::UUID, 'Achieve 85% adoption score', 'Adoption', '2025', 'Annual', 'Adoption Score', 85, 78, 70, 53, 'On Track', '2025-12-31'),
  
  -- Account Beta goals (At Risk)
  ('b2222222-2222-2222-2222-222222222222'::UUID, 'Reduce API error rates to <1%', 'Performance', '2025', 'Q2', 'Error Rate', 1.0, 2.3, 3.8, 39, 'At Risk', '2025-06-30'),
  ('b2222222-2222-2222-2222-222222222222'::UUID, 'Upgrade to Java 11 across all environments', 'Technical', '2025', 'Q1', 'Java Version', 11, 8, 8, 0, 'Behind', '2025-03-31'),
  
  -- Account Gamma goals (Critical)
  ('c3333333-3333-3333-3333-333333333333'::UUID, 'Stabilize production environment', 'Technical', '2025', 'Q2', 'Uptime %', 99.5, 97.5, 96.2, 65, 'At Risk', '2025-06-30'),
  ('c3333333-3333-3333-3333-333333333333'::UUID, 'Complete security remediation', 'Technical', '2025', 'Q2', 'Vulnerability Count', 0, 28, 45, 42, 'Behind', '2025-06-30'),
  
  -- Account Delta goals (Growth)
  ('d4444444-4444-4444-4444-444444444444'::UUID, 'Expand API portfolio to 300 APIs', 'Business', '2025', 'Annual', 'API Count', 300, 220, 180, 50, 'On Track', '2025-12-31'),
  ('d4444444-4444-4444-4444-444444444444'::UUID, 'Achieve 90% power user engagement', 'Adoption', '2025', 'Annual', 'Power User %', 90, 82, 75, 47, 'On Track', '2025-12-31')
ON CONFLICT DO NOTHING;

-- Insert Recent Activities
INSERT INTO public.tam_activities (
  account_id, activity_type, title, severity, priority, status,
  csm_activity_type, csm_hours_spent, csm_mrr_attribution,
  environment, reported_at
) VALUES
  -- Account Alpha activities
  ('a1111111-1111-1111-1111-111111111111'::UUID, 'Meeting', 'Monthly Business Review - March', 'P3', 'Medium', 'Closed', 'Strategic Review', 2.0, 5000, 'All', CURRENT_TIMESTAMP - INTERVAL '10 days'),
  ('a1111111-1111-1111-1111-111111111111'::UUID, 'Training', 'Advanced DataWeave Patterns Workshop', 'P3', 'High', 'Closed', 'Training', 4.0, 8000, 'All', CURRENT_TIMESTAMP - INTERVAL '15 days'),
  
  -- Account Beta activities (Amber - needs attention)
  ('b2222222-2222-2222-2222-222222222222'::UUID, 'Incident', 'Production API error rate spike', 'P2', 'High', 'In Progress', 'Dev Help', 3.5, 0, 'Production', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
  ('b2222222-2222-2222-2222-222222222222'::UUID, 'Question', 'Java 11 migration planning assistance', 'P3', 'Medium', 'Open', 'Arch Help', 1.5, 3000, 'All', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  
  -- Account Gamma activities (Red - critical)
  ('c3333333-3333-3333-3333-333333333333'::UUID, 'Incident', 'Memory leak causing frequent restarts', 'P1', 'Critical', 'Open', 'Dev Help', 5.0, 0, 'Production', CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('c3333333-3333-3333-3333-333333333333'::UUID, 'Meeting', 'Emergency Architecture Review', 'P1', 'Critical', 'Scheduled', 'Arch Help', 0, 0, 'All', CURRENT_TIMESTAMP + INTERVAL '3 hours'),
  
  -- Account Delta activities (Growth)
  ('d4444444-4444-4444-4444-444444444444'::UUID, 'Enhancement', 'New API design review for loyalty program', 'P3', 'Medium', 'In Progress', 'Arch Help', 2.5, 10000, 'Development', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  ('d4444444-4444-4444-4444-444444444444'::UUID, 'Training', 'Microservices best practices for dev team', 'P3', 'High', 'Scheduled', 'Training', 0, 12000, 'All', CURRENT_TIMESTAMP + INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Insert Escalation for Red Account (Account Gamma)
INSERT INTO public.tam_escalations (
  account_id, trigger, severity, description, root_cause_hypothesis,
  mrr_at_risk, days_to_renewal, total_tasks, completed_tasks, progress_percent,
  target_green_date, daily_standup_time, status
) VALUES
  ('c3333333-3333-3333-3333-333333333333'::UUID, 
   'Red Account Status', 
   'Critical',
   'Account Gamma has dropped to Red status with technical score at 52 and adoption at 45%. Renewal in 75 days with $1.5M at risk.',
   'Technical debt accumulated from delayed Java 8 to 11 migration, no caching layer implemented, memory management issues causing production instability.',
   125000,
   75,
   13,
   5,
   38,
   '2025-05-15',
   '2:00 PM GMT',
   'Active'
  )
ON CONFLICT DO NOTHING;

-- Insert Daily Metrics Snapshots (last 7 days for Account Beta showing decline)
INSERT INTO public.tam_daily_metrics (
  account_id, snapshot_date, technical_score, technical_score_delta,
  adoption_score, adoption_score_delta, vcores_usage_percent,
  message_flow_count, api_error_rate_percent, emails_received, meetings_held
) VALUES
  ('b2222222-2222-2222-2222-222222222222'::UUID, CURRENT_DATE - INTERVAL '7 days', 72, 0, 68, 0, 78.0, 640000, 1.8, 5, 0),
  ('b2222222-2222-2222-2222-222222222222'::UUID, CURRENT_DATE - INTERVAL '6 days', 71, -1, 67, -1, 79.5, 630000, 2.0, 8, 1),
  ('b2222222-2222-2222-2222-222222222222'::UUID, CURRENT_DATE - INTERVAL '5 days', 70, -1, 66, -1, 79.0, 625000, 2.1, 6, 0),
  ('b2222222-2222-2222-2222-222222222222'::UUID, CURRENT_DATE - INTERVAL '4 days', 69, -1, 64, -2, 78.5, 615000, 2.2, 12, 0),
  ('b2222222-2222-2222-2222-222222222222'::UUID, CURRENT_DATE - INTERVAL '3 days', 68, -1, 63, -1, 79.2, 620000, 2.3, 15, 1),
  ('b2222222-2222-2222-2222-222222222222'::UUID, CURRENT_DATE - INTERVAL '2 days', 68, 0, 62, -1, 79.0, 618000, 2.4, 9, 0),
  ('b2222222-2222-2222-2222-222222222222'::UUID, CURRENT_DATE - INTERVAL '1 day', 68, 0, 62, 0, 79.0, 620000, 2.3, 7, 0)
ON CONFLICT (account_id, snapshot_date) DO NOTHING;
