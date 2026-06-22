import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

// Lead = a prospective contact in the sales funnel.
export const leadsTable = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  company: text("company"),
  jobTitle: text("job_title"),
  email: text("email"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  score: integer("score").notNull().default(0),
  // new | contacted | qualified | unqualified | converted | lost
  status: text("status").notNull().default("new"),
  // linkedin | website | referral | hubspot | event | cold_outreach
  source: text("source").notNull().default("website"),
  tags: text("tags").array(),
  notes: text("notes"),
  owner: text("owner"),
  // Set when the lead is converted into a client / deal.
  clientId: uuid("client_id"),
  convertedDealId: uuid("converted_deal_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Lead = typeof leadsTable.$inferSelect;
export type InsertLead = typeof leadsTable.$inferInsert;
