/**
 * Cron job for database integrity checks.
 * @integratewise/os - DR and Reliability
 */

import { NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { log, generateRequestId } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const requestId = generateRequestId()
  const checks: Record<string, { count: number; status: string }> = {}

  const criticalTables = [
    "clients",
    "deals",
    "tasks",
    "activities",
    "brainstorm_sessions",
    "daily_insights",
    "outbox_events",
  ]

  try {
    for (const table of criticalTables) {
      try {
        const result = await query<{ count: string }>(`SELECT COUNT(*) as count FROM ${table}`, [], requestId)
        checks[table] = {
          count: Number.parseInt(result[0]?.count || "0", 10),
          status: "ok",
        }
      } catch {
        checks[table] = { count: 0, status: "error" }
      }
    }

    // Check for stuck outbox events
    const stuckEvents = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM outbox_events
       WHERE status = 'processing'
       AND created_at < NOW() - INTERVAL '1 hour'`,
      [],
      requestId,
    )

    const stuckCount = Number.parseInt(stuckEvents[0]?.count || "0", 10)
    if (stuckCount > 0) {
      await log("warn", "integrity_stuck_outbox", { count: stuckCount }, requestId)
      // Reset stuck events
      await query(
        `UPDATE outbox_events SET status = 'pending'
         WHERE status = 'processing'
         AND created_at < NOW() - INTERVAL '1 hour'`,
        [],
        requestId,
      )
    }

    await log("info", "integrity_check_complete", { checks }, requestId)

    return NextResponse.json({
      success: true,
      checks,
      stuckEventsReset: stuckCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    await log("error", "integrity_check_error", { error: error?.message }, requestId)

    return NextResponse.json({ error: "integrity_check_failed", details: error?.message }, { status: 500 })
  }
}
