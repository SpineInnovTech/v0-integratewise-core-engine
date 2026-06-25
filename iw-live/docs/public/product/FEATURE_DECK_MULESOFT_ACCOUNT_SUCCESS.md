# Feature Deck — Account Success

> Feature-by-feature breakdown of every capability in the Account Success product.
> Universal product. Applied to any industry where you manage accounts, clients, or relationships.

---

## 1. Accounts Hub Features

The daily operating surface for anyone managing accounts — CSMs, account managers, client relationship managers, CAs, property managers, or freelancers.

| Feature          | Description                                                         | Data Sources              |
| ---------------- | ------------------------------------------------------------------- | ------------------------- |
| Account Cards    | Health score, key metric, renewal/due date, last touch, open issues | Any connected CRM/billing |
| Morning Briefing | Auto-generated daily summary of accounts needing attention          | Twin Trigger Engine       |
| Unified Timeline | Chronological stream of all account activity across systems         | All connected sources     |
| Quick Notes      | Log notes, tag stakeholders, attach to account record               | Internal + CRM sync       |
| Deep Dive        | One-click assembly of full account story via Entity 360             | Entity 360 API            |
| Escalation Flow  | Structured escalation with evidence, severity, and routing          | Internal workflow engine  |
| Task Queue       | Prioritized action items from triggers and manual input             | Twin + manual             |
| Contact Map      | Visual map of known stakeholders with role and engagement           | CRM, communication tools  |

### Industry examples

| Industry         | "Account Card" shows                                          |
| ---------------- | ------------------------------------------------------------- |
| MuleSoft / iPaaS | API usage, integration health, renewal date, support tickets  |
| SaaS B2B         | ARR, renewal date, usage trend, support tickets, health score |
| CA Firm          | Pending filings, invoice status, last meeting, compliance due |
| Hospitality      | Guest satisfaction, booking frequency, complaints, revenue    |
| Education        | Attendance rate, grades, parent engagement, intervention flag |
| Retail SMB       | Order frequency, credit outstanding, last purchase, WhatsApp  |
| Freelancer       | Project status, invoice due, last communication, hours logged |

---

## 2. Intelligence Center Features

Portfolio-level analytics for managers, directors, and team leads — across any industry.

| Feature            | Description                                                  | Update Frequency |
| ------------------ | ------------------------------------------------------------ | ---------------- |
| Health Heatmap     | Grid of all accounts colored by health, sized by value       | Real-time        |
| Trigger Feed       | Live stream of fired triggers across the portfolio           | Real-time        |
| Segment Comparison | Health trends by segment (tier, industry, geography, custom) | Daily            |
| Cohort Analysis    | Compare onboarding cohorts by time-to-value and retention    | Weekly           |
| Team Performance   | Response time to triggers, save rate, expansion influence    | Daily            |
| Risk Pipeline      | Accounts progressing through risk stages with dollar values  | Real-time        |
| Renewal Calendar   | Visual calendar of upcoming renewals/due dates with health   | Daily            |
| Custom Reports     | Drag-and-drop report builder with Entity 360 fields          | On demand        |

---

## 3. Strategic View Features

Executive dashboard for VP, C-suite, and board reporting — works for any business.

| Feature               | Description                                       | Audience      |
| --------------------- | ------------------------------------------------- | ------------- |
| Retention Forecast    | Predicted retention for 1/2/4 quarters            | VP, CRO, CEO  |
| Revenue at Risk       | Value-weighted accounts with active risk triggers | CRO, CFO, CEO |
| Retention Trend       | Gross retention trend with segment breakdown      | Board         |
| Health Distribution   | % of portfolio in Green / Yellow / Red bands      | VP, Director  |
| Executive Escalations | Accounts flagged for senior intervention          | VP, C-suite   |
| Board Export          | One-click PDF/PPT export of key metrics           | Board prep    |

---

## 4. Entity 360

The assembled read surface for every entity in the system.

- **Single API endpoint:** `GET /api/entity360/:id`
- **6 layers assembled in parallel:** Truth, Context, Signals, Memory, Goals, Relationships
- **Progressive hydration:** profile loads first (< 100ms), context and signals load async
- **Source attribution:** every field traces back to its origin system and sync timestamp
- **KV cache:** 60-second TTL on Cloudflare edge for hot entities

---

## 5. Twin Trigger Engine

10 triggers that evaluate Entity 360 data. Universal — the trigger logic adapts to the entity type and industry context.

| Trigger             | Universal condition                | SaaS example                        | SMB example                          |
| ------------------- | ---------------------------------- | ----------------------------------- | ------------------------------------ |
| health_drop         | Health score drops 15+ points      | "Acme health fell from 82 to 48"    | "Customer hasn't ordered in 30 days" |
| renewal_approaching | Renewal/due date within threshold  | "Renewal in 32 days, health 48"     | "Credit payment due in 7 days"       |
| engagement_drop     | No activity for extended period    | "No login in 18 days"               | "Regular customer stopped ordering"  |
| arr_change          | Key metric changes significantly   | "ARR dropped 22%"                   | "Monthly sales down 20%"             |
| goal_at_risk        | Linked goal status = at_risk       | "API adoption at 23%"               | "Delivery target missed 3 weeks"     |
| support_escalation  | Multiple open issues               | "8 open tickets, 3 are P1"          | "3 complaints on WhatsApp"           |
| stale_data          | Entity data older than threshold   | "Last sync: 3 days ago"             | "Tally not synced in 3 days"         |
| memory_conflict     | Conflicting AI-generated knowledge | "Conflicting memories about budget" | "Two AIs disagree on payment terms"  |
| context_gap         | High-value entity, missing context | "$125K ARR, no emails linked"       | "Big customer, no WhatsApp history"  |
| signal_cluster      | Multiple critical signals firing   | "5 signals firing simultaneously"   | "Payment failed + order cancelled"   |

Every insight answers 4 questions: What happened. Why it matters. What to do. What happens if you ignore it.

---

## 6. Identity Resolution

Cross-system entity matching and deduplication.

- **Deterministic rules:** email match, domain match, external ID match
- **Probabilistic scoring:** name similarity, firmographic overlap, behavioral patterns
- **HITL review queue:** ambiguous matches surface for human decision
- **Duplicate Resolution UI:** side-by-side field comparison, one-click merge, full undo
- **Match confidence:** every resolved identity carries a confidence score (0–1)

---

## 7. Trust Layer

| Component           | Function                                                             |
| ------------------- | -------------------------------------------------------------------- |
| Source Attribution  | Every field tagged with origin system and sync timestamp             |
| Confidence Scoring  | 0–1 score per field based on source reliability and recency          |
| Conflict Resolution | Configurable: latest-wins, highest-confidence-wins, or manual        |
| Audit Trail         | Full history of every data change with before/after values           |
| Govern Module       | Approval workflows for destructive actions (merge, delete, override) |

---

## 8. Connector Ecosystem

70+ connectors across 13 categories.

| Category      | Connectors                                                                   |
| ------------- | ---------------------------------------------------------------------------- |
| CRM           | Salesforce, HubSpot, Pipedrive, Zoho CRM, Freshsales, Close                  |
| Support       | Zendesk, Freshdesk, Intercom, Front, Help Scout, Kustomer, WhatsApp Business |
| Billing       | Stripe, Chargebee, Paddle, QuickBooks, Xero, FreshBooks                      |
| Analytics     | Google Analytics, Mixpanel, Amplitude, Heap, Tableau, Metabase               |
| Communication | Gmail, Slack, Teams, WhatsApp, Zoom, Discord, Google Calendar                |
| Productivity  | Notion, Google Drive, Dropbox, Airtable, Calendly                            |
| India/UAE     | Tally, Razorpay, PhonePe, Zoho Books, PayTabs (planned)                      |
