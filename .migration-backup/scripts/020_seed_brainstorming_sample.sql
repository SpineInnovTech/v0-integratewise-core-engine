-- Sample brainstorming sessions
INSERT INTO brainstorm_sessions (title, description, session_type, context, key_insights, action_items, source, metadata) VALUES
('Template Forge AI Launch Strategy', 'Brainstormed go-to-market strategy for Template Forge AI product', 'product', 
'Discussion on positioning Template Forge AI as the premier MuleSoft template generator. Key points:
- Target audience: MuleSoft developers and architects
- Pricing: ₹8-25L based on enterprise size
- Launch timeline: Q1 2025
- Marketing channels: LinkedIn, MuleSoft community, corporate workshops
- Competitive advantage: AI-powered template generation vs manual coding',
ARRAY['Position as time-saving tool for MuleSoft teams', 'Create demo video showing 10x speed improvement', 'Partner with MuleSoft training providers'],
ARRAY['Create landing page for Template Forge AI', 'Record product demo video', 'Write launch blog post', 'Schedule LinkedIn campaign', 'Reach out to 5 potential beta customers'],
'manual',
'{"discussed_by": ["Nirmal Prince", "Team"], "duration_minutes": 90}'::jsonb),

('Customer Success Automation Best Practices', 'Session on creating comprehensive CS automation guide', 'marketing',
'Brainstormed ideas for the CS Automation Playbook:
- Map common CS workflows: onboarding, check-ins, renewals
- Tool stack: Salesforce, HubSpot, n8n, Zapier
- ROI calculation framework
- Implementation timeline templates
- Common pitfalls and solutions',
ARRAY['Create downloadable playbook as lead magnet', 'Build calculator tool for CS automation ROI', 'Develop case studies from existing clients'],
ARRAY['Write CS Automation Playbook (20 pages)', 'Build ROI calculator web tool', 'Create LinkedIn post series on CS automation', 'Reach out to 3 clients for case study participation'],
'manual',
'{"content_format": "ebook", "target_leads": 100}'::jsonb),

('Sales Pipeline Improvement Ideas', 'Discussed ways to improve sales conversion and pipeline velocity', 'sales',
'Analysis of current pipeline bottlenecks:
- Discovery to proposal: 45 days average (target: 30 days)
- Proposal to negotiation: 60 days (target: 45 days)
- Key insight: Need better qualification criteria
- Solution: Create discovery session framework with clear go/no-go criteria
- Implement automated follow-up sequences',
ARRAY['Shorten sales cycle by 20 days', 'Improve qualification with scoring matrix', 'Automate follow-ups to reduce manual work'],
ARRAY['Create discovery session template', 'Build lead scoring matrix', 'Setup email automation for follow-ups', 'Update CRM with new pipeline stages'],
'manual',
'{"current_cycle_days": 105, "target_cycle_days": 75}'::jsonb);

-- Sample AI-generated insights
INSERT INTO brainstorm_insights (session_id, insight_type, title, content, priority, status, confidence_score, metadata) VALUES
((SELECT id FROM brainstorm_sessions WHERE title = 'Template Forge AI Launch Strategy'), 'task', 
'Create Template Forge AI Landing Page', 
'Build a dedicated landing page for Template Forge AI with demo video, pricing tiers, and lead capture form. Include testimonials from beta users and comparison with manual template creation.',
'high', 'pending', 0.92,
'{"estimated_hours": 8, "assignee": "Nirmal Prince", "due_date": "2025-01-15"}'::jsonb),

((SELECT id FROM brainstorm_sessions WHERE title = 'Template Forge AI Launch Strategy'), 'blog_post',
'Introducing Template Forge AI: 10x Faster MuleSoft Development',
'Blog post announcing Template Forge AI launch. Cover: problem (slow manual template creation), solution (AI-powered generation), benefits (10x speed, consistency, best practices), pricing, and call-to-action for demo.',
'high', 'pending', 0.88,
'{"target_platform": "website,linkedin", "target_length": 1200, "target_date": "2025-01-10"}'::jsonb),

((SELECT id FROM brainstorm_sessions WHERE title = 'Template Forge AI Launch Strategy'), 'linkedin_post',
'Template Forge AI Launch Announcement',
'LinkedIn post: "After 3 years of MuleSoft consulting and seeing teams spend weeks creating templates, I built Template Forge AI. It generates production-ready MuleSoft templates in minutes. Early access opening Jan 15. DM for demo."',
'high', 'pending', 0.90,
'{"post_type": "announcement", "target_engagement": 500, "includes_demo_link": true}'::jsonb),

((SELECT id FROM brainstorm_sessions WHERE title = 'Customer Success Automation Best Practices'), 'knowledge_article',
'Complete CS Automation Playbook',
'Comprehensive guide covering: CS workflow mapping, tool selection, implementation roadmap, ROI calculations, and 10 ready-to-use automation templates. Include case studies from InsurePro and TechCorp implementations.',
'medium', 'pending', 0.85,
'{"document_category": "marketing", "lead_magnet": true, "estimated_leads": 150}'::jsonb),

((SELECT id FROM brainstorm_sessions WHERE title = 'Sales Pipeline Improvement Ideas'), 'task',
'Build Lead Scoring Matrix',
'Create a lead scoring system based on: company size (0-25 pts), budget authority (0-20 pts), timeline urgency (0-20 pts), fit with services (0-20 pts), engagement level (0-15 pts). Total score 0-100. Threshold: 60+ = qualified.',
'urgent', 'pending', 0.95,
'{"estimated_hours": 4, "assignee": "Nirmal Prince", "due_date": "2024-12-20"}'::jsonb);

-- Sample daily insight
INSERT INTO daily_insights (insight_date, summary, key_actions, metrics_snapshot, brainstorm_count, tasks_created, content_generated) VALUES
(CURRENT_DATE, 
'Strong momentum on Template Forge AI launch preparation. 3 brainstorming sessions completed with 8 actionable insights generated. Key priority: Complete landing page and demo video by Jan 15. Sales pipeline improvement framework in progress.',
ARRAY[
  'Complete Template Forge AI landing page (Priority: High)',
  'Record product demo video showing 10x speed improvement',
  'Publish CS Automation Playbook as lead magnet',
  'Implement lead scoring matrix in CRM',
  'Schedule LinkedIn launch campaign'
],
'{"mrr": 600000, "pipeline_value": 4500000, "active_leads": 28, "active_projects": 3}'::jsonb,
3, 8, 5);
