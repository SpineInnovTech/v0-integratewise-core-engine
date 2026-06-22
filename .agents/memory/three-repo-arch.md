---
name: Three-repo architecture
description: IntegrateWise splits into three repos with strict ownership boundaries; this Replit is iwa-customer-zero (internal ops).
---

## Rule
This repo (`iwa-customer-zero`) is IntegrateWise's internal operations surface — a privileged **platform client**. It never owns auth, tenants, schema, or data directly.

| Repo | Role | Backend |
|------|------|---------|
| `integratewise-live` | Platform — identity (Clerk), tenancy, schema AI, Spine, memory, governance, connectors | Cloudflare Workers + D1/KV |
| `iwa-frontend` | Customer product (paying customers) | calls integratewise-live |
| `iwa-customer-zero` | Internal ops (this repo) — CRM, pipeline, tasks, metrics, knowledge, admin | calls integratewise-live |

**Why:** Customer Zero = platform admin + company operating surface. It manages tenants/users/billing *through APIs* but does not own them. One backend, many projections.

**How to apply:** Any new data call in the Customer Zero UI must go through `GET/POST /api/...` (the Express relay → integratewise-live), not directly to any database or Supabase.
