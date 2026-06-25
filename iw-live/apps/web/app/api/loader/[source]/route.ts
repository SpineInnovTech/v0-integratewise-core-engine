/**
 * Loader API Route
 * Endpoint: POST /api/loader/[source]
 * Triggers data loading from a specific source
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { loadFromSlack } from "@/lib/loaders/slack"
import { loadFromHubSpot } from "@/lib/loaders/hubspot"
import { loadFromNotion } from "@/lib/loaders/notion"
import { loadFromGmail } from "@/lib/loaders/gmail"
import { loadFromSheets } from "@/lib/loaders/sheets"
import { batchUpsertTasks, batchUpsertNotes, batchUpsertConversations, batchUpsertPlans } from "@/lib/db"

function validateLoaderResult(result: any): { success: boolean; error?: string } {
  if (!result) return { success: false, error: "Result is null" }
  if (!result.spine) return { success: false, error: "Missing spine object" }
  if (!result.audit) return { success: false, error: "Missing audit object" }
  if (!Array.isArray(result.spine.tasks)) return { success: false, error: "spine.tasks must be array" }
  if (!Array.isArray(result.spine.notes)) return { success: false, error: "spine.notes must be array" }
  if (!Array.isArray(result.spine.conversations)) return { success: false, error: "spine.conversations must be array" }
  if (!Array.isArray(result.spine.plans)) return { success: false, error: "spine.plans must be array" }
  return { success: true }
}

export async function POST(request: NextRequest, { params }: { params: { source: string } }) {
  const source = params.source
  const request_id = crypto.randomUUID()

  try {
    // Parse request body
    const body = await request.json()
    const { workspace_id, auth, fetch_params } = body

    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    if (!auth) {
      return NextResponse.json({ error: "auth credentials required" }, { status: 400 })
    }

    const { since, until, cursor, page_size = 100, max_pages = 10 } = fetch_params || {}

    if (!since || !until) {
      return NextResponse.json({ error: "fetch_params.since and fetch_params.until required" }, { status: 400 })
    }

    // Create loader run record
    const supabase = createClient()
    const { data: run } = await supabase
      .from("loader_runs")
      .insert({
        workspace_id,
        source,
        time_window_since: since,
        time_window_until: until,
        status: "running",
      })
      .select()
      .single()

    // Execute loader based on source
    let result
    try {
      switch (source) {
        case "slack":
          result = await loadFromSlack({
            workspace_id,
            bot_token: auth.bot_token,
            since,
            until,
            cursor,
            page_size,
            max_pages,
          })
          break

        case "hubspot":
          result = await loadFromHubSpot({
            workspace_id,
            api_key: auth.api_key,
            since,
            until,
            cursor,
            page_size,
            max_pages,
          })
          break

        case "notion":
          result = await loadFromNotion({
            workspace_id,
            notion_token: auth.notion_token,
            database_ids: auth.database_ids || [],
            since,
            until,
            cursor,
            page_size,
            max_pages,
          })
          break

        case "gmail":
          result = await loadFromGmail({
            workspace_id,
            access_token: auth.access_token,
            since,
            until,
            max_results: page_size,
          })
          break

        case "sheets":
          result = await loadFromSheets({
            workspace_id,
            api_key: auth.api_key,
            spreadsheet_id: auth.spreadsheet_id,
            range: auth.range || "A1:Z1000",
            since,
            until,
          })
          break

        default:
          return NextResponse.json({ error: `Unsupported source: ${source}` }, { status: 400 })
      }
    } catch (loader_error: any) {
      // Update run record with error
      await supabase
        .from("loader_runs")
        .update({
          status: "failed",
          error_message: loader_error.message,
        })
        .eq("id", run?.id)

      return NextResponse.json({ error: `Loader failed: ${loader_error.message}`, request_id }, { status: 500 })
    }

    // Validate result
    const validation = validateLoaderResult(result)
    if (!validation.success) {
      await supabase
        .from("loader_runs")
        .update({
          status: "failed",
          error_message: `Invalid loader result: ${validation.error}`,
        })
        .eq("id", run?.id)

      return NextResponse.json(
        { error: "Invalid loader result", validation_errors: validation.error, request_id },
        { status: 500 },
      )
    }

    // Write SPINE entities to database
    const { tasks, notes, conversations, plans } = result.spine

    const [tasks_result, notes_result, convs_result, plans_result] = await Promise.all([
      tasks.length > 0 ? batchUpsertTasks(tasks) : { success: true, written: 0, errors: [] },
      notes.length > 0 ? batchUpsertNotes(notes) : { success: true, written: 0, errors: [] },
      conversations.length > 0 ? batchUpsertConversations(conversations) : { success: true, written: 0, errors: [] },
      plans.length > 0 ? batchUpsertPlans(plans) : { success: true, written: 0, errors: [] },
    ])

    const total_written = tasks_result.written + notes_result.written + convs_result.written + plans_result.written
    const all_errors = [...tasks_result.errors, ...notes_result.errors, ...convs_result.errors, ...plans_result.errors]

    // Update loader run record
    await supabase
      .from("loader_runs")
      .update({
        status: all_errors.length > 0 ? "failed" : "completed",
        pages_fetched: result.audit.pages_fetched,
        items_transformed: result.audit.items_transformed,
        items_deduped: result.audit.items_deduped,
        items_written: total_written,
        warnings: result.audit.warnings,
        duration_ms: result.audit.duration_ms,
        error_message: all_errors.length > 0 ? all_errors.join("; ") : null,
      })
      .eq("id", run?.id)

    // Update integration last_sync
    await supabase
      .from("integrations")
      .update({
        last_sync: new Date().toISOString(),
        error_count: all_errors.length > 0 ? supabase.rpc("increment", { x: 1 }) : 0,
        last_error: all_errors.length > 0 ? all_errors[0] : null,
      })
      .eq("workspace_id", workspace_id)
      .eq("type", source)

    return NextResponse.json({
      success: all_errors.length === 0,
      request_id,
      audit: {
        ...result.audit,
        items_written: total_written,
      },
      errors: all_errors.length > 0 ? all_errors : undefined,
    })
  } catch (error: any) {
    console.error(`[Loader API] Error for source ${source}:`, error)
    return NextResponse.json({ error: error.message, request_id }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { source: string } }) {
  const source = params.source

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get("workspace_id")

    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    // Get latest loader runs for this source
    const { data: runs, error } = await supabase
      .from("loader_runs")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("source", source)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ source, runs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
