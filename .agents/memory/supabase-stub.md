---
name: Supabase stub is tech debt
description: No Supabase in the stack. Views have migration artifacts from Vercel. Stub must be fully chainable. Replace with Cloudflare API calls over time.
---

## Rule
There is **no Supabase** in IntegrateWise. The platform backend is Cloudflare Workers + D1/KV (`integratewise-live`).

The file `artifacts/integratewise/src/lib/supabase/client.ts` is a **chainable no-op stub** created during the Next.js → Vite migration. It exists only to prevent crashes in demo mode.

**Why it exists:** 25 views imported from the Vercel version called Supabase directly (`.from().select().order().limit()`). Replacing them all at once was out of scope for the migration task.

**How to apply:**
- The stub must support arbitrary chaining depth (use a Proxy or builder pattern returning `this`)
- Do NOT add real Supabase credentials or deepen the Supabase pattern
- As each view is wired to a real Cloudflare API route, delete its Supabase calls and import from the API client instead
- The stub's `from()` chain should always resolve to `{ data: [], error: null }` (or `{ data: null }` for `.single()`)
