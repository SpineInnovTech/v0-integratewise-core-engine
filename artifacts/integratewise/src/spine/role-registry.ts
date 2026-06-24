import type { CTXEnum, RoleProfile } from "./types";

/**
 * Departmental role profiles — the per-role surface.
 *
 * Each role declares its module set + a Home profile (KPIs, quick actions,
 * today's focus, signals, schema groups, connectors). Adding a role is a
 * config change here, not a rewrite. Icon fields are lucide-react names,
 * resolved to components at render time.
 */
export const DEPT_PROFILE: Record<CTXEnum, RoleProfile> = {
  CTX_CS: {
    role: "Customer Success Manager",
    modules: ["home", "context", "email", "clients", "sessions", "projects", "deals", "tasks", "knowledge", "integrations", "settings"],
    quickActions: [
      { label: "Log Activity", icon: "MessageSquare" }, { label: "Schedule QBR", icon: "Calendar" },
      { label: "Update Health", icon: "HeartPulse" }, { label: "Escalate Risk", icon: "AlertTriangle" },
      { label: "Create Task", icon: "CheckCircle2" },
    ],
    kpis: [
      { label: "NRR", value: "108%", sub: "+3.2% vs last quarter", up: true, color: "var(--iw-success)" },
      { label: "Avg Health", value: "76", sub: "+2.1 pts MoM", up: true, color: "var(--iw-blue)" },
      { label: "Renewals 60d", value: "7", sub: "$840K ARR at stake", up: false, color: "var(--iw-warning)" },
      { label: "At-Risk Accounts", value: "4", sub: "2 critical, action required", up: false, color: "var(--iw-danger)" },
    ],
    todayFocus: [
      { task: "FinanceFlow — 29 days to renewal, champion silent 12d, risk score 92/100", priority: "critical", context: "Renewal" },
      { task: "TechServe Asia QBR deck — due in 3 days, not started", priority: "high", context: "QBR" },
      { task: "CloudBridge expansion — 2 new teams onboarded, propose upsell before Q3 QBR", priority: "high", context: "Expansion" },
      { task: "Log outcome from yesterday's EBR with DataVault Australia", priority: "medium", context: "Activity" },
    ],
    signals: [
      { text: "FinanceFlow champion (David Park) silent 12d — renewal risk 92/100, critical", type: "warning", time: "2m" },
      { text: "CloudBridge usage up 34% MoM — expansion window open before Q3", type: "success", time: "1h" },
      { text: "TechServe Asia: feature adoption dropped 18% — 2 core modules inactive", type: "warning", time: "3h" },
    ],
    schemaGroups: ["company", "deal", "activity"],
    connectors: ["Salesforce", "Zendesk", "Slack", "Stripe"],
  },
  CTX_SALES: {
    role: "Sales Representative",
    modules: ["home", "context", "email", "leads", "pipeline", "deals", "sales", "clients", "campaigns", "tasks", "knowledge", "integrations", "settings"],
    quickActions: [
      { label: "Log Call", icon: "MessageSquare" }, { label: "Update Stage", icon: "TrendingUp" },
      { label: "Create Proposal", icon: "FileText" }, { label: "Schedule Demo", icon: "Calendar" },
      { label: "Add Contact", icon: "Users" },
    ],
    kpis: [
      { label: "Pipeline", value: "$2.3M", sub: "3.1x coverage vs 4x target", up: false, color: "var(--iw-blue)" },
      { label: "Quota Attainment", value: "68%", sub: "-2.1% behind pace", up: false, color: "var(--iw-warning)" },
      { label: "Won (QTD)", value: "$340K", sub: "+18% vs Q2 same period", up: true, color: "var(--iw-success)" },
      { label: "Deals at Risk", value: "5", sub: "$420K stalled >14 days", up: false, color: "var(--iw-danger)" },
    ],
    todayFocus: [
      { task: "Acme Corp — demo follow-up 3 days, no response, deal going cold", priority: "critical", context: "Deal" },
      { task: "Update 5 deal stages — weekly pipeline review with manager at 3pm", priority: "high", context: "Pipeline" },
      { task: "NovaTech APAC proposal — $180K ACV, legal waiting on your draft", priority: "high", context: "Proposal" },
      { task: "Log yesterday's call with RetailNest procurement — notes in Notion", priority: "medium", context: "Activity" },
    ],
    signals: [
      { text: "3 deals with no activity in 14+ days — close risk before quarter end", type: "warning", time: "5m" },
      { text: "NovaTech APAC champion viewed pricing page twice this week — buying signal", type: "success", time: "1h" },
      { text: "HubSpot lifecycle mismatch on 4 closed-won deals — CRM Reconciler queued", type: "info", time: "2h" },
    ],
    schemaGroups: ["deal", "person", "activity"],
    connectors: ["HubSpot", "Salesforce", "Gmail", "Zoom"],
  },
  CTX_MARKETING: {
    role: "Marketing Manager",
    modules: ["home", "context", "email", "campaigns", "content", "leads", "metrics", "tasks", "knowledge", "integrations", "settings"],
    quickActions: [
      { label: "Launch Campaign", icon: "Zap" }, { label: "Review Performance", icon: "BarChart3" },
      { label: "Route MQLs", icon: "Users" }, { label: "Schedule Post", icon: "Calendar" },
      { label: "Create Brief", icon: "FileText" },
    ],
    kpis: [
      { label: "MQLs (MTD)", value: "142", sub: "+23% vs last month", up: true, color: "var(--iw-blue)" },
      { label: "CAC", value: "$1,240", sub: "-8% MoM — improving", up: true, color: "var(--iw-success)" },
      { label: "Pipeline Generated", value: "$1.1M", sub: "this quarter, vs $800K target", up: true, color: "var(--iw-purple)" },
      { label: "SQL Conversion", value: "18%", sub: "+2.1% vs prior month", up: true, color: "var(--iw-warning)" },
    ],
    todayFocus: [
      { task: "12 hot MQLs unrouted to Sales — SLA breach in <2 hours", priority: "critical", context: "MQL" },
      { task: "APAC webinar performance — $40K spend, review ROI before next week's sync", priority: "high", context: "Campaign" },
      { task: "3 content posts this week missing approval — content calendar stalled", priority: "high", context: "Content" },
      { task: "Q2 attribution report — board presentation next Monday, data needed", priority: "medium", context: "Reporting" },
    ],
    signals: [
      { text: "APAC webinar: 38 registrations, 12 match ICP — route to Sales now", type: "success", time: "30m" },
      { text: "Email bounce rate 4.2% — above 2% threshold, list hygiene required", type: "warning", time: "2h" },
      { text: "LinkedIn ad spend efficiency down 15% — creative fatigue, refresh assets", type: "warning", time: "4h" },
    ],
    schemaGroups: ["person", "campaign", "activity", "document"],
    connectors: ["HubSpot", "Google Analytics", "Mailchimp", "LinkedIn"],
  },
  CTX_BIZOPS: {
    role: "Business Operations Lead",
    modules: ["home", "context", "email", "metrics", "strategy", "architecture", "data-flow", "data-sources", "projects", "tasks", "admin", "integrations", "settings"],
    quickActions: [
      { label: "Review Metrics", icon: "BarChart3" }, { label: "Create Project", icon: "Briefcase" },
      { label: "Approve Proposal", icon: "CheckCircle2" }, { label: "Run Report", icon: "FileText" },
      { label: "Review Schema", icon: "Database" },
    ],
    kpis: [
      { label: "Operational Health", value: "84%", sub: "+2.3% MoM across all functions", up: true, color: "var(--iw-success)" },
      { label: "Open Projects", value: "12", sub: "3 at risk, 1 blocked", up: false, color: "var(--iw-blue)" },
      { label: "Pending Governance", value: "5", sub: "AI proposals awaiting review", up: false, color: "var(--iw-danger)" },
      { label: "Spine Coverage", value: "94%", sub: "data normalised across all tools", up: true, color: "var(--iw-purple)" },
    ],
    todayFocus: [
      { task: "Approve 3 AI proposals in governance queue — oldest is 18h old", priority: "critical", context: "Governance" },
      { task: "Q3 OKR alignment — Sales and CS targets conflicting, reconcile", priority: "high", context: "Planning" },
      { task: "Schema AI: Jira connector v1.1.0 proposed — 2 new fields, review", priority: "high", context: "Schema AI" },
      { task: "Cross-team sync notes — distribute to stakeholders by EOD", priority: "medium", context: "Ops" },
    ],
    signals: [
      { text: "Schema AI: 2 new schemas proposed for Jira connector — confidence 0.91", type: "info", time: "8m" },
      { text: "Q2 NRR: 108%, 4% above target — board slide needs update", type: "success", time: "1h" },
      { text: "Engineering delivery velocity down 12% — 3 consecutive sprints below plan", type: "warning", time: "3h" },
    ],
    schemaGroups: ["company", "deal", "activity", "document", "metric", "platform"],
    connectors: ["Jira", "Notion", "Slack", "Google Workspace"],
  },
  CTX_SUPPORT: {
    role: "Support Team Lead",
    modules: ["home", "context", "email", "clients", "sessions", "tasks", "knowledge", "integrations", "settings"],
    quickActions: [
      { label: "Open Ticket", icon: "Plus" }, { label: "Assign Agent", icon: "Users" },
      { label: "Check SLA", icon: "Clock" }, { label: "Escalate P1", icon: "AlertTriangle" },
      { label: "Add KB Article", icon: "FileText" },
    ],
    kpis: [
      { label: "Open Tickets", value: "47", sub: "8 P1/P2 requiring action", up: false, color: "var(--iw-danger)" },
      { label: "Avg Resolution", value: "4.2h", sub: "-0.8h vs last month", up: true, color: "var(--iw-success)" },
      { label: "CSAT", value: "4.6/5", sub: "+0.2 pts MoM — improving", up: true, color: "var(--iw-success)" },
      { label: "SLA Breaches", value: "3", sub: "this week, 1 escalated", up: false, color: "var(--iw-warning)" },
    ],
    todayFocus: [
      { task: "P1 #4821 — FinanceFlow bulk export timeout, unresolved 72h, renewal customer", priority: "critical", context: "P1 Incident" },
      { task: "5 tickets approaching SLA breach in next 2 hours — reassign", priority: "critical", context: "SLA" },
      { task: "KB gap: 3 tickets this week with no matching article — create content", priority: "high", context: "Knowledge" },
      { task: "Agent Maria at 120% capacity — redistribute 4 tickets", priority: "high", context: "Capacity" },
    ],
    signals: [
      { text: "P1 #4821 (FinanceFlow) unresolved 72h — renewal in 29 days, escalate now", type: "warning", time: "1m" },
      { text: "CSAT 4.6 this week — 3 positive verbatims about response speed", type: "success", time: "2h" },
      { text: "Zendesk schema drift — 2 ticket fields changed, auto-correction queued", type: "info", time: "4h" },
    ],
    schemaGroups: ["activity", "person", "document"],
    connectors: ["Zendesk", "Freshdesk", "Slack", "Jira"],
  },
  CTX_PM: {
    role: "Project Manager",
    modules: ["home", "context", "projects", "tasks", "clients", "sessions", "knowledge", "integrations", "settings"],
    quickActions: [
      { label: "Create Task", icon: "CheckCircle2" }, { label: "Update Status", icon: "Activity" },
      { label: "Log Progress", icon: "FileText" }, { label: "Flag Blocker", icon: "AlertTriangle" },
      { label: "Schedule Review", icon: "Calendar" },
    ],
    kpis: [
      { label: "On Track", value: "7/10", sub: "projects delivering on plan", up: true, color: "var(--iw-success)" },
      { label: "Overdue Tasks", value: "12", sub: "3 are blockers for other teams", up: false, color: "var(--iw-danger)" },
      { label: "Team Utilization", value: "82%", sub: "+4% MoM, approaching limit", up: false, color: "var(--iw-blue)" },
      { label: "On-Time Delivery", value: "87%", sub: "milestone hit rate this quarter", up: true, color: "var(--iw-success)" },
    ],
    todayFocus: [
      { task: "Sprint 6 demo in 2 hours — deck not finalized, 3 features pending demo", priority: "critical", context: "Sprint" },
      { task: "API integration task blocked — Design sign-off pending 3 days", priority: "high", context: "Blocker" },
      { task: "2 slipped milestones — re-plan timelines before stakeholder update", priority: "high", context: "Planning" },
      { task: "Weekly status email to leadership — template ready, needs data", priority: "medium", context: "Comms" },
    ],
    signals: [
      { text: "3 sprint 6 tasks with no update in 4 days — stall risk before demo", type: "warning", time: "10m" },
      { text: "Q2 velocity 15% below plan — delivery risk for Q3 roadmap commitments", type: "warning", time: "1h" },
      { text: "Design handoff complete for Feature X — dev can unblock tomorrow morning", type: "success", time: "2h" },
    ],
    schemaGroups: ["project", "activity", "document"],
    connectors: ["Jira", "Asana", "Notion", "Slack"],
  },
  CTX_TECH: {
    role: "Engineering Lead",
    modules: ["home", "context", "architecture", "data-flow", "data-sources", "projects", "tasks", "integrations", "settings"],
    quickActions: [
      { label: "Create Issue", icon: "Plus" }, { label: "Review PR", icon: "GitBranch" },
      { label: "Log Incident", icon: "AlertTriangle" }, { label: "Deploy", icon: "Zap" },
      { label: "Review Schema", icon: "Database" },
    ],
    kpis: [
      { label: "Deploy Freq", value: "4/wk", sub: "+1 vs last sprint", up: true, color: "var(--iw-success)" },
      { label: "P1 Incidents", value: "1", sub: "active now — FinanceFlow", up: false, color: "var(--iw-danger)" },
      { label: "Sprint Velocity", value: "68 pts", sub: "-8% — 3 sprints trending down", up: false, color: "var(--iw-warning)" },
      { label: "PR Review Time", value: "6.2h", sub: "-1.3h avg, improving", up: true, color: "var(--iw-blue)" },
    ],
    todayFocus: [
      { task: "P1 — FinanceFlow bulk export timing out in prod, root cause unknown", priority: "critical", context: "Incident" },
      { task: "Schema AI: Jira connector v1.1.0 proposed — review 2 new field mappings", priority: "high", context: "Schema AI" },
      { task: "Merge queue — 4 PRs waiting review >24h, team blocked", priority: "high", context: "PR Review" },
      { task: "Postmortem from last deploy rollback — due EOD, template shared", priority: "medium", context: "Ops" },
    ],
    signals: [
      { text: "P1: bulk export service timing out >30s — FinanceFlow affected, open incident", type: "warning", time: "15m" },
      { text: "Jira: 2 new fields detected upstream — Schema AI proposed v1.1.0, confidence 0.88", type: "info", time: "1h" },
      { text: "3 services shipped successfully this morning — deploy pipeline green", type: "success", time: "3h" },
    ],
    schemaGroups: ["project", "activity", "document", "platform"],
    connectors: ["GitHub", "Jira", "PagerDuty", "Datadog"],
  },
  CTX_HR: {
    role: "People & Culture Lead",
    modules: ["home", "context", "tasks", "knowledge", "brainstorming", "sessions", "settings"],
    quickActions: [
      { label: "Post Role", icon: "Plus" }, { label: "Schedule Interview", icon: "Calendar" },
      { label: "Log Review", icon: "FileText" }, { label: "Send Update", icon: "MessageSquare" },
      { label: "Add Person", icon: "Users" },
    ],
    kpis: [
      { label: "Open Roles", value: "8", sub: "3 urgent — engineering pipeline", up: false, color: "var(--iw-warning)" },
      { label: "Time to Hire", value: "32d", sub: "-4 days vs last quarter avg", up: true, color: "var(--iw-success)" },
      { label: "Attrition Rate", value: "7.2%", sub: "+1.1% QoQ — watch signal", up: false, color: "var(--iw-danger)" },
      { label: "Engagement", value: "74%", sub: "+3% MoM — remote policy effect", up: true, color: "var(--iw-blue)" },
    ],
    todayFocus: [
      { task: "3 candidates — final round feedback pending, decision needed today", priority: "critical", context: "Hiring" },
      { task: "6 managers missing Q2 performance reviews — deadline today", priority: "critical", context: "Performance" },
      { task: "New hire starting Monday — onboarding checklist 40% incomplete", priority: "high", context: "Onboarding" },
      { task: "Exit interview — departing senior engineer, understand attrition signal", priority: "medium", context: "Retention" },
    ],
    signals: [
      { text: "2 senior engineers flagged as flight risk by engagement model — intervene", type: "warning", time: "20m" },
      { text: "Engineering hiring funnel 40% below plan — sourcing strategy needs change", type: "warning", time: "2h" },
      { text: "Engagement survey: team satisfaction +3% — remote work policy credited", type: "success", time: "4h" },
    ],
    schemaGroups: ["person", "document"],
    connectors: ["Greenhouse", "Workday", "Slack", "Google Workspace"],
  },
  CTX_FINANCE: {
    role: "Finance Manager",
    modules: ["home", "context", "metrics", "deals", "clients", "products", "services", "tasks", "settings"],
    quickActions: [
      { label: "Create Invoice", icon: "FileText" }, { label: "Review Budget", icon: "BarChart3" },
      { label: "Approve Expense", icon: "CheckCircle2" }, { label: "Run Forecast", icon: "TrendingUp" },
      { label: "Flag Variance", icon: "AlertTriangle" },
    ],
    kpis: [
      { label: "MRR", value: "$118K", sub: "+8.2% MoM — above 6% target", up: true, color: "var(--iw-success)" },
      { label: "Burn Rate", value: "$340K/mo", sub: "-$12K vs plan this month", up: true, color: "var(--iw-blue)" },
      { label: "Overdue AR", value: "$84K", sub: "3 invoices — FinanceFlow flagged", up: false, color: "var(--iw-danger)" },
      { label: "Budget Used", value: "71%", sub: "of Q3, 6 weeks remaining", up: false, color: "var(--iw-warning)" },
    ],
    todayFocus: [
      { task: "FinanceFlow $84K overdue — 2 Stripe failures, payment method expired", priority: "critical", context: "AR" },
      { task: "Q3 budget variance — Marketing over by $40K, get explanation before board", priority: "high", context: "Budget" },
      { task: "Board deck Q2 actuals vs forecast — presentation Friday, data gap", priority: "high", context: "Reporting" },
      { task: "8 pending expense reports >$500 threshold awaiting your approval", priority: "medium", context: "Expenses" },
    ],
    signals: [
      { text: "Stripe: FinanceFlow $42K invoice failed twice — payment method expired", type: "warning", time: "5m" },
      { text: "MRR growth 8.2% — above 6% target, Q3 forecast can be revised upward", type: "success", time: "1h" },
      { text: "Marketing Q3 spend at 89% with 6 weeks remaining — budget alert", type: "warning", time: "3h" },
    ],
    schemaGroups: ["deal", "company", "activity", "product", "service", "metric"],
    connectors: ["Stripe", "QuickBooks", "Xero", "Salesforce"],
  },
  CTX_LEGAL: {
    role: "Legal Counsel",
    modules: ["home", "context", "knowledge", "clients", "deals", "tasks", "settings"],
    quickActions: [
      { label: "Review Contract", icon: "FileText" }, { label: "Flag Risk", icon: "AlertTriangle" },
      { label: "Add Policy", icon: "Shield" }, { label: "Log Decision", icon: "CheckCircle2" },
      { label: "Escalate", icon: "Zap" },
    ],
    kpis: [
      { label: "Active Contracts", value: "34", sub: "6 expiring in 90 days", up: false, color: "var(--iw-blue)" },
      { label: "Review SLA", value: "3.4d", sub: "-0.6 days MoM, improving", up: true, color: "var(--iw-success)" },
      { label: "Open Risks", value: "7", sub: "2 high severity, unresolved", up: false, color: "var(--iw-danger)" },
      { label: "Compliance Score", value: "96%", sub: "+1% QoQ — audit ready", up: true, color: "var(--iw-success)" },
    ],
    todayFocus: [
      { task: "NovaTech APAC MSA — $180K deal, Sales waiting on legal sign-off", priority: "critical", context: "Contract" },
      { task: "DPA amendment — GDPR update required for EU customers next month", priority: "high", context: "Compliance" },
      { task: "3 vendor contracts expiring in 30 days — review renewal terms", priority: "high", context: "Contract" },
      { task: "Compile Q2 approval audit trail — regulator request, due Friday", priority: "medium", context: "Audit" },
    ],
    signals: [
      { text: "NovaTech MSA: Sales waiting on sign-off, deal at risk of slipping quarter", type: "warning", time: "15m" },
      { text: "GDPR DPA update required — EU regulation effective in 30 days", type: "warning", time: "2h" },
      { text: "Compliance audit complete: 96% score, 2 minor items for remediation", type: "success", time: "4h" },
    ],
    schemaGroups: ["document", "company", "activity"],
    connectors: ["DocuSign", "Google Drive", "Notion", "Salesforce"],
  },
};

/** Human-readable labels + accent for each context (sidebar role switcher). */
export const CTX_CONFIG: Record<CTXEnum, { label: string; short: string; accent: string }> = {
  CTX_CS: { label: "Customer Success", short: "CS", accent: "var(--iw-success)" },
  CTX_SALES: { label: "Sales", short: "Sales", accent: "var(--iw-blue)" },
  CTX_MARKETING: { label: "Marketing", short: "Mktg", accent: "var(--iw-purple)" },
  CTX_BIZOPS: { label: "Business Ops", short: "BizOps", accent: "var(--iw-blue-900)" },
  CTX_SUPPORT: { label: "Support", short: "Support", accent: "var(--iw-warning)" },
  CTX_PM: { label: "Project Mgmt", short: "PM", accent: "var(--iw-blue)" },
  CTX_TECH: { label: "Engineering", short: "Tech", accent: "var(--iw-purple)" },
  CTX_HR: { label: "People & Culture", short: "HR", accent: "var(--iw-pink)" },
  CTX_FINANCE: { label: "Finance", short: "Finance", accent: "var(--iw-success)" },
  CTX_LEGAL: { label: "Legal", short: "Legal", accent: "var(--iw-danger)" },
};

export const ALL_ROLES: CTXEnum[] = Object.keys(DEPT_PROFILE) as CTXEnum[];
