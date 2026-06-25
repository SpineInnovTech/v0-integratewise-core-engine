/**
 * @integratewise/spend-insights-cron
 * Daily spend insights aggregation cron job
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SpendInsightsService } from "@/lib/spend/insights"

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[v0] Running spend insights cron job")

  try {
    const supabase = await createClient()

    // Get all active organizations
    const { data: orgs, error: orgsError } = await supabase.from("organizations").select("id").eq("status", "active")

    if (orgsError) {
      console.error("[v0] Failed to fetch organizations:", orgsError)
      return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
    }

    const results: { orgId: string; success: boolean; error?: string }[] = []

    for (const org of orgs || []) {
      try {
        // Generate spend summary
        const summary = await SpendInsightsService.getSpendSummary(org.id, "month")

        // Store snapshot for historical tracking
        await SpendInsightsService.storeSnapshot(org.id, summary)

        results.push({ orgId: org.id, success: true })
      } catch (err) {
        console.error(`[v0] Spend insights error for org ${org.id}:`, err)
        results.push({ orgId: org.id, success: false, error: String(err) })
      }
    }

    const successCount = results.filter((r) => r.success).length
    console.log(`[v0] Spend insights completed: ${successCount}/${results.length} orgs processed`)

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results,
    })
  } catch (error) {
    console.error("[v0] Spend insights cron error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
