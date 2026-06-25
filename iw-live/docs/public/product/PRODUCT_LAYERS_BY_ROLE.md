# IntegrateWise — Product Layers by Role

> Three product families. Each is expressed through User Workbench projections targeting different buyers.
> Same platform. Same Entity 360. Same Twin. Different lens per role.

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

## How Product Layers Work

Each product family (Account Success, Business Ops, Personal) is expressed through multiple User Workbench projections designed for specific roles. When you sell to an organization, you're not selling one screen — you're selling a layered product where every role gets their own view of the same underlying data.

A CA firm buys Account Success. The senior CA gets the Accounts Hub. The managing partner gets the Intelligence Center. The firm's founder gets the Strategic View. Same data, different lens, different value proposition per role.

---

## ACCOUNT SUCCESS — 7 Product Views

Universal relationship management. Sold to any industry where accounts/clients/customers are managed.

### Layer 1: Accounts Hub (Individual Contributor)

**Buyer:** CSM, Account Manager, CA, Relationship Manager, Property Manager, Freelancer
**Job:** Manage 10–200 accounts without drowning in tabs
**What they see:**

- Account cards with health score, key metric, last activity, open issues
- Morning briefing: "3 accounts need attention today"
- Unified timeline across all connected tools
- One-click Entity 360 deep dive
- Task queue with prioritized actions from Twin triggers

**Value metric:** Hours saved per day on data gathering (target: 2.5+)

| Industry    | Role using this       | Key metric shown                                  |
| ----------- | --------------------- | ------------------------------------------------- |
| SaaS        | CSM                   | ARR, renewal date, usage trend                    |
| Financial   | CA / Accountant       | Pending filings, invoice status, compliance       |
| Hospitality | Property Manager      | Guest satisfaction, bookings, complaints          |
| Education   | Teacher / Coordinator | Attendance, grades, parent engagement             |
| Retail      | Business Owner        | Orders, credit outstanding, WhatsApp activity     |
| Agency      | Account Director      | Project status, deliverables, client satisfaction |
| Healthcare  | Clinic Manager        | Patient visits, follow-ups, satisfaction          |
| Real Estate | Property Manager      | Lease status, payments, maintenance requests      |
| Freelancer  | Self                  | Active clients, invoices, hours, deadlines        |

### Layer 2: Intelligence Center (Manager / Director)

**Buyer:** CS Director, Managing Partner, Regional Manager, Department Head
**Job:** Portfolio visibility across all accounts without manual reporting
**What they see:**

- 6 KPIs: avg health, total value, at-risk value, upcoming renewals, open risks, AI signals
- Health heatmap: all accounts on a grid, colored by health, sized by value
- Segment analysis: compare health trends across any dimension
- Team performance: response time, save rate, expansion influence
- Trigger feed: real-time stream of fired insights across the portfolio
- Renewal calendar with health overlay

**Value metric:** Churn prediction accuracy improvement (target: 2x)

### Layer 3: Strategic View (Executive / Board)

**Buyer:** VP, C-suite, Board member, Firm Owner
**Job:** Retention forecasting, revenue-at-risk visibility, board-ready metrics
**What they see:**

- Big 4: total value, retention %, avg health, value renewing in 90d
- Value by segment/industry breakdown
- Initiative portfolio: active / blocked / total
- At-risk accounts with dollar/value weighting
- Board-ready export (PDF/PPT)

**Value metric:** Retention improvement (target: 3–5 points)

### Layer 4: Account Master (Data / Operations)

**Buyer:** Operations lead, Data analyst, Admin
**Job:** Full entity data view with all fields, sources, and audit trail
**What they see:**

- Complete account record with every field from every source
- Source attribution per field
- Edit history and audit trail
- Linked entities (contacts, deals, tickets)

### Layer 5: Entity 360 (Deep Dive — Any Role)

**Buyer:** Anyone who needs the full picture of one entity
**Job:** Assembled view of a single account/client across all 6 layers
**What they see:**

- Truth (Spine data), Context (emails, docs, meetings), Signals (active alerts)
- Memory (AI-verified knowledge), Goals (linked objectives), Relationships (entity graph)
- Twin Insight panel with evidence chain and confidence scoring

### Layer 6: Knowledge Hub (Knowledge Worker)

**Buyer:** Anyone managing AI-generated knowledge
**Job:** Review, approve, and manage the verified knowledge base
**What they see:**

- Memories: approved AI knowledge with type, confidence, source
- Triage Inbox: pending AI content awaiting approval
- Sessions: AI conversation history
- Topics: knowledge organized by topic
- Search: full-text search across all knowledge

### Layer 7: Duplicate Resolution (Data Quality)

**Buyer:** Operations lead, Data admin
**Job:** Review and resolve cross-source entity duplicates
**What they see:**

- Side-by-side entity comparison
- Confidence score and matched fields
- Merge / Keep Separate / Defer actions
- Stats: pending, merged, rejected, deferred

---

## BUSINESS OPS — 7 Product Views

Universal operational visibility. Sold to anyone running a business or a function.

### Layer 1: Ops Cockpit (Founder / Operator)

**Buyer:** Founder, CEO of early-stage company, Solo operator
**Job:** Single dashboard for the entire business
**What they see:**

- 6 mini KPIs customized to business type
- "What needs your attention" — AI signals section
- Active deals/clients/projects sorted by value
- Account/client health sorted by worst first

**Value metric:** Decision speed improvement, blind spots eliminated

| Business type   | KPIs shown                                            |
| --------------- | ----------------------------------------------------- |
| SaaS startup    | MRR, pipeline, clients, burn, team health, AI signals |
| Retail business | Daily sales, payments, credit outstanding, deliveries |
| Agency          | Client projects, team capacity, revenue per client    |
| Freelancer      | Active clients, invoices due, hours logged, deadlines |
| Manufacturing   | Orders, inventory, dealer performance, collections    |

### Layer 2: CEO View (Scaling Company)

**Buyer:** CEO of 50–500 person company
**Job:** Revenue trajectory, key account health, board readiness
**What they see:**

- Big 4: revenue, pipeline, customers, OKR progress
- Critical signals section
- Strategic objectives with progress bars
- Twin insight: "Top 3 accounts by value show declining engagement"

### Layer 3: COO View (Operations)

**Buyer:** COO, Head of Operations, VP Ops
**Job:** Operational efficiency across all functions
**What they see:**

- 6 ops KPIs: active workflows, initiatives, KPIs tracked, ops metrics, tasks done, ops signals
- Cross-department initiatives with status badges
- KPI tracker with progress bars
- Twin insight: "Onboarding time increased 22% — bottleneck is setup stage"

### Layer 4: CIO/CTO View (Technology)

**Buyer:** CIO, CTO, Head of Engineering, VP Technology
**Job:** Integration health, data quality, system reliability
**What they see:**

- 4 tech KPIs: integrations, active incidents, tech metrics, tech signals
- Integration landscape table: workflow name, status, execution count
- Technology signals and metrics
- Twin insight: "CRM connector has 12% field mapping failures"

### Layer 5: Strategic Hub (Cross-Functional)

**Buyer:** COO, VP Strategy, BizOps lead
**Job:** Cross-functional visibility without switching departments
**What they see:**

- Sales pipeline × CS health × Support load × Product usage in one view
- Cross-department access via prefixed routes (sales--pipeline, cs--accounts, etc.)
- No department switching needed

### Layer 6: Ops Command Center (Operations)

**Buyer:** Operations Manager, Process Owner
**Job:** Workflow monitoring and bottleneck detection
**What they see:**

- Active workflows with status
- Bottleneck detection
- Process cycle times
- Team utilization

### Layer 7: Metrics & Analytics (Data-Driven)

**Buyer:** Analyst, RevOps, Finance
**Job:** Cross-functional metrics and reporting
**What they see:**

- Customizable metrics dashboard
- CRM view, Sales Hub, Clients view
- Analytics with Spine-connected data

---

## PERSONAL — 5 Product Views

Private workspace for everyone. Not role-specific — everyone gets the same Personal space.

### Layer 1: Personal Dashboard

**What:** Home screen with personal KPIs, recent activity, quick actions

### Layer 2: Knowledge Hub

**What:** Memories, Triage Inbox, Sessions, Topics, Search — the personal knowledge base

### Layer 3: Tasks & Calendar

**What:** Personal task management and calendar integration

### Layer 4: Notes & Docs

**What:** Personal notes, document storage, bookmarks

### Layer 5: Founder Today / Projects / Decisions

**What:** Daily briefing, project tracking, decision journal — for founders and operators who use Personal as their primary workspace

---

## SELLING BY ROLE

When you demo to an organization, you show different layers to different people in the room:

| Who's in the room                         | Show them                             | Product         |
| ----------------------------------------- | ------------------------------------- | --------------- |
| Individual contributor (CSM, CA, manager) | Accounts Hub + Entity 360             | Account Success |
| Team lead / Director                      | Intelligence Center                   | Account Success |
| VP / C-suite                              | Strategic View                        | Account Success |
| Founder / CEO                             | Ops Cockpit + CEO View                | Business Ops    |
| COO / Operations                          | COO View + Ops Command Center         | Business Ops    |
| CIO / CTO                                 | CIO/CTO View                          | Business Ops    |
| Data / Operations lead                    | Account Master + Duplicate Resolution | Account Success |
| Knowledge worker                          | Knowledge Hub                         | Personal        |
| Everyone                                  | Personal Dashboard                    | Personal        |

**One platform. Three products. 19 role-based views. Every person in the org has their own lens.**

---

## PLATFORM DOMAINS (Not Marketed, Ready If Asked)

If a buyer says "can my sales team use this?" or "do you have a finance view?" — the answer is yes. These domains exist, they work, they have Spine-connected dashboards and sub-views. They're just not on the website or pricing page.

| Domain              | Views available                                                               |
| ------------------- | ----------------------------------------------------------------------------- |
| Sales               | Dashboard, Pipeline Kanban, Deals, Contacts, Activities, Sequences, Analytics |
| Marketing           | Dashboard, Campaigns, Attribution, Email Studio, Social, Blog, SEO, Forms     |
| RevOps              | Dashboard, Pipeline, Forecast, Quota, Analytics, Cohort, Team, Metrics        |
| Finance             | Dashboard, Revenue, Expenses, Invoices, Budget, Billing, Tax, Payroll         |
| Product Engineering | Dashboard, Roadmap, Features, Bugs, Sprints, Releases, Analytics              |
| Service             | Dashboard, SLA, Tickets, Customers, Knowledge, Satisfaction                   |
| Procurement         | Dashboard, Renewals, Vendors, Orders, Contracts, Spend                        |
| IT Admin            | Dashboard, Infrastructure, Security, Monitoring, Compliance, 20+ views        |
| Education           | Dashboard, At-Risk, Courses, Assignments, Grades, Discussions                 |
