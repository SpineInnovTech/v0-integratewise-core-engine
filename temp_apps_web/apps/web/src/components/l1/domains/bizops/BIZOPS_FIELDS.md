# Business Ops — UI Fields & Views Reference

## Overview

Business Ops (BizOps) is the connective tissue binding all 14 departments through Goals, Metrics, Tools/Services, and Product. It's the default workbench domain.

**Location:** `apps/web/src/components/l1/domains/bizops/`

---

## 14 Core Entity Types

| #   | Entity Type             | Description                | Key Fields                                                 |
| --- | ----------------------- | -------------------------- | ---------------------------------------------------------- |
| 1   | `account`               | Customer/company accounts  | name, arr, mrr, health_score, status, industry, csm        |
| 2   | `contact`               | People/contacts            | name, email, company, role, linked_account_id              |
| 3   | `opportunity`           | Sales deals                | name, amount, stage, probability, close_date, owner        |
| 4   | `task`                  | Action items               | title, status, priority, assignee, due_date, linked_entity |
| 5   | `campaign`              | Marketing campaigns        | name, channel, budget, spent, leads, revenue, roi, status  |
| 6   | `activity`              | CRM activities             | type, summary, timestamp, user, lead_id                    |
| 7   | `project`               | Projects/initiatives       | name, status, progress, owner, start_date, end_date        |
| 8   | `workflow`              | Automated workflows        | name, status, trigger, actions, last_run                   |
| 9   | `kpi`                   | Key Performance Indicators | name, value, unit, change, change_direction, source        |
| 10  | `okr`                   | Objectives & Key Results   | title, objective, progress, status, owner, due_date        |
| 11  | `cross_dept_initiative` | Cross-department projects  | name, departments, status, progress, owner                 |
| 12  | `resource_allocation`   | Resource utilization       | resource, utilization, allocation_percent, department      |
| 13  | `ops_metric`            | Operational metrics        | name, value, unit, category, trend                         |
| 14  | `generated_insight`     | AI-generated insights      | title, content, severity, confidence, entity_type, status  |

---

## Additional Entity Types (Domain-Specific)

| Entity Type              | Used In      | Key Fields                                                     |
| ------------------------ | ------------ | -------------------------------------------------------------- |
| `lead`                   | CRM View     | name, email, company, source, stage, score, value, assigned_to |
| `deal`                   | Sales Hub    | name, company, value, stage, probability, close_date, owner    |
| `client`                 | Clients      | name, industry, arr, mrr, health_score, health, csm, nps       |
| `product`                | Products     | name, tier, price, billing_cycle, status, features, mrr        |
| `service`                | Services     | name, tier, price, duration, deliverables, sla, revenue        |
| `document`               | Knowledge    | title, content, source, type, status, tags                     |
| `sop`                    | Knowledge    | title, content, department, version, status                    |
| `training_material`      | Knowledge    | title, content, format, audience, status                       |
| `knowledge_article`      | Knowledge    | title, summary, content, category, status                      |
| `playbook`               | Knowledge    | title, trigger, steps, success_criteria                        |
| `milestone`              | Strategy     | title, target_date, status, linked_okr                         |
| `board_update`           | Strategy     | title, content, audience, date                                 |
| `investor_communication` | Strategy     | title, content, type, date                                     |
| `strategic_objective`    | Strategy     | title, description, progress, owner                            |
| `business_context`       | Strategy     | key, value, category                                           |
| `vendor`                 | Operations   | name, category, status, contract_value, renewal_date           |
| `process`                | Operations   | name, status, owner, steps, efficiency                         |
| `data_source`            | Integrations | name, type, status, last_sync, record_count                    |
| `connector`              | Integrations | name, type, status, last_sync                                  |
| `integration`            | Integrations | name, type, status, last_sync                                  |
| `tool`                   | Integrations | name, category, status                                         |

---

## Views (14 Department Views + Cross-Functional)

### 1. Founder Ops View (`founder-ops-view.tsx`)

**The complete business cockpit for founders.**

Sections:

- **KPI Strip** (10 cards): ARR, Pipeline, Customers, OKR Progress, Active Workflows, Active Projects, Campaigns, Open Tasks, Critical Signals, Revenue Trend
- **AI Attention**: L2 cognitive insights + L1 generated_insights
- **Sales & Pipeline**: Opportunities by stage, win rate, avg deal size
- **Marketing & Campaigns**: Active campaigns, budget utilization, lead generation
- **Strategic Goals**: OKRs with progress bars, KPI tracking
- **Operations**: Workflows, projects, cross-dept initiatives
- **Client Health**: Health score distribution, at-risk accounts
- **Tasks & Activity**: Open tasks, recent activity
- **Resources & Metrics**: Resource allocation, ops metrics

### 2. CEO View (`ceo-view.tsx`)

**Company-wide dashboard.**

| Metric       | Source                              | Calculation |
| ------------ | ----------------------------------- | ----------- |
| ARR          | `account.arr` or `account.mrr * 12` | SUM         |
| Pipeline     | `opportunity.amount`                | SUM         |
| Customers    | `account` count                     | COUNT       |
| OKR Progress | `okr.progress`                      | AVG         |

Additional: Critical signals list, strategic objectives with progress

### 3. COO View (`coo-view.tsx`)

**Operations-focused dashboard.**

| Metric                 | Source                                |
| ---------------------- | ------------------------------------- |
| Active Workflows       | `workflow.status = 'active'`          |
| Running Processes      | `process.status = 'active'`           |
| Resource Utilization   | `resource_allocation.utilization` AVG |
| Cross-dept Initiatives | `cross_dept_initiative` count         |

### 4. CIO/CTO View (`cio-cto-view.tsx`)

**Technology & infrastructure dashboard.**

| Metric    | Source                                      |
| --------- | ------------------------------------------- |
| Systems   | `data_source` count                         |
| Incidents | `generated_insight` where type = 'incident' |
| Uptime    | `ops_metric` where name = 'uptime'          |

### 5. Strategy & Leadership View (`strategy-leadership-view.tsx`)

**Company vision, OKRs, board communications.**

Entity types: `okr`, `kpi`, `milestone`, `board_update`, `investor_communication`, `strategic_objective`, `business_context`

Sections:

- OKRs with progress tracking
- KPI dashboard with trend indicators
- Milestone timeline (upcoming vs completed)
- Board updates feed
- Investor communications

### 6. Operations Center View (`operations-center-view.tsx`)

**Process management, workflows, resource allocation.**

Entity types: `workflow`, `process`, `resource_allocation`, `ops_metric`, `vendor`, `cross_dept_initiative`, `project`

Sections:

- Running workflows with status
- Active processes
- Resource utilization grid
- Ops metrics dashboard
- Vendor management
- Cross-department initiatives

### 7. Business Intelligence View (`business-intelligence-view.tsx`)

**Analytics, reporting, data visualization.**

Entity types: `ops_metric`, `kpi`, `generated_insight`, `data_source`

### 8. Knowledge Management View (`knowledge-management-view.tsx`)

**Documentation, SOPs, training materials.**

Entity types: `document`, `sop`, `training_material`, `knowledge_article`, `onboarding_guide`, `playbook`

Sections:

- Published articles count
- Draft documents
- SOPs by department
- Training materials
- Playbooks

### 9. Human Resources View (`human-resources-view.tsx`)

**People operations.**

### 10. Legal & Compliance View (`legal-compliance-view.tsx`)

**Legal, compliance, contracts.**

### 11. Partnerships View (`partnerships-view.tsx`)

**Partner management, channel partnerships.**

### 12. Product Views (`product-views.tsx`)

**Product management, roadmap, features.**

### 13. BizOps Today View (`bizops-today-view.tsx`)

**Daily cross-functional overview with L2 insights.**

Sections:

- L2 AI Insights (from cognitive layer)
- Live entity metrics (real counts, not hardcoded)
- Cross-functional KPIs

### 14. Sales Hub View (`sales-hub-view.tsx`)

**Sales pipeline and deal management.**

---

## Data Types (from `bizops-data.ts`)

### StrategicGoal

```typescript
{
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  status: "on-track" | "at-risk" | "behind" | "completed";
  owner: string;
  dueDate: string;
  linkedModules: string[];
}
```

### BizMetric

```typescript
{
  id: string;
  name: string;
  value: number;
  unit: "currency" | "count" | "percentage" | "text";
  change: number; // % change
  changeDirection: "up" | "down" | "flat";
  source: string;
  updatedAt: string;
}
```

### Lead

```typescript
{
  id: string;
  name: string;
  email: string;
  company: string;
  source: "linkedin" | "website" | "referral" | "inbound" | "outbound" | "other";
  stage: "new" | "contacted" | "qualified" | "converted" | "lost";
  score: number; // 0-100
  value: number;
  assignedTo: string;
  createdAt: string;
  lastActivity: string;
  activities: CRMActivity[];
}
```

### Deal

```typescript
{
  id: string;
  name: string;
  company: string;
  value: number;
  stage: "discovery" | "qualification" | "proposal" | "negotiation" | "won" | "lost";
  probability: number;
  closeDate: string;
  owner: string;
  createdAt: string;
  lastActivity: string;
  linkedLeadId?: string;
}
```

### Client

```typescript
{
  id: string;
  name: string;
  industry: string;
  arr: number;
  mrr: number;
  healthScore: number;
  health: "healthy" | "at-risk" | "critical";
  contractStart: string;
  contractEnd: string;
  csm: string;
  activeProjects: number;
  openTickets: number;
  lastEngagement: string;
  nps: number | null;
}
```

### Product

```typescript
{
  id: string;
  name: string;
  tier: "professional" | "recurring" | "scalable" | "saas" | "digital";
  price: number;
  billingCycle: "one-time" | "monthly" | "annual";
  status: "active" | "beta" | "deprecated" | "coming-soon";
  description: string;
  features: string[];
  activeSubscriptions: number;
  mrr: number;
}
```

### Service

```typescript
{
  id: string;
  name: string;
  tier: ServiceTier;
  price: number;
  duration: string;
  deliverables: string[];
  sla: string;
  status: "active" | "draft" | "deprecated";
  activeEngagements: number;
  revenue: number;
}
```

### MarketingCampaign

```typescript
{
  id: string;
  name: string;
  channel: string;
  budget: number;
  spent: number;
  leads: number;
  revenue: number;
  roi: number;
  status: "active" | "paused" | "completed" | "draft";
  startDate: string;
  endDate: string;
}
```

### KnowledgeItem

```typescript
{
  id: string;
  title: string;
  category: "branding" | "legal" | "credentials" | "support" | "it" | "finance";
  type: "file" | "link" | "note" | "template";
  description: string;
  url?: string;
  tags: string[];
  updatedAt: string;
  updatedBy: string;
  access: "public" | "team" | "private";
}
```

### DataSource

```typescript
{
  id: string;
  name: string;
  type: "communication" |
    "crm" |
    "billing" |
    "data" |
    "social" |
    "analytics" |
    "ai" |
    "email" |
    "knowledge";
  status: "connected" | "error" | "paused" | "pending";
  lastSync: string;
  recordCount: number;
  webhookEnabled: boolean;
  mcpEnabled: boolean;
}
```

---

## Workbench Primitives (8 reusable components)

| Primitive           | Location                            | Purpose                                         |
| ------------------- | ----------------------------------- | ----------------------------------------------- |
| `MetricTile`        | `primitives/metric-tile.tsx`        | KPI card with value, label, icon, trend         |
| `EntityCard`        | `primitives/entity-card.tsx`        | Entity summary card with health, status, fields |
| `InsightBlock`      | `primitives/insight-block.tsx`      | AI insight with confidence, severity, action    |
| `TimelineStream`    | `primitives/timeline-stream.tsx`    | Chronological event feed                        |
| `GovernancePanel`   | `primitives/governance-panel.tsx`   | Approval queue with approve/reject/defer        |
| `ActionTile`        | `primitives/action-tile.tsx`        | Quick action button with context                |
| `HealthRing`        | `primitives/health-ring.tsx`        | Circular health score visualization             |
| `OperationalCanvas` | `primitives/operational-canvas.tsx` | Section layout with width control               |

---

## Data Hooks

| Hook                        | Location                               | Purpose                           |
| --------------------------- | -------------------------------------- | --------------------------------- |
| `useWorkspaceEntitiesBatch` | `hooks/use-workspace-entities.ts`      | Batch fetch multiple entity types |
| `useSpineEntityCounts`      | `hooks/use-workspace-entities.ts`      | Get entity counts by type         |
| `useGovernanceQueue`        | `hooks/use-governance-queue.ts`        | HITL approval queue               |
| `useL2Insights`             | `hooks/use-l2.ts`                      | L2 cognitive layer insights       |
| `useProjection`             | `lib/projection/use-projection.ts`     | Role/dept/metric projection       |
| `useKnowledgeRegistry`      | `l1/knowledge/useKnowledgeRegistry.ts` | Knowledge board data              |

---

## Navigation Config

**Location:** `l1/workspace/workspace-config.ts`

BizOps navigation sections:

1. **Today** — bizops-today, founder-today
2. **Sales & Revenue** — sales-hub, crm, accounts, clients
3. **Marketing** — marketing, campaigns, content
4. **Operations** — operations-center, workflows, projects
5. **Strategy** — strategic-hub, strategy-leadership, okrs
6. **Product** — products, services, roadmap
7. **Intelligence** — analytics, metrics, insights
8. **Tools** — twin, knowledge, workflows, settings

---

## Cross-Domain Access

BizOps can access views from other domains via cross-domain module mapping:

- CS views (account-success)
- Sales views (salesops)
- RevOps views
- Marketing views
- Product & Engineering views
- Finance views
- IT Admin views

---

## Color Tokens

| Token          | Usage                                 |
| -------------- | ------------------------------------- |
| `--iw-purple`  | Primary actions, strategy, governance |
| `--iw-blue`    | Information, metrics, analytics       |
| `--iw-success` | Healthy, active, completed            |
| `--iw-warning` | At-risk, pending, attention needed    |
| `--iw-danger`  | Critical, failed, lost                |
| `--iw-orange`  | Negotiation, in-progress              |
