import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, requestsTable } from "@workspace/db";
import { eq, desc, count, gte } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_EMAIL = "saharaapphelp@gmail.com";

async function verifyAdmin(userId: string): Promise<boolean> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return !!user && (user.isAdmin || user.email === ADMIN_EMAIL);
}

router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email aur password zaroori hain" });
      return;
    }
    if (email.toLowerCase().trim() !== ADMIN_EMAIL) {
      res.status(403).json({ error: "Admin access nahi hai" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
    if (!user) {
      res.status(403).json({ error: "Admin account nahi mila. Pehle Sahara app mein register karein." });
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Galat password" });
      return;
    }
    res.json({ ok: true, userId: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/admin/stats", async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [totalUsers] = await db.select({ count: count() }).from(usersTable);
    const [totalRequests] = await db.select({ count: count() }).from(requestsTable);
    const [activeReqs] = await db.select({ count: count() }).from(requestsTable).where(eq(requestsTable.status, "active"));
    const [resolvedReqs] = await db.select({ count: count() }).from(requestsTable).where(eq(requestsTable.status, "resolved"));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [newUsersThisWeek] = await db.select({ count: count() }).from(usersTable).where(gte(usersTable.createdAt, sevenDaysAgo));
    const [newRequestsThisWeek] = await db.select({ count: count() }).from(requestsTable).where(gte(requestsTable.createdAt, sevenDaysAgo));

    const categoryRows = await db
      .select({ category: requestsTable.category, count: count() })
      .from(requestsTable)
      .groupBy(requestsTable.category);

    const helpTypeRows = await db
      .select({ helpType: requestsTable.helpType, count: count() })
      .from(requestsTable)
      .groupBy(requestsTable.helpType);

    const locationRows = await db
      .select({ location: requestsTable.location, count: count() })
      .from(requestsTable)
      .groupBy(requestsTable.location)
      .orderBy(desc(count()))
      .limit(5);

    res.json({
      totalUsers: totalUsers.count,
      totalRequests: totalRequests.count,
      activeRequests: activeReqs.count,
      resolvedRequests: resolvedReqs.count,
      newUsersThisWeek: newUsersThisWeek.count,
      newRequestsThisWeek: newRequestsThisWeek.count,
      byCategory: categoryRows,
      byHelpType: helpTypeRows,
      topLocations: locationRows,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/admin/users", async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const users = await db
      .select({
        id: usersTable.id,
        saharaId: usersTable.saharaId,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        location: usersTable.location,
        createdAt: usersTable.createdAt,
        lastSeen: usersTable.lastSeen,
        isAdmin: usersTable.isAdmin,
        blockedUntil: usersTable.blockedUntil,
        blockReason: usersTable.blockReason,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/admin/users/:id/block", async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { id } = req.params;
    if (id === userId) {
      res.status(400).json({ error: "Apna account block nahi kar sakte" });
      return;
    }
    const { duration, reason } = req.body as { duration?: string; reason?: string };
    const validDurations = ["3m", "6m", "12m", "5y", "permanent"];
    if (!duration || !validDurations.includes(duration)) {
      res.status(400).json({ error: "Valid duration required: 3m, 6m, 12m, 5y, permanent" });
      return;
    }
    let blockedUntil: Date;
    const now = new Date();
    if (duration === "3m") {
      blockedUntil = new Date(now.setMonth(now.getMonth() + 3));
    } else if (duration === "6m") {
      blockedUntil = new Date(now.setMonth(now.getMonth() + 6));
    } else if (duration === "12m") {
      blockedUntil = new Date(now.setMonth(now.getMonth() + 12));
    } else if (duration === "5y") {
      blockedUntil = new Date(now.setFullYear(now.getFullYear() + 5));
    } else {
      blockedUntil = new Date("9999-12-31T23:59:59Z");
    }
    await db
      .update(usersTable)
      .set({ blockedUntil, blockReason: reason ?? null })
      .where(eq(usersTable.id, id));
    res.json({ ok: true, blockedUntil });
  } catch (err) {
    res.status(500).json({ error: "Failed to block user" });
  }
});

router.post("/admin/users/:id/unblock", async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db
      .update(usersTable)
      .set({ blockedUntil: null, blockReason: null })
      .where(eq(usersTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

router.delete("/admin/users/:id", async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { id } = req.params;
    if (id === userId) {
      res.status(400).json({ error: "Apna account delete nahi kar sakte" });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.get("/admin/requests", async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const requests = await db
      .select()
      .from(requestsTable)
      .orderBy(desc(requestsTable.createdAt));
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.delete("/admin/requests/:id", async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.delete(requestsTable).where(eq(requestsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete request" });
  }
});

router.patch("/admin/requests/:id/status", async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId || !(await verifyAdmin(userId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { status } = req.body as { status?: string };
    if (!status) {
      res.status(400).json({ error: "status required" });
      return;
    }
    await db.update(requestsTable).set({ status }).where(eq(requestsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update request" });
  }
});

export default router;
