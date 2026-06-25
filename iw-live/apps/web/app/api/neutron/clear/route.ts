import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
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
            } catch {}
          },
        },
      },
    )

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = userData.user.id

    // Clear all staged neutron data for user
    await supabase.from("neutron_tabs").delete().eq("user_id", userId)
    await supabase.from("neutron_clipboard").delete().eq("user_id", userId)
    await supabase.from("neutron_downloads").delete().eq("user_id", userId)
    await supabase.from("neutron_storage").delete().eq("user_id", userId)

    return NextResponse.json({ success: true, cleared: true })
  } catch (error) {
    console.error("Neutron clear error:", error)
    return NextResponse.json({ error: "Clear failed" }, { status: 500 })
  }
}
