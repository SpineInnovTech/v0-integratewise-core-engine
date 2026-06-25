import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * POST /api/workspace/bootstrap
 * Idempotently creates org, workspace, user role, and onboarding state for a user
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const orgName = body.orgName || `${user.email?.split("@")[0]}'s Organization`
    const workspaceName = body.workspaceName || "My Workspace"

    // Check if user already has an org
    const { data: existingRole } = await supabase.from("user_roles").select("org_id").eq("user_id", user.id).single()

    let orgId = existingRole?.org_id
    let workspaceId: string | null = null
    let created = false

    if (!orgId) {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: orgName,
          owner_user_id: user.id,
          slug: orgName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .slice(0, 50),
        })
        .select("id")
        .single()

      if (orgError) {
        // Might be a unique constraint violation - try to fetch existing
        const { data: existingOrg } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_user_id", user.id)
          .single()

        if (existingOrg) {
          orgId = existingOrg.id
        } else {
          throw orgError
        }
      } else {
        orgId = org.id
        created = true
      }

      // Create user role (owner)
      await supabase.from("user_roles").upsert(
        {
          user_id: user.id,
          org_id: orgId,
          role: "owner",
        },
        { onConflict: "user_id,org_id" },
      )
    }

    // Check/create workspace
    const { data: existingWorkspace } = await supabase.from("workspaces").select("id").eq("org_id", orgId).single()

    if (existingWorkspace) {
      workspaceId = existingWorkspace.id
    } else {
      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .insert({
          org_id: orgId,
          name: workspaceName,
        })
        .select("id")
        .single()

      if (wsError) {
        // Fetch existing on conflict
        const { data: ws } = await supabase.from("workspaces").select("id").eq("org_id", orgId).single()
        workspaceId = ws?.id ?? null
      } else {
        workspaceId = workspace.id
        created = true
      }
    }

    // Initialize onboarding state
    await supabase.from("onboarding_state").upsert(
      {
        user_id: user.id,
        org_id: orgId,
        step: "welcome",
        completed: false,
      },
      { onConflict: "user_id,org_id" },
    )

    // Seed default templates if new org
    if (created) {
      const defaultTemplates = [
        { key: "welcome_email", name: "Welcome Email", type: "email", body: "Welcome to {{company}}!" },
        {
          key: "meeting_notes",
          name: "Meeting Notes",
          type: "doc",
          body: "# Meeting Notes\n\n## Attendees\n\n## Agenda\n\n## Action Items",
        },
        {
          key: "ai_summary",
          name: "AI Summary Prompt",
          type: "prompt",
          body: "Summarize the following content in 3 bullet points:",
        },
      ]

      for (const template of defaultTemplates) {
        await supabase.from("templates").upsert(
          {
            org_id: orgId,
            ...template,
          },
          { onConflict: "org_id,key" },
        )
      }
    }

    // Log the bootstrap action
    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      org_id: orgId,
      workspace_id: workspaceId,
      action: created ? "workspace.created" : "workspace.accessed",
      target_type: "workspace",
      target_id: workspaceId,
    })

    return NextResponse.json({
      ok: true,
      orgId,
      workspaceId,
      created,
    })
  } catch (error) {
    console.error("[api/workspace/bootstrap] Error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to bootstrap workspace",
      },
      { status: 500 },
    )
  }
}
