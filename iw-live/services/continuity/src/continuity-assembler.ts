/**
 * Continuity Assembler (spine-hydration-lifecycle Phase 6).
 *
 * Promoted Memory (org_memory / personal_memory, written by the Memory Promotion
 * Engine in pipeline) is assembled into the Continuity scopes the Twin operates
 * from: org / team / role / personal. Cloudflare D1 only (spine-cache).
 *
 * Scope governance (R7.2 / R11.3): only APPROVED memory is surfaced for the
 * org/team/role scopes — staging memory is withheld until governed. Personal
 * scope is restricted to the requesting user. Tenant-isolated throughout.
 */

export type ContinuityScope = "org" | "team" | "role" | "personal";

export interface ContinuityQuery {
  tenantId: string;
  userId?: string;
  role?: string; // department/role used to filter role-scoped memory
  scopes?: ContinuityScope[];
  limit?: number;
}

export interface ContinuityMemory {
  id: string;
  topic: string;
  category: string;
  content: string;
  confidence: number | null;
  updatedAt: string;
  lineageRef: string | null;
}

export interface ContinuityBundle {
  tenantId: string;
  role: string | null;
  scopes: Record<ContinuityScope, ContinuityMemory[]>;
  counts: Record<ContinuityScope, number>;
  totalMemories: number;
  generatedAt: string;
  /** Resolved Twin identity context from tenant_spine_config.twin_context. */
  twinContext?: Record<string, unknown>;
  /** Per-identity Twin activation thresholds (from twin_context). */
  activationThresholds?: { minMemories: number; minSignals: number; requireCreamy: boolean };
}

const DEFAULT_SCOPES: ContinuityScope[] = ["org", "team", "role", "personal"];

function safeParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapOrgRow(r: Record<string, unknown>): ContinuityMemory {
  return {
    id: String(r.id),
    topic: String(r.topic ?? ""),
    category: String(r.category ?? ""),
    content: String(r.content ?? ""),
    confidence: r.confidence === null || r.confidence === undefined ? null : Number(r.confidence),
    updatedAt: String(r.updated_at ?? r.created_at ?? ""),
    lineageRef: r.lineage_ref ? String(r.lineage_ref) : null,
  };
}

/**
 * Assemble Continuity for a tenant/user/role from D1. Reads only governed
 * (approved) org/team/role memory + the user's personal memory.
 */
export async function assembleContinuity(
  db: D1Database,
  q: ContinuityQuery
): Promise<ContinuityBundle> {
  const scopes = q.scopes && q.scopes.length ? q.scopes : DEFAULT_SCOPES;
  const limit = Math.min(q.limit ?? 50, 200);

  // Resolve Twin identity context from the schema (single D1 source). When the
  // caller doesn't pass a role, fall back to the tenant's department so the
  // role scope still populates (closes the Twin role-scope gap).
  let twinContext: Record<string, unknown> | undefined;
  let activationThresholds: ContinuityBundle["activationThresholds"];
  try {
    const cfg = await db
      .prepare(`SELECT twin_context FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`)
      .bind(q.tenantId)
      .first<{ twin_context: string | null }>();
    twinContext = safeParse<Record<string, unknown>>(cfg?.twin_context ?? null, {});
    const at = (twinContext.activationThresholds || twinContext.activation_thresholds) as
      | ContinuityBundle["activationThresholds"]
      | undefined;
    if (at) activationThresholds = at;
  } catch {
    twinContext = {};
  }

  const role =
    (q.role ? q.role.toUpperCase() : undefined) ||
    (typeof twinContext?.department === "string"
      ? (twinContext.department as string).toUpperCase()
      : null);

  const result: Record<ContinuityScope, ContinuityMemory[]> = {
    org: [],
    team: [],
    role: [],
    personal: [],
  };

  if (scopes.includes("org")) {
    const rows = await db
      .prepare(
        `SELECT id, topic, category, content, confidence, updated_at, created_at, lineage_ref
           FROM org_memory
          WHERE tenant_id = ? AND governance_state = 'approved'
            AND (access_scope = 'org' OR access_scope IS NULL)
          ORDER BY confidence DESC, updated_at DESC
          LIMIT ?`
      )
      .bind(q.tenantId, limit)
      .all<Record<string, unknown>>();
    result.org = (rows.results || []).map(mapOrgRow);
  }

  if (scopes.includes("team")) {
    const rows = await db
      .prepare(
        `SELECT id, topic, category, content, confidence, updated_at, created_at, lineage_ref
           FROM org_memory
          WHERE tenant_id = ? AND governance_state = 'approved' AND access_scope = 'team'
          ORDER BY confidence DESC, updated_at DESC
          LIMIT ?`
      )
      .bind(q.tenantId, limit)
      .all<Record<string, unknown>>();
    result.team = (rows.results || []).map(mapOrgRow);
  }

  if (scopes.includes("role") && role) {
    // related_departments is a JSON array string; match the role token within it.
    const rows = await db
      .prepare(
        `SELECT id, topic, category, content, confidence, updated_at, created_at, lineage_ref
           FROM org_memory
          WHERE tenant_id = ? AND governance_state = 'approved'
            AND related_departments LIKE ?
          ORDER BY confidence DESC, updated_at DESC
          LIMIT ?`
      )
      .bind(q.tenantId, `%"${role}"%`, limit)
      .all<Record<string, unknown>>();
    result.role = (rows.results || []).map(mapOrgRow);
  }

  if (scopes.includes("personal") && q.userId) {
    const rows = await db
      .prepare(
        `SELECT id, title as topic, category, content, NULL as confidence, updated_at, created_at, NULL as lineage_ref
           FROM personal_memory
          WHERE tenant_id = ? AND user_id = ?
          ORDER BY updated_at DESC
          LIMIT ?`
      )
      .bind(q.tenantId, q.userId, limit)
      .all<Record<string, unknown>>();
    result.personal = (rows.results || []).map(mapOrgRow);
  }

  const counts: Record<ContinuityScope, number> = {
    org: result.org.length,
    team: result.team.length,
    role: result.role.length,
    personal: result.personal.length,
  };
  const totalMemories = counts.org + counts.team + counts.role + counts.personal;

  return {
    tenantId: q.tenantId,
    role,
    scopes: result,
    counts,
    totalMemories,
    generatedAt: new Date().toISOString(),
    twinContext,
    activationThresholds,
  };
}
