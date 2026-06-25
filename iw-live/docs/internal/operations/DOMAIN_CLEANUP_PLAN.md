# Domain Cleanup Plan

## IntegrateWise Worker Domains — Post Deep Code Analysis

> **Date**: 2026-05-29  
> **Status**: Ready for Execution  
> **Priority**: High (Enforces Gateway-Only Architecture)

---

## Executive Summary

Based on the deep code analysis, we need to clean up Worker domains to enforce the **Gateway-Only Entry Point** architecture. This plan retires duplicate endpoints, removes staging route overlaps, and establishes `platform.integratewise.ai` as the internal ops console.

---

## 1. Retire `api.integratewise.online`

### Current State

- Custom domain: `api.integratewise.online`
- Points to: `hub-api-prod` Worker
- Status: Operational but redundant

### Problem

- Violates "Gateway is the ONLY entry point" principle
- Creates confusion about which API endpoint to use
- Potential security bypass if JWT validation differs
- Maintenance burden for duplicate routing logic

### Action Plan

```bash
# Execute cleanup script
cd /Users/nirmal/Github/integratewise-live/scripts
chmod +x cleanup-api-online-domain.sh
./cleanup-api-online-domain.sh
```

### Steps

1. ✅ Remove custom domain from `hub-api-prod` Worker
2. ✅ Set up 301 redirect: `api.integratewise.online` → `gateway.integratewise.ai`
3. ✅ Update any hardcoded references in:
   - Frontend code (check for `VITE_API_BASE_URL` overrides)
   - Documentation
   - External integrations
   - Postman collections / API clients

### Verification

```bash
# Test redirect
curl -I https://api.integratewise.online/health
# Should return: 301 Moved Permanently
# Location: https://gateway.integratewise.ai/health
```

---

## 2. Clean Up Staging Route Overlaps

### Current State

Staging Workers accessible via **both**:

- Custom domain: `staging-hooks.integratewise.ai`
- Route pattern: `loader-staging.integratewise.ai/*`

### Problem

- Violates "single entry point per service" principle
- Creates confusion about which hostname to use
- Staging should mirror production architecture

### Action Plan

```bash
# Execute cleanup script
cd /Users/nirmal/Github/integratewise-live/scripts
chmod +x cleanup-staging-route-overlaps.sh
./cleanup-staging-route-overlaps.sh
```

### Affected Services

| Worker                          | Keep (Custom Domain)               | Remove (Route Pattern)               |
| ------------------------------- | ---------------------------------- | ------------------------------------ |
| `integratewise-loader-staging`  | `staging-loader.integratewise.ai`  | `loader-staging.integratewise.ai/*`  |
| `integratewise-hooks-staging`   | `staging-hooks.integratewise.ai`   | `hooks-staging.integratewise.ai/*`   |
| `integratewise-gateway-staging` | `staging-gateway.integratewise.ai` | `gateway-staging.integratewise.ai/*` |

### Verification

```bash
# Test staging services via custom domains only
curl https://staging-gateway.integratewise.ai/health
curl https://staging-hooks.integratewise.ai/health
curl https://staging-loader.integratewise.ai/health

# Verify route patterns are removed (should 404)
curl https://gateway-staging.integratewise.ai/health
# Expected: 404 or no route found
```

---

## 3. Create `platform.integratewise.ai`

### Purpose

Internal operations dashboard for:

- Tenant management (create, update, delete)
- Worker health monitoring
- Pipeline queue inspection
- Quarantine record review
- Merge candidate approval (HITL)
- Connector status overview
- System metrics and logs

### Action Plan

```bash
# Execute setup script
cd /Users/nirmal/Github/integratewise-live/scripts
chmod +x setup-platform-domain.sh
./setup-platform-domain.sh
```

### Steps

1. ✅ Attach custom domain `platform.integratewise.ai` to `integratewise-admin` Worker
2. ✅ Configure Cloudflare Access (email allowlist)
3. ✅ Verify Worker has all necessary bindings:
   - `SPINE_URL`
   - `SPINE_ANON_KEY`
   - D1 binding: `CACHE_DB`
   - KV bindings: `CACHE`, `METRICS`, `CONNECTOR_STATUS`
   - Service bindings: `PIPELINE`, `INTELLIGENCE`, `KNOWLEDGE`

### Cloudflare Access Configuration

```yaml
Application Name: IntegrateWise Platform (Internal Ops)
Subdomain: platform
Domain: integratewise.ai
Session Duration: 24 hours

Policy:
  Name: Email Allowlist
  Action: Allow
  Include:
    - Emails: nirmal@integratewise.ai
    - Emails: (add other team members)
```

### Verification

```bash
# Test access (should redirect to Cloudflare Access login)
curl -I https://platform.integratewise.ai

# After login, test admin endpoints
curl https://platform.integratewise.ai/admin/tenants
curl https://platform.integratewise.ai/admin/health
```

---

## 4. Set Up `docs.integratewise.ai`

### Current State

- Not deployed
- Documentation lives in `integratewise-docs` repo (public) and `BrandDocumentations` repo (internal)

### Recommendation

**Static site deployment** (not a Worker)

### Action Plan

#### Option A: GitHub Pages (Public Docs)

```bash
# In integratewise-docs repo
# 1. Enable GitHub Pages in repo settings
# 2. Set custom domain: docs.integratewise.ai
# 3. Add CNAME record in Cloudflare DNS:
#    docs.integratewise.ai → integratewise.github.io
```

#### Option B: Cloudflare Pages (Recommended)

```bash
# 1. Connect integratewise-docs repo to Cloudflare Pages
# 2. Build command: (depends on static site generator)
# 3. Output directory: (depends on static site generator)
# 4. Custom domain: docs.integratewise.ai
```

### Verification

```bash
# Test docs site
curl https://docs.integratewise.ai
# Should return HTML (not JSON)
```

---

## Updated Endpoint Map (Post-Cleanup)

### Production (Public)

```
app.integratewise.ai              → React SPA (Cloudflare Pages)
gateway.integratewise.ai          → Gateway Worker (ONLY API entry)
mcp.integratewise.ai              → MCP Connector Worker
hooks.integratewise.ai            → Webhook Ingress Worker
docs.integratewise.ai             → Static site (GitHub Pages / Cloudflare Pages)
```

### Production (Internal)

```
platform.integratewise.ai         → Admin Worker (Cloudflare Access gated)
think.integratewise.ai            → Intelligence Worker
knowledge.integratewise.ai        → Knowledge Worker
spine.integratewise.ai            → Pipeline Worker (read-only API)
continuity.integratewise.ai       → Continuity Worker
```

### Staging

```
staging-gateway.integratewise.ai  → Gateway Worker (staging)
staging-hooks.integratewise.ai    → Webhook Ingress Worker (staging)
staging-loader.integratewise.ai   → Loader Worker (staging)
(All route patterns removed)
```

### Retired

```
❌ api.integratewise.online       → 301 redirect to gateway.integratewise.ai
```

---

## Execution Checklist

### Phase 1: Immediate (Today)

- [ ] Run `cleanup-api-online-domain.sh`
- [ ] Verify redirect: `api.integratewise.online` → `gateway.integratewise.ai`
- [ ] Update hardcoded references in codebase
- [ ] Run `cleanup-staging-route-overlaps.sh`
- [ ] Test staging services via custom domains only

### Phase 2: This Week

- [ ] Run `setup-platform-domain.sh`
- [ ] Configure Cloudflare Access for `platform.integratewise.ai`
- [ ] Verify admin Worker bindings
- [ ] Test platform dashboard access
- [ ] Set up `docs.integratewise.ai` (GitHub Pages or Cloudflare Pages)

### Phase 3: Verification

- [ ] All services accessible via custom domains only
- [ ] No duplicate route patterns in staging
- [ ] Gateway is the ONLY public API entry point
- [ ] Platform dashboard accessible with email auth
- [ ] Documentation site live at `docs.integratewise.ai`

---

## Rollback Plan

If issues arise:

### Rollback `api.integratewise.online` Retirement

```bash
# Re-attach custom domain
wrangler deployments domain add api.integratewise.online --name hub-api-prod

# Remove redirect rule in Cloudflare Dashboard
```

### Rollback Staging Route Cleanup

```bash
# Re-add route patterns
wrangler routes add "loader-staging.integratewise.ai/*" --name integratewise-loader-staging --env staging
wrangler routes add "hooks-staging.integratewise.ai/*" --name integratewise-hooks-staging --env staging
```

### Rollback Platform Domain

```bash
# Remove custom domain
wrangler deployments domain remove platform.integratewise.ai --name integratewise-admin

# Delete Cloudflare Access application
```

---

## Success Criteria

✅ **Gateway-Only Architecture Enforced**

- All API traffic goes through `gateway.integratewise.ai`
- No duplicate API endpoints

✅ **Staging Mirrors Production**

- Each staging service has ONE custom domain
- No route pattern overlaps

✅ **Internal Ops Console Established**

- `platform.integratewise.ai` accessible with email auth
- Admin features available for tenant/worker management

✅ **Documentation Site Live**

- `docs.integratewise.ai` serves public documentation
- Static site deployment (not Worker)

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-29  
**Author**: Kiro (Infrastructure Cleanup)  
**Review Status**: Ready for Execution
