/**
 * Creamy Preview API
 * GET /api/loader/creamy-preview?creamyExtractId=xxx
 * 
 * Retrieves the Stage 1 preview results
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const creamyExtractId = searchParams.get("creamyExtractId")
    const inputSourceId = searchParams.get("inputSourceId")

    if (!creamyExtractId && !inputSourceId) {
      return NextResponse.json(
        { error: "creamyExtractId or inputSourceId is required" },
        { status: 400 }
      )
    }

    let query = supabase
      .from("creamy_extracts")
      .select("*")

    if (creamyExtractId) {
      query = query.eq("creamy_extract_id", creamyExtractId)
    } else if (inputSourceId) {
      query = query.eq("input_source_id", inputSourceId)
    }

    const { data: extract, error } = await query.single()

    if (error || !extract) {
      return NextResponse.json(
        { error: "Creamy extract not found" },
        { status: 404 }
      )
    }

    // Check workspace access
    const { data: inputSource } = await supabase
      .from("input_sources")
      .select("workspace_id")
      .eq("input_source_id", extract.input_source_id)
      .single()

    // TODO: Verify user has access to workspace

    return NextResponse.json({
      success: true,
      preview: {
        creamyExtractId: extract.creamy_extract_id,
        extractedAt: extract.extracted_at,
        extractionTimeMs: extract.extraction_time_ms,
        entities: extract.entities_preview,
        tasks: extract.tasks_preview,
        threads: extract.threads_preview,
        highlights: extract.highlights,
        sourceSummary: extract.source_summary,
        provenance: extract.provenance,
        userReview: extract.user_review,
        stage2Config: extract.stage2_config,
      },
    })
  } catch (error: any) {
    console.error("Creamy preview API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/loader/creamy-preview
 * Updates user review and approves for Stage 2
 */
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
      creamyExtractId,
      approved,
      corrections = [],
      preferences = {},
      stage2Config = {},
    } = body

    if (!creamyExtractId) {
      return NextResponse.json(
        { error: "creamyExtractId is required" },
        { status: 400 }
      )
    }

    // Update user review
    const { error: updateError } = await supabase
      .from("creamy_extracts")
      .update({
        user_review: {
          reviewed_at: new Date().toISOString(),
          approved,
          corrections,
          preferences,
        },
        stage2_config: {
          ...stage2Config,
          approved_for_stage2: approved,
          approved_at: approved ? new Date().toISOString() : null,
          approved_by: approved ? user.id : null,
        },
      })
      .eq("creamy_extract_id", creamyExtractId)

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update review: ${updateError.message}` },
        { status: 500 }
      )
    }

    // If approved, update input source status
    if (approved) {
      const { data: extract } = await supabase
        .from("creamy_extracts")
        .select("input_source_id")
        .eq("creamy_extract_id", creamyExtractId)
        .single()

      if (extract) {
        await supabase
          .from("input_sources")
          .update({
            status: "stage2_queued",
          })
          .eq("input_source_id", extract.input_source_id)
      }
    }

    return NextResponse.json({
      success: true,
      approved,
    })
  } catch (error: any) {
    console.error("Creamy preview update error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
