# Three Flows — Visual Section Spec

> The most important section on the website. This is where the visitor understands
> what makes IntegrateWise different from every other tool.
>
> Three flows. Three visual journeys. Feature language only.
> Should feel like you're watching your data come alive.

---

## Section Header

**Kicker badge:** "How it actually works"

**Headline:** "Three flows. One complete picture."

**Subline:** "Other tools see fragments. IntegrateWise sees everything — because it connects three layers that no other product combines."

---

## Flow 1: Your Data → Single Source of Truth

### What the user gets (feature language)

**Title:** "Every tool you use, cleaned and connected"

**Body:**
"You connect Salesforce, Stripe, Zendesk, Jira — whatever you use. IntegrateWise pulls in your accounts, contacts, deals, invoices, tasks, and tickets. It cleans the data automatically — normalizes field names, removes duplicates, resolves 'Acme Corp' in one tool with 'Acme Corporation' in another. You end up with one unified record per entity, updated every time your tools sync."

**What they see in the workspace:**

- Accounts with health scores
- Contacts with interaction history across every tool
- Deals with pipeline stage and revenue
- Tasks with due dates and owners
- Invoices with payment status

**The key line:**
"Connect once. See everything. No more tab-switching."

### Visual treatment

**Concept:** A horizontal animated flow showing data moving from scattered tool icons into a clean, unified record.

**Left side — The Sources:**

- 6-8 tool icons (Salesforce, Stripe, Zendesk, Slack, Gmail, Jira, HubSpot, Notion) floating in a loose cluster
- Each icon has a subtle glow in its brand color
- Small data fragments (field labels like "Company: Acme", "Amount: $24K", "Status: Open") float near each icon, slightly transparent

**Center — The Pipeline (animated):**

- Data fragments detach from the tool icons and flow toward the center
- As they move, they transform — messy labels become clean, standardized fields
- Duplicate fragments merge (two "Acme" labels combine into one)
- A subtle emerald pulse runs along the flow path
- The pipeline is NOT shown as 8 stages — it's shown as a smooth transformation. Messy in, clean out.

**Right side — The Unified Record:**

- A clean card showing "Acme Corp" with:
  - Health: 92 (green badge)
  - ARR: $125K
  - Renewal: 45 days
  - Last touch: 2 hours ago
  - Source badges: Salesforce + Zendesk + Stripe (showing data came from 3 tools)
- The card has the emerald ring shadow (`.arvio-card` style)
- It feels solid, trustworthy, complete

**Animation:** Continuous slow flow from left to right. Not a one-time animation — it loops gently, showing data always flowing. When the section enters viewport, the animation starts. Parallax: the tool icons move slightly slower than the data flow on scroll.

**Color:** Emerald green accents on the flow path. Tool icons in their natural brand colors. The unified record card has the emerald ring shadow.

---

## Flow 2: Your Conversations → Full Context

### What the user gets (feature language)

**Title:** "Your emails, messages, and documents — connected to every account"

**Body:**
"Your CRM says the renewal is in 45 days. But the email from last week says the champion mentioned a budget freeze. The Slack thread from yesterday says the team is evaluating a competitor. No single tool sees all of this. IntegrateWise reads your emails, Slack messages, meeting notes, and documents — and links them to the right accounts automatically. Now when you look at any account, you see the full story."

**What they see in the workspace:**

- Email threads linked to accounts
- Slack messages connected to deals
- Meeting notes attached to contacts
- Documents (PDFs, proposals, contracts) linked to entities
- A timeline showing every interaction across every channel

**The key line:**
"Data tells you what happened. Context tells you why."

### Visual treatment

**Concept:** Conversation fragments flowing from communication tools into an entity's context layer, building a rich timeline.

**Left side — The Conversations:**

- Email icon (Gmail/Outlook) with a preview snippet: "Re: Q3 Renewal — budget freeze..."
- Slack icon with a message bubble: "#deals — competitor evaluation started"
- Calendar icon with a meeting card: "QBR with Acme — 45 min"
- Document icon (Google Drive) with a file name: "Acme_Proposal_v3.pdf"
- Each has a subtle warm glow (not emerald — use a softer blue-gray to differentiate from Flow 1)

**Center — The Linking (animated):**

- Thin lines extend from each conversation fragment toward the right
- As they connect, a small "link" icon pulses at the connection point
- The lines are not straight — they curve gently, like threads being woven together
- Each line carries a small label: "linked to Acme Corp" that fades in and out

**Right side — The Context View:**

- The same "Acme Corp" card from Flow 1, but now expanded to show a timeline:
  - 2h ago — Email: "Re: Q3 Renewal" (Gmail badge)
  - Yesterday — Slack: "Competitor evaluation" (#deals badge)
  - 3 days ago — Meeting: "QBR with Acme" (Calendar badge)
  - Last week — Document: "Proposal v3" (Drive badge)
- The timeline feels alive — entries have subtle entrance animations as if they're being linked in real time
- A label at the top: "Context layer — 47 interactions across 5 tools"

**Animation:** The linking animation is the star. Conversation fragments gently float from left to right, connect to the entity card, and appear in the timeline. New entries appear at the top of the timeline, pushing older ones down. Continuous, slow, mesmerizing.

**Color:** Softer palette than Flow 1. Blue-gray lines. The conversation fragments keep their tool brand colors. The timeline entries have subtle left-border colors matching their source tool.

---

## Flow 3: Your AI Knowledge → Governed Memory

### What the user gets (feature language)

**Title:** "AI that learns about your business — but only what you've confirmed"

**Body:**
"Every AI conversation you have — with ChatGPT, Claude, Gemini, or the Twin — can generate knowledge. A decision you made. A preference you expressed. An insight the AI surfaced. But unlike every other AI tool, this knowledge doesn't auto-write into your system. The Twin proposes what it learned. You see the evidence, the confidence score, the source. You approve, reject, or edit. Only confirmed knowledge enters the memory. And that memory grows every day — compounding into an intelligence layer that makes the Twin sharper over time."

**What they see in the workspace:**

- Knowledge Hub with verified memories
- Triage Inbox with pending proposals from the Twin
- Session history across AI providers
- Confidence scores on every piece of knowledge
- Audit trail — who approved what, when, from which AI

**The key line:**
"Other AI guesses and forgets. The Twin learns and remembers — but only what you've confirmed."

### Visual treatment

**Concept:** The approval gate. AI proposes → you review → knowledge enters the system. The visual climax of the three flows.

**Left side — The AI Session:**

- A chat-like interface showing a Twin conversation:
  - Twin: "Based on the last 3 QBRs and the support ticket trend, Acme Corp may be evaluating alternatives. Confidence: 78%."
  - Below: a card showing the proposed knowledge entry:
    - "Acme Corp — evaluating alternatives"
    - Source: Twin analysis + Zendesk tickets + QBR notes
    - Confidence: 78%
    - Status: Pending your review

**Center — The Approval Gate (the visual climax):**

- A prominent gate/barrier visual — not a literal gate, but a glowing emerald threshold
- Two buttons floating at the gate: [Approve] in emerald, [Reject] in muted gray
- When the animation plays, the [Approve] button pulses gently — inviting the click
- Above the gate: "Nothing enters without your say"
- This is the moment. This is what makes IntegrateWise different. The gate should feel important, deliberate, powerful.

**Right side — The Knowledge Memory:**

- After approval, the knowledge entry flows through the gate and appears in a "Verified Knowledge" panel:
  - "Acme Corp — evaluating alternatives" ✓ Verified
  - Approved by: You, 2 minutes ago
  - Confidence: 78% → now part of the Twin's context
  - Below: other verified memories stacked, showing the knowledge growing:
    - "Acme Corp — budget freeze mentioned in Q3 QBR" ✓
    - "Acme Corp — champion prefers email over Slack" ✓
    - "Acme Corp — renewed at 15% discount last year" ✓
- A counter at the bottom: "47 verified memories for Acme Corp — growing daily"

**Animation:** This is the most dramatic of the three flows. The proposal appears on the left, floats toward the gate, pauses at the threshold (the approval moment), then — after a beat — passes through and appears on the right as verified knowledge. The gate glows brighter when the knowledge passes through. The verified memories stack gently, showing accumulation.

**Color:** Emerald green is dominant here. The gate glows emerald. The [Approve] button is emerald. The verified knowledge entries have emerald left-border. The rejected path (if shown) fades to gray and dissolves.

---

## The Convergence — All Three Meet

After the three individual flow sections, one final visual:

**Title:** "All three layers. One complete view."

**Body:**
"When you click on any account, you see everything — the data from your tools, the conversations from your email and Slack, and the verified knowledge from your AI sessions. The Twin reads all three before it says anything. That's why it catches things no single tool can see."

**Visual:**

- The three flow paths (data, context, knowledge) converge into a single entity card
- The card is the complete view — showing all three layers assembled:
  - Truth: ARR $125K, Health 92, Renewal 45d
  - Context: 47 interactions, last email 2h ago, champion mentioned budget freeze
  - Knowledge: 12 verified memories, Twin confidence 87%
  - Twin insight: "Usage dropped 42% + champion silent + budget freeze = intervention needed. Evidence from 3 layers."
- The three flow lines merge into the card with a satisfying visual convergence — like three rivers meeting

**Animation:** The three paths animate simultaneously, converging into the entity card. The card assembles progressively — Truth layer appears first, Context layer adds depth, Knowledge Memory adds intelligence. The Twin insight appears last, as the culmination of all three.

---

## Technical Notes for Implementation

**Framework:** Next.js + Framer Motion (already in integratewise-lg)

**Animation approach:**

- Use `whileInView` for section entrance animations
- Use `useScroll` + `useTransform` for parallax effects within each flow
- Use `AnimatePresence` for the approval gate sequence
- The continuous flow animations (data moving, conversations linking) should use CSS `@keyframes` for performance, not Framer Motion (avoid JS-driven infinite loops)

**Responsive:**

- Desktop: horizontal flows (left → center → right)
- Tablet: same but compressed
- Mobile: vertical flows (top → middle → bottom), each flow stacks

**Performance:**

- Lazy-load each flow section — only animate when in viewport
- Use `will-change: transform` on animated elements
- Keep particle/glow effects in CSS (box-shadow, radial-gradient), not canvas
- Test on 4G — the section should load under 2 seconds

**Existing components to reuse:**

- `.arvio-card` for the entity cards
- `.arvio-badge` for the kicker badges
- `<Marquee>` pattern for any continuous horizontal motion
- Framer Motion `spring` transitions (already used throughout the site)

**New components needed:**

- `FlowPath` — animated SVG path showing data movement
- `ApprovalGate` — the emerald threshold with approve/reject
- `VerifiedMemoryStack` — growing list of verified knowledge entries
- `EntityConvergence` — the final card where all three flows meet

---

## Content Summary (Copy-Paste Ready)

### Flow 1

- Kicker: "Flow 1 — Your Data"
- Title: "Every tool you use, cleaned and connected"
- Key line: "Connect once. See everything. No more tab-switching."
- Features: 70+ connectors, automatic cleaning, deduplication, one record per entity, continuous sync

### Flow 2

- Kicker: "Flow 2 — Your Conversations"
- Title: "Your emails, messages, and documents — connected to every account"
- Key line: "Data tells you what happened. Context tells you why."
- Features: Email, Slack, meetings, documents linked to entities, unified timeline, full interaction history

### Flow 3

- Kicker: "Flow 3 — Your Knowledge"
- Title: "AI that learns about your business — but only what you've confirmed"
- Key line: "Other AI guesses and forgets. The Twin learns and remembers — but only what you've confirmed."
- Features: Twin proposes, you approve, confidence scoring, audit trail, knowledge compounds daily, any AI reads from verified memory

### Convergence

- Title: "All three layers. One complete view."
- Key line: "The Twin reads all three before it says anything. That's why it catches things no single tool can see."

---

_This section is the heart of the website. If a visitor understands these three flows, they understand why IntegrateWise exists. Make it beautiful. Make it feel alive. Make them want to be inside it._
