# Twin Voice Interface Architecture

**Date:** 2026-06-09
**Status:** Active (via Open WebUI + x.ai)
**Integration:** Voice as Interface to Twin Runtime

---

## Current Implementation

### Voice Stack (Active)

```
User (speaking)
    ↓
Open WebUI (twin.integratewise.ai)
    ├─ STT: x.ai Whisper (speech → text)
    ├─ Chat: Grok-4.3 (text → reasoning)
    └─ TTS: x.ai Kokoro "eve" (text → speech)
    ↓
User (hearing)
```

**Location:** `integratewise-ops/vps-operations-stack/openwebui/`

**Components:**

- **Open WebUI:** Chat surface with voice UI
- **x.ai Audio Proxy:** STT (Whisper) + TTS (Kokoro "eve")
- **Grok-4.3:** Foundation model for reasoning
- **Twin Profiles:** Hermes/Think/Fast (system prompts)

**Status:** ✅ Working (voice-first interface)

---

## The Architecture Problem

### Today (Voice → OWUI → LLM)

```
Voice Input
    ↓ (x.ai STT)
Text
    ↓ (OWUI)
Grok-4.3 (with Twin profile)
    ↓
Response Text
    ↓ (x.ai TTS)
Voice Output
```

**Limitation:** Voice is just STT + LLM + TTS. No persistence, no orchestration.

### Canonical (Voice → Twin Runtime → Orchestration)

```
Voice Input
    ↓ (x.ai STT)
Text
    ↓ (Twin Runtime API)
Twin Orchestrator
    ├─ Observe (system state)
    ├─ Reason (OpenRouter Agents)
    ├─ Propose (governed actions)
    ├─ Coordinate (execution)
    └─ Monitor (outcomes)
    ↓
Response Text
    ↓ (x.ai TTS)
Voice Output
```

**Benefit:** Voice interactions feed into the persistent Twin (memory, proposals, execution).

---

## Voice as Interface (Not Transport)

### Key Insight

**Voice is NOT a separate system.**
**Voice is ONE INTERFACE to the Twin Runtime.**

```
TWIN RUNTIME
    │
    ├─→ OWUI (chat)
    ├─→ Voice (speak)
    ├─→ API (programmatic)
    └─→ CLI (terminal)
```

All interfaces reach the same Twin Runtime.

### What This Means

**When you speak to the Twin:**

1. STT converts speech → text
2. Text goes to Twin Runtime (not just LLM)
3. Twin observes, reasons, proposes (if needed)
4. Twin responds with text
5. TTS converts text → speech

**The Twin remembers the conversation.**
**The Twin can propose actions based on voice input.**
**The Twin coordinates execution (after approval).**

---

## Integration Architecture

### Phase 1: Voice → Twin Runtime API (Chat Completions)

**Change:** OWUI calls Twin Runtime instead of direct LLM

**Before:**

```
OWUI → LiteLLM → Grok-4.3 → Response
```

**After:**

```
OWUI → Twin Runtime → (observe/reason/respond) → Response
       ↓
       (Twin also proposes actions, updates memory, monitors execution)
```

**Implementation:**

```typescript
// In Twin Runtime (services/twin-orchestrator/src/index.ts)

/**
 * OpenAI-compatible chat completions endpoint
 * (so OWUI can call Twin Runtime instead of LiteLLM)
 */
app.post("/v1/chat/completions", async (c) => {
  const { messages, model, stream } = await c.req.json();
  const tenantId = c.req.header("x-tenant-id") || "iw-customer-zero";

  // Build context (Twin observes system state)
  const context = await buildTwinContext(c.env, tenantId);

  // Add chat messages to context
  const chatContext = {
    ...context,
    conversation: messages,
    last_message: messages[messages.length - 1].content,
  };

  // Twin reasons about context (via OpenRouter Agents)
  const reasoning = await reasonAboutContext(c.env, chatContext, tenantId);

  // If Twin identifies action needed, create proposal
  if (reasoning.suggested_actions.length > 0) {
    await generateProposals(c.env, reasoning, tenantId);
  }

  // Store conversation in memory
  await storeConversationalMemory(c.env, {
    tenant_id: tenantId,
    session_id: c.req.header("x-session-id") || crypto.randomUUID(),
    role: "user",
    content: messages[messages.length - 1].content,
  });

  // Return OpenAI-compatible response
  const response = reasoning.response || reasoning.context_summary;

  await storeConversationalMemory(c.env, {
    tenant_id: tenantId,
    session_id: c.req.header("x-session-id") || crypto.randomUUID(),
    role: "assistant",
    content: response,
  });

  return c.json({
    id: `chatcmpl-${crypto.randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: model || "twin-runtime",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: response,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 0, // Placeholder
      completion_tokens: 0,
      total_tokens: 0,
    },
  });
});
```

**OWUI Configuration:**

```env
# In integratewise-ops/vps-operations-stack/openwebui/.env
OPENAI_API_BASE_URL=https://twin.dev.integratewise.ai/v1
OPENAI_API_KEY=<twin-runtime-api-key>
```

Now when you speak to OWUI, it calls Twin Runtime (not LiteLLM).

---

### Phase 2: Voice-Initiated Actions

**Use Case:** "Twin, create a HubSpot contact for John Doe at Acme Corp"

**Flow:**

```
User speaks
    ↓ (x.ai STT)
"Twin, create a HubSpot contact for John Doe at Acme Corp"
    ↓ (Twin Runtime)
Twin observes: No existing contact for John Doe at Acme Corp
Twin reasons: User wants to create contact
Twin proposes: Create HubSpot contact (governed action)
    ↓ (Twin stores proposal)
Proposal ID: prop-123
    ↓ (Twin responds)
"I've created a proposal to add John Doe at Acme Corp to HubSpot.
 You can approve it in the Awareness layer (L2)."
    ↓ (x.ai TTS)
User hears response
```

**Later (when user approves in L2):**

```
User clicks "Approve" in L2 Awareness UI
    ↓ (Governance)
Proposal prop-123 approved
    ↓ (Act service)
Execute: Create HubSpot contact
    ↓ (HubSpot API)
Contact created: John Doe at Acme Corp
    ↓ (Pipeline)
Update Spine with new Person entity
    ↓ (Outcome)
Success logged, memory updated
```

**Key:** Voice input can trigger governed actions (just like chat, API, CLI).

---

### Phase 3: Voice-First Briefings

**Use Case:** "Twin, give me my morning brief"

**Flow:**

```
User speaks
    ↓ (x.ai STT)
"Twin, give me my morning brief"
    ↓ (Twin Runtime)
Twin observes: High-priority signals (3), pending proposals (2), at-risk accounts (1)
Twin reasons: User wants daily summary
Twin responds: (structured brief)
    ↓ (x.ai TTS)
"Good morning. You have 3 high-priority signals:
 1. Account 'Acme Corp' health score dropped to 42 (renewal risk)
 2. Deal 'Enterprise Plan' stalled for 7 days (no activity)
 3. Jira ticket 'Login issue' escalated (customer blocked)

 You have 2 pending proposals awaiting approval:
 1. Create follow-up task for Acme Corp account manager
 2. Notify CSM team about Jira escalation

 Would you like to review these now?"
    ↓
User hears brief
```

**Key:** Voice becomes proactive briefing interface (not just reactive chat).

---

### Phase 4: Voice Commands (Shortcuts)

**Use Cases:**

- "Twin, what's the status of Deal X?"
- "Twin, who owns Account Y?"
- "Twin, show me high-priority signals"
- "Twin, approve proposal Z"
- "Twin, create a task to follow up with John"

**Implementation:**

```typescript
// In Twin Runtime reasoning
function detectVoiceCommand(input: string): VoiceCommand | null {
  const patterns = {
    status_check: /status of (deal|account|task|ticket) (.+)/i,
    owner_query: /who owns (account|deal|project) (.+)/i,
    signal_list: /show (me )?(high-priority |pending )?signals/i,
    approve: /approve proposal (.+)/i,
    create_task: /create (a )?task to (.+)/i,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    const match = input.match(pattern);
    if (match) {
      return { type, params: match.slice(1) };
    }
  }

  return null;
}

// In chat completions handler
const command = detectVoiceCommand(lastMessage);
if (command) {
  // Execute voice command directly
  const result = await executeVoiceCommand(c.env, command, tenantId);
  return formatVoiceResponse(result);
}
```

**Key:** Voice becomes efficient command interface (not just conversation).

---

## Voice Modality Considerations

### What Voice Changes

**1. Brevity**

- Voice responses should be concise (not wall of text)
- Focus on key information (not exhaustive detail)

**2. Clarity**

- Avoid ambiguity (harder to clarify in voice than chat)
- Confirm actions explicitly ("I've created a proposal for...")

**3. Context**

- Voice is often used hands-free (driving, walking)
- Responses should be self-contained (no "see link above")

**4. Memory**

- Voice conversations feel more ephemeral
- Important info should be repeated/confirmed

### Voice-Optimized Responses

**Bad (chat-style):**

```
Based on the current system state, I've identified 3 signals
requiring your attention:

1. Account: Acme Corp
   - Health Score: 42 (↓ from 78)
   - Risk Level: High
   - Reason: No activity for 14 days
   - Recommendation: Schedule check-in call
   - Confidence: 0.87

[... 2 more signals with full detail ...]
```

**Good (voice-style):**

```
You have 3 high-priority signals.

First: Acme Corp health score dropped to 42. No activity for 2 weeks.

Second: Enterprise deal stalled for 7 days.

Third: Customer blocked by login issue.

Should I create follow-up tasks?
```

---

## Voice + Browser Agent (Advanced)

**Use Case:** "Twin, check if the HubSpot contact was created"

**Flow:**

```
User speaks
    ↓ (x.ai STT)
"Twin, check if the HubSpot contact was created"
    ↓ (Twin Runtime)
Twin reasons: User wants visual verification
Twin proposes: Browser agent screenshot of HubSpot contact page
    ↓ (Governance)
Approved (low-risk read-only action)
    ↓ (Act → Browser Agent)
Browser navigates to HubSpot, screenshots contact page
    ↓ (Outcome)
Screenshot stored: /screenshots/hubspot-contact-123.png
    ↓ (Twin responds)
"Yes, John Doe at Acme Corp is in HubSpot. I've captured a screenshot for verification."
    ↓ (x.ai TTS)
User hears confirmation
```

**Key:** Voice can trigger browser verification (visual audit trail).

---

## Implementation Checklist

### Phase 1: Voice → Twin Runtime ✅ (Designed)

- [ ] Twin Runtime exposes `/v1/chat/completions` (OpenAI-compatible)
- [ ] Twin Runtime stores conversational memory
- [ ] Twin Runtime reasons about chat context
- [ ] Twin Runtime creates proposals from chat
- [ ] OWUI configured to call Twin Runtime instead of LiteLLM
- [ ] Test: Voice input → Twin response with memory

---

### Phase 2: Voice-Initiated Actions

- [ ] Twin detects action requests in voice input
- [ ] Twin creates governed proposals from voice
- [ ] Twin responds with proposal confirmation
- [ ] L2 UI shows proposals with "Voice-initiated" tag
- [ ] Test: Voice → Proposal → Approval → Execution

---

### Phase 3: Voice Briefings

- [ ] Twin detects briefing requests ("morning brief", "status update")
- [ ] Twin formats structured briefs for TTS
- [ ] Twin includes signals, proposals, at-risk items
- [ ] Test: Voice brief → Concise summary → Action follow-up

---

### Phase 4: Voice Commands

- [ ] Twin parses voice commands (shortcuts)
- [ ] Twin executes read queries directly (no proposal)
- [ ] Twin creates proposals for write actions
- [ ] Test: Voice command → Immediate response

---

## Voice Stack (Current vs Canonical)

### Current (OWUI-Centric)

```
Voice Input
    ↓ STT (x.ai Whisper)
Text
    ↓ OWUI
Twin Profile (Hermes/Think/Fast)
    ↓ LiteLLM
Grok-4.3
    ↓
Response
    ↓ TTS (x.ai Kokoro "eve")
Voice Output
```

**Status:** Works for conversation, no persistence/orchestration

---

### Canonical (Twin Runtime-Centric)

```
Voice Input
    ↓ STT (x.ai Whisper)
Text
    ↓ OWUI
Twin Runtime API (/v1/chat/completions)
    ├─ Observe (system state)
    ├─ Reason (OpenRouter Agents)
    ├─ Propose (governed actions)
    ├─ Store (conversational memory)
    └─ Respond (with context)
    ↓
Response
    ↓ TTS (x.ai Kokoro "eve")
Voice Output
```

**Status:** Needs implementation (Phase 1)

---

## Voice vs Chat vs API

| Dimension         | Voice                 | Chat                  | API                   |
| ----------------- | --------------------- | --------------------- | --------------------- |
| **Input**         | Speech (x.ai STT)     | Text (typing)         | JSON (programmatic)   |
| **Output**        | Speech (x.ai TTS)     | Text (markdown)       | JSON (structured)     |
| **Context**       | Hands-free, brief     | Detailed, searchable  | Automated, bulk       |
| **Persistence**   | ✅ (via Twin Runtime) | ✅ (via Twin Runtime) | ✅ (via Twin Runtime) |
| **Proposals**     | ✅ (voice-initiated)  | ✅ (chat-initiated)   | ✅ (API-initiated)    |
| **Execution**     | ✅ (after approval)   | ✅ (after approval)   | ✅ (after approval)   |
| **Orchestration** | ✅ (Twin coordinates) | ✅ (Twin coordinates) | ✅ (Twin coordinates) |

**Key:** All interfaces reach the same Twin Runtime. Voice is not special, just another modality.

---

## Voice as Daily Interface

### Morning Routine

```
User: "Twin, morning brief"
Twin: "Good morning. 3 high-priority signals, 2 pending proposals, 1 at-risk account."
User: "Details on the at-risk account"
Twin: "Acme Corp health score dropped to 42. No activity for 14 days. Should I create a follow-up task?"
User: "Yes, assign to Sarah"
Twin: "Proposal created. Sarah will be notified once you approve in L2."
```

### During Work

```
User: "Twin, status of Enterprise deal"
Twin: "Stalled for 7 days. Last activity: pricing sent. Next step: follow-up call."
User: "Create task to call tomorrow"
Twin: "Proposal created. Would you like to review it now?"
User: "No, I'll approve later"
```

### End of Day

```
User: "Twin, what did I accomplish today?"
Twin: "You approved 3 proposals, closed 2 deals, resolved 4 signals. 1 proposal is still pending: follow-up with Acme Corp."
User: "Remind me about that tomorrow"
Twin: "Reminder set for 9 AM."
```

---

## Summary

**Voice is an interface to the Twin Runtime.**

**Current Implementation:**

- ✅ Voice works (x.ai STT + TTS via OWUI)
- ✅ Conversation flows (Grok-4.3 + Twin profiles)
- ❌ No persistence beyond chat session
- ❌ No proposals from voice input
- ❌ No orchestration (just LLM responses)

**Canonical Architecture:**

- OWUI calls Twin Runtime (not LiteLLM)
- Voice input → Twin observes/reasons/proposes
- Twin stores conversational memory
- Twin creates proposals from voice
- Twin coordinates execution (after approval)

**Next Steps:**

1. Twin Runtime exposes `/v1/chat/completions`
2. OWUI configured to call Twin Runtime
3. Twin stores conversational memory
4. Twin detects action requests in voice input
5. Twin creates proposals from voice

**Voice becomes a first-class interface to the persistent Twin.**

---

**Ready to implement Phase 1 (Voice → Twin Runtime API)?**
