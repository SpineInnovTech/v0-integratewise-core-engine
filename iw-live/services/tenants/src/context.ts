/**
 * Tenant Context Resolver
 *
 * Resolves tenant context from request headers, subdomain, or JWT claims.
 * Reads from D1 (integratewise-spine-cache) — no Neon, no Supabase auth.
 */

import type { TenantContext, PlanLimits, Plan } from "./types";

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  CONNECTOR_SYNC?: Fetcher;
  // Legacy Supabase (connectors token store migrated to D1 in connector service + tenants/migrations/0006)
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  // OAuth client credentials per provider
  HUBSPOT_CLIENT_ID: string;
  HUBSPOT_CLIENT_SECRET: string;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SALESFORCE_CLIENT_ID: string;
  SALESFORCE_CLIENT_SECRET: string;
  ASANA_CLIENT_ID: string;
  ASANA_CLIENT_SECRET: string;
  LINEAR_CLIENT_ID: string;
  LINEAR_CLIENT_SECRET: string;
  TABLEAU_CLIENT_ID?: string;
  TABLEAU_CLIENT_SECRET?: string;
  OUTLOOK_CLIENT_ID?: string;
  OUTLOOK_CLIENT_SECRET?: string;
  ZENDESK_CLIENT_ID?: string;
  ZENDESK_CLIENT_SECRET?: string;
  INTERCOM_CLIENT_ID?: string;
  INTERCOM_CLIENT_SECRET?: string;
  JIRA_CLIENT_ID?: string;
  JIRA_CLIENT_SECRET?: string;
  STRIPE_CLIENT_ID?: string;
  STRIPE_CLIENT_SECRET?: string;
  TOKEN_ENCRYPTION_KEY?: string;
  OAUTH_STATE_KV?: KVNamespace;
  /** Shared connector KV (installation-id→tenant bindings, status, etc.) */
  CONNECTOR_STATUS?: KVNamespace;
}

/**
 * Extract tenant ID from request
 * Priority: 1. x-tenant-id header, 2. Subdomain, 3. JWT claim
 */
export function extractTenantId(request: Request): string | null {
  // 1. Check header
  const headerTenantId = request.headers.get("x-tenant-id");
  if (headerTenantId) {
    return headerTenantId;
  }

  // 2. Check subdomain (tenant.integratewise.ai)
  const url = new URL(request.url);
  const hostname = url.hostname;
  const subdomainMatch = hostname.match(/^([^.]+)\.integratewise\.ai$/);
  if (subdomainMatch) {
    return subdomainMatch[1]; // This would need to be resolved to tenant ID via lookup
  }

  return null;
}

/**
 * Get plan limits for a given plan
 */
export function getPlanLimits(plan: Plan): PlanLimits {
  const limits: Record<Plan, PlanLimits> = {
    personal: {
      users: 1,
      connectors: 3,
      aiSessions: 1000,
      storageGb: 5,
      retentionDays: 7,
    },
    team: {
      users: 25,
      connectors: 15,
      aiSessions: 10000,
      storageGb: 50,
      retentionDays: 30,
    },
    org: {
      users: 250,
      connectors: Infinity,
      aiSessions: 50000,
      storageGb: 500,
      retentionDays: 90,
    },
    enterprise: {
      users: Infinity,
      connectors: Infinity,
      aiSessions: Infinity,
      storageGb: Infinity,
      retentionDays: 2555, // 7 years
    },
  };

  return limits[plan] || limits.personal;
}

/**
 * Resolve tenant context from request — reads D1
 */
export async function resolveTenantContext(request: Request, env: Env): Promise<TenantContext> {
  const tenantId = extractTenantId(request);

  if (!tenantId) {
    throw new Error("Tenant ID not found in request");
  }

  const tenant = await env.DB.prepare(`SELECT id, plan, status, settings FROM tenants WHERE id = ?`)
    .bind(tenantId)
    .first<{ id: string; plan: string; status: string; settings: string }>();

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const plan = (tenant.plan || "personal") as Plan;
  const limits = getPlanLimits(plan);
  const settings = tenant.settings ? JSON.parse(tenant.settings) : {};

  // Get default workspace ID (or from header)
  const workspaceId = request.headers.get("x-workspace-id") || "default";

  // Get enabled features from settings
  const features: string[] = settings?.features || [];

  return {
    tenantId: tenant.id,
    workspaceId,
    plan,
    limits,
    features,
    settings,
  };
}

/**
 * Get tenant by slug (for subdomain resolution) — reads D1
 */
export async function getTenantBySlug(slug: string, env: Env): Promise<string | null> {
  const row = await env.DB.prepare(`SELECT id FROM tenants WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>();

  return row?.id ?? null;
}
