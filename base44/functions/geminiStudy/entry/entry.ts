import { createClientFromRequest } from "npm:@base44/sdk";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { z } from "npm:zod";

const MODEL = "gemini-2.5-flash-lite";
const MAX_OUTPUT_TOKENS = 4096;
const TEMPERATURE = 0.2;

const STUDY_LIMITS = {
  quizGenerationsPerDay: 20,
  guideGenerationsPerDay: 10,
  gradingCallsPerDay: 30,
  flashcardGenerationsPerDay: 15,
  maxInputTokensPerDay: 200_000,
  cooldownSeconds: 15,
};

const ACTIONS = [
  "generateLearningGuide",
  "generatePracticeQuestions",
  "generateFlashcards",
  "gradeFeynman",
  "gradeFreeRecall",
  "generateSynthesisQuestions",
  "generateInterleavedQuestions",
  "generateJourneyChallenge",
  "generateConceptRefresher",
  "generateCramSession",
] as const;

const requestSchema = z.object({
  action: z.enum(ACTIONS),
  payload: z.record(z.unknown()),
  devBypassQuota: z.boolean().optional(),
});

const conceptSchema = z.object({
  id: z.string(),
  term: z.string(),
  definition: z.string(),
});

const questionSchema = z.object({
  id: z.string(),
  type: z.string(),
  stem: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string(),
  conceptId: z.string().optional(),
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

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
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
    quizGenerations: 0,
    guideGenerations: 0,
    gradingCalls: 0,
    flashcardGenerations: 0,
  });
}

function quotaFieldForAction(action: string) {
  if (action.includes("Guide")) return "guideGenerations";
  if (action.includes("Flashcard")) return "flashcardGenerations";
  if (action.startsWith("grade")) return "gradingCalls";
  if (action.includes("Questions") || action.includes("Challenge") || action.includes("Cram")) {
    return "quizGenerations";
  }
  return "quizGenerations";
}

function limitForField(field: string) {
  if (field === "guideGenerations") return STUDY_LIMITS.guideGenerationsPerDay;
  if (field === "gradingCalls") return STUDY_LIMITS.gradingCallsPerDay;
  if (field === "flashcardGenerations") return STUDY_LIMITS.flashcardGenerationsPerDay;
  return STUDY_LIMITS.quizGenerationsPerDay;
}

async function checkStudyQuota(
  base44: ReturnType<typeof createClientFromRequest>,
  userEmail: string,
  action: string,
  estInput: number,
  devBypass: boolean,
) {
  if (devBypass) return null;
  const quota = await getOrCreateQuota(base44, userEmail);
  const now = Date.now();
  if (quota.lastCallAt && now - quota.lastCallAt < STUDY_LIMITS.cooldownSeconds * 1000) {
    return errorResponse("Please wait a moment before another AI request.", 429);
  }
  const field = quotaFieldForAction(action);
  const current = (quota[field] as number) ?? 0;
  if (current >= limitForField(field)) {
    return errorResponse("Daily AI limit reached for this feature. Try again tomorrow.", 429);
  }
  if ((quota.inputTokens ?? 0) + estInput > STUDY_LIMITS.maxInputTokensPerDay) {
    return errorResponse("Daily AI token budget exceeded.", 429);
  }
  await base44.entities.UserAiQuota.update(quota.id, {
    lastCallAt: now,
    inputTokens: (quota.inputTokens ?? 0) + estInput,
    [field]: current + 1,
  });
  return null;
}

async function callGeminiJson(apiKey: string, system: string, user: string, schema: z.ZodType) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
    },
  });

  const attempts = [user, user + "\n\nReturn ONLY valid compact JSON. Use $...$ for LaTeX."];
  let lastError: Error | null = null;

  for (const prompt of attempts) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      const data = schema.parse(parsed);
      const usage = result.response.usageMetadata;
      return {
        data,
        usage: {
          inputTokens: usage?.promptTokenCount ?? estimateTokens(prompt),
          outputTokens: usage?.candidatesTokenCount ?? estimateTokens(text),
        },
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error("AI validation failed");
}

const LATEX_RULE = "Use $...$ inline and $$...$$ block for math. Output JSON only.";

const guideSectionSchema = z.object({
  sectionId: z.string(),
  title: z.string(),
  explanation: z.string(),
  workedExamples: z.array(z.object({
    scenario: z.string(),
    steps: z.array(z.string()),
    answer: z.string(),
    reasoning: z.string(),
  })).optional(),
  checkInQuestion: z.object({
    question: z.string(),
    type: z.string(),
    options: z.array(z.string()).nullable().optional(),
    correctAnswer: z.string(),
    explanation: z.string(),
  }),
  externalSearchSuggestions: z.array(z.string()).optional(),
  narrationText: z.string().optional(),
  transitionText: z.string().optional(),
});

const guideOutputSchema = z.object({
  sections: z.array(guideSectionSchema).min(1).max(6),
  totalSections: z.number(),
  estimatedMinutes: z.number(),
});

const questionsOutputSchema = z.object({
  questions: z.array(questionSchema).min(1).max(50),
});

const cardsOutputSchema = z.object({
  cards: z.array(z.object({
    front: z.string(),
    back: z.string(),
    conceptTag: z.string().optional(),
  })).min(1).max(30),
});

const feynmanOutputSchema = z.object({
  aiFeedback: z.string(),
  missingConcepts: z.array(z.string()).optional(),
  misconceptionsDetected: z.array(z.string()).optional(),
  weakestPoint: z.string(),
  followUpQuestion: z.string(),
  overallConfidenceRating: z.enum(["strong", "partial", "weak"]),
});

const freeRecallOutputSchema = z.object({
  coveragePercent: z.number().min(0).max(100),
  conceptsCovered: z.array(z.string()).optional(),
  conceptsMissed: z.array(z.string()).optional(),
  incorrectIdeas: z.array(z.string()).optional(),
  aiGradingSummary: z.string(),
  nextConceptRecommendation: z.string(),
});

const refresherOutputSchema = z.object({
  recap: z.string(),
  example: z.string(),
});

function buildSystem(action: string) {
  const base = `You are a study tutor. ${LATEX_RULE}`;
  const map: Record<string, string> = {
    generateLearningGuide: `${base} Create sectioned learning guide JSON for complete beginners (max 6 sections). Each section: title; explanation as 3-5 short paragraphs (200-350 words total) teaching concepts from scratch with plain language, analogies, and key terms defined inline; optional workedExamples for quantitative/applied topics; one multipleChoice checkInQuestion; 2-3 externalSearchSuggestions (YouTube-friendly queries); optional transitionText bridging to the next section. Teach thoroughly — assume zero prior knowledge. Do not summarize in one paragraph.`,
    generatePracticeQuestions: `${base} Generate varied quiz questions from knowledge map. Never repeat provided questionIds.`,
    generateFlashcards: `${base} Generate atomic front/back flashcard pairs.`,
    gradeFeynman: `${base} Grade student explanation. Identify weakest point and one follow-up question.`,
    gradeFreeRecall: `${base} Grade free recall against knowledge map. Return coverage percent and gaps.`,
    generateSynthesisQuestions: `${base} Cross-module integration questions.`,
    generateInterleavedQuestions: `${base} Mixed questions from multiple modules.`,
    generateJourneyChallenge: `${base} Exam-wide challenge questions across modules.`,
    generateConceptRefresher: `${base} Short inline concept recap under 150 words.`,
    generateCramSession: `${base} Prioritize weak/overdue concepts in question set.`,
  };
  return map[action] ?? base;
}

function schemaForAction(action: string) {
  if (action === "generateLearningGuide") return guideOutputSchema;
  if (action === "generateFlashcards") return cardsOutputSchema;
  if (action === "gradeFeynman") return feynmanOutputSchema;
  if (action === "gradeFreeRecall") return freeRecallOutputSchema;
  if (action === "generateConceptRefresher") return refresherOutputSchema;
  return questionsOutputSchema;
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return errorResponse("GEMINI_API_KEY is not configured.", 503);

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return errorResponse("Authentication required.", 401);

    const body = requestSchema.parse(await req.json());
    const { action, payload, devBypassQuota = false } = body;

    const system = buildSystem(action);
    const userPrompt = JSON.stringify({ action, ...payload }).slice(0, 32_000);
    const estInput = estimateTokens(system + userPrompt);

    const quotaErr = await checkStudyQuota(base44, user.email, action, estInput, devBypassQuota);
    if (quotaErr) return quotaErr;

    const { data, usage } = await callGeminiJson(apiKey, system, userPrompt, schemaForAction(action));
    return jsonResponse({ data, usage });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return errorResponse(message, 400);
  }
});
