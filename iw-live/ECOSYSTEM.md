# IntegrateWise Ecosystem Map

> Version: 1.0.0 | Date: 2026-06-03 | Authority: Nirmal (Founder)
> This file exists in every repo. Any agent reading it immediately knows the full ecosystem.
>
> **⚠️ Current truth (2026-06-12, supersedes the 2026-06-03 data-layer notes below):** Product name
> is the **IW Continuity Bridge**; the product plane is **100% Cloudflare** (D1/KV/R2/Vectorize/AI
> Search/Durable Objects); the Twin is Cloudflare-native. For the authoritative model start at
> `docs/CANON.md` → `docs/architecture/PRODUCT_ARCHITECTURE.md`. Older store/runtime references in
> this file are historical.

---

## STOP — READ THIS IF YOU ARE IN ANY INTEGRATEWISE REPO

You are inside one node of a connected ecosystem. This file tells you what the other repos are, what they do, and how they relate to this one. **Do not treat this repo as isolated.**

---

## The Canonical Master Reference

All architecture decisions, agent laws, and governance rules live here:

```
/Users/nirmal/Github/IntegrateWise - Memory/AGENTS.md
```

Read that file before acting. This ECOSYSTEM.md is the connection map, not the law.

---

## Repo Registry

| Repo                                      | Role                                                                                                                                                   | Stack                                    | Status     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ---------- |
| `integratewise-live`                      | **Backend engine** — 25 Cloudflare Workers. Pipeline, Intelligence, Gateway, Knowledge, Connector. The ONLY Supabase credential holder.                | TypeScript, Cloudflare Workers, Supabase | PRODUCTION |
| `Business Intelligence`                   | **BI Hub frontend** — TanStack Start. My Desk · Decide · Build · Grow · Run · Twin Workbench · Memory View. FINAL BI surface.                          | TypeScript, TanStack Start, Vite, Bun    | ACTIVE     |
| `Account Success & TAM`                   | **Account Success frontend** — TanStack Start. Account 360, TAM signals, renewal risk, inbox, tasks, twin surface.                                     | TypeScript, TanStack Start, Vite, Bun    | ACTIVE     |
| `IntegrateWise - Memory`                  | **Organisational memory repo** — AGENTS.md, policy docs, org memory, conversational memory, brand assets, founding architecture. Not a deployable app. | Markdown, JSON                           | CANONICAL  |
| `integratewise-ops`                       | **Ops control board** — Vue 3. Wires to integratewise-live REST API. No new backend. Observability, tenant management, agent monitoring.               | TypeScript, Vue 3, Vite                  | ACTIVE     |
| `integratewise-docs`                      | **Public documentation** — governed projection of org memory. Published subset of canonical truth.                                                     | TypeScript/docs framework                | PLANNED    |
| `org-mem.bookofprojects-integratewise`    | **Book of Projects / Evolution public surface** — published projection, EvolutionPage.tsx with Book of Records. Front door.                            | React, TypeScript                        | ACTIVE     |
| `integratewise-business-intelligence-hub` | **Deprecated** — superseded by `Business Intelligence` repo. Do not build here.                                                                        | —                                        | DEPRECATED |

---

## Architecture in One View

```
┌─────────────────────────────────────────────────────────────────┐
│                    HUMAN SURFACES (Frontends)                   │
│                                                                 │
│  Business Intelligence   Account Success & TAM   integratewise-ops │
│  (BI Hub — main app)     (CSM / Account 360)     (Ops board)    │
│         ↓                        ↓                    ↓        │
├─────────────────────────────────────────────────────────────────┤
│              MCP GATEWAY  (integratewise-live/gateway)          │
│         JWT auth · tenant isolation · rate limiting             │
├─────────────────────────────────────────────────────────────────┤
│              CLOUDFLARE WORKERS (integratewise-live)            │
│                                                                 │
│  pipeline   connector   intelligence   knowledge   governance   │
│     ↓           ↓            ↓             ↓           ↓       │
├────────────────────────────────────────────────────────────────-┤
│  Cloudflare Edge: D1 (read-only Spine mirror) · KV · DO · Queues │
│               ↕  PIPELINE A (Supabase → CF)                     │
│               ↕  PIPELINE B (CF → Supabase)                     │
├─────────────────────────────────────────────────────────────────┤
│              SUPABASE (fortress — zero public access)           │
│  org_memory · conversational_memory · personal_memory · spine   │
│           CF MCP Worker = ONLY credential holder                │
└─────────────────────────────────────────────────────────────────┘

    MEMORY REPO                  ORG-MEM / BOOK OF PROJECTS
    Governs all repos            Published projection surface
    (not deployed)               (front door / evolution page)
```

---

## Entity 360 — Where Twin Lives

```
Pipeline A: Supabase org_memory → Cloudflare KV/D1 (entity push)
                              ↓
                      Entity 360 (assembled at CF edge)
                              ↑
Pipeline B: Cloudflare session turns → Supabase conversational_memory

Twin reads ONLY from Entity 360.
Twin NEVER writes to Supabase directly.
All writes: Twin proposes → Triage Bot governs → Supabase via CF MCP Worker.
```

---

## Write Law (non-negotiable)

```
EVERY TOOL reads from Shared Memory.
NOTHING writes to Shared Memory directly.
ALL writes go to the Triage Bot.
The Triage Bot is the ONLY writer to Shared Memory.
```

---

## Language Law

TypeScript everywhere. No Python. No exceptions.
Cloudflare Workers · TanStack Start · Vue 3 · Bun · Vite.

---

## This File

This ECOSYSTEM.md is identical across all repos. If you update it in one repo, propagate to all.
Do not diverge it. It is the ecosystem's shared map.
