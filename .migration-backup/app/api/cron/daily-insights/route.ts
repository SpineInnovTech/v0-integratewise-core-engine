import { NextResponse } from "next/server"

// Vercel Cron job endpoint (runs daily at 9 AM)
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[v0] Running daily insights cron job")

  try {
    // Trigger daily insights generation
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/brainstorm/daily-insights`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    )

    const result = await response.json()

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
