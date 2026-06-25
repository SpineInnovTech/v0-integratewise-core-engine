# The Spine — Canonical Model

> **Status:** Canonical architecture doctrine (constitutional reference)
> **Date:** June 12, 2026
> **Authority:** Nirmal (Founder)
> **Companion docs:** `USER_SYSTEM_JOURNEY_BLUEPRINT.md` (layers/stages), `AGENTS.md` (locked decisions)
> **Supersedes:** Spine descriptions scattered across session logs and status docs. Those remain
> valid as history; this doc is the single authoritative model. When a doc contradicts this file,
> this file wins.

---

## 0. The One-Line Truth

```text
One Spine. Many projections. The Spine is the source of truth; every surface is a view of it.
```

The Spine is the normalized, governed, tenant-isolated context substrate that sits behind every
connector, tool, AI, and session. It is the product moat. Everything the user sees (workbenches,
briefs, the Twin) is a **projection** of the Spine — never a raw tool table, never an ETL copy.

This document defines **what the Spine is made of**. It is deliberately pointer-based: the
exhaustive lists live in code (cited below) so this doc cannot drift out of sync. Read the model
here; trust the code for the enumerations.

---

## 1. The Four Founding Pieces (August 2025 — immutable)

The Spine is the third of four axioms (see `AGENTS.md`). They are not redesigned, replaced, or
routed around:

```text
LOADER       Universal intake membrane. MCP-native. Tracks provenance. Never reasons.
NORMALIZER   Eight-stage cognitive pipeline (LLM-in-the-loop at stages 2,3,4,6).
             Output = MCP tool calls, not JSON blobs. Normalization paid ONCE per entity.
SPINE        Context substrate across all connected tools (THIS DOCUMENT).
TRAIT + RESOURCE TYPE  18 core traits, 7 canonical resource types. Identity by nature, not label.
```

The Spine's job: turn many tools' overlapping, conflicting records into **one canonical entity per
real-world thing**, connect them in a relationship graph, and emit signals when they change.

---

## 2. What the Spine Holds

The Spine is composed of four planes. All four are tenant-isolated (`tenant_id` throughout).

```text
2.1 ENTITIES        Canonical records (one Person, one Account, …) resolved across all tools.
2.2 RELATIONSHIPS   The graph that connects entities (exists nowhere else).
2.3 SIGNALS         change → Think → HITL → Act → signal → loop.
2.4 MEMORY          conversational_memory · org_memory · personal_memory (continuity layer).
```

| Plane                      | Source of truth                                                     | Code                                                         |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| Entities                   | D1 domain partitions                                                | `services/pipeline/src/spine/index.ts`                       |
| Relationships / Entity 360 | assembled on read                                                   | `services/pipeline/src/spine/entity360-assembler.ts`         |
| Signals                    | signal cache + signal partition                                     | `packages/types/src/signal-analyzer.ts`, `services/pipeline` |
| Memory                     | D1 / KV / AI Search (CF-native; legacy Supabase being migrated off) | `services/continuity`, `services/intelligence`               |

---

## 3. The Entity Model

### 3.1 Canonical entity types

Every record is normalized to a **canonical entity type**. The complete universe of valid types is
computed in code — do not hand-maintain a list here:

- Universe: `ALL_CANONICAL_ENTITY_TYPES` — `packages/types/src/schema.ts`
- Aliases (provider-native, plurals, legacy → canonical): `CANONICAL_ENTITY_TYPE_ALIASES`
- Resolution: `resolveEntityTypeAlias()` → `validateEntityType()` → `isCanonicalEntityType()`

This is the mechanism that makes:

```text
HubSpot Contact  =  Salesforce Lead  =  Jira Reporter  =  one canonical Person
HubSpot Company  =  Salesforce Account  =  one canonical Account
```

A new tool is absorbed by: **trait detection → resource type → schema → pool → neutralized.**
No per-tool special-casing in the Spine.

### 3.2 Logical domains (12 department configs)

Entity types are organized into 12 department domains, each with its own entity set and
priority/field policies. Defined in `DOMAIN_SPINE_CONFIG` (`packages/types/src/schema.ts`):

```text
CUSTOMER_SUCCESS · REVOPS · SALES · MARKETING · PRODUCT_ENGINEERING · FINANCE
SERVICE · PROCUREMENT · IT_ADMIN · STUDENT_TEACHER · BIZOPS · PERSONAL
```

Department-to-config mapping: `DEPARTMENT_TO_CONFIG_KEY`. Industry overlays:
`INDUSTRY_SPINE_BASE` (cross-industry extras). Cross-domain types: `CROSS_DOMAIN_ENTITY_TYPES`.

### 3.3 Physical partitions (5 D1 tables)

Logical domains are written to **five physical D1 partitions**. The mapping is a pure function —
reads and writes use the SAME resolver, so they can never split-brain:

```text
decide_data   strategy & commitments   okr, strategic_objective, business_context, kpi, decision, commitment
build_data    work & artifacts         task, workflow, document, blocker, calendar_event
grow_data     revenue & customers      account, contact, opportunity, ticket, renewal, risk
run_data      operations               ops_metric(s)
cross_data    everything else          signals, episodes, learnings, generated insights (default)
```

Resolver: `getDomainForType()` in `services/pipeline/src/spine/index.ts`.
Query expansion across aliases: `getMatchingTypesForQuery()`. Typed-column extraction per domain:
`extractTypedFields()`. (DECISION 21 — D1-direct workspace projections.)

---

## 4. The Fortress (write path)

Under DECISION 22 the product plane is **100% Cloudflare**. There is no Supabase and no second
store — a single Cloudflare plane.

```text
Connector / Webhook / MCP / API
        ↓  (S1 Connectivity → S2 Loader → S3 Normalizer → S4 Entity Resolution)
Pipeline (Spine Writer)  ──writes──▶  D1 domain partitions (decide/build/grow/run/cross)
        ↓                                       │
   pipeline-process queue                       └── KV hot cache (TTL 60–300s) + AI Search index
```

- The pipeline is the **only** writer to canonical partitions: `services/pipeline/src/spine/index.ts`.
- The Twin is **READ-ONLY** to the Spine. Memory writes go via the continuity pipeline only.
- Every Spine access is audit-logged (`spine_audit_log`, see `AGENTS.md` Rule 9).

> ⚠️ Migration honesty: doctrine = Cloudflare-only; code still references Supabase in ~70 files
> (tracked in `docs/migrations/DE_SUPABASE_MIGRATION.md`). Do not claim "Supabase removed" until
> the code is migrated. Do not add new Supabase usage (enforced by `scripts/check-doctrine.mjs`).

---

## 5. Projections (read path)

The frontend and Twin **never** read raw tool tables. They read projections of the Spine:

```text
Spine (D1 partitions)
   ├── /api/v1/workspace/*            workspace-spine.ts        → L1 User Workbench
   ├── /api/v1/pipeline/entities[...]  spine/index.ts            → grids, counts, batches
   ├── Entity 360 (assembled on read)  entity360-assembler.ts    → L2 Intelligence Overlay
   ├── Signals                         signal-analyzer.ts        → L5 Operations Workbench
   └── Memory / Knowledge              continuity / knowledge    → L3 Twin, L4 Knowledge Workbench
```

Served D1-direct by the gateway (`services/gateway/src/workspace-spine.ts`, DECISION 21) — no
Supabase-backed BFF hop. Projections mirror the same partitions the pipeline writes.

**Principle:** a projection is a _view_, computed from the Spine. If a surface needs data, it
asks the Spine for a projection — it never gets its own store.

---

## 6. Governance & Continuity (the hard gate)

```text
Signal/change → Intelligence (Think) → Proposal → S8 Governance (HARD GATE) → Act → writeback → signal
```

- No execution without an approval token (`x-approval-token`). HITL is mandatory for writes-back.
- Promotion to `org_memory` is human-approved (L7 Governance Workbench).
- Continuity Bridge (`services/continuity`) carries normalized, governed context across every AI,
  tool, and session — this IS the product (IW Continuity Bridge, DECISION 23).

---

## 7. The Moat, Stated Plainly

```text
N tools × M tools integrations  →  N + M (each tool speaks to the Spine once)
```

- Normalization is paid **once per entity**; every connected tool compounds the same Spine.
- Entity resolution + the relationship graph + the signal loop exist **in the Spine**, not in any
  single tool — that is the defensible center.
- Other AIs/tools (Claude, ChatGPT, Cursor, Perplexity) integrate via MCP/AI-provider/Nango/API and
  become **surfaces onto the Spine** — they are not the product runtime.

---

## 8. Source-of-Truth Index (read the code, not a copy)

| Concept                                              | Authoritative source                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Canonical types, aliases, domains, industry overlays | `packages/types/src/schema.ts`                                            |
| Type resolution functions                            | `resolveEntityTypeAlias` / `validateEntityType` / `isCanonicalEntityType` |
| Physical partition resolver                          | `getDomainForType` — `services/pipeline/src/spine/index.ts`               |
| Spine writer                                         | `services/pipeline/src/spine/index.ts`                                    |
| Entity 360 assembly                                  | `services/pipeline/src/spine/entity360-assembler.ts`                      |
| Workspace projections                                | `services/gateway/src/workspace-spine.ts`                                 |
| Signals                                              | `packages/types/src/signal-analyzer.ts`                                   |
| Memory / continuity                                  | `services/continuity`, `services/intelligence`                            |
| Layer/stage doctrine                                 | `docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md`                      |
| Locked decisions                                     | `AGENTS.md` (DECISIONS 18–23)                                             |

---

_This file is the constitutional reference for the Spine. It is pointer-based by design: when the
code changes, update the pointers, never fork the lists. When in doubt — halt, ask Nirmal._
