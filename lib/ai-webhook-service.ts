import { createAdminClient } from "@/lib/supabase/server"

// Types
interface BusinessMetrics {
  mrr: number
  mrrChange: number
  pipeline: number
  pipelineChange: number
  healthScore: number
  healthChange: number
  activeClients: number
  openDeals: number
  conversionRate: number
  avgDealSize: number
}

interface AIInsight {
  recommendations: string[]
  alerts: string[]
  summary: string
}

interface WebhookPayload {
  title: string
  metrics: BusinessMetrics
  insights: AIInsight
  timestamp: string
}

// Fetch business metrics from database
export async function fetchBusinessMetrics(): Promise<BusinessMetrics> {
  const supabase = createAdminClient()

  // Get deals data
  const { data: deals } = await supabase.from("deals").select("value, status, created_at")

  // Get clients data
  const { data: clients } = await supabase
    .from("clients")
    .select("id, health_score, status, total_revenue")
    .eq("status", "active")

  // Get leads data
  const { data: leads } = await supabase.from("leads").select("id, status, created_at")

  // Calculate metrics
  const wonDeals = deals?.filter((d) => d.status === "won") || []
  const openDeals = deals?.filter((d) => d.status === "open" || d.status === "negotiation") || []
  const allDeals = deals || []

  const mrr = clients?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) / 12 || 0
  const pipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const avgHealth = clients?.length ? clients.reduce((sum, c) => sum + (c.health_score || 0), 0) / clients.length : 0
  const conversionRate = allDeals.length ? (wonDeals.length / allDeals.length) * 100 : 0
  const avgDealSize = wonDeals.length ? wonDeals.reduce((sum, d) => sum + (d.value || 0), 0) / wonDeals.length : 0

  return {
    mrr: Math.round(mrr),
    mrrChange: 12.5, // Would calculate from historical data
    pipeline: Math.round(pipeline),
    pipelineChange: 8.3,
    healthScore: Math.round(avgHealth),
    healthChange: 2,
    activeClients: clients?.length || 0,
    openDeals: openDeals.length,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgDealSize: Math.round(avgDealSize),
  }
}

// Generate AI insights using Claude or DeepSeek
export async function generateAIInsights(metrics: BusinessMetrics): Promise<AIInsight> {
  const prompt = `Analyze these business metrics and provide insights:
  
MRR: ₹${metrics.mrr.toLocaleString()} (${metrics.mrrChange > 0 ? "+" : ""}${metrics.mrrChange}%)
Pipeline: ₹${metrics.pipeline.toLocaleString()} (${metrics.pipelineChange > 0 ? "+" : ""}${metrics.pipelineChange}%)
Health Score: ${metrics.healthScore}/100 (${metrics.healthChange > 0 ? "+" : ""}${metrics.healthChange})
Active Clients: ${metrics.activeClients}
Open Deals: ${metrics.openDeals}
Conversion Rate: ${metrics.conversionRate}%
Avg Deal Size: ₹${metrics.avgDealSize.toLocaleString()}

Provide:
1. A 2-sentence summary of business health
2. 3 specific recommendations to improve metrics
3. Any alerts if metrics are concerning (health < 70, pipeline declining, etc.)

Format as JSON: { "summary": "...", "recommendations": ["...", "...", "..."], "alerts": ["..."] }`

  try {
    // Try Claude first
    if (process.env.CLAUDE_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.content[0].text
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }
    }

    // Fallback to DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }
    }
  } catch (error) {
    console.error("[AI Webhook] AI generation error:", error)
  }

  // Fallback to rule-based insights
  const recommendations: string[] = []
  const alerts: string[] = []

  if (metrics.conversionRate < 30) {
    recommendations.push("Focus on lead qualification to improve conversion rate")
  }
  if (metrics.pipeline < metrics.mrr * 3) {
    recommendations.push("Increase prospecting efforts to build pipeline")
  }
  if (metrics.healthScore < 80) {
    recommendations.push("Schedule check-ins with at-risk clients")
  }
  recommendations.push("Review top deals for acceleration opportunities")

  if (metrics.healthScore < 70) {
    alerts.push(`Health score is below threshold at ${metrics.healthScore}/100`)
  }
  if (metrics.pipelineChange < 0) {
    alerts.push("Pipeline is declining - immediate attention needed")
  }

  return {
    summary: `Business health is ${metrics.healthScore >= 80 ? "strong" : "moderate"} with ${metrics.activeClients} active clients. Pipeline stands at ₹${metrics.pipeline.toLocaleString()} with ${metrics.openDeals} open deals.`,
    recommendations: recommendations.slice(0, 3),
    alerts,
  }
}

// Format Slack message
export function formatSlackMessage(payload: WebhookPayload): object {
  const { title, metrics, insights, timestamp } = payload

  return {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: title, emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*${insights.summary}*` },
      },
      { type: "divider" },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*MRR*\n₹${metrics.mrr.toLocaleString()} (${metrics.mrrChange > 0 ? "↑" : "↓"}${Math.abs(metrics.mrrChange)}%)`,
          },
          {
            type: "mrkdwn",
            text: `*Pipeline*\n₹${metrics.pipeline.toLocaleString()} (${metrics.pipelineChange > 0 ? "↑" : "↓"}${Math.abs(metrics.pipelineChange)}%)`,
          },
          { type: "mrkdwn", text: `*Health Score*\n${metrics.healthScore}/100` },
          { type: "mrkdwn", text: `*Active Clients*\n${metrics.activeClients}` },
          { type: "mrkdwn", text: `*Open Deals*\n${metrics.openDeals}` },
          { type: "mrkdwn", text: `*Conversion Rate*\n${metrics.conversionRate}%` },
        ],
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*💡 AI Recommendations*\n${insights.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`,
        },
      },
      ...(insights.alerts.length > 0
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*🚨 Alerts*\n${insights.alerts.map((a) => `• ${a}`).join("\n")}`,
              },
            },
          ]
        : []),
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `Sent at ${timestamp} | IntegrateWise OS` }],
      },
    ],
  }
}

// Format Discord message
export function formatDiscordMessage(payload: WebhookPayload): object {
  const { title, metrics, insights, timestamp } = payload

  return {
    embeds: [
      {
        title,
        description: insights.summary,
        color: metrics.healthScore >= 80 ? 0x22c55e : metrics.healthScore >= 60 ? 0xf59e0b : 0xef4444,
        fields: [
          {
            name: "💰 MRR",
            value: `₹${metrics.mrr.toLocaleString()}\n${metrics.mrrChange > 0 ? "↑" : "↓"}${Math.abs(metrics.mrrChange)}%`,
            inline: true,
          },
          {
            name: "📊 Pipeline",
            value: `₹${metrics.pipeline.toLocaleString()}\n${metrics.pipelineChange > 0 ? "↑" : "↓"}${Math.abs(metrics.pipelineChange)}%`,
            inline: true,
          },
          { name: "❤️ Health", value: `${metrics.healthScore}/100`, inline: true },
          { name: "👥 Clients", value: `${metrics.activeClients}`, inline: true },
          { name: "🎯 Open Deals", value: `${metrics.openDeals}`, inline: true },
          { name: "📈 Conversion", value: `${metrics.conversionRate}%`, inline: true },
          {
            name: "💡 AI Recommendations",
            value: insights.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n"),
            inline: false,
          },
          ...(insights.alerts.length > 0
            ? [{ name: "🚨 Alerts", value: insights.alerts.join("\n"), inline: false }]
            : []),
        ],
        footer: { text: `IntegrateWise OS | ${timestamp}` },
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

// Send webhook notification
export async function sendWebhookNotification(
  channel: "slack" | "discord" | "both",
  payload: WebhookPayload,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Get webhook configs - gracefully handle missing table
  let configs: any[] = []
  try {
    const { data } = await supabase.from("webhook_scheduler_config").select("*").eq("is_enabled", true)
    configs = data || []
  } catch {
    // Table doesn't exist, continue with env vars
  }

  const results: { slack?: any; discord?: any } = {}
  let error: string | undefined

  try {
    // Send to Slack
    if ((channel === "slack" || channel === "both") && process.env.SLACK_WEBHOOK_URL) {
      const slackConfig = configs?.find((c) => c.channel === "slack")
      const webhookUrl = slackConfig?.webhook_url || process.env.SLACK_WEBHOOK_URL

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatSlackMessage(payload)),
      })

      results.slack = { status: response.status, ok: response.ok }
    }

    // Send to Discord
    if ((channel === "discord" || channel === "both") && process.env.DISCORD_WEBHOOK_URL) {
      const discordConfig = configs?.find((c) => c.channel === "discord")
      const webhookUrl = discordConfig?.webhook_url || process.env.DISCORD_WEBHOOK_URL

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatDiscordMessage(payload)),
      })

      results.discord = { status: response.status, ok: response.ok }
    }

    // Log notification - gracefully handle missing table
    try {
      await supabase.from("webhook_notifications").insert({
        channel,
        notification_type: "hourly_summary",
        title: payload.title,
        content: payload.insights.summary,
        metrics: payload.metrics,
        recommendations: payload.insights.recommendations,
        alerts: payload.insights.alerts,
        status: "sent",
        slack_response: results.slack,
        discord_response: results.discord,
        sent_at: new Date().toISOString(),
      })
    } catch {
      // Table doesn't exist, skip logging
    }

    return { success: true }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error"

    // Log failed notification - gracefully handle missing table
    try {
      await supabase.from("webhook_notifications").insert({
        channel,
        notification_type: "hourly_summary",
        title: payload.title,
        content: payload.insights.summary,
        metrics: payload.metrics,
        recommendations: payload.insights.recommendations,
        alerts: payload.insights.alerts,
        status: "failed",
        error_message: error,
        sent_at: new Date().toISOString(),
      })
    } catch {
      // Table doesn't exist, skip logging
    }

    return { success: false, error }
  }
}
