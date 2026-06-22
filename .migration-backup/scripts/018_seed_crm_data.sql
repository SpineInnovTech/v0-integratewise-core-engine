-- Seed sample CRM data for IntegrateWise

-- Fixed: first_name/last_name -> name, owner -> assigned_to
-- Sample Leads
INSERT INTO leads (name, email, phone, company, title, linkedin_url, status, source, source_detail, score, assigned_to, tags, notes) VALUES
('Rajesh Kumar', 'rajesh.kumar@techcorp.in', '+91 98765 43210', 'TechCorp India', 'CTO', 'https://linkedin.com/in/rajeshkumar', 'qualified', 'linkedin', 'MuleSoft Architecture Post', 85, 'Nirmal Prince', ARRAY['mulesoft', 'enterprise', 'hot'], 'Interested in MuleSoft consulting. Has budget approval.'),
('Priya Sharma', 'priya.sharma@finserve.com', '+91 87654 32109', 'FinServe Ltd', 'VP Engineering', 'https://linkedin.com/in/priyasharma', 'contacted', 'referral', 'Referred by Amit Shah', 72, 'Nirmal Prince', ARRAY['integration', 'fintech'], 'Looking for integration platform. Follow up next week.'),
('Amit Patel', 'amit.patel@retailplus.in', '+91 76543 21098', 'RetailPlus', 'Director of IT', NULL, 'new', 'website', 'Downloaded MuleSoft whitepaper', 45, NULL, ARRAY['retail', 'api'], 'Downloaded whitepaper, no contact yet.'),
('Sneha Reddy', 'sneha.reddy@healthtech.io', '+91 65432 10987', 'HealthTech Solutions', 'Head of Product', 'https://linkedin.com/in/snehareddy', 'qualified', 'event', 'MuleSoft Summit 2024', 78, 'Nirmal Prince', ARRAY['healthcare', 'saas', 'integration'], 'Met at summit. Very interested in Template Forge AI.'),
('Vikram Singh', 'vikram.singh@logisticspro.com', '+91 54321 09876', 'LogisticsPro', 'CEO', NULL, 'contacted', 'cold_outreach', 'LinkedIn outreach campaign', 55, 'Nirmal Prince', ARRAY['logistics', 'automation'], 'Responded to LinkedIn message. Scheduling call.'),
('Anita Desai', 'anita.desai@edulearn.in', '+91 43210 98765', 'EduLearn', 'COO', 'https://linkedin.com/in/anitadesai', 'new', 'hubspot', 'Inbound form submission', 60, NULL, ARRAY['edtech', 'startup'], 'Filled out contact form asking about coaching.'),
('Ravi Menon', 'ravi.menon@cloudnine.tech', '+91 32109 87654', 'CloudNine Tech', 'Integration Architect', 'https://linkedin.com/in/ravimenon', 'converted', 'linkedin', 'Community member', 90, 'Nirmal Prince', ARRAY['community', 'architect', 'champion'], 'Converted to client for Foundation tier.'),
('Deepa Iyer', 'deepa.iyer@mediahub.in', '+91 21098 76543', 'MediaHub', 'Tech Lead', NULL, 'unqualified', 'website', 'Blog visitor', 25, NULL, ARRAY['media'], 'No budget, exploring options for next year.');

-- Sample Campaigns
INSERT INTO campaigns (name, description, type, status, target_audience, start_date, end_date, budget, sent_count, opened_count, clicked_count, leads_generated, tags) VALUES
('MuleSoft Architecture LinkedIn Campaign', 'Targeting MuleSoft architects and integration leads on LinkedIn', 'linkedin', 'active', 'Integration Architects, CTOs at mid-large enterprises', '2024-12-01', '2024-12-31', 50000, 500, 125, 45, 12, ARRAY['mulesoft', 'linkedin', 'q4']),
('Template Forge AI Launch', 'Product launch campaign for Template Forge AI SaaS', 'email', 'active', 'Tech leads, Product managers at SaaS companies', '2024-12-15', '2025-01-15', 100000, 2500, 625, 180, 28, ARRAY['template-forge', 'saas', 'launch']),
('Integration Excellence Webinar Series', 'Monthly webinar series on integration best practices', 'webinar', 'active', 'Integration professionals, Solution architects', '2024-10-01', '2025-03-31', 25000, 0, 0, 0, 45, ARRAY['webinar', 'education', 'community']),
('Referral Program Q4', 'Client referral program with incentives', 'referral', 'active', 'Existing clients and community members', '2024-10-01', '2024-12-31', 0, 0, 0, 0, 8, ARRAY['referral', 'organic']),
('Cold Outreach - Enterprise', 'Targeted cold outreach to enterprise accounts', 'cold_outreach', 'paused', 'CTOs and VPs at Fortune 500', '2024-11-01', '2024-12-31', 30000, 150, 22, 8, 3, ARRAY['enterprise', 'cold', 'outbound']);

-- Sample Lead Activities
INSERT INTO lead_activities (lead_id, type, subject, description, performed_by, metadata)
SELECT 
  l.id,
  'email_sent',
  'Introduction to IntegrateWise Services',
  'Sent introductory email about MuleSoft consulting services',
  'Nirmal Prince',
  '{"template": "intro_mulesoft", "campaign": "q4_outreach"}'::jsonb
FROM leads l WHERE l.email = 'rajesh.kumar@techcorp.in';

INSERT INTO lead_activities (lead_id, type, subject, description, performed_by, metadata)
SELECT 
  l.id,
  'meeting_scheduled',
  'Discovery Call - MuleSoft Architecture',
  'Scheduled 30-min discovery call to discuss integration challenges',
  'Nirmal Prince',
  '{"meeting_date": "2024-12-20T10:00:00", "meeting_link": "https://meet.google.com/abc-xyz"}'::jsonb
FROM leads l WHERE l.email = 'rajesh.kumar@techcorp.in';

INSERT INTO lead_activities (lead_id, type, subject, description, performed_by, metadata)
SELECT 
  l.id,
  'linkedin_connection',
  'LinkedIn Connection Request Accepted',
  'Priya accepted LinkedIn connection request',
  'Nirmal Prince',
  '{}'::jsonb
FROM leads l WHERE l.email = 'priya.sharma@finserve.com';

-- Sample Data Source Sync Logs
INSERT INTO data_source_sync (source, sync_type, status, records_fetched, records_created, records_updated, completed_at) VALUES
('hubspot', 'incremental', 'completed', 45, 3, 12, NOW() - INTERVAL '2 hours'),
('stripe', 'webhook', 'completed', 1, 1, 0, NOW() - INTERVAL '30 minutes'),
('google_analytics', 'full', 'completed', 1250, 0, 0, NOW() - INTERVAL '6 hours'),
('linkedin', 'incremental', 'completed', 28, 5, 8, NOW() - INTERVAL '1 hour');

-- Sample Revenue Transactions
INSERT INTO revenue_transactions (type, amount, currency, status, description, transaction_date) VALUES
('payment', 250000, 'INR', 'completed', 'Foundation Tier - TechCorp India', NOW() - INTERVAL '5 days'),
('payment', 75000, 'INR', 'completed', 'CTO Advisory Retainer - Dec 2024', NOW() - INTERVAL '3 days'),
('subscription', 1000000, 'INR', 'completed', 'AI Agent Suite - Monthly', NOW() - INTERVAL '1 day'),
('invoice', 500000, 'INR', 'pending', 'MuleSoft Consulting - Phase 1', NOW());

-- Sample Content Library
INSERT INTO content_library (title, type, status, category, description, platform, published_at, views, engagement, shares, tags) VALUES
('Why Your MuleSoft Implementation Fails: 5 Critical Mistakes', 'article', 'published', 'thought_leadership', 'Deep dive into common MuleSoft implementation pitfalls', 'linkedin', '2024-12-15', 12500, 890, 156, ARRAY['mulesoft', 'best-practices']),
('Integration Architecture Patterns 2025', 'ebook', 'published', 'lead_magnet', 'Comprehensive guide to modern integration patterns', 'website', '2024-11-01', 3200, 0, 245, ARRAY['integration', 'architecture', 'ebook']),
('Customer Success Automation Playbook', 'guide', 'published', 'lead_magnet', 'Step-by-step guide to automating CS workflows', 'website', '2024-08-15', 1850, 0, 98, ARRAY['customer-success', 'automation']),
('From Java Architect to Fractional CTO', 'video', 'published', 'case_study', 'My journey video - building IntegrateWise', 'youtube', '2024-10-20', 8500, 620, 180, ARRAY['personal-brand', 'story']),
('MuleSoft vs Dell Boomi: 2025 Comparison', 'article', 'published', 'seo', 'Detailed comparison for enterprise integration platforms', 'blog', '2024-12-01', 15800, 450, 320, ARRAY['mulesoft', 'comparison', 'seo']);

-- Sample Deals
INSERT INTO deals (name, lead_id, stage, value, probability, expected_close_date, assigned_to, source, notes)
SELECT 
  'TechCorp MuleSoft Consulting',
  l.id,
  'proposal',
  7500000,
  60,
  '2025-01-31',
  'Nirmal Prince',
  'linkedin',
  'Phase 1: Architecture assessment'
FROM leads l WHERE l.email = 'rajesh.kumar@techcorp.in';

INSERT INTO deals (name, lead_id, stage, value, probability, expected_close_date, assigned_to, source, notes)
SELECT 
  'FinServe Integration Platform',
  l.id,
  'negotiation',
  6000000,
  80,
  '2025-01-15',
  'Nirmal Prince',
  'referral',
  '6-month retainer discussion'
FROM leads l WHERE l.email = 'priya.sharma@finserve.com';

INSERT INTO deals (name, lead_id, stage, value, probability, expected_close_date, assigned_to, source, notes)
SELECT 
  'HealthTech Template Forge AI',
  l.id,
  'discovery',
  1800000,
  30,
  '2025-02-28',
  'Nirmal Prince',
  'event',
  'Initial discovery phase'
FROM leads l WHERE l.email = 'sneha.reddy@healthtech.io';
