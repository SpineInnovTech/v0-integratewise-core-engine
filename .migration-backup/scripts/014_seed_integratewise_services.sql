-- Seed IntegrateWise Services (6 Tiers)

-- TIER 1: Professional Services
INSERT INTO services (tier, tier_name, name, description, pricing_type, price_min, price_max, currency)
VALUES 
  (1, 'Professional Services', 'MuleSoft Consulting & Architecture', 'Enterprise integration architecture, API design, MuleSoft implementation', 'fixed', 5000000, 15000000, 'INR'),
  (1, 'Professional Services', 'Customer Success Implementation', 'End-to-end CS platform implementation and process setup', 'fixed', 1000000, 2500000, 'INR');

-- TIER 2: Recurring Revenue
INSERT INTO services (tier, tier_name, name, description, pricing_type, price_min, price_max, currency)
VALUES 
  (2, 'Recurring Revenue', 'Integration CTO/Advisory Retainer', 'Strategic advisory, architecture reviews, team mentoring', 'monthly', 500000, 1000000, 'INR'),
  (2, 'Recurring Revenue', '1:1 Founder/CTO Coaching', 'Personal coaching for tech leaders on integration strategy', 'monthly', 200000, 500000, 'INR');

-- TIER 3: Scalable
INSERT INTO services (tier, tier_name, name, description, pricing_type, price_min, price_max, currency)
VALUES 
  (3, 'Scalable', 'Corporate Workshops & Training', 'Integration best practices, API-first design, MuleSoft training', 'fixed', 300000, 500000, 'INR'),
  (3, 'Scalable', 'Integration Excellence Certification', 'Professional certification program with annual renewal', 'yearly', 200000, 300000, 'INR');

-- TIER 4: SaaS Platform
INSERT INTO services (tier, tier_name, name, description, pricing_type, price_min, price_max, currency, modules)
VALUES 
  (4, 'SaaS Platform', 'IntegrateWise.co - Starter', 'Single module access: Template Forge AI, Normalize AI, or CS Automation Hub', 'yearly', 800000, 800000, 'INR', '["single_module"]'),
  (4, 'SaaS Platform', 'IntegrateWise.co - Growth', 'Two modules of your choice', 'yearly', 1500000, 1500000, 'INR', '["template_forge_ai", "normalize_ai"]'),
  (4, 'SaaS Platform', 'IntegrateWise.co - Enterprise', 'Full platform access: All 3 modules', 'yearly', 2500000, 2500000, 'INR', '["template_forge_ai", "normalize_ai", "cs_automation_hub"]');

-- TIER 5: Digital Products
INSERT INTO services (tier, tier_name, name, description, pricing_type, price_min, price_max, currency)
VALUES 
  (5, 'Digital Products', 'Premium CSM Templates', 'Ready-to-use templates for customer success management', 'one-time', 25000, 85000, 'INR'),
  (5, 'Digital Products', 'AI Agent Suite', 'AI-powered automation agents for integration workflows', 'monthly', 1000000, 1000000, 'INR');

-- TIER 6: Community
INSERT INTO services (tier, tier_name, name, description, pricing_type, price_min, price_max, currency)
VALUES 
  (6, 'Community', 'Integration Architects Community - Free', 'Free access to community resources and discussions', 'one-time', 0, 0, 'INR'),
  (6, 'Community', 'Integration Architects Community - Premium', 'Premium membership with exclusive content and networking', 'monthly', 2000, 2000, 'INR');

-- Seed sample clients
INSERT INTO clients (company, name, email, industry, size, status, tags)
VALUES 
  ('TechCorp India', 'Rajesh Kumar', 'rajesh@techcorp.in', 'Technology', 'enterprise', 'active', ARRAY['referral']),
  ('FinServ Solutions', 'Priya Sharma', 'priya@finserv.com', 'Financial Services', 'mid-market', 'active', ARRAY['linkedin']),
  ('HealthPlus Systems', 'Amit Patel', 'amit@healthplus.io', 'Healthcare', 'enterprise', 'onboarding', ARRAY['website']),
  ('RetailMax', 'Sneha Gupta', 'sneha@retailmax.in', 'Retail', 'enterprise', 'active', ARRAY['conference']),
  ('EduTech Ventures', 'Vikram Singh', 'vikram@edutech.co', 'Education', 'mid-market', 'onboarding', ARRAY['linkedin']);

-- Seed sample projects
INSERT INTO client_projects (client_id, name, description, type, status, priority, start_date, target_date, budget, team_members)
SELECT 
  c.id,
  'MuleSoft API Platform Implementation',
  'Enterprise-wide API management and integration platform',
  'mulesoft',
  'in_progress',
  'high',
  '2024-10-01',
  '2025-03-31',
  8500000,
  ARRAY['Nirmal Prince']
FROM clients c
WHERE c.company = 'TechCorp India';

INSERT INTO client_projects (client_id, name, description, type, status, priority, start_date, target_date, budget, team_members)
SELECT 
  c.id,
  'CS Platform Setup',
  'Customer success tooling and process implementation',
  'automation',
  'in_progress',
  'high',
  '2024-11-15',
  '2025-02-28',
  1800000,
  ARRAY['Nirmal Prince']
FROM clients c
WHERE c.company = 'FinServ Solutions';

INSERT INTO client_projects (client_id, name, description, type, status, priority, start_date, budget, team_members)
SELECT 
  c.id,
  'Integration Strategy Advisory',
  'Monthly strategic advisory and architecture guidance',
  'integration',
  'in_progress',
  'medium',
  '2024-09-01',
  750000,
  ARRAY['Nirmal Prince']
FROM clients c
WHERE c.company = 'RetailMax';

-- Seed subscriptions
INSERT INTO subscriptions (client_id, service_id, plan_name, modules, mrr, arr, status, billing_cycle, start_date, renewal_date)
SELECT 
  c.id,
  s.id,
  'Enterprise',
  ARRAY['template_forge_ai', 'normalize_ai', 'cs_automation_hub']::text[],
  208333,
  2500000,
  'active',
  'yearly',
  '2024-08-01',
  '2025-08-01'
FROM clients c, services s
WHERE c.company = 'TechCorp India' AND s.name = 'IntegrateWise.co - Enterprise';

INSERT INTO subscriptions (client_id, service_id, plan_name, modules, mrr, arr, status, billing_cycle, start_date, renewal_date)
SELECT 
  c.id,
  s.id,
  'Growth',
  ARRAY['template_forge_ai', 'normalize_ai']::text[],
  125000,
  1500000,
  'active',
  'yearly',
  '2024-10-01',
  '2025-10-01'
FROM clients c, services s
WHERE c.company = 'FinServ Solutions' AND s.name = 'IntegrateWise.co - Growth';

-- Seed opportunities
INSERT INTO opportunities (client_id, service_id, name, value, stage, probability, expected_close_date, owner, source)
SELECT 
  c.id,
  s.id,
  'HealthPlus MuleSoft Implementation',
  12000000,
  'proposal',
  40,
  '2025-02-15',
  'Nirmal Prince',
  'website'
FROM clients c, services s
WHERE c.company = 'HealthPlus Systems' AND s.name = 'MuleSoft Consulting & Architecture';

INSERT INTO opportunities (client_id, service_id, name, value, stage, probability, expected_close_date, owner, source)
SELECT 
  c.id,
  s.id,
  'EduTech Platform Subscription',
  800000,
  'qualification',
  20,
  '2025-03-01',
  'Nirmal Prince',
  'linkedin'
FROM clients c, services s
WHERE c.company = 'EduTech Ventures' AND s.name = 'IntegrateWise.co - Starter';

-- Seed revenue records
INSERT INTO revenue (client_id, project_id, service_id, tier, amount, type, invoice_number, invoice_date, payment_date, payment_status)
SELECT 
  p.client_id,
  p.id,
  p.service_id,
  s.tier,
  2125000,
  'service',
  'INV-2024-001',
  '2024-10-15',
  '2024-10-30',
  'paid'
FROM projects p
JOIN services s ON p.service_id = s.id
WHERE p.name = 'MuleSoft API Platform Implementation';

INSERT INTO revenue (client_id, project_id, service_id, tier, amount, type, invoice_number, invoice_date, payment_date, payment_status)
SELECT 
  p.client_id,
  p.id,
  p.service_id,
  s.tier,
  2125000,
  'service',
  'INV-2024-002',
  '2024-11-15',
  '2024-11-28',
  'paid'
FROM projects p
JOIN services s ON p.service_id = s.id
WHERE p.name = 'MuleSoft API Platform Implementation';

INSERT INTO revenue (client_id, subscription_id, service_id, tier, amount, type, invoice_number, invoice_date, payment_status)
SELECT 
  sub.client_id,
  sub.id,
  sub.service_id,
  s.tier,
  sub.mrr,
  'subscription',
  'INV-2024-SUB-001',
  '2024-12-01',
  'pending'
FROM subscriptions sub
JOIN services s ON sub.service_id = s.id
WHERE sub.plan_name = 'Enterprise';
