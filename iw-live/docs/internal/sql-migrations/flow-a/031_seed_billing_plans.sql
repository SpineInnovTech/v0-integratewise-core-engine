-- Seed Initial Billing Plans and Entitlements
-- Starter, Pro, and Enterprise plans for Indian market

-- =====================================================
-- 1. Insert Plans
-- =====================================================

-- Starter Plan: Free trial with limits
INSERT INTO plans (code, name, description, currency, price_cents, interval, is_active, features, metadata) VALUES
(
  'starter',
  'Starter',
  'Perfect for individuals and small teams getting started',
  'INR',
  0,
  'monthly',
  true,
  jsonb_build_array(
    jsonb_build_object('name', 'Up to 5 workflows', 'included', true),
    jsonb_build_object('name', 'Up to 3 integrations', 'included', true),
    jsonb_build_object('name', '1,000 AI tokens/month', 'included', true),
    jsonb_build_object('name', 'Basic analytics', 'included', true),
    jsonb_build_object('name', 'Email support', 'included', true),
    jsonb_build_object('name', 'Community access', 'included', true),
    jsonb_build_object('name', 'Advanced analytics', 'included', false),
    jsonb_build_object('name', 'Priority support', 'included', false),
    jsonb_build_object('name', 'Custom integrations', 'included', false)
  ),
  jsonb_build_object(
    'trial_days', 14,
    'recommended', false,
    'tier', 'starter'
  )
),
(
  'pro-monthly',
  'Pro',
  'For growing teams that need more power and flexibility',
  'INR',
  299900, -- ₹2,999
  'monthly',
  true,
  jsonb_build_array(
    jsonb_build_object('name', 'Up to 50 workflows', 'included', true),
    jsonb_build_object('name', 'Unlimited integrations', 'included', true),
    jsonb_build_object('name', '50,000 AI tokens/month', 'included', true),
    jsonb_build_object('name', 'Advanced analytics', 'included', true),
    jsonb_build_object('name', 'Priority email support', 'included', true),
    jsonb_build_object('name', 'Custom webhooks', 'included', true),
    jsonb_build_object('name', 'API access', 'included', true),
    jsonb_build_object('name', 'Team collaboration', 'included', true),
    jsonb_build_object('name', 'Dedicated support', 'included', false),
    jsonb_build_object('name', 'Custom SLA', 'included', false)
  ),
  jsonb_build_object(
    'trial_days', 14,
    'recommended', true,
    'tier', 'pro',
    'savings_vs_monthly', 0
  )
),
(
  'pro-yearly',
  'Pro (Yearly)',
  'For growing teams that need more power and flexibility - save 20% with annual billing',
  'INR',
  2879040, -- ₹28,790.40 (₹2,399.20/month, 20% discount)
  'yearly',
  true,
  jsonb_build_array(
    jsonb_build_object('name', 'Up to 50 workflows', 'included', true),
    jsonb_build_object('name', 'Unlimited integrations', 'included', true),
    jsonb_build_object('name', '50,000 AI tokens/month', 'included', true),
    jsonb_build_object('name', 'Advanced analytics', 'included', true),
    jsonb_build_object('name', 'Priority email support', 'included', true),
    jsonb_build_object('name', 'Custom webhooks', 'included', true),
    jsonb_build_object('name', 'API access', 'included', true),
    jsonb_build_object('name', 'Team collaboration', 'included', true),
    jsonb_build_object('name', 'Dedicated support', 'included', false),
    jsonb_build_object('name', 'Custom SLA', 'included', false)
  ),
  jsonb_build_object(
    'trial_days', 14,
    'recommended', true,
    'tier', 'pro',
    'savings_vs_monthly', 20,
    'monthly_equivalent', 239920
  )
),
(
  'enterprise',
  'Enterprise',
  'Custom solutions for large organizations with advanced needs',
  'INR',
  999900, -- ₹9,999 starting (custom pricing)
  'monthly',
  true,
  jsonb_build_array(
    jsonb_build_object('name', 'Unlimited workflows', 'included', true),
    jsonb_build_object('name', 'Unlimited integrations', 'included', true),
    jsonb_build_object('name', 'Custom AI token limits', 'included', true),
    jsonb_build_object('name', 'Advanced analytics & reporting', 'included', true),
    jsonb_build_object('name', 'Dedicated account manager', 'included', true),
    jsonb_build_object('name', 'Custom integrations', 'included', true),
    jsonb_build_object('name', 'White-label options', 'included', true),
    jsonb_build_object('name', 'Custom SLA (99.9% uptime)', 'included', true),
    jsonb_build_object('name', 'On-premise deployment option', 'included', true),
    jsonb_build_object('name', 'Priority phone & chat support', 'included', true),
    jsonb_build_object('name', 'Security audit & compliance', 'included', true)
  ),
  jsonb_build_object(
    'trial_days', 30,
    'recommended', false,
    'tier', 'enterprise',
    'custom_pricing', true,
    'contact_sales', true
  )
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- =====================================================
-- 2. Default Entitlements by Plan (for reference)
-- =====================================================
-- These will be automatically created when a subscription is activated
-- Format: entitlement key -> value mapping

-- Starter Plan Entitlements:
-- max_workflows: 5
-- max_integrations: 3
-- rag_quota_tokens_month: 1000
-- analytics_level: basic
-- support_sla: email_48h
-- api_access: false
-- webhooks_enabled: false
-- team_collaboration: false

-- Pro Plan Entitlements:
-- max_workflows: 50
-- max_integrations: 999999 (unlimited)
-- rag_quota_tokens_month: 50000
-- analytics_level: advanced
-- support_sla: email_24h
-- api_access: true
-- webhooks_enabled: true
-- team_collaboration: true
-- custom_integrations: false

-- Enterprise Plan Entitlements:
-- max_workflows: 999999 (unlimited)
-- max_integrations: 999999 (unlimited)
-- rag_quota_tokens_month: 999999999 (custom/unlimited)
-- analytics_level: enterprise
-- support_sla: priority_4h
-- api_access: true
-- webhooks_enabled: true
-- team_collaboration: true
-- custom_integrations: true
-- white_label: true
-- on_premise: true
-- dedicated_manager: true

-- =====================================================
-- 3. Create helper function to sync entitlements
-- =====================================================

CREATE OR REPLACE FUNCTION sync_entitlements_for_subscription(p_org_id UUID, p_plan_code TEXT)
RETURNS VOID AS $$
DECLARE
  v_entitlements JSONB;
BEGIN
  -- Delete existing plan-based entitlements
  DELETE FROM entitlements
  WHERE org_id = p_org_id AND source = 'plan';

  -- Insert new entitlements based on plan
  CASE p_plan_code
    WHEN 'starter' THEN
      v_entitlements := jsonb_build_object(
        'max_workflows', 5,
        'max_integrations', 3,
        'rag_quota_tokens_month', 1000,
        'analytics_level', 'basic',
        'support_sla', 'email_48h',
        'api_access', false,
        'webhooks_enabled', false,
        'team_collaboration', false,
        'custom_integrations', false,
        'white_label', false,
        'on_premise', false
      );
    
    WHEN 'pro-monthly', 'pro-yearly' THEN
      v_entitlements := jsonb_build_object(
        'max_workflows', 50,
        'max_integrations', 999999,
        'rag_quota_tokens_month', 50000,
        'analytics_level', 'advanced',
        'support_sla', 'email_24h',
        'api_access', true,
        'webhooks_enabled', true,
        'team_collaboration', true,
        'custom_integrations', false,
        'white_label', false,
        'on_premise', false
      );
    
    WHEN 'enterprise' THEN
      v_entitlements := jsonb_build_object(
        'max_workflows', 999999,
        'max_integrations', 999999,
        'rag_quota_tokens_month', 999999999,
        'analytics_level', 'enterprise',
        'support_sla', 'priority_4h',
        'api_access', true,
        'webhooks_enabled', true,
        'team_collaboration', true,
        'custom_integrations', true,
        'white_label', true,
        'on_premise', true,
        'dedicated_manager', true
      );
    
    ELSE
      RAISE EXCEPTION 'Unknown plan code: %', p_plan_code;
  END CASE;

  -- Insert entitlements
  INSERT INTO entitlements (org_id, key, value, source)
  SELECT 
    p_org_id,
    key,
    to_jsonb(value),
    'plan'
  FROM jsonb_each(v_entitlements);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_entitlements_for_subscription IS 'Syncs entitlements when a subscription plan changes';

-- =====================================================
-- 4. Sample Demo Organization Subscription (Optional)
-- =====================================================
-- Uncomment to create a demo subscription for testing
-- Requires a valid org_id from your system

-- DO $$
-- DECLARE
--   v_org_id UUID := 'YOUR_ORG_ID_HERE';
--   v_plan_id UUID;
--   v_subscription_id UUID;
-- BEGIN
--   -- Get starter plan
--   SELECT id INTO v_plan_id FROM plans WHERE code = 'starter' LIMIT 1;
  
--   -- Create trial subscription
--   INSERT INTO org_subscriptions (
--     org_id,
--     plan_id,
--     status,
--     trial_end,
--     current_period_start,
--     current_period_end
--   ) VALUES (
--     v_org_id,
--     v_plan_id,
--     'trial',
--     now() + interval '14 days',
--     now(),
--     now() + interval '14 days'
--   )
--   RETURNING id INTO v_subscription_id;
  
--   -- Sync entitlements
--   PERFORM sync_entitlements_for_subscription(v_org_id, 'starter');
  
--   RAISE NOTICE 'Created trial subscription % for org %', v_subscription_id, v_org_id;
-- END $$;
