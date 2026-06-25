# IntegrateWise Product Family

> Three product families expressed through the User Workbench. Platform supports 12 domains.
> We market and sell three. The rest are ready if someone asks.

---

## Canonical Internal Doctrine Guardrail

- User Workbench = the projection-native customer/product shell.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- The Twin is a native Cloudflare surface (iw-agent-runtime), not a separate shell.
- When this doc uses public-facing language like "Workbench", interpret that internally as the User Workbench unless stated otherwise.
- Twin runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

---

## Product Philosophy

We sell three product families through the User Workbench: Account Success, Business Ops, and Personal. These are universal — they work for any industry, any size, any domain.

The platform has 12 department domains built in (Sales, Marketing, Finance, RevOps, etc.). They all work. They all have dashboards, views, and Spine-connected data. But we don't market them. They're platform capability — available when needed, not pushed.

---

## Product Family Map

```
IntegrateWise Platform
│
├── PRODUCTIZED (marketed, priced, sold)
│   ├── Account Success (Universal)
│   │   ├── Accounts Hub          — Daily operating view
│   │   ├── Intelligence Center   — Portfolio analytics
│   │   └── Strategic View        — Executive dashboard
│   │
│   ├── Business Ops (Universal)
│   │   ├── Ops Cockpit           — Daily operating view
│   │   ├── Executive Suite       — CEO / COO / CIO views
│   │   └── Cross-Functional Hub  — Multi-department visibility
│   │
│   └── Personal (Everyone)
│       ├── Dashboard             — Personal home
│       ├── Knowledge Hub         — Memories, Triage, Sessions, Topics, Search
│       ├── Tasks / Calendar / Notes / Docs / Bookmarks
│       └── Founder Today / Projects / Decisions
│
├── PLATFORM DOMAINS (functional, not marketed)
│   ├── Sales          — Pipeline, Deals, Contacts, Activities, Forecasting
│   ├── Marketing      — Campaigns, Attribution, Email Studio, Social, Blog, SEO
│   ├── RevOps         — Pipeline, Forecast, Quota, Cohort, Metrics
│   ├── Finance        — Revenue, Expenses, Invoices, Budget, Billing, Tax
│   ├── Product Eng    — Roadmap, Features, Bugs, Sprints, Releases
│   ├── Service        — SLA, Tickets, Customers, Knowledge, Satisfaction
│   ├── Procurement    — Renewals, Vendors, Orders, Contracts, Spend
│   ├── IT Admin       — Infrastructure, Security, Monitoring, Compliance
│   └── Education      — Courses, Assignments, Grades, At-Risk, Discussions
│
└── Shared Engine
    ├── Entity 360 API
    ├── Twin Trigger Engine
    ├── Identity Resolution
    ├── Govern Module
    ├── Connector Framework (70+ connectors)
    ├── Trust Layer
    └── Approval-Based Personal Memory
```

---

## Account Success — Universal Product

Account Success works for anyone who manages accounts, clients, customers, patients, students, tenants, or any entity they have a relationship with.

### Who uses it

| Industry         | "Account" means      | Connectors used                          | Twin trigger example                          |
| ---------------- | -------------------- | ---------------------------------------- | --------------------------------------------- |
| MuleSoft / iPaaS | Integration account  | Salesforce, Anypoint, Zendesk, Amplitude | "API usage dropped 42%, renewal in 45 days"   |
| SaaS B2B         | Customer account     | Salesforce, Zendesk, Stripe, Amplitude   | "Usage dropped 42%, renewal in 45 days"       |
| Financial        | Client portfolio     | Zoho CRM, Tally, Razorpay, WhatsApp      | "Client hasn't filed GST in 3 months"         |
| Hospitality      | Property / guest     | PMS, Booking.com, WhatsApp, Stripe       | "Guest satisfaction dropped, 3 complaints"    |
| Healthcare       | Patient relationship | Practo, WhatsApp, Google Calendar        | "Patient missed 2 follow-ups"                 |
| Education        | Student / parent     | ClassPlus, WhatsApp, Google Sheets       | "Student attendance dropped below 60%"        |
| Real Estate      | Tenant / buyer       | NoBroker, WhatsApp, Razorpay             | "Lease renewal in 30 days, 2 complaints open" |
| Retail / SMB     | Customer             | WhatsApp, Tally, Razorpay, Google Sheets | "Regular customer hasn't ordered in 30 days"  |
| Freelancer       | Client               | Gmail, Google Sheets, Razorpay, Calendar | "Invoice overdue 15 days, no response"        |
| Manufacturing    | Distributor / dealer | IndiaMART, Tally, WhatsApp, Sheets       | "Dealer order volume down 40% this month"     |
| Agency           | Client account       | HubSpot, Slack, Google Drive, Stripe     | "Campaign deliverable overdue, client silent" |

### User Workbench projections

**Accounts Hub** — Daily operating view

- Works for a CSM managing 80 SaaS accounts, a CA managing 50 clients, or a retail business owner managing 200 customers
- Account cards with health score, last activity, key metrics, open issues
- Morning briefing: "3 accounts need attention today" — auto-generated from Twin triggers
- Unified timeline across all connected tools
- One-click deep dive into Entity 360

**Intelligence Center** — Portfolio analytics

- Works for a CS Director, a CA firm partner, a hotel chain manager, or a school principal
- Health heatmap across all accounts
- Segment analysis (by industry, tier, geography, or custom)
- Team performance (if multi-user)
- Trigger feed: real-time stream of fired insights

**Strategic View** — Executive dashboard

- Works for VP CS, CEO, CFO, or any executive who needs portfolio-level visibility
- Revenue/value at risk
- Retention forecasting
- Board-ready metrics export
- Executive escalation pipeline

### Value by role

| Role                | Value delivered                                                  |
| ------------------- | ---------------------------------------------------------------- |
| Individual operator | 2.5+ hours/day saved on data gathering across tools              |
| Manager / leader    | Portfolio visibility without manual reporting                    |
| Executive           | Retention forecasting, revenue-at-risk visibility, board metrics |

---

## Business Ops — Universal Product

Business Ops works for anyone who runs a business or a function within a business — and needs cross-tool visibility without building dashboards.

### Who uses it

| Role / Industry     | What they see                                        | Connectors used                          |
| ------------------- | ---------------------------------------------------- | ---------------------------------------- |
| Founder (SaaS)      | MRR, pipeline, clients, burn, team health            | Stripe, HubSpot, Slack, GitHub, Linear   |
| Founder (SMB India) | Daily sales, payments, credit, deliveries            | WhatsApp, Tally, Razorpay, Google Sheets |
| CEO (scaling)       | ARR trajectory, key accounts, OKR progress           | Salesforce, Stripe, Notion, Slack        |
| COO                 | Process cycle times, bottlenecks, team utilization   | Jira, Slack, HubSpot, Zendesk            |
| CIO / CTO           | Integration health, data quality, system reliability | GitHub, PagerDuty, Datadog, Jira         |
| Freelancer          | Clients, invoices, deadlines, project status         | Gmail, Google Sheets, Razorpay, Calendar |
| Agency owner        | Client projects, team capacity, revenue per client   | Asana, Slack, Stripe, Google Drive       |

### User Workbench projections

**Ops Cockpit** — Daily operating view

- 6 KPI cards customized to your business type
- "What needs your attention" — AI signals section
- Active deals / clients / projects sorted by priority
- Works for a SaaS founder, a retail business owner, or a freelance consultant

**Executive Suite** — CEO / COO / CIO views

- Company-wide performance metrics
- Cross-functional signals (sales × product × support × ops)
- Strategic objectives with progress tracking
- Technology landscape and integration health

**Cross-Functional Hub** — Multi-department visibility

- BizOps users get cross-department access via prefixed views
- Sales pipeline + CS health + Support load + Product usage in one place
- No department switching needed — everything visible from one seat

---

## Platform Capabilities (Shared by both products)

### Entity 360 API

Single read surface assembling 6 layers in parallel: Truth + Context + Signals + Memory + Goals + Relationships. < 200ms assembly time. 60s edge cache.

### Twin Trigger Engine

10 triggers that evaluate Entity 360 data. Every insight answers: what happened, why it matters, what to do, what happens if you ignore it. Max 3 per entity per day. Evidence-backed. Governed.

### Identity Resolution

S7.5 cross-source duplicate detection + HITL merge/keep-separate/defer. Deterministic + probabilistic matching. Full audit trail.

### Approval-Based Personal Memory

Any AI reads verified knowledge. None write without approval. Triage → scoring → human gate → knowledge base. Hallucinations never enter the system.

### Connector Framework

70+ connectors built. India/UAE connectors included. OAuth setup, automatic field mapping, creamy/full/delta sync modes. New connectors in < 1 day using the framework.

### Trust Layer

Source attribution on every field. Confidence scoring (0-1). Evidence chains on every insight. Full audit trail. Govern gate on destructive actions.

---

## How the two products relate

```
                    Account Success              Business Ops
                    ───────────────              ────────────
Focus:              Relationship management      Operational visibility
Primary user:       Anyone managing accounts     Anyone running a business
View orientation:   Account-centric              Function-centric
Key metric:         Account health score         Business KPIs
AI focus:           Relationship risk signals    Operational bottleneck signals

                              ┌─────────────┐
                              │  Platform    │
                              │  Entity 360  │
                              │  Twin Engine │
                              │  Connectors  │
                              │  Trust Layer │
                              └─────────────┘
                              Shared by both
```

Account Success answers: "How are my accounts/clients/customers doing?"
Business Ops answers: "How is my business/function/team doing?"

Same Spine. Same Entity 360. Same Twin. Same connectors. Different lens.
