/**
 * IntegrateWise - Unified Connector Registry (ALL 50+ Connectors)
 *
 * Generic, department-agnostic connector classification.
 * NO CS-specific assumptions. Works for Sales, Marketing, BizOps, Engineering, etc.
 *
 * Flow Classification:
 * - Flow A: Structured (CRM, Support, Billing, Analytics) → Pipeline → Spine
 * - Flow B: Unstructured (Communication, Productivity, Documents) → Pipeline → Spine + Knowledge
 * - Flow C: AI/Knowledge (Chat, MCP) → D1 → Triage → Knowledge UI
 */

// =============================================================================
// FLOW TYPES (Generic - Not department-specific)
// =============================================================================

export type FlowType = "A" | "B" | "C";

export interface FlowDefinition {
  type: FlowType;
  name: string;
  description: string;
  dataStructure: "structured" | "unstructured" | "ai_generated";
  entryPoint: "loader" | "d1_buffer";
  usesPipeline: boolean;
  spineWrite: "direct" | "refs_only" | "none";
  knowledgeWrite: "none" | "chunks" | "compounding";
  usesTriage: boolean;
  requiresApproval: boolean;
}

export const FLOWS: Record<FlowType, FlowDefinition> = {
  A: {
    type: "A",
    name: "Structured Data",
    description: "CRM, Support, Billing, Analytics - Direct to Spine",
    dataStructure: "structured",
    entryPoint: "loader",
    usesPipeline: true,
    spineWrite: "direct",
    knowledgeWrite: "none",
    usesTriage: false,
    requiresApproval: false,
  },
  B: {
    type: "B",
    name: "Context & Documents",
    description: "Communication, Productivity, Files - Dual Write",
    dataStructure: "unstructured",
    entryPoint: "loader",
    usesPipeline: true,
    spineWrite: "refs_only",
    knowledgeWrite: "chunks",
    usesTriage: false,
    requiresApproval: false,
  },
  C: {
    type: "C",
    name: "AI & Knowledge",
    description: "AI Chat, MCP - Triage to Knowledge UI",
    dataStructure: "ai_generated",
    entryPoint: "d1_buffer",
    usesPipeline: false,
    spineWrite: "none",
    knowledgeWrite: "compounding",
    usesTriage: true,
    requiresApproval: true,
  },
};

// =============================================================================
// CONNECTOR CATEGORIES (Generic)
// =============================================================================

export type ConnectorCategory =
  | "crm" // Customer Relationship Management
  | "support" // Customer Support
  | "billing" // Billing & Invoicing
  | "marketing" // Marketing Automation
  | "analytics" // Analytics & BI
  | "communication" // Email, Chat, Video
  | "productivity" // Documents, Calendar, Storage
  | "project" // Project Management
  | "engineering" // DevTools, Git, CI/CD
  | "hr" // HR & People
  | "finance" // Accounting & Finance
  | "commerce" // E-commerce
  | "ai" // AI & ML
  | "security" // Security & Compliance
  | "custom"; // Custom connectors

// =============================================================================
// UNIFIED CONNECTOR REGISTRY (50+ Connectors)
// =============================================================================

export interface ConnectorDefinition {
  id: string;
  name: string;
  category: ConnectorCategory;
  flow: FlowType;

  // Entity types this connector produces
  // These map to generic spine entity types (not CS-specific)
  entityTypes: string[];

  // Capabilities
  supportsOAuth: boolean;
  supportsAPIKey: boolean;
  supportsWebhooks: boolean;
  supportsSync: boolean;
  supportsFiles: boolean;

  // Sync behavior
  syncMode: "realtime" | "batch" | "mixed";

  // Auth configuration
  auth: {
    type: "oauth2" | "api_key" | "basic" | "custom";
    oauth?: {
      authorizationUrl: string;
      tokenUrl: string;
      scopes: string[];
    };
  };

  // Documentation
  docsUrl?: string;
  iconUrl?: string;

  // Status
  status: "production" | "beta" | "alpha" | "coming_soon";
}

// =============================================================================
// REGISTRY: ALL 50+ CONNECTORS
// =============================================================================

export const UNIFIED_CONNECTOR_REGISTRY: Record<string, ConnectorDefinition> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // CRM (Flow A) - 6 connectors
  // ═══════════════════════════════════════════════════════════════════════════
  salesforce: {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    flow: "A",
    entityTypes: ["account", "contact", "opportunity", "lead", "task", "event"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "production",
  },
  hubspot: {
    id: "hubspot",
    name: "HubSpot CRM",
    category: "crm",
    flow: "A",
    entityTypes: ["account", "contact", "deal", "ticket", "task", "engagement"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "production",
  },
  pipedrive: {
    id: "pipedrive",
    name: "Pipedrive",
    category: "crm",
    flow: "A",
    entityTypes: ["account", "contact", "deal", "activity"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  "zoho-crm": {
    id: "zoho-crm",
    name: "Zoho CRM",
    category: "crm",
    flow: "A",
    entityTypes: ["account", "contact", "deal", "lead", "task"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "production",
  },
  freshsales: {
    id: "freshsales",
    name: "Freshsales",
    category: "crm",
    flow: "A",
    entityTypes: ["account", "contact", "deal", "task"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "production",
  },
  close: {
    id: "close",
    name: "Close",
    category: "crm",
    flow: "A",
    entityTypes: ["account", "contact", "opportunity", "task"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "production",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPORT (Flow A) - 9 connectors
  // ═══════════════════════════════════════════════════════════════════════════
  zendesk: {
    id: "zendesk",
    name: "Zendesk",
    category: "support",
    flow: "A",
    entityTypes: ["ticket", "contact", "account", "article"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  freshdesk: {
    id: "freshdesk",
    name: "Freshdesk",
    category: "support",
    flow: "A",
    entityTypes: ["ticket", "contact", "account"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  intercom: {
    id: "intercom",
    name: "Intercom",
    category: "support",
    flow: "A",
    entityTypes: ["contact", "conversation", "account"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  front: {
    id: "front",
    name: "Front",
    category: "support",
    flow: "A",
    entityTypes: ["ticket", "contact", "conversation"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  helpscout: {
    id: "helpscout",
    name: "Help Scout",
    category: "support",
    flow: "A",
    entityTypes: ["ticket", "contact", "customer"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  kustomer: {
    id: "kustomer",
    name: "Kustomer",
    category: "support",
    flow: "A",
    entityTypes: ["ticket", "contact", "conversation"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  freshworks: {
    id: "freshworks",
    name: "Freshworks CRM",
    category: "support",
    flow: "A",
    entityTypes: ["ticket", "contact", "account"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "production",
  },
  "whatsapp-business": {
    id: "whatsapp-business",
    name: "WhatsApp Business",
    category: "support",
    flow: "A",
    entityTypes: ["message", "contact", "conversation"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  twilio: {
    id: "twilio",
    name: "Twilio",
    category: "support",
    flow: "A",
    entityTypes: ["message", "call", "contact"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "production",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BILLING (Flow A) - 6 connectors
  // ═══════════════════════════════════════════════════════════════════════════
  stripe: {
    id: "stripe",
    name: "Stripe",
    category: "billing",
    flow: "A",
    entityTypes: ["account", "subscription", "invoice", "payment", "product"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  chargebee: {
    id: "chargebee",
    name: "Chargebee",
    category: "billing",
    flow: "A",
    entityTypes: ["account", "subscription", "invoice", "plan"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "mixed",
    auth: { type: "api_key" },
    status: "production",
  },
  paddle: {
    id: "paddle",
    name: "Paddle",
    category: "billing",
    flow: "A",
    entityTypes: ["account", "subscription", "payment", "product"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "mixed",
    auth: { type: "api_key" },
    status: "production",
  },
  quickbooks: {
    id: "quickbooks",
    name: "QuickBooks",
    category: "billing",
    flow: "A",
    entityTypes: ["account", "invoice", "payment", "item"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "production",
  },
  xero: {
    id: "xero",
    name: "Xero",
    category: "billing",
    flow: "A",
    entityTypes: ["account", "invoice", "payment", "contact"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "production",
  },
  freshbooks: {
    id: "freshbooks",
    name: "FreshBooks",
    category: "billing",
    flow: "A",
    entityTypes: ["account", "invoice", "payment", "client"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "production",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKETING (Flow A) - 8 connectors
  // ═══════════════════════════════════════════════════════════════════════════
  "hubspot-marketing": {
    id: "hubspot-marketing",
    name: "HubSpot Marketing",
    category: "marketing",
    flow: "A",
    entityTypes: ["campaign", "form_submission", "email_event", "contact"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "production",
  },
  mailchimp: {
    id: "mailchimp",
    name: "Mailchimp",
    category: "marketing",
    flow: "A",
    entityTypes: ["campaign", "audience", "contact", "email_event"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "production",
  },
  marketo: {
    id: "marketo",
    name: "Marketo",
    category: "marketing",
    flow: "A",
    entityTypes: ["campaign", "lead", "program", "activity"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "production",
  },
  braze: {
    id: "braze",
    name: "Braze",
    category: "marketing",
    flow: "A",
    entityTypes: ["campaign", "user", "event", "canvas"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "production",
  },
  segment: {
    id: "segment",
    name: "Segment",
    category: "marketing",
    flow: "A",
    entityTypes: ["event", "user", "track", "identify"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "production",
  },
  sendgrid: {
    id: "sendgrid",
    name: "SendGrid",
    category: "marketing",
    flow: "A",
    entityTypes: ["email_event", "contact", "list"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "production",
  },
  "customer-io": {
    id: "customer-io",
    name: "Customer.io",
    category: "marketing",
    flow: "A",
    entityTypes: ["campaign", "customer", "event"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "production",
  },
  activecampaign: {
    id: "activecampaign",
    name: "ActiveCampaign",
    category: "marketing",
    flow: "A",
    entityTypes: ["contact", "campaign", "deal", "automation"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "mixed",
    auth: { type: "api_key" },
    status: "beta",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS (Flow A) - 6 connectors
  // ═══════════════════════════════════════════════════════════════════════════
  "google-analytics": {
    id: "google-analytics",
    name: "Google Analytics",
    category: "analytics",
    flow: "A",
    entityTypes: ["event", "user", "session", "goal"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: false,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "production",
  },
  mixpanel: {
    id: "mixpanel",
    name: "Mixpanel",
    category: "analytics",
    flow: "A",
    entityTypes: ["event", "user", "funnel", "retention"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: false,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "api_key" },
    status: "production",
  },
  amplitude: {
    id: "amplitude",
    name: "Amplitude",
    category: "analytics",
    flow: "A",
    entityTypes: ["event", "user", "chart"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: false,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "api_key" },
    status: "production",
  },
  heap: {
    id: "heap",
    name: "Heap",
    category: "analytics",
    flow: "A",
    entityTypes: ["event", "user", "funnel"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: false,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "api_key" },
    status: "production",
  },
  tableau: {
    id: "tableau",
    name: "Tableau",
    category: "analytics",
    flow: "A",
    entityTypes: ["workbook", "view", "datasource"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: false,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "production",
  },
  metabase: {
    id: "metabase",
    name: "Metabase",
    category: "analytics",
    flow: "A",
    entityTypes: ["question", "dashboard", "collection"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: false,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "api_key" },
    status: "beta",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNICATION (Flow B) - 7 connectors
  // ═══════════════════════════════════════════════════════════════════════════
  gmail: {
    id: "gmail",
    name: "Gmail",
    category: "communication",
    flow: "B",
    entityTypes: ["email", "contact", "thread"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  outlook: {
    id: "outlook",
    name: "Microsoft Outlook",
    category: "communication",
    flow: "B",
    entityTypes: ["email", "contact", "event", "calendar"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  slack: {
    id: "slack",
    name: "Slack",
    category: "communication",
    flow: "B",
    entityTypes: ["message", "channel", "user", "file"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  "microsoft-teams": {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    category: "communication",
    flow: "B",
    entityTypes: ["message", "channel", "user", "file"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  discord: {
    id: "discord",
    name: "Discord",
    category: "communication",
    flow: "B",
    entityTypes: ["message", "channel", "user"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "beta",
  },
  zoom: {
    id: "zoom",
    name: "Zoom",
    category: "communication",
    flow: "B",
    entityTypes: ["meeting", "recording", "participant"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  "google-calendar": {
    id: "google-calendar",
    name: "Google Calendar",
    category: "communication",
    flow: "B",
    entityTypes: ["event", "calendar"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTIVITY (Flow B) - 7 connectors
  // ═══════════════════════════════════════════════════════════════════════════
  notion: {
    id: "notion",
    name: "Notion",
    category: "productivity",
    flow: "B",
    entityTypes: ["page", "database", "block", "user"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  "google-drive": {
    id: "google-drive",
    name: "Google Drive",
    category: "productivity",
    flow: "B",
    entityTypes: ["file", "folder"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  dropbox: {
    id: "dropbox",
    name: "Dropbox",
    category: "productivity",
    flow: "B",
    entityTypes: ["file", "folder"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  onedrive: {
    id: "onedrive",
    name: "OneDrive",
    category: "productivity",
    flow: "B",
    entityTypes: ["file", "folder"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  airtable: {
    id: "airtable",
    name: "Airtable",
    category: "productivity",
    flow: "B",
    entityTypes: ["base", "table", "record"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "production",
  },
  calendly: {
    id: "calendly",
    name: "Calendly",
    category: "productivity",
    flow: "B",
    entityTypes: ["event", "invitee", "user"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  confluence: {
    id: "confluence",
    name: "Confluence",
    category: "productivity",
    flow: "B",
    entityTypes: ["page", "space", "blogpost"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "oauth2" },
    status: "beta",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT MANAGEMENT (Flow A or B depending on usage)
  // ═══════════════════════════════════════════════════════════════════════════
  jira: {
    id: "jira",
    name: "Jira",
    category: "project",
    flow: "A", // Can be B if used for documents
    entityTypes: ["issue", "project", "sprint", "board"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "production",
  },
  asana: {
    id: "asana",
    name: "Asana",
    category: "project",
    flow: "A",
    entityTypes: ["task", "project", "section", "user"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "production",
  },
  linear: {
    id: "linear",
    name: "Linear",
    category: "project",
    flow: "A",
    entityTypes: ["issue", "project", "cycle", "team"],
    supportsOAuth: true,
    supportsAPIKey: false,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  monday: {
    id: "monday",
    name: "Monday.com",
    category: "project",
    flow: "A",
    entityTypes: ["board", "item", "column", "user"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "production",
  },
  clickup: {
    id: "clickup",
    name: "ClickUp",
    category: "project",
    flow: "A",
    entityTypes: ["task", "list", "folder", "space"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "beta",
  },
  trello: {
    id: "trello",
    name: "Trello",
    category: "project",
    flow: "A",
    entityTypes: ["card", "board", "list"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: true,
    syncMode: "mixed",
    auth: { type: "oauth2" },
    status: "production",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINEERING (Flow A)
  // ═══════════════════════════════════════════════════════════════════════════
  github: {
    id: "github",
    name: "GitHub",
    category: "engineering",
    flow: "A",
    entityTypes: ["repository", "issue", "pull_request", "commit"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  gitlab: {
    id: "gitlab",
    name: "GitLab",
    category: "engineering",
    flow: "A",
    entityTypes: ["project", "issue", "merge_request", "pipeline"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  bitbucket: {
    id: "bitbucket",
    name: "Bitbucket",
    category: "engineering",
    flow: "A",
    entityTypes: ["repository", "pull_request", "commit"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-COMMERCE (Flow A)
  // ═══════════════════════════════════════════════════════════════════════════
  shopify: {
    id: "shopify",
    name: "Shopify",
    category: "commerce",
    flow: "A",
    entityTypes: ["order", "customer", "product", "inventory"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },
  woocommerce: {
    id: "woocommerce",
    name: "WooCommerce",
    category: "commerce",
    flow: "A",
    entityTypes: ["order", "customer", "product"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "production",
  },
  bigcommerce: {
    id: "bigcommerce",
    name: "BigCommerce",
    category: "commerce",
    flow: "A",
    entityTypes: ["order", "customer", "product"],
    supportsOAuth: true,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "oauth2" },
    status: "production",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AI (Flow C)
  // ═══════════════════════════════════════════════════════════════════════════
  "ai-chat": {
    id: "ai-chat",
    name: "AI Chat",
    category: "ai",
    flow: "C",
    entityTypes: ["session", "message", "insight"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: false,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "beta",
  },
  mcp: {
    id: "mcp",
    name: "MCP (Model Context Protocol)",
    category: "ai",
    flow: "C",
    entityTypes: ["session", "tool_invocation"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: false,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "alpha",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    category: "ai",
    flow: "C",
    entityTypes: ["completion", "embedding"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: false,
    supportsSync: false,
    supportsFiles: false,
    syncMode: "realtime",
    auth: { type: "api_key" },
    status: "production",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HR (Flow A)
  // ═══════════════════════════════════════════════════════════════════════════
  bamboohr: {
    id: "bamboohr",
    name: "BambooHR",
    category: "hr",
    flow: "A",
    entityTypes: ["employee", "time_off", "benefit"],
    supportsOAuth: false,
    supportsAPIKey: true,
    supportsWebhooks: true,
    supportsSync: true,
    supportsFiles: false,
    syncMode: "batch",
    auth: { type: "api_key" },
    status: "beta",
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getConnectorById(id: string): ConnectorDefinition | undefined {
  return UNIFIED_CONNECTOR_REGISTRY[id.toLowerCase()];
}

export function getConnectorsByCategory(category: ConnectorCategory): ConnectorDefinition[] {
  return Object.values(UNIFIED_CONNECTOR_REGISTRY).filter((c) => c.category === category);
}

export function getConnectorsByFlow(flow: FlowType): ConnectorDefinition[] {
  return Object.values(UNIFIED_CONNECTOR_REGISTRY).filter((c) => c.flow === flow);
}

export function getProductionConnectors(): ConnectorDefinition[] {
  return Object.values(UNIFIED_CONNECTOR_REGISTRY).filter((c) => c.status === "production");
}

export function classifyConnector(provider: string): FlowType {
  const connector = getConnectorById(provider);
  return connector?.flow || "A";
}

// Get all available categories with counts
export function getCategoryCounts(): Record<ConnectorCategory, number> {
  const counts = {} as Record<ConnectorCategory, number>;
  Object.values(UNIFIED_CONNECTOR_REGISTRY).forEach((connector) => {
    counts[connector.category] = (counts[connector.category] || 0) + 1;
  });
  return counts;
}

// Total count
export const TOTAL_CONNECTORS = Object.keys(UNIFIED_CONNECTOR_REGISTRY).length;

// Flow counts
export const FLOW_COUNTS = {
  A: Object.values(UNIFIED_CONNECTOR_REGISTRY).filter((c) => c.flow === "A").length,
  B: Object.values(UNIFIED_CONNECTOR_REGISTRY).filter((c) => c.flow === "B").length,
  C: Object.values(UNIFIED_CONNECTOR_REGISTRY).filter((c) => c.flow === "C").length,
};

// Export summary
export const CONNECTOR_SUMMARY = {
  total: TOTAL_CONNECTORS,
  byFlow: FLOW_COUNTS,
  byCategory: getCategoryCounts(),
  production: getProductionConnectors().length,
};
