# IntegrateWise — Architecture Context & Documentation Rules

> Master reference for all agents, contributors, and documentation authors.
> Last updated: April 2026

---

## Current Surface-Binding Doctrine

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- OpenWebUI is not the customer-facing product shell.
- Twin / OpenWebUI runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

Use older L1/L2 / workspace / knowledge-UI language in this file through that boundary if any historical phrasing remains.

---

## Table of Contents

1. [Product Definition & Terminology](#1-product-definition--terminology)
2. [Architecture Overview](#2-architecture-overview)
3. [The Three Data Flows](#3-the-three-data-flows)
4. [L1 — The Workspace (12 Domain Views)](#4-l1--the-workspace-12-domain-views)
5. [L2 — The Cognitive Layer (14 Components)](#5-l2--the-cognitive-layer-14-components)
6. [The Schema System](#6-the-schema-system)
7. [Entity 360 — Convergence Point](#7-entity-360--convergence-point)
8. [The Cognitive Loop](#8-the-cognitive-loop)
9. [Connector Ecosystem](#9-connector-ecosystem)
10. [The Knowledge Memory](#10-the-knowledge-memory)
11. [Trust & Governance](#11-trust--governance)
12. [20 Products Across 3 Surfaces](#12-20-products-across-3-surfaces)
13. [Founding Story](#13-founding-story)
14. [Go-To-Market (Current Phase)](#14-go-to-market-current-phase)
15. [Architectural Review (9.2/10)](#15-architectural-review-9210)
16. [Documentation Rules — Public vs Internal](#16-documentation-rules--public-vs-internal)
17. [Writing Style](#17-writing-style)
18. [Sidebar Structure — Public Docs](#18-sidebar-structure--public-docs)
19. [Known Issues (Code, Not Docs)](#19-known-issues-code-not-docs)
20. [Key Source Files](#20-key-source-files)

---

## 1. Product Definition & Terminology

### What IntegrateWise IS

IntegrateWise is a **Knowledge Workspace over the Spine, empowered by AI**.

It is NOT a platform, NOT an OS, NOT a tool.

### Approved Terms

| Term                           | Usage                                       | Context                                  |
| ------------------------------ | ------------------------------------------- | ---------------------------------------- |
| Knowledge Workspace            | Primary descriptor                          | Always use this                          |
| Spine                          | Default name for the intelligent data layer | Product-level term                       |
| Adaptive Spine                 | Variant of Spine                            | Glossary synonym — same thing            |
| Intelligent Spine              | Variant of Spine                            | Glossary synonym — same thing            |
| Unified Intelligence Layer     | Variant of Spine                            | Glossary synonym — same thing            |
| Adaptive Layer                 | Variant of Spine                            | Glossary synonym — same thing            |
| Cognitive Intelligence Overlay | L2 overlay experience                       | Correct as-is — "overlay" is intentional |
| Cognitive Layer                | Short form of above                         | Acceptable                               |
| TruthLayer                     | Trust/governance system                     | Platform capability, not a product       |
| Entity 360                     | Convergence point for all 3 flows           | Core view, not standalone product        |

### NEVER Say Externally

- "We are a platform"
- "We are an AI tool"
- "Cognitive OS"
- "IntegrateWise OS"
- "We replace Gainsight"
- "We are like Salesforce but with AI"

### Hero Anchor

> "Your tools don't talk to each other. Your AI doesn't know context. You are the bridge. The Human API."

### Trust Line

> "Every AI remembers. Only IntegrateWise remembers the truth."

---

## 2. Architecture Overview

IntegrateWise has two product layers:

### L1 — The Workspace

- 12 domain-specific views
- Schema-filtered per tenant (industry + department)
- What users see and work in daily

### L2 — The Cognitive Layer (Overlay)

- 14 components accessible via `Cmd+J`
- Non-intrusive overlay — sits alongside work, extends when needed
- Also schema-filtered

### Platform Engine (Under the Hood)

- The Spine (intelligent plumbing connecting all data)
- Entity 360 (convergence point)
- Schema system (12 domains × 11 industry overlays)
- 8-stage processing pipeline (INTERNAL ONLY — never expose publicly)
- Connector ecosystem
- Knowledge Memory

```
┌──────────────────────────────────────────────────┐
│                   L2 — COGNITIVE OVERLAY          │
│  (SpineUI, ContextUI, KnowledgeUI, Twin, HITL,   │
│   Signals, Think, Act, Govern, Adjust, Repeat,    │
│   Audit Trail, Agent Config, Evidence Drawer)      │
├──────────────────────────────────────────────────┤
│                   L1 — WORKSPACE                  │
│  (12 domain views, schema-filtered per tenant)    │
├──────────────────────────────────────────────────┤
│              PLATFORM ENGINE                      │
│  Spine │ Entity 360 │ Schema │ Pipeline │ Memory  │
├──────────────────────────────────────────────────┤
│              CONNECTORS                           │
│  50+ SaaS │ MCP │ Webhooks │ Accelerators │ AI    │
└──────────────────────────────────────────────────┘
```

---

## 3. The Three Data Flows

Three distinct data flows with hard boundaries:

### Flow A — Structured / Truth

```
Tools → Loader → Normalizer → Spine
                                 ↓
                         Actions on tools
                                 ↓
                         (flows back into Flow A — REPEAT LOOP)
```

- Source: SaaS connectors (CRM, billing, support, etc.)
- Destination: The Spine (structured truth)
- Has a **repeat loop**: governed actions executed on tools flow back as new structured data
- This is the ONLY flow with a repeat loop

### Flow B — Unstructured / Context

```
Docs, emails, conversations → Context Store + Spine linking
```

- Source: Documents, emails, Slack messages, meeting transcripts
- Destination: Context Store, linked to Spine entities
- NO repeat loop
- Enriches entities with qualitative context

### Flow C — AI Knowledge / Memory

```
AI sessions → Triage Bot (SOLE writer) → Memory Store
```

- Source: AI interactions, Twin sessions, user conversations
- Writer: Triage Bot is the SOLE writer to memory
- Twin can also write Truth + Context summaries via Triage Bot
- Read access: per tenant OAuth only
- Grows daily — accumulated intelligence
- NO repeat loop
- **NEVER writes directly to the Spine** — only via HITL approval

### Critical Boundaries

| Property        | Flow A     | Flow B        | Flow C                |
| --------------- | ---------- | ------------- | --------------------- |
| Data type       | Structured | Unstructured  | AI-generated          |
| Destination     | Spine      | Context Store | Memory Store          |
| Repeat loop     | YES        | NO            | NO                    |
| Writes to Spine | Direct     | Linked        | NEVER (only via HITL) |
| Trust level     | Verified   | Contextual    | Requires approval     |

---

## 4. L1 — The Workspace (12 Domain Views)

Each domain view is schema-filtered and provides role-specific interfaces.

| #   | Domain              | Icon | Files | Views             | Entity Types | Notes                                                  |
| --- | ------------------- | ---- | ----- | ----------------- | ------------ | ------------------------------------------------------ |
| 1   | Account Success     | 💚   | 49    | 20 active         | 18           | Most feature-rich domain                               |
| 2   | BizOps              | ⚙️   | 27    | 7 + C-suite views | 14           | CEO/COO/CIO/Founder views                              |
| 3   | Finance             | 💰   | 20    | 7                 | 15           | Revenue, billing, forecasting                          |
| 4   | IT Admin            | 🔧   | 31    | 6                 | 12           | System management                                      |
| 5   | Marketing           | 📢   | 16    | 8                 | 14           | Campaigns, attribution                                 |
| 6   | Personal            | 👤   | 10    | 8                 | 7            | Waitlisted for launch (M1-6)                           |
| 7   | Procurement         | 📦   | 11    | 6                 | 11           | Vendor management                                      |
| 8   | Product Engineering | 💻   | 14    | 7                 | 16           | Roadmap, sprints, releases                             |
| 9   | RevOps              | 📈   | 8     | 8                 | 14           | Most analytically sophisticated                        |
| 10  | SalesOps            | 🎯   | 5     | 8                 | 14           | Pipeline, forecasting                                  |
| 11  | Service             | 🎧   | 11    | 6                 | 12           | Support, SLA, escalation                               |
| 12  | Student-Teacher     | 🎓   | —     | —                 | —            | Shell only (0 bytes, dashboard wired, not in DomainId) |

### Source Locations

- Domain implementations: `apps/web/src/components/l1/domains/`
- Domain type configs: `apps/web/src/components/l1/domains/domain-types.ts`
- Schema definitions: `packages/types/src/schema.ts` (DOMAIN_SPINE_CONFIG)

---

## 5. L2 — The Cognitive Layer (14 Components)

Accessible via `Cmd+J`. Two overlay implementations exist in the codebase:

| #   | Component                 | Purpose                                       |
| --- | ------------------------- | --------------------------------------------- |
| 1   | SpineUI                   | View and interact with Spine data             |
| 2   | ContextUI                 | Browse unstructured context                   |
| 3   | KnowledgeUI               | Access knowledge memory                       |
| 4   | Evidence Drawer           | Supporting evidence for signals               |
| 5   | Signals                   | AI-generated insights (from Think layer)      |
| 6   | Think (Active Situations) | Situation awareness, pattern detection        |
| 7   | Act                       | Agent execution (Twin lives here)             |
| 8   | HITL / Approvals          | Human-in-the-loop approval queue              |
| 9   | Govern                    | Governance rules and boundaries               |
| 10  | Adjust                    | Configuration and tuning                      |
| 11  | Repeat                    | Loop monitoring and status                    |
| 12  | Audit Trail (LayerAudit)  | Full audit log of all actions                 |
| 13  | Agent Config              | Configure agent behaviors                     |
| 14  | Digital Twin              | Personal AI agent with read-only Spine access |

### Important Notes

- Signals are AI Insights generated in the Think layer — NOT raw events from connectors
- Agents (including Twin) live ONLY in Act, not in truth formation
- Twin has READ-ONLY access to Spine; can only write via HITL approval
- Two overlay implementations exist: `intelligence-overlay-new.tsx` (bottom-sheet) and `cognitive/CognitiveLayer.tsx` (sliding panel, 13 tabs)

---

## 6. The Schema System

The schema system is IntegrateWise's real moat — runtime composability per tenant.

### How It Works

```
getSpineConfig(industry, department) → unique schema per tenant
```

- 12 domain schemas × 11 industry overlays = combinatorial configuration
- Schema controls EVERYTHING downstream: loader extraction, normalizer filtering, L1 views, L2 cognitive scope

### 11 Industry Overlays

SaaS, Healthcare, Manufacturing, Automotive, Retail, Financial Services, Logistics, Media & Entertainment, Public Sector, Education, Professional Services

### Authoritative Sources

| File                                               | Lines | Content                                            |
| -------------------------------------------------- | ----- | -------------------------------------------------- |
| `packages/types/src/schema.ts`                     | 2113  | `DOMAIN_SPINE_CONFIG` — 12 domains (authoritative) |
| `packages/types/src/adaptive-schema.ts`            | —     | 10 domains (DRIFT — missing 2)                     |
| `sql-migrations/050_adaptive_spine_12_domains.sql` | 1130  | Database schema for all 12 domains                 |

### Known Drift

- `adaptive-schema.ts` only defines 10 of 12 domains (missing Procurement and Student-Teacher)
- `domain-types.ts` spineProjection — resolved, useHydrateProjection routes correctly

---

## 7. Entity 360 — Convergence Point

Entity 360 is where all three data flows converge:

```
Flow A (Structured Truth)     ──┐
Flow B (Unstructured Context) ──┼──→ Entity 360
Flow C (AI Knowledge/Memory)  ──┘
                                       ↓
                                 Twin activates here
                                 (READ-ONLY access to Spine)
```

- Entity 360 requires cross-source data to be meaningful
- You CANNOT "connect one system and see Entity 360" — this was a doc error
- Twin can only write to Spine via HITL approval from this context

---

## 8. The Cognitive Loop

```
Think → Act → Govern → Repeat → Adjust
  ↑                                 │
  └─────────────────────────────────┘
```

| Stage  | What Happens                                              |
| ------ | --------------------------------------------------------- |
| Think  | Pattern detection, signal generation, situation awareness |
| Act    | Agent execution — Twin and other agents live here         |
| Govern | Rule enforcement, trust boundaries, compliance checks     |
| Repeat | Loop execution on structured data (Flow A only)           |
| Adjust | System tuning, confidence calibration, feedback loops     |

### Critical: Where Agents Live

- Agents (including Twin) live ONLY in Act
- Agents do NOT participate in truth formation
- All agent outputs go through Govern before affecting the Spine

---

## 9. Connector Ecosystem

### Connector Types

| Type            | Description                         | Examples                                  |
| --------------- | ----------------------------------- | ----------------------------------------- |
| SaaS Connectors | Standard business tool integrations | Salesforce, HubSpot, Stripe, Zendesk      |
| MCP Connectors  | Model Context Protocol integrations | Knowledge base, Figma                     |
| Webhooks        | Event-driven integrations           | Custom event sources                      |
| Accelerators    | Pre-built domain packages           | Industry-specific starter configs         |
| AI Connectors   | AI service integrations             | ChatGPT, Claude, Gemini, Perplexity, Grok |

### Key Principles

- **"Every input is a connector"** — unified ingestion model
- **Auto-upgrade system**: child connectors inherit upgrades from parent connectors
- **Purchase decision entry point**: users check connector availability first
- **Only claim production-verified count**: 4-point verification (OAuth flow, creamy load, field mapping, delta sync)
- Connector count at launch: state only what passes verification (DO NOT claim "50+")

### Credential Storage

- Tokens ARE stored encrypted in `connector_credentials`
- Previous docs said "No credential storage" — this was FALSE and must be corrected
- Correct framing: "Credentials are encrypted at rest, scoped per tenant, with OAuth refresh rotation"

---

## 10. The Knowledge Memory

This is what makes IntegrateWise a "Knowledge Workspace":

- Accumulated intelligence that grows daily
- No retraining needed — context is always current
- Triage Bot is the sole writer to memory
- Per-tenant OAuth scoping for read access
- Twin reads verified memory, writes back summaries via Triage Bot

### Why It Matters

Traditional AI tools lose context between sessions. IntegrateWise's Knowledge Memory:

- Remembers every verified interaction
- Builds organizational knowledge over time
- Provides the Twin with historical context
- Never requires manual knowledge base maintenance

---

## 11. Trust & Governance

### The TruthLayer

TruthLayer is a **platform capability**, not a standalone product.

How it works:

1. AI generates output (entity extraction, recommendations, summaries)
2. Triage Bot processes: confidence scoring, conflict detection
3. Results go to Human Approval queue
4. Approved items become verified memory
5. Twin reads verified memory at Entity 360

### HITL (Human-in-the-Loop)

- Every AI action that affects the Spine requires human approval
- Three levels: auto-approve (high confidence), review (medium), block (low/conflict)
- Approval queue visible in L2 Cognitive Layer

### Trust Boundary

- Flow A and B write directly to their stores (Spine, Context Store)
- Flow C NEVER writes directly to Spine
- The boundary between AI-generated and verified data is absolute

---

## 12. 20 Products Across 3 Surfaces

### Surface 1: Account Success (8 Products)

**No Twin:**

- DataSentinel — Data quality monitoring
- VaultGuard — Compliance and audit
- ArchitectIQ — Solution architecture
- TemplateForge — Template management

**Basic Twin:**

- SuccessPilot — CS automation
- DealDesk — Deal management

**Full Twin + TruthLayer:**

- ChurnShield — Churn prediction and prevention
- SuccessCommand — Executive CS dashboard

### Surface 2: Business Ops (7 Products)

**No Twin:**

- ComplianceVault — Regulatory compliance
- VendorGuard — Vendor management
- PartnerBridge — Partner ecosystem

**Basic Twin:**

- GrowthDesk — Growth analytics
- HirePilot — Hiring automation

**Full Twin + TruthLayer:**

- FinPulse — Financial intelligence
- OpsCore — Operations command center

### Surface 3: Personal Space (5 Products)

**WAITLISTED for M1-6 launch. CTA: "Join the Waitlist"**

**No Twin:**

- WealthPilot — Personal finance
- WellnessCore — Health and wellness

**Basic Twin:**

- LearningDesk — Learning management
- RelationshipMap — Professional network

**Full Twin + TruthLayer:**

- LifeOps — Personal operations hub

---

## 13. Founding Story

1. Nirmal was a CSM (Customer Success Manager)
2. Experienced the Human API problem firsthand — being the bridge between disconnected tools
3. Built the Spine (intelligent plumbing) which saved an $8M account
4. Multiple other proofs: support cases solved, unresolved issues resolved
5. Proposed organization-wide implementation
6. Superiors tried to grab the idea
7. Realized the opportunity was bigger — started exploring independently
8. Started as **Mule Nexus** in 2024, evolved into **IntegrateWise**
9. "Depth matters" — Depth Matrix stays as a concept

---

## 14. Go-To-Market (Current Phase)

### M1-3: Founder-Led Sales

| Element        | Value                               |
| -------------- | ----------------------------------- |
| CTA            | "Book a Demo" / "Join Early Access" |
| Model          | Founder-led sales (NOT self-serve)  |
| Personal Space | Waitlisted (not live)               |
| Pricing tiers  | Starter, Growth, Command            |

### What NOT to Say on the Website

- "Start Free" / "Start Free Trial" (not until M3-6)
- "No credit card required"
- "Connect in 2 minutes"
- "50+ integrations" (only claim verified count)
- Self-serve signup flow references

### CTA Progression

| Phase | CTA              | Model       |
| ----- | ---------------- | ----------- |
| M1-3  | Book a Demo      | Founder-led |
| M3-6  | Start Free Trial | Guided PLG  |
| M6+   | Start Free       | Full PLG    |

---

## 15. Architectural Review (9.2/10)

### Strengths

- **Schema-driven architecture** — real moat, runtime composability per tenant
- **Three-flow separation** with hard boundaries — clean data trust model
- **Trust/governance model** — Triage Bot + HITL + tenant OAuth
- **Continuous loop** via Flow A — the only flow with repeat
- **Knowledge memory accumulation** — commercial moat that grows daily

### Issues (Code-Level, Not Documentation)

| Issue                                   | Location                                               | Impact                                                              |
| --------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| spineProjection (resolved)              | `domain-types.ts`                                      | Resolved — useHydrateProjection routes correctly for all 12 domains |
| Schema duplication                      | `schema.ts` vs `adaptive-schema.ts`                    | 12 vs 10 domains                                                    |
| Two competing L2 overlays               | `intelligence-overlay-new.tsx` vs `CognitiveLayer.tsx` | UX inconsistency                                                    |
| Account Success disproportionately deep | 49 files vs 5-16 for others                            | Coverage gap                                                        |
| Student-Teacher shell empty             | 0 bytes, not registered in DomainId                    | Incomplete domain                                                   |

---

## 16. Documentation Rules — Public vs Internal

### What Public Docs SHOULD Cover

- The product story (Human API problem → Turning Point → Solution)
- The Workspace (what users see, role-based views, schema-driven)
- The Spine (intelligent plumbing, what it connects, adaptive, grows with you)
- The Cognitive Layer (overlay experience, not internals)
- Three Data Flows (at PRODUCT level, not architecture level)
- Knowledge Memory (accumulated intelligence, no retraining)
- Connectors (purchase decision page + auto-upgrade + types)
- Who It's For (founders, CS, sales, finance, product, analysts)
- Trust & governance (truth boundary, approval-driven, HITL)

### What Public Docs MUST NOT Expose

- 8-stage pipeline internals
- Normalizer stages (S1-S8, S7.5)
- Hydration buckets (B0-B7), "creamy load"
- Twin trigger engine mechanics (10 triggers, guardrails, scoring)
- Identity resolution internals
- Worker-level architecture (Cloudflare Workers, D1, KV, queues)
- Firebase SMB architecture
- Any backend processing details — the backend is infrastructure, NOT the product

### Errors in Previous Public Docs (All Fixed in Rewrite)

| Error                                       | Correction                                         |
| ------------------------------------------- | -------------------------------------------------- |
| Homepage tagline "System of Context"        | Use "Knowledge Workspace"                          |
| Hero CTA "Get Started"                      | "Book a Demo"                                      |
| Getting Started describes self-serve signup | Remove — no self-serve at launch                   |
| "Connect first system, see Entity 360"      | Entity 360 needs cross-source data                 |
| "50+ business systems"                      | Only claim production-verified count               |
| "No credential storage"                     | Tokens stored encrypted in `connector_credentials` |
| "Bi-directional sync"                       | Governed action execution                          |
| Custom Connector SDK referenced             | Doesn't exist                                      |
| Solutions: 5 role pages                     | Align to "Who It's For" framing                    |
| Technical pipeline details in public docs   | Move to internal                                   |

---

## 17. Writing Style

### Voice & Tone

- Authoritative but approachable
- Second-person ("you")
- Active voice
- Product-first, not tech-first
- No emojis in prose

### Page Structure

Every page must have:

```markdown
---
title: Page Title
slug: /section/page-slug
summary: One-sentence summary
audience: [public | internal | team]
status: [draft | review | published]
owner: nirmal
lastReviewed: 2026-04-09
publishEligible: true
tags: [relevant, tags]
---

# Page Title

Opening statement (1-2 sentences).

> Blockquote principle (where appropriate)

## Section Heading

Content...

## Next Steps

- [Link to next page](/section/next-page)
- [Link to related page](/section/related-page)
```

### Formatting Conventions

- ASCII diagrams for architecture (not images)
- Tables for comparisons
- VitePress containers (`::: tip`, `::: info`, `::: warning`) used sparingly
- Five Core Principles referenced throughout where appropriate

---

## 18. Sidebar Structure — Public Docs

```
The Story (3 pages)
├── Why Work Is Broken         /story/why-work-is-broken
├── The Turning Point          /story/the-turning-point
└── What Is IntegrateWise      /story/what-is-integratewise

The Workspace (4 pages)
├── How It Works               /workspace/how-it-works
├── Domain Views               /workspace/domain-views
├── Entity 360                 /workspace/entity-360
└── Day One Experience         /workspace/day-one

The Spine (5 pages)
├── What the Spine Is          /spine/what-the-spine-is
├── What It Connects           /spine/what-it-connects
├── Adaptive by Design         /spine/adaptive-by-design
├── Grows with You             /spine/grows-with-you
└── The Truth Boundary         /spine/truth-boundary

The Cognitive Layer (6 pages)
├── How the Overlay Works      /cognitive-layer/how-the-overlay-works
├── Spine, Context & Knowledge /cognitive-layer/spine-context-knowledge-ui
├── The Twin                   /cognitive-layer/the-twin
├── Signals & Think            /cognitive-layer/signals-and-think
├── Approval-Driven Execution  /cognitive-layer/approval-driven-execution
└── The Continuous Loop        /cognitive-layer/the-continuous-loop

Three Data Flows (3 pages)
├── Structured Truth           /data-flows/structured-truth
├── Unstructured Context       /data-flows/unstructured-context
└── AI Knowledge & Memory      /data-flows/ai-knowledge-memory

The Knowledge Memory (3 pages)
├── How Memory Works           /knowledge-memory/how-memory-works
├── Why Knowledge Workspace    /knowledge-memory/why-knowledge-workspace
└── No Retraining Needed       /knowledge-memory/no-retraining-needed

Connectors & Integrations (4 pages)
├── Overview                   /connectors/overview
├── How Connectors Work        /connectors/how-connectors-work
├── Auto-Upgrade               /connectors/auto-upgrade
└── Request a Connector        /connectors/request-a-connector

Who It's For (4 pages)
├── Founders & Leaders         /who-its-for/founders-and-leaders
├── Revenue & Customer Teams   /who-its-for/revenue-and-customer-teams
├── Operations & Finance       /who-its-for/operations-and-finance
└── Product & Engineering      /who-its-for/product-and-engineering

Reference (3 pages)
├── Glossary                   /reference/glossary
├── Depth Matrix               /reference/depth-matrix
└── FAQ                        /reference/faq
```

---

## 19. Known Issues (Code, Not Docs)

These are codebase issues identified during architectural review. They do NOT affect documentation content but should be tracked for engineering.

1. `spineProjection` — resolved, `useHydrateProjection` routes correctly for all 12 domains
2. **Schema duplication** — `schema.ts` (12 domains) vs `adaptive-schema.ts` (10 domains, missing Procurement + Student-Teacher)
3. **Two competing L2 overlay implementations** — `intelligence-overlay-new.tsx` (bottom-sheet) and `cognitive/CognitiveLayer.tsx` (sliding panel, 13 tabs)
4. **Account Success disproportionately deep** — 49 files, 20 views vs 5-16 files for other domains
5. **Student-Teacher domain shell empty** — 0 bytes, dashboard wired but not registered in DomainId enum

---

## 20. Key Source Files

### Product Content Sources

| File                                         | Purpose                                |
| -------------------------------------------- | -------------------------------------- |
| `docs/gtm/POSITIONING_FRAMEWORK.md`          | Approved positioning, always/never say |
| `docs/gtm/LAUNCH_PHASE_ADDENDUM.md`          | Launch overrides, CTA rules            |
| `docs/product/PRODUCT_CATALOG_20.md`         | 20 products across 3 surfaces          |
| `docs/product/PRODUCT_LAYERS_BY_ROLE.md`     | Role-based views                       |
| `docs/product/PLATFORM_FEATURES_COMPLETE.md` | Full feature inventory                 |

### Architecture Sources

| File                                                 | Purpose                              |
| ---------------------------------------------------- | ------------------------------------ |
| `packages/types/src/schema.ts`                       | 12 domain schemas (AUTHORITATIVE)    |
| `packages/types/src/adaptive-schema.ts`              | Adaptive schema (DRIFT — 10 domains) |
| `apps/web/src/components/l1/domains/`                | All 12 domain view implementations   |
| `apps/web/src/components/l2/`                        | All 14 L2 cognitive components       |
| `apps/web/src/components/l1/domains/domain-types.ts` | Domain configs                       |
| `sql-migrations/050_adaptive_spine_12_domains.sql`   | Database schema                      |

### VitePress Config

| File                        | Purpose                      |
| --------------------------- | ---------------------------- |
| `docs/.vitepress/config.ts` | Main VitePress configuration |
| `docs/internal/_sidebar.ts` | Internal docs sidebar        |
| `scripts/sync-docs.sh`      | Sync from live repo to docs  |

---

_End of Architecture Context. This document is the single source of truth for all documentation decisions._
