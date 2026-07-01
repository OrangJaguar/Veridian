import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { z } from "npm:zod";
import { logServerError } from "../_shared/logServerError.ts";
import { INJECTION_GUARD, wrapUserContent } from "../_shared/promptSafety.ts";

const MODEL = "gemma-4-31b-it";
const DEPLOY_BUILD = "inline-gemma-v7-progressive-propose";
const MAX_OUTPUT_TOKENS = 4096;
const MAX_OUTPUT_TOKENS_OUTLINE = 1536;
const MAX_OUTPUT_TOKENS_MODULE = 1024;
const TEMPERATURE = 0.1;

const LIMITS = {
  journeyProposalsPerDay: 5,
  scaffoldRegeneratesPerDay: 10,
  maxInputTokensPerDay: 150_000,
  cooldownSeconds: 30,
};

const conceptSchema = z.object({
  id: z.string().min(1).max(32),
  term: z.string().min(1).max(80),
  definition: z.string().min(1).max(80),
});

const journeyProposalSchema = z.object({
  journeySummary: z.string().min(1).max(200),
  modules: z.array(
    z.object({
      name: z.string().min(1).max(80),
      description: z.string().min(1).max(120),
      concepts: z.array(conceptSchema).min(1).max(10),
    }),
  ).min(2).max(8),
});

const proposePayloadSchema = z.object({
  title: z.string().min(1).max(120),
  subject: z.string().min(1).max(80),
  priorKnowledge: z.enum(["scratch", "some", "most"]).default("some"),
  material: z.string().min(50).max(80_000),
});

const regeneratePayloadSchema = z.object({
  title: z.string().min(1).max(120),
  subject: z.string().min(1).max(80),
  priorKnowledge: z.enum(["scratch", "some", "most"]).default("some"),
  cachedKnowledgeMap: z.object({
    journeySummary: z.string().max(200),
    allConcepts: z.array(
      conceptSchema.extend({
        sourceModuleHint: z.string().max(80).optional(),
      }),
    ).min(2).max(80),
  }),
});

const journeyOutlineSchema = z.object({
  journeySummary: z.string().min(1).max(200),
  modules: z.array(
    z.object({
      name: z.string().min(1).max(80),
      description: z.string().min(1).max(120),
    }),
  ).min(2).max(8),
});

const moduleConceptsSchema = z.object({
  concepts: z.array(conceptSchema).min(1).max(10),
});

const proposeModuleConceptsPayloadSchema = z.object({
  title: z.string().min(1).max(120),
  subject: z.string().min(1).max(80),
  priorKnowledge: z.enum(["scratch", "some", "most"]).default("some"),
  material: z.string().min(50).max(80_000),
  journeySummary: z.string().max(200),
  module: z.object({
    name: z.string().min(1).max(80),
    description: z.string().min(1).max(120),
  }),
  moduleIndex: z.number().int().min(0),
  moduleCount: z.number().int().min(1).max(8),
});

const requestSchema = z.object({
  action: z.enum([
    "proposeJourney",
    "proposeJourneyOutline",
    "proposeModuleConcepts",
    "regenerateModules",
  ]),
  payload: z.record(z.unknown()),
});

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: { message, status } }, status);
}

async function getOrCreateQuota(base44: ReturnType<typeof createClientFromRequest>, userEmail: string) {
  const dateKey = utcDateKey();
  const rows = await base44.entities.UserAiQuota.filter({ userEmail, dateKey });
  if (rows[0]) return rows[0];

  return base44.entities.UserAiQuota.create({
    userEmail,
    dateKey,
    journeyProposals: 0,
    scaffoldRegenerates: 0,
    inputTokens: 0,
    lastCallAt: 0,
  });
}

async function checkAndIncrementQuota(
  base44: ReturnType<typeof createClientFromRequest>,
  userEmail: string,
  action: "proposeJourney" | "regenerateModules",
  estimatedInputTokens: number,
) {
  const quota = await getOrCreateQuota(base44, userEmail);
  const now = Date.now();

  if (quota.lastCallAt && now - quota.lastCallAt < LIMITS.cooldownSeconds * 1000) {
    return errorResponse("Please wait a moment before making another AI request.", 429);
  }

  if (action === "proposeJourney" && (quota.journeyProposals ?? 0) >= LIMITS.journeyProposalsPerDay) {
    return errorResponse("Daily journey creation limit reached. Try again tomorrow.", 429);
  }

  if (action === "regenerateModules" && (quota.scaffoldRegenerates ?? 0) >= LIMITS.scaffoldRegeneratesPerDay) {
    return errorResponse("Daily regenerate limit reached. Try again tomorrow.", 429);
  }

  if ((quota.inputTokens ?? 0) + estimatedInputTokens > LIMITS.maxInputTokensPerDay) {
    return errorResponse("Daily AI token budget exceeded. Try again tomorrow.", 429);
  }

  const patch = {
    lastCallAt: now,
    inputTokens: (quota.inputTokens ?? 0) + estimatedInputTokens,
    journeyProposals: action === "proposeJourney"
      ? (quota.journeyProposals ?? 0) + 1
      : (quota.journeyProposals ?? 0),
    scaffoldRegenerates: action === "regenerateModules"
      ? (quota.scaffoldRegenerates ?? 0) + 1
      : (quota.scaffoldRegenerates ?? 0),
  };

  await base44.entities.UserAiQuota.update(quota.id, patch);
  return null;
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

const PROPOSE_SYSTEM = `You are a study curriculum architect. Extract a compact knowledge map and propose 2-8 modules.

Output ONLY valid JSON with this exact top-level shape (no wrapper keys):
{"journeySummary":"string max 200 chars","modules":[{"name":"string max 80","description":"string max 120","concepts":[{"id":"c1","term":"string max 80","definition":"string max 80"}]}]}

Rules:
- No markdown, no code fences, no commentary before or after the JSON.
- Keep every string within its max length.
- Use short concept ids like c1, c2 per module.
- 2-8 modules, 1-10 concepts each.${INJECTION_GUARD}`;

const OUTLINE_SYSTEM = `You are a study curriculum architect. Propose a journey OUTLINE only — module names and descriptions, NO concepts yet.

Output ONLY valid JSON:
{"journeySummary":"string max 200 chars","modules":[{"name":"string max 80","description":"string max 120"}]}

Rules:
- No markdown, no code fences.
- 2-8 modules with clear learning progression.
- Do NOT include concepts.${INJECTION_GUARD}`;

const MODULE_CONCEPTS_SYSTEM = `You are a study curriculum architect. Generate concepts for ONE module only.

Output ONLY valid JSON:
{"concepts":[{"id":"c1","term":"string max 80","definition":"string max 80"}]}

Rules:
- No markdown, no code fences.
- 3-8 concepts for this module only.
- Use short ids like c1, c2.
- Teach from the provided material excerpt.${INJECTION_GUARD}`;

const REGENERATE_SYSTEM = `Reorganize modules from existing concepts only. Do not add concepts. Output ONLY valid JSON. Max 8 modules. Same schema as proposeJourney.${INJECTION_GUARD}`;

function clipString(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() : text;
}

function extractJsonText(raw: string) {
  const trimmed = String(raw ?? "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);

  return trimmed;
}

function normalizeProposal(raw: unknown) {
  if (!raw || typeof raw !== "object") return raw;

  const obj = raw as {
    journeySummary?: unknown;
    modules?: Array<{
      name?: unknown;
      description?: unknown;
      concepts?: Array<{ id?: unknown; term?: unknown; definition?: unknown }>;
    }>;
  };

  const modules = Array.isArray(obj.modules) ? obj.modules : [];

  return {
    journeySummary: clipString(obj.journeySummary, 200),
    modules: modules.slice(0, 8).map((mod, moduleIndex) => {
      const concepts = Array.isArray(mod?.concepts) ? mod.concepts : [];
      const normalizedConcepts = concepts.slice(0, 10).map((concept, conceptIndex) => ({
        id: clipString(concept?.id, 32) || `c${conceptIndex + 1}`,
        term: clipString(concept?.term, 80),
        definition: clipString(concept?.definition, 80),
      })).filter((concept) => concept.term && concept.definition);

      return {
        name: clipString(mod?.name, 80),
        description: clipString(mod?.description, 120),
        concepts: normalizedConcepts.length > 0
          ? normalizedConcepts
          : [{
            id: "c1",
            term: clipString(mod?.name, 80) || `Topic ${moduleIndex + 1}`,
            definition: clipString(mod?.description, 80) || "Core concept",
          }],
      };
    }).filter((mod) => mod.name && mod.description && mod.concepts.length > 0),
  };
}

function formatValidationError(err: unknown) {
  if (err instanceof z.ZodError) {
    const details = err.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    return `AI response format invalid: ${details}`;
  }
  if (err instanceof SyntaxError) {
    return "AI returned invalid JSON. Please try again.";
  }
  return err instanceof Error ? err.message : "AI response validation failed";
}

function extractModelResponseText(response: {
  text: () => string;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
}): string {
  const parts = response.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts) && parts.length) {
    const visible = parts
      .filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text as string)
      .join("");
    if (visible) return visible;
  }
  return response.text();
}

async function callGeminiParsed<T>(
  apiKey: string,
  system: string,
  user: string,
  schema: z.ZodType<T>,
  normalize: (raw: unknown) => unknown,
  maxOutputTokens = MAX_OUTPUT_TOKENS,
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(user);
  const text = extractModelResponseText(result.response);
  const parsed = JSON.parse(extractJsonText(text));
  const data = schema.parse(normalize(parsed));
  const usage = result.response.usageMetadata;
  return {
    data,
    usage: {
      inputTokens: usage?.promptTokenCount ?? estimateTokens(user),
      outputTokens: usage?.candidatesTokenCount ?? estimateTokens(text),
    },
  };
}

async function callGemini(
  apiKey: string,
  system: string,
  user: string,
  _retrySuffix = "",
) {
  try {
    return await callGeminiParsed(
      apiKey,
      system,
      user,
      journeyProposalSchema,
      normalizeProposal,
      MAX_OUTPUT_TOKENS,
    );
  } catch (err) {
    throw new Error(formatValidationError(err));
  }
}

function normalizeOutline(raw: unknown) {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as { journeySummary?: unknown; modules?: Array<{ name?: unknown; description?: unknown }> };
  const modules = Array.isArray(obj.modules) ? obj.modules : [];
  return {
    journeySummary: clipString(obj.journeySummary, 200),
    modules: modules.slice(0, 8).map((mod) => ({
      name: clipString(mod?.name, 80),
      description: clipString(mod?.description, 120),
    })).filter((mod) => mod.name && mod.description),
  };
}

function normalizeModuleConcepts(raw: unknown, moduleIndex: number) {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as { concepts?: Array<{ id?: unknown; term?: unknown; definition?: unknown }> };
  const concepts = Array.isArray(obj.concepts) ? obj.concepts : [];
  return {
    concepts: concepts.slice(0, 10).map((concept, conceptIndex) => ({
      id: clipString(concept?.id, 32) || `c${conceptIndex + 1}`,
      term: clipString(concept?.term, 80),
      definition: clipString(concept?.definition, 80),
    })).filter((c) => c.term && c.definition).map((c, i) => ({
      ...c,
      id: `m${moduleIndex + 1}_${c.id || `c${i + 1}`}`,
    })),
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return errorResponse("GEMINI_API_KEY is not configured on the server.", 503);
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return errorResponse("Authentication required.", 401);
    }

    const userKey = user.email ?? user.id;
    if (!userKey) {
      return errorResponse("Authentication required.", 401);
    }

    const body = requestSchema.parse(await req.json());
    const { action, payload } = body;

    if (action === "proposeJourneyOutline") {
      const p = proposePayloadSchema.parse(payload);
      const userPrompt = JSON.stringify({
        task: "proposeJourneyOutline",
        title: wrapUserContent(p.title),
        subject: wrapUserContent(p.subject),
        priorKnowledge: wrapUserContent(p.priorKnowledge),
        material: wrapUserContent(p.material),
      });
      const estInput = estimateTokens(OUTLINE_SYSTEM + userPrompt);
      const quotaErr = await checkAndIncrementQuota(base44, userKey, "proposeJourney", estInput);
      if (quotaErr) return quotaErr;
      const { data, usage } = await callGeminiParsed(
        apiKey,
        OUTLINE_SYSTEM,
        userPrompt,
        journeyOutlineSchema,
        normalizeOutline,
        MAX_OUTPUT_TOKENS_OUTLINE,
      );
      return jsonResponse({ data, usage, _meta: { model: MODEL, build: DEPLOY_BUILD } });
    }

    if (action === "proposeModuleConcepts") {
      const p = proposeModuleConceptsPayloadSchema.parse(payload);
      const userPrompt = JSON.stringify({
        task: "proposeModuleConcepts",
        title: wrapUserContent(p.title),
        subject: wrapUserContent(p.subject),
        priorKnowledge: wrapUserContent(p.priorKnowledge),
        material: wrapUserContent(p.material.slice(0, 12_000)),
        journeySummary: wrapUserContent(p.journeySummary),
        module: p.module,
        moduleIndex: p.moduleIndex,
        moduleCount: p.moduleCount,
      });
      const estInput = estimateTokens(MODULE_CONCEPTS_SYSTEM + userPrompt);
      const skipQuota = p.moduleIndex > 0;
      if (!skipQuota) {
        const quotaErr = await checkAndIncrementQuota(base44, userKey, "proposeJourney", estInput);
        if (quotaErr) return quotaErr;
      }
      const { data, usage } = await callGeminiParsed(
        apiKey,
        MODULE_CONCEPTS_SYSTEM,
        userPrompt,
        moduleConceptsSchema,
        (raw) => normalizeModuleConcepts(raw, p.moduleIndex),
        MAX_OUTPUT_TOKENS_MODULE,
      );
      return jsonResponse({ data, usage, _meta: { model: MODEL, build: DEPLOY_BUILD } });
    }

    let system = PROPOSE_SYSTEM;
    let userPrompt = "";
    let quotaAction: "proposeJourney" | "regenerateModules" = "proposeJourney";

    if (action === "proposeJourney") {
      const p = proposePayloadSchema.parse(payload);
      userPrompt = JSON.stringify({
        task: "proposeJourney",
        title: wrapUserContent(p.title),
        subject: wrapUserContent(p.subject),
        priorKnowledge: wrapUserContent(p.priorKnowledge),
        material: wrapUserContent(p.material),
      });
    } else {
      const p = regeneratePayloadSchema.parse(payload);
      system = REGENERATE_SYSTEM;
      quotaAction = "regenerateModules";
      userPrompt = JSON.stringify({
        task: "regenerateModules",
        title: wrapUserContent(p.title),
        subject: wrapUserContent(p.subject),
        priorKnowledge: wrapUserContent(p.priorKnowledge),
        journeySummary: wrapUserContent(p.cachedKnowledgeMap.journeySummary),
        allConcepts: p.cachedKnowledgeMap.allConcepts,
      });
    }

    const estInput = estimateTokens(system + userPrompt);
    const quotaErr = await checkAndIncrementQuota(
      base44,
      userKey,
      quotaAction,
      estInput,
    );
    if (quotaErr) return quotaErr;

    const { data, usage } = await callGemini(apiKey, system, userPrompt);

    return jsonResponse({ data, usage, _meta: { model: MODEL, build: DEPLOY_BUILD } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.issues
        .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
        .join("; ");
      return errorResponse(`Invalid request: ${details}`, 400);
    }
    try {
      const base44 = createClientFromRequest(req);
      await logServerError(base44, "geminiJourney/handler", err);
    } catch {
      // ignore logging failures
    }
    const message = err instanceof Error ? err.message : "AI request failed";
    const status = message.includes("Authentication") ? 401 : 400;
    return errorResponse(message, status);
  }
});
