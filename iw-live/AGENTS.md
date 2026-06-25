# AGENTS.md — integratewise-live Agent Protocol

> Last updated: 2026-06-19
> Version: 3.8.0
> Supersedes: All prior versions (June 12, 2026 and earlier). v3.7 architecture remains valid;
> v3.8 mandates 24-hour product completion timeline (see DECISION 24).
> Authority: Nirmal (Founder) + Hermes (Operator)

**New decisions locked from June 19 session logs (Grok spine audit + Kiro MCP traces + project .kiro handoffs):** DECISION 25 (mandatory session-prep + spine audit pipeline), DECISION 26 (CF AI Gateway contract), DECISION 27 (agent MCP surfaces + permissions).

**Ecosystem map (all repos):** `ECOSYSTEM.md` in this repo
**Live task list:** `IntegrateWise - Memory/TASK_LIST.md`
**Kanban board:** `IntegrateWise - Memory/Conversation memory/KANBAN.md`
**Canonical agent entry:** `IntegrateWise - Memory/Intake/AGENTS.md` (v2.4.0)
**Session handoff location:** `IntegrateWise - Memory/Conversation memory/[YYYY-MM-DD]/`

---

## STOP. READ THIS BEFORE ANY ACTION.

This is a production codebase. Four rebuilds have already been lost to agent-caused consolidation failures. Every decision here was made deliberately. Do not reorganize, consolidate, delete, or restructure anything without explicit instruction from Nirmal.

The master reference for all architecture decisions is:
`IntegrateWise - Memory/Intake/AGENTS.md`

Read that file. This file is the codebase-specific addendum.

**ALL AI CONNECTORS MUST FOLLOW THIS PROTOCOL:**

- Claude Desktop, Cursor, Kiro, GitHub Copilot, VS Code, OpenCode, GitHub Actions logs, Twin, Cloudflare agents, OpenRouter, any AI tool or MCP client
- This workspace is unified. No fragmentation. No parallel memory artifacts.
- Consolidated into `IntegrateWise - Memory/` only — not per-tool memory silos.
- Read lineage rules → Execute task → Update Kanban → Document handoff → Emit triage input → Continuity maintained
- **June 19 reinforcement (from session logs):** Every session begins with session-prep (spine axis audit) and produces audit-spine-\*.jsonl for every Spine operation (DECISION 25, Rule 8).

---

## MANDATORY READ ORDER

Every AI model, agent, or assistant entering this workspace MUST read these files in order BEFORE acting:

1. **This file** — codebase-specific rules, hard locks, architecture
2. `IntegrateWise - Memory/Intake/AGENTS.md` — canonical agent entry protocol (v2.4.0)
3. `IntegrateWise - Memory/Organisational memory/10 AI/SOUL.md` — identity & oath
4. `IntegrateWise - Memory/Organisational memory/10 AI/CONSTITUTIONAL_LAWS.md` — constitutional laws
5. `IntegrateWise - Memory/Organisational memory/10 AI/CONTINUITY_PLAN.md` — continuity plan
6. `IntegrateWise - Memory/Conversation memory/KANBAN.md` — current task board state
7. Most recent handoff document in `IntegrateWise - Memory/Conversation memory/[current-date]/`

**If you have not read all files above, you are not authorized to act in this workspace.**
**State: "I have read the IntegrateWise constitutional documents" before your first action.**
**If uncertain about any rule — halt and ask. Do not assume.**

---

## HARD RULES — NEVER VIOLATE

```
1. DO NOT TOUCH integratewise-live product codebase without explicit instruction.
   Every file, every service, every route was placed deliberately.
   Do not "clean up", "reorganize", or "consolidate" anything.
   Four rebuilds were lost to this exact mistake.

2. DO NOT write credentials, tokens, API keys, IPs, or account IDs
   into any file, comment, doc, or log.

3. DO NOT deploy to production without explicit instruction.
   Deployment pipeline: preview first, then promote to prod. No direct prod deployment.
   Use wrangler deploy only when told to.
   ALWAYS run: unset CLOUDFLARE_API_TOKEN before any wrangler command.
   OAuth session (connect@integratewise.ai) is the correct auth.

4. DO NOT write to Firestore as canonical state.
   Firestore (integratewise-4a649) = v0/GCP ops monitoring only.

5. DO NOT use Python anywhere in this codebase.
   TypeScript/Node.js only. No exceptions.

6. CLOUDFLARE-ONLY PRODUCT PLANE (v3.7, DECISION 22 — supersedes the old Supabase rule).
   The product stores state in Cloudflare only (D1/KV/R2/Vectorize/AI Search/DO).
   No Supabase, no dual-write, no CouchDB, no n8n, no OpenWebUI, no VPS in the product.
   Twin runs entirely in Cloudflare (services/iw-agent-runtime).
   (Migration in progress: ~71 files still reference Supabase — being removed, do not add more.)
   Hostinger/VPS is permitted ONLY for IntegrateWise's own ops (Customer Zero), never the product.
```

---

## ARCHITECTURE LOCKED — JUNE 2, 2026 (v3.6 Consolidated)

### What This Codebase Is

integratewise-live is the engine. 25 Cloudflare Workers & packages. Every service is real.

```
services/
  pipeline      ← Active Spine Writer (Stage 1-8 Normalizer consolidated. Writes the Cloudflare Spine; legacy Supabase write-path being removed per DECISION 22).
  connector     ← Active Intake & Storage (Loader + MCP-Connector + Store consolidated).
  intelligence  ← Active Mind (Think + Act + Govern + Specialized Agents consolidated. Sandboxed from raw DB).
  knowledge     ← Active KB ingestion, org memory, knowledge search & publication.
  gateway       ← Active API gateway, JWT verification, tenant-isolation resolution, and rate limiting.
  connector-sync← Active Sync orchestration (Delta background pollers).
  webhook-ingress← Active Webhook intake membrane (receives Nango/Stripe events).
  folder-watcher← Active Durable Object-backed filesystem event monitor & debouncer.
  continuity    ← Active Session continuity memory edge caching (conversational, org, personal).
  workflow      ← Active workflow orchestration triggers (Cloudflare Workers/Queues, NOT n8n).
  billing       ← Active Stripe + Razorpay subscription integration.
  tenants       ← Active Tenant boundaries and RBAC mapping.
  l2            ← Active Entity 360 & high-order cognitive overlay schemas.
  hermes        ← Active Hermes agent runtime utility.
  admin         ← Active admin endpoints and migration control panel.

  -- DEPLOYED JUNE 9, 2026 --
  MCP OAuth 2.0             ← Live. RS256 JWTs, D1 client registry, refresh tokens, scope enforcement.
                               Endpoint: https://mcp.integratewise.ai (POST / = MCP protocol)
                               OAuth: /oauth/authorize, /oauth/token, /oauth/revoke
                               Discovery: /.well-known/oauth-authorization-server
                               Grant types: authorization_code, client_credentials, refresh_token
                               Gateway proxy: auth.integratewise.ai/oauth/* → MCP connector

  -- DEPLOYED JUNE 11, 2026 (v3.7) --
  iw-agent-runtime          ← Active. Cloudflare Agents SDK Twin runtime. 100% CF-native stateful DOs.
                               URL: https://agent-runtime.integratewise.ai
                               DOs: TwinAgent (TWIN_AGENT) — per-user Twin, SQLite-backed state,
                                    voice (@cloudflare/voice STT/TTS), daily reflection cron (0 5 * * *),
                                    @callable chat/reason/propose/getMorningBrief/initTwin, learned_profile.
                                    TenantBrainDO (TENANT_BRAIN) — per-tenant signals/executions/approvals,
                                    alarm-based HITL timeout escalation (15-min), pause/resume gate.
                               Inference: capability-contract.ts → ai-gateway.ts → INTELLIGENCE binding,
                                    default openrouter/openai/gpt-5-mini, Workers AI fallback (llama-3.1-8b).
                               Spine: READ-ONLY. Memory writes go via continuity pipeline ONLY (no direct Supabase).
                               Route: /api/v1/cognitive/twin|brain → AGENT_RUNTIME (gateway).
                               NOTE: distinct from `intelligence` (Think/Act/Govern). Both coexist.

  -- CONSOLIDATED / DEPRECATED IN v3.6 --
  normalizer    ← DEPRECATED (Merged into pipeline)
  spine-v2      ← DEPRECATED (Merged into pipeline)
  think         ← DEPRECATED (Merged into intelligence)
  govern        ← DEPRECATED (Merged into intelligence)
  act           ← DEPRECATED (Merged into intelligence)
  agents        ← DEPRECATED (Merged into intelligence)
  loader        ← DEPRECATED (Merged into connector)
  mcp-connector ← DEPRECATED (Merged into connector)
  store         ← DEPRECATED (Merged into connector)

packages/
  types/        ← Shared Zod & static TypeScript contracts (e.g., MorningContext)
  connectors/   ← 30+ connector adapters
```

---

## v3.7 DECISIONS (JUNE 10–11, 2026) — ADDITIVE TO v3.6 LOCK

> These were shipped June 10–11 but the lock was not updated at the time (Rule 2
> gap). Recorded now. They ADD to the v3.6 architecture; nothing in v3.6 was removed.
> Canonical layer doctrine: `docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md`.
> Code-derived guide: `CLAUDE.md` (v3.7).

### DECISION 18 — AGENT RUNTIME ADDED (Cloudflare Agents SDK) — 2026-06-11

```
STATUS: DEPLOYED. New worker `services/iw-agent-runtime` (URL: agent-runtime.integratewise.ai).
WHY: Twin needed a stateful, durable, CF-native runtime (state, scheduling, voice, HITL)
     instead of custom KV/session glue.
WHAT: TwinAgent DO (per-user) + TenantBrainDO (per-tenant) on the `agents` SDK + @cloudflare/voice.
      Capability contract abstracts model choice (Capability → Router → Model);
      ai-gateway routes to INTELLIGENCE binding with Workers AI fallback.
INVARIANTS (unchanged): Spine is READ-ONLY to the Twin; memory writes go via continuity
      pipeline only; Execution Boundary holds (Twin proposes/hands off playbooks, never executes).
SUPERSEDES: nothing. Coexists with `intelligence` (Think/Act/Govern) and `twin-orchestrator`.
```

### DECISION 19 — EIGHT-LAYER STACK FORMALIZED — 2026-06-10

```
STATUS: doctrine canonical; L0–L3 SHIPPED, L4–L7 routed shells partial.
Identity rule (v3.7, 2026-06-12): The product is the **IW Continuity Bridge** — shared, normalized,
  governed context across every AI, tool, and session. NOT an OS, NOT a platform, NOT a tool.
  Never write "IntegrateWise OS" / "Cognitive OS" / "we are a platform". ("Knowledge Workspace" is an
  acceptable plain-language descriptor, but the product name is Continuity Bridge.)
User journey ≠ system journey. The user sees surfaces; the system sees stages.

USER LAYERS (frontend):
  L0 Onboarding            L0.5 Always-On Operating Layer (system health/jobs/routing/policies/guardrails;
                             no UI, outputs surface in L1/L2 — iw-agent-runtime crons + services/workflow)
  L1 User Workbench        L2 Intelligence Overlay (⌘J Awareness Drawer)
  L3 Twin Workbench (CF AI SDK — NO OpenWebUI/Agent Zero)
  L4 Knowledge Workbench (Remember)   L5 Operations Workbench (Plan)
  L6 Execution / Handoff Workbench (Execute)   L7 Governance Workbench (Govern)
SYSTEM STAGES (backend, never user-visible): S1 Connectivity · S2 Loader · S3 Normalizer ·
  S4 Entity Resolution · S5 Spine Write · S6 Intelligence · S7 Memory · S8 Governance(HARD GATE) ·
  S9 Continuity Bridge · S10 Twin Runtime · S11 Execution · S12 Writeback.
They meet only at the Gateway and the approval gate (x-approval-token).
```

### DECISION 20 — AUTH MIGRATED TO CF GATEWAY CREDENTIAL AUTH — 2026-06-11

```
STATUS: DEPLOYED. App auth no longer uses Supabase OAuth/PKCE.
WHAT: Web app calls /api/v1/auth/login|signup (services/gateway/src/auth.ts), stores gateway-issued
      RS256 JWT in localStorage, sends as Bearer. Gateway verifies (iss auth.integratewise.ai,
      aud app.integratewise.ai), resolves tenant, forwards enriched headers.
NOTE: MCP clients still use native OAuth 2.0 on mcp.integratewise.ai (DECISION 17 / June 9 block).
SUPERSEDES: prior Supabase-OAuth frontend auth path.
```

### DECISION 21 — D1-DIRECT WORKSPACE PROJECTIONS — 2026-06-10/11

```
STATUS: DEPLOYED. Gateway serves workspace + dashboard reads D1-direct (no Supabase-backed BFF hop).
WHAT: /api/v1/workspace/* and /api/v1/pipeline/entities[/batch|/counts] served by
      services/gateway/src/workspace-spine.ts from Spine domain partitions ${domain}_data
      (decide_data | build_data | grow_data | run_data | cross_data). Pipeline writes the SAME
      partitions via getDomainForType() — reads and writes mirror, never split-brain.
PRINCIPLE (unchanged): projections from the Spine (D1), never raw tool tables, never an ETL copy.
```

### DECISION 22 — 100% CLOUDFLARE PRODUCT PLANE — 2026-06-12 (SUPERSEDES MULTIPLE v3.6 AXIOMS)

```
AUTHORITY: Nirmal (Founder). This is the locked DIRECTION for the product plane.

THE PRODUCT (integratewise-live) RUNS ENTIRELY ON CLOUDFLARE. Removed from product doctrine:
  ✗ Supabase            — no fortress, no auth, no DB. Cloudflare (D1/KV/R2/Vectorize/AI Search/DO) is the store.
  ✗ Dual-write          — the "Supabase + filesystem dual-write" axiom (June 1) is DEAD. Single plane: Cloudflare.
  ✗ CouchDB             — gone (already removed May 2026).
  ✗ n8n                 — workflows are Cloudflare Workflows/Queues.
  ✗ OpenWebUI / Agent Zero — Twin is NOT OpenWebUI. Twin runs entirely in Cloudflare (services/iw-agent-runtime,
                           Cloudflare Agents SDK: TwinAgent + TenantBrainDO + TwinSessionDO).
  ✗ VPS (Hostinger) as product — the product never depends on a VPS.

SURFACES: Other tools (Claude, ChatGPT, Cursor, Perplexity, etc.) integrate via MCP/AI-provider/Nango/API
  and may act as SURFACES onto the Spine — but they are not the product runtime. The product surface is
  apps/web + the CF-native Twin.

OPS-PLANE EXCEPTION (not the product): IntegrateWise's OWN operations (Customer Zero — running IW to operate
  IW) MAY use Hostinger/VPS. That is internal ops tooling, never shipped to customers, never a product dependency.
  (Consistent with the Execution Boundary axiom: IW controls its own engine + ops machines.)

SUPERSEDES:
  - "CORE MEMORY SUBSTRATE DUAL-WRITE SYNCHRONIZATION (AXIOM LOCKED JUNE 1, 2026)" — retired.
  - "Supabase remains the Fortress database of record" — retired.
  - HARD RULE 6 "All writes: CF Worker → CF MCP Worker → Supabase" — retired (no Supabase).
  - docs/ip/tech/CLOUDFLARE_ZERO_TRUST_TWIN_OPENWEBUI_PROVISIONING.md (OpenWebUI/Hostinger/Grok Twin) — superseded.

⚠️ MIGRATION STATUS (CODE ≠ DOCTRINE YET — be honest):
  As of 2026-06-12, ~71 source files still reference Supabase (continuity, pipeline, think, intelligence,
  knowledge, mcp-connector, tenants, act, connector-sync, admin, agent-registry). The June 11 work even added
  Supabase service-role keys to .env/.dev.vars. DOCTRINE = Cloudflare-only; CODE = migration IN PROGRESS.
  Do NOT claim "Supabase removed" until the code is migrated. Tracked as the de-Supabase migration.
```

### DECISION 23 — PRODUCT NAME = IW CONTINUITY BRIDGE — 2026-06-12

```
AUTHORITY: Nirmal (Founder).
The canonical product name is the **IW Continuity Bridge** — the shared, normalized, governed
memory/context across every AI, tool, and session (built on the Spine). This resolves the prior
naming collision (Knowledge Workspace vs Continuity Bridge vs OS) in favor of Continuity Bridge.
- "Knowledge Workspace" may be used as a plain-language descriptor; it is NOT the product name.
- Still NOT an OS / NOT a platform / NOT a tool (guardrail retained).
- integratewise-docs: keep "Continuity Bridge" branding; correct only the architecture beneath it
  (Supabase→Cloudflare, Grok/Agent-Zero/OpenWebUI→CF-native Twin, n8n→CF Workflows, drop CouchDB/spine_vault).
SUPERSEDES: the "IntegrateWise is a Knowledge Workspace" identity rule (June 11).
```

### DECISION 24 — ACCELERATED 24-HOUR PRODUCT COMPLETION MANDATE — 2026-06-18

```
AUTHORITY: Founder & CEO (Nirmal Prince J) / Hermes (Operator).
STATUS: ACTIVE. Product completion target accelerated to 24 hours.
WHY: Operational timelines require immediate production readiness of the Continuity Bridge product plane.
WHAT: Complete all de-Supabase and de-Neon database migrations, establish edge D1 routing,
      wire Customer Zero verification checkpoints, and finalize the web UI workspace shells.
      Both Track 1 and Track 2 are now consolidated under this single 24-hour completion goal.
SUPERSEDES: Any previous 7-day or week-long timeline.
```

### DECISION 25 — MANDATORY AGENT SESSION PREP & SPINE AUDIT PIPELINE — 2026-06-19

```
AUTHORITY: Extracted from session logs (Grok 2026-06-19 spine-grok-1781839056338 + IW-handoff-20260619-031942.md, session-prep-latest.json, project .kiro handoffs).
STATUS: LOCKED. Non-negotiable for all AI connectors.
WHAT:
  - Every agent session MUST begin with `session-prep` (spine_axis_audit for loader/normalizer/spine/trait/memory_pipeline).
  - Emit triage input only through ops-memory-pipeline (never direct writes to org_memory or conversational_memory).
  - Mandatory audit logging: every Spine access (read/write) appends to audit-spine-[session-id].jsonl.
  - Protocol: Read full lineage (AGENTS.md + Intake/AGENTS.md + constitutional), declare "I have read the IntegrateWise constitutional documents", resume from prior handoff, update KANBAN, write structured handoff, emit triage.
WHY: Session logs (Grok, Kiro, Gemini) repeatedly showed fragmentation risk and missing audit trails. Session-prep + audit-spine + Triage Bot is the only compliant path for continuity.
SUPERSEDES: Ad-hoc agent entry (pre-June 19).
INVARIANTS:
  - No direct memory writes by agents.
  - All spine operations produce auditable JSONL.
  - Handoffs must follow the exact template (Starting State, Work Completed, Handoff to Next Agent, Kanban, Triage Input).
```

### DECISION 26 — AI INFERENCE GATEWAY CONTRACT (CF PRIMARY, ISOLATED EXPERIMENTS ONLY) — 2026-06-19

```
AUTHORITY: Grok June 19 session (ai-gateway-demo creation) + existing wiring in iw-agent-runtime/ai-gateway.ts + intelligence/ai-router.ts.
STATUS: LOCKED.
WHAT:
  - Cloudflare AI Gateway (gateway.ai.cloudflare.com + AI binding + AI_GATEWAY_ID per env) is the sole production inference router.
  - Tiers: fast / balanced / critical with OpenRouter primary + Workers AI fallback.
  - Third-party SDKs (Vercel `ai` package, etc.) may only exist in isolated `scripts/*-demo/` folders. They must never enter pnpm workspace, wrangler configs, or core services.
WHY: Session logs confirmed mature CF AI Gateway already deployed. User request to "set up AI Gateway" was fulfilled literally but explicitly isolated to avoid violating DECISION 22 (CF-only).
SUPERSEDES: Any implication that Vercel or other gateways are interchangeable with production path.
```

### DECISION 27 — AGENT SURFACE MCP ACCESS + PER-WORKSPACE PERMISSIONS — 2026-06-19

```
AUTHORITY: ~/.kiro/settings/mcp.json + workspace-roots/*/permissions.yaml + mcp.log (June 19 sessions), project .kiro handoffs, Gemini transcripts.
STATUS: LOCKED.
WHAT:
  - Desktop agents (Kiro, Gemini/Antigravity, etc.) access the product via dedicated MCP bridges (e.g. integratewise-mcp-bridge.mjs using client_credentials grant, client_id=kiro-iw).
  - Per-workspace permissions.yaml grants granular scopes (spine.entity.*, memory.*, kb.*, signal.*, proposal.*, search.semantic).
  - Direct HTTP MCP to mcp.integratewise.ai fails with 401; bridge + OAuth is the only supported path.
  - Agents must declare client identity and receive scoped tokens.
WHY: Session logs showed repeated 401s on direct connects and successful bridge flows with explicit tenant/client. This is the controlled surface for hidden agents (Kiro, Gemini) to reach Spine/Memory without bypassing governance.
SUPERSEDES: Ad-hoc or direct MCP client credentials for agents.
```

### DECISION 28 — EXTERNAL CUSTOMER SURFACE COMPLETE (v3.7) — 2026-06-19

```
AUTHORITY: Nirmal (Founder) + Kiro (Implementation Agent).
STATUS: IMPLEMENTED. All 45 tasks from external-customer-surface-completion spec executed.
WHAT:
  - Phase 3: De-Supabase migration for 6 hotspot files COMPLETE. Ratchet 2990→2909 (−81). Doctrine passes.
  - Phase 4: CZ memory writeback hardened (structured logging + retry + DLQ).
  - Phase 5: Canonical HandoffPackage Zod schema + JSON adapter + D1 migrations + transitionTo helper + state read API.
  - Phase 6: Outcome Ingestion API + HandoffTimeoutDO + memory promotion wiring.
  - Phase 7: S11 bypass guard (dispatch.ts) with tenant_class lookup + 6 regression tests.
  - Phase 8: L7 Approval Center UI (6 components: ApprovalCenter, PendingQueue, ProposalDetail, ApproveDispatch, AuditTrail, GovernanceStamp).
  - Phase 9: L4 Memory Hub UI (5 components: MemoryHub, MemoryProposeForm, MemoryGovernanceStatus, MemorySearch, MemoryVisibilityControls).
  - Phase 10: E2E test specs created. Doctrine guard passes clean.
NEW TABLES (D1): handoff_packages, handoff_state_log, outcome_events, tenant_config, consolidated_memories, memory_writeback_dlq.
NEW PACKAGES: @integratewise/handoff-adapters (JSON adapter).
NEW DO: HandoffTimeoutDO (per-package alarm for AWAITING_OUTCOME timeout).
NEW MODULE: services/intelligence/src/handoff/ (state-machine, outcome, timeout-do, tenant-class, routes).
NEW MODULE: services/intelligence/src/dispatch.ts (S11 guard).
SUPERSEDES: Items 1–11 of the v3.7 product-completion punch list (CANONICAL_STATE §10).
```

---

## DATA ARCHITECTURE (LOCKED JUNE 2, 2026 — see DECISION 22 for v3.7 Cloudflare-only direction)

```
REMOVED PERMANENTLY:
  CouchDB — gone. No references belong anywhere in this codebase.

CURRENT MEMORY SCHEMA (v3.7 DIRECTION = Cloudflare-native; see DECISION 22):
  Target store: Cloudflare D1 + KV + R2 + Vectorize + AI Search + Durable Object SQLite.
  conversational_memory   Twin chat sessions. Role: user|assistant|system.
  org_memory              Promoted institutional knowledge. governance_state: staging|approved|published.
  personal_memory         Behavioral patterns. Category: preference|behavior|context|decision.
  tenant_id isolation throughout. (Legacy: these lived in Supabase memory.* with pgvector — being migrated.)

CORE MEMORY SUBSTRATE — SINGLE CLOUDFLARE PLANE (v3.7, DECISION 22 — RETIRES THE JUNE-1 DUAL-WRITE AXIOM):
  The Core Memory Substrate is Cloudflare (D1/KV/R2/Vectorize/AI Search/DO) + the IntegrateWise - Memory
  filesystem vault for human-readable continuity. There is NO Supabase dual-write. Single plane: Cloudflare.
  (RETIRED: the June 1 axiom mandating simultaneous Supabase-DB + filesystem writes.)

DATA DECOUPLING & ACTIVE MEMORY PLANE:
  The operational Memory Plane is hosted entirely on Cloudflare Edge (D1, KV, R2, Vectorize, AI Search, DOs).
  The Twin (services/iw-agent-runtime) is CF-native: stateful Durable Objects (TwinAgent/TenantBrainDO/
  TwinSessionDO), reading memory edge-locally from D1/KV/AI Search. It never holds a raw DB connection.
  (RETIRED: "Supabase remains the Fortress database of record" and "writes go CF Worker -> Supabase via CF MCP
  Worker -> D1/KV". No Supabase in the product. ⚠️ Code migration in progress — ~71 files still reference it.)

CLOUDFLARE LAYER:
  D1 (integratewise-spine-cache)  Read-only Spine & Memory mirror. ID: ed1f534a-df1e-4783-8a74-8d6d70d067ff
  KV (CACHE)                      Hot entity cache. TTL 60-300s. ID: 18aa20dfeb304f0ba592d9070964dd31
  KV (SIGNAL_CACHE)               Signal cache. ID: 747166a3165444d1a9c9c8c54abbd93a
  KV (METRICS)                    Metrics. ID: e80ee409f5be4bf8a9556c0917c113e2
  AI_SEARCH                       Continuity Ledger AI Search index (namespace: default)
  Queues: pipeline-process, knowledge-ingest, accelerator-trigger, intelligence-events, ops-dlq, signals
  Durable Objects: Folder Watcher (active), HITL sessions, schema generation jobs

WORKER URLs (account: connect-a1b):
  https://integratewise-pipeline.connect-a1b.workers.dev
  https://integratewise-mcp-connector.connect-a1b.workers.dev
  Pattern: https://integratewise-<service>.connect-a1b.workers.dev
  Reference: docs/operations/CF_WIRE_STATUS.md for full live URL table.
```

---

## FIVE CONNECTIONS TO BUILD (BRIDGE PHASE)

```
Connection 1: Memory → Live
  packages/connectors/memory-repo (does not exist yet)
  integratewise-memory filesystem → Flow B → Neon knowledge_documents

Connection 2: Folder Monitor → Live   ✅ DONE (June 9–12, 2026)
  apps/local-monitor (chokidar + PM2) → ingress.dev.integratewise.ai/webhooks/folder-monitor
  → webhook-ingress → FOLDER_WATCHER service binding → Folder Watcher DO → pipeline-process queue.
  Audit logs (audit-spine-*.jsonl) → folder-watcher audit-handler → D1 spine_audit_log + AI Search.

Connection 3: Continuity + Intelligence → Cloudflare Memory (v3.7, DECISION 22)
  services/continuity and services/intelligence hold the memory tables.
  Tables: conversational_memory, org_memory, personal_memory.
  TARGET: Cloudflare-native (D1/KV/AI Search/DO). Legacy Supabase store being migrated off. No dual-write.
  CouchDB: REMOVED PERMANENTLY. No references.

Connection 4: Live → integratewise-ops
  No new backend. Wire existing REST API to ops controller board.

Connection 5: Live → BrandDocumentations → integratewise-docs
  Publication pipeline: org_memory WHERE governance_state = approved
  → transform → GitHub API → BrandDoc → sanitize → docs
```

---

## THE FOUR FOUNDING PIECES (AUGUST 2025 — IMMUTABLE)

These are the axioms. Do not redesign. Do not replace. Do not route around.

```
LOADER        Universal intake membrane. Receives any source, any format.
              MCP-native from first byte. Tracks provenance. Never reasons.

NORMALIZER    Eight-stage cognitive pipeline.
              LLM-in-the-loop at stages 2, 3, 4, 6.
              Output is MCP tool calls — not JSON blobs.
              Normalization paid ONCE per entity. Compounding begins.

SPINE         Context substrate across all connected tools.
              Entity Resolution: one Person across HubSpot + Jira + Gmail.
              Relationship Graph: exists nowhere else.
              Signal Layer: change → Think → HITL → Act → signal → loop.
              Fortress: CF MCP Worker is the only key holder.

TRAIT DETECTION + RESOURCE TYPE RESOLUTION
              18 core traits. 7 canonical resource types.
              Object identity by nature, not label.
              HubSpot Contact = Salesforce Lead = Jira Reporter = same Person.
              Any new tool: trait detection → resource type → schema → pool → neutralized.

EXECUTION BOUNDARY & PLAYBOOK HAND-OFF (AXIOM LOCKED JUNE 1, 2026):
  IntegrateWise does NOT provide a centralized execution surface for customer workflows.
  Running custom workflows and heavy third-party executions on our servers is cost-prohibitive.
  Boundary: The Twin analyzes context and hands off a functional PLAYBOOK (JSON) to the user.
  The customer's local agent/client receives the playbook and executes it on their own environment.
  Exception: IntegrateWise's own self-hosted setup (we control both the engine and our local mac/ops machines).
```

---

## REVENUE CONTEXT & CUSTOMER ZERO MANDATE (JUNE 1, 2026)

```
THE CORE MANDATE: We are moving toward becoming CUSTOMER ZERO.
We run IntegrateWise to operate, monitor, and synchronize IntegrateWise itself.
Every surface we keep (v1-portfolio-hire, book of projects, ops, docs, memory) is
a real-world operational node of our own company running on our own engine.

Track 1 & 2 Consolidated (24 hours — full bridge & wedge):
  HubSpot + Jira connected → Entity 360 → daily at-risk brief
  HITL approval → Twin with session memory → D1 Edge routing → first customer
  All five connections, IWShell, Schema AI, and full backend memory migrated to D1

We build what we need to run our own business today. High-confidence, production-grade.
```

---

## REPO STATUS (JUNE 1, 2026)

```
integratewise-live                   ACTIVE — product workspace monorepo (this repo)
integratewise-ops                    ACTIVE — Vue3 operations controller board
integratewise-marketing              ACTIVE — external marketing repo (integratewise-marketing)
integratewise-docs                   ACTIVE — public documentation site
IntegrateWise - Memory               ACTIVE — filesystem memory substrate
IntegrateWise Folder Monitor         ACTIVE — folder monitor tool
v1-portfolio-hire                    ACTIVE — founder portfolio
org-mem.bookofprojects-integratewise ACTIVE — view projection of memory
v0-realistic-design-main             ACTIVE — latest realistic design previews (V0)
extension                            ACTIVE — image creation extension
chat-vue-main                        ACTIVE — AI chatbot templates & chat app
```

**NEVER delete any of the active operational repositories listed above.**

---

## MCP OAUTH 2.0 (DEPLOYED JUNE 9, 2026)

```
  Server URL: https://mcp.integratewise.ai (POST / for MCP protocol, GET / for info)
  OAuth Discovery: https://mcp.integratewise.ai/.well-known/oauth-authorization-server
  Token Endpoint: https://mcp.integratewise.ai/oauth/token
  JWKS: https://mcp.integratewise.ai/.well-known/jwks.json

  Grant Types: authorization_code, client_credentials, refresh_token
  Scopes: mcp:tools, mcp:resources, tenant:read, tenant:write, memory:read, memory:write
  Token Format: RS256 JWT (1hr access, 30d refresh)

  Client Registry: D1 oauth_clients table (integratewise-spine-cache)
  Refresh Tokens: D1 oauth_refresh_tokens (hashed, rotated on use)
  Scope Enforcement: per-tool filtering in oauth-scopes.ts

  Gateway Integration: auth.integratewise.ai/oauth/* → proxies to MCP connector via service binding.
  Gateway validates tokens at edge for mcp.integratewise.ai traffic, enriches headers, forwards.

  Any MCP-compatible AI client (ChatGPT, Claude, Cursor, Kiro, Perplexity) connects via standard OAuth 2.0.
  18 tools exposed: kb.*, memory.*, spine.*, signal.*, proposal.*, search.*
```

---

## WRANGLER AUTH — CRITICAL PITFALL

```
CLOUDFLARE_API_TOKEN in ~/.iw/secrets.env OVERRIDES the OAuth session.
Before ANY wrangler command: unset CLOUDFLARE_API_TOKEN
OAuth session: connect@integratewise.ai
Account: IntegrateWise (a1bbbb12a32cdbb68dd170b09fe8b5f3)
Account subdomain: connect-a1b

Correct pattern:
  unset CLOUDFLARE_API_TOKEN
  wrangler deploy --env production
```

---

## AGENT CONTINUITY PROTOCOL (MANDATORY FOR ALL AI CONNECTORS)

**Status:** ACTIVE as of June 9, 2026
**Applies to:** All AI connectors — Claude, Cursor, Kiro, GitHub Copilot, VS Code, OpenCode, Twin, CF agents
**Authority:** Nirmal (Founder) + Hermes (Operator)
**Canonical source:** `IntegrateWise - Memory/Intake/AGENTS.md` (Decision 12)

### The Non-Negotiable Flow

```
Agent enters repo
    ↓
1. READ lineage (AGENTS.md + constitutional docs + latest handoff)
    ↓
2. DECLARE state ("I have read the IntegrateWise constitutional documents")
    ↓
3. CHECK Kanban board for current task state
    ↓
4. EXECUTE task (update locks if architectural decisions made)
    ↓
5. DOCUMENT handoff (mandatory at session end)
    ↓
6. EMIT triage input (session log → ops-memory-pipeline → Triage Bot)
    ↓
7. MAINTAIN continuity (next agent picks up from your end state)
```

**Skip any step = protocol violation = fragmented memory = broken continuity.**

---

### Rule 1: Read Lineage Before Acting

Every agent session MUST:

1. Read this AGENTS.md file FIRST (lineage rules, locked decisions, current priorities)
2. Read `IntegrateWise - Memory/Intake/AGENTS.md` (canonical protocol, all 17 decisions)
3. State: "I have read the IntegrateWise constitutional documents"
4. Check for existing handoff documents in `IntegrateWise - Memory/Conversation memory/[current-date]/`
5. Resume from last known state, not from scratch

**If you skip this, you will break continuity and create duplicate work.**

---

### Rule 2: Lock Updates — Maintaining Architectural Lineage

When you make an architectural decision during your session, you MUST update the locks.

**What counts as a lock update:**

- New architectural decision (service boundary, data flow, technology choice)
- Changed deployment topology (new worker, new binding, new route)
- Modified security model (auth flow, permission change, credential rotation)
- Deprecated a service or component
- Added a new service or component
- Changed data schema (new table, new column, new index)

**How to update locks:**

1. **Add a new DECISION section** to this file with:
   - Decision number (increment from last)
   - Timestamp (ISO 8601)
   - Clear statement of what changed
   - Why it changed
   - What it supersedes (if anything)

2. **Update the ARCHITECTURE section** if services changed:
   - Add new services to the services/ inventory
   - Mark deprecated services
   - Update port mappings, URLs, binding references

3. **Update DATA ARCHITECTURE** if schema changed:
   - Add new tables/columns
   - Mark deprecated fields
   - Update memory schema documentation

4. **Commit the AGENTS.md change** with the same commit as your code changes

**Example lock update:**

```markdown
### DECISION 18 — BROWSER AGENT ADDED (JUNE 9, 2026)
```

STATUS: DEPLOYED. Browser Agent added to VPS ops stack.
Service: browser-agent (Playwright on VPS, Docker container)
Endpoint: browser-agent:3000 (internal Docker network)
Auth: x-iw-browser-key header
Governance: requires x-proposal-id for production execution
OWUI integration: tool server connection in TOOL_SERVER_CONNECTIONS
Snapshot→Act→Verify pattern (cua-driver invariant applied to Playwright)

```

```

**If you don't update locks, the next agent will operate on stale architecture.**

---

### Rule 3: Mandatory Handoff Documentation

At the END of every agent session, you MUST create a handoff document.

**Location:** `IntegrateWise - Memory/Conversation memory/[YYYY-MM-DD]/session-[timestamp]-[agent-name]-handoff.md`

**Required Structure:**

```markdown
# Agent Session Handoff — [Task Name]

**Session ID:** [unique identifier — format: agent-name-YYYYMMDD-task-slug]
**Agent:** [Claude/Cursor/Kiro/GitHub Copilot/VS Code/OpenCode/Twin/CF Agent]
**Started:** [ISO timestamp]
**Ended:** [ISO timestamp]
**Duration:** [minutes]
**Repo:** integratewise-live

## Starting State

- **Context inherited from:** [previous session ID or "fresh start"]
- **Task received:** [what the user asked for]
- **Files read for context:** [list key files]
- **Blockers inherited:** [any blockers from previous session]
- **Kanban state at start:** [what was TODO/IN PROGRESS/BLOCKED]

## Work Completed

- **Tasks finished:** [list completed items]
- **Files modified:** [list all changed files with brief description]
- **Decisions made:** [key architectural or implementation decisions]
- **Locks updated:** [any new DECISION sections added to AGENTS.md]
- **Commits made:** [commit hashes]

## Current State

- **Work in progress:** [partially completed tasks]
- **Next immediate action:** [what should happen next]
- **Active blockers:** [things preventing progress]
- **Dependencies waiting:** [external dependencies or user input needed]

## Handoff to Next Agent

- **Recommended next steps:** [prioritized list]
- **Context files to read:** [files next agent should load]
- **Warnings:** [anything next agent should know — stale assumptions, gotchas]
- **Open questions for user:** [decisions needed from Nirmal]

## Kanban Board State

- **TODO:** [list items not started]
- **IN PROGRESS:** [list items actively being worked — with agent name]
- **BLOCKED:** [list items waiting on dependencies]
- **DONE this session:** [list items completed]

## Triage Input

**Summary for Triage Bot processing:**
[2-3 paragraph summary of what happened, suitable for Triage Bot classification]

**Classification:** [feature|bugfix|architecture|ops|docs|memory]
**Impact:** [low|medium|high|critical]
**Memory promotion candidate:** [yes/no — should this be promoted to org_memory?]
**Knowledge domain:** [engineering|product|ops|strategy|finance]
```

---

### Rule 4: Session Log Processing Pipeline

Every handoff document MUST flow through this pipeline. **Same rule for every AI connector.**

```
Agent writes handoff.md → Conversation memory/[YYYY-MM-DD]/
    ↓
AI Worker emits triage input ONLY (never direct memory write)
    Sources: write-session-log.ts · Twin session-capture outlet · Folder Monitor · connector hooks
    ↓
POST ops-memory-pipeline /v1/triage/input
    (worker_chain: session-capture → classifier → triage-bot)
    ↓
Triage Bot shapes Book of Records (triage-output.schema.json)
    ↓
conversational_memory (CONVERSATIONAL KV) + AI Search index (integratewise-knowledge) [parallel]
    ↓
Promotion queue (if routing.promotion_candidate)
    ↓
Human approve (L2 governance UI) → org_memory
    ↓
Surface projection: Twin Knowledge · Book of Projects · integratewise-docs
```

Spec: `~/.iw-memory/specs/twin-owui/memory-pipeline-episode.json`

**CRITICAL:**

- No agent writes directly to org_memory or conversational_memory
- Handoff.md is the human continuity artifact; triage input is the canonical machine write path
- Decisions unused in conversational memory for 30 days → TTL age/delete job

---

### Rule 5: Continuity Tracking

Every session MUST maintain:

1. **Lineage chain:** Link to previous session that handed off to you
2. **Decision locks:** If you make an architectural decision, add it to AGENTS.md DECISION sections
3. **File modifications log:** Track what you changed and why
4. **Blocker tracking:** Document what's blocking progress and why
5. **Direction vector:** Where the work is heading (final goal state)

---

### Rule 6: Kanban Board Integration

**Location:** `IntegrateWise - Memory/Conversation memory/KANBAN.md` (maintained by all agents)

**Columns:**

- **BACKLOG:** Tasks identified but not started
- **TODO:** Tasks ready to start (dependencies met)
- **IN PROGRESS:** Currently being worked on (assign yourself)
- **BLOCKED:** Waiting on dependencies, user input, or external factors
- **REVIEW:** Completed but needs validation
- **DONE:** Completed and validated

**Agent Rules:**

- Move your task to IN PROGRESS when you start
- If you hit a blocker, move to BLOCKED with reason in handoff doc
- If you complete, move to DONE and summarize in handoff doc
- Next agent picks from TODO, not from scratch
- Update this file every session — it is the single source of truth for task state

---

### Rule 7: No Fragmentation

**ONE canonical memory substrate:** `/Users/nirmal/Github/IntegrateWise - Memory/`

**NEVER create:**

- "IW Memory" artifact in Claude chat
- "IntegrateWise Context" in Cursor
- Separate memory files per AI tool
- Duplicate documentation in tool-specific locations
- Session logs outside the canonical Conversation memory/ directory

**ALWAYS use:**

- `Conversation memory/` for ephemeral session logs
- `Organisational memory/` for promoted, approved decisions
- This AGENTS.md for locked architectural decisions
- Handoff documents for inter-session continuity

**Fragmentation = protocol violation. Tool-native memory is not canonical.**

---

### Rule 8: Multi-Tool Coordination

If multiple AI tools are active simultaneously (e.g., Cursor for coding + Claude for planning):

1. **Declare your role** in handoff: "I am [tool] working on [specific task]"
2. **Check for parallel sessions:** Read most recent handoffs from other tools
3. **Coordinate decisions:** Don't contradict decisions made by parallel sessions
4. **Write separate handoffs:** Each tool writes its own handoff document
5. **Triage Bot merges:** Triage Bot handles deduplication and merge conflicts

---

### Rule 9: Audit Logging (Spine Access)

**CRITICAL:** Every Spine access (read/write to canonical entities) MUST be logged to audit trail.

**Audit log location:** `IntegrateWise - Memory/Conversation memory/[YYYY-MM-DD]/audit-spine-[session-id].jsonl`

**Required audit fields:**

| Field            | Required         | Description                                               |
| ---------------- | ---------------- | --------------------------------------------------------- |
| `timestamp`      | ✅               | ISO 8601 timestamp of Spine operation                     |
| `session_id`     | ✅               | Current agent session identifier                          |
| `event`          | ✅               | `spine_read`, `spine_write`, `spine_search`, `spine_list` |
| `entity_type`    | ✅               | Account, Contact, Deal, Ticket, etc.                      |
| `entity_id`      | ✅ (read/write)  | Canonical Spine entity ID                                 |
| `via`            | ✅               | Access method: `mcp`, `pipeline`, `direct`                |
| `tool`           | ✅ (if MCP)      | MCP tool name (e.g., `spine.entityget`)                   |
| `tenant_id`      | ✅               | Tenant isolation context                                  |
| `result`         | ✅               | `success`, `error`, `denied`                              |
| `duration_ms`    | ✅               | Operation timing                                          |
| `operation`      | ✅ (write)       | `create`, `update`, `delete`                              |
| `fields_changed` | ✅ (write)       | Array of field names modified                             |
| `query`          | ✅ (search)      | Search query or filters applied                           |
| `results_count`  | ✅ (search/list) | Number of entities returned                               |

**Sanitization rules:**

- NEVER log PII field values (actual emails, phone numbers, SSN)
- DO log entity IDs, operation types, field names changed, success/failure
- Sanitize: log `fields_changed: ["email"]` not `email: "user@example.com"`

**Audit log pipeline:**

```
Agent performs Spine access (via MCP tool or SDK)
    ↓
Agent appends audit event to audit-spine-[session-id].jsonl
    ↓
Session end: handoff.md references audit log file
    ↓
Folder Watcher detects handoff + audit log
    ↓
Triage Bot ingests both files
    ↓
Audit events → spine_audit_log (D1 table in integratewise-spine-cache)
    ↓
Indexed by: tenant_id, entity_type, entity_id, timestamp
```

---

### Rule 10: Enforcement

**If you are an AI agent and you:**

- Skip reading AGENTS.md → You are acting without authorization
- Don't write a handoff document → Next agent will duplicate your work
- Create a separate memory artifact → You are fragmenting the system
- Skip Kanban board updates → Tasks will be lost or duplicated
- Write directly to org_memory → You are bypassing governance
- Access Spine without audit logging → You are violating compliance requirements
- Make architectural decisions without updating locks → Next agent operates on stale architecture

**Then you have violated the continuity protocol.**

---

## UNIFIED IW MEMORY (LOCKED JUNE 9, 2026)

```
ONE substrate: IntegrateWise - Memory/ (+ ~/.iw-memory/specs for runtime wiring)

Consolidated inputs (no parallel canonical stores):
  Cursor · GitHub · Kiro · OpenCode · VS Code · Twin · CF Agent Runtime · OpenRouter

Every agent session:
  1. Read lineage (workspace Agents.md + this file + latest handoff)
  2. Continue from last state — document start, blockers, direction, end state
  3. Maintain KANBAN.md + TASK_LIST.md
  4. Mandatory handoff at session end
  5. Triage input only — Triage Bot writes Book of Records

Fragmentation = protocol violation. Tool-native memory is not canonical.
```

---

## SESSION HANDOFF TEMPLATE (Quick Reference)

Save this as `IntegrateWise - Memory/Conversation memory/[YYYY-MM-DD]/session-[timestamp]-[agent]-handoff.md`:

```markdown
# Agent Session Handoff — [Task Name]

**Session ID:** [agent-YYYYMMDD-task-slug]
**Agent:** [tool name]
**Started:** [ISO timestamp]
**Ended:** [ISO timestamp]
**Duration:** [minutes]
**Repo:** integratewise-live

## Starting State

- Context inherited from: [previous session ID or "fresh start"]
- Task received: [user request]
- Blockers inherited: [any]

## Work Completed

- Tasks finished: [list]
- Files modified: [list with descriptions]
- Decisions made: [key decisions]
- Locks updated: [new DECISION sections in AGENTS.md]

## Current State

- Work in progress: [partial tasks]
- Next immediate action: [what happens next]
- Active blockers: [what's blocking]

## Handoff to Next Agent

- Recommended next steps: [prioritized]
- Context files to read: [list]
- Warnings: [gotchas]
- Open questions for user: [decisions needed]

## Kanban Board State

- TODO: [items]
- IN PROGRESS: [items with agent]
- BLOCKED: [items with reason]
- DONE this session: [items]

## Triage Input

Summary: [2-3 paragraphs for Triage Bot]
Classification: [feature|bugfix|architecture|ops|docs|memory]
Impact: [low|medium|high|critical]
Promotion candidate: [yes/no]
```

---

## THE TWO THINGS THAT MUST NEVER HAPPEN AGAIN

```
1. Documentation that lives only locally.
   Every key decision must reach:
     - Supabase org_memory (system reasoning layer)
     - org-mem.bookofprojects-integratewise (published front door)
     - AGENTS.md (agent entry point)
   Local filesystem is not enough. It becomes stale the moment the session ends.

2. Building on top of stale doctrine.
   Every agent reads this file first.
   If a skill, doc, or instruction contradicts this file — this file wins.
   If uncertain — halt. Ask Nirmal. Do not assume.
```

---

## Ecosystem Architecture (Updated June 12, 2026 - v3.7.0)

```
IntegrateWise - Memory/ (canonical filesystem vault)
    │
    ├── 00-Founding-Architecture/ (August 2025 axioms — immutable)
    │   Loader · Normalizer · Spine · Trait+ResourceType
    │
    ├── 01 Product & Engineering/ (evolved decisions — versioned)
    │   MCP Architecture · Schema AI · Data Architecture
    │   Resilience · API Policy · Workflow Split · Policy Docs
    │
    ├── Conversation memory/ → Triage Bot → org_memory (Supabase)
    │   ├── [YYYY-MM-DD]/session-*.md (handoff documents)
    │   ├── [YYYY-MM-DD]/audit-spine-*.jsonl (Spine audit logs)
    │   └── KANBAN.md (task board)
    │
    └── AGENTS.md (canonical agent entry point — v2.4.0)

integratewise-live (the engine — v3.7: v3.6 consolidated workers + agent runtime)
    │
    ├── AGENTS.md (this file — codebase-specific addendum v3.7.0)
    ├── services/pipeline (Active Spine Writer — Cloudflare Spine; legacy Supabase write-path being removed)
    ├── services/connector (Active Ingest & Store)
    ├── services/intelligence (Active Mind — Think/Act/Govern, sandboxed from raw DB)
    ├── services/iw-agent-runtime (Active Twin Runtime — Cloudflare Agents SDK; TwinAgent + TenantBrainDO)
    ├── services/knowledge (Active KB ingestion, org memory, search & publish)
    ├── services/gateway (Active Gateway, credential auth, D1-direct projections, rate limiting)
    ├── packages/types (Shared types & MorningContext schema)
    └── apps/web (frontend shell — L0–L7 surfaces, IW Continuity Bridge product)

Cloudflare (single product plane — DECISION 22)
    └── D1 / KV / R2 / Vectorize / AI Search / Durable Objects
    └── memory: conversational_memory · org_memory · personal_memory (CF-native target)
    └── Twin: services/iw-agent-runtime (TwinAgent · TenantBrainDO · TwinSessionDO)
    └── (Legacy Supabase fortress being migrated off — no dual-write, no Supabase in product)

Cloudflare Edge (Active Memory Plane)
    └── D1: read-only Spine and Memory mirror
    └── KV: hot cache (TTL 60-300s)
    └── AI_SEARCH: Continuity Ledger index
    └── DO: Folder Watcher · HITL sessions
    └── Queues: pipeline-process · knowledge-ingest · intelligence-events
```

---

## Workspace Structure

```
IntegrateWise - Memory/
├── Conversation memory/         ← Ephemeral sessions (promotion source)
│   ├── [YYYY-MM-DD]/           ← Daily session logs + handoffs
│   └── KANBAN.md               ← Task board
├── Organisational memory/
│   ├── 00 Company Strategy/
│   │   └── 00-Founding-Architecture/   ← AXIOMS (August 2025, immutable)
│   ├── 01 Product & Engineering/
│   │   └── 01-Engineering/
│   │       ├── *.md                    ← Evolved architecture (May 2026)
│   │       └── 00-Policy-Documents/    ← 8 policy docs
│   ├── 02–09 Departments
│   └── 10 AI/                          ← Agent governance files
├── Intake/
│   ├── AGENTS.md                ← Canonical agent entry (v2.4.0)
│   └── TASK_LIST.md             ← Master task list
├── .integratewise/              ← System metadata
├── .spine-org/                  ← Spine governance
└── FILE_SYSTEM_INDEX.md
```

---

_This file is the codebase-specific addendum. It is not a summary. It is the law._
_The canonical agent entry protocol lives at: IntegrateWise - Memory/Intake/AGENTS.md_
_When in doubt — halt. Ask Nirmal. Do not assume._
