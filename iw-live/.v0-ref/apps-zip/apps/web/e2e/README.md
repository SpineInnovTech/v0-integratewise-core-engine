# E2E tests (Playwright)

Tests for marketing pages (no redirects), app routes, navigation, and pricing → /app redirect.

## Prerequisites

1. **Start the app** (in another terminal):
   ```bash
   pnpm --filter @integratewise/web dev
   ```
   App must be running at **http://localhost:3000**.

2. **Install Playwright browsers** (once):
   ```bash
   cd apps/web && pnpm exec playwright install chromium
   ```
   Or install all: `pnpm exec playwright install`

## Run tests

From repo root or from `apps/web`:

```bash
# All projects (Chromium, Firefox, WebKit)
pnpm --filter @integratewise/web test:e2e

# Chromium only (faster)
pnpm --filter @integratewise/web exec playwright test --project=chromium

# With UI
pnpm --filter @integratewise/web test:e2e:ui
```

If the app is already running, Playwright will reuse it (`reuseExistingServer: true`). Otherwise it will start the dev server (may take ~60s on first run).

## What is tested

| Spec | Coverage |
|------|----------|
| `marketing-pages.spec.ts` | /, /features, /contact, /signup, etc. load with 200 and no redirect |
| `no-redirects.spec.ts` | GET /, /features, /signup, /contact stay on same URL |
| `app-routes.spec.ts` | /app, /app/work/dashboard, /app/work/projects, /app/work/accounts load |
| `navigation.spec.ts` | Landing → Features → Contact; Sign in / Get started → /app |
| `marketing-pages.spec.ts` | /pricing redirects to /app (client-side) |

## Expected (local)

- **API calls** from the app may fail locally (backend on Cloudflare Workers). E2E tests do not call APIs; they only check routes and navigation.
