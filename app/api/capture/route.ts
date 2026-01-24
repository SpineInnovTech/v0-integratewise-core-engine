import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function verifyAuthSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  const captureSecret = process.env.CAPTURE_API_SECRET

  // If no secret configured, allow (for backwards compatibility)
  if (!captureSecret) return true

  return authHeader === `Bearer ${captureSecret}`
}

// Capture endpoint for storing interactions from any source
export async function POST(request: Request) {
  if (!verifyAuthSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { content, source, title, sourceUrl, metadata } = await request.json()

    if (!content || !source) {
      return NextResponse.json({ error: "Content and source are required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Insert the interaction
    const { data, error } = await supabase
      .from("interactions")
      .insert({
        content,
        source,
        title,
        source_url: sourceUrl,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error("Error capturing interaction:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from("activities").insert({
      activity_type: "interaction_captured",
      title: `Captured: ${source} interaction`,
      description: title || content.substring(0, 100),
      icon: "MessageSquare",
      color: "teal",
      related_entity_type: "interaction",
      related_entity_id: data.id,
      actor_name: "System",
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Capture error:", error)
    return NextResponse.json({ error: "Failed to capture interaction" }, { status: 500 })
  }
}

// Get recent interactions
export async function GET(request: Request) {
  if (!verifyAuthSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get("source")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = createServiceClient()

    let query = supabase.from("interactions").select("*").order("created_at", { ascending: false }).limit(limit)

    if (source) {
      query = query.eq("source", source)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch interactions" }, { status: 500 })
  }
}
