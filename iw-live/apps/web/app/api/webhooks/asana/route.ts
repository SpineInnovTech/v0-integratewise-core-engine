import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Asana webhook handler - sync tasks from Asana to tasks table
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const supabase = await createServerClient()

    // Asana webhook handshake
    if (payload.events) {
      for (const event of payload.events) {
        const resource = event.resource
        const action = event.action

        if (resource.resource_type === "task") {
          if (action === "added" || action === "changed") {
            // Sync task to database
            await supabase.from("tasks").upsert(
              {
                title: resource.name,
                description: resource.notes,
                status: resource.completed ? "done" : "todo",
                priority: resource.priority === "high" ? "high" : "medium",
                due_date: resource.due_on,
                asana_id: resource.gid,
                metadata: { raw_task: resource },
              },
              { onConflict: "asana_id" },
            )
          } else if (action === "deleted") {
            await supabase.from("tasks").delete().eq("asana_id", resource.gid)
          }
        }

        // Log webhook
        await supabase.from("webhooks").insert({
          provider: "asana",
          event_type: `task.${action}`,
          event_id: event.resource.gid,
          payload: event,
          signature_valid: true,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Asana webhook error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

// Asana webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const hookSecret = searchParams.get("hook_secret")

  if (hookSecret) {
    return NextResponse.json({ hook_secret: hookSecret })
  }

  return NextResponse.json({ status: "active" })
}
