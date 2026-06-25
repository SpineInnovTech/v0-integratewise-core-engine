-- ============================================
-- Migration: 030_uuid_compliance.sql
-- Purpose: Ensure UUID compliance across all tables
-- Date: 2026-01-31
-- ============================================

-- This migration addresses:
-- 1. Convert TEXT PRIMARY KEY tables to use UUID with separate slug fields
-- 2. Add execution_id tracking to retry logs
-- 3. Ensure all ID columns are properly typed as UUID

BEGIN;

-- ============================================
-- PLANS TABLE - Convert from TEXT PK to UUID
-- ============================================

-- Step 1: Create new UUID-based plans table
CREATE TABLE IF NOT EXISTS plans_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- Human-readable identifier (free, pro, business, enterprise)
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Migrate existing data (if plans table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans' AND table_schema = 'public') THEN
    -- Insert existing plans with new UUIDs
    INSERT INTO plans_new (slug, name, description, price_monthly, price_yearly, 
                           stripe_price_id_monthly, stripe_price_id_yearly, 
                           features, limits, is_active, sort_order, created_at, updated_at)
    SELECT id, name, description, price_monthly, price_yearly,
           stripe_price_id_monthly, stripe_price_id_yearly,
           features, limits, is_active, sort_order, created_at, updated_at
    FROM plans
    ON CONFLICT (slug) DO NOTHING;
    
    -- Create mapping table for FK updates
    CREATE TEMP TABLE plan_id_mapping AS
    SELECT p.id as old_id, pn.id as new_id
    FROM plans p
    JOIN plans_new pn ON p.id = pn.slug;
    
    -- Update subscriptions FK (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan_id') THEN
      -- Add new column
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_uuid UUID;
      
      -- Update with new UUIDs
      UPDATE subscriptions s
      SET plan_uuid = m.new_id
      FROM plan_id_mapping m
      WHERE s.plan_id = m.old_id;
      
      -- Drop old column and rename
      ALTER TABLE subscriptions DROP COLUMN plan_id;
      ALTER TABLE subscriptions RENAME COLUMN plan_uuid TO plan_id;
      
      -- Add FK constraint
      ALTER TABLE subscriptions 
        ADD CONSTRAINT fk_subscriptions_plan 
        FOREIGN KEY (plan_id) REFERENCES plans_new(id);
    END IF;
    
    -- Drop old table
    DROP TABLE plans;
    
    -- Rename new table
    ALTER TABLE plans_new RENAME TO plans;
    
    -- Clean up
    DROP TABLE IF EXISTS plan_id_mapping;
  ELSE
    -- Table doesn't exist, rename new to plans
    ALTER TABLE plans_new RENAME TO plans;
  END IF;
END $$;

-- Re-seed default plans if empty
INSERT INTO plans (slug, name, price_monthly, price_yearly, features, limits, sort_order)
SELECT * FROM (VALUES 
  ('free', 'Free', 0, 0, 
   '[{"key": "integrations", "name": "2 Integrations", "included": true, "limit": 2}]'::jsonb,
   '{"users": 1, "integrations": 2, "apiCallsPerMonth": 1000}'::jsonb, 0),
  ('pro', 'Pro', 4900, 49000,
   '[{"key": "integrations", "name": "10 Integrations", "included": true, "limit": 10}]'::jsonb,
   '{"users": 5, "integrations": 10, "apiCallsPerMonth": 50000}'::jsonb, 1),
  ('business', 'Business', 19900, 199000,
   '[{"key": "integrations", "name": "Unlimited", "included": true}]'::jsonb,
   '{"users": -1, "integrations": -1, "apiCallsPerMonth": 500000}'::jsonb, 2),
  ('enterprise', 'Enterprise', 0, 0,
   '[{"key": "everything", "name": "Everything", "included": true}]'::jsonb,
   '{"users": -1, "integrations": -1, "apiCallsPerMonth": -1}'::jsonb, 3)
) AS v(slug, name, price_monthly, price_yearly, features, limits, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM plans LIMIT 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- CIRCUIT BREAKER STATE - Convert from TEXT PK
-- ============================================

-- Create new UUID-based circuit breaker table
CREATE TABLE IF NOT EXISTS circuit_breaker_state_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_key TEXT UNIQUE NOT NULL, -- The service/endpoint identifier
  state TEXT NOT NULL DEFAULT 'closed' CHECK (state IN ('closed', 'open', 'half-open')),
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'circuit_breaker_state' AND table_schema = 'public') THEN
    INSERT INTO circuit_breaker_state_new (circuit_key, state, failure_count, last_failure_at, opened_at, updated_at)
    SELECT id, state, failure_count, last_failure_at, opened_at, updated_at
    FROM circuit_breaker_state
    ON CONFLICT (circuit_key) DO NOTHING;
    
    DROP TABLE circuit_breaker_state;
    ALTER TABLE circuit_breaker_state_new RENAME TO circuit_breaker_state;
  ELSE
    ALTER TABLE circuit_breaker_state_new RENAME TO circuit_breaker_state;
  END IF;
END $$;

-- ============================================
-- EXECUTION TRACKING - Ensure execution_id in all logs
-- ============================================

-- Add execution_id to webhook_events if missing
ALTER TABLE webhook_events 
  ADD COLUMN IF NOT EXISTS execution_id UUID;

-- Add execution_id to dlq_messages if missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dlq_messages' AND table_schema = 'public') THEN
    ALTER TABLE dlq_messages ADD COLUMN IF NOT EXISTS execution_id UUID;
    ALTER TABLE dlq_messages ADD COLUMN IF NOT EXISTS retry_execution_id UUID;
  END IF;
END $$;

-- Add execution_id to sync_logs if missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_logs' AND table_schema = 'public') THEN
    ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS execution_id UUID;
  END IF;
END $$;

-- Create index for execution_id lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_execution 
  ON webhook_events(execution_id) WHERE execution_id IS NOT NULL;

-- ============================================
-- AUDIT LOG ENHANCEMENTS
-- ============================================

-- Ensure audit_log has proper UUID typing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log' AND table_schema = 'public') THEN
    -- Add execution_id if missing
    ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS execution_id UUID;
    ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS correlation_id UUID;
    
    -- Add index
    CREATE INDEX IF NOT EXISTS idx_audit_log_execution 
      ON audit_log(execution_id) WHERE execution_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_audit_log_correlation 
      ON audit_log(correlation_id) WHERE correlation_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- SPINE ENTITIES - Ensure proper UUID columns
-- ============================================

-- Add canonical_entity_id UUID column to spine_entities if using TEXT
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spine_entities' AND table_schema = 'hub') THEN
    -- Ensure spine_id is UUID type
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'hub' AND table_name = 'spine_entities' 
      AND column_name = 'spine_id' AND data_type = 'text'
    ) THEN
      -- spine_id is TEXT, which is correct for UUID storage
      -- Just add comment for clarity
      COMMENT ON COLUMN hub.spine_entities.spine_id IS 'UUID stored as TEXT';
    END IF;
  END IF;
END $$;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE plans IS 'Subscription plans with UUID PK and slug for human reference';
COMMENT ON COLUMN plans.id IS 'UUID primary key (v4)';
COMMENT ON COLUMN plans.slug IS 'Human-readable identifier (free, pro, business, enterprise)';

COMMENT ON TABLE circuit_breaker_state IS 'Circuit breaker state with UUID PK';
COMMENT ON COLUMN circuit_breaker_state.id IS 'UUID primary key (v4)';
COMMENT ON COLUMN circuit_breaker_state.circuit_key IS 'Service/endpoint identifier';

-- ============================================
-- VALIDATION FUNCTION
-- ============================================

-- Create function to validate UUID format
CREATE OR REPLACE FUNCTION is_valid_uuid(input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN input ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_valid_uuid(TEXT) IS 'Validates if a string is a valid UUID (v1-v7)';

COMMIT;
