/**
 * Input Source API
 * POST /api/loader/input-source
 * 
 * Creates a new input source for AI Loader processing
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      workspaceId,
      sourceType,
      sourceName,
      sourceUri,
      sourceMetadata = {},
    } = body

    if (!workspaceId || !sourceType || !sourceName) {
      return NextResponse.json(
        { error: "workspaceId, sourceType, and sourceName are required" },
        { status: 400 }
      )
    }

    // Validate source type
    const validTypes = [
      "file_upload",
      "folder_upload",
      "email_export",
      "api_connect",
      "clipboard_paste",
      "url_import",
      "database_connect",
    ]

    if (!validTypes.includes(sourceType)) {
      return NextResponse.json(
        { error: `Invalid source type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Create input source
    const { data: inputSource, error: insertError } = await supabase
      .from("input_sources")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        source_type: sourceType,
        source_name: sourceName,
        source_uri: sourceUri || null,
        source_metadata: sourceMetadata,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Input source creation error:", insertError)
      return NextResponse.json(
        { error: `Failed to create input source: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      inputSourceId: inputSource.input_source_id,
      status: inputSource.status,
    })
  } catch (error: any) {
    console.error("Input source API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/loader/input-source?workspaceId=xxx
 * List input sources for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId query parameter is required" },
        { status: 400 }
      )
    }

    const { data: inputSources, error } = await supabase
      .from("input_sources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("submitted_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      inputSources: inputSources || [],
    })
  } catch (error: any) {
    console.error("Input source list API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
