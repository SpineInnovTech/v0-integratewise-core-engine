# IntegrateWise: Full Product Delivery Architecture

## The Core Insight

Users don't buy "L1" or "L2." They buy **outcomes**.
The product must feel like ONE unified workspace where intelligence emerges naturally from work — not two separate products glued together.

---

## Product Layers (User-Facing, Not Code-Facing)

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED SHELL                             │
│  (Login → Onboarding → Command Center / Today View)         │
│                    Always-On Twin (⌘K)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   WORKBENCH     │    │      COGNITIVE OVERLAY          │ │
│  │   (L1 Surface)  │◄──►│      (L2 Surface)               │ │
│  │                 │    │                                 │ │
│  │ • Domain Views  │    │ • Spine Health   • Memory       │ │
│  │ • Entity Cards  │    │ • Signals Feed   • Think Queue  │ │
│  │ • Metrics/KPIs  │    │ • Trust Score    • Insights     │ │
│  │ • Kanban/Timeline│   │ • Recommendations• Governance   │ │
│  │ • Action Bar    │    │ • Predictions    • Decisions    │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│           ▲                          ▲                      │
│           └──────────┬───────────────┘                      │
│                      │                                      │
│              PROJECTION ENGINE                             │
│         (useProjection() — RBAC-filtered,                 │
│          schema-governed, tenant-scoped)                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    CONNECTOR LAYER                          │
│     Goals/OKRs ←──→ Metrics/KPIs ←──→ Tools ←──→ Product  │
├─────────────────────────────────────────────────────────────┤
│                     THE SPINE (SSOT)                        │
│   (Cloudflare D1 + KV + R2 + Vectorize + AI Search + DO)    │
└─────────────────────────────────────────────────────────────┘
```

---

## How the User Experiences It

### 1. Entry: Contextual Landing

User logs in → lands on **Today View** (not a generic dashboard).

| Role      | Lands On           | Sees First                                               |
| --------- | ------------------ | -------------------------------------------------------- |
| CSM       | CS Today           | At-risk accounts, renewals this week, pending approvals  |
| TAM       | TAM Today          | Platform alerts, integration sync failures, SLA breaches |
| Sales Rep | Sales Today        | Open deals, pipeline gaps, follow-up reminders           |
| BizOps    | Ops Command Center | Cross-domain health, workflow status, anomalies          |
| Founder   | Strategic Hub      | All-domain KPI strip, initiative health, cash burn       |

**Key principle:** No user ever lands on "a dashboard." They land on **their work context**.

### 2. Persistent Twin (Always-On AI)

- Position: Right sidebar, collapsible
- Context: Scoped to current domain + entity + user role
- Capabilities: Ask, Act, Analyze, Draft, Navigate
- Memory: Work conversations (domain-scoped) + Personal (user-scoped)

### 3. L2 Drawer (⌘J) — Intelligence On Demand

- Bottom sheet, toggled via keyboard
- 5 tabs: Spine Health | Signals | Think | Trust | Memory
- Content adapts to: current domain, selected entity, user role
- NOT a separate product — it's "thinking about my current work"

### 4. Workbench → The Work Surface

- Domain-specific workbench (CS, Sales, BizOps, etc.)
- Tabs: **Work** (my scope) | **Org** (cross-team rollup) | **Personal** (my space)
- Connector layer visible: Goals, Metrics, Tools, Product

### 5. Cross-Domain Navigation (BizOps / Founder)

- BizOps sees all departments via prefixed routes (`sales--pipeline`, `cs--accounts`)
- Founder sees strategic rollup across all domains
- Navigation groups: Ops Core | Utilities | [Department 1] | [Department 2] | ... | Happy Path | Admin

---

## Account Success + TAM: The Two-Lens Model

```
┌─────────────────────────────────────────────────────────────┐
│              CUSTOMER SUCCESS DOMAIN                         │
├─────────────────────────────┬───────────────────────────────┤
│      ACCOUNT SUCCESS         │      TAM (TECHNICAL)          │
│      (Commercial Lens)       │      (Technical Lens)         │
├─────────────────────────────┼───────────────────────────────┤
│ • Renewals & Expansion       │ • Platform Health             │
│ • Health Scores (business)   │ • API Portfolio               │
│ • NPS & Sentiment            │ • Integration Sync Health     │
│ • Engagement Timeline        │ • SLA Compliance              │
│ • Success Plans              │ • Capability Maturity         │
│ • Risk Register (commercial) │ • Risk Register (technical)   │
│ • ARR/ACV Tracking           │ • Usage Adoption              │
│ • QBRs & Exec Sponsors       │ • Environment Health          │
├─────────────────────────────┼───────────────────────────────┤
│ Metrics: ARR, Health, NPS    │ Metrics: Uptime, Latency,     │
│          Renewals, Churn     │          Error Rate, MTTR     │
├─────────────────────────────┼───────────────────────────────┤
│ Entities: account_master,    │ Entities: platform_health,    │
│   engagement_log, risk,      │   api_portfolio, capability,  │
│   success_plan, task_item    │   technical_asset, value_stream│
├─────────────────────────────┼───────────────────────────────┤
│ Think Lens: "account_success"│ Think Lens: "tam"             │
├─────────────────────────────┼───────────────────────────────┤
│ CSM Persona                  │ TAM / Solutions Architect     │
│ VP Customer Success          │ VP Engineering / CTO          │
└─────────────────────────────┴───────────────────────────────┘
```

### Shared Surface

Both lenses share:

- **Account Context** — same account, different facets
- **Timeline** — engagements (commercial) + incidents (technical) merged
- **Twin** — "Tell me about Acme Corp" → returns both commercial + technical summary
- **Governance Queue** — same approval pipeline

### Navigation in CS Domain

```
Customer Success
├── Account Success (commercial)
│   ├── Today
│   ├── Accounts Hub
│   ├── Renewals
│   ├── Health Scores
│   ├── Success Plans
│   ├── Engagements
│   └── Risks
├── Technical Account Management
│   ├── TAM Today
│   ├── Platform Health
│   ├── API Portfolio
│   ├── Integrations
│   ├── Usage Adoption
│   └── Capabilities
└── Shared
    ├── Intelligence Center
    ├── Strategic Account View
    └── Company Growth
```

---

## How to Deliver the Full Product

### Option A: Role-Based Entry (Recommended)

```
User signs up → Selects role → Lands on role-specific Today view
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    CSM View    TAM View    Founder View
   (cs-today)  (tam-today) (strategic-hub)
```

**Pros:** Immediate relevance, no overwhelm
**Cons:** Users with multiple hats need switching

### Option B: Domain-First Entry

```
User signs up → Picks primary domain → Sees domain workbench
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
      Customer Success      Business Operations
              │
      ┌───────┴───────┐
      ▼               ▼
Account Success   TAM
```

### Option C: Unified Command Center (BizOps / Founder Only)

```
Founder/BizOps user → Lands on Ops Command Center
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Health Rings    Cross-Domain    Action Queue
                        Signals
```

---

## Recommended Delivery: Hybrid Model

```
┌─────────────────────────────────────────────────────────────┐
│  SIGNUP / ONBOARDING                                        │
│  • Company profile                                          │
│  • Invite team                                              │
│  • Pick primary domain (can change later)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  TODAY VIEW (Personalized Entry)                            │
│  • Role-scoped KPI strip                                    │
│  • Pending actions (HITL queue)                             │
│  • AI insights for YOUR scope                               │
│  • Quick nav to all domains you have access to              │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│   WORKBENCH     │ │  L2 DRAWER  │ │  TWIN SIDEBAR   │
│   (Your Work)   │ │  (⌘J Intel) │ │  (Ask/Act/Do)   │
│                 │ │             │ │                 │
│ Domain-specific │ │ • Signals   │ │ Domain-aware    │
│ Entity views    │ │ • Think     │ │ chat with       │
│ Metrics/KPIs    │ │ • Memory    │ │ memory          │
│ Action surfaces │ │ • Trust     │ │                 │
└─────────────────┘ └─────────────┘ └─────────────────┘
              │             │             │
              └─────────────┴─────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────┐   ┌───────────────────────────┐
│  CROSS-DOMAIN ACCESS  │   │  CONNECTOR LAYER          │
│  (BizOps / Founder)   │   │  Goals · Metrics · Tools  │
│                       │   │  · Product                │
│ Prefix routes:        │   │                           │
│ sales--pipeline       │   │ Links work to outcomes    │
│ cs--accounts          │   │ and tools                 │
│ finance--forecast     │   │                           │
└───────────────────────┘   └───────────────────────────┘
```

---

## Account Success + TAM: Recommended UI

In the CS domain, present **two primary tabs** at the workbench level:

```
┌─────────────────────────────────────────────────────────────┐
│  Customer Success Workbench                                 │
│                                                             │
│  [ Account Success ] [ TAM ] [ Org ] [ Personal ]          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  When Account Success is active:                     │   │
│  │  • KPIs: ARR, Health, Renewals, NPS, Expansion      │   │
│  │  • Entities: Accounts, Engagements, Success Plans   │   │
│  │  • Think lens: "account_success"                    │   │
│  │  • Twin context: "You are helping a CSM..."         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  When TAM is active:                                 │   │
│  │  • KPIs: Uptime, SLA%, API Health, Latency, Errors  │   │
│  │  • Entities: Platform Health, APIs, Integrations    │   │
│  │  • Think lens: "tam"                                │   │
│  │  • Twin context: "You are helping a TAM..."         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Shared: Connector Layer (Goals, Metrics, Tools, Product)   │
│  Shared: L2 Drawer adapts to active lens                    │
│  Shared: Twin remembers both contexts                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Path

1. **Workbench Tabs** — Add lens selector to `CSWorkbench` (Account Success | TAM)
2. **Projection Filter** — `useProjection()` accepts optional `lens` param
3. **Think Routing** — Already routes to `account_success` vs `tam` lens
4. **Navigation** — Add TAM section to CS `workspace-config.ts`
5. **Content Router** — Map `tam-*` routes in account-success domain
6. **Entity Types** — TAM workbench tracks technical entities
7. **Metrics** — TAM metrics surfaced in connector layer
