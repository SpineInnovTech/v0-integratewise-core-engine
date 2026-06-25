# De-Supabase Migration — Cloudflare-Only Product Plane

> **Status:** TRACKED / IN PROGRESS
> **Authority:** AGENTS.md DECISION 22 (2026-06-12) — 100% Cloudflare product plane.
> **Rule:** This is the single tracker for removing Supabase from the product. Update it IN PLACE
> as services migrate. Do NOT spawn sibling migration docs. Do NOT add new Supabase usage.
> **Honesty note:** Doctrine = Cloudflare-only. Code = NOT there yet. This doc tracks the gap.

---

## Baseline (measured 2026-06-12)

~71 source files reference Supabase across services + packages (excluding node_modules/dist/tests).
The good news: most go through **two client chokepoints**, so this is far less than 71 independent rewrites.

### Chokepoints (migrate these first — everything else funnels through them)

| File                                              | Role                                                                                | Becomes                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `packages/db/src/supabase.ts`                     | `createDbClient` / `createAdminClient` (service-role, schema `hub`, `exec_sql` RPC) | A D1-backed adapter exposing the same surface, OR callers move to D1 bindings                  |
| `packages/supabase/src/{client,server,native}.ts` | Browser/SSR auth + db client                                                        | DELETE — app auth is already CF Gateway credential auth (DECISION 20); product reads D1-direct |
| `packages/db/src/index.ts`                        | re-exports db client                                                                | Re-point to D1 adapter                                                                         |

### Access patterns found (what each call actually is)

1. **`createDbClient/createAdminClient(...).from(table).select/insert/update`** — relational reads/writes → **D1** (`env.SPINE_CACHE_DB` or service D1 binding).
2. **Direct REST `fetch(${SUPABASE_URL}/rest/v1/...)`** (e.g. `services/think/src/tenant-config.ts`) → **D1 query** against `tenant_spine_config` (already partly on D1 — see migration 033).
3. **`.rpc("exec_sql", ...)`** (raw SQL helper, already `@deprecated`) → **D1 prepared statements** (parameterized). Remove the RPC path.
4. **pgvector similarity** (memory/knowledge search) → **Vectorize** or **AI Search** (`integratewise-knowledge`).
5. **Browser auth** (`packages/supabase` client) → **already replaced** by CF Gateway credential auth (DECISION 20). Just remove dead imports.

---

## Migration phases (by blast radius, smallest first)

### Phase 0 — Stop the bleeding (no behavior change)

- [ ] Add `supabase` to the doctrine drift-check ratchet (done — `scripts/check-doctrine.mjs`). New Supabase usage now fails CI.
- [ ] 🚨 **Rotate** the Supabase service-role key exposed in `IW-handoff-20260611-213600.md` + scrub from `.env`/`.dev.vars` (manual — founder).

### Phase 1 — Already-D1 paths (verify + delete Supabase fallback)

Gateway/workspace already read D1-direct. Confirm no Supabase fallback remains.

- [ ] `services/gateway/src/index.ts` (7 refs) — confirm D1-only; drop Supabase fallback.
- [ ] `services/think/src/tenant-config.ts` (8) — `tenant_spine_config` is on D1 (migration 033) → swap REST fetch → D1.
- [ ] `services/pipeline/src/index.ts` (14) + `spine/index.ts` (16) — pipeline writes the Spine; confirm D1 partitions (`${domain}_data`) are the only write target.

### Phase 2 — Memory & knowledge (pgvector → Vectorize/AI Search)

- [ ] `services/knowledge/src/{index,iq-hub,memory-consolidator}.ts`, `search/service.ts`, `embedding/storage.ts` — move pgvector → AI Search (`integratewise-knowledge`) / Vectorize.
- [ ] `services/intelligence/src/memory/morning-context-builder.ts` — read memory from D1/KV/AI Search.
- [ ] `services/continuity/src/{index,supabase}.ts` — conversational/org/personal memory → D1 + DO SQLite.

### Phase 3 — Reasoning & governance

- [ ] `services/think/src/{cognitive-brain,index}.ts` (70 + 29) — largest single files; cognitive reads → D1/KV/AI Search.
- [ ] `services/govern/src/proposal.ts`, `services/act/src/index.ts` — proposals/executions → D1 (+ TenantBrainDO already holds approvals/executions).
- [ ] `services/mcp-connector/src/handlers/tools.ts` (58) + `index.ts` — MCP tool reads → D1/AI Search.

### Phase 4 — Connectors, tenants, billing, workflow, admin

- [ ] `services/connector-sync/src/index.ts` (20), `services/connector/src/token-refresh.ts` — sync cursors/tokens → D1/KV (tokens stay in Nango).
- [ ] `services/tenants/src/{index,context,oauth-configs}.ts` — tenant/RBAC → D1.
- [ ] `services/billing/*` (42+18+11) — billing records → D1 (Stripe/Razorpay remain source of truth for payments).
- [ ] `services/workflow/src/*` (48+others) — workflow state → D1 + DO.
- [ ] `services/admin/*` — admin reads → D1.
- [ ] `packages/rbac/src/engine.ts` (9), `packages/lib/src/{audit,cache,neon}.ts` — shared libs → D1/KV.

### Phase 5 — Delete the clients

- [ ] Delete `packages/supabase/*` and `packages/db/src/supabase.ts` once no importers remain.
- [ ] Remove `SUPABASE_*` from all `wrangler.toml` / `.dev.vars` / `.env`.
- [ ] Remove `@supabase/supabase-js` from `package.json`s.
- [ ] Flip the drift-check baseline for `supabase` to 0 (hard-fail on any reintroduction).

---

## Deprecated services note

`services/{normalizer,store,loader,think,act,govern}` are pre-consolidation reference workers (per AGENTS.md). Their Supabase refs are lower priority — confirm they're truly inert before spending effort; the live behavior lives in `pipeline`, `connector`, `intelligence`.

## Definition of done

- `grep -rl "supabase" services packages --include=*.ts | grep -v node_modules | grep -v test` → **0**
- No `SUPABASE_*` vars in any wrangler/env file.
- `@supabase/supabase-js` absent from all `package.json`.
- Drift-check `supabase` baseline = 0.
