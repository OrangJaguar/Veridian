import { z } from "npm:zod";

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
  stem: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: coercedAnswerSchema,
  explanation: z.string().optional(),
  conceptId: z.string().optional(),
  moduleId: z.string().optional(),
});

export const questionsAiOutputSchema = z.object({
  questions: z.array(questionAiSchema).min(1).max(52),
});

export const guideSectionAiSchema = z.object({
  sectionId: z.string().optional(),
  title: z.string().min(1),
  explanation: z.string().min(1),
  workedExamples: z.array(z.object({
    scenario: z.string().optional(),
    steps: z.array(z.string()).optional(),
    answer: z.string().optional(),
    reasoning: z.string().optional(),
  })).optional(),
  checkInQuestion: z.object({
    question: z.string().optional(),
    type: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    explanation: z.string().optional(),
  }).optional(),
  externalSearchSuggestions: z.array(z.string()).optional(),
  transitionText: z.string().optional(),
});

export const guideAiOutputSchema = z.object({
  sections: z.array(guideSectionAiSchema).min(1).max(8),
  totalSections: z.number().optional(),
  estimatedMinutes: z.number().optional(),
});

export const cardAiSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
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

  return trimmed;
}

export function finalizeQuestion(
  q: z.infer<typeof questionAiSchema>,
  index: number,
  prefix = "q",
) {
  const type = q.type === "trueFalse" || q.type === "shortAnswer" ? q.type : "multipleChoice";
  let options = q.options;
  if (type === "trueFalse") {
    options = ["True", "False"];
  } else if (type === "multipleChoice") {
    options = [...(options ?? [])].map((o) => String(o).trim()).filter(Boolean);
    while (options.length < 4) options.push(`Option ${options.length + 1}`);
    options = options.slice(0, 4);
  }

  return {
    id: String(q.id ?? `${prefix}-${index + 1}`).trim(),
    type,
    stem: String(q.stem).trim(),
    options,
    correctAnswer: q.correctAnswer,
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
    .map((q, index) => finalizeQuestion(q, index, "q"));

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
        question: clipString(checkIn.question, 500) || "What is the main idea of this section?",
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
  return { ...finalizeQuestion(q, index, `diag-${moduleId}`), moduleId };
}
