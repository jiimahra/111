import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authUser?: { id: string; isAdmin: boolean; [key: string]: unknown };
    }
  }
}

export function generateApiToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers["x-sahara-token"] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.apiToken, token))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid or expired session. Please login again." });
      return;
    }
    req.authUserId = user.id;
    req.authUser = user;
    next();
  } catch {
    res.status(500).json({ error: "Auth check failed" });
  }
}
