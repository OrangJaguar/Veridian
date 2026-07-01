/**
 * Reference prompts for generatePracticeQuestions — canonical server copy: base44/functions/geminiStudy/entry.ts
 * Questions are ephemeral per session (sessionData); dedup registry lives on activity.content.quizRegistry.
 */

export const FOCUS_PRESETS = ['fullReview', 'weakSpots', 'newMaterial'];

export const PRACTICE_QUIZ_SYSTEM = `You are an expert exam-prep question writer for Veridian.

Generate fresh practice quiz questions for ONE module within a larger journey. Questions must test understanding — not trivia or trick wording.

Rules:
- Output ONLY valid JSON. No markdown.
- Use $...$ inline and $$...$$ block for math when needed.
- Generate EXACTLY questionCount questions — no more, no less.
- Every question MUST include conceptId from the provided concepts list.
- Each question needs a unique id (short slug + index, e.g. pq-loss-1).
- NEVER repeat or lightly rephrase any item in avoidQuestionIds or avoidStemPreviews.
- Vary question types: mostly multipleChoice (4 options), some trueFalse, occasional shortAnswer when it fits.
- multipleChoice: exactly 4 plausible options; one clearly correct; distractors = common misconceptions.
- Include a concise explanation (1–2 sentences) for each question.
- Stay within the module concepts — do not drift to other modules.
- Be token-efficient in stems — clear and specific, no filler.`;

const FOCUS_GUIDANCE = {
  fullReview:
    'Cover ALL module concepts evenly. Mix recall, application, and one-step reasoning. Rotate across concepts — do not cluster on one topic.',
  weakSpots:
    'At least 60% of questions must target the listed weakConceptIds. If none listed, behave like Full Review.',
  newMaterial:
    'Prioritize concepts with low coverage in avoidStemPreviews / underrepresented conceptIds. Favor angles not yet tested. Still include some review of core concepts.',
};

export function focusGuidanceForPreset(focusPreset, { weakConceptIds = [] } = {}) {
  if (focusPreset === 'weakSpots' && weakConceptIds.length > 0) {
    return `${FOCUS_GUIDANCE.weakSpots} Weak concepts: ${weakConceptIds.join(', ')}.`;
  }
  if (focusPreset === 'weakSpots') {
    return 'No weak spots recorded yet — treat as Full Review across all concepts evenly.';
  }
  if (focusPreset === 'newMaterial') {
    return FOCUS_GUIDANCE.newMaterial;
  }
  return FOCUS_GUIDANCE.fullReview;
}

export function difficultyForModuleStage(stage) {
  if (stage === 'C') return 'Exam-level: multi-step reasoning, edge cases, synthesis within the module.';
  if (stage === 'B') return 'Intermediate: apply concepts in unfamiliar contexts; plausible distractors.';
  return 'Foundational: core definitions and straightforward applications — still require understanding, not guesswork.';
}

export function buildPracticeQuizUserPrompt({
  journeyTitle,
  subject,
  moduleName,
  moduleDescription,
  moduleStage = 'B',
  concepts = [],
  questionCount = 10,
  focusPreset = 'fullReview',
  focusGuidance,
  weakConceptIds = [],
  avoidQuestionIds = [],
  avoidStemPreviews = [],
  questionStyle = 'standard',
}) {
  return JSON.stringify({
    task: 'generatePracticeQuestions',
    journeyTitle,
    subject,
    moduleName,
    moduleDescription,
    moduleStage,
    difficulty: difficultyForModuleStage(moduleStage),
    questionCount,
    focusPreset,
    focusGuidance: focusGuidance ?? focusGuidanceForPreset(focusPreset, { weakConceptIds }),
    weakConceptIds,
    concepts,
    avoidQuestionIds: avoidQuestionIds.slice(0, 40),
    avoidStemPreviews: avoidStemPreviews.slice(0, 40),
    questionStyle,
    outputSchema: {
      questions: [{
        id: 'string unique',
        type: 'multipleChoice | trueFalse | shortAnswer',
        stem: 'string',
        options: ['4 strings for multipleChoice'],
        correctAnswer: 'string or array for multi-select',
        explanation: 'string',
        conceptId: 'string from concepts',
      }],
    },
  });
}

export const PRACTICE_QUIZ_RETRY_SUFFIX =
  '\n\nPrevious response failed validation. Return EXACTLY questionCount questions with unique ids, valid conceptIds, and 4 options for multipleChoice. JSON only.';

export const AP_STYLE_INSTRUCTION = `Generate all questions in authentic AP exam style. AP questions are precise, analytical, and often scenario-based or stimulus-based — they present a specific situation, data set, experiment description, experimental result, passage excerpt, or diagram description before asking the student to analyze, evaluate, or apply a concept. Questions do not test simple recall of definitions. Instead they require the student to apply understanding to novel situations, justify claims with evidence, reason through cause and effect, evaluate the validity of an argument or claim, interpret data or graphs described in text form, or connect concepts across the subject. Answer choices in AP questions are all plausible and substantively similar in length and structure — wrong answers represent common misconceptions or partially correct reasoning, not obviously wrong distractors. The correct answer requires precise understanding, not elimination by process of obvious incorrectness. Question stems use formal academic language and precise subject-specific vocabulary. Multi-part reasoning is common: a stem may ask which of the following best explains, best justifies, best supports, or is most consistent with a given claim or observation. Avoid question stems that begin with 'What is' or 'Define' — instead use 'Which of the following best explains', 'A student observes X, which of the following conclusions is best supported', 'Based on the information given, which of the following', or 'Which of the following best justifies the claim that.' All questions should feel like they belong on an official AP Progress Check or exam regardless of which subject or topic is being tested.`;
