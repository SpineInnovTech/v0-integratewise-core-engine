import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Handle set cookie errors
          }
        },
      },
    },
  )

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return data.user
}

export async function getUserRole(): Promise<string> {
  const user = await getUser()
  if (!user) return "guest"

  // Get role from user metadata or default based on email
  const role = user.user_metadata?.role || "personal"

  // Check if user is admin
  if (user.email?.includes(process.env.ADMIN_EMAILS || "")) {
    return "admin"
  }

  return role
}
