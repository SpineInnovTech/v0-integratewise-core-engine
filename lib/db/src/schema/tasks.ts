import { pgTable, uuid, text, date, timestamp } from "drizzle-orm/pg-core";

// Task = an actionable to-do, optionally linked to an entity.
export const tasksTable = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  // todo | in_progress | done
  status: text("status").notNull().default("todo"),
  // low | medium | high | urgent
  priority: text("priority").notNull().default("medium"),
  dueDate: date("due_date", { mode: "string" }),
  assignedTo: text("assigned_to"),
  leadId: uuid("lead_id"),
  dealId: uuid("deal_id"),
  clientId: uuid("client_id"),
  projectId: uuid("project_id"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Task = typeof tasksTable.$inferSelect;
export type InsertTask = typeof tasksTable.$inferInsert;
