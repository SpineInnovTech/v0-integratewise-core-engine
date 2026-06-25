# IntegrateWise Product Architecture Document

## v3.7 — External Customer Surface Lock

**Date:** June 18, 2026  
**Status:** Canonical — Engineering & Product Source of Truth  
**Classification:** Internal + Customer-Facing Specification

---

## 1. Product Positioning

IntegrateWise is the system that understands, remembers, reasons, and prepares execution — while execution happens in the customer's own environment.

We do not compete with workflow engines, agent runtimes, or automation platforms. We compete with the chaos of fragmented tools, disconnected context, and blind operational decisions.

### The Wedge

Every enterprise has 15+ tools. None of them talk to each other. The human operator becomes the integration layer — cross-referencing, reconciling, deciding, then manually updating each system. IntegrateWise replaces that human integration burden with a unified intelligence layer that:

- **Connects** — ingests and normalizes data from all tools (S1–S3)
- **Unifies** — resolves entities and builds a single source of truth (S4–S5)
- **Understands** — surfaces signals, insights, and context (L2, S6)
- **Remembers** — maintains organizational and personal memory (L4, S7)
- **Reasons** — proposes actions, mutations, and workflows via Twin (L3, S10)
- **Governs** — ensures every action is approved before it leaves the system (Approval Center, S8)
- **Prepares** — packages execution into a vendor-neutral canonical contract (Handoff Layer)
- **Hands Off** — dispatches to the customer's own execution infrastructure (Async, Adapters)

---

## 2. The Two Modes

### 2.1 Customer Zero Mode (IntegrateWise Internal)

**Full Stack — All 7 Layers + 12 Backend Stages**  
Used for:

- Internal IntegrateWise operations
- Sales demos showcasing end-to-end capability
- Customer Zero verification and dogfooding

| Layer | Name                      | Visibility    |
| :---- | :------------------------ | :------------ |
| L0    | Onboarding                | Customer      |
| L0.5  | Always-On Operating Layer | Background    |
| L1    | Domain Workbench          | Customer      |
| L2    | Cognitive Overlay         | Customer      |
| L3    | Twin Workbench            | Customer      |
| L4    | Memory Workbench          | Customer      |
| L5    | Operations Workbench      | Internal Only |
| L6    | Execution Workbench       | Internal Only |
| L7    | Governance Workbench      | Internal Only |

In Customer Zero mode, L5 and L6 are visible. S11 (Execution) and S12 (Writeback) run natively. The full loop is closed inside IntegrateWise.

### 2.2 External Customer Mode

**Trimmed Surface — 5 Layers + Handoff Layer**

| Layer | Customer Name     | Internal Name        | Purpose                    |
| :---- | :---------------- | :------------------- | :------------------------- |
| L1    | Workbench         | Domain Workbench     | Main operational surface   |
| L2    | Cognitive Overlay | Intelligence Overlay | Signals, insights, context |
| L3    | Twin Workbench    | Twin Workbench       | Chat, reasoning, planning  |
| L4    | Memory Workbench  | Memory Workbench     | Search, memory, documents  |
| —     | Approval Center   | L7 Governance        | Approvals, audit, dispatch |

**Removed from customer view:**

- L5 Operations Workbench (Situations board, signals stream, proposal pipeline)
- L6 Execution Workbench (Ready queue, running executions, writeback audit)
- Native S11 Execution and S12 Writeback

**Replaced with:**

- Handoff Layer — Canonical JSON contract + adapter exports
- Async State Machine — Tracked execution states with signal-based feedback

---

## 3. The Five Customer Surfaces

### 3.1 L1 — Workbench

**Intent:** Primary operational surface for the user's domain.

**What the user sees:**

- Domain-specific dashboards (Account Success, Sales, BizOps, RevOps, Product Engineering, Marketing, Personal)
- Entity 360 views (accounts, contacts, opportunities, tickets)
- Cross-tool data unified from the Spine
- Contextual actions and quick insights

**Domain rules:**

- One work domain per user (chosen at onboarding, locked)
- Personal domain always available (PERSONAL)
- Data comes from `${domain}_data` Spine partition only
- No raw tool data ever shown

_Key invariant:_ L1 is strictly differentiated by domain. The UI, modules, and data partitions change based on the active domain.

### 3.2 L2 — Cognitive Overlay

**Intent:** Always-available intelligence surface that sits on top of L1.  
**Trigger:** `⌘J` (or equivalent keyboard shortcut) sliding drawer/panel.

**What the user sees:**

- Signals — anomalous patterns, risk indicators, opportunity alerts
- Insights — synthesized observations with evidence and context
- Think — reasoning traces and hypothesis generation
- Govern — governance status indicators
- Context — assembled entity context from the Spine
- Evidence — source references and confidence scores

**Domain handling:** Shared surface. Filters by active domain context. Can scope to current work view.

**Interaction model:**

- Read-heavy by design
- Users can promote an insight to a proposal (triggers Twin)
- Users can query context directly
- No direct mutations from L2

### 3.3 L3 — Twin Workbench

**Intent:** Conversational reasoning and planning interface.

**What the user sees:**

- Chat interface with streaming responses
- Reasoning surface (chain-of-thought, plan generation)
- Workflow design and proposal creation
- Context-aware suggestions

**How Twin gets context:**

- Seeded from active domain entities (L1 context)
- Injected with L2 signals and insights
- Enriched with L4 memory (relevant documents, past sessions)
- Governed by S9 Continuity Bridge (assembled context package)

**Twin's role in the handoff flow:**

- User asks Twin to plan a workflow or propose a mutation
- Twin generates a structured proposal (actions + mutations + context + success criteria)
- Proposal is pushed to Approval Center (status: `PENDING_REVIEW`)
- Twin does NOT auto-dispatch. Human-in-the-loop is mandatory.

_Backend:_ S10 Twin Runtime (`iw-agent-runtime`, Cloudflare DOs, SQLite state). No OpenWebUI. No CouchDB.

### 3.4 L4 — Memory Workbench

**Intent:** Knowledge substrate — search, organize, and retrieve organizational and personal memory.

**What the user sees:**

- Semantic search across org memory, personal memory, documents, AI sessions
- Memory organization (tags, categories, promoted knowledge)
- Document management (upload, reference, ground truth)
- Session history and continuity
- Governance status on memory items (staging / approved / published)

**Domain handling:** Differentiated. Memory layer is scoped to the active domain. Search and retrieval filter by domain partition.

**Write path:**

- `memory.propose` is live at the tool/protocol level (MCP handler → proposals table → governance queue)
- Direct writes to `org_memory` are blocked — all writes go through `propose` → governance
- L4 UI is currently read-heavy; the dedicated "Propose to Memory" form is partial (🟡)

_Key invariant:_ Memory is never written directly. It is always proposed, governed, and then committed.

### 3.5 Approval Center

**Intent:** The single place where users see, review, approve, reject, and dispatch proposed actions.

**What the user sees:**

- **Pending** — proposals awaiting review (from Twin, from L2 insights, from system signals)
- **Approved** — actions that passed governance, ready for dispatch
- **Rejected** — actions that were denied, with reasoning
- **Handed Off** — actions dispatched to customer's execution environment
- **Audit Trail** — complete history of every proposal, approval, and outcome

**The flow:**

```text
[Twin Proposes] → [Approval Center: Pending] → [User Reviews] → [User Approves] → [User Dispatches] → [Handoff Package Generated] → [Async Tracking]
```

**No auto-dispatch.** The user must explicitly choose:

- Export to Hermes
- Export to OpenClaw
- Export as JSON
- Export as MCP

**Governance stamp:** Every approved proposal carries:

```json
{
  "governance": {
    "approval_token": "iw-gov-{uuid}",
    "approved_at": "ISO8601",
    "approved_by": "user_id",
    "proposal_id": "prop-{uuid}",
    "audit_hash": "sha256:{hash}",
    "expiry": "ISO8601 (+1 hour default)"
  }
}
```

_HARD GATE invariant:_ No handoff package can be generated without an L7 approval token. The Approval Center is the only surface that can mint this token.

---

## 4. The Handoff Layer

### 4.1 Philosophy

IntegrateWise does not execute for external customers. It prepares, governs, and hands off.  
The handoff layer is the bridge between IntegrateWise's intelligence and the customer's execution infrastructure.

### 4.2 Canonical Handoff Contract

```json
{
  "version": "1.0.0",
  "proposal_id": "prop-uuid",
  "handoff_id": "handoff-uuid",
  "generated_at": "2026-06-18T14:58:00Z",
  "type": "workflow",

  "actions": [
    {
      "id": "act-1",
      "type": "workflow",
      "name": "Executive Review Scheduling",
      "description": "Schedule executive review for high-risk renewal account",
      "tool_refs": ["hubspot", "calendar"],
      "parameters": {
        "account_id": "acc_123",
        "review_type": "executive",
        "priority": "high"
      },
      "dependencies": []
    }
  ],

  "mutations": [
    {
      "id": "mut-1",
      "type": "mutation",
      "target": "hubspot.account",
      "entity_id": "acc_123",
      "operation": "update",
      "changes": {
        "renewal_risk": "medium",
        "next_action": "Executive Review Scheduled"
      },
      "previous_state": {
        "renewal_risk": "high",
        "next_action": null
      },
      "conflict_resolution": "merge_with_audit"
    }
  ],

  "context": {
    "domain": "CUSTOMER_SUCCESS",
    "entity_context": {
      "account": {
        "id": "acc_123",
        "name": "Acme Corp",
        "arr": 850000,
        "health_score": 72
      }
    },
    "assembled_history": [
      {
        "event": "risk_escalation",
        "timestamp": "2026-06-15T10:00:00Z",
        "source": "support_ticket"
      }
    ],
    "goal_refs": ["goal_reduce_churn_q3", "goal_expand_acme_2026"],
    "relevant_memory": ["mem-uuid-1", "mem-uuid-2"]
  },

  "governance": {
    "approval_token": "iw-gov-uuid",
    "approved_at": "2026-06-18T14:58:00Z",
    "approved_by": "user_id",
    "proposal_id": "prop-uuid",
    "audit_hash": "sha256:...",
    "expiry": "2026-06-18T15:58:00Z",
    "approval_scope": "single_execution",
    "risk_classification": "medium"
  },

  "success_criteria": [
    {
      "id": "sc-1",
      "metric": "hubspot.account.renewal_risk",
      "expected": "medium",
      "verification": "direct_read"
    },
    {
      "id": "sc-2",
      "metric": "calendar.event.created",
      "expected": true,
      "verification": "existence_check"
    }
  ],

  "metadata": {
    "twin_session_id": "twin-uuid",
    "source_insight_id": "insight-uuid",
    "estimated_execution_time": "120s",
    "retry_policy": {
      "max_retries": 2,
      "backoff": "exponential"
    }
  }
}
```

### 4.3 Field Definitions

| Field            | Type   | Required | Description                                        |
| :--------------- | :----- | :------- | :------------------------------------------------- |
| version          | string | Yes      | Contract version (semver)                          |
| proposal_id      | string | Yes      | Original proposal ID from Twin                     |
| handoff_id       | string | Yes      | Unique ID for this handoff instance                |
| type             | enum   | Yes      | workflow, mutation, composite                      |
| actions          | array  | No       | Workflow triggers (read operations, orchestration) |
| mutations        | array  | No       | State changes (writes, updates, deletes)           |
| context          | object | Yes      | Assembled Spine context for the customer's agent   |
| governance       | object | Yes      | Approval token and audit metadata                  |
| success_criteria | array  | Yes      | How the customer agent verifies success            |
| metadata         | object | No       | Execution hints, retry policy, session refs        |

_Rule:_ Either `actions` or `mutations` (or both) must be non-empty. A handoff with neither is invalid.

### 4.4 Adapter Layer

The canonical contract is vendor-neutral. Adapters translate it to target formats:

```text
Canonical Handoff
       ↓
┌──────────────────┐
│ Adapter Layer    │
├──────────────────┤
│ JSON (raw)       │ — Direct export, human-readable
│ MCP              │ — Model Context Protocol tool calls
│ LangGraph        │ — LangChain/LangGraph state graph
│ Hermes           │ — IntegrateWise internal runtime (Customer Zero)
│ OpenClaw         │ — Customer's agent runtime
│ n8n              │ — n8n workflow JSON
│ Zapier           │ — Zapier action payload
└──────────────────┘
```

Each adapter:

- Validates the canonical contract against schema
- Maps actions/mutations to target-specific format
- Preserves the governance stamp (token + audit hash)
- Preserves success criteria in target-verifiable form
- Returns the adapted payload + metadata

---

## 5. Async State Machine

### 5.1 States

```text
[PENDING_REVIEW]        — Proposal created by Twin, awaiting review
       ↓
[APPROVED]              — User approved in Approval Center
       ↓
[HANDED_OFF]            — User dispatched, package generated, sent to customer
       ↓
[AWAITING_OUTCOME]      — Customer agent acknowledged, executing
       ↓
[COMPLETED]             — Success criteria met, outcome recorded
       ↓
[FAILED]                — Execution failed, error recorded
       ↓
[PARTIAL]               — Some success criteria met, partial outcome
       ↓
[EXPIRED]               — Governance token expired before execution
       ↓
[REJECTED]              — User denied in Approval Center
```

### 5.2 State Transitions

| From             | To               | Trigger                                  | Actor          |
| :--------------- | :--------------- | :--------------------------------------- | :------------- |
| PENDING_REVIEW   | APPROVED         | User clicks "Approve"                    | Human          |
| PENDING_REVIEW   | REJECTED         | User clicks "Reject"                     | Human          |
| APPROVED         | HANDED_OFF       | User selects adapter + clicks "Dispatch" | Human          |
| HANDED_OFF       | AWAITING_OUTCOME | Customer agent acknowledges receipt      | System         |
| AWAITING_OUTCOME | COMPLETED        | Outcome webhook reports success          | System         |
| AWAITING_OUTCOME | FAILED           | Outcome webhook reports failure          | System         |
| AWAITING_OUTCOME | PARTIAL          | Outcome webhook reports partial          | System         |
| AWAITING_OUTCOME | EXPIRED          | Governance token expires                 | System (alarm) |

### 5.3 L2 Signal Mapping

Each state change surfaces in L2 as a signal:

| State            | L2 Signal                                | Urgency |
| :--------------- | :--------------------------------------- | :------ |
| HANDED_OFF       | "Sent to {adapter_name}"                 | Info    |
| AWAITING_OUTCOME | "Awaiting outcome from {adapter_name}"   | Info    |
| COMPLETED        | "Execution completed: {summary}"         | Success |
| FAILED           | "Execution failed: {error_summary}"      | Warning |
| PARTIAL          | "Partially completed: {details}"         | Warning |
| EXPIRED          | "Handoff expired — re-approval required" | Error   |

### 5.4 L4 Memory Mapping

Every handoff outcome is recorded in L4 as an `execution_memory` entry:

```json
{
  "type": "execution_memory",
  "handoff_id": "handoff-uuid",
  "proposal_id": "prop-uuid",
  "outcome": "completed | failed | partial | expired",
  "timestamp": "ISO8601",
  "adapter": "hermes | openclaw | json | mcp | ...",
  "success_criteria_results": [...],
  "error_details": "...",
  "governance_token": "iw-gov-uuid",
  "linked_entities": ["acc_123"],
  "linked_goals": ["goal_reduce_churn_q3"]
}
```

---

## 6. API Contracts

### 6.1 Handoff Generation

```http
POST /api/v1/handoff/generate
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "proposal_id": "prop-uuid",
  "adapter": "json | mcp | hermes | openclaw | n8n | langgraph"
}
```

**Response: 200 OK**

```json
{
  "handoff_id": "handoff-uuid",
  "status": "generated",
  "payload": { ... canonical contract ... },
  "adapted_payload": { ... adapter-specific format ... },
  "governance_token": "iw-gov-uuid",
  "expires_at": "2026-06-18T15:58:00Z",
  "download_url": "https://api.integratewise.ai/v1/handoff/download/handoff-uuid"
}
```

### 6.2 Outcome Ingestion

```http
POST /api/v1/handoff/outcome
Authorization: Bearer {api_key}  // Customer's system API key
Content-Type: application/json

{
  "handoff_id": "handoff-uuid",
  "governance_token": "iw-gov-uuid",
  "status": "completed | failed | partial",
  "timestamp": "ISO8601",
  "results": {
    "success_criteria": [
      {
        "id": "sc-1",
        "met": true,
        "actual_value": "medium",
        "verification_method": "direct_read"
      }
    ],
    "error": null,
    "logs": ["..."]
  }
}
```

**Response: 200 OK**

```json
{
  "received": true,
  "memory_id": "mem-uuid",
  "signal_id": "sig-uuid"
}
```

### 6.3 Status Polling

```http
GET /api/v1/handoff/status/:handoff_id
Authorization: Bearer {jwt}
```

**Response: 200 OK**

```json
{
  "handoff_id": "handoff-uuid",
  "status": "handed_off | awaiting_outcome | completed | failed | partial | expired",
  "proposal": { ... },
  "governance": { ... },
  "outcome": { ... },
  "timeline": [
    {"state": "approved", "at": "..."},
    {"state": "handed_off", "at": "..."},
    {"state": "awaiting_outcome", "at": "..."}
  ]
}
```

---

## 7. Backend Architecture (S1–S12)

### 7.1 Stages

| Stage | Name              | Purpose                         | Customer Zero | External Customer                |
| :---- | :---------------- | :------------------------------ | :------------ | :------------------------------- |
| S1    | Connectivity      | Connectors / Nango / MCP        | ✅ Active     | ✅ Active                        |
| S2    | Loader            | Ingest raw data                 | ✅ Active     | ✅ Active                        |
| S3    | Normalizer        | 8-stage pipeline                | ✅ Active     | ✅ Active                        |
| S4    | Entity Resolution | Spine deduping                  | ✅ Active     | ✅ Active                        |
| S5    | Spine Write       | D1 partitions (source of truth) | ✅ Active     | ✅ Active                        |
| S6    | Intelligence      | Signals, think, proposals       | ✅ Active     | ✅ Active                        |
| S7    | Memory            | Org + personal + conversational | ✅ Active     | ✅ Active                        |
| S8    | Governance        | Approvals, policies, audit      | ✅ Active     | ✅ Active                        |
| S9    | Continuity Bridge | Assembled context               | ✅ Active     | ✅ Active                        |
| S10   | Twin Runtime      | iw-agent-runtime (DOs)          | ✅ Active     | ✅ Active                        |
| S11   | Execution         | Handoff / playbook dispatch     | ✅ Active     | ❌ Bypassed → Handoff            |
| S12   | Writeback         | Record outcomes                 | ✅ Active     | ❌ Delegated → Outcome Ingestion |

### 7.2 L0.5 Always-On Operating Layer

Non-UI background layer. Runs continuously.

**Components:**

- **TwinAgent** — Background reasoning, proposal generation, alarm handling
- **TenantBrainDO** — Per-tenant state, pending approvals, active signals, execution tracking
- **Watcher DO** — Monitors data freshness, connector health, anomaly detection
- **Cron Jobs** — Scheduled context assembly, memory compaction, signal generation

_Critical note for external customers:_  
L0.5's escalation bypass path (where `TenantBrainDO` can mint an `escalation-bypass-token` on alarm timeout) is Customer Zero only. For external customers, L0.5 is strictly read/propose-only. Any proposal from L0.5 goes to Approval Center. No execution bypass exists.

---

## 8. Data Flow: End-to-End

### 8.1 External Customer Flow

```text
[User edits Renewal Risk in L1]
         ↓
[Change captured as proposed mutation]
         ↓
[Twin (L3) generates structured proposal]
         ↓
[Proposal pushed to Approval Center — PENDING_REVIEW]
         ↓
[User reviews in Approval Center]
         ↓
[User APPROVES]
         ↓
[User selects adapter: "Export to OpenClaw"]
         ↓
[Canonical Handoff Contract generated]
         ↓
[Adapted to OpenClaw format]
         ↓
[Package dispatched to customer's OpenClaw endpoint]
         ↓
[Status: HANDED_OFF → AWAITING_OUTCOME]
         ↓
[Customer's OpenClaw executes: updates HubSpot, schedules calendar]
         ↓
[OpenClaw POSTs outcome to /api/v1/handoff/outcome]
         ↓
[IntegrateWise validates governance token]
         ↓
[Status: COMPLETED]
         ↓
[L2 Signal: "Execution completed: Account renewal risk updated"]
         ↓
[L4 Memory: execution_memory entry recorded]
         ↓
[L1 Workbench: Account card refreshed from Spine]
```

### 8.2 Customer Zero Flow (Full Loop)

```text
[Same path through Approval Center]
         ↓
[User selects adapter: "Execute via Hermes"]
         ↓
[Canonical contract adapted to Hermes format]
         ↓
[Hermes (S11) executes directly on IntegrateWise infrastructure]
         ↓
[S12 Writeback records outcomes to Spine]
         ↓
[L2 Signal + L4 Memory + L1 Refresh]
```

---

## 9. Key Invariants

1. **Spine-Only Reads:** The UI (all layers) only ever reads projections assembled from the Spine. Raw data is never shown.
2. **HARD GATE:** Approval Center is the only surface that can mint an approval token. No handoff package can be generated without it.
3. **No Auto-Dispatch:** The user must explicitly dispatch an approved proposal. Twin does not auto-execute.
4. **Async Execution:** All handoffs are async. The UI never blocks waiting for execution.
5. **Vendor-Neutral Contract:** The canonical handoff format is adapter-agnostic. IntegrateWise does not lock customers into a specific execution runtime.
6. **Mutations Included:** Handoffs support state changes (writes, updates, deletes), not just workflow triggers.
7. **Outcome Feedback:** Customer execution agents must POST outcomes back to IntegrateWise. Without this, the loop is broken.
8. **Domain Differentiation:** L1 and L4 are differentiated by domain. L2, L3, Approval Center, and handoff layer are shared.
9. **No Direct Execution for External Customers:** S11 and S12 are bypassed for external customers. Execution happens in the customer's environment.
10. **L0.5 Escalation Bypass — Customer Zero Only:** The alarm timeout escalation path is restricted to internal IntegrateWise operations.

---

## 10. Design System

### 10.1 Colors

```css
:root {
  --iw-ink: #0c0c0c;
  --iw-paper: #f4f0eb;
  --iw-forest: #232d42;
  --iw-gold: #c9a96e;
  --iw-primary: #4356a9;
  --iw-primary-pink: #eb4f72;
  --iw-bg: #edeef0;
}
```

### 10.2 Typography

- **Primary:** Inter, Poppins
- **Monospace:** IBM Plex Mono

### 10.3 Aesthetic

- Minimal, calm, systems-oriented
- Whitespace, rounded rectangles, simple lines/nodes
- Grid-aligned diagrams, flat vectors
- No gradients, no 3D, no heavy shadows

---

## 11. Implementation Maturity (June 2026)

| Component                  | Status      | Notes                                                         |
| :------------------------- | :---------- | :------------------------------------------------------------ |
| L0 Onboarding              | ✅ Solid    | 4-step wizard, domain resolution, JWT metadata                |
| L1 Workbench               | ✅ Solid    | `DOMAIN_CONTENT_MAP`, per-domain modules, design tokens clean |
| L2 Cognitive Overlay       | ✅ Solid    | Functional, cognitive signals, insight panel                  |
| L3 Twin Workbench          | ✅ Solid    | Native Cloudflare DOs, streaming, context seeding             |
| L4 Memory Workbench        | 🟡 Partial  | Read surface solid; write surface (propose form) partial      |
| L5 Operations              | ✅ Internal | Functional for Customer Zero                                  |
| L6 Execution               | ✅ Internal | Functional for Customer Zero                                  |
| L7 Governance              | ✅ Internal | Functional for Customer Zero                                  |
| Approval Center (External) | 🎯 Target   | Needs UI build, dispatch flow, adapter selection              |
| Handoff Layer              | 🎯 Target   | Canonical contract defined; adapters need implementation      |
| Async State Machine        | 🎯 Target   | States defined; webhook endpoints need build                  |
| Outcome Ingestion          | 🎯 Target   | API spec defined; implementation pending                      |
| S11 Bypass for External    | 🎯 Target   | Logic flag needed in S8/S11 boundary                          |
| Adapter Layer              | 🎯 Target   | JSON adapter first; MCP, Hermes, OpenClaw, n8n follow         |

---

## 12. Glossary

| Term                   | Definition                                                                                                |
| :--------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Spine**              | Single Source of Truth — unified intelligence layer connecting tools, context, and decisions              |
| **Twin**               | Conversational AI workbench that reasons, plans, and proposes                                             |
| **Approval Center**    | Customer-facing governance surface for reviewing, approving, and dispatching proposals                    |
| **Handoff**            | The act of packaging an approved proposal into a vendor-neutral contract for external execution           |
| **Canonical Contract** | The vendor-neutral JSON format that defines actions, mutations, context, governance, and success criteria |
| **Adapter**            | A translator that converts the canonical contract into a target execution format (MCP, Hermes, etc.)      |
| **HITL**               | Human-in-the-Loop — mandatory human approval before any action leaves the system                          |
| **HARD GATE**          | The invariant that no execution token can exist without L7/Approval Center approval                       |
| **Customer Zero**      | IntegrateWise's own internal operations — the dogfood tenant that uses the full stack                     |
| **Domain**             | The user's chosen work context (CUSTOMER_SUCCESS, SALES, BIZOPS, etc.)                                    |
| **L0.5**               | The always-on background operating layer (DOs, crons, agents)                                             |

---

## 13. Document Control

| Version | Date       | Author                 | Changes                                                                                                                          |
| :------ | :--------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| 3.7     | 2026-06-18 | Product + Architecture | External customer surface lock, handoff layer specification, Approval Center definition, async state machine, canonical contract |

**Next Review:** Upon completion of Approval Center UI and Handoff Layer implementation.

_This document is the canonical source of truth for IntegrateWise product architecture as of June 2026. All engineering, design, and go-to-market decisions must align with this specification._
