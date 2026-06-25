# IntegrateWise — The Adaptive System

> Adaptive Spine → User Workbench / Twin Workbench / governance layer
> Three layers. Correct order. Each depends on the one below it.

---

## The Order

```
TWIN WORKBENCH (Cloudflare-native)    Reads the Spine. Reasons. Gives weighted instructions.
GOVERNANCE WORKBENCH          Controls approvals, HITL, and controlled mutation.
USER WORKBENCH                Renders projection-native customer/product views.
ADAPTIVE SPINE                The store. Holds Truth + Context + Knowledge Memory. Grows daily.
```

---

## 1. Adaptive Spine

The Spine is the store — the single source of truth. It doesn't load data, it doesn't filter data, it doesn't process data. The Loader loads. The Normalizer filters, cleans, deduplicates, and routes. They write INTO the Spine.

The Spine holds what they write. And it holds it in a way that adapts.

**What makes it adaptive:**

**Schema-driven from day one.** During onboarding, the user picks department + industry. The system composes a schema — 12 department bases × 11 industry overlays. A SaaS CSM gets `cs` schema entities (account_master, success_plan, risk_register, renewal). A CA gets `finance` entities (client, invoice, document, filing). A retail owner gets different entities again. The schema tells the Loader what to extract, tells the Normalizer what to keep and what to drop, and tells the Spine how to store it. The Spine is shaped by the schema before any data arrives.

**Three layers accumulate in it.** The Spine doesn't just hold CRM records. It holds three distinct layers:

- **Truth** — structured data written by the Normalizer at S8. Accounts, contacts, deals, invoices, tasks, tickets. From 70+ connected tools. Cleaned, deduplicated, schema-routed.
- **Context** — unstructured data linked by the Knowledge Service. Emails, Slack messages, meeting notes, documents. Metadata in the Spine, content in embeddings. Connected to entities.
- **Knowledge Memory** — AI session knowledge written by the Triage Bot (the sole writer). Decisions, preferences, insights, facts. Governed — the Twin proposes, you approve, only then it enters. Never written to the Spine tables directly — lives in `consolidated_memories`, read by Entity 360.

**It grows every day.** Every connector sync adds Truth. Every email and document adds Context. Every approved AI session adds Knowledge Memory. The Spine only grows. After a month, it knows the business. After six months, it's institutional memory.

**Entity 360 reads from all three.** When you click on any entity, Entity 360 assembles Truth + Context + Knowledge Memory + Signals in parallel. Under 200ms. The Spine is what makes that possible — all three layers, one store, one read.

---

## 2. Adaptive Workspace

The Workspace renders what the Spine holds. It doesn't decide what to show — the Spine decides. The Workspace is the expression.

**What makes it adaptive:**

**Progressive hydration.** The Workspace doesn't show everything on day one. It shows what the Spine actually has:

- Connect Gmail → tasks section appears
- Connect Salesforce → accounts and contacts appear
- Connect Stripe → revenue section appears
- Connect Slack → conversation context links to entities
- Empty sections stay empty — no fake data, no placeholders

As the Spine grows, the Workspace fills. Sections light up as connectors activate. The Workspace is a live reflection of the Spine's depth.

**Shaped by schema.** The schema that drives the Spine also drives the Workspace. A CSM's sidebar shows accounts, health scores, renewals, risks. A founder's sidebar shows revenue, pipeline, clients, operations. A CA's sidebar shows clients, filings, invoices, compliance. Same Workspace shell, different navigation, different views — all driven by the schema the user chose at onboarding.

**Density-aware rendering.** Sections with rich data get prominent placement. Sections with sparse data get smaller treatment. Sections with no data stay hidden. The Workspace never shows empty views — it only renders what the Spine feeds it.

**User Workbench projections.** Every user gets Work and Personal projections inside the User Workbench. Governance and Twin remain separate surfaces over the same Spine.

**Surface separation.** The system now has three distinct workbenches over one Spine:

- **User Workbench** — the customer/product shell. Accounts, tasks, dashboards, projections, and role-aware operating views.
- **Twin Workbench** — full AI ecosystem surface: skills, knowledge, agents, prompts, conversational library, reasoning.
- **Governance** — embedded at every layer; approval queue and HITL review surface inline in the Operational Workbench.

---

## 3. Adaptive Twin

The Twin sits on top. It reads what the Spine holds and what the Workspace shows. It reasons across the full picture and gives its weight.

**What makes it adaptive:**

**Reads all three layers.** The Twin doesn't read from one tool or one database. It reads Entity 360 — which assembles Truth + Context + Knowledge Memory + Signals from the Spine. The Twin sees the CRM data AND the email thread AND the verified memory from last month's AI session. That's why it catches things no single tool can see.

**Gives weighted insights.** Every insight carries weight — confidence score, evidence chain, source attribution:

- "Acme Corp usage dropped 42%" — from Mixpanel (Truth)
- "Champion mentioned budget freeze" — from Gmail thread (Context)
- "Last QBR noted competitor evaluation" — from approved memory (Knowledge Memory)
- "Renewal in 45 days" — from Salesforce (Truth)
- Confidence: 87% — 4 evidence points across 3 layers
- Recommendation: "Schedule intervention call. Draft risk brief for manager."

The weight comes from the evidence. More sources = higher confidence. Verified knowledge memory = higher weight than inferred patterns.

**Gives operational instructions.** The Twin doesn't just observe. It proposes actions with reasoning:

- Draft a renewal email (pre-written using Spine context)
- Escalate to manager (with evidence package attached)
- Schedule a check-in (with suggested talking points from knowledge memory)
- Flag for weekly review (with risk summary and priority)

Every instruction waits for human approval. Nothing executes without your say.

**Learns from decisions.** The Twin adapts based on what you do:

- Approve → the Twin knows this type of insight is useful, this type of action works
- Dismiss → the Twin learns to deprioritize similar patterns
- Modify → the Twin learns your preferences and adjusts future proposals
- Decision memory accumulates through the Triage Bot → future proposals get sharper

**Gets smarter as the Spine grows.** The Twin's intelligence is a direct function of the Spine's depth. Day one with one connector — the Twin sees fragments. Month one with five connectors and growing knowledge memory — the Twin sees the full picture. The Twin doesn't need retraining. It reads from the Spine, and the Spine grows every day.

---

## The Execution Path

This is how the system moves:

```
LOAD     Connector pulls data from source tools (OAuth, sync, webhook)
  ↓
STORE    Normalizer cleans, deduplicates, validates, routes → writes to Spine
  ↓
THINK    Twin reads Entity 360 (Truth + Context + Knowledge Memory) → generates insights
  ↓
ACT      Approved actions execute on external tools (create task, send email, update record)
  ↓
ADJUST   Twin learns from approvals, dismissals, modifications → decision memory updates
  ↓
REPEAT   Action changed the external tool → Loader picks up changed data → back to STORE
```

Repeat is Flow A only. The system sees its own actions as new structured data. The loop continues.

---

## How They Connect

The Spine doesn't think. The Workspace doesn't reason. The Twin doesn't store.

Each layer does one thing:

| Layer     | Role                                     | Depends On                                                                                                          |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Spine     | Holds Truth + Context + Knowledge Memory | Loader and Normalizer write to it. Triage Bot writes knowledge to it.                                               |
| Workspace | Renders what the Spine holds             | Reads from Spine via Spine DB. Shows what's there, hides what's not.                                                |
| Twin      | Reasons across what the Spine holds      | Reads Entity 360 (assembled from Spine). Writes insights to signals table. Proposes actions. Learns from decisions. |

The Spine grows → the Workspace renders more → the Twin reasons deeper. That's the adaptive loop.

---

_Adaptive Spine. User Workbench. Twin Workbench. governance layer. The Spine holds. The user shell renders. The Twin reasons. Governance controls consequence._
