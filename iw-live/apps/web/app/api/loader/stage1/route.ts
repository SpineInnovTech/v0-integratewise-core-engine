/**
 * Stage 1: Creamy Layer API
 * POST /api/loader/stage1
 * 
 * Initiates Stage 1 processing (60-second preview)
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { processStage1Creamy } from "@/lib/ai-loader/stage1-creamy"

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
    const { inputSourceId } = body

    if (!inputSourceId) {
      return NextResponse.json(
        { error: "inputSourceId is required" },
        { status: 400 }
      )
    }

    // Get input source
    const { data: inputSource, error: sourceError } = await supabase
      .from("input_sources")
      .select("*")
      .eq("input_source_id", inputSourceId)
      .single()

    if (sourceError || !inputSource) {
      return NextResponse.json(
        { error: "Input source not found" },
        { status: 404 }
      )
    }

    // Check if already processed
    if (inputSource.status === "stage1_complete") {
      const { data: existingExtract } = await supabase
        .from("creamy_extracts")
        .select("*")
        .eq("input_source_id", inputSourceId)
        .single()

      if (existingExtract) {
        return NextResponse.json({
          success: true,
          creamyExtractId: existingExtract.creamy_extract_id,
          alreadyExists: true,
        })
      }
    }

    // Process Stage 1
    const result = await processStage1Creamy(supabase, {
      workspaceId: inputSource.workspace_id,
      userId: inputSource.user_id,
      inputSourceId: inputSource.input_source_id,
      sourceType: inputSource.source_type,
      sourceUri: inputSource.source_uri || "",
      sourceMetadata: inputSource.source_metadata || {},
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Stage 1 processing failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      creamyExtractId: result.creamyExtractId,
      extractionTimeMs: result.extractionTimeMs,
      preview: {
        entities: result.entitiesPreview,
        tasks: result.tasksPreview,
        threads: result.threadsPreview,
        highlights: result.highlights,
        sourceSummary: result.sourceSummary,
      },
    })
  } catch (error: any) {
    console.error("Stage 1 API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
