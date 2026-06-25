import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Webhook endpoint for receiving brainstorming data from webhooks.integratewise.online
export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = await createClient()

    // Extract brainstorming data
    const { title, description, content, participants, session_type, source_url, metadata } = payload

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    console.log("[v0] Brainstorm webhook received:", { title, session_type })

    // Store brainstorming session
    const { data: session, error: sessionError } = await supabase
      .from("brainstorm_sessions")
      .insert({
        title,
        description,
        context: content,
        participants: participants || [],
        session_type: session_type || "general",
        source: "webhooks.integratewise.online",
        source_url,
        metadata: metadata || {},
        status: "active",
      })
      .select()
      .single()

    if (sessionError) {
      console.error("[v0] Error creating brainstorm session:", sessionError)
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    console.log("[v0] Brainstorm session created:", session.id)

    // Trigger AI analysis (async)
    await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/brainstorm/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: session.id }),
    }).catch((err) => console.error("[v0] Error triggering analysis:", err))

    // Create activity
    await supabase.from("activities").insert({
      activity_type: "brainstorm_received",
      title: `New Brainstorming Session: ${title}`,
      description: description || content.substring(0, 150),
      icon: "Lightbulb",
      color: "yellow",
      related_entity_type: "brainstorm_session",
      related_entity_id: session.id,
      actor_name: "System",
    })

    return NextResponse.json({ success: true, session_id: session.id })
  } catch (error) {
    console.error("[v0] Brainstorm webhook error:", error)
    return NextResponse.json({ error: "Failed to process brainstorm webhook" }, { status: 500 })
  }
}
