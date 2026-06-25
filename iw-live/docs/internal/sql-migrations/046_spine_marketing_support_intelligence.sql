-- Migration: 046_spine_marketing_support_intelligence.sql
-- Description: Marketing Intelligence + Support Intelligence spine schema expansion
-- Created: 2026-03-11
-- =============================================================================

-- =============================================================================
-- MARKETING INTELLIGENCE (12 new tables — campaigns & content already in 032)
-- =============================================================================

-- =============================================================================
-- 1. LEAD ATTRIBUTION
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_lead_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'lead_attribution',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'revops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { lead_id, lead_name, lead_email, lead_source, channel, campaign_id, campaign_name, attribution_model, first_touch_date, last_touch_date, conversion_date, touches_count, time_to_conversion_days, lead_score, lead_status, mql_date, sql_date, opportunity_id, attributed_revenue, cost_per_lead, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_lead_attribution_tenant ON spine_lead_attribution(tenant_id);
CREATE INDEX idx_spine_lead_attribution_email ON spine_lead_attribution(((data->>'lead_email')));
CREATE INDEX idx_spine_lead_attribution_source ON spine_lead_attribution(((data->>'lead_source')));
CREATE INDEX idx_spine_lead_attribution_status ON spine_lead_attribution(((data->>'lead_status')));
CREATE INDEX idx_spine_lead_attribution_campaign ON spine_lead_attribution(((data->>'campaign_id')));

-- =============================================================================
-- 2. EMAIL CAMPAIGNS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'email_campaign',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { campaign_name, subject_line, from_name, from_email, status, send_date, list_id, list_name, total_sent, delivered, bounced, bounce_rate, opened, open_rate, clicked, click_rate, unsubscribed, unsubscribe_rate, spam_complaints, revenue_attributed, a_b_variant, winner_variant, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_email_campaigns_tenant ON spine_email_campaigns(tenant_id);
CREATE INDEX idx_spine_email_campaigns_status ON spine_email_campaigns(((data->>'status')));
CREATE INDEX idx_spine_email_campaigns_send_date ON spine_email_campaigns(((data->>'send_date')));

-- =============================================================================
-- 3. SOCIAL CAMPAIGNS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_social_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'social_campaign',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { campaign_name, platform, post_type, status, publish_date, impressions, reach, engagement_count, engagement_rate, likes, comments, shares, clicks, click_through_rate, video_views, video_completion_rate, follower_change, cost, cost_per_engagement, revenue_attributed, content_url, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_social_campaigns_tenant ON spine_social_campaigns(tenant_id);
CREATE INDEX idx_spine_social_campaigns_platform ON spine_social_campaigns(((data->>'platform')));
CREATE INDEX idx_spine_social_campaigns_status ON spine_social_campaigns(((data->>'status')));

-- =============================================================================
-- 4. CONTENT ASSETS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_content_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'content_asset',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, content_type, format, author, status, publish_date, url, category, tags, word_count, views, unique_views, avg_time_on_page_seconds, bounce_rate, leads_generated, conversion_rate, seo_score, target_keyword, organic_traffic, backlinks, social_shares, last_updated }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_content_assets_tenant ON spine_content_assets(tenant_id);
CREATE INDEX idx_spine_content_assets_type ON spine_content_assets(((data->>'content_type')));
CREATE INDEX idx_spine_content_assets_status ON spine_content_assets(((data->>'status')));

-- =============================================================================
-- 5. LANDING PAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'landing_page',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { page_name, url, status, campaign_id, template, visitors, unique_visitors, form_submissions, conversion_rate, bounce_rate, avg_time_seconds, traffic_source_breakdown, a_b_variant, mobile_conversion_rate, desktop_conversion_rate, seo_title, meta_description, published_date, last_updated }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_landing_pages_tenant ON spine_landing_pages(tenant_id);
CREATE INDEX idx_spine_landing_pages_status ON spine_landing_pages(((data->>'status')));
CREATE INDEX idx_spine_landing_pages_campaign ON spine_landing_pages(((data->>'campaign_id')));

-- =============================================================================
-- 6. FORM SUBMISSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'form_submission',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { form_name, form_id, page_url, submitter_name, submitter_email, submitter_company, submission_data, lead_score, lead_status, campaign_id, utm_source, utm_medium, utm_campaign, conversion_type, follow_up_status, assigned_to, submitted_at, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_form_submissions_tenant ON spine_form_submissions(tenant_id);
CREATE INDEX idx_spine_form_submissions_email ON spine_form_submissions(((data->>'submitter_email')));
CREATE INDEX idx_spine_form_submissions_campaign ON spine_form_submissions(((data->>'campaign_id')));
CREATE INDEX idx_spine_form_submissions_status ON spine_form_submissions(((data->>'follow_up_status')));

-- =============================================================================
-- 7. WEBSITE ANALYTICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_website_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'website_analytics',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { period, period_type, sessions, unique_visitors, page_views, pages_per_session, avg_session_duration_seconds, bounce_rate, new_vs_returning_percent, top_pages, top_referrers, top_countries, device_breakdown, conversions, conversion_rate, goal_completions, revenue, traffic_source_breakdown, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_website_analytics_tenant ON spine_website_analytics(tenant_id);
CREATE INDEX idx_spine_website_analytics_period ON spine_website_analytics(((data->>'period')));
CREATE INDEX idx_spine_website_analytics_period_type ON spine_website_analytics(((data->>'period_type')));

-- =============================================================================
-- 8. SEO TRACKER
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_seo_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'seo_tracker',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { keyword, search_volume, current_position, previous_position, position_change, page_url, click_through_rate, impressions, clicks, domain_authority, page_authority, backlinks_count, competitor_positions, featured_snippet, target_position, difficulty_score, content_gap, last_checked }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_seo_tracker_tenant ON spine_seo_tracker(tenant_id);
CREATE INDEX idx_spine_seo_tracker_keyword ON spine_seo_tracker(((data->>'keyword')));
CREATE INDEX idx_spine_seo_tracker_position ON spine_seo_tracker(((data->>'current_position')));

-- =============================================================================
-- 9. AD SPEND
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_ad_spend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'ad_spend',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { platform, campaign_name, campaign_id, ad_group, ad_type, status, budget, spend, impressions, clicks, ctr, conversions, conversion_rate, cpc, cpm, cpa, roas, revenue_attributed, period, currency, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_ad_spend_tenant ON spine_ad_spend(tenant_id);
CREATE INDEX idx_spine_ad_spend_platform ON spine_ad_spend(((data->>'platform')));
CREATE INDEX idx_spine_ad_spend_campaign ON spine_ad_spend(((data->>'campaign_id')));
CREATE INDEX idx_spine_ad_spend_status ON spine_ad_spend(((data->>'status')));

-- =============================================================================
-- 10. AUDIENCE SEGMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_audience_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'audience_segment',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { segment_name, description, criteria, segment_type, size, growth_rate_percent, engagement_score, conversion_rate, avg_ltv, churn_rate, top_channels, overlap_segments, suppression_list, status, created_date, last_refreshed, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_audience_segments_tenant ON spine_audience_segments(tenant_id);
CREATE INDEX idx_spine_audience_segments_type ON spine_audience_segments(((data->>'segment_type')));
CREATE INDEX idx_spine_audience_segments_status ON spine_audience_segments(((data->>'status')));

-- =============================================================================
-- 11. FUNNEL STAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_funnel_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'funnel_stage',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'sales', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { funnel_name, stage_name, stage_order, stage_type, entries, exits, conversion_to_next, conversion_rate, avg_time_in_stage_days, drop_off_rate, value_at_stage, period, period_type, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_funnel_stages_tenant ON spine_funnel_stages(tenant_id);
CREATE INDEX idx_spine_funnel_stages_funnel ON spine_funnel_stages(((data->>'funnel_name')));
CREATE INDEX idx_spine_funnel_stages_order ON spine_funnel_stages(((data->>'stage_order')));

-- =============================================================================
-- 12. MARKETING METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_marketing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'marketing_metric',
    category VARCHAR(30) NOT NULL DEFAULT 'marketing' CHECK (
        category IN ('marketing', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { metric_category, metric_name, metric_type, current_value, target_value, previous_value, change_percent, threshold_warning, threshold_critical, unit, period, period_type, channel, campaign_id, trend_direction, health_status, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_marketing_metrics_tenant ON spine_marketing_metrics(tenant_id);
CREATE INDEX idx_spine_marketing_metrics_name ON spine_marketing_metrics(((data->>'metric_name')));
CREATE INDEX idx_spine_marketing_metrics_health ON spine_marketing_metrics(((data->>'health_status')));

-- =============================================================================
-- SUPPORT INTELLIGENCE (13 new tables)
-- =============================================================================

-- =============================================================================
-- 13. TICKETS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'ticket',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id, owner_id, team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { ticket_number, subject, description, status, priority, type, channel, requester_name, requester_email, assigned_agent, assigned_group, product_area, component, tags, sla_policy, first_response_due, first_response_at, resolution_due, resolved_at, closed_at, reply_count, reopen_count, escalated, satisfaction_rating, satisfaction_comment, related_tickets, external_ticket_id, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_tickets_tenant ON spine_tickets(tenant_id);
CREATE INDEX idx_spine_tickets_account ON spine_tickets((scope->>'account_id'));
CREATE INDEX idx_spine_tickets_status ON spine_tickets(((data->>'status')));
CREATE INDEX idx_spine_tickets_priority ON spine_tickets(((data->>'priority')));
CREATE INDEX idx_spine_tickets_assigned_agent ON spine_tickets(((data->>'assigned_agent')));
CREATE INDEX idx_spine_tickets_number ON spine_tickets(((data->>'ticket_number')));

-- =============================================================================
-- 14. SLA TRACKING
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'sla_tracker',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { ticket_id, sla_policy_name, metric_type, target_hours, actual_hours, breached, breach_amount_hours, business_hours_only, priority_override, pause_duration_hours, agent_id, escalation_triggered, status, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_sla_tracking_tenant ON spine_sla_tracking(tenant_id);
CREATE INDEX idx_spine_sla_tracking_account ON spine_sla_tracking((scope->>'account_id'));
CREATE INDEX idx_spine_sla_tracking_ticket ON spine_sla_tracking(((data->>'ticket_id')));
CREATE INDEX idx_spine_sla_tracking_breached ON spine_sla_tracking(((data->>'breached')));

-- =============================================================================
-- 15. KNOWLEDGE ARTICLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'knowledge_article',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, body_content, category, sub_category, tags, author, status, language, view_count, helpful_count, not_helpful_count, helpfulness_ratio, linked_tickets, last_used_in_ticket, version, published_date, review_due_date, external_article_id }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_knowledge_articles_tenant ON spine_knowledge_articles(tenant_id);
CREATE INDEX idx_spine_knowledge_articles_status ON spine_knowledge_articles(((data->>'status')));
CREATE INDEX idx_spine_knowledge_articles_category ON spine_knowledge_articles(((data->>'category')));

-- =============================================================================
-- 16. CSAT SURVEYS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_csat_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'csat_survey',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { ticket_id, agent_id, rating, comment, survey_type, nps_score, response_date, sent_date, channel, product_area, resolution_time_hours, first_contact_resolution, follow_up_required }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_csat_surveys_tenant ON spine_csat_surveys(tenant_id);
CREATE INDEX idx_spine_csat_surveys_account ON spine_csat_surveys((scope->>'account_id'));
CREATE INDEX idx_spine_csat_surveys_rating ON spine_csat_surveys(((data->>'rating')));
CREATE INDEX idx_spine_csat_surveys_ticket ON spine_csat_surveys(((data->>'ticket_id')));

-- =============================================================================
-- 17. AGENT PERFORMANCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_agent_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'agent_performance',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { agent_name, email, team, role, tickets_assigned, tickets_resolved, avg_resolution_time_hours, avg_first_response_time_hours, csat_average, sla_compliance_percent, reopen_rate_percent, first_contact_resolution_rate, escalation_rate, tickets_per_day_avg, current_backlog, utilization_percent, quality_score, period_start, period_end }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_agent_performance_tenant ON spine_agent_performance(tenant_id);
CREATE INDEX idx_spine_agent_performance_email ON spine_agent_performance(((data->>'email')));
CREATE INDEX idx_spine_agent_performance_team ON spine_agent_performance(((data->>'team')));

-- =============================================================================
-- 18. ESCALATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'escalation',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { ticket_id, from_agent, to_agent, from_group, to_group, escalation_reason, escalation_level, priority_at_escalation, time_before_escalation_hours, resolution_after_escalation_hours, outcome, escalated_at, resolved_at }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_escalations_tenant ON spine_escalations(tenant_id);
CREATE INDEX idx_spine_escalations_account ON spine_escalations((scope->>'account_id'));
CREATE INDEX idx_spine_escalations_ticket ON spine_escalations(((data->>'ticket_id')));
CREATE INDEX idx_spine_escalations_level ON spine_escalations(((data->>'escalation_level')));

-- =============================================================================
-- 19. QUEUE MANAGEMENT
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_queue_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'queue',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { queue_name, description, team, priority_filter, channel_filter, auto_assignment_enabled, round_robin, skill_based_routing, current_size, avg_wait_time_minutes, longest_wait_minutes, agents_online, capacity_percent }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_queue_management_tenant ON spine_queue_management(tenant_id);
CREATE INDEX idx_spine_queue_management_name ON spine_queue_management(((data->>'queue_name')));
CREATE INDEX idx_spine_queue_management_team ON spine_queue_management(((data->>'team')));

-- =============================================================================
-- 20. BUG REPORTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'bug_report',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { ticket_id, title, description, severity, component, steps_to_reproduce, expected_behavior, actual_behavior, environment, browser_os, assigned_developer, status, fix_version, workaround, reported_date, resolved_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_bug_reports_tenant ON spine_bug_reports(tenant_id);
CREATE INDEX idx_spine_bug_reports_account ON spine_bug_reports((scope->>'account_id'));
CREATE INDEX idx_spine_bug_reports_severity ON spine_bug_reports(((data->>'severity')));
CREATE INDEX idx_spine_bug_reports_status ON spine_bug_reports(((data->>'status')));
CREATE INDEX idx_spine_bug_reports_component ON spine_bug_reports(((data->>'component')));

-- =============================================================================
-- 21. FEATURE REQUESTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'feature_request',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'product', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { requester_name, title, description, use_case, business_impact, priority, status, votes, arr_requesting_accounts, product_area, target_release, assigned_pm, submission_date, decision_date, ship_date, decline_reason }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_feature_requests_tenant ON spine_feature_requests(tenant_id);
CREATE INDEX idx_spine_feature_requests_account ON spine_feature_requests((scope->>'account_id'));
CREATE INDEX idx_spine_feature_requests_status ON spine_feature_requests(((data->>'status')));
CREATE INDEX idx_spine_feature_requests_priority ON spine_feature_requests(((data->>'priority')));
CREATE INDEX idx_spine_feature_requests_product_area ON spine_feature_requests(((data->>'product_area')));

-- =============================================================================
-- 22. RESOLUTION LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_resolution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'resolution',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { ticket_id, agent_id, resolution_type, resolution_notes, root_cause_category, time_to_resolution_hours, first_contact_resolution, customer_effort_score, knowledge_article_used, knowledge_article_created, resolved_at, verified_by_customer }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_resolution_log_tenant ON spine_resolution_log(tenant_id);
CREATE INDEX idx_spine_resolution_log_account ON spine_resolution_log((scope->>'account_id'));
CREATE INDEX idx_spine_resolution_log_ticket ON spine_resolution_log(((data->>'ticket_id')));
CREATE INDEX idx_spine_resolution_log_root_cause ON spine_resolution_log(((data->>'root_cause_category')));

-- =============================================================================
-- 23. SUPPORT METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_support_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'support_metric',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { period, period_type, total_tickets, open_tickets, avg_resolution_hours, avg_first_response_hours, sla_compliance_percent, csat_score, nps_score, first_contact_resolution_percent, reopen_rate, escalation_rate, backlog_size, ticket_volume_trend, top_category, health_status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_support_metrics_tenant ON spine_support_metrics(tenant_id);
CREATE INDEX idx_spine_support_metrics_account ON spine_support_metrics((scope->>'account_id'));
CREATE INDEX idx_spine_support_metrics_period ON spine_support_metrics(((data->>'period')));
CREATE INDEX idx_spine_support_metrics_health ON spine_support_metrics(((data->>'health_status')));

-- =============================================================================
-- 24. CUSTOMER FEEDBACK
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_customer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'customer_feedback',
    category VARCHAR(30) NOT NULL DEFAULT 'support' CHECK (
        category IN ('support', 'csm', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { contact_name, contact_email, feedback_type, channel, subject, content, sentiment, urgency, assigned_to, status, received_date, resolved_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_customer_feedback_tenant ON spine_customer_feedback(tenant_id);
CREATE INDEX idx_spine_customer_feedback_account ON spine_customer_feedback((scope->>'account_id'));
CREATE INDEX idx_spine_customer_feedback_sentiment ON spine_customer_feedback(((data->>'sentiment')));
CREATE INDEX idx_spine_customer_feedback_status ON spine_customer_feedback(((data->>'status')));
CREATE INDEX idx_spine_customer_feedback_type ON spine_customer_feedback(((data->>'feedback_type')));

-- =============================================================================
-- 25. SEED SUPPORT STREAM (if not already present)
-- =============================================================================
INSERT INTO spine_streams (id, tenant_id, stream_key, display_name, description, category, scope) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'support', 'Support', 'Customer support tickets and resolutions', 'business', '{"visibility": "org"}'::jsonb)
ON CONFLICT (tenant_id, stream_key) DO NOTHING;

-- =============================================================================
-- 26. EXTEND UNIVERSAL ENTITY VIEW
-- =============================================================================
CREATE OR REPLACE VIEW v_spine_entities AS
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_tasks
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_accounts
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_meetings
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_projects
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_objectives
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_documents
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_contacts
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, created_at AS updated_at
FROM spine_events
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_opportunities
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_renewals
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_risks
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_incidents
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_changes
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_campaigns
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_content
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_invoices
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_expenses
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_approvals
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_contracts
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_vendors
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_requests
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_people
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_business_context
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_strategic_objectives
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_capabilities
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_value_streams
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_api_portfolio
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_platform_metrics
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_initiatives
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_technical_debt
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_stakeholder_outcomes
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_engagements
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_success_plans
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_insights
UNION ALL
-- Marketing Intelligence tables
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_lead_attribution
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_email_campaigns
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_social_campaigns
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_content_assets
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_landing_pages
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_form_submissions
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_website_analytics
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_seo_tracker
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_ad_spend
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_audience_segments
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_funnel_stages
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_marketing_metrics
UNION ALL
-- Support Intelligence tables
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_tickets
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_sla_tracking
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_knowledge_articles
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_csat_surveys
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_agent_performance
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_escalations
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_queue_management
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_bug_reports
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_feature_requests
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_resolution_log
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_support_metrics
UNION ALL
SELECT id, tenant_id, entity_type, category, scope, data, relationships, created_at, updated_at
FROM spine_customer_feedback;

-- =============================================================================
-- END
-- =============================================================================
