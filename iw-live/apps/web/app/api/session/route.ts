import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

/**
 * GET /api/session
 * Returns current session state including auth, org, workspace, and onboarding status
 */
export async function GET() {
  try {
    const cookieStore = await cookies()

    // Check for demo mode first
    const isDemoMode = cookieStore.get("demo_session")?.value === "true"

    if (isDemoMode) {
      return NextResponse.json({
        authenticated: true,
        userId: "demo-user-123",
        email: "demo@integratewise.com",
        firstTime: false,
        orgId: "demo-org-123",
        workspaceId: "demo-workspace-123",
        role: "admin",
        mode: "demo",
      })
    }

    // Real auth check via Supabase
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json({ authenticated: false, error: "Supabase not configured" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          userId: null,
          firstTime: null,
          orgId: null,
          workspaceId: null,
        },
        { status: 401 },
      )
    }

    // Check if user has org/workspace
    const { data: userRole } = await supabase.from("user_roles").select("org_id, role").eq("user_id", user.id).single()

    const orgId = userRole?.org_id ?? null
    let workspaceId = null
    let firstTime = true

    if (orgId) {
      // Get workspace
      const { data: workspace } = await supabase.from("workspaces").select("id").eq("org_id", orgId).limit(1).single()

      workspaceId = workspace?.id ?? null

      // Check onboarding state
      const { data: onboarding } = await supabase
        .from("onboarding_state")
        .select("completed")
        .eq("user_id", user.id)
        .eq("org_id", orgId)
        .single()

      firstTime = !onboarding?.completed
    }

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      email: user.email,
      firstTime,
      orgId,
      workspaceId,
      role: userRole?.role ?? "member",
      mode: "authenticated",
    })
  } catch (error) {
    console.error("[api/session] Error:", error)
    return NextResponse.json(
      {
        authenticated: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
