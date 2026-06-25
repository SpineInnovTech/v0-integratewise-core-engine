# IntegrateWise — Figma Design Context

> Everything a designer needs to build the IntegrateWise website and product screens.
> This document is the single source of truth for Figma work.

---

## PART 1: WHAT IS INTEGRATEWISE

### One-liner

A Knowledge Workspace over the Spine, powered by AI.

### What that means in plain English

IntegrateWise connects all the tools a business uses (Salesforce, Zendesk, Stripe, Slack, etc.) into one workspace. It normalizes the data into a single source of truth called the Spine, then uses AI to surface insights — but the AI always shows its evidence and never acts without human approval.

### Who it's for

**Account Success (universal — MuleSoft is a focus vertical):**

- MuleSoft partners and integration account managers (deep domain expertise)
- Anyone managing accounts, clients, customers, patients, students, tenants
- CSMs at SaaS companies, CAs managing client portfolios, hotel managers, freelancers
- Managers who need portfolio visibility across all accounts
- Executives who need retention forecasting and revenue-at-risk visibility

**Business Ops (universal — any business):**

- Founders who open 12 tabs every morning to understand their business
- COOs who need cross-functional operational visibility
- CIOs/CTOs who need integration health and data quality metrics
- Agency owners, freelancers, retail business owners — anyone running a business

### The core philosophy

"AI that thinks in context, waits for approvals."

- Every insight has evidence
- Every action requires human approval
- Every data point traces back to its source

---

## PART 2: BRAND IDENTITY

### Canonical surface doctrine

- User Workbench = projection-native customer/product shell.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- The Twin is a native Cloudflare surface (iw-agent-runtime), not a separate shell.

### Tagline

"A Knowledge Workspace over the Spine, powered by AI."

### Voice

- Confident but not arrogant
- Technical but accessible
- Founder-led, not corporate
- Shows, doesn't tell
- Numbers over adjectives

### Canonical color system

- Ink: `#0C0C0C`
- Paper: `#F4F0E8`
- Paper Warm: `#EBE5D8`
- Paper Deep: `#E0D9C8`
- Rule: `#C4BAA8`
- Rule Light: `#D8D0C0`
- Forest: `#1A3A2A`
- Forest Mid: `#2D5A3D`
- Forest Bright: `#3D7A50`
- Gold: `#B8943F`
- Gold Light: `#D4AC5A`
- Gold Pale: `#F0E0B0`
- Red: `#8B2020`
- Slate: `#1A2E4A`
- Slate Mid: `#2A4A6A`

### Canonical typography

- Primary UI / body: Instrument Sans
- Editorial / hero serif: DM Serif Display
- Technical / code / IDs: IBM Plex Mono
- Selective display emphasis: Bebas Neue

### Application rule

- Forest + Paper governs website, product, doctrine, and the Twin runtime surfaces.
- Midnight Executive is investor-deck / fundraising language only.
- If any older dark runtime palette appears elsewhere in this file, treat it as superseded by the canonical product/system language above.

---

## PART 3: WEBSITE PAGES TO DESIGN

### Page 1: Homepage (most important)

**Layout: Single scroll, 7 sections**

**Section 1 — Hero**

- Headline: "Your tools don't talk to each other. Your AI doesn't show its work. We fix both."
- Subline: "A Knowledge Workspace over the Spine, powered by AI."
- Email input field with "Start Free →" button (inline, not separate page)
- Below: "No credit card. Connect your first tool in 2 minutes."
- Below that: "Watch a 90-second demo ↓" (scrolls to Section 3)
- Background: Dark (`#0C1222`) or white. No animation.
- Nav: Logo (left). Pricing. Docs. [Start Free] button (right).

**Section 2 — Pain Cards (3 columns)**

- Card 1: "I check 8 tools every morning to understand one account." — Every CSM, every CA, every account manager
- Card 2: "Our AI said Acme was healthy. They churned 30 days later." — VP of CS, agency owner, hotel chain manager
- Card 3: "By the time I spot a risk, the customer is already gone." — Founder, freelancer, retail business owner
- Style: Quote marks, italic text, attribution below. Cards with subtle border.

**Section 3 — Live Entity 360 Demo**
This is the conversion weapon. A styled HTML component showing a demo account.

Design an Entity 360 card for "Acme Corporation" with:

```
ACME CORPORATION                              Health: 48 ▼

TRUTH (Spine)                    SIGNALS (Twin)
ARR: $125,000                    ⚠ Usage dropped 42%
Renewal: 45 days                 🔴 Renewal risk: high
CSM: Sarah Chen                  ⚡ 3 support tickets
Last activity: 18d ago

CONTEXT (Flow B)                 MEMORY (Flow C)
📧 QBR email (3d ago)            🧠 "Prefers async"
📄 SOW renewal draft             🧠 "Budget freeze Q2"
📅 Exec call (2w ago)            🧠 "Champion = VP Ops"

TWIN INSIGHT
┌─────────────────────────────────────────────────┐
│ 🔴 Renewal at risk — 45 days, health 48        │
│                                                 │
│ What: Usage dropped 42%, 3 open tickets,        │
│       no activity in 18 days.                   │
│ Why: Combined signals = disengagement           │
│      before renewal window.                     │
│ Do: Schedule exec check-in within 48 hours.     │
│ Risk: Late engagement = 3x churn probability.   │
│                                                 │
│ Evidence: Spine + Signals + Context             │
│ Confidence: 91%                      [Act →]    │
└─────────────────────────────────────────────────┘
```

Below the demo: "This is Entity 360. One API call. Six layers. Now imagine this for every account in your book."
CTA: [Start Free — see your own accounts like this]

**Section 4 — How It Works (3 steps)**

```
1. Connect          →    2. Resolve         →    3. Reason
   70+ tools.                One record.             Evidence-backed
   2 minutes.               Per customer.           AI insights.
   OAuth.                   Automatic.              Governed.
```

Minimal. Three columns. Icon above each step (plug, merge, brain).

**Section 5 — Numbers**

```
70+ connectors    150+ entity types    10 AI triggers    8-stage pipeline
21 services      12 departments       6 Entity 360      Governed by
deployed         supported            layers            default
```

Two rows, four columns each. Just numbers and labels. No decoration.

**Section 6 — Pricing (inline)**

```
Free         Starter        Pro             Enterprise
$0           $299/mo        $999/mo         Let's talk

10 accounts  50 accounts    500 accounts    Unlimited
1 connector  3 connectors   10 connectors   All 70+
Daily sync   4h sync        1h sync         15min sync
3 triggers   5 triggers     All 10          Custom

[Start]      [Start]        [Start]         [Contact]
```

Toggle for Monthly / Annual (save 20%). Highlight "Pro" as recommended.

**Section 7 — Founder Close**

```
I built this because I spent 8 years watching
teams drown in tabs and distrust their AI.

IntegrateWise is what I wished existed.
Try it. 2 minutes to connect your first tool.

— Nirmal

[Work email                    Start Free →]
```

Same email input as hero. Dark background. Personal tone.

### Page 2: Pricing (standalone)

Same pricing table as Section 6 but with:

- Feature comparison matrix (full detail)
- FAQ section (8 questions)
- "Start Free" CTA at bottom

---

## PART 4: PRODUCT SCREENS TO DESIGN (for website screenshots)

These are the screens that will appear as product previews on the website once you have real data. Design them now so they're ready.

### Screen 1: Accounts Hub (Universal)

Layout:

- Top: "My Day" header with date
- Row 1: 4 stat cards (Engagements Today, Tasks Due, Open Risks, Renewals/Due Dates)
- Row 2: 3 KPI cards (Avg Health Score, Total Value, Account Count)
- Row 3: Health filter pills (All / Healthy / At-Risk / Critical)
- Main: Account list — each row shows: account name, industry/type, owner, key metric, health score badge
- Right sidebar or bottom: AI Signals section with purple accent
- Note: This same layout works for SaaS accounts, CA clients, hotel properties, or freelance projects

### Screen 2: Entity 360 View

Layout:

- Top: Entity name + health badge + entity type pill
- Left column (60%): Truth data (key fields in a clean table/card layout)
- Right column (40%): Active signals (severity-colored cards)
- Below left: Context items (email icon + title + date, document icon + title + date)
- Below right: Memory items (brain icon + content + confidence badge)
- Bottom: Twin Insight card (expandable, shows what/why/action/risk + evidence chain + confidence bar)

### Screen 3: Twin Insight Panel (Trust Layer)

This is the expandable insight card. Design it as a standalone component:

- Header: Severity badge (color-coded) + title + confidence % pill + timestamp
- Collapsed: Just the "what happened" line
- Expanded:
  - "What happened" section
  - "Why it matters" section
  - "Data sources" — pills showing which Entity 360 layers contributed (Spine, Context, Signals, Memory, Goals)
  - "Evidence" — list of evidence items, each with layer icon + description
  - "Confidence" — horizontal bar (green/yellow/red based on %)
  - "Risk if ignored" — red warning box
  - "Recommended action" — green action box
  - Buttons: [Take Action] [Dismiss]

### Screen 4: Identity Resolution / Duplicate Review

Layout:

- Top: Stats row (Pending, Merged, Rejected, Deferred counts)
- Filter bar: Status pills + entity type dropdown
- Main: List of merge candidates, each showing:
  - Side-by-side: Entity A (source badge, name, email) | Entity B (source badge, name, email)
  - Confidence score (large, color-coded)
  - Matched fields as green pills (email, domain, name)
  - Action buttons: [Merge] [Keep Separate] [Defer]

### Screen 5: Intelligence Center (Portfolio Manager)

Layout:

- Top: 6 KPI cards in a row
- Middle left: Health distribution bar (green/orange/red segments with legend)
- Middle right: Team performance table (owner name, accounts, avg health, value, at-risk count)
- Bottom: "Accounts Needing Attention" list sorted by worst health

### Screen 6: Ops Cockpit (Business Ops)

Layout:

- Top: 6 mini KPI cards (key metrics customized to business type)
- Middle left: "What needs your attention" — AI signals with purple accent
- Middle right: Active deals/clients/projects sorted by value
- Bottom: Account/client health sorted by worst first

---

## PART 5: COMPONENT LIBRARY (for Figma)

### Core Components to Create

**1. Stat Card**

- Icon (top-left or left), label (small text), value (large bold), optional trend indicator
- Variants: default, positive (green accent), warning (orange), critical (red), AI (purple)

**2. Health Badge**

- Circle or pill showing health score number
- Color: green (≥70), orange (40-69), red (<40)
- Sizes: small (inline), medium (card), large (hero)

**3. Severity Badge**

- Pill shape with background color + text
- Variants: critical (red), high (orange), medium (yellow), low (blue), info (gray)

**4. Source Badge**

- Small pill showing connector source name
- Color-coded by category (blue for CRM, purple for support, green for billing, etc.)

**5. Evidence Item**

- Layer icon (Database, MessageSquare, Zap, Brain, Target) + description text + optional source
- Used in Twin Insight expanded view

**6. Entity 360 Layer Card**

- Header with layer name + icon
- Content area with key-value pairs or list items
- Used in Entity 360 view and website demo

**7. Twin Insight Card**

- Collapsed: severity badge + title + confidence + timestamp
- Expanded: full what/why/action/risk + evidence + confidence bar + action buttons
- Border color matches severity

**8. Merge Candidate Card**

- Two entity columns side by side
- Confidence score between them
- Matched field pills below
- Action buttons at bottom

**9. Filter Pills**

- Row of selectable pills
- Active state: filled primary color
- Inactive state: muted background
- Used for: health filter, status filter, entity type filter, domain filter

**10. Email Signup Input**

- Single-line input with inline button
- Placeholder: "Work email"
- Button: "Start Free →"
- Used in hero and footer of website

---

## PART 6: INFORMATION ARCHITECTURE

### Website Navigation

```
Logo                                    Pricing  Docs  [Start Free]
```

That's it. No dropdowns. No mega-menu. Three links and a CTA.

### App Navigation (for product screenshots)

```
┌──────────┬──────────────────────────────────────────────┐
│ Sidebar  │  Top Bar: Domain name + Search + User avatar │
│          ├──────────────────────────────────────────────┤
│ Domain   │                                              │
│ modules  │  Content area (ContentRouter)                │
│          │                                              │
│ ─────── │                                              │
│ Settings │                                              │
│ Admin    │                                              │
└──────────┴──────────────────────────────────────────────┘
```

Sidebar modules change based on domain:

- CS: Dashboard, Accounts, Contacts, Health, Meetings, Tasks, Renewals, Risks, Docs
- BizOps: Dashboard, Ops Center, Strategic Hub, Metrics, CRM, Sales, Clients, Projects

### L2 Cognitive Overlay

> **Canonical enumeration:** see `docs/tech/L2_TWIN_SURFACE_CONTRACT.md` for the full L2 surface contract. The drawer panels listed below are the design-time visual representation of a subset of the contract's Interaction Surfaces and drawer-rendered Cognitive Domains.

The L2 layer is a slide-out drawer from the right side. It contains (visual reference, non-exhaustive):

- Twin insights panel
- Evidence trail
- Decision memory
- Drift detection
- Simulation panel
- Context panel

---

## PART 7: KEY VISUAL CONCEPTS

### The Spine Visualization

The Spine is the central concept. Visually, it should feel like:

- A vertical backbone or column that data flows into
- Connected nodes representing different entity types
- Data streams flowing from connector logos into the Spine
- Clean, minimal, not cluttered — think circuit board, not spaghetti

### Entity 360 Visualization

Six concentric layers around a central entity:

1. Core: Entity name + type + health (center)
2. Truth: Structured data ring (innermost)
3. Context: Emails, docs, meetings ring
4. Signals: Active alerts ring
5. Memory: AI knowledge ring
6. Goals: Outcomes ring (outermost)

Or: Six horizontal layers stacked, each with its own icon and content area.

### Trust Visualization

- Confidence bar: horizontal, color-coded (green ≥80%, yellow ≥60%, red <60%)
- Source badges: small pills with connector logo/name
- Evidence chain: vertical list with layer icons as timeline markers
- "Why this insight" as an expandable accordion

### Pipeline Visualization (for Platform page)

```
S1 → S2 → S3 → S4 → S5 → S6 → S7 → S7.5 → S8
Analyze  Classify  Filter  Refine  Extract  Validate  Sanity  Identity  Sectorize
```

Horizontal flow with stage numbers, names, and brief descriptions. Each stage is a node connected by arrows.

---

## PART 8: RESPONSIVE BREAKPOINTS

| Breakpoint | Width       | Layout                                      |
| ---------- | ----------- | ------------------------------------------- |
| Mobile     | < 640px     | Single column, stacked cards, hamburger nav |
| Tablet     | 640-1024px  | Two columns, condensed sidebar              |
| Desktop    | 1024-1280px | Full layout, sidebar + content              |
| Wide       | > 1280px    | Max-width container, centered               |

Website: Optimize for mobile-first (most traffic will be mobile from social/search).
Product screens: Optimize for desktop-first (product is used on desktop).

---

## PART 9: DESIGN PRIORITIES

### Must design first (for website launch)

1. Homepage hero section with email signup
2. Entity 360 demo component (the conversion weapon)
3. Twin Insight card (trust layer visualization)
4. Pain cards section
5. Pricing table

### Design second (for product screenshots on website)

6. CSM Accounts Hub screen
7. Intelligence Center screen
8. Founder Cockpit screen

### Design third (for product polish)

9. Identity Resolution / Duplicate Review screen
10. Full Entity 360 view
11. L2 Cognitive Overlay drawer

---

## PART 10: REFERENCE LINKS

- Live app: `http://localhost:3000` (local dev)
- Gateway health: `http://localhost:8786/health`
- Entity 360 API: `GET /api/entity360/:id`
- Twin 360 API: `GET /api/v1/cognitive/twin/360/:id`
- Existing components: `apps/web/src/components/`
- Trust panel: `apps/web/src/components/l2/cognitive/panels/trust-insight-panel.tsx`
- Duplicate UI: `apps/web/src/components/l1/views/duplicate-resolution-view.tsx`
- Platform features: `docs/PLATFORM_FEATURES_COMPLETE.md`
- Architecture decisions: `docs/ARCHITECTURE_DECISIONS.md`
