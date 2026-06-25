# IntegrateWise — Layer Ownership & Twin Runtime Doctrine

> **Date:** 2026-06-09 | **Authority:** Nirmal (Founder) | **Version:** 1.0
> **Status:** LOCKED — canonical layer ownership definition
> **Supersedes:** Prior L1-L4 descriptions in IW_FRONTEND_ARCHITECTURE.md (Nuxt/Vue doc is deprecated)
> **Companions:** CANONICAL_TAXONOMY.md, ARCHITECTURE_AND_DATA_FLOW.md, MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md

---

## The Architectural Statement

```
Open WebUI powers the Twin.
IntegrateWise powers the intelligence.
```

Open WebUI is not a feature source. It is a **runtime**.

Most teams start with: Product → Chat → AI.
IntegrateWise ends with:

```
Product
  ├── Work        (L1)
  ├── Awareness   (L2)
  ├── Twin Runtime (L3)
  └── Memory      (L4)
```

This is fundamentally different. The moat is not the chat. The moat is the
awareness layer, the governed memory loop, and the Spine abstraction.

---

## Final Layer Ownership

### L1 — Workspace

```
Purpose:    DO WORK
Owner:      IntegrateWise (apps/web)
Nav:        Sections in the left nav (Desk, Inbox, Entity360, domains, tasks, etc.)
Status:     ALREADY BUILT — 12 domains × 20-47 views each, wired to Spine
Contains:   Desk · Inbox · Entity360 · Tasks · Pipeline · Projects
            Reports · Approvals · Actions · Triage · Domain Views (12)

Open WebUI does not own this. These are nav sections in apps/web.
```

**Code:** `apps/web/src/components/l1/` (12 domains × views)
**Shell:** `workspace-shell-new.tsx` (Personal / Work toggle)
**Data:** `useSpineProjection` → gateway → D1 spine_vault (real Spine data, no mock)

---

### L2 — Awareness

```
Purpose:    NOTICE
Owner:      IntegrateWise (apps/web)
Nav:        Sections in the left nav (Signals, Insights, Scoring, Evidence, Triage)
Status:     SPLIT OUT — now nav sections, not just a bottom drawer
Contains:   Signals · Scoring · Predictions · Insights · Evidence
            Lineage · Readiness · Triage · Governance Queue

This is the real moat. Nav sections in the same app.
The overlay drawer ALSO exists for urgent signals that interrupt work.
```

**Code:** `apps/web/src/components/l2/` (cognitive/, insights/, signals/, spine/)
**Trigger:** `cognitive-triggers.tsx` — role-based thresholds still fire the drawer
**Nav sections:** Signals, Insights, Evidence, Triage — accessible from left nav directly

---

### L3 — Twin Runtime

```
Purpose:    THINK
Owner:      Open WebUI (DEPLOYED INSTANCE — we don't build it)
Nav:        Section in the left nav (Twin) — links/embeds to OWUI
Status:     LIVE at twin.integratewise.ai (Hostinger)
Contains:   Conversation · Voice · Planning · Reasoning · Research
            Execution · Playbooks · Tool Usage · Briefings

The Twin is the Conversation Layer for the Spine.
OWUI is a deployed instance we USE. Not code we maintain.
```

**Runtime:** Open WebUI instance (deployed, Hostinger)
**URL:** twin.integratewise.ai
**Integration:** iframe embed in apps/web OR external link from nav
**Bridge:** continuity-tool-server → pipeline → Spine

---

### L4 — Library (Memory)

```
Purpose:    KNOW
Owner:      IntegrateWise (apps/web)
Nav:        Sections in the left nav (Org Memory, Personal, Decisions, Doctrine, Knowledge)
Status:     BUILT — memory views wired to Spine
Contains:   Org Memory · Personal Memory · Book of Projects · Doctrine
            Decisions · Research · Playbooks · Knowledge Assets

The permanent memory substrate. Nav sections in the same app.
The Twin reads from it. The Twin does not own it.
```

**Code:** `apps/web/src/components/l1/knowledge/` + memory views
**Projection:** Also syncs to Coda (L4 external) via `coda-pack/sync-org-memory.ts`

---

## The Left Nav Structure (one app, all layers)

```
LEFT NAV — apps/web
─────────────────────────────────────────
  L1 WORK
    Desk            /desk
    Inbox           /inbox
    Entity 360      /entity360
    [Domain views]  /work/*
    Tasks           /work/tasks
    Projects        /work/projects
    Reports         /work/grow

  L2 AWARENESS
    Signals         /signals
    Insights        /insights
    Triage          /triage
    Evidence        /evidence

  L3 TWIN
    Twin            /twin  (embeds/links OWUI)

  L4 MEMORY
    Org Memory      /memory/org
    Personal        /memory/personal
    Decisions       /memory/decisions
    Knowledge       /knowledge

  SYSTEM
    Connectors      /connectors
    Settings        /settings
    Profile         (toggle)
─────────────────────────────────────────
```

All four layers are **nav sections in one app**. Not four separate apps.
Not four separate surfaces. One left nav. One shell. One surface.
L3 is the only external link (OWUI deployed instance).

#### What Open WebUI Provides (must use)

| Feature         | IW Usage                                            |
| --------------- | --------------------------------------------------- |
| Chat (core)     | Conversation with the Twin                          |
| Voice           | x.ai "eve" hands-free                               |
| File uploads    | Drop docs for Twin to reason over                   |
| Web search      | Agent Zero searches + cites                         |
| Code execution  | Open Terminal (run code in sandbox)                 |
| MCP support     | 4 tool servers connected                            |
| Model presets   | "IW Twin" preset (doctrine + tools + Spine context) |
| Knowledge (RAG) | Doctrine + org_memory loaded as collections         |
| Bound tools     | Force-enabled per agent config                      |
| Agent runtime   | Agent Zero multi-step execution                     |

#### Nice to Have (later, not v1)

| Feature         | Potential Use                                   |
| --------------- | ----------------------------------------------- |
| Automations     | Schedule daily 8am brief trigger                |
| Task management | Playbook step tracking                          |
| Slash commands  | `/brief`, `/risk`, `/propose`, `/entity <name>` |
| Skills          | Doctrine as markdown instruction sets           |
| Channels        | Team + Twin in same thread (future)             |

#### Ignore (IW already owns better versions)

| Feature         | Why Ignore                                            |
| --------------- | ----------------------------------------------------- |
| RBAC / Admin    | CF Access + Gateway handles                           |
| Analytics       | L1 domain views handle                                |
| Native Memory   | Spine + governed memory loop is stronger              |
| Native Auth     | CF Access is sole identity                            |
| Team Governance | L2 awareness + L1 triage views                        |
| Notes           | Violates Continuity doctrine — use L4 Library instead |

> **Critical:** Open WebUI Notes must NOT be used. They create a fragmented
> memory store that violates the Continuity doctrine. Everything durable ends
> up in: Spine → Library → Governed Memory. Not inside OWUI's database.

---

### L4 — Library (Memory)

```
Purpose:    KNOW
Owner:      IntegrateWise
Contains:   Org Memory · Personal Memory · Book of Projects · Doctrine
            Decisions · Research · Playbooks · Knowledge Assets

This is the permanent memory substrate.
The Twin reads from it.
The Twin does not own it.
```

**Projection surfaces:** Coda (primary L4 for founder), any queryable surface
**Sync:** `packages/coda-pack/sync-org-memory.ts` (--personal for founder mode)
**MCP tools:** coda.connect_doc, coda.read_page, coda.sync_memory_to_doc
**Governance:** Triage Bot governs all writes to org_memory. Twin proposes, never writes.
**Storage:** R2 (raw) + AI Search/Vectorize (semantic retrieval) + D1 (metadata) + Supabase (fortress, promoted)

---

## Briefings — The Missing Category

Briefings deserve their own classification. Not chat. Not memory. Not signals.

```
Morning Brief
Weekly Brief
Account Brief
Project Brief
Decision Brief
Risk Brief
Deployment Brief
```

**Generated from:** Spine + Signals + Memory + Entity360
**Rendered through:** Twin (L3)
**Consumed in:** L1 (/desk) + L3 (Twin speaks first)

Briefings are one of the most-used experiences in the platform. They are the
Twin's primary OUTPUT that appears in L1 (the morning brief card on /desk) and
is generated via L3 (MorningContextBuilder → Twin Orchestrator).

---

## The Mental Model

```
L1 = Work
L2 = Awareness
L3 = Reasoning
L4 = Memory

Spine = Truth
Continuity Bridge = Access Layer
Twin = Conversation Layer
```

---

## Layer Boundaries (hard walls)

```
L1 ↔ L3:   L1 NEVER embeds chat. Twin outputs surface as cards/proposals in L1.
            L3 NEVER owns views. It reasons. L1 renders the result.

L2 ↔ L3:   L2 surfaces signals + evidence + [Open Twin ↗].
            L3 does the thinking when the user clicks through.
            L2 NEVER reasons. L3 NEVER signals.

L3 ↔ L4:   Twin READS from Library (via MCP/Vectorize).
            Twin PROPOSES to Library (via memory.propose → governance).
            Twin NEVER writes to Library directly.

L2 ↔ L4:   L2 may reference memory (evidence context).
            L4 is not surfaced as an overlay. L4 is a separate projection surface.

OWUI ↔ Spine:  Open WebUI NEVER accesses Spine directly.
               continuity-tool-server is the ONLY bridge.
               All OWUI memory features are UNUSED (Spine owns memory).
```

---

## Ownership Summary

| Layer             | Owner                                               | What Dies If Removed                                  |
| ----------------- | --------------------------------------------------- | ----------------------------------------------------- |
| L1 Workspace      | IntegrateWise                                       | All operational views, domain projections, daily work |
| L2 Awareness      | IntegrateWise                                       | Signals, scoring, predictions, governance — THE MOAT  |
| L3 Twin Runtime   | Open WebUI (runtime) + IW (intelligence via Bridge) | Reasoning, conversation, voice, planning              |
| L4 Library        | IntegrateWise                                       | Institutional memory, doctrine, decisions, knowledge  |
| Spine             | IntegrateWise                                       | Operational truth (entities, relationships, signals)  |
| Continuity Bridge | IntegrateWise                                       | Access layer (MCP + Gateway + ADK + Auth)             |

**If Open WebUI is swapped for another chat runtime:** L1, L2, L4, Spine, and Bridge are unaffected. Only L3's UI changes. The Twin is model-agnostic AND runtime-agnostic.

**If IntegrateWise is removed and only OWUI remains:** Everything that matters disappears. No awareness. No governance. No memory loop. No entity resolution. No Spine. Just a generic chat app.

That's where the moat lives.

---

_Open WebUI powers the Twin. IntegrateWise powers the intelligence._
_The chat is not the product. The continuity is._
