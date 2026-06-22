# Surface Reality Pass — Design System + Functional Completeness

## The Core Test

For every module: can the user **Visualize → Obtain → Execute** from a single surface?

**Visualize**: See the current state (data, signals, health)  
**Obtain**: Understand what needs attention and why  
**Execute**: Take the next action from that surface — without navigating away

If a module fails Execute, it's a facade. The difference between IntegrateWise and a dashboard is that IW lets you act, not just observe. The user must be able to move work forward without switching tools or tabs.

---

## Part 1 — Design System Token Pass

### Context
`globals.css` defines the complete IW token set. All UI must use these variables. No hardcoded hex, no `rgba()` with decimal RGB, no Tailwind raw color classes (`bg-red-50`, `text-amber-*`). Only Inter and JetBrains Mono fonts.

### Tokens Available
**Surfaces**: `var(--background)` `var(--card)` `var(--secondary)` `var(--muted)` `var(--accent)` `var(--border)` `var(--radius)`  
**Text**: `var(--foreground)` `var(--muted-foreground)` `var(--card-foreground)`  
**Brand**: `var(--iw-blue)` `var(--iw-blue-50)` `var(--iw-blue-100)` `var(--iw-blue-900)` `var(--iw-pink)` `var(--iw-pink-light)` `var(--iw-success)` `var(--iw-warning)` `var(--iw-danger)` `var(--iw-purple)`  
**Tailwind classes** (via `@theme inline`): `bg-iw-blue`, `text-iw-blue`, `bg-iw-success`, `text-iw-danger`, `bg-iw-blue-50`, `border-border`, `rounded-lg`, etc.

### Fixes Required

**1. `globals.css`** — Add missing light semantic tokens:
```css
--iw-success-light: #E8F5F0;
--iw-warning-light: #FBF1E6;
--iw-danger-light:  #FDEAEA;
```
Add to `@theme inline` as `--color-iw-*-light`.

**2. `sidebar.tsx`** — CTX_CONFIG hardcoded hex accents (lines 40–49):
```ts
CTX_CS:        accent: "var(--iw-blue)"
CTX_SALES:     accent: "var(--iw-success)"
CTX_SUPPORT:   accent: "var(--iw-blue-light)"
CTX_PM:        accent: "var(--iw-purple)"
CTX_MARKETING: accent: "var(--iw-pink)"
CTX_BIZOPS:    accent: "var(--iw-blue)"
CTX_TECH:      accent: "var(--iw-blue-light)"
CTX_HR:        accent: "var(--iw-success)"
CTX_FINANCE:   accent: "var(--iw-warning)"
CTX_LEGAL:     accent: "var(--iw-purple)"
```

**3. `domain-views.tsx`** — Replace all `rgba()` with CSS var references:
- `rgba(66,86,171,0.04/0.06)` → `var(--iw-blue-50)`
- `rgba(66,86,171,0.12/0.15)` → `var(--iw-blue-100)`
- `rgba(220,74,74,0.10/0.25)` → `var(--iw-danger-light)` / border: `var(--iw-danger)`
- `rgba(212,136,62,0.1)` → `var(--iw-warning-light)`
- `rgba(61,139,110,0.1/0.06)` → `var(--iw-success-light)`
- Remove `${statusColor}15` opacity tricks → use light token variants

**4. `workspace-shell.tsx`** — Alert banner raw Tailwind colors:
```ts
critical: { bg: "bg-iw-danger-light", border: "border-iw-danger", text: "text-iw-danger" }
warning:  { bg: "bg-iw-warning-light", border: "border-iw-warning", text: "text-iw-warning" }
info:     { bg: "bg-iw-blue-50", border: "border-iw-blue-100", text: "text-iw-blue" }
```

**5. `top-bar.tsx`** — `bg-red-500` badge → `bg-iw-danger`

---

## Part 2 — Functional Completeness (Execute Layer)

### The IW Execution Model

Every entity card should support: **Select → See context → Act → Commit to Spine/Twin**

The pattern: clicking any entity card opens an **Action Panel** inline (right side or bottom drawer) where the user can:
- Log a note (free text, auto-tagged to entity)
- Create a task (title, due date, assign to self or Twin)
- Mark done / change status
- Assign to Twin (sends to Bench)

This is NOT a navigation away. It happens on the same surface. Local React state manages the uncommitted action. The "Commit" button would write to Spine when backend is wired — for now it updates local state visually.

---

### Per-Module Execution Fix

| Module | Primary Execute Gap | Fix |
|--------|--------------------|----|
| **Risks** | No action from risk signal | "Log Action" inline panel: write remediation plan → creates local Task + marks risk as "In Progress" |
| **Expansion** | No way to initiate conversation | "Start" button → opens mini panel: schedule meeting or draft note → creates Task assigned to Twin |
| **Meetings** | Prep items visual-only, no outcome logging | Check-off prep items (local state toggle); "Log Outcome" button on completed meetings → opens text field, saves to Notes |
| **Notes** | Read-only cards, dead "New Note" button | Click card → inline editor opens in place; New Note → creates new card with focus on edit field |
| **Team** | All static display | Click person → opens side panel with their accounts list + workload + "Assign Account" or "Send Message" (visual action confirms) |
| **Projects** | No task drill-down | Click project → expands into tasks inline (like an accordion); task rows are checkable |
| **Contacts** | Drawer exists, email/call/schedule buttons are dead | Wire drawer buttons: email → opens compose modal (text field + send action logs activity); call → shows call log form; schedule → creates meeting record |
| **Tasks** | Bulk actions (reassign, reschedule) are dead | Wire bulk reassign → user picker dropdown; bulk reschedule → date picker; both update local state |

---

### Action Panel Component (shared primitive)

Create `src/app/components/shared/action-panel.tsx`:
- Slides in from the right (or expands below on mobile)
- Props: `entity` (name, type), `onClose`, `onCommit`
- Three tabs: **Note** | **Task** | **Assign to Twin**
- Note tab: textarea + tag input
- Task tab: title, due date (date picker), priority dropdown
- Twin tab: "What should Twin handle?" textarea + Bench button
- On commit: updates parent component state (simulates Spine write)
- Shows a confirmation toast on commit using `sonner`

This panel is reused across: Risks, Expansion, Contacts, Meetings.

---

### Specific Wiring Details

**Risks → Log Action**
- "Create Action Plan" button on each risk card → opens ActionPanel
- After commit: risk card gets a green "Action Logged" badge, action count increments
- If "Assign to Twin" chosen: card gets a purple "With Twin" badge

**Expansion → Start Conversation**
- "Start" button → ActionPanel with pre-filled note: "Expansion conversation initiated for [entity]"
- After commit: opportunity card status shifts to "Active"

**Meetings → Log Outcome**
- Completed meeting cards: "Log Outcome" → opens a text area inline (no separate panel)
- After save: outcome appears on card with green checkmark, feeds into Notes

**Notes → Inline Edit**
- Click any note card → card expands to full edit mode (textarea replaces content preview)
- "Save" button confirms; "New Note" button creates a fresh empty card at top of grid, auto-focused

**Team → Person Detail**
- Click person card → right-side panel opens with: their accounts list (names + risk score), workload bar, "Reassign Account" (select account + target CSM)

**Projects → Task Accordion**
- Click project card → expands to show task rows below
- Each task row: checkbox (marks done), title, assignee, due date
- "Add Task" row at bottom → creates new task inline

**Contacts → Execute Drawer Actions**  
- Email button → `<ComposeModal>`: subject (pre-filled: "Following up — [contact name]"), body, Send button logs activity to contact's history
- Schedule button → `<MeetingModal>`: date/time picker, creates meeting record in Meetings module state
- Both write to shared local state (context or Zustand-like store pattern)

**Tasks → Wire Bulk Actions**
- "Reassign" → dropdown of team members, applies to selected task IDs
- "Reschedule" → date picker (react-day-picker is installed), updates due date on selected tasks
- State updates immediately in the filtered list

---

## Files to Create / Modify

**New files:**
- `src/app/components/shared/action-panel.tsx` — entity action panel (Note/Task/Twin tabs)
- `src/app/components/shared/compose-modal.tsx` — email compose (used by Contacts)
- `src/app/components/shared/meeting-modal.tsx` — schedule meeting (used by Contacts, Meetings)

**Modified files:**
- `src/styles/globals.css` — add 3 light tokens
- `src/app/components/sidebar.tsx` — CTX_CONFIG token fix
- `src/app/components/domains/domain-views.tsx` — rgba fix + wire Risks/Expansion/Meetings/Notes/Team/Projects actions
- `src/app/components/workspace-shell.tsx` — alert banner color fix
- `src/app/components/top-bar.tsx` — badge color fix
- `src/app/components/domains/account-success/contacts-view.tsx` — wire drawer buttons
- `src/app/components/domains/account-success/tasks-view.tsx` — wire bulk actions

---

## Execution Order

1. `globals.css` — add light tokens (2 min)
2. `sidebar.tsx` + `workspace-shell.tsx` + `top-bar.tsx` — token fixes (10 min)
3. `domain-views.tsx` — rgba fixes + all Execute layer wiring (30 min)
4. `shared/action-panel.tsx` — shared panel component (20 min)
5. `contacts-view.tsx` — wire email/schedule/call buttons (15 min)
6. `tasks-view.tsx` — wire bulk actions (10 min)

---

## Verification Test

The test is simple: can you complete these flows without navigating away?

1. Open Risks → click FinanceFlow → write remediation plan → assign to Twin → see "With Twin" badge appear
2. Open Expansion → click CloudBridge → click Start → create follow-up task → see task appear
3. Open Meetings → expand upcoming meeting → check off prep item → open completed meeting → log outcome → see it saved
4. Open Notes → click a note card → edit the text → save → see updated content
5. Open Contacts → click a contact → click Schedule → set date/time → confirm → switch to Meetings → see the new meeting appear
6. Open Tasks → select 3 overdue tasks → click Reassign → pick Priya → tasks update assignee immediately

If each flow completes with no navigation away and the state persists within the session — the Execute layer is working.
