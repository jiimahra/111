import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable } from "@workspace/db";
import { sendResetEmail } from "../lib/mailer";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

// One-time tokens after Google OAuth callback (5 min expiry)
const pendingGoogleTokens = new Map<string, { user: ReturnType<typeof publicUser>; expires: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pendingGoogleTokens.entries()) {
    if (v.expires < now) pendingGoogleTokens.delete(k);
  }
}, 60_000);

function getAppBaseUrl(): string {
  const domains = (process.env.REPLIT_DOMAINS ?? "").split(",").filter(Boolean);
  return domains.length > 0 ? `https://${domains[0]}` : "https://saharaapphelp.com";
}

const GoogleBody = z.object({
  accessToken: z.string().min(1),
});

async function getGoogleUserInfo(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google user info");
  return res.json() as Promise<{ id: string; email: string; name: string; picture?: string }>;
}

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

// ─── Backend Google OAuth flow ───────────────────────────────────────────────

router.get("/auth/google/start", (req, res) => {
  const mode = req.query.mode === "signup" ? "signup" : "login";
  const appBase = getAppBaseUrl();
  const redirectUri = `${appBase}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: mode,
    access_type: "online",
    prompt: "select_account",
  });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const mode = req.query.state === "signup" ? "signup" : "login";
  const appBase = getAppBaseUrl();
  const redirectUri = `${appBase}/api/auth/google/callback`;

  if (!code) return res.redirect(`${appBase}?g_error=cancelled`);

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      req.log.error({ tokenData }, "Google token exchange failed");
      return res.redirect(`${appBase}?g_error=token_failed`);
    }

    const googleUser = await getGoogleUserInfo(tokenData.access_token);
    const email = googleUser.email.toLowerCase().trim();

    let user;
    if (mode === "login") {
      const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (!existing) return res.redirect(`${appBase}?g_error=no_account`);
      user = existing;
    } else {
      const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (existing) {
        user = existing;
      } else {
        const saharaId = await generateUniqueSaharaId();
        const randomPass = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const passwordHash = await bcrypt.hash(randomPass, 10);
        const [newUser] = await db
          .insert(usersTable)
          .values({ saharaId, email, passwordHash, name: googleUser.name, phone: null, location: null })
          .returning();
        user = newUser;
      }
    }

    const token = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    pendingGoogleTokens.set(token, { user: publicUser(user), expires: Date.now() + 5 * 60 * 1000 });
    return res.redirect(`${appBase}?g_token=${token}`);
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback error");
    return res.redirect(`${appBase}?g_error=server_error`);
  }
});

router.get("/auth/google/verify", (req, res) => {
  const token = req.query.token as string | undefined;
  if (!token) return res.status(400).json({ error: "Token required" });
  const entry = pendingGoogleTokens.get(token);
  if (!entry || entry.expires < Date.now()) {
    if (entry) pendingGoogleTokens.delete(token);
    return res.status(410).json({ error: "Token expired. Please try Google login again." });
  }
  pendingGoogleTokens.delete(token);
  return res.json({ user: entry.user });
});

// ─── Legacy access-token based endpoints (kept for compatibility) ─────────────

router.post("/auth/google", async (req, res) => {
  const parsed = GoogleBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }
  let googleUser: { id: string; email: string; name: string };
  try {
    googleUser = await getGoogleUserInfo(parsed.data.accessToken);
  } catch {
    return res.status(401).json({ error: "Invalid Google token. Please try again." });
  }

  const email = googleUser.email.toLowerCase().trim();
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!existing) {
    return res.status(404).json({ error: "no_account", message: "Koi account nahi mila is Google email se. Pehle Sign Up karein." });
  }

  return res.json({ user: publicUser(existing) });
});

router.post("/auth/google-signup", async (req, res) => {
  const parsed = GoogleBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }
  let googleUser: { id: string; email: string; name: string };
  try {
    googleUser = await getGoogleUserInfo(parsed.data.accessToken);
  } catch {
    return res.status(401).json({ error: "Invalid Google token. Please try again." });
  }

  const email = googleUser.email.toLowerCase().trim();
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    return res.json({ user: publicUser(existing) });
  }

  const saharaId = await generateUniqueSaharaId();
  const randomPass = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const passwordHash = await bcrypt.hash(randomPass, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ saharaId, email, passwordHash, name: googleUser.name, phone: null, location: null })
    .returning();
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
