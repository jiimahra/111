import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable } from "@workspace/db";
import { sendResetEmail } from "../lib/mailer";

const router: IRouter = Router();

async function generateUniqueSaharaId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = String(Math.floor(100000000 + Math.random() * 900000000));
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.saharaId, id)).limit(1);
    if (existing.length === 0) return id;
  }
  throw new Error("Could not generate unique Sahara ID. Please try again.");
}

const SignupBody = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").trim(),
  phone: z.string().trim().optional(),
  location: z.string().trim().optional(),
});

const LoginBody = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

const ForgotBody = z.object({
  email: z.string().email().toLowerCase().trim(),
});

const ResetBody = z.object({
  email: z.string().email().toLowerCase().trim(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

function publicUser(u: {
  id: string;
  saharaId: string;
  email: string;
  name: string;
  phone: string | null;
  location: string | null;
}) {
  return {
    id: u.id,
    saharaId: u.saharaId,
    email: u.email,
    name: u.name,
    phone: u.phone ?? "",
    location: u.location ?? "",
  };
}

router.post("/auth/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { email, password, name, phone, location } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ error: "Account with this email already exists. Please login." });
  }

  const saharaId = await generateUniqueSaharaId();
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ saharaId, email, passwordHash, name, phone: phone ?? null, location: location ?? null })
    .returning();

  return res.json({ user: publicUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password format" });
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    return res.status(401).json({ error: "No account found with this email. Please sign up first." });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Wrong password. Try again or use Forgot Password." });
  }

  return res.json({ user: publicUser(user) });
});

router.post("/auth/forgot-password", async (req, res) => {
  const parsed = ForgotBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please enter a valid email" });
  }
  const { email } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    return res.status(404).json({ error: "No account found with this email." });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await db
    .update(usersTable)
    .set({ resetCode: code, resetCodeExpiresAt: expires })
    .where(eq(usersTable.id, user.id));

  try {
    await sendResetEmail({ to: email, name: user.name, code });
  } catch (err) {
    req.log.error({ err }, "Failed to send reset email");
    return res.status(502).json({ error: "Could not send reset email. Please try again." });
  }

  return res.json({ ok: true, message: "Reset code sent to your email." });
});

router.post("/auth/reset-password", async (req, res) => {
  const parsed = ResetBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input. Code must be 6 digits, password 6+ chars." });
  }
  const { email, code, newPassword } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.resetCode || !user.resetCodeExpiresAt) {
    return res.status(400).json({ error: "No active reset request. Please use Forgot Password again." });
  }
  if (user.resetCode !== code) {
    return res.status(400).json({ error: "Wrong reset code." });
  }
  if (user.resetCodeExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: "Reset code expired. Please request a new one." });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(usersTable)
    .set({ passwordHash, resetCode: null, resetCodeExpiresAt: null })
    .where(eq(usersTable.id, user.id));

  return res.json({ user: publicUser(user) });
});

export default router;
