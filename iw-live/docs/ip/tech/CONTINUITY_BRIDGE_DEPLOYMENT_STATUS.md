# IntegrateWise — Continuity Bridge & MCP Deployment Status

> **Date:** 2026-06-09 | **Authority:** Nirmal (Founder) | **Version:** 1.1
> **Status:** Canonical — current operational reference
> **Supersedes:** `MCP_SETUP_COMPLETE.md` (stale: 16 tools, Supabase auth, figma.\* namespace)
> **Companions:** `MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md`, `docs/ARCHITECTURE_AND_DATA_FLOW.md`

---

## 1. Purpose

The single source of truth for **what is deployed, where, and how it is reached**
for the IW Continuity Bridge and its MCP interface. If a setup guide or onboarding
doc disagrees with this file, this file wins.

---

## 2. Current State

```
✅ IW Continuity Bridge          LIVE (Twin → continuity-tool-server → pipeline → Spine)
✅ MCP interface                 LIVE — 20 tools, zero figma.* (purged 2026-06-06)
✅ Gateway                       LIVE — gateway.dev.integratewise.ai
✅ Pipeline (sole Spine writer)  LIVE — pipeline.dev.integratewise.ai (SERVICE_SECRET)
✅ continuity worker             LIVE
✅ Twin (Open WebUI + Agent Zero + Grok-4.3 + x.ai voice) LIVE (Hostinger)
✅ Auth                          Cloudflare Access (Google + GitHub) + Gateway D1 JWT
```

---

## 3. Public Endpoints

```
gateway.dev.integratewise.ai          API gateway (JWT required on /v1/*)
pipeline.dev.integratewise.ai         Spine writer (internal, SERVICE_SECRET gated)
mcp.integratewise.ai                  MCP interface for EXTERNAL agents (CF Access + Bearer)
twin.integratewise.ai                 Primary L3 Twin surface (Open WebUI + Agent Zero)
twin.operations.integratewise.ai      Aspirational ops-branded Twin (first-win surface for general startup ops / IW on IW dogfood). Currently falls back to primary Twin. See handoff code + provisioning note below.
coda (via MCP)                        L4 Coda docs now MCP-connectable: use coda.connect_doc + coda.read_page + coda.sync_memory_to_doc to treat Coda as a connected source/projection without direct API from agents. Ties founder Coda docs to personal_memory (from .iw-memory) and org_memory.
```

> The Twin does **not** use the public MCP endpoint. It reaches the same interface
> internally via `continuity-tool-server`. `mcp.integratewise.ai` is the external door.

---

## 4. The 20-Tool Surface (canonical)

Locked by decision **D-2026-06-06-008** (figma.\* purged; 20 tools live). Grouped by channel:

```
MEMORY MCP    memory.search_org · memory.read_org · memory.propose
              memory.read_conversational · memory.write_conversational
              memory.read_personal · memory.list_decisions
SESSION MCP   session.get_context · session.summarize · session.list_recent
TOOL MCP      spine.entity.get · spine.entity.search · spine.relationship.list
              signal.list · signal.get · proposal.create · proposal.status
              book.list · kb.search · playbook.handoff
```

> Canonical count: **20**. Anything else (16, 18) is drift. Keep in sync with
> `MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md` §7.

---

## 5. Authentication Model

```
Identity:       Cloudflare Access SSO (Google + GitHub). No password.
Session:        Gateway validates CF Access JWT → resolves tenant from D1 →
                issues/propagates Gateway JWT (RS256, 24h).
Authorization:  Gateway policy layer (plan tier + tenant isolation via x-tenant-id).
External MCP:   CF Access service token (CF-Access-Client-Id / -Secret) + Bearer
                <MCP_CONNECTOR_API_KEY> + x-tenant-id. HMAC token exchange, 15-min TTL.
Internal:       Worker-to-worker via Service Bindings (cf-worker header trust).
Supabase:       NEVER an auth path. Fortress DATA record only.
```

> Migration complete (see `AUTH_MIGRATION_DESIGN.md`). Zero Supabase auth.
> **Key handling:** `MCP_CONNECTOR_API_KEY` lives in Cloudflare Secrets Store and
> `~/.iw/secrets.json` — referenced by name, never committed or echoed. Rotate via
> `wrangler secret put MCP_CONNECTOR_API_KEY`.

---

## 6. Continuity Bridge Composition

```
IW Continuity Bridge = MCP + Gateway + Spine + Normalizer + Memory + Governance

The Bridge is the product. MCP is one interface inside it.

Twin → continuity-tool-server → pipeline → Spine (D1 cache) + Memory (AI Search)
External agent → mcp.integratewise.ai → Gateway → ADK → Spine Cache

Four canonical tool servers (D-2026-06-06-002):
  1. continuity-tool-server   memory read/write (Pipeline D1)
  2. agentzero-tool-server    multi-step execution (internal Agent Zero)
  3. iw-gateway-tool-server   evidence, think, act, triage, govern (Gateway BFF)
  4. iw-mcp-bridge            full MCP catalog (mcp.integratewise.ai)
```

---

## 7. Deployment Topology

```
Cloudflare Workers (account connect-a1b):
  gateway, pipeline, intelligence, knowledge, connector, connector-sync,
  webhook-ingress, continuity, billing, tenants, workflow (BFF)
Storage:
  D1 integratewise-spine-cache (ed1f534a-df1e-4783-8a74-8d6d70d067ff)
  KV CACHE / SIGNAL_CACHE / METRICS · R2 (raw + spine-backup) · Vectorize / AI Search
Twin runtime:
  Open WebUI + Agent Zero + Grok-4.3 + x.ai voice — Hostinger (twin.integratewise.ai)
Tokens:
  Nango (all tool OAuth) · CF Secrets Store (infra) · CF Access (identity)
```

---

## 8. Known Gaps

```
• AI_SEARCH binding on pipeline — confirm full org-memory embed (paginate bulk reindex).
• Frontend VITE_API_BASE_URL = https://gateway.dev.integratewise.ai (real Spine, no seed).
• R2 spine-backup retention policy + reindex job owner/cron — pin before GA.
• MCP_CONNECTOR_API_KEY rotation — value was exposed in chat history; rotate.
• twin.operations.integratewise.ai not yet provisioned (the handoff defaulted here, causing "not accessible").
  The ops Twin is the first-win surface for running general startup operations (CS portfolio, triage, desk signals, account health) on IW itself.
• Gateway POST /v1/twin/handoff not yet implemented — L2→L3 uses interim client handoff (twin-owui-handoff.ts + IW_HANDOFF envelope).
  Canonical provisioning spec: docs/tech/CLOUDFLARE_ZERO_TRUST_TWIN_OPENWEBUI_PROVISIONING.md §26.
  Docs mirror: integratewise-docs/internal/architecture/twin-provisioning-and-handoff.md.
• OpenWebUI trusted-header auth (WEBUI_AUTH_TRUSTED_*) not configured on VPS — OWUI still uses local auth.
• Twin origin (Hostinger Traefik) not yet locked behind Cloudflare Access / Tunnel — required before trusted headers are safe.
```

---

## 9. Next Steps

```
1. Rotate MCP_CONNECTOR_API_KEY; update Open WebUI tool config with new value.
2. Complete Vectorize/AI Search embed of approved org memory (paginated).
3. Wire VITE_API_BASE_URL across frontend repos; verify /desk on live Spine.
4. Define R2 backup retention + pin reindex job owner/cron.
5. Provision twin.operations.integratewise.ai:
   - Add CF custom_domain route (or thin Worker that redirects + injects ops context).
   - Or configure on Hostinger side for the subdomain.
   - Update BI ops surfaces (account-success, triage, desk) handoff targets to prefer it when running internal ops workloads.
   - Ensure the ops Twin instance is configured to consume context exclusively via MCP → Spine (no direct tool reads), aligning with the ideal operating state.
```

---

**Founder's Personal Operating System (the real first win for Nirmal)**

For the founder specifically:

> "For me, i should connect with all my tools and get the data in User Workbench + L2 + L3 - OWUI + Coda"

**The complete personal loop (IW as your daily OS):**

1. **Connect once** (via MCP connector / Nango):
   - All personal tools (Gmail, personal Slack, personal Coda, calendar, notes, etc.)
   - All company tools (HubSpot, Jira, etc.)
   - Data goes: Tool → Loader (intake) → Normalizer (strip logic, detect traits, resolve to resource type) → MCP write → Spine (personal_memory for founder-specific + org_memory for shared).

2. **User Workbench (L1/L2 surfaces in the main app)**:
   - Main workbench views (memory, desk, entity views, etc.).
   - See unified personal + company data from Spine. No direct tool tabs.

3. **L2 cognitive layer** (the drawer/panels):
   - Spine panel, Context, Knowledge, Think, Twin insights, Signals, etc.
   - All panels read from Spine/MCP. L2 surfaces weak signals and proposes actions.

4. **L3 - OWUI (full Twin at twin.operations.integratewise.ai)**:
   - From any L2 surface or workbench, handoff with `personal: true` (now supported in the handoff library).
   - The OWUI Twin opens with founder personal context + current entity/insight pre-loaded.
   - The Twin reasons exclusively over Spine memory (via MCP/Continuity Bridge). It never talks directly to any of your tools.
   - **AI connected to Coda via MCP**: The TwinOrchestrator prompt and execution now fully support Coda L4 MCP tools (coda.connect_doc to register founder Coda docs tied to .iw-memory/personal OS, coda.read_page to pull Coda page content into context without direct API, coda.sync_memory_to_doc to push updates to Coda as projection). In the cognitive synthesis + playbook processing, the AI explicitly handles "coda.\*" steps by invoking MCP (logged/executed in the worker). This wires the Twin AI directly to Coda docs via the MCP layer for your personal + company use.

5. **Coda (L4 living projection)**:
   - Dedicated L4 surface: `packages/coda-pack/sync-org-memory.ts` (run with `--personal` for founder).
   - Pulls **exclusively via MCP** (`memory.search_org` + `memory.read_personal` for iw-customer-zero / nirmal).
   - Syncs to Coda tables:
     - "Org Memory" (governed company knowledge, categories mapped to Think/Decide/Work/Learn)
     - "Personal Memory" (your founder OS: preferences, behaviors, decisions, context from all your tools)
   - In Coda you get nice views, tables, and can even use the IntegrateWise Coda Pack formulas for live pulls.
   - Coda is the **view / human editing surface**. Spine is the single source of truth. Writes in Coda that need to be canonical go back through governed paths (Triage / proposals) into the Spine.
   - This completes your loop: all tools → Spine (via MCP/Loader/Normalizer) → available in Workbench + L2 + L3 OWUI + Coda (L4).

**Local high-velocity substrate: /Users/nirmal/.iw-memory (founder personal vault)**

This is the founder's local "L0/L1" memory vault (the path you referenced).

- Structure: memory/conversational/, memory/decisions/ (with promote: true), memory/org/, specs/, steering/, agents/.
- Fast path: `scripts/sync-memory-vault.ts` scans it and does direct (idempotent) D1 writes to conversational_memory / org_memory (and now personal_memory for specs/steering/founder decisions).
- Ideal path (Loader/Normalizer/MCP): The same script now also calls MCP `memory.write_personal` and related tools for new personal content (specs, steering, founder notes). File changes are also watched by `apps/local-monitor` → webhook-ingress → Loader → Normalizer → Spine (MCP).
- Folder Monitor dashboard projects the vault for review/promotion.
- Content here (decisions, specs, steering, transcripts) flows to personal_memory (founder) + org_memory, then to L2/L3 Twin (with personal handoff), and to L4 Coda via the personal sync.
- Dual-write for Customer Zero: local speed + canonical Spine.

This is how your personal notes, architecture specs, decisions, and steering documents become part of the unified memory available in the Workbench, L2, L3 OWUI, and Coda — without ever requiring direct tool access by agents.

**Coda Docs MCP Connect (new – "coda docs mcp connect") + Twin + Coda Connection**

Coda documents are now first-class MCP-connectable resources (L4 projection + readable source).

New MCP tools (catalog + handlers in mcp-connector):

- `coda.connect_doc` — Register a Coda doc (with `is_personal: true` for founder OS). Stores connection in personal_memory, triggers initial sync. Now the doc is "connected" like any other tool.
- `coda.read_page` — Read a Coda page through MCP (proxied; agents/Twin get content without ever calling Coda API directly).
- `coda.sync_memory_to_doc` — Push personal_memory (from .iw-memory via monitor/Folder Monitor/Coda personal sync) + org_memory to the connected Coda doc as governed L4 tables/pages. All via MCP.

For your Coda docs (L4):

1. `coda.connect_doc({ tenant_id: "iw-customer-zero", coda_doc_id: "...", is_personal: true, doc_name: "Founder OS + Ops Plans" })`.
2. Existing .iw-memory content now flows to personal_memory → `coda.sync_memory_to_doc` (scope personal) updates your Coda doc via MCP.
3. In L3 Twin / L2 / agents (via MCP): use `coda.read_page` or the memory tools to surface Coda content. No direct tool reads.

**Twin + Coda Connection ( "or connect twin and coda" )**

The L3 Twin AI (the "Mind" powering the OWUI Twin) is now directly connected to L4 Coda docs via MCP tools.

In the TwinOrchestrator (intelligence worker):

- The prompt now has a dedicated **Coda L4 Connection (via MCP only)** section, telling the AI to use "coda.connect_doc", "coda.read_page", "coda.sync_memory_to_doc" for interacting with Coda docs (register, read pages into context, sync memory to Coda as L4 projection).
- For the founder, the context gathering pulls the connected Coda doc from personal_memory (the connection registered via connect_doc, linked to .iw-memory personal content).
- In the LLM response + playbook post-processing, it detects "coda.\*" steps and executes them by calling the MCP invoke (https://mcp.integratewise.ai/invoke) for the Coda tool:
  - For read_page: fetches the page content (markdown) and injects it into the briefing ("**Coda Page: xxx** (read via MCP L4): [content]").
  - For sync_memory_to_doc: calls the pack's buildOrSyncDoc to update the Coda doc with current memory.
  - Results are captured and the briefing is augmented with Coda results for L3 use.
- This allows the Twin to "connect" to Coda: read L4 Coda pages (which can contain synced .iw-memory/personal_memory content) into its reasoning, or push updates to Coda via MCP, all without direct tool access.

This fulfills "connect twin and coda": the AI Twin now natively uses Coda as a connected L4 surface via MCP, as part of the personal OS stack. The external OWUI Twin inherits this through the orchestrator.

See the updated twin-orchestrator.ts (prompt, context, post-processing) and the MCP Coda tools in tools.ts.

The Coda pack handles the human L4 side in Coda; the AI connects via MCP tools.

This aligns with the architecture: Twin reaches interfaces internally or via MCP for connected surfaces like Coda, data flows through Spine/MCP.

If you want the OWUI to have Coda tools pre-configured or a specific Coda doc auto-connected for the founder, provide the doc ID.

The connection is complete per your request.

**L4 Coda for the founder (your personal + company OS)**

After connecting a tool (personal or company), the data is normalized once into the Spine. From there:

- It appears in your User Workbench and L2 surfaces (real-time via D1/MCP).
- The L3 OWUI Twin can reason over it (personal context handoff supported).
- L4 Coda gets a clean, queryable, human-friendly copy via the sync (or live via the Coda Pack).

You never have to go back to the original tool UIs for memory or state. Coda becomes one of your primary "thinking" and "planning" environments, always backed by the Spine.

Example founder daily use of L4:

- Open your main Coda doc.
- See "Personal Memory" table with recent decisions, preferences, and context pulled from Gmail/Slack/Coda itself + company tools.
- "Org Memory" table with key company doctrine, commitments, proposals.
- Use Coda buttons or the IW Pack to trigger a "propose to Spine" that goes through Triage.
- The same data is instantly available when you open the L3 Twin or any workbench surface.

**Key guarantee (your ideal state):**

- After a tool is connected, no LLM (your Claude, ChatGPT, the internal Twin, Agent Zero, etc.) ever reads directly from the tool again.
- Everything is normalized in Spine.
- Authorized queries (even for not-yet-connected apps) can still return state from the Spine.
- You live in Workbench + L2 + L3 Twin + Coda, all powered by the same memory.

This is exactly the dogfood / first win: you (Nirmal) using IW + your existing Coda as your complete personal + company operating system.

### How users (the team + their agents) will actually use it

**Internal team (CS, TAM, ops — Customer Zero / first win):**

1. Log into the role-specific projection surface (e.g. Account Success portal for CS work, Desk for daily signals/schedule, Triage for inbound processing).
2. See unified, tool-agnostic data from the Spine (accounts with health/renewal, signals, commitments, entities resolved across all connected SaaS).
3. Work normally: edit narratives, review telemetry, triage incoming comms (email/slack/webhook/etc.).
4. Use the embedded Twin (or "Run Twin" buttons) for instant proposals/briefs grounded only in Spine context.
5. For deep work or complex reasoning: click through to the full L3 Twin at the ops-branded URL. Context (entity, insight, current view) is passed via handoff so the Twin opens already loaded with the right Spine slice.
6. Proposals flow to approval queues (HITL). Approved actions execute via the Act layer and write back to Spine (and thus the original tools).

**External / customer agents (Claude, ChatGPT, custom agents, etc.):**

1. The user (or their company) connects their LLM/agent to IW's MCP interface (mcp.integratewise.ai or the authorized MCP endpoint).
2. They authenticate with tenant credentials (never share raw tool tokens).
3. They ask normal questions: "What's the renewal risk for Northwind?" or "Draft a re-engagement plan for Helix based on recent signals."
4. The MCP layer + ADK + (if needed) on-demand Loader/Normalizer gives them the answer from the Spine only. Tool-specific logic, auth, pagination, rate limits — all stripped away.
5. If the underlying app (e.g. a niche billing tool) is not yet connected: as long as relevant data has previously flowed through any connected source (or was inferred/normalized), the authorized query still succeeds against the Spine. No direct connection from the LLM to the raw SaaS is ever required or allowed.

This is the ideal operating state: one canonical memory (Spine), one door (MCP), governed intelligence (Twin + agents), and the company's own operations running on top of it as the first real win and credibility proof.

---

_The Bridge is the product. MCP is one interface inside it. Auth is Cloudflare.
The tool surface is 20. Supabase is fortress data only._
