# IntegrateWise — Per User View

**v1.0 · May 28, 2026**  
**Author:** Nirmal, Founder  
**Status:** LOCKED — Complete user experience definition  
**Scope:** Product, design, engineering, sales. What one user sees across all surfaces.

---

> One user. One Spine. Four layers. Three workspaces.  
> The loop closes automatically. The user never reports back.

---

## The Four Layers

Every user interacts with IntegrateWise across four layers. Each layer has a distinct role.

```
L1 — PROJECTION LAYER     (Intelligence Workspace — app.integratewise.ai)
     What the system knows. Read-only projection of the Spine.
     The user reads, decides, approves.

L2 — COGNITIVE LAYER      (Inside Intelligence Workspace — ⌘K / ⌘J)
     The Twin. AI reasoning over full Spine context.
     Surfaces insights, proposes actions, answers questions.

L3 — EXECUTION LAYER      (Execution Workspace — ops.integratewise.ai)
     Where the user acts. Connected to their tools.
     Playbook, KPIs, workflows, execution log.

L4 — KNOWLEDGE LAYER      (Knowledge Workspace — knowledge.integratewise.ai)
     Where the org remembers. Governed institutional knowledge.
     Personal + Org + Conversational memory. Triage Bot.
```

---

## L1 — Projection Layer (Intelligence Workspace)

**What the system knows about their world. They read and decide.**

The L1 layer is the projection surface. It reads from the Spine and renders the canonical truth through a role-specific lens. Every domain has its own set of views. The user never sees raw data — they see projections.

```
┌─────────────────────────────────────────────────────────────────┐
│  INTELLIGENCE WORKSPACE  (L1 Projection Layer)                  │
│                                                                 │
│  MY DESK (default — cross-domain)                               │
│  ├── 🔴 Fires: 3 things needing attention today                 │
│  ├── 📋 Proposals: 5 awaiting my approval                       │
│  ├── 📅 Meetings: 2 today (with pre-read context)               │
│  └── ⏰ Commitments: 1 due Friday                               │
│                                                                 │
│  DOMAIN VIEWS (role-specific — 12 domains)                      │
│                                                                 │
│  Account Success (CS Lead)                                      │
│  ├── Dashboard — health, ARR, renewals, at-risk                 │
│  ├── Account Master — 40+ fields per account                    │
│  ├── Account Health — health distribution, declining trends     │
│  ├── CSM Hub — my accounts, my tasks, my signals                │
│  ├── Risk Register — risks by level, mitigation tracking        │
│  ├── Success Plans — plan status, linked objectives             │
│  ├── Initiatives — investment, benefit, payback                 │
│  ├── Engagement Log — sentiment, relationship depth             │
│  ├── Strategic Objectives — progress, health indicator          │
│  ├── Capabilities — maturity gaps, investment required          │
│  ├── Value Streams — transaction volumes, cycle times           │
│  ├── API Portfolio — SLA compliance, error rates, uptime        │
│  ├── Platform Health — current vs target, thresholds            │
│  ├── People & Team — ARR managed, at-risk concentration         │
│  ├── Business Context — digital maturity, IT complexity         │
│  ├── Stakeholder Outcomes — baseline/current/target             │
│  ├── Tasks — linked to risks, initiatives, objectives           │
│  ├── Generated Insights — AI recommendations with links         │
│  └── ... (27 views total)                                       │
│                                                                 │
│  Business Ops (Founder / COO)                                   │
│  ├── Dashboard — MRR, pipeline, clients, tasks, signals         │
│  ├── Strategic Hub — OKRs, values, strategy, ROI map            │
│  ├── Metrics Dashboard — 7 key metrics, trend charts            │
│  ├── Analytics & Reports — ARR, health, API volume              │
│  ├── CRM — leads, contacts, pipeline value                      │
│  ├── Sales Hub — deals, win rate, avg deal size                 │
│  ├── Clients — ARR, health, at-risk count                       │
│  ├── Accounts — grid/list/kanban, tier, region                  │
│  ├── Tasks — total, overdue, due today, completed               │
│  ├── Documents — type, source, access level                     │
│  ├── Workflows — active count, runs 24h, success rate           │
│  ├── Calendar — week/day/upcoming views                         │
│  ├── Integration Hub — 20 connectors, live status               │
│  └── Ops Command Center — cross-functional metrics + signals    │
│                                                                 │
│  + 10 more domains: Sales, Marketing, RevOps, Finance,          │
│    Product/Eng, Service, Procurement, IT Admin,                 │
│    Student/Teacher, Personal                                    │
│                                                                 │
│  SHARED VIEWS (cross-domain)                                    │
│  ├── Entity 360 — full entity view from any domain              │
│  ├── Entity Browser — search/browse all entity types            │
│  ├── Duplicate Resolution — merge candidates, HITL              │
│  ├── Knowledge Hub — personal knowledge base                    │
│  ├── Org Memory View — approved institutional knowledge         │
│  ├── Personal Memory View — private, user-scoped                │
│  ├── Conversational Memory — AI sessions, all models            │
│  └── Proposals View — standalone proposal queue                 │
│                                                                 │
│  GOVERNANCE OVERLAY (Shield icon — always accessible)           │
│  ├── Pending proposals from Twin                                │
│  ├── Approve / Reject / Defer                                   │
│  └── Execution status                                           │
└─────────────────────────────────────────────────────────────────┘
```

**L1 Layer Architecture:**

```
apps/web/src/components/l1/
├── domains/          ← 12 domain workbenches
│   ├── account-success/  ✅ 27 views (43 files)
│   ├── bizops/           ✅ 14 modules + 13 views (29 files)
│   ├── salesops/         🔄 Partial (2 files)
│   ├── revops/           🔄 Partial (4 files)
│   ├── finance/          🔄 Partial (5 files)
│   ├── marketing/        🔄 Partial (7 files)
│   ├── product-engineering/ 🔄 Partial (13 files)
│   ├── service/          🔄 Partial (9 files)
│   ├── it-admin/         🔄 Partial (2 files)
│   ├── procurement/      🔄 Partial (3 files)
│   ├── student-teacher/  🔄 Partial (3 files)
│   └── personal/         ✅ Complete (11 files)
│
├── views/            ← Shared cross-domain views
│   ├── Entity360View.tsx          ✅
│   ├── entity-browser.tsx         ✅
│   ├── duplicate-resolution-view.tsx ✅
│   ├── knowledge-hub.tsx          ✅
│   ├── org-memory-view.tsx        ❌ Missing
│   ├── personal-memory-view.tsx   ❌ Missing
│   ├── conversational-memory-view.tsx ❌ Missing
│   └── proposals-view.tsx         ❌ Missing
│
└── workspace/        ← Shell, content router, nav
    ├── workspace-shell-new.tsx    ✅ Complete
    └── content-router.tsx         ✅ Complete (all 12 domains wired)
```

---

## L2 — Cognitive Layer (Twin)

**AI that thinks in context. Waits for human approval.**

The L2 layer is the Twin — accessible via ⌘K (command palette) and ⌘J (cognitive drawer). It reads from the full Spine before every response. It proposes, never executes.

```
┌─────────────────────────────────────────────────────────────────┐
│  L2 COGNITIVE LAYER  (Twin — ⌘K / ⌘J)                          │
│                                                                 │
│  TWIN SIDEBAR (persistent, context-aware)                       │
│  ├── Reads Entity 360 for current entity                        │
│  ├── Reads org_memory for relevant context                      │
│  ├── Reads conversational_memory for session history            │
│  └── Proposes actions → governance overlay                      │
│                                                                 │
│  COMMAND PALETTE (⌘K)                                           │
│  ├── Search everything (entities, memory, docs)                 │
│  ├── Navigate to any view                                       │
│  └── Ask the Twin anything                                      │
│                                                                 │
│  COGNITIVE DRAWER (⌘J)                                          │
│  ├── Signals panel — live signals from SignalAnalyzer           │
│  ├── Decision memory — past decisions, patterns                 │
│  ├── Triage inbox — proposals awaiting review                   │
│  └── Trust insight — confidence scores, evidence chains         │
│                                                                 │
│  INSIGHT POPUPS (contextual, dismissible)                       │
│  ├── "This account is behaving differently than 30 days ago"    │
│  ├── "3 KB entries are stale — last accessed 47 days ago"       │
│  └── "HubSpot health dropped 12% — 3 tasks pending"            │
└─────────────────────────────────────────────────────────────────┘
```

---

## L3 — Execution Layer (User's AI — Execution Workspace)

⚠️ IntegrateWise does not provide this surface. It provides the handoff to the user's AI. The Execution Workspace (integratewise-ops / IW OS) is the user's own environment — Hermes, Claw, Agent Zero, n8n, or any agent they choose.

The L3 layer is the Execution Workspace. It receives the playbook from IntegrateWise and surfaces it alongside the tools the user needs to execute. Every department has its own execution workspace.

```
┌─────────────────────────────────────────────────────────────────┐
│  EXECUTION WORKSPACE  (L3 — CS Ops example)                     │
│                                                                 │
│  PLAYBOOK (from IntegrateWise — ordered by priority)            │
│  🔴 Escalate ACME-234 in Jira — SLA breached, 14 days          │
│  🟠 Schedule QBR with Acme CTO — renewal in 42 days            │
│  🟡 Send roadmap update — champion asking about features        │
│  Expected impact: Health 52→68, Risk HIGH→MEDIUM                │
│                                                                 │
│  CONNECTED TOOLS (live status)                                  │
│  [HubSpot ✅] [Jira ✅] [Slack ✅] [Calendar ✅] [Gainsight ⬜] │
│  Click → opens tool with pre-filled action context              │
│                                                                 │
│  KPIs (live from Spine — normalized from connected tools)       │
│  Avg Health: 72 ↓    Total ARR: $2.4M                          │
│  Renewals 60d: 8     At-risk: 3 critical, 5 high               │
│  Engagement: 64% ↓   NPS: 42                                   │
│                                                                 │
│  WORKFLOWS & AUTOMATIONS                                        │
│  [Active]  At-risk brief → daily 9AM → Slack #cs-alerts        │
│  [Active]  Renewal reminder → 90/60/30d → HubSpot task         │
│  [Active]  Ticket spike → P1 escalation → Jira + Slack         │
│  [Paused]  QBR prep → 7 days before → Notion doc               │
│  [Build new automation →]                                       │
│                                                                 │
│  ACTION QUEUE (proposals filtered by department)                │
│  🔴 CRITICAL  Escalate ACME-234 → Jira  [Execute] [Delegate]   │
│  🟠 HIGH      Schedule QBR Acme CTO → Calendar  [Execute]      │
│  🟡 MEDIUM    Send roadmap update → HubSpot  [Execute]          │
│                                                                 │
│  EXECUTION LOG (what was done — feeds back to Spine via MCP)    │
│  Today 14:32  Escalated ACME-234 → Jira (Nirmal)  ✅           │
│  Today 11:15  QBR scheduled June 3 → Calendar (Nirmal)  ✅     │
│  Yesterday    Roadmap email sent → HubSpot (Claw)  ✅           │
└─────────────────────────────────────────────────────────────────┘
```

**Per-department execution workspaces:**

| Department | Connected Tools                            | Key KPIs                                   |
| ---------- | ------------------------------------------ | ------------------------------------------ |
| CS         | HubSpot, Jira, Slack, Calendar             | Health score, ARR, renewals, NPS           |
| Sales      | Salesforce, LinkedIn, Outreach, DocuSign   | Pipeline, win rate, quota, cycle time      |
| Marketing  | HubSpot Marketing, LinkedIn Ads, Mailchimp | MQLs, CAC, campaign ROI, conversion        |
| Finance    | QuickBooks, Stripe, Razorpay               | MRR, burn rate, runway, AR aging           |
| Product    | Jira, GitHub, Linear, Figma                | Velocity, P0 bugs, cycle time, deploy freq |
| HR         | Greenhouse, BambooHR, Slack                | Open roles, time-to-fill, eNPS, attrition  |
| Legal      | DocuSign, Ironclad, Drive                  | Contracts expiring, compliance filings     |
| Knowledge  | Notion, GitHub, BrandDocumentations        | Doc coverage, approval queue, publish rate |

---

## L4 — Knowledge Layer (Knowledge Workspace)

**Where the org remembers. They govern and publish.**

The L4 layer is the Knowledge Workspace. It surfaces the three memory layers and provides the 5-board governance workbench for institutional knowledge.

```
┌─────────────────────────────────────────────────────────────────┐
│  KNOWLEDGE WORKSPACE  (L4 — Knowledge Layer)                    │
│                                                                 │
│  5-BOARD SWITCHER                                               │
│  [Governance] [Operations] [Content] [Public] [Internal]        │
│                                                                 │
│  GOVERNANCE BOARD (default)                                     │
│  ├── Strategy docs (39) — locked/drafted/in-progress           │
│  ├── Approval queue — 7 pending review                          │
│  ├── AI Governance docs — policies, constitutional laws         │
│  └── Approval workflows — who approves what                     │
│                                                                 │
│  OPERATIONS BOARD                                               │
│  ├── Runbooks — incident response, deployment, DR               │
│  ├── DevOps procedures — deploy, rollback, monitoring           │
│  └── Operational status — what's running, what's broken         │
│                                                                 │
│  CONTENT BOARD                                                  │
│  ├── GTM & Sales assets (8 docs)                                │
│  ├── Brand assets — logo, colors, fonts, stationery             │
│  └── Campaign tracker — active, paused, completed               │
│                                                                 │
│  PUBLIC DOCS BOARD                                              │
│  ├── Customer-facing docs (4) — product, API, guides            │
│  ├── Documentation library (8) — searchable, versioned          │
│  └── Publish pipeline — staging → approved → published          │
│                                                                 │
│  INTERNAL DOCS BOARD                                            │
│  ├── Engineering docs (7) — architecture, decisions             │
│  ├── AI & Cognition docs (11) — doctrine, governance            │
│  └── Org docs (8) — company strategy, founding                  │
│                                                                 │
│  MY MEMORY (three layers)                                       │
│  ├── Personal — my drafts, notes, preferences (private)         │
│  ├── Org — approved institutional knowledge (shared)            │
│  └── Conversational — AI sessions, Triage Bot exchanges         │
│                                                                 │
│  TRIAGE BOT (bottom — always visible)                           │
│  └── Submit content → Triage Bot scores → accept/reject/promote │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Complete Per-User View

```
ONE USER. ONE SPINE. FOUR LAYERS. THREE WORKSPACES.

L1 PROJECTION          L2 COGNITIVE           L3 EXECUTION           L4 KNOWLEDGE
─────────────          ────────────           ────────────           ────────────
Intelligence           Twin                   Execution              Knowledge
Workspace              (inside L1)            Workspace              Workspace

What system knows      AI reasoning           Where they act         What org remembers

My Desk                Twin Sidebar           Playbook               5 Boards
27 CS views            Command Palette        Connected tools        Memory layers
Entity 360             Cognitive Drawer       KPIs (live)            Triage Bot
Governance overlay     Insight popups         Workflows              Approval queue
Domain workbenches     Proposals              Execution log          Publish pipeline

READ + DECIDE          THINK + PROPOSE        ACT + LOG              REMEMBER + GOVERN
```

---

## The User Journey in One Day

```
8:30 AM  Opens Intelligence Workspace (L1)
         My Desk: 3 fires, 5 proposals, 2 meetings
         Reviews Acme Corp Entity 360 — sees risk signals
         Twin (L2) surfaces: "Acme at risk — 3 actions proposed"
         Approves 2 proposals in Governance Overlay

9:00 AM  Moves to Execution Workspace (L3)
         Playbook: escalate Jira, schedule QBR, send email
         Clicks HubSpot → pre-filled QBR invite → sends
         Clicks Jira → pre-filled escalation → submits
         Execution log records both actions

9:30 AM  MCP sync runs automatically
         Jira change detected → Spine updates
         Health score recalculates: 52 → 64
         Next playbook generated

10:00 AM Opens Knowledge Workspace (L4)
         Triage Bot: "Meeting with Acme — add to org memory?"
         Reviews → approves → enters org_memory
         Checks Governance Board — 2 docs need review

Next day  Intelligence Workspace (L1) shows updated picture
          Acme risk reduced. New playbook reflects what was done.
          The loop closed. Memory compounded.
```

---

## The Five Pillars — How Each Layer Delivers Them

| Pillar                   | L1                       | L2                  | L3                     | L4                |
| ------------------------ | ------------------------ | ------------------- | ---------------------- | ----------------- |
| 1. One Surface           | ✅ All tools in one view |                     | ✅ All tools connected |                   |
| 2. Memory                | ✅ Memory views          | ✅ Reads all memory |                        | ✅ Governs memory |
| 3. Operating Environment | ✅ Domain views          | ✅ Twin reasoning   | ✅ Execution context   |                   |
| 4. Governance & Control  | ✅ Governance overlay    | ✅ Proposals        | ✅ Approval queue      | ✅ 5 boards       |
| 5. Continuity            | ✅ Loop visible          | ✅ Session memory   | ✅ Execution log       | ✅ Org memory     |

---

## The One-Line Statement Per Layer

| Layer           | One Line                                                       |
| --------------- | -------------------------------------------------------------- |
| L1 — Projection | The system's view of your world. Read and decide.              |
| L2 — Cognitive  | AI that thinks in context. Proposes, never executes.           |
| L3 — Execution  | Where you act. Connected to your tools. The loop closes here.  |
| L4 — Knowledge  | Where the org remembers. Nothing enters without your approval. |

---

_Document: IntegrateWise Per User View v1.0_  
_Author: Nirmal, Founder_  
_Status: Locked. This is what one user sees across all surfaces._
