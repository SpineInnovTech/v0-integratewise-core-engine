import { desc, eq } from "drizzle-orm";
import {
  db,
  activitiesTable,
  type Activity,
  type InsertActivity,
} from "@workspace/db";

export async function findByLeadId(leadId: string): Promise<Activity[]> {
  return db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.leadId, leadId))
    .orderBy(desc(activitiesTable.occurredAt));
}

export async function create(values: InsertActivity): Promise<Activity> {
  const [activity] = await db
    .insert(activitiesTable)
    .values(values)
    .returning();
  return activity;
}
