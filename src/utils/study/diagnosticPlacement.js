export const DIAGNOSTIC_QUESTIONS_PER_MODULE = 3;

const PRIOR_KNOWLEDGE_DIFFICULTY = {
  scratch: 'foundational but non-trivial — test whether the student truly understands core definitions and simple applications, not obscure trivia',
  some: 'intermediate — require applying concepts in unfamiliar contexts; distractors must reflect common misconceptions',
  most: 'advanced — require multi-step reasoning, edge cases, and synthesis; avoid questions answerable by elimination alone',
};

export function difficultyGuidanceForPriorKnowledge(priorKnowledge) {
  return PRIOR_KNOWLEDGE_DIFFICULTY[priorKnowledge] ?? PRIOR_KNOWLEDGE_DIFFICULTY.some;
}

/**
 * Validate that AI returned exactly N tagged questions per module.
 */
export function validateDiagnosticQuestions(questions, modules, perModule = DIAGNOSTIC_QUESTIONS_PER_MODULE) {
  if (!Array.isArray(questions) || !Array.isArray(modules)) {
    return { valid: false, message: 'Invalid diagnostic question set.' };
  }

  const counts = Object.fromEntries(modules.map((m) => [m.moduleId, 0]));
  for (const q of questions) {
    if (!q?.moduleId || counts[q.moduleId] == null) {
      return { valid: false, message: 'Each diagnostic question must include a valid moduleId tag.' };
    }
    counts[q.moduleId] += 1;
  }

  for (const mod of modules) {
    if (counts[mod.moduleId] !== perModule) {
      return {
        valid: false,
        message: `Expected ${perModule} questions for "${mod.name}", got ${counts[mod.moduleId]}.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Interleave questions so modules are mixed — reduces pattern guessing.
 */
export function interleaveDiagnosticQuestions(questions, modules) {
  const byModule = Object.fromEntries(modules.map((m) => [m.moduleId, []]));
  for (const q of questions) {
    byModule[q.moduleId]?.push(q);
  }

  const interleaved = [];
  for (let i = 0; i < DIAGNOSTIC_QUESTIONS_PER_MODULE; i += 1) {
    for (const mod of modules) {
      const bucket = byModule[mod.moduleId];
      if (bucket?.[i]) interleaved.push(bucket[i]);
    }
  }
  return interleaved;
}

/**
 * Assign module stage and initial mastery from tagged diagnostic answers.
 * All 3 correct → Stage B; otherwise Stage A.
 */
export function computeDiagnosticPlacement(questions, answers, modules) {
  const answerByQuestionId = {};
  for (const ans of answers) {
    if (ans?.questionId) answerByQuestionId[ans.questionId] = ans;
  }

  const moduleNameById = Object.fromEntries(modules.map((m) => [m.moduleId, m.name]));

  const moduleResults = modules.map((mod) => {
    const moduleQuestions = questions.filter((q) => q.moduleId === mod.moduleId);
    const total = moduleQuestions.length;
    const correct = moduleQuestions.filter((q) => answerByQuestionId[q.id]?.correct).length;
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const assignedStage = correct === total && total >= DIAGNOSTIC_QUESTIONS_PER_MODULE ? 'B' : 'A';

    return {
      moduleId: mod.moduleId,
      moduleName: moduleNameById[mod.moduleId] ?? mod.name,
      correct,
      total,
      accuracy,
      assignedStage,
      masteryScore: accuracy,
    };
  });

  const gradedCount = answers.filter((a) => a && !a.skipped).length;
  const correctCount = answers.filter((a) => a?.correct).length;
  const overallAccuracy = gradedCount ? Math.round((correctCount / gradedCount) * 100) : 0;

  return {
    moduleResults,
    overallAccuracy,
    stageBCount: moduleResults.filter((r) => r.assignedStage === 'B').length,
    stageACount: moduleResults.filter((r) => r.assignedStage === 'A').length,
  };
}

export function buildDiagnosticSummary(placement, sessionId) {
  return JSON.stringify({
    completedAt: Date.now(),
    sessionId,
    overallAccuracy: placement.overallAccuracy,
    stageBCount: placement.stageBCount,
    stageACount: placement.stageACount,
    moduleResults: placement.moduleResults,
  });
}
