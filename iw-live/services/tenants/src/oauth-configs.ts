/**
 * OAuth Configuration for ALL 51 Connectors
 * Classified by Flow A/B/C
 */

// OAuth Stats Tracking
export const OAUTH_STATS = {
  totalConnections: 0,
  activeConnections: 0,
  failedConnections: 0,
  lastSync: null as string | null,
  get total() {
    return Object.keys(OAUTH_REGISTRY).length;
  },
  get flowA() {
    return Object.values(OAUTH_REGISTRY).filter((c) => c.flowType === "A").length;
  },
  get flowB() {
    return Object.values(OAUTH_REGISTRY).filter((c) => c.flowType === "B").length;
  },
  get flowC() {
    return Object.values(OAUTH_REGISTRY).filter((c) => c.flowType === "C").length;
  },
  get byAuthType() {
    return {
      oauth2: Object.values(OAUTH_REGISTRY).filter((c) => c.authType === "oauth2").length,
      oauth1: Object.values(OAUTH_REGISTRY).filter((c) => c.authType === "oauth1").length,
      apikey: Object.values(OAUTH_REGISTRY).filter((c) => c.authType === "apikey").length,
      token: Object.values(OAUTH_REGISTRY).filter((c) => c.authType === "token").length,
    };
  },
};

export interface OAuthConfig {
  provider: string;
  flowType: "A" | "B" | "C";
  category: string;
  authType: "oauth2" | "oauth1" | "apikey" | "token";
  endpoints: {
    authorize: string;
    token: string;
    revoke?: string;
  };
  scopes: string[];
  pkce?: boolean;
  additionalParams?: Record<string, string>;
}

// ============================================
// FLOW A - STRUCTURED (35 connectors)
// PATH: OAuth → Loader → Pipeline → Spine
// ============================================

// CRM Connectors (6)
export const SALESFORCE_OAUTH: OAuthConfig = {
  provider: "salesforce",
  flowType: "A",
  category: "crm",
  authType: "oauth2",
  endpoints: {
    authorize: "https://login.salesforce.com/services/oauth2/authorize",
    token: "https://login.salesforce.com/services/oauth2/token",
    revoke: "https://login.salesforce.com/services/oauth2/revoke",
  },
  scopes: ["api", "refresh_token"],
  pkce: true,
};

export const HUBSPOT_OAUTH: OAuthConfig = {
  provider: "hubspot",
  flowType: "A",
  category: "crm",
  authType: "oauth2",
  endpoints: {
    authorize: "https://app.hubspot.com/oauth/authorize",
    token: "https://api.hubapi.com/oauth/v1/token",
  },
  scopes: [
    "oauth",
    "crm.objects.contacts.read",
    "crm.objects.contacts.write",
    "crm.objects.companies.read",
    "crm.objects.companies.write",
    "crm.objects.deals.read",
    "crm.objects.deals.write",
  ],
  pkce: false,
};

export const PIPEDRIVE_OAUTH: OAuthConfig = {
  provider: "pipedrive",
  flowType: "A",
  category: "crm",
  authType: "oauth2",
  endpoints: {
    authorize: "https://oauth.pipedrive.com/oauth/authorize",
    token: "https://oauth.pipedrive.com/oauth/token",
  },
  scopes: ["deals:read", "contacts:read", "activities:read", "users:read"],
  pkce: true,
};

export const ZOHO_CRM_OAUTH: OAuthConfig = {
  provider: "zoho-crm",
  flowType: "A",
  category: "crm",
  authType: "oauth2",
  endpoints: {
    authorize: "https://accounts.zoho.com/oauth/v2/auth",
    token: "https://accounts.zoho.com/oauth/v2/token",
    revoke: "https://accounts.zoho.com/oauth/v2/revoke",
  },
  scopes: ["ZohoCRM.modules.ALL", "ZohoCRM.users.ALL"],
  pkce: true,
};

export const FRESHSALES_OAUTH: OAuthConfig = {
  provider: "freshsales",
  flowType: "A",
  category: "crm",
  authType: "oauth2",
  endpoints: {
    authorize: "https://auth.freshworks.com/oauth/authorize",
    token: "https://auth.freshworks.com/oauth/token",
  },
  scopes: ["read", "write"],
  pkce: true,
};

export const CLOSE_OAUTH: OAuthConfig = {
  provider: "close",
  flowType: "A",
  category: "crm",
  authType: "apikey",
  endpoints: {
    authorize: "", // API key based
    token: "https://api.close.com/api/v1/me/",
  },
  scopes: [],
};

// Support Connectors (9)
export const ZENDESK_OAUTH: OAuthConfig = {
  provider: "zendesk",
  flowType: "A",
  category: "support",
  authType: "oauth2",
  endpoints: {
    authorize: "https://{subdomain}.zendesk.com/oauth/authorizations/new",
    token: "https://{subdomain}.zendesk.com/oauth/tokens",
  },
  scopes: ["read", "write"],
  pkce: true,
};

export const FRESHDESK_OAUTH: OAuthConfig = {
  provider: "freshdesk",
  flowType: "A",
  category: "support",
  authType: "oauth2",
  endpoints: {
    authorize: "https://{subdomain}.freshdesk.com/oauth/authorize",
    token: "https://{subdomain}.freshdesk.com/oauth/token",
  },
  scopes: ["read:tickets", "write:tickets", "read:contacts", "read:companies"],
  pkce: true,
};

export const FRONT_OAUTH: OAuthConfig = {
  provider: "front",
  flowType: "A",
  category: "support",
  authType: "oauth2",
  endpoints: {
    authorize: "https://app.frontapp.com/oauth/authorize",
    token: "https://app.frontapp.com/oauth/token",
  },
  scopes: ["read", "write"],
  pkce: true,
};

export const HELPSCOUT_OAUTH: OAuthConfig = {
  provider: "helpscout",
  flowType: "A",
  category: "support",
  authType: "oauth2",
  endpoints: {
    authorize: "https://secure.helpscout.net/authentication/authorizeClientApplication",
    token: "https://api.helpscout.net/v2/oauth2/token",
  },
  scopes: ["read", "write"],
  pkce: true,
};

export const INTERCOM_OAUTH: OAuthConfig = {
  provider: "intercom",
  flowType: "A",
  category: "support",
  authType: "oauth2",
  endpoints: {
    authorize: "https://app.intercom.com/oauth",
    token: "https://api.intercom.io/auth/eagle/token",
  },
  scopes: ["read", "write"],
  pkce: false,
};

export const KUSTOMER_OAUTH: OAuthConfig = {
  provider: "kustomer",
  flowType: "A",
  category: "support",
  authType: "oauth2",
  endpoints: {
    authorize: "https://{subdomain}.kustomerapp.com/oauth/authorize",
    token: "https://{subdomain}.kustomerapp.com/oauth/token",
  },
  scopes: [
    "org.read",
    "org.admin",
    "org.permission.customer",
    "org.permission.company",
    "org.permission.conversation",
    "org.permission.user",
  ],
  pkce: true,
};

export const WHATSAPP_BUSINESS_OAUTH: OAuthConfig = {
  provider: "whatsapp-business",
  flowType: "A",
  category: "support",
  authType: "oauth2",
  endpoints: {
    authorize: "https://www.facebook.com/v18.0/dialog/oauth",
    token: "https://graph.facebook.com/v18.0/oauth/access_token",
  },
  scopes: ["whatsapp_business_management", "whatsapp_business_messaging", "business_management"],
  pkce: true,
};

export const CRISP_OAUTH: OAuthConfig = {
  provider: "crisp",
  flowType: "A",
  category: "support",
  authType: "oauth2",
  endpoints: {
    authorize: "https://app.crisp.chat/initiate/plugin/0/oauth2/authorize",
    token: "https://app.crisp.chat/initiate/plugin/0/oauth2/token",
  },
  scopes: ["session:read", "session:write", "people:read", "people:write"],
  pkce: true,
};

export const DRIFT_OAUTH: OAuthConfig = {
  provider: "drift",
  flowType: "A",
  category: "support",
  authType: "oauth2",
  endpoints: {
    authorize: "https://dev.drift.com/authorize",
    token: "https://driftapi.com/oauth2/token",
  },
  scopes: ["contacts:read", "conversations:read", "user:read"],
  pkce: true,
};

// Billing Connectors (6)
export const STRIPE_OAUTH: OAuthConfig = {
  provider: "stripe",
  flowType: "A",
  category: "billing",
  authType: "oauth2",
  endpoints: {
    authorize: "https://connect.stripe.com/oauth/authorize",
    token: "https://connect.stripe.com/oauth/token",
  },
  scopes: ["read_write"],
  pkce: false,
};

export const CHARGEBEE_OAUTH: OAuthConfig = {
  provider: "chargebee",
  flowType: "A",
  category: "billing",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://{site}.chargebee.com/api/v2/",
  },
  scopes: [],
};

export const PADDLE_OAUTH: OAuthConfig = {
  provider: "paddle",
  flowType: "A",
  category: "billing",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://vendors.paddle.com/api/2.0/",
  },
  scopes: [],
};

export const QUICKBOOKS_OAUTH: OAuthConfig = {
  provider: "quickbooks",
  flowType: "A",
  category: "billing",
  authType: "oauth2",
  endpoints: {
    authorize: "https://appcenter.intuit.com/connect/oauth2",
    token: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
  },
  scopes: ["com.intuit.quickbooks.accounting", "com.intuit.quickbooks.payment"],
  pkce: true,
};

export const XERO_OAUTH: OAuthConfig = {
  provider: "xero",
  flowType: "A",
  category: "billing",
  authType: "oauth2",
  endpoints: {
    authorize: "https://login.xero.com/identity/connect/authorize",
    token: "https://identity.xero.com/connect/token",
  },
  scopes: [
    "openid",
    "profile",
    "email",
    "accounting.transactions",
    "accounting.contacts",
    "accounting.settings",
  ],
  pkce: true,
};

export const FRESHBOOKS_OAUTH: OAuthConfig = {
  provider: "freshbooks",
  flowType: "A",
  category: "billing",
  authType: "oauth2",
  endpoints: {
    authorize: "https://my.freshbooks.com/service/auth/oauth/authorize",
    token: "https://api.freshbooks.com/auth/oauth/token",
  },
  scopes: ["user:profile:read", "user:clients:read", "user:invoices:read"],
  pkce: true,
};

// Marketing Connectors (8)
export const HUBSPOT_MARKETING_OAUTH: OAuthConfig = {
  provider: "hubspot-marketing",
  flowType: "A",
  category: "marketing",
  authType: "oauth2",
  endpoints: {
    authorize: "https://app.hubspot.com/oauth/authorize",
    token: "https://api.hubapi.com/oauth/v1/token",
  },
  scopes: ["oauth", "forms", "automation", "content", "reports"],
  pkce: false,
};

export const MAILCHIMP_OAUTH: OAuthConfig = {
  provider: "mailchimp",
  flowType: "A",
  category: "marketing",
  authType: "oauth2",
  endpoints: {
    authorize: "https://login.mailchimp.com/oauth2/authorize",
    token: "https://login.mailchimp.com/oauth2/token",
  },
  scopes: [""],
  pkce: true,
};

export const MARKETO_OAUTH: OAuthConfig = {
  provider: "marketo",
  flowType: "A",
  category: "marketing",
  authType: "oauth2",
  endpoints: {
    authorize: "https://{munchkinId}.mktorest.com/identity/oauth/token",
    token: "https://{munchkinId}.mktorest.com/identity/oauth/token",
  },
  scopes: ["read-write"],
  pkce: false,
};

export const BRAZE_OAUTH: OAuthConfig = {
  provider: "braze",
  flowType: "A",
  category: "marketing",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://rest.{region}.braze.com/",
  },
  scopes: [],
};

export const SEGMENT_OAUTH: OAuthConfig = {
  provider: "segment",
  flowType: "A",
  category: "marketing",
  authType: "token",
  endpoints: {
    authorize: "",
    token: "https://api.segmentapis.com/",
  },
  scopes: [],
};

export const SENDGRID_OAUTH: OAuthConfig = {
  provider: "sendgrid",
  flowType: "A",
  category: "marketing",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://api.sendgrid.com/v3/",
  },
  scopes: [],
};

export const CUSTOMER_IO_OAUTH: OAuthConfig = {
  provider: "customer-io",
  flowType: "A",
  category: "marketing",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://track.customer.io/api/v1/",
  },
  scopes: [],
};

export const KLAVIYO_OAUTH: OAuthConfig = {
  provider: "klaviyo",
  flowType: "A",
  category: "marketing",
  authType: "oauth2",
  endpoints: {
    authorize: "https://www.klaviyo.com/oauth/authorize",
    token: "https://a.klaviyo.com/oauth/token",
  },
  scopes: ["accounts:read", "campaigns:read", "lists:read", "metrics:read", "profiles:read"],
  pkce: true,
};

// Analytics Connectors (6)
export const GOOGLE_ANALYTICS_OAUTH: OAuthConfig = {
  provider: "google-analytics",
  flowType: "A",
  category: "analytics",
  authType: "oauth2",
  endpoints: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
  },
  scopes: [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/analytics",
  ],
  pkce: true,
};

export const MIXPANEL_OAUTH: OAuthConfig = {
  provider: "mixpanel",
  flowType: "A",
  category: "analytics",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://mixpanel.com/api/2.0/",
  },
  scopes: [],
};

export const AMPLITUDE_OAUTH: OAuthConfig = {
  provider: "amplitude",
  flowType: "A",
  category: "analytics",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://amplitude.com/api/2/",
  },
  scopes: [],
};

export const HEAP_OAUTH: OAuthConfig = {
  provider: "heap",
  flowType: "A",
  category: "analytics",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://heapanalytics.com/api/",
  },
  scopes: [],
};

export const TABLEAU_OAUTH: OAuthConfig = {
  provider: "tableau",
  flowType: "A",
  category: "analytics",
  authType: "oauth2",
  endpoints: {
    authorize: "https://{server}/api/{apiVersion}/auth/signin",
    token: "https://{server}/api/{apiVersion}/auth/signin",
  },
  scopes: ["tableau:workbooks:read", "tableau:views:read", "tableau:datasources:read"],
  pkce: true,
};

export const METABASE_OAUTH: OAuthConfig = {
  provider: "metabase",
  flowType: "A",
  category: "analytics",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://{host}/api/",
  },
  scopes: [],
};

// Project Management Connectors (6)
export const JIRA_OAUTH: OAuthConfig = {
  provider: "jira",
  flowType: "A",
  category: "project",
  authType: "oauth2",
  endpoints: {
    authorize: "https://auth.atlassian.com/authorize",
    token: "https://auth.atlassian.com/oauth/token",
  },
  scopes: ["read:jira-work", "read:jira-user", "write:jira-work"],
  pkce: true,
};

export const ASANA_OAUTH: OAuthConfig = {
  provider: "asana",
  flowType: "A",
  category: "project",
  authType: "oauth2",
  endpoints: {
    authorize: "https://app.asana.com/-/oauth_authorize",
    token: "https://app.asana.com/-/oauth_token",
  },
  scopes: ["default"],
  pkce: true,
};

export const LINEAR_OAUTH: OAuthConfig = {
  provider: "linear",
  flowType: "A",
  category: "project",
  authType: "oauth2",
  endpoints: {
    authorize: "https://linear.app/oauth/authorize",
    token: "https://api.linear.app/oauth/token",
  },
  scopes: ["read", "write", "issues:create", "comments:create"],
  pkce: true,
};

export const MONDAY_OAUTH: OAuthConfig = {
  provider: "monday",
  flowType: "A",
  category: "project",
  authType: "oauth2",
  endpoints: {
    authorize: "https://auth.monday.com/oauth/authorize",
    token: "https://auth.monday.com/oauth/token",
  },
  scopes: ["me:read", "boards:read", "boards:write", "users:read"],
  pkce: true,
};

export const CLICKUP_OAUTH: OAuthConfig = {
  provider: "clickup",
  flowType: "A",
  category: "project",
  authType: "oauth2",
  endpoints: {
    authorize: "https://app.clickup.com/api",
    token: "https://api.clickup.com/api/v2/oauth/token",
  },
  scopes: [""],
  pkce: true,
};

export const TRELLO_OAUTH: OAuthConfig = {
  provider: "trello",
  flowType: "A",
  category: "project",
  authType: "oauth1",
  endpoints: {
    authorize: "https://trello.com/1/OAuthAuthorizeToken",
    token: "https://trello.com/1/OAuthGetAccessToken",
  },
  scopes: ["read", "write"],
};

// Engineering Connectors (3)
export const GITHUB_OAUTH: OAuthConfig = {
  provider: "github",
  flowType: "A",
  category: "engineering",
  authType: "oauth2",
  endpoints: {
    authorize: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
  },
  scopes: ["repo", "read:org", "read:user", "read:discussion"],
  pkce: true,
};

export const GITLAB_OAUTH: OAuthConfig = {
  provider: "gitlab",
  flowType: "A",
  category: "engineering",
  authType: "oauth2",
  endpoints: {
    authorize: "https://gitlab.com/oauth/authorize",
    token: "https://gitlab.com/oauth/token",
  },
  scopes: ["read_api", "read_repository", "read_user"],
  pkce: true,
};

export const BITBUCKET_OAUTH: OAuthConfig = {
  provider: "bitbucket",
  flowType: "A",
  category: "engineering",
  authType: "oauth2",
  endpoints: {
    authorize: "https://bitbucket.org/site/oauth2/authorize",
    token: "https://bitbucket.org/site/oauth2/access_token",
  },
  scopes: ["repository", "pullrequest:read", "account:read"],
  pkce: true,
};

// Commerce Connectors (3)
export const SHOPIFY_OAUTH: OAuthConfig = {
  provider: "shopify",
  flowType: "A",
  category: "commerce",
  authType: "oauth2",
  endpoints: {
    authorize: "https://{shop}.myshopify.com/admin/oauth/authorize",
    token: "https://{shop}.myshopify.com/admin/oauth/access_token",
  },
  scopes: ["read_products", "read_customers", "read_orders", "read_analytics"],
  pkce: false,
};

export const WOOCOMMERCE_OAUTH: OAuthConfig = {
  provider: "woocommerce",
  flowType: "A",
  category: "commerce",
  authType: "apikey",
  endpoints: {
    authorize: "",
    token: "https://{store}/wp-json/wc/v3/",
  },
  scopes: [],
};

export const BIGCOMMERCE_OAUTH: OAuthConfig = {
  provider: "bigcommerce",
  flowType: "A",
  category: "commerce",
  authType: "oauth2",
  endpoints: {
    authorize: "https://login.bigcommerce.com/oauth2/authorize",
    token: "https://login.bigcommerce.com/oauth2/token",
  },
  scopes: [
    "store_v2_information_read",
    "store_v2_customers_read",
    "store_v2_orders_read",
    "store_v2_products_read",
  ],
  pkce: true,
};

// HR Connectors (1)
export const BAMBOOHR_OAUTH: OAuthConfig = {
  provider: "bamboohr",
  flowType: "A",
  category: "hr",
  authType: "oauth2",
  endpoints: {
    authorize: "https://{subdomain}.bamboohr.com/authorize",
    token: "https://{subdomain}.bamboohr.com/token/oauth",
  },
  scopes: ["read:employees", "read:time_off", "read:benefits"],
  pkce: true,
};

// Design Connectors (1)
export const FIGMA_OAUTH: OAuthConfig = {
  provider: "figma",
  flowType: "B", // Context: files, comments, designs
  category: "design",
  authType: "oauth2",
  endpoints: {
    authorize: "https://www.figma.com/oauth",
    token: "https://www.figma.com/api/oauth/token",
  },
  scopes: ["file_read", "webhooks"],
  pkce: true,
  additionalParams: {
    response_type: "code",
    client_id: process.env.FIGMA_CLIENT_ID || "",
  },
};

// ============================================
// FLOW B - CONTEXT (13 connectors)
// PATH: OAuth → Loader → Pipeline → Spine + Knowledge
// ============================================

// Communication Connectors (7)
export const GMAIL_OAUTH: OAuthConfig = {
  provider: "gmail",
  flowType: "B",
  category: "communication",
  authType: "oauth2",
  endpoints: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
  },
  scopes: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.metadata",
  ],
  pkce: true,
};

export const OUTLOOK_OAUTH: OAuthConfig = {
  provider: "outlook",
  flowType: "B",
  category: "communication",
  authType: "oauth2",
  endpoints: {
    authorize: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  },
  scopes: ["https://graph.microsoft.com/Mail.Read", "https://graph.microsoft.com/User.Read"],
  pkce: true,
};

export const SLACK_OAUTH: OAuthConfig = {
  provider: "slack",
  flowType: "B",
  category: "communication",
  authType: "oauth2",
  endpoints: {
    authorize: "https://slack.com/oauth/v2/authorize",
    token: "https://slack.com/api/oauth.v2.access",
  },
  scopes: ["channels:history", "groups:history", "users:read", "team:read"],
  pkce: false,
};

export const TEAMS_OAUTH: OAuthConfig = {
  provider: "teams",
  flowType: "B",
  category: "communication",
  authType: "oauth2",
  endpoints: {
    authorize: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  },
  scopes: [
    "https://graph.microsoft.com/ChannelMessage.Read.All",
    "https://graph.microsoft.com/Team.ReadBasic.All",
  ],
  pkce: true,
};

export const DISCORD_OAUTH: OAuthConfig = {
  provider: "discord",
  flowType: "B",
  category: "communication",
  authType: "oauth2",
  endpoints: {
    authorize: "https://discord.com/oauth2/authorize",
    token: "https://discord.com/api/oauth2/token",
  },
  scopes: ["identify", "guilds", "guilds.members.read", "messages.read"],
  pkce: true,
};

export const ZOOM_OAUTH: OAuthConfig = {
  provider: "zoom",
  flowType: "B",
  category: "communication",
  authType: "oauth2",
  endpoints: {
    authorize: "https://zoom.us/oauth/authorize",
    token: "https://zoom.us/oauth/token",
  },
  scopes: ["user:read", "meeting:read", "recording:read"],
  pkce: true,
};

export const GOOGLE_CALENDAR_OAUTH: OAuthConfig = {
  provider: "google-calendar",
  flowType: "B",
  category: "communication",
  authType: "oauth2",
  endpoints: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
  },
  scopes: [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
  ],
  pkce: true,
};

// Productivity Connectors (6)
export const NOTION_OAUTH: OAuthConfig = {
  provider: "notion",
  flowType: "B",
  category: "productivity",
  authType: "oauth2",
  endpoints: {
    authorize: "https://api.notion.com/v1/oauth/authorize",
    token: "https://api.notion.com/v1/oauth/token",
  },
  scopes: ["read_content", "read_user"],
  pkce: true,
};

export const GOOGLE_DRIVE_OAUTH: OAuthConfig = {
  provider: "google-drive",
  flowType: "B",
  category: "productivity",
  authType: "oauth2",
  endpoints: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
  },
  scopes: [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ],
  pkce: true,
};

export const GOOGLE_SHEETS_OAUTH: OAuthConfig = {
  provider: "google-sheets",
  flowType: "B",
  category: "productivity",
  authType: "oauth2",
  endpoints: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
  pkce: true,
};

export const DROPBOX_OAUTH: OAuthConfig = {
  provider: "dropbox",
  flowType: "B",
  category: "productivity",
  authType: "oauth2",
  endpoints: {
    authorize: "https://www.dropbox.com/oauth2/authorize",
    token: "https://api.dropboxapi.com/oauth2/token",
  },
  scopes: ["account_info.read", "files.metadata.read", "files.content.read"],
  pkce: true,
};

export const ONEDRIVE_OAUTH: OAuthConfig = {
  provider: "onedrive",
  flowType: "B",
  category: "productivity",
  authType: "oauth2",
  endpoints: {
    authorize: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  },
  scopes: ["https://graph.microsoft.com/Files.Read", "https://graph.microsoft.com/User.Read"],
  pkce: true,
};

export const AIRTABLE_OAUTH: OAuthConfig = {
  provider: "airtable",
  flowType: "B",
  category: "productivity",
  authType: "oauth2",
  endpoints: {
    authorize: "https://airtable.com/oauth2/v1/authorize",
    token: "https://airtable.com/oauth2/v1/token",
  },
  scopes: ["data.records:read", "schema.bases:read", "user.email:read"],
  pkce: true,
};

export const CALENDLY_OAUTH: OAuthConfig = {
  provider: "calendly",
  flowType: "B",
  category: "productivity",
  authType: "oauth2",
  endpoints: {
    authorize: "https://auth.calendly.com/oauth/authorize",
    token: "https://auth.calendly.com/oauth/token",
  },
  scopes: ["default"],
  pkce: true,
};

// ============================================
// FLOW C - AI (4 external connectors)
// PATH: OAuth → D1 Buffer → Config Check → Triage → Knowledge UI → AI Chat
// Configuration: flow_c_config D1 table with rules for auto-approve/triage
// Storage: D1 buffer → Supabase Knowledge UI (NEVER writes to Spine)
// Access: AI Chat, MCP, OpenAI, Claude, Moonshot ALL read from Knowledge UI
// ============================================

export const MCP_OAUTH: OAuthConfig = {
  provider: "mcp",
  flowType: "C", // Flow C marker: D1 Buffer → Triage → Knowledge UI
  category: "ai",
  authType: "apikey",
  endpoints: {
    authorize: "", // Internal MCP service (no OAuth)
    token: "",
  },
  scopes: [],
};

export const OPENAI_OAUTH: OAuthConfig = {
  provider: "openai",
  flowType: "C", // Flow C marker: D1 Buffer → Triage → Knowledge UI
  category: "ai",
  authType: "apikey",
  endpoints: {
    authorize: "", // API key authentication
    token: "https://api.openai.com/v1/", // API endpoint
  },
  scopes: [],
};

export const CLAUDE_OAUTH: OAuthConfig = {
  provider: "claude",
  flowType: "C", // Flow C marker: D1 Buffer → Triage → Knowledge UI
  category: "ai",
  authType: "apikey",
  endpoints: {
    authorize: "", // API key authentication
    token: "https://api.anthropic.com/v1/", // API endpoint
  },
  scopes: [],
};

export const MOONSHOT_OAUTH: OAuthConfig = {
  provider: "moonshot",
  flowType: "C", // Flow C marker: D1 Buffer → Triage → Knowledge UI
  category: "ai",
  authType: "apikey",
  endpoints: {
    authorize: "", // API key authentication
    token: "https://api.moonshot.cn/v1/", // API endpoint
  },
  scopes: [],
};

// ============================================
// OAUTH REGISTRY
// ============================================

export const OAUTH_REGISTRY: Record<string, OAuthConfig> = {
  // Flow A - Structured (35 connectors)
  // CRM
  salesforce: SALESFORCE_OAUTH,
  hubspot: HUBSPOT_OAUTH,
  pipedrive: PIPEDRIVE_OAUTH,
  "zoho-crm": ZOHO_CRM_OAUTH,
  freshsales: FRESHSALES_OAUTH,
  close: CLOSE_OAUTH,

  // Support
  zendesk: ZENDESK_OAUTH,
  freshdesk: FRESHDESK_OAUTH,
  front: FRONT_OAUTH,
  helpscout: HELPSCOUT_OAUTH,
  intercom: INTERCOM_OAUTH,
  kustomer: KUSTOMER_OAUTH,
  "whatsapp-business": WHATSAPP_BUSINESS_OAUTH,
  crisp: CRISP_OAUTH,
  drift: DRIFT_OAUTH,

  // Billing
  stripe: STRIPE_OAUTH,
  chargebee: CHARGEBEE_OAUTH,
  paddle: PADDLE_OAUTH,
  quickbooks: QUICKBOOKS_OAUTH,
  xero: XERO_OAUTH,
  freshbooks: FRESHBOOKS_OAUTH,

  // Marketing
  "hubspot-marketing": HUBSPOT_MARKETING_OAUTH,
  mailchimp: MAILCHIMP_OAUTH,
  marketo: MARKETO_OAUTH,
  braze: BRAZE_OAUTH,
  segment: SEGMENT_OAUTH,
  sendgrid: SENDGRID_OAUTH,
  "customer-io": CUSTOMER_IO_OAUTH,
  klaviyo: KLAVIYO_OAUTH,

  // Analytics
  "google-analytics": GOOGLE_ANALYTICS_OAUTH,
  mixpanel: MIXPANEL_OAUTH,
  amplitude: AMPLITUDE_OAUTH,
  heap: HEAP_OAUTH,
  tableau: TABLEAU_OAUTH,
  metabase: METABASE_OAUTH,

  // Project
  jira: JIRA_OAUTH,
  asana: ASANA_OAUTH,
  linear: LINEAR_OAUTH,
  monday: MONDAY_OAUTH,
  clickup: CLICKUP_OAUTH,
  trello: TRELLO_OAUTH,

  // Engineering
  github: GITHUB_OAUTH,
  gitlab: GITLAB_OAUTH,
  bitbucket: BITBUCKET_OAUTH,

  // Commerce
  shopify: SHOPIFY_OAUTH,
  woocommerce: WOOCOMMERCE_OAUTH,
  bigcommerce: BIGCOMMERCE_OAUTH,

  // HR
  bamboohr: BAMBOOHR_OAUTH,

  // Flow B - Context (13 connectors)
  // Communication
  gmail: GMAIL_OAUTH,
  outlook: OUTLOOK_OAUTH,
  slack: SLACK_OAUTH,
  teams: TEAMS_OAUTH,
  discord: DISCORD_OAUTH,
  zoom: ZOOM_OAUTH,
  "google-calendar": GOOGLE_CALENDAR_OAUTH,

  // Productivity
  notion: NOTION_OAUTH,
  "google-drive": GOOGLE_DRIVE_OAUTH,
  "google-sheets": GOOGLE_SHEETS_OAUTH,
  dropbox: DROPBOX_OAUTH,
  onedrive: ONEDRIVE_OAUTH,
  airtable: AIRTABLE_OAUTH,
  calendly: CALENDLY_OAUTH,

  // Flow C - AI (4 external AI sources → feed Knowledge UI → AI Chat)
  mcp: MCP_OAUTH,
  openai: OPENAI_OAUTH,
  claude: CLAUDE_OAUTH,
  moonshot: MOONSHOT_OAUTH,

  // Flow B - Design (1 connector)
  figma: FIGMA_OAUTH,
};

// Helper functions
export function getOAuthConfig(provider: string): OAuthConfig | undefined {
  return OAUTH_REGISTRY[provider];
}

export function getAllOAuthConfigs(): OAuthConfig[] {
  return Object.values(OAUTH_REGISTRY);
}

export function getOAuthConfigsByFlow(flowType: "A" | "B" | "C"): OAuthConfig[] {
  return Object.values(OAUTH_REGISTRY).filter((config) => config.flowType === flowType);
}

export function getOAuthConfigsByCategory(category: string): OAuthConfig[] {
  return Object.values(OAUTH_REGISTRY).filter((config) => config.category === category);
}
