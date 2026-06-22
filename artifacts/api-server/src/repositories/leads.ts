import { desc, eq } from "drizzle-orm";
import { db, leadsTable, type InsertLead, type Lead } from "@workspace/db";

export async function findAll(): Promise<Lead[]> {
  return db
    .select()
    .from(leadsTable)
    .orderBy(desc(leadsTable.score), desc(leadsTable.createdAt));
}

export async function findById(id: string): Promise<Lead | undefined> {
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
  return lead;
}

export async function create(values: InsertLead): Promise<Lead> {
  const [lead] = await db.insert(leadsTable).values(values).returning();
  return lead;
}

export async function update(
  id: string,
  values: Partial<InsertLead>,
): Promise<Lead | undefined> {
  const [lead] = await db
    .update(leadsTable)
    .set(values)
    .where(eq(leadsTable.id, id))
    .returning();
  return lead;
}
