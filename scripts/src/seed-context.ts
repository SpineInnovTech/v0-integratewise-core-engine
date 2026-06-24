/**
 * Tiny demo seed for the contextual-memory substrate.
 *
 * Seeds a few VENDOR goals (IntegrateWise's own) and metrics anchored to them
 * for the dogfood tenant, so the Contextual Memory surface has an intent anchor
 * to ladder up to. This is intentionally small — NOT a goal/metric template
 * library (that is explicitly deferred). Re-running is idempotent: existing
 * goals/metrics (matched by domain+name) are reused, never duplicated.
 *
 * Run: pnpm --filter @workspace/scripts run seed:context
 */
import { eq } from "drizzle-orm";
import {
  db,
  spineGoalsTable,
  spineMetricsTable,
  type InsertSpineGoalRow,
  type InsertSpineMetricRow,
} from "@workspace/db";

const TENANT = "iw-customer-zero";

type GoalSeed = Omit<InsertSpineGoalRow, "tenantId">;
type MetricSeed = Omit<InsertSpineMetricRow, "tenantId" | "goalId"> & {
  /** matches a seeded goal by domain+name */
  goalKey: string;
};

const GOALS: GoalSeed[] = [
  {
    type: "VENDOR",
    domain: "revenue",
    name: "Grow recurring revenue",
    description: "Build durable, predictable ARR for IntegrateWise.",
    target: { arr_usd: 1_000_000 },
    cadence: "quarterly",
    status: "active",
  },
  {
    type: "VENDOR",
    domain: "sales",
    name: "Convert pipeline efficiently",
    description: "Move qualified leads to closed-won without leakage.",
    target: { win_rate: 0.3 },
    cadence: "monthly",
    status: "active",
  },
  {
    type: "VENDOR",
    domain: "retention",
    name: "Keep customers healthy",
    description: "Retain and expand existing accounts.",
    target: { nrr: 1.1 },
    cadence: "monthly",
    status: "active",
  },
];

const METRICS: MetricSeed[] = [
  {
    name: "ARR",
    domain: "revenue",
    formula: "sum(active_subscription_value)",
    unit: "USD",
    threshold: { min: 1_000_000 },
    cadence: "monthly",
    goalKey: "revenue::Grow recurring revenue",
  },
  {
    name: "Win rate",
    domain: "sales",
    formula: "closed_won / qualified",
    unit: "ratio",
    threshold: { min: 0.3 },
    cadence: "monthly",
    goalKey: "sales::Convert pipeline efficiently",
  },
  {
    name: "Lead response time",
    domain: "sales",
    formula: "avg(first_touch_at - created_at)",
    unit: "hours",
    threshold: { max: 24 },
    cadence: "weekly",
    goalKey: "sales::Convert pipeline efficiently",
  },
  {
    name: "Net revenue retention",
    domain: "retention",
    formula: "(start_arr + expansion - churn) / start_arr",
    unit: "ratio",
    threshold: { min: 1.0 },
    cadence: "monthly",
    goalKey: "retention::Keep customers healthy",
  },
];

const goalKey = (domain: string, name: string) => `${domain}::${name}`;

async function seed(): Promise<void> {
  const existingGoals = await db
    .select()
    .from(spineGoalsTable)
    .where(eq(spineGoalsTable.tenantId, TENANT));

  const goalIdByKey = new Map<string, string>();
  for (const g of existingGoals) goalIdByKey.set(goalKey(g.domain, g.name), g.id);

  let goalsCreated = 0;
  for (const g of GOALS) {
    const key = goalKey(g.domain, g.name);
    if (goalIdByKey.has(key)) continue;
    const [row] = await db
      .insert(spineGoalsTable)
      .values({ ...g, tenantId: TENANT })
      .returning();
    goalIdByKey.set(key, row.id);
    goalsCreated += 1;
  }

  const existingMetrics = await db
    .select()
    .from(spineMetricsTable)
    .where(eq(spineMetricsTable.tenantId, TENANT));
  const metricExists = new Set(
    existingMetrics.map((m) => goalKey(m.domain, m.name)),
  );

  let metricsCreated = 0;
  for (const m of METRICS) {
    const key = goalKey(m.domain, m.name);
    if (metricExists.has(key)) continue;
    const goalId = goalIdByKey.get(m.goalKey);
    if (!goalId) {
      throw new Error(
        `Cannot seed metric "${m.name}": anchoring goal "${m.goalKey}" not found (R1 requires a goal).`,
      );
    }
    const { goalKey: _drop, ...metricValues } = m;
    await db
      .insert(spineMetricsTable)
      .values({ ...metricValues, tenantId: TENANT, goalId });
    metricsCreated += 1;
  }

  console.log(
    `Context seed complete for tenant "${TENANT}": ` +
      `${goalsCreated} goal(s) created (${existingGoals.length} already present), ` +
      `${metricsCreated} metric(s) created (${existingMetrics.length} already present).`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Context seed failed:", err);
    process.exit(1);
  });
