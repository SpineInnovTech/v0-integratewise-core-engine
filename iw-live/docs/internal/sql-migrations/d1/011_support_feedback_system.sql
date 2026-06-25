-- D1 parity for support, enquiries, and feedback intake

ALTER TABLE newsletter_subscribers ADD COLUMN source_surface TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN metadata TEXT DEFAULT '{}';
ALTER TABLE newsletter_subscribers ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));

ALTER TABLE contact_submissions ADD COLUMN tenant_id TEXT;
ALTER TABLE contact_submissions ADD COLUMN user_id TEXT;
ALTER TABLE contact_submissions ADD COLUMN request_kind TEXT DEFAULT 'general_contact';
ALTER TABLE contact_submissions ADD COLUMN source_surface TEXT DEFAULT 'marketing_contact';
ALTER TABLE contact_submissions ADD COLUMN priority TEXT DEFAULT 'normal';
ALTER TABLE contact_submissions ADD COLUMN severity TEXT DEFAULT 'medium';
ALTER TABLE contact_submissions ADD COLUMN owner TEXT;
ALTER TABLE contact_submissions ADD COLUMN external_system TEXT;
ALTER TABLE contact_submissions ADD COLUMN external_ticket_id TEXT;
ALTER TABLE contact_submissions ADD COLUMN external_status TEXT DEFAULT 'pending_config';
ALTER TABLE contact_submissions ADD COLUMN sync_error TEXT;
ALTER TABLE contact_submissions ADD COLUMN metadata TEXT DEFAULT '{}';

ALTER TABLE support_tickets ADD COLUMN user_id TEXT;
ALTER TABLE support_tickets ADD COLUMN request_kind TEXT DEFAULT 'support_ticket';
ALTER TABLE support_tickets ADD COLUMN severity TEXT DEFAULT 'medium';
ALTER TABLE support_tickets ADD COLUMN source_surface TEXT DEFAULT 'in_app_help_widget';
ALTER TABLE support_tickets ADD COLUMN owner TEXT;
ALTER TABLE support_tickets ADD COLUMN external_system TEXT;
ALTER TABLE support_tickets ADD COLUMN external_ticket_id TEXT;
ALTER TABLE support_tickets ADD COLUMN external_status TEXT DEFAULT 'pending_config';
ALTER TABLE support_tickets ADD COLUMN sync_error TEXT;
ALTER TABLE support_tickets ADD COLUMN metadata TEXT DEFAULT '{}';

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
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
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_tenant ON feedback_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_request_kind ON feedback_submissions(request_kind);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_status ON feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_created_at ON feedback_submissions(created_at DESC);
