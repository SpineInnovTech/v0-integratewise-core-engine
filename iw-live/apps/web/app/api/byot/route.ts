import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// BYOT - Bring Your Own Templates API
// Allows Pro+ users to upload and manage custom templates

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

  const { data: templates } = await supabase
    .from("user_templates")
    .select("id, name, description, template_type, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ templates: templates || [] })
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
  const { name, description, templateType, content } = body

  if (!name || !templateType || !content) {
    return NextResponse.json({ error: "Name, type, and content required" }, { status: 400 })
  }

  const validTypes = ["n8n_workflow", "prompt_template", "report_template", "email_sequence"]
  if (!validTypes.includes(templateType)) {
    return NextResponse.json({ error: "Invalid template type" }, { status: 400 })
  }

  // Validate content based on type
  if (templateType === "n8n_workflow") {
    try {
      const parsed = JSON.parse(content)
      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        return NextResponse.json({ error: "Invalid n8n workflow format" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON content" }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from("user_templates")
    .insert({
      user_id: user.id,
      name,
      description,
      template_type: templateType,
      content,
    })
    .select("id")
    .single()

  if (error) {
    console.error("BYOT insert error:", error)
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data.id })
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
  const templateId = searchParams.get("id")

  if (!templateId) {
    return NextResponse.json({ error: "Template ID required" }, { status: 400 })
  }

  const { error } = await supabase.from("user_templates").delete().eq("id", templateId).eq("user_id", user.id) // Ensure user owns the template

  if (error) {
    console.error("BYOT delete error:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
