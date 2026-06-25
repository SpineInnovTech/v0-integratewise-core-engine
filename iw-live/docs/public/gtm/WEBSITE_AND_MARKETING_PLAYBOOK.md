# Website & Marketing Playbook

> Website structure, SEO strategy, content calendar, social media, and launch plan.

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

## Website Structure

### Sitemap

| Page                      | URL                        | Purpose                                                                     | CTA                            |
| ------------------------- | -------------------------- | --------------------------------------------------------------------------- | ------------------------------ |
| Homepage                  | `/`                        | Hero + value prop + social proof                                            | "Start Free"                   |
| Product — Account Success | `/product/account-success` | User Workbench projections for Accounts Hub, Intelligence Center, Strategic | "Book a Demo"                  |
| Product — Business Ops    | `/product/bizops`          | User Workbench projections for Ops Cockpit and executive views              | "Start Free"                   |
| Platform                  | `/platform`                | Entity 360, Twin, Identity Resolution, Trust                                | "See Architecture"             |
| Solutions                 | `/solutions`               | Industry use cases (SaaS, Finance, SMB, etc)                                | "See Your Industry"            |
| Connectors                | `/connectors`              | Searchable grid of 70+ connectors                                           | "Connect Your Stack"           |
| Pricing                   | `/pricing`                 | Tier comparison (India, UAE, Enterprise)                                    | "Start Free" / "Talk to Sales" |
| Blog                      | `/blog`                    | Thought leadership, tutorials, case studies                                 | "Subscribe"                    |
| Docs                      | `/docs`                    | API reference, setup guides, connector docs                                 | —                              |
| About                     | `/about`                   | Team, mission, story                                                        | "Join Us"                      |
| Security                  | `/security`                | SOC 2, RLS, encryption, compliance                                          | "Download Whitepaper"          |

### Homepage Sections (scroll order)

1. **Hero** — "Your tools don't talk to each other. Your AI doesn't know context. You are the bridge. The Human API." + email signup
2. **Pain strip** — 3 pain cards (CSM, founder, retail business owner — universal)
3. **Entity 360 demo** — interactive assembled profile (the conversion weapon)
4. **How it works** — 3-step: Connect → Resolve → Reason (animated)
5. **Two products** — Account Success / Business Ops (tabbed preview)
6. **Industry applications** — SaaS, Finance, Hospitality, SMB, Freelancer (show universality)
7. **Numbers** — 70+ connectors, 150+ entity types, 10 triggers, 6 layers
8. **Pricing** — Multi-market (India ₹999, UAE $49, Enterprise $299)
9. **Founder close** — Personal letter + email signup

---

## SEO Strategy

### Primary Keywords (Account Success — universal)

| Keyword                        | Volume   | Difficulty | Intent     |
| ------------------------------ | -------- | ---------- | ---------- |
| account management software    | 3,200/mo | Medium     | Commercial |
| client management tool         | 2,800/mo | Medium     | Commercial |
| customer health score software | 880/mo   | Medium     | Commercial |
| account health monitoring      | 590/mo   | Low        | Commercial |
| business intelligence tool     | 4,100/mo | High       | Commercial |
| client relationship management | 1,900/mo | Medium     | Commercial |

### Secondary Keywords (Business Ops + India/UAE)

| Keyword                       | Volume   | Difficulty | Intent        |
| ----------------------------- | -------- | ---------- | ------------- |
| founder dashboard             | 720/mo   | Low        | Commercial    |
| business operating system     | 1,600/mo | Medium     | Informational |
| SaaS metrics dashboard        | 1,400/mo | Medium     | Commercial    |
| business management app       | 5,200/mo | Medium     | Commercial    |
| business management app India | 1,100/mo | Low        | Commercial    |
| client management India       | 480/mo   | Low        | Commercial    |

### Technical SEO Checklist

- [ ] Server-side rendering for all product pages (Next.js SSR)
- [ ] Structured data: Organization, Product, FAQ schemas
- [ ] Sitemap.xml auto-generated, submitted to Search Console
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Canonical URLs on all pages
- [ ] Open Graph + Twitter Card meta tags on every page
- [ ] Blog posts with schema markup (Article, HowTo)

---

## Content Calendar Framework (Monthly)

| Week | Blog Post                                               | Social (3x/week)                     | Email                       |
| ---- | ------------------------------------------------------- | ------------------------------------ | --------------------------- |
| 1    | "How to calculate customer health scores" (SEO)         | Pain-point posts, product tip        | Newsletter: monthly roundup |
| 2    | "Entity 360: Why one API changes everything" (Product)  | Architecture insight, team spotlight | Nurture: case study         |
| 3    | Guest post on SaaStr / First Round (Thought leadership) | Connector launch, customer quote     | Segment: CS leaders         |
| 4    | "The CSM's guide to QBR prep in 12 minutes" (Tutorial)  | Demo clip, founder story             | Segment: BizOps ICP         |

---

## Social Media Playbook

### Channels & Cadence

| Channel   | Audience                            | Cadence  | Content Type                               |
| --------- | ----------------------------------- | -------- | ------------------------------------------ |
| LinkedIn  | CS leaders, VPs, founders           | 3x/week  | Thought leadership, product insights, team |
| Twitter/X | Founders, developers, indie hackers | 5x/week  | Hot takes, product updates, threads        |
| YouTube   | All                                 | 2x/month | Demo walkthroughs, architecture deep dives |

### Content Pillars

1. **Pain & empathy** — "Your CSMs deserve better than 8 tabs" (40% of posts)
2. **Product & architecture** — "Why we chose Cloudflare Workers" (30% of posts)
3. **Customer stories** — "How [Company] cut QBR prep from 4 hours to 12 minutes" (20% of posts)
4. **Team & culture** — Behind the scenes, hiring, founder journey (10% of posts)

---

## Launch Announcement Template

### Press Release Structure

**Headline:** IntegrateWise Launches Universal Knowledge Workspace for Account Success and Business Ops

**Subhead:** New Knowledge Workspace connects 70+ tools, resolves entity identities, and surfaces evidence-backed insights — for any industry, any size, any domain.

**Body paragraphs:**

1. Problem statement (data fragmentation is universal — SaaS, SMB, freelancers, everyone)
2. Solution overview (Entity 360, Twin Trigger Engine, 70+ connectors)
3. Two products: Account Success + Business Ops (universal application)
4. Key differentiators (identity resolution, trust layer, approval-based memory)
5. Multi-market pricing (India ₹999, UAE $49, Enterprise $299)
6. Founder quote on mission
7. Company boilerplate

**Distribution:** TechCrunch, SaaStr blog, Product Hunt, Hacker News, YourStory (India), Gulf News (UAE), industry-specific newsletters.
