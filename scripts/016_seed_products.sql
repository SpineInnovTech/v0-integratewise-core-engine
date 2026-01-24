-- Seed IntegrateWise Products across all 5 tiers

INSERT INTO products (name, description, tier, tier_name, category, pricing_model, price_min, price_max, currency, is_featured, icon, color, features, deliverables, ideal_for, external_url, sort_order) VALUES

-- TIER 1: PROFESSIONAL SERVICES
('MuleSoft Consulting & Architecture', 'Enterprise-grade MuleSoft implementation, architecture design, and API strategy for large organizations.', 1, 'Professional Services', 'Consulting', 'custom', 5000000, 15000000, 'INR', true, 'Building2', 'blue', 
'["Full MuleSoft implementation", "API strategy & design", "Architecture review", "Performance optimization", "Security hardening", "Team training"]'::jsonb,
'["Architecture blueprint", "Implementation roadmap", "API specifications", "Security documentation", "Training materials"]'::jsonb,
'Large enterprises with complex integration needs', NULL, 1),

('Customer Success Automation', 'End-to-end automation of customer success workflows including onboarding, health scoring, and churn prediction.', 1, 'Professional Services', 'Automation', 'custom', 1000000, 2500000, 'INR', true, 'Users', 'green',
'["Customer journey mapping", "Health score automation", "Churn prediction models", "Onboarding workflows", "Renewal automation", "Monthly retainer option"]'::jsonb,
'["Automation playbooks", "Integration setup", "Dashboard & reports", "Training sessions"]'::jsonb,
'SaaS companies with 100+ customers', NULL, 2),

-- TIER 2: RECURRING REVENUE
('Integration CTO/Advisory Retainer', 'Fractional CTO services focused on integration strategy, architecture decisions, and team mentorship.', 2, 'Recurring Revenue', 'Advisory', 'monthly', 500000, 1000000, 'INR', true, 'Crown', 'purple',
'["Weekly strategy calls", "Architecture reviews", "Vendor evaluation", "Team mentorship", "Technology roadmap", "Board-level reporting"]'::jsonb,
'["Monthly strategy report", "Architecture recommendations", "Vendor assessment", "Team feedback"]'::jsonb,
'Growing tech companies needing integration leadership', NULL, 3),

('1:1 Founder/CTO Coaching', 'Personal coaching for technical founders and CTOs on integration strategy, team building, and scaling.', 2, 'Recurring Revenue', 'Coaching', 'monthly', 200000, 500000, 'INR', true, 'GraduationCap', 'orange',
'["Weekly 1:1 sessions", "Async support via Slack", "Resource library access", "Peer network intro", "Annual retreat invite"]'::jsonb,
'["Session recordings", "Action items", "Resource recommendations", "Progress tracking"]'::jsonb,
'Technical founders scaling from 10 to 100', NULL, 4),

-- TIER 3: SCALABLE
('Corporate Workshops & Training', 'Intensive workshops on integration best practices, API design, and MuleSoft for enterprise teams.', 3, 'Scalable', 'Training', 'fixed', 300000, 500000, 'INR', false, 'Presentation', 'teal',
'["2-3 day intensive program", "Hands-on labs", "Real-world case studies", "Certification prep", "Post-workshop support"]'::jsonb,
'["Training materials", "Lab exercises", "Certification guide", "Recording access"]'::jsonb,
'Enterprise IT teams and integration developers', NULL, 5),

('Integration Excellence Certification', 'Comprehensive certification program validating integration architecture and implementation skills.', 3, 'Scalable', 'Certification', 'yearly', 200000, 200000, 'INR', false, 'Award', 'amber',
'["Self-paced curriculum", "Live Q&A sessions", "Practical assessments", "Digital badge", "Annual renewal option (₹1L)"]'::jsonb,
'["Course materials", "Practice exams", "Digital certificate", "LinkedIn badge"]'::jsonb,
'Integration architects and senior developers', NULL, 6),

-- TIER 4: DIGITAL PRODUCTS + SaaS
('Premium CSM Templates', 'Battle-tested templates for Customer Success Management including playbooks, scorecards, and automation workflows.', 4, 'Digital Products + SaaS', 'Templates', 'fixed', 24900, 83000, 'USD', false, 'FileText', 'pink',
'["20+ ready-to-use templates", "Notion & Sheets formats", "Video walkthroughs", "Quarterly updates", "Community access"]'::jsonb,
'["Template library", "Setup guides", "Video tutorials"]'::jsonb,
'CSM teams and Customer Success leaders', 'https://templates.integratewise.co', 7),

('AI Agent Suite', 'Enterprise AI agents for customer support, data analysis, and workflow automation powered by latest LLMs.', 4, 'Digital Products + SaaS', 'SaaS', 'monthly', 1000000, 1000000, 'INR', true, 'Bot', 'violet',
'["Custom AI agents", "Multi-LLM support", "Enterprise security", "API access", "Dedicated support", "Custom training"]'::jsonb,
'["Agent deployment", "API documentation", "Training data setup", "Monthly reviews"]'::jsonb,
'Enterprises looking to automate with AI', NULL, 8),

('Template Forge AI', 'AI-powered template generation platform for creating business documents, proposals, and playbooks at scale.', 4, 'Digital Products + SaaS', 'SaaS', 'custom', 800000, 2500000, 'INR', true, 'Wand2', 'emerald',
'["AI template generation", "Brand customization", "Team collaboration", "Version control", "Analytics dashboard", "API integration"]'::jsonb,
'["Platform access", "Custom templates", "Team training", "Priority support"]'::jsonb,
'Agencies and consultancies creating proposals', 'https://templateforge.ai', 9),

('Normalize AI', 'Data normalization and transformation SaaS for cleaning, standardizing, and enriching business data.', 4, 'Digital Products + SaaS', 'SaaS', 'custom', 500000, 1500000, 'INR', true, 'Database', 'cyan',
'["Automated data cleaning", "Schema normalization", "Duplicate detection", "Data enrichment", "API connectors", "Audit trails"]'::jsonb,
'["Platform access", "Connector setup", "Data migration support", "Training"]'::jsonb,
'Data teams dealing with messy integrations', 'https://normalize.ai', 10),

('IntegrateWise.co', 'Referral and partnership program for integration consultants and agencies.', 4, 'Digital Products + SaaS', 'Referral', 'custom', 0, 0, 'INR', false, 'Share2', 'slate',
'["Partner portal access", "Lead sharing", "Co-marketing", "Revenue share", "Training resources"]'::jsonb,
'["Partner agreement", "Marketing kit", "Lead tracking"]'::jsonb,
'Integration consultants and agencies', 'https://integratewise.co', 11),

-- TIER 5: COMMUNITY
('Integration Architects Community', 'Exclusive community for integration professionals with resources, networking, and learning opportunities.', 5, 'Community', 'Community', 'monthly', 0, 2000, 'INR', false, 'Users2', 'rose',
'["Free tier available", "Premium Discord access", "Monthly AMAs", "Job board", "Resource library", "Annual summit invite"]'::jsonb,
'["Community access", "Resource library", "Event invites", "Peer networking"]'::jsonb,
'Integration architects and developers', 'https://community.integratewise.co', 12)

ON CONFLICT DO NOTHING;
