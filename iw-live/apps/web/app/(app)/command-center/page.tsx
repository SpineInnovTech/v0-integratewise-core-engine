import { CommandCenter } from "@/components/command-center"
import { getSession } from "@/lib/clerk-auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function CommandCenterPage() {
  const session = await getSession()

  // Only Nirmal (admin) can access Command Center
  // Others should go through standard onboarding
  if (!session) {
    redirect("/auth/login")
  }

  // Check if user is Nirmal (admin)
  const isAdmin =
    session.user.email === "nirmal@integratewise.com" ||
    session.user.email === "admin@integratewise.com" ||
    session.user.email === "demo@integratewise.online"

  if (!isAdmin) {
    // Regular users go to insights/dashboard
    redirect("/insights")
  }

  return <CommandCenter />
}
