# Architecture Update — 2026-06-09

**Status:** Canonical Architecture Finalized  
**Authority:** Founder + Architecture Team  
**Version:** 2.0

---

## What Changed Today

### **New Canonical Statement**

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

---

## Major Architecture Documents Created

### **1. Master Architecture**

**File:** `docs/tech/INTEGRATEWISE_CANONICAL_ARCHITECTURE.md`  
**Purpose:** THE definitive architecture document  
**Status:** Approved, canonical

**Key Sections:**

- One Twin (cognitive orchestrator)
- One Spine (operational truth)
- One Memory (Book of Records format)
- One Governance Layer (HITL gate)
- One Bridge (MCP + ADK)
- Many Interfaces (OWUI, Voice, API, CLI, Email, Mobile)
- Many Execution Providers (APIs, Browser, MCP, Workflows, Human)
- Infinite Capabilities (business outcomes)

---

### **2. Memory Governance Doctrine**

**File:** `docs/tech/MEMORY_GOVERNANCE_DOCTRINE.md`  
**Purpose:** How memory is written (Triage Bot only)  
**Status:** Approved, canonical

**Key Rules:**

1. NO direct memory writes (all via Triage Bot)
2. Conversational memory is staging book (Book of Records format)
3. Search is parallel (immediate indexing)
4. Promotion is human-only (never auto-promoted)
5. Org memory projects to surfaces (OWUI Knowledge, Book of Projects)
6. Decision TTL: 30 days (vs 90 days for general conversational)
7. Twin wiring is read-heavy (reads memory, proposes writes)

---

### **3. Twin as Cognitive Orchestrator**

**File:** `docs/tech/TWIN_AS_COGNITIVE_ORCHESTRATOR.md` (updated)  
**Purpose:** Twin Runtime details  
**Status:** Approved, canonical

**Key Points:**

- Twin = Persistent cognitive orchestrator (NOT a chatbot)
- Runtime: CF Worker or VPS (services/twin-orchestrator/)
- Core Loop: Observe → Reason → Propose → Coordinate → Monitor → Learn
- Reasoning: OpenRouter Agents (multi-model deliberation)
- Memory: Book of Records (via Triage Bot)
- Governance: Propose → HITL → Approve → Execute

---

### **4. Twin Voice Interface**

**File:** `docs/tech/TWIN_VOICE_INTERFACE.md`  
**Purpose:** Voice as interface to Twin Runtime  
**Status:** Approved, canonical

**Key Points:**

- Voice = ONE interface to Twin (not the Twin itself)
- Stack: x.ai STT (Whisper) + x.ai TTS (Kokoro "eve")
- Connection: Voice → OWUI → Twin Runtime → OpenRouter → Response
- Capabilities: Morning briefs, action proposals, voice commands
- Voice-optimized responses (brief, clear, conversational)

---

### **5. Twin Browser Execution**

**File:** `docs/tech/TWIN_BROWSER_EXECUTION.md`  
**Purpose:** Browser Agent as execution provider  
**Status:** Approved, canonical

**Key Points:**

- Browser Agent = Execution provider (NOT Twin itself)
- Stack: Playwright (VPS) + Puppeteer (CF Worker)
- Use Case: Web forms, screenshots, data extraction (no API)
- Governance: Always requires approval (high-risk)
- Flow: Twin proposes → Human approves → Act dispatches → Browser executes

---

### **6. Book of Records Episode**

**File:** `.iw-memory/specs/twin-owui/memory-pipeline-episode.json`  
**Purpose:** Memory pipeline architecture (Book of Records format)  
**Status:** Approved, canonical

**Key Content:**

- Pipeline stages (AI Worker → Triage Bot → Memory)
- Book of Records primitives (episode, decision, learning, commitment, fact, action_item)
- Decisions, learnings, commitments
- Gaps vs today (write-session-log.ts must be rerouted)

---

### **7. Triage Output Schema**

**File:** `.iw-memory/specs/twin-owui/triage-output-schema.ts`  
**Purpose:** TypeScript schema for Triage Bot outputs  
**Status:** Approved, canonical

**Key Types:**

- `TriageOutput` (base interface)
- `EpisodeOutput`, `DecisionOutput`, `LearningOutput`, `CommitmentOutput`, `FactOutput`, `ActionItemOutput`
- `PromotionQueueItem` (for human review)
- TTL rules (decisions: 30 days, general: 90 days)

---

### **8. OWUI Skill Manifest**

**File:** `.iw-memory/specs/twin-owui/owui-skill-manifest.md`  
**Purpose:** How Twin uses tools without writing memory  
**Status:** Approved, canonical

**Key Skills:**

- Read-only: `continuity.search`, `book.get_episodes`, `twin.morning_brief`
- Write (approval): `memory.propose_candidate`, `spine.create_entity`, `browser.execute`
- Skill format: YAML (when to use, inputs, outputs, governance)

---

## Architecture Convergence

### **What Was Fragmented Before:**

```
- Twin (concept unclear: chatbot? orchestrator?)
- OWUI (thought to be "the Twin")
- Voice (thought to be separate from Twin)
- Browser Agent (unclear if part of Twin)
- Memory (unclear who writes, what format)
- Models vs Profiles (confusion about Hermes/Think/Fast)
```

### **What Is Clear Now:**

```
TWIN
├─ Runtime: CF Worker or VPS (persistent orchestrator)
├─ Interfaces: OWUI, Voice, API, CLI (many ways to reach Twin)
├─ Memory: Book of Records via Triage Bot (sole writer)
├─ Reasoning: OpenRouter Agents (multi-model deliberation)
├─ Governance: Propose → HITL → Approve
└─ Execution: APIs, Browser, MCP, Workflows (many providers)

OWUI
├─ ONE interface to Twin (not the Twin itself)
├─ Models: Foundation models (grok-4.3, hermes-internal)
└─ Profiles: System prompts (Hermes, Think, Fast) wrapping foundation models

VOICE
├─ ONE interface to Twin (not separate system)
├─ STT: x.ai Whisper (speech → text)
└─ TTS: x.ai Kokoro "eve" (text → speech)

BROWSER AGENT
├─ ONE execution provider (not part of Twin)
├─ Stack: Playwright (VPS) + Puppeteer (CF)
└─ Flow: Twin proposes → Human approves → Act dispatches → Browser executes

MEMORY
├─ Writer: Triage Bot ONLY (no direct writes)
├─ Format: Book of Records (6 primitives)
├─ Storage: Conversational (staging) → Org (promoted)
└─ Governance: Human-only promotion
```

---

## Implementation Status

### ✅ **Complete (Already Deployed)**

- Spine (entity resolution, relationships, signals)
- Pipeline (sole Spine writer)
- MCP OAuth 2.0 (20 tools, mcp.integratewise.ai)
- Governance (proposals, HITL, audit)
- Act (execution coordination)
- Memory tables (org, conversational, personal)
- OWUI (chat + voice via x.ai)
- Intelligence worker (AI router, RAG, signal analysis)

### 🚧 **In Progress (Designed, Needs Deployment)**

- Twin Runtime (VPS: twin-runtime.operations.integratewise.ai)
- Triage Bot (schema complete, needs implementation)
- Browser Agent (VPS: browser-agent.operations.integratewise.ai)
- Skills (YAML manifests created, needs OWUI loading)

### 📋 **Planned (Next Phase)**

- Twin Runtime → CF Worker (after VPS validation)
- CLI interface (iw twin ask "...")
- Email interface (twin@integratewise.ai)
- Mobile app (iOS + Android)
- TTL job (conversational memory aging)
- Publication worker (org memory → OWUI surfaces)

---

## Key Decisions Today

### **Decision 1: Twin ≠ OWUI**

**Before:** OWUI is the Twin  
**After:** OWUI is ONE interface to the Twin Runtime

**Impact:** Twin can operate when OWUI is offline (always-on orchestrator)

---

### **Decision 2: Memory Pipeline is Governed**

**Before:** Agents/tools write memory directly  
**After:** All memory flows through AI Worker → Triage Bot → Memory

**Impact:** All memory is structured (Book of Records), searchable, promotable

---

### **Decision 3: Models vs Profiles**

**Before:** Hermes/Think/Fast are separate models  
**After:** Hermes/Think/Fast are profiles (system prompts) wrapping foundation models (grok-4.3, hermes-internal)

**Impact:** Clarity on what's a model vs what's a behavior

---

### **Decision 4: Voice = Interface (Not Separate System)**

**Before:** Voice is a separate capability  
**After:** Voice is ONE interface to the same Twin Runtime

**Impact:** Voice conversations persist in Memory, can trigger proposals

---

### **Decision 5: Browser Agent = Execution Provider**

**Before:** Browser Agent is part of Twin  
**After:** Browser Agent is ONE execution provider (like APIs, MCP)

**Impact:** Twin proposes, Human approves, Act dispatches, Browser executes

---

## Migration Path

### **Phase 1: Twin Runtime on VPS (Customer Zero)**

**Location:** integratewise-ops/vps-operations-stack/twin-runtime/  
**URL:** https://twin-runtime.operations.integratewise.ai  
**Tenant:** iw-customer-zero

**Steps:**

1. Build Twin Runtime (Bun + Hono)
2. Deploy to VPS (Docker)
3. Wire OWUI to Twin Runtime (update OPENAI_API_BASE_URL)
4. Load Customer Zero (entities, signals, proposals, memory)
5. Test end-to-end (voice, chat, proposals, execution)

---

### **Phase 2: Triage Bot Implementation**

**Location:** services/triage-bot/ (CF Worker or VPS)  
**Purpose:** Sole memory writer (Book of Records format)

**Steps:**

1. Implement Triage Bot worker
2. Wire to outcome events (from Act service)
3. Write to conversational_memory (Book of Records format)
4. Index for search (auto)
5. Queue for promotion (human review)

---

### **Phase 3: Browser Agent Deployment**

**Location:** integratewise-ops/vps-operations-stack/browser-agent/  
**URL:** https://browser-agent.operations.integratewise.ai

**Steps:**

1. Deploy Playwright service (VPS)
2. Wire to Act service
3. Test browser automation (screenshot, form fill, data extraction)
4. Integrate with governance (approval flow)

---

### **Phase 4: Twin Runtime → CF Worker (Production)**

**Location:** services/twin-orchestrator/  
**URL:** https://twin.dev.integratewise.ai

**Steps:**

1. Migrate VPS Twin Runtime to CF Worker
2. Update OWUI to call CF endpoint
3. Deploy cron trigger (every 5 minutes)
4. Verify observe → reason → propose loop
5. Monitor logs + outcomes

---

## Document Hierarchy (Updated)

```
docs/tech/INTEGRATEWISE_CANONICAL_ARCHITECTURE.md ← MASTER (start here)
    │
    ├─→ docs/tech/MEMORY_GOVERNANCE_DOCTRINE.md (memory rules)
    ├─→ docs/tech/TWIN_AS_COGNITIVE_ORCHESTRATOR.md (Twin details)
    ├─→ docs/tech/TWIN_VOICE_INTERFACE.md (Voice interface)
    ├─→ docs/tech/TWIN_BROWSER_EXECUTION.md (Browser Agent)
    ├─→ docs/tech/ENTITY_BINDING_AND_RELATIONSHIPS.md (Spine)
    ├─→ docs/tech/MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md (MCP + ADK)
    ├─→ docs/tech/LAYER_OWNERSHIP_AND_TWIN_RUNTIME.md (S/U/V/CZ layers)
    └─→ docs/tech/INTEGRATEWISE_PRODUCT_ARCHITECTURE.md (legacy, still valid)

.iw-memory/specs/twin-owui/
    ├─→ memory-pipeline-episode.json (Book of Records episode)
    ├─→ triage-output-schema.ts (TypeScript schema)
    └─→ owui-skill-manifest.md (Skills documentation)
```

---

## For Next Session

**Read this file first:** `docs/tech/INTEGRATEWISE_CANONICAL_ARCHITECTURE.md`

**Then proceed with implementation:**

1. Build Twin Runtime (VPS)
2. Wire OWUI to Twin Runtime
3. Load Customer Zero
4. Test end-to-end

**Key constraint:** integratewise-live is restricted (no edits without explicit permission). Work in integratewise-ops for VPS deployment.

---

## Summary

**Today we achieved:**

- ✅ Defined canonical architecture (One Twin, One Spine, One Memory, One Governance, One Bridge)
- ✅ Clarified Twin vs OWUI vs Voice vs Browser Agent
- ✅ Established memory governance (Triage Bot only)
- ✅ Documented Book of Records format (6 primitives)
- ✅ Created skill manifests (how Twin uses tools)
- ✅ Designed deployment path (VPS → CF)

**Everything now has its place.**
**Every write path is governed.**
**Every interface reaches the same Twin.**

**This is IntegrateWise 2.0.**

---

**Date:** 2026-06-09  
**Version:** 2.0  
**Status:** Canonical  
**Authority:** Founder + Architecture Team
