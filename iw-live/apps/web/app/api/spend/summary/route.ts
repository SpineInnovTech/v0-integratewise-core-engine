/**
 * @integratewise/spend-summary-api
 * API endpoint to get spend summary for current org
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
    const period = (searchParams.get("period") || "month") as "month" | "quarter" | "year"

    const summary = await SpendInsightsService.getSpendSummary(membership.org_id, period)

    return NextResponse.json(summary)
  } catch (error) {
    console.error("[v0] Spend summary error:", error)
    return NextResponse.json({ error: "Failed to get spend summary" }, { status: 500 })
  }
}
