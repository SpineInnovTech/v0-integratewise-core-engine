# IntegrateWise — Complete Positioning & Product Context

> This document is the single source of truth for anyone building the website,
> writing sales copy, designing Figma screens, or having a sales conversation.
> Read this before you touch anything customer-facing.

---

## Canonical Internal Doctrine Guardrail

- User Workbench = the projection-native customer/product shell.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- OpenWebUI is not the customer-facing product shell.
- When this doc uses public-facing language like "Workbench", interpret that internally as the User Workbench unless stated otherwise.
- Twin / OpenWebUI runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

---

## TABLE OF CONTENTS

1. What IntegrateWise Is
2. The Core Problem We Solve
3. The Three Product Families (Sold Through the User Workbench)
4. The 20 Products (Complete Definitions)
5. TruthLayer — The Platform Capability That Makes Everything Trustworthy
6. The Three Twin Tiers (Pricing Architecture)
7. How to Position on the Website
8. How to Position in Sales Conversations
9. Industry Positioning (Same Product, Different Context)
10. Competitive Landscape
11. Pricing Grid
12. Key Messages and Lines
13. What We Never Say
14. Platform Domains (Functional, Not Marketed)
15. Technical Context for Implementers

---

## 1. WHAT INTEGRATEWISE IS

IntegrateWise is a Knowledge Workspace built on the Spine, powered by governed AI.

It connects every tool a business or individual uses into one workspace. It normalizes data into a single source of truth (the Spine), assembles a complete 360-degree view of every entity (Entity 360), and uses AI (the Twin) to surface evidence-backed insights. The AI only acts with human approval, and only remembers what you verify (TruthLayer).

**One-liner:** "A Knowledge Workspace over the Spine, powered by AI."

**Trust line:** "Every AI remembers. Only IntegrateWise remembers the truth."

**Hero anchor:** "Your tools don't talk to each other. Your AI doesn't know context. You are the bridge. The Human API."

**Tagline for close:** "Enter the workspace to break your chaos."

---

## 2. THE CORE PROBLEM WE SOLVE

Every person who manages accounts, runs a business, or organizes their life faces the same problem:

- Their tools don't talk to each other
- Their AI doesn't know context across tools
- They are the integration layer — the Human API — copying, pasting, summarizing, bridging

This is universal. A SaaS CSM checking 8 tools to understand one account has the same structural problem as a CA checking WhatsApp + Tally + Razorpay, a hotel manager checking PMS + Booking.com + reviews, or a freelancer juggling Gmail + Calendar + invoicing.

**The cost:**

- 2-4 hours/day wasted on data gathering across tools
- Missed signals (churn, overdue invoices, complaints, opportunities)
- AI that hallucinates because it has no verified context
- Decisions made on gut feel instead of connected data

**What we fix:**

- Connect tools (70+ connectors, OAuth, 2 minutes)
- Resolve entities (8-stage pipeline, identity resolution, one record per entity)
- Reason with evidence (Twin triggers, 4-question standard: what/why/do/risk)
- Remember only truth (TruthLayer — AI proposes, you approve, nothing hallucinated)

---

## 3. THE THREE PRODUCT FAMILIES (Sold Through the User Workbench)

We sell three things. These are the products. Everything else is platform capability.

### Account Success

Universal relationship management for anyone who manages accounts, clients, customers, patients, students, tenants — in any industry.

- **Who:** CSMs, Account Managers, CAs, Hotel Managers, Freelancers, Agency Owners, anyone with a book of accounts/clients
- **What it answers:** "How are my accounts doing?"
- **View orientation:** Account-centric — every view centers on an entity (account, client, customer)
- **Key metric:** Account health score
- **AI focus:** Relationship risk signals, churn prediction, expansion detection
- **MuleSoft/iPaaS is a focus vertical** — we have deep domain expertise here, lead demos with MuleSoft examples, but the product works for any industry

### Business Ops

Universal operational visibility for anyone who runs a business or a function within a business.

- **Who:** Founders, CEOs, COOs, CIOs/CTOs, Operations Leads, Agency Owners
- **What it answers:** "How is my business doing?"
- **View orientation:** Function-centric — cross-department visibility
- **Key metric:** Business KPIs (MRR, pipeline, burn, team health)
- **AI focus:** Operational bottleneck signals, financial anomalies, cross-function patterns

### Personal Space

Private workspace for individual productivity, growth, and life management.

- **Who:** Everyone — individuals, freelancers, solopreneurs, students, professionals
- **What it answers:** "How is my life organized?"
- **View orientation:** Self-centric — goals, habits, finances, learning, relationships
- **Key metric:** Personal progress across life domains
- **AI focus:** Life pattern detection, follow-up reminders, learning path suggestions

---

## 4. THE 20 PRODUCTS (Complete Definitions)

Products are organized by surface and Twin tier. The Twin tier determines the level of AI involvement and maps directly to pricing.

### ACCOUNT SUCCESS — 8 Products

#### No Twin Tier (Data + Dashboards)

**1. DataSentinel**
Data quality monitoring, anomaly detection, identity resolution, sync health.

- **Roles:** CS Ops, RevOps, Data Analysts
- **Features:**
  - Data quality scores per entity and per source
  - Anomaly alerts (field values outside expected range, sudden changes)
  - Sync status dashboard (connector health, last sync, error count, records processed)
  - Data gap reports (entities missing key fields, sources not connected)
  - Identity Resolution: Full HITL workflow — merge, keep-separate, defer
    - Side-by-side comparison UI showing both entity records
    - Deterministic matching (email, domain, external ID) + probabilistic (name similarity, firmographic)
    - Confidence scoring on every match candidate (0.0-1.0)
    - Full audit trail on every resolution decision
    - Duplicate detection across all connected sources
- **Data source:** 8-stage pipeline metrics, Spine entity data, connector status
- **Why it matters:** Dirty data makes every other product unreliable. DataSentinel is the foundation.

**2. VaultGuard**
Contract repository, renewal calendar, entitlement tracking, document storage.

- **Roles:** CS Ops, Deal Desk, Legal
- **Features:**
  - Contract library with version history and document storage (R2)
  - Renewal calendar with health overlay (shows account health next to renewal date)
  - Entitlement map (what the customer is entitled to vs. what they're using)
  - Expiry timeline (contracts, licenses, certifications approaching expiry)
  - Document versioning with source attribution
- **Data source:** Spine contract/renewal entities, R2 document storage
- **Why it matters:** Renewals are revenue. Missing a renewal date or misunderstanding entitlements costs real money.

**3. ArchitectIQ**
Integration landscape mapping, technical health, connector management, dependency tracking.

- **Roles:** Solution Architects, Technical CSMs, Platform Engineers
- **Features:**
  - Stack visualization (which tools are connected, data flow between them)
  - Dependency map (which entities depend on which connectors)
  - Connector health monitoring (sync status, error rates, field mapping quality)
  - Change impact analysis (if connector X goes down, which entities/views are affected)
  - Connector management UI: OAuth setup, sync scheduling, field mapping review, error diagnostics
  - Domain-based filtering (show only connectors relevant to the user's department)
- **Data source:** Connector service, pipeline metrics, Spine entity metadata
- **Why it matters:** For technical buyers, integration health IS account health. ArchitectIQ speaks their language.

**4. TemplateForge**
Playbook engine, QBR templates, onboarding workflows, escalation scripts.

- **Roles:** CS Leaders, Enablement, Junior CSMs
- **Features:**
  - Template library (QBR decks, onboarding checklists, escalation scripts, renewal playbooks)
  - Variable injection from Entity 360 data (auto-populate templates with real account data)
  - Auto-populated presentation decks (pull health score, ARR, key contacts, recent signals)
  - Workflow triggers (template auto-assigned when Twin fires specific trigger)
  - Shareable across team with role-based access
- **Data source:** Entity 360 API for variable injection, template storage
- **Why it matters:** Junior CSMs need structure. Senior CSMs need speed. TemplateForge gives both.

#### Basic Twin Tier (Twin observes + suggests, you drive)

**5. SuccessPilot**
Account health scoring with Twin that highlights patterns and suggests next actions. You decide, you execute.

- **Roles:** CSMs, Account Managers, Relationship Managers (any industry)
- **Features:**
  - Health dashboard (the Accounts Hub daily operating view)
    - My Day cards: engagements today, tasks due, open risks, upcoming renewals/due dates
    - My KPIs: average health score, total value, account count
    - Health filter: all / healthy / at-risk / critical
    - Account list sorted by health score
  - Risk flags from Twin trigger engine (10 triggers, evidence-backed)
  - Twin-suggested next actions ("Schedule check-in with Acme — usage dropped 42%")
  - Account timeline (unified activity stream across all connected tools)
  - Basic pattern recognition (Twin learns what you dismiss vs. act on over time)
  - Twin reads from TruthLayer verified memory for context
- **Data source:** Entity 360 (all 6 layers), Twin trigger engine
- **UI:** Accounts Hub — the daily operating view
- **Industry-adaptive:** Shows ARR for SaaS, invoice status for CAs, booking frequency for hospitality, order frequency for retail
- **Why it matters:** This is the entry point for most Account Success buyers. It replaces the 8-tab morning routine.

**6. DealDesk**
Expansion signals, upsell tracking, commercial intelligence with Twin that spots revenue opportunities.

- **Roles:** AMs, RevOps, Sales Reps
- **Features:**
  - Expansion signal detection (seat utilization > 85%, feature adoption increasing, positive sentiment)
  - Upsell pipeline (accounts showing expansion signals, ranked by opportunity size)
  - Twin-spotted commercial patterns ("3 accounts in this segment expanded after hitting 90% utilization")
  - Revenue forecasting based on expansion signals + renewal data
  - Deal stage tracking with health overlay
- **Data source:** Entity 360 (truth + signals layers), Spine deal/opportunity entities
- **Why it matters:** Most CS platforms focus on retention. DealDesk focuses on growth — the revenue CS leaders need to justify their budget.

#### Full Twin + TruthLayer Tier (Twin proposes, drafts, learns — HITL governs)

**7. ChurnShield**
Twin reads weak signals across every connected system weeks before scores move, drafts intervention plans, learns from outcomes.

- **Roles:** VP Customer Success, CS Leaders, Head of Retention
- **Features:**
  - Predictive churn detection (Twin correlates signals across Spine, Context, Signals, Memory layers)
  - Cross-system weak signal correlation ("Usage down + support tickets up + no exec engagement + renewal in 60 days = high churn risk")
  - Auto-drafted intervention plans (Twin proposes specific actions with evidence)
  - HITL approval workflow on all intervention proposals (Govern gate)
  - Outcome-based learning loop (Twin tracks which interventions saved accounts vs. didn't, improves over time)
  - Portfolio-level risk heatmap (all accounts, color-coded, sorted by risk)
  - TruthLayer integration:
    - Triage bot watches every customer interaction across all connected tools
    - Proposes memory entries ("Customer X mentioned budget freeze in last QBR")
    - You approve → becomes verified account memory
    - Twin operates on confirmed truth, not inferred guesses
    - No hallucinated risk score triggers a false alarm to the CRO
- **Data source:** Full Entity 360 (all 6 layers), Twin trigger engine, TruthLayer verified memory
- **UI:** Intelligence Center — portfolio management view
- **Why it matters:** This is the product that justifies enterprise pricing. Churn prediction with evidence and governed actions is what CS leaders have been asking for.

**8. SuccessCommand**
Full Entity 360 command center. Twin operates across all account data as a unified strategic advisor.

- **Roles:** VP/SVP Customer Success, CRO, Chief Customer Officer
- **Features:**
  - Unified Entity 360 view (all 6 layers for every account in the portfolio)
  - Twin-generated account strategies ("Acme needs exec re-engagement + QBR + usage workshop")
  - Auto-drafted executive summaries (Twin writes, you review and approve)
  - Portfolio optimization proposals ("Move 3 accounts from CSM A to CSM B based on workload + health")
  - Cross-product intelligence (patterns across ChurnShield + DealDesk + DataSentinel)
  - Full learning memory across all interactions (TruthLayer)
  - Board-ready metrics export (retention, NRR, health distribution, revenue at risk)
- **Data source:** Full Entity 360, all Twin products' outputs, TruthLayer
- **UI:** Strategic View — executive dashboard
- **Why it matters:** This is the product for the buyer who signs the check. Board-level visibility with AI they can trust.

### BUSINESS OPS — 7 Products

#### No Twin Tier (Data + Dashboards)

**9. ComplianceVault**
Filings, governance docs, regulatory tracking, audit readiness.

- **Roles:** Legal, Admin, Compliance Officers, Founders
- **Features:**
  - Document repository with categorization (filings, licenses, policies, agreements)
  - Filing calendar with deadline alerts (GST, VAT, trade license, visa expiry, tax deadlines)
  - Regulatory checklist per jurisdiction (India, UAE, US — configurable)
  - Audit trail on every document change (who uploaded, when, version history)
  - Expiry alerts (licenses, certifications, contracts approaching expiry)
  - Govern integration: compliance-related actions gated through approval workflow
- **Data source:** Spine compliance entities, R2 document storage
- **Why it matters:** For India SMB (GST filings), UAE FZE (trade license, VAT), and enterprise (SOC 2, GDPR) — compliance is non-negotiable. This is a hook product for regulated industries.

**10. VendorGuard**
Vendor management, contracts, SLA tracking, spend visibility.

- **Roles:** Ops Leads, Procurement, Finance
- **Features:**
  - Vendor directory with contact info, contract terms, SLA commitments
  - Contract tracker with renewal dates and auto-renewal flags
  - SLA monitoring (response time, uptime, delivery commitments vs. actuals)
  - Spend dashboard (total spend per vendor, trend over time, budget vs. actual)
  - Renewal alerts (vendor contracts approaching renewal)
- **Data source:** Spine vendor/procurement entities, billing connectors
- **Why it matters:** Every business has vendors. Most track them in spreadsheets. VendorGuard makes it visible.

**11. PartnerBridge**
Partner ecosystem mapping, channel tracking, co-sell coordination.

- **Roles:** BD Leads, Partnership Managers, Channel Sales
- **Features:**
  - Partner directory with tier, region, specialization
  - Deal registration and co-sell pipeline tracking
  - Partner health scores (engagement frequency, deal volume, satisfaction)
  - Collaboration log (meetings, emails, shared docs with each partner)
  - Channel performance analytics (revenue per partner, conversion rates)
- **Data source:** Spine partner entities, CRM connectors
- **Why it matters:** For companies with partner/channel programs, this replaces the spreadsheet that tracks partner deals.

#### Basic Twin Tier (Twin observes + suggests, you drive)

**12. GrowthDesk**
Pipeline, GTM tracking, campaign performance with Twin that spots what's working and what's stalling.

- **Roles:** Growth Leads, Marketing Ops, Founders
- **Features:**
  - Pipeline dashboard (deals by stage, value, velocity)
  - Campaign tracker (spend, leads generated, conversion rate per channel)
  - Twin-flagged bottlenecks ("LinkedIn campaign generating leads but 0% converting past demo stage")
  - Channel performance signals (which channels are ROI-positive, which are burning budget)
  - Suggested focus areas ("Double down on referral channel — 3x conversion rate vs. paid")
  - Twin reads from TruthLayer for verified GTM context
- **Data source:** Spine deal/campaign entities, marketing connectors, CRM connectors
- **Why it matters:** Founders and growth leads need to know what's working NOW, not in a monthly report.

**13. HirePilot**
Hiring pipeline, team planning, onboarding tracking with Twin that flags gaps and suggests timing.

- **Roles:** Founders, HR/People Ops, Hiring Managers
- **Features:**
  - Role pipeline (open roles, candidates per stage, time-to-fill)
  - Candidate tracking (source, stage, interviewer notes, decision status)
  - Onboarding checklist (new hire tasks, equipment, access provisioning, training)
  - Twin-suggested hiring priorities ("Engineering team at 120% capacity — prioritize backend hire")
  - Workload signal integration (Twin reads team capacity data to suggest when to hire)
- **Data source:** Spine HR entities, project management connectors, communication connectors
- **Why it matters:** Hiring at the wrong time (too early or too late) is one of the top startup killers.

#### Full Twin + TruthLayer Tier (Twin proposes, drafts, learns — HITL governs)

**14. FinPulse**
Twin watches cash flow, burn, invoicing, revenue patterns continuously. Proposes budget adjustments, flags anomalies, drafts financial summaries.

- **Roles:** Founders, CFO, Finance Leads
- **Features:**
  - Cash flow monitoring (real-time inflows/outflows from connected billing/banking)
  - Burn rate projection (monthly burn, runway calculation, trend)
  - Twin-generated financial alerts ("Revenue dropped 15% MoM — investigate churn + delayed invoices")
  - Auto-drafted monthly financial summaries (Twin writes, you review and approve)
  - Budget reallocation proposals ("Marketing spend ROI dropped — shift 20% to referral program")
  - Invoice tracking and payment status
  - TruthLayer integration:
    - Triage bot watches financial data and vendor communications
    - Proposes memory entries ("Vendor Y invoice is 22% above contracted rate")
    - You approve → becomes verified operational truth
    - No hallucinated financial projections in board decks
  - HITL approval on ALL financial actions and proposals
- **Data source:** Spine finance entities, billing connectors (Stripe, Razorpay, QuickBooks, Xero), TruthLayer
- **Why it matters:** Financial data is the highest-stakes data. AI that hallucinates financial projections is dangerous. FinPulse with TruthLayer is the only safe option.

**15. OpsCore**
Full Entity 360 of the business. Twin operates across all operational data as a unified operating advisor.

- **Roles:** Founders, CEOs, COOs, Chief of Staff
- **Features:**
  - Unified business Entity 360 (finance + hiring + vendors + growth + compliance in one view)
  - Twin-generated weekly briefs ("3 things that need your attention this week" with evidence)
  - Operational rhythm automation (Monday brief, Friday review, monthly board prep)
  - Cross-function pattern detection ("Hiring delays are causing support SLA breaches")
  - Decision proposals with HITL ("Propose: delay Q2 marketing spend, redirect to engineering hiring")
  - Full learning memory (TruthLayer — Twin remembers every decision you made and its outcome)
  - Executive Suite views: CEO dashboard, COO command center, CIO/CTO technology view
- **Data source:** Full Entity 360 across all business entities, all Twin products' outputs, TruthLayer
- **UI:** Ops Cockpit + Executive Suite (CEO/COO/CIO views) + Founder Ops view
- **Why it matters:** This is the "one dashboard to run your business" product. The founder's governed workspace.
