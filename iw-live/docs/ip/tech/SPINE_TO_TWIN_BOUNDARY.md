# Spine → Twin Boundary Architecture

> What Spine owns, what Twin owns, what Entity 360 bridges, and what Govern gates.

---

## Current Surface-Binding Doctrine

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- OpenWebUI is not the customer-facing product shell.
- Twin / OpenWebUI runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

Use older L1/L2 / workspace / knowledge-UI language in this file through that boundary if any historical phrasing remains.

---

## Boundary Overview

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              IntegrateWise Platform                               │
│                                                                                   │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────┐    ┌──────────┐    ┌───┐│
│  │  SPINE   │────▶│  ENTITY 360  │────▶│ MorningContext │───▶│   TWIN   │────▶│GOV││
│  │ (Write)  │     │  (Assembly)  │     │  (Edge Builder)│    │ (Reason) │    │   ││
│  └──────────┘     └──────────────┘     └────────────────┘    └──────────┘    └───┘│
│       ▲                                                              │         │  │
│       │                                 NEVER                        │         │  │
│       └─────────────────────────────────── ✗ ────────────────────────┘         │  │
│                                                                                │  │
│  Twin NEVER writes to Spine. Twin reasons strictly over edge MorningContext.   │  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## What Spine Owns

Spine is the source of truth for all entity data. It owns writes, schema, and routing.

| Responsibility            | Implementation                                                 | Details                                                    |
| ------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Entity storage            | Spine DB tables (`entities_account`, `entities_contact`, etc.) | Partitioned by workspace_id, RLS enforced                  |
| Schema definition         | Postgres migrations                                            | Entity types, field types, constraints, computed columns   |
| Schema routing            | Router Worker                                                  | Determines which table an entity writes to based on type   |
| Source attribution        | `source_attributions` table                                    | Every field tagged with source, confidence, sync timestamp |
| Identity links            | `identity_links` table                                         | Maps entity_id to external IDs across systems              |
| Conflict resolution rules | `conflict_rules` table (JSONB)                                 | Per-field rules: latest-wins, highest-confidence, manual   |
| Write validation          | CHECK constraints + triggers                                   | Confidence range, required fields, type validation         |
| Event emission            | `entity_changed` events on Cloudflare Queue                    | Downstream consumers (Assembler, Twin) subscribe           |

### Spine's Contract

- Spine accepts writes ONLY from the Writer Worker (end of Flow A pipeline).
- Spine emits `entity_changed` events for every write.
- Spine never calls external APIs — it is a pure persistence layer.
- Spine schema is version-controlled and deployed via migrations.

---

## What Twin Owns

Twin is the reasoning layer. It evaluates triggers and produces insights.

| Responsibility      | Implementation              | Details                                                 |
| ------------------- | --------------------------- | ------------------------------------------------------- |
| Trigger definitions | `trigger_definitions` table | 14 built-in types + custom triggers                     |
| Trigger evaluation  | Twin Worker (Intelligence)  | Evaluates conditions against Entity 360 snapshots       |
| Insight generation  | `twin_insights` table       | Severity, evidence, recommended action, entity_id       |
| Insight routing     | Notification Worker         | Routes insights to correct view (CSM Hub, Intelligence) |
| Trigger suppression | Dedup logic in Twin Worker  | Same trigger + entity within 24h = suppressed           |
| Evaluation history  | `trigger_evaluations` table | Audit trail of every evaluation (fired or not)          |

### Twin's Contract

- **Twin reads ONLY from the Edge-Local Morning Context Retrieval Layer (`MorningContext` / `MorningContextBuilder`)** — never from raw database/Supabase tables, ensuring 100% sandboxed reasoning.
- Twin writes ONLY to `twin_insights` and `trigger_evaluations` — never to Spine entity tables.
- Twin does not mutate entity data. It observes and reasons.
- Twin's insights are advisory — they recommend actions (Playbooks) but do not execute them.

### Why Twin Never Writes to Spine

| Risk            | Description                                                                    | Mitigation                                                       |
| --------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Feedback loops  | Insight changes entity → triggers new evaluation → new insight → infinite loop | Write isolation eliminates the possibility                       |
| Data corruption | Reasoning error writes bad data to source of truth                             | Twin has no write access to Spine                                |
| Audit confusion | Hard to distinguish human-sourced data from machine-generated                  | Clear boundary: Spine = external data, Twin = internal reasoning |
| Trust erosion   | Users can't trust entity data if AI modified it                                | Entity data is always from connected sources, never from Twin    |

---

## What Entity 360 Bridges

Entity 360 is the assembly layer — a read-only API that merges Spine data into a unified view.

| Responsibility            | Implementation                | Details                                                        |
| ------------------------- | ----------------------------- | -------------------------------------------------------------- |
| Multi-source assembly     | Assembler Worker              | Reads all source data for an entity, merges into one response  |
| Field conflict resolution | Trust rules engine            | Applies conflict_rules to determine winning value per field    |
| Health score computation  | Weighted formula              | Usage (40%) + Support (25%) + Engagement (20%) + Billing (15%) |
| Relationship mapping      | Graph query on identity_links | Surfaces related entities (contacts at account, etc.)          |
| Timeline assembly         | Chronological merge           | Events from all sources sorted by timestamp                    |
| Edge caching              | Cloudflare KV                 | 60-second TTL, invalidated on entity_changed event             |
| Progressive hydration     | Tiered response               | Profile (fast) → Timeline (async) → Insights (async)           |

### Entity 360's Contract

- Entity 360 reads from Spine tables — it never writes to them.
- Entity 360 is the ONLY read surface for Twin — Twin never queries Spine directly.
- Entity 360 responses include trust metadata (sources, confidence, lastSync).
- Entity 360 is stateless — it assembles on demand (with edge caching).

---

## What Govern Gates

Govern is the approval layer for high-impact actions.

| Action                             | Gate Type           | Approvers              | Timeout   |
| ---------------------------------- | ------------------- | ---------------------- | --------- |
| Entity merge (identity resolution) | Single approval     | Workspace admin or CSM | 72 hours  |
| Entity delete                      | Double approval     | Admin + second admin   | 48 hours  |
| Bulk field override                | Single approval     | Workspace admin        | 24 hours  |
| Connector disconnect               | Single approval     | Workspace admin        | Immediate |
| Schema migration (custom fields)   | Admin approval      | Platform admin         | 7 days    |
| Export (PII-containing data)       | Compliance approval | Compliance officer     | 48 hours  |

### Govern's Contract

- Govern does not own data — it gates access to Spine write operations.
- Govern creates `approval_requests` with status: pending → approved/rejected.
- Approved actions execute via the Writer Worker (same path as pipeline writes).
- Rejected actions are logged but never executed.
- All Govern decisions are audited in `govern_audit_log`.

---

## Data Flow Summary by Boundary

| Flow              | Path                                                         | Writes To                            |
| ----------------- | ------------------------------------------------------------ | ------------------------------------ |
| Flow A (Ingest)   | Connector → Loader → Normalizer → Resolver → Router → Writer | Spine ✅                             |
| Flow B (Assemble) | Spine → Assembler → Entity 360 cache                         | KV cache only (read-only from Spine) |
| Flow C (Reason)   | Entity 360 → Twin → Insights                                 | twin_insights ✅ (never Spine)       |
| Flow D (Gate)     | User action → Govern → Approval → Writer                     | Spine ✅ (only after approval)       |

---

## Boundary Violations to Watch For

| Violation                                          | Detection                              | Severity                        |
| -------------------------------------------------- | -------------------------------------- | ------------------------------- |
| Twin writes to Spine table                         | RLS policy + audit log                 | Critical — architectural breach |
| Entity 360 mutates data                            | Assembler Worker has read-only DB role | Critical — should be impossible |
| Writer bypasses Govern for gated action            | Govern middleware check on Writer      | High — compliance risk          |
| Direct Spine read from UI (bypassing Entity 360)   | API gateway routing rules              | Medium — consistency risk       |
| Twin reads raw Spine tables (bypassing Entity 360) | Network policy + code review           | Medium — coupling risk          |
