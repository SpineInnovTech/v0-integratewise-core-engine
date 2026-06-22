import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

// Client = a customer company IntegrateWise serves.
export const clientsTable = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  industry: text("industry"),
  website: text("website"),
  // active | prospect | onboarding | churned
  status: text("status").notNull().default("active"),
  healthScore: integer("health_score").notNull().default(80),
  mrrCents: integer("mrr_cents").notNull().default(0),
  owner: text("owner"),
  tags: text("tags").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Client = typeof clientsTable.$inferSelect;
export type InsertClient = typeof clientsTable.$inferInsert;
