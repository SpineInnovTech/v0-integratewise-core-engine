import { pgTable, uuid, text, integer, date, timestamp } from "drizzle-orm/pg-core";

// Deal = a revenue opportunity in the pipeline.
export const dealsTable = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  clientId: uuid("client_id"),
  leadId: uuid("lead_id"),
  // discovery | proposal | negotiation | won | lost
  stage: text("stage").notNull().default("discovery"),
  valueCents: integer("value_cents").notNull().default(0),
  probability: integer("probability").notNull().default(10),
  closeDate: date("close_date", { mode: "string" }),
  owner: text("owner"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Deal = typeof dealsTable.$inferSelect;
export type InsertDeal = typeof dealsTable.$inferInsert;
