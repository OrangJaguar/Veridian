import { parseDiagnosticSummary } from '@/utils/study/conceptPerformance';

const VARIANT_ORDER = ['verbatim', 'application', 'transfer'];

function resolveConceptLabel(conceptId, module) {
  const concepts = module?.knowledgeMap?.concepts ?? [];
  const match = concepts.find((c) => c.id === conceptId || c.conceptId === conceptId);
  return match?.name ?? match?.label ?? match?.term ?? conceptId;
}

/** Parse the per-module AI diagnostic blob (new data path). */
export function parseModuleDiagnosticSummary(module) {
  if (!module?.moduleDiagnosticSummary) return null;
  try {
    return JSON.parse(module.moduleDiagnosticSummary);
  } catch {
    return null;
  }
}

function moduleResultFromModule(mod) {
  const parsed = parseModuleDiagnosticSummary(mod);
  if (!parsed) return null;
  const applicationDepth = parsed.variantStats?.application != null
    && parsed.variantStats?.transfer != null
    ? Math.round((parsed.variantStats.application + parsed.variantStats.transfer) / 2)
    : parsed.accuracy ?? 0;
  return {
    moduleId: mod.moduleId,
    moduleName: mod.name,
    accuracy: parsed.accuracy ?? 0,
    assignedStage: parsed.assignedStage ?? mod.stage,
    failureSignals: parsed.failureSignals ?? [],
    weakestConceptId: parsed.weakestConceptId ?? null,
    variantStats: parsed.variantStats ?? {},
    applicationDepth,
    completedAt: parsed.completedAt ?? null,
    conceptPerformance: parsed.conceptPerformance ?? [],
  };
}

/** @deprecated Journey-wide diagnostic — kept for old journeys. */
export function getDiagnosticSummaryData(journey) {
  return parseDiagnosticSummary(journey);
}

export function getWeakestDiagnosticModule(journey, modules = []) {
  // Prefer per-module diagnostic summaries (new path).
  const perModuleResults = modules
    .map((mod) => {
      const result = moduleResultFromModule(mod);
      if (!result) return null;
      const signals = result.failureSignals ?? [];
      return {
        ...result,
        module: mod,
        score: result.applicationDepth - (signals.length * 15),
      };
    })
    .filter(Boolean);

  if (perModuleResults.length) {
    return [...perModuleResults].sort((a, b) => a.score - b.score)[0] ?? null;
  }

  // Backward compat: journey-wide diagnosticSummary on old journeys.
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
  const mod = modules.find((m) => m.moduleId === moduleId);

  // Per-module diagnostic (new path).
  const moduleResult = moduleResultFromModule(mod);
  if (moduleResult?.weakestConceptId) {
    return {
      conceptId: moduleResult.weakestConceptId,
      label: resolveConceptLabel(moduleResult.weakestConceptId, mod),
      failureSignal: moduleResult.failureSignals?.[0] ?? null,
    };
  }
  if (moduleResult?.conceptPerformance?.length) {
    const perf = moduleResult.conceptPerformance.find((c) =>
      c.untimedAttempts > 0 && c.untimedCorrect / c.untimedAttempts < 1,
    );
    if (perf) {
      return {
        conceptId: perf.conceptId,
        label: resolveConceptLabel(perf.conceptId, mod),
        failureSignal: null,
      };
    }
  }

  // Backward compat: journey-wide diagnosticSummary.
  const summary = parseDiagnosticSummary(journey);
  const journeyModuleResult = summary?.moduleResults?.find((r) => r.moduleId === moduleId);
  if (journeyModuleResult?.weakestConceptId) {
    return {
      conceptId: journeyModuleResult.weakestConceptId,
      label: resolveConceptLabel(journeyModuleResult.weakestConceptId, mod),
      failureSignal: journeyModuleResult.failureSignals?.[0] ?? null,
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
  const moduleResult = moduleResultFromModule(module);
  if (!moduleResult) {
    // Backward compat: journey-wide summary.
    const summary = parseDiagnosticSummary(journey);
    const journeyResult = summary?.moduleResults?.find((r) => r.moduleId === module.moduleId);
    if (!journeyResult) return [];
    const labels = [];
    if (journeyResult.weakestConceptId) {
      labels.push(resolveConceptLabel(journeyResult.weakestConceptId, module));
    }
    for (const signal of journeyResult.failureSignals ?? []) {
      if (signal === 'verbatimTrap') labels.push('surface recall');
      if (signal === 'transferFailure') labels.push('novel context');
      if (signal === 'pressureCollapse') labels.push('exam pressure');
    }
    return [...new Set(labels)].slice(0, limit);
  }

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

export function isFreshDiagnostic(journey, modules = []) {
  // Per-module: any module with a diagnostic completed in the last 24h.
  const recentModuleDiag = modules
    .map((mod) => moduleResultFromModule(mod))
    .filter((r) => r?.completedAt && (Date.now() - r.completedAt) < 24 * 60 * 60 * 1000);
  if (recentModuleDiag.length && !journey?.lastStudiedAt) return true;

  // Backward compat: journey-wide diagnostic.
  const summary = parseDiagnosticSummary(journey);
  if (!summary?.completedAt) return false;
  const hoursSince = (Date.now() - summary.completedAt) / (1000 * 60 * 60);
  return hoursSince < 24 && !journey.lastStudiedAt;
}

export { VARIANT_ORDER };
