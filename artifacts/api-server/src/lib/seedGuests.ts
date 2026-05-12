import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logger } from "./logger";

const GUEST_ACCOUNTS = [
  { name: "Rahul Sharma",  email: "guest1@saharatest.in", password: "sahara123", location: "Delhi" },
  { name: "Priya Singh",   email: "guest2@saharatest.in", password: "sahara123", location: "Mumbai" },
  { name: "Amit Kumar",    email: "guest3@saharatest.in", password: "sahara123", location: "Jaipur" },
  { name: "Sunita Devi",   email: "guest4@saharatest.in", password: "sahara123", location: "Lucknow" },
];

async function generateUniqueSaharaId(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const id = String(Math.floor(100000000 + Math.random() * 900000000));
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.saharaId, id)).limit(1);
    if (existing.length === 0) return id;
  }
  throw new Error("Could not generate unique Sahara ID");
}

export async function seedGuestAccounts(): Promise<void> {
  for (const g of GUEST_ACCOUNTS) {
    try {
      const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, g.email)).limit(1);
      if (existing) continue;

      const saharaId = await generateUniqueSaharaId();
      const passwordHash = await bcrypt.hash(g.password, 10);
      await db.insert(usersTable).values({
        saharaId,
        email: g.email,
        passwordHash,
        name: g.name,
        location: g.location,
        phone: null,
      });
      logger.info({ email: g.email }, "Guest account created");
    } catch (err) {
      logger.error({ err, email: g.email }, "Failed to seed guest account");
    }
  }
}
