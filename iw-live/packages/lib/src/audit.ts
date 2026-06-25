/**
 * Audit Logging Module
 *
 * Migrated from Neon to Supabase
 * Uses Supabase client for all database operations
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

type AnySupabaseClient = SupabaseClient<any, any, any, any, any>;

export interface AuditEvent {
  actor_user_id?: string;
  org_id?: string;
  workspace_id?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  payload?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  correlation_id?: string;
}

export interface GovernanceAuditEvent {
  tenant_id: string;
  action_id?: string;
  policy_id?: string;
  user_id: string;
  decision: string;
  reason?: string;
  action_type?: string;
  metadata?: Record<string, any>;
  correlation_id?: string;
  event_type?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface BillingAuditEvent {
  org_id: string;
  event_type: string;
  actor_id?: string;
  metadata?: Record<string, any>;
  correlation_id?: string;
}

// Helper to create Supabase client (legacy). Returns null when no Supabase (D1 audit preferred: spine_audit_log / governance_audit_log).
function createDbClient(_dbUrl?: string): AnySupabaseClient | null {
  const url = _dbUrl || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    db: { schema: "hub" },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Log a general audit event to the audit_logs table (best-effort; D1 spine_audit_log is canonical for Spine events).
 */
export async function logAuditEvent(dbUrl: string | undefined, event: AuditEvent): Promise<void> {
  const supabase = createDbClient(dbUrl);
  if (!supabase) {
    // Desupabase: no-op or console (real audit goes via folder-watcher / pipeline to D1 spine_audit_log)
    if (process.env.NODE_ENV !== "production") {
      console.log("[audit] skipped (no Supabase):", event.action);
    }
    return;
  }

  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: event.actor_user_id || null,
    org_id: event.org_id || null,
    workspace_id: event.workspace_id || null,
    action: event.action,
    target_type: event.target_type || null,
    target_id: event.target_id || null,
    payload: event.payload || null,
    ip_address: event.ip_address || null,
    user_agent: event.user_agent || null,
    correlation_id: event.correlation_id || null,
  });

  if (error) {
    console.error("Failed to log audit event (legacy):", error);
    // do not throw in desupabase path
  }
}

/**
 * Log a governance decision to the governance_audit_log table
 */
export async function logGovernanceEvent(
  dbUrl: string | undefined,
  event: GovernanceAuditEvent
): Promise<void> {
  const supabase = createDbClient(dbUrl);
  if (!supabase) {
    // D1 governance_audit_log (govern service) or spine_audit_log is the target.
    return;
  }

  const { error } = await supabase.from("governance_audit_log").insert({
    tenant_id: event.tenant_id,
    action_id: event.action_id || null,
    policy_id: event.policy_id || null,
    user_id: event.user_id,
    decision: event.decision,
    reason: event.reason || null,
    action_type: event.action_type || null,
    metadata: event.metadata || null,
    correlation_id: event.correlation_id || null,
    event_type: event.event_type || null,
    ip_address: event.ip_address || null,
    user_agent: event.user_agent || null,
  });

  if (error) {
    console.error("Failed to log governance event (legacy):", error);
  }
}

/**
 * Log a billing event to the billing_audit_log table (billing slice last)
 */
export async function logBillingEvent(dbUrl: string | undefined, event: BillingAuditEvent): Promise<void> {
  const supabase = createDbClient(dbUrl);
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("billing_audit_log").insert({
    org_id: event.org_id,
    event_type: event.event_type,
    actor_id: event.actor_id || null,
    metadata: event.metadata || null,
    correlation_id: event.correlation_id || null,
  });

  if (error) {
    console.error("Failed to log billing event (legacy):", error);
  }
}

/**
 * Extract client information from request headers
 */
export function extractClientInfo(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  const ipAddress =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  const userAgent = request.headers.get("user-agent") || undefined;

  return {
    ipAddress: ipAddress !== "unknown" ? ipAddress : undefined,
    userAgent,
  };
}

/**
 * Generate correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Audit middleware for API routes
 */
export function createAuditMiddleware(dbUrl: string) {
  return async (request: Request, userId?: string, orgId?: string) => {
    const correlationId = generateCorrelationId();
    const clientInfo = extractClientInfo(request);

    // Log API access
    await logAuditEvent(dbUrl, {
      actor_user_id: userId,
      org_id: orgId,
      action: "API_ACCESS",
      target_type: "endpoint",
      target_id: request.url,
      payload: {
        method: request.method,
        path: new URL(request.url).pathname,
      },
      ip_address: clientInfo.ipAddress,
      user_agent: clientInfo.userAgent,
      correlation_id: correlationId,
    });

    return correlationId;
  };
}
