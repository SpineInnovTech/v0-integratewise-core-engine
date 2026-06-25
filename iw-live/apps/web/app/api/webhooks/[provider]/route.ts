import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import crypto from "crypto"

// Slack/Discord kept as special cases due to signature/interaction semantics

const PROVIDERS = {
  razorpay: { signature: "HMAC-SHA256", header: "x-razorpay-signature" },
  github: { signature: "HMAC-SHA256", header: "x-hub-signature-256" },
  vercel: { signature: "HMAC-SHA1", header: "x-vercel-signature" },
  hubspot: { signature: "HMAC-SHA256", header: "x-hubspot-signature-v3" },
  todoist: { signature: null, header: null },
  notion: { signature: null, header: null },
  asana: { signature: "HMAC-SHA256", header: "x-hook-signature" },
  "ai-relay": { signature: "HMAC-SHA256", header: "x-ai-relay-signature" },
} as const

type Provider = keyof typeof PROVIDERS

const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "x-api-key",
  "x-auth-token",
  "x-hubspot-signature",
  "x-razorpay-signature",
  "x-hub-signature-256",
  "x-hook-signature",
]

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      redacted[key] = "[REDACTED]"
    } else {
      redacted[key] = value
    }
  }
  return redacted
}

function verifySignature(
  provider: Provider,
  payload: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  const config = PROVIDERS[provider]

  if (!config.signature || !secret) return true
  if (!signature) return false

  try {
    if (config.signature === "HMAC-SHA256") {
      const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")
      const sig = signature.startsWith("sha256=") ? signature.slice(7) : signature
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    } else if (config.signature === "HMAC-SHA1") {
      const expected = crypto.createHmac("sha1", secret).update(payload).digest("hex")
      const sig = signature.startsWith("sha1=") ? signature.slice(5) : signature
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    }
  } catch {
    return false
  }

  return false
}

function getEventType(provider: Provider, payload: Record<string, unknown>): string {
  switch (provider) {
    case "razorpay":
      return (payload.event as string) || "unknown"
    case "github":
      return (payload.action as string) || "push"
    case "hubspot":
      return (payload.eventType as string) || (payload.subscriptionType as string) || "unknown"
    case "vercel":
      return (payload.type as string) || "deployment"
    case "todoist":
      return (payload.event_name as string) || "item:updated"
    case "notion":
      return (payload.type as string) || "page.updated"
    case "asana":
      return (payload.events?.[0]?.action as string) || "unknown"
    case "ai-relay":
      return (payload.type as string) || "chat.completion"
    default:
      return "unknown"
  }
}

function getEventId(provider: Provider, payload: Record<string, unknown>): string | null {
  switch (provider) {
    case "razorpay":
      return ((payload.payload as Record<string, unknown>)?.payment?.entity?.id as string) || null
    case "github":
      return (payload.delivery as string) || null
    case "hubspot":
      return (payload.objectId as string) || (payload.correlationId as string) || null
    case "vercel":
      return (payload.id as string) || null
    case "todoist":
      return (payload.event_data?.id as string) || null
    case "notion":
      return (payload.id as string) || null
    case "asana":
      return (payload.events?.[0]?.resource?.gid as string) || null
    case "ai-relay":
      return (payload.id as string) || null
    default:
      return null
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params
  const provider = providerParam as Provider

  // Validate provider
  if (!PROVIDERS[provider]) {
    return NextResponse.json({ error: "Invalid provider", supported: Object.keys(PROVIDERS) }, { status: 400 })
  }

  try {
    const rawBody = await request.text()
    const payload = JSON.parse(rawBody) as Record<string, unknown>

    // Get signature from headers
    const config = PROVIDERS[provider]
    const signature = config.header ? request.headers.get(config.header) : null

    // Get secret from environment
    const secretEnvKey = `${provider.toUpperCase().replace("-", "_")}_WEBHOOK_SECRET`
    const secret = process.env[secretEnvKey]

    // Verify signature
    const signatureValid = verifySignature(provider, rawBody, signature, secret)

    // Extract event info
    const eventType = getEventType(provider, payload)
    const eventId = getEventId(provider, payload)

    const supabase = createServiceClient()

    const rawHeaders = Object.fromEntries(request.headers.entries())
    const redactedHeaders = redactHeaders(rawHeaders)

    const { data, error } = await supabase
      .from("webhooks")
      .insert({
        provider,
        event_type: eventType,
        event_id: eventId,
        payload,
        signature_valid: signatureValid,
        metadata: {
          headers: redactedHeaders,
          ip: request.headers.get("x-forwarded-for") || "unknown",
        },
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to store webhook:", error)
      return NextResponse.json({ error: "Failed to store webhook" }, { status: 500 })
    }

    // Store as interaction for AI search
    await supabase.from("interactions").insert({
      source: `webhook:${provider}`,
      title: `${provider} - ${eventType}`,
      content: JSON.stringify(payload, null, 2),
      source_url: `https://webhooks.integratewise.online/webhooks/${provider}`,
      metadata: { webhook_id: data.id, event_type: eventType },
    })

    await supabase.from("activities").insert({
      activity_type: "webhook_received",
      title: `Webhook received from ${provider}`,
      description: `Event: ${eventType}`,
      icon: "Webhook",
      color: "orange",
      related_entity_type: "webhook",
      related_entity_id: data.id,
      actor_name: provider,
      metadata: { provider, event_type: eventType, webhook_id: data.id },
    })

    return NextResponse.json({
      success: true,
      id: data.id,
      provider,
      event_type: eventType,
      signature_valid: signatureValid,
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params

  if (!PROVIDERS[provider as Provider]) {
    return NextResponse.json({ error: "Invalid provider", supported: Object.keys(PROVIDERS) }, { status: 400 })
  }

  return NextResponse.json({
    provider,
    status: "active",
    endpoint: `/api/webhooks/${provider}`,
    signature: PROVIDERS[provider as Provider].signature || "none",
  })
}
