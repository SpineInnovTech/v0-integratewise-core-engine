# UI Defect & Reorganization Plan

> Complete list of every UI defect, duplicate, and missing feature.
> This is the checklist. Nothing gets built until this is agreed.

---

## PHASE 1: DELETE DEAD CODE (~50 files)

These files are not imported by the active flow. Deleting them has zero risk.

### 1.1 Dead Workspace Shells (5 files)

| File                                       | Why dead                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `l1/workspace-shell.tsx`                   | Old shell with CTX switcher and DEMO_ALERTS. AppShell uses `workspace-shell-new.tsx` |
| `l1/shell/UnifiedShell.tsx`                | Another shell attempt. Not imported.                                                 |
| `l1/shell/IntelligencePanel.tsx`           | Part of old shell. Not imported.                                                     |
| `l1/shell/MainSidebar.tsx`                 | Part of old shell. Not imported.                                                     |
| `l1/shell/TopBar.tsx`                      | Part of old shell. Not imported.                                                     |
| `l1/DashboardShell.tsx`                    | Dead dashboard shell. Not imported.                                                  |
| `common/layouts/os-shell.tsx`              | Dead shell. Not imported.                                                            |
| `common/layouts/unified-shell.tsx`         | Dead shell. Not imported.                                                            |
| `common/layouts/app-shell.tsx`             | Dead shell. Not imported.                                                            |
| `common/layouts/unified-page-template.tsx` | Dead template. Not imported.                                                         |

### 1.2 Dead Sidebars (4 files)

| File                               | Why dead                                                              |
| ---------------------------------- | --------------------------------------------------------------------- |
| `l1/sidebar.tsx`                   | Old sidebar with CTX_CONFIG. workspace-shell-new has its own sidebar. |
| `l1/navigation/sidebar.tsx`        | Duplicate sidebar.                                                    |
| `common/layouts/ctx-sidebar.tsx`   | Old CTX sidebar.                                                      |
| `common/layouts/smart-sidebar.tsx` | Another sidebar attempt.                                              |

### 1.3 Dead Top Bars (3 files)

| File                         | Why dead                                      |
| ---------------------------- | --------------------------------------------- |
| `l1/top-bar.tsx`             | Old top bar. workspace-shell-new has its own. |
| `l1/navigation/top-bar.tsx`  | Duplicate.                                    |
| `common/layouts/top-bar.tsx` | Duplicate.                                    |

### 1.4 Dead Command Palette (1 file)

| File                     | Why dead                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `l1/command-palette.tsx` | Standalone file. workspace-shell-new imports from `l1/command-palette/index.tsx` OR its own inline. Verify which one is used, delete the other. |

### 1.5 Dead Intelligence Overlays (3 files)

| File                                       | Why dead                                                            |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `l2/intelligence-drawer.tsx`               | Old drawer. workspace-shell-new uses `intelligence-overlay-new.tsx` |
| `l2/intelligence/intelligence-drawer.tsx`  | Duplicate in subfolder.                                             |
| `l2/intelligence/intelligence-overlay.tsx` | Old overlay.                                                        |

### 1.6 Dead Legacy Folder (entire folder)

| Folder                  | Why dead                                                     |
| ----------------------- | ------------------------------------------------------------ |
| `legacy/legacy-engine/` | Old AI chat, loader, persona assessment. Not imported.       |
| `legacy/os/`            | Old action bar, evidence drawer, signal strip. Not imported. |
| `legacy/website/`       | Old website components. Not imported.                        |

### 1.7 Dead Personal Folder

| Folder         | Why dead                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `l1/personal/` | Old personal views (accounts, analytics, calendar, contacts, docs, etc.). Domain views live in `l1/domains/personal/`. This folder is orphaned. |

### 1.8 Duplicate Onboarding Flow

| File                                        | Action                                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `activation/onboarding/onboarding-flow.tsx` | Check if this is the same as `OnboardingFlow.tsx` (case difference). On macOS they're the same file. On Linux they'd conflict. Delete one. |

### 1.9 Duplicate Module Registry

| File                                                        | Action                                                                                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activation/onboarding/role-domain/business-ops/modules.ts` | This is imported as `genericModules` in content-router. It provides shared views (calendar, integrations, AI chat, etc.). Rename folder to `shared` or merge into bizops. |

### 1.10 Duplicate Knowledge Pages

| File                          | Duplicate of              |
| ----------------------------- | ------------------------- |
| `l2/knowledge/InboxPage.tsx`  | Same as `inbox-view.tsx`  |
| `l2/knowledge/SearchPage.tsx` | Same as `search-view.tsx` |
| `l2/knowledge/TopicsPage.tsx` | Same as `topics-view.tsx` |
| `l2/knowledge/DemoPage.tsx`   | Demo only — delete        |
| `l2/knowledge/demo-setup.tsx` | Demo only — delete        |

### 1.11 Orphan View Subfolders in l1/views/

| Folder                | Overlaps with                 |
| --------------------- | ----------------------------- |
| `l1/views/act/`       | `l2/approvals/`               |
| `l1/views/admin/`     | `l1/admin/`                   |
| `l1/views/cs/`        | `l1/domains/account-success/` |
| `l1/views/entity/`    | `l1/views/Entity360View.tsx`  |
| `l1/views/finance/`   | `l1/domains/finance/`         |
| `l1/views/marketing/` | `l1/domains/marketing/`       |
| `l1/views/projects/`  | `l1/domains/bizops/`          |
| `l1/views/shared/`    | `common/shared/`              |
| `l1/views/stubs/`     | Placeholder views             |

Action: Verify none are imported. If not imported, delete.

---

## PHASE 2: FIX ACTIVE CODE DEFECTS

### 2.1 Domain Switcher Shows All Domains for Business Users

**File:** `l1/workspace/workspace-shell-new.tsx` (~line 460)
**Problem:** When `useCase === "business"`, dropdown shows hardcoded list: SALES, MARKETING, CUSTOMER_SUCCESS, REVOPS, BIZOPS.
**Fix:** Show only Personal + user's primary domain. Remove the business multi-domain dropdown entirely. BizOps users get cross-department access via BizOps modules (prefixed views like `sales--pipeline`), not via a domain switcher.

### 2.2 Entity 360 View Uses Mock Data

**File:** `l1/views/Entity360View.tsx`
**Problem:** 100% hardcoded mock data. Not connected to Entity 360 API.
**Fix:** Rewrite to call `GET /api/v1/cognitive/twin/360/:entityId`. Show 6 layers (truth, context, signals, memory, goals, relationships) + Twin insights with trust panel.

### 2.3 Command Palette Has No Real Search

**File:** `l1/command-palette.tsx` or `l1/command-palette/index.tsx`
**Problem:** Command items are static/hardcoded. No entity search.
**Fix:** Wire to `/api/v1/workspace/entities?search=` for live entity search. Results link to Entity 360 view.

### 2.4 Notification System Not Wired

**File:** `l1/workspace/workspace-shell-new.tsx`
**Problem:** Bell icon exists in top bar but no notification data. Old shell had DEMO_ALERTS (hardcoded).
**Fix:** Wire to Twin insights API. Badge count = active critical/high insights for user's entities.

### 2.5 No Entity Browser

**Problem:** No universal "all entities" view with search across accounts, contacts, deals, tickets.
**Fix:** Build `domains/_shared/entity-browser.tsx`. Search bar + entity type filter + health filter + click-through to Entity 360.

### 2.6 No Click-Through from Entity Lists to Entity 360

**Problem:** `accounts-view.tsx` has a detail drawer but no "Open Entity 360" button. Same for contacts, deals, tickets in all domains.
**Fix:** Add "View 360" button/link in every entity list row and detail drawer. Navigate to Entity 360 view with entity ID.

### 2.7 Empty Dashboard on First Login

**Problem:** After connecting first tool, creamy load runs in background. Dashboard is empty until data arrives.
**Fix:** Loader needs "priority fetch" mode — grab first 5 records immediately (sorted by last_modified desc), then continue full sync. Dashboard shows real data within 15 seconds.

### 2.8 Twin Knowledge Surfaces Use Dark Theme

**Problem:** `l2/knowledge/inbox-view.tsx`, `search-view.tsx`, `topics-view.tsx` use dark slate theme (bg-slate-800). Rest of app is light.
**Fix:** Retheme to match app's light theme (bg-white, text-[#072145], borders-[#E8ECF2]).

---

## PHASE 3: BUILD MISSING FEATURES

### 3.1 Triage Inbox (Approval-Based Personal Memory UI)

**What:** UI for reviewing pending AI-generated content before it enters the knowledge base.
**Backend:** `/v1/triage/results` (pending items), `/v1/triage/approved` (approved items)
**Features:**

- List of pending triage items with: AI source, content preview, confidence score, extracted entities
- Approve / Reject / Edit buttons per item
- Bulk approve for high-confidence items
- Filter by source (Claude, GPT, MCP, etc.)
- Shows what was auto-approved vs human-reviewed

### 3.2 Memory Browser

**What:** Browse all verified memories (the approved knowledge base).
**Backend:** `/v1/knowledge/memories`, `/v1/memories?entity_id=X`
**Features:**

- List of memories with: type (decision/preference/insight/action/rule/fact), content, confidence, source AI, created date
- Filter by type, entity, confidence level
- Search across memories
- Confirm / Revoke buttons (revoke removes from active knowledge)
- Shows which entity each memory is linked to

### 3.3 Entity-Linked Knowledge View

**What:** When viewing Entity 360, the Context and Memory tabs pull real data.
**Backend:** `/v1/context/:entityId`, `/v1/memories?entity_id=X`
**Features:**

- Context tab: emails, docs, meetings linked to this entity
- Memory tab: AI memories about this entity with confidence scores
- Integrated into Entity 360 view

### 3.4 Knowledge Hub (unified entry point)

**What:** Single page with tabs: Sessions | Memories | Triage | Topics | Search
**Replaces:** The separate inbox-view, topics-view, search-view pages
**Added:** Triage tab, Memories tab
**Wired into:** Sidebar under every domain as "Knowledge" module

---

## PHASE 4: REORGANIZE FOLDER STRUCTURE

After phases 1-3, reorganize to the clean structure:

```
components/
├── auth/
├── onboarding/
├── workspace/          (shell, sidebar, top-bar, command-palette, content-router)
├── personal/           (personal workspace views)
├── domains/            (12 domain folders, each with modules.ts)
│   └── _shared/        (entity-browser, entity-360, integrations, settings, knowledge-hub)
├── intelligence/       (L2 overlay, panels, ai-chat)
├── hydration/          (fabric engine, providers, hooks)
├── ui/                 (shadcn primitives)
└── brand/              (logo)
```

This is a rename/move operation. Use `smartRelocate` to update imports automatically.

---

## EXECUTION ORDER

| Step | What                                                   | Risk                       | Time    |
| ---- | ------------------------------------------------------ | -------------------------- | ------- |
| 1    | Delete dead shells, sidebars, top bars (Phase 1.1-1.5) | Zero — not imported        | 30 min  |
| 2    | Delete legacy folder (Phase 1.6)                       | Zero — not imported        | 5 min   |
| 3    | Delete duplicate knowledge pages (Phase 1.10)          | Zero — duplicates          | 10 min  |
| 4    | Fix domain switcher (Phase 2.1)                        | Low — UI change only       | 30 min  |
| 5    | Rewrite Entity 360 View (Phase 2.2)                    | Medium — new component     | 2 hours |
| 6    | Wire command palette search (Phase 2.3)                | Low — API call             | 1 hour  |
| 7    | Wire notifications (Phase 2.4)                         | Low — API call             | 1 hour  |
| 8    | Build Entity Browser (Phase 2.5)                       | Medium — new component     | 2 hours |
| 9    | Add Entity 360 click-through (Phase 2.6)               | Low — add buttons          | 1 hour  |
| 10   | Build Triage Inbox (Phase 3.1)                         | Medium — new component     | 2 hours |
| 11   | Build Memory Browser (Phase 3.2)                       | Medium — new component     | 2 hours |
| 12   | Retheme Twin knowledge surfaces (Phase 2.8)            | Low — CSS only             | 1 hour  |
| 13   | Build Knowledge Hub (Phase 3.4)                        | Medium — combines existing | 1 hour  |
| 14   | Folder reorganization (Phase 4)                        | High — many file moves     | 3 hours |

Total: ~17 hours of work. Phases 1-3 can be done without Phase 4 (reorganization can happen later).

---

## VERIFICATION

After all phases, verify:

1. `pnpm typecheck` — 31/31
2. `pnpm test` — 14/15 (integration tests need live servers)
3. Login → Onboarding → Workspace renders correctly
4. Sidebar shows only WORK (domain) + PERSONAL
5. Entity lists have "View 360" click-through
6. Entity 360 shows real data from API
7. Command palette searches real entities
8. Knowledge Hub shows Sessions, Memories, Triage, Topics, Search
9. Triage Inbox shows pending AI content with approve/reject
10. No dark-themed pages in the light-themed app
