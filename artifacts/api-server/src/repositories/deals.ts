import { desc, eq } from "drizzle-orm";
import { db, dealsTable, type Deal } from "@workspace/db";

export async function findAll(): Promise<Deal[]> {
  return db.select().from(dealsTable).orderBy(desc(dealsTable.createdAt));
}

export async function findByLeadId(leadId: string): Promise<Deal | undefined> {
  const [deal] = await db
    .select()
    .from(dealsTable)
    .where(eq(dealsTable.leadId, leadId));
  return deal;
}
