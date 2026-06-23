import { selectQuestionsFromBank } from '@/utils/study/sampleQuestionBank';
import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';
import { generatePracticeQuestions } from '@/api/ai/study';

const BASELINE_QUESTION_COUNT = 5;

/**
 * Build 5 baseline questions from question bank + AI fill if needed.
 */
export async function buildBaselineQuestions({
  questionBank = [],
  knowledgeMap,
  module,
  journey,
  needed = BASELINE_QUESTION_COUNT,
}) {
  const setupConfig = { questionCount: needed, focusPreset: 'fullReview' };
  const fromBank = selectQuestionsFromBank(questionBank, setupConfig);
  const questions = [...fromBank];
  const concepts = knowledgeMap?.concepts ?? module?.knowledgeMap?.concepts ?? [];

  if (questions.length < needed) {
    const aiCount = needed - questions.length;
    const raw = await generatePracticeQuestions({
      journeyTitle: journey?.title,
      subject: journey?.subject,
      moduleName: module?.name,
      moduleDescription: module?.description,
      moduleStage: module?.stage ?? 'A',
      concepts,
      questionCount: aiCount,
      focusPreset: 'fullReview',
      focusGuidance: 'Starting point baseline — broad coverage across module concepts.',
      weakConceptIds: [],
      avoidQuestionIds: questions.map((q) => q.id).filter(Boolean),
      avoidStemPreviews: questions.map((q) => q.stem?.slice(0, 80)).filter(Boolean),
      questionStyle: 'standard',
    });
    const aiQuestions = normalizeQuizQuestions(raw, aiCount);
    questions.push(...aiQuestions);
  }

  return questions.slice(0, needed).map((q) => ({
    ...q,
    difficultyEstimate: q.difficultyEstimate ?? q.difficulty ?? 'medium',
  }));
}

export { BASELINE_QUESTION_COUNT };
