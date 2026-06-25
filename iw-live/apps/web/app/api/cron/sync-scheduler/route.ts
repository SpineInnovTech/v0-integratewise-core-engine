/**
 * Sync Scheduler Cron Job
 * GET /api/cron/sync-scheduler
 * 
 * Runs periodically to check for schedules ready to execute
 * Should be called every 5-10 minutes
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSchedulesReadyToRun, updateScheduleAfterRun } from "@/lib/sync/scheduler"

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const schedules = await getSchedulesReadyToRun(supabase)

    const results = []

    for (const schedule of schedules) {
      try {
        // TODO: Trigger actual sync job
        // For now, just mark as success
        await updateScheduleAfterRun(supabase, schedule.sync_schedule_id, "success")

        results.push({
          scheduleId: schedule.sync_schedule_id,
          status: "success",
        })
      } catch (error: any) {
        console.error(`Failed to run schedule ${schedule.sync_schedule_id}:`, error)
        await updateScheduleAfterRun(supabase, schedule.sync_schedule_id, "failed")

        results.push({
          scheduleId: schedule.sync_schedule_id,
          status: "failed",
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      schedulesProcessed: schedules.length,
      results,
    })
  } catch (error: any) {
    console.error("Sync scheduler cron error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
