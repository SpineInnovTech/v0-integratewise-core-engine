import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { triageMessage } from "@/lib/triage/service"
import crypto from "crypto"

// Verify Slack signature
function verifySlackSignature(signingSecret: string, signature: string, timestamp: string, body: string): boolean {
  const baseString = `v0:${timestamp}:${body}`
  const hmac = crypto.createHmac("sha256", signingSecret)
  hmac.update(baseString)
  const computedSignature = `v0=${hmac.digest("hex")}`
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    // Handle Slack URL verification challenge
    if (payload.type === "url_verification") {
      return NextResponse.json({ challenge: payload.challenge })
    }

    const signature = request.headers.get("x-slack-signature") || ""
    const timestamp = request.headers.get("x-slack-request-timestamp") || ""

    // Verify signature if secret is configured
    let signatureValid = true
    if (process.env.SLACK_SIGNING_SECRET) {
      signatureValid = verifySlackSignature(process.env.SLACK_SIGNING_SECRET, signature, timestamp, body)

      if (!signatureValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const supabase = createServiceClient()

    // Log webhook
    await supabase.from("webhooks").insert({
      provider: "slack",
      event_type: payload.event?.type || payload.type || "unknown",
      event_id: payload.event_id || payload.event?.client_msg_id,
      payload,
      signature_valid: signatureValid,
    })

    // Process different event types
    if (payload.event) {
      const event = payload.event

      switch (event.type) {
        case "message":
          if (!event.bot_id && event.text) {
            // Store message
            const { data: chatMessage } = await supabase
              .from("chat_messages")
              .insert({
                platform: "slack",
                platform_id: event.client_msg_id || event.ts,
                channel_id: event.channel,
                team_id: payload.team_id,
                user_id: event.user,
                content: event.text,
                thread_id: event.thread_ts,
                is_bot: false,
                metadata: {
                  channel: event.channel,
                  user: event.user,
                  thread_ts: event.thread_ts,
                  team: payload.team_id,
                },
                sent_at: new Date().toISOString(),
              })
              .select()
              .single()

            // Triage message using AI
            if (chatMessage && event.text.length > 10) {
              try {
                const triageResult = await triageMessage(
                  chatMessage.id,
                  event.text,
                  {
                    platform: "slack",
                    channel: event.channel,
                    channelId: event.channel,
                    user: event.user,
                    userId: event.user,
                    teamId: payload.team_id,
                    timestamp: new Date().toISOString(),
                    metadata: {
                      thread_ts: event.thread_ts,
                      event_ts: event.ts,
                    },
                  },
                  {
                    aiProvider: process.env.TRIAGE_AI_PROVIDER as "claude" | "deepseek" | undefined,
                    enableAutoResponse: process.env.TRIAGE_AUTO_RESPONSE === "true",
                  },
                )

                console.log("[Slack Triage]", {
                  messageId: chatMessage.id,
                  priority: triageResult.priority,
                  category: triageResult.category,
                  requiresAttention: triageResult.requires_immediate_attention,
                })

                // Log activity for urgent items
                if (triageResult.requires_immediate_attention) {
                  await supabase.from("activities").insert({
                    activity_type: "urgent_message",
                    title: `Urgent Slack message from ${event.user}`,
                    description: `Priority: ${triageResult.priority} | Category: ${triageResult.category}`,
                    icon: "AlertTriangle",
                    color: "red",
                    related_entity_type: "chat_message",
                    related_entity_id: chatMessage.id,
                    actor_name: event.user,
                    metadata: {
                      platform: "slack",
                      channel: event.channel,
                      triage_result: triageResult,
                    },
                  })
                }
              } catch (error) {
                console.error("[Slack Triage] Failed to triage message:", error)
                // Continue processing even if triage fails
              }
            }
          }
          break

        case "app_mention":
          // Triage app mentions before creating tasks
          let triagePriority: "low" | "medium" | "high" | "critical" = "medium"
          let triageCategory = "question"

          if (event.text && event.text.length > 10) {
            try {
              const triageResult = await triageMessage(
                event.client_msg_id || event.ts,
                event.text,
                {
                  platform: "slack",
                  channel: event.channel,
                  channelId: event.channel,
                  user: event.user,
                  userId: event.user,
                  teamId: payload.team_id,
                  timestamp: new Date().toISOString(),
                  metadata: {
                    event_ts: event.ts,
                    is_mention: true,
                  },
                },
                {
                  aiProvider: process.env.TRIAGE_AI_PROVIDER as "claude" | "deepseek" | undefined,
                  enableAutoResponse: true, // Always create tasks for mentions
                },
              )

              // Map triage priority to task priority
              triagePriority = triageResult.priority === "urgent" ? "critical" : triageResult.priority
              triageCategory = triageResult.category

              console.log("[Slack Mention Triage]", {
                user: event.user,
                priority: triagePriority,
                category: triageCategory,
                requiresAttention: triageResult.requires_immediate_attention,
              })
            } catch (error) {
              console.error("[Slack Mention Triage] Failed:", error)
            }
          }

          // Create task with triage information
          await supabase.from("tasks").insert({
            title: `[${triageCategory.toUpperCase()}] Slack mention from ${event.user}`,
            description: event.text,
            status: "pending",
            priority: triagePriority,
            source: "slack",
            metadata: {
              channel: event.channel,
              user: event.user,
              ts: event.ts,
              triage_category: triageCategory,
            },
          })
          break
      }
    }

    // Handle slash commands
    if (payload.command) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: `Command received: ${payload.command} ${payload.text || ""}`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Slack webhook error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
