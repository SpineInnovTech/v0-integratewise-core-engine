-- ============================================================================
-- CROSS-DEPARTMENT SIGNAL MODEL & TRAITS
-- Extension to Accounts Intelligence OS
-- Version: 1.0.0
-- ============================================================================
-- ============================================================================
-- 1. RESOURCE TYPE REGISTRY
-- Canonical entity types that all tools map into
-- ============================================================================
CREATE TABLE IF NOT EXISTS resource_type_registry (
    resource_type TEXT PRIMARY KEY,
    -- account, person, opportunity, subscription, etc.
    display_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO resource_type_registry (resource_type, display_name, description)
VALUES (
        'account',
        'Account',
        'Customer organization or client'
    ),
    (
        'person',
        'Person',
        'Any human contact (internal/external)'
    ),
    (
        'opportunity',
        'Opportunity',
        'Sales opportunity or deal'
    ),
    (
        'subscription',
        'Subscription',
        'Recurring revenue contract'
    ),
    ('ticket', 'Ticket', 'Support issue or request'),
    ('task', 'Task', 'Unit of work (project/ops/CS)'),
    (
        'event',
        'Event',
        'Meeting, call, or timeline event'
    ),
    (
        'document',
        'Document',
        'Doc, page, email, transcript'
    ),
    ('campaign', 'Campaign', 'Marketing or CS motion'),
    ('initiative', 'Initiative', 'Project or program'),
    ('invoice', 'Invoice', 'Billing event'),
    (
        'metric_point',
        'Metric Point',
        'Time-series metric (health, usage)'
    ) ON CONFLICT (resource_type) DO NOTHING;
-- ============================================================================
-- 2. TOOL TYPE REGISTRY
-- Classification of external tools
-- ============================================================================
CREATE TABLE IF NOT EXISTS tool_type_registry (
    tool_type TEXT PRIMARY KEY_,
    -- crm, support, billing, etc.
    display_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    typical_resources TEXT [],
    -- Which resource types this tool typically emits
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO tool_type_registry (tool_type, display_name, typical_resources)
VALUES (
        'crm',
        'CRM',
        ARRAY ['account', 'person', 'opportunity']
    ),
    (
        'support',
        'Support',
        ARRAY ['ticket', 'person', 'event']
    ),
    (
        'billing',
        'Billing/Finance',
        ARRAY ['subscription', 'invoice', 'account']
    ),
    (
        'marketing_auto',
        'Marketing Automation',
        ARRAY ['campaign', 'person', 'event']
    ),
    (
        'analytics',
        'Product Analytics',
        ARRAY ['metric_point', 'event']
    ),
    (
        'pm',
        'Project/Work Management',
        ARRAY ['task', 'initiative', 'person']
    ),
    ('calendar', 'Calendar', ARRAY ['event']),
    (
        'comm',
        'Communication',
        ARRAY ['event', 'document']
    ),
    ('docs', 'Doc/Knowledge', ARRAY ['document']),
    (
        'freelance_billing',
        'Freelance Billing',
        ARRAY ['invoice', 'initiative', 'account']
    ) ON CONFLICT (tool_type) DO NOTHING;
-- ============================================================================
-- 3. TRAIT DEFINITIONS
-- Typed attributes that can be attached to resources
-- ============================================================================
CREATE TABLE IF NOT EXISTS trait_definitions (
    trait_id TEXT PRIMARY KEY,
    trait_name TEXT NOT NULL,
    trait_category TEXT NOT NULL,
    -- identity, ownership, time, value, context, links
    data_type TEXT NOT NULL,
    -- string, number, boolean, date, datetime, json, array
    description TEXT,
    applicable_resource_types TEXT [],
    -- Which resource types this trait applies to
    is_system BOOLEAN DEFAULT false,
    -- System traits vs custom
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Identity Traits
INSERT INTO trait_definitions (
        trait_id,
        trait_name,
        trait_category,
        data_type,
        description,
        applicable_resource_types,
        is_system
    )
VALUES (
        'external_id',
        'External ID',
        'identity',
        'string',
        'ID from source system',
        ARRAY ['account', 'person', 'opportunity', 'ticket', 'task', 'event', 'document', 'campaign', 'initiative', 'invoice'],
        true
    ),
    (
        'tool_id',
        'Tool ID',
        'identity',
        'string',
        'Specific tool instance identifier',
        ARRAY ['account', 'person', 'opportunity', 'ticket', 'task', 'event', 'document', 'campaign', 'initiative', 'invoice'],
        true
    ),
    (
        'tool_type',
        'Tool Type',
        'identity',
        'string',
        'Classification of source tool',
        ARRAY ['account', 'person', 'opportunity', 'ticket', 'task', 'event', 'document', 'campaign', 'initiative', 'invoice'],
        true
    ),
    (
        'source_system',
        'Source System',
        'identity',
        'string',
        'Name of source system',
        ARRAY ['account', 'person', 'opportunity', 'ticket', 'task', 'event', 'document', 'campaign', 'initiative', 'invoice'],
        true
    );
-- Ownership Traits
INSERT INTO trait_definitions (
        trait_id,
        trait_name,
        trait_category,
        data_type,
        description,
        applicable_resource_types,
        is_system
    )
VALUES (
        'owner_person_id',
        'Owner',
        'ownership',
        'string',
        'Primary owner reference',
        ARRAY ['account', 'opportunity', 'ticket', 'task', 'initiative', 'campaign'],
        true
    ),
    (
        'team',
        'Team',
        'ownership',
        'string',
        'Owning team',
        ARRAY ['account', 'opportunity', 'ticket', 'task', 'initiative'],
        true
    ),
    (
        'department',
        'Department',
        'ownership',
        'string',
        'Owning department',
        ARRAY ['person', 'task', 'initiative'],
        true
    );
-- Time Traits
INSERT INTO trait_definitions (
        trait_id,
        trait_name,
        trait_category,
        data_type,
        description,
        applicable_resource_types,
        is_system
    )
VALUES (
        'created_at',
        'Created At',
        'time',
        'datetime',
        'Creation timestamp',
        ARRAY ['account', 'person', 'opportunity', 'ticket', 'task', 'event', 'document', 'campaign', 'initiative', 'invoice'],
        true
    ),
    (
        'updated_at',
        'Updated At',
        'time',
        'datetime',
        'Last update timestamp',
        ARRAY ['account', 'person', 'opportunity', 'ticket', 'task', 'event', 'document', 'campaign', 'initiative', 'invoice'],
        true
    ),
    (
        'status_changed_at',
        'Status Changed At',
        'time',
        'datetime',
        'Last status change',
        ARRAY ['opportunity', 'ticket', 'task', 'initiative'],
        true
    ),
    (
        'due_at',
        'Due At',
        'time',
        'datetime',
        'Due date/time',
        ARRAY ['task', 'ticket', 'invoice', 'initiative'],
        true
    );
-- Value Traits
INSERT INTO trait_definitions (
        trait_id,
        trait_name,
        trait_category,
        data_type,
        description,
        applicable_resource_types,
        is_system
    )
VALUES (
        'amount',
        'Amount',
        'value',
        'number',
        'Monetary amount',
        ARRAY ['opportunity', 'subscription', 'invoice'],
        true
    ),
    (
        'currency',
        'Currency',
        'value',
        'string',
        'Currency code',
        ARRAY ['opportunity', 'subscription', 'invoice'],
        true
    ),
    (
        'count',
        'Count',
        'value',
        'number',
        'Numeric count',
        ARRAY ['metric_point'],
        true
    ),
    (
        'score',
        'Score',
        'value',
        'number',
        'Numeric score (0-100)',
        ARRAY ['account', 'person'],
        true
    ),
    (
        'band',
        'Band',
        'value',
        'string',
        'Categorical band',
        ARRAY ['account'],
        true
    );
-- Context Traits
INSERT INTO trait_definitions (
        trait_id,
        trait_name,
        trait_category,
        data_type,
        description,
        applicable_resource_types,
        is_system
    )
VALUES (
        'workspace',
        'Workspace',
        'context',
        'string',
        'Department/workspace context',
        ARRAY ['task', 'initiative', 'campaign', 'metric_point'],
        true
    ),
    (
        'segment',
        'Segment',
        'context',
        'string',
        'Customer segment',
        ARRAY ['account', 'opportunity'],
        true
    ),
    (
        'vertical',
        'Vertical',
        'context',
        'string',
        'Industry vertical',
        ARRAY ['account'],
        true
    ),
    (
        'region',
        'Region',
        'context',
        'string',
        'Geographic region',
        ARRAY ['account', 'person'],
        true
    );
-- Link Traits
INSERT INTO trait_definitions (
        trait_id,
        trait_name,
        trait_category,
        data_type,
        description,
        applicable_resource_types,
        is_system
    )
VALUES (
        'related_entities',
        'Related Entities',
        'links',
        'json',
        'Array of related entity references',
        ARRAY ['opportunity', 'ticket', 'task', 'event', 'document', 'campaign', 'initiative', 'invoice', 'metric_point'],
        true
    ),
    (
        'parent_id',
        'Parent ID',
        'links',
        'string',
        'Parent entity reference',
        ARRAY ['account', 'task', 'initiative'],
        true
    );
-- ============================================================================
-- 4. ENTITY TRAITS (Generic extensibility)
-- Stores traits that don't have dedicated columns
-- ============================================================================
CREATE TABLE IF NOT EXISTS entity_traits (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    resource_type TEXT NOT NULL REFERENCES resource_type_registry(resource_type),
    entity_id TEXT NOT NULL,
    -- ID of the entity this trait belongs to
    trait_id TEXT NOT NULL REFERENCES trait_definitions(trait_id),
    value_string TEXT,
    value_number NUMERIC,
    value_boolean BOOLEAN,
    value_datetime TIMESTAMPTZ,
    value_json JSONB,
    source_system TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_et_resource_entity ON entity_traits(resource_type, entity_id);
CREATE INDEX idx_et_trait ON entity_traits(trait_id);
-- ============================================================================
-- 5. SIGNAL DEFINITIONS
-- Derived metrics computed from resources/traits
-- ============================================================================
CREATE TABLE IF NOT EXISTS signal_definitions (
    signal_id TEXT PRIMARY KEY,
    signal_name TEXT NOT NULL,
    signal_category TEXT NOT NULL,
    -- focus, knowledge, collaboration, health, sales, cs, marketing, product, finance
    persona_type TEXT NOT NULL,
    -- individual, team, manager, freelancer
    department TEXT,
    -- null = cross-department, else sales/cs/marketing/product/finance/ops
    description TEXT,
    computation_type TEXT NOT NULL,
    -- count, ratio, trend, delta, threshold
    source_resource_types TEXT [],
    -- Which resources feed this signal
    formula TEXT,
    -- Description of how to compute
    unit TEXT,
    -- %, count, hours, currency, score
    direction TEXT,
    -- higher_is_better, lower_is_better, neutral
    thresholds JSONB,
    -- { "good": 80, "warning": 50, "critical": 20 }
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 5.1 INDIVIDUAL SIGNALS - CORE (ANY DEPARTMENT)
-- ============================================================================
INSERT INTO signal_definitions (
        signal_id,
        signal_name,
        signal_category,
        persona_type,
        department,
        description,
        computation_type,
        source_resource_types,
        unit,
        direction
    )
VALUES -- Focus & Flow
    (
        'ind_tasks_created_daily',
        'Tasks Created (Daily)',
        'focus',
        'individual',
        NULL,
        'Number of tasks created per day',
        'count',
        ARRAY ['task'],
        'count',
        'neutral'
    ),
    (
        'ind_tasks_completed_daily',
        'Tasks Completed (Daily)',
        'focus',
        'individual',
        NULL,
        'Number of tasks completed per day',
        'count',
        ARRAY ['task'],
        'count',
        'higher_is_better'
    ),
    (
        'ind_task_completion_rate',
        'Task Completion Rate',
        'focus',
        'individual',
        NULL,
        'Tasks completed / tasks created',
        'ratio',
        ARRAY ['task'],
        '%',
        'higher_is_better'
    ),
    (
        'ind_context_switches',
        'Context Switches',
        'focus',
        'individual',
        NULL,
        'Tool hops per hour',
        'count',
        ARRAY ['event'],
        'count/hr',
        'lower_is_better'
    ),
    (
        'ind_calendar_fragmentation',
        'Calendar Fragmentation',
        'focus',
        'individual',
        NULL,
        'Percentage of day in meetings <30min apart',
        'ratio',
        ARRAY ['event'],
        '%',
        'lower_is_better'
    ),
    -- Knowledge
    (
        'ind_docs_touched',
        'Documents Touched',
        'knowledge',
        'individual',
        NULL,
        'Docs touched/created per week',
        'count',
        ARRAY ['document'],
        'count',
        'higher_is_better'
    ),
    (
        'ind_knowledge_reuse',
        'Knowledge Reuse',
        'knowledge',
        'individual',
        NULL,
        'Saved/referenced/linked artifacts',
        'count',
        ARRAY ['document'],
        'count',
        'higher_is_better'
    ),
    -- Collaboration
    (
        'ind_messages_ratio',
        'Message Send/Receive Ratio',
        'collaboration',
        'individual',
        NULL,
        'Messages sent vs received',
        'ratio',
        ARRAY ['event'],
        'ratio',
        'neutral'
    ),
    (
        'ind_meetings_attended',
        'Meetings Attended',
        'collaboration',
        'individual',
        NULL,
        'Meetings attended per week',
        'count',
        ARRAY ['event'],
        'count',
        'neutral'
    ),
    (
        'ind_prs_authored',
        'PRs/Issues Authored',
        'collaboration',
        'individual',
        NULL,
        'PRs or issues authored',
        'count',
        ARRAY ['task'],
        'count',
        'higher_is_better'
    ),
    -- Health & Overload
    (
        'ind_meeting_load',
        'Meeting Load',
        'health',
        'individual',
        NULL,
        'Hours in meetings per day',
        'count',
        ARRAY ['event'],
        'hours',
        'lower_is_better'
    ),
    (
        'ind_after_hours_work',
        'After-Hours Work',
        'health',
        'individual',
        NULL,
        'Work volume outside business hours',
        'count',
        ARRAY ['task', 'event'],
        'count',
        'lower_is_better'
    );
-- ============================================================================
-- 5.2 INDIVIDUAL SIGNALS - SALES
-- ============================================================================
INSERT INTO signal_definitions (
        signal_id,
        signal_name,
        signal_category,
        persona_type,
        department,
        description,
        computation_type,
        source_resource_types,
        unit,
        direction
    )
VALUES (
        'sales_ind_activities',
        'Sales Activities',
        'sales',
        'individual',
        'sales',
        'Calls, emails, meetings, demos',
        'count',
        ARRAY ['event'],
        'count',
        'higher_is_better'
    ),
    (
        'sales_ind_opps_created',
        'Opportunities Created',
        'sales',
        'individual',
        'sales',
        'New opportunities created',
        'count',
        ARRAY ['opportunity'],
        'count',
        'higher_is_better'
    ),
    (
        'sales_ind_opps_progressed',
        'Opportunities Progressed',
        'sales',
        'individual',
        'sales',
        'Opportunities moved forward',
        'count',
        ARRAY ['opportunity'],
        'count',
        'higher_is_better'
    ),
    (
        'sales_ind_opps_stalled',
        'Opportunities Stalled',
        'sales',
        'individual',
        'sales',
        'Opportunities with no activity',
        'count',
        ARRAY ['opportunity'],
        'count',
        'lower_is_better'
    ),
    (
        'sales_ind_conversion_demo',
        'Demo Conversion',
        'sales',
        'individual',
        'sales',
        'Opp → Demo conversion rate',
        'ratio',
        ARRAY ['opportunity', 'event'],
        '%',
        'higher_is_better'
    ),
    (
        'sales_ind_acv_booked',
        'ACV Booked',
        'sales',
        'individual',
        'sales',
        'Annual contract value booked',
        'count',
        ARRAY ['opportunity'],
        'currency',
        'higher_is_better'
    ),
    (
        'sales_ind_quota_attainment',
        'Quota Attainment',
        'sales',
        'individual',
        'sales',
        'Bookings vs quota',
        'ratio',
        ARRAY ['opportunity'],
        '%',
        'higher_is_better'
    );
-- ============================================================================
-- 5.3 INDIVIDUAL SIGNALS - CS
-- ============================================================================
INSERT INTO signal_definitions (
        signal_id,
        signal_name,
        signal_category,
        persona_type,
        department,
        description,
        computation_type,
        source_resource_types,
        unit,
        direction
    )
VALUES (
        'cs_ind_accounts_owned',
        'Accounts Owned',
        'cs',
        'individual',
        'cs',
        'Number of accounts owned',
        'count',
        ARRAY ['account'],
        'count',
        'neutral'
    ),
    (
        'cs_ind_health_movement',
        'Health Score Movement',
        'cs',
        'individual',
        'cs',
        'Net health score change',
        'delta',
        ARRAY ['account', 'metric_point'],
        'score',
        'higher_is_better'
    ),
    (
        'cs_ind_tickets_handled',
        'Tickets Handled',
        'cs',
        'individual',
        'cs',
        'Tickets/escalations handled',
        'count',
        ARRAY ['ticket'],
        'count',
        'higher_is_better'
    ),
    (
        'cs_ind_ttfr',
        'Time to First Response',
        'cs',
        'individual',
        'cs',
        'Average time to first response',
        'count',
        ARRAY ['ticket'],
        'hours',
        'lower_is_better'
    ),
    (
        'cs_ind_ttr',
        'Time to Resolution',
        'cs',
        'individual',
        'cs',
        'Average time to resolution',
        'count',
        ARRAY ['ticket'],
        'hours',
        'lower_is_better'
    ),
    (
        'cs_ind_qbrs_completed',
        'QBRs Completed',
        'cs',
        'individual',
        'cs',
        'QBRs completed vs planned',
        'ratio',
        ARRAY ['event'],
        '%',
        'higher_is_better'
    );
-- ============================================================================
-- 5.4 INDIVIDUAL SIGNALS - MARKETING
-- ============================================================================
INSERT INTO signal_definitions (
        signal_id,
        signal_name,
        signal_category,
        persona_type,
        department,
        description,
        computation_type,
        source_resource_types,
        unit,
        direction
    )
VALUES (
        'mkt_ind_assets_produced',
        'Assets Produced',
        'marketing',
        'individual',
        'marketing',
        'Content pieces or campaigns produced',
        'count',
        ARRAY ['document', 'campaign'],
        'count',
        'higher_is_better'
    ),
    (
        'mkt_ind_asset_performance',
        'Asset Performance',
        'marketing',
        'individual',
        'marketing',
        'Avg views, CTR, conversion per asset',
        'count',
        ARRAY ['metric_point'],
        'score',
        'higher_is_better'
    ),
    (
        'mkt_ind_deadlines_hit',
        'Deadlines Hit',
        'marketing',
        'individual',
        'marketing',
        'Campaigns/assets delivered on time',
        'ratio',
        ARRAY ['campaign', 'task'],
        '%',
        'higher_is_better'
    ),
    (
        'mkt_ind_experiments',
        'Experiments Launched',
        'marketing',
        'individual',
        'marketing',
        'Tests launched and learnings logged',
        'count',
        ARRAY ['campaign'],
        'count',
        'higher_is_better'
    );
-- ============================================================================
-- 5.5 INDIVIDUAL SIGNALS - PRODUCT/ENG
-- ============================================================================
INSERT INTO signal_definitions (
        signal_id,
        signal_name,
        signal_category,
        persona_type,
        department,
        description,
        computation_type,
        source_resource_types,
        unit,
        direction
    )
VALUES (
        'prod_ind_issues_completed',
        'Issues Completed',
        'product',
        'individual',
        'product',
        'Stories/issues completed vs assigned',
        'ratio',
        ARRAY ['task'],
        '%',
        'higher_is_better'
    ),
    (
        'prod_ind_cycle_time',
        'Cycle Time',
        'product',
        'individual',
        'product',
        'Average cycle time per ticket',
        'count',
        ARRAY ['task'],
        'hours',
        'lower_is_better'
    ),
    (
        'prod_ind_bugs_introduced',
        'Bugs Introduced',
        'product',
        'individual',
        'product',
        'Bugs introduced by this person',
        'count',
        ARRAY ['task'],
        'count',
        'lower_is_better'
    ),
    (
        'prod_ind_bugs_resolved',
        'Bugs Resolved',
        'product',
        'individual',
        'product',
        'Bugs resolved by this person',
        'count',
        ARRAY ['task'],
        'count',
        'higher_is_better'
    ),
    (
        'prod_ind_incidents_handled',
        'Incidents Handled',
        'product',
        'individual',
        'product',
        'On-call incidents handled',
        'count',
        ARRAY ['ticket'],
        'count',
        'neutral'
    );
-- ============================================================================
-- 5.6 TEAM SIGNALS
-- ============================================================================
INSERT INTO signal_definitions (
        signal_id,
        signal_name,
        signal_category,
        persona_type,
        department,
        description,
        computation_type,
        source_resource_types,
        unit,
        direction
    )
VALUES -- Core Team
    (
        'team_throughput',
        'Team Throughput',
        'focus',
        'team',
        NULL,
        'Tasks/issues closed vs opened',
        'ratio',
        ARRAY ['task'],
        'ratio',
        'higher_is_better'
    ),
    (
        'team_cycle_time',
        'Team Cycle Time',
        'focus',
        'team',
        NULL,
        'Average cycle time',
        'count',
        ARRAY ['task'],
        'hours',
        'lower_is_better'
    ),
    (
        'team_lead_time',
        'Team Lead Time',
        'focus',
        'team',
        NULL,
        'Average lead time',
        'count',
        ARRAY ['task'],
        'hours',
        'lower_is_better'
    ),
    (
        'team_bug_rate',
        'Bug/Reopen Rate',
        'focus',
        'team',
        NULL,
        'Bugs or reopened items',
        'ratio',
        ARRAY ['task'],
        '%',
        'lower_is_better'
    ),
    (
        'team_cross_deps',
        'Cross-Team Dependencies',
        'collaboration',
        'team',
        NULL,
        'Dependencies vs resolved',
        'ratio',
        ARRAY ['task'],
        '%',
        'higher_is_better'
    ),
    (
        'team_workload_dist',
        'Workload Distribution',
        'health',
        'team',
        NULL,
        'Variance in workload across team',
        'count',
        ARRAY ['task'],
        'score',
        'lower_is_better'
    ),
    -- Sales Team
    (
        'sales_team_pipeline_coverage',
        'Pipeline Coverage',
        'sales',
        'team',
        'sales',
        'Pipeline / Quota ratio',
        'ratio',
        ARRAY ['opportunity'],
        'ratio',
        'higher_is_better'
    ),
    (
        'sales_team_win_rate',
        'Win Rate',
        'sales',
        'team',
        'sales',
        'Closed won / total closed',
        'ratio',
        ARRAY ['opportunity'],
        '%',
        'higher_is_better'
    ),
    (
        'sales_team_avg_deal_size',
        'Average Deal Size',
        'sales',
        'team',
        'sales',
        'Average ACV per closed deal',
        'count',
        ARRAY ['opportunity'],
        'currency',
        'higher_is_better'
    ),
    (
        'sales_team_sales_cycle',
        'Sales Cycle Length',
        'sales',
        'team',
        'sales',
        'Average days to close',
        'count',
        ARRAY ['opportunity'],
        'days',
        'lower_is_better'
    ),
    -- CS Team
    (
        'cs_team_logo_retention',
        'Logo Retention',
        'cs',
        'team',
        'cs',
        'Customer logo retention rate',
        'ratio',
        ARRAY ['account'],
        '%',
        'higher_is_better'
    ),
    (
        'cs_team_nrr',
        'Net Revenue Retention',
        'cs',
        'team',
        'cs',
        'Net revenue retention',
        'ratio',
        ARRAY ['subscription'],
        '%',
        'higher_is_better'
    ),
    (
        'cs_team_grr',
        'Gross Revenue Retention',
        'cs',
        'team',
        'cs',
        'Gross revenue retention',
        'ratio',
        ARRAY ['subscription'],
        '%',
        'higher_is_better'
    ),
    (
        'cs_team_sla_attainment',
        'SLA Attainment',
        'cs',
        'team',
        'cs',
        'Tickets meeting SLA',
        'ratio',
        ARRAY ['ticket'],
        '%',
        'higher_is_better'
    ),
    -- Marketing Team
    (
        'mkt_team_lead_volume',
        'Lead Volume',
        'marketing',
        'team',
        'marketing',
        'MQLs/SQLs/PQLs generated',
        'count',
        ARRAY ['person'],
        'count',
        'higher_is_better'
    ),
    (
        'mkt_team_cpl',
        'Cost per Lead',
        'marketing',
        'team',
        'marketing',
        'Cost per lead',
        'count',
        ARRAY ['metric_point'],
        'currency',
        'lower_is_better'
    ),
    (
        'mkt_team_campaign_roi',
        'Campaign ROI',
        'marketing',
        'team',
        'marketing',
        'Return on campaign investment',
        'ratio',
        ARRAY ['campaign', 'metric_point'],
        '%',
        'higher_is_better'
    ),
    -- Product Team
    (
        'prod_team_deploy_freq',
        'Deploy Frequency',
        'product',
        'team',
        'product',
        'Deployments per period',
        'count',
        ARRAY ['event'],
        'count',
        'higher_is_better'
    ),
    (
        'prod_team_change_failure',
        'Change Failure Rate',
        'product',
        'team',
        'product',
        'Failed deployments',
        'ratio',
        ARRAY ['event'],
        '%',
        'lower_is_better'
    ),
    (
        'prod_team_mttr',
        'MTTR',
        'product',
        'team',
        'product',
        'Mean time to recovery',
        'count',
        ARRAY ['ticket'],
        'hours',
        'lower_is_better'
    );
-- ============================================================================
-- 5.7 FREELANCER SIGNALS
-- ============================================================================
INSERT INTO signal_definitions (
        signal_id,
        signal_name,
        signal_category,
        persona_type,
        department,
        description,
        computation_type,
        source_resource_types,
        unit,
        direction
    )
VALUES (
        'freelance_projects_won',
        'Projects Won',
        'focus',
        'freelancer',
        NULL,
        'Projects won vs proposed',
        'ratio',
        ARRAY ['initiative'],
        '%',
        'higher_is_better'
    ),
    (
        'freelance_projects_delivered',
        'Projects Delivered',
        'focus',
        'freelancer',
        NULL,
        'Projects completed on time',
        'ratio',
        ARRAY ['initiative'],
        '%',
        'higher_is_better'
    ),
    (
        'freelance_effective_rate',
        'Effective Hourly Rate',
        'value',
        'freelancer',
        NULL,
        'Revenue / hours worked',
        'ratio',
        ARRAY ['invoice', 'event'],
        'currency',
        'higher_is_better'
    ),
    (
        'freelance_unpaid_invoices',
        'Unpaid Invoices',
        'health',
        'freelancer',
        NULL,
        'Count and value of unpaid invoices',
        'count',
        ARRAY ['invoice'],
        'count',
        'lower_is_better'
    ),
    (
        'freelance_invoice_aging',
        'Invoice Aging',
        'health',
        'freelancer',
        NULL,
        'Average days overdue',
        'count',
        ARRAY ['invoice'],
        'days',
        'lower_is_better'
    ),
    (
        'freelance_revision_rate',
        'Revision Rate',
        'focus',
        'freelancer',
        NULL,
        'Revisions per project',
        'ratio',
        ARRAY ['task'],
        'ratio',
        'lower_is_better'
    ),
    (
        'freelance_client_satisfaction',
        'Client Satisfaction',
        'cs',
        'freelancer',
        NULL,
        'Client satisfaction score',
        'count',
        ARRAY ['metric_point'],
        'score',
        'higher_is_better'
    ),
    (
        'freelance_repeat_business',
        'Repeat Business',
        'sales',
        'freelancer',
        NULL,
        'Percentage of repeat clients',
        'ratio',
        ARRAY ['account', 'initiative'],
        '%',
        'higher_is_better'
    );
-- ============================================================================
-- 6. SIGNAL INSTANCES (Computed values)
-- ============================================================================
CREATE TABLE IF NOT EXISTS signal_instances (
    instance_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    signal_id TEXT NOT NULL REFERENCES signal_definitions(signal_id),
    entity_type TEXT NOT NULL,
    -- person, team, account, workspace
    entity_id TEXT NOT NULL,
    -- ID of the person/team/account
    period_type TEXT NOT NULL,
    -- daily, weekly, monthly, quarterly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    value NUMERIC,
    previous_value NUMERIC,
    trend TEXT,
    -- up, down, stable
    band TEXT,
    -- good, warning, critical
    computation_details JSONB,
    -- How it was computed
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_si_signal ON signal_instances(signal_id);
CREATE INDEX idx_si_entity ON signal_instances(entity_type, entity_id);
CREATE INDEX idx_si_period ON signal_instances(period_start, period_end);
-- ============================================================================
-- 7. TOOL CONNECTIONS (Link to Generic Connector Engine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tool_connections (
    connection_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    tool_type TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    -- e.g., "Salesforce", "HubSpot"
    tool_instance_id TEXT,
    -- Unique ID for this instance
    workspace TEXT,
    -- Which workspace this connection belongs to
    resource_mappings JSONB NOT NULL,
    -- Maps source paths to ResourceType.Trait
    credentials_ref TEXT,
    -- Reference to secure credential store
    sync_frequency TEXT DEFAULT 'hourly',
    -- real-time, hourly, daily
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending',
    -- pending, syncing, success, error
    sync_error TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tc_tool ON tool_connections(tool_type);
CREATE INDEX idx_tc_workspace ON tool_connections(workspace);