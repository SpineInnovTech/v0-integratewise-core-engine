import type { ConnectorCatalogEntry } from "./catalog-types";
import { QuickBooksConnector } from "./accounting/quickbooks";
import { StripeConnector } from "./accounting/stripe";
import { XeroConnector } from "./accounting/xero";
import { FreshbooksConnector } from "./accounting/freshbooks";
import { SalesforceConnector } from "./crm/salesforce";
import { HubSpotConnector } from "./crm/hubspot";
import { ZohoCRMConnector } from "./crm/zoho-crm";
import { ZendeskConnector } from "./support/zendesk";
import { HelpScoutConnector } from "./support/helpscout";
import { FrontConnector } from "./support/front";
import { FreshdeskConnector } from "./support/freshdesk";
import { KustomerConnector } from "./support/kustomer";
import { WhatsAppBusinessConnector } from "./support/whatsapp-business";
import { IntercomConnector } from "./communication/intercom";
import { ShopifyConnector } from "./ecommerce/shopify";
import { SlackConnector } from "./communication/slack";
import { GmailConnector } from "./communication/gmail";
import { OutlookConnector } from "./communication/outlook";
import { DiscordConnector } from "./communication/discord";
import { MailchimpConnector } from "./marketing/mailchimp";
import { HubSpotMarketingConnector } from "./marketing/hubspot-marketing";
import { SendGridConnector } from "./marketing/sendgrid";
import { BrazeConnector } from "./marketing/braze";
import { MarketoConnector } from "./marketing/marketo";
import { CustomerIOConnector } from "./marketing/customer-io";
import { GoogleAnalyticsConnector } from "./analytics/google-analytics";
import { MixpanelConnector } from "./analytics/mixpanel";
import { TableauConnector } from "./analytics/tableau";
import { JiraConnector } from "./project-management/jira";
import { LinearConnector } from "./project-management/linear";
import { GitHubConnector } from "./project-management/github";
import { PipedriveConnector } from "./crm/pipedrive";
import { FreshsalesConnector } from "./crm/freshsales";
import { CloseConnector } from "./crm/close";
import { NotionConnector } from "./productivity/notion";
import { GoogleDriveConnector } from "./productivity/google-drive";
import { GoogleSheetsConnector } from "./productivity/google-sheets";
import { OneDriveConnector } from "./productivity/onedrive";
import { OpenAIConnector } from "./ai/openai";
import { CohereConnector } from "./ai/cohere";
import { MetabaseConnector } from "./analytics/metabase";
import { PaddleConnector } from "./billing/paddle";
import { RazorpayConnector } from "./payments/razorpay";
import { WooCommerceConnector } from "./ecommerce/woocommerce";
import { BigCommerceConnector } from "./ecommerce/bigcommerce";
import { ShiprocketConnector } from "./ecommerce/shiprocket";
import { MicrosoftTeamsConnector } from "./communication/microsoft-teams";
import { ZoomConnector } from "./communication/zoom";
import { TwilioConnector } from "./communication/twilio";
import { AirtableConnector } from "./productivity/airtable";
import { DropboxConnector } from "./productivity/dropbox";
import { AmplitudeConnector } from "./analytics/amplitude";
import { HeapConnector } from "./analytics/heap";
import { GitLabConnector } from "./project-management/gitlab";
import { BitbucketConnector } from "./project-management/bitbucket";
import { ChargebeeConnector } from "./accounting/chargebee";
import { TallyConnector } from "./accounting/tally";
import { VyaparConnector, KhatabookConnector } from "./accounting/vyapar-khatabook";
import { GoogleCalendarConnector } from "./productivity/google-calendar";
import { CalendlyConnector } from "./productivity/calendly";
import { SegmentConnector } from "./marketing/segment";

/** Canonical 50+ connector catalog — plan-aligned and safe for incremental growth. */
export const CONNECTOR_CATALOG: ConnectorCatalogEntry[] = [
  // CRM (6)
  {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    domain: "crm",
    authType: "oauth",
    class: SalesforceConnector,
    departments: ["Sales", "RevOps", "Customer Success"],
    industries: ["SaaS / Technology", "Professional Services", "Financial Services"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    domain: "crm",
    authType: "oauth",
    class: HubSpotConnector,
    departments: ["Sales", "Marketing", "RevOps", "Customer Success"],
    industries: ["SaaS / Technology", "Professional Services", "Retail / Commerce"],
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    category: "crm",
    domain: "crm",
    authType: "oauth",
    class: PipedriveConnector,
    departments: ["Sales"],
    industries: ["SaaS / Technology", "Professional Services"],
  },
  {
    id: "zoho-crm",
    name: "Zoho CRM",
    category: "crm",
    domain: "crm",
    authType: "oauth",
    class: ZohoCRMConnector,
    departments: ["Sales", "Customer Success"],
    industries: ["SaaS / Technology", "Retail / Commerce"],
  },
  {
    id: "freshsales",
    name: "Freshsales",
    category: "crm",
    domain: "crm",
    authType: "api_key",
    class: FreshsalesConnector,
    departments: ["Sales"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "close",
    name: "Close",
    category: "crm",
    domain: "crm",
    authType: "api_key",
    class: CloseConnector,
    departments: ["Sales"],
    industries: ["SaaS / Technology"],
  },

  // Support (6)
  {
    id: "zendesk",
    name: "Zendesk",
    category: "support",
    domain: "support",
    authType: "oauth",
    class: ZendeskConnector,
    departments: ["Support", "Customer Success"],
    industries: ["SaaS / Technology", "Retail / Commerce", "Media"],
  },
  {
    id: "intercom",
    name: "Intercom",
    category: "support",
    domain: "support",
    authType: "oauth",
    class: IntercomConnector,
    departments: ["Support", "Customer Success"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "helpscout",
    name: "Help Scout",
    category: "support",
    domain: "support",
    authType: "oauth",
    class: HelpScoutConnector,
    departments: ["Support", "Customer Success"],
    industries: ["SaaS / Technology", "Professional Services"],
  },
  {
    id: "front",
    name: "Front",
    category: "support",
    domain: "support",
    authType: "oauth",
    class: FrontConnector,
    departments: ["Support"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "freshdesk",
    name: "Freshdesk",
    category: "support",
    domain: "support",
    authType: "api_key",
    class: FreshdeskConnector,
    departments: ["Support"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "kustomer",
    name: "Kustomer",
    category: "support",
    domain: "support",
    authType: "oauth",
    class: KustomerConnector,
    departments: ["Support", "Customer Success"],
    industries: ["SaaS / Technology", "Retail / Commerce"],
  },

  // Communication (6)
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    domain: "communication",
    authType: "oauth",
    class: SlackConnector,
    departments: ["Engineering", "Product", "Support", "Sales"],
    industries: ["SaaS / Technology", "Media"],
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    category: "communication",
    domain: "communication",
    authType: "oauth",
    class: MicrosoftTeamsConnector,
    departments: ["Engineering", "Support"],
    industries: ["SaaS / Technology", "Professional Services", "Public Sector"],
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "communication",
    domain: "communication",
    authType: "oauth",
    class: ZoomConnector,
    departments: ["Sales", "Support", "Engineering"],
    industries: ["SaaS / Technology", "Education"],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "communication",
    domain: "communication",
    authType: "api_key",
    class: TwilioConnector,
    departments: ["Engineering", "Support"],
    industries: ["SaaS / Technology", "Financial Services"],
  },
  {
    id: "discord",
    name: "Discord",
    category: "communication",
    domain: "communication",
    authType: "oauth",
    class: DiscordConnector,
    departments: ["Engineering", "Product"],
    industries: ["SaaS / Technology", "Media"],
  },
  {
    id: "whatsapp-business",
    name: "WhatsApp Business",
    category: "communication",
    domain: "communication",
    authType: "api_key",
    class: WhatsAppBusinessConnector,
    departments: ["Support", "Marketing", "Sales"],
    industries: ["Retail / Commerce", "Logistics"],
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "communication",
    domain: "communication",
    authType: "oauth",
    class: GmailConnector,
    departments: ["Customer Success", "Support", "Sales", "RevOps"],
    industries: ["SaaS / Technology", "Professional Services", "Financial Services"],
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    category: "communication",
    domain: "communication",
    authType: "oauth",
    class: OutlookConnector,
    departments: ["Customer Success", "Support", "Sales", "RevOps"],
    industries: [
      "SaaS / Technology",
      "Professional Services",
      "Financial Services",
      "Public Sector",
    ],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "communication",
    domain: "communication",
    authType: "oauth",
    class: GoogleCalendarConnector,
    departments: ["Sales", "Customer Success", "RevOps"],
    industries: ["SaaS / Technology", "Professional Services"],
  },

  // Marketing (6)
  {
    id: "hubspot-marketing",
    name: "HubSpot Marketing",
    category: "marketing",
    domain: "marketing",
    authType: "oauth",
    class: HubSpotMarketingConnector,
    departments: ["Marketing"],
    industries: ["SaaS / Technology", "Retail / Commerce"],
  },
  {
    id: "braze",
    name: "Braze",
    category: "marketing",
    domain: "marketing",
    authType: "api_key",
    class: BrazeConnector,
    departments: ["Marketing"],
    industries: ["SaaS / Technology", "Retail / Commerce", "Media"],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    category: "marketing",
    domain: "marketing",
    authType: "api_key",
    class: SendGridConnector,
    departments: ["Marketing", "Engineering"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "marketing",
    domain: "marketing",
    authType: "oauth",
    class: MailchimpConnector,
    departments: ["Marketing"],
    industries: ["SaaS / Technology", "Retail / Commerce", "Media"],
  },
  {
    id: "marketo",
    name: "Marketo",
    category: "marketing",
    domain: "marketing",
    authType: "oauth",
    class: MarketoConnector,
    departments: ["Marketing"],
    industries: ["SaaS / Technology", "Financial Services"],
  },
  {
    id: "customer-io",
    name: "Customer.io",
    category: "marketing",
    domain: "marketing",
    authType: "api_key",
    class: CustomerIOConnector,
    departments: ["Marketing"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "segment",
    name: "Segment",
    category: "marketing",
    domain: "marketing",
    authType: "api_key",
    class: SegmentConnector,
    departments: ["Marketing", "Engineering", "Product"],
    industries: ["SaaS / Technology"],
  },

  // Finance (6)
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "accounting",
    domain: "finance",
    authType: "oauth",
    class: QuickBooksConnector,
    departments: ["Finance", "RevOps"],
    industries: [
      "SaaS / Technology",
      "Professional Services",
      "Retail / Commerce",
      "Financial Services",
    ],
  },
  {
    id: "xero",
    name: "Xero",
    category: "accounting",
    domain: "finance",
    authType: "oauth",
    class: XeroConnector,
    departments: ["Finance"],
    industries: ["Professional Services", "Retail / Commerce"],
  },
  {
    id: "freshbooks",
    name: "Freshbooks",
    category: "accounting",
    domain: "finance",
    authType: "oauth",
    class: FreshbooksConnector,
    departments: ["Finance"],
    industries: ["Professional Services"],
  },
  {
    id: "chargebee",
    name: "Chargebee",
    category: "billing",
    domain: "finance",
    authType: "api_key",
    class: ChargebeeConnector,
    departments: ["Finance", "RevOps"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    domain: "finance",
    authType: "oauth",
    class: StripeConnector,
    departments: ["Finance", "RevOps"],
    industries: ["SaaS / Technology", "Retail / Commerce", "Financial Services"],
  },
  {
    id: "paddle",
    name: "Paddle",
    category: "payments",
    domain: "finance",
    authType: "api_key",
    class: PaddleConnector,
    departments: ["Finance"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "tally",
    name: "Tally ERP / Tally Prime",
    category: "accounting",
    domain: "finance",
    authType: "api_key",
    class: TallyConnector,
    departments: ["Finance", "RevOps"],
    industries: ["Retail / Commerce", "Professional Services", "Manufacturing"],
  },
  {
    id: "razorpay",
    name: "Razorpay",
    category: "payments",
    domain: "finance",
    authType: "api_key",
    class: RazorpayConnector,
    departments: ["Finance", "RevOps", "Sales"],
    industries: ["SaaS / Technology", "Retail / Commerce", "Financial Services"],
  },
  {
    id: "vyapar",
    name: "Vyapar",
    category: "accounting",
    domain: "finance",
    authType: "oauth",
    class: VyaparConnector,
    departments: ["Finance"],
    industries: ["Retail / Commerce", "Professional Services"],
  },
  {
    id: "khatabook",
    name: "Khatabook",
    category: "accounting",
    domain: "finance",
    authType: "api_key",
    class: KhatabookConnector,
    departments: ["Finance"],
    industries: ["Retail / Commerce"],
  },

  // Analytics (6)
  {
    id: "google-analytics",
    name: "Google Analytics 4",
    category: "analytics",
    domain: "analytics",
    authType: "oauth",
    class: GoogleAnalyticsConnector,
    departments: ["Marketing", "Product", "RevOps"],
    industries: ["SaaS / Technology", "Retail / Commerce", "Media"],
  },
  {
    id: "amplitude",
    name: "Amplitude",
    category: "analytics",
    domain: "analytics",
    authType: "api_key",
    class: AmplitudeConnector,
    departments: ["Product", "RevOps"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "heap",
    name: "Heap",
    category: "analytics",
    domain: "analytics",
    authType: "api_key",
    class: HeapConnector,
    departments: ["Product", "Marketing"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    category: "analytics",
    domain: "analytics",
    authType: "api_key",
    class: MixpanelConnector,
    departments: ["Product", "RevOps"],
    industries: ["SaaS / Technology", "Media"],
  },
  {
    id: "metabase",
    name: "Metabase",
    category: "analytics",
    domain: "analytics",
    authType: "api_key",
    class: MetabaseConnector,
    departments: ["Product", "RevOps", "Finance"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "tableau",
    name: "Tableau",
    category: "analytics",
    domain: "analytics",
    authType: "oauth",
    class: TableauConnector,
    departments: ["Customer Success", "RevOps", "Finance"],
    industries: ["SaaS / Technology", "Professional Services", "Financial Services"],
  },

  // Engineering (5)
  {
    id: "github",
    name: "GitHub",
    category: "source_control",
    domain: "engineering",
    authType: "oauth",
    class: GitHubConnector,
    departments: ["Engineering", "Product"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "gitlab",
    name: "GitLab",
    category: "source_control",
    domain: "engineering",
    authType: "oauth",
    class: GitLabConnector,
    departments: ["Engineering"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "bitbucket",
    name: "Bitbucket",
    category: "source_control",
    domain: "engineering",
    authType: "oauth",
    class: BitbucketConnector,
    departments: ["Engineering"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "jira",
    name: "Jira",
    category: "project_management",
    domain: "engineering",
    authType: "oauth",
    class: JiraConnector,
    departments: ["Engineering", "Product"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "linear",
    name: "Linear",
    category: "project_management",
    domain: "engineering",
    authType: "oauth",
    class: LinearConnector,
    departments: ["Engineering", "Product"],
    industries: ["SaaS / Technology"],
  },

  // Productivity (5)
  {
    id: "notion",
    name: "Notion",
    category: "docs",
    domain: "productivity",
    authType: "oauth",
    class: NotionConnector,
    departments: ["Product", "Engineering"],
    industries: ["SaaS / Technology", "Professional Services"],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "storage",
    domain: "productivity",
    authType: "oauth",
    class: GoogleDriveConnector,
    departments: ["Engineering", "Product", "Finance"],
    industries: ["SaaS / Technology", "Education"],
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    category: "spreadsheet",
    domain: "productivity",
    authType: "oauth",
    class: GoogleSheetsConnector,
    departments: ["Finance", "RevOps", "Sales", "Customer Success"],
    industries: ["SaaS / Technology", "Retail / Commerce", "Professional Services"],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "storage",
    domain: "productivity",
    authType: "oauth",
    class: DropboxConnector,
    departments: ["Engineering", "Product"],
    industries: ["SaaS / Technology", "Professional Services"],
  },
  {
    id: "onedrive",
    name: "Microsoft OneDrive",
    category: "storage",
    domain: "productivity",
    authType: "oauth",
    class: OneDriveConnector,
    departments: ["Engineering", "Product"],
    industries: ["SaaS / Technology", "Public Sector"],
  },
  {
    id: "airtable",
    name: "Airtable",
    category: "productivity",
    domain: "productivity",
    authType: "oauth",
    class: AirtableConnector,
    departments: ["Product", "Marketing"],
    industries: ["SaaS / Technology"],
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "productivity",
    domain: "productivity",
    authType: "oauth",
    class: CalendlyConnector,
    departments: ["Sales", "Customer Success", "RevOps"],
    industries: ["SaaS / Technology", "Professional Services"],
  },

  // Commerce (3)
  {
    id: "shopify",
    name: "Shopify",
    category: "ecommerce",
    domain: "commerce",
    authType: "oauth",
    class: ShopifyConnector,
    departments: ["Finance", "RevOps"],
    industries: ["Retail / Commerce"],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "ecommerce",
    domain: "commerce",
    authType: "api_key",
    class: WooCommerceConnector,
    departments: ["Finance"],
    industries: ["Retail / Commerce"],
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    category: "ecommerce",
    domain: "commerce",
    authType: "oauth",
    class: BigCommerceConnector,
    departments: ["Finance"],
    industries: ["Retail / Commerce"],
  },
  {
    id: "shiprocket",
    name: "Shiprocket",
    category: "logistics",
    domain: "commerce",
    authType: "api_key",
    class: ShiprocketConnector,
    departments: ["Finance", "RevOps"],
    industries: ["Retail / Commerce", "Logistics"],
  },

  // AI (2)
  {
    id: "openai",
    name: "OpenAI",
    category: "llm",
    domain: "ai",
    authType: "api_key",
    class: OpenAIConnector,
    departments: ["Product", "Engineering"],
    industries: ["SaaS / Technology", "Media"],
  },
  {
    id: "cohere",
    name: "Cohere",
    category: "llm",
    domain: "ai",
    authType: "api_key",
    class: CohereConnector,
    departments: ["Product", "Engineering"],
    industries: ["SaaS / Technology"],
  },
];

/** Serializable catalog for API responses (no class reference). */
export function getSerializableCatalog(): Array<{
  id: string;
  name: string;
  domain: string;
  category: string;
  authType: string;
  departments?: string[];
  industries?: string[];
}> {
  return CONNECTOR_CATALOG.map((c) => ({
    id: c.id,
    name: c.name,
    domain: c.domain,
    category: c.category,
    authType: c.authType,
    ...(c.departments?.length ? { departments: c.departments } : {}),
    ...(c.industries?.length ? { industries: c.industries } : {}),
  }));
}
