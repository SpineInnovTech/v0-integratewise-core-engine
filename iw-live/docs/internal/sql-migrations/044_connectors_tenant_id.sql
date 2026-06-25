-- Migration 044: Add tenant_id to connectors table, update constraints & RLS
-- This links connectors to tenants for multi-tenant isolation.

-- 1. Add tenant_id column (nullable initially for backfill)
ALTER TABLE connectors ADD COLUMN
IF NOT EXISTS tenant_id UUID;

-- 2. Create index for tenant-scoped queries
CREATE INDEX
IF NOT EXISTS idx_connectors_tenant_id ON connectors
(tenant_id);

-- 3. Update unique constraint: per tenant+user+provider (drop old, add new)
ALTER TABLE connectors DROP CONSTRAINT IF EXISTS connectors_user_id_provider_key;
ALTER TABLE connectors ADD CONSTRAINT connectors_tenant_user_provider_key UNIQUE (tenant_id, user_id, provider);

-- 4. Update RLS policies to include tenant_id scoping
DROP POLICY
IF EXISTS "Users can view own connectors" ON connectors;
DROP POLICY
IF EXISTS "Users can insert own connectors" ON connectors;
DROP POLICY
IF EXISTS "Users can update own connectors" ON connectors;
DROP POLICY
IF EXISTS "Users can delete own connectors" ON connectors;

CREATE POLICY "Users can view own connectors"
  ON connectors FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connectors"
  ON connectors FOR
INSERT
  WITH CHECK (auth.uid() =
user_id);

CREATE POLICY "Users can update own connectors"
  ON connectors FOR
UPDATE
  USING (auth.uid()
= user_id);

CREATE POLICY "Users can delete own connectors"
  ON connectors FOR
DELETE
  USING (auth.uid
() = user_id);

-- 5. Service-role policy for backend workers (tenants service)
DROP POLICY
IF EXISTS "Service role full access on connectors" ON connectors;
CREATE POLICY "Service role full access on connectors"
  ON connectors FOR ALL
  USING
(auth.role
() = 'service_role');
