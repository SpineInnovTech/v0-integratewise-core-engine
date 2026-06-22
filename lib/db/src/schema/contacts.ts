import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

// Contact = a person at a client company.
export const contactsTable = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  linkedinUrl: text("linkedin_url"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Contact = typeof contactsTable.$inferSelect;
export type InsertContact = typeof contactsTable.$inferInsert;
