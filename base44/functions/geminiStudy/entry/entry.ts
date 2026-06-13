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
  "parseQuizletImport",
  "extractDeckSource",
  "findFlashcardDuplicates",
  "applyDeckAiEdit",
  "generateDiagnosticQuestions",
  "feynmanConversationTurn",
  "feynmanSummarizeConcept",
  "gradeFreeRecall",
  "generateFreeRecallHint",
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

const diagnosticQuestionSchema = questionSchema.extend({
  moduleId: z.string(),
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
  if (
    action.includes("Flashcard")
    || action.includes("Deck")
    || action === "parseQuizletImport"
    || action === "extractDeckSource"
    || action === "applyDeckAiEdit"
    || action === "generateFlashcards"
  ) return "flashcardGenerations";
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
  explanation: z.string().min(200),
  workedExamples: z.array(z.object({
    scenario: z.string().min(10),
    steps: z.array(z.string().min(5)).min(3).max(6),
    answer: z.string().min(5),
    reasoning: z.string().min(20),
  })).min(1).max(1),
  checkInQuestion: z.object({
    question: z.string().min(10),
    type: z.literal("multipleChoice"),
    options: z.array(z.string()).min(4).max(4),
    correctAnswer: z.string(),
    explanation: z.string().min(10),
  }),
  externalSearchSuggestions: z.array(z.string()).min(2).max(3),
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

const diagnosticOutputSchema = z.object({
  questions: z.array(diagnosticQuestionSchema).min(3).max(48),
});

const cardsOutputSchema = z.object({
  cards: z.array(z.object({
    front: z.string(),
    back: z.string(),
    conceptTag: z.string().optional(),
  })).min(1).max(100),
});

const quizletParseSchema = z.object({
  pairs: z.array(z.object({ front: z.string(), back: z.string() })).min(1),
});

const extractDeckSourceSchema = z.object({
  cleanedText: z.string().min(20),
  summary: z.string(),
});

const duplicateGroupsSchema = z.object({
  groups: z.array(z.object({
    cardIndexes: z.array(z.number().int().min(0)).min(2),
    reason: z.string(),
  })),
});

const deckAiEditSchema = z.object({
  message: z.string(),
  cards: z.array(z.object({
    cardId: z.string().optional(),
    front: z.string(),
    back: z.string(),
    conceptTag: z.string().optional(),
    deleted: z.boolean().optional(),
  })).optional(),
  needsClarification: z.boolean().optional(),
  clarifyingQuestion: z.string().optional(),
});

const feynmanTurnOutputSchema = z.object({
  reply: z.string(),
  readyToComplete: z.boolean(),
});

const feynmanConceptSummarySchema = z.object({
  confidencePercent: z.number().min(0).max(100),
  thoroughness: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestedNextSteps: z.array(z.string()),
});

const freeRecallOutputSchema = z.object({
  coveragePercent: z.number().min(0).max(100),
  coverageEstimate: z.string(),
  missedIdeas: z.array(z.string()),
  incorrectIdeas: z.array(z.string()),
  hintsUsedNote: z.string(),
  nextConceptToRevisit: z.string(),
  feedback: z.string(),
});

const freeRecallHintOutputSchema = z.object({
  hint: z.string(),
  tier: z.number().min(1).max(3),
});

const refresherOutputSchema = z.object({
  recap: z.string(),
  example: z.string(),
});

const LEARNING_GUIDE_SYSTEM = `You are an expert study guide writer for Veridian, a learning app.

Produce JSON for a sectioned learning guide. Explanation text is the PRIMARY teaching surface — write thoroughly in plain language. Do NOT generate images, SVG, or illustration descriptions; the app renders simple decorative art automatically beside the text.

${LATEX_RULE}

Rules:
- Output ONLY valid JSON matching the schema. No markdown.
- Teach from the provided module concepts only — do not invent unsupported facts.
- Each section must stand alone but flow into the next via transitionText.

EXPLANATION (most important):
- 280–380 words per section, 4–6 paragraphs separated by \\n\\n.
- Full sentences (UI splits on . ! ? for zigzag layout — aim for 8–14 sentences).
- Define key terms inline; use analogies and concrete examples.

WORKED EXAMPLE (exactly one per section):
- scenario: specific realistic problem (1–3 sentences).
- steps: 3–5 ordered solution steps, one clear action each.
- answer: final result in plain language.
- reasoning: 2–3 sentences tying back to concepts — what to learn and why it works.

CHECK-IN: type "multipleChoice" with exactly 4 options. Correct answer must be supported by the explanation and worked example. Distractors = plausible misconceptions. Fair but not trivial.

YOUTUBE: exactly 2 externalSearchSuggestions — short YouTube-friendly queries, not URLs.

TRANSITION: transitionText (1–2 sentences) on all sections except the last.

Do NOT include narrationText.`;

const FREE_RECALL_HINT_SYSTEM = `You are a study tutor helping a student during a free-recall brain dump for ONE module.

The student writes everything they remember without notes. You provide progressive hints — never full answers or complete explanations.

Rules:
- Output ONLY valid JSON: { hint: string, tier: number }.
- tier MUST match the requested tier (1, 2, or 3).
- Use $...$ for inline math when needed.
- Stay under 80 words per hint. Be token-efficient.

Tier 1 — Concept nudge:
- Name 2–4 concept areas or themes from the knowledge map that belong in a complete recall.
- Lightly orient based on studentResponseSoFar: acknowledge what they touched, nudge toward gaps — do NOT repeat their wording.

Tier 2 — Key terms:
- Provide 3–5 key terms from the module they could weave into their response.
- Terms should build on tier 1 and what they have written; avoid terms they already used correctly.

Tier 3 — Framework scaffold:
- Give 2–3 sentences outlining how a strong recall could be structured (e.g. "Start with X, then connect Y to Z…").
- Still do not write the answer for them — only a skeleton they can fill in.

Never list every concept. Never grade. Never mention tier numbers in the hint text.`;

const FREE_RECALL_GRADE_SYSTEM = `You are a supportive study coach grading a free-recall brain dump against a module knowledge map.

Rules:
- Output ONLY valid JSON matching the schema.
- Use $...$ for inline math when needed.
- Be truthful but kind — help the student see gaps without being harsh or sarcastic.
- feedback: MAX 2 short paragraphs (~120 words total). Friendly, specific, actionable.
- coveragePercent: 0–100 based on how thoroughly the response covers the module's important concepts.
- coverageEstimate: one short phrase (e.g. "Solid core with notable gaps" or "Partial — key ideas missing").
- missedIdeas: 2–6 important concepts or ideas they omitted (short phrases).
- incorrectIdeas: 0–4 misconceptions or errors (empty array if none).
- hintsUsedNote: one sentence on whether hints suggest partial recall vs independent knowledge.
- nextConceptToRevisit: the single best concept term to study next.

Grade against the knowledge map only — do not invent module content.`;

const FEYNMAN_TURN_SYSTEM = `You are a curious student in a Feynman Technique tutoring session on Veridian. The human is teaching YOU the concept — stay in character as an eager learner who asks sharp, friendly questions.

Rules:
- Output ONLY valid JSON matching the schema.
- Use $...$ for inline math when needed.
- reply: 2–4 sentences MAX. Conversational, warm, never lecturing. Ask ONE focused follow-up when gaps remain.
- Act like a student: "I'm still fuzzy on…", "So does that mean…?", "Wait, how does X connect to Y?"
- Each turn, internally assess: missing pieces, vagueness, misconceptions, weakest point in their explanation so far.
- Reflect those gaps naturally in your reply — do not list bullet labels or say "missing pieces:".
- readyToComplete: true when they show decent understanding (be lenient — core idea + key relationships is enough; perfection not required).
- On turn 5 (turnNumber === 5), wrap up warmly and set readyToComplete true unless they said almost nothing.
- Never reveal you are grading. Never dump the knowledge map definition verbatim.
- If they have a misconception, gently probe with a question rather than correcting harshly.

Stay concise and token-efficient.`;

const FEYNMAN_SUMMARIZE_SYSTEM = `You are a supportive study coach summarizing one Feynman Technique conversation for a single concept.

Rules:
- Output ONLY valid JSON matching the schema.
- Use $...$ for inline math when needed.
- Grade against the concept definition and module knowledge map — be fair and lenient.
- confidencePercent: 0–100 for how well they could teach this concept.
- thoroughness: one short phrase (e.g. "Solid overview, light on examples").
- strengths: 2–4 short phrases.
- weaknesses: 1–4 gaps or weak spots (empty only if truly none).
- suggestedNextSteps: 2–3 actionable, specific next steps.
- Be encouraging but honest.`;

const PRACTICE_QUIZ_SYSTEM = `You are an expert exam-prep question writer for Veridian.

Generate fresh practice quiz questions for ONE module within a larger journey. Questions must test understanding — not trivia or trick wording.

${LATEX_RULE}

Rules:
- Output ONLY valid JSON. No markdown.
- Generate EXACTLY the requested questionCount — no more, no less.
- Every question MUST include conceptId from the provided concepts list.
- Each question needs a unique id (short slug + index).
- NEVER repeat or lightly rephrase avoidQuestionIds or avoidStemPreviews.
- Mostly multipleChoice with exactly 4 plausible options; some trueFalse; occasional shortAnswer.
- Include concise explanation (1–2 sentences) per question.
- Follow focusGuidance for concept distribution (fullReview / weakSpots / newMaterial).
- Match difficulty to moduleStage. Be concise in stems — high quality, token-efficient.`;

const GENERATE_FLASHCARDS_SYSTEM = `You generate flashcard decks for Veridian.

${LATEX_RULE}

Rules:
- Output ONLY valid JSON: { cards: [{ front, back, conceptTag? }] }.
- Generate EXACTLY the requested cardCount when enough source material exists.
- PRIORITY: userProvidedContent and parsedPairs first — module/journey context ONLY fills gaps.
- Match deckPurpose (definitions / conceptual / procedures / exam_facts).
- One concept per card. Atomic pairs. Fronts concise when possible.`;

function buildSystem(action: string) {
  const base = `You are a study tutor. ${LATEX_RULE}`;
  const map: Record<string, string> = {
    generateLearningGuide: LEARNING_GUIDE_SYSTEM,
    generatePracticeQuestions: PRACTICE_QUIZ_SYSTEM,
    generateFlashcards: GENERATE_FLASHCARDS_SYSTEM,
    parseQuizletImport: `${base} Parse Quizlet-style imports into { pairs: [{ front, back }] }. Output JSON only. Do not invent content.`,
    extractDeckSource: `${base} Extract testable source from raw text into { cleanedText, summary }. Do not generate flashcards yet.`,
    findFlashcardDuplicates: `${base} Find groups of cards testing the same knowledge. Output { groups: [{ cardIndexes, reason }] }. Indexes are 0-based.`,
    applyDeckAiEdit: `${base} Apply a deck edit action. Output { message, cards?, needsClarification?, clarifyingQuestion? }. Keep message under 40 words, friendly.`,
    generateDiagnosticQuestions: `${base} Design a diagnostic assessment measuring true mastery (not guessability). Generate EXACTLY 3 questions per module in the input. Every question MUST include moduleId copied exactly from input modules. Each question MUST include conceptId from that module's concepts. Cover different concepts per module. Require understanding — plausible distractors, application scenarios, or multi-step reasoning. Avoid trivia and elimination-only questions. Prefer multipleChoice with 4 options.`,
    feynmanConversationTurn: FEYNMAN_TURN_SYSTEM,
    feynmanSummarizeConcept: FEYNMAN_SUMMARIZE_SYSTEM,
    gradeFreeRecall: FREE_RECALL_GRADE_SYSTEM,
    generateFreeRecallHint: FREE_RECALL_HINT_SYSTEM,
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
  if (action === "parseQuizletImport") return quizletParseSchema;
  if (action === "extractDeckSource") return extractDeckSourceSchema;
  if (action === "findFlashcardDuplicates") return duplicateGroupsSchema;
  if (action === "applyDeckAiEdit") return deckAiEditSchema;
  if (action === "feynmanConversationTurn") return feynmanTurnOutputSchema;
  if (action === "feynmanSummarizeConcept") return feynmanConceptSummarySchema;
  if (action === "gradeFreeRecall") return freeRecallOutputSchema;
  if (action === "generateFreeRecallHint") return freeRecallHintOutputSchema;
  if (action === "generateConceptRefresher") return refresherOutputSchema;
  if (action === "generateDiagnosticQuestions") return diagnosticOutputSchema;
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
