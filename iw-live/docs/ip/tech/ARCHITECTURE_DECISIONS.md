# Architecture Decisions — IntegrateWise

> Key decisions behind the Knowledge Workspace built on the Spine, powered by AI.

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

## ADR-1: Why Cloudflare Workers (Not AWS Lambda / GCP Functions)

| Factor              | Cloudflare Workers | AWS Lambda          |
| ------------------- | ------------------ | ------------------- |
| Cold start          | 0 ms (V8 isolates) | 100–800 ms          |
| Edge locations      | 300+ PoPs          | ~30 regions         |
| Pricing at scale    | $0.50/M requests   | $0.20/M + duration  |
| KV + D1 co-location | Native             | Requires VPC config |

**Decision:** Every pipeline stage (Loader, Normalizer, Resolver, Router, Writer, Assembler, Trigger, Notifier) runs as an independent Worker. V8 isolates give us sub-millisecond cold starts, which matters when a single account sync fans out across 8 stages. We avoid container orchestration entirely.

**Trade-off accepted:** 128 MB memory cap per Worker. We compensate by streaming large payloads through R2 and keeping each stage stateless.

---

## ADR-2: Why Spine DB (Not Raw Postgres / Firebase)

- Row-Level Security (RLS) gives us tenant isolation without application-layer middleware.
- Realtime subscriptions power the CSM Hub live-update feed without polling.
- PostgREST auto-generates REST endpoints from schema — our "schema-as-backend-IP" principle.
- Auth integrates with our Identity Resolution layer for HITL approval flows.

**Decision:** Spine DB is the persistence layer for Spine. Every entity write lands in Spine DB with RLS enforcing workspace-level isolation. The schema itself encodes business logic (check constraints, triggers, computed columns), making the database the source of truth — not application code.

---

## ADR-3: Why Schema-as-Backend-IP

Traditional SaaS puts business logic in API handlers. We push it into the schema:

- **Entity types** are Postgres enums — adding a new entity type is a migration, not a code change.
- **Confidence scores** are `CHECK (confidence >= 0 AND confidence <= 1)` — enforced at the DB level.
- **Merge rules** are stored as JSONB in `identity_rules` table — the Twin reads them, never invents them.

This means our backend IP is portable, auditable, and version-controlled via migrations.

---

## ADR-4: Why an 8-Stage Pipeline

```
OAuth → Loader → Normalizer → Resolver → Router → Writer → Assembler → Trigger
```

Each stage has a single responsibility and communicates via Cloudflare Queue. Benefits:

1. **Retry isolation** — a Normalizer failure doesn't re-fetch from the source API.
2. **Stage-level metrics** — we know exactly where latency lives.
3. **Independent scaling** — Resolver (identity matching) is CPU-heavy; Writer is I/O-heavy.
4. **DLQ per stage** — dead letters are tagged with the failing stage for fast triage.

---

## ADR-5: Why Entity 360 Is the Single Read Surface for Twin

The Twin Trigger Engine never reads raw Spine tables. It reads the Entity 360 assembled view.

| Concern    | Spine (Write)   | Entity 360 (Read)   | Twin (Reason)  |
| ---------- | --------------- | ------------------- | -------------- |
| Owns       | Raw entity rows | Assembled profiles  | Trigger logic  |
| Reads from | Queues          | Spine tables        | Entity 360 API |
| Writes to  | Spine DB        | Nothing (read-only) | Insight store  |

This boundary ensures the Twin cannot corrupt source data and always reasons over a consistent, assembled entity — not partial writes.

---

## ADR-6: Why Flow C Never Writes to Spine

Flow C (Twin → Insight → UI) is a read-only reasoning path:

1. Twin evaluates triggers against Entity 360 snapshots.
2. Insights are written to `twin_insights` table (separate from Spine entity tables).
3. UI reads insights via the Insight API.

**Why:** If the Twin could write back to Spine, we'd create feedback loops — an insight could change an entity, which fires a new trigger, which generates a new insight. By keeping Flow C write-isolated from Spine, we guarantee convergence.

---

## Decision Log

| ADR                           | Date    | Status   | Owner        |
| ----------------------------- | ------- | -------- | ------------ |
| ADR-1 Cloudflare Workers      | 2025-01 | Accepted | Platform     |
| ADR-2 Spine DB                | 2025-01 | Accepted | Platform     |
| ADR-3 Schema-as-IP            | 2025-02 | Accepted | Architecture |
| ADR-4 8-Stage Pipeline        | 2025-02 | Accepted | Architecture |
| ADR-5 Entity 360 Read Surface | 2025-03 | Accepted | Architecture |
| ADR-6 Flow C Isolation        | 2025-03 | Accepted | Architecture |
