# IntegrateWise — Language Consistency Status

> **Date:** 2026-06-09  
> **Version:** 1.0.0  
> **Authority:** Nirmal (Founder)  
> **Status:** COMPLIANCE AUDIT

---

## The ONE LANGUAGE Principle

**"REPO LANGUAGE TO BE ONE IN TERMS OF ALL"** means:

1. **Code Language:** TypeScript ONLY (no Python, no other languages)
2. **Architecture Language:** ONE consistent terminology across all docs
3. **Documentation Voice:** ONE consistent explanation pattern
4. **API Contracts:** ONE consistent interface (Gateway-first)
5. **Conceptual Models:** ONE mental model (no conflicting metaphors)

---

## ✅ CODE LANGUAGE COMPLIANCE

### Status: **PASS**

**Rule:** TypeScript only. No Python anywhere in the codebase (excluding node_modules).

**Verification:**

```bash
find . -name "*.py" -type f -not -path "*/node_modules/*"
# Result: ZERO Python files
```

**Source files checked:**

- ✅ `services/*/` — All TypeScript
- ✅ `apps/web/src/` — All TypeScript
- ✅ `packages/*/` — All TypeScript
- ✅ `scripts/` — All TypeScript/Bash
- ✅ No Python in custom code

**Enforcement:**

- AGENTS.md hard rule in every workspace
- CI/CD pre-commit hooks (if configured)

---

## ⚠️ ARCHITECTURE LANGUAGE COMPLIANCE

### Status: **NEEDS CLEANUP**

**Rule:** ONE consistent terminology across all documentation.

### Current Issues:

#### 1. **Twin Architecture Conflation** ⚠️

**Location:** `services/twin-orchestrator/src/index.ts`

**Problem:** File contains BOTH:

- ✅ Correct cognitive-only architecture (scheduled observe loop, pure delegation)
- ❌ Old infrastructure code (Hono app with chat endpoints, AI inference, RAG)

**Evidence:**

```typescript
// CORRECT (Cognitive layer):
export async function scheduled(event: ScheduledEvent, env: Env): Promise<void>;

// INCORRECT (Infrastructure layer - should be in intelligence worker):
app.post("/v1/chat/completions", async (c) => {
  // This conflates Twin with AI infrastructure
});
```

**Action Required:**

- Remove Hono app and `/v1/chat/completions` endpoint from twin-orchestrator
- Chat endpoints belong in `services/intelligence` worker
- Twin should ONLY have: scheduled loop + /health + /observe + /state

#### 2. **Memory Write Terminology** ⚠️

**Issue:** Multiple terms used for the same concept.

**Inconsistent Usage:**

- "Triage Bot" (correct canonical term)
- "Governance" (overlapping but different concept)
- "Memory Writer" (too generic)
- "Proposal approver" (correct for proposals, not memory writes)

**Canonical Mapping:**

```
Memory Writes → ONLY via Triage Bot (governance-gated)
Proposals → ONLY via Governance Queue (HITL approval)
Spine Writes → ONLY via Pipeline Worker (sole Supabase credential holder)
```

**Action Required:**

- Update all docs to use "Triage Bot" consistently for org_memory writes
- Update all docs to use "Governance Queue" for proposals
- Never use "Memory Writer" without clarifying "Triage Bot"

#### 3. **Spine vs Supabase Confusion** ⚠️

**Issue:** Some docs refer to "Supabase" as the data layer.

**Canonical Truth:**

- **Spine** = The conceptual memory substrate (canonical entities + relationships)
- **Supabase** = The fortress database (physical storage, never exposed)
- **D1** = The active read layer (operational queries)
- **KV** = The hot cache (60-300s TTL)

**Incorrect phrasing:**

- "Query Supabase for entities" ❌
- "Spine writes to Supabase" ❌

**Correct phrasing:**

- "Query Spine (via D1) for entities" ✅
- "Pipeline worker writes to Spine (backed by Supabase)" ✅

**Action Required:**

- Search/replace all docs: "Supabase" → "Spine (Supabase-backed)" when referring to data operations
- Frontend docs: Always say "CF Gateway → D1" not "Supabase"

#### 4. **MCP vs Continuity Bridge** ⚠️

**Issue:** Overlapping terminology.

**Canonical Mapping:**

```
MCP = Model Context Protocol (18 tools: memory.*, spine.*, signal.*, proposal.*)
Continuity Bridge = MCP + Gateway + Spine + Memory + Governance (the system)
Twin Runtime = Cognitive orchestrator using Continuity Bridge tools
```

**Incorrect usage:**

- "MCP server" when referring to the entire system ❌
- "Continuity" when referring to just MCP tools ❌

**Correct usage:**

- "MCP connector" = The worker exposing MCP tools ✅
- "Continuity Bridge" = The architectural layer ✅
- "Twin uses MCP tools via Continuity Bridge" ✅

---

## ⚠️ DOCUMENTATION VOICE COMPLIANCE

### Status: **PARTIALLY COMPLIANT**

**Rule:** ONE consistent explanation pattern across all documentation.

### Current Issues:

#### 1. **Architecture Explanation Levels** ⚠️

**Problem:** Some docs explain from scratch, others assume deep context.

**Examples:**

- `AGENTS.md` = Assumes reader knows the system (correct for agent guidelines)
- `TWIN_AS_COGNITIVE_ORCHESTRATOR.md` = Explains from first principles (correct for architecture)
- `FRONTEND_LAYER_MAP.md` = Mix of both (needs separation)

**Action Required:**

- Split `FRONTEND_LAYER_MAP.md` into:
  - `FRONTEND_ARCHITECTURE.md` (principles, high-level)
  - `FRONTEND_API_CONTRACT.md` (concrete endpoints and hooks)

#### 2. **Audience Targeting** ⚠️

**Problem:** Not always clear who the doc is for.

**Canonical Audience Labels:**

- `[AGENT]` = AI agents (Hermes, Kiro, Claude, Copilot)
- `[DEV]` = Human developers (IntegrateWise team)
- `[ARCH]` = Architects / decision-makers (Nirmal + senior eng)
- `[PUBLIC]` = External users / customers

**Action Required:**

- Add audience label to every doc filename or frontmatter
- Example: `TWIN_AS_COGNITIVE_ORCHESTRATOR.md` → `[ARCH] TWIN_AS_COGNITIVE_ORCHESTRATOR.md`

#### 3. **Version Tagging** ⚠️

**Problem:** Not all docs show when they were last canonical.

**Action Required:**

- Add to every doc:
  ```markdown
  > **Date:** 2026-06-09  
  > **Version:** 1.0.0  
  > **Authority:** Nirmal (Founder)  
  > **Status:** CANONICAL / DRAFT / DEPRECATED
  ```

---

## ✅ API CONTRACTS COMPLIANCE

### Status: **PASS (SPEC COMPLETE)**

**Rule:** ONE consistent interface (Gateway-first for all frontend data).

**Verification:**

- ✅ All frontend data flows through `gateway.dev.integratewise.ai`
- ✅ Zero direct Supabase from `apps/web/` (when `VITE_SPINE_PROVIDER=gateway-proxy`)
- ✅ All auth via `auth.integratewise.ai` (OAuth 2.0 RS256)
- ✅ All MCP tools via `mcp.integratewise.ai`

**Spec Status:**

- ✅ `.kiro/specs/cf-frontend-wiring/requirements.md` (13 requirements)
- ✅ `.kiro/specs/cf-frontend-wiring/tasks.md` (14 tasks, ALL COMPLETE)

**Implementation Status:**

- ✅ AuthManager module
- ✅ GatewayHttpClient module
- ✅ SpineGatewayAdapter (drop-in replacement)
- ✅ TanStack Query configuration
- ✅ SSE real-time client
- ✅ Onboarding flow API calls
- ✅ Build-time Supabase enforcement

**No action required.**

---

## ⚠️ CONCEPTUAL MODELS COMPLIANCE

### Status: **NEEDS CONSOLIDATION**

**Rule:** ONE mental model for how the system works.

### Current Issues:

#### 1. **Twin Identity Confusion** ⚠️

**Problem:** Twin described differently across docs.

**Conflicting descriptions:**

- "The Twin is a chat agent" ❌
- "The Twin is an AI assistant" ❌
- "The Twin is the cognitive orchestrator" ✅

**Canonical Definition:**

```
The Twin = Cognitive Orchestrator
├─ Observes (Memory, Objectives, Governance, Operations, Time)
├─ Reasons (via Intelligence worker delegation)
├─ Proposes (creates proposals, does NOT execute)
├─ Coordinates (dispatches to Act, monitors outcomes)
└─ Learns (proposes memory updates via Triage Bot)

The Twin is NOT:
- An AI model (delegates to Intelligence worker)
- A chat interface (OWUI is ONE interface to Twin)
- An execution engine (Act worker executes)
```

**Action Required:**

- Update `README.md` to use canonical definition
- Update all product docs to use canonical definition
- Add diagram: Twin (cognitive) vs Intelligence (infrastructure)

#### 2. **Layer Naming Inconsistency** ⚠️

**Problem:** Multiple names for the same layers.

**Inconsistent usage:**

- "L0/L1/L2/L3/L4" (correct numbered layers)
- "Onboarding/Workbench/Overlay/Twin/Memory" (correct named layers)
- "Frontend/Cognitive/Memory" (architectural layers, not UX layers)
- "Infrastructure/Orchestration" (system layers, not UX layers)

**Canonical Mapping:**

```
UX LAYERS (User-facing):
├─ L0 = Onboarding (entry → setup → first value)
├─ L1 = Workbench (personal + work daily use)
├─ L2 = Overlay (awareness drawer, passive presence)
├─ L3 = OWUI (full reasoning surface, voice, agent)
└─ L4 = Memory (Coda knowledge projection)

SYSTEM LAYERS (Architecture):
├─ Infrastructure (Workers: pipeline, intelligence, gateway, connector)
├─ Cognitive (Twin orchestrator)
├─ Governance (Triage Bot, HITL approval)
└─ Memory (Spine, org_memory, personal_memory, conversational_memory)
```

**Action Required:**

- Never mix UX layer names (L0-L4) with system layer names (Infrastructure/Cognitive)
- When discussing UX: use L0/L1/L2/L3/L4
- When discussing architecture: use Infrastructure/Cognitive/Governance/Memory

#### 3. **Data Flow Mental Model** ⚠️

**Problem:** Not consistently explained.

**Canonical Data Flow:**

```
USER
 ↓
L1 View (React component)
 ↓
spineClient.from("entities").select() (SpineGatewayAdapter)
 ↓
GatewayHttpClient → gateway.dev.integratewise.ai
 ↓
CF Gateway (auth + tenant + rate limit)
 ↓
Service binding → downstream worker (pipeline, intelligence, knowledge)
 ↓
D1 query (integratewise-spine-cache)
 ↓
KV cache check (if hot)
 ↓
Response (Supabase-compatible shape)
 ↓
TanStack Query cache
 ↓
React component renders
```

**Write Flow (proposals):**

```
USER approves proposal
 ↓
L1 component calls spineClient
 ↓
Gateway → Proposal Queue
 ↓
Governance approves
 ↓
Act worker executes
 ↓
Pipeline worker writes to Spine (Supabase)
 ↓
D1 mirror updated
 ↓
SSE signal to frontend
 ↓
TanStack Query invalidates + refetches
```

**Action Required:**

- Add canonical data flow diagram to `ARCHITECTURE_AND_DATA_FLOW.md`
- Reference this diagram from all docs that discuss data operations

---

## 🎯 ACTION PLAN

### Immediate (Today)

1. ✅ **Create this status document**
2. ⏳ **Clean up `services/twin-orchestrator/src/index.ts`:**
   - Remove Hono app
   - Remove `/v1/chat/completions` endpoint
   - Remove all AI inference code
   - Keep ONLY: scheduled loop, /health, /observe, /state
3. ⏳ **Update canonical architecture docs:**
   - Add audience labels `[AGENT]`, `[DEV]`, `[ARCH]`, `[PUBLIC]`
   - Add version/date/authority frontmatter to all canonical docs
   - Verify terminology consistency (Spine, Triage Bot, Governance Queue)

### Short-term (This Week)

4. ⏳ **Create missing architecture diagrams:**
   - Twin (cognitive) vs Intelligence (infrastructure)
   - Canonical data flow (read + write)
   - MCP tools vs Continuity Bridge
5. ⏳ **Split large docs:**
   - `FRONTEND_LAYER_MAP.md` → `FRONTEND_ARCHITECTURE.md` + `FRONTEND_API_CONTRACT.md`
6. ⏳ **Terminology search/replace across all docs:**
   - "Supabase queries" → "Spine queries (D1)"
   - "Memory writer" → "Triage Bot"
   - "MCP server" → "MCP connector" (when appropriate)

### Medium-term (Next Sprint)

7. ⏳ **Create canonical glossary:**
   - Single source of truth for all terms
   - Cross-referenced from all docs
   - Enforced via linter (future)
8. ⏳ **Document review process:**
   - All new docs must pass language consistency check
   - All doc updates require canonical glossary alignment

---

## ✅ CURRENT COMPLIANCE SCORE

| Category                 | Status                 | Score   |
| ------------------------ | ---------------------- | ------- |
| Code Language            | ✅ PASS                | 100%    |
| Architecture Terminology | ⚠️ NEEDS CLEANUP       | 70%     |
| Documentation Voice      | ⚠️ PARTIALLY COMPLIANT | 75%     |
| API Contracts            | ✅ PASS                | 100%    |
| Conceptual Models        | ⚠️ NEEDS CONSOLIDATION | 65%     |
| **OVERALL**              | **⚠️ 82% COMPLIANT**   | **82%** |

**Target:** 100% compliant by end of week.

---

## ENFORCEMENT GOING FORWARD

### Code Language (TypeScript Only)

1. **Pre-commit hook:**

   ```bash
   # .git/hooks/pre-commit
   if git diff --cached --name-only | grep -E '\.py$' | grep -v node_modules; then
     echo "ERROR: Python files detected. IntegrateWise is TypeScript-only."
     exit 1
   fi
   ```

2. **CI check:**
   ```yaml
   # .github/workflows/language-check.yml
   - name: Verify no Python
     run: |
       if find . -name "*.py" -not -path "*/node_modules/*" | grep .; then
         echo "Python files found. Repo is TypeScript-only."
         exit 1
       fi
   ```

### Architecture Language (Terminology)

1. **Canonical glossary:** `docs/GLOSSARY.md` (to be created)
2. **Linter:** Custom ESLint rule checking for deprecated terms in comments/docs
3. **Doc review checklist:** All PRs touching docs must verify terminology

### Documentation Voice (Consistency)

1. **Template:** `docs/templates/CANONICAL_DOC_TEMPLATE.md` (to be created)
2. **Audience labels:** Required in frontmatter or filename
3. **Version tracking:** All canonical docs must have date/version/authority

---

**Document Status:** LIVING DOCUMENT  
**Next Review:** 2026-06-16  
**Owner:** Nirmal (Founder) + Hermes (Operator)
