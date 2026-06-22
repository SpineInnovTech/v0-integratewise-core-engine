import { pgTable, uuid, text, integer, date, timestamp } from "drizzle-orm/pg-core";

// Project = a delivery engagement for a client.
export const projectsTable = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  clientId: uuid("client_id"),
  dealId: uuid("deal_id"),
  // planning | active | on_hold | completed
  status: text("status").notNull().default("active"),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  progress: integer("progress").notNull().default(0),
  owner: text("owner"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Project = typeof projectsTable.$inferSelect;
export type InsertProject = typeof projectsTable.$inferInsert;
