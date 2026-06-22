import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-auth"
import { AdminDashboardView } from "@/components/views/admin-dashboard-view"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin")
  }

  const isAdminUser = await isAdmin(user.email!)

  if (!isAdminUser) {
    redirect("/?error=unauthorized")
  }

  return <AdminDashboardView userEmail={user.email!} />
}
