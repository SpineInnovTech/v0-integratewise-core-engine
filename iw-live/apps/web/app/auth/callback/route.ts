import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { computeNextTarget } from "@/lib/clerk-auth"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Handle OAuth errors
  if (error) {
    console.error("[Auth Callback] OAuth error:", error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
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
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Ignore - this happens in middleware
            }
          },
        },
      },
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("[Auth Callback] Code exchange error:", exchangeError)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
    }

    // Get user to determine redirect target
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Use computeNextTarget to check onboarding state and determine redirect
      const targetUrl = await computeNextTarget(user.id, user.email)
      return NextResponse.redirect(`${origin}${targetUrl}`)
    }

    // Fallback to provided next URL or onboarding
    return NextResponse.redirect(`${origin}${next || "/onboarding"}`)
  }

  // No code - redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
