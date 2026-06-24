import { and, desc, eq } from "drizzle-orm";
import {
  db,
  schemaPoolTable,
  schemaDeltaEventsTable,
  type SchemaPoolRow,
  type InsertSchemaPoolRow,
  type SchemaDeltaEventRow,
  type InsertSchemaDeltaEventRow,
} from "@workspace/db";

export interface DeltaFilters {
  connectorName?: string;
  entityType?: string;
  lifecycleState?: string;
}

export async function listDeltas(
  filters: DeltaFilters = {},
): Promise<SchemaPoolRow[]> {
  const conds = [];
  if (filters.connectorName)
    conds.push(eq(schemaPoolTable.connectorName, filters.connectorName));
  if (filters.entityType)
    conds.push(eq(schemaPoolTable.entityType, filters.entityType));
  if (filters.lifecycleState)
    conds.push(eq(schemaPoolTable.lifecycleState, filters.lifecycleState));
  return db
    .select()
    .from(schemaPoolTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schemaPoolTable.updatedAt));
}

/** Active deltas only — what the normalizer/registry should actually apply. */
export async function getActiveDeltas(
  connectorName?: string,
): Promise<SchemaPoolRow[]> {
  return listDeltas({ connectorName, lifecycleState: "active" });
}

export async function findDelta(
  connectorName: string,
  entityType: string,
  schemaVersion: string,
): Promise<SchemaPoolRow | undefined> {
  const [row] = await db
    .select()
    .from(schemaPoolTable)
    .where(
      and(
        eq(schemaPoolTable.connectorName, connectorName),
        eq(schemaPoolTable.entityType, entityType),
        eq(schemaPoolTable.schemaVersion, schemaVersion),
      ),
    );
  return row;
}

export async function insertDelta(
  values: InsertSchemaPoolRow,
): Promise<SchemaPoolRow> {
  const [row] = await db.insert(schemaPoolTable).values(values).returning();
  return row;
}

/** Idempotent on (connector_name, entity_type, schema_version). */
export async function upsertDelta(
  values: InsertSchemaPoolRow,
): Promise<SchemaPoolRow> {
  const existing = await findDelta(
    values.connectorName,
    values.entityType,
    values.schemaVersion,
  );
  if (existing) {
    const [row] = await db
      .update(schemaPoolTable)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(schemaPoolTable.id, existing.id))
      .returning();
    return row;
  }
  return insertDelta(values);
}

export async function setLifecycle(
  id: string,
  lifecycleState: string,
): Promise<SchemaPoolRow | undefined> {
  const [row] = await db
    .update(schemaPoolTable)
    .set({ lifecycleState, updatedAt: new Date() })
    .where(eq(schemaPoolTable.id, id))
    .returning();
  return row;
}

export async function recordDeltaEvent(
  values: InsertSchemaDeltaEventRow,
): Promise<SchemaDeltaEventRow> {
  const [row] = await db
    .insert(schemaDeltaEventsTable)
    .values(values)
    .returning();
  return row;
}

export async function listDeltaEvents(
  connectorName?: string,
  entityType?: string,
): Promise<SchemaDeltaEventRow[]> {
  const conds = [];
  if (connectorName)
    conds.push(eq(schemaDeltaEventsTable.connectorName, connectorName));
  if (entityType)
    conds.push(eq(schemaDeltaEventsTable.entityType, entityType));
  return db
    .select()
    .from(schemaDeltaEventsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schemaDeltaEventsTable.createdAt));
}
