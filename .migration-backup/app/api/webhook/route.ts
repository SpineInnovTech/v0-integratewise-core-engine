import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function verifyAuthSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  const webhookSecret = process.env.WEBHOOK_API_SECRET

  // If no secret configured, allow (for backwards compatibility)
  if (!webhookSecret) return true

  return authHeader === `Bearer ${webhookSecret}`
}

// Generic webhook endpoint for capturing external data
export async function POST(request: Request) {
  if (!verifyAuthSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const { searchParams } = new URL(request.url)
    const source = searchParams.get("source") || "webhook"

    const supabase = createServiceClient()

    // Determine the content and title based on webhook source
    const content = JSON.stringify(payload, null, 2)
    let title = `Webhook: ${source}`
    let metadata: Record<string, unknown> = { raw_payload: payload }

    // Handle specific webhook sources
    if (source === "hubspot") {
      title = `HubSpot: ${payload.eventType || payload.subscriptionType || "Event"}`
      metadata = {
        ...metadata,
        event_type: payload.eventType,
        object_id: payload.objectId,
        portal_id: payload.portalId,
      }
    }

    // Store in interactions
    const { data, error } = await supabase
      .from("interactions")
      .insert({
        content,
        source: `webhook_${source}`,
        title,
        metadata,
      })
      .select()
      .single()

    if (error) {
      console.error("Webhook capture error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from("activities").insert({
      activity_type: "webhook_received",
      title: `Webhook received: ${source}`,
      description: title,
      icon: "Webhook",
      color: "orange",
      related_entity_type: "interaction",
      related_entity_id: data.id,
      actor_name: source,
    })

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
