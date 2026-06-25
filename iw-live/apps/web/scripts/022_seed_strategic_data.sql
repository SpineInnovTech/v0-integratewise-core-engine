-- Seed Company Values
INSERT INTO company_values (name, description, icon, color, principles, examples, sort_order) VALUES
('Integration Excellence', 'We deliver world-class integration solutions that transform businesses', 'zap', 'blue', 
  ARRAY['Quality over quantity', 'Best practices always', 'Continuous improvement'],
  ARRAY['Code reviews on all deliverables', 'Following MuleSoft certified patterns', 'Regular architecture assessments'],
  1),
('Customer Success', 'Our clients success is our success - we go beyond delivery to ensure outcomes', 'heart', 'green',
  ARRAY['Proactive communication', 'Outcome-focused delivery', 'Long-term partnerships'],
  ARRAY['Monthly business reviews', 'Success metrics tracking', 'Dedicated advisory support'],
  2),
('Knowledge Sharing', 'We believe in democratizing integration knowledge through education and community', 'book-open', 'purple',
  ARRAY['Open knowledge sharing', 'Community building', 'Continuous learning'],
  ARRAY['Free community resources', 'Integration Architects Community', 'Public thought leadership'],
  3),
('Innovation', 'We leverage AI and modern technologies to solve complex integration challenges', 'lightbulb', 'amber',
  ARRAY['AI-first solutions', 'Modern architecture', 'Continuous experimentation'],
  ARRAY['Template Forge AI', 'Normalize AI', 'AI-powered consulting'],
  4),
('Transparency', 'Clear communication, honest pricing, and open collaboration with all stakeholders', 'eye', 'cyan',
  ARRAY['Clear pricing', 'Open communication', 'No hidden agendas'],
  ARRAY['Detailed proposals', 'Regular status updates', 'Honest capability assessments'],
  5);

-- Seed Tools Registry
INSERT INTO tools_registry (name, description, category, tool_type, vendor, url, icon, status, integration_status, api_connected, monthly_cost, currency, used_by, features) VALUES
('HubSpot CRM', 'Primary CRM for lead and deal management', 'crm', 'saas', 'HubSpot', 'https://hubspot.com', 'users', 'active', 'connected', true, 0, 'USD', ARRAY['Sales', 'Marketing'], ARRAY['Contact management', 'Deal tracking', 'Email sequences']),
('Pipedrive', 'Sales pipeline management', 'sales', 'saas', 'Pipedrive', 'https://pipedrive.com', 'git-branch', 'active', 'partial', false, 49, 'USD', ARRAY['Sales'], ARRAY['Pipeline visualization', 'Activity tracking', 'Sales forecasting']),
('LinkedIn Sales Navigator', 'Prospecting and outreach', 'sales', 'saas', 'LinkedIn', 'https://linkedin.com/sales', 'linkedin', 'active', 'not_connected', false, 99, 'USD', ARRAY['Sales', 'Marketing'], ARRAY['Lead discovery', 'InMail', 'CRM sync']),
('Google Analytics', 'Website and marketing analytics', 'analytics', 'saas', 'Google', 'https://analytics.google.com', 'bar-chart', 'active', 'partial', true, 0, 'USD', ARRAY['Marketing'], ARRAY['Traffic analysis', 'Conversion tracking', 'Audience insights']),
('Asana', 'Project and task management', 'productivity', 'saas', 'Asana', 'https://asana.com', 'check-square', 'active', 'connected', true, 25, 'USD', ARRAY['Operations', 'Delivery'], ARRAY['Task management', 'Project tracking', 'Team collaboration']),
('Mailchimp', 'Email marketing campaigns', 'marketing', 'saas', 'Mailchimp', 'https://mailchimp.com', 'mail', 'active', 'not_connected', false, 20, 'USD', ARRAY['Marketing'], ARRAY['Email campaigns', 'Automation', 'Analytics']),
('Notion', 'Knowledge base and documentation', 'productivity', 'saas', 'Notion', 'https://notion.so', 'file-text', 'active', 'connected', true, 10, 'USD', ARRAY['All'], ARRAY['Documentation', 'Wikis', 'Databases']),
('Vercel', 'Hosting and deployment', 'development', 'saas', 'Vercel', 'https://vercel.com', 'triangle', 'active', 'connected', true, 20, 'USD', ARRAY['Development'], ARRAY['Hosting', 'CI/CD', 'Analytics']),
('IntegrateWise OS', 'Internal operating system', 'productivity', 'internal', 'IntegrateWise', 'https://os.integratewise.co', 'layout', 'active', 'connected', true, 0, 'INR', ARRAY['All'], ARRAY['Dashboard', 'CRM', 'Analytics', 'AI Assistant']);

-- Seed Business Goals for Q1 2025
INSERT INTO business_goals (title, description, goal_type, period_type, period_start, period_end, target_value, current_value, target_unit, currency, status, progress, owner, priority) VALUES
('Q1 2025 Revenue Target', 'Achieve total revenue of 1 Crore in Q1 2025', 'revenue', 'quarterly', '2025-01-01', '2025-03-31', 10000000, 2500000, 'currency', 'INR', 'active', 25, 'Nirmal Prince', 'high'),
('Launch Template Forge AI', 'Complete development and launch Template Forge AI SaaS', 'product', 'quarterly', '2025-01-01', '2025-03-31', 100, 35, 'percentage', 'INR', 'active', 35, 'Nirmal Prince', 'high'),
('Acquire 10 New Clients', 'Sign 10 new consulting or advisory clients', 'customer', 'quarterly', '2025-01-01', '2025-03-31', 10, 3, 'number', 'INR', 'active', 30, 'Nirmal Prince', 'high'),
('Grow LinkedIn to 15K', 'Increase LinkedIn followers to 15,000', 'growth', 'quarterly', '2025-01-01', '2025-03-31', 15000, 12500, 'number', 'INR', 'active', 83, 'Nirmal Prince', 'medium'),
('Community to 500 Members', 'Grow Integration Architects Community to 500 active members', 'growth', 'quarterly', '2025-01-01', '2025-03-31', 500, 280, 'number', 'INR', 'active', 56, 'Nirmal Prince', 'medium'),
('MRR Target 5L', 'Achieve Monthly Recurring Revenue of 5 Lakhs', 'revenue', 'quarterly', '2025-01-01', '2025-03-31', 500000, 180000, 'currency', 'INR', 'active', 36, 'Nirmal Prince', 'high');

-- Seed Annual Goals
INSERT INTO business_goals (title, description, goal_type, period_type, period_start, period_end, target_value, current_value, target_unit, currency, status, progress, owner, priority) VALUES
('FY 2025 Revenue', 'Achieve annual revenue of 5 Crores', 'revenue', 'annual', '2025-01-01', '2025-12-31', 50000000, 2500000, 'currency', 'INR', 'active', 5, 'Nirmal Prince', 'high'),
('Launch 3 SaaS Products', 'Complete and launch Template Forge AI, Normalize AI, and AI Agent Suite', 'product', 'annual', '2025-01-01', '2025-12-31', 3, 0, 'number', 'INR', 'active', 0, 'Nirmal Prince', 'high'),
('50 Active Clients', 'Build client base to 50 active engagements', 'customer', 'annual', '2025-01-01', '2025-12-31', 50, 8, 'number', 'INR', 'active', 16, 'Nirmal Prince', 'high');

-- Seed ROI Tracking
INSERT INTO roi_tracking (entity_type, entity_id, entity_name, period_start, period_end, investment, revenue_generated, leads_generated, deals_closed, customers_acquired, roi_percentage, notes) VALUES
('campaign', (SELECT id FROM campaigns WHERE name LIKE '%MuleSoft%' LIMIT 1), 'MuleSoft Decision Makers Q4', '2024-10-01', '2024-12-31', 50000, 2500000, 45, 8, 5, 4900, 'Highly successful email campaign targeting MuleSoft decision makers'),
('campaign', (SELECT id FROM campaigns WHERE name LIKE '%LinkedIn%' LIMIT 1), 'LinkedIn Thought Leadership', '2024-01-01', '2024-12-31', 25000, 1800000, 120, 15, 8, 7100, 'Ongoing LinkedIn content strategy'),
('campaign', (SELECT id FROM campaigns WHERE name LIKE '%Webinar%' LIMIT 1), 'Integration Excellence Webinar Series', '2024-01-01', '2024-12-31', 100000, 3500000, 85, 12, 6, 3400, 'Monthly webinar series on integration patterns');
