import { and, desc, eq } from "drizzle-orm";
import {
  db,
  spineProposalsTable,
  type SpineProposalRow,
  type InsertSpineProposalRow,
} from "@workspace/db";

export async function findByIdempotencyKey(
  key: string,
): Promise<SpineProposalRow | undefined> {
  const [row] = await db
    .select()
    .from(spineProposalsTable)
    .where(eq(spineProposalsTable.idempotencyKey, key));
  return row;
}

export async function insertProposal(
  values: InsertSpineProposalRow,
): Promise<SpineProposalRow> {
  const [row] = await db
    .insert(spineProposalsTable)
    .values(values)
    .returning();
  return row!;
}

export async function updateProposalStatus(
  id: string,
  status: string,
  spineResponse?: Record<string, unknown>,
): Promise<SpineProposalRow | undefined> {
  const [row] = await db
    .update(spineProposalsTable)
    .set({
      status,
      ...(spineResponse ? { spineResponse } : {}),
      updatedAt: new Date(),
    })
    .where(eq(spineProposalsTable.id, id))
    .returning();
  return row;
}

export async function listProposalsByEntity(
  entityType: string,
  externalId: string,
): Promise<SpineProposalRow[]> {
  return db
    .select()
    .from(spineProposalsTable)
    .where(
      and(
        eq(spineProposalsTable.entityType, entityType),
        eq(spineProposalsTable.externalId, externalId),
      ),
    )
    .orderBy(desc(spineProposalsTable.createdAt));
}
