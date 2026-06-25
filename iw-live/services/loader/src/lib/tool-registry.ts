/**
 * Tool Registry - Central configuration for all webhook-enabled tools
 * This allows tools to be active/inactive without code changes
 */

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  category: "integration" | "cron" | "loader" | "api" | "system";
  enabled: boolean;
  endpoint: string;
  methods: string[];
  requiresAuth: boolean;
  requiresIdempotency: boolean;
  handler: string;
  healthCheck?: string;
  metadata?: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

export const TOOL_REGISTRY: ToolConfig[] = [
  // ============================================================================
  // INTEGRATIONS - External service webhooks
  // ============================================================================
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment and subscription webhooks",
    category: "integration",
    enabled: true,
    endpoint: "/webhooks/stripe",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "stripeHandler",
    healthCheck: "/tools/stripe/health",
    metadata: { provider: "stripe", version: "v1" },
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM webhooks for contacts, deals, companies",
    category: "integration",
    enabled: true,
    endpoint: "/webhooks/hubspot",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "hubspotHandler",
    healthCheck: "/tools/hubspot/health",
    metadata: { provider: "hubspot", version: "v3" },
  },
  {
    id: "slack",
    name: "Slack",
    description: "Slack workspace events and interactions",
    category: "integration",
    enabled: true,
    endpoint: "/webhooks/slack",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "slackHandler",
    healthCheck: "/tools/slack/health",
    metadata: { provider: "slack", version: "v0" },
  },
  {
    id: "discord",
    name: "Discord",
    description: "Discord bot interactions",
    category: "integration",
    enabled: true,
    endpoint: "/webhooks/discord",
    methods: ["POST"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "discordHandler",
    healthCheck: "/tools/discord/health",
    metadata: { provider: "discord", version: "v10" },
  },
  {
    id: "notion",
    name: "Notion",
    description: "Notion workspace webhooks",
    category: "integration",
    enabled: true,
    endpoint: "/webhooks/notion",
    methods: ["POST"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "notionHandler",
    healthCheck: "/tools/notion/health",
    metadata: { provider: "notion", version: "v1" },
  },
  {
    id: "ai-relay",
    name: "AI Relay",
    description: "AI completion events from AI-Relay Gateway",
    category: "integration",
    enabled: true,
    endpoint: "/webhooks/ai-relay",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "aiRelayHandler",
    healthCheck: "/tools/ai-relay/health",
    metadata: { provider: "ai-relay", version: "v1" },
  },
  {
    id: "asana",
    name: "Asana",
    description: "Asana project and task webhooks",
    category: "integration",
    enabled: true,
    endpoint: "/webhooks/asana",
    methods: ["POST"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "asanaHandler",
    healthCheck: "/tools/asana/health",
    metadata: { provider: "asana", version: "v1" },
  },
  {
    id: "github",
    name: "GitHub",
    description: "GitHub repository webhooks",
    category: "integration",
    enabled: true,
    endpoint: "/webhooks/github",
    methods: ["POST"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "githubHandler",
    healthCheck: "/tools/github/health",
    metadata: { provider: "github", version: "v1" },
  },
  {
    id: "webflow",
    name: "Webflow",
    description: "Webflow site webhooks for forms, CMS, and e-commerce",
    category: "integration",
    enabled: true,
    endpoint: "/webhooks/webflow",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "webflowHandler",
    healthCheck: "/tools/webflow/health",
    metadata: { provider: "webflow", version: "v2" },
  },

  // ============================================================================
  // CRON JOBS - Scheduled tasks
  // ============================================================================
  {
    id: "daily-insights",
    name: "Daily Insights",
    description: "Generate daily AI insights",
    category: "cron",
    enabled: true,
    endpoint: "/webhooks/cron/daily-insights",
    methods: ["POST", "GET"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "dailyInsightsHandler",
    healthCheck: "/tools/daily-insights/health",
    metadata: { schedule: "0 9 * * *", timezone: "UTC" },
  },
  {
    id: "hourly-insights",
    name: "Hourly Insights",
    description: "Generate hourly AI insights",
    category: "cron",
    enabled: true,
    endpoint: "/webhooks/cron/hourly-insights",
    methods: ["POST", "GET"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "hourlyInsightsHandler",
    healthCheck: "/tools/hourly-insights/health",
    metadata: { schedule: "0 * * * *", timezone: "UTC" },
  },
  {
    id: "spend-insights",
    name: "Spend Insights",
    description: "Calculate spend analytics",
    category: "cron",
    enabled: true,
    endpoint: "/webhooks/cron/spend-insights",
    methods: ["POST", "GET"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "spendInsightsHandler",
    healthCheck: "/tools/spend-insights/health",
    metadata: { schedule: "0 8 * * *", timezone: "UTC" },
  },
  {
    id: "outbox",
    name: "Outbox Processor",
    description: "Process queued outbox events",
    category: "cron",
    enabled: true,
    endpoint: "/webhooks/cron/outbox",
    methods: ["POST", "GET"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "outboxHandler",
    healthCheck: "/tools/outbox/health",
    metadata: { schedule: "*/5 * * * *", timezone: "UTC" },
  },
  {
    id: "integrity-check",
    name: "Integrity Check",
    description: "Database integrity validation",
    category: "cron",
    enabled: true,
    endpoint: "/webhooks/cron/integrity-check",
    methods: ["POST", "GET"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "integrityCheckHandler",
    healthCheck: "/tools/integrity-check/health",
    metadata: { schedule: "0 3 * * *", timezone: "UTC" },
  },
  {
    id: "sync-scheduler",
    name: "Sync Scheduler",
    description: "Schedule data synchronization",
    category: "cron",
    enabled: true,
    endpoint: "/webhooks/cron/sync-scheduler",
    methods: ["POST", "GET"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "syncSchedulerHandler",
    healthCheck: "/tools/sync-scheduler/health",
    metadata: { schedule: "0 */6 * * *", timezone: "UTC" },
  },

  // ============================================================================
  // DATA LOADERS - Data ingestion tools
  // ============================================================================
  {
    id: "loader-slack",
    name: "Slack Loader",
    description: "Ingest data from Slack",
    category: "loader",
    enabled: true,
    endpoint: "/webhooks/loader/slack",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "slackLoaderHandler",
    healthCheck: "/tools/loader-slack/health",
    metadata: { source: "slack", type: "loader" },
  },
  {
    id: "loader-hubspot",
    name: "HubSpot Loader",
    description: "Ingest data from HubSpot",
    category: "loader",
    enabled: true,
    endpoint: "/webhooks/loader/hubspot",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "hubspotLoaderHandler",
    healthCheck: "/tools/loader-hubspot/health",
    metadata: { source: "hubspot", type: "loader" },
  },
  {
    id: "loader-notion",
    name: "Notion Loader",
    description: "Ingest data from Notion",
    category: "loader",
    enabled: true,
    endpoint: "/webhooks/loader/notion",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "notionLoaderHandler",
    healthCheck: "/tools/loader-notion/health",
    metadata: { source: "notion", type: "loader" },
  },
  {
    id: "loader-gmail",
    name: "Gmail Loader",
    description: "Ingest data from Gmail",
    category: "loader",
    enabled: true,
    endpoint: "/webhooks/loader/gmail",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "gmailLoaderHandler",
    healthCheck: "/tools/loader-gmail/health",
    metadata: { source: "gmail", type: "loader" },
  },
  {
    id: "loader-sheets",
    name: "Google Sheets Loader",
    description: "Ingest data from Google Sheets",
    category: "loader",
    enabled: true,
    endpoint: "/webhooks/loader/sheets",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "sheetsLoaderHandler",
    healthCheck: "/tools/loader-sheets/health",
    metadata: { source: "sheets", type: "loader" },
  },

  // ============================================================================
  // API ENDPOINTS - API webhook versions
  // ============================================================================
  {
    id: "webform",
    name: "Webform",
    description: "Public contact/lead form submissions",
    category: "api",
    enabled: true,
    endpoint: "/webform",
    methods: ["GET", "POST"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "webformHandler",
    healthCheck: "/tools/webform/health",
    metadata: { type: "public-form" },
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    description: "Brainstorming analysis webhooks",
    category: "api",
    enabled: true,
    endpoint: "/webhooks/brainstorm",
    methods: ["POST"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "brainstormHandler",
    healthCheck: "/tools/brainstorm/health",
    metadata: { type: "ai-analysis" },
  },
  {
    id: "neutron-ingest",
    name: "Neutron Ingest",
    description: "Neutron data ingestion webhook",
    category: "api",
    enabled: true,
    endpoint: "/webhooks/neutron/ingest",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "neutronIngestHandler",
    healthCheck: "/tools/neutron-ingest/health",
    metadata: { type: "data-ingestion" },
  },
  {
    id: "data-sync",
    name: "Data Sync",
    description: "Data synchronization webhook",
    category: "api",
    enabled: true,
    endpoint: "/webhooks/data-sync",
    methods: ["POST"],
    requiresAuth: true,
    requiresIdempotency: true,
    handler: "dataSyncHandler",
    healthCheck: "/tools/data-sync/health",
    metadata: { type: "sync" },
  },
  {
    id: "webhook-scheduler",
    name: "Webhook Scheduler",
    description: "Trigger scheduled webhooks",
    category: "api",
    enabled: true,
    endpoint: "/webhooks/scheduler/trigger",
    methods: ["POST"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "webhookSchedulerHandler",
    healthCheck: "/tools/webhook-scheduler/health",
    metadata: { type: "scheduler" },
  },

  // ============================================================================
  // SYSTEM - System-level tools
  // ============================================================================
  {
    id: "health",
    name: "Health Check",
    description: "System health monitoring",
    category: "system",
    enabled: true,
    endpoint: "/health",
    methods: ["GET"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "healthHandler",
    healthCheck: "/health",
    metadata: { type: "monitoring" },
  },
  {
    id: "telemetry",
    name: "Telemetry",
    description: "Metrics, tracing, and observability data",
    category: "system",
    enabled: true,
    endpoint: "/telemetry",
    methods: ["GET"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "telemetryHandler",
    healthCheck: "/telemetry/health",
    metadata: { type: "observability" },
  },
  {
    id: "nettools",
    name: "Network Tools",
    description: "Network diagnostics and connectivity testing",
    category: "system",
    enabled: true,
    endpoint: "/nettools",
    methods: ["GET"],
    requiresAuth: false,
    requiresIdempotency: false,
    handler: "nettoolsHandler",
    healthCheck: "/nettools/diagnostics",
    metadata: { type: "diagnostics" },
  },
];

/**
 * Get tool configuration by ID
 */
export function getToolConfig(id: string): ToolConfig | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}

/**
 * Get all enabled tools
 */
export function getEnabledTools(): ToolConfig[] {
  return TOOL_REGISTRY.filter((tool) => tool.enabled);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolConfig["category"]): ToolConfig[] {
  return TOOL_REGISTRY.filter((tool) => tool.category === category && tool.enabled);
}

/**
 * Check if tool is enabled
 */
export function isToolEnabled(id: string): boolean {
  const tool = getToolConfig(id);
  return tool?.enabled ?? false;
}
