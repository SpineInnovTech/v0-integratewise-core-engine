# Verification Checklist — Account Success & BizOps

> 94 checks across data flow, UI rendering, Twin triggers, identity resolution, trust layer, connector filtering, and progressive hydration.

---

## Canonical Surface Boundary Checks

Validate these in addition to the functional checks below:

- customer-facing routes and marketed views resolve to User Workbench projections
- The native Twin (Cloudflare `iw-agent-runtime`) is not exposed or described as the customer-facing product shell
- approvals, HITL queues, and controlled mutation route to governance (embedded in Operational Workbench)
- Twin runtime surfaces use the canonical Forest + Paper system language
- Midnight Executive does not appear in runtime or customer-shell styling

---

## 1. Data Flow (Checks 1–16)

| #   | Check                                             | Flow | Expected Result                                     | Status |
| --- | ------------------------------------------------- | ---- | --------------------------------------------------- | ------ |
| 1   | OAuth token exchange completes                    | A    | Access token stored in encrypted vault              | ☐      |
| 2   | Loader fetches records from source API            | A    | Raw records queued for Normalizer                   | ☐      |
| 3   | Normalizer maps source fields to canonical schema | A    | All required fields populated                       | ☐      |
| 4   | Resolver matches entity to existing record        | A    | Match confidence ≥ threshold or new entity created  | ☐      |
| 5   | Router determines entity type correctly           | A    | Account/Contact/Opportunity routed to correct table | ☐      |
| 6   | Writer persists entity to Spine                   | A    | Row exists in Spine DB with correct workspace_id    | ☐      |
| 7   | Assembler builds Entity 360 response              | B    | All source data merged into single response         | ☐      |
| 8   | Twin receives entity change event                 | C    | Event consumed within 500ms of write                | ☐      |
| 9   | DLQ captures failed pipeline messages             | A    | Failed message in DLQ with stage tag                | ☐      |
| 10  | Retry logic re-processes DLQ messages             | A    | Message re-enters pipeline at correct stage         | ☐      |
| 11  | Rate limiting respects source API limits          | A    | No 429 errors from source APIs                      | ☐      |
| 12  | Incremental sync fetches only changed records     | A    | Sync uses last_modified cursor                      | ☐      |
| 13  | Full sync fetches all records                     | A    | Complete dataset loaded on first sync               | ☐      |
| 14  | Webhook ingestion processes real-time events      | A    | Webhook payload normalized within 2s                | ☐      |
| 15  | Multi-workspace isolation enforced                | A    | Workspace A cannot read Workspace B data            | ☐      |
| 16  | Pipeline metrics emitted per stage                | A    | Latency, throughput, error rate per Worker          | ☐      |

---

## 2. UI Rendering (Checks 17–34)

| #   | Check                                           | View         | Expected Result                                    | Status |
| --- | ----------------------------------------------- | ------------ | -------------------------------------------------- | ------ |
| 17  | CSM Hub loads account cards                     | CSM Hub      | Cards render with health, ARR, renewal date        | ☐      |
| 18  | Morning briefing displays triggered accounts    | CSM Hub      | Top 3–5 accounts with severity badges              | ☐      |
| 19  | Unified timeline renders events chronologically | CSM Hub      | Events from all sources in time order              | ☐      |
| 20  | QBR prep assembles in < 15 seconds              | CSM Hub      | Full account story with metrics and talking points | ☐      |
| 21  | Health heatmap renders all accounts             | Intelligence | Grid colored by health, sized by ARR               | ☐      |
| 22  | Trigger feed updates in real-time               | Intelligence | New triggers appear without page refresh           | ☐      |
| 23  | Segment comparison chart renders                | Intelligence | Enterprise / Mid-Market / SMB health trends        | ☐      |
| 24  | NRR forecast displays correctly                 | Strategic    | Predicted NRR for 1/2/4 quarters                   | ☐      |
| 25  | Revenue at risk table sorts by dollar value     | Strategic    | Highest ARR at risk at top                         | ☐      |
| 26  | Founder Cockpit loads all widgets               | BizOps       | ARR, burn, runway, pipeline, team pulse            | ☐      |
| 27  | CEO View renders revenue trajectory             | BizOps       | Revenue waterfall chart with trend line            | ☐      |
| 28  | COO View shows operational metrics              | BizOps       | Cycle times, bottlenecks, utilization              | ☐      |
| 29  | CIO View displays connector health              | BizOps       | Sync status, error rates, throughput               | ☐      |
| 30  | Entity 360 profile loads in < 200ms             | Entity 360   | Profile section renders first (progressive)        | ☐      |
| 31  | Entity 360 timeline loads async                 | Entity 360   | Timeline appears after profile without blocking    | ☐      |
| 32  | Duplicate Resolution UI shows side-by-side      | Identity     | Two entity cards with field comparison             | ☐      |
| 33  | Trust badges display on all data fields         | All views    | Source icon + confidence score visible             | ☐      |
| 34  | Responsive layout works on tablet               | All views    | No horizontal scroll, readable at 768px            | ☐      |

---

## 3. Twin Triggers (Checks 35–50)

| #   | Check                                 | Trigger Type     | Expected Result                                    | Status |
| --- | ------------------------------------- | ---------------- | -------------------------------------------------- | ------ |
| 35  | Usage decline trigger fires           | usage_decline    | Insight created when usage drops > 30%             | ☐      |
| 36  | Support spike trigger fires           | support_spike    | Insight created for 3+ P1 tickets in 7 days        | ☐      |
| 37  | Champion left trigger fires           | champion_left    | Insight created when key contact departs           | ☐      |
| 38  | Renewal risk trigger fires            | renewal_risk     | Insight for renewal < 60 days + health < 50        | ☐      |
| 39  | Expansion signal trigger fires        | expansion_signal | Insight for seat utilization > 85%                 | ☐      |
| 40  | Onboarding stall trigger fires        | onboarding_stall | Insight for no milestone in 30 days                | ☐      |
| 41  | Billing anomaly trigger fires         | billing_anomaly  | Insight for failed payment or downgrade            | ☐      |
| 42  | Engagement drop trigger fires         | engagement_drop  | Insight for zero logins in 14 days                 | ☐      |
| 43  | Trigger does not write to Spine       | All              | twin_insights table only, no Spine mutation        | ☐      |
| 44  | Trigger includes evidence chain       | All              | Evidence field references source data points       | ☐      |
| 45  | Trigger severity is correct           | All              | Critical/High/Medium/Low matches rules             | ☐      |
| 46  | Duplicate triggers suppressed         | All              | Same trigger for same entity within 24h ignored    | ☐      |
| 47  | Trigger routes to correct view        | All              | CSM Hub for individual, Intelligence for portfolio | ☐      |
| 48  | Custom trigger evaluates correctly    | custom           | User-defined condition produces insight            | ☐      |
| 49  | Trigger latency < 500ms               | All              | Time from entity write to insight creation         | ☐      |
| 50  | Trigger disabled/enabled toggle works | All              | Disabled trigger does not fire                     | ☐      |

---

## 4. Identity Resolution (Checks 51–62)

| #   | Check                                   | Expected Result                                    | Status |
| --- | --------------------------------------- | -------------------------------------------------- | ------ |
| 51  | Email-based deterministic match         | Same email across systems resolves to one entity   | ☐      |
| 52  | Domain-based deterministic match        | Same domain resolves account entities              | ☐      |
| 53  | External ID match (SF ID ↔ Zendesk org) | Cross-system IDs resolve correctly                 | ☐      |
| 54  | Probabilistic name match                | "Acme Corp" and "Acme Corporation" resolve         | ☐      |
| 55  | Low-confidence match goes to HITL queue | Confidence 0.5–0.8 surfaces for review             | ☐      |
| 56  | HITL approval merges entities           | Approved match creates unified entity              | ☐      |
| 57  | HITL rejection keeps entities separate  | Rejected match adds to exclusion list              | ☐      |
| 58  | Merge undo restores original entities   | Undo within 72 hours fully reverses merge          | ☐      |
| 59  | Confidence score visible in Entity 360  | Match confidence shown in trust metadata           | ☐      |
| 60  | No false merges on common names         | "John Smith" at different companies stays separate | ☐      |
| 61  | Batch resolution processes backlog      | Queued matches processed within SLA                | ☐      |
| 62  | Resolution metrics tracked              | Match rate, HITL volume, false positive rate       | ☐      |

---

## 5. Trust Layer (Checks 63–72)

| #   | Check                                     | Expected Result                               | Status |
| --- | ----------------------------------------- | --------------------------------------------- | ------ |
| 63  | Source attribution on every field         | Origin system and sync timestamp present      | ☐      |
| 64  | Confidence score calculated correctly     | Score reflects source reliability × recency   | ☐      |
| 65  | Conflict resolution: latest-wins          | Most recent value wins when configured        | ☐      |
| 66  | Conflict resolution: highest-confidence   | Highest confidence value wins when configured | ☐      |
| 67  | Conflict resolution: manual               | Conflict surfaces for human decision          | ☐      |
| 68  | Audit trail records all changes           | Before/after values with timestamp and actor  | ☐      |
| 69  | Govern approval blocks destructive action | Merge/delete blocked until approved           | ☐      |
| 70  | Govern approval chain completes           | Multi-step approval resolves correctly        | ☐      |
| 71  | Govern rejection cancels action           | Rejected action does not execute              | ☐      |
| 72  | Trust metadata in Entity 360 response     | Sources array and lastSync in API response    | ☐      |

---

## 6. Connector Filtering & Progressive Hydration (Checks 73–84)

| #   | Check                                  | Expected Result                                 | Status |
| --- | -------------------------------------- | ----------------------------------------------- | ------ |
| 73  | Connector filter by category works     | CRM / Support / Billing filters correctly       | ☐      |
| 74  | Connector filter by status works       | Active / Paused / Error filters correctly       | ☐      |
| 75  | Connector search by name works         | Typing "Sales" shows Salesforce, SalesLoft      | ☐      |
| 76  | Connector detail shows sync history    | Last 10 syncs with status and record count      | ☐      |
| 77  | Connector pause/resume works           | Paused connector stops syncing, resume restarts | ☐      |
| 78  | Connector error state displays         | Failed connector shows error message and retry  | ☐      |
| 79  | Progressive hydration: profile first   | Entity 360 profile renders in < 200ms           | ☐      |
| 80  | Progressive hydration: timeline async  | Timeline loads without blocking profile         | ☐      |
| 81  | Progressive hydration: insights async  | Insights load without blocking profile          | ☐      |
| 82  | Progressive hydration: skeleton states | Loading skeletons shown for async sections      | ☐      |
| 83  | Progressive hydration: error fallback  | Failed section shows retry button, not crash    | ☐      |
| 84  | Progressive hydration: cache hit       | Cached Entity 360 serves in < 50ms              | ☐      |

---

## 7. Cross-Cutting (Checks 85–94)

| #   | Check                                  | Expected Result                                     | Status |
| --- | -------------------------------------- | --------------------------------------------------- | ------ |
| 85  | RLS enforces workspace isolation       | Query with wrong workspace_id returns 0 rows        | ☐      |
| 86  | Auth token refresh works               | Expired token auto-refreshes without user action    | ☐      |
| 87  | Rate limiting on API endpoints         | 429 returned after threshold exceeded               | ☐      |
| 88  | CORS configured correctly              | Only allowed origins can call API                   | ☐      |
| 89  | Error responses follow standard format | `{ error: string, code: string, details?: object }` | ☐      |
| 90  | Pagination works on list endpoints     | Cursor-based pagination returns correct pages       | ☐      |
| 91  | Webhook signature validation           | Invalid signatures rejected with 401                | ☐      |
| 92  | Health endpoints respond               | All 21 Workers return 200 on /health                | ☐      |
| 93  | Logging structured and searchable      | JSON logs with request_id, workspace_id, stage      | ☐      |
| 94  | Feature flags gate unreleased features | Disabled flag hides feature from UI and API         | ☐      |
