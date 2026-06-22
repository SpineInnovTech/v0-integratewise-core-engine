import { eq } from "drizzle-orm";
import {
  db,
  leadsTable,
  clientsTable,
  dealsTable,
  activitiesTable,
  type Lead,
  type Client,
  type Deal,
} from "@workspace/db";

export interface QualifyInput {
  score?: number;
  note?: string;
}

// Qualifying a lead is a single governed transition: flip status, lift the
// score if the caller did not set one, and record an activity so the timeline
// reflects the human decision.
export async function qualifyLead(
  id: string,
  input: QualifyInput,
): Promise<Lead | undefined> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id));
    if (!existing) return undefined;

    const [lead] = await tx
      .update(leadsTable)
      .set({
        status: "qualified",
        score: input.score ?? Math.max(existing.score, 70),
      })
      .where(eq(leadsTable.id, id))
      .returning();

    await tx.insert(activitiesTable).values({
      type: "status_change",
      summary: "Lead qualified",
      body: input.note ?? null,
      actor: "You",
      leadId: id,
    });

    return lead;
  });
}

export interface ConvertInput {
  clientName?: string;
  dealTitle?: string;
  valueCents?: number;
}

export interface ConvertResult {
  lead: Lead;
  client: Client;
  deal: Deal;
}

// Converting a lead is the CRM's defining execute step: it creates a real
// client and an open deal, links them back onto the lead, and logs the event —
// all atomically so a failure never leaves a half-converted record.
export async function convertLead(
  id: string,
  input: ConvertInput,
): Promise<ConvertResult | undefined> {
  return db.transaction(async (tx) => {
    const [lead] = await tx
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id));
    if (!lead) return undefined;

    // Idempotent: a lead that was already converted returns its existing
    // client and deal instead of creating duplicates.
    if (lead.clientId && lead.convertedDealId) {
      const [client] = await tx
        .select()
        .from(clientsTable)
        .where(eq(clientsTable.id, lead.clientId));
      const [deal] = await tx
        .select()
        .from(dealsTable)
        .where(eq(dealsTable.id, lead.convertedDealId));
      if (client && deal) return { lead, client, deal };
    }

    const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
    const clientName =
      input.clientName?.trim() || lead.company || fullName || "New Client";

    const [client] = await tx
      .insert(clientsTable)
      .values({
        name: clientName,
        status: "onboarding",
        owner: lead.owner ?? null,
      })
      .returning();

    const dealTitle = input.dealTitle?.trim() || `${clientName} — New Deal`;

    const [deal] = await tx
      .insert(dealsTable)
      .values({
        title: dealTitle,
        clientId: client.id,
        leadId: lead.id,
        stage: "discovery",
        valueCents: input.valueCents ?? 0,
        probability: 20,
        owner: lead.owner ?? null,
      })
      .returning();

    const [updatedLead] = await tx
      .update(leadsTable)
      .set({
        status: "converted",
        clientId: client.id,
        convertedDealId: deal.id,
      })
      .where(eq(leadsTable.id, id))
      .returning();

    await tx.insert(activitiesTable).values({
      type: "status_change",
      summary: `Converted to client "${clientName}"`,
      actor: "You",
      leadId: id,
      clientId: client.id,
      dealId: deal.id,
    });

    return { lead: updatedLead, client, deal };
  });
}
