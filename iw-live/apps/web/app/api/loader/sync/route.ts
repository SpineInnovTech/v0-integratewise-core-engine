/**
 * Sync Scheduler API
 * Endpoint: POST /api/loader/sync
 * Triggers sync across all enabled integrations for a workspace
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLastSync, updateLastSync } from "@/lib/loader-utils"

export async function POST(request: NextRequest) {
  const request_id = crypto.randomUUID()

  try {
    const body = await request.json()
    const { workspace_id, force = false } = body

    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get all active integrations for this workspace
    const { data: integrations, error: int_error } = await supabase
      .from("integrations")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("status", "active")

    if (int_error) {
      return NextResponse.json({ error: int_error.message }, { status: 500 })
    }

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ message: "No active integrations found", integrations: [] })
    }

    // For each integration, trigger sync
    const sync_results = []

    for (const integration of integrations) {
      const source = integration.type
      const since_iso = integration.last_sync || new Date(Date.now() - 3600000).toISOString() // Last hour
      const until_iso = new Date().toISOString()

      try {
        // Call loader API
        const loader_response = await fetch(`${request.url.split("/sync")[0]}/${source}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspace_id,
            auth: integration.credentials_ref ? JSON.parse(integration.credentials_ref) : {},
            fetch_params: {
              since: since_iso,
              until: until_iso,
              page_size: 100,
              max_pages: 10,
            },
          }),
        })

        const loader_result = await loader_response.json()

        sync_results.push({
          source,
          success: loader_result.success,
          audit: loader_result.audit,
          errors: loader_result.errors,
        })
      } catch (sync_error: any) {
        sync_results.push({
          source,
          success: false,
          error: sync_error.message,
        })
      }
    }

    // Aggregate audit summary
    const audit_summary = sync_results.reduce(
      (acc, result) => {
        if (result.audit) {
          acc.pages_fetched += result.audit.pages_fetched || 0
          acc.items_transformed += result.audit.items_transformed || 0
          acc.items_deduped += result.audit.items_deduped || 0
          acc.items_written += result.audit.items_written || 0
          acc.warnings.push(...(result.audit.warnings || []))
        }
        return acc
      },
      {
        pages_fetched: 0,
        items_transformed: 0,
        items_deduped: 0,
        items_written: 0,
        warnings: [] as any[],
      }
    )

    return NextResponse.json({
      success: sync_results.every((r) => r.success),
      request_id,
      integrations_synced: sync_results.length,
      sync_results,
      audit_summary,
    })
  } catch (error: any) {
    console.error(`[Sync API] Error:`, error)
    return NextResponse.json({ error: error.message, request_id }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get("workspace_id")

    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get sync status for all integrations
    const { data: integrations, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("workspace_id", workspace_id)
      .order("last_sync", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      workspace_id,
      integrations: integrations?.map((int) => ({
        type: int.type,
        name: int.name,
        status: int.status,
        last_sync: int.last_sync,
        sync_frequency: int.sync_frequency,
        error_count: int.error_count,
        last_error: int.last_error,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
