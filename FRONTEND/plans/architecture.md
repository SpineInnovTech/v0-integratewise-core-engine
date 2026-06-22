# Canonical Architecture — Confirmed & UI Alignment Plan

## Confirmed Facts (June 22, 2026)

### Retired / Removed
- **Hermes** → RETIRED. Remove all references from UI (agent logs, MCP registry, Twin observability)
- **Stripe** → NOT used. Billing is **Razorpay** (INR-native). Update any billing UI.

### Infrastructure (Confirmed)
- **Auth**: Clerk (instance 2fbdfb23-4fc5-4d14-815c-c2932876753f) — tenant + org management + SSO
- **Backend**: 100% Cloudflare-native — ~18 canonical Workers
- **AI routing**: CF AI Gateway (native) + CF Workers AI (free edge inference) — NOT OpenRouter/LiteLLM
  - Free: CF Workers AI (Llama 3, Mistral — runs on CF edge, no key needed)
  - Premium: Provider API keys in CF Secrets Store (Anthropic, OpenAI, Gemini, Grok/xAI)
  - CF AI Gateway handles routing, caching, rate limiting, fallback natively
- **Postgres/Supabase**: The Postgres layer is **swappable by design**. Current provider may be Supabase but it's an implementation detail, not a dependency.
- **Credential wall**: Nango — OAuth tokens NEVER touch application code

### Gateway Endpoints (Confirmed — `integratewise-gateway` Worker)
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
Auth: API keys (external) · JWT (internal service bindings)

### Tenant Creation Flow (Canonical)
```
Clerk creates tenant
    ↓ Tenant record → D1
    ↓ Schema AI initialises default schemas for tenant's domain
    ↓ Nango connector fires
    ↓ Schema AI generates connector schema from sample payload
    ↓ Spine hydration begins against active schema
    ↓ First entity → D1 under validated schema
    ↓ Bridge activates (integratewise-continuity-bridge MCP)
```

### Continuity Bridge — 3 Hard Prerequisites
1. Valid IntegrateWise tenant (Clerk)
2. At least one tool connected (Nango)
3. At least one entity in D1 (Spine hydrated)

### The 8 Key Invariants (UI must reflect these)
1. No write without active schema (Schema AI governs all writes)
2. No action without governance approval (HARD GATE — no bypass)
3. No auto-dispatch (human must explicitly approve and dispatch)
4. Credentials never touch application code (Nango is the wall)
5. Agents never communicate directly (Spine is the only switchboard)
6. Return-derived truth is verified, not assumed
7. **Frontend owns no state** — all truth lives in backend
8. Memory writes go through Triage Bot (never direct to org_memory)

---

## UI Changes Required (awaiting CF endpoint URL)

### 1. `src/app/components/spine/spine-client.tsx`
- Change `API_BASE` → CF gateway URL (awaiting endpoint)
- Update endpoint paths to match confirmed `/api/v1/...` contract
- Remove Supabase project ID from URL construction
- Auth header: Bearer token from Clerk JWT

### 2. Remove Hermes references
- `src/app/components/twin-ui/twin-logs.tsx` — remove any "Hermes" mentions
- `src/app/components/twin-ui/twin-observability.tsx` — remove Hermes
- `src/app/components/ingress/ingress-plane.tsx` — MCP Registry should NOT list Hermes

### 3. `src/app/components/ingress/ingress-plane.tsx` — MCP Registry
- Add `integratewise-mcp-connector` as the native IW MCP server (healthy, live)
- Show real bindings: CONTINUITY · KNOWLEDGE · PIPELINE
- Show real queues: knowledge-ingest · pipeline-process
- Show real KV: MCP_IDEMPOTENCY

### 4. `src/app/components/integrations-hub.tsx`
- Continuity Bridge: show 3 prerequisites clearly
- AI Provider section: OpenRouter/LiteLLM as primary (not individual provider keys)
- Remove Stripe references → Razorpay for billing

### 5. `src/app/components/onboarding/onboarding-flow.tsx`
- AI Provider section: OpenRouter as primary entry ("routes to Claude, GPT-4o, Gemini")
- Continuity Bridge: show 3-prerequisite activation gate

### 6. `src/app/components/continuity/continuity-shell.tsx`
- Triage Bot is explicitly named as the memory write gate (Invariant 8)
- "Memory writes go through Triage Bot — never direct to org_memory"

### 7. `src/app/components/governance/governance-workbench.tsx`
- HARD GATE language: "No bypass path exists" (Invariant 2)
- "No auto-dispatch" (Invariant 3) — explicit in approval UI

---

## Customer Zero — Executions Surface (super_admin only)

### Context

Customer Zero = IntegrateWise running itself on its own production platform.
This surface is only visible to `super_admin` role. It's where the company operates IW using IW.

Three distinct things happen here simultaneously:
1. **IW's own business operations** — their customers, revenue, pipeline, CS, engineering — running through their own Twin and workbenches
2. **Platform-wide execution view** — what's running across ALL tenants right now (god view)
3. **The living proof** — IW dogfooding shows every prospect exactly what the product does

### What to Build: `src/app/components/customer-zero/executions-surface.tsx`

**Tab 1 — Company Operations**
IW's own business running on IW. Pulled from IW's Spine partition:
- MRR (Razorpay) · Active tenants · Churn rate · NRR
- Pipeline (IW's own sales deals)
- Customer health (IW's CS managing their own customers)
- Engineering (IW's sprints, deployments via GitHub MCP)
- Finance (Razorpay subscription breakdown)

Each section uses the same domain workbench components as any other tenant — CS Twin, Sales Twin, etc. — but scoped to IW's tenant_id.

**Tab 2 — Platform Live**
Super_admin view across all tenants. Real-time:
- Active sessions (how many tenants are using Twin right now)
- CF Workers: requests/sec, error rate, P50/P95 latency
- Queue depths: pipeline-process, knowledge-ingest
- D1 write volume (entities/min entering Spine across all tenants)
- CF AI Gateway: model usage, token spend, cache hit rate
- Tenant activation funnel (Clerk created → Bridge activated → First entity)

**Tab 3 — Platform Executions**
All running workflows and agents across all tenants (god view):
- Active agent runs (tenant · agent name · status · duration)
- Running workflows (tenant · workflow · step · progress)
- HITL proposals pending across all tenants (governance queue)
- Execution costs per tenant (CF AI spend, Worker invocations)
- Errors and failures requiring attention

**Tab 4 — IW's Own Twin**
IW's employees using Twin to run IW:
- IW CS team managing their customers using CS Twin
- IW RevOps running pipeline reviews
- IW Engineering using Engineering Twin for sprint health
- Shows IW's own memory (what IW's org knows about their customers)

### Route in the app

Add `"Executions"` to `L1Module` types. Accessible only when `user.role === "super_admin"`.

Add to `CTX_BIZOPS` modules for super_admin users only:
```ts
if (isSuperAdmin) modules.push("Executions");
```

Sidebar shows "Executions" with a distinctive icon (Activity + star or similar) only for super_admin.

### Key Architecture Point

This surface uses the same backend:
- `/api/v1/signals` — scoped to all tenants for super_admin
- `/api/v1/entity/:type/:id` — IW's own entities (their Spine partition)
- Platform metrics come from CF Analytics API (not Spine)
- Tenant list comes from D1 tenants table (via gateway with super_admin claim)

### Files

| File | Change |
|---|---|
| `src/app/components/customer-zero/executions-surface.tsx` | Create new |
| `src/app/components/spine/types.ts` | Add `"Executions"` to `L1Module` |
| `src/app/components/workspace-shell.tsx` | Gate `"Executions"` behind `super_admin` check |
| `src/app/components/sidebar.tsx` | Show Executions nav item for super_admin only |
| `src/app/components/l1-module-content.tsx` | Route `"Executions"` → `ExecutionsSurface` |
| `src/app/context/auth-context.tsx` | Add `isSuperAdmin` helper |

---

## Waiting On
- CF gateway URL (to update `API_BASE` in spine-client.tsx)
- Auth header format the gateway expects from frontend callers
- Clerk publishable key (pk_test_...) for instance 2fbdfb23-4fc5-4d14-815c-c2932876753f

---

## Five-Level Architecture Alignment

| Level | What It Is | UI Surface |
|-------|-----------|-----------|
| L1 SPINE Domains | Permanent truth | Schema Registry, Entity360, Spine |
| L2 Platform Capabilities | Twin, MCP, ADK, Schema AI, Governance | Twin shell, Ingress, Governance |
| L3 Solution Matrix | 12×11 = 132 surfaces | Domain workbenches (CS, Sales, etc.) |
| L4 Projections | Workbench, Twin Board, MCP, API | All UI layers |
| L5 Runtime | CF Workers, D1, DO, KV, R2, Queues | Ingress Evidence & Audit |
