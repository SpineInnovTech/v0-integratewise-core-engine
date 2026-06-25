/**
 * Nango API Client
 *
 * Thin CF-Workers-compatible wrapper around the Nango REST API.
 * No npm SDK — avoids Node.js incompatibilities in the CF runtime.
 *
 * To enable REAL user connections:
 * 1. Create a Nango account at https://app.nango.dev (or self-hosted).
 * 2. For each app in NANGO_INTEGRATION_MAP (hubspot, jira, github, etc.):
 *    - In the SaaS provider (e.g. HubSpot Developer Portal), create an OAuth App.
 *    - In Nango dashboard → Integrations, create the integration using the client ID/secret from the SaaS app.
 *    - Set the redirect URI to the one Nango provides for that integration.
 * 3. In Cloudflare (connector worker secrets):
 *    - NANGO_SECRET_KEY = your Nango secret key (from Nango dashboard, env-specific).
 *    - NANGO_WEBHOOK_SECRET (optional but recommended for signature verification).
 *    - For nango dev: set NANGO_BASE_URL=http://localhost:3003 (and VITE_NANGO_HOST in web for the Connect UI)
 * 4. Set the webhook URL in Nango dashboard to your ingress: https://ingress.yourdomain.com/webhooks/nango
 *
 * Once configured, users going through ConnectorsStep will get real OAuth modals,
 * Nango will fire auth.created → loader webhook → D1 status + creamy hydration → Spine.
 *
 * Nango handles:
 *  - OAuth initiation + callback for 200+ providers
 *  - Token storage (encrypted at rest)
 *  - Automatic token refresh before expiry
 *  - Webhook notifications on connection events
 *
 * We call Nango to:
 *  1. Get a session token (before showing Connect UI to user)
 *  2. Get a valid access token (before calling any provider API)
 *  3. Delete a connection (when user disconnects)
 */

export interface NangoEnv {
  NANGO_SECRET_KEY: string;
  NANGO_BASE_URL?: string; // for nango dev: e.g. http://localhost:3003 ; defaults to prod
}

const getNangoBaseUrl = (env: NangoEnv): string => {
  return env.NANGO_BASE_URL || "https://api.nango.dev";
};

// ─── Connect Session ─────────────────────────────────────────────────────────

interface ConnectSessionParams {
  /** Nango integration ID — e.g. "slack", "jira", "notion" */
  integrationId: string;
  /** Our tenant ID — used as Nango's connectionId */
  connectionId: string;
  /** Optional: prefill metadata stored on the Nango connection */
  metadata?: Record<string, string>;
}

interface ConnectSessionResponse {
  token: string;
  expires_at: string;
}

/**
 * Create a short-lived Nango Connect session token.
 * Call this from the backend — return the token to the frontend.
 * Frontend uses it to open Nango Connect UI.
 */
export async function createConnectSession(
  env: NangoEnv,
  params: ConnectSessionParams
): Promise<ConnectSessionResponse> {
  const res = await fetch(`${getNangoBaseUrl(env)}/connect/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.NANGO_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      end_user: {
        id: params.connectionId,
      },
      allowed_integrations: [params.integrationId],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "unknown");
    throw new Error(`[Nango] createConnectSession failed ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { data: ConnectSessionResponse };
  return data.data;
}

// ─── Get Connection Token ─────────────────────────────────────────────────────

interface NangoConnection {
  id: string;
  provider_config_key: string;
  connection_id: string;
  credentials: {
    type: string;
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Get a valid (auto-refreshed) access token for a connection.
 * Nango refreshes the token if it's expired before returning.
 * This replaces getValidAccessToken() entirely.
 *
 * @param integrationId - Nango integration key (e.g. "slack")
 * @param connectionId  - Our tenant ID (used as Nango's connectionId)
 */
export async function getConnectionToken(
  env: NangoEnv,
  integrationId: string,
  connectionId: string
): Promise<string> {
  const res = await fetch(
    `${getNangoBaseUrl(env)}/connection/${connectionId}?provider_config_key=${integrationId}`,
    {
      headers: {
        Authorization: `Bearer ${env.NANGO_SECRET_KEY}`,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "unknown");
    throw new Error(
      `[Nango] getConnection failed ${res.status} for ${integrationId}/${connectionId}: ${body}`
    );
  }

  const data = (await res.json()) as NangoConnection;

  if (!data.credentials?.access_token) {
    throw new Error(`[Nango] No access_token in connection ${integrationId}/${connectionId}`);
  }

  return data.credentials.access_token;
}

// ─── Delete Connection ────────────────────────────────────────────────────────

/**
 * Delete a Nango connection — call when user disconnects a tool.
 */
export async function deleteNangoConnection(
  env: NangoEnv,
  integrationId: string,
  connectionId: string
): Promise<void> {
  const res = await fetch(
    `${getNangoBaseUrl(env)}/connection/${connectionId}?provider_config_key=${integrationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${env.NANGO_SECRET_KEY}`,
      },
    }
  );

  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => "unknown");
    console.error(
      `[Nango] deleteConnection failed ${res.status} for ${integrationId}/${connectionId}: ${body}`
    );
  }
}

// ─── Webhook Signature Verification ──────────────────────────────────────────

/**
 * Verify the HMAC-SHA256 signature Nango sends on every webhook.
 * Nango sends the signature in the `X-Nango-Signature` header.
 */
export async function verifyNangoWebhook(
  secret: string,
  rawBody: string,
  signature: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const computed = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computed === signature.replace("sha256=", "");
  } catch {
    return false;
  }
}

// ─── Nango Integration ID Map ─────────────────────────────────────────────────
// Maps our internal provider names → Nango integration IDs
// Add more as you enable them in the Nango dashboard

export const NANGO_INTEGRATION_MAP: Record<string, string> = {
  // CRM / Sales
  hubspot: "hubspot",
  salesforce: "salesforce",
  pipedrive: "pipedrive",
  "zoho-crm": "zoho-crm",
  copper: "copper",
  "close.com": "close",
  attio: "attio",

  // Project Management / Work
  jira: "jira",
  asana: "asana",
  linear: "linear",
  monday: "monday",
  clickup: "clickup",
  notion: "notion",
  trello: "trello",
  basecamp: "basecamp",

  // Communication
  slack: "slack",
  discord: "discord",
  teams: "microsoft-teams",
  zoom: "zoom",
  "google-meet": "google-meet",

  // Productivity / Docs
  gmail: "google-mail",
  outlook: "outlook",
  "google-calendar": "google-calendar",
  "google-drive": "google-drive",
  "one-drive": "one-drive",
  dropbox: "dropbox",
  box: "box",
  "microsoft-excel": "microsoft-excel",

  // Engineering / Dev
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  "github-issues": "github",

  // Support / Helpdesk
  zendesk: "zendesk",
  intercom: "intercom",
  freshdesk: "freshdesk",
  helpscout: "help-scout",
  front: "front",
  gorgias: "gorgias",

  // Finance / Billing / Accounting
  stripe: "stripe",
  quickbooks: "quickbooks",
  xero: "xero",
  netsuite: "netsuite",
  "sage-intacct": "sage-intacct",
  chargebee: "chargebee",

  // Marketing / Automation
  mailchimp: "mailchimp",
  klaviyo: "klaviyo",
  "hubspot-marketing": "hubspot",
  activecampaign: "activecampaign",
  marketo: "marketo",

  // Analytics / BI
  "google-analytics": "google-analytics",
  mixpanel: "mixpanel",
  segment: "segment",
  amplitude: "amplitude",

  // Design / Creative
  figma: "figma",
  "adobe-sign": "adobe-sign",

  // Storage / Docs / DBs
  airtable: "airtable",
  "google-sheets": "google-sheets",
  coda: "coda",

  // HR / Recruiting
  greenhouse: "greenhouse",
  lever: "lever",
  "bamboo-hr": "bamboohr",

  // Ecom / Payments
  shopify: "shopify",
  woocommerce: "woocommerce",

  // Other common
  typeform: "typeform",
  calendly: "calendly",
  webflow: "webflow",
};

/**
 * Resolve our internal provider name to a Nango integration ID.
 * Falls back to the provider name itself (works for most).
 */
export function toNangoIntegrationId(provider: string): string {
  return NANGO_INTEGRATION_MAP[provider] ?? provider;
}
