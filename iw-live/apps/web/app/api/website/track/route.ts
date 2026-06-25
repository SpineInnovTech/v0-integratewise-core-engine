import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Website visitor tracking endpoint
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      event_type, // pageview, form_submit, conversion
      visitor_id,
      session_id,
      page_slug,
      form_id,
      form_data,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      time_on_page,
      scroll_depth,
    } = body

    // Get or create visitor
    let { data: visitor } = await supabase.from("website_visitors").select("*").eq("visitor_id", visitor_id).single()

    if (!visitor) {
      const { data: newVisitor } = await supabase
        .from("website_visitors")
        .insert({
          visitor_id,
          first_utm_source: utm_source,
          first_referrer: referrer,
          country: request.headers.get("cf-ipcountry") || "Unknown",
        })
        .select()
        .single()
      visitor = newVisitor
    } else {
      // Update visitor stats
      await supabase
        .from("website_visitors")
        .update({
          last_visit: new Date().toISOString(),
          total_visits: (visitor.total_visits || 0) + 1,
          total_pageviews: (visitor.total_pageviews || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", visitor.id)
    }

    // Handle page view
    if (event_type === "pageview" && page_slug) {
      // Get page
      const { data: page } = await supabase.from("website_pages").select("id").eq("slug", page_slug).single()

      if (page) {
        // Record page view
        await supabase.from("page_views").insert({
          page_id: page.id,
          visitor_id,
          session_id,
          referrer,
          utm_source,
          utm_medium,
          utm_campaign,
          time_on_page: time_on_page || 0,
          scroll_depth: scroll_depth || 0,
        })

        // Update page stats
        await supabase
          .from("website_pages")
          .update({
            views: supabase.rpc("increment", { x: 1 }),
          })
          .eq("id", page.id)
      }
    }

    // Handle form submission
    if (event_type === "form_submit" && form_id && form_data) {
      // Get form
      const { data: form } = await supabase
        .from("website_forms")
        .select("id, form_type, connected_to")
        .eq("id", form_id)
        .single()

      if (form) {
        // Create form submission
        const { data: submission } = await supabase
          .from("form_submissions")
          .insert({
            form_id: form.id,
            visitor_id,
            session_id,
            data: form_data,
            source: utm_source,
            utm_source,
            utm_medium,
            utm_campaign,
            utm_content,
            referrer,
          })
          .select()
          .single()

        // Update form stats
        await supabase
          .from("website_forms")
          .update({
            submissions_count: supabase.rpc("increment", { x: 1 }),
          })
          .eq("id", form.id)

        // Create lead if contact form
        if (form.form_type === "contact" || form.form_type === "consultation" || form.form_type === "quote") {
          const { data: lead } = await supabase
            .from("leads")
            .insert({
              name: form_data.name,
              email: form_data.email,
              phone: form_data.phone,
              company: form_data.company,
              source: "website",
              source_detail: page_slug,
              notes: form_data.message || form_data.challenge,
            })
            .select()
            .single()

          // Link submission to lead
          if (lead) {
            await supabase.from("form_submissions").update({ lead_id: lead.id }).eq("id", submission?.id)

            // Update visitor with lead
            await supabase
              .from("website_visitors")
              .update({
                lead_id: lead.id,
                email: form_data.email,
                name: form_data.name,
                company: form_data.company,
                lifecycle_stage: "lead",
              })
              .eq("visitor_id", visitor_id)

            // Add to conversion funnel
            await supabase.from("conversion_funnel").insert({
              visitor_id,
              stage: "lead",
              previous_stage: "form_submit",
              lead_id: lead.id,
              source: utm_source,
              campaign: utm_campaign,
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Tracking error:", error)
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 })
  }
}
