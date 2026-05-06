import { Router, type IRouter } from "express";

const router: IRouter = Router();

const pushTokens = new Set<string>();

router.post("/api/notifications/register", (req, res) => {
  const { token } = req.body as { token?: string };
  if (token && typeof token === "string" && token.startsWith("ExponentPushToken")) {
    pushTokens.add(token);
    res.json({ ok: true, registered: pushTokens.size });
  } else {
    res.status(400).json({ error: "Invalid token" });
  }
});

router.post("/api/notifications/new-request", async (req, res) => {
  const { title, category, helpType, location } = req.body as {
    title?: string;
    category?: string;
    helpType?: string;
    location?: string;
  };

  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const categoryEmoji: Record<string, string> = {
    food: "🍲",
    medical: "🏥",
    job: "💼",
    animal: "🐾",
    education: "📚",
  };

  const emoji = categoryEmoji[category ?? ""] ?? "🙏";
  const typeLabel = helpType === "need_help" ? "मदद चाहिए" : "मदद करना है";
  const notifTitle = `${emoji} नई Request — ${typeLabel}`;
  const notifBody = `${title}${location ? ` • ${location}` : ""}`;

  const tokens = Array.from(pushTokens);
  if (tokens.length === 0) {
    res.json({ ok: true, sent: 0 });
    return;
  }

  const messages = tokens.map((to) => ({
    to,
    sound: "default",
    title: notifTitle,
    body: notifBody,
    data: { category, helpType },
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json() as unknown;
    res.json({ ok: true, sent: tokens.length, result });
  } catch (err) {
    console.error("Push notification error:", err);
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

export default router;
