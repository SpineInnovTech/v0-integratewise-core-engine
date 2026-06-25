import { NextResponse } from "next/server"
import { createAdminClient, getSupabaseServer } from "@/lib/supabase/server"
import { ENV } from "@/lib/env"

/**
 * Webhook Scheduler Trigger Endpoint
 *
 * POST: Manually trigger a webhook notification (for testing)
 * GET: Fetch webhook history and status
 */

// Manual trigger endpoint for testing
export async function POST(request: Request) {
  try {
    const { channel = "both" } = await request.json()

    const slackUrl = ENV?.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL
    const discordUrl = ENV?.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL

    if (!slackUrl && !discordUrl) {
      return NextResponse.json({
        success: true,
        message: "No webhook URLs configured. Add SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL to enable.",
        configured: false,
      })
    }

    // Dynamic import to avoid errors if ai-webhook-service has issues
    const { fetchBusinessMetrics, generateAIInsights, sendWebhookNotification } = await import(
      "@/lib/ai-webhook-service"
    )

    // 1. Fetch business metrics
    const metrics = await fetchBusinessMetrics()

    // 2. Generate AI insights
    const insights = await generateAIInsights(metrics)

    // 3. Build payload
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    })

    const payload = {
      title: "Manual Business Intelligence Report",
      metrics,
      insights,
      timestamp,
    }

    // 4. Send notification
    const result = await sendWebhookNotification(channel, payload)

    return NextResponse.json({
      success: result.success,
      error: result.error,
      metrics,
      insights,
    })
  } catch (error) {
    console.error("[Manual Trigger] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Trigger failed",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Use singleton server client if available, otherwise create admin client
    const supabase = getSupabaseServer() || createAdminClient()

    if (!supabase) {
      return NextResponse.json({
        ok: false,
        notifications: [],
        config: null,
        configured: false,
        message: "Database not configured. Check SUPABASE_URL and keys.",
      })
    }

    // The database schema shows only 'webhooks' table exists
    const { data, error } = await supabase
      .from("webhooks")
      .select("id, provider, event_type, processed, created_at, processed_at")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[Webhook History] Supabase error:", error)
      return NextResponse.json({
        ok: false,
        notifications: [],
        config: null,
        configured: false,
        message: error.message,
        code: error.code,
      })
    }

    const mappedNotifications = (data || []).map((item: any) => ({
      id: item.id,
      channel: item.provider || "webhook",
      notification_type: item.event_type || "webhook",
      title: `${item.provider || "Webhook"} - ${item.event_type || "event"}`,
      status: item.processed ? "sent" : "pending",
      sent_at: item.processed_at || item.created_at,
      created_at: item.created_at,
    }))

    return NextResponse.json({
      ok: true,
      notifications: mappedNotifications,
      config: null,
      configured: true,
      latest: mappedNotifications[0] ?? null,
    })
  } catch (error) {
    console.error("[Webhook History] Error:", error)
    return NextResponse.json({
      ok: false,
      notifications: [],
      config: null,
      configured: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
