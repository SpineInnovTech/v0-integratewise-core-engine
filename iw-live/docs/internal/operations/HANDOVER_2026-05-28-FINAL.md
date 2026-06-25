# Final Session Handover — May 28, 2026

**Branch:** `feat/continuity-convergence`  
**Last commit:** `f2e83b5` — canonical architecture document  
**Status:** Session closed. All decisions locked. Ready for next agent.

---

## What Was Built This Session

### Code (committed)

- ZERO PYTHON across all 22+ workers — `python-client.ts` deleted, `SignalAnalyzer` in `@integratewise/types`
- Governed Cognition Proposal — `packages/types/src/proposal.ts`, `services/govern/src/proposal.ts`, 9 routes
- Govern service rewritten to D1 — zero neon()/DATABASE_URL, all reads/writes via `env.D1.prepare()`
- D1 schema live — `proposals` + `governance_audit_log` in `integratewise-spine-cache` (ed1f534a)
- Intelligence worker deployed — version `6c608e39` live
- MCP transport fix deployed — version `80405a7c`, 16 tools live
- `sql-migrations/` archived to `_archived/sql-migrations/`
- IW Ops Agent created — `.kiro/agents/iw-ops-agent.md`

### Doctrine (committed)

- `docs/ARCHITECTURE_CANONICAL.md` ← THE canonical reference. Read this first.
- `docs/PRODUCT_PILLARS.md` — 7 pillars
- `docs/PER_USER_VIEW.md` — complete user view (My Workspace / My Ops / My Knowledge)
- `docs/ARCHITECTURE_V2.md` — superseded by CANONICAL
- `docs/OPERATOR_LOOP_DOCTRINE.md`
- `docs/SELF_DEMONSTRATION_DOCTRINE.md`
- `docs/OPS_ECOSYSTEM_DOCTRINE.md`
- `docs/tech/GOVERNED_COGNITION_PROPOSAL_DOCTRINE.md`

---

## The Architecture — Final State

```
INTEGRATEWISE — Canonical Architecture

INTERACTION LAYER (dual-channel)
  Human: NLP + Tools → Operational Workbench / Twin
  Machine: MCP → Loader (fetch) → Normalizer (transform) → Spine

PROCESSING LAYER
  MCP is the boundary contract
  Loader + Normalizer are internal MCP stages (not alternatives)
  Watchers: passive ingestion from files/folders/locations
  AI Connectors: bidirectional continuity between tools and Spine

SPINE (one logical memory, multiple physical stores)
  D1 (edge): proposals, audit_log, entity360_cache
  Spine DB (canonical): memory.*, spine.*, entities, lineage

THREE SURFACES
  User Workbench — projected truth + Twin embedded inline at bottom
  Twin Workbench — full AI ecosystem, conversational memory, handoff
  Memory View Layer — Personal / Org / Conversational memory

THREE MEMORY LAYERS
  Personal Memory — private, user-scoped, hard boundary
  Org Memory — shared, governed promotion, team-level
  Conversational Memory — staging layer, lives in Twin Workbench

GOVERNANCE LAYER
  AI proposes → human approves → handoff to user's agentic claw
  User executes in their own stack (outside IntegrateWise)
  Every action has lineage. Nothing executes without approval.

CONTINUITY
  The foundation. Not a feature.
  Survives model switches, provider switches, infrastructure changes.
  MCP sync closes the loop automatically.
```

---

## The Seven Product Pillars

1. One Surface — stop juggling tools
2. Memory — Personal + Org + Conversational, never resets
3. Operating Environment — AI thinks in context, waits for approval
4. Governance & Control & Security — nothing without your approval
5. Continuity — between systems, work, and memory
6. MCP — The Universal Connector
7. Handoff, Not Execution — IntegrateWise thinks, your AI executes

---

## The User View (No Layer Labels)

```
MY WORKSPACE  (app.integratewise.ai)
  Everything the system knows. My domain. My accounts. My signals.
  Twin embedded inline. Governance overlay. ⌘K / ⌘J.

MY OPS  (ops.integratewise.ai — User's own AI)
  Where I act. My tools. My playbook. My automations.
  IntegrateWise hands off here. User owns this surface.

MY KNOWLEDGE  (knowledge.integratewise.ai)
  What my org remembers. 5 boards. 3 memory layers. Triage Bot.
```

---

## Storage Architecture — Locked

```
EDGE (D1 — integratewise-spine-cache ed1f534a):
  proposals, governance_audit_log, entity360_cache

CANONICAL (Spine DB — PostgreSQL + pgvector):
  memory.conversational_memory ✅
  memory.org_memory ✅
  memory.personal_memory ❌ MISSING — needs migration
  spine.* (12 domain schemas) ✅
  public.entities ✅

RULE: No external entity touches Spine DB directly.
      All writes: CF Worker → Spine DB REST.
      AI tools: read-only from memory.
      Writes: → Triage Bot → approved → Spine DB.
```

---

## What's Pending — Priority Order

### Do First (unblocked)

| #   | Task                                                                                           |
| --- | ---------------------------------------------------------------------------------------------- |
| 1   | `personal_memory` migration — `spineDb/migrations/20260529_personal_memory.sql`                |
| 2   | Wire `GET /v1/proposals` into `GovernanceOverlay` + `useGovernanceQueue` hook in apps/web      |
| 3   | MCP refactor — remove `figma.*`, `kb.*`, `coda-proxy`. Add `spine.*`, `signal.*`, `proposal.*` |
| 4   | Fix React 19 / @types/react typecheck errors in apps/web (pre-existing, not from this session) |
| 5   | Retention cron — D1 + Spine DB cleanup, daily 2AM UTC                                          |

### Then

| #   | Task                                                           |
| --- | -------------------------------------------------------------- |
| 6   | `memory.propose` MCP tool — replace `memory.upsert_org` bypass |
| 7   | Connection 4: Wire Live → integratewise-ops REST API           |
| 8   | docs/ sync — Task A (7 files in docs/tech/)                    |
| 9   | CS Execution Workspace — reference implementation              |
| 10  | Knowledge Governance Workbench — 5 boards                      |

---

## Known Issues

| Issue                                   | Detail                                                                | Action                                |
| --------------------------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| React 19 typecheck errors               | `@types/react@19.2.15` vs `react@18.3.1` version mismatch in apps/web | Fix separately — not blocking deploys |
| `memory.upsert_org` bypasses Triage Bot | Direct write to org_memory without governance                         | Replace with `memory.propose` tool    |
| `personal_memory` table missing         | Not in any migration                                                  | Create `20260529_personal_memory.sql` |
| MCP has tool-specific handlers          | `figma.*`, `kb.*`, `coda-proxy` don't belong in MCP                   | Refactor to Spine gateway             |

---

## Files to Read at Session Start

```
AGENTS.md
docs/ARCHITECTURE_CANONICAL.md          ← Start here
docs/PRODUCT_PILLARS.md
docs/PER_USER_VIEW.md
docs/operations/TASK_REGISTRY.md
docs/operations/HANDOVER_2026-05-28-FINAL.md  ← This file
```

---

_Handover written: May 28, 2026. Session closed. All decisions locked. Canonical architecture committed._
