import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import crypto from "crypto"

interface AIRelayWebhook {
  id: string
  type: string
  timestamp: number
  workspace_id?: string
  model?: string
  data: {
    messages?: Array<{
      role: string
      content: string
    }>
    response?: string
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    }
    metadata?: Record<string, unknown>
  }
}

/**
 * Verify AI-Relay webhook signature using HMAC-SHA256
 */
function verifyAIRelaySignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secret: string,
): boolean {
  if (!signature || !timestamp) {
    return false
  }

  // Check timestamp to prevent replay attacks (5 minute window)
  const requestTimestamp = parseInt(timestamp, 10)
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const timeDiff = Math.abs(currentTimestamp - requestTimestamp)

  if (timeDiff > 300) {
    // 5 minutes
    return false
  }

  // Create signature basestring: timestamp:body
  const basestring = `${timestamp}:${rawBody}`

  // Compute expected signature
  const expectedSignature = crypto.createHmac("sha256", secret).update(basestring).digest("hex")

  // Extract signature from header (format: "v1=<signature>")
  const actualSignature = signature.startsWith("v1=") ? signature.slice(3) : signature

  // Constant-time comparison
  try {
    const expectedBuffer = Buffer.from(expectedSignature, "hex")
    const actualBuffer = Buffer.from(actualSignature, "hex")
    return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  } catch {
    return false
  }
}

/**
 * AI-Relay Gateway webhook handler
 * Receives AI completion events from AI-Relay Gateway service
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const payload = JSON.parse(rawBody) as AIRelayWebhook

    // Get signature and timestamp from headers
    const signature = request.headers.get("x-ai-relay-signature")
    const timestamp = request.headers.get("x-ai-relay-timestamp")

    // Verify signature if secret is configured
    const secret = process.env.AI_RELAY_WEBHOOK_SECRET
    let signatureValid = true

    if (secret) {
      signatureValid = verifyAIRelaySignature(rawBody, signature, timestamp, secret)

      if (!signatureValid) {
        console.warn("[AI-Relay] Invalid signature", {
          hasSignature: !!signature,
          hasTimestamp: !!timestamp,
        })
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } else {
      console.warn("[AI-Relay] AI_RELAY_WEBHOOK_SECRET not configured, skipping signature verification")
    }

    const supabase = createServiceClient()

    if (!supabase) {
      console.error("[AI-Relay] Supabase client not available")
      return NextResponse.json({ error: "Database configuration error" }, { status: 500 })
    }

    // Store webhook event
    const { data: webhookData, error: webhookError } = await supabase
      .from("webhooks")
      .insert({
        provider: "ai-relay",
        event_type: payload.type,
        event_id: payload.id,
        payload,
        signature_valid: signatureValid,
        metadata: {
          headers: {
            "x-ai-relay-signature": signature ? "[REDACTED]" : null,
            "x-ai-relay-timestamp": timestamp,
          },
          ip: request.headers.get("x-forwarded-for") || "unknown",
          workspace_id: payload.workspace_id,
          model: payload.model,
        },
      })
      .select()
      .single()

    if (webhookError) {
      console.error("[AI-Relay] Failed to store webhook:", webhookError)
      return NextResponse.json({ error: "Failed to store webhook" }, { status: 500 })
    }

    // Store as interaction for AI search
    const contentSummary = payload.data.response
      ? `Response: ${payload.data.response.substring(0, 500)}...`
      : `Messages: ${payload.data.messages?.length || 0} messages`

    const usage = payload.data.usage
      ? `Tokens: ${payload.data.usage.total_tokens || 0} (prompt: ${payload.data.usage.prompt_tokens || 0}, completion: ${payload.data.usage.completion_tokens || 0})`
      : ""

    await supabase.from("interactions").insert({
      source: "webhook:ai-relay",
      title: `AI-Relay - ${payload.type} (${payload.model || "unknown model"})`,
      content: `${contentSummary}\n\n${usage}\n\n${JSON.stringify(payload, null, 2)}`,
      source_url: `https://webhooks.integratewise.online/webhooks/ai-relay`,
      metadata: {
        webhook_id: webhookData.id,
        event_type: payload.type,
        workspace_id: payload.workspace_id,
        model: payload.model,
        usage: payload.data.usage,
      },
    })

    // Log activity
    await supabase.from("activities").insert({
      activity_type: "webhook_received",
      title: `AI-Relay webhook received`,
      description: `Event: ${payload.type} | Model: ${payload.model || "unknown"}`,
      icon: "Bot",
      color: "purple",
      related_entity_type: "webhook",
      related_entity_id: webhookData.id,
      actor_name: "ai-relay",
      metadata: {
        provider: "ai-relay",
        event_type: payload.type,
        webhook_id: webhookData.id,
        model: payload.model,
        usage: payload.data.usage,
      },
    })

    console.log("[AI-Relay] Webhook processed successfully", {
      id: payload.id,
      type: payload.type,
      model: payload.model,
    })

    return NextResponse.json({
      success: true,
      id: webhookData.id,
      event_id: payload.id,
      provider: "ai-relay",
      event_type: payload.type,
      signature_valid: signatureValid,
    })
  } catch (error) {
    console.error("[AI-Relay] Webhook error:", error)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}

/**
 * GET handler - Returns AI-Relay webhook configuration
 */
export async function GET() {
  return NextResponse.json({
    provider: "ai-relay",
    status: "active",
    endpoint: "/api/webhooks/ai-relay",
    signature: "HMAC-SHA256",
    headers: {
      signature: "x-ai-relay-signature (format: v1=<hex>)",
      timestamp: "x-ai-relay-timestamp (unix timestamp)",
    },
    security: {
      algorithm: "HMAC-SHA256",
      basestring: "timestamp:body",
      replay_protection: "5 minute window",
    },
  })
}
