import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { z } from "npm:zod";
import { logServerError } from "../_shared/logServerError.ts";
import { INJECTION_GUARD, wrapUserContent, wrapConversationHistory } from "../_shared/promptSafety.ts";
// Inlined helpers — Base44 functions cannot import sibling local files.

const coercedAnswerSchema = z.preprocess(
  (val) => {
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return val.map((item) => String(item));
    return val;
  },
  z.union([z.string(), z.array(z.string())]),
);

const questionAiSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  stem: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: coercedAnswerSchema.optional(),
  explanation: z.string().optional(),
  conceptId: z.string().optional(),
  moduleId: z.string().optional(),
});

const questionsAiOutputSchema = z.object({
  questions: z.array(questionAiSchema).min(1).max(52),
});

const guideSectionAiSchema = z.object({
  sectionId: z.string().optional(),
  title: z.string().optional(),
  explanation: z.string().optional(),
  workedExamples: z.preprocess(
    (val) => {
      if (Array.isArray(val)) return val;
      if (val && typeof val === "object") return [val];
      return [];
    },
    z.array(z.object({
      scenario: z.string().optional(),
      steps: z.array(z.string()).optional(),
      answer: z.string().optional(),
      reasoning: z.string().optional(),
    })).optional(),
  ),
  checkInQuestion: z.object({
    question: z.string().optional(),
    stem: z.string().optional(),
    type: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctAnswer: coercedAnswerSchema.optional(),
    explanation: z.string().optional(),
  }).optional(),
  externalSearchSuggestions: z.array(z.string()).optional(),
  transitionText: z.string().optional(),
});

const guideAiOutputSchema = z.object({
  sections: z.array(guideSectionAiSchema).min(1).max(8),
  totalSections: z.number().optional(),
  estimatedMinutes: z.number().optional(),
});

const cardAiSchema = z.object({
  front: z.string().optional(),
  back: z.string().optional(),
  conceptTag: z.string().optional(),
});

const cardsAiOutputSchema = z.object({
  cards: z.array(cardAiSchema).min(1).max(100),
});

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
  if (start !== -1) {
    const end = trimmed.lastIndexOf("}");
    if (end > start) return trimmed.slice(start, end + 1);
    return trimmed.slice(start);
  }

  const arrStart = trimmed.indexOf("[");
  if (arrStart !== -1) {
    const arrEnd = trimmed.lastIndexOf("]");
    if (arrEnd > arrStart) return trimmed.slice(arrStart, arrEnd + 1);
    return trimmed.slice(arrStart);
  }

  return trimmed;
}

/** Close unclosed strings/brackets when Gemma truncates mid-JSON. */
function repairTruncatedJson(text: string) {
  let s = String(text ?? "").trim();
  if (!s) return s;

  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === "\"") inString = false;
      continue;
    }
    if (c === "\"") {
      inString = true;
      continue;
    }
    if (c === "{") stack.push("}");
    else if (c === "[") stack.push("]");
    else if (c === "}" || c === "]") {
      if (stack.length && stack[stack.length - 1] === c) stack.pop();
    }
  }

  if (inString) s += "\"";
  s = s.replace(/,\s*$/, "");

  while (stack.length) s += stack.pop();
  return s;
}

function parseJsonWithRepair(extracted: string, debug?: ReturnType<typeof createAiDebugTrace>) {
  try {
    const parsed = JSON.parse(extracted);
    debug?.record("json_parse", true, {
      ...payloadShapeSummary(parsed),
      extractedLength: extracted.length,
    });
    return parsed;
  } catch (parseErr) {
    const repaired = repairTruncatedJson(extracted);
    if (repaired !== extracted) {
      try {
        const parsed = JSON.parse(repaired);
        debug?.record("json_repair", true, {
          extractedLength: extracted.length,
          repairedLength: repaired.length,
          ...payloadShapeSummary(parsed),
        });
        return parsed;
      } catch {
        // fall through to original error
      }
    }
    debug?.record("json_parse", false, {
      fullRawText: extracted,
      textLength: extracted.length,
    }, parseErr instanceof Error ? parseErr.message : String(parseErr));
    throw parseErr;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function coerceQuestionItems(items: unknown[]) {
  return items.map((item, index) => {
    const q = asRecord(item) ?? {};
    const options = Array.isArray(q.options) ? q.options
      : Array.isArray(q.choices) ? q.choices
        : Array.isArray(q.answers) ? q.answers
          : undefined;
    const stem = q.stem ?? q.question ?? q.prompt ?? q.text ?? q.body ?? "";
    let correctAnswer = q.correctAnswer ?? q.answer ?? q.correct ?? q.solution;
    if (correctAnswer == null && Array.isArray(options) && options.length) {
      correctAnswer = options[0];
    }
    return {
      id: q.id ?? q.questionId ?? `q-${index + 1}`,
      type: q.type,
      stem,
      options,
      correctAnswer,
      explanation: q.explanation ?? q.rationale ?? q.reason ?? "",
      conceptId: q.conceptId ?? q.concept ?? q.concept_id,
      moduleId: q.moduleId ?? q.module_id ?? q.module,
    };
  }).filter((q) => String(q.stem ?? "").trim().length > 0);
}

function coerceWorkedExamples(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const rec = asRecord(value);
  if (rec) return [rec];
  return [];
}

function coerceSectionItems(items: unknown[]) {
  return items.map((item, index) => {
    const s = asRecord(item) ?? {};
    const checkIn = asRecord(s.checkInQuestion ?? s.checkIn ?? s.quiz ?? s.question) ?? {};
    return {
      sectionId: s.sectionId ?? s.id ?? `section-${index + 1}`,
      title: s.title ?? s.name ?? s.heading ?? `Section ${index + 1}`,
      explanation: s.explanation ?? s.content ?? s.body ?? s.summary ?? s.text ?? "",
      workedExamples: coerceWorkedExamples(
        s.workedExamples ?? s.examples ?? s.workedExample ?? s.example,
      ),
      checkInQuestion: {
        question: checkIn.question ?? checkIn.stem ?? checkIn.prompt ?? checkIn.text ?? "",
        type: checkIn.type,
        options: checkIn.options ?? checkIn.choices ?? checkIn.answers,
        correctAnswer: checkIn.correctAnswer ?? checkIn.answer ?? checkIn.correct ?? "",
        explanation: checkIn.explanation ?? checkIn.rationale ?? checkIn.reason ?? "",
      },
      externalSearchSuggestions: s.externalSearchSuggestions
        ?? s.youtubeSuggestions
        ?? s.searchSuggestions
        ?? [],
      transitionText: s.transitionText ?? s.transition ?? "",
    };
  });
}

function coerceCardItems(items: unknown[]) {
  return items.map((item) => {
    const c = asRecord(item) ?? {};
    return {
      front: c.front ?? c.term ?? c.question ?? c.prompt ?? "",
      back: c.back ?? c.definition ?? c.answer ?? c.meaning ?? "",
      conceptTag: c.conceptTag ?? c.concept ?? c.tag,
    };
  }).filter((c) => String(c.front ?? "").trim() && String(c.back ?? "").trim());
}

function coerceQuestionsPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return { questions: coerceQuestionItems(raw) };
  }

  const obj = asRecord(raw);
  if (!obj) return raw;

  let questions = obj.questions ?? obj.items ?? obj.problems;
  const inner = asRecord(obj.data);
  if (!Array.isArray(questions) && inner) {
    questions = inner.questions ?? inner.items;
  }
  if (!Array.isArray(questions)) return raw;

  return {
    ...obj,
    questions: coerceQuestionItems(questions),
  };
}

function coerceGuidePayload(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return { sections: coerceSectionItems(raw) };
  }

  const obj = asRecord(raw);
  if (!obj) return raw;

  let sections = obj.sections ?? obj.chapters ?? obj.parts;
  for (const key of ["guide", "learningGuide", "content"]) {
    const nested = asRecord(obj[key]);
    if (!Array.isArray(sections) && nested?.sections) sections = nested.sections;
  }
  const inner = asRecord(obj.data);
  if (!Array.isArray(sections) && inner?.sections) sections = inner.sections;
  if (!Array.isArray(sections)) return raw;

  return {
    ...obj,
    sections: coerceSectionItems(sections),
  };
}

function coerceCardsPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return { cards: coerceCardItems(raw) };
  }

  const obj = asRecord(raw);
  if (!obj) return raw;

  let cards = obj.cards ?? obj.flashcards ?? obj.deck ?? obj.items;
  const inner = asRecord(obj.data);
  if (!Array.isArray(cards) && inner) cards = inner.cards ?? inner.flashcards;
  if (!Array.isArray(cards)) return raw;

  return {
    ...obj,
    cards: coerceCardItems(cards),
  };
}

function coercePayloadForAction(action: string, raw: unknown): unknown {
  if (action === "generateLearningGuide") return coerceGuidePayload(raw);
  if (action === "generateFlashcards") return coerceCardsPayload(raw);
  if (
    action === "generatePracticeQuestions"
    || action === "generateDiagnosticQuestions"
    || action === "generateInterleavedQuestions"
    || action === "generateJourneyChallenge"
    || action === "generateCramSession"
  ) {
    return coerceQuestionsPayload(raw);
  }
  return raw;
}

function finalizeQuestion(
  q: z.infer<typeof questionAiSchema>,
  index: number,
  prefix = "q",
) {
  const stem = clipString(q.stem, 4000);
  if (!stem) return null;

  const type = q.type === "trueFalse" || q.type === "shortAnswer" ? q.type : "multipleChoice";
  let options = q.options;
  if (type === "trueFalse") {
    options = ["True", "False"];
  } else if (type === "multipleChoice") {
    options = [...(options ?? [])].map((o) => String(o).trim()).filter(Boolean);
    while (options.length < 4) options.push(`Option ${options.length + 1}`);
    options = options.slice(0, 4);
  }

  const correctAnswer = q.correctAnswer ?? options?.[0] ?? "Unknown";

  return {
    id: String(q.id ?? `${prefix}-${index + 1}`).trim(),
    type,
    stem,
    options,
    correctAnswer,
    explanation: String(q.explanation ?? "").trim(),
    conceptId: q.conceptId ? String(q.conceptId) : undefined,
    moduleId: q.moduleId ? String(q.moduleId) : undefined,
  };
}

function finalizeQuestionsOutput(
  raw: unknown,
  expectedCount: number,
  label = "questions",
) {
  const obj = raw as { questions?: z.infer<typeof questionAiSchema>[] };
  const list = Array.isArray(obj?.questions) ? obj.questions : [];
  if (!list.length) throw new Error(`AI returned no ${label}. Try again.`);

  const finalized = list
    .slice(0, expectedCount)
    .map((q, index) => finalizeQuestion(q, index, "q"))
    .filter((q): q is NonNullable<typeof q> => q != null);

  if (finalized.length < expectedCount) {
    throw new Error(`Generated ${finalized.length}/${expectedCount} ${label}. Try again.`);
  }

  return { questions: finalized };
}

function finalizeGuideOutput(raw: unknown) {
  const obj = raw as z.infer<typeof guideAiOutputSchema>;
  const sections = Array.isArray(obj?.sections) ? obj.sections : [];
  if (!sections.length) throw new Error("AI returned an empty learning guide.");

  const finalized = sections.slice(0, 6).map((section, index) => {
    const workedExamples = (section.workedExamples ?? []).slice(0, 1).map((ex) => ({
      scenario: clipString(ex.scenario, 500) || `Apply the ideas from section ${index + 1}.`,
      steps: (ex.steps ?? [])
        .map((s) => clipString(s, 300))
        .filter(Boolean)
        .slice(0, 6),
      answer: clipString(ex.answer, 300) || "See the steps above.",
      reasoning: clipString(ex.reasoning, 500) || "This example connects the section concepts to a concrete outcome.",
    }));

    while (workedExamples.length < 1) {
      workedExamples.push({
        scenario: `Apply the main ideas from "${clipString(section.title, 80) || `Section ${index + 1}`}".`,
        steps: ["Identify the key concept.", "Apply it to the scenario.", "State the conclusion."],
        answer: "A clear conclusion based on the section concepts.",
        reasoning: "Walking through a simple example helps lock in the core idea.",
      });
    }

    const checkIn = section.checkInQuestion ?? {};
    let options = (checkIn.options ?? []).map((o) => clipString(o, 200)).filter(Boolean);
    while (options.length < 4) options.push(`Option ${options.length + 1}`);
    options = options.slice(0, 4);

    const checkInStem = checkIn.question ?? (checkIn as { stem?: string }).stem ?? "";

    const suggestions = (section.externalSearchSuggestions ?? [])
      .map((s) => clipString(s, 120))
      .filter(Boolean)
      .slice(0, 3);

    return {
      sectionId: clipString(section.sectionId, 48) || `section-${index + 1}`,
      title: clipString(section.title, 120) || `Section ${index + 1}`,
      explanation: clipString(section.explanation, 4000) || "Review the module concepts for this section.",
      workedExamples,
      checkInQuestion: {
        question: clipString(checkInStem, 500) || "What is the main idea of this section?",
        type: "multipleChoice" as const,
        options,
        correctAnswer: clipString(checkIn.correctAnswer, 200) || options[0],
        explanation: clipString(checkIn.explanation, 500) || "Review the section explanation and worked example.",
      },
      externalSearchSuggestions: suggestions.length >= 2
        ? suggestions.slice(0, 2)
        : [
          `${clipString(section.title, 60) || "topic"} explained for beginners`,
          `${clipString(section.title, 60) || "topic"} worked examples`,
        ],
      transitionText: index < sections.length - 1
        ? clipString(section.transitionText, 300)
        : "",
    };
  });

  return {
    contentVersion: 1,
    sections: finalized,
    totalSections: finalized.length,
    estimatedMinutes: obj.estimatedMinutes ?? Math.max(8, finalized.length * 5),
  };
}

function finalizeCardsOutput(raw: unknown, expectedCount: number) {
  const obj = raw as { cards?: z.infer<typeof cardAiSchema>[] };
  const list = Array.isArray(obj?.cards) ? obj.cards : [];
  if (!list.length) throw new Error("AI returned no flashcards. Try again.");

  const finalized = list.slice(0, expectedCount || list.length).map((card, index) => ({
    front: clipString(card.front, 500),
    back: clipString(card.back, 500),
    conceptTag: card.conceptTag ? clipString(card.conceptTag, 80) : undefined,
  })).filter((c) => c.front && c.back);

  if (expectedCount > 0 && finalized.length < Math.min(expectedCount, 1)) {
    throw new Error(`Generated ${finalized.length}/${expectedCount} cards. Try again.`);
  }

  return { cards: finalized };
}

function aiSchemaForAction(action: string) {
  if (action === "generateLearningGuide") return guideAiOutputSchema;
  if (action === "generateFlashcards") return cardsAiOutputSchema;
  if (
    action === "generatePracticeQuestions"
    || action === "generateInterleavedQuestions"
    || action === "generateJourneyChallenge"
    || action === "generateCramSession"
  ) {
    return questionsAiOutputSchema;
  }
  return null;
}

function finalizeForAction(
  action: string,
  raw: unknown,
  payload: Record<string, unknown>,
) {
  if (action === "generateLearningGuide") return finalizeGuideOutput(raw);
  if (action === "generateFlashcards") {
    return finalizeCardsOutput(raw, Number(payload.cardCount ?? 0));
  }
  if (
    action === "generatePracticeQuestions"
    || action === "generateInterleavedQuestions"
    || action === "generateJourneyChallenge"
    || action === "generateCramSession"
  ) {
    const count = Number(payload.questionCount ?? 10);
    const label = action === "generateCramSession" ? "cram questions" : "questions";
    return finalizeQuestionsOutput(raw, count, label);
  }
  return raw;
}

function questionCountRetrySuffix(count: number) {
  return `\n\nReturn EXACTLY ${count} questions in { questions: [...] }. Each needs stem, correctAnswer, and explanation. JSON only.`;
}

const diagnosticQuestionAiSchema = questionAiSchema;

function finalizeDiagnosticQuestion(
  q: z.infer<typeof questionAiSchema>,
  moduleId: string,
  index: number,
) {
  const finalized = finalizeQuestion(q, index, `diag-${moduleId}`);
  if (!finalized) return null;
  return { ...finalized, moduleId };
}


type AiDebugStep = {
  at: string;
  step: string;
  ok: boolean;
  ms?: number;
  detail?: Record<string, unknown>;
  error?: string;
};

type AiDebugSnapshot = {
  enabled: boolean;
  steps: AiDebugStep[];
  lastRawGeminiText: string | null;
  lastParsedShape: Record<string, unknown> | null;
};

function createAiDebugTrace(enabled: boolean) {
  const steps: AiDebugStep[] = [];
  let lastRawGeminiText: string | null = null;
  let lastParsedShape: Record<string, unknown> | null = null;

  return {
    enabled,
    steps,
    get lastRawGeminiText() {
      return lastRawGeminiText;
    },
    setRawGeminiText(text: string) {
      if (!enabled) return;
      lastRawGeminiText = text;
    },
    setParsedShape(value: unknown) {
      if (!enabled) return;
      lastParsedShape = payloadShapeSummary(value);
    },
    record(
      step: string,
      ok: boolean,
      detail?: Record<string, unknown>,
      error?: string,
      ms?: number,
    ) {
      if (!enabled) return;
      steps.push({
        at: new Date().toISOString(),
        step,
        ok,
        ...(ms != null ? { ms } : {}),
        ...(detail ? { detail } : {}),
        ...(error ? { error } : {}),
      });
    },
    snapshot(): AiDebugSnapshot {
      return {
        enabled,
        steps,
        lastRawGeminiText,
        lastParsedShape,
      };
    },
  };
}

function stripDebugFlags(payload: Record<string, unknown>) {
  const rawDumpOnly = Boolean(payload.__rawDump);
  const debugEnabled = Boolean(payload.__debug) || rawDumpOnly;
  const clean = { ...payload };
  delete clean.__debug;
  delete clean.__rawDump;
  return { debugEnabled, rawDumpOnly, cleanPayload: clean };
}

/** @deprecated use stripDebugFlags */
function stripDebugFlag(payload: Record<string, unknown>) {
  const { debugEnabled, cleanPayload } = stripDebugFlags(payload);
  return { debugEnabled, cleanPayload };
}

function zodIssueSummary(err: unknown) {
  if (!err || typeof err !== "object" || !("issues" in err)) return undefined;
  const issues = (err as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
  return issues.slice(0, 8).map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

/** Gemma 4 may return internal "thought" parts — exclude them from JSON extraction. */
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

function payloadShapeSummary(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      sampleKeys: value[0] && typeof value[0] === "object"
        ? Object.keys(value[0] as object).slice(0, 12)
        : [],
    };
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return {
      type: "object",
      keys: Object.keys(obj).slice(0, 20),
      questions: Array.isArray(obj.questions) ? obj.questions.length : undefined,
      sections: Array.isArray(obj.sections) ? obj.sections.length : undefined,
      cards: Array.isArray(obj.cards) ? obj.cards.length : undefined,
    };
  }
  return { type: typeof value };
}


const MODEL = "gemma-4-31b-it";
const DEPLOY_BUILD = "inline-gemma-v5-json-repair-diag-split";
const MAX_OUTPUT_TOKENS = 4096;
const MAX_OUTPUT_TOKENS_SECTION = 3072;
const MAX_OUTPUT_TOKENS_DIAGNOSTIC = 2048;
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
  const payload = body && typeof body === "object" && !Array.isArray(body)
    ? { ...(body as Record<string, unknown>) }
    : { data: body };
  return Response.json({
    ...payload,
    _meta: { model: MODEL, build: DEPLOY_BUILD },
  }, { status });
}

function errorResponse(message: string, status = 400, debug?: ReturnType<typeof createAiDebugTrace>) {
  const snap: AiDebugSnapshot | undefined = debug?.enabled ? debug.snapshot() : undefined;
  return jsonResponse({
    error: { message, status },
    ...(snap?.lastRawGeminiText ? { rawGeminiText: snap.lastRawGeminiText } : {}),
    ...(snap ? { _debug: snap } : {}),
  }, status);
}

function debugExtras(debug?: ReturnType<typeof createAiDebugTrace>) {
  if (!debug?.enabled) return {};
  const snap = debug.snapshot();
  return {
    ...(snap.lastRawGeminiText ? { rawGeminiText: snap.lastRawGeminiText } : {}),
    _debug: snap,
  };
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
  opts?: { skipCooldown?: boolean; skipIncrement?: boolean },
) {
  const quota = await getOrCreateQuota(base44, userEmail);
  const now = Date.now();
  if (
    !opts?.skipCooldown
    && quota.lastCallAt
    && now - quota.lastCallAt < STUDY_LIMITS.cooldownSeconds * 1000
  ) {
    return errorResponse("Please wait a moment before another AI request.", 429);
  }
  const field = quotaFieldForAction(action);
  const current = (quota[field] as number) ?? 0;
  if (!opts?.skipIncrement && current >= limitForField(field)) {
    return errorResponse("Daily AI limit reached for this feature. Try again tomorrow.", 429);
  }
  if ((quota.inputTokens ?? 0) + estInput > STUDY_LIMITS.maxInputTokensPerDay) {
    return errorResponse("Daily AI token budget exceeded.", 429);
  }
  await base44.entities.UserAiQuota.update(quota.id, {
    lastCallAt: now,
    inputTokens: (quota.inputTokens ?? 0) + estInput,
    ...(opts?.skipIncrement ? {} : { [field]: current + 1 }),
  });
  return null;
}

async function callGeminiRaw(
  apiKey: string,
  system: string,
  user: string,
  debug?: ReturnType<typeof createAiDebugTrace>,
) {
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

  const started = Date.now();
  const result = await model.generateContent(user);
  const text = extractModelResponseText(result.response);
  debug?.setRawGeminiText(text);
  debug?.record("raw_dump", true, {
    textLength: text.length,
    note: "Validation skipped — full raw Gemini text returned to client.",
  }, undefined, Date.now() - started);

  const usage = result.response.usageMetadata;
  return {
    rawGeminiText: text,
    usage: {
      inputTokens: usage?.promptTokenCount ?? estimateTokens(user),
      outputTokens: usage?.candidatesTokenCount ?? estimateTokens(text),
    },
  };
}

async function callGeminiJson(
  apiKey: string,
  system: string,
  user: string,
  schema: z.ZodType,
  retrySuffix?: string,
  coerceAction?: string,
  debug?: ReturnType<typeof createAiDebugTrace>,
  maxAttempts = 2,
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

  const fallbackRetry = "\n\nReturn ONLY valid compact JSON. Use $...$ for LaTeX.";
  const attempts = maxAttempts <= 1
    ? [user]
    : [user, user + (retrySuffix ?? fallbackRetry)];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < attempts.length; attempt += 1) {
    const prompt = attempts[attempt];
    const attemptStart = Date.now();
    try {
      const result = await model.generateContent(prompt);
      const text = extractModelResponseText(result.response);
      debug?.setRawGeminiText(text);
      debug?.record("gemini_generateContent", true, {
        attempt: attempt + 1,
        textLength: text.length,
        preview: text.slice(0, 400),
      }, undefined, Date.now() - attemptStart);

      let parsed: unknown;
      try {
        const extracted = extractJsonText(text);
        parsed = parseJsonWithRepair(extracted, debug);
        debug?.setParsedShape(parsed);
      } catch (parseErr) {
        debug?.record("json_parse", false, {
          fullRawText: text,
          textLength: text.length,
        }, parseErr instanceof Error ? parseErr.message : String(parseErr));
        throw parseErr;
      }

      const beforeCoerce = parsed;
      if (coerceAction) {
        parsed = coercePayloadForAction(coerceAction, parsed);
        debug?.record("coerce_payload", true, {
          coerceAction,
          before: payloadShapeSummary(beforeCoerce),
          after: payloadShapeSummary(parsed),
        });
      }

      try {
        const data = schema.parse(parsed);
        debug?.record("schema_validate", true, payloadShapeSummary(data));
        const usage = result.response.usageMetadata;
        return {
          data,
          usage: {
            inputTokens: usage?.promptTokenCount ?? estimateTokens(prompt),
            outputTokens: usage?.candidatesTokenCount ?? estimateTokens(text),
          },
        };
      } catch (schemaErr) {
        debug?.record("schema_validate", false, {
          parsed: payloadShapeSummary(parsed),
          zodIssues: zodIssueSummary(schemaErr),
          fullRawText: text,
        }, schemaErr instanceof Error ? schemaErr.message : String(schemaErr));
        throw schemaErr;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      debug?.record("attempt_failed", false, { attempt: attempt + 1 }, lastError.message);
    }
  }
  throw lastError ?? new Error("AI validation failed");
}

const LATEX_RULE = "Use $...$ inline and $$...$$ block for math. Output JSON only.";

const JSON_STRICT_RULE = `JSON OUTPUT (strict — the app parser requires this exact shape):
- Return ONE JSON object only. No markdown fences, no prose before or after the JSON.
- Learning guides: { "sections": [ ... ], "totalSections": number, "estimatedMinutes": number } — "sections" MUST be a non-empty array at the top level.
- Quizzes/diagnostic: { "questions": [ ... ] } — each item uses stem, options, correctAnswer, explanation (not "question" or "answer" as the primary keys).
- Flashcards: { "cards": [ ... ] } — each item uses front and back.
- Diagnostic: every question MUST include moduleId exactly as provided in the prompt.
- Generate EXACTLY the requested counts. Do not wrap the payload inside extra keys like "data", "output", or "result".`;

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

${JSON_STRICT_RULE}

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

const LEARNING_GUIDE_SECTION_SYSTEM = `You are an expert study guide writer for Veridian. Generate ONE section only per request.

${LATEX_RULE}

${JSON_STRICT_RULE}

Output shape: { "sections": [ { single section object } ] } — exactly one item in sections.

Rules:
- Output ONLY valid JSON. No markdown.
- Teach from the provided concepts for this section only.
- explanation: 100–160 words, 2–3 short paragraphs separated by \\n\\n. Stay concise — finish the JSON.
- workedExamples: MUST be an array with exactly one object — [ { scenario, steps, answer, reasoning } ]. Keep each field brief (reasoning: 1–2 sentences).
- checkInQuestion: use key "stem" for the question text; multipleChoice with exactly 4 short options; explanation max 2 sentences.
- externalSearchSuggestions: exactly 1 short YouTube search query.
- transitionText: one short sentence previewing the next section (empty string if isLastSection is true).
- sectionId: short kebab-case slug unique within the module.

CRITICAL: Always close every string and brace. If running low on space, shorten explanation before truncating JSON.

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

${JSON_STRICT_RULE}

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

${JSON_STRICT_RULE}

Rules:
- Output ONLY valid JSON: { cards: [{ front, back, conceptTag? }] }.
- Generate EXACTLY the requested cardCount when enough source material exists.
- PRIORITY: userProvidedContent and parsedPairs first — module/journey context ONLY fills gaps.
- Match deckPurpose (definitions / conceptual / procedures / exam_facts).
- One concept per card. Atomic pairs. Fronts concise when possible.`;

const DIAGNOSTIC_SYSTEM = `You are designing a diagnostic assessment to measure true mastery — not guessability.

${LATEX_RULE}

${JSON_STRICT_RULE}

Rules:
- Output ONLY valid JSON: { questions: [...] }.
- Generate EXACTLY the requested number of questions for the ONE module in the input.
- Every question MUST include moduleId copied EXACTLY from the input (character-for-character).
- Each question MUST include conceptId from that module's concepts list.
- Questions must require understanding — plausible distractors, application scenarios, or multi-step reasoning.
- Avoid yes/no trivia, trick wording, and elimination-only questions.
- Prefer multipleChoice with exactly 4 options.
- Cover different concepts across the questions when possible.`;

const INTERLEAVED_SYSTEM = `You write mixed practice questions spanning multiple modules in one journey.

${LATEX_RULE}

${JSON_STRICT_RULE}

Rules:
- Output ONLY valid JSON: { questions: [...] }.
- Generate EXACTLY the requested questionCount.
- Tag each question with conceptId when possible.
- Mostly multipleChoice with 4 plausible options; some trueFalse.
- Require understanding — no trivia. JSON only.`;

const CHALLENGE_SYSTEM = `You write exam-style journey challenge questions across all modules.

${LATEX_RULE}

${JSON_STRICT_RULE}

Rules:
- Output ONLY valid JSON: { questions: [...] }.
- Generate EXACTLY the requested questionCount.
- Distribute questions according to moduleTargets in the payload (each question must match a target moduleId count).
- Each question MUST include moduleId and conceptId from that module's concepts list.
- Multi-step reasoning, plausible distractors, concise explanations. JSON only.`;

const CRAM_SYSTEM = `You write a cram quiz prioritizing weak and overdue material from selected modules.

${LATEX_RULE}

${JSON_STRICT_RULE}

Rules:
- Output ONLY valid JSON: { questions: [...] }.
- Generate EXACTLY the requested questionCount.
- Only use modules listed in selectedModuleIds / moduleMaps.
- Prioritize weakConceptIds and high-yield ideas from those modules.
- Each question MUST include moduleId and conceptId when possible.
- Fast to answer but not guessable. JSON only.`;

function diagnosticModuleSchema(count: number) {
  return z.object({
    questions: z.array(diagnosticQuestionAiSchema).min(1).max(count + 2),
  });
}

const guideSingleSectionOutputSchema = z.object({
  sections: z.array(guideSectionAiSchema).min(1).max(1),
});

type GuideConcept = { id: string; term: string; definition: string };

function conceptsForGuideSection(concepts: GuideConcept[], sectionIndex: number, sectionCount: number) {
  if (!concepts.length) return [];
  const size = Math.max(1, Math.ceil(concepts.length / sectionCount));
  const start = sectionIndex * size;
  return concepts.slice(start, start + size);
}

async function generateOneLearningGuideSection(
  apiKey: string,
  payload: Record<string, unknown>,
  sectionIndex: number,
  sectionCount: number,
  previousSectionTitle: string | null,
  debug?: ReturnType<typeof createAiDebugTrace>,
) {
  const concepts = (payload.concepts as GuideConcept[]) ?? [];
  const sectionConcepts = conceptsForGuideSection(concepts, sectionIndex, sectionCount);
  const isLastSection = sectionIndex === sectionCount - 1;

  const sectionPrompt = JSON.stringify({
    action: "generateLearningGuideSection",
    sectionIndex,
    sectionCount,
    isLastSection,
    moduleName: payload.moduleName,
    moduleDescription: payload.moduleDescription,
    subject: payload.subject,
    priorKnowledge: payload.priorKnowledge,
    concepts: sectionConcepts,
    previousSectionTitle,
  });

  const retrySuffix =
    `\n\nReturn EXACTLY one section in { "sections": [ {...} ] }. Section ${sectionIndex + 1} of ${sectionCount}. JSON only.`;

  const { data, usage } = await callGeminiJson(
    apiKey,
    LEARNING_GUIDE_SECTION_SYSTEM,
    sectionPrompt,
    guideSingleSectionOutputSchema,
    retrySuffix,
    "generateLearningGuide",
    debug,
    2,
    MAX_OUTPUT_TOKENS_SECTION,
  );

  const rawSection = data.sections[0];
  if (!rawSection) {
    throw new Error(`AI returned no content for section ${sectionIndex + 1}. Try again.`);
  }

  const finalized = finalizeGuideOutput({
    sections: [{
      ...rawSection,
      sectionId: rawSection.sectionId ?? `section-${sectionIndex + 1}`,
    }],
  });

  return {
    section: finalized.sections[0],
    usage,
  };
}

type DiagnosticModuleInput = {
  moduleId: string;
  name?: string;
  description?: string;
  concepts?: Array<{ id: string; term: string; definition: string }>;
};

async function generateDiagnosticQuestionsBatch(
  apiKey: string,
  payload: Record<string, unknown>,
  debug?: ReturnType<typeof createAiDebugTrace>,
) {
  const modules = (payload.modules as DiagnosticModuleInput[]) ?? [];
  const questionsPerModule = Number(payload.questionsPerModule ?? 3);
  if (!modules.length) throw new Error("Diagnostic requires at least one module.");
  if (!Number.isFinite(questionsPerModule) || questionsPerModule < 1) {
    throw new Error("Invalid questionsPerModule.");
  }

  debug?.record("diagnostic_batch_start", true, {
    moduleCount: modules.length,
    questionsPerModule,
  });

  const system = DIAGNOSTIC_SYSTEM;
  const schema = diagnosticModuleSchema(questionsPerModule);
  const allQuestions: Array<z.infer<typeof diagnosticQuestionSchema>> = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (const mod of modules) {
    if (!mod?.moduleId) throw new Error("Each module must include moduleId.");
    const concepts = mod.concepts ?? [];
    if (!concepts.length) {
      throw new Error(`Module "${mod.name ?? mod.moduleId}" has no concepts for diagnostic generation.`);
    }

    debug?.record("diagnostic_module_start", true, {
      moduleId: mod.moduleId,
      moduleName: mod.name,
      conceptCount: concepts.length,
    });

    const modulePrompt = JSON.stringify({
      action: "generateDiagnosticQuestions",
      title: payload.title,
      subject: payload.subject,
      priorKnowledge: payload.priorKnowledge,
      difficultyGuidance: payload.difficultyGuidance,
      questionsPerModule,
      modules: [{
        moduleId: mod.moduleId,
        name: mod.name,
        description: mod.description,
        concepts,
      }],
    });

    const retrySuffix =
      `\n\nReturn EXACTLY ${questionsPerModule} questions. Every question MUST use moduleId "${mod.moduleId}" exactly. JSON only.`;

    const { data, usage } = await callGeminiJson(
      apiKey,
      system,
      modulePrompt,
      schema,
      retrySuffix,
      "generateDiagnosticQuestions",
      debug,
      2,
      MAX_OUTPUT_TOKENS_DIAGNOSTIC,
    );
    const finalized = data.questions
      .slice(0, questionsPerModule)
      .map((q, index) => finalizeDiagnosticQuestion(q, mod.moduleId, index))
      .filter((q): q is z.infer<typeof diagnosticQuestionSchema> => q != null);

    debug?.record("diagnostic_module_finalize", finalized.length >= questionsPerModule, {
      moduleId: mod.moduleId,
      parsedCount: data.questions.length,
      finalizedCount: finalized.length,
      expected: questionsPerModule,
    }, finalized.length < questionsPerModule
      ? `Generated ${finalized.length}/${questionsPerModule} usable questions`
      : undefined);

    if (finalized.length < questionsPerModule) {
      throw new Error(
        `Generated ${finalized.length}/${questionsPerModule} questions for "${mod.name ?? mod.moduleId}". Try again.`,
      );
    }
    for (const q of finalized) {
      allQuestions.push(q);
    }
    inputTokens += usage.inputTokens;
    outputTokens += usage.outputTokens;
  }

  debug?.record("diagnostic_batch_complete", true, { totalQuestions: allQuestions.length });

  return {
    data: { questions: allQuestions },
    usage: { inputTokens, outputTokens },
  };
}

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
    generateDiagnosticQuestions: DIAGNOSTIC_SYSTEM,
    feynmanConversationTurn: FEYNMAN_TURN_SYSTEM,
    feynmanSummarizeConcept: FEYNMAN_SUMMARIZE_SYSTEM,
    gradeFreeRecall: FREE_RECALL_GRADE_SYSTEM,
    generateFreeRecallHint: FREE_RECALL_HINT_SYSTEM,
    generateInterleavedQuestions: INTERLEAVED_SYSTEM,
    generateJourneyChallenge: CHALLENGE_SYSTEM,
    generateConceptRefresher: `${base} Short inline concept recap under 150 words.`,
    generateCramSession: CRAM_SYSTEM,
  };
  return (map[action] ?? base) + INJECTION_GUARD;
}

function sanitizeStudyPayload(action: string, payload: Record<string, unknown>) {
  const out = { ...payload };
  const wrapKeys = [
    "userProvidedContent",
    "rawContent",
    "raw",
    "clarifyingAnswer",
    "studentResponse",
    "studentResponseSoFar",
    "moduleName",
    "conceptName",
    "cleanedText",
    "summary",
  ];
  for (const key of wrapKeys) {
    if (typeof out[key] === "string") out[key] = wrapUserContent(out[key]);
  }
  if (action === "feynmanConversationTurn" && Array.isArray(out.conversationHistory)) {
    out.conversationHistory = wrapConversationHistory(
      out.conversationHistory as Array<{ role?: string; text?: string }>,
    );
  }
  if (Array.isArray(out.cards)) {
    out.cards = (out.cards as Array<{ front?: unknown; back?: unknown }>).map((card) => ({
      ...card,
      front: typeof card.front === "string" ? wrapUserContent(card.front) : card.front,
      back: typeof card.back === "string" ? wrapUserContent(card.back) : card.back,
    }));
  }
  return out;
}

function schemaForAction(action: string) {
  const aiSchema = aiSchemaForAction(action);
  if (aiSchema) return aiSchema;
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

function retrySuffixForAction(action: string, payload: Record<string, unknown>) {
  if (action === "generateLearningGuide") {
    return "\n\nReturn ONLY valid JSON with sections array. Each section needs explanation, workedExamples, checkInQuestion with 4 options, and 2 externalSearchSuggestions.";
  }
  const count = Number(payload.questionCount ?? 0);
  if (count > 0 && aiSchemaForAction(action)) {
    return questionCountRetrySuffix(count);
  }
  return undefined;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  let debug = createAiDebugTrace(false);

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return errorResponse("GEMINI_API_KEY is not configured.", 503);

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
    const { action, payload: rawPayload } = body;
    const { debugEnabled, rawDumpOnly, cleanPayload } = stripDebugFlags(rawPayload as Record<string, unknown>);
    const payload = cleanPayload;
    debug = createAiDebugTrace(debugEnabled);

    debug.record("request_received", true, {
      action,
      model: MODEL,
      build: DEPLOY_BUILD,
      rawDumpOnly,
      payloadKeys: Object.keys(payload),
    });

    if (action === "generateDiagnosticQuestions") {
      const estInput = estimateTokens(JSON.stringify(payload));
      const moduleIndex = Number(payload.moduleIndex ?? 0);
      const quotaOpts = Number.isFinite(moduleIndex) && moduleIndex > 0
        ? { skipCooldown: true, skipIncrement: true }
        : undefined;
      const quotaErr = await checkStudyQuota(base44, userKey, action, estInput, quotaOpts);
      if (quotaErr) return quotaErr;

      const result = await generateDiagnosticQuestionsBatch(apiKey, payload, debug);
      debug.record("response_ready", true, { questionCount: result.data.questions.length });
      return jsonResponse({
        data: result.data,
        usage: result.usage,
        ...debugExtras(debug),
      });
    }

    if (action === "generateLearningGuide" && !rawDumpOnly) {
      const estInput = estimateTokens(JSON.stringify(payload));
      const sectionOnly = payload.sectionOnly === true;
      const sectionIndex = Number(payload.sectionIndex);
      const quotaOpts = sectionOnly && sectionIndex > 0
        ? { skipCooldown: true, skipIncrement: true }
        : undefined;
      const quotaErr = await checkStudyQuota(base44, userKey, action, estInput, quotaOpts);
      if (quotaErr) return quotaErr;

      if (sectionOnly && Number.isFinite(sectionIndex)) {
        const sectionCount = Math.min(5, Math.max(1, Number(payload.sectionCount ?? 3)));
        const { section, usage } = await generateOneLearningGuideSection(
          apiKey,
          payload,
          sectionIndex,
          sectionCount,
          typeof payload.previousSectionTitle === "string" ? payload.previousSectionTitle : null,
          debug,
        );
        debug.record("response_ready", true, { sectionIndex, title: section.title });
        return jsonResponse({
          data: { section, sectionIndex, sectionCount },
          usage,
          ...debugExtras(debug),
        });
      }

      return errorResponse(
        "Learning guides must be generated one section per request (sectionOnly + sectionIndex). "
        + "Publish the latest Veridian site — older clients trigger a server timeout.",
        400,
      );
    }

    const system = buildSystem(action);
    const safePayload = sanitizeStudyPayload(action, payload as Record<string, unknown>);
    const userPrompt = JSON.stringify({ action, ...safePayload }).slice(0, 32_000);
    const estInput = estimateTokens(system + userPrompt);

    const quotaErr = await checkStudyQuota(base44, userKey, action, estInput);
    if (quotaErr) return quotaErr;

    if (rawDumpOnly) {
      debug.record("raw_dump_mode", true, { action, note: "Skipping parse, coerce, validate, finalize." });
      const { rawGeminiText, usage } = await callGeminiRaw(apiKey, system, userPrompt, debug);
      return jsonResponse({
        data: { rawGeminiText, action, parsedSkipped: true },
        rawGeminiText,
        usage,
        ...debugExtras(debug),
      });
    }

    const schema = schemaForAction(action);
    const retrySuffix = retrySuffixForAction(action, payload);
    const { data: raw, usage } = await callGeminiJson(
      apiKey,
      system,
      userPrompt,
      schema,
      retrySuffix,
      action,
      debug,
    );

    let data: unknown;
    try {
      data = aiSchemaForAction(action)
        ? finalizeForAction(action, raw, payload)
        : raw;
      debug.record("finalize", true, payloadShapeSummary(data));
    } catch (finalizeErr) {
      debug.record("finalize", false, payloadShapeSummary(raw), finalizeErr instanceof Error
        ? finalizeErr.message
        : String(finalizeErr));
      throw finalizeErr;
    }

    debug.record("response_ready", true, payloadShapeSummary(data));
    return jsonResponse({
      data,
      usage,
      ...debugExtras(debug),
    });
  } catch (err) {
    let message = "AI request failed";
    if (err instanceof z.ZodError) {
      const issue = err.issues[0];
      const path = issue?.path?.length ? issue.path.join(".") : "response";
      message = `AI returned an invalid format (${path}). Try again.`;
    } else if (err instanceof Error) {
      message = err.message;
    }
    debug.record("handler_error", false, { message }, message);
    if (!(err instanceof z.ZodError)) {
      try {
        const base44 = createClientFromRequest(req);
        await logServerError(base44, "geminiStudy/handler", err, { message });
      } catch {
        // ignore logging failures
      }
    }
    return errorResponse(message, 400, debug.enabled ? debug : undefined);
  }
});
