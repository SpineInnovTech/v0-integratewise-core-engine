import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// HubSpot webhook handler - sync contacts, deals, companies
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as any[]
    const supabase = await createServerClient()

    for (const event of payload) {
      const objectType = event.objectType // contact, deal, company
      const eventType = event.subscriptionType // contact.creation, deal.propertyChange

      if (objectType === "contact" && eventType.includes("creation")) {
        // Sync contact to leads table
        const properties = event.properties || {}
        await supabase.from("leads").insert({
          name: `${properties.firstname || ""} ${properties.lastname || ""}`.trim(),
          email: properties.email,
          phone: properties.phone,
          company: properties.company,
          title: properties.jobtitle,
          source: "hubspot",
          hubspot_id: event.objectId?.toString(),
          metadata: { raw_properties: properties },
        })
      } else if (objectType === "deal") {
        // Sync deal to opportunities table
        const properties = event.properties || {}
        await supabase.from("opportunities").upsert(
          {
            name: properties.dealname,
            value: Number.parseFloat(properties.amount || "0"),
            stage: properties.dealstage,
            hubspot_deal_id: event.objectId?.toString(),
            metadata: { raw_properties: properties },
          },
          { onConflict: "hubspot_deal_id" },
        )
      } else if (objectType === "company") {
        // Sync company to clients table
        const properties = event.properties || {}
        await supabase.from("clients").upsert(
          {
            company: properties.name,
            website: properties.domain,
            industry: properties.industry,
            hubspot_id: event.objectId?.toString(),
            metadata: { raw_properties: properties },
          },
          { onConflict: "hubspot_id" },
        )
      }

      // Log webhook event
      await supabase.from("webhooks").insert({
        provider: "hubspot",
        event_type: eventType,
        event_id: event.objectId?.toString(),
        payload: event,
        signature_valid: true,
      })
    }

    return NextResponse.json({ success: true, processed: payload.length })
  } catch (error) {
    console.error("HubSpot webhook error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
