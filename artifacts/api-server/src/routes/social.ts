import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  friendRequestsTable,
  messagesTable,
} from "@workspace/db";
import { and, eq, or, ne, sql } from "drizzle-orm";

const router = Router();

/* ─── GET /api/social/users?userId=... ─────────────────────────────────── */
router.get("/social/users", async (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) return res.status(400).json({ error: "userId required" });

  const allUsers = await db
    .select({ id: usersTable.id, saharaId: usersTable.saharaId, name: usersTable.name, location: usersTable.location, photoUrl: usersTable.photoUrl })
    .from(usersTable)
    .where(ne(usersTable.id, userId));

  const requests = await db
    .select()
    .from(friendRequestsTable)
    .where(
      or(
        eq(friendRequestsTable.fromUserId, userId),
        eq(friendRequestsTable.toUserId, userId),
      ),
    );

  const result = allUsers.map((u) => {
    const asFrom = requests.find((r) => r.fromUserId === userId && r.toUserId === u.id);
    const asTo = requests.find((r) => r.toUserId === userId && r.fromUserId === u.id);

    if (asFrom?.status === "accepted" || asTo?.status === "accepted") {
      return { ...u, requestStatus: "friends", requestId: asFrom?.id ?? asTo?.id };
    }
    if (asFrom?.status === "pending") {
      return { ...u, requestStatus: "sent", requestId: asFrom.id };
    }
    if (asTo?.status === "pending") {
      return { ...u, requestStatus: "received", requestId: asTo.id };
    }
    return { ...u, requestStatus: "none" };
  });

  res.json(result);
});

/* ─── POST /api/social/friend-request ──────────────────────────────────── */
router.post("/social/friend-request", async (req, res) => {
  const { fromUserId, toUserId } = req.body as { fromUserId: string; toUserId: string };
  if (!fromUserId || !toUserId) return res.status(400).json({ error: "Missing fields" });

  const existing = await db
    .select()
    .from(friendRequestsTable)
    .where(
      or(
        and(eq(friendRequestsTable.fromUserId, fromUserId), eq(friendRequestsTable.toUserId, toUserId)),
        and(eq(friendRequestsTable.fromUserId, toUserId), eq(friendRequestsTable.toUserId, fromUserId)),
      ),
    )
    .limit(1);

  if (existing.length > 0) return res.status(409).json({ error: "Request already exists" });

  await db.insert(friendRequestsTable).values({ fromUserId, toUserId, status: "pending" });
  res.json({ ok: true });
});

/* ─── POST /api/social/friend-request/:id/cancel ───────────────────────── */
router.post("/social/friend-request/:id/cancel", async (req, res) => {
  await db.delete(friendRequestsTable).where(eq(friendRequestsTable.id, req.params.id));
  res.json({ ok: true });
});

/* ─── POST /api/social/friend-request/:id/accept ───────────────────────── */
router.post("/social/friend-request/:id/accept", async (req, res) => {
  await db
    .update(friendRequestsTable)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(friendRequestsTable.id, req.params.id));
  res.json({ ok: true });
});

/* ─── POST /api/social/friend-request/:id/decline ──────────────────────── */
router.post("/social/friend-request/:id/decline", async (req, res) => {
  await db
    .update(friendRequestsTable)
    .set({ status: "declined", updatedAt: new Date() })
    .where(eq(friendRequestsTable.id, req.params.id));
  res.json({ ok: true });
});

/* ─── GET /api/social/friend-requests?userId=... ───────────────────────── */
router.get("/social/friend-requests", async (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) return res.status(400).json({ error: "userId required" });

  const rows = await db
    .select({
      id: friendRequestsTable.id,
      createdAt: friendRequestsTable.createdAt,
      fromId: usersTable.id,
      fromName: usersTable.name,
      fromLocation: usersTable.location,
      fromPhotoUrl: usersTable.photoUrl,
    })
    .from(friendRequestsTable)
    .innerJoin(usersTable, eq(usersTable.id, friendRequestsTable.fromUserId))
    .where(
      and(
        eq(friendRequestsTable.toUserId, userId),
        eq(friendRequestsTable.status, "pending"),
      ),
    );

  res.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      from: { id: r.fromId, name: r.fromName, location: r.fromLocation, photoUrl: r.fromPhotoUrl },
    })),
  );
});

/* ─── GET /api/social/friends?userId=... ───────────────────────────────── */
router.get("/social/friends", async (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) return res.status(400).json({ error: "userId required" });

  const accepted = await db
    .select()
    .from(friendRequestsTable)
    .where(
      and(
        eq(friendRequestsTable.status, "accepted"),
        or(
          eq(friendRequestsTable.fromUserId, userId),
          eq(friendRequestsTable.toUserId, userId),
        ),
      ),
    );

  const friendIds = accepted.map((r) =>
    r.fromUserId === userId ? r.toUserId : r.fromUserId,
  );

  if (friendIds.length === 0) return res.json([]);

  const friends = await db
    .select({ id: usersTable.id, name: usersTable.name, location: usersTable.location, photoUrl: usersTable.photoUrl })
    .from(usersTable)
    .where(
      or(...friendIds.map((id) => eq(usersTable.id, id))),
    );

  const withUnread = await Promise.all(
    friends.map(async (f) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.fromUserId, f.id),
            eq(messagesTable.toUserId, userId),
            sql`${messagesTable.readAt} IS NULL`,
          ),
        );
      return { ...f, unreadCount: Number(count) };
    }),
  );

  res.json(withUnread);
});

/* ─── GET /api/social/messages?userId=...&friendId=... ─────────────────── */
router.get("/social/messages", async (req, res) => {
  const { userId, friendId } = req.query as { userId?: string; friendId?: string };
  if (!userId || !friendId) return res.status(400).json({ error: "userId and friendId required" });

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.fromUserId, userId), eq(messagesTable.toUserId, friendId)),
        and(eq(messagesTable.fromUserId, friendId), eq(messagesTable.toUserId, userId)),
      ),
    )
    .orderBy(messagesTable.createdAt);

  res.json(msgs);
});

/* ─── POST /api/social/messages ────────────────────────────────────────── */
router.post("/social/messages", async (req, res) => {
  const { fromUserId, toUserId, content } = req.body as {
    fromUserId: string;
    toUserId: string;
    content: string;
  };
  if (!fromUserId || !toUserId || !content?.trim()) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({ fromUserId, toUserId, content: content.trim() })
    .returning();

  res.json(msg);
});

/* ─── POST /api/social/heartbeat ───────────────────────────────────────── */
router.post("/social/heartbeat", async (req, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) return res.status(400).json({ error: "userId required" });
  await db
    .update(usersTable)
    .set({ lastSeen: new Date() })
    .where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

/* ─── GET /api/social/online-status/:userId ─────────────────────────────── */
router.get("/social/online-status/:userId", async (req, res) => {
  const [user] = await db
    .select({ lastSeen: usersTable.lastSeen })
    .from(usersTable)
    .where(eq(usersTable.id, req.params.userId))
    .limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });
  const lastSeen = user.lastSeen;
  const isOnline = lastSeen !== null && Date.now() - new Date(lastSeen).getTime() < 60_000;
  res.json({ isOnline, lastSeen: lastSeen?.toISOString() ?? null });
});

/* ─── POST /api/social/messages/read ───────────────────────────────────── */
router.post("/social/messages/read", async (req, res) => {
  const { userId, friendId } = req.body as { userId: string; friendId: string };
  await db
    .update(messagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messagesTable.fromUserId, friendId),
        eq(messagesTable.toUserId, userId),
        sql`${messagesTable.readAt} IS NULL`,
      ),
    );
  res.json({ ok: true });
});

export default router;
