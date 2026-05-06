import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Sahara AI Assistant, a helpful assistant for the Sahara community help platform (saharaapphelp.com).

Sahara connects people who need help with those who can give it in Ajmer, Rajasthan, India.

Categories on Sahara:
- भोजन (Food) - helping people with food needs
- चिकित्सा (Medical) - medical help and hospital guidance  
- रोजगार (Job) - employment and job opportunities
- पशु (Animal) - animal care and welfare
- शिक्षा (Education) - education and tutoring support

You help users:
1. Find the right category for their need or offer
2. Guide them on how to post a help request or offer
3. Answer questions about nearby hospitals and clinics in Ajmer
4. Explain how Sahara works
5. Provide general community support advice

Always be warm, helpful, and encouraging. Respond in the same language the user writes in (Hindi or English).
Keep responses concise and practical. If someone needs urgent medical help, always advise them to call 108 (ambulance) first.`;

router.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 512,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    res.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "AI service unavailable" });
  }
});

export default router;
