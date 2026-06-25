-- Migration: 036_spine_seed_streams.sql
-- Description: Seed department/stream definitions
-- Created: 2026-02-08
-- =============================================================================

-- Seed core department streams (org_id = 00000000... is system default)
INSERT INTO spine_streams (id, tenant_id, stream_key, display_name, description, category, scope) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'sales', 'Sales', 'Sales pipeline, opportunities, and revenue', 'business', '{"visibility": "org"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'csm', 'Customer Success', 'Customer health, engagement, and renewals', 'business', '{"visibility": "org"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'tam', 'Technical Account Management', 'Technical support, escalations, and solutions', 'business', '{"visibility": "org"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'marketing', 'Marketing', 'Campaigns, content, and lead generation', 'business', '{"visibility": "org"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'finance', 'Finance', 'Invoices, contracts, billing, and revenue operations', 'business', '{"visibility": "org"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'ops', 'Operations', 'Processes, initiatives, and operational efficiency', 'business', '{"visibility": "org"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'engineering', 'Engineering', 'Technical delivery and platform operations', 'team', '{"visibility": "team"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'product', 'Product', 'Product management and roadmap', 'team', '{"visibility": "team"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'support', 'Support', 'Customer support tickets and resolutions', 'business', '{"visibility": "org"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'partnerships', 'Partnerships', 'Channel partners and alliances', 'business', '{"visibility": "org"}'::jsonb)
ON CONFLICT (tenant_id, stream_key) DO NOTHING;

-- Verify insertion
SELECT
  stream_key,
  display_name,
  category,
  scope->>'visibility' as visibility
FROM spine_streams
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
ORDER BY stream_key;
