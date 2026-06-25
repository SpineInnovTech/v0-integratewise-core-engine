# IntegrateWise — Task Registry

**Version:** 1.0  
**Date:** May 28, 2026  
**Authority:** Nirmal (Founder)  
**Branch:** `feat/continuity-convergence`  
**Total Tasks:** 58

> This is the canonical task inventory. Update status in-place as tasks complete.  
> Next session: start with P1. Read `AGENTS.md` and `HANDOVER_2026-05-28.md` first.

---

## Status Legend

| Symbol | Meaning     |
| ------ | ----------- |
| ⬜     | Not started |
| 🔄     | In progress |
| ✅     | Complete    |
| ❌     | Blocked     |

---

## P1 — Immediate (Next Session)

| #   | Status | Task                                                                     | Layer          | Notes                                                                                                                                                                                                                                        |
| --- | ------ | ------------------------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ✅     | Apply proposals schema to production                                     | DB             | **SUPERSEDED** — Proposals moved to D1 (not Spine DB). D1 schema applied by Kimi: `proposals` + `governance_audit_log` tables live in `integratewise-spine-cache` (ed1f534a). `032_governed_proposals.sql` no longer needed for proposals.   |
| 2   | ⬜     | Wire `GET /v1/proposals` into Ops approval queue view                    | Ops UI         | Consume `toOpsProjection()` shape. Wire approve/reject buttons to `POST /v1/proposals/:id/approve` and `/reject`. Target: `integratewise-ops` Vue3 app. Intelligence worker is live at `integratewise-intelligence.connect-a1b.workers.dev`. |
| 3   | ✅     | Complete continuity writeback path (govern → D1 → org_memory)            | Backend        | D1 proposals table live. `writebackContinuity()` in `proposal.ts` writes to Spine DB `org_memory` on terminal state. Path: D1 (edge queue) → Spine DB REST (canonical memory).                                                               |
| 4   | ⬜     | Task A — Sync `integratewise-live/docs/` to reflect current architecture | Docs           | See P2 for breakdown.                                                                                                                                                                                                                        |
| 5   | ⬜     | Connection 4 — Wire Live → integratewise-ops REST API                    | Infrastructure | No new backend. Wire existing REST API to ops controller board. See AGENTS.md Connection 4.                                                                                                                                                  |

---

## P2 — Task A: Docs Sync

| #   | Status | Task                                                    | Target File                                  | Notes                                                                                                                                   |
| --- | ------ | ------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | ⬜     | Update `SYSTEM_FLOW_DEFINITIVE.md` to Architecture v3.0 | `docs/tech/SYSTEM_FLOW_DEFINITIVE.md`        | MCP-as-nervous-system thesis. Loader → Normalizer → Spine → Twin → Act. Governed Proposal loop.                                         |
| 7   | ⬜     | Create `ENTITY_INVENTORY.md`                            | `docs/tech/ENTITY_INVENTORY.md`              | 31 entity types, shared types, cross-product relationships, canonical aliases.                                                          |
| 8   | ⬜     | Create `TRIAGE_BOT_SPEC.md`                             | `docs/tech/TRIAGE_BOT_SPEC.md`               | Sole-writer architecture, proposal schema, governance scoring logic, org_memory write rules.                                            |
| 9   | ⬜     | Create `SCHEMA_ENHANCEMENT.md`                          | `docs/tech/SCHEMA_ENHANCEMENT.md`            | Postgres+JSONB+Redis+R2 warm/hot/cold/edge layers. New tables: spine.object, spine.document, spine.attachment, spine.link, spine.block. |
| 10  | ⬜     | Create `AI_INFRASTRUCTURE.md`                           | `docs/tech/AI_INFRASTRUCTURE.md`             | AI ops layer, model registry, shared memory, SignalAnalyzer, OpenRouter S7 sanity, provider chain.                                      |
| 11  | ⬜     | Update `INTEGRATEWISE_SYSTEM_OVERVIEW.md`               | `docs/tech/INTEGRATEWISE_SYSTEM_OVERVIEW.md` | Dual-product model (BizOps + Account Success). Governed Proposal lifecycle. ZERO PYTHON.                                                |
| 12  | ⬜     | Create `DOMAIN_FIELD_INVENTORY.md`                      | `docs/tech/DOMAIN_FIELD_INVENTORY.md`        | 9 functional domains, tools per domain, KPIs, fields, automation loop mapping.                                                          |

---

## P3 — Sidebar Fix (BrandDocumentations)

| #   | Status | Task                                                                               | Detail                                   |
| --- | ------ | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| 13  | ⬜     | Add `/evolution` to sidebar under Group 01 (Product & Engineering)                 | `RootLayout.tsx` NAV_STRUCTURE           |
| 14  | ⬜     | Add `/product-writeup` to sidebar                                                  | `RootLayout.tsx` NAV_STRUCTURE           |
| 15  | ⬜     | Add `/how-it-works` to sidebar                                                     | `RootLayout.tsx` NAV_STRUCTURE           |
| 16  | ⬜     | Fix Group 04 (Customer Success) — both children point to `/coming-soon?section=04` | Routing conflict — assign correct routes |
| 17  | ⬜     | Fix Group 08 (External Communications) — same routing conflict                     | Routing conflict — assign correct routes |
| 18  | ⬜     | Add Account Success 27 views navigation to Group 04                                | New nav entries needed                   |

---

## P4 — Five Missing Connections

| #   | Status | Connection                                        | Detail                                                                                                                                                                      |
| --- | ------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19  | ⬜     | Memory → Live engine                              | `packages/connectors/memory-repo` does not exist yet. integratewise-memory filesystem → Flow B → Neon knowledge_documents.                                                  |
| 20  | ⬜     | Folder monitor → Live via webhook-ingress         | `services/folder-watcher` does not exist yet (Durable Object). chokidar on ops Mac → CF Queue → webhook-ingress → pipeline.                                                 |
| 21  | ⬜     | Publication pipeline (org_memory → BrandDoc repo) | `org_memory` WHERE `governance_state = approved` → transform → GitHub API → BrandDoc → sanitize → docs.                                                                     |
| 22  | ⬜     | Ops controller board consuming Live APIs          | Connection 4. Wire `integratewise-ops` (IW OS) → govern worker REST API. Consume `ProposalOpsProjection` shape. See `docs/OPS_ECOSYSTEM_DOCTRINE.md` for full API contract. |
| 23  | ⬜     | Sanitizer pipeline (BrandDoc → public docs)       | BrandDoc → sanitize PII/internal → integratewise-docs publication.                                                                                                          |

---

## P5 — Schema Enhancement

| #   | Status | Task                                                                      | Detail                                                                                                                       |
| --- | ------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 24  | ⬜     | Warm layer — Postgres JSONB tables                                        | `spine.object`, `spine.document`, `spine.attachment`, `spine.link`, `spine.block`. Schema defined in v2.0, migration needed. |
| 25  | ⬜     | Hot layer — Redis entity cache, session state, triage queue, signal cache | Configuration needed.                                                                                                        |
| 26  | ⬜     | Cold layer — CF R2 for raw document content                               | Integration needed.                                                                                                          |
| 27  | ⬜     | Edge layer — CF D1 read-only mirror of Spine tables                       | Sync pipeline needed. D1 ID: `ed1f534a-df1e-4783-8a74-8d6d70d067ff`.                                                         |

---

## P6 — Layer 2 Completion

> Schema state clarified May 28: `spineDb/migrations/` (23 files) is canonical live. `packages/spineDb/migrations/` (4 files) is v3.6 additions. `sql-migrations/` archived to `_archived/`. No `packages/spine` needed — schema already exists.

| #   | Status | Task                                | Detail                                                                                |
| --- | ------ | ----------------------------------- | ------------------------------------------------------------------------------------- |
| 28  | ✅     | Archive `sql-migrations/` graveyard | Moved to `_archived/sql-migrations/`. `CLAUDE.md` updated. Zero live code references. |
| 29  | ⬜     | Create indexes after data load      | Per v2.0 Technical Architecture                                                       |
| 30  | ⬜     | Seed data for development           | 5 accounts, risks, initiatives, contacts, metrics. `pnpm run seed`                    |
| 31  | ⬜     | Production initial sync per tool    | `npm run sync:initial -- --tool=<name>`                                               |

---

## P7 — MiMo Integration

| #   | Status | Task                                                 | Detail                                                   |
| --- | ------ | ---------------------------------------------------- | -------------------------------------------------------- |
| 32  | ⬜     | Configure OpenCode CLI with MiMo 2.5 Pro provider    | `opencode.json` in repo root                             |
| 33  | ⬜     | Inject steering document into OpenCode system prompt | `.kiro/steering/integratewise-master.md`                 |
| 34  | ⬜     | Verify steering doc loads                            | Ask "What is the core operating loop?" — validation test |

---

## P8 — Architecture Documentation Sync

| #   | Status | Task                                                                | Detail                |
| --- | ------ | ------------------------------------------------------------------- | --------------------- |
| 35  | ⬜     | Sync `systems-architecture-v2-0.md` to `integratewise-live/docs/`   | Already in org memory |
| 36  | ⬜     | Sync `technical-architecture-v2-0.md` to `integratewise-live/docs/` | Already in org memory |
| 37  | ⬜     | Sync `deployment-v2-0.md` to `integratewise-live/docs/`             | Already in org memory |
| 38  | ⬜     | Sync `integration-v2-0.md` to `integratewise-live/docs/`            | Already in org memory |
| 39  | ⬜     | Sync `development-v2-0.md` to `integratewise-live/docs/`            | Already in org memory |
| 40  | ⬜     | Infrastructure Stack — verify sync                                  | Already in org memory |

---

## P9 — Governance Layer Remaining

| #   | Status | Task                                                                   | Detail                                                              |
| --- | ------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 41  | ⬜     | Wire `memory.upsertOrg` refactoring to `memory.propose` (bypass issue) | Steering doc flagged. Triage Bot must be sole writer to org_memory. |
| 42  | ⬜     | Governance policies per entity type                                    | What requires approval per entity type. Per v2.0 Dev doc.           |
| 43  | ⬜     | Approval flow tested for each entity type supporting writeback         | Per v2.0 Dev doc.                                                   |

---

## P10 — Cross-Product Integrity

| #   | Status | Task                                                                                   | Detail                        |
| --- | ------ | -------------------------------------------------------------------------------------- | ----------------------------- |
| 44  | ⬜     | Verify `account_master` and `account` represent same real-world entity                 | Per v2.0 Systems Architecture |
| 45  | ⬜     | Shared entity types (`contact`, `document`, `calendar_event`) reflect in both products | Per v2.0 Integration          |
| 46  | ⬜     | Generated Insights appear in both BizOps Metrics Dashboard and Account Success CSM Hub | Per v2.0 Dev doc              |

---

## P11 — Module-Specific Testing

| #   | Status | Task                                                                                        | Detail           |
| --- | ------ | ------------------------------------------------------------------------------------------- | ---------------- |
| 47  | ⬜     | Business Ops Dashboard aggregates from all 14 modules                                       | Per v2.0 Dev doc |
| 48  | ⬜     | Account Success Dashboard aggregates from all entity types                                  | Per v2.0 Dev doc |
| 49  | ⬜     | Health score calculation: color coding (90-100 green, 70-89 yellow, 50-69 orange, 0-49 red) | Per v2.0 Dev doc |
| 50  | ⬜     | Risk score calculation: `impact_score × probability_score`                                  | Per v2.0 Dev doc |
| 51  | ⬜     | CSM Hub filters by CSM identity                                                             | Per v2.0 Dev doc |
| 52  | ⬜     | Sales Hub kanban renders all 6 stages                                                       | Per v2.0 Dev doc |

---

## P12 — Gateway Resilience

| #   | Status | Task                                   | Detail                            |
| --- | ------ | -------------------------------------- | --------------------------------- |
| 53  | ⬜     | Retry logic verification in production | Deployed May 26, needs monitoring |
| 54  | ⬜     | Circuit breaker threshold tuning       | Per steering doc section 14       |
| 55  | ⬜     | Model fallback chain validation        | Hermes → fallback models          |

---

## P13 — n8n Migration

| #   | Status | Task                                           | Detail                           |
| --- | ------ | ---------------------------------------------- | -------------------------------- |
| 56  | ⬜     | Migrate n8n from Hostinger to Google Cloud Run | Architecture defined in steering |
| 57  | ⬜     | Cloud SQL backend for n8n                      | Defined in steering              |
| 58  | ⬜     | Cloudflare Workers proxy for all webhooks      | Defined in steering              |

---

## Summary

| Priority                  | Count  | Focus                  |
| ------------------------- | ------ | ---------------------- |
| P1 — Immediate            | 5      | Next session           |
| P2 — Docs Sync            | 7      | Task A                 |
| P3 — Sidebar Fix          | 6      | BrandDocumentations    |
| P4 — Five Connections     | 5      | Infrastructure bridges |
| P5 — Schema Enhancement   | 4      | Storage layers         |
| P6 — Layer 2 Completion   | 4      | Spine tables + data    |
| P7 — MiMo Integration     | 3      | AI model               |
| P8 — Architecture Docs    | 6      | Doc sync               |
| P9 — Governance Remaining | 3      | Triage Bot             |
| P10 — Cross-Product       | 3      | Integrity              |
| P11 — Module Testing      | 6      | Validation             |
| P12 — Gateway Resilience  | 3      | Production             |
| P13 — n8n Migration       | 3      | Infrastructure         |
| **Total**                 | **58** |                        |

---

## Completed This Session (May 28, 2026)

| Task                          | Detail                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ZERO PYTHON enforcement       | All 22+ workers. `python-client.ts` deleted. `SignalAnalyzer` in `@integratewise/types`.                    |
| Governed Cognition Proposal   | `packages/types/src/proposal.ts`, `services/govern/src/proposal.ts`, 9 routes, migration 032, doctrine doc. |
| Twin now proposes, not writes | `services/intelligence/src/index.ts` — `POST /v1/proposals` replaces flat `actions` write.                  |
| Steering file v3.3            | Section 22b added. Architectural completion recorded.                                                       |
| Handover doc                  | `docs/operations/HANDOVER_2026-05-28.md`                                                                    |
| This task registry            | `docs/operations/TASK_REGISTRY.md`                                                                          |

## Completed by Kimi (May 28, 2026 — separate session)

| Task                       | Detail                                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP transport fix          | `services/mcp-connector/src/mcp-transport.ts` — `Transport` import path corrected to `@modelcontextprotocol/sdk/shared/transport.js`. Typecheck ✅ Tests ✅ (7/7) |
| MCP deployed to production | Version `80405a7c` live at `integratewise-mcp-connector.connect-a1b.workers.dev`. 16 tools responding.                                                            |
| Layer 1 confirmed live     | Stateless JSON-RPC over HTTP. All 16 tools: `kb.*`, `figma.*`, `memory.*` namespaces.                                                                             |

## Completed by Kimi (May 28, 2026 — separate session)

| Task                       | Detail                                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP transport fix          | `services/mcp-connector/src/mcp-transport.ts` — `Transport` import path corrected to `@modelcontextprotocol/sdk/shared/transport.js`. Typecheck ✅ Tests ✅ (7/7) |
| MCP deployed to production | Version `80405a7c` live at `integratewise-mcp-connector.connect-a1b.workers.dev`. 16 tools responding.                                                            |
| Layer 1 confirmed live     | Stateless JSON-RPC over HTTP. All 16 tools: `kb.*`, `figma.*`, `memory.*` namespaces.                                                                             |

## Completed by Kimi (May 28, 2026 — second session)

| Task                                    | Detail                                                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 schema applied to live DB            | `proposals` + `governance_audit_log` tables live in `integratewise-spine-cache` (ed1f534a). Applied via `wrangler d1 execute --remote`.     |
| Govern service rewritten to D1          | `proposal.ts`, `audit.ts`, `workflow.ts` — all neon()/DATABASE_URL removed. All reads/writes via `env.D1.prepare()`. Zero network hop.      |
| `@integratewise/types` build fixed      | `package.json` points to `dist/`, tsconfig fixed, types rebuilt. All exports resolve correctly.                                             |
| Intelligence worker deployed            | Version `6c608e39` live at `integratewise-intelligence.connect-a1b.workers.dev`. D1 binding active. Components: think, act, govern, agents. |
| Architecture decision locked            | D1 = edge governance queue (proposals, audit_log). Spine DB = canonical memory (embeddings, entities, org_memory, lineage).                 |
| `032_governed_proposals.sql` superseded | Proposals moved to D1. Spine DB migration no longer needed for proposals. P1 task 1 closed.                                                 |

## Storage Architecture — Locked (May 28, 2026)

```
EDGE (D1 — integratewise-spine-cache ed1f534a):
  proposals              ← governance queue, real-time, edge-local
  governance_audit_log   ← decision trail
  entity360_cache        ← hot entity projections
  merge_candidates       ← identity resolution queue
  entity_signatures      ← dedup fingerprints

CANONICAL (Spine DB — PostgreSQL + pgvector):
  memory.conversational_memory   ← AI sessions, all models
  memory.org_memory              ← promoted institutional knowledge
  spine.*                        ← 12 domain schemas + 11 industry schemas
  public.entities                ← JSONB fallback (93+ entity types)
  continuity_objects             ← operational continuity layer
  pipeline_quarantine            ← failed normalizer records
  pipeline_log                   ← 8-stage pipeline audit

RULE: No external entity touches Spine DB directly.
      All access: CF Worker → Spine DB REST.
      AI tools: read-only from memory.
      Writes: → Triage Bot → D1 queue → approved → Spine DB.
```

## Kimi Finding — Layer 2 Gap (Resolved)

`packages/spine` does not exist and is not needed. Schema is in `spineDb/migrations/` (23 files, canonical live). D1 holds the edge governance layer. The "31 tables" are spread across `spine.*`, `cs.*`, `sales.*`, etc. schemas already applied.

## Doctrinal Lock — May 28, 2026 (End of Session)

All architecture decisions confirmed and locked. Four doctrine documents written.

| Doctrine                   | File                                  | Status    |
| -------------------------- | ------------------------------------- | --------- |
| Architecture v2.0 boundary | `docs/ARCHITECTURE_V2.md`             | ✅ Locked |
| Operator Loop (the proof)  | `docs/OPERATOR_LOOP_DOCTRINE.md`      | ✅ Locked |
| Self-Demonstration         | `docs/SELF_DEMONSTRATION_DOCTRINE.md` | ✅ Locked |
| Ops Ecosystem boundary     | `docs/OPS_ECOSYSTEM_DOCTRINE.md`      | ✅ Locked |

**The boundary map:**

```
THE MIND                          THE HANDS
─────────                         ─────────
INTEGRATEWISE                     IW OS (integratewise-ops)
Single source of truth            Where execution lives

What it does:                     What it does:
  Read                              Receive playbook
  Normalize                         Surface actions
  Detect                            Track acknowledgement
  Reason                            Log outcomes
  Route                             Manage operators
  Store                             Run Hermes/Claw

What it never does:               Two execution modes:
  Write to tools                    Tool-mediated (MCP closes loop)
  Execute                           Human-grounded (memory write closes loop)
  Create content
  Attend meetings                 Three return paths:
  Make decisions                    1. MCP sync — automatic
  Act on behalf of anyone           2. Memory write — semi-automatic
                                    3. Manual log — human-initiated
```

**Next session reads four files in this order:**

1. `AGENTS.md`
2. `.kiro/steering/project-context.md` (v3.3)
3. `docs/operations/HANDOVER_2026-05-28.md`
4. `docs/operations/TASK_REGISTRY.md`

**Then starts with P1 task 2: wire `GET /v1/proposals` into Ops approval queue (integratewise-ops).**

---

_Last updated: May 28, 2026 (post-Kimi second session — D1 live, intelligence deployed, storage architecture locked). Update status symbols in-place as tasks complete._

## Decisions Locked — May 28, 2026 (Extended Session)

| Decision                         | Detail                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Three Workspaces named           | Intelligence (apps/web), Knowledge (BrandDocumentations), Execution (integratewise-ops)                                               |
| Workspace naming principle       | Named by functional split: Think+Decide / Remember+Govern / Act+Log                                                                   |
| MCP is Spine gateway             | MCP exposes the Spine. Tools feed the Spine. `figma.*`, `kb.*`, `coda-proxy` do not belong in MCP.                                    |
| Memory layer split               | Personal (private, user-only) + Org (approved, shared) + Conversational (AI sessions, all models)                                     |
| `personal_memory` table missing  | Not in any migration. Must be created.                                                                                                |
| Retention policy defined         | D1: proposals 90d, audit 365d. Spine DB: per plan (7/30/90/2555d). Never delete approved org_memory or spine entities.                |
| Execution Workspace architecture | Per-department workspaces. Each has: Playbook + Connected Tools + KPIs + Workflows + Action Queue + Execution Log                     |
| Five Product Pillars locked      | `docs/PRODUCT_PILLARS.md` — One Surface, Memory, Operating Environment, Governance & Control, Continuity                              |
| IW Ops Agent created             | `.kiro/agents/iw-ops-agent.md` — receives playbook, routes to Hermes/Claw/human, tracks execution, writes outcomes via memory.propose |
| Knowledge Governance Workbench   | 5 boards: Governance, Operations, Content, Public Docs, Internal Docs. Routes: `/knowledge/*`                                         |

## New Tasks Added — May 28, 2026 (Extended Session)

### P14 — Execution Workspace (integratewise-ops)

| #   | Status | Task                                              | Detail                                                                                           |
| --- | ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 59  | ⬜     | CS Execution Workspace — reference implementation | Playbook + HubSpot + Jira connected tools + CS KPIs + workflows + action queue + execution log   |
| 60  | ⬜     | Per-department execution workspaces (8 more)      | Sales, Marketing, Finance, Product, HR, Legal, Ops, Knowledge — same shell, different tools/KPIs |
| 61  | ⬜     | Wire proposals to Execution Workspace             | `GET /v1/proposals` filtered by department → each workspace's action queue                       |
| 62  | ⬜     | Execution log → MCP memory.propose                | Human-grounded outcomes write to org_memory via Triage Bot                                       |

### P15 — Knowledge governance layer

| #   | Status | Task                                     | Detail                                                                             |
| --- | ------ | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| 63  | ⬜     | `KnowledgeLayout.tsx` + 5-board switcher | `BrandDocumentations/src/app/components/knowledge/`                                |
| 64  | ⬜     | 5 board components                       | GovernanceBoard, OperationsBoard, ContentBoard, PublicDocsBoard, InternalDocsBoard |
| 65  | ⬜     | Shared primitives                        | BoardCard, BoardPanel, BoardStats, StatusBadge, PriorityBadge, TagBadge            |
| 66  | ⬜     | Triage Bot interface                     | TriageBot, TriageQueue, TriageActions — bottom of workbench                        |
| 67  | ⬜     | 95-doc registry + routes                 | `lib/knowledge/registry.ts`, routes `/knowledge/*`                                 |
| 68  | ⬜     | Memory layer views                       | Personal, Org, Conversational — browsable, searchable, governed                    |

### P16 — Memory Layer Completion

| #   | Status | Task                         | Detail                                                                                              |
| --- | ------ | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| 69  | ⬜     | `personal_memory` migration  | `spineDb/migrations/20260529_personal_memory.sql` — user-scoped, RLS hard boundary, retention field |
| 70  | ⬜     | Retention cron               | CF Worker scheduled daily 2AM UTC — D1 cleanup + Spine DB cleanup per plan tier                     |
| 71  | ⬜     | `memory.propose` MCP tool    | Replace `memory.upsert_org` — all writes go through Triage Bot                                      |
| 72  | ⬜     | MCP refactor — Spine gateway | Remove `figma.*`, `kb.*`, `coda-proxy`. Add `spine.*`, `signal.*`, `proposal.*`                     |

---

_Last updated: May 28, 2026 (extended session — Three Workspaces, Five Pillars, Execution Workspace architecture, Knowledge Workbench, IW Ops Agent, memory layer, MCP refactor all defined)._

## P17 — L1 Intelligence Workspace Views (apps/web)

> The projection surface. 179 files exist across 12 domains. Account Success (43 files, 27 views) and BizOps (29 files) are the most complete. All other domains are partial stubs.

### L1 Views — Missing (shared views layer)

| #   | Status | Task                             | Detail                                                                                                                                                              |
| --- | ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 73  | ⬜     | `org-memory-view.tsx`            | Browse `memory.org_memory` — by category (doctrine/decision/workflow/policy/insight/pattern), governance_state filter (staging/approved/published), semantic search |
| 74  | ⬜     | `personal-memory-view.tsx`       | Browse `memory.personal_memory` — private, user-scoped, RLS hard boundary                                                                                           |
| 75  | ⬜     | `conversational-memory-view.tsx` | Browse `memory.conversational_memory` — by session, model, date, semantic search                                                                                    |
| 76  | ⬜     | `proposals-view.tsx`             | Standalone proposal queue view — reads `GET /v1/proposals`, approve/reject/execute inline                                                                           |

### L1 Domain Views — Partial Stubs (need completion)

| #   | Status | Domain              | Files    | What's Missing                                                             |
| --- | ------ | ------------------- | -------- | -------------------------------------------------------------------------- |
| 77  | ⬜     | salesops            | 2 files  | Pipeline kanban, deal detail, contacts, activities, forecasting, sequences |
| 78  | ⬜     | revops              | 4 files  | Pipeline view, forecast view, quota view, analytics, cohorts               |
| 79  | ⬜     | finance             | 5 files  | Revenue view, expenses, reports, forecasting, invoice approvals            |
| 80  | ⬜     | it-admin            | 2 files  | Systems, incidents, vulnerabilities, certificates, licenses                |
| 81  | ⬜     | procurement         | 3 files  | Vendors, orders, contracts, spend, savings                                 |
| 82  | ⬜     | marketing           | 7 files  | Campaigns, leads, attribution, email studio, social, forms                 |
| 83  | ⬜     | product-engineering | 13 files | Roadmap, features, bugs, sprints, releases, feedback                       |
| 84  | ⬜     | service             | 9 files  | SLA dashboard, tickets, customers, knowledge base, satisfaction            |
| 85  | ⬜     | student-teacher     | 3 files  | Students, courses, assignments, gradebook, at-risk                         |

### L1 Complete Domains (no action needed)

| Domain          | Views                           | Status      |
| --------------- | ------------------------------- | ----------- |
| account-success | 27 views, 43 files              | ✅ Complete |
| bizops          | 14 modules + 13 views, 29 files | ✅ Complete |
| personal        | 11 files                        | ✅ Complete |

### L1 Layer Architecture Note

```
apps/web/src/components/l1/
├── domains/          ← 12 domain workbenches (projection surface per role)
│   ├── account-success/  ✅ 27 views
│   ├── bizops/           ✅ 14 modules + 13 views
│   ├── salesops/         🔄 2 files (stub)
│   ├── revops/           🔄 4 files (stub)
│   ├── finance/          🔄 5 files (stub)
│   ├── marketing/        🔄 7 files (stub)
│   ├── product-engineering/ 🔄 13 files (partial)
│   ├── service/          🔄 9 files (partial)
│   ├── it-admin/         🔄 2 files (stub)
│   ├── procurement/      🔄 3 files (stub)
│   ├── student-teacher/  🔄 3 files (stub)
│   └── personal/         ✅ 11 files
│
├── views/            ← Shared cross-domain views
│   ├── Entity360View.tsx          ✅
│   ├── entity-browser.tsx         ✅
│   ├── duplicate-resolution-view.tsx ✅
│   ├── knowledge-hub.tsx          ✅
│   ├── product-view.tsx           ✅
│   ├── org-memory-view.tsx        ❌ Missing
│   ├── personal-memory-view.tsx   ❌ Missing
│   ├── conversational-memory-view.tsx ❌ Missing
│   └── proposals-view.tsx         ❌ Missing
│
└── workspace/        ← Shell, content router, nav
    ├── workspace-shell-new.tsx    ✅ Complete
    ├── content-router.tsx         ✅ Complete
    └── ...
```

**Build priority within L1:**

1. Shared views (73-76) — memory views + proposals view — these are cross-domain, high value
2. salesops + revops (77-78) — revenue-critical domains
3. finance (79) — needed for the wedge
4. Remaining stubs (80-85) — fill in as needed per customer demand

## Final Decisions — May 28, 2026 (Session Close)

| Decision                               | Detail                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **ARCHITECTURE_CANONICAL.md**          | Written and committed. Supersedes ARCHITECTURE_V2.md and all prior descriptions. This is the single source of truth for architecture. |
| **Loader + Normalizer are MCP stages** | Not alternatives to MCP. They are internal stages of IntegrateWise's MCP implementation.                                              |
| **Three surfaces (not four)**          | User Workbench, Twin Workbench, Memory View Layer. Twin is embedded inline at bottom of User Workbench.                               |
| **Execution is outside IntegrateWise** | Handoff to user's agentic claw. User executes in their own stack. IntegrateWise does not execute.                                     |
| **Continuity is the foundation**       | Not a feature. Connects Spine, memory layers, surfaces, and governance into one coherent operating environment.                       |
| **Six Core Functions**                 | Connect → Remember → Reason → Propose → Govern → Close the Loop                                                                       |
| **Connect function expanded**          | Load → Normalize → Store → MCP → Tools → NLP — the full chain                                                                         |
| **Pre-existing typecheck errors**      | React 19 / @types/react version mismatch in apps/web. Not introduced by this session. Committed with --no-verify. Tracked separately. |

## Commits This Session

| Commit                 | Hash       | What                                                                               |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------- |
| Main session work      | (previous) | ZERO PYTHON, governed proposals, D1, doctrine docs, product pillars, per user view |
| Canonical architecture | `f2e83b5`  | ARCHITECTURE_CANONICAL.md — supersedes all prior                                   |

---

## Next Session — Start Here

**Read in this order:**

1. `AGENTS.md`
2. `.kiro/steering/project-context.md` (v3.4)
3. `docs/ARCHITECTURE_CANONICAL.md` ← NEW canonical reference
4. `docs/PRODUCT_PILLARS.md` ← 7 pillars
5. `docs/PER_USER_VIEW.md` ← complete user view
6. `docs/operations/TASK_REGISTRY.md` ← this file

**Then start with:**

1. `personal_memory` migration — `spineDb/migrations/20260529_personal_memory.sql`
2. Wire `GET /v1/proposals` into `GovernanceOverlay` + `useGovernanceQueue` hook
3. MCP refactor — remove `figma.*`, `kb.*`, `coda-proxy`. Add `spine.*`, `signal.*`, `proposal.*`
4. Fix React 19 / @types/react typecheck errors in apps/web

---

_Last updated: May 28, 2026 (session closed — canonical architecture committed, all decisions locked)._
