-- ============================================
-- IntegrateWise Hub Controller - Webhook Tables
-- Migration: 003_webhooks.sql
-- Created: 2024-12-12
-- ============================================

-- Webhook events tracking table
-- Stores all incoming webhook events for audit and processing
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  headers TEXT,
  signature_valid INTEGER DEFAULT 1,
  processed INTEGER DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT
);

-- Indexes for webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Webhook provider configurations
-- Stores settings for each webhook provider
CREATE TABLE IF NOT EXISTS webhook_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  enabled INTEGER DEFAULT 1,
  endpoint TEXT NOT NULL,
  auth_type TEXT NOT NULL,
  description TEXT,
  webhook_url TEXT,
  last_event_at TEXT,
  event_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed provider configurations
INSERT OR IGNORE INTO webhook_providers (id, name, endpoint, auth_type, description) VALUES
  ('wp_hubspot', 'hubspot', '/webhooks/hubspot', 'hmac-sha256', 'HubSpot CRM - contacts, deals, forms, meetings'),
  ('wp_salesforce', 'salesforce', '/webhooks/salesforce', 'outbound-message', 'Salesforce CRM - leads, opportunities, accounts'),
  ('wp_pipedrive', 'pipedrive', '/webhooks/pipedrive', 'basic-auth', 'Pipedrive - deals, persons, organizations'),
  ('wp_linkedin', 'linkedin', '/webhooks/linkedin', 'oauth2', 'LinkedIn - lead gen forms, ad conversions'),
  ('wp_canva', 'canva', '/webhooks/canva', 'hmac-sha256', 'Canva - design exports, brand kit updates'),
  ('wp_google_ads', 'google_ads', '/webhooks/google-ads', 'oauth2', 'Google Ads - conversions, lead forms'),
  ('wp_meta', 'meta', '/webhooks/meta', 'verify-token', 'Meta/Facebook - lead ads, page events'),
  ('wp_whatsapp', 'whatsapp', '/webhooks/whatsapp', 'verify-token', 'WhatsApp Business - messages, status updates'),
  ('wp_razorpay', 'razorpay', '/webhooks/razorpay', 'hmac-sha256', 'Razorpay - payments, refunds'),
  ('wp_stripe', 'stripe', '/webhooks/stripe', 'hmac-sha256', 'Stripe - payments, subscriptions'),
  ('wp_github', 'github', '/webhooks/github', 'hmac-sha256', 'GitHub - push, PR, issues'),
  ('wp_vercel', 'vercel', '/webhooks/vercel', 'hmac-sha1', 'Vercel - deployments'),
  ('wp_todoist', 'todoist', '/webhooks/todoist', 'none', 'Todoist - tasks'),
  ('wp_notion', 'notion', '/webhooks/notion', 'none', 'Notion - pages, databases'),
  ('wp_coda', 'coda', '/webhooks/coda', 'api-token', 'Coda - docs, tables'),
  ('wp_slack', 'slack', '/webhooks/slack', 'signing-secret', 'Slack - messages, events'),
  ('wp_linear', 'linear', '/webhooks/linear', 'hmac-sha256', 'Linear - issues, projects'),
  ('wp_shopify', 'shopify', '/webhooks/shopify', 'hmac-sha256', 'Shopify - orders, products');

-- Webhook subscriptions (for outbound webhooks)
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  events TEXT NOT NULL, -- JSON array of event types
  secret TEXT,
  active INTEGER DEFAULT 1,
  last_triggered_at TEXT,
  failure_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- Summary:
-- - webhook_events: Incoming webhook event log
-- - webhook_providers: Provider configuration
-- - webhook_subscriptions: Outbound webhook config
-- ============================================
