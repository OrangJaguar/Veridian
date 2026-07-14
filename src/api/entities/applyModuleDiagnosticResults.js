import { updateModule } from '@/api/entities/modules';
import { ingestDiagnosticEvidence } from '@/api/entities/failureEvidence';
import { rebuildGlobalPlan } from '@/api/entities/globalPlan';

/**
 * Persist the optional per-module AI diagnostic outcome onto the module itself.
 * Replaces the journey-wide diagnosticSummary blob for new data.
 */
export async function applyModuleDiagnosticResults(module, placement, sessionId) {
  const result = placement?.moduleResults?.find((r) => r.moduleId === module.moduleId);
  if (!result) return null;

  const patch = {
    stage: result.assignedStage,
    masteryScore: result.masteryScore,
    moduleDiagnosticSummary: JSON.stringify({
      completedAt: Date.now(),
      sessionId,
      accuracy: result.accuracy,
      assignedStage: result.assignedStage,
      variantStats: result.variantStats ?? {},
      failureSignals: result.failureSignals ?? [],
      weakestConceptId: result.weakestConceptId ?? null,
      conceptPerformance: placement.conceptPerformance ?? [],
    }),
  };

  // baselineScore is set once, never overwritten.
  if (module.baselineScore == null) {
    patch.baselineScore = result.accuracy;
    patch.baselineCapturedAt = Date.now();
  }

  const updated = await updateModule(module.moduleId, patch);

  try {
    await ingestDiagnosticEvidence({
      module: { ...module, ...patch },
      placement,
      sessionId,
    });
  } catch {
    /* best effort evidence capture */
  }

  try {
    await rebuildGlobalPlan({ force: true });
  } catch {
    /* best effort plan refresh after baseline */
  }

  return updated;
}
