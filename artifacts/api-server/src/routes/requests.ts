import { Router, type IRouter } from "express";
import { db, requestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const SEED_REQUESTS = [
  {
    category: "medical",
    helpType: "need_help",
    title: "बुजुर्ग व्यक्ति को अस्पताल की सहायता की आवश्यकता है",
    description: "अजमेर बस स्टैंड के पास एक बुजुर्ग व्यक्ति को अस्पताल जाने में मदद की जरूरत है। उनका कोई परिवार आसपास नहीं रहता और वे अकेले यात्रा नहीं कर सकते।",
    location: "अजमेर बस स्टैंड, अजमेर",
    status: "active",
    contactPhone: "9876543210",
    postedBy: "रमेश कुमार",
  },
  {
    category: "food",
    helpType: "need_help",
    title: "चार सदस्यों वाले परिवार को भोजन सहायता की आवश्यकता है",
    description: "दो छोटे बच्चों वाले एक परिवार ने दो दिनों से खाना नहीं खाया है। पिता की हाल ही में नौकरी चली गई है। उन्हें खाने-पीने की चीजें या घर का बना खाना तुरंत चाहिए।",
    location: "वैशाली नगर, अजमेर",
    status: "active",
    postedBy: "सुनीता देवी",
  },
  {
    category: "animal",
    helpType: "need_help",
    title: "रेलवे स्टेशन के पास घायल कुत्ता",
    description: "अजमेर रेलवे स्टेशन के पास एक कुत्ते को वाहन ने टक्कर मार दी। उसे तुरंत पशु चिकित्सा देखभाल की जरूरत है। वह चल नहीं सकता।",
    location: "अजमेर रेलवे स्टेशन",
    status: "active",
    contactPhone: "9012345678",
    postedBy: "प्रिया शर्मा",
  },
  {
    category: "job",
    helpType: "give_help",
    title: "मेरी दुकान पर 2 नौकरियां उपलब्ध हैं",
    description: "मेरे पास एक किराना स्टोर है और मुझे 2 सहायकों की जरूरत है। कोई अनुभव जरूरी नहीं। अच्छा वेतन मिलेगा। अजमेर के स्थानीय उम्मीदवारों को प्राथमिकता।",
    location: "दरगाह बाजार, अजमेर",
    status: "active",
    contactPhone: "9123456789",
    postedBy: "मोहम्मद असलम",
  },
  {
    category: "education",
    helpType: "give_help",
    title: "कक्षा 6-10 के छात्रों के लिए निःशुल्क ट्यूशन",
    description: "मैं गरीब परिवारों के छात्रों को मुफ्त ट्यूशन दे रहा हूँ। विषय: गणित, विज्ञान, हिंदी। सप्ताहांत पर कक्षाएं होती हैं।",
    location: "पुष्कर रोड, अजमेर",
    status: "active",
    postedBy: "कविता जोशी",
  },
  {
    category: "food",
    helpType: "give_help",
    title: "हर रविवार निःशुल्क लंगर",
    description: "हम हर रविवार दोपहर 1 बजे निःशुल्क भोजन (लंगर) परोसते हैं। सभी का स्वागत है। हम 100 लोगों को खाना खिला सकते हैं।",
    location: "नया बाजार गुरुद्वारा, अजमेर",
    status: "active",
    postedBy: "गुरप्रीत सिंह",
  },
];

async function seedIfEmpty() {
  try {
    const existing = await db.select({ id: requestsTable.id }).from(requestsTable).limit(1);
    if (existing.length === 0) {
      await db.insert(requestsTable).values(SEED_REQUESTS);
    }
  } catch {
  }
}

void seedIfEmpty();

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
      contactPhone: r.contactPhone ?? undefined,
      postedBy: r.postedBy,
      timestamp: new Date(r.createdAt).getTime(),
      userId: r.userId ?? undefined,
    }));
    res.json({ requests: mapped });
  } catch (err) {
    req.log.error({ err }, "Error fetching requests");
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.post("/requests", async (req, res) => {
  try {
    const { category, helpType, title, description, location, contactPhone, postedBy, userId } = req.body as {
      category?: string;
      helpType?: string;
      title?: string;
      description?: string;
      location?: string;
      contactPhone?: string;
      postedBy?: string;
      userId?: string;
    };

    if (!category || !helpType || !title || !description || !location || !postedBy) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [row] = await db
      .insert(requestsTable)
      .values({
        category,
        helpType,
        title,
        description,
        location,
        contactPhone: contactPhone || null,
        postedBy,
        userId: userId || null,
        status: "active",
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
        contactPhone: row.contactPhone ?? undefined,
        postedBy: row.postedBy,
        timestamp: new Date(row.createdAt).getTime(),
        userId: row.userId ?? undefined,
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
