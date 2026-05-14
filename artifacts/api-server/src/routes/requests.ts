import { Router, type IRouter } from "express";
import { db, requestsTable, usersTable, requestLikesTable, requestCommentsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";

const router: IRouter = Router();

/* ─── GET /api/home-stats ───────────────────────────────────────────────── */
router.get("/home-stats", async (req, res) => {
  try {
    const [[{ totalUsers }], [{ activeCount }], [{ resolvedCount }], [{ cityCount }], featured] =
      await Promise.all([
        db.select({ totalUsers: sql<number>`count(*)` }).from(usersTable),
        db.select({ activeCount: sql<number>`count(*)` }).from(requestsTable).where(sql`${requestsTable.status} != 'resolved'`),
        db.select({ resolvedCount: sql<number>`count(*)` }).from(requestsTable).where(eq(requestsTable.status, "resolved")),
        db.select({ cityCount: sql<number>`count(distinct ${requestsTable.location})` }).from(requestsTable),
        db
          .select()
          .from(requestsTable)
          .where(sql`${requestsTable.status} != 'resolved' and ${requestsTable.helpType} = 'need_help'`)
          .orderBy(desc(requestsTable.createdAt))
          .limit(1),
      ]);
    const f = featured[0] ?? null;
    res.json({
      totalUsers: Number(totalUsers),
      activeRequests: Number(activeCount),
      resolvedRequests: Number(resolvedCount),
      citiesCovered: Number(cityCount),
      featuredRequest: f
        ? {
            id: f.id,
            category: f.category,
            helpType: f.helpType,
            title: f.title,
            description: f.description,
            location: f.location,
            postedBy: f.isAnonymous ? "Anonymous" : f.postedBy,
            timestamp: new Date(f.createdAt).getTime(),
            isAnonymous: f.isAnonymous ?? false,
          }
        : null,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching home stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/* ─── GET /api/requests (public — PII stripped) ─────────────────────────── */
router.get("/requests", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(requestsTable)
      .orderBy(desc(requestsTable.createdAt));
    const mapped = rows.map((r) => ({
      id: r.id,
      category: r.category,
      helpType: r.helpType,
      title: r.title,
      description: r.description,
      location: r.location,
      status: r.status,
      postedBy: r.isAnonymous ? "Anonymous" : r.postedBy,
      timestamp: new Date(r.createdAt).getTime(),
      mediaUrls: r.mediaUrls ?? [],
      isAnonymous: r.isAnonymous ?? false,
    }));
    res.json({ requests: mapped });
  } catch (err) {
    req.log.error({ err }, "Error fetching requests");
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

/* ─── GET /api/requests/mine (auth — returns own requests with userId) ───── */
router.get("/requests/mine", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.userId, req.authUserId!))
      .orderBy(desc(requestsTable.createdAt));
    const mapped = rows.map((r) => ({
      id: r.id,
      category: r.category,
      helpType: r.helpType,
      title: r.title,
      description: r.description,
      location: r.location,
      status: r.status,
      contactPhone: r.isAnonymous ? undefined : (r.contactPhone ?? undefined),
      postedBy: r.isAnonymous ? "Anonymous" : r.postedBy,
      timestamp: new Date(r.createdAt).getTime(),
      userId: r.userId ?? undefined,
      mediaUrls: r.mediaUrls ?? [],
      isAnonymous: r.isAnonymous ?? false,
    }));
    res.json({ requests: mapped });
  } catch (err) {
    req.log.error({ err }, "Error fetching own requests");
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

/* ─── POST /api/requests (auth required) ────────────────────────────────── */
router.post("/requests", requireAuth, async (req, res) => {
  try {
    const { category, helpType, title, description, location, contactPhone, postedBy, mediaUrls, isAnonymous } = req.body as {
      category?: string;
      helpType?: string;
      title?: string;
      description?: string;
      location?: string;
      contactPhone?: string;
      postedBy?: string;
      mediaUrls?: string[];
      isAnonymous?: boolean;
    };

    if (!category || !helpType || !title || !description || !location || !postedBy) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const anonymous = isAnonymous === true;
    const authorId = req.authUserId!;

    const [row] = await db
      .insert(requestsTable)
      .values({
        category,
        helpType,
        title,
        description,
        location,
        contactPhone: anonymous ? null : (contactPhone || null),
        postedBy,
        userId: authorId,
        status: "active",
        mediaUrls: mediaUrls ?? [],
        isAnonymous: anonymous,
      })
      .returning();

    res.json({
      request: {
        id: row.id,
        category: row.category,
        helpType: row.helpType,
        title: row.title,
        description: row.description,
        location: row.location,
        status: row.status,
        postedBy: anonymous ? "Anonymous" : row.postedBy,
        timestamp: new Date(row.createdAt).getTime(),
        mediaUrls: row.mediaUrls ?? [],
        isAnonymous: anonymous,
        userId: authorId,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error creating request");
    res.status(500).json({ error: "Failed to create request" });
  }
});

/* ─── PATCH /api/requests/:id (auth + ownership) ────────────────────────── */
router.patch("/requests/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    const [existing] = await db
      .select({ userId: requestsTable.userId })
      .from(requestsTable)
      .where(eq(requestsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (existing.userId !== req.authUserId && !req.authUser?.isAdmin) {
      res.status(403).json({ error: "Not authorized to modify this request" });
      return;
    }

    await db.update(requestsTable).set({ status }).where(eq(requestsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Error updating request");
    res.status(500).json({ error: "Failed to update request" });
  }
});

/* ─── DELETE /api/requests/:id (auth + ownership) ───────────────────────── */
router.delete("/requests/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select({ userId: requestsTable.userId })
      .from(requestsTable)
      .where(eq(requestsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (existing.userId !== req.authUserId && !req.authUser?.isAdmin) {
      res.status(403).json({ error: "Not authorized to delete this request" });
      return;
    }

    await db.delete(requestsTable).where(eq(requestsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting request");
    res.status(500).json({ error: "Failed to delete request" });
  }
});

/* ─── GET /api/requests/:id/reactions ───────────────────────────────────── */
router.get("/requests/:id/reactions", async (req, res) => {
  try {
    const { id } = req.params;
    const callerToken = req.headers["x-sahara-token"] as string | undefined;

    const [[{ likesCount }], rawComments] = await Promise.all([
      db.select({ likesCount: sql<number>`count(*)` }).from(requestLikesTable).where(eq(requestLikesTable.requestId, id)),
      db.select().from(requestCommentsTable).where(eq(requestCommentsTable.requestId, id)).orderBy(desc(requestCommentsTable.createdAt)),
    ]);

    let callerUserId: string | null = null;
    if (callerToken) {
      const [u] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.apiToken, callerToken))
        .limit(1);
      callerUserId = u?.id ?? null;
    }

    let liked = false;
    if (callerUserId) {
      const [existing] = await db
        .select()
        .from(requestLikesTable)
        .where(and(eq(requestLikesTable.requestId, id), eq(requestLikesTable.userId, callerUserId)))
        .limit(1);
      liked = !!existing;
    }

    const comments = rawComments.map(({ userId: _uid, ...c }) => c);

    res.json({ likesCount: Number(likesCount), liked, commentsCount: comments.length, comments });
  } catch {
    res.status(500).json({ error: "Failed to fetch reactions" });
  }
});

/* ─── POST /api/requests/:id/like (auth required) ───────────────────────── */
router.post("/requests/:id/like", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.authUserId!;
    const [existing] = await db
      .select()
      .from(requestLikesTable)
      .where(and(eq(requestLikesTable.requestId, id), eq(requestLikesTable.userId, userId)))
      .limit(1);
    if (existing) {
      await db.delete(requestLikesTable).where(eq(requestLikesTable.id, existing.id));
      res.json({ liked: false });
    } else {
      await db.insert(requestLikesTable).values({ requestId: id, userId });
      res.json({ liked: true });
    }
  } catch {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

/* ─── POST /api/requests/:id/comment (auth required) ────────────────────── */
router.post("/requests/:id/comment", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, content, isAnonymous } = req.body as { userName?: string; content?: string; isAnonymous?: boolean };
    if (!userName || !content) return res.status(400).json({ error: "userName and content required" });
    const [comment] = await db
      .insert(requestCommentsTable)
      .values({
        requestId: id,
        userId: req.authUserId!,
        userName: isAnonymous ? "Anonymous" : userName,
        content,
        isAnonymous: isAnonymous ?? false,
      })
      .returning();
    const { userId: _uid, ...safeComment } = comment;
    res.json(safeComment);
  } catch {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

export default router;
