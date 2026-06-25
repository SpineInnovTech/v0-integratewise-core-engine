/**
 * Cron job to process outbox events.
 * @integratewise/os - Reliability
 */

import { NextResponse } from "next/server"
import { processPendingEvents } from "@/lib/outbox"
import { log, generateRequestId } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const requestId = generateRequestId()

  try {
    const result = await processPendingEvents(20, requestId)
    await log("info", "outbox_cron_complete", result, requestId)

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    await log("error", "outbox_cron_error", { error: error?.message }, requestId)

    return NextResponse.json({ error: "outbox_processing_failed", details: error?.message }, { status: 500 })
  }
}
