import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check database connection
    const { count, error } = await supabase.from("webhooks").select("*", { count: "exact", head: true })

    if (error) throw error

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      webhooks_count: count,
      supported_providers: ["razorpay", "stripe", "github", "vercel", "todoist", "notion", "ai-relay"],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ status: "unhealthy", error: String(error) }, { status: 500 })
  }
}
