/**
 * Sync Schedule API
 * POST /api/sync/schedule - Create/update schedule
 * GET /api/sync/schedule - List schedules
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSyncSchedule } from "@/lib/sync/scheduler"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      workspaceId,
      connectorId,
      scheduleType,
      scheduleTime,
      scheduleDay,
      timezone,
      syncConfig,
      membershipTier,
    } = body

    if (!workspaceId || !connectorId || !scheduleType) {
      return NextResponse.json(
        { error: "workspaceId, connectorId, and scheduleType are required" },
        { status: 400 }
      )
    }

    const scheduleId = await createSyncSchedule(supabase, {
      workspaceId,
      connectorId,
      scheduleType,
      scheduleTime,
      scheduleDay,
      timezone: timezone || "UTC",
      syncConfig: syncConfig || {},
      membershipTier: membershipTier || "free",
    })

    return NextResponse.json({
      success: true,
      scheduleId,
    })
  } catch (error: any) {
    console.error("Sync schedule API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId query parameter is required" },
        { status: 400 }
      )
    }

    const { data: schedules, error } = await supabase
      .from("sync_schedules")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedules: schedules || [],
    })
  } catch (error: any) {
    console.error("Sync schedule list API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
