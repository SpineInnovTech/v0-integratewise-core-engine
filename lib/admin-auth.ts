import { createClient } from "@/lib/supabase/server"

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: "admin" | "super_admin" | "viewer"
  permissions: string[]
  is_active: boolean
}

const ADMIN_EMAILS = ["admin@integratewise.online", "demo@integratewise.online"]

export async function getAdminUser(email: string): Promise<AdminUser | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("admin_users").select("*").eq("email", email).single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: data.role,
    permissions: data.permissions || [],
    is_active: data.is_active,
  }
}

export async function isAdmin(email: string): Promise<boolean> {
  // Check if email is in the admin list
  if (!ADMIN_EMAILS.includes(email)) {
    return false
  }

  const admin = await getAdminUser(email)
  return admin !== null && admin.is_active
}

export async function hasPermission(email: string, permission: string): Promise<boolean> {
  const admin = await getAdminUser(email)

  if (!admin || !admin.is_active) {
    return false
  }

  // Super admins have all permissions
  if (admin.role === "super_admin" || admin.permissions.includes("all")) {
    return true
  }

  return admin.permissions.includes(permission)
}

export async function logAuditEntry(params: {
  userEmail: string
  action: string
  entityType?: string
  entityId?: string
  entityName?: string
  changes?: Record<string, any>
  status: "success" | "failed"
  errorMessage?: string
}) {
  const supabase = await createClient()

  await supabase.from("audit_logs").insert({
    user_email: params.userEmail,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_name: params.entityName,
    changes: params.changes,
    status: params.status,
    error_message: params.errorMessage,
  })
}
