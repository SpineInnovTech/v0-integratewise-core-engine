# IntegrateWise — Architecture Document

**v2.0 · May 2025**  
**Author:** Nirmal, Founder  
**Scope:** Internal reference. Source of truth for product, docs, marketing, and pricing.  
**Supersedes:** All previous architecture descriptions.

---

> IntegrateWise is the governed memory and continuity layer for organisations. It does not aim to replace the customer's execution stack; instead, it connects to that stack through a global MCP-based connector layer, projects governed context into the workbench, and enables lightweight, approval-aware actions where necessary.
>
> **IntegrateWise owns memory. The customer owns execution. MCP connects the two.**

---

## 1. The Boundary

IntegrateWise has a clear ownership boundary. Everything inside the boundary is IntegrateWise's responsibility. Everything outside belongs to the customer or the ecosystem.

### IntegrateWise Owns — Our Layer

| Component             | Description                                     |
| --------------------- | ----------------------------------------------- |
| Memory Core           | Personal, conversational, organisational memory |
| Intelligence Platform | Structured data, entities, lineage              |
| Governance Rail       | Approvals, promotion, policies, audit           |
| Twin / Reasoning      | AI that reads over memory and generates insight |
| View Layer            | Dashboards, signal monitor, executive view      |
| MCP Server            | The global connector to external systems        |

### Customer Owns — Their Layer

| Component                | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| Execution infrastructure | Agents, workflow runners, automation                           |
| Tool runtime             | Open WebUI, Agent Zero, n8n, Zapier, internal tools            |
| AI models                | Their own model deployments (or proxied through IntegrateWise) |
| Workflow orchestration   | How tasks get done                                             |
| Agent systems            | Autonomous agents that act on behalf of users                  |

**Why this boundary:** Execution infrastructure is expensive to host, hard to generalise, and already exists in the customer's stack. Memory is the layer nobody else owns. By staying on the memory side, IntegrateWise remains lean, affordable, and focused on the unique value nobody else provides.

---

## 2. The Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    INTEGRATEWISE                         │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Memory Core                                        │ │
│  │  Personal · Conversational · Organisational         │ │
│  │  Intelligence Platform · Lineage · Entities         │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                                │
│              ┌───────────┼───────────┐                    │
│              │           │           │                    │
│  ┌───────────┴──┐  ┌────┴─────┐  ┌──┴──────────────┐   │
│  │ View Layer   │  │ Twin /   │  │ Governance      │   │
│  │              │  │ Reasoning│  │ Sidebar         │   │
│  │ Dashboards   │  │          │  │                 │   │
│  │ Signal Mon.  │  │ Reads    │  │ Approvals       │   │
│  │ Exec View    │  │ memory,  │  │ Insights        │   │
│  │ Workbench    │  │ generates│  │ Suggestions     │   │
│  │              │  │ insight  │  │ Promotion       │   │
│  └──────────────┘  └──────────┘  └─────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  MCP Server — Global Connector                      │ │
│  │  Reads · Writes · Events · Memory-aware actions     │ │
│  └────────────────────────┬────────────────────────────┘ │
└──────────────────────────┼──────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
   ┌───────┴──────┐ ┌──────┴──────┐ ┌─────┴───────┐
   │ Customer's   │ │ MCP Bridges │ │ Any MCP-    │
   │ Agent Stack  │ │ for Legacy  │ │ Compatible  │
   │ (Zero, OWUI) │ │ (CRM, etc.) │ │ Tool        │
   └──────────────┘ └─────────────┘ └─────────────┘
   Customer owns     Bridges for      Ecosystem
   execution         non-MCP tools    builds
```

---

## 3. Component Definitions

### 3.1 Memory Core

The canonical layer. A single source of truth for the organisation's intelligence. **This is the product.**

| Component             | What It Does                                      | Persistence                             |
| --------------------- | ------------------------------------------------- | --------------------------------------- |
| Personal Memory       | Per-user private notes, preferences, bookmarks    | Permanent. Private to user.             |
| Conversational Memory | Full conversation threads with context            | Permanent. Private to user. Searchable. |
| Organisational Memory | Promoted insights, shared knowledge, SOPs         | Permanent. Shared with team.            |
| Intelligence Platform | Structured data — accounts, departments, entities | Permanent. Governed.                    |
| Lineage               | Every data point traceable to its source          | Immutable.                              |

**Key property:** Memory is the layer nobody else owns. CRM vendors own CRM data. Support vendors own tickets. But nobody owns the cross-system, persistent, governed memory that ties it all together. That's IntegrateWise.

---

### 3.2 Twin / Reasoning Layer

The AI that reads over memory and generates insight. It does not execute workflows. It does not replace the customer's agent stack. It reasons.

| Capability               | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| Natural language queries | Ask questions about accounts, signals, trends, and memory   |
| Insight generation       | Proactive recommendations from cross-domain analysis        |
| Context surfacing        | Relevant memory projected into the workbench automatically  |
| Multi-model reasoning    | Switch between AI models without losing context             |
| Lightweight actions      | Propose tasks, notes, promotions — governed, not autonomous |

**Principle:** The Twin generates the _what_. The customer's execution stack handles the _how_.

---

### 3.3 Governance Sidebar

A collapsible right-side panel in the workbench. Surfaces what needs attention without requiring a separate interface.

| Section         | What It Shows                                                         |
| --------------- | --------------------------------------------------------------------- |
| Approvals       | Actions proposed by the Twin that need human review before proceeding |
| Insights        | New signals, predictions, and cross-domain correlations               |
| Suggestions     | Recommended actions based on current context                          |
| Promotion Queue | Working-layer findings ready to be promoted to organisational memory  |

---

### 3.4 View Layer

Projections of memory. Read-only. Every team member sees the same truth through a role-specific lens.

| View                   | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| Account Dashboard      | Portfolio health, risk indicators, KPIs                             |
| Intelligence Dashboard | Live signals, predictions, correlations                             |
| Executive View         | Board-level health, one-number view                                 |
| Signal Monitor         | Real-time alerts across all domains                                 |
| Memory Explorer        | Browse and search all three memory layers                           |
| Workbench              | The primary interface — Twin chat + dashboards + governance sidebar |

---

### 3.5 MCP Server — Global Connector

The universal bridge between IntegrateWise and the customer's ecosystem. One protocol, infinite connections.

MCP plays three roles:

1. **Standard ingress/egress** — for tools, apps, and data sources
2. **Common protocol** — for memory-aware actions across systems
3. **Thin bridge** — between governed context and user-owned execution

| MCP Function               | Direction | Examples                                                    |
| -------------------------- | --------- | ----------------------------------------------------------- |
| Read from external tools   | Inbound   | Pull CRM data, support tickets, product metrics into memory |
| Write to external tools    | Outbound  | Create tasks, update records, send notifications            |
| Emit events                | Outbound  | Signal detected, health changed, memory promoted            |
| Expose memory as MCP tools | Outbound  | Customer's agents can query IntegrateWise memory via MCP    |

**What MCP is not:** It is not an execution runtime. It is not a workflow engine. It does not replace the customer's automation stack. It is a protocol-level bridge — thin, stateless, and universal.

---

## 4. What Is Explicitly Out of Scope

IntegrateWise does not build, host, or maintain:

| Out of Scope                                     | Reason                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| ✕ Workflow orchestration engine                  | The customer uses n8n, Zapier, Temporal, or their own system.                                                  |
| ✕ Agent runtime / autonomous agents              | The customer uses Agent Zero, AutoGPT, LangGraph, or their own system.                                         |
| ✕ AI chat interface / Open WebUI                 | The customer uses Open WebUI, ChatGPT, or their own system.                                                    |
| ✕ Full execution of complex multi-step workflows | IntegrateWise handles lightweight, governed actions. Multi-step orchestration belongs to the customer's stack. |
| ✕ Hosting the customer's AI models               | Enterprise can bring private models. IntegrateWise proxies, not hosts.                                         |

**Why these are out of scope:** Hosting execution infrastructure creates a cost structure that customers won't pay for when they already have their own stack. By staying lean on the memory side, IntegrateWise remains affordable and focused.

---

## 5. How the Pieces Connect

### Why the Unit Economics Work

Execution infrastructure is expensive to host: VPS, Docker, Workers, Redis, Spine DB, R2, KV, D1 — and that's just for memory and intelligence. Double it for execution: workflow runners, action queues, retry logic, rollback handlers, error monitoring, per-action compute.

The customer already pays for n8n. Already pays for HubSpot workflows. Already pays for Jira automation. If IntegrateWise adds execution on top, they pay IntegrateWise **and** continue paying for the tools they already use. Twice for the same capability. Worse — our version has less coverage than tools they've been using for years.

Memory doesn't have this problem. Nobody is paying anyone else for cross-system, governed, persistent institutional memory. That bill doesn't exist yet. IntegrateWise creates a new line item, not a duplicate of an existing one.

### MCP Appears Twice

MCP is at both ends of the loop. It is the bridge in both directions.

**Inbound — data ingestion:**

```
External Tool (HubSpot, Jira, Stripe, ...)
        │
        ▼
  MCP Server ── universal connector, reads from tool
        │
        ▼
    Loader ── fetches raw data
        │
        ▼
  Normalizer ── 8 stages, canonical schema
        │
        ▼
    Spine ── stores canonical entities
```

**Outbound — intelligence + lightweight writeback:**

```
    Spine
        │
        ▼
    Twin ── reads memory, generates insight, proposes
        │
        ▼
  View Layer ── dashboards, Entity 360, signals
        │
        ▼
Governance Sidebar ── proposals, approvals
        │
        ▼
    Human ── approves or acts in native tool
        │
        ▼ (if lightweight action approved)
  MCP Server ── writes back to external tool
        │
        ▼
External Tool (task created, record updated)
```

### The Full Loop

```
Tool → MCP → Loader → Normalizer → Spine → Twin → View → Governance → Human → MCP → Tool
 │                                                                                    │
 └──────────────────────── memory compounds, loop continues ─────────────────────────┘
```

Memory compounds with every pass through the loop. After a month, the Spine knows the business. After six months, it is institutional memory. The loop is the moat.

### A Typical Flow

1. **Data enters via MCP** — CRM data, support tickets, product metrics flow into the Intelligence Platform through the global connector.
2. **Memory is enriched** — data is normalised, deduplicated, cross-referenced, and stored in the canonical layer with full lineage.
3. **Twin reasons** — the reasoning layer detects signals, generates insights, and surfaces them in the view layer.
4. **Governance surfaces** — the right-side sidebar shows approvals, insights, and suggestions to the user.
5. **User acts (or approves)** — the user can approve a proposed action, which writes back through MCP to the external tool.
6. **Customer's agents query memory** — the customer's autonomous agents read context from IntegrateWise via MCP, execute in their own stack, and write results back.

### The Workbench

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  WORKBENCH                        GOVERNANCE     │
│                                  SIDEBAR (right) │
│  ┌──────────────────────────┐   ┌──────────────┐ │
│  │                          │   │              │ │
│  │  Twin chat               │   │  Approvals   │ │
│  │  Inline insights         │   │  Insights    │ │
│  │  Dashboard widgets       │   │  Suggestions │ │
│  │  Signal feed             │   │  Promotions  │ │
│  │  Memory context          │   │              │ │
│  │                          │   │ (collapsible)│ │
│  └──────────────────────────┘   └──────────────┘ │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 6. Principles

| #   | Principle                                   | Description                                                                                                                                              |
| --- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Memory is the product**                   | Persistent, governed, cross-system memory is what nobody else provides. Everything else supports memory.                                                 |
| 2   | **Don't compete with the customer's stack** | If they already have agents, workflow runners, and AI interfaces, don't rebuild those. Connect to them.                                                  |
| 3   | **Execution is expensive, memory scales**   | Hosting execution infrastructure creates cost the customer won't pay for. Memory has predictable costs and high margins.                                 |
| 4   | **One connector, not twenty**               | MCP as the universal protocol replaces the need for native connectors to every tool. One server, infinite connections.                                   |
| 5   | **Lightweight actions, governed always**    | IntegrateWise can propose and execute simple actions. Complex orchestration belongs to the customer's stack. All actions go through the governance rail. |
| 6   | **The Twin reasons, it doesn't execute**    | The Twin reads memory and generates insight. It tells you _what_. Your execution stack handles _how_.                                                    |

---

## 7. What We Sell

### Buyer Gets

| What                         | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| Persistent, governed memory  | Three layers. Always-on. Cross-system. Survives people and time.         |
| Intelligence Platform        | Structured data across accounts, departments, and entities.              |
| Twin (reasoning over memory) | AI that reads your memory, surfaces insights, proposes actions.          |
| Governance sidebar           | Approvals, insights, and suggestions — always visible, never in the way. |
| Dashboards and views         | Role-specific projections of canonical state.                            |
| MCP global connector         | One protocol to connect everything. No per-tool integration cost.        |
| Lightweight governed actions | Create tasks, update records, send notifications — approval-aware.       |

### Buyer Does NOT Get

| What                      | Why                                                  |
| ------------------------- | ---------------------------------------------------- |
| Hosted workflow engine    | They already have one.                               |
| Hosted agent runtime      | They already have one.                               |
| Hosted AI chat interface  | They already have one.                               |
| Full autonomous execution | Too expensive to host. Too risky without governance. |

---

## 8. Naming

| Name                   | Is                                                        | Is Not                        |
| ---------------------- | --------------------------------------------------------- | ----------------------------- |
| IntegrateWise          | The memory and governance platform                        | An execution platform         |
| Intelligence Platform  | The canonical memory layer                                | A workflow engine             |
| Twin                   | Reasoning layer over memory                               | An autonomous agent           |
| Hermes                 | The Twin's reasoning engine (skill-based, model-agnostic) | An execution engine           |
| MCP / Global Connector | Universal bridge to external systems                      | A runtime or hosted service   |
| Governance Sidebar     | Right-side panel for approvals and insights               | A separate workbench          |
| Workbench              | The single user interface                                 | Multiple separate workbenches |

---

## 9. Summary

IntegrateWise is a memory-first platform. It provides persistent, governed, cross-system memory that no single tool vendor owns. It connects to the customer's existing execution stack through a universal MCP-based connector. It surfaces insights and governance through a lightweight workbench with a collapsible sidebar. It does not attempt to replace the customer's agents, workflow runners, or AI interfaces.

This architecture keeps IntegrateWise lean, affordable, and focused on the unique value that nobody else provides: **the layer where institutional knowledge lives, persists, and compounds.**

---

_Document: IntegrateWise Architecture v2.0_  
_Author: Nirmal, Founder_  
_Scope: Internal reference. Source of truth for product, docs, marketing, and pricing._  
_Supersedes: All previous architecture descriptions._
