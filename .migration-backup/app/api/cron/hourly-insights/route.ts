import { NextResponse } from "next/server"
import { fetchBusinessMetrics, generateAIInsights, sendWebhookNotification } from "@/lib/ai-webhook-service"

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const slackWebhook = process.env.SLACK_WEBHOOK_URL
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL

  if (!slackWebhook && !discordWebhook) {
    console.log("[Hourly Insights] No webhook URLs configured, skipping")
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "No webhook URLs configured (SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL)",
    })
  }

  const hasAIKey = process.env.CLAUDE_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
  if (!hasAIKey) {
    console.log("[Hourly Insights] No AI API key configured, skipping")
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "No AI API key configured (CLAUDE_API_KEY, DEEPSEEK_API_KEY, or OPENAI_API_KEY)",
    })
  }

  console.log("[Hourly Insights] Starting cron job")

  try {
    // 1. Fetch business metrics
    const metrics = await fetchBusinessMetrics()
    console.log("[Hourly Insights] Metrics fetched:", metrics)

    // 2. Generate AI insights
    const insights = await generateAIInsights(metrics)
    console.log("[Hourly Insights] AI insights generated")

    // 3. Build payload
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    })

    const payload = {
      title: "Hourly Business Intelligence Report",
      metrics,
      insights,
      timestamp,
    }

    // 4. Send to configured channels
    const result = await sendWebhookNotification("both", payload)

    if (!result.success) {
      console.error("[Hourly Insights] Webhook send failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log("[Hourly Insights] Completed successfully")
    return NextResponse.json({ success: true, metrics, insights })
  } catch (error) {
    console.error("[Hourly Insights] Cron job error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Cron job failed",
      },
      { status: 500 },
    )
  }
}
