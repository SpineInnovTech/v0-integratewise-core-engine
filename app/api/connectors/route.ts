import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  // Get current user (demo mode fallback)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id || "00000000-0000-0000-0000-000000000000"

  const { data, error } = await supabase.from("connectors").select("*").eq("user_id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
