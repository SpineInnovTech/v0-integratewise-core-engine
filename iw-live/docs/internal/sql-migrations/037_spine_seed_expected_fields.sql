-- Migration: 037_spine_seed_expected_fields.sql
-- Description: Seed expected fields for completeness scoring
-- Created: 2026-02-08
-- =============================================================================

-- =============================================================================
-- L1: Universal entities (foundational)
-- =============================================================================

-- L1: Accounts
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('account', 1,
  '["id", "name", "created_at"]'::jsonb,
  '["id", "name", "domain", "industry", "employee_count", "arr", "mrr", "region", "segment", "status", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L1: Contacts
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('contact', 1,
  '["id", "email", "created_at"]'::jsonb,
  '["id", "email", "first_name", "last_name", "title", "account_id", "phone", "linkedin_url", "status", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L1: Users
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('user', 1,
  '["id", "email", "created_at"]'::jsonb,
  '["id", "email", "name", "role", "department", "status", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- =============================================================================
-- L2: Department-specific entities (contextual)
-- =============================================================================

-- L2: Opportunities (Sales)
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('opportunity', 2,
  '["id", "name", "account_id", "stage", "created_at"]'::jsonb,
  '["id", "name", "account_id", "amount", "currency", "stage", "probability", "close_date", "owner_id", "source", "type", "forecast_category", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L2: Success Plans (CSM)
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('success_plan', 2,
  '["id", "account_id", "created_at"]'::jsonb,
  '["id", "account_id", "health_score", "sentiment", "renewal_date", "renewal_amount", "csm_id", "objectives", "risks", "milestones", "last_reviewed_at", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L2: Campaigns (Marketing)
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('campaign', 2,
  '["id", "name", "created_at"]'::jsonb,
  '["id", "name", "type", "status", "budget", "actual_cost", "start_date", "end_date", "owner_id", "channel", "target_audience", "metrics", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L2: Contracts (Finance)
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('contract', 2,
  '["id", "account_id", "created_at"]'::jsonb,
  '["id", "account_id", "contract_number", "value", "currency", "start_date", "end_date", "status", "type", "payment_terms", "auto_renew", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L2: Invoices (Finance)
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('invoice', 2,
  '["id", "account_id", "amount", "created_at"]'::jsonb,
  '["id", "account_id", "invoice_number", "amount", "currency", "status", "due_date", "paid_date", "payment_method", "line_items", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L2: Support Tickets
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('ticket', 2,
  '["id", "account_id", "subject", "created_at"]'::jsonb,
  '["id", "account_id", "contact_id", "subject", "description", "status", "priority", "severity", "category", "assigned_to", "resolved_at", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- =============================================================================
-- L3: Interaction-level entities (operational)
-- =============================================================================

-- L3: Engagements
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('engagement', 3,
  '["id", "account_id", "created_at"]'::jsonb,
  '["id", "account_id", "contact_id", "user_id", "type", "channel", "subject", "sentiment", "direction", "duration", "timestamp", "created_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L3: Activities
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('activity', 3,
  '["id", "type", "created_at"]'::jsonb,
  '["id", "account_id", "contact_id", "user_id", "type", "subject", "description", "status", "due_date", "completed_at", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L3: Tasks
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('task', 3,
  '["id", "title", "created_at"]'::jsonb,
  '["id", "title", "description", "status", "priority", "assigned_to", "due_date", "completed_at", "related_to_type", "related_to_id", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- L3: Notes
INSERT INTO spine_expected_fields (entity_type, layer_level, required_fields, expected_fields) VALUES
('note', 3,
  '["id", "content", "created_at"]'::jsonb,
  '["id", "content", "author_id", "related_to_type", "related_to_id", "visibility", "tags", "created_at", "updated_at"]'::jsonb
) ON CONFLICT (entity_type, layer_level) DO UPDATE SET
  required_fields = EXCLUDED.required_fields,
  expected_fields = EXCLUDED.expected_fields;

-- Verify insertion
SELECT
  entity_type,
  layer_level,
  jsonb_array_length(required_fields) as required_count,
  jsonb_array_length(expected_fields) as expected_count
FROM spine_expected_fields
ORDER BY layer_level, entity_type;
