import { updateJourney } from '@/api/entities/journeys';
import { updateModule } from '@/api/entities/modules';
import { buildDiagnosticSummary } from '@/utils/study/diagnosticPlacement';

/**
 * Persist diagnostic placement: module stages, mastery scores, and journey summary.
 */
export async function applyDiagnosticResults(journeyId, placement, sessionId) {
  const { getModule } = await import('@/api/entities/modules');

  await Promise.all(
    placement.moduleResults.map(async (result) => {
      const mod = await getModule(result.moduleId);
      const patch = {
        stage: result.assignedStage,
        masteryScore: result.masteryScore,
      };
      if (mod && mod.baselineScore == null && !mod.baselineSkipped) {
        patch.baselineScore = result.masteryScore;
        patch.baselineCapturedAt = Date.now();
      }
      return updateModule(result.moduleId, patch);
    }),
  );

  return updateJourney(journeyId, {
    diagnosticSkipped: false,
    diagnosticSummary: buildDiagnosticSummary(placement, sessionId),
  });
}
