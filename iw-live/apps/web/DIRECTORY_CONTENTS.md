# IntegrationWise OS - Complete Directory Contents

**Last Updated:** 2026-01-21  
**Total Files:** 442 TypeScript/TSX files  
**Routes:** 98 app routes + 65 API routes  
**Components:** 117 component files

---

## 📊 Overview Statistics

| Category | Count |
|----------|-------|
| **TypeScript/TSX Files** | 442 |
| **App Routes** | 98 pages |
| **API Routes** | 65 endpoints |
| **Components** | 117 files |
| **Directories** | 267 |
| **Library Modules** | 30+ |

---

## 📁 Directory Structure

### Top Level
```
apps/integrationwise-os/
├── app/                    # Next.js App Router
├── components/             # React components
├── lib/                    # Utility libraries
├── public/                 # Static assets
├── scripts/                # SQL scripts
├── styles/                 # Global styles
├── supabase/              # Supabase migrations
├── e2e/                   # E2E tests
├── hooks/                 # React hooks
├── middleware.ts          # Next.js middleware
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
└── vercel.json
```

---

## 🗂️ App Directory (`app/`)

### Route Groups (Organized by Lens)
- `(app)/` - Main app routes (8 routes)
- `(auth)/` - Authentication routes (5 routes)
- `(business)/` - Business lens (6 routes)
- `(cs)/` - Customer Success lens (5 routes)
- `(personal)/` - Personal lens (6 routes)

### Main Routes (98 total)
- `account/billing/` - Account management
- `ai-loader/` - AI data loader
- `architecture/` - Architecture view
- `blog/` - Blog pages
- `brainstorming/` - Brainstorming feature
- `campaigns/` - Marketing campaigns
- `case-studies/` - Case studies
- `clients/` - Client management
- `cockpit/` - Business cockpit
- `company/` - Company pages (about, careers, contact)
- `content/` - Content management
- `cs/` - CS-specific routes (accounts, contacts, meetings)
- `data-flow/` - Data flow visualization
- `data-sources/` - Data sources management
- `deals/` - Deal management
- `docs/` - Documentation
- `env/` - Environment management
- `governance/` - Governance views
- `integrations/` - Integrations hub
- `iq-hub/` - IQ Hub
- `knowledge/` - Knowledge base
- `leads/` - Lead management
- `onboarding/` - Onboarding flow (7 routes)
- `os/` - OS landing
- `overview/` - Overview dashboard
- `platform/` - Platform page
- `pricing/` - Pricing page
- `products/` - Products listing
- `release-control/` - Release management
- `resources/` - Resources hub (blog, docs, changelog, etc.)
- `sales/` - Sales hub
- `security/` - Security pages (compliance, privacy, datasentinel)
- `services/` - Services
- `sessions/` - Session management
- `settings/` - Settings pages
- `solutions/` - Solutions pages
- `start/` - Start pages (cs, os)
- `strategy/` - Strategy hub
- `support/` - Support pages
- `tasks/` - Task management
- `templates/` - Template system
- `today/` - Today view

### API Routes (65 endpoints)

#### Core APIs
- `/api/health` - Health check
- `/api/liveness` - Liveness check
- `/api/readiness` - Readiness check
- `/api/ping` - Ping endpoint

#### AI & Brainstorming
- `/api/ai/chat` - AI chat endpoint
- `/api/brainstorm/analyze` - Analyze brainstorming
- `/api/brainstorm/execute` - Execute brainstorming actions
- `/api/brainstorm/daily-insights` - Daily insights

#### Billing & Subscription (8 routes)
- `/api/billing/cancel` - Cancel subscription
- `/api/billing/change-plan` - Change plan
- `/api/billing/checkout` - Checkout
- `/api/billing/entitlements` - Entitlements
- `/api/billing/invoices` - Invoices
- `/api/billing/plans` - Plans
- `/api/billing/subscribe` - Subscribe
- `/api/billing/subscription` - Subscription status
- `/api/billing/webhook/[provider]` - Billing webhooks

#### Data Loader (9 routes)
- `/api/loader/[source]` - Load from source
- `/api/loader/analyze-template` - Analyze template
- `/api/loader/creamy-preview` - Creamy preview
- `/api/loader/generate-schema` - Generate schema
- `/api/loader/input-source` - Input source
- `/api/loader/render` - Render loader
- `/api/loader/stage1` - Stage 1 processing
- `/api/loader/stage2` - Stage 2 processing
- `/api/loader/sync` - Sync loader

#### Webhooks (9 routes)
- `/api/webhook` - Generic webhook
- `/api/webhooks/[provider]` - Provider webhooks
- `/api/webhooks/ai-relay` - AI relay webhook
- `/api/webhooks/asana` - Asana webhook
- `/api/webhooks/brainstorm` - Brainstorm webhook
- `/api/webhooks/discord` - Discord webhook
- `/api/webhooks/health` - Webhook health
- `/api/webhooks/hubspot` - HubSpot webhook
- `/api/webhooks/slack` - Slack webhook

#### Cron Jobs (7 routes)
- `/api/cron/daily-insights` - Daily insights cron
- `/api/cron/hourly-insights` - Hourly insights cron
- `/api/cron/integrity-check` - Integrity check
- `/api/cron/outbox` - Outbox processor
- `/api/cron/spend-insights` - Spend insights cron
- `/api/cron/sync-scheduler` - Sync scheduler

#### Other APIs
- `/api/byom` - Bring Your Own Model
- `/api/byot` - Bring Your Own Template
- `/api/capture` - Data capture
- `/api/cs/health-score` - CS health score
- `/api/data-sync` - Data synchronization
- `/api/env/health` - Environment health
- `/api/goals/progress` - Goals progress
- `/api/hubspot/sync` - HubSpot sync
- `/api/insights/patterns` - Pattern insights
- `/api/metrics/kpis` - KPIs metrics
- `/api/neutron/*` - Neutron endpoints (ingest, promote, clear)
- `/api/search` - Search functionality
- `/api/session` - Session management
- `/api/spend/*` - Spend analytics (summary, trend)
- `/api/stripe/webhook` - Stripe webhook
- `/api/support/contact` - Support contact
- `/api/sync/schedule` - Sync scheduling
- `/api/templates/download` - Template download
- `/api/webhook-scheduler/trigger` - Webhook scheduler
- `/api/website/track` - Website tracking
- `/api/workspace/bootstrap` - Workspace bootstrap

---

## 🧩 Components Directory (`components/`)

### Total: 117 component files

#### Enhanced Components (Cherry-picked)
- `enhanced-header.tsx` ✅
- `enhanced-sidebar.tsx` ✅
- `enhanced-user-menu.tsx` ✅
- `enterprise-footer.tsx` ✅
- `enterprise-app-shell.tsx` ✅
- `brand-header.tsx` ✅
- `cognitive-twin-chat.tsx` ✅

#### Component Categories
- `brand/` - Branding components
- `department/` - Department switcher
- `dialogs/` - Dialog components
- `hubs/` - Hub components
- `integrations/` - Integration components
- `layouts/` - Layout components (page-layout, standard-view, workspace-container)
- `loader/` - Loader components
- `media/` - Media components
- `onboarding/` - Onboarding components
- `paywall/` - Paywall components
- `rbac/` - RBAC components
- `sidebars/` - Sidebar variants
- `ui/` - UI component library (20+ components)
- `views/` - View components (20+ views)
- `widgets/` - Widget components

---

## 📚 Library Directory (`lib/`)

### Core Libraries (30+ modules)

#### AI & Machine Learning
- `ai-loader/` - AI loader system (4 files)
  - `governance-engine.ts`
  - `identity-mapper.ts`
  - `stage1-creamy.ts`
  - `stage2-full.ts`
- `embeddings/` - Embeddings service
- `insights/` - Insights generation

#### Authentication & Authorization
- `auth/` - Authentication utilities
- `auth.ts` - Main auth functions
- `rbac/` - Role-Based Access Control
  - `context.tsx`
  - `types.ts`
- `department/` - Department context

#### Billing & Payments
- `billing/` - Complete billing system (8 files)
  - `admin.ts`
  - `enforcement.ts`
  - `hooks.ts`
  - `service.ts`
  - `types.ts`
  - `webhooks.ts`
  - `__tests__/` - Test files

#### Data & Database
- `db.ts` - Database client
- `db-concurrency.ts` - Concurrency handling
- `neon.ts` - Neon database
- `outbox.ts` - Outbox pattern

#### Integrations & Loaders
- `loaders/` - Data loaders (5 loaders)
  - `gmail.ts`
  - `hubspot.ts`
  - `notion.ts`
  - `sheets.ts`
  - `slack.ts`
- `loader-utils.ts` - Loader utilities
- `cms/` - CMS adapters (Notion, Sanity)
- `ai-webhook-service.ts` - AI webhook service

#### Utilities
- `config.ts` - Configuration
- `env.ts` - Environment management
- `logger.ts` - Structured logging
- `utils.ts` - General utilities
- `circuit-breaker.ts` - Circuit breaker pattern
- `design-tokens.ts` - Design tokens

#### Feature Modules
- `billing/` - Billing system
- `byot/` - Bring Your Own Template
- `cs/` - Customer Success utilities
- `feature/` - Feature flags
- `goals/` - Goals management
- `governance.ts` - Governance system
- `media/` - Media management (Cloudinary)
- `metrics/` - Metrics collection
- `shadow/` - Shadow mode
- `spend/` - Spend analytics
- `sync/` - Sync scheduler
- `templates/` - Template system
- `triage/` - Triage bot
- `workspace.ts` - Workspace management

#### Hooks (`lib/hooks/`)
- `use-brainstorm.ts`
- `use-connections.ts`
- `use-cs-data.ts`
- `use-data.ts`
- `use-insights.ts`
- `use-onboarding.ts`
- `use-visibility-rules.ts`

#### Types (`lib/types/`)
- `spine-types.ts` - Spine type definitions
- `ssot.ts` - Single Source of Truth types
- `task.ts` - Task types

#### Supabase (`lib/supabase/`)
- `client.ts` - Browser client
- `middleware.ts` - Middleware
- `proxy.ts` - Proxy utilities
- `server.ts` - Server client

---

## 🗄️ Database

### Migrations (`supabase/migrations/`)
1. `20260106_spine.sql` - Spine tables (tasks, notes, conversations, plans)
2. `20260110_byot_tables.sql` - BYOT tables
3. `20260112_ai_loader_schema.sql` - AI loader schema
4. `20260113_billing_audit_enhancements.sql` - Billing audit
5. `20260113_phase3_tables.sql` - Phase 3 tables
6. `20260113_shadow_jobs.sql` - Shadow jobs
7. `20260113_support_requests.sql` - Support requests
8. `20260116_enable_pgvector.sql` - Vector extension
9. `20260116_triage_bot.sql` - Triage bot

### Scripts (`scripts/`)
- 39 SQL scripts for database setup
- Includes: interactions, documents, tasks, calendar, emails, drive files, activities, metrics, search, webhooks, services, products, CRM, brainstorming, strategic layer, website manager, Slack/Discord tables, webhook scheduler, vector indexes, RLS tenant, billing schema

---

## 🎨 Assets

### Public Directory (`public/`)
- **Logos:** integratewise-logo.png, logo.svg, logo-icon.svg, logomark.svg
- **Icons:** apple-icon.png, favicon.ico, icon-dark-32x32.png, icon-light-32x32.png
- **Integration Logos:** logos/ (Google, HubSpot, Notion, Slack, Salesforce, etc.)
- **Placeholders:** placeholder-logo.png, placeholder-user.jpg

---

## 🧪 Testing

- `e2e/` - End-to-end tests (Playwright)
  - `autonoma.spec.ts`
  - `login-debug.spec.ts`
- `playwright.config.ts` - Playwright configuration

---

## 📦 Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `eslint.config.js` / `eslint.config.mjs` - ESLint configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - Components configuration (shadcn/ui)
- `vercel.json` - Vercel deployment configuration
- `middleware.ts` - Next.js middleware

---

## 🔧 Key Features

### 1. Multi-Lens Architecture
- **Personal Lens** - Personal productivity
- **Business Lens** - Business operations
- **CS Lens** - Customer Success

### 2. Complete AI Integration
- AI loader (2-stage processing)
- AI insights and brainstorming
- AI assistant integration
- Cognitive Twin chat

### 3. Comprehensive Integrations
- Slack, Discord, Notion, HubSpot
- Gmail, Google Sheets
- Stripe, Webflow
- And more...

### 4. Enterprise Features
- RBAC (Role-Based Access Control)
- Department management
- Billing & subscriptions
- Governance & compliance
- Audit trails

### 5. Data Management
- Spine data layer (tasks, notes, conversations, plans)
- Data loaders and sync
- Search functionality
- Vector embeddings

---

## 🚀 Deployment

- **Platform:** Vercel (Next.js)
- **Database:** Neon PostgreSQL
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Media:** Cloudinary

---

## 📝 Summary

This is a **complete, production-ready** application with:
- ✅ 98 app routes
- ✅ 65 API endpoints
- ✅ 117 components
- ✅ 30+ library modules
- ✅ Complete feature set
- ✅ Enterprise-grade architecture
- ✅ Multi-tenant support
- ✅ RBAC & governance
- ✅ Full integration ecosystem

**Status:** Ready for production use with all features implemented.
