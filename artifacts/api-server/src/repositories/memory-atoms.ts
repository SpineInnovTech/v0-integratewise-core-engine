import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  memoryAtomsTable,
  type InsertMemoryAtomRow,
  type MemoryAtomRow,
} from "@workspace/db";

/**
 * Insert a memory atom idempotently. Re-ingesting the same source fact deepens
 * coverage WITHOUT duplicating: a conflict on idempotency_key short-circuits and
 * returns the existing row (created=false). This is what lets the contextual
 * memory compound rather than inflate.
 */
export async function insertAtomIdempotent(
  values: InsertMemoryAtomRow,
): Promise<{ row: MemoryAtomRow; created: boolean }> {
  const [inserted] = await db
    .insert(memoryAtomsTable)
    .values(values)
    .onConflictDoNothing({ target: memoryAtomsTable.idempotencyKey })
    .returning();
  if (inserted) return { row: inserted, created: true };
  const [existing] = await db
    .select()
    .from(memoryAtomsTable)
    .where(eq(memoryAtomsTable.idempotencyKey, values.idempotencyKey));
  return { row: existing, created: false };
}

export async function recentBySubject(
  tenantId: string,
  subjectType: string,
  subjectId: string,
  limit = 100,
): Promise<MemoryAtomRow[]> {
  return db
    .select()
    .from(memoryAtomsTable)
    .where(
      and(
        eq(memoryAtomsTable.tenantId, tenantId),
        eq(memoryAtomsTable.subjectType, subjectType),
        eq(memoryAtomsTable.subjectId, subjectId),
      ),
    )
    .orderBy(desc(memoryAtomsTable.salience), desc(memoryAtomsTable.createdAt))
    .limit(limit);
}

/** Coverage signal: how many atoms exist per kind for a subject. */
export async function countByKind(
  tenantId: string,
  subjectType: string,
  subjectId: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select({
      kind: memoryAtomsTable.kind,
      count: sql<number>`count(*)::int`,
    })
    .from(memoryAtomsTable)
    .where(
      and(
        eq(memoryAtomsTable.tenantId, tenantId),
        eq(memoryAtomsTable.subjectType, subjectType),
        eq(memoryAtomsTable.subjectId, subjectId),
      ),
    )
    .groupBy(memoryAtomsTable.kind);
  return Object.fromEntries(rows.map((r) => [r.kind, Number(r.count)]));
}

/** Total atoms for a tenant (used by the coverage meter). */
export async function countForTenant(tenantId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memoryAtomsTable)
    .where(eq(memoryAtomsTable.tenantId, tenantId));
  return Number(row?.count ?? 0);
}
