import { generateDiagnosticQuestions } from '@/api/ai/study';
import { getActiveStudyAiTrace } from '@/utils/study/studyAiTrace';

/**
 * Generate diagnostic questions one module per API call (fits Base44 ~60s function limit).
 */
export async function generateDiagnosticQuestionsProgressive(basePayload, { onModule } = {}) {
  const { modules = [], questionsPerModule, ...rest } = basePayload;
  if (!modules.length) {
    throw new Error('Diagnostic requires at least one module.');
  }

  const allQuestions = [];

  for (let i = 0; i < modules.length; i += 1) {
    const mod = modules[i];
    const trace = getActiveStudyAiTrace();
    const moduleStart = Date.now();
    trace?.stepStart(`1b_module_${i}`, `Generate diagnostic for module ${i + 1}/${modules.length}`);

    try {
      const raw = await generateDiagnosticQuestions({
        ...rest,
        questionsPerModule,
        moduleIndex: i,
        moduleCount: modules.length,
        modules: [mod],
      });

      const questions = raw.questions ?? [];
      if (!questions.length) {
        throw new Error(`AI returned no questions for "${mod.name ?? mod.moduleId}". Try again.`);
      }

      allQuestions.push(...questions);
      trace?.stepOk(`1b_module_${i}`, `Generate diagnostic for module ${i + 1}/${modules.length}`, {
        moduleId: mod.moduleId,
        questionCount: questions.length,
      }, Date.now() - moduleStart);
      onModule?.(mod, i, modules.length);
    } catch (err) {
      trace?.stepFail(
        `1b_module_${i}`,
        `Generate diagnostic for module ${i + 1}/${modules.length}`,
        err,
        null,
        Date.now() - moduleStart,
      );
      throw err;
    }
  }

  return { questions: allQuestions };
}
