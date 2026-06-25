-- Seed billing plans with Stripe IDs
-- Run this after 030_create_billing_schema.sql

-- Clear existing plans
DELETE FROM plans;

-- Insert plans with Stripe IDs
INSERT INTO plans (id, name, slug, description, price_monthly, price_yearly, currency, stripe_product_id, stripe_price_monthly_id, stripe_price_yearly_id, features, limits, is_active, sort_order, created_at, updated_at) VALUES

-- Starter (Free)
(
  'plan_starter',
  'Starter',
  'starter',
  'Perfect for individuals and small teams getting started',
  0,
  0,
  'INR',
  'prod_Tetyem9Axzjw4y',
  'price_1ShaAzCcwhJsFTZHRjzRuo5t',
  NULL,
  '["Up to 5 workflows", "3 integrations", "1,000 AI tokens/month", "Email support", "Basic analytics"]',
  '{"workflows": 5, "integrations": 3, "ai_tokens": 1000, "team_members": 1}',
  true,
  1,
  NOW(),
  NOW()
),

-- Pro Monthly
(
  'plan_pro_monthly',
  'Pro',
  'pro-monthly',
  'For growing teams that need more power and flexibility',
  2999.00,
  NULL,
  'INR',
  'prod_Tety5l8cmTTMf0',
  'price_1ShaAzCcwhJsFTZHt5Q6O4iR',
  NULL,
  '["Up to 50 workflows", "Unlimited integrations", "50,000 AI tokens/month", "Priority support", "Advanced analytics", "Team collaboration", "Custom branding"]',
  '{"workflows": 50, "integrations": -1, "ai_tokens": 50000, "team_members": 10}',
  true,
  2,
  NOW(),
  NOW()
),

-- Pro Yearly (20% discount)
(
  'plan_pro_yearly',
  'Pro (Annual)',
  'pro-yearly',
  'For growing teams - Save 20% with annual billing',
  2399.20,
  28790.40,
  'INR',
  'prod_Tety5l8cmTTMf0',
  NULL,
  'price_1ShaAzCcwhJsFTZHZmTX8i8m',
  '["Up to 50 workflows", "Unlimited integrations", "50,000 AI tokens/month", "Priority support", "Advanced analytics", "Team collaboration", "Custom branding", "20% savings"]',
  '{"workflows": 50, "integrations": -1, "ai_tokens": 50000, "team_members": 10}',
  true,
  3,
  NOW(),
  NOW()
),

-- Enterprise
(
  'plan_enterprise',
  'Enterprise',
  'enterprise',
  'Custom solutions for large organizations',
  9999.00,
  NULL,
  'INR',
  'prod_TetyWBVhVl7vxl',
  'price_1ShaAzCcwhJsFTZHOXt8Gcwr',
  NULL,
  '["Unlimited workflows", "Unlimited integrations", "Custom AI token limits", "Dedicated support", "Enterprise analytics", "SSO/SAML", "Custom contracts", "SLA guarantee", "Dedicated account manager"]',
  '{"workflows": -1, "integrations": -1, "ai_tokens": -1, "team_members": -1}',
  true,
  4,
  NOW(),
  NOW()
);
