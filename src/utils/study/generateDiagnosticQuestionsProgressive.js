import { generateDiagnosticQuestions } from '@/api/ai/study';
import { getActiveStudyAiTrace } from '@/utils/study/studyAiTrace';
import { runChunkedGeneration } from '@/utils/ai/chunkedGeneration';

/**
 * Generate diagnostic questions one module per API call (fits server time limits).
 */
export async function generateDiagnosticQuestionsProgressive(basePayload, {
  onModule,
  existingQuestions = [],
  startModuleIndex = 0,
} = {}) {
  const { modules = [], questionsPerModule, ...rest } = basePayload;
  if (!modules.length) {
    throw new Error('Diagnostic requires at least one module.');
  }

  const allQuestions = [...existingQuestions];
  const completedModules = Math.min(startModuleIndex, modules.length);

  await runChunkedGeneration({
    totalChunks: modules.length,
    existingResults: Array.from({ length: completedModules }, () => []),
    startIndex: completedModules,
    tracePrefix: '1b_module',
    trace: getActiveStudyAiTrace(),
    runChunk: async (index, _prior, signal) => {
      const mod = modules[index];
      const raw = await generateDiagnosticQuestions({
        ...rest,
        questionsPerModule,
        moduleIndex: index,
        moduleCount: modules.length,
        modules: [mod],
      }, { signal });

      const questions = raw.questions ?? [];
      if (!questions.length) {
        throw new Error(`AI returned no questions for "${mod.name ?? mod.moduleId}". Try again.`);
      }
      return questions;
    },
    mapResult: (questions) => questions,
    onChunkComplete: (questions, index, total) => {
      allQuestions.push(...questions);
      onModule?.(modules[index], index, total, allQuestions);
    },
  });

  return { questions: allQuestions };
}
