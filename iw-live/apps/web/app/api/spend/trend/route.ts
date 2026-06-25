/**
 * @integratewise/spend-trend-api
 * API endpoint to get MRR trend over time
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SpendInsightsService } from "@/lib/spend/insights"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user's org
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get org membership
    const { data: membership } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const months = Number.parseInt(searchParams.get("months") || "12", 10)

    const trend = await SpendInsightsService.getMRRTrend(membership.org_id, months)

    return NextResponse.json({ trend })
  } catch (error) {
    console.error("[v0] Spend trend error:", error)
    return NextResponse.json({ error: "Failed to get spend trend" }, { status: 500 })
  }
}
