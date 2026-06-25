/**
 * Handoff API Routes — mounted at /v1/handoff/* in the intelligence worker.
 *
 * GET /v1/handoff/:id/state — Returns current state, history, timestamps.
 * Tenant-scoped; rejects cross-tenant queries.
 */

export async function handleGetHandoffState(
  db: D1Database,
  packageId: string,
  tenantId: string
): Promise<Response> {
  // 1. Get the package (tenant-scoped)
  const pkg = await db
    .prepare(
      `SELECT package_id, proposal_id, tenant_id, tenant_class, adapter_target, state,
              idempotency_key, created_at, updated_at, expires_at
       FROM handoff_packages
       WHERE package_id = ? AND tenant_id = ?`
    )
    .bind(packageId, tenantId)
    .first<Record<string, unknown>>();

  if (!pkg) {
    return new Response(JSON.stringify({ error: "Handoff package not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Get state history
  const { results: history } = await db
    .prepare(
      `SELECT id, from_state, to_state, actor, reason, occurred_at
       FROM handoff_state_log
       WHERE package_id = ?
       ORDER BY occurred_at ASC`
    )
    .bind(packageId)
    .all<Record<string, unknown>>();

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        ...pkg,
        history: history || [],
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
