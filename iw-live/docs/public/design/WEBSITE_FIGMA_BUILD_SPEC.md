# IntegrateWise Website — Complete Figma Build Spec

> Frame-by-frame homepage design prompts + full sitemap for every page.
> This is the end-to-end spec for whoever builds the website in Figma and code.
> Read POSITIONING_FRAMEWORK.md for product context. This doc is the visual execution.

---

## DESIGN SYSTEM FOUNDATION

This document follows the canonical IntegrateWise system language.

### Surface boundary doctrine

- User Workbench = projection-native customer/product shell.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- The Twin is a native Cloudflare surface (iw-agent-runtime), not a separate shell.

### Canonical product / system palette

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

- Instrument Sans — primary UI / body
- DM Serif Display — editorial headers / hero emphasis
- IBM Plex Mono — code, IDs, technical metadata
- Bebas Neue — selective display / campaign emphasis

### Application rule

- Forest + Paper governs website, product, doctrine, and the Twin runtime surfaces.
- Midnight Executive is reserved for investor / fundraising decks only.
- Do not treat legacy dark runtime palettes as canonical product language.

---

## HOMEPAGE: "The Path to Verified Truth"

### Frame 1: Hero — "Chaos to Spine"

**Purpose:** Above-the-fold hook. Emotional transition from chaotic AI data to verified truth.

**Layout:** Full viewport width. Centered content. Dark background #0A0E27.

**Content stack (centered, max-width 800px):**

1. Eyebrow: "THE END OF AI HALLUCINATIONS"
   - Inter/Bold/14px, #64748B, letter-spacing 0.15em, uppercase

2. H1: "Every AI remembers. Only IntegrateWise remembers the **truth**."
   - Inter/Black/64px, #FFFFFF
   - The word "truth" highlighted with Trust Green #10B981 underline or color

3. Sub-headline (max-width 600px, centered):
   "The market has a $67 billion hallucination problem. ChatGPT and Copilot auto-write their memory, guess your context, and invent data. We built the cure. AI proposes. You approve. Welcome to the first operational workspace powered by verified memory."
   - Inter/Regular/18px, #94A3B8, line-height 1.7

4. CTA row (horizontal, 16px gap, centered):
   - Primary: [Book a Demo] — solid Trust Green bg, white text, 12px radius
   - Secondary: [Join Early Access] — ghost/outline, 1px Trust Green border, Trust Green text

5. Trust line below CTAs:
   "Connect your tools. See the truth. Trust the AI."
   - Inter/Medium/14px, #64748B

**LAUNCH PHASE NOTE:** CTAs change by phase. M1-3: "Book a Demo" + "Join Early Access". M3-6: "Start Free Trial" + "Book a Demo". M6+: "Start Free" + "See How TruthLayer Works". See LAUNCH_PHASE_ADDENDUM.md for details.

**Background visual:**

- 3D abstract: chaotic tangled red data lines and fragmented app logos (Salesforce, Zendesk, Stripe icons) at top/edges
- Lines funnel down into a single glowing vertical green core at center/bottom (The Spine)
- Cinematic lighting. Green feels like a safe harbor in a sea of chaotic red data.
- Subtle particle/noise texture on dark background

**Leonardo.ai prompts:**

- Chaos: "A conceptual 3D render of a chaotic, tangled network of glowing red data lines and fragmented, floating technological shards against a dark background. Low trust, unstable feeling. Focus on fragmentation. Isolated on dark."
- Spine: "A conceptual 3D render of a single, central, glowing green vertical pillar (The Spine). Clean, smooth data streams of different colors entering organized ports on the pillar against a soft gradient background. Stability, clarity, single source of truth feeling. Focus on organization. Isolated on clean background."

---

### Frame 2: The Problem — "The Trust Gap"

**Purpose:** Establish the pain. Show why the status quo is broken.

**Layout:** Two-column comparison. Dark background continues or transitions to slightly lighter #111631.

**Content above grid (centered):**

- H2: "Dashboards are dead. Unsupervised AI is dangerous."
- Body: "You are running your business across 5+ tools. Your current AI wants to auto-write your memory and guess your context. But 76% of enterprises require a human-in-the-loop for a reason: AI without verified memory is just a chatbot guessing."
  - Inter/Regular/18px, #94A3B8, max-width 700px

**Left column — "The Status Quo":**

- Card with muted gray background, red accent border
- Visual: Mock ChatGPT interface showing a hallucinated response with red X badge
- Message bubble: "I have hallucinated a new metric for you!"
- Fragmented data visual above — scattered, disconnected nodes
- Aesthetic: Gray tones (#374151 bg), red X icons (#EF4444), low trust feeling
- Label below: "Auto-written memory. No approval. No evidence."

**Right column — "IntegrateWise":**

- Card with dark background, Trust Green accent border with subtle glow
- Visual: Clean Entity 360 card for "Acme Corp" showing:
  - Health: 48 (orange badge)
  - Truth layer: ARR $125K, Renewal 45d
  - Twin Insight with evidence chain
  - Prominent green "Truth Gated" badge
- Aesthetic: Brand colors, green checkmarks (#10B981), high trust feeling
- Label below: "Approval-gated memory. Evidence on every insight."

---

### Frame 3: TruthLayer in Action — "The Aha Moment"

**Purpose:** THE most critical section. Demonstrates the Core Canonical Loop: AI proposes, Human approves, Truth is written. Must feel interactive.

**Layout:** Centered vertical workflow. Dark background.

**Content above workflow:**

- H2: "AI proposes. You approve. Truth is written once."
- Body: "Introducing TruthLayer. The first AI memory architecture where absolutely nothing becomes a fact without your say."
  - Inter/Regular/18px, #94A3B8, max-width 600px

**Workflow visual (vertical sequence, connected by animated lines):**

Step 1 — "The Triage Bot Watches"

- Icon: Bot/scanner icon connected to Salesforce, Stripe, Slack logos via data lines
- Card: "Continuously monitors your connected systems, spotting patterns and weak signals."
- Visual: Small connector logos feeding into a central triage node
- Color: Spine Blue #3B82F6 accent

Step 2 — "TwinCommand Proposes"

- Large card showing an AI-generated suggestion:
  - "Vendor spend is trending 22% above contracted rate."
  - "Recommended action: Draft renegotiation brief?"
  - Confidence: 87% (green bar)
  - Source: FinPulse Twin + Stripe data
- Color: Signal Purple #8B5CF6 accent

Step 3 — "You Approve (The Moat)"

- Central, large, glowing [APPROVE] button — Trust Green, prominent, feels clickable
- Arrow flowing from button into "The Spine TruthLayer" component below
- Card: "You hit approve. It becomes verified Spine Truth. Any AI can read it. No AI can write to it without your permission."
- Color: Trust Green #10B981 — this is the visual climax of the page

Step 4 — "Truth is Written"

- Spine visualization: clean vertical pillar with the approved fact now stored
- Badge: "Verified Memory — Confidence 87% — Source: Stripe + FinPulse"
- Small icons showing Claude, GPT, Gemini all reading from the same truth
- Label: "Every AI reads from verified truth. Nothing hallucinated. Nothing assumed."

**Leonardo.ai prompt:**
"A clean, holographic user interface element. A prominent, central glowing green button clearly labeled APPROVE. Conceptual data blocks labeled AI Proposal flow to the button, then transform into stable data blocks labeled Verified Memory. Focus on the human action and the transition. Isometric view, high trust interaction."

---

### Frame 4: Solutions Grid — "Choose Your Universe"

**Purpose:** Self-segmentation. User picks their surface. Shows 20 products are organized into 3 clear paths.

**Layout:** 3-column card grid. Transition to slightly lighter background or gradient.

**Content above grid (centered):**

- H2: "Three Universes. 20 Products. One Universal Spine."
- Sub-headline: "Hooked by data. Retained by intelligence. Locked in by the TruthLayer."
  - Inter/Regular/18px, #94A3B8

**Three cards (equal width, glassmorphism on dark):**

Card 1 — Account Success

- Icon: Glowing network/node graph (blue-green)
- H3: "Account Success"
- Body: "Manage accounts, clients, or customers in any industry."
- Product preview (small text, stacked):
  - SuccessPilot — Health scoring with Basic Twin
  - ChurnShield — Predict churn before scores move
  - SuccessCommand — Your portfolio executive Twin
  - +5 more products
- CTA: [Explore Account Success →]

Card 2 — Business Ops

- Icon: Glowing rising bar chart / financial pulse (green)
- H3: "Business Ops"
- Body: "Run your business or function from one dashboard."
- Product preview:
  - OpsCore — Unified operational rhythm
  - FinPulse — Proactive financial visibility
  - HirePilot — Workload-signaled team planning
  - +4 more products
- CTA: [Explore Business Ops →]

Card 3 — Personal Space

- Icon: Glowing geometric life-balance shape / hexagon (gold/amber)
- H3: "Personal Space"
- Body: "Your private workspace. Tasks, goals, knowledge, life."
- Product preview:
  - LifeOps — Your personal Chief of Staff
  - RelationshipMap — AI-driven personal CRM
  - LearningDesk — Skill development tracking
  - +2 more products
- CTA: [Explore Personal Space →]

**Card interaction states:**

- Default: subtle border #1E293B, dark surface bg
- Hover: card elevates 4px, border glows Trust Green, subtle arrow appears at bottom
- Glassmorphism: slightly translucent backgrounds (rgba(255,255,255,0.03)), subtle blur

**Leonardo.ai prompt:**
"A conceptual visual for three distinct glowing vertical streams originating from a single unified base. The left stream (blue) has relationship graph and message icons. The center stream (green) has financial chart and invoice icons. The right stream (gold) has life balance and goal icons. Clean, vibrant colors. Isometric view."

---

### Frame 5: Competitive Advantage — "The Proof"

**Purpose:** Us vs. Them. Visual proof that the competition is a liability and IntegrateWise is the upgrade.

**Layout:** Centered comparison table, max-width 1000px. Dark background.

**Content above table:**

- H2: "The AI Status Quo vs. The TruthLayer"
- Body: "Every major AI shipped memory in 2025. All of them let AI write automatically. None of them ask for your approval."

**Comparison table (4 rows, 3 columns):**

| Feature            | Other AI (ChatGPT, Copilot)           | IntegrateWise                              |
| ------------------ | ------------------------------------- | ------------------------------------------ |
| Memory Creation    | Auto-writes (guesses and infers)      | Approval-Gated (nothing enters unchecked)  |
| Hallucination Risk | High (mixes fiction with data)        | Zero (based on Spine Truth)                |
| Action Model       | Passive (answers only when asked)     | Proactive (TwinCommand drafts plans early) |
| Context Lock-in    | Siloed (lose memory if you switch AI) | Open Context (use any AI on our Spine)     |

**Left column aesthetic:**

- Muted gray background (#1E293B)
- Red X icons (#EF4444) or warning triangles
- Flat, low-energy design
- Header: "Other AI" in muted text

**Right column aesthetic:**

- Elevated, Trust Green border with subtle glow
- Soft green background tint (rgba(16,185,129,0.05))
- Bright green checkmarks (#10B981)
- Header: "IntegrateWise" in white, bold

**Below table — stat badges (horizontal row):**

- "82% see AI data collection as a threat"
- "76% of enterprises require human-in-the-loop"
- "Only 17% trust AI without oversight"
- Style: pill badges, dark bg, Trust Green text, small

---

### Frame 6: The Close — "The Origin and The Ask"

**Purpose:** Emotional close + final conversion. Founder conviction + clear CTA.

**Layout:** Two stacked sections. Dark background.

**Section A — Founder Origin:**

Layout: Two-column (image left, text right) or single column centered.

- Founder photo: Professional headshot or candid working photo. Circular or rounded-square crop.
- H2: "Why we built this."
- Body (Inter/Regular/18px, #94A3B8, max-width 550px):
  "I used to be the Human API. Copy-pasting context across 14 tools every morning, briefing platforms, watching AI forget it all by tomorrow. I built the Adaptive Spine to save an $8M red account when everyone else gave up. We did not just build a better integration tool. We built the foundational approval layer for the AI era. And we run our entire business on it."
- Signature: "— Nirmal, Founder" (Inter/Semibold/16px, #FFFFFF)

**Section B — Bottom CTA Block:**

- H2: "Stop renting hallucinated memory. Own your truth."
- Body: "Connect your tools in 5 minutes. Let the TwinCommand learn your business. You decide what becomes truth — always."
  - Inter/Regular/18px, #94A3B8

- Email input + CTA (centered, same as hero):
  - Input: "Work email" placeholder, dark bg, subtle border
  - Button: [Book a Demo] — solid Trust Green, large, prominent
  - Secondary: [Join Early Access →] — ghost style below

- Trust badges below CTA (horizontal row, centered):
  - SOC-2 Type II (badge icon)
  - GDPR Ready (badge icon)
  - Zero Hallucination Architecture (badge icon)
  - Style: small gray badges with subtle borders, muted text

---

## FOOTER (All Pages)

**Layout:** Full width, dark background #0A0E27, border-top 1px #1E293B.

**Content (4-column grid + bottom bar):**

Column 1 — Brand:

- Logo (IntegrateWise mark + wordmark)
- Tagline: "A Knowledge Workspace over the Spine, powered by AI."
- Social icons: Twitter/X, LinkedIn, GitHub (circle buttons, ghost style)

Column 2 — Platform:

- Account Success
- Business Ops
- Personal Space
- Entity 360
- TruthLayer
- Connectors

Column 3 — Company:

- About
- Blog
- Careers
- Contact
- Security

Column 4 — Resources:

- Documentation
- API Reference
- Pricing
- Changelog
- Status

**Bottom bar:**

- Left: "© 2026 IntegrateWise. All rights reserved."
- Right: Privacy | Terms | Cookies

---

## COMPLETE SITEMAP

### Primary Pages (Top Nav)

| Page            | URL              | Purpose                                                     | CTA                        |
| --------------- | ---------------- | ----------------------------------------------------------- | -------------------------- |
| Homepage        | /                | Hero + TruthLayer + 3 doors + proof + close                 | Start Free                 |
| Account Success | /account-success | Surface page: 8 products across 3 tiers                     | Start Free / Book Demo     |
| Business Ops    | /business-ops    | Surface page: 7 products across 3 tiers                     | Start Free / Book Demo     |
| Personal Space  | /personal        | Surface page: 5 products across 3 tiers                     | Start Free                 |
| Pricing         | /pricing         | 3 tiers (Starter/Growth/Command), 3 markets                 | Start Free / Talk to Sales |
| Platform        | /platform        | Architecture: Spine, Entity 360, Pipeline, Twin, TruthLayer | See Documentation          |

### Navigation Structure

```
Logo                                              Pricing  Docs  [Start Free]

Mobile: Hamburger menu with same items
```

Keep it minimal. No dropdowns. No mega-menu. Three links and a CTA.

---

### Surface Pages — Detailed Structure

#### /account-success

**Hero:**

- H1: "Every account. Every signal. One truth."
- Sub: "Whether you manage 10 clients or 10,000 accounts — across SaaS, financial services, hospitality, or any industry — Account Success gives you the complete picture and the AI to act on it."
- CTA: [Start Free] + [Book a Demo]

**Section 1 — "Start with your data" (No Twin tier):**

- 4 product cards in 2x2 grid:
  - DataSentinel: Data quality, anomaly detection, identity resolution
  - VaultGuard: Contracts, renewals, entitlements
  - ArchitectIQ: Integration landscape, connector health, technical mapping
  - TemplateForge: Playbooks, QBR templates, onboarding workflows
- Label: "These work without AI. Pure data. Pure dashboards. Free to start."

**Section 2 — "Add intelligence" (Basic Twin tier):**

- 2 product cards side by side:
  - SuccessPilot: Health scoring, risk flags, next-best-action. Twin watches, you drive.
  - DealDesk: Expansion signals, upsell tracking, commercial intelligence.
- Label: "Twin observes patterns across your connected data. You decide. You execute."

**Section 3 — "Trust the Twin" (Full Twin + TruthLayer):**

- 2 product cards, elevated with Trust Green glow:
  - ChurnShield: Churn prediction, intervention plans, outcome learning. Portfolio risk heatmap.
  - SuccessCommand: Full Entity 360 command center. Strategic advisor. Board-level reports.
- TruthLayer callout box: "Includes TruthLayer — AI proposes memory. You approve. Only confirmed facts become Spine truth. Every AI reads from it. Nothing writes without your say."
- Label: "The Twin proposes, drafts, and learns. But nothing becomes truth without your approval."

**Section 4 — Industry examples:**

- Horizontal scroll or tabs showing how Account Success applies to:
  - MuleSoft / iPaaS (focus vertical)
  - SaaS B2B
  - Financial Services
  - Hospitality
  - Education
  - Retail / SMB
  - Agency
- Each tab shows: industry name, example Twin trigger, relevant connectors

**Section 5 — CTA:**

- [Start Free — see your accounts in one view]

#### /business-ops

Same structure as Account Success but with Business Ops products:

**Section 1 (No Twin):** ComplianceVault, VendorGuard, PartnerBridge
**Section 2 (Basic Twin):** GrowthDesk, HirePilot
**Section 3 (Full Twin + TruthLayer):** FinPulse, OpsCore

**Industry examples:** SaaS Founder, Retail Business Owner, Agency Owner, Freelancer, Manufacturing

#### /personal

Same structure but with Personal Space products:

**Section 1 (No Twin):** WealthPilot, WellnessCore
**Section 2 (Basic Twin):** LearningDesk, RelationshipMap
**Section 3 (Full Twin + TruthLayer):** LifeOps + Knowledge Hub

---

### /pricing

**Layout:** 3-tier comparison table (not 20 line items).

**Tier names:** Starter | Growth | Command

**Toggle:** Monthly / Annual (save 20%)

**Market selector:** India (INR) | UAE (USD) | Enterprise (USD)

|                     | Starter   | Growth        | Command              |
| ------------------- | --------- | ------------- | -------------------- |
| India               | Rs999/mo  | Rs2,999/mo    | Rs7,999/mo           |
| UAE                 | $49/mo    | $99/mo        | $199/mo              |
| Enterprise          | $299/mo   | $999/mo       | Custom               |
| Twin                | No Twin   | Basic Twin    | Full Twin            |
| TruthLayer          | Read-only | Limited write | Full TruthLayer      |
| Entities            | 50-100    | 500           | 2,000+               |
| Connectors          | 3         | 5-10          | 10+                  |
| Sync                | 4h        | 1h            | 15min                |
| Identity Resolution | Basic     | Advanced      | Advanced + HITL      |
| Support             | Community | Email         | Priority / Dedicated |

**Below table:**

- Feature comparison matrix (expandable accordion showing all features per tier)
- FAQ section (8-10 questions)
- CTA: [Start Free] for Starter/Growth, [Talk to Sales] for Command

**FAQ topics:**

1. What is TruthLayer?
2. Can I use my own AI (Claude, GPT, Gemini)?
3. How long does setup take?
4. What connectors do you support?
5. Is my data secure? (RLS, SOC-2, encryption)
6. Can I switch tiers?
7. Do you offer annual discounts?
8. What happens to my data if I cancel?

---

### /platform

**Purpose:** Architecture page for technical buyers, CTOs, solution architects.

**Sections:**

1. **The Spine** — Single source of truth. 150+ entity types. 12 departments. Industry overlays. Adaptive schema.

2. **Entity 360** — 6 layers (Truth, Context, Signals, Memory, Goals, Relationships). Parallel assembly. < 200ms. Visual diagram of the 6 layers around a central entity.

3. **8-Stage Pipeline** — S1 through S8 + S7.5 Identity Resolution. Visual horizontal flow diagram.

4. **Twin Trigger Engine** — 10 triggers. Evidence-backed. 4-question standard. Max 3/entity/day.

5. **TruthLayer** — The approval-gated memory architecture. Triage bot, confidence scoring, human approval, open read layer.

6. **Connectors** — 70+ connectors across 13 categories. Searchable grid with logos. Filter by category.

7. **Infrastructure** — Cloudflare Workers (edge deployment, 300+ PoPs). Spine DB (PostgreSQL + RLS). D1, KV, R2, Queues.

8. **Security** — Tenant isolation (RLS). OAuth 2.0 + PKCE. Token encryption. Govern gate. Full audit trail.

---

### Secondary Pages

| Page          | URL        | Purpose                                                      |
| ------------- | ---------- | ------------------------------------------------------------ |
| About         | /about     | Team, mission, founder story, values                         |
| Blog          | /blog      | Thought leadership, tutorials, case studies, product updates |
| Careers       | /careers   | Open positions, culture, benefits                            |
| Contact       | /contact   | Contact form, email, demo scheduling                         |
| Security      | /security  | SOC-2, GDPR, RLS, encryption details, compliance whitepaper  |
| Documentation | /docs      | Links to VitePress docs site (public + internal)             |
| API Reference | /docs/api  | Entity 360 API, Twin API, Connector API                      |
| Changelog     | /changelog | Product updates, new features, release notes                 |
| Status        | /status    | Service health, uptime monitoring                            |
| Privacy       | /privacy   | Privacy policy                                               |
| Terms         | /terms     | Terms of service                                             |
| Cookies       | /cookies   | Cookie policy                                                |

---

### Product Detail Pages (Optional — Phase 2)

If needed, each of the 20 products can have its own detail page. These are NOT required for launch but can be built later for SEO and deep-linking.

| Product         | URL                             | Surface         |
| --------------- | ------------------------------- | --------------- |
| DataSentinel    | /account-success/datasentinel   | Account Success |
| VaultGuard      | /account-success/vaultguard     | Account Success |
| ArchitectIQ     | /account-success/architectiq    | Account Success |
| TemplateForge   | /account-success/templateforge  | Account Success |
| SuccessPilot    | /account-success/successpilot   | Account Success |
| DealDesk        | /account-success/dealdesk       | Account Success |
| ChurnShield     | /account-success/churnshield    | Account Success |
| SuccessCommand  | /account-success/successcommand | Account Success |
| ComplianceVault | /business-ops/compliancevault   | Business Ops    |
| VendorGuard     | /business-ops/vendorguard       | Business Ops    |
| PartnerBridge   | /business-ops/partnerbridge     | Business Ops    |
| GrowthDesk      | /business-ops/growthdesk        | Business Ops    |
| HirePilot       | /business-ops/hirepilot         | Business Ops    |
| FinPulse        | /business-ops/finpulse          | Business Ops    |
| OpsCore         | /business-ops/opscore           | Business Ops    |
| WealthPilot     | /personal/wealthpilot           | Personal Space  |
| WellnessCore    | /personal/wellnesscore          | Personal Space  |
| LearningDesk    | /personal/learningdesk          | Personal Space  |
| RelationshipMap | /personal/relationshipmap       | Personal Space  |
| LifeOps         | /personal/lifeops               | Personal Space  |

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Width       | Layout changes                                                                             |
| ---------- | ----------- | ------------------------------------------------------------------------------------------ |
| Mobile     | < 640px     | Single column. Stacked cards. Hamburger nav. Hero H1 drops to 40px. CTAs stack vertically. |
| Tablet     | 640-1024px  | Two columns where possible. Condensed card grid.                                           |
| Desktop    | 1024-1440px | Full layout. 3-column grids. Side-by-side comparisons.                                     |
| Wide       | > 1440px    | Max-width 1200px container, centered. Background extends full width.                       |

Website: Optimize for mobile-first (most traffic from social/search).
Product app: Optimize for desktop-first (product is used on desktop).

---

## PAGE PRIORITY FOR LAUNCH

| Priority | Page                     | Why                                                 |
| -------- | ------------------------ | --------------------------------------------------- |
| P0       | Homepage                 | First impression. Must convert.                     |
| P0       | Pricing                  | Second most visited page after homepage.            |
| P0       | Footer + Nav             | Appears on every page.                              |
| P1       | /account-success         | Primary surface page for enterprise buyers.         |
| P1       | /business-ops            | Primary surface page for founders/operators.        |
| P1       | /personal                | Primary surface page for individual users.          |
| P2       | /platform                | For technical buyers, CTOs, architects.             |
| P2       | /about                   | Trust building. Founder story.                      |
| P3       | /blog                    | SEO, thought leadership. Can launch with 3-5 posts. |
| P3       | /security                | Enterprise buyers will ask. Have it ready.          |
| P3       | /docs                    | Link to VitePress docs site.                        |
| P4       | Individual product pages | Phase 2. SEO play. Not needed for launch.           |

---

## IMPLEMENTATION NOTES FOR DEVELOPERS

### Tech Stack (Marketing Site)

- Framework: Vite + React (already in the App Development Initiation repo)
- Styling: Tailwind CSS with the color tokens above
- Components: MagicUI library (emerald green + dark base theme)
- Routing: React Router (already set up)
- Hosting: Cloudflare Pages or Vercel
- Analytics: Google Analytics + Mixpanel

### Key Routes (from existing router)

```
/                    → Homepage (LandingPage component)
/account-success     → Account Success surface page
/business-ops        → Business Ops surface page
/personal            → Personal Space surface page
/platform            → Architecture/Platform page
/pricing             → Pricing page
/about               → About page
/app                 → Dashboard mockup / interactive demo
```

### Assets Needed

- Founder photo (Nirmal)
- 3D renders for hero (chaos + spine) — generate via Leonardo.ai
- TruthLayer workflow illustration — generate or design in Figma
- Connector logos (70+ logos — most available as SVGs from brand resources)
- Trust badges (SOC-2, GDPR, Zero Hallucination Architecture)
- Product icons for each of the 20 products

### SEO Requirements

- Server-side rendering or pre-rendering for all marketing pages
- Structured data: Organization, Product, FAQ schemas
- Open Graph + Twitter Card meta tags on every page
- Sitemap.xml auto-generated
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

_This document + POSITIONING_FRAMEWORK.md + PRODUCT_CATALOG_20.md = everything needed to build the complete IntegrateWise website from scratch. No other context required._
