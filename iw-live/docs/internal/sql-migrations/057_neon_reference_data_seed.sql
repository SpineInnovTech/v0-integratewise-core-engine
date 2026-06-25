-- Migration: 057_neon_reference_data_seed.sql
-- Description: Seed reference data exported from Neon Data-Spine (hub schema) for Neon → Supabase migration step 4.
-- Run AFTER 056 and after public.tenants exists. Ensure auth.users exist for user_roles.user_id if you use them.
-- Source: Neon MCP run_sql on project jolly-hall-21143893 (March 2026).
-- Created: 2026-03

-- =============================================================================
-- TENANTS (map to public.tenants: id, name, slug, plan, settings, created_at, updated_at)
-- =============================================================================
INSERT INTO tenants (id, name, slug, plan, settings, created_at, updated_at)
VALUES (
  '8095631a-a17a-4994-accb-16462f912a94',
  'IntegrateWise',
  'integratewise',
  'org',
  '{}'::jsonb,
  '2025-12-06 16:17:03.194+00',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  plan = EXCLUDED.plan,
  updated_at = NOW();

-- =============================================================================
-- ROLES (031_rbac_system: id, tenant_id, name, description, permissions, is_system_role, created_at, updated_at)
-- Neon hub.roles had: id, tenant_id, key, name. We map key→name and set permissions from hub.role_permissions.
-- =============================================================================
INSERT INTO roles (id, tenant_id, name, description, permissions, is_system_role, created_at, updated_at)
VALUES
  ('fabf6d9b-c914-4271-85dd-0b0b6cebeda5', '8095631a-a17a-4994-accb-16462f912a94', 'Admin', 'Admin role', ARRAY['task.read']::text[], false, NOW(), NOW()),
  ('d01444da-e0fb-4b08-9118-26a8e5442800', '8095631a-a17a-4994-accb-16462f912a94', 'Ops Manager', 'Ops Manager role', '{}'::text[], false, NOW(), NOW()),
  ('84494b5a-fcd0-4691-abb3-effed099d97c', '8095631a-a17a-4994-accb-16462f912a94', 'Project Lead', 'Project Lead role', '{}'::text[], false, NOW(), NOW()),
  ('01b8ddc2-daea-46b7-aee4-a7f5384a8a31', '8095631a-a17a-4994-accb-16462f912a94', 'Viewer', 'Viewer role', '{}'::text[], false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- =============================================================================
-- USER_ROLES (031: user_id, role_id, assigned_by, assigned_at)
-- Neon: user_id 193f5b6e... → Admin role; 27e71214... → (viewer role if needed; currently one user_roles row)
-- Ensure auth.users (or profiles) have these user IDs before inserting, or skip.
-- =============================================================================
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES ('193f5b6e-6167-4c66-b3e7-ef5d6165ee2f', 'fabf6d9b-c914-4271-85dd-0b0b6cebeda5', NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;
