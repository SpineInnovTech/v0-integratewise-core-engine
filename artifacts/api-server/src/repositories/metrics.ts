import { and, eq } from "drizzle-orm";
import {
  db,
  spineMetricsTable,
  spineGoalsTable,
  type InsertSpineMetricRow,
  type SpineMetricRow,
  type SpineGoalRow,
} from "@workspace/db";

export async function listMetrics(tenantId: string): Promise<SpineMetricRow[]> {
  return db
    .select()
    .from(spineMetricsTable)
    .where(eq(spineMetricsTable.tenantId, tenantId));
}

export async function listMetricsByDomain(
  tenantId: string,
  domain: string,
): Promise<SpineMetricRow[]> {
  return db
    .select()
    .from(spineMetricsTable)
    .where(
      and(
        eq(spineMetricsTable.tenantId, tenantId),
        eq(spineMetricsTable.domain, domain),
      ),
    );
}

export type MetricWithGoal = SpineMetricRow & { goal: SpineGoalRow | null };

/** Metrics joined to their anchoring goal (R1 guarantees the goal exists). */
export async function listMetricsWithGoals(
  tenantId: string,
): Promise<MetricWithGoal[]> {
  const rows = await db
    .select({ metric: spineMetricsTable, goal: spineGoalsTable })
    .from(spineMetricsTable)
    .leftJoin(spineGoalsTable, eq(spineMetricsTable.goalId, spineGoalsTable.id))
    .where(eq(spineMetricsTable.tenantId, tenantId));
  return rows.map((r) => ({ ...r.metric, goal: r.goal }));
}

export async function createMetric(
  values: InsertSpineMetricRow,
): Promise<SpineMetricRow> {
  const [row] = await db.insert(spineMetricsTable).values(values).returning();
  return row;
}
