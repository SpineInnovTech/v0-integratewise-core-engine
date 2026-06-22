import { desc, eq } from "drizzle-orm";
import { db, clientsTable, type Client } from "@workspace/db";

export async function findAll(): Promise<Client[]> {
  return db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt));
}

export async function findById(id: string): Promise<Client | undefined> {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, id));
  return client;
}
