import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { z } from "npm:zod";
import { INJECTION_GUARD, wrapUserContent } from "../_shared/promptSafety.ts";

const MODEL = "gemma-4-31b-it";
const MAX_OUTPUT_TOKENS = 512;
const TEMPERATURE = 0.1;

const requestSchema = z.object({
  text: z.string().min(1).max(500),
  context: z.object({
    today: z.string().optional(),
    openTasks: z.number().optional(),
    todayEventTitles: z.string().optional(),
    pageId: z.string().optional(),
    route: z.string().optional(),
    suggestedCommandIds: z.array(z.string()).optional(),
  }).optional(),
});

const outputSchema = z.object({
  intent: z.enum(["answer", "create_task", "create_events", "clarify"]),
  answer: z.string().max(600).optional(),
  clarify: z.string().max(300).optional(),
  task: z.object({
    title: z.string().max(120),
    due: z.string().max(32).optional(),
    priority: z.enum(["high", "medium", "low", "empty"]).optional(),
  }).optional(),
  events: z.array(z.object({
    title: z.string().max(120),
    start: z.string().max(32),
    end: z.string().max(32),
  })).max(3).optional(),
});

const SYSTEM = `You are Veridian's command parser. Return ONLY valid JSON (no markdown).
${INJECTION_GUARD}
Schema: {"intent":"answer"|"create_task"|"create_events"|"clarify","answer":"","clarify":"","task":{"title":"","due":"YYYY-MM-DDTHH:mm"},"events":[{"title":"","start":"YYYY-MM-DDTHH:mm","end":"YYYY-MM-DDTHH:mm"}]}
Rules:
- Prefer create_events when times are mentioned; create_task for todos without a time range.
- Use local datetime format YYYY-MM-DDTHH:mm (24h). Default event duration 1 hour if end missing.
- Max 3 events. Keep answer under 80 words.
- If ambiguous, use intent clarify with a short question.
- Context may include pageId, route, suggestedCommandIds — prefer intents relevant to the current page.
- If the user input is structured for a slash command (task/event/ask), honor that intent.
- Never invent actions outside the known command set.`;

function extractJson(raw: string) {
  const trimmed = String(raw ?? "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1].trim() : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start >= 0 && end > start) return body.slice(start, end + 1);
  return body;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: { message: "Invalid request" } }, { status: 400 });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return Response.json({ error: { message: "AI not configured" } }, { status: 503 });
    }

    const ctx = parsed.data.context || {};
    const userPrompt = JSON.stringify({
      today: ctx.today || new Date().toISOString().slice(0, 10),
      openTasks: ctx.openTasks ?? 0,
      todayEvents: ctx.todayEventTitles || "none",
      pageId: ctx.pageId || "global",
      route: ctx.route || "/",
      suggestedCommands: ctx.suggestedCommandIds || [],
      command: wrapUserContent(parsed.data.text),
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${SYSTEM}\n\n${userPrompt}` }] }],
    });

    const raw = result.response.text();
    const json = JSON.parse(extractJson(raw));
    const out = outputSchema.parse(json);
    return Response.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assistant failed";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
