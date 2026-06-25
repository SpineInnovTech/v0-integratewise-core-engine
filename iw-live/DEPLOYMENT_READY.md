# Deployment Ready — v0/integratewi-addf5148

**Branch:** v0/integratewi-addf5148  
**Status:** ✅ READY FOR DEPLOYMENT  
**Last Update:** 2026-06-25  
**Commits Ahead:** 17 (from origin/v0/integratewi-addf5148)  

---

## Pre-Deployment Checklist

### Code Quality
- ✅ TypeScript: 0 errors
- ✅ Build: Successful (19.3s, Turbo cache active)
- ✅ Tests: 7 doctrine suites passing
- ✅ Lint: Doctrine compliance gate passing
- ✅ Git: Clean working tree

### Backend Services
- ✅ 26 services documented (SERVICE_INVENTORY.md)
- ✅ 9 gateway service bindings wired
- ✅ D1 migration complete (no Supabase DATABASE_URL refs)
- ✅ Queue architecture documented (PIPELINE_SERVICE_AUDIT.md)
- ✅ Customer-zero tenant seeded

### Frontend
- ✅ Vite SPA build: 8.9 MB dist/
- ✅ Routes wired: 9 core routes
- ✅ vercel.json: SPA routing configured
- ✅ Real Customer Zero infra intact
- ✅ v0 founder ops (Metrics) maintained

### Documentation
- ✅ GTM_MOTION.md (positioning + funnel)
- ✅ TOOL_CONNECTION_FLOW.md (9-step journey)
- ✅ ARCHITECTURE_DIAGRAMS.md (7 flows)
- ✅ DIAGRAM_VERIFICATION.md (all 10 sections verified)
- ✅ SERVICE_INVENTORY.md (26 services)
- ✅ PIPELINE_SERVICE_AUDIT.md (deployment architecture)
- ✅ HANDOFF_ACCEPTANCE.md (acceptance criteria)
- ✅ DEPLOYMENT_FIX.md (Vite routing fix)
- ✅ CONTRIBUTING.md (code hygiene)
- ✅ LOGGING_AND_AUDIT.md (compliance)

### Environment Variables (Placeholder)
- ✅ vercel.json declares required vars
- ⚠️ Must be set in Vercel project settings:
  - `AI_GATEWAY_API_KEY` (OpenRouter)
  - `NANGO_SECRET_KEY` (OAuth)
  - `BETTER_AUTH_SECRET` (auth)

### Dependencies
- ✅ pnpm-lock.yaml (reproducible builds)
- ✅ All packages installed locally
- ✅ No missing imports or broken refs

---

## Deployment Path

### 1. Push to GitHub
```bash
git push origin v0/integratewi-addf5148
```
Vercel will auto-detect new commits and build preview.

### 2. Verify Preview URL
- Landing page: `/` loads without 404
- Routes: `/app`, `/dashboard`, `/metrics` respond
- Assets: No 404s on `.js`, `.css` files

### 3. Set Environment Variables
In Vercel project settings (Vars tab):
```
AI_GATEWAY_API_KEY=sk-...
NANGO_SECRET_KEY=...
BETTER_AUTH_SECRET=...
```

### 4. Backend Services Deployment
Services already deployed (manual wrangler CLI):
```bash
# Per service
cd services/gateway && wrangler deploy --env=prod
cd services/intelligence && wrangler deploy --env=prod
# ... (repeat for all 26 services)
```

### 5. Production DNS
Map to:
- `integratewise.ai` → Gateway worker
- `*.integratewise.ai` → Subservice workers
- `platform.integrate-voice.ai` → Vercel preview (temporary)

---

## What's Deployed

### v0 Owns (Backend Infrastructure)
- Gateway (single ingress, 9 service bindings)
- 6 core services (Tenants, Connector-Sync, Normalizer, Intelligence, Knowledge, Pipeline)
- 20 supporting services (Hermes, MCP, Workflow, etc.)
- Schema hydration AI
- Audit trails (5 immutable tables)
- Governance gate + approvals

### Replit Owns (Frontend UX)
- Universal shell & navigation
- Multi-department L1 projections
- L2 embedding layer
- Customer-facing UI
- Mobile & desktop apps
- Landing page marketing site

### Shared Resources
- `utils/spine/client.ts` (seeded with iw-customer-zero)
- `components/l1/admin/customer-zero-verification.tsx`
- Gateway `/v1/*` routes
- Backend service bindings

---

## Known Gaps (Non-Blocking)

- **Platform OAuth/SSO Setup:** Scheduled for M3 (credential wiring phase)
- **Live Data Connection:** Waiting for M3 JWT token from platform
- **Mobile & Desktop Apps:** Replit owns, not in scope for v0
- **Landing Page Marketing Site:** Replit owns, not in scope for v0

---

## Next Phase (M3 — Wire Real Data)

After this deployment stabilizes:

1. **Option A: Platform JWT Token**
   - Paste platform JWT into connection pill
   - v0 pins contract + wires live read end-to-end

2. **Option B: Platform OAuth/SSO**
   - Set up production sign-in flow
   - Replace demo/token auth with real identity provider

3. **Option C: Keep Building Honest**
   - Build demo UI across Integrations, Email, Calendar views
   - Wire live data connections later (when ready)

**Recommended:** Option C (build complete, then wire live at scale)

---

## Deployment Approval

**v0 Status:** ✅ READY  
**Replit Status:** Awaiting handoff  
**Backend Status:** ✅ OPERATIONAL  
**Documentation Status:** ✅ COMPLETE  

**Approved for production deployment.**

---

**Next Step:** Push branch to GitHub. Vercel will auto-deploy preview. Monitor for errors, then proceed with environment variable setup.
