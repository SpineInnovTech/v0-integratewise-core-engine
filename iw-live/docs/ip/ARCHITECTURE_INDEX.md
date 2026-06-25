# IntegrateWise — Canonical Architecture Index

> **Version:** 1.1 | **Date:** 2026-06-09 | **Status:** CURRENT SOURCE OF TRUTH
> **Authority:** Nirmal (Founder)
>
> Read this before editing any architecture, deployment, onboarding, or marketing
> doc. If another document disagrees with the invariants below, this index wins
> and that document is drift — fix it or mark it superseded.

---

## The Ideal Operating State (the operating model)

```
INGESTION (happens once per tool):
  Any SaaS tool / app  → Nango (auth) → Connector → Loader (8 stages)
                       → Normalizer (8 stages, tool logic stripped, SSOT)
                       → Spine (the only normalized truth)

  After this, the tool is a SOURCE ONLY. No agent reads it directly again.

CONSUMPTION (happens every session, every agent):
  Connect Claude / ChatGPT / any AI to the IW Continuity Bridge ONCE.
  From then on the agent reads from SPINE MEMORY via MCP — never from the tool.
  MCP + ADK + Loader + Normalizer strip the tool logic; SSOT means only the
  Spine holds the data. Every agent sees the same truth. Memory persists.

UNCONNECTED APP (the hard boundary):
  If an agent (e.g. ChatGPT) asks for data from an app that is NOT connected:
    • It must NOT connect to that tool directly.
    • The path is: authorize the connection THROUGH IntegrateWise → data lands
      in the Spine → the agent then fetches the state/data FROM the Spine.
    • Until connected through IW, the Bridge returns connector_not_available
      with a connect_url. The agent cannot route around the Spine to the tool.

NET EFFECT:
  M×N direct tool connections (every agent × every tool) collapse to 1:N.
  Connect once. Your AI speaks first. The system never starts cold.
```

This is the **Spine Abstraction Principle** — the moat. Full detail:
`docs/ARCHITECTURE_AND_DATA_FLOW.md` (The Spine Abstraction Principle) and
`docs/tech/MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md` §9.

---

## Architecture Invariants (v1.1 — freeze these)

```
PRODUCT
  Continuity Bridge = MCP + Gateway + Spine + Normalizer + Memory + Governance.
  MCP is NOT the product. MCP is one interface inside the product.

AUTHENTICATION
  Identity:      Cloudflare Access (Google + GitHub SSO). No password.
  Session:       Gateway D1 JWT (RS256).
  Authorization: Gateway policy layer (plan tier + tenant isolation).
  Supabase:      Fortress DATA record only. NEVER an auth path.

DATA TIER (usage-gated, not chosen at signup)
  Initial users: D1-edge only. No Supabase.
  Supabase fortress is ALLOTTED based on usage — never provisioned at signup.

TWIN ACCESS
  Twin → continuity-tool-server → Continuity Bridge → Spine.
  Never Twin → direct Spine. The Bridge is the policy boundary.
  mcp.integratewise.ai is the EXTERNAL door (Claude, ChatGPT, 3rd-party).

TOOL SURFACE
  Canonical count: 20. (figma.* purged 2026-06-06.) Anything else is drift.

ADK
  Stateless. Zero I/O. Capability resolution only. No tenant/data access
  before Gateway authorization. Binds to DOMAIN_SPINE_CONFIG (12 dept × 11 industry).

WRITE DISCIPLINE
  Pipeline is the sole writer to Spine tables.
  Agents propose; Triage Bot governs; Pipeline writes. No agent writes Spine.

PUBLIC + INTERNAL DOCS (governed projections)
  ALL docs — internal (engineering/product/ops) and public (docs.integratewise.ai)
  — are governed PROJECTIONS of org_memory via the docs-publish flow
  (propose → govern → promote → project → publish). integratewise-docs is an
  OUTPUT repo — never hand-edited. INITIAL LOAD ONLY runs on a separate bulk queue
  (not the live pipeline-process queue) for backpressure isolation; steady-state
  uses the normal governed flow.
  Classification decides the surface: internal → CF Access gated; public → open.
  Every page traces to an approved org_memory entry.
  See `docs/tech/DOCS_PUBLICATION_PIPELINE.md`.

GOVERNANCE
  Approval UI lives in L2 only — never in chat/voice (chat is not an audit trail).
  No archive: content is active, superseded (with lineage), or rejected (with reason).

HUMAN OPERATING MODEL (U-series — what the human does)
  U1 Work · U2 Notice · U3 Reason · U4 Decide · U5 Act · U6 Remember.
  Twin (U3 Reason) proposes only; U4 Decide approves/promotes; U5 Act runs the playbook.
  See `docs/tech/CANONICAL_TAXONOMY.md`.

TAXONOMY RULE (locked — four orthogonal paths, never collapse to one L-number)
  S-series = System Architecture  (surfaces; "where / what surface?")
             S0 Infrastructure · S1 Workspace · S2 Awareness · S3 Twin · S4 Library
  U-series = Human Operating Model (cognitive stages; "what am I doing?")
             U1 Work · U2 Notice · U3 Reason · U4 Decide · U5 Act · U6 Remember
  V-series = View Path             (render modes; "how is it displayed?")
  CZ-series = Customer Zero Path   (self-operation loop; "how IW runs itself?")
  Approval = U4 Decide; UI on S2 Awareness; never in S3 Twin chat.
  (Supersedes the H-series naming. The "L1–L4" UI surface table = S1–S4.)
  Full definitions + cross-mapping: `docs/tech/CANONICAL_TAXONOMY.md`.

CONTEXT (three distinct meanings — do not conflate)
  Gateway context = request envelope (auth + tenant + policy).
  Spine context   = operational data context.
  Twin context    = reasoning context.
```

---

## Canonical Document Set

| Concern                                     | Document                                                       | Version  |
| ------------------------------------------- | -------------------------------------------------------------- | -------- |
| System-wide flow + layers (L0–L4)           | `docs/ARCHITECTURE_AND_DATA_FLOW.md`                           | 1.1      |
| Read/write stack (MCP·ADK·Spine·Memory)     | `docs/tech/MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md`       | 1.1      |
| Deployment + endpoints + 20-tool surface    | `docs/tech/CONTINUITY_BRIDGE_DEPLOYMENT_STATUS.md`             | 1.1      |
| Docs publication pipeline (internal+public) | `docs/tech/DOCS_PUBLICATION_PIPELINE.md`                       | 1.1      |
| Canonical taxonomy (S/U/V/CZ paths)         | `docs/tech/CANONICAL_TAXONOMY.md`                              | 1.0      |
| Auth migration (complete)                   | `docs/tech/AUTH_MIGRATION_DESIGN.md`                           | COMPLETE |
| Product architecture + requirements         | `docs/tech/INTEGRATEWISE_PRODUCT_ARCHITECTURE.md`              | —        |
| Frontend layer map (views→routes→APIs)      | `docs/FRONTEND_LAYER_MAP.md`                                   | 1.0      |
| Decision log                                | `ARCHITECTURE_DECISIONS.md` + `~/.iw-memory/memory/decisions/` | —        |

---

## Drift Watchlist (known stale references to fix on touch)

```
• "16 tools" / "18 tools"            → 20
• "Supabase auth" / Supabase login   → Cloudflare Access + Gateway JWT
• "Twin reads via MCP"               → Twin reads via Continuity Bridge (MCP = external door)
• figma.* MCP namespace              → removed (purged 2026-06-06)
• integratewise-docs/ copies         → align via Triage promotion, not direct edit
```

---

_Current Version: 1.1 · Auth: Cloudflare · Tool Surface: 20 · Bridge: Canonical ·
Twin Access: Bridge Only · Status: Current Source of Truth._
