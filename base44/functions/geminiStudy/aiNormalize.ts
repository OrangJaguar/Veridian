import { z } from "npm:zod";

/** Source copy for merge into ../entry.ts — not imported at runtime on Base44. */

export const coercedAnswerSchema = z.preprocess(
  (val) => {
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return val.map((item) => String(item));
    return val;
  },
  z.union([z.string(), z.array(z.string())]),
);

export const questionAiSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  stem: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: coercedAnswerSchema.optional(),
  explanation: z.string().optional(),
  conceptId: z.string().optional(),
  moduleId: z.string().optional(),
});

export const questionsAiOutputSchema = z.object({
  questions: z.array(questionAiSchema).min(1).max(52),
});

export const guideSectionAiSchema = z.object({
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
    type: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    explanation: z.string().optional(),
  }).optional(),
  keyTerms: z.array(z.object({
    term: z.string().optional(),
    definition: z.string().optional(),
  })).optional(),
  takeaways: z.array(z.string()).optional(),
});

export const guideAiOutputSchema = z.object({
  sections: z.array(guideSectionAiSchema).min(1).max(8),
  totalSections: z.number().optional(),
  estimatedMinutes: z.number().optional(),
});

export const cardAiSchema = z.object({
  front: z.string().optional(),
  back: z.string().optional(),
  conceptTag: z.string().optional(),
});

export const cardsAiOutputSchema = z.object({
  cards: z.array(cardAiSchema).min(1).max(100),
});

export function clipString(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() : text;
}

export function extractJsonText(raw: string) {
  const trimmed = String(raw ?? "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);

  const arrStart = trimmed.indexOf("[");
  const arrEnd = trimmed.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) return trimmed.slice(arrStart, arrEnd + 1);

  return trimmed;
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

export function coerceQuestionsPayload(raw: unknown): unknown {
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

export function coerceGuidePayload(raw: unknown): unknown {
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

export function coerceCardsPayload(raw: unknown): unknown {
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

export function coercePayloadForAction(action: string, raw: unknown): unknown {
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

export function finalizeQuestion(
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

export function finalizeQuestionsOutput(
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

export function finalizeGuideOutput(raw: unknown) {
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

    const keyTerms = (section.keyTerms ?? [])
      .map((item) => ({
        term: clipString(item?.term, 80),
        definition: clipString(item?.definition, 160),
      }))
      .filter((item) => item.term && item.definition)
      .slice(0, 5);

    const takeaways = (section.takeaways ?? [])
      .map((item) => clipString(item, 180))
      .filter(Boolean)
      .slice(0, 4);

    return {
      sectionId: clipString(section.sectionId, 48) || `section-${index + 1}`,
      title: clipString(section.title, 120) || `Section ${index + 1}`,
      explanation: clipString(section.explanation, 4000) || "Review the module concepts for this section.",
      workedExamples,
      checkInQuestion: {
        question: clipString(checkIn.question, 500) || "What is the main idea of this section?",
        type: "multipleChoice" as const,
        options,
        correctAnswer: clipString(checkIn.correctAnswer, 200) || options[0],
        explanation: clipString(checkIn.explanation, 500) || "Review the section explanation and worked example.",
      },
      keyTerms: keyTerms.length >= 2 ? keyTerms : [],
      takeaways: takeaways.length >= 2 ? takeaways : [],
    };
  });

  return {
    contentVersion: 1,
    sections: finalized,
    totalSections: finalized.length,
    estimatedMinutes: obj.estimatedMinutes ?? Math.max(8, finalized.length * 5),
  };
}

export function finalizeCardsOutput(raw: unknown, expectedCount: number) {
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

export function aiSchemaForAction(action: string) {
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

export function finalizeForAction(
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

export function questionCountRetrySuffix(count: number) {
  return `\n\nReturn EXACTLY ${count} questions in { questions: [...] }. Each needs stem, correctAnswer, and explanation. JSON only.`;
}

export const diagnosticQuestionAiSchema = questionAiSchema;

export function finalizeDiagnosticQuestion(
  q: z.infer<typeof questionAiSchema>,
  moduleId: string,
  index: number,
) {
  const finalized = finalizeQuestion(q, index, `diag-${moduleId}`);
  if (!finalized) return null;
  return { ...finalized, moduleId };
}
