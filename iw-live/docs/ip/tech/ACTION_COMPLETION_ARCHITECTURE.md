# Action Completion Architecture

> How actions flow from insight to execution in IntegrateWise.
> Canonical reference for agents working on the HITL/approval/execution layer.
> Last updated: April 12, 2026

---

## Design Principle

The workspace (L1) is the daily driver. Users manage accounts, track tasks, run workflows here.
The cognitive layer (L2) accelerates what they're already doing — surfaces the right action at the right time.

**Demo story**: "Here are your at-risk accounts. Click. See why. Approve the action. Done."

The product is NOT "look what our AI can do." It IS "this is your workspace. The AI makes you faster."

---

## The Action Pipeline

```
Signal → Think → Propose → Govern → HITL → Act → Learn → Repeat
```

| Stage       | Service       | What happens                                                           |
| ----------- | ------------- | ---------------------------------------------------------------------- |
| **Signal**  | Think         | External data triggers a signal rule (e.g., health score < 60)         |
| **Think**   | Think         | Signal engine escalates → creates ProposedAction                       |
| **Propose** | Think (Queue) | Queue handler persists action to `actions` table as `pending_approval` |
| **Govern**  | Govern        | Policy check — can this action execute? RBAC, guardrails               |
| **HITL**    | Workflow      | Human reviews in PendingApprovalsCard → ApprovalModal                  |
| **Act**     | Act           | Mandatory approval token + governance double-check → execute           |
| **Learn**   | Think         | Outcome feedback → decision_memory → pattern extraction                |

---

## Two HITL Paths

### 1. Spine DB-based (primary — production flow)

- `GET /api/v1/cognitive/hitl/queue` → reads `actions` table where `status = 'pending_approval'`
- `POST /api/v1/cognitive/hitl/queue` → approve/deny, writes to `actions`, sends to `ACT_QUEUE` on approve, writes to `decision_memory` on deny
- `GET /api/v1/cognitive/hitl/history` → reads approved/denied actions

### 2. Durable Object-based (signal-level, real-time)

- `POST /hitl/create` → creates pending HITL record in DO storage
- `POST /hitl/resolve` → if approved, generates approval_token, calls Act directly
- `GET /hitl/count` → pending count for badges

---

## Where Actions Surface (L1 Workspace)

Actions are NOT a separate feature — they're embedded in the views users already use daily.

| Surface                       | Component                                  | Data Source                                       |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------- |
| **CS Today View**             | PendingApprovalsCard + ExecutionStatusCard | `useL2Recommendations(CUSTOMER_SUCCESS)`          |
| **CS At-Risk View**           | PendingApprovalsCard + ApprovalModal       | `useL2Recommendations(CUSTOMER_SUCCESS, at-risk)` |
| **BizOps Dashboard**          | PendingApprovalsCard                       | `useL2Recommendations(BIZOPS)`                    |
| **Twin Chat (inline)**        | Quick Action Buttons + ActionDraftCard     | `cognitive.twinAct()` API                         |
| **L2 Drawer (ActSurface)**    | Approve/Reject buttons                     | `getHITLQueue()` from l2-client                   |
| **RevOps Pending Review**     | PendingApprovalsCard + ApprovalModal       | `useL2Recommendations(REVOPS)`                    |
| **Finance Invoice Approvals** | Domain-specific approval UI                | Local state (needs wiring)                        |
| **Admin Approval Workflows**  | RBAC approval system                       | Mock data (needs wiring)                          |

---

## Twin Chat — Action Trigger Flow

The Twin Chat is the demo closer. The flow:

1. User asks Twin about an at-risk account (entity-scoped via `entityId` prop)
2. Twin responds with grounded analysis from Entity 360
3. **Quick Action Buttons** appear below the response (domain-contextual)
4. User clicks "Schedule Health Call" → calls `POST /api/v1/cognitive/twin/act` with `draft_only: true`
5. **ActionDraftCard** shows suggested summary + next steps
6. User clicks "Approve & Execute" → calls with `draft_only: false`
7. Goes through Govern check → Act execution → outcome learning

### Domain Actions

| Domain | Action Key               | Label                  | Description                            |
| ------ | ------------------------ | ---------------------- | -------------------------------------- |
| CS     | `schedule_health_call`   | Schedule Health Call   | Book check-in with primary stakeholder |
| CS     | `draft_retention_email`  | Draft Retention Email  | AI-drafted email from risk signals     |
| CS     | `escalate_to_leadership` | Escalate to Leadership | Flag for executive attention           |
| BizOps | `create_task`            | Create Task            | Turn insight into actionable task      |
| BizOps | `trigger_workflow`       | Trigger Workflow       | Start automated workflow               |
| BizOps | `send_payment_reminder`  | Send Payment Reminder  | Draft payment follow-up                |

---

## Frontend Component Inventory

### Reusable Components (`apps/web/src/components/l2/approvals/`)

| Component              | File                         | Purpose                                                                        |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `PendingApprovalsCard` | `pending-approvals-card.tsx` | Card queue of pending approvals. Accepts `approvals` prop (PendingApproval[]). |
| `ApprovalModal`        | `approval-modal.tsx`         | Full-screen approval view with evidence, urgency, confidence, entity info.     |
| `ExecutionStatusCard`  | `execution-status-card.tsx`  | Running/completed/failed execution tracker with live timer.                    |
| `ActionBar`            | `action-bar.tsx`             | Inline action card with policy requirements and risk level.                    |
| `approvalsApi`         | `approvals-api.ts`           | Typed API client for HITL queue. All decisions route through Workflow.         |

### Hooks

| Hook                   | File               | Purpose                                        |
| ---------------------- | ------------------ | ---------------------------------------------- |
| `useL2Recommendations` | `hooks/use-l2.ts`  | Fetches pending recommendations (30s stale).   |
| `useL2Decide`          | `hooks/use-l2.ts`  | Mutation: approve/reject, invalidates queries. |
| `useHITLQueue`         | `hooks/use-api.ts` | Polls HITL queue every 15s.                    |
| `useHITLAction`        | `hooks/use-api.ts` | Mutation for HITL approve/deny.                |

### API Client Methods

| Method                   | File                | Endpoint                             | Purpose                            |
| ------------------------ | ------------------- | ------------------------------------ | ---------------------------------- |
| `cognitive.twinAct()`    | `lib/api-client.ts` | `POST /api/v1/cognitive/twin/act`    | Draft or execute action from Twin. |
| `cognitive.hitlQueue()`  | `lib/api-client.ts` | `GET /api/v1/cognitive/hitl/queue`   | Fetch pending proposals.           |
| `cognitive.hitlAction()` | `lib/api-client.ts` | `POST /api/v1/cognitive/hitl/queue`  | Approve/deny/request changes.      |
| `cognitive.act()`        | `lib/api-client.ts` | `POST /api/v1/cognitive/act/execute` | Execute with approval token.       |

---

## Database Tables

| Table               | Purpose                                  | Key Columns                                                                     |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| `actions`           | Primary action queue                     | status (pending_approval/approved/denied/executed), approval_token, target_tool |
| `action_proposals`  | L2→L1 approval flow                      | status (pending/approved/rejected/executed/failed), trust_score, evidence_refs  |
| `decisions`         | Cognitive Brain decisions                | reasoning_chain, evidence_snapshot, trust_score                                 |
| `decision_memory`   | Organizational learning                  | was_correct, pattern_tags, reusability_score                                    |
| `decision_patterns` | Reusable patterns                        | success_rate, recommended_action_type                                           |
| `v_today_queue`     | VIEW: tasks + signals + action_proposals | UNION ALL of pending items                                                      |

---

## Backend Services

| Service                             | Endpoints                                                                  | Role                                     |
| ----------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| **Think** (`services/think/`)       | `POST /v1/twin/act`, `POST /v1/outcome/feedback`, `POST /v1/decide`        | Propose actions, receive outcomes, learn |
| **Govern** (`services/govern/`)     | `POST /v1/check`, `POST /v1/approve`, `POST /v1/reject`, `GET /v1/pending` | Policy gate                              |
| **Act** (`services/act/`)           | `POST /execute`, `GET /proposals/:situation_id`                            | Execute with mandatory approval token    |
| **Workflow** (`services/workflow/`) | `GET/POST /api/v1/cognitive/hitl/queue`, HITL DO                           | Orchestrate approval queue               |

---

## Rules (KT Notes)

1. **No action executes without an approval token** — Act service returns 403 without `x-approval-token`
2. **Governance is mandatory** — even with valid token, Act calls Govern for double-check
3. **Fail-safe on governance unavailability** — if Govern is down, execution is blocked (not allowed)
4. **Results re-ingest through pipeline** — Act does NOT write directly to Spine
5. **Deny writes learning signal** — rejection feeds back to Think via `decision_memory` so AI adjusts
6. **Frontend routes ALL decisions through Workflow HITL queue** — never call Act/Govern directly

---

## What's Wired vs. Needs Wiring

| Component                         | Status                        |
| --------------------------------- | ----------------------------- |
| CS Today View approval queue      | Wired to useL2Recommendations |
| CS At-Risk View                   | Fully wired                   |
| BizOps Dashboard approval queue   | Wired to useL2Recommendations |
| Twin Chat quick actions           | Wired to cognitive.twinAct()  |
| Twin Chat entity scoping          | Wired (entityId prop)         |
| L2 Drawer ActSurface              | Wired to getHITLQueue         |
| RevOps Pending Review             | Fully wired                   |
| Finance Invoice Approvals         | NOT wired (client-side only)  |
| Admin Approval Workflows          | NOT wired (mock data)         |
| ExecutionStatusCard live data     | Needs Act execution stream    |
| Flow C write-back after Twin Chat | Not triggered yet             |
