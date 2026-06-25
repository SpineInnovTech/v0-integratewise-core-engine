-- Seed sample documents (Knowledge Base)
INSERT INTO documents (title, content, category, description, icon) VALUES
-- Strategy
('Business Strategy Plan', 'Long-term goals & initiatives. Email reporting guidelines. Comprehensive business strategy for IntegrateWise covering market positioning, growth targets, and competitive advantages.', 'strategy', 'Long-term goals & initiatives for IntegrateWise', 'Target'),
('Service Offerings', 'List of all services provided. Bundles and pricing. Integration consulting, implementation services, managed services, and custom development.', 'strategy', 'Complete catalog of IntegrateWise services', 'Briefcase'),
('Pricing Strategy', 'Pricing modes & discounts. Value proposition. Value-based pricing model with tiered packages for different business sizes.', 'strategy', 'Pricing models and value propositions', 'DollarSign'),

-- Sales
('Sales Playbook', 'Step-by-step sales process. CRM usage guidelines. Discovery call scripts, objection handling, and closing techniques.', 'sales', 'Complete sales process documentation', 'BookOpen'),
('Case Studies', 'Success stories & client testimonials. Real-world examples of successful integrations and ROI achieved.', 'sales', 'Client success stories and testimonials', 'Star'),
('Proposal Templates', 'Standard proposal formats. Customizable templates for different client segments and project sizes.', 'sales', 'Ready-to-use proposal templates', 'FileText'),

-- Marketing
('Marketing Plan', 'Sourcing, channels & budget allocation. LinkedIn content strategy, email campaigns, and webinar schedule.', 'marketing', 'Marketing strategy and budget', 'Megaphone'),
('LinkedIn Mastery', 'Personal branding & outreach guide. Content calendar, engagement strategies, and thought leadership.', 'marketing', 'LinkedIn marketing playbook', 'Linkedin'),
('Website Content', 'Website structure & copy guidelines. Landing pages, blog posts, and SEO strategy.', 'marketing', 'Website content and structure', 'Globe'),

-- Operations
('Operations Manual', 'Internal processes & procedures. Daily operations, escalation paths, and quality control.', 'operations', 'Standard operating procedures', 'Settings'),
('Client Onboarding', 'New client setup process. Kickoff meeting agendas, documentation requirements, and timeline.', 'operations', 'Client onboarding workflow', 'UserPlus'),

-- Delivery
('Delivery Playbooks', 'Project execution & client onboarding. Implementation methodologies and best practices.', 'delivery', 'Project delivery guidelines', 'CheckSquare'),
('Technical Architecture', 'System design and integration patterns. API specifications, data flows, and security protocols.', 'technology', 'Technical documentation', 'Code'),

-- Finance
('Financial Guide', 'Budgeting, expenses & revenue tracking. Financial projections, expense categories, and reporting.', 'finance', 'Financial management guidelines', 'PieChart'),
('Dashboard Guide', 'Metrics, reporting & data analysis. KPI definitions, dashboard usage, and reporting schedules.', 'finance', 'Analytics and reporting guide', 'BarChart2'),

-- HR & People
('Employee Handbook', 'Company policies, benefits, and culture. Leave policies, code of conduct, and growth opportunities.', 'hr', 'HR policies and guidelines', 'Users'),
('Hiring Playbook', 'Recruitment process and interview guides. Job descriptions, assessment criteria, and onboarding checklist.', 'hr', 'Recruitment and hiring guide', 'UserPlus'),

-- Product
('Product Roadmap', 'Feature pipeline and release schedule. Quarterly goals, feature prioritization, and customer feedback integration.', 'product', 'Product development roadmap', 'Map'),
('Feature Specifications', 'Detailed feature requirements and user stories. Acceptance criteria and technical requirements.', 'product', 'Product feature documentation', 'Clipboard'),

-- Technology
('Security Policies', 'Data protection and compliance. GDPR compliance, data handling, and security protocols.', 'technology', 'Security and compliance documentation', 'Shield');

-- Seed sample tasks
INSERT INTO tasks (title, description, priority, status, due_date, assignee, tags) VALUES
('Review Q4 sales pipeline', 'Analyze all deals in pipeline and update forecasts', 'high', 'in_progress', CURRENT_DATE + INTERVAL '2 days', 'Rechetts', ARRAY['sales', 'quarterly']),
('Update pricing documentation', 'Reflect new pricing tiers in all materials', 'high', 'todo', CURRENT_DATE + INTERVAL '3 days', 'Rechetts', ARRAY['documentation', 'pricing']),
('Client onboarding - TechCorp', 'Complete kickoff meeting and setup', 'medium', 'in_progress', CURRENT_DATE + INTERVAL '5 days', 'Team', ARRAY['client', 'onboarding']),
('Prepare monthly metrics report', 'Compile all KPIs for stakeholder review', 'medium', 'todo', CURRENT_DATE + INTERVAL '7 days', 'Rechetts', ARRAY['reporting', 'monthly']),
('LinkedIn content calendar', 'Plan posts for next 2 weeks', 'low', 'todo', CURRENT_DATE + INTERVAL '4 days', 'Marketing', ARRAY['marketing', 'social']),
('Security audit preparation', 'Gather documentation for compliance review', 'high', 'todo', CURRENT_DATE + INTERVAL '10 days', 'Tech Team', ARRAY['security', 'compliance']);

-- Seed sample calendar events
INSERT INTO calendar_events (title, description, event_type, start_time, end_time, location, attendees, color) VALUES
('Team Standup', 'Daily sync with the team', 'meeting', CURRENT_DATE + TIME '09:00', CURRENT_DATE + TIME '09:30', 'Google Meet', ARRAY['Team'], 'teal'),
('Client Discovery Call', 'Initial call with potential client', 'call', CURRENT_DATE + TIME '11:00', CURRENT_DATE + TIME '12:00', 'Zoom', ARRAY['Rechetts', 'Client'], 'blue'),
('Lunch Break', 'Break time', 'break', CURRENT_DATE + TIME '13:00', CURRENT_DATE + TIME '14:00', NULL, ARRAY[]::text[], 'gray'),
('Deep Work - Strategy', 'Focus time for strategy work', 'focus', CURRENT_DATE + TIME '14:00', CURRENT_DATE + TIME '16:00', NULL, ARRAY['Rechetts'], 'purple'),
('Sales Pipeline Review', 'Weekly pipeline review', 'meeting', CURRENT_DATE + TIME '16:30', CURRENT_DATE + TIME '17:30', 'Office', ARRAY['Sales Team'], 'teal'),
('Project Alpha Kickoff', 'New project kickoff meeting', 'meeting', CURRENT_DATE + INTERVAL '1 day' + TIME '10:00', CURRENT_DATE + INTERVAL '1 day' + TIME '11:30', 'Google Meet', ARRAY['Rechetts', 'Dev Team', 'Client'], 'green');

-- Seed sample emails
INSERT INTO emails (subject, sender_name, sender_email, preview, body, folder, is_read, is_starred, received_at) VALUES
('Re: Project Proposal Review', 'John Smith', 'john@techcorp.com', 'Thanks for sending over the proposal. We reviewed it with our team and...', 'Thanks for sending over the proposal. We reviewed it with our team and have a few questions about the implementation timeline. Can we schedule a call this week to discuss?', 'inbox', false, true, NOW() - INTERVAL '2 hours'),
('Monthly Newsletter - December', 'IntegrateWise', 'newsletter@integratewise.com', 'Your monthly update on integrations, best practices, and upcoming features...', 'Welcome to the December edition of our newsletter. This month we cover new integration patterns, customer success stories, and our roadmap for 2024.', 'inbox', true, false, NOW() - INTERVAL '1 day'),
('Meeting Confirmation: Q4 Review', 'Calendar', 'calendar@integratewise.com', 'Your meeting has been confirmed for tomorrow at 2:00 PM...', 'Your Q4 Review meeting has been confirmed. All participants have been notified. Meeting link: https://meet.google.com/abc-defg-hij', 'inbox', true, false, NOW() - INTERVAL '3 hours'),
('Invoice #INV-2024-156', 'Billing', 'billing@client.com', 'Please find attached the invoice for November services...', 'Invoice attached for November consulting services. Payment terms: Net 30. Please remit payment to the account specified in the invoice.', 'inbox', false, false, NOW() - INTERVAL '5 hours'),
('New Lead: Enterprise Inquiry', 'HubSpot', 'notifications@hubspot.com', 'A new enterprise lead has submitted an inquiry through your website...', 'New lead captured: Enterprise Corp has requested information about your integration services. Contact: CEO, Email: ceo@enterprise.com, Company Size: 500+', 'inbox', false, true, NOW() - INTERVAL '30 minutes');

-- Seed sample drive files
INSERT INTO drive_files (name, file_type, size_bytes, is_starred, content_preview) VALUES
('Q4 Revenue Forecast.xlsx', 'spreadsheet', 245000, true, 'Revenue projections for Q4 2024 with monthly breakdowns'),
('Client Presentation - TechCorp.pptx', 'presentation', 3500000, true, 'Sales presentation for TechCorp engagement'),
('Integration Architecture Diagram.png', 'image', 890000, false, 'System architecture diagram showing data flows'),
('Contract Template.docx', 'document', 125000, false, 'Standard contract template for new clients'),
('Project Alpha', 'folder', 0, true, 'All documents related to Project Alpha'),
('Financial Reports 2024', 'folder', 0, false, 'Monthly and quarterly financial reports'),
('Marketing Assets', 'folder', 0, false, 'Logos, images, and marketing collateral'),
('Security Compliance Checklist.pdf', 'pdf', 456000, true, 'Compliance requirements and checklist');

-- Seed sample activities
INSERT INTO activities (activity_type, title, description, icon, color, related_entity_type, actor_name) VALUES
('task_completed', 'Completed: Client proposal review', 'Finished reviewing the TechCorp proposal', 'CheckCircle', 'green', 'task', 'Rechetts'),
('email_received', 'New email from John Smith', 'Re: Project Proposal Review', 'Mail', 'blue', 'email', 'John Smith'),
('document_updated', 'Updated Sales Playbook', 'Added new objection handling scripts', 'FileText', 'teal', 'document', 'Rechetts'),
('meeting_scheduled', 'Scheduled: Q4 Review Meeting', 'Tomorrow at 2:00 PM', 'Calendar', 'purple', 'calendar_event', 'System'),
('file_uploaded', 'Uploaded: Q4 Revenue Forecast', 'New spreadsheet added to Drive', 'Upload', 'orange', 'drive_file', 'Rechetts'),
('interaction_captured', 'Captured: ChatGPT conversation', 'Pricing strategy research saved', 'MessageSquare', 'teal', 'interaction', 'System');

-- Seed sample metrics
INSERT INTO metrics (metric_name, metric_value, metric_unit, currency, change_percentage, change_direction, period_start, period_end) VALUES
('mrr', 2600000, 'currency', 'INR', 12, 'up', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
('pipeline', 4500000, 'currency', 'INR', 8, 'up', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
('revenue', 1280000, 'currency', 'INR', 5, 'up', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
('active_projects', 3, 'count', NULL, 0, 'neutral', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
('leads', 12, 'count', NULL, 15, 'up', DATE_TRUNC('week', CURRENT_DATE), DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' - INTERVAL '1 day'),
('posts', 16, 'count', NULL, 10, 'up', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
('followers', 1200, 'count', NULL, 5, 'up', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');

-- Seed sample interactions (AI chats, browser history)
INSERT INTO interactions (content, source, title, source_url, metadata) VALUES
('Q: What is the best pricing strategy for a B2B SaaS? A: Value-based pricing is often most effective for B2B SaaS. Consider: 1) Understand customer value perception, 2) Tier based on usage/features, 3) Annual discounts for commitment, 4) Include implementation/support in pricing.', 'chatgpt', 'Pricing Strategy Research', 'https://chat.openai.com', '{"model": "gpt-4", "tokens": 450}'::jsonb),
('Q: How to handle sales objections about price? A: Common techniques: 1) Acknowledge the concern, 2) Reframe to value/ROI, 3) Break down cost over time, 4) Compare to cost of not solving the problem, 5) Offer pilot/trial.', 'chatgpt', 'Sales Objection Handling', 'https://chat.openai.com', '{"model": "gpt-4", "tokens": 380}'::jsonb),
('Researched competitor pricing pages: Competitor A offers 3 tiers ($99-$499), Competitor B has usage-based pricing, Competitor C has flat rate with add-ons.', 'browser', 'Competitor Pricing Analysis', 'https://competitor.com/pricing', '{"time_spent_seconds": 420}'::jsonb),
('Q: What are the key metrics for a consulting business? A: 1) MRR/ARR, 2) Pipeline value, 3) Win rate, 4) Average deal size, 5) Client lifetime value, 6) Utilization rate, 7) NPS score.', 'perplexity', 'Consulting Business Metrics', 'https://perplexity.ai', '{"sources": 5}'::jsonb),
('Read article on integration best practices: API-first design, error handling patterns, retry mechanisms, and monitoring strategies.', 'browser', 'Integration Best Practices Article', 'https://blog.example.com/integration-best-practices', '{"time_spent_seconds": 600}'::jsonb);
