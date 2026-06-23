/**
 * Optimized Workspace Configuration
 *
 * Standardized patterns, reduced duplication, and improved maintainability.
 * Uses helper functions to create consistent domain configurations.
 */

export type Domain =
  | "CUSTOMER_SUCCESS"
  | "SALES"
  | "REVOPS"
  | "MARKETING"
  | "PRODUCT_ENGINEERING"
  | "FINANCE"
  | "SERVICE"
  | "PROCUREMENT"
  | "IT_ADMIN"
  | "STUDENT_TEACHER"
  | "PERSONAL"
  | "BIZOPS";

export type WorkspaceView = "PERSONAL" | "WORK";

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface DomainTheme {
  accent: string;
  accentGradient: string;
  accentSoftSurface: string;
  accentSoftBorder: string;
  accentGlow: string;
  accentShadow: string;
  accentStrongShadow: string;
}

export interface DomainConfig {
  domain: Domain;
  label: string;
  icon: string;
  color: string;
  theme: DomainTheme;

  workNavigation: NavSection[];

  dashboardMetrics: Array<{
    id: string;
    label: string;
    type: "number" | "currency" | "percentage" | "trend";
    priority: number;
  }>;

  primaryEntity: {
    type: string;
    label: string;
    icon: string;
  };

  secondaryEntities: Array<{
    type: string;
    label: string;
    icon: string;
  }>;

  connectors: Array<{
    category: "CRM" | "TASK" | "WORKSPACE" | "OTHER";
    options: string[];
  }>;
}

// ─── CONFIGURATION HELPERS ────────────────────────────────────────────────
const createStandardMetrics = (
  domainSpecific: Array<{
    id: string;
    label: string;
    type: "number" | "currency" | "percentage" | "trend";
    priority: number;
  }>
) => [...domainSpecific.slice(0, 5)];

const createStandardConnectors = (specific: Record<string, string[]>) => [
  { category: "CRM" as const, options: specific.CRM || ["Salesforce", "HubSpot"] },
  { category: "TASK" as const, options: specific.TASK || ["Anydo", "Todoist"] },
  { category: "WORKSPACE" as const, options: specific.WORKSPACE || ["Slack", "Teams"] },
  { category: "OTHER" as const, options: specific.OTHER || ["Zapier", "Make"] },
];

const withHexAlpha = (hex: string, alpha: string) => `${hex}${alpha}`;

const createDomainTheme = (accent: string): DomainTheme => ({
  accent,
  accentGradient: `linear-gradient(135deg, ${accent} 0%, ${withHexAlpha(accent, "DD")} 100%)`,
  accentSoftSurface: `linear-gradient(135deg, ${withHexAlpha(accent, "14")}, ${withHexAlpha(accent, "26")})`,
  accentSoftBorder: withHexAlpha(accent, "3D"),
  accentGlow: `linear-gradient(135deg, ${withHexAlpha(accent, "14")}, transparent)`,
  accentShadow: `0 4px 20px -4px ${withHexAlpha(accent, "33")}`,
  accentStrongShadow: `0 8px 28px -8px ${withHexAlpha(accent, "4D")}`,
});

const createDomainVisuals = (accent: string) => ({
  color: accent,
  theme: createDomainTheme(accent),
});

const createHappyPathNav = (prefix: string, domain: Domain): NavSection => ({
  label: "AI Assistant",
  items: [
    {
      id: `${prefix}-today`,
      label: `${prefix === "pe" ? "PE" : prefix.charAt(0).toUpperCase() + prefix.slice(1)} Today`,
      icon: "Sun",
      path: `/work/${prefix}-today`,
    },
    {
      id: `${prefix}-queue`,
      label: `${prefix === "pe" ? "PE" : prefix.charAt(0).toUpperCase() + prefix.slice(1)} Queue`,
      icon: "List",
      path: `/work/${prefix}-queue`,
    },
    {
      id: `${prefix}-decisions`,
      label: `${prefix === "pe" ? "PE" : prefix.charAt(0).toUpperCase() + prefix.slice(1)} Decisions`,
      icon: "Brain",
      path: `/work/${prefix}-decisions`,
    },
  ],
});

const createAdminNav = (): NavSection => ({
  label: "System",
  items: [
    { id: "fabric-admin", label: "Fabric Admin", icon: "Settings", path: "/work/fabric-admin" },
    { id: "settings", label: "Settings", icon: "Cog", path: "/work/settings" },
  ],
});

// ─── OPTIMIZED DOMAIN CONFIGURATIONS ────────────────────────────────────────
export const DOMAIN_CONFIGS: Record<Domain, DomainConfig> = {
  CUSTOMER_SUCCESS: {
    domain: "CUSTOMER_SUCCESS",
    label: "Account Success",
    icon: "💚",
    ...createDomainVisuals("#1a3a2a"),

    workNavigation: [
      // ─── L1: Primary day-to-day surfaces ───────────────────────────────────
      // Type 1 (AS only) + Type 2 (AS + TAM) share this base.
      // Type 2 adds: API Portfolio, Platform Health (TAM-specific).
      // Projection rule: CTX_AS only — no BizOps modules ever projected here.
      {
        label: "L1",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          { id: "accounts", label: "Accounts", icon: "Building2", path: "/work/accounts" },
          { id: "cs-today", label: "Today", icon: "Sun", path: "/work/cs-today" },
          { id: "tasks", label: "Tasks", icon: "CheckSquare", path: "/work/tasks" },
          { id: "meetings", label: "Meetings", icon: "Calendar", path: "/work/meetings" },
          { id: "renewals", label: "Renewals", icon: "RefreshCw", path: "/work/renewals" },
          {
            id: "risk-matrix",
            label: "Risk Matrix",
            icon: "AlertTriangle",
            path: "/work/risk-matrix",
          },
          { id: "at-risk", label: "At-Risk", icon: "AlertTriangle", path: "/work/at-risk" },
          {
            id: "account-health",
            label: "Health Scores",
            icon: "HeartPulse",
            path: "/work/account-health",
          },
          {
            id: "api-portfolio",
            label: "API Portfolio",
            icon: "Code",
            path: "/work/api-portfolio",
          },
          {
            id: "engagement-log",
            label: "Engagement Log",
            icon: "Activity",
            path: "/work/engagement-log",
          },
        ],
      },
      // ─── Intelligence: CS-scoped only (insights, queue, decisions) ───────────
      // NOTE: generic "Business Intelligence" was removed here — BI is a cross-org
      // analytics surface owned by BizOps (bizops/views/business-intelligence-view).
      // A role-scoped CS projection should not surface org-wide BI. CS keeps its
      // own signal Insights, work Queue, and Decision log.
      {
        label: "Intelligence",
        items: [
          { id: "insights", label: "Insights", icon: "Zap", path: "/work/insights" },
          { id: "cs-queue", label: "Queue", icon: "List", path: "/work/cs-queue" },
          { id: "cs-decisions", label: "Decisions", icon: "Brain", path: "/work/cs-decisions" },
        ],
      },
      // ─── Tools: Twin, Knowledge, Workflows, Settings ────────────────────────
      {
        label: "Tools",
        items: [
          { id: "knowledge", label: "Knowledge", icon: "BookOpen", path: "/work/knowledge" },
          { id: "workflows", label: "Workflows", icon: "Repeat", path: "/work/workflows" },
          { id: "settings", label: "Settings", icon: "Settings", path: "/work/settings" },
        ],
      },
    ],

    dashboardMetrics: createStandardMetrics([
      { id: "arr", label: "Total ARR", type: "currency" as const, priority: 1 },
      { id: "health_avg", label: "Avg Health Score", type: "number" as const, priority: 2 },
      { id: "at_risk", label: "At-Risk Accounts", type: "number" as const, priority: 3 },
      {
        id: "expansion_pipeline",
        label: "Expansion Pipeline",
        type: "currency" as const,
        priority: 4,
      },
      { id: "nps", label: "NPS Score", type: "number" as const, priority: 5 },
    ]),

    primaryEntity: { type: "account", label: "Accounts", icon: "Building2" },

    secondaryEntities: [
      { type: "contact", label: "Contacts", icon: "Users" },
      { type: "meeting", label: "Meetings", icon: "Calendar" },
      { type: "task", label: "Tasks", icon: "CheckSquare" },
    ],

    connectors: createStandardConnectors({
      CRM: ["Salesforce", "HubSpot", "Zoho"],
      TASK: ["Anydo", "Todoist"],
    }),
  },

  SALES: {
    domain: "SALES",
    label: "Sales",
    icon: "💰",
    ...createDomainVisuals("#2d5a3d"),

    workNavigation: [
      {
        label: "Core",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          { id: "pipeline", label: "Pipeline", icon: "Funnel", path: "/work/pipeline" },
          {
            id: "pipeline-kanban",
            label: "Pipeline Kanban",
            icon: "Columns",
            path: "/work/pipeline-kanban",
          },
          { id: "deals", label: "Deals", icon: "Handshake", path: "/work/deals" },
          { id: "contacts", label: "Contacts", icon: "Users", path: "/work/contacts" },
        ],
      },
      {
        label: "Operations",
        items: [
          { id: "activities", label: "Activities", icon: "Calendar", path: "/work/activities" },
          {
            id: "forecasting",
            label: "Forecasting",
            icon: "TrendingUp",
            path: "/work/forecasting",
          },
          { id: "quotes", label: "Quotes", icon: "FileText", path: "/work/quotes" },
          { id: "sequences", label: "Sequences", icon: "Repeat", path: "/work/sequences" },
          {
            id: "sales-analytics",
            label: "Analytics",
            icon: "BarChart3",
            path: "/work/sales-analytics",
          },
        ],
      },
      createHappyPathNav("sales", "SALES"),
      createAdminNav(),
    ],

    dashboardMetrics: createStandardMetrics([
      { id: "pipeline_value", label: "Pipeline Value", type: "currency" as const, priority: 1 },
      { id: "closed_won", label: "Closed Won", type: "currency" as const, priority: 2 },
      { id: "conversion_rate", label: "Conversion Rate", type: "percentage" as const, priority: 3 },
      { id: "deal_velocity", label: "Deal Velocity", type: "trend" as const, priority: 4 },
      {
        id: "quota_attainment",
        label: "Quota Attainment",
        type: "percentage" as const,
        priority: 5,
      },
    ]),

    primaryEntity: { type: "deal", label: "Deals", icon: "Handshake" },

    secondaryEntities: [
      { type: "account", label: "Accounts", icon: "Building2" },
      { type: "contact", label: "Contacts", icon: "Users" },
      { type: "activity", label: "Activities", icon: "Calendar" },
    ],

    connectors: createStandardConnectors({
      CRM: ["Salesforce", "HubSpot", "Pipedrive"],
      TASK: ["Anydo", "Todoist"],
    }),
  },

  MARKETING: {
    domain: "MARKETING",
    label: "Marketing",
    icon: "📱",
    ...createDomainVisuals("#b8943f"),

    workNavigation: [
      {
        label: "Core",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          { id: "campaigns", label: "Campaigns", icon: "Megaphone", path: "/work/campaigns" },
          { id: "leads", label: "Leads", icon: "Users", path: "/work/leads" },
          { id: "analytics", label: "Analytics", icon: "BarChart", path: "/work/analytics" },
        ],
      },
      {
        label: "Channels",
        items: [
          { id: "email", label: "Email", icon: "Mail", path: "/work/email" },
          { id: "social", label: "Social", icon: "Share2", path: "/work/social" },
          { id: "blog", label: "Blog", icon: "FileText", path: "/work/blog" },
          { id: "website", label: "Website", icon: "Globe", path: "/work/website" },
        ],
      },
      {
        label: "Content",
        items: [
          { id: "forms", label: "Forms", icon: "Square", path: "/work/forms" },
          { id: "seo", label: "SEO", icon: "Search", path: "/work/seo" },
          { id: "media", label: "Media", icon: "Image", path: "/work/media" },
          { id: "pages", label: "Pages", icon: "FileText", path: "/work/pages" },
          { id: "theme", label: "Theme", icon: "Palette", path: "/work/theme" },
        ],
      },
      createHappyPathNav("marketing", "MARKETING"),
      createAdminNav(),
    ],

    dashboardMetrics: createStandardMetrics([
      { id: "leads_generated", label: "Leads Generated", type: "number" as const, priority: 1 },
      { id: "conversion_rate", label: "Conversion Rate", type: "percentage" as const, priority: 2 },
      { id: "campaign_roi", label: "Campaign ROI", type: "percentage" as const, priority: 3 },
      { id: "website_traffic", label: "Website Traffic", type: "trend" as const, priority: 4 },
      { id: "email_open_rate", label: "Email Open Rate", type: "percentage" as const, priority: 5 },
    ]),

    primaryEntity: { type: "campaign", label: "Campaigns", icon: "Megaphone" },

    secondaryEntities: [
      { type: "lead", label: "Leads", icon: "Users" },
      { type: "content", label: "Content", icon: "FileText" },
      { type: "channel", label: "Channels", icon: "Share2" },
    ],

    connectors: createStandardConnectors({
      CRM: ["HubSpot", "Marketo", "Pardot"],
      WORKSPACE: ["Slack", "Teams"],
    }),
  },

  // Simplified remaining domains for brevity - follow same pattern
  REVOPS: {
    domain: "REVOPS",
    label: "Revenue Operations",
    icon: "📊",
    ...createDomainVisuals("#28332c"),
    workNavigation: [
      {
        label: "Core",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          { id: "pipeline", label: "Pipeline", icon: "Funnel", path: "/work/pipeline" },
          {
            id: "forecasting",
            label: "Forecasting",
            icon: "TrendingUp",
            path: "/work/forecasting",
          },
          { id: "quotas", label: "Quotas", icon: "Target", path: "/work/quotas" },
        ],
      },
      {
        label: "Intelligence",
        items: [
          { id: "analytics", label: "Analytics", icon: "BarChart3", path: "/work/analytics" },
          { id: "cohorts", label: "Cohorts", icon: "Users", path: "/work/cohorts" },
          { id: "team", label: "Team", icon: "Users", path: "/work/team" },
          { id: "metrics", label: "Metrics", icon: "Activity", path: "/work/metrics" },
        ],
      },
      {
        label: "Review",
        items: [
          {
            id: "pending-review",
            label: "Pending Review",
            icon: "Clock",
            path: "/work/pending-review",
          },
          {
            id: "decision-log",
            label: "Decision Log",
            icon: "FileCheck",
            path: "/work/decision-log",
          },
        ],
      },
      createHappyPathNav("revops", "REVOPS"),
      createAdminNav(),
    ],
    dashboardMetrics: createStandardMetrics([
      { id: "total_revenue", label: "Total Revenue", type: "currency" as const, priority: 1 },
      { id: "pipeline_value", label: "Pipeline Value", type: "currency" as const, priority: 2 },
    ]),
    primaryEntity: { type: "revenue", label: "Revenue", icon: "DollarSign" },
    secondaryEntities: [{ type: "pipeline", label: "Pipeline", icon: "Funnel" }],
    connectors: createStandardConnectors({}),
  },

  PRODUCT_ENGINEERING: {
    domain: "PRODUCT_ENGINEERING",
    label: "Product & Engineering",
    icon: "⚙️",
    ...createDomainVisuals("#2d5a3d"),
    workNavigation: [
      {
        label: "Core",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          {
            id: "incident-queue",
            label: "Incident Queue",
            icon: "AlertTriangle",
            path: "/work/incident-queue",
          },
          { id: "roadmap", label: "Roadmap", icon: "Map", path: "/work/roadmap" },
          { id: "features", label: "Features", icon: "Zap", path: "/work/features" },
          { id: "bugs", label: "Bugs", icon: "Bug", path: "/work/bugs" },
        ],
      },
      {
        label: "Development",
        items: [
          { id: "sprints", label: "Sprints", icon: "Timer", path: "/work/sprints" },
          { id: "tasks", label: "Tasks", icon: "CheckSquare", path: "/work/tasks" },
          { id: "releases", label: "Releases", icon: "Package", path: "/work/releases" },
          { id: "analytics", label: "Analytics", icon: "BarChart3", path: "/work/analytics" },
          { id: "feedback", label: "Feedback", icon: "MessageCircle", path: "/work/feedback" },
        ],
      },
      createHappyPathNav("pe", "PRODUCT_ENGINEERING"),
      createAdminNav(),
    ],
    dashboardMetrics: createStandardMetrics([
      { id: "active_incidents", label: "Active Incidents", type: "number" as const, priority: 1 },
      { id: "uptime", label: "Uptime", type: "percentage" as const, priority: 2 },
    ]),
    primaryEntity: { type: "incident", label: "Incidents", icon: "AlertTriangle" },
    secondaryEntities: [{ type: "feature", label: "Features", icon: "Zap" }],
    connectors: createStandardConnectors({ WORKSPACE: ["GitHub", "Jira"] }),
  },

  FINANCE: {
    domain: "FINANCE",
    label: "Finance",
    icon: "💳",
    ...createDomainVisuals("#2d5a3d"),
    workNavigation: [
      {
        label: "Core",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          { id: "revenue", label: "Revenue", icon: "DollarSign", path: "/work/revenue" },
          { id: "expenses", label: "Expenses", icon: "CreditCard", path: "/work/expenses" },
          { id: "invoices", label: "Invoices", icon: "FileText", path: "/work/invoices" },
          {
            id: "invoice-approvals",
            label: "Approvals",
            icon: "CheckCircle",
            path: "/work/invoice-approvals",
          },
        ],
      },
      {
        label: "Planning",
        items: [
          { id: "budget", label: "Budget", icon: "Calculator", path: "/work/budget" },
          {
            id: "forecasting",
            label: "Forecasting",
            icon: "TrendingUp",
            path: "/work/forecasting",
          },
          { id: "reports", label: "Reports", icon: "FileBarChart", path: "/work/reports" },
        ],
      },
      {
        label: "Operations",
        items: [
          { id: "billing", label: "Billing", icon: "Receipt", path: "/work/billing" },
          { id: "accounting", label: "Accounting", icon: "BookOpen", path: "/work/accounting" },
          { id: "tax", label: "Tax", icon: "Landmark", path: "/work/tax" },
          { id: "payroll", label: "Payroll", icon: "Wallet", path: "/work/payroll" },
          { id: "collections", label: "Collections", icon: "Banknote", path: "/work/collections" },
          {
            id: "payment-portal",
            label: "Payment Portal",
            icon: "CreditCard",
            path: "/work/payment-portal",
          },
          { id: "compliance", label: "Compliance", icon: "Shield", path: "/work/compliance" },
          {
            id: "data-governance",
            label: "Data Governance",
            icon: "Database",
            path: "/work/data-governance",
          },
        ],
      },
      createHappyPathNav("finance", "FINANCE"),
      createAdminNav(),
    ],
    dashboardMetrics: createStandardMetrics([
      { id: "total_revenue", label: "Total Revenue", type: "currency" as const, priority: 1 },
      { id: "total_expenses", label: "Total Expenses", type: "currency" as const, priority: 2 },
    ]),
    primaryEntity: { type: "invoice", label: "Invoices", icon: "FileText" },
    secondaryEntities: [{ type: "expense", label: "Expenses", icon: "CreditCard" }],
    connectors: createStandardConnectors({}),
  },

  SERVICE: {
    domain: "SERVICE",
    label: "Customer Service",
    icon: "🎧",
    ...createDomainVisuals("#3d7a50"),
    workNavigation: [
      {
        label: "Core",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          {
            id: "sla-dashboard",
            label: "SLA Dashboard",
            icon: "Gauge",
            path: "/work/sla-dashboard",
          },
          { id: "tickets", label: "Tickets", icon: "HelpCircle", path: "/work/tickets" },
          { id: "customers", label: "Customers", icon: "Users", path: "/work/customers" },
        ],
      },
      {
        label: "Intelligence",
        items: [
          { id: "knowledge", label: "Knowledge Base", icon: "BookOpen", path: "/work/knowledge" },
          { id: "analytics", label: "Analytics", icon: "BarChart3", path: "/work/analytics" },
          { id: "satisfaction", label: "Satisfaction", icon: "Heart", path: "/work/satisfaction" },
        ],
      },
      createHappyPathNav("service", "SERVICE"),
      createAdminNav(),
    ],
    dashboardMetrics: createStandardMetrics([
      { id: "open_tickets", label: "Open Tickets", type: "number" as const, priority: 1 },
      { id: "sla_compliance", label: "SLA Compliance", type: "percentage" as const, priority: 2 },
    ]),
    primaryEntity: { type: "ticket", label: "Tickets", icon: "HelpCircle" },
    secondaryEntities: [{ type: "customer", label: "Customers", icon: "Users" }],
    connectors: createStandardConnectors({}),
  },

  PROCUREMENT: {
    domain: "PROCUREMENT",
    label: "Procurement",
    icon: "📦",
    ...createDomainVisuals("#8a8580"),
    workNavigation: [
      {
        label: "Core",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          { id: "vendors", label: "Vendors", icon: "Building", path: "/work/vendors" },
          { id: "orders", label: "Orders", icon: "ShoppingCart", path: "/work/orders" },
          { id: "contracts", label: "Contracts", icon: "FileText", path: "/work/contracts" },
        ],
      },
      {
        label: "Financial",
        items: [
          { id: "spend", label: "Spend Analysis", icon: "DollarSign", path: "/work/spend" },
          { id: "savings", label: "Savings", icon: "PiggyBank", path: "/work/savings" },
          { id: "renewals", label: "Renewals", icon: "RefreshCw", path: "/work/renewals" },
        ],
      },
      createHappyPathNav("procurement", "PROCUREMENT"),
      createAdminNav(),
    ],
    dashboardMetrics: createStandardMetrics([
      { id: "total_spend", label: "Total Spend", type: "currency" as const, priority: 1 },
      { id: "active_orders", label: "Active Orders", type: "number" as const, priority: 2 },
    ]),
    primaryEntity: { type: "vendor", label: "Vendors", icon: "Building" },
    secondaryEntities: [{ type: "order", label: "Orders", icon: "ShoppingCart" }],
    connectors: createStandardConnectors({}),
  },

  IT_ADMIN: {
    domain: "IT_ADMIN",
    label: "IT & Admin",
    icon: "🖥️",
    ...createDomainVisuals("#1a3a2a"),
    workNavigation: [
      {
        label: "Core",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          {
            id: "infrastructure",
            label: "Infrastructure",
            icon: "Server",
            path: "/work/infrastructure",
          },
          { id: "systems", label: "Systems", icon: "Monitor", path: "/work/systems" },
          { id: "security", label: "Security", icon: "Shield", path: "/work/security" },
          { id: "networks", label: "Networks", icon: "Network", path: "/work/networks" },
        ],
      },
      {
        label: "Management",
        items: [
          { id: "users", label: "Users", icon: "Users", path: "/work/users" },
          { id: "devices", label: "Devices", icon: "Laptop", path: "/work/devices" },
          { id: "backups", label: "Backups", icon: "HardDrive", path: "/work/backups" },
          { id: "integrations", label: "Integrations", icon: "Plug", path: "/work/integrations" },
        ],
      },
      {
        label: "Operations",
        items: [
          { id: "monitoring", label: "Monitoring", icon: "Activity", path: "/work/monitoring" },
          { id: "incidents", label: "Incidents", icon: "AlertTriangle", path: "/work/incidents" },
          { id: "maintenance", label: "Maintenance", icon: "Wrench", path: "/work/maintenance" },
          { id: "automation", label: "Automation", icon: "Cog", path: "/work/automation" },
        ],
      },
      {
        label: "Compliance",
        items: [
          { id: "compliance", label: "Compliance", icon: "Shield", path: "/work/compliance" },
          { id: "audits", label: "Audits", icon: "ClipboardCheck", path: "/work/audits" },
          { id: "performance", label: "Performance", icon: "Gauge", path: "/work/performance" },
          { id: "capacity", label: "Capacity", icon: "BarChart", path: "/work/capacity" },
        ],
      },
      {
        label: "Intelligence",
        items: [
          { id: "it-insights", label: "IT Insights", icon: "Brain", path: "/work/it-insights" },
          {
            id: "security-alerts",
            label: "Security Alerts",
            icon: "Bell",
            path: "/work/security-alerts",
          },
          {
            id: "system-health",
            label: "System Health",
            icon: "HeartPulse",
            path: "/work/system-health",
          },
          {
            id: "resource-utilization",
            label: "Resources",
            icon: "Cpu",
            path: "/work/resource-utilization",
          },
          {
            id: "compliance-reports",
            label: "Compliance Reports",
            icon: "FileCheck",
            path: "/work/compliance-reports",
          },
          { id: "audit-logs", label: "Audit Logs", icon: "ScrollText", path: "/work/audit-logs" },
          {
            id: "incident-response",
            label: "Incident Response",
            icon: "Siren",
            path: "/work/incident-response",
          },
          {
            id: "change-management",
            label: "Change Mgmt",
            icon: "GitPullRequest",
            path: "/work/change-management",
          },
        ],
      },
      createHappyPathNav("it-admin", "IT_ADMIN"),
      createAdminNav(),
    ],
    dashboardMetrics: createStandardMetrics([
      { id: "system_uptime", label: "System Uptime", type: "percentage" as const, priority: 1 },
      { id: "security_alerts", label: "Security Alerts", type: "number" as const, priority: 2 },
    ]),
    primaryEntity: { type: "system", label: "Systems", icon: "Server" },
    secondaryEntities: [{ type: "user", label: "Users", icon: "Users" }],
    connectors: createStandardConnectors({}),
  },

  STUDENT_TEACHER: {
    domain: "STUDENT_TEACHER",
    label: "Student / Teacher",
    icon: "🎓",
    ...createDomainVisuals("#3d7a50"),
    workNavigation: [
      {
        label: "Core",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          { id: "courses", label: "Courses", icon: "BookOpen", path: "/work/courses" },
          {
            id: "assignments",
            label: "Assignments",
            icon: "ClipboardList",
            path: "/work/assignments",
          },
          { id: "grades", label: "Grades", icon: "Award", path: "/work/grades" },
        ],
      },
      {
        label: "Collaboration",
        items: [
          {
            id: "discussions",
            label: "Discussions",
            icon: "MessageSquare",
            path: "/work/discussions",
          },
          { id: "projects", label: "Projects", icon: "Folder", path: "/work/projects" },
          { id: "at-risk", label: "At-Risk", icon: "AlertTriangle", path: "/work/at-risk" },
        ],
      },
      createHappyPathNav("student", "STUDENT_TEACHER"),
      createAdminNav(),
    ],
    dashboardMetrics: createStandardMetrics([
      { id: "active_students", label: "Active Students", type: "number" as const, priority: 1 },
      {
        id: "course_completion",
        label: "Course Completion",
        type: "percentage" as const,
        priority: 2,
      },
    ]),
    primaryEntity: { type: "student", label: "Students", icon: "Users" },
    secondaryEntities: [{ type: "course", label: "Courses", icon: "BookOpen" }],
    connectors: createStandardConnectors({}),
  },

  BIZOPS: {
    domain: "BIZOPS",
    label: "Business Operations",
    icon: "⚡",
    ...createDomainVisuals("#2d5a3d"),
    workNavigation: [
      // ─── L1: Command ────────────────────────────────────────────────────────
      // Dashboard + Strategy & Leadership. First things an exec sees.
      {
        label: "L1",
        items: [
          { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/work/dashboard" },
          {
            id: "strategic-hub",
            label: "Strategic Hub",
            icon: "Target",
            path: "/work/strategic-hub",
          },
          { id: "founder-ops", label: "Founder Ops", icon: "Rocket", path: "/work/founder-ops" },
          { id: "ceo-view", label: "CEO View", icon: "Crown", path: "/work/ceo-view" },
          { id: "coo-view", label: "COO View", icon: "Settings", path: "/work/coo-view" },
          { id: "cio-cto-view", label: "CIO / CTO View", icon: "Code", path: "/work/cio-cto-view" },
        ],
      },
      // ─── Departments: 12 departments — CTX_BIZOPS only ──────────────────────
      // Customer Success here = executive lens over AS workbench.
      // Projection rule: never visible to CTX_AS users.
      {
        label: "Departments",
        items: [
          {
            id: "dept--marketing",
            label: "Marketing",
            icon: "Mail",
            path: "/work/marketing--dashboard",
          },
          { id: "dept--sales", label: "Sales", icon: "DollarSign", path: "/work/sales-hub" },
          { id: "dept--cs", label: "Customer Success", icon: "Heart", path: "/work/cs--dashboard" },
          {
            id: "dept--product-eng",
            label: "Product & Eng",
            icon: "Code",
            path: "/work/pe--dashboard",
          },
          {
            id: "dept--operations",
            label: "Operations",
            icon: "Settings",
            path: "/work/ops-command-center",
          },
          {
            id: "dept--finance",
            label: "Finance",
            icon: "CreditCard",
            path: "/work/finance--dashboard",
          },
          {
            id: "dept--hr",
            label: "Human Resources",
            icon: "Users",
            path: "/work/human-resources",
          },
          {
            id: "dept--legal",
            label: "Legal & Compliance",
            icon: "Shield",
            path: "/work/legal-compliance",
          },
          {
            id: "dept--bi",
            label: "Business Intelligence",
            icon: "BarChart3",
            path: "/work/business-intelligence",
          },
          {
            id: "dept--it",
            label: "IT & Infrastructure",
            icon: "Activity",
            path: "/work/it-admin--dashboard",
          },
          {
            id: "dept--partnerships",
            label: "Partnerships",
            icon: "Share2",
            path: "/work/partnerships",
          },
          {
            id: "dept--knowledge",
            label: "Knowledge",
            icon: "BookOpen",
            path: "/work/knowledge-management",
          },
        ],
      },
      // ─── Intelligence: BizOps Today, Queue, Decisions ───────────────────────
      {
        label: "Intelligence",
        items: [
          { id: "bizops-today", label: "BizOps Today", icon: "Sun", path: "/work/bizops-today" },
          { id: "bizops-queue", label: "Queue", icon: "List", path: "/work/bizops-queue" },
          {
            id: "bizops-decisions",
            label: "Decisions",
            icon: "Brain",
            path: "/work/bizops-decisions",
          },
        ],
      },
      // ─── Tools: universal — same as every other domain ───────────────────────
      {
        label: "Tools",
        items: [
          { id: "knowledge", label: "Knowledge", icon: "BookOpen", path: "/work/knowledge" },
          {
            id: "document-governance",
            label: "Document Governance",
            icon: "Shield",
            path: "/work/document-governance",
          },
          { id: "workflows", label: "Workflows", icon: "GitBranch", path: "/work/workflows" },
          { id: "settings", label: "Settings", icon: "Settings", path: "/work/settings" },
        ],
      },
    ],
    dashboardMetrics: createStandardMetrics([
      { id: "active_projects", label: "Active Projects", type: "number" as const, priority: 1 },
      {
        id: "workflow_efficiency",
        label: "Workflow Efficiency",
        type: "percentage" as const,
        priority: 2,
      },
    ]),
    primaryEntity: { type: "project", label: "Projects", icon: "Folder" },
    secondaryEntities: [{ type: "workflow", label: "Workflows", icon: "GitBranch" }],
    connectors: createStandardConnectors({}),
  },

  PERSONAL: {
    domain: "PERSONAL",
    label: "Personal",
    icon: "👤",
    ...createDomainVisuals("#2d5a3d"),
    workNavigation: [
      {
        label: "Personal",
        items: [
          {
            id: "dashboard",
            label: "Personal Dashboard",
            icon: "LayoutDashboard",
            path: "/personal/dashboard",
          },
          { id: "hub-today", label: "Today", icon: "Sun", path: "/personal/hub-today" },
          { id: "tasks", label: "Tasks", icon: "CheckSquare", path: "/personal/tasks" },
          { id: "calendar", label: "Calendar", icon: "Calendar", path: "/personal/calendar" },
          { id: "notes", label: "Notes", icon: "FileText", path: "/personal/notes" },
          { id: "projects", label: "Projects", icon: "Folder", path: "/personal/projects" },
          {
            id: "knowledge-hub",
            label: "Knowledge Hub",
            icon: "Brain",
            path: "/personal/knowledge-hub",
          },
          { id: "bookmarks", label: "Bookmarks", icon: "Bookmark", path: "/personal/bookmarks" },
          { id: "whats-new", label: "What's New", icon: "Sparkles", path: "/personal/whats-new" },
          { id: "ai-chat", label: "AI Chat", icon: "MessageSquare", path: "/personal/ai-chat" },
        ],
      },
      createAdminNav(),
    ],
    dashboardMetrics: createStandardMetrics([
      { id: "tasks_completed", label: "Tasks Completed", type: "number" as const, priority: 1 },
      {
        id: "productivity_score",
        label: "Productivity Score",
        type: "percentage" as const,
        priority: 2,
      },
    ]),
    primaryEntity: { type: "task", label: "Tasks", icon: "CheckSquare" },
    secondaryEntities: [{ type: "note", label: "Notes", icon: "FileText" }],
    connectors: createStandardConnectors({}),
  },
};

// ─── DEDICATED LAYER WORKBENCHES ───────────────────────────────────────────
// Customer Product (Intelligence side):
//   L1 + L2 + L3 (Twin) + L4 (Memory) + L7 (Approval Center — insights only)
// Internal Customer Zero (full):
//   + L5 (Operations) + L6 (Execution)
//
// IW: Collects, Understands, Remembers, Reasons, Proposes, Governs, Packages (Execution Package).
// Customer: Executes on their own infrastructure.
// Twin produces first-class Execution Packages for handoff.
export const LAYER_NAV_SECTION: NavSection = {
  label: "Layers",
  items: [
    { id: "twin", label: "Twin Workbench", icon: "MessageSquare", path: "/work/twin" },
    { id: "memory", label: "Knowledge Workbench", icon: "Brain", path: "/work/memory" },
    { id: "governance", label: "Approval Center", icon: "Shield", path: "/work/governance" },
  ],
};

// Full layers only for internal Customer Zero showcase
export const FULL_LAYER_NAV_SECTION: NavSection = {
  label: "Layers",
  items: [
    { id: "twin", label: "Twin Workbench", icon: "MessageSquare", path: "/work/twin" },
    { id: "memory", label: "Knowledge Workbench", icon: "Brain", path: "/work/memory" },
    {
      id: "operations",
      label: "Operations Workbench",
      icon: "GitBranch",
      path: "/work/operations",
    },
    { id: "execution", label: "Execution / Handoff", icon: "Zap", path: "/work/execution" },
    { id: "governance", label: "Governance Workbench", icon: "Shield", path: "/work/governance" },
  ],
};

const PERSONAL_LAYER_NAV_SECTION: NavSection = {
  label: "Layers",
  items: [
    { id: "twin", label: "Twin Workbench", icon: "MessageSquare", path: "/personal/twin" },
    { id: "memory", label: "Knowledge Workbench", icon: "Brain", path: "/personal/memory" },
    {
      id: "governance",
      label: "Approval Center",
      icon: "Shield",
      path: "/personal/governance",
    },
  ],
};

/** Append the layer section unless the nav already includes one */
function withLayerNav(sections: NavSection[], layerSection: NavSection): NavSection[] {
  if (sections.some((s) => s.label === "Layers")) return sections;
  // Insert before the trailing "System" section when present
  const systemIdx = sections.findIndex((s) => s.label === "System");
  if (systemIdx >= 0) {
    return [...sections.slice(0, systemIdx), layerSection, ...sections.slice(systemIdx)];
  }
  return [...sections, layerSection];
}

// ─── NAVIGATION GETTERS ────────────────────────────────────────────────────
export function getPersonalNavigation(): NavSection[] {
  return withLayerNav(DOMAIN_CONFIGS.PERSONAL.workNavigation, PERSONAL_LAYER_NAV_SECTION);
}

export function getWorkNavigation(domain: Domain, fullLayers = false): NavSection[] {
  const layerSection = fullLayers ? FULL_LAYER_NAV_SECTION : LAYER_NAV_SECTION;
  return withLayerNav(DOMAIN_CONFIGS[domain].workNavigation, layerSection);
}

export function getDomainConfig(domain: Domain): DomainConfig {
  return DOMAIN_CONFIGS[domain];
}

// ─── VALIDATION ────────────────────────────────────────────────────────────
export function isValidDomain(domain: string): domain is Domain {
  return Object.keys(DOMAIN_CONFIGS).includes(domain);
}

export function isValidModule(domain: Domain, moduleId: string): boolean {
  const nav = getWorkNavigation(domain);
  return nav.some((section) => section.items.some((item) => item.id === moduleId));
}
