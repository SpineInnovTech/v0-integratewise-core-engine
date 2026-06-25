-- Migration: 0005_spine_schema_dimensions
-- Spine schema growth — identity-specific dimensions (Role × Department × Industry).
-- Additive, auditable growth (spine-hydration-lifecycle R2.1/R2.6). Cloudflare D1 only.
--
-- These columns let tenant_spine_config hold the FULL Spine_Schema the gateway
-- resolver produces, not just domains + allowed_entity_types:
--   signal_types          — which signals this identity cares about
--   memory_categories     — identity-specific memory categories (Phase 5 targets)
--   connector_priorities  — ordered providers to hydrate first (Creamy bias)
--   governance_defaults   — per-identity promotion approval policy (Phase 5 / R11)
--   twin_context          — role/department/industry the Twin reasons within

ALTER TABLE tenant_spine_config ADD COLUMN signal_types TEXT DEFAULT '[]';
ALTER TABLE tenant_spine_config ADD COLUMN memory_categories TEXT DEFAULT '[]';
ALTER TABLE tenant_spine_config ADD COLUMN connector_priorities TEXT DEFAULT '[]';
ALTER TABLE tenant_spine_config ADD COLUMN governance_defaults TEXT DEFAULT '{}';
ALTER TABLE tenant_spine_config ADD COLUMN twin_context TEXT DEFAULT '{}';

-- department: the precise identity signal the gateway reads/writes (workspace
-- profile + spine-config + AppShell context restore). Confirmed absent on the
-- live spine-cache DB, so this ADD COLUMN is safe and required for the deployed
-- gateway to function.
ALTER TABLE tenant_spine_config ADD COLUMN department TEXT;
