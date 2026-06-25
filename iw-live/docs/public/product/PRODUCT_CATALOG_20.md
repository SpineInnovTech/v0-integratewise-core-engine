# IntegrateWise — Complete Product Catalog

> 3 product families. 20 products. 1 TruthLayer.
> AI proposes. You approve. Truth is written once. Every AI reads from it.

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

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    3 PRODUCT FAMILIES (Sold via User Workbench)                  │
│                                                                 │
│  Account Success (8)    Business Ops (7)    Personal Space (5)  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    3 TWIN TIERS                                 │
│                                                                 │
│  No Twin          Basic Twin           Full Twin                │
│  Data +           Twin observes +      Twin proposes, drafts,   │
│  Dashboards       suggests, you drive  learns — HITL governs    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ★ TRUTHLAYER ★                               │
│                                                                 │
│  Approval-gated memory. Triage bot scores every AI output.      │
│  Human approves before anything becomes Spine truth.            │
│  Any AI reads. Nothing writes without your say.                 │
│  The reason Full Twin products are worth buying.                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    PLATFORM ENGINE                              │
│                                                                 │
│  Spine · Entity 360 · 8-Stage Pipeline · 70+ Connectors        │
│  Twin Trigger Engine · Identity Resolution · Govern · Trust     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## TruthLayer — The Platform Capability

TruthLayer is not a product. It is the named capability that appears in every Full Twin product and is THE reason someone upgrades from Basic Twin to Full Twin.

**What it does:** Every AI interaction — conversations, tool outputs, data syncs, agent suggestions — passes through a triage bot. The bot scores confidence, extracts entities, detects conflicts with existing memory. It proposes memory entries. You approve or reject. Only approved entries become Spine truth. That truth is open — any AI reads from it. Nothing writes without your approval.

**Where it appears:**

- Every Full Twin product includes TruthLayer
- Basic Twin products read from TruthLayer but have limited write (auto-approve for high-confidence only)
- No Twin products benefit from the verified data TruthLayer ensures

**The positioning:**

> "Every AI remembers. Only IntegrateWise remembers the truth."

**Competitive gap:** ChatGPT, Gemini, Copilot, Mem0 — all let AI write to memory automatically. None have triage scoring, approval gates, or open-read architecture. Guru has approval workflows but only for enterprise knowledge articles. Nobody has what TruthLayer does across personal + business + account contexts.

---

## ACCOUNT SUCCESS — 8 Products

Universal relationship management. Any industry where you manage accounts, clients, customers, patients, students, tenants. MuleSoft/iPaaS is a focus vertical.

### No Twin (Data + Dashboards)

**1. DataSentinel**
Data quality monitoring, anomaly detection, identity resolution, sync health.

- Roles: CS Ops, RevOps, Data Analysts
- Features: Quality scores, anomaly alerts, sync status, data gap reports
- Identity Resolution: Full HITL workflow — merge, keep-separate, defer with side-by-side comparison UI, confidence scoring, audit trail on every resolution decision
- Duplicate detection across all connected sources with deterministic + probabilistic matching

**2. VaultGuard**
Contract repository, renewal calendar, entitlement tracking, document storage.

- Roles: CS Ops, Deal Desk, Legal
- Features: Contract library, renewal alerts, entitlement map, expiry timeline, document versioning

**3. ArchitectIQ**
Integration landscape mapping, technical health, connector management, dependency tracking.

- Roles: Solution Architects, Technical CSMs, Platform Engineers
- Features: Stack visualization, dependency map, connector health monitoring, change impact analysis
- Connector management: OAuth setup, sync scheduling, field mapping review, error diagnostics, domain-based filtering

**4. TemplateForge**
Playbook engine, QBR templates, onboarding workflows, escalation scripts.

- Roles: CS Leaders, Enablement, Junior CSMs
- Features: Template library, variable injection from Entity 360 data, auto-populated decks, workflow triggers

### Basic Twin (Twin observes + suggests, you drive)

**5. SuccessPilot**
Account health scoring with Twin that highlights patterns and suggests next actions. You decide, you execute.

- Roles: CSMs, Account Managers, Relationship Managers
- Features: Health dashboard (Accounts Hub), risk flags, Twin-suggested next actions, account timeline, basic pattern recognition
- Twin reads from TruthLayer verified memory for context
- Twin learns what you dismiss vs. act on
- UI: Accounts Hub daily operating view

**6. DealDesk**
Expansion signals, upsell tracking, commercial intelligence with Twin that spots revenue opportunities from account behavior.

- Roles: AMs, RevOps, Sales Reps
- Features: Expansion signal detection, upsell pipeline, Twin-spotted commercial patterns, revenue forecasting, deal stage tracking

### Full Twin + TruthLayer (Twin proposes, drafts, learns — HITL governs)

**7. ChurnShield**
Twin reads weak signals across every connected system weeks before scores move, drafts intervention plans, learns from save/loss outcomes.

- Roles: VP Customer Success, CS Leaders, Head of Retention
- Features: Predictive churn detection, cross-system weak signal correlation, auto-drafted intervention plans, outcome-based learning loop, portfolio-level risk heatmap
- TruthLayer: Triage bot watches every customer interaction. Proposes memory entries ("Customer X mentioned budget freeze"). You approve. Twin operates on confirmed truth, not inferred guesses.
- HITL approval workflow on all intervention proposals
- UI: Intelligence Center portfolio view

**8. SuccessCommand**
Full Entity 360 command center. Twin operates across all account data as a unified strategic advisor.

- Roles: VP/SVP Customer Success, CRO, Chief Customer Officer
- Features: Unified Entity 360 view, Twin-generated account strategies, auto-drafted exec summaries, portfolio optimization proposals, cross-product intelligence, full learning memory
- TruthLayer: Full verified memory across all accounts. Twin proposes strategic moves, drafts board-level reports — all through approval gate.
- UI: Strategic View executive dashboard

---

## BUSINESS OPS — 7 Products

Universal operational visibility. Any business, any size, any function.

### No Twin (Data + Dashboards)

**9. ComplianceVault**
Filings, governance docs, regulatory tracking, audit readiness.

- Roles: Legal, Admin, Compliance Officers
- Features: Document repository, filing calendar, regulatory checklist, audit trail, expiry alerts
- Govern integration: All compliance actions gated through approval workflow

**10. VendorGuard**
Vendor management, contracts, SLA tracking, spend visibility.

- Roles: Ops Leads, Procurement, Finance
- Features: Vendor directory, contract tracker, SLA monitoring, spend dashboard, renewal alerts

**11. PartnerBridge**
Partner ecosystem mapping, channel tracking, co-sell coordination.

- Roles: BD Leads, Partnership Managers, Channel Sales
- Features: Partner directory, deal registration, co-sell pipeline, partner health scores, collaboration log

### Basic Twin (Twin observes + suggests, you drive)

**12. GrowthDesk**
Pipeline, GTM tracking, campaign performance with Twin that spots what's working and what's stalling.

- Roles: Growth Leads, Marketing Ops, Founders
- Features: Pipeline dashboard, campaign tracker, Twin-flagged bottlenecks, channel performance signals, suggested focus areas
- Twin reads from TruthLayer for verified GTM context

**13. HirePilot**
Hiring pipeline, team planning, onboarding tracking with Twin that flags gaps and suggests timing.

- Roles: Founders, HR/People Ops, Hiring Managers
- Features: Role pipeline, candidate tracking, onboarding checklist, Twin-suggested hiring priorities based on workload signals

### Full Twin + TruthLayer (Twin proposes, drafts, learns — HITL governs)

**14. FinPulse**
Twin watches cash flow, burn, invoicing, revenue patterns continuously. Proposes budget adjustments, flags anomalies, drafts financial summaries.

- Roles: Founders, CFO, Finance Leads
- Features: Cash flow monitoring, burn rate projection, Twin-generated financial alerts, auto-drafted monthly summaries, budget reallocation proposals
- TruthLayer: Triage bot watches financial data and vendor communications. Proposes memory entries ("Vendor Y invoice 22% above contracted rate"). You approve. No hallucinated financial projections.
- HITL approval on all financial actions

**15. OpsCore**
Full Entity 360 of the business. Twin operates across all operational data as a unified operating advisor.

- Roles: Founders, CEOs, COOs, Chief of Staff
- Features: Unified business Entity 360, Twin-generated weekly briefs, operational rhythm automation, cross-function pattern detection, decision proposals with HITL, full learning memory
- TruthLayer: Full verified memory across all business operations. Twin proposes weekly priorities, drafts decision briefs — all through approval gate.
- UI: Ops Cockpit + Executive Suite (CEO/COO/CIO views)

---

## PERSONAL SPACE — 5 Products

Private workspace for individual productivity, growth, and life management.

### No Twin (Data + Dashboards)

**16. WealthPilot**
Personal finance tracking, budgeting, investment visibility, net worth view.

- Roles: Individuals, Freelancers, Solopreneurs
- Features: Account aggregation, budget tracker, investment dashboard, net worth timeline, expense categorization

**17. WellnessCore**
Health metrics, fitness tracking, nutrition logging, wellness routine management.

- Roles: Individuals, Health-conscious professionals
- Features: Health dashboard, workout log, nutrition tracker, sleep patterns, habit streaks

### Basic Twin (Twin observes + suggests, you drive)

**18. LearningDesk**
Courses, reading, certifications, skill development with Twin that suggests what to learn next based on your goals and gaps.

- Roles: Individuals, Career Builders, Students
- Features: Course tracker, reading list, certification timeline, Twin-suggested learning paths, skill gap detection
- Twin reads from TruthLayer for verified learning progress

**19. RelationshipMap**
Personal CRM, network management with Twin that flags follow-up gaps and suggests who to reconnect with.

- Roles: Freelancers, Solopreneurs, Networkers, Sales professionals
- Features: Contact directory, interaction history, Twin-flagged follow-up reminders, relationship strength signals, context notes

### Full Twin + TruthLayer (Twin proposes, drafts, learns — HITL governs)

**20. LifeOps**
Full personal Entity 360. Twin operates across goals, finances, health, learning, and relationships as a unified life workspace.

- Roles: Individuals, Founders managing life + business, Solopreneurs
- Features: Unified life Entity 360, Twin-generated weekly life brief, cross-domain pattern detection (health affecting work, finances affecting goals), auto-drafted plans, full personal learning memory
- TruthLayer: Triage bot watches goals, health data, learning progress, relationship interactions. Proposes memory entries ("Completed Module 7 of AWS certification"). You approve. Your personal memory is yours — verified, portable, accessible to any AI.
- HITL on all life actions
- UI: Personal knowledge workspace (Memories, Triage Inbox, Sessions, Topics, Search) — LifeOps surfaces personal knowledge here, while approvals remain governed.

---

## Summary Grid

| Tier                       | Account Success                                      | Business Ops                                | Personal Space                |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------- | ----------------------------- |
| **No Twin**                | DataSentinel, VaultGuard, ArchitectIQ, TemplateForge | ComplianceVault, VendorGuard, PartnerBridge | WealthPilot, WellnessCore     |
| **Basic Twin**             | SuccessPilot, DealDesk                               | GrowthDesk, HirePilot                       | LearningDesk, RelationshipMap |
| **Full Twin + TruthLayer** | ChurnShield, SuccessCommand                          | FinPulse, OpsCore                           | LifeOps                       |

**Total: 20 products. 3 product families. 3 tiers. 1 TruthLayer.**

---

## TruthLayer Access by Tier

| Tier       | TruthLayer access    | What it means                                                                                                                           |
| ---------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| No Twin    | Read-only            | Products see verified memory in Entity 360 but don't generate new memory proposals                                                      |
| Basic Twin | Read + limited write | Twin proposes memory entries, auto-approve for high-confidence from trusted sources, human review for rest                              |
| Full Twin  | Full TruthLayer      | Twin proposes, drafts, learns. Full triage pipeline. Full approval workflow. Full learning loop. Conflict detection. Memory versioning. |

---

## Pricing Tier Mapping

| Tier                   | Hook         | Value                                         | Moat                                                   |
| ---------------------- | ------------ | --------------------------------------------- | ------------------------------------------------------ |
| No Twin                | Free / Entry | Data + dashboards get users in                | They see the value of connected data                   |
| Basic Twin             | Retention    | Twin suggestions make them dependent          | They start relying on AI-assisted decisions            |
| Full Twin + TruthLayer | Expansion    | Verified memory + governed AI = irreplaceable | Switching cost is their entire verified knowledge base |

The Twin without verified memory is just another chatbot guessing.
The Twin WITH TruthLayer is an advisor you can actually trust.
That trust delta is the entire pricing gap between Basic Twin and Full Twin.

---

## Audit Gap Resolution

| Gap                            | Resolution                                                                                            | Product                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Approval-Based Personal Memory | Named as **TruthLayer** — platform capability in every Full Twin product                              | ChurnShield, SuccessCommand, FinPulse, OpsCore, LifeOps |
| Identity Resolution HITL       | Expanded in **DataSentinel** — full merge/keep-separate/defer workflow, not just "duplicate flagging" | DataSentinel                                            |
| Personal knowledge workspace   | Mapped to **LifeOps** — Memories, Triage Inbox, Sessions, Topics, Search                              | LifeOps                                                 |
| Connector Management           | Expanded in **ArchitectIQ** — includes OAuth setup, sync scheduling, field mapping, error diagnostics | ArchitectIQ                                             |
| Real-time Presence             | Left as infrastructure — makes Twin signals feel live, not a sellable product yet                     | Platform                                                |
| Govern (Approval Gate)         | Embedded in Full Twin tier + ComplianceVault                                                          | All Full Twin + ComplianceVault                         |
| Trust Layer                    | Embedded in all Twin-enabled products — source attribution, confidence scoring, evidence chains       | All Twin products                                       |

---

## The Sales Narrative

> "Gainsight gives you health scores. We give you verified truth."

> "ChatGPT remembers what it guesses about you. IntegrateWise remembers only what you've confirmed."

> "Every AI on the market writes to memory automatically. We're the only platform where nothing becomes truth without your approval."

> "20 products. 3 product families. 1 truth layer. The first AI workspace people can actually trust."
