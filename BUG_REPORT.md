# IntegrateWise OS - Comprehensive Bug Report

**Report Date:** December 18, 2025  
**Tested Version:** v54 (restored from v52)  
**Tester:** Automated E2E Test

---

## Executive Summary

After comprehensive testing of the IntegrateWise OS platform, **12 issues** were identified across 5 severity levels. The system is functional for basic operations but has several issues that affect production readiness.

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 3 |
| Medium | 4 |
| Low | 3 |

---

## 1. LOGIN FLOW ISSUES

### BUG-001: Demo Login Session Not Persisting Across Page Refresh (HIGH)

**Status:** Identified  
**Severity:** High  
**Component:** `app/auth/login/page.tsx`, `lib/supabase/proxy.ts`

**Description:**  
Demo login sets a cookie but the session may not persist correctly across hard page refreshes in some browsers due to cookie SameSite restrictions.

**Steps to Reproduce:**
1. Go to `/auth/login`
2. Click "Use Demo Account"
3. Submit the form
4. Hard refresh the page (Ctrl+F5)
5. May be redirected back to login

**Expected:** User stays logged in  
**Actual:** User may be logged out on refresh

**Root Cause:**  
Cookie set with `samesite=lax` and `router.refresh()` may not properly await cookie write.

**Recommended Fix:**
```typescript
// In login/page.tsx handleLogin
document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 7}; samesite=strict`
await new Promise(resolve => setTimeout(resolve, 100)) // Allow cookie to set
router.push("/")
```

---

### BUG-002: Invalid Credentials Error Message Not User-Friendly (LOW)

**Status:** Identified  
**Severity:** Low  
**Component:** `app/auth/login/page.tsx`

**Description:**  
When Supabase returns an auth error, the raw error message is shown to users.

**Steps to Reproduce:**
1. Enter invalid credentials
2. Submit form
3. See raw Supabase error like "Invalid login credentials"

**Expected:** User-friendly message  
**Actual:** Technical error message

**Recommended Fix:**
```typescript
setError("Invalid email or password. Please try again.")
```

---

## 2. DASHBOARD ISSUES

### BUG-003: Health Score Hardcoded to 8/10 (MEDIUM)

**Status:** Identified  
**Severity:** Medium  
**Component:** `components/views/home-view.tsx`

**Description:**  
The health score displayed on the dashboard is hardcoded and doesn't calculate from actual business metrics.

**Steps to Reproduce:**
1. Navigate to home dashboard
2. Observe health score card shows "8/10"
3. Change business data
4. Health score remains "8/10"

**Expected:** Dynamic health score based on MRR, pipeline, client health  
**Actual:** Static "8/10" display

**Code Location:** Line ~150 in home-view.tsx
```tsx
<p className="text-5xl font-bold">8/10</p>
```

**Recommended Fix:**  
Create health score calculation function based on:
- MRR target achievement
- Pipeline health
- Client NPS scores
- Deal conversion rates

---

### BUG-004: AI Insights Hardcoded (MEDIUM)

**Status:** Identified  
**Severity:** Medium  
**Component:** `components/views/home-view.tsx`

**Description:**  
AI insights are hardcoded strings, not generated from actual AI analysis.

**Code Location:** Line ~55
```tsx
const aiInsights = ["Revenue on track", "Pipeline declining urgent", "DM response down"]
```

**Recommended Fix:**  
Connect to `/api/brainstorm/daily-insights` to fetch real AI-generated insights.

---

### BUG-005: Webhook Scheduler Widget Fails When Table Missing (HIGH)

**Status:** Fixed in v54  
**Severity:** High  
**Component:** `components/widgets/webhook-scheduler-widget.tsx`

**Description:**  
Widget throws error when `webhook_notifications` table doesn't exist.

**Status:** Already fixed with graceful fallback to "Not Configured" state.

---

## 3. DATA INGESTION ISSUES

### BUG-006: Missing leads.first_name/last_name Fields (CRITICAL)

**Status:** Identified  
**Severity:** Critical  
**Component:** `components/views/leads-view.tsx`, Database Schema

**Description:**  
The LeadsView component references `lead.first_name` and `lead.last_name`, but the database schema only has a `name` field.

**Database Schema:**
```sql
-- leads table has: name (text), NOT first_name, last_name
```

**Code References:**
```tsx
// leads-view.tsx line ~128
{lead.first_name} {lead.last_name}
// Also line ~130
{lead.first_name?.[0]}{lead.last_name?.[0]}
```

**Impact:** Lead names may not display correctly

**Recommended Fix:**  
Option A: Update component to use `lead.name`
Option B: Run migration to split name into first_name, last_name

---

### BUG-007: HubSpot Sync Uses Simulated Data (MEDIUM)

**Status:** Identified  
**Severity:** Medium  
**Component:** `app/api/hubspot/sync/route.ts`

**Description:**  
HubSpot sync API uses hardcoded sample data instead of real HubSpot API calls.

**Code Location:** Lines 28-31
```typescript
const hubspotContacts = [
  { id: "hs_1001", firstname: "New", lastname: "Contact", ... },
  { id: "hs_1002", firstname: "Another", lastname: "Lead", ... },
]
```

**Recommended Fix:**  
Implement actual HubSpot API integration when `HUBSPOT_ACCESS_TOKEN` is configured.

---

## 4. CRM FUNCTIONALITY ISSUES

### BUG-008: Add Lead Button Has No Functionality (HIGH)

**Status:** Identified  
**Severity:** High  
**Component:** `components/views/leads-view.tsx`

**Description:**  
The "Add Lead" button in the leads view doesn't open a form or trigger any action.

**Code Location:** Line ~45
```tsx
<Button className="bg-primary hover:bg-primary/90">
  <Plus className="h-4 w-4 mr-2" />
  Add Lead
</Button>
```

**Impact:** Users cannot create new leads through the UI

**Recommended Fix:**  
Add dialog form similar to Strategic Hub's goal creation pattern.

---

### BUG-009: Lead Score Not Editable (LOW)

**Status:** Identified  
**Severity:** Low  
**Component:** `components/views/leads-view.tsx`

**Description:**  
Lead scores are displayed but cannot be manually adjusted by users.

**Recommended Fix:**  
Add inline edit or dropdown to adjust lead scores.

---

## 5. INTEGRATION ISSUES

### BUG-010: Slack Webhook Missing brainstorm_chats Table (CRITICAL)

**Status:** Identified  
**Severity:** Critical  
**Component:** `app/api/webhooks/slack/route.ts`

**Description:**  
Slack webhook tries to insert into `brainstorm_chats` table which doesn't exist in the database schema.

**Database Check:** Table `brainstorm_chats` not found in schema (only `brainstorm_sessions` and `brainstorm_insights` exist)

**Code Location:** Lines 53-65
```typescript
await supabase.from("brainstorm_chats").insert({
  source: "slack",
  ...
})
```

**Impact:** Slack message ingestion fails silently

**Recommended Fix:**  
Either create the `brainstorm_chats` table or update code to use `brainstorm_sessions`.

---

### BUG-011: Discord Webhook Has Same brainstorm_chats Issue (CRITICAL)

**Status:** Identified  
**Severity:** Critical  
**Component:** `app/api/webhooks/discord/route.ts`

**Same issue as BUG-010**

---

### BUG-012: Cron Job Authorization May Fail Without Secret (LOW)

**Status:** Identified  
**Severity:** Low  
**Component:** `app/api/cron/hourly-insights/route.ts`

**Description:**  
Cron job requires `CRON_SECRET` but fails silently if not configured in Vercel.

**Code Location:** Lines 6-9
```typescript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

**Recommended Fix:**  
Add helpful error message when CRON_SECRET is not configured.

---

## 6. STRATEGIC HUB ISSUES

### BUG-013: Goals Tab May Show Empty If Tables Not Seeded (MEDIUM)

**Status:** Identified  
**Severity:** Medium  
**Component:** `components/views/strategic-hub-view.tsx`

**Description:**  
Strategic Hub tabs show empty states if the corresponding tables haven't been seeded with data.

**Affected Tables:**
- `business_goals`
- `company_values`
- `tools_registry`
- `roi_tracking`

**Recommended Fix:**  
Add empty state UI with "Add your first goal" prompts.

---

## Missing Tables Summary

Based on code analysis vs database schema, these tables are referenced but may not exist:

| Table Referenced | Exists | Used By |
|------------------|--------|---------|
| `brainstorm_chats` | NO | Slack/Discord webhooks |
| `webhook_notifications` | NO | Webhook scheduler |
| `hubspot_sync_log` | NO | HubSpot sync |
| `form_submissions` | NO | HubSpot sync |
| `conversion_funnel` | NO | HubSpot sync |
| `website_pages` | NO | Website manager |
| `website_visitors` | NO | Website manager |

---

## Recommended Priority Fixes

### Immediate (Critical):
1. Create missing `brainstorm_chats` table or update webhook routes
2. Update leads-view to use correct `name` field instead of `first_name`/`last_name`

### Short-term (High):
3. Add "Add Lead" dialog functionality
4. Fix demo session persistence
5. Run all SQL migration scripts (019-026)

### Medium-term:
6. Implement dynamic health score calculation
7. Connect AI insights to actual AI service
8. Implement real HubSpot API integration

### Long-term:
9. Add comprehensive empty states
10. Improve error messages throughout
11. Add lead score editing
12. Add cron secret validation feedback

---

## Test Coverage Recommendations

1. Add unit tests for Supabase client creation
2. Add integration tests for webhook processing
3. Add E2E tests for demo login flow
4. Add schema validation tests to catch missing tables early

---

**Report Generated:** December 18, 2025
**Next Review:** After critical fixes applied
