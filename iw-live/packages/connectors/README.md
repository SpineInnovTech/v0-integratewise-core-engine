# IntegrateWise Connectors & Accelerators

This package contains the core integration logic for IntegrateWise.

## Rule: never implement a stub

Every connector in the catalog must be a **full, real implementation**: real provider API calls, real `testConnection()` and `getMetadata()`, and real sync/entity logic where the loader uses it. Do not add stub or placeholder connector classes. Add a connector to the catalog only when it is completely implemented.

## Connection verification (auth)

All catalog connectors use **real auth verification** in `testConnection()`: they call the provider API with the configured token/key and return `true` only on success. No connector returns `true` without validating credentials.

| Connector        | Auth type     | testConnection() verification               |
| ---------------- | ------------- | ------------------------------------------- |
| Zoho Books       | OAuth         | `GET /organizations` with `Zoho-oauthtoken` |
| QuickBooks       | OAuth         | `GET /companyinfo/{realmId}` with Bearer    |
| Stripe           | API Key       | `GET /balance`                              |
| Salesforce       | OAuth         | `GET /sobjects`                             |
| HubSpot          | OAuth         | `GET /crm/v3/objects/contacts?limit=1`      |
| Zendesk          | OAuth         | `GET /users/me`                             |
| Freshworks       | OAuth/API     | `GET /users/me` or product-specific         |
| Shopify          | OAuth         | `GET /shop.json`                            |
| Slack            | OAuth         | `POST /auth.test`                           |
| Intercom         | OAuth         | `GET /me`                                   |
| Gmail            | OAuth         | `GET /profile`                              |
| Outlook          | OAuth         | `GET /me` (Graph)                           |
| Discord          | OAuth         | `GET /users/@me`                            |
| Mailchimp        | OAuth/API Key | `GET /ping`                                 |
| Segment          | API Key       | `POST /identify` (minimal payload)          |
| Google Analytics | OAuth         | `GET /accountSummaries` (Management API v3) |
| Mixpanel         | API Key       | `POST /track` (minimal event)               |
| IndiaFilings     | API Key       | `GET /health`                               |
| GST Portal       | API Key       | `GET /gstin/details`                        |
| Jira             | OAuth/Basic   | `GET /myself`                               |
| Linear           | OAuth         | GraphQL `viewer { id }`                     |
| GitHub           | OAuth         | `GET /user`                                 |
| Asana            | OAuth         | `GET /users/me`                             |
| Notion           | OAuth         | `GET /users/me`                             |
| Google Drive     | OAuth         | `GET /about?fields=user`                    |
| Google Calendar  | OAuth         | `GET /calendars/primary`                    |
| Calendly         | OAuth         | `GET /users/me`                             |
| OpenAI           | API Key       | `GET /models`                               |
| Anthropic        | API Key       | `POST /messages` (minimal)                  |

## Connectors

- **Accounting**: Zoho Books, QuickBooks
- **CRM**: Salesforce, HubSpot
- **Support**: Zendesk, Freshworks
- **Ecommerce**: Shopify
- **Compliance**: IndiaFilings, GST Portal
- **Communication**: Slack, Intercom
- **Marketing**: Mailchimp
- **Analytics**: Google Analytics 4

## Accelerators

- **India Accounting**: GST reports, compliance checks
- **Subscription Metrics**: MRR, Churn, LTV
- **Engineering**: Velocity, Quality
- **HR**: Workforce, Engagement
- **Finance**: Health, Burn Rate

## Usage

\`\`\`typescript
import { createZohoBooksConnector } from "@integratewise/connectors";

const connector = createZohoBooksConnector({
clientId: "...",
clientSecret: "...",
organizationId: "...",
region: "IN"
});

await connector.testConnection();
const invoices = await connector.getInvoices();
\`\`\`
