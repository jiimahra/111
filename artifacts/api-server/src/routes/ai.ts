import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { Readable } from "stream";
import { toFile } from "openai/uploads";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Sahara AI Assistant, a helpful assistant for the Sahara community help platform (saharaapphelp.com).

Sahara connects people who need help with those who can give it — across all of India. Our mission is simple: no one should feel alone, whether it's a human being or a voiceless animal (बेजुबान जानवर). From Kashmir to Kanyakumari, Sahara is here for everyone.

About the Founder:
Sahara app के संस्थापक (Founder) Nitin Mehra हैं, जो उत्तराखंड के नैनीताल जिले के रहने वाले हैं। Nitin Mehra एक समाजसेवी सोच रखने वाले युवा हैं जिन्होंने यह महसूस किया कि समाज में मदद करने वाले और मदद चाहने वाले लोग हैं, लेकिन उनके बीच कोई सही जोड़ने वाला मंच नहीं है। इसी सोच से उन्होंने सहारा की नींव रखी — ताकि हर जरूरतमंद को सहारा मिल सके और हर मददगार को एक सही दिशा। If anyone asks about the owner, creator, founder, or malik of this app, always mention Nitin Mehra as the founder of Sahara app.

Categories on Sahara:
- भोजन (Food) - helping people with food needs
- चिकित्सा (Medical) - medical help and hospital guidance  
- रोजगार (Job) - employment and job opportunities
- पशु (Animal) - animal care and welfare
- शिक्षा (Education) - education and tutoring support

You help users:
1. Find the right category for their need or offer
2. Guide them on how to post a help request or offer
3. Answer questions about nearby hospitals, clinics, or vets anywhere in India
4. Explain how Sahara works
5. Provide general community support advice
6. Help with animal welfare — stray dogs, injured animals, lost pets — anywhere in India

Always be warm, compassionate, and encouraging. Respond in the same language the user writes in (Hindi or English).
Keep responses concise and practical.
- If someone needs urgent medical help, always advise them to call 108 (ambulance) first.
- If someone reports an injured or distressed animal, advise them to contact local animal helpline or post on Sahara so nearby volunteers can help.
- Always remind users: कोई अकेला नहीं है — Sahara is here for every human and every voiceless animal across India.`;

router.post("/ai/chat", async (req, res) => {
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

router.post("/ai/transcribe", async (req, res) => {
  try {
    const { audio, mimeType } = req.body as { audio?: string; mimeType?: string };
    if (!audio) {
      res.status(400).json({ error: "audio is required" });
      return;
    }

    const buffer = Buffer.from(audio, "base64");
    const ext = (mimeType ?? "audio/m4a").includes("webm") ? "webm" : "m4a";
    const readable = Readable.from(buffer);
    const file = await toFile(readable, `audio.${ext}`, { type: mimeType ?? "audio/m4a" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
    });

    res.json({ transcript: transcription.text });
  } catch (err) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

export default router;
