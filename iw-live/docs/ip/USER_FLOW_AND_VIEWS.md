# USER FLOW AND VIEW ARCHITECTURE

**IntegrateWise Complete User Journey**  
_From Login → Workspace → Entity 360 → AI Actions_

---

## 🎯 COMPLETE USER JOURNEY

```
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 0: AUTHENTICATION                                             │
│ Entry: app.integratewise.ai                                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LOGIN / SIGNUP                                                      │
│ Location: /app (redirects to login if not authenticated)           │
│                                                                     │
│ Options:                                                            │
│   • Email/Password                                                  │
│   • Google SSO (OAuth)                                              │
│   • GitHub SSO (OAuth)                                              │
│                                                                     │
│ Auth Provider: Spine DB PKCE                                        │
│ Session: JWT stored in browser, refreshed automatically            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 1: ONBOARDING (New Users Only)                                │
│ Component: OnboardingFlow.tsx                                       │
│ 4 Steps → ~2 minutes                                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ STEP 1        │   │ STEP 2           │   │ STEP 3           │
│ Welcome       │   │ Profile          │   │ Goals            │
│ (~15s)        │   │ (~30s)           │   │ (~25s)           │
│               │   │                  │   │                  │
│ Choose:       │   │ Select:          │   │ Define:          │
│ • Personal    │   │ • Industry       │   │ • Goal           │
│ • Work        │   │ • Department     │   │ • Workspace Name │
│ • Business    │   │ • Company Size   │   │ • Workspace Type │
│               │   │                  │   │                  │
│ → Determines  │   │ → Triggers       │   │ → Creates        │
│   workspace   │   │   Spine schema   │   │   workspace      │
│   type        │   │   initialization │   │   context        │
└───────────────┘   └──────────────────┘   └──────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: CONNECTORS (~45s)                                           │
│                                                                     │
│ Connect Data Sources:                                               │
│   • CRM (HubSpot, Salesforce)                                       │
│   • Task Management (Asana, Jira)                                   │
│   • Workspace (Slack, Teams)                                        │
│   • Email (Gmail, Outlook)                                          │
│   • Analytics (Google Analytics)                                    │
│                                                                     │
│ Flow Types:                                                         │
│   Flow A: OAuth → Loader → Normalizer → Spine (structured data)    │
│   Flow B: Upload → Knowledge → Embeddings (documents)               │
│   Flow C: AI Chat → Triage Bot → Memory (conversations)            │
│                                                                     │
│ → Triggers:                                                         │
│   1. OAuth authorization (redirect to provider)                     │
│   2. Callback → Store encrypted tokens                              │
│   3. Creamy Layer sync (100 records, schema-driven)                 │
│   4. Background sync (full data, queued)                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 2: WORKSPACE (Authenticated Users)                            │
│ Component: WorkspaceShellNew.tsx                                    │
│ Layout: Sidebar + Header + Content + L2 Drawer (hidden)            │
└─────────────────────────────────────────────────────────────────────┘

---

## 🏗️ WORKSPACE ARCHITECTURE

### **Layout Structure**

```

┌────────────────────────────────────────────────────────────────────┐
│ HEADER (Fixed Top) │
│ ┌──────────────┬─────────────────────────────────┬──────────────┐ │
│ │ Logo │ Search (⌘K) │ Notifications│ │
│ │ IntegrateWise│ │ User Menu │ │
│ └──────────────┴─────────────────────────────────┴──────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────┬─────────────────────────────────────────────────────┐│
│ │ │ CONTENT AREA (Dynamic) ││
│ │ SIDEBAR │ ││
│ │ (260px) │ Rendered by ContentRouter based on: ││
│ │ │ • Active View (Personal / Work) ││
│ │ ┌──────┐ │ • Active Domain (CS / Sales / RevOps / etc.) ││
│ │ │Domain│ │ • Module ID (dashboard / accounts / tasks) ││
│ │ │Select│ │ ││
│ │ └──────┘ │ Lazy-loaded modules with: ││
│ │ │ • Error boundaries ││
│ │ Nav: │ • Loading skeletons ││
│ │ • Home │ • Density gating (hide if no data) ││
│ │ • Accts │ • Projection-based entitlement ││
│ │ • Tasks │ ││
│ │ • Docs │ ││
│ │ • ... │ ││
│ │ │ ││
│ │ System: │ ││
│ │ • Integr │ ││
│ │ • AI │ ││
│ │ • Settings ││
│ └──────────┴─────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────┘
│ L2 COGNITIVE DRAWER (Hidden by default, opens on ⌘J or event) │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Think | Triage | Signals | Approvals | Twin | Policies │ │
│ └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘

```

---

## 📂 VIEW HIERARCHY

### **Two Primary Views**

```

WORKSPACE
├── PERSONAL VIEW (Same for everyone)
│ ├── Dashboard (hub-home)
│ ├── Today (hub-today)
│ ├── Calendar
│ ├── Tasks
│ ├── Notes
│ ├── Documents
│ ├── Knowledge Hub
│ └── Settings
│
└── WORK VIEW (Domain-specific)
├── CUSTOMER SUCCESS (Account Success)
│ ├── Dashboard
│ ├── Accounts
│ ├── Contacts
│ ├── Health Scores
│ ├── Meetings
│ ├── Tasks
│ ├── Touchpoints
│ ├── Expansion
│ ├── Renewals
│ ├── Risks
│ ├── At-Risk
│ ├── Decision Log
│ ├── Docs
│ ├── Analytics
│ ├── Workflows
│ └── Integrations
│
├── SALES
│ ├── Dashboard
│ ├── Pipeline
│ ├── Deals
│ ├── Contacts
│ ├── Activities
│ ├── Forecasting
│ ├── Quotes
│ └── Analytics
│
├── MARKETING
│ ├── Dashboard
│ ├── Campaigns
│ ├── Leads
│ ├── Email Studio
│ ├── Social
│ ├── Attribution
│ ├── Forms
│ └── Analytics
│
├── REVOPS
│ ├── Dashboard
│ ├── Pipeline
│ ├── Forecasting
│ ├── Quotas
│ ├── Analytics
│ ├── Cohorts
│ └── Team
│
├── PRODUCT_ENGINEERING
│ ├── Dashboard
│ ├── Roadmap
│ ├── Features
│ ├── Bugs
│ ├── Sprints
│ ├── Tasks
│ └── Releases
│
├── FINANCE
│ ├── Dashboard
│ ├── Revenue
│ ├── Expenses
│ ├── Reports
│ ├── Forecasting
│ ├── Budget
│ └── Invoice Approvals
│
├── SERVICE
│ ├── Dashboard
│ ├── SLA Dashboard
│ ├── Tickets
│ ├── Customers
│ ├── Knowledge
│ └── Analytics
│
├── PROCUREMENT
│ ├── Dashboard
│ ├── Renewals
│ ├── Vendors
│ ├── Orders
│ ├── Contracts
│ └── Spend
│
├── IT_ADMIN
│ ├── Dashboard
│ ├── Systems
│ ├── Incidents
│ ├── Vulnerabilities
│ └── Licenses
│
└── BIZOPS (Super-domain with cross-department access)
├── Dashboard
├── Ops Command Center
├── Strategic Hub
├── Metrics
├── CRM
├── Sales Hub
├── Clients
├── Projects
├── Workflows
├── Analytics
├── Accounts
├── Tasks
├── Docs
├── Calendar
├── Integrations
├── Workflow Canvas
├── CEO Dashboard
├── COO Dashboard
├── CIO/CTO Dashboard
├── Strategy & Leadership
├── Operations Center
├── Human Resources
├── Legal & Compliance
├── Business Intelligence
├── Partnerships
├── Knowledge Management
└── Cross-Department Views (sales--, cs--, marketing--, etc.)

````

---

## 🎨 CONTENT ROUTING

### **ContentRouter.tsx**

**Purpose**: Lazy-load domain-specific modules based on active view + module ID

**Flow**:
```typescript
1. User clicks "Accounts" in sidebar
   ↓
2. handleNavigate("/work/accounts")
   ↓
3. setActivePath("/work/accounts")
   ↓
4. Extract moduleId: "accounts"
   ↓
5. ContentRouter receives:
   - domain: "CUSTOMER_SUCCESS"
   - moduleId: "accounts"
   ↓
6. Lookup in DOMAIN_CONTENT_MAP:
   CS_MAP["accounts"] → () => import("...modules/accounts")
   ↓
7. Lazy load component with:
   - Error boundary (catches load failures)
   - Suspense (shows loading skeleton)
   - Density gating (hide if no data)
   - Projection entitlement (hide if not allowed)
   ↓
8. Render <AccountsView />
````

**Module Registry** (from content-router.tsx):

```typescript
const CS_MAP: Record<string, () => Promise<any>> = {
  dashboard: csModules.dashboard,
  accounts: csModules.accounts,
  contacts: csModules.contacts,
  "health-scores": csModules.healthScores,
  meetings: csModules.meetings,
  tasks: csModules.tasks,
  // ... 40+ modules
};

const DOMAIN_CONTENT_MAP: Record<Domain, Record<string, () => Promise<any>>> = {
  CUSTOMER_SUCCESS: CS_MAP,
  SALES: SALES_MAP,
  MARKETING: MARKETING_MAP,
  REVOPS: REVOPS_MAP,
  PRODUCT_ENGINEERING: PE_MAP,
  FINANCE: FINANCE_MAP,
  SERVICE: SERVICE_MAP,
  PROCUREMENT: PROCUREMENT_MAP,
  IT_ADMIN: IT_ADMIN_MAP,
  STUDENT_TEACHER: STUDENT_TEACHER_MAP,
  BIZOPS: buildBizOpsMap(), // 100+ modules (own + cross-dept)
  PERSONAL: PERSONAL_MAP,
};
```

---

## 🔍 COMMAND PALETTE (⌘K)

**Component**: `CommandPalette.tsx`

**Features**:

- **Live Entity Search**: Type 3+ chars → searches Spine entities
- **Quick Actions**: Create Account, Add Integration, Create Deal
- **Deep Dives**: Jump to any domain workspace
- **Module Navigation**: Jump to any view
- **Recent Items**: Accounts, Contacts, Documents

**Categories**:

1. **Quick Actions** (Create, Add, Open)
2. **Deep Dives** (RevOps, CS, Sales, Marketing, Product, BizOps, Finance, Personal)
3. **Account Success** (Health, Team, Tasks)
4. **Core Modules** (Home, Accounts, Contacts, Tasks, Calendar, Docs, Meetings, Projects, Team, Analytics, Workflows)
5. **Sales** (Pipeline, Deals, Forecasting, Activities, Quotes)
6. **Marketing** (Campaigns, Email Studio, Social, Attribution, Forms)
7. **Website & CMS** (Website, Blog, SEO, Pages, Media, Theme)
8. **Admin & Governance** (User Management, RBAC, Approvals)
9. **System** (Integrations, AI Chat, Settings, Subscriptions, Profile)
10. **Entities** (Live search results from Spine)
11. **Accounts** (Quick access to recent accounts)
12. **Contacts** (Quick access to recent contacts)
13. **Documents** (Quick access to recent docs)

**Keyboard Shortcuts**:

- `⌘K` / `Ctrl+K`: Open palette
- `↑↓`: Navigate
- `Enter`: Select
- `Esc`: Close

---

## 🧠 L2 COGNITIVE LAYER

**Component**: `L2DrawerProvider` + Cognitive Panels

**Trigger Events**:

- `⌘J`: Open AI Chat
- `iw:evidence:open`: Open evidence panel
- `iw:cognitive:open`: Open specific cognitive surface
- `open-cognitive-layer`: Generic open (defaults to signals)

**Panels** (6 surfaces):

### **1. Think Panel** (`think-panel.tsx`)

**Purpose**: Reasoning surface that generates proposals

**Features**:

- **Think Types**: Summary, Plan, Strategy, Risk Analysis, Prediction
- **Input**: Natural language prompt
- **Output**: Proposal + Evidence + Confidence Score
- **Actions**: Stage Action, View Evidence

**Flow**:

```
User: "Summarize Q1 performance for Acme Corp"
  ↓
POST /api/v1/cognitive/think
  {
    type: "summary",
    prompt: "Summarize Q1 performance for Acme Corp",
    entityId: "acc_123",
    entityType: "account"
  }
  ↓
Intelligence Service:
  1. Fetch entity from Spine
  2. Fetch related signals
  3. Call OpenRouter with context
  4. Stream response chunks via SSE
  5. Write session summary to memory
  ↓
Frontend: Display proposal with confidence + evidence count
```

### **2. Triage Inbox Panel** (`triage-inbox-panel.tsx`)

**Purpose**: Flow C customer review surface

**Features**:

- **Pending Items**: AI-extracted knowledge from conversations
- **Actions**: Approve (→ memory), Discard (→ gone), Defer (→ review later)
- **Metadata**: Priority, Category, Confidence, Sentiment, Reasoning

**Flow**:

```
External AI (ChatGPT/Claude) → Triage Bot API
  ↓
POST /v1/triage/session
  {
    session_id, summary, memories: [...]
  }
  ↓
Triage Bot:
  1. Validate API key
  2. Classify session (auto-approve / HITL / discard)
  3. Write to conversational_memory (Spine DB)
  4. If approved → promote to org_memory
  5. Return: { approval_status, confidence }
  ↓
Frontend: Display in Triage Inbox
  ↓
User: Approve / Discard / Defer
  ↓
PATCH /api/v1/knowledge/triage/:id
  { action: "approve", reason: "..." }
```

### **3. Signals Panel**

**Purpose**: Real-time alerts and insights

**Features**:

- **Signal Types**: Risk, Opportunity, Anomaly, Trend
- **Severity**: High, Medium, Low
- **Actions**: Investigate, Dismiss, Create Task

### **4. Approvals Panel** (HITL)

**Purpose**: Human-in-the-loop approval queue

**Features**:

- **Proposal Types**: Action, Decision, Change
- **Actions**: Approve, Deny, Request Changes
- **Metadata**: Confidence, Evidence, Reasoning

### **5. Digital Twin Panel**

**Purpose**: Proactive AI assistant

**Features**:

- **Proactive Suggestions**: Based on context
- **Conversational Chat**: Entity 360 context
- **Action Proposals**: Draft-only or execute

### **6. Policies Panel**

**Purpose**: Governance rules management

**Features**:

- **Policy Types**: Approval, Validation, Notification
- **Actions**: Create, Edit, Delete, Enable/Disable

---

## 📊 DEPARTMENT WORKBENCH

**Component**: `DepartmentWorkbench.tsx`

**Purpose**: Generic configuration-driven workbench for all departments

**Architecture**:

```typescript
<DepartmentWorkbench
  department="CUSTOMER_SUCCESS"
  title="Account Success"
  entityTypes={["account", "contact", "success_plan", "risk"]}
  metrics={[
    { id: "arr", label: "ARR", entityType: "account", field: "arr", type: "currency" },
    { id: "accounts", label: "Active Accounts", entityType: "account", field: "id", type: "number" },
    { id: "at-risk", label: "At Risk", entityType: "risk", field: "id", type: "number" },
    { id: "health", label: "Avg Health", entityType: "account", field: "health_score", type: "percentage" },
  ]}
/>
```

**Three Tabs**:

1. **My Department**: Department-specific entities + metrics
2. **Organization**: Cross-department collaboration
3. **Personal**: Individual tasks + calendar

**Primitives** (Reusable UI components):

- `MetricTile`: KPI display
- `EntityCard`: Entity preview with actions
- `InsightBlock`: AI-generated insight
- `TimelineStream`: Activity feed
- `GovernancePanel`: Approval queue
- `OperationalCanvas`: Configurable dashboard
- `HealthRing`: Health score visualization

---

## 🔄 DATA FLOW (User Action → Backend → UI Update)

### **Example: User Views Account Health**

```
1. USER ACTION
   User clicks "Accounts" in sidebar
   ↓

2. NAVIGATION
   handleNavigate("/work/accounts")
   setActivePath("/work/accounts")
   navigate("/app/work/accounts")
   ↓

3. CONTENT ROUTING
   ContentRouter receives:
     - domain: "CUSTOMER_SUCCESS"
     - moduleId: "accounts"
   ↓
   Lazy load: csModules.accounts()
   ↓

4. COMPONENT MOUNT
   <AccountsView /> mounts
   ↓
   useSpine DBEntities(["account"])
   ↓

5. API CALL
   apiFetch("/api/v1/workspace/entities?type=account")
   Headers:
     - Authorization: Bearer <jwt>
     - x-tenant-id: <tenant-uuid>
     - x-view-context: CTX_CS
   ↓

6. GATEWAY ROUTING
   gateway.integratewise.ai receives request
   ↓
   Validates JWT → extracts tenant_id
   ↓
   Routes to BFF service binding
   ↓

7. BFF (NOT IMPLEMENTED YET)
   Would aggregate:
     - Spine entities (accounts)
     - Signals (at-risk alerts)
     - Knowledge (recent docs)
     - Goals (account goals)
   ↓
   Falls through to Pipeline service
   ↓

8. PIPELINE SERVICE
   GET /api/entities?type=account
   ↓
   Reads from Spine (Spine DB):
     - account_success.accounts table
     - Filters by tenant_id
     - Returns canonical entities
   ↓

9. RESPONSE
   {
     entities: [
       {
         id: "acc_123",
         name: "Acme Corp",
         health_score: 85,
         arr: 500000,
         status: "active",
         ...
       },
       ...
     ],
     total: 42
   }
   ↓

10. UI UPDATE
    React Query caches response
    ↓
    <AccountsView /> renders:
      - Metric tiles (Total ARR, Active Accounts, At-Risk)
      - Entity cards (Account list with health rings)
      - Filters (Status, Health, ARR range)
    ↓

11. USER CLICKS ACCOUNT
    onClick={() => navigate(`/work/entity-360?id=acc_123`)}
    ↓

12. ENTITY 360 VIEW
    Fetches:
      - Entity details (Spine)
      - Related entities (Contacts, Opportunities)
      - Signals (At-risk alerts)
      - Evidence (Source data from HubSpot, Salesforce)
      - Timeline (Activity history)
      - AI Insights (Think panel suggestions)
    ↓

13. L2 COGNITIVE LAYER
    User presses ⌘J
    ↓
    Opens Think Panel
    ↓
    User: "What's the churn risk for Acme Corp?"
    ↓
    POST /api/v1/cognitive/think
    ↓
    Intelligence Service:
      - Fetches account + signals
      - Calls OpenRouter
      - Streams response
    ↓
    Displays: "Churn risk: 35% (Medium). Evidence: 3 missed meetings, declining usage, contract expires in 60 days."
```

---

## 🎯 KEY USER FLOWS

### **Flow 1: New User Onboarding**

```
1. Visit app.integratewise.ai
2. Click "Sign Up"
3. Enter email/password OR Google/GitHub SSO
4. Onboarding Step 1: Choose use case (Personal/Work/Business)
5. Onboarding Step 2: Select industry + department + company size
   → Triggers Spine schema initialization
6. Onboarding Step 3: Define goal + workspace name
7. Onboarding Step 4: Connect data sources (OAuth)
   → Triggers Creamy Layer sync (100 records)
8. AI Loader: Watch sync progress
9. Workplace Loading: Finalize setup
10. Land in Workspace: Dashboard view
```

### **Flow 2: Daily Workflow (CS Manager)**

```
1. Login → Land on Dashboard
2. See metrics: Total ARR, Active Accounts, At-Risk, Avg Health
3. Click "At-Risk" → Filter to at-risk accounts
4. Click account "Acme Corp" → Entity 360 view
5. See:
   - Health score: 65 (declining)
   - Signals: 3 missed meetings, declining usage
   - Evidence: HubSpot activity log, Slack messages
   - Timeline: Last 30 days of activity
6. Press ⌘J → Open Think Panel
7. Ask: "What's the churn risk?"
8. AI responds: "35% risk. Recommend: Schedule executive check-in, review contract terms."
9. Click "Stage Action" → Creates proposal
10. Proposal goes to Approvals Panel (HITL)
11. Manager approves → Action executes (creates HubSpot task)
12. Signal dismissed → Dashboard updates
```

### **Flow 3: Cross-Department Collaboration (BizOps)**

```
1. Login as BizOps user
2. Dashboard shows: All departments + cross-dept metrics
3. Click "Sales Hub" → See sales pipeline
4. Click "CS Hub" → See account health
5. Click "Marketing Hub" → See campaign performance
6. Use Command Palette (⌘K) → Search "Acme Corp"
7. Entity 360 shows:
   - Sales: 3 open opportunities
   - CS: Health score 65
   - Marketing: 5 campaign touches
   - Finance: $500K ARR, renewal in 60 days
8. Press ⌘J → Ask: "What's our strategy for Acme renewal?"
9. AI generates: "Multi-touch strategy: Sales (upsell), CS (health recovery), Marketing (case study)"
10. Stage action → Creates tasks across all 3 departments
11. Approvals → Each dept manager approves their task
12. Execution → Tasks created in HubSpot, Asana, Slack
```

---

## 🔐 SECURITY & ENTITLEMENT

### **Authentication**

- **Provider**: Spine DB PKCE
- **Methods**: Email/Password, Google SSO, GitHub SSO
- **Session**: JWT stored in browser, auto-refreshed
- **Headers**: `Authorization: Bearer <token>`

### **Tenant Isolation**

- **Header**: `x-tenant-id` (extracted from JWT)
- **Database**: Row-level security (RLS) on all Spine DB tables
- **Spine**: All queries filtered by `tenant_id`

### **Role-Based Access Control (RBAC)**

- **Roles**: Owner, Admin, Manager, Member, Viewer
- **Projection**: `useProjection()` hook determines:
  - `canAct`: Can execute actions
  - `canApprove`: Can approve proposals
  - `canView`: Can view entities
- **Entitlement**: Modules hidden if not in user's projection

### **Data Gating**

- **Density Gating**: Hide modules with no data
- **Schema Gating**: Only show entity types in tenant schema
- **Projection Gating**: Only show modules user is entitled to

---

## 📱 RESPONSIVE DESIGN

- **Desktop**: Full sidebar + content + L2 drawer
- **Tablet**: Collapsible sidebar + content
- **Mobile**: Bottom nav + full-screen content

---

## ⚡ PERFORMANCE OPTIMIZATIONS

1. **Lazy Loading**: All modules loaded on-demand
2. **Code Splitting**: Separate bundles per domain
3. **React Query**: Automatic caching + background refetch
4. **Suspense**: Loading skeletons during fetch
5. **Error Boundaries**: Graceful failure handling
6. **Density Gating**: Skip rendering empty modules
7. **Projection Caching**: Cache entitlement checks

---

## 🎨 DESIGN SYSTEM

**Colors**:

- Background: `#F5F6FA`
- Card: `#FFFFFF`
- Border: `#E8ECF2`
- Text Primary: `#1B2544`
- Text Secondary: `#7B8AAD`
- Accent: Domain-specific (CS: `#4154A3`, Sales: `#10B981`, etc.)

**Typography**:

- Font: `system-ui, sans-serif`
- Sizes: 10px (labels), 12px (body), 14px (headings), 16px (titles)

**Spacing**:

- Base unit: 4px
- Common: 8px, 12px, 16px, 24px, 32px

**Shadows**:

- Card: `0 1px 3px rgba(0,0,0,0.1)`
- Elevated: `0 4px 12px rgba(0,0,0,0.15)`

---

## 🚀 DEPLOYMENT

**Frontend**:

- **Platform**: Cloudflare Pages
- **Preview**: `https://fa598630.integratewise.pages.dev`
- **Production**: `app.integratewise.ai` (manual promotion)
- **Build**: Vite + React + TypeScript
- **Deploy**: GitHub Actions → Cloudflare Pages

**Backend**:

- **Platform**: Cloudflare Workers (22 services)
- **Gateway**: `gateway.integratewise.ai`
- **Services**: Connector, Pipeline, Intelligence, Knowledge, BFF, L2
- **Database**: Spine DB (Neon Postgres)
- **Cache**: Cloudflare KV + D1

---

**END OF USER FLOW AND VIEW ARCHITECTURE**
