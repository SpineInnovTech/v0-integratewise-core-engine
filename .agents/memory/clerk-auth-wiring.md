---
name: Clerk auth wiring (integratewise + api-server)
description: How real Replit-managed Clerk auth is wired across the web app and the relay
---

# Clerk auth wiring

`integratewise` uses **real Replit-managed Clerk auth**, replacing the old mock /
demo-mode auth. This supersedes any earlier "Clerk retired / demo mode always on"
note in replit.md.

**Frontend:** `src/components/auth/clerk-config.tsx` holds the canonical wiring
copied verbatim from the clerk-auth skill (clerkPubKey via publishableKeyFromHost,
clerkProxyUrl, basePath/stripBase, ClerkProvider props, SignInPage/SignUpPage
routing="path", `withAuth` HOC, `Landing`, `ClerkAppProvider`). `App.tsx` keeps
`/` public (Landing when signed-out), routes `/sign-in/*?` + `/sign-up/*?`,
redirects legacy `/auth/*`, and wraps app routes with `withAuth`.

**Relay (api-server):** `app.ts` mounts the Clerk Frontend API proxy before body
parsers, then `cors({ credentials: true, origin: true })` (skill-mandated
verbatim — do not "harden" it; prod is same-origin and Clerk's cookie is
SameSite=Lax), then `clerkMiddleware`. `routes/index.ts` keeps `/healthz` public
and gates leads/clients/deals/ai behind `requireAuth` (getAuth → 401 when no
userId).

**Why same-origin matters:** the web client (`@workspace/api-client-react`
custom-fetch) never sets `credentials:'include'` and sends no Bearer on web — it
relies on the browser attaching the Clerk session cookie to **same-origin** `/api`
requests. The web app sets no base URL, so `/api` is same-origin. If `/api` ever
becomes cross-origin, cookie auth silently breaks (401 for signed-in users too).

**Known constraint:** never add PROD/NODE_ENV gates or substitute look-alike Clerk
code; only theme/UI is editable. Web 401s are cookie/session/middleware issues,
not a reason to add token/Bearer auth (that is mobile-only).
