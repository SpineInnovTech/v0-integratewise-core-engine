# Positioning Framework — Launch Phase Addendum

> Addresses 6 gaps identified in strategic review.
> Read alongside POSITIONING_FRAMEWORK.md and PRODUCT_CATALOG_20.md.
> This addendum overrides any conflicting guidance in the main framework.

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

## GAP 1: CTA — "Start Free" vs "Book a Demo"

### The Problem

The positioning framework says "Start Free" throughout. But self-serve onboarding is not live at launch. Shipping a "Start Free" button that leads to a broken or manual flow kills trust on first click.

### The Fix — Phase-Based CTAs

| Phase              | Timeline         | Primary CTA        | Secondary CTA       | Why                                                                          |
| ------------------ | ---------------- | ------------------ | ------------------- | ---------------------------------------------------------------------------- |
| M1-3 (Founder-led) | Launch → Month 3 | "Book a Demo"      | "Join Early Access" | No self-serve. All onboarding is founder-led.                                |
| M3-6 (Guided)      | Month 3-6        | "Start Free Trial" | "Book a Demo"       | Self-serve onboarding built. Free tier = 1 connector, 24h sync, 10 entities. |
| M6+ (Product-led)  | Month 6+         | "Start Free"       | "Talk to Sales"     | Full PLG. Free tier is truly self-serve. Growth/Command are self-upgrade.    |

### What to change on the website at launch

- Hero CTA: **"Book a Demo"** (not "Start Free")
- Secondary CTA: **"Join Early Access"** (waitlist form, collects email + company + role)
- Pricing page: Show all 3 tiers but Growth and Command are **"Talk to Sales"** gated
- Starter tier: **"Join Early Access"** (not "Start Free")
- Remove all "No credit card" and "Connect your first tool in 2 minutes" copy until self-serve is live

### When to switch

Switch to "Start Free" only when ALL of these are true:

1. Self-serve signup flow works end-to-end (email → onboarding → workspace)
2. At least 1 connector OAuth flow works without manual intervention
3. Creamy load completes within 2 minutes of connecting a tool
4. The workspace renders with real data (not empty state)

---

## GAP 2: Connector Count — 70+ vs Actual Production-Ready

### The Problem

The registry defines 70+ connector specs (65 in the unified registry plus India/Dubai connectors and accelerators). Production-ready (OAuth tested, field mapping verified, sync modes working) may be a subset.

### The Fix

- On the website: State the **tested and verified** count only
- If all 70+ are production-tested: say "70+ connectors"
- If a subset is tested: say "25+ connectors" (or whatever the real number is) and list the rest as "coming soon" on the connectors page
- The connectors page should show: Live (green badge), Coming Soon (gray badge)

### Verification needed before launch

Run this check for each connector:

1. OAuth flow completes without error
2. Creamy load (30 days) returns data
3. Field mapping produces valid Spine entities
4. Delta sync works on second run

Any connector that passes all 4 = "Live." Others = "Coming Soon."

---

## GAP 3: Entity 360 Demo — Interactive vs Static

### The Problem

The homepage spec calls for an interactive Entity 360 demo. The platform has a live API (GET /api/entity360/:id). But embedding a live API call in a static marketing site adds engineering complexity and failure risk.

### The Fix — Three Options (pick based on timeline)

**Option A: Static JSON (fastest, ship today)**

- Export a JSON snapshot from the Entity 360 API for a demo entity "Acme Corporation"
- Build a React component that renders the 6 layers from static JSON
- No API calls, no failure risk, looks identical to the real product
- Update the JSON monthly or when the product changes

**Option B: Live API with demo tenant (best experience, needs 2-3 days)**

- Seed a demo tenant with Acme Corporation data across all 6 layers
- Build a React component that calls GET /api/entity360/demo-acme
- Progressive rendering: Truth loads first, Context and Signals animate in
- Requires the Gateway to be publicly accessible with CORS for the marketing domain
- Fallback to static JSON if API is unreachable

**Option C: Recorded video/GIF (simplest, least impressive)**

- Record a 30-second screen capture of Entity 360 in the real product
- Embed as autoplay video or animated GIF
- No engineering, but less engaging than interactive

### Recommendation

Ship with Option A (static JSON) for launch. Upgrade to Option B when the Gateway is stable and publicly accessible. Option C is the fallback if neither A nor B is ready.

---

## GAP 4: TruthLayer / Memory Accumulator Demo Readiness

### The Problem

TruthLayer is the central sales pitch for Command tier. But Memory Accumulator was on the defer list. If the triage → approve → write → Twin reads path does not work, Command tier is vaporware.

### The 4-Step Verification (run this week)

**Step 1: D1 Buffer → Triage Bot**

- Send an AI output to the Flow C endpoint
- Verify it appears in D1 buffer
- Verify the triage bot processes it (entity extraction, confidence scoring)
- Pass/Fail: Does a triage result appear?

**Step 2: Triage Inbox → Human Approval**

- Triage inbox → review queue
- Verify the triage result from Step 1 appears as a pending item
- Click Approve
- Pass/Fail: Does the approval action succeed?

**Step 3: Approved Memory → Entity 360**

- After approval in Step 2, check Entity 360 Memory layer for the entity
- Call GET /api/entity360/:id and check the Memory layer
- Pass/Fail: Does the approved memory appear in Entity 360?

**Step 4: Twin Reads Verified Memory**

- Trigger a Twin evaluation for the entity from Step 3
- Check if the Twin insight references the verified memory as evidence
- Pass/Fail: Does the Twin use verified memory in its reasoning?

### What to do based on results

| Steps passing                | Action                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| All 4 pass                   | TruthLayer is demo-ready. Sell all 3 tiers from Day 1.                                                                    |
| Steps 1-3 pass, Step 4 fails | Demo TruthLayer as standalone. Twin integration is "coming in 2 weeks." Sell Starter + Growth. Command is "early access." |
| Steps 1-2 pass, Step 3 fails | Fix the write path (approval → consolidated_memories → Entity 360 read). This is a data wiring issue, not architecture.   |
| Step 1 fails                 | Focus engineering here. The D1 → Triage Bot path is the foundation.                                                       |

### Timeline

- Week 1-2: Ship Storefront (static site)
- Week 2-4: Build/verify TruthLayer demo loop
- Week 4+: First sales demo using live TruthLayer flow

---

## GAP 5: Personal Space — Self-Serve vs Waitlist

### The Problem

Personal Space at Rs999/$49 assumes self-serve at scale. But M1-6 is founder-led B2B sales. Running a consumer self-serve product and a B2B sales motion simultaneously as a solo founder is not feasible.

### The Fix

- M1-6: Personal Space is a **waitlist** on the website. "Coming soon. Join the waitlist."
- The Personal Space surface page exists (shows LifeOps, WealthPilot, etc.) but the CTA is "Join Waitlist" not "Start Free"
- M6+: Open Personal Space self-serve when B2B revenue sustains the business
- The positioning framework correctly includes Personal Space — it shows breadth and vision. But do not ship it as a live product until M6.

### Website implementation

- /personal page: Full content (5 products, 3 tiers, TruthLayer) but CTA = "Join the Waitlist"
- Pricing page: Personal Space column shows prices but marked "Coming Soon"
- Homepage three doors: Personal Space door exists but leads to waitlist page

---

## GAP 6: PLG vs Founder-Led — Launch Phase Distinction

### The Problem

Multiple sections assume product-led growth is operational (free tier, self-serve, auto-upgrade). But M1-3 is founder-led sales.

### The Fix — Phase Map

| Phase | Motion      | Website CTA        | Pricing                                    | Onboarding          |
| ----- | ----------- | ------------------ | ------------------------------------------ | ------------------- |
| M1-3  | Founder-led | "Book a Demo"      | Contact-gated                              | Manual, founder-led |
| M3-6  | Guided PLG  | "Start Free Trial" | Self-serve Starter, contact Growth/Command | Semi-automated      |
| M6+   | Full PLG    | "Start Free"       | Fully self-serve all tiers                 | Fully automated     |

### What this means for the website at launch

- No "Start Free" buttons
- No "Connect your first tool in 2 minutes" copy
- No "No credit card" messaging
- Pricing page shows tiers but is contact-gated for Growth and Command
- Starter is "Early Access" (invite-only)
- All CTAs route to: demo booking (Calendly) or waitlist form (email capture)

---

## STRUCTURAL IMPROVEMENTS

### Split Product Definitions

The positioning framework Part 3 (20 product definitions, 4,000+ words) is too long for a positioning doc. It belongs in a separate file.

**POSITIONING_FRAMEWORK.md** should contain: Parts 1, 2, 4, 5, 6, 7, 8, 9, 10
(positioning, TruthLayer, competitive, pricing, website, sales, summary, never/always)

**PRODUCT_CATALOG_20.md** already contains the full product definitions.
This is the reference for engineering, docs, and detailed sales prep.

### Add Sync Entitlements to Pricing

The pricing section should include sync capabilities as a tangible justification for tier differences:

| Capability        | Starter | Growth   | Command         |
| ----------------- | ------- | -------- | --------------- |
| Sync interval     | 4h      | 1h       | 15min           |
| Records per sync  | 5,000   | 25,000   | 100,000         |
| Records per month | 50,000  | 500,000  | Unlimited       |
| Historical data   | 90 days | 365 days | Unlimited       |
| Max connectors    | 3       | 5-10     | 10+ / Unlimited |
| Delta sync        | Yes     | Yes      | Yes             |
| Full refresh      | Yes     | Yes      | Yes             |
| Two-way sync      | No      | Yes      | Yes             |
| Webhooks          | No      | Yes      | Yes             |

### Add Edge Deployment to Competitive Section

Add this row to the competitive comparison table:

| Edge deployment | 300+ Cloudflare PoPs, 0ms cold starts | Cloud only | Cloud only | Cloud only |

This matters for enterprise buyers in regulated industries (healthcare, financial services) where data processing latency and data residency are concerns.

### Add Progressive Hydration as Sales Feature

The B0→B7 bucket system is a "time to value" story:

- B0→B2 (minutes): Connect a tool, see 30 days of data normalized
- B2→B5 (hours): Twin triggers start firing, insights appear
- B5→B7 (days): Full cognitive mode with verified memory

Sales line: "See value in minutes, not months. Connect one tool and watch your data normalize in real time."

### Add Productized Services Reference

In addition to subscription tiers, IntegrateWise offers 5 productized services for implementation and activation:

1. Spine Foundation Sprint
2. Connector Activation Pack
3. Twin Calibration Workshop
4. TruthLayer Configuration
5. AI Memory Activation

These are sold through sales conversations, not self-serve. Pricing and details in a separate SERVICES.md. Reference them in the pricing section as: "Need help getting started? Our implementation services accelerate time-to-value."

---

## EXECUTION SEQUENCE (Next 72 Hours)

### Today

- Run the 4-step TruthLayer verification
- Audit connector count (how many pass the 4-point production test)
- Decide: Entity 360 demo = Option A (static JSON) or Option B (live API)

### Tomorrow

- Build Storefront using POSITIONING_FRAMEWORK.md + WEBSITE_FIGMA_BUILD_SPEC.md
- Apply all CTA fixes from Gap 1 (Book a Demo, not Start Free)
- Apply connector count from Gap 2 audit
- Apply Entity 360 demo decision from Gap 3

### Day 3

- Ship the site to Cloudflare Pages
- Start Phase 2: LinkedIn assets, sales deck, demo script
- Book first 3 pilot conversations within 7 days of site going live

---

_This addendum is the bridge between strategy and execution. The positioning framework is the what. This addendum is the when and the how. Both are required to ship correctly._

---

## DAY 1 WEBSITE SHIP CHECKLIST

Use this as the QA punch list before pushing to Cloudflare Pages. Every item must be verified.

### Hero Section

- [ ] Primary CTA: "Book a Demo" (NOT "Start Free")
- [ ] Secondary CTA: "Join Early Access" (email capture form)
- [ ] No "No credit card" copy anywhere on the page
- [ ] No "Connect your first tool in 2 minutes" copy anywhere
- [ ] Headline: "Every AI remembers. Only IntegrateWise remembers the truth."
- [ ] Sub-headline references $67B hallucination problem

### Entity 360 Demo Section

- [ ] Static JSON component (Option A) rendering Acme Corporation with 6 layers
- [ ] Truth, Context, Signals, Memory, Goals, Relationships all visible
- [ ] Twin Insight card with evidence chain and confidence score
- [ ] No live API calls — all data from static JSON file

### Three Doors Section

- [ ] Account Success door → links to /account-success (full page)
- [ ] Business Ops door → links to /business-ops (full page)
- [ ] Personal Space door → links to /personal (waitlist page, NOT live product)

### Surface Pages

- [ ] /account-success: 3 tier sections (No Twin → Basic Twin → Full Twin + TruthLayer), CTA = "Book a Demo"
- [ ] /business-ops: 3 tier sections, CTA = "Book a Demo"
- [ ] /personal: Full content (5 products, 3 tiers) but CTA = "Join the Waitlist"

### Pricing Page

- [ ] 3 tiers shown: Starter / Growth / Command
- [ ] Geo-pricing toggle: India (INR) / UAE (USD) / Enterprise (USD)
- [ ] Starter tier: "Join Early Access" button (not "Start Free")
- [ ] Growth tier: "Talk to Sales" button
- [ ] Command tier: "Talk to Sales" button
- [ ] Sync entitlements visible (sync interval, connectors, records, history)
- [ ] TruthLayer access row: Read-only / Limited write / Full TruthLayer
- [ ] FAQ section with 8+ questions

### Connector Count

- [ ] Number on homepage matches actual production-tested count from 4-point audit
- [ ] Connectors page (if built): Live connectors = green badge, Coming Soon = gray badge

### TruthLayer Section

- [ ] Visual flow diagram: AI proposes → Triage Bot → Human Approves → Spine Truth
- [ ] No live demo of TruthLayer (visual/diagram only until 4-step verification passes)
- [ ] Competitive comparison table showing "Auto" vs "Triage → Approval → Truth"

### Footer

- [ ] 4-column layout: Brand, Platform, Company, Resources
- [ ] Social links: Twitter/X, LinkedIn, GitHub
- [ ] Legal links: Privacy, Terms, Cookies
- [ ] Copyright: 2026 IntegrateWise

### Technical

- [ ] All pages render on mobile (< 640px)
- [ ] Open Graph meta tags on every page
- [ ] Page title and description set for SEO
- [ ] No console errors in browser dev tools
- [ ] Loads under 3 seconds on 4G connection

### What Must NOT Be On The Site At Launch

- [ ] No "Start Free" buttons
- [ ] No "No credit card" messaging
- [ ] No "Connect your first tool in 2 minutes"
- [ ] No live product signup flow
- [ ] No Personal Space as a live product (waitlist only)
- [ ] No interactive Entity 360 with live API calls (static JSON only)

---

## FIRST 3 PILOT TARGET PROFILES

Book these within 7 days of site going live. These are the highest-probability first conversations based on your network, expertise, and product readiness.

### Pilot 1: Mid-Market SaaS CS Team

| Attribute           | Target                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Company             | B2B SaaS, 50-200 employees, $5M-$30M ARR                                                   |
| Buyer               | VP Customer Success or Head of CS Ops                                                      |
| Team size           | 3-10 CSMs managing 30-80 accounts each                                                     |
| Pain                | CSMs check 5-8 tools daily, no unified account view, reactive churn detection              |
| Stack               | Salesforce or HubSpot + Zendesk or Intercom + Stripe + Slack                               |
| Entry product       | SuccessPilot (Basic Twin) — health scoring, risk flags, next-best-action                   |
| Upgrade path        | SuccessPilot → ChurnShield → SuccessCommand                                                |
| Why first           | They feel the pain daily. Fastest path to champion-led adoption. You speak their language. |
| Demo focus          | Connect their CRM, show Entity 360 for one of their accounts, show a Twin trigger firing   |
| Qualifying question | "How much time does your team spend gathering data before a QBR?"                          |

### Pilot 2: Founder / Operator You Know Personally

| Attribute           | Target                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Company             | 10-50 person company, any industry                                                                                                      |
| Buyer               | Founder, CEO, or COO (direct purchase, no procurement)                                                                                  |
| Pain                | Checks 8-12 tabs every morning, no single view of the business                                                                          |
| Stack               | Stripe + HubSpot/Pipedrive + Slack + Google Sheets + 3-5 other tools                                                                    |
| Entry product       | OpsCore (Full Twin) — unified business Entity 360, weekly briefs                                                                        |
| Upgrade path        | Already at top tier. Expand to team seats.                                                                                              |
| Why second          | You are the proof point. Show them YOUR dashboard running YOUR business on IntegrateWise. Founder-to-founder credibility is unbeatable. |
| Demo focus          | Show your own OpsCore dashboard. "This is how I run IntegrateWise. Same platform, your business."                                       |
| Qualifying question | "How many tabs do you have open right now?"                                                                                             |

### Pilot 3: MuleSoft / Salesforce Network Contact

| Attribute           | Target                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Company             | MuleSoft partner or Salesforce ecosystem company                                                                                                                                       |
| Buyer               | Solution Architect, Technical CSM, or Partner Manager                                                                                                                                  |
| Pain                | Managing complex integration accounts across Salesforce + Anypoint + Zendesk + multiple client systems                                                                                 |
| Stack               | Salesforce + MuleSoft Anypoint + Zendesk + Amplitude + Slack                                                                                                                           |
| Entry product       | ArchitectIQ (No Twin) → SuccessPilot (Basic Twin)                                                                                                                                      |
| Upgrade path        | ArchitectIQ → SuccessPilot → ChurnShield                                                                                                                                               |
| Why third           | Your credibility is highest here. You built the Spine to save an $8M red account. This is your origin story. MuleSoft accounts are complex enough to showcase Entity 360's full power. |
| Demo focus          | Show ArchitectIQ integration landscape mapping, then Entity 360 with all 6 layers for a complex account                                                                                |
| Qualifying question | "How do you track the technical health of your customer's integration landscape?"                                                                                                      |

### Outreach Sequence (Same for All 3)

**Day 1 (LinkedIn DM or email):**
"[Name], I built something that solves a problem I think you deal with daily. [One sentence about their specific pain]. Would a 15-minute walkthrough be worth your time this week?"

**Day 3 (Follow-up if no response):**
"Quick follow-up — I can show you [specific thing relevant to their role] in under 15 minutes. [Calendar link]"

**Day 7 (Final follow-up):**
"Last note — we're opening early access to [X] people this month. If the timing isn't right now, happy to keep you in the loop. [Waitlist link]"

### Success Criteria for Pilots

A pilot is successful if:

1. They connect at least 1 tool during the demo or within 48 hours
2. They see their own data in Entity 360 (not demo data)
3. They say "this would save me [X] hours per week" or equivalent
4. They agree to a 30-day trial or paid Starter subscription
5. They provide a testimonial quote or agree to be a reference

If 2 out of 3 pilots meet criteria 1-3, the product-market fit signal is strong enough to proceed to Phase 2 outreach at scale.

---

_This addendum + the positioning framework + the product catalog + the platform features doc = the complete GTM system. Freeze these documents. Build to them. Ship._
