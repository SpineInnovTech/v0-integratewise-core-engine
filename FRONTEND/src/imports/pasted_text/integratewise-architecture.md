# IntegrateWise — Consolidated System Architecture
**Version:** Final
**Date:** June 22, 2026
**Status:** Canonical reference — verify against deployed state before engineering decisions

---

## What IntegrateWise Is

A **Continuity Operating System** — not an AI product, not an integration platform.

> The continuity layer beneath all your tools and AIs. Connect once. Every platform you use gets the same truth. Every session builds on the last. When your tools change, your context stays.

**Core doctrine:**
> Truth you own. AI you rent. Approval in between.

**The moat:** SPINE + Memory + Continuity + Governance + 132 Solution Surfaces. Not the infrastructure — that's replaceable. The compounding organisational truth is what can't be copied quickly.

---

## The Five-Level Architecture

```
Level 1 — SPINE Domains (permanent truth)
Level 2 — Platform Capabilities (machinery)
Level 3 — Solution Matrix 12×11 (what customers buy)
Level 4 — Projections (how it's consumed)
Level 5 — Runtime & Infrastructure (replaceable)
```

**Rule:** Never mix levels. Customer conversations happen at Level 3. Engineering at Level 2. Infrastructure at Level 5.

---

## Level 1 — SPINE Domains

The Spine is the **Context and Continuity Enabler** — not a database, not a single source of truth. It enables context to exist and continuity to compound.

```
Identity          Knowledge         Governance
Organization      Spine             Execution
Systems           Entity360         Continuity
Integrations      Intelligence      Security
Data              Workflow
Memory
```

---

## Level 2 — Platform Capabilities

```
Twin              Workflow Engine
Agent Fabric      Governance Engine
MCP               Execution Engine
ADK               Continuity Engine
Handoffs
Connector Runtime
Schema AI
```

---

## Level 3 — Solution Matrix

12 functional areas × 11 capabilities = 132 solution surfaces.

**What customers buy:** Customer Success Twin · Sales Twin · RevOps Twin · Finance Twin · Engineering Twin · Leadership Twin · Business Ops Twin · Marketing Twin · HR Twin · Support Twin · Product Twin · Personal OS Twin

---

## Level 4 — Projections

Everything is a projection of the same Spine:

| Type | Examples |
|------|---------|
| Human | Workbench, Home, Catch-Up, Runway, Warm, Act, Repeat, Report, Overdues |
| AI | Twin Board, Memory Assistant, Signal Assistant |
| Developer | MCP (`mcp.integratewise.ai`), API, SDK, CLI |
| Connector | Nango, Provider Adapters, Webhook Surfaces |
| Agent | ADK Agents, External Agents, Partner Agents |

---

## Level 5 — Runtime & Infrastructure

**Fully Cloudflare-native.**

| Service | Purpose |
|---------|---------|
| CF Workers (~18 canonical) | Gateway + all backend services |
| CF D1 | Canonical Spine — ACID, partitioned, append-only |
| CF Durable Objects | Twin runtime, session state, coordination |
| CF KV (~15 namespaces) | Sessions, cache, projections, endpoint registry |
| CF R2 | Files, artifacts, audit logs |
| CF Vectorize (2) | Semantic embeddings, knowledge search |
| CF Queues (~11) | Pipeline, knowledge ingest, memory, signals, DLQ |
| Nango | Credential wall — OAuth tokens never touch application code |
| LiteLLM / OpenRouter | LLM routing — Claude, OpenAI, Gemini |
| Clerk | Auth + tenant/org management + SSO |
| Razorpay | Billing + subscription metering (INR-native) |

**Target canonical Workers (~18):**
`integratewise-gateway · integratewise-intelligence · integratewise-pipeline · integratewise-connector · integratewise-knowledge · integratewise-continuity · integratewise-l2 · integratewise-workflow · iw-agent-runtime · integratewise-mcp-connector · integratewise-webhook-ingress · integratewise-folder-watcher · integratewise-connector-sync · integratewise-billing · integratewise-tenants · integratewise-admin · integratewise-web`

---

## Tenant Creation Flow

```
Voice / Clerk creates tenant
        ↓
Tenant record written to D1
        ↓
Schema AI initialises default schemas for tenant's domain
        ↓
Nango connector connect fires
        ↓
Schema AI generates connector schema from sample payload
        ↓
Spine hydration begins against active schema
        ↓
First entity written to D1 under validated schema
        ↓
Bridge activates (integratewise-continuity-bridge MCP)
```

---

## Surface Layer

All surfaces are disposable, replaceable, white-labelable. They call the same backend.

| Surface | Transport | Auth |
|---------|-----------|------|
| CF Pages (native) | Service bindings (zero latency) | JWT |
| Replit (dev tool) | HTTPS REST / WebSocket / MCP | API key |
| Customer Portal | HTTPS REST | API key |
| Platform Embed | HTTPS REST / MCP | API key |

---

## Gateway Layer (The Contract)

One Worker: `integratewise-gateway`

**Endpoints:**
```
POST /api/v1/entity/:type/:id     → Entity 360
POST /api/v1/memory/query          → Semantic search
POST /api/v1/twin/propose          → Twin proposal
POST /api/v1/signals               → Active signals
POST /api/v1/insights              → Generated insights
POST /api/v1/predictions           → Predictions
POST /api/v1/handoff               → Handoff dispatch
WS   /api/v1/stream                → Real-time SSE/WebSocket
MCP  /api/v1/mcp                   → MCP Server
GET  /api/v1/health                → Health / Info
```

Auth: API keys for external callers · JWT for internal (service bindings) · Same backend code.

---

## Core Services (Internal — Service Bindings Only)

### Connector Service (Nango + Sync)
Tool configs + mappings · Webhook receivers · Change capture · Sync orchestration · Backfill + re-sync

### Spine Service (Normalise + Graph)
Normalization · Entity Resolution · Identity Graph · Event Log · Canonical Writes

### Continuity Engine (Memory Lifecycle — The Moat)

Seven stages:
1. **Memory Intake** — Everything observed becomes an observation
2. **Classification** — What kind of signal is this? (Noise/Observation/Fact/Decision/Commitment/Outcome/Playbook/Relationship/Policy/Knowledge)
3. **Validation** — Evidence present? Confidence high? Cross-source verified? Policy compliant? Human required?
4. **Promotion** — Only what matters becomes memory. Promotion Review · Human Approve · Auto-approve (high) · Reject / Hold back · Version + Lineage
5. **Memory Store** — Persisted institutional memory: Stable Facts · Decisions · Commitments · Playbooks · Episodes · Policies
6. **Continuity Graph** — Everything connected with meaning
7. **Memory Decay** — Not everything lives forever: Observation → expires · Decision → long term · Policy → permanent · Playbook → versioned · Noise → discarded

### Twin Service (Reasoning + Memory)
Context Assembly · Reasoning · Proposals · Explainability · Memory Retrieval · Tool Recommendations

### Governance Service (Approval Gate)
Policy Evaluation · Confidence Scoring · Human Review Queue · Approval / Rejection · Audit + Lineage · Escalation Rules

---

## Schema AI

Internal service at `services/intelligence/schema_ai/`.

**Four responsibilities:**
1. Connector Schema Generation — from sample payload or API spec
2. DB Write Format Enforcement — no write without active schema
3. Schema Evolution — detect drift, propose version updates
4. Cross-Connector Harmonization — HubSpot Contact = Salesforce Lead = Pipedrive Person

**Lifecycle:** proposed → reviewed → approved → active → deprecated

**Harmonization groups:** person · deal · company · activity · document

---

## Data Layer

| Store | Purpose |
|-------|---------|
| D1 (Spine DB) | Canonical truth. ACID, partitioned, append-only |
| Durable Objects | Twin state, workflow coordination |
| KV | Sessions, hot projections, entity views, aggregates |
| R2 | Raw events, attachments, audit logs |
| Vectorize | Semantic index, hybrid search, RAG foundation |
| AI Search | Full text + vector, knowledge search |
| Queues | Ingest, jobs, workflows, retries, DLQ |

---

## Endpoint Registry

Living API contract — in Spine Cache (KV) + D1.

Every endpoint Kiro creates or modifies is registered here.

Fields: Path + Method · Service Owner · Auth Type · Version · Description · Status · Surface Access · When · Change Summary

Read by: Gateways, Agents, Frontends, Docs, Tests

---

## The Continuity Bridge

**Connector name:** `integratewise-continuity-bridge`
**Listed in:** Claude connector marketplace · ChatGPT plugin directory · Replit integrations · Any MCP-compatible surface

**Two states:**
- State A: Not authenticated → redirect to integratewise.ai
- State B: Authenticated + Spine hydrated → serves governed context

**Three prerequisites before activation:**
1. Valid IntegrateWise tenant (Clerk)
2. At least one tool connected (Nango)
3. At least one entity in D1 (Spine hydrated)

---

## The Operational Loop

```
Observe → Understand → Propose → Govern → Act → Return → Learn
```

Every loop makes the next one smarter. The loop is the product.

---

## Key Invariants (Never Violate)

1. **No write without active schema** — Schema AI governs all writes
2. **No action without governance approval** — HARD GATE, no bypass
3. **No auto-dispatch** — Human must explicitly approve and dispatch
4. **Credentials never touch application code** — Nango is the wall
5. **Agents never communicate directly** — Spine is the only switchboard
6. **Return-derived truth is verified, not assumed** — Wait for world confirmation
7. **Frontend owns no state** — All truth lives in backend
8. **Memory writes go through Triage Bot** — Never direct to org_memory

---

## Cross-Cutting Concerns

**Security:** WAF · Rate Limit · DDoS / Bot Mgmt · TLS Everywhere · Secrets Mgmt · Zero Trust

**Observability:** Logs · Metrics · Traces · Alerts · Audit Trails

**Reliability:** Idempotency · Retries · DLQ · Reprocess · Backpressure

**Compliance:** Audit + Lineage · Data Retention · Field Level Security · Encryption · Tenant Isolation

---

## The Outcome

- Warm starts, never cold
- No data silos
- Explainable AI
- Governed automation
- Compounding intelligence
- **Your truth, your continuity**

---

## Open Items (Carry Forward — Unresolved)

| Item | Status |
|------|--------|
| Supabase — fully retired or still active? | ⚠️ Unconfirmed |
| Hermes — retired or canonical service? | ⚠️ Unconfirmed |
| L0.5 bypass token tenant-gating in code | ⚠️ Unverified |
| WorkOS vs Clerk — confirmed Clerk | ✅ Clerk |
| Razorpay vs Stripe — confirmed Razorpay | ✅ Razorpay |
| Voice capabilities | 🎯 Planned |
| CF consolidation (96 → 18 Workers) | 🎯 In progress |
| Occurrence unit for metering | ⚠️ Undefined |

---
*June 22, 2026 — consolidated from full session*
*Verify against deployed state before engineering decisions*