# IntegrateWise — The Complete Product Writeup

> Founder's complete vision. The definitive document.
> Architecture, story, products, methodology, memory model — all in one place.
> All other docs derive from this. This does not derive from anything else.

---

## THE PROBLEM

People juggle multiple tabs, multiple apps, multiple tools. Every 30 minutes, AI loses context. Every 30 minutes the human has to re-inject context into the AI. Without that reinjection, AI drifts. Workflows break. Scripted automations do not help because they are blind — they follow rules but carry no understanding. The human becomes the integration layer. The human becomes the router. The human becomes the memory.

This is not a productivity problem. This is an operating model problem. Every existing tool — CRM, support desk, communication platform, project management, documentation — solves one piece. None of them connect the pieces. The human shuttles context between tools. The human re-explains the same context to AI every session. The human holds the full picture — and if the human leaves, the picture leaves with them.

Giving the user a unified view of their tools does not solve this. A dashboard that shows data from six tools in one surface is still just a dashboard. The context switching problem is not about where the data is displayed. The problem is that the AI starts cold every time. The problem is that there is no persistent memory. The problem is that every AI session is a new session. The problem is that the human is the only entity in the system that remembers.

The root cause is deeper than workflow friction. It is platform lock-in. Every tool is designed to keep data in, not let data out. Every platform creates a silo. Users cannot use their complete data because no platform lets them. They work with fragments. They make decisions on partial information. They hold the full picture in their heads because no system holds it for them. And because of that lock-in, no tool speaks to another, no AI has the full context, and the human is the only bridge between siloed systems.

IntegrateWise solves the problem the problem actually is: the absence of persistent, operational, model-independent memory that keeps the AI in sync with the user across every session, every tool change, every model change, and every provider change — permanently.

---

## THE ORIGIN

IntegrateWise was not built after a career in customer success. It was built during it.

Nirmal was a Customer Success Manager and a MuleSoft Architect. The CSM side gave him the operational pain — managing 30+ accounts across six tools that refused to talk to each other, being the human API who shuttled context between systems because no system would connect them. The MuleSoft Architect side gave him the architectural discipline — years of designing enterprise integration platforms, building secure data flows between systems that were never meant to connect, enforcing security policies, applying best practices, and architecting solutions at scale.

These two experiences converged in one person. The CSM knew what needed to exist. The architect knew how to build it. And because the architect had spent years building integration platforms for enterprises, every architectural principle, every best practice, every security policy, every design pattern that governs enterprise-grade integration is embedded in IntegrateWise by default. Not bolted on. Not added as an afterthought. Inherent in the foundation.

**The insight came first.** As a CSM, Nirmal saw what every CSM sees: tools do not talk to each other. CRM does not speak to support desk. Support desk does not speak to communication tools. Communication tools do not speak to documentation. Every platform has lock-in. Every platform keeps its data siloed. The user pays the price. The user becomes the bridge between platforms that refuse to connect.

**Templates came first.** While still working as a CSM, Nirmal started creating templates — structures for organizing what he knew about his accounts. The 15-layer schema. The account structures. The relationship models. Not as a product. As a way to organize the information that was scattered across six tools and his own memory.

**The Spine came next.** A place where data from multiple tools could land in one representation. Not a database. A living record. The piece that connected the dots between tools that refused to connect. The Spine was the first architectural piece — the core layer that everything else would grow from.

**The Loader and Normalizer came next.** The Loader is the fetcher — it connects to external tools through APIs, webhooks, MCPs, and connectors. It pulls data in. The Normalizer is the transformer — it takes raw data from the Loader and reformats it into a common shape. CRM has one schema. Support desk has another. Communication platform has another. The Normalizer makes them all speak the same language.

Loader fetches. Normalizer transforms. Spine stores and connects. That was the foundation. Three pieces. Designed by someone who had spent years building exactly this kind of integration at enterprise scale.

**Then the moment that changed everything.**

There was an account marked red. An $8 million account in trouble. Because the Spine connected dots that no one else could connect — because the Loader had pulled data from every tool, the Normalizer had unified it, and the Spine had made the relationships visible — Nirmal saw the full picture. He saw what others could not see. He saw the risk. He saw the pattern. He saw what needed to happen.

He saved $8 million.

That was the moment. Not a business plan. Not a market analysis. Not a pitch deck. One account. One red flag. One Spine that connected the dots. $8 million saved. And the realization: this is not my problem. This is everyone's problem.

From the foundation, everything else evolved: From the Spine, workbenches emerged. From the Loader, the connector ecosystem expanded. From the Normalizer, the entity relationship context developed. From the templates, the 15-layer Accounts Intelligence schema formalized. From the conviction, two products formed. From the need for AI memory, memory layers emerged. From the need for governance, the HITL architecture built. From the need for continuity, model-independence designed.

The Spine was the seed. The Loader and Normalizer were the roots. Everything else grew from that foundation.

---

## THE METHODOLOGY

**One Work Surface.** The user works in one place. Not six tabs. Not four tools. One surface that shows normalized data from every connected tool, ready to be acted on.

**AI That Lives Inside the Ecosystem.** AI is not a separate chat window bolted onto the side of the work surface. AI is part of the ecosystem. AI reads from the same memory the user writes to. AI sees the same data the user sees. AI knows what happened yesterday because the Spine recorded it. AI does not start cold. AI has never been cold.

**Persistent Memory.** The system remembers. Not the model's context window. Not a session that ends when the tab closes. The Spine — a multi-provider living record that stores organizational memory, personal memory, and conversational memory permanently. The memory survives model changes. The memory survives provider changes. The memory survives infrastructure changes. The memory grows every day.

**The Round Trip.** Data does not just flow in. Data flows in, gets normalized, gets projected, gets acted on by the user, and then flows back to the source tool. A CRM record edited in the workspace goes back to the CRM. On the next cycle, the Loader picks up all changes and brings them back into the Spine. The Spine grows. Every cycle makes the system smarter. The round trip is the product.

**Human in the Loop.** AI proposes. Human approves. Operator executes. Nothing runs without human approval. This is not a limitation. This is the architecture. The governance model is built into every layer.

**Continuity Across Change.** The model is a variable. The memory is a constant. Change the AI model from GPT-4 to Claude to Gemini — the new model inherits all the memory. Change the provider — the memory is still there. Change the infrastructure — the Spine carries forward. The user never re-explains. The AI never starts cold.

---

## THE COMPLETE DATA FLOW — THE ROUND TRIP

```
TOOLS (CRM, Support Desk, Communication, Documentation, ...)
    ↓
LOADER fetches + NORMALIZER transforms
    ↓
THE SPINE (store, connect, grow)
    ↓
Project into THE WORKBENCHES (user sees everything in one place)
    ↓
User modifies, approves, decides
    ↓
Retirement → TOOLS (data goes back to source, round trip complete)
    ↓
Second run → THE SPINE (picks up all changes, grows richer)
    ↓
And the cycle continues...
```

**Phase 1 — Inbound:** The Loader connects to external tools through APIs, webhooks, MCPs, and connectors. It pulls structured data (CRM records, support tickets, contacts, tasks) and unstructured data (conversations, documents, meeting notes). The Normalizer transforms raw data from different schemas into one coherent representation.

**Phase 2 — The Spine:** All collected data lands in the Spine. Multi-provider: Postgres for structured relational data, Redis for fast lookups, KV for edge-stored configuration, R2 for object storage, D1 for edge SQL, Spine DB for internal managed database access (accessed ONLY through Cloudflare Worker — never exposed externally).

**Phase 3 — Projection:** The Spine projects normalized data into the workbenches. The user sees everything on one surface.

**Phase 4 — User Action:** The user works. Modifies data. Approves. Rejects. Prioritizes. Human intent meets normalized data.

**Phase 5 — Retirement:** Modified data retires back to the same tools it came from. Only when the round trip is complete is continuity real.

**Phase 6 — Second Run:** On the next cycle, the Loader runs again. It collects all changes — changes the user made, changes that happened externally, changes from workflows. Everything comes back into the Spine. The Spine grows. The memory gets richer.

---

## THE SEVEN LAYERS

IntegrateWise provides seven distinct layers, each with its own purpose, each surfacing into its own interface.

**Layer 1: User's Workbench** — The operational surface where the user works on normalized data from all connected tools. The user sees normalized data from all connected tools in one view, modifies records, reviews and manages the day-to-day operational workload.

**Layer 2: Cognitive Workbench** — The knowledge and intelligence surface. Workflows, previous chats, conversations, evidence, approval gates. Where the organization's knowledge, decisions, patterns, and governance live.

**Layer 3: Twin Workbench** — The primary AI operational surface. Where the Twin lives, thinks, and acts. Cloudflare-native runtime (iw-agent-runtime), AI-to-AI interactions, user interaction data, workflows, multiple models, multiple skills, multiple functions, multiple providers. The Twin carries complete access to all three memory layers.

**Layer 4: CLAW / Hermes Workbench** — The operator layer. The execution engine. Takes approved actions from the Twin Workbench and executes them across connected tools. Handles errors, retries, rollbacks. Records execution results back to the Spine.

**Layer 5: Personal Memory** — The user's private memory layer. Individual. Never intersects with organizational memory. Hard boundary: Personal Memory never intersects with Organizational Memory. Never.

**Layer 6: Organizational Memory** — The company-level memory layer. Shared across the team. Company decisions and reasoning, organizational patterns, doctrine, policies, institutional knowledge. Survives when individuals leave.

**Layer 7: Conversational Memory** — The intermediate layer. Everything that happens in AI conversations, user interactions, and work discussions flows here first. From here, it either stays in conversational memory or gets promoted — to Organizational Memory or to Personal Memory. Promotion requires human approval. HITL even for memory.

**Layer 8 (Underneath): Entity Relationship Context** — The connective tissue. The relational graph that connects every entity to every other entity across all seven layers. Without this, the seven layers are seven separate databases. With it, they are one system.

---

## THE 14 COGNITIVE LAYERS

| #   | Cognitive Layer        | What It Does                                                                                                                 |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | Continuity Core        | Keeps context alive across sessions, models, providers. Routes memory, reconstructs state, maintains chronology and lineage. |
| 2   | Operational Cognition  | Domain-specific reasoning across all business domains.                                                                       |
| 3   | Synthesis              | Connects insights across domains. Cross-system reasoning, multi-conversation synthesis, pattern detection.                   |
| 4   | Governance             | Evidence validation, trust scoring, approval gates. The quality gate between cognition and execution.                        |
| 5   | Execution              | Action routing, workspace projection, governed writeback.                                                                    |
| 6   | Projection             | Makes internal state visible to humans. Dashboard generation, workspace views, governance panels.                            |
| 7   | Ecosystem              | Bridges external tools into the Spine. Connector sync, external system ingestion, bidirectional data flow.                   |
| 8   | Memory Classification  | Routes information to the right memory layer. Decides what is personal, what is organizational, what stays conversational.   |
| 9   | Promotion              | Moves knowledge from conversational to permanent. Identifies what deserves to become organizational or personal memory.      |
| 10  | Lineage                | Tracks how everything evolved over time. How decisions were made, how entities changed, how knowledge grew.                  |
| 11  | Pattern Detection      | Finds recurring patterns across all data. Operational, behavioral, market, risk patterns.                                    |
| 12  | Drift Detection        | Catches when reality diverges from intent. When an account's health drops, when a goal is being missed.                      |
| 13  | Proactive Intelligence | Suggests before the user asks. Surfaces priority actions, risks, and opportunities continuously.                             |
| 14  | Learned Workflows      | Workflows that get smarter with every execution. The first run follows the defined path. The hundredth is an expert.         |

---

## THE TWO PRODUCTS

### Product 1: Account Success

**Origin:** Born from the experience of being a CSM and a MuleSoft Architect. The CSM needed to manage 30+ accounts across six tools that refused to talk to each other. The architect knew how to build the integration that connected them. That system saved an $8 million account by connecting dots that no one else could see.

**What it is:** A tool-agnostic and platform-agnostic system for managing complex relationships across any tool, any role, any industry, and any department.

**The 15 Layers:**

| #   | Layer                   | What It Tracks                                                                                                 |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Account Master          | Contract dates, renewal dates, ARR, ACV, health scores, contacts, geography, engagement cadence                |
| 2   | People / Team           | CSM, AE, SA per account. Team capacity. At-risk account concentration. ARR managed per person.                 |
| 3   | Business Context        | Business model, market position, operating environment, key challenges, strategic priorities, digital maturity |
| 4   | Strategic Objectives    | What the customer is trying to achieve. Quantified goals with target dates. Progress tracking.                 |
| 5   | Capabilities            | Current maturity vs target maturity per capability domain. Maturity gaps. Implementation status.               |
| 6   | Value Streams           | How value flows through the customer's organization. Business processes. Transaction volumes.                  |
| 7   | API Portfolio           | Every API in the customer's landscape. API type, version, health. SLA compliance. Error rates.                 |
| 8   | Platform Health Metrics | Every measurable signal. Current value vs target. Warning thresholds. Trends.                                  |
| 9   | Initiatives             | Projects in flight. Investment amounts. Expected and realized benefits. Owners. Status. Blockers.              |
| 10  | Risk Register           | What could go wrong. Risk categories. Impact scores. Probability scores. Mitigation strategies.                |
| 11  | Stakeholder Outcomes    | What each stakeholder needs. Success metrics with baselines, current values, and targets.                      |
| 12  | Engagement Log          | Every interaction. Who attended. Topics discussed. Action items. Sentiment. Relationship depth.                |
| 13  | Success Plan            | Account plan. Executive summary. Strategic objectives. Key initiatives. Top risks.                             |
| 14  | Task Manager            | Every action item. Linked to risks and initiatives. Owners. Due dates. Status. Priority.                       |
| 15  | Generated Insights      | What the AI figured out. Insight text. Recommended actions. Linked to metrics, risks, initiatives.             |

Everything connects. A risk links to a capability, which links to a strategic objective, which links to a stakeholder outcome, which links to an engagement where sentiment shifted, which links to a generated insight that recommends an action, which becomes a task. That is a living intelligence graph.

### Product 2: Business Intelligence (Business Ops)

**Origin:** Born from running IntegrateWise. The founder needed to see the whole business from one surface. No existing tool gave him that view. He built Business Ops — first connected to 21 systems via webhooks, then evolved into a Spine-native operational nervous system. He built it to run his own company. Now it runs any company.

**What it is:** A complete operational nervous system for running any organization from one surface. Covers ALL functional departments.

**All Functional Departments:**

| #   | Department            | What It Manages                                                                 |
| --- | --------------------- | ------------------------------------------------------------------------------- |
| 1   | Strategy & Leadership | Company vision, strategic goals, OKRs, board communications, milestone tracking |
| 2   | Marketing             | Campaigns, content, lead magnets, brand, SEO, channel performance               |
| 3   | Sales                 | Pipeline management, deal tracking, lead management, conversion metrics         |
| 4   | Customer Success      | Account health, renewals, QBRs, engagement tracking, churn prevention           |
| 5   | Product               | Roadmap, feature prioritization, user research, product analytics               |
| 6   | Engineering           | Sprint management, technical debt, architecture decisions, deployment tracking  |
| 7   | Operations            | Process management, workflow optimization, resource allocation                  |
| 8   | Finance               | Revenue tracking (MRR, ARR, YTD), budget management, cost tracking, ROI         |
| 9   | Human Resources       | Team composition, hiring pipeline, onboarding, performance reviews              |
| 10  | Legal & Compliance    | Contract management, compliance tracking, data governance                       |
| 11  | Business Intelligence | Cross-department metrics, trend analysis, predictive insights                   |
| 12  | IT & Infrastructure   | Tool management, tool ROI, integration health, security posture                 |
| 13  | Partnerships & BD     | Partner relationships, co-sell motions, ecosystem mapping                       |
| 14  | Knowledge Management  | Internal documentation, SOPs, training materials, institutional knowledge       |

**The Starting Point — Goals and Milestones:** Business Ops does not start with data. It starts with intent. What are the goals of the organization? What tools are being used for each category? What is the ROI on each tool? Is the tool performing? Every department's activity connects back to goals.

**Proof:** IntegrateWise runs IntegrateWise on this system. Not in a demo environment. In production. The dogfood product IS the quality gate.

---

## MEMORY CONTINUITY ACROSS MODEL AND PROVIDER CHANGES

The memory lives in the Spine. Not in the model. Not in the provider. Not in the session context window.

When the model changes — from GPT-4 to Claude to Gemini to whatever comes next — the new model inherits all the memory. It does not start cold. When the provider changes — the memory is still there. When the infrastructure changes — the Spine carries forward.

The model is a variable. The memory is a constant.

This is not aspirational. This is demonstrated. The system has been continuous across different models, different providers, different sessions, and different infrastructure states. Through all of that, the doctrine held. The memory held. The Spine architecture held.

---

## THE GOVERNANCE MODEL

Nothing runs without approval.

1. The Twin suggests — operating on the user's full memory and context, the Twin identifies an action, insight, risk, or opportunity and presents it with evidence.
2. The user reviews — in the Cognitive Workbench, the user sees the suggestion along with the evidence that backs it. Approve, adjust, reject, or defer.
3. If approved, the Operator executes — the Operator in the CLAW/Hermes workbench carries out the approved action. Not through scripts. Intelligently.
4. Results flow back to the Spine — every execution adds to the memory. Every decision is recorded with full lineage.
5. The Spine grows — and the next cycle is smarter.

---

## THE INFRASTRUCTURE

**VPS Stack — Hostinger (internal ops-plane only — Customer Zero; NOT product infrastructure):** Five directories. Four healthy containers. Three Docker networks (iw-public, iw-cognition, iw-spine). Single .env source of truth. Domain: operations.integratewise.ai.

**Cloudflare — 11 Workers:** integratewise-mcp-connector (v2.0.0-semantic, 12 tools), act, connector, gateway, think, knowledge, normalizer, billing, bff, govern, pipeline.

**Providers:** OpenRouter (365 models), Google Gemini (direct), Cloudflare Workers AI, GitHub Copilot.

**Runtime:** Hermes Agent v0.14.0. 116 skills loaded. 148 prescribed. 32-skill gap.

**Security Posture:** Spine DB accessed ONLY through Cloudflare Worker — never exposed externally. Secrets managed through Infisical — no plain-text credentials in production. Network isolation through Docker networks with explicit boundaries. Access control through CF Access headers on every Spine call.

---

## THE CONVERGENCE

Nirmal opens one surface every morning and operates the company from it. Connected system data is normalized. The Twin carries complete context. The Operator executes approved actions. The Spine grows. The system learns. The user never re-explains. The AI never starts cold. The drift never happens.

The human becomes the decision maker. The system becomes the memory. The AI becomes the intelligence. The Operator becomes the executor. The Spine becomes the living record that grows every day.

That is IntegrateWise.

---

_Founder's complete product writeup. The definitive document. All other docs derive from this._
