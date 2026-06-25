-- Seed Website Pages
INSERT INTO website_pages (title, slug, page_type, status, content, meta_description, views, unique_visitors, avg_time_on_page, bounce_rate, conversions, seo_score, tags, published_at) VALUES
('Home', '/', 'landing', 'published', 'Welcome to IntegrateWise - Your Integration Partner', 'IntegrateWise helps businesses streamline operations with expert integration consulting', 12500, 8200, 45, 42.5, 320, 92, ARRAY['homepage', 'integration'], NOW() - INTERVAL '90 days'),
('About Us', '/about', 'page', 'published', 'Learn about IntegrateWise and our mission', 'Meet the IntegrateWise team and learn about our integration expertise', 3200, 2800, 120, 35.2, 85, 88, ARRAY['about', 'company'], NOW() - INTERVAL '90 days'),
('Services', '/services', 'page', 'published', 'Our comprehensive integration services', 'Explore our integration consulting, development, and advisory services', 5600, 4200, 90, 38.5, 180, 90, ARRAY['services', 'integration'], NOW() - INTERVAL '90 days'),
('Contact', '/contact', 'page', 'published', 'Get in touch with IntegrateWise', 'Contact us for integration consulting and support', 2100, 1800, 60, 28.5, 420, 85, ARRAY['contact', 'support'], NOW() - INTERVAL '90 days'),
('MuleSoft Consulting', '/services/mulesoft', 'service', 'published', 'Expert MuleSoft consulting and implementation', 'MuleSoft certified consultants for API-led connectivity', 2800, 2100, 180, 32.0, 95, 94, ARRAY['mulesoft', 'api', 'integration'], NOW() - INTERVAL '60 days'),
('Integration Patterns Blog', '/blog/integration-patterns', 'blog', 'published', 'Learn about modern integration patterns for enterprise systems', 'A comprehensive guide to enterprise integration patterns', 4500, 3800, 240, 25.5, 45, 96, ARRAY['blog', 'patterns', 'integration'], NOW() - INTERVAL '30 days'),
('API Design Best Practices', '/blog/api-design', 'blog', 'published', 'Best practices for designing robust APIs', 'Learn how to design APIs that scale and perform', 3200, 2700, 210, 28.0, 32, 93, ARRAY['blog', 'api', 'design'], NOW() - INTERVAL '15 days'),
('Free Consultation', '/free-consultation', 'landing', 'published', 'Book your free 30-minute consultation', 'Schedule a free consultation with our integration experts', 1800, 1500, 75, 22.0, 280, 89, ARRAY['consultation', 'landing', 'lead-gen'], NOW() - INTERVAL '45 days'),
('Case Studies', '/case-studies', 'page', 'published', 'See our successful integration projects', 'Real-world integration success stories', 1500, 1200, 150, 30.0, 25, 87, ARRAY['case-studies', 'success'], NOW() - INTERVAL '60 days'),
('Pricing', '/pricing', 'page', 'draft', 'Our transparent pricing model', 'IntegrateWise pricing for all service tiers', 0, 0, 0, 0, 0, 75, ARRAY['pricing', 'services'], NULL);

-- Seed Website Forms
INSERT INTO website_forms (name, form_type, page_id, status, fields, submissions_count, conversion_rate, connected_to, thank_you_message) VALUES
('Contact Form', 'contact', (SELECT id FROM website_pages WHERE slug = '/contact'), 'active', '[{"name":"name","type":"text","required":true},{"name":"email","type":"email","required":true},{"name":"company","type":"text","required":false},{"name":"message","type":"textarea","required":true}]', 420, 20.0, 'hubspot', 'Thank you for contacting us! We will get back to you within 24 hours.'),
('Newsletter Signup', 'newsletter', (SELECT id FROM website_pages WHERE slug = '/'), 'active', '[{"name":"email","type":"email","required":true}]', 850, 10.4, 'hubspot', 'Welcome! Check your inbox for our latest insights.'),
('Free Consultation', 'consultation', (SELECT id FROM website_pages WHERE slug = '/free-consultation'), 'active', '[{"name":"name","type":"text","required":true},{"name":"email","type":"email","required":true},{"name":"company","type":"text","required":true},{"name":"phone","type":"tel","required":false},{"name":"challenge","type":"textarea","required":true}]', 280, 15.6, 'hubspot', 'Your consultation is confirmed! You will receive a calendar invite shortly.'),
('Quote Request', 'quote', (SELECT id FROM website_pages WHERE slug = '/services'), 'active', '[{"name":"name","type":"text","required":true},{"name":"email","type":"email","required":true},{"name":"company","type":"text","required":true},{"name":"service","type":"select","required":true},{"name":"budget","type":"select","required":false}]', 180, 3.2, 'hubspot', 'Thank you for your interest! Our team will prepare a custom quote for you.');

-- Seed Website Visitors
INSERT INTO website_visitors (visitor_id, total_visits, total_pageviews, total_time_seconds, email, name, company, country, device_type, browser, first_utm_source, lifecycle_stage, lead_id) VALUES
('vis_001', 12, 45, 3600, 'sarah@techcorp.com', 'Sarah Johnson', 'TechCorp', 'USA', 'desktop', 'Chrome', 'google', 'customer', (SELECT id FROM leads WHERE email = 'sarah@techcorp.com' LIMIT 1)),
('vis_002', 8, 28, 2100, 'raj@financeplus.in', 'Raj Patel', 'FinancePlus', 'India', 'desktop', 'Chrome', 'linkedin', 'sql', NULL),
('vis_003', 5, 15, 1200, 'mike@startup.io', 'Mike Chen', 'StartupIO', 'Singapore', 'mobile', 'Safari', 'twitter', 'mql', NULL),
('vis_004', 3, 8, 600, NULL, NULL, NULL, 'UK', 'desktop', 'Firefox', 'organic', 'visitor', NULL),
('vis_005', 15, 62, 5400, 'priya@enterprise.com', 'Priya Sharma', 'Enterprise Co', 'India', 'desktop', 'Edge', 'referral', 'customer', NULL);

-- Seed HubSpot Sync Log
INSERT INTO hubspot_sync_log (sync_type, direction, status, records_processed, records_created, records_updated, started_at, completed_at) VALUES
('contacts', 'inbound', 'completed', 150, 45, 105, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '55 minutes'),
('deals', 'inbound', 'completed', 28, 8, 20, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '58 minutes'),
('companies', 'inbound', 'completed', 35, 12, 23, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '57 minutes'),
('forms', 'inbound', 'completed', 85, 85, 0, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 50 minutes'),
('contacts', 'outbound', 'completed', 25, 25, 0, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes');

-- Seed Conversion Funnel
INSERT INTO conversion_funnel (visitor_id, stage, previous_stage, source, campaign, revenue_attributed, converted_at) VALUES
('vis_001', 'customer', 'opportunity', 'google', 'brand-search', 750000, NOW() - INTERVAL '30 days'),
('vis_001', 'opportunity', 'sql', 'google', 'brand-search', 0, NOW() - INTERVAL '45 days'),
('vis_001', 'sql', 'mql', 'google', 'brand-search', 0, NOW() - INTERVAL '60 days'),
('vis_002', 'sql', 'mql', 'linkedin', 'cto-advisory', 0, NOW() - INTERVAL '7 days'),
('vis_002', 'mql', 'lead', 'linkedin', 'cto-advisory', 0, NOW() - INTERVAL '14 days'),
('vis_003', 'mql', 'lead', 'twitter', 'integration-webinar', 0, NOW() - INTERVAL '5 days'),
('vis_005', 'customer', 'opportunity', 'referral', NULL, 1200000, NOW() - INTERVAL '15 days');
