# IntegrateWise — Features in User Language

> Nobody buys "governed AI" or "8-stage pipeline."
> People buy solutions to problems they feel every day.
> This doc translates every feature into what the user gets.

---

## THE HEADLINE PROBLEMS WE SOLVE

### Problem 1: "I check 12 tabs every morning just to understand my business"

Every founder, operator, and account manager starts their day the same way: open Salesforce, check Slack, look at Stripe, scan Jira, read emails, update the spreadsheet. By the time they have context, an hour is gone.

**What IntegrateWise does:** Connect your tools once. See everything in one screen. Accounts, revenue, tasks, calendar, documents, messages — all assembled automatically. No copy-pasting. No tab-switching. Your morning briefing is ready before you are.

**Use cases:**

- Founder opens one dashboard instead of 12 tabs → saves 1-2 hours/day
- CSM sees account health, open tickets, renewal date, and last email — all in one view
- CA sees client filings, pending invoices, and upcoming deadlines without opening Tally separately
- Retail business owner sees today's orders, payments received, and credit outstanding in one place

---

### Problem 2: "I missed a renewal / deadline / at-risk account because nobody told me"

The data was there — in the CRM, in the support tool, in the billing system. But nobody connected the dots. By the time someone noticed, the customer was already gone.

**What IntegrateWise does:** The system watches your connected tools continuously. When something needs your attention — a customer going quiet, a renewal approaching, a payment overdue, usage dropping — it tells you. With evidence. Before it becomes a crisis.

**Use cases:**

- "Acme Corp usage dropped 42% and their renewal is in 45 days" → you act before the churn
- "Client GST filing is overdue and they haven't responded in 3 weeks" → you follow up before the penalty
- "Regular customer hasn't ordered in 30 days" → you reach out before they switch
- "3 support tickets escalated this week for the same account" → you intervene before the relationship breaks

---

### Problem 3: "I don't trust what AI tells me — it makes things up"

You've used ChatGPT or Copilot. It sounds confident. But half the time it's wrong. It invents data, forgets what you told it, and gives different answers to the same question. You can't run a business on guesses.

**What IntegrateWise does:** Every insight comes with evidence — which data, from which tool, how recent. And when AI learns something new about your business, it doesn't just write it down automatically. It asks you first. You approve what's true. You reject what's not. Only verified facts enter the system. As multi-AI support rolls out, any AI you use — Claude, GPT, Gemini — will read from the same verified knowledge. No hallucinations. No guesses.

**Use cases:**

- AI says "this account is at risk" → you see exactly why: usage data from Mixpanel + 3 open tickets from Zendesk + no meeting in 60 days from Calendar
- AI proposes "send a renewal reminder" → you approve or modify before anything happens
- You switch from ChatGPT to Claude → your verified business knowledge stays. Nothing lost.
- AI suggests a budget adjustment → you see the evidence, approve it, and it becomes a fact. Not before.

---

### Problem 4: "My team uses 5 different AIs and none of them know what the others said"

One person uses Claude. Another uses ChatGPT. A third uses Gemini. Each AI has its own memory. None of them share context. Your team's knowledge is scattered across AI conversations that nobody else can see.

**What IntegrateWise does:** One shared knowledge base that every AI reads from. When someone discovers something important in an AI conversation, it gets verified and added to the shared knowledge. Now every team member has the same context. As multi-AI integration rolls out, any AI tool will read from this same verified base. Knowledge compounds over time instead of getting lost in chat histories.

**Use cases:**

- CSM discovers in an AI session that the client is considering a competitor → verified, added to account knowledge → every team member now knows this
- Founder makes a strategic decision during an AI conversation → verified, becomes organizational memory → new hires inherit this context
- CA learns a client's tax preference during an AI session → verified, linked to client profile → next year's filing already knows this

---

## FEATURES TRANSLATED TO USER LANGUAGE

### "Connect your tools once, see everything in one place"

_Technical: 70+ connectors, OAuth 2.0, 8-stage pipeline, Spine_

You connect Salesforce, Slack, Stripe, Jira — whatever you use. IntegrateWise pulls in your data, cleans it up, removes duplicates, and organizes it. You don't configure anything. It just works. New data syncs automatically — every 4 hours, every hour, or every 15 minutes depending on your plan.

---

### "One complete view of any account, client, or customer"

_Technical: Entity 360, 6-layer assembly, < 200ms_

Click on any account and see everything about them in one view: the facts (from your CRM), the conversations (from email and Slack), the alerts (from the system watching patterns), the knowledge (from verified AI sessions), the goals (linked objectives), and the relationships (who's connected to whom). No more opening 4 tools to prepare for a meeting.

---

### "AI that watches your business and tells you what needs attention"

_Technical: Twin Trigger Engine, 10 triggers, evidence-backed insights_

The system doesn't wait for you to ask. It watches patterns across all your connected tools and surfaces what matters:

- "This account's health dropped — here's why and what you could do"
- "This renewal is coming up and there are warning signs"
- "This customer went quiet — they used to be active weekly"
- "Multiple signals firing on the same account — something is happening"

Every alert comes with evidence. Not a guess. Not a rule you configured. The system sees patterns across tools that no single tool can see on its own.

---

### "AI that only remembers what you've confirmed"

_Technical: TruthLayer, Triage Bot, approval-gated memory, Flow C_

Most AI tools that save memory do it automatically — without asking if it's right. They guess, infer, and sometimes invent. IntegrateWise is different: when AI discovers something about your business, it proposes it to you first. You see what it found, where it came from, and how confident it is. You approve, reject, or edit. Only what you confirm becomes part of your business knowledge.

This means:

- No hallucinated facts in your system
- No AI inventing a customer commitment that doesn't exist
- No conflicting memories across different AI tools
- Full audit trail on every piece of knowledge — who approved it, when, from which source

---

### "Your business gets smarter every day — without retraining anything"

_Technical: Knowledge Memory, consolidated_memories, growing context_

Every day, as you use IntegrateWise, your verified knowledge grows. New customer interactions, new decisions, new insights — all accumulating. The AI doesn't need retraining. It reads from your growing knowledge base. After a month, it knows your business better than any new hire. After a year, it's your institutional memory.

This is why it's called a Knowledge Workspace. The workspace itself becomes more intelligent over time.

---

### "AI proposes actions — you decide what happens"

_Technical: HITL, Govern, Act, approval workflows_

The AI doesn't just observe — it suggests what to do. "Draft a renewal reminder." "Schedule a check-in call." "Flag this for the team." But it never acts on its own. You see the proposal, the evidence, and the reasoning. You approve, modify, or dismiss. Only then does the action happen.

When an action executes (like creating a task or sending a reminder), the result flows back into the system. The AI sees what happened and learns from it. Next time, its suggestions are better.

---

### "No more duplicate records across your tools"

_Technical: Identity Resolution, S7.5, HITL merge_

"Acme Corp" in Salesforce, "Acme Corporation" in Zendesk, "acme.com" in Stripe — same company, three records. IntegrateWise detects these automatically. It shows you the potential matches side by side with a confidence score. You decide: merge them, keep them separate, or come back later. No auto-merging. No surprises.

---

### "Works for your industry, not just SaaS"

_Technical: 12 domain schemas, adaptive schema_

During setup, you tell us your department and industry. The workspace adapts. A SaaS CSM sees accounts, health scores, and renewals. A CA sees clients, filings, and invoices. A hotel manager sees guests, bookings, and satisfaction scores. A retail business owner sees orders, payments, and credit. Same system, different lens — shaped by what matters to you.

---

### "See what's real, not what's assumed"

_Technical: Trust Layer, source attribution, confidence scoring, evidence chains_

Every data point shows where it came from and how fresh it is. Every AI insight shows the evidence chain — which data, from which tool, how confident. You always know: is this a fact from Salesforce updated 2 hours ago, or a stale record from last month? Is this insight based on 5 data points or 1? Trust is built into every pixel.

---

### "Your data stays yours — completely isolated"

_Technical: Spine DB RLS, tenant isolation, encrypted tokens_

Your workspace is completely separate from every other workspace. Database-level isolation means no other company can ever see your data. Your connector tokens are encrypted. Every action is logged. You control who sees what.

---

## USE CASE STORIES (For Website / Sales)

Stories are organized by the 3 doors. No product names exposed — sales attaches the right product during the conversation.

### Door 1: Business Ops

**The Founder Who Stopped Tab-Switching**

"I used to open Stripe, then HubSpot, then Slack, then Jira, then Google Sheets — every single morning. By the time I had context on my business, an hour was gone. Now I open IntegrateWise and everything is there. Revenue, pipeline, tasks, messages, client health. One screen. The AI even tells me what needs my attention first."

_Tools connected: Stripe, HubSpot, Slack, Jira, Google Workspace_

---

**The Retail Business Owner Who Sees Everything**

"I run 3 shops. Orders come from WhatsApp, walk-ins, and my website. Payments come through Razorpay and UPI. Credit tracking is in Khatabook. Delivery is through Shiprocket. I used to spend 2 hours every morning just figuring out what happened yesterday. Now it's all in one dashboard. And when a regular customer stops ordering, the system tells me before I even notice."

_Tools connected: WhatsApp Business, Razorpay, Google Sheets, Shiprocket_

---

**The CA Who Never Missed a Filing**

"I manage 50 clients. Each one has different filing deadlines, different compliance requirements, different communication preferences. I used to track everything in spreadsheets. Now IntegrateWise pulls from Tally, Google Sheets, and WhatsApp — and tells me 'Client X's GST filing is due in 7 days and they haven't responded to your last message.' I haven't missed a deadline since."

_Tools connected: Tally, Google Sheets, WhatsApp Business, Google Calendar_

---

### Door 2: Account Success

**The CSM Who Caught Churn Before It Happened**

"We had a $125K account that looked healthy on paper. But IntegrateWise connected the dots: usage was down 42%, they had 3 open support tickets, and their champion had gone quiet. The system flagged it 6 weeks before the renewal. We intervened, saved the account, and expanded it. Without IntegrateWise, we would have found out at renewal time — too late."

_Tools connected: Salesforce, Zendesk, Amplitude, Slack_

---

**The Team That Stopped Losing AI Knowledge**

"Our team uses Claude, ChatGPT, and Gemini — different people prefer different tools. The problem was, insights from one AI conversation were invisible to everyone else. Someone would discover something important about a client in ChatGPT, and nobody else knew. Now, when anyone discovers something valuable, it goes through IntegrateWise's verification. Once approved, every AI and every team member has the same context. We stopped losing knowledge."

_Tools connected: Salesforce, Slack, Google Workspace_

---

### Door 3: Personal Ops

**The Freelancer Who Stopped Losing Context**

"I juggle 8 clients, 3 invoicing tools, and a personal budget. Every AI I used forgot what I told it yesterday. I'd explain the same client situation to ChatGPT three times in a week. Now my verified knowledge grows every week. When I switch from Claude to Gemini, my context follows. I know which clients owe me, which deadlines are coming, and what I discussed with each one — without digging through chat histories."

_Tools connected: Google Calendar, Notion, Razorpay, WhatsApp Business_

---

## FEATURE-TO-BENEFIT TRANSLATION TABLE

| Technical Feature      | What the User Gets                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| 70+ connectors         | Connect all your tools in minutes — no coding, no IT team needed                            |
| 8-stage pipeline       | Your data is automatically cleaned, deduplicated, and organized                             |
| Entity 360             | One complete view of any account, client, or customer                                       |
| Twin Trigger Engine    | AI watches your business and tells you what needs attention — with evidence                 |
| TruthLayer             | AI only remembers what you've confirmed — no hallucinations, no guesses                     |
| Knowledge Memory       | Your business gets smarter every day without retraining anything                            |
| HITL / Govern          | AI proposes, you decide — nothing happens without your approval                             |
| Identity Resolution    | No more duplicate records across your tools                                                 |
| 12 domain schemas      | Works for your industry — SaaS, finance, retail, education, any business                    |
| Trust Layer            | See where every data point came from and how fresh it is                                    |
| Spine DB RLS           | Your data is completely isolated — no other company can see it                              |
| Progressive Hydration  | See value in minutes — connect one tool and watch your data appear                          |
| Cloudflare Workers     | Fast everywhere — your workspace loads instantly, globally                                  |
| Realtime subscriptions | Live updates — new signals and data appear without refreshing                               |
| MCP integration        | Use any AI (Claude, GPT, Gemini) — they all read from your verified knowledge (coming soon) |

---

## WORDS TO USE vs WORDS TO AVOID

| Don't Say                          | Say Instead                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| Governed AI                        | AI that only acts with your approval                           |
| HITL approval workflow             | You decide what happens — AI proposes, you approve             |
| 8-stage normalizer pipeline        | Your data is automatically cleaned and organized               |
| Entity 360 assembly                | Complete view of any account in one click                      |
| Twin Trigger Engine                | AI that watches your business and tells you what matters       |
| TruthLayer / approval-gated memory | AI that only remembers what you've confirmed                   |
| Schema-driven extraction           | Works for your industry out of the box                         |
| Spine / SSOT                       | Single source of truth for all your tools                      |
| Flow A / Flow B / Flow C           | Your tools, your documents, and your AI — all connected        |
| RLS tenant isolation               | Your data stays completely private                             |
| Knowledge consolidated_memories    | Your business knowledge grows every day                        |
| Idempotency / dedup                | No duplicate records, no duplicate processing                  |
| DLQ / dead letter queue            | If something fails, nothing is lost — it retries automatically |
| Spine DB RPC                       | Direct database access — fast, no middleman                    |
| Progressive hydration B0-B7        | See value in minutes, not months                               |
| Durable Objects / WebSocket        | Live updates — no refreshing needed                            |

---

## THE ONE-LINER FOR EACH AUDIENCE

| Audience                | One-liner                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------- |
| SaaS Founder            | "Stop checking 12 tabs. Run your business from one screen."                            |
| CSM / Account Manager   | "See every account's health, history, and next step — in one view."                    |
| VP Customer Success     | "Catch churn 6 weeks before the renewal. With evidence."                               |
| CA / Accountant         | "Never miss a filing. See every client's status without opening Tally."                |
| Retail Business Owner   | "Orders, payments, credit, deliveries — one dashboard, every morning."                 |
| Agency Owner            | "Every client, every project, every invoice — connected and visible."                  |
| COO / Operator          | "Cross-functional visibility without building another dashboard."                      |
| CTO / Technical Buyer   | "70+ connectors, edge-deployed, schema-driven, tenant-isolated."                       |
| Individual / Freelancer | "Your personal AI that actually remembers what you told it — because you verified it." |

---

_This is how we talk about IntegrateWise. Not in architecture language. In the language of the person whose morning we're about to fix._
