import { desc, eq } from "drizzle-orm";
import { db, tasksTable, type Task } from "@workspace/db";

export async function findByLeadId(leadId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.leadId, leadId))
    .orderBy(desc(tasksTable.createdAt));
}
