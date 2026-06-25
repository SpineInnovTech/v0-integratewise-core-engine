// app/start/page.tsx
// Server component that handles entry point routing
// - If not authenticated → redirect to /auth/login
// - If authenticated → ensure workspace and redirect to /onboarding (first-time) or /dashboard

import { redirect } from "next/navigation"
import { getSession, computeNextTarget } from "@/lib/clerk-auth"
import { ensureWorkspace } from "@/lib/workspace"

export const dynamic = "force-dynamic"

export default async function StartPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const workspace = await ensureWorkspace(session.user.id, session.user.email)

  if (!workspace) {
    // Failed to create workspace - redirect to login with error
    redirect("/auth/login?error=workspace_creation_failed")
  }

  // Determine where to send user based on onboarding state
  const target = await computeNextTarget(session.user.id)
  redirect(target)
}
