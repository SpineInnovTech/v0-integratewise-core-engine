import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

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

    const body = await request.json()
    const userId = userData.user.id

    // Ingest browser tabs to Neutron staging
    if (body.tabs && body.tabs.length > 0) {
      const tabsToInsert = body.tabs.map((tab: any) => ({
        user_id: userId,
        url: tab.url,
        title: tab.title,
        domain: tab.domain,
        visited_at: new Date().toISOString(),
      }))

      await supabase
        .from("neutron_tabs")
        .insert(tabsToInsert)
        .on("afterInsert", () => {})
    }

    // Ingest clipboard snippet
    if (body.clipboard) {
      const snippetHash = crypto.createHash("sha256").update(body.clipboard.snippet_hash).digest("hex")

      await supabase.from("neutron_clipboard").insert([
        {
          user_id: userId,
          type: body.clipboard.type,
          snippet_hash_sha256: snippetHash,
          captured_at: new Date().toISOString(),
        },
      ])
    }

    return NextResponse.json({
      success: true,
      stagedCount: (body.tabs?.length || 0) + (body.clipboard ? 1 : 0),
    })
  } catch (error) {
    console.error("Neutron ingest error:", error)
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 })
  }
}
