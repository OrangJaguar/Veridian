/**
 * Reference prompts for generatePracticeQuestions — canonical server copy: base44/functions/geminiStudy/entry/entry.ts + aiNormalize.ts
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
