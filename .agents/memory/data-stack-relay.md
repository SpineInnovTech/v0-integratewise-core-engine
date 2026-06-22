---
name: Local Postgres relay doctrine
description: Why iwa-customer-zero's dev backend is an owned Express+Drizzle relay over local Postgres, contract-first
---

The dev backend for iwa-customer-zero is an **owned, governed relay**: a React Query UI calls the shared proxy `/api`, which routes to an Express + Drizzle api-server over a **local Postgres** (`DATABASE_URL`). It is contract-first — edit `lib/api-spec/openapi.yaml`, run codegen, and consume the generated hooks/types from `@workspace/api-client-react`.

**Why:** This reconciles with the project's "own your data" / three-repo manifesto. The platform of record is `integratewise-live` (Cloudflare D1/KV), but wiring Customer Zero straight to Cloudflare was not yet possible. A local relay we own — same contract, swappable implementation — lets the workspace be genuinely executable now and repoint to `integratewise-live` later without changing the UI. It is deliberately **not** Supabase (Supabase is banned platform-side).

**How to apply:** New executable surfaces follow UI hooks → `/api` → api-server (repository + service + thin zod route) → Postgres. Keep camelCase end to end (matches Drizzle inferred types). Date-only fields = plain string (no `format: date`) to avoid TZ shift; instants = `format: date-time`. No Vite proxy or base URL — the shared proxy already routes `/api`. When swapping to `integratewise-live`, keep the OpenAPI contract stable so generated hooks don't change.
