# Platform Page & Product Page — Content Spec

> Two pages. Platform = the backend engine (technical language for CTOs/architects).
> Product = the User Workbench shell (feature language for buyers/users).

---

## Canonical Surface-Binding Guardrail

- User Workbench = the projection-native customer/product shell.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- The Twin is a native Cloudflare surface (iw-agent-runtime), not a separate shell.
- Twin runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

---

# PLATFORM PAGE

**URL:** `integratewise.ai/platform`
**Audience:** CTOs, solution architects, technical buyers, engineering leaders
**Language:** Technical — this is the one page where architecture language is allowed
**Tone:** Confident, precise, credible. Show the depth.

---

## Section 1: The Spine

**Headline:** "The Spine — Single Source of Truth"

**Body:**
The Spine is the canonical data layer. Every entity from every connected tool lands here — normalized, deduplicated, and schema-routed.

**What to cover:**

- 150+ entity types across 12 department schemas
- 12 schemas: Customer Success, Sales, Marketing, RevOps, Product Engineering, Finance, Support, Procurement, IT Admin, BizOps, Education, Personal
- 11 industry overlays: SaaS, Healthcare, Manufacturing, Automotive, Logistics, Retail, Financial Services, Media, Public Sector, Education, Professional Services
- Adaptive schema — `getSpineConfig(industry, department)` composes the final schema at onboarding
- Each department has its own entity types and priority fields
- Schema controls everything downstream: what gets extracted, what gets filtered, what the workspace shows, what the Twin reasons over
- Row-Level Security — tenant isolation at the database level. Workspace A cannot see Workspace B.
- Monotonic versioning — every entity gets a version number, highest version wins on conflict

**Visual:** Schema tree showing departments → entity types. Interactive or animated — click a department, see its entities expand.

---

## Section 2: Three Data Flows (Identities)

**Headline:** "Three Paths Into the Spine"

### Flow A — Structured Data → Truth

**Sources:** CRMs, billing systems, support desks, analytics, project tools

```
Source API (Salesforce, Stripe, Zendesk, Jira...)
    → Connector (OAuth 2.0, encrypted tokens)
    → Loader (creamy load 30 days, delta sync, full sync, webhook)
    → 8-Stage Pipeline (Normalizer)
        S1 Analyze — detect entity type, resolve schema
        S2 Classify — assign priority
        S3 Filter — reject if entity type not in tenant schema
        S4 Refine — normalize field names to canonical
        S5 Extract — keep only schema-allowed fields
        S6 Validate — type checks, required fields
        S7 Sanity — business rules, score ≥ 70 to pass
        S7.5 Identity Resolution — signature matching, merge candidates
        S8 Sectorize — route to correct department table, write to Spine
    → Spine (Spine DB — SSOT)
```

**Key details:**

- Idempotency: SHA-256 content hash (tenant_id + entity_type + source + content)
- Retry: 3 attempts, backoff 30s → 60s → 90s, then DLQ
- Trace correlation: UUID flows through entire pipeline
- This flow HAS the Repeat loop — when an approved action executes on an external tool, the changed data flows back through this path

### Flow B — Unstructured Data → Context

**Sources:** Gmail, Slack, Teams, Notion, Google Drive, Confluence, Dropbox, OneDrive

```
Source API
    → Connector → Loader → Pipeline (same 8 stages)
    → At S8: metadata to Spine, content to Knowledge Queue
    → Knowledge Service: generates embeddings, writes to context_extractions
    → Linked to entities via entity_id
```

**Key details:**

- Documents, emails, PDFs stay intact and are connected to entities
- No repeat loop — unstructured data flows in once and is linked
- Feeds the Context layer in the complete entity view

### Flow C — AI Sessions → Knowledge Memory

**Sources:** ChatGPT, Claude, Gemini, Perplexity, Grok, MCP tools, the Twin itself

```
AI conversation or Twin reasoning
    → Triage Bot (sole writer to memory)
        Entity extraction, sentiment analysis, key fact extraction
        Confidence scoring (0.0 — 1.0)
    → D1 edge buffer → Spine DB ai_memories
        memory_type: decision | preference | insight | action | rule | fact
        status: pending (human review) or approved (auto-approve rules)
    → Memory Consolidator (scheduled worker)
        Reads approved ai_memories → writes consolidated_memories
        Session, daily, and weekly summaries
    → Knowledge Memory Store
```

**Key details:**

- Triage Bot is the SOLE writer to memory — no AI, no user writes directly
- Flow C NEVER writes to Spine — writes to governed knowledge memory only
- Memory grows daily — this is why it's a Knowledge Workspace
- Read access controlled by tenant_id + OAuth approval

**Visual:** Three parallel flow diagrams, color-coded. Structured (emerald), Unstructured (blue), AI Sessions (purple). All three converge at the entity view.

---

## Section 3: Execution Path

**Headline:** "Load → Store → Think → Act → Adjust → Repeat"

**The core loop:**

| Stage      | What Happens                                                                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Load**   | Connectors pull data from source systems. OAuth 2.0 flow. Creamy load (30 days bounded), delta sync, full sync, webhook ingestion.                                                                                               |
| **Store**  | 8-stage pipeline normalizes, deduplicates, validates, and routes data to the Spine. Identity resolution at S7.5. Schema-driven extraction.                                                                                       |
| **Think**  | Twin evaluates Entity 360 data against 10 triggers. Reads Truth + Context + Knowledge Memory. Generates evidence-backed insights. Max 3 per entity per day.                                                                      |
| **Act**    | Approved actions execute on external tools — create task, send email, update record. Scoped by Govern policy. Every action requires HITL approval.                                                                               |
| **Adjust** | Denied or edited actions update decision memory via Triage Bot. Twin learns from patterns: what gets approved, dismissed, modified. Future proposals improve.                                                                    |
| **Repeat** | Action changes the external tool → that tool's data flows back through Flow A → Loader picks it up → Pipeline processes → Spine updates → Entity 360 refreshes → Twin re-evaluates. The system sees its own actions as new data. |

**Key details:**

- Repeat loop is Flow A ONLY — not Flow B, not Flow C
- Twin is READ-ONLY on Spine — writes only after HITL approval
- Agents and the Twin live ONLY in Act — they do not participate in truth formation
- No retraining needed — context is always current, always growing

**Visual:** Circular flow diagram showing the six stages. The Repeat arrow loops from Act back to Load. Animated — data particles flowing through the loop.

---

## Section 4: Connector Ecosystem

**Headline:** "70+ Integrations Across 13 Categories"

| Category      | Count | Connectors                                                                                       |
| ------------- | ----- | ------------------------------------------------------------------------------------------------ |
| CRM           | 6     | Salesforce, HubSpot, Pipedrive, Zoho CRM, Freshsales, Close                                      |
| Support       | 9     | Zendesk, Freshdesk, Intercom, Front, Help Scout, Kustomer, Freshworks, WhatsApp Business, Twilio |
| Billing       | 6     | Stripe, Chargebee, Paddle, QuickBooks, Xero, FreshBooks                                          |
| Marketing     | 8     | HubSpot Marketing, Mailchimp, Marketo, Braze, Segment, SendGrid, Customer.io, ActiveCampaign     |
| Analytics     | 6     | Google Analytics, Mixpanel, Amplitude, Heap, Tableau, Metabase                                   |
| Communication | 7     | Gmail, Outlook, Slack, Microsoft Teams, Discord, Zoom, Google Calendar                           |
| Productivity  | 7     | Notion, Google Drive, Dropbox, OneDrive, Airtable, Calendly, Confluence                          |
| Project       | 6     | Jira, Asana, Linear, Monday.com, ClickUp, Trello                                                 |
| Engineering   | 3     | GitHub, GitLab, Bitbucket                                                                        |
| Commerce      | 3     | Shopify, WooCommerce, BigCommerce                                                                |
| AI            | 3     | OpenAI, MCP, AI Chat                                                                             |
| HR            | 1     | BambooHR                                                                                         |

**Connector features:**

- OAuth 2.0 / API key / OAuth 1.0 authentication
- Automatic field mapping to canonical schema
- Sync modes: creamy (30 days), full, delta, webhook
- Rate limit handling with exponential backoff
- Connector health monitoring (status, last sync, error count)
- Domain-based filtering in UI (show only relevant connectors for department)

**Visual:** Searchable grid with connector logos, grouped by category. Filter by category. Each connector shows: name, logo, sync mode, status badge (live/beta).

---

## Section 5: Knowledge Base

**Headline:** "Intelligence That Compounds Daily"

**What the Knowledge Base contains:**

- **Verified Memories** — approved AI knowledge with type (decision, preference, insight, action, rule, fact), confidence score, source attribution
- **Triage Inbox** — pending AI proposals awaiting human review. Confidence scoring, entity extraction, conflict detection.
- **Sessions** — AI conversation history across all providers (ChatGPT, Claude, Gemini, Twin)
- **Topics** — knowledge organized by subject, auto-categorized
- **Search** — full-text search across all knowledge

**How it works:**

- Triage Bot processes every AI output: entity extraction, sentiment analysis, key fact extraction, confidence scoring
- High confidence + trusted source → auto-approve (configurable per tenant)
- Low confidence or new source → human review queue
- Approved → enters consolidated_memories → feeds Entity 360 Memory layer → Twin reads it
- Rejected → logged but never stored as fact
- Memory types: decision, preference, insight, action, rule, fact

**The compounding effect:**

- Day 1: empty
- Week 1: basic decisions and preferences accumulating
- Month 1: the system knows your business better than any new hire
- Month 6: deep institutional memory across all accounts
- No retraining needed — context is always current, always growing, never lost

**Visual:** Growing stack visualization — memories accumulating over time. Counter showing "X verified memories, growing daily."

---

## Section 6: Security

**Headline:** "Security Built Into Every Layer"

| Layer                  | What It Does                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Tenant Isolation       | Spine DB Row-Level Security — every query scoped by tenant_id via auth.uid(). Workspace A cannot see Workspace B. |
| Authentication         | Spine DB Auth with OAuth 2.0 + PKCE. JWT carries tenant_id.                                                       |
| Token Encryption       | Connector OAuth tokens encrypted at rest. Stored in Spine DB with AES encryption.                                 |
| Approval Gate (Govern) | Every autonomous action requires human approval. No exceptions. Cannot be bypassed, overridden, or turned off.    |
| Audit Trail            | Every data access, AI recommendation, approval decision, and executed action logged with full context.            |
| RBAC                   | Role-based access control — team members only see and act on data relevant to their role.                         |
| SSO                    | Enterprise SSO via SAML 2.0 and OIDC (Enterprise tier).                                                           |
| Source Attribution     | Every data point tagged with origin system and sync timestamp. Every AI insight shows evidence chain.             |
| Confidence Scoring     | 0-1 score per field based on source reliability and recency.                                                      |

---

## Section 7: Infrastructure

**Headline:** "Edge-First. Globally Deployed."

| Component      | Technology          | Purpose                                                                          |
| -------------- | ------------------- | -------------------------------------------------------------------------------- |
| Compute        | Cloudflare Workers  | 7 workers deployed across 300+ edge locations. 0ms cold starts. V8 isolates.     |
| Database       | Spine DB PostgreSQL | Single source of truth. RLS for tenant isolation. Realtime subscriptions.        |
| Edge Cache     | Cloudflare KV       | Hot entity cache (60s TTL), session state, rate limits, signal cache.            |
| Edge DB        | Cloudflare D1       | Fingerprint dedup, merge candidates, AI memory buffer.                           |
| File Storage   | Cloudflare R2       | Documents, exports, attachments. Metadata in Spine DB, blobs in R2.              |
| Message Queues | Cloudflare Queues   | Pipeline, knowledge, intelligence, signal, accelerator, DLQ. Retry with backoff. |
| Real-time      | Durable Objects     | Signal broadcasting, presence tracking, HITL approval state machines.            |
| Auth           | Spine DB Auth       | OAuth 2.0 + PKCE, JWT, session management.                                       |

**Visual:** Architecture diagram showing the layers — edge (Workers, KV, D1) → processing (Queues) → storage (Spine DB, R2) → client (React app).

---

---

# PRODUCT PAGE

**URL:** `integratewise.ai/product`
**Audience:** Buyers, users, decision makers — anyone evaluating the product
**Language:** Feature language — what you see, what you get, how it helps you
**Tone:** Clear, confident, visual. Show the workspace.

---

## Section 1: The User Workbench

**Headline:** "One product shell. Everything you need."

**Body:**
When you log in, you see your workspace — not a dashboard, not a report, not a feed. A workspace shaped by your department and industry. Accounts, contacts, tasks, calendar, documents, workflows — all in one place. The sidebar shows what matters to you. The views hydrate as you connect tools. Empty sections stay empty until the feeding connector is connected — no fake data, no placeholders.

**What to show:**

- The User Workbench shell — sidebar navigation, header with breadcrumbs, main content area
- Domain-specific views: a CSM sees accounts and health scores, a founder sees revenue and pipeline, a CA sees clients and filings
- Progressive hydration: connect Gmail → tasks section appears. Connect Salesforce → accounts appear. Connect Stripe → revenue appears.
- Personal vs Work toggle — everyone gets a private Personal space plus their Work workspace
- 12 department schemas available — the workspace adapts during onboarding

**Visual:** Interactive workspace mockup. Show the actual L1 workspace with sidebar, account cards, health scores, task queue. Animate the progressive hydration — tools connecting one by one, sections lighting up.

---

## Section 2: The Twin

**Headline:** "Your AI that thinks in full context"

**Body:**
The Twin is the AI inside your workspace. It reads three layers — your data from connected tools, your conversations from email and Slack, and your accumulated knowledge from AI sessions. It watches patterns across everything and surfaces what matters. It doesn't guess. It doesn't hallucinate. It reasons across the full picture.

**What to show:**

- The Twin surfaces insights in the workspace — notification badges, signal cards, morning briefing
- Every insight answers 4 questions: What happened. Why it matters. What you could do. What happens if you ignore it.
- Evidence on every insight — which data, from which tool, how confident
- Maximum 3 insights per entity per day — no alert fatigue
- The Twin learns from your decisions — approvals, rejections, and edits all teach it

**Visual:** Show a Twin insight card appearing in the workspace. "Acme Corp usage dropped 42%, renewal in 45 days. Evidence: Mixpanel usage data + 3 open Zendesk tickets + champion silent 12 days." With the evidence chain visible.

---

## Section 3: Human in the Loop

**Headline:** "Nothing happens without your approval"

**Body:**
The Twin proposes. You decide. Every action — draft a renewal email, escalate a ticket, flag for the team — comes with evidence and reasoning. You see exactly why the Twin is recommending it. You approve, modify, or dismiss. Only then does the action execute. This isn't a setting you can turn off. It's how the system is built.

**What to show:**

- The approval flow: Twin proposes → you see evidence + confidence + reasoning → you approve/modify/dismiss
- The governance handoff — where approvals, evidence review, and controlled decisions happen
- Approved actions execute and the result flows back into the system
- Dismissed actions teach the Twin — future proposals improve
- Full audit trail on every decision

**Visual:** Show the L2 drawer opening with a pending approval. The [Approve] and [Reject] buttons. The evidence panel. The confidence score. Make it feel deliberate and powerful.

---

## Section 4: Twin Insights

**Headline:** "10 types of insights. All with evidence."

**Body:**
The Twin doesn't just watch one metric. It watches patterns across all your connected tools and fires insights when something needs your attention.

| What It Catches         | Example                                                        |
| ----------------------- | -------------------------------------------------------------- |
| Health dropping         | "Acme Corp usage dropped 42%, renewal in 45 days"              |
| Deadline approaching    | "Client GST filing overdue, no response in 3 weeks"            |
| Customer going quiet    | "Regular customer hasn't ordered in 30 days"                   |
| Revenue changing        | "Monthly sales down 20% from top 3 accounts"                   |
| Goal at risk            | "API adoption at 23% — target was 60% by Q3"                   |
| Support escalation      | "8 open tickets, 3 are P1"                                     |
| Data going stale        | "Last sync from Salesforce: 3 days ago"                        |
| Knowledge conflict      | "Two AI sessions disagree on the client's budget"              |
| Missing context         | "$125K account, no emails or docs linked"                      |
| Multiple signals firing | "Payment failed + order cancelled + complaint — same customer" |

**Visual:** Animated feed of insight cards appearing one by one. Each card shows the insight type icon, the message, the evidence sources (tool logos), and the confidence score.

---

## Section 5: Twin Operations

**Headline:** "What the Twin actually does in your workspace"

**Body:**
The Twin isn't a chatbot you talk to. It's an intelligence layer that operates continuously inside your workspace.

**What the Twin does:**

**Watches** — Monitors every connected tool for patterns. Usage changes, support spikes, payment failures, engagement drops, deadline approaches. Across all your tools, all the time.

**Reasons** — Reads Truth + Context + Knowledge Memory for every entity. Connects dots that no single tool can see. A usage drop + a support escalation + a budget freeze mentioned in email + a decision you approved last month = a churn risk signal.

**Surfaces** — Delivers insights to your workspace with evidence. Morning briefing: "3 things that need your attention today." Signal cards on accounts. Notification badges. Never more than 3 per entity per day.

**Proposes** — Suggests actions: draft a renewal email, schedule a check-in, escalate to your manager, flag for the team. Every proposal comes with evidence and reasoning.

**Learns** — When you approve, the Twin knows what works. When you dismiss, it learns what doesn't. When you modify, it learns your preferences. Decision memory accumulates. Future proposals get sharper.

**Remembers** — AI session summaries, decisions, corrections, insights — all governed by TruthLayer. The Twin proposes what it learned, you approve before it enters memory. Knowledge compounds daily.

**Visual:** Six-panel grid showing each operation with an icon and a mini-animation. Watches (eye scanning), Reasons (connecting dots), Surfaces (card appearing), Proposes (action with approve button), Learns (feedback loop), Remembers (memory stack growing).

---

## How Platform and Product Connect

The Platform page ends with a bridge to the Product page:

> "That's the engine. Here's what you actually use." → [See the Product →]

The Product page ends with a bridge to the Solutions pages:

> "That's the workspace. Here's what it does for you." → [Account Success →] [Business Ops →] [Personal Space →]

The flow: Platform (how it works) → Product (what you use) → Solutions (why you buy it).

---

_Platform speaks to the architect. Product speaks to the user. Solutions speak to the buyer. Three pages, three audiences, one product._
