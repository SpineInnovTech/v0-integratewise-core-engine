# IntegrateWise — Complete Platform Features

> A Knowledge Workspace over the Spine, powered by AI.
> Everything the platform does, organized by layer.

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

## 1. THE SPINE (Single Source of Truth)

The Spine is the canonical data layer. Every entity from every connected tool lands here — normalized, deduplicated, and schema-routed.

### What it does

- **Schema-routed storage**: 150+ entity types across 12 departments, each routed to the correct schema table (e.g. `cs.account_master`, `sales.deal`, `finance.invoice`)
- **Tenant isolation**: Row-Level Security on Spine DB. Workspace A cannot see Workspace B. Ever.
- **Entity type routing**: Spine-v2 maps every inbound entity to its canonical table. `HubSpot companies` → `spine.account`. `Zendesk tickets` → `support.ticket`. 70+ connector aliases resolved automatically.
- **Adaptive schema**: Schema grows as new fields are observed from connected sources. No manual field mapping.
- **Audit trail**: Every write logged with source, timestamp, and trace ID.
- **12 department schemas**: Customer Success, Sales, Marketing, RevOps, Product Engineering, Finance, Support, Procurement, IT Admin, BizOps, Education, Personal — each with curated entity types and priority fields.
- **Industry overlays**: SaaS, Healthcare, Manufacturing, Automotive, Logistics, Retail, Financial Services, Media, Public Sector, Education — each adds industry-specific entity types on top of department schemas.

### Entity types by department

| Department          | Entity Types | Examples                                                                                                          |
| ------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Customer Success    | 16           | account_master, success_plan, risk_register, engagement_log, renewal, stakeholder_outcome, initiative, capability |
| Sales               | 12           | deal, opportunity, lead, pipeline_stage, quote, sales_sequence, call_log, competitor_intel                        |
| Marketing           | 12           | campaign, audience, landing_page, email_campaign, social_post, ab_test, attribution_touchpoint                    |
| RevOps              | 8            | quota, forecast, territory, comp_plan, revenue_metric, attribution, segment_rule                                  |
| Product Engineering | 10           | feature, bug, sprint, release, repository, pull_request, deployment, roadmap_item, feedback                       |
| Finance             | 12           | invoice, payment, expense, budget, revenue_entry, tax_filing, financial_report, vendor, cost_center               |
| Support             | 8            | ticket, csat, sla_policy, escalation, queue, agent_performance, knowledge_article                                 |
| IT Admin            | 12           | system, device, user, change_request, vulnerability, backup, certificate, network_device, license                 |
| BizOps              | 6            | activity, workflow, okr, cross_dept_initiative, ops_metric                                                        |
| Procurement         | 6            | purchase_order, spend_category, savings_initiative, approval_request, compliance_check                            |
| Education           | 8            | student, course, assignment, grade, attendance, discussion, learning_objective, intervention                      |
| Personal            | 4            | calendar_event, bookmark, daily_reflection, note                                                                  |

---

## 2. THE PIPELINE (8-Stage Normalizer)

Every record from every source passes through the same 8 stages. No shortcuts. No bypasses.

### The 8 stages

| Stage | Name                | What it does                                                               |
| ----- | ------------------- | -------------------------------------------------------------------------- |
| S1    | Analyze             | Detect entity type, resolve tenant schema, fingerprint data                |
| S2    | Classify            | Assign category, priority, sensitivity level                               |
| S3    | Filter              | Check entity type against tenant schema — reject if not allowed            |
| S4    | Refine              | Normalize field names, split composite fields, extract cross-reference IDs |
| S5    | Extract             | Map to canonical schema, keep only priority fields (schema-driven)         |
| S6    | Validate            | Required field checks, type validation, integrity rules                    |
| S7    | Sanity              | Anomaly detection, business rule validation (score must be ≥ 70 to pass)   |
| S7.5  | Identity Resolution | Detect potential cross-source duplicates (never auto-merge)                |
| S8    | Sectorize           | Route to correct Spine table, write canonical record, enqueue downstream   |

### Pipeline features

- **Retry with backoff**: Each stage retries 3 times with exponential backoff before sending to DLQ
- **Dead Letter Queue**: Failed messages preserved with full context (stage, error, payload, trace ID)
- **Idempotency**: Content-hash dedup keys prevent duplicate processing
- **Version tracking**: Each entity gets a monotonic version number for conflict resolution
- **Stage-level metrics**: Latency, throughput, and error rate tracked per stage
- **Schema-driven extraction**: S5 only extracts fields defined in the tenant's schema — no data leakage

---

## 3. ENTITY 360 (Unified Data Surface)

Entity 360 is the single API that assembles the complete picture of any entity. Twin reads ONLY from Entity 360 — never from scattered sources.

### 6 layers assembled in parallel

| Layer         | Source                          | What it contains                                                         |
| ------------- | ------------------------------- | ------------------------------------------------------------------------ |
| Truth         | Spine (Spine DB)                | Canonical entity data with freshness indicator (live/recent/stale)       |
| Context       | Knowledge service               | Emails, documents, meeting notes, conversation summaries (Flow B)        |
| Signals       | Signals table                   | Active alerts with severity, evidence chain, confidence score            |
| Memory        | Knowledge consolidated_memories | AI-extracted knowledge: decisions, preferences, insights, rules (Flow C) |
| Goals         | Goals table                     | Linked goals with progress, status, target dates, health scoring         |
| Relationships | Entities table                  | Parent/child/related entity graph (account → contacts, etc.)             |

### API

```
GET  /api/entity360/:id                    — single entity, all layers
POST /api/entity360                        — single with layer selection
POST /api/entity360/batch                  — multiple entities
GET  /api/v1/cognitive/twin/360/:id        — entity + twin trigger insights
```

### Features

- **Parallel fetch**: All 6 layers fetched simultaneously — assembly time < 200ms
- **Layer selection**: Request only the layers you need (e.g. just truth + signals)
- **KV cache**: 60-second TTL on Cloudflare KV for hot entities
- **Freshness scoring**: Truth layer tagged as "live" (< 1h), "recent" (< 24h), or "stale" (> 24h)
- **Source attribution**: Every data point traces back to its origin system
- **Progressive hydration**: Profile loads first, context and signals load async

---

## 4. TWIN TRIGGER ENGINE (AI Reasoning)

The Twin evaluates Entity 360 data against a set of triggers to produce constrained, evidence-backed insights.

### 10 triggers

| Trigger             | Fires when                          | Severity             | Example output                        |
| ------------------- | ----------------------------------- | -------------------- | ------------------------------------- |
| health_drop         | Health score drops 15+ points       | Critical             | "Acme health fell from 82 to 48"      |
| renewal_approaching | Renewal within 90/60/30 days        | Critical/High/Medium | "Renewal in 32 days, health 48"       |
| engagement_drop     | No activity for 30+ days            | High/Medium          | "No activity since March 2"           |
| arr_change          | ARR changes 10%+                    | High/Info            | "ARR dropped 22% ($125K → $97K)"      |
| goal_at_risk        | Linked goal status = at_risk        | High                 | "Goal 'API adoption' at 23% progress" |
| support_escalation  | 5+ open support tickets             | Critical/High        | "8 open tickets, 3 are P1"            |
| stale_data          | Entity data older than 24h          | Medium               | "Last sync: 3 days ago"               |
| memory_conflict     | 2+ low-confidence AI decisions      | Medium               | "Conflicting memories about budget"   |
| context_gap         | High-value account, 0 context items | Medium               | "$125K ARR, no emails or docs linked" |
| signal_cluster      | 3+ critical/high signals active     | Critical             | "5 signals firing simultaneously"     |

### Guardrails

- **Max 3 insights per entity per day** — prevents alert fatigue
- **Severity-first sorting** — critical always surfaces before medium
- **Evidence required** — no insight without at least 1 evidence item from Entity 360
- **Four-question standard** — every insight answers: what happened, why it matters, what to do, what happens if ignored
- **Source layer attribution** — every evidence item tagged with origin layer (truth/context/signals/memory/goals)
- **Confidence scoring** — 0.60 to 0.95 based on evidence strength and source count

---

## 5. THREE DATA PATHS

### Structured — Truth (CRM, billing, support → Spine)

```
Connector OAuth → Loader (creamy/full/delta) → Pipeline Queue → 8-Stage Normalizer → Spine
```

- Handles: accounts, contacts, deals, tickets, invoices, subscriptions
- Sync modes: creamy (30 days), full (all history), delta (changes only), webhook (real-time)
- All data becomes canonical truth in the Spine

### Unstructured — Context (emails, docs, meetings → Spine + Knowledge)

```
Connector OAuth → Loader → Pipeline → Spine (metadata) + Knowledge (embeddings)
```

- Handles: Gmail, Slack, Teams, Notion, Google Drive, Dropbox, OneDrive, Calendly
- Structured metadata goes to Spine, unstructured content goes to Knowledge for embedding
- Feeds Entity 360 Context layer

### AI Sessions — Approval-Based Personal Memory (reasoning → Knowledge only, NEVER Spine)

```
AI Source → D1 Buffer → Triage Bot → Confidence Scoring → Human Approval → Knowledge → Entity 360 Memory
```

- Handles: MCP, OpenAI, Claude, Moonshot, Grok, Gemini, any AI source
- AI-generated content NEVER writes to Spine directly
- Triage bot (Workers AI) extracts entities, sentiment, key facts
- Auto-approve or HITL review based on flow_c_config rules
- Only approved, verified knowledge enters the system
- Rejected content is logged but never stored as fact
- Approved content feeds Entity 360 Memory layer

---

## 5.1 APPROVAL-BASED PERSONAL MEMORY (No-Hallucination Memory)

The single most unique capability in IntegrateWise. No other platform has this.

### The Problem

Teams use multiple AIs (Claude, GPT, Grok, Gemini). Each AI:

- Gives different answers to the same question
- Doesn't remember what you told it last week
- Hallucinates facts with no way to verify
- Has no shared context with other AIs on your team

### The Solution

One verified knowledge base. Every AI reads from it. No AI writes without approval.

### How It Works

```
ANY AI (Claude, GPT, Grok, Gemini, MCP, your own models)
    │
    ├── READ: Yes — all AIs read from Entity 360 Memory
    │         (approved, verified knowledge only)
    │
    └── WRITE: Only through the approval gate
              │
              ├── AI generates insight/fact/decision
              ├── Triage Bot extracts entities + scores confidence
              ├── High confidence + trusted source → auto-approve (configurable)
              ├── Low confidence or new source → human review queue
              ├── Approved → enters Knowledge → feeds Entity 360 Memory
              └── Rejected → logged but never stored as fact
```

### What Makes It Different

| Approach                           | What it does                                                                            | Problem                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| RAG (retrieval)                    | Fetches docs before generating                                                          | Still hallucinates — just with context   |
| Grounding                          | Checks AI output against sources                                                        | Catches hallucinations after they happen |
| **Approval-Based Personal Memory** | AI output goes through triage → scoring → human approval BEFORE entering knowledge base | Hallucinations never enter the system    |

### Configuration (per tenant)

```typescript
{
  auto_approve_sources: ["claude", "system"],  // trusted sources
  min_confidence: 0.8,                         // threshold for auto-approve
  max_auto_approve_per_day: 50,                // rate limit
  require_entity_link: true,                   // must link to an entity
  notifications: {
    notify_on_auto_approve: true,
    notify_on_triage: true
  }
}
```

### Results

- Every AI on the team has the same verified context
- Knowledge compounds over time — verified, not hallucinated
- Switch AI providers anytime — the knowledge stays
- Full audit trail on every piece of knowledge (who approved, when, from which AI)
- Memory types: decision, preference, insight, action, rule, fact

---

## 6. IDENTITY RESOLUTION (S7.5)

Cross-source duplicate detection with human-in-the-loop resolution.

### Detection (automatic, in pipeline)

- Runs after S7 Sanity, before S8 Sectorize
- Generates signature from identifying fields (email, domain, name, phone)
- Queries for matches: same tenant + entity type + different source system
- Supported types: account, contact, lead, ticket, opportunity, people_team
- Entity ALWAYS written to Spine — detection is non-blocking

### Matching confidence

| Match type    | Confidence | Example                                                                         |
| ------------- | ---------- | ------------------------------------------------------------------------------- |
| Email exact   | 0.95       | john@acme.com from Salesforce = john@acme.com from Zendesk                      |
| Domain + name | 0.80       | acme.com + "Acme Corp" from HubSpot = acme.com + "Acme Corporation" from Stripe |
| Name + phone  | 0.75       | "John Smith" + +1-555-0123                                                      |
| Domain only   | 0.50       | acme.com (low confidence, goes to HITL)                                         |

### Resolution (human, via API or UI)

- **Merge**: Combine two records into one canonical entity
- **Keep Separate**: Mark as not duplicates, suppress future matching for this pair
- **Defer**: Revisit later
- Full audit trail on every resolution decision

---

## 7. GOVERN (Approval Gate)

Every autonomous action requires human approval. No exceptions.

### What Govern gates

- Entity merges (identity resolution)
- Bulk field overrides
- Action proposals from Twin
- Connector disconnects
- Schema changes

### How it works

1. Twin or system proposes an action
2. Action created with status "pending"
3. Routed to appropriate approver (workspace admin, CSM, compliance officer)
4. Approver reviews evidence and approves/rejects with reason
5. Approved actions execute via the standard write path
6. Every decision logged to governance audit trail

---

## 8. TRUST LAYER

Every data point in the system carries provenance.

### What's tracked

- **Source system**: Which connector provided this data (Salesforce, Zendesk, etc.)
- **Sync timestamp**: When this data was last synced
- **Confidence score**: 0-1 score based on source reliability and data recency
- **Freshness**: live (< 1h), recent (< 24h), stale (> 24h)
- **Evidence chain**: For every Twin insight — which data points triggered it, from which layers

### What's visible in UI

- Source badges on every data field
- Confidence percentage with color-coded bar
- Evidence panel on every Twin insight (expandable)
- "Why this insight" explanation with source flow visualization
- "Risk if ignored" warning
- Data freshness indicator on Entity 360

---

## 9. CONNECTORS (70+ integrations)

### By category

| Category      | Count | Connectors                                                                                 |
| ------------- | ----- | ------------------------------------------------------------------------------------------ |
| CRM           | 6     | Salesforce, HubSpot, Pipedrive, Zoho CRM, Freshsales, Close                                |
| Support       | 9     | Zendesk, Freshdesk, Front, Help Scout, Intercom, Kustomer, WhatsApp Business, Crisp, Drift |
| Billing       | 6     | Stripe, Chargebee, Paddle, QuickBooks, Xero, FreshBooks                                    |
| Marketing     | 8     | HubSpot Marketing, Mailchimp, Marketo, Braze, Segment, SendGrid, Customer.io, Klaviyo      |
| Analytics     | 6     | Google Analytics, Mixpanel, Amplitude, Heap, Tableau, Metabase                             |
| Project       | 6     | Jira, Asana, Linear, Monday, ClickUp, Trello                                               |
| Engineering   | 3     | GitHub, GitLab, Bitbucket                                                                  |
| Commerce      | 3     | Shopify, WooCommerce, BigCommerce                                                          |
| HR            | 1     | BambooHR                                                                                   |
| Communication | 7     | Gmail, Outlook, Slack, Teams, Discord, Zoom, Google Calendar                               |
| Productivity  | 6     | Notion, Google Drive, Dropbox, OneDrive, Airtable, Calendly                                |
| AI            | 4     | MCP, OpenAI, Claude, Moonshot                                                              |
| Design        | 1     | Figma                                                                                      |

### Connector features

- OAuth 2.0 / API key / OAuth 1.0 authentication
- Automatic field mapping to canonical schema
- Creamy load (30 days), full sync, delta sync, webhook ingestion
- Rate limit handling with exponential backoff
- Connector health monitoring (status, last sync, error count)
- Domain-based filtering in UI (show only relevant connectors for department)

---

## 10. PRODUCT SURFACES

### Account Success (Universal Product)

**Accounts Hub** — Daily operating view for anyone managing accounts

- Works for CSMs, CAs, hotel managers, freelancers, agency owners — anyone with accounts/clients
- My Day cards: engagements today, tasks due, open risks, upcoming renewals/due dates
- My KPIs: average health score, total value, account count
- Health filter: all / healthy / at-risk / critical
- Account list sorted by health score
- AI signals section with Twin insights
- Industry-adaptive: shows ARR for SaaS, invoice status for CAs, booking frequency for hospitality

**Intelligence Center** — Portfolio management for managers and leaders

- 6 KPIs: avg health, total value, at-risk value, upcoming renewals, open risks, AI signals
- Health distribution bar (healthy / at-risk / critical with percentages)
- Team performance table: owner name, accounts, avg health, value managed, at-risk count
- Accounts needing attention (sorted by worst health)
- Works for CS Directors, CA firm partners, hotel chain managers, school principals

**Strategic View** — Executive dashboard for VP, C-suite, board

- Big 4: total value, retention %, avg health, value renewing in 90d
- Value by segment/industry horizontal bar chart
- Initiative portfolio: active / blocked / total
- At-risk accounts: health < 70 with upcoming renewals/due dates

### Business Ops (Universal Product)

**Ops Cockpit** — Daily operating view for founders and operators

- 6 mini KPIs customized to business type (MRR/sales/revenue, pipeline, clients, deals, tasks, AI signals)
- AI signals: "What needs your attention" section
- Active deals/clients/projects sorted by value
- Account/client health sorted by worst first
- Works for SaaS founders, retail business owners, agency owners, freelancers

**CEO View** — Company-wide dashboard

- Big 4: revenue, pipeline, customers, OKR progress
- Critical signals section
- Strategic objectives with progress bars

**COO View** — Operations command center

- 6 ops KPIs: active workflows, initiatives, KPIs tracked, ops metrics, tasks done, ops signals
- Cross-department initiatives with status badges
- KPI tracker with progress bars

**CIO/CTO View** — Technology dashboard

- 4 tech KPIs: integrations, active incidents, tech metrics, tech signals
- Integration landscape table: workflow name, status, execution count
- Technology signals and metrics

### Cross-Domain Features (all views)

- **Content Router**: Every view lazy-loaded via module registry. 12 domain maps + BizOps cross-domain access.
- **Progressive Hydration**: B0→B7 bucket system. Views render progressively as data arrives.
- **Domain Sidebar**: Context-aware navigation that changes based on selected department.
- **L2 Cognitive Overlay**: Twin insights, evidence panels, decision memory, drift detection — accessible from any view.
- **Command Palette**: Quick navigation across all modules and domains.

---

## 11. REAL-TIME SYSTEM

### Signal Stream (Durable Objects)

- WebSocket/SSE for live signal delivery
- Tenant-scoped broadcasting via SignalStreamDO
- Signal filtering by severity, type, entity_type
- Recent signals cache (100 max per tenant)

### Presence Tracking

- User online/away/busy status via PresenceDO
- Cursor position sharing for collaboration
- Room-based collaboration via RoomDO

### HITL Gate (Durable Object)

- HITLGate DO manages approval workflows
- Real-time notification when approval is needed
- Timeout handling for unresolved approvals

---

## 12. PROGRESSIVE HYDRATION (B0 → B7)

The system progressively activates capabilities as data flows in.

| Bucket | State            | What's available                                         |
| ------ | ---------------- | -------------------------------------------------------- |
| B0     | No data          | Empty workspace, onboarding prompts                      |
| B1     | Schema resolved  | Entity types known, empty views with structure           |
| B2     | Creamy load done | 30 days of data, basic truth in Spine                    |
| B3     | Full load done   | Complete historical data, all entity types populated     |
| B4     | Context linked   | Flow B active — emails, docs, meetings in Entity 360     |
| B5     | Signals active   | Twin triggers start firing, insights appear              |
| B6     | Memory active    | Flow C feeding Entity 360, AI knowledge accumulating     |
| B7     | Full cognitive   | All 6 Entity 360 layers operational, full Twin reasoning |

---

## 13. PLATFORM INFRASTRUCTURE

### Services (21 Cloudflare Workers)

| Service         | Port | Purpose                                                 |
| --------------- | ---- | ------------------------------------------------------- |
| Gateway         | 8786 | API routing, auth, CORS, rate limiting                  |
| Spine-v2        | 8795 | Entity storage, Entity 360 API, Identity Resolution API |
| Pipeline        | 8794 | Pipeline orchestration                                  |
| Normalizer      | 8793 | 8-stage processing + S7.5 identity detection            |
| Knowledge       | 8789 | Context storage, memory consolidation, triage bot       |
| Think           | 8798 | Twin triggers, SignalEngine, AI reasoning               |
| Act             | 8780 | Action execution                                        |
| Govern          | 8787 | Approval workflows, policy enforcement                  |
| Intelligence    | 8788 | Signal processing, Python AI client                     |
| Workflow        | 8800 | Real-time signals, Durable Objects, presence            |
| Connector       | 8785 | Connector management, sync scheduling                   |
| Tenants         | 8797 | Tenant management, OAuth flows                          |
| Billing         | 8783 | Subscription management, webhook replay                 |
| Admin           | 8781 | Admin operations                                        |
| Agents          | 8782 | Agent orchestration                                     |
| L2              | 8790 | L2 cognitive insights                                   |
| Loader          | 8791 | Data extraction from connectors                         |
| Store           | 8796 | File storage (R2)                                       |
| MCP Connector   | 8792 | MCP tool server                                         |
| Webhook Ingress | 8799 | Inbound webhook processing                              |
| HubSpot Sync    | 8784 | HubSpot-specific sync logic                             |

### Storage

- **Spine DB**: Primary database (PostgreSQL + RLS + Realtime + Auth)
- **Cloudflare D1**: Edge cache for entity signatures, merge candidates, pipeline state
- **Cloudflare KV**: Hot entity cache, session state, rate limits, signal cache
- **Cloudflare R2**: File storage for documents, exports
- **Cloudflare Queues**: Pipeline queue, knowledge queue, accelerator queue, intelligence queue, signal queue, DLQ

### Security

- Spine DB RLS enforces tenant isolation at database level
- OAuth 2.0 with PKCE for connector authentication
- Token encryption for stored credentials
- Secrets Store for all sensitive configuration
- Govern gate on all destructive operations
- Full audit trail on every data change

---

## 14. SYNC ENTITLEMENTS (Plan-Based)

| Capability        | Free   | Starter | Professional | Enterprise |
| ----------------- | ------ | ------- | ------------ | ---------- |
| Sync interval     | 24h    | 4h      | 1h           | 15min      |
| Records per sync  | 1,000  | 5,000   | 25,000       | 100,000    |
| Records per month | 10,000 | 50,000  | 500,000      | Unlimited  |
| Historical days   | 30     | 90      | 365          | Unlimited  |
| Max connectors    | 1      | 3       | 10           | Unlimited  |
| Delta sync        | Yes    | Yes     | Yes          | Yes        |
| Full refresh      | No     | Yes     | Yes          | Yes        |
| Two-way sync      | No     | No      | Yes          | Yes        |
| Webhooks          | No     | No      | Yes          | Yes        |

---

## 15. WHAT MAKES IT DIFFERENT

| Capability                        | IntegrateWise                                                                              | Gainsight    | Totango      | CDPs                      | Internal dashboards |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------------ | ------------ | ------------------------- | ------------------- |
| Universal (any industry)          | Yes — SaaS, finance, hospitality, SMB, freelancers                                         | CS-only      | CS-only      | Marketing only            | Custom per team     |
| Unified entity across all sources | Yes (Entity 360)                                                                           | Partial      | Partial      | Marketing only            | No                  |
| Identity resolution               | S7.5 + HITL                                                                                | Manual       | Manual       | Yes but marketing-focused | No                  |
| AI with evidence                  | Twin + trust layer                                                                         | Rules only   | Rules only   | No                        | No                  |
| Approval-Based Personal Memory    | Yes — triage + approval gate, any AI reads verified knowledge, none write without approval | No           | No           | No                        | No                  |
| Governed actions                  | Govern gate                                                                                | No           | No           | No                        | No                  |
| Schema-driven (no manual config)  | 150+ types auto-routed                                                                     | Manual setup | Manual setup | Manual                    | Manual              |
| Edge deployment                   | 300+ Cloudflare PoPs                                                                       | Cloud only   | Cloud only   | Cloud only                | Depends             |
| Context (emails, docs)            | Unstructured path                                                                          | No           | No           | No                        | No                  |
| Multi-AI support                  | Any AI reads from same verified knowledge                                                  | No           | No           | Single vendor             | No                  |
| Multi-market pricing              | ₹999 to $999/mo                                                                            | $2,500/mo+   | $1,200/mo+   | $1,000/mo+                | Engineering cost    |
| 70+ connectors out of box         | Yes                                                                                        | ~30          | ~20          | Varies                    | 0                   |
