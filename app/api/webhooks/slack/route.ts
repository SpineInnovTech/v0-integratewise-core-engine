import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
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
            await supabase.from("brainstorm_chats").insert({
              source: "slack",
              source_id: event.client_msg_id || event.ts,
              title: `Slack: ${event.channel}`,
              content: event.text,
              context: {
                channel: event.channel,
                user: event.user,
                thread_ts: event.thread_ts,
                team: payload.team_id,
              },
              participants: [event.user],
              message_count: 1,
              status: "active",
            })
          }
          break

        case "app_mention":
          await supabase.from("tasks").insert({
            title: `Slack mention from ${event.user}`,
            description: event.text,
            status: "pending",
            priority: "medium",
            source: "slack",
            metadata: {
              channel: event.channel,
              user: event.user,
              ts: event.ts,
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
