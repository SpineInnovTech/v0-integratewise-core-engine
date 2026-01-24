import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Search endpoint for querying across all content
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") // 'all', 'interactions', 'documents', 'emails'
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const results: {
      interactions: unknown[]
      documents: unknown[]
      emails: unknown[]
      tasks: unknown[]
      drive_files: unknown[]
      metrics: unknown[]
    } = {
      interactions: [],
      documents: [],
      emails: [],
      tasks: [],
      drive_files: [],
      metrics: [],
    }

    const searchPattern = `%${query}%`

    // Search interactions
    if (!type || type === "all" || type === "interactions") {
      const { data } = await supabase
        .from("interactions")
        .select("*")
        .or(`content.ilike.${searchPattern},title.ilike.${searchPattern}`)
        .order("created_at", { ascending: false })
        .limit(limit)

      results.interactions = data || []
    }

    // Search documents
    if (!type || type === "all" || type === "documents") {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .or(`title.ilike.${searchPattern},content.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .order("updated_at", { ascending: false })
        .limit(limit)

      results.documents = data || []
    }

    // Search emails
    if (!type || type === "all" || type === "emails") {
      const { data } = await supabase
        .from("emails")
        .select("*")
        .or(`subject.ilike.${searchPattern},body.ilike.${searchPattern},sender_name.ilike.${searchPattern}`)
        .order("received_at", { ascending: false })
        .limit(limit)

      results.emails = data || []
    }

    // Search tasks
    if (!type || type === "all" || type === "tasks") {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .order("created_at", { ascending: false })
        .limit(limit)

      results.tasks = data || []
    }

    // Search drive files
    if (!type || type === "all" || type === "drive_files") {
      const { data } = await supabase
        .from("drive_files")
        .select("*")
        .or(`name.ilike.${searchPattern},content_preview.ilike.${searchPattern}`)
        .order("updated_at", { ascending: false })
        .limit(limit)

      results.drive_files = data || []
    }

    if (!type || type === "all" || type === "metrics") {
      const { data } = await supabase
        .from("metrics")
        .select("*")
        .ilike("metric_name", searchPattern)
        .order("recorded_at", { ascending: false })
        .limit(limit)

      results.metrics = data || []
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
