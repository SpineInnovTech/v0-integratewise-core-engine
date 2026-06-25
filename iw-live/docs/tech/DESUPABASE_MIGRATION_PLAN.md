# De-Supabase Migration Plan

**Status:** DRAFT  
**Created:** 2026-06-18  
**Authority:** DECISION 22 (100% Cloudflare Product Plane)  
**Scope:** Active Supabase consumers in integratewise-live

---

## Executive Summary

Two services in `services/knowledge/` remain active Supabase consumers with direct PostgREST calls. All other services have either completed migration to D1 or have dead Supabase code paths. This plan outlines the migration strategy for these two remaining consumers.

---

## Current State Assessment

### Migration Status by Service

| Service                                         | Supabase Usage                     | Status              | Action Required                     |
| ----------------------------------------------- | ---------------------------------- | ------------------- | ----------------------------------- |
| `services/pipeline/`                            | Env vars declared, no active calls | ✅ COMPLETE         | Remove dead env vars                |
| `services/continuity/`                          | D1 shim (misleadingly named)       | ✅ COMPLETE         | Rename `supabase.ts` → `d1-shim.ts` |
| `services/gateway/`                             | Env var in interface only          | ✅ COMPLETE         | Remove dead env var                 |
| `services/intelligence/`                        | No Supabase usage                  | ✅ COMPLETE         | None                                |
| `services/normalizer/`                          | No Supabase usage                  | ✅ COMPLETE         | None                                |
| `services/knowledge/src/iq-hub.ts`              | **ACTIVE PostgREST calls**         | 🔴 MIGRATION NEEDED | Rewrite to D1                       |
| `services/knowledge/src/memory-consolidator.ts` | **ACTIVE PostgREST calls**         | 🔴 MIGRATION NEEDED | Rewrite to D1                       |

### Tables Affected

#### iq-hub.ts (PRIMARY TARGET)

- `ai_agents` (reads/writes)
- `ai_actions` (reads/writes)
- `ai_action_proposals` (reads/writes)
- `ai_situations` (reads)

#### memory-consolidator.ts (SECONDARY TARGET)

- `consolidated_memories` (reads/writes)
- `session_memories` (reads)

---

## Target State

All data operations route through Cloudflare D1 via the `DB` binding (already declared in both services). Supabase env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_KEY`) are removed from bindings and `.env` files.

---

## Migration Plan

### Phase 1: iq-hub.ts Migration

**Risk:** HIGH — Active agent/action CRUD operations  
**Complexity:** MEDIUM — Multiple tables, mixed read/write patterns

#### Current Supabase Operations

1. **Agent CRUD** (lines 159-161, 427-429)
   - `supabaseQuery()` on `ai_agents` table
   - `supabaseMutate()` for INSERT/UPDATE on `ai_agents`

2. **Action CRUD** (lines 302-304, 334-336)
   - `supabaseQuery()` on `ai_actions` table
   - `supabaseMutate()` for INSERT on `ai_actions`

3. **Situation Reads** (lines 244-246)
   - `supabaseQuery()` on `ai_situations` table

4. **Proposal Operations** (lines 389-391)
   - `supabaseQuery()` on `ai_action_proposals` table

5. **DATABASE_URL Construction** (lines 598-599, 872-873)
   - Constructs Postgres connection string from Supabase credentials
   - Used for downstream service calls (should be migrated to D1 service binding)

#### Migration Steps

1. **Create D1 helper functions** (replace `supabaseQuery`/`supabaseMutate`)

   ```typescript
   async function d1Query<T>(
     db: D1Database,
     table: string,
     conditions: Record<string, any>,
     options?: { limit?: number; orderBy?: string }
   ): Promise<T[]>;

   async function d1Mutate(
     db: D1Database,
     table: string,
     operation: "insert" | "update" | "upsert",
     data: Record<string, any>,
     conditions?: Record<string, any>
   ): Promise<any>;
   ```

2. **Migrate each endpoint** (incremental, test after each)
   - Start with read-only endpoints (`ai_situations`, `ai_action_proposals`)
   - Migrate agent reads, then agent writes
   - Migrate action reads, then action writes
   - Remove `DATABASE_URL` construction (use D1 binding directly)

3. **Update bindings**
   - Remove `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `Bindings` type
   - Ensure `DB: D1Database` is properly configured in `wrangler.toml`

4. **Update environment files**
   - Remove Supabase vars from `.env`, `.dev.vars`, `wrangler.toml`

#### Testing Strategy

- Unit tests for D1 helper functions
- Integration tests for each endpoint (agent CRUD, action CRUD)
- Verify tenant isolation (`tenant_id` filtering)
- Load test agent/action queries

---

### Phase 2: memory-consolidator.ts Migration

**Risk:** MEDIUM — Read-heavy, write-once pattern  
**Complexity:** LOW — Simple query patterns

#### Current Supabase Operations

1. **Fetch Weekly Consolidated Memories** (lines 648-653)
   - `supabaseQuery()` on `consolidated_memories`
   - Filter: `tenant_id`, `created_at` range, `consolidation_type`
   - Order: `created_at.desc`

2. **Store Consolidated Memory** (lines 888-909)
   - `supabaseMutate()` POST to `consolidated_memories`
   - Insert new consolidated memory record

3. **Fetch Recent Sessions** (referenced, line 648)
   - Calls `iq-hub` service via HTTP (will be migrated in Phase 1)

#### Migration Steps

1. **Replace Supabase helpers with D1 equivalents**

   ```typescript
   // Before
   const memories = await supabaseQuery(
     env.SUPABASE_URL,
     env.SUPABASE_SERVICE_KEY,
     "consolidated_memories",
     `tenant_id=eq.${tenantId}...`
   );

   // After
   const memories = await env.DB.prepare(
     "SELECT * FROM consolidated_memories WHERE tenant_id = ? AND created_at >= ? AND created_at <= ? ORDER BY created_at DESC"
   )
     .bind(tenantId, startTime, endTime)
     .all();
   ```

2. **Update `storeConsolidatedMemory()`**
   - Replace `supabaseMutate()` with `env.DB.prepare().bind().run()`

3. **Remove Supabase env vars**
   - Remove `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from `Env` interface

4. **Update wrangler.toml**
   - Ensure `DB` binding points to correct D1 database

#### Testing Strategy

- Unit tests for consolidation logic
- Integration tests for hourly/daily/weekly triggers
- Verify D1 writes for `consolidated_memories`
- Test cron schedule execution

---

### Phase 3: Cleanup

1. **Remove dead code**
   - Delete `supabaseQuery()` and `supabaseMutate()` helper functions from both files
   - Remove Supabase env vars from all `.env`, `.dev.vars`, `wrangler.toml` files

2. **Rename misleading file**
   - Rename `services/continuity/src/supabase.ts` → `d1-shim.ts`
   - Update import in `services/continuity/src/index.ts`

3. **Update documentation**
   - Remove Supabase references from AGENTS.md
   - Update architecture diagrams

---

## Risk Assessment

| Risk                       | Likelihood | Impact | Mitigation                                    |
| -------------------------- | ---------- | ------ | --------------------------------------------- |
| Data loss during migration | LOW        | HIGH   | D1 transaction support, incremental migration |
| D1 performance regression  | LOW        | MEDIUM | Benchmark queries, add indexes if needed      |
| Tenant isolation breach    | LOW        | HIGH   | Test `tenant_id` filtering on all queries     |
| Service downtime           | LOW        | HIGH   | Blue-green deployment, feature flags          |

---

## Dependencies

- D1 database schema must include tables: `ai_agents`, `ai_actions`, `ai_action_proposals`, `ai_situations`, `consolidated_memories`
- D1 bindings must be configured in `wrangler.toml` for knowledge service
- Existing D1 indexes must support query patterns (tenant_id, created_at, consolidation_type)

---

## Timeline

| Phase                           | Duration     | Owner | Status      |
| ------------------------------- | ------------ | ----- | ----------- |
| Phase 1: iq-hub.ts              | 2-3 days     | TBD   | NOT STARTED |
| Phase 2: memory-consolidator.ts | 1-2 days     | TBD   | NOT STARTED |
| Phase 3: Cleanup                | 1 day        | TBD   | NOT STARTED |
| **Total**                       | **4-6 days** |       |             |

---

## Acceptance Criteria

- [ ] All Supabase PostgREST calls replaced with D1 queries
- [ ] All Supabase env vars removed from bindings and environment files
- [ ] All endpoints pass integration tests
- [ ] Tenant isolation verified on all queries
- [ ] Performance benchmarks meet or exceed Supabase baseline
- [ ] Documentation updated to reflect Cloudflare-only architecture

---

## Appendix: D1 Schema Requirements

Ensure these tables exist in the target D1 database:

```sql
-- ai_agents
CREATE TABLE IF NOT EXISTS ai_agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ai_actions
CREATE TABLE IF NOT EXISTS ai_actions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ai_action_proposals
CREATE TABLE IF NOT EXISTS ai_action_proposals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  proposal JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ai_situations
CREATE TABLE IF NOT EXISTS ai_situations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  situation_type TEXT NOT NULL,
  context JSONB NOT NULL,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now'))
);

-- consolidated_memories
CREATE TABLE IF NOT EXISTS consolidated_memories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  consolidation_type TEXT NOT NULL,
  topic TEXT,
  user_id TEXT,
  account_id TEXT,
  summary TEXT NOT NULL,
  key_insights JSONB DEFAULT '[]',
  recurring_themes JSONB DEFAULT '[]',
  action_patterns JSONB DEFAULT '[]',
  session_count INTEGER DEFAULT 0,
  time_range_start TEXT NOT NULL,
  time_range_end TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

_This document is a living plan. Update as migration progresses._
