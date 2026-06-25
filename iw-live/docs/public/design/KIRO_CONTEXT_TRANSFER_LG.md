# Context Transfer — integratewise-lg (Marketing Site)

> For Kiro or any AI agent working on the integratewise-lg repo.
> This document contains everything you need to understand the codebase,
> the product, the design system, and what needs to be built.

---

## REPO OVERVIEW

**Repo:** `/Users/nirmal/Github/integratewise-lg`
**Stack:** Next.js 16 + React 19 + Tailwind CSS 4 + Framer Motion 11 + Firebase Hosting
**Purpose:** Public marketing website for IntegrateWise
**Live URL:** https://integratewise-4a649.web.app (will be integratewise.ai)

---

## WHAT INTEGRATEWISE IS

IntegrateWise is a Knowledge Workspace. Not a platform, not an OS, not a tool.

It connects every tool a business uses into one workspace. The Twin — the AI — reads three layers before it says or does anything:

1. **Truth** — structured data from 70+ connected tools (CRM, billing, support, analytics). Automatically cleaned, deduplicated, organized.
2. **Context** — emails, Slack messages, meeting notes, documents. The human layer that gives meaning to raw data.
3. **Knowledge Memory** — AI session summaries, decisions, insights. Governed by TruthLayer: the Twin proposes, you approve before it enters memory. Compounds daily.

All three meet in one complete view per entity. The Twin reasons across all of them. Nothing happens without the user's approval.

**Three product families (sold on the website):**

- Account Success — for anyone managing accounts, clients, customers in any industry
- Business Ops — for founders, CEOs, COOs, operators running a business
- Personal Space — private workspace for everyone (waitlist only, not live until M6)

**20 products exist internally but are NOT shown on the website.** The site sells three product families × three tiers. No product names (DataSentinel, SuccessPilot, etc.) on the site.

**The Twin is the AI.** One AI. It does everything — watches, reasons, proposes, learns. Do NOT invent multiple AI assistants or agents.

---

## TECH STACK

```
Framework:     Next.js 16 (App Router)
React:         19.2.0
Styling:       Tailwind CSS 4 (@tailwindcss/postcss)
Animation:     Framer Motion 11 + Motion 12
Icons:         Lucide React
UI Components: Radix UI (accordion, avatar, dropdown, slot)
Utilities:     class-variance-authority, clsx, tailwind-merge
Hosting:       Firebase Hosting (static export)
Analytics:     Firebase Analytics
```

---

## FILE STRUCTURE

```
integratewise-lg/
├── app/
│   ├── page.tsx                    # Homepage — imports all sections
│   ├── globals.css                 # Design tokens + Arvio utility classes
│   ├── layout.tsx                  # Root layout
│   ├── account-success/page.tsx    # Account Success surface page
│   ├── business-ops/page.tsx       # Business Ops surface page
│   ├── personal-ops/page.tsx       # Personal Ops surface page
│   ├── platform/page.tsx           # Platform / How It Works page
│   ├── pricing/page.tsx            # Pricing page
│   ├── ai/page.tsx                 # AI & Approvals page
│   ├── security/page.tsx           # Security page
│   ├── integrations/page.tsx       # Integrations catalog page
│   ├── about/page.tsx              # Founder story page
│   └── contact/page.tsx            # Contact / demo booking page
├── components/
│   ├── header.tsx                  # Site header/nav
│   ├── footer.tsx                  # Site footer
│   ├── hero-section.tsx            # Hero with chaos → order animation
│   ├── logos-section.tsx           # Connector logo marquee
│   ├── problem-section.tsx         # "Modern work isn't hard. The plumbing is."
│   ├── solution-section.tsx        # Workspace + Twin + Approval (3 pillars)
│   ├── ai-differentiators.tsx      # Twin differentiators (4 cards)
│   ├── solutions-doors-section.tsx # Account Success / Business Ops / Personal Ops
│   ├── how-it-works-section.tsx    # Connect → Clean → See → Approve (4 steps)
│   ├── truthlayer-section.tsx      # TruthLayer flow (dark section)
│   ├── data-flow-animation.tsx     # Animated SVG: tools → spine → workspaces
│   ├── dashboard-mockup.tsx        # L1 workspace + L2 drawer mockup
│   ├── day-one-section.tsx         # "What changes on day one"
│   ├── proof-section.tsx           # $8M account save story
│   ├── pricing-section.tsx         # 3 tiers × 3 regions
│   ├── final-cta.tsx               # Bottom CTA
│   ├── lead-form.tsx               # Email capture form
│   ├── spine-logo.tsx              # IntegrateWise spine logo SVG
│   ├── integratewise-wordmark.tsx  # Wordmark SVG
│   └── ui/                         # Shared UI components
│       ├── button.tsx              # shadcn/ui button (CVA variants)
│       ├── marquee.tsx             # Infinite horizontal scroll
│       ├── blur-fade.tsx           # Blur + fade entrance animation
│       ├── animated-beam.tsx       # Animated connecting beam
│       ├── animated-list.tsx       # Staggered list animation
│       ├── number-ticker.tsx       # Animated number counter
│       ├── orbiting-circles.tsx    # Orbiting circle animation
│       ├── icon-cloud.tsx          # Floating icon cloud
│       ├── sticky-scroll-reveal.tsx # Scroll-triggered reveal
│       ├── dock.tsx                # macOS-style dock
│       ├── avatar.tsx              # Avatar component
│       └── dropdown-menu.tsx       # Dropdown menu
├── content/                        # MDX/content files
├── lib/
│   └── utils.ts                    # cn() utility (clsx + tailwind-merge)
├── public/
│   └── logos/                      # Connector SVG logos (salesforce.svg, etc.)
├── firebase.json                   # Firebase hosting config
├── next.config.mjs                 # Next.js config
└── package.json
```

---

## DESIGN SYSTEM

### Color Tokens (from globals.css)

```css
/* Light mode */
--primary: 27 167 132; /* #1BA784 — emerald green */
--primary-light: 52 211 153; /* #34D399 */
--foreground: 10 11 16; /* #0A0B10 — near black */
--background: 255 255 255; /* #FFFFFF */
--muted: 240 240 240; /* #F0F0F0 */
--muted-foreground: 122 122 122; /* #7A7A7A */
--card: 255 255 255;
--border: 232 232 233; /* #E8E8E9 */
--dark-section: 8 7 14; /* #08070E — dark bg for contrast sections */

/* Dark mode (used in dark sections like TruthLayer) */
--primary: 52 211 153; /* #34D399 — lighter emerald */
--background: 8 7 14; /* #08070E */
--foreground: 248 248 250; /* #F8F8FA */
```

### Gradients

```css
--gradient-primary: radial-gradient(
  88% 75% at 50% 50%,
  rgb(27, 167, 132) 37.4%,
  rgb(52, 211, 153) 100%
);
--gradient-primary-icon: radial-gradient(
  75% 75% at 50% 50%,
  rgb(27, 167, 132) 53%,
  rgb(52, 211, 153) 100%
);
```

### Shadows (Arvio pattern — ring shadows, not drop shadows)

```css
--shadow-card: 0px 0px 0px 5px rgb(248 248 250), 0px 0.42px 1.26px... rgba(27, 167, 132, 0.03);
--shadow-card-elevated:
  0px 0px 0px 3px rgb(255 255 255), 0px 0.42px 1.26px... rgba(27, 167, 132, 0.24);
--shadow-button: 0px 0.42px 0.93px... rgba(27, 167, 132, 0.36);
```

### Typography

```
Font: Inter (loaded via Google Fonts)
H1: font-semibold, 64px on desktop, tracking -3.2px
H2 (section-heading): font-semibold, 52px desktop / 48px tablet / 40px mobile, tracking -0.05em
Body: font-medium, 17-18px, tracking -0.02em, line-height 1.5
Small: font-medium, 13-15px
Badge: font-bold, 12px, uppercase, tracking 0.15-0.2em
```

### Utility Classes (Arvio-derived)

```css
.arvio-card        — white bg, 20px radius, ring shadow, hover: translateY(-2px) + elevated shadow
.arvio-card-elevated — white bg, 20px radius, elevated ring shadow
.arvio-badge       — white bg, 40px radius (pill), ring shadow 3px
.arvio-gradient-bg  — radial gradient primary fill
.arvio-gradient-icon — radial gradient for icon containers
.arvio-section     — 100px padding desktop, 80px tablet/mobile
.arvio-dark-section — dark bg (#08070E), white text
```

### Animation Patterns

```
Entrance: framer-motion whileInView, type: "spring", bounce: 0.2, duration: 0.6
Stagger: delay: i * 0.08 to 0.1 per item
Card hover: translateY(-2px) via CSS transition cubic-bezier(0.25, 0.46, 0.45, 0.94)
Continuous: CSS @keyframes for marquee, SVG animateMotion for particles
Scroll: useScroll + useTransform for parallax (not yet used, available)
```

---

## CURRENT HOMEPAGE SECTIONS (in order)

1. **Header** — logo + nav (Home, Solutions, Platform, Pricing) + "Sign in" + "Book a demo"
2. **HeroSection** — chaos animation (scattered tools + hallucination ticker) → "click to clear" → clean workspace. CTAs: "Book a demo" + "See how it works"
3. **LogosSection** — connector logo marquee (15 logos × 4 rows)
4. **ProblemSection** — "Modern work isn't hard. The plumbing is." + 4 pain cards
5. **SolutionSection** — "Three foundations" (Truth, Context, AI Session Memory) + dashboard mockup + 3 pillar cards + equation
6. **AIDifferentiators** — "The Twin" section (dark bg) — 4 differentiator cards
7. **SolutionsDoorsSection** — Account Success / Business Ops / Personal Ops (3 doors with previews)
8. **HowItWorksSection** — Connect → Clean → See full picture → AI asks first (4 steps)
9. **TruthLayerSection** — "AI proposes. You decide what's true." (dark bg) — 4-step flow
10. **DayOneSection** — "What changes on day one" — 6 benefit cards
11. **ProofSection** — $8M account save story + metrics
12. **PricingSection** — 3 tiers (Starter/Growth/Command) × 3 regions (India/International/Enterprise)
13. **FinalCTA** — "Ready to see everything in one place?" + demo booking
14. **Footer** — 4-column links + social + newsletter signup

---

## WHAT NEEDS TO BE BUILT

### Priority 1: Three Flows Section (NEW — replaces or enhances SolutionSection)

The current SolutionSection mentions the three layers (Truth, Context, AI Session Memory) but only as labels. It doesn't show HOW each flow works — the journey data takes from your tools to the workspace.

**Build a new `ThreeFlowsSection` component** that visually walks through each flow:

**Flow 1 — "Every tool you use, cleaned and connected"**

- Visual: tool icons → animated data flow → clean unified record card
- Shows: 70+ connectors, automatic cleaning, deduplication, one record per entity
- Key line: "Connect once. See everything. No more tab-switching."

**Flow 2 — "Your emails, messages, and documents — connected to every account"**

- Visual: conversation fragments (email, Slack, meeting, doc) → linking animation → entity timeline
- Shows: emails, Slack, meetings, documents linked to entities, unified interaction history
- Key line: "Data tells you what happened. Context tells you why."

**Flow 3 — "AI that learns about your business — but only what you've confirmed"**

- Visual: Twin proposes → approval gate (emerald threshold) → verified knowledge stack
- Shows: Twin proposes, you approve, confidence scoring, knowledge compounds daily
- Key line: "Other AI guesses and forgets. The Twin learns and remembers — but only what you've confirmed."

**Convergence — "All three layers. One complete view."**

- Visual: three flow paths converge into one entity card showing all layers assembled
- The Twin insight appears as the culmination

**Full visual spec:** See `docs/design/THREE_FLOWS_VISUAL_SPEC.md` in the integratewise-live repo.

### Priority 2: Fix Existing Issues

| Issue                                                      | Fix                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| /ai page invents "7 AI assistants"                         | Rewrite — the Twin is the only AI. See WEBSITE_CONTEXT_TRANSFER.md for exact content.            |
| /integrations shows ~22 connectors                         | Expand to 65+ from the unified registry. See connector catalog in WEBSITE_CONTEXT_TRANSFER.md.   |
| /platform page is too thin                                 | Rebuild with three flows, complete view assembly, Twin reasoning, approval gate, infrastructure. |
| Proof section shows $0M / 0% / 0                           | Replace with: $8M account saved, 70+ systems, 3 layers                                           |
| "Start free" buttons on /account-success and /business-ops | Change to "Book a Demo" — self-serve isn't live                                                  |
| Pricing Starter says "Get started"                         | Change to "Book a Demo"                                                                          |
| /security claims HIPAA                                     | Remove — not verified                                                                            |
| /security claims data residency                            | Remove or "coming soon"                                                                          |

### Priority 3: Missing Sections

| Section           | What It Is                                                                       |
| ----------------- | -------------------------------------------------------------------------------- |
| Testimonials      | Marquee of feedback cards (template has this pattern)                            |
| FAQ Accordion     | Common questions with expand/collapse                                            |
| Blog Grid         | Featured post + 3 card grid                                                      |
| Comparison Table  | IntegrateWise vs Gainsight vs ChatGPT vs Spreadsheets                            |
| Industry Examples | How the product applies to SaaS, CA, hospitality, retail, education, freelancers |

---

## LANGUAGE RULES

### Never Say on the Website

- "Platform" / "OS" / "Tool" / "B2B SaaS"
- Architecture terms: Spine, Entity 360, Flow A/B/C, 8-stage pipeline, RLS, KV, D1
- "51 connectors" (old number — use "70+")
- "Start Free" (until self-serve is live)
- Product names (DataSentinel, SuccessPilot, ChurnShield, etc.) — internal only

### Always Say

- "Knowledge Workspace"
- "The Twin" when referring to the AI (one AI, does everything)
- "Your data, your conversations, your knowledge" (all three layers)
- "Nothing happens without your approval"
- "70+ integrations"
- "Book a Demo" / "Join Early Access" (M1-3 CTAs)

### Translation Table

| Architecture Term   | Website Language                                                           |
| ------------------- | -------------------------------------------------------------------------- |
| Spine               | Single source of truth / one unified record                                |
| Entity 360          | Complete view of any account in one click                                  |
| 8-stage pipeline    | Your data is automatically cleaned and organized                           |
| Flow A              | Your data from connected tools (Truth)                                     |
| Flow B              | Your conversations and documents (Context)                                 |
| Flow C              | AI knowledge that compounds over time (Knowledge Memory)                   |
| Twin Trigger Engine | The Twin — watches your business and tells you what matters                |
| TruthLayer          | The Twin proposes, you approve — nothing enters knowledge without your say |
| HITL / Govern       | You approve every action before it happens                                 |
| Identity Resolution | Duplicate detection with human review                                      |

---

## DESIGN DIRECTION

The site should feel surreal — visitors should feel like they're inside the product, not reading a brochure. The three flows section is the centerpiece:

- **Depth and dimension** — parallax layers, 3D perspective transforms, elements that respond to scroll
- **Ambient motion** — subtle particles, data flowing between sections, glowing edges that pulse
- **Transitions between sections** should feel like moving through rooms in the workspace
- **The approval gate** in Flow 3 is the visual climax — it should feel important, deliberate, powerful
- **The convergence** where all three flows meet is the emotional payoff

Use the existing animation patterns (Framer Motion springs, SVG animateMotion particles, CSS keyframes for continuous motion) but push them further. The `DataFlowAnimation` component already shows the pattern — tools → spine → workspaces with animated particles. Extend this approach to each individual flow.

---

## RELATED DOCS (in integratewise-live repo)

| Doc                                                | What It Contains                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `docs/design/THREE_FLOWS_VISUAL_SPEC.md`           | Full visual spec for the three flows section — layout, animation, color, content per flow |
| `docs/design/WEBSITE_CONTEXT_TRANSFER.md`          | Page-by-page content guide, fix list, connector catalog, product names (internal ref)     |
| `docs/design/WEBSITE_FIGMA_BUILD_SPEC.md`          | Original Figma build spec with design tokens, typography, spacing                         |
| `docs/gtm/ONE_PAGER.md`                            | Solutions-focused one-pager — use for content reference                                   |
| `docs/gtm/USE_CASES_AND_FEATURES_USER_LANGUAGE.md` | Feature-to-benefit translation table                                                      |
| `docs/product/PRODUCT_CATALOG_20.md`               | Full 20-product catalog (internal reference, not for website)                             |

---

## CONNECTOR CATALOG (for /integrations page)

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

---

_This is the complete context for the integratewise-lg repo. Read this before making any changes._
