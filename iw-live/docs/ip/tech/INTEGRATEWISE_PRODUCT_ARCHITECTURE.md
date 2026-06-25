# IntegrateWise — Product Architecture & Requirements

> **Date:** June 4, 2026 | **Authority:** Nirmal (Founder) | **Version:** FINAL
> **This is one document. It is complete. It contains everything.**

---

---

# SECTION A — SYSTEMS ARCHITECTURE

---

## A1. What IntegrateWise Is

A governed operational continuity and intelligence layer for organizations.
It solves tool fragmentation (M×N integration) and vanishing reasoning (AI sessions that evaporate).

**Architectural thesis:** Normalize everything. Hold one truth. Let the LLM reason over that truth.

IntegrateWise owns memory. The user owns execution. MCP connects the two.

---

## A2. The System Components

```
COMPONENT       WHAT IT IS                              WHAT IT IS NOT
────────────────────────────────────────────────────────────────────────────
TWIN            The only agent. Model-agnostic.         Not Hermes. Not Claw.
                Persistent. 6-layer memory.             Not a multi-agent swarm.
                Runs on any LLM (parameter,             Not locked to any model.
                not dependency).

SPINE           Canonical operational truth.            Not memory. Not reasoning.
                Supabase (fortress).                    Not accessed by agents directly.
                Mirrored to D1 (edge, read-only).

MCP             The protocol. Internal bus +            Not just external access.
                external access. Unified.               Not a connector wrapper.
                Gateway + MCP combined.

ADK             Registry + cache.                       Not an orchestrator.
                What agents/tools exist.                Not stateful. No memory.
                "This call → this service."             No logs. No reasoning.
                KV-speed TTL lookup.

CF WORKFLOWS    Durable multi-step execution.           Not n8n. Not external.
                step.do(). step.sleep().                Not a separate system.
                waitForEvent(). Retry + backoff.

PIPELINE        8-stage Normalizer.                     Not readable by users.
                SOLE Supabase credential holder.        Not bypassed for writes.
                Writes Spine. Nothing else does.

TRIAGE BOT     CF Workflow. Scores proposals.           Not a Spine writer.
                Sole writer to org_memory.              Not an executor.
                Routes: approve / HITL / reject.

ACT SERVICE     Executes approved actions.              Not a proposer.
                Calls target tools. Reports result.     Not a reasoner.
                Feeds back to Pipeline.

NANGO           OAuth token management.                 Not business logic.
                200+ providers. Auto-refresh.           Not accessed by Twin directly.
                Connection UI for users.
```

---

## A3. What Does NOT Exist

```
✗ Hermes           (removed — Twin replaces)
✗ Claw             (removed — CF Workflows replaces)
✗ n8n              (removed — CF native replaces)
✗ Python           (zero, anywhere, no exceptions)
✗ CouchDB          (removed — Supabase only)
✗ Neon Postgres    (removed — D1 + Supabase)
✗ Multi-agent swarm(one Twin only)
✗ Direct Supabase access by agents (pipeline db-proxy only)
✗ Insights floating in UI (Entity 360 only)
✗ Memory in ADK    (ADK is stateless registry + cache)
```

---

## A4. Storage Architecture

### The CF Edge Stack (Complete — Runs Full Product Without Supabase)

```
PRIMITIVE    TECHNOLOGY           PURPOSE                         ROLE
──────────────────────────────────────────────────────────────────────────────
D1           CF SQLite (edge)     Structured data at edge         Spine entities, signals,
                                                                  tenant/user records, metadata,
                                                                  memory governance metadata.

R2           CF Object Storage    Raw content (cold)              Documents, memory content,
                                                                  file uploads. Source of truth
                                                                  for all raw content.

Vectorize    CF AI Search         Embeddings + semantic index     THE ONLY memory retrieval
                                                                  path for agents/Twin.

KV           CF KV                Hot cache (60-300s TTL)         Session state, connector status,
                                                                  ADK routing, subscription tier,
                                                                  entity cache.

Queues       CF Queues            Async processing                pipeline-process, sync,
                                                                  intelligence-events, knowledge.

DOs          Durable Objects      Stateful long-lived sessions    HITL gate, folder watcher,
                                                                  stream gateway.
```

### Two Operational Modes

```
INITIAL USERS (Full CF Edge Stack — no Supabase):
  Spine:       D1 (entities, relationships, signals)
  Memory:      R2 (content) + Vectorize (retrieval) + D1 (metadata)
  Auth:        D1 (tenant/user records) + KV (session cache)
  Sync:        Queues + KV (status tracking)
  Files:       R2 (uploads, documents)
  State:       DOs (HITL, sessions)

  This IS the full product. Nothing missing.
  No external database. All Cloudflare-native.

PROMOTED USERS (CF Edge Stack + Supabase fortress):
  Same edge stack for speed (D1 + KV + R2 + Vectorize + Queues + DOs)
  PLUS: Supabase as canonical backup + durability layer
  Pipeline writes to BOTH: D1 (edge) + Supabase (fortress)
  If D1 is lost: rebuild from Supabase. Nothing lost.
  Promotion: manual decision by Nirmal after reviewing usage patterns.
```

### Access Rules

```
LAYER       WHO READS                    WHO WRITES
──────────────────────────────────────────────────────────────────────────────
D1          Twin (Spine data)            Pipeline only (Spine writes)
            Human (browse metadata)      Tenants service (user/tenant records)
            Gateway (tenant resolution)  Triage Bot (memory metadata)

R2          Never directly by Twin       Triage Bot (approved memory content)
            Knowledge service (embed)    Knowledge service (document uploads)

Vectorize   Twin (memory retrieval)      Triage Bot (after R2 write, indexes)
            ONLY retrieval path for      Knowledge service (embeddings)
            agent memory access

KV          Gateway (session, tier)      Any service (ephemeral cache)
            ADK (routing lookup)         Auto-expires (TTL-based)
            Connector-sync (status)

Queues      Consumer workers             Producer workers (any service)

DOs         HITL consumers               HITL producers
            Stream clients               Webhook processors
```

---

## A5. Memory Architecture

### Two Distinct Paths

```
PATH 1 — RETRIEVAL (how Twin reads memory)
  Vectorize (AI Search) ONLY.
  Twin → semantic query → top K relevant entries → insight generation.
  NOT from D1. NOT from Supabase. AI Search is the ONLY retrieval path for agents.

PATH 2 — GOVERNANCE + BROWSE (how humans manage memory)
  Supabase org_memory → governance_state, category, entity_refs, lineage_id
  D1 metadata mirror → human browse UI (/memory route)
  This path is for HUMANS, not the Twin.
```

### Write Path (Governed)

```
Source (file change / Twin proposal / document upload)
  → Worker detects change (SHA-256 hash)
  → Triage Bot scores (confidence + relevance + risk + conflict + quality)
    ≥ 0.85 → auto-approve
    0.60–0.84 → HITL (human review)
    < 0.60 → reject
  → R2 (raw content stored)
  → Vectorize (chunks embedded, indexed)
  → Supabase org_memory metadata (via pipeline db-proxy)
  → D1 metadata mirror
  All written on every approved entry. Atomic.
```

### Memory Types

```
PERSONAL MEMORY    Private to user. Behavioral patterns, preferences.
                   Auto-promoted from conversational after 5+ sessions.
                   Hard RLS boundary — no cross-user access.

CONVERSATIONAL     Session logs. Auto-written every Twin session.
                   Scratchpad. No governance needed.
                   Promotion candidates surface from here.

ORG MEMORY         Institutional knowledge. 8 categories:
                   doctrine | decision | workflow | policy |
                   insight | pattern | commitment | learning
                   ONLY written by Triage Bot. Nothing else. Ever.
                   Governed. Versioned. Append-only. Never deleted.
```

---

## A6. Spine Architecture

```
SPINE IS OPERATIONAL TRUTH.
  What is the health score of Acme right now? → Spine (D1).
  What deals are closing this month? → Spine (D1).
  What tasks are overdue? → Spine (D1).

SPINE IS NOT MEMORY.
  What did we learn from the Acme escalation? → Memory (Vectorize).
  What patterns have we seen? → Memory (Vectorize).

WRITE PATH:
  Source tool → Nango token → Connector → SPINE SCHEMA HYDRATION
  → Loader (8 stages) → Normalizer (8 stages) → Pipeline writes to D1.
  For promoted users: Pipeline also writes to Supabase (dual-write).
  NOTHING ELSE WRITES TO SPINE. Pipeline is the sole writer.

READ PATH (for Twin):
  D1 only. Structured. Exact. Fast. Sub-10ms.
  Twin NEVER reads from Supabase. D1 IS the Spine for agents.

SCHEMA:
  12 domains × 11 industry overlays = adaptive.
  Spine Selector at onboarding determines which schema activates.
  tenant_spine_config (D1) controls everything downstream.
```

---

## A7. Security & Auth

```
CF Zero Trust:
  4 public domains: gateway, ingress, pipeline, watcher
  All downstream workers: service bindings only, zero internet exposure
  MCP external: CF-Access-Client-Id + CF-Access-Client-Secret + x-tenant-id
  Gateway validates Service Token ↔ tenant mapping (cross-tenant impersonation blocked)

Auth (unified — Cloudflare; supersedes the two-stage Supabase model):
  ALL USERS:
    Identity: Cloudflare Access SSO (Google + GitHub). No password.
    Session:  Gateway validates CF Access JWT, resolves tenant from D1,
              issues/propagates Gateway JWT (RS256).
    Injects:  x-tenant-id, x-user-id, x-user-role
    Zero Supabase auth. (Supabase is the fortress DATA record only — never auth.)

  DATA TIER (separate concern from auth — usage-gated, NOT chosen at signup):
    Initial users:  D1-edge ONLY. No Supabase. Every user starts here.
    Allocation:     Supabase fortress is ALLOTTED based on usage (data volume /
                    durability need / tier), never provisioned at signup.
    Promoted users: + Supabase fortress backup (DATA durability + RLS) once allotted.
    Auth is IDENTICAL across both tiers — downstream workers don't know the difference.

  Internal workers: trust cf-worker header via service bindings
```

---

## A8. The Complete Operational Loop

```
ENTITY 360 ASSEMBLED
  D1 (Spine — operational truth)
  + Vectorize (Memory — AI Search, semantic)
  + D1 (Signals — recent, time-ordered)
         │
    TWIN REASONS
    Generates insight. Proposes action.
         │
    ┌────┴────┐
  PATH A    PATH B
  Auto-     Human approves
  execute   or updates directly
    │         │
    └────┬────┘
         │
  OPS EXECUTED
  Act service → target tool (HubSpot, Jira, Salesforce, calendar)
         │
  SPINE UPDATED
  Tool webhook → ingress → Normalizer → D1 + Supabase
         │
  MEMORY UPDATED (if learning generated)
  Triage Bot → R2 → Vectorize → Supabase metadata → D1 mirror
         │
  NEXT ENTITY 360 ASSEMBLY REFLECTS CHANGES
  Loop never breaks. Both paths close.
```

---

## A9. Data Pipelines

```
FLOW A — Structured Truth (Repeat Loop)
  Source tool → Nango → Connector → Loader → Normalizer → Spine
  → D1 mirror → THINK_QUEUE → Twin reads
  → Approved action → Act → tool updated → webhook → BACK TO START

FLOW B — Context (No Repeat Loop)
  Gmail/Slack/Drive/Docs → Connector → Loader → Knowledge service
  → context_extractions → linked to entities → D1 → Twin reads via Entity 360
  One-way enrichment. No loop back.

FLOW C — Memory (Governed Write)
  Twin session / proposal / document insight
  → proposal_queue → Triage Bot → R2 → Vectorize → Supabase → D1
  Never writes to Spine. Memory and Spine are permanently separate.

SIGNAL GENERATION
  Spine entity changes → SignalAnalyzer → D1 cross_data
  → evaluateTriggers() → insight generated → visible at Entity 360
```

---

## A10. The Twin

```
WHAT:     The only agent. Model-agnostic. Persistent.
WHERE:    Conceptually lives at Entity 360 (Spine ∩ Memory intersection).
HOW:      Reads assembled context. Reasons. Proposes. Never writes.

6 MEMORY LAYERS (assembled at session start):
  Layer 1: Skills — what Twin can do for this user's domain
  Layer 2: Knowledge — org memory refs, KB entries (read via Vectorize)
  Layer 3: Lineage — prior proposals, approvals, rejections
  Layer 4: Doctrine — constitutional laws (hard-injected, non-negotiable)
  Layer 5: Conversational — recent session turns
  Layer 6: Evolutionary — personal behavioral patterns

GOVERNANCE RULES:
  1. Propose, never write
  2. Evidence before opinion
  3. Lineage immutable (proposals never deleted)
  4. Memory boundary absolute (personal = user only, org = Triage Bot only)
  5. Gateway policy (email/legal/financial/HR = always human_review)
  6. No silent execution (auto-approve ONLY: ≥0.80 + personal + no conflict)

10 TRIGGERS (evaluated against Entity 360):
  1. health_drop (15+ points)
  2. renewal_approaching (≤90 days)
  3. engagement_drop (30+ days silence)
  4. arr_change (±10%)
  5. goal_at_risk (status = at_risk)
  6. support_escalation (5+ open tickets)
  7. stale_data (entity not updated)
  8. memory_conflict (conflicting low-confidence decisions)
  9. context_gap ($50k+ ARR with zero context)
  10. signal_cluster (3+ critical/high firing together)
```

---

## A11. Separation of Concerns (Hard Walls)

```
Spine ↔ Memory:        NEVER merge. Meet at Entity 360 (read-only assembly only).
Agents ↔ Supabase:     NEVER direct. D1 for Spine. Vectorize for memory.
Twin ↔ Writes:         NEVER direct. Always proposes. Governance decides.
Triage Bot ↔ Spine:    NEVER. Triage Bot writes to Memory only. Pipeline writes to Spine.
ADK ↔ State:           NEVER. Registry + cache. Stateless.
R2 ↔ Twin:             NEVER. Twin reads Vectorize. R2 is cold storage.
D1 ↔ Memory retrieval: NEVER for Twin. D1 metadata is for human browse only.
                        Twin reads memory from Vectorize. Period.

CF Edge stack IS the product for initial users.
Supabase IS the fortress backup for promoted users.
Both paths: downstream workers see the same data.
```

---

## A12. Known Gaps & Mitigations

### Concern 1 — Vectorize Cold-Start

Until WIRE 8 (Vectorize pipeline) is live, Entity 360 serves Spine data only.
Twin memory layers 2 and 6 are empty. The system functions but is significantly
less useful without semantic memory retrieval. WIRE 8 is the highest-value wire
after the memory loop capture path (C2 stages 1-5).

### Concern 2 — D1 Recovery for Initial Users

For initial users (no Supabase), D1 is the only copy. If D1 is corrupted or lost,
data is gone. Mitigation: Pipeline writes a lightweight R2 backup of every Spine
write as a JSON line file per tenant per day. This is not Supabase-level durability,
but provides a recovery path.

```
Pipeline write to D1 → also appends to R2: spine-backup/{tenant_id}/{date}.jsonl
Recovery: replay JSONL into D1 from R2 backup.
Cost: ~$0. R2 writes are free. Storage is pennies.
```

### Concern 3 — R2 → Vectorize Non-Atomic Write

True atomicity across R2 + Vectorize + D1 is not achievable in one transaction.
If Vectorize indexing fails after R2 write, content exists but is invisible to Twin.

Mitigation: reindex job.

```
Scheduled (daily or on-demand):
  Scan R2 memory/{tenant_id}/ keys
  Compare against Vectorize metadata (memory_id index)
  Any R2 key missing from Vectorize → re-chunk, re-embed, re-index
  Idempotent. Safe to run repeatedly.
```

### Concern 4 — Gateway as Single Point

Gateway handles: auth, rate limiting, MCP routing, Zero Trust, tenant resolution.
If Gateway fails, nothing works. Mitigations:

- CF Workers have built-in global redundancy (deployed to 300+ edge locations)
- Gateway is stateless — no single-instance failure mode
- Circuit breaker: if downstream service binding times out, gateway returns
  503 with retry-after header (not a hang)
- Health probes on all downstream services (/health endpoints)
- Fallback: critical D1 reads (tenant resolution) can be cached in KV with
  30-second TTL — survives brief D1 hiccups

### Concern 5 — Initial Memory Load Backpressure

1,017+ documents proposed simultaneously could overwhelm the live governance queue.
Mitigation: separate queue + rate limiting.

```
Initial load uses: BULK_MEMORY_QUEUE (separate from live pipeline-process queue)
Rate: max 10 concurrent proposals (step.do() concurrency limit in CF Workflow)
Priority: lower than live operations (live queue always processed first)
Isolation: bulk load never blocks real-time signals or user proposals
```

### Concern 6 — Intelligence Worker Think vs Act Isolation

Think (proposal generation) and Act (execution) have inverse failure modes.
Both live in the same worker but consume from different queues:

```
intelligence-events queue → Think (proposal generation)
intelligence-act queue    → Act (execution)

Separate queue consumers = separate CPU budgets.
Act spike doesn't starve Think. Think failure doesn't block Act.
Already architected this way via CF Queue consumer bindings.
```

---

---

# SECTION B — PRODUCT REQUIREMENTS & TRAJECTORIES (PRT)

---

## B1. User Persona

### Who the User Is

```
PRIMARY PERSONA: Operations Leader
  Title: Founder / CEO / COO / VP Ops / CS Lead / RevOps Manager
  Company: 10–500 employees, SaaS or services business
  Tools: 5–30 SaaS tools connected (CRM, billing, project, support, comms)
  Pain: opens 4 tabs to answer one question. Copies data between tools.
        Starts every day not knowing what matters most.
        AI conversations evaporate — same questions re-answered weekly.
  Desire: open ONE thing. See what matters. Act. Move on.

SECONDARY PERSONA: Account Manager / CSM / TAM
  Title: Customer Success Manager / Technical Account Manager
  Company: Managing 10–50 accounts
  Pain: renewal surprises. Silent accounts churn. No prep for meetings.
        Health scores in CRM are stale. Context is in email, not visible.
  Desire: know which accounts need attention NOW. Get pre-briefed for meetings.
          Never miss a renewal window. Never lose institutional memory about a client.
```

### How the User Behaves

```
MORNING (08:30):
  Opens the app. Needs to know in 10 seconds:
  - What's on fire (critical signals, overdue items)
  - What's today (meetings, tasks, deadlines)
  - What's ahead (commitments this week, renewals approaching)
  Does NOT want: dashboards full of charts. Detailed reports. Configuration screens.
  WANTS: a briefing. Like a chief of staff prepared it overnight.

MID-MORNING (09:00–11:00):
  Working through items. Responding to communications.
  Needs: unified queue (emails + Slack + proposals in one place)
  Needs: context when opening an account (full Entity 360 — what we know + what's happening)
  Needs: AI that says "this is the same pattern as last year, escalate now" (not just scores)

AFTERNOON (14:00–16:00):
  Strategy + planning mode.
  Needs: what's blocked? What needs a decision? What's the pipeline looking like?
  Needs: week view. Department context. Metrics.

END OF DAY (17:00):
  Wrapping up. Logging outcomes.
  Needs: meeting notes go somewhere useful (not lost in email)
  Needs: next day's prep already staged
  Needs: memory promoted (what was learned today becomes institutional knowledge)
```

### How the User Travels Through the System

```
/desk         → Morning briefing (MorningContext API)
  ↓ taps signal
/entity360    → Full account view (Spine + Memory + Signals assembled)
  ↓ Twin proposes
/twin (Mode A)→ Approves action (or opens full Mode B for deep work)
  ↓ back to work
/inbox        → Communications + proposals queue
/build        → Blockers, priorities
/run          → Approve playbooks, execute automations
/grow         → Check metrics, ARR, pipeline
/memory       → Browse what the system knows (org + personal)

The user does NOT:
  - Configure the system (system configures itself from Spine Selector)
  - Edit raw data tables (entities are managed by connectors + normalizer)
  - Train the AI (Twin learns from approvals/rejections automatically)
  - Switch between multiple apps (one surface, one login, one left panel)
```

---

## B2. How the System Gets Hydrated

### First Hydration (Onboarding)

```
Stage 0   User visits integratewise.ai → books demo
Stage 1   Nirmal demos live system (real data, not slides)
Stage 2   User signs up (Google OAuth or email)
Stage 3   Context questions:
          - Use case: Personal / Work / Business
          - Industry: SaaS, Healthcare, Retail, etc. (11 overlays)
          - Department: Sales, CS, Marketing, Finance, etc.
          - Company size: 1–10, 11–50, 51–200, 200+
          - Primary goal: free text
          - Workspace name
Stage 4   Spine Selector (backend, invisible to user):
          - Resolves domain key + industry overlay + context seed
          - Creates tenant + workspace + RBAC + free subscription
          - Writes tenant_spine_config (controls everything downstream)
Stage 5   Connector Projection:
          - Nango Connect UI shows domain-ranked connectors
          - User selects tools → OAuth flow → connection established
Stage 6   Creamy Layer (first data load):
          - SPINE SCHEMA HYDRATION (validate entity types against tenant_spine_config)
          - Source tool API → Nango token → Connector → Loader (8 stages)
          - → Normalizer (8 stages) → Spine D1 (edge cache)
          - User sees domain-specific progress messages
          - Entity resolution, relationship graph forming in background
          - NO SUPABASE for initial users — D1 only (per D-011)
Stage 7   L1 Dashboard loads with REAL Spine data from D1
          - Schema-matched workbench
          - Domain projection applied
          - No mock data. Ever.
```

### Continuous Hydration (After Onboarding)

```
DAILY SYNC:
  Cron trigger (every 5 min) → Connector polls delta from tools
  → Normalizer processes → Spine updated
  → D1 mirror updated → KV invalidated
  → Signals generated if entity state changed

WEBHOOK SYNC:
  Tool fires webhook → ingress.integratewise.ai (signature verified)
  → Normalizer → Spine updated (near real-time)

MANUAL ENTRY:
  User creates entity in UI → via gateway → pipeline db-proxy → Spine

DOCUMENT INGESTION:
  User uploads file → knowledge service → context_extractions
  → Linked to entities → available at Entity 360 (Vectorize retrieval)

MEMORY INGESTION:
  Filesystem vault (1,017+ docs) → memory-repo connector
  → Triage Bot → R2 → Vectorize → Supabase → D1
  Twin sessions → conversational_memory (auto)
  Promotions → personal_memory or org_memory (governed)
```

---

## B3. The Surfaces (Frontend)

### Left Panel Navigation (The "One Surface" Doctrine)

```
HOME         /desk             What today looks like. Plan. Direction.
CATCH-UP     /inbox            Alerts, decisions, system-drafted items.

WORK:
RUNWAY       /build            Blockers, roadmaps, priorities.
WARM         /decide           Context prep. 12/14 department views.
ACT          /run              Automations, playbooks, approvals, checklists.
REACT        /react            Live system alerts, incident queues.
REPEAT       /schedule         Templates, recurring automation schedules.
REPORT       /grow             ARR, pipeline, strategic metrics.
OVERDUES     /tasks            Overdue actions.
HORIZON      /horizon          Week-in-a-view planner.

ENTITY 360   /entity360        First-class view. Spine ∩ Memory. Insights live here.
                               Twin's conceptual home. Not a drawer tab.

ASSETS:
YOUR ASSETS  /memory/personal  Personal + Conversational. Work/Personal toggle.
TEAM ASSETS  /memory/org       Org memory. Templates. Lineages.

TWIN         /twin             Full OpenWebUI hub. Model-agnostic. Two modes.
INTEGRATIONS /connectors       Tool connections (Nango).
SETTINGS     /settings         Tenant config.
PROFILE                        Work | Personal toggle.
```

### Three Surfaces

```
SURFACE 1 — L1 Workbench (main content area)
  Where the user works. Routes render here.
  Intelligence overlay: bottom-to-top, ONLY on critical trigger. Passive otherwise.
  Slimmed overlay: spine + context data reference only.

SURFACE 2 — Twin Workbench (/twin)
  MODE A — Sliding Overlay (passive)
    Hidden by default. Pops up ONLY on critical signal or approval.
    Dismisses when user acts.
  MODE B — Full OpenWebUI Hub (user-initiated)
    /twin route. Full-page. Chat + Skills + Tools + Memory + Workflows + Models.
    Execution surface: think + act + adjust live here.
    Agent Zero or OpenWebUI as runtime.

SURFACE 3 — IW Governance Workbench (see Section D3 for full spec)
  NOT merely an approval queue. The collaborative operating layer.
  Shared Task Board + Proposal Queue + Decision Ledger +
  Memory Promotion + Procedure Evolution + Outcome Tracking + Audit.
  Where Real Twin and Digital Twin ENGAGE TOGETHER.
  Primary collaboration through tasks, not chat.
```

### Entity 360 — The Cognitive Assembly Point

```
Route: /entity360/:entityId — first-class left panel view.

Assembly (parallel):
  D1 query    → Spine (operational truth)
  Vectorize   → Memory (AI Search, semantic, top K)
  D1 query    → Signals (time-ordered, recent)

WHERE:
  Memory intersects Spine WITHOUT crossing over.
  Insights generated and read — NOWHERE ELSE.
  Twin conceptually lives here.
  User sees truth + knowledge in one view.
```

### L2 Component Migration (Old → New)

```
spine         → L2 overlay (stays)
context       → L2 overlay (stays)
knowledge     → /memory (Assets nav)
entity360     → /entity360 (left panel, first-class view)
think         → Twin Workbench
act           → Twin Workbench / CF Workflows
adjust        → Twin Workbench
Twin panel    → Twin Workbench (removed from L2)
AIChat        → Twin Workbench (removed from L2)
```

---

## B4. Product Split & Paywall

### Phase 1 Product (Ships Immediately — Three Workbenches)

```
WORKBENCH 1: Account Success
  For: CSM / TAM users
  Views: 27 Account Success views (built, real data)
  Intelligence: NONE in Phase 1
  Connectors: Nango + MCP connected
  Auth: CF edge (D1 tenant/user, no Supabase)

WORKBENCH 2: Business Ops
  For: Founder / CEO / COO / Ops users
  Views: 14 BizOps modules (built, real data)
  Intelligence: NONE in Phase 1
  Connectors: Nango + MCP connected
  Auth: CF edge (D1 tenant/user, no Supabase)

WORKBENCH 3: Customer Zero (IntegrateWise internal)
  For: Nirmal
  Views: ALL (AS + BizOps + Ops + full system)
  Intelligence: Full (Twin, memory, governance)
  Connectors: All connected
  Auth: CF edge (full access)

PHASE 1 INCLUDES:
  ✅ Three workbenches (AS + BizOps + Customer Zero)
  ✅ Nango setup (OAuth connections)
  ✅ MCP connected (tools accessible)
  ✅ Auth: CF edge only (D1 tenant/user)
  ✅ Data from D1 hard cache (Cloudflare only)

  ✗ NO intelligence for external users (AS + BizOps)
  ✗ NO Twin for external users
  ✗ NO memory loop for external users
  ✗ NO Supabase auth (CF edge handles it)
```

### Delivery Model

L1 and L2 are built. Features ship as-is. One codebase. One deploy. Tiers gated by runtime feature flags.

### Tier Structure

```
FREE:       /desk, /inbox, /tasks (limited). 1 connector. Entity 360 (read-only).
            Manual data entry. No Twin. No memory. No AI Search.

STARTER:    Full L1 (all routes). 3 connectors. Twin Mode A (reactive overlay).
            Basic signals (10 triggers). Calendar workflow.

PRO:        Twin Mode B (Full Hub). Unlimited connectors. Entity 360 + memory (Vectorize).
            Memory (personal + org + conversational). AI Search.
            CF Workflows. Proposal queue + HITL. /react.

ENTERPRISE: External LLM (MCP endpoint per tenant). Custom domain.
            Multi-workspace. SLA. Manual provisioning.
```

### Paywall Mechanism

```
tenant_spine_config.subscription_tier → free | starter | pro | enterprise
Gateway reads tier → injects x-subscription-tier header
Frontend reads tier → gates routes via feature flags
Backend returns 403 if feature not in tier
ONE codebase. ONE deploy. Runtime check only.
```

### Payment (Not Yet Wired)

```
EXISTS: services/billing/ (Stripe + Razorpay), POST /api/v1/subscriptions
NEEDED: webhook → tier update, frontend gate (useSubscription()), upgrade UI, downgrade handling
```

---

## B5. Backend Services (10 Deployed Workers)

24 service directories exist in the monorepo. Post-consolidation (v3.6), they deploy as **10 Cloudflare Workers**:

```
SERVICE             ABSORBS                              CREDENTIAL
────────────────────────────────────────────────────────────────────────────
pipeline            normalizer, spine-v2                  SOLE Supabase holder.
                    8-stage Normalizer. Spine writer.     db-proxy for all writes.

intelligence        think, act, govern, agents,           Service binding to pipeline.
                    agent-registry, hermes
                    Signal engine. Proposals. HITL.

connector           loader, mcp-connector, store          Nango key. R2 bucket.
                    Nango OAuth. MCP server (20 tools).
                    Webhook intake. File store.

knowledge           (standalone)                          Service binding to pipeline.
                    KB ingestion. Memory shim.
                    Embedding coordination.

workflow            (standalone)                          Service bindings to all.
                    BFF. HITL gate (DO). Analytics.
                    Stream gateway. Onboarding.

gateway             (standalone)                          JWT validation. CF Zero Trust.
                    Auth. Rate limiting. Routing.
                    MCP combined. Single entry.

connector-sync      (standalone)                          Nango key.
                    Delta polling. Background sync.

webhook-ingress     (standalone)                          Signature verification.
                    External webhook intake.

billing             (standalone)                          Stripe/Razorpay keys.
                    Stripe + Razorpay.

tenants             (standalone)                          D1 (edge-first, no Supabase).
                    Tenant + user management. RBAC.       Promotes to Supabase on review.
```

Other directories (continuity, folder-watcher, l2, admin, telemetry) exist as source but are either stubs, pending deployment, or absorbed into the above.

### Queues (10 Active)

```
pipeline-process, signals, intelligence-events, knowledge-ingest,
accelerator-trigger, intelligence-act, signals-dlq, pipeline-dlq,
ops-dlq, knowledge-dlq
```

---

## B6. Repos & Maintenance

```
REPO                            ROLE                    STACK           DEPLOY
────────────────────────────────────────────────────────────────────────────────
integratewise-live              Engine. All backend.    TS/CF Workers   Workers
                                packages/ + services/

Business Intelligence           BI Hub frontend.        TanStack/React  app.integratewise.ai
Account Success & TAM           CS Hub frontend.        TanStack/React  accounts.integratewise.ai
integratewise-ops               Ops surface.            Vue3/Nuxt       ops.integratewise.ai (internal)
integratewise-docs              Public docs.            Static          docs.integratewise.ai
```

### Shared Packages (from integratewise-live/packages/)

```
@integratewise/types        TypeScript types, schemas (EXISTS)
@integratewise/api-client   Gateway fetch wrapper, framework-agnostic (NEW)
@integratewise/hooks        React Query wrappers for BI + AS (NEW)
@integratewise/ui           Shared React components (NEW)
@integratewise/adk          Registry + cache. Routing. (NEW)
```

### Independence

```
Each repo ships independently. Each builds independently.
Shared logic in packages/ — fix once, all repos update.
Gateway is the single API contract (OpenAPI spec).
No repo blocks another. Different agents work in isolation.
```

---

## B7. Phased Wiring (Priority Order)

```
WIRE 0    Apply 032_governed_proposals.sql to Supabase (P1 BLOCKER)
WIRE 1    /desk → MorningContext API (morning-context-builder.ts is BUILT)
WIRE 2    /inbox → HITL queue + engagement entities + signals
WIRE 3    Twin Board → auto-activation + POST /api/v1/twin/chat
WIRE 4    L2 overlay slim-down (remove Twin/AIChat, keep spine+context)
WIRE 5    /entity360 → build as first-class view (D1 + Vectorize + D1)
WIRE 6    /memory → personal_memory + org_memory + Vectorize search
WIRE 7    /react → live signal queue (distinct from /triage)
WIRE 8    Vectorize pipeline (R2 → chunk → embed → index)
WIRE 9    Shared packages (api-client, hooks, ui)
WIRE 10   External LLM (per-tenant MCP endpoint + CF Zero Trust token)
WIRE 11   Five Connections (memory-repo, folder-watcher, continuity→Supabase, ops wiring, docs pipeline)
WIRE 12   Paywall (Stripe/Razorpay webhook → tier → frontend gate)
```

---

## B8. What's Already Built

```
✅ 8-stage Normalizer + Spine write (pipeline)
✅ Think service + 10 twin triggers + evaluateTriggers()
✅ Proposal lifecycle (govern, 9 routes, 8-state machine)
✅ Act service
✅ CF Workflow (TriageWorkflow — durable execution)
✅ HITL gate Durable Object
✅ Nango connector layer (30+ tools, OAuth, token refresh)
✅ MCP server (20 tools)
✅ Session capture (/v1/mcp/capture_session)
✅ MorningContextBuilder (morning-context-builder.ts)
✅ Zero Trust (CF Access, 4 public domains, service bindings)
✅ memory.* tables (Supabase + D1 partial mirror)
✅ Account Success views (27 — real data)
✅ BizOps views (14 modules — real data)
✅ Sidebar nav — projection-native
✅ AI Insight popup system
✅ All BI Hub routes (desk, twin, inbox, memory, triage, run, decide, build, grow, horizon)
✅ All AS routes (dashboard, accounts, inbox, memory, tasks, twin)
✅ TwinCopilot.tsx (ops — brain selector, dials, canvas, HITL)
✅ memory.index.tsx (ops — Coda-style dual-pane memory hub)
✅ run.tsx (ops — 4 Edge Agent grid, CLI sandbox, sync logs)
✅ verify-architecture-alignment.ts (Zero Python + CouchDB audit)
✅ Edge routing: pipeline.dev / gateway.dev / ingress.dev
✅ services/billing (Stripe + Razorpay worker)
```

---

---

---

# SECTION C — THE MEMORY LOOP (BUILD THIS FIRST)

Everything else falls into place once the memory loop works.

---

## C1. Why Memory First

```
Without the memory loop:
  - Every AI session starts cold
  - Decisions made yesterday are invisible today
  - Org knowledge stays in filesystem/Gemini brain (scattered, agent-specific)
  - Twin cannot answer "what do we know about X" (Vectorize is empty)
  - Entity 360 shows Spine only (operational truth without institutional context)
  - Docs pipeline has nothing to publish

With the memory loop:
  - Every session starts with full context
  - Decisions compound (yesterday's approval = today's knowledge)
  - All AI agents (Gemini, Kimi, Kiro, Claude, ChatGPT) contribute to one memory
  - Twin answers from real institutional knowledge
  - Entity 360 shows Spine + Memory intersection (insights emerge)
  - Docs pipeline has governed content to publish
  - Progressive discussion between founder and agent becomes real
```

---

## C2. The Memory Loop — Complete Specification

```
CONVERSATIONAL MEMORY → PROMOTION → ORG MEMORY → VECTORIZE → TWIN READS

This is the only path. There is no shortcut. Org memory is ALWAYS formed
from conversational memory. It is never written directly.
```

### The Loop

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        THE MEMORY LOOP                                   │
│                                                                          │
│  1. CAPTURE                                                              │
│     Any conversation (Twin session, external LLM, manual input)          │
│     → memory.write_conversational (MCP tool)                             │
│     → conversational_memory table (D1 + Supabase)                       │
│     Automatic. No governance needed. This is the scratchpad.             │
│                                                                          │
│  2. IDENTIFY                                                             │
│     Twin (or swarm agent) identifies something worth keeping:            │
│     a decision, a pattern, a commitment, a learning, an insight          │
│     Not everything gets promoted — only what has lasting value.           │
│                                                                          │
│  3. PROPOSE                                                              │
│     → memory.propose (MCP tool)                                          │
│     → D1 proposals table (Triage Bot queue)                              │
│     Payload:                                                             │
│       tenant_id, content_type, title, body                               │
│       target_layer: "organisational" | "personal" | "entity"             │
│       confidence: 0.0–1.0                                                │
│       evidence_chain: [source references]                                │
│       tags: [categories]                                                 │
│                                                                          │
│  4. GOVERN                                                               │
│     Triage Bot (CF Workflow) scores on 5 dimensions:                     │
│       confidence + relevance + risk + conflict + quality                  │
│     ≥ 0.85 → auto-approve                                               │
│     0.60–0.84 → HITL (human review in Governance bench)                  │
│     < 0.60 → reject                                                     │
│                                                                          │
│  5. STORE                                                                │
│     Approved entry written to THREE places atomically:                    │
│       R2: raw content (cold, source of truth)                            │
│       Supabase org_memory: metadata (via pipeline db-proxy)              │
│       D1: metadata mirror (for human browse at /memory)                  │
│                                                                          │
│  6. INDEX                                                                │
│     → Vectorize: chunk → embed → semantic index                          │
│     → Entity linking: which entities does this relate to?                │
│     → Now retrievable by Twin via AI Search                              │
│                                                                          │
│  7. RETRIEVE                                                             │
│     Next Entity 360 assembly:                                            │
│       Vectorize query → top K relevant memory for this entity            │
│     Next Twin session:                                                   │
│       Briefing includes newly promoted knowledge                         │
│     The insight that was approved yesterday is context today.             │
│                                                                          │
│  LOOP CLOSES.                                                            │
│  New session → new conversation → new promotable insights →              │
│  new proposals → governance → store → index → retrieve → repeat.         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## C3. The Initial Load (Using Agent Swarm)

```
SOURCE:
  /Users/nirmal/Github/IntegrateWise - Memory/ (1,017+ docs)
  /Users/nirmal/.gemini/antigravity/brain/ (18 sessions, architecture, wireframes)
  /Users/nirmal/Github/integratewise-live/.kimi/ (3 transcripts)
  All prior AI conversations that produced decisions

TOOL:
  BulkCleanupSwarmWorkflow (CF Workflow, durable)
    → DataCleanerAgent: parse markdown, extract frontmatter, normalize
    → EntityResolverAgent: match to Spine entities, assign entity_refs, deduplicate
  Chunks of 5 records. Fan-out. Handles errors per chunk.

SEQUENCE:

STEP 1: INGEST AS CONVERSATIONAL
  Memory-repo connector reads vault + AI session transcripts
  Each document → memory.write_conversational (MCP)
    session_id: "initial_load_{category}_{uuid}"
    role: "system"
    content: document body
    metadata: { source, category, file_path, frontmatter }
  → conversational_memory populated with raw historical content.

STEP 2: SWARM CLEANS + RESOLVES
  BulkCleanupSwarmWorkflow triggered per batch:
    DataCleanerAgent: parse, normalize, extract structured data
    EntityResolverAgent: match entities, assign spine_ids, deduplicate
  Output: cleaned records with entity_refs and category assignments.

STEP 3: PROMOTE VIA memory.propose
  Each cleaned record that is decision/doctrine/pattern/commitment/learning:
    memory.propose (MCP):
      target_layer: "organisational"
      content_type: from frontmatter category
      confidence: 0.85 (pre-existing approved docs)
      evidence_chain: [file_path, session_id]
  → D1 proposals table filled.

STEP 4: TRIAGE BOT PROCESSES
  CF Workflow (TriageWorkflow):
    ≥ 0.85 → auto-approve (initial load = pre-vetted)
    Conflicts → human_review
  Approved → org_memory written (R2 + Supabase + D1).

STEP 5: VECTORIZE INDEXING
  Every approved entry → R2 → chunk → embed → Vectorize index
  Entity_refs + category stored as metadata in index.
  Twin can now retrieve via AI Search.

STEP 6: VERIFY
  Entity 360 shows memory intersection for known entities.
  Twin answers from org_memory via Vectorize.
  /memory UI populated.
  Memory loop is primed. Ongoing sessions compound from here.
```

---

## C4. Ongoing Operations

```
EVERY TWIN SESSION:
  Conversation → memory.write_conversational (auto)
  Twin identifies promotable content → memory.propose
  Triage Bot governs → approved → R2 → Vectorize → org_memory
  Next session: Twin briefing includes the new knowledge

EVERY EXTERNAL LLM SESSION:
  Claude/ChatGPT via MCP → session captured → memory.write_conversational
  If promotable → memory.propose → same governance pipeline

EVERY DOCUMENT UPLOAD:
  Knowledge service processes → context_extractions linked to entities
  If promotable → memory.propose → same governance pipeline

EVERY APPROVAL/REJECTION:
  Approve → org_memory + Vectorize (knowledge compounds)
  Reject → stored as rejected (lineage preserved, Twin learns)
```

---

## C5. MCP Tools That Power the Memory Loop

```
memory.write_conversational   Capture to scratchpad         Stage 1 (Capture)
memory.read_conversational    Read session context           (briefing assembly)
memory.propose                Submit for promotion           Stage 3 (Propose)
memory.search_org             Search approved org memory     Stage 7 (Retrieve)

All exist. All deployed. All callable internally and externally via MCP.
The loop requires ZERO new backend tools.
```

---

## C6. Wiring Needed to Complete the Memory Loop

```
1. Memory-repo connector trigger (script exists → schedule + run)
2. Gemini/Kimi transcript ingestion (same pattern as vault)
3. BulkCleanupSwarmWorkflow endpoint invocation
4. Vectorize pipeline (R2 → chunk → embed → index) — not yet wired
5. Triage Bot auto-approve path verified with real data
6. D1 metadata mirror sync (full org_memory)
7. Entity 360 Vectorize query integration
8. Twin session briefing reads from Vectorize (Layers 2+6)

Priority: 1–5 first. Once memory flows through the full loop,
everything downstream (UI, Entity 360, Twin briefing) just reads from it.
```

---

## C7. This Conversation — Documented as Memory

Decisions made in this session that must enter the loop:

```
D-2026-06-04-001: No Hermes, no Claw. Twin is the only agent. Model-agnostic.
D-2026-06-04-002: No n8n. CF Workflows + CF Queues + DOs replace it.
D-2026-06-04-003: ADK = registry + cache only. No state, no memory, no orchestration.
D-2026-06-04-004: Insights live at Entity 360 only. Nowhere else.
D-2026-06-04-005: Memory retrieved via AI Search (Vectorize) only. Not D1. Not Supabase.
D-2026-06-04-006: Entity 360 is first-class left panel view. Not a drawer tab.
D-2026-06-04-007: L2 slimmed to spine + context only. Everything else moved out.
D-2026-06-04-008: Org memory ALWAYS formed from conversational memory. Never direct write.
D-2026-06-04-009: Build memory loop FIRST. Everything else follows.
D-2026-06-04-010: Paywall = runtime feature flags. One codebase. One deploy.

When memory loop is built: these enter via memory.propose → Triage Bot → org_memory → Vectorize.
Every future session will have these as context. This conversation never needs repeating.
```

---

---

# SECTION D — PRODUCT PILLARS & CONTINUITY BRIDGE

---

## D1. The Three Product Pillars

```
IW WORKSPACE     Where the Real Twin works.
IW TWIN          The Digital Twin.
IW GOVERNANCE    The trust between them.
```

---

## D2. Real Twin vs Digital Twin

```
REAL TWIN (the user):
  Works in IW Workspace.
  Makes decisions.
  Approves or declines proposals.
  Connects tools.
  Reviews insights at Entity 360.
  The human. The authority. The source of intent.

DIGITAL TWIN (the AI):
  A continuously evolving representation of the user's work, context,
  memory, relationships, commitments, and operating patterns.

  Reads from Spine (operational truth).
  Reads from Memory (institutional knowledge via Vectorize).
  Reasons across both.
  Learns through continuity (sessions compound, patterns promote).
  Proposes actions.
  Never bypasses Governance.

  Model-agnostic. Runs on any LLM. The model is a parameter, not a dependency.
  Not a chat interface — a true continuity layer synchronized with operational reality.

IW GOVERNANCE (the trust layer):
  Sits between Real Twin and Digital Twin.

  Real Twin       ↕ Governance       ↕ Digital Twin

  Everything proposed by the Digital Twin is:
    Proposed → Scored → Approved → Recorded
  before execution.

  Nothing crosses without governance.
  Triage Bot scores confidence.
  Proposal queue holds pending actions.
  HITL gate for uncertain decisions.
  The boundary. The trust. The audit trail.
```

---

## D3. IW Governance Workbench

IW Governance is NOT merely an approval queue.
It is the collaborative operating layer where Real Twin and Digital Twin **engage together**.

### Purpose

```
Work is coordinated.
Decisions are reviewed.
Procedures evolve.
Knowledge accumulates.
Actions are governed.
Outcomes are recorded.
```

The Governance Workbench sits between thinking and acting.

### Core Principle

```
The Digital Twin does not primarily CHAT.
The Digital Twin primarily WORKS.

The shared task board is the primary collaboration surface.
Chat remains available as a supporting interaction, but:
  Tasks, Proposals, Decisions, and Outcomes
are the primary objects of collaboration.
```

### Governance Workbench Structure

```
1. SHARED TASK BOARD (center of collaboration)
   Both Real Twin and Digital Twin interact through the same board.

   Task Sources:
     Human users, Digital Twin, Signals, Workflows, Connectors, External systems

   Task Structure:
     Goal, Description, Context, Related Entities, Related Documents,
     Procedures, Knowledge References, Status, Priority, Assignee,
     Due Date, History, Outcomes

   Digital Twin may: create tasks, update tasks, suggest priorities,
     identify blockers, recommend next actions, detect duplicate work,
     link related knowledge, attach supporting evidence

   Real Twin may: create tasks, update tasks, approve/reject recommendations,
     assign work, close work, provide judgment

2. PROPOSAL QUEUE
   Every recommendation from Digital Twin enters here.

   Examples: process changes, workflow updates, memory promotions,
     escalation recommendations, new procedures, automation suggestions,
     strategic recommendations

   States: Draft → Pending Review → Approved → Rejected → Deferred → Executed

   Every proposal contains:
     Confidence score, Risk score, Evidence, Source context,
     Impact estimate, Linked entities

3. DECISION LEDGER
   Permanent record of decisions.

   Records: what, why, who approved, supporting evidence,
     expected outcome, actual outcome

   Decisions become organizational memory after governance review.

4. MEMORY PROMOTION QUEUE
   Controls what becomes institutional knowledge.

   Sources: conversations, tasks, procedures, decisions, documents, workflows

   Flow:
     Conversational Memory → Proposal → Governance Review
     → Organizational Memory → Book of Records

5. PROCEDURE EVOLUTION
   Users attach procedures to tasks.
   Digital Twin proposes improvements.
   Changes enter Governance. Real Twin approves or rejects.
   Approved procedures become governed organizational knowledge.

   Example:
     Current: Review account → Schedule meeting → Send summary
     Proposed: Review account → Analyze support history → Check expansion signals
              → Schedule meeting → Generate briefing → Send summary

6. OUTCOME TRACKING
   Every completed task generates outcomes.
   States: Successful, Failed, Partial Success, Escalated, Deferred

   Outcomes linked to: Entities, Procedures, Decisions, Signals, Memory
   Creates continuity and learning.

7. AUDIT & LINEAGE
   Every action recorded: who created, who modified, who approved,
   what changed, when, why.

   Nothing enters organizational memory without lineage.
```

### Relationship With Other Pillars

```
GOVERNANCE ↔ SPINE:
  Governance references Spine entities but does not replace the Spine.
  Spine: entities, relationships, signals, operational truth.
  Governance: tasks, proposals, decisions, procedures, approvals, outcomes.

GOVERNANCE ↔ MEMORY:
  Governance controls promotion INTO memory.
  Memory preserves continuity. Governance controls trust.
  Nothing enters org_memory without governance approval.

GOVERNANCE ↔ TWIN:
  Digital Twin continuously: monitors tasks, reads context, reads memory,
  reads Spine entities, identifies risks, suggests actions, maintains continuity.
  The Twin NEVER bypasses Governance.

GOVERNANCE ↔ WORKSPACE:
  IW Workspace — where the Real Twin works.
  IW Twin — the Digital Twin.
  IW Governance — where the Real Twin and Digital Twin engage TOGETHER.
```

### The Core Relationship

```
Shared Tasks. Shared Decisions. Shared Accountability. Shared Continuity.

The Real Twin decides.
The Digital Twin assists.
Governance records, controls, and evolves the collaboration.
```

---

## D3b. Positioning Statement

> IW Workspace is where you work. IW Twin is your Digital Twin.
> IW Governance is where you engage together.

> Real Twin and Digital Twin. Working together through shared tasks, memory, and governance.

---

## D4. IW Continuity Bridge (The Core Product Engine)

The bridge is not MCP. MCP is a protocol adapter. The bridge is the normalization +
continuity + governance layer that sits above any protocol.

```
IW CONTINUITY BRIDGE
  ├── Loader (universal intake — any source, any format)
  ├── Normalizer (8-stage, LLM-in-the-loop)
  ├── Entity Resolution (one Person across HubSpot + Jira + Gmail)
  ├── Trait Detection (18 traits, 7 resource types)
  ├── Spine Cache (D1 — operational truth at edge)
  ├── Delta Sync (cursor-based, schema-driven)
  ├── Webhook Processing (real-time intake)
  ├── Memory Linking (entity_refs to Spine entities)
  └── Protocol Adapters
        ├── MCP (Claude, ChatGPT, Perplexity, any MCP client)
        ├── REST (browser apps, internal services)
        ├── GraphQL (future)
        └── Future protocols
```

### Why "Continuity Bridge" Not "MCP Bridge"

```
MCP is one protocol. It will be superseded or versioned.
The bridge is permanent. The normalization is permanent.
Entity Resolution is permanent. Trait Detection is permanent.

Workato, Zapier, Composio — they route data.
IntegrateWise normalizes, resolves, governs, remembers.

The continuity is the moat.
The normalization is the moat.
The governed memory is the moat.
MCP is just one door into the house.
```

### What Sits Above Protocol

```
Protocol layer (MCP / REST / GraphQL)
       ↕
GOVERNANCE (Zero Trust + Triage Bot + Proposal Queue + HITL)
       ↕
CONTINUITY BRIDGE (Loader + Normalizer + Entity Resolution + Spine Cache)
       ↕
MEMORY (R2 + Vectorize + governed org_memory)
       ↕
TOOLS (50+ connectors via Nango + adapters)
```

---

## D5. Connection Paths (Corrected — No Supabase for Initial Users)

Per D-011: CF edge creates user first. Supabase only after promotion (usage review, Nirmal decides).

### Onboarding Sequence

```
Signup → Role + Department + Industry
  → Schema Selection (writes D1 tenant_spine_config)
  → Connector Projection (Nango Connect UI)
  → Auth Flow (Nango handles OAuth)
  → SPINE SCHEMA HYDRATION
  → Loader → Normalizer → Spine D1 (creamy initial load)
  → Dashboard loads with real data
```

### Three Connection Paths — Unified

```
HOW DATA ENTERS THE SPINE (Three Channels)

CHANNEL 1 — VIA CONNECTOR (pull-based, Nango-managed OAuth)
  User connects a tool (HubSpot, Jira, Stripe, etc.)
  → Nango handles OAuth + token storage + refresh
  → connector-sync polls delta (cron every 5 min)
  → OR webhook-ingress receives real-time event
  → SPINE SCHEMA HYDRATION (validate entity types against tenant_spine_config)
  → Loader (8 stages) → Normalizer (8 stages) → Spine D1

  This is the standard path for 30+ supported tools.
  Auth: Nango holds tokens. D1 holds config. KV holds status.

CHANNEL 2 — VIA API WRAPPER (non-MCP tools, REST APIs wrapped by us)
  Two sub-paths:

  2A — Nango-authed (tool supports OAuth, we wrap it)
    Same as Channel 1 but for tools without native connector adapters.
    Auth via Nango → API call → response wrapped →
    SPINE SCHEMA HYDRATION → Loader → Normalizer → Spine D1

  2B — API Router / Key-based (tool uses API key, no OAuth)
    Auth: API key stored in D1 (tenant config) or KV
    Our wrapper calls tool API → response →
    SPINE SCHEMA HYDRATION → Loader → Normalizer → Spine D1

  HARD RULE: ALL non-MCP data ingestion goes through Loader → Normalizer.
  Nothing touches Spine without the pipeline. Period.

CHANNEL 3 — VIA MCP (protocol-native, two sub-paths)

  3A — API WRAPPER over MCP (MCP as transport, data still normalizes)
    External system pushes data via MCP protocol (tool calls)
    BUT the data is raw/unstructured from source tools.
    → Routed to Loader → Normalizer → Spine D1
    Same pipeline. MCP is just the transport.
    Example: a custom integration that speaks MCP but pushes CRM records.

  3B — NATIVE MCP (true protocol-native speakers)
    Claude / ChatGPT / Perplexity / Agent frameworks → mcp.integratewise.ai
    Auth: CF Zero Trust Service Token + Bearer JWT
    These are READERS + GOVERNED WRITERS:
      Read: D1 Spine + Vectorize Memory (via spine.*, memory.* MCP tools)
      Write: memory.propose → Triage Bot → governed path

    Native MCP clients DO NOT go through Loader/Normalizer.
    WHY: data is already structured/normalized by protocol definition.
    They speak directly to the Spine through the protocol adapter.

    BUT: they NEVER write to Spine directly.
    They can only: read Spine, read Memory, propose to governance.
```

### The Complete Map

```
SOURCE                    AUTH                CHANNEL     PIPELINE?        SPINE WRITE?
─────────────────────────────────────────────────────────────────────────────────────────
HubSpot, Jira, Stripe    Nango OAuth         1           YES (full)       Loader→Norm→D1
Gmail, Slack, Drive       Nango OAuth         1           YES (full)       Loader→Norm→D1
Custom REST API (OAuth)   Nango OAuth         2A          YES (full)       Loader→Norm→D1
Custom REST API (key)     API key (D1/KV)     2B          YES (full)       Loader→Norm→D1
MCP wrapper (raw data)    MCP + Zero Trust    3A          YES (full)       Loader→Norm→D1
Claude/ChatGPT (native)   MCP + Zero Trust    3B          NO (native)      READ ONLY + propose
Perplexity (native)       MCP + Zero Trust    3B          NO (native)      READ ONLY + propose
Custom agent (native)     MCP + Zero Trust    3B          NO (native)      READ ONLY + propose
User manual entry         Gateway JWT         2B          YES (via proxy)  Loader→Norm→D1
Document upload           Gateway JWT         —           Knowledge svc    R2→Vectorize (not Spine)
```

### The Hard Rules (Crystallized)

```
1. ALL non-MCP data → Loader → Normalizer → Spine D1. No exceptions.
2. MCP as wrapper (3A) still goes through Loader → Normalizer. MCP is just transport.
3. Native MCP speakers (3B) are READERS + GOVERNED PROPOSERS. Never Spine writers.
4. NOTHING writes to Spine D1 without the pipeline. Pipeline is the sole writer.
5. Native MCP clients DO NOT call connectors. They call Spine/Memory MCP tools.
6. Non-MCP connectors NEVER call our MCP server. They go through their channel.
7. Schema Hydration happens BEFORE Loader (validates entity types against config).
```

### What This Means for the ADK + MCP Gateway

```
MCP GATEWAY (mcp.integratewise.ai)
  │
  ├── READS (anyone with valid auth):
  │     spine.entity.get    → D1
  │     spine.entity.list   → D1
  │     spine.entity.search → D1
  │     signal.list         → D1
  │     memory.search_org   → Vectorize
  │     memory.read_conversational → D1
  │
  ├── GOVERNED WRITES (propose only):
  │     memory.propose      → D1 proposals → Triage Bot
  │     memory.write_conversational → D1 (auto, no governance)
  │     proposal.approve    → governance gate
  │     proposal.reject     → governance gate
  │
  └── INGEST (3A path — MCP as wrapper, still normalizes):
        connector.push_raw  → Loader → Normalizer → Spine D1
        (for tools that speak MCP but push raw source data)

ADK (stateless registry + cache):
  "Which service handles this tool call?" → KV lookup → route
  No memory. No state. No logs. KV-speed TTL.
```

### What Is NOT Needed (Removed)

```
✗ Supabase connectors table (Nango holds tokens)
✗ token-refresh.ts direct Supabase reads (Nango handles refresh)
✗ Direct OAuth in tenants service for new users (use Nango)
✗ @supabase/supabase-js for connector auth (Nango replaces)
```

---

## D6. The Publishable Asset — IW Continuity Bridge

```
WHAT WE CAN PUBLISH:
  Combined Loader + Normalizer + Spine Cache as a standalone bridge.
  Open or commercial — available for any user globally.

WHAT IT DOES:
  Any system → Continuity Bridge → Normalized Spine
  Then: any MCP client (ChatGPT, Claude, Perplexity, custom agents)
  can read from the Spine through the MCP protocol adapter.

WHY IT MATTERS:
  Right now: ChatGPT can call tools, but has no continuity.
  With IW Bridge: ChatGPT reads from a continuously synchronized,
  normalized context layer. It remembers. It has operational truth.

THIS IS THE WEDGE:
  Not "connect tools to MCP" (commodity).
  "Connect any system ONCE. Every AI operates from the same normalized continuity layer."
  That is much harder to copy.
```

---

## D7. The Spine Abstraction Principle

```
THE SPINE ABSTRACTION PRINCIPLE

Once a tool is connected to IntegrateWise:
  - No AI agent ever reads from that tool directly again.
  - The tool exists as a write-only data source to the Spine.
  - Spine Cache is the query target. Always. For every agent.
  - Agents read from Spine Cache in <10ms, rather than slow, rate-limited tool APIs.
  - Agents do not hold credentials to tools. Credentials live in Nango.

For tools not yet connected:
  - Spine returns "connector_not_available" with a connect_url.
  - Agents cannot route around Spine or establish stateless direct channels.
```

### The Inbound/Outbound Inversion

```
Inbound (Tool -> Spine Ingestion):
  Tool Webhook/Sync -> Gateway -> Connector -> Loader -> Normalizer -> Spine D1

Outbound (Agent -> Spine Consumption):
  Agent -> MCP Server -> Gateway -> Spine Cache (D1/KV/Vectorize) -> Agent
```

---

## D8. Three-Channel MCP Split

To prevent context pollution, the MCP interface exposes three distinct channels:

1. **Memory MCP (Institutional Knowledge)**
   - Target: Vectorize (pgvector)
   - Scope: Read-only promoted/approved org memory and personal behavior rules.
2. **Session MCP (Operational Context)**
   - Target: D1 Edge tables + KV Hot Cache (Entity 360)
   - Scope: Active session state, working entities, and current brief details.
3. **Tool MCP (Execution & Actions)**
   - Target: BFF Hono / Gateway Hops
   - Scope: Propose memories, trigger syncs, dispatch playbooks.

---

## D9. Loader & Normalizer Stages

### The 8-Stage Loader (Universal Ingest Pipeline)

```
S1 Analyzer   — Computes SHA-256 payload fingerprint and wraps in Ingestion Envelope.
S2 Classifier — Detects data_kind (entity, activity, event, file) and checks PII sensitivity.
S3 Filter     — Checks idempotency via fingerprint logs. Validates tenant schema.
S4 Refiner    — Splits composite payloads, normalizes key names, resolves target domains.
S5 Extractor  — Maps fields to canonical schema structure (CRM, Billing, Eng, etc.).
S6 Validator  — Executes required field audits and data type checks (warning vs error).
S7 Split Router— Computes write targets (Spine vs. R2 Context vs. Audit logs).
S8 Writers    — Writes payload to target storage and enqueues Normalizer processing.
```

### The 6-Stage Normalizer (Truth & Context Linkage)

```
NA0 Schema Detector      — Prunes data fields to tenant's adaptive schema bounds.
NA1 Canonical Transformer — Formats and transforms field traits.
NA2 SSOT Binder          — Injects or resolves stable UUIDs for resolved records.
NA3 Lineage Manager      — Records source tool provenance, sync times, and trace IDs.
NA4 Relation Binder      — Maps related IDs from source keys to Spine UUIDs (e.g. contact.company_id -> account UUID).
NA5 Spine Publisher      — Publishes structured entity to D1 Cache and context payload to Knowledge Queue.
```

---

## D10. Edge-Case Lifecycles

### 1. New Connection Post-Onboarding

Connecting a new tool via the Nango Connect UI immediately triggers a delta sync pull (bypassing the 5-minute cron queue) to hydrate the new entity types and update the `tenant_spine_config` within the 12×11 matrix.

### 2. Detailed Ingest Queue States (`CONNECTOR_STATUS` KV)

- `not_connected`
- `oauth_pending`
- `oauth_complete` (Nango holds tokens, sync not started)
- `syncing_initial` (Creamy initial load in progress)
- `sync_complete` (Spine contains baseline data, dashboard ready)
- `sync_error` (Identifies the failed loader/normalizer stage)
- `syncing_delta` (Background poll active)

### 3. Knowledge Ingestion Ordering

If context files (Drive, Slack messages) reference entities not yet synced to Spine, the linking is deferred to a background `entity-linker` job to prevent orphaned context records.

### 4. Entity Eviction & Soft Deletes

Deleted records in HubSpot/Salesforce are not hard-deleted from Spine. Instead, they are marked with a soft delete tombstone flag (`is_deleted = true`) to prevent the Twin from proposing operations on ghost entities.

### 5. Reindex Reverse Verification

The reindex job verifies Vectorize embeddings against R2. If an embedding exists in Vectorize but the corresponding raw doc is missing from R2, it is flagged as `orphaned_vector` for manual review.

### 6. Personal Memory Auto-Promotion Thresholds

A behavioral pattern or context rule candidate is auto-promoted to personal memory when it occurs in **5 or more distinct sessions** within a rolling 30-day window, with a pattern detection confidence score **≥ 0.70**.

### 7. Triage Bot Initial Load Scoring

To prevent raw data ingestion from flooding the approved `org_memory`, the initial load documents are scored dynamically by document category:

- **Architecture Docs:** base confidence **0.90**
- **Meeting Transcripts:** base confidence **0.70**
- **Work Notes:** base confidence **0.75**

### 8. Gateway vs. Governance Boundaries

- **Gateway:** Auth, Zero Trust, rate limits, CORS, context packaging. (Enforcer)
- **Governance (Triage Bot):** Proposal workflow, scoring, conflict detection, HITL approvals. (Decision Engine)

---

_No Hermes. No Claw. No n8n. No Python. No CouchDB. No Neon._
_One Twin. Model-agnostic. One Spine. One protocol adapter (MCP). One loop that never breaks._
_Real Twin and Digital Twin. Working together through shared context, memory, and governance._
_Build the memory loop first. Everything else falls into place._
_One document. Complete. Final._
