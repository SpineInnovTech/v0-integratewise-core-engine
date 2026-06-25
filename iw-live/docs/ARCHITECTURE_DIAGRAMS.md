# Architecture Diagrams

Visual representation of Continuity Bridge platform flows.

## 1. Tool Connection Flow (Nango → Spine)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (Web App)                                                          │
│  User clicks "Connect Salesforce"                                           │
│           ↓                                                                  │
│  POST /api/v1/connector/nango/session {integration_id: "salesforce"}       │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │ x-tenant-id header
                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONNECTOR SERVICE (services/connector)                                      │
│  routes/internal.ts → /internal/nango/session                              │
│           ↓                                                                  │
│  createConnectSession(                                                      │
│    integrationId: "salesforce",                                            │
│    connectionId: tenant_id                                                 │
│  )                                                                           │
│           ↓                                                                  │
│  Returns: { session_token, expires_at, integration_id }                    │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │ session_token
                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ NANGO (External OAuth Provider)                                             │
│  Frontend opens Nango Connect UI with session_token                        │
│           ↓                                                                  │
│  User clicks "Authorize with Salesforce"                                   │
│           ↓                                                                  │
│  Salesforce OAuth flow (login, grant permissions)                          │
│           ↓                                                                  │
│  Nango receives access_token + refresh_token                               │
│           ↓                                                                  │
│  POST /nango/webhook {                                                     │
│    type: "auth.created",                                                   │
│    connectionId: tenant_id,                                                │
│    providerConfigKey: "salesforce",                                        │
│    connection: { credentials: { access_token, refresh_token } }            │
│  }                                                                           │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ LOADER SERVICE (services/loader)                                            │
│  index.ts → /nango/webhook (POST)                                          │
│           ↓                                                                  │
│  ├─ Verify webhook signature                                               │
│  ├─ Extract: tenantId, provider ("salesforce")                             │
│  ├─ Get schema entity types (Contact, Lead, Account, etc.)                 │
│  └─ BRANCH A: Update D1 status                                             │
│                                                                              │
│     UPDATE tenant_spine_config                                             │
│     SET connected_connectors = [... "salesforce"]                          │
│     WHERE tenant_id = ?                                                    │
│                                                                              │
│     INSERT INTO connectors (..., provider, status)                         │
│     VALUES (..., "salesforce", "connected")                                │
│                                                                              │
│  └─ BRANCH B: Trigger Creamy sync (immediate, no 6h cron wait)             │
│                                                                              │
│     POST http://connector-sync/api/sync/{tenantId}                         │
│     { provider: "salesforce", phase: "creamy", entities: [...] }           │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONNECTOR-SYNC SERVICE (services/connector-sync)                            │
│  index.ts → /api/sync/{tenantId}                                            │
│           ↓                                                                  │
│  ├─ Get Nango connection (resolves access_token automatically)              │
│  ├─ Call Salesforce adapter: fetch all contacts, leads, accounts            │
│  └─ Returns: [                                                              │
│       { type: "contact", data: {...} },                                     │
│       { type: "lead", data: {...} },                                        │
│       ...                                                                    │
│     ]                                                                        │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │ raw tool data
                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ NORMALIZER SERVICE (services/normalizer)                                    │
│  8-Stage Pipeline:                                                          │
│                                                                              │
│  NA0: Schema Detector                                                       │
│  Salesforce Contact → person entity type                                   │
│           ↓                                                                  │
│  NA1: Canonical Transformer                                                │
│  Add traits: is_customer=true, source="salesforce"                         │
│           ↓                                                                  │
│  NA2: SSOT Binder                                                           │
│  Create stable UUID: person:contact:salesforce:001A000000...              │
│           ↓                                                                  │
│  NA3: Lineage Manager                                                       │
│  Track source: Salesforce Contact ID xyz at timestamp T                    │
│           ↓                                                                  │
│  NA4: Relation Binder                                                       │
│  Link Contact → Company (relationship edge)                                │
│           ↓                                                                  │
│  NA5: Spine Publisher                                                       │
│  Enqueue: { entity_id, tenant_id, type, data } → PIPELINE_QUEUE            │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │ normalized entities
                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ PIPELINE SERVICE (services/pipeline)                                        │
│  Consumes PIPELINE_QUEUE                                                    │
│           ↓                                                                  │
│  Spine Publisher (spine-publisher.ts):                                      │
│  ├─ INSERT INTO entities (..., type, data) → D1                             │
│  ├─ INSERT INTO relationships (..., type) → D1                              │
│  └─ CREATE AUDIT_LOG entry (success)                                        │
│                                                                              │
│  Result: Spine now has canonical data                                       │
│  - 500 Salesforce Contacts → 500 "person" entities                          │
│  - 50 Salesforce Leads → 50 "lead" entities                                 │
│  - Relationships: person → company, lead → opportunity                      │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │ Live Spine data
                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ INTELLIGENCE SERVICE (Twin)                                                 │
│  services/intelligence/src                                                  │
│           ↓                                                                  │
│  Twin reads Spine (WHERE tenant_id = ?)                                     │
│  Twin uses gpt-5-mini to reason over data                                   │
│           ↓                                                                  │
│  Generates proposal:                                                        │
│  {                                                                           │
│    action: "send_email",                                                    │
│    to: ["contact-id-123", "contact-id-456"],                                │
│    reasoning: "High-priority leads matching ICP"                            │
│  }                                                                           │
│           ↓                                                                  │
│  Proposal stored in action_proposals table                                  │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │ Proposal ready
                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (Web App)                                                          │
│  apps/web/src/components/l1/domains/bizops/my-desk.tsx                    │
│           ↓                                                                  │
│  Owner sees proposal in "My Desk"                                           │
│  Clicks "Approve" or "Discard"                                              │
│           ↓                                                                  │
│  GOVERNANCE GATE:                                                           │
│  - High confidence (>0.85) → auto-approve                                   │
│  - Low confidence → requires owner review                                   │
│           ↓                                                                  │
│  If approved:                                                               │
│  ├─ Log to governance_audit_log (who approved, when, why)                   │
│  └─ Route to Act service → execute action back in Salesforce                │
│                                                                              │
│  Result: User data is now active in Salesforce + Spine                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Schema Hydration Flow (On First Auth)

```
User signs up → Identity Provider (OAuth)
       ↓
Identity token arrives at gateway/auth
       ↓
┌──────────────────────────────────────┐
│ Schema-Generation AI                 │
│ (gpt-5-mini via OpenRouter)          │
│                                      │
│ Input: identity token + IdP metadata │
│ Process:                             │
│  1. Extract org/domain info          │
│  2. Generate tenant schema           │
│     - entity types (person, lead,...)│
│     - relationships (person→company) │
│     - RBAC roles (owner, tam, ...)   │
│     - billing tier (free/pro/ent)    │
│ Output: complete schema manifest     │
└──────────────────────────────────────┘
       ↓
Tenant initialization:
 ├─ Create D1 partition (EDGE_DB)
 ├─ Create tenant_spine_config row
 ├─ Create RBAC rows
 ├─ Create billing record
 └─ Initialize memory tables
       ↓
Tenant is ready for first tool connection
       ↓
(See Tool Connection Flow above)
```

---

## 3. Governance & Approval Gate

```
Twin proposes action
       ↓
┌──────────────────────────────────────────────────────┐
│ Confidence Scoring                                   │
│ gpt-5-mini generates reasoning + confidence %        │
│                                                      │
│ Examples:                                            │
│  - 95% "This contact matches ICP exactly" → auto-ok │
│  - 65% "Unsure if this is right prospect" → requires review
│  - 40% "Guess based on limited data" → DENY         │
└──────────────────────────────────────────────────────┘
       ↓
       ├─ IF confidence >= 0.85:
       │    Auto-approve
       │    Log: action_proposals.status = "approved"
       │    Enqueue to ACT_QUEUE
       │
       └─ IF confidence < 0.85:
            Queue for owner review
            Log: action_proposals.status = "pending"
            Show in "My Desk" (bizops workbench)
                 ↓
            Owner reviews proposal
            ├─ Click "Approve"
            │  └─ Log: governance_audit_log (who, when, reasoning)
            │  └─ Enqueue to ACT_QUEUE
            │
            └─ Click "Discard"
               └─ Log: governance_audit_log (rejection reason)
               └─ Memory consolidation ignores this attempt
```

---

## 4. Memory Consolidation Lifecycle

```
Daily (hourly via cron):
       ↓
┌──────────────────────────────────────────────────────┐
│ TriageBot (in Twin)                                  │
│ Extracts knowledge from conversations + activities   │
│ Creates draft triages with confidence               │
│                                                      │
│ Examples:                                            │
│  - "User is interested in X product" (0.92)         │
│  - "Contact bounced email" (0.87)                   │
│  - "Deal closed (qualified)" (0.98)                 │
└──────────────────────────────────────────────────────┘
       ↓
Route by confidence:
       ├─ >= 0.85: Auto-promote to Memory (active)
       ├─ 0.70-0.85: Staging (awaiting review)
       └─ < 0.70: Discard
       ↓
Active Memory:
 ├─ Consolidated signal (aggregate of related triages)
 ├─ Last accessed: tracks recency
 ├─ Decay: loses strength if not reinforced
 ├─ Archive: after 30 days with no access
 └─ Available to Twin for reasoning
       ↓
Twin grounds all reasoning in active memory
 "This contact matches 5 active signals from memory"
```

---

## 5. Per-Tenant Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│ MULTITENANCY ARCHITECTURE                                       │
│                                                                 │
│ Every query enforces: WHERE tenant_id = ?                      │
│ No cross-tenant data access possible (fail-loud)               │
│                                                                 │
│ Tenant A:                    Tenant B:                          │
│ ├─ D1 partition              ├─ D1 partition                   │
│ ├─ 500 entities              ├─ 1000 entities                  │
│ ├─ Nango connections:        ├─ Nango connections:             │
│ │  └─ Salesforce (token)     │  └─ HubSpot (token)             │
│ │  └─ Slack (token)          │  └─ Pipedrive (token)           │
│ ├─ Vault encryption: free    ├─ Vault encryption: pro          │
│ ├─ Twin reasoning over A     ├─ Twin reasoning over B          │
│ │  (isolated)                │  (isolated)                     │
│ ├─ Memory consolidation      ├─ Memory consolidation           │
│ │  (A only)                  │  (B only)                       │
│ └─ Audit logs (A events)     └─ Audit logs (B events)          │
│                                                                 │
│ Nango per-tenant isolation:                                     │
│ connectionId = tenant_id (unique per tenant+tool)               │
│ Credentials encrypted in Nango vault                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Activity Audit Trail

```
Every action creates an immutable log entry:

┌─────────────────────────────────────────────────────────────────┐
│ AUDIT TABLES (immutable records)                                │
│                                                                 │
│ audit_logs: generic action log                                  │
│  ├─ timestamp                                                   │
│  ├─ tenant_id                                                   │
│  ├─ user_id                                                     │
│  ├─ action (read, propose, approve, execute, error)             │
│  ├─ resource (entity_id, tool, etc.)                            │
│  └─ metadata (reasoning, result)                                │
│                                                                 │
│ governance_audit_log: approval decisions                        │
│  ├─ proposal_id                                                 │
│  ├─ approved_by (user_id)                                       │
│  ├─ decision (approved / denied)                                │
│  ├─ reasoning_confidence                                        │
│  └─ timestamp                                                   │
│                                                                 │
│ spine_audit_log: entity changes                                 │
│  ├─ entity_id                                                   │
│  ├─ action (created / updated / deleted)                        │
│  ├─ old_value                                                   │
│  ├─ new_value                                                   │
│  └─ tenant_id                                                   │
│                                                                 │
│ twin_audit_events: reasoning trace                              │
│  ├─ session_id                                                  │
│  ├─ stage (read_spine, reason, propose)                         │
│  ├─ input                                                       │
│  ├─ output (proposal)                                           │
│  └─ model (gpt-5-mini, etc.)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

All queries filtered by: WHERE tenant_id = ? (non-negotiable)
Fail loud on write failures (audit write error = sync stop)
```

---

## 7. Gateway Routing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ GATEWAY (services/gateway)                                      │
│ Single ingress for all traffic                                  │
│                                                                 │
│ Request arrives: GET /api/v1/workspace                          │
│         ↓                                                        │
│ Extract: x-tenant-id, x-correlation-id                          │
│         ↓                                                        │
│ Route to domain:                                                │
│  ├─ /api/v1/workspace/* → workspace domain                      │
│  ├─ /api/v1/connector/* → connector service                     │
│  ├─ /api/v1/intelligence/* → intelligence (Twin)                │
│  ├─ /api/v1/knowledge/* → knowledge (Memory)                    │
│  ├─ /api/v1/cognitive/* → cognitive (signals + memory)          │
│  ├─ /api/v1/pipeline/* → pipeline (normalizer + spine)          │
│  ├─ /api/v1/admin/* → admin (governance)                        │
│  └─ /api/v1/mcp/* → MCP connector (tool capabilities)           │
│         ↓                                                        │
│ Service processes with tenant_id context                        │
│         ↓                                                        │
│ Returns: 200 {data} or 403 Forbidden (cross-tenant access)      │
│         ↓                                                        │
│ Log to audit_logs (success/error)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**All diagrams assume:**
- Cloudflare Workers deployment (edge-first architecture)
- Per-tenant D1 partitioning (EDGE_DB)
- Nango for OAuth + token management
- Audit logging on every action
- Fail-loud security (errors stop processing, not silent)
