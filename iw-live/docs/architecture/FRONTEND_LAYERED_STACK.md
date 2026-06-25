# IntegrateWise — FrontEnd Layered Stack

## Systems View × User View

**Version:** 3.7
**Date:** June 2026
**Status:** Architecture Locked

---

## Executive Summary

> **Systems View:** A Next.js SPA deployed to Cloudflare Pages, consuming a Gateway API, rendering role/department/industry-hydrated workbenches through a design-token-driven component system, with state managed via React hooks + Zustand, data fetched through SWR, and real-time updates via WebSockets (Durable Objects).

> **User View:** A calm, precise workspace that adapts to who you are. No clutter. No generic dashboards. Every view is filtered through your role, your department, your industry. The AI speaks first. The UI gets out of the way.

---

# PART I: SYSTEMS VIEW

## How the Frontend Engine Runs

---

## 1. The Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEPLOYMENT                                      │
│  Cloudflare Pages (Static + Edge Functions)                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                       │
│  │   Static    │  │   Edge      │  │   Asset     │                       │
│  │   Assets    │  │   Functions │  │   Optimization │                       │
│  │  (JS/CSS)   │  │  (API routes)│  │  (Images/Fonts)│                       │
│  └─────────────┘  └─────────────┘  └─────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUILD PIPELINE                                     │
│  Next.js 14 (App Router) → Turborepo → pnpm → Cloudflare Adapter           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   TypeScript│  │   Tailwind  │  │   Vite      │  │   Wrangler  │       │
│  │   (Strict)  │  │   CSS       │  │   (Dev)     │  │   (Deploy)  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         APP SHELL                                     │   │
│  │   Auth Guard · Header (Tenant) · Nav (Role×Dept) · Sidebar · Main     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       WORKBENCH LAYERS                              │   │
│  │  L0  OnboardingShell    → 4-step wizard (Profile/Goals/Connect/Hydrate)│   │
│  │  L1  UserWorkbench      → Role×Dept×Industry hydrated shell           │   │
│  │  L2  IntelligenceOverlay → Signals, briefs, insights panel           │   │
│  │  L3  TwinWorkbench      → Chat interface, reasoning display          │   │
│  │  L4  KnowledgeWorkbench → Memory hub, search, organizational graph   │   │
│  │  L5  OperationsWorkbench → Proposals queue, situations, triage       │   │
│  │  L6  ExecutionWorkbench  → Ready/running/audit handoff panel          │   │
│  │  L7  GovernanceWorkbench → Pending review, decided, policies         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SHARED COMPONENTS: Card · Table · Form · Modal · Toast · Chart ·     │   │
│  │  Timeline · EmptyState (honest) · LoadingSkeleton                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATE & DATA LAYER                                   │
│  Zustand (Auth/Tenant/UI/Preferences) · SWR (fetch/cache/revalidate) ·       │
│  WebSocket (DO events: signals/proposals/execution) · React Context          │
│  (ProjectionContext — Single Authority)                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DESIGN SYSTEM                                        │
│  Tokens (CSS Vars) · Components (Radix UI) · Icons (Lucide) · Layout (Grid)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Package Structure (Frontend)

```
integratewise-live/
├── apps/
│   └── web/                          # Next.js 14 SPA
│       ├── src/
│       │   ├── app/                  # App Router (layout, pages, loading)
│       │   │   ├── (auth)/         # Auth layout (login, register)
│       │   │   ├── (onboarding)/   # Onboarding layout (L0)
│       │   │   ├── (workspace)/    # Workspace layout (L1-L7)
│       │   │   │   ├── engineering/# Engineering workbench (L1 build)
│       │   │   │   ├── sales/      # Sales workbench (L1 grow)
│       │   │   │   ├── operations/ # Operations workbench (L1 run)
│       │   │   │   ├── twin/       # Twin interface (L3)
│       │   │   │   ├── memory/     # Memory hub (L4)
│       │   │   │   ├── proposals/  # Proposals queue (L5)
│       │   │   │   ├── execution/  # Execution panel (L6)
│       │   │   │   └── governance/ # Governance dashboard (L7)
│       │   │   ├── api/            # Edge API routes (proxy to Gateway)
│       │   │   └── layout.tsx      # Root layout with auth guard
│       │   ├── components/         # app-shell / workbench / shared / twin / onboarding
│       │   ├── hooks/              # useAuth / useProjection / useTenant / useTwin / ...
│       │   ├── stores/             # authStore / uiStore / projectionStore / twinStore
│       │   ├── lib/                # api (SWR) / websocket / validators / constants
│       │   └── types/              # api / projection / twin / workbench
│       ├── tailwind.config.ts
│       ├── next.config.js
│       └── wrangler.toml
│
├── packages/
│   ├── design-tokens/              # THE source of truth (colors/typography/spacing/radii/shadows)
│   ├── shared-types/               # Cross-package TypeScript (spine/projection/api)
│   └── ui-components/              # primitives / composed / patterns
│
└── turbo.json
```

---

## 3. The Design Token System

### 3.1 Color Palette

```typescript
export const COLORS = {
  primary: { blue: "#4356A9", navy: "#232D42", pink: "#EB4F72" },
  background: {
    base: "#EDEEF0",
    card: "#FFFFFF",
    elevated: "#F8F9FA",
    overlay: "rgba(35, 45, 66, 0.08)",
  },
  text: { primary: "#232D42", secondary: "#5A6578", tertiary: "#8B95A5", inverse: "#FFFFFF" },
  semantic: { success: "#22C55E", warning: "#F59E0B", error: "#EF4444", info: "#3B82F6" },
  department: {
    engineering: { accent: "#4356A9", bg: "#F0F4FF" },
    sales: { accent: "#EB4F72", bg: "#FEF2F2" },
    operations: { accent: "#232D42", bg: "#F1F5F9" },
    cross: { accent: "#8B5CF6", bg: "#F5F3FF" },
  },
  connector: {
    connected: "#22C55E",
    connecting: "#F59E0B",
    disconnected: "#8B95A5",
    error: "#EF4444",
  },
} as const;
```

### 3.2 Typography

```typescript
export const TYPOGRAPHY = {
  fontFamily: {
    sans: "Inter, system-ui, sans-serif",
    display: "Poppins, Inter, sans-serif",
    mono: "IBM Plex Mono, monospace",
  },
  scale: {
    "2xs": "0.625rem",
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  weight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeight: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
} as const;
```

### 3.3 Spacing, Radii, Shadows

```typescript
// 4px base grid; layout: maxWidth 1440px, sidebar 280px, header 64px, gutter 24px
// radii: sm 4px (inputs) · md 8px (cards) · lg 12px (panels) · xl 16px (hero) · full 9999px (pills)
// shadows: FLAT — no 3D, no gradients. sm/md/lg subtle elevation + focus ring (primary blue)
```

---

## 4. Component Architecture

### 4.1 The Three Tiers

```
TIER 3: PATTERNS    → EmptyState (honest) · DataTable · FormBuilder · OnboardingStepWizard ·
                      ProposalReviewCard · ExecutionTimeline
TIER 2: COMPOSITES  → Card · Modal · Toast · Tabs · Breadcrumb · Dropdown · Pagination · Tooltip · Badge
TIER 1: PRIMITIVES  → Button · Input · Select · Avatar · Switch · Textarea · Checkbox · Radio · Label
                      (Radix UI base + design tokens)
```

### 4.2 The Empty State Rule

Every data-dependent component has an honest empty state. No fabricated data. No placeholder charts.

```tsx
<EmptyState
  icon={<GitHubIcon />}
  title="No engineering data yet"
  description="Connect GitHub to see repository health, pull requests, and team activity."
  action={<Button onClick={openConnectorTray}>Connect GitHub</Button>}
  secondary="It takes about 2 hours to load your first data."
/>
```

### 4.3 The Loading State Rule

Skeleton screens, not spinners. Skeletons match the final layout.

```tsx
<TableSkeleton rows={5} columns={["Repository", "Status", "Last Activity", "Health"]} />
```

---

## 5. State Management

### 5.1 The Single Authority (ProjectionContext)

```typescript
// stores/projectionStore.ts — one role/department/industry value, set once per session
interface ProjectionState {
  role: string | null;
  department: string | null;
  industry: string | null;
  depthMatrix: DepthMatrix | null;
  twinTier: string | null;
  entitlements: string[];
  setProjection: (context: ProjectionContext) => void;
  clearProjection: () => void;
}
```

### 5.2 The Single Authority Hook

```typescript
// hooks/useProjection.ts — fetch /api/v1/workspace/profile ONCE, dedupe 1h, no focus revalidate
export function useProjection() {
  const { role, department, industry, setProjection } = useProjectionStore();
  const { data, error } = useSWR("/api/v1/workspace/profile", apiFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 3600000,
  });
  useEffect(() => {
    if (data?.projection) setProjection(data.projection);
  }, [data, setProjection]);
  return { role, department, industry, isLoading: !data && !error };
}
```

### 5.3 Tenant-Scoped Data Fetching

```typescript
// lib/api.ts — every request carries Bearer token + X-Tenant-ID to the Gateway
export const apiFetcher = async (url: string) => {
  const token = useAuthStore.getState().token;
  const tenant = useAuthStore.getState().tenantId;
  const res = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": tenant,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};
```

---

## 6. Data Fetching Strategy

### 6.1 SWR Configuration

Stale-while-revalidate: show cached data immediately, refresh in background. No polling by default.
Revalidate on focus + reconnect. Dedupe within 2s. Retry failed requests 3×. Tenant-scoped cache key.

### 6.2 Real-Time Updates (WebSocket)

```typescript
// lib/websocket.ts — connect to the tenant Durable Object; invalidate SWR caches on push
this.ws = new WebSocket(`wss://gateway.integratewise.ai/ws/${tenantId}?token=${token}`);
// signal:new → mutate('/api/v1/signals') + toast
// proposal:created → mutate('/api/v1/proposals') + toast
// execution:completed → mutate('/api/v1/executions') + toast.success
// memory:promoted → mutate('/api/v1/memory')
```

---

## 7. The Gateway Proxy Pattern

The frontend never calls external APIs directly. All requests go through the Gateway.

```
Frontend SPA (Pages) → /api/v1/* Edge Routes → Cloudflare Gateway Worker → Internal Services → D1 / Queues / DO / Vectorize
```

| Without Proxy                   | With Proxy                  |
| ------------------------------- | --------------------------- |
| CORS issues                     | No CORS (same origin)       |
| Token exposed in browser        | Token in edge function only |
| Direct service URLs in frontend | Single Gateway URL          |
| No request logging              | Centralized audit log       |
| No rate limiting                | Gateway-enforced quotas     |

---

## 8. Authentication Flow

```
User Login → Auth Service (Worker) → JWT (RS256) + Refresh Token
  → httpOnly secure sameSite=strict cookies
Every Request: Edge Function reads cookie → validates JWT → adds X-Tenant-ID → proxies to Gateway
Token Refresh (silent): 401 → Edge Function uses refresh token → new JWT → retries → user never sees logout
```

---

## 9. Build & Deploy Pipeline

```
Developer Push → GitHub Actions
  1. Typecheck (tsc --noEmit)
  2. Lint (eslint + prettier)
  3. Unit Tests (vitest)
  4. Build (next build)
  5. E2E Tests (Playwright)
  6. Deploy to Cloudflare Pages (wrangler)
→ Cloudflare Pages → Global Edge (300+ locations)
```

```bash
# .env.local (development)
NEXT_PUBLIC_GATEWAY_URL=https://gateway.integratewise.ai
NEXT_PUBLIC_WS_URL=wss://gateway.integratewise.ai/ws
NEXT_PUBLIC_APP_VERSION=3.7.0
```

---

# PART II: USER VIEW

## How People See and Interact

---

## 1. The Visual Philosophy

> **"Calm, precise intelligence plumbing for complex enterprise stacks."**

| Principle        | What It Means                                          | What It Rejects                                         |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| **Calm**         | Low cognitive load. Whitespace. Breathing room.        | Dense dashboards, information overload, alert fatigue   |
| **Precise**      | Every pixel has purpose. No decoration.                | Gradients, 3D effects, heavy shadows, ornamental icons  |
| **Intelligence** | The UI reveals insight, not just data.                 | Raw tables, unprocessed metrics, disconnected numbers   |
| **Plumbing**     | The infrastructure is invisible. The value is visible. | Technical jargon, implementation details, system status |

```
✅ Flat vectors (no gradients)        ✅ Grid-aligned diagrams
✅ Simple lines and nodes (no 3D)     ✅ Minimal whitespace (no clutter)
✅ Rounded rectangles                  ✅ Inter + Poppins + IBM Plex Mono
✅ #4356A9 blue, #232D42 navy, #EB4F72 pink (no rainbow palettes)
```

---

## 2. The App Shell

- **Header (always visible):** Logo · Command-K global search · Signals badge · Profile + tenant · Settings
- **Navigation (Role × Department):** filtered by role; the user's department is expanded + highlighted
- **Sidebar (contextual):** adapts to the active workbench (repos+filters in Engineering, pipelines+stages in Sales)

---

## 3. The Workbench Layers (L1–L7)

- **L1 User Workbench (shell):** cards with counts + actions (no raw tables on overview); human-readable signals; "last updated" timestamp; honest empty states.
- **L2 Intelligence Overlay (brief):** department-grouped morning brief panel; each item has a clear action/dismiss; the brief IS the summary.
- **L3 Twin Workbench:** Twin speaks first; every answer has sources; proposals embedded in chat; sources link to Spine entities ("Sources: GitHub (build_data) — last synced 2 min ago").
- **L4 Knowledge Workbench (Memory):** searchable (not browsable); scope visible (org/team/personal); confidence score transparent; evidence linked; "Formed: X ago" shows compounding.
- **L5 Operations Workbench (Proposals):** proposals as cards; reasoning visible; evidence linked; 5 actions (Approve/Reject/Modify/Delegate/Schedule); no auto-execute, no "approve all".
- **L6 Execution Workbench (Monitor):** running executions prominent; each links to the external tool; completed collapsed; failed highlighted + auditable.
- **L7 Governance Workbench (Audit):** decisions countable/trendable; policies visible+editable; audit trail exportable; every decision links back to the proposal.

---

## 4. The Onboarding Experience (L0)

4 steps, not 10. Role/department/industry as visual cards. Connector tray scored and limited to 5.
Progress is honest (no fabricated completion). "You can start exploring" — the user is never blocked.

```
Step 1 Welcome → Step 2 Identity (Role/Dept/Industry) → Step 3 Goals →
Step 4 Connectors (5 recommended, OAuth via Nango) → Step 5 Hydration (honest progress) → Workspace
```

---

# PART III: THE BRIDGE

## How Frontend Enables the User Experience

| User Action        | Frontend System                          | Backend Call                               | Technology             |
| ------------------ | ---------------------------------------- | ------------------------------------------ | ---------------------- |
| "Log in"           | Auth Guard → Zustand authStore           | POST /api/v1/auth/login                    | JWT, Cloudflare Access |
| "Select role"      | Onboarding Step Wizard → projectionStore | POST /api/v1/workspace/initialize          | Gateway → D1           |
| "Connect GitHub"   | Connector Tray → OAuth popup             | Nango OAuth → Token vault                  | Nango, Gateway         |
| "See workspace"    | useProjection() → SWR → Layout render    | GET /api/v1/workspace/profile              | SWR, D1                |
| "Ask Twin"         | Chat Input → useTwin() → WebSocket       | POST /api/v1/twin/chat → DO Session        | WebSocket, Workers AI  |
| "Get brief"        | Brief Panel → SWR revalidate             | GET /api/v1/twin/brief                     | SWR, D1                |
| "Approve proposal" | Proposal Card → Button → Toast           | POST /api/v1/proposals/:id/approve → Queue | Queue, Governance DO   |
| "View execution"   | Execution Timeline → SWR                 | GET /api/v1/executions                     | SWR, D1                |
| "Search memory"    | Memory Search → Vectorize query          | GET /api/v1/memory?q=                      | Vectorize, D1          |
| "Get signal"       | WebSocket push → Toast                   | DO Event → WebSocket                       | DO, WebSocket          |

---

## The Frontend Promise

> **Systems View:** Every user action flows through a typed, cached, real-time pipeline. State is predictable. Data is tenant-scoped. UI is token-driven. No direct API calls. No unvalidated state.

> **User View:** The interface adapts to who I am. It loads fast. It updates in real-time. It never lies about data freshness. It never shows fabricated data. It gets out of the way so I can work.

> **The Bridge:** The same design system that makes the UI calm and precise (flat vectors, rounded rectangles, honest empty states) is what makes the frontend architecture maintainable and predictable (design tokens, component tiers, single authority).

---

_This document is the canonical frontend architecture of IntegrateWise v3.7. It specifies both the engine (Systems View) and the experience (User View), with the bridge between them._

---

## Appendix: Doc ↔ Code Reconciliation (as of 2026-06-15)

> This doc is the **canonical/target** frontend architecture. Reconcile these deltas with the
> running code over time rather than treating them as drift.

- **Framework:** `apps/web` currently builds as a **Vite + React SPA** (`import.meta.env.VITE_*`,
  `pnpm run dev`), not Next.js App Router. Update whichever is authoritative.
- **Auth token transport:** the running app stores the gateway RS256 JWT in `localStorage` (`iw_at`)
  and sends it as a `Bearer` header (see `apps/web/src/lib/auth-manager.ts`); this doc's httpOnly-cookie
  model is the target.
- **Gateway base URL:** dev points at `gateway.dev.integratewise.ai` via `apps/web/.env.local`.
- **Onboarding flow** matches `OnboardingFlow.tsx` (Welcome → Profile → Goals → Connectors → AILoader →
  WorkplaceLoading → workspace).
