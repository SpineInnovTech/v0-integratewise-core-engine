// lib/workspace.ts
// Workspace management utilities

import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { isMockAuthEnabled, MOCK_SESSION } from "@/lib/mock-auth"

export interface Workspace {
  id: string
  org_id: string
  name: string
}

/**
 * Ensure a workspace exists for the user, creating one if needed
 * Returns the workspace or null on failure
 */
export async function ensureWorkspace(userId: string, email: string | undefined): Promise<Workspace | null> {
  try {
    // Demo users get a mock workspace
    if (userId === MOCK_SESSION.user.id || isMockAuthEnabled()) {
      return {
        id: "demo-workspace-001",
        org_id: "demo-org-001",
        name: "Demo Workspace",
      }
    }

    const supabase = createServiceClient() || (await createServerClient())
    if (!supabase) {
      console.warn("[workspace] Supabase client not configured")
      return null
    }

    // Check if user already has a workspace
    const { data: existingRole } = await supabase.from("user_roles").select("org_id").eq("user_id", userId).single()

    if (existingRole?.org_id) {
      // Get existing workspace
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id, org_id, name")
        .eq("org_id", existingRole.org_id)
        .single()

      if (workspace) {
        return workspace as Workspace
      }
    }

    // Create new org and workspace
    const orgName = email ? `${email.split("@")[0]}'s Organization` : "My Organization"
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 50)

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        owner_user_id: userId,
        slug,
      })
      .select("id")
      .single()

    if (orgError) {
      // Try to fetch existing org on conflict
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_user_id", userId)
        .single()

      if (!existingOrg) {
        console.error("[workspace] Failed to create org:", orgError)
        return null
      }

      return ensureWorkspaceForOrg(supabase, existingOrg.id, userId)
    }

    return ensureWorkspaceForOrg(supabase, org.id, userId)
  } catch (error) {
    console.error("[workspace] Error ensuring workspace:", error)
    return null
  }
}

async function ensureWorkspaceForOrg(supabase: any, orgId: string, userId: string): Promise<Workspace | null> {
  // Create user role
  await supabase
    .from("user_roles")
    .upsert({ user_id: userId, org_id: orgId, role: "owner" }, { onConflict: "user_id,org_id" })

  // Check for existing workspace
  const { data: existingWorkspace } = await supabase
    .from("workspaces")
    .select("id, org_id, name")
    .eq("org_id", orgId)
    .single()

  if (existingWorkspace) {
    return existingWorkspace as Workspace
  }

  // Create workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({
      org_id: orgId,
      name: "My Workspace",
    })
    .select("id, org_id, name")
    .single()

  if (wsError) {
    console.error("[workspace] Failed to create workspace:", wsError)
    // Try to fetch on conflict
    const { data: ws } = await supabase.from("workspaces").select("id, org_id, name").eq("org_id", orgId).single()
    return ws as Workspace | null
  }

  // Initialize onboarding state
  await supabase
    .from("onboarding_state")
    .upsert({ user_id: userId, org_id: orgId, step: "welcome", completed: false }, { onConflict: "user_id,org_id" })

  return workspace as Workspace
}
