# Troubleshooting: "Failed to load connectors" in Onboarding

> **Issue**: Onboarding flow shows "Failed to load connectors" error at Step 4  
> **Date**: 2026-05-29  
> **Status**: Fixed with fallback mechanism

---

## Problem

Users see "Failed to load connectors" error during onboarding at the Connectors step (Step 4 of 4-screen flow).

### Error Details

```
Failed to load connectors
Retry
```

### Root Cause

The onboarding flow calls `/api/v1/workspace/connectors` which routes through:

```
Frontend → Gateway → BFF (workflow service) → getWorkspaceConnectors()
```

Possible failure points:

1. **BFF service not deployed** — `integratewise-bff` Worker not running
2. **Service binding missing** — Gateway doesn't have BFF binding configured
3. **Network timeout** — BFF service taking too long to respond
4. **Spine DB connection failure** — BFF can't read tenant config
5. **Catalog function error** — `getSerializableCatalog()` throws exception

---

## Solution Implemented

### 1. Fallback Mechanism (Frontend)

Added automatic fallback to `/api/v1/connectors/catalog` if BFF endpoint fails:

```typescript
// Try workspace endpoint first (BFF service)
try {
  const data = await apiFetch("/api/v1/workspace/connectors");
  setCatalog(data.connectors || []);
} catch (err) {
  // Fallback to connector catalog endpoint if BFF is unavailable
  try {
    const fallbackData = await apiFetch("/api/v1/connectors/catalog");
    setCatalog(fallbackData.connectors || []);
  } catch (fallbackErr) {
    setError("Failed to load connectors. Please check your network connection...");
  }
}
```

### 2. Improved Error UI

Enhanced error state with:

- Clear error message
- Retry button
- Skip button (allows user to continue without connectors)
- Helpful hint about connecting tools later

---

## Verification Steps

### 1. Check BFF Service Status

```bash
# Check if BFF Worker is deployed
wrangler deployments list --name integratewise-bff

# Test BFF endpoint directly
curl https://gateway.integratewise.ai/api/v1/workspace/connectors \
  -H "Authorization: Bearer <JWT>" \
  -H "x-tenant-id: <tenant-id>"
```

### 2. Check Gateway Service Binding

```bash
# Verify BFF binding exists in Gateway wrangler.toml
grep -A 2 "binding = \"BFF\"" services/gateway/wrangler.toml

# Expected output:
# [[services]]
# binding = "BFF"
# service = "integratewise-bff"
```

### 3. Check Connector Catalog Fallback

```bash
# Test fallback endpoint
curl https://gateway.integratewise.ai/api/v1/connectors/catalog \
  -H "Authorization: Bearer <JWT>" \
  -H "x-tenant-id: <tenant-id>"
```

---

## Deployment Checklist

To prevent this error:

- [ ] Deploy BFF Worker: `cd services/workflow && wrangler deploy --env production`
- [ ] Verify Gateway has BFF service binding in wrangler.toml
- [ ] Verify BFF Worker has all required bindings:
  - `SPINE_URL`
  - `SPINE_ANON_KEY`
  - Service bindings: `SPINE`, `CONNECTOR`, `KNOWLEDGE`, `THINK`, `ACT`
  - D1 binding: `ANALYTICS_DB`
  - KV bindings: `CONNECTION_META`, `RATE_LIMIT`
- [ ] Test onboarding flow end-to-end
- [ ] Verify fallback mechanism works (temporarily disable BFF to test)

---

## Monitoring

### Key Metrics to Watch

1. **Connector Load Success Rate**
   - Track: `onboarding_connectors_loaded` vs `onboarding_connectors_failed`
   - Alert if failure rate > 5%

2. **BFF Service Health**
   - Track: `/api/v1/workspace/connectors` response time
   - Alert if p95 > 2s or error rate > 1%

3. **Fallback Usage**
   - Track: How often fallback endpoint is used
   - High fallback usage indicates BFF reliability issues

### Logging

```typescript
// Frontend logs (check browser console)
[ConnectorsStep] Both endpoints failed: {
  primary: Error("Failed to load connectors"),
  fallback: Error("Network error")
}

// BFF logs (check Cloudflare Workers logs)
[BFF] getWorkspaceConnectors error: <error details>
```

---

## Related Files

- **Frontend**: `/apps/web/src/components/activation/onboarding/steps/ConnectorsStep.tsx`
- **BFF Service**: `/services/workflow/src/index.ts` (getWorkspaceConnectors function)
- **Gateway Routing**: `/services/gateway/src/index.ts` (routes /api/v1/workspace/\* to BFF)
- **Connector Catalog**: `/services/connector/src/index.ts` (fallback endpoint)

---

## Future Improvements

1. **Retry with Exponential Backoff**
   - Automatically retry failed requests 2-3 times before showing error

2. **Offline Mode**
   - Cache connector catalog in localStorage
   - Show cached data if API fails

3. **Progressive Enhancement**
   - Load connectors in background while showing skeleton UI
   - Allow user to proceed even if connectors haven't loaded yet

4. **Better Error Messages**
   - Distinguish between network errors, auth errors, and service errors
   - Provide specific troubleshooting steps based on error type

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-29  
**Author**: Kiro (Troubleshooting Guide)  
**Status**: Fixed — Fallback mechanism deployed
