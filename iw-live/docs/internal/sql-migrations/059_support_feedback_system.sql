-- Support, enquiries, and feedback system hardening
-- Canonical v1 intake model for public contact/newsletter + authenticated support/feedback

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT DEFAULT 'website',
  source_surface TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS source_surface TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at DESC);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  inquiry_type TEXT DEFAULT 'general_contact',
  request_kind TEXT DEFAULT 'general_contact',
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_surface TEXT DEFAULT 'marketing_contact',
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  severity TEXT DEFAULT 'medium',
  owner TEXT,
  external_system TEXT,
  external_ticket_id TEXT,
  external_status TEXT DEFAULT 'pending_config',
  sync_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS inquiry_type TEXT DEFAULT 'general_contact';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS request_kind TEXT DEFAULT 'general_contact';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS source_surface TEXT DEFAULT 'marketing_contact';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS external_system TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS external_ticket_id TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS external_status TEXT DEFAULT 'pending_config';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON contact_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_request_kind ON contact_submissions(request_kind);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_external_status ON contact_submissions(external_status);

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS request_kind TEXT DEFAULT 'support_ticket';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS source_surface TEXT DEFAULT 'in_app_help_widget';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS external_system TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS external_ticket_id TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS external_status TEXT DEFAULT 'pending_config';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

UPDATE support_tickets
SET
  request_kind = COALESCE(NULLIF(request_kind, ''), COALESCE(category, 'support_ticket')),
  priority = COALESCE(NULLIF(priority, ''), COALESCE(urgency, 'normal')),
  severity = COALESCE(NULLIF(severity, ''), COALESCE(urgency, 'medium')),
  source_surface = COALESCE(NULLIF(source_surface, ''), 'in_app_help_widget'),
  external_status = COALESCE(NULLIF(external_status, ''), 'pending_config')
WHERE
  request_kind IS NULL
  OR priority IS NULL
  OR severity IS NULL
  OR source_surface IS NULL
  OR external_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_external_status ON support_tickets(external_status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_source_surface ON support_tickets(source_surface);

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT,
  name TEXT,
  request_kind TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT,
  score INTEGER,
  source_surface TEXT DEFAULT 'in_app_help_widget',
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  severity TEXT DEFAULT 'medium',
  owner TEXT,
  external_system TEXT,
  external_ticket_id TEXT,
  external_status TEXT DEFAULT 'not_required',
  sync_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_tenant ON feedback_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_request_kind ON feedback_submissions(request_kind);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_status ON feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_external_status ON feedback_submissions(external_status);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_created_at ON feedback_submissions(created_at DESC);
