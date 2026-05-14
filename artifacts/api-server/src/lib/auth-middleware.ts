import type { Request, Response, NextFunction } from "express";
import { verifyUserToken } from "./tokens";

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authUser?: { id: string; isAdmin: boolean; [key: string]: unknown };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers["x-sahara-token"] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const userId = verifyUserToken(token);
  if (!userId) {
    res.status(401).json({ error: "Invalid or expired session. Please login again." });
    return;
  }
  req.authUserId = userId;
  next();
}
