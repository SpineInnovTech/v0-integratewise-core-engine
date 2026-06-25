// Core Exports
export * from "./intelligent-manager";
export * from "./orchestrator";

// Accounting Connectors
export * from "./accounting/zoho-books";
export * from "./accounting/quickbooks";
export * from "./accounting/stripe";
export * from "./accounting/xero";
export * from "./accounting/freshbooks";
export * from "./accounting/chargebee";
export * from "./accounting/tally";
export * from "./accounting/vyapar-khatabook";

// CRM Connectors
export * from "./crm/salesforce";
export * from "./crm/hubspot";
export * from "./crm/zoho-crm";
export * from "./crm/pipedrive";
export * from "./crm/freshsales";
export * from "./crm/close";

// Support Connectors
export * from "./support/zendesk";
export * from "./support/freshworks";
export * from "./support/helpscout";
export * from "./support/front";
export * from "./support/freshdesk";
export * from "./support/kustomer";
export * from "./support/whatsapp-business";

// E-commerce Connectors
export * from "./ecommerce/shopify";
export * from "./ecommerce/woocommerce";
export * from "./ecommerce/bigcommerce";
export * from "./ecommerce/shiprocket";

// Communication Connectors
export * from "./communication/slack";
export * from "./communication/intercom";
export * from "./communication/gmail";
export * from "./communication/outlook";
export * from "./communication/discord";
export * from "./communication/microsoft-teams";
export * from "./communication/zoom";
export * from "./communication/twilio";

// Marketing Connectors
export * from "./marketing/mailchimp";
export * from "./marketing/segment";
export * from "./marketing/hubspot-marketing";
export * from "./marketing/sendgrid";
export * from "./marketing/braze";
export * from "./marketing/marketo";
export * from "./marketing/customer-io";

// Analytics Connectors
export * from "./analytics/google-analytics";
export * from "./analytics/mixpanel";
export * from "./analytics/tableau";
export * from "./analytics/heap";
export * from "./analytics/amplitude";
export * from "./analytics/metabase";

// Compliance Connectors
export * from "./compliance/indiafilings";
export * from "./compliance/gst-portal";

// Project Management / Engineering Connectors
export * from "./project-management/jira";
export * from "./project-management/linear";
export * from "./project-management/github";
export * from "./project-management/asana";
export * from "./project-management/gitlab";
export * from "./project-management/bitbucket";

// Productivity Connectors
export * from "./productivity/notion";
export * from "./productivity/google-drive";
export * from "./productivity/google-sheets";
export * from "./productivity/google-calendar";
export * from "./productivity/calendly";
export * from "./productivity/airtable";
export * from "./productivity/dropbox";
export * from "./productivity/onedrive";
export * from "./productivity/memory-repo";

// AI Connectors
export * from "./ai/openai";
export * from "./ai/anthropic";
export * from "./ai/cohere";

// Billing Connectors
export * from "./billing/paddle";

// Payments Connectors (Customer-facing)
export * from "./payments/razorpay";

// Domain Master Connector Pattern
export * from "./domain-master";

// Accelerators
export * from "./accelerators";

// Connector adapters (canonical catalog — full contract: testConnection, getMetadata, sync)
export * from "./placeholders";

// Sync adapters (universal sync for implemented connectors)
export * from "./sync-adapters";

// Catalog, registry, and types
export * from "./catalog-types";
export * from "./catalog";
export * from "./registry";
