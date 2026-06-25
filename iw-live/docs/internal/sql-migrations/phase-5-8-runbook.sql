-- ============================================================================
-- PHASE 5–8 RUNBOOK: Hub Data Migration → Cutover → Enforce → Branching
-- ============================================================================
-- Source: Hub production (Neon, schema = public)
-- Destination: SSOT Data-Spine (Neon, schema = hub)
-- Connection strings are placeholders — replace before running.
-- ============================================================================

-- ============================================================================
-- PHASE 5: DATA MIGRATION
-- ============================================================================

-- ─── 5.0  PRE-FLIGHT: Capture source rowcounts ─────────────────────────────
-- Run this AGAINST THE SOURCE (Hub production) to establish baseline.

-- >>> CONNECT TO: Hub production <<<

SELECT 'tenants' AS tbl, count(*) FROM tenants
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'roles', count(*) FROM roles
UNION ALL SELECT 'permissions', count(*) FROM permissions
UNION ALL SELECT 'role_permissions', count(*) FROM role_permissions
UNION ALL SELECT 'user_roles', count(*) FROM user_roles
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'apps', count(*) FROM apps
UNION ALL SELECT 'credentials', count(*) FROM credentials
UNION ALL SELECT 'documents', count(*) FROM documents
UNION ALL SELECT 'files', count(*) FROM files
UNION ALL SELECT 'file_versions', count(*) FROM file_versions
UNION ALL SELECT 'file_bindings', count(*) FROM file_bindings
UNION ALL SELECT 'doc_links', count(*) FROM doc_links
UNION ALL SELECT 'navigation_items', count(*) FROM navigation_items
UNION ALL SELECT 'notebooks', count(*) FROM notebooks
UNION ALL SELECT 'tasks', count(*) FROM tasks
UNION ALL SELECT 'ui_modals', count(*) FROM ui_modals
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
UNION ALL SELECT 'events', count(*) FROM events
UNION ALL SELECT 'signals', count(*) FROM signals
UNION ALL SELECT 'situations', count(*) FROM situations
UNION ALL SELECT 'evidence_refs', count(*) FROM evidence_refs
UNION ALL SELECT 'ai_sessions', count(*) FROM ai_sessions
UNION ALL SELECT 'ai_session_memories', count(*) FROM ai_session_memories
UNION ALL SELECT 'agent_decisions', count(*) FROM agent_decisions
UNION ALL SELECT 'action_proposals', count(*) FROM action_proposals
UNION ALL SELECT 'file_embeddings', count(*) FROM file_embeddings
UNION ALL SELECT 'playing_with_neon', count(*) FROM playing_with_neon
ORDER BY 1;


-- ─── 5.1  DATA MIGRATION via pg_dump / pg_restore ──────────────────────────
-- Run from your local terminal (NOT inside psql).
--
-- Step 1: Dump data-only from Hub production (public schema).
--         Use --column-inserts so we can remap schema easily.
--
-- IMPORTANT: Replace <HUB_CONN> and <SSOT_CONN> with actual connection strings.
--
-- HUB_CONN="postgresql://neondb_owner:npg_lPt4jLcO5dei@ep-broad-waterfall-ahejsgy6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
-- SSOT_CONN="postgresql://neondb_owner:npg_Ra0dYcHujOv9@ep-plain-bird-abh7vpm0-pooler.eu-west-2.aws.neon.tech/Spine?sslmode=require"

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  SHELL COMMANDS — Run these in your terminal, NOT in psql              │
-- └──────────────────────────────────────────────────────────────────────────┘

/*
# ── Variables ──
export HUB_CONN="<your Hub production connection string>"
export SSOT_CONN="<your SSOT Neon Spine connection string>"

# ── Step 1: Dump all 29 tables, data-only, column inserts ──
pg_dump "$HUB_CONN" \
  --data-only \
  --column-inserts \
  --no-owner \
  --no-privileges \
  --schema=public \
  --table=tenants \
  --table=users \
  --table=roles \
  --table=permissions \
  --table=role_permissions \
  --table=user_roles \
  --table=projects \
  --table=apps \
  --table=credentials \
  --table=documents \
  --table=files \
  --table=file_versions \
  --table=file_bindings \
  --table=doc_links \
  --table=navigation_items \
  --table=notebooks \
  --table=tasks \
  --table=ui_modals \
  --table=audit_logs \
  --table=events \
  --table=signals \
  --table=situations \
  --table=evidence_refs \
  --table=ai_sessions \
  --table=ai_session_memories \
  --table=agent_decisions \
  --table=action_proposals \
  --table=file_embeddings \
  --table=playing_with_neon \
  -f hub_data_dump.sql

# ── Step 2: Rewrite schema from public → hub ──
sed -i.bak 's/INSERT INTO public\./INSERT INTO hub./g' hub_data_dump.sql

# ── Step 3: Disable FK checks during load, then restore ──
psql "$SSOT_CONN" <<'LOAD_EOF'
SET session_replication_role = 'replica';  -- disables FK triggers
\i hub_data_dump.sql
SET session_replication_role = 'origin';   -- re-enables FK triggers
LOAD_EOF
*/


-- ─── 5.2  ALTERNATIVE: Per-table COPY approach (faster, more control) ──────
-- If pg_dump is blocked by Neon pooler, use dblink or per-table export/import.
-- Export from Hub:
--   \copy (SELECT * FROM tenants) TO 'tenants.csv' WITH CSV HEADER
-- Import to SSOT:
--   \copy hub.tenants FROM 'tenants.csv' WITH CSV HEADER

/*
# ── Per-table export (run against Hub) ──
TABLES="tenants users roles permissions role_permissions user_roles projects apps credentials documents files file_versions file_bindings doc_links navigation_items notebooks tasks ui_modals audit_logs events signals situations evidence_refs ai_sessions ai_session_memories agent_decisions action_proposals file_embeddings playing_with_neon"

for t in $TABLES; do
  echo "Exporting $t..."
  psql "$HUB_CONN" -c "\copy (SELECT * FROM $t) TO '${t}.csv' WITH CSV HEADER"
done

# ── Per-table import (run against SSOT) ──
# IMPORTANT: Load in dependency order. Parents first.
ORDERED="tenants users roles permissions role_permissions user_roles projects apps credentials documents files file_versions file_bindings doc_links navigation_items notebooks tasks ui_modals audit_logs events signals situations evidence_refs ai_sessions ai_session_memories agent_decisions action_proposals file_embeddings playing_with_neon"

psql "$SSOT_CONN" -c "SET session_replication_role = 'replica';"

for t in $ORDERED; do
  echo "Importing hub.$t..."
  psql "$SSOT_CONN" -c "\copy hub.$t FROM '${t}.csv' WITH CSV HEADER"
done

psql "$SSOT_CONN" -c "SET session_replication_role = 'origin';"
*/


-- ─── 5.3  POST-LOAD: Reset sequences ───────────────────────────────────────
-- Run AGAINST SSOT after data is loaded.

-- >>> CONNECT TO: SSOT <<<

DO $$
DECLARE
  r RECORD;
  seq_name TEXT;
  max_val BIGINT;
BEGIN
  FOR r IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'hub'
      AND column_default LIKE 'nextval%'
  LOOP
    seq_name := pg_get_serial_sequence('hub.' || r.table_name, r.column_name);
    IF seq_name IS NOT NULL THEN
      EXECUTE format('SELECT COALESCE(max(%I), 0) FROM hub.%I', r.column_name, r.table_name) INTO max_val;
      EXECUTE format('SELECT setval(%L, %s)', seq_name, max_val + 1);
      RAISE NOTICE 'Reset % to %', seq_name, max_val + 1;
    END IF;
  END LOOP;
END $$;


-- ─── 5.4  POST-LOAD: Validate rowcounts ────────────────────────────────────
-- Run AGAINST SSOT. Compare output to 5.0 baseline.

SELECT 'tenants' AS tbl, count(*) FROM hub.tenants
UNION ALL SELECT 'users', count(*) FROM hub.users
UNION ALL SELECT 'roles', count(*) FROM hub.roles
UNION ALL SELECT 'permissions', count(*) FROM hub.permissions
UNION ALL SELECT 'role_permissions', count(*) FROM hub.role_permissions
UNION ALL SELECT 'user_roles', count(*) FROM hub.user_roles
UNION ALL SELECT 'projects', count(*) FROM hub.projects
UNION ALL SELECT 'apps', count(*) FROM hub.apps
UNION ALL SELECT 'credentials', count(*) FROM hub.credentials
UNION ALL SELECT 'documents', count(*) FROM hub.documents
UNION ALL SELECT 'files', count(*) FROM hub.files
UNION ALL SELECT 'file_versions', count(*) FROM hub.file_versions
UNION ALL SELECT 'file_bindings', count(*) FROM hub.file_bindings
UNION ALL SELECT 'doc_links', count(*) FROM hub.doc_links
UNION ALL SELECT 'navigation_items', count(*) FROM hub.navigation_items
UNION ALL SELECT 'notebooks', count(*) FROM hub.notebooks
UNION ALL SELECT 'tasks', count(*) FROM hub.tasks
UNION ALL SELECT 'ui_modals', count(*) FROM hub.ui_modals
UNION ALL SELECT 'audit_logs', count(*) FROM hub.audit_logs
UNION ALL SELECT 'events', count(*) FROM hub.events
UNION ALL SELECT 'signals', count(*) FROM hub.signals
UNION ALL SELECT 'situations', count(*) FROM hub.situations
UNION ALL SELECT 'evidence_refs', count(*) FROM hub.evidence_refs
UNION ALL SELECT 'ai_sessions', count(*) FROM hub.ai_sessions
UNION ALL SELECT 'ai_session_memories', count(*) FROM hub.ai_session_memories
UNION ALL SELECT 'agent_decisions', count(*) FROM hub.agent_decisions
UNION ALL SELECT 'action_proposals', count(*) FROM hub.action_proposals
UNION ALL SELECT 'file_embeddings', count(*) FROM hub.file_embeddings
UNION ALL SELECT 'playing_with_neon', count(*) FROM hub.playing_with_neon
ORDER BY 1;


-- ─── 5.5  POST-LOAD: Orphan checks ─────────────────────────────────────────

-- Orphan user_roles (user missing)
SELECT ur.* FROM hub.user_roles ur
LEFT JOIN hub.users u ON u.id = ur.user_id
WHERE u.id IS NULL;

-- Orphan user_roles (role missing)
SELECT ur.* FROM hub.user_roles ur
LEFT JOIN hub.roles r ON r.id = ur.role_id
WHERE r.id IS NULL;

-- Orphan role_permissions
SELECT rp.* FROM hub.role_permissions rp
LEFT JOIN hub.roles r ON r.id = rp.role_id
WHERE r.id IS NULL;

SELECT rp.* FROM hub.role_permissions rp
LEFT JOIN hub.permissions p ON p.id = rp.permission_id
WHERE p.id IS NULL;

-- Orphan file_bindings
SELECT fb.* FROM hub.file_bindings fb
LEFT JOIN hub.files f ON f.id = fb.file_id
WHERE f.id IS NULL;

-- Orphan doc_links
SELECT dl.* FROM hub.doc_links dl
LEFT JOIN hub.documents d ON d.id = dl.document_id
WHERE d.id IS NULL;

-- Orphan evidence_refs
SELECT er.* FROM hub.evidence_refs er
LEFT JOIN hub.situations s ON s.id = er.situation_id
WHERE s.id IS NULL;

-- Orphan ai_session_memories
SELECT m.* FROM hub.ai_session_memories m
LEFT JOIN hub.ai_sessions s ON s.id = m.session_id
WHERE s.id IS NULL;

-- Vector sanity
SELECT count(*), pg_typeof(embedding) FROM hub.file_embeddings LIMIT 1;


-- ============================================================================
-- PHASE 6: CUTOVER — Point services to SSOT with search_path=hub
-- ============================================================================

-- ─── 6.1  Connection string change ─────────────────────────────────────────
-- For every Cloudflare Worker service, update the DATABASE_URL secret:
--
--   Old: postgresql://...@ep-broad-waterfall.../neondb?sslmode=require
--   New: postgresql://...@ep-plain-bird.../Spine?sslmode=require&options=-c%20search_path%3Dhub%2Cpublic
--
-- The `options=-c search_path=hub,public` sets the default schema to hub
-- so all unqualified table references (SELECT * FROM users) resolve to hub.users.
--
-- This means NO CODE CHANGES needed in services — they keep writing
-- `sql\`SELECT * FROM users\`` and it resolves to hub.users.

/*
# ── Update each Cloudflare Worker secret ──
# Replace <SSOT_CONN_WITH_SCHEMA> with your connection string + search_path option

export SSOT_WITH_SCHEMA="postgresql://neondb_owner:<password>@ep-plain-bird-abh7vpm0-pooler.eu-west-2.aws.neon.tech/Spine?sslmode=require&options=-c%20search_path%3Dhub%2Cpublic"

SERVICES="integratewise-gateway integratewise-think integratewise-act integratewise-knowledge integratewise-loader integratewise-store integratewise-iq-hub integratewise-spine integratewise-govern integratewise-normalizer"

for svc in $SERVICES; do
  echo "Updating $svc..."
  echo "$SSOT_WITH_SCHEMA" | wrangler secret put DATABASE_URL --name "$svc"
done

# For the Next.js OS app (Supabase-hosted), update via your hosting platform:
#   DATABASE_URL = same SSOT_WITH_SCHEMA value
#   Or if the app uses Supabase client SDK, update NEXT_PUBLIC_SUPABASE_URL
#   to point to the SSOT project.
*/

-- ─── 6.2  Smoke tests (run after cutover) ──────────────────────────────────
-- These verify the services can read/write through the new connection.

-- Test 1: Tenant resolution
-- curl https://integratewise-spine-staging.workers.dev/v1/tenants \
--   -H "x-tenant-id: <your-test-tenant-uuid>"

-- Test 2: Create a task
-- curl -X POST https://integratewise-loader-staging.workers.dev/v1/tasks \
--   -H "x-tenant-id: <your-test-tenant-uuid>" \
--   -H "Content-Type: application/json" \
--   -d '{"title":"Cutover smoke test","status":"pending"}'

-- Test 3: Signal write
-- curl -X POST https://integratewise-think-staging.workers.dev/v1/signals \
--   -H "x-tenant-id: <your-test-tenant-uuid>" \
--   -H "Content-Type: application/json" \
--   -d '{"signal_key":"cutover.test","entity_type":"system","entity_id":"test","band":"info","payload":{}}'

-- Test 4: Verify data reads
-- Run against SSOT directly:
SELECT count(*) FROM hub.tenants;
SELECT count(*) FROM hub.users;
SELECT count(*) FROM hub.signals;

-- ─── 6.3  Rollback (if smoke tests fail) ───────────────────────────────────
-- Simply revert DATABASE_URL to the old Hub connection string.
-- No data loss — old DB is still intact.


-- ============================================================================
-- PHASE 7: ENFORCE — Lock old DB + Shared Connector
-- ============================================================================

-- ─── 7.1  Revoke old DB access ─────────────────────────────────────────────
-- Run AGAINST THE OLD Hub production DB:

-- Option A: Revoke all privileges (keeps the user but blocks access)
-- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM neondb_owner;
-- REVOKE CONNECT ON DATABASE neondb FROM neondb_owner;

-- Option B: Set to read-only for a grace period (safer)
-- ALTER USER neondb_owner SET default_transaction_read_only = on;

-- Option C: Rotate password (if other users need the DB)
-- ALTER USER neondb_owner PASSWORD 'new-random-password-nobody-has';

-- ─── 7.2  Backup verification ──────────────────────────────────────────────
-- Ensure Neon PITR (point-in-time recovery) is active on SSOT.
-- Neon retains 7 days of history on Pro, 30 days on Scale.


-- ============================================================================
-- PHASE 8: BRANCHING — Staging/Dev from SSOT
-- ============================================================================

-- Neon supports instant database branching. Use this for staging + dev.

/*
# ── Create staging branch from production ──
neonctl branches create \
  --project-id <your-ssot-project-id> \
  --name staging \
  --parent main

# ── Create dev branch from production ──
neonctl branches create \
  --project-id <your-ssot-project-id> \
  --name dev \
  --parent main

# ── Get connection strings for each branch ──
neonctl connection-string --project-id <your-ssot-project-id> --branch staging
neonctl connection-string --project-id <your-ssot-project-id> --branch dev

# ── Update staging workers ──
export STAGING_CONN="<staging branch connection string>&options=-c%20search_path%3Dhub%2Cpublic"
for svc in $SERVICES; do
  echo "$STAGING_CONN" | wrangler secret put DATABASE_URL --name "${svc}-staging"
done
*/

-- ── Verify hub schema exists on branches ──
-- Neon branches are instant copies, so hub.* is already there.
-- Run against staging branch:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'hub' ORDER BY table_name;

-- ── Seed minimal fixtures for staging/dev ──
-- Only if you want clean test data instead of production clones:

/*
-- Run against staging branch:
TRUNCATE hub.audit_logs, hub.events, hub.signals, hub.situations,
         hub.evidence_refs, hub.ai_sessions, hub.ai_session_memories,
         hub.agent_decisions, hub.action_proposals, hub.file_embeddings
CASCADE;

-- Insert test tenant + user
INSERT INTO hub.tenants (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test Tenant');
INSERT INTO hub.users (id, tenant_id, email, name) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'dev@integratewise.io', 'Dev User');
*/
