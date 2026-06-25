## Canonical Internal Doctrine Guardrail

- User Workbench = the projection-native customer/product shell.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- The Twin is a native Cloudflare surface (iw-agent-runtime), not a separate shell.
- When this doc uses public-facing language like "Workbench", interpret that internally as the User Workbench unless stated otherwise.
- Twin runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

---

# IntegrateWise — Solutions & Product Overview

> Three product families. One governed platform. Any industry. Any size.

## What IntegrateWise Is

IntegrateWise is a Knowledge Workspace built on the Spine, powered by governed AI. It connects every tool a business uses into one intelligent system that thinks, acts, and learns — with full human oversight.

## Three Products (Marketed & Sold)

| Product             | What it does                                                | Who it's for                                                                    |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Account Success** | Relationship management across accounts, clients, customers | Anyone managing accounts — CSMs, CAs, hotel managers, freelancers, any industry |
| **Business Ops**    | Operational visibility across the business                  | Anyone running a business — founders, CEOs, COOs, CIOs, operators               |
| **Personal**        | Private workspace for individual productivity               | Everyone — tasks, calendar, notes, knowledge hub, bookmarks                     |

These three are the product families we market, demo, price, and sell through the User Workbench.

## Platform Domains (Available, Not Marketed)

The platform supports 12 department domains. Sales, Marketing, Finance, RevOps, Product Engineering, Service, Procurement, IT Admin, and Education domains all exist and work — dashboards, views, Spine-connected data, navigation. They are accessible within the workspace when a tenant's domain is set to one of these.

They are not productized. They are not on the website. They are not in the pricing page. But if a buyer asks "do you have a Sales view?" or "can my finance team use this?" — the answer is yes, and we can show it.

| Domain              | Status     | Depth                                                                    |
| ------------------- | ---------- | ------------------------------------------------------------------------ |
| Sales               | Functional | Dashboard + Pipeline Kanban + Deals + Contacts + Activities + Analytics  |
| Marketing           | Functional | Dashboard + Campaigns + Attribution + Email Studio + Social + Blog + SEO |
| RevOps              | Functional | Dashboard + Pipeline + Forecast + Quota + Analytics + Cohort + Metrics   |
| Finance             | Functional | Dashboard + Revenue + Expenses + Invoices + Budget + Billing + Tax       |
| Product Engineering | Functional | Dashboard + Roadmap + Features + Bugs + Sprints + Releases + Analytics   |
| Service / Support   | Functional | Dashboard + SLA + Tickets + Customers + Knowledge + Satisfaction         |
| Procurement         | Functional | Dashboard + Renewals + Vendors + Orders + Contracts + Spend              |
| IT Admin            | Functional | Dashboard + Infrastructure + Security + Monitoring + Compliance          |
| Education           | Functional | Dashboard + At-Risk + Courses + Assignments + Grades + Discussions       |

## Core Architecture

```
Experience Layer → Gateway → Workspace Runtime → External Connectivity → Data Plane → Spine (SSOT)
```

### Three Data Paths

| Path                          | Flow                                                                         | Purpose                                                          |
| ----------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Structured → Truth            | OAuth → Loader → Pipeline (8-stage) → Spine                                  | CRM, billing, support data                                       |
| Unstructured → Context        | OAuth → Loader → Pipeline → Spine + Knowledge                                | Emails, docs, meetings                                           |
| AI Sessions → Governed Memory | D1 Buffer → Triage → Triage Bot review → approved knowledge → Twin Workbench | AI reasoning remains governed and never writes directly to Spine |

### Cognitive Layer (Think → Act → Govern)

- **Think**: AI reasoning engine with SignalEngine, Twin triggers, brainstorm
- **Act**: Execution engine for approved actions
- **Govern**: Policy gate — every autonomous action requires approval

## Key Differentiators

1. **Universal, not vertical**: Same three products work for any industry — connectors and schemas change, product doesn't
2. **Entity 360**: Unified view assembling truth + context + signals + memory + goals + relationships
3. **Twin Triggers**: Evidence-backed insights with what/why/action/risk
4. **Approval-Based Personal Memory**: Any AI reads verified knowledge, none write without approval
5. **Identity Resolution**: S7.5 dedup with HITL merge/keep-separate/defer
6. **Trust Layer**: Every insight shows evidence chain, confidence, source flows
7. **12 domains ready**: Even though we sell 3 products, the platform has 12 functional domains ready to demo
