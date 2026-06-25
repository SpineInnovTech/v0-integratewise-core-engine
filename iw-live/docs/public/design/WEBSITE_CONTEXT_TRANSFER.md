# IntegrateWise Website — Context Transfer

> For whoever is building or fixing the website.
> This document contains everything you need: what the product actually is,
> what each page should say, what's wrong on the current site, and the exact
> content to use.
>
> Source of truth: the founder's design docs, not the current website code.

---

## WHAT INTEGRATEWISE ACTUALLY IS

IntegrateWise is a Knowledge Workspace Over the Spine and Empowerd by AI.

It does three things:

1. Connects your tools into one workspace (70+ integrations)
2. Gives AI the full picture — your data, your conversations, and your accumulated knowledge
3. Lets AI propose actions — but nothing happens without your approval

The AI thinks across three layers:

| Layer            | What It Contains                                                                                    | How It Flows In                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Truth            | Structured data from connected tools — accounts, contacts, deals, invoices, tasks, tickets          | Automatically via 70+ connectors. Data is cleaned, deduplicated, and organized. |
| Context          | Emails, Slack messages, meeting notes, documents, PDFs — the human layer that gives meaning to data | Automatically from communication and productivity tools.                        |
| Knowledge Memory | AI session summaries, decisions, corrections, insights — intelligence that compounds over time      | Governed by TruthLayer — AI proposes, you approve before it enters memory.      |

All three meet in one complete view per entity. The AI reasons across all of them. That's why it catches things no single tool can see.

**TruthLayer** governs Knowledge Memory (the third layer). It does NOT govern Truth or Context — those flow in automatically. TruthLayer ensures that when AI learns something new, it proposes it first. You approve, reject, or edit. Only confirmed knowledge enters the memory.

---

## WHAT'S WRONG ON THE CURRENT SITE (Fix List)

### Critical Fixes

| #   | Page             | Issue                                                  | Fix                                                                                                                                      |
| --- | ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | /integrations    | Says "20+ pre-built connectors"                        | Change to "70+ integrations" — the unified registry has 65 connectors plus India/UAE connectors and accelerators                         |
| 2   | /ai              | Invents "7 specialized AI assistants" that don't exist | Rewrite to reflect the actual product: Twin that reads all three layers, 10 trigger types, evidence on every insight, HITL approval flow |
| 3   | / (homepage)     | Proof section shows "$0M" / "0%" / "0 Systems"         | Either populate with real numbers ($8M account saved, 99.9% uptime target, 70+ systems) or remove the section entirely                   |
| 4   | /account-success | "Start free" button at bottom                          | Change to "Book a Demo" — self-serve isn't live (M1-3 is founder-led)                                                                    |
| 5   | /business-ops    | "Start free" button at bottom                          | Same fix — "Book a Demo"                                                                                                                 |
| 6   | /pricing         | Starter tier says "Get started"                        | Change to "Book a Demo" or "Join Early Access"                                                                                           |
| 7   | /platform        | Only 3 generic steps, no depth                         | Rebuild with the three data flows, how the complete view assembles, how AI reasons across all three layers, and the approval gate        |
| 8   | /integrations    | Shows only ~22 connectors                              | Show the full catalog from the unified registry (65+ connectors across 13 categories)                                                    |
| 9   | /security        | Claims "HIPAA" compliance package                      | Remove — not mentioned in architecture docs. Keep SOC 2 aligned, GDPR ready.                                                             |
| 10  | /security        | Claims "Data residency options"                        | Remove or soften to "coming soon" — multi-region isn't confirmed in architecture                                                         |

### Content Gaps

| #   | What's Missing                       | Where It Should Go                                                                                                                      |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | Industry examples                    | Homepage and surface pages should show how the product applies to SaaS, financial services, hospitality, retail, education, freelancers |
| 12  | India pricing (₹999/₹2,999/₹7,999)   | Pricing page India tab — verify it's populated                                                                                          |
| 13  | International pricing ($49/$99/$199) | Pricing page International tab — same for UAE and all non-India markets, no separate UAE tab                                            |
| 14  | Connector count on homepage          | The hero area or "connect your tools" section should say 70+, not imply a smaller number                                                |
| 15  | Three-layer explanation              | Homepage "Three foundations" section is good but needs to be reinforced on /platform and /ai pages                                      |

**IMPORTANT: 20 products exist internally (8 Account Success + 7 Business Ops + 5 Personal Space) but product names are NOT shown on the website. They are for internal alignment and sales conversations only. The website sells the three product families and the three tiers — not individual product names.**

**IMPORTANT: The Twin is the AI. There is one AI — the Twin. It does everything: watches patterns, surfaces insights, proposes actions, learns from decisions. Do NOT invent multiple AI assistants, agents, or bots on the website. The Twin reads Truth + Context + Knowledge Memory, reasons across all three, and proposes. You approve. That's it.**

---

## PAGE-BY-PAGE CONTENT GUIDE

### Homepage (/)

**Current state:** Mostly good. The chaos animation, the "Three foundations" section (Truth, Context, AI Session Memory), the workspace demo, the TruthLayer section, and the "Four steps" section are well-structured.

**Fixes needed:**

Hero section — keep as is. "Your tools don't talk to each other. Your AI doesn't know context. You are the bridge. The Human API." is strong.

Three foundations section — currently correct. Truth, Context, AI Session Memory. Keep this.

TruthLayer section — change headline from "AI proposes. You decide what's true." to:

> "AI thinks in context. You decide what becomes knowledge."
> "Every insight draws from three layers — your data, your conversations, and your accumulated knowledge. When AI learns something new, it proposes it first. You review the evidence, the confidence, the source. You approve, reject, or edit. Nothing enters knowledge memory without your say."

Proof section — replace zeros:

> "$8M — Customer account saved from 100% attrition risk"
> "70+ — Systems connected across 13 categories"  
> "3 layers — Truth + Context + Knowledge Memory in every view"

Pricing section — change all CTAs:

- Starter: "Book a Demo" (not "Get started")
- Growth: "Book a Demo" (keep)
- Command: "Contact Sales" (keep)

### Account Success (/account-success)

**Current state:** Good pain description, good feature sections.

**Do NOT add product names.** The 20 products are internal. The website shows the three tiers by capability, not by product name:

> ## Three tiers of intelligence
>
> **Data + Dashboards** — Connect your tools, see everything in one place. Health scores, renewal tracking, duplicate detection, contract management. No AI needed.
>
> **Twin Observes + Suggests** — The Twin watches your accounts across every connected tool. It spots patterns, flags risks, and suggests next actions — with evidence. You decide, you execute.
>
> **Twin Proposes + Learns (TruthLayer)** — The Twin predicts churn before scores move, drafts intervention plans, and learns from outcomes. TruthLayer governs what enters knowledge memory. Nothing writes without your approval.

**Add industry examples section:**

> ## Works for any industry
>
> | Industry       | What "Account" Means | Twin Insight Example                         |
> | -------------- | -------------------- | -------------------------------------------- |
> | SaaS B2B       | Customer account     | "Usage dropped 42%, renewal in 45 days"      |
> | Financial / CA | Client portfolio     | "Client GST filing overdue, no response"     |
> | Hospitality    | Property / guest     | "Guest satisfaction dropped, 3 complaints"   |
> | Retail SMB     | Customer             | "Regular customer hasn't ordered in 30 days" |
> | Education      | Student / parent     | "Student attendance below 60%"               |
> | Freelancer     | Client               | "Invoice overdue 15 days, no response"       |

**Fix bottom CTA:** Remove "Start free" → "Book a Demo"

### Business Ops (/business-ops)

**Current state:** Good structure with four role-based views (Founder, CEO, COO, CTO/CIO).

**Do NOT add product names.** Same three-tier structure as Account Success:

> **Data + Dashboards** — Connect your business tools, see everything in one dashboard.
> **Twin Observes + Suggests** — The Twin watches your operations and tells you what needs attention.
> **Twin Proposes + Learns (TruthLayer)** — The Twin drafts weekly briefs, proposes budget adjustments, and learns from your decisions.

**Fix bottom CTA:** Remove "Start free" → "Book a Demo"

### Personal Ops (/personal-ops)

**Current state:** Good. "Join waitlist" CTA is correct for M1-3 launch phase.

**Do NOT add product names.** Same three-tier structure.

### Platform (/platform) — NEEDS FULL REBUILD

**Current state:** Three generic steps with no depth. Useless for technical buyers.

**Rebuild with this structure:**

> ## How IntegrateWise Works
>
> ### 1. Connect — 70+ integrations across 13 categories
>
> CRM, billing, support, analytics, marketing, communication, productivity, project management, engineering, commerce, AI, HR. Connect via OAuth in minutes. No data migration. No engineering team.
>
> ### 2. Clean — Your data gets organized automatically
>
> Every record from every source passes through an 8-stage process:
>
> - Detect what type of data it is
> - Check it against your workspace schema — reject what doesn't belong
> - Normalize field names across tools (Salesforce "Company" = HubSpot "Organization" = Zendesk "Account")
> - Remove duplicates — same entity from different tools gets merged into one record
> - Validate data quality — flag anomalies, score confidence
> - Route to the right place in your workspace
>
> ### 3. Three Layers — How AI Gets the Full Picture
>
> **Truth** — Structured data from your connected tools
> Accounts, contacts, deals, invoices, tasks, tickets — cleaned, deduplicated, and linked. This is the factual foundation. Updated automatically as your tools sync.
>
> **Context** — Your conversations and documents
> Emails, Slack messages, meeting notes, documents, PDFs. The human layer that gives meaning to raw data. A CRM record says "renewal in 45 days." An email thread says "the champion mentioned budget freeze last week." Context is what turns data into understanding.
>
> **Knowledge Memory** — AI session summaries that compound over time
> Every AI conversation — with ChatGPT, Claude, Gemini, or the built-in Twin — can generate knowledge. Decisions made, preferences discovered, insights surfaced. But unlike other AI tools, this knowledge doesn't auto-write. It goes through TruthLayer: AI proposes, you approve, only then it enters memory. This memory grows daily. After a month, the system knows your business better than any new hire.
>
> ### 4. Complete View — Everything about any entity, in one place
>
> Click on any account, client, customer, or project and see all three layers assembled:
>
> - Facts from your CRM, billing, and support tools
> - Conversations from email, Slack, and meetings
> - Verified knowledge from AI sessions
> - Active alerts and signals
> - Goals and progress
> - Relationships — who's connected to whom
>
> Assembled in under 200ms. Cached at the edge. Source-attributed — every data point shows where it came from and how fresh it is.
>
> ### 5. The Twin — Thinks in Context
>
> The Twin reads all three layers before reasoning. That's why it catches things no single tool can see:
>
> - A usage drop (Truth) + a support escalation (Truth) + a budget freeze mentioned in email (Context) + a decision you approved last month (Knowledge Memory) = a churn risk signal with full evidence
>
> 10 types of insights. Every insight answers: What happened. Why it matters. What you could do. What happens if you ignore it. Maximum 3 per entity per day.
>
> ### 6. You Approve — Nothing Happens Without Your Say
>
> The Twin proposes actions. You see the evidence, the confidence score, the reasoning. You approve, modify, or dismiss. Only then does the action execute. When it does, the result flows back into the system — the Twin learns from your decisions.
>
> ### 7. Duplicate Resolution
>
> "Acme Corp" in Salesforce, "Acme Corporation" in Zendesk, "acme.com" in Stripe — same company, three records. The system detects matches automatically, shows them side by side with a confidence score. You decide: merge, keep separate, or defer. No auto-merging.
>
> ### Infrastructure (for technical buyers)
>
> - Edge deployment: Cloudflare Workers, 300+ points of presence, 0ms cold starts
> - Database: Spine DB PostgreSQL with Row-Level Security — tenant isolation at the database level
> - Processing: Cloudflare Queues with retry, backoff, and dead-letter queue
> - Cache: Cloudflare KV for hot entity cache (60s TTL)
> - Storage: Cloudflare R2 for documents and exports
> - Auth: Spine DB Auth with OAuth 2.0 + PKCE
> - Security: Encrypted tokens, full audit trail, approval gate on all destructive actions

### AI & Approvals (/ai) — NEEDS FULL REWRITE

**Current state:** Invents "7 specialized AI assistants" that don't exist in the product. The Twin is the AI. There is one AI — the Twin. It does everything.

**Rewrite with this structure:**

> ## The Twin — Your AI That Thinks in Full Context
>
> IntegrateWise has one AI: the Twin. It reads everything — your data, your conversations, and your accumulated knowledge — before it says anything. It doesn't guess. It doesn't hallucinate. It reasons across the full picture.
>
> ### How the Twin Reasons
>
> The Twin reads three layers for every entity:
>
> 1. Truth — structured data from 70+ connected tools
> 2. Context — emails, documents, Slack messages, meeting notes
> 3. Knowledge Memory — verified AI session summaries that compound over time
>
> It connects dots that no single tool can see. A usage drop in your analytics tool + 3 open P1 tickets in your support tool + a budget freeze mentioned in an email + a decision you approved last month = a churn risk signal with full evidence chain.
>
> ### What the Twin Does
>
> The Twin performs everything:
>
> - Watches your accounts and business for patterns across all connected tools
> - Surfaces insights with evidence — what happened, why it matters, what to do, what happens if you ignore it
> - Proposes actions — draft a renewal email, escalate a ticket, flag for the team
> - Learns from your decisions — approvals, rejections, and edits all teach the Twin
> - Writes to Knowledge Memory — but only through TruthLayer, only with your approval
>
> ### 10 Types of Insights the Twin Surfaces
>
> | What It Catches         | Example                                                        |
> | ----------------------- | -------------------------------------------------------------- |
> | Health dropping         | "Acme Corp usage dropped 42%, renewal in 45 days"              |
> | Deadline approaching    | "Client GST filing overdue, no response in 3 weeks"            |
> | Customer going quiet    | "Regular customer hasn't ordered in 30 days"                   |
> | Revenue changing        | "Monthly sales down 20% from top 3 accounts"                   |
> | Goal at risk            | "API adoption at 23% — target was 60% by Q3"                   |
> | Support escalation      | "8 open tickets, 3 are P1"                                     |
> | Data going stale        | "Last sync from Salesforce: 3 days ago"                        |
> | Knowledge conflict      | "Two AI sessions disagree on the client's budget"              |
> | Missing context         | "$125K account, no emails or docs linked"                      |
> | Multiple signals firing | "Payment failed + order cancelled + complaint — same customer" |
>
> Every insight answers 4 questions: What happened. Why it matters. What you could do. What happens if you ignore it.
> Maximum 3 per entity per day. No alert fatigue.
>
> ### The Approval Gate
>
> Nothing happens without your OK. This isn't a setting you can turn off — it's how the system is built.
>
> 1. The Twin generates a recommendation — with evidence from all three layers
> 2. You see the reasoning — which data, from which tools, how confident
> 3. You approve, modify, or dismiss
> 4. Only approved actions execute — with full audit trail
>
> When an action executes (create a task, send a reminder, flag for the team), the result flows back into the system. The Twin sees what happened and learns from it. Dismissed actions also teach — future proposals improve based on your decisions.
>
> ### TruthLayer — Governing Knowledge Memory
>
> When the Twin learns something new about your business — from a conversation, a session, a pattern it detected — it doesn't just write it down. It proposes it to you:
>
> - What it found
> - Where it came from (which AI, which session, which data)
> - How confident it is (0-100%)
> - Whether it conflicts with existing knowledge
>
> You approve, reject, or edit. Only confirmed knowledge enters the memory. Any AI you use (Claude, GPT, Gemini) reads from the same verified knowledge base. No AI can write without your approval.

### Integrations (/integrations) — NEEDS EXPANSION

**Current state:** Shows ~22 connectors. The registry has 65+.

**Show the full catalog:**

| Category           | Count | Connectors                                                                                           |
| ------------------ | ----- | ---------------------------------------------------------------------------------------------------- |
| CRM                | 6     | Salesforce, HubSpot, Pipedrive, Zoho CRM, Freshsales, Close                                          |
| Support            | 9     | Zendesk, Freshdesk, Intercom, Front, Help Scout, Kustomer, Freshworks CRM, WhatsApp Business, Twilio |
| Billing            | 6     | Stripe, Chargebee, Paddle, QuickBooks, Xero, FreshBooks                                              |
| Marketing          | 8     | HubSpot Marketing, Mailchimp, Marketo, Braze, Segment, SendGrid, Customer.io, ActiveCampaign         |
| Analytics          | 6     | Google Analytics, Mixpanel, Amplitude, Heap, Tableau, Metabase                                       |
| Communication      | 7     | Gmail, Outlook, Slack, Microsoft Teams, Discord, Zoom, Google Calendar                               |
| Productivity       | 7     | Notion, Google Drive, Dropbox, OneDrive, Airtable, Calendly, Confluence                              |
| Project Management | 6     | Jira, Asana, Linear, Monday.com, ClickUp, Trello                                                     |
| Engineering        | 3     | GitHub, GitLab, Bitbucket                                                                            |
| E-Commerce         | 3     | Shopify, WooCommerce, BigCommerce                                                                    |
| AI                 | 3     | OpenAI, MCP, AI Chat                                                                                 |
| HR                 | 1     | BambooHR                                                                                             |

Remove PostgreSQL and Zapier from the connector list (not in the unified registry). If you want to mention custom database connections and Zapier bridge, put them in a separate "Custom & Bridge" section.

### Security (/security)

**Fix:**

- Remove "HIPAA" compliance package claim
- Change "Data residency options" to "Data residency options (coming soon)" or remove
- Keep: Encryption, SOC 2 aligned, audit trails, RBAC, SSO, approval gate

### Pricing (/pricing)

**Fix CTAs:**

- Starter: "Book a Demo" (not "Get started")
- Growth: "Book a Demo" (keep)
- Command: "Contact Sales" (keep)

**Verify India tab shows:** ₹999 / ₹2,999 / ₹7,999
**International tab shows:** $49 / $99 / $199 (same for UAE and all non-India markets — no separate UAE pricing)

**Add tier differentiation by three layers:**

|                         | Starter       | Growth                               | Command                            |
| ----------------------- | ------------- | ------------------------------------ | ---------------------------------- |
| Truth (your data)       | Yes           | Yes                                  | Yes                                |
| Context (conversations) | Yes           | Yes                                  | Yes                                |
| Knowledge Memory        | Read-only     | Basic (auto-approve high confidence) | Full TruthLayer with governance    |
| AI insights             | Basic signals | Context-aware insights               | Full reasoning across all 3 layers |
| Connectors              | Up to 5       | Up to 15                             | Unlimited                          |
| Sync frequency          | 4h            | 1h                                   | 15min                              |
| Duplicate resolution    | Basic         | Advanced                             | Advanced + human review            |

### About (/about)

**Current state:** Strong founder story. Well-written. The $8M account save narrative is compelling.

**Verify:** Founding year. The page says 2025, the context transfer says "Mule Nexus (2024) → IntegrateWise." Confirm with founder.

### Footer

**Verify these pages exist before linking:**

- /blog — if empty, remove or show "Coming soon"
- /docs — if empty, remove or link to VitePress docs site
- /changelog — if empty, remove or show "Coming soon"
- /resources — if empty, remove or show "Coming soon"

---

## LANGUAGE RULES

### Never Say on the Website

- "Platform" / "OS" / "Tool" / "B2B SaaS"
- "We replace [competitor]"
- "Start Free" (until self-serve is live, M3+)
- Architecture terms: Spine, Entity 360, Flow A/B/C, 8-stage pipeline, RLS, KV, D1, Queues, Workers
- "51 connectors" (old number — use "70+")

### Always Say

- "Knowledge Workspace"
- "Book a Demo" / "Join Early Access" (M1-3 CTAs)
- "The Twin" when referring to the AI (not "AI assistants," not "AI agents," not "intelligence layer")
- "The Twin thinks in context" (not "AI remembers the truth")
- "Your data, your conversations, your knowledge" (all three layers)
- "Nothing happens without your approval"
- "70+ integrations"

### The Twin Rule

There is ONE AI in IntegrateWise: the Twin. It does everything — watches, reasons, proposes, learns. Do NOT invent multiple AI assistants, agents, bots, or specialized roles on the website. The /ai page currently shows "7 specialized AI assistants" — this is wrong. Delete it. Replace with the Twin.

### Translation Table (Architecture → Website Language)

| Architecture Term        | Website Language                                                           |
| ------------------------ | -------------------------------------------------------------------------- |
| Spine                    | Single source of truth / one unified record                                |
| Entity 360               | Complete view of any account in one click                                  |
| 8-stage pipeline         | Your data is automatically cleaned and organized                           |
| Flow A (structured)      | Your data from connected tools (Truth)                                     |
| Flow B (unstructured)    | Your conversations and documents (Context)                                 |
| Flow C (AI sessions)     | AI session memory that compounds over time (Knowledge Memory)              |
| Twin Trigger Engine      | The Twin — watches your business and tells you what matters                |
| TruthLayer               | The Twin proposes, you approve — nothing enters knowledge without your say |
| HITL / Govern            | You approve every action before it happens                                 |
| Identity Resolution S7.5 | Duplicate detection with human review                                      |
| RLS tenant isolation     | Your data is completely private                                            |
| Spine DB RPC             | Direct database access — fast, no middleman                                |
| Cloudflare Workers       | Fast everywhere — loads instantly, globally                                |
| KV cache                 | Instant loading for frequently accessed data                               |

---

## CURRENT PHASE: M1-3 (Founder-Led)

- All CTAs: "Book a Demo" or "Join Early Access"
- No "Start Free" anywhere
- No "Connect your first tool in 2 minutes"
- No "No credit card"
- Personal Ops: "Join Waitlist" (not live until M6)
- Pricing: Contact-gated for Growth and Command tiers
- Starter: "Join Early Access" or "Book a Demo"

---

## PRODUCT NAMES (Internal Only — NOT on Website)

20 products exist across 3 surfaces and 3 tiers. These names are for internal alignment, sales conversations, and documentation only. The website shows the three surfaces (Account Success, Business Ops, Personal Space) and the three tiers (Data + Dashboards, Twin Observes + Suggests, Twin Proposes + Learns) — never individual product names.

### Account Success (8)

| Tier       | Product        | One-Liner                                                   |
| ---------- | -------------- | ----------------------------------------------------------- |
| No AI      | DataSentinel   | Data quality monitoring, duplicate detection, sync health   |
| No AI      | VaultGuard     | Contract repository, renewal calendar, entitlement tracking |
| No AI      | ArchitectIQ    | Integration landscape mapping, connector health             |
| No AI      | TemplateForge  | Playbook engine, QBR templates, onboarding workflows        |
| Basic Twin | SuccessPilot   | Account health scoring, risk flags, suggested next actions  |
| Basic Twin | DealDesk       | Expansion signals, upsell tracking, commercial intelligence |
| Full Twin  | ChurnShield    | Predict churn before scores move, draft intervention plans  |
| Full Twin  | SuccessCommand | Full command center, strategic advisor, board-level reports |

### Business Ops (7)

| Tier       | Product         | One-Liner                                                    |
| ---------- | --------------- | ------------------------------------------------------------ |
| No AI      | ComplianceVault | Filings, governance docs, regulatory tracking                |
| No AI      | VendorGuard     | Vendor management, contracts, SLA tracking                   |
| No AI      | PartnerBridge   | Partner ecosystem mapping, channel tracking                  |
| Basic Twin | GrowthDesk      | Pipeline, GTM tracking, bottleneck detection                 |
| Basic Twin | HirePilot       | Hiring pipeline, team planning, onboarding tracking          |
| Full Twin  | FinPulse        | Cash flow monitoring, burn rate projection, financial alerts |
| Full Twin  | OpsCore         | Full business command center, weekly briefs                  |

### Personal Space (5)

| Tier       | Product         | One-Liner                                           |
| ---------- | --------------- | --------------------------------------------------- |
| No AI      | WealthPilot     | Personal finance tracking, budgeting, net worth     |
| No AI      | WellnessCore    | Health metrics, fitness tracking, wellness routines |
| Basic Twin | LearningDesk    | Courses, certifications, skill development          |
| Basic Twin | RelationshipMap | Personal CRM, network management                    |
| Full Twin  | LifeOps         | Full personal command center, life operating system |

---

## CONNECTOR CATALOG (70+ Integrations)

### By Category

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

### India/UAE Connectors (Planned/In Progress)

Tally, Razorpay, PhonePe, Vyapar, Khatabook, Shiprocket, Google Sheets, Zoho Books, PayTabs, Network International, Noon Seller, Aramex

---

_This is the complete context transfer. Every page, every fix, every piece of content. Build to this. Ship to this._
