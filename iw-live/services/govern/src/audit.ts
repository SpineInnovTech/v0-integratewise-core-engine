import type { Env } from "./types";
import type { AuditEntry, AuditFilters } from "./types";

// ============================================================================
// Audit Logging — D1 Edge-Local
//
// Fast edge writes to D1 audit_log. Canonical long-term storage remains
// in Supabase governance_audit_log (synced separately via pipeline).
// ============================================================================

/**
 * Sign data using a secret key (HMAC SHA-256)
 */
async function signData(data: any, secret: string): Promise<string> {
  const msg = JSON.stringify(data);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataToSign = encoder.encode(msg);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, dataToSign);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Log a governance decision to the D1 audit log
 *
 * Best Practice: Includes correlation_id for full request tracing
 * Trust Layer: Digitally signs every entry for tamper-proofing
 */
export async function logDecision(
  env: Env,
  entry: Omit<AuditEntry, "id" | "created_at" | "signature"> & { correlation_id?: string },
  signatureKey: string
): Promise<AuditEntry> {
  const db = env.D1;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // 1. Generate Signature for the trust layer
  const signature = await signData(
    {
      tenant_id: entry.tenant_id,
      user_id: entry.user_id,
      decision: entry.decision,
      correlation_id: entry.correlation_id,
      action_type: entry.action_type,
    },
    signatureKey
  );

  // 2. Insert into D1 governance_audit_log
  await db
    .prepare(
      `INSERT INTO governance_audit_log (
        id, tenant_id, action_id, policy_id, user_id,
        decision, reason, action_type, metadata,
        correlation_id, signature, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      entry.tenant_id,
      entry.action_id || null,
      entry.policy_id || null,
      entry.user_id,
      entry.decision,
      entry.reason || null,
      entry.action_type || null,
      entry.metadata ? JSON.stringify(entry.metadata) : "{}",
      entry.correlation_id || null,
      signature,
      createdAt
    )
    .run();

  return {
    id,
    tenant_id: entry.tenant_id,
    action_id: entry.action_id,
    policy_id: entry.policy_id,
    user_id: entry.user_id,
    decision: entry.decision,
    reason: entry.reason,
    action_type: entry.action_type,
    metadata: entry.metadata,
    correlation_id: entry.correlation_id,
    signature,
    created_at: createdAt,
  } as AuditEntry;
}

/**
 * Get audit log entries with filtering
 */
export async function getAuditLog(
  env: Env,
  tenant_id: string,
  filters: AuditFilters = { limit: 100, offset: 0 }
): Promise<AuditEntry[]> {
  const db = env.D1;
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  // Build dynamic WHERE clause
  const conditions: string[] = ["tenant_id = ?"];
  const params: (string | number)[] = [tenant_id];

  if (filters.action_id) {
    conditions.push("action_id = ?");
    params.push(filters.action_id);
  }
  if (filters.policy_id) {
    conditions.push("policy_id = ?");
    params.push(filters.policy_id);
  }
  if (filters.user_id) {
    conditions.push("user_id = ?");
    params.push(filters.user_id);
  }
  if (filters.decision) {
    conditions.push("decision = ?");
    params.push(filters.decision);
  }
  if (filters.action_type) {
    conditions.push("action_type LIKE ?");
    params.push(filters.action_type + "%");
  }
  if (filters.from_date) {
    conditions.push("created_at >= ?");
    params.push(filters.from_date);
  }
  if (filters.to_date) {
    conditions.push("created_at <= ?");
    params.push(filters.to_date);
  }

  const whereClause = conditions.join(" AND ");
  const sql = `SELECT id, tenant_id, action_id, policy_id, user_id,
    decision, reason, action_type, metadata, created_at, correlation_id, signature
    FROM governance_audit_log
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`;

  params.push(limit, offset);

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all();
  return (result.results || []).map((row: any) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  })) as AuditEntry[];
}

/**
 * Get audit summary statistics for a tenant
 */
export async function getAuditSummary(
  env: Env,
  tenant_id: string,
  days: number = 30
): Promise<{
  total: number;
  by_decision: Record<string, number>;
  by_action_type: Record<string, number>;
}> {
  const db = env.D1;

  // Calculate cutoff date in Worker (avoid SQLite date math differences)
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const totalResult = await db
    .prepare(
      "SELECT COUNT(*) as count FROM governance_audit_log WHERE tenant_id = ? AND created_at >= ?"
    )
    .bind(tenant_id, cutoff)
    .first<{ count: number }>();

  const byDecisionResult = await db
    .prepare(
      `SELECT decision, COUNT(*) as count
       FROM governance_audit_log
       WHERE tenant_id = ? AND created_at >= ?
       GROUP BY decision`
    )
    .bind(tenant_id, cutoff)
    .all();

  const byActionTypeResult = await db
    .prepare(
      `SELECT action_type, COUNT(*) as count
       FROM governance_audit_log
       WHERE tenant_id = ? AND created_at >= ? AND action_type IS NOT NULL
       GROUP BY action_type
       ORDER BY count DESC
       LIMIT 20`
    )
    .bind(tenant_id, cutoff)
    .all();

  const byDecision: Record<string, number> = {};
  for (const row of byDecisionResult.results || []) {
    byDecision[(row as any).decision] = Number((row as any).count);
  }

  const byActionType: Record<string, number> = {};
  for (const row of byActionTypeResult.results || []) {
    const actionType = (row as any).action_type;
    if (actionType) {
      byActionType[actionType] = Number((row as any).count);
    }
  }

  return {
    total: Number(totalResult?.count || 0),
    by_decision: byDecision,
    by_action_type: byActionType,
  };
}
