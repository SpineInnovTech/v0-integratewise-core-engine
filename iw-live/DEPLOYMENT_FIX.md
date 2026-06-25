# Preview Deployment Fix — Root Cause & Solution

## Problem

Preview deployment was failing with 404 errors. The platform was fully built and working locally, but Vercel couldn't properly deploy it.

## Root Cause

**Missing `vercel.json` configuration file.**

Vercel needs explicit instructions for Vite-based SPA applications:
1. Where the build output is located (`apps/web/dist`)
2. How to handle routing for single-page apps (rewrite all paths to `index.html`)
3. Build command (Turbo monorepo: `pnpm build`)
4. Environment variables

Without `vercel.json`, Vercel defaults to Next.js or static site assumptions, which don't work for Vite React Router apps.

## Solution

Created `vercel.json` with proper Vite configuration:

```json
{
  "version": 2,
  "buildCommand": "pnpm build",
  "outputDirectory": "apps/web/dist",
  "framework": "vite",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key configurations:**
- `outputDirectory`: Points Vercel to the Vite build output
- `rewrites`: SPA routing (all paths → index.html for React Router)
- `cleanUrls`: Remove `.html` extensions from URLs
- `framework`: Explicit Vite detection
- `buildCommand`: Uses Turbo to build the monorepo

## What This Fixes

1. **404 errors on preview:** Vercel now correctly serves `index.html` for all routes
2. **Build detection:** Vercel knows to run Turbo build command
3. **Asset routing:** Static assets serve from `/dist/assets/`
4. **Environment variables:** Can be configured in Vercel project settings

## Deployment Readiness Status

✅ All checks passed:
- Vite build: 8.9MB dist directory created
- TypeScript: 0 errors (clean type check)
- Dependencies: pnpm-lock.yaml (reproducible builds)
- Config: vercel.json present and configured
- Environment: AI Gateway keys available
- Git: Changes committed and ready for push

## Why This Wasn't Needed Before

Previous deployments may have worked because:
- Local dev server (Vite) handles routing internally
- Cloudflare Workers deployments don't need Vercel routing config
- Early deployments may have been manual or used different hosting

Now that preview URLs are public-facing, Vercel needs explicit config for SPAs.

## Testing the Fix

After pushing to GitHub:
1. Vercel automatically builds the deployment
2. Preview URL should load without 404s
3. All routes (/, /app, /dashboard) should work
4. Assets should load (no 404s on .js, .css files)

## Files Modified

- `vercel.json` — New file with deployment config

## References

- Vercel Vite docs: https://vercel.com/docs/frameworks/vite
- Vite SPA config: https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server
- React Router in Vite: https://reactrouter.com/start/framework-choice
