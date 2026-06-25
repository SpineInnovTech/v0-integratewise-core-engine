# IntegrateWise Architecture 2.0 — Documentation Guide

**Version:** 2.0  
**Date:** 2026-06-09  
**Status:** Canonical

---

## 🎯 Start Here

**If you're new or returning after a break, read these in order:**

### 1. **The System Statement** (30 seconds)

```
One Twin                    = Persistent cognitive orchestrator
One Spine                   = Operational truth substrate
One Memory                  = Institutional knowledge
One Governance Layer        = HITL approval gate
One Bridge                  = MCP + ADK communication layer

Many Interfaces             = OWUI, Voice, API, CLI, Email, Mobile
Many Execution Providers    = APIs, Browser, MCP, Workflows, Human

Infinite Capabilities       = Business outcomes
```

### 2. **Master Architecture** (15 minutes)

📄 `docs/tech/INTEGRATEWISE_CANONICAL_ARCHITECTURE.md`

This is THE definitive architecture document. Read this first.

### 3. **Architecture Update** (5 minutes)

📄 `docs/ARCHITECTURE_UPDATE_2026-06-09.md`

What changed today, why it matters, what's next.

---

## 📚 Core Architecture Documents

### **Foundation Layer**

| Document                                  | Purpose             | When to Read           |
| ----------------------------------------- | ------------------- | ---------------------- |
| `INTEGRATEWISE_CANONICAL_ARCHITECTURE.md` | Master architecture | Always start here      |
| `ARCHITECTURE_UPDATE_2026-06-09.md`       | What changed today  | After master doc       |
| `INTEGRATEWISE_PRODUCT_ARCHITECTURE.md`   | Legacy product doc  | For historical context |

### **Twin Layer**

| Document                            | Purpose              | When to Read         |
| ----------------------------------- | -------------------- | -------------------- |
| `TWIN_AS_COGNITIVE_ORCHESTRATOR.md` | Twin Runtime details | Building Twin        |
| `TWIN_VOICE_INTERFACE.md`           | Voice integration    | Adding voice         |
| `TWIN_BROWSER_EXECUTION.md`         | Browser automation   | Adding browser agent |

### **Memory Layer**

| Document                        | Purpose                 | When to Read            |
| ------------------------------- | ----------------------- | ----------------------- |
| `MEMORY_GOVERNANCE_DOCTRINE.md` | Memory write rules      | Understanding memory    |
| `memory-pipeline-episode.json`  | Book of Records episode | Example format          |
| `triage-output-schema.ts`       | TypeScript schema       | Implementing Triage Bot |
| `owui-skill-manifest.md`        | Skills documentation    | Wiring OWUI to Twin     |

### **Data Layer**

| Document                                       | Purpose            | When to Read           |
| ---------------------------------------------- | ------------------ | ---------------------- |
| `ENTITY_BINDING_AND_RELATIONSHIPS.md`          | Spine architecture | Understanding entities |
| `MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md` | MCP + ADK          | Building integrations  |

### **Product Layer**

| Document                              | Purpose           | When to Read           |
| ------------------------------------- | ----------------- | ---------------------- |
| `LAYER_OWNERSHIP_AND_TWIN_RUNTIME.md` | S/U/V/CZ layers   | Understanding surfaces |
| `FRONTEND_LAYER_MAP.md`               | Frontend surfaces | Building UI            |
| `CANONICAL_TAXONOMY.md`               | Terminology       | Learning the language  |

---

## 🔑 Key Concepts

### **ONE TWIN**

The Twin is **NOT:**

- ❌ A chatbot
- ❌ A UI (OWUI)
- ❌ A model (Grok-4.3)
- ❌ A profile (Hermes/Think/Fast)

The Twin **IS:**

- ✅ Persistent cognitive orchestrator
- ✅ Always-on (every 5 minutes, 24/7)
- ✅ Observes system state
- ✅ Reasons via OpenRouter Agents
- ✅ Proposes governed actions
- ✅ Coordinates execution
- ✅ Monitors outcomes
- ✅ Learns via Triage Bot

**Location:**

- VPS (dev): `twin-runtime.operations.integratewise.ai`
- CF Worker (prod): `services/twin-orchestrator/`

---

### **ONE SPINE**

**What:** Canonical entity graph across all tools

**Entities:**

- Person, Account, Deal, Task, Ticket, Invoice, Project, Email, Event, Document

**Relationships:**

- works_at, owns, assigned_to, related_to, reports_to, manages, created_by

**Signals:**

- Entity changes (health drop, stall, status change)
- Weak signals (anomalies, patterns, predictions)

**Writer:** Pipeline service (SOLE writer)

**Readers:** MCP tools, Twin, ADK

**The Moat:** 30+ connectors normalized into one graph

---

### **ONE MEMORY**

**Format:** Book of Records (6 primitives)

1. Episode — Time-bounded chapter
2. Decision — Explicit choice + rationale
3. Learning — Takeaway for future work
4. Commitment — What we agreed to do
5. Fact — Verifiable institutional fact
6. Action Item — What needs addressing

**Writer:** Triage Bot ONLY (no direct writes)

**Storage:**

- Conversational Memory (staging book, 90 days TTL)
- Org Memory (promoted, permanent)
- Personal Memory (user-scoped, 90 days TTL)

**Flow:**

```
AI Worker → AI Worker → Triage Bot → Conversational Memory
                                            ↓
                        ┌───────────────────┼───────────────────┐
                        ↓                   ↓                   ↓
                  Search Index      Governance Queue    Promotion Queue
                   (auto)              (review)            (review)
                                                               ↓
                                                          Org Memory
                                                          (approved)
```

---

### **ONE GOVERNANCE LAYER**

**Flow:**

```
Twin → Propose
  ↓
Governance Queue (proposal created)
  ↓
Human Reviews (L2 UI)
  ↓
Approve or Reject
  ↓ (if approved)
Act Service → Execute
  ↓
Triage Bot → Record outcome
```

**Rules:**

- Read operations: No approval
- Write operations: Always approval
- High-risk actions: Require justification
- Browser automation: Requires step review

---

### **ONE BRIDGE**

**MCP (Model Context Protocol):**

- 20 canonical tools
- OAuth 2.0 (RS256 JWT)
- Server: https://mcp.integratewise.ai

**ADK (Application Development Kit):**

- REST APIs (gateway.integratewise.ai)
- TypeScript SDK (@integratewise/sdk)
- React hooks (@integratewise/react)
- Webhooks (webhook-ingress)

---

### **MANY INTERFACES**

All interfaces reach the **same Twin Runtime:**

1. **OWUI (Chat)** — twin.integratewise.ai
2. **Voice (Speak)** — x.ai STT + TTS
3. **API (Programmatic)** — twin.dev.integratewise.ai/v1/chat/completions
4. **CLI (Terminal)** — iw twin ask "..." (planned)
5. **Email (Async)** — twin@integratewise.ai (planned)
6. **Mobile (App)** — iOS + Android (planned)

---

### **MANY EXECUTION PROVIDERS**

Twin proposes, Governance approves, Act dispatches:

1. **APIs** — HubSpot, Jira, Salesforce, Gmail, Slack, etc.
2. **Browser Agent** — Playwright (VPS) + Puppeteer (CF)
3. **MCP Tools** — 20 canonical tools
4. **Workflows** — CF Workflows (durable execution)
5. **Human Tasks** — Manual workflows (L2 UI)
6. **Webhooks** — Outbound notifications

---

## 🏗️ Implementation Status

### ✅ **Deployed (Production)**

- Spine (entity resolution, relationships, signals)
- Pipeline (sole Spine writer)
- MCP OAuth 2.0 (20 tools)
- Governance (proposals, HITL, audit)
- Act (execution coordination)
- Memory tables (org, conversational, personal)
- OWUI (chat + voice)
- Intelligence worker

### 🚧 **Designed (Ready for Implementation)**

- Twin Runtime (VPS deployment planned)
- Triage Bot (schema complete)
- Browser Agent (VPS deployment planned)
- Skills (YAML manifests created)

### 📋 **Planned (Next Phase)**

- Twin Runtime → CF Worker migration
- CLI interface
- Email interface
- Mobile app
- TTL job (memory aging)
- Publication worker

---

## 🚀 Quick Start Guides

### **For Developers Building Custom Surfaces**

1. Read: `INTEGRATEWISE_CANONICAL_ARCHITECTURE.md`
2. Read: `MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md`
3. Use: ADK REST APIs or TypeScript SDK
4. Query: Spine entities, Memory, Signals
5. Build: Custom L1 views

### **For Developers Extending Twin**

1. Read: `TWIN_AS_COGNITIVE_ORCHESTRATOR.md`
2. Read: `owui-skill-manifest.md`
3. Create: New MCP tool
4. Define: Skill YAML (when to use, inputs, outputs)
5. Test: Via OWUI

### **For Developers Building Execution Providers**

1. Read: `TWIN_BROWSER_EXECUTION.md`
2. Implement: Execution provider (API, browser, MCP, etc.)
3. Wire: To Act service
4. Test: Proposal → Approval → Execution
5. Verify: Outcome recorded via Triage Bot

### **For AI Agents Connecting via MCP**

1. Read: `MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md`
2. OAuth: Connect to mcp.integratewise.ai
3. Discover: 20 canonical tools
4. Use: SPINE._, MEMORY._, PROPOSAL._, KB._ tools
5. Respect: Governance (propose, don't execute)

---

## 🎓 Learning Path

### **Week 1: Understand the System**

- Day 1: Read `INTEGRATEWISE_CANONICAL_ARCHITECTURE.md`
- Day 2: Read `ARCHITECTURE_UPDATE_2026-06-09.md`
- Day 3: Read `TWIN_AS_COGNITIVE_ORCHESTRATOR.md`
- Day 4: Read `MEMORY_GOVERNANCE_DOCTRINE.md`
- Day 5: Read `ENTITY_BINDING_AND_RELATIONSHIPS.md`

### **Week 2: Build Something**

- Day 1-2: Query Spine via MCP tools
- Day 3-4: Build custom L1 view
- Day 5: Create proposal workflow

### **Week 3: Extend the Twin**

- Day 1-2: Create new MCP tool
- Day 3-4: Define skill YAML
- Day 5: Test via OWUI

---

## 📖 Glossary

| Term                | Definition                                                                |
| ------------------- | ------------------------------------------------------------------------- |
| **Twin**            | Persistent cognitive orchestrator (not a chatbot)                         |
| **Spine**           | Canonical entity graph across all tools                                   |
| **Memory**          | Institutional knowledge (Book of Records format)                          |
| **Triage Bot**      | Sole memory writer (Book of Records format)                               |
| **Book of Records** | 6 primitives (episode, decision, learning, commitment, fact, action_item) |
| **MCP**             | Model Context Protocol (20 tools, OAuth 2.0)                              |
| **ADK**             | Application Development Kit (REST APIs, SDK, webhooks)                    |
| **OWUI**            | Open WebUI (ONE interface to Twin, not the Twin itself)                   |
| **Voice**           | x.ai STT + TTS (ONE interface to Twin)                                    |
| **Browser Agent**   | Playwright automation (ONE execution provider)                            |
| **Governance**      | HITL approval gate (proposal → review → approve/reject)                   |
| **Act**             | Execution coordinator (dispatches to providers)                           |
| **Pipeline**        | Sole Spine writer (8-stage normalizer)                                    |
| **Entity 360**      | Complete context view for an entity                                       |
| **Signal**          | Entity change event (health drop, stall, anomaly)                         |
| **Proposal**        | Governed action (Twin proposes, human approves)                           |

---

## 🔗 External Resources

- **Live System:** https://twin.operations.integratewise.ai
- **MCP Server:** https://mcp.integratewise.ai
- **API Gateway:** https://gateway.integratewise.ai
- **Docs:** https://docs.integratewise.ai

---

## 📞 Getting Help

### **For Architecture Questions**

Read: `INTEGRATEWISE_CANONICAL_ARCHITECTURE.md` first

### **For Memory Questions**

Read: `MEMORY_GOVERNANCE_DOCTRINE.md`

### **For Twin Questions**

Read: `TWIN_AS_COGNITIVE_ORCHESTRATOR.md`

### **For Implementation Questions**

Read: `ARCHITECTURE_UPDATE_2026-06-09.md` (what's ready, what's planned)

---

## ✅ Before You Start Building

**Checklist:**

- [ ] Read `INTEGRATEWISE_CANONICAL_ARCHITECTURE.md`
- [ ] Understand: One Twin, One Spine, One Memory, One Governance, One Bridge
- [ ] Know: Many Interfaces, Many Execution Providers, Infinite Capabilities
- [ ] Understand: Twin ≠ OWUI ≠ Voice ≠ Browser Agent
- [ ] Understand: Memory writes via Triage Bot ONLY
- [ ] Understand: Proposals require HITL approval
- [ ] Know where to find: MCP tools, ADK APIs, TypeScript SDK
- [ ] Know the hierarchy: Canonical Architecture → Domain Docs → Implementation Guides

---

**Last Updated:** 2026-06-09  
**Version:** 2.0  
**Status:** Canonical

**This is IntegrateWise 2.0.**

One Twin. One Spine. One Memory. One Governance. One Bridge.
Many Interfaces. Many Execution Providers. Infinite Capabilities.
