# Detailed User Flows and System Paths — IW Continuity Bridge (v3.7)

**Status:** Canonical reference  
**Last updated:** 2026-06-19  
**Authority:** Extracted from architecture docs, session handoffs, code, and locked decisions (DECISIONS 18–27)  
**Companion:** [USER_SYSTEM_JOURNEY_BLUEPRINT.md](USER_SYSTEM_JOURNEY_BLUEPRINT.md) (layers + stages overview + diagram)

---

## Overview

**User Flows (L0–L7):** What a human experiences.  
**System Paths (S1–S12):** The invisible backend engine that makes it possible.

**Core Invariants (locked):**
- All data originates from or projects from the **Spine** (D1 domain partitions).
- L7 is the **HARD GATE** — no execution without approval token.
- Three data flows:
  - **Flow A** (structured tools) — repeatable loop.
  - **Flow B** (unstructured docs) — one-time normalization.
  - **Flow C** (AI chat / Twin) — always HITL for writes.
- Product is **100% Cloudflare** (D1 + KV + R2 + Vectorize + AI Search + DOs). Legacy Supabase references are migration-only.
- Twin (L3) proposes / hands off playbooks. Never executes on behalf of customer (except Customer Zero ops).

---

## 1. User Flows (L0–L7) — Detailed

### L0 — Onboarding (Spine Context Creation)
**User Intent:** "Connect my world so the AI actually knows my business."

**Detailed Steps (4-step wizard in `apps/web/src/components/activation/onboarding/`):**
1. **Welcome** — Choose useCase (personal | work | business).
2. **Profile** — Industry, department, company size, role. Produces `activeDomain` (e.g. `CUSTOMER_SUCCESS`) and `CTX_*` context.
3. **Goals** — Primary objective + workspace name.
4. **Connect** — OAuth connectors (Nango/MCP). Tagged Flow A/B/C.

**Outcome:**
- `OnboardingData` → `initializeWorkspace({ domain })`
- Spine Context created (`tenant_spine_config`)
- 12×11 schema (domain base + industry overlay) resolved
- "Creamy" initial hydration job started (30-day bounded load)
- Active domain + preference stored in profile + JWT + localStorage

**System Trigger:** S1 (Connectivity) → S2 (Loader) → S3 (Normalizer) → S5 (Spine Write)

**Exit:** User lands at **L1 Workbench** with pre-populated data (not empty dashboard).

**Personal vs Work:**
- Personal always uses `PERSONAL` domain.
- Work uses the chosen domain.

### L0.5 — Always-On Operating Layer (Background)
**User Intent:** Never sees this directly. "The system just works and remembers."

**What happens:**
- `TwinAgent` DO: daily reflection cron (0 5 * * *)
- `TenantBrainDO`: per-tenant signals, 15-min HITL timeouts, pause/resume
- Folder Watcher DO + continuity watchers
- Background normalization, memory promotion, audit logging

**System:** S6 (Intelligence) + S7 (Memory) + S9 (Continuity) + S10 (Twin Runtime) + crons/DOs/Queues

**Surfaces output:** Morning brief in L1, proposals in L2/L5/L7, context for L3.

### L1 — User Workbench (Primary Daily Surface)
**User Intent:** "Show me my world, filtered to what matters right now."

**Detailed Experience:**
- Left nav: Personal + one Work domain (domain-specific modules).
- `DOMAIN_CONTENT_MAP` + `LAYER_MODULES` (twin, memory, operations, execution, governance).
- Creamy projections from Spine (`${domain}_data` via D1-direct or gateway).
- Design tokens: `--iw-forest`, `--iw-gold`, `iw-` classes.
- Entity tables, KPI strips, insights cards, quick actions.

**Domain Differentiation:** Only L1 (and L4) are domain-specific. Everything else is shared overlay.

**Example (Customer Success domain):**
- Accounts, Success Plans, At-Risk signals, Renewals, Initiatives.

**System Path:** S4 (Entity Resolution) + S5 (Spine Write) + projections (gateway workspace-spine).

**Data Rule:** Never raw connector data. Always Spine projection.

### L2 — Intelligence Overlay (⌘J Awareness Drawer)
**User Intent:** "What should I pay attention to right now?"

**Detailed Experience:**
- Global hotkey (⌘J) or sidebar trigger.
- Signals strip (severity, entity-linked).
- Insights panel, Think results, Govern queue, Evidence.
- Filters by current L1 domain but can cross-scope.
- Click → deep link to entity in L1 or proposal in L7.

**System Path:** S6 (Intelligence) — signals, think, proposals. Reads from Spine + memory.

### L3 — Twin Workbench (Reasoning Surface)
**User Intent:** "Talk to the AI that actually knows my context."

**Detailed Experience:**
- Full chat + reasoning blocks (not just bubbles).
- Context seeds from L1 entities + L2 signals + L4 memory.
- Proposes playbooks (never executes directly).
- Voice (STT/TTS via @cloudflare/voice in DO).
- Daily brief, reflection, proposals-in-context.

**Hydration Flow (see Mermaid in blueprint):**
1. Assemble continuity (conversational + org + personal memory).
2. Activation gate (min memories + promoted count).
3. Parallel search: aiSearch + conversationalSearch + mcpSearch.
4. Engineering spine read if needed (D1 `build_data`).
5. DO SQLite recent turns + learned_profile.
6. Gateway chat (CF AI Gateway → OpenRouter or Workers AI fallback).
7. Emit triage event for memory.

**System Path:** S9 (Continuity Bridge) + S10 (Twin Runtime) + S6 (Intelligence).

**Execution Boundary:** Twin outputs → proposal → L7 gate → L6 handoff.

### L4 — Knowledge Workbench ("Remember")
**User Intent:** "Find or promote what the organization knows."

**Detailed Experience:**
- Semantic search across org_memory + promoted knowledge.
- Documents, AI sessions, artifacts.
- Promote / govern flow (staging → approved → published).
- Domain-differentiated (Personal vs Work memory).

**System Path:** S7 (Memory) + governance (S8).

### L5 — Operations Workbench ("Plan")
**User Intent:** "What's happening and what needs planning?"

**Detailed Experience:**
- Situations board, signals stream.
- Proposal pipeline (draft → pending → approved).
- Team / cross-functional views.

**System Path:** S6 (Intelligence) + S8 (Governance).

### L6 — Execution / Handoff Workbench ("Execute")
**User Intent:** "Approved work ready to run or hand off."

**Detailed Experience:**
- Approved queue, running executions, history.
- Playbook viewer + status.
- Writeback audit.

**Two Paths (after L7 approval):**
- **Customer Zero (internal):** Direct execution on Spine partitions.
- **External Customer:** Export canonical Execution Package (JSON). Customer agent runs it. Outcome reported back via `/handoff/outcome`.

**System Path:** S11 (Execution) + S12 (Writeback).

**Hard Gate:** Requires `x-approval-token` from L7.

### L7 — Governance Workbench ("Govern" — HARD GATE)
**User Intent:** "Review, approve, or reject AI proposals. See the full audit."

**Detailed Experience:**
- Pending approvals queue.
- Policy editor.
- Full audit trail (spine_audit_log + governance_data).
- Approve → mints Execution Package + signature.

**System Path:** S8 (Governance).

**Non-negotiable:** No proposal becomes execution without explicit human approval here.

---

## 2. System Paths (S1–S12) — Detailed Backend Engine

The system is event-driven on Cloudflare (Workers + Queues + DOs + D1).

### Ingestion & Truth (Flow A & B)

**S1 — Connectivity**  
Connectors (Nango, direct MCP, webhooks). OAuth flows. `services/connector`.

**S2 — Loader**  
Raw payload intake. Creamy (initial bounded) or delta sync. Sends to `pipeline-process` queue.

**S3 — Normalizer (8-stage LLM-in-the-loop)**  
Implemented in `services/pipeline`:
1. Analyze (schema resolution from `tenant_spine_config`)
2. Classify
3. Filter (idempotency, schema membership)
4. Refine (canonical names)
5. Extract (only allowed fields)
6. Validate
7. Sanity Scan
8. Sectorize (write to correct `${domain}_data` partition)

**S4 — Entity Resolution**  
Deduplication across connectors. Person/Company/Opportunity identity.

**S5 — Spine Write**  
Write to D1 partitions (`decide_data`, `build_data`, `grow_data`, `run_data`, `cross_data`). Source of truth.

### Intelligence & Action

**S6 — Intelligence**  
Signals, Think, Act. Generates proposals. `services/intelligence`.

**S7 — Memory**  
Conversational, org, personal memory. Promotion via Triage Bot. `services/knowledge` + `services/continuity`.

**S8 — Governance (HARD GATE)**  
Proposals, HITL queue, policies, signatures, audit. Only layer that can mint approval tokens.

**S9 — Continuity Bridge**  
Assembles full user/tenant context across memory + Spine + connectors.

**S10 — Twin Runtime**  
`services/iw-agent-runtime` (Durable Objects: TwinAgent, TenantBrainDO, TwinSessionDO). Context hydration, reasoning, proposal generation. CF Agents SDK.

### Execution & Learning

**S11 — Execution**  
Approved proposals → playbook dispatch or direct run (Customer Zero only).

**S12 — Writeback**  
Record outcomes, update Spine, emit memory events, close the loop.

---

## 3. End-to-End Example Flows

### Onboarding Flow (L0 → L1 Desk)
1. User completes L0 wizard → `initializeWorkspace`
2. S1–S2: Connectors registered + creamy job queued
3. S3–S5: Normalizer processes → Spine populated
4. S7 + S9: Memory + Continuity start accumulating
5. Projections generated → L1 Workbench appears pre-filled
6. L0.5 background jobs activate

### Daily Intelligence + Twin Loop (L1 → L2 → L3 → L7 → L6)
1. L1 shows domain dashboard (Spine projections).
2. L2 (⌘J) surfaces signals from S6.
3. User opens L3 Twin → hydrated context (S9 + S10).
4. Twin reasons → creates proposal (S6 → S8).
5. User goes to L7 → reviews + approves (mint token).
6. L6 shows approved item → handoff or execute (S11/S12).
7. Outcome → memory promotion (S7) → future context improved.

### Governance Enforcement (Always)
- Any proposal path must hit L7.
- No `x-approval-token` = execution blocked.
- All actions logged to `spine_audit_log` + governance_data.

---

## 4. Key Design Rules & Data Invariants

- **Projections only** — UI never sees raw connector tables.
- **Domain scoping** — L1/L4 differentiated; L2/L3/L5/L6/L7 shared overlays.
- **Execution Boundary** — Twin proposes. Customer (or Customer Zero) executes.
- **Triage Bot** — Sole writer to promoted memory.
- **Audit Everything** — Spine access + proposals produce immutable logs.
- **CF Native** — All runtime state in D1/KV/DOs/Queues. No dual-write.

---

This document is the detailed expansion of the high-level layers and stages. It is derived from the locked blueprint, end-to-end docs, flow traces, handoffs, and code. When in doubt, code + this file + `USER_SYSTEM_JOURNEY_BLUEPRINT.md` are authoritative.

For visual overview, see the Mermaid diagram in the blueprint.
