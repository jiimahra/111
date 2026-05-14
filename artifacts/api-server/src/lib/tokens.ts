import { createHmac, timingSafeEqual } from "crypto";

const USER_SECRET =
  process.env.AUTH_TOKEN_SECRET ?? "sahara-user-dev-secret-change-in-prod";

const ADMIN_SECRET =
  process.env.ADMIN_TOKEN_SECRET ?? "sahara-admin-dev-secret-change-in-prod";

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function issueUserToken(
  userId: string,
  expiresInMs = 30 * 24 * 60 * 60 * 1000,
): string {
  const expires = Date.now() + expiresInMs;
  const payload = `${userId}|${expires}`;
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = sign(payload, USER_SECRET);
  return `${encoded}.${sig}`;
}

export function verifyUserToken(token: string): string | null {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx < 0) return null;
    const encoded = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    const payload = Buffer.from(encoded, "base64url").toString();
    const expectedSig = sign(payload, USER_SECRET);
    if (!safeEqual(sig, expectedSig)) return null;
    const parts = payload.split("|");
    if (parts.length < 2) return null;
    const [userId, expiresStr] = parts;
    if (!userId || !expiresStr) return null;
    if (Date.now() > Number(expiresStr)) return null;
    return userId;
  } catch {
    return null;
  }
}

export function issueAdminToken(userId: string): string {
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  const payload = `${userId}|${expires}`;
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = sign(payload, ADMIN_SECRET);
  return `${encoded}.${sig}`;
}

export function verifyAdminToken(token: string): string | null {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx < 0) return null;
    const encoded = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    const payload = Buffer.from(encoded, "base64url").toString();
    const expectedSig = sign(payload, ADMIN_SECRET);
    if (!safeEqual(sig, expectedSig)) return null;
    const parts = payload.split("|");
    if (parts.length < 2) return null;
    const [userId, expiresStr] = parts;
    if (!userId || !expiresStr) return null;
    if (Date.now() > Number(expiresStr)) return null;
    return userId;
  } catch {
    return null;
  }
}
