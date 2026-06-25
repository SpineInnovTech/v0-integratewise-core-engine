# Sales & Marketing Content — IntegrateWise

> Objection handling, email templates, LinkedIn posts, and case study framework.

---

## Objection Handling (Top 10)

| #   | Objection                                        | Response                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "We already use Gainsight/Totango."              | "Those tools require manual data entry and rule configuration. IntegrateWise auto-ingests from 70+ sources and uses Twin triggers that reason over assembled entities — no rule-building required. We complement your CS platform by feeding it better data." |
| 2   | "We built internal dashboards."                  | "Internal dashboards show data. IntegrateWise surfaces _insights_. The Twin Trigger Engine doesn't just display usage decline — it correlates it with support tickets, contract timing, and champion changes to tell you _why_ and _what to do_."             |
| 3   | "Our data is too messy."                         | "That's exactly why you need identity resolution. Our 8-stage pipeline normalizes, deduplicates, and resolves entities across systems. Messy data is our input — clean, unified profiles are our output."                                                     |
| 4   | "We don't have 70 tools."                        | "Most customers start with 5–8 connectors. The platform scales with you. Starter tier includes 10 connectors at $499/mo. You only pay for what you connect."                                                                                                  |
| 5   | "How is this different from a CDP?"              | "CDPs focus on marketing audiences. IntegrateWise focuses on operational intelligence — account health, CS workflows, BizOps dashboards. We share the identity resolution DNA but serve a completely different user."                                         |
| 6   | "What about data security?"                      | "Spine DB RLS enforces tenant isolation at the database level. Every data point carries source attribution and confidence scores. Govern module gates destructive actions behind approval workflows. SOC 2 Type II in progress."                              |
| 7   | "We can't afford another tool."                  | "CSMs spend 3+ hours/day on data gathering. At $80/hr fully loaded, that's $62K/year per CSM. A team of 10 CSMs wastes $620K/year. IntegrateWise pays for itself in the first month."                                                                         |
| 8   | "Our team won't adopt it."                       | "The CSM Hub replaces tab-switching, not adds to it. Morning briefings and one-click QBR prep mean CSMs _want_ to open it. We've seen 89% DAU in design partner teams within 2 weeks."                                                                        |
| 9   | "What if a connector breaks?"                    | "Each pipeline stage has independent retry logic and a dead-letter queue. Connector health is monitored in real-time. If Salesforce rate-limits us, the Loader backs off and retries — downstream stages are unaffected."                                     |
| 10  | "We need enterprise features (SSO, audit, SLA)." | "Enterprise tier includes SAML SSO, full audit trail, 99.9% SLA, dedicated support, and custom connector development. We're built for enterprise from day one — Cloudflare Workers, Spine DB RLS, schema-level security."                                     |

---

## Email Templates

### Cold Outreach — CS Leader

**Subject:** Your CSMs are spending 3 hours/day on data gathering

Hi [First Name],

I noticed [Company] is scaling its CS team — congrats on the growth. Quick question: how much time do your CSMs spend switching between Salesforce, Zendesk, and product analytics just to understand one account?

We built IntegrateWise to eliminate that. It connects to your existing stack, resolves customer identities across systems, and surfaces actionable insights — like "Acme Corp usage dropped 40% and they have a renewal in 45 days."

Would a 15-minute demo be worth your time this week?

— [Your Name]

### Follow-Up (Day 3)

**Subject:** Re: Your CSMs are spending 3 hours/day on data gathering

Hi [First Name],

Wanted to share a quick data point: our design partners reduced QBR prep time from 4 hours to 12 minutes using Entity 360. The assembled account view pulls from every connected system automatically.

Happy to show you how it works with your specific stack. [Calendar link]

— [Your Name]

### Demo Invite

**Subject:** See your accounts unified in 15 minutes

Hi [First Name],

Thanks for your interest in IntegrateWise. I've set up a personalized demo showing how [Company]'s stack (Salesforce + [Tool 2] + [Tool 3]) would look unified.

**What you'll see:**

- Live account sync through our 8-stage pipeline
- Entity 360 assembled profile with health scoring
- Twin Trigger Engine surfacing an at-risk account
- CSM Hub morning briefing

**When:** [Date/Time] | **Duration:** 15 min | **Link:** [Meeting URL]

— [Your Name]

---

## LinkedIn Post Templates

### Post 1: Problem Awareness

> Your CSMs manage 40 accounts across 8 tools. They spend more time gathering data than talking to customers. That's not a people problem — it's an infrastructure problem. The fix isn't "work harder." It's a cognitive layer that connects, resolves, and reasons across your entire stack. #CustomerSuccess #SaaS

### Post 2: Product Insight

> We built Entity 360 because no single system knows who your customer really is. Your CRM knows the deal. Your support tool knows the tickets. Your analytics knows the usage. Entity 360 knows all of it — assembled, scored, and ready in one API call. Works for SaaS accounts, CA clients, hotel guests, or freelance projects. #ProductBuilding

### Post 3: Architecture Thought Leadership

> Why we chose Cloudflare Workers over Lambda for our data pipeline: 0ms cold starts matter when a single account sync fans out across 8 processing stages. V8 isolates give us container-level isolation without container-level overhead. #Engineering #Serverless

---

## Case Study Framework

### Structure for Each Case Study

1. **Company Profile** — Name, size, industry, CS team size, tools in stack
2. **Challenge** — Specific pain (e.g., "4 hours to prep for a QBR, 38% churn prediction accuracy")
3. **Solution** — Which IntegrateWise components deployed, connectors used, timeline
4. **Implementation** — Setup time, connectors configured, team onboarding
5. **Results** — Quantified outcomes with before/after metrics table
6. **Quote** — Direct quote from CS leader or executive sponsor
7. **What's Next** — Expansion plans (BizOps suite, additional connectors)

### Metrics to Capture

| Category   | Metric                           | Target Improvement |
| ---------- | -------------------------------- | ------------------ |
| Efficiency | QBR prep time                    | 80%+ reduction     |
| Retention  | Churn prediction accuracy        | 2x improvement     |
| Coverage   | Accounts per CSM                 | 50%+ increase      |
| Revenue    | Expansion signals caught         | 3x improvement     |
| Speed      | Time to identify at-risk account | 90%+ reduction     |
