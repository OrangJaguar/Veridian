/**
 * Extract a named list from AI response payloads (handles nested { data: { items } }).
 */
const LIST_ALIASES = {
  questions: ['questions', 'items', 'problems'],
  sections: ['sections', 'chapters', 'parts'],
  cards: ['cards', 'flashcards', 'deck'],
};

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

export function extractAiField(data, field) {
  if (!data) return null;
  if (data[field] != null) return data[field];

  const aliases = LIST_ALIASES[field] ?? [field];
  for (const key of aliases) {
    if (key !== field && data[key] != null) return data[key];
  }

  if (data.data && typeof data.data === 'object') {
    const nested = data.data;
    if (nested[field] != null) return nested[field];
    for (const key of aliases) {
      if (nested[key] != null) return nested[key];
    }
  }
  return null;
}

export function extractAiList(data, field) {
  if (Array.isArray(data)) return data;
  const value = extractAiField(data, field);
  return Array.isArray(value) ? value : [];
}

function coerceQuestionItem(q, index) {
  const options = Array.isArray(q.options) ? q.options
    : Array.isArray(q.choices) ? q.choices
      : Array.isArray(q.answers) ? q.answers
        : undefined;
  const stem = q.stem ?? q.question ?? q.prompt ?? q.text ?? q.body ?? '';
  let correctAnswer = q.correctAnswer ?? q.answer ?? q.correct ?? q.solution;
  if (correctAnswer == null && Array.isArray(options) && options.length) {
    correctAnswer = options[0];
  }
  return {
    id: q.id ?? q.questionId ?? `q-${index + 1}`,
    type: q.type,
    stem: String(stem).trim(),
    options,
    correctAnswer,
    explanation: String(q.explanation ?? q.rationale ?? q.reason ?? '').trim(),
    conceptId: q.conceptId ?? q.concept ?? q.concept_id,
    moduleId: q.moduleId ?? q.module_id ?? q.module,
    moduleName: q.moduleName ?? q.module_name,
  };
}

function asWorkedExamplesArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
}

function coerceSectionItem(section, index) {
  const checkIn = section.checkInQuestion ?? section.checkIn ?? section.quiz ?? section.question ?? {};
  return {
    sectionId: section.sectionId ?? section.id ?? `section-${index + 1}`,
    title: String(section.title ?? section.name ?? section.heading ?? `Section ${index + 1}`).trim(),
    explanation: String(section.explanation ?? section.content ?? section.body ?? section.summary ?? section.text ?? '').trim(),
    workedExamples: asWorkedExamplesArray(
      section.workedExamples ?? section.examples ?? section.workedExample ?? section.example,
    ),
    checkInQuestion: {
      question: String(checkIn.question ?? checkIn.stem ?? checkIn.prompt ?? checkIn.text ?? '').trim(),
      type: checkIn.type,
      options: checkIn.options ?? checkIn.choices ?? checkIn.answers,
      correctAnswer: checkIn.correctAnswer ?? checkIn.answer ?? checkIn.correct,
      explanation: String(checkIn.explanation ?? checkIn.rationale ?? checkIn.reason ?? '').trim(),
    },
    keyTerms: section.keyTerms ?? [],
    takeaways: section.takeaways ?? [],
  };
}

function coerceCardItem(card) {
  return {
    front: String(card.front ?? card.term ?? card.question ?? card.prompt ?? '').trim(),
    back: String(card.back ?? card.definition ?? card.answer ?? card.meaning ?? '').trim(),
    conceptTag: card.conceptTag ?? card.concept ?? card.tag,
  };
}

/**
 * Mirror server-side coercePayloadForAction so client parsing survives alternate Gemini shapes.
 */
export function coerceStudyAiPayload(action, raw) {
  if (!raw) return raw;

  if (
    action === 'generatePracticeQuestions'
    || action === 'generateDiagnosticQuestions'
    || action === 'generateInterleavedQuestions'
    || action === 'generateJourneyChallenge'
    || action === 'generateCramSession'
  ) {
    if (Array.isArray(raw)) {
      return { questions: raw.map(coerceQuestionItem).filter((q) => q.stem) };
    }
    const obj = asRecord(raw);
    if (!obj) return raw;
    const questions = extractAiList(obj, 'questions').map(coerceQuestionItem).filter((q) => q.stem);
    return { ...obj, questions };
  }

  if (action === 'generateLearningGuide') {
    if (Array.isArray(raw)) {
      return { sections: raw.map(coerceSectionItem) };
    }
    const obj = asRecord(raw);
    if (!obj) return raw;
    let sections = extractAiList(obj, 'sections');
    for (const key of ['guide', 'learningGuide', 'content']) {
      const nested = asRecord(obj[key]);
      if (!sections.length && nested) sections = extractAiList(nested, 'sections');
    }
    return { ...obj, sections: sections.map(coerceSectionItem) };
  }

  if (action === 'generateFlashcards') {
    if (Array.isArray(raw)) {
      return { cards: raw.map(coerceCardItem).filter((c) => c.front && c.back) };
    }
    const obj = asRecord(raw);
    if (!obj) return raw;
    const cards = extractAiList(obj, 'cards').map(coerceCardItem).filter((c) => c.front && c.back);
    return { ...obj, cards };
  }

  return raw;
}

/**
 * Action-specific normalizers entry point — callers pass dedicated normalize fns.
 */
export const studyAiFields = {
  questions: (data) => extractAiList(data, 'questions'),
  sections: (data) => extractAiList(data, 'sections'),
  cards: (data) => extractAiList(data, 'cards'),
};
