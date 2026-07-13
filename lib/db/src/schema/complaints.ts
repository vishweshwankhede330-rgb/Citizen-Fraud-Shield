import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const complaintsTable = pgTable("complaints", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  messageText: text("message_text").notNull(),
  riskLevel: text("risk_level").notNull(),
  crimeCategory: text("crime_category"),
  city: text("city"),
  pincode: text("pincode"),
  resultId: text("result_id"),
  phoneNumber: text("phone_number"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Complaint = typeof complaintsTable.$inferSelect;
