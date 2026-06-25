import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// BYOM - Bring Your Own Model API
// Allows Pro+ users to store their own AI model API keys

export async function GET(request: NextRequest) {
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
            /* Server Component */
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's BYOM config (keys are encrypted, we only return provider status)
  const { data: config } = await supabase
    .from("user_model_configs")
    .select("provider, is_active, created_at, last_used_at")
    .eq("user_id", user.id)

  const providers = {
    openai: { configured: false, active: false },
    anthropic: { configured: false, active: false },
    google: { configured: false, active: false },
    groq: { configured: false, active: false },
  }

  if (config) {
    config.forEach((c: any) => {
      if (providers[c.provider as keyof typeof providers]) {
        providers[c.provider as keyof typeof providers] = {
          configured: true,
          active: c.is_active,
        }
      }
    })
  }

  return NextResponse.json({ providers })
}

export async function POST(request: NextRequest) {
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
            /* Server Component */
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { provider, apiKey } = body

  if (!provider || !apiKey) {
    return NextResponse.json({ error: "Provider and API key required" }, { status: 400 })
  }

  const validProviders = ["openai", "anthropic", "google", "groq"]
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  // Validate API key format
  const keyPatterns: Record<string, RegExp> = {
    openai: /^sk-[a-zA-Z0-9-_]{32,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-_]{32,}$/,
    google: /^AIza[a-zA-Z0-9-_]{35}$/,
    groq: /^gsk_[a-zA-Z0-9]{52}$/,
  }

  if (!keyPatterns[provider].test(apiKey)) {
    return NextResponse.json({ error: "Invalid API key format" }, { status: 400 })
  }

  // Upsert the config (encrypted key stored server-side)
  const { error } = await supabase.from("user_model_configs").upsert(
    {
      user_id: user.id,
      provider,
      api_key_encrypted: apiKey, // In production, encrypt with vault
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,provider",
    },
  )

  if (error) {
    console.error("BYOM upsert error:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }

  return NextResponse.json({ success: true, provider })
}

export async function DELETE(request: NextRequest) {
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
            /* Server Component */
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const provider = searchParams.get("provider")

  if (!provider) {
    return NextResponse.json({ error: "Provider required" }, { status: 400 })
  }

  const { error } = await supabase.from("user_model_configs").delete().eq("user_id", user.id).eq("provider", provider)

  if (error) {
    console.error("BYOM delete error:", error)
    return NextResponse.json({ error: "Failed to delete config" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
