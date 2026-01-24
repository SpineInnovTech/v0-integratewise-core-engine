import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// Manual trigger endpoint for testing
export async function POST(request: Request) {
  try {
    const { channel = "both" } = await request.json()

    const slackUrl = process.env.SLACK_WEBHOOK_URL
    const discordUrl = process.env.DISCORD_WEBHOOK_URL

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
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json({
        notifications: [],
        config: null,
        configured: false,
        message: "Database not configured",
      })
    }

    // Check if webhook URLs are configured
    const slackUrl = process.env.SLACK_WEBHOOK_URL
    const discordUrl = process.env.DISCORD_WEBHOOK_URL
    
    if (!slackUrl && !discordUrl) {
      return NextResponse.json({
        notifications: [],
        config: null,
        configured: false,
        message: "No webhook URLs configured",
      })
    }

    // Try webhook_notifications view first with timeout
    let data = null
    let error = null
    
    try {
      const result = await supabase
        .from("webhook_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)
      data = result.data
      error = result.error
    } catch (fetchError) {
      // Table likely doesn't exist
      error = { code: "PGRST116", message: "Table not found" }
    }

    // If view doesn't exist, fall back to webhooks table
    if (error && (error.code === "PGRST116" || error.code === "42P01")) {
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("webhooks")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)

        if (fallbackError) {
          // Tables not created yet - that's okay, show configured but empty
          return NextResponse.json({
            notifications: [],
            config: null,
            configured: true,
            message: "Webhook tables will be created on first use.",
          })
        }

        // Map webhooks table schema to expected format
        const mappedNotifications = (fallbackData || []).map((item: any) => ({
          id: item.id,
          channel: item.provider || "unknown",
          notification_type: item.event || "webhook",
          title: `${item.provider || "Webhook"} Event`,
          status: item.status || "received",
          sent_at: item.created_at,
          created_at: item.created_at,
        }))

        return NextResponse.json({
          notifications: mappedNotifications,
          config: null,
          configured: true,
          source: "webhooks",
        })
      } catch {
        // Fallback also failed - show configured but empty
        return NextResponse.json({
          notifications: [],
          config: null,
          configured: true,
          message: "Ready to send webhooks",
        })
      }
    }

    if (error) {
      // Non-table-not-found errors - still show as configured if URLs exist
      return NextResponse.json({
        notifications: [],
        config: null,
        configured: true,
        message: "Ready to send webhooks",
      })
    }

    let config = null
    try {
      const { data: configData } = await supabase.from("webhook_scheduler_config").select("*").maybeSingle()
      config = configData
    } catch {
      // Config table doesn't exist - that's okay
    }

    return NextResponse.json({
      notifications: data || [],
      config,
      configured: true,
      source: "webhook_notifications",
    })
  } catch (error) {
    // Catch-all: if we have webhook URLs configured, show as configured
    const slackUrl = process.env.SLACK_WEBHOOK_URL
    const discordUrl = process.env.DISCORD_WEBHOOK_URL
    
    return NextResponse.json({
      notifications: [],
      config: null,
      configured: !!(slackUrl || discordUrl),
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
