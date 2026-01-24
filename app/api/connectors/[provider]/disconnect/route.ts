import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const supabase = await createClient()

  // Get current user (demo mode fallback)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id || "00000000-0000-0000-0000-000000000000"

  const { error } = await supabase
    .from("connectors")
    .update({
      status: "disconnected",
      access_token: null,
      refresh_token: null,
      expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", provider)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
