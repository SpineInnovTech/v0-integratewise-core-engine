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

    // Transform domains from neutron_tabs to clients table
    const { data: tabs } = await supabase
      .from("neutron_tabs")
      .select("domain")
      .eq("user_id", userId)
      .order("visited_at", { ascending: false })
      .limit(20)

    if (!tabs || tabs.length === 0) {
      return NextResponse.json({ promoted: 0 })
    }

    const uniqueDomains = [...new Set(tabs.map((t: any) => t.domain))]

    // Check if clients already exist
    const { data: existingClients } = await supabase
      .from("clients")
      .select("website")
      .in(
        "website",
        uniqueDomains.map((d) => `https://${d}`),
      )

    const newDomains = uniqueDomains.filter((d) => !existingClients?.some((c: any) => c.website.includes(d)))

    if (newDomains.length > 0) {
      const clientsToInsert = newDomains.map((domain) => ({
        name: domain,
        website: `https://${domain}`,
        status: "Prospect",
        source: "browser_read",
        created_at: new Date().toISOString(),
      }))

      await supabase.from("clients").insert(clientsToInsert)
    }

    return NextResponse.json({
      promoted: newDomains.length,
      message: `Promoted ${newDomains.length} new clients from browser history`,
    })
  } catch (error) {
    console.error("Neutron promote error:", error)
    return NextResponse.json({ error: "Promotion failed" }, { status: 500 })
  }
}
