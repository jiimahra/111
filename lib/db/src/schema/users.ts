import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  saharaId: text("sahara_id").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  location: text("location"),
  photoUrl: text("photo_url"),
  resetCode: text("reset_code"),
  resetCodeExpiresAt: timestamp("reset_code_expires_at", { withTimezone: true }),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  isAdmin: boolean("is_admin").notNull().default(false),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
  blockReason: text("block_reason"),
  isHidden: boolean("is_hidden").notNull().default(false),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
