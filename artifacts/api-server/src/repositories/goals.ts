import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  spineGoalsTable,
  type InsertSpineGoalRow,
  type SpineGoalRow,
} from "@workspace/db";

export async function listGoals(tenantId: string): Promise<SpineGoalRow[]> {
  return db
    .select()
    .from(spineGoalsTable)
    .where(eq(spineGoalsTable.tenantId, tenantId));
}

export async function listGoalsByDomain(
  tenantId: string,
  domain: string,
): Promise<SpineGoalRow[]> {
  return db
    .select()
    .from(spineGoalsTable)
    .where(
      and(
        eq(spineGoalsTable.tenantId, tenantId),
        eq(spineGoalsTable.domain, domain),
      ),
    );
}

export async function findGoalsByIds(ids: string[]): Promise<SpineGoalRow[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(spineGoalsTable)
    .where(inArray(spineGoalsTable.id, ids));
}

export async function createGoal(
  values: InsertSpineGoalRow,
): Promise<SpineGoalRow> {
  const [row] = await db.insert(spineGoalsTable).values(values).returning();
  return row;
}
