# IntegrateWise — Overall Architecture & Data Flow

> **Date:** 2026-06-09 | **Authority:** Nirmal (Founder) | **Version:** 1.2
> **Status:** Canonical | LIVE — all services deployed and responding
> **Auth:** Cloudflare Access (Google + GitHub) + Gateway D1 JWT. Zero Supabase auth.
> **Frontend:** CF Gateway wiring COMPLETE (June 9, 2026). Zero Supabase frontend dependency.
>
> **Changelog v1.2 (2026-06-09):** Frontend fully wired to CF Gateway. AuthManager
> (OAuth 2.0 PKCE + token refresh), GatewayHttpClient (retry/offline), SpineGatewayAdapter
> (drop-in spineClient replacement), SSE real-time, TanStack Query, onboarding API,
> hydration hooks, network context, build-time Supabase enforcement all implemented.
> 14/14 spec tasks complete. E2E tests added.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           USER SURFACES                                          │
│                                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │ BI Hub      │  │ Acc Success │  │  Ops Board  │  │ Knowledge Store      │   │
│  │ (TanStack)  │  │ (TanStack)  │  │  (Vue3)     │  │ (Book of Projects)   │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘   │
│         │                │                │                     │               │
│         └────────────────┴────────────────┴─────────────────────┘               │
│                                    │                                             │
│                    VITE_API_BASE_URL = gateway.dev.integratewise.ai              │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │            TWIN  —  the IW CONTINUITY BRIDGE (the product)                │   │
│  │            Agent Zero + Open WebUI | Grok-4.3 | x.ai Voice "eve"          │   │
│  │            Hostinger | continuity-tool-server → pipeline                  │   │
│  │            Reaches Spine via the Bridge. MCP + auth gate access to it.    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE EDGE (The Brain)                              │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐                │
│  │                    GATEWAY                                   │                │
│  │            gateway.dev.integratewise.ai                      │                │
│  │    Auth (D1 JWT) │ Routing │ Rate Limiting │ Zero Trust      │                │
│  └────────┬──────────┬──────────┬──────────┬──────────┬────────┘                │
│           │          │          │          │          │                          │
│     ┌─────▼────┐┌───▼────┐┌───▼─────┐┌──▼────┐┌───▼──────┐                   │
│     │ PIPELINE ││INTELLI-││KNOWLEDGE││ BFF   ││ WEBHOOK  │                    │
│     │          ││GENCE   ││         ││       ││ INGRESS  │                    │
│     │8-stage   ││Think   ││Embedding││Tasks  ││Nango     │                    │
│     │Normalizer││Act     ││Triage   ││Decide ││HubSpot   │                    │
│     │SOLE Spine││Govern  ││Search   ││HITL   ││Stripe    │                    │
│     │writer    ││Signals ││Memory   ││       ││Slack     │                    │
│     └────┬─────┘└────────┘└────┬────┘└───────┘└────┬─────┘                    │
│          │                     │                    │                           │
│  ┌───────▼─────────────────────▼────────────────────▼──────────────────┐       │
│  │                    MCP SERVER (mcp.integratewise.ai)                 │       │
│  │              20 tools | Auth: Bearer + CF Access                     │       │
│  │     memory.* │ spine.* │ book.* │ kb.* │ proposal.*                 │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────┐              │
│  │                    ADK (Capability Resolver)                   │              │
│  │    @integratewise/adk | Capability → Implementation routing   │              │
│  │    Agent Registry | Spine Cache | Tier Gating | Fallback      │              │
│  └───────────────────────────────────────────────────────────────┘              │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────┐              │
│  │                    CONNECTOR-SYNC                              │              │
│  │    26 providers | 3 modes (creamy/delta/full)                  │              │
│  │    Schema-driven | Cursor-based | Queue-isolated              │              │
│  └───────────────────────────────────────────────────────────────┘              │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    STORAGE LAYER                                         │    │
│  │                                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐    │    │
│  │  │    D1    │  │    KV    │  │    R2    │  │Vectorize│  │AI Search│    │    │
│  │  │spine_vault│  │hot cache │  │cold store│  │1536-dim │  │bge-base │    │    │
│  │  │(encrypted)│  │60-300s   │  │documents │  │semantic │  │auto-embed│    │    │
│  │  │entities  │  │signals   │  │backups   │  │index    │  │free     │    │    │
│  │  │memory    │  │connector │  │memory raw│  │         │  │         │    │    │
│  │  │tenant    │  │ADK route │  │          │  │         │  │         │    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘  └─────────┘    │    │
│  │                                                                          │    │
│  │  ┌──────────────────────────────────────────┐                            │    │
│  │  │              QUEUES (10)                  │                            │    │
│  │  │  pipeline-process | signals | knowledge  │                            │    │
│  │  │  intelligence-events | accelerator       │                            │    │
│  │  │  intelligence-act | *-dlq (4)            │                            │    │
│  │  └──────────────────────────────────────────┘                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    NANGO (OAuth Token Vault)                             │    │
│  │    200+ providers | Token refresh | Connection UI                        │    │
│  │    Holds ALL tool credentials. Workers never see raw tokens.             │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL TOOLS (Data Sources)                            │
│                                                                                  │
│  HubSpot │ Salesforce │ Jira │ Stripe │ Slack │ Gmail │ GitHub │ ...            │
│                                                                                  │
│  Tool identity dies at the Normalizer. Spine never knows the source.            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Product Is the IW Continuity Bridge

The thing a user actually buys and uses is the **IW Continuity Bridge** — the
continuity of context across every tool, every session, every agent. The Twin
(Agent Zero + Open WebUI + Grok-4.3 + x.ai voice) is the _surface_ of the Bridge.
The Spine, Memory, and connectors are the _substance_ behind it.

The Bridge is what makes the system never start cold: it carries your context
forward so your AI speaks first, every time.

```
WHAT THE BRIDGE IS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  IW Continuity Bridge = the live link between the user's Twin and the Spine.
  Runtime path:  Twin (Hostinger) → continuity-tool-server → services/pipeline
                 → Spine (D1 vault) + Memory (AI Search) + Signals
  It is NOT the raw MCP server. MCP is one transport underneath the Bridge.
  The Bridge composes auth + gateway + MCP + continuity into one experience.


WHAT A USER NEEDS TO ACCESS THE BRIDGE (the full access stack)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. IDENTITY        CF Access SSO (Google or GitHub). No password.
  2. SESSION JWT     Gateway issues/validates JWT → injects x-tenant-id.
                     (Updated: D1 edge JWT + CF Access. Zero Supabase auth.)
  3. TENANT          Active tenant with hydrated tenant_spine_config (from L0).
  4. GATEWAY         gateway.dev.integratewise.ai — every call routes through it.
  5. CONTINUITY      continuity-tool-server bridges the Twin to pipeline/Spine.
                     (This is the runtime read path — not the public MCP server.)
  6. MCP (optional)  mcp.integratewise.ai — for EXTERNAL agents (Claude, ChatGPT)
                     reaching the same Spine. Auth: CF Access service token + HMAC.
  7. ENTITLEMENTS    Plan tier + awareness profile gate which layers/signals show.

  In short: the Bridge is the product; auth + gateway + continuity + (MCP for
  external agents) are the keys that unlock it. No single key works alone.
```

---

## The Full Vertical Stack (canonical, top to bottom)

```
TOOLS / SYSTEMS / DOCUMENTS / PEOPLE
  HubSpot · Stripe · Jira · Slack · Gmail · Drive · GitHub
  Notion · Salesforce · Intercom · Linear · ERP
        │
        ▼
NANGO AUTH                 OAuth vault & token layer (Workers never see raw tokens)
        │
        ▼
CONNECTOR-SYNC             Immediate (on connect) + scheduled (5-min delta) sync
        │
        ▼
LOADER                     Source-specific extraction (8 stages)
        │
        ▼
NORMALIZER                 Canonical entity transformation (8 stages)
                           ── tool identity dies here. Source forgotten. ──
        │
        ▼
SPINE — Operational Truth (SSOT)
  Entities · Relationships · Activities · Signals · Metrics · Context
  RULE: Tools write to Spine. Nothing else writes operational truth.
        │
        ▼
MAIN MEMORY — Organizational Knowledge (governed · versioned · persistent)
  Decisions · Commitments · Learnings · Policies · Playbooks
  Conversations · Assets · Documents
        │
        ▼
SPINE CACHE — Prepared AI Context (fast · read-optimized · AI-optimized)
  Entity 360 Views · Context Packs · Session Views · Working Sets
  Summaries · Recent Activity
        │
        ▼
CONTINUITY BRIDGE — MCP · Gateway · ADK · Policy · Auth · Routing
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
   Memory MCP      Session MCP     Tool MCP
   (knowledge      (working        (capabilities,
    retrieval)      state)          governed actions)
        │
        ▼
TWIN — Claude · ChatGPT · Gemini · Open WebUI · Agent Zero · Custom Agents
  ALL READ THROUGH THE BRIDGE. NEVER DIRECTLY FROM TOOLS.
        │
        ▼
HUMAN OPERATING MODEL (what the human does — U-series)
  U1 Work       (operate)    — primarily on S1 Workspace
  U2 Notice     (attention)  — primarily on S2 Awareness
  U3 Reason     (think)      — primarily on S3 Twin
  U4 Decide     (approve / reject / promote) — governance surfaces
  U5 Act        (run the approved playbook)  — execution surfaces
  U6 Remember   (consult the institutional record) — S4 Library
```

> **Four orthogonal path-series — never collapse to one layer number.**
> Full definitions + cross-mapping: `docs/tech/CANONICAL_TAXONOMY.md`.
>
> - **S-series = System Architecture** (surfaces): S0 Infrastructure · S1 Workspace ·
>   S2 Awareness · S3 Twin · S4 Library. (The "L1–L4" UI table = S1–S4.)
> - **U-series = Human Operating Model** (stages): U1 Work · U2 Notice · U3 Reason ·
>   U4 Decide · U5 Act · U6 Remember.
> - **V-series = View Path** (render modes). **CZ-series = Customer Zero Path** (self-run loop).
>
> **Governance:** Approval is the **U4 Decide** stage; its UI is surfaced on the
> **S2 Awareness** surface; never in **S3 Twin** chat. The Twin (U3 Reason) only
> _proposes_ — it never Decides (U4) or Acts (U5). Chat is not an audit trail.

---

```
CHANNEL 1 — VIA CONNECTOR (pull-based, Nango OAuth)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Source Tool (HubSpot, Jira, etc.)
    → Nango handles OAuth + token refresh
    → Connector-sync polls delta (5 min) OR webhook fires
    → SPINE SCHEMA HYDRATION (validate against tenant_spine_config)
    → Loader (8 stages)
    → Normalizer (8 stages) — source identity erased here
    → Pipeline writes to spine_vault (AES-256-GCM encrypted)
    → D1 entity available
    → KV cache invalidated
    → Signal generated if state changed


CHANNEL 2A — VIA MCP (API wrapper, raw data needs normalization)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  External system pushes via MCP protocol
    → Data is raw/unstructured from source
    → Routed to Loader → Normalizer → spine_vault
    → Same pipeline as Channel 1 (MCP is just transport)


CHANNEL 2B — VIA MCP (native speakers, already structured)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EXTERNAL agents (Claude / ChatGPT / 3rd-party) → mcp.integratewise.ai
    → Auth: CF Access service token + HMAC token
    → READERS + GOVERNED PROPOSERS:
        Read: D1 Spine (operational truth) + Vectorize/AI Search (memory)
        Write: memory.propose → Triage Bot → governed path ONLY
    → DO NOT go through Loader/Normalizer (already structured)
    → CANNOT write to Spine directly
    → NOTE: the Twin (Agent Zero) does NOT use this path — it reads via the
      IW Continuity Bridge (continuity-tool-server → pipeline). MCP is for
      agents OUTSIDE the Bridge reaching the same Spine.


CHANNEL 3 — KNOWLEDGE INGESTION (documents, not Spine)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Document upload / Gmail context / Slack threads
    → Knowledge service processes
    → context_extractions linked to entities via entity_refs
    → R2 (raw) + AI Search (embedded, free)
    → DOES NOT write to Spine. Enriches Entity 360 only.
```

---

## Data Flow — The Memory Loop

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        THE MEMORY LOOP                                   │
│                                                                          │
│  1. CAPTURE                                                              │
│     Any conversation (Twin session, external LLM, manual input)          │
│     → memory.write_conversational (MCP tool)                             │
│     → conversational_memory table (D1)                                   │
│                                                                          │
│  2. IDENTIFY                                                             │
│     Twin identifies something worth keeping:                             │
│     a decision, pattern, commitment, learning, insight                   │
│                                                                          │
│  3. PROPOSE                                                              │
│     → memory.propose (MCP tool)                                          │
│     → D1 proposals table (Triage Bot queue)                              │
│                                                                          │
│  4. GOVERN                                                               │
│     Triage Bot (CF Workflow) scores:                                     │
│     ≥ 0.85 → auto-approve                                               │
│     0.60–0.84 → HITL (human review)                                     │
│     < 0.60 → reject                                                     │
│                                                                          │
│  5. STORE                                                                │
│     R2 (raw) + AI Search (embedded) + D1 (metadata)                     │
│                                                                          │
│  6. RETRIEVE                                                             │
│     Next session: Twin reads via AI Search (semantic)                    │
│     Entity 360: memory assembled with Spine data                        │
│                                                                          │
│  LOOP CLOSES. Knowledge compounds. Nothing starts cold.                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow — The Operational Loop

```
  ENTITY 360 ASSEMBLED
    D1 (Spine — operational truth, encrypted vault)
    + AI Search (Memory — semantic retrieval)
    + D1 (Signals — time-ordered)
           │
      TWIN REASONS (Agent Zero + Grok-4.3)
      Generates insight. Proposes action. Speaks first.
           │
      ┌────┴────┐
    PATH A    PATH B
    Auto-     Human approves
    execute   in Governance Workbench
      │         │
      └────┬────┘
           │
    OPS EXECUTED
    Act service → target tool (via Nango token)
           │
    SPINE UPDATED
    Tool webhook → ingress → Normalizer → spine_vault
           │
    MEMORY UPDATED (if learning generated)
    memory.propose → Triage Bot → R2 → AI Search → D1
           │
    NEXT ENTITY 360 REFLECTS CHANGES
    Loop never breaks. Both paths close.
```

---

## Data Flow — Connection Sequence (New User)

```
  1. SIGNUP          → D1 tenant + user created (edge JWT issued)
  2. ONBOARDING      → Context questions → Spine Selector → tenant_spine_config
  3. CONNECT TOOL    → Nango OAuth flow → connection established
  4. CREAMY LAYER    → 5 records fetched immediately → Loader → Normalizer → Vault
  5. DASHBOARD       → Real data from D1 (user sees something in <10 seconds)
  6. FULL BACKFILL   → Background (Mode 3, agent swarm, isolated queue)
  7. ONGOING SYNC    → Webhooks + 5-min delta cron (Mode 2)
  8. TWIN ACTIVATES  → Reads Spine + Memory via the IW Continuity Bridge
                       (continuity-tool-server → pipeline). MCP is the external path.
```

---

## Data Flow — Returning User

```
  1. LOGIN           → Gateway validates JWT → x-tenant-id injected
  2. /desk           → MorningContext: signals + entities + commitments from D1
  3. TWIN BRIEFS     → Speaks first: "Morning. Three things today..."
  4. SIGNALS FIRE    → Health drop / renewal / escalation → Twin proposes
  5. USER ACTS       → Approve/reject in Governance Workbench
  6. EXECUTION       → Act service → tool updated → webhook → Spine updated
  7. MEMORY COMPOUNDS→ session → promote → org_memory → next session smarter
```

---

## End-to-End Data Flow — One Complete Trace

This is the full round trip. A single change in an external tool, followed all the
way through every component, until the user sees it, acts on it, the tool is
updated, and the system gets smarter. Every hop names the real component, the
endpoint or binding, and the table it touches.

```
EVENT: A deal in a connected CRM goes quiet. No reply in 14 days.
        (Tool-agnostic — could be any connector. Spine never knows the source.)
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CHANGE DETECTED AT SOURCE                                  t = 0ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Source tool fires a webhook OR connector-sync delta poll picks up the change.
    • Webhook path:  tool → Nango → webhook-ingress (signature verified)
    • Poll path:     connector-sync 5-min cron → Nango token → tool API → delta
  Component:  services/webhook-ingress  OR  services/connector-sync
  Auth:       Nango holds the OAuth token. Worker never sees raw credentials.
  Output:     raw event envelope { provider, connection_id, payload, tenant_id }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — INTAKE MEMBRANE                                            t ≈ 40ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Raw envelope enqueued to pipeline-process queue (isolated per tenant shard).
  Component:  services/connector (Loader — universal intake membrane)
  Action:     provenance tagged, idempotency key written to spine_ingest_log
  Guarantee:  same event twice = one write (dedup on spine_ingest_log)
  Queue:      pipeline-process  →  (DLQ: ops-dlq on repeated failure)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — NORMALIZATION (8 stages, source identity erased)          t ≈ 200ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Component:  services/pipeline (Normalizer, consolidated)
  Stages:     1 parse → 2 trait-detect* → 3 resolve-type* → 4 entity-resolve*
              5 relationship-link → 6 enrich* → 7 validate → 8 emit
              (* = LLM-in-the-loop, Workers AI / x.ai)
  Identity:   "CRM Deal" → resolved to canonical Opportunity entity.
              The tool name dies here. Spine stores the nature, not the label.
  Output:     MCP tool calls (not JSON blobs) → spine writer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — SPINE WRITE (the only Supabase-credentialed path)         t ≈ 260ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Component:  services/pipeline → spine_vault (D1, AES-256-GCM sealed)
  Write:      opaque columns (k,v,t,c). SPINE_ENCRYPTION_KEY in CF Secrets.
  Mirror:     dual-write → Supabase (record of truth) via CF MCP Worker
              — PROMOTED tenants only. Edge-only/initial users skip this;
                D1 + R2 spine-backup is their record of truth.
  Cache:      KV CACHE entry for this entity invalidated (forces fresh read)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — SIGNAL GENERATED (state changed)                          t ≈ 300ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Pipeline detects: deal stalled, last_activity > 14d → emits signal.
  Queue:      signals  →  services/intelligence
  Signal:     { type: "deal_stalled", entity_id, severity, confidence: 0.82 }
  Cache:      SIGNAL_CACHE (KV) updated, time-ordered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — TWIN REASONS (Think)                                      t ≈ 600ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Component:  services/intelligence (Think + Act + Govern consolidated)
  Assembles:  Entity 360 = D1 Spine (operational) + AI Search (memory)
                          + D1 Signals (time-ordered)
  Reasons:    Grok-4.3 / Agent Zero — "Pattern matches prior stalled deals.
              Resolved historically by a re-engagement touch within 5 days."
  Output:     a PROPOSAL (not an action). { proposed_action, confidence: 0.82 }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — SURFACED TO USER (L2 overlay)                             t ≈ 650ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Awareness gate:  signal.type ∈ user.signal_entitlements? confidence > threshold?
                   (Sales user, threshold 0.75; 0.82 > 0.75 → YES)
  Frontend:   apps/web → cognitive-triggers.tsx → l2-drawer-animated.tsx
  Path:       browser → gateway.dev.integratewise.ai/v1/signals → KV/D1
  User sees:  drawer slides up — "Deal with Acme has gone quiet. Suggest a
              re-engagement touch." [Open Twin ↗] [Dismiss]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 8 — USER DECIDES (HITL governance)                            t = human
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  User clicks Open Twin → L3 (twin.integratewise.ai) → reviews full reasoning.
  Two paths:
    PATH A — auto (confidence ≥ 0.85, pre-approved class): executes immediately
    PATH B — human approves in Governance Workbench → approval recorded in D1
  Auth:       CF Access JWT + Gateway → x-tenant-id injected on every call

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 9 — EXECUTION (Act → handoff or self-host)                    t ≈ +1s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Component:  services/intelligence (Act)
  Customer Zero:  Act executes directly (we control engine + ops machines).
  External user:  Twin hands off a PLAYBOOK (JSON) → user's local agent runs it.
                  (Execution boundary axiom — no centralized customer execution.)
  Target:     re-engagement touch written back to source tool via Nango token.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 10 — SPINE RE-SYNCS (loop closes on the operational side)     t ≈ +2s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  The action changed the source tool → tool fires webhook → STEP 1 again.
  webhook-ingress → Normalizer → spine_vault updated → entity reflects the touch.
  KV cache invalidated. Next Entity 360 assembly shows the new state.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 11 — MEMORY COMPOUNDS (loop closes on the cognitive side)     t ≈ +3s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Twin learned: "Re-engagement touch resolved a stalled deal for this segment."
  Path:       memory.propose (MCP) → proposals (D1) → Triage Bot (CF Workflow)
  Govern:     ≥0.85 auto-approve | 0.60–0.84 HITL | <0.60 reject
  Dual-write: R2 (raw) + AI Search (embedded, free bge-base) + D1 (record of truth)
              + filesystem vault + Supabase org_memory (PROMOTED tenants only)
  No archive: stored as active, or supersedes a prior entry (with lineage).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESULT — NEXT TIME IS SMARTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Next stalled deal → STEP 6 retrieves this learning from AI Search (0.9+ match)
  → Twin proposes the proven fix with higher confidence → may auto-execute.
  The system never starts cold. Both loops — operational and cognitive — close.
```

### One-line summary of the round trip

```
  tool change → Nango → ingress → Loader → Normalizer (identity erased)
    → spine_vault (D1, encrypted) + Supabase mirror (promoted) → signal → intelligence
    → Entity 360 (Spine + Memory + Signals) → Twin reasons → proposal
    → L2 overlay (gated) → user approves → Act → tool updated (via Nango)
    → webhook → Spine re-syncs → memory.propose → Triage → AI Search + vault
    → next time: retrieved, higher confidence, often auto.
```

### Where each storage layer enters the trace

```
  D1 spine_vault     STEP 4  (write), STEP 6 (read), STEP 10 (re-write)
  Supabase           STEP 4, 11      (record of truth — PROMOTED tenants only)
  KV CACHE           STEP 4 (invalidate), STEP 7 (fast signal read)
  KV SIGNAL_CACHE    STEP 5  (write), STEP 7 (read)
  Queues             STEP 2 (pipeline-process), STEP 5 (signals)
  AI Search          STEP 6 (memory read), STEP 11 (embed write)
  R2                 STEP 11 (raw memory + backup)
  D1 proposals       STEP 11 (Triage Bot queue)
  D1 spine_ingest_log STEP 2 (idempotency)
  Filesystem vault   STEP 11 (dual-write, .iw-memory)
  Nango              STEP 1, 9 (token vault, never exposed to Workers)
```

---

## Security Boundary Map

```
  PUBLIC (internet-accessible):
    gateway.dev.integratewise.ai/health
    gateway.dev.integratewise.ai/v1/* (JWT required)
    mcp.integratewise.ai (CF Access + HMAC required)

  INTERNAL ONLY (service bindings, not internet-routable):
    pipeline (SERVICE_SECRET gate)
    intelligence
    knowledge
    connector
    bff
    webhook-ingress (signature verification)

  ENCRYPTED AT REST:
    spine_vault (AES-256-GCM, opaque structure)
    SPINE_ENCRYPTION_KEY in CF Secrets Store

  TOKEN MANAGEMENT:
    ALL tool tokens in Nango (never in Workers)
    Infrastructure secrets in CF Secrets Store
    User auth: D1 edge JWT (RS256, 24h expiry)
    MCP auth: CF Access service token + HMAC (15-min TTL)
```

---

## Live URLs

```
  gateway.dev.integratewise.ai       ✅ ALIVE (all services healthy)
  pipeline.dev.integratewise.ai      ✅ ALIVE (secured, SERVICE_SECRET)
  mcp.integratewise.ai               ✅ ALIVE (20 tools, auth required)
  integratewise-knowledge             ✅ ALIVE (Workers AI embeddings)
  integratewise-intelligence          ✅ ALIVE
  integratewise-mcp-connector         ✅ ALIVE
  bff/workflow                        ✅ ALIVE
  webhook-ingress                     ✅ ALIVE
  continuity                          ✅ ALIVE (new)
  Twin (Open WebUI)                   ✅ ALIVE (Hostinger, Grok-4.3)
```

---

## Customer Zero vs External Users

```
CUSTOMER ZERO (IntegrateWise running on IntegrateWise):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tenant:     iw-customer-zero
  User:       Nirmal (owner, BizOps domain, threshold 0.65)
  Plan:       enterprise (all features unlocked)

  L0: Completed (tools connected, schema hydrated)
  L1: BizOps workbench (29 views) + Personal (all founder views)
  L2: All signals, all panels, weak signal threshold (0.65)
  L3: Twin with Grok voice (eve), full Agent Zero + all tools
  L4: Coda projection (12 org memory entries, growing)

  ADDITIONAL (Customer Zero only):
    • integratewise-ops (Vue3 ops board) — internal control surface
    • .iw-memory global vault — filesystem memory substrate
    • All AI agents (Kiro, Claude, Gemini, Kimi) contribute to ONE memory
    • Agent swarm for bulk operations (BulkCleanupSwarmWorkflow)
    • Full system observability (all worker logs)
    • Direct D1 access (wrangler CLI)

  PURPOSE:
    Run IntegrateWise to operate IntegrateWise.
    Every surface is a real operational node.
    The product dogfoods itself daily.


EXTERNAL USERS (customers):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tenant:     auto-generated UUID per signup
  Plan:       free → starter → pro → enterprise (tier-gated)

  L0: Standard onboarding (Login → Profile → Goals → Connectors)
  L1: Personal + ONE department only (their role determines domain)
  L2: Awareness-profile-driven (threshold based on role)
  L3: Twin (shared OWUI instance at twin.integratewise.ai)
  L4: Coda projection (their org memory, tenant-isolated)

  THEY DO NOT HAVE:
    ✗ integratewise-ops access
    ✗ .iw-memory vault access
    ✗ D1 CLI access
    ✗ Multi-agent contribution to memory
    ✗ Agent swarm access
    ✗ System observability
    ✗ Other tenants' data (hard RLS)

  TIER GATING:
    FREE:       L0 + L1 (limited routes, 1 connector, no Twin, no memory)
    STARTER:    L0 + L1 (full) + L2 (basic signals) + 3 connectors
    PRO:        All layers (L0-L4) + unlimited connectors + full memory
    ENTERPRISE: All + external MCP endpoint + custom domain + multi-workspace

  MULTI-TENANCY:
    All users share same infrastructure (D1, workers, OWUI instance)
    Tenant isolation: x-tenant-id on every query, D1 WHERE tenant_id = ?
    Spine vault encrypted per-tenant (same key for now, per-key later)
    No cross-tenant data leakage possible

  STORAGE TIER (Supabase is usage-allocated, NOT default):
    EDGE-ONLY (initial users): D1 + KV + R2 (spine-backup) + Vectorize.
                               NO Supabase. Full product runs at the edge.
                               D1 is the record of truth; R2 JSONL is the replay path.
    PROMOTED (usage-earned):   adds Supabase (fortress) as durable record + sync,
                               triggered by data volume / retention / compliance / plan.
                               D1 becomes rebuildable from Supabase. Dual-write begins.
    Promotion is one-way (backfill R2+D1 → Supabase, then enable dual-write).
    Customer Zero (Nirmal) is a promoted/enterprise tenant. See
    docs/tech/MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md §7.7.
```

---

## The Spine Abstraction Principle

```
  BEFORE IntegrateWise:
    Claude → HubSpot (direct, stateless, no memory)
    ChatGPT → HubSpot (direct, stateless, no memory)
    3 agents × 10 tools = 30 connections. No shared truth.

  AFTER IntegrateWise:
    All tools → Spine (one normalized truth, once)
    Claude → Spine via MCP (never touches HubSpot)
    ChatGPT → Spine via MCP (never touches HubSpot)
    10 tools × 1 Spine = 10 connections total. Forever.
    All agents see same truth. Memory persists across all.

  ONCE A TOOL IS CONNECTED:
    No AI agent ever reads from that tool directly again.
    Spine IS the tool, normalized.
    Agents don't know which tool data came from.
    All credentials live in Nango, accessed only by connector layer.

  "Connect once. Your AI speaks first."
```

---

---

## The Five Layers — Complete Product Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  L0 — ONBOARDING (integratewise-live/apps/web)                              │
│  Entry point. Setup. First value in <2 minutes.                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  SCREEN 1: LOGIN            (1. Login.png)                             │  │
│  │    CF Access → Google or GitHub OAuth                                  │  │
│  │    No password. No email form. One-click SSO.                          │  │
│  │                                                                        │  │
│  │  SCREEN 2: WELCOME          (Stage 1)                                  │  │
│  │    "Welcome to IntegrateWise" — sets expectation ~15s                  │  │
│  │                                                                        │  │
│  │  SCREEN 3: PROFILE          (Stage 2.1 → 2.3)                         │  │
│  │    Use case: Personal / Work / Business                                │  │
│  │    Industry: SaaS, Healthcare, Retail, etc. (11 overlays)             │  │
│  │    Department: Sales, CS, Marketing, Finance, etc. (12 domains)       │  │
│  │    Company size: 1-10, 11-50, 51-200, 200+                            │  │
│  │    Primary goal: free text  ~30s                                       │  │
│  │                                                                        │  │
│  │  SCREEN 4: GOALS            (Stage 3)                                  │  │
│  │    What do you want to achieve?  ~25s                                  │  │
│  │    → Spine Selector runs (invisible, resolves schema)                  │  │
│  │    → Writes tenant_spine_config to D1                                  │  │
│  │                                                                        │  │
│  │  SCREEN 5: CONNECTORS       (Stage 4)                                  │  │
│  │    Domain-ranked connector list (Nango Connect UI)  ~45s               │  │
│  │    User clicks "Connect HubSpot" → Nango OAuth → done                 │  │
│  │    → Creamy layer fires (5 records → Loader → Normalizer → Vault)     │  │
│  │                                                                        │  │
│  │  SCREEN 6+: LOADING → DASHBOARD                                       │  │
│  │    AI Loader animation while creamy syncs                              │  │
│  │    → L1 loads with REAL Spine data (7-12.png)                         │  │
│  │                                                                        │  │
│  │  Total time: ~2 minutes. After: user is in L1. Never returns to L0.   │  │
│  │  Code: apps/web/src/components/activation/onboarding/OnboardingFlow.tsx│  │
│  │  Steps: WelcomeStep → ProfileStep → GoalsStep → ConnectorsStep        │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  L1 — WORKSPACE (integratewise-live/apps/web)                               │
│  Where you WORK. Personal + Work toggle. Forest + Paper.                     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ LEFT NAV          │  MAIN CANVAS                                       │  │
│  │                   │                                                    │  │
│  │ [🧑‍💻 Personal]     │  WorkspaceView = "PERSONAL" | "WORK"               │  │
│  │ [🏢 Work    ]     │  Toggle in sidebar header. Two modes.              │  │
│  │                   │                                                    │  │
│  │ ═══════════════   │  ═══════════════════════════════════════════════    │  │
│  │                   │                                                    │  │
│  │ PERSONAL VIEW:    │  /personal/*                                       │  │
│  │  • Dashboard      │  Personal Dashboard                                │  │
│  │  • Today          │  Hub Today (what's on your plate)                  │  │
│  │  • Tasks          │  Your tasks                                        │  │
│  │  • Calendar       │  Your meetings                                     │  │
│  │  • Notes          │  Personal notes                                    │  │
│  │  • Projects       │  Your projects                                     │  │
│  │  • Knowledge Hub  │  Personal knowledge                                │  │
│  │  • Bookmarks      │  Saved items                                       │  │
│  │  • What's New     │  System updates                                    │  │
│  │  • AI Chat        │  Quick Twin access                                 │  │
│  │                   │                                                    │  │
│  │ ═══════════════   │  ═══════════════════════════════════════════════    │  │
│  │                   │                                                    │  │
│  │ WORK VIEW:        │  /work/*                                           │  │
│  │  (ONE domain,     │  Resolved from user.department at login.           │  │
│  │   resolved from   │  Loads that domain's workNavigation only.          │  │
│  │   user.department)│                                                    │  │
│  │                   │  Example (if CSM):                                 │  │
│  │  • Dashboard      │    accounts, today, tasks, meetings, renewals,     │  │
│  │  • [domain nav]   │    risk-matrix, at-risk, health-scores,            │  │
│  │  • ...            │    api-portfolio, platform-health...               │  │
│  │                   │                                                    │  │
│  │                   │  Example (if Sales):                               │  │
│  │                   │    pipeline, pipeline-kanban, deals, contacts,     │  │
│  │                   │    activities, forecasting, quotes, sequences...   │  │
│  │                   │                                                    │  │
│  │ ═══════════════   │                                                    │  │
│  │ CONNECTORS        │  /connectors   Nango Connect                       │  │
│  │ SETTINGS          │  /settings     Tenant config                       │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  12 domains × 11 industry overlays = 131 total views built.                  │
│  Each user sees: Personal (10 items) + ONE domain's work views.              │
│  Resolved by: tenant_users.department → workspace-config.ts                  │
│  Data: gateway.dev.integratewise.ai → D1 spine_vault (encrypted)            │
│  Auth: CF Access (Google/GitHub) → Gateway JWT                               │
│  Design: Forest + Paper (--iw-forest, --iw-paper, --iw-gold)                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  L2 — DRAWER (same app, passive overlay)                                     │
│  The Twin's AWARENESS manifesting. Not a page. A service.                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  WHAT TRIGGERS IT:                                                     │  │
│  │    Signal arrives → checked against user's awareness profile            │  │
│  │    signal.type IN profile.signal_entitlements?                          │  │
│  │    signal.confidence > profile.threshold?                               │  │
│  │    Both YES → overlay manifests with entitled panels                   │  │
│  │    Either NO → user is never interrupted                               │  │
│  │                                                                        │  │
│  │  WHAT APPEARS (depends on awareness profile):                          │  │
│  │    panels: profile.panel_entitlements (spine, context, or both)         │  │
│  │    signal: the triggering signal title + severity                       │  │
│  │    action: [Open Twin ↗] to go deeper, [Dismiss] to close             │  │
│  │                                                                        │  │
│  │  WHO SEES WHAT:                                                        │  │
│  │    Founder (threshold 0.65) — sees weak signals, all panels            │  │
│  │    Manager (threshold 0.75) — sees medium+ signals, both panels        │  │
│  │    Member  (threshold 0.85) — sees strong signals, context only        │  │
│  │    Viewer  (threshold 0.95) — almost never interrupted                 │  │
│  │                                                                        │  │
│  │  SIGNAL ENTITLEMENTS BY DEPARTMENT:                                    │  │
│  │    CS:      renewal_risk, health_drop, escalation, engagement_drop     │  │
│  │    Sales:   pipeline_risk, deal_stalled, competitor, executive_change   │  │
│  │    Founder: revenue_risk, strategic_escalation, hiring_risk, cash      │  │
│  │    Eng:     incident, deploy_failure, sprint_risk                      │  │
│  │                                                                        │  │
│  │  PROVISIONED AT USER CREATION:                                         │  │
│  │    User → Role → Department → Awareness Profile → stored in D1/KV     │  │
│  │    cognitive-triggers.tsx reads profile, evaluates signals at runtime   │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  L2 is NOT provisioned as a page. NOT "enable L2" or "open L2."             │
│  It is the Twin manifesting inside whatever workbench the user is using.     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  L3 — OPEN WEBUI + AGENT ZERO (twin.integratewise.ai / Hostinger)           │
│  Where you THINK. The Twin's full surface. Voice-first.                      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ LEFT PANEL       │ CENTER CANVAS              │ RIGHT RAIL             │  │
│  │                  │                            │                        │  │
│  │ MODEL            │ REASONING STREAM           │ AGENT ZERO             │  │
│  │ • grok-4.3 ●    │                            │                        │  │
│  │                  │ [CONTEXT LOAD]             │ TASK TREE              │  │
│  │ CONTEXT          │ Loaded Entity 360 for     │ ✓ Load Spine    12ms   │  │
│  │ • Acme Corp      │ Acme Corp. 847 entities,  │ ✓ Query memory  84ms   │  │
│  │ • Health: 64 ↓   │ 12 memory entries.        │ ● Generate...  running │  │
│  │ • ARR: $240K     │                            │ ○ Submit       pending │  │
│  │                  │ [REASONING]                │                        │  │
│  │ MEMORY           │ Health dropped 18 pts.     │ TOOL CALLS             │  │
│  │ • Skills ●       │ Pattern: same as Delphi   │ spine.entity.get  ✓    │  │
│  │ • Knowledge 847  │ Q3 2024. Resolved by      │ memory.search    ✓    │  │
│  │ • Lineage 23     │ executive outreach in 7d. │ signal.list      ✓    │  │
│  │ • Doctrine ●     │ Confidence: 0.87          │                        │  │
│  │ • Conv 12 turns  │                            │ MEMORY READS           │  │
│  │ • Evolve 4       │ [PROPOSAL]                │ "Delphi pattern" 0.91  │  │
│  │                  │ Schedule executive check-  │ "Proactive"     0.87  │  │
│  │ SKILLS           │ in with Acme this week.   │                        │  │
│  │ • Health analysis│ [Approve] [Edit] [Defer]  │                        │  │
│  │ • Renewal risk   │                            │                        │  │
│  │ • Exec briefing  │ ─────────────────────     │                        │  │
│  │                  │ [Instruct Twin...]         │                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Runtime: Agent Zero + Open WebUI                                            │
│  Model: Grok-4.3 (default) — swappable to any LLM                          │
│  Voice: x.ai (Kokoro TTS + Whisper STT)                                     │
│  Data: reads Spine via the IW Continuity Bridge (continuity → pipeline)      │
│  Memory: 6 layers assembled at session start                                 │
│  Tools: spine.*, memory.*, book.* (exposed through the Bridge; MCP for ext.) │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  L4 — CODA (external tool, projection surface)                              │
│  Where you KNOW. The library. Tree + Node + Graph.                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ DEPARTMENTS          │  ORG MEMORY (functional view)                   │  │
│  │                      │                                                 │  │
│  │ ● Strategy           │  HOW WE THINK          HOW WE DECIDE           │  │
│  │ ● Product            │  ┌────────────────┐    ┌────────────────┐      │  │
│  │ ● Marketing          │  │ Doctrine (12)  │    │ Decisions (34) │      │  │
│  │ ● Sales              │  │ Patterns (7)   │    │ Commitments(15)│      │  │
│  │ ● Customer Success   │  │ Insights (21)  │    │ Policies (5)   │      │  │
│  │ ● Operations         │  └────────────────┘    └────────────────┘      │  │
│  │ ● Finance            │                                                 │  │
│  │ ● AI & Platform      │  HOW WE WORK           HOW WE LEARN            │  │
│  │ ● People             │  ┌────────────────┐    ┌────────────────┐      │  │
│  │ ● Data               │  │ Workflows (8)  │    │ Learnings (43) │      │  │
│  │ ● Legal              │  │ Playbooks      │    │ Episodes       │      │  │
│  │ ● Security           │  │ Procedures     │    │ Post-mortems   │      │  │
│  │ ● Partnerships       │  └────────────────┘    └────────────────┘      │  │
│  │ ● Innovation         │                                                 │  │
│  │                      │  ─────────────────────────────────────────      │  │
│  │ GRAPH RELATIONS      │                                                 │  │
│  │ depends_on →         │  RECENT NODES                                   │  │
│  │ influences →         │  ● "No Archive" (doctrine, Jun 5)              │  │
│  │ leads_to →           │  ● "Unified memory" (decision, Jun 5)          │  │
│  │                      │  ● "ADK = registry" (decision, Jun 4)          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Tool: Coda (MCP integration: coda.sync_ops_plan)                           │
│  Sync: D1 org_memory → Coda tables (via sync-org-memory.ts)                 │
│  View: Departments → Functional quadrants → Nodes with graph relations      │
│  Truth: Spine. Coda is the window. If Coda disappears, nothing lost.         │
│  No archive. Everything active or superseded (with lineage).                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


ALL FIVE LAYERS:
  Read from the same Spine (D1 encrypted vault)
  Use the same gateway (gateway.dev.integratewise.ai)
  Share one Memory (org_memory, conversational, personal)
  Authenticated by the same JWT (CF Access)
  Connected via the IW Continuity Bridge (MCP underneath; mcp.integratewise.ai for external agents)

  L0 = how you ENTER (onboarding → first value)
  L1 = where you WORK (Personal + Work toggle)
  L2 = what INTERRUPTS you (awareness-driven overlay)
  L3 = where you THINK (Twin runtime, voice, full reasoning)
  L4 = where you KNOW (library projection, Coda)
```

---

## End-to-End Data Flow — Complete Trace

This is the canonical end-to-end trace: one real-world event followed through **every hop**, from the moment a tool changes to the moment the user sees the Twin act on it. Every arrow is a real network/storage boundary. Timing is representative of the live system.

### Trace A — Inbound Event → Twin Acts (the full loop)

```
SCENARIO: A deal in HubSpot stalls. Acme Corp's renewal opportunity sits
          in "negotiation" for 21 days with no activity. Watch it travel.

─────────────────────────────────────────────────────────────────────────────
STEP 0  SOURCE CHANGE                                              t = 0ms
─────────────────────────────────────────────────────────────────────────────
  HubSpot: opportunity.last_activity_date crosses 21-day threshold.
  HubSpot fires webhook → Nango (Nango holds the OAuth token, not us).

─────────────────────────────────────────────────────────────────────────────
STEP 1  INGESTION MEMBRANE                                         t ≈ 40ms
─────────────────────────────────────────────────────────────────────────────
  Nango → webhook-ingress worker
    • Signature verified (HMAC) — reject if invalid
    • Payload is raw HubSpot JSON (source-shaped, untrusted)
    • Enqueued to pipeline-process queue (decouples intake from compute)
    • Returns 200 immediately (never blocks the source)

─────────────────────────────────────────────────────────────────────────────
STEP 2  NORMALIZER (8 stages, source identity dies here)          t ≈ 120ms
─────────────────────────────────────────────────────────────────────────────
  pipeline worker consumes pipeline-process:
    Stage 1  Parse + provenance tag        (where it came from, recorded once)
    Stage 2  Trait detection (LLM)         "this is a deal/opportunity"
    Stage 3  Resource-type resolution (LLM) opportunity → canonical Opportunity
    Stage 4  Entity resolution (LLM)       HubSpot company → existing Acme Corp
                                           (same Person/Org across all tools)
    Stage 5  Relationship hydration        link Opportunity → Account → Owner
    Stage 6  Field mapping (LLM)           source fields → Spine schema
    Stage 7  Validate vs tenant_spine_config
    Stage 8  Emit MCP tool calls (NOT a JSON blob)

  >>> After Stage 8, the word "HubSpot" no longer exists in the data. <<<

─────────────────────────────────────────────────────────────────────────────
STEP 3  SPINE WRITE (the only writer)                             t ≈ 180ms
─────────────────────────────────────────────────────────────────────────────
  pipeline → spine_vault (D1)
    • Row sealed with AES-256-GCM (opaque k,v,t,c columns)
    • SPINE_ENCRYPTION_KEY from CF Secrets Store
    • Old state diffed against new state → CHANGE DETECTED
    • spine_ingest_log updated (idempotency — same event never double-writes)
    • KV hot cache for entity:acme-corp INVALIDATED

─────────────────────────────────────────────────────────────────────────────
STEP 4  SIGNAL GENERATION                                         t ≈ 210ms
─────────────────────────────────────────────────────────────────────────────
  State change → intelligence worker (Govern/Signals)
    • Emits signal: { type: deal_stalled, entity: acme-corp,
                      severity: medium, confidence: 0.82 }
    • Written to D1 signals table (time-ordered)
    • Pushed to signals queue + SIGNAL_CACHE (KV)

─────────────────────────────────────────────────────────────────────────────
STEP 5  TWIN REASONS                                              t ≈ 400ms
─────────────────────────────────────────────────────────────────────────────
  intelligence worker (Think) assembles Entity 360:
    READ  D1 spine_vault     → Acme operational truth (deal, account, owner)
    READ  AI Search          → memory: "Delphi Q3 stall, resolved by exec call"
    READ  D1 signals         → this + prior signals, time-ordered
         │
    Agent Zero + Grok-4.3 reason over the assembled context:
    "Deal stalled 21d. Matches Delphi 2024 pattern. That was resolved by
     an executive check-in within 7 days. Confidence 0.87."
         │
    Generates a PROPOSAL (not an action yet):
    { action: schedule_exec_checkin, entity: acme-corp, due: +7d }

─────────────────────────────────────────────────────────────────────────────
STEP 6  AWARENESS GATE (does the user even see it?)               t ≈ 410ms
─────────────────────────────────────────────────────────────────────────────
  Signal checked against the user's awareness profile (L2):
    signal.type (deal_stalled) ∈ profile.signal_entitlements?   → YES (Sales)
    signal.confidence (0.82)   > profile.threshold (0.75 mgr)?  → YES
         │
    BOTH true → L2 overlay is allowed to manifest.
    (If EITHER false → signal is logged, user is NOT interrupted.)

─────────────────────────────────────────────────────────────────────────────
STEP 7  SURFACE — L2 OVERLAY                                      t ≈ 430ms
─────────────────────────────────────────────────────────────────────────────
  cognitive-triggers.tsx (running inside L1 workbench) receives signal:
    Drawer slides up over whatever the user is doing:
      "Acme Corp deal stalled 21 days. I've seen this before.
       Want me to schedule an executive check-in?  [Open Twin ↗] [Dismiss]"
    Panels shown = profile.panel_entitlements (spine + context for a manager).

─────────────────────────────────────────────────────────────────────────────
STEP 8  USER DECISION                                             t = human
─────────────────────────────────────────────────────────────────────────────
  PATH A — confidence ≥ auto-threshold AND policy allows → auto-execute
  PATH B — user clicks [Open Twin ↗] → L3 → reviews reasoning → [Approve]
         (Twin NEVER writes to Spine directly. It proposes. Human/policy governs.)

─────────────────────────────────────────────────────────────────────────────
STEP 9  EXECUTION (handed off, not run on our servers)            t ≈ +200ms
─────────────────────────────────────────────────────────────────────────────
  Approved → intelligence (Act) builds a PLAYBOOK (JSON):
    { steps: [ create_calendar_event, draft_exec_email ] }
    • For Customer Zero: executed on our own ops infra.
    • For external users: playbook handed to their local agent/client.
    • Target tool reached via Nango token (we never see the raw credential).

─────────────────────────────────────────────────────────────────────────────
STEP 10  SPINE UPDATES FROM THE ACTION (loop back to Step 1)      t ≈ +1s
─────────────────────────────────────────────────────────────────────────────
  The action creates a calendar event → that tool fires its own webhook →
  webhook-ingress → Normalizer → spine_vault. The system learns its own act.

─────────────────────────────────────────────────────────────────────────────
STEP 11  MEMORY COMPOUNDS                                         t ≈ +1.2s
─────────────────────────────────────────────────────────────────────────────
  If a learning was generated ("exec check-in resolves stalled enterprise deals"):
    memory.propose (MCP) → Triage Bot scores:
      ≥ 0.85 auto-approve | 0.60–0.84 HITL | < 0.60 reject
    Approved → R2 (raw) + AI Search (embedded) + D1 (metadata)
    Dual-write → .iw-memory filesystem vault (Customer Zero)
         │
    NEXT time any deal stalls, Step 5 retrieves THIS learning.
    The system is permanently smarter. It never starts cold again.

─────────────────────────────────────────────────────────────────────────────
LOOP CLOSED.  Source → Spine → Signal → Reason → Surface → Act → Spine → Memory
─────────────────────────────────────────────────────────────────────────────
```

### Trace B — Outbound Query → Rendered View (user pulls)

```
SCENARIO: User opens their Work dashboard. Where does every pixel come from?

  1. BROWSER          User loads /work/dashboard (apps/web, Forest+Paper)
        │             React Query fires GET /v1/morning-context
        ▼
  2. GATEWAY          gateway.dev.integratewise.ai            t ≈ 20ms
        │             • CF Access JWT verified (Google/GitHub SSO)
        │             • x-tenant-id resolved + injected
        │             • Rate limit checked
        │             • Routes to BFF
        ▼
  3. BFF              Assembles MorningContext                 t ≈ 60ms
        │             Parallel reads (all tenant-scoped, WHERE tenant_id = ?):
        │               ├─ KV CACHE        hot entities (60–300s TTL)  ~5ms
        │               ├─ D1 spine_vault  signals + entities         ~30ms
        │               └─ AI Search       relevant memory             ~40ms
        ▼
  4. DECRYPT          Spine rows unsealed (AES-256-GCM) in-worker
        │             Only this worker boundary ever sees plaintext.
        ▼
  5. SHAPE            { signals[], entities[], commitments[], briefing }
        │             Returned as one typed payload (packages/types contract)
        ▼
  6. RENDER           Dashboard paints real data                t ≈ 120ms total
        │             KPI strip, AI Attention panel, signal cards — all live.
        ▼
  7. TWIN SPEAKS      L1 surfaces the briefing first:
                      "Morning. Three things need you today..."

  NO surface ever queries a source tool. NO surface ever touches Supabase.
  Every read is: gateway → worker → D1/KV/AI-Search → decrypt → shape → render.
```

### The Two Directions, One Substrate

```
  INBOUND  (Trace A):  World changes  → Spine learns → Twin acts
  OUTBOUND (Trace B):  User asks      → Spine answers → Surface renders

  Both directions cross the SAME boundaries in opposite order.
  Both are gated by the SAME auth (CF Access JWT + x-tenant-id).
  Both read/write the SAME encrypted Spine (D1 spine_vault).
  Neither ever touches a source tool or Supabase directly.

  Source tools → Normalizer → Spine → (everything else).
  That single funnel is why connecting once is enough, forever.
```

---

_One Twin. One Spine. One Memory. One Bridge (IW Continuity Bridge). One Loop._
_Normalize once, render anywhere. The system never starts cold._
