import { parseDiagnosticSummary } from '@/utils/study/conceptPerformance';

const VARIANT_ORDER = ['verbatim', 'application', 'transfer'];

function resolveConceptLabel(conceptId, module) {
  const concepts = module?.knowledgeMap?.concepts ?? [];
  const match = concepts.find((c) => c.id === conceptId || c.conceptId === conceptId);
  return match?.name ?? match?.label ?? match?.term ?? conceptId;
}

export function getDiagnosticSummaryData(journey) {
  return parseDiagnosticSummary(journey);
}

export function getWeakestDiagnosticModule(journey, modules = []) {
  const summary = parseDiagnosticSummary(journey);
  if (!summary?.moduleResults?.length) return null;

  const moduleById = Object.fromEntries(modules.map((m) => [m.moduleId, m]));
  const ranked = [...summary.moduleResults].map((result) => {
    const signals = result.failureSignals ?? [];
    const applicationDepth = result.applicationDepth ?? result.accuracy ?? 0;
    return {
      ...result,
      module: moduleById[result.moduleId],
      score: applicationDepth - (signals.length * 15),
    };
  }).sort((a, b) => a.score - b.score);

  return ranked[0] ?? null;
}

export function getWeakestConcept(journey, moduleId, modules = []) {
  const summary = parseDiagnosticSummary(journey);
  const mod = modules.find((m) => m.moduleId === moduleId);
  const moduleResult = summary?.moduleResults?.find((r) => r.moduleId === moduleId);
  if (moduleResult?.weakestConceptId) {
    return {
      conceptId: moduleResult.weakestConceptId,
      label: resolveConceptLabel(moduleResult.weakestConceptId, mod),
      failureSignal: moduleResult.failureSignals?.[0] ?? null,
    };
  }

  const perf = (summary?.conceptPerformance ?? []).find((c) =>
    c.untimedAttempts > 0 && c.untimedCorrect / c.untimedAttempts < 1,
  );
  if (perf) {
    return {
      conceptId: perf.conceptId,
      label: resolveConceptLabel(perf.conceptId, mod),
      failureSignal: null,
    };
  }
  return null;
}

export function failureModeToActivity(failureSignal, stage = 'A') {
  switch (failureSignal) {
    case 'verbatimTrap':
      return stage === 'A' ? 'learningGuide' : 'feynman';
    case 'transferFailure':
      return 'practiceQuiz';
    case 'pressureCollapse':
      return 'practiceQuiz';
    case 'conceptualGap':
      return 'learningGuide';
    default:
      return stage === 'A' ? 'learningGuide' : 'practiceQuiz';
  }
}

export function getDiagnosticWeakConceptLabels(journey, module, limit = 3) {
  const summary = parseDiagnosticSummary(journey);
  const moduleResult = summary?.moduleResults?.find((r) => r.moduleId === module.moduleId);
  if (!moduleResult) return [];

  const labels = [];
  if (moduleResult.weakestConceptId) {
    labels.push(resolveConceptLabel(moduleResult.weakestConceptId, module));
  }
  for (const signal of moduleResult.failureSignals ?? []) {
    if (signal === 'verbatimTrap') labels.push('surface recall');
    if (signal === 'transferFailure') labels.push('novel context');
    if (signal === 'pressureCollapse') labels.push('exam pressure');
  }
  return [...new Set(labels)].slice(0, limit);
}

export function isFreshDiagnostic(journey) {
  const summary = parseDiagnosticSummary(journey);
  if (!summary?.completedAt) return false;
  const hoursSince = (Date.now() - summary.completedAt) / (1000 * 60 * 60);
  return hoursSince < 24 && !journey.lastStudiedAt;
}

export { VARIANT_ORDER };
