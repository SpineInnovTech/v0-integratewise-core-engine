import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Full HubSpot Sync - bidirectional sync of contacts, deals, companies
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  // Create sync log entry
  const { data: syncLog } = await supabase
    .from("hubspot_sync_log")
    .insert({
      sync_type: "full",
      direction: "inbound",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  try {
    // In production, this would call HubSpot API
    // For now, we simulate the sync process

    let totalProcessed = 0
    let totalCreated = 0
    let totalUpdated = 0

    // Sync Contacts to Leads
    const { data: existingLeads } = await supabase.from("leads").select("hubspot_id")
    const existingHubspotIds = new Set(existingLeads?.map((l) => l.hubspot_id).filter(Boolean))

    // Simulate HubSpot contacts data
    const hubspotContacts = [
      { id: "hs_1001", firstname: "New", lastname: "Contact", email: "new@example.com", company: "Example Corp" },
      { id: "hs_1002", firstname: "Another", lastname: "Lead", email: "another@test.com", company: "Test Inc" },
    ]

    for (const contact of hubspotContacts) {
      if (existingHubspotIds.has(contact.id)) {
        // Update existing
        await supabase
          .from("leads")
          .update({
            name: `${contact.firstname} ${contact.lastname}`,
            email: contact.email,
            company: contact.company,
            updated_at: new Date().toISOString(),
          })
          .eq("hubspot_id", contact.id)
        totalUpdated++
      } else {
        // Create new
        await supabase.from("leads").insert({
          name: `${contact.firstname} ${contact.lastname}`,
          email: contact.email,
          company: contact.company,
          source: "hubspot",
          hubspot_id: contact.id,
        })
        totalCreated++
      }
      totalProcessed++
    }

    // Sync form submissions to leads
    const { data: formSubmissions } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("synced_to_hubspot", false)
      .limit(100)

    if (formSubmissions && formSubmissions.length > 0) {
      for (const submission of formSubmissions) {
        // In production, push to HubSpot API here
        await supabase
          .from("form_submissions")
          .update({
            synced_to_hubspot: true,
          })
          .eq("id", submission.id)
        totalProcessed++
      }

      // Log outbound sync
      await supabase.from("hubspot_sync_log").insert({
        sync_type: "forms",
        direction: "outbound",
        status: "completed",
        records_processed: formSubmissions.length,
        records_created: formSubmissions.length,
        completed_at: new Date().toISOString(),
      })
    }

    // Update conversion funnel based on lead stage changes
    const { data: qualifiedLeads } = await supabase
      .from("leads")
      .select("id, status, hubspot_id")
      .in("status", ["qualified", "converted"])

    if (qualifiedLeads) {
      for (const lead of qualifiedLeads) {
        // Check if funnel entry exists
        const { data: existingFunnel } = await supabase
          .from("conversion_funnel")
          .select("id")
          .eq("lead_id", lead.id)
          .single()

        if (!existingFunnel) {
          await supabase.from("conversion_funnel").insert({
            visitor_id: `lead_${lead.id}`,
            stage: lead.status === "converted" ? "sql" : "mql",
            lead_id: lead.id,
            source: "hubspot",
          })
        }
      }
    }

    // Update sync log with results
    await supabase
      .from("hubspot_sync_log")
      .update({
        status: "completed",
        records_processed: totalProcessed,
        records_created: totalCreated,
        records_updated: totalUpdated,
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncLog?.id)

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      created: totalCreated,
      updated: totalUpdated,
    })
  } catch (error) {
    // Update sync log with error
    await supabase
      .from("hubspot_sync_log")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncLog?.id)

    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createServerClient()

  // Get latest sync status
  const { data: latestSyncs } = await supabase
    .from("hubspot_sync_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  // Get sync stats
  const { data: stats } = await supabase
    .from("hubspot_sync_log")
    .select("sync_type, records_processed, records_created, records_updated")
    .eq("status", "completed")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const totals = stats?.reduce(
    (acc, s) => ({
      processed: acc.processed + (s.records_processed || 0),
      created: acc.created + (s.records_created || 0),
      updated: acc.updated + (s.records_updated || 0),
    }),
    { processed: 0, created: 0, updated: 0 },
  )

  return NextResponse.json({
    latestSyncs,
    last24Hours: totals,
  })
}
