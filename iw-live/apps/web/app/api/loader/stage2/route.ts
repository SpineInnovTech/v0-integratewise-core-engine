/**
 * Stage 2: Full Extraction API
 * POST /api/loader/stage2
 * 
 * Initiates Stage 2 processing (full extraction)
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { processStage2Full } from "@/lib/ai-loader/stage2-full"

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
    const { creamyExtractId, extractionConfig } = body

    if (!creamyExtractId) {
      return NextResponse.json(
        { error: "creamyExtractId is required" },
        { status: 400 }
      )
    }

    // Get creamy extract and input source
    const { data: creamyExtract, error: extractError } = await supabase
      .from("creamy_extracts")
      .select("*, input_sources(*)")
      .eq("creamy_extract_id", creamyExtractId)
      .single()

    if (extractError || !creamyExtract) {
      return NextResponse.json(
        { error: "Creamy extract not found" },
        { status: 404 }
      )
    }

    const inputSource = creamyExtract.input_sources

    // Check if already approved
    const userReview = creamyExtract.user_review as any
    if (!userReview?.approved) {
      return NextResponse.json(
        { error: "Creamy extract must be approved before Stage 2" },
        { status: 400 }
      )
    }

    // Create extraction job
    const { data: extractionJob, error: jobError } = await supabase
      .from("extraction_jobs")
      .insert({
        input_source_id: inputSource.input_source_id,
        creamy_extract_id: creamyExtractId,
        workspace_id: creamyExtract.workspace_id,
        job_type: "initial",
        extraction_config: extractionConfig || creamyExtract.stage2_config || {},
        status: "queued",
        queued_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (jobError) {
      return NextResponse.json(
        { error: `Failed to create extraction job: ${jobError.message}` },
        { status: 500 }
      )
    }

    // Update input source status
    await supabase
      .from("input_sources")
      .update({
        status: "stage2_running",
        stage2_started_at: new Date().toISOString(),
      })
      .eq("input_source_id", inputSource.input_source_id)

    // Process Stage 2 (async - don't wait)
    processStage2Full(supabase, {
      workspaceId: creamyExtract.workspace_id,
      extractionJobId: extractionJob.extraction_job_id,
      inputSourceId: inputSource.input_source_id,
      creamyExtractId,
      extractionConfig: extractionConfig || creamyExtract.stage2_config || {},
    }).catch((error) => {
      console.error("Stage 2 processing error:", error)
    })

    return NextResponse.json({
      success: true,
      extractionJobId: extractionJob.extraction_job_id,
      status: "queued",
      message: "Stage 2 processing started in background",
    })
  } catch (error: any) {
    console.error("Stage 2 API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/loader/stage2?extractionJobId=xxx
 * Get extraction job status
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
    const extractionJobId = searchParams.get("extractionJobId")

    if (!extractionJobId) {
      return NextResponse.json(
        { error: "extractionJobId is required" },
        { status: 400 }
      )
    }

    const { data: job, error } = await supabase
      .from("extraction_jobs")
      .select("*")
      .eq("extraction_job_id", extractionJobId)
      .single()

    if (error || !job) {
      return NextResponse.json(
        { error: "Extraction job not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      job: {
        extractionJobId: job.extraction_job_id,
        status: job.status,
        progress: job.progress,
        results: job.results,
        errors: job.errors,
        queuedAt: job.queued_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
      },
    })
  } catch (error: any) {
    console.error("Stage 2 status API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
