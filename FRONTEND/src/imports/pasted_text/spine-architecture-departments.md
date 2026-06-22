# Spine Architecture: Departments × Industries Model

> **Canonical correction:** The Adaptive Spine is configured as **12 Departments × 11 Industries**, not a flat "12 domains". **Industry = Resource Type** (base shape); **Department = Trait** (functional behavior). Schema discovery uses **only** Traits and Resource Types in a **1:Many** combination — see [SCHEMA_DISCOVERY.md](SCHEMA_DISCOVERY.md).  
> **References:** [SPINE_AS_FOUNDATION_ARCHITECTURE.md](SPINE_AS_FOUNDATION_ARCHITECTURE.md) | [HARDENING_AND_WIRING.md](HARDENING_AND_WIRING.md) | [PRODUCT_BLUEPRINT.md](PRODUCT_BLUEPRINT.md) | [ONBOARDING_QUESTIONS_CHECK.md](ONBOARDING_QUESTIONS_CHECK.md)

---

## 1. Overall assessment: plan is robust ✅

The Spine-as-Foundation architecture is **fundamentally sound**:

- **Single source of truth** — everything derives from / writes to the Spine
- **Truth boundary** — Flow A/B update Spine; Flow C (AI) never does
- **Tenant-scoped, schema-driven** — (tenant_id, user_id) → tenant config → behaviour
- **Two-phase load** — creamy (60s) + needed (~1 day) + delta
- **Cognitive loop** — Entity 360 → THINK → GOVERN → HITL → ACT → ADJUST → repeat
- **Depth Matrix** — connectors → canonical fields → metrics/intelligence unlocked

Wiring (BFF hardening: tenant-config, dashboard, readiness, projection) is in place.

---

## 2. Key correction: Departments × Industries (not "12 domains")

**Current state (flat):** Docs listed 12 "domains" mixing **departments** (Sales, CSM, Finance) with **industries/verticals** (Healthcare, Education, Freelancers).

**Corrected model:** **12 Departments** (functional) × **11 Industries** (vertical).

### 12 Departments (functional areas)

| #   | Department         |
| --- | ------------------ |
| 1   | Sales              |
| 2   | Marketing          |
| 3   | RevOps             |
| 4   | Customer Success   |
| 5   | Support            |
| 6   | Engineering        |
| 7   | Product            |
| 8   | Finance            |
| 9   | Legal              |
| 10  | HR                 |
| 11  | Supply Chain       |
| 12  | Service Operations |

### 11 Industries (organizational context)

| #   | Industry              |
| --- | --------------------- |
| 1   | SaaS / Technology     |
| 2   | Professional Services |
| 3   | Healthcare            |
| 4   | Education             |
| 5   | Manufacturing         |
| 6   | Automotive            |
| 7   | Retail / Commerce     |
| 8   | Financial Services    |
| 9   | Logistics             |
| 10  | Media                 |
| 11  | Public Sector         |

**Audience (all industries):** The product extends to **Business users** (12 departments), **Executives** (cross-cutting CTX_EXECUTIVE), and **IT admins** (Admin, RBAC, tenant config, connectors) in **every** of the 11 industries. Same spine, same strict schema, industry-aware config for all.

**Why it matters:** Every industry has the same 12 departments, but **Sales in Healthcare** has different entity types, canonical fields, and connectors than **Sales in SaaS**. The Adaptive Spine is composed as:

**Spine Schema = f(Industry, Department)**

- **Industry** = Resource Type (base entity vocabulary, compliance, vertical connectors)
- **Department** = Trait (functional metrics, department connectors, dashboard modules)

---

## 3. Architecture: Industry (Resource Type) + Department (Trait)

```
┌─────────────────────────────────────────────────────────────┐
│                    ADAPTIVE SPINE SCHEMA                     │
│                                                              │
│   Industry (Resource Type)     Department (Trait)            │
│   ─────────────────────        ──────────────               │
│   Defines:                     Defines:                      │
│   • Entity vocabulary          • Functional metrics           │
│   • Industry-specific fields   • Department-specific fields   │
│   • Compliance requirements    • Connector priorities          │
│   • Vertical canonical terms   • Dashboard modules            │
│                                                              │
│   Spine Shape = Industry Base + Department Layer             │
└─────────────────────────────────────────────────────────────┘
```

**Example: Sales in SaaS vs Sales in Healthcare**

| Aspect           | SaaS / Technology                | Healthcare                                      |
| ---------------- | -------------------------------- | ----------------------------------------------- |
| Primary entities | Deals, MRR, ARR, Subscriptions   | Contracts, RFPs, Procurement cycles             |
| Key metrics      | Pipeline velocity, CAC, LTV, NRR | Contract win rate, compliance score, cycle time |
| Connectors       | HubSpot, Salesforce, Stripe      | Epic, Cerner, compliance tools                  |
| Canonical fields | arr, mrr, churn_rate, nrr        | contract_value, procurement_stage, hipaa_status |
| Compliance       | SOC 2 (optional)                 | HIPAA, FDA (mandatory in spine)                 |

---

## 4. tenant_spine_config and backend

### Schema (after migration 054)

- **industry** (TEXT) — e.g. `SAAS_TECH`, `HEALTHCARE`
- **company_size** (TEXT) — e.g. `51-200`, `201-500`
- **user_type** (TEXT) — e.g. `personal`, `business`, `executive`
- **domains** (TEXT[]) — **interpreted as departments** (e.g. `[SALES, CUSTOMER_SUCCESS]`)

BFF `initializeWorkspace` accepts: `industry`, `companySize`, `userType`, `departments[]` (or derives departments from `activeCtx` via `activeCtxToDepartments()`). Depth matrix snapshot includes `industry`, `company_size`, `version: 2`.

### activeCtxToDepartments()

Maps CTX\_\* to department list; includes REVOPS, PRODUCT, SUPPLY_CHAIN, SERVICE_OPS, CTX_EXECUTIVE. Used when frontend does not send explicit `departments[]`.

---

## 5. Corrected onboarding flow (7 steps — target)

| Step | Content                                  | Data field               | Spine effect                                          |
| ---- | ---------------------------------------- | ------------------------ | ----------------------------------------------------- |
| 0    | Usage Type — Personal / Work / Business  | userType                 | Workspace model                                       |
| 1    | Industry — 11 options + Other            | industry                 | **Progressive hydration starts** — seed industry base |
| 2    | Department/Role — 12 departments grouped | departments[], activeCtx | Layer department entities + metrics                   |
| 3    | Company Size                             | companySize              | Tier + connector suggestions                          |
| 4    | Tools/Connectors                         | connectedApps[]          | depth_matrix_snapshot, creamy if OAuth done           |
| 5    | Desired Outcome                          | desiredOutcome           | First AI insights personalisation                     |
| 6    | Workspace Name                           | workspaceName            | Final label; workspace.initialize                     |

**Progressive hydration:** Spine config starts at step 1 (industry); enriched at step 2 (departments); connectors at step 4; final initialize at step 6/7.

**Current UI:** Onboarding remains 3 steps until 7-step flow is implemented; backend already accepts industry, companySize, userType, departments for progressive use.

---

## 6. Types (apps/web)

- **DepartmentId** — 12 departments (SALES, MARKETING, REVOPS, CUSTOMER_SUCCESS, …)
- **IndustryId** — 11 industries (SAAS_TECH, HEALTHCARE, …)
- **UserType** — personal | work | business
- **CompanySize** — solo | startup | small | medium | large | enterprise
- **CTXEnum** — includes CTX_REVOPS, CTX_PRODUCT, CTX_SUPPLY_CHAIN, CTX_SERVICE_OPS, CTX_EXECUTIVE

---

## 7. Balanced 5 departments × spine for every industry and department ✅

**Balanced 5 (first-class):** SALES, REVOPS, CUSTOMER_SUCCESS, FINANCE, PRODUCT. These five have full Spine coverage for every industry; the remaining 7 departments map to existing config keys (e.g. SUPPORT→SERVICE, PRODUCT→PRODUCT_ENGINEERING).

**Spine per (industry, department):**

- **getSpineConfig(industry, department)** — Composes department base (entity_types, priority_fields) with industry profile (entity_types_extra, priority_fields_override). Implemented in `services/workflow`: INDUSTRY_SPINE_BASE per industry, DEPARTMENT_TO_CONFIG_KEY for 12 dept → config key.
- **Readiness, dashboard, projection** — Use tenant industry when resolving allowed entity types and per-department config.
- **initializeSpine** — Accepts optional `industry`; seeds schema observations using getSpineConfig(industry, domain).

**Industry profile registry (INDUSTRY_SPINE_BASE):** SAAS_TECH (default), HEALTHCARE (compliance_item, hipaa_status, etc.), FINANCIAL_SERVICES (kyc_status, risk_tier), PUBLIC_SECTOR (contract_value, procurement_stage), plus entity_types_extra for EDUCATION, MANUFACTURING, LOGISTICS, etc.

---

## 8. Gaps and next steps (ordered)

| #   | Gap                                  | Recommendation                                                     |
| --- | ------------------------------------ | ------------------------------------------------------------------ |
| 1   | ~~No industry in spine config (DB)~~ | Done: migration 054 + BFF                                          |
| 2   | ~~DOMAIN_SPINE_CONFIG flat~~         | Done: getSpineConfig(industry, department)                         |
| 3   | ~~Onboarding 3 steps~~               | Done: 7-step flow + progressive hydration                          |
| 4   | THINK tenant-config check ⏳         | Validate entity_type/department against tenant config in proposals |
| 5   | Context ingestion ⏳                 | Scope doc/email ingestion by tenant spine config                   |

---

## 9. Summary

- **12 Departments × 11 Industries** — Spine schema = f(industry, department). Balanced 5: SALES, REVOPS, CUSTOMER_SUCCESS, FINANCE, PRODUCT.
- **tenant_spine_config** — industry, company_size, user_type, domains (departments); getTenantConfig returns them.
- **Onboarding** — 7 steps with progressive hydration; final payload includes industry, departments, userType, companySize.
- **Backend** — getSpineConfig(industry, department) used in initializeAdaptiveSpine, getReadiness, getAllowedEntityTypesForTenant; initializeSpine accepts industry.