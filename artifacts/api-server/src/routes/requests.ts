import { Router, type IRouter } from "express";
import { db, requestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

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
      contactPhone: r.isAnonymous ? undefined : (r.contactPhone ?? undefined),
      postedBy: r.isAnonymous ? "Anonymous" : r.postedBy,
      timestamp: new Date(r.createdAt).getTime(),
      userId: r.isAnonymous ? undefined : (r.userId ?? undefined),
      mediaUrls: r.mediaUrls ?? [],
      isAnonymous: r.isAnonymous ?? false,
    }));
    res.json({ requests: mapped });
  } catch (err) {
    req.log.error({ err }, "Error fetching requests");
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.post("/requests", async (req, res) => {
  try {
    const { category, helpType, title, description, location, contactPhone, postedBy, userId, mediaUrls, isAnonymous } = req.body as {
      category?: string;
      helpType?: string;
      title?: string;
      description?: string;
      location?: string;
      contactPhone?: string;
      postedBy?: string;
      userId?: string;
      mediaUrls?: string[];
      isAnonymous?: boolean;
    };

    if (!category || !helpType || !title || !description || !location || !postedBy) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const anonymous = isAnonymous === true;

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
        userId: userId || null,
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
        contactPhone: anonymous ? undefined : (row.contactPhone ?? undefined),
        postedBy: anonymous ? "Anonymous" : row.postedBy,
        timestamp: new Date(row.createdAt).getTime(),
        userId: anonymous ? undefined : (row.userId ?? undefined),
        mediaUrls: row.mediaUrls ?? [],
        isAnonymous: anonymous,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error creating request");
    res.status(500).json({ error: "Failed to create request" });
  }
});

router.patch("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    const [row] = await db
      .update(requestsTable)
      .set({ status })
      .where(eq(requestsTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Error updating request");
    res.status(500).json({ error: "Failed to update request" });
  }
});

router.delete("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(requestsTable).where(eq(requestsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting request");
    res.status(500).json({ error: "Failed to delete request" });
  }
});

export default router;
