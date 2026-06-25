# Twin Skills Manifest — Tool Usage Without Direct Memory Writes

**Purpose:** Teach Twin (Open WebUI) how to use tools while respecting the memory pipeline.

**Doctrine:** Twin proposes. Triage Bot writes. Governance approves. Act executes.

---

## Skill Structure

Each skill teaches Twin:

1. **When** to use a tool
2. **What** inputs it needs
3. **How** to interpret outputs
4. **What** Book of Records primitives result
5. **What** governance rules apply

**Skills ≠ Tools**

- Tools: Executable functions (MCP, continuity-tool-server, agent-zero)
- Skills: Knowledge about when/how to use tools

---

## Skill: continuity.search

**Tool:** `continuity.search` (MCP tool via continuity-tool-server)

**Purpose:** Query Spine for entities, relationships, signals

**When to use:**

- User asks about an entity (person, account, deal, task, ticket)
- User asks about relationships ("who works at Acme Corp?")
- User asks about recent signals or activity
- User asks about entity history or context

**Inputs:**

```json
{
  "query": "string (natural language query)",
  "entity_type": "Person | Account | Deal | Task | Ticket | null",
  "limit": "number (default: 10)"
}
```

**Outputs:**

```json
{
  "results": [
    {
      "spine_id": "string",
      "entity_type": "string",
      "name": "string",
      "data": { ... },
      "relationships": [ ... ],
      "signals": [ ... ]
    }
  ]
}
```

**Book of Records:** None (read-only query)

**Governance:** None (no approval needed for reads)

**Example:**

```
User: "Who is John Doe?"
Twin: [calls continuity.search with query="John Doe"]
Twin: "John Doe is a Person at Acme Corp. He's associated with 3 deals and 2 tickets."
```

**Memory pipeline:** No memory write. Twin reads Spine, responds to user.

---

## Skill: memory.propose_candidate

**Tool:** `memory.propose_candidate` (MCP tool via knowledge service)

**Purpose:** Propose a conversational memory item for promotion to org memory

**When to use:**

- Twin identifies a reusable decision in conversation
- User explicitly says "remember this" or "save this for the team"
- Twin detects a learning worth institutionalizing
- Twin detects a commitment or action item

**Inputs:**

```json
{
  "type": "decision | learning | commitment | fact | action_item",
  "title": "string (brief label)",
  "content": "string (markdown)",
  "scope": "user | work | org",
  "rationale": "string (why this should be promoted)"
}
```

**Outputs:**

```json
{
  "queue_id": "string",
  "status": "queued_for_review",
  "message": "Proposed for promotion. You can review in L2 Governance."
}
```

**Book of Records:** Creates promotion queue item (human reviews later)

**Governance:** Always requires human approval (no auto-promotion)

**Example:**

```
User: "We decided to use Triage Bot as the sole memory writer."
Twin: [detects decision]
Twin: [calls memory.propose_candidate with type="decision", ...]
Twin: "I've proposed this decision for promotion to organizational memory. You can review it in the Governance queue (L2)."
```

**Memory pipeline:** Twin proposes → Queue created → Human reviews → If approved, promoted to org_memory

---

## Skill: book.get_episodes

**Tool:** `book.get_episodes` (MCP tool via knowledge service)

**Purpose:** Fetch Book of Records episodes from org memory

**When to use:**

- User asks "what did we decide about X?"
- User asks "show me episodes about Y"
- User wants to review past decisions, learnings, commitments
- Twin needs context from institutional memory

**Inputs:**

```json
{
  "query": "string (search query)",
  "type": "episode | decision | learning | commitment | null",
  "pillar": "memory | spine | twin | null",
  "limit": "number (default: 10)"
}
```

**Outputs:**

```json
{
  "episodes": [
    {
      "id": "string",
      "label": "string",
      "pillar": "string",
      "type": "string",
      "what": "string",
      "decisions": [ ... ],
      "learnings": [ ... ],
      "commitments": [ ... ]
    }
  ]
}
```

**Book of Records:** None (read-only query)

**Governance:** None (approved episodes are already in org_memory)

**Example:**

```
User: "What did we decide about the memory pipeline?"
Twin: [calls book.get_episodes with query="memory pipeline"]
Twin: "Episode: Memory Pipeline Architecture. We decided that all memory writes go through Triage Bot. This ensures governance and Book of Records format."
```

**Memory pipeline:** No memory write. Twin reads org_memory, responds to user.

---

## Skill: spine.create_entity

**Tool:** `spine.create_entity` (MCP tool via pipeline service)

**Purpose:** Create a new entity in Spine (Person, Account, Deal, etc.)

**When to use:**

- User asks to create a contact, account, deal, task, etc.
- Twin detects a new entity mentioned that doesn't exist in Spine
- User provides structured entity data

**Inputs:**

```json
{
  "entity_type": "Person | Account | Deal | Task | Ticket | Invoice | Project",
  "name": "string",
  "data": {
    "email": "string (for Person)",
    "company": "string (for Person)",
    "domain": "string (for Account)",
    "value": "number (for Deal)",
    ...
  },
  "source": "twin-conversation"
}
```

**Outputs:**

```json
{
  "proposal_id": "string",
  "status": "queued_for_approval",
  "message": "Entity creation proposed. Approve in L2 Governance."
}
```

**Book of Records:** Triage Bot creates `action_item` with entity data

**Governance:** Always requires approval (no auto-creation)

**Example:**

```
User: "Create a contact for John Doe at Acme Corp, email john@acme.com"
Twin: [calls spine.create_entity with entity_type="Person", name="John Doe", data={...}]
Twin: "I've proposed creating John Doe as a Person in Spine. You can review and approve in the Governance queue (L2)."
```

**Memory pipeline:** Twin proposes → Governance → If approved, Act service calls Pipeline → Spine updated → Triage Bot records outcome

---

## Skill: browser.execute

**Tool:** `browser.execute` (via browser-agent service)

**Purpose:** Execute browser automation steps (form fill, screenshot, data extraction)

**When to use:**

- User asks to interact with a web interface that has no API
- User asks to verify something visually (screenshot)
- User asks to fill out a form or click through a workflow
- User asks to extract data from a web page

**Inputs:**

```json
{
  "url": "string",
  "steps": [
    { "type": "navigate" },
    { "type": "click", "selector": "string" },
    { "type": "type", "selector": "string", "value": "string" },
    { "type": "screenshot" }
  ],
  "reasoning": "string (why browser is needed vs API)"
}
```

**Outputs:**

```json
{
  "proposal_id": "string",
  "status": "queued_for_approval",
  "message": "Browser action proposed. Review steps in L2 Governance."
}
```

**Book of Records:** Triage Bot creates `action_item` with browser steps

**Governance:** Always requires approval (browser actions are high-risk)

**Example:**

```
User: "Fill out the contact form on acme.com with John Doe's info"
Twin: [detects no API available]
Twin: [calls browser.execute with url="https://acme.com/contact", steps=[...]]
Twin: "I've proposed a browser automation to fill the form. You can review the steps in Governance (L2) before execution."
```

**Memory pipeline:** Twin proposes → Governance → If approved, Act dispatches to Browser Agent → Triage Bot records outcome (success/failure + screenshot)

---

## Skill: twin.morning_brief

**Tool:** Built-in Twin Runtime function (not external tool)

**Purpose:** Generate daily brief (signals, proposals, at-risk items)

**When to use:**

- User says "morning brief" or "daily update" or "what's new?"
- User logs in and wants context
- Voice command: "Twin, what do I need to know?"

**Inputs:** None (Twin observes system state)

**Outputs:**

```
{
  "brief": {
    "signals": { high_priority: [...], pending: [...] },
    "proposals": { pending_approval: [...], recently_approved: [...] },
    "at_risk": { accounts: [...], deals: [...] },
    "action_items": [...]
  }
}
```

**Book of Records:** Triage Bot creates `episode` with daily brief summary

**Governance:** None (read-only observation)

**Example:**

```
User: "Morning brief"
Twin: [observes system state via continuity.search, signal queries, proposal queries]
Twin: "Good morning. 3 high-priority signals: Acme Corp health dropped, Enterprise deal stalled, customer blocked by ticket. 2 proposals awaiting approval. 1 at-risk account: Acme Corp."
```

**Memory pipeline:** Twin observes → Triage Bot records daily brief as episode → Indexed for search

---

## Skill Governance Rules

### Read-Only Skills (No Approval)

- `continuity.search` — Query Spine
- `book.get_episodes` — Query org memory
- `twin.morning_brief` — Observe system state

**Rule:** Twin can execute directly. No proposal, no approval.

---

### Write Skills (Always Approval)

- `memory.propose_candidate` — Propose memory promotion
- `spine.create_entity` — Create Spine entity
- `browser.execute` — Execute browser automation

**Rule:** Twin creates proposal → Governance queue → Human approves → Act executes → Triage Bot records

---

### Triage Bot as Outcome Recorder

**After any write action (approved and executed):**

1. Act service executes action (API call, browser automation, etc.)
2. Act emits outcome event
3. Triage Bot receives outcome
4. Triage Bot writes Book of Records primitive:
   - Success: `fact` (entity created, action completed)
   - Failure: `action_item` (retry needed, error logged)
5. Conversational memory updated
6. Search indexed

**Twin never writes outcomes directly.**

---

## Twin Conversation Flow Example

### User: "Create a HubSpot contact for Jane Smith at Beta Inc"

**Step 1: Twin reasons**

```
Twin: [detects entity creation request]
Twin: [checks if Jane Smith exists in Spine via continuity.search]
Result: Not found
Twin: [decides to propose entity creation]
```

**Step 2: Twin proposes**

```
Twin: [calls spine.create_entity with entity_type="Person", name="Jane Smith", data={company: "Beta Inc"}]
Response: { proposal_id: "prop-123", status: "queued_for_approval" }
```

**Step 3: Twin responds to user**

```
Twin: "I've proposed creating Jane Smith at Beta Inc as a Person in Spine. You can review and approve this in the Governance queue (L2)."
```

**Step 4: Human approves (in L2 UI)**

```
User clicks "Approve" on proposal prop-123
```

**Step 5: Act executes**

```
Act service: [calls Pipeline to create Person entity]
Pipeline: [writes to Spine + D1 mirror]
Response: { success: true, spine_id: "person-456" }
```

**Step 6: Triage Bot records outcome**

```
Triage Bot: [receives execution outcome]
Triage Bot: [writes to conversational_memory]
{
  type: "fact",
  title: "Jane Smith created in Spine",
  content: "Person entity created: Jane Smith at Beta Inc (spine_id: person-456)",
  scope: "work",
  created_by: "triage-bot",
  source_type: "tool_outcome",
  source_id: "prop-123"
}
```

**Step 7: Twin notifies user (optional)**

```
Twin: "Jane Smith has been created in Spine. Entity ID: person-456."
```

---

## Skill File Format (YAML)

Skills are defined as YAML files in `integratewise-ops/vps-operations-stack/openwebui/skills/`

**Example: `continuity-search.skill.yaml`**

```yaml
skill:
  id: continuity-search
  name: Continuity Search
  version: 1.0.0
  description: Query Spine for entities, relationships, and signals

tool:
  name: continuity.search
  server: continuity-tool-server
  protocol: mcp

when_to_use:
  - User asks about an entity (person, account, deal, etc.)
  - User asks about relationships
  - User asks about recent signals or activity
  - User needs context from Spine

inputs:
  - name: query
    type: string
    required: true
    description: Natural language query
  - name: entity_type
    type: string
    required: false
    description: Filter by entity type (Person, Account, Deal, etc.)
  - name: limit
    type: number
    required: false
    default: 10
    description: Max results

outputs:
  results:
    type: array
    description: Matching entities from Spine

governance:
  approval_required: false
  reason: Read-only query

memory_pipeline:
  writes: false
  reads: true
  triage_output: null

examples:
  - user_query: "Who is John Doe?"
    tool_call:
      query: "John Doe"
      entity_type: "Person"
    response: "John Doe is a Person at Acme Corp."

  - user_query: "Show me deals over $100k"
    tool_call:
      query: "deals over $100k"
      entity_type: "Deal"
    response: "Found 3 deals: Enterprise Plan ($150k), Premium Upgrade ($120k)..."
```

---

## Implementation Checklist

### Phase 1: Skill Files

- [ ] Create `skills/` directory in OWUI config
- [ ] Write skill YAML for each tool:
  - [ ] continuity-search.skill.yaml
  - [ ] memory-propose-candidate.skill.yaml
  - [ ] book-get-episodes.skill.yaml
  - [ ] spine-create-entity.skill.yaml
  - [ ] browser-execute.skill.yaml
  - [ ] twin-morning-brief.skill.yaml

---

### Phase 2: Twin Skill Loader

- [ ] OWUI plugin to read skill YAMLs
- [ ] Inject skills into Twin system prompt
- [ ] Format: "When user asks X, use tool Y with inputs Z"

---

### Phase 3: Triage Bot Outcome Recorder

- [ ] Triage Bot listens for execution outcomes
- [ ] Triage Bot writes Book of Records primitives
- [ ] Conversational memory updated
- [ ] Search indexed

---

### Phase 4: Governance Queue UI

- [ ] L2 Governance shows pending proposals
- [ ] Each proposal shows: what, why, risk, Twin reasoning
- [ ] Approve/Reject buttons
- [ ] On approve: Act service executes
- [ ] On reject: Proposal closed, no execution

---

## Summary

**Twin learns via skills, not direct tool access.**

**Skills teach Twin:**

1. When to use each tool
2. What inputs are needed
3. How to interpret outputs
4. What governance applies
5. What memory pipeline behavior results

**Memory flow:**

- Twin proposes (never writes)
- Governance approves (human gate)
- Act executes (action layer)
- Triage Bot records (Book of Records)

**This is the contract.**

All Twin tool usage respects the memory pipeline.
No direct memory writes.
No bypassing governance.
No unstructured memory.

**Book of Records format is the only canonical memory.**
