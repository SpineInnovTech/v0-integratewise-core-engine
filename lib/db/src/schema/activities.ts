import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

// Activity = a timeline event / interaction, polymorphically linked to entities.
export const activitiesTable = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  // note | email | call | meeting | status_change | task | system
  type: text("type").notNull().default("note"),
  summary: text("summary").notNull(),
  body: text("body"),
  actor: text("actor"),
  leadId: uuid("lead_id"),
  dealId: uuid("deal_id"),
  clientId: uuid("client_id"),
  contactId: uuid("contact_id"),
  projectId: uuid("project_id"),
  sessionId: uuid("session_id"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Activity = typeof activitiesTable.$inferSelect;
export type InsertActivity = typeof activitiesTable.$inferInsert;
