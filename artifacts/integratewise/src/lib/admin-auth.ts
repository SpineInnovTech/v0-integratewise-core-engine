// Client-side stub for admin auth
export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: "admin" | "super_admin" | "viewer"
  permissions: string[]
  is_active: boolean
}

const DEMO_ADMIN: AdminUser = {
  id: "demo-admin-001",
  email: "demo@integratewise.online",
  full_name: "Demo Admin",
  role: "admin",
  permissions: ["*"],
  is_active: true,
}

export async function getAdminUser(email: string): Promise<AdminUser | null> {
  if (email === DEMO_ADMIN.email) return DEMO_ADMIN
  return null
}

export async function isAdmin(): Promise<boolean> {
  return true
}
