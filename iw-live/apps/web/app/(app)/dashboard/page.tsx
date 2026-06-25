import { getSession } from "@/lib/clerk-auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const isAdmin =
    session.user.email === "nirmal@integratewise.com" ||
    session.user.email === "admin@integratewise.com" ||
    session.user.email === "demo@integratewise.online"

  if (isAdmin) {
    redirect("/command-center")
  }

  redirect("/insights")
}
