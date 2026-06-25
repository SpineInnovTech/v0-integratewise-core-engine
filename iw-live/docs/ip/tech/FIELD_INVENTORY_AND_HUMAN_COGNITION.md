# IntegrateWise — Complete Field Inventory & Human Cognition Layer

> **Version:** 2.0 | **Date:** May 29, 2026 | **Classification:** Internal — Engineering + Product
> **Source of truth:** `packages/types/src/schema.ts` (DOMAIN_SPINE_CONFIG + DEFAULT_FIELD_POLICIES), `packages/spineDb/migrations/001_core_schema.sql`, `032_governed_proposals.sql`
> **Owner:** Nirmal, Founder

---

## Part I — The Core Insight

The existing field inventory is built around data entities — the engineering way of thinking.
A founder, COO, or ops lead doesn't think "show me the `opportunity` entity with `stage` and `probability` fields."
They think in **questions, situations, and moments of anxiety.**

> **Data systems model entities. Humans model situations.**

The entire gap between "a CRM that nobody likes using" and "a tool that feels like it thinks like me" lives in this distinction.

### The Five Cognitive Modes

Every human cycles through these modes in a single morning. The system must meet them in whichever mode they're in right now.

| Mode           | Question                                        | What it needs                              |
| -------------- | ----------------------------------------------- | ------------------------------------------ |
| **Understand** | "Explain the situation to me"                   | Pulse check + narrative story per entity   |
| **Act**        | "What needs my attention right now?"            | Triage list + decision queue, cross-domain |
| **Plan**       | "What's the timeline of commitments?"           | Forward view + accountability check        |
| **Connect**    | "Who's involved and what's their state?"        | Relationship graph, not contact records    |
| **Reflect**    | "Why did we do it this way, what did we learn?" | Decisions log + post-mortems + win/loss    |

These are not tabs. Not pages. One interface that shifts emphasis.

### "My Desk" — The Contract With the User

The implicit promise: "open this and you will know what you need to know to do your job today."

```
FIRES (things broken or about to break)
  - Overdue tasks assigned to me
  - Commitments I made that are past due
  - Accounts / deals that went quiet (no activity in X days)
  - Approvals waiting on me (with age)
  - Blockers I own that are unresolved

FOCUS (what I'm working on today)
  - Tasks due today
  - Meetings today (with prep context: who, what account, last touchpoint)
  - Proposals / contracts awaiting response

FOLLOWING (things I'm watching but don't own)
  - Deals I'm involved in
  - Projects I'm a stakeholder on
  - Accounts I care about

FORWARD (what's coming that I need to prepare for)
  - Renewals in 30 days
  - Deadlines in 7 days
  - Commitments due this week
```

---

## Part II — Spine Schema: Core Tables (001_core_schema.sql)

These are the actual Spine DB tables. Every domain projection reads from these.

### `entities` — The Universal Entity Store

```
id                UUID PK
tenant_id         UUID FK → tenants
entity_type       TEXT  -- account | contact | deal | task | project | meeting | document | (100+ types)
name              TEXT
slug              TEXT
source            TEXT  -- hubspot | salesforce | manual | csv | mcp
source_id         TEXT  -- ID in source system
data              JSONB -- all normalized entity fields (priority_fields from schema)
tags              TEXT[]
status            TEXT  -- active | inactive | archived
health_score      NUMERIC(3,2)  -- 0.00 to 1.00
last_synced_at    TIMESTAMPTZ
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

Unique index: `(tenant_id, source, source_id)` — idempotent upsert.

### `signals` — Think Engine Outputs

```
id            UUID PK
tenant_id     UUID FK
signal_type   TEXT  -- health_change | churn_risk | engagement_drop | anomaly | opportunity
severity      TEXT  -- critical | high | medium | low | info
title         TEXT
description   TEXT
entity_id     UUID FK → entities
goal_refs     UUID[]
evidence      JSONB -- { source, data, confidence: 0.85 }
agent_id      TEXT  -- AGT-001 etc
status        TEXT  -- active | acknowledged | resolved | dismissed
created_at    TIMESTAMPTZ
```

### `actions` — Act Engine (pending + completed)

```
id              UUID PK
tenant_id       UUID FK
title           TEXT
action_type     TEXT  -- create_task | update_deal | send_message | custom
target_tool     TEXT  -- hubspot | salesforce | slack | etc
payload         JSONB -- action parameters
status          TEXT  -- pending_approval | approved | executing | completed | failed | denied
approval_token  UUID
approved_by     UUID FK → auth.users
approved_at     TIMESTAMPTZ
result          JSONB
signal_id       UUID FK → signals
entity_id       UUID FK → entities
goal_refs       UUID[]
agent_id        TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `goals`

```
id              UUID PK
tenant_id       UUID FK
user_id         UUID FK → auth.users
title           TEXT
description     TEXT
goal_type       TEXT  -- business | personal | team
target_value    NUMERIC
current_value   NUMERIC
unit            TEXT
status          TEXT  -- active | achieved | paused | abandoned
due_date        TIMESTAMPTZ
entity_refs     UUID[]
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `proposals` — Governed Cognition (032_governed_proposals.sql)

```
id                        UUID PK
tenant_id                 UUID
status                    ENUM  -- draft | pending_review | approved | rejected | executing | completed | failed | superseded
governance_level          ENUM  -- auto | manual | restricted
originating_entity_id     TEXT
originating_entity_type   TEXT
originating_signal        JSONB -- signal_id, category, confidence, severity, key_indicators, reasoning
lineage_id                UUID  -- shared across reasoning chain (immutable)
parent_proposal_id        UUID FK → proposals
action_type               ENUM  -- notify | create_task | update_entity | escalate | schedule_call |
                                --   trigger_workflow | draft_communication | create_record |
                                --   archive_entity | request_data | custom
action_target             JSONB
action_parameters         JSONB
action_description        TEXT
confidence                NUMERIC(4,3)  -- 0.000 to 1.000
reasoning_summary         TEXT
evidence_count            INTEGER
policy_id                 UUID
review_deadline           TIMESTAMPTZ
reviewed_by               TEXT
reviewed_at               TIMESTAMPTZ
review_notes              TEXT
execution_result          JSONB
continuity_writeback      JSONB
ops_priority              ENUM  -- low | medium | high | critical
ops_surface               ENUM  -- queue | tile | notification | command_center | timeline
created_at                TIMESTAMPTZ
updated_at                TIMESTAMPTZ
```

### `hermes_tasks` — Operator Task Ledger (030_hermes_continuity.sql)

```
id              UUID PK
tenant_id       UUID FK
session_id      TEXT
title           TEXT
description     TEXT
status          TEXT  -- pending | in_progress | blocked | completed | cancelled
priority        TEXT  -- critical | high | medium | low
owner           TEXT  -- hermes | nirmal | subagent
parent_task_id  UUID FK → hermes_tasks
entity_refs     JSONB
context_slice   JSONB
result          JSONB
spine_worthy    BOOLEAN
approved        BOOLEAN
blocked_reason  TEXT
scope           TEXT  -- personal | org
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
resolved_at     TIMESTAMPTZ
```

### `knowledge_entries`

```
id              UUID PK
tenant_id       UUID FK
user_id         UUID FK
entry_type      TEXT  -- ai_session | document | note | meeting_summary
title           TEXT
content         TEXT
source          TEXT  -- claude | chatgpt | upload | manual
entity_refs     UUID[]
goal_refs       UUID[]
tags            TEXT[]
embedding       vector(1536)  -- pgvector semantic search
metadata        JSONB
created_at      TIMESTAMPTZ
```

---

## Part III — Domain Field Inventory (from DOMAIN_SPINE_CONFIG in schema.ts)

Each domain section lists: entity types, every priority field per entity, and the canonical field policy where it exists.

---

### CUSTOMER SUCCESS (18 entity types)

**Spine projection:** `cs` | **Config key:** `CUSTOMER_SUCCESS`
**Connectors:** Salesforce, HubSpot, Zendesk, Slack, Gmail, Jira, Datadog

**Entity types:** account, contact, success_plan, ticket, engagement, contract, people_team, business_context, strategic_objective, capability, value_stream, api_portfolio, platform_health_metric, initiative, risk_register, stakeholder_outcome, generated_insight, task

#### `account`

```
health_score                  NUMERIC(3,2)  -- 0.00–1.00
health_score_trend            TEXT          -- improving | stable | declining
health_score_change           NUMERIC       -- delta from last period
renewal_risk_level            TEXT          -- low | medium | high | critical
arr                           NUMERIC       -- Annual Recurring Revenue ($)
acv                           NUMERIC       -- Annual Contract Value ($)
csm_narrative                 TEXT          -- CSM's qualitative summary
contract_type                 TEXT          -- standard | enterprise | pilot | custom
contract_start_date           DATE
contract_end_date             DATE
renewal_date                  DATE
days_to_renewal               INTEGER
executive_sponsor_customer    TEXT          -- customer-side exec sponsor name
executive_sponsor_mulesoft    TEXT          -- our-side exec sponsor name
customer_annual_revenue       NUMERIC
employee_count                INTEGER
geography                     TEXT
industry_vertical             TEXT
industry_sub_sector           TEXT
engagement_cadence            TEXT          -- weekly | biweekly | monthly | quarterly
last_engagement_date          DATE
next_engagement_due           DATE
-- From DEFAULT_FIELD_POLICIES (canonical):
external_id                   TEXT          -- REQUIRED
name                          TEXT          -- REQUIRED
owner_id                      TEXT
owner_name                    TEXT
segment                       TEXT
website                       TEXT
lifecycle_stage               TEXT
status                        TEXT          -- active | inactive | archived
created_at                    TIMESTAMPTZ
updated_at                    TIMESTAMPTZ
```

#### `contact` (account_contact)

```
external_id                   TEXT          -- REQUIRED
full_name                     TEXT          -- REQUIRED (PII)
first_name                    TEXT          -- PII
last_name                     TEXT          -- PII
email                         TEXT          -- PII
phone                         TEXT          -- PII
title                         TEXT
role                          TEXT
account_id                    TEXT
account_name                  TEXT
owner_id                      TEXT
owner_name                    TEXT
lifecycle_stage               TEXT
lead_status                   TEXT
last_contacted_at             TIMESTAMPTZ
last_activity_at              TIMESTAMPTZ
stakeholder_type              TEXT          -- Champion | Economic Buyer | Influencer | Blocker | Evaluator | End User | Executive Sponsor | Technical Contact
department                    TEXT
created_at                    TIMESTAMPTZ
updated_at                    TIMESTAMPTZ
```

#### `people_team` (internal team member)

```
accounts_assigned             TEXT[]        -- list of account IDs
account_count                 INTEGER
total_arr_managed             NUMERIC
avg_health_score              NUMERIC
at_risk_account_count         INTEGER
full_name                     TEXT
email                         TEXT
role                          TEXT
department                    TEXT
region                        TEXT
```

#### `business_context`

```
business_model                TEXT
market_position               TEXT
operating_environment         TEXT
key_business_challenges       TEXT[]
strategic_priorities          TEXT[]
digital_maturity              TEXT          -- low | medium | high | advanced
it_complexity_score           INTEGER       -- 1–10
legacy_system_count           INTEGER
cloud_strategy                TEXT
data_classification           TEXT
```

#### `strategic_objective`

```
strategic_pillar              TEXT
objective_name                TEXT
business_driver               TEXT
quantified_goal               TEXT
target_date                   DATE
business_value_usd            NUMERIC
relevance                     TEXT
status                        TEXT          -- on_track | at_risk | off_track | completed
progress_percent              INTEGER       -- 0–100
health_indicator              TEXT          -- green | amber | red
linked_capabilities           TEXT[]
linked_value_streams          TEXT[]
linked_initiatives            TEXT[]
```

#### `capability`

```
capability_domain             TEXT
current_maturity              TEXT          -- initial | developing | defined | managed | optimizing
target_maturity               TEXT
maturity_gap                  TEXT
gap_status                    TEXT          -- open | in_progress | closed
investment_required           NUMERIC
priority                      TEXT          -- critical | high | medium | low
implementation_status         TEXT
business_impact_status        TEXT
```

#### `value_stream`

```
business_process              TEXT
integration_endpoints         INTEGER
apis_consumed                 INTEGER
annual_transaction_volume     NUMERIC
cycle_time_baseline           NUMERIC       -- days
cycle_time_current            NUMERIC
cycle_time_target             NUMERIC
cycle_time_reduction          NUMERIC       -- % improvement
total_business_value          NUMERIC
customer_satisfaction         NUMERIC       -- 0–100
operational_risk_level        TEXT          -- low | medium | high | critical
```

#### `api_portfolio`

```
api_type                      TEXT          -- REST | GraphQL | SOAP | gRPC | Webhook
monthly_transactions          NUMERIC
avg_response_time             NUMERIC       -- ms
sla_target                    NUMERIC       -- ms
sla_compliance                NUMERIC       -- %
error_rate                    NUMERIC       -- %
uptime                        NUMERIC       -- %
business_criticality          TEXT          -- low | medium | high | critical
health_status                 TEXT          -- healthy | degraded | critical | unknown
```

#### `platform_health_metric`

```
metric_category               TEXT          -- performance | reliability | adoption | security
metric_type                   TEXT
current_value                 NUMERIC
target_value                  NUMERIC
threshold_warning             NUMERIC
threshold_critical            NUMERIC
health_status                 TEXT          -- healthy | warning | critical
trend_is_good                 BOOLEAN       -- true if higher is better
last_measured                 TIMESTAMPTZ
```

#### `initiative`

```
initiative_type               TEXT          -- adoption | migration | integration | optimization | training
priority                      TEXT          -- critical | high | medium | low
phase                         TEXT          -- planning | in_progress | completed | on_hold
status                        TEXT
investment_amount             NUMERIC
expected_annual_benefit       NUMERIC
expected_payback_months       INTEGER
realized_annual_benefit       NUMERIC
success_criteria              TEXT
blockers                      TEXT[]
days_overdue                  INTEGER
target_completion_date        DATE
progress_percentage           INTEGER
```

#### `risk_register`

```
risk_category                 TEXT          -- business | technical | operational | renewal | adoption
impact                        TEXT          -- low | medium | high | critical
impact_score                  INTEGER       -- 1–5
probability                   TEXT          -- low | medium | high
probability_score             INTEGER       -- 1–5
risk_score                    INTEGER       -- impact_score × probability_score
risk_level                    TEXT          -- low | medium | high | critical
mitigation_strategy           TEXT
mitigation_initiative         TEXT
target_resolution_date        DATE
status                        TEXT          -- open | in_progress | mitigated | closed
title                         TEXT
severity                      TEXT
mitigation_due_date           DATE
```

#### `stakeholder_outcome`

```
stakeholder_type              TEXT          -- executive | champion | end_user | technical | procurement
outcome_statement             TEXT
success_metric                TEXT
baseline_value                NUMERIC
current_value                 NUMERIC
target_value                  NUMERIC
target_achievement_percent    NUMERIC
status                        TEXT          -- on_track | at_risk | achieved | not_started
```

#### `engagement`

```
external_id                   TEXT          -- REQUIRED
type                          TEXT          -- REQUIRED (email | call | meeting | qbr | ebr | escalation | check-in)
subject                       TEXT
body_preview                  TEXT          -- internal sensitivity
direction                     TEXT          -- inbound | outbound
channel                       TEXT
account_id                    TEXT
account_name                  TEXT
contact_id                    TEXT
contact_name                  TEXT
owner_id                      TEXT
owner_name                    TEXT
sentiment_score               NUMERIC       -- -1.0 to 1.0
outcome                       TEXT
occurred_at                   TIMESTAMPTZ
duration_minutes              INTEGER
attendees_customer            TEXT[]
customer_seniority            TEXT          -- C-level | VP | Director | Manager | IC
topics_discussed              TEXT[]
action_items                  TEXT[]
relationship_depth_score      INTEGER       -- 1–10
next_steps                    TEXT
next_engagement_date          DATE
created_at                    TIMESTAMPTZ
updated_at                    TIMESTAMPTZ
```

#### `success_plan`

```
executive_summary             TEXT
plan_period                   TEXT          -- e.g. "FY2026"
plan_status                   TEXT          -- draft | active | completed | expired
strategic_objectives_count    INTEGER
key_initiatives               TEXT[]
top_3_risks                   TEXT[]
next_qbr_date                 DATE
```

#### `generated_insight`

```
insight_text                  TEXT
recommended_action            TEXT
status                        TEXT          -- new | acknowledged | actioned | dismissed
linked_metric                 TEXT
linked_risk                   TEXT
linked_initiative             TEXT
linked_objective              TEXT
linked_opportunity            TEXT
linked_contact                TEXT
date_generated                TIMESTAMPTZ
confidence                    NUMERIC       -- 0.0–1.0
```

#### `ticket` (in CS context)

```
external_id                   TEXT          -- REQUIRED
subject                       TEXT          -- REQUIRED
description                   TEXT          -- internal
status                        TEXT          -- open | in_progress | waiting | resolved | closed
priority                      TEXT          -- critical | high | medium | low
category                      TEXT
subcategory                   TEXT
channel                       TEXT          -- email | chat | phone | portal
assigned_to                   TEXT
first_response_time           INTEGER       -- minutes
resolution_time               INTEGER       -- minutes
resolved_at                   TIMESTAMPTZ
customer_sentiment            TEXT          -- positive | neutral | negative
escalated                     BOOLEAN
reopen_count                  INTEGER
tags                          TEXT[]
sla_status                    TEXT          -- within_sla | at_risk | breached
account_id                    TEXT
contact_id                    TEXT
created_at                    TIMESTAMPTZ
updated_at                    TIMESTAMPTZ
```

#### `contract` (in CS context)

```
value                         NUMERIC
payment_terms                 TEXT
start_date                    DATE
end_date                      DATE
auto_renew                    BOOLEAN
billing_frequency             TEXT          -- monthly | quarterly | annual
contract_type                 TEXT
```

#### `task` (in CS context)

```
linked_risk                   TEXT
linked_initiative             TEXT
source                        TEXT          -- manual | jira | asana | linear
external_task_id              TEXT
task_name                     TEXT
status                        TEXT
priority                      TEXT
due_date                      DATE
owner                         TEXT
```

---

---

### REVENUE OPERATIONS — RevOps (14 entity types)

**Spine projection:** `revops` | **Config key:** `REVOPS`
**Connectors:** Salesforce, HubSpot, Stripe, QuickBooks, LinkedIn

**Entity types:** account, opportunity, contact, activity, campaign, pipeline_stage, forecast, quota, territory, comp_plan, revenue_metric, attribution, segment_rule, generated_insight

#### `account` (RevOps lens)

```
arr                           NUMERIC
mrr                           NUMERIC
segment                       TEXT          -- enterprise | mid-market | smb | startup
region                        TEXT
industry                      TEXT
lifecycle_stage               TEXT
owner_id                      TEXT
health_score                  NUMERIC
```

#### `opportunity`

```
external_id                   TEXT          -- REQUIRED
name                          TEXT          -- REQUIRED
amount                        NUMERIC
currency                      TEXT
stage                         TEXT          -- prospect | qualify | proposal | negotiate | closed_won | closed_lost
pipeline                      TEXT
probability                   INTEGER       -- 0–100
close_date                    DATE
expected_close_date           DATE
forecast_category             TEXT          -- commit | best_case | pipeline | omit
owner_id                      TEXT
source                        TEXT
type                          TEXT          -- new_business | expansion | renewal | upsell
days_in_stage                 INTEGER
next_step                     TEXT
competitor                    TEXT
weighted_amount               NUMERIC       -- amount × probability
pipeline_id                   TEXT
created_date                  DATE
last_activity_date            DATE
champion_contact              TEXT
decision_date                 DATE
account_id                    TEXT
account_name                  TEXT
```

#### `pipeline_stage`

```
stage_name                    TEXT
stage_order                   INTEGER
conversion_rate               NUMERIC       -- %
avg_days_in_stage             NUMERIC
deal_count                    INTEGER
total_value                   NUMERIC
```

#### `forecast`

```
period                        TEXT          -- e.g. "2026-Q2"
committed                     NUMERIC
best_case                     NUMERIC
pipeline                      NUMERIC
closed                        NUMERIC
gap_to_target                 NUMERIC
confidence                    NUMERIC       -- 0.0–1.0
owner_id                      TEXT
quota                         NUMERIC
attainment_percent            NUMERIC
```

#### `quota`

```
period                        TEXT
target_amount                 NUMERIC
attained_amount               NUMERIC
attainment_percent            NUMERIC
owner_id                      TEXT
territory_id                  TEXT
```

#### `territory`

```
territory_name                TEXT
region                        TEXT
account_count                 INTEGER
total_arr                     NUMERIC
owner_id                      TEXT
quota_target                  NUMERIC
attainment                    NUMERIC
pipeline                      NUMERIC
coverage_percent              NUMERIC
```

#### `comp_plan`

```
plan_name                     TEXT
plan_type                     TEXT          -- quota_based | milestone | tiered | hybrid
base_salary                   NUMERIC
ote                           NUMERIC       -- On-Target Earnings
accelerators                  JSONB         -- threshold → multiplier map
effective_date                DATE
```

#### `revenue_metric`

```
metric_name                   TEXT          -- ARR | MRR | NRR | GRR | CAC | LTV | Payback
metric_type                   TEXT
current_value                 NUMERIC
target_value                  NUMERIC
trend                         TEXT          -- up | down | flat
period                        TEXT
segment                       TEXT
threshold_warning             NUMERIC
threshold_critical            NUMERIC
```

#### `attribution`

```
channel                       TEXT
source                        TEXT
medium                        TEXT
first_touch_revenue           NUMERIC
multi_touch_revenue           NUMERIC
campaign_id                   TEXT
conversion_count              INTEGER
roi                           NUMERIC       -- %
spend                         NUMERIC
pipeline_generated            NUMERIC
time_to_revenue               INTEGER       -- days
```

#### `campaign` (RevOps lens)

```
budget                        NUMERIC
actual_cost                   NUMERIC
channel                       TEXT
roi                           NUMERIC
pipeline_generated            NUMERIC
leads_generated               INTEGER
conversion_rate               NUMERIC
```

---

### SALES OPERATIONS — SalesOps (14 entity types)

**Spine projection:** `salesops` | **Config key:** `SALES`
**Connectors:** Salesforce, LinkedIn, Calendly, Slack, HubSpot

**Entity types:** account, contact, opportunity, activity, engagement, lead, pipeline_stage, quote, territory, sales_sequence, call_log, email_sequence, competitor_intel, generated_insight

#### `contact` (Sales lens)

```
title                         TEXT
linkedin_url                  TEXT
phone                         TEXT          -- PII
decision_maker                BOOLEAN
buying_role                   TEXT          -- champion | economic_buyer | influencer | end_user | blocker
engagement_score              INTEGER       -- 0–100
last_contacted                DATE
preferred_channel             TEXT          -- email | call | linkedin | whatsapp
```

#### `lead`

```
lead_source                   TEXT          -- organic | paid | referral | outbound | event | partner
lead_score                    INTEGER       -- 0–100
status                        TEXT          -- new | contacted | qualified | disqualified | converted
qualification_date            DATE
conversion_date               DATE
icp_match_score               INTEGER       -- 0–100
utm_source                    TEXT
utm_medium                    TEXT
mql_date                      DATE
sql_date                      DATE
lifecycle_stage               TEXT
```

#### `quote`

```
quote_amount                  NUMERIC
discount_percent              NUMERIC
valid_until                   DATE
status                        TEXT          -- draft | sent | accepted | rejected | expired
version                       INTEGER
line_items                    JSONB
```

#### `sales_sequence`

```
sequence_name                 TEXT
step_count                    INTEGER
enrolled_count                INTEGER
reply_rate                    NUMERIC       -- %
meeting_rate                  NUMERIC       -- %
```

#### `call_log`

```
duration                      INTEGER       -- minutes
outcome                       TEXT          -- connected | voicemail | no_answer | meeting_booked | demo_booked
sentiment                     TEXT          -- positive | neutral | negative
next_action                   TEXT
recording_url                 TEXT
```

#### `competitor_intel`

```
competitor_name               TEXT
strength                      TEXT
weakness                      TEXT
win_rate_against              NUMERIC       -- %
common_objections             TEXT[]
```

#### `activity`

```
type                          TEXT          -- call | email | meeting | task | note
subject                       TEXT
outcome                       TEXT
occurred_at                   TIMESTAMPTZ
duration_minutes              INTEGER
owner_id                      TEXT
entity_id                     TEXT
entity_type                   TEXT
```

---

---

### MARKETING (15 entity types)

**Spine projection:** `marketing` | **Config key:** `MARKETING`
**Connectors:** HubSpot, Salesforce, Mailchimp, Google Ads, LinkedIn Ads, Mixpanel, Amplitude

**Entity types:** campaign, contact, account, engagement, lead, landing_page, email_campaign, social_post, content_asset, attribution_touchpoint, ab_test, audience_segment, marketing_metric, generated_insight

#### `campaign`

```
budget                        NUMERIC
actual_cost                   NUMERIC
channel                       TEXT          -- email | paid_search | paid_social | organic | event | webinar | content | partner
target_audience               TEXT
roi                           NUMERIC       -- %
leads_generated               INTEGER
pipeline_generated            NUMERIC
conversion_rate               NUMERIC       -- %
start_date                    DATE
end_date                      DATE
status                        TEXT          -- draft | active | paused | completed
campaign_type                 TEXT          -- awareness | demand_gen | nurture | retention | event
```

#### `landing_page`

```
url                           TEXT
visitors                      INTEGER
conversions                   INTEGER
conversion_rate               NUMERIC       -- %
bounce_rate                   NUMERIC       -- %
avg_time_on_page              NUMERIC       -- seconds
```

#### `email_campaign`

```
subject                       TEXT
send_count                    INTEGER
open_rate                     NUMERIC       -- %
click_rate                    NUMERIC       -- %
unsubscribe_rate              NUMERIC       -- %
revenue_attributed            NUMERIC
delivered_count               INTEGER
bounce_count                  INTEGER
spam_count                    INTEGER
```

#### `social_post`

```
platform                      TEXT          -- linkedin | twitter | instagram | facebook | youtube
engagement_rate               NUMERIC       -- %
impressions                   INTEGER
clicks                        INTEGER
shares                        INTEGER
likes                         INTEGER
comments                      INTEGER
sentiment                     TEXT          -- positive | neutral | negative
published_date                TIMESTAMPTZ
```

#### `content_asset`

```
asset_type                    TEXT          -- blog | ebook | whitepaper | case_study | video | webinar | infographic
title                         TEXT
downloads                     INTEGER
views                         INTEGER
leads_generated               INTEGER
funnel_stage                  TEXT          -- tofu | mofu | bofu
```

#### `attribution_touchpoint`

```
channel                       TEXT
source                        TEXT
medium                        TEXT
weight                        NUMERIC       -- 0.0–1.0
revenue_attributed            NUMERIC
model_type                    TEXT          -- first_touch | last_touch | linear | time_decay | data_driven
```

#### `ab_test`

```
test_name                     TEXT
variant_a                     TEXT
variant_b                     TEXT
winner                        TEXT          -- a | b | inconclusive
confidence                    NUMERIC       -- %
lift_percent                  NUMERIC
```

#### `audience_segment`

```
segment_name                  TEXT
size                          INTEGER
criteria                      JSONB
engagement_rate               NUMERIC
conversion_rate               NUMERIC
```

#### `marketing_metric`

```
metric_name                   TEXT          -- MQL | SQL | CAC | LTV:CAC | Pipeline Generated | Campaign ROI
current_value                 NUMERIC
target_value                  NUMERIC
trend                         TEXT
period                        TEXT
cac                           NUMERIC
ltv_cac_ratio                 NUMERIC
```

---

### FINANCE (15 entity types)

**Spine projection:** `finance` | **Config key:** `FINANCE`
**Connectors:** QuickBooks, Xero, Stripe, Razorpay, SAP, Excel

**Entity types:** invoice, contract, account, opportunity, expense, budget, revenue_entry, payment, tax_filing, financial_report, vendor, cost_center, forecast_entry, compliance_item, generated_insight

#### `invoice`

```
invoice_number                TEXT
amount                        NUMERIC
currency                      TEXT
status                        TEXT          -- draft | sent | partial | paid | overdue | written_off
due_date                      DATE
paid_date                     DATE
payment_method                TEXT
line_items                    JSONB
tax_amount                    NUMERIC
discount                      NUMERIC
aging_bucket                  TEXT          -- current | 1-30 | 31-60 | 61-90 | 90+
customer_id                   TEXT
customer_name                 TEXT
submitted_by                  TEXT
approved_by                   TEXT
recognized_revenue            NUMERIC
deferred_revenue              NUMERIC
days_overdue                  INTEGER
follow_up_sent                BOOLEAN
follow_up_date                DATE
balance_outstanding           NUMERIC
payment_received              NUMERIC
```

#### `expense`

```
category                      TEXT          -- travel | software | hardware | marketing | payroll | rent | utilities | professional_services
amount                        NUMERIC
currency                      TEXT
vendor                        TEXT
approved_by                   TEXT
receipt_url                   TEXT
cost_center                   TEXT
budget_id                     TEXT
expense_date                  DATE
status                        TEXT          -- submitted | approved | rejected | reimbursed
```

#### `budget`

```
budget_name                   TEXT
period                        TEXT
allocated_amount              NUMERIC
spent_amount                  NUMERIC
remaining                     NUMERIC
utilization_percent           NUMERIC
department                    TEXT
line_item                     TEXT
variance                      NUMERIC
variance_percent              NUMERIC
forecast_to_year_end          NUMERIC
status                        TEXT          -- on_track | over | under
owner                         TEXT
```

#### `revenue_entry`

```
amount                        NUMERIC
type                          TEXT          -- subscription | one_time | usage | professional_services
period                        TEXT
recognized                    NUMERIC
deferred                      NUMERIC
source                        TEXT
segment                       TEXT
```

#### `payment`

```
amount                        NUMERIC
method                        TEXT          -- card | bank_transfer | upi | cheque | crypto
status                        TEXT          -- pending | processing | completed | failed | refunded
processed_date                DATE
reference                     TEXT
gateway                       TEXT          -- stripe | razorpay | paypal | bank
fees                          NUMERIC
```

#### `tax_filing`

```
filing_type                   TEXT          -- GST | Income_Tax | TDS | Payroll_Tax | VAT | Corporate_Tax
period                        TEXT
amount                        NUMERIC
status                        TEXT          -- pending | filed | paid | overdue
due_date                      DATE
filed_date                    DATE
jurisdiction                  TEXT
reference_number              TEXT
penalty                       NUMERIC
```

#### `financial_report`

```
report_type                   TEXT          -- P&L | Balance_Sheet | Cash_Flow | AR_Aging | AP_Aging
period                        TEXT
revenue                       NUMERIC
expenses                      NUMERIC
net_income                    NUMERIC
cash_flow                     NUMERIC
generated_at                  TIMESTAMPTZ
```

#### `vendor` (Finance lens)

```
vendor_name                   TEXT
category                      TEXT
contract_value                NUMERIC
payment_terms                 TEXT          -- net_15 | net_30 | net_60 | immediate
rating                        INTEGER       -- 1–5
risk_level                    TEXT          -- low | medium | high
```

#### `cost_center`

```
center_name                   TEXT
department                    TEXT
budget_allocated              NUMERIC
budget_spent                  NUMERIC
headcount                     INTEGER
```

#### `forecast_entry`

```
period                        TEXT
type                          TEXT          -- revenue | expense | cash_flow
projected_amount              NUMERIC
confidence                    NUMERIC       -- 0.0–1.0
assumptions                   TEXT
scenario                      TEXT          -- base | optimistic | pessimistic
```

#### `compliance_item` (Finance lens)

```
regulation                    TEXT          -- SOC2 | ISO27001 | GDPR | HIPAA | PCI-DSS | local_tax
requirement                   TEXT
status                        TEXT          -- compliant | non_compliant | in_progress | not_applicable
due_date                      DATE
owner                         TEXT
evidence_url                  TEXT
last_audit                    DATE
```

---

---

### CUSTOMER SERVICE / SUPPORT (12 entity types)

**Spine projection:** `service` | **Config key:** `SERVICE`
**Connectors:** Zendesk, Intercom, Freshdesk, Slack, Salesforce, ServiceNow

**Entity types:** ticket, contact, account, engagement, sla_policy, knowledge_article, csat_survey, escalation, queue, agent_performance, service_metric, generated_insight

#### `sla_policy`

```
policy_name                   TEXT
priority_level                TEXT          -- critical | high | medium | low
first_response_target         INTEGER       -- minutes
resolution_target             INTEGER       -- minutes
breach_count                  INTEGER
compliance_percent            NUMERIC
```

#### `knowledge_article`

```
title                         TEXT
category                      TEXT
views                         INTEGER
helpfulness_rating            NUMERIC       -- 0.0–1.0
linked_tickets                INTEGER
status                        TEXT          -- draft | published | archived
last_updated                  DATE
```

#### `csat_survey`

```
score                         INTEGER       -- 1–5
response_text                 TEXT
ticket_id                     TEXT
agent_id                      TEXT
channel                       TEXT
submitted_at                  TIMESTAMPTZ
```

#### `escalation`

```
ticket_id                     TEXT
escalation_level              INTEGER       -- 1 | 2 | 3
reason                        TEXT
escalated_to                  TEXT
escalated_at                  TIMESTAMPTZ
resolved_at                   TIMESTAMPTZ
outcome                       TEXT
```

#### `queue`

```
queue_name                    TEXT
ticket_count                  INTEGER
avg_wait_time                 INTEGER       -- minutes
oldest_ticket_age             INTEGER       -- hours
agents_online                 INTEGER
utilization                   NUMERIC       -- %
```

#### `agent_performance`

```
agent_id                      TEXT
tickets_resolved              INTEGER
avg_resolution_time           NUMERIC       -- minutes
csat_avg                      NUMERIC
first_contact_resolution_rate NUMERIC       -- %
tickets_escalated             INTEGER
period                        TEXT
```

#### `service_metric`

```
metric_name                   TEXT          -- CSAT | NPS | FCR | AHT | FRT | Backlog | SLA_Compliance
current_value                 NUMERIC
target_value                  NUMERIC
trend                         TEXT
avg_handle_time               NUMERIC       -- minutes
first_response_time           NUMERIC       -- minutes
resolution_rate               NUMERIC       -- %
backlog_count                 INTEGER
```

---

### PRODUCT & ENGINEERING (16 entity types)

**Spine projection:** `product` | **Config key:** `PRODUCT_ENGINEERING`
**Connectors:** Jira, GitHub, Linear, Figma, Slack, Notion, Datadog

**Entity types:** task, note, activity, user, feature, bug, sprint, release, incident, repository, pull_request, deployment, feedback, roadmap_item, engineering_metric, generated_insight

#### `feature`

```
feature_name                  TEXT
status                        TEXT          -- planned | in_progress | completed | cancelled | on_hold
priority                      TEXT          -- critical | high | medium | low
effort_estimate               INTEGER       -- story points
business_value                INTEGER       -- 1–10
owner                         TEXT
target_release                TEXT
```

#### `bug`

```
severity                      TEXT          -- critical | high | medium | low
priority                      TEXT
status                        TEXT          -- open | investigating | in_progress | resolved | closed
assigned_to                   TEXT
affected_version              TEXT
steps_to_reproduce            TEXT
resolution                    TEXT
reported_at                   TIMESTAMPTZ
```

#### `sprint`

```
sprint_name                   TEXT
start_date                    DATE
end_date                      DATE
velocity                      INTEGER       -- story points completed
committed_points              INTEGER
completed_points              INTEGER
burndown                      JSONB         -- daily remaining points
status                        TEXT          -- active | completed | planned
```

#### `release`

```
version                       TEXT
release_date                  DATE
features_count                INTEGER
bugs_fixed                    INTEGER
status                        TEXT          -- planned | in_progress | released | rolled_back
rollback_plan                 TEXT
```

#### `incident`

```
severity                      TEXT          -- P0 | P1 | P2 | P3
status                        TEXT          -- open | investigating | mitigated | resolved | post_mortem
title                         TEXT
description                   TEXT
affected_services             TEXT[]
detected_at                   TIMESTAMPTZ
resolved_at                   TIMESTAMPTZ
mttr_minutes                  INTEGER       -- Mean Time To Resolve
root_cause                    TEXT
postmortem_url                TEXT
```

#### `repository`

```
repo_name                     TEXT
language                      TEXT
open_prs                      INTEGER
open_issues                   INTEGER
last_commit                   TIMESTAMPTZ
coverage_percent              NUMERIC
```

#### `pull_request`

```
title                         TEXT
author                        TEXT
status                        TEXT          -- open | merged | closed | draft
review_count                  INTEGER
lines_changed                 INTEGER
cycle_time_hours              NUMERIC
```

#### `deployment`

```
environment                   TEXT          -- production | staging | dev
version                       TEXT
status                        TEXT          -- success | failed | in_progress | rolled_back
deployed_by                   TEXT
deployed_at                   TIMESTAMPTZ
rollback_available            BOOLEAN
```

#### `feedback`

```
source                        TEXT          -- in_app | support | survey | sales | social
category                      TEXT          -- bug | feature_request | ux | performance | pricing
sentiment                     TEXT          -- positive | neutral | negative
feature_request               TEXT
priority                      TEXT
votes                         INTEGER
```

#### `roadmap_item`

```
title                         TEXT
quarter                       TEXT          -- e.g. "2026-Q3"
theme                         TEXT
status                        TEXT          -- planned | in_progress | completed | cancelled
confidence                    TEXT          -- high | medium | low
business_impact               TEXT
effort                        TEXT          -- small | medium | large | xl
```

#### `engineering_metric`

```
metric_name                   TEXT          -- Deploy_Frequency | Lead_Time | MTTR | Change_Failure_Rate | Cycle_Time | Coverage
current_value                 NUMERIC
target_value                  NUMERIC
trend                         TEXT
deploy_frequency              NUMERIC       -- per week
lead_time                     NUMERIC       -- hours
mttr                          NUMERIC       -- minutes
change_failure_rate           NUMERIC       -- %
```

---

### IT ADMINISTRATION (12 entity types)

**Spine projection:** `it_admin` | **Config key:** `IT_ADMIN`
**Connectors:** Okta, Azure AD, Jira, ServiceNow, Datadog, Splunk

**Entity types:** system, device, user, incident, change_request, vulnerability, backup, certificate, network_device, license, it_metric, generated_insight

#### `system`

```
system_name                   TEXT
type                          TEXT          -- web_app | database | api | microservice | infrastructure
environment                   TEXT          -- production | staging | dev
status                        TEXT          -- operational | degraded | down | maintenance
uptime_percent                NUMERIC
owner                         TEXT
criticality                   TEXT          -- critical | high | medium | low
last_patched                  DATE
version                       TEXT
dependencies                  TEXT[]
```

#### `device`

```
device_name                   TEXT
type                          TEXT          -- laptop | desktop | mobile | server | network
os                            TEXT
status                        TEXT          -- active | inactive | lost | decommissioned
assigned_to                   TEXT
last_seen                     TIMESTAMPTZ
compliance_status             TEXT          -- compliant | non_compliant | unknown
serial_number                 TEXT
```

#### `change_request`

```
title                         TEXT
type                          TEXT          -- standard | normal | emergency
priority                      TEXT
status                        TEXT          -- draft | submitted | approved | in_progress | completed | rejected
risk_level                    TEXT          -- low | medium | high
scheduled_date                DATE
approved_by                   TEXT
rollback_plan                 TEXT
```

#### `vulnerability`

```
cve_id                        TEXT
severity                      TEXT          -- critical | high | medium | low
affected_systems              TEXT[]
status                        TEXT          -- open | in_progress | patched | accepted | false_positive
patch_available               BOOLEAN
exploitability                TEXT          -- active | poc | theoretical
remediation_deadline          DATE
```

#### `backup`

```
system_name                   TEXT
backup_type                   TEXT          -- full | incremental | differential
last_backup                   TIMESTAMPTZ
status                        TEXT          -- success | failed | in_progress
size_gb                       NUMERIC
retention_days                INTEGER
recovery_tested               BOOLEAN
```

#### `certificate`

```
domain                        TEXT
issuer                        TEXT
expiry_date                   DATE
days_to_expiry                INTEGER
status                        TEXT          -- valid | expiring_soon | expired
auto_renew                    BOOLEAN
key_algorithm                 TEXT          -- RSA-2048 | RSA-4096 | ECDSA-256
```

#### `network_device`

```
device_name                   TEXT
type                          TEXT          -- router | switch | firewall | load_balancer | vpn
ip_address                    TEXT          -- internal only
status                        TEXT
firmware_version              TEXT
throughput                    NUMERIC       -- Mbps
error_rate                    NUMERIC       -- %
```

#### `license`

```
software_name                 TEXT
license_type                  TEXT          -- per_seat | concurrent | site | enterprise
total_seats                   INTEGER
used_seats                    INTEGER
utilization_percent           NUMERIC
renewal_date                  DATE
annual_cost                   NUMERIC
```

#### `it_metric`

```
metric_name                   TEXT          -- Uptime | MTTD | MTTR | Patch_Compliance | Security_Incidents | License_Utilization
current_value                 NUMERIC
target_value                  NUMERIC
trend                         TEXT
uptime_sla                    NUMERIC       -- %
mean_time_to_detect           NUMERIC       -- minutes
mean_time_to_resolve          NUMERIC       -- minutes
patch_compliance              NUMERIC       -- %
```

---

---

### PROCUREMENT (11 entity types)

**Spine projection:** `procurement` | **Config key:** `PROCUREMENT`
**Connectors:** SAP, Oracle, Salesforce, Slack, Excel

**Entity types:** vendor, contract, purchase_order, invoice, spend_category, renewal_tracker, savings_initiative, approval_request, compliance_check, procurement_metric, generated_insight

#### `vendor`

```
vendor_name                   TEXT
category                      TEXT          -- software | hardware | services | logistics | facilities | marketing
tier                          TEXT          -- strategic | preferred | approved | spot
contract_value                NUMERIC
payment_terms                 TEXT
performance_score             INTEGER       -- 1–100
risk_level                    TEXT          -- low | medium | high | critical
diversity_status              TEXT          -- minority_owned | women_owned | veteran_owned | standard
sla_compliance                NUMERIC       -- %
```

#### `purchase_order`

```
po_number                     TEXT
vendor_id                     TEXT
amount                        NUMERIC
status                        TEXT          -- draft | submitted | approved | received | invoiced | closed | cancelled
requested_by                  TEXT
approved_by                   TEXT
delivery_date                 DATE
```

#### `spend_category`

```
category_name                 TEXT
budget_allocated              NUMERIC
actual_spend                  NUMERIC
variance                      NUMERIC
vendor_count                  INTEGER
period                        TEXT
```

#### `renewal_tracker`

```
contract_id                   TEXT
vendor_name                   TEXT
renewal_date                  DATE
days_to_renewal               INTEGER
current_value                 NUMERIC
proposed_value                NUMERIC
risk_level                    TEXT
action_required               TEXT
owner                         TEXT
```

#### `savings_initiative`

```
initiative_name               TEXT
category                      TEXT
target_savings                NUMERIC
realized_savings              NUMERIC
status                        TEXT          -- planned | in_progress | completed | cancelled
owner                         TEXT
timeline                      TEXT
```

#### `approval_request`

```
request_type                  TEXT          -- new_vendor | po_approval | contract_renewal | spend_exception
amount                        NUMERIC
vendor                        TEXT
status                        TEXT          -- pending | approved | rejected | deferred
requested_by                  TEXT
approved_by                   TEXT
urgency                       TEXT          -- high | medium | low
```

#### `compliance_check`

```
vendor_id                     TEXT
check_type                    TEXT          -- insurance | certifications | financial_health | data_security | diversity
status                        TEXT          -- pass | fail | pending | expired
last_checked                  DATE
next_due                      DATE
findings                      TEXT
```

#### `procurement_metric`

```
metric_name                   TEXT          -- Total_Spend | Cost_Savings | Cycle_Time | On_Time_Delivery | Vendor_Count | PO_Compliance
current_value                 NUMERIC
target_value                  NUMERIC
trend                         TEXT
cost_avoidance                NUMERIC
cycle_time_days               NUMERIC
on_time_delivery_rate         NUMERIC       -- %
```

---

### BIZOPS — Business Operations (15 entity types)

**Spine projection:** `bizops` | **Config key:** `BIZOPS`
**Also covers:** HR (mapped to BIZOPS), Legal (mapped to BIZOPS), Operations, Project Management
**Connectors:** Google Workspace, Slack, Calendly, GitHub, Notion, Asana

**Entity types:** account, contact, opportunity, task, campaign, activity, project, workflow, kpi, okr, cross_dept_initiative, resource_allocation, ops_metric, generated_insight

#### `project`

```
project_name                  TEXT
status                        TEXT          -- planning | active | on_hold | completed | cancelled
owner                         TEXT
start_date                    DATE
end_date                      DATE
budget                        NUMERIC
progress_percent              INTEGER       -- 0–100
department                    TEXT
```

#### `workflow`

```
workflow_name                 TEXT
status                        TEXT          -- active | inactive | draft | archived
trigger                       TEXT          -- manual | schedule | event | webhook
steps_count                   INTEGER
executions                    INTEGER
success_rate                  NUMERIC       -- %
avg_duration                  NUMERIC       -- seconds
```

#### `kpi`

```
kpi_name                      TEXT
current_value                 NUMERIC
target_value                  NUMERIC
trend                         TEXT          -- up | down | flat
owner                         TEXT
department                    TEXT
frequency                     TEXT          -- daily | weekly | monthly | quarterly
data_source                   TEXT
```

#### `okr`

```
objective                     TEXT
key_results                   JSONB         -- [{ kr_text, current, target, unit }]
owner                         TEXT
period                        TEXT          -- e.g. "2026-Q2"
progress_percent              INTEGER
confidence                    TEXT          -- high | medium | low
status                        TEXT          -- on_track | at_risk | off_track | completed
```

#### `cross_dept_initiative`

```
initiative_name               TEXT
departments                   TEXT[]
sponsor                       TEXT
budget                        NUMERIC
status                        TEXT
impact_score                  INTEGER       -- 1–10
timeline                      TEXT
blockers                      TEXT[]
dependencies                  TEXT[]
```

#### `resource_allocation`

```
resource_name                 TEXT
department                    TEXT
allocation_percent            NUMERIC       -- 0–100
project_id                    TEXT
period                        TEXT
utilization                   NUMERIC       -- %
```

#### `ops_metric`

```
metric_name                   TEXT
current_value                 NUMERIC
target_value                  NUMERIC
trend                         TEXT
department                    TEXT
frequency                     TEXT
data_source                   TEXT
```

---

### HR (mapped to BIZOPS config + HR-specific fields)

**Note:** HR maps to BIZOPS in `DEPARTMENT_TO_CONFIG_KEY`. HR-specific entity types are added via industry/department overlay.

#### `employee`

```
employee_id                   TEXT
full_name                     TEXT          -- PII
email                         TEXT          -- PII
phone                         TEXT          -- PII
department                    TEXT
role                          TEXT
manager_id                    TEXT
employment_type               TEXT          -- full_time | part_time | contractor | intern
status                        TEXT          -- active | on_leave | terminated | probation
start_date                    DATE
end_date                      DATE
location                      TEXT
salary_band                   TEXT          -- internal only
performance_rating            TEXT          -- exceeds | meets | below | not_rated
last_review_date              DATE
next_review_date              DATE
```

#### `job_opening`

```
title                         TEXT
department                    TEXT
hiring_manager                TEXT
status                        TEXT          -- open | on_hold | filled | cancelled
priority                      TEXT
target_start_date             DATE
applications_count            INTEGER
interviews_scheduled          INTEGER
offers_extended               INTEGER
```

#### `leave_request`

```
employee_id                   TEXT
leave_type                    TEXT          -- annual | sick | maternity | paternity | unpaid | compensatory
start_date                    DATE
end_date                      DATE
days_count                    NUMERIC
status                        TEXT          -- pending | approved | rejected | cancelled
approved_by                   TEXT
```

#### `performance_review`

```
employee_id                   TEXT
review_period                 TEXT
reviewer_id                   TEXT
rating                        TEXT
goals_achieved                INTEGER
goals_total                   INTEGER
strengths                     TEXT
development_areas             TEXT
next_period_goals             TEXT
status                        TEXT          -- draft | submitted | acknowledged
```

---

### LEGAL (mapped to BIZOPS config + Legal-specific fields)

**Note:** Legal maps to BIZOPS in `DEPARTMENT_TO_CONFIG_KEY`.

#### `contract` (Legal lens)

```
contract_id                   TEXT
contract_type                 TEXT          -- MSA | SOW | NDA | SLA | Employment | Vendor | Partnership | License
parties                       TEXT[]
value                         NUMERIC
currency                      TEXT
start_date                    DATE
end_date                      DATE
auto_renew                    BOOLEAN
notice_period                 INTEGER       -- days
governing_law                 TEXT
status                        TEXT          -- draft | under_review | executed | expired | terminated | disputed
owner                         TEXT
signed_by_us                  TEXT
signed_by_them                TEXT
signed_date                   DATE
renewal_date                  DATE
days_to_renewal               INTEGER
key_obligations               TEXT[]
payment_terms                 TEXT
```

#### `clause`

```
contract_id                   TEXT
clause_type                   TEXT          -- liability | indemnification | ip_ownership | termination | confidentiality | payment | sla
clause_text                   TEXT
risk_level                    TEXT          -- low | medium | high | critical
flagged                       BOOLEAN
flag_reason                   TEXT
```

#### `obligation`

```
contract_id                   TEXT
obligation_text               TEXT
due_date                      DATE
owner                         TEXT
status                        TEXT          -- pending | in_progress | completed | overdue | waived
recurrence                    TEXT          -- one_time | monthly | quarterly | annual
```

#### `legal_matter`

```
matter_id                     TEXT
matter_type                   TEXT          -- litigation | regulatory | ip | employment | corporate | compliance
title                         TEXT
status                        TEXT          -- open | in_progress | resolved | closed
priority                      TEXT
assigned_to                   TEXT
external_counsel              TEXT
estimated_cost                NUMERIC
actual_cost                   NUMERIC
opened_date                   DATE
target_resolution_date        DATE
```

---

---

### PERSONAL WORKSPACE (8 entity types)

**Spine projection:** `bizops` | **Config key:** `PERSONAL`
**Connectors:** Google Workspace, Slack, Calendly, GitHub

**Entity types:** task, note, activity, calendar_event, bookmark, goal, daily_reflection

#### `task` (Personal lens)

```
priority                      TEXT          -- high | medium | low
status                        TEXT          -- todo | in_progress | done | cancelled
due_date                      DATE
category                      TEXT          -- work | personal | health | learning | finance
energy_level                  TEXT          -- high | medium | low  (when is best to do this)
```

#### `goal` (Personal)

```
goal_name                     TEXT
target_date                   DATE
progress_percent              INTEGER
category                      TEXT          -- career | health | finance | learning | relationships | personal
milestones                    JSONB         -- [{ title, due_date, completed }]
```

#### `daily_reflection`

```
date                          DATE
wins                          TEXT[]
challenges                    TEXT[]
energy_level                  TEXT          -- high | medium | low
focus_score                   INTEGER       -- 1–10
gratitude                     TEXT[]
```

#### `calendar_event`

```
title                         TEXT
start_time                    TIMESTAMPTZ
end_time                      TIMESTAMPTZ
attendees                     TEXT[]
meeting_type                  TEXT          -- internal | customer | 1on1 | team | external | personal
action_items                  TEXT[]
```

#### `bookmark`

```
url                           TEXT
title                         TEXT
description                   TEXT
tags                          TEXT[]
saved_at                      TIMESTAMPTZ
```

---

### STUDENT / TEACHER (11 entity types)

**Spine projection:** `student_teacher` | **Config key:** `STUDENT_TEACHER`
**Connectors:** Canvas, Moodle, Google Classroom, Blackboard

**Entity types:** student, course, assignment, grade, attendance, discussion, project, learning_objective, intervention, student_metric, generated_insight

#### `student`

```
student_name                  TEXT
enrollment_status             TEXT          -- active | inactive | graduated | withdrawn
grade_level                   TEXT
gpa                           NUMERIC       -- 0.0–4.0
attendance_rate               NUMERIC       -- %
at_risk                       BOOLEAN
advisor                       TEXT
program                       TEXT
cohort                        TEXT
engagement_score              INTEGER       -- 0–100
```

#### `course`

```
course_name                   TEXT
instructor                    TEXT
enrollment_count              INTEGER
avg_grade                     NUMERIC
completion_rate               NUMERIC       -- %
semester                      TEXT
credits                       INTEGER
```

#### `assignment`

```
title                         TEXT
course_id                     TEXT
due_date                      DATE
status                        TEXT          -- open | closed | graded
avg_score                     NUMERIC
submissions                   INTEGER
late_submissions              INTEGER
```

#### `grade`

```
student_id                    TEXT
course_id                     TEXT
assignment_id                 TEXT
score                         NUMERIC
grade_letter                  TEXT          -- A | B | C | D | F
feedback                      TEXT
graded_at                     TIMESTAMPTZ
```

#### `attendance`

```
student_id                    TEXT
course_id                     TEXT
date                          DATE
status                        TEXT          -- present | absent | late | excused
excused                       BOOLEAN
consecutive_absences          INTEGER
```

#### `learning_objective`

```
objective                     TEXT
course_id                     TEXT
mastery_level                 TEXT          -- not_started | developing | proficient | mastered
assessment_count              INTEGER
avg_score                     NUMERIC
status                        TEXT
```

#### `intervention`

```
student_id                    TEXT
type                          TEXT          -- academic | attendance | behavioral | social_emotional
reason                        TEXT
status                        TEXT          -- open | in_progress | resolved | closed
assigned_to                   TEXT
start_date                    DATE
progress                      TEXT
outcome                       TEXT
follow_up_date                DATE
```

#### `student_metric`

```
metric_name                   TEXT          -- Retention_Rate | Satisfaction_Score | Placement_Rate | Avg_GPA | At_Risk_Count
current_value                 NUMERIC
target_value                  NUMERIC
trend                         TEXT
retention_rate                NUMERIC       -- %
satisfaction_score            NUMERIC
placement_rate                NUMERIC       -- %
```

---

---

## Part IV — Cross-Domain Entities (Missing From Current System)

These are first-class entities that don't exist yet in the schema. They are the connective tissue of operations.

### 1. Commitment

A promise made to a specific person, with a due date, linked to an entity.

```
commitment_id
made_by                       TEXT          -- internal person
made_to                       TEXT          -- customer / team member / investor
commitment_text               TEXT          -- what was promised
due_date                      DATE
status                        TEXT          -- kept | broken | pending | at_risk
linked_entity_type            TEXT
linked_entity_id              TEXT
source                        TEXT          -- email | meeting | call | slack
```

### 2. Decision

Every significant decision, who made it, why, what the outcome was.

```
decision_id
decision_text                 TEXT
decided_by                    TEXT
decided_on                    DATE
context                       TEXT          -- why this decision was made
outcome                       TEXT          -- what happened as a result
linked_entities               TEXT[]
reversible                    BOOLEAN
```

### 3. Blocker

"This thing cannot move until X happens." Not a task. Not a risk.

```
blocker_id
what_is_blocked               TEXT          -- task | deal | project | hire
blocked_by                    TEXT          -- person | dependency | external factor
since_date                    DATE
impact_if_unresolved          TEXT
owner                         TEXT          -- who can unblock this
status                        TEXT          -- active | resolved
```

### 4. Relationship Record

The edge between two people — not a contact record, not an account record.

```
person_a                      TEXT          -- internal team member
person_b                      TEXT          -- external contact
relationship_type             TEXT          -- Champion | Economic Buyer | Influencer | Blocker | Evaluator | End User | Executive Sponsor | Technical Contact
relationship_strength         TEXT          -- Strong | Warm | Neutral | Cold | Unknown
last_meaningful_interaction   DATE          -- NOT just last email — substantive interaction
what_they_care_about          TEXT          -- their personal priorities
communication_preference      TEXT          -- Email | Call | LinkedIn | WhatsApp | In Person
introduced_by                 TEXT
relationship_owner            TEXT          -- who on our team owns this
notes                         TEXT          -- what you'd tell a colleague before they met this person
```

Key distinction: `last_meaningful_interaction` ≠ `last_contact_date`.
A meaningful interaction is one where something was learned, agreed, or advanced.

### 5. Recurring Obligation

The heartbeat of operations. Not a task — a repeating commitment.

```
obligation_id
name                          TEXT          -- "Monthly board report", "Weekly standup", "Quarterly GST filing"
frequency                     TEXT          -- daily | weekly | monthly | quarterly | annual
owner                         TEXT
next_due_date                 DATE
last_completed_date           DATE
status                        TEXT          -- on_track | overdue | at_risk
linked_entity                 TEXT
```

### 6. External Signal

The thing that changes the meaning of internal data.

```
signal_id
source_type                   TEXT          -- News | Regulatory | Competitor | Market | Industry | Social | Job_Posting | Funding
source_name                   TEXT
title                         TEXT
summary                       TEXT          -- 2–3 sentences
date_captured                 DATE
relevance_score               TEXT          -- High | Medium | Low
linked_entities               TEXT[]        -- accounts / deals / contacts / products affected
signal_type                   TEXT          -- Opportunity | Risk | Neutral
action_required               BOOLEAN
action_taken                  TEXT
captured_by                   TEXT          -- Manual | Auto
```

### 7. Cash Position (Daily)

Not a report — a live state.

```
date                          DATE
opening_balance               NUMERIC

-- CONFIRMED INFLOWS (will definitely arrive today)
confirmed_inflows             JSONB         -- [{ customer, invoice_id, amount }]

-- EXPECTED INFLOWS (should arrive but not confirmed)
expected_inflows              JSONB         -- [{ customer, days_overdue, amount, probability }]

-- CONFIRMED OUTFLOWS (will definitely leave today)
confirmed_outflows            JSONB         -- [{ vendor, type, amount }]

-- EXPECTED OUTFLOWS (bills due this week)
expected_outflows             JSONB         -- [{ vendor, amount, due_date }]

closing_balance_confirmed     NUMERIC
closing_balance_with_expected NUMERIC
runway_days_confirmed         INTEGER       -- at current confirmed burn
runway_days_expected          INTEGER       -- including expected flows
```

The gap between the two runway numbers is financial risk exposure.

### 8. Unified Approvals Queue (Cross-Domain)

```
approval_id
what_needs_approval           TEXT
requested_by                  TEXT
requested_on                  TIMESTAMPTZ
urgency                       TEXT          -- high | medium | low
context                       TEXT
evidence                      JSONB
status                        TEXT          -- pending | approved | rejected | deferred
decided_by                    TEXT
decided_on                    TIMESTAMPTZ
domain                        TEXT          -- finance | revops | legal | hr | ops
```

---

## Part V — Fields That Exist But Are Incomplete

### Accounts / Clients — missing fields

- Industry sub-sector (not just industry) — **exists in CS schema, missing in Sales/RevOps**
- Time zone (for scheduling)
- Preferred communication channel
- Decision-making process (who signs, who influences)
- Budget cycle (when do they plan budgets)
- Competitive tools they use
- Why they chose us (win reason)
- Why they might leave (churn risk reason — specific, not just "at-risk")

### Deals — missing fields

- Why we're winning (competitive advantage in this deal)
- Why we might lose (specific risk)
- Next step (concrete, dated action) — **exists in REVOPS schema**
- Economic buyer (who controls the budget)
- Champion (who wants us to win) — **exists in SALES schema as `champion_contact`**
- Blocker (who might kill the deal)
- Mutual action plan (agreed steps with customer)

### Tasks — missing fields

- Waiting on (who/what is this blocked by)
- Context (why does this task exist)
- Impact if not done (consequence)
- Effort estimate — **exists in PRODUCT_ENGINEERING as `story_points`**
- Linked commitment (was this promised to someone)

### Contacts — missing fields

- Influence level (decision maker / influencer / end user / blocker) — **exists in SALES as `buying_role`**
- Relationship owner (who on our team owns this relationship)
- Last meaningful interaction (not just last contact — was it substantive)
- What they care about (their personal priorities)
- Communication preference — **exists in SALES schema**

---

## Part VI — The 9-Function Field Map

Business Ops is not 9 separate modules. It's 17 entity types viewed through 9 different lenses.
The same `contract` entity looks different to Sales (what did we promise), Legal (what are our obligations), Finance (what do we get paid), and Ops (what do we need to deliver).

| Entity              | Sales | Marketing | Ops | Product | Growth | Comms | Legal | HR  | Finance |
| ------------------- | ----- | --------- | --- | ------- | ------ | ----- | ----- | --- | ------- |
| Account / Company   | ✓     | ✓         | ✓   | ✓       | ✓      | ✓     | ✓     |     | ✓       |
| Contact / Person    | ✓     | ✓         | ✓   | ✓       |        | ✓     | ✓     | ✓   |         |
| Deal / Opportunity  | ✓     | ✓         |     |         | ✓      | ✓     | ✓     |     | ✓       |
| Task                | ✓     | ✓         | ✓   | ✓       | ✓      | ✓     | ✓     | ✓   | ✓       |
| Contract            | ✓     |           | ✓   |         |        | ✓     | ✓     | ✓   | ✓       |
| Invoice / Bill      | ✓     |           | ✓   |         |        | ✓     |       |     | ✓       |
| Project / Milestone |       | ✓         | ✓   | ✓       | ✓      | ✓     | ✓     | ✓   | ✓       |
| Document            | ✓     | ✓         | ✓   | ✓       |        | ✓     | ✓     | ✓   | ✓       |
| Event / Meeting     | ✓     | ✓         | ✓   | ✓       |        | ✓     | ✓     | ✓   |         |
| Commitment          | ✓     | ✓         | ✓   | ✓       |        | ✓     | ✓     | ✓   | ✓       |
| Decision            | ✓     | ✓         | ✓   | ✓       | ✓      | ✓     | ✓     | ✓   | ✓       |
| Blocker             | ✓     |           | ✓   | ✓       | ✓      |       |       |     |         |
| Metric / KPI        | ✓     | ✓         | ✓   | ✓       | ✓      |       |       |     | ✓       |
| Experiment          |       | ✓         |     | ✓       | ✓      |       |       |     |         |
| Compliance Item     |       |           | ✓   |         |        |       | ✓     | ✓   | ✓       |
| Employee / Person   |       |           | ✓   |         |        |       | ✓     | ✓   | ✓       |
| Vendor              |       |           | ✓   |         |        | ✓     | ✓     |     | ✓       |

---

## Part VII — The Signal Engine Architecture

The signal engine is the product moat. Not the entity store — the signal engine.

**The distinction:**

- A notification system fires the same alerts for every business: "you have 3 overdue tasks"
- An intelligence system learns the baseline for this specific business and flags deviation: "this account is behaving differently than it did 30 days ago"

**What the signal engine needs:**

1. A unified signal table — one place where all signals from all domains land
2. Baseline learning per entity type per tenant (what's normal for this business)
3. Deviation detection (not threshold alerts — behavioral change detection)
4. Cross-domain correlation (the same account has a ticket spike AND a deal going quiet AND a champion who went silent — that's one signal, not three)

**Unified signal schema (from `signals` table in 001_core_schema.sql):**

```
signal_id
entity_type, entity_id
signal_type               -- going_cold | at_risk | overdue | commitment_breach | external_event | anomaly
                          -- health_change | churn_risk | engagement_drop | opportunity
urgency / severity        -- critical | high | medium | low | info
description               -- human-readable, not a code
action_suggested          -- what the system recommends
evidence                  JSONB  -- { source, data, confidence }
created_at
domain                    -- sales | cs | finance | ops | etc.
agent_id                  -- which agent generated this
status                    -- active | acknowledged | resolved | dismissed
```

Every domain writes to it. "My Desk" reads from it. The Twin reasons over it.

---

## Part VIII — Build Sequence

**Phase 1: Prove the cross-domain aggregation thesis**
Build "My Desk" with data from three different domains — one task from Sales, one approval from Finance, one renewal from Account Success — all in the same view, sorted by urgency, with no module-switching required.

**Phase 2: The Modes**
Build the five cognitive modes (Understand, Act, Plan, Connect, Reflect).
Each mode is a different layout over the same data.
Signal engine starts running — computing "going quiet," "at risk," "overdue."

**Phase 3: The Function Lenses**
Sales, Finance, Legal, HR each get their own projection.
Same data, different emphasis, different fields visible.
The function-specific signals activate.

**Phase 4: The Intelligence Layer**
Pattern recognition: "this account looks like accounts that churned"
Anomaly detection: "this is unusual for this account"
Predictive: "based on current trajectory, you'll miss your Q3 target"

---

## Part IX — Complete Entity Type Master List

| Entity Type                              | Config Key                                  | Domains                                 |
| ---------------------------------------- | ------------------------------------------- | --------------------------------------- |
| `account` / `account_master`             | CUSTOMER_SUCCESS, REVOPS, SALES, FINANCE    | CS, BizOps, RevOps, Service             |
| `contact` / `account_contact`            | All                                         | CS, BizOps, SalesOps, RevOps, Marketing |
| `opportunity` / `deal`                   | REVOPS, SALES, BIZOPS                       | BizOps, SalesOps, RevOps                |
| `task` / `task_item`                     | All                                         | All domains                             |
| `engagement`                             | CUSTOMER_SUCCESS, SALES, MARKETING, SERVICE | CS, Sales, Marketing, Service           |
| `success_plan`                           | CUSTOMER_SUCCESS                            | Account Success                         |
| `initiative`                             | CUSTOMER_SUCCESS, BIZOPS                    | CS, BizOps                              |
| `strategic_objective`                    | CUSTOMER_SUCCESS, BIZOPS                    | CS, BizOps                              |
| `capability`                             | CUSTOMER_SUCCESS                            | CS                                      |
| `value_stream`                           | CUSTOMER_SUCCESS                            | CS                                      |
| `api_portfolio`                          | CUSTOMER_SUCCESS                            | CS                                      |
| `platform_health_metric`                 | CUSTOMER_SUCCESS, IT_ADMIN                  | CS, IT Admin                            |
| `people_team`                            | CUSTOMER_SUCCESS                            | CS                                      |
| `business_context`                       | CUSTOMER_SUCCESS                            | CS                                      |
| `stakeholder_outcome`                    | CUSTOMER_SUCCESS                            | CS                                      |
| `risk_register` / `risk`                 | CUSTOMER_SUCCESS, BIZOPS                    | CS, BizOps                              |
| `generated_insight`                      | All                                         | All domains                             |
| `pipeline_stage`                         | REVOPS, SALES                               | RevOps, SalesOps                        |
| `forecast`                               | REVOPS                                      | RevOps                                  |
| `quota`                                  | REVOPS                                      | RevOps                                  |
| `territory`                              | REVOPS, SALES                               | RevOps, SalesOps                        |
| `comp_plan`                              | REVOPS                                      | RevOps                                  |
| `revenue_metric`                         | REVOPS, FINANCE                             | RevOps, Finance                         |
| `attribution` / `attribution_touchpoint` | REVOPS, MARKETING                           | RevOps, Marketing                       |
| `segment_rule`                           | REVOPS                                      | RevOps                                  |
| `lead`                                   | SALES, MARKETING                            | SalesOps, Marketing                     |
| `quote`                                  | SALES                                       | SalesOps                                |
| `sales_sequence` / `email_sequence`      | SALES                                       | SalesOps                                |
| `call_log`                               | SALES                                       | SalesOps                                |
| `competitor_intel`                       | SALES                                       | SalesOps                                |
| `campaign`                               | MARKETING, REVOPS, BIZOPS                   | Marketing, RevOps, BizOps               |
| `landing_page`                           | MARKETING                                   | Marketing                               |
| `email_campaign`                         | MARKETING                                   | Marketing                               |
| `social_post`                            | MARKETING                                   | Marketing                               |
| `content_asset`                          | MARKETING                                   | Marketing                               |
| `ab_test`                                | MARKETING                                   | Marketing                               |
| `audience_segment`                       | MARKETING                                   | Marketing                               |
| `marketing_metric`                       | MARKETING                                   | Marketing                               |
| `invoice`                                | FINANCE, REVOPS                             | Finance, RevOps                         |
| `expense`                                | FINANCE                                     | Finance                                 |
| `budget`                                 | FINANCE, BIZOPS                             | Finance, BizOps                         |
| `revenue_entry`                          | FINANCE                                     | Finance                                 |
| `payment`                                | FINANCE                                     | Finance                                 |
| `tax_filing`                             | FINANCE                                     | Finance                                 |
| `financial_report`                       | FINANCE                                     | Finance                                 |
| `cost_center`                            | FINANCE                                     | Finance                                 |
| `forecast_entry`                         | FINANCE                                     | Finance                                 |
| `compliance_item`                        | FINANCE, IT_ADMIN, PROCUREMENT              | Finance, IT, Procurement                |
| `ticket`                                 | SERVICE, CUSTOMER_SUCCESS                   | Service, CS                             |
| `sla_policy`                             | SERVICE                                     | Service                                 |
| `knowledge_article`                      | SERVICE                                     | Service                                 |
| `csat_survey`                            | SERVICE                                     | Service                                 |
| `escalation`                             | SERVICE                                     | Service                                 |
| `queue`                                  | SERVICE                                     | Service                                 |
| `agent_performance`                      | SERVICE                                     | Service                                 |
| `service_metric`                         | SERVICE                                     | Service                                 |
| `feature` / `epic`                       | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `bug`                                    | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `sprint`                                 | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `release`                                | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `incident`                               | PRODUCT_ENGINEERING, IT_ADMIN               | Product, IT                             |
| `repository`                             | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `pull_request`                           | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `deployment`                             | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `feedback`                               | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `roadmap_item`                           | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `engineering_metric`                     | PRODUCT_ENGINEERING                         | Product/Engineering                     |
| `system`                                 | IT_ADMIN                                    | IT Admin                                |
| `device`                                 | IT_ADMIN                                    | IT Admin                                |
| `change_request`                         | IT_ADMIN                                    | IT Admin                                |
| `vulnerability`                          | IT_ADMIN                                    | IT Admin                                |
| `backup`                                 | IT_ADMIN                                    | IT Admin                                |
| `certificate`                            | IT_ADMIN                                    | IT Admin                                |
| `network_device`                         | IT_ADMIN                                    | IT Admin                                |
| `license`                                | IT_ADMIN                                    | IT Admin                                |
| `it_metric`                              | IT_ADMIN                                    | IT Admin                                |
| `vendor`                                 | PROCUREMENT, FINANCE                        | Procurement, Finance                    |
| `purchase_order`                         | PROCUREMENT                                 | Procurement                             |
| `spend_category`                         | PROCUREMENT                                 | Procurement                             |
| `renewal_tracker`                        | PROCUREMENT                                 | Procurement                             |
| `savings_initiative`                     | PROCUREMENT                                 | Procurement                             |
| `approval_request`                       | PROCUREMENT                                 | Procurement                             |
| `compliance_check`                       | PROCUREMENT                                 | Procurement                             |
| `procurement_metric`                     | PROCUREMENT                                 | Procurement                             |
| `project`                                | BIZOPS                                      | BizOps                                  |
| `workflow`                               | BIZOPS                                      | BizOps                                  |
| `kpi`                                    | BIZOPS                                      | BizOps                                  |
| `okr`                                    | BIZOPS                                      | BizOps                                  |
| `cross_dept_initiative`                  | BIZOPS                                      | BizOps                                  |
| `resource_allocation`                    | BIZOPS                                      | BizOps                                  |
| `ops_metric`                             | BIZOPS                                      | BizOps                                  |
| `employee`                               | HR (→ BIZOPS)                               | HR                                      |
| `job_opening`                            | HR (→ BIZOPS)                               | HR                                      |
| `leave_request`                          | HR (→ BIZOPS)                               | HR                                      |
| `performance_review`                     | HR (→ BIZOPS)                               | HR                                      |
| `contract`                               | FINANCE, PROCUREMENT, CUSTOMER_SUCCESS      | Finance, Legal, CS, Procurement         |
| `clause`                                 | Legal (→ BIZOPS)                            | Legal                                   |
| `obligation`                             | Legal (→ BIZOPS)                            | Legal                                   |
| `legal_matter`                           | Legal (→ BIZOPS)                            | Legal                                   |
| `calendar_event`                         | PERSONAL, BIZOPS                            | Personal, BizOps                        |
| `bookmark`                               | PERSONAL                                    | Personal                                |
| `goal`                                   | PERSONAL                                    | Personal                                |
| `daily_reflection`                       | PERSONAL                                    | Personal                                |
| `student`                                | STUDENT_TEACHER                             | Education                               |
| `course`                                 | STUDENT_TEACHER                             | Education                               |
| `assignment`                             | STUDENT_TEACHER                             | Education                               |
| `grade`                                  | STUDENT_TEACHER                             | Education                               |
| `attendance`                             | STUDENT_TEACHER                             | Education                               |
| `learning_objective`                     | STUDENT_TEACHER                             | Education                               |
| `intervention`                           | STUDENT_TEACHER                             | Education                               |
| `student_metric`                         | STUDENT_TEACHER                             | Education                               |
| **`commitment`**                         | **All — MISSING**                           | **All domains**                         |
| **`decision`**                           | **All — MISSING**                           | **All domains**                         |
| **`blocker`**                            | **All — MISSING**                           | **All domains**                         |
| **`relationship_record`**                | **All — MISSING**                           | **All domains**                         |
| **`external_signal`**                    | **All — MISSING**                           | **All domains**                         |
| **`cash_position`**                      | **Finance — MISSING**                       | **Finance**                             |
| **`recurring_obligation`**               | **All — MISSING**                           | **All domains**                         |

---

## Part X — Industry Overlay Entity Types

These entity types activate when a specific industry is selected at onboarding.

| Industry              | Extra Entity Types                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Professional Services | contract, project, timesheet, service_delivery                                            |
| Healthcare            | contract, compliance_item, patient_encounter, equipment_maintenance                       |
| Manufacturing         | work_order, supplier, inventory_snapshot, asset, maintenance_schedule, maintenance_record |
| Automotive            | vehicle, part, warranty, service_appointment, maintenance_record                          |
| Retail / Commerce     | order, inventory, sku                                                                     |
| Financial Services    | compliance_item, risk_assessment                                                          |
| Logistics             | shipment, carrier, warehouse, fleet_maintenance                                           |
| Media                 | content_asset, license, royalty                                                           |
| Public Sector         | compliance_item, contract, grant                                                          |
| Education             | student, course, enrollment                                                               |

---

_This document is the canonical field inventory for IntegrateWise L1 surfaces._
_Source of truth: `packages/types/src/schema.ts` (DOMAIN_SPINE_CONFIG + DEFAULT_FIELD_POLICIES)_
_Missing entities in Part IV are the delta between "data retrieval system" and "operational intelligence."_
_Last updated: 2026-05-29_
