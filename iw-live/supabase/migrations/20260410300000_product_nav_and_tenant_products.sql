-- =============================================================================
-- 072_product_nav_and_tenant_products.sql
-- Product-scoped navigation + tenant product assignments
--
-- Creates:
--   1. public.tenant_products       — which products each tenant has access to
--   2. public.product_nav_items     — sidebar nav items per product
--   3. Backfill: every tenant gets default work + personal product
--   4. Seed: nav items for all 20 products
--   5. RPCs: get_tenant_products(), get_product_nav_items()
--
-- Navigation model:
--   - A tenant sees 1 work product + 1 personal product (not all 20)
--   - The sidebar shows views within that product
--   - Product assignment determines what the user sees
--   - Default: OpsCore (work) + LifeOps (personal) — most comprehensive
--
-- Domain-to-product defaults (for future use):
--   CUSTOMER_SUCCESS → success_pilot
--   SALES            → growth_desk
--   MARKETING        → growth_desk
--   REVOPS           → growth_desk
--   BIZOPS           → ops_core
--   PRODUCT_ENG      → ops_core
--   FINANCE          → fin_pulse
--   SERVICE          → success_pilot
--   IT_ADMIN         → ops_core
--   PROCUREMENT      → vendor_guard
--   STUDENT_TEACHER  → learning_desk
--   PERSONAL         → life_ops
-- =============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: Tenant Product Assignments
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tenant_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES public.product_catalog(product_id) ON DELETE CASCADE,
  surface     TEXT NOT NULL,  -- account_success | business_ops | personal_space
  is_default  BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON public.tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_surface ON public.tenant_products(tenant_id, surface);

ALTER TABLE public.tenant_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tp_select" ON public.tenant_products;
CREATE POLICY "tp_select" ON public.tenant_products
  FOR SELECT TO authenticated USING (tenant_id = get_tenant_id());
DROP POLICY IF EXISTS "tp_service" ON public.tenant_products;
CREATE POLICY "tp_service" ON public.tenant_products
  FOR ALL TO service_role USING (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: Product Navigation Items
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_nav_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  TEXT NOT NULL REFERENCES public.product_catalog(product_id) ON DELETE CASCADE,
  view_id     TEXT NOT NULL,       -- matches content-router moduleId
  label       TEXT NOT NULL,       -- display text in sidebar
  icon        TEXT NOT NULL,       -- icon name (resolved via ICON_MAP)
  section     TEXT NOT NULL,       -- grouping header
  sort_order  INT DEFAULT 0,       -- order within section
  path        TEXT NOT NULL,       -- route path (e.g., /work/dashboard)
  UNIQUE(product_id, view_id)
);

CREATE INDEX IF NOT EXISTS idx_product_nav_product ON public.product_nav_items(product_id);

ALTER TABLE public.product_nav_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nav_read" ON public.product_nav_items;
CREATE POLICY "nav_read" ON public.product_nav_items
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "nav_service" ON public.product_nav_items;
CREATE POLICY "nav_service" ON public.product_nav_items
  FOR ALL TO service_role USING (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: Backfill — Assign default products to all tenants
-- ═══════════════════════════════════════════════════════════════════════════
-- Every tenant gets: ops_core (work) + life_ops (personal)
-- These are the most comprehensive products per surface.
-- Can be changed later per-tenant when they onboard or purchase.

INSERT INTO public.tenant_products (tenant_id, product_id, surface, is_default)
SELECT t.id, 'ops_core', 'business_ops', true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_products tp
  WHERE tp.tenant_id = t.id AND tp.surface IN ('account_success', 'business_ops')
)
ON CONFLICT DO NOTHING;

INSERT INTO public.tenant_products (tenant_id, product_id, surface, is_default)
SELECT t.id, 'life_ops', 'personal_space', true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_products tp
  WHERE tp.tenant_id = t.id AND tp.surface = 'personal_space'
)
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: Seed Nav Items for All 20 Products
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ACCOUNT SUCCESS SURFACE ─────────────────────────────────────────────

-- 1. DataSentinel (No Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('data_sentinel', 'data-sentinel',  'DataSentinel',  'Shield',         'Overview',  1, '/work/data-sentinel'),
  ('data_sentinel', 'analytics',      'Analytics',     'BarChart3',      'Overview',  2, '/work/analytics'),
  ('data_sentinel', 'fabric-admin',   'Fabric Admin',  'Settings',       'System',   90, '/work/fabric-admin'),
  ('data_sentinel', 'settings',       'Settings',      'Cog',            'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 2. VaultGuard (No Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('vault_guard', 'vault-guard',    'VaultGuard',    'FileText',       'Overview',  1, '/work/vault-guard'),
  ('vault_guard', 'docs',           'Documents',     'FileText',       'Overview',  2, '/work/docs'),
  ('vault_guard', 'fabric-admin',   'Fabric Admin',  'Settings',       'System',   90, '/work/fabric-admin'),
  ('vault_guard', 'settings',       'Settings',      'Cog',            'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 3. ArchitectIQ (No Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('architect_iq', 'architect-iq',   'ArchitectIQ',   'Plug',           'Overview',  1, '/work/architect-iq'),
  ('architect_iq', 'integrations',   'Integrations',  'Plug',           'Connect',   2, '/work/integrations'),
  ('architect_iq', 'analytics',      'Analytics',     'BarChart3',      'Overview',  3, '/work/analytics'),
  ('architect_iq', 'fabric-admin',   'Fabric Admin',  'Settings',       'System',   90, '/work/fabric-admin'),
  ('architect_iq', 'settings',       'Settings',      'Cog',            'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 4. TemplateForge (No Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('template_forge', 'template-forge', 'TemplateForge', 'FileText',       'Overview',    1, '/work/template-forge'),
  ('template_forge', 'workflows',      'Workflows',     'Repeat',         'Automation',  2, '/work/workflows'),
  ('template_forge', 'tasks',          'Tasks',         'CheckSquare',    'Automation',  3, '/work/tasks'),
  ('template_forge', 'fabric-admin',   'Fabric Admin',  'Settings',       'System',     90, '/work/fabric-admin'),
  ('template_forge', 'settings',       'Settings',      'Cog',            'System',     91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 5. SuccessPilot (Basic Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('success_pilot', 'csm-hub',       'Accounts Hub',  'Building2',      'Core',         1, '/work/csm-hub'),
  ('success_pilot', 'contacts',      'Contacts',      'Users',          'Core',         2, '/work/contacts'),
  ('success_pilot', 'meetings',      'Meetings',      'Calendar',       'Core',         3, '/work/meetings'),
  ('success_pilot', 'tasks',         'Tasks',         'CheckSquare',    'Core',         4, '/work/tasks'),
  ('success_pilot', 'risks',         'Risks',         'AlertTriangle',  'Intelligence', 5, '/work/risks'),
  ('success_pilot', 'expansion',     'Expansion',     'TrendingUp',     'Intelligence', 6, '/work/expansion'),
  ('success_pilot', 'analytics',     'Analytics',     'BarChart3',      'Intelligence', 7, '/work/analytics'),
  ('success_pilot', 'workflows',     'Workflows',     'Repeat',         'Automation',   8, '/work/workflows'),
  ('success_pilot', 'integrations',  'Integrations',  'Plug',           'Connect',      9, '/work/integrations'),
  ('success_pilot', 'fabric-admin',  'Fabric Admin',  'Settings',       'System',      90, '/work/fabric-admin'),
  ('success_pilot', 'settings',      'Settings',      'Cog',            'System',      91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 6. DealDesk (Basic Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('deal_desk', 'deal-desk',      'DealDesk',      'Handshake',      'Core',         1, '/work/deal-desk'),
  ('deal_desk', 'contacts',       'Contacts',      'Users',          'Core',         2, '/work/contacts'),
  ('deal_desk', 'expansion',      'Expansion',     'TrendingUp',     'Intelligence', 3, '/work/expansion'),
  ('deal_desk', 'analytics',      'Analytics',     'BarChart3',      'Intelligence', 4, '/work/analytics'),
  ('deal_desk', 'fabric-admin',   'Fabric Admin',  'Settings',       'System',      90, '/work/fabric-admin'),
  ('deal_desk', 'settings',       'Settings',      'Cog',            'System',      91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 7. ChurnShield (Full Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('churn_shield', 'intelligence-center', 'Intelligence Center', 'Shield',         'Core',         1, '/work/intelligence-center'),
  ('churn_shield', 'csm-hub',            'Accounts',            'Building2',      'Core',         2, '/work/csm-hub'),
  ('churn_shield', 'contacts',           'Contacts',            'Users',          'Core',         3, '/work/contacts'),
  ('churn_shield', 'risks',              'Risks',               'AlertTriangle',  'Intelligence', 4, '/work/risks'),
  ('churn_shield', 'analytics',          'Analytics',           'BarChart3',      'Intelligence', 5, '/work/analytics'),
  ('churn_shield', 'integrations',       'Integrations',        'Plug',           'Connect',      6, '/work/integrations'),
  ('churn_shield', 'fabric-admin',       'Fabric Admin',        'Settings',       'System',      90, '/work/fabric-admin'),
  ('churn_shield', 'settings',           'Settings',            'Cog',            'System',      91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 8. SuccessCommand (Full Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('success_command', 'strategic-success',  'Strategic View',  'Target',         'Core',         1, '/work/strategic-success'),
  ('success_command', 'csm-hub',            'Accounts Hub',    'Building2',      'Core',         2, '/work/csm-hub'),
  ('success_command', 'contacts',           'Contacts',        'Users',          'Core',         3, '/work/contacts'),
  ('success_command', 'meetings',           'Meetings',        'Calendar',       'Engagement',   4, '/work/meetings'),
  ('success_command', 'risks',              'Risks',           'AlertTriangle',  'Intelligence', 5, '/work/risks'),
  ('success_command', 'expansion',          'Expansion',       'TrendingUp',     'Intelligence', 6, '/work/expansion'),
  ('success_command', 'analytics',          'Analytics',       'BarChart3',      'Intelligence', 7, '/work/analytics'),
  ('success_command', 'workflows',          'Workflows',       'Repeat',         'Automation',   8, '/work/workflows'),
  ('success_command', 'integrations',       'Integrations',    'Plug',           'Connect',      9, '/work/integrations'),
  ('success_command', 'fabric-admin',       'Fabric Admin',    'Settings',       'System',      90, '/work/fabric-admin'),
  ('success_command', 'settings',           'Settings',        'Cog',            'System',      91, '/work/settings')
ON CONFLICT DO NOTHING;


-- ─── BUSINESS OPS SURFACE ────────────────────────────────────────────────

-- 9. ComplianceVault (No Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('compliance_vault', 'compliance-vault', 'ComplianceVault', 'Shield',    'Overview',  1, '/work/compliance-vault'),
  ('compliance_vault', 'docs',             'Documents',       'FileText',  'Overview',  2, '/work/docs'),
  ('compliance_vault', 'fabric-admin',     'Fabric Admin',    'Settings',  'System',   90, '/work/fabric-admin'),
  ('compliance_vault', 'settings',         'Settings',        'Cog',       'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 10. VendorGuard (No Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('vendor_guard', 'vendor-guard',   'VendorGuard',   'Building',   'Overview',  1, '/work/vendor-guard'),
  ('vendor_guard', 'accounts',       'Vendors',       'Building2',  'Overview',  2, '/work/accounts'),
  ('vendor_guard', 'docs',           'Contracts',     'FileText',   'Overview',  3, '/work/docs'),
  ('vendor_guard', 'fabric-admin',   'Fabric Admin',  'Settings',   'System',   90, '/work/fabric-admin'),
  ('vendor_guard', 'settings',       'Settings',      'Cog',        'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 11. PartnerBridge (No Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('partner_bridge', 'partner-bridge', 'PartnerBridge', 'Users',     'Overview',  1, '/work/partner-bridge'),
  ('partner_bridge', 'contacts',       'Partners',      'Users',     'Overview',  2, '/work/contacts'),
  ('partner_bridge', 'analytics',      'Analytics',     'BarChart3', 'Overview',  3, '/work/analytics'),
  ('partner_bridge', 'fabric-admin',   'Fabric Admin',  'Settings',  'System',   90, '/work/fabric-admin'),
  ('partner_bridge', 'settings',       'Settings',      'Cog',       'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 12. GrowthDesk (Basic Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('growth_desk', 'growth-desk',   'GrowthDesk',    'TrendingUp',     'Core',         1, '/work/growth-desk'),
  ('growth_desk', 'accounts',      'Accounts',      'Building2',      'Core',         2, '/work/accounts'),
  ('growth_desk', 'contacts',      'Contacts',      'Users',          'Core',         3, '/work/contacts'),
  ('growth_desk', 'analytics',     'Analytics',     'BarChart3',      'Intelligence', 4, '/work/analytics'),
  ('growth_desk', 'tasks',         'Tasks',         'CheckSquare',    'Operations',   5, '/work/tasks'),
  ('growth_desk', 'integrations',  'Integrations',  'Plug',           'Connect',      6, '/work/integrations'),
  ('growth_desk', 'fabric-admin',  'Fabric Admin',  'Settings',       'System',      90, '/work/fabric-admin'),
  ('growth_desk', 'settings',      'Settings',      'Cog',            'System',      91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 13. HirePilot (Basic Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('hire_pilot', 'hire-pilot',    'HirePilot',     'Users',          'Core',        1, '/work/hire-pilot'),
  ('hire_pilot', 'tasks',         'Tasks',         'CheckSquare',    'Core',        2, '/work/tasks'),
  ('hire_pilot', 'analytics',     'Analytics',     'BarChart3',      'Intelligence',3, '/work/analytics'),
  ('hire_pilot', 'fabric-admin',  'Fabric Admin',  'Settings',       'System',     90, '/work/fabric-admin'),
  ('hire_pilot', 'settings',      'Settings',      'Cog',            'System',     91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 14. FinPulse (Full Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('fin_pulse', 'fin-pulse',          'FinPulse Overview', 'DollarSign',   'Core',      1, '/work/fin-pulse'),
  ('fin_pulse', 'revenue',            'Revenue',           'TrendingUp',   'Core',      2, '/work/revenue'),
  ('fin_pulse', 'expenses',           'Expenses',          'CreditCard',   'Core',      3, '/work/expenses'),
  ('fin_pulse', 'invoices',           'Invoices',          'FileText',     'Core',      4, '/work/invoices'),
  ('fin_pulse', 'invoice-approvals',  'Approvals',         'CheckCircle',  'Core',      5, '/work/invoice-approvals'),
  ('fin_pulse', 'budget',             'Budget',            'Calculator',   'Planning',  6, '/work/budget'),
  ('fin_pulse', 'forecasting',        'Forecasting',       'TrendingUp',   'Planning',  7, '/work/forecasting'),
  ('fin_pulse', 'reports',            'Reports',           'FileBarChart', 'Planning',  8, '/work/reports'),
  ('fin_pulse', 'analytics',          'Analytics',         'BarChart3',    'Intelligence', 9, '/work/analytics'),
  ('fin_pulse', 'finance-today',      'Finance Today',     'Sun',          'AI Assistant', 80, '/work/finance-today'),
  ('fin_pulse', 'finance-queue',      'Finance Queue',     'List',         'AI Assistant', 81, '/work/finance-queue'),
  ('fin_pulse', 'finance-decisions',  'Finance Decisions', 'Brain',        'AI Assistant', 82, '/work/finance-decisions'),
  ('fin_pulse', 'fabric-admin',       'Fabric Admin',      'Settings',     'System',      90, '/work/fabric-admin'),
  ('fin_pulse', 'settings',           'Settings',          'Cog',          'System',      91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 15. OpsCore (Full Twin — the most comprehensive)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('ops_core', 'dashboard',           'Dashboard',          'LayoutDashboard', 'Core',       1, '/work/dashboard'),
  ('ops_core', 'ops-command-center',  'Command Center',     'Radar',           'Core',       2, '/work/ops-command-center'),
  ('ops_core', 'founder-ops',         'Founder View',       'Briefcase',       'Executive',  3, '/work/founder-ops'),
  ('ops_core', 'ceo-dashboard',       'CEO Dashboard',      'TrendingUp',      'Executive',  4, '/work/ceo-dashboard'),
  ('ops_core', 'coo-dashboard',       'COO Dashboard',      'Activity',        'Executive',  5, '/work/coo-dashboard'),
  ('ops_core', 'cio-cto-dashboard',   'CIO/CTO Dashboard',  'Code',           'Executive',  6, '/work/cio-cto-dashboard'),
  ('ops_core', 'accounts',            'Accounts',           'Building2',       'Workspace',  7, '/work/accounts'),
  ('ops_core', 'tasks',               'Tasks',              'CheckSquare',     'Workspace',  8, '/work/tasks'),
  ('ops_core', 'docs',                'Documents',          'FileText',        'Workspace',  9, '/work/docs'),
  ('ops_core', 'projects',            'Projects',           'Folder',          'Workspace', 10, '/work/projects'),
  ('ops_core', 'workflows',           'Workflows',          'GitBranch',       'Workspace', 11, '/work/workflows'),
  ('ops_core', 'analytics',           'Analytics',          'BarChart3',       'Intelligence', 12, '/work/analytics'),
  ('ops_core', 'calendar',            'Calendar',           'Calendar',        'Utilities', 13, '/work/calendar'),
  ('ops_core', 'integrations',        'Integrations',       'Plug',            'Utilities', 14, '/work/integrations'),
  ('ops_core', 'workflow-canvas',     'Workflow Canvas',    'PenTool',         'Utilities', 15, '/work/workflow-canvas'),
  ('ops_core', 'bizops-today',        'Ops Today',          'Sun',             'AI Assistant', 80, '/work/bizops-today'),
  ('ops_core', 'bizops-queue',        'Ops Queue',          'List',            'AI Assistant', 81, '/work/bizops-queue'),
  ('ops_core', 'bizops-decisions',    'Ops Decisions',      'Brain',           'AI Assistant', 82, '/work/bizops-decisions'),
  ('ops_core', 'fabric-admin',        'Fabric Admin',       'Settings',        'System',      90, '/work/fabric-admin'),
  ('ops_core', 'settings',            'Settings',           'Cog',             'System',      91, '/work/settings')
ON CONFLICT DO NOTHING;


-- ─── PERSONAL SPACE SURFACE ──────────────────────────────────────────────

-- 16. WealthPilot (No Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('wealth_pilot', 'wealth-pilot',   'WealthPilot',   'DollarSign',  'Overview',  1, '/personal/wealth-pilot'),
  ('wealth_pilot', 'tasks',          'Tasks',         'CheckSquare', 'Personal',  2, '/personal/tasks'),
  ('wealth_pilot', 'bookmarks',      'Bookmarks',     'Bookmark',    'Personal',  3, '/personal/bookmarks'),
  ('wealth_pilot', 'fabric-admin',   'Fabric Admin',  'Settings',    'System',   90, '/work/fabric-admin'),
  ('wealth_pilot', 'settings',       'Settings',      'Cog',         'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 17. WellnessCore (No Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('wellness_core', 'wellness-core',  'WellnessCore',  'Heart',       'Overview',  1, '/personal/wellness-core'),
  ('wellness_core', 'tasks',          'Tasks',         'CheckSquare', 'Personal',  2, '/personal/tasks'),
  ('wellness_core', 'calendar',       'Calendar',      'Calendar',    'Personal',  3, '/personal/calendar'),
  ('wellness_core', 'fabric-admin',   'Fabric Admin',  'Settings',    'System',   90, '/work/fabric-admin'),
  ('wellness_core', 'settings',       'Settings',      'Cog',         'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 18. LearningDesk (Basic Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('learning_desk', 'learning-desk', 'LearningDesk',  'BookOpen',    'Core',      1, '/personal/learning-desk'),
  ('learning_desk', 'tasks',         'Tasks',         'CheckSquare', 'Personal',  2, '/personal/tasks'),
  ('learning_desk', 'notes',         'Notes',         'FileText',    'Personal',  3, '/personal/notes'),
  ('learning_desk', 'bookmarks',     'Bookmarks',     'Bookmark',    'Resources', 4, '/personal/bookmarks'),
  ('learning_desk', 'fabric-admin',  'Fabric Admin',  'Settings',    'System',   90, '/work/fabric-admin'),
  ('learning_desk', 'settings',      'Settings',      'Cog',         'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 19. RelationshipMap (Basic Twin)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('relationship_map', 'relationship-map', 'RelationshipMap', 'Users',      'Core',      1, '/personal/relationship-map'),
  ('relationship_map', 'tasks',            'Tasks',           'CheckSquare','Personal',  2, '/personal/tasks'),
  ('relationship_map', 'calendar',         'Calendar',        'Calendar',   'Personal',  3, '/personal/calendar'),
  ('relationship_map', 'notes',            'Notes',           'FileText',   'Personal',  4, '/personal/notes'),
  ('relationship_map', 'bookmarks',        'Bookmarks',       'Bookmark',   'Resources', 5, '/personal/bookmarks'),
  ('relationship_map', 'fabric-admin',     'Fabric Admin',    'Settings',   'System',   90, '/work/fabric-admin'),
  ('relationship_map', 'settings',         'Settings',        'Cog',        'System',   91, '/work/settings')
ON CONFLICT DO NOTHING;

-- 20. LifeOps (Full Twin — the most comprehensive personal product)
INSERT INTO public.product_nav_items (product_id, view_id, label, icon, section, sort_order, path) VALUES
  ('life_ops', 'dashboard',          'Dashboard',         'LayoutDashboard', 'Personal',   1, '/personal/dashboard'),
  ('life_ops', 'hub-home',           'Hub Home',          'Home',            'Personal',   2, '/personal/hub-home'),
  ('life_ops', 'hub-today',          'Today',             'Sun',             'Personal',   3, '/personal/hub-today'),
  ('life_ops', 'tasks',              'Tasks',             'CheckSquare',     'Personal',   4, '/personal/tasks'),
  ('life_ops', 'calendar',           'Calendar',          'Calendar',        'Personal',   5, '/personal/calendar'),
  ('life_ops', 'notes',              'Notes',             'FileText',        'Personal',   6, '/personal/notes'),
  ('life_ops', 'projects',           'Projects',          'Folder',          'Personal',   7, '/personal/projects'),
  ('life_ops', 'bookmarks',          'Bookmarks',         'Bookmark',        'Personal',   8, '/personal/bookmarks'),
  ('life_ops', 'knowledge-hub',      'Knowledge Hub',     'BookOpen',        'Knowledge',  9, '/personal/knowledge-hub'),
  ('life_ops', 'founder-today',      'Founder Today',     'Briefcase',       'Knowledge', 10, '/personal/founder-today'),
  ('life_ops', 'founder-projects',   'Decisions Queue',   'Folder',          'Knowledge', 11, '/personal/founder-projects'),
  ('life_ops', 'founder-decisions',  'Decision Log',      'FileCheck',       'Knowledge', 12, '/personal/founder-decisions'),
  ('life_ops', 'whats-new',          'What''s New',       'Package',         'Knowledge', 13, '/personal/whats-new'),
  ('life_ops', 'fabric-admin',       'Fabric Admin',      'Settings',        'System',    90, '/work/fabric-admin'),
  ('life_ops', 'settings',           'Settings',          'Cog',             'System',    91, '/work/settings')
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 5: RPCs
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- 5.1 get_tenant_products() — Returns the current tenant's assigned products
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_tenant_products()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'product_id',    tp.product_id,
      'surface',       tp.surface,
      'is_default',    tp.is_default,
      'display_name',  pc.display_name,
      'twin_tier',     pc.twin_tier,
      'description',   pc.description,
      'assigned_at',   tp.assigned_at
    ) ORDER BY pc.sort_order
  ), '[]'::jsonb)
  FROM public.tenant_products tp
  JOIN public.product_catalog pc ON pc.product_id = tp.product_id
  WHERE tp.tenant_id = get_tenant_id();
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_products() TO authenticated;


-- ---------------------------------------------------------------------------
-- 5.2 get_product_nav_items(product_id) — Returns nav items for a product
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_product_nav_items(p_product_id TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'view_id',    view_id,
      'label',      label,
      'icon',       icon,
      'section',    section,
      'sort_order', sort_order,
      'path',       path
    ) ORDER BY sort_order, view_id
  ), '[]'::jsonb)
  FROM public.product_nav_items
  WHERE product_id = p_product_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_nav_items(TEXT) TO authenticated;


COMMIT;
